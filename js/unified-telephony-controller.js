/**
 * Unified Telephony Controller
 * Integrates all telephony systems (in-house and optional Twilio)
 * Provides unified interface for the restaurant AI system
 */

class UnifiedTelephonyController {
    constructor() {
        this.providers = new Map();
        this.activeProvider = 'in-house';
        this.callHandlers = new Map();
        this.transcriptionEnabled = true;
        this.recordingEnabled = true;
        
        this.initializeProviders();
        this.setupEventListeners();
        this.createControlPanel();
    }

    async initializeProviders() {
        // Wait for all systems to be available
        await this.waitForSystems();
        
        // Register in-house systems
        this.registerProvider('in-house-webrtc', {
            name: 'WebRTC Phone System',
            type: 'webrtc',
            client: window.inHousePhone,
            capabilities: ['outbound', 'recording', 'ai-integration'],
            cost: 0,
            enabled: true
        });
        
        this.registerProvider('in-house-sip', {
            name: 'In-House SIP',
            type: 'sip',
            client: window.sipClient,
            capabilities: ['inbound', 'outbound', 'recording', 'ai-integration', 'auto-answer'],
            cost: 0.01,
            enabled: true
        });
        
        // Register optional Twilio (disabled by default)
        if (window.twilioIntegration) {
            this.registerProvider('twilio', {
                name: 'Twilio',
                type: 'api',
                client: window.twilioIntegration,
                capabilities: ['inbound', 'outbound', 'sms', 'recording', 'global'],
                cost: 0.0225,
                enabled: false // Disabled by default
            });
        }
        
        console.log('Unified Telephony Controller initialized with providers:', Array.from(this.providers.keys()));
    }

    waitForSystems() {
        return new Promise((resolve) => {
            const checkSystems = () => {
                const required = ['voipManager', 'transcriptionEngine'];
                const optional = ['twilioIntegration'];
                
                const allRequired = required.every(system => window[system]);
                
                if (allRequired) {
                    resolve();
                } else {
                    setTimeout(checkSystems, 100);
                }
            };
            checkSystems();
        });
    }

    registerProvider(id, config) {
        this.providers.set(id, {
            id,
            ...config,
            status: 'inactive',
            callCount: 0,
            totalMinutes: 0
        });
    }

    async makeCall(phoneNumber, options = {}) {
        const {
            provider = this.getOptimalProvider('outbound'),
            recordCall = this.recordingEnabled,
            transcribeCall = this.transcriptionEnabled,
            aiIntegration = true,
            ...providerOptions
        } = options;

        console.log(`Making call to ${phoneNumber} via ${provider}`);

        try {
            const providerConfig = this.providers.get(provider);
            if (!providerConfig || !providerConfig.enabled) {
                throw new Error(`Provider ${provider} not available`);
            }

            // Start recording if enabled
            let recordingId = null;
            if (recordCall && this.transcriptionEnabled) {
                recordingId = `${provider}-${Date.now()}`;
                await transcriptionEngine.startRecording(recordingId, {
                    realTimeTranscription: transcribeCall,
                    sentimentAnalysis: aiIntegration,
                    keywordExtraction: true
                });
            }

            // Make the call using the appropriate provider
            let callResult;
            switch (providerConfig.type) {
                case 'webrtc':
                    callResult = await this.makeWebRTCCall(phoneNumber, providerOptions);
                    break;
                case 'sip':
                    callResult = await this.makeSIPCall(phoneNumber, providerOptions);
                    break;
                case 'api':
                    if (provider === 'twilio') {
                        callResult = await providerConfig.client.makeCall(phoneNumber, providerOptions);
                    }
                    break;
                default:
                    throw new Error(`Unsupported provider type: ${providerConfig.type}`);
            }

            // Register call handler
            const callHandler = {
                callId: callResult.callId,
                provider,
                phoneNumber,
                recordingId,
                startTime: new Date(),
                status: 'connecting'
            };

            this.callHandlers.set(callResult.callId, callHandler);
            
            // Update provider stats
            providerConfig.callCount++;
            
            // Update VoIP manager if it's tracking this number
            if (window.voipManager) {
                await voipManager.routeCall({
                    number: phoneNumber,
                    callerNumber: 'outbound',
                    timestamp: new Date(),
                    provider,
                    callId: callResult.callId
                });
            }

            return callResult;

        } catch (error) {
            console.error('Call failed:', error);
            throw error;
        }
    }

