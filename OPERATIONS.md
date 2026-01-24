# Performance, Scalability & Operations

This document addresses questions 12-25 covering performance, error handling, testing, and deployment.

---

## Performance & Scalability

### 12. Reducing Unnecessary API Calls

**Current Implementation:**
- API calls only triggered on explicit user action (form submit)
- No duplicate calls during loading state

**Optimization Strategies:**

```typescript
// 1. Debouncing for search-as-you-type (if implemented)
import { useDebouncedCallback } from 'use-debounce';

const debouncedTrack = useDebouncedCallback(
  (trackingNumber) => fetchTrackingData(trackingNumber),
  500
);

// 2. Request deduplication
const pendingRequests = new Map<string, Promise<any>>();

async function fetchWithDedup(key: string, fetcher: () => Promise<any>) {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }
  const promise = fetcher();
  pendingRequests.set(key, promise);
  promise.finally(() => pendingRequests.delete(key));
  return promise;
}

// 3. Conditional fetching
const shouldFetch = trackingNumber.length >= 10; // Minimum valid length
```

### 13. Caching Strategies

```typescript
// 1. Client-side caching with React Query (already using @tanstack/react-query)
const { data } = useQuery({
  queryKey: ['tracking', trackingNumber],
  queryFn: () => fetchTracking(trackingNumber),
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 30 * 60 * 1000, // 30 minutes
});

// 2. Edge Function response caching
const cacheControl = {
  'Cache-Control': 'public, max-age=300', // 5 min cache for quotes
};

// 3. Redis/KV store for server-side caching
// Cache tracking results for 2 minutes (data changes frequently)
const cached = await kv.get(`tracking:${trackingNumber}`);
if (cached) return cached;

const result = await fetchFromAPI();
await kv.set(`tracking:${trackingNumber}`, result, { ex: 120 });

// 4. Quote caching (longer TTL - prices change less frequently)
// Cache for 1 hour per unique combination
const quoteKey = `quote:${rfCode}:${suburb}:${postalCode}:${weight}`;
```

### 14. Scaling Strategy

#### 100 Users per Day

Current architecture handles this easily:
- Serverless edge functions scale automatically
- No infrastructure changes needed
- Free tier limits sufficient

#### 10,000 Users per Day

**Required Changes:**

| Component | Current | Scaled |
|-----------|---------|--------|
| Edge Functions | Default instance | Increased memory/timeout |
| Caching | None | Redis/KV with 5-min TTL |
| CDN | None | Cloudflare/Vercel Edge |
| Monitoring | Console logs | APM (DataDog/Sentry) |
| Rate Limiting | None | Per-IP limiting |

```typescript
// Connection pooling for high throughput
const pool = new ConnectionPool({
  maxConnections: 50,
  idleTimeout: 30000,
});

// Queue for burst handling
const queue = new TaskQueue({
  concurrency: 10,
  retries: 3,
});
```

### 15. Microservices Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        API Gateway                          │
│                   (Rate Limiting, Auth)                     │
└─────────────────────┬───────────────────┬───────────────────┘
                      │                   │
         ┌────────────▼────────┐ ┌────────▼────────────┐
         │  Tracking Service   │ │    Quote Service    │
         │  (/api/tracking)    │ │    (/api/quote)     │
         └────────────┬────────┘ └────────┬────────────┘
                      │                   │
         ┌────────────▼────────┐ ┌────────▼────────────┐
         │  Fastway Adapter    │ │   Cache Service     │
         │                     │ │      (Redis)        │
         └─────────────────────┘ └─────────────────────┘
```

**Service Boundaries:**

```typescript
// tracking-service/index.ts
export class TrackingService {
  async track(number: string): Promise<TrackingResult> {
    // Single responsibility: tracking operations
  }
}

// quote-service/index.ts
export class QuoteService {
  async calculate(params: QuoteParams): Promise<QuoteResult> {
    // Single responsibility: quote operations
  }
}

// Communication via message queue
const messageQueue = new MessageQueue('rabbitmq://...');
await messageQueue.publish('tracking.requested', { trackingNumber });
```

---

## Error Handling & Logging

### 16. Error Handling Implementation

**Current Implementation:**

```typescript
// Edge Function - Structured error handling
try {
  const result = await fetchFromAPI();
  return new Response(JSON.stringify(result), { status: 200 });
} catch (error) {
  console.error('Error tracking parcel:', error);
  
  // User-friendly message, not raw error
  const errorMessage = error instanceof Error 
    ? error.message 
    : 'Failed to track parcel';
    
  return new Response(
    JSON.stringify({ success: false, error: errorMessage }),
    { status: 500 }
  );
}

