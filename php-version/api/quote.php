<?php
/**
 * Quote API Endpoint
 * Proxies requests to Fastway API to protect API key
 */

// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Load configuration and database
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../database/init.php';

// Get request body
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Validate required fields
$errors = [];

if (!isset($data['suburb']) || empty(trim($data['suburb']))) {
    $errors[] = 'Destination suburb is required';
}

if (!isset($data['postalCode']) || empty(trim($data['postalCode']))) {
    $errors[] = 'Postal code is required';
} elseif (!preg_match('/^[0-9]{4}$/', trim($data['postalCode']))) {
    $errors[] = 'Postal code must be 4 digits';
}

if (!isset($data['weight']) || empty($data['weight'])) {
    $errors[] = 'Parcel weight is required';
} elseif (!is_numeric($data['weight']) || floatval($data['weight']) <= 0) {
    $errors[] = 'Weight must be a positive number';
} elseif (floatval($data['weight']) > 100) {
    $errors[] = 'Weight cannot exceed 100kg';
}

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(['error' => implode('. ', $errors)]);
    exit();
}

// Sanitize inputs
$suburb = substr(trim($data['suburb']), 0, 100);
$postalCode = preg_replace('/[^0-9]/', '', trim($data['postalCode']));
$weight = floatval($data['weight']);
$rfCode = isset($data['rfCode']) ? preg_replace('/[^A-Z]/', '', strtoupper(trim($data['rfCode']))) : 'JNB';

// Build API URL
$params = http_build_query([
    'api_key' => FASTWAY_API_KEY,
    'rf' => $rfCode,
    'suburb' => $suburb,
    'postcode' => $postalCode,
    'weight' => $weight
]);

$apiUrl = FASTWAY_API_BASE . '/psc/lookup?' . $params;

try {
    // Make request to Fastway API
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $apiUrl,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_HTTPHEADER => ['Accept: application/json']
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
    
    if ($curlError) {
        throw new Exception('Network error: ' . $curlError);
    }
    
    if ($httpCode !== 200) {
        throw new Exception('API request failed with status ' . $httpCode);
    }
    
    $result = json_decode($response, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid response from quote service');
    }
    
    // Check for API error
    if (isset($result['error']) && $result['error']) {
        http_response_code(400);
        echo json_encode(['error' => $result['error']]);
        exit();
    }
    
    // Extract result data
    $quoteData = $result['result'] ?? $result;
    
    // Check if valid response
    if (empty($quoteData) || !isset($quoteData['services'])) {
        http_response_code(404);
        echo json_encode(['error' => 'No shipping options found for this destination. Please check the suburb and postal code.']);
        exit();
    }
    
    // Find cheapest price for logging
    $cheapestPrice = null;
    if (!empty($quoteData['services'])) {
        $prices = array_column($quoteData['services'], 'totalprice_normal');
        $cheapestPrice = !empty($prices) ? min($prices) : null;
    }
    
    // Log to SQLite database
    logQuoteRequestToDb($suburb, $postalCode, $rfCode, $weight, count($quoteData['services']), $cheapestPrice);
