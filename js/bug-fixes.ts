// Inlined bug-fixes.js — small runtime stability helpers
// @ts-nocheck

/**
 * This module centralizes small runtime patches and polyfills used across the app.
 */

function ensureConsoleMethods() {
	const methods = ['debug', 'info', 'warn', 'error', 'time', 'timeEnd'];
	(window as any).console = (window as any).console || {};
	for (const m of methods) {
		if (!(console as any)[m]) (console as any)[m] = (..._args: any[]) => {};
	}
}

function safeJSONParse(s: string) {
	try { return JSON.parse(s); } catch (e) { return null; }
}

function patchFetchForIE() {
	// lightweight shim: ensure fetch exists
	if (!window.fetch) {
		(window as any).fetch = function (url: string, opts: any = {}) {
			return new Promise((resolve, reject) => {
				const xhr = new XMLHttpRequest();
				xhr.open(opts.method || 'GET', url);
				for (const h in (opts.headers || {})) xhr.setRequestHeader(h, opts.headers[h]);
				xhr.onload = () => resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, text: () => Promise.resolve(xhr.responseText), json: () => Promise.resolve(safeJSONParse(xhr.responseText)) });
				xhr.onerror = reject;
				xhr.send(opts.body || null);
			});
		};
	}
}

ensureConsoleMethods();
patchFetchForIE();

// Export small API for tests
export const bugFixes = { ensureConsoleMethods, patchFetchForIE, safeJSONParse };

export default bugFixes;
