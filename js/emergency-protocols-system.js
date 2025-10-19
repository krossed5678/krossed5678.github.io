/**
 * Emergency Protocols System
 * Implements emergency call routing, health incident procedures, and critical situation handling
 * Ensures rapid response to medical emergencies, safety incidents, and crisis situations
 */

class EmergencyProtocolsSystem {
    constructor() {
        this.emergencyContacts = new Map();
        this.protocols = new Map();
        this.activeIncidents = new Map();
        this.emergencyKeywords = new Set();
        this.escalationRules = new Map();
        this.responseTeams = new Map();
        this.trainingData = new Map();
        this.isEmergencyMode = false;
        this.alertSystems = new Map();
        this.init();
    }

    async init() {
        console.log('🚨 Initializing Emergency Protocols System...');
        
        // Setup emergency keywords detection
        this.setupEmergencyKeywords();
        
        // Configure emergency contacts
        this.setupEmergencyContacts();
        
        // Initialize emergency protocols
        this.setupEmergencyProtocols();
        
        // Setup escalation rules
        this.setupEscalationRules();
        
        // Configure response teams
        this.setupResponseTeams();
        
        // Setup alert systems
        this.setupAlertSystems();
        
        // Create emergency interface
        this.createEmergencyInterface();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load training procedures
        this.loadTrainingProcedures();
        
        console.log('✅ Emergency Protocols System ready');
    }

    setupEmergencyKeywords() {
        // Medical emergency keywords
        const medicalKeywords = [
            'heart attack', 'cardiac arrest', 'chest pain', 'can\'t breathe', 'choking',
            'unconscious', 'collapsed', 'bleeding', 'stroke', 'seizure', 'allergic reaction',
            'anaphylaxis', 'diabetic', 'overdose', 'poisoning', 'burns', 'broken bone',
            'head injury', 'spinal injury', 'emergency', 'ambulance', 'help me', 'dying',
            'can\'t move', 'severe pain', 'difficulty breathing', 'chest tightness'
        ];
        
        // Safety emergency keywords
        const safetyKeywords = [
            'fire', 'smoke', 'gas leak', 'explosion', 'bomb', 'threat', 'violence',
            'assault', 'robbery', 'weapon', 'gun', 'knife', 'dangerous', 'evacuation',
            'lockdown', 'intruder', 'suspicious', 'panic', 'scared', 'hiding'
        ];
        
        // Combine all emergency keywords
        [...medicalKeywords, ...safetyKeywords].forEach(keyword => {
            this.emergencyKeywords.add(keyword.toLowerCase());
        });
        
        console.log(`🔍 Loaded ${this.emergencyKeywords.size} emergency keywords`);
    }

    setupEmergencyContacts() {
        // Emergency service contacts
        this.emergencyContacts.set('911', {
            name: '911 Emergency Services',
            phone: '911',
            type: 'primary',
            services: ['medical', 'fire', 'police'],
            priority: 1,
            available24h: true
        });
        
        this.emergencyContacts.set('poison_control', {
            name: 'Poison Control Center',
            phone: '1-800-222-1222',
            type: 'specialized',
            services: ['poisoning', 'overdose'],
            priority: 2,
            available24h: true
        });
        
        // Restaurant-specific contacts
        this.emergencyContacts.set('manager', {
            name: 'Restaurant Manager',
            phone: '+1-555-MANAGER',
            type: 'internal',
            services: ['coordination', 'decisions'],
            priority: 2,
            available: '09:00-23:00'
        });
        
        this.emergencyContacts.set('security', {
            name: 'Security Team',
            phone: '+1-555-SECURITY',
            type: 'security',
            services: ['safety', 'crowd control'],
            priority: 2,
            available24h: true
        });
        
        this.emergencyContacts.set('maintenance', {
            name: 'Emergency Maintenance',
            phone: '+1-555-MAINT',
            type: 'technical',
            services: ['gas leak', 'electrical', 'water'],
            priority: 3,
            available24h: true
        });
        
        console.log(`📞 Configured ${this.emergencyContacts.size} emergency contacts`);
    }

