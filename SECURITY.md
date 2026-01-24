# Security Considerations

This document addresses security questions for the Fastway Courier integration assessment.

---

## 7. Protecting the Fastway API Key

### Implementation

The API key is **never exposed to the frontend**. It is stored and accessed exclusively through server-side edge functions.

```
[Browser] → [Edge Function] → [Fastway API]
              ↑
        API key stored here
        (server-side secret)
```

### Security Measures Applied

1. **Server-Side Secrets**: API key stored in Supabase secrets, not in code
   ```typescript
   // Edge function - key accessed server-side only
   const apiKey = Deno.env.get('FASTWAY_API_KEY');
   ```

2. **No Frontend Exposure**: Frontend code never contains or accesses the API key
   ```typescript
   // Frontend - calls edge function, no API key
   await supabase.functions.invoke('fastway-track', {
     body: { trackingNumber }
   });
   ```

3. **Environment Isolation**: Secrets are not committed to version control

4. **CORS Configuration**: Edge functions only accept requests from authorized origins

---

## 8. Input Validation and Sanitization

### Client-Side Validation

```typescript
// Form validation before submission
const validateForm = () => {
  if (!formData.suburb.trim()) return "Please enter a destination suburb";
  if (!formData.postalCode.trim()) return "Please enter a postal code";
  if (!formData.weight.trim() || parseFloat(formData.weight) <= 0) {
    return "Please enter a valid weight";
  }
  return null;
};

// Tracking number normalization
onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
```

### Server-Side Validation (Edge Functions)

```typescript
// Validate required fields
if (!trackingNumber) {
  return new Response(
    JSON.stringify({ success: false, error: 'Tracking number is required' }),
    { status: 400 }
  );
}

// Validate quote parameters
if (!suburb || !postalCode || !weight) {
  return new Response(
    JSON.stringify({ success: false, error: 'All fields are required' }),
    { status: 400 }
  );
}
```

### Sanitization Measures

1. **Input Trimming**: All inputs are trimmed of whitespace
2. **Type Coercion**: Weight converted to number with validation
3. **URL Encoding**: Parameters encoded before API calls
   ```typescript
   encodeURIComponent(trackingNumber)
   ```

---

## 9. Potential Security Risks

| Risk | Description | Severity |
|------|-------------|----------|
| **API Key Exposure** | Hardcoded keys in frontend code | Critical |
| **Rate Limiting Bypass** | Excessive API calls causing quota exhaustion | High |
| **Injection Attacks** | Malicious input in tracking numbers | Medium |
| **CORS Misconfiguration** | Unauthorized origins accessing API | Medium |
| **Information Disclosure** | Raw API errors exposing system details | Medium |
| **Man-in-the-Middle** | Interception of API communications | Medium |
| **Denial of Service** | Flooding the application with requests | Medium |
| **Data Scraping** | Automated extraction of shipping data | Low |

### Current Mitigations

- ✅ API key stored server-side (addresses Critical risk)
- ✅ User-friendly error messages (no raw API errors)
- ✅ HTTPS for all communications
- ✅ Input validation on both client and server

---

## 10. Prevention Strategies

### API Abuse Prevention

```typescript
// 1. Rate Limiting (recommended implementation)
const rateLimiter = new Map<string, number[]>();

function checkRateLimit(ip: string, limit: number = 100, windowMs: number = 60000): boolean {
  const now = Date.now();
  const requests = rateLimiter.get(ip) || [];
  const recentRequests = requests.filter(time => now - time < windowMs);
  
  if (recentRequests.length >= limit) {
    return false; // Rate limit exceeded
  }
  
  recentRequests.push(now);
  rateLimiter.set(ip, recentRequests);
  return true;
}

// 2. Request throttling per user session
// 3. API usage monitoring and alerting
// 4. Quota management per client
```

### Automated Spam Submission Prevention

```typescript
// 1. CAPTCHA Integration (recommended for production)
import { verifyCaptcha } from './captcha-service';

if (!await verifyCaptcha(request.captchaToken)) {
  return new Response(JSON.stringify({ error: 'CAPTCHA verification failed' }), { status: 403 });
}

// 2. Honeypot fields (hidden fields that bots fill)
<input type="text" name="website" style="display:none" tabIndex={-1} />

// 3. Request timing analysis
// Reject submissions that happen too quickly (< 2 seconds)

// 4. Session-based submission limits
// Maximum 10 quotes per session
```

