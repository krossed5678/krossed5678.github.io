// Enhanced Demo Script - Testing Extensive LLM Capabilities
// Run these commands in the browser console to test the enhanced system

console.log('🏠 ENHANCED In-House LLM Demo');
console.log('============================');

// Advanced conversation tests
const advancedTestInputs = [
  // Complex booking with preferences
  "Hi, I'd like a romantic table for 2 tonight at 7 PM for our anniversary. My wife is vegetarian and I need wheelchair access. The name is John Smith, 555-123-4567.",
  
  // Menu inquiries
  "What vegetarian options do you have?",
  "Do you have gluten-free pasta?",
  "What are your signature dishes?",
  "How much do your entrees cost?",
  
  // Policy questions
  "Can I bring my dog?",
  "What's your dress code?",
  "Do you have parking?",
  "Can we bring our own wine?",
  
  // Dietary restrictions
  "I have a severe nut allergy, can you accommodate?",
  "Do you have vegan desserts?",
  "I'm on keto, what can I eat?",
  
  // Special requests
  "We're having a business dinner for 12 people",
  "Can we have a private room for a birthday party?",
  "Do you do wine pairings?",
  
  // Compliments and complaints
  "Your food was amazing last time!",
  "We had terrible service last week",
  
  // Atmosphere questions
  "Is it loud or quiet in there?",
  "Do you have WiFi?",
  "Is it good for a first date?",
  
  // Special services
  "Do you do catering?",
  "Can we book a cooking class?",
  "Tell me about your chef"
];

// Test function for advanced conversations
window.testAdvancedConversations = async () => {
  if (!window.localConversationEngine) {
    console.log('❌ Local conversation engine not loaded');
    return;
  }
  
  console.log('🧠 Testing Advanced Conversation Capabilities...');
  console.log('================================================');
  
  for (let i = 0; i < advancedTestInputs.length; i++) {
    setTimeout(async () => {
      const input = advancedTestInputs[i];
      console.log(`\n💬 Test ${i+1}: "${input}"`);
      
      try {
        const result = await window.localConversationEngine.handleTextConversation(input);
        console.log(`🤖 Response: "${result.response}"`);
        console.log(`🎯 Intent: ${result.intent}`);
        
        if (result.entities && Object.keys(result.entities).length > 0) {
          console.log(`📊 Entities:`, result.entities);
        }
        
        if (result.conversationState && result.conversationState.activeBooking) {
          console.log(`📝 Booking Progress:`, result.conversationState.activeBooking);
        }
      } catch (error) {
        console.error('❌ Error:', error.message);
      }
    }, i * 1500); // Staggered for readability
  }
};

// Test complex booking scenario
window.testComplexBooking = async () => {
  if (!window.restaurantApp) {
    console.log('❌ Restaurant app not ready');
    return;
  }
  
  console.log('🎭 Testing Complex Booking Scenario...');
  console.log('======================================');
  
  const complexScenario = [
    "Hi there!",
    "I need a table for my anniversary",
    "For 4 people", 
    "Tomorrow at 7:30 PM",
    "My name is Sarah Johnson",
    "We need a quiet romantic booth, and one person is gluten-free",
    "My number is 555-987-6543"
  ];
  
  for (let i = 0; i < complexScenario.length; i++) {
    setTimeout(async () => {
      const message = complexScenario[i];
      console.log(`\n💬 Step ${i+1}: "${message}"`);
      
      try {
        const result = await window.restaurantApp.processTextConversation(message);
        console.log(`🤖 AI: "${result.response}"`);
        
        if (result.conversationState && result.conversationState.activeBooking) {
          const booking = result.conversationState.activeBooking;
          console.log(`📋 Booking Status:`, {
            name: booking.customerName || 'Missing',
            size: booking.partySize || 'Missing',
            time: booking.time || 'Missing',
            phone: booking.phoneNumber || 'Missing',
            preferences: {
              dietary: booking.dietaryRestrictions,
              seating: booking.seatingPreference,
              occasion: booking.occasion
            }
          });
        }
      } catch (error) {
        console.error('❌ Error:', error.message);
      }
    }, i * 2500);
  }
};

