// Restaurant Configuration Loader
// Loads restaurant-specific configuration from JSON files

class RestaurantConfigLoader {
  constructor() {
    this.config = null;
    this.isLoaded = false;
  }

  // Load configuration from JSON file
  async loadConfig(configPath = 'config/restaurant-config.json') {
    try {
      console.log('📁 Loading restaurant configuration...');
      
      const response = await fetch(configPath);
      if (!response.ok) {
        throw new Error(`Failed to load config: ${response.status} ${response.statusText}`);
      }
      
      this.config = await response.json();
      this.isLoaded = true;
      
      console.log(`✅ Configuration loaded for: ${this.config.restaurant.basic_info.name}`);
      console.log(`🏪 Cuisine: ${this.config.restaurant.basic_info.cuisine}`);
      console.log(`📍 Location: ${this.config.restaurant.contact.address.city}`);
      
      return this.config;
      
    } catch (error) {
      console.error('❌ Failed to load restaurant configuration:', error);
      console.log('🔄 Falling back to default configuration...');
      
      // Return minimal default config
      this.config = this.getDefaultConfig();
      this.isLoaded = true;
      return this.config;
    }
  }

  // Get default fallback configuration
  getDefaultConfig() {
    return {
      restaurant: {
        basic_info: {
          name: "Restaurant",
          description: "A fine dining establishment",
          cuisine: "International",
          price_range: "$$"
        },
        hours: {
          monday: "11:00 AM - 10:00 PM",
          tuesday: "11:00 AM - 10:00 PM",
          wednesday: "11:00 AM - 10:00 PM",
          thursday: "11:00 AM - 10:00 PM",
          friday: "11:00 AM - 11:00 PM",
          saturday: "11:00 AM - 11:00 PM",
          sunday: "11:00 AM - 10:00 PM"
        },
        contact: {
          phone: "(555) 000-0000",
          email: "info@restaurant.com"
        },
        menu: {
          appetizers: [],
          mains: [],
          desserts: [],
          beverages: {}
        },
        policies: {},
        features: {}
      },
      conversation_settings: {
        brand_voice: {
          tone: "professional, friendly",
          personality: "helpful assistant"
        }
      }
    };
  }

  // Transform config for LocalConversationEngine compatibility
  transformForConversationEngine() {
    if (!this.isLoaded || !this.config) {
      throw new Error('Configuration not loaded');
    }

    const restaurant = this.config.restaurant;
    
    return {
      restaurant: {
        name: restaurant.basic_info.name,
        description: restaurant.basic_info.description,
        established: restaurant.basic_info.established,
        hours: restaurant.hours,
        cuisine: restaurant.basic_info.cuisine,
        priceRange: restaurant.basic_info.price_range,
        capacity: restaurant.basic_info.capacity,
        avgDiningTime: restaurant.basic_info.avg_dining_time_minutes,
        reservationWindow: restaurant.basic_info.reservation_window_days,
        walkInsWelcome: restaurant.basic_info.walk_ins_welcome,
        
        menu: this.transformMenuData(),
        policies: this.transformPolicyData(),
        features: this.transformFeatureData(),
        staff: restaurant.staff,
        contact: restaurant.contact
      },
      
      commonQuestions: this.generateCommonQuestions(),
      brandVoice: this.config.conversation_settings.brand_voice,
      businessRules: this.config.business_rules
    };
  }

  // Transform menu data to conversation engine format
  transformMenuData() {
    const menu = this.config.restaurant.menu;
    
    return {
      appetizers: menu.appetizers || [],
      mains: menu.mains || [],
      desserts: menu.desserts || [],
      beverages: menu.beverages || {},
      specials: menu.specials || {}
    };
  }

  // Transform policy data
  transformPolicyData() {
    const policies = this.config.restaurant.policies;
    
    return {
      reservationPolicy: policies.reservations?.policy || "Reservations recommended",
      cancellationPolicy: policies.cancellation?.policy || "24-hour notice preferred",
      largeParties: policies.reservations?.large_parties || "Large parties welcome",
      dressCode: policies.dress_code?.policy || "Smart casual",
      children: policies.children?.policy || "Children welcome",
      pets: policies.pets?.policy || "Service animals welcome",
      accessibility: policies.accessibility?.policy || "Wheelchair accessible",
      payment: policies.payment?.accepted || "All major credit cards accepted",
      corkage: policies.alcohol?.corkage || "Corkage fee applies",
      privateEvents: policies.reservations?.large_parties || "Private dining available"
    };
  }

  // Transform feature data
  transformFeatureData() {
    const features = this.config.restaurant.features;
    
    return {
      wifi: features.wifi?.description || "WiFi available",
      parking: `${features.parking?.valet || ''} ${features.parking?.street || ''}`.trim(),
      atmosphere: features.atmosphere?.description || "Welcoming atmosphere",
      specialServices: features.special_services || []
    };
  }

