/**
 * Enhanced Browser Compatibility Fixes
 * Extends the existing browser compatibility system with additional fixes
 */

class EnhancedBrowserCompatibility {
    constructor() {
        this.fixes = new Map();
        this.browserInfo = this.detectBrowser();
        this.init();
    }

    init() {
        console.log('🌐 Initializing enhanced browser compatibility...');
        this.registerCompatibilityFixes();
        this.applyFixes();
        this.setupCSSCompatibility();
        this.setupMobileOptimizations();
    }

    detectBrowser() {
        const ua = navigator.userAgent;
        const browserInfo = {
            name: 'Unknown',
            version: 0,
            mobile: /Mobi|Android/i.test(ua),
            iOS: /iPad|iPhone|iPod/.test(ua),
            android: /Android/.test(ua),
            chrome: /Chrome/.test(ua),
            firefox: /Firefox/.test(ua),
            safari: /Safari/.test(ua) && !/Chrome/.test(ua),
            edge: /Edg/.test(ua),
            ie: /Trident|MSIE/.test(ua)
        };

        // Detect browser name and version
        if (browserInfo.chrome) {
            browserInfo.name = 'Chrome';
            const match = ua.match(/Chrome\/(\d+)/);
            browserInfo.version = match ? parseInt(match[1]) : 0;
        } else if (browserInfo.firefox) {
            browserInfo.name = 'Firefox';
            const match = ua.match(/Firefox\/(\d+)/);
            browserInfo.version = match ? parseInt(match[1]) : 0;
        } else if (browserInfo.safari) {
            browserInfo.name = 'Safari';
            const match = ua.match(/Version\/(\d+)/);
            browserInfo.version = match ? parseInt(match[1]) : 0;
        } else if (browserInfo.edge) {
            browserInfo.name = 'Edge';
            const match = ua.match(/Edg\/(\d+)/);
            browserInfo.version = match ? parseInt(match[1]) : 0;
        } else if (browserInfo.ie) {
            browserInfo.name = 'Internet Explorer';
            const match = ua.match(/(?:MSIE |Trident.*rv:)(\d+)/);
            browserInfo.version = match ? parseInt(match[1]) : 0;
        }

        console.log('🌐 Browser detected:', browserInfo);
        return browserInfo;
    }

    registerCompatibilityFixes() {
        // Fix for Safari Speech Recognition
        this.addFix('safari-speech-recognition', () => {
            if (this.browserInfo.safari && this.browserInfo.version < 14) {
                console.warn('⚠️ Safari Speech Recognition limited support');
                // Provide fallback guidance
                window.speechRecognitionFallback = true;
            }
        });

        // Fix for Firefox MediaRecorder
        this.addFix('firefox-mediarecorder', () => {
            if (this.browserInfo.firefox && this.browserInfo.version < 60) {
                console.warn('⚠️ Firefox MediaRecorder requires version 60+');
                // Add opus codec preference for Firefox
                if (window.MediaRecorder) {
                    window.preferredAudioType = 'audio/ogg; codecs=opus';
                }
            }
        });

        // Fix for Edge compatibility
        this.addFix('edge-compatibility', () => {
            if (this.browserInfo.edge && this.browserInfo.version < 79) {
                console.warn('⚠️ Legacy Edge detected, some features may not work');
                // Enable compatibility mode
                document.documentElement.classList.add('legacy-edge');
            }
        });

        // Fix for mobile browsers
        this.addFix('mobile-optimizations', () => {
            if (this.browserInfo.mobile) {
                this.setupMobileCompatibility();
            }
        });

        // Fix for iOS Safari specific issues
        this.addFix('ios-safari-fixes', () => {
            if (this.browserInfo.iOS) {
                this.setupIOSSafariFixes();
            }
        });

        // Fix for Android Chrome issues
        this.addFix('android-chrome-fixes', () => {
            if (this.browserInfo.android) {
                this.setupAndroidChromeFixes();
            }
        });
    }

    addFix(name, fix) {
        this.fixes.set(name, fix);
    }

    applyFixes() {
        let applied = 0;
        for (const [name, fix] of this.fixes) {
            try {
                fix();
                applied++;
            } catch (error) {
                console.error(`❌ Failed to apply fix ${name}:`, error);
            }
        }
        console.log(`✅ Applied ${applied} compatibility fixes`);
    }

