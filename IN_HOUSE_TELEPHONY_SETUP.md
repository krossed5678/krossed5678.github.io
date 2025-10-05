# 📞 Complete In-House Telephony Setup Guide

## 🏆 **Zero External Dependencies Phone System**

This guide shows you how to set up a **complete in-house telephony infrastructure** with **no external services** like Twilio, requiring only your own servers.

---

## 🎯 **Architecture Overview**

```
📞 Customer Calls
    ↓
🏢 Your VoIP Provider (or DID provider)
    ↓
🖥️ Your Asterisk/FreePBX Server (Self-hosted)
    ↓
🌐 WebRTC/SIP Connection
    ↓
🤖 Restaurant AI System (Your web app)
    ↓
💬 AI Conversation & Booking Processing
```

---

## 🛠️ **Components Included**

### **✅ 1. WebRTC Phone System**
- Browser-based calling interface
- DTMF tone generation
- Call recording capabilities
- Visual dial pad and call controls
- **File**: `js/in-house-phone-system.js`

### **✅ 2. SIP Client Integration**
- Connects to Asterisk/FreePBX servers
- Handles incoming/outgoing calls
- Auto-answer for AI integration
- **File**: `js/in-house-sip-client.js`

### **✅ 3. AI Integration**
- Automatic call routing to restaurant AI
- Speech-to-text processing
- Text-to-speech responses
- Call analytics and logging

---

## 🏗️ **Step 1: Set Up Your Telephony Server**

### **Option A: Asterisk (Advanced Users)**

```bash
# Ubuntu/Debian installation
sudo apt update
sudo apt install asterisk asterisk-modules

# Configure Asterisk
sudo nano /etc/asterisk/http.conf
```

**http.conf configuration:**
```ini
[general]
enabled=yes
bindaddr=0.0.0.0
bindport=8088
tlsenable=yes
tlsbindaddr=0.0.0.0:8089
tlscertfile=/path/to/your/cert.pem
tlsprivatekey=/path/to/your/key.pem
```

**pjsip.conf configuration:**
```ini
[transport-wss]
type=transport
protocol=wss
bind=0.0.0.0:8089
cert_file=/path/to/your/cert.pem
priv_key_file=/path/to/your/key.pem
method=tlsv1_2

[restaurant-ai]
type=endpoint
context=restaurant
disallow=all
allow=ulaw,alaw,opus
webrtc=yes
auth=restaurant-ai-auth
aors=restaurant-ai-aor

[restaurant-ai-auth]
type=auth
auth_type=userpass
password=your_secure_password
username=restaurant-ai

[restaurant-ai-aor]
type=aor
max_contacts=5
```

### **Option B: FreePBX (Recommended for Beginners)**

```bash
# Download FreePBX ISO and install on dedicated server
# Visit: https://www.freepbx.org/downloads/

# After installation, access web GUI at:
# https://your-server-ip/admin
```

**FreePBX Setup Steps:**
1. **Create SIP Extension**: Extensions → Add Extension → Chan_PJSIP
2. **Extension Number**: `restaurant-ai` 
3. **Display Name**: `Restaurant AI System`
4. **Secret**: Generate strong password
5. **Enable WebRTC**: Yes
6. **Context**: `from-internal`

### **Option C: Docker Setup (Quick Start)**

```bash
# Create docker-compose.yml
version: '3.8'
services:
  asterisk:
    image: andrius/asterisk
    ports:
      - "5060:5060/udp"
      - "8088:8088"
      - "8089:8089"
    volumes:
      - ./asterisk-config:/etc/asterisk
    environment:
      - ASTERISK_UID=1000
      - ASTERISK_GID=1000

# Start the container
docker-compose up -d
```

---

## 🌐 **Step 2: Get Phone Numbers (DID Providers)**

### **Recommended In-House Friendly Providers**

#### **1. VoIP.ms (Canada/US)**
- **Why**: SIP trunk friendly, no proprietary APIs
- **Setup**: Configure SIP trunk to your Asterisk server
- **Cost**: ~$0.85/month per DID + usage

#### **2. Flowroute (US)**
- **Why**: Pure SIP trunking, developer-friendly
- **Setup**: Direct SIP connection to your server
- **Cost**: $1.25/month per DID + usage

#### **3. Telnyx (Global)**
- **Why**: SIP-first approach, global coverage
- **Setup**: SIP trunking configuration
- **Cost**: Varies by region

#### **4. Bandwidth (US)**
- **Why**: Wholesale rates, SIP native
- **Setup**: SIP trunk integration
- **Cost**: Volume-based pricing

### **SIP Trunk Configuration**

**In Asterisk (pjsip.conf):**
```ini
[voipms-trunk]
type=registration
transport=transport-udp
outbound_auth=voipms-auth
server_uri=sip:atlanta.voip.ms
client_uri=sip:your_username@atlanta.voip.ms

[voipms-auth]
type=auth
auth_type=userpass
password=your_password
username=your_username

[voipms-endpoint]
type=endpoint
context=from-trunk
disallow=all
allow=ulaw,alaw
from_user=your_username
```

