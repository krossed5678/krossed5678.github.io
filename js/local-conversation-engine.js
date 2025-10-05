// Local Conversation Engine
// Handles restaurant-specific conversations without external APIs

class LocalConversationEngine {
  constructor(configLoader = null) {
    this.configLoader = configLoader;
    this.knowledgeBase = null;
    this.conversationPatterns = this.initializeConversationPatterns();
    this.conversationState = {};
    this.brandVoice = null;
    this.businessRules = null;
    this.init();
  }

  async init() {
    console.log('🧠 Initializing Local Conversation Engine...');
    
    // Load configuration if config loader provided
    if (this.configLoader) {
      try {
        await this.loadConfiguration();
      } catch (error) {
        console.warn('⚠️ Config loading failed, using default knowledge base:', error);
        this.knowledgeBase = this.initializeKnowledgeBase();
      }
    } else {
      this.knowledgeBase = this.initializeKnowledgeBase();
    }
    
    console.log('✅ Local Conversation Engine ready');
  }

  async loadConfiguration() {
    console.log('📁 Loading restaurant configuration...');
    
    if (!this.configLoader.isConfigLoaded()) {
      await this.configLoader.loadConfig();
    }
    
    const transformedConfig = this.configLoader.transformForConversationEngine();
    this.knowledgeBase = transformedConfig;
    this.brandVoice = transformedConfig.brandVoice;
    this.businessRules = transformedConfig.businessRules;
    
    console.log(`✅ Configuration loaded for: ${transformedConfig.restaurant.name}`);
  }

  // ---------- Knowledge Base ----------
  
