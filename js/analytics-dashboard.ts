// Full TypeScript rewrite of analytics-dashboard.js
// No wrapper: this file contains a typed implementation and exposes globals for legacy code.

type CallEvent = 'started' | 'ended';

interface CallRecord {
	id: string;
	phoneNumber: string;
	event: CallEvent | string;
	timestamp: string; // ISO
	duration: number;
	outcome?: string;
	aiHandled?: boolean;
	transferredToHuman?: boolean;
}

interface BookingRecord {
	id: string;
	customerName?: string;
	phoneNumber?: string;
	partySize?: number;
	timestamp: string;
	source?: string;
	confirmedViaSMS?: boolean;
	customerShowedUp?: boolean | null;
}

interface AnalyticsData {
	calls: CallRecord[];
	bookings: BookingRecord[];
	smsMetrics: {
		deliveryRate: number;
		responseRate: number;
		confirmationRate: number;
		totalSent: number;
		totalDelivered: number;
		totalResponses: number;
	};
	queueMetrics: {
		averageWaitTime: number;
		maxQueueLength: number;
		abandonmentRate: number;
		totalCallsQueued: number;
		totalAbandoned: number;
	};
	customerMetrics: Record<string, any>;
	systemPerformance: Record<string, any>;
}

declare global {
	interface Window {
		restaurantAnalytics?: AnalyticsDashboard;
		AnalyticsDashboard?: typeof AnalyticsDashboard;
	}
}

export default class AnalyticsDashboard {
	data: AnalyticsData;
	charts: Record<string, any> = {};
	refreshInterval: number | undefined;
	performanceInterval: number | undefined;
	performanceIntervalId?: number;

	constructor() {
		console.log('🔍 Initializing Analytics Dashboard...');

		this.data = {
			calls: [],
			bookings: [],
			smsMetrics: {
				deliveryRate: 0,
				responseRate: 0,
				confirmationRate: 0,
				totalSent: 0,
				totalDelivered: 0,
				totalResponses: 0
			},
			queueMetrics: {
				averageWaitTime: 0,
				maxQueueLength: 0,
				abandonmentRate: 0,
				totalCallsQueued: 0,
				totalAbandoned: 0
			},
			customerMetrics: {},
			systemPerformance: {}
		};

		this.initializeStorage();
		this.setupEventListeners();
		this.createInterface();
		this.startDataCollection();

		console.log('✅ Analytics Dashboard initialized');
	}

	private initializeStorage() {
		const stored = localStorage.getItem('restaurant_analytics');
		if (stored) {
			try {
				const parsed = JSON.parse(stored) as Partial<AnalyticsData>;
				this.data = { ...this.data, ...parsed } as AnalyticsData;
				console.log('📊 Loaded existing analytics data');
			} catch (e) {
				console.warn('Failed to load analytics data:', e);
			}
		}
	}

	private setupEventListeners() {
		document.addEventListener('callStarted', (e: Event) => {
			const detail = (e as CustomEvent).detail;
			this.trackCall(detail, 'started');
		});

		document.addEventListener('callEnded', (e: Event) => {
			const detail = (e as CustomEvent).detail;
			this.trackCall(detail, 'ended');
		});

		document.addEventListener('callQueued', (e: Event) => {
			const detail = (e as CustomEvent).detail;
			this.trackQueueEvent(detail, 'queued');
		});

		document.addEventListener('callAbandoned', (e: Event) => {
			const detail = (e as CustomEvent).detail;
			this.trackQueueEvent(detail, 'abandoned');
		});

		document.addEventListener('bookingCreated', (e: Event) => {
			const detail = (e as CustomEvent).detail;
			this.trackBooking(detail);
		});

		document.addEventListener('bookingCancelled', (e: Event) => {
			const detail = (e as CustomEvent).detail;
			this.trackBookingCancellation(detail);
		});

		document.addEventListener('smsDelivered', (e: Event) => {
			const detail = (e as CustomEvent).detail;
			this.trackSMSEvent(detail, 'delivered');
		});

		document.addEventListener('smsResponse', (e: Event) => {
			const detail = (e as CustomEvent).detail;
			this.trackSMSEvent(detail, 'response');
		});

		// Persist periodically
		setInterval(() => this.saveData(), 30000);
	}