    async makeWebRTCCall(phoneNumber, options) {
        // Use the WebRTC phone system
        if (window.inHousePhone) {
            return await inHousePhone.makeCall(phoneNumber, options);
        }
        throw new Error('WebRTC system not available');
    }

    async makeSIPCall(phoneNumber, options) {
        // Use the SIP client
        if (window.sipClient) {
            return await sipClient.makeCall(phoneNumber, options);
        }
        throw new Error('SIP system not available');
    }

    async handleIncomingCall(callData) {
        const { phoneNumber, provider, callId } = callData;
        
        console.log(`Incoming call from ${phoneNumber} via ${provider}`);
        
        try {
            // Route the call through VoIP manager
            let routingDecision = { action: 'answer', handler: 'ai-agent' };
            
            if (window.voipManager) {
                routingDecision = await voipManager.routeCall({
                    number: callData.to || callData.number,
                    callerNumber: phoneNumber,
                    timestamp: new Date(),
                    provider,
                    callId
                });
            }

            // Start recording immediately for incoming calls
            if (this.recordingEnabled) {
                const recordingId = `${provider}-${callId}`;
                await transcriptionEngine.startRecording(recordingId, {
                    realTimeTranscription: this.transcriptionEnabled,
                    sentimentAnalysis: true,
                    keywordExtraction: true
                });
                
                // Register call handler
                this.callHandlers.set(callId, {
                    callId,
                    provider,
                    phoneNumber,
                    recordingId,
                    startTime: new Date(),
                    status: 'incoming',
                    routing: routingDecision
                });
            }

            // Execute routing decision
            switch (routingDecision.action) {
                case 'answer':
                    await this.answerCall(callId, routingDecision);
                    break;
                case 'transfer':
                    await this.transferCall(callId, routingDecision);
                    break;
                case 'voicemail':
                    await this.sendToVoicemail(callId, routingDecision);
                    break;
                case 'reject':
                    await this.rejectCall(callId, routingDecision);
                    break;
                default:
                    // Default to AI agent
                    await this.answerCall(callId, { handler: 'ai-agent' });
            }

            return routingDecision;

        } catch (error) {
            console.error('Failed to handle incoming call:', error);
            // Fallback to rejecting the call
            await this.rejectCall(callId, { reason: 'system_error' });
        }
    }

    async answerCall(callId, routing) {
        const callHandler = this.callHandlers.get(callId);
        if (!callHandler) return;

        console.log(`Answering call ${callId} with ${routing.handler}`);
        
        // Answer via appropriate provider
        const provider = this.providers.get(callHandler.provider);
        
        if (provider.type === 'sip' && window.sipClient) {
            await sipClient.answerCall(callId);
        } else if (provider.type === 'api' && provider.id === 'twilio') {
            // Twilio calls are auto-answered through webhook
            console.log('Twilio call auto-answered');
        }

        // Connect to AI system if specified
        if (routing.handler === 'ai-agent' && window.localConversationEngine) {
            await this.connectToAI(callId);
        }

        callHandler.status = 'connected';
        callHandler.answeredAt = new Date();
    }

    async connectToAI(callId) {
        console.log(`Connecting call ${callId} to AI conversation engine`);
        
        // This would integrate with your existing AI conversation system
        if (window.localConversationEngine) {
            const conversationConfig = {
                callId,
                mode: 'phone',
                autoTranscription: this.transcriptionEnabled,
                realTimeResponse: true,
                context: 'restaurant_phone_system'
            };
            
            await localConversationEngine.startConversation(conversationConfig);
        }
    }

