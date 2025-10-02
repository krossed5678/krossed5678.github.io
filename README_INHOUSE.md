# In-House Voice Processing System

## 🏠 Complete Self-Contained Restaurant AI

This system now operates **completely independently** without any external API dependencies! 

### ✨ What's New

- **🧠 Local NLP Engine**: Restaurant-specific conversation processing
- **🎤 Browser Speech Recognition**: No external transcription services needed  
- **🗣️ Browser Text-to-Speech**: Natural voice responses
- **📝 Smart Booking Logic**: Pattern matching for names, dates, times, party size
- **💾 LocalStorage Persistence**: All data stored client-side

### 🚀 Features

#### In-House Voice Processing
- Listens for booking requests using browser speech recognition
- Processes conversations locally with pattern matching and NLP
- Speaks responses using browser text-to-speech
- Creates bookings automatically when all information is collected

#### Smart Conversation Flow
- Greets customers naturally
- Asks for missing information (name, party size, date, time, phone)
- Handles inquiries about hours, menu, location, policies
- Confirms reservations with all details

#### Zero External Dependencies
- No Mistral API calls required
- No OpenAI dependencies  
- No external transcription services
- Works completely offline (except for initial page load)

### 🎯 How It Works

1. **Voice Input**: Browser Speech Recognition captures customer speech
2. **Local Processing**: Custom NLP engine extracts booking information
3. **Conversation Management**: State machine handles booking flow
4. **Voice Response**: Browser Text-to-Speech provides natural responses
5. **Booking Creation**: Complete reservations saved to localStorage and UI

### 🧩 Architecture

```
┌─────────────────────────────────────────┐
│           In-House System               │
├─────────────────────────────────────────┤
│ InHouseVoiceConversation                │
│ ├── Browser Speech Recognition          │ 
│ ├── Local Conversation Engine           │
│ └── Browser Text-to-Speech             │
├─────────────────────────────────────────┤
│ LocalConversationEngine                 │
│ ├── Intent Classification               │
│ ├── Entity Extraction                   │
│ ├── Response Generation                 │
│ └── Booking Management                  │
├─────────────────────────────────────────┤  
│ InHouseVoiceProcessor                   │
│ ├── Pattern Recognition                 │
│ ├── Time/Date Processing               │
│ └── Context Management                  │
└─────────────────────────────────────────┘
```

### 📱 Browser Support

- **Chrome**: Full support (Speech Recognition + TTS)
- **Edge**: Full support (Speech Recognition + TTS)  
- **Firefox**: Text-to-Speech only (no Speech Recognition)
- **Safari**: Limited support

### 🧪 Testing

Use the **"Test In-House"** button to:
1. Test browser speech recognition availability
2. Test local conversation engine with sample input
3. Verify booking creation workflow
4. Check text-to-speech functionality

### 📊 Conversation Patterns

The system recognizes:
- **Names**: "My name is...", "Under Smith", "For John Doe"
- **Party Size**: "Table for 4", "Party of 6", "Just 2 people"  
- **Dates**: "Today", "Tomorrow", "Friday", "Next Tuesday"
- **Times**: "7 PM", "Seven o'clock", "Dinner time", "Around 6:30"
- **Phones**: "(555) 123-4567", "Call me at 555-1234"

### 🎭 Sample Conversations

**Complete Booking in One Request:**
> "Hi, I'd like to make a reservation for John Smith, party of 4, tonight at 7 PM. My number is 555-123-4567."

**Interactive Booking Flow:**
> User: "I need a table"
> AI: "I'd be happy to make that reservation. What name should I put it under?"
> User: "Sarah Johnson" 
> AI: "Perfect! How many people will be dining with us?"
> User: "Six people"
> AI: "Excellent! What time would you prefer?"

### 💡 Benefits

- **🔒 Privacy**: No data sent to external services
- **💰 Cost**: Zero API costs 
- **⚡ Speed**: Instant processing, no network delays
- **🌐 Reliability**: Works even when external APIs are down
- **🎨 Customization**: Easy to modify for specific restaurant needs

### 🔧 Customization

Edit `js/local-conversation-engine.js` to:
- Add your restaurant's specific information
- Modify conversation patterns and responses  
- Update menu items and policies
- Add custom booking rules

### 🆚 Fallback System

The system includes fallback to external APIs:
- If in-house processors fail to load, falls back to Mistral API
- Toggle between modes using `restaurantApp.toggleProcessingMode()`
- Check current mode with `restaurantApp.getStatus()`

---

**🎉 Your restaurant now has a completely self-contained AI booking system!**