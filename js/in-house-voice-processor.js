// In-House Voice Processing System
// Lightweight NLP for restaurant bookings without external APIs

class InHouseVoiceProcessor {
  constructor() {
    this.patterns = this.initializePatterns();
    this.timeFormats = this.initializeTimeFormats();
    this.responses = this.initializeResponses();
    this.context = {};
    this.init();
  }

  init() {
    console.log('🧠 Initializing In-House Voice Processor...');
    this.setupSpeechRecognition();
    console.log('✅ In-House Voice Processor ready');
  }

  // ---------- Pattern Recognition System ----------
  
  initializePatterns() {
    return {
      // Name extraction patterns
      names: [
        /(?:my name is|i'm|i am|this is|name's|call me)\s+([a-zA-Z\s]{2,30})/i,
        /(?:for|under)\s+([a-zA-Z\s]{2,30})(?:\s|$)/i,
        /reservation\s+(?:for|under)\s+([a-zA-Z\s]{2,30})/i
      ],
      
      // Party size patterns
      partySize: [
        /(?:party of|table for|for)\s+(\d+)(?:\s+people|\s+persons|\s+guests|$)/i,
        /(\d+)\s+(?:people|persons|guests|diners)/i,
        /(?:we are|there are|it's)\s+(\d+)(?:\s+of us)?/i,
        /(?:just|only)\s+(\d+)/i
      ],
      
      // Date patterns
      dates: [
        /(?:today|this evening|tonight)/i,
        /(?:tomorrow|next day)/i,
        /(?:this\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
        /(?:next\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
        /(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}/i,
        /\d{1,2}\/\d{1,2}/i,
        /\d{1,2}-\d{1,2}/i
      ],
      
      // Time patterns
      times: [
        /(\d{1,2})(?::(\d{2}))?\s*(?:am|pm)/i,
        /(\d{1,2})\s*(?:o'?clock)/i,
        /at\s+(\d{1,2})(?::(\d{2}))?/i,
        /(?:around|about)\s+(\d{1,2})/i,
        /(?:lunch|dinner|breakfast)\s*time/i
      ],
      
      // Phone patterns
      phones: [
        /(?:phone|number|contact)(?:\s+is)?\s*(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/i,
        /(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/,
        /call\s+me\s+at\s+(\d+)/i
      ],
      
      // Intent patterns
      intents: {
        booking: [
          /(?:make|book|reserve|need|want)\s+(?:a\s+)?(?:reservation|table|booking)/i,
          /(?:table|reservation)\s+for/i,
          /book\s+(?:a\s+)?table/i,
          /reserve\s+(?:a\s+)?table/i
        ],
        
        inquiry: [
          /(?:what|when)\s+(?:time|times)\s+(?:are you|do you)\s+open/i,
          /(?:hours|operating|open)/i,
          /what\s+(?:do you|can you)\s+(?:have|serve)/i,
          /menu/i
        ],
        
        greeting: [
          /^(?:hi|hello|hey|good\s+(?:morning|afternoon|evening))/i,
          /how\s+are\s+you/i
        ]
      }
    };
  }

  initializeTimeFormats() {
    return {
      // Common time mappings
      lunch: '12:00 PM',
      dinner: '7:00 PM',
      breakfast: '9:00 AM',
      
      // Day mappings
      today: new Date(),
      tomorrow: new Date(Date.now() + 24 * 60 * 60 * 1000),
      
      // Time shortcuts
      'seven': '7:00 PM',
      'eight': '8:00 PM',
      'six': '6:00 PM',
      'five': '5:00 PM',
      'noon': '12:00 PM',
      'midnight': '12:00 AM'
    };
  }

  initializeResponses() {
    return {
      greeting: [
        "Hello! I'd be happy to help you make a reservation. What can I do for you?",
        "Hi there! Welcome to our restaurant. How can I assist you today?",
        "Good day! I'm here to help with your booking needs."
      ],
      
      needName: [
        "Great! I'd be happy to make that reservation. Can you please tell me your name?",
        "Perfect! What name should I put the reservation under?",
        "Wonderful! May I have your name for the reservation?"
      ],
      
      needPartySize: [
        "Thanks! How many people will be dining with us?",
        "Got it! For how many guests?",
        "Perfect! What's the party size?"
      ],
      
      needTime: [
        "Excellent! What time would you prefer?",
        "Great! What time works best for you?",
        "Perfect! When would you like to dine?"
      ],
      
      needPhone: [
        "Almost done! Can you provide a phone number for the reservation?",
        "Last thing - what's a good callback number?",
        "Just need a phone number to complete your booking."
      ],
      
      confirmation: [
        "Perfect! I have your reservation for {name}, party of {size}, on {date} at {time}. Your phone number is {phone}. Looking forward to seeing you!",
        "Excellent! Your table for {size} is booked under {name} for {date} at {time}. We'll contact you at {phone} if needed. See you soon!",
        "All set! Reservation confirmed for {name}, {size} guests, {date} at {time}. Contact: {phone}. Thank you for choosing us!"
      ],
      
      error: [
        "I'm sorry, I didn't catch that. Could you please repeat?",
        "I didn't understand. Can you try saying that differently?",
        "Could you please rephrase that?"
      ],
      
      hours: [
        "We're open Monday through Sunday, 11 AM to 10 PM. Would you like to make a reservation?",
        "Our hours are 11 AM to 10 PM daily. Can I help you book a table?"
      ],
      
      menu: [
        "We serve fresh, locally-sourced cuisine with daily specials. Would you like to make a reservation to try our food?",
        "We have a diverse menu featuring seasonal ingredients. Shall I book you a table?"
      ]
    };
  }

  // ---------- Speech Recognition Setup ----------
  
  setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('⚠️ Speech recognition not supported');
      return false;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';
    
    return true;
  }

  // ---------- Main Processing Pipeline ----------
  
  async processVoiceInput() {
    if (!this.recognition) {
      UIManager.showNotification('Speech recognition not supported in this browser', 'error');
      return;
    }

    return new Promise((resolve, reject) => {
      console.log('🎤 Starting voice input...');
      UIManager.updateElement('recognized', 'Listening... Speak now');
      UIManager.showNotification('Listening - speak your request', 'info');

      this.recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('🗣️ Voice input received:', transcript);
        
        try {
          const result = await this.processTranscript(transcript);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      this.recognition.onerror = (event) => {
        console.error('❌ Speech recognition error:', event.error);
        reject(new Error(`Speech recognition failed: ${event.error}`));
      };

      this.recognition.start();
    });
  }

  async processTranscript(transcript) {
    console.log('🧠 Processing transcript:', transcript);
    
    // Update UI with what was heard
    UIManager.updateElement('recognized', `You: ${transcript}`);
    
    // Extract information from transcript
    const extractedData = this.extractInformation(transcript);
    console.log('📊 Extracted data:', extractedData);
    
    // Update context with new information
    this.updateContext(extractedData);
    
    // Determine appropriate response
    const response = this.generateResponse();
    
    // Speak the response
    await this.speakResponse(response.text);
    
    // Check if booking is complete
    if (response.action === 'complete') {
      await this.createBooking();
    }
    
    return {
      transcript,
      extractedData,
      response: response.text,
      action: response.action,
      context: this.context
    };
  }

  // ---------- Information Extraction ----------
  
  extractInformation(text) {
    const data = {
      intent: this.extractIntent(text),
      name: this.extractName(text),
      partySize: this.extractPartySize(text),
      date: this.extractDate(text),
      time: this.extractTime(text),
      phone: this.extractPhone(text)
    };
    
    // Clean up extracted data
    Object.keys(data).forEach(key => {
      if (data[key] === null || data[key] === undefined || data[key] === '') {
        delete data[key];
      }
    });
    
    return data;
  }

  extractIntent(text) {
    // Check for booking intent
    for (const pattern of this.patterns.intents.booking) {
      if (pattern.test(text)) return 'booking';
    }
    
    // Check for inquiry intent
    for (const pattern of this.patterns.intents.inquiry) {
      if (pattern.test(text)) return 'inquiry';
    }
    
    // Check for greeting intent
    for (const pattern of this.patterns.intents.greeting) {
      if (pattern.test(text)) return 'greeting';
    }
    
    return 'booking'; // Default to booking for restaurants
  }

  extractName(text) {
    for (const pattern of this.patterns.names) {
      const match = text.match(pattern);
      if (match) {
        return this.cleanName(match[1]);
      }
    }
    return null;
  }

  extractPartySize(text) {
    for (const pattern of this.patterns.partySize) {
      const match = text.match(pattern);
      if (match) {
        const size = parseInt(match[1]);
        return (size > 0 && size <= 20) ? size : null;
      }
    }
    return null;
  }

  extractDate(text) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (/today|tonight|this evening/i.test(text)) {
      return today.toISOString().split('T')[0];
    }
    
    if (/tomorrow/i.test(text)) {
      return tomorrow.toISOString().split('T')[0];
    }
    
    // More complex date parsing could go here
    return null;
  }

  extractTime(text) {
    for (const pattern of this.patterns.times) {
      const match = text.match(pattern);
      if (match) {
        return this.normalizeTime(match[0]);
      }
    }
    
    // Check for meal times
    if (/lunch/i.test(text)) return '12:00 PM';
    if (/dinner/i.test(text)) return '7:00 PM';
    if (/breakfast/i.test(text)) return '9:00 AM';
    
    return null;
  }

  extractPhone(text) {
    for (const pattern of this.patterns.phones) {
      const match = text.match(pattern);
      if (match) {
        return this.cleanPhone(match[1]);
      }
    }
    return null;
  }

  // ---------- Context Management ----------
  
  updateContext(extractedData) {
    Object.assign(this.context, extractedData);
    
    // Set defaults
    if (!this.context.date) {
      this.context.date = new Date().toISOString().split('T')[0];
    }
    
    if (!this.context.time && this.context.intent === 'booking') {
      this.context.time = '7:00 PM'; // Default dinner time
    }
    
    console.log('🧠 Updated context:', this.context);
  }

  // ---------- Response Generation ----------
  
  generateResponse() {
    const ctx = this.context;
    
    // Handle different intents
    if (ctx.intent === 'greeting') {
      return {
        text: this.randomResponse('greeting'),
        action: 'continue'
      };
    }
    
    if (ctx.intent === 'inquiry') {
      if (/hours|open/i.test(ctx.lastTranscript || '')) {
        return {
          text: this.randomResponse('hours'),
          action: 'continue'
        };
      }
      if (/menu/i.test(ctx.lastTranscript || '')) {
        return {
          text: this.randomResponse('menu'),
          action: 'continue'
        };
      }
    }
    
    // Handle booking flow
    if (ctx.intent === 'booking') {
      // Check what information is missing
      if (!ctx.name) {
        return {
          text: this.randomResponse('needName'),
          action: 'continue'
        };
      }
      
      if (!ctx.partySize) {
        return {
          text: this.randomResponse('needPartySize'),
          action: 'continue'
        };
      }
      
      if (!ctx.time) {
        return {
          text: this.randomResponse('needTime'),
          action: 'continue'
        };
      }
      
      if (!ctx.phone) {
        return {
          text: this.randomResponse('needPhone'),
          action: 'continue'
        };
      }
      
      // All information collected - create booking
      return {
        text: this.randomResponse('confirmation')
          .replace('{name}', ctx.name)
          .replace('{size}', ctx.partySize)
          .replace('{date}', this.formatDate(ctx.date))
          .replace('{time}', ctx.time)
          .replace('{phone}', ctx.phone),
        action: 'complete'
      };
    }
    
    return {
      text: this.randomResponse('error'),
      action: 'continue'
    };
  }

  // ---------- Booking Creation ----------
  
  async createBooking() {
    const booking = {
      id: Date.now(),
      customer_name: this.context.name,
      phone_number: this.context.phone,
      party_size: this.context.partySize,
      date: this.context.date,
      start_time: this.parseTime(this.context.time),
      end_time: this.addHours(this.parseTime(this.context.time), 2),
      status: 'confirmed',
      notes: 'Created via voice booking',
      created_at: new Date().toISOString(),
      created_via: 'voice_inhouse'
    };
    
    console.log('📝 Creating booking:', booking);
    
    // Add to booking manager
    if (window.restaurantApp && window.restaurantApp.bookingManager) {
      window.restaurantApp.bookingManager.addBookingToUI(booking);
    }
    
    // Log the booking
    if (window.legacyFeatures) {
      window.legacyFeatures.addLog({
        type: 'success',
        source: 'Voice Booking (In-House)',
        text: `Booking created: ${booking.customer_name} - Party of ${booking.party_size}`
      });
    }
    
    // Clear context for next booking
    this.context = {};
    
    return booking;
  }

  // ---------- Text-to-Speech ----------
  
  async speakResponse(text) {
    if ('speechSynthesis' in window) {
      return new Promise((resolve) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;
        
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        
        speechSynthesis.speak(utterance);
        
        // Fallback timeout
        setTimeout(() => resolve(), text.length * 80);
      });
    } else {
      console.log('🔊 Text-to-Speech not supported, showing text only');
      UIManager.showNotification(`AI: ${text}`, 'info');
    }
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
    // Simple time normalization
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

  parseTime(timeStr) {
    const now = new Date();
    const [time, period] = timeStr.split(' ');
    const [hour, minute] = time.split(':');
    
    let hour24 = parseInt(hour);
    if (period === 'PM' && hour24 !== 12) hour24 += 12;
    if (period === 'AM' && hour24 === 12) hour24 = 0;
    
    const result = new Date(now);
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
    
    return date.toLocaleDateString();
  }

  randomResponse(category) {
    const responses = this.responses[category];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // ---------- Public Interface ----------
  
  async startVoiceBooking() {
    try {
      UIManager.showNotification('🎤 Voice booking started - speak when ready', 'info');
      const result = await this.processVoiceInput();
      
      if (result.action === 'complete') {
        UIManager.showNotification('🎉 Booking completed successfully!', 'success');
      } else {
        // Continue conversation
        setTimeout(() => {
          this.startVoiceBooking();
        }, 1000);
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Voice booking error:', error);
      UIManager.showNotification('Voice booking failed: ' + error.message, 'error');
      throw error;
    }
  }

  resetContext() {
    this.context = {};
    console.log('🔄 Context reset');
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (!window.inHouseVoiceProcessor) {
    window.inHouseVoiceProcessor = new InHouseVoiceProcessor();
  }
});

// Export for other modules
if (typeof window !== 'undefined') {
  window.InHouseVoiceProcessor = InHouseVoiceProcessor;
}