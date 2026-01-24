<?php
/**
 * Application Configuration
 * 
 * SECURITY: This file should NOT be committed to version control
 * with real API keys. Use environment variables in production.
 */

// Fastway API Configuration
// In production, load from environment variables:
// define('FASTWAY_API_KEY', getenv('FASTWAY_API_KEY'));

define('FASTWAY_API_KEY', 'YOUR_API_KEY_HERE'); // Replace with your actual API key
define('FASTWAY_API_BASE', 'https://api.fastway.org/v3');

// Database Configuration (optional - for logging)
// define('DB_DSN', 'mysql:host=localhost;dbname=fastway_courier');
// define('DB_USER', 'your_db_user');
// define('DB_PASS', 'your_db_password');

// Application Settings
define('APP_DEBUG', false);
define('APP_TIMEZONE', 'Africa/Johannesburg');

// Set timezone
date_default_timezone_set(APP_TIMEZONE);

// Error reporting (disable in production)
if (APP_DEBUG) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}
