# Fastway Courier - PHP/Bootstrap Version

Technical Assessment Demo Application for Fastway Courier South Africa.

## Technology Stack

- **Frontend**: HTML5, CSS3, Bootstrap 5.3
- **Backend**: PHP 8.x
- **JavaScript**: Vanilla ES6+ (no frameworks)
- **Icons**: Bootstrap Icons
- **Fonts**: Inter, Space Grotesk (Google Fonts)

## Project Structure

```
php-version/
├── index.php              # Home page
├── track.php              # Track parcel page
├── quote.php              # Get quote page
├── analytics.php          # Analytics dashboard
├── api/
│   ├── track.php          # Tracking API endpoint
│   └── quote.php          # Quote API endpoint
├── config/
│   └── config.php         # Application configuration
├── database/
│   ├── init.php           # SQLite database initialization
│   ├── .htaccess          # Protect database files from web access
│   └── database.sqlite    # Auto-generated SQLite database
├── includes/
│   ├── navbar.php         # Navigation component
│   └── footer.php         # Footer component
├── css/
│   └── styles.css         # Custom styles
├── js/
│   ├── tracking.js        # Tracking page logic
│   └── quote.js           # Quote page logic
└── README.md              # This file
```

## Setup Instructions

### 1. Server Requirements

- PHP 8.0 or higher
- cURL extension enabled
- PDO SQLite extension enabled
- Web server (Apache/Nginx)

### 2. Configuration

1. Copy the project to your web server document root
2. Edit `config/config.php` and set your Fastway API key:
   ```php
   define('FASTWAY_API_KEY', 'your_actual_api_key');
   ```

### 3. Security Considerations

- Never commit `config/config.php` with real API keys
- Use environment variables in production:
  ```php
  define('FASTWAY_API_KEY', getenv('FASTWAY_API_KEY'));
  ```
- Ensure `config/` directory is not publicly accessible

## Features

### Core Features
- ✅ Parcel tracking with real-time status
- ✅ Shipping quote calculator
- ✅ Responsive Bootstrap 5 UI
- ✅ AJAX form submissions
- ✅ Input validation (client & server-side)
- ✅ Error handling with user-friendly messages
- ✅ SQLite database for form submission logging

### Bonus Features
- ✅ Client-side caching (2-5 minutes)
- ✅ Quote result sorting (price, weight, name)
- ✅ Tooltips for form fields
- ✅ Manual cache refresh
- ✅ Analytics dashboard for viewing stored data

## API Endpoints

### POST /api/track.php
Track a parcel by tracking number.

**Request:**
```json
{
    "trackingNumber": "Z60000983328"
}
```

**Response:** Fastway tracking data with scans and status.

### POST /api/quote.php
Get shipping quotes for a destination.

**Request:**
```json
{
    "suburb": "Sandton",
    "postalCode": "2196",
    "weight": 2.5,
    "rfCode": "JNB"
}
```

**Response:** Available services with pricing.

## Test Data

Use these tracking numbers for testing:
- `Z60000983328`
- `Z30002408261`

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

Technical Assessment Demo - For evaluation purposes only.
