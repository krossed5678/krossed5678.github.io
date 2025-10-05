/**
 * Skills-Based Routing System - Intelligent call routing based on inquiry type and staff availability
 * Routes calls to the most appropriate staff member based on their skills and availability
 */

class SkillsBasedRouting {
  constructor() {
    console.log('🎯 Initializing Skills-Based Routing System...');
    
    this.config = {
      enabled: true,
      fallbackToAI: true,
      maxWaitTimeSeconds: 180, // 3 minutes max wait before fallback
      priorityRouting: true
    };
    
    // Define staff members and their skills
    this.staffMembers = {
      'manager_1': {
        id: 'manager_1',
        name: 'Sarah Chen',
        title: 'Restaurant Manager',
        skills: ['complaints', 'reservations', 'management', 'special_events', 'vip_service'],
        availability: 'available',
        currentCalls: 0,
        maxConcurrentCalls: 2,
        priority: 9
      },
      'reservation_specialist_1': {
        id: 'reservation_specialist_1',
        name: 'Maria Rodriguez',
        title: 'Reservation Specialist',
        skills: ['reservations', 'customer_service', 'special_events'],
        availability: 'available',
        currentCalls: 0,
        maxConcurrentCalls: 3,
        priority: 7
      },
      'host_1': {
        id: 'host_1',
        name: 'James Wilson',
        title: 'Host',
        skills: ['reservations', 'general_inquiries', 'customer_service'],
        availability: 'available',
        currentCalls: 0,
        maxConcurrentCalls: 2,
        priority: 5
      },
      'server_lead': {
        id: 'server_lead',
        name: 'Emily Davis',
        title: 'Lead Server',
        skills: ['orders', 'menu_questions', 'customer_service'],
        availability: 'available',
        currentCalls: 0,
        maxConcurrentCalls: 2,
        priority: 6
      }
    };
    
    // Define inquiry types and their skill requirements
    this.inquiryTypes = {
      'reservation': {
        name: 'Reservation Request',
        requiredSkills: ['reservations'],
        keywords: ['reservation', 'book', 'table', 'party', 'dinner', 'lunch'],
        priority: 'normal'
      },
      'complaint': {
        name: 'Complaint/Issue',
        requiredSkills: ['complaints', 'management'],
        keywords: ['complaint', 'problem', 'issue', 'wrong', 'bad', 'manager'],
        priority: 'high'
      },
      'special_event': {
        name: 'Special Event/Party',
        requiredSkills: ['special_events', 'management'],
        keywords: ['party', 'event', 'celebration', 'birthday', 'anniversary'],
        priority: 'high'
      },
      'menu_question': {
        name: 'Menu Questions',
        requiredSkills: ['menu_questions', 'customer_service'],
        keywords: ['menu', 'food', 'ingredients', 'allergies', 'gluten', 'vegan'],
        priority: 'normal'
      },
      'order': {
        name: 'Takeout Order',
        requiredSkills: ['orders', 'customer_service'],
        keywords: ['order', 'takeout', 'pickup', 'delivery', 'to-go'],
        priority: 'normal'
      },
      'general': {
        name: 'General Inquiry',
        requiredSkills: ['general_inquiries', 'customer_service'],
        keywords: ['hours', 'location', 'directions', 'parking', 'information'],
        priority: 'low'
      }
    };
    
    this.activeRoutes = new Map();
    this.routingQueue = [];
    this.routingStats = {
      totalRouted: 0,
      successfulRoutes: 0,
      failedRoutes: 0,
      routesByType: {},
      routesByStaff: {}
    };
    
    this.initializeStorage();
    this.setupEventListeners();
    this.createInterface();
    this.startRouting();
    
    console.log('✅ Skills-Based Routing System initialized');
  }
  