    async hangupCall(callId) {
        const callHandler = this.callHandlers.get(callId);
        if (!callHandler) return;

        console.log(`Hanging up call ${callId}`);
        
        try {
            // Hangup via appropriate provider
            const provider = this.providers.get(callHandler.provider);
            
            if (provider.client && provider.client.hangup) {
                await provider.client.hangup(callId);
            }

            // Stop recording
            if (callHandler.recordingId && window.transcriptionEngine) {
                await transcriptionEngine.stopRecording(callHandler.recordingId);
            }

            // Calculate call duration and cost
            const endTime = new Date();
            const duration = endTime - callHandler.startTime;
            const minutes = Math.ceil(duration / (1000 * 60));
            
            callHandler.endTime = endTime;
            callHandler.duration = duration;
            callHandler.status = 'ended';
            
            // Update provider stats
            provider.totalMinutes += minutes;

            // Update VoIP manager if applicable
            if (window.voipManager) {
                await voipManager.updateCallCost(callId, duration);
            }

            console.log(`Call ${callId} ended. Duration: ${minutes} minutes`);

        } catch (error) {
            console.error('Failed to hangup call:', error);
        } finally {
            this.callHandlers.delete(callId);
        }
    }

    getOptimalProvider(type = 'outbound') {
        // Choose the best provider based on capabilities and cost
        let bestProvider = 'in-house-sip';
        let lowestCost = Infinity;

        for (const [id, provider] of this.providers) {
            if (!provider.enabled || !provider.capabilities.includes(type)) {
                continue;
            }

            if (provider.cost < lowestCost) {
                lowestCost = provider.cost;
                bestProvider = id;
            }
        }

        return bestProvider;
    }

    enableProvider(providerId, enable = true) {
        const provider = this.providers.get(providerId);
        if (provider) {
            provider.enabled = enable;
            console.log(`Provider ${providerId} ${enable ? 'enabled' : 'disabled'}`);
            
            // Special handling for Twilio
            if (providerId === 'twilio' && provider.client) {
                if (enable) {
                    provider.client.enable();
                } else {
                    provider.client.disable();
                }
            }
            
            this.updateControlPanel();
        }
    }

    getProviderStats() {
        const stats = {};
        for (const [id, provider] of this.providers) {
            stats[id] = {
                name: provider.name,
                enabled: provider.enabled,
                callCount: provider.callCount,
                totalMinutes: provider.totalMinutes,
                totalCost: provider.totalMinutes * provider.cost,
                capabilities: provider.capabilities
            };
        }
        return stats;
    }

    createControlPanel() {
        const container = document.createElement('div');
        container.id = 'telephony-control-panel';
        container.className = 'telephony-control-container';
        container.innerHTML = `
            <div class="telephony-control-header">
                <h3>📞 Telephony Control Center</h3>
                <button class="control-minimize-btn" onclick="this.closest('.telephony-control-container').classList.toggle('minimized')">−</button>
            </div>
            <div class="telephony-control-body">
                <div class="provider-status" id="provider-status">
                    <!-- Provider status will be populated here -->
                </div>
                
                <div class="active-calls" id="active-calls">
                    <h4>Active Calls</h4>
                    <div class="calls-list" id="calls-list">
                        <!-- Active calls will be shown here -->
                    </div>
                </div>
                
                <div class="system-controls">
                    <label>
                        <input type="checkbox" id="recording-toggle" ${this.recordingEnabled ? 'checked' : ''}>
                        Call Recording
                    </label>
                    <label>
                        <input type="checkbox" id="transcription-toggle" ${this.transcriptionEnabled ? 'checked' : ''}>
                        Real-time Transcription
                    </label>
                </div>
                
                <div class="twilio-controls" id="twilio-controls">
                    <!-- Twilio controls will be populated here -->
                </div>
            </div>
        `;

        document.body.appendChild(container);
        this.controlPanel = container;
        this.updateControlPanel();
        this.setupControlPanelEvents();
    }

