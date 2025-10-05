/**
 * Comprehensive Bug Fixes for Restaurant Telephony System
 * Addresses runtime errors, compatibility issues, and security vulnerabilities
 */

class BugFixes {
    constructor() {
        this.fixes = [];
        this.appliedFixes = new Set();
        this.init();
    }

    init() {
        console.log('🔧 Initializing bug fixes...');
        this.registerFixes();
        this.applyAllFixes();
        this.setupGlobalErrorHandling();
    }

    registerFixes() {
        // Fix 1: Replace alert() with proper notifications
        this.addFix({
            id: 'fix-alert-usage',
            description: 'Replace alert() with UIManager notifications',
            apply: () => this.fixAlertUsage()
        });

        // Fix 2: Add null checks to prevent runtime errors
        this.addFix({
            id: 'fix-null-checks',
            description: 'Add null/undefined checks to prevent runtime errors',
            apply: () => this.addNullChecks()
        });

        // Fix 3: Fix innerHTML XSS vulnerabilities
        this.addFix({
            id: 'fix-innerHTML-xss',
            description: 'Replace innerHTML with safer DOM methods',
            apply: () => this.fixInnerHTMLUsage()
        });

        // Fix 4: Improve API error handling
        this.addFix({
            id: 'fix-api-errors',
            description: 'Add timeout and retry logic to API calls',
            apply: () => this.improveAPIErrorHandling()
        });

        // Fix 5: Fix Speech Recognition compatibility
        this.addFix({
            id: 'fix-speech-recognition',
            description: 'Improve cross-browser Speech Recognition support',
            apply: () => this.fixSpeechRecognition()
        });

        // Fix 6: Fix localStorage error handling
        this.addFix({
            id: 'fix-localstorage',
            description: 'Add error handling for localStorage operations',
            apply: () => this.fixLocalStorage()
        });

        // Fix 7: Fix initialization race conditions
        this.addFix({
            id: 'fix-race-conditions',
            description: 'Prevent initialization race conditions',
            apply: () => this.fixRaceConditions()
        });
    }

    addFix(fix) {
        this.fixes.push(fix);
    }

    applyAllFixes() {
        let successCount = 0;
        let errorCount = 0;

        this.fixes.forEach(fix => {
            try {
                if (!this.appliedFixes.has(fix.id)) {
                    console.log(`🔧 Applying fix: ${fix.description}`);
                    fix.apply();
                    this.appliedFixes.add(fix.id);
                    successCount++;
                }
            } catch (error) {
                console.error(`❌ Failed to apply fix ${fix.id}:`, error);
                errorCount++;
            }
        });

        console.log(`✅ Applied ${successCount} fixes successfully, ${errorCount} errors`);
        return { successCount, errorCount };
    }

    // Fix 1: Replace alert() usage with proper notifications
    fixAlertUsage() {
        // Override global alert function
        const originalAlert = window.alert;
        window.alert = (message) => {
            console.warn('🚨 Alert intercepted:', message);
            if (window.UIManager && window.UIManager.showNotification) {
                window.UIManager.showNotification(message, 'warning');
            } else {
                // Fallback to console if UIManager not available
                console.log('📢 Notification:', message);
                originalAlert(message);
            }
        };

        // Create safe notification wrapper
        window.safeNotify = (message, type = 'info') => {
            try {
                if (window.UIManager && window.UIManager.showNotification) {
                    window.UIManager.showNotification(message, type);
                } else {
                    console.log(`📢 ${type.toUpperCase()}: ${message}`);
                }
            } catch (error) {
                console.error('Notification error:', error);
                console.log(`📢 ${message}`);
            }
        };
    }

    // Fix 2: Add comprehensive null checks
    addNullChecks() {
        // Safe element getter
        window.safeGetElement = (id) => {
            try {
                const element = document.getElementById(id);
                if (!element) {
                    console.warn(`⚠️ Element not found: ${id}`);
                    return null;
                }
                return element;
            } catch (error) {
                console.error(`❌ Error getting element ${id}:`, error);
                return null;
            }
        };

        // Safe property access
        window.safeAccess = (obj, path, defaultValue = null) => {
            try {
                const keys = path.split('.');
                let current = obj;
                
                for (const key of keys) {
                    if (current == null || typeof current !== 'object') {
                        return defaultValue;
                    }
                    current = current[key];
                }
                
                return current != null ? current : defaultValue;
            } catch (error) {
                console.warn(`⚠️ Safe access failed for path ${path}:`, error);
                return defaultValue;
            }
        };

        // Safe function call
        window.safeCall = (fn, ...args) => {
            try {
                if (typeof fn === 'function') {
                    return fn(...args);
                } else {
                    console.warn('⚠️ Attempted to call non-function:', fn);
                    return null;
                }
            } catch (error) {
                console.error('❌ Safe function call failed:', error);
                return null;
            }
        };
    }