    setupEmergencyProtocols() {
        // Medical emergency protocol
        this.protocols.set('medical', {
            name: 'Medical Emergency Protocol',
            steps: [
                'Assess the situation and ensure scene safety',
                'Call 911 immediately if life-threatening',
                'Provide first aid if trained and safe to do so',
                'Clear the area and maintain calm',
                'Stay on line with emergency dispatcher',
                'Notify restaurant manager',
                'Document incident details',
                'Assist emergency responders upon arrival'
            ],
            immediateActions: [
                { action: 'call_911', delay: 0 },
                { action: 'notify_manager', delay: 60 },
                { action: 'clear_area', delay: 120 }
            ],
            requiredInfo: [
                'Location of emergency',
                'Nature of medical emergency',
                'Number of people affected',
                'Current condition of patient',
                'Any first aid being provided'
            ]
        });
        
        // Fire emergency protocol
        this.protocols.set('fire', {
            name: 'Fire Emergency Protocol',
            steps: [
                'Sound fire alarm immediately',
                'Call 911 - report fire emergency',
                'Evacuate all customers and staff',
                'Use nearest exit, do not use elevators',
                'Meet at designated assembly point',
                'Account for all personnel',
                'Do not re-enter building',
                'Assist fire department with information'
            ],
            immediateActions: [
                { action: 'sound_alarm', delay: 0 },
                { action: 'call_911', delay: 10 },
                { action: 'evacuate', delay: 20 }
            ],
            evacuationPoints: [
                'Main parking lot - northwest corner',
                'Side parking area - east side',
                'Across street - park area'
            ]
        });
        
        // Security threat protocol
        this.protocols.set('security', {
            name: 'Security Threat Protocol',
            steps: [
                'Assess threat level - do not approach if dangerous',
                'Call 911 for immediate threats',
                'Alert security team',
                'Discretely notify staff using code words',
                'Implement lockdown if necessary',
                'Secure customers in safe areas',
                'Cooperate with law enforcement',
                'Document all details after incident'
            ],
            immediateActions: [
                { action: 'assess_threat', delay: 0 },
                { action: 'call_911', delay: 30 },
                { action: 'alert_security', delay: 60 }
            ],
            codeWords: {
                'Mr. Red': 'Medical emergency',
                'Mr. Blue': 'Security threat',
                'Mr. Gray': 'Evacuation needed'
            }
        });
        
        // Gas leak protocol
        this.protocols.set('gas_leak', {
            name: 'Gas Leak Emergency Protocol',
            steps: [
                'Do not use electrical switches or flames',
                'Evacuate the area immediately',
                'Call 911 from outside location',
                'Call gas company emergency line',
                'Prevent others from entering area',
                'Ventilate area if safely possible',
                'Stay upwind from leak source',
                'Wait for professional assessment'
            ],
            immediateActions: [
                { action: 'evacuate', delay: 0 },
                { action: 'call_911', delay: 60 },
                { action: 'call_gas_company', delay: 90 }
            ],
            prohibitedActions: [
                'Do not use phones near leak',
                'Do not turn on/off electrical devices',
                'Do not light matches or lighters',
                'Do not use elevators'
            ]
        });
        
        console.log(`📋 Configured ${this.protocols.size} emergency protocols`);
    }

    setupEscalationRules() {
        // Escalation based on emergency type and severity
        this.escalationRules.set('immediate_threat', {
            timeLimit: 0, // Call immediately
            contacts: ['911'],
            notifications: ['manager', 'security'],
            actions: ['document', 'coordinate']
        });
        
        this.escalationRules.set('medical_emergency', {
            timeLimit: 30, // 30 seconds
            contacts: ['911', 'manager'],
            notifications: ['security'],
            actions: ['first_aid', 'clear_area', 'document']
        });
        
        this.escalationRules.set('safety_concern', {
            timeLimit: 120, // 2 minutes
            contacts: ['manager', 'security'],
            notifications: ['maintenance'],
            actions: ['assess', 'document', 'monitor']
        });
        
        this.escalationRules.set('facility_issue', {
            timeLimit: 300, // 5 minutes
            contacts: ['maintenance', 'manager'],
            notifications: [],
            actions: ['assess', 'document']
        });
    }

    setupResponseTeams() {
        // First aid team
        this.responseTeams.set('first_aid', {
            name: 'First Aid Response Team',
            members: [
                { name: 'Sarah Johnson', role: 'Lead First Aider', certified: true, phone: '+1-555-0101' },
                { name: 'Mike Chen', role: 'First Aider', certified: true, phone: '+1-555-0102' },
                { name: 'Emily Rodriguez', role: 'First Aider', certified: false, phone: '+1-555-0103' }
            ],
            equipment: ['AED', 'First Aid Kit', 'Emergency Oxygen', 'Spinal Board'],
            protocols: ['CPR', 'AED', 'Choking', 'Bleeding Control']
        });
        
        // Evacuation team
        this.responseTeams.set('evacuation', {
            name: 'Evacuation Response Team',
            members: [
                { name: 'David Wilson', role: 'Evacuation Leader', trained: true, phone: '+1-555-0201' },
                { name: 'Lisa Brown', role: 'Floor Warden', trained: true, phone: '+1-555-0202' },
                { name: 'Tom Garcia', role: 'Safety Marshal', trained: true, phone: '+1-555-0203' }
            ],
            equipment: ['Megaphone', 'Emergency Lighting', 'Evacuation Maps'],
            responsibilities: ['Crowd Control', 'Exit Management', 'Head Count']
        });
        
        // Security team
        this.responseTeams.set('security', {
            name: 'Security Response Team',
            members: [
                { name: 'James Patterson', role: 'Security Chief', licensed: true, phone: '+1-555-0301' },
                { name: 'Maria Santos', role: 'Security Officer', licensed: true, phone: '+1-555-0302' }
            ],
            equipment: ['Radio System', 'Security Cameras', 'Emergency Phones'],
            protocols: ['Threat Assessment', 'Lockdown Procedures', 'Law Enforcement Coordination']
        });
    }

