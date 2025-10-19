/**
 * Omnichannel Communication System
 * Integrates SMS, email, and social media messaging with unified conversation tracking
 * Provides seamless customer experience across all communication channels
 */

class OmnichannelCommunication {
    constructor() {
        this.channels = new Map();
        this.conversations = new Map();
        this.unifiedInbox = [];
        this.channelConfigs = new Map();
        this.autoResponders = new Map();
        this.integrations = new Map();
        this.messageQueue = [];
        this.customerProfiles = new Map();
        this.analytics = {
            messagesSent: 0,
            messagesReceived: 0,
            responseTime: 0,
            channelUsage: new Map()
        };
        this.init();
    }

    async init() {
        console.log('📱 Initializing Omnichannel Communication System...');
        
        // Setup communication channels
        this.setupChannels();
        
        // Configure integrations
        this.setupIntegrations();
        
        // Initialize auto-responders
        this.setupAutoResponders();
        
        // Setup unified inbox
        this.setupUnifiedInbox();
        
        // Create management interface
        this.createOmnichannelInterface();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Start message processing
        this.startMessageProcessing();
        
        // Load sample data
        this.loadSampleData();
        
        console.log('✅ Omnichannel Communication System ready');
    }

    setupChannels() {
        // SMS Channel
        this.channels.set('sms', {
            name: 'SMS',
            type: 'messaging',
            enabled: true,
            icon: '📱',
            color: '#10b981',
            capabilities: ['send', 'receive', 'multimedia'],
            config: {
                provider: 'twilio',
                number: '+1-555-RESTO1',
                webhook: '/api/sms/webhook'
            },
            handler: this.handleSMSMessage.bind(this)
        });
        
        // Email Channel
        this.channels.set('email', {
            name: 'Email',
            type: 'messaging',
            enabled: true,
            icon: '📧',
            color: '#3b82f6',
            capabilities: ['send', 'receive', 'attachments', 'html'],
            config: {
                provider: 'smtp',
                address: 'hello@bellavista.com',
                smtp: 'smtp.restaurant.com'
            },
            handler: this.handleEmailMessage.bind(this)
        });
        
        // WhatsApp Channel
        this.channels.set('whatsapp', {
            name: 'WhatsApp',
            type: 'messaging',
            enabled: true,
            icon: '💬',
            color: '#059669',
            capabilities: ['send', 'receive', 'multimedia', 'location'],
            config: {
                provider: 'whatsapp_business',
                number: '+1-555-RESTO1',
                businessId: 'bella_vista_restaurant'
            },
            handler: this.handleWhatsAppMessage.bind(this)
        });
        
        // Facebook Messenger Channel
        this.channels.set('facebook', {
            name: 'Facebook Messenger',
            type: 'social',
            enabled: true,
            icon: '📘',
            color: '#1877f2',
            capabilities: ['send', 'receive', 'multimedia', 'quick_replies'],
            config: {
                provider: 'facebook',
                pageId: 'bellavista_restaurant',
                accessToken: 'fb_access_token'
            },
            handler: this.handleFacebookMessage.bind(this)
        });
        
        // Instagram Channel
        this.channels.set('instagram', {
            name: 'Instagram',
            type: 'social',
            enabled: true,
            icon: '📷',
            color: '#e1306c',
            capabilities: ['send', 'receive', 'multimedia', 'stories'],
            config: {
                provider: 'instagram',
                accountId: 'bellavista_restaurant',
                accessToken: 'ig_access_token'
            },
            handler: this.handleInstagramMessage.bind(this)
        });
        
        // Twitter Channel
        this.channels.set('twitter', {
            name: 'Twitter',
            type: 'social',
            enabled: true,
            icon: '🐦',
            color: '#1da1f2',
            capabilities: ['send', 'receive', 'mentions', 'public_replies'],
            config: {
                provider: 'twitter',
                username: '@bellavista_nyc',
                apiKey: 'twitter_api_key'
            },
            handler: this.handleTwitterMessage.bind(this)
        });
        
        // Google My Business Channel
        this.channels.set('google_business', {
            name: 'Google My Business',
            type: 'reviews',
            enabled: true,
            icon: '🏪',
            color: '#4285f4',
            capabilities: ['receive', 'respond', 'reviews'],
            config: {
                provider: 'google',
                businessId: 'bella_vista_gmb',
                apiKey: 'google_api_key'
            },
            handler: this.handleGoogleBusinessMessage.bind(this)
        });
        
        // Web Chat Channel
        this.channels.set('webchat', {
            name: 'Website Chat',
            type: 'web',
            enabled: true,
            icon: '💻',
            color: '#6366f1',
            capabilities: ['send', 'receive', 'typing_indicators', 'file_transfer'],
            config: {
                widget: 'embedded',
                position: 'bottom-right'
            },
            handler: this.handleWebChatMessage.bind(this)
        });
        
        console.log(`📡 Configured ${this.channels.size} communication channels`);
    }

