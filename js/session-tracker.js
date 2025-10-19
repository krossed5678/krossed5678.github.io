/**
 * Session Tracker for Persistent Conversations
 * Maintains conversation state across multiple interactions
 */

class ConversationSessionTracker {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.conversationHistory = [];
        this.extractedInfo = {
            customer_name: null,
            party_size: null,
            date: null,
            time: null,
            phone_number: null,
            special_requests: null
        };
        this.isComplete = false;
        this.startTime = new Date();
        
        console.log('🆔 Created conversation session:', this.sessionId);
    }

    generateSessionId() {
        return 'web-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
    }

    addMessage(role, message) {
        this.conversationHistory.push({
            role: role, // 'user' or 'assistant'
            message: message,
            timestamp: new Date()
        });
        
        console.log(`💬 Added ${role} message to session ${this.sessionId}`);
    }

    updateExtractedInfo(newInfo) {
        for (const key in newInfo) {
            if (newInfo[key] && newInfo[key] !== 'null') {
                this.extractedInfo[key] = newInfo[key];
                console.log(`✅ Updated ${key}: ${newInfo[key]}`);
            }
        }
    }

    getMissingInfo() {
        const required = ['customer_name', 'party_size', 'date', 'time'];
        return required.filter(field => !this.extractedInfo[field]);
    }

    isBookingComplete() {
        const missing = this.getMissingInfo();
        this.isComplete = missing.length === 0;
        return this.isComplete;
    }

    getSessionData() {
        return {
            sessionId: this.sessionId,
            extractedInfo: this.extractedInfo,
            conversationHistory: this.conversationHistory,
            isComplete: this.isComplete,
            startTime: this.startTime,
            missingInfo: this.getMissingInfo()
        };
    }

    reset() {
        this.conversationHistory = [];
        this.extractedInfo = {
            customer_name: null,
            party_size: null,
            date: null,
            time: null,
            phone_number: null,
            special_requests: null
        };
        this.isComplete = false;
        console.log('🔄 Reset conversation session:', this.sessionId);
    }
}

/**
 * Enhanced Voice Conversation with Session Tracking
 */
class SessionAwareVoiceConversation {
    constructor(apiClient) {
        this.apiClient = apiClient;
        this.session = new ConversationSessionTracker();
        this.isListening = false;
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        
        this.setupSpeechRecognition();
        this.createConversationInterface();
    }

    setupSpeechRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.error('❌ Speech recognition not supported');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            console.log('🎤 Voice input:', transcript);
            this.handleVoiceInput(transcript);
        };

        this.recognition.onerror = (event) => {
            console.error('❌ Speech recognition error:', event.error);
            this.updateConversationStatus('Speech recognition error: ' + event.error, 'error');
        };

        this.recognition.onend = () => {
            this.isListening = false;
            this.updateVoiceButton(false);
        };
    }

    async handleVoiceInput(transcript) {
        try {
            this.updateConversationStatus('Processing your request...', 'info');
            this.session.addMessage('user', transcript);
            
            // Send to server with session tracking
            const response = await this.apiClient.processTextConversation({
                transcript: transcript,
                sessionId: this.session.sessionId
            });

            if (response.success) {
                this.session.addMessage('assistant', response.aiResponse);
                
                // Update extracted information if available
                if (response.extractedInfo) {
                    this.session.updateExtractedInfo(response.extractedInfo);
                }

                // Check if booking was created
                if (response.action === 'booking_created' && response.booking) {
                    this.handleBookingCompleted(response.booking, response.aiResponse);
                } else {
                    this.handleContinueConversation(response.aiResponse);
                }
                
                this.updateSessionDisplay();
                
            } else {
                this.updateConversationStatus('Sorry, I had trouble processing that. Please try again.', 'error');
            }

        } catch (error) {
            console.error('❌ Voice conversation error:', error);
            this.updateConversationStatus('Connection error. Please try again.', 'error');
        }
    }

    handleBookingCompleted(booking, aiResponse) {
        console.log('✅ Booking completed:', booking);
        this.speak(aiResponse);
        this.updateConversationStatus('🎉 Booking completed successfully!', 'success');
        
        // Show booking confirmation
        this.showBookingConfirmation(booking);
        
        // Reset for next conversation
        setTimeout(() => {
            this.session.reset();
            this.updateSessionDisplay();
        }, 3000);
    }

    handleContinueConversation(aiResponse) {
        console.log('🔄 Continuing conversation...');
        this.speak(aiResponse);
        this.updateConversationStatus('Please provide the missing information', 'info');
        
        // Automatically start listening for the next response
        setTimeout(() => {
            if (!this.session.isComplete) {
                this.startListening();
            }
        }, 2000);
    }

    speak(text) {
        if (this.synthesis && text) {
            // Cancel any ongoing speech
            this.synthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 1;
            utterance.volume = 0.8;
            
            this.synthesis.speak(utterance);
            console.log('🔊 Speaking:', text);
        }
    }

    startListening() {
        if (!this.recognition) {
            this.updateConversationStatus('Speech recognition not available', 'error');
            return;
        }

        if (this.isListening) {
            this.recognition.stop();
            return;
        }

        this.isListening = true;
        this.updateVoiceButton(true);
        this.updateConversationStatus('Listening... Speak now!', 'info');
        
        try {
            this.recognition.start();
        } catch (error) {
            console.error('❌ Failed to start speech recognition:', error);
            this.isListening = false;
            this.updateVoiceButton(false);
        }
    }

    createConversationInterface() {
        // Add conversation interface to the page
        const conversationPanel = document.createElement('div');
        conversationPanel.className = 'conversation-panel';
        conversationPanel.innerHTML = `
            <div class="conversation-header">
                <h3>🎤 Smart Booking Conversation</h3>
                <div class="session-info">
                    <span id="session-status">Session: ${this.session.sessionId.split('-').pop()}</span>
                </div>
            </div>
            
            <div class="conversation-content">
                <div class="session-progress">
                    <h4>Booking Progress:</h4>
                    <div id="booking-progress" class="progress-grid">
                        <div class="progress-item" data-field="customer_name">
                            <span class="label">Name:</span>
                            <span class="value">—</span>
                        </div>
                        <div class="progress-item" data-field="party_size">
                            <span class="label">Party Size:</span>
                            <span class="value">—</span>
                        </div>
                        <div class="progress-item" data-field="date">
                            <span class="label">Date:</span>
                            <span class="value">—</span>
                        </div>
                        <div class="progress-item" data-field="time">
                            <span class="label">Time:</span>
                            <span class="value">—</span>
                        </div>
                    </div>
                </div>
                
                <div class="conversation-controls">
                    <button id="voice-button" class="voice-btn">
                        <span class="mic-icon">🎤</span>
                        <span class="btn-text">Start Conversation</span>
                    </button>
                    <button id="reset-conversation" class="reset-btn">Reset</button>
                </div>
                
                <div id="conversation-status" class="status-message"></div>
                
                <div id="booking-confirmation" class="booking-confirmation" style="display: none;">
                    <h4>✅ Booking Confirmed!</h4>
                    <div id="confirmation-details"></div>
                </div>
            </div>
        `;

        // Add styles
        this.addConversationStyles();
        
        // Insert after existing voice controls
        const existingVoice = document.querySelector('#voice-controls');
        if (existingVoice) {
            existingVoice.parentNode.insertBefore(conversationPanel, existingVoice.nextSibling);
        } else {
            document.body.appendChild(conversationPanel);
        }

        // Setup event listeners
        document.getElementById('voice-button').addEventListener('click', () => {
            this.startListening();
        });

        document.getElementById('reset-conversation').addEventListener('click', () => {
            this.resetConversation();
        });

        this.updateSessionDisplay();
    }

    addConversationStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .conversation-panel {
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                margin: 20px;
                padding: 20px;
                max-width: 500px;
            }
            
            .conversation-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                border-bottom: 1px solid #e5e7eb;
                padding-bottom: 15px;
            }
            
            .conversation-header h3 {
                margin: 0;
                color: #1f2937;
                font-size: 18px;
            }
            
            .session-info {
                font-size: 12px;
                color: #6b7280;
            }
            
            .progress-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 12px;
                margin-bottom: 20px;
            }
            
            .progress-item {
                display: flex;
                justify-content: space-between;
                padding: 8px 12px;
                background: #f9fafb;
                border-radius: 6px;
                border-left: 3px solid #e5e7eb;
            }
            
            .progress-item.completed {
                background: #f0fdf4;
                border-left-color: #10b981;
            }
            
            .progress-item .label {
                font-weight: 500;
                color: #374151;
            }
            
            .progress-item .value {
                color: #6b7280;
                font-weight: 600;
            }
            
            .progress-item.completed .value {
                color: #059669;
            }
            
            .conversation-controls {
                display: flex;
                gap: 12px;
                margin-bottom: 15px;
            }
            
            .voice-btn {
                flex: 1;
                padding: 12px 20px;
                background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                transition: all 0.2s;
            }
            
            .voice-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
            }
            
            .voice-btn.listening {
                background: linear-gradient(135deg, #ef4444, #dc2626);
                animation: pulse 1.5s infinite;
            }
            
            .reset-btn {
                padding: 12px 16px;
                background: #f3f4f6;
                border: 1px solid #d1d5db;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .reset-btn:hover {
                background: #e5e7eb;
            }
            
            .status-message {
                padding: 10px;
                border-radius: 6px;
                font-size: 14px;
                min-height: 20px;
            }
            
            .status-message.info {
                background: #eff6ff;
                color: #1d4ed8;
                border: 1px solid #bfdbfe;
            }
            
            .status-message.success {
                background: #f0fdf4;
                color: #166534;
                border: 1px solid #bbf7d0;
            }
            
            .status-message.error {
                background: #fef2f2;
                color: #dc2626;
                border: 1px solid #fecaca;
            }
            
            .booking-confirmation {
                background: #f0fdf4;
                border: 2px solid #10b981;
                border-radius: 8px;
                padding: 16px;
                margin-top: 15px;
            }
            
            .booking-confirmation h4 {
                margin: 0 0 12px 0;
                color: #059669;
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }
        `;
        document.head.appendChild(style);
    }

    updateVoiceButton(listening) {
        const button = document.getElementById('voice-button');
        const text = document.querySelector('.btn-text');
        
        if (listening) {
            button.classList.add('listening');
            text.textContent = 'Listening...';
        } else {
            button.classList.remove('listening');
            text.textContent = this.session.isComplete ? 'Start New Conversation' : 'Continue Conversation';
        }
    }

    updateSessionDisplay() {
        const progressContainer = document.getElementById('booking-progress');
        
        for (const [field, value] of Object.entries(this.session.extractedInfo)) {
            const item = progressContainer.querySelector(`[data-field="${field}"]`);
            if (item) {
                const valueSpan = item.querySelector('.value');
                if (value && value !== 'null') {
                    valueSpan.textContent = value;
                    item.classList.add('completed');
                } else {
                    valueSpan.textContent = '—';
                    item.classList.remove('completed');
                }
            }
        }
    }

    updateConversationStatus(message, type = 'info') {
        const statusElement = document.getElementById('conversation-status');
        statusElement.textContent = message;
        statusElement.className = `status-message ${type}`;
    }

    showBookingConfirmation(booking) {
        const confirmationElement = document.getElementById('booking-confirmation');
        const detailsElement = document.getElementById('confirmation-details');
        
        detailsElement.innerHTML = `
            <div><strong>Name:</strong> ${booking.customer_name}</div>
            <div><strong>Party:</strong> ${booking.party_size} people</div>
            <div><strong>Date:</strong> ${booking.date}</div>
            <div><strong>Time:</strong> ${booking.time}</div>
            ${booking.confirmation_number ? `<div><strong>Confirmation:</strong> ${booking.confirmation_number}</div>` : ''}
        `;
        
        confirmationElement.style.display = 'block';
        
        // Hide after 5 seconds
        setTimeout(() => {
            confirmationElement.style.display = 'none';
        }, 5000);
    }

    resetConversation() {
        this.session.reset();
        this.updateSessionDisplay();
        this.updateConversationStatus('Ready to start a new booking conversation', 'info');
        this.updateVoiceButton(false);
        
        // Hide confirmation if visible
        const confirmationElement = document.getElementById('booking-confirmation');
        confirmationElement.style.display = 'none';
    }
}

// Update the API Client to support session tracking
if (typeof APIClient !== 'undefined') {
    APIClient.prototype.processTextConversation = async function(data) {
        console.log('📤 Sending text conversation request:', data);
        
        const response = await fetch(`${this.baseUrl}/api/text-conversation`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    };
}

// Export for use
window.SessionAwareVoiceConversation = SessionAwareVoiceConversation;
window.ConversationSessionTracker = ConversationSessionTracker;

console.log('📱 Session-aware conversation system loaded');