    setupCSSCompatibility() {
        // Add vendor prefixes for CSS properties
        const style = document.createElement('style');
        style.textContent = `
            /* Vendor prefixes for compatibility */
            .flex-fallback {
                display: -webkit-box;
                display: -ms-flexbox;
                display: flex;
            }
            
            .transform-fallback {
                -webkit-transform: translateZ(0);
                -moz-transform: translateZ(0);
                -ms-transform: translateZ(0);
                transform: translateZ(0);
            }
            
            .transition-fallback {
                -webkit-transition: all 0.3s ease;
                -moz-transition: all 0.3s ease;
                -ms-transition: all 0.3s ease;
                transition: all 0.3s ease;
            }
            
            /* Grid fallback */
            @supports not (display: grid) {
                .grid-fallback {
                    display: flex;
                    flex-wrap: wrap;
                }
                .grid-item-fallback {
                    flex: 1 1 300px;
                }
            }
            
            /* Backdrop filter fallback */
            @supports not (backdrop-filter: blur(10px)) {
                .backdrop-fallback {
                    background: rgba(255, 255, 255, 0.9);
                }
            }
        `;
        document.head.appendChild(style);
    }

    setupMobileOptimizations() {
        if (!this.browserInfo.mobile) return;

        // Add mobile-specific meta tags if missing
        this.addMobileMetaTags();

        // Optimize touch interactions
        this.optimizeTouchInteractions();

        // Fix viewport issues
        this.fixViewportIssues();

        // Add mobile-specific styles
        this.addMobileStyles();
    }

    addMobileMetaTags() {
        const metaTags = [
            { name: 'mobile-web-app-capable', content: 'yes' },
            { name: 'apple-mobile-web-app-capable', content: 'yes' },
            { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }
        ];

        metaTags.forEach(({ name, content }) => {
            if (!document.querySelector(`meta[name="${name}"]`)) {
                const meta = document.createElement('meta');
                meta.name = name;
                meta.content = content;
                document.head.appendChild(meta);
            }
        });
    }

    optimizeTouchInteractions() {
        // Improve touch responsiveness
        const style = document.createElement('style');
        style.textContent = `
            /* Touch optimizations */
            * {
                -webkit-touch-callout: none;
                -webkit-tap-highlight-color: transparent;
            }
            
            button, .btn, [onclick] {
                touch-action: manipulation;
                -webkit-tap-highlight-color: rgba(0,0,0,0.1);
            }
            
            /* Prevent zoom on input focus */
            input, select, textarea {
                font-size: 16px;
            }
            
            /* Smooth scrolling */
            * {
                -webkit-overflow-scrolling: touch;
            }
        `;
        document.head.appendChild(style);

        // Add touch event listeners for better responsiveness
        document.addEventListener('touchstart', function() {}, { passive: true });
    }

    fixViewportIssues() {
        // Fix 100vh on mobile
        const setVH = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };

