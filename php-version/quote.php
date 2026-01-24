<?php
/**
 * Fastway Courier - Get Quote Page
 * AJAX-powered quote calculator with sorting and validation
 */
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Get a Shipping Quote - Fastway Couriers SA</title>
    <meta name="description" content="Calculate your shipping costs instantly by entering your destination and parcel details.">
    
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
                    <i class="bi bi-calculator text-accent"></i>
                </div>
                <h1 class="fw-bold display-5">Get a Shipping Quote</h1>
                <p class="text-muted">Calculate your shipping costs instantly by entering your destination and parcel details</p>
            </div>

            <div class="row justify-content-center">
                <div class="col-lg-10">
                    <div class="row g-4">
                        <!-- Form Column -->
                        <div class="col-lg-5">
                            <div class="card shadow-card">
                                <div class="card-header bg-white py-3">
                                    <h5 class="mb-0 fw-bold">Parcel Details</h5>
                                    <small class="text-muted">Fill in the details below to get a shipping quote</small>
                                </div>
                                <div class="card-body">
                                    <form id="quoteForm" novalidate>
                                        <div class="mb-3">
                                            <label for="suburb" class="form-label">
                                                Destination Suburb
                                                <i class="bi bi-question-circle text-muted ms-1" data-bs-toggle="tooltip" title="Enter the suburb name where the parcel will be delivered (e.g., Sandton, Cape Town CBD)"></i>
                                            </label>
                                            <input 
                                                type="text" 
                                                class="form-control" 
                                                id="suburb" 
                                                name="suburb"
                                                placeholder="e.g., Sandton"
                                                required
                                                maxlength="100"
                                            >
                                            <div class="invalid-feedback">Please enter a destination suburb</div>
                                        </div>
                                        <div class="mb-3">
                                            <label for="postalCode" class="form-label">
                                                Postal Code
                                                <i class="bi bi-question-circle text-muted ms-1" data-bs-toggle="tooltip" title="4-digit South African postal code for the destination (e.g., 2196 for Sandton)"></i>
                                            </label>
                                            <input 
                                                type="text" 
                                                class="form-control" 
                                                id="postalCode" 
                                                name="postalCode"
                                                placeholder="e.g., 2196"
                                                required
                                                pattern="^[0-9]{4}$"
                                                maxlength="4"
                                            >
                                            <div class="invalid-feedback">Please enter a valid 4-digit postal code</div>
                                        </div>
                                        <div class="mb-4">
                                            <label for="weight" class="form-label">
                                                Parcel Weight (kg)
                                                <i class="bi bi-question-circle text-muted ms-1" data-bs-toggle="tooltip" title="Enter the weight of your parcel in kilograms. Minimum 0.1kg, maximum depends on service type."></i>
                                            </label>
                                            <input 
                                                type="number" 
                                                class="form-control" 
                                                id="weight" 
                                                name="weight"
                                                placeholder="e.g., 2.5"
                                                step="0.1"
                                                min="0.1"
                                                max="100"
                                                required
                                            >
                                            <div class="invalid-feedback">Please enter a valid weight (0.1 - 100 kg)</div>
                                        </div>
                                        <button type="submit" class="btn btn-accent btn-lg w-100" id="quoteBtn">
                                            <span class="btn-text"><i class="bi bi-calculator me-2"></i>Get Quote</span>
                                            <span class="btn-loading d-none">
                                                <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                                                Calculating...
                                            </span>
                                        </button>
                                    </form>
                                    <!-- Cache Info -->
                                    <div id="cacheInfo" class="d-none mt-3 d-flex justify-content-between align-items-center text-muted small">
                                        <span>Results cached for 5 minutes</span>
                                        <button type="button" class="btn btn-link btn-sm p-0" id="refreshBtn">
                                            <i class="bi bi-arrow-clockwise me-1"></i>Refresh
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Results Column -->
                        <div class="col-lg-7">
                            <!-- Loading Spinner -->
                            <div id="loadingSpinner" class="card shadow-card d-none">
                                <div class="card-body text-center py-5">
                                    <div class="spinner-border text-accent" role="status" style="width: 3rem; height: 3rem;">
                                        <span class="visually-hidden">Loading...</span>
                                    </div>
                                    <p class="mt-3 text-muted">Calculating shipping options...</p>
                                </div>
                            </div>

                            <!-- Error Alert -->
                            <div id="errorAlert" class="alert alert-danger d-none" role="alert">
                                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                                <strong>Quote Error:</strong> <span id="errorMessage"></span>
                            </div>

                            <!-- Results Container -->
                            <div id="resultsContainer" class="d-none animate-slide-up">
                                <!-- Header with Sort -->
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <h5 class="fw-bold mb-0">Available Shipping Options</h5>
                                    <div class="d-flex align-items-center gap-2">
                                        <i class="bi bi-sort-down text-muted"></i>
                                        <select class="form-select form-select-sm" id="sortSelect" style="width: auto;">
                                            <option value="price-asc">Price: Low to High</option>
                                            <option value="price-desc">Price: High to Low</option>
                                            <option value="weight-desc">Weight Capacity</option>
                                            <option value="name-asc">Name A-Z</option>
                                        </select>
                                    </div>
                                </div>

                                <!-- Delivery Summary -->
                                <div class="card border-info bg-info bg-opacity-10 mb-4">
                                    <div class="card-body py-3">
                                        <div class="row text-center g-3" id="deliverySummary">
                                            <!-- Populated by JavaScript -->
                                        </div>
                                    </div>
                                </div>

                                <!-- Services List -->
                                <div id="servicesList">
                                    <!-- Populated by JavaScript -->
                                </div>
                            </div>

                            <!-- Initial State -->
                            <div id="initialState" class="card shadow-card">
                                <div class="card-body text-center py-5">
                                    <i class="bi bi-box text-muted" style="font-size: 3rem;"></i>
                                    <h5 class="mt-3 text-muted">Enter your parcel details</h5>
                                    <p class="text-muted small">Fill in the form to see available shipping options and prices</p>
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
    <script src="js/quote.js"></script>
</body>
</html>
