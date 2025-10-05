/**
 * Modular Twilio Integration
 * Optional integration that can be enabled for Twilio's free tier and scaled later
 * Designed to work alongside existing in-house telephony system
 */

class TwilioIntegration {
    constructor(options = {}) {
        this.enabled = options.enabled || false;
        this.accountSid = options.accountSid || null;
        this.authToken = options.authToken || null;
        this.apiKey = options.apiKey || null;
        this.apiSecret = options.apiSecret || null;
        
        this.twilioClient = null;
        this.device = null;
        this.connection = null;
        
        this.freeTierLimits = {
            trialCredit: 15.50, // USD
            verifiedNumbers: 1,
            smsPerDay: 200,
            callsPerDay: 100,
            numberCost: 1.15, // per month
            callCost: 0.0225, // per minute
            smsCost: 0.0075 // per message
        };
        
        this.usage = {
            callsToday: 0,
            smsToday: 0,
            totalSpent: 0,
            lastReset: new Date().toDateString()
        };
        
        this.loadConfiguration();
        if (this.enabled && this.isConfigured()) {
            this.initializeTwilio();
        }
    }

    isConfigured() {
        return this.accountSid && this.authToken;
    }

    async initializeTwilio() {
        try {
            // Load Twilio SDK dynamically (only when needed)
            await this.loadTwilioSDK();
            
            // Initialize Twilio client for Voice
            if (window.Twilio && window.Twilio.Device) {
                await this.initializeTwilioDevice();
            }
            
            console.log('Twilio integration initialized successfully');
            this.updateStatus('connected');
            
        } catch (error) {
            console.error('Failed to initialize Twilio:', error);
            this.updateStatus('error', error.message);
        }
    }

    async loadTwilioSDK() {
        return new Promise((resolve, reject) => {
            if (window.Twilio) {
                resolve();
                return;
            }

            // Load Twilio Voice SDK
            const script = document.createElement('script');
            script.src = 'https://sdk.twilio.com/js/client/releases/1.13.0/twilio.min.js';
            script.onload = () => {
                console.log('Twilio SDK loaded');
                resolve();
            };
            script.onerror = () => {
                reject(new Error('Failed to load Twilio SDK'));
            };
            document.head.appendChild(script);
        });
    }

    async initializeTwilioDevice() {
        try {
            // Get capability token from your backend
            const token = await this.getCapabilityToken();
            
            this.device = new Twilio.Device();
            
            // Set up event handlers
            this.device.on('ready', () => {
                console.log('Twilio Device ready');
                this.updateDeviceStatus('ready');
            });
            
            this.device.on('error', (error) => {
                console.error('Twilio Device error:', error);
                this.updateDeviceStatus('error', error.message);
            });
            
            this.device.on('connect', (connection) => {
                console.log('Twilio call connected');
                this.connection = connection;
                this.handleCallConnect(connection);
            });
            
            this.device.on('disconnect', (connection) => {
                console.log('Twilio call disconnected');
                this.handleCallDisconnect(connection);
            });
            
            this.device.on('incoming', (connection) => {
                console.log('Incoming Twilio call');
                this.handleIncomingCall(connection);
            });
            
            // Setup device with token
            this.device.setup(token);
            
        } catch (error) {
            console.error('Failed to initialize Twilio Device:', error);
            throw error;
        }
    }

