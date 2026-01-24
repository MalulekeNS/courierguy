/**
 * Tracking Page JavaScript
 * Handles AJAX form submission, caching, and result display
 */

// Cache storage
const trackingCache = new Map();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

// DOM Elements
const form = document.getElementById('trackingForm');
const trackingInput = document.getElementById('trackingNumber');
const trackBtn = document.getElementById('trackBtn');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorAlert = document.getElementById('errorAlert');
const errorMessage = document.getElementById('errorMessage');
const resultsContainer = document.getElementById('resultsContainer');
const cacheInfo = document.getElementById('cacheInfo');
const refreshBtn = document.getElementById('refreshBtn');

// Current tracking number for refresh
let currentTrackingNumber = null;

// Initialize tooltips
document.addEventListener('DOMContentLoaded', function() {
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    [...tooltipTriggerList].map(el => new bootstrap.Tooltip(el));
});

// Form submission handler
form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Validate input
    const trackingNumber = trackingInput.value.trim().toUpperCase();
    
    if (!validateTrackingNumber(trackingNumber)) {
        trackingInput.classList.add('is-invalid');
        return;
    }
    
    trackingInput.classList.remove('is-invalid');
    trackingInput.value = trackingNumber;
    currentTrackingNumber = trackingNumber;
    
    await fetchTrackingData(trackingNumber);
});

// Input validation
function validateTrackingNumber(number) {
    // Must start with letter followed by 8-15 digits
    const pattern = /^[A-Z][0-9]{8,15}$/;
    return pattern.test(number);
}

// Clear validation on input
trackingInput.addEventListener('input', function() {
    this.classList.remove('is-invalid');
    // Auto uppercase
    this.value = this.value.toUpperCase();
});

// Refresh button handler
refreshBtn.addEventListener('click', function() {
    if (currentTrackingNumber) {
        // Clear cache for this tracking number
        trackingCache.delete(currentTrackingNumber);
        fetchTrackingData(currentTrackingNumber);
    }
});

// Fetch tracking data with caching
async function fetchTrackingData(trackingNumber) {
    // Check cache first
    const cached = trackingCache.get(trackingNumber);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        displayResults(cached.data);
        return;
    }
    
    // Show loading state
    setLoadingState(true);
    hideError();
    resultsContainer.classList.add('d-none');
    
    try {
        const response = await fetch('api/track.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ trackingNumber })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch tracking information');
        }
        
        // Cache the result
        trackingCache.set(trackingNumber, {
            data: data,
            timestamp: Date.now()
        });
        
        displayResults(data);
        
    } catch (error) {
        showError(error.message);
    } finally {
        setLoadingState(false);
    }
}

// Display results
function displayResults(data) {
    // Update status
    const isDelivered = data.HasDScan;
    const statusText = isDelivered ? 'Delivered' : (data.Scans?.[0]?.StatusDescription || 'In Transit');
    
    document.getElementById('currentStatus').textContent = statusText;
    document.getElementById('labelNumber').textContent = data.LabelNumber || '-';
    
    // Update status icon
    const statusIcon = document.getElementById('statusIconContainer');
    if (isDelivered) {
        statusIcon.innerHTML = '<i class="bi bi-check-circle-fill"></i>';
        statusIcon.className = 'status-icon success';
    } else {
        statusIcon.innerHTML = '<i class="bi bi-clock-fill"></i>';
        statusIcon.className = 'status-icon info';
    }
    
    // Delivery info
    let deliveryInfoHtml = '';
    
    if (data.DeliveryETADate) {
        deliveryInfoHtml += `
            <div class="col-sm-4">
                <small class="text-muted">Delivery ETA</small>
                <p class="fw-bold mb-0">${escapeHtml(data.DeliveryETADate)}</p>
            </div>
        `;
    }
    
    if (data.LastScanDate) {
        deliveryInfoHtml += `
            <div class="col-sm-4">
                <small class="text-muted">Last Known Scan</small>
                <p class="fw-bold mb-0">${escapeHtml(data.LastScanDate)}</p>
            </div>
        `;
    }
    
    if (data.PickupFranchise || data.DeliveryFranchise) {
        deliveryInfoHtml += `
            <div class="col-sm-4">
                <small class="text-muted">Route</small>
                <p class="fw-bold mb-0">${escapeHtml(data.PickupFranchise || '')} → ${escapeHtml(data.DeliveryFranchise || '')}</p>
            </div>
        `;
    }
    
    document.getElementById('deliveryInfo').innerHTML = deliveryInfoHtml;
    
    // Timeline
    const scans = data.Scans || [];
    document.getElementById('scanCount').textContent = scans.length;
    
    let timelineHtml = '';
    if (scans.length > 0) {
        scans.forEach((scan, index) => {
            timelineHtml += `
                <div class="timeline-item">
                    <div class="timeline-dot"></div>
                    <div class="timeline-content">
                        <p class="fw-medium mb-1">${escapeHtml(scan.StatusDescription || scan.Description || '')}</p>
                        ${scan.StatusDescription && scan.Description ? `<p class="text-muted small mb-2">${escapeHtml(scan.Description)}</p>` : ''}
                        <div class="d-flex flex-wrap gap-3 text-muted small">
                            <span><i class="bi bi-calendar me-1"></i>${escapeHtml(scan.Date || '')}</span>
                            ${scan.Name || scan.Franchise ? `<span><i class="bi bi-geo-alt me-1"></i>${escapeHtml(scan.Name || scan.Franchise)}</span>` : ''}
                        </div>
                    </div>
                </div>
            `;
        });
    } else {
        timelineHtml = '<p class="text-center text-muted">No tracking events available</p>';
    }
    
    document.getElementById('timeline').innerHTML = timelineHtml;
    
    // Show results
    resultsContainer.classList.remove('d-none');
    cacheInfo.classList.remove('d-none');
}

// UI State helpers
function setLoadingState(loading) {
    trackingInput.disabled = loading;
    trackBtn.disabled = loading;
    
    const btnText = trackBtn.querySelector('.btn-text');
    const btnLoading = trackBtn.querySelector('.btn-loading');
    
    if (loading) {
        btnText.classList.add('d-none');
        btnLoading.classList.remove('d-none');
        loadingSpinner.classList.remove('d-none');
    } else {
        btnText.classList.remove('d-none');
        btnLoading.classList.add('d-none');
        loadingSpinner.classList.add('d-none');
    }
}

function showError(message) {
    errorMessage.textContent = message;
    errorAlert.classList.remove('d-none');
}

function hideError() {
    errorAlert.classList.add('d-none');
}

// XSS prevention
function escapeHtml(text) {
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
