/**
 * Demo Preparation System
 * Creates a professional demo interface with sample data and optimized performance
 * for business presentations and pitches
 */

class DemoPreparationSystem {
    constructor() {
        this.demoMode = false;
        this.sampleData = {};
        this.demoScenarios = [];
        this.presentationMode = false;
        this.init();
    }

    async init() {
        console.log('🎯 Initializing Demo Preparation System...');
        this.createSampleData();
        this.setupDemoScenarios();
        this.createDemoInterface();
        this.optimizeForDemo();
        console.log('✅ Demo Preparation System ready');
    }

    createSampleData() {
        // Create realistic sample data for demonstrations
        this.sampleData = {
            restaurant: {
                name: "Bella Vista Restaurant",
                cuisine: "Modern Italian",
                location: "123 Downtown Plaza, Metropolitan City",
                phone: "+1-555-BELLA-1",
                hours: "Mon-Thu: 11AM-10PM, Fri-Sat: 11AM-11PM, Sun: 10AM-9PM",
                capacity: 120,
                avgTicket: "$85",
                rating: 4.8
            },
            
            todaysStats: {
                callsReceived: 47,
                reservationsBooked: 23,
                averageCallTime: "2m 15s",
                languagesDetected: ["English", "Spanish", "French"],
                customerSatisfaction: "96%",
                aiResolutionRate: "89%"
            },

            liveMetrics: {
                currentCalls: 3,
                waitingQueue: 1,
                tablesAvailable: 8,
                nextAvailableSlot: "6:30 PM",
                vipCustomersToday: 5,
                specialDietary: ["Gluten-Free: 4", "Vegetarian: 7", "Vegan: 2"]
            },

            recentBookings: [
                {
                    time: "2 minutes ago",
                    customer: "Maria Rodriguez",
                    party: 4,
                    date: "Tonight 7:00 PM",
                    language: "Spanish",
                    special: "Anniversary celebration"
                },
                {
                    time: "8 minutes ago", 
                    customer: "David Chen",
                    party: 6,
                    date: "Tomorrow 6:30 PM",
                    language: "English",
                    special: "Business dinner"
                },
                {
                    time: "12 minutes ago",
                    customer: "Sophie Laurent",
                    party: 2,
                    date: "Friday 8:00 PM",
                    language: "French",
                    special: "Gluten-free menu"
                }
            ],

            upcomingReservations: [
                { time: "5:30 PM", name: "Johnson (4)", table: "15", notes: "VIP, wine pairing" },
                { time: "6:00 PM", name: "Williams (2)", table: "7", notes: "Vegetarian" },
                { time: "6:30 PM", name: "Chen (6)", table: "20", notes: "Business meeting" },
                { time: "7:00 PM", name: "Rodriguez (4)", table: "12", notes: "Anniversary" },
                { time: "7:30 PM", name: "Thompson (8)", table: "25", notes: "Large party" }
            ]
        };

        console.log('📊 Sample data created for demo');
    }

