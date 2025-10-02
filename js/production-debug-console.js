/**
 * Production Debug Console
 * Comprehensive debugging and monitoring tools for production deployment
 */

class ProductionDebugConsole {
    constructor() {
        this.isDebugMode = this.checkDebugMode();
        this.init();
    }

    init() {
        if (this.isDebugMode) {
            this.setupDebugUI();
            this.setupKeyboardShortcuts();
            this.exposeDebugMethods();
        }
        
        this.setupProductionMonitoring();
    }

    checkDebugMode() {
        // Enable debug mode in development or with special parameter
        return window.location.hostname === 'localhost' || 
               window.location.search.includes('debug=true') ||
               window.location.hash.includes('debug');
    }

    setupDebugUI() {
        // Create debug panel button
        const debugButton = document.createElement('button');
        debugButton.id = 'debug-console-toggle';
        debugButton.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 10001;
            background: #333;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
            font-family: monospace;
        `;
        debugButton.textContent = '🔧 Debug';
        debugButton.addEventListener('click', () => this.toggleDebugPanel());
        document.body.appendChild(debugButton);
    }

    toggleDebugPanel() {
        let panel = document.getElementById('debug-panel');
        
        if (panel) {
            panel.remove();
            return;
        }

        panel = document.createElement('div');
        panel.id = 'debug-panel';
        panel.style.cssText = `
            position: fixed;
            top: 50px;
            right: 10px;
            width: 400px;
            max-height: 70vh;
            background: rgba(0, 0, 0, 0.95);
            color: white;
            border-radius: 8px;
            padding: 16px;
            z-index: 10000;
            font-family: monospace;
            font-size: 12px;
            overflow-y: auto;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        `;

        panel.innerHTML = this.generateDebugPanelHTML();
        document.body.appendChild(panel);

        // Add event listeners
        this.setupDebugPanelEvents(panel);
    }

    generateDebugPanelHTML() {
        const systemStatus = this.getSystemStatus();
        const performance = this.getPerformanceMetrics();
        const errors = this.getRecentErrors();
        const analytics = this.getAnalyticsStatus();

        return `
            <div style="border-bottom: 1px solid #555; padding-bottom: 8px; margin-bottom: 12px;">
                <h3 style="margin: 0; color: #4CAF50;">🔧 Production Debug Console</h3>
            </div>

            <!-- System Status -->
            <div style="margin-bottom: 16px;">
                <h4 style="color: #FFD700; margin: 0 0 8px 0;">📊 System Status</h4>
                <div style="background: #222; padding: 8px; border-radius: 4px;">
                    <div>Browser: ${systemStatus.browser}</div>
                    <div>Features: ${systemStatus.featuresEnabled}/${systemStatus.totalFeatures}</div>
                    <div>Storage: ${systemStatus.storageAvailable ? '✅' : '❌'}</div>
                    <div>Config: ${systemStatus.configLoaded ? '✅' : '❌'}</div>
                    <div>Uptime: ${systemStatus.uptime}</div>
                </div>
            </div>

            <!-- Performance Metrics -->
            <div style="margin-bottom: 16px;">
                <h4 style="color: #FF6B6B; margin: 0 0 8px 0;">⚡ Performance</h4>
                <div style="background: #222; padding: 8px; border-radius: 4px;">
                    <div>Page Load: ${performance.pageLoad}ms</div>
                    <div>Config Load: ${performance.configLoad}ms</div>
                    <div>Memory: ${performance.memoryUsage}MB</div>
                    <div>Speech Latency: ${performance.speechLatency}ms</div>
                </div>
            </div>

            <!-- Recent Errors -->
            <div style="margin-bottom: 16px;">
                <h4 style="color: #FF4444; margin: 0 0 8px 0;">🚨 Recent Errors (${errors.length})</h4>
                <div style="background: #222; padding: 8px; border-radius: 4px; max-height: 120px; overflow-y: auto;">
                    ${errors.length === 0 ? 
                        '<div style="color: #4CAF50;">No recent errors ✅</div>' : 
                        errors.map(error => `
                            <div style="margin-bottom: 4px; padding: 4px; background: #333; border-radius: 2px;">
                                <div style="color: #FF6B6B;">${error.type}</div>
                                <div style="color: #CCC; font-size: 11px;">${error.message}</div>
                                <div style="color: #999; font-size: 10px;">${error.time}</div>
                            </div>
                        `).join('')
                    }
                </div>
            </div>

            <!-- Analytics Status -->
            <div style="margin-bottom: 16px;">
                <h4 style="color: #4ECDC4; margin: 0 0 8px 0;">📈 Analytics</h4>
                <div style="background: #222; padding: 8px; border-radius: 4px;">
                    <div>Enabled: ${analytics.enabled ? '✅' : '❌'}</div>
                    <div>Events Tracked: ${analytics.eventsCount}</div>
                    <div>Session: ${analytics.sessionId.substring(0, 16)}...</div>
                </div>
            </div>

            <!-- Debug Actions -->
            <div style="margin-bottom: 16px;">
                <h4 style="color: #9C27B0; margin: 0 0 8px 0;">🛠️ Debug Actions</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    <button onclick="window.debugConsole.exportLogs()" style="background: #555; color: white; border: none; padding: 6px; border-radius: 3px; cursor: pointer; font-size: 11px;">
                        Export Logs
                    </button>
                    <button onclick="window.debugConsole.clearData()" style="background: #555; color: white; border: none; padding: 6px; border-radius: 3px; cursor: pointer; font-size: 11px;">
                        Clear Data
                    </button>
                    <button onclick="window.debugConsole.testFeatures()" style="background: #555; color: white; border: none; padding: 6px; border-radius: 3px; cursor: pointer; font-size: 11px;">
                        Test Features
                    </button>
                    <button onclick="window.debugConsole.forceError()" style="background: #555; color: white; border: none; padding: 6px; border-radius: 3px; cursor: pointer; font-size: 11px;">
                        Test Error
                    </button>
                </div>
            </div>

            <!-- Quick Stats -->
            <div>
                <h4 style="color: #FFC107; margin: 0 0 8px 0;">📋 Quick Stats</h4>
                <div style="background: #222; padding: 8px; border-radius: 4px; font-size: 11px;">
                    <div>Total Bookings: ${this.getBookingCount()}</div>
                    <div>Config Valid: ${this.isConfigValid() ? '✅' : '❌'}</div>
                    <div>Voice Available: ${this.isVoiceAvailable() ? '✅' : '❌'}</div>
                    <div>Debug Mode: ${this.isDebugMode ? '✅' : '❌'}</div>
                </div>
            </div>

            <div style="text-align: center; margin-top: 12px; font-size: 10px; color: #999;">
                Press Ctrl+Shift+D to toggle panel
            </div>
        `;
    }

    setupDebugPanelEvents(panel) {
        // Auto-refresh every 5 seconds
        const refreshInterval = setInterval(() => {
            if (document.getElementById('debug-panel')) {
                panel.innerHTML = this.generateDebugPanelHTML();
            } else {
                clearInterval(refreshInterval);
            }
        }, 5000);
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+D to toggle debug panel
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                this.toggleDebugPanel();
            }

            // Ctrl+Shift+E to export logs
            if (e.ctrlKey && e.shiftKey && e.key === 'E') {
                e.preventDefault();
                this.exportLogs();
            }

            // Ctrl+Shift+C to clear console
            if (e.ctrlKey && e.shiftKey && e.key === 'C') {
                e.preventDefault();
                console.clear();
            }
        });
    }

    exposeDebugMethods() {
        // Expose all debug methods globally
        window.debugConsole = this;
        
        // Expose individual debug objects
        window.debug = {
            console: this,
            errors: window.debugErrors,
            compatibility: window.debugCompatibility,
            performance: window.debugPerformance,
            analytics: window.debugAnalytics,
            data: window.debugData
        };

        console.log('🔧 Debug Console initialized. Available methods:', Object.keys(window.debug));
    }

    setupProductionMonitoring() {
        // Monitor critical metrics even in production
        this.startHealthCheck();
        this.monitorCriticalErrors();
    }

    startHealthCheck() {
        setInterval(() => {
            const health = this.getHealthStatus();
            
            if (!health.healthy) {
                console.error('Health check failed:', health.issues);
                
                // Try to recover from common issues
                this.attemptAutoRecovery(health.issues);
            }
        }, 30000); // Check every 30 seconds
    }

    monitorCriticalErrors() {
        // Monitor for critical error patterns
        setInterval(() => {
            const errors = window.ProductionErrorHandler?.errorLog || [];
            const recentErrors = errors.filter(error => 
                Date.now() - new Date(error.timestamp).getTime() < 300000 // Last 5 minutes
            );

            if (recentErrors.length > 10) {
                console.error('High error rate detected:', recentErrors.length, 'errors in 5 minutes');
                this.sendCriticalAlert(recentErrors);
            }
        }, 60000); // Check every minute
    }

    // Status methods
    getSystemStatus() {
        const browserCompat = window.BrowserCompatibility;
        return {
            browser: browserCompat?.browserInfo || 'Unknown',
            featuresEnabled: Object.values(browserCompat?.features || {}).filter(f => f).length,
            totalFeatures: Object.keys(browserCompat?.features || {}).length,
            storageAvailable: browserCompat?.features.localStorage || false,
            configLoaded: !!(window.LocalConversationEngine?.config),
            uptime: this.formatUptime(Date.now() - (window.PerformanceManager?.startTime || Date.now()))
        };
    }

    getPerformanceMetrics() {
        const perfManager = window.PerformanceManager;
        return {
            pageLoad: perfManager?.metrics.pageLoad?.loadComplete || 0,
            configLoad: perfManager?.metrics.configLoad?.duration || 0,
            memoryUsage: perfManager?.getCurrentMemoryUsage() || 0,
            speechLatency: perfManager?.getAverageSpeechLatency() || 0
        };
    }

    getRecentErrors() {
        const errors = window.ProductionErrorHandler?.errorLog || [];
        return errors.slice(-5).map(error => ({
            type: error.type,
            message: error.message.substring(0, 50) + (error.message.length > 50 ? '...' : ''),
            time: new Date(error.timestamp).toLocaleTimeString()
        }));
    }

    getAnalyticsStatus() {
        const analytics = window.AnalyticsManager;
        return {
            enabled: analytics?.isEnabled || false,
            eventsCount: analytics?.events?.length || 0,
            sessionId: analytics?.sessionId || 'unknown'
        };
    }

    getHealthStatus() {
        const issues = [];
        
        // Check critical systems
        if (!window.LocalConversationEngine) issues.push('Conversation engine not loaded');
        if (!window.BrowserCompatibility?.features.localStorage) issues.push('Local storage unavailable');
        if (window.ProductionErrorHandler?.errorLog?.length > 20) issues.push('High error count');
        
        const memoryUsage = window.PerformanceManager?.getCurrentMemoryUsage() || 0;
        if (memoryUsage > 100) issues.push('High memory usage');

        return {
            healthy: issues.length === 0,
            issues: issues
        };
    }

    // Action methods
    exportLogs() {
        const data = {
            timestamp: new Date().toISOString(),
            system: this.getSystemStatus(),
            performance: this.getPerformanceMetrics(),
            errors: window.ProductionErrorHandler?.errorLog || [],
            analytics: window.AnalyticsManager?.events || [],
            bookings: window.DataManager?.getAllBookings() || [],
            config: window.LocalConversationEngine?.config || null
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `debug-export-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    clearData() {
        if (confirm('Clear all debug data? This will remove error logs, analytics, and may affect functionality.')) {
            localStorage.clear();
            sessionStorage.clear();
            window.ProductionErrorHandler?.clearErrorLog();
            window.AnalyticsManager?.clearAnalyticsData();
            console.clear();
            alert('Debug data cleared');
        }
    }

    testFeatures() {
        console.log('🧪 Testing features...');
        
        // Test voice recognition
        if (window.BrowserCompatibility?.features.speechRecognition) {
            console.log('✅ Speech recognition available');
        } else {
            console.log('❌ Speech recognition not available');
        }

        // Test storage
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            console.log('✅ Local storage working');
        } catch (e) {
            console.log('❌ Local storage failed:', e);
        }

        // Test configuration
        if (window.LocalConversationEngine?.config) {
            console.log('✅ Configuration loaded');
        } else {
            console.log('❌ Configuration not loaded');
        }

        console.log('🧪 Feature test complete');
    }

