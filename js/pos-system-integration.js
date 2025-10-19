/**
 * POS System Integration
 * Connects with popular restaurant POS systems for real-time menu, pricing, and inventory data
 * Supports Square, Toast, Resy, OpenTable, and custom integrations
 */

class POSSystemIntegration {
    constructor() {
        this.connectedSystems = new Map();
        this.menuCache = new Map();
        this.inventoryCache = new Map();
        this.priceCache = new Map();
        this.availabilityCache = new Map();
        this.syncInterval = null;
        this.lastSync = null;
        this.webhookListeners = new Map();
        this.init();
    }

    async init() {
        console.log('🏪 Initializing POS System Integration...');
        
        // Load POS configurations
        await this.loadPOSConfigurations();
        
        // Initialize supported systems
        this.initializeSupportedSystems();
        
        // Setup webhook endpoints
        this.setupWebhookHandlers();
        
        // Create sample data for demo
        this.createSamplePOSData();
        
        // Start real-time sync
        this.startRealTimeSync();
        
        // Setup UI components
        this.createPOSInterface();
        
        console.log('✅ POS System Integration ready');
    }

    initializeSupportedSystems() {
        // Square POS Integration
        this.connectedSystems.set('square', {
            name: 'Square POS',
            status: 'connected',
            apiEndpoint: 'https://connect.squareup.com/v2/',
            features: ['menu', 'inventory', 'orders', 'payments'],
            lastSync: new Date(),
            connection: this.createSquareConnection()
        });

        // Toast POS Integration  
        this.connectedSystems.set('toast', {
            name: 'Toast POS',
            status: 'connected',
            apiEndpoint: 'https://ws-api.toasttab.com/',
            features: ['menu', 'inventory', 'orders', 'tables'],
            lastSync: new Date(),
            connection: this.createToastConnection()
        });

        // Resy Integration
        this.connectedSystems.set('resy', {
            name: 'Resy',
            status: 'connected',
            apiEndpoint: 'https://api.resy.com/3/',
            features: ['reservations', 'availability', 'customer'],
            lastSync: new Date(),
            connection: this.createResyConnection()
        });

        // OpenTable Integration
        this.connectedSystems.set('opentable', {
            name: 'OpenTable',
            status: 'connected',
            apiEndpoint: 'https://platform.otrestaurant.com/v1/',
            features: ['reservations', 'availability', 'reviews'],
            lastSync: new Date(),
            connection: this.createOpenTableConnection()
        });

        // Custom POS Integration
        this.connectedSystems.set('custom', {
            name: 'Custom POS',
            status: 'available',
            apiEndpoint: 'configurable',
            features: ['all'],
            lastSync: null,
            connection: this.createCustomConnection()
        });
    }

    createSquareConnection() {
        return {
            async getMenu() {
                // Simulate Square API call
                return {
                    categories: [
                        {
                            id: 'appetizers',
                            name: 'Appetizers',
                            items: [
                                { id: 'bruschetta', name: 'Bruschetta Trio', price: 1250, available: true, description: 'Three varieties with tomato, mushroom, and olive tapenade' },
                                { id: 'calamari', name: 'Crispy Calamari', price: 1450, available: true, description: 'Golden fried with marinara and aioli' },
                                { id: 'charcuterie', name: 'Charcuterie Board', price: 2200, available: false, description: 'Selection of cured meats and artisan cheeses' }
                            ]
                        },
                        {
                            id: 'entrees',
                            name: 'Entrees',
                            items: [
                                { id: 'salmon', name: 'Grilled Atlantic Salmon', price: 2800, available: true, description: 'With lemon herb butter and seasonal vegetables' },
                                { id: 'ribeye', name: 'Prime Ribeye Steak', price: 4200, available: true, description: '16oz dry-aged with garlic mashed potatoes' },
                                { id: 'pasta_special', name: 'Lobster Ravioli', price: 3200, available: false, description: 'House-made pasta with lobster in cream sauce' }
                            ]
                        }
                    ],
                    lastUpdated: new Date()
                };
            },

            async getInventory() {
                return {
                    items: [
                        { id: 'salmon', quantity: 12, lowStockThreshold: 5 },
                        { id: 'ribeye', quantity: 8, lowStockThreshold: 3 },
                        { id: 'lobster', quantity: 0, lowStockThreshold: 2 },
                        { id: 'charcuterie_items', quantity: 2, lowStockThreshold: 5 }
                    ],
                    lastUpdated: new Date()
                };
            },

            async updateInventory(itemId, quantity) {
                console.log(`📦 Square: Updated ${itemId} inventory to ${quantity}`);
                return { success: true, newQuantity: quantity };
            }
        };
    }