**In FreePBX:**
1. **Connectivity → Trunks → Add SIP (pjSIP) Trunk**
2. **Trunk Name**: `VoIP-Provider`
3. **PJSIP Settings**:
   - **SIP Server**: `atlanta.voip.ms` (or your provider)
   - **Username**: Your account username
   - **Secret**: Your account password
4. **Outbound Routes**: Configure to use this trunk

---

## 🔗 **Step 3: Connect Restaurant AI to Phone System**

### **Add Phone Scripts to Your HTML**

```html
<!-- Add to index.html before closing </body> tag -->
<script src="js/in-house-phone-system.js"></script>
<script src="js/in-house-sip-client.js"></script>
```

### **Configure SIP Client**

```javascript
// Initialize SIP client with your server details
window.InHouseSIPClient.saveConfiguration({
    server: 'wss://your-asterisk-server.com:8089/ws',
    username: 'restaurant-ai',
    password: 'your_secure_password',
    domain: 'your-asterisk-server.com',
    autoAnswer: true  // Auto-answer for AI handling
});
```

### **Test the Connection**

```javascript
// Open browser console and test
window.debugSIP.register();  // Register to SIP server
window.debugSIP.status();    // Check connection status
window.debugSIP.call('+1234567890');  // Test outbound call
```

---

## 🤖 **Step 4: AI Phone Integration**

### **Enhanced Conversation Engine for Phone**

Add to `local-conversation-engine.js`:

```javascript
// Phone-specific intent handling
processPhoneInput(audioText, context = {}) {
    const phoneContext = {
        ...context,
        channel: 'phone',
        callerNumber: context.callerNumber || 'unknown',
        timestamp: new Date().toISOString()
    };

    // Special phone greeting
    if (audioText === 'phone_greeting') {
        return {
            response: `Hello! Thank you for calling ${this.config.restaurant.name}. I'm your AI assistant. How can I help you today?`,
            action: 'greeting',
            context: phoneContext
        };
    }

    // Process normal conversation
    return this.processInput(audioText, phoneContext);
}
```

### **Speech Processing Pipeline**

```javascript
// Add to SIP client for real-time processing
setupSpeechPipeline(session) {
    // 1. Capture audio from SIP session
    const audioStream = session.getAudioStream();
    
    // 2. Speech Recognition
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.continuous = true;
    recognition.interimResults = false;
    
    recognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        
        // 3. Send to AI
        const response = window.LocalConversationEngine.processPhoneInput(transcript, {
            callerNumber: this.extractPhoneNumber(session.remoteIdentity.uri)
        });
        
        // 4. Text-to-Speech Response
        this.speakResponse(response.response);
        
        // 5. Handle actions (booking, etc.)
        if (response.action === 'create_booking') {
            this.handleBookingFromCall(response.booking);
        }
    };
    
    recognition.start();
}
```

---

## 📊 **Step 5: Call Analytics & Management**

### **Call Logging**

```javascript
// Enhanced call tracking
class CallAnalytics {
    logCall(callData) {
        const callRecord = {
            id: Date.now(),
            callerNumber: callData.callerNumber,
            duration: callData.duration,
            transcript: callData.transcript,
            outcome: callData.outcome,  // 'booking', 'inquiry', 'complaint'
            timestamp: new Date().toISOString(),
            aiInteractions: callData.interactions
        };
        
        // Save to local storage
        const calls = window.BrowserCompatibility.safeStorage.get('call-records', []);
        calls.push(callRecord);
        window.BrowserCompatibility.safeStorage.set('call-records', calls);
        
        // Analytics
        window.AnalyticsManager.trackEvent('phone_call_completed', {
            duration: callData.duration,
            outcome: callData.outcome,
            category: 'Phone System'
        });
    }
}
```

### **Call Recording Management**

```javascript
// Automatic call recording with transcription
class CallRecorder {
    startRecording(session) {
        const mediaRecorder = new MediaRecorder(session.audioStream);
        const chunks = [];
        
        mediaRecorder.ondataavailable = (event) => {
            chunks.push(event.data);
        };
        
        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'audio/webm' });
            this.saveRecording(blob, session);
        };
        
        mediaRecorder.start();
        return mediaRecorder;
    }
    
    saveRecording(blob, session) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const callerNumber = this.extractPhoneNumber(session.remoteIdentity.uri);
        const filename = `call-${callerNumber}-${timestamp}.webm`;
        
        // Save to DataManager
        window.DataManager.safeStorage.set(`recording-${timestamp}`, {
            blob: blob,
            filename: filename,
            callerNumber: callerNumber,
            timestamp: new Date().toISOString()
        });
    }
}
```

---

## 🔒 **Security & Privacy**

### **SSL/TLS Configuration**

```bash
# Generate SSL certificate (Let's Encrypt)
sudo apt install certbot
sudo certbot certonly --standalone -d your-asterisk-server.com

