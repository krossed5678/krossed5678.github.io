// Main Application Controller
// Coordinates all modules and handles initialization

class RestaurantBookingApp {
  constructor() {
    console.log('🚀 Initializing In-House Restaurant AI System...');
    
    // Initialize modules - prioritize in-house processing
    this.apiClient = new APIClient(); // Keep for fallback/legacy features
    this.bookingManager = new BookingManager(this.apiClient);
    
    // In-house voice system (no external APIs needed)
    this.inHouseVoiceConversation = null; // Will be initialized when processors are ready
    this.voiceConversation = null; // Legacy fallback
    
    // Application state
    this.isInitialized = false;
    this.useInHouseProcessing = true; // Default to in-house
    
    console.log('🏠 In-house voice processing enabled (no external API dependencies)');
    console.log('🎤 Browser-based speech recognition + local NLP');
    console.log('📞 Phone bookings supported via Twilio (optional)');
  }

  async initialize() {
    try {
      console.log('🔧 Setting up in-house application...');
      
      // Wait for in-house processors to load
      await this.waitForInHouseProcessors();
      
      // Initialize UI event handlers
      this.setupEventHandlers();
      
      // Initialize booking form
      this.bookingManager.initializeManualBookingForm();
      
      // Load existing bookings
      await this.bookingManager.loadBookings();
      
      // Check server health (optional for legacy features)
      try {
        await this.apiClient.checkHealth();
        console.log('✅ Legacy server available for fallback features');
      } catch (error) {
        console.log('ℹ️ Legacy server offline - using pure in-house processing');
      }
      
      this.isInitialized = true;
      console.log('✅ In-House Restaurant AI System initialized successfully');
      UIManager.showNotification('🏠 In-house AI system ready - no external dependencies!', 'success');
      
    } catch (error) {
      console.error('❌ Failed to initialize application:', error);
      UIManager.showNotification('Failed to initialize application: ' + error.message, 'error');
    }
  }

