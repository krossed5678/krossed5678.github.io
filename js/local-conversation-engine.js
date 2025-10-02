// Local Conversation Engine
// Handles restaurant-specific conversations without external APIs

class LocalConversationEngine {
  constructor() {
    this.knowledgeBase = this.initializeKnowledgeBase();
    this.conversationPatterns = this.initializeConversationPatterns();
    this.conversationState = {};
    this.init();
  }

  init() {
    console.log('🧠 Initializing Local Conversation Engine...');
    console.log('✅ Local Conversation Engine ready');
  }

  // ---------- Knowledge Base ----------
  
  initializeKnowledgeBase() {
    return {
      restaurant: {
        name: "Mario's Italian Bistro",
        hours: {
          monday: "11:00 AM - 10:00 PM",
          tuesday: "11:00 AM - 10:00 PM", 
          wednesday: "11:00 AM - 10:00 PM",
          thursday: "11:00 AM - 10:00 PM",
          friday: "11:00 AM - 11:00 PM",
          saturday: "10:00 AM - 11:00 PM",
          sunday: "10:00 AM - 10:00 PM"
        },
        cuisine: "Italian",
        capacity: 80,
        avgDiningTime: 90, // minutes
        
        menu: {
          appetizers: ["Bruschetta", "Calamari", "Antipasto Platter", "Caesar Salad"],
          mains: ["Spaghetti Carbonara", "Chicken Parmigiana", "Seafood Risotto", "Margherita Pizza", "Lasagna", "Veal Piccata"],
          desserts: ["Tiramisu", "Gelato", "Cannoli", "Panna Cotta"],
          beverages: ["Italian Wine", "Espresso", "Limoncello", "San Pellegrino"]
        },
        
        policies: {
          reservationPolicy: "Reservations recommended for parties of 4 or more",
          cancellationPolicy: "24-hour cancellation notice preferred",
          largeParties: "Parties of 8+ may have gratuity added",
          dressCode: "Smart casual"
        },
        
        contact: {
          phone: "(555) 123-4567",
          address: "123 Main Street, Downtown",
          email: "info@mariositalian.com"
        }
      },
      
      commonQuestions: {
        "do you take reservations": "Yes, we accept reservations. Would you like to make one now?",
        "what's your hours": "We're open Monday through Thursday 11 AM to 10 PM, Friday 11 AM to 11 PM, Saturday 10 AM to 11 PM, and Sunday 10 AM to 10 PM.",
        "do you have parking": "Yes, we have valet parking available and street parking nearby.",
        "are you kid friendly": "Absolutely! We welcome families and have a children's menu available.",
        "do you have gluten free": "Yes, we offer several gluten-free pasta and pizza options.",
        "what type of food": "We serve authentic Italian cuisine including pasta, pizza, seafood, and traditional Italian dishes.",
        "do you deliver": "We offer takeout and work with several delivery services. Would you like our takeout number?",
        "how much does it cost": "Our entrees typically range from $18 to $35. Would you like to hear about our current specials?",
        "dress code": "We have a smart casual dress code - no shorts or flip-flops for dinner service.",
        "do you have wifi": "Yes, we provide complimentary WiFi for our guests."
      }
    };
  }

