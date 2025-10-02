// In-House Voice Conversation Module
// Completely self-contained voice processing without external APIs

class InHouseVoiceConversation {
  constructor() {
    this.isListening = false;
    this.isProcessing = false;
    this.conversationHistory = [];
    this.speechRecognition = null;
    this.currentMode = 'voice'; // 'voice' or 'text'
    this.init();
  }

  async init() {
    console.log('🏠 Initializing In-House Voice Conversation...');
    
    this.setupSpeechRecognition();
    this.waitForProcessors();
    
    console.log('✅ In-House Voice Conversation ready');
  }

  waitForProcessors() {
    // Wait for our local processors to be available
    const checkProcessors = () => {
      return window.inHouseVoiceProcessor && window.localConversationEngine;
    };

    if (!checkProcessors()) {
      console.log('⏳ Waiting for in-house processors...');
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (checkProcessors()) {
          console.log('✅ In-house processors ready for use');
          clearInterval(interval);
        } else if (attempts > 50) {
          console.error('❌ In-house processors failed to load');
          clearInterval(interval);
        }
      }, 100);
    } else {
      console.log('✅ In-house processors already available');
    }
  }

  setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('⚠️ Browser speech recognition not supported');
      return false;
    }

    this.speechRecognition = new SpeechRecognition();
    this.speechRecognition.continuous = false;
    this.speechRecognition.interimResults = false;
    this.speechRecognition.lang = 'en-US';
    
    console.log('🗣️ Browser speech recognition setup complete');
    return true;
  }

  // ---------- Voice Conversation Flow ----------

  async startVoiceConversation() {
    console.log('🎤 Starting in-house voice conversation');
    
    if (this.isListening) {
      console.log('⏹️ Stopping current conversation...');
      this.stopListening();
      return;
    }
    
    try {
      // Check if processors are available
      if (!window.inHouseVoiceProcessor || !window.localConversationEngine) {
        throw new Error('In-house processors not available');
      }
      
      await this.processVoiceLoop();
      
    } catch (error) {
      console.error('❌ Voice conversation error:', error);
      UIManager.showNotification('Voice conversation failed: ' + error.message, 'error');
      this.resetState();
    }
  }

  async processVoiceLoop() {
    console.log('🔄 Starting voice conversation loop');
    
    try {
      // Get voice input
      const transcript = await this.getVoiceInput();
      
      if (!transcript || transcript.trim().length === 0) {
        UIManager.showNotification('No speech detected, try again', 'warning');
        return;
      }
      
      // Process with local conversation engine
      const result = await this.processWithLocalEngine(transcript);
      
      // Speak the response
      await this.speakResponse(result.response);
      
      // Check if conversation should continue
      if (this.shouldContinueConversation(result)) {
        // Small delay then continue listening
        setTimeout(() => {
          if (!this.isProcessing) {
            this.processVoiceLoop();
          }
        }, 1000);
      } else {
        this.resetState();
      }
      
    } catch (error) {
      console.error('❌ Voice loop error:', error);
      UIManager.showNotification('Voice processing error: ' + error.message, 'error');
      this.resetState();
    }
  }

  async getVoiceInput() {
    if (!this.speechRecognition) {
      throw new Error('Speech recognition not available');
    }

    return new Promise((resolve, reject) => {
      console.log('🎤 Listening for voice input...');
      
      this.isListening = true;
      UIManager.updateVoiceButton(true);
      UIManager.updateElement('recognized', 'Listening... Speak your request');
      UIManager.showNotification('Listening - speak your request', 'info');

      this.speechRecognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('🗣️ Voice input received:', transcript);
        
        this.isListening = false;
        UIManager.updateVoiceButton(false);
        UIManager.updateElement('recognized', `You: ${transcript}`);
        
        resolve(transcript);
      };

      this.speechRecognition.onerror = (event) => {
        console.error('❌ Speech recognition error:', event.error);
        
        this.isListening = false;
        UIManager.updateVoiceButton(false);
        
        // Don't reject for certain errors, just resolve with empty
        if (event.error === 'no-speech' || event.error === 'aborted') {
          resolve('');
        } else {
          reject(new Error(`Speech recognition failed: ${event.error}`));
        }
      };

      this.speechRecognition.onend = () => {
        console.log('🗣️ Speech recognition ended');
        this.isListening = false;
      };

      try {
        this.speechRecognition.start();
      } catch (error) {
        this.isListening = false;
        UIManager.updateVoiceButton(false);
        reject(error);
      }
    });
  }

  async processWithLocalEngine(transcript) {
    console.log('🧠 Processing with local conversation engine:', transcript);
    
    if (this.isProcessing) {
      console.log('⚠️ Already processing, skipping...');
      return { response: "I'm still processing your previous request, please wait." };
    }

    this.isProcessing = true;
    
    try {
      UIManager.showNotification('🤖 Processing your request locally...', 'info');
      
      // Add to conversation history
      this.addToHistory('user', transcript);
      
      // Process with local conversation engine
      const result = await window.localConversationEngine.handleTextConversation(transcript);
      
      if (result.success) {
        // Add AI response to history
        this.addToHistory('assistant', result.response);
        
        console.log('✅ Local processing successful:', result);
        
        // Check if a booking was completed
        if (result.conversationState && result.conversationState.activeBooking) {
          const booking = result.conversationState.activeBooking;
          if (booking.customerName && booking.partySize && booking.time && booking.phoneNumber) {
            console.log('📝 Booking appears complete, will be handled by confirmation response');
          }
        }
        
        return {
          response: result.response,
          intent: result.intent,
          entities: result.entities,
          conversationState: result.conversationState
        };
        
      } else {
        console.error('❌ Local processing failed:', result.error);
        return {
          response: result.response || "I'm sorry, I had trouble understanding that. Could you please rephrase?",
          intent: 'error',
          entities: {}
        };
      }
      
    } catch (error) {
      console.error('❌ Error processing with local engine:', error);
      return {
        response: "I apologize, but I'm having technical difficulties. Please try again.",
        intent: 'error',
        entities: {}
      };
    } finally {
      this.isProcessing = false;
    }
  }

  async speakResponse(text) {
    console.log('🔊 Speaking response:', text);
    
    try {
      if ('speechSynthesis' in window) {
        return new Promise((resolve) => {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 0.9;
          utterance.pitch = 1.0;
          utterance.volume = 0.8;
          
          // Use a more natural voice if available
          const voices = speechSynthesis.getVoices();
          const preferredVoice = voices.find(voice => 
            voice.name.includes('Natural') || 
            voice.name.includes('Neural') || 
            (voice.lang.startsWith('en') && voice.localService)
          );
          
          if (preferredVoice) {
            utterance.voice = preferredVoice;
            console.log('🎤 Using voice:', preferredVoice.name);
          }

          utterance.onend = () => {
            console.log('🔊 Speech completed');
            resolve();
          };
          
          utterance.onerror = (error) => {
            console.error('❌ Speech synthesis error:', error);
            resolve(); // Resolve anyway to continue conversation
          };
          
          speechSynthesis.speak(utterance);
          
          // Fallback timeout
          setTimeout(() => {
            console.log('🔊 Speech timeout reached');
            resolve();
          }, text.length * 100); // Rough estimate of speech time
        });
      } else {
        console.warn('⚠️ Speech synthesis not supported, showing text only');
        UIManager.showNotification(`AI: ${text}`, 'info');
      }
    } catch (error) {
      console.error('❌ Error speaking response:', error);
      UIManager.showNotification(`AI: ${text}`, 'info');
    }
  }

  // ---------- Text Conversation Interface ----------

  async processTextMessage(message) {
    console.log('💬 Processing text message:', message);
    
    try {
      const result = await this.processWithLocalEngine(message);
      
      // Update UI with the response
      UIManager.showNotification(`AI: ${result.response}`, 'info');
      
      return result;
      
    } catch (error) {
      console.error('❌ Text processing error:', error);
      throw error;
    }
  }

  // ---------- Conversation Management ----------

  shouldContinueConversation(result) {
    // Don't continue if it's a goodbye or completion
    const intent = result.intent;
    
    if (intent === 'goodbye' || intent === 'thanks') {
      return false;
    }
    
    // Check if booking is complete (confirmation was sent)
    if (result.response && result.response.includes('reservation is confirmed')) {
      return false;
    }
    
    // Continue for most other intents
    return ['makeReservation', 'greeting', 'general', 'inquiry'].includes(intent);
  }

  addToHistory(role, message) {
    this.conversationHistory.push({
      role,
      message,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 10 messages
    if (this.conversationHistory.length > 10) {
      this.conversationHistory = this.conversationHistory.slice(-10);
    }
  }

  stopListening() {
    console.log('⏹️ Stopping voice conversation');
    
    if (this.speechRecognition) {
      try {
        this.speechRecognition.abort();
      } catch (error) {
        console.log('Note: Speech recognition was already stopped');
      }
    }
    
    this.resetState();
  }

  resetState() {
    console.log('🔄 Resetting conversation state');
    
    this.isListening = false;
    this.isProcessing = false;
    UIManager.updateVoiceButton(false);
    
    // Don't clear conversation history - let local engine manage its own state
    console.log('✅ Voice conversation state reset');
  }

  // ---------- Public Interface ----------

  async startConversation(mode = 'voice') {
    console.log(`🏠 Starting in-house conversation in ${mode} mode`);
    
    this.currentMode = mode;
    
    if (mode === 'voice') {
      await this.startVoiceConversation();
    } else {
      console.log('💬 Text mode ready - use processTextMessage()');
    }
  }

  resetConversation() {
    console.log('🔄 Resetting entire conversation');
    
    this.stopListening();
    this.conversationHistory = [];
    
    // Reset local conversation engine state
    if (window.localConversationEngine) {
      window.localConversationEngine.resetConversation();
    }
    
    console.log('✅ Conversation completely reset');
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (!window.inHouseVoiceConversation) {
    window.inHouseVoiceConversation = new InHouseVoiceConversation();
  }
});

// Export for other modules
if (typeof window !== 'undefined') {
  window.InHouseVoiceConversation = InHouseVoiceConversation;
}