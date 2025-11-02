// Converted from twilio-integration.js — inlined TypeScript implementation
// @ts-nocheck

class TwilioIntegration {
	enabled: boolean;
	accountSid: string | null;
	authToken: string | null;
	apiKey: string | null;
	apiSecret: string | null;
	twilioClient: any;
	device: any;
	connection: any;
	freeTierLimits: any;
	usage: any;

	constructor(options: any = {}) {
		this.enabled = options.enabled || false;
		this.accountSid = options.accountSid || null;
		this.authToken = options.authToken || null;
		this.apiKey = options.apiKey || null;
		this.apiSecret = options.apiSecret || null;
		this.twilioClient = null; this.device = null; this.connection = null;
		this.freeTierLimits = { trialCredit: 15.50, verifiedNumbers: 1, smsPerDay: 200, callsPerDay: 100, numberCost: 1.15, callCost: 0.0225, smsCost: 0.0075 };
		this.usage = { callsToday: 0, smsToday: 0, totalSpent: 0, lastReset: new Date().toDateString() };
		this.loadConfiguration();
		if (this.enabled && this.isConfigured()) this.initializeTwilio();
	}

	isConfigured() { return !!(this.accountSid && this.authToken); }

	async initializeTwilio() {
		try { await this.loadTwilioSDK(); if ((window as any).Twilio && (window as any).Twilio.Device) await this.initializeTwilioDevice(); console.log('Twilio integration initialized successfully'); this.updateStatus('connected'); } catch (error) { console.error('Failed to initialize Twilio:', error); this.updateStatus('error', (error as any).message); }
	}

	async loadTwilioSDK() {
		return new Promise<void>((resolve, reject) => {
			if ((window as any).Twilio) { resolve(); return; }
			const script = document.createElement('script'); script.src = 'https://sdk.twilio.com/js/client/releases/1.13.0/twilio.min.js'; script.onload = () => resolve(); script.onerror = () => reject(new Error('Failed to load Twilio SDK')); document.head.appendChild(script);
		});
	}

	async initializeTwilioDevice() {
		try {
			const token = await this.getCapabilityToken(); this.device = new (window as any).Twilio.Device(); this.device.on('ready', () => this.updateDeviceStatus('ready')); this.device.on('error', (e: any) => this.updateDeviceStatus('error', e.message)); this.device.on('connect', (conn: any) => { this.connection = conn; this.handleCallConnect(conn); }); this.device.on('disconnect', (conn: any) => this.handleCallDisconnect(conn)); this.device.on('incoming', (conn: any) => this.handleIncomingCall(conn)); this.device.setup(token);
		} catch (e) { console.error('Failed to initialize Twilio Device:', e); throw e; }
	}