    forceError() {
        // Trigger test error for debugging
        window.ProductionErrorHandler?.handleError('Test Error', new Error('This is a test error for debugging purposes'));
    }

    attemptAutoRecovery(issues) {
        console.log('🔧 Attempting auto-recovery for issues:', issues);

        issues.forEach(issue => {
            switch (issue) {
                case 'High memory usage':
                    window.PerformanceManager?.optimizeMemory();
                    break;
                case 'High error count':
                    window.ProductionErrorHandler?.clearErrorLog();
                    break;
                case 'Conversation engine not loaded':
                    // Try to reload configuration
                    if (window.RestaurantConfigLoader) {
                        window.RestaurantConfigLoader.loadConfig().catch(console.error);
                    }
                    break;
            }
        });
    }

    sendCriticalAlert(errors) {
        // Local critical alert logging (no external dependencies)
        console.error('🚨 CRITICAL ALERT: High error rate detected', errors);
        
        if (window.AnalyticsManager) {
            window.AnalyticsManager.trackEvent('critical_error_rate', {
                error_count: errors.length,
                category: 'Monitoring'
            });
        }
    }

    // Utility methods
    formatUptime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }

    getBookingCount() {
        return window.DataManager?.getAllBookings()?.length || 0;
    }

    isConfigValid() {
        return !!(window.LocalConversationEngine?.config?.restaurant?.name);
    }

    isVoiceAvailable() {
        return !!(window.BrowserCompatibility?.features.speechRecognition);
    }
}

// Initialize debug console
window.ProductionDebugConsole = new ProductionDebugConsole();

// Add to global debug object
if (window.ProductionDebugConsole.isDebugMode) {
    console.log('🔧 Production Debug Console initialized');
    console.log('Available commands:');
    console.log('- Ctrl+Shift+D: Toggle debug panel');
    console.log('- Ctrl+Shift+E: Export logs');
    console.log('- Ctrl+Shift+C: Clear console');
    console.log('- window.debug: Access all debug tools');
}