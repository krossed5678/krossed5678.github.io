/**
 * Voice Quality Optimization System
 * Enhances audio clarity, reduces latency, and improves speech recognition accuracy
 * Includes noise reduction, echo cancellation, and adaptive audio processing
 */

class VoiceQualityOptimization {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.mediaStream = null;
        this.sourceNode = null;
        this.processingChain = [];
        this.qualityMetrics = {
            signalToNoise: 0,
            audioLevel: 0,
            backgroundNoise: 0,
            latency: 0,
            jitter: 0,
            packetLoss: 0
        };
        this.optimizationSettings = {
            noiseReduction: true,
            echoCancellation: true,
            autoGainControl: true,
            adaptiveBitrate: true,
            qualityEnhancement: true
        };
        this.calibrationData = new Map();
        this.adaptiveSettings = new Map();
        this.init();
    }

    async init() {
        console.log('🎙️ Initializing Voice Quality Optimization...');
        
        try {
            // Initialize audio context
            await this.initializeAudioContext();
            
            // Setup audio processing chain
            this.setupAudioProcessingChain();
            
            // Initialize quality monitoring
            this.setupQualityMonitoring();
            
            // Load optimization presets
            this.loadOptimizationPresets();
            
            // Create optimization interface
            this.createOptimizationInterface();
            
            // Start quality analysis
            this.startQualityAnalysis();
            
            console.log('✅ Voice Quality Optimization ready');
        } catch (error) {
            console.error('❌ Failed to initialize voice optimization:', error);
            this.handleInitializationError(error);
        }
    }

    async initializeAudioContext() {
        try {
            // Create audio context with optimal settings
            const contextOptions = {
                latencyHint: 'interactive',
                sampleRate: 48000,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            };

            this.audioContext = new (window.AudioContext || window.webkitAudioContext)(contextOptions);
            
            // Resume if suspended (browser policy)
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            console.log(`🎵 Audio context initialized - Sample Rate: ${this.audioContext.sampleRate}Hz`);
        } catch (error) {
            console.error('❌ Audio context initialization failed:', error);
            throw error;
        }
    }

    setupAudioProcessingChain() {
        // Create processing nodes for audio enhancement
        this.processingNodes = {
            // Input gain control
            inputGain: this.audioContext.createGain(),
            
            // High-pass filter for noise reduction
            highPassFilter: this.audioContext.createBiquadFilter(),
            
            // Low-pass filter for quality enhancement
            lowPassFilter: this.audioContext.createBiquadFilter(),
            
            // Compressor for dynamic range control
            compressor: this.audioContext.createDynamicsCompressor(),
            
            // Output gain control
            outputGain: this.audioContext.createGain(),
            
            // Analyser for real-time monitoring
            analyser: this.audioContext.createAnalyser()
        };

        // Configure high-pass filter (remove low-frequency noise)
        this.processingNodes.highPassFilter.type = 'highpass';
        this.processingNodes.highPassFilter.frequency.value = 80; // Remove below 80Hz
        this.processingNodes.highPassFilter.Q.value = 0.7;

        // Configure low-pass filter (remove high-frequency noise)
        this.processingNodes.lowPassFilter.type = 'lowpass';
        this.processingNodes.lowPassFilter.frequency.value = 8000; // Remove above 8kHz for speech
        this.processingNodes.lowPassFilter.Q.value = 0.7;

        // Configure compressor for consistent levels
        this.processingNodes.compressor.threshold.value = -24;
        this.processingNodes.compressor.knee.value = 30;
        this.processingNodes.compressor.ratio.value = 12;
        this.processingNodes.compressor.attack.value = 0.003;
        this.processingNodes.compressor.release.value = 0.25;

        // Configure analyser for monitoring
        this.processingNodes.analyser.fftSize = 2048;
        this.processingNodes.analyser.smoothingTimeConstant = 0.8;

        this.analyser = this.processingNodes.analyser;
        
        console.log('🔧 Audio processing chain configured');
    }

    async connectAudioProcessing(stream) {
        try {
            if (!this.audioContext || !stream) return null;

            this.mediaStream = stream;
            
            // Create source from media stream
            this.sourceNode = this.audioContext.createMediaStreamSource(stream);
            
            // Connect processing chain
            let currentNode = this.sourceNode;
            const processingOrder = [
                'inputGain',
                'highPassFilter', 
                'compressor',
                'lowPassFilter',
                'outputGain',
                'analyser'
            ];

            for (const nodeName of processingOrder) {
                const node = this.processingNodes[nodeName];
                if (node && this.optimizationSettings.qualityEnhancement) {
                    currentNode.connect(node);
                    currentNode = node;
                }
            }

            // Create destination for processed audio
            const destination = this.audioContext.createMediaStreamDestination();
            currentNode.connect(destination);

            console.log('🎙️ Audio processing connected');
            return destination.stream;
            
        } catch (error) {
            console.error('❌ Failed to connect audio processing:', error);
            return stream; // Return original stream as fallback
        }
    }

    setupQualityMonitoring() {
        // Initialize quality metrics monitoring
        this.qualityBuffer = new Float32Array(this.analyser?.frequencyBinCount || 1024);
        this.timeBuffer = new Uint8Array(this.analyser?.frequencyBinCount || 1024);
        
        // Latency measurement
        this.latencyMeasurement = {
            startTime: 0,
            samples: [],
            running: false
        };

        // Network quality metrics
        this.networkMetrics = {
            packetsSent: 0,
            packetsLost: 0,
            jitterBuffer: []
        };

        console.log('📊 Quality monitoring initialized');
    }

    startQualityAnalysis() {
        // Start continuous quality analysis
        this.qualityAnalysisInterval = setInterval(() => {
            this.analyzeAudioQuality();
            this.updateOptimizationSettings();
            this.updateQualityDisplay();
        }, 1000);

        // Start latency measurement
        this.latencyMeasurementInterval = setInterval(() => {
            this.measureLatency();
        }, 5000);

        console.log('📈 Quality analysis started');
    }

    analyzeAudioQuality() {
        if (!this.analyser) return;

        // Get frequency and time domain data
        this.analyser.getFloatFrequencyData(this.qualityBuffer);
        this.analyser.getByteTimeDomainData(this.timeBuffer);

        // Calculate signal level
        const signalLevel = this.calculateSignalLevel();
        
        // Calculate noise level
        const noiseLevel = this.calculateNoiseLevel();
        
        // Calculate signal-to-noise ratio
        const snr = signalLevel > 0 ? signalLevel / Math.max(noiseLevel, 0.001) : 0;
        
        // Update metrics
        this.qualityMetrics.audioLevel = signalLevel;
        this.qualityMetrics.backgroundNoise = noiseLevel;
        this.qualityMetrics.signalToNoise = snr;
        
        // Detect quality issues
        this.detectQualityIssues();
        
        // Log quality assessment
        this.logQualityAssessment();
    }

    calculateSignalLevel() {
        // Calculate RMS level from time domain data
        let sum = 0;
        for (let i = 0; i < this.timeBuffer.length; i++) {
            const sample = (this.timeBuffer[i] - 128) / 128; // Convert to -1 to 1
            sum += sample * sample;
        }
        return Math.sqrt(sum / this.timeBuffer.length);
    }

    calculateNoiseLevel() {
        // Estimate noise floor from low-energy frequency bins
        const noiseFloor = [];
        
        for (let i = 0; i < this.qualityBuffer.length; i++) {
            const magnitude = this.qualityBuffer[i];
            if (magnitude < -40) { // dB threshold for noise floor
                noiseFloor.push(Math.pow(10, magnitude / 20));
            }
        }
        
        if (noiseFloor.length === 0) return 0.001;
        
        const avgNoise = noiseFloor.reduce((a, b) => a + b) / noiseFloor.length;
        return avgNoise;
    }

    detectQualityIssues() {
        const issues = [];

        // Check signal level
        if (this.qualityMetrics.audioLevel < 0.01) {
            issues.push({
                type: 'low_signal',
                severity: 'high',
                message: 'Input signal too low - check microphone gain'
            });
        } else if (this.qualityMetrics.audioLevel > 0.9) {
            issues.push({
                type: 'clipping',
                severity: 'high', 
                message: 'Input signal clipping - reduce microphone gain'
            });
        }

        // Check noise level
        if (this.qualityMetrics.backgroundNoise > 0.1) {
            issues.push({
                type: 'high_noise',
                severity: 'medium',
                message: 'High background noise detected'
            });
        }

        // Check signal-to-noise ratio
        if (this.qualityMetrics.signalToNoise < 10) {
            issues.push({
                type: 'poor_snr',
                severity: 'medium',
                message: 'Poor signal-to-noise ratio'
            });
        }

        // Check latency
        if (this.qualityMetrics.latency > 150) {
            issues.push({
                type: 'high_latency',
                severity: 'medium',
                message: 'High audio latency detected'
            });
        }

        this.qualityIssues = issues;
        
        // Auto-correct issues when possible
        this.autoCorrectIssues(issues);
    }

    autoCorrectIssues(issues) {
        for (const issue of issues) {
            switch (issue.type) {
                case 'low_signal':
                    this.adjustInputGain(1.5); // Increase gain
                    break;
                    
                case 'clipping':
                    this.adjustInputGain(0.7); // Reduce gain
                    break;
                    
                case 'high_noise':
                    this.enhanceNoiseReduction();
                    break;
                    
                case 'poor_snr':
                    this.optimizeForSpeech();
                    break;
                    
                case 'high_latency':
                    this.optimizeLatency();
                    break;
            }
        }
    }

    adjustInputGain(factor) {
        if (this.processingNodes.inputGain) {
            const currentGain = this.processingNodes.inputGain.gain.value;
            const newGain = Math.min(Math.max(currentGain * factor, 0.1), 3.0);
            
            this.processingNodes.inputGain.gain.setValueAtTime(
                newGain, 
                this.audioContext.currentTime
            );
            
            console.log(`🎛️ Adjusted input gain: ${currentGain.toFixed(2)} → ${newGain.toFixed(2)}`);
        }
    }

    enhanceNoiseReduction() {
        if (this.processingNodes.highPassFilter) {
            // Increase high-pass filter frequency to remove more noise
            const currentFreq = this.processingNodes.highPassFilter.frequency.value;
            const newFreq = Math.min(currentFreq * 1.2, 200);
            
            this.processingNodes.highPassFilter.frequency.setValueAtTime(
                newFreq,
                this.audioContext.currentTime
            );
            
            console.log(`🔇 Enhanced noise reduction: ${currentFreq}Hz → ${newFreq}Hz`);
        }
    }

    optimizeForSpeech() {
        // Optimize filters for speech frequency range (300-3400Hz)
        if (this.processingNodes.highPassFilter) {
            this.processingNodes.highPassFilter.frequency.setValueAtTime(
                300,
                this.audioContext.currentTime
            );
        }
        
        if (this.processingNodes.lowPassFilter) {
            this.processingNodes.lowPassFilter.frequency.setValueAtTime(
                3400,
                this.audioContext.currentTime
            );
        }
        
        // Adjust compressor for speech
        if (this.processingNodes.compressor) {
            this.processingNodes.compressor.threshold.setValueAtTime(
                -18,
                this.audioContext.currentTime
            );
            this.processingNodes.compressor.ratio.setValueAtTime(
                8,
                this.audioContext.currentTime
            );
        }
        
        console.log('🗣️ Optimized for speech quality');
    }

    optimizeLatency() {
        // Reduce buffer sizes and processing delay
        if (this.audioContext.baseLatency !== undefined) {
            console.log(`⚡ Current base latency: ${this.audioContext.baseLatency * 1000}ms`);
        }
        
        // Adjust analyser for lower latency
        if (this.analyser) {
            this.analyser.fftSize = Math.max(this.analyser.fftSize / 2, 256);
            this.analyser.smoothingTimeConstant = 0.3;
        }
        
        console.log('⚡ Latency optimization applied');
    }

    async measureLatency() {
        // Measure audio processing latency
        if (!this.audioContext) return;

        const startTime = performance.now();
        
        try {
            // Measure context processing time
            const contextTime = this.audioContext.currentTime;
            const realTime = performance.now() / 1000;
            
            const latency = (realTime - contextTime) * 1000; // Convert to ms
            this.qualityMetrics.latency = Math.max(latency, 0);
            
            // Add to samples for averaging
            this.latencyMeasurement.samples.push(latency);
            if (this.latencyMeasurement.samples.length > 10) {
                this.latencyMeasurement.samples.shift();
            }
            
            // Calculate average latency
            const avgLatency = this.latencyMeasurement.samples.reduce((a, b) => a + b) / 
                              this.latencyMeasurement.samples.length;
            
            this.qualityMetrics.latency = avgLatency;
            
        } catch (error) {
            console.error('❌ Latency measurement failed:', error);
        }
    }

    updateOptimizationSettings() {
        // Adaptive optimization based on current conditions
        const metrics = this.qualityMetrics;
        
        // Auto-adjust noise reduction
        if (metrics.backgroundNoise > 0.05 && !this.optimizationSettings.noiseReduction) {
            this.optimizationSettings.noiseReduction = true;
            console.log('🔇 Auto-enabled noise reduction');
        }
        
        // Auto-adjust gain control
        if ((metrics.audioLevel < 0.02 || metrics.audioLevel > 0.8) && 
            !this.optimizationSettings.autoGainControl) {
            this.optimizationSettings.autoGainControl = true;
            console.log('🎛️ Auto-enabled gain control');
        }
        
        // Auto-adjust echo cancellation for high latency
        if (metrics.latency > 100 && !this.optimizationSettings.echoCancellation) {
            this.optimizationSettings.echoCancellation = true;
            console.log('🔄 Auto-enabled echo cancellation');
        }
    }

    logQualityAssessment() {
        const metrics = this.qualityMetrics;
        
        // Determine overall quality score
        let qualityScore = 100;
        
        if (metrics.signalToNoise < 10) qualityScore -= 20;
        if (metrics.signalToNoise < 5) qualityScore -= 30;
        if (metrics.backgroundNoise > 0.1) qualityScore -= 15;
        if (metrics.latency > 150) qualityScore -= 20;
        if (metrics.audioLevel < 0.01 || metrics.audioLevel > 0.9) qualityScore -= 25;
        
        qualityScore = Math.max(qualityScore, 0);
        
        this.overallQuality = {
            score: qualityScore,
            rating: this.getQualityRating(qualityScore),
            timestamp: new Date()
        };
        
        // Log significant quality changes
        if (this.lastQualityScore && Math.abs(qualityScore - this.lastQualityScore) > 10) {
            console.log(`📊 Audio quality: ${this.lastQualityScore}% → ${qualityScore}% (${this.getQualityRating(qualityScore)})`);
        }
        
        this.lastQualityScore = qualityScore;
    }

    getQualityRating(score) {
        if (score >= 90) return 'Excellent';
        if (score >= 75) return 'Good';
        if (score >= 60) return 'Fair';
        if (score >= 40) return 'Poor';
        return 'Very Poor';
    }

    loadOptimizationPresets() {
        // Predefined optimization presets for different scenarios
        this.presets = new Map([
            ['studio', {
                name: 'Studio Quality',
                noiseReduction: true,
                echoCancellation: false,
                autoGainControl: true,
                adaptiveBitrate: false,
                highPassFreq: 40,
                lowPassFreq: 16000,
                compressorRatio: 2,
                description: 'High-fidelity settings for studio environments'
            }],
            
            ['conference', {
                name: 'Conference Call',
                noiseReduction: true,
                echoCancellation: true,
                autoGainControl: true,
                adaptiveBitrate: true,
                highPassFreq: 100,
                lowPassFreq: 7000,
                compressorRatio: 6,
                description: 'Optimized for conference calls with multiple participants'
            }],
            
            ['mobile', {
                name: 'Mobile/Noisy Environment',
                noiseReduction: true,
                echoCancellation: true,
                autoGainControl: true,
                adaptiveBitrate: true,
                highPassFreq: 200,
                lowPassFreq: 4000,
                compressorRatio: 10,
                description: 'Aggressive noise reduction for mobile and noisy environments'
            }],
            
            ['speech', {
                name: 'Speech Recognition',
                noiseReduction: true,
                echoCancellation: false,
                autoGainControl: true,
                adaptiveBitrate: false,
                highPassFreq: 300,
                lowPassFreq: 3400,
                compressorRatio: 4,
                description: 'Optimized for speech recognition accuracy'
            }],
            
            ['restaurant', {
                name: 'Restaurant Environment',
                noiseReduction: true,
                echoCancellation: true,
                autoGainControl: true,
                adaptiveBitrate: true,
                highPassFreq: 150,
                lowPassFreq: 6000,
                compressorRatio: 8,
                description: 'Tailored for restaurant background noise and acoustics'
            }]
        ]);
        
        // Apply default restaurant preset
        this.applyPreset('restaurant');
        
        console.log(`🎛️ Loaded ${this.presets.size} optimization presets`);
    }

    applyPreset(presetName) {
        const preset = this.presets.get(presetName);
        if (!preset) {
            console.error(`❌ Preset not found: ${presetName}`);
            return;
        }
        
        // Apply preset settings
        this.optimizationSettings = {
            ...this.optimizationSettings,
            ...preset
        };
        
        // Apply to audio nodes
        if (this.processingNodes.highPassFilter) {
            this.processingNodes.highPassFilter.frequency.setValueAtTime(
                preset.highPassFreq,
                this.audioContext?.currentTime || 0
            );
        }
        
        if (this.processingNodes.lowPassFilter) {
            this.processingNodes.lowPassFilter.frequency.setValueAtTime(
                preset.lowPassFreq,
                this.audioContext?.currentTime || 0
            );
        }
        
        if (this.processingNodes.compressor) {
            this.processingNodes.compressor.ratio.setValueAtTime(
                preset.compressorRatio,
                this.audioContext?.currentTime || 0
            );
        }
        
        console.log(`🎛️ Applied preset: ${preset.name}`);
        
        // Emit preset change event
        const event = new CustomEvent('voicePresetChanged', {
            detail: { preset: presetName, settings: preset }
        });
        document.dispatchEvent(event);
    }

    createOptimizationInterface() {
        // Create voice quality control panel
        const qualityPanel = document.createElement('div');
        qualityPanel.className = 'voice-quality-panel';
        qualityPanel.innerHTML = `
            <div class="quality-header">
                <h2>🎙️ Voice Quality Optimization</h2>
                <div class="quality-score" id="quality-score">
                    <span class="score-value">--</span>
                    <span class="score-label">Quality Score</span>
                </div>
            </div>
            
            <div class="quality-content">
                <div class="metrics-section">
                    <h3>Audio Metrics</h3>
                    <div class="metrics-grid">
                        <div class="metric-item">
                            <label>Signal Level</label>
                            <div class="metric-bar">
                                <div class="bar-fill" id="signal-bar"></div>
                            </div>
                            <span class="metric-value" id="signal-value">0%</span>
                        </div>
                        
                        <div class="metric-item">
                            <label>Background Noise</label>
                            <div class="metric-bar">
                                <div class="bar-fill" id="noise-bar"></div>
                            </div>
                            <span class="metric-value" id="noise-value">0%</span>
                        </div>
                        
                        <div class="metric-item">
                            <label>Signal/Noise Ratio</label>
                            <div class="metric-bar">
                                <div class="bar-fill" id="snr-bar"></div>
                            </div>
                            <span class="metric-value" id="snr-value">0 dB</span>
                        </div>
                        
                        <div class="metric-item">
                            <label>Latency</label>
                            <div class="metric-bar">
                                <div class="bar-fill" id="latency-bar"></div>
                            </div>
                            <span class="metric-value" id="latency-value">0 ms</span>
                        </div>
                    </div>
                </div>
                
                <div class="presets-section">
                    <h3>Optimization Presets</h3>
                    <div class="presets-grid" id="presets-grid"></div>
                </div>
                
                <div class="settings-section">
                    <h3>Advanced Settings</h3>
                    <div class="settings-grid">
                        <label class="setting-item">
                            <input type="checkbox" id="noise-reduction" checked>
                            <span>Noise Reduction</span>
                        </label>
                        <label class="setting-item">
                            <input type="checkbox" id="echo-cancellation" checked>
                            <span>Echo Cancellation</span>
                        </label>
                        <label class="setting-item">
                            <input type="checkbox" id="auto-gain" checked>
                            <span>Auto Gain Control</span>
                        </label>
                        <label class="setting-item">
                            <input type="checkbox" id="adaptive-bitrate" checked>
                            <span>Adaptive Bitrate</span>
                        </label>
                    </div>
                </div>
                
                <div class="issues-section">
                    <h3>Quality Issues</h3>
                    <div id="quality-issues" class="issues-list"></div>
                </div>
            </div>
        `;
        
        // Add styles
        this.addQualityStyles();
        
        // Add to page (hidden by default)
        qualityPanel.style.display = 'none';
        document.body.appendChild(qualityPanel);
        
        // Setup event listeners
        this.setupQualityEventListeners();
        
        // Populate presets
        this.populatePresets();
        
        console.log('🎨 Voice quality interface created');
    }

    addQualityStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .voice-quality-panel {
                position: fixed;
                top: 20px;
                right: 480px;
                width: 450px;
                max-height: 80vh;
                background: white;
                border-radius: 16px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
                overflow: hidden;
                z-index: 9997;
                font-family: system-ui, -apple-system, sans-serif;
            }
            
            .quality-header {
                background: linear-gradient(135deg, #ec4899 0%, #be185d 100%);
                color: white;
                padding: 16px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .quality-header h2 {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
            }
            
            .quality-score {
                text-align: center;
            }
            
            .score-value {
                display: block;
                font-size: 24px;
                font-weight: bold;
            }
            
            .score-label {
                font-size: 12px;
                opacity: 0.9;
            }
            
            .quality-content {
                padding: 20px;
                max-height: 70vh;
                overflow-y: auto;
            }
            
            .quality-content h3 {
                margin: 0 0 12px 0;
                font-size: 16px;
                font-weight: 600;
                color: #1f2937;
            }
            
            .metrics-section {
                margin-bottom: 24px;
            }
            
            .metrics-grid {
                display: grid;
                gap: 16px;
            }
            
            .metric-item {
                display: grid;
                grid-template-columns: 1fr 2fr auto;
                align-items: center;
                gap: 12px;
            }
            
            .metric-item label {
                font-size: 14px;
                font-weight: 500;
                color: #374151;
            }
            
            .metric-bar {
                height: 8px;
                background: #e5e7eb;
                border-radius: 4px;
                overflow: hidden;
            }
            
            .bar-fill {
                height: 100%;
                background: linear-gradient(90deg, #10b981 0%, #059669 100%);
                width: 0%;
                transition: width 0.3s ease;
            }
            
            .bar-fill.warning {
                background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);
            }
            
            .bar-fill.error {
                background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
            }
            
            .metric-value {
                font-size: 12px;
                font-weight: 600;
                color: #6b7280;
                min-width: 60px;
            }
            
            .presets-section {
                margin-bottom: 24px;
            }
            
            .presets-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 8px;
            }
            
            .preset-btn {
                padding: 12px;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                background: white;
                cursor: pointer;
                text-align: left;
                font-size: 14px;
                transition: all 0.2s ease;
            }
            
            .preset-btn:hover {
                border-color: #ec4899;
                background: #fdf2f8;
            }
            
            .preset-btn.active {
                border-color: #ec4899;
                background: #ec4899;
                color: white;
            }
            
            .preset-name {
                font-weight: 600;
                margin-bottom: 4px;
            }
            
            .preset-desc {
                font-size: 11px;
                opacity: 0.8;
            }
            
            .settings-section {
                margin-bottom: 24px;
            }
            
            .settings-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 12px;
            }
            
            .setting-item {
                display: flex;
                align-items: center;
                gap: 8px;
                cursor: pointer;
                font-size: 14px;
            }
            
            .setting-item input[type="checkbox"] {
                margin: 0;
            }
            
            .issues-section {
                margin-bottom: 16px;
            }
            
            .issues-list {
                max-height: 120px;
                overflow-y: auto;
            }
            
            .issue-item {
                padding: 8px 12px;
                margin-bottom: 8px;
                border-radius: 6px;
                font-size: 13px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .issue-high {
                background: #fee2e2;
                border-left: 4px solid #dc2626;
                color: #7f1d1d;
            }
            
            .issue-medium {
                background: #fef3c7;
                border-left: 4px solid #f59e0b;
                color: #92400e;
            }
            
            .issue-low {
                background: #dbeafe;
                border-left: 4px solid #3b82f6;
                color: #1e3a8a;
            }
            
            .no-issues {
                text-align: center;
                color: #10b981;
                font-weight: 500;
                padding: 20px;
            }
        `;
        document.head.appendChild(style);
    }

    populatePresets() {
        const container = document.getElementById('presets-grid');
        if (!container) return;
        
        container.innerHTML = Array.from(this.presets.entries()).map(([id, preset]) => `
            <button class="preset-btn" data-preset="${id}">
                <div class="preset-name">${preset.name}</div>
                <div class="preset-desc">${preset.description}</div>
            </button>
        `).join('');
        
        // Mark restaurant preset as active by default
        const restaurantBtn = container.querySelector('[data-preset="restaurant"]');
        if (restaurantBtn) {
            restaurantBtn.classList.add('active');
        }
    }

    setupQualityEventListeners() {
        // Preset buttons
        document.addEventListener('click', (event) => {
            if (event.target.closest('.preset-btn')) {
                const btn = event.target.closest('.preset-btn');
                const presetId = btn.dataset.preset;
                
                // Remove active class from all buttons
                document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Apply preset
                this.applyPreset(presetId);
            }
        });
        
        // Settings checkboxes
        const settingsMap = {
            'noise-reduction': 'noiseReduction',
            'echo-cancellation': 'echoCancellation',
            'auto-gain': 'autoGainControl',
            'adaptive-bitrate': 'adaptiveBitrate'
        };
        
        Object.entries(settingsMap).forEach(([id, setting]) => {
            const checkbox = document.getElementById(id);
            if (checkbox) {
                checkbox.addEventListener('change', () => {
                    this.optimizationSettings[setting] = checkbox.checked;
                    console.log(`🔧 ${setting}: ${checkbox.checked}`);
                });
            }
        });
    }

    updateQualityDisplay() {
        // Update quality score
        const scoreElement = document.querySelector('.score-value');
        if (scoreElement && this.overallQuality) {
            scoreElement.textContent = `${this.overallQuality.score}%`;
        }
        
        // Update metric bars and values
        this.updateMetricBar('signal', this.qualityMetrics.audioLevel, 1.0, '%');
        this.updateMetricBar('noise', this.qualityMetrics.backgroundNoise, 0.2, '%');
        this.updateMetricBar('snr', this.qualityMetrics.signalToNoise, 50, 'dB');
        this.updateMetricBar('latency', this.qualityMetrics.latency, 200, 'ms');
        
        // Update issues display
        this.updateIssuesDisplay();
    }

    updateMetricBar(metric, value, maxValue, unit) {
        const bar = document.getElementById(`${metric}-bar`);
        const valueElement = document.getElementById(`${metric}-value`);
        
        if (!bar || !valueElement) return;
        
        const percentage = Math.min((value / maxValue) * 100, 100);
        const displayValue = unit === '%' ? 
            Math.round(value * 100) : 
            Math.round(value);
        
        bar.style.width = `${percentage}%`;
        
        // Color coding based on quality
        bar.className = 'bar-fill';
        if (metric === 'signal' && (percentage < 20 || percentage > 90)) {
            bar.classList.add('warning');
        } else if (metric === 'noise' && percentage > 50) {
            bar.classList.add('error');
        } else if (metric === 'snr' && percentage < 40) {
            bar.classList.add('warning');
        } else if (metric === 'latency' && percentage > 75) {
            bar.classList.add('error');
        }
        
        valueElement.textContent = `${displayValue}${unit}`;
    }

    updateIssuesDisplay() {
        const container = document.getElementById('quality-issues');
        if (!container) return;
        
        if (!this.qualityIssues || this.qualityIssues.length === 0) {
            container.innerHTML = '<div class="no-issues">✅ No quality issues detected</div>';
            return;
        }
        
        container.innerHTML = this.qualityIssues.map(issue => `
            <div class="issue-item issue-${issue.severity}">
                <span>${this.getIssueIcon(issue.severity)}</span>
                <span>${issue.message}</span>
            </div>
        `).join('');
    }

    getIssueIcon(severity) {
        switch (severity) {
            case 'high': return '🚨';
            case 'medium': return '⚠️';
            case 'low': return 'ℹ️';
            default: return '⚪';
        }
    }

    handleInitializationError(error) {
        // Graceful degradation when optimization fails
        console.warn('🔄 Voice optimization unavailable, using basic audio');
        
        // Disable optimization features
        this.optimizationSettings = {
            noiseReduction: false,
            echoCancellation: false,
            autoGainControl: false,
            adaptiveBitrate: false,
            qualityEnhancement: false
        };
        
        if (window.safeNotify) {
            window.safeNotify(
                '🎙️ Advanced voice optimization unavailable - using basic audio mode',
                'info'
            );
        }
    }

    showQualityPanel() {
        const panel = document.querySelector('.voice-quality-panel');
        if (panel) {
            panel.style.display = 'block';
            this.updateQualityDisplay();
        }
    }

    hideQualityPanel() {
        const panel = document.querySelector('.voice-quality-panel');
        if (panel) {
            panel.style.display = 'none';
        }
    }

    stopQualityAnalysis() {
        if (this.qualityAnalysisInterval) {
            clearInterval(this.qualityAnalysisInterval);
            this.qualityAnalysisInterval = null;
        }
        
        if (this.latencyMeasurementInterval) {
            clearInterval(this.latencyMeasurementInterval);
            this.latencyMeasurementInterval = null;
        }
    }

    getStatus() {
        return {
            optimizationActive: Boolean(this.audioContext),
            qualityScore: this.overallQuality?.score || 0,
            qualityRating: this.overallQuality?.rating || 'Unknown',
            currentPreset: Array.from(this.presets.entries())
                .find(([id, preset]) => document.querySelector(`[data-preset="${id}"].active`))?.[0] || 'restaurant',
            issuesCount: this.qualityIssues?.length || 0,
            latency: this.qualityMetrics.latency,
            signalLevel: Math.round(this.qualityMetrics.audioLevel * 100)
        };
    }
}

// Initialize voice quality optimization
window.voiceOptimization = new VoiceQualityOptimization();

// Export for module environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VoiceQualityOptimization;
}

console.log('🎙️ Voice Quality Optimization loaded');