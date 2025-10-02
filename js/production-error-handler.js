/**
 * Production Error Handler
 * Provides comprehensive error handling, logging, and recovery mechanisms
 */

class ProductionErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 100;
        this.init();
    }

    init() {
        // Global error handler
        window.addEventListener('error', (event) => {
            this.handleError('JavaScript Error', event.error, {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });

        // Promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError('Unhandled Promise Rejection', event.reason);
            event.preventDefault();
        });

        // Speech API error handlers
        this.setupSpeechErrorHandlers();
    }

    handleError(type, error, context = {}) {
        const errorInfo = {
            timestamp: new Date().toISOString(),
            type: type,
            message: error?.message || error || 'Unknown error',
            stack: error?.stack,
            context: context,
            url: window.location.href,
            userAgent: navigator.userAgent
        };

        // Log to console in development
        if (this.isDevelopment()) {
            console.error('Production Error:', errorInfo);
        }

        // Add to error log
        this.addToLog(errorInfo);

        // Send to analytics (if available)
        this.sendToAnalytics(errorInfo);

        // Show user-friendly message
        this.showUserMessage(type, error);

        return errorInfo;
    }

    addToLog(errorInfo) {
        this.errorLog.push(errorInfo);
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog.shift();
        }

        // Store in localStorage for debugging
        try {
            localStorage.setItem('errorLog', JSON.stringify(this.errorLog.slice(-10)));
        } catch (e) {
            // Storage full or unavailable
        }
    }

    sendToAnalytics(errorInfo) {
        // Local analytics tracking (no external dependencies)
        if (window.AnalyticsManager && !this.isDevelopment()) {
            window.AnalyticsManager.trackEvent('error', {
                type: errorInfo.type,
                message: errorInfo.message,
                category: 'System Errors'
            });
        }
    }

    showUserMessage(type, error) {
        const messages = {
            'JavaScript Error': 'Something went wrong. The page will try to recover automatically.',
            'Unhandled Promise Rejection': 'A background operation failed. Please try again.',
            'Speech Recognition Error': 'Voice recognition is having trouble. You can type your message instead.',
            'Speech Synthesis Error': 'Text-to-speech is unavailable. You\'ll see text responses instead.',
            'Configuration Error': 'There\'s an issue with the restaurant settings. Using default configuration.',
            'Network Error': 'Connection problem detected. Some features may be limited.',
            'Storage Error': 'Unable to save data locally. Your bookings may not persist.'
        };

        const message = messages[type] || 'An unexpected error occurred. Please refresh the page if problems persist.';
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info', duration = 5000) {
        // Create or get notification container
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
            `;
            document.body.appendChild(container);
        }

        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            background: ${type === 'error' ? '#ff4444' : type === 'warning' ? '#ffaa00' : '#4CAF50'};
            color: white;
            padding: 12px 16px;
            border-radius: 4px;
            margin-bottom: 10px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease-out;
            cursor: pointer;
        `;
        notification.textContent = message;

        // Add animation styles
        if (!document.getElementById('notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(styles);
        }

        // Add click to dismiss
        notification.addEventListener('click', () => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        });

        container.appendChild(notification);

        // Auto-dismiss
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.style.animation = 'slideOut 0.3s ease-out';
                    setTimeout(() => notification.remove(), 300);
                }
            }, duration);
        }
    }

    setupSpeechErrorHandlers() {
        // Will be called by speech components to register their error handlers
    }

    // Utility methods
    isDevelopment() {
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' ||
               window.location.protocol === 'file:';
    }

    // Export error log for debugging
    exportErrorLog() {
        const blob = new Blob([JSON.stringify(this.errorLog, null, 2)], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `error-log-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Clear error log
    clearErrorLog() {
        this.errorLog = [];
        localStorage.removeItem('errorLog');
        this.showNotification('Error log cleared', 'info', 2000);
    }

    // Get error statistics
    getErrorStats() {
        const stats = {
            total: this.errorLog.length,
            byType: {},
            recent: this.errorLog.slice(-5)
        };

        this.errorLog.forEach(error => {
            stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
        });

        return stats;
    }
}

// Create global error handler instance
window.ProductionErrorHandler = new ProductionErrorHandler();

// Expose debugging methods in development
if (window.ProductionErrorHandler.isDevelopment()) {
    window.debugErrors = {
        export: () => window.ProductionErrorHandler.exportErrorLog(),
        clear: () => window.ProductionErrorHandler.clearErrorLog(),
        stats: () => window.ProductionErrorHandler.getErrorStats(),
        log: window.ProductionErrorHandler.errorLog
    };
}