        setVH();
        window.addEventListener('resize', setVH);
        window.addEventListener('orientationchange', () => {
            setTimeout(setVH, 100);
        });
    }

    addMobileStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @media (max-width: 768px) {
                /* Mobile-first responsive adjustments */
                .container {
                    padding: 10px;
                }
                
                .button, .btn {
                    min-height: 44px; /* iOS touch target minimum */
                    padding: 12px 16px;
                }
                
                /* Ensure text is readable */
                body {
                    font-size: 16px;
                    line-height: 1.5;
                }
                
                /* Fix input zoom on iOS */
                input, select, textarea {
                    font-size: 16px;
                    border-radius: 0;
                }
                
                /* Use full viewport height correctly */
                .full-height {
                    height: 100vh;
                    height: calc(var(--vh, 1vh) * 100);
                }
            }
        `;
        document.head.appendChild(style);
    }

    setupIOSSafariFixes() {
        console.log('🍎 Applying iOS Safari fixes...');

        // Fix audio context for iOS
        if (window.AudioContext || window.webkitAudioContext) {
            const resumeAudioContext = () => {
                if (window.audioContext && window.audioContext.state === 'suspended') {
                    window.audioContext.resume();
                }
            };

            document.addEventListener('touchstart', resumeAudioContext, { once: true });
            document.addEventListener('click', resumeAudioContext, { once: true });
        }

        // Fix date input on older iOS
        if (this.browserInfo.version < 14) {
            this.addIOSDateInputFallback();
        }

        // Fix CSS variables on older Safari
        if (this.browserInfo.version < 10) {
            this.addCSSVariablesFallback();
        }
    }

    setupAndroidChromeFixes() {
        console.log('🤖 Applying Android Chrome fixes...');

        // Fix viewport height on Android
        const fixAndroidVH = () => {
            const viewportHeight = window.innerHeight;
            document.documentElement.style.setProperty('--android-vh', `${viewportHeight}px`);
        };

        fixAndroidVH();
        window.addEventListener('resize', fixAndroidVH);

        // Fix audio playback on Android
        document.addEventListener('touchstart', () => {
            const audioElements = document.querySelectorAll('audio');
            audioElements.forEach(audio => {
                if (audio.paused) {
                    audio.play().catch(() => {
                        // Ignore autoplay failures
                    });
                }
            });
        }, { once: true });
    }

    addIOSDateInputFallback() {
        // Replace date inputs with text inputs on older iOS
        const dateInputs = document.querySelectorAll('input[type="date"]');
        dateInputs.forEach(input => {
            if (!this.supportsDateInput()) {
                input.type = 'text';
                input.placeholder = 'MM/DD/YYYY';
                input.pattern = '\\d{2}/\\d{2}/\\d{4}';
            }
        });
    }

    addCSSVariablesFallback() {
        // Simple CSS variables fallback
        if (!CSS.supports('color', 'var(--color)')) {
            console.log('🔧 Adding CSS variables fallback...');
            
            const fallbackVars = {
                '--primary-color': '#4f46e5',
                '--secondary-color': '#6b7280',
                '--success-color': '#10b981',
                '--warning-color': '#f59e0b',
                '--error-color': '#ef4444'
            };

            const style = document.createElement('style');
            let css = '';
            
            Object.entries(fallbackVars).forEach(([prop, value]) => {
                css += `[style*="${prop}"] { color: ${value} !important; }\n`;
            });
            
            style.textContent = css;
            document.head.appendChild(style);
        }
    }

    supportsDateInput() {
        const input = document.createElement('input');
        input.type = 'date';
        input.value = 'not-a-date';
        return input.value === '';
    }

    // Progressive Web App enhancements
    setupPWACompatibility() {
        // Add service worker registration with compatibility check
        if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
            navigator.serviceWorker.register('/sw.js').catch(error => {
                console.log('Service worker registration failed:', error);
            });
        }

        // Add install prompt handling
        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            deferredPrompt = e;
            // Show custom install button
            const installBtn = document.getElementById('install-btn');
            if (installBtn) {
                installBtn.style.display = 'block';
                installBtn.addEventListener('click', () => {
                    deferredPrompt.prompt();
                    deferredPrompt.userChoice.then((choiceResult) => {
                        deferredPrompt = null;
                        installBtn.style.display = 'none';
                    });
                });
            }
        });
    }

    // Network status monitoring
    setupNetworkMonitoring() {
        if ('navigator' in window && 'onLine' in navigator) {
            const updateNetworkStatus = () => {
                const isOnline = navigator.onLine;
                document.body.classList.toggle('offline', !isOnline);
                
                if (!isOnline) {
                    if (window.safeNotify) {
                        window.safeNotify('You are offline. Some features may not work.', 'warning');
                    }
                } else {
                    if (window.safeNotify) {
                        window.safeNotify('Connection restored.', 'success');
                    }
                }
            };

            window.addEventListener('online', updateNetworkStatus);
            window.addEventListener('offline', updateNetworkStatus);
            updateNetworkStatus();
        }
    }

    // Performance optimizations for older browsers
    setupPerformanceOptimizations() {
        // Debounce resize events
        let resizeTimeout;
        const originalResize = window.onresize;
        window.onresize = (event) => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (originalResize) originalResize(event);
            }, 150);
        };

        // Throttle scroll events
        let scrollTimeout;
        const originalScroll = window.onscroll;
        window.onscroll = (event) => {
            if (!scrollTimeout) {
                scrollTimeout = setTimeout(() => {
                    if (originalScroll) originalScroll(event);
                    scrollTimeout = null;
                }, 16); // ~60fps
            }
        };
    }

    // Get compatibility status
    getCompatibilityStatus() {
        return {
            browser: this.browserInfo,
            features: {
                speechRecognition: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
                mediaRecorder: !!window.MediaRecorder,
                webAudio: !!(window.AudioContext || window.webkitAudioContext),
                geolocation: !!navigator.geolocation,
                notifications: !!window.Notification,
                serviceWorker: !!navigator.serviceWorker,
                webRTC: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
                localStorage: !!window.localStorage,
                indexedDB: !!window.indexedDB,
                webGL: !!window.WebGLRenderingContext,
                cssGrid: CSS.supports('display', 'grid'),
                cssVariables: CSS.supports('color', 'var(--color)'),
                fetch: !!window.fetch,
                promises: !!window.Promise
            },
            fixesApplied: Array.from(this.fixes.keys())
        };
    }
}

// Initialize enhanced compatibility
window.enhancedCompatibility = new EnhancedBrowserCompatibility();

// Setup additional features
window.enhancedCompatibility.setupPWACompatibility();
window.enhancedCompatibility.setupNetworkMonitoring();
window.enhancedCompatibility.setupPerformanceOptimizations();

console.log('🌐 Enhanced browser compatibility system loaded');

// Export for module environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedBrowserCompatibility;
}