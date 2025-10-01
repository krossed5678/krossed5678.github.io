// Audio Recording Module
// Handles microphone access, recording, and audio processing

class AudioRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.stream = null;
  }

  async requestMicrophoneAccess() {
    console.log('🎤 Requesting microphone access...');
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('✅ Microphone access granted');
      console.log('📡 Stream details:', {
        active: this.stream.active,
        audioTracks: this.stream.getAudioTracks().length,
        videoTracks: this.stream.getVideoTracks().length
      });
      return this.stream;
    } catch (error) {
      console.error('❌ === MICROPHONE ACCESS ERROR ===');
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      console.error('❌ === END MICROPHONE ACCESS ERROR ===');
      throw error;
    }
  }

  startRecording(stream) {
    console.log('🎬 Starting recording session...');
    console.log('📡 Stream details:', {
      active: stream.active,
      audioTracks: stream.getAudioTracks().length,
      videoTracks: stream.getVideoTracks().length
    });
    
    this.audioChunks = [];
    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus'
    });
    
    console.log('📹 MediaRecorder created:', {
      mimeType: this.mediaRecorder.mimeType,
      state: this.mediaRecorder.state
    });

    this.mediaRecorder.ondataavailable = (event) => {
      console.log('📊 Audio chunk received:', {
        size: event.data.size,
        type: event.data.type
      });
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    return new Promise((resolve) => {
      this.mediaRecorder.onstop = () => {
        console.log('⏹️ Recording stopped, processing audio...');
        console.log('📊 Total chunks collected:', this.audioChunks.length);
        
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        console.log('🎵 Audio blob created:', {
          size: audioBlob.size,
          type: audioBlob.type
        });
        
        this.stopMediaTracks();
        resolve(audioBlob);
      };

      console.log('▶️ Starting MediaRecorder...');
      this.mediaRecorder.start();
      this.isRecording = true;
      console.log('✅ Recording started successfully');
    });
  }

  stopRecording() {
    console.log('⏹️ Stopping current recording...');
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      console.log('✅ Recording stop signal sent');
    }
  }

  stopMediaTracks() {
    if (this.stream) {
      console.log('🎤 Stopping media tracks...');
      this.stream.getTracks().forEach(track => {
        console.log('🔇 Stopping track:', track.kind, track.label);
        track.stop();
      });
      console.log('✅ All tracks stopped');
      this.stream = null;
    }
  }

  getRecordingState() {
    return {
      isRecording: this.isRecording,
      hasStream: !!this.stream,
      recorderState: this.mediaRecorder?.state
    };
  }
}

// Export for use in other modules
window.AudioRecorder = AudioRecorder;