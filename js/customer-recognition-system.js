/**
 * Customer Recognition System
 * Identifies returning customers and personalizes interactions
 * based on call history and preferences
 */

class CustomerRecognitionSystem {
    constructor() {
        this.customers = new Map();
        this.callHistory = [];
        this.recognitionEnabled = true;
        this.init();
    }

    async init() {
        console.log('👤 Initializing Customer Recognition System...');
        await this.loadCustomerData();
        this.setupRecognitionHandlers();
        this.createSampleCustomers();
        console.log('✅ Customer Recognition System ready');
    }

    async loadCustomerData() {
        // Load existing customer data from localStorage
        const savedCustomers = window.safeLocalStorage.getItem('customer-database', {});
        const savedHistory = window.safeLocalStorage.getItem('call-history', []);

        // Convert saved data to Maps
        for (const [phone, customerData] of Object.entries(savedCustomers)) {
            this.customers.set(phone, customerData);
        }

        this.callHistory = savedHistory;
        console.log(`📊 Loaded ${this.customers.size} customers and ${this.callHistory.length} call records`);
    }

    createSampleCustomers() {
        // Create sample customers for demo purposes
        const sampleCustomers = [
            {
                phone: '+1-555-0123',
                name: 'John Smith',
                email: 'john.smith@email.com',
                preferences: {
                    seating: 'window table',
                    dietary: 'no allergies',
                    language: 'en'
                },
                visitHistory: [
                    { date: '2024-03-15', partySize: 2, occasion: 'date night' },
                    { date: '2024-03-22', partySize: 4, occasion: 'family dinner' }
                ],
                totalVisits: 5,
                averageSpend: 85.50,
                lastVisit: '2024-03-22',
                vipStatus: true,
                notes: 'Prefers table 15, always orders wine pairing'
            },
            {
                phone: '+1-555-0456',
                name: 'Maria Garcia',
                email: 'maria.garcia@email.com',
                preferences: {
                    seating: 'quiet corner',
                    dietary: 'vegetarian',
                    language: 'es'
                },
                visitHistory: [
                    { date: '2024-03-10', partySize: 6, occasion: 'birthday' },
                    { date: '2024-03-18', partySize: 2, occasion: 'lunch meeting' }
                ],
                totalVisits: 8,
                averageSpend: 65.75,
                lastVisit: '2024-03-18',
                vipStatus: false,
                notes: 'Regular lunch customer, prefers early seating'
            },
            {
                phone: '+1-555-0789',
                name: 'David Chen',
                email: 'david.chen@email.com',
                preferences: {
                    seating: 'booth',
                    dietary: 'no spicy food',
                    language: 'zh'
                },
                visitHistory: [
                    { date: '2024-03-12', partySize: 3, occasion: 'business dinner' },
                    { date: '2024-03-19', partySize: 2, occasion: 'casual dining' }
                ],
                totalVisits: 3,
                averageSpend: 120.00,
                lastVisit: '2024-03-19',
                vipStatus: false,
                notes: 'Businessman, prefers quick service'
            },
            {
                phone: '+1-555-0321',
                name: 'Sophie Laurent',
                email: 'sophie.laurent@email.com',
                preferences: {
                    seating: 'patio',
                    dietary: 'gluten-free',
                    language: 'fr'
                },
                visitHistory: [
                    { date: '2024-03-14', partySize: 4, occasion: 'anniversary' },
                    { date: '2024-03-20', partySize: 2, occasion: 'romantic dinner' }
                ],
                totalVisits: 6,
                averageSpend: 95.25,
                lastVisit: '2024-03-20',
                vipStatus: true,
                notes: 'Wine enthusiast, celebrates anniversary here'
            }
        ];

        // Add sample customers if not already present
        sampleCustomers.forEach(customer => {
            if (!this.customers.has(customer.phone)) {
                this.customers.set(customer.phone, customer);
            }
        });

        this.saveCustomerData();
        console.log('👥 Sample customer database created');
    }

