// Restaurant Configuration Generator
// Helps create custom restaurant configurations

class RestaurantConfigGenerator {
  constructor() {
    this.template = this.getConfigTemplate();
  }

  // Generate a basic configuration template
  getConfigTemplate() {
    return {
      restaurant: {
        basic_info: {
          name: "[RESTAURANT_NAME]",
          description: "[RESTAURANT_DESCRIPTION]",
          established: "[YEAR_ESTABLISHED]",
          cuisine: "[CUISINE_TYPE]",
          price_range: "[$ | $$ | $$$ | $$$$]",
          capacity: "[NUMBER]",
          avg_dining_time_minutes: 90,
          reservation_window_days: 60,
          walk_ins_welcome: true
        },
        hours: {
          monday: "[HH:MM AM/PM - HH:MM AM/PM]",
          tuesday: "[HH:MM AM/PM - HH:MM AM/PM]",
          wednesday: "[HH:MM AM/PM - HH:MM AM/PM]",
          thursday: "[HH:MM AM/PM - HH:MM AM/PM]", 
          friday: "[HH:MM AM/PM - HH:MM AM/PM]",
          saturday: "[HH:MM AM/PM - HH:MM AM/PM]",
          sunday: "[HH:MM AM/PM - HH:MM AM/PM]"
        },
        contact: {
          phone: "[PHONE_NUMBER]",
          email: "[EMAIL_ADDRESS]",
          website: "[WEBSITE_URL]",
          address: {
            street: "[STREET_ADDRESS]",
            city: "[CITY]",
            state: "[STATE]",
            zip: "[ZIP_CODE]"
          }
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
          tone: "warm, professional",
          personality: "friendly hospitality"
        }
      }
    };
  }

  // Generate menu item template
  getMenuItemTemplate() {
    return {
      name: "[DISH_NAME]",
      price: "$[PRICE]",
      description: "[DISH_DESCRIPTION]",
      dietary_tags: [], // ["vegetarian", "vegan", "gluten-free", "dairy-free", etc.]
      popular: false,
      chef_recommendation: false
    };
  }

  // Generate configuration for different restaurant types
  generateQuickConfig(restaurantType) {
    const configs = {
      italian: {
        cuisine: "Italian",
        sample_items: [
          {name: "Margherita Pizza", price: "$16", description: "San Marzano tomatoes, fresh mozzarella, basil", dietary_tags: ["vegetarian"]},
          {name: "Spaghetti Carbonara", price: "$19", description: "Traditional Roman pasta with pancetta and egg"},
          {name: "Tiramisu", price: "$8", description: "Classic mascarpone dessert", dietary_tags: ["vegetarian"]}
        ],
        brand_voice: {
          tone: "warm, authentic, passionate about Italian culture",
          personality: "Italian hospitality with cultural touches"
        }
      },
      
      mexican: {
        cuisine: "Mexican",
        sample_items: [
          {name: "Guacamole", price: "$9", description: "Fresh avocado with lime and cilantro", dietary_tags: ["vegan", "gluten-free"]},
          {name: "Carne Asada", price: "$22", description: "Grilled steak with peppers and onions"},
          {name: "Churros", price: "$7", description: "Fried dough with cinnamon sugar", dietary_tags: ["vegetarian"]}
        ],
        brand_voice: {
          tone: "vibrant, festive, family-oriented",
          personality: "Mexican warmth and celebration"
        }
      },
      
      french: {
        cuisine: "French",
        sample_items: [
          {name: "French Onion Soup", price: "$12", description: "Classic soup with Gruyère cheese"},
          {name: "Coq au Vin", price: "$28", description: "Chicken braised in red wine with mushrooms"},
          {name: "Crème Brûlée", price: "$10", description: "Vanilla custard with caramelized sugar", dietary_tags: ["vegetarian"]}
        ],
        brand_voice: {
          tone: "elegant, refined, sophisticated",
          personality: "French culinary excellence and attention to detail"
        }
      },
      
      american: {
        cuisine: "American",
        sample_items: [
          {name: "Buffalo Wings", price: "$12", description: "Spicy chicken wings with blue cheese dip"},
          {name: "Classic Burger", price: "$18", description: "Beef patty with lettuce, tomato, and fries"},
          {name: "Apple Pie", price: "$8", description: "Traditional apple pie with vanilla ice cream", dietary_tags: ["vegetarian"]}
        ],
        brand_voice: {
          tone: "friendly, casual, welcoming",
          personality: "Classic American hospitality"
        }
      },
      
      asian: {
        cuisine: "Asian Fusion",
        sample_items: [
          {name: "Vegetable Spring Rolls", price: "$8", description: "Fresh vegetables in rice paper", dietary_tags: ["vegetarian", "vegan"]},
          {name: "Pad Thai", price: "$16", description: "Stir-fried rice noodles with tamarind sauce"},
          {name: "Mango Sticky Rice", price: "$7", description: "Sweet coconut rice with fresh mango", dietary_tags: ["vegan", "gluten-free"]}
        ],
        brand_voice: {
          tone: "harmonious, mindful, balanced",
          personality: "Asian hospitality and mindfulness"
        }
      }
    };

    return configs[restaurantType.toLowerCase()] || configs.american;
  }

