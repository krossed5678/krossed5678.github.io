// @ts-nocheck
/**
 * production-debug-console.ts
 * Minimal debug console that can be enabled in dev builds.
 */

class ProductionDebugConsole {
	static enabled = Boolean((window as any).__DEBUG_MODE);

	static log(...args: any[]) {
		if (!this.enabled) return;
		try { console.log('[Debug]', ...args); } catch {}
	}

	static warn(...args: any[]) {
		if (!this.enabled) return;
		try { console.warn('[Debug]', ...args); } catch {}
	}

	static error(...args: any[]) {
		if (!this.enabled) return;
		try { console.error('[Debug]', ...args); } catch {}
	}
}

declare global { interface Window { ProductionDebugConsole?: typeof ProductionDebugConsole; __DEBUG_MODE?: boolean } }
(window as any).ProductionDebugConsole = ProductionDebugConsole;
export default ProductionDebugConsole;
export {};
