import APIClient from './api-client';

export default class RestaurantBookingApp {
  apiClient: any;
  bookingManager: any;
  inHouseVoiceConversation: any;
  voiceConversation: any;
  isInitialized: boolean;
  useInHouseProcessing: boolean;
  configLoader: any;

  constructor() {
    console.log('🚀 Initializing In-House Restaurant AI System...');
    this.apiClient = new APIClient();
    this.bookingManager = new (window as any).BookingManager(this.apiClient);
    this.inHouseVoiceConversation = null;
    this.voiceConversation = null;
    this.isInitialized = false;
    this.useInHouseProcessing = true;
  }

  async initialize() {
    try {
      await this.waitForInHouseProcessors();
      this.setupEventHandlers();
      this.bookingManager.initializeManualBookingForm();
      await this.bookingManager.loadBookings();
      try { await this.apiClient.checkHealth(); } catch (e) { }
      this.isInitialized = true;
      (window as any).UIManager.showNotification('🏠 In-house AI system ready - no external dependencies!', 'success');
    } catch (error:any) {
      console.error('❌ Failed to initialize application:', error);
      (window as any).UIManager.showNotification('Failed to initialize application: ' + (error.message || error), 'error');
    }
  }

  async waitForInHouseProcessors() {
  return new Promise<void>(async (resolve) => {
      const checkProcessors = () => {
        return !!((window as any).InHouseVoiceConversation && (window as any).LocalConversationEngine && (window as any).inHouseVoiceProcessor && (window as any).RestaurantConfigLoader);
      };

      if (checkProcessors()) {
        // initialize async processors
        this.configLoader = new (window as any).RestaurantConfigLoader();
        (window as any).localConversationEngine = new (window as any).LocalConversationEngine(this.configLoader);
        await (window as any).localConversationEngine.init();
        this.inHouseVoiceConversation = new (window as any).InHouseVoiceConversation();
        resolve();
        return;
      }

      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        if (checkProcessors()) {
          clearInterval(interval);
          this.configLoader = new (window as any).RestaurantConfigLoader();
          (window as any).localConversationEngine = new (window as any).LocalConversationEngine(this.configLoader);
          await (window as any).localConversationEngine.init();
          this.inHouseVoiceConversation = new (window as any).InHouseVoiceConversation();
          resolve();
        } else if (attempts > 50) {
          console.warn('⚠️ In-house processors took too long to load, initializing fallback');
          this.useInHouseProcessing = false;
          this.voiceConversation = new (window as any).VoiceConversation(this.apiClient);
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });
  }

  setupEventHandlers() {
    const voiceButton = document.getElementById('start-voice');
    if (voiceButton) {
      voiceButton.addEventListener('click', () => {
        if (this.useInHouseProcessing && this.inHouseVoiceConversation) this.inHouseVoiceConversation.startConversation('voice');
        else if (this.voiceConversation) this.voiceConversation.startVoiceConversation();
        else (window as any).UIManager.showNotification('Voice system not available', 'error');
      });
    }

    const refreshButton = document.getElementById('refresh-bookings');
    if (refreshButton) refreshButton.addEventListener('click', () => this.bookingManager.loadBookings());

    const healthButton = document.getElementById('check-health');
    if (healthButton) healthButton.addEventListener('click', async () => {
      try { (window as any).UIManager.showLoader('Checking server status...'); const health = await this.apiClient.checkHealth(); (window as any).UIManager.hideLoader(); (window as any).UIManager.showNotification('✅ Server healthy', 'success'); } catch (error:any) { (window as any).UIManager.hideLoader(); (window as any).UIManager.showNotification('❌ Server check failed: ' + (error.message || error), 'error'); }
    });

    const testInHouseButton = document.getElementById('test-inhouse');
    if (testInHouseButton) testInHouseButton.addEventListener('click', async () => { try { const result = await this.testVoiceSystem(); } catch (e) { (window as any).UIManager.showNotification('Test failed: ' + (e as any).message, 'error'); } });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.voiceConversation && this.voiceConversation.audioRecorder && this.voiceConversation.audioRecorder.isRecording) {
        this.voiceConversation.audioRecorder.stopRecording();
        (window as any).UIManager.updateVoiceButton(false);
      }
    });
  }

  getStatus() {
    const voiceSystem = this.useInHouseProcessing ? this.inHouseVoiceConversation : this.voiceConversation;
    return { initialized: this.isInitialized, useInHouseProcessing: this.useInHouseProcessing, recording: voiceSystem ? (voiceSystem.isListening || false) : false, bookingsCount: this.bookingManager.bookings.length, inHouseProcessorsReady: !!((window as any).inHouseVoiceProcessor && (window as any).localConversationEngine) };
  }

  async testVoiceSystem() {
    try {
      if (!(window as any).SpeechRecognition && !(window as any).webkitSpeechRecognition) throw new Error('Browser speech recognition not supported');
      if (!(window as any).inHouseVoiceProcessor || !(window as any).localConversationEngine) throw new Error('In-house processors not loaded');
      const testResult = await (window as any).localConversationEngine.handleTextConversation('hello');
      if (!testResult || !testResult.success) throw new Error('Local conversation engine test failed');
      (window as any).UIManager.showNotification('🎉 In-house voice system test passed!', 'success');
      return true;
    } catch (error:any) { (window as any).UIManager.showNotification('❌ Voice system test failed: ' + (error.message || error), 'error'); return false; }
  }

  toggleProcessingMode() { this.useInHouseProcessing = !this.useInHouseProcessing; (window as any).UIManager.showNotification(`Switched to ${this.useInHouseProcessing ? 'in-house' : 'external API'} processing`, 'info'); }

  async processTextConversation(message: string) {
    if (this.useInHouseProcessing && this.inHouseVoiceConversation) return await this.inHouseVoiceConversation.processTextMessage(message);
    else if (this.voiceConversation) return await this.voiceConversation.processTranscription(message);
    else throw new Error('No conversation system available');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  (window as any).restaurantApp = new RestaurantBookingApp();
  await (window as any).restaurantApp.initialize();
  (window as any).testVoiceSystem = () => (window as any).restaurantApp.testVoiceSystem();
});