### Injection Attack Prevention

```typescript
// 1. Input validation with strict patterns
const trackingNumberPattern = /^[A-Z0-9]{10,15}$/;
if (!trackingNumberPattern.test(trackingNumber)) {
  return new Response(JSON.stringify({ error: 'Invalid tracking number format' }), { status: 400 });
}

// 2. URL encoding for all dynamic values
const url = `${API_BASE}/tracktrace/detail/${encodeURIComponent(trackingNumber)}`;

// 3. Parameterized queries (if using database)
// Never concatenate user input into SQL strings

// 4. Content Security Policy headers
const headers = {
  'Content-Security-Policy': "default-src 'self'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
};

// 5. Input length limits
if (trackingNumber.length > 20) {
  return new Response(JSON.stringify({ error: 'Input too long' }), { status: 400 });
}
```

---

## 11. POPIA/GDPR Compliance for Customer Data

If this system stored customer data, the following measures would be implemented:

### Data Collection Principles

1. **Lawful Basis**: Collect only data necessary for service delivery
2. **Purpose Limitation**: Use data only for stated purposes
3. **Data Minimization**: Store minimum required information

### Technical Safeguards

```typescript
// 1. Encryption at Rest
// All database fields containing PII encrypted using AES-256

// 2. Encryption in Transit
// All communications over HTTPS/TLS 1.3

// 3. Data Access Controls
// Row Level Security (RLS) in Supabase
CREATE POLICY "Users can only view their own data"
ON customer_data
FOR SELECT
USING (auth.uid() = user_id);

// 4. Audit Logging
// Log all access to personal data
CREATE TABLE audit_log (
  id UUID PRIMARY KEY,
  user_id UUID,
  action TEXT,
  resource TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

### User Rights Implementation

| Right | Implementation |
|-------|----------------|
| **Right to Access** | API endpoint to export user data |
| **Right to Rectification** | Profile edit functionality |
| **Right to Erasure** | Account deletion with data purge |
| **Right to Portability** | JSON/CSV data export feature |
| **Right to Object** | Marketing preference controls |

### Data Retention Policy

```typescript
// Automatic data purging after retention period
const retentionPolicies = {
  trackingHistory: 90, // days
  quotes: 30, // days
  userAccounts: 365, // days after last activity
  auditLogs: 730, // days (legal requirement)
};

// Scheduled cleanup job
async function purgeExpiredData() {
  await db.from('tracking_history')
    .delete()
    .lt('created_at', daysAgo(90));
}
```

### Privacy Documentation

Required documents for POPIA/GDPR compliance:
- Privacy Policy (publicly accessible)
- Data Processing Agreement (for third parties)
- Record of Processing Activities
- Data Protection Impact Assessment
- Breach Notification Procedures

### Consent Management

```typescript
// Explicit consent capture
interface ConsentRecord {
  userId: string;
  consentType: 'marketing' | 'analytics' | 'thirdParty';
  granted: boolean;
  timestamp: Date;
  ipAddress: string;
  version: string; // Policy version consented to
}

// Consent before data collection
if (!user.hasConsented('dataProcessing')) {
  showConsentDialog();
  return;
}
```

---

## Security Checklist

### Currently Implemented ✅

- [x] API key stored in server-side secrets
- [x] Edge functions proxy all API calls
- [x] Client-side input validation
- [x] Server-side input validation
- [x] User-friendly error messages (no raw API errors)
- [x] HTTPS for all communications
- [x] URL encoding for dynamic parameters

### Recommended for Production 🔶

- [ ] Rate limiting on edge functions
- [ ] CAPTCHA for form submissions
- [ ] Security headers (CSP, X-Frame-Options)
- [ ] Request logging and monitoring
- [ ] Automated security scanning
- [ ] Regular dependency updates
- [ ] Penetration testing

### If Storing Customer Data 📋

- [ ] Data encryption at rest
- [ ] Row Level Security policies
- [ ] Audit logging
- [ ] Consent management system
- [ ] Data export/deletion features
- [ ] Privacy policy
- [ ] DPIA documentation