    setupIntegrations() {
        // CRM Integration
        this.integrations.set('crm', {
            name: 'Customer CRM',
            enabled: true,
            endpoint: '/api/crm/sync',
            syncCustomerData: true,
            syncConversations: true
        });
        
        // Reservation System Integration
        this.integrations.set('reservations', {
            name: 'Reservation System',
            enabled: true,
            endpoint: '/api/reservations/sync',
            autoCreateBookings: true,
            sendConfirmations: true
        });
        
        // POS Integration
        this.integrations.set('pos', {
            name: 'POS System',
            enabled: true,
            endpoint: '/api/pos/sync',
            shareMenuData: true,
            notifyOrders: true
        });
        
        // Marketing Automation
        this.integrations.set('marketing', {
            name: 'Marketing Automation',
            enabled: true,
            endpoint: '/api/marketing/sync',
            segmentCustomers: true,
            triggerCampaigns: true
        });
        
        console.log(`🔗 Configured ${this.integrations.size} system integrations`);
    }

    setupAutoResponders() {
        // SMS Auto-responder
        this.autoResponders.set('sms_welcome', {
            channel: 'sms',
            trigger: 'first_message',
            delay: 0,
            message: "Hi! Thanks for texting Bella Vista Restaurant. We'll respond shortly. For reservations, call us at (555) 123-4567 or visit our website.",
            active: true
        });
        
        // Email Auto-responder
        this.autoResponders.set('email_confirmation', {
            channel: 'email',
            trigger: 'new_conversation',
            delay: 60, // 1 minute
            subject: "We've received your message",
            message: "Thank you for contacting Bella Vista Restaurant. We've received your message and will respond within 2 hours during business hours.",
            active: true
        });
        
        // Social Media Auto-responder
        this.autoResponders.set('social_acknowledgment', {
            channel: ['facebook', 'instagram', 'twitter'],
            trigger: 'mention_or_dm',
            delay: 300, // 5 minutes
            message: "Thanks for reaching out! We're here to help. Please allow us a few moments to respond.",
            active: true
        });
        
        // After-hours Auto-responder
        this.autoResponders.set('after_hours', {
            channel: 'all',
            trigger: 'outside_hours',
            delay: 0,
            message: "Thanks for your message! Our restaurant is currently closed. We're open Tuesday-Sunday 5pm-11pm. We'll respond when we reopen!",
            active: true,
            schedule: {
                closed: ['monday'],
                hours: { open: '17:00', close: '23:00' }
            }
        });
        
        console.log(`🤖 Configured ${this.autoResponders.size} auto-responders`);
    }

    setupUnifiedInbox() {
        // Unified inbox configuration
        this.inboxConfig = {
            sortBy: 'timestamp',
            groupBy: 'customer',
            filters: {
                unread: true,
                urgent: true,
                channel: 'all',
                timeRange: '7d'
            },
            notifications: {
                desktop: true,
                sound: true,
                email: false
            }
        };
        
        // Message priority rules
        this.priorityRules = [
            { keywords: ['urgent', 'emergency', 'complaint'], priority: 'high' },
            { keywords: ['reservation', 'booking'], priority: 'medium' },
            { channel: 'google_business', type: 'review', priority: 'high' },
            { channel: 'twitter', public: true, priority: 'medium' },
            { timeOfDay: 'after_hours', priority: 'low' }
        ];
    }

    setupEventListeners() {
        // Listen for incoming messages from all channels
        document.addEventListener('incomingMessage', (event) => {
            this.handleIncomingMessage(event.detail);
        });
        
        // Listen for outgoing message requests
        document.addEventListener('sendMessage', (event) => {
            this.sendMessage(event.detail);
        });
        
        // Listen for conversation updates
        document.addEventListener('conversationUpdated', (event) => {
            this.updateConversation(event.detail);
        });
        
        // Listen for customer profile updates
        document.addEventListener('customerProfileUpdated', (event) => {
            this.updateCustomerProfile(event.detail);
        });
    }

    async handleIncomingMessage(messageData) {
        console.log(`📨 Incoming message from ${messageData.channel}:`, messageData);
        
        // Create unified message object
        const message = this.createUnifiedMessage(messageData);
        
        // Update or create conversation
        await this.updateOrCreateConversation(message);
        
        // Apply priority rules
        this.applyPriorityRules(message);
        
        // Add to unified inbox
        this.addToUnifiedInbox(message);
        
        // Trigger auto-responders if applicable
        await this.checkAutoResponders(message);
        
        // Update analytics
        this.updateAnalytics('received', message);
        
        // Sync with integrations
        await this.syncWithIntegrations(message);
        
        // Update UI
        this.updateInboxDisplay();
        
        // Emit unified message event
        const event = new CustomEvent('messageReceived', {
            detail: { message }
        });
        document.dispatchEvent(event);
    }

