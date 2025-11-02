// @ts-nocheck
/**
 * in-house-voice-conversation.ts
 * Small voice-oriented conversation manager for client-side handling.
 */

type VoiceTurn = { who: 'user' | 'system'; text: string; timestamp: number };

class InHouseVoiceConversation {
	private turns: VoiceTurn[] = [];

	pushUser(text: string) { this.turns.push({ who: 'user', text, timestamp: Date.now() }); }
	pushSystem(text: string) { this.turns.push({ who: 'system', text, timestamp: Date.now() }); }
	history(): VoiceTurn[] { return [...this.turns]; }
	clear() { this.turns = []; }
}

declare global { interface Window { InHouseVoiceConversation?: typeof InHouseVoiceConversation } }
(window as any).InHouseVoiceConversation = InHouseVoiceConversation;
export default InHouseVoiceConversation;
export {};