  initializeStorage() {
    const stored = localStorage.getItem('routing_data');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        this.routingStats = { ...this.routingStats, ...data.stats };
        this.config = { ...this.config, ...data.config };
        console.log('📥 Loaded routing data');
      } catch (e) {
        console.warn('Failed to load routing data:', e);
      }
    }
  }
  
  setupEventListeners() {
    document.addEventListener('callStarted', (e) => this.handleIncomingCall(e.detail));
    document.addEventListener('callEnded', (e) => this.handleCallEnded(e.detail));
    document.addEventListener('staffAvailabilityChanged', (e) => this.updateStaffAvailability(e.detail));
    
    setInterval(() => {
      this.processRoutingQueue();
      this.saveData();
    }, 30000);
  }
  
  handleIncomingCall(callData) {
    console.log('📞 Processing incoming call for routing:', callData);
    
    if (!this.config.enabled) {
      console.log('🚫 Skills-based routing disabled, falling back to AI');
      this.routeToAI(callData);
      return;
    }
    
    const inquiryType = this.analyzeCallIntent(callData);
    const customerPriority = this.determineCustomerPriority(callData);
    
    const routingRequest = {
      id: callData.id || `route_${Date.now()}`,
      callData: callData,
      inquiryType: inquiryType,
      customerPriority: customerPriority,
      timestamp: new Date().toISOString(),
      attempts: 0,
      status: 'pending'
    };
    
    const routeResult = this.findBestStaff(routingRequest);
    
    if (routeResult.success) {
      this.executeRouting(routingRequest, routeResult.staff);
    } else {
      this.routingQueue.push(routingRequest);
      console.log(`⏱️ Call added to routing queue: ${routeResult.reason}`);
      this.notifyCustomerOfWait(callData, routeResult.estimatedWaitTime);
    }
    
    this.updateRoutingDisplay();
  }
  
  analyzeCallIntent(callData) {
    const transcript = callData.transcript || callData.initialMessage || '';
    const lowerTranscript = transcript.toLowerCase();
    
    const scores = {};
    
    Object.entries(this.inquiryTypes).forEach(([type, config]) => {
      let score = 0;
      config.keywords.forEach(keyword => {
        if (lowerTranscript.includes(keyword)) {
          score += 1;
        }
      });
      scores[type] = score / config.keywords.length;
    });
    
    const bestMatch = Object.entries(scores).reduce((best, [type, score]) => 
      score > best.score ? { type, score } : best
    , { type: 'general', score: 0 });
    
    return bestMatch.score >= 0.3 ? bestMatch.type : 'general';
  }
  
  determineCustomerPriority(callData) {
    const phoneNumber = callData.phoneNumber || callData.from;
    
    const vipNumbers = ['+15551234567', '+15559876543'];
    
    if (vipNumbers.includes(phoneNumber)) {
      return 'vip';
    }
    
    if (callData.isReturningCustomer) {
      return 'returning';
    }
    
    return 'normal';
  }
  
  findBestStaff(routingRequest) {
    const { inquiryType } = routingRequest;
    const inquiryConfig = this.inquiryTypes[inquiryType];
    
    const availableStaff = Object.values(this.staffMembers).filter(staff => {
      return this.isStaffAvailable(staff) && 
             this.hasRequiredSkills(staff, inquiryConfig.requiredSkills);
    });
    
    if (availableStaff.length === 0) {
      return {
        success: false,
        reason: 'No available staff with required skills',
        estimatedWaitTime: this.estimateWaitTime(inquiryType)
      };
    }
    
    const rankedStaff = availableStaff.map(staff => ({
      ...staff,
      score: this.calculateStaffScore(staff, routingRequest)
    })).sort((a, b) => b.score - a.score);
    
    return {
      success: true,
      staff: rankedStaff[0],
      alternatives: rankedStaff.slice(1, 3)
    };
  }
  
  isStaffAvailable(staff) {
    if (staff.availability !== 'available') return false;
    return staff.currentCalls < staff.maxConcurrentCalls;
  }
  
  hasRequiredSkills(staff, requiredSkills) {
    return requiredSkills.every(skill => staff.skills.includes(skill));
  }
  
  calculateStaffScore(staff, routingRequest) {
    let score = staff.priority;
    score -= staff.currentCalls * 2;
    
    const inquiryConfig = this.inquiryTypes[routingRequest.inquiryType];
    const skillMatches = inquiryConfig.requiredSkills.filter(skill => 
      staff.skills.includes(skill)
    ).length;
    score += skillMatches * 3;
    
    if (routingRequest.customerPriority === 'vip' && staff.skills.includes('vip_service')) {
      score += 10;
    }
    
    return score;
  }
  
  executeRouting(routingRequest, targetStaff) {
    console.log(`🎯 Routing call to ${targetStaff.name} (${targetStaff.title})`);
    
    targetStaff.currentCalls++;
    
    const route = {
      id: routingRequest.id,
      callId: routingRequest.callData.id,
      staffId: targetStaff.id,
      inquiryType: routingRequest.inquiryType,
      routedAt: new Date().toISOString(),
      status: 'active'
    };
    
    this.activeRoutes.set(routingRequest.id, route);
    routingRequest.status = 'routed';
    
    this.updateRoutingStats(routingRequest, targetStaff, true);
    
    const routingEvent = new CustomEvent('callRouted', {
      detail: {
        callData: routingRequest.callData,
        targetStaff: targetStaff,
        inquiryType: routingRequest.inquiryType,
        route: route
      }
    });
    document.dispatchEvent(routingEvent);
    
    if (window.legacyFeatures) {
      window.legacyFeatures.addLog({
        type: 'info',
        source: 'Skills-Based Routing',
        text: `Call routed to ${targetStaff.name} for ${this.inquiryTypes[routingRequest.inquiryType].name}`
      });
    }
  }
  
  handleCallEnded(callData) {
    const route = Array.from(this.activeRoutes.values()).find(r => 
      r.callId === callData.id
    );
    
    if (route) {
      const staff = this.staffMembers[route.staffId];
      if (staff) {
        staff.currentCalls = Math.max(0, staff.currentCalls - 1);
      }
      
      route.status = 'completed';
      route.endedAt = new Date().toISOString();
      
      this.activeRoutes.delete(route.id);
      
      console.log(`✅ Routing completed: ${staff?.name} handled ${route.inquiryType}`);
    }
    
    this.processRoutingQueue();
    this.updateRoutingDisplay();
  }
  
  processRoutingQueue() {
    if (this.routingQueue.length === 0) return;
    
    console.log(`🔄 Processing routing queue: ${this.routingQueue.length} calls waiting`);
    
    const processedIndices = [];
    
    this.routingQueue.forEach((request, index) => {
      if (request.status === 'routed') {
        processedIndices.push(index);
        return;
      }
      
      const waitTime = (Date.now() - new Date(request.timestamp).getTime()) / 1000;
      
      if (waitTime > this.config.maxWaitTimeSeconds) {
        console.log(`⏰ Call exceeded max wait time, routing to AI`);
        this.routeToAI(request.callData, 'timeout');
        request.status = 'failed_timeout';
        processedIndices.push(index);
        return;
      }
      
      const routeResult = this.findBestStaff(request);
      
      if (routeResult.success) {
        this.executeRouting(request, routeResult.staff);
        processedIndices.push(index);
      }
    });
    
    processedIndices.reverse().forEach(index => {
      this.routingQueue.splice(index, 1);
    });
  }
  
  routeToAI(callData, reason = 'fallback') {
    console.log(`🤖 Routing call to AI: ${reason}`);
    
    const aiRoutingEvent = new CustomEvent('callRoutedToAI', {
      detail: {
        callData: callData,
        reason: reason,
        timestamp: new Date().toISOString()
      }
    });
    document.dispatchEvent(aiRoutingEvent);
    
    this.routingStats.totalRouted++;
    this.routingStats.failedRoutes++;
  }
  
  notifyCustomerOfWait(callData, estimatedWaitTime) {
    const message = `Thank you for calling! All our specialists are currently busy. Your estimated wait time is ${Math.ceil(estimatedWaitTime / 60)} minutes.`;
    console.log(`📢 Customer notification: ${message}`);
  }
  
  estimateWaitTime(inquiryType) {
    const queueLength = this.routingQueue.length;
    const availableStaff = Object.values(this.staffMembers).filter(staff => 
      this.isStaffAvailable(staff)
    ).length;
    
    if (availableStaff === 0) return 300;
    
    const averageCallTime = 180;
    return Math.max(30, (queueLength / availableStaff) * averageCallTime);
  }
  
  updateStaffAvailability(data) {
    const { staffId, availability, reason } = data;
    const staff = this.staffMembers[staffId];
    
    if (staff) {
      staff.availability = availability;
      console.log(`👤 ${staff.name} is now ${availability}: ${reason || ''}`);
      
      if (availability === 'available') {
        this.processRoutingQueue();
      }
      
      this.updateRoutingDisplay();
    }
  }
  
  updateRoutingStats(routingRequest, targetStaff, success) {
    this.routingStats.totalRouted++;
    
    if (success) {
      this.routingStats.successfulRoutes++;
      
      const type = routingRequest.inquiryType;
      this.routingStats.routesByType[type] = (this.routingStats.routesByType[type] || 0) + 1;
      
      const staffId = targetStaff.id;
      this.routingStats.routesByStaff[staffId] = (this.routingStats.routesByStaff[staffId] || 0) + 1;
    } else {
      this.routingStats.failedRoutes++;
    }
  }
  
  createInterface() {
    const panel = document.createElement('div');
    panel.id = 'routing-panel';
    panel.className = 'routing-panel';
    panel.innerHTML = `
      <div class="routing-header">
        <h3>🎯 Skills-Based Routing</h3>
        <div class="routing-controls">
          <button id="test-routing">Test Routing</button>
          <button id="toggle-routing" class="${this.config.enabled ? 'enabled' : 'disabled'}">
            ${this.config.enabled ? 'Disable' : 'Enable'} Routing
          </button>
          <button id="toggle-routing-panel">−</button>
        </div>
      </div>
      
      <div class="routing-content">
        <div class="routing-stats">
          <div class="stat-card">
            <span class="stat-label">Total Routed:</span>
            <span class="stat-value" id="total-routed">${this.routingStats.totalRouted}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Success Rate:</span>
            <span class="stat-value" id="success-rate">${this.getSuccessRate()}%</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Queue Length:</span>
            <span class="stat-value" id="queue-length">${this.routingQueue.length}</span>
          </div>
        </div>
        
        <div class="staff-section">
          <h4>👥 Staff Availability</h4>
          <div id="staff-list" class="staff-list">
            ${this.generateStaffHTML()}
          </div>
        </div>
        
        <div class="active-routes-section">
          <h4>📞 Active Routes</h4>
          <div id="active-routes-list" class="active-routes-list">
            ${this.generateActiveRoutesHTML()}
          </div>
        </div>
        
        <div class="routing-queue-section">
          <h4>⏰ Routing Queue</h4>
          <div id="routing-queue-list" class="routing-queue-list">
            ${this.generateQueueHTML()}
          </div>
        </div>
      </div>
    `;
    
    const telephonyControls = document.getElementById('telephony-controls');
    if (telephonyControls) {
      telephonyControls.appendChild(panel);
    } else {
      document.body.appendChild(panel);
    }
    
    this.setupInterfaceHandlers();
  }
  
  setupInterfaceHandlers() {
    document.getElementById('toggle-routing-panel')?.addEventListener('click', () => {
      const content = document.querySelector('.routing-content');
      const button = document.getElementById('toggle-routing-panel');
      if (content.style.display === 'none') {
        content.style.display = 'block';
        button.textContent = '−';
      } else {
        content.style.display = 'none';
        button.textContent = '+';
      }
    });
    
    document.getElementById('toggle-routing')?.addEventListener('click', () => {
      this.config.enabled = !this.config.enabled;
      const button = document.getElementById('toggle-routing');
      button.textContent = this.config.enabled ? 'Disable Routing' : 'Enable Routing';
      button.className = this.config.enabled ? 'enabled' : 'disabled';
    });
    
    document.getElementById('test-routing')?.addEventListener('click', () => {
      this.testRouting();
    });
  }
  
  testRouting() {
    const testCall = {
      id: `test_${Date.now()}`,
      phoneNumber: '+1234567890',
      transcript: 'I would like to make a reservation for tonight',
      timestamp: new Date().toISOString()
    };
    
    this.handleIncomingCall(testCall);
    console.log('🧪 Test routing initiated');
  }
  
  generateStaffHTML() {
    return Object.values(this.staffMembers).map(staff => {
      const statusClass = staff.availability;
      const statusIcon = this.getAvailabilityIcon(staff.availability);
      
      return `
        <div class="staff-item ${statusClass}">
          <div class="staff-info">
            <div class="staff-name">${staff.name}</div>
            <div class="staff-title">${staff.title}</div>
          </div>
          <div class="staff-status">
            ${statusIcon} ${staff.availability}
          </div>
          <div class="staff-calls">${staff.currentCalls}/${staff.maxConcurrentCalls}</div>
        </div>
      `;
    }).join('');
  }
  
  generateActiveRoutesHTML() {
    if (this.activeRoutes.size === 0) {
      return '<div class="no-routes">No active routes</div>';
    }
    
    return Array.from(this.activeRoutes.values()).map(route => {
      const staff = this.staffMembers[route.staffId];
      const inquiryName = this.inquiryTypes[route.inquiryType]?.name || route.inquiryType;
      const duration = Math.floor((Date.now() - new Date(route.routedAt).getTime()) / 1000);
      
      return `
        <div class="route-item">
          <div class="route-info">
            <div class="route-staff">${staff?.name || 'Unknown'}</div>
            <div class="route-type">${inquiryName}</div>
          </div>
          <div class="route-duration">${this.formatDuration(duration)}</div>
        </div>
      `;
    }).join('');
  }
  
  generateQueueHTML() {
    if (this.routingQueue.length === 0) {
      return '<div class="no-queue">Queue is empty</div>';
    }
    
    return this.routingQueue.map(request => {
      const inquiryName = this.inquiryTypes[request.inquiryType]?.name || request.inquiryType;
      const waitTime = Math.floor((Date.now() - new Date(request.timestamp).getTime()) / 1000);
      
      return `
        <div class="queue-item">
          <div class="queue-info">
            <div class="queue-type">${inquiryName}</div>
            <div class="queue-priority">${request.customerPriority}</div>
          </div>
          <div class="queue-wait-time">${this.formatDuration(waitTime)}</div>
        </div>
      `;
    }).join('');
  }
  
  getAvailabilityIcon(availability) {
    switch (availability) {
      case 'available': return '🟢';
      case 'busy': return '🟡';
      case 'offline': return '🔴';
      case 'break': return '🟠';
      default: return '⚪';
    }
  }
  
  formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  getSuccessRate() {
    const total = this.routingStats.totalRouted;
    if (total === 0) return 0;
    return Math.round((this.routingStats.successfulRoutes / total) * 100);
  }
  
  updateRoutingDisplay() {
    document.getElementById('total-routed').textContent = this.routingStats.totalRouted;
    document.getElementById('success-rate').textContent = `${this.getSuccessRate()}%`;
    document.getElementById('queue-length').textContent = this.routingQueue.length;
    
    document.getElementById('staff-list').innerHTML = this.generateStaffHTML();
    document.getElementById('active-routes-list').innerHTML = this.generateActiveRoutesHTML();
    document.getElementById('routing-queue-list').innerHTML = this.generateQueueHTML();
  }
  
  startRouting() {
    setInterval(() => {
      this.processRoutingQueue();
      this.updateRoutingDisplay();
    }, 10000);
    
    console.log('🔄 Started routing queue processing');
  }
  
  saveData() {
    try {
      const data = {
        stats: this.routingStats,
        config: this.config
      };
      localStorage.setItem('routing_data', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save routing data:', error);
    }
  }
  
  destroy() {
    const panel = document.getElementById('routing-panel');
    if (panel) {
      panel.remove();
    }
    
    console.log('🗑️ Skills-based routing system destroyed');
  }
}

// Initialize skills-based routing when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  if (!window.skillsBasedRouting) {
    window.skillsBasedRouting = new SkillsBasedRouting();
  }
});

// Add to window for global access
window.SkillsBasedRouting = SkillsBasedRouting;