// Converted from security-manager.js — inlined TypeScript implementation
// @ts-nocheck

class SecurityManager {
	rateLimits: Map<string, any> | undefined;
	rateLimitWindows: any;

	constructor() {
		this.initCSP();
		this.setupInputValidation();
	}

	initCSP() {
		if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
			const csp = document.createElement('meta');
			csp.setAttribute('http-equiv', 'Content-Security-Policy');
			csp.setAttribute('content', this.getCSPPolicy());
			document.head.appendChild(csp);
		}
	}

	getCSPPolicy() { return ["default-src 'self'","script-src 'self' 'unsafe-inline'","style-src 'self' 'unsafe-inline'","img-src 'self' data:","connect-src 'self'","font-src 'self'","media-src 'self'","frame-src 'none'"] .join('; '); }

	sanitizeInput(input: any, type = 'text') {
		if (typeof input !== 'string') input = String(input);
		switch (type) { case 'html': return this.sanitizeHTML(input); case 'text': return this.sanitizeText(input); case 'phone': return this.sanitizePhone(input); case 'email': return this.sanitizeEmail(input); case 'name': return this.sanitizeName(input); case 'number': return this.sanitizeNumber(input); default: return this.sanitizeText(input); }
	}

	sanitizeHTML(html: string) { const temp = document.createElement('div'); temp.textContent = html; return temp.innerHTML; }
	sanitizeText(text: string) { return text.replace(/[<>]/g, '').replace(/javascript:/gi, '').replace(/on\w+=/gi, '').trim().slice(0,1000); }
	sanitizePhone(phone: string) { return phone.replace(/[^0-9\s\-\(\)\+]/g, '').trim().slice(0,20); }
	sanitizeEmail(email: string) { return email.toLowerCase().replace(/[^a-z0-9@._-]/g, '').trim().slice(0,254); }
	sanitizeName(name: string) { return name.replace(/[^a-zA-Z\s\-'\.]/g, '').trim().slice(0,100); }
	sanitizeNumber(number: any) { const parsed = parseFloat(number); return isNaN(parsed) ? 0 : Math.max(0, Math.min(parsed, 999999)); }

	validateConfiguration(config: any) {
		const errors: string[] = [];
		const required = ['restaurant','menu','brandVoice'];
		required.forEach(prop => { if (!config[prop]) errors.push(`Missing required property: ${prop}`); });
		if (config.restaurant) { const restaurantRequired = ['name','cuisine','location']; restaurantRequired.forEach(prop => { if (!config.restaurant[prop]) errors.push(`Missing restaurant property: ${prop}`); }); if (config.restaurant.name) config.restaurant.name = this.sanitizeText(config.restaurant.name); if (config.restaurant.description) config.restaurant.description = this.sanitizeHTML(config.restaurant.description); }
		if (config.menu && Array.isArray(config.menu.items)) { config.menu.items.forEach((item: any, index: number) => { if (!item.name || !item.price) errors.push(`Menu item ${index+1} missing name or price`); if (item.name) item.name = this.sanitizeText(item.name); if (item.description) item.description = this.sanitizeHTML(item.description); if (item.price) item.price = this.sanitizeNumber(item.price); }); }
		if (config.brandVoice) { if (config.brandVoice.tone) config.brandVoice.tone = this.sanitizeText(config.brandVoice.tone); if (config.brandVoice.personality) config.brandVoice.personality = this.sanitizeText(config.brandVoice.personality); }
		return { isValid: errors.length === 0, errors, sanitizedConfig: config };
	}

	setupRateLimit() { this.rateLimits = new Map(); this.rateLimitWindows = { booking: { limit: 5, window: 60000 }, speech: { limit: 30, window: 60000 }, config: { limit: 10, window: 300000 } }; }

	checkRateLimit(type: string, identifier = 'default') {
		if (!this.rateLimits) this.setupRateLimit(); const key = `${type}_${identifier}`; const limit = this.rateLimitWindows[type]; if (!limit) return true; const now = Date.now(); const requests = this.rateLimits!.get(key) || []; const validRequests = requests.filter((time: number) => now - time < limit.window); if (validRequests.length >= limit.limit) return false; validRequests.push(now); this.rateLimits!.set(key, validRequests); return true;
	}

	setupPrivacyFeatures() { this.showPrivacyNotice(); this.setupDataRetention(); }

	showPrivacyNotice() { const notice = localStorage.getItem('privacyNoticeShown'); if (!notice) { const message = "This app uses voice recognition and stores booking data locally in your browser. No data is sent to external servers."; (window as any).ProductionErrorHandler?.showNotification?.(message, 'info', 10000); localStorage.setItem('privacyNoticeShown', 'true'); } }

	setupDataRetention() { const thirtyDaysAgo = Date.now() - (30*24*60*60*1000); try { const bookings = JSON.parse(localStorage.getItem('bookings') || '[]'); const recentBookings = bookings.filter((booking: any) => { const bookingDate = new Date(booking.date || booking.timestamp).getTime(); return bookingDate > thirtyDaysAgo; }); if (recentBookings.length !== bookings.length) localStorage.setItem('bookings', JSON.stringify(recentBookings)); } catch (e) { console.warn('Failed to clean up old bookings:', e); } }

	generateSecureId() { if ((window as any).crypto && (window as any).crypto.getRandomValues) { const array = new Uint8Array(16); (window as any).crypto.getRandomValues(array); return Array.from(array, (byte: number) => byte.toString(16).padStart(2,'0')).join(''); } else { return 'booking_' + Date.now() + '_' + Math.random().toString(36).substr(2,9); } }
}

const InputValidator = {
	email: (email: string) => { const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; return pattern.test(email) && email.length <= 254; },
	phone: (phone: string) => { const cleaned = phone.replace(/\D/g, ''); return cleaned.length >= 10 && cleaned.length <= 15; },
	name: (name: string) => { return !!name && name.length >= 1 && name.length <= 100 && /^[a-zA-Z\s\-'\.]+$/.test(name); },
	partySize: (size: any) => { const num = parseInt(size); return !isNaN(num) && num >= 1 && num <= 50; },
	date: (dateString: string) => { const date = new Date(dateString); const now = new Date(); const maxFuture = new Date(now.getTime() + (365*24*60*60*1000)); return date instanceof Date && !isNaN(date.getTime()) && date >= now && date <= maxFuture; },
	time: (timeString: string) => { const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/; return timePattern.test(timeString); }
};

(window as any).SecurityManager = new SecurityManager();
(window as any).InputValidator = InputValidator;

document.addEventListener('DOMContentLoaded', () => { (window as any).SecurityManager.setupPrivacyFeatures?.(); });

export { SecurityManager, InputValidator };

