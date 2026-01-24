<?php
/**
 * Navbar Component
 * Responsive Bootstrap 5 navigation
 */

// Get current page for active state
$currentPage = basename($_SERVER['PHP_SELF']);
?>
<nav class="navbar navbar-expand-md navbar-dark bg-primary sticky-top shadow">
    <div class="container">
        <!-- Logo -->
        <a class="navbar-brand d-flex align-items-center" href="index.php">
            <div class="logo-icon me-2">
                <i class="bi bi-box-seam"></i>
            </div>
            <span class="fw-bold">Fastway</span>
        </a>

        <!-- Mobile Toggle -->
        <button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
        </button>

        <!-- Navigation Links -->
        <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav ms-auto">
                <li class="nav-item">
                    <a class="nav-link <?php echo $currentPage === 'index.php' ? 'active' : ''; ?>" href="index.php">
                        <i class="bi bi-house me-1"></i>Home
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link <?php echo $currentPage === 'track.php' ? 'active' : ''; ?>" href="track.php">
                        <i class="bi bi-box-seam me-1"></i>Track Parcel
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link <?php echo $currentPage === 'quote.php' ? 'active' : ''; ?>" href="quote.php">
                        <i class="bi bi-calculator me-1"></i>Get Quote
                    </a>
                </li>
            </ul>
        </div>
    </div>
</nav>
