// Converted from unified-telephony-controller.js — inlined TypeScript implementation
// @ts-nocheck

class UnifiedTelephonyController {
	providers: Map<string, any>;
	activeProvider: string;
	callHandlers: Map<string, any>;
	transcriptionEnabled: boolean;
	recordingEnabled: boolean;
	controlPanel: HTMLElement | null;

	constructor() {
		this.providers = new Map();
		this.activeProvider = 'in-house';
		this.callHandlers = new Map();
		this.transcriptionEnabled = true;
		this.recordingEnabled = true;
		this.controlPanel = null;
		this.initializeProviders();
		this.setupEventListeners();
		this.createControlPanel();
	}

	async initializeProviders() {
		await this.waitForSystems();
		this.registerProvider('in-house-webrtc', { name: 'WebRTC Phone System', type: 'webrtc', client: (window as any).inHousePhone, capabilities: ['outbound','recording','ai-integration'], cost: 0, enabled: true });
		this.registerProvider('in-house-sip', { name: 'In-House SIP', type: 'sip', client: (window as any).sipClient, capabilities: ['inbound','outbound','recording','ai-integration','auto-answer'], cost: 0.01, enabled: true });
		if ((window as any).twilioIntegration) this.registerProvider('twilio', { name: 'Twilio', type: 'api', client: (window as any).twilioIntegration, capabilities: ['inbound','outbound','sms','recording','global'], cost: 0.0225, enabled: false });
		console.log('Unified Telephony Controller initialized with providers:', Array.from(this.providers.keys()));
	}

	waitForSystems() {
		return new Promise<void>((resolve) => {
			const checkSystems = () => {
				const required = ['voipManager','transcriptionEngine'];
				const allRequired = required.every((s) => !!(window as any)[s]);
				if (allRequired) resolve(); else setTimeout(checkSystems, 100);
			};
			checkSystems();
		});
	}

	registerProvider(id: string, config: any) { this.providers.set(id, { id, ...config, status: 'inactive', callCount: 0, totalMinutes: 0 }); }

	async makeCall(phoneNumber: string, options: any = {}) {
		const provider = options.provider || this.getOptimalProvider('outbound');
		console.log(`Making call to ${phoneNumber} via ${provider}`);
		const providerConfig = this.providers.get(provider);
		if (!providerConfig || !providerConfig.enabled) throw new Error(`Provider ${provider} not available`);
		// Simplified: delegate to provider client if available
		if (providerConfig.type === 'webrtc' && providerConfig.client?.makeCall) return await providerConfig.client.makeCall(phoneNumber, options);
		if (providerConfig.type === 'sip' && providerConfig.client?.makeCall) return await providerConfig.client.makeCall(phoneNumber, options);
		if (providerConfig.type === 'api' && provider === 'twilio') return await providerConfig.client.makeCall(phoneNumber, options);
		throw new Error('No call path available');
	}

	async handleIncomingCall(callData: any) {
		const { phoneNumber, provider, callId } = callData;
		console.log(`Incoming call from ${phoneNumber} via ${provider}`);
		if ((window as any).callQueueManager) {
			const queueResult = await (window as any).callQueueManager.addToQueue({ ...callData, customerData: await this.getCustomerData(phoneNumber) });
			if (!queueResult.success) return { action: 'reject', reason: queueResult.reason };
			if (queueResult.position > 0) return { action: 'queue', position: queueResult.position, estimatedWait: queueResult.estimatedWait };
		}
		let routingDecision = { action: 'answer', handler: 'ai-agent' };
		if ((window as any).voipManager) routingDecision = await (window as any).voipManager.routeCall({ number: callData.to || callData.number, callerNumber: phoneNumber, timestamp: new Date(), provider, callId });
		if (this.recordingEnabled) { const recordingId = `${provider}-${callId}`; (window as any).transcriptionEngine?.startRecording?.(recordingId, { realTimeTranscription: this.transcriptionEnabled, sentimentAnalysis: true, keywordExtraction: true }); this.callHandlers.set(callId, { callId, provider, phoneNumber, recordingId, startTime: new Date(), status: 'incoming', routing: routingDecision }); }
		switch (routingDecision.action) { case 'answer': await this.answerCall(callId, routingDecision); break; case 'transfer': await this.transferCall?.(callId, routingDecision); break; case 'voicemail': await this.sendToVoicemail?.(callId, routingDecision); break; case 'reject': await this.rejectCall?.(callId, routingDecision); break; default: await this.answerCall(callId, { handler: 'ai-agent' }); }
		return routingDecision;
	}