    createToastConnection() {
        return {
            async getMenu() {
                return {
                    menus: [{
                        id: 'dinner',
                        name: 'Dinner Menu',
                        active: true,
                        sections: [
                            {
                                name: 'Starters',
                                items: [
                                    { id: 'soup', name: 'Soup of the Day', price: 950, available: true },
                                    { id: 'salad', name: 'Caesar Salad', price: 1200, available: true }
                                ]
                            }
                        ]
                    }],
                    lastModified: new Date()
                };
            },

            async getTableStatus() {
                return {
                    tables: [
                        { id: 'table_1', seats: 2, status: 'available', reservedAt: null },
                        { id: 'table_2', seats: 4, status: 'occupied', reservedAt: '2024-10-09T19:00:00Z' },
                        { id: 'table_3', seats: 6, status: 'reserved', reservedAt: '2024-10-09T20:00:00Z' }
                    ],
                    lastUpdated: new Date()
                };
            }
        };
    }

    createResyConnection() {
        return {
            async getAvailability(date, partySize) {
                const slots = [];
                const startHour = 17; // 5 PM
                const endHour = 22;   // 10 PM
                
                for (let hour = startHour; hour <= endHour; hour++) {
                    for (let minute = 0; minute < 60; minute += 30) {
                        const available = Math.random() > 0.3; // 70% chance available
                        if (available) {
                            slots.push({
                                time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
                                available: true,
                                partySize,
                                tableType: partySize <= 2 ? 'intimate' : partySize <= 4 ? 'standard' : 'large'
                            });
                        }
                    }
                }
                
                return { availableSlots: slots, date };
            },

            async createReservation(reservationData) {
                const reservation = {
                    id: `resy_${Date.now()}`,
                    ...reservationData,
                    status: 'confirmed',
                    confirmationCode: this.generateConfirmationCode(),
                    createdAt: new Date()
                };
                
                console.log('🎫 Resy: Created reservation', reservation);
                return reservation;
            }
        };
    }

    createOpenTableConnection() {
        return {
            async searchAvailability(criteria) {
                return {
                    restaurant: {
                        id: 'restaurant_123',
                        name: 'Bella Vista Restaurant'
                    },
                    availability: [
                        { time: '18:00', available: true, tableSize: criteria.partySize },
                        { time: '18:30', available: false, tableSize: criteria.partySize },
                        { time: '19:00', available: true, tableSize: criteria.partySize },
                        { time: '19:30', available: true, tableSize: criteria.partySize },
                        { time: '20:00', available: false, tableSize: criteria.partySize }
                    ],
                    date: criteria.date
                };
            },

            async getReviews(limit = 10) {
                return {
                    reviews: [
                        {
                            id: 'review_1',
                            rating: 5,
                            title: 'Outstanding Experience',
                            content: 'Exceptional service and amazing food. The AI phone system made booking so easy!',
                            author: 'Jennifer M.',
                            date: '2024-10-08',
                            verified: true
                        },
                        {
                            id: 'review_2', 
                            rating: 4,
                            title: 'Great Food, Easy Booking',
                            content: 'Love the new phone system - understood my request perfectly.',
                            author: 'Michael R.',
                            date: '2024-10-07',
                            verified: true
                        }
                    ],
                    averageRating: 4.7,
                    totalReviews: 247
                };
            }
        };
    }

    createCustomConnection() {
        return {
            configure(config) {
                this.config = config;
                console.log('🔧 Custom POS configured:', config);
            },

            async makeRequest(endpoint, options = {}) {
                // Generic API request handler for custom POS systems
                console.log(`🌐 Custom POS request to ${endpoint}`, options);
                return { success: true, data: {} };
            }
        };
    }