  initializeConversationPatterns() {
    return {
      // Intent classification patterns
      intents: {
        // Booking-related
        makeReservation: [
          /(?:make|book|reserve|need|want|get)\s+(?:a\s+)?(?:reservation|table|booking)/i,
          /(?:table|reservation)\s+for/i,
          /book\s+(?:a\s+)?table/i,
          /can\s+(?:we|i)\s+(?:get|have)\s+a\s+table/i
        ],
        
        checkAvailability: [
          /(?:do you have|are there|is there)\s+(?:any\s+)?(?:tables|availability|openings)/i,
          /(?:what\s+)?(?:times|slots)\s+(?:are\s+)?(?:available|open)/i,
          /can\s+you\s+fit\s+us\s+in/i
        ],
        
        modifyReservation: [
          /(?:change|modify|update|reschedule)\s+(?:my\s+)?reservation/i,
          /(?:cancel|remove)\s+(?:my\s+)?(?:reservation|booking)/i,
          /move\s+(?:my\s+)?(?:table|reservation)/i
        ],
        
        // Information requests  
        askHours: [
          /(?:what|when)\s+(?:time|times)\s+(?:are you|do you)\s+open/i,
          /(?:hours|operating|open)/i,
          /what\s+time\s+(?:do you|are you)\s+(?:close|open)/i
        ],
        
        askMenu: [
          /(?:what|tell me about)\s+(?:do you|can you)\s+(?:have|serve)/i,
          /(?:menu|food|cuisine|dishes)/i,
          /what\s+kind\s+of\s+food/i,
          /do\s+you\s+have\s+(?:vegetarian|vegan|gluten)/i
        ],
        
        askLocation: [
          /(?:where\s+are\s+you|address|location|directions)/i,
          /how\s+do\s+(?:i|we)\s+get\s+there/i
        ],
        
        askPolicies: [
          /(?:dress\s+code|what\s+should\s+i\s+wear)/i,
          /(?:parking|can\s+i\s+park)/i,
          /(?:kids|children|family)/i,
          /(?:cancellation|cancel)/i
        ],
        
        // Conversational
        greeting: [
          /^(?:hi|hello|hey|good\s+(?:morning|afternoon|evening))/i,
          /how\s+are\s+you/i
        ],
        
        thanks: [
          /^(?:thank\s+you|thanks|appreciate)/i,
          /that\s+(?:helps|works)/i
        ],
        
        goodbye: [
          /^(?:bye|goodbye|see\s+you|talk\s+to\s+you)/i,
          /have\s+a\s+(?:good|great|nice)/i
        ]
      },
      
      // Entity extraction patterns
      entities: {
        partySize: [
          /(?:party of|table for|for)\s+(\d+)(?:\s+people|\s+persons|\s+guests|$)/i,
          /(\d+)\s+(?:people|persons|guests|diners)/i,
          /(?:we are|there are|it's|just|only)\s+(\d+)(?:\s+of us)?/i
        ],
        
        dateTime: {
          today: /(?:today|this evening|tonight)/i,
          tomorrow: /(?:tomorrow|next day)/i,
          dayOfWeek: /(?:this\s+|next\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
          timeSlot: /(\d{1,2})(?::(\d{2}))?\s*(?:am|pm)/i,
          mealTime: /(?:lunch|dinner|breakfast)\s*time/i
        },
        
        customerName: [
          /(?:my name is|i'm|i am|this is|name's|call me)\s+([a-zA-Z\s]{2,30})/i,
          /(?:for|under)\s+([a-zA-Z\s]{2,30})(?:\s|$)/i,
          /reservation\s+(?:for|under)\s+([a-zA-Z\s]{2,30})/i
        ],
        
        phoneNumber: [
          /(?:phone|number|contact)(?:\s+is)?\s*(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/i,
          /(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/,
          /call\s+me\s+at\s+(\d+)/i
        ],
        
        preferences: {
          dietary: /(?:vegetarian|vegan|gluten[-\s]?free|dairy[-\s]?free|allergic\s+to|no\s+(?:meat|dairy|gluten))/i,
          seating: /(?:booth|table|bar|patio|outdoor|window|quiet|private)/i,
          occasion: /(?:birthday|anniversary|date|business|celebration|romantic)/i
        }
      }
    };
  }

  // ---------- Main Conversation Processing ----------
  
  async processMessage(message) {
    console.log('💬 Processing message:', message);
    
    const normalizedMessage = message.toLowerCase().trim();
    
    // Classify intent
    const intent = this.classifyIntent(normalizedMessage);
    
    // Extract entities
    const entities = this.extractEntities(message);
    
    // Update conversation state
    this.updateConversationState(intent, entities, message);
    
    // Generate response
    const response = this.generateResponse(intent, entities, normalizedMessage);
    
    return {
      intent,
      entities,
      response,
      conversationState: this.conversationState
    };
  }

  // ---------- Intent Classification ----------
  
  classifyIntent(message) {
    const patterns = this.conversationPatterns.intents;
    
    for (const [intent, patternList] of Object.entries(patterns)) {
      for (const pattern of patternList) {
        if (pattern.test(message)) {
          return intent;
        }
      }
    }
    
    // Default intent based on conversation state
    if (this.conversationState.activeBooking) {
      return 'makeReservation';
    }
    
    return 'general';
  }

  // ---------- Entity Extraction ----------
  
  extractEntities(message) {
    const entities = {};
    
    // Extract party size
    for (const pattern of this.conversationPatterns.entities.partySize) {
      const match = message.match(pattern);
      if (match) {
        const size = parseInt(match[1]);
        if (size > 0 && size <= 20) {
          entities.partySize = size;
        }
      }
    }
    
    // Extract customer name
    for (const pattern of this.conversationPatterns.entities.customerName) {
      const match = message.match(pattern);
      if (match) {
        entities.customerName = this.cleanName(match[1]);
      }
    }
    
    // Extract phone number
    for (const pattern of this.conversationPatterns.entities.phoneNumber) {
      const match = message.match(pattern);
      if (match) {
        entities.phoneNumber = this.cleanPhone(match[1]);
      }
    }
    
    // Extract date/time
    this.extractDateTime(message, entities);
    
    // Extract preferences
    this.extractPreferences(message, entities);
    
    return entities;
  }

  extractDateTime(message, entities) {
    const patterns = this.conversationPatterns.entities.dateTime;
    
    // Check for specific dates
    if (patterns.today.test(message)) {
      entities.date = new Date().toISOString().split('T')[0];
    } else if (patterns.tomorrow.test(message)) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      entities.date = tomorrow.toISOString().split('T')[0];
    }
    
    // Check for day of week
    const dayMatch = message.match(patterns.dayOfWeek);
    if (dayMatch) {
      entities.dayOfWeek = dayMatch[1].toLowerCase();
    }
    
    // Check for time
    const timeMatch = message.match(patterns.timeSlot);
    if (timeMatch) {
      entities.time = this.normalizeTime(timeMatch[0]);
    }
    
    // Check for meal times
    if (patterns.mealTime.test(message)) {
      if (/lunch/i.test(message)) entities.time = '12:00 PM';
      if (/dinner/i.test(message)) entities.time = '7:00 PM';
      if (/breakfast/i.test(message)) entities.time = '10:00 AM';
    }
  }

  extractPreferences(message, entities) {
    const patterns = this.conversationPatterns.entities.preferences;
    
    if (patterns.dietary.test(message)) {
      entities.dietaryRestrictions = message.match(patterns.dietary)[0];
    }
    
    if (patterns.seating.test(message)) {
      entities.seatingPreference = message.match(patterns.seating)[0];
    }
    
    if (patterns.occasion.test(message)) {
      entities.occasion = message.match(patterns.occasion)[0];
    }
  }

  // ---------- Conversation State Management ----------
  
  updateConversationState(intent, entities, message) {
    // Initialize active booking if needed
    if (intent === 'makeReservation' && !this.conversationState.activeBooking) {
      this.conversationState.activeBooking = {
        id: Date.now(),
        status: 'in_progress',
        created: new Date().toISOString()
      };
    }
    
    // Update booking with extracted entities
    if (this.conversationState.activeBooking) {
      Object.assign(this.conversationState.activeBooking, entities);
    }
    
    // Track conversation history
    if (!this.conversationState.history) {
      this.conversationState.history = [];
    }
    
    this.conversationState.history.push({
      timestamp: new Date().toISOString(),
      message,
      intent,
      entities
    });
    
    // Keep only last 10 messages
    if (this.conversationState.history.length > 10) {
      this.conversationState.history = this.conversationState.history.slice(-10);
    }
  }

  // ---------- Response Generation ----------
  
  generateResponse(intent, entities, message) {
    switch (intent) {
      case 'greeting':
        return this.handleGreeting();
        
      case 'makeReservation':
        return this.handleReservation(entities);
        
      case 'checkAvailability':
        return this.handleAvailabilityCheck(entities);
        
      case 'askHours':
        return this.handleHoursInquiry();
        
      case 'askMenu':
        return this.handleMenuInquiry(message);
        
      case 'askLocation':
        return this.handleLocationInquiry();
        
      case 'askPolicies':
        return this.handlePolicyInquiry(message);
        
      case 'thanks':
        return this.handleThanks();
        
      case 'goodbye':
        return this.handleGoodbye();
        
      default:
        return this.handleGeneral(message);
    }
  }

  handleGreeting() {
    const greetings = [
      `Hello! Welcome to ${this.knowledgeBase.restaurant.name}. How can I help you today?`,
      `Hi there! I'm here to help with reservations and answer any questions about our restaurant.`,
      `Good day! What can I do for you at ${this.knowledgeBase.restaurant.name}?`
    ];
    
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  handleReservation(entities) {
    const booking = this.conversationState.activeBooking;
    
    if (!booking) {
      return "I'd be happy to help you make a reservation! Let me get some details from you.";
    }
    
    // Check what information we still need
    const missing = [];
    if (!booking.customerName) missing.push('name');
    if (!booking.partySize) missing.push('party size');
    if (!booking.date && !booking.dayOfWeek) missing.push('date');
    if (!booking.time) missing.push('time');
    if (!booking.phoneNumber) missing.push('phone number');
    
    if (missing.length === 0) {
      // All info collected - confirm reservation
      return this.confirmReservation(booking);
    }
    
    // Ask for next missing piece of information
    return this.requestMissingInfo(missing[0], booking);
  }

  requestMissingInfo(missingInfo, booking) {
    const questions = {
      name: "Great! What name should I put the reservation under?",
      'party size': "Perfect! How many people will be dining with us?",
      date: "Excellent! What day would you like to come in?",
      time: "Wonderful! What time would you prefer?",
      'phone number': "Almost done! Can you provide a phone number for the reservation?"
    };
    
    return questions[missingInfo] || "I need a bit more information to complete your reservation.";
  }

  confirmReservation(booking) {
    // Create the booking
    const finalBooking = {
      id: booking.id,
      customer_name: booking.customerName,
      phone_number: booking.phoneNumber,
      party_size: booking.partySize,
      date: booking.date || this.getDayOfWeekDate(booking.dayOfWeek),
      start_time: this.parseTime(booking.time, booking.date),
      end_time: this.addHours(this.parseTime(booking.time, booking.date), 2),
      status: 'confirmed',
      notes: booking.occasion ? `Occasion: ${booking.occasion}` : 'Created via chat',
      created_at: new Date().toISOString(),
      created_via: 'chat_inhouse'
    };
    
    // Add to system
    this.createBooking(finalBooking);
    
    // Clear active booking
    delete this.conversationState.activeBooking;
    
    const dateStr = this.formatDate(finalBooking.date);
    
    return `Perfect! Your reservation is confirmed for ${booking.customerName}, party of ${booking.partySize}, on ${dateStr} at ${booking.time}. We'll contact you at ${booking.phoneNumber} if needed. Looking forward to seeing you at ${this.knowledgeBase.restaurant.name}!`;
  }

  handleAvailabilityCheck(entities) {
    const timeSlots = ["5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM", "9:00 PM"];
    const availableSlots = timeSlots.slice(0, Math.floor(Math.random() * 6) + 3);
    
    if (entities.date || entities.dayOfWeek) {
      const dateRef = entities.date ? this.formatDate(entities.date) : entities.dayOfWeek;
      return `For ${dateRef}, we have availability at: ${availableSlots.join(', ')}. Would you like to make a reservation for any of these times?`;
    }
    
    return `We have several time slots available today: ${availableSlots.join(', ')}. What day were you thinking of dining with us?`;
  }

  handleHoursInquiry() {
    const hours = this.knowledgeBase.restaurant.hours;
    return `Our hours are: Monday-Thursday ${hours.monday}, Friday ${hours.friday}, Saturday ${hours.saturday}, and Sunday ${hours.sunday}. Would you like to make a reservation?`;
  }

  handleMenuInquiry(message) {
    const menu = this.knowledgeBase.restaurant.menu;
    
    if (/appetizer|starter/i.test(message)) {
      return `Our popular appetizers include: ${menu.appetizers.join(', ')}. Would you like to make a reservation to try them?`;
    }
    
    if (/main|entree|dinner/i.test(message)) {
      return `Our signature dishes include: ${menu.mains.slice(0, 4).join(', ')}, and more! We serve authentic Italian cuisine. Shall I make you a reservation?`;
    }
    
    if (/dessert/i.test(message)) {
      return `Our delicious desserts include: ${menu.desserts.join(', ')}. Perfect way to end your meal!`;
    }
    
    if (/drink|wine|beverage/i.test(message)) {
      return `We offer ${menu.beverages.join(', ')}, and an extensive Italian wine list. Would you like to book a table?`;
    }
    
    if (/vegetarian|vegan/i.test(message)) {
      return "We have several vegetarian options including our Margherita Pizza and fresh salads. We can also accommodate vegan requests with advance notice.";
    }
    
    if (/gluten/i.test(message)) {
      return "Yes! We offer gluten-free pasta and pizza options. Just let us know when you make your reservation so we can prepare accordingly.";
    }
    
    return `We serve authentic ${this.knowledgeBase.restaurant.cuisine} cuisine with fresh, locally-sourced ingredients. Our specialties include ${menu.mains.slice(0, 3).join(', ')}. Would you like to make a reservation?`;
  }

  handleLocationInquiry() {
    const contact = this.knowledgeBase.restaurant.contact;
    return `We're located at ${contact.address}. We have valet parking available and are easily accessible by public transport. Our phone number is ${contact.phone} if you need directions!`;
  }

  handlePolicyInquiry(message) {
    const policies = this.knowledgeBase.restaurant.policies;
    
    if (/dress|wear|attire/i.test(message)) {
      return `Our dress code is ${policies.dressCode}. We want you to feel comfortable while maintaining a nice atmosphere for all guests.`;
    }
    
    if (/parking/i.test(message)) {
      return "We offer valet parking for your convenience, and there's also street parking available nearby.";
    }
    
    if (/kid|child|family/i.test(message)) {
      return "Absolutely! We're family-friendly and have a children's menu. High chairs and booster seats are available.";
    }
    
    if (/cancel/i.test(message)) {
      return `${policies.cancellationPolicy}. You can call us or let me know here if you need to make changes.`;
    }
    
    if (/large|group|party/i.test(message)) {
      return `${policies.largeParties}. We're happy to accommodate larger groups with advance notice!`;
    }
    
    return "I'd be happy to help with any specific questions about our policies. What would you like to know?";
  }

  handleThanks() {
    const responses = [
      "You're very welcome! Is there anything else I can help you with?",
      "My pleasure! Let me know if you have any other questions.",
      "Happy to help! Anything else you'd like to know about our restaurant?"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  handleGoodbye() {
    const responses = [
      `Thank you for your interest in ${this.knowledgeBase.restaurant.name}! We look forward to seeing you soon.`,
      "Have a wonderful day! Don't hesitate to reach out if you need anything else.",
      "Thanks for chatting! We can't wait to serve you at our restaurant."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  handleGeneral(message) {
    // Check against common questions
    for (const [question, answer] of Object.entries(this.knowledgeBase.commonQuestions)) {
      if (message.includes(question)) {
        return answer;
      }
    }
    
    // Default response
    return "I'd be happy to help! I can assist with reservations, provide information about our menu, hours, or location. What would you like to know?";
  }

  // ---------- Booking Management ----------
  
  createBooking(booking) {
    console.log('📝 Creating local booking:', booking);
    
    // Add to booking manager if available
    if (window.restaurantApp && window.restaurantApp.bookingManager) {
      window.restaurantApp.bookingManager.addBookingToUI(booking);
    }
    
    // Log the booking
    if (window.legacyFeatures) {
      window.legacyFeatures.addLog({
        type: 'success',
        source: 'Chat Booking (Local Engine)',
        text: `Booking created: ${booking.customer_name} - Party of ${booking.party_size}`
      });
    }
    
    return booking;
  }

  // ---------- Utility Functions ----------
  
  cleanName(name) {
    return name.trim()
      .replace(/\b\w/g, l => l.toUpperCase())
      .replace(/[^a-zA-Z\s]/g, '')
      .slice(0, 30);
  }

  cleanPhone(phone) {
    return phone.replace(/[^\d]/g, '').slice(0, 10);
  }

  normalizeTime(timeStr) {
    const match = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (match) {
      let hour = parseInt(match[1]);
      const minute = match[2] || '00';
      const period = match[3] || (hour < 12 ? 'AM' : 'PM');
      
      if (period.toLowerCase() === 'pm' && hour < 12) hour += 12;
      if (period.toLowerCase() === 'am' && hour === 12) hour = 0;
      
      return `${hour % 12 || 12}:${minute} ${hour >= 12 ? 'PM' : 'AM'}`;
    }
    return timeStr;
  }

  parseTime(timeStr, dateStr = null) {
    const baseDate = dateStr ? new Date(dateStr) : new Date();
    const [time, period] = timeStr.split(' ');
    const [hour, minute] = time.split(':');
    
    let hour24 = parseInt(hour);
    if (period === 'PM' && hour24 !== 12) hour24 += 12;
    if (period === 'AM' && hour24 === 12) hour24 = 0;
    
    const result = new Date(baseDate);
    result.setHours(hour24, parseInt(minute || 0), 0, 0);
    
    return result.toISOString();
  }

  addHours(dateStr, hours) {
    const date = new Date(dateStr);
    date.setHours(date.getHours() + hours);
    return date.toISOString();
  }

  formatDate(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return 'today';
    if (date.toDateString() === tomorrow.toDateString()) return 'tomorrow';
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  getDayOfWeekDate(dayName) {
    const today = new Date();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetDay = days.indexOf(dayName.toLowerCase());
    const currentDay = today.getDay();
    
    let daysUntilTarget = targetDay - currentDay;
    if (daysUntilTarget <= 0) daysUntilTarget += 7; // Next week
    
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysUntilTarget);
    
    return targetDate.toISOString().split('T')[0];
  }

  // ---------- Public Interface ----------
  
  async handleTextConversation(message) {
    try {
      const result = await this.processMessage(message);
      
      console.log('💬 Local conversation result:', result);
      
      return {
        success: true,
        response: result.response,
        intent: result.intent,
        entities: result.entities,
        conversationState: result.conversationState
      };
      
    } catch (error) {
      console.error('❌ Local conversation error:', error);
      return {
        success: false,
        response: "I apologize, but I'm having trouble processing that. Could you please rephrase your question?",
        error: error.message
      };
    }
  }

  resetConversation() {
    this.conversationState = {};
    console.log('🔄 Conversation state reset');
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (!window.localConversationEngine) {
    window.localConversationEngine = new LocalConversationEngine();
  }
});

// Export for other modules
if (typeof window !== 'undefined') {
  window.LocalConversationEngine = LocalConversationEngine;
}