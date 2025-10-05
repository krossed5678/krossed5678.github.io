/**
 * SMS Confirmation System
 * Automatic reservation confirmations, reminders, and follow-ups via Twilio
 * Reduces no-shows and improves customer experience
 */

class SMSConfirmationSystem {
    constructor(options = {}) {
        this.enabled = options.enabled !== false;
        this.twilioIntegration = null;
        this.confirmationDelay = options.confirmationDelay || 5000; // 5 seconds after booking
        this.reminderAdvance = options.reminderAdvance || 24; // 24 hours before
        this.followUpDelay = options.followUpDelay || 2; // 2 hours after reservation time
        
        // Message templates
        this.templates = {
            confirmation: "Hi {name}! Your reservation at {restaurant} is confirmed for {date} at {time} for {party} guests. Reply CANCEL to cancel. Thanks!",
            reminder: "Reminder: You have a reservation today at {restaurant} at {time} for {party} guests. Reply CONFIRM to confirm or CANCEL to cancel.",
            followUp: "Hi {name}! Hope you enjoyed your visit to {restaurant}! Please rate your experience: Reply 1-5 (5=excellent). Thanks!",
            cancellation: "Your reservation at {restaurant} for {date} at {time} has been cancelled. We hope to see you soon!",
            modification: "Your reservation at {restaurant} has been updated: {date} at {time} for {party} guests. Reply CANCEL if needed.",
            weatherAlert: "Weather Alert: Rain expected during your reservation time at {restaurant}. We have covered seating available. See you at {time}!",
            specialOffer: "Hi {name}! Thanks for dining with us. Enjoy 10% off your next visit with code RETURN10. Valid for 30 days. Book online or call us!"
        };
        
        // Scheduled messages
        this.scheduledMessages = new Map();
        this.sentMessages = [];
        this.messageStats = {
            confirmationsSent: 0,
            remindersSent: 0,
            followUpsSent: 0,
            responses: 0,
            cancellationsViaSMS: 0
        };
        
        this.initializeSystem();
    }

    async initializeSystem() {
        try {
            // Wait for Twilio integration to be available
            await this.waitForTwilio();
            
            // Set up message processing
            this.startMessageProcessor();
            
            // Listen for new bookings
            this.setupBookingListeners();
            
            // Load scheduled messages from storage
            this.loadScheduledMessages();
            
            // Create SMS management interface
            this.createSMSInterface();
            
            console.log('SMS Confirmation System initialized');
            
        } catch (error) {
            console.error('Failed to initialize SMS system:', error);
            this.enabled = false;
        }
    }

    waitForTwilio() {
        return new Promise((resolve, reject) => {
            const checkTwilio = () => {
                if (window.twilioIntegration) {
                    this.twilioIntegration = window.twilioIntegration;
                    resolve();
                } else {
                    setTimeout(checkTwilio, 100);
                }
            };
            
            checkTwilio();
            
            // Timeout after 10 seconds
            setTimeout(() => {
                reject(new Error('Twilio integration not available'));
            }, 10000);
        });
    }

    setupBookingListeners() {
        // Listen for new reservations
        document.addEventListener('bookingCreated', (event) => {
            if (this.enabled && this.twilioIntegration?.enabled) {
                this.handleNewBooking(event.detail);
            }
        });
        
        // Listen for booking modifications
        document.addEventListener('bookingModified', (event) => {
            if (this.enabled && this.twilioIntegration?.enabled) {
                this.handleBookingModification(event.detail);
            }
        });
        
        // Listen for booking cancellations
        document.addEventListener('bookingCancelled', (event) => {
            if (this.enabled && this.twilioIntegration?.enabled) {
                this.handleBookingCancellation(event.detail);
            }
        });
    }

    async handleNewBooking(bookingData) {
        const {
            id,
            customer_name,
            phone_number,
            party_size,
            date,
            start_time,
            restaurant_name = this.getRestaurantName()
        } = bookingData;

        console.log(`Processing SMS confirmations for booking ${id}`);

        try {
            // Schedule confirmation SMS (immediate)
            await this.scheduleConfirmationSMS(bookingData);
            
            // Schedule reminder SMS (24 hours before)
            await this.scheduleReminderSMS(bookingData);
            
            // Schedule follow-up SMS (2 hours after)
            await this.scheduleFollowUpSMS(bookingData);
            
        } catch (error) {
            console.error('Failed to process SMS for booking:', error);
        }
    }

