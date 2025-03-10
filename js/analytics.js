// Analytics Module for Multi-Tools
class ToolAnalytics {
    constructor() {
        this.initGA();
        this.bindEvents();
    }

    // Initialize Google Analytics
    initGA() {
        // Google Analytics 4 initialization
        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX'; // Replace with actual GA4 ID
        document.head.appendChild(script);

        window.dataLayer = window.dataLayer || [];
        function gtag() { dataLayer.push(arguments); }
        gtag('js', new Date());
        gtag('config', 'G-XXXXXXXXXX'); // Replace with actual GA4 ID
    }

    // Track tool usage
    trackToolUsage(toolName, action) {
        gtag('event', action, {
            'event_category': 'Tool Usage',
            'event_label': toolName,
            'value': 1
        });
    }

    // Track formatting operations
    trackFormatting(toolName, inputSize, outputSize, duration) {
        gtag('event', 'format', {
            'event_category': 'Formatting',
            'event_label': toolName,
            'input_size': inputSize,
            'output_size': outputSize,
            'duration': duration
        });
    }

    // Track validation results
    trackValidation(toolName, isValid, errorCount) {
        gtag('event', 'validate', {
            'event_category': 'Validation',
            'event_label': toolName,
            'is_valid': isValid,
            'error_count': errorCount
        });
    }

    // Track feature usage
    trackFeatureUsage(toolName, featureName) {
        gtag('event', 'use_feature', {
            'event_category': 'Features',
            'event_label': `${toolName} - ${featureName}`
        });
    }

    // Track downloads
    trackDownload(toolName, format) {
        gtag('event', 'download', {
            'event_category': 'Downloads',
            'event_label': `${toolName} - ${format}`
        });
    }

    // Track errors
    trackError(toolName, errorType, errorMessage) {
        gtag('event', 'error', {
            'event_category': 'Errors',
            'event_label': `${toolName} - ${errorType}`,
            'description': errorMessage
        });
    }

    // Track navigation
    trackNavigation(fromPage, toPage) {
        gtag('event', 'navigation', {
            'event_category': 'Navigation',
            'event_label': `${fromPage} to ${toPage}`
        });
    }

    // Track tool performance
    trackPerformance(toolName, metric, value) {
        gtag('event', 'performance', {
            'event_category': 'Performance',
            'event_label': `${toolName} - ${metric}`,
            'value': value
        });
    }

    // Bind events to track
    bindEvents() {
        document.addEventListener('DOMContentLoaded', () => {
            // Track tool card clicks
            document.querySelectorAll('.tool-card').forEach(card => {
                card.addEventListener('click', (e) => {
                    const toolName = card.querySelector('h3').textContent;
                    this.trackToolUsage(toolName, 'card_click');
                });
            });

            // Track format button clicks
            document.querySelectorAll('#formatBtn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const toolName = document.querySelector('h1').textContent;
                    const startTime = performance.now();
                    const inputSize = document.querySelector('.editor').value.length;

                    // Track after formatting is complete
                    setTimeout(() => {
                        const duration = performance.now() - startTime;
                        const outputSize = document.querySelector('#output').textContent.length;
                        this.trackFormatting(toolName, inputSize, outputSize, duration);
                    }, 0);
                });
            });

            // Track validation
            document.querySelectorAll('#validateBtn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const toolName = document.querySelector('h1').textContent;
                    const errorElements = document.querySelectorAll('.validation-error');
                    this.trackValidation(toolName, errorElements.length === 0, errorElements.length);
                });
            });

            // Track downloads
            document.querySelectorAll('#downloadBtn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const toolName = document.querySelector('h1').textContent;
                    const format = document.querySelector('#outputFormat')?.value || 'default';
                    this.trackDownload(toolName, format);
                });
            });

            // Track feature usage
            document.querySelectorAll('.feature-toggle').forEach(toggle => {
                toggle.addEventListener('change', (e) => {
                    const toolName = document.querySelector('h1').textContent;
                    const featureName = e.target.dataset.feature;
                    this.trackFeatureUsage(toolName, featureName);
                });
            });

            // Track performance
            if (window.PerformanceObserver) {
                const observer = new PerformanceObserver((list) => {
                    const toolName = document.querySelector('h1').textContent;
                    list.getEntries().forEach(entry => {
                        this.trackPerformance(toolName, entry.name, entry.duration);
                    });
                });
                observer.observe({ entryTypes: ['measure'] });
            }
        });

        // Track errors
        window.addEventListener('error', (e) => {
            const toolName = document.querySelector('h1')?.textContent || 'Unknown Tool';
            this.trackError(toolName, 'runtime', e.message);
        });

        // Track navigation
        window.addEventListener('beforeunload', () => {
            const fromPage = document.querySelector('h1')?.textContent || 'Unknown Page';
            this.trackNavigation(fromPage, 'Exit');
        });
    }
}

// Initialize analytics
const analytics = new ToolAnalytics();
export default analytics; 