    async loadPOSConfigurations() {
        // Load saved POS system configurations
        const savedConfigs = localStorage.getItem('posConfigurations');
        if (savedConfigs) {
            try {
                const configs = JSON.parse(savedConfigs);
                console.log('📋 Loaded saved POS configurations', configs);
            } catch (error) {
                console.error('❌ Error loading POS configurations:', error);
            }
        }
    }

    setupWebhookHandlers() {
        // Setup webhook endpoints for real-time POS updates
        this.webhookListeners.set('menu_update', (data) => {
            console.log('🍽️ Menu update received:', data);
            this.handleMenuUpdate(data);
        });

        this.webhookListeners.set('inventory_update', (data) => {
            console.log('📦 Inventory update received:', data);
            this.handleInventoryUpdate(data);
        });

        this.webhookListeners.set('table_status', (data) => {
            console.log('🪑 Table status update:', data);
            this.handleTableStatusUpdate(data);
        });

        // Simulate webhook events for demo
        if (window.demoSystem?.demoMode) {
            this.startWebhookSimulation();
        }
    }

    startWebhookSimulation() {
        // Simulate real-time POS updates for demo
        setInterval(() => {
            if (window.demoSystem?.demoMode) {
                this.simulateInventoryUpdate();
                this.simulateTableStatusUpdate();
            }
        }, 15000); // Every 15 seconds
    }

    simulateInventoryUpdate() {
        const items = ['salmon', 'ribeye', 'lobster', 'vegetables'];
        const item = items[Math.floor(Math.random() * items.length)];
        const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
        
        const update = {
            itemId: item,
            quantityChange: change,
            newQuantity: Math.max(0, Math.floor(Math.random() * 20)),
            timestamp: new Date(),
            source: 'square'
        };
        
        this.handleInventoryUpdate(update);
    }

    simulateTableStatusUpdate() {
        const tables = ['table_1', 'table_2', 'table_3', 'table_4', 'table_5'];
        const statuses = ['available', 'occupied', 'reserved', 'cleaning'];
        
        const update = {
            tableId: tables[Math.floor(Math.random() * tables.length)],
            status: statuses[Math.floor(Math.random() * statuses.length)],
            timestamp: new Date(),
            source: 'toast'
        };
        
        this.handleTableStatusUpdate(update);
    }

    createSamplePOSData() {
        // Create realistic sample data for demonstrations
        this.sampleData = {
            currentMenu: {
                lastUpdated: new Date(),
                categories: [
                    {
                        name: 'Appetizers',
                        items: [
                            { name: 'Truffle Arancini', price: '$16', available: true, popular: true },
                            { name: 'Burrata & Prosciutto', price: '$18', available: true },
                            { name: 'Octopus Carpaccio', price: '$22', available: false, reason: 'Out of octopus' }
                        ]
                    },
                    {
                        name: 'Main Courses', 
                        items: [
                            { name: 'Osso Buco', price: '$42', available: true, popular: true },
                            { name: 'Branzino', price: '$38', available: true },
                            { name: 'Wagyu Beef', price: '$65', available: true, limited: true }
                        ]
                    }
                ]
            },

            currentInventory: {
                lowStockItems: ['truffle oil', 'burrata cheese', 'octopus'],
                outOfStock: ['lobster tails', 'seasonal vegetables'],
                lastUpdated: new Date()
            },

            tableStatus: {
                available: 8,
                occupied: 15,
                reserved: 12,
                total: 35,
                nextAvailable: '7:30 PM',
                peakTime: '8:00-9:00 PM'
            },

            realTimeMetrics: {
                ordersToday: 127,
                averageTicket: '$85',
                topSellingItem: 'Osso Buco',
                currentWaitTime: '25 minutes',
                kitchenBacklog: 8
            }
        };
    }

