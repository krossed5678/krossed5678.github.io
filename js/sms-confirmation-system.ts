// Converted from sms-confirmation-system.js — inlined TypeScript implementation
// @ts-nocheck

class SMSConfirmationSystem {
	enabled: boolean;
	twilioIntegration: any;
	confirmationDelay: number;
	reminderAdvance: number;
	followUpDelay: number;
	templates: any;
	scheduledMessages: Map<string, any>;
	sentMessages: any[];
	messageStats: any;

	constructor(options: any = {}) {
		this.enabled = options.enabled !== false;
		this.twilioIntegration = null;
		this.confirmationDelay = options.confirmationDelay || 5000;
		this.reminderAdvance = options.reminderAdvance || 24;
		this.followUpDelay = options.followUpDelay || 2;
		this.templates = { confirmation: "Hi {name}! Your reservation at {restaurant} is confirmed for {date} at {time} for {party} guests. Reply CANCEL to cancel. Thanks!", reminder: "Reminder: You have a reservation today at {restaurant} at {time} for {party} guests. Reply CONFIRM to confirm or CANCEL to cancel.", followUp: "Hi {name}! Hope you enjoyed your visit to {restaurant}! Please rate your experience: Reply 1-5 (5=excellent). Thanks!", cancellation: "Your reservation at {restaurant} for {date} at {time} has been cancelled. We hope to see you soon!", modification: "Your reservation at {restaurant} has been updated: {date} at {time} for {party} guests. Reply CANCEL if needed.", weatherAlert: "Weather Alert: Rain expected during your reservation time at {restaurant}. We have covered seating available. See you at {time}!", specialOffer: "Hi {name}! Thanks for dining with us. Enjoy 10% off your next visit with code RETURN10. Valid for 30 days. Book online or call us!" };
		this.scheduledMessages = new Map(); this.sentMessages = []; this.messageStats = { confirmationsSent: 0, remindersSent: 0, followUpsSent: 0, responses: 0, cancellationsViaSMS: 0 };
		this.initializeSystem();
	}

	async initializeSystem() {
		try { await this.waitForTwilio(); this.startMessageProcessor(); this.setupBookingListeners(); this.loadScheduledMessages(); this.createSMSInterface(); console.log('SMS Confirmation System initialized'); } catch (e) { console.error('Failed to initialize SMS system:', e); this.enabled = false; }
	}

	waitForTwilio() { return new Promise((resolve, reject) => { const check = () => { if ((window as any).twilioIntegration) { this.twilioIntegration = (window as any).twilioIntegration; resolve(); } else setTimeout(check, 100); }; check(); setTimeout(() => reject(new Error('Twilio integration not available')), 10000); }); }

	setupBookingListeners() { document.addEventListener('bookingCreated', (e: any) => { if (this.enabled && this.twilioIntegration?.enabled) this.handleNewBooking(e.detail); }); document.addEventListener('bookingModified', (e: any) => { if (this.enabled && this.twilioIntegration?.enabled) this.handleBookingModification(e.detail); }); document.addEventListener('bookingCancelled', (e: any) => { if (this.enabled && this.twilioIntegration?.enabled) this.handleBookingCancellation(e.detail); }); }

	async handleNewBooking(bookingData: any) { try { await this.scheduleConfirmationSMS(bookingData); await this.scheduleReminderSMS(bookingData); await this.scheduleFollowUpSMS(bookingData); } catch (e) { console.error('Failed to process SMS for booking:', e); } }

	async scheduleConfirmationSMS(bookingData: any) { const message = this.formatMessage('confirmation', bookingData); const scheduledMessage = { id: `conf-${bookingData.id}`, bookingId: bookingData.id, type: 'confirmation', to: bookingData.phone_number, message, scheduledFor: new Date(Date.now() + this.confirmationDelay), status: 'scheduled' }; this.scheduledMessages.set(scheduledMessage.id, scheduledMessage); this.saveScheduledMessages(); }

	async scheduleReminderSMS(bookingData: any) { const reservationDateTime = new Date(`${bookingData.date}T${bookingData.start_time}`); const reminderTime = new Date(reservationDateTime.getTime() - (this.reminderAdvance * 60 * 60 * 1000)); if (reminderTime > new Date()) { const message = this.formatMessage('reminder', bookingData); const scheduledMessage = { id: `remind-${bookingData.id}`, bookingId: bookingData.id, type: 'reminder', to: bookingData.phone_number, message, scheduledFor: reminderTime, status: 'scheduled' }; this.scheduledMessages.set(scheduledMessage.id, scheduledMessage); this.saveScheduledMessages(); } }