# Update Asterisk configuration
sudo nano /etc/asterisk/http.conf
```

### **Firewall Configuration**

```bash
# UFW firewall rules
sudo ufw allow 5060/udp   # SIP signaling
sudo ufw allow 8088/tcp   # HTTP
sudo ufw allow 8089/tcp   # HTTPS/WSS
sudo ufw allow 10000:20000/udp  # RTP media
```

### **Privacy Compliance**

```javascript
// GDPR-compliant call handling
const CallPrivacy = {
    consentGiven: false,
    
    checkConsent() {
        const consent = localStorage.getItem('call-recording-consent');
        return consent === 'true';
    },
    
    requestConsent() {
        // Show consent dialog for call recording
        const consent = confirm('This call may be recorded for quality and training purposes. Do you consent?');
        localStorage.setItem('call-recording-consent', consent.toString());
        return consent;
    },
    
    anonymizeRecording(callData) {
        // Remove PII from call data
        return {
            ...callData,
            callerNumber: 'XXX-XXX-' + callData.callerNumber.slice(-4),
            personalInfo: '[REDACTED]'
        };
    }
};
```

---

## 💰 **Cost Breakdown**

### **Monthly Costs (Self-Hosted)**

| Component | Cost | Notes |
|-----------|------|-------|
| **Server (VPS)** | $20-50/month | 2GB RAM, dedicated for Asterisk |
| **Phone Numbers** | $1-3/number | From SIP trunk provider |
| **Usage Charges** | $0.01-0.03/minute | Inbound/outbound calls |
| **SSL Certificate** | Free | Let's Encrypt |
| **Domain Name** | $10/year | For your PBX server |
| **TOTAL** | **~$25-60/month** | vs $300+/month for Twilio |

### **One-Time Setup**
- **Development Time**: 4-8 hours
- **Testing & Debugging**: 2-4 hours
- **Documentation & Training**: 1-2 hours
- **Total Setup Time**: 1-2 days

---

## 🚀 **Deployment Checklist**

### **✅ Pre-Deployment Testing**

1. **Test SIP Registration**
   ```javascript
   window.debugSIP.register();
   ```

2. **Test Outbound Calls**
   ```javascript
   window.debugSIP.call('your-mobile-number');
   ```

3. **Test AI Integration**
   - Call your restaurant number
   - Verify AI answers and responds
   - Test booking creation via phone

4. **Test Call Recording**
   - Ensure recordings are saved
   - Verify transcription quality
   - Check privacy compliance

### **✅ Production Deployment**

1. **Server Setup** ✅
2. **SIP Trunk Configuration** ✅
3. **SSL Certificate** ✅
4. **Firewall Rules** ✅
5. **AI Integration** ✅
6. **Call Recording** ✅
7. **Analytics Tracking** ✅
8. **Privacy Compliance** ✅

---

## 🎉 **Benefits Achieved**

### **Complete Independence**
- ✅ **No External APIs**: Twilio, Vonage, etc. not needed
- ✅ **Own Your Infrastructure**: Full control over phone system
- ✅ **No Per-Minute Charges**: Only pay SIP trunk provider
- ✅ **Scalable**: Add unlimited AI lines without extra cost

### **Advanced Features**
- ✅ **AI-Powered Phone System**: Automated restaurant interactions
- ✅ **Real-time Speech Processing**: Instant conversation handling
- ✅ **Call Recording & Transcription**: All conversations logged
- ✅ **Analytics & Reporting**: Detailed call metrics

### **Cost Savings**
- **Twilio Alternative**: Save $200-500/month
- **Scalability**: No per-call pricing increases
- **Flexibility**: Customize everything to your needs

---

## 🔧 **Troubleshooting**

### **Common Issues**

#### **SIP Registration Fails**
```bash
# Check Asterisk logs
sudo tail -f /var/log/asterisk/full

# Test network connectivity
telnet your-asterisk-server.com 5060
```

#### **WebRTC Connection Issues**
- Verify SSL certificate is valid
- Check browser permissions for microphone
- Test with Chrome/Firefox (better WebRTC support)

#### **Audio Quality Problems**
- Adjust codec preferences in Asterisk
- Check network bandwidth and latency
- Enable echo cancellation in browser

#### **AI Response Delays**
- Optimize speech recognition settings
- Reduce conversation engine processing time
- Consider local speech-to-text alternatives

---

## 📚 **Next Steps**

### **Advanced Features to Add**
1. **Multi-line Support**: Handle multiple simultaneous calls
2. **Call Queuing**: Queue management for busy periods
3. **Voicemail Integration**: AI-powered voicemail processing
4. **SMS Integration**: Text message support via SIP
5. **Mobile App**: Native mobile app for restaurant staff

### **Integration Opportunities**
- **POS System**: Direct integration with restaurant POS
- **Reservation System**: Advanced booking management
- **Customer Database**: CRM integration for caller history
- **Staff Notifications**: Alert staff for special requests

---

## 🏆 **Final Result**

You now have a **completely self-hosted, zero-dependency phone system** that:

- 📞 **Handles incoming calls** with AI automation
- 🤖 **Processes conversations** and creates bookings
- 📹 **Records and transcripts** all interactions
- 📊 **Tracks analytics** and performance
- 💰 **Saves money** compared to cloud services
- 🔒 **Maintains privacy** with local processing
- 🛠️ **Scales infinitely** without additional costs

**Your restaurant AI system is now truly complete and independent!** 🎉