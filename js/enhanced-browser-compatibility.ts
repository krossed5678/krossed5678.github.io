// @ts-nocheck
/**
 * enhanced-browser-compatibility.ts
 * Small helpers to polyfill or check for browser features.
 */

class EnhancedBrowserCompatibility {
	static supportsWebRTC(): boolean {
		return !!(navigator.mediaDevices && (navigator.mediaDevices.getUserMedia));
	}

	static supportsSpeechAPI(): boolean {
		return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || (window as any).speechSynthesis);
	}
}

declare global { interface Window { EnhancedBrowserCompatibility?: typeof EnhancedBrowserCompatibility } }
(window as any).EnhancedBrowserCompatibility = EnhancedBrowserCompatibility;
export default EnhancedBrowserCompatibility;
export {};

