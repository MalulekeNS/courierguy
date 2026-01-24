# Architecture & Design Documentation

This document addresses the senior-level architecture and design questions for the Fastway Courier integration assessment.

---

## 1. Project Structure

### Directory Organization

```
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/              # Base UI components (shadcn/ui)
│   │   ├── Layout.tsx       # Page layout wrapper
│   │   ├── Navbar.tsx       # Navigation component
│   │   ├── FeatureCard.tsx  # Feature display component
│   │   └── LoadingSpinner.tsx
│   ├── pages/               # Page-level components (routes)
│   │   ├── Index.tsx        # Home/Dashboard
│   │   ├── TrackParcel.tsx  # Tracking feature
│   │   ├── GetQuote.tsx     # Quote feature
│   │   └── NotFound.tsx     # 404 page
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility functions
│   └── integrations/        # External service integrations
├── supabase/
│   └── functions/           # Edge functions (API proxy layer)
│       ├── fastway-track/   # Tracking API proxy
│       └── fastway-quote/   # Quote API proxy
```

### Why This Structure?

1. **Separation of Concerns**: Each directory has a single responsibility
2. **Scalability**: Easy to add new features without affecting existing code
3. **Maintainability**: Related code is grouped together
4. **Security**: API keys are isolated in edge functions, never exposed to frontend

### Data Persistence Layer

The application includes a SQLite database for logging form submissions:

```
├── database/
│   ├── init.php           # PDO connection and table initialization
│   ├── .htaccess          # Web access protection
│   └── database.sqlite    # Auto-generated on first request
```

**Database Schema:**

```sql
-- Tracking searches log
CREATE TABLE tracking_searches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tracking_number TEXT NOT NULL,
    has_result INTEGER DEFAULT 0,
    result_status TEXT,
    ip_address TEXT,
    user_agent TEXT,
    search_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Quote requests log
CREATE TABLE quote_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    suburb TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    rf_code TEXT DEFAULT 'JNB',
    weight REAL NOT NULL,
    services_count INTEGER DEFAULT 0,
    cheapest_price REAL,
    ip_address TEXT,
    user_agent TEXT,
    request_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

The database file is auto-created by PDO when the first request is made. No manual setup required.

---

## 2. Separation of Layers

### Business Logic

Located in: **Page components** (`src/pages/`) and **Edge functions** (`supabase/functions/`)

- Form validation logic in page components
- Data transformation and API response handling in edge functions
- Price formatting and display logic

```typescript
// Example: Business logic for validation
const validateForm = () => {
  if (!formData.suburb.trim()) return "Please enter a destination suburb";
  if (!formData.postalCode.trim()) return "Please enter a postal code";
  if (!formData.weight.trim() || parseFloat(formData.weight) <= 0) {
    return "Please enter a valid weight";
  }
  return null;
};
```

### API Integration

Located in: **Edge Functions** (`supabase/functions/`)

The API integration is completely isolated in edge functions, providing:
- Secure API key storage
- CORS handling
- Error transformation
- Request/response logging

```typescript
// Edge function handles all API communication
const response = await fetch(
  `https://sa.api.fastway.org/latest/tracktrace/detail/${trackingNumber}?api_key=${apiKey}`
);
```

### Presentation/UI Code

Located in: **Components** (`src/components/`) and **Pages** (`src/pages/`)

- Reusable UI components in `src/components/ui/`
- Feature-specific components in `src/components/`
- Page layouts combine components with business logic

---

## 3. Supporting Multiple Courier Providers

To support multiple courier providers, I would implement a **Provider Pattern** with a common interface:

### Proposed Architecture

```
├── supabase/functions/
│   ├── courier-track/           # Unified tracking endpoint
│   │   ├── index.ts             # Route to correct provider
│   │   └── providers/
│   │       ├── interface.ts     # Common provider interface
│   │       ├── fastway.ts       # Fastway implementation
│   │       ├── dhl.ts           # DHL implementation
│   │       └── fedex.ts         # FedEx implementation
```

### Provider Interface

```typescript
interface CourierProvider {
  name: string;
  track(trackingNumber: string): Promise<TrackingResult>;
  getQuote(params: QuoteParams): Promise<QuoteResult>;
  validateTrackingNumber(number: string): boolean;
}

