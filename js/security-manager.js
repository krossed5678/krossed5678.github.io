/**
 * Security and Input Sanitization Module
 * Provides XSS protection and input validation for production deployment
 */

class SecurityManager {
    constructor() {
        this.initCSP();
        this.setupInputValidation();
    }

    // Content Security Policy helpers
    initCSP() {
        // Add CSP meta tag if not present
        if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
            const csp = document.createElement('meta');
            csp.setAttribute('http-equiv', 'Content-Security-Policy');
            csp.setAttribute('content', this.getCSPPolicy());
            document.head.appendChild(csp);
        }
    }

    getCSPPolicy() {
        return [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data:",
            "connect-src 'self'",
            "font-src 'self'",
            "media-src 'self'",
            "frame-src 'none'"
        ].join('; ');
    }

    // Input sanitization
    sanitizeInput(input, type = 'text') {
        if (typeof input !== 'string') {
            input = String(input);
        }

        switch (type) {
            case 'html':
                return this.sanitizeHTML(input);
            case 'text':
                return this.sanitizeText(input);
            case 'phone':
                return this.sanitizePhone(input);
            case 'email':
                return this.sanitizeEmail(input);
            case 'name':
                return this.sanitizeName(input);
            case 'number':
                return this.sanitizeNumber(input);
            default:
                return this.sanitizeText(input);
        }
    }

    sanitizeHTML(html) {
        // Remove script tags and event handlers
        const temp = document.createElement('div');
        temp.textContent = html; // This automatically escapes HTML
        return temp.innerHTML;
    }

    sanitizeText(text) {
        return text
            .replace(/[<>]/g, '') // Remove angle brackets
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+=/gi, '') // Remove event handlers
            .trim()
            .slice(0, 1000); // Limit length
    }

    sanitizePhone(phone) {
        // Allow only numbers, spaces, dashes, parentheses, and plus
        return phone.replace(/[^0-9\s\-\(\)\+]/g, '').trim().slice(0, 20);
    }

    sanitizeEmail(email) {
        // Basic email sanitization
        return email
            .toLowerCase()
            .replace(/[^a-z0-9@._-]/g, '')
            .trim()
            .slice(0, 254);
    }

    sanitizeName(name) {
        // Allow letters, spaces, hyphens, apostrophes
        return name
            .replace(/[^a-zA-Z\s\-'\.]/g, '')
            .trim()
            .slice(0, 100);
    }

    sanitizeNumber(number) {
        const parsed = parseFloat(number);
        return isNaN(parsed) ? 0 : Math.max(0, Math.min(parsed, 999999));
    }

    // Validate configuration objects
    validateConfiguration(config) {
        const errors = [];
        const required = ['restaurant', 'menu', 'brandVoice'];

        // Check required top-level properties
        required.forEach(prop => {
            if (!config[prop]) {
                errors.push(`Missing required property: ${prop}`);
            }
        });

        // Validate restaurant info
        if (config.restaurant) {
            const restaurantRequired = ['name', 'cuisine', 'location'];
            restaurantRequired.forEach(prop => {
                if (!config.restaurant[prop]) {
                    errors.push(`Missing restaurant property: ${prop}`);
                }
            });

            // Sanitize restaurant data
            if (config.restaurant.name) {
                config.restaurant.name = this.sanitizeText(config.restaurant.name);
            }
            if (config.restaurant.description) {
                config.restaurant.description = this.sanitizeHTML(config.restaurant.description);
            }
        }

        // Validate menu items
        if (config.menu && Array.isArray(config.menu.items)) {
            config.menu.items.forEach((item, index) => {
                if (!item.name || !item.price) {
                    errors.push(`Menu item ${index + 1} missing name or price`);
                }

                // Sanitize menu item data
                if (item.name) item.name = this.sanitizeText(item.name);
                if (item.description) item.description = this.sanitizeHTML(item.description);
                if (item.price) item.price = this.sanitizeNumber(item.price);
            });
        }

        // Validate brand voice
        if (config.brandVoice) {
            if (config.brandVoice.tone) {
                config.brandVoice.tone = this.sanitizeText(config.brandVoice.tone);
            }
            if (config.brandVoice.personality) {
                config.brandVoice.personality = this.sanitizeText(config.brandVoice.personality);
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors,
            sanitizedConfig: config
        };
    }

    // Rate limiting for API calls
    setupRateLimit() {
        this.rateLimits = new Map();
        this.rateLimitWindows = {
            booking: { limit: 5, window: 60000 }, // 5 bookings per minute
            speech: { limit: 30, window: 60000 },  // 30 speech requests per minute
            config: { limit: 10, window: 300000 }  // 10 config loads per 5 minutes
        };
    }

    checkRateLimit(type, identifier = 'default') {
        if (!this.rateLimits) this.setupRateLimit();

        const key = `${type}_${identifier}`;
        const limit = this.rateLimitWindows[type];
        
        if (!limit) return true;

        const now = Date.now();
        const requests = this.rateLimits.get(key) || [];
        
        // Remove old requests
        const validRequests = requests.filter(time => now - time < limit.window);
        
        if (validRequests.length >= limit.limit) {
            return false;
        }

        // Add current request
        validRequests.push(now);
        this.rateLimits.set(key, validRequests);
        
        return true;
    }

    // Privacy helpers
    setupPrivacyFeatures() {
        // Add privacy notice
        this.showPrivacyNotice();
        
        // Setup data retention policies
        this.setupDataRetention();
    }

    showPrivacyNotice() {
        const notice = localStorage.getItem('privacyNoticeShown');
        if (!notice) {
            const message = "This app uses voice recognition and stores booking data locally in your browser. No data is sent to external servers.";
            window.ProductionErrorHandler?.showNotification(message, 'info', 10000);
            localStorage.setItem('privacyNoticeShown', 'true');
        }
    }

    setupDataRetention() {
        // Clean up old data (older than 30 days)
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        
        try {
            const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
            const recentBookings = bookings.filter(booking => {
                const bookingDate = new Date(booking.date || booking.timestamp).getTime();
                return bookingDate > thirtyDaysAgo;
            });
            
            if (recentBookings.length !== bookings.length) {
                localStorage.setItem('bookings', JSON.stringify(recentBookings));
            }
        } catch (e) {
            console.warn('Failed to clean up old bookings:', e);
        }
    }

    // Secure random ID generation
    generateSecureId() {
        if (window.crypto && window.crypto.getRandomValues) {
            const array = new Uint8Array(16);
            window.crypto.getRandomValues(array);
            return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
        } else {
            // Fallback for older browsers
            return 'booking_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
    }
}

// Input validation helpers
const InputValidator = {
    email: (email) => {
        const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return pattern.test(email) && email.length <= 254;
    },

    phone: (phone) => {
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.length >= 10 && cleaned.length <= 15;
    },

    name: (name) => {
        return name && name.length >= 1 && name.length <= 100 && /^[a-zA-Z\s\-'\.]+$/.test(name);
    },

    partySize: (size) => {
        const num = parseInt(size);
        return !isNaN(num) && num >= 1 && num <= 50;
    },

    date: (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const maxFuture = new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 year ahead
        
        return date instanceof Date && 
               !isNaN(date.getTime()) && 
               date >= now && 
               date <= maxFuture;
    },

    time: (timeString) => {
        const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timePattern.test(timeString);
    }
};

// Create global security manager
window.SecurityManager = new SecurityManager();
window.InputValidator = InputValidator;

// Setup input validation
document.addEventListener('DOMContentLoaded', () => {
    window.SecurityManager.setupPrivacyFeatures();
});