    async getCapabilityToken() {
        // In a real implementation, this would call your backend to generate a capability token
        // For now, we'll show how to structure the request
        
        if (!this.accountSid || !this.authToken) {
            throw new Error('Twilio credentials not configured');
        }

        try {
            const response = await fetch('/api/twilio/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    identity: 'restaurant-phone-system',
                    accountSid: this.accountSid
                })
            });

            if (!response.ok) {
                throw new Error('Failed to get capability token');
            }

            const data = await response.json();
            return data.token;
            
        } catch (error) {
            // Fallback: show instructions for backend setup
            this.showTokenSetupInstructions();
            throw new Error('Backend token endpoint not configured. See setup instructions.');
        }
    }

    showTokenSetupInstructions() {
        const instructions = `
To use Twilio integration, you need to set up a backend endpoint at /api/twilio/token

Backend code example (Node.js/Express):

const twilio = require('twilio');
const AccessToken = twilio.jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;

app.post('/api/twilio/token', (req, res) => {
    const accountSid = '${this.accountSid}';
    const apiKey = 'YOUR_API_KEY';
    const apiSecret = 'YOUR_API_SECRET';
    
    const voiceGrant = new VoiceGrant({
        outgoingApplicationSid: 'YOUR_TWIML_APP_SID',
        incomingAllow: true
    });
    
    const token = new AccessToken(accountSid, apiKey, apiSecret);
    token.addGrant(voiceGrant);
    token.identity = req.body.identity;
    
    res.json({ token: token.toJwt() });
});
        `;
        
        console.log('Twilio Backend Setup Instructions:', instructions);
        this.showSetupModal(instructions);
    }

    async makeCall(phoneNumber, options = {}) {
        if (!this.enabled) {
            throw new Error('Twilio integration is disabled');
        }

        if (!this.device || !this.device.status() === 'ready') {
            throw new Error('Twilio device not ready');
        }

        // Check free tier limits
        if (!this.checkUsageLimits('call')) {
            throw new Error('Daily call limit reached for Twilio free tier');
        }

        try {
            const params = {
                To: phoneNumber,
                From: options.fromNumber || this.getDefaultFromNumber(),
                ...options.twilioParams
            };

            this.connection = this.device.connect(params);
            
            // Track usage
            this.incrementUsage('call');
            
            return {
                provider: 'twilio',
                callId: this.connection.parameters.CallSid,
                status: 'connecting'
            };
            
        } catch (error) {
            console.error('Twilio call failed:', error);
            throw error;
        }
    }

    async sendSMS(to, message, options = {}) {
        if (!this.enabled) {
            throw new Error('Twilio integration is disabled');
        }

        // Check free tier limits
        if (!this.checkUsageLimits('sms')) {
            throw new Error('Daily SMS limit reached for Twilio free tier');
        }

        try {
            // This would typically be done via your backend API
            const response = await fetch('/api/twilio/sms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to,
                    body: message,
                    from: options.fromNumber || this.getDefaultFromNumber()
                })
            });

            if (!response.ok) {
                throw new Error('Failed to send SMS');
            }

            // Track usage
            this.incrementUsage('sms');
            
            const result = await response.json();
            return {
                provider: 'twilio',
                messageId: result.sid,
                status: 'sent'
            };
            
        } catch (error) {
            console.error('Twilio SMS failed:', error);
            throw error;
        }
    }

    checkUsageLimits(type) {
        // Reset daily counters if it's a new day
        const today = new Date().toDateString();
        if (this.usage.lastReset !== today) {
            this.usage.callsToday = 0;
            this.usage.smsToday = 0;
            this.usage.lastReset = today;
            this.saveConfiguration();
        }

        switch (type) {
            case 'call':
                return this.usage.callsToday < this.freeTierLimits.callsPerDay;
            case 'sms':
                return this.usage.smsToday < this.freeTierLimits.smsPerDay;
            default:
                return false;
        }
    }

    incrementUsage(type) {
        switch (type) {
            case 'call':
                this.usage.callsToday++;
                this.usage.totalSpent += this.freeTierLimits.callCost;
                break;
            case 'sms':
                this.usage.smsToday++;
                this.usage.totalSpent += this.freeTierLimits.smsCost;
                break;
        }
        this.saveConfiguration();
        this.updateUsageDisplay();
    }

    getDefaultFromNumber() {
        // Return the first verified number or purchased number
        return this.verifiedNumbers?.[0] || '+15551234567'; // Placeholder
    }

    handleCallConnect(connection) {
        const event = new CustomEvent('twilioCallConnected', {
            detail: {
                callId: connection.parameters.CallSid,
                direction: connection.direction,
                from: connection.parameters.From,
                to: connection.parameters.To
            }
        });
        document.dispatchEvent(event);

        // Integrate with existing call recording system
        if (window.transcriptionEngine) {
            transcriptionEngine.startRecording(`twilio-${connection.parameters.CallSid}`, {
                provider: 'twilio',
                realTimeTranscription: true
            });
        }
    }

    handleCallDisconnect(connection) {
        const event = new CustomEvent('twilioCallDisconnected', {
            detail: {
                callId: connection.parameters.CallSid,
                duration: connection.duration()
            }
        });
        document.dispatchEvent(event);

        // Stop recording
        if (window.transcriptionEngine) {
            transcriptionEngine.stopRecording(`twilio-${connection.parameters.CallSid}`);
        }

        // Update call duration and cost
        const durationMinutes = Math.ceil(connection.duration() / 60);
        this.usage.totalSpent += durationMinutes * this.freeTierLimits.callCost;
        this.saveConfiguration();
    }

    handleIncomingCall(connection) {
        const event = new CustomEvent('twilioIncomingCall', {
            detail: {
                callId: connection.parameters.CallSid,
                from: connection.parameters.From,
                to: connection.parameters.To,
                accept: () => connection.accept(),
                reject: () => connection.reject()
            }
        });
        document.dispatchEvent(event);
    }

    hangup() {
        if (this.connection) {
            this.connection.disconnect();
        }
    }

    mute() {
        if (this.connection) {
            this.connection.mute(true);
        }
    }

    unmute() {
        if (this.connection) {
            this.connection.mute(false);
        }
    }

    getUsageStats() {
        return {
            enabled: this.enabled,
            dailyLimits: this.freeTierLimits,
            usage: this.usage,
            remainingCalls: this.freeTierLimits.callsPerDay - this.usage.callsToday,
            remainingSMS: this.freeTierLimits.smsPerDay - this.usage.smsToday,
            estimatedMonthlyCost: this.calculateMonthlyCost()
        };
    }

    calculateMonthlyCost() {
        const avgCallsPerDay = this.usage.callsToday || 5; // Estimate
        const avgSMSPerDay = this.usage.smsToday || 2; // Estimate
        const avgCallDuration = 3; // minutes
        
        const monthlyCalls = avgCallsPerDay * 30;
        const monthlySMS = avgSMSPerDay * 30;
        
        return {
            calls: monthlyCalls * avgCallDuration * this.freeTierLimits.callCost,
            sms: monthlySMS * this.freeTierLimits.smsCost,
            number: this.freeTierLimits.numberCost,
            total: function() { return this.calls + this.sms + this.number; }
        };
    }

    createConfigurationInterface() {
        const container = document.createElement('div');
        container.id = 'twilio-config';
        container.className = 'twilio-config-container';
        container.innerHTML = `
            <div class="twilio-config-header">
                <h4>📞 Twilio Integration</h4>
                <label class="toggle-switch">
                    <input type="checkbox" id="twilio-enabled" ${this.enabled ? 'checked' : ''}>
                    <span class="toggle-slider"></span>
                </label>
            </div>
            
            <div class="twilio-config-body ${!this.enabled ? 'disabled' : ''}">
                <div class="config-section">
                    <h5>Credentials</h5>
                    <div class="form-group">
                        <input type="text" id="twilio-account-sid" placeholder="Account SID" value="${this.accountSid || ''}" class="form-control">
                        <input type="password" id="twilio-auth-token" placeholder="Auth Token" value="${this.authToken || ''}" class="form-control">
                    </div>
                </div>
                
                <div class="config-section">
                    <h5>Free Tier Usage</h5>
                    <div class="usage-stats">
                        <div class="usage-item">
                            <span>Calls Today:</span>
                            <span>${this.usage.callsToday}/${this.freeTierLimits.callsPerDay}</span>
                        </div>
                        <div class="usage-item">
                            <span>SMS Today:</span>
                            <span>${this.usage.smsToday}/${this.freeTierLimits.smsPerDay}</span>
                        </div>
                        <div class="usage-item">
                            <span>Estimated Cost:</span>
                            <span>$${this.usage.totalSpent.toFixed(2)}</span>
                        </div>
                        <div class="usage-item">
                            <span>Trial Credit:</span>
                            <span>$${(this.freeTierLimits.trialCredit - this.usage.totalSpent).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                
                <div class="config-section">
                    <h5>Integration Status</h5>
                    <div class="status-display" id="twilio-status">
                        ${this.getStatusDisplay()}
                    </div>
                </div>
                
                <div class="config-actions">
                    <button onclick="twilioIntegration.saveConfiguration()" class="btn btn-primary">Save Configuration</button>
                    <button onclick="twilioIntegration.testConnection()" class="btn btn-secondary">Test Connection</button>
                </div>
                
                <div class="config-section">
                    <h5>Setup Instructions</h5>
                    <div class="setup-instructions">
                        <ol>
                            <li>Sign up for Twilio free account at <a href="https://www.twilio.com/try-twilio" target="_blank">twilio.com</a></li>
                            <li>Get $15.50 in free credits</li>
                            <li>Find your Account SID and Auth Token in the Twilio Console</li>
                            <li>Set up backend endpoint for token generation (see documentation)</li>
                            <li>Configure phone number for incoming calls</li>
                        </ol>
                    </div>
                </div>
            </div>
        `;

        return container;
    }

    getStatusDisplay() {
        if (!this.enabled) {
            return '<span class="status-disabled">Disabled</span>';
        }
        
        if (!this.isConfigured()) {
            return '<span class="status-unconfigured">Not Configured</span>';
        }
        
        if (this.device && this.device.status() === 'ready') {
            return '<span class="status-connected">Connected</span>';
        }
        
        return '<span class="status-connecting">Connecting...</span>';
    }

    async testConnection() {
        try {
            if (!this.isConfigured()) {
                throw new Error('Please enter Account SID and Auth Token');
            }
            
            await this.initializeTwilio();
            alert('Twilio connection test successful!');
            
        } catch (error) {
            alert(`Connection test failed: ${error.message}`);
        }
    }

    enable() {
        this.enabled = true;
        if (this.isConfigured()) {
            this.initializeTwilio();
        }
        this.saveConfiguration();
        this.updateInterface();
    }

    disable() {
        this.enabled = false;
        if (this.device) {
            this.device.destroy();
            this.device = null;
        }
        this.saveConfiguration();
        this.updateInterface();
    }

    saveConfiguration() {
        const config = {
            enabled: this.enabled,
            accountSid: this.accountSid,
            authToken: this.authToken,
            usage: this.usage
        };
        localStorage.setItem('twilio-config', JSON.stringify(config));
    }

    loadConfiguration() {
        const saved = localStorage.getItem('twilio-config');
        if (saved) {
            try {
                const config = JSON.parse(saved);
                this.enabled = config.enabled || false;
                this.accountSid = config.accountSid;
                this.authToken = config.authToken;
                this.usage = { ...this.usage, ...config.usage };
            } catch (error) {
                console.warn('Failed to load Twilio configuration:', error);
            }
        }
    }

    updateStatus(status, message = '') {
        this.status = status;
        this.statusMessage = message;
        this.updateInterface();
    }

    updateDeviceStatus(status, message = '') {
        this.deviceStatus = status;
        this.deviceStatusMessage = message;
        this.updateInterface();
    }

    updateInterface() {
        const statusElement = document.getElementById('twilio-status');
        if (statusElement) {
            statusElement.innerHTML = this.getStatusDisplay();
        }

        const bodyElement = document.querySelector('.twilio-config-body');
        if (bodyElement) {
            bodyElement.classList.toggle('disabled', !this.enabled);
        }
    }

    updateUsageDisplay() {
        // Update usage stats in the interface
        this.updateInterface();
    }

    showSetupModal(instructions) {
        const modal = document.createElement('div');
        modal.className = 'twilio-setup-modal';
        modal.innerHTML = `
            <div class="modal-backdrop" onclick="this.parentElement.remove()"></div>
            <div class="modal-content">
                <h3>Twilio Backend Setup Required</h3>
                <pre><code>${instructions}</code></pre>
                <button onclick="this.closest('.twilio-setup-modal').remove()" class="btn btn-primary">Close</button>
            </div>
        `;
        document.body.appendChild(modal);
    }
}

// Initialize Twilio integration (disabled by default)
let twilioIntegration;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        twilioIntegration = new TwilioIntegration({ enabled: false });
    });
} else {
    twilioIntegration = new TwilioIntegration({ enabled: false });
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TwilioIntegration;
}