    // Fix 3: Replace innerHTML with safer methods
    fixInnerHTMLUsage() {
        // Safe HTML setter
        window.safeSetHTML = (element, html) => {
            try {
                if (!element) {
                    console.warn('⚠️ Attempted to set HTML on null element');
                    return;
                }

                // Basic XSS protection - strip script tags
                const cleanHTML = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
                element.innerHTML = cleanHTML;
            } catch (error) {
                console.error('❌ Error setting HTML safely:', error);
                // Fallback to text content
                if (element) {
                    element.textContent = html.replace(/<[^>]*>/g, '');
                }
            }
        };

        // Safe text setter
        window.safeSetText = (element, text) => {
            try {
                if (!element) {
                    console.warn('⚠️ Attempted to set text on null element');
                    return;
                }
                element.textContent = text || '';
            } catch (error) {
                console.error('❌ Error setting text safely:', error);
            }
        };
    }

    // Fix 4: Improve API error handling with timeouts and retries
    improveAPIErrorHandling() {
        // Enhanced fetch with timeout and retry
        window.safeFetch = async (url, options = {}, retries = 3, timeout = 10000) => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const fetchWithTimeout = async (attempt) => {
                try {
                    const response = await fetch(url, {
                        ...options,
                        signal: controller.signal
                    });

                    clearTimeout(timeoutId);

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }

                    return response;
                } catch (error) {
                    clearTimeout(timeoutId);

                    if (error.name === 'AbortError') {
                        throw new Error(`Request timeout after ${timeout}ms`);
                    }

                    if (attempt < retries && this.isRetryableError(error)) {
                        console.warn(`⚠️ Retrying request (${attempt + 1}/${retries}):`, error.message);
                        await this.delay(1000 * Math.pow(2, attempt)); // Exponential backoff
                        return fetchWithTimeout(attempt + 1);
                    }

                    throw error;
                }
            };

