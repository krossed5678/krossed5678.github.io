// API Client Module
// Handles all communication with the backend server

class APIClient {
  constructor(baseURL = 'http://localhost:3001') {
    this.baseURL = baseURL;
  }

  async checkHealth() {
    console.log('🔍 Checking server health...');
    try {
      const response = await fetch(`${this.baseURL}/health`);
      console.log('🏥 Health check response:', {
        status: response.status,
        ok: response.ok
      });
      
      if (!response.ok) {
        console.error('❌ Server health check failed');
        throw new Error(`Server health check failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Server is healthy:', data);
      return data;
    } catch (error) {
      console.error('❌ Health check error:', error);
      throw error;
    }
  }

  async sendConversation(audioBlob) {
    console.log('🎵 Starting audio processing with Mistral AI...');
    console.log('Audio blob details:', {
      size: audioBlob.size,
      type: audioBlob.type
    });
    
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      console.log('📤 Sending audio to server:', `${this.baseURL}/api/conversation`);

      const response = await fetch(`${this.baseURL}/api/conversation`, {
        method: 'POST',
        body: formData
      });

      console.log('📡 Server response status:', response.status);
      console.log('📡 Server response headers:', Object.fromEntries(response.headers));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server returned error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`AI conversation failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Received conversation result:', result);
      return result;
    } catch (error) {
      console.error('❌ API conversation error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        cause: error.cause
      });
      console.error('❌ Full error object:', error);
      throw error;
    }
  }

  // Send text conversation (from browser speech recognition)
  async sendTextConversation(transcript) {
    console.log('📝 Sending text conversation to server:', transcript);
    
    try {
      const response = await fetch(`${this.baseURL}/api/text-conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ transcript })
      });

      console.log('📡 Server response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server error:', errorText);
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Received text conversation result:', result);
      return result;
    } catch (error) {
      console.error('❌ Text conversation error:', error);
      throw error;
    }
  }

  async getBookings() {
    try {
      const response = await fetch(`${this.baseURL}/api/bookings`);
      if (!response.ok) {
        throw new Error(`Failed to fetch bookings: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('❌ Error fetching bookings:', error);
      throw error;
    }
  }

  async createBooking(bookingData) {
    try {
      const response = await fetch(`${this.baseURL}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData)
      });

      if (!response.ok) {
        throw new Error(`Failed to create booking: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error creating booking:', error);
      throw error;
    }
  }
}

// Export for use in other modules
window.APIClient = APIClient;