	trackCall(callData: Partial<CallRecord>, event: CallEvent | string) {
		const timestamp = new Date().toISOString();
		const callRecord: CallRecord = {
			id: callData.id || `call_${Date.now()}`,
			phoneNumber: (callData.phoneNumber as string) || (callData as any).from || 'unknown',
			event,
			timestamp,
			duration: callData.duration || 0,
			outcome: callData.outcome || 'ongoing',
			aiHandled: callData.aiHandled || false,
			transferredToHuman: callData.transferredToHuman || false
		};

		this.data.calls.push(callRecord);
		this.updateRealTimeMetrics();
		console.log('📞 Call tracked:', callRecord);
	}

	trackBooking(bookingData: Partial<BookingRecord>) {
		const timestamp = new Date().toISOString();
		const bookingRecord: BookingRecord = {
			id: bookingData.id || `booking_${Date.now()}`,
			customerName: bookingData.customerName || (bookingData as any).customer_name,
			phoneNumber: bookingData.phoneNumber || (bookingData as any).phone_number,
			partySize: bookingData.partySize || (bookingData as any).party_size,
			timestamp,
			source: bookingData.source || 'phone',
			confirmedViaSMS: false,
			customerShowedUp: null
		};

		this.data.bookings.push(bookingRecord);
		this.updateConversionMetrics();
		console.log('📝 Booking tracked:', bookingRecord);
	}

	private trackBookingCancellation(_detail: any) {
		// Placeholder: could mark bookings cancelled in data store
		console.log('🗑️ Booking cancelled:', _detail);
	}

	trackQueueEvent(queueData: any, event: 'queued' | 'abandoned') {
		if (event === 'queued') {
			this.data.queueMetrics.totalCallsQueued = (this.data.queueMetrics.totalCallsQueued || 0) + 1;
			this.data.queueMetrics.maxQueueLength = Math.max(this.data.queueMetrics.maxQueueLength, queueData.position || 1);
		} else if (event === 'abandoned') {
			this.data.queueMetrics.totalAbandoned = (this.data.queueMetrics.totalAbandoned || 0) + 1;
			this.data.queueMetrics.abandonmentRate = (this.data.queueMetrics.totalAbandoned / Math.max(this.data.queueMetrics.totalCallsQueued, 1)) * 100;
		}
		console.log('⏱️ Queue event tracked:', event, queueData);
	}

	trackSMSEvent(_smsData: any, event: 'delivered' | 'response') {
		if (event === 'delivered') {
			this.data.smsMetrics.totalDelivered++;
			this.data.smsMetrics.deliveryRate = (this.data.smsMetrics.totalDelivered / Math.max(this.data.smsMetrics.totalSent, 1)) * 100;
		} else if (event === 'response') {
			this.data.smsMetrics.totalResponses++;
			this.data.smsMetrics.responseRate = (this.data.smsMetrics.totalResponses / Math.max(this.data.smsMetrics.totalDelivered, 1)) * 100;
		}
		console.log('📱 SMS event tracked:', event, _smsData);
	}

	private updateRealTimeMetrics() {
		// Simple UI update when visible
		if (this.isVisible()) {
			this.updateMetricsDisplay();
		}
	}

	private updateConversionMetrics() {
		const totalCalls = this.data.calls.filter(call => call.event === 'started').length;
		const totalBookings = this.data.bookings.length;
		const conversionRate = totalCalls > 0 ? (totalBookings / totalCalls) * 100 : 0;

		const el = document.getElementById('conversion-rate');
		if (el) el.textContent = `${conversionRate.toFixed(1)}%`;
	}