    createUnifiedMessage(messageData) {
        return {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            conversationId: messageData.conversationId || this.generateConversationId(messageData),
            channel: messageData.channel,
            direction: messageData.direction || 'inbound',
            type: messageData.type || 'text',
            content: messageData.content || messageData.text,
            sender: {
                id: messageData.senderId,
                name: messageData.senderName,
                phone: messageData.phone,
                email: messageData.email,
                platform: messageData.channel
            },
            timestamp: new Date(messageData.timestamp || Date.now()),
            metadata: {
                originalData: messageData,
                platform_message_id: messageData.platformMessageId,
                thread_id: messageData.threadId,
                attachments: messageData.attachments || [],
                location: messageData.location
            },
            status: 'received',
            priority: 'normal',
            read: false,
            starred: false,
            tags: []
        };
    }

    generateConversationId(messageData) {
        // Generate conversation ID based on sender and channel
        const senderId = messageData.senderId || messageData.phone || messageData.email;
        return `conv_${messageData.channel}_${btoa(senderId).replace(/[^a-zA-Z0-9]/g, '').substr(0, 10)}`;
    }

    async updateOrCreateConversation(message) {
        let conversation = this.conversations.get(message.conversationId);
        
        if (!conversation) {
            // Create new conversation
            conversation = {
                id: message.conversationId,
                customer: {
                    id: message.sender.id,
                    name: message.sender.name,
                    phone: message.sender.phone,
                    email: message.sender.email,
                    preferredChannel: message.channel
                },
                channels: [message.channel],
                messages: [],
                status: 'active',
                priority: 'normal',
                assignedAgent: null,
                tags: [],
                createdAt: message.timestamp,
                updatedAt: message.timestamp,
                lastMessageAt: message.timestamp,
                metadata: {}
            };
            
            this.conversations.set(message.conversationId, conversation);
            console.log(`💬 Created new conversation: ${message.conversationId}`);
        }
        
        // Add message to conversation
        conversation.messages.push(message);
        conversation.updatedAt = message.timestamp;
        conversation.lastMessageAt = message.timestamp;
        
        // Add channel if not already present
        if (!conversation.channels.includes(message.channel)) {
            conversation.channels.push(message.channel);
        }
        
        // Update customer profile
        await this.updateCustomerProfile(conversation.customer, message);
    }

    applyPriorityRules(message) {
        // Apply priority rules based on content and context
        for (const rule of this.priorityRules) {
            if (this.matchesRule(message, rule)) {
                message.priority = rule.priority;
                console.log(`📋 Applied priority rule: ${message.priority} for message ${message.id}`);
                break;
            }
        }
    }

    matchesRule(message, rule) {
        // Check keyword matches
        if (rule.keywords) {
            const content = message.content.toLowerCase();
            if (rule.keywords.some(keyword => content.includes(keyword))) {
                return true;
            }
        }
        
        // Check channel matches
        if (rule.channel && message.channel === rule.channel) {
            return true;
        }
        
        // Check time-based rules
        if (rule.timeOfDay) {
            const hour = message.timestamp.getHours();
            if (rule.timeOfDay === 'after_hours' && (hour < 9 || hour > 21)) {
                return true;
            }
        }
        
        return false;
    }

    addToUnifiedInbox(message) {
        // Add to unified inbox with proper sorting
        this.unifiedInbox.push(message);
        
        // Sort by timestamp (newest first)
        this.unifiedInbox.sort((a, b) => b.timestamp - a.timestamp);
        
        // Limit inbox size to prevent memory issues
        if (this.unifiedInbox.length > 1000) {
            this.unifiedInbox = this.unifiedInbox.slice(0, 1000);
        }
    }

    async checkAutoResponders(message) {
        for (const [id, responder] of this.autoResponders.entries()) {
            if (!responder.active) continue;
            
            // Check if responder applies to this message
            if (this.shouldTriggerAutoResponder(message, responder)) {
                setTimeout(() => {
                    this.sendAutoResponse(message, responder);
                }, responder.delay * 1000);
            }
        }
    }

    shouldTriggerAutoResponder(message, responder) {
        // Check channel match
        if (responder.channel !== 'all' && 
            !Array.isArray(responder.channel) && 
            responder.channel !== message.channel) {
            return false;
        }
        
        if (Array.isArray(responder.channel) && 
            !responder.channel.includes(message.channel)) {
            return false;
        }
        
        // Check trigger conditions
        if (responder.trigger === 'first_message') {
            const conversation = this.conversations.get(message.conversationId);
            return conversation?.messages.length === 1;
        }
        
        if (responder.trigger === 'new_conversation') {
            const conversation = this.conversations.get(message.conversationId);
            return conversation?.messages.length === 1;
        }
        
        if (responder.trigger === 'outside_hours' && responder.schedule) {
            return this.isOutsideBusinessHours(message.timestamp, responder.schedule);
        }
        
        return false;
    }

