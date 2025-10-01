// Main Application Controller
// Coordinates all modules and handles initialization

class RestaurantBookingApp {
  constructor() {
    console.log('🚀 Initializing Restaurant AI Booking System...');
    
    // Initialize modules
    this.apiClient = new APIClient();
    this.voiceConversation = new VoiceConversation(this.apiClient);
    this.bookingManager = new BookingManager(this.apiClient);
    
    // Application state
    this.isInitialized = false;
    
    console.log('📞 Phone bookings supported via Twilio + Mistral AI');
    console.log('🎤 Voice recognition available in browser');
  }

  async initialize() {
    try {
      console.log('🔧 Setting up application...');
      
      // Initialize UI event handlers
      this.setupEventHandlers();
      
      // Initialize booking form
      this.bookingManager.initializeManualBookingForm();
      
      // Load existing bookings
      await this.bookingManager.loadBookings();
      
      // Check server health
      try {
        await this.apiClient.checkHealth();
        UIManager.showNotification('✅ AI server connected and ready!', 'success');
      } catch (error) {
        console.warn('⚠️ Server not available:', error.message);
        UIManager.showNotification('⚠️ AI server offline - voice features disabled', 'warning');
      }
      
      this.isInitialized = true;
      console.log('✅ Restaurant AI Booking System initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize application:', error);
      UIManager.showNotification('Failed to initialize application: ' + error.message, 'error');
    }
  }

  setupEventHandlers() {
    console.log('🔧 Setting up event handlers...');
    
    // Voice conversation button
    const voiceButton = document.getElementById('start-voice');
    if (voiceButton) {
      voiceButton.addEventListener('click', () => {
        this.voiceConversation.startVoiceConversation();
      });
      console.log('✅ Voice button handler attached');
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
    return {
      initialized: this.isInitialized,
      recording: this.voiceConversation.audioRecorder.getRecordingState(),
      bookingsCount: this.bookingManager.bookings.length
    };
  }

  async testVoiceSystem() {
    console.log('🧪 Testing voice system...');
    try {
      // Test microphone access
      const stream = await this.voiceConversation.audioRecorder.requestMicrophoneAccess();
      this.voiceConversation.audioRecorder.stopMediaTracks();
      
      // Test server connection
      await this.apiClient.checkHealth();
      
      UIManager.showNotification('🎉 Voice system test passed!', 'success');
      return true;
    } catch (error) {
      console.error('❌ Voice system test failed:', error);
      UIManager.showNotification('❌ Voice system test failed: ' + error.message, 'error');
      return false;
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