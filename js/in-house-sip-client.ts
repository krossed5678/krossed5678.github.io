// @ts-nocheck
/**
 * in-house-sip-client.ts
 * Lightweight placeholder for a SIP client API surface. This does not implement SIP, it's a shim.
 */

class InHouseSIPClient {
	connect() { console.log('[SIP] connect called'); }
	disconnect() { console.log('[SIP] disconnect called'); }
	async makeCall(target: string) { console.log('[SIP] makeCall', target); }
}

declare global { interface Window { InHouseSIPClient?: typeof InHouseSIPClient } }
(window as any).InHouseSIPClient = InHouseSIPClient;
export default InHouseSIPClient;
export {};
