/**
 * Proactive Communication System
 * Automated outbound calling for confirmations, updates, and promotional messages
 * Handles appointment confirmations, follow-ups, marketing campaigns, and customer service
 */

class ProactiveCommunicationSystem {
    constructor() {
        this.communicationQueue = [];
        this.scheduledCalls = new Map();
        this.campaignRules = new Map();
        this.templates = new Map();
        this.callHistory = [];
        this.preferences = new Map();
        this.isActive = false;
        this.callInterval = null;
        this.statistics = {
            totalCalls: 0,
            successfulCalls: 0,
            confirmations: 0,
            optOuts: 0
        };
        this.init();
    }

    async init() {
        console.log('📞 Initializing Proactive Communication System...');
        
        // Load communication templates
        this.setupCommunicationTemplates();
        
        // Setup campaign rules
        this.setupCampaignRules();
        
        // Load customer preferences
        await this.loadCustomerPreferences();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Create management interface
        this.createManagementInterface();
        
        // Start processing queue
        this.startQueueProcessor();
        
        console.log('✅ Proactive Communication System ready');
    }

    setupCommunicationTemplates() {
        // Reservation confirmation templates
        this.templates.set('reservation_confirmation', {
            type: 'confirmation',
            priority: 'high',
            timeWindow: { hours: 24, before: true },
            languages: {
                en: {
                    script: "Hello {customerName}, this is {restaurantName}. I'm calling to confirm your reservation for {partySize} guests on {date} at {time}. Please press 1 to confirm, 2 to reschedule, or 3 to cancel.",
                    sms: "Hi {customerName}! Confirming your reservation at {restaurantName} for {partySize} on {date} at {time}. Reply YES to confirm, CHANGE to modify, or CANCEL. Thanks!"
                },
                es: {
                    script: "Hola {customerName}, soy de {restaurantName}. Llamo para confirmar su reserva para {partySize} personas el {date} a las {time}. Presione 1 para confirmar, 2 para cambiar, o 3 para cancelar.",
                    sms: "¡Hola {customerName}! Confirmando su reserva en {restaurantName} para {partySize} el {date} a las {time}. Responda SÍ para confirmar, CAMBIAR para modificar, o CANCELAR."
                },
                fr: {
                    script: "Bonjour {customerName}, c'est {restaurantName}. J'appelle pour confirmer votre réservation pour {partySize} personnes le {date} à {time}. Appuyez sur 1 pour confirmer, 2 pour reporter, ou 3 pour annuler.",
                    sms: "Bonjour {customerName}! Confirmation de votre réservation chez {restaurantName} pour {partySize} le {date} à {time}. Répondez OUI pour confirmer, CHANGER pour modifier, ou ANNULER."
                }
            }
        });

        // Reminder templates
        this.templates.set('reservation_reminder', {
            type: 'reminder',
            priority: 'medium',
            timeWindow: { hours: 2, before: true },
            languages: {
                en: {
                    script: "Hello {customerName}, this is a friendly reminder from {restaurantName}. Your table for {partySize} is confirmed for {time} today. We look forward to seeing you! If you're running late, please call us.",
                    sms: "Reminder: Your table for {partySize} at {restaurantName} is confirmed for {time} today. See you soon! Call if you're running late."
                },
                es: {
                    script: "Hola {customerName}, un recordatorio amable de {restaurantName}. Su mesa para {partySize} está confirmada para las {time} hoy. ¡Esperamos verle! Si se retrasa, por favor llámenos.",
                    sms: "Recordatorio: Su mesa para {partySize} en {restaurantName} está confirmada para las {time} hoy. ¡Nos vemos pronto! Llame si se retrasa."
                }
            }
        });

        // Follow-up templates
        this.templates.set('post_visit_followup', {
            type: 'followup',
            priority: 'low',
            timeWindow: { hours: 24, before: false },
            languages: {
                en: {
                    script: "Hello {customerName}, thank you for dining with us at {restaurantName} last night. We hope you enjoyed your experience! We'd love to hear your feedback. Would you like to share a quick review?",
                    sms: "Hi {customerName}! Thanks for dining at {restaurantName}! We hope you had a great experience. We'd love your feedback: {reviewLink}"
                }
            }
        });

        // Promotional templates
        this.templates.set('special_promotion', {
            type: 'promotion',
            priority: 'low',
            timeWindow: { days: 7, before: true },
            languages: {
                en: {
                    script: "Hello {customerName}, it's {restaurantName}. We're excited to invite you to our {eventName} on {eventDate}. As a valued customer, you'll receive {discount}% off your meal. Would you like to make a reservation?",
                    sms: "Hi {customerName}! Special invitation to {eventName} at {restaurantName} on {eventDate}. Get {discount}% off as our valued guest! Book now: {bookingLink}"
                }
            }
        });

        // Wait list notification
        this.templates.set('waitlist_notification', {
            type: 'urgent',
            priority: 'high',
            timeWindow: { minutes: 15, before: true },
            languages: {
                en: {
                    script: "Hello {customerName}, great news! A table for {partySize} just became available at {restaurantName} for {time}. You have 15 minutes to confirm. Press 1 to accept or 2 to pass.",
                    sms: "Great news {customerName}! Table for {partySize} available NOW at {restaurantName}. You have 15 minutes to confirm. Reply YES to accept!"
                }
            }
        });

        console.log(`📝 Loaded ${this.templates.size} communication templates`);
    }

