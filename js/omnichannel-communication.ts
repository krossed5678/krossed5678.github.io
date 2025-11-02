// @ts-nocheck
/**
 * omnichannel-communication.ts
 * Thin facade for sending messages to multiple channels.
 */

type Channel = 'sms' | 'voice' | 'email' | 'chat';

class OmnichannelCommunication {
	static async send(to: string, channel: Channel, payload: any) {
		try { console.log('[Omnichannel]', channel, to, payload); } catch {}
		try {
			await fetch('/api/omnichannel/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to, channel, payload }) });
		} catch {}
	}
}

declare global { interface Window { OmnichannelCommunication?: typeof OmnichannelCommunication } }
(window as any).OmnichannelCommunication = OmnichannelCommunication;
export default OmnichannelCommunication;
export {};
