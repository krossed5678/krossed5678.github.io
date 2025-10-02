/**
 * Performance Monitor and Optimization
 * Tracks performance metrics and provides optimization features
 */

class PerformanceManager {
    constructor() {
        this.metrics = {
            pageLoad: null,
            configLoad: null,
            speechLatency: [],
            renderTimes: [],
            memoryUsage: []
        };
        this.observers = new Map();
        this.init();
    }

    init() {
        this.setupPerformanceObserver();
        this.trackPageLoad();
        this.setupMemoryMonitoring();
        this.setupLazyLoading();
    }

    setupPerformanceObserver() {
        if ('PerformanceObserver' in window) {
            try {
                // Navigation timing
                const navObserver = new PerformanceObserver((list) => {
                    list.getEntries().forEach(entry => {
                        if (entry.entryType === 'navigation') {
                            this.metrics.pageLoad = {
                                domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
                                loadComplete: entry.loadEventEnd - entry.loadEventStart,
                                firstPaint: this.getFirstPaint(),
                                timestamp: Date.now()
                            };
                        }
                    });
                });
                navObserver.observe({ entryTypes: ['navigation'] });

                // Resource timing
                const resourceObserver = new PerformanceObserver((list) => {
                    list.getEntries().forEach(entry => {
                        if (entry.duration > 1000) { // Log slow resources
                            console.warn(`Slow resource: ${entry.name} took ${entry.duration}ms`);
                        }
                    });
                });
                resourceObserver.observe({ entryTypes: ['resource'] });

                this.observers.set('navigation', navObserver);
                this.observers.set('resource', resourceObserver);
            } catch (e) {
                console.warn('Performance Observer not fully supported:', e);
            }
        }
    }

    trackPageLoad() {
        window.addEventListener('load', () => {
            setTimeout(() => {
                this.reportPerformance();
            }, 1000);
        });
    }

