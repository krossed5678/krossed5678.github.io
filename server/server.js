const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const twilio = require('twilio');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

// Twilio configuration
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const SERVER_URL = process.env.SERVER_URL || `http://localhost:${PORT}`;

const twilioClient = TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN ? 
  twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN) : null;

// Middleware
app.use(cors({
  origin: ['http://localhost:8000', 'http://127.0.0.1:8000', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For Twilio webhooks
app.use(express.static(path.join(__dirname, '../')));

// Store active calls and booking data
const activeCalls = new Map();
const bookings = [];

// Configure multer for audio file uploads
const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    // Accept audio files
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    mistral_configured: !!MISTRAL_API_KEY,
    twilio_configured: !!twilioClient,
    phone_number: TWILIO_PHONE_NUMBER,
    timestamp: new Date().toISOString()
  });
});

// =============================================================================
// TWILIO PHONE CALL WEBHOOKS
// =============================================================================

// Incoming call handler - Twilio calls this when someone dials your number
app.post('/webhooks/voice', (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();
  const callSid = req.body.CallSid;
  const fromNumber = req.body.From;
  
  console.log(`📞 Incoming call from ${fromNumber} (${callSid})`);
  
  // Initialize call session
  activeCalls.set(callSid, {
    phone: fromNumber,
    startTime: new Date(),
    status: 'greeting'
  });

  // Greeting and instructions
  twiml.say({
    voice: 'alice',
    language: 'en-US'
  }, 'Hello! Thank you for calling our restaurant. I\'m your AI booking assistant. Please tell me your name, party size, and when you\'d like to dine. Speak after the beep.');

  // Record the customer's booking request
  twiml.record({
    timeout: 10,
    finishOnKey: '#',
    action: `${SERVER_URL}/webhooks/process-booking`,
    method: 'POST',
    recordingStatusCallback: `${SERVER_URL}/webhooks/recording-status`,
    transcribe: false, // We'll use Mistral AI instead
    maxLength: 30
  });

  // Fallback if no recording
  twiml.say('I didn\'t catch that. Please try again or press pound when finished.');

  res.type('text/xml');
  res.send(twiml.toString());
});

// Process the recorded booking request
app.post('/webhooks/process-booking', async (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();
  const callSid = req.body.CallSid;
  const recordingUrl = req.body.RecordingUrl;
  
  console.log(`🎵 Processing recording for call ${callSid}: ${recordingUrl}`);
  
  if (!recordingUrl) {
    twiml.say('I\'m sorry, I didn\'t receive your recording. Please try calling again.');
    twiml.hangup();
    res.type('text/xml');
    res.send(twiml.toString());
    return;
  }

  try {
    // Process the phone conversation with Mistral AI  
    const conversationResult = await processPhoneConversation(recordingUrl, callSid, req.body.From);
    
    if (conversationResult && conversationResult.success) {
      // Update call session
      const callSession = activeCalls.get(callSid);
      if (callSession) {
        callSession.conversationResult = conversationResult;
        callSession.status = conversationResult.action === 'booking_created' ? 'confirmed' : 'processing';
      }

      // Speak the AI's response
      twiml.say({
        voice: 'alice',
        language: 'en-US'
      }, conversationResult.aiResponse);
      
    } else {
      // Fallback response
      twiml.say('I apologize, but I\'m having trouble processing your request right now. Please try calling again in a moment.');
    }
    
  } catch (error) {
    console.error('Error processing booking:', error);
    twiml.say('I\'m sorry, there was a technical issue processing your request. Please try calling again later.');
  }

  twiml.hangup();
  res.type('text/xml');
  res.send(twiml.toString());
});

// Recording status callback
app.post('/webhooks/recording-status', (req, res) => {
  console.log('📼 Recording status:', req.body);
  res.sendStatus(200);
});

// Call status callback  
app.post('/webhooks/call-status', (req, res) => {
  const callSid = req.body.CallSid;
  const callStatus = req.body.CallStatus;
  
  console.log(`📞 Call ${callSid} status: ${callStatus}`);
  
  if (callStatus === 'completed' || callStatus === 'failed') {
    // Clean up call session
    activeCalls.delete(callSid);
  }
  
  res.sendStatus(200);
});

