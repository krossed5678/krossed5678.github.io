/**
 * Browser Compatibility and Feature Detection
 * Ensures graceful degradation across different browsers and devices
 */

class BrowserCompatibility {
    constructor() {
        this.features = {};
        this.init();
    }

    init() {
        this.detectFeatures();
        this.setupPolyfills();
        this.showCompatibilityWarnings();
    }

    detectFeatures() {
        // Speech Recognition
        this.features.speechRecognition = !!(
            window.SpeechRecognition || 
            window.webkitSpeechRecognition || 
            window.mozSpeechRecognition || 
            window.msSpeechRecognition
        );

        // Speech Synthesis
        this.features.speechSynthesis = !!(window.speechSynthesis && window.SpeechSynthesisUtterance);

        // Local Storage
        this.features.localStorage = this.testLocalStorage();

        // Notifications
        this.features.notifications = 'Notification' in window;

        // Service Workers
        this.features.serviceWorker = 'serviceWorker' in navigator;

        // WebRTC (for future voice features)
        this.features.webRTC = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

        // Modern JavaScript features
        this.features.es6 = this.testES6();
        this.features.fetch = 'fetch' in window;
        this.features.promise = 'Promise' in window;

        // Touch support
        this.features.touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        // Mobile detection
        this.features.mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        // Browser information
        this.browserInfo = this.detectBrowser();

        return this.features;
    }