    async syncWithPOS(systemId = 'all') {
        console.log(`🔄 Syncing with POS system: ${systemId}`);
        
        const systems = systemId === 'all' ? 
            Array.from(this.connectedSystems.keys()) : 
            [systemId];

        const syncResults = {};

        for (const system of systems) {
            const posSystem = this.connectedSystems.get(system);
            if (!posSystem || posSystem.status !== 'connected') continue;

            try {
                // Sync menu data
                if (posSystem.features.includes('menu')) {
                    const menuData = await posSystem.connection.getMenu();
                    this.menuCache.set(system, menuData);
                    syncResults[system] = { menu: 'success', lastSync: new Date() };
                }

                // Sync inventory data
                if (posSystem.features.includes('inventory')) {
                    const inventoryData = await posSystem.connection.getInventory?.();
                    if (inventoryData) {
                        this.inventoryCache.set(system, inventoryData);
                    }
                }

                // Update last sync time
                posSystem.lastSync = new Date();
                
            } catch (error) {
                console.error(`❌ Sync failed for ${system}:`, error);
                syncResults[system] = { error: error.message };
            }
        }

        this.lastSync = new Date();
        this.updateSyncStatus();
        
        // Emit sync complete event
        const syncEvent = new CustomEvent('posSyncComplete', {
            detail: { results: syncResults, timestamp: this.lastSync }
        });
        document.dispatchEvent(syncEvent);

        return syncResults;
    }

    async getMenuItems(filters = {}) {
        // Get menu items from all connected POS systems
        const allItems = [];
        
        for (const [systemId, menuData] of this.menuCache.entries()) {
            if (!menuData) continue;
            
            // Process different menu formats
            let items = [];
            if (menuData.categories) {
                // Square format
                items = menuData.categories.flatMap(cat => cat.items);
            } else if (menuData.menus) {
                // Toast format  
                items = menuData.menus.flatMap(menu => 
                    menu.sections.flatMap(section => section.items)
                );
            }
            
            // Apply filters
            if (filters.available) {
                items = items.filter(item => item.available);
            }
            if (filters.category) {
                items = items.filter(item => item.category === filters.category);
            }
            if (filters.priceRange) {
                items = items.filter(item => 
                    item.price >= filters.priceRange.min && 
                    item.price <= filters.priceRange.max
                );
            }
            
            allItems.push(...items.map(item => ({
                ...item,
                source: systemId,
                formattedPrice: this.formatPrice(item.price)
            })));
        }
        
        return allItems;
    }

    async getTableAvailability(date, partySize) {
        // Check table availability across all systems
        const availability = {};
        
        // Check Resy
        if (this.connectedSystems.has('resy')) {
            try {
                const resyAvail = await this.connectedSystems.get('resy').connection
                    .getAvailability(date, partySize);
                availability.resy = resyAvail.availableSlots;
            } catch (error) {
                console.error('❌ Resy availability error:', error);
            }
        }
        
        // Check OpenTable
        if (this.connectedSystems.has('opentable')) {
            try {
                const otAvail = await this.connectedSystems.get('opentable').connection
                    .searchAvailability({ date, partySize });
                availability.opentable = otAvail.availability;
            } catch (error) {
                console.error('❌ OpenTable availability error:', error);
            }
        }
        
        // Check Toast table status
        if (this.connectedSystems.has('toast')) {
            try {
                const tableStatus = await this.connectedSystems.get('toast').connection
                    .getTableStatus();
                availability.tables = tableStatus.tables;
            } catch (error) {
                console.error('❌ Toast table status error:', error);
            }
        }
        
        return availability;
    }

    async createReservation(reservationData) {
        // Create reservation using preferred POS system
        const preferredSystem = reservationData.preferredSystem || 'resy';
        
        if (!this.connectedSystems.has(preferredSystem)) {
            throw new Error(`POS system ${preferredSystem} not connected`);
        }
        
        const posSystem = this.connectedSystems.get(preferredSystem);
        const connection = posSystem.connection;
        
        try {
            const reservation = await connection.createReservation(reservationData);
            
            // Log to all connected systems for consistency
            await this.syncReservationToAllSystems(reservation);
            
            // Emit reservation created event
            const event = new CustomEvent('reservationCreated', {
                detail: { reservation, source: preferredSystem }
            });
            document.dispatchEvent(event);
            
            return reservation;
        } catch (error) {
            console.error(`❌ Reservation creation failed:`, error);
            throw error;
        }
    }

    async syncReservationToAllSystems(reservation) {
        // Sync new reservation to all connected systems
        const syncPromises = [];
        
        for (const [systemId, system] of this.connectedSystems.entries()) {
            if (system.features.includes('reservations')) {
                syncPromises.push(
                    this.syncReservationToSystem(reservation, systemId)
                );
            }
        }
        
        await Promise.allSettled(syncPromises);
    }