    setupDemoScenarios() {
        // Pre-configured demo scenarios for different business presentations
        this.demoScenarios = [
            {
                id: 'basic-reservation',
                name: 'Basic Reservation Flow',
                description: 'Shows standard reservation booking process',
                script: [
                    { type: 'incoming_call', data: { number: '+1-555-0123' } },
                    { type: 'customer_message', text: "Hi, I'd like to make a reservation for tonight." },
                    { type: 'ai_response', text: "Good evening! I'd be happy to help you with a reservation. For how many people?" },
                    { type: 'customer_message', text: "Four people, around 7 PM if possible." },
                    { type: 'ai_response', text: "Perfect! I have availability at 7:00 PM for four guests. May I have a name for the reservation?" },
                    { type: 'customer_message', text: "Yes, it's under Johnson." },
                    { type: 'booking_complete', data: { name: 'Johnson', party: 4, time: '7:00 PM' } }
                ]
            },
            
            {
                id: 'multilingual-interaction',
                name: 'Multilingual Customer Support',
                description: 'Demonstrates automatic language detection and response',
                script: [
                    { type: 'incoming_call', data: { number: '+1-555-0456' } },
                    { type: 'customer_message', text: "Hola, quisiera hacer una reservación para esta noche." },
                    { type: 'language_detection', language: 'es' },
                    { type: 'ai_response', text: "¡Buenas tardes! Me complace ayudarle con una reserva. ¿Para cuántas personas?" },
                    { type: 'customer_message', text: "Para seis personas, si es posible a las ocho." },
                    { type: 'booking_complete', data: { name: 'García', party: 6, time: '8:00 PM', language: 'Spanish' } }
                ]
            },

            {
                id: 'vip-recognition',
                name: 'VIP Customer Recognition',
                description: 'Shows personalized service for returning customers',
                script: [
                    { type: 'incoming_call', data: { number: '+1-555-0789' } },
                    { type: 'customer_recognition', customer: 'David Chen', vip: true },
                    { type: 'ai_response', text: "Good evening, Mr. Chen! Welcome back to Bella Vista. How can we help you tonight?" },
                    { type: 'customer_message', text: "Hi! I'd like to book our usual table for tomorrow." },
                    { type: 'ai_response', text: "Of course! I'll reserve table 15 for tomorrow at 7:30 PM for four guests. Should I also arrange the wine pairing menu?" },
                    { type: 'booking_complete', data: { name: 'Chen', party: 4, time: '7:30 PM', vip: true } }
                ]
            }
        ];

        console.log(`🎬 ${this.demoScenarios.length} demo scenarios prepared`);
    }