// Get all bookings (for web interface)
app.get('/api/bookings', (req, res) => {
  res.json({ bookings: bookings });
});

// Get call logs
app.get('/api/calls', (req, res) => {
  const calls = Array.from(activeCalls.entries()).map(([callSid, data]) => ({
    callSid,
    ...data
  }));
  res.json({ activeCalls: calls, totalBookings: bookings.length });
});

// Mistral AI conversation endpoint - handles speech-to-text, understanding, and response generation
app.post('/api/conversation', upload.single('audio'), async (req, res) => {
  console.log('🎵 === CONVERSATION REQUEST STARTED ===');
  console.log('Request details:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    fileUploaded: !!req.file
  });
  
  try {
    console.log('🔑 Checking Mistral API key...');
    if (!MISTRAL_API_KEY) {
      console.error('❌ Mistral API key not configured');
      return res.status(500).json({ error: 'Mistral API key not configured' });
    }
    console.log('✅ Mistral API key found');

    console.log('📁 Checking uploaded file...');
    if (!req.file) {
      console.error('❌ No audio file provided');
      return res.status(400).json({ error: 'No audio file provided' });
    }
    
    console.log('📁 File details:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    });

    console.log('📖 Reading audio file...');
    const audioBuffer = fs.readFileSync(req.file.path);
    console.log('📖 Audio buffer size:', audioBuffer.length, 'bytes');
    console.log('🎵 Processing audio conversation with Mistral AI...');
    
    // Step 1: Convert speech to text using Mistral AI
    console.log('🎤 Step 1: Converting speech to text...');
    const formData = new FormData();
    formData.append('file', audioBuffer, {
      filename: 'audio.webm',
      contentType: 'audio/webm'
    });
    formData.append('model', 'whisper-large');
    
    console.log('📤 Sending transcription request to Mistral AI...');
    console.log('Request details:', {
      url: 'https://api.mistral.ai/v1/audio/transcriptions',
      model: 'whisper-large',
      fileSize: audioBuffer.length,
      hasApiKey: !!MISTRAL_API_KEY
    });

    const transcriptionResponse = await axios.post('https://api.mistral.ai/v1/audio/transcriptions', formData, {
      headers: {
        'Authorization': `Bearer ${MISTRAL_API_KEY}`,
        ...formData.getHeaders()
      }
    }).catch(error => {
      console.error('❌ Mistral API transcription error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        config: {
          url: error.config?.url,
          method: error.config?.method
        }
      });
      throw error;
    });
    
    console.log('✅ Transcription response received:', {
      status: transcriptionResponse.status,
      data: transcriptionResponse.data
    });

    const transcription = transcriptionResponse.data.text || '';
    console.log(`📝 Customer said: "${transcription}"`);

    if (!transcription.trim()) {
      console.log('⚠️ Empty transcription received');
      return res.json({
        success: false,
        error: 'Could not understand audio',
        aiResponse: "I'm sorry, I didn't catch that. Could you please repeat your booking request?"
      });
    }

    // Step 2: Let Mistral AI handle the entire conversation and booking process
    console.log('🤖 Step 2: Processing conversation with AI...');
    const conversationResult = await handleBookingConversation(transcription);
    console.log('✅ Conversation result:', conversationResult);

    // Clean up uploaded file
    console.log('🧹 Cleaning up uploaded file...');
    fs.unlinkSync(req.file.path);
    console.log('✅ File cleanup complete');

    const response = {
      success: true,
      transcription,
      aiResponse: conversationResult.response,
      booking: conversationResult.booking,
      action: conversationResult.action  // 'booking_created', 'need_more_info', 'greeting', etc.
    };
    
    console.log('📤 Sending response to client:', response);
    console.log('🎵 === CONVERSATION REQUEST COMPLETED ===');
    res.json(response);

  } catch (error) {
    console.error('❌ === CONVERSATION ERROR ===');
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    
    if (error.response) {
      console.error('API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
    }
    
    if (error.config) {
      console.error('Request Config:', {
        url: error.config.url,
        method: error.config.method,
        headers: error.config.headers
      });
    }

    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      console.log('🧹 Cleaning up file after error...');
      fs.unlinkSync(req.file.path);
    }

    console.error('❌ Conversation error:', error.response?.data || error.message);
    
    const errorResponse = { 
      error: 'AI conversation failed', 
      details: error.response?.data || error.message,
      aiResponse: "I'm sorry, I'm having technical difficulties. Please try again in a moment.",
      debugInfo: {
        errorType: error.name,
        errorCode: error.code,
        timestamp: new Date().toISOString()
      }
    };
    
    console.log('📤 Sending error response:', errorResponse);
    console.log('❌ === CONVERSATION ERROR END ===');
    res.status(500).json(errorResponse);
  }
});

