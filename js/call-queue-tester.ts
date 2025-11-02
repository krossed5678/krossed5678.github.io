// Converted from call-queue-tester.js — inlined to a TypeScript module
// @ts-nocheck

class CallQueueTester {
	constructor() {
		this.simulatedCalls = [];
		this.testCallId = 1000;
		this.createTestInterface();
	}

	createTestInterface() {
		const container = document.createElement('div');
		container.id = 'queue-tester';
		container.className = 'queue-tester-container';
		container.innerHTML = `
			<div class="queue-tester-header">
				<h4>🧪 Queue System Tester</h4>
				<button class="tester-minimize-btn" onclick="this.closest('.queue-tester-container').classList.toggle('minimized')">−</button>
			</div>
			<div class="queue-tester-body">
				<div class="test-controls">
					<button onclick="queueTester.simulateCall()" class="btn btn-primary">Simulate Incoming Call</button>
					<button onclick="queueTester.simulateVipCall()" class="btn btn-secondary">Simulate VIP Call</button>
					<button onclick="queueTester.simulateMultipleCalls()" class="btn btn-warning">Rush (5 calls)</button>
				</div>
                
				<div class="test-scenarios">
					<h5>Test Scenarios:</h5>
					<button onclick="queueTester.testBusyPeriod()" class="btn btn-sm">Busy Period</button>
					<button onclick="queueTester.testQueueFull()" class="btn btn-sm">Queue Full</button>
					<button onclick="queueTester.testAbandonedCalls()" class="btn btn-sm">Abandonments</button>
				</div>
                
				<div class="test-results" id="test-results">
					<h5>Test Results:</h5>
					<div id="test-log"></div>
				</div>
			</div>
		`;

		document.body.appendChild(container);
		this.testInterface = container;
	}

	simulateCall(priority = 'normal', customerType = 'new') {
		const callId = `test-${this.testCallId++}`;
		const phoneNumbers = ['+1555123456', '+1555987654', '+1555246810', '+1555135790', '+1555864209'];
		const phoneNumber = phoneNumbers[Math.floor(Math.random() * phoneNumbers.length)];
        
		const callData = {
			callId,
			phoneNumber,
			provider: 'test',
			timestamp: new Date(),
			customerData: {
				isVip: customerType === 'vip',
				previousBookings: customerType === 'vip' ? 8 : Math.floor(Math.random() * 3),
				totalSpent: customerType === 'vip' ? 750 : Math.floor(Math.random() * 200)
			}
		};

		this.logTest(`Simulating ${customerType} call from ${phoneNumber}...`);

		if (window.callQueueManager) {
			callQueueManager.addToQueue(callData).then(result => {
				if (result.success) {
					if (result.position > 0) {
						this.logTest(`✅ Call queued at position ${result.position}, estimated wait: ${Math.round(result.estimatedWait / 60)}min`);
					} else {
						this.logTest(`✅ Call routed directly (no queue)`);
					}
				} else {
					this.logTest(`❌ Call rejected: ${result.reason}`);
				}
			});

			const duration = 120 + Math.random() * 180;
			setTimeout(() => {
				if (Math.random() > 0.1) {
					callQueueManager.onCallCompleted(callId, duration);
					this.logTest(`📞 Call ${callId} completed (${Math.round(duration)}s)`);
				} else {
					callQueueManager.onCallAbandoned(callId);
					this.logTest(`📞 Call ${callId} abandoned`);
				}
			}, Math.random() * 10000 + 5000);
		}

		return callId;
	}

	simulateVipCall() { this.simulateCall('vip', 'vip'); }
	simulateMultipleCalls() {
		this.logTest(`🚀 Simulating rush period (5 calls)...`);
		for (let i = 0; i < 5; i++) {
			setTimeout(() => {
				const customerType = Math.random() > 0.8 ? 'vip' : 'new';
				this.simulateCall('normal', customerType);
			}, i * 1000);
		}
	}

	testBusyPeriod() {
		this.logTest(`📈 Testing busy period scenario...`);
		for (let i = 0; i < 3; i++) this.simulateCall();
		setTimeout(() => { for (let i = 0; i < 7; i++) setTimeout(() => this.simulateCall(), i * 500); }, 1000);
	}

	testQueueFull() {
		this.logTest(`🚫 Testing queue full scenario...`);
		for (let i = 0; i < 15; i++) setTimeout(() => this.simulateCall(), i * 200);
	}

	testAbandonedCalls() {
		this.logTest(`📞 Testing abandoned call scenario...`);
		const callIds = [];
		for (let i = 0; i < 5; i++) callIds.push(this.simulateCall());
		setTimeout(() => { callIds.slice(0, 2).forEach(callId => { if (window.callQueueManager) { callQueueManager.onCallAbandoned(callId); this.logTest(`❌ Simulated abandonment of call ${callId}`); } }); }, 3000);
	}

	logTest(message) {
		const logElement = this.testInterface.querySelector('#test-log');
		const timestamp = new Date().toLocaleTimeString();
		const logEntry = document.createElement('div');
		logEntry.className = 'test-log-entry';
		logEntry.innerHTML = `<span class="log-time">${timestamp}</span> ${message}`;
		logElement.appendChild(logEntry);
		logElement.scrollTop = logElement.scrollHeight;
		while (logElement.children.length > 20) logElement.removeChild(logElement.firstChild);
	}

	getQueueStats() { if (window.callQueueManager) return callQueueManager.getQueueStats(); return null; }
}

let queueTester;
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { queueTester = new CallQueueTester(); });
else queueTester = new CallQueueTester();

export {};