    isOutsideBusinessHours(timestamp, schedule) {
        const day = timestamp.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = dayNames[day];
        
        // Check if restaurant is closed today
        if (schedule.closed && schedule.closed.includes(dayName)) {
            return true;
        }
        
        // Check if outside operating hours
        const hour = timestamp.getHours();
        const openHour = parseInt(schedule.hours.open.split(':')[0]);
        const closeHour = parseInt(schedule.hours.close.split(':')[0]);
        
        return hour < openHour || hour >= closeHour;
    }

    async sendAutoResponse(originalMessage, responder) {
        console.log(`🤖 Sending auto-response: ${responder.message}`);
        
        const responseMessage = {
            conversationId: originalMessage.conversationId,
            channel: originalMessage.channel,
            direction: 'outbound',
            type: 'text',
            content: responder.message,
            subject: responder.subject,
            automated: true,
            replyTo: originalMessage.id
        };
        
        await this.sendMessage(responseMessage);
    }

    async sendMessage(messageData) {
        console.log(`📤 Sending message via ${messageData.channel}:`, messageData);
        
        const channel = this.channels.get(messageData.channel);
        if (!channel || !channel.enabled) {
            throw new Error(`Channel ${messageData.channel} not available`);
        }
        
        try {
            // Create unified message
            const message = this.createUnifiedMessage({
                ...messageData,
                direction: 'outbound',
                timestamp: Date.now(),
                senderId: 'restaurant',
                senderName: 'Bella Vista Restaurant'
            });
            
            // Send via channel handler
            const result = await channel.handler(messageData);
            
            // Update message status
            message.status = result.success ? 'sent' : 'failed';
            message.metadata.deliveryResult = result;
            
            // Add to conversation
            await this.updateOrCreateConversation(message);
            
            // Add to unified inbox
            this.addToUnifiedInbox(message);
            
            // Update analytics
            this.updateAnalytics('sent', message);
            
            // Update UI
            this.updateInboxDisplay();
            
            return result;
            
        } catch (error) {
            console.error(`❌ Failed to send message via ${messageData.channel}:`, error);
            throw error;
        }
    }

    // Channel-specific message handlers
    async handleSMSMessage(messageData) {
        console.log('📱 Handling SMS message:', messageData);
        
        // Simulate SMS API call
        const success = Math.random() > 0.05; // 95% success rate
        
        return {
            success,
            messageId: `sms_${Date.now()}`,
            channel: 'sms',
            timestamp: new Date(),
            cost: 0.0075, // $0.0075 per SMS
            ...(success ? {} : { error: 'SMS delivery failed' })
        };
    }

    async handleEmailMessage(messageData) {
        console.log('📧 Handling email message:', messageData);
        
        // Simulate email API call
        const success = Math.random() > 0.02; // 98% success rate
        
        return {
            success,
            messageId: `email_${Date.now()}`,
            channel: 'email',
            timestamp: new Date(),
            ...(success ? {} : { error: 'Email delivery failed' })
        };
    }

    async handleWhatsAppMessage(messageData) {
        console.log('💬 Handling WhatsApp message:', messageData);
        
        // Simulate WhatsApp Business API call
        const success = Math.random() > 0.03; // 97% success rate
        
        return {
            success,
            messageId: `wa_${Date.now()}`,
            channel: 'whatsapp',
            timestamp: new Date(),
            ...(success ? {} : { error: 'WhatsApp delivery failed' })
        };
    }

    async handleFacebookMessage(messageData) {
        console.log('📘 Handling Facebook message:', messageData);
        
        // Simulate Facebook Messenger API call
        const success = Math.random() > 0.04; // 96% success rate
        
        return {
            success,
            messageId: `fb_${Date.now()}`,
            channel: 'facebook',
            timestamp: new Date(),
            ...(success ? {} : { error: 'Facebook delivery failed' })
        };
    }

    async handleInstagramMessage(messageData) {
        console.log('📷 Handling Instagram message:', messageData);
        
        // Simulate Instagram API call
        const success = Math.random() > 0.06; // 94% success rate
        
        return {
            success,
            messageId: `ig_${Date.now()}`,
            channel: 'instagram',
            timestamp: new Date(),
            ...(success ? {} : { error: 'Instagram delivery failed' })
        };
    }