    recognizeCustomer(phoneNumber) {
        // Clean phone number format
        const cleanPhone = this.cleanPhoneNumber(phoneNumber);
        
        if (this.customers.has(cleanPhone)) {
            const customer = this.customers.get(cleanPhone);
            console.log(`👋 Recognized returning customer: ${customer.name}`);
            
            // Log the recognition
            this.logCustomerInteraction(cleanPhone, 'recognition');
            
            return {
                recognized: true,
                customer: customer,
                greeting: this.generatePersonalizedGreeting(customer),
                suggestions: this.generateSuggestions(customer)
            };
        }

        console.log('❓ New customer - phone not recognized:', cleanPhone);
        return {
            recognized: false,
            customer: null,
            greeting: null,
            suggestions: []
        };
    }

    generatePersonalizedGreeting(customer) {
        const greetings = [
            `Welcome back, ${customer.name}! Great to hear from you again.`,
            `Hello ${customer.name}! How can we help you today?`,
            `Hi ${customer.name}! Thanks for calling us again.`
        ];

        let greeting = greetings[Math.floor(Math.random() * greetings.length)];

        // Add VIP recognition
        if (customer.vipStatus) {
            greeting += " As one of our VIP guests, we'll make sure everything is perfect for you.";
        }

        // Add visit frequency acknowledgment
        if (customer.totalVisits > 5) {
            greeting += ` We really appreciate your loyalty - this is your ${customer.totalVisits + 1}th visit with us!`;
        }

        // Add last visit reference
        if (customer.lastVisit) {
            const daysSince = this.daysSinceLastVisit(customer.lastVisit);
            if (daysSince < 30) {
                greeting += ` It's been ${daysSince} days since your last visit.`;
            }
        }

        return greeting;
    }

    generateSuggestions(customer) {
        const suggestions = [];

        // Seating preference
        if (customer.preferences.seating) {
            suggestions.push(`Would you like your usual ${customer.preferences.seating}?`);
        }

        // Previous party size
        const recentVisit = customer.visitHistory[customer.visitHistory.length - 1];
        if (recentVisit) {
            suggestions.push(`Same as last time - table for ${recentVisit.partySize}?`);
        }

        // Dietary preferences
        if (customer.preferences.dietary && customer.preferences.dietary !== 'no allergies') {
            suggestions.push(`I have your dietary preference noted: ${customer.preferences.dietary}`);
        }

        // Special occasions
        if (customer.notes && customer.notes.includes('anniversary')) {
            const today = new Date();
            const month = today.getMonth();
            const day = today.getDate();
            suggestions.push(`Is this another special occasion? We'd love to make it memorable!`);
        }

        return suggestions;
    }

    addNewCustomer(customerData) {
        const cleanPhone = this.cleanPhoneNumber(customerData.phone);
        
        const newCustomer = {
            phone: cleanPhone,
            name: customerData.name || 'Guest',
            email: customerData.email || '',
            preferences: {
                seating: customerData.seatingPreference || '',
                dietary: customerData.dietaryRestrictions || '',
                language: customerData.language || 'en'
            },
            visitHistory: [],
            totalVisits: 0,
            averageSpend: 0,
            lastVisit: new Date().toISOString().split('T')[0],
            vipStatus: false,
            notes: customerData.notes || ''
        };

        this.customers.set(cleanPhone, newCustomer);
        this.saveCustomerData();
        
        console.log(`👤 Added new customer: ${newCustomer.name} (${cleanPhone})`);
        return newCustomer;
    }

    updateCustomerPreferences(phoneNumber, preferences) {
        const cleanPhone = this.cleanPhoneNumber(phoneNumber);
        const customer = this.customers.get(cleanPhone);
        
        if (customer) {
            customer.preferences = { ...customer.preferences, ...preferences };
            this.customers.set(cleanPhone, customer);
            this.saveCustomerData();
            console.log(`📝 Updated preferences for ${customer.name}`);
        }
    }

    logVisit(phoneNumber, visitData) {
        const cleanPhone = this.cleanPhoneNumber(phoneNumber);
        const customer = this.customers.get(cleanPhone);
        
        if (customer) {
            const visit = {
                date: new Date().toISOString().split('T')[0],
                partySize: visitData.partySize || 1,
                occasion: visitData.occasion || 'dining',
                spend: visitData.spend || 0
            };

            customer.visitHistory.push(visit);
            customer.totalVisits = customer.visitHistory.length;
            customer.lastVisit = visit.date;

            // Update average spend
            const totalSpend = customer.visitHistory.reduce((sum, v) => sum + (v.spend || 0), 0);
            customer.averageSpend = totalSpend / customer.visitHistory.length;

            // Update VIP status based on visits and spending
            if (customer.totalVisits >= 5 && customer.averageSpend >= 75) {
                customer.vipStatus = true;
            }

            this.customers.set(cleanPhone, customer);
            this.saveCustomerData();
            
            console.log(`📈 Logged visit for ${customer.name}: ${visit.partySize} people, $${visit.spend}`);
        }
    }