  async waitForInHouseProcessors() {
    return new Promise((resolve) => {
      console.log('⏳ Waiting for in-house processors...');
      
      const checkProcessors = () => {
        if (window.InHouseVoiceConversation && 
            window.localConversationEngine && 
            window.inHouseVoiceProcessor) {
          
          // Initialize in-house voice conversation
          this.inHouseVoiceConversation = new window.InHouseVoiceConversation();
          console.log('✅ In-house processors loaded and ready');
          resolve();
          return true;
        }
        return false;
      };

      // Check immediately
      if (checkProcessors()) {
        return;
      }

      // Check periodically
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (checkProcessors()) {
          clearInterval(interval);
        } else if (attempts > 50) {
          console.warn('⚠️ In-house processors took too long to load, initializing fallback');
          this.useInHouseProcessing = false;
          this.voiceConversation = new VoiceConversation(this.apiClient);
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });
  }

  setupEventHandlers() {
    console.log('🔧 Setting up event handlers...');
    
    // Voice conversation button - use in-house processing
    const voiceButton = document.getElementById('start-voice');
    if (voiceButton) {
      voiceButton.addEventListener('click', () => {
        if (this.useInHouseProcessing && this.inHouseVoiceConversation) {
          console.log('🏠 Using in-house voice processing');
          this.inHouseVoiceConversation.startConversation('voice');
        } else if (this.voiceConversation) {
          console.log('🔄 Falling back to external API processing');
          this.voiceConversation.startVoiceConversation();
        } else {
          UIManager.showNotification('Voice system not available', 'error');
        }
      });
      console.log('✅ Voice button handler attached (in-house priority)');
    } else {
      console.warn('⚠️ Voice button not found');
    }

    // Refresh bookings button
    const refreshButton = document.getElementById('refresh-bookings');
    if (refreshButton) {
      refreshButton.addEventListener('click', () => {
        this.bookingManager.loadBookings();
      });
      console.log('✅ Refresh button handler attached');
    }

    // Health check button
    const healthButton = document.getElementById('check-health');
    if (healthButton) {
      healthButton.addEventListener('click', async () => {
        try {
          UIManager.showLoader('Checking server status...');
          const health = await this.apiClient.checkHealth();
          UIManager.hideLoader();
          UIManager.showNotification(
            `✅ Server healthy: Mistral AI ${health.mistral_configured ? 'connected' : 'disconnected'}`,
            'success'
          );
        } catch (error) {
          UIManager.hideLoader();
          UIManager.showNotification('❌ Server check failed: ' + error.message, 'error');
        }
      });
      console.log('✅ Health check button handler attached');
    }

    // Test In-House System button
    const testInHouseButton = document.getElementById('test-inhouse');
    if (testInHouseButton) {
      testInHouseButton.addEventListener('click', async () => {
        console.log('🧪 Testing in-house system...');
        try {
          const result = await this.testVoiceSystem();
          if (result) {
            // Test text conversation
            const testMessage = "Hello, I'd like to make a reservation for 4 people tonight at 7 PM under John Smith. My number is 555-123-4567.";
            UIManager.updateElement('recognized', `Test: ${testMessage}`);
            
            const conversationResult = await this.processTextConversation(testMessage);
            console.log('🧪 Test conversation result:', conversationResult);
          }
        } catch (error) {
          console.error('❌ In-house test failed:', error);
          UIManager.showNotification('Test failed: ' + error.message, 'error');
        }
      });
      console.log('✅ Test in-house button handler attached');
    }

    // Handle page visibility changes to manage resources
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.voiceConversation.audioRecorder.isRecording) {
        console.log('📱 Page hidden, stopping recording...');
        this.voiceConversation.audioRecorder.stopRecording();
        UIManager.updateVoiceButton(false);
      }
    });

    console.log('✅ All event handlers set up');
  }

  // Public methods for external access
  getStatus() {
    const voiceSystem = this.useInHouseProcessing ? this.inHouseVoiceConversation : this.voiceConversation;
    
    return {
      initialized: this.isInitialized,
      useInHouseProcessing: this.useInHouseProcessing,
      recording: voiceSystem ? (voiceSystem.isListening || false) : false,
      bookingsCount: this.bookingManager.bookings.length,
      inHouseProcessorsReady: !!(window.inHouseVoiceProcessor && window.localConversationEngine)
    };
  }

  async testVoiceSystem() {
    console.log('🧪 Testing in-house voice system...');
    
    try {
      // Test browser speech recognition
      if (!(window.SpeechRecognition || window.webkitSpeechRecognition)) {
        throw new Error('Browser speech recognition not supported');
      }
      
      // Test in-house processors
      if (!window.inHouseVoiceProcessor || !window.localConversationEngine) {
        throw new Error('In-house processors not loaded');
      }
      
      // Test conversation engine with sample input
      const testResult = await window.localConversationEngine.handleTextConversation('hello');
      if (!testResult || !testResult.success) {
        throw new Error('Local conversation engine test failed');
      }
      
      UIManager.showNotification('🎉 In-house voice system test passed!', 'success');
      return true;
      
    } catch (error) {
      console.error('❌ In-house voice system test failed:', error);
      UIManager.showNotification('❌ Voice system test failed: ' + error.message, 'error');
      return false;
    }
  }

  // Toggle between in-house and external processing
  toggleProcessingMode() {
    this.useInHouseProcessing = !this.useInHouseProcessing;
    const mode = this.useInHouseProcessing ? 'in-house' : 'external API';
    console.log(`🔄 Switched to ${mode} processing`);
    UIManager.showNotification(`Switched to ${mode} processing`, 'info');
  }

  // Process text conversation directly (for testing)
  async processTextConversation(message) {
    if (this.useInHouseProcessing && this.inHouseVoiceConversation) {
      return await this.inHouseVoiceConversation.processTextMessage(message);
    } else if (this.voiceConversation) {
      return await this.voiceConversation.processTranscription(message);
    } else {
      throw new Error('No conversation system available');
    }
  }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  console.log('📄 DOM loaded, initializing app...');
  
  // Create global app instance
  window.restaurantApp = new RestaurantBookingApp();
  
  // Initialize the application
  await window.restaurantApp.initialize();
  
  // Make testing function available globally
  window.testVoiceSystem = () => window.restaurantApp.testVoiceSystem();
  
  console.log('🎉 Application ready!');
  console.log('💡 Tip: Use testVoiceSystem() in console to test voice features');
});