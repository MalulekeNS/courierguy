# Fastway Courier Tracking & Quote Application

A web application that integrates with the Fastway Couriers API to provide parcel tracking and shipping quote functionality.

## Features

### 1. Parcel Tracking
Track your parcels in real-time using the Fastway tracking system.
- Enter a tracking number to view current status
- View complete parcel history with timestamps
- See delivery ETA and last known scan location
- View route information (origin → destination)

### 2. Shipping Quote Calculator
Get instant shipping quotes for your parcels.
- Enter destination suburb and postal code
- Specify parcel weight in kilograms
- View multiple shipping options with prices
- See delivery timeframes and service types

## Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn package manager

### Installation Steps

```bash
# 1. Clone the repository
git clone <repository-url>

# 2. Navigate to the project directory
cd fastway-courier-app

# 3. Install dependencies
npm install

# 4. Start the development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Environment Configuration

The application uses Supabase Edge Functions to securely proxy API calls. The following environment variables are configured server-side:

- `FASTWAY_API_KEY` - Your Fastway Couriers API key (stored securely as a secret)

**Note:** The API key is never exposed to the frontend. All API calls are routed through secure edge functions.

## How to Use Each Feature

### Tracking a Parcel

1. Navigate to the **Track Parcel** page via the navigation menu
2. Enter your tracking number in the input field (e.g., `Z60000983328`)
3. Click the **Track** button
4. View the tracking results including:
   - Current delivery status
   - Delivery ETA
   - Last known scan location
   - Complete tracking history timeline

### Getting a Shipping Quote

1. Navigate to the **Get Quote** page via the navigation menu
2. Fill in the parcel details:
   - **Destination Suburb**: e.g., "Cape Town"
   - **Postal Code**: e.g., "8001"
   - **Weight**: Parcel weight in kilograms (e.g., "2.5")
3. Click the **Get Quote** button
4. View available shipping options with:
   - Service name and type
   - Price (including and excluding VAT)
   - Weight limits
   - Estimated delivery timeframe

## Test Data

### Test Tracking Numbers
Use these tracking numbers for testing:
- `Z60000983328`
- `Z30002408261`

### Test Quote Parameters
- **Origin**: Johannesburg (JNB) - hardcoded as per requirements
- **Sample Destination**: Cape Town, 8001, 2.5kg

---

# Standard Operating Procedure (SOP)

## System Navigation Guide

### Accessing the Application

1. Open the application in a web browser
2. You will land on the **Home/Dashboard** page
3. The navigation bar at the top provides access to all features

### Navigation Menu

| Menu Item | Description | URL |
|-----------|-------------|-----|
| Home | Dashboard with quick access to features | `/` |
| Track Parcel | Parcel tracking functionality | `/track` |
| Get Quote | Shipping quote calculator | `/quote` |

### Mobile Usage

On mobile devices:
1. Tap the hamburger menu icon (☰) to open navigation
2. Select your desired feature
3. The menu closes automatically after selection

### Error Handling

The application handles errors gracefully:
- **Invalid Tracking Numbers**: Displays a clear message that no tracking information was found
- **Missing Form Fields**: Shows validation messages for required fields
- **Network Errors**: Displays user-friendly error messages (not raw API responses)
- **API Failures**: Shows appropriate fallback messages

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Tracking not found | Verify the tracking number is correct |
| Quote not loading | Check that all fields are filled correctly |
| Page not loading | Check your internet connection |
| Slow response | The API may be experiencing high traffic |

## Technical Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui
- **Build Tool**: Vite
- **Backend**: Supabase Edge Functions (Deno)
- **API**: Fastway Couriers REST API

## API Integration

The application uses two edge functions to securely communicate with the Fastway API:

1. **fastway-track**: Handles parcel tracking requests
2. **fastway-quote**: Handles shipping quote lookups

Both functions:
- Store the API key securely server-side
- Handle CORS for cross-origin requests
- Provide user-friendly error messages
- Log requests for debugging purposes