// Process phone conversation with Mistral AI - full conversation handling
async function processPhoneConversation(recordingUrl, callSid, phoneNumber) {
  try {
    console.log(`📞 Processing phone conversation: ${recordingUrl}`);
    
    // Download the recording from Twilio
    const response = await axios.get(recordingUrl, {
      responseType: 'arraybuffer',
      auth: {
        username: TWILIO_ACCOUNT_SID,
        password: TWILIO_AUTH_TOKEN
      }
    });
    
    const audioBuffer = Buffer.from(response.data);
    
    // Create form data for Mistral AI transcription
    const formData = new FormData();
    formData.append('file', audioBuffer, {
      filename: 'phone-recording.wav',
      contentType: 'audio/wav'
    });
    formData.append('model', 'whisper-large-v3');

    console.log('🤖 Converting speech to text with Mistral AI...');

    // Step 1: Speech to text
    const transcriptionResponse = await axios.post('https://api.mistral.ai/v1/audio/transcriptions', formData, {
      headers: {
        'Authorization': `Bearer ${MISTRAL_API_KEY}`,
        ...formData.getHeaders()
      }
    });

    const transcription = transcriptionResponse.data.text || '';
    console.log(`📝 Customer said: "${transcription}"`);
    
    if (!transcription.trim()) {
      return { 
        success: true, 
        aiResponse: "I'm sorry, I didn't catch that. Could you please repeat your booking request?",
        action: 'need_repeat'
      };
    }

    // Step 2: Let Mistral AI handle the conversation and booking
    const conversationResult = await handleBookingConversation(transcription);
    
    // Add phone number to booking if one was created
    if (conversationResult.booking) {
      conversationResult.booking.phone_number = phoneNumber;
      conversationResult.booking.created_via = 'phone_call';
      conversationResult.booking.call_sid = callSid;
    }
    
    return {
      success: true,
      transcription,
      aiResponse: conversationResult.response,
      booking: conversationResult.booking,
      action: conversationResult.action
    };

  } catch (error) {
    console.error('❌ Phone conversation processing error:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data || error.message,
      aiResponse: "I apologize, but I'm experiencing technical difficulties. Please try calling again in a moment."
    };
  }
}