    createDemoInterface() {
        // Create professional demo control panel
        const demoPanel = document.createElement('div');
        demoPanel.className = 'demo-control-panel';
        demoPanel.innerHTML = `
            <div class="demo-header">
                <h2>🎯 Restaurant AI Demo Control</h2>
                <div class="demo-status">
                    <span class="status-indicator ${this.demoMode ? 'active' : ''}"></span>
                    <span>Demo Mode: ${this.demoMode ? 'ON' : 'OFF'}</span>
                </div>
            </div>

            <div class="demo-content">
                <div class="demo-section">
                    <h3>Demo Controls</h3>
                    <div class="control-buttons">
                        <button class="demo-btn primary" onclick="demoSystem.toggleDemoMode()">
                            ${this.demoMode ? 'Exit Demo' : 'Start Demo'}
                        </button>
                        <button class="demo-btn" onclick="demoSystem.togglePresentationMode()">
                            Presentation Mode
                        </button>
                        <button class="demo-btn" onclick="demoSystem.resetDemo()">
                            Reset Demo
                        </button>
                    </div>
                </div>

                <div class="demo-section">
                    <h3>Live Restaurant Metrics</h3>
                    <div class="metrics-grid">
                        <div class="metric-card">
                            <div class="metric-icon">📞</div>
                            <div class="metric-info">
                                <div class="metric-value">${this.sampleData.todaysStats.callsReceived}</div>
                                <div class="metric-label">Calls Today</div>
                            </div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-icon">📅</div>
                            <div class="metric-info">
                                <div class="metric-value">${this.sampleData.todaysStats.reservationsBooked}</div>
                                <div class="metric-label">Reservations</div>
                            </div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-icon">⏱️</div>
                            <div class="metric-info">
                                <div class="metric-value">${this.sampleData.todaysStats.averageCallTime}</div>
                                <div class="metric-label">Avg Call Time</div>
                            </div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-icon">🌟</div>
                            <div class="metric-info">
                                <div class="metric-value">${this.sampleData.todaysStats.customerSatisfaction}</div>
                                <div class="metric-label">Satisfaction</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="demo-section">
                    <h3>Demo Scenarios</h3>
                    <div class="scenario-list">
                        ${this.demoScenarios.map(scenario => `
                            <div class="scenario-card" onclick="demoSystem.runScenario('${scenario.id}')">
                                <div class="scenario-name">${scenario.name}</div>
                                <div class="scenario-description">${scenario.description}</div>
                                <button class="run-scenario-btn">Run Scenario</button>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="demo-section">
                    <h3>Recent Activity</h3>
                    <div class="activity-feed">
                        ${this.sampleData.recentBookings.map(booking => `
                            <div class="activity-item">
                                <div class="activity-time">${booking.time}</div>
                                <div class="activity-details">
                                    <strong>${booking.customer}</strong> (${booking.party} guests)
                                    <div class="activity-meta">${booking.date} • ${booking.language} • ${booking.special}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        // Add to page
        document.body.appendChild(demoPanel);

        // Create live dashboard overlay
        this.createLiveDashboard();
        
        // Add styling
        this.addDemoStyles();

        console.log('🎨 Demo interface created');
    }

    createLiveDashboard() {
        const dashboard = document.createElement('div');
        dashboard.className = 'live-dashboard';
        dashboard.innerHTML = `
            <div class="dashboard-header">
                <div class="restaurant-info">
                    <h2>${this.sampleData.restaurant.name}</h2>
                    <div class="restaurant-details">
                        ${this.sampleData.restaurant.cuisine} • ${this.sampleData.restaurant.rating}⭐ • ${this.sampleData.restaurant.location}
                    </div>
                </div>
                <div class="current-status">
                    <div class="status-item">
                        <span class="status-label">Current Calls:</span>
                        <span class="status-value live-calls">${this.sampleData.liveMetrics.currentCalls}</span>
                    </div>
                    <div class="status-item">
                        <span class="status-label">Queue:</span>
                        <span class="status-value">${this.sampleData.liveMetrics.waitingQueue}</span>
                    </div>
                    <div class="status-item">
                        <span class="status-label">Next Available:</span>
                        <span class="status-value">${this.sampleData.liveMetrics.nextAvailableSlot}</span>
                    </div>
                </div>
            </div>

            <div class="dashboard-content">
                <div class="reservations-today">
                    <h3>Today's Reservations</h3>
                    <div class="reservation-timeline">
                        ${this.sampleData.upcomingReservations.map(res => `
                            <div class="reservation-slot">
                                <div class="reservation-time">${res.time}</div>
                                <div class="reservation-details">
                                    <div class="reservation-name">${res.name}</div>
                                    <div class="reservation-table">Table ${res.table}</div>
                                    <div class="reservation-notes">${res.notes}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(dashboard);
        
        // Start live updates
        this.startLiveUpdates();
    }

    addDemoStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .demo-control-panel {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 400px;
                max-height: 80vh;
                background: white;
                border-radius: 16px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                overflow: hidden;
                z-index: 10000;
                font-family: system-ui, -apple-system, sans-serif;
            }

            .demo-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .demo-header h2 {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
            }

            .demo-status {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
            }

            .status-indicator {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.3);
            }

            .status-indicator.active {
                background: #10b981;
                box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.3);
            }

            .demo-content {
                padding: 20px;
                max-height: 60vh;
                overflow-y: auto;
            }

            .demo-section {
                margin-bottom: 24px;
            }

            .demo-section h3 {
                margin: 0 0 12px 0;
                font-size: 16px;
                font-weight: 600;
                color: #1f2937;
            }

            .control-buttons {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            }

            .demo-btn {
                padding: 8px 16px;
                border: 1px solid #d1d5db;
                border-radius: 8px;
                background: white;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.2s ease;
            }

            .demo-btn:hover {
                background: #f9fafb;
                transform: translateY(-1px);
            }

            .demo-btn.primary {
                background: #4f46e5;
                color: white;
                border-color: #4f46e5;
            }

            .demo-btn.primary:hover {
                background: #4338ca;
            }

            .metrics-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 12px;
            }

            .metric-card {
                display: flex;
                align-items: center;
                padding: 16px;
                background: #f8fafc;
                border-radius: 12px;
                gap: 12px;
            }

            .metric-icon {
                font-size: 24px;
            }

            .metric-value {
                font-size: 20px;
                font-weight: bold;
                color: #1f2937;
            }

            .metric-label {
                font-size: 12px;
                color: #6b7280;
                margin-top: 2px;
            }

            .scenario-card {
                padding: 16px;
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                margin-bottom: 12px;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .scenario-card:hover {
                border-color: #4f46e5;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }

            .scenario-name {
                font-weight: 600;
                color: #1f2937;
                margin-bottom: 4px;
            }

            .scenario-description {
                font-size: 14px;
                color: #6b7280;
                margin-bottom: 8px;
            }

            .run-scenario-btn {
                background: #eff6ff;
                color: #2563eb;
                border: 1px solid #bfdbfe;
                padding: 4px 12px;
                border-radius: 6px;
                font-size: 12px;
                cursor: pointer;
            }

            .activity-feed {
                max-height: 200px;
                overflow-y: auto;
            }

            .activity-item {
                display: flex;
                padding: 12px 0;
                border-bottom: 1px solid #f3f4f6;
            }

            .activity-time {
                font-size: 12px;
                color: #6b7280;
                width: 80px;
                flex-shrink: 0;
            }

            .activity-details strong {
                color: #1f2937;
            }

            .activity-meta {
                font-size: 12px;
                color: #6b7280;
                margin-top: 2px;
            }

            .live-dashboard {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: white;
                border-bottom: 1px solid #e5e7eb;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                z-index: 9999;
                display: none;
            }

            .live-dashboard.presentation-mode {
                display: block;
            }

            .dashboard-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 24px;
                background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
                color: white;
            }

            .restaurant-info h2 {
                margin: 0;
                font-size: 24px;
                font-weight: 700;
            }

            .restaurant-details {
                font-size: 14px;
                color: rgba(255, 255, 255, 0.8);
                margin-top: 4px;
            }

            .current-status {
                display: flex;
                gap: 24px;
            }

            .status-item {
                text-align: center;
            }

            .status-label {
                display: block;
                font-size: 12px;
                color: rgba(255, 255, 255, 0.7);
                margin-bottom: 4px;
            }

            .status-value {
                display: block;
                font-size: 18px;
                font-weight: bold;
            }

            .live-calls {
                color: #10b981;
                text-shadow: 0 0 8px rgba(16, 185, 129, 0.3);
            }

            .dashboard-content {
                padding: 16px 24px;
                background: #f8fafc;
            }

            .reservations-today h3 {
                margin: 0 0 16px 0;
                color: #1f2937;
            }

            .reservation-timeline {
                display: flex;
                gap: 16px;
                overflow-x: auto;
                padding-bottom: 8px;
            }

            .reservation-slot {
                min-width: 200px;
                padding: 16px;
                background: white;
                border-radius: 12px;
                border: 1px solid #e5e7eb;
                flex-shrink: 0;
            }

            .reservation-time {
                font-size: 18px;
                font-weight: bold;
                color: #4f46e5;
                margin-bottom: 8px;
            }

            .reservation-name {
                font-weight: 600;
                color: #1f2937;
            }

            .reservation-table {
                font-size: 14px;
                color: #6b7280;
                margin: 4px 0;
            }

            .reservation-notes {
                font-size: 12px;
                color: #10b981;
                background: #ecfdf5;
                padding: 4px 8px;
                border-radius: 4px;
                margin-top: 8px;
            }

            @media (max-width: 768px) {
                .demo-control-panel {
                    position: fixed;
                    top: 0;
                    right: 0;
                    left: 0;
                    width: 100%;
                    max-height: 100vh;
                    border-radius: 0;
                }
                
                .metrics-grid {
                    grid-template-columns: 1fr;
                }
            }
        `;
        document.head.appendChild(style);
    }

    toggleDemoMode() {
        this.demoMode = !this.demoMode;
        
        // Update status indicator
        const indicator = document.querySelector('.status-indicator');
        const statusText = document.querySelector('.demo-status span:last-child');
        const toggleBtn = document.querySelector('.demo-btn.primary');
        
        if (indicator) indicator.classList.toggle('active', this.demoMode);
        if (statusText) statusText.textContent = `Demo Mode: ${this.demoMode ? 'ON' : 'OFF'}`;
        if (toggleBtn) toggleBtn.textContent = this.demoMode ? 'Exit Demo' : 'Start Demo';

        if (this.demoMode) {
            this.activateDemoMode();
        } else {
            this.deactivateDemoMode();
        }

        console.log(`🎯 Demo mode ${this.demoMode ? 'activated' : 'deactivated'}`);
    }

    togglePresentationMode() {
        this.presentationMode = !this.presentationMode;
        const dashboard = document.querySelector('.live-dashboard');
        
        if (dashboard) {
            dashboard.classList.toggle('presentation-mode', this.presentationMode);
        }

        if (this.presentationMode) {
            // Adjust main content for presentation
            document.body.style.paddingTop = '120px';
        } else {
            document.body.style.paddingTop = '0';
        }

        console.log(`📊 Presentation mode ${this.presentationMode ? 'activated' : 'deactivated'}`);
    }

    activateDemoMode() {
        // Enable demo features
        this.startDemoUpdates();
        
        // Show demo notifications
        if (window.safeNotify) {
            window.safeNotify('🎯 Demo mode activated - All systems optimized for presentation', 'success');
        }

        // Emit demo mode event
        const event = new CustomEvent('demoModeActivated', {
            detail: { sampleData: this.sampleData }
        });
        document.dispatchEvent(event);
    }

    deactivateDemoMode() {
        // Disable demo features
        this.stopDemoUpdates();
        
        // Show demo notifications
        if (window.safeNotify) {
            window.safeNotify('Demo mode deactivated', 'info');
        }

        // Emit demo mode event
        const event = new CustomEvent('demoModeDeactivated');
        document.dispatchEvent(event);
    }

    runScenario(scenarioId) {
        const scenario = this.demoScenarios.find(s => s.id === scenarioId);
        if (!scenario) return;

        console.log(`🎬 Running scenario: ${scenario.name}`);
        
        // Show scenario notification
        if (window.safeNotify) {
            window.safeNotify(`🎬 Running scenario: ${scenario.name}`, 'info');
        }

        // Execute scenario steps with realistic timing
        this.executeScenarioSteps(scenario.script);
    }

    async executeScenarioSteps(steps) {
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            
            // Wait between steps for realistic timing
            if (i > 0) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            await this.executeScenarioStep(step);
        }
    }

    async executeScenarioStep(step) {
        switch (step.type) {
            case 'incoming_call':
                // Simulate incoming call
                const callEvent = new CustomEvent('callReceived', {
                    detail: { callerNumber: step.data.number }
                });
                document.dispatchEvent(callEvent);
                break;

            case 'customer_message':
                // Show customer message
                this.displayConversationMessage('customer', step.text);
                break;

            case 'ai_response':
                // Show AI response
                this.displayConversationMessage('ai', step.text);
                break;

            case 'language_detection':
                // Show language switch
                if (window.multiLanguageSupport) {
                    window.multiLanguageSupport.switchLanguage(step.language);
                }
                break;

            case 'customer_recognition':
                // Show customer recognition
                const recognitionEvent = new CustomEvent('customerRecognized', {
                    detail: {
                        recognized: true,
                        customer: { name: step.customer, vipStatus: step.vip }
                    }
                });
                document.dispatchEvent(recognitionEvent);
                break;

            case 'booking_complete':
                // Complete booking
                const bookingEvent = new CustomEvent('bookingCompleted', {
                    detail: { booking: step.data }
                });
                document.dispatchEvent(bookingEvent);
                break;
        }
    }

    displayConversationMessage(sender, text) {
        // Create or update conversation display
        let conversationDisplay = document.querySelector('.demo-conversation');
        
        if (!conversationDisplay) {
            conversationDisplay = document.createElement('div');
            conversationDisplay.className = 'demo-conversation';
            conversationDisplay.innerHTML = `
                <div class="conversation-header">
                    <h3>🗨️ Live Conversation</h3>
                    <button onclick="this.parentElement.parentElement.remove()">✕</button>
                </div>
                <div class="conversation-messages"></div>
            `;
            document.body.appendChild(conversationDisplay);
            this.addConversationStyles();
        }

        const messagesContainer = conversationDisplay.querySelector('.conversation-messages');
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}-message`;
        messageElement.innerHTML = `
            <div class="message-sender">${sender === 'customer' ? '👤 Customer' : '🤖 AI Assistant'}</div>
            <div class="message-text">${text}</div>
        `;
        
        messagesContainer.appendChild(messageElement);
        messageElement.scrollIntoView({ behavior: 'smooth' });
    }

    addConversationStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .demo-conversation {
                position: fixed;
                bottom: 20px;
                right: 440px;
                width: 400px;
                max-height: 500px;
                background: white;
                border-radius: 16px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
                z-index: 9998;
                overflow: hidden;
            }

            .conversation-header {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
                padding: 16px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .conversation-header h3 {
                margin: 0;
                font-size: 16px;
            }

            .conversation-header button {
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                padding: 4px;
            }

            .conversation-messages {
                padding: 16px;
                max-height: 400px;
                overflow-y: auto;
            }

            .message {
                margin-bottom: 16px;
                padding: 12px 16px;
                border-radius: 12px;
                animation: slideIn 0.3s ease;
            }

            .customer-message {
                background: #eff6ff;
                border-left: 4px solid #3b82f6;
            }

            .ai-message {
                background: #ecfdf5;
                border-left: 4px solid #10b981;
            }

            .message-sender {
                font-size: 12px;
                font-weight: 600;
                margin-bottom: 6px;
                color: #6b7280;
            }

            .message-text {
                color: #1f2937;
                line-height: 1.5;
            }

            @keyframes slideIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);
    }

    startLiveUpdates() {
        // Simulate live metrics updates
        this.updateInterval = setInterval(() => {
            if (this.demoMode) {
                this.updateLiveMetrics();
            }
        }, 5000);
    }

    startDemoUpdates() {
        // More frequent updates in demo mode
        this.demoUpdateInterval = setInterval(() => {
            this.updateCallMetrics();
            this.simulateActivity();
        }, 3000);
    }

    stopDemoUpdates() {
        if (this.demoUpdateInterval) {
            clearInterval(this.demoUpdateInterval);
            this.demoUpdateInterval = null;
        }
    }

    updateLiveMetrics() {
        // Update current calls with some variation
        const currentCalls = Math.max(0, this.sampleData.liveMetrics.currentCalls + (Math.random() > 0.5 ? 1 : -1));
        this.sampleData.liveMetrics.currentCalls = currentCalls;

        // Update display
        const callsElement = document.querySelector('.live-calls');
        if (callsElement) {
            callsElement.textContent = currentCalls;
        }
    }

    updateCallMetrics() {
        // Increment call counters
        this.sampleData.todaysStats.callsReceived += Math.floor(Math.random() * 3);
        this.sampleData.todaysStats.reservationsBooked += Math.floor(Math.random() * 2);

        // Update displays
        const metrics = document.querySelectorAll('.metric-value');
        if (metrics.length >= 2) {
            metrics[0].textContent = this.sampleData.todaysStats.callsReceived;
            metrics[1].textContent = this.sampleData.todaysStats.reservationsBooked;
        }
    }

    simulateActivity() {
        // Add new booking to recent activity
        const newBooking = {
            time: 'Just now',
            customer: this.getRandomCustomerName(),
            party: Math.floor(Math.random() * 6) + 2,
            date: this.getRandomDate(),
            language: this.getRandomLanguage(),
            special: this.getRandomSpecialRequest()
        };

        // Update the recent bookings
        this.sampleData.recentBookings.unshift(newBooking);
        this.sampleData.recentBookings = this.sampleData.recentBookings.slice(0, 5);

        // Update display if visible
        this.refreshActivityFeed();
    }

    refreshActivityFeed() {
        const activityFeed = document.querySelector('.activity-feed');
        if (activityFeed) {
            activityFeed.innerHTML = this.sampleData.recentBookings.map(booking => `
                <div class="activity-item">
                    <div class="activity-time">${booking.time}</div>
                    <div class="activity-details">
                        <strong>${booking.customer}</strong> (${booking.party} guests)
                        <div class="activity-meta">${booking.date} • ${booking.language} • ${booking.special}</div>
                    </div>
                </div>
            `).join('');
        }
    }

    getRandomCustomerName() {
        const names = ['Jennifer Wilson', 'Michael Brown', 'Sarah Davis', 'Robert Miller', 'Emily Anderson', 'James Taylor', 'Lisa Moore', 'David Jackson'];
        return names[Math.floor(Math.random() * names.length)];
    }

    getRandomDate() {
        const dates = ['Tonight 7:30 PM', 'Tomorrow 6:00 PM', 'Friday 8:00 PM', 'Saturday 7:00 PM'];
        return dates[Math.floor(Math.random() * dates.length)];
    }

    getRandomLanguage() {
        const languages = ['English', 'Spanish', 'French', 'English', 'English']; // English more likely
        return languages[Math.floor(Math.random() * languages.length)];
    }

    getRandomSpecialRequest() {
        const requests = ['Birthday celebration', 'Business dinner', 'Anniversary', 'Vegetarian menu', 'Gluten-free options', 'Wine pairing', 'Quiet table'];
        return requests[Math.floor(Math.random() * requests.length)];
    }

    optimizeForDemo() {
        // Optimize performance for smooth demo experience
        console.log('⚡ Optimizing performance for demo...');

        // Preload critical resources
        this.preloadDemoAssets();

        // Reduce animation delays for snappier feel
        document.documentElement.style.setProperty('--transition-speed', '0.15s');

        // Add demo-specific optimizations
        if (window.performance && window.performance.mark) {
            window.performance.mark('demo-optimized');
        }
    }

    preloadDemoAssets() {
        // Preload any demo-specific assets
        // This ensures smooth transitions during presentation
        console.log('📦 Demo assets preloaded');
    }

    resetDemo() {
        // Reset all demo data to initial state
        this.createSampleData();
        this.refreshActivityFeed();
        
        // Reset counters
        const metrics = document.querySelectorAll('.metric-value');
        if (metrics.length >= 4) {
            metrics[0].textContent = this.sampleData.todaysStats.callsReceived;
            metrics[1].textContent = this.sampleData.todaysStats.reservationsBooked;
            metrics[2].textContent = this.sampleData.todaysStats.averageCallTime;
            metrics[3].textContent = this.sampleData.todaysStats.customerSatisfaction;
        }

        // Clear conversation display
        const conversation = document.querySelector('.demo-conversation');
        if (conversation) {
            conversation.remove();
        }

        if (window.safeNotify) {
            window.safeNotify('🔄 Demo reset to initial state', 'info');
        }

        console.log('🔄 Demo reset complete');
    }

    getStatus() {
        return {
            demoMode: this.demoMode,
            presentationMode: this.presentationMode,
            scenarios: this.demoScenarios.length,
            sampleCustomers: this.sampleData.recentBookings.length
        };
    }
}

// Initialize demo system
window.demoSystem = new DemoPreparationSystem();

// Export for module environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DemoPreparationSystem;
}

console.log('🎯 Demo Preparation System loaded');