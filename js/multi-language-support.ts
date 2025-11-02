// @ts-nocheck
/**
 * multi-language-support.ts
 * Simple language utilities for formatting and message selection.
 */

class MultiLanguageSupport {
	static getLocale(): string { return navigator.language || 'en-US'; }

	static t(key: string, locale?: string): string {
		// Placeholder: in production you'd load translation maps.
		const map: Record<string, string> = {
			'greeting': 'Hello',
			'book.confirmation': 'Your booking is confirmed.'
		};
		return map[key] || key;
	}
}

declare global { interface Window { MultiLanguageSupport?: typeof MultiLanguageSupport } }
(window as any).MultiLanguageSupport = MultiLanguageSupport;
export default MultiLanguageSupport;
export {};
