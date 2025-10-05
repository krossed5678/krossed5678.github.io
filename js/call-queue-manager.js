/**
 * Professional Call Queue System
 * Handles multiple callers during busy periods with hold music and position announcements
 * Integrates with existing telephony infrastructure
 */

class CallQueueManager {
    constructor(options = {}) {
        this.maxConcurrentCalls = options.maxConcurrentCalls || 3;
        this.maxQueueSize = options.maxQueueSize || 10;
        this.holdMusicEnabled = options.holdMusicEnabled !== false;
        this.positionAnnouncementInterval = options.positionAnnouncementInterval || 30000; // 30 seconds
        this.estimatedWaitTimeEnabled = options.estimatedWaitTimeEnabled !== false;
        
        // Queue management
        this.activeQueue = [];
        this.activeCalls = new Map();
        this.queueHistory = [];
        this.averageCallDuration = 180; // 3 minutes default
        
        // Audio resources
        this.holdMusic = null;
        this.audioContext = null;
        this.announcementVoices = new Map();
        
        // Statistics
        this.stats = {
            totalCallsHandled: 0,
            totalWaitTime: 0,
            averageWaitTime: 0,
            longestWaitTime: 0,
            callsAbandoned: 0,
            peakQueueSize: 0,
            busyPeriods: []
        };
        
        this.initializeQueue();
        this.createQueueInterface();
    }

    async initializeQueue() {
        try {
            // Initialize audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Load hold music and announcement resources
            await this.loadAudioResources();
            
            // Initialize text-to-speech for announcements
            this.initializeTTS();
            
            // Start queue processing
            this.startQueueProcessor();
            
            console.log('Call Queue Manager initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize call queue:', error);
            // Fallback to basic queue without audio
            this.holdMusicEnabled = false;
        }
    }

    async loadAudioResources() {
        // Load built-in hold music (generated tones for now)
        this.holdMusic = await this.generateHoldMusic();
        
        // In production, you'd load actual audio files:
        // this.holdMusic = await this.loadAudioFile('/audio/hold-music.mp3');
    }

    async generateHoldMusic() {
        // Generate pleasant hold music using Web Audio API
        const duration = 30; // 30 seconds loop
        const sampleRate = this.audioContext.sampleRate;
        const frameCount = sampleRate * duration;
        
        const audioBuffer = this.audioContext.createBuffer(2, frameCount, sampleRate);
        
        // Generate soft jazz-like progression
        const frequencies = [261.63, 329.63, 392.00, 523.25]; // C, E, G, C (major chord)
        
        for (let channel = 0; channel < 2; channel++) {
            const channelData = audioBuffer.getChannelData(channel);
            
            for (let i = 0; i < frameCount; i++) {
                const time = i / sampleRate;
                let sample = 0;
                
                // Create soft harmonic progression
                frequencies.forEach((freq, index) => {
                    const phaseOffset = (channel === 1 ? Math.PI / 4 : 0) + (index * Math.PI / 8);
                    const envelope = Math.sin(time * Math.PI / 15) * 0.3; // 15-second envelope
                    sample += Math.sin(2 * Math.PI * freq * time + phaseOffset) * envelope * 0.1;
                });
                
                channelData[i] = sample;
            }
        }
        
        return audioBuffer;
    }

    initializeTTS() {
        if ('speechSynthesis' in window) {
            this.ttsAvailable = true;
            this.ttsVoice = speechSynthesis.getVoices().find(voice => 
                voice.name.includes('Female') || voice.name.includes('Google')
            ) || speechSynthesis.getVoices()[0];
        }
    }

    async addToQueue(callData) {
        const {
            callId,
            phoneNumber,
            provider,
            priority = 'normal', // normal, high, vip
            estimatedDuration = this.averageCallDuration,
            customerData = null
        } = callData;

        // Check if queue is full
        if (this.activeQueue.length >= this.maxQueueSize) {
            return {
                success: false,
                reason: 'queue_full',
                message: "I'm sorry, our phone lines are extremely busy. Please try calling back in a few minutes or visit our website to make a reservation online."
            };
        }

        // Check if we have available agents
        if (this.activeCalls.size < this.maxConcurrentCalls) {
            // Route directly to available agent
            return await this.routeCall(callData);
        }

        // Add to queue
        const queueEntry = {
            ...callData,
            queuedAt: new Date(),
            position: this.activeQueue.length + 1,
            estimatedWait: this.calculateEstimatedWait(),
            priority: this.determinePriority(callData),
            audioElements: new Map()
        };

        // Insert based on priority
        if (priority === 'vip' || priority === 'high') {
            const insertIndex = this.activeQueue.findIndex(entry => entry.priority === 'normal');
            if (insertIndex >= 0) {
                this.activeQueue.splice(insertIndex, 0, queueEntry);
            } else {
                this.activeQueue.push(queueEntry);
            }
        } else {
            this.activeQueue.push(queueEntry);
        }

        // Update positions
        this.updateQueuePositions();
        
        // Update statistics
        this.stats.peakQueueSize = Math.max(this.stats.peakQueueSize, this.activeQueue.length);

        // Start hold experience for this caller
        await this.startHoldExperience(queueEntry);

        console.log(`Call ${callId} added to queue. Position: ${queueEntry.position}, Estimated wait: ${queueEntry.estimatedWait}s`);

        return {
            success: true,
            position: queueEntry.position,
            estimatedWait: queueEntry.estimatedWait,
            message: `Thank you for calling ${window.voipManager?.numbers?.values()?.next()?.value?.restaurant || 'our restaurant'}. You are number ${queueEntry.position} in line with an estimated wait time of ${Math.ceil(queueEntry.estimatedWait / 60)} minutes.`
        };
    }