// Test menu knowledge
window.testMenuKnowledge = () => {
  console.log('🍝 Testing Menu Knowledge...');
  console.log('============================');
  
  if (window.localConversationEngine) {
    const menu = window.localConversationEngine.knowledgeBase.restaurant.menu;
    
    console.log('📋 Menu Items Loaded:');
    console.log(`- ${menu.appetizers.length} appetizers`);
    console.log(`- ${menu.mains.length} main dishes`);
    console.log(`- ${menu.desserts.length} desserts`);
    console.log(`- ${menu.beverages.length} beverage categories`);
    
    console.log('\n🥗 Sample Appetizer:', menu.appetizers[0]);
    console.log('🍝 Sample Main:', menu.mains[0]);
    console.log('🍰 Sample Dessert:', menu.desserts[0]);
    
    console.log('\n🎉 Daily Specials:', menu.specials);
  }
};

// Test policy knowledge  
window.testPolicyKnowledge = () => {
  console.log('📋 Testing Policy Knowledge...');
  console.log('==============================');
  
  if (window.localConversationEngine) {
    const policies = window.localConversationEngine.knowledgeBase.restaurant.policies;
    const features = window.localConversationEngine.knowledgeBase.restaurant.features;
    
    console.log('📝 Restaurant Policies:');
    Object.keys(policies).forEach(key => {
      console.log(`- ${key}: ${policies[key]}`);
    });
    
    console.log('\n🏪 Restaurant Features:');
    Object.keys(features).forEach(key => {
      console.log(`- ${key}: ${features[key]}`);
    });
  }
};

// Benchmark response time
window.benchmarkResponseTime = async () => {
  if (!window.localConversationEngine) return;
  
  console.log('⏱️ Benchmarking Response Time...');
  console.log('=================================');
  
  const testMessages = [
    "Hello",
    "I need a table for 4",
    "What vegetarian options do you have?",
    "Do you have parking?",
    "My name is John Smith and my number is 555-1234"
  ];
  
  const times = [];
  
  for (const message of testMessages) {
    const start = performance.now();
    await window.localConversationEngine.handleTextConversation(message);
    const end = performance.now();
    const duration = end - start;
    times.push(duration);
    console.log(`"${message}" - ${duration.toFixed(2)}ms`);
  }
  
  const avgTime = times.reduce((a, b) => a + b) / times.length;
  console.log(`\n📊 Average response time: ${avgTime.toFixed(2)}ms`);
  console.log(`📊 Fastest: ${Math.min(...times).toFixed(2)}ms`);
  console.log(`📊 Slowest: ${Math.max(...times).toFixed(2)}ms`);
};

// Available enhanced functions
console.log('\n🛠️ Enhanced Test Functions Available:');
console.log('=====================================');
console.log('- testAdvancedConversations() - Test all new capabilities');
console.log('- testComplexBooking() - Full complex booking scenario');  
console.log('- testMenuKnowledge() - Check menu database');
console.log('- testPolicyKnowledge() - Check policies & features');
console.log('- benchmarkResponseTime() - Performance testing');

console.log('\n🎯 New Capabilities Added:');
console.log('==========================');
console.log('✅ Complex dietary restrictions handling');
console.log('✅ Accessibility needs accommodation');
console.log('✅ Special occasion recognition');
console.log('✅ Detailed menu with prices & descriptions');
console.log('✅ Comprehensive policy knowledge');
console.log('✅ Compliment & complaint handling');
console.log('✅ Urgency detection');
console.log('✅ Seating preference extraction');
console.log('✅ Enhanced booking confirmations');
console.log('✅ Restaurant feature information');

console.log('\n🚀 Ready to test enhanced LLM! Try: testAdvancedConversations()');