	async getCapabilityToken() {
		if (!this.accountSid || !this.authToken) throw new Error('Twilio credentials not configured');
		try {
			const response = await fetch('/api/twilio/token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identity: 'restaurant-phone-system', accountSid: this.accountSid }) });
			if (!response.ok) throw new Error('Failed to get capability token');
			const data = await response.json(); return data.token;
		} catch (error) { this.showTokenSetupInstructions(); throw new Error('Backend token endpoint not configured. See setup instructions.'); }
	}

	showTokenSetupInstructions() { const instructions = `To use Twilio integration, set up a backend endpoint at /api/twilio/token`; console.log('Twilio Backend Setup Instructions:', instructions); this.showSetupModal(instructions); }

	async makeCall(phoneNumber: string, options: any = {}) {
		if (!this.enabled) throw new Error('Twilio integration is disabled'); if (!this.device) throw new Error('Twilio device not ready'); if (!this.checkUsageLimits('call')) throw new Error('Daily call limit reached for Twilio free tier'); try { const params = { To: phoneNumber, From: options.fromNumber || this.getDefaultFromNumber(), ...options.twilioParams }; this.connection = this.device.connect(params); this.incrementUsage('call'); return { provider: 'twilio', callId: this.connection.parameters?.CallSid || `tw-${Date.now()}`, status: 'connecting' }; } catch (error) { console.error('Twilio call failed:', error); throw error; }
	}

	async sendSMS(to: string, message: string, options: any = {}) {
		if (!this.enabled) throw new Error('Twilio integration is disabled'); if (!this.checkUsageLimits('sms')) throw new Error('Daily SMS limit reached for Twilio free tier'); try { const response = await fetch('/api/twilio/sms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to, body: message, from: options.fromNumber || this.getDefaultFromNumber() }) }); if (!response.ok) throw new Error('Failed to send SMS'); this.incrementUsage('sms'); const result = await response.json(); return { provider: 'twilio', messageId: result.sid, status: 'sent' }; } catch (error) { console.error('Twilio SMS failed:', error); throw error; }
	}

	checkUsageLimits(type: string) { const today = new Date().toDateString(); if (this.usage.lastReset !== today) { this.usage.callsToday = 0; this.usage.smsToday = 0; this.usage.lastReset = today; this.saveConfiguration(); } switch (type) { case 'call': return this.usage.callsToday < this.freeTierLimits.callsPerDay; case 'sms': return this.usage.smsToday < this.freeTierLimits.smsPerDay; default: return false; } }

	incrementUsage(type: string) { switch (type) { case 'call': this.usage.callsToday++; this.usage.totalSpent += this.freeTierLimits.callCost; break; case 'sms': this.usage.smsToday++; this.usage.totalSpent += this.freeTierLimits.smsCost; break; } this.saveConfiguration(); this.updateUsageDisplay(); }

	getDefaultFromNumber() { return (this as any).verifiedNumbers?.[0] || '+15551234567'; }

	handleCallConnect(connection: any) { document.dispatchEvent(new CustomEvent('twilioCallConnected', { detail: { callId: connection.parameters.CallSid, direction: connection.direction, from: connection.parameters.From, to: connection.parameters.To } })); if ((window as any).transcriptionEngine) (window as any).transcriptionEngine.startRecording?.(`twilio-${connection.parameters.CallSid}`, { provider: 'twilio', realTimeTranscription: true }); }

	handleCallDisconnect(connection: any) { document.dispatchEvent(new CustomEvent('twilioCallDisconnected', { detail: { callId: connection.parameters.CallSid, duration: connection.duration() } })); if ((window as any).transcriptionEngine) (window as any).transcriptionEngine.stopRecording?.(`twilio-${connection.parameters.CallSid}`); const durationMinutes = Math.ceil(connection.duration() / 60); this.usage.totalSpent += durationMinutes * this.freeTierLimits.callCost; this.saveConfiguration(); }

	handleIncomingCall(connection: any) { document.dispatchEvent(new CustomEvent('twilioIncomingCall', { detail: { callId: connection.parameters.CallSid, from: connection.parameters.From, to: connection.parameters.To, accept: () => connection.accept(), reject: () => connection.reject() } })); }

	hangup() { if (this.connection) this.connection.disconnect(); }
	mute() { if (this.connection) this.connection.mute(true); }
	unmute() { if (this.connection) this.connection.mute(false); }

	getUsageStats() { return { enabled: this.enabled, dailyLimits: this.freeTierLimits, usage: this.usage, remainingCalls: this.freeTierLimits.callsPerDay - this.usage.callsToday, remainingSMS: this.freeTierLimits.smsPerDay - this.usage.smsToday, estimatedMonthlyCost: this.calculateMonthlyCost() }; }

	calculateMonthlyCost() { const avgCallsPerDay = this.usage.callsToday || 5; const avgSMSPerDay = this.usage.smsToday || 2; const avgCallDuration = 3; const monthlyCalls = avgCallsPerDay * 30; const monthlySMS = avgSMSPerDay * 30; return { calls: monthlyCalls * avgCallDuration * this.freeTierLimits.callCost, sms: monthlySMS * this.freeTierLimits.smsCost, number: this.freeTierLimits.numberCost, total: function() { return this.calls + this.sms + this.number; } }; }

	createConfigurationInterface() { const container = document.createElement('div'); container.id = 'twilio-config'; container.className = 'twilio-config-container'; container.innerHTML = `<div class="twilio-config-header"><h4>📞 Twilio Integration</h4><label class="toggle-switch"><input type="checkbox" id="twilio-enabled" ${this.enabled ? 'checked' : ''}><span class="toggle-slider"></span></label></div><div class="twilio-config-body ${!this.enabled ? 'disabled' : ''}">...</div>`; return container; }

	async testConnection() { try { if (!this.isConfigured()) throw new Error('Please enter Account SID and Auth Token'); await this.initializeTwilio(); alert('Twilio connection test successful!'); } catch (error: any) { alert(`Connection test failed: ${error.message}`); } }

	enable() { this.enabled = true; if (this.isConfigured()) this.initializeTwilio(); this.saveConfiguration(); this.updateInterface(); }
	disable() { this.enabled = false; if (this.device) { this.device.destroy?.(); this.device = null; } this.saveConfiguration(); this.updateInterface(); }

	saveConfiguration() { const config = { enabled: this.enabled, accountSid: this.accountSid, authToken: this.authToken, usage: this.usage }; localStorage.setItem('twilio-config', JSON.stringify(config)); }
	loadConfiguration() { const saved = localStorage.getItem('twilio-config'); if (saved) { try { const config = JSON.parse(saved); this.enabled = config.enabled || false; this.accountSid = config.accountSid; this.authToken = config.authToken; this.usage = { ...this.usage, ...config.usage }; } catch (e) { console.warn('Failed to load Twilio configuration:', e); } } }

	updateStatus(status: string, message = '') { (this as any).status = status; (this as any).statusMessage = message; this.updateInterface(); }
	updateDeviceStatus(status: string, message = '') { (this as any).deviceStatus = status; (this as any).deviceStatusMessage = message; this.updateInterface(); }
	updateInterface() { const statusElement = document.getElementById('twilio-status'); if (statusElement) statusElement.innerHTML = this.getStatusDisplay(); const bodyElement = document.querySelector('.twilio-config-body'); if (bodyElement) bodyElement.classList.toggle('disabled', !this.enabled); }
	updateUsageDisplay() { this.updateInterface(); }
	showSetupModal(instructions: string) { const modal = document.createElement('div'); modal.className = 'twilio-setup-modal'; modal.innerHTML = `<div class="modal-backdrop" onclick="this.parentElement.remove()"></div><div class="modal-content"><h3>Twilio Backend Setup Required</h3><pre><code>${instructions}</code></pre><button onclick="this.closest('.twilio-setup-modal').remove()" class="btn btn-primary">Close</button></div>`; document.body.appendChild(modal); }

}

let twilioIntegration: any;
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { twilioIntegration = new TwilioIntegration({ enabled: false }); }); else twilioIntegration = new TwilioIntegration({ enabled: false });
(window as any).twilioIntegration = twilioIntegration;

export {};

