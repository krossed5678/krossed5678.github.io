// Converted from skills-based-routing.js — inlined TypeScript implementation
// @ts-nocheck

class SkillsBasedRouting {
	config: any;
	staffMembers: any;
	inquiryTypes: any;
	activeRoutes: Map<string, any>;
	routingQueue: any[];
	routingStats: any;

	constructor() {
		console.log('🎯 Initializing Skills-Based Routing System...');
		this.config = { enabled: true, fallbackToAI: true, maxWaitTimeSeconds: 180, priorityRouting: true };
		this.staffMembers = {/* seed staff */};
		this.inquiryTypes = {/* defined in original script - kept minimal */};
		// Recreate staff and inquiry types based on original behaviour
		this.staffMembers = {
			manager_1: { id: 'manager_1', name: 'Sarah Chen', title: 'Restaurant Manager', skills: ['complaints','reservations','management','special_events','vip_service'], availability: 'available', currentCalls: 0, maxConcurrentCalls: 2, priority: 9 },
			reservation_specialist_1: { id: 'reservation_specialist_1', name: 'Maria Rodriguez', title: 'Reservation Specialist', skills: ['reservations','customer_service','special_events'], availability: 'available', currentCalls: 0, maxConcurrentCalls: 3, priority: 7 },
			host_1: { id: 'host_1', name: 'James Wilson', title: 'Host', skills: ['reservations','general_inquiries','customer_service'], availability: 'available', currentCalls: 0, maxConcurrentCalls: 2, priority: 5 }
		};
		this.inquiryTypes = {
			reservation: { name: 'Reservation Request', requiredSkills: ['reservations'], keywords: ['reservation','book','table','party','dinner','lunch'], priority: 'normal' },
			complaint: { name: 'Complaint/Issue', requiredSkills: ['complaints','management'], keywords: ['complaint','problem','issue','wrong','bad','manager'], priority: 'high' },
			menu_question: { name: 'Menu Questions', requiredSkills: ['menu_questions','customer_service'], keywords: ['menu','food','ingredients','allergies','gluten','vegan'], priority: 'normal' },
			general: { name: 'General Inquiry', requiredSkills: ['general_inquiries','customer_service'], keywords: ['hours','location','directions','parking','information'], priority: 'low' }
		};
		this.activeRoutes = new Map(); this.routingQueue = []; this.routingStats = { totalRouted: 0, successfulRoutes: 0, failedRoutes: 0, routesByType: {}, routesByStaff: {} };
		this.initializeStorage(); this.setupEventListeners(); this.createInterface(); this.startRouting(); console.log('✅ Skills-Based Routing System initialized');
	}

	initializeStorage() { try { const stored = localStorage.getItem('routing_data'); if (stored) { const data = JSON.parse(stored); this.routingStats = { ...this.routingStats, ...data.stats }; this.config = { ...this.config, ...data.config }; } } catch (e) { console.warn('Failed to load routing data:', e); } }

	setupEventListeners() { document.addEventListener('callStarted', (e: any) => this.handleIncomingCall(e.detail)); document.addEventListener('callEnded', (e: any) => this.handleCallEnded(e.detail)); document.addEventListener('staffAvailabilityChanged', (e: any) => this.updateStaffAvailability(e.detail)); setInterval(() => { this.processRoutingQueue(); this.saveData(); }, 30000); }

	handleIncomingCall(callData: any) { console.log('📞 Processing incoming call for routing:', callData); if (!this.config.enabled) { this.routeToAI(callData); return; } const inquiryType = this.analyzeCallIntent(callData); const customerPriority = this.determineCustomerPriority(callData); const routingRequest = { id: callData.id || `route_${Date.now()}`, callData, inquiryType, customerPriority, timestamp: new Date().toISOString(), attempts: 0, status: 'pending' }; const routeResult = this.findBestStaff(routingRequest); if (routeResult.success) this.executeRouting(routingRequest, routeResult.staff); else { this.routingQueue.push(routingRequest); this.notifyCustomerOfWait(callData, routeResult.estimatedWaitTime); } this.updateRoutingDisplay(); }