    setupCampaignRules() {
        // Automatic confirmation calls
        this.campaignRules.set('auto_confirmations', {
            enabled: true,
            trigger: 'reservation_created',
            delay: { hours: 2 },
            template: 'reservation_confirmation',
            channels: ['call', 'sms'],
            conditions: {
                reservationValue: { min: 50 },
                partySize: { min: 2 },
                timeUntilReservation: { min: 4, max: 168 } // 4 hours to 7 days
            }
        });

        // Pre-arrival reminders
        this.campaignRules.set('pre_arrival_reminders', {
            enabled: true,
            trigger: 'scheduled',
            delay: { hours: 2, before: true },
            template: 'reservation_reminder',
            channels: ['sms', 'call'],
            conditions: {
                confirmationStatus: 'confirmed',
                customerPreference: ['reminders_ok', 'all_communications']
            }
        });

        // Post-visit follow-ups
        this.campaignRules.set('post_visit_followups', {
            enabled: true,
            trigger: 'visit_completed',
            delay: { hours: 24 },
            template: 'post_visit_followup',
            channels: ['sms'],
            conditions: {
                visitRating: { min: 4 },
                customerType: ['regular', 'vip'],
                previousFollowup: { days: 30, min: true }
            }
        });

        // VIP special promotions
        this.campaignRules.set('vip_promotions', {
            enabled: true,
            trigger: 'scheduled',
            schedule: 'weekly',
            template: 'special_promotion',
            channels: ['call', 'sms'],
            conditions: {
                customerStatus: 'vip',
                lastVisit: { days: 14, max: true },
                optedOut: false
            }
        });

        // Wait list notifications
        this.campaignRules.set('waitlist_alerts', {
            enabled: true,
            trigger: 'table_available',
            delay: { minutes: 0 },
            template: 'waitlist_notification',
            channels: ['call', 'sms'],
            urgent: true
        });

        console.log(`⚙️ Configured ${this.campaignRules.size} campaign rules`);
    }

    async loadCustomerPreferences() {
        // Load customer communication preferences
        const savedPrefs = localStorage.getItem('customerCommunicationPrefs');
        if (savedPrefs) {
            try {
                const prefs = JSON.parse(savedPrefs);
                for (const [customerId, pref] of Object.entries(prefs)) {
                    this.preferences.set(customerId, pref);
                }
                console.log(`📋 Loaded preferences for ${this.preferences.size} customers`);
            } catch (error) {
                console.error('❌ Error loading customer preferences:', error);
            }
        }

        // Set default preferences for sample customers
        this.setDefaultPreferences();
    }

    setDefaultPreferences() {
        // Sample customer preferences
        const defaultPrefs = [
            { id: 'customer_1', phone: '+1-555-0123', preference: 'all_communications', language: 'en' },
            { id: 'customer_2', phone: '+1-555-0456', preference: 'confirmations_only', language: 'es' },
            { id: 'customer_3', phone: '+1-555-0789', preference: 'sms_only', language: 'en' },
            { id: 'customer_4', phone: '+1-555-0321', preference: 'opted_out', language: 'en' },
            { id: 'customer_5', phone: '+1-555-0654', preference: 'reminders_ok', language: 'fr' }
        ];

        defaultPrefs.forEach(pref => {
            this.preferences.set(pref.id, {
                phone: pref.phone,
                communicationPreference: pref.preference,
                preferredLanguage: pref.language,
                preferredChannel: pref.preference === 'sms_only' ? 'sms' : 'call',
                timeZone: 'America/New_York',
                quietHours: { start: '22:00', end: '08:00' }
            });
        });
    }