  initializeKnowledgeBase() {
    return {
      restaurant: {
        name: "Mario's Italian Bistro",
        description: "Authentic Italian cuisine in an elegant, family-friendly atmosphere",
        established: "1985",
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
        priceRange: "$$-$$$",
        capacity: 80,
        avgDiningTime: 90, // minutes
        reservationWindow: 60, // days in advance
        walkInsWelcome: true,
        
        menu: {
          appetizers: [
            {name: "Bruschetta Trio", price: "$12", description: "Toasted bread with tomato basil, ricotta honey, and olive tapenade", dietary: ["vegetarian"]},
            {name: "Calamari Fritti", price: "$14", description: "Crispy squid with marinara and lemon aioli"},
            {name: "Antipasto Della Casa", price: "$18", description: "Cured meats, artisanal cheeses, olives, and roasted peppers", dietary: ["gluten-free available"]},
            {name: "Arancini", price: "$11", description: "Risotto balls stuffed with mozzarella, served with marinara", dietary: ["vegetarian"]}
          ],
          mains: [
            {name: "Spaghetti Carbonara", price: "$19", description: "Traditional Roman pasta with pancetta, egg, and pecorino"},
            {name: "Chicken Parmigiana", price: "$24", description: "Breaded chicken breast with marinara and mozzarella over pasta"},
            {name: "Seafood Risotto", price: "$28", description: "Creamy arborio rice with shrimp, scallops, and mussels", dietary: ["gluten-free"]},
            {name: "Margherita Pizza", price: "$16", description: "San Marzano tomatoes, fresh mozzarella, basil", dietary: ["vegetarian", "vegan available"]},
            {name: "Osso Buco", price: "$32", description: "Braised veal shanks with saffron risotto", dietary: ["gluten-free"]},
            {name: "Eggplant Parmigiana", price: "$21", description: "Layered eggplant with marinara and mozzarella", dietary: ["vegetarian", "vegan available"]}
          ],
          desserts: [
            {name: "Tiramisu", price: "$8", description: "Classic mascarpone dessert with espresso and cocoa", dietary: ["vegetarian"]},
            {name: "Gelato Trio", price: "$7", description: "Vanilla, chocolate, and pistachio", dietary: ["vegetarian", "dairy-free available"]},
            {name: "Cannoli Siciliani", price: "$9", description: "Crispy shells filled with sweet ricotta and chocolate chips", dietary: ["vegetarian"]},
            {name: "Panna Cotta", price: "$8", description: "Vanilla custard with seasonal berry compote", dietary: ["vegetarian", "gluten-free"]}
          ],
          beverages: [
            {category: "Wine", items: ["Chianti Classico", "Pinot Grigio", "Barolo", "Prosecco"]},
            {category: "Beer", items: ["Peroni", "Moretti", "Local IPA", "Wheat Beer"]},
            {category: "Coffee", items: ["Espresso", "Cappuccino", "Americano", "Affogato"]},
            {category: "Non-Alcoholic", items: ["San Pellegrino", "Italian Sodas", "Fresh Juices", "Herbal Teas"]}
          ],
          specials: {
            daily: "Ask about our daily pasta special made with seasonal ingredients",
            happyHour: "Monday-Friday 3-6 PM: Half-price appetizers and $5 house wine",
            weekend: "Weekend brunch 10 AM-3 PM with bottomless mimosas"
          }
        },
        
        policies: {
          reservationPolicy: "Reservations recommended for parties of 4 or more. Walk-ins welcome based on availability.",
          cancellationPolicy: "24-hour cancellation notice preferred. Same-day cancellations may incur a fee.",
          largeParties: "Parties of 8+ require a deposit and may have gratuity added. Private dining available for 12+.",
          dressCode: "Smart casual. No shorts, flip-flops, or athletic wear for dinner service.",
          children: "Children welcome. High chairs and kids menu available. Crayons and activities provided.",
          pets: "Service animals welcome. Outdoor seating allows well-behaved leashed pets.",
          accessibility: "Fully wheelchair accessible. Braille menus and large print menus available.",
          payment: "We accept all major credit cards, cash, and digital payments. Split bills welcome.",
          corkage: "$25 corkage fee for wine. Maximum 2 bottles per table.",
          privateEvents: "Private dining room seats 20. Full restaurant buyouts available for 80+."
        },
        
        features: {
          wifi: "Complimentary high-speed WiFi throughout restaurant",
          parking: "Valet parking available evenings. Street parking and nearby garage.",
          atmosphere: "Romantic lighting, live jazz on weekends, family-friendly until 8 PM",
          specialServices: ["Wine pairing dinners", "Cooking classes", "Private chef events", "Catering services"]
        },
        
        staff: {
          chefInfo: "Executive Chef Marco trained in Milan and Rome",
          sommelier: "Wine expert available Thursday-Sunday evenings",
          languages: ["English", "Italian", "Spanish"]
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
          /(?:make|book|reserve|need|want|get|schedule|set\s+up)\s+(?:a\s+)?(?:reservation|table|booking|appointment)/i,
          /(?:table|reservation)\s+for/i,
          /book\s+(?:a\s+)?table/i,
          /can\s+(?:we|i)\s+(?:get|have|reserve|book)\s+(?:a\s+)?table/i,
          /(?:i|we)\s+(?:would\s+like|want|need)\s+(?:to\s+)?(?:book|reserve|make)/i,
          /looking\s+(?:for|to\s+book)\s+(?:a\s+)?(?:table|reservation)/i,
          /(?:could|can)\s+(?:i|we)\s+(?:please\s+)?(?:book|reserve|get)/i
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
          /(?:dress\s+code|what\s+should\s+i\s+wear|attire)/i,
          /(?:parking|can\s+i\s+park|where\s+to\s+park)/i,
          /(?:kids|children|family|child\s+friendly|high\s+chairs)/i,
          /(?:cancellation|cancel|reschedule|change|modify)/i,
          /(?:pets|dogs|animals)/i,
          /(?:wheelchair|accessible|disability)/i,
          /(?:large\s+groups|parties|events)/i,
          /(?:private\s+dining|room|space)/i
        ],

        askSpecials: [
          /(?:specials|deals|promotions|offers)/i,
          /(?:happy\s+hour|wine\s+specials)/i,
          /(?:today'?s\s+special|chef'?s\s+special)/i,
          /(?:seasonal|limited\s+time)/i
        ],

        askDietary: [
          /(?:vegetarian|vegan|plant\s+based)/i,
          /(?:gluten\s+free|gluten[-\s]free|celiac)/i,
          /(?:allergies|allergy|allergic)/i,
          /(?:dairy\s+free|lactose)/i,
          /(?:keto|low\s+carb|atkins)/i,
          /(?:halal|kosher)/i
        ],

        compliment: [
          /(?:great|excellent|amazing|wonderful|fantastic|love|perfect)/i,
          /(?:best|incredible|outstanding|impressive)/i
        ],

        complaint: [
          /(?:terrible|awful|bad|horrible|disappointing|upset|angry)/i,
          /(?:problem|issue|wrong|mistake|error)/i,
          /(?:cold\s+food|slow\s+service|rude)/i
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
          dietary: /(?:vegetarian|vegan|plant[-\s]?based|gluten[-\s]?free|dairy[-\s]?free|lactose[-\s]?free|allergic\s+to|no\s+(?:meat|dairy|gluten|nuts|shellfish)|keto|low[-\s]?carb|halal|kosher)/i,
          seating: /(?:booth|table|bar|patio|outdoor|indoor|window|quiet|private|corner|round\s+table|high\s+top|banquette)/i,
          occasion: /(?:birthday|anniversary|date|business|celebration|romantic|proposal|graduation|retirement|baby\s+shower|wedding|engagement)/i,
          accessibility: /(?:wheelchair|accessible|mobility|walker|cane|hearing|visual)/i,
          ambiance: /(?:quiet|loud|lively|romantic|casual|formal|intimate|family\s+friendly)/i
        },

        urgency: [
          /(?:urgent|asap|as\s+soon\s+as\s+possible|emergency|right\s+now)/i,
          /(?:last\s+minute|short\s+notice)/i
        ],

        groupSize: [
          /(?:large\s+group|big\s+party|(?:over|more\s+than)\s+\d+)/i,
          /(?:small|intimate|just\s+(?:two|2)|couple)/i
        ]
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
    
    if (patterns.accessibility.test(message)) {
      entities.accessibilityNeeds = message.match(patterns.accessibility)[0];
    }
    
    if (patterns.ambiance.test(message)) {
      entities.ambiancePreference = message.match(patterns.ambiance)[0];
    }
    
    // Extract urgency
    for (const pattern of this.conversationPatterns.entities.urgency) {
      if (pattern.test(message)) {
        entities.urgency = 'high';
        break;
      }
    }
    
    // Extract group size indicators
    for (const pattern of this.conversationPatterns.entities.groupSize) {
      if (pattern.test(message)) {
        entities.groupType = message.match(pattern)[0];
        break;
      }
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
        
      case 'askSpecials':
        return this.handleSpecialsInquiry();
        
      case 'askDietary':
        return this.handleDietaryInquiry(message);
        
      case 'compliment':
        return this.handleCompliment();
        
      case 'complaint':
        return this.handleComplaint();
        
      case 'goodbye':
        return this.handleGoodbye();
        
      default:
        return this.handleGeneral(message);
    }
  }

  handleGreeting() {
    // Use custom greeting responses if available
    if (this.configLoader && this.configLoader.getConfig()) {
      const customGreetings = this.configLoader.getConfig().conversation_settings?.default_responses?.greeting;
      if (customGreetings && customGreetings.length > 0) {
        const template = customGreetings[Math.floor(Math.random() * customGreetings.length)];
        return this.configLoader.customizeResponse(template);
      }
    }
    
    // Fallback to default greetings
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
    // Create comprehensive booking with all extracted information
    const notes = [];
    if (booking.occasion) notes.push(`Occasion: ${booking.occasion}`);
    if (booking.dietaryRestrictions) notes.push(`Dietary: ${booking.dietaryRestrictions}`);
    if (booking.seatingPreference) notes.push(`Seating: ${booking.seatingPreference}`);
    if (booking.accessibilityNeeds) notes.push(`Accessibility: ${booking.accessibilityNeeds}`);
    if (booking.ambiancePreference) notes.push(`Ambiance: ${booking.ambiancePreference}`);
    if (booking.urgency === 'high') notes.push('URGENT REQUEST');
    
    const finalBooking = {
      id: booking.id,
      customer_name: booking.customerName,
      phone_number: booking.phoneNumber,
      party_size: booking.partySize,
      date: booking.date || this.getDayOfWeekDate(booking.dayOfWeek),
      start_time: this.parseTime(booking.time, booking.date),
      end_time: this.addHours(this.parseTime(booking.time, booking.date), 2),
      status: 'confirmed',
      notes: notes.length > 0 ? notes.join('; ') : 'Created via in-house chat system',
      created_at: new Date().toISOString(),
      created_via: 'chat_inhouse',
      preferences: {
        dietary: booking.dietaryRestrictions || null,
        seating: booking.seatingPreference || null,
        occasion: booking.occasion || null,
        accessibility: booking.accessibilityNeeds || null,
        urgency: booking.urgency || 'normal'
      }
    };
    
    // Add to system
    this.createBooking(finalBooking);
    
    // Clear active booking
    delete this.conversationState.activeBooking;
    
    const dateStr = this.formatDate(finalBooking.date);
    let confirmationMsg = `Perfect! Your reservation is confirmed for ${booking.customerName}, party of ${booking.partySize}, on ${dateStr} at ${booking.time}.`;
    
    // Add personalized touches based on extracted information
    if (booking.occasion) {
      confirmationMsg += ` We're excited to help you celebrate your ${booking.occasion}!`;
    }
    
    if (booking.dietaryRestrictions) {
      confirmationMsg += ` We've noted your ${booking.dietaryRestrictions} preference and will ensure our chef prepares special options.`;
    }
    
    if (booking.seatingPreference) {
      confirmationMsg += ` We'll do our best to accommodate your ${booking.seatingPreference} seating preference.`;
    }
    
    if (booking.accessibilityNeeds) {
      confirmationMsg += ` We've noted your accessibility needs and will have everything ready.`;
    }
    
    confirmationMsg += ` We'll contact you at ${booking.phoneNumber} if needed. Looking forward to welcoming you to ${this.knowledgeBase.restaurant.name}!`;
    
    return confirmationMsg;
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
      if (Array.isArray(menu.appetizers) && menu.appetizers.length > 0) {
        const apps = menu.appetizers.map(item => {
          if (typeof item === 'object') {
            return `${item.name} (${item.price})${item.popular ? ' - Popular!' : ''}`;
          }
          return item;
        }).join(', ');
        return `Our appetizers include: ${apps}. All made fresh to order! Would you like to make a reservation?`;
      } else {
        return "We have a variety of delicious appetizers. Would you like to make a reservation to try them?";
      }
    }
    
    if (/main|entree|dinner/i.test(message)) {
      const mains = menu.mains.slice(0, 3).map(item => `${item.name} (${item.price}) - ${item.description}`).join('; ');
      return `Our signature dishes include: ${mains}. We serve authentic Italian cuisine made with imported ingredients. Shall I make you a reservation?`;
    }
    
    if (/dessert/i.test(message)) {
      const desserts = menu.desserts.map(item => `${item.name} (${item.price})`).join(', ');
      return `Our house-made desserts include: ${desserts}. Our Tiramisu is made with the traditional family recipe! Perfect way to end your meal.`;
    }
    
    if (/drink|wine|beverage/i.test(message)) {
      return `We have an extensive Italian wine list featuring Chianti, Barolo, and Prosecco. Our sommelier is available Thursday-Sunday evenings for wine pairings. We also offer craft cocktails, Italian beers, and artisanal coffee. Would you like to book a table?`;
    }
    
    if (/price|cost|expensive|cheap/i.test(message)) {
      return `We're in the ${this.knowledgeBase.restaurant.priceRange} range. Appetizers $11-18, mains $16-32, desserts $7-9. Great value for authentic Italian cuisine! Check out our happy hour specials Monday-Friday 3-6 PM.`;
    }
    
    return `We serve authentic ${this.knowledgeBase.restaurant.cuisine} cuisine with fresh, locally-sourced ingredients. Our Executive Chef Marco trained in Milan and Rome. ${menu.specials.daily} Would you like to make a reservation?`;
  }

  handleLocationInquiry() {
    const contact = this.knowledgeBase.restaurant.contact;
    return `We're located at ${contact.address}. We have valet parking available and are easily accessible by public transport. Our phone number is ${contact.phone} if you need directions!`;
  }

  handlePolicyInquiry(message) {
    const policies = this.knowledgeBase.restaurant.policies;
    const features = this.knowledgeBase.restaurant.features;
    
    if (/dress|wear|attire/i.test(message)) {
      return `Our dress code is ${policies.dressCode}. We want you to feel comfortable while maintaining a nice atmosphere for all guests.`;
    }
    
    if (/parking/i.test(message)) {
      return `${features.parking} There's also a public garage two blocks away. Valet is complimentary with dinner reservations!`;
    }
    
    if (/kid|child|family/i.test(message)) {
      return `${policies.children} We're ${features.atmosphere.split(',')[2]}. Kids love our house-made pasta and pizza!`;
    }
    
    if (/cancel|reschedule|change/i.test(message)) {
      return `${policies.cancellationPolicy} You can call us, use our online system, or let me know here if you need to make changes. We understand plans change!`;
    }
    
    if (/large|group|party|event/i.test(message)) {
      return `${policies.largeParties} Our private dining room is perfect for celebrations, business dinners, or special occasions. We can customize menus for your event!`;
    }
    
    if (/pet|dog|animal/i.test(message)) {
      return `${policies.pets} Our patio is perfect for well-behaved four-legged family members! We even have a special doggy menu.`;
    }
    
    if (/wheelchair|accessible|disability/i.test(message)) {
      return `${policies.accessibility} We're committed to ensuring all guests can enjoy our restaurant comfortably.`;
    }
    
    if (/payment|pay|card|cash/i.test(message)) {
      return `${policies.payment} We also offer contactless payment options for your convenience.`;
    }
    
    if (/wine|bring|bottle|corkage/i.test(message)) {
      return `${policies.corkage} We're happy to open your special bottles! Our sommelier can also recommend perfect pairings from our extensive Italian wine list.`;
    }
    
    return "I'd be happy to help with any specific questions about our policies. We strive to accommodate all our guests' needs. What would you like to know about dining with us?";
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

  handleSpecialsInquiry() {
    const specials = this.knowledgeBase.restaurant.menu.specials;
    return `Our current specials include: ${specials.daily}. ${specials.happyHour} ${specials.weekend} Would you like to make a reservation to try them?`;
  }

  handleDietaryInquiry(message) {
    const menu = this.knowledgeBase.restaurant.menu;
    
    if (/vegetarian/i.test(message)) {
      const vegItems = menu.mains.filter(item => item.dietary && item.dietary.includes('vegetarian')).map(item => item.name);
      return `We have several vegetarian options including ${vegItems.join(', ')}, plus vegetarian appetizers and desserts. All clearly marked on our menu!`;
    }
    
    if (/vegan/i.test(message)) {
      return "We can make our Margherita Pizza and Eggplant Parmigiana vegan upon request. We also have dairy-free gelato and several naturally vegan dishes. Please let us know when making your reservation so our chef can prepare special options.";
    }
    
    if (/gluten/i.test(message)) {
      const gfItems = menu.mains.filter(item => item.dietary && item.dietary.includes('gluten-free')).map(item => item.name);
      return `Yes! We offer gluten-free options including ${gfItems.join(', ')}, plus gluten-free pasta and pizza. Our kitchen follows strict protocols to prevent cross-contamination.`;
    }
    
    if (/allerg/i.test(message)) {
      return "We take allergies very seriously. Please inform us of any allergies when making your reservation. Our chef can modify most dishes to accommodate common allergies including nuts, shellfish, dairy, and eggs.";
    }
    
    return "We accommodate various dietary needs including vegetarian, vegan, gluten-free, and allergy restrictions. Please let us know your requirements when booking so we can ensure a perfect dining experience.";
  }

  handleCompliment() {
    const responses = [
      "Thank you so much! We're thrilled you think so. Our team works hard to provide an exceptional dining experience. Would you like to make another reservation?",
      "That means the world to us! We'd love to have you dine with us again. Can I help you book your next visit?",
      "We're so happy to hear that! Your feedback motivates our entire team. What can I help you with today?"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  handleComplaint() {
    const responses = [
      "I sincerely apologize that we didn't meet your expectations. Your feedback is very important to us. Could you please provide more details so we can address this properly? We'd also like to invite you back for a complimentary meal to make things right.",
      "I'm truly sorry to hear about your experience. This isn't the standard we strive for. Please let me know more details, and I'll ensure our manager follows up with you personally. We want to make this right.",
      "Thank you for bringing this to our attention. We take all feedback seriously and use it to improve. Could you share more details? We'd love the opportunity to provide you with the exceptional service you deserve on a future visit."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  handleGeneral(message) {
    // Enhanced pattern matching for common questions
    const restaurant = this.knowledgeBase.restaurant;
    
    // WiFi questions
    if (/wifi|internet|password/i.test(message)) {
      return `${restaurant.features.wifi}. The password is "MariosBistro2024" - feel free to stay connected during your meal!`;
    }
    
    // Atmosphere/ambiance questions
    if (/atmosphere|ambiance|vibe|romantic|loud|quiet/i.test(message)) {
      return `${restaurant.features.atmosphere}. We're perfect for both romantic dinners and family celebrations. Would you like to book a table?`;
    }
    
    // Chef/cooking questions
    if (/chef|cook|kitchen|authentic/i.test(message)) {
      return `${restaurant.staff.chefInfo}. We use traditional cooking methods and import many of our ingredients directly from Italy. Established in ${restaurant.established}, we're committed to authentic Italian cuisine.`;
    }
    
    // Special services
    if (/catering|private|event|party|class/i.test(message)) {
      const services = restaurant.features.specialServices.join(', ');
      return `We offer ${services}. ${restaurant.policies.privateEvents} Please call us to discuss your special event needs!`;
    }
    
    // Check against common questions database
    for (const [question, answer] of Object.entries(this.knowledgeBase.commonQuestions)) {
      if (message.includes(question)) {
        return answer;
      }
    }
    
    // Enhanced default response with more context
    return `I'd be happy to help! I can assist with reservations, menu information, dietary accommodations, special events, or answer questions about our restaurant. We've been serving authentic Italian cuisine since ${restaurant.established}. What would you like to know?`;
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
    
    // Emit booking event for SMS system
    const bookingEvent = new CustomEvent('bookingCreated', {
      detail: {
        ...booking,
        restaurant_name: this.knowledgeBase.restaurant.name
      }
    });
    document.dispatchEvent(bookingEvent);
    
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