    async syncReservationToSystem(reservation, systemId) {
        try {
            const system = this.connectedSystems.get(systemId);
            if (system.connection.syncReservation) {
                await system.connection.syncReservation(reservation);
            }
            console.log(`✅ Synced reservation to ${systemId}`);
        } catch (error) {
            console.error(`❌ Failed to sync reservation to ${systemId}:`, error);
        }
    }

    handleMenuUpdate(data) {
        // Handle real-time menu updates
        console.log('🍽️ Processing menu update:', data);
        
        // Update cache
        const systemData = this.menuCache.get(data.source) || {};
        // Apply update logic based on data structure
        this.menuCache.set(data.source, { ...systemData, ...data.updates });
        
        // Notify UI
        const event = new CustomEvent('menuUpdated', {
            detail: { source: data.source, updates: data.updates }
        });
        document.dispatchEvent(event);
        
        // Update display
        this.updateMenuDisplay();
    }

    handleInventoryUpdate(data) {
        // Handle real-time inventory updates
        console.log('📦 Processing inventory update:', data);
        
        // Update cache
        const systemInventory = this.inventoryCache.get(data.source) || { items: [] };
        const itemIndex = systemInventory.items.findIndex(item => item.id === data.itemId);
        
        if (itemIndex >= 0) {
            systemInventory.items[itemIndex].quantity = data.newQuantity;
        } else {
            systemInventory.items.push({
                id: data.itemId,
                quantity: data.newQuantity,
                lastUpdated: data.timestamp
            });
        }
        
        this.inventoryCache.set(data.source, systemInventory);
        
        // Check for low stock alerts
        if (data.newQuantity <= 5) {
            this.showLowStockAlert(data.itemId, data.newQuantity);
        }
        
        // Notify systems
        const event = new CustomEvent('inventoryUpdated', {
            detail: data
        });
        document.dispatchEvent(event);
        
        this.updateInventoryDisplay();
    }

    handleTableStatusUpdate(data) {
        // Handle real-time table status updates
        console.log('🪑 Processing table status update:', data);
        
        // Update availability cache
        const availability = this.availabilityCache.get(data.source) || { tables: [] };
        const tableIndex = availability.tables.findIndex(table => table.id === data.tableId);
        
        if (tableIndex >= 0) {
            availability.tables[tableIndex].status = data.status;
            availability.tables[tableIndex].lastUpdated = data.timestamp;
        }
        
        this.availabilityCache.set(data.source, availability);
        
        // Notify UI
        const event = new CustomEvent('tableStatusUpdated', {
            detail: data
        });
        document.dispatchEvent(event);
        
        this.updateTableDisplay();
    }

    showLowStockAlert(itemId, quantity) {
        if (window.safeNotify) {
            window.safeNotify(
                `⚠️ Low Stock Alert: ${itemId} - Only ${quantity} remaining`,
                'warning'
            );
        }
    }

    startRealTimeSync() {
        // Start periodic sync with all POS systems
        this.syncInterval = setInterval(() => {
            this.syncWithPOS('all');
        }, 5 * 60 * 1000); // Every 5 minutes
        
        console.log('🔄 Real-time POS sync started');
    }

    stopRealTimeSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            console.log('⏹️ Real-time POS sync stopped');
        }
    }

    createPOSInterface() {
        // Create POS integration control panel
        const posPanel = document.createElement('div');
        posPanel.className = 'pos-control-panel';
        posPanel.innerHTML = `
            <div class="pos-header">
                <h2>🏪 POS Integration Control</h2>
                <div class="sync-status">
                    <span class="sync-indicator"></span>
                    <span>Last Sync: <span id="last-sync-time">Never</span></span>
                </div>
            </div>
            
            <div class="pos-content">
                <div class="pos-section">
                    <h3>Connected Systems</h3>
                    <div id="connected-systems" class="systems-list"></div>
                </div>
                
                <div class="pos-section">
                    <h3>Current Menu Status</h3>
                    <div id="menu-status" class="status-grid"></div>
                </div>
                
                <div class="pos-section">
                    <h3>Inventory Alerts</h3>
                    <div id="inventory-alerts" class="alerts-list"></div>
                </div>
                
                <div class="pos-section">
                    <h3>Table Availability</h3>
                    <div id="table-availability" class="table-grid"></div>
                </div>
                
                <div class="pos-actions">
                    <button id="sync-now-btn" class="pos-btn primary">Sync Now</button>
                    <button id="export-menu-btn" class="pos-btn">Export Menu</button>
                    <button id="pos-settings-btn" class="pos-btn">Settings</button>
                </div>
            </div>
        `;
        
        // Add styles
        this.addPOSStyles();
        
        // Add to page (hidden by default, shown when needed)
        posPanel.style.display = 'none';
        document.body.appendChild(posPanel);
        
        // Setup event listeners
        this.setupPOSEventListeners();
        
        // Initial display update
        this.updateAllDisplays();
        
        console.log('🎨 POS interface created');
    }

    addPOSStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .pos-control-panel {
                position: fixed;
                top: 50px;
                left: 50px;
                width: 500px;
                max-height: 80vh;
                background: white;
                border-radius: 16px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
                overflow: hidden;
                z-index: 9999;
                font-family: system-ui, -apple-system, sans-serif;
            }
            
            .pos-header {
                background: linear-gradient(135deg, #059669 0%, #047857 100%);
                color: white;
                padding: 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .pos-header h2 {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
            }
            
            .sync-status {
                font-size: 14px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .sync-indicator {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: #10b981;
                animation: pulse 2s infinite;
            }
            
            .pos-content {
                padding: 20px;
                max-height: 60vh;
                overflow-y: auto;
            }
            
            .pos-section {
                margin-bottom: 20px;
            }
            
            .pos-section h3 {
                margin: 0 0 12px 0;
                font-size: 16px;
                font-weight: 600;
                color: #1f2937;
            }
            
            .systems-list {
                display: grid;
                gap: 8px;
            }
            
            .system-card {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 12px;
                background: #f8fafc;
                border-radius: 8px;
                border-left: 4px solid #10b981;
            }
            
            .system-name {
                font-weight: 500;
                color: #1f2937;
            }
            
            .system-status {
                font-size: 12px;
                padding: 4px 8px;
                border-radius: 4px;
                background: #10b981;
                color: white;
            }
            
            .status-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 12px;
            }
            
            .status-item {
                padding: 12px;
                background: #f1f5f9;
                border-radius: 8px;
                text-align: center;
            }
            
            .status-value {
                font-size: 20px;
                font-weight: bold;
                color: #1f2937;
            }
            
            .status-label {
                font-size: 12px;
                color: #6b7280;
                margin-top: 4px;
            }
            
            .alerts-list {
                max-height: 150px;
                overflow-y: auto;
            }
            
            .alert-item {
                padding: 8px 12px;
                background: #fef3c7;
                border-left: 4px solid #f59e0b;
                border-radius: 4px;
                margin-bottom: 8px;
                font-size: 14px;
            }
            
            .table-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 8px;
            }
            
            .table-status {
                padding: 8px;
                text-align: center;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 500;
            }
            
            .table-available { background: #dcfce7; color: #166534; }
            .table-occupied { background: #fee2e2; color: #991b1b; }
            .table-reserved { background: #fef3c7; color: #92400e; }
            .table-cleaning { background: #e0e7ff; color: #3730a3; }
            
            .pos-actions {
                display: flex;
                gap: 12px;
                padding-top: 16px;
                border-top: 1px solid #e5e7eb;
            }
            
            .pos-btn {
                flex: 1;
                padding: 10px 16px;
                border: 1px solid #d1d5db;
                border-radius: 8px;
                background: white;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s ease;
            }
            
            .pos-btn:hover {
                background: #f9fafb;
                transform: translateY(-1px);
            }
            
            .pos-btn.primary {
                background: #059669;
                color: white;
                border-color: #059669;
            }
            
            .pos-btn.primary:hover {
                background: #047857;
            }
        `;
        document.head.appendChild(style);
    }

    setupPOSEventListeners() {
        // Sync now button
        const syncBtn = document.getElementById('sync-now-btn');
        if (syncBtn) {
            syncBtn.addEventListener('click', () => {
                this.syncWithPOS('all');
                if (window.safeNotify) {
                    window.safeNotify('🔄 Syncing with all POS systems...', 'info');
                }
            });
        }
        
        // Export menu button
        const exportBtn = document.getElementById('export-menu-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportMenuData();
            });
        }
    }

    async exportMenuData() {
        const menuItems = await this.getMenuItems();
        const exportData = {
            timestamp: new Date(),
            totalItems: menuItems.length,
            availableItems: menuItems.filter(item => item.available).length,
            items: menuItems
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `menu-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        if (window.safeNotify) {
            window.safeNotify('📄 Menu data exported successfully', 'success');
        }
    }

    updateAllDisplays() {
        this.updateSystemsDisplay();
        this.updateMenuDisplay();
        this.updateInventoryDisplay();
        this.updateTableDisplay();
        this.updateSyncStatus();
    }

    updateSystemsDisplay() {
        const container = document.getElementById('connected-systems');
        if (!container) return;
        
        container.innerHTML = Array.from(this.connectedSystems.entries())
            .map(([id, system]) => `
                <div class="system-card">
                    <div class="system-name">${system.name}</div>
                    <div class="system-status">${system.status}</div>
                </div>
            `).join('');
    }

    updateMenuDisplay() {
        const container = document.getElementById('menu-status');
        if (!container) return;
        
        const totalItems = this.sampleData.currentMenu.categories
            .flatMap(cat => cat.items).length;
        const availableItems = this.sampleData.currentMenu.categories
            .flatMap(cat => cat.items)
            .filter(item => item.available).length;
        
        container.innerHTML = `
            <div class="status-item">
                <div class="status-value">${totalItems}</div>
                <div class="status-label">Total Items</div>
            </div>
            <div class="status-item">
                <div class="status-value">${availableItems}</div>
                <div class="status-label">Available</div>
            </div>
        `;
    }

    updateInventoryDisplay() {
        const container = document.getElementById('inventory-alerts');
        if (!container) return;
        
        const lowStock = this.sampleData.currentInventory.lowStockItems;
        const outOfStock = this.sampleData.currentInventory.outOfStock;
        
        container.innerHTML = [
            ...lowStock.map(item => `
                <div class="alert-item">⚠️ Low stock: ${item}</div>
            `),
            ...outOfStock.map(item => `
                <div class="alert-item" style="background: #fee2e2; border-color: #dc2626;">
                    ❌ Out of stock: ${item}
                </div>
            `)
        ].join('');
    }

    updateTableDisplay() {
        const container = document.getElementById('table-availability');
        if (!container) return;
        
        // Generate sample table statuses
        const tables = [];
        for (let i = 1; i <= 12; i++) {
            const statuses = ['available', 'occupied', 'reserved', 'cleaning'];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            tables.push(`
                <div class="table-status table-${status}">
                    Table ${i}<br>${status}
                </div>
            `);
        }
        
        container.innerHTML = tables.join('');
    }

    updateSyncStatus() {
        const syncTime = document.getElementById('last-sync-time');
        if (syncTime && this.lastSync) {
            syncTime.textContent = this.lastSync.toLocaleTimeString();
        }
    }

    formatPrice(price) {
        // Format price from cents to dollars
        if (typeof price === 'number') {
            return `$${(price / 100).toFixed(2)}`;
        }
        return price;
    }

    generateConfirmationCode() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    showPOSPanel() {
        const panel = document.querySelector('.pos-control-panel');
        if (panel) {
            panel.style.display = 'block';
            this.updateAllDisplays();
        }
    }

    hidePOSPanel() {
        const panel = document.querySelector('.pos-control-panel');
        if (panel) {
            panel.style.display = 'none';
        }
    }

    getStatus() {
        return {
            connectedSystems: this.connectedSystems.size,
            lastSync: this.lastSync,
            menuItemsCount: Array.from(this.menuCache.values())
                .reduce((total, menu) => total + (menu.categories?.length || 0), 0),
            inventoryAlerts: this.sampleData.currentInventory.lowStockItems.length +
                           this.sampleData.currentInventory.outOfStock.length
        };
    }
}

// Initialize POS integration
window.posIntegration = new POSSystemIntegration();

// Export for module environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = POSSystemIntegration;
}

console.log('🏪 POS System Integration loaded');