// Frontend - Graceful error display
{error && (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Tracking Error</AlertTitle>
    <AlertDescription>{error}</AlertDescription>
  </Alert>
)}
```

### 17. Centralized Error Logging

```typescript
// error-logger.ts - Centralized logging service
interface ErrorLog {
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  message: string;
  context: Record<string, any>;
  stack?: string;
}

class ErrorLogger {
  private endpoint: string;
  
  async log(error: Error, context: Record<string, any> = {}) {
    const log: ErrorLog = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message: error.message,
      context: {
        ...context,
        userAgent: navigator.userAgent,
        url: window.location.href,
      },
      stack: error.stack,
    };
    
    // Send to logging service
    await fetch(this.endpoint, {
      method: 'POST',
      body: JSON.stringify(log),
    });
    
    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(log);
    }
  }
}

// Usage
const logger = new ErrorLogger();
logger.log(error, { trackingNumber, userId });
```

### 18. API Failure Monitoring

```typescript
// Production monitoring setup
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
});

// Health check endpoint
Deno.serve(async (req) => {
  if (req.url.endsWith('/health')) {
    try {
      // Test API connectivity
      const response = await fetch('https://sa.api.fastway.org/health');
      if (!response.ok) throw new Error('Fastway API unhealthy');
      
      return new Response(JSON.stringify({ status: 'healthy' }));
    } catch {
      return new Response(JSON.stringify({ status: 'degraded' }), { status: 503 });
    }
  }
});

// Metric collection
const metrics = {
  apiCalls: new Counter('fastway_api_calls_total'),
  apiErrors: new Counter('fastway_api_errors_total'),
  apiLatency: new Histogram('fastway_api_latency_seconds'),
};
```

### 19. Administrator Alerting

```typescript
// Alert configuration
interface AlertConfig {
  channels: ('email' | 'slack' | 'sms')[];
  thresholds: {
    errorRate: number; // errors per minute
    latency: number;   // ms
    downtime: number;  // consecutive failures
  };
}

// Alert service
class AlertService {
  async checkAPIHealth() {
    const failures = await this.getRecentFailures(5); // Last 5 minutes
    
    if (failures.count > 10) {
      await this.sendAlert({
        severity: 'critical',
        title: 'Fastway API Unavailable',
        message: `${failures.count} failures in last 5 minutes`,
        channels: ['slack', 'email', 'sms'],
      });
    }
  }
  
  async sendAlert(alert: Alert) {
    // Slack webhook
    await fetch(process.env.SLACK_WEBHOOK, {
      method: 'POST',
      body: JSON.stringify({
        text: `🚨 ${alert.severity.toUpperCase()}: ${alert.title}\n${alert.message}`,
      }),
    });
    
    // Email via SendGrid/Postmark
    // SMS via Twilio
  }
}
```

---

## Testing Strategy

### 20. Testing Approach

**Testing Pyramid:**

```
        ╱╲
       ╱  ╲      E2E Tests (Playwright)
      ╱────╲     - Full user flows
     ╱      ╲
    ╱────────╲   Integration Tests
   ╱          ╲  - API integration
  ╱────────────╲ - Component + API
 ╱              ╲
╱────────────────╲ Unit Tests (Vitest)
                   - Functions
                   - Utilities
                   - Components
```

| Layer | Tool | Coverage Target |
|-------|------|-----------------|
| Unit | Vitest | 80% |
| Integration | Vitest + MSW | 60% |
| E2E | Playwright | Critical paths |

### 21. Testing Without Real API

```typescript
// Mock Service Worker (MSW) for API mocking
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const handlers = [
  rest.get('https://sa.api.fastway.org/latest/tracktrace/detail/:id', (req, res, ctx) => {
    const { id } = req.params;
    
    // Return mock data
    return res(ctx.json({
      result: {
        LabelNumber: id,
        HasDScan: true,
        DeliveryETADate: '20/05/2024',
        Scans: [
          {
            Description: 'Delivered',
            Date: '16/05/2024 08:03:14',
            StatusDescription: 'Package delivered',
            Franchise: 'JNB',
          },
        ],
      },
    }));
  }),
  
  rest.get('https://sa.api.fastway.org/latest/psc/lookup', (req, res, ctx) => {
    return res(ctx.json({
      result: {
        services: [
          { name: 'Road-5', totalprice_normal: 109.25, type: 'Parcel' },
          { name: 'Express', totalprice_normal: 189.00, type: 'Express' },
        ],
        delivery_timeframe_days: '2 to 4',
      },
    }));
  }),
];

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### 22. Unit Test Example

