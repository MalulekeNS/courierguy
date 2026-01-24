<?php
/**
 * Analytics Dashboard
 * View tracking and quote statistics
 * 
 * SECURITY: In production, this page should require authentication
 */

require_once __DIR__ . '/database/init.php';

$trackingStats = getTrackingStats();
$quoteStats = getQuoteStats();
$recentTracking = getRecentTrackingSearches(10);
$recentQuotes = getRecentQuoteRequests(10);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Analytics Dashboard - Fastway Courier</title>
    
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" rel="stylesheet">
    <link href="css/styles.css" rel="stylesheet">
    
    <style>
        .stat-card {
            transition: transform 0.2s;
        }
        .stat-card:hover {
            transform: translateY(-5px);
        }
        .stat-number {
            font-size: 2.5rem;
            font-weight: bold;
            color: var(--bs-primary);
        }
    </style>
</head>
<body>
    <?php include 'includes/navbar.php'; ?>
    
    <main class="container py-5">
        <div class="row mb-4">
            <div class="col">
                <h1><i class="bi bi-graph-up me-2"></i>Analytics Dashboard</h1>
                <p class="text-muted">Form submission statistics stored in SQLite database</p>
            </div>
        </div>
        
        <!-- Tracking Statistics -->
        <h2 class="h4 mb-3"><i class="bi bi-search me-2"></i>Tracking Statistics</h2>
        <div class="row mb-5">
            <div class="col-md-3 mb-3">
                <div class="card stat-card h-100 text-center">
                    <div class="card-body">
                        <div class="stat-number"><?= htmlspecialchars($trackingStats['total_searches'] ?? 0) ?></div>
                        <div class="text-muted">Total Searches</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="card stat-card h-100 text-center">
                    <div class="card-body">
                        <div class="stat-number"><?= htmlspecialchars($trackingStats['successful_searches'] ?? 0) ?></div>
                        <div class="text-muted">Successful</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="card stat-card h-100 text-center">
                    <div class="card-body">
                        <div class="stat-number"><?= htmlspecialchars($trackingStats['unique_tracking_numbers'] ?? 0) ?></div>
                        <div class="text-muted">Unique Numbers</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="card stat-card h-100 text-center">
                    <div class="card-body">
                        <div class="stat-number"><?= htmlspecialchars($trackingStats['today_searches'] ?? 0) ?></div>
                        <div class="text-muted">Today</div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Quote Statistics -->
        <h2 class="h4 mb-3"><i class="bi bi-calculator me-2"></i>Quote Statistics</h2>
        <div class="row mb-5">
            <div class="col-md-3 mb-3">
                <div class="card stat-card h-100 text-center">
                    <div class="card-body">
                        <div class="stat-number"><?= htmlspecialchars($quoteStats['total_quotes'] ?? 0) ?></div>
                        <div class="text-muted">Total Quotes</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="card stat-card h-100 text-center">
                    <div class="card-body">
                        <div class="stat-number"><?= number_format($quoteStats['average_weight'] ?? 0, 1) ?>kg</div>
                        <div class="text-muted">Avg Weight</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="card stat-card h-100 text-center">
                    <div class="card-body">
                        <div class="stat-number">R<?= number_format($quoteStats['average_cheapest_price'] ?? 0, 2) ?></div>
                        <div class="text-muted">Avg Price</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="card stat-card h-100 text-center">
                    <div class="card-body">
                        <div class="stat-number"><?= htmlspecialchars($quoteStats['today_quotes'] ?? 0) ?></div>
                        <div class="text-muted">Today</div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Popular Destinations -->
        <?php if (!empty($quoteStats['popular_destinations'])): ?>
        <h2 class="h4 mb-3"><i class="bi bi-geo-alt me-2"></i>Popular Destinations</h2>
        <div class="card mb-5">
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-striped mb-0">
                        <thead>
                            <tr>
                                <th>Suburb</th>
                                <th>Postal Code</th>
                                <th>Requests</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($quoteStats['popular_destinations'] as $dest): ?>
                            <tr>
                                <td><?= htmlspecialchars($dest['suburb']) ?></td>
                                <td><?= htmlspecialchars($dest['postal_code']) ?></td>
                                <td><span class="badge bg-primary"><?= htmlspecialchars($dest['count']) ?></span></td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        <?php endif; ?>
        
        <!-- Recent Activity -->
        <div class="row">
            <div class="col-md-6 mb-4">
                <h2 class="h4 mb-3"><i class="bi bi-clock-history me-2"></i>Recent Tracking Searches</h2>
                <div class="card">
                    <div class="card-body">
                        <?php if (empty($recentTracking)): ?>
                            <p class="text-muted mb-0">No tracking searches yet.</p>
                        <?php else: ?>
                            <div class="table-responsive">
                                <table class="table table-sm mb-0">
                                    <thead>
                                        <tr>
                                            <th>Number</th>
                                            <th>Status</th>
                                            <th>Time</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <?php foreach ($recentTracking as $search): ?>
                                        <tr>
                                            <td><code><?= htmlspecialchars($search['tracking_number']) ?></code></td>
                                            <td>
                                                <?php if ($search['has_result']): ?>
                                                    <span class="badge bg-success">Found</span>
                                                <?php else: ?>
                                                    <span class="badge bg-warning">Not Found</span>
                                                <?php endif; ?>
                                            </td>
                                            <td><small class="text-muted"><?= htmlspecialchars($search['search_timestamp']) ?></small></td>
                                        </tr>
                                        <?php endforeach; ?>
                                    </tbody>
                                </table>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6 mb-4">
                <h2 class="h4 mb-3"><i class="bi bi-clock-history me-2"></i>Recent Quote Requests</h2>
                <div class="card">
                    <div class="card-body">
                        <?php if (empty($recentQuotes)): ?>
                            <p class="text-muted mb-0">No quote requests yet.</p>
                        <?php else: ?>
                            <div class="table-responsive">
                                <table class="table table-sm mb-0">
                                    <thead>
                                        <tr>
                                            <th>Destination</th>
                                            <th>Weight</th>
                                            <th>Price</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <?php foreach ($recentQuotes as $quote): ?>
                                        <tr>
                                            <td><?= htmlspecialchars($quote['suburb']) ?>, <?= htmlspecialchars($quote['postal_code']) ?></td>
                                            <td><?= number_format($quote['weight'], 1) ?>kg</td>
                                            <td>
                                                <?php if ($quote['cheapest_price']): ?>
                                                    R<?= number_format($quote['cheapest_price'], 2) ?>
                                                <?php else: ?>
                                                    <span class="text-muted">-</span>
                                                <?php endif; ?>
                                            </td>
                                        </tr>
                                        <?php endforeach; ?>
                                    </tbody>
                                </table>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="alert alert-info mt-4">
            <i class="bi bi-info-circle me-2"></i>
            <strong>SQLite Database:</strong> All form submissions are stored in 
            <code>database/courier_data.sqlite</code>. The database is created automatically on first use.
        </div>
    </main>
    
    <?php include 'includes/footer.php'; ?>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
