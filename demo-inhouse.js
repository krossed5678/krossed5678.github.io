// Demo Script for In-House Voice Processing
// Run these commands in the browser console to test the system

console.log('🏠 In-House Voice Processing Demo');
console.log('================================');

// Test 1: Check System Status
console.log('\n🔍 Test 1: System Status');
if (window.restaurantApp) {
  const status = window.restaurantApp.getStatus();
  console.log('System Status:', status);
} else {
  console.log('❌ Restaurant app not loaded yet');
}

// Test 2: Test Local Conversation Engine
console.log('\n🧠 Test 2: Local Conversation Engine');
if (window.localConversationEngine) {
  // Test various conversation inputs
  const testInputs = [
    "Hello there",
    "I'd like to make a reservation",  
    "Table for 4 people tonight at 7 PM",
    "My name is John Smith and my number is 555-123-4567",
    "What are your hours?",
    "Do you have vegetarian options?",
    "Thank you"
  ];
  
  console.log('Testing conversation inputs...');
  testInputs.forEach(async (input, i) => {
    setTimeout(async () => {
      console.log(`\n💬 Input ${i+1}: "${input}"`);
      try {
        const result = await window.localConversationEngine.handleTextConversation(input);
        console.log(`🤖 Response: "${result.response}"`);
        console.log(`🎯 Intent: ${result.intent}`);
        if (Object.keys(result.entities || {}).length > 0) {
          console.log(`📊 Entities:`, result.entities);
        }
      } catch (error) {
        console.error('❌ Error:', error.message);
      }
    }, i * 1000);
  });
} else {
  console.log('❌ Local conversation engine not loaded');
}

// Test 3: Speech Recognition Test
console.log('\n🎤 Test 3: Speech Recognition Check');
if (window.SpeechRecognition || window.webkitSpeechRecognition) {
  console.log('✅ Browser speech recognition supported');
  
  // Function to test speech recognition
  window.testSpeechRecognition = () => {
    console.log('🎤 Starting speech recognition test...');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      console.log('🗣️ You said:', transcript);
    };
    
    recognition.onerror = (event) => {
      console.log('❌ Speech error:', event.error);
    };
    
    recognition.start();
    console.log('🎤 Listening... (speak now)');
  };
  
  console.log('💡 Run testSpeechRecognition() to test microphone');
} else {
  console.log('❌ Browser speech recognition not supported');
}

// Test 4: Text-to-Speech Test  
console.log('\n🔊 Test 4: Text-to-Speech Check');
if (window.speechSynthesis) {
  console.log('✅ Browser text-to-speech supported');
  
  // Function to test TTS
  window.testTTS = (text = "Welcome to our in-house restaurant AI system!") => {
    console.log('🔊 Testing text-to-speech...');
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.onend = () => console.log('🔊 Speech completed');
    speechSynthesis.speak(utterance);
  };
  
  console.log('💡 Run testTTS() to test speakers');
} else {
  console.log('❌ Browser text-to-speech not supported');
}

// Test 5: Complete Booking Simulation
console.log('\n📝 Test 5: Complete Booking Simulation');
window.simulateBooking = async () => {
  if (!window.restaurantApp) {
    console.log('❌ Restaurant app not ready');
    return;
  }
  
  console.log('🎭 Simulating complete booking conversation...');
  
  const messages = [
    "Hi, I'd like to make a reservation",
    "John Smith", 
    "4 people",
    "Tonight at 7 PM",
    "555-123-4567"
  ];
  
  for (let i = 0; i < messages.length; i++) {
    setTimeout(async () => {
      console.log(`\n💬 Message ${i+1}: "${messages[i]}"`);
      try {
        const result = await window.restaurantApp.processTextConversation(messages[i]);
        console.log(`🤖 Response: "${result.response}"`);
      } catch (error) {
        console.error('❌ Error:', error.message);
      }
    }, i * 2000);
  }
};

console.log('💡 Run simulateBooking() to see a full conversation');

// Utility Functions
console.log('\n🛠️ Available Test Functions:');
console.log('- restaurantApp.getStatus() - Check system status');  
console.log('- restaurantApp.testVoiceSystem() - Test voice capabilities');
console.log('- testSpeechRecognition() - Test microphone input');
console.log('- testTTS() - Test speaker output');
console.log('- simulateBooking() - Full booking simulation');
console.log('- restaurantApp.toggleProcessingMode() - Switch in-house/external');

console.log('\n🎉 Demo ready! Try the functions above or click "Test In-House" button in the UI');