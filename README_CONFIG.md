# Restaurant Configuration Guide

## 🏪 Easy Customization for Any Restaurant

The AI booking system now uses **JSON-based configuration**, making it simple for any restaurant to customize the system for their specific needs.

## 📋 Quick Setup

### 1. **Use Pre-Built Templates**
```javascript
// In browser console
downloadSampleConfig('italian')  // Download Italian restaurant config
downloadSampleConfig('mexican')  // Download Mexican restaurant config  
downloadSampleConfig('french')   // Download French restaurant config
downloadSampleConfig('american') // Download American restaurant config
```

### 2. **Customize Your Configuration**
Edit the `config/restaurant-config.json` file with your restaurant's information:

```json
{
  "restaurant": {
    "basic_info": {
      "name": "Your Restaurant Name",
      "description": "Your restaurant description",
      "cuisine": "Your cuisine type",
      "price_range": "$ | $$ | $$$ | $$$$"
    }
  }
}
```

### 3. **Deploy and Test**
- Upload your custom config file
- Reload the page
- The AI will automatically use your restaurant's information!

## 🔧 Configuration Sections

### **Basic Information**
```json
"basic_info": {
  "name": "Mario's Italian Bistro",
  "description": "Authentic Italian cuisine in elegant atmosphere",
  "established": "1985",
  "cuisine": "Italian", 
  "price_range": "$$-$$$",
  "capacity": 80,
  "avg_dining_time_minutes": 90,
  "reservation_window_days": 60,
  "walk_ins_welcome": true
}
```

### **Operating Hours**
```json
"hours": {
  "monday": "11:00 AM - 10:00 PM",
  "tuesday": "11:00 AM - 10:00 PM",
  "wednesday": "11:00 AM - 10:00 PM",
  "thursday": "11:00 AM - 10:00 PM", 
  "friday": "11:00 AM - 11:00 PM",
  "saturday": "10:00 AM - 11:00 PM",
  "sunday": "10:00 AM - 10:00 PM"
}
```

### **Contact Information**
```json
"contact": {
  "phone": "(555) 123-4567",
  "email": "info@restaurant.com",
  "website": "www.restaurant.com",
  "address": {
    "street": "123 Main Street",
    "city": "Your City",
    "state": "ST",
    "zip": "12345"
  }
}
```

### **Menu Items**
```json
"menu": {
  "appetizers": [
    {
      "name": "Bruschetta Trio",
      "price": "$12", 
      "description": "Toasted bread with fresh toppings",
      "dietary_tags": ["vegetarian"],
      "popular": true,
      "chef_recommendation": false
    }
  ],
  "mains": [
    {
      "name": "Signature Pasta",
      "price": "$19",
      "description": "Our chef's special pasta creation",
      "dietary_tags": ["gluten-free available"],
      "popular": true,
      "chef_recommendation": true
    }
  ]
}
```

### **Restaurant Policies**
```json
"policies": {
  "reservations": {
    "policy": "Reservations recommended for parties of 4+",
    "advance_booking": "Up to 60 days in advance"
  },
  "cancellation": {
    "policy": "24-hour notice preferred"
  },
  "dress_code": {
    "policy": "Smart casual",
    "restrictions": "No shorts or flip-flops for dinner"
  },
  "children": {
    "policy": "Children welcome with kids menu available"
  },
  "accessibility": {
    "policy": "Fully wheelchair accessible"
  }
}
```

### **Brand Voice & Personality**
```json
"conversation_settings": {
  "brand_voice": {
    "tone": "warm, professional, knowledgeable",
    "personality": "friendly Italian hospitality"
  },
  "default_responses": {
    "greeting": [
      "Buongiorno! Welcome to {restaurant_name}!",
      "Hello! How can I assist you today?"
    ]
  }
}
```

## 🎯 Dietary Tags Available
- `"vegetarian"`
- `"vegan"` 
- `"gluten-free"`
- `"dairy-free"`
- `"keto"`
- `"halal"`
- `"kosher"`
- `"nut-free"`

## 🏷️ Price Range Guide
- `"$"` - Budget-friendly ($5-15 per entrée)
- `"$$"` - Moderate ($15-25 per entrée)  
- `"$$$"` - Upscale ($25-40 per entrée)
- `"$$$$"` - Fine dining ($40+ per entrée)

## 🎨 Cuisine Types
- Italian, Mexican, French, American, Chinese, Japanese, Thai, Indian, Mediterranean, Steakhouse, Seafood, Vegetarian, Farm-to-Table, Fusion, etc.

## 🚀 Quick Start Examples

### **Italian Restaurant**
```json
{
  "restaurant": {
    "basic_info": {
      "name": "Nonna's Kitchen",
      "cuisine": "Italian",
      "description": "Family recipes passed down for generations"
    },
    "conversation_settings": {
      "brand_voice": {
        "tone": "warm, family-oriented, authentic",
        "personality": "Italian grandmother's hospitality"
      }
    }
  }
}
```

### **Mexican Cantina**  
```json
{
  "restaurant": {
    "basic_info": {
      "name": "Fiesta Mexicana",
      "cuisine": "Mexican", 
      "description": "Vibrant flavors and festive atmosphere"
    },
    "conversation_settings": {
      "brand_voice": {
        "tone": "festive, energetic, welcoming",
        "personality": "Mexican celebration and warmth"
      }
    }
  }
}
```

### **Fine Dining French**
```json
{
  "restaurant": {
    "basic_info": {
      "name": "Le Petit Château",
      "cuisine": "French",
      "description": "Exquisite French cuisine with modern techniques"
    },
    "conversation_settings": {
      "brand_voice": {
        "tone": "elegant, sophisticated, refined", 
        "personality": "French culinary artistry"
      }
    }
  }
}
```

## 🛠️ Testing Your Configuration

### **Browser Console Commands**
```javascript
// Test your configuration
restaurantApp.getStatus()

// Validate configuration
configLoader.validateConfig(configLoader.getConfig())

// Test conversation with your settings
restaurantApp.processTextConversation("Hello, I'd like to make a reservation")

// Download sample configurations
downloadSampleConfig('italian')
```

### **Sample Conversations to Test**
1. "Hi, what kind of food do you serve?"
2. "I'd like a table for 4 tonight at 7 PM"
3. "Do you have vegetarian options?"
4. "What are your hours?"
5. "Can I make a reservation for my anniversary?"

## 📦 Distribution Ready

### **For Restaurant Owners**
1. Copy the system files
2. Replace `config/restaurant-config.json` with your restaurant's info
3. Upload to your web server
4. Your custom AI booking system is ready!

### **For Developers**
1. Clone the system
2. Use `RestaurantConfigGenerator` to create configurations
3. Customize conversation patterns if needed
4. Deploy for multiple restaurants

## 🎯 Benefits

### **Easy Customization**
- No code changes required
- Simple JSON editing
- Visual configuration tools

### **Brand Consistency**  
- Custom greetings and responses
- Restaurant-specific language and tone
- Cuisine-appropriate terminology

### **Complete Information**
- Full menu with prices and descriptions
- Accurate policies and hours
- Contact and location details

### **Scalable Distribution**
- One codebase, multiple restaurants
- Configuration templates for common types
- Quick deployment and updates

---

**🎉 Your restaurant's AI booking system can now be completely customized with just JSON configuration files!**