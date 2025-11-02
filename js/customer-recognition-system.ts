// Converted from customer-recognition-system.js — inlined TypeScript implementation
// @ts-nocheck

class CustomerRecognitionSystem {
	constructor() {
		this.cache = new Map();
		this.init();
	}

	init() {
		// Wire into global event bus if present
		if (window.apiClient) {
			apiClient.on('call:received', (call) => this.identifyCaller(call));
		}
	}

	async identifyCaller(call) {
		const phone = call.phoneNumber || call.from;
		if (!phone) return null;

		if (this.cache.has(phone)) {
			return this.cache.get(phone);
		}

		// Try local DB first
		try {
			const resp = await fetch(`/api/customers?phone=${encodeURIComponent(phone)}`);
			if (resp.ok) {
				const data = await resp.json();
				if (data && data.customer) {
					this.cache.set(phone, data.customer);
					return data.customer;
				}
			}
		} catch (e) {
			console.warn('Customer lookup failed', e);
		}

		// Fallback heuristic recognition: VIP if number ends with 5
		const inferred = {
			phone,
			name: `Caller ${phone.slice(-4)}`,
			isVip: phone.endsWith('5'),
			estimatedLifetimeValue: phone.endsWith('5') ? 1000 : 0
		};
		this.cache.set(phone, inferred);
		return inferred;
	}

	clearCache() { this.cache.clear(); }
}

(window as any).customerRecognition = new CustomerRecognitionSystem();

export {};
