/**
 * VoIP Number Management System
 * Manages virtual phone numbers, routing, and call distribution
 * Supports both in-house SIP and external providers like Twilio
 */

class VoIPNumberManager {
    constructor() {
        this.numbers = new Map();
        this.routingRules = new Map();
        this.providers = new Map();
        this.callHistory = [];
        this.activeNumbers = new Set();
        
        this.initializeDefaultProviders();
        this.loadConfiguration();
        this.createManagementInterface();
    }

    initializeDefaultProviders() {
        // In-house SIP provider
        this.registerProvider('sip', {
            name: 'In-House SIP',
            type: 'sip',
            cost: 0.01, // per minute
            setup: 25, // monthly server cost
            capacity: 100, // concurrent calls
            features: ['recording', 'ai-integration', 'unlimited-local'],
            configure: (config) => this.configureSIPProvider(config)
        });

        // VoIP.ms provider
        this.registerProvider('voipms', {
            name: 'VoIP.ms',
            type: 'sip-trunk',
            cost: 0.0085, // per minute
            setup: 4.25, // monthly DID cost
            capacity: 50,
            features: ['sms', 'porting', 'international'],
            configure: (config) => this.configureVoipMsProvider(config)
        });

        // Twilio provider (will be added modularly)
        this.registerProvider('twilio', {
            name: 'Twilio',
            type: 'api',
            cost: 0.0225, // per minute
            setup: 1.15, // monthly number cost
            capacity: 1000,
            features: ['sms', 'mms', 'global', 'advanced-routing'],
            configure: (config) => this.configureTwilioProvider(config),
            enabled: false // Disabled by default, can be enabled
        });
    }

    registerProvider(id, config) {
        this.providers.set(id, {
            id,
            ...config,
            numbers: new Set(),
            active: false
        });
    }

    async addNumber(numberConfig) {
        const {
            number,
            provider,
            type = 'inbound', // inbound, outbound, bidirectional
            routing = 'ai-agent',
            businessHours = null,
            failover = null,
            recording = true,
            transcription = true
        } = numberConfig;

        if (this.numbers.has(number)) {
            throw new Error(`Number ${number} already exists`);
        }

        const providerConfig = this.providers.get(provider);
        if (!providerConfig) {
            throw new Error(`Provider ${provider} not found`);
        }

        const numberEntry = {
            number,
            provider,
            type,
            routing,
            businessHours,
            failover,
            recording,
            transcription,
            created: new Date(),
            status: 'active',
            callCount: 0,
            totalMinutes: 0,
            lastCall: null
        };

        this.numbers.set(number, numberEntry);
        providerConfig.numbers.add(number);
        this.activeNumbers.add(number);

        this.updateRoutingRules(number, routing);
        this.saveConfiguration();
        this.updateInterface();

        console.log(`Number ${number} added successfully via ${providerConfig.name}`);
        return numberEntry;
    }

    updateRoutingRules(number, routing) {
        const rules = {
            'ai-agent': {
                handler: 'aiConversation',
                autoAnswer: true,
                timeout: 30,
                fallback: 'voicemail'
            },
            'human-transfer': {
                handler: 'humanAgent',
                autoAnswer: false,
                timeout: 20,
                fallback: 'ai-agent'
            },
            'voicemail-only': {
                handler: 'voicemail',
                autoAnswer: true,
                timeout: 5,
                fallback: null
            },
            'business-hours': {
                handler: 'conditional',
                conditions: {
                    business_hours: 'ai-agent',
                    after_hours: 'voicemail-only'
                }
            }
        };

        if (rules[routing]) {
            this.routingRules.set(number, rules[routing]);
        }
    }

    async routeCall(incomingCall) {
        const { number, callerNumber, timestamp } = incomingCall;
        
        if (!this.activeNumbers.has(number)) {
            console.warn(`Call to inactive number: ${number}`);
            return { action: 'reject', reason: 'number_inactive' };
        }

        const numberConfig = this.numbers.get(number);
        const routingRule = this.routingRules.get(number);

        // Check business hours if applicable
        if (numberConfig.businessHours && !this.isWithinBusinessHours(numberConfig.businessHours)) {
            const afterHoursRouting = routingRule.conditions?.after_hours || 'voicemail-only';
            return this.executeRouting(afterHoursRouting, incomingCall);
        }

        // Execute primary routing
        const routing = routingRule.handler || 'ai-agent';
        return this.executeRouting(routing, incomingCall);
    }