    setupEventListeners() {
        // Listen for reservation events
        document.addEventListener('reservationCreated', (event) => {
            this.handleReservationCreated(event.detail.reservation);
        });

        document.addEventListener('reservationConfirmed', (event) => {
            this.handleReservationConfirmed(event.detail.reservation);
        });

        document.addEventListener('visitCompleted', (event) => {
            this.handleVisitCompleted(event.detail.visit);
        });

        document.addEventListener('tableAvailable', (event) => {
            this.handleTableAvailable(event.detail);
        });

        // Listen for customer preference updates
        document.addEventListener('customerPreferenceUpdated', (event) => {
            this.updateCustomerPreference(event.detail);
        });
    }

    handleReservationCreated(reservation) {
        console.log('📅 Processing new reservation for proactive communication:', reservation);
        
        const rule = this.campaignRules.get('auto_confirmations');
        if (rule && rule.enabled) {
            this.scheduleCommunication({
                type: 'confirmation',
                customerId: reservation.customerId || `phone_${reservation.phone}`,
                reservationId: reservation.id,
                template: rule.template,
                channels: rule.channels,
                scheduledTime: new Date(Date.now() + (rule.delay.hours * 60 * 60 * 1000)),
                data: reservation
            });
        }

        // Schedule reminder
        const reminderRule = this.campaignRules.get('pre_arrival_reminders');
        if (reminderRule && reminderRule.enabled) {
            const reminderTime = new Date(reservation.dateTime);
            reminderTime.setHours(reminderTime.getHours() - reminderRule.delay.hours);
            
            this.scheduleCommunication({
                type: 'reminder',
                customerId: reservation.customerId || `phone_${reservation.phone}`,
                reservationId: reservation.id,
                template: reminderRule.template,
                channels: reminderRule.channels,
                scheduledTime: reminderTime,
                data: reservation
            });
        }
    }

    handleVisitCompleted(visit) {
        console.log('✅ Processing completed visit for follow-up:', visit);
        
        const rule = this.campaignRules.get('post_visit_followups');
        if (rule && rule.enabled && this.shouldSendFollowup(visit)) {
            this.scheduleCommunication({
                type: 'followup',
                customerId: visit.customerId,
                visitId: visit.id,
                template: rule.template,
                channels: rule.channels,
                scheduledTime: new Date(Date.now() + (rule.delay.hours * 60 * 60 * 1000)),
                data: visit
            });
        }
    }

    handleTableAvailable(tableData) {
        console.log('🪑 Table became available, checking waitlist:', tableData);
        
        // Check waitlist for this table size/time
        const waitlistCustomers = this.getWaitlistCustomers(tableData);
        
        waitlistCustomers.forEach(customer => {
            this.scheduleCommunication({
                type: 'urgent',
                customerId: customer.id,
                template: 'waitlist_notification',
                channels: ['call', 'sms'],
                scheduledTime: new Date(), // Immediate
                urgent: true,
                expiresAt: new Date(Date.now() + (15 * 60 * 1000)), // 15 minutes
                data: {
                    ...tableData,
                    customerName: customer.name,
                    partySize: customer.partySize
                }
            });
        });
    }