  // Create a complete configuration
  createConfiguration(basicInfo, menuItems = [], customSettings = {}) {
    const config = JSON.parse(JSON.stringify(this.template)); // Deep clone
    
    // Fill in basic information
    Object.assign(config.restaurant.basic_info, basicInfo);
    
    // Add menu items
    if (menuItems.length > 0) {
      menuItems.forEach(item => {
        const category = item.category || 'mains';
        if (!config.restaurant.menu[category]) {
          config.restaurant.menu[category] = [];
        }
        config.restaurant.menu[category].push({
          name: item.name,
          price: item.price,
          description: item.description,
          dietary_tags: item.dietary_tags || [],
          popular: item.popular || false,
          chef_recommendation: item.chef_recommendation || false
        });
      });
    }
    
    // Apply custom settings
    if (customSettings.brand_voice) {
      Object.assign(config.conversation_settings.brand_voice, customSettings.brand_voice);
    }
    
    return config;
  }

  // Generate sample configurations for testing
  generateSampleConfigs() {
    return {
      "italian-bistro": this.createItalianBistroConfig(),
      "mexican-cantina": this.createMexicanCantinaConfig(),
      "french-cafe": this.createFrenchCafeConfig(),
      "american-diner": this.createAmericanDinerConfig()
    };
  }

  createItalianBistroConfig() {
    const quickConfig = this.generateQuickConfig('italian');
    
    return this.createConfiguration({
      name: "Bella Vista Italian Bistro",
      description: "Authentic Italian cuisine in a warm, family atmosphere",
      established: "1995",
      cuisine: "Italian",
      price_range: "$$-$$$",
      capacity: 65
    }, quickConfig.sample_items.map(item => ({...item, category: 'mains'})), {
      brand_voice: quickConfig.brand_voice
    });
  }

  createMexicanCantinaConfig() {
    const quickConfig = this.generateQuickConfig('mexican');
    
    return this.createConfiguration({
      name: "El Corazón Cantina",
      description: "Vibrant Mexican flavors and festive atmosphere",
      established: "2010", 
      cuisine: "Mexican",
      price_range: "$-$$",
      capacity: 80
    }, quickConfig.sample_items.map(item => ({...item, category: 'mains'})), {
      brand_voice: quickConfig.brand_voice
    });
  }

  createFrenchCafeConfig() {
    const quickConfig = this.generateQuickConfig('french');
    
    return this.createConfiguration({
      name: "Café de Paris",
      description: "Elegant French dining with classic techniques",
      established: "1988",
      cuisine: "French",
      price_range: "$$$-$$$$", 
      capacity: 45
    }, quickConfig.sample_items.map(item => ({...item, category: 'mains'})), {
      brand_voice: quickConfig.brand_voice
    });
  }

  createAmericanDinerConfig() {
    const quickConfig = this.generateQuickConfig('american');
    
    return this.createConfiguration({
      name: "Route 66 Diner",
      description: "Classic American comfort food in a retro setting",
      established: "2005",
      cuisine: "American",
      price_range: "$-$$",
      capacity: 90
    }, quickConfig.sample_items.map(item => ({...item, category: 'mains'})), {
      brand_voice: quickConfig.brand_voice
    });
  }

  // Validate and export configuration
  exportConfiguration(config, filename = 'restaurant-config.json') {
    const validation = this.validateConfiguration(config);
    
    if (!validation.valid) {
      console.warn('⚠️ Configuration has issues:', validation.issues);
    }
    
    const configString = JSON.stringify(config, null, 2);
    
    // Create download link (for browser use)
    if (typeof window !== 'undefined') {
      const blob = new Blob([configString], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      
      URL.revokeObjectURL(url);
    }
    
    return configString;
  }

  // Validate configuration completeness
  validateConfiguration(config) {
    const issues = [];
    const required = [
      ['restaurant.basic_info.name', 'Restaurant name'],
      ['restaurant.basic_info.cuisine', 'Cuisine type'],
      ['restaurant.contact.phone', 'Phone number'],
      ['restaurant.hours', 'Operating hours']
    ];
    
    required.forEach(([path, description]) => {
      if (!this.getNestedValue(config, path)) {
        issues.push(`Missing ${description} (${path})`);
      }
    });
    
    // Check for placeholder values
    const stringifiedConfig = JSON.stringify(config);
    if (stringifiedConfig.includes('[') && stringifiedConfig.includes(']')) {
      issues.push('Contains placeholder values that need to be replaced');
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current && current[key], obj);
  }
}

// Export for use
if (typeof window !== 'undefined') {
  window.RestaurantConfigGenerator = RestaurantConfigGenerator;
}

// Console helper functions
if (typeof window !== 'undefined') {
  window.generateRestaurantConfig = (type = 'italian') => {
    const generator = new RestaurantConfigGenerator();
    const config = generator.generateQuickConfig(type);
    console.log(`Generated ${type} restaurant configuration:`, config);
    return config;
  };
  
  window.downloadSampleConfig = (type = 'italian') => {
    const generator = new RestaurantConfigGenerator();
    const samples = generator.generateSampleConfigs();
    const configKey = `${type}-${type === 'italian' ? 'bistro' : type === 'mexican' ? 'cantina' : type === 'french' ? 'cafe' : 'diner'}`;
    
    if (samples[configKey]) {
      generator.exportConfiguration(samples[configKey], `${configKey}-config.json`);
      console.log(`Downloaded ${configKey} configuration file`);
    } else {
      console.log('Available types: italian, mexican, french, american');
    }
  };
}