    async scheduleConfirmationSMS(bookingData) {
        const message = this.formatMessage('confirmation', bookingData);
        
        const scheduledMessage = {
            id: `conf-${bookingData.id}`,
            bookingId: bookingData.id,
            type: 'confirmation',
            to: bookingData.phone_number,
            message,
            scheduledFor: new Date(Date.now() + this.confirmationDelay),
            status: 'scheduled'
        };
        
        this.scheduledMessages.set(scheduledMessage.id, scheduledMessage);
        this.saveScheduledMessages();
        
        console.log(`Confirmation SMS scheduled for booking ${bookingData.id}`);
    }

    async scheduleReminderSMS(bookingData) {
        const reservationDateTime = new Date(`${bookingData.date}T${bookingData.start_time}`);
        const reminderTime = new Date(reservationDateTime.getTime() - (this.reminderAdvance * 60 * 60 * 1000));
        
        // Only schedule if reminder time is in the future
        if (reminderTime > new Date()) {
            const message = this.formatMessage('reminder', bookingData);
            
            const scheduledMessage = {
                id: `remind-${bookingData.id}`,
                bookingId: bookingData.id,
                type: 'reminder',
                to: bookingData.phone_number,
                message,
                scheduledFor: reminderTime,
                status: 'scheduled'
            };
            
            this.scheduledMessages.set(scheduledMessage.id, scheduledMessage);
            this.saveScheduledMessages();
            
            console.log(`Reminder SMS scheduled for ${reminderTime.toLocaleString()}`);
        }
    }

    async scheduleFollowUpSMS(bookingData) {
        const reservationDateTime = new Date(`${bookingData.date}T${bookingData.start_time}`);
        const followUpTime = new Date(reservationDateTime.getTime() + (this.followUpDelay * 60 * 60 * 1000));
        
        const message = this.formatMessage('followUp', bookingData);
        
        const scheduledMessage = {
            id: `followup-${bookingData.id}`,
            bookingId: bookingData.id,
            type: 'followUp',
            to: bookingData.phone_number,
            message,
            scheduledFor: followUpTime,
            status: 'scheduled'
        };
        
        this.scheduledMessages.set(scheduledMessage.id, scheduledMessage);
        this.saveScheduledMessages();
        
        console.log(`Follow-up SMS scheduled for ${followUpTime.toLocaleString()}`);
    }

    formatMessage(templateKey, bookingData) {
        let template = this.templates[templateKey];
        
        const formatDate = (date) => {
            return new Date(date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            });
        };
        
        const formatTime = (time) => {
            const [hours, minutes] = time.split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
            return `${displayHour}:${minutes} ${ampm}`;
        };
        