    determinePriority(callData) {
        // VIP customers (could be integrated with customer database)
        if (callData.customerData?.isVip) {
            return 'vip';
        }

        // Return customers
        if (callData.customerData?.previousBookings > 3) {
            return 'high';
        }

        // Emergency or complaint calls (could be detected by keywords in initial greeting)
        if (callData.callType === 'emergency' || callData.callType === 'complaint') {
            return 'high';
        }

        return 'normal';
    }

    calculateEstimatedWait() {
        if (this.activeQueue.length === 0) return 0;
        
        // Calculate based on current queue and average call duration
        const averageWait = (this.activeCalls.size * this.averageCallDuration) + 
                           (this.activeQueue.length * this.averageCallDuration * 0.7);
        
        return Math.min(averageWait, 900); // Cap at 15 minutes
    }

    async startHoldExperience(queueEntry) {
        try {
            // Start hold music if enabled
            if (this.holdMusicEnabled && this.holdMusic) {
                await this.playHoldMusic(queueEntry);
            }

            // Schedule position announcements
            this.schedulePositionAnnouncements(queueEntry);

            // Give initial greeting
            await this.playQueueGreeting(queueEntry);

        } catch (error) {
            console.error('Failed to start hold experience:', error);
            // Continue without audio
        }
    }

    async playHoldMusic(queueEntry) {
        if (!this.audioContext || !this.holdMusic) return;

        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = this.holdMusic;
        source.loop = true;
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime); // Soft volume
        
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        source.start();
        
