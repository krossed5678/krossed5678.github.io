// Simple test script to verify the conversation endpoint
const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

async function testConversation() {
  try {
    // Create a simple test audio file (empty for now, just to test the endpoint)
    const testBuffer = Buffer.from('test audio data');
    
    const formData = new FormData();
    formData.append('audio', testBuffer, {
      filename: 'test.webm',
      contentType: 'audio/webm'
    });

    console.log('🧪 Testing conversation endpoint...');
    
    const response = await axios.post('http://localhost:3001/api/conversation', formData, {
      headers: {
        ...formData.getHeaders()
      }
    });

    console.log('✅ Response:', response.data);
    
  } catch (error) {
    console.error('❌ Test failed:');
    console.error('  Message:', error.message);
    console.error('  Status:', error.response?.status);
    console.error('  Data:', error.response?.data);
    console.error('  Full error:', error);
  }
}

testConversation();