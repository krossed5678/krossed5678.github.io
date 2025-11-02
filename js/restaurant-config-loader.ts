// @ts-nocheck
/**
 * restaurant-config-loader.ts
 * Standalone TypeScript replacement for the legacy JS loader.
 * Responsibilities:
 * - Fetch remote JSON config (if available)
 * - Fall back to localStorage
 * - Provide simple in-memory caching
 */

type RestaurantConfig = Record<string, any>;

class RestaurantConfigLoader {
	private static cache: RestaurantConfig | null = null;

	static async load(): Promise<RestaurantConfig> {
		if (this.cache) return this.cache;
		// Try network first
		try {
			const resp = await fetch('/restaurant-config.json', { cache: 'no-store' });
			if (resp.ok) {
				const j = await resp.json();
				this.cache = j;
				try { localStorage.setItem('restaurantConfig', JSON.stringify(j)); } catch {}
				return j;
			}
		} catch (err) {
			// ignore and fallback
		}
		// LocalStorage fallback
		try {
			const raw = localStorage.getItem('restaurantConfig');
			if (raw) {
				this.cache = JSON.parse(raw);
				return this.cache;
			}
		} catch {}
		this.cache = {};
		return this.cache;
	}

	static save(config: RestaurantConfig) {
		this.cache = config;
		try { localStorage.setItem('restaurantConfig', JSON.stringify(config)); } catch {}
	}
}

declare global { interface Window { RestaurantConfigLoader?: typeof RestaurantConfigLoader } }
(window as any).RestaurantConfigLoader = RestaurantConfigLoader;
export default RestaurantConfigLoader;
export {};