    updateControlPanel() {
        if (!this.controlPanel) return;

        // Update provider status
        const providerStatus = this.controlPanel.querySelector('#provider-status');
        const stats = this.getProviderStats();
        
        providerStatus.innerHTML = Object.entries(stats).map(([id, stat]) => `
            <div class="provider-item">
                <div class="provider-info">
                    <span class="provider-name">${stat.name}</span>
                    <span class="provider-status ${stat.enabled ? 'enabled' : 'disabled'}">
                        ${stat.enabled ? '✅' : '❌'}
                    </span>
                </div>
                <div class="provider-stats">
                    ${stat.callCount} calls, ${stat.totalMinutes} min, $${stat.totalCost.toFixed(2)}
                </div>
                <div class="provider-actions">
                    <button onclick="telephonyController.enableProvider('${id}', ${!stat.enabled})" class="btn btn-sm">
                        ${stat.enabled ? 'Disable' : 'Enable'}
                    </button>
                </div>
            </div>
        `).join('');

        // Update active calls
        this.updateActiveCallsList();
        
        // Update Twilio controls if available
        if (window.twilioIntegration) {
            const twilioControls = this.controlPanel.querySelector('#twilio-controls');
            twilioControls.appendChild(twilioIntegration.createConfigurationInterface());
        }
    }

    updateActiveCallsList() {
        const callsList = this.controlPanel.querySelector('#calls-list');
        
        if (this.callHandlers.size === 0) {
            callsList.innerHTML = '<p class="no-calls">No active calls</p>';
            return;
        }

        callsList.innerHTML = Array.from(this.callHandlers.values()).map(call => `
            <div class="active-call-item">
                <div class="call-info">
                    <span class="call-number">${call.phoneNumber}</span>
                    <span class="call-status ${call.status}">${call.status}</span>
                    <span class="call-duration">${this.formatCallDuration(call)}</span>
                </div>
                <div class="call-actions">
                    <button onclick="telephonyController.hangupCall('${call.callId}')" class="btn btn-sm btn-danger">
                        Hangup
                    </button>
                </div>
            </div>
        `).join('');
    }

    formatCallDuration(call) {
        if (call.status === 'connecting') return 'Connecting...';
        
        const startTime = call.answeredAt || call.startTime;
        const duration = Date.now() - startTime.getTime();
        const seconds = Math.floor(duration / 1000);
        const minutes = Math.floor(seconds / 60);
        
        return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
    }

    setupControlPanelEvents() {
        // Recording toggle
        const recordingToggle = this.controlPanel.querySelector('#recording-toggle');
        recordingToggle.addEventListener('change', (e) => {
            this.recordingEnabled = e.target.checked;
        });

        // Transcription toggle
        const transcriptionToggle = this.controlPanel.querySelector('#transcription-toggle');
        transcriptionToggle.addEventListener('change', (e) => {
            this.transcriptionEnabled = e.target.checked;
        });
    }

    setupEventListeners() {
        // Listen for incoming calls from various providers
        document.addEventListener('twilioIncomingCall', (e) => {
            this.handleIncomingCall({
                callId: e.detail.callId,
                phoneNumber: e.detail.from,
                provider: 'twilio',
                to: e.detail.to
            });
        });

        // Listen for SIP incoming calls
        document.addEventListener('sipIncomingCall', (e) => {
            this.handleIncomingCall({
                callId: e.detail.callId,
                phoneNumber: e.detail.from,
                provider: 'in-house-sip',
                to: e.detail.to
            });
        });

        // Update active calls display periodically
        setInterval(() => {
            if (this.callHandlers.size > 0) {
                this.updateActiveCallsList();
            }
        }, 1000);
    }
}

// Initialize unified controller
let telephonyController;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        telephonyController = new UnifiedTelephonyController();
    });
} else {
    telephonyController = new UnifiedTelephonyController();
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UnifiedTelephonyController;
}