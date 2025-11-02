// @ts-nocheck
/**
 * local-conversation-engine.ts
 * Small local conversation engine intended for client-side demos/offline use.
 */

type Turn = { speaker: 'user' | 'bot'; text: string };

class LocalConversationEngine {
	private history: Turn[] = [];

	addUser(text: string) {
		this.history.push({ speaker: 'user', text });
	}

	addBot(text: string) {
		this.history.push({ speaker: 'bot', text });
	}

	getHistory(): Turn[] { return [...this.history]; }

	reset() { this.history = []; }
}

declare global { interface Window { LocalConversationEngine?: typeof LocalConversationEngine } }
(window as any).LocalConversationEngine = LocalConversationEngine;
export default LocalConversationEngine;
export {};
