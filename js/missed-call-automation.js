/**
 * Missed Call Automation - Automatic callback system and SMS notifications
 * Ensures no potential customers are lost due to missed calls
 */

class MissedCallAutomation {
  constructor() {
    console.log('📞 Initializing Missed Call Automation System...');
    
    this.config = {
      autoCallbackEnabled: true,
      smsNotificationEnabled: true,
      maxCallbackAttempts: 3,
      callbackDelayMinutes: 5,
      smsDelayMinutes: 2,
      businessHours: {
        start: '08:00',
        end: '22:00'
      },
      priorityNumbers: new Set(), // VIP customers get immediate callbacks
      blacklistedNumbers: new Set() // Numbers to avoid calling back
    };
    
    this.missedCalls = [];
    this.callbackQueue = [];
    this.callbackTimer = null;
    this.isProcessing = false;
    
    this.initializeStorage();
    this.setupEventListeners();
    this.createInterface();
    this.startAutomation();
    
    console.log('✅ Missed Call Automation System initialized');
  }
  
  initializeStorage() {
    // Load existing missed call data
    const stored = localStorage.getItem('missed_call_data');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        this.missedCalls = data.missedCalls || [];
        this.callbackQueue = data.callbackQueue || [];
        this.config = { ...this.config, ...data.config };
        console.log('📥 Loaded missed call data');
      } catch (e) {
        console.warn('Failed to load missed call data:', e);
      }
    }
  }
  
  setupEventListeners() {
    // Listen for missed call events
    document.addEventListener('callMissed', (e) => this.handleMissedCall(e.detail));
    document.addEventListener('callEnded', (e) => this.handleCallEnded(e.detail));
    document.addEventListener('callAbandoned', (e) => this.handleCallAbandoned(e.detail));
    
    // Listen for callback results
    document.addEventListener('callbackCompleted', (e) => this.handleCallbackResult(e.detail));
    document.addEventListener('callbackFailed', (e) => this.handleCallbackFailed(e.detail));
    
    // Periodic data save
    setInterval(() => this.saveData(), 60000); // Save every minute
  }
  
  handleMissedCall(callData) {
    console.log('❌ Missed call detected:', callData);
    
    const phoneNumber = callData.phoneNumber || callData.from || callData.number;
    if (!phoneNumber || this.config.blacklistedNumbers.has(phoneNumber)) {
      console.log('📞 Skipping callback for blacklisted/invalid number:', phoneNumber);
      return;
    }
    
    const missedCall = {
      id: `missed_${Date.now()}`,
      phoneNumber: phoneNumber,
      timestamp: new Date().toISOString(),
      customerName: callData.customerName || null,
      callDuration: callData.duration || 0,
      reason: callData.reason || 'unanswered',
      priority: this.config.priorityNumbers.has(phoneNumber) ? 'high' : 'normal',
      attempts: 0,
      status: 'pending',
      smsNotificationSent: false,
      callbackScheduled: false
    };
    
    this.missedCalls.push(missedCall);
    this.scheduleCallback(missedCall);
    
    // Update UI
    this.updateMissedCallsList();
    
    // Emit analytics event
    const analyticsEvent = new CustomEvent('callMissed', {
      detail: missedCall
    });
    document.dispatchEvent(analyticsEvent);
    
    // Log the event
    if (window.legacyFeatures) {
      window.legacyFeatures.addLog({
        type: 'warning',
        source: 'Missed Call Automation',
        text: `Missed call from ${phoneNumber} - Callback scheduled`
      });
    }
  }
  
  handleCallAbandoned(callData) {
    console.log('🚫 Call abandoned:', callData);
    
    // Treat abandoned calls as missed calls if they were in queue
    if (callData.waitTime && callData.waitTime > 30) { // 30+ seconds wait
      this.handleMissedCall({
        ...callData,
        reason: 'abandoned_after_wait'
      });
    }
  }
  
  scheduleCallback(missedCall) {
    const now = new Date();
    const delayMs = this.config.callbackDelayMinutes * 60 * 1000;
    
    // Priority calls get immediate callback during business hours
    const immediateCallback = missedCall.priority === 'high' && this.isBusinessHours();
    
    const callbackTime = new Date(now.getTime() + (immediateCallback ? 30000 : delayMs));
    
    const callbackItem = {
      missedCallId: missedCall.id,
      scheduledTime: callbackTime.toISOString(),
      attempts: 0,
      status: 'scheduled'
    };
    
    this.callbackQueue.push(callbackItem);
    missedCall.callbackScheduled = true;
    
    // Schedule SMS notification first
    this.scheduleSMSNotification(missedCall);
    
    console.log(`📅 Callback scheduled for ${callbackTime.toLocaleString()}`);
  }
  
  scheduleSMSNotification(missedCall) {
    if (!this.config.smsNotificationEnabled) return;
    
    setTimeout(() => {
      this.sendMissedCallSMS(missedCall);
    }, this.config.smsDelayMinutes * 60 * 1000);
  }
  
  async sendMissedCallSMS(missedCall) {
    try {
      const smsTemplate = this.getMissedCallSMSTemplate(missedCall);
      
      // Use existing SMS system if available
      if (window.restaurantSMS && window.restaurantSMS.sendMessage) {
        const result = await window.restaurantSMS.sendMessage(
          missedCall.phoneNumber,
          smsTemplate.message,
          'missed_call_notification'
        );
        
        if (result.success) {
          missedCall.smsNotificationSent = true;
          console.log('📱 SMS notification sent successfully');
          
          // Log the SMS
          if (window.legacyFeatures) {
            window.legacyFeatures.addLog({
              type: 'success',
              source: 'Missed Call SMS',
              text: `SMS sent to ${missedCall.phoneNumber}`
            });
          }
        }
      } else {
        console.log('📱 SMS system not available, simulating SMS send');
        missedCall.smsNotificationSent = true;
      }
    } catch (error) {
      console.error('Failed to send missed call SMS:', error);
    }
  }
  
  getMissedCallSMSTemplate(missedCall) {
    const restaurantName = 'Bella Vista Restaurant'; // Could be dynamic
    const time = new Date(missedCall.timestamp).toLocaleTimeString();
    
    let message;
    
    if (missedCall.reason === 'abandoned_after_wait') {
      message = `Hi! We noticed you called ${restaurantName} at ${time} but had to hang up while waiting. We're calling you back shortly to assist you! 🍽️`;
    } else {
      message = `Hi! You called ${restaurantName} at ${time} but we missed your call. We're calling you back in a few minutes to help with your reservation! 📞`;
    }
    
    return {
      message: message,
      type: 'missed_call_notification'
    };
  }
  
  startAutomation() {
    // Process callback queue every minute
    this.callbackTimer = setInterval(() => {
      this.processCallbackQueue();
    }, 60000);
    
    // Initial process
    this.processCallbackQueue();
  }
  
  processCallbackQueue() {
    if (this.isProcessing || this.callbackQueue.length === 0) return;
    
    this.isProcessing = true;
    const now = new Date();
    
    const dueCallbacks = this.callbackQueue.filter(item => 
      new Date(item.scheduledTime) <= now && item.status === 'scheduled'
    );
    
    dueCallbacks.forEach(callback => {
      this.initiateCallback(callback);
    });
    
    this.isProcessing = false;
  }
  
  async initiateCallback(callbackItem) {
    const missedCall = this.missedCalls.find(call => call.id === callbackItem.missedCallId);
    if (!missedCall) return;
    
    console.log(`☎️ Initiating callback to ${missedCall.phoneNumber}`);
    
    callbackItem.status = 'in_progress';
    callbackItem.attempts++;
    missedCall.attempts++;
    
    try {
      // Check if outside business hours
      if (!this.isBusinessHours() && missedCall.priority !== 'high') {
        console.log('⏰ Outside business hours, rescheduling callback');
        this.rescheduleCallback(callbackItem);
        return;
      }
      
      // Simulate callback (in real system, would integrate with telephony)
      const callResult = await this.makeCallback(missedCall);
      
      if (callResult.success) {
        this.handleCallbackSuccess(callbackItem, missedCall, callResult);
      } else {
        this.handleCallbackFailure(callbackItem, missedCall, callResult);
      }
    } catch (error) {
      console.error('Callback failed:', error);
      this.handleCallbackFailure(callbackItem, missedCall, { error: error.message });
    }
  }
  
  async makeCallback(missedCall) {
    // Simulate callback process (replace with actual telephony integration)
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate different outcomes
        const outcomes = [
          { success: true, connected: true, duration: 120 },
          { success: true, connected: false, reason: 'no_answer' },
          { success: true, connected: false, reason: 'busy' },
          { success: false, reason: 'network_error' }
        ];
        
        const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
        resolve(outcome);
      }, 2000); // Simulate call attempt time
    });
  }
  
  handleCallbackSuccess(callbackItem, missedCall, result) {
    callbackItem.status = 'completed';
    missedCall.status = result.connected ? 'resolved' : 'no_answer';
    
    if (result.connected) {
      console.log('✅ Callback successful - customer connected');
      
      // Log success
      if (window.legacyFeatures) {
        window.legacyFeatures.addLog({
          type: 'success',
          source: 'Callback System',
          text: `Successful callback to ${missedCall.phoneNumber}`
        });
      }
    } else {
      console.log('📞 Callback attempted but no answer');
      
      // Schedule another attempt if within limits
      if (missedCall.attempts < this.config.maxCallbackAttempts) {
        this.scheduleRetryCallback(callbackItem, missedCall);
      } else {
        missedCall.status = 'max_attempts_reached';
        this.sendFinalSMS(missedCall);
      }
    }
    
    this.updateMissedCallsList();
  }
  
  handleCallbackFailure(callbackItem, missedCall, result) {
    console.log('❌ Callback failed:', result.reason || result.error);
    
    callbackItem.status = 'failed';
    
    if (missedCall.attempts < this.config.maxCallbackAttempts) {
      this.scheduleRetryCallback(callbackItem, missedCall);
    } else {
      missedCall.status = 'failed';
      this.sendFinalSMS(missedCall);
    }
    
    this.updateMissedCallsList();
  }
  
  scheduleRetryCallback(callbackItem, missedCall) {
    const delayMinutes = 15 * missedCall.attempts; // Exponential backoff
    const retryTime = new Date(Date.now() + delayMinutes * 60 * 1000);
    
    const retryCallback = {
      missedCallId: missedCall.id,
      scheduledTime: retryTime.toISOString(),
      attempts: 0,
      status: 'scheduled'
    };
    
    this.callbackQueue.push(retryCallback);
    console.log(`🔄 Retry scheduled for ${retryTime.toLocaleString()}`);
  }
  
  async sendFinalSMS(missedCall) {
    const message = `Hi! We tried calling you back several times but couldn't reach you. Please call us at your convenience or visit our website to make a reservation. Thanks! 🍽️`;
    
    if (window.restaurantSMS && window.restaurantSMS.sendMessage) {
      try {
        await window.restaurantSMS.sendMessage(
          missedCall.phoneNumber,
          message,
          'final_callback_notification'
        );
        console.log('📱 Final SMS notification sent');
      } catch (error) {
        console.error('Failed to send final SMS:', error);
      }
    }
  }
  
  isBusinessHours() {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    return currentTime >= this.config.businessHours.start && 
           currentTime <= this.config.businessHours.end;
  }
  
  rescheduleCallback(callbackItem) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 30, 0, 0); // 8:30 AM next day
    
    callbackItem.scheduledTime = tomorrow.toISOString();
    callbackItem.status = 'scheduled';
    
    console.log(`📅 Callback rescheduled to ${tomorrow.toLocaleString()}`);
  }
  
  createInterface() {
    // Create missed call management panel
    const panel = document.createElement('div');
    panel.id = 'missed-call-panel';
    panel.className = 'missed-call-panel';
    panel.innerHTML = `
      <div class="missed-call-header">
        <h3>📞 Missed Call Automation</h3>
        <div class="missed-call-controls">
          <button id="test-missed-call">Test Missed Call</button>
          <button id="toggle-automation" class="${this.config.autoCallbackEnabled ? 'enabled' : 'disabled'}">
            ${this.config.autoCallbackEnabled ? 'Disable' : 'Enable'} Auto-Callback
          </button>
          <button id="toggle-missed-calls">−</button>
        </div>
      </div>
      
      <div class="missed-call-content">
        <div class="missed-call-stats">
          <div class="stat-item">
            <span class="stat-label">Today's Missed:</span>
            <span class="stat-value" id="todays-missed">0</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Successful Callbacks:</span>
            <span class="stat-value" id="successful-callbacks">0</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Pending Callbacks:</span>
            <span class="stat-value" id="pending-callbacks">0</span>
          </div>
        </div>
        
        <div class="missed-calls-section">
          <h4>📋 Recent Missed Calls</h4>
          <div id="missed-calls-list" class="missed-calls-list">
            <div class="no-missed-calls">No missed calls today 🎉</div>
          </div>
        </div>
        
        <div class="callback-queue-section">
          <h4>⏰ Callback Queue</h4>
          <div id="callback-queue-list" class="callback-queue-list">
            <div class="no-callbacks">No callbacks scheduled</div>
          </div>
        </div>
        
        <div class="automation-settings">
          <h4>⚙️ Automation Settings</h4>
          <div class="settings-grid">
            <label>
              Callback Delay (minutes):
              <input type="number" id="callback-delay" value="${this.config.callbackDelayMinutes}" min="1" max="60">
            </label>
            <label>
              Max Attempts:
              <input type="number" id="max-attempts" value="${this.config.maxCallbackAttempts}" min="1" max="5">
            </label>
            <label>
              SMS Notifications:
              <input type="checkbox" id="sms-notifications" ${this.config.smsNotificationEnabled ? 'checked' : ''}>
            </label>
          </div>
        </div>
      </div>
    `;
    
    // Add to telephony controls
    const telephonyControls = document.getElementById('telephony-controls');
    if (telephonyControls) {
      telephonyControls.appendChild(panel);
    } else {
      document.body.appendChild(panel);
    }
    
    this.setupInterfaceHandlers();
    this.updateMissedCallsList();
  }
  
  setupInterfaceHandlers() {
    // Toggle panel
    document.getElementById('toggle-missed-calls')?.addEventListener('click', () => {
      const content = document.querySelector('.missed-call-content');
      const button = document.getElementById('toggle-missed-calls');
      if (content.style.display === 'none') {
        content.style.display = 'block';
        button.textContent = '−';
      } else {
        content.style.display = 'none';
        button.textContent = '+';
      }
    });
    
    // Toggle automation
    document.getElementById('toggle-automation')?.addEventListener('click', () => {
      this.config.autoCallbackEnabled = !this.config.autoCallbackEnabled;
      const button = document.getElementById('toggle-automation');
      button.textContent = this.config.autoCallbackEnabled ? 'Disable Auto-Callback' : 'Enable Auto-Callback';
      button.className = this.config.autoCallbackEnabled ? 'enabled' : 'disabled';
    });
    
    // Test missed call
    document.getElementById('test-missed-call')?.addEventListener('click', () => {
      this.testMissedCall();
    });
    
    // Settings handlers
    document.getElementById('callback-delay')?.addEventListener('change', (e) => {
      this.config.callbackDelayMinutes = parseInt(e.target.value);
    });
    
    document.getElementById('max-attempts')?.addEventListener('change', (e) => {
      this.config.maxCallbackAttempts = parseInt(e.target.value);
    });
    
    document.getElementById('sms-notifications')?.addEventListener('change', (e) => {
      this.config.smsNotificationEnabled = e.target.checked;
    });
  }
  
  testMissedCall() {
    const testCall = {
      phoneNumber: '+1234567890',
      customerName: 'Test Customer',
      duration: 15,
      reason: 'test_missed_call',
      timestamp: new Date().toISOString()
    };
    
    this.handleMissedCall(testCall);
    console.log('🧪 Test missed call simulated');
  }
  
  updateMissedCallsList() {
    // Update stats
    const today = new Date().toDateString();
    const todaysMissed = this.missedCalls.filter(call => 
      new Date(call.timestamp).toDateString() === today
    ).length;
    
    const successfulCallbacks = this.missedCalls.filter(call => 
      call.status === 'resolved'
    ).length;
    
    const pendingCallbacks = this.callbackQueue.filter(item => 
      item.status === 'scheduled'
    ).length;
    
    document.getElementById('todays-missed').textContent = todaysMissed;
    document.getElementById('successful-callbacks').textContent = successfulCallbacks;
    document.getElementById('pending-callbacks').textContent = pendingCallbacks;
    
    // Update missed calls list
    const missedCallsList = document.getElementById('missed-calls-list');
    if (this.missedCalls.length === 0) {
      missedCallsList.innerHTML = '<div class="no-missed-calls">No missed calls today 🎉</div>';
    } else {
      const recentCalls = this.missedCalls.slice(-10).reverse();
      missedCallsList.innerHTML = recentCalls.map(call => {
        const time = new Date(call.timestamp).toLocaleTimeString();
        const statusIcon = this.getStatusIcon(call.status);
        return `
          <div class="missed-call-item ${call.status}">
            <div class="call-info">
              <div class="phone-number">${call.phoneNumber}</div>
              <div class="call-time">${time}</div>
            </div>
            <div class="call-status">
              ${statusIcon} ${call.status.replace('_', ' ')}
            </div>
            <div class="call-attempts">${call.attempts}/${this.config.maxCallbackAttempts}</div>
          </div>
        `;
      }).join('');
    }
    
    // Update callback queue
    const queueList = document.getElementById('callback-queue-list');
    if (this.callbackQueue.length === 0) {
      queueList.innerHTML = '<div class="no-callbacks">No callbacks scheduled</div>';
    } else {
      const activeCallbacks = this.callbackQueue.filter(item => 
        item.status === 'scheduled' || item.status === 'in_progress'
      );
      
      queueList.innerHTML = activeCallbacks.map(callback => {
        const missedCall = this.missedCalls.find(call => call.id === callback.missedCallId);
        const scheduledTime = new Date(callback.scheduledTime).toLocaleString();
        return `
          <div class="callback-item ${callback.status}">
            <div class="callback-phone">${missedCall?.phoneNumber || 'Unknown'}</div>
            <div class="callback-time">${scheduledTime}</div>
            <div class="callback-status">${callback.status}</div>
          </div>
        `;
      }).join('');
    }
  }
  
  getStatusIcon(status) {
    switch (status) {
      case 'pending': return '⏳';
      case 'resolved': return '✅';
      case 'no_answer': return '📞';
      case 'failed': return '❌';
      case 'max_attempts_reached': return '🚫';
      default: return '📋';
    }
  }
  
  saveData() {
    try {
      const data = {
        missedCalls: this.missedCalls,
        callbackQueue: this.callbackQueue,
        config: this.config
      };
      localStorage.setItem('missed_call_data', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save missed call data:', error);
    }
  }
  
  destroy() {
    if (this.callbackTimer) {
      clearInterval(this.callbackTimer);
    }
    
    const panel = document.getElementById('missed-call-panel');
    if (panel) {
      panel.remove();
    }
    
    console.log('🗑️ Missed call automation destroyed');
  }
}

// Initialize missed call automation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  if (!window.missedCallAutomation) {
    window.missedCallAutomation = new MissedCallAutomation();
  }
});

// Add to window for global access
window.MissedCallAutomation = MissedCallAutomation;