        // Store reference to stop later
        queueEntry.audioElements.set('holdMusic', { source, gainNode });
    }

    schedulePositionAnnouncements(queueEntry) {
        const announcement = setInterval(async () => {
            // Check if call is still in queue
            if (!this.activeQueue.find(entry => entry.callId === queueEntry.callId)) {
                clearInterval(announcement);
                return;
            }

            await this.playPositionAnnouncement(queueEntry);
        }, this.positionAnnouncementInterval);

        queueEntry.audioElements.set('positionAnnouncement', announcement);
    }

    async playQueueGreeting(queueEntry) {
        const message = this.generateQueueMessage(queueEntry);
        await this.speakMessage(message, queueEntry);
    }

    async playPositionAnnouncement(queueEntry) {
        const currentPosition = this.activeQueue.findIndex(entry => entry.callId === queueEntry.callId) + 1;
        const estimatedWait = this.calculateEstimatedWait();
        
        let message = `You are currently number ${currentPosition} in line.`;
        
        if (this.estimatedWaitTimeEnabled && estimatedWait > 60) {
            const waitMinutes = Math.ceil(estimatedWait / 60);
            message += ` Your estimated wait time is ${waitMinutes} minute${waitMinutes > 1 ? 's' : ''}.`;
        }
        
        message += " Thank you for your patience.";
        
        await this.speakMessage(message, queueEntry);
    }

    generateQueueMessage(queueEntry) {
        const restaurantName = this.getRestaurantName();
        let message = `Thank you for calling ${restaurantName}. `;
        
        if (queueEntry.priority === 'vip') {
            message += "As a valued customer, we're processing your call with priority. ";
        }
        
        message += `You are number ${queueEntry.position} in line.`;
        
        if (queueEntry.estimatedWait > 60) {
            const waitMinutes = Math.ceil(queueEntry.estimatedWait / 60);
            message += ` Your estimated wait time is ${waitMinutes} minute${waitMinutes > 1 ? 's' : ''}.`;
        }
        
        message += " Please stay on the line and we'll be with you shortly. Your call is important to us.";
        
        return message;
    }

    async speakMessage(message, queueEntry) {
        if (!this.ttsAvailable) return;

        return new Promise((resolve) => {
            // Temporarily lower hold music
            const holdMusicElements = queueEntry.audioElements.get('holdMusic');
            if (holdMusicElements) {
                holdMusicElements.gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            }

            const utterance = new SpeechSynthesisUtterance(message);
            utterance.voice = this.ttsVoice;
            utterance.rate = 0.9;
            utterance.pitch = 1.0;
            utterance.volume = 0.8;

            utterance.onend = () => {
                // Restore hold music volume
                if (holdMusicElements) {
                    holdMusicElements.gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime + 0.5);
                }
                resolve();
            };

            speechSynthesis.speak(utterance);
        });
    }

    async processQueue() {
        // Check for available agents
        while (this.activeCalls.size < this.maxConcurrentCalls && this.activeQueue.length > 0) {
            const nextCaller = this.activeQueue.shift();
            
            if (nextCaller) {
                await this.routeCallFromQueue(nextCaller);
            }
        }

        // Update positions for remaining callers
        this.updateQueuePositions();
    }

    async routeCallFromQueue(queueEntry) {
        try {
            // Stop hold experience
            this.stopHoldExperience(queueEntry);
            
            // Calculate wait time for statistics
            const waitTime = (Date.now() - queueEntry.queuedAt.getTime()) / 1000;
            this.updateWaitTimeStats(waitTime);
            
            // Route to appropriate handler
            const routingResult = await this.routeCall(queueEntry);
            
            if (routingResult.success) {
                // Add to active calls
                this.activeCalls.set(queueEntry.callId, {
                    ...queueEntry,
                    startedAt: new Date(),
                    waitTime
                });
                
                console.log(`Call ${queueEntry.callId} routed from queue after ${Math.round(waitTime)}s wait`);
            } else {
                // If routing failed, try to re-queue or handle error
                console.error('Failed to route call from queue:', routingResult);
            }
            
        } catch (error) {
            console.error('Error routing call from queue:', error);
        }
    }

    async routeCall(callData) {
        // Route to unified telephony controller
        if (window.telephonyController) {
            return await telephonyController.handleIncomingCall(callData);
        }
        
        // Fallback routing
        return {
            success: true,
            handler: 'ai-agent'
        };
    }

    stopHoldExperience(queueEntry) {
        // Stop all audio elements
        const audioElements = queueEntry.audioElements;
        
        // Stop hold music
        const holdMusic = audioElements.get('holdMusic');
        if (holdMusic && holdMusic.source) {
            holdMusic.source.stop();
        }
        
        // Clear position announcements
        const announcement = audioElements.get('positionAnnouncement');
        if (announcement) {
            clearInterval(announcement);
        }
        
        audioElements.clear();
    }

    updateQueuePositions() {
        this.activeQueue.forEach((entry, index) => {
            entry.position = index + 1;
            entry.estimatedWait = this.calculateEstimatedWait() - (index * this.averageCallDuration * 0.3);
        });
    }

    updateWaitTimeStats(waitTime) {
        this.stats.totalCallsHandled++;
        this.stats.totalWaitTime += waitTime;
        this.stats.averageWaitTime = this.stats.totalWaitTime / this.stats.totalCallsHandled;
        this.stats.longestWaitTime = Math.max(this.stats.longestWaitTime, waitTime);
    }

    onCallCompleted(callId, duration) {
        const activeCall = this.activeCalls.get(callId);
        if (activeCall) {
            // Update average call duration for better estimates
            this.averageCallDuration = (this.averageCallDuration * 0.9) + (duration * 0.1);
            
            // Remove from active calls
            this.activeCalls.delete(callId);
            
            // Process next in queue
            this.processQueue();
            
            console.log(`Call ${callId} completed. Duration: ${Math.round(duration)}s. Queue processing...`);
        }
    }

    onCallAbandoned(callId) {
        // Remove from queue if present
        const queueIndex = this.activeQueue.findIndex(entry => entry.callId === callId);
        if (queueIndex >= 0) {
            const abandonedCall = this.activeQueue.splice(queueIndex, 1)[0];
            this.stopHoldExperience(abandonedCall);
            
            // Update statistics
            this.stats.callsAbandoned++;
            
            // Update positions
            this.updateQueuePositions();
            
            console.log(`Call ${callId} abandoned from queue position ${abandonedCall.position}`);
        }
    }

    startQueueProcessor() {
        // Process queue every 5 seconds
        setInterval(() => {
            this.processQueue();
        }, 5000);
    }

    getRestaurantName() {
        // Get restaurant name from various sources
        if (window.localConversationEngine?.knowledgeBase?.restaurant?.name) {
            return window.localConversationEngine.knowledgeBase.restaurant.name;
        }
        
        if (window.voipManager) {
            // Try to get from first configured number
            for (const numberConfig of window.voipManager.numbers.values()) {
                if (numberConfig.restaurant) {
                    return numberConfig.restaurant;
                }
            }
        }
        
        return "our restaurant";
    }

    createQueueInterface() {
        const container = document.createElement('div');
        container.id = 'queue-manager';
        container.className = 'queue-manager-container';
        container.innerHTML = `
            <div class="queue-manager-header">
                <h3>📞 Call Queue Manager</h3>
                <button class="queue-minimize-btn" onclick="this.closest('.queue-manager-container').classList.toggle('minimized')">−</button>
            </div>
            <div class="queue-manager-body">
                <div class="queue-stats">
                    <div class="stat-item">
                        <span class="stat-label">In Queue:</span>
                        <span class="stat-value" id="queue-count">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Active Calls:</span>
                        <span class="stat-value" id="active-count">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Avg Wait:</span>
                        <span class="stat-value" id="avg-wait">0s</span>
                    </div>
                </div>
                
                <div class="queue-list" id="queue-list">
                    <!-- Queue entries will be populated here -->
                </div>
                
                <div class="queue-controls">
                    <label>
                        <input type="checkbox" id="hold-music-toggle" ${this.holdMusicEnabled ? 'checked' : ''}>
                        Hold Music
                    </label>
                    <label>
                        <input type="number" id="max-queue-size" value="${this.maxQueueSize}" min="1" max="50">
                        Max Queue Size
                    </label>
                </div>
            </div>
        `;

        document.body.appendChild(container);
        this.queueInterface = container;
        this.setupQueueEventListeners();
        
        // Start updating interface
        this.startInterfaceUpdater();
    }

    setupQueueEventListeners() {
        // Hold music toggle
        const holdMusicToggle = this.queueInterface.querySelector('#hold-music-toggle');
        holdMusicToggle.addEventListener('change', (e) => {
            this.holdMusicEnabled = e.target.checked;
        });

        // Max queue size
        const maxQueueInput = this.queueInterface.querySelector('#max-queue-size');
        maxQueueInput.addEventListener('change', (e) => {
            this.maxQueueSize = Math.max(1, Math.min(50, parseInt(e.target.value)));
        });
    }

    updateQueueInterface() {
        if (!this.queueInterface) return;

        // Update statistics
        this.queueInterface.querySelector('#queue-count').textContent = this.activeQueue.length;
        this.queueInterface.querySelector('#active-count').textContent = this.activeCalls.size;
        this.queueInterface.querySelector('#avg-wait').textContent = `${Math.round(this.stats.averageWaitTime)}s`;

        // Update queue list
        const queueList = this.queueInterface.querySelector('#queue-list');
        queueList.innerHTML = '';

        if (this.activeQueue.length === 0) {
            queueList.innerHTML = '<p class="no-queue">No calls in queue</p>';
            return;
        }

        this.activeQueue.forEach(entry => {
            const waitTime = Math.round((Date.now() - entry.queuedAt.getTime()) / 1000);
            const queueItem = document.createElement('div');
            queueItem.className = 'queue-item';
            queueItem.innerHTML = `
                <div class="queue-caller-info">
                    <span class="caller-number">${entry.phoneNumber}</span>
                    <span class="queue-position">#${entry.position}</span>
                    <span class="priority-badge ${entry.priority}">${entry.priority}</span>
                </div>
                <div class="queue-timing">
                    <span class="wait-time">Waiting: ${waitTime}s</span>
                    <span class="estimated-wait">Est: ${Math.round(entry.estimatedWait)}s</span>
                </div>
            `;
            queueList.appendChild(queueItem);
        });
    }

    startInterfaceUpdater() {
        setInterval(() => {
            this.updateQueueInterface();
        }, 1000);
    }

    getQueueStats() {
        return {
            ...this.stats,
            currentQueueSize: this.activeQueue.length,
            activeCalls: this.activeCalls.size,
            queueCapacity: this.maxQueueSize,
            callCapacity: this.maxConcurrentCalls
        };
    }
}

// Initialize call queue manager
let callQueueManager;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        callQueueManager = new CallQueueManager({
            maxConcurrentCalls: 3,
            maxQueueSize: 10,
            holdMusicEnabled: true,
            estimatedWaitTimeEnabled: true
        });
    });
} else {
    callQueueManager = new CallQueueManager({
        maxConcurrentCalls: 3,
        maxQueueSize: 10,
        holdMusicEnabled: true,
        estimatedWaitTimeEnabled: true
    });
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CallQueueManager;
}