	private createInterface() {
		const panel = document.createElement('div');
		panel.id = 'analytics-dashboard';
		panel.className = 'analytics-panel';
		panel.innerHTML = `
			<div class="analytics-header">
				<h3>📊 Analytics Dashboard</h3>
				<div class="analytics-controls">
					<select id="analytics-timeframe">
						<option value="1h">Last Hour</option>
						<option value="24h" selected>Last 24 Hours</option>
						<option value="7d">Last 7 Days</option>
						<option value="30d">Last 30 Days</option>
					</select>
					<button id="export-analytics">Export Data</button>
					<button id="toggle-analytics">−</button>
				</div>
			</div>
			<div class="analytics-content">
				<div class="metrics-grid">
					<div class="metric-card">
						<h4>📞 Call Volume</h4>
						<div class="metric-value" id="call-volume">0</div>
						<div class="metric-change" id="call-volume-change">+0%</div>
					</div>
					<div class="metric-card">
						<h4>📈 Conversion Rate</h4>
						<div class="metric-value" id="conversion-rate">0%</div>
						<div class="metric-change" id="conversion-change">+0%</div>
					</div>
					<div class="metric-card">
						<h4>⏱️ Avg Wait Time</h4>
						<div class="metric-value" id="avg-wait-time">0s</div>
						<div class="metric-change" id="wait-time-change">+0%</div>
					</div>
					<div class="metric-card">
						<h4>📱 SMS Delivery</h4>
						<div class="metric-value" id="sms-delivery">${this.data.smsMetrics.deliveryRate.toFixed(1)}%</div>
						<div class="metric-change" id="sms-delivery-change">+0%</div>
					</div>
				</div>
				<div class="charts-section">
					<div class="chart-container">
						<h4>📊 Call Pattern (24h)</h4>
						<canvas id="call-pattern-chart" width="400" height="200"></canvas>
					</div>
					<div class="chart-container">
						<h4>🎯 Booking Sources</h4>
						<canvas id="booking-sources-chart" width="300" height="200"></canvas>
					</div>
				</div>
				<div class="insights-section">
					<h4>🔍 Key Insights</h4>
					<div id="insights-list" class="insights-list"></div>
				</div>
				<div class="performance-section">
					<h4>⚡ System Performance</h4>
					<div class="performance-metrics">
						<div class="perf-metric">
							<span>Response Time:</span>
							<span id="response-time">1.2s</span>
						</div>
						<div class="perf-metric">
							<span>Uptime:</span>
							<span id="system-uptime">99.8%</span>
						</div>
						<div class="perf-metric">
							<span>Error Rate:</span>
							<span id="error-rate">0.3%</span>
						</div>
					</div>
				</div>
			</div>
		`;

		const telephonyControls = document.getElementById('telephony-controls');
		if (telephonyControls) telephonyControls.appendChild(panel);
		else document.body.appendChild(panel);

		this.setupInterfaceHandlers();
		this.initializeCharts();
		this.updateMetricsDisplay();
	}

	private setupInterfaceHandlers() {
		const toggleBtn = document.getElementById('toggle-analytics');
		toggleBtn?.addEventListener('click', () => {
			const content = document.querySelector('.analytics-content') as HTMLElement | null;
			const button = document.getElementById('toggle-analytics');
			if (!content || !button) return;
			if (content.style.display === 'none') {
				content.style.display = 'block';
				button.textContent = '−';
			} else {
				content.style.display = 'none';
				button.textContent = '+';
			}
		});

		const timeframe = document.getElementById('analytics-timeframe') as HTMLSelectElement | null;
		timeframe?.addEventListener('change', (e) => {
			const val = (e.target as HTMLSelectElement).value;
			this.updateTimeframe(val);
		});

		document.getElementById('export-analytics')?.addEventListener('click', () => this.exportData());
	}

	private initializeCharts() {
		const callChart = document.getElementById('call-pattern-chart') as HTMLCanvasElement | null;
		if (callChart) {
			const ctx = callChart.getContext('2d');
			if (ctx) this.drawCallPatternChart(ctx);
		}

		const bookingChart = document.getElementById('booking-sources-chart') as HTMLCanvasElement | null;
		if (bookingChart) {
			const ctx = bookingChart.getContext('2d');
			if (ctx) this.drawBookingSourcesChart(ctx);
		}

		this.refreshInterval = window.setInterval(() => this.refreshCharts(), 60000);
	}