// Handle full booking conversation with Mistral AI - no manual parsing needed!
async function handleBookingConversation(customerSpeech) {
  console.log('🤖 === HANDLING BOOKING CONVERSATION ===');
  console.log('Customer speech:', customerSpeech);
  
  try {
    console.log('📝 Building system prompt...');
    const systemPrompt = `You are a professional restaurant booking assistant AI. Your job is to:

1. Understand customer booking requests from speech
2. Extract booking details when available
3. Create bookings when you have enough information  
4. Ask for missing information politely
5. Confirm bookings clearly
6. Be friendly and professional

Current date/time: ${new Date().toISOString()}

When you have enough booking information, respond with:
BOOKING_DATA: {JSON with customer_name, phone_number, party_size, date, start_time, end_time, notes}

Always end your response with a natural, friendly message to speak back to the customer.

Example responses:
- "Perfect! I've created your reservation for John Smith, party of 4, tomorrow at 7 PM. Your confirmation number will be provided shortly. Thank you for choosing our restaurant!"
- "I'd be happy to help you make a reservation! I heard you'd like a table, but could you please tell me your name, how many people, and what date and time you prefer?"
- "Great! I have a table for 2 people. Could you please tell me your preferred date and time, and a phone number for the reservation?"`;

    console.log('🚀 Sending chat completion request to Mistral AI...');
    const requestPayload = {
      model: 'mistral-large-latest',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user', 
          content: `Customer said: "${customerSpeech}"`
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    };
    
    console.log('📤 Chat request payload:', JSON.stringify(requestPayload, null, 2));
    
    const response = await axios.post('https://api.mistral.ai/v1/chat/completions', requestPayload, {
      headers: {
        'Authorization': `Bearer ${MISTRAL_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }).catch(error => {
      console.error('❌ Mistral API chat error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        requestUrl: error.config?.url
      });
      throw error;
    });
    
    console.log('✅ Chat completion response received:', {
      status: response.status,
      choices: response.data?.choices?.length
    });

    const aiResponse = response.data.choices[0].message.content;
    console.log(`🤖 AI Response: "${aiResponse}"`);
    
    // Check if AI created booking data
    console.log('🔍 Checking for booking data in AI response...');
    let booking = null;
    let action = 'conversation';
    
    const bookingMatch = aiResponse.match(/BOOKING_DATA:\s*(\{[^}]*\})/);
    if (bookingMatch) {
      console.log('📝 Found booking data in response:', bookingMatch[1]);
      try {
        booking = JSON.parse(bookingMatch[1]);
        action = 'booking_created';
        console.log('✅ Successfully parsed booking:', booking);
        
        // Store the booking
        const newBooking = {
          id: bookings.length + 1,
          ...booking,
          created_at: new Date().toISOString(),
          created_via: 'ai_conversation'
        };
        bookings.push(newBooking);
        console.log('📝 Booking stored in memory:', newBooking);
      } catch (parseError) {
        console.error('❌ Failed to parse booking JSON:', parseError);
        console.error('Raw booking data:', bookingMatch[1]);
      }
    } else {
      console.log('ℹ️ No booking data found in AI response');
    }
    
    // Clean the response (remove BOOKING_DATA part)
    const cleanResponse = aiResponse.replace(/BOOKING_DATA:\s*\{[^}]*\}/, '').trim();
    console.log('🧹 Cleaned response:', cleanResponse);
    
    const result = {
      response: cleanResponse,
      booking: booking,
      action: action
    };
    
    console.log('🤖 === BOOKING CONVERSATION RESULT ===');
    console.log('Final result:', result);
    console.log('🤖 === END BOOKING CONVERSATION ===');
    
    return result;

  } catch (error) {
    console.error('❌ === BOOKING CONVERSATION ERROR ===');
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    
    if (error.response) {
      console.error('API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
    
    console.error('❌ Mistral conversation error:', error.response?.data || error.message);
    console.error('❌ === END BOOKING CONVERSATION ERROR ===');
    
    return {
      response: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment, or feel free to call us directly.",
      booking: null,
      action: 'error'
    };
  }
}

// Text-to-speech endpoint - returns text for browser TTS
app.post('/api/speak', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    // Clean up the text for better TTS pronunciation
    const cleanText = text
      .replace(/['"]/g, '') // Remove quotes
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    console.log(`🔊 TTS Request: "${cleanText}"`);

    // Return text for browser's built-in TTS (works great and is free!)
    res.json({ 
      success: true, 
      text: cleanText,
      message: 'Ready for browser TTS'
    });

  } catch (error) {
    console.error('❌ TTS error:', error);
    res.status(500).json({ 
      error: 'TTS failed',
      text: 'I apologize, but I cannot speak right now.'
    });
  }
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Mistral AI configured: ${!!MISTRAL_API_KEY}`);
  console.log(`📞 Twilio configured: ${!!twilioClient}`);
  
  if (TWILIO_PHONE_NUMBER && twilioClient) {
    console.log(`📲 Phone bookings available at: ${TWILIO_PHONE_NUMBER}`);
    console.log(`🔗 Webhook URL for Twilio: ${SERVER_URL}/webhooks/voice`);
  }
  
  if (!MISTRAL_API_KEY) {
    console.log('⚠️  Add MISTRAL_API_KEY to .env file to enable AI features');
  }
  
  if (!twilioClient) {
    console.log('⚠️  Add Twilio credentials to .env file to enable phone bookings');
  }
  
  console.log('\n📋 Setup Instructions:');
  console.log('1. Add your Mistral AI API key to .env');
  console.log('2. Get Twilio account and add credentials to .env');  
  console.log('3. Configure Twilio webhook URL in Twilio Console');
  console.log('4. Customers can call your Twilio number to make bookings!');
});