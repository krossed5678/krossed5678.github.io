// @ts-nocheck
/**
 * missed-call-automation.ts
 * Simple automation to create follow-ups for missed calls.
 */

class MissedCallAutomation {
	static async createFollowUp(callId: string, to: string) {
		try { console.log('[MissedCall] followup', callId, to); } catch {}
		try {
			await fetch('/api/missed-call/followup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ callId, to }) });
		} catch {}
	}
}

declare global { interface Window { MissedCallAutomation?: typeof MissedCallAutomation } }
(window as any).MissedCallAutomation = MissedCallAutomation;
export default MissedCallAutomation;
export {};