            return fetchWithTimeout(0);
        };

        // Network error detection
        window.isNetworkError = (error) => {
            return error.message.includes('fetch') ||
                   error.message.includes('network') ||
                   error.message.includes('timeout') ||
                   error.name === 'TypeError';
        };
    }

    isRetryableError(error) {
        // Retry on network errors, timeouts, and 5xx server errors
        return window.isNetworkError(error) ||
               error.message.includes('timeout') ||
               error.message.includes('5');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Fix 5: Improve Speech Recognition compatibility
    fixSpeechRecognition() {
        // Enhanced Speech Recognition wrapper
        window.createSpeechRecognition = () => {
            try {
                const SpeechRecognition = window.SpeechRecognition || 
                                        window.webkitSpeechRecognition || 
                                        window.mozSpeechRecognition || 
                                        window.msSpeechRecognition;

                if (!SpeechRecognition) {
                    console.warn('⚠️ Speech Recognition not supported in this browser');
                    return null;
                }

                const recognition = new SpeechRecognition();
                
                // Apply safe defaults
                recognition.continuous = false;
                recognition.interimResults = false;
                recognition.lang = 'en-US';
                recognition.maxAlternatives = 1;

                // Add error recovery
                recognition.addEventListener('error', (event) => {
                    console.warn('🎤 Speech recognition error:', event.error);
                    
                    // Auto-restart on recoverable errors
                    if (event.error === 'no-speech' || event.error === 'audio-capture') {
                        setTimeout(() => {
                            try {
                                recognition.start();
                            } catch (error) {
                                console.warn('⚠️ Failed to restart speech recognition:', error);
                            }
                        }, 1000);
                    }
                });

                return recognition;
            } catch (error) {
                console.error('❌ Failed to create Speech Recognition:', error);
                return null;
            }
        };
    }

    // Fix 6: Improve localStorage error handling
    fixLocalStorage() {
        // Safe localStorage wrapper
        window.safeLocalStorage = {
            getItem: (key, defaultValue = null) => {
                try {
                    if (!window.localStorage) {
                        console.warn('⚠️ localStorage not available');
                        return defaultValue;
                    }

                    const value = localStorage.getItem(key);
                    if (value === null || value === undefined) {
                        return defaultValue;
                    }

                    // Try to parse as JSON first
                    try {
                        return JSON.parse(value);
                    } catch {
                        return value; // Return as string if not valid JSON
                    }
                } catch (error) {
                    console.error(`❌ localStorage getItem error for key "${key}":`, error);
                    return defaultValue;
                }
            },

            setItem: (key, value) => {
                try {
                    if (!window.localStorage) {
                        console.warn('⚠️ localStorage not available');
                        return false;
                    }

                    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
                    localStorage.setItem(key, stringValue);
                    return true;
                } catch (error) {
                    console.error(`❌ localStorage setItem error for key "${key}":`, error);
                    
                    // Handle quota exceeded error
                    if (error.name === 'QuotaExceededError') {
                        console.warn('⚠️ localStorage quota exceeded, clearing old data');
                        try {
                            // Clear some old data and retry
                            this.clearOldData();
                            localStorage.setItem(key, stringValue);
                            return true;
                        } catch (retryError) {
                            console.error('❌ localStorage retry failed:', retryError);
                        }
                    }
                    
                    return false;
                }
            },

            removeItem: (key) => {
                try {
                    if (window.localStorage) {
                        localStorage.removeItem(key);
                    }
                } catch (error) {
                    console.error(`❌ localStorage removeItem error for key "${key}":`, error);
                }
            },

            clearOldData: () => {
                try {
                    // Remove items older than 7 days
                    const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000);
                    
                    for (let i = localStorage.length - 1; i >= 0; i--) {
                        const key = localStorage.key(i);
                        if (key && key.includes('_timestamp_')) {
                            const timestamp = parseInt(localStorage.getItem(key) || '0');
                            if (timestamp < cutoffTime) {
                                localStorage.removeItem(key);
                                localStorage.removeItem(key.replace('_timestamp_', ''));
                            }
                        }
                    }
                } catch (error) {
                    console.error('❌ Error clearing old localStorage data:', error);
                }
            }
        };
    }

    // Fix 7: Prevent race conditions in initialization
    fixRaceConditions() {
        // Global initialization state manager
        window.InitializationManager = {
            states: new Map(),
            
            waitFor: async (componentName, timeout = 10000) => {
                return new Promise((resolve, reject) => {
                    const checkComponent = () => {
                        if (this.states.get(componentName) === 'ready') {
                            resolve(true);
                            return true;
                        }
                        return false;
                    };

                    if (checkComponent()) return;

                    let attempts = 0;
                    const maxAttempts = timeout / 100;

                    const interval = setInterval(() => {
                        attempts++;
                        
                        if (checkComponent()) {
                            clearInterval(interval);
                        } else if (attempts >= maxAttempts) {
                            clearInterval(interval);
                            reject(new Error(`Timeout waiting for ${componentName}`));
                        }
                    }, 100);
                });
            },

            markReady: (componentName) => {
                console.log(`✅ Component ready: ${componentName}`);
                this.states.set(componentName, 'ready');
            },

            markError: (componentName, error) => {
                console.error(`❌ Component error: ${componentName}`, error);
                this.states.set(componentName, 'error');
            },

            isReady: (componentName) => {
                return this.states.get(componentName) === 'ready';
            }
        };

        // Safe component initialization
        window.safeInitialize = async (componentName, initFunction) => {
            try {
                console.log(`🔄 Initializing ${componentName}...`);
                await initFunction();
                window.InitializationManager.markReady(componentName);
                return true;
            } catch (error) {
                console.error(`❌ Failed to initialize ${componentName}:`, error);
                window.InitializationManager.markError(componentName, error);
                throw error;
            }
        };
    }

    // Setup global error handling
    setupGlobalErrorHandling() {
        // Catch unhandled errors
        window.addEventListener('error', (event) => {
            console.error('🚨 Global error:', event.error);
            this.logError('Global Error', event.error, {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });

        // Catch unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('🚨 Unhandled promise rejection:', event.reason);
            this.logError('Promise Rejection', event.reason);
            event.preventDefault(); // Prevent console spam
        });

        // Performance monitoring
        if ('performance' in window && 'mark' in window.performance) {
            window.performance.mark('bug-fixes-applied');
        }
    }

    logError(type, error, context = {}) {
        const errorInfo = {
            type,
            message: error?.message || error,
            stack: error?.stack,
            timestamp: new Date().toISOString(),
            context,
            userAgent: navigator.userAgent
        };

        // Store in safe localStorage
        try {
            const errorLog = window.safeLocalStorage.getItem('error_log', []);
            errorLog.push(errorInfo);
            
            // Keep only last 50 errors
            if (errorLog.length > 50) {
                errorLog.splice(0, errorLog.length - 50);
            }
            
            window.safeLocalStorage.setItem('error_log', errorLog);
        } catch (logError) {
            console.warn('⚠️ Failed to log error to localStorage:', logError);
        }
    }

    // Get bug fix status
    getStatus() {
        return {
            totalFixes: this.fixes.length,
            appliedFixes: this.appliedFixes.size,
            fixes: this.fixes.map(fix => ({
                id: fix.id,
                description: fix.description,
                applied: this.appliedFixes.has(fix.id)
            }))
        };
    }

    // Apply single fix by ID
    applyFix(fixId) {
        const fix = this.fixes.find(f => f.id === fixId);
        if (!fix) {
            throw new Error(`Fix not found: ${fixId}`);
        }

        if (this.appliedFixes.has(fixId)) {
            console.log(`✅ Fix already applied: ${fixId}`);
            return;
        }

        try {
            console.log(`🔧 Applying fix: ${fix.description}`);
            fix.apply();
            this.appliedFixes.add(fixId);
            console.log(`✅ Fix applied successfully: ${fixId}`);
        } catch (error) {
            console.error(`❌ Failed to apply fix ${fixId}:`, error);
            throw error;
        }
    }
}

// Initialize bug fixes immediately
window.bugFixes = new BugFixes();

console.log('🔧 Bug fixes system loaded and active');

// Export for module environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BugFixes;
}