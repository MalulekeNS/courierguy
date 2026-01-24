<?php
/**
 * Fastway Courier - Track Parcel Page
 * AJAX-powered tracking with caching and validation
 */
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Track Your Parcel - Fastway Couriers SA</title>
    <meta name="description" content="Enter your tracking number to see real-time status updates and location information for your Fastway shipment.">
    
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Bootstrap Icons -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" rel="stylesheet">
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
    <!-- Custom CSS -->
    <link href="css/styles.css" rel="stylesheet">
</head>
<body>
    <!-- Navigation -->
    <?php include 'includes/navbar.php'; ?>

    <main class="py-5">
        <div class="container">
            <!-- Header -->
            <div class="text-center mb-5">
                <div class="feature-icon bg-accent-soft mx-auto mb-3">
                    <i class="bi bi-box-seam text-accent"></i>
                </div>
                <h1 class="fw-bold display-5">Track Your Parcel</h1>
                <p class="text-muted">Enter your tracking number to see real-time status updates and location information</p>
            </div>

            <!-- Search Form -->
            <div class="row justify-content-center">
                <div class="col-lg-8">
                    <div class="card shadow-card mb-4">
                        <div class="card-header bg-white py-3">
                            <h5 class="mb-0 fw-bold">
                                Enter Tracking Number
                                <i class="bi bi-question-circle text-muted ms-2" data-bs-toggle="tooltip" data-bs-placement="top" title="Your tracking number starts with 'Z' followed by digits (e.g., Z60000983328). Find it on your receipt or shipping confirmation."></i>
                            </h5>
                            <small class="text-muted">Your tracking number can be found on your receipt or shipping confirmation</small>
                        </div>
                        <div class="card-body">
                            <form id="trackingForm" novalidate>
                                <div class="row g-3 align-items-end">
                                    <div class="col-md-9">
                                        <label for="trackingNumber" class="form-label">Tracking Number</label>
                                        <input 
                                            type="text" 
                                            class="form-control form-control-lg font-monospace" 
                                            id="trackingNumber" 
                                            name="trackingNumber"
                                            placeholder="e.g., Z60000983328"
                                            required
                                            pattern="^[A-Z][0-9]{8,15}$"
                                            maxlength="20"
                                            autocomplete="off"
                                        >
                                        <div class="invalid-feedback">Please enter a valid tracking number (e.g., Z60000983328)</div>
                                    </div>
                                    <div class="col-md-3">
                                        <button type="submit" class="btn btn-accent btn-lg w-100" id="trackBtn">
                                            <span class="btn-text"><i class="bi bi-search me-2"></i>Track</span>
                                            <span class="btn-loading d-none">
                                                <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                                                Tracking...
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </form>
                            <!-- Cache Info -->
                            <div id="cacheInfo" class="d-none mt-3 d-flex justify-content-between align-items-center text-muted small">
                                <span>Results cached for 2 minutes</span>
                                <button type="button" class="btn btn-link btn-sm p-0" id="refreshBtn">
                                    <i class="bi bi-arrow-clockwise me-1"></i>Refresh
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Loading Spinner -->
                    <div id="loadingSpinner" class="text-center py-5 d-none">
                        <div class="spinner-border text-accent" role="status" style="width: 3rem; height: 3rem;">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <p class="mt-3 text-muted">Fetching tracking information...</p>
                    </div>

                    <!-- Error Alert -->
                    <div id="errorAlert" class="alert alert-danger d-none" role="alert">
                        <i class="bi bi-exclamation-triangle-fill me-2"></i>
                        <strong>Tracking Error:</strong> <span id="errorMessage"></span>
                    </div>

                    <!-- Results Container -->
                    <div id="resultsContainer" class="d-none animate-slide-up">
                        <!-- Status Card -->
                        <div class="card shadow-card border-accent mb-4 status-card">
                            <div class="card-body py-4">
                                <div class="row align-items-center">
                                    <div class="col-md-6">
                                        <div class="d-flex align-items-center">
                                            <div class="status-icon me-3" id="statusIconContainer">
                                                <i class="bi bi-box-seam"></i>
                                            </div>
                                            <div>
                                                <small class="text-muted">Current Status</small>
                                                <h4 class="mb-0 fw-bold" id="currentStatus">-</h4>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6 text-md-end mt-3 mt-md-0">
                                        <small class="text-muted">Tracking Number</small>
                                        <h5 class="mb-0 fw-bold font-monospace" id="labelNumber">-</h5>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Delivery Info Card -->
                        <div class="card shadow-card mb-4">
                            <div class="card-body py-4">
                                <div class="row text-center g-4" id="deliveryInfo">
                                    <!-- Populated by JavaScript -->
                                </div>
                            </div>
                        </div>

                        <!-- Timeline Card -->
                        <div class="card shadow-card">
                            <div class="card-header bg-white py-3">
                                <h5 class="mb-0 fw-bold">Tracking History</h5>
                                <small class="text-muted"><span id="scanCount">0</span> tracking events found</small>
                            </div>
                            <div class="card-body">
                                <div id="timeline" class="timeline">
                                    <!-- Populated by JavaScript -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <!-- Footer -->
    <?php include 'includes/footer.php'; ?>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    <!-- Custom JS -->
    <script src="js/tracking.js"></script>
</body>
</html>