    setupAlertSystems() {
        // Phone alert system
        this.alertSystems.set('phone', {
            name: 'Phone Alert System',
            enabled: true,
            method: this.sendPhoneAlert.bind(this),
            priority: 1
        });
        
        // SMS alert system
        this.alertSystems.set('sms', {
            name: 'SMS Alert System', 
            enabled: true,
            method: this.sendSMSAlert.bind(this),
            priority: 2
        });
        
        // Email alert system
        this.alertSystems.set('email', {
            name: 'Email Alert System',
            enabled: true,
            method: this.sendEmailAlert.bind(this),
            priority: 3
        });
        
        // PA system alert
        this.alertSystems.set('pa_system', {
            name: 'PA System Alert',
            enabled: true,
            method: this.broadcastPAAlert.bind(this),
            priority: 1
        });
    }

    setupEventListeners() {
        // Listen for conversation events to detect emergencies
        document.addEventListener('conversationMessage', (event) => {
            this.analyzeForEmergency(event.detail.message);
        });
        
        // Listen for manual emergency triggers
        document.addEventListener('emergencyTriggered', (event) => {
            this.handleEmergencyTrigger(event.detail);
        });
        
        // Listen for incident updates
        document.addEventListener('incidentUpdate', (event) => {
            this.updateIncident(event.detail);
        });
        
        // Listen for emergency resolution
        document.addEventListener('emergencyResolved', (event) => {
            this.resolveEmergency(event.detail);
        });
    }

    analyzeForEmergency(message) {
        if (!message || typeof message !== 'string') return;
        
        const lowerMessage = message.toLowerCase();
        const detectedKeywords = [];
        
        // Check for emergency keywords
        for (const keyword of this.emergencyKeywords) {
            if (lowerMessage.includes(keyword)) {
                detectedKeywords.push(keyword);
            }
        }
        
        if (detectedKeywords.length > 0) {
            console.log(`🚨 Emergency keywords detected: ${detectedKeywords.join(', ')}`);
            
            // Classify emergency type
            const emergencyType = this.classifyEmergency(detectedKeywords);
            
            // Create emergency incident
            const incident = this.createEmergencyIncident({
                type: emergencyType,
                source: 'voice_detection',
                keywords: detectedKeywords,
                originalMessage: message,
                timestamp: new Date(),
                severity: this.assessSeverity(detectedKeywords)
            });
            
            // Trigger emergency response
            this.triggerEmergencyResponse(incident);
        }
    }

    classifyEmergency(keywords) {
        const medicalKeywords = ['heart', 'chest', 'breath', 'chok', 'unconscious', 'bleed', 'stroke', 'seizure', 'allerg'];
        const fireKeywords = ['fire', 'smoke', 'burn', 'explosion'];
        const securityKeywords = ['threat', 'violence', 'weapon', 'gun', 'knife', 'assault', 'robbery'];
        const gasKeywords = ['gas', 'leak', 'smell'];
        
        const keywordString = keywords.join(' ').toLowerCase();
        
        if (medicalKeywords.some(kw => keywordString.includes(kw))) return 'medical';
        if (fireKeywords.some(kw => keywordString.includes(kw))) return 'fire';
        if (securityKeywords.some(kw => keywordString.includes(kw))) return 'security';
        if (gasKeywords.some(kw => keywordString.includes(kw))) return 'gas_leak';
        
        return 'general'; // Default classification
    }

    assessSeverity(keywords) {
        const highSeverityKeywords = ['dying', 'unconscious', 'can\'t breathe', 'chest pain', 'fire', 'weapon', 'explosion'];
        const mediumSeverityKeywords = ['bleeding', 'pain', 'smoke', 'threat', 'gas'];
        
        const keywordString = keywords.join(' ').toLowerCase();
        
        if (highSeverityKeywords.some(kw => keywordString.includes(kw))) return 'critical';
        if (mediumSeverityKeywords.some(kw => keywordString.includes(kw))) return 'high';
        return 'medium';
    }

