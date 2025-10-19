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
    twiml.say('I\'m sorry, I didn\'t receive your recording. Please say your request again.');
    
    // Record again instead of hanging up
    twiml.record({
      timeout: 10,
      finishOnKey: '#',
      action: `${SERVER_URL}/webhooks/process-booking`,
      method: 'POST',
      recordingStatusCallback: `${SERVER_URL}/webhooks/recording-status`,
      transcribe: false,
      maxLength: 30
    });
    
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
      
      // Check if we need more information (don't hang up!)
      if (conversationResult.action === 'booking_created') {
        console.log('✅ Booking completed, ending call');
        twiml.say('Have a wonderful day!');
        twiml.hangup();
      } else {
        console.log('🔄 Need more info, continuing conversation...');
        // Ask for more information and record again
        twiml.record({
          timeout: 10,
          finishOnKey: '#',
          action: `${SERVER_URL}/webhooks/process-booking`,
          method: 'POST',
          recordingStatusCallback: `${SERVER_URL}/webhooks/recording-status`,
          transcribe: false,
          maxLength: 30
        });
        
        // Fallback if no response
        twiml.say('I didn\'t catch that. Please try again or press pound when finished.');
      }
      
    } else {
      // Fallback response
      twiml.say('I apologize, but I\'m having trouble processing your request right now. Please try calling again in a moment.');
      twiml.hangup();
    }
    
  } catch (error) {
    console.error('Error processing booking:', error);
    twiml.say('I\'m sorry, there was a technical issue processing your request. Please try calling again later.');
    twiml.hangup();
  }

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

