// Voice Conversation Module
// Handles AI voice conversations and text-to-speech

class VoiceConversation {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.audioRecorder = new AudioRecorder();
    this.isProcessing = false;
    this.speechRecognition = null;
    this.preferBrowserSpeech = true; // Try browser speech first
  }

  // Initialize browser speech recognition
  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.log('⚠️ Browser speech recognition not supported');
      return false;
    }

    this.speechRecognition = new SpeechRecognition();
    this.speechRecognition.continuous = false;
    this.speechRecognition.interimResults = false;
    this.speechRecognition.lang = 'en-US';
    
    console.log('🗣️ Browser speech recognition initialized');
    return true;
  }

  async processConversation(audioBlob) {
    if (this.isProcessing) {
      console.log('⚠️ Already processing a conversation, skipping...');
      return;
    }

    this.isProcessing = true;
    
    try {
      UIManager.showNotification('🤖 Having a conversation with Mistral AI...', 'info');
      
      // Send audio to server for processing
      const result = await this.apiClient.sendConversation(audioBlob);
      
      // Display what customer said
      const short = result.transcription.length > 80 ? 
        result.transcription.slice(0,77) + '...' : result.transcription;
      UIManager.updateElement('recognized', `You: ${short}`);
      console.log('📝 Transcription:', result.transcription);
      
      // Speak the AI's response
      if (result.aiResponse) {
        console.log('🤖 AI Response:', result.aiResponse);
        await this.speakResponse(result.aiResponse);
      } else {
        console.warn('⚠️ No AI response received');
      }
      
      // If AI created a booking, handle it
      if (result.booking && result.action === 'booking_created') {
        console.log('📝 Booking created:', result.booking);
        await this.handleBookingCreated(result.booking, result.aiResponse);
        UIManager.showNotification('🎉 Booking created by AI!', 'success');
      } else {
        console.log('💬 Conversation continues, action:', result.action);
        // Just show the AI's response as a conversation
        UIManager.showNotification(`AI: ${result.aiResponse}`, 'info');
      }

    } catch (error) {
      console.error('❌ Conversation processing error:', error);
      
      // Show detailed error to user
      const errorMsg = `AI conversation failed: ${error.message}`;
      UIManager.showNotification(errorMsg, 'error');
      UIManager.updateElement('recognized', 'AI conversation failed - check console for details');
    } finally {
      this.isProcessing = false;
    }
  }

  async speakResponse(text) {
    console.log('🔊 Speaking AI response:', text);
    
    try {
      // Use browser's built-in speech synthesis
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;
        
        // Use a more natural voice if available
        const voices = speechSynthesis.getVoices();
        const preferredVoice = voices.find(voice => 
          voice.name.includes('Natural') || 
          voice.name.includes('Neural') || 
          voice.lang.startsWith('en')
        );
        
        if (preferredVoice) {
          utterance.voice = preferredVoice;
          console.log('🎤 Using voice:', preferredVoice.name);
        }

        return new Promise((resolve) => {
          utterance.onend = resolve;
          utterance.onerror = (error) => {
            console.error('❌ Speech synthesis error:', error);
            resolve();
          };
          speechSynthesis.speak(utterance);
        });
      } else {
        console.warn('⚠️ Speech synthesis not supported');
      }
    } catch (error) {
      console.error('❌ Error speaking response:', error);
    }
  }

  async handleBookingCreated(booking, aiResponse) {
    console.log('🎉 Processing created booking:', booking);
    
    try {
      // Add the booking to the UI
      if (window.BookingManager) {
        window.BookingManager.addBookingToUI(booking);
      }
      
      // You could also send this to the server to save permanently
      // await this.apiClient.createBooking(booking);
      
    } catch (error) {
      console.error('❌ Error handling booking creation:', error);
    }
  }

  // Use browser speech recognition for transcription
  async useBrowserSpeechRecognition() {
    console.log('🗣️ Starting browser speech recognition...');
    
    if (!this.initSpeechRecognition()) {
      throw new Error('Browser speech recognition not supported');
    }

    return new Promise((resolve, reject) => {
      UIManager.updateElement('recognized', 'Listening... Speak your booking request');
      UIManager.showNotification('Listening - speak your booking request', 'info');

      this.speechRecognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('🗣️ Browser speech result:', transcript);
        UIManager.updateElement('recognized', `You: ${transcript}`);
        resolve(transcript);
      };

      this.speechRecognition.onerror = (event) => {
        console.error('❌ Speech recognition error:', event.error);
        reject(new Error(`Speech recognition failed: ${event.error}`));
      };

      this.speechRecognition.onend = () => {
        console.log('🗣️ Speech recognition ended');
      };

      this.speechRecognition.start();
    });
  }

  // Process transcription text with Mistral AI for conversation
  async processTranscription(transcript) {
    console.log('🤖 Processing transcription with Mistral AI:', transcript);
    
    if (this.isProcessing) {
      console.log('⚠️ Already processing, skipping...');
      return;
    }

    this.isProcessing = true;
    
    try {
      UIManager.showNotification('🤖 Having a conversation with Mistral AI...', 'info');
      
      // Send text directly to server for Mistral processing
      const result = await this.apiClient.sendTextConversation(transcript);
      
      // Display what customer said  
      const short = transcript.length > 80 ? transcript.slice(0,77) + '...' : transcript;
      UIManager.updateElement('recognized', `You: ${short}`);
      
      // Speak the AI's response
      if (result.aiResponse) {
        console.log('🤖 AI Response:', result.aiResponse);
        await this.speakResponse(result.aiResponse);
      }
      
      // Handle booking if created
      if (result.booking && result.action === 'booking_created') {
        console.log('📝 Booking created:', result.booking);
        await this.handleBookingCreated(result.booking, result.aiResponse);
        UIManager.showNotification('🎉 Booking created by AI!', 'success');
        
        // Log AI booking creation
        if (window.legacyFeatures) {
          window.legacyFeatures.addLog({
            type: 'success',
            source: 'AI Booking',
            text: `AI created booking: ${result.booking.customer_name} - "${transcript.slice(0, 50)}..."`
          });
        }
      } else {
        console.log('💬 Conversation continues, action:', result.action);
        UIManager.showNotification(`AI: ${result.aiResponse}`, 'info');
      }

    } catch (error) {
      console.error('❌ Error processing transcription:', error);
      UIManager.showNotification('Failed to process your request: ' + error.message, 'error');
    } finally {
      this.isProcessing = false;
    }
  }

  async startVoiceConversation() {
    console.log('🎤 Voice button clicked');
    
    if (this.audioRecorder.isRecording) {
      console.log('⏹️ Stopping current recording...');
      this.audioRecorder.stopRecording();
      UIManager.updateVoiceButton(false);
      return;
    }
    
    try {
      // Check if server is available
      await this.apiClient.checkHealth();
      
      // Try browser speech recognition first (more reliable)
      if (this.preferBrowserSpeech && (window.SpeechRecognition || window.webkitSpeechRecognition)) {
        console.log('🗣️ Using browser speech recognition');
        UIManager.updateVoiceButton(true);
        
        try {
          const transcript = await this.useBrowserSpeechRecognition();
          UIManager.updateVoiceButton(false);
          
          // Process the transcription with Mistral AI
          await this.processTranscription(transcript);
          return;
          
        } catch (speechError) {
          console.log('⚠️ Browser speech recognition failed, falling back to server processing:', speechError.message);
          UIManager.showNotification('Browser speech failed, trying server processing...', 'info');
        }
        
        UIManager.updateVoiceButton(false);
      }

      // Fallback: Server-side audio processing
      console.log('🎤 Using server-side audio processing');
      
      // Request microphone access
      const stream = await this.audioRecorder.requestMicrophoneAccess();
      
      // Update UI to show recording state
      UIManager.updateVoiceButton(true);
      UIManager.updateElement('recognized', 'Recording... Speak your booking request');
      UIManager.showNotification('Recording started - speak your booking request', 'info');
      
      // Start recording and wait for it to complete
      const audioBlob = await this.audioRecorder.startRecording(stream);
      
      // Reset UI
      UIManager.updateVoiceButton(false);
      UIManager.updateElement('recognized', 'Processing with Mistral AI...');
      
      // Process the audio
      await this.processConversation(audioBlob);
      
    } catch (error) {
      console.error('❌ Voice conversation error:', error);
      UIManager.showNotification('Voice conversation failed: ' + error.message, 'error');
      UIManager.updateVoiceButton(false);
    }
  }
}

// Export for use in other modules
window.VoiceConversation = VoiceConversation;