  // Generate common questions based on config
  generateCommonQuestions() {
    const restaurant = this.config.restaurant;
    const questions = {};
    
    // Hours questions
    questions["what are your hours"] = this.generateHoursResponse();
    questions["when are you open"] = this.generateHoursResponse();
    
    // Menu questions  
    questions["what type of food"] = `We serve ${restaurant.basic_info.cuisine} cuisine. ${restaurant.basic_info.description}`;
    
    // Reservation questions
    questions["do you take reservations"] = restaurant.policies.reservations?.policy || "Yes, we accept reservations.";
    
    // Parking questions
    if (restaurant.features.parking) {
      questions["do you have parking"] = `${restaurant.features.parking.valet || ''} ${restaurant.features.parking.street || ''}`.trim();
    }
    
    // WiFi questions
    if (restaurant.features.wifi?.available) {
      questions["do you have wifi"] = restaurant.features.wifi.description;
    }
    
    // Kid-friendly questions
    if (restaurant.policies.children) {
      questions["are you kid friendly"] = restaurant.policies.children.policy;
    }
    
    return questions;
  }

  // Generate hours response
  generateHoursResponse() {
    const hours = this.config.restaurant.hours;
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    let response = "Our hours are: ";
    const uniqueHours = {};
    
    // Group days with same hours
    days.forEach(day => {
      const dayHours = hours[day];
      if (!uniqueHours[dayHours]) {
        uniqueHours[dayHours] = [];
      }
      uniqueHours[dayHours].push(day);
    });
    
    // Format grouped hours
    const hourGroups = Object.entries(uniqueHours).map(([time, dayList]) => {
      if (dayList.length === 7) {
        return `Daily ${time}`;
      } else if (dayList.length > 1) {
        const firstDay = dayList[0].charAt(0).toUpperCase() + dayList[0].slice(1);
        const lastDay = dayList[dayList.length - 1].charAt(0).toUpperCase() + dayList[dayList.length - 1].slice(1);
        return `${firstDay}-${lastDay} ${time}`;
      } else {
        const day = dayList[0].charAt(0).toUpperCase() + dayList[0].slice(1);
        return `${day} ${time}`;
      }
    });
    
    return response + hourGroups.join(', ') + ".";
  }

  // Get menu items by dietary restriction
  getMenuByDietary(dietary) {
    if (!this.config) return [];
    
    const allItems = [
      ...(this.config.restaurant.menu.appetizers || []),
      ...(this.config.restaurant.menu.mains || []),
      ...(this.config.restaurant.menu.desserts || [])
    ];
    
    return allItems.filter(item => 
      item.dietary_tags && item.dietary_tags.includes(dietary)
    );
  }

  // Get popular items
  getPopularItems() {
    if (!this.config) return [];
    
    const allItems = [
      ...(this.config.restaurant.menu.appetizers || []),
      ...(this.config.restaurant.menu.mains || []), 
      ...(this.config.restaurant.menu.desserts || [])
    ];
    
    return allItems.filter(item => item.popular === true);
  }

  // Get chef recommendations
  getChefRecommendations() {
    if (!this.config) return [];
    
    const allItems = [
      ...(this.config.restaurant.menu.appetizers || []),
      ...(this.config.restaurant.menu.mains || []),
      ...(this.config.restaurant.menu.desserts || [])
    ];
    
    return allItems.filter(item => item.chef_recommendation === true);
  }

  // Customize responses with restaurant name and branding
  customizeResponse(template, additionalData = {}) {
    if (!this.config) return template;
    
    const restaurant = this.config.restaurant;
    const replacements = {
      '{restaurant_name}': restaurant.basic_info.name,
      '{cuisine_type}': restaurant.basic_info.cuisine,
      '{chef_name}': restaurant.staff.executive_chef?.name || 'our chef',
      '{price_range}': restaurant.basic_info.price_range,
      '{established}': restaurant.basic_info.established,
      ...additionalData
    };
    
    let customized = template;
    Object.entries(replacements).forEach(([placeholder, value]) => {
      customized = customized.replace(new RegExp(placeholder, 'g'), value);
    });
    
    return customized;
  }

  // Export configuration for other restaurants
  exportConfig() {
    return JSON.stringify(this.config, null, 2);
  }

  // Validate configuration structure
  validateConfig(config) {
    const required = [
      'restaurant.basic_info.name',
      'restaurant.hours',
      'restaurant.contact',
      'restaurant.menu'
    ];
    
    const errors = [];
    
    required.forEach(path => {
      const keys = path.split('.');
      let current = config;
      
      for (const key of keys) {
        if (!current || typeof current !== 'object' || !(key in current)) {
          errors.push(`Missing required field: ${path}`);
          break;
        }
        current = current[key];
      }
    });
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Get current configuration
  getConfig() {
    return this.config;
  }

  // Check if config is loaded
  isConfigLoaded() {
    return this.isLoaded;
  }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.RestaurantConfigLoader = RestaurantConfigLoader;
}