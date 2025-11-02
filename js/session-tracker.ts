// Converted from session-tracker.js — inlined TypeScript implementation
// @ts-nocheck

class ConversationSessionTracker {
	sessionId: string;
	conversationHistory: any[];
	extractedInfo: any;
	isComplete: boolean;
	startTime: Date;

	constructor() {
		this.sessionId = this.generateSessionId();
		this.conversationHistory = [];
		this.extractedInfo = { customer_name: null, party_size: null, date: null, time: null, phone_number: null, special_requests: null };
		this.isComplete = false;
		this.startTime = new Date();
		console.log('🆔 Created conversation session:', this.sessionId);
	}

	generateSessionId() { return 'web-' + Date.now() + '-' + Math.random().toString(36).substr(2,6); }

	addMessage(role: string, message: string) { this.conversationHistory.push({ role, message, timestamp: new Date() }); console.log(`💬 Added ${role} message to session ${this.sessionId}`); }

	updateExtractedInfo(newInfo: any) { for (const k in newInfo) { if (newInfo[k] && newInfo[k] !== 'null') { this.extractedInfo[k] = newInfo[k]; console.log(`✅ Updated ${k}: ${newInfo[k]}`); } } }

	getMissingInfo() { const required = ['customer_name','party_size','date','time']; return required.filter(f => !this.extractedInfo[f]); }

	isBookingComplete() { const missing = this.getMissingInfo(); this.isComplete = missing.length === 0; return this.isComplete; }

	getSessionData() { return { sessionId: this.sessionId, extractedInfo: this.extractedInfo, conversationHistory: this.conversationHistory, isComplete: this.isComplete, startTime: this.startTime, missingInfo: this.getMissingInfo() }; }

	reset() { this.conversationHistory = []; this.extractedInfo = { customer_name: null, party_size: null, date: null, time: null, phone_number: null, special_requests: null }; this.isComplete = false; console.log('🔄 Reset conversation session:', this.sessionId); }
}

class SessionAwareVoiceConversation {
	apiClient: any;
	session: ConversationSessionTracker;
	isListening: boolean;
	recognition: any;
	synthesis: any;

	constructor(apiClient: any) {
		this.apiClient = apiClient || (window as any).apiClient;
		this.session = new ConversationSessionTracker();
		this.isListening = false; this.recognition = null; this.synthesis = (window as any).speechSynthesis;
		this.setupSpeechRecognition(); this.createConversationInterface();
	}

	setupSpeechRecognition() { const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition; if (!SpeechRecognition) { console.error('❌ Speech recognition not supported'); return; } this.recognition = new SpeechRecognition(); this.recognition.continuous = false; this.recognition.interimResults = false; this.recognition.lang = 'en-US'; this.recognition.onresult = (event: any) => { const transcript = event.results[0][0].transcript; this.handleVoiceInput(transcript); }; this.recognition.onerror = (e: any) => { console.error('❌ Speech recognition error:', e.error); this.updateConversationStatus('Speech recognition error: ' + e.error, 'error'); }; this.recognition.onend = () => { this.isListening = false; this.updateVoiceButton(false); }; }

	async handleVoiceInput(transcript: string) { try { this.updateConversationStatus('Processing your request...', 'info'); this.session.addMessage('user', transcript); const response = await this.apiClient.processTextConversation({ transcript, sessionId: this.session.sessionId }); if (response.success) { this.session.addMessage('assistant', response.aiResponse); if (response.extractedInfo) this.session.updateExtractedInfo(response.extractedInfo); if (response.action === 'booking_created' && response.booking) { this.handleBookingCompleted(response.booking, response.aiResponse); } else { this.handleContinueConversation(response.aiResponse); } this.updateSessionDisplay(); } else { this.updateConversationStatus('Sorry, I had trouble processing that. Please try again.', 'error'); } } catch (e) { console.error('❌ Voice conversation error:', e); this.updateConversationStatus('Connection error. Please try again.', 'error'); } }

	handleBookingCompleted(booking: any, aiResponse: string) { this.speak(aiResponse); this.updateConversationStatus('🎉 Booking completed successfully!', 'success'); this.showBookingConfirmation(booking); setTimeout(()=>{ this.session.reset(); this.updateSessionDisplay(); }, 3000); }