    logCustomerInteraction(phoneNumber, interactionType, details = {}) {
        const interaction = {
            timestamp: new Date().toISOString(),
            phone: phoneNumber,
            type: interactionType,
            details: details
        };

        this.callHistory.push(interaction);
        
        // Keep only last 1000 interactions
        if (this.callHistory.length > 1000) {
            this.callHistory = this.callHistory.slice(-1000);
        }

        this.saveCallHistory();
    }

    getCustomerAnalytics() {
        const analytics = {
            totalCustomers: this.customers.size,
            vipCustomers: Array.from(this.customers.values()).filter(c => c.vipStatus).length,
            averageVisitsPerCustomer: 0,
            totalInteractions: this.callHistory.length,
            languageBreakdown: {},
            dietaryBreakdown: {},
            seatingBreakdown: {}
        };

        // Calculate averages and breakdowns
        let totalVisits = 0;
        for (const customer of this.customers.values()) {
            totalVisits += customer.totalVisits;

            // Language breakdown
            const lang = customer.preferences.language || 'en';
            analytics.languageBreakdown[lang] = (analytics.languageBreakdown[lang] || 0) + 1;

            // Dietary breakdown
            const dietary = customer.preferences.dietary || 'none';
            analytics.dietaryBreakdown[dietary] = (analytics.dietaryBreakdown[dietary] || 0) + 1;

            // Seating breakdown
            const seating = customer.preferences.seating || 'no preference';
            analytics.seatingBreakdown[seating] = (analytics.seatingBreakdown[seating] || 0) + 1;
        }

        analytics.averageVisitsPerCustomer = analytics.totalCustomers > 0 ? 
            (totalVisits / analytics.totalCustomers).toFixed(2) : 0;

        return analytics;
    }

    searchCustomers(query) {
        const results = [];
        const searchLower = query.toLowerCase();

        for (const customer of this.customers.values()) {
            if (customer.name.toLowerCase().includes(searchLower) ||
                customer.phone.includes(query) ||
                customer.email.toLowerCase().includes(searchLower)) {
                results.push(customer);
            }
        }

        return results;
    }

    cleanPhoneNumber(phone) {
        // Remove all non-digit characters except +
        return phone.replace(/[^\d+]/g, '');
    }

