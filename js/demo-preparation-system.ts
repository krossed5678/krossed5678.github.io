// Inlined demo-preparation-system.js — utilities to prepare demo environments
// @ts-nocheck

class DemoPreparationSystem {
	constructor() {
		this.lastSetup = null;
	}

	async setupDemo(options: { clearDb?: boolean; seedData?: boolean } = {}) {
		const result: any = { startedAt: new Date().toISOString() };
		if (options.clearDb) {
			try {
				await fetch('/api/admin/clear', { method: 'POST' });
				result.dbCleared = true;
			} catch (e) { result.dbCleared = false; }
		}

		if (options.seedData) {
			try {
				await fetch('/api/admin/seed', { method: 'POST' });
				result.seeded = true;
			} catch (e) { result.seeded = false; }
		}

		this.lastSetup = result;
		return result;
	}

	configureForLocal() {
		// Example: point API client to local backend
		if ((window as any).apiClient) apiClient.setBaseUrl(window.location.origin + '/api');
		return true;
	}

	quickPreview() {
		const overlay = document.createElement('div');
		overlay.className = 'demo-quick-preview';
		overlay.innerHTML = `<div class="demo-preview-card"><h3>Demo Ready</h3><p>Use the control panel to start simulated calls and bookings.</p><button onclick="this.closest('.demo-quick-preview').remove()">Close</button></div>`;
		document.body.appendChild(overlay);
	}
}

(window as any).demoPreparer = new DemoPreparationSystem();

export {};