	handleContinueConversation(aiResponse: string) { this.speak(aiResponse); this.updateConversationStatus('Please provide the missing information', 'info'); setTimeout(()=>{ if (!this.session.isComplete) this.startListening(); }, 2000); }

	speak(text: string) { if (this.synthesis && text) { this.synthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.rate = 0.9; utterance.pitch = 1; utterance.volume = 0.8; this.synthesis.speak(utterance); } }

	startListening() { if (!this.recognition) { this.updateConversationStatus('Speech recognition not available', 'error'); return; } if (this.isListening) { this.recognition.stop(); return; } this.isListening = true; this.updateVoiceButton(true); this.updateConversationStatus('Listening... Speak now!', 'info'); try { this.recognition.start(); } catch (e) { console.error('❌ Failed to start speech recognition:', e); this.isListening = false; this.updateVoiceButton(false); } }

	createConversationInterface() { /* builds minimal conversation UI similar to original */ const conversationPanel = document.createElement('div'); conversationPanel.className = 'conversation-panel'; conversationPanel.innerHTML = `<div class="conversation-header"><h3>🎤 Smart Booking Conversation</h3><div class="session-info"><span id="session-status">Session: ${this.session.sessionId.split('-').pop()}</span></div></div><div class="conversation-content"><div id="booking-progress"></div><div class="conversation-controls"><button id="voice-button" class="voice-btn"><span class="mic-icon">🎤</span><span class="btn-text">Start Conversation</span></button><button id="reset-conversation" class="reset-btn">Reset</button></div><div id="conversation-status" class="status-message"></div><div id="booking-confirmation" class="booking-confirmation" style="display:none;"><h4>✅ Booking Confirmed!</h4><div id="confirmation-details"></div></div></div>`; document.body.appendChild(conversationPanel); document.getElementById('voice-button')?.addEventListener('click', ()=> this.startListening()); document.getElementById('reset-conversation')?.addEventListener('click', ()=> this.resetConversation()); this.updateSessionDisplay(); }

	updateVoiceButton(listening: boolean) { const button = document.getElementById('voice-button'); const text = document.querySelector('.btn-text'); if (listening) { button?.classList.add('listening'); if (text) text.textContent = 'Listening...'; } else { button?.classList.remove('listening'); if (text) text.textContent = this.session.isComplete ? 'Start New Conversation' : 'Continue Conversation'; } }

	updateSessionDisplay() { const progressContainer = document.getElementById('booking-progress'); if (!progressContainer) return; for (const [field, value] of Object.entries(this.session.extractedInfo)) { const el = document.createElement('div'); el.textContent = `${field}: ${value || '—'}`; progressContainer.appendChild(el); } }

	updateConversationStatus(message: string, type = 'info') { const statusElement = document.getElementById('conversation-status'); if (statusElement) { statusElement.textContent = message; statusElement.className = `status-message ${type}`; } }

	showBookingConfirmation(booking: any) { const confirmationElement = document.getElementById('booking-confirmation'); const detailsElement = document.getElementById('confirmation-details'); if (detailsElement) detailsElement.innerHTML = `<div><strong>Name:</strong> ${booking.customer_name}</div><div><strong>Party:</strong> ${booking.party_size} people</div><div><strong>Date:</strong> ${booking.date}</div><div><strong>Time:</strong> ${booking.time}</div>`; if (confirmationElement) confirmationElement.style.display = 'block'; setTimeout(()=>{ if (confirmationElement) confirmationElement.style.display = 'none'; }, 5000); }

	resetConversation() { this.session.reset(); this.updateSessionDisplay(); this.updateConversationStatus('Ready to start a new booking conversation','info'); this.updateVoiceButton(false); const confirmationElement = document.getElementById('booking-confirmation'); if (confirmationElement) confirmationElement.style.display = 'none'; }
}

// Patch APIClient to support processTextConversation if present
if (typeof (window as any).APIClient !== 'undefined') {
	(window as any).APIClient.prototype.processTextConversation = async function(data: any) {
		const response = await fetch(`${this.baseUrl}/api/text-conversation`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
		if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		return await response.json();
	};
}

export { ConversationSessionTracker, SessionAwareVoiceConversation };

