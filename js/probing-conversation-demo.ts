// @ts-nocheck
/**
 * probing-conversation-demo.ts
 * Small session-aware probing engine used in demos to gather fields before booking.
 */

type ProbeResult = { [key: string]: string };

class ProbingConversationDemo {
	private sessionId: string;
	private state: ProbeResult = {};
	private required: string[];

	constructor(sessionId = `demo-${Date.now()}`) {
		this.sessionId = sessionId;
		this.required = ['name', 'date', 'time', 'partySize'];
	}

	pushAnswer(key: string, value: string) {
		this.state[key] = value;
	}

	missingFields(): string[] {
		return this.required.filter((k) => !this.state[k]);
	}

	isComplete(): boolean {
		return this.missingFields().length === 0;
	}

	getState(): ProbeResult { return { ...this.state }; }
}

declare global { interface Window { ProbingConversationDemo?: typeof ProbingConversationDemo } }
(window as any).ProbingConversationDemo = ProbingConversationDemo;
export default ProbingConversationDemo;
export {};
