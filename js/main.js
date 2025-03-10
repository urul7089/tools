// Import analytics module
import analytics from './analytics.js';

// Load header and footer
document.addEventListener('DOMContentLoaded', function() {
    // Load header
    fetch('/components/header.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('header-placeholder').innerHTML = data;
            initializeNavigation();
        });

    // Load footer
    fetch('/components/footer.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('footer-placeholder').innerHTML = data;
        });

    // Initialize search functionality
    initializeSearch();
    
    // Load categories and tools if on home page
    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
        loadCategories();
        loadFeaturedTools();
    }

    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Track page view
    const pageName = document.querySelector('h1')?.textContent || 'Home';
    analytics.trackToolUsage(pageName, 'page_view');
});

// Initialize navigation functionality
function initializeNavigation() {
    // Add any additional navigation initialization here
    const dropdowns = document.querySelectorAll('.dropdown-toggle');
    dropdowns.forEach(dropdown => {
        dropdown.addEventListener('click', function(e) {
            e.preventDefault();
            const dropdownMenu = this.nextElementSibling;
            dropdownMenu.classList.toggle('show');
        });
    });
}

// Search functionality
function initializeSearch() {
    const searchInput = document.getElementById('toolSearch');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function(e) {
            const searchTerm = e.target.value.toLowerCase();
            filterTools(searchTerm);
        }, 300));
    }
}

// Debounce function to limit search frequency
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Filter tools based on search term
function filterTools(searchTerm) {
    const toolCards = document.querySelectorAll('.tool-card');
    toolCards.forEach(card => {
        const title = card.querySelector('.card-title').textContent.toLowerCase();
        const description = card.querySelector('.card-text').textContent.toLowerCase();
        
        if (title.includes(searchTerm) || description.includes(searchTerm)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

// Load categories
function loadCategories() {
    const categories = [
        { name: 'Image Tools', icon: 'fa-image', count: 10 },
        { name: 'SEO Tools', icon: 'fa-search', count: 10 },
        { name: 'Text Tools', icon: 'fa-font', count: 10 },
        { name: 'Developer Tools', icon: 'fa-code', count: 10 },
        { name: 'Math & Calculators', icon: 'fa-calculator', count: 10 },
        { name: 'Unit Converters', icon: 'fa-exchange-alt', count: 10 }
    ];

    const container = document.getElementById('categories-container');
    if (container) {
        categories.forEach(category => {
            const categoryHtml = `
                <div class="col-md-4 col-lg-3 mb-4">
                    <div class="category-card">
                        <i class="fas ${category.icon} category-icon"></i>
                        <h3 class="h5">${category.name}</h3>
                        <p class="text-muted">${category.count} tools</p>
                        <a href="/categories/${category.name.toLowerCase().replace(/\s+/g, '-')}.html" 
                           class="btn btn-primary btn-sm">View All</a>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', categoryHtml);
        });
    }
}

// Load featured tools
function loadFeaturedTools() {
    const featuredTools = [
        {
            name: 'Image to PNG Converter',
            description: 'Convert any image to PNG format easily',
            icon: 'fa-image',
            url: '/tools/image-to-png.html'
        },
        {
            name: 'Word Counter',
            description: 'Count words, characters, and paragraphs',
            icon: 'fa-calculator',
            url: '/tools/word-counter.html'
        },
        {
            name: 'Meta Tag Generator',
            description: 'Generate SEO-friendly meta tags',
            icon: 'fa-tags',
            url: '/tools/meta-tag-generator.html'
        }
    ];

    const container = document.getElementById('featured-tools-container');
    if (container) {
        featuredTools.forEach(tool => {
            const toolHtml = `
                <div class="col-md-4 mb-4">
                    <div class="card tool-card h-100">
                        <div class="card-body text-center">
                            <i class="fas ${tool.icon} tool-icon"></i>
                            <h3 class="card-title h5">${tool.name}</h3>
                            <p class="card-text text-muted">${tool.description}</p>
                            <a href="${tool.url}" class="btn btn-primary">Use Tool</a>
                        </div>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', toolHtml);
        });
    }
}

// Show loading spinner
function showLoading() {
    const spinner = document.querySelector('.loading-spinner');
    if (spinner) {
        spinner.classList.add('active');
    }
}

// Hide loading spinner
function hideLoading() {
    const spinner = document.querySelector('.loading-spinner');
    if (spinner) {
        spinner.classList.remove('active');
    }
}

// Generic error handler
function handleError(error) {
    console.error('An error occurred:', error);
    // You can implement a more user-friendly error display here
} 