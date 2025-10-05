/**
 * In-House SIP Client
 * Connects to self-hosted Asterisk/FreePBX servers for real telephony
 */

class InHouseSIPClient {
    constructor(config = {}) {
        this.config = {
            server: config.server || 'wss://your-asterisk-server.com:8089/ws',
            username: config.username || 'restaurant-ai',
            password: config.password || '',
            domain: config.domain || 'your-asterisk-server.com',
            displayName: config.displayName || 'Restaurant AI',
            ...config
        };

        this.ua = null;
        this.currentSession = null;
        this.isRegistered = false;
        this.isCallActive = false;
        
        this.init();
    }

    init() {
        this.createSIPUA();
        this.setupEventHandlers();
        this.loadConfiguration();
    }

    createSIPUA() {
        // Simple SIP implementation (in production, use SIP.js library)
        this.ua = {
            configuration: this.config,
            sessions: new Map(),
            
            // Mock SIP methods for demonstration
            register: () => this.handleRegistration(),
            invite: (target) => this.handleInvite(target),
            answer: () => this.handleAnswer(),
            bye: () => this.handleBye(),
            
            // Event handlers
            on: (event, handler) => {
                if (!this.eventHandlers) this.eventHandlers = {};
                if (!this.eventHandlers[event]) this.eventHandlers[event] = [];
                this.eventHandlers[event].push(handler);
            },
            
            emit: (event, data) => {
                if (this.eventHandlers && this.eventHandlers[event]) {
                    this.eventHandlers[event].forEach(handler => handler(data));
                }
            }
        };

        console.log('📞 SIP User Agent created');
    }

    setupEventHandlers() {
        // Registration events
        this.ua.on('registered', () => {
            this.isRegistered = true;
            this.updateConnectionStatus('Registered to SIP server');
            console.log('✅ SIP registration successful');
        });

        this.ua.on('unregistered', () => {
            this.isRegistered = false;
            this.updateConnectionStatus('Disconnected from SIP server');
            console.log('❌ SIP unregistered');
        });

        this.ua.on('registrationFailed', (error) => {
            this.isRegistered = false;
            this.updateConnectionStatus(`Registration failed: ${error.message}`);
            console.error('❌ SIP registration failed:', error);
        });

        // Incoming call events
        this.ua.on('invite', (session) => {
            this.handleIncomingCall(session);
        });

        // Connection events
        this.ua.on('connected', () => {
            this.updateConnectionStatus('Connected to SIP server');
        });

        this.ua.on('disconnected', () => {
            this.updateConnectionStatus('Disconnected from SIP server');
        });
    }

    async register() {
        try {
            this.updateConnectionStatus('Connecting to SIP server...');
            
            // In a real implementation, this would connect to your Asterisk server
            await this.simulateRegistration();
            
        } catch (error) {
            console.error('SIP registration error:', error);
            this.updateConnectionStatus(`Registration failed: ${error.message}`);
        }
    }

