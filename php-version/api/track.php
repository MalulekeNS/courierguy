<?php
/**
 * Tracking API Endpoint
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

// Load configuration
require_once __DIR__ . '/../config/config.php';

// Get request body
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Validate input
if (!isset($data['trackingNumber']) || empty($data['trackingNumber'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Tracking number is required']);
    exit();
}

$trackingNumber = trim($data['trackingNumber']);

// Validate tracking number format (letter followed by 8-15 digits)
if (!preg_match('/^[A-Z][0-9]{8,15}$/', strtoupper($trackingNumber))) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid tracking number format. Expected format: Z followed by 8-15 digits (e.g., Z60000983328)']);
    exit();
}

// Sanitize
$trackingNumber = strtoupper(preg_replace('/[^A-Z0-9]/', '', $trackingNumber));

// Build API URL
$apiUrl = FASTWAY_API_BASE . '/tracktrace/detail/' . urlencode($trackingNumber) . '?api_key=' . FASTWAY_API_KEY;

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
        throw new Exception('Invalid response from tracking service');
    }
    
    // Check for API error
    if (isset($result['error']) && $result['error']) {
        http_response_code(400);
        echo json_encode(['error' => $result['error']]);
        exit();
    }
    
    // Extract result data
    $trackingData = $result['result'] ?? $result;
    
    // Check if tracking found
    if (empty($trackingData) || (isset($trackingData['LabelNumber']) && empty($trackingData['LabelNumber']))) {
        http_response_code(404);
        echo json_encode(['error' => 'Tracking number not found. Please check the number and try again.']);
        exit();
    }
    
    // Log to database (optional - fire and forget)
    logTrackingSearch($trackingNumber, true, $trackingData['Scans'][0]['StatusDescription'] ?? null);
    
    // Return result
    echo json_encode($trackingData);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
    
    // Log error
    error_log('Tracking API Error: ' . $e->getMessage());
}

/**
 * Log tracking search to database (optional)
 */
function logTrackingSearch($trackingNumber, $hasResult, $status) {
    // This would connect to your database to log searches
    // Implemented as fire-and-forget for performance
    // Example with PDO:
    /*
    try {
        $pdo = new PDO(DB_DSN, DB_USER, DB_PASS);
        $stmt = $pdo->prepare('INSERT INTO tracking_searches (tracking_number, has_result, result_status) VALUES (?, ?, ?)');
        $stmt->execute([$trackingNumber, $hasResult ? 1 : 0, $status]);
    } catch (PDOException $e) {
        error_log('Database log error: ' . $e->getMessage());
    }
    */
}