    async handleTwitterMessage(messageData) {
        console.log('🐦 Handling Twitter message:', messageData);
        
        // Simulate Twitter API call
        const success = Math.random() > 0.05; // 95% success rate
        
        return {
            success,
            messageId: `tw_${Date.now()}`,
            channel: 'twitter',
            timestamp: new Date(),
            ...(success ? {} : { error: 'Twitter delivery failed' })
        };
    }

    async handleGoogleBusinessMessage(messageData) {
        console.log('🏪 Handling Google Business message:', messageData);
        
        // Simulate Google My Business API call
        const success = Math.random() > 0.02; // 98% success rate
        
        return {
            success,
            messageId: `gmb_${Date.now()}`,
            channel: 'google_business',
            timestamp: new Date(),
            ...(success ? {} : { error: 'Google Business delivery failed' })
        };
    }

    async handleWebChatMessage(messageData) {
        console.log('💻 Handling web chat message:', messageData);
        
        // Web chat is always successful (direct connection)
        return {
            success: true,
            messageId: `web_${Date.now()}`,
            channel: 'webchat',
            timestamp: new Date()
        };
    }

    async updateCustomerProfile(customer, message) {
        let profile = this.customerProfiles.get(customer.id);
        
        if (!profile) {
            profile = {
                id: customer.id,
                name: customer.name,
                phone: customer.phone,
                email: customer.email,
                preferredChannels: [],
                conversationHistory: [],
                tags: [],
                notes: [],
                createdAt: new Date(),
                lastInteraction: message.timestamp,
                totalMessages: 0,
                averageResponseTime: 0
            };
        }
        
        // Update profile data
        profile.lastInteraction = message.timestamp;
        profile.totalMessages++;
        
        // Track preferred channels
        if (!profile.preferredChannels.includes(message.channel)) {
            profile.preferredChannels.push(message.channel);
        }
        
        // Add conversation reference
        if (!profile.conversationHistory.includes(message.conversationId)) {
            profile.conversationHistory.push(message.conversationId);
        }
        
        this.customerProfiles.set(customer.id, profile);
    }

    updateAnalytics(type, message) {
        if (type === 'sent') {
            this.analytics.messagesSent++;
        } else {
            this.analytics.messagesReceived++;
        }
        
        // Update channel usage
        const currentUsage = this.analytics.channelUsage.get(message.channel) || 0;
        this.analytics.channelUsage.set(message.channel, currentUsage + 1);
    }

    async syncWithIntegrations(message) {
        // Sync with CRM
        if (this.integrations.get('crm')?.enabled) {
            await this.syncWithCRM(message);
        }
        
        // Sync with reservations
        if (this.integrations.get('reservations')?.enabled) {
            await this.syncWithReservations(message);
        }
        
        // Sync with marketing
        if (this.integrations.get('marketing')?.enabled) {
            await this.syncWithMarketing(message);
        }
    }

    async syncWithCRM(message) {
        // Simulate CRM sync
        console.log('🔗 Syncing with CRM:', message.sender);
    }

    async syncWithReservations(message) {
        // Check if message contains reservation intent
        const reservationKeywords = ['reservation', 'booking', 'table', 'tonight', 'dinner'];
        const content = message.content.toLowerCase();
        
        if (reservationKeywords.some(keyword => content.includes(keyword))) {
            console.log('📅 Potential reservation detected, syncing with reservation system');
            
            // Create reservation lead
            const lead = {
                customerId: message.sender.id,
                channel: message.channel,
                messageId: message.id,
                content: message.content,
                timestamp: message.timestamp
            };
            
            // In real implementation, send to reservation system
            const event = new CustomEvent('reservationLeadCreated', {
                detail: { lead }
            });
            document.dispatchEvent(event);
        }
    }

    async syncWithMarketing(message) {
        // Update customer segments and trigger campaigns
        console.log('📊 Syncing with marketing automation:', message.sender);
    }

    startMessageProcessing() {
        // Process message queue periodically
        this.messageProcessingInterval = setInterval(() => {
            this.processMessageQueue();
        }, 5000); // Every 5 seconds
        
        console.log('⚡ Message processing started');
    }

    processMessageQueue() {
        if (this.messageQueue.length === 0) return;
        
        const messagesToProcess = this.messageQueue.splice(0, 10); // Process up to 10 messages
        
        for (const message of messagesToProcess) {
            this.handleIncomingMessage(message);
        }
    }

