// Converted from voice-conversation.js — inlined TypeScript implementation
// @ts-nocheck

class VoiceConversation {
	apiClient: any;
	audioRecorder: any;
	isProcessing: boolean;
	speechRecognition: any;
	preferBrowserSpeech: boolean;

	constructor(apiClient: any) {
		this.apiClient = apiClient || (window as any).apiClient;
		this.audioRecorder = (window as any).audioRecorder || null;
		this.isProcessing = false;
		this.speechRecognition = null;
		this.preferBrowserSpeech = true;
	}

	initSpeechRecognition() {
		const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
		if (!SpeechRecognition) {
			console.log('⚠️ Browser speech recognition not supported');
			return false;
		}

		this.speechRecognition = new SpeechRecognition();
		this.speechRecognition.continuous = false;
		this.speechRecognition.interimResults = false;
		this.speechRecognition.lang = 'en-US';
		console.log('🗣️ Browser speech recognition initialized');
		return true;
	}

	async processConversation(audioBlob: Blob) {
		if (this.isProcessing) return;
		this.isProcessing = true;
		try {
			(window as any).UIManager?.showNotification('🤖 Having a conversation with Mistral AI...', 'info');
			const result = await this.apiClient.sendConversation(audioBlob);
			const short = result.transcription && result.transcription.length > 80 ? result.transcription.slice(0,77) + '...' : result.transcription;
			(window as any).UIManager?.updateElement('recognized', `You: ${short}`);

			if (result.aiResponse) await this.speakResponse(result.aiResponse);

			if (result.booking && result.action === 'booking_created') {
				await this.handleBookingCreated(result.booking, result.aiResponse);
				(window as any).UIManager?.showNotification('🎉 Booking created by AI!', 'success');
			} else {
				(window as any).UIManager?.showNotification(`AI: ${result.aiResponse}`, 'info');
			}
		} catch (error: any) {
			console.error('❌ Conversation processing error:', error);
			(window as any).UIManager?.showNotification('AI conversation failed: ' + (error?.message || error), 'error');
		} finally {
			this.isProcessing = false;
		}
	}

	async speakResponse(text: string) {
		try {
			if ('speechSynthesis' in window && text) {
				const utterance = new SpeechSynthesisUtterance(text);
				utterance.rate = 0.9; utterance.pitch = 1.0; utterance.volume = 0.8;
				const voices = (window as any).speechSynthesis.getVoices?.() || [];
				const preferred = voices.find((v: any) => v.name?.includes('Natural') || v.name?.includes('Neural') || v.lang?.startsWith('en'));
				if (preferred) utterance.voice = preferred;
				await new Promise<void>((resolve) => { utterance.onend = () => resolve(); utterance.onerror = () => resolve(); (window as any).speechSynthesis.speak(utterance); });
			}
		} catch (e) { console.error('❌ Error speaking response:', e); }
	}

	async handleBookingCreated(booking: any, aiResponse: string) {
		try {
			(window as any).BookingManager?.addBookingToUI?.(booking);
		} catch (e) { console.error('❌ Error handling booking creation:', e); }
	}

	async useBrowserSpeechRecognition() {
		if (!this.initSpeechRecognition()) throw new Error('Browser speech recognition not supported');
		return new Promise<string>((resolve, reject) => {
			(window as any).UIManager?.updateElement('recognized', 'Listening... Speak your booking request');
			this.speechRecognition.onresult = (event: any) => resolve(event.results[0][0].transcript);
			this.speechRecognition.onerror = (event: any) => reject(new Error(`Speech recognition failed: ${event.error}`));
			this.speechRecognition.onend = () => {};
			this.speechRecognition.start();
		});
	}

	async processTranscription(transcript: string) {
		if (this.isProcessing) return;
		this.isProcessing = true;
		try {
			(window as any).UIManager?.showNotification('🤖 Having a conversation with Mistral AI...', 'info');
			const result = await this.apiClient.sendTextConversation(transcript);
			(window as any).UIManager?.updateElement('recognized', `You: ${transcript.slice(0,80)}`);
			if (result.aiResponse) await this.speakResponse(result.aiResponse);
			if (result.booking && result.action === 'booking_created') {
				await this.handleBookingCreated(result.booking, result.aiResponse);
				(window as any).UIManager?.showNotification('🎉 Booking created by AI!', 'success');
			} else {
				(window as any).UIManager?.showNotification(`AI: ${result.aiResponse}`, 'info');
			}
		} catch (error: any) {
			console.error('❌ Error processing transcription:', error);
			(window as any).UIManager?.showNotification('Failed to process your request: ' + (error?.message || error), 'error');
		} finally { this.isProcessing = false; }
	}

	async startVoiceConversation() {
		try {
			await this.apiClient.checkHealth?.();
			if (this.preferBrowserSpeech && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) {
				try {
					(window as any).UIManager?.updateVoiceButton(true);
					const transcript = await this.useBrowserSpeechRecognition();
					(window as any).UIManager?.updateVoiceButton(false);
					await this.processTranscription(transcript);
					return;
				} catch (speechError) {
					(window as any).UIManager?.showNotification('Browser speech failed, trying server processing...', 'info');
				}
			}

			// Fallback: server-side audio processing
			(window as any).UIManager?.updateVoiceButton(true);
			const stream = await this.audioRecorder?.requestMicrophoneAccess?.();
			const audioBlob = await this.audioRecorder?.startRecording?.(stream);
			(window as any).UIManager?.updateVoiceButton(false);
			await this.processConversation(audioBlob);
		} catch (error: any) {
			console.error('❌ Voice conversation error:', error);
			(window as any).UIManager?.showNotification('Voice conversation failed: ' + (error?.message || error), 'error');
			(window as any).UIManager?.updateVoiceButton(false);
		}
	}
}

// Expose globally for compatibility
(window as any).VoiceConversation = VoiceConversation;

export {};