    async simulateRegistration() {
        // Simulate SIP registration process
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (this.config.server && this.config.username) {
                    this.ua.emit('registered');
                    resolve();
                } else {
                    reject(new Error('Invalid SIP configuration'));
                }
            }, 2000);
        });
    }

    async makeCall(phoneNumber) {
        if (!this.isRegistered) {
            throw new Error('Not registered to SIP server');
        }

        try {
            this.updateConnectionStatus(`Calling ${phoneNumber}...`);
            
            // Create session
            const session = await this.createOutgoingSession(phoneNumber);
            this.currentSession = session;
            
            // Setup session events
            this.setupSessionEvents(session);
            
            // Start call
            await session.invite();
            
            console.log(`📞 Outgoing call to ${phoneNumber}`);
            
        } catch (error) {
            console.error('Call failed:', error);
            this.updateConnectionStatus(`Call failed: ${error.message}`);
            throw error;
        }
    }

    async createOutgoingSession(phoneNumber) {
        // Mock session for demonstration
        const session = {
            id: 'session_' + Date.now(),
            remoteIdentity: { uri: `sip:${phoneNumber}@${this.config.domain}` },
            localIdentity: { uri: `sip:${this.config.username}@${this.config.domain}` },
            state: 'initial',
            
            invite: async () => {
                session.state = 'trying';
                this.simulateCallProgress(session);
            },
            
            accept: async () => {
                session.state = 'established';
                this.isCallActive = true;
                this.updateConnectionStatus('Call connected');
            },
            
            reject: () => {
                session.state = 'terminated';
                this.updateConnectionStatus('Call rejected');
            },
            
            bye: () => {
                session.state = 'terminated';
                this.endCall();
            },
            
            // Event handling
            on: (event, handler) => {
                if (!session.eventHandlers) session.eventHandlers = {};
                if (!session.eventHandlers[event]) session.eventHandlers[event] = [];
                session.eventHandlers[event].push(handler);
            },
            
            emit: (event, data) => {
                if (session.eventHandlers && session.eventHandlers[event]) {
                    session.eventHandlers[event].forEach(handler => handler(data));
                }
            }
        };

        return session;
    }

    simulateCallProgress(session) {
        // Simulate call progression: trying -> ringing -> answered
        setTimeout(() => {
            if (session.state === 'trying') {
                session.state = 'ringing';
                this.updateConnectionStatus('Ringing...');
                session.emit('progress');
            }
        }, 1000);

        setTimeout(() => {
            if (session.state === 'ringing') {
                session.accept();
                session.emit('accepted');
            }
        }, 4000);
    }

    setupSessionEvents(session) {
        session.on('progress', () => {
            console.log('📞 Call progress...');
        });

        session.on('accepted', () => {
            console.log('📞 Call accepted');
            this.startCallTimer();
            
            // Integrate with restaurant AI
            this.connectCallToAI(session);
        });

        session.on('rejected', () => {
            console.log('📞 Call rejected');
            this.currentSession = null;
        });

        session.on('bye', () => {
            console.log('📞 Call ended by remote party');
            this.endCall();
        });

        session.on('failed', (error) => {
            console.error('📞 Call failed:', error);
            this.updateConnectionStatus(`Call failed: ${error.message}`);
            this.currentSession = null;
        });
    }

    handleIncomingCall(session) {
        console.log('📞 Incoming call from:', session.remoteIdentity.uri);
        
        // Show incoming call UI
        this.showIncomingCallUI(session);
        
        // Auto-answer for restaurant AI (configurable)
        if (this.config.autoAnswer) {
            setTimeout(() => {
                this.answerCall(session);
            }, 2000);
        }
    }

    showIncomingCallUI(session) {
        const callerNumber = this.extractPhoneNumber(session.remoteIdentity.uri);
        
        // Create incoming call notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-white rounded-xl shadow-2xl p-6 z-50 border-l-4 border-green-500';
        notification.innerHTML = `
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center space-x-3">
                    <div class="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                    <span class="font-semibold">Incoming Call</span>
                </div>
            </div>
            
            <div class="mb-4">
                <div class="text-lg font-bold">${callerNumber}</div>
                <div class="text-sm text-gray-600">Restaurant Line</div>
            </div>
            
            <div class="flex space-x-3">
                <button 
                    id="answer-call-${session.id}" 
                    class="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium"
                >
                    Answer
                </button>
                <button 
                    id="decline-call-${session.id}" 
                    class="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-medium"
                >
                    Decline
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        // Add event listeners
        document.getElementById(`answer-call-${session.id}`).addEventListener('click', () => {
            this.answerCall(session);
            notification.remove();
        });

        document.getElementById(`decline-call-${session.id}`).addEventListener('click', () => {
            this.declineCall(session);
            notification.remove();
        });

        // Auto-remove after 30 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
                this.declineCall(session);
            }
        }, 30000);
    }

    async answerCall(session) {
        try {
            await session.accept();
            this.currentSession = session;
            this.isCallActive = true;
            
            console.log('📞 Call answered');
            this.updateConnectionStatus('Call in progress');
            
            // Connect to restaurant AI
            this.connectCallToAI(session);
            
        } catch (error) {
            console.error('Failed to answer call:', error);
        }
    }

    declineCall(session) {
        session.reject();
        console.log('📞 Call declined');
    }

    endCall() {
        if (this.currentSession) {
            if (this.currentSession.state !== 'terminated') {
                this.currentSession.bye();
            }
            this.currentSession = null;
        }
        
        this.isCallActive = false;
        this.updateConnectionStatus('Call ended');
        
        if (this.callTimer) {
            clearInterval(this.callTimer);
        }
        
        console.log('📞 Call ended');
    }

    connectCallToAI(session) {
        // Integrate the call with the restaurant's AI conversation engine
        if (window.LocalConversationEngine) {
            console.log('🤖 Connecting call to restaurant AI...');
            
            // Set up audio pipeline
            this.setupAudioPipeline(session);
            
            // Start AI conversation
            this.startAIConversation(session);
        }
    }

    setupAudioPipeline(session) {
        // This would set up the audio processing pipeline
        // Input: Caller's voice → Speech Recognition → AI Processing
        // Output: AI Response → Text-to-Speech → Caller
        
        console.log('🎤 Setting up audio pipeline for AI processing');
        
        // In a real implementation, you would:
        // 1. Get audio stream from the SIP session
        // 2. Process it through speech recognition
        // 3. Send text to conversation engine
        // 4. Convert AI response to speech
        // 5. Send audio back through SIP session
    }

    startAIConversation(session) {
        const callerNumber = this.extractPhoneNumber(session.remoteIdentity.uri);
        
        // Start conversation with greeting
        const greeting = window.LocalConversationEngine?.processInput('phone_greeting', {
            channel: 'phone',
            callerNumber: callerNumber,
            timestamp: new Date().toISOString()
        });

        if (greeting) {
            console.log('🤖 AI Greeting:', greeting.response);
            
            // Convert to speech and play (would use text-to-speech)
            this.speakResponse(greeting.response);
        }
    }

    speakResponse(text) {
        // Use browser's speech synthesis for AI responses
        if (window.speechSynthesis) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 1;
            utterance.volume = 0.8;
            
            // Try to use a natural-sounding voice
            const voices = speechSynthesis.getVoices();
            const preferredVoice = voices.find(voice => 
                voice.name.includes('Google') || 
                voice.name.includes('Microsoft') ||
                voice.lang.includes('en-US')
            );
            
            if (preferredVoice) {
                utterance.voice = preferredVoice;
            }
            
            speechSynthesis.speak(utterance);
            console.log('🔊 AI speaking:', text);
        }
    }

    startCallTimer() {
        this.callStartTime = Date.now();
        
        this.callTimer = setInterval(() => {
            if (!this.isCallActive) {
                clearInterval(this.callTimer);
                return;
            }
            
            const duration = Date.now() - this.callStartTime;
            const minutes = Math.floor(duration / 60000);
            const seconds = Math.floor((duration % 60000) / 1000);
            
            this.updateConnectionStatus(`Call: ${minutes}:${seconds.toString().padStart(2, '0')}`);
        }, 1000);
    }

    updateConnectionStatus(message) {
        // Update UI status
        const statusElements = document.querySelectorAll('.sip-status');
        statusElements.forEach(el => {
            el.textContent = message;
        });
        
        console.log('📞 SIP Status:', message);
    }

    extractPhoneNumber(sipUri) {
        // Extract phone number from SIP URI (sip:+1234567890@domain.com)
        const match = sipUri.match(/sip:(\+?\d+)@/);
        return match ? match[1] : 'Unknown';
    }

    loadConfiguration() {
        // Load SIP configuration from local storage or config file
        const savedConfig = window.BrowserCompatibility?.safeStorage.get('sip-config');
        if (savedConfig) {
            this.config = { ...this.config, ...savedConfig };
        }
    }

    saveConfiguration(config) {
        this.config = { ...this.config, ...config };
        window.BrowserCompatibility?.safeStorage.set('sip-config', this.config);
    }

    // Configuration UI
    showConfigurationUI() {
        const configModal = document.createElement('div');
        configModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        configModal.innerHTML = `
            <div class="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                <h2 class="text-xl font-bold mb-4">SIP Server Configuration</h2>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-1">Server URL</label>
                        <input 
                            type="text" 
                            id="sip-server" 
                            value="${this.config.server}" 
                            placeholder="wss://your-asterisk-server.com:8089/ws"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-1">Username</label>
                        <input 
                            type="text" 
                            id="sip-username" 
                            value="${this.config.username}" 
                            placeholder="restaurant-ai"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-1">Password</label>
                        <input 
                            type="password" 
                            id="sip-password" 
                            value="${this.config.password}" 
                            placeholder="••••••••"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-1">Domain</label>
                        <input 
                            type="text" 
                            id="sip-domain" 
                            value="${this.config.domain}" 
                            placeholder="your-asterisk-server.com"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                    </div>
                    
                    <div>
                        <label class="flex items-center space-x-2">
                            <input 
                                type="checkbox" 
                                id="sip-auto-answer" 
                                ${this.config.autoAnswer ? 'checked' : ''}
                            />
                            <span class="text-sm">Auto-answer incoming calls</span>
                        </label>
                    </div>
                </div>
                
                <div class="flex space-x-3 mt-6">
                    <button 
                        id="save-sip-config" 
                        class="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium"
                    >
                        Save & Connect
                    </button>
                    <button 
                        id="cancel-sip-config" 
                        class="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(configModal);

        // Event handlers
        document.getElementById('save-sip-config').addEventListener('click', () => {
            const newConfig = {
                server: document.getElementById('sip-server').value,
                username: document.getElementById('sip-username').value,
                password: document.getElementById('sip-password').value,
                domain: document.getElementById('sip-domain').value,
                autoAnswer: document.getElementById('sip-auto-answer').checked
            };
            
            this.saveConfiguration(newConfig);
            configModal.remove();
            
            // Reconnect with new configuration
            this.register();
        });

        document.getElementById('cancel-sip-config').addEventListener('click', () => {
            configModal.remove();
        });
    }

    // Call analytics
    trackCall(phoneNumber, duration, type) {
        if (window.AnalyticsManager) {
            window.AnalyticsManager.trackEvent('sip_call', {
                category: 'SIP Phone',
                type: type,
                duration: duration,
                server: this.config.domain
            });
        }
    }

    // Status methods
    getStatus() {
        return {
            registered: this.isRegistered,
            callActive: this.isCallActive,
            server: this.config.server,
            username: this.config.username
        };
    }
}

// Create global SIP client instance
window.InHouseSIPClient = new InHouseSIPClient();

// Auto-register if configuration exists
document.addEventListener('DOMContentLoaded', () => {
    const savedConfig = window.BrowserCompatibility?.safeStorage.get('sip-config');
    if (savedConfig && savedConfig.server && savedConfig.username) {
        window.InHouseSIPClient.register();
    }
});

// Expose for debugging
if (window.ProductionErrorHandler && window.ProductionErrorHandler.isDevelopment()) {
    window.debugSIP = {
        client: window.InHouseSIPClient,
        register: () => window.InHouseSIPClient.register(),
        call: (number) => window.InHouseSIPClient.makeCall(number),
        config: () => window.InHouseSIPClient.showConfigurationUI(),
        status: () => window.InHouseSIPClient.getStatus()
    };
}