// Common response format
interface TrackingResult {
  status: string;
  events: TrackingEvent[];
  estimatedDelivery?: Date;
  currentLocation?: string;
}
```

### Provider Factory

```typescript
class CourierFactory {
  static getProvider(trackingNumber: string): CourierProvider {
    if (trackingNumber.startsWith('Z')) return new FastwayProvider();
    if (trackingNumber.startsWith('1Z')) return new UPSProvider();
    // Auto-detect based on tracking number format
  }
}
```

---

## 4. Handling Future API Changes

### Strategy: Adapter Pattern

To minimize code impact from API changes, implement an **Adapter Layer**:

```
[Frontend] → [Edge Function] → [Adapter] → [Fastway API]
                                   ↓
                            [Normalized Response]
```

### Implementation

```typescript
// adapters/fastway-adapter.ts
class FastwayAdapter {
  // Version-specific API mapping
  private apiVersion = 'v1';
  
  transformTrackingResponse(rawResponse: FastwayV1Response): NormalizedTracking {
    return {
      trackingNumber: rawResponse.LabelNumber,
      status: this.normalizeStatus(rawResponse.HasDScan),
      events: rawResponse.Scans.map(this.normalizeEvent),
      eta: rawResponse.DeliveryETADate,
    };
  }
  
  // When API changes, only update this adapter
  private normalizeStatus(hasDScan: boolean): string {
    return hasDScan ? 'DELIVERED' : 'IN_TRANSIT';
  }
}
```

### Benefits

1. **Single Point of Change**: API updates only affect the adapter
2. **Consistent Frontend**: UI always receives the same data format
3. **Easy Testing**: Mock adapters for unit tests
4. **Version Support**: Can maintain multiple API versions simultaneously

---

## 5. Design Patterns Applied

### 1. **Component Pattern** (React)
- Reusable, composable UI components
- Props for customization, children for composition

### 2. **Container/Presentational Pattern**
- Pages (containers) handle logic and state
- Components (presentational) handle rendering

### 3. **Proxy Pattern** (Edge Functions)
- Edge functions act as proxies to the Fastway API
- Hides API complexity and credentials from frontend

### 4. **Facade Pattern**
- Supabase client provides a simple interface to edge functions
- `supabase.functions.invoke()` abstracts HTTP details

### 5. **Module Pattern**
- Each feature is self-contained in its own module
- Clear imports/exports for dependencies

---

## 6. Refactoring to MVC-Style Structure

### Current Structure → MVC Mapping

| Current | MVC Role | Description |
|---------|----------|-------------|
| Pages | Controller + View | Handle user input and display |
| Edge Functions | Model | Data access and business logic |
| Components | View | Presentation layer |

### Proposed MVC Refactor

```
├── src/
│   ├── models/                    # Data models and types
│   │   ├── tracking.ts            # Tracking data interfaces
│   │   └── quote.ts               # Quote data interfaces
│   ├── controllers/               # Business logic
│   │   ├── TrackingController.ts  # Tracking operations
│   │   └── QuoteController.ts     # Quote operations
│   ├── services/                  # API communication
│   │   ├── CourierService.ts      # Abstract courier service
│   │   └── FastwayService.ts      # Fastway implementation
│   ├── views/                     # React components
│   │   ├── pages/                 # Page components
│   │   └── components/            # Shared components
│   └── hooks/                     # React hooks (View-Model bridge)
│       ├── useTracking.ts
│       └── useQuote.ts
```

### Example Controller

```typescript
// controllers/TrackingController.ts
class TrackingController {
  private service: CourierService;
  
  constructor(service: CourierService) {
    this.service = service;
  }
  
  async trackParcel(trackingNumber: string): Promise<TrackingViewModel> {
    const result = await this.service.track(trackingNumber);
    return this.transformToViewModel(result);
  }
  
  private transformToViewModel(data: TrackingResult): TrackingViewModel {
    return {
      status: data.status,
      statusIcon: this.getStatusIcon(data.status),
      timeline: data.events.map(this.formatEvent),
      // View-specific transformations
    };
  }
}
```

### Benefits of MVC Refactor

1. **Testability**: Controllers can be unit tested without React
2. **Reusability**: Same controllers for web, mobile, CLI
3. **Team Scaling**: Frontend and backend developers work independently
4. **Type Safety**: Strong contracts between layers

---

## Summary

This architecture prioritizes:

- **Security**: API keys never exposed to frontend
- **Maintainability**: Clear separation of concerns
- **Scalability**: Easy to add features or providers
- **Testability**: Isolated, mockable layers
- **User Experience**: Fast loading, clear error handling