    setupMemoryMonitoring() {
        // Monitor memory usage periodically
        setInterval(() => {
            if (performance.memory) {
                const memory = {
                    used: Math.round(performance.memory.usedJSHeapSize / 1048576), // MB
                    total: Math.round(performance.memory.totalJSHeapSize / 1048576),
                    limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576),
                    timestamp: Date.now()
                };

                this.metrics.memoryUsage.push(memory);
                
                // Keep only last 20 measurements
                if (this.metrics.memoryUsage.length > 20) {
                    this.metrics.memoryUsage.shift();
                }

                // Warn if memory usage is high
                if (memory.used > memory.limit * 0.8) {
                    console.warn('High memory usage detected:', memory);
                    this.optimizeMemory();
                }
            }
        }, 30000); // Every 30 seconds
    }

    setupLazyLoading() {
        // Lazy load non-critical resources
        this.lazyLoadImages();
        this.lazyLoadModules();
    }

    lazyLoadImages() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                            imageObserver.unobserve(img);
                        }
                    }
                });
            });

            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        } else {
            // Fallback for older browsers
            document.querySelectorAll('img[data-src]').forEach(img => {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
            });
        }
    }

    lazyLoadModules() {
        // Load non-critical JavaScript modules when needed
        const criticalModules = ['security-manager.js', 'browser-compatibility.js'];
        const nonCriticalModules = ['analytics.js', 'advanced-features.js'];

        // Load non-critical modules after page load
        window.addEventListener('load', () => {
            setTimeout(() => {
                nonCriticalModules.forEach(module => {
                    this.loadScript(`js/${module}`).catch(e => {
                        console.info(`Optional module ${module} not available:`, e);
                    });
                });
            }, 2000);
        });
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Performance tracking methods
    trackConfigLoad(startTime, endTime) {
        this.metrics.configLoad = {
            duration: endTime - startTime,
            timestamp: Date.now()
        };
    }

    trackSpeechLatency(startTime, endTime) {
        const latency = endTime - startTime;
        this.metrics.speechLatency.push({
            duration: latency,
            timestamp: Date.now()
        });

        // Keep only last 10 measurements
        if (this.metrics.speechLatency.length > 10) {
            this.metrics.speechLatency.shift();
        }

        // Warn if speech is consistently slow
        if (this.metrics.speechLatency.length >= 5) {
            const avgLatency = this.metrics.speechLatency.reduce((sum, m) => sum + m.duration, 0) / this.metrics.speechLatency.length;
            if (avgLatency > 2000) { // 2 seconds
                console.warn('Speech recognition is running slowly. Average latency:', avgLatency + 'ms');
            }
        }
    }

    trackRender(component, duration) {
        this.metrics.renderTimes.push({
            component,
            duration,
            timestamp: Date.now()
        });

        // Keep only last 50 measurements
        if (this.metrics.renderTimes.length > 50) {
            this.metrics.renderTimes.shift();
        }

        if (duration > 100) { // Warn about slow renders
            console.warn(`Slow render detected for ${component}: ${duration}ms`);
        }
    }

    // Memory optimization
    optimizeMemory() {
        // Clear old conversation history
        if (window.LocalConversationEngine && window.LocalConversationEngine.conversationHistory) {
            const history = window.LocalConversationEngine.conversationHistory;
            if (history.length > 50) {
                history.splice(0, history.length - 25); // Keep only last 25 messages
            }
        }

        // Clear old error logs
        if (window.ProductionErrorHandler && window.ProductionErrorHandler.errorLog) {
            const errorLog = window.ProductionErrorHandler.errorLog;
            if (errorLog.length > 20) {
                errorLog.splice(0, errorLog.length - 10); // Keep only last 10 errors
            }
        }

        // Clear performance metrics
        this.metrics.speechLatency = this.metrics.speechLatency.slice(-5);
        this.metrics.renderTimes = this.metrics.renderTimes.slice(-25);
        this.metrics.memoryUsage = this.metrics.memoryUsage.slice(-10);

        // Force garbage collection if available (dev tools)
        if (window.gc) {
            window.gc();
        }
    }

    // Utility methods
    getFirstPaint() {
        const paintEntries = performance.getEntriesByType('paint');
        const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
        return firstPaint ? firstPaint.startTime : null;
    }

    reportPerformance() {
        const report = {
            metrics: this.metrics,
            timing: performance.timing,
            navigation: performance.navigation,
            userAgent: navigator.userAgent,
            timestamp: Date.now()
        };

        // Log performance in development
        if (window.ProductionErrorHandler && window.ProductionErrorHandler.isDevelopment()) {
            console.table({
                'Page Load': this.metrics.pageLoad?.loadComplete + 'ms',
                'Config Load': this.metrics.configLoad?.duration + 'ms',
                'Avg Speech Latency': this.getAverageSpeechLatency() + 'ms',
                'Memory Used': this.getCurrentMemoryUsage() + 'MB'
            });
        }

        // Send to analytics if available
        this.sendPerformanceData(report);

        return report;
    }

    getAverageSpeechLatency() {
        if (this.metrics.speechLatency.length === 0) return 0;
        return Math.round(
            this.metrics.speechLatency.reduce((sum, m) => sum + m.duration, 0) / 
            this.metrics.speechLatency.length
        );
    }

    getCurrentMemoryUsage() {
        const latest = this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1];
        return latest ? latest.used : 0;
    }

    sendPerformanceData(report) {
        // Send performance data to local analytics
        if (window.AnalyticsManager) {
            window.AnalyticsManager.trackEvent('performance_metrics', {
                page_load_time: report.metrics.pageLoad?.loadComplete || 0,
                config_load_time: report.metrics.configLoad?.duration || 0,
                speech_latency: this.getAverageSpeechLatency(),
                memory_usage: this.getCurrentMemoryUsage(),
                category: 'Performance'
            });
        }
    }

    // Performance debugging helpers
    startTimer(name) {
        performance.mark(`${name}-start`);
        return () => {
            performance.mark(`${name}-end`);
            performance.measure(name, `${name}-start`, `${name}-end`);
            const measure = performance.getEntriesByName(name)[0];
            return measure.duration;
        };
    }

    // Resource loading optimization
    preloadCriticalResources() {
        const criticalResources = [
            'js/local-conversation-engine.js',
            'js/restaurant-config-loader.js',
            'config/restaurant-config.json'
        ];

        criticalResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = resource.endsWith('.js') ? 'script' : 'fetch';
            link.href = resource;
            if (resource.endsWith('.json')) {
                link.crossOrigin = 'anonymous';
            }
            document.head.appendChild(link);
        });
    }

    // Bundle size analysis
    analyzeBundleSize() {
        const scripts = Array.from(document.querySelectorAll('script[src]'));
        const scriptSizes = scripts.map(script => ({
            src: script.src,
            size: 'unknown' // Would need server-side implementation
        }));

        console.table(scriptSizes);
        return scriptSizes;
    }
}

// Create global performance manager
window.PerformanceManager = new PerformanceManager();

// Expose performance debugging in development
if (window.ProductionErrorHandler && window.ProductionErrorHandler.isDevelopment()) {
    window.debugPerformance = {
        report: () => window.PerformanceManager.reportPerformance(),
        optimize: () => window.PerformanceManager.optimizeMemory(),
        metrics: window.PerformanceManager.metrics,
        timer: (name) => window.PerformanceManager.startTimer(name)
    };
}

// Initialize performance tracking
document.addEventListener('DOMContentLoaded', () => {
    window.PerformanceManager.preloadCriticalResources();
});