        return template
            .replace(/{name}/g, bookingData.customer_name)
            .replace(/{restaurant}/g, bookingData.restaurant_name || this.getRestaurantName())
            .replace(/{date}/g, formatDate(bookingData.date))
            .replace(/{time}/g, formatTime(bookingData.start_time))
            .replace(/{party}/g, bookingData.party_size);
    }

    async sendSMS(to, message, bookingId = null) {
        if (!this.twilioIntegration?.enabled) {
            throw new Error('Twilio integration not enabled');
        }

        try {
            const result = await this.twilioIntegration.sendSMS(to, message, {
                fromNumber: this.getTwilioNumber()
            });
            
            // Track the sent message
            const sentMessage = {
                id: result.messageId,
                bookingId,
                to,
                message,
                sentAt: new Date(),
                provider: 'twilio',
                status: 'sent'
            };
            
            this.sentMessages.push(sentMessage);
            this.saveMessageHistory();
            
            return result;
            
        } catch (error) {
            console.error('Failed to send SMS:', error);
            throw error;
        }
    }

    startMessageProcessor() {
        // Process scheduled messages every minute
        setInterval(() => {
            this.processScheduledMessages();
        }, 60000);
        
        // Initial processing
        this.processScheduledMessages();
    }

    async processScheduledMessages() {
        const now = new Date();
        
        for (const [messageId, scheduledMessage] of this.scheduledMessages) {
            if (scheduledMessage.status === 'scheduled' && scheduledMessage.scheduledFor <= now) {
                try {
                    await this.sendSMS(
                        scheduledMessage.to, 
                        scheduledMessage.message, 
                        scheduledMessage.bookingId
                    );
                    
                    scheduledMessage.status = 'sent';
                    scheduledMessage.sentAt = new Date();
                    
                    // Update statistics
                    switch (scheduledMessage.type) {
                        case 'confirmation':
                            this.messageStats.confirmationsSent++;
                            break;
                        case 'reminder':
                            this.messageStats.remindersSent++;
                            break;
                        case 'followUp':
                            this.messageStats.followUpsSent++;
                            break;
                    }
                    
                    console.log(`Sent ${scheduledMessage.type} SMS for booking ${scheduledMessage.bookingId}`);
                    
                } catch (error) {
                    console.error(`Failed to send scheduled SMS ${messageId}:`, error);
                    scheduledMessage.status = 'failed';
                    scheduledMessage.error = error.message;
                }
                
                this.saveScheduledMessages();
            }
        }
    }

    handleBookingModification(bookingData) {
        // Cancel existing scheduled messages for this booking
        this.cancelScheduledMessages(bookingData.id);
        
        // Send modification notification
        const message = this.formatMessage('modification', bookingData);
        this.sendSMS(bookingData.phone_number, message, bookingData.id);
        
        // Schedule new messages
        this.handleNewBooking(bookingData);
    }

    handleBookingCancellation(bookingData) {
        // Cancel existing scheduled messages for this booking
        this.cancelScheduledMessages(bookingData.id);
        
        // Send cancellation notification
        const message = this.formatMessage('cancellation', bookingData);
        this.sendSMS(bookingData.phone_number, message, bookingData.id);
    }

    cancelScheduledMessages(bookingId) {
        for (const [messageId, scheduledMessage] of this.scheduledMessages) {
            if (scheduledMessage.bookingId === bookingId && scheduledMessage.status === 'scheduled') {
                scheduledMessage.status = 'cancelled';
                console.log(`Cancelled scheduled SMS ${messageId} for booking ${bookingId}`);
            }
        }
        this.saveScheduledMessages();
    }

    // Weather alert functionality
    async sendWeatherAlert(bookingData, weatherInfo) {
        if (weatherInfo.precipitation > 50) { // If >50% chance of rain
            const message = this.formatMessage('weatherAlert', bookingData);
            await this.sendSMS(bookingData.phone_number, message, bookingData.id);
        }
    }

    // Special offer functionality
    async sendSpecialOffer(customerData, offerType = 'return') {
        const message = this.formatMessage('specialOffer', customerData);
        await this.sendSMS(customerData.phone_number, message);
    }

    getTwilioNumber() {
        // Get configured Twilio number
        return '+15551234567'; // Would be configured in Twilio settings
    }

    getRestaurantName() {
        if (window.localConversationEngine?.knowledgeBase?.restaurant?.name) {
            return window.localConversationEngine.knowledgeBase.restaurant.name;
        }
        return "our restaurant";
    }

    createSMSInterface() {
        const container = document.createElement('div');
        container.id = 'sms-manager';
        container.className = 'sms-manager-container';
        container.innerHTML = `
            <div class="sms-manager-header">
                <h3>📱 SMS Manager</h3>
                <button class="sms-minimize-btn" onclick="this.closest('.sms-manager-container').classList.toggle('minimized')">−</button>
            </div>
            <div class="sms-manager-body">
                <div class="sms-toggle">
                    <label>
                        <input type="checkbox" id="sms-enabled" ${this.enabled ? 'checked' : ''}>
                        Enable SMS Confirmations
                    </label>
                </div>
                
                <div class="sms-stats">
                    <div class="stat-row">
                        <span>Confirmations Sent:</span>
                        <span id="confirmations-count">${this.messageStats.confirmationsSent}</span>
                    </div>
                    <div class="stat-row">
                        <span>Reminders Sent:</span>
                        <span id="reminders-count">${this.messageStats.remindersSent}</span>
                    </div>
                    <div class="stat-row">
                        <span>Follow-ups Sent:</span>
                        <span id="followups-count">${this.messageStats.followUpsSent}</span>
                    </div>
                    <div class="stat-row">
                        <span>Scheduled Messages:</span>
                        <span id="scheduled-count">${this.getScheduledCount()}</span>
                    </div>
                </div>
                
                <div class="sms-settings">
                    <h4>Settings</h4>
                    <label>
                        Reminder advance (hours):
                        <input type="number" id="reminder-advance" value="${this.reminderAdvance}" min="1" max="72">
                    </label>
                    <label>
                        Follow-up delay (hours):
                        <input type="number" id="followup-delay" value="${this.followUpDelay}" min="0.5" max="48" step="0.5">
                    </label>
                </div>
                
                <div class="test-sms">
                    <h4>Test SMS</h4>
                    <input type="tel" id="test-phone" placeholder="Phone number">
                    <select id="test-template">
                        <option value="confirmation">Confirmation</option>
                        <option value="reminder">Reminder</option>
                        <option value="followUp">Follow-up</option>
                    </select>
                    <button onclick="smsSystem.sendTestSMS()" class="btn btn-sm">Send Test</button>
                </div>
            </div>
        `;

        document.body.appendChild(container);
        this.smsInterface = container;
        this.setupSMSEventListeners();
        
        // Update interface periodically
        setInterval(() => this.updateSMSInterface(), 30000);
    }

    setupSMSEventListeners() {
        const smsToggle = this.smsInterface.querySelector('#sms-enabled');
        smsToggle.addEventListener('change', (e) => {
            this.enabled = e.target.checked;
            this.saveSMSSettings();
        });

        const reminderAdvance = this.smsInterface.querySelector('#reminder-advance');
        reminderAdvance.addEventListener('change', (e) => {
            this.reminderAdvance = parseInt(e.target.value);
            this.saveSMSSettings();
        });

        const followupDelay = this.smsInterface.querySelector('#followup-delay');
        followupDelay.addEventListener('change', (e) => {
            this.followUpDelay = parseFloat(e.target.value);
            this.saveSMSSettings();
        });
    }

    async sendTestSMS() {
        const phone = this.smsInterface.querySelector('#test-phone').value;
        const template = this.smsInterface.querySelector('#test-template').value;

        if (!phone) {
            alert('Please enter a phone number');
            return;
        }

        try {
            const testData = {
                customer_name: 'John Doe',
                phone_number: phone,
                party_size: 4,
                date: new Date().toISOString().split('T')[0],
                start_time: '19:00',
                restaurant_name: this.getRestaurantName()
            };

            const message = this.formatMessage(template, testData);
            await this.sendSMS(phone, message);
            
            alert('Test SMS sent successfully!');
        } catch (error) {
            alert(`Failed to send test SMS: ${error.message}`);
        }
    }

    getScheduledCount() {
        return Array.from(this.scheduledMessages.values())
            .filter(msg => msg.status === 'scheduled').length;
    }

    updateSMSInterface() {
        if (!this.smsInterface) return;

        this.smsInterface.querySelector('#confirmations-count').textContent = this.messageStats.confirmationsSent;
        this.smsInterface.querySelector('#reminders-count').textContent = this.messageStats.remindersSent;
        this.smsInterface.querySelector('#followups-count').textContent = this.messageStats.followUpsSent;
        this.smsInterface.querySelector('#scheduled-count').textContent = this.getScheduledCount();
    }

    saveScheduledMessages() {
        const data = Array.from(this.scheduledMessages.entries());
        localStorage.setItem('sms-scheduled-messages', JSON.stringify(data));
    }

    loadScheduledMessages() {
        try {
            const data = localStorage.getItem('sms-scheduled-messages');
            if (data) {
                const entries = JSON.parse(data);
                this.scheduledMessages = new Map(entries.map(([id, msg]) => [
                    id, 
                    { ...msg, scheduledFor: new Date(msg.scheduledFor) }
                ]));
            }
        } catch (error) {
            console.warn('Failed to load scheduled messages:', error);
        }
    }

    saveMessageHistory() {
        // Keep only last 100 messages
        if (this.sentMessages.length > 100) {
            this.sentMessages = this.sentMessages.slice(-100);
        }
        localStorage.setItem('sms-message-history', JSON.stringify(this.sentMessages));
    }

    saveSMSSettings() {
        const settings = {
            enabled: this.enabled,
            reminderAdvance: this.reminderAdvance,
            followUpDelay: this.followUpDelay,
            messageStats: this.messageStats
        };
        localStorage.setItem('sms-settings', JSON.stringify(settings));
    }

    loadSMSSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('sms-settings') || '{}');
            this.enabled = settings.enabled !== false;
            this.reminderAdvance = settings.reminderAdvance || 24;
            this.followUpDelay = settings.followUpDelay || 2;
            this.messageStats = { ...this.messageStats, ...settings.messageStats };
        } catch (error) {
            console.warn('Failed to load SMS settings:', error);
        }
    }

    getSMSStats() {
        return {
            ...this.messageStats,
            scheduledMessages: this.getScheduledCount(),
            totalSent: this.sentMessages.length,
            enabled: this.enabled,
            twilioEnabled: this.twilioIntegration?.enabled || false
        };
    }
}

// Initialize SMS system
let smsSystem;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        smsSystem = new SMSConfirmationSystem();
    });
} else {
    smsSystem = new SMSConfirmationSystem();
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SMSConfirmationSystem;
}