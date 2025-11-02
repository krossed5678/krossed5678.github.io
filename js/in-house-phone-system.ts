// @ts-nocheck
/**
 * in-house-phone-system.ts
 * Very small phone system facade for client demos.
 */

class InHousePhoneSystem {
	static async dial(number: string) {
		try { console.log('[PhoneSystem] dialing', number); } catch {}
	}

	static hangup() { try { console.log('[PhoneSystem] hangup'); } catch {} }
}

declare global { interface Window { InHousePhoneSystem?: typeof InHousePhoneSystem } }
(window as any).InHousePhoneSystem = InHousePhoneSystem;
export default InHousePhoneSystem;
export {};