// Get conversation sessions (for debugging)
app.get('/api/sessions', (req, res) => {
  const sessions = Array.from(conversationSessions.entries()).map(([sessionId, session]) => ({
    sessionId,
    startTime: session.startTime,
    attempts: session.attempts,
    extractedInfo: session.extractedInfo,
    conversationLength: session.conversationHistory.length
  }));
  res.json({ sessions, totalSessions: sessions.length });
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
    
    // Use Mistral's Voxtral model for direct audio understanding
    console.log('🎤 Processing audio directly with Voxtral...');
    
    // Convert audio buffer to base64 for Mistral API
    const audioBase64 = audioBuffer.toString('base64');
    
    console.log('📤 Sending audio understanding request to Mistral AI...');
    console.log('Request details:', {
      model: 'voxtral-small',
      audioSize: audioBuffer.length,
      hasApiKey: !!MISTRAL_API_KEY
    });

    // Hybrid approach: OpenAI Whisper for transcription + Mistral for conversation
    const conversationResult = await handleHybridConversation(audioBuffer);
    console.log('✅ Conversation result:', conversationResult);

    // Clean up uploaded file
    console.log('🧹 Cleaning up uploaded file...');
    fs.unlinkSync(req.file.path);
    console.log('✅ File cleanup complete');

    const response = {
      success: true,
      transcription: conversationResult.transcription || 'Audio processed directly',
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

    // Step 2: Let Mistral AI handle the conversation and booking (with session tracking)
    const conversationResult = await handleBookingConversation(transcription, callSid, phoneNumber);
    
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

// Mistral-only approach: Use browser speech recognition + Mistral conversation
async function handleHybridConversation(audioBuffer) {
  console.log('🔄 === MISTRAL-ONLY AUDIO PROCESSING ===');
  console.log('Note: Server-side audio processing requires browser speech recognition');
  console.log('Recommendation: Use browser Web Speech API for best results');
  
  try {
    console.log('⚠️ Server-side audio processing not available with Mistral-only setup');
    console.log('💡 Recommending browser speech recognition instead');
    
    return {
      success: true,
      transcription: 'Use browser speech recognition',
      response: "For the best experience, please use your browser's built-in speech recognition. Click the voice button and speak directly - your browser will convert speech to text and I'll process it with Mistral AI!",
      action: 'use_browser_speech'
    };
    
  } catch (error) {
    console.error('❌ Audio processing error:', error.message);
    return { 
      success: false, 
      error: error.message,
      response: "Please use your browser's speech recognition by clicking the voice button and speaking directly.",
      action: 'error'
    };
  }
}

// Handle audio conversation directly with Mistral's Voxtral model
async function handleAudioConversation(audioBase64) {
  console.log('🎵 === HANDLING AUDIO CONVERSATION WITH VOXTRAL ===');
  
  try {
    console.log('📝 Building system prompt for audio understanding...');
    const systemPrompt = `You are a professional restaurant booking assistant AI. Your job is to:

1. Listen to and understand customer booking requests from audio
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
- "I'd be happy to help you make a reservation! I heard you'd like a table, but could you please tell me your name, how many people, and what date and time you prefer?"`;

    console.log('🚀 Sending audio understanding request to Mistral Voxtral...');
    const requestPayload = {
      model: 'voxtral-small-latest', // Using Voxtral Small for audio understanding
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Please process this audio booking request:'
            },
            {
              type: 'input_audio',
              input_audio: audioBase64
            }
          ]
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    };
    
    console.log('📤 Voxtral request payload:', {
      model: requestPayload.model,
      messagesCount: requestPayload.messages.length,
      hasAudio: !!audioBase64,
      audioSize: audioBase64.length
    });
    
    const response = await axios.post('https://api.mistral.ai/v1/chat/completions', requestPayload, {
      headers: {
        'Authorization': `Bearer ${MISTRAL_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }).catch(error => {
      console.error('❌ Mistral Voxtral API error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        requestUrl: error.config?.url
      });
      throw error;
    });
    
    console.log('✅ Voxtral response received:', {
      status: response.status,
      choices: response.data?.choices?.length
    });

    const aiMessage = response.data.choices[0].message.content;
    console.log('🤖 AI Response:', aiMessage);

    // Parse booking data if present  
    let bookingData = null;
    let action = 'greeting';
    
    const bookingMatch = aiMessage.match(/BOOKING_DATA:\s*({[^}]+})/);
    if (bookingMatch) {
      try {
        bookingData = JSON.parse(bookingMatch[1]);
        console.log('📋 Parsed booking data:', bookingData);
        
        // Add booking to our storage
        const booking = {
          id: Date.now(),
          ...bookingData,
          created_at: new Date().toISOString(),
          status: 'confirmed'
        };
        bookings.push(booking);
        console.log('✅ Booking saved:', booking);
        action = 'booking_created';
      } catch (parseError) {
        console.error('❌ Error parsing booking data:', parseError);
        action = 'parsing_error';
      }
    } else if (aiMessage.toLowerCase().includes('need') || aiMessage.includes('?')) {
      action = 'need_more_info';
    }

    // Clean response for speaking
    const cleanResponse = aiMessage.replace(/BOOKING_DATA:\s*{[^}]+}\s*/, '').trim();
    
    return {
      success: true,
      response: cleanResponse,
      booking: bookingData,
      action: action,
      transcription: 'Processed with Voxtral (no separate transcription)'
    };

  } catch (error) {
    console.error('❌ Audio conversation processing error:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data || error.message,
      response: "I'm sorry, I'm having technical difficulties processing your request. Please try again in a moment.",
      action: 'error'
    };
  }
}

// Text-only conversation endpoint (for browser speech recognition)
app.post('/api/text-conversation', async (req, res) => {
  console.log('📝 === TEXT CONVERSATION REQUEST ===');
  console.log('Request body:', req.body);
  
  try {
    const { transcript } = req.body;
    
    if (!transcript || !transcript.trim()) {
      return res.status(400).json({ 
        error: 'No transcript provided',
        aiResponse: 'I didn\'t receive any text to process. Please try again.'
      });
    }

    console.log('🤖 Processing text conversation with Mistral AI...');
    const sessionId = req.body.sessionId || 'web-' + Date.now();
    const conversationResult = await handleBookingConversation(transcript, sessionId, null);
    console.log('✅ Text conversation result:', conversationResult);

    const response = {
      success: true,
      transcription: transcript,
      aiResponse: conversationResult.response,
      booking: conversationResult.booking,
      action: conversationResult.action
    };
    
    console.log('📤 Sending text conversation response:', response);
    res.json(response);

  } catch (error) {
    console.error('❌ Text conversation error:', error);
    res.status(500).json({ 
      error: 'Text conversation failed',
      details: error.message,
      aiResponse: "I'm sorry, I'm having technical difficulties. Please try again in a moment."
    });
  }
});

// Store conversation sessions for multi-turn conversations
const conversationSessions = new Map();

// Handle full booking conversation with Mistral AI - probes until complete!
async function handleBookingConversation(customerSpeech, sessionId = null, phoneNumber = null) {
  console.log('🤖 === HANDLING BOOKING CONVERSATION ===');
  console.log('Customer speech:', customerSpeech);
  console.log('Session ID:', sessionId);
  
  try {
    // Get or create conversation session
    const sessionKey = sessionId || phoneNumber || 'web-session';
    let session = conversationSessions.get(sessionKey);
    
    if (!session) {
      session = {
        id: sessionKey,
        startTime: new Date(),
        conversationHistory: [],
        extractedInfo: {
          customer_name: null,
          party_size: null,
          date: null,
          time: null,
          phone_number: phoneNumber,
          special_requests: null
        },
        lastResponse: null,
        attempts: 0
      };
      conversationSessions.set(sessionKey, session);
      console.log('🆕 Created new conversation session:', sessionKey);
    }
    
    // Add customer message to history
    session.conversationHistory.push({
      role: 'customer',
      message: customerSpeech,
      timestamp: new Date()
    });
    session.attempts++;
    
    console.log('📝 Building probing system prompt...');
    const systemPrompt = `You are a professional restaurant booking assistant AI. Your job is to persistently but politely gather ALL required booking information and ONLY create bookings when complete.

REQUIRED BOOKING INFORMATION:
- Customer name (first and last)
- Party size (number of people)  
- Date (specific date, not just "tonight" or "tomorrow")
- Time (specific time like "7:00 PM", not just "evening")

CURRENT EXTRACTED INFORMATION:
- Name: ${session.extractedInfo.customer_name || 'MISSING'}
- Party Size: ${session.extractedInfo.party_size || 'MISSING'}
- Date: ${session.extractedInfo.date || 'MISSING'}  
- Time: ${session.extractedInfo.time || 'MISSING'}
- Phone: ${session.extractedInfo.phone_number || 'MISSING'}

CONVERSATION HISTORY:
${session.conversationHistory.map(msg => `${msg.role}: ${msg.message}`).join('\n')}

INSTRUCTIONS:
1. Extract any NEW information from the customer's latest message
2. If you have ALL required info, create the booking  
3. If missing ANY required info, ask specific follow-up questions
4. Be conversational and helpful, not robotic
5. Ask for ONE piece of missing information at a time
6. Don't repeat questions you've already asked

RESPONSE FORMATS:

If COMPLETE booking info available:
BOOKING_DATA: {"customer_name": "John Smith", "party_size": 4, "date": "2025-10-11", "time": "19:00", "phone_number": "${phoneNumber || 'unknown'}", "special_requests": "any notes"}
RESPONSE: "Perfect! I have everything I need. I've reserved a table for [name], party of [size], on [date] at [time]. Your confirmation number is [generate random]. Thank you!"

If MISSING info:
EXTRACTED: {"customer_name": "value or null", "party_size": "value or null", "date": "value or null", "time": "value or null"}
RESPONSE: "Thank you! I have [list what you got]. To complete your reservation, could you please tell me [ask for ONE specific missing item]?"

EXAMPLES OF GOOD FOLLOW-UP QUESTIONS:
- "Great! And what name should I put the reservation under?"
- "Perfect! How many people will be joining you?"
- "Excellent! What date would you like to dine with us?"
- "Wonderful! What time would work best for you?"

Current date/time: ${new Date().toISOString()}
Restaurant hours: 5:00 PM - 11:00 PM, Tuesday-Sunday (Closed Mondays)

Be friendly, professional, and persistent until you have everything needed!`;

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
    
    // Check for booking data or extracted information
    console.log('🔍 Checking for booking data in AI response...');
    let booking = null;
    let action = 'need_more_info';
    
    const bookingMatch = aiResponse.match(/BOOKING_DATA:\s*(\{[^}]*\})/);
    if (bookingMatch) {
      console.log('📝 Found complete booking data:', bookingMatch[1]);
      try {
        booking = JSON.parse(bookingMatch[1]);
        action = 'booking_created';
        console.log('✅ Successfully parsed booking:', booking);
        
        // Store the booking
        const newBooking = {
          id: bookings.length + 1,
          confirmation_number: 'BV' + Date.now().toString().slice(-6),
          ...booking,
          created_at: new Date().toISOString(),
          created_via: 'ai_conversation',
          status: 'confirmed'
        };
        bookings.push(newBooking);
        console.log('📝 Booking stored in memory:', newBooking);
        
        // Clear the conversation session since booking is complete
        conversationSessions.delete(sessionKey);
        console.log('🗑️ Cleared conversation session:', sessionKey);
      } catch (parseError) {
        console.error('❌ Failed to parse booking JSON:', parseError);
        console.error('Raw booking data:', bookingMatch[1]);
      }
    } else {
      // Check for partial extracted information
      const extractedMatch = aiResponse.match(/EXTRACTED:\s*(\{[^}]*\})/);
      if (extractedMatch) {
        console.log('📝 Found extracted info:', extractedMatch[1]);
        try {
          const extractedInfo = JSON.parse(extractedMatch[1]);
          // Update session with new info
          for (const key in extractedInfo) {
            if (extractedInfo[key] && extractedInfo[key] !== 'null') {
              session.extractedInfo[key] = extractedInfo[key];
              console.log(`✅ Updated ${key}: ${extractedInfo[key]}`);
            }
          }
        } catch (parseError) {
          console.error('❌ Failed to parse extracted info:', parseError);
        }
      }
      console.log('ℹ️ Still need more information, continuing conversation...');
    }
    
    // Add AI response to conversation history
    session.conversationHistory.push({
      role: 'assistant',
      message: aiResponse,
      timestamp: new Date()
    });
    session.lastResponse = aiResponse;
    
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