    testLocalStorage() {
        try {
            const test = 'test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    testES6() {
        try {
            // Test arrow functions, const/let, template literals
            eval('const test = () => `hello ${1}`; test()');
            return true;
        } catch (e) {
            return false;
        }
    }

    detectBrowser() {
        const ua = navigator.userAgent;
        
        if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
        if (ua.includes('Firefox')) return 'Firefox';
        if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
        if (ua.includes('Edg')) return 'Edge';
        if (ua.includes('Trident') || ua.includes('MSIE')) return 'Internet Explorer';
        
        return 'Unknown';
    }

    setupPolyfills() {
        // Local polyfills (no external dependencies)
        if (!this.features.promise) {
            this.polyfillPromise();
        }

        if (!this.features.fetch) {
            this.polyfillFetch();
        }

        // Polyfill for Object.assign (IE support)
        if (!Object.assign) {
            Object.assign = function(target) {
                for (let i = 1; i < arguments.length; i++) {
                    const source = arguments[i];
                    for (const key in source) {
                        if (source.hasOwnProperty(key)) {
                            target[key] = source[key];
                        }
                    }
                }
                return target;
            };
        }

        // Array.from polyfill
        if (!Array.from) {
            Array.from = function(arrayLike) {
                return Array.prototype.slice.call(arrayLike);
            };
        }

        // Custom event polyfill
        if (!window.CustomEvent) {
            window.CustomEvent = function(event, params) {
                params = params || { bubbles: false, cancelable: false, detail: null };
                const evt = document.createEvent('CustomEvent');
                evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
                return evt;
            };
        }
    }

    // Local polyfill implementations (no external dependencies)
    polyfillPromise() {
        if (typeof Promise !== 'undefined') return;
        
        // Minimal Promise polyfill
        window.Promise = function(executor) {
            const self = this;
            self.state = 'pending';
            self.value = undefined;
            self.handlers = [];

            function resolve(result) {
                if (self.state === 'pending') {
                    self.state = 'fulfilled';
                    self.value = result;
                    self.handlers.forEach(handle);
                    self.handlers = null;
                }
            }

            function reject(error) {
                if (self.state === 'pending') {
                    self.state = 'rejected';
                    self.value = error;
                    self.handlers.forEach(handle);
                    self.handlers = null;
                }
            }

            function handle(handler) {
                if (self.state === 'pending') {
                    self.handlers.push(handler);
                } else {
                    if (self.state === 'fulfilled' && typeof handler.onFulfilled === 'function') {
                        handler.onFulfilled(self.value);
                    }
                    if (self.state === 'rejected' && typeof handler.onRejected === 'function') {
                        handler.onRejected(self.value);
                    }
                }
            }

            self.then = function(onFulfilled, onRejected) {
                return new Promise(function(resolve, reject) {
                    handle({
                        onFulfilled: function(result) {
                            try {
                                resolve(onFulfilled ? onFulfilled(result) : result);
                            } catch (ex) {
                                reject(ex);
                            }
                        },
                        onRejected: function(error) {
                            try {
                                resolve(onRejected ? onRejected(error) : Promise.reject(error));
                            } catch (ex) {
                                reject(ex);
                            }
                        }
                    });
                });
            };

            self.catch = function(onRejected) {
                return self.then(null, onRejected);
            };

            executor(resolve, reject);
        };

        Promise.resolve = function(value) {
            return new Promise(function(resolve) {
                resolve(value);
            });
        };

        Promise.reject = function(reason) {
            return new Promise(function(resolve, reject) {
                reject(reason);
            });
        };
    }

    polyfillFetch() {
        if (typeof fetch !== 'undefined') return;
        
        // Minimal fetch polyfill using XMLHttpRequest
        window.fetch = function(url, options) {
            return new Promise(function(resolve, reject) {
                const xhr = new XMLHttpRequest();
                options = options || {};
                
                xhr.open(options.method || 'GET', url, true);
                
                // Set headers
                if (options.headers) {
                    Object.keys(options.headers).forEach(function(key) {
                        xhr.setRequestHeader(key, options.headers[key]);
                    });
                }
                
                xhr.onload = function() {
                    const response = {
                        ok: xhr.status >= 200 && xhr.status < 300,
                        status: xhr.status,
                        statusText: xhr.statusText,
                        json: function() {
                            return Promise.resolve(JSON.parse(xhr.responseText));
                        },
                        text: function() {
                            return Promise.resolve(xhr.responseText);
                        },
                        headers: {
                            get: function(name) {
                                return xhr.getResponseHeader(name);
                            }
                        }
                    };
                    resolve(response);
                };
                
                xhr.onerror = function() {
                    reject(new Error('Network request failed'));
                };
                
                xhr.ontimeout = function() {
                    reject(new Error('Network request timed out'));
                };
                
                if (options.timeout) {
                    xhr.timeout = options.timeout;
                }
                
                xhr.send(options.body || null);
            });
        };
    }

    showCompatibilityWarnings() {
        const warnings = [];

        // Critical feature warnings
        if (!this.features.speechRecognition) {
            warnings.push({
                level: 'warning',
                message: 'Voice recognition is not supported in this browser. You can still type your messages.',
                feature: 'speechRecognition'
            });
        }

        if (!this.features.speechSynthesis) {
            warnings.push({
                level: 'info',
                message: 'Voice responses are not supported. You\'ll see text responses instead.',
                feature: 'speechSynthesis'
            });
        }

        if (!this.features.localStorage) {
            warnings.push({
                level: 'error',
                message: 'Local storage is disabled. Your bookings will not be saved between sessions.',
                feature: 'localStorage'
            });
        }

        if (this.browserInfo === 'Internet Explorer') {
            warnings.push({
                level: 'error',
                message: 'Internet Explorer is not supported. Please use Chrome, Firefox, Safari, or Edge for the best experience.',
                feature: 'browser'
            });
        }

        // Show warnings to user
        warnings.forEach(warning => {
            if (window.ProductionErrorHandler) {
                window.ProductionErrorHandler.showNotification(
                    warning.message, 
                    warning.level, 
                    warning.level === 'error' ? 0 : 8000
                );
            }
        });

        return warnings;
    }

    // Graceful degradation helpers
    getSpeechRecognition() {
        if (!this.features.speechRecognition) return null;
        
        return window.SpeechRecognition || 
               window.webkitSpeechRecognition || 
               window.mozSpeechRecognition || 
               window.msSpeechRecognition || 
               null;
    }

    getSpeechSynthesis() {
        return this.features.speechSynthesis ? window.speechSynthesis : null;
    }

    // Safe storage wrapper
    safeStorage = {
        set: (key, value) => {
            if (!this.features.localStorage) return false;
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.warn('Storage failed:', e);
                return false;
            }
        },

        get: (key, defaultValue = null) => {
            if (!this.features.localStorage) return defaultValue;
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                console.warn('Storage retrieval failed:', e);
                return defaultValue;
            }
        },

