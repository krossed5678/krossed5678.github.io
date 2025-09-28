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
    // Download and process the audio with Mistral AI
    const bookingData = await processPhoneRecording(recordingUrl, callSid);
    
    if (bookingData && bookingData.success) {
      // Store the booking
      const booking = {
        id: bookings.length + 1,
        ...bookingData.booking,
        phone_number: req.body.From,
        created_via: 'phone_call',
        call_sid: callSid,
        created_at: new Date().toISOString()
      };
      bookings.push(booking);
      
      // Update call session
      const callSession = activeCalls.get(callSid);
      if (callSession) {
        callSession.booking = booking;
        callSession.status = 'confirmed';
      }

      // Confirm the booking
      const confirmationMessage = `Perfect! I've created your reservation for ${booking.customer_name || 'your party'} of ${booking.party_size || 'guests'}${booking.start_time ? ` on ${new Date(booking.start_time).toLocaleDateString()} at ${new Date(booking.start_time).toLocaleTimeString()}` : ''}. Your booking confirmation number is ${booking.id}. Thank you for calling!`;
      
      twiml.say({
        voice: 'alice',
        language: 'en-US'
      }, confirmationMessage);
      
    } else {
      // Could not process booking
      twiml.say('I\'m sorry, I had trouble understanding your booking request. Please call back and clearly state your name, party size, and preferred date and time. Thank you.');
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

// Mistral AI voice transcription endpoint
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!MISTRAL_API_KEY) {
      return res.status(500).json({ error: 'Mistral API key not configured' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const audioBuffer = fs.readFileSync(req.file.path);
    
    // Create form data for Mistral API
    const formData = new FormData();
    formData.append('file', audioBuffer, {
      filename: 'audio.webm',
      contentType: 'audio/webm'
    });
    formData.append('model', 'whisper-large-v3');

    // Call Mistral AI transcription API
    const response = await axios.post('https://api.mistral.ai/v1/audio/transcriptions', formData, {
      headers: {
        'Authorization': `Bearer ${MISTRAL_API_KEY}`,
        ...formData.getHeaders()
      }
    });

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    const transcription = response.data.text || '';
    
    // Parse booking information from transcription using Mistral Chat API
    const bookingInfo = await parseBookingWithMistral(transcription);

    res.json({
      transcription,
      booking: bookingInfo,
      success: true
    });

  } catch (error) {
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error('Transcription error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Transcription failed', 
      details: error.response?.data || error.message 
    });
  }
});

// Parse booking information using Mistral Chat API
async function parseBookingWithMistral(text) {
  try {
    const prompt = `Parse the following restaurant booking request and extract the information in JSON format. 
    Return ONLY valid JSON with these fields: customer_name, phone_number, party_size, date, start_time, end_time, notes.
    For times, use 24-hour format (HH:MM). For date, use YYYY-MM-DD format. If today is mentioned, use today's date.
    If information is missing, use null for that field.
    
    Text: "${text}"
    
    Example response:
    {
      "customer_name": "John Smith",
      "phone_number": "555-123-4567",
      "party_size": 4,
      "date": "2024-03-15", 
      "start_time": "19:00",
      "end_time": "21:00",
      "notes": "Anniversary dinner"
    }`;

    const response = await axios.post('https://api.mistral.ai/v1/chat/completions', {
      model: 'mistral-medium',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1
    }, {
      headers: {
        'Authorization': `Bearer ${MISTRAL_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const aiResponse = response.data.choices[0].message.content;
    
    try {
      // Extract JSON from response (in case AI adds extra text)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
    }

    return null;
  } catch (error) {
    console.error('Mistral parsing error:', error.response?.data || error.message);
    return null;
  }
}

// Text-to-speech endpoint using Mistral (if available) or fallback
app.post('/api/speak', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    // For now, return success - client will handle TTS with browser API
    // You can integrate Mistral TTS here when available
    res.json({ 
      success: true, 
      message: 'Use browser TTS for now',
      text: text
    });

  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({ error: 'TTS failed' });
  }
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Mistral API configured: ${!!MISTRAL_API_KEY}`);
  if (!MISTRAL_API_KEY) {
    console.log('⚠️  Add MISTRAL_API_KEY to .env file to enable AI features');
  }
});