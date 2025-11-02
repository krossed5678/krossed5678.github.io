// @ts-nocheck
/**
 * restaurant-config-generator.ts
 * Simple generator utilities for creating a default restaurant configuration.
 */

type RestaurantConfig = Record<string, any>;

class RestaurantConfigGenerator {
	static defaultConfig(): RestaurantConfig {
		return {
			name: 'Untitled Restaurant',
			timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
			locale: navigator.language || 'en-US',
			booking: {
				slots: [ { start: '09:00', end: '17:00' } ],
				maxPartySize: 6
			}
		};
	}

	static generateFrom(formValues: Record<string, any>): RestaurantConfig {
		const base = this.defaultConfig();
		return { ...base, ...formValues };
	}
}

declare global { interface Window { RestaurantConfigGenerator?: typeof RestaurantConfigGenerator } }
(window as any).RestaurantConfigGenerator = RestaurantConfigGenerator;
export default RestaurantConfigGenerator;
export {};
