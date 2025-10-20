class AnalyticsManager {
    constructor() {
        this.isEnabled = false;
        this.sessionId = this.generateSessionId();
        this.startTime = Date.now();
        this.events = [];
        this.maxEvents = 100;
        this.init();
    }

    init() {
        this.checkAnalyticsConsent();
        this.setupSessionTracking();
        this.trackPageView();
    }

    checkAnalyticsConsent() {
        // Check if user has given consent for analytics
        const consent = localStorage.getItem('analytics-consent');
        
        if (consent === null) {
            this.showConsentBanner();
        } else {
            this.isEnabled = consent === 'true';
        }

        if (this.isEnabled) {
            this.initializeTracking();
        }
    }

    showConsentBanner() {
        const banner = document.createElement('div');
        banner.id = 'analytics-consent-banner';
        banner.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 16px;
            border-radius: 8px;
            z-index: 10000;
            max-width: 600px;
            margin: 0 auto;
        `;

        banner.innerHTML = `
            <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div class="text-sm">
                    <p><strong>Analytics & Improvement</strong></p>
                    <p>Help us improve by sharing anonymous usage data. No personal information is collected.</p>
                </div>
                <div class="flex gap-2 flex-shrink-0">
                    <button id="analytics-accept" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm">
                        Accept
                    </button>
                    <button id="analytics-decline" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm">
                        Decline
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(banner);

        // Handle consent responses
        document.getElementById('analytics-accept').addEventListener('click', () => {
            localStorage.setItem('analytics-consent', 'true');
            this.isEnabled = true;
            this.initializeTracking();
            banner.remove();
            this.showNotification('Analytics enabled. Thank you for helping us improve!', 'info');
        });

        document.getElementById('analytics-decline').addEventListener('click', () => {
            localStorage.setItem('analytics-consent', 'false');
            this.isEnabled = false;
            banner.remove();
            this.showNotification('Analytics disabled. Your privacy is respected.', 'info');
        });
    }

    initializeTracking() {
        // Initialize local analytics tracking (no external dependencies)
        console.info('Local analytics initialized - no external tracking');

        // Setup error tracking
        this.setupErrorTracking();
        
        // Setup performance tracking
        this.setupPerformanceTracking();
    }

    setupSessionTracking() {
        // Track session start
        this.trackEvent('session_start', {
            browser: window.BrowserCompatibility?.browserInfo || 'unknown',
            mobile: window.BrowserCompatibility?.features.mobile || false,
            viewport: `${window.innerWidth}x${window.innerHeight}`
        });

        // Track session end
        window.addEventListener('beforeunload', () => {
            this.trackSessionEnd();
        });

        // Track page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.trackEvent('page_hidden');
            } else {
                this.trackEvent('page_visible');
            }
        });
    }

    setupErrorTracking() {
        // Listen for production errors
        if (window.ProductionErrorHandler) {
            const originalHandle = window.ProductionErrorHandler.handleError;
            window.ProductionErrorHandler.handleError = (type, error, context) => {
                const result = originalHandle.call(window.ProductionErrorHandler, type, error, context);
                
                if (this.isEnabled) {
                    this.trackEvent('error', {
                        type: type,
                        message: error?.message || error || 'unknown',
                        context: context
                    });
                }
                
                return result;
            };
        }
    }

    setupPerformanceTracking() {
        // Track performance metrics
        if (window.PerformanceManager) {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const metrics = window.PerformanceManager.metrics;
                    if (metrics.pageLoad && this.isEnabled) {
                        this.trackEvent('performance', {
                            page_load: metrics.pageLoad.loadComplete,
                            config_load: metrics.configLoad?.duration || 0,
                            speech_latency: window.PerformanceManager.getAverageSpeechLatency(),
                            memory_usage: window.PerformanceManager.getCurrentMemoryUsage()
                        });
                    }
                }, 2000);
            });
        }
    }

    trackPageView() {
        if (!this.isEnabled) return;

        this.trackEvent('page_view', {
            page: window.location.pathname,
            title: document.title,
            referrer: document.referrer,
            timestamp: new Date().toISOString()
        });

        // Local page view tracking only
    }

    trackEvent(eventName, properties = {}) {
        if (!this.isEnabled) return;

        const event = {
            name: eventName,
            properties: {
                ...properties,
                session_id: this.sessionId,
                timestamp: new Date().toISOString(),
                page: window.location.pathname
            }
        };

        // Add to local event log
        this.events.push(event);
        if (this.events.length > this.maxEvents) {
            this.events.shift();
        }

        // Local event tracking only

        // Log in development
        if (window.ProductionErrorHandler && window.ProductionErrorHandler.isDevelopment()) {
            console.log('Analytics Event:', eventName, properties);
        }
    }

    // Specific tracking methods
    trackBookingAttempt(step) {
        this.trackEvent('booking_attempt', {
            category: 'Bookings',
            step: step
        });
    }

    trackBookingComplete(booking) {
        this.trackEvent('booking_complete', {
            category: 'Bookings',
            party_size: booking.partySize,
            has_special_requests: !!(booking.specialRequests && booking.specialRequests.trim()),
            contact_method: booking.phone ? 'phone' : booking.email ? 'email' : 'none'
        });
    }

    trackVoiceUsage(action, success = true) {
        this.trackEvent('voice_interaction', {
            category: 'Voice',
            action: action,
            success: success
        });
    }

    trackFeatureUsage(feature) {
        this.trackEvent('feature_used', {
            category: 'Features',
            feature: feature
        });
    }

    trackConfigurationLoad(success, loadTime) {
        this.trackEvent('config_load', {
            category: 'Configuration',
            success: success,
            load_time: loadTime
        });
    }

    trackUserFlow(step, category = 'User Flow') {
        this.trackEvent('user_flow', {
            category: category,
            step: step
        });
    }

    trackSessionEnd() {
        if (!this.isEnabled) return;

        const sessionDuration = Date.now() - this.startTime;
        
        this.trackEvent('session_end', {
            duration: sessionDuration,
            events_count: this.events.length
        });

        // Send any remaining events
        this.flush();
    }

    // Conversion tracking
    trackConversion(type, value = null) {
        this.trackEvent('conversion', {
            category: 'Conversions',
            type: type,
            value: value
        });

        // Local conversion tracking only
    }

    // A/B Testing support
    trackExperiment(experimentName, variant) {
        this.trackEvent('experiment_view', {
            category: 'Experiments',
            experiment: experimentName,
            variant: variant
        });

        // Store variant for session
        sessionStorage.setItem(`experiment_${experimentName}`, variant);
    }

    getExperimentVariant(experimentName, variants = ['A', 'B']) {
        // Check if user already has a variant assigned
        let variant = sessionStorage.getItem(`experiment_${experimentName}`);
        
        if (!variant) {
            // Assign random variant
            variant = variants[Math.floor(Math.random() * variants.length)];
            sessionStorage.setItem(`experiment_${experimentName}`, variant);
        }

        return variant;
    }

    // Data export for analysis
    exportAnalyticsData() {
        const data = {
            sessionId: this.sessionId,
            events: this.events,
            sessionDuration: Date.now() - this.startTime,
            exportTime: new Date().toISOString(),
            userAgent: navigator.userAgent,
            browserFeatures: window.BrowserCompatibility?.features || {}
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-session-${this.sessionId}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Privacy methods
    clearAnalyticsData() {
        this.events = [];
        localStorage.removeItem('analytics-consent');
        sessionStorage.clear();
        this.isEnabled = false;
        
        this.showNotification('Analytics data cleared', 'info');
    }

    getPrivacyReport() {
        return {
            isEnabled: this.isEnabled,
            consentGiven: localStorage.getItem('analytics-consent'),
            eventsStored: this.events.length,
            sessionId: this.sessionId,
            dataTypes: [
                'Page views',
                'Feature usage',
                'Error reports (anonymous)',
                'Performance metrics',
                'User flow patterns'
            ],
            dataNotCollected: [
                'Personal information',
                'Actual conversation content',
                'Customer booking details',
                'IP addresses',
                'Cross-site tracking'
            ]
        };
    }

    // Utility methods
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    showNotification(message, type) {
        if (window.ProductionErrorHandler) {
            window.ProductionErrorHandler.showNotification(message, type, 3000);
        }
    }

    flush() {
        // Send any pending events (would normally send to analytics service)
        if (this.events.length > 0 && this.isEnabled) {
            console.info(`Flushed ${this.events.length} analytics events`);
        }
    }
}

// Create global analytics manager
window.AnalyticsManager = new AnalyticsManager();

// Expose debugging methods
if (window.ProductionErrorHandler && window.ProductionErrorHandler.isDevelopment()) {
    window.debugAnalytics = {
        events: window.AnalyticsManager.events,
        export: () => window.AnalyticsManager.exportAnalyticsData(),
        clear: () => window.AnalyticsManager.clearAnalyticsData(),
        privacy: () => window.AnalyticsManager.getPrivacyReport(),
        track: (name, props) => window.AnalyticsManager.trackEvent(name, props)
    };
}