    loadSampleData() {
        // Create sample conversations for demo
        const sampleMessages = [
            {
                channel: 'sms',
                senderId: '+15551234567',
                senderName: 'Jennifer Wilson',
                phone: '+15551234567',
                content: 'Hi! Do you have availability for dinner tonight for 4 people?',
                timestamp: Date.now() - (2 * 60 * 60 * 1000) // 2 hours ago
            },
            {
                channel: 'facebook',
                senderId: 'fb_user_123',
                senderName: 'Mike Chen',
                content: 'I loved my meal last night! The pasta was incredible. Thank you!',
                timestamp: Date.now() - (4 * 60 * 60 * 1000) // 4 hours ago
            },
            {
                channel: 'email',
                senderId: 'sarah.jones@email.com',
                senderName: 'Sarah Jones',
                email: 'sarah.jones@email.com',
                content: 'I would like to inquire about hosting a private event for 20 people next month.',
                subject: 'Private Event Inquiry',
                timestamp: Date.now() - (6 * 60 * 60 * 1000) // 6 hours ago
            },
            {
                channel: 'google_business',
                senderId: 'google_review_456',
                senderName: 'David Rodriguez',
                content: 'Amazing food and service! The AI phone system made reservations so easy.',
                type: 'review',
                rating: 5,
                timestamp: Date.now() - (8 * 60 * 60 * 1000) // 8 hours ago
            },
            {
                channel: 'whatsapp',
                senderId: '+15559876543',
                senderName: 'Emily Davis',
                phone: '+15559876543',
                content: 'Is it possible to make changes to our reservation for tomorrow?',
                timestamp: Date.now() - (1 * 60 * 60 * 1000) // 1 hour ago
            }
        ];
        
        // Process sample messages
        sampleMessages.forEach(message => {
            setTimeout(() => {
                this.handleIncomingMessage(message);
            }, Math.random() * 5000); // Stagger over 5 seconds
        });
        
        console.log(`📝 Loaded ${sampleMessages.length} sample messages`);
    }

    createOmnichannelInterface() {
        // Create omnichannel management panel
        const omnichannelPanel = document.createElement('div');
        omnichannelPanel.className = 'omnichannel-panel';
        omnichannelPanel.innerHTML = `
            <div class="omni-header">
                <h2>📱 Omnichannel Communications</h2>
                <div class="inbox-stats">
                    <span id="unread-count" class="stat-badge">0</span>
                    <span>Unread Messages</span>
                </div>
            </div>
            
            <div class="omni-content">
                <div class="channel-status">
                    <h3>Channel Status</h3>
                    <div id="channels-grid" class="channels-grid"></div>
                </div>
                
                <div class="unified-inbox">
                    <h3>Unified Inbox</h3>
                    <div class="inbox-filters">
                        <select id="channel-filter">
                            <option value="all">All Channels</option>
                        </select>
                        <select id="priority-filter">
                            <option value="all">All Priorities</option>
                            <option value="high">High Priority</option>
                            <option value="medium">Medium Priority</option>
                            <option value="low">Low Priority</option>
                        </select>
                    </div>
                    <div id="messages-list" class="messages-list"></div>
                </div>
                
                <div class="analytics-summary">
                    <h3>Analytics Summary</h3>
                    <div class="analytics-grid">
                        <div class="analytic-item">
                            <span class="analytic-value" id="total-messages">0</span>
                            <span class="analytic-label">Total Messages</span>
                        </div>
                        <div class="analytic-item">
                            <span class="analytic-value" id="active-conversations">0</span>
                            <span class="analytic-label">Active Conversations</span>
                        </div>
                        <div class="analytic-item">
                            <span class="analytic-value" id="avg-response-time">0s</span>
                            <span class="analytic-label">Avg Response Time</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add styles
        this.addOmnichannelStyles();
        
        // Add to page (hidden by default)
        omnichannelPanel.style.display = 'none';
        document.body.appendChild(omnichannelPanel);
        
        // Setup event listeners
        this.setupOmnichannelEventListeners();
        
        // Initial display update
        this.updateOmnichannelDisplay();
        
        console.log('🎨 Omnichannel interface created');
    }

    addOmnichannelStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .omnichannel-panel {
                position: fixed;
                top: 50px;
                right: 50px;
                width: 500px;
                max-height: 85vh;
                background: white;
                border-radius: 16px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
                overflow: hidden;
                z-index: 9996;
                font-family: system-ui, -apple-system, sans-serif;
            }
            
            .omni-header {
                background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
                color: white;
                padding: 16px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .omni-header h2 {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
            }
            
            .inbox-stats {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
            }
            
            .stat-badge {
                background: rgba(255, 255, 255, 0.2);
                padding: 4px 8px;
                border-radius: 12px;
                font-weight: bold;
                min-width: 24px;
                text-align: center;
            }
            
            .omni-content {
                padding: 20px;
                max-height: 75vh;
                overflow-y: auto;
            }
            
            .omni-content h3 {
                margin: 0 0 12px 0;
                font-size: 16px;
                font-weight: 600;
                color: #1f2937;
            }
            
            .channels-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 8px;
                margin-bottom: 24px;
            }
            
            .channel-card {
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 12px 8px;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                background: #f9fafb;
                transition: all 0.2s ease;
            }
            
            .channel-card.active {
                border-color: #8b5cf6;
                background: #f3f4f6;
            }
            
            .channel-icon {
                font-size: 20px;
                margin-bottom: 4px;
            }
            
            .channel-name {
                font-size: 10px;
                font-weight: 500;
                text-align: center;
                color: #374151;
            }
            
            .inbox-filters {
                display: flex;
                gap: 8px;
                margin-bottom: 12px;
            }
            
            .inbox-filters select {
                padding: 6px 12px;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                font-size: 14px;
            }
            
            .messages-list {
                max-height: 300px;
                overflow-y: auto;
                margin-bottom: 24px;
            }
            
            .message-item {
                display: flex;
                padding: 12px;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                margin-bottom: 8px;
                background: white;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .message-item:hover {
                border-color: #8b5cf6;
                transform: translateY(-1px);
            }
            
            .message-item.unread {
                border-left: 4px solid #8b5cf6;
                background: #faf5ff;
            }
            
            .message-channel {
                font-size: 16px;
                margin-right: 8px;
            }
            
            .message-content {
                flex: 1;
            }
            
            .message-sender {
                font-weight: 600;
                color: #1f2937;
                font-size: 14px;
                margin-bottom: 2px;
            }
            
            .message-text {
                font-size: 13px;
                color: #6b7280;
                margin-bottom: 4px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            
            .message-time {
                font-size: 11px;
                color: #9ca3af;
            }
            
            .priority-badge {
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 10px;
                font-weight: bold;
                text-transform: uppercase;
            }
            
            .priority-high {
                background: #fee2e2;
                color: #991b1b;
            }
            
            .priority-medium {
                background: #fef3c7;
                color: #92400e;
            }
            
            .priority-low {
                background: #e0f2fe;
                color: #0369a1;
            }
            
            .analytics-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 12px;
            }
            
            .analytic-item {
                text-align: center;
                padding: 16px 8px;
                background: #f8fafc;
                border-radius: 8px;
            }
            
            .analytic-value {
                display: block;
                font-size: 20px;
                font-weight: bold;
                color: #1f2937;
                margin-bottom: 4px;
            }
            
            .analytic-label {
                font-size: 12px;
                color: #6b7280;
            }
            
            .no-messages {
                text-align: center;
                color: #6b7280;
                padding: 40px 20px;
                font-style: italic;
            }
        `;
        document.head.appendChild(style);
    }