    executeRouting(handler, call) {
        const routingActions = {
            'aiConversation': () => ({
                action: 'answer',
                handler: 'ai-agent',
                autoAnswer: true,
                recording: true,
                transcription: true
            }),
            'humanAgent': () => ({
                action: 'transfer',
                handler: 'human',
                extensions: this.getAvailableAgents(),
                timeout: 20,
                fallback: 'ai-agent'
            }),
            'voicemail': () => ({
                action: 'voicemail',
                greeting: this.getVoicemailGreeting(call.number),
                recording: true,
                transcription: true
            })
        };

        const action = routingActions[handler];
        if (action) {
            const result = action();
            this.logCall(call, result);
            return result;
        }

        // Fallback to AI agent
        return routingActions.aiConversation();
    }

    isWithinBusinessHours(businessHours) {
        const now = new Date();
        const currentHour = now.getHours();
        const currentDay = now.getDay(); // 0 = Sunday

        if (businessHours.days && !businessHours.days.includes(currentDay)) {
            return false;
        }

        if (businessHours.hours) {
            const [startHour, endHour] = businessHours.hours;
            return currentHour >= startHour && currentHour < endHour;
        }

        return true;
    }

    getAvailableAgents() {
        // In a real implementation, this would check agent availability
        return [
            { extension: '101', name: 'Manager', available: true },
            { extension: '102', name: 'Host', available: false }
        ];
    }

    getVoicemailGreeting(number) {
        const numberConfig = this.numbers.get(number);
        return `Thank you for calling. Please leave a message after the tone, and we'll get back to you soon.`;
    }

    logCall(call, routing) {
        const callLog = {
            ...call,
            routing,
            timestamp: new Date(),
            duration: 0, // Will be updated when call ends
            cost: 0
        };

        this.callHistory.push(callLog);
        
        // Update number statistics
        const numberConfig = this.numbers.get(call.number);
        if (numberConfig) {
            numberConfig.callCount++;
            numberConfig.lastCall = new Date();
        }
    }

    async updateCallCost(callId, duration) {
        const callLog = this.callHistory.find(c => c.id === callId);
        if (callLog) {
            const numberConfig = this.numbers.get(callLog.number);
            const provider = this.providers.get(numberConfig.provider);
            
            const minutes = Math.ceil(duration / 60);
            const cost = minutes * provider.cost;
            
            callLog.duration = duration;
            callLog.cost = cost;
            
            numberConfig.totalMinutes += minutes;
        }
    }

    generateAnalytics() {
        const analytics = {
            totalNumbers: this.numbers.size,
            activeNumbers: this.activeNumbers.size,
            totalCalls: this.callHistory.length,
            totalMinutes: 0,
            totalCost: 0,
            providerBreakdown: {},
            routingBreakdown: {},
            callVolumeTrends: []
        };

        // Calculate totals and breakdowns
        for (const [number, config] of this.numbers) {
            analytics.totalMinutes += config.totalMinutes;
            
            const provider = config.provider;
            if (!analytics.providerBreakdown[provider]) {
                analytics.providerBreakdown[provider] = {
                    numbers: 0,
                    calls: 0,
                    minutes: 0,
                    cost: 0
                };
            }
            analytics.providerBreakdown[provider].numbers++;
            analytics.providerBreakdown[provider].calls += config.callCount;
            analytics.providerBreakdown[provider].minutes += config.totalMinutes;
        }

        // Calculate costs
        for (const [providerId, breakdown] of Object.entries(analytics.providerBreakdown)) {
            const provider = this.providers.get(providerId);
            breakdown.cost = breakdown.minutes * provider.cost + (breakdown.numbers * provider.setup);
            analytics.totalCost += breakdown.cost;
        }

        return analytics;
    }

