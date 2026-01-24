/**
 * Quote Page JavaScript
 * Handles AJAX form submission, caching, sorting, and result display
 */

// Cache storage
const quoteCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Current quote data for sorting
let currentQuoteData = null;
let currentServices = [];

// DOM Elements
const form = document.getElementById('quoteForm');
const quoteBtn = document.getElementById('quoteBtn');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorAlert = document.getElementById('errorAlert');
const errorMessage = document.getElementById('errorMessage');
const resultsContainer = document.getElementById('resultsContainer');
const initialState = document.getElementById('initialState');
const cacheInfo = document.getElementById('cacheInfo');
const refreshBtn = document.getElementById('refreshBtn');
const sortSelect = document.getElementById('sortSelect');

// Current form data for refresh
let currentFormData = null;

// Initialize tooltips
document.addEventListener('DOMContentLoaded', function() {
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    [...tooltipTriggerList].map(el => new bootstrap.Tooltip(el));
});

// Form submission handler
form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Validate form
    if (!form.checkValidity()) {
        e.stopPropagation();
        form.classList.add('was-validated');
        return;
    }
    
    const formData = {
        suburb: document.getElementById('suburb').value.trim(),
        postalCode: document.getElementById('postalCode').value.trim(),
        weight: document.getElementById('weight').value.trim(),
        rfCode: 'JNB'
    };
    
    currentFormData = formData;
    await fetchQuoteData(formData);
});

// Input validation - clear on change
form.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', function() {
        this.classList.remove('is-invalid');
    });
});

// Refresh button handler
refreshBtn.addEventListener('click', function() {
    if (currentFormData) {
        // Clear cache for this quote
        const cacheKey = getCacheKey(currentFormData);
        quoteCache.delete(cacheKey);
        fetchQuoteData(currentFormData);
    }
});

// Sort change handler
sortSelect.addEventListener('change', function() {
    if (currentServices.length > 0) {
        renderServices(sortServices(currentServices, this.value));
    }
});

// Generate cache key from form data
function getCacheKey(data) {
    return `${data.suburb}-${data.postalCode}-${data.weight}-${data.rfCode}`;
}

// Fetch quote data with caching
async function fetchQuoteData(formData) {
    const cacheKey = getCacheKey(formData);
    
    // Check cache first
    const cached = quoteCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        displayResults(cached.data);
        return;
    }
    
    // Show loading state
    setLoadingState(true);
    hideError();
    resultsContainer.classList.add('d-none');
    initialState.classList.add('d-none');
    
    try {
        const response = await fetch('api/quote.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch quote information');
        }
        
        // Cache the result
        quoteCache.set(cacheKey, {
            data: data,
            timestamp: Date.now()
        });
        
        displayResults(data);
        
    } catch (error) {
        showError(error.message);
        initialState.classList.remove('d-none');
    } finally {
        setLoadingState(false);
    }
}

// Display results
function displayResults(data) {
    currentQuoteData = data;
    currentServices = data.services || [];
    
    // Delivery summary
    let summaryHtml = '';
    
    if (data.delivery_timeframe_days) {
        summaryHtml += `
            <div class="col-sm-4">
                <small class="text-muted">Delivery Time</small>
                <p class="fw-bold mb-0">${escapeHtml(data.delivery_timeframe_days)} days</p>
            </div>
        `;
    }
    
    if (data.from && data.delfranchise) {
        summaryHtml += `
            <div class="col-sm-4">
                <small class="text-muted">Route</small>
                <p class="fw-bold mb-0">${escapeHtml(data.from)} → ${escapeHtml(data.delfranchise)}</p>
            </div>
        `;
    }
    
    const areaType = data.isRural ? 'Rural' : 'Metro';
    const satDelivery = data.isSaturdayDeliveryAvailable ? ' • Sat Delivery' : '';
    summaryHtml += `
        <div class="col-sm-4">
            <small class="text-muted">Delivery Area</small>
            <p class="fw-bold mb-0">${areaType}${satDelivery}</p>
        </div>
    `;
    
    document.getElementById('deliverySummary').innerHTML = summaryHtml;
    
    // Render services with current sort
    renderServices(sortServices(currentServices, sortSelect.value));
    
    // Show results
    resultsContainer.classList.remove('d-none');
    cacheInfo.classList.remove('d-none');
    initialState.classList.add('d-none');
}

// Sort services
function sortServices(services, sortBy) {
    return [...services].sort((a, b) => {
        switch (sortBy) {
            case 'price-asc':
                return a.totalprice_normal - b.totalprice_normal;
            case 'price-desc':
                return b.totalprice_normal - a.totalprice_normal;
            case 'weight-desc':
                return (b.weightlimit || 0) - (a.weightlimit || 0);
            case 'name-asc':
                return a.name.localeCompare(b.name);
            default:
                return 0;
        }
    });
}

// Render services list
function renderServices(services) {
    let html = '';
    const isSortedByPrice = sortSelect.value === 'price-asc';
    
    services.forEach((service, index) => {
        const isCheapest = isSortedByPrice && index === 0;
        
        html += `
            <div class="card service-card shadow-card mb-3">
                <div class="d-flex">
                    <div class="service-indicator"></div>
                    <div class="card-body d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3">
                        <div>
                            <div class="d-flex align-items-center gap-2 mb-2">
                                <i class="bi bi-truck text-accent"></i>
                                <span class="fw-bold">${escapeHtml(service.name)}</span>
                                ${isCheapest ? '<span class="badge badge-cheapest">Cheapest</span>' : ''}
                            </div>
                            <div class="d-flex flex-wrap gap-2">
                                ${service.type ? `<span class="badge bg-light text-dark">${escapeHtml(service.type)}</span>` : ''}
                                ${service.weightlimit ? `<span class="badge bg-light text-dark">Up to ${escapeHtml(service.weightlimit)}kg</span>` : ''}
                                ${service.labelcolour_pretty ? `<span class="badge bg-light text-dark">${escapeHtml(service.labelcolour_pretty)}</span>` : ''}
                            </div>
                        </div>
                        <div class="text-sm-end">
                            <div class="d-flex align-items-center gap-1 text-accent fw-bold fs-5">
                                <i class="bi bi-currency-dollar"></i>
                                ${formatPrice(service.totalprice_normal)}
                            </div>
                            ${service.excess_label ? `<small class="text-muted">${escapeHtml(service.excess_label)}</small>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    if (services.length === 0) {
        html = '<p class="text-center text-muted">No shipping options available for this destination</p>';
    }
    
    document.getElementById('servicesList').innerHTML = html;
}

// Format price
function formatPrice(price) {
    return new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
        minimumFractionDigits: 2
    }).format(price);
}

// UI State helpers
function setLoadingState(loading) {
    form.querySelectorAll('input, button').forEach(el => el.disabled = loading);
    
    const btnText = quoteBtn.querySelector('.btn-text');
    const btnLoading = quoteBtn.querySelector('.btn-loading');
    
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