	analyzeCallIntent(callData: any) { const transcript = (callData.transcript || callData.initialMessage || '').toLowerCase(); const scores: any = {}; Object.entries(this.inquiryTypes).forEach(([type, config]: any) => { let score = 0; config.keywords.forEach((keyword: string) => { if (transcript.includes(keyword)) score += 1; }); scores[type] = score / config.keywords.length; }); const best = Object.entries(scores).reduce((best: any, [type, score]: any) => score > best.score ? { type, score } : best, { type: 'general', score: 0 }); return best.score >= 0.3 ? best.type : 'general'; }

	determineCustomerPriority(callData: any) { const phone = callData.phoneNumber || callData.from; const vipNumbers = ['+15551234567', '+15559876543']; if (vipNumbers.includes(phone)) return 'vip'; if (callData.isReturningCustomer) return 'returning'; return 'normal'; }

	findBestStaff(routingRequest: any) { const inquiryConfig = this.inquiryTypes[routingRequest.inquiryType]; const availableStaff = Object.values(this.staffMembers).filter((s: any) => this.isStaffAvailable(s) && this.hasRequiredSkills(s, inquiryConfig.requiredSkills)); if (availableStaff.length === 0) return { success: false, reason: 'No available staff with required skills', estimatedWaitTime: this.estimateWaitTime(routingRequest.inquiryType) }; const ranked = availableStaff.map((s: any) => ({ ...s, score: this.calculateStaffScore(s, routingRequest) })).sort((a: any,b: any) => b.score - a.score); return { success: true, staff: ranked[0], alternatives: ranked.slice(1,3) }; }

	isStaffAvailable(staff: any) { if (staff.availability !== 'available') return false; return staff.currentCalls < staff.maxConcurrentCalls; }
	hasRequiredSkills(staff: any, requiredSkills: string[]) { return requiredSkills.every(skill => staff.skills.includes(skill)); }
	calculateStaffScore(staff: any, routingRequest: any) { let score = staff.priority; score -= staff.currentCalls * 2; const inquiryConfig = this.inquiryTypes[routingRequest.inquiryType]; const skillMatches = inquiryConfig.requiredSkills.filter((skill: string) => staff.skills.includes(skill)).length; score += skillMatches * 3; if (routingRequest.customerPriority === 'vip' && staff.skills.includes('vip_service')) score += 10; return score; }

	executeRouting(routingRequest: any, targetStaff: any) { console.log(`🎯 Routing call to ${targetStaff.name}`); targetStaff.currentCalls++; const route = { id: routingRequest.id, callId: routingRequest.callData.id, staffId: targetStaff.id, inquiryType: routingRequest.inquiryType, routedAt: new Date().toISOString(), status: 'active' }; this.activeRoutes.set(routingRequest.id, route); routingRequest.status = 'routed'; this.updateRoutingStats(routingRequest, targetStaff, true); document.dispatchEvent(new CustomEvent('callRouted', { detail: { callData: routingRequest.callData, targetStaff, inquiryType: routingRequest.inquiryType, route } })); (window as any).legacyFeatures?.addLog?.({ type: 'info', source: 'Skills-Based Routing', text: `Call routed to ${targetStaff.name}` }); }

	handleCallEnded(callData: any) { const route = Array.from(this.activeRoutes.values()).find((r:any) => r.callId === callData.id); if (route) { const staff = this.staffMembers[route.staffId]; if (staff) staff.currentCalls = Math.max(0, staff.currentCalls - 1); route.status = 'completed'; route.endedAt = new Date().toISOString(); this.activeRoutes.delete(route.id); console.log(`✅ Routing completed: ${staff?.name} handled ${route.inquiryType}`); } this.processRoutingQueue(); this.updateRoutingDisplay(); }

	processRoutingQueue() { if (this.routingQueue.length === 0) return; const processed: number[] = []; this.routingQueue.forEach((request, index) => { if (request.status === 'routed') { processed.push(index); return; } const waitTime = (Date.now() - new Date(request.timestamp).getTime()) / 1000; if (waitTime > this.config.maxWaitTimeSeconds) { this.routeToAI(request.callData, 'timeout'); request.status = 'failed_timeout'; processed.push(index); return; } const routeResult = this.findBestStaff(request); if (routeResult.success) { this.executeRouting(request, routeResult.staff); processed.push(index); } }); processed.reverse().forEach(i => this.routingQueue.splice(i,1)); }