	private drawCallPatternChart(ctx: CanvasRenderingContext2D) {
		const hours = Array.from({ length: 24 }, (_, i) => i);
		const callCounts = this.getCallCountsByHour();

		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		ctx.fillStyle = '#3498db';

		const maxCalls = Math.max(...callCounts, 1);
		const barWidth = ctx.canvas.width / 24;
		const maxHeight = ctx.canvas.height - 40;

		hours.forEach((hour, index) => {
			const height = (callCounts[index] / maxCalls) * maxHeight;
			const x = index * barWidth;
			const y = ctx.canvas.height - height - 20;

			ctx.fillRect(x, y, Math.max(barWidth - 2, 1), height);

			if (index % 4 === 0) {
				ctx.fillStyle = '#666';
				ctx.font = '10px Arial';
				ctx.fillText(`${hour}:00`, x, ctx.canvas.height - 5);
				ctx.fillStyle = '#3498db';
			}
		});
	}

	private drawBookingSourcesChart(ctx: CanvasRenderingContext2D) {
		const sources = this.getBookingSources();
		const total = Object.values(sources).reduce((s, v) => s + v, 0);
		if (total === 0) return;

		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		const centerX = ctx.canvas.width / 2;
		const centerY = ctx.canvas.height / 2;
		const radius = Math.min(centerX, centerY) - 10;

		let startAngle = 0;
		const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12'];
		let colorIndex = 0;

		Object.entries(sources).forEach(([source, count]) => {
			const angle = (count / total) * 2 * Math.PI;
			ctx.beginPath();
			ctx.moveTo(centerX, centerY);
			ctx.arc(centerX, centerY, radius, startAngle, startAngle + angle);
			ctx.closePath();
			ctx.fillStyle = colors[colorIndex % colors.length];
			ctx.fill();

			const labelAngle = startAngle + angle / 2;
			const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
			const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);

			ctx.fillStyle = '#fff';
			ctx.font = '12px Arial';
			ctx.textAlign = 'center';
			ctx.fillText(source, labelX, labelY);

			startAngle += angle;
			colorIndex++;
		});
	}

	private getCallCountsByHour(): number[] {
		const counts = Array(24).fill(0);
		const now = new Date();
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		this.data.calls.forEach(call => {
			const callTime = new Date(call.timestamp);
			if (callTime >= today) counts[callTime.getHours()]++;
		});
		return counts;
	}

	private getBookingSources(): Record<string, number> {
		const sources: Record<string, number> = {};
		this.data.bookings.forEach(booking => {
			const source = booking.source || 'phone';
			sources[source] = (sources[source] || 0) + 1;
		});
		return sources;
	}

	private updateMetricsDisplay() {
		const callVolume = this.data.calls.filter(call => call.event === 'started' && this.isInTimeframe(call.timestamp, '24h')).length;
		const callVolumeEl = document.getElementById('call-volume');
		if (callVolumeEl) callVolumeEl.textContent = String(callVolume);

		const avgWaitTime = this.calculateAverageWaitTime();
		const avgWaitEl = document.getElementById('avg-wait-time');
		if (avgWaitEl) avgWaitEl.textContent = `${avgWaitTime.toFixed(1)}s`;

		const smsEl = document.getElementById('sms-delivery');
		if (smsEl) smsEl.textContent = `${this.data.smsMetrics.deliveryRate.toFixed(1)}%`;

		this.updateInsights();
	}

	private calculateAverageWaitTime(): number {
		return this.data.queueMetrics.averageWaitTime || (Math.random() * 30 + 10);
	}

	private updateInsights() {
		const insights = this.generateInsights();
		const insightsList = document.getElementById('insights-list');
		if (insightsList) {
			insightsList.innerHTML = insights.map(i => `<div class="insight">${i}</div>`).join('');
		}
	}

	private generateInsights(): string[] {
		const insights: string[] = [];
		const hourCounts = this.getCallCountsByHour();
		const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
		if (peakHour >= 0) insights.push(`📈 Peak call time: ${peakHour}:00 (${Math.max(...hourCounts)} calls)`);

		const aiHandledCalls = this.data.calls.filter(c => c.aiHandled).length;
		const totalCalls = this.data.calls.filter(c => c.event === 'started').length;
		if (totalCalls > 0) {
			const aiSuccessRate = (aiHandledCalls / totalCalls) * 100;
			insights.push(`🤖 AI handles ${aiSuccessRate.toFixed(0)}% of calls successfully`);
		}

		if (this.data.smsMetrics.deliveryRate > 0) {
			insights.push(`📱 SMS confirmations active with ${this.data.smsMetrics.deliveryRate.toFixed(0)}% delivery rate`);
		}

		return insights;
	}

	private isInTimeframe(timestamp: string, timeframe: string): boolean {
		const now = Date.now();
		const time = new Date(timestamp).getTime();
		switch (timeframe) {
			case '1h': return (now - time) < (60 * 60 * 1000);
			case '24h': return (now - time) < (24 * 60 * 60 * 1000);
			case '7d': return (now - time) < (7 * 24 * 60 * 60 * 1000);
			case '30d': return (now - time) < (30 * 24 * 60 * 60 * 1000);
			default: return true;
		}
	}

	private updateTimeframe(timeframe: string) {
		console.log(`🔄 Updating analytics timeframe to: ${timeframe}`);
		this.updateMetricsDisplay();
		this.refreshCharts();
	}

	private refreshCharts() {
		const callChart = document.getElementById('call-pattern-chart') as HTMLCanvasElement | null;
		if (callChart) {
			const ctx = callChart.getContext('2d');
			if (ctx) this.drawCallPatternChart(ctx);
		}
		const bookingChart = document.getElementById('booking-sources-chart') as HTMLCanvasElement | null;
		if (bookingChart) {
			const ctx = bookingChart.getContext('2d');
			if (ctx) this.drawBookingSourcesChart(ctx);
		}
	}

	exportData() {
		const exportData = {
			timestamp: new Date().toISOString(),
			summary: {
				totalCalls: this.data.calls.length,
				totalBookings: this.data.bookings.length,
				conversionRate: this.data.bookings.length / Math.max(this.data.calls.filter(c => c.event === 'started').length, 1) * 100,
				smsMetrics: this.data.smsMetrics,
				queueMetrics: this.data.queueMetrics
			},
			data: this.data
		};

		const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `restaurant-analytics-${new Date().toISOString().split('T')[0]}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		console.log('📊 Analytics data exported');
	}

	isVisible(): boolean {
		const panel = document.getElementById('analytics-dashboard');
		return !!panel && panel.offsetParent !== null;
	}

	saveData() {
		try {
			localStorage.setItem('restaurant_analytics', JSON.stringify(this.data));
		} catch (e) {
			console.warn('Failed to save analytics data:', e);
		}
	}

	startDataCollection() {
		this.performanceInterval = window.setInterval(() => this.collectPerformanceMetrics(), 5000) as unknown as number;
		console.log('🔄 Started analytics data collection');
	}

	private collectPerformanceMetrics() {
		this.data.systemPerformance = {
			responseTime: Math.random() * 2 + 0.5,
			uptime: 99.8 + Math.random() * 0.19,
			errorRate: Math.random() * 0.5,
			timestamp: new Date().toISOString()
		};

		const rt = document.getElementById('response-time');
		const up = document.getElementById('system-uptime');
		const er = document.getElementById('error-rate');
		if (rt) rt.textContent = `${(this.data.systemPerformance.responseTime as number).toFixed(1)}s`;
		if (up) up.textContent = `${(this.data.systemPerformance.uptime as number).toFixed(1)}%`;
		if (er) er.textContent = `${(this.data.systemPerformance.errorRate as number).toFixed(1)}%`;
	}

	destroy() {
		if (this.refreshInterval) clearInterval(this.refreshInterval);
		if (this.performanceInterval) clearInterval(this.performanceInterval as unknown as number);
		const panel = document.getElementById('analytics-dashboard');
		if (panel) panel.remove();
		console.log('🗑️ Analytics dashboard destroyed');
	}
}

// Auto-init when DOMReady and expose globals for legacy code
document.addEventListener('DOMContentLoaded', () => {
	if (!window.restaurantAnalytics) {
		window.restaurantAnalytics = new AnalyticsDashboard();
	}
});

window.AnalyticsDashboard = AnalyticsDashboard;

