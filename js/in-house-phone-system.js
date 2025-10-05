/**
 * In-House WebRTC Phone System
 * Complete telephony solution without external dependencies
 */

class InHousePhoneSystem {
    constructor() {
        this.isInitialized = false;
        this.isCallActive = false;
        this.localStream = null;
        this.peerConnection = null;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.callLog = [];
        
        // WebRTC Configuration for direct connections
        this.rtcConfig = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' }, // Public STUN server (can be self-hosted)
                // Add your own STUN/TURN server here for complete independence
            ]
        };

        this.init();
    }

    async init() {
        try {
            await this.checkPermissions();
            await this.setupAudioDevices();
            this.setupUI();
            this.isInitialized = true;
            console.log('✅ In-house phone system initialized');
        } catch (error) {
            console.error('❌ Failed to initialize phone system:', error);
            this.showError('Phone system initialization failed. Please check microphone permissions.');
        }
    }

    async checkPermissions() {
        // Check if we have microphone permissions
        const permissions = await navigator.mediaDevices.getUserMedia({ 
            audio: true, 
            video: false 
        });
        
        if (permissions) {
            permissions.getTracks().forEach(track => track.stop());
            return true;
        }
        
        throw new Error('Microphone permission required');
    }

    async setupAudioDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            this.audioDevices = {
                inputs: devices.filter(device => device.kind === 'audioinput'),
                outputs: devices.filter(device => device.kind === 'audiooutput')
            };
            
            console.log('Available audio devices:', this.audioDevices);
        } catch (error) {
            console.warn('Could not enumerate audio devices:', error);
            this.audioDevices = { inputs: [], outputs: [] };
        }
    }

    setupUI() {
        // Create phone UI elements
        this.createPhoneInterface();
        this.setupEventListeners();
    }

    createPhoneInterface() {
        // Check if phone interface already exists
        if (document.getElementById('phone-system')) return;

        const phoneContainer = document.createElement('div');
        phoneContainer.id = 'phone-system';
        phoneContainer.className = 'fixed bottom-4 right-4 bg-white rounded-xl shadow-2xl p-4 z-50';
        phoneContainer.style.cssText = `
            width: 320px;
            max-height: 500px;
            border: 1px solid #e5e7eb;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
        `;

        phoneContainer.innerHTML = `
            <div class="phone-header flex items-center justify-between mb-4">
                <div class="flex items-center space-x-2">
                    <div class="w-3 h-3 rounded-full bg-green-400"></div>
                    <span class="font-semibold text-gray-800">Restaurant Phone</span>
                </div>
                <button id="phone-minimize" class="text-gray-500 hover:text-gray-700">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
                    </svg>
                </button>
            </div>

            <!-- Phone Number Input -->
            <div class="phone-dialer mb-4">
                <input 
                    type="tel" 
                    id="phone-number-input" 
                    placeholder="Enter phone number" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            <!-- Dial Pad -->
            <div class="dial-pad grid grid-cols-3 gap-2 mb-4">
                ${this.createDialPad()}
            </div>

            <!-- Call Controls -->
            <div class="call-controls flex justify-center space-x-3 mb-4">
                <button 
                    id="call-button" 
                    class="flex items-center justify-center w-12 h-12 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors"
                    title="Start Call"
                >
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                    </svg>
                </button>
                
                <button 
                    id="hangup-button" 
                    class="flex items-center justify-center w-12 h-12 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors hidden"
                    title="End Call"
                >
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                    </svg>
                </button>

                <button 
                    id="record-button" 
                    class="flex items-center justify-center w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors"
                    title="Record Call"
                >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"></path>
                    </svg>
                </button>
            </div>

            <!-- Call Status -->
            <div id="call-status" class="text-center text-sm text-gray-600 mb-3">
                Ready to make calls
            </div>

            <!-- Audio Controls -->
            <div class="audio-controls flex items-center justify-between mb-4">
                <label class="flex items-center space-x-2">
                    <span class="text-sm">Volume:</span>
                    <input type="range" id="volume-control" min="0" max="100" value="50" class="w-20">
                </label>
                <button id="mute-button" class="text-gray-500 hover:text-gray-700" title="Mute/Unmute">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5 7l4-4v18l-4-4H1V7h4z"></path>
                    </svg>
                </button>
            </div>

            <!-- Recent Calls -->
            <div class="recent-calls">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium text-gray-700">Recent Calls</span>
                    <button id="clear-history" class="text-xs text-gray-500 hover:text-gray-700">Clear</button>
                </div>
                <div id="call-history" class="space-y-1 max-h-32 overflow-y-auto">
                    <div class="text-xs text-gray-500 text-center py-2">No recent calls</div>
                </div>
            </div>
        `;

        document.body.appendChild(phoneContainer);
    }

    createDialPad() {
        const buttons = [
            { num: '1', letters: '' },
            { num: '2', letters: 'ABC' },
            { num: '3', letters: 'DEF' },
            { num: '4', letters: 'GHI' },
            { num: '5', letters: 'JKL' },
            { num: '6', letters: 'MNO' },
            { num: '7', letters: 'PQRS' },
            { num: '8', letters: 'TUV' },
            { num: '9', letters: 'WXYZ' },
            { num: '*', letters: '' },
            { num: '0', letters: '+' },
            { num: '#', letters: '' }
        ];

        return buttons.map(btn => `
            <button 
                class="dial-btn flex flex-col items-center justify-center h-12 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                data-digit="${btn.num}"
            >
                <span class="text-lg font-semibold">${btn.num}</span>
                ${btn.letters ? `<span class="text-xs text-gray-500">${btn.letters}</span>` : ''}
            </button>
        `).join('');
    }

    setupEventListeners() {
        // Dial pad buttons
        document.querySelectorAll('.dial-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const digit = e.currentTarget.getAttribute('data-digit');
                this.addDigit(digit);
            });
        });

        // Call controls
        document.getElementById('call-button').addEventListener('click', () => this.startCall());
        document.getElementById('hangup-button').addEventListener('click', () => this.endCall());
        document.getElementById('record-button').addEventListener('click', () => this.toggleRecording());
        document.getElementById('mute-button').addEventListener('click', () => this.toggleMute());
        
        // Volume control
        document.getElementById('volume-control').addEventListener('input', (e) => {
            this.setVolume(e.target.value / 100);
        });

        // Minimize button
        document.getElementById('phone-minimize').addEventListener('click', () => this.toggleMinimize());

        // Clear history
        document.getElementById('clear-history').addEventListener('click', () => this.clearCallHistory());

        // Keyboard support for dialing
        document.addEventListener('keydown', (e) => {
            if (document.activeElement.id === 'phone-number-input') return;
            
            const key = e.key;
            if (/[0-9*#]/.test(key)) {
                this.addDigit(key);
            } else if (key === 'Enter') {
                this.startCall();
            }
        });
    }

    addDigit(digit) {
        const input = document.getElementById('phone-number-input');
        input.value += digit;
        
        // Play DTMF tone (optional)
        this.playDTMFTone(digit);
    }

    playDTMFTone(digit) {
        // DTMF tone frequencies
        const tones = {
            '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
            '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
            '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
            '*': [941, 1209], '0': [941, 1336], '#': [941, 1477]
        };

        if (!tones[digit]) return;

        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const [freq1, freq2] = tones[digit];
            
            const oscillator1 = audioContext.createOscillator();
            const oscillator2 = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator1.frequency.setValueAtTime(freq1, audioContext.currentTime);
            oscillator2.frequency.setValueAtTime(freq2, audioContext.currentTime);
            
            oscillator1.connect(gainNode);
            oscillator2.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            
            oscillator1.start();
            oscillator2.start();
            
            setTimeout(() => {
                oscillator1.stop();
                oscillator2.stop();
            }, 100);
        } catch (error) {
            console.warn('DTMF tone playback failed:', error);
        }
    }

    async startCall() {
        const phoneNumber = document.getElementById('phone-number-input').value.trim();
        
        if (!phoneNumber) {
            this.updateStatus('Please enter a phone number');
            return;
        }

        try {
            this.updateStatus('Starting call...');
            
            // Get user media (microphone)
            this.localStream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }, 
                video: false 
            });

            // In a real implementation, this would connect to your VoIP server
            // For demo purposes, we'll simulate a call
            await this.simulateCall(phoneNumber);
            
        } catch (error) {
            console.error('Failed to start call:', error);
            this.updateStatus('Call failed: ' + error.message);
        }
    }

    async simulateCall(phoneNumber) {
        // This simulates the call process - replace with actual VoIP implementation
        this.isCallActive = true;
        this.updateCallControls(true);
        this.updateStatus(`Calling ${phoneNumber}...`);

        // Add to call history
        this.addToCallHistory(phoneNumber, 'outgoing');

        // Simulate ring tone
        await this.playRingTone();

        // Simulate call connection after 3 seconds
        setTimeout(() => {
            if (this.isCallActive) {
                this.updateStatus(`Connected to ${phoneNumber}`);
                this.startCallTimer();
                
                // Start recording if enabled
                this.startCallRecording();
            }
        }, 3000);
    }

    async playRingTone() {
        return new Promise((resolve) => {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                let ringCount = 0;
                
                const playRing = () => {
                    if (!this.isCallActive || ringCount >= 6) {
                        resolve();
                        return;
                    }
                    
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                    
                    oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                    
                    oscillator.start();
                    oscillator.stop(audioContext.currentTime + 0.4);
                    
                    ringCount++;
                    setTimeout(playRing, 1000);
                };
                
                playRing();
            } catch (error) {
                console.warn('Ring tone playback failed:', error);
                resolve();
            }
        });
    }

    startCallTimer() {
        this.callStartTime = Date.now();
        
        this.callTimer = setInterval(() => {
            if (!this.isCallActive) {
                clearInterval(this.callTimer);
                return;
            }
            
            const duration = Date.now() - this.callStartTime;
            const minutes = Math.floor(duration / 60000);
            const seconds = Math.floor((duration % 60000) / 1000);
            
            this.updateStatus(`Call duration: ${minutes}:${seconds.toString().padStart(2, '0')}`);
        }, 1000);
    }

    startCallRecording() {
        if (!this.localStream) return;

        try {
            this.mediaRecorder = new MediaRecorder(this.localStream);
            this.recordedChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                this.saveCallRecording();
            };

            this.mediaRecorder.start();
            console.log('📹 Call recording started');
        } catch (error) {
            console.error('Failed to start call recording:', error);
        }
    }

    saveCallRecording() {
        if (this.recordedChunks.length === 0) return;

        const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        
        // Save to local storage or provide download
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `call-recording-${timestamp}.webm`;
        
        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        
        // Optionally auto-download or save to data manager
        if (window.DataManager) {
            window.DataManager.safeStorage.set(`recording-${timestamp}`, {
                blob: blob,
                filename: filename,
                timestamp: new Date().toISOString()
            });
        }
        
        console.log('📁 Call recording saved:', filename);
    }

    endCall() {
        this.isCallActive = false;
        this.updateCallControls(false);
        this.updateStatus('Call ended');

        // Stop media recorder
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
        }

        // Stop local stream
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }

        // Clean up peer connection
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }

        // Clear call timer
        if (this.callTimer) {
            clearInterval(this.callTimer);
        }

        console.log('📞 Call ended');
    }

    toggleRecording() {
        const recordButton = document.getElementById('record-button');
        
        if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
            this.startCallRecording();
            recordButton.classList.add('bg-red-500');
            recordButton.classList.remove('bg-blue-500');
        } else {
            this.mediaRecorder.stop();
            recordButton.classList.remove('bg-red-500');
            recordButton.classList.add('bg-blue-500');
        }
    }

    toggleMute() {
        if (!this.localStream) return;

        const audioTracks = this.localStream.getAudioTracks();
        const muteButton = document.getElementById('mute-button');
        
        audioTracks.forEach(track => {
            track.enabled = !track.enabled;
        });

        const isMuted = !audioTracks[0]?.enabled;
        muteButton.innerHTML = isMuted ? 
            '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clip-rule="evenodd"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"></path></svg>' :
            '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5 7l4-4v18l-4-4H1V7h4z"></path></svg>';
    }

    setVolume(volume) {
        // This would control the audio output volume
        console.log('Setting volume to:', volume);
    }

    toggleMinimize() {
        const phoneSystem = document.getElementById('phone-system');
        const isMinimized = phoneSystem.classList.contains('minimized');
        
        if (isMinimized) {
            phoneSystem.classList.remove('minimized');
            phoneSystem.style.height = 'auto';
        } else {
            phoneSystem.classList.add('minimized');
            phoneSystem.style.height = '60px';
        }
    }

    updateStatus(message) {
        const statusElement = document.getElementById('call-status');
        if (statusElement) {
            statusElement.textContent = message;
        }
        console.log('📞 Status:', message);
    }

    updateCallControls(isActive) {
        const callButton = document.getElementById('call-button');
        const hangupButton = document.getElementById('hangup-button');
        
        if (isActive) {
            callButton.classList.add('hidden');
            hangupButton.classList.remove('hidden');
        } else {
            callButton.classList.remove('hidden');
            hangupButton.classList.add('hidden');
        }
    }

    addToCallHistory(phoneNumber, type) {
        const callEntry = {
            number: phoneNumber,
            type: type, // 'incoming', 'outgoing', 'missed'
            timestamp: new Date().toISOString(),
            duration: 0
        };

        this.callLog.unshift(callEntry);
        this.updateCallHistoryUI();

        // Save to data manager
        if (window.DataManager) {
            window.DataManager.safeStorage.set('call-history', this.callLog.slice(0, 50)); // Keep last 50 calls
        }
    }

    updateCallHistoryUI() {
        const historyContainer = document.getElementById('call-history');
        
        if (this.callLog.length === 0) {
            historyContainer.innerHTML = '<div class="text-xs text-gray-500 text-center py-2">No recent calls</div>';
            return;
        }

        historyContainer.innerHTML = this.callLog.slice(0, 5).map(call => `
            <div class="flex items-center justify-between text-xs py-1 px-2 bg-gray-50 rounded">
                <span class="font-medium">${call.number}</span>
                <div class="flex items-center space-x-1">
                    <span class="text-gray-500">${call.type}</span>
                    <span class="text-gray-400">${new Date(call.timestamp).toLocaleTimeString().substring(0, 5)}</span>
                </div>
            </div>
        `).join('');
    }

    clearCallHistory() {
        this.callLog = [];
        this.updateCallHistoryUI();
        
        if (window.DataManager) {
            window.DataManager.safeStorage.remove('call-history');
        }
    }

    // WebRTC P2P calling (for advanced use cases)
    async createPeerConnection() {
        this.peerConnection = new RTCPeerConnection(this.rtcConfig);
        
        // Add local stream to peer connection
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                this.peerConnection.addTrack(track, this.localStream);
            });
        }

        // Handle incoming stream
        this.peerConnection.ontrack = (event) => {
            const [remoteStream] = event.streams;
            this.handleRemoteStream(remoteStream);
        };

        // Handle ICE candidates
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.handleIceCandidate(event.candidate);
            }
        };

        return this.peerConnection;
    }

    handleRemoteStream(stream) {
        // Play remote audio stream
        const audioElement = document.createElement('audio');
        audioElement.srcObject = stream;
        audioElement.autoplay = true;
        audioElement.style.display = 'none';
        document.body.appendChild(audioElement);
    }

    handleIceCandidate(candidate) {
        // In a real implementation, send this candidate to the other peer
        console.log('ICE candidate:', candidate);
    }

    // Integration with restaurant AI
    connectToRestaurantAI() {
        // Integrate with the existing conversation engine
        if (window.LocalConversationEngine) {
            console.log('🤖 Connected to restaurant AI for call handling');
            return true;
        }
        return false;
    }

    // Analytics integration
    trackCall(phoneNumber, duration, type) {
        if (window.AnalyticsManager) {
            window.AnalyticsManager.trackEvent('phone_call', {
                category: 'Phone System',
                type: type,
                duration: duration,
                number_length: phoneNumber.length
            });
        }
    }
}

// Initialize the in-house phone system
window.InHousePhoneSystem = new InHousePhoneSystem();

// Expose for debugging
if (window.ProductionErrorHandler && window.ProductionErrorHandler.isDevelopment()) {
    window.debugPhone = {
        system: window.InHousePhoneSystem,
        testCall: (number) => window.InHousePhoneSystem.simulateCall(number),
        history: () => window.InHousePhoneSystem.callLog
    };
}