	async answerCall(callId: string, routing: any) {
		const callHandler = this.callHandlers.get(callId);
		if (!callHandler) return;
		const provider = this.providers.get(callHandler.provider);
		if (provider?.type === 'sip' && (window as any).sipClient) await (window as any).sipClient.answerCall(callId);
		callHandler.status = 'connected'; callHandler.answeredAt = new Date();
		if (routing.handler === 'ai-agent' && (window as any).localConversationEngine) await (window as any).localConversationEngine.startConversation({ callId, mode: 'phone', autoTranscription: this.transcriptionEnabled, realTimeResponse: true, context: 'restaurant_phone_system' });
	}

	async hangupCall(callId: string) {
		const callHandler = this.callHandlers.get(callId); if (!callHandler) return;
		try { const provider = this.providers.get(callHandler.provider); if (provider?.client?.hangup) await provider.client.hangup(callId); if (callHandler.recordingId && (window as any).transcriptionEngine) await (window as any).transcriptionEngine.stopRecording(callHandler.recordingId); const endTime = new Date(); const duration = endTime.getTime() - callHandler.startTime.getTime(); const minutes = Math.ceil(duration / (1000*60)); callHandler.endTime = endTime; callHandler.duration = duration; callHandler.status = 'ended'; provider.totalMinutes += minutes; if ((window as any).voipManager) await (window as any).voipManager.updateCallCost(callId, duration); if ((window as any).callQueueManager) (window as any).callQueueManager.onCallCompleted(callId, duration / 1000); } catch (e) { console.error('Failed to hangup call:', e); } finally { this.callHandlers.delete(callId); }
	}

	async getCustomerData(phoneNumber: string) { try { const saved = JSON.parse(localStorage.getItem('customer-data') || '{}'); const customer = saved[phoneNumber] || { isVip: false, previousBookings: 0, lastVisit: null, totalSpent: 0 }; if (customer.previousBookings > 5 || customer.totalSpent > 500) customer.isVip = true; return customer; } catch (e) { return { isVip: false, previousBookings: 0, totalSpent: 0 }; }
	}

	getOptimalProvider(type = 'outbound') { let best = 'in-house-sip'; let lowest = Infinity; for (const [id, p] of this.providers) { if (!p.enabled || !p.capabilities?.includes(type)) continue; if (p.cost < lowest) { lowest = p.cost; best = id; } } return best; }

	enableProvider(providerId: string, enable = true) { const provider = this.providers.get(providerId); if (provider) { provider.enabled = enable; if (providerId === 'twilio' && provider.client) { if (enable) provider.client.enable?.(); else provider.client.disable?.(); } this.updateControlPanel(); } }

	getProviderStats() { const stats: any = {}; for (const [id, provider] of this.providers) { stats[id] = { name: provider.name, enabled: provider.enabled, callCount: provider.callCount, totalMinutes: provider.totalMinutes, totalCost: provider.totalMinutes * provider.cost, capabilities: provider.capabilities }; } return stats; }

