// Inlined voip-number-manager.js — manages available VoIP numbers and leasing
// @ts-nocheck

class VoipNumberManager {
	constructor() {
		this.pool = [];
		this.leases = new Map();
		this.loadDefaults();
	}

	loadDefaults() {
		// minimal seed; in prod this would come from API
		this.pool = ['+15550001111', '+15550002222', '+15550003333'];
	}

	listAvailable() { return this.pool.filter(n => !this.leases.has(n)); }

	leaseNumber(phoneNumber: string, holderId: string, ttlSeconds = 300) {
		if (this.leases.has(phoneNumber)) return false;
		const expires = Date.now() + ttlSeconds * 1000;
		this.leases.set(phoneNumber, { holderId, expires });
		setTimeout(() => { const entry = this.leases.get(phoneNumber); if (entry && entry.expires <= Date.now()) this.leases.delete(phoneNumber); }, ttlSeconds * 1000 + 1000);
		return true;
	}

	releaseNumber(phoneNumber: string) { return this.leases.delete(phoneNumber); }

	getLease(phoneNumber: string) { return this.leases.get(phoneNumber) || null; }
}

(window as any).voipNumberManager = new VoipNumberManager();

export {};
