// @ts-nocheck
/**
 * production-error-handler.ts
 * Minimal production-safe error handler for logging and optional remote reporting.
 */

interface ErrorReport { message: string; stack?: string; extra?: any }

class ProductionErrorHandler {
	static capture(err: unknown, extra?: any) {
		const report: ErrorReport = {
			message: (err && (err as Error).message) || String(err),
			stack: (err && (err as Error).stack) || undefined,
			extra
		};
		// Local console log (kept concise in prod)
		try { console.error('[ProductionErrorHandler]', report.message, report.extra); } catch {}
		// Optionally send to remote endpoint if configured
		try {
			if (window && (window as any).__PROD_ERROR_ENDPOINT) {
				void fetch((window as any).__PROD_ERROR_ENDPOINT, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(report)
				});
			}
		} catch {}
	}
}

declare global { interface Window { ProductionErrorHandler?: typeof ProductionErrorHandler; __PROD_ERROR_ENDPOINT?: string } }
(window as any).ProductionErrorHandler = ProductionErrorHandler;
export default ProductionErrorHandler;
export {};