    createManagementInterface() {
        const container = document.createElement('div');
        container.id = 'voip-manager';
        container.className = 'voip-manager-container';
        // Use safe HTML setting
        const htmlContent = `
            <div class="voip-manager-header">
                <h3>📞 VoIP Number Manager</h3>
                <button class="voip-minimize-btn" onclick="this.closest('.voip-manager-container').classList.toggle('minimized')">−</button>
            </div>
            <div class="voip-manager-body">
                <div class="voip-tabs">
                    <button class="voip-tab active" data-tab="numbers">Numbers</button>
                    <button class="voip-tab" data-tab="routing">Routing</button>
                    <button class="voip-tab" data-tab="analytics">Analytics</button>
                    <button class="voip-tab" data-tab="providers">Providers</button>
                </div>
                <div class="voip-content">
                    <div class="voip-panel active" id="numbers-panel">
                        <div class="add-number-section">
                            <h4>Add New Number</h4>
                            <div class="form-grid">
                                <input type="text" id="new-number" placeholder="Phone Number" class="form-control">
                                <select id="new-provider" class="form-control">
                                    <option value="sip">In-House SIP</option>
                                    <option value="voipms">VoIP.ms</option>
                                    <option value="twilio" disabled>Twilio (Disabled)</option>
                                </select>
                                <select id="new-routing" class="form-control">
                                    <option value="ai-agent">AI Agent</option>
                                    <option value="human-transfer">Human Transfer</option>
                                    <option value="voicemail-only">Voicemail Only</option>
                                    <option value="business-hours">Business Hours</option>
                                </select>
                                <button onclick="voipManager.addNumberFromForm()" class="btn btn-primary">Add Number</button>
                            </div>
                        </div>
                        <div class="numbers-list" id="numbers-list">
                            <!-- Numbers will be populated here -->
                        </div>
                    </div>
                    <div class="voip-panel" id="routing-panel">
                        <h4>Call Routing Configuration</h4>
                        <div id="routing-config">
                            <!-- Routing rules will be populated here -->
                        </div>
                    </div>
                    <div class="voip-panel" id="analytics-panel">
                        <h4>Usage Analytics</h4>
                        <div id="analytics-display">
                            <!-- Analytics will be populated here -->
                        </div>
                    </div>
                    <div class="voip-panel" id="providers-panel">
                        <h4>Provider Configuration</h4>
                        <div id="providers-config">
                            <!-- Provider settings will be populated here -->
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        if (window.safeSetHTML) {
            window.safeSetHTML(container, htmlContent);
        } else {
            container.innerHTML = htmlContent;
        }

        document.body.appendChild(container);
        this.interfaceElement = container;
        this.setupEventListeners();
        this.updateInterface();
    }

    setupEventListeners() {
        // Tab switching
        const tabs = this.interfaceElement.querySelectorAll('.voip-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const targetTab = e.target.dataset.tab;
                this.switchTab(targetTab);
            });
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        const tabs = this.interfaceElement.querySelectorAll('.voip-tab');
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update panels
        const panels = this.interfaceElement.querySelectorAll('.voip-panel');
        panels.forEach(panel => {
            panel.classList.toggle('active', panel.id === `${tabName}-panel`);
        });

        // Load content for active tab
        this.loadTabContent(tabName);
    }

    loadTabContent(tabName) {
        switch (tabName) {
            case 'numbers':
                this.updateNumbersList();
                break;
            case 'routing':
                this.updateRoutingConfig();
                break;
            case 'analytics':
                this.updateAnalytics();
                break;
            case 'providers':
                this.updateProvidersConfig();
                break;
        }
    }

    updateNumbersList() {
        const container = this.interfaceElement.querySelector('#numbers-list');
        if (container) {
            container.innerHTML = '';

            for (const [number, config] of this.numbers) {
                const numberElement = document.createElement('div');
                numberElement.className = 'number-item';
                const numberHTML = `
                    <div class="number-info">
                        <div class="number-display">${number}</div>
                        <div class="number-details">
                            <span class="provider-badge">${config.provider}</span>
                            <span class="routing-badge">${config.routing}</span>
                            <span class="status-badge ${config.status}">${config.status}</span>
                        </div>
                        <div class="number-stats">
                            Calls: ${config.callCount} | Minutes: ${config.totalMinutes}
                        </div>
                    </div>
                    <div class="number-actions">
                        <button onclick="voipManager.editNumber('${number}')" class="btn btn-sm">Edit</button>
                        <button onclick="voipManager.removeNumber('${number}')" class="btn btn-sm btn-danger">Remove</button>
                    </div>
                `;
                
                if (window.safeSetHTML) {
                    window.safeSetHTML(numberElement, numberHTML);
                } else {
                    numberElement.innerHTML = numberHTML;
                }
                
                if (container) {
                    container.appendChild(numberElement);
                }
            }
        }
    }

    updateAnalytics() {
        const analytics = this.generateAnalytics();
        const container = this.interfaceElement.querySelector('#analytics-display');
        
        const analyticsHTML = `
            <div class="analytics-summary">
                <div class="metric-card">
                    <div class="metric-value">${analytics.totalNumbers}</div>
                    <div class="metric-label">Total Numbers</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${analytics.totalCalls}</div>
                    <div class="metric-label">Total Calls</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${analytics.totalMinutes}</div>
                    <div class="metric-label">Total Minutes</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">$${analytics.totalCost.toFixed(2)}</div>
                    <div class="metric-label">Total Cost</div>
                </div>
            </div>
            <div class="provider-breakdown">
                <h5>Cost by Provider</h5>
                ${Object.entries(analytics.providerBreakdown).map(([provider, data]) => `
                    <div class="provider-row">
                        <span class="provider-name">${provider}</span>
                        <span class="provider-stats">${data.numbers} numbers, ${data.calls} calls</span>
                        <span class="provider-cost">$${data.cost.toFixed(2)}/month</span>
                    </div>
                `).join('')}
            </div>
        `;
        
        if (window.safeSetHTML) {
            window.safeSetHTML(container, analyticsHTML);
        } else {
            container.innerHTML = analyticsHTML;
        }
    }

    async addNumberFromForm() {
        try {
            const number = document.getElementById('new-number').value;
            const provider = document.getElementById('new-provider').value;
            const routing = document.getElementById('new-routing').value;

            if (!number) {
                if (window.safeNotify) {
                    window.safeNotify('Please enter a phone number', 'warning');
                } else {
                    console.warn('Please enter a phone number');
                }
                return;
            }

            await this.addNumber({
                number,
                provider,
                routing
            });

            // Clear form safely
            const numberInput = window.safeGetElement('new-number');
            if (numberInput) {
                numberInput.value = '';
            }
            
            if (window.safeNotify) {
                window.safeNotify(`Number ${number} added successfully!`, 'success');
            } else {
                console.log(`Number ${number} added successfully!`);
            }
        } catch (error) {
            console.error('Error adding VoIP number:', error);
            if (window.safeNotify) {
                window.safeNotify(`Error adding number: ${error.message}`, 'error');
            } else {
                console.error(`Error adding number: ${error.message}`);
            }
        }
    }

    updateInterface() {
        if (this.interfaceElement) {
            this.loadTabContent('numbers'); // Refresh current tab
        }
    }

    saveConfiguration() {
        const config = {
            numbers: Array.from(this.numbers.entries()),
            routingRules: Array.from(this.routingRules.entries()),
            providers: Array.from(this.providers.entries())
        };
        localStorage.setItem('voip-manager-config', JSON.stringify(config));
    }

    loadConfiguration() {
        const saved = localStorage.getItem('voip-manager-config');
        if (saved) {
            try {
                const config = JSON.parse(saved);
                this.numbers = new Map(config.numbers);
                this.routingRules = new Map(config.routingRules);
                // Don't overwrite providers, just update settings
            } catch (error) {
                console.warn('Failed to load VoIP configuration:', error);
            }
        }
    }
}

// Initialize VoIP Number Manager
let voipManager;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        voipManager = new VoIPNumberManager();
    });
} else {
    voipManager = new VoIPNumberManager();
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VoIPNumberManager;
}