    daysSinceLastVisit(lastVisitDate) {
        const today = new Date();
        const lastVisit = new Date(lastVisitDate);
        const diffTime = Math.abs(today - lastVisit);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    saveCustomerData() {
        const customerObj = {};
        for (const [phone, customer] of this.customers) {
            customerObj[phone] = customer;
        }
        window.safeLocalStorage.setItem('customer-database', customerObj);
    }

    saveCallHistory() {
        window.safeLocalStorage.setItem('call-history', this.callHistory);
    }

    // Integration methods for the conversation system
    setupRecognitionHandlers() {
        // Listen for incoming calls
        document.addEventListener('callReceived', (event) => {
            const { callerNumber } = event.detail;
            if (callerNumber && this.recognitionEnabled) {
                const recognition = this.recognizeCustomer(callerNumber);
                
                // Emit recognition result
                const recognitionEvent = new CustomEvent('customerRecognized', {
                    detail: recognition
                });
                document.dispatchEvent(recognitionEvent);
            }
        });

        // Listen for booking completions to update customer data
        document.addEventListener('bookingCompleted', (event) => {
            const { booking } = event.detail;
            if (booking.phone) {
                const customer = this.customers.get(this.cleanPhoneNumber(booking.phone));
                if (!customer) {
                    // New customer
                    this.addNewCustomer({
                        phone: booking.phone,
                        name: booking.name,
                        seatingPreference: booking.seatingPreference,
                        dietaryRestrictions: booking.dietaryRestrictions
                    });
                } else {
                    // Update existing customer
                    this.logVisit(booking.phone, {
                        partySize: booking.partySize,
                        occasion: booking.occasion || 'reservation'
                    });
                }
            }
        });
    }

    createCustomerDashboard() {
        const dashboard = document.createElement('div');
        dashboard.className = 'customer-dashboard';
        dashboard.innerHTML = `
            <div class="dashboard-header">
                <h3>👤 Customer Recognition Dashboard</h3>
                <button class="toggle-recognition" onclick="customerRecognition.toggleRecognition()">
                    ${this.recognitionEnabled ? 'Disable' : 'Enable'} Recognition
                </button>
            </div>
            <div class="dashboard-content">
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${this.customers.size}</div>
                        <div class="stat-label">Total Customers</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${Array.from(this.customers.values()).filter(c => c.vipStatus).length}</div>
                        <div class="stat-label">VIP Customers</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${this.callHistory.length}</div>
                        <div class="stat-label">Total Interactions</div>
                    </div>
                </div>
                <div class="customer-search">
                    <input type="text" id="customer-search" placeholder="Search customers..." />
                    <div id="search-results"></div>
                </div>
            </div>
        `;

        // Add to main container
        const container = document.querySelector('.main-container') || document.body;
        container.appendChild(dashboard);

        // Setup search
        const searchInput = dashboard.querySelector('#customer-search');
        const resultsDiv = dashboard.querySelector('#search-results');

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value;
            if (query.length >= 2) {
                const results = this.searchCustomers(query);
                resultsDiv.innerHTML = results.map(customer => `
                    <div class="customer-result">
                        <div class="customer-name">${customer.name} ${customer.vipStatus ? '⭐' : ''}</div>
                        <div class="customer-details">${customer.phone} • ${customer.totalVisits} visits</div>
                    </div>
                `).join('');
            } else {
                resultsDiv.innerHTML = '';
            }
        });

        this.addCustomerDashboardStyles();
    }

    addCustomerDashboardStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .customer-dashboard {
                position: fixed;
                bottom: 20px;
                left: 20px;
                width: 350px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
                overflow: hidden;
                z-index: 999;
            }

            .dashboard-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 16px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .dashboard-header h3 {
                margin: 0;
                font-size: 16px;
            }

            .toggle-recognition {
                background: rgba(255, 255, 255, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.3);
                color: white;
                padding: 6px 12px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
            }

            .stats-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 1px;
                background: #f3f4f6;
            }

            .stat-card {
                background: white;
                padding: 16px;
                text-align: center;
            }

            .stat-value {
                font-size: 24px;
                font-weight: bold;
                color: #1f2937;
            }

            .stat-label {
                font-size: 12px;
                color: #6b7280;
                margin-top: 4px;
            }

            .customer-search {
                padding: 16px;
            }

            .customer-search input {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                font-size: 14px;
            }

            #search-results {
                max-height: 200px;
                overflow-y: auto;
                margin-top: 8px;
            }

            .customer-result {
                padding: 8px;
                border: 1px solid #e5e7eb;
                border-radius: 6px;
                margin-bottom: 4px;
                cursor: pointer;
            }

            .customer-result:hover {
                background: #f9fafb;
            }

            .customer-name {
                font-weight: 500;
                font-size: 14px;
            }

            .customer-details {
                font-size: 12px;
                color: #6b7280;
                margin-top: 2px;
            }
        `;
        document.head.appendChild(style);
    }

    toggleRecognition() {
        this.recognitionEnabled = !this.recognitionEnabled;
        console.log(`👤 Customer recognition ${this.recognitionEnabled ? 'enabled' : 'disabled'}`);
        
        // Update dashboard if it exists
        const toggleBtn = document.querySelector('.toggle-recognition');
        if (toggleBtn) {
            toggleBtn.textContent = `${this.recognitionEnabled ? 'Disable' : 'Enable'} Recognition`;
        }
    }

    getStatus() {
        return {
            enabled: this.recognitionEnabled,
            totalCustomers: this.customers.size,
            vipCustomers: Array.from(this.customers.values()).filter(c => c.vipStatus).length,
            totalInteractions: this.callHistory.length
        };
    }
}

// Initialize customer recognition system
window.customerRecognition = new CustomerRecognitionSystem();

// Create dashboard
setTimeout(() => {
    window.customerRecognition.createCustomerDashboard();
}, 2000);

// Export for module environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CustomerRecognitionSystem;
}

console.log('👤 Customer Recognition System loaded');