    setupOmnichannelEventListeners() {
        // Filter event listeners
        const channelFilter = document.getElementById('channel-filter');
        const priorityFilter = document.getElementById('priority-filter');
        
        if (channelFilter) {
            channelFilter.addEventListener('change', () => {
                this.updateMessagesDisplay();
            });
        }
        
        if (priorityFilter) {
            priorityFilter.addEventListener('change', () => {
                this.updateMessagesDisplay();
            });
        }
        
        // Message click handlers
        document.addEventListener('click', (event) => {
            if (event.target.closest('.message-item')) {
                const messageItem = event.target.closest('.message-item');
                const messageId = messageItem.dataset.messageId;
                this.openMessage(messageId);
            }
        });
    }

    updateOmnichannelDisplay() {
        this.updateChannelsDisplay();
        this.updateMessagesDisplay();
        this.updateAnalyticsDisplay();
        this.updateInboxStats();
        this.populateChannelFilter();
    }

    updateChannelsDisplay() {
        const container = document.getElementById('channels-grid');
        if (!container) return;
        
        container.innerHTML = Array.from(this.channels.entries()).map(([id, channel]) => `
            <div class="channel-card ${channel.enabled ? 'active' : ''}">
                <div class="channel-icon">${channel.icon}</div>
                <div class="channel-name">${channel.name}</div>
            </div>
        `).join('');
    }