        remove: (key) => {
            if (!this.features.localStorage) return false;
            try {
                localStorage.removeItem(key);
                return true;
            } catch (e) {
                console.warn('Storage removal failed:', e);
                return false;
            }
        }
    };

    // Performance helpers
    requestIdleCallback(callback, options = {}) {
        if (window.requestIdleCallback) {
            return window.requestIdleCallback(callback, options);
        } else {
            // Fallback for browsers without requestIdleCallback
            return setTimeout(() => {
                callback({
                    didTimeout: false,
                    timeRemaining: () => 50
                });
            }, options.timeout || 1);
        }
    }

    // Feature-based loading
    loadFeatureBasedCSS() {
        const css = [];

        // Mobile styles
        if (this.features.mobile) {
            css.push(`
                .speech-button { font-size: 18px; padding: 12px; }
                .chat-container { padding: 10px; }
                input { font-size: 16px; } /* Prevents zoom on iOS */
            `);
        }

        // Touch styles
        if (this.features.touch) {
            css.push(`
                button { min-height: 44px; min-width: 44px; }
                .clickable { padding: 8px; }
            `);
        }

        // No speech recognition styles
        if (!this.features.speechRecognition) {
            css.push(`
                .speech-only { display: none !important; }
                .speech-button { opacity: 0.5; cursor: not-allowed; }
            `);
        }

        if (css.length > 0) {
            const style = document.createElement('style');
            style.textContent = css.join('\n');
            document.head.appendChild(style);
        }
    }

    // Accessibility enhancements
    setupAccessibility() {
        // Skip to main content link
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.textContent = 'Skip to main content';
        skipLink.style.cssText = `
            position: absolute;
            top: -40px;
            left: 6px;
            background: #000;
            color: #fff;
            padding: 8px;
            z-index: 1000;
            text-decoration: none;
            border-radius: 0 0 4px 4px;
        `;
        skipLink.addEventListener('focus', () => skipLink.style.top = '6px');
        skipLink.addEventListener('blur', () => skipLink.style.top = '-40px');
        document.body.insertBefore(skipLink, document.body.firstChild);

        // Add main landmark if not present
        const main = document.getElementById('main-content');
        if (main && !main.getAttribute('role')) {
            main.setAttribute('role', 'main');
        }

        // Enhance button accessibility
        document.querySelectorAll('button').forEach(button => {
            if (!button.getAttribute('aria-label') && !button.textContent.trim()) {
                const icon = button.querySelector('.icon');
                if (icon) {
                    button.setAttribute('aria-label', icon.className.includes('mic') ? 'Voice input' : 'Button');
                }
            }
        });
    }

    // Generate compatibility report
    getCompatibilityReport() {
        return {
            browser: this.browserInfo,
            features: this.features,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth
            }
        };
    }
}

// Create global compatibility manager
window.BrowserCompatibility = new BrowserCompatibility();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.BrowserCompatibility.loadFeatureBasedCSS();
    window.BrowserCompatibility.setupAccessibility();
});

// Expose compatibility info for debugging
if (window.ProductionErrorHandler && window.ProductionErrorHandler.isDevelopment()) {
    window.debugCompatibility = {
        features: window.BrowserCompatibility.features,
        report: () => window.BrowserCompatibility.getCompatibilityReport(),
        storage: window.BrowserCompatibility.safeStorage
    };
}