	routeToAI(callData: any, reason = 'fallback') { document.dispatchEvent(new CustomEvent('callRoutedToAI', { detail: { callData, reason, timestamp: new Date().toISOString() } })); this.routingStats.totalRouted++; this.routingStats.failedRoutes++; }

	notifyCustomerOfWait(callData: any, estimatedWaitTime: number) { const message = `Thank you for calling! All our specialists are currently busy. Your estimated wait time is ${Math.ceil(estimatedWaitTime/60)} minutes.`; console.log(`📢 Customer notification: ${message}`); }

	estimateWaitTime(inquiryType: any) { const queueLength = this.routingQueue.length; const availableStaff = Object.values(this.staffMembers).filter((s:any) => this.isStaffAvailable(s)).length; if (availableStaff === 0) return 300; const averageCallTime = 180; return Math.max(30, (queueLength / availableStaff) * averageCallTime); }

	updateStaffAvailability(data: any) { const staff = this.staffMembers[data.staffId]; if (staff) { staff.availability = data.availability; if (data.availability === 'available') this.processRoutingQueue(); this.updateRoutingDisplay(); } }

	updateRoutingStats(routingRequest: any, targetStaff: any, success: boolean) { this.routingStats.totalRouted++; if (success) { this.routingStats.successfulRoutes++; const type = routingRequest.inquiryType; this.routingStats.routesByType[type] = (this.routingStats.routesByType[type] || 0) + 1; const staffId = targetStaff.id; this.routingStats.routesByStaff[staffId] = (this.routingStats.routesByStaff[staffId] || 0) + 1; } else this.routingStats.failedRoutes++; }

	createInterface() { const panel = document.createElement('div'); panel.id = 'routing-panel'; panel.className = 'routing-panel'; panel.innerHTML = `<div class="routing-header"><h3>🎯 Skills-Based Routing</h3></div><div class="routing-content"><div id="staff-list"></div></div>`; document.body.appendChild(panel); this.setupInterfaceHandlers(); }

	setupInterfaceHandlers() { /* minimal UI handlers */ }

	testRouting() { const testCall = { id: `test_${Date.now()}`, phoneNumber: '+1234567890', transcript: 'I would like to make a reservation for tonight', timestamp: new Date().toISOString() }; this.handleIncomingCall(testCall); }

	generateStaffHTML() { return Object.values(this.staffMembers).map((staff:any)=>`<div class="staff-item">${staff.name}</div>`).join(''); }
	generateActiveRoutesHTML() { if (this.activeRoutes.size === 0) return '<div class="no-routes">No active routes</div>'; return Array.from(this.activeRoutes.values()).map((route:any)=>`<div>${route.staffId}</div>`).join(''); }
	generateQueueHTML() { if (this.routingQueue.length === 0) return '<div class="no-queue">Queue is empty</div>'; return this.routingQueue.map((r:any)=>`<div>${r.inquiryType}</div>`).join(''); }

	updateRoutingDisplay() { const panel = document.getElementById('routing-panel'); if (!panel) return; panel.querySelector('#staff-list')!.innerHTML = this.generateStaffHTML(); }

	startRouting() { setInterval(()=>{ this.processRoutingQueue(); this.updateRoutingDisplay(); }, 10000); console.log('🔄 Started routing queue processing'); }

	saveData() { try { const data = { stats: this.routingStats, config: this.config }; localStorage.setItem('routing_data', JSON.stringify(data)); } catch (e) { console.warn('Failed to save routing data:', e); } }

	destroy() { const panel = document.getElementById('routing-panel'); if (panel) panel.remove(); console.log('🗑️ Skills-based routing system destroyed'); }
}

document.addEventListener('DOMContentLoaded', () => { if (!(window as any).skillsBasedRouting) (window as any).skillsBasedRouting = new SkillsBasedRouting(); });

export {};

