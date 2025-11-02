// @ts-nocheck
/**
 * performance-manager.ts
 * Small helper to track simple performance markers and timings.
 */

class PerformanceManager {
	static markers: Record<string, number> = {};

	static mark(name: string) {
		this.markers[name] = Date.now();
	}

	static measure(name: string, start: string, end: string) {
		if (this.markers[start] && this.markers[end]) {
			const duration = this.markers[end] - this.markers[start];
			try { console.log(`[Perf] ${name}: ${duration}ms`); } catch {}
			return duration;
		}
		return null;
	}
}

declare global { interface Window { PerformanceManager?: typeof PerformanceManager } }
(window as any).PerformanceManager = PerformanceManager;
export default PerformanceManager;
export {};
