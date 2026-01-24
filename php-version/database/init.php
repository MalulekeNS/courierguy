<?php
/**
 * SQLite Database Initialization
 * Creates the database and required tables if they don't exist
 */

define('DB_PATH', __DIR__ . '/courier_data.sqlite');

/**
 * Get database connection
 * @return PDO
 */
function getDatabase(): PDO {
    static $pdo = null;
    
    if ($pdo === null) {
        try {
            $pdo = new PDO('sqlite:' . DB_PATH);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            
            // Enable foreign keys
            $pdo->exec('PRAGMA foreign_keys = ON');
            
            // Initialize tables if they don't exist
            initializeTables($pdo);
        } catch (PDOException $e) {
            error_log('Database connection error: ' . $e->getMessage());
            throw $e;
        }
    }
    
    return $pdo;
}

/**
 * Initialize database tables
 * @param PDO $pdo
 */
function initializeTables(PDO $pdo): void {
    // Create tracking_searches table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS tracking_searches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tracking_number TEXT NOT NULL,
            has_result INTEGER DEFAULT 0,
            result_status TEXT,
            search_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            ip_address TEXT,
            user_agent TEXT
        )
    ");
    
    // Create index for tracking number lookups
    $pdo->exec("
        CREATE INDEX IF NOT EXISTS idx_tracking_number 
        ON tracking_searches(tracking_number)
    ");
    
    // Create quote_requests table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS quote_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            suburb TEXT NOT NULL,
            postal_code TEXT NOT NULL,
            rf_code TEXT DEFAULT 'JNB',
            weight REAL NOT NULL,
            services_count INTEGER DEFAULT 0,
            cheapest_price REAL,
            request_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            ip_address TEXT,
            user_agent TEXT
        )
    ");
    
    // Create index for location lookups
    $pdo->exec("
        CREATE INDEX IF NOT EXISTS idx_quote_location 
        ON quote_requests(suburb, postal_code)
    ");
}

/**
 * Log a tracking search to the database
 * @param string $trackingNumber
 * @param bool $hasResult
 * @param string|null $status
 * @return bool
 */
function logTrackingSearchToDb(string $trackingNumber, bool $hasResult, ?string $status): bool {
    try {
        $pdo = getDatabase();
        $stmt = $pdo->prepare("
            INSERT INTO tracking_searches 
            (tracking_number, has_result, result_status, ip_address, user_agent) 
            VALUES (?, ?, ?, ?, ?)
        ");
        
        return $stmt->execute([
            $trackingNumber,
            $hasResult ? 1 : 0,
            $status,
            $_SERVER['REMOTE_ADDR'] ?? null,
            substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255)
        ]);
    } catch (PDOException $e) {
        error_log('Error logging tracking search: ' . $e->getMessage());
        return false;
    }
}

/**
 * Log a quote request to the database
 * @param string $suburb
 * @param string $postalCode
 * @param string $rfCode
 * @param float $weight
 * @param int $servicesCount
 * @param float|null $cheapestPrice
 * @return bool
 */
function logQuoteRequestToDb(
    string $suburb, 
    string $postalCode, 
    string $rfCode, 
    float $weight, 
    int $servicesCount, 
    ?float $cheapestPrice
): bool {
    try {
        $pdo = getDatabase();
        $stmt = $pdo->prepare("
            INSERT INTO quote_requests 
            (suburb, postal_code, rf_code, weight, services_count, cheapest_price, ip_address, user_agent) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        return $stmt->execute([
            $suburb,
            $postalCode,
            $rfCode,
            $weight,
            $servicesCount,
            $cheapestPrice,
            $_SERVER['REMOTE_ADDR'] ?? null,
            substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255)
        ]);
    } catch (PDOException $e) {
        error_log('Error logging quote request: ' . $e->getMessage());
        return false;
    }
}

/**
 * Get recent tracking searches
 * @param int $limit
 * @return array
 */
function getRecentTrackingSearches(int $limit = 50): array {
    try {
        $pdo = getDatabase();
        $stmt = $pdo->prepare("
            SELECT * FROM tracking_searches 
            ORDER BY search_timestamp DESC 
            LIMIT ?
        ");
        $stmt->execute([$limit]);
        return $stmt->fetchAll();
    } catch (PDOException $e) {
        error_log('Error fetching tracking searches: ' . $e->getMessage());
        return [];
    }
}

/**
 * Get recent quote requests
 * @param int $limit
 * @return array
 */
function getRecentQuoteRequests(int $limit = 50): array {
    try {
        $pdo = getDatabase();
        $stmt = $pdo->prepare("
            SELECT * FROM quote_requests 
            ORDER BY request_timestamp DESC 
            LIMIT ?
        ");
        $stmt->execute([$limit]);
        return $stmt->fetchAll();
    } catch (PDOException $e) {
        error_log('Error fetching quote requests: ' . $e->getMessage());
        return [];
    }
}

/**
 * Get tracking statistics
 * @return array
 */
function getTrackingStats(): array {
    try {
        $pdo = getDatabase();
        
        $stats = [];
        
        // Total searches
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM tracking_searches");
        $stats['total_searches'] = $stmt->fetch()['total'];
        
        // Successful searches
        $stmt = $pdo->query("SELECT COUNT(*) as successful FROM tracking_searches WHERE has_result = 1");
        $stats['successful_searches'] = $stmt->fetch()['successful'];
        
        // Unique tracking numbers
        $stmt = $pdo->query("SELECT COUNT(DISTINCT tracking_number) as unique_numbers FROM tracking_searches");
        $stats['unique_tracking_numbers'] = $stmt->fetch()['unique_numbers'];
        
        // Today's searches
        $stmt = $pdo->query("SELECT COUNT(*) as today FROM tracking_searches WHERE DATE(search_timestamp) = DATE('now')");
        $stats['today_searches'] = $stmt->fetch()['today'];
        
        return $stats;
    } catch (PDOException $e) {
        error_log('Error fetching tracking stats: ' . $e->getMessage());
        return [];
    }
}

/**
 * Get quote statistics
 * @return array
 */
function getQuoteStats(): array {
    try {
        $pdo = getDatabase();
        
        $stats = [];
        
        // Total quotes
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM quote_requests");
        $stats['total_quotes'] = $stmt->fetch()['total'];
        
        // Average weight
        $stmt = $pdo->query("SELECT AVG(weight) as avg_weight FROM quote_requests");
        $stats['average_weight'] = round($stmt->fetch()['avg_weight'] ?? 0, 2);
        
        // Average cheapest price
        $stmt = $pdo->query("SELECT AVG(cheapest_price) as avg_price FROM quote_requests WHERE cheapest_price IS NOT NULL");
        $stats['average_cheapest_price'] = round($stmt->fetch()['avg_price'] ?? 0, 2);
        
        // Most popular suburbs
        $stmt = $pdo->query("
            SELECT suburb, postal_code, COUNT(*) as count 
            FROM quote_requests 
            GROUP BY suburb, postal_code 
            ORDER BY count DESC 
            LIMIT 5
        ");
        $stats['popular_destinations'] = $stmt->fetchAll();
        
        // Today's quotes
        $stmt = $pdo->query("SELECT COUNT(*) as today FROM quote_requests WHERE DATE(request_timestamp) = DATE('now')");
        $stats['today_quotes'] = $stmt->fetch()['today'];
        
        return $stats;
    } catch (PDOException $e) {
        error_log('Error fetching quote stats: ' . $e->getMessage());
        return [];
    }
}