    scheduleCommunication(communication) {
        // Add to scheduled communications
        const id = `comm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        communication.id = id;
        communication.status = 'scheduled';
        communication.attempts = 0;
        communication.createdAt = new Date();

        // Check customer preferences
        const customerPref = this.preferences.get(communication.customerId);
        if (customerPref && customerPref.communicationPreference === 'opted_out') {
            console.log(`🚫 Customer ${communication.customerId} has opted out`);
            return null;
        }

        // Apply customer language preference
        if (customerPref && customerPref.preferredLanguage) {
            communication.language = customerPref.preferredLanguage;
        } else {
            communication.language = 'en'; // Default
        }

        // Apply customer channel preference
        if (customerPref && customerPref.preferredChannel) {
            communication.channels = [customerPref.preferredChannel];
        }

        // Check quiet hours
        if (this.isInQuietHours(communication.scheduledTime, customerPref)) {
            communication.scheduledTime = this.adjustForQuietHours(communication.scheduledTime, customerPref);
        }

        this.scheduledCalls.set(id, communication);
        this.communicationQueue.push(communication);
        
        console.log(`📬 Scheduled ${communication.type} communication for ${communication.scheduledTime}`);
        
        // Update UI
        this.updateScheduledCommunicationsDisplay();
        
        return communication;
    }

    async executeCommunication(communication) {
        console.log(`📞 Executing ${communication.type} communication:`, communication);
        
        const template = this.templates.get(communication.template);
        if (!template) {
            console.error(`❌ Template not found: ${communication.template}`);
            return { success: false, error: 'Template not found' };
        }

        const customerPref = this.preferences.get(communication.customerId);
        const language = communication.language || customerPref?.preferredLanguage || 'en';
        const languageTemplate = template.languages[language] || template.languages['en'];

        // Choose communication channel
        let channel = 'call'; // Default
        if (customerPref?.communicationPreference === 'sms_only') {
            channel = 'sms';
        } else if (communication.channels && communication.channels.length > 0) {
            channel = communication.channels[0];
        }

        // Personalize message
        const personalizedMessage = this.personalizeMessage(
            languageTemplate[channel === 'sms' ? 'sms' : 'script'],
            communication.data
        );

        // Execute based on channel
        let result;
        if (channel === 'sms') {
            result = await this.sendSMS(communication, personalizedMessage);
        } else {
            result = await this.makeCall(communication, personalizedMessage);
        }

        // Update statistics
        this.updateStatistics(communication, result);
        
        // Log result
        this.callHistory.push({
            ...communication,
            executedAt: new Date(),
            channel: channel,
            message: personalizedMessage,
            result: result
        });

        return result;
    }

    async makeCall(communication, script) {
        console.log(`☎️ Making call for ${communication.type}:`, script);
        
        // Simulate call execution (in real implementation, integrate with telephony system)
        const success = Math.random() > 0.2; // 80% success rate
        
        if (success) {
            // Simulate call interaction
            const responses = ['confirmed', 'rescheduled', 'cancelled', 'no_answer', 'busy'];
            const response = responses[Math.floor(Math.random() * responses.length)];
            
            console.log(`✅ Call completed with response: ${response}`);
            
            return {
                success: true,
                channel: 'call',
                response: response,
                duration: Math.floor(Math.random() * 120) + 30, // 30-150 seconds
                timestamp: new Date()
            };
        } else {
            console.log('❌ Call failed');
            return {
                success: false,
                channel: 'call',
                error: 'Failed to connect',
                timestamp: new Date()
            };
        }
    }

    async sendSMS(communication, message) {
        console.log(`📱 Sending SMS for ${communication.type}:`, message);
        
        // Simulate SMS sending
        const success = Math.random() > 0.05; // 95% success rate
        
        if (success) {
            console.log('✅ SMS sent successfully');
            
            return {
                success: true,
                channel: 'sms',
                messageId: `sms_${Date.now()}`,
                timestamp: new Date()
            };
        } else {
            console.log('❌ SMS failed to send');
            return {
                success: false,
                channel: 'sms',
                error: 'Failed to deliver SMS',
                timestamp: new Date()
            };
        }
    }

    personalizeMessage(template, data) {
        let message = template;
        
        // Replace placeholders with actual data
        const replacements = {
            customerName: data.customerName || data.name || 'Valued Customer',
            restaurantName: 'Bella Vista Restaurant',
            partySize: data.partySize || data.guests,
            date: data.date || (data.dateTime ? new Date(data.dateTime).toLocaleDateString() : 'today'),
            time: data.time || (data.dateTime ? new Date(data.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'soon'),
            eventName: data.eventName || 'Special Event',
            eventDate: data.eventDate || 'this weekend',
            discount: data.discount || '15',
            bookingLink: 'https://restaurant.com/book',
            reviewLink: 'https://restaurant.com/review'
        };
        
        for (const [key, value] of Object.entries(replacements)) {
            message = message.replace(new RegExp(`{${key}}`, 'g'), value);
        }
        
        return message;
    }

    isInQuietHours(scheduledTime, customerPref) {
        if (!customerPref || !customerPref.quietHours) return false;
        
        const hour = scheduledTime.getHours();
        const startHour = parseInt(customerPref.quietHours.start.split(':')[0]);
        const endHour = parseInt(customerPref.quietHours.end.split(':')[0]);
        
        if (startHour > endHour) {
            // Crosses midnight
            return hour >= startHour || hour < endHour;
        } else {
            return hour >= startHour && hour < endHour;
        }
    }

    adjustForQuietHours(scheduledTime, customerPref) {
        const adjusted = new Date(scheduledTime);
        const endHour = parseInt(customerPref.quietHours.end.split(':')[0]);
        
        adjusted.setHours(endHour, 0, 0, 0);
        
        return adjusted;
    }

    shouldSendFollowup(visit) {
        // Check if customer should receive follow-up based on various criteria
        const customerPref = this.preferences.get(visit.customerId);
        
        if (customerPref?.communicationPreference === 'opted_out') return false;
        if (customerPref?.communicationPreference === 'confirmations_only') return false;
        
        // Check if we sent a follow-up recently
        const recentFollowup = this.callHistory.find(call => 
            call.customerId === visit.customerId && 
            call.type === 'followup' && 
            (Date.now() - new Date(call.executedAt).getTime()) < (30 * 24 * 60 * 60 * 1000) // 30 days
        );
        
        return !recentFollowup;
    }

    getWaitlistCustomers(tableData) {
        // Mock waitlist data - in real implementation, integrate with reservation system
        return [
            {
                id: 'waitlist_1',
                name: 'Jennifer Wilson',
                partySize: tableData.seats,
                phone: '+1-555-0111',
                addedAt: new Date(Date.now() - (2 * 60 * 60 * 1000)) // 2 hours ago
            }
        ];
    }

    startQueueProcessor() {
        // Process communication queue every minute
        this.callInterval = setInterval(() => {
            this.processQueue();
        }, 60000); // Every minute

        console.log('⚡ Queue processor started');
    }

    async processQueue() {
        const now = new Date();
        const readyToSend = this.communicationQueue.filter(comm => 
            comm.status === 'scheduled' && 
            comm.scheduledTime <= now &&
            (!comm.expiresAt || comm.expiresAt > now)
        );

        for (const communication of readyToSend) {
            try {
                communication.status = 'executing';
                communication.attempts++;
                
                const result = await this.executeCommunication(communication);
                
                if (result.success) {
                    communication.status = 'completed';
                } else {
                    // Retry logic
                    if (communication.attempts < 3) {
                        communication.status = 'scheduled';
                        communication.scheduledTime = new Date(now.getTime() + (15 * 60 * 1000)); // Retry in 15 minutes
                    } else {
                        communication.status = 'failed';
                    }
                }
                
                // Remove completed/failed from queue
                if (communication.status === 'completed' || communication.status === 'failed') {
                    const index = this.communicationQueue.indexOf(communication);
                    if (index > -1) {
                        this.communicationQueue.splice(index, 1);
                    }
                }
                
            } catch (error) {
                console.error('❌ Error processing communication:', error);
                communication.status = 'failed';
            }
        }

        if (readyToSend.length > 0) {
            this.updateScheduledCommunicationsDisplay();
            this.updateStatisticsDisplay();
        }
    }

    updateStatistics(communication, result) {
        this.statistics.totalCalls++;
        
        if (result.success) {
            this.statistics.successfulCalls++;
            
            if (communication.type === 'confirmation' && result.response === 'confirmed') {
                this.statistics.confirmations++;
            }
        }
    }

    createManagementInterface() {
        // Create proactive communication management panel
        const commPanel = document.createElement('div');
        commPanel.className = 'proactive-comm-panel';
        commPanel.innerHTML = `
            <div class="comm-header">
                <h2>📞 Proactive Communications</h2>
                <div class="comm-controls">
                    <button id="toggle-proactive" class="comm-btn primary">
                        ${this.isActive ? 'Pause' : 'Start'} System
                    </button>
                    <button id="comm-settings" class="comm-btn">Settings</button>
                </div>
            </div>
            
            <div class="comm-content">
                <div class="stats-row">
                    <div class="stat-card">
                        <div class="stat-value" id="total-calls-stat">${this.statistics.totalCalls}</div>
                        <div class="stat-label">Total Calls</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="successful-calls-stat">${this.statistics.successfulCalls}</div>
                        <div class="stat-label">Successful</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="confirmations-stat">${this.statistics.confirmations}</div>
                        <div class="stat-label">Confirmations</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="queue-size-stat">${this.communicationQueue.length}</div>
                        <div class="stat-label">In Queue</div>
                    </div>
                </div>
                
                <div class="comm-sections">
                    <div class="comm-section">
                        <h3>Scheduled Communications</h3>
                        <div id="scheduled-comms" class="comms-list"></div>
                    </div>
                    
                    <div class="comm-section">
                        <h3>Recent Activity</h3>
                        <div id="recent-comms" class="comms-list"></div>
                    </div>
                </div>
            </div>
        `;
        
        // Add styles
        this.addCommStyles();
        
        // Add to page (hidden by default)
        commPanel.style.display = 'none';
        document.body.appendChild(commPanel);
        
        // Setup event listeners
        this.setupCommEventListeners();
        
        // Initial display update
        this.updateAllCommDisplays();
        
        console.log('🎨 Proactive communication interface created');
    }

    addCommStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .proactive-comm-panel {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 600px;
                max-height: 70vh;
                background: white;
                border-radius: 16px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
                overflow: hidden;
                z-index: 9998;
                font-family: system-ui, -apple-system, sans-serif;
            }
            
            .comm-header {
                background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
                color: white;
                padding: 16px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .comm-header h2 {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
            }
            
            .comm-controls {
                display: flex;
                gap: 8px;
            }
            
            .comm-btn {
                padding: 8px 16px;
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 8px;
                background: rgba(255, 255, 255, 0.1);
                color: white;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.2s ease;
            }
            
            .comm-btn:hover {
                background: rgba(255, 255, 255, 0.2);
            }
            
            .comm-btn.primary {
                background: rgba(255, 255, 255, 0.9);
                color: #7c3aed;
            }
            
            .comm-content {
                padding: 20px;
                max-height: 60vh;
                overflow-y: auto;
            }
            
            .stats-row {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 12px;
                margin-bottom: 20px;
            }
            
            .stat-card {
                padding: 16px;
                background: #f8fafc;
                border-radius: 12px;
                text-align: center;
            }
            
            .stat-value {
                font-size: 24px;
                font-weight: bold;
                color: #1f2937;
                margin-bottom: 4px;
            }
            
            .stat-label {
                font-size: 12px;
                color: #6b7280;
            }
            
            .comm-sections {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
            }
            
            .comm-section h3 {
                margin: 0 0 12px 0;
                font-size: 16px;
                font-weight: 600;
                color: #1f2937;
            }
            
            .comms-list {
                max-height: 300px;
                overflow-y: auto;
            }
            
            .comm-item {
                padding: 12px;
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                margin-bottom: 8px;
            }
            
            .comm-type {
                font-weight: 600;
                color: #7c3aed;
                font-size: 14px;
            }
            
            .comm-details {
                font-size: 12px;
                color: #6b7280;
                margin-top: 4px;
            }
            
            .comm-status {
                display: inline-block;
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 10px;
                font-weight: 600;
                margin-top: 4px;
            }
            
            .status-scheduled { background: #fef3c7; color: #92400e; }
            .status-executing { background: #dbeafe; color: #1e40af; }
            .status-completed { background: #dcfce7; color: #166534; }
            .status-failed { background: #fee2e2; color: #991b1b; }
        `;
        document.head.appendChild(style);
    }

