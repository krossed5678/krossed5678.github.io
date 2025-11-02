// @ts-nocheck
/**
 * in-house-voice-processor.ts
 * Lightweight client-side voice processing utilities (placeholder).
 */

class InHouseVoiceProcessor {
	static normalizeAudioBuffer(buffer: Float32Array): Float32Array {
		// Simple normalization placeholder
		let max = 0;
		for (let i = 0; i < buffer.length; i++) max = Math.max(max, Math.abs(buffer[i]));
		if (max === 0) return buffer;
		const out = new Float32Array(buffer.length);
		for (let i = 0; i < buffer.length; i++) out[i] = buffer[i] / max;
		return out;
	}
}

declare global { interface Window { InHouseVoiceProcessor?: typeof InHouseVoiceProcessor } }
(window as any).InHouseVoiceProcessor = InHouseVoiceProcessor;
export default InHouseVoiceProcessor;
export {};
