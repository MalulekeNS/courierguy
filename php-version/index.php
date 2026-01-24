<?php
/**
 * Fastway Courier - Home Page
 * Technical Assessment Demo Application
 */
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fastway Couriers SA - Fast, Reliable Courier Services</title>
    <meta name="description" content="Track your parcels in real-time and get instant shipping quotes. Your trusted partner for courier services across South Africa.">
    
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

    <!-- Hero Section -->
    <section class="hero-section py-5">
        <div class="hero-pattern"></div>
        <div class="container position-relative">
            <div class="row justify-content-center">
                <div class="col-lg-8 text-center">
                    <h1 class="display-4 fw-bold text-white mb-4 animate-fade-in">
                        Fast, Reliable <span class="text-accent">Courier Services</span>
                    </h1>
                    <p class="lead text-white-50 mb-5 animate-slide-up">
                        Track your parcels in real-time and get instant shipping quotes.
                        Your trusted partner for courier services across South Africa.
                    </p>
                </div>
            </div>
        </div>
        <!-- Decorative Wave -->
        <div class="hero-wave">
            <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#f8fafc"/>
            </svg>
        </div>
    </section>

    <!-- Features Section -->
    <section class="py-5">
        <div class="container">
            <div class="text-center mb-5">
                <h2 class="fw-bold display-6">What would you like to do?</h2>
                <p class="text-muted">Choose from our quick actions below</p>
            </div>
            <div class="row justify-content-center g-4">
                <!-- Track Parcel Card -->
                <div class="col-md-6 col-lg-5">
                    <div class="card feature-card h-100 shadow-card">
                        <div class="card-body p-4">
                            <div class="feature-icon bg-accent-soft mb-3">
                                <i class="bi bi-box-seam text-accent"></i>
                            </div>
                            <h3 class="card-title fw-bold">Track Your Parcel</h3>
                            <p class="card-text text-muted">
                                Enter your tracking number to see real-time status updates and location information for your shipment.
                            </p>
                            <a href="track.php" class="btn btn-accent mt-3">
                                <i class="bi bi-search me-2"></i>Track Now
                            </a>
                        </div>
                    </div>
                </div>
                <!-- Get Quote Card -->
                <div class="col-md-6 col-lg-5">
                    <div class="card feature-card h-100 shadow-card">
                        <div class="card-body p-4">
                            <div class="feature-icon bg-accent-soft mb-3">
                                <i class="bi bi-calculator text-accent"></i>
                            </div>
                            <h3 class="card-title fw-bold">Get a Quote</h3>
                            <p class="card-text text-muted">
                                Calculate shipping costs instantly by entering your destination, postal code, and parcel weight.
                            </p>
                            <a href="quote.php" class="btn btn-accent mt-3">
                                <i class="bi bi-currency-dollar me-2"></i>Get Quote
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Benefits Section -->
    <section class="py-5 bg-light">
        <div class="container">
            <div class="text-center mb-5">
                <h2 class="fw-bold display-6">Why Choose Fastway?</h2>
                <p class="text-muted">Trusted by thousands of customers across South Africa</p>
            </div>
            <div class="row g-4">
                <div class="col-sm-6 col-lg-3">
                    <div class="card benefit-card h-100 shadow-sm">
                        <div class="card-body text-center p-4">
                            <div class="benefit-icon mb-3">
                                <i class="bi bi-truck text-accent"></i>
                            </div>
                            <h5 class="fw-bold">Fast Delivery</h5>
                            <p class="text-muted small mb-0">Reliable next-day and same-day delivery options</p>
                        </div>
                    </div>
                </div>
                <div class="col-sm-6 col-lg-3">
                    <div class="card benefit-card h-100 shadow-sm">
                        <div class="card-body text-center p-4">
                            <div class="benefit-icon mb-3">
                                <i class="bi bi-shield-check text-accent"></i>
                            </div>
                            <h5 class="fw-bold">Secure Handling</h5>
                            <p class="text-muted small mb-0">Your parcels are handled with care and fully insured</p>
                        </div>
                    </div>
                </div>
                <div class="col-sm-6 col-lg-3">
                    <div class="card benefit-card h-100 shadow-sm">
                        <div class="card-body text-center p-4">
                            <div class="benefit-icon mb-3">
                                <i class="bi bi-clock text-accent"></i>
                            </div>
                            <h5 class="fw-bold">Real-time Tracking</h5>
                            <p class="text-muted small mb-0">Track your shipment every step of the way</p>
                        </div>
                    </div>
                </div>
                <div class="col-sm-6 col-lg-3">
                    <div class="card benefit-card h-100 shadow-sm">
                        <div class="card-body text-center p-4">
                            <div class="benefit-icon mb-3">
                                <i class="bi bi-geo-alt text-accent"></i>
                            </div>
                            <h5 class="fw-bold">Nationwide Coverage</h5>
                            <p class="text-muted small mb-0">Delivering to every corner of South Africa</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Test Info Section -->
    <section class="py-5">
        <div class="container">
            <div class="row justify-content-center">
                <div class="col-lg-8">
                    <div class="alert alert-info border-info">
                        <h5 class="alert-heading fw-bold">
                            <i class="bi bi-info-circle me-2"></i>Test Tracking Numbers
                        </h5>
                        <p class="mb-3">Use these tracking numbers for testing the track and trace feature:</p>
                        <div class="d-flex flex-wrap gap-2">
                            <code class="bg-white px-3 py-2 rounded shadow-sm">Z60000983328</code>
                            <code class="bg-white px-3 py-2 rounded shadow-sm">Z30002408261</code>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <?php include 'includes/footer.php'; ?>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