	async scheduleFollowUpSMS(bookingData: any) { const reservationDateTime = new Date(`${bookingData.date}T${bookingData.start_time}`); const followUpTime = new Date(reservationDateTime.getTime() + (this.followUpDelay * 60 * 60 * 1000)); const message = this.formatMessage('followUp', bookingData); const scheduledMessage = { id: `followup-${bookingData.id}`, bookingId: bookingData.id, type: 'followUp', to: bookingData.phone_number, message, scheduledFor: followUpTime, status: 'scheduled' }; this.scheduledMessages.set(scheduledMessage.id, scheduledMessage); this.saveScheduledMessages(); }

	formatMessage(templateKey: string, bookingData: any) { let template = this.templates[templateKey]; const formatDate = (date: any) => new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); const formatTime = (time: string) => { const [hours, minutes] = time.split(':'); const hour = parseInt(hours); const ampm = hour >= 12 ? 'PM' : 'AM'; const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour; return `${displayHour}:${minutes} ${ampm}`; }; return template.replace(/{name}/g, bookingData.customer_name).replace(/{restaurant}/g, bookingData.restaurant_name || this.getRestaurantName()).replace(/{date}/g, formatDate(bookingData.date)).replace(/{time}/g, formatTime(bookingData.start_time)).replace(/{party}/g, bookingData.party_size); }

	async sendSMS(to: string, message: string, bookingId: string | null = null) { if (!this.twilioIntegration?.enabled) throw new Error('Twilio integration not enabled'); try { const result = await this.twilioIntegration.sendSMS(to, message, { fromNumber: this.getTwilioNumber() }); const sentMessage = { id: result.messageId, bookingId, to, message, sentAt: new Date(), provider: 'twilio', status: 'sent' }; this.sentMessages.push(sentMessage); this.saveMessageHistory(); return result; } catch (error) { console.error('Failed to send SMS:', error); throw error; } }

	startMessageProcessor() { setInterval(() => this.processScheduledMessages(), 60000); this.processScheduledMessages(); }

	async processScheduledMessages() { const now = new Date(); for (const [messageId, scheduledMessage] of this.scheduledMessages) { if (scheduledMessage.status === 'scheduled' && scheduledMessage.scheduledFor <= now) { try { await this.sendSMS(scheduledMessage.to, scheduledMessage.message, scheduledMessage.bookingId); scheduledMessage.status = 'sent'; scheduledMessage.sentAt = new Date(); switch (scheduledMessage.type) { case 'confirmation': this.messageStats.confirmationsSent++; break; case 'reminder': this.messageStats.remindersSent++; break; case 'followUp': this.messageStats.followUpsSent++; break; } console.log(`Sent ${scheduledMessage.type} SMS for booking ${scheduledMessage.bookingId}`); } catch (error) { console.error(`Failed to send scheduled SMS ${messageId}:`, error); scheduledMessage.status = 'failed'; scheduledMessage.error = (error as any).message; } this.saveScheduledMessages(); } } }

	handleBookingModification(bookingData: any) { this.cancelScheduledMessages(bookingData.id); const message = this.formatMessage('modification', bookingData); this.sendSMS(bookingData.phone_number, message, bookingData.id); this.handleNewBooking(bookingData); }

	handleBookingCancellation(bookingData: any) { this.cancelScheduledMessages(bookingData.id); const message = this.formatMessage('cancellation', bookingData); this.sendSMS(bookingData.phone_number, message, bookingData.id); }

	cancelScheduledMessages(bookingId: any) { for (const [messageId, scheduledMessage] of this.scheduledMessages) { if (scheduledMessage.bookingId === bookingId && scheduledMessage.status === 'scheduled') scheduledMessage.status = 'cancelled'; } this.saveScheduledMessages(); }

	async sendWeatherAlert(bookingData: any, weatherInfo: any) { if (weatherInfo.precipitation > 50) { const message = this.formatMessage('weatherAlert', bookingData); await this.sendSMS(bookingData.phone_number, message, bookingData.id); } }

	async sendSpecialOffer(customerData: any, offerType = 'return') { const message = this.formatMessage('specialOffer', customerData); await this.sendSMS(customerData.phone_number, message); }

	getTwilioNumber() { return '+15551234567'; }
	getRestaurantName() { return (window as any).localConversationEngine?.knowledgeBase?.restaurant?.name || 'our restaurant'; }

	createSMSInterface() { const container = document.createElement('div'); container.id = 'sms-manager'; container.className = 'sms-manager-container'; container.innerHTML = `<div class="sms-manager-header"><h3>📱 SMS Manager</h3><button class="sms-minimize-btn" onclick="this.closest('.sms-manager-container').classList.toggle('minimized')">−</button></div><div class="sms-manager-body">...</div>`; document.body.appendChild(container); this.smsInterface = container as any; this.setupSMSEventListeners(); setInterval(() => this.updateSMSInterface(), 30000); }

	setupSMSEventListeners() { const smsToggle = (this as any).smsInterface.querySelector('#sms-enabled'); smsToggle?.addEventListener('change', (e: any) => { this.enabled = e.target.checked; this.saveSMSSettings(); }); const reminderAdvance = (this as any).smsInterface.querySelector('#reminder-advance'); reminderAdvance?.addEventListener('change', (e: any) => { this.reminderAdvance = parseInt(e.target.value); this.saveSMSSettings(); }); const followupDelay = (this as any).smsInterface.querySelector('#followup-delay'); followupDelay?.addEventListener('change', (e: any) => { this.followUpDelay = parseFloat(e.target.value); this.saveSMSSettings(); }); }

	async sendTestSMS() { const phone = (this as any).smsInterface.querySelector('#test-phone').value; const template = (this as any).smsInterface.querySelector('#test-template').value; if (!phone) { alert('Please enter a phone number'); return; } try { const testData = { customer_name: 'John Doe', phone_number: phone, party_size: 4, date: new Date().toISOString().split('T')[0], start_time: '19:00', restaurant_name: this.getRestaurantName() }; const message = this.formatMessage(template, testData); await this.sendSMS(phone, message); alert('Test SMS sent successfully!'); } catch (error) { alert(`Failed to send test SMS: ${(error as any).message}`); } }

	getScheduledCount() { return Array.from(this.scheduledMessages.values()).filter((msg:any) => msg.status === 'scheduled').length; }

	updateSMSInterface() { if (!(this as any).smsInterface) return; (this as any).smsInterface.querySelector('#confirmations-count').textContent = this.messageStats.confirmationsSent; (this as any).smsInterface.querySelector('#reminders-count').textContent = this.messageStats.remindersSent; (this as any).smsInterface.querySelector('#followups-count').textContent = this.messageStats.followUpsSent; (this as any).smsInterface.querySelector('#scheduled-count').textContent = this.getScheduledCount(); }

	saveScheduledMessages() { const data = Array.from(this.scheduledMessages.entries()); localStorage.setItem('sms-scheduled-messages', JSON.stringify(data)); }

	loadScheduledMessages() { try { const data = localStorage.getItem('sms-scheduled-messages'); if (data) { const entries = JSON.parse(data); this.scheduledMessages = new Map(entries.map(([id, msg]: any) => [id, { ...msg, scheduledFor: new Date(msg.scheduledFor) }])); } } catch (error) { console.warn('Failed to load scheduled messages:', error); } }

	saveMessageHistory() { if (this.sentMessages.length > 100) this.sentMessages = this.sentMessages.slice(-100); localStorage.setItem('sms-message-history', JSON.stringify(this.sentMessages)); }

	saveSMSSettings() { const settings = { enabled: this.enabled, reminderAdvance: this.reminderAdvance, followUpDelay: this.followUpDelay, messageStats: this.messageStats }; localStorage.setItem('sms-settings', JSON.stringify(settings)); }

	loadSMSSettings() { try { const settings = JSON.parse(localStorage.getItem('sms-settings') || '{}'); this.enabled = settings.enabled !== false; this.reminderAdvance = settings.reminderAdvance || 24; this.followUpDelay = settings.followUpDelay || 2; this.messageStats = { ...this.messageStats, ...settings.messageStats }; } catch (error) { console.warn('Failed to load SMS settings:', error); } }

	getSMSStats() { return { ...this.messageStats, scheduledMessages: this.getScheduledCount(), totalSent: this.sentMessages.length, enabled: this.enabled, twilioEnabled: this.twilioIntegration?.enabled || false }; }
}

let smsSystem: any;
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { smsSystem = new SMSConfirmationSystem(); }); else smsSystem = new SMSConfirmationSystem();

export {};