	createControlPanel() {
		const container = document.createElement('div'); container.id = 'telephony-control-panel'; container.className = 'telephony-control-container'; container.innerHTML = `<div class="telephony-control-header"><h3>📞 Telephony Control Center</h3><button class="control-minimize-btn" onclick="this.closest('.telephony-control-container').classList.toggle('minimized')">−</button></div><div class="telephony-control-body"><div class="provider-status" id="provider-status"></div><div class="active-calls" id="active-calls"><h4>Active Calls</h4><div class="calls-list" id="calls-list"></div></div><div class="system-controls"><label><input type="checkbox" id="recording-toggle" ${this.recordingEnabled ? 'checked' : ''}>Call Recording</label><label><input type="checkbox" id="transcription-toggle" ${this.transcriptionEnabled ? 'checked' : ''}>Real-time Transcription</label></div><div class="twilio-controls" id="twilio-controls"></div></div>`;
		document.body.appendChild(container); this.controlPanel = container; this.updateControlPanel(); this.setupControlPanelEvents();
	}

	updateControlPanel() {
		if (!this.controlPanel) return; const providerStatus = this.controlPanel.querySelector('#provider-status') as HTMLElement; providerStatus.innerHTML = Object.entries(this.getProviderStats()).map(([id, stat]: any) => `<div class="provider-item"><div class="provider-info"><span class="provider-name">${stat.name}</span><span class="provider-status ${stat.enabled ? 'enabled' : 'disabled'}">${stat.enabled ? '✅' : '❌'}</span></div><div class="provider-stats">${stat.callCount} calls, ${stat.totalMinutes} min, $${stat.totalCost.toFixed(2)}</div><div class="provider-actions"><button onclick="telephonyController.enableProvider('${id}', ${!stat.enabled})" class="btn btn-sm">${stat.enabled ? 'Disable' : 'Enable'}</button></div></div>`).join('');
		this.updateActiveCallsList(); if ((window as any).twilioIntegration) { const tw = this.controlPanel.querySelector('#twilio-controls'); tw && tw.appendChild((window as any).twilioIntegration.createConfigurationInterface?.()); }
	}

	updateActiveCallsList() { if (!this.controlPanel) return; const callsList = this.controlPanel.querySelector('#calls-list') as HTMLElement; if (this.callHandlers.size === 0) { callsList.innerHTML = '<p class="no-calls">No active calls</p>'; return; } callsList.innerHTML = Array.from(this.callHandlers.values()).map((call: any) => `<div class="active-call-item"><div class="call-info"><span class="call-number">${call.phoneNumber}</span><span class="call-status ${call.status}">${call.status}</span><span class="call-duration">${this.formatCallDuration(call)}</span></div><div class="call-actions"><button onclick="telephonyController.hangupCall('${call.callId}')" class="btn btn-sm btn-danger">Hangup</button></div></div>`).join(''); }

	formatCallDuration(call: any) { if (call.status === 'connecting') return 'Connecting...'; const startTime = call.answeredAt || call.startTime; const duration = Date.now() - startTime.getTime(); const seconds = Math.floor(duration / 1000); const minutes = Math.floor(seconds / 60); return `${minutes}:${(seconds % 60).toString().padStart(2,'0')}`; }

	setupControlPanelEvents() { const recordingToggle = this.controlPanel?.querySelector('#recording-toggle') as HTMLInputElement; recordingToggle?.addEventListener('change', (e: any) => { this.recordingEnabled = e.target.checked; }); const transcriptionToggle = this.controlPanel?.querySelector('#transcription-toggle') as HTMLInputElement; transcriptionToggle?.addEventListener('change', (e: any) => { this.transcriptionEnabled = e.target.checked; }); }

	setupEventListeners() {
		document.addEventListener('twilioIncomingCall', (e: any) => { this.handleIncomingCall({ callId: e.detail.callId, phoneNumber: e.detail.from, provider: 'twilio', to: e.detail.to }); });
		document.addEventListener('sipIncomingCall', (e: any) => { this.handleIncomingCall({ callId: e.detail.callId, phoneNumber: e.detail.from, provider: 'in-house-sip', to: e.detail.to }); });
		setInterval(() => { if (this.callHandlers.size > 0) this.updateActiveCallsList(); }, 1000);
	}
}

// Initialize and expose
let telephonyController: any;
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { telephonyController = new UnifiedTelephonyController(); }); else telephonyController = new UnifiedTelephonyController();
(window as any).telephonyController = telephonyController;

export {};

