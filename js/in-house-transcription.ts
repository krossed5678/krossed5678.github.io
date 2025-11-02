// @ts-nocheck
/**
 * in-house-transcription.ts
 * Simple client-side transcription stub that delegates to Web Speech API if available.
 */

class InHouseTranscription {
	static async transcribeOnce(): Promise<string> {
		// If SpeechRecognition available, do a one-shot; otherwise return empty string.
		const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
		if (!SpeechRecognition) return '';
		return new Promise((resolve) => {
			try {
				const r = new SpeechRecognition();
				r.lang = navigator.language || 'en-US';
				r.interimResults = false;
				r.maxAlternatives = 1;
				r.onresult = (ev: any) => { resolve(ev.results[0][0].transcript || ''); };
				r.onerror = () => resolve('');
				r.start();
			} catch (e) { resolve(''); }
		});
	}
}

declare global { interface Window { InHouseTranscription?: typeof InHouseTranscription } }
(window as any).InHouseTranscription = InHouseTranscription;
export default InHouseTranscription;
export {};
