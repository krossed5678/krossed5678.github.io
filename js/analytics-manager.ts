/* AnalyticsManager (TypeScript)
   - Converted from analytics-manager.js
   - Exposes window.AnalyticsManager and window.debugAnalytics in dev
*/

declare global {
    interface Window {
        AnalyticsManager?: any;
        ProductionErrorHandler?: any;
        BrowserCompatibility?: any;
        PerformanceManager?: any;
        debugAnalytics?: any;
    }
}

export class AnalyticsManager {
    isEnabled: boolean;
    sessionId: string;
    startTime: number;
    events: Array<any>;
    maxEvents: number;

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

        const acceptBtn = document.getElementById('analytics-accept');
        const declineBtn = document.getElementById('analytics-decline');

        acceptBtn?.addEventListener('click', () => {
            localStorage.setItem('analytics-consent', 'true');
            this.isEnabled = true;
            this.initializeTracking();
            banner.remove();
            this.showNotification('Analytics enabled. Thank you for helping us improve!', 'info');
        });

        declineBtn?.addEventListener('click', () => {
            localStorage.setItem('analytics-consent', 'false');
            this.isEnabled = false;
            banner.remove();
            this.showNotification('Analytics disabled. Your privacy is respected.', 'info');
        });
    }

    initializeTracking() {
        console.info('Local analytics initialized - no external tracking');
        this.setupErrorTracking();
        this.setupPerformanceTracking();
    }

    setupSessionTracking() {
        this.trackEvent('session_start', {
            browser: window.BrowserCompatibility?.browserInfo || 'unknown',
            mobile: window.BrowserCompatibility?.features?.mobile || false,
            viewport: `${window.innerWidth}x${window.innerHeight}`
        });

        window.addEventListener('beforeunload', () => {
            this.trackSessionEnd();
        });

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.trackEvent('page_hidden');
            } else {
                this.trackEvent('page_visible');
            }
        });
    }

    setupErrorTracking() {
        if (window.ProductionErrorHandler) {
            const originalHandle = window.ProductionErrorHandler.handleError;
            window.ProductionErrorHandler.handleError = (type: any, error: any, context: any) => {
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
        if (window.PerformanceManager) {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const metrics = window.PerformanceManager.metrics;
                    if (metrics?.pageLoad && this.isEnabled) {
                        this.trackEvent('performance', {
                            page_load: metrics.pageLoad.loadComplete,
                            config_load: metrics.configLoad?.duration || 0,
                            speech_latency: window.PerformanceManager.getAverageSpeechLatency?.(),
                            memory_usage: window.PerformanceManager.getCurrentMemoryUsage?.()
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
    }

    trackEvent(eventName: string, properties: Record<string, any> = {}) {
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

        this.events.push(event);
        if (this.events.length > this.maxEvents) {
            this.events.shift();
        }

        if (window.ProductionErrorHandler && window.ProductionErrorHandler.isDevelopment?.()) {
            console.log('Analytics Event:', eventName, properties);
        }
    }

    trackBookingAttempt(step: string) {
        this.trackEvent('booking_attempt', { category: 'Bookings', step });
    }

    trackBookingComplete(booking: any) {
        this.trackEvent('booking_complete', {
            category: 'Bookings',
            party_size: booking.partySize,
            has_special_requests: !!(booking.specialRequests && booking.specialRequests.trim()),
            contact_method: booking.phone ? 'phone' : booking.email ? 'email' : 'none'
        });
    }

    trackVoiceUsage(action: string, success = true) {
        this.trackEvent('voice_interaction', { category: 'Voice', action, success });
    }

    trackFeatureUsage(feature: string) {
        this.trackEvent('feature_used', { category: 'Features', feature });
    }

    trackConfigurationLoad(success: boolean, loadTime: number) {
        this.trackEvent('config_load', { category: 'Configuration', success, load_time: loadTime });
    }

    trackUserFlow(step: string, category = 'User Flow') {
        this.trackEvent('user_flow', { category, step });
    }

    trackSessionEnd() {
        if (!this.isEnabled) return;

        const sessionDuration = Date.now() - this.startTime;

        this.trackEvent('session_end', { duration: sessionDuration, events_count: this.events.length });
        this.flush();
    }

    trackConversion(type: string, value: any = null) {
        this.trackEvent('conversion', { category: 'Conversions', type, value });
    }

    trackExperiment(experimentName: string, variant: string) {
        this.trackEvent('experiment_view', { category: 'Experiments', experiment: experimentName, variant });
        sessionStorage.setItem(`experiment_${experimentName}`, variant);
    }

    getExperimentVariant(experimentName: string, variants: string[] = ['A', 'B']) {
        let variant = sessionStorage.getItem(`experiment_${experimentName}`);
        if (!variant) {
            variant = variants[Math.floor(Math.random() * variants.length)];
            sessionStorage.setItem(`experiment_${experimentName}`, variant);
        }
        return variant;
    }

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
            dataTypes: ['Page views', 'Feature usage', 'Error reports (anonymous)', 'Performance metrics', 'User flow patterns'],
            dataNotCollected: ['Personal information', 'Actual conversation content', 'Customer booking details', 'IP addresses', 'Cross-site tracking']
        };
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    showNotification(message: string, type: string) {
        if (window.ProductionErrorHandler) {
            window.ProductionErrorHandler.showNotification(message, type, 3000);
        }
    }

    flush() {
        if (this.events.length > 0 && this.isEnabled) {
            console.info(`Flushed ${this.events.length} analytics events`);
        }
    }
}

const analyticsManager = new AnalyticsManager();
window.AnalyticsManager = analyticsManager;

if (window.ProductionErrorHandler && window.ProductionErrorHandler.isDevelopment?.()) {
    window.debugAnalytics = {
        events: window.AnalyticsManager!.events,
        export: () => window.AnalyticsManager!.exportAnalyticsData(),
        clear: () => window.AnalyticsManager!.clearAnalyticsData(),
        privacy: () => window.AnalyticsManager!.getPrivacyReport(),
        track: (name: string, props?: any) => window.AnalyticsManager!.trackEvent(name, props)
    };
}

export default analyticsManager;