    createEmergencyIncident(data) {
        const incidentId = `INC_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        
        const incident = {
            id: incidentId,
            type: data.type,
            severity: data.severity,
            status: 'active',
            source: data.source,
            keywords: data.keywords || [],
            originalMessage: data.originalMessage || '',
            location: data.location || 'Restaurant Main Dining Area',
            timestamp: data.timestamp || new Date(),
            responders: [],
            actions: [],
            escalated: false,
            resolved: false,
            notes: []
        };
        
        // Store incident
        this.activeIncidents.set(incidentId, incident);
        
        console.log(`🚨 Emergency incident created: ${incidentId} (${incident.type} - ${incident.severity})`);
        
        // Log incident creation
        this.logIncidentAction(incidentId, {
            action: 'incident_created',
            details: `${incident.type} emergency detected`,
            timestamp: new Date(),
            automated: true
        });
        
        return incident;
    }

    async triggerEmergencyResponse(incident) {
        console.log(`🚨 Triggering emergency response for incident: ${incident.id}`);
        
        // Enter emergency mode
        this.isEmergencyMode = true;
        
        // Get appropriate protocol
        const protocol = this.protocols.get(incident.type);
        if (!protocol) {
            console.error(`❌ No protocol found for emergency type: ${incident.type}`);
            return;
        }
        
        // Execute immediate actions
        if (protocol.immediateActions) {
            for (const action of protocol.immediateActions) {
                setTimeout(() => {
                    this.executeEmergencyAction(incident.id, action.action);
                }, action.delay * 1000);
            }
        }
        
        // Determine escalation
        const escalationRule = this.getEscalationRule(incident);
        if (escalationRule) {
            setTimeout(() => {
                this.escalateIncident(incident.id, escalationRule);
            }, escalationRule.timeLimit * 1000);
        }
        
        // Send immediate notifications
        await this.sendEmergencyNotifications(incident);
        
        // Update UI
        this.updateEmergencyDisplay();
        
        // Emit emergency event
        const event = new CustomEvent('emergencyActivated', {
            detail: { incident }
        });
        document.dispatchEvent(event);
    }

    async executeEmergencyAction(incidentId, actionType) {
        const incident = this.activeIncidents.get(incidentId);
        if (!incident) return;
        
        console.log(`⚡ Executing emergency action: ${actionType} for incident ${incidentId}`);
        
        switch (actionType) {
            case 'call_911':
                await this.call911(incident);
                break;
                
            case 'notify_manager':
                await this.notifyManager(incident);
                break;
                
            case 'clear_area':
                await this.clearArea(incident);
                break;
                
            case 'sound_alarm':
                await this.soundAlarm(incident);
                break;
                
            case 'evacuate':
                await this.initiateEvacuation(incident);
                break;
                
            case 'alert_security':
                await this.alertSecurity(incident);
                break;
                
            case 'assess_threat':
                await this.assessThreat(incident);
                break;
                
            default:
                console.warn(`⚠️ Unknown emergency action: ${actionType}`);
        }
        
        // Log action
        this.logIncidentAction(incidentId, {
            action: actionType,
            details: `Emergency action executed`,
            timestamp: new Date(),
            automated: true
        });
    }

    async call911(incident) {
        console.log(`📞 Calling 911 for incident: ${incident.id}`);
        
        // In real implementation, integrate with telephony system
        const callData = {
            number: '911',
            incident: incident,
            priority: 'emergency',
            script: this.generate911Script(incident)
        };
        
        // Simulate call
        if (window.safeNotify) {
            window.safeNotify(
                `🚨 CALLING 911 - ${incident.type} emergency detected`,
                'emergency'
            );
        }
        
        // Log 911 call
        incident.actions.push({
            type: '911_call',
            timestamp: new Date(),
            status: 'initiated',
            details: '911 emergency services contacted'
        });
        
        // Add responder
        incident.responders.push({
            type: 'emergency_services',
            contacted: new Date(),
            eta: 'Unknown'
        });
    }

    generate911Script(incident) {
        const protocol = this.protocols.get(incident.type);
        const location = incident.location || 'Bella Vista Restaurant, 123 Downtown Plaza';
        
        return `Emergency at ${location}. We have a ${incident.type} emergency. ${
            incident.originalMessage ? `Details: ${incident.originalMessage}` : ''
        }. Please send immediate assistance.`;
    }

    async notifyManager(incident) {
        const manager = this.emergencyContacts.get('manager');
        if (!manager) return;
        
        console.log(`📱 Notifying manager for incident: ${incident.id}`);
        
        const notification = {
            contact: manager,
            incident: incident,
            message: `EMERGENCY: ${incident.type} incident at restaurant. Immediate attention required.`,
            method: 'phone'
        };
        
        await this.sendPhoneAlert(notification);
        
        incident.responders.push({
            type: 'manager',
            contacted: new Date(),
            contact: manager.phone
        });
    }

    async clearArea(incident) {
        console.log(`🚶 Clearing area for incident: ${incident.id}`);
        
        // Broadcast PA announcement
        const announcement = `Attention: For your safety, please clear the immediate area and follow staff instructions.`;
        
        await this.broadcastPAAlert({
            message: announcement,
            urgency: 'high',
            repeat: 3
        });
        
        // Alert staff to assist
        const staffAlert = `CODE ${incident.type.toUpperCase()}: Clear area around ${incident.location}. Assist customers to safety.`;
        
        await this.alertStaff(staffAlert);
        
        incident.actions.push({
            type: 'area_cleared',
            timestamp: new Date(),
            details: 'Area clearance initiated'
        });
    }

    async soundAlarm(incident) {
        console.log(`🚨 Sounding alarm for incident: ${incident.id}`);
        
        // Activate fire alarm system
        if (window.safeNotify) {
            window.safeNotify(
                '🚨 FIRE ALARM ACTIVATED - EVACUATE IMMEDIATELY',
                'emergency'
            );
        }
        
        // Log alarm activation
        incident.actions.push({
            type: 'alarm_activated',
            timestamp: new Date(),
            details: 'Fire alarm system activated'
        });
        
        // Auto-trigger evacuation
        setTimeout(() => {
            this.executeEmergencyAction(incident.id, 'evacuate');
        }, 10000); // 10 seconds
    }

    async initiateEvacuation(incident) {
        console.log(`🚪 Initiating evacuation for incident: ${incident.id}`);
        
        // Get evacuation protocol
        const protocol = this.protocols.get('fire');
        
        // Broadcast evacuation announcement
        const announcement = `ATTENTION: This is an emergency evacuation. Please exit the building immediately using the nearest exit. Do not use elevators. Proceed to the main parking lot.`;
        
        await this.broadcastPAAlert({
            message: announcement,
            urgency: 'critical',
            repeat: 5
        });
        
        // Alert evacuation team
        const evacuationTeam = this.responseTeams.get('evacuation');
        if (evacuationTeam) {
            for (const member of evacuationTeam.members) {
                await this.sendSMSAlert({
                    phone: member.phone,
                    message: `EVACUATION EMERGENCY: Report to evacuation duty immediately. ${incident.type} incident.`
                });
            }
        }
        
        incident.actions.push({
            type: 'evacuation_initiated',
            timestamp: new Date(),
            details: 'Full building evacuation started'
        });
    }

    async alertSecurity(incident) {
        console.log(`🛡️ Alerting security for incident: ${incident.id}`);
        
        const securityTeam = this.responseTeams.get('security');
        if (!securityTeam) return;
        
        for (const member of securityTeam.members) {
            await this.sendPhoneAlert({
                phone: member.phone,
                message: `SECURITY ALERT: ${incident.type} incident. Respond immediately.`,
                priority: 'urgent'
            });
        }
        
        incident.responders.push({
            type: 'security',
            contacted: new Date(),
            team: 'security_response'
        });
    }

    async assessThreat(incident) {
        console.log(`🔍 Assessing threat for incident: ${incident.id}`);
        
        // Threat assessment protocol
        const assessment = {
            timestamp: new Date(),
            type: incident.type,
            severity: incident.severity,
            location: incident.location,
            immediateRisk: this.calculateImmediateRisk(incident),
            recommendedActions: this.getRecommendedActions(incident)
        };
        
        incident.threatAssessment = assessment;
        
        // Auto-escalate high-risk threats
        if (assessment.immediateRisk === 'high') {
            this.executeEmergencyAction(incident.id, 'call_911');
        }
        
        incident.actions.push({
            type: 'threat_assessed',
            timestamp: new Date(),
            details: `Threat assessment completed - Risk: ${assessment.immediateRisk}`
        });
    }

    calculateImmediateRisk(incident) {
        const highRiskKeywords = ['weapon', 'violence', 'threat', 'fire', 'explosion'];
        const mediumRiskKeywords = ['suspicious', 'argument', 'smoke'];
        
        const keywordString = incident.keywords.join(' ').toLowerCase();
        
        if (highRiskKeywords.some(kw => keywordString.includes(kw))) return 'high';
        if (mediumRiskKeywords.some(kw => keywordString.includes(kw))) return 'medium';
        return 'low';
    }

    getRecommendedActions(incident) {
        const protocol = this.protocols.get(incident.type);
        return protocol ? protocol.steps.slice(0, 3) : ['Assess situation', 'Ensure safety', 'Contact authorities'];
    }

    getEscalationRule(incident) {
        if (incident.severity === 'critical') return this.escalationRules.get('immediate_threat');
        if (incident.type === 'medical') return this.escalationRules.get('medical_emergency');
        if (incident.type === 'security' || incident.type === 'fire') return this.escalationRules.get('immediate_threat');
        return this.escalationRules.get('safety_concern');
    }

    async sendEmergencyNotifications(incident) {
        console.log(`📢 Sending emergency notifications for incident: ${incident.id}`);
        
        // High-priority incidents get immediate phone alerts
        if (incident.severity === 'critical') {
            for (const [key, contact] of this.emergencyContacts.entries()) {
                if (contact.type === 'primary' || contact.type === 'internal') {
                    await this.sendPhoneAlert({
                        contact: contact,
                        incident: incident,
                        message: `CRITICAL EMERGENCY: ${incident.type} incident. Immediate response required.`
                    });
                }
            }
        }
        
        // All incidents get SMS notifications to key personnel
        const keyPersonnel = ['manager', 'security'];
        for (const key of keyPersonnel) {
            const contact = this.emergencyContacts.get(key);
            if (contact) {
                await this.sendSMSAlert({
                    contact: contact,
                    incident: incident,
                    message: `Emergency Alert: ${incident.type} incident at restaurant. Status: ${incident.status}`
                });
            }
        }
    }

    async sendPhoneAlert(data) {
        console.log(`📞 Sending phone alert:`, data);
        
        // Simulate phone call (in real implementation, integrate with telephony)
        if (window.safeNotify) {
            window.safeNotify(
                `📞 Calling ${data.contact?.name || data.phone}: ${data.message}`,
                'info'
            );
        }
        
        return { success: true, method: 'phone', timestamp: new Date() };
    }

    async sendSMSAlert(data) {
        console.log(`📱 Sending SMS alert:`, data);
        
        // Simulate SMS (in real implementation, integrate with SMS service)
        if (window.safeNotify) {
            window.safeNotify(
                `📱 SMS to ${data.contact?.name || data.phone}: ${data.message}`,
                'info'
            );
        }
        
        return { success: true, method: 'sms', timestamp: new Date() };
    }

    async sendEmailAlert(data) {
        console.log(`📧 Sending email alert:`, data);
        
        // Simulate email (in real implementation, integrate with email service)
        return { success: true, method: 'email', timestamp: new Date() };
    }

    async broadcastPAAlert(data) {
        console.log(`📢 Broadcasting PA alert:`, data);
        
        // Simulate PA system (in real implementation, integrate with audio system)
        if (window.safeNotify) {
            window.safeNotify(
                `📢 PA SYSTEM: ${data.message}`,
                data.urgency === 'critical' ? 'emergency' : 'warning'
            );
        }
        
        return { success: true, method: 'pa_system', timestamp: new Date() };
    }

    async alertStaff(message) {
        console.log(`👥 Alerting staff: ${message}`);
        
        // In real implementation, send to staff communication system
        if (window.safeNotify) {
            window.safeNotify(`👥 STAFF ALERT: ${message}`, 'warning');
        }
    }

    logIncidentAction(incidentId, actionData) {
        const incident = this.activeIncidents.get(incidentId);
        if (incident) {
            incident.actions.push({
                ...actionData,
                id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`
            });
        }
    }

    escalateIncident(incidentId, escalationRule) {
        const incident = this.activeIncidents.get(incidentId);
        if (!incident || incident.escalated) return;
        
        console.log(`⬆️ Escalating incident: ${incidentId}`);
        
        incident.escalated = true;
        incident.escalatedAt = new Date();
        
        // Contact additional responders
        for (const contactKey of escalationRule.contacts) {
            const contact = this.emergencyContacts.get(contactKey);
            if (contact) {
                this.sendPhoneAlert({
                    contact: contact,
                    incident: incident,
                    message: `ESCALATED EMERGENCY: ${incident.type} incident requires immediate attention.`
                });
            }
        }
        
        // Execute escalation actions
        for (const action of escalationRule.actions) {
            this.executeEmergencyAction(incidentId, action);
        }
        
        this.logIncidentAction(incidentId, {
            action: 'incident_escalated',
            details: 'Incident escalated to higher priority',
            timestamp: new Date(),
            automated: true
        });
    }

    resolveEmergency(data) {
        const incident = this.activeIncidents.get(data.incidentId);
        if (!incident) return;
        
        console.log(`✅ Resolving emergency incident: ${data.incidentId}`);
        
        incident.resolved = true;
        incident.resolvedAt = new Date();
        incident.resolution = data.resolution || 'Incident resolved';
        incident.status = 'resolved';
        
        // Exit emergency mode if no active incidents
        if (Array.from(this.activeIncidents.values()).every(inc => inc.resolved)) {
            this.isEmergencyMode = false;
            console.log('✅ Emergency mode deactivated - all incidents resolved');
        }
        
        this.logIncidentAction(data.incidentId, {
            action: 'incident_resolved',
            details: incident.resolution,
            timestamp: new Date(),
            automated: false
        });
        
        // Archive incident
        this.archiveIncident(incident);
        
        // Update UI
        this.updateEmergencyDisplay();
    }

    archiveIncident(incident) {
        // Move to archived incidents (could store in database)
        const archived = localStorage.getItem('archivedIncidents');
        const archivedIncidents = archived ? JSON.parse(archived) : [];
        
        archivedIncidents.push({
            ...incident,
            archivedAt: new Date()
        });
        
        // Keep only last 100 archived incidents
        if (archivedIncidents.length > 100) {
            archivedIncidents.splice(0, archivedIncidents.length - 100);
        }
        
        localStorage.setItem('archivedIncidents', JSON.stringify(archivedIncidents));
        
        // Remove from active incidents
        this.activeIncidents.delete(incident.id);
    }

    loadTrainingProcedures() {
        // Emergency response training materials
        this.trainingData.set('first_aid', {
            title: 'First Aid Training',
            modules: [
                'CPR and AED Training',
                'Choking Response',
                'Bleeding Control',
                'Shock Treatment',
                'Burns and Scalds'
            ],
            certification: 'Red Cross First Aid',
            renewalPeriod: '2 years'
        });
        
        this.trainingData.set('fire_safety', {
            title: 'Fire Safety Training',
            modules: [
                'Fire Extinguisher Use',
                'Evacuation Procedures',
                'Alarm Systems',
                'Emergency Exits',
                'Assembly Points'
            ],
            certification: 'Fire Safety Certificate',
            renewalPeriod: '1 year'
        });
        
        console.log(`📚 Loaded ${this.trainingData.size} training modules`);
    }

    createEmergencyInterface() {
        // Create emergency control panel
        const emergencyPanel = document.createElement('div');
        emergencyPanel.className = 'emergency-control-panel';
        emergencyPanel.innerHTML = `
            <div class="emergency-header">
                <h2>🚨 Emergency Protocols</h2>
                <div class="emergency-status">
                    <span class="status-indicator ${this.isEmergencyMode ? 'emergency' : ''}"></span>
                    <span>System: ${this.isEmergencyMode ? 'EMERGENCY' : 'Normal'}</span>
                </div>
            </div>
            
            <div class="emergency-content">
                <div class="quick-actions">
                    <button id="trigger-medical" class="emergency-btn medical">Medical Emergency</button>
                    <button id="trigger-fire" class="emergency-btn fire">Fire Emergency</button>
                    <button id="trigger-security" class="emergency-btn security">Security Threat</button>
                    <button id="trigger-gas" class="emergency-btn gas">Gas Leak</button>
                </div>
                
                <div class="active-incidents">
                    <h3>Active Incidents</h3>
                    <div id="incidents-list" class="incidents-list"></div>
                </div>
                
                <div class="emergency-contacts">
                    <h3>Emergency Contacts</h3>
                    <div id="contacts-list" class="contacts-list"></div>
                </div>
            </div>
        `;
        
        // Add styles
        this.addEmergencyStyles();
        
        // Add to page (hidden by default)
        emergencyPanel.style.display = 'none';
        document.body.appendChild(emergencyPanel);
        
        // Setup event listeners
        this.setupEmergencyEventListeners();
        
        // Initial display update
        this.updateEmergencyDisplay();
        
        console.log('🎨 Emergency protocols interface created');
    }

    addEmergencyStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .emergency-control-panel {
                position: fixed;
                top: 20px;
                left: 20px;
                width: 400px;
                max-height: 80vh;
                background: white;
                border-radius: 16px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
                overflow: hidden;
                z-index: 10001;
                font-family: system-ui, -apple-system, sans-serif;
                border: 3px solid #dc2626;
            }
            
            .emergency-header {
                background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
                color: white;
                padding: 16px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .emergency-header h2 {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
            }
            
            .emergency-status {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
            }
            
            .status-indicator {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: #10b981;
            }
            
            .status-indicator.emergency {
                background: #ef4444;
                animation: pulse 1s infinite;
            }
            
            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.5; }
                100% { opacity: 1; }
            }
            
            .emergency-content {
                padding: 20px;
                max-height: 70vh;
                overflow-y: auto;
            }
            
            .emergency-content h3 {
                margin: 0 0 12px 0;
                font-size: 16px;
                font-weight: 600;
                color: #1f2937;
            }
            
            .quick-actions {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 12px;
                margin-bottom: 24px;
            }
            
            .emergency-btn {
                padding: 16px 12px;
                border: none;
                border-radius: 12px;
                font-weight: 600;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.2s ease;
                color: white;
            }
            
            .emergency-btn.medical {
                background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
            }
            
            .emergency-btn.fire {
                background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%);
            }
            
            .emergency-btn.security {
                background: linear-gradient(135deg, #7c2d12 0%, #451a03 100%);
            }
            
            .emergency-btn.gas {
                background: linear-gradient(135deg, #eab308 0%, #a16207 100%);
                color: #1f2937;
            }
            
            .emergency-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
            }
            
            .incidents-list, .contacts-list {
                max-height: 200px;
                overflow-y: auto;
            }
            
            .incident-item {
                padding: 12px;
                border: 1px solid #fca5a5;
                border-radius: 8px;
                margin-bottom: 8px;
                background: #fef2f2;
            }
            
            .incident-type {
                font-weight: 600;
                color: #dc2626;
                text-transform: uppercase;
                font-size: 12px;
            }
            
            .incident-details {
                font-size: 14px;
                color: #374151;
                margin-top: 4px;
            }
            
            .incident-time {
                font-size: 12px;
                color: #6b7280;
                margin-top: 4px;
            }
            
            .contact-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 12px;
                border: 1px solid #e5e7eb;
                border-radius: 6px;
                margin-bottom: 6px;
                background: #f9fafb;
            }
            
            .contact-name {
                font-weight: 500;
                color: #1f2937;
            }
            
            .contact-phone {
                font-size: 12px;
                color: #6b7280;
                font-family: monospace;
            }
            
            .no-incidents {
                text-align: center;
                color: #10b981;
                font-weight: 500;
                padding: 20px;
            }
        `;
        document.head.appendChild(style);
    }

    setupEmergencyEventListeners() {
        // Emergency trigger buttons
        const emergencyTypes = ['medical', 'fire', 'security', 'gas'];
        
        emergencyTypes.forEach(type => {
            const btn = document.getElementById(`trigger-${type}`);
            if (btn) {
                btn.addEventListener('click', () => {
                    this.manualEmergencyTrigger(type);
                });
            }
        });
    }

    manualEmergencyTrigger(type) {
        console.log(`🚨 Manual emergency trigger: ${type}`);
        
        const incident = this.createEmergencyIncident({
            type: type,
            source: 'manual_trigger',
            severity: 'high',
            originalMessage: `Manual ${type} emergency trigger activated`,
            location: 'Restaurant - Manual Activation'
        });
        
        this.triggerEmergencyResponse(incident);
        
        if (window.safeNotify) {
            window.safeNotify(
                `🚨 ${type.toUpperCase()} EMERGENCY ACTIVATED`,
                'emergency'
            );
        }
    }

    updateEmergencyDisplay() {
        // Update incidents list
        const incidentsList = document.getElementById('incidents-list');
        if (incidentsList) {
            const activeIncidents = Array.from(this.activeIncidents.values())
                .filter(inc => !inc.resolved);
            
            if (activeIncidents.length === 0) {
                incidentsList.innerHTML = '<div class="no-incidents">✅ No active incidents</div>';
            } else {
                incidentsList.innerHTML = activeIncidents.map(incident => `
                    <div class="incident-item">
                        <div class="incident-type">${incident.type} - ${incident.severity}</div>
                        <div class="incident-details">${incident.originalMessage}</div>
                        <div class="incident-time">${incident.timestamp.toLocaleTimeString()}</div>
                    </div>
                `).join('');
            }
        }
        
        // Update contacts list
        const contactsList = document.getElementById('contacts-list');
        if (contactsList) {
            const primaryContacts = Array.from(this.emergencyContacts.values())
                .filter(contact => contact.type === 'primary' || contact.type === 'internal')
                .slice(0, 5);
            
            contactsList.innerHTML = primaryContacts.map(contact => `
                <div class="contact-item">
                    <div class="contact-name">${contact.name}</div>
                    <div class="contact-phone">${contact.phone}</div>
                </div>
            `).join('');
        }
        
        // Update status indicator
        const statusIndicator = document.querySelector('.status-indicator');
        const statusText = document.querySelector('.emergency-status span:last-child');
        
        if (statusIndicator) {
            statusIndicator.className = `status-indicator ${this.isEmergencyMode ? 'emergency' : ''}`;
        }
        
        if (statusText) {
            statusText.textContent = `System: ${this.isEmergencyMode ? 'EMERGENCY' : 'Normal'}`;
        }
    }

    showEmergencyPanel() {
        const panel = document.querySelector('.emergency-control-panel');
        if (panel) {
            panel.style.display = 'block';
            this.updateEmergencyDisplay();
        }
    }

    hideEmergencyPanel() {
        const panel = document.querySelector('.emergency-control-panel');
        if (panel) {
            panel.style.display = 'none';
        }
    }

    // Test method for demonstration
    simulateEmergencyScenarios() {
        console.log('🎭 Running emergency simulation scenarios...');
        
        // Scenario 1: Medical emergency
        setTimeout(() => {
            this.analyzeForEmergency("Help! Someone collapsed and isn't breathing!");
        }, 2000);
        
        // Scenario 2: Fire emergency
        setTimeout(() => {
            this.analyzeForEmergency("I smell smoke coming from the kitchen area!");
        }, 10000);
        
        // Scenario 3: Security threat
        setTimeout(() => {
            this.analyzeForEmergency("There's someone acting threatening near the entrance");
        }, 18000);
    }

    getStatus() {
        return {
            emergencyMode: this.isEmergencyMode,
            activeIncidents: this.activeIncidents.size,
            protocolsLoaded: this.protocols.size,
            emergencyContacts: this.emergencyContacts.size,
            responseTeams: this.responseTeams.size,
            keywordsMonitored: this.emergencyKeywords.size
        };
    }
}

// Initialize emergency protocols system
window.emergencyProtocols = new EmergencyProtocolsSystem();

// Export for module environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EmergencyProtocolsSystem;
}

console.log('🚨 Emergency Protocols System loaded');