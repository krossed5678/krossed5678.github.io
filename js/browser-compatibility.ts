// Inlined browser-compatibility.js — feature detection and graceful fallbacks
// @ts-nocheck

const BrowserCompatibility = {
	isMobile() { return /Mobi|Android/i.test(navigator.userAgent); },
	supportsAudioWorklet() { return !!(window as any).AudioWorkletNode; },
	supportsWebRTC() { return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia); },
	ensureCompatibility() {
		if (!this.supportsWebRTC()) {
			console.warn('WebRTC not supported — audio features will be limited.');
		}
	}
};

BrowserCompatibility.ensureCompatibility();
(window as any).browserCompatibility = BrowserCompatibility;

export {};