    updateMessagesDisplay() {
        const container = document.getElementById('messages-list');
        if (!container) return;
        
        // Get filter values
        const channelFilter = document.getElementById('channel-filter')?.value || 'all';
        const priorityFilter = document.getElementById('priority-filter')?.value || 'all';
        
        // Filter messages
        let filteredMessages = this.unifiedInbox;
        
        if (channelFilter !== 'all') {
            filteredMessages = filteredMessages.filter(msg => msg.channel === channelFilter);
        }
        
        if (priorityFilter !== 'all') {
            filteredMessages = filteredMessages.filter(msg => msg.priority === priorityFilter);
        }
        
        // Display messages
        if (filteredMessages.length === 0) {
            container.innerHTML = '<div class="no-messages">No messages found</div>';
            return;
        }
        
        container.innerHTML = filteredMessages.slice(0, 20).map(message => {
            const channel = this.channels.get(message.channel);
            return `
                <div class="message-item ${!message.read ? 'unread' : ''}" data-message-id="${message.id}">
                    <div class="message-channel">${channel?.icon || '📨'}</div>
                    <div class="message-content">
                        <div class="message-sender">
                            ${message.sender.name || 'Unknown'}
                            ${message.priority !== 'normal' ? `<span class="priority-badge priority-${message.priority}">${message.priority}</span>` : ''}
                        </div>
                        <div class="message-text">${message.content.substring(0, 60)}${message.content.length > 60 ? '...' : ''}</div>
                        <div class="message-time">${this.formatTime(message.timestamp)}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateAnalyticsDisplay() {
        const totalMessages = this.analytics.messagesSent + this.analytics.messagesReceived;
        const activeConversations = Array.from(this.conversations.values())
            .filter(conv => conv.status === 'active').length;
        
        // Update analytics values
        document.getElementById('total-messages').textContent = totalMessages;
        document.getElementById('active-conversations').textContent = activeConversations;
        document.getElementById('avg-response-time').textContent = '2m 30s';
    }

    updateInboxStats() {
        const unreadCount = this.unifiedInbox.filter(msg => !msg.read && msg.direction === 'inbound').length;
        const unreadElement = document.getElementById('unread-count');
        
        if (unreadElement) {
            unreadElement.textContent = unreadCount;
        }
    }

    populateChannelFilter() {
        const filter = document.getElementById('channel-filter');
        if (!filter) return;
        
        // Keep "All Channels" option and add channel-specific options
        const channelOptions = Array.from(this.channels.entries())
            .filter(([id, channel]) => channel.enabled)
            .map(([id, channel]) => `<option value="${id}">${channel.name}</option>`)
            .join('');
        
        filter.innerHTML = '<option value="all">All Channels</option>' + channelOptions;
    }

    updateInboxDisplay() {
        // Throttle UI updates to prevent performance issues
        if (!this.updateThrottle) {
            this.updateThrottle = setTimeout(() => {
                this.updateOmnichannelDisplay();
                this.updateThrottle = null;
            }, 1000);
        }
    }

    openMessage(messageId) {
        const message = this.unifiedInbox.find(msg => msg.id === messageId);
        if (!message) return;
        
        // Mark as read
        message.read = true;
        
        // Show message details (simplified implementation)
        if (window.safeNotify) {
            window.safeNotify(
                `📨 ${message.sender.name} via ${this.channels.get(message.channel)?.name}: ${message.content}`,
                'info'
            );
        }
        
        // Update display
        this.updateOmnichannelDisplay();
    }

    formatTime(timestamp) {
        const now = new Date();
        const diff = now - timestamp;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return timestamp.toLocaleDateString();
    }

    showOmnichannelPanel() {
        const panel = document.querySelector('.omnichannel-panel');
        if (panel) {
            panel.style.display = 'block';
            this.updateOmnichannelDisplay();
        }
    }

    hideOmnichannelPanel() {
        const panel = document.querySelector('.omnichannel-panel');
        if (panel) {
            panel.style.display = 'none';
        }
    }

    // Test method to simulate various scenarios
    simulateOmnichannelScenarios() {
        console.log('🎭 Running omnichannel simulation scenarios...');
        
        const scenarios = [
            {
                channel: 'instagram',
                senderId: 'ig_foodie_123',
                senderName: 'Food Lover',
                content: '📸 This pasta looks amazing! Can I book a table for tonight?',
                timestamp: Date.now()
            },
            {
                channel: 'twitter',
                senderId: 'twitter_user_456',
                senderName: 'John Smith',
                content: '@bellavista_nyc Your service was exceptional last night! Thank you!',
                type: 'mention',
                timestamp: Date.now() + 5000
            },
            {
                channel: 'whatsapp',
                senderId: '+15551112222',
                senderName: 'Maria Garcia',
                phone: '+15551112222',
                content: 'Hola! ¿Tienen mesas disponibles para mañana por la noche?',
                timestamp: Date.now() + 10000
            }
        ];
        
        scenarios.forEach(scenario => {
            setTimeout(() => {
                this.handleIncomingMessage(scenario);
            }, scenario.timestamp - Date.now());
        });
    }

    getStatus() {
        return {
            channelsActive: Array.from(this.channels.values()).filter(c => c.enabled).length,
            totalChannels: this.channels.size,
            unreadMessages: this.unifiedInbox.filter(msg => !msg.read && msg.direction === 'inbound').length,
            activeConversations: Array.from(this.conversations.values()).filter(c => c.status === 'active').length,
            totalMessages: this.unifiedInbox.length,
            autoRespondersActive: Array.from(this.autoResponders.values()).filter(a => a.active).length
        };
    }
}

// Initialize omnichannel communication system
window.omnichannelComm = new OmnichannelCommunication();

// Export for module environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OmnichannelCommunication;
}

console.log('📱 Omnichannel Communication System loaded');