```typescript
// src/test/quote-validation.test.ts
import { describe, it, expect } from 'vitest';

// Function to test
function validateQuoteForm(data: { suburb: string; postalCode: string; weight: string }) {
  if (!data.suburb.trim()) return "Please enter a destination suburb";
  if (!data.postalCode.trim()) return "Please enter a postal code";
  if (!data.weight.trim() || parseFloat(data.weight) <= 0) {
    return "Please enter a valid weight";
  }
  return null;
}

describe('Quote Form Validation', () => {
  it('should return error for empty suburb', () => {
    const result = validateQuoteForm({
      suburb: '',
      postalCode: '8001',
      weight: '2.5',
    });
    expect(result).toBe('Please enter a destination suburb');
  });

  it('should return error for empty postal code', () => {
    const result = validateQuoteForm({
      suburb: 'Cape Town',
      postalCode: '   ',
      weight: '2.5',
    });
    expect(result).toBe('Please enter a postal code');
  });

  it('should return error for invalid weight', () => {
    const result = validateQuoteForm({
      suburb: 'Cape Town',
      postalCode: '8001',
      weight: '-1',
    });
    expect(result).toBe('Please enter a valid weight');
  });

  it('should return error for zero weight', () => {
    const result = validateQuoteForm({
      suburb: 'Cape Town',
      postalCode: '8001',
      weight: '0',
    });
    expect(result).toBe('Please enter a valid weight');
  });

  it('should return null for valid input', () => {
    const result = validateQuoteForm({
      suburb: 'Cape Town',
      postalCode: '8001',
      weight: '2.5',
    });
    expect(result).toBeNull();
  });
});
```

---

## Deployment & DevOps

### 23. Production Deployment

**Current Stack (Lovable Cloud):**
```bash
# Automatic deployment on push
git push origin main  # Triggers automatic build & deploy
```

**Alternative Production Setup:**

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 512M
```

**Kubernetes Deployment:**

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fastway-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: fastway
  template:
    spec:
      containers:
        - name: app
          image: fastway-app:latest
          ports:
            - containerPort: 3000
          resources:
            requests:
              memory: "256Mi"
            limits:
              memory: "512Mi"
```

### 24. Environment Variables

```bash
# .env.production
# Application
NODE_ENV=production
VITE_APP_URL=https://courier.fastway.co.za

# Supabase (auto-configured in Lovable)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Edge Function Secrets (stored in Supabase dashboard)
FASTWAY_API_KEY=your-production-api-key

# Monitoring (optional)
SENTRY_DSN=https://xxx@sentry.io/xxx
DATADOG_API_KEY=xxx

# Feature Flags
ENABLE_CACHING=true
CACHE_TTL_SECONDS=300
```

### 25. CI/CD Implementation

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run type check
        run: npm run typecheck
      
      - name: Run tests
        run: npm run test
      
      - name: Build
        run: npm run build

  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Staging
        run: |
          # Deploy to staging environment
          curl -X POST ${{ secrets.STAGING_DEPLOY_HOOK }}

  deploy-production:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to Production
        run: |
          # Deploy to production environment
          curl -X POST ${{ secrets.PRODUCTION_DEPLOY_HOOK }}
      
      - name: Notify Slack
        run: |
          curl -X POST -H 'Content-type: application/json' \
            --data '{"text":"✅ Production deployment complete"}' \
            ${{ secrets.SLACK_WEBHOOK }}
```

**Pipeline Stages:**

```
┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
│  Lint   │ → │  Test   │ → │  Build  │ → │ Staging │ → │  Prod   │
└─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘
     ↓             ↓             ↓             ↓             ↓
   ESLint      Vitest       Vite build    Auto-deploy   Manual gate
  TypeScript   Coverage     Optimize      Smoke tests   Approval req
```
