// @ts-nocheck
/**
 * pos-system-integration.ts
 * Minimal POS integration shim (placeholder). Exposes methods to check item availability and create orders.
 */

type PosItem = { id: string; name: string; price: number };

class POSSystemIntegration {
	static async fetchMenu(): Promise<PosItem[]> {
		try {
			const resp = await fetch('/api/pos/menu');
			if (resp.ok) return await resp.json();
		} catch {}
		return [];
	}

	static async createOrder(order: any): Promise<{ success: boolean; orderId?: string }> {
		try {
			const resp = await fetch('/api/pos/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(order) });
			if (resp.ok) return await resp.json();
		} catch {}
		return { success: false };
	}
}

declare global { interface Window { POSSystemIntegration?: typeof POSSystemIntegration } }
(window as any).POSSystemIntegration = POSSystemIntegration;
export default POSSystemIntegration;
export {};