    setupCommEventListeners() {
        const toggleBtn = document.getElementById('toggle-proactive');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.toggleSystem();
            });
        }
        
        const settingsBtn = document.getElementById('comm-settings');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.showSettings();
            });
        }
    }

    toggleSystem() {
        this.isActive = !this.isActive;
        
        const toggleBtn = document.getElementById('toggle-proactive');
        if (toggleBtn) {
            toggleBtn.textContent = `${this.isActive ? 'Pause' : 'Start'} System`;
        }
        
        if (this.isActive) {
            this.startQueueProcessor();
        } else {
            if (this.callInterval) {
                clearInterval(this.callInterval);
                this.callInterval = null;
            }
        }
        
        if (window.safeNotify) {
            window.safeNotify(
                `📞 Proactive communication system ${this.isActive ? 'activated' : 'paused'}`,
                'info'
            );
        }
        
        console.log(`📞 System ${this.isActive ? 'activated' : 'paused'}`);
    }

    showSettings() {
        // Show settings modal (simplified implementation)
        if (window.safeNotify) {
            window.safeNotify('⚙️ Communication settings - feature coming soon!', 'info');
        }
    }

    updateAllCommDisplays() {
        this.updateStatisticsDisplay();
        this.updateScheduledCommunicationsDisplay();
        this.updateRecentActivityDisplay();
    }

    updateStatisticsDisplay() {
        const elements = {
            'total-calls-stat': this.statistics.totalCalls,
            'successful-calls-stat': this.statistics.successfulCalls,
            'confirmations-stat': this.statistics.confirmations,
            'queue-size-stat': this.communicationQueue.length
        };
        
        for (const [id, value] of Object.entries(elements)) {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        }
    }

    updateScheduledCommunicationsDisplay() {
        const container = document.getElementById('scheduled-comms');
        if (!container) return;
        
        const scheduled = Array.from(this.scheduledCalls.values())
            .filter(comm => comm.status === 'scheduled')
            .sort((a, b) => a.scheduledTime - b.scheduledTime)
            .slice(0, 10);
        
        container.innerHTML = scheduled.map(comm => `
            <div class="comm-item">
                <div class="comm-type">${comm.type.toUpperCase()}</div>
                <div class="comm-details">
                    ${comm.scheduledTime.toLocaleString()}<br>
                    Customer: ${comm.data?.customerName || 'Unknown'}
                </div>
                <div class="comm-status status-${comm.status}">${comm.status}</div>
            </div>
        `).join('');
    }

    updateRecentActivityDisplay() {
        const container = document.getElementById('recent-comms');
        if (!container) return;
        
        const recent = this.callHistory
            .sort((a, b) => new Date(b.executedAt) - new Date(a.executedAt))
            .slice(0, 10);
        
        container.innerHTML = recent.map(comm => `
            <div class="comm-item">
                <div class="comm-type">${comm.type.toUpperCase()}</div>
                <div class="comm-details">
                    ${new Date(comm.executedAt).toLocaleString()}<br>
                    ${comm.channel.toUpperCase()} • ${comm.result?.success ? 'Success' : 'Failed'}
                </div>
                <div class="comm-status status-${comm.result?.success ? 'completed' : 'failed'}">
                    ${comm.result?.success ? 'completed' : 'failed'}
                </div>
            </div>
        `).join('');
    }

    showCommPanel() {
        const panel = document.querySelector('.proactive-comm-panel');
        if (panel) {
            panel.style.display = 'block';
            this.updateAllCommDisplays();
        }
    }

    hideCommPanel() {
        const panel = document.querySelector('.proactive-comm-panel');
        if (panel) {
            panel.style.display = 'none';
        }
    }

    // Test method to simulate various scenarios
    simulateScenarios() {
        console.log('🎭 Running proactive communication scenarios...');
        
        // Simulate new reservation
        this.handleReservationCreated({
            id: 'test_reservation_1',
            customerId: 'customer_1',
            customerName: 'Jennifer Wilson',
            phone: '+1-555-0123',
            partySize: 4,
            dateTime: new Date(Date.now() + (24 * 60 * 60 * 1000)), // Tomorrow
            date: new Date(Date.now() + (24 * 60 * 60 * 1000)).toLocaleDateString(),
            time: '7:00 PM'
        });
        
        // Simulate table becoming available
        setTimeout(() => {
            this.handleTableAvailable({
                tableId: 'table_5',
                seats: 4,
                availableAt: new Date()
            });
        }, 2000);
        
        // Simulate completed visit
        setTimeout(() => {
            this.handleVisitCompleted({
                id: 'visit_1',
                customerId: 'customer_2',
                customerName: 'Maria Rodriguez',
                completedAt: new Date(),
                rating: 5
            });
        }, 4000);
    }

    getStatus() {
        return {
            isActive: this.isActive,
            queueSize: this.communicationQueue.length,
            scheduledCalls: this.scheduledCalls.size,
            totalCalls: this.statistics.totalCalls,
            successRate: this.statistics.totalCalls > 0 ? 
                ((this.statistics.successfulCalls / this.statistics.totalCalls) * 100).toFixed(1) + '%' : 
                '0%'
        };
    }
}

// Initialize proactive communication system
window.proactiveComm = new ProactiveCommunicationSystem();

// Export for module environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProactiveCommunicationSystem;
}

console.log('📞 Proactive Communication System loaded');