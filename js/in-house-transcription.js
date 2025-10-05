/**
 * In-House Call Recording and Transcription System
 * Provides local speech-to-text processing without external APIs
 * Supports real-time transcription and call analysis
 */

class InHouseTranscriptionEngine {
    constructor() {
        this.isInitialized = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.transcriptionWorker = null;
        this.speechRecognition = null;
        this.activeRecordings = new Map();
        this.conversationHistory = [];
        
        this.initializeEngine();
    }

    async initializeEngine() {
        try {
            // Initialize Web Speech API for real-time transcription
            this.initializeSpeechRecognition();
            
            // Initialize Web Audio API for advanced processing
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Load local speech processing models (would be actual model files in production)
            await this.loadLocalModels();
            
            this.isInitialized = true;
            console.log('In-house transcription engine initialized');
        } catch (error) {
            console.error('Failed to initialize transcription engine:', error);
            this.fallbackToBasicRecording();
        }
    }

    initializeSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.speechRecognition = new SpeechRecognition();
            
            this.speechRecognition.continuous = true;
            this.speechRecognition.interimResults = true;
            this.speechRecognition.lang = 'en-US';
            
            this.speechRecognition.onresult = (event) => {
                this.handleSpeechResult(event);
            };
            
            this.speechRecognition.onerror = (event) => {
                console.warn('Speech recognition error:', event.error);
                this.handleSpeechError(event);
            };
        }
    }

    async loadLocalModels() {
        // In a real implementation, this would load actual ML models
        // For now, we'll simulate the loading process
        return new Promise(resolve => {
            setTimeout(() => {
                this.models = {
                    speechToText: 'local-stt-model',
                    sentimentAnalysis: 'local-sentiment-model',
                    keywordExtraction: 'local-keyword-model',
                    speakerDiarization: 'local-speaker-model'
                };
                resolve();
            }, 1000);
        });
    }

    async startRecording(callId, options = {}) {
        const {
            realTimeTranscription = true,
            speakerSeparation = true,
            sentimentAnalysis = true,
            keywordExtraction = true,
            audioQuality = 'high'
        } = options;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: audioQuality === 'high' ? 48000 : 22050
                }
            });

            const recording = {
                id: callId,
                stream,
                startTime: new Date(),
                options,
                chunks: [],
                transcription: {
                    realTime: [],
                    final: '',
                    speakers: speakerSeparation ? [] : null,
                    sentiment: sentimentAnalysis ? [] : null,
                    keywords: keywordExtraction ? [] : null
                }
            };

            // Set up MediaRecorder
            this.setupMediaRecorder(recording);
            
            // Set up real-time transcription if enabled
            if (realTimeTranscription && this.speechRecognition) {
                this.setupRealTimeTranscription(recording);
            }
            
            // Set up audio analysis
            if (speakerSeparation || sentimentAnalysis) {
                this.setupAudioAnalysis(recording);
            }

            this.activeRecordings.set(callId, recording);
            this.mediaRecorder.start(1000); // Record in 1-second chunks
            
            if (this.speechRecognition) {
                this.speechRecognition.start();
            }

            console.log(`Started recording for call ${callId}`);
            return recording;

        } catch (error) {
            console.error('Failed to start recording:', error);
            throw new Error(`Recording failed: ${error.message}`);
        }
    }

    setupMediaRecorder(recording) {
        this.mediaRecorder = new MediaRecorder(recording.stream, {
            mimeType: 'audio/webm;codecs=opus'
        });

        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recording.chunks.push(event.data);
                this.processAudioChunk(recording, event.data);
            }
        };

        this.mediaRecorder.onstop = () => {
            this.finalizeRecording(recording);
        };
    }

    setupRealTimeTranscription(recording) {
        this.currentRecording = recording;
        
        // The speech recognition results will be handled by handleSpeechResult
        this.speechRecognition.onstart = () => {
            console.log('Real-time transcription started');
        };
    }

    setupAudioAnalysis(recording) {
        // Set up Web Audio API analysis
        const source = this.audioContext.createMediaStreamSource(recording.stream);
        const analyser = this.audioContext.createAnalyser();
        
        analyser.fftSize = 2048;
        source.connect(analyser);
        
        recording.audioAnalyser = analyser;
        recording.audioData = new Uint8Array(analyser.frequencyBinCount);
        
        // Start analysis loop
        this.analyzeAudioLoop(recording);
    }

    analyzeAudioLoop(recording) {
        if (!this.activeRecordings.has(recording.id)) return;
        
        recording.audioAnalyser.getByteFrequencyData(recording.audioData);
        
        // Analyze audio characteristics
        const volume = this.calculateVolume(recording.audioData);
        const frequency = this.calculateDominantFrequency(recording.audioData);
        
        // Simple speaker detection based on frequency and volume patterns
        if (recording.options.speakerSeparation) {
            this.detectSpeaker(recording, volume, frequency);
        }
        
        // Continue analysis
        requestAnimationFrame(() => this.analyzeAudioLoop(recording));
    }

    calculateVolume(audioData) {
        let sum = 0;
        for (let i = 0; i < audioData.length; i++) {
            sum += audioData[i];
        }
        return sum / audioData.length;
    }

    calculateDominantFrequency(audioData) {
        let maxIndex = 0;
        let maxValue = 0;
        
        for (let i = 0; i < audioData.length; i++) {
            if (audioData[i] > maxValue) {
                maxValue = audioData[i];
                maxIndex = i;
            }
        }
        
        // Convert index to frequency
        const sampleRate = this.audioContext.sampleRate;
        const frequency = (maxIndex * sampleRate) / (audioData.length * 2);
        return frequency;
    }

    detectSpeaker(recording, volume, frequency) {
        const timestamp = Date.now() - recording.startTime.getTime();
        
        // Simple speaker detection based on voice characteristics
        let speaker = 'unknown';
        if (frequency > 180 && frequency < 220) {
            speaker = 'customer'; // Typical male voice range
        } else if (frequency > 220 && frequency < 280) {
            speaker = 'agent'; // Typical female voice range or AI
        }
        
        if (volume > 30) { // Only log when someone is speaking
            recording.transcription.speakers.push({
                timestamp,
                speaker,
                volume,
                frequency
            });
        }
    }

    handleSpeechResult(event) {
        if (!this.currentRecording) return;
        
        const results = event.results;
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < results.length; i++) {
            const transcript = results[i][0].transcript;
            
            if (results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }
        
        if (finalTranscript) {
            const timestamp = Date.now() - this.currentRecording.startTime.getTime();
            const transcriptEntry = {
                timestamp,
                text: finalTranscript,
                confidence: results[results.length - 1][0].confidence,
                speaker: this.determineSpeaker(this.currentRecording, timestamp)
            };
            
            this.currentRecording.transcription.realTime.push(transcriptEntry);
            
            // Perform sentiment analysis
            if (this.currentRecording.options.sentimentAnalysis) {
                this.analyzeSentiment(transcriptEntry);
            }
            
            // Extract keywords
            if (this.currentRecording.options.keywordExtraction) {
                this.extractKeywords(transcriptEntry);
            }
            
            // Update UI with real-time transcription
            this.updateTranscriptionDisplay(this.currentRecording);
        }
        
        // Update interim results
        if (interimTranscript) {
            this.updateInterimTranscription(interimTranscript);
        }
    }

    determineSpeaker(recording, timestamp) {
        if (!recording.transcription.speakers) return 'unknown';
        
        // Find the most recent speaker detection around this timestamp
        const recentSpeakers = recording.transcription.speakers.filter(
            s => Math.abs(s.timestamp - timestamp) < 1000
        );
        
        if (recentSpeakers.length > 0) {
            return recentSpeakers[recentSpeakers.length - 1].speaker;
        }
        
        return 'unknown';
    }

    analyzeSentiment(transcriptEntry) {
        // Simple local sentiment analysis
        const text = transcriptEntry.text.toLowerCase();
        const positiveWords = ['good', 'great', 'excellent', 'happy', 'pleased', 'wonderful', 'fantastic'];
        const negativeWords = ['bad', 'terrible', 'awful', 'angry', 'frustrated', 'disappointed', 'horrible'];
        
        let sentiment = 0;
        const words = text.split(' ');
        
        words.forEach(word => {
            if (positiveWords.includes(word)) sentiment++;
            if (negativeWords.includes(word)) sentiment--;
        });
        
        let sentimentLabel = 'neutral';
        if (sentiment > 0) sentimentLabel = 'positive';
        if (sentiment < 0) sentimentLabel = 'negative';
        
        if (!this.currentRecording.transcription.sentiment) {
            this.currentRecording.transcription.sentiment = [];
        }
        
        this.currentRecording.transcription.sentiment.push({
            timestamp: transcriptEntry.timestamp,
            score: sentiment,
            label: sentimentLabel,
            text: transcriptEntry.text
        });
    }

    extractKeywords(transcriptEntry) {
        // Simple keyword extraction
        const text = transcriptEntry.text.toLowerCase();
        const restaurantKeywords = [
            'reservation', 'booking', 'table', 'menu', 'food', 'order',
            'delivery', 'pickup', 'allergies', 'dietary', 'vegetarian', 'vegan',
            'gluten-free', 'price', 'cost', 'hours', 'open', 'closed',
            'location', 'address', 'parking', 'complaint', 'compliment'
        ];
        
        const foundKeywords = [];
        restaurantKeywords.forEach(keyword => {
            if (text.includes(keyword)) {
                foundKeywords.push(keyword);
            }
        });
        
        if (foundKeywords.length > 0) {
            if (!this.currentRecording.transcription.keywords) {
                this.currentRecording.transcription.keywords = [];
            }
            
            this.currentRecording.transcription.keywords.push({
                timestamp: transcriptEntry.timestamp,
                keywords: foundKeywords,
                text: transcriptEntry.text
            });
        }
    }

    async stopRecording(callId) {
        const recording = this.activeRecordings.get(callId);
        if (!recording) {
            throw new Error(`No active recording found for call ${callId}`);
        }

        // Stop media recorder
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
        }

        // Stop speech recognition
        if (this.speechRecognition) {
            this.speechRecognition.stop();
        }

        // Stop audio stream
        recording.stream.getTracks().forEach(track => track.stop());

        recording.endTime = new Date();
        recording.duration = recording.endTime - recording.startTime;

        this.activeRecordings.delete(callId);
        console.log(`Stopped recording for call ${callId}`);

        return recording;
    }

    async finalizeRecording(recording) {
        // Create final audio blob
        const audioBlob = new Blob(recording.chunks, { type: 'audio/webm' });
        recording.audioBlob = audioBlob;
        recording.audioUrl = URL.createObjectURL(audioBlob);

        // Generate final transcription
        recording.transcription.final = recording.transcription.realTime
            .map(entry => `[${this.formatTimestamp(entry.timestamp)}] ${entry.speaker}: ${entry.text}`)
            .join('\n');

        // Generate call summary
        recording.summary = this.generateCallSummary(recording);

        // Save to conversation history
        this.conversationHistory.push(recording);
        this.saveRecording(recording);

        console.log('Recording finalized:', recording.id);
        return recording;
    }

    generateCallSummary(recording) {
        const transcription = recording.transcription;
        
        const summary = {
            duration: this.formatDuration(recording.duration),
            speakers: transcription.speakers ? [...new Set(transcription.speakers.map(s => s.speaker))] : ['unknown'],
            wordCount: transcription.realTime.reduce((count, entry) => count + entry.text.split(' ').length, 0),
            sentiment: this.calculateOverallSentiment(transcription.sentiment),
            keyTopics: this.extractTopTopics(transcription.keywords),
            callQuality: this.assessCallQuality(recording)
        };

        return summary;
    }

    calculateOverallSentiment(sentimentData) {
        if (!sentimentData || sentimentData.length === 0) return 'neutral';
        
        const totalScore = sentimentData.reduce((sum, entry) => sum + entry.score, 0);
        const avgScore = totalScore / sentimentData.length;
        
        if (avgScore > 0.5) return 'positive';
        if (avgScore < -0.5) return 'negative';
        return 'neutral';
    }

    extractTopTopics(keywordData) {
        if (!keywordData || keywordData.length === 0) return [];
        
        const keywordCounts = {};
        keywordData.forEach(entry => {
            entry.keywords.forEach(keyword => {
                keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
            });
        });
        
        return Object.entries(keywordCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([keyword]) => keyword);
    }

    assessCallQuality(recording) {
        // Simple call quality assessment based on various factors
        let score = 100;
        
        // Deduct points for technical issues
        if (recording.duration < 10000) score -= 20; // Very short call
        if (!recording.transcription.realTime.length) score -= 30; // No transcription
        
        // Add points for good interaction
        if (recording.transcription.realTime.length > 5) score += 10; // Good conversation
        if (recording.summary?.sentiment === 'positive') score += 15; // Positive sentiment
        
        return Math.max(0, Math.min(100, score));
    }

    formatTimestamp(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    formatDuration(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
        }
    }

    saveRecording(recording) {
        // Save to localStorage (in production, would save to database)
        const recordings = JSON.parse(localStorage.getItem('call-recordings') || '[]');
        
        // Don't save the audio blob to localStorage (too large)
        const recordingData = {
            ...recording,
            audioBlob: null,
            audioUrl: null,
            chunks: null
        };
        
        recordings.push(recordingData);
        
        // Keep only last 50 recordings in localStorage
        if (recordings.length > 50) {
            recordings.splice(0, recordings.length - 50);
        }
        
        localStorage.setItem('call-recordings', JSON.stringify(recordings));
    }

    getRecordings(filters = {}) {
        const recordings = JSON.parse(localStorage.getItem('call-recordings') || '[]');
        
        // Apply filters
        let filtered = recordings;
        
        if (filters.dateFrom) {
            filtered = filtered.filter(r => new Date(r.startTime) >= filters.dateFrom);
        }
        
        if (filters.dateTo) {
            filtered = filtered.filter(r => new Date(r.startTime) <= filters.dateTo);
        }
        
        if (filters.sentiment) {
            filtered = filtered.filter(r => r.summary?.sentiment === filters.sentiment);
        }
        
        if (filters.minDuration) {
            filtered = filtered.filter(r => r.duration >= filters.minDuration);
        }
        
        return filtered.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    }

    updateTranscriptionDisplay(recording) {
        const event = new CustomEvent('transcriptionUpdate', {
            detail: {
                callId: recording.id,
                transcription: recording.transcription.realTime,
                sentiment: recording.transcription.sentiment,
                keywords: recording.transcription.keywords
            }
        });
        
        document.dispatchEvent(event);
    }

    updateInterimTranscription(interimText) {
        const event = new CustomEvent('interimTranscription', {
            detail: { text: interimText }
        });
        
        document.dispatchEvent(event);
    }

    handleSpeechError(event) {
        console.warn('Speech recognition error:', event.error);
        
        // Try to restart if it's a recoverable error
        if (event.error === 'network' || event.error === 'audio-capture') {
            setTimeout(() => {
                if (this.currentRecording && this.speechRecognition) {
                    this.speechRecognition.start();
                }
            }, 1000);
        }
    }

    fallbackToBasicRecording() {
        console.log('Using basic recording without advanced transcription features');
        this.isInitialized = true;
    }
}

// Initialize the transcription engine
let transcriptionEngine;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        transcriptionEngine = new InHouseTranscriptionEngine();
    });
} else {
    transcriptionEngine = new InHouseTranscriptionEngine();
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InHouseTranscriptionEngine;
}