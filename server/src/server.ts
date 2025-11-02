import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import twilio from 'twilio';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3001);
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || '';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '';
const SERVER_URL = process.env.SERVER_URL || `http://localhost:${PORT}`;

const twilioClient = (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN) : null;

app.use(cors({ origin: ['http://localhost:8000', 'http://127.0.0.1:8000', 'http://localhost:3000'], credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../../')));

const activeCalls = new Map<string, any>();
// Use persistent JSON-backed storage for bookings/users
import { addBooking, getBookings, updateBooking, Booking } from './storage';
import { syncBookingToCalendar } from './calendar';

// Load existing bookings into memory view when needed via getBookings()

// Mount auth routes
import authRouter from './auth';
app.use('/api/auth', authRouter as any);

// Simple JWT auth middleware (protect UI)
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
function ensureAuth(req: Request, res: Response, next: any) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = auth.split(' ')[1];
  try { (req as any).user = jwt.verify(token, JWT_SECRET); return next(); } catch (e) { return res.status(401).json({ error: 'Invalid token' }); }
}

// Protect admin UI paths (example)
app.use('/admin', ensureAuth);

const upload = multer({ dest: 'uploads/', fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('audio/')) cb(null as any, true); else cb(new Error('Only audio files are allowed'));
}, limits: { fileSize: 10 * 1024 * 1024 } });

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', mistral_configured: !!MISTRAL_API_KEY, twilio_configured: !!twilioClient, phone_number: TWILIO_PHONE_NUMBER, timestamp: new Date().toISOString() });
});

app.post('/webhooks/voice', (req: Request, res: Response) => {
  const VoiceResponse = (twilio as any).twiml.VoiceResponse;
  const twiml = new VoiceResponse();
  const callSid = (req as any).body.CallSid;
  const fromNumber = (req as any).body.From;

  console.log(`Incoming call from ${fromNumber} (${callSid})`);
  activeCalls.set(callSid, { phone: fromNumber, startTime: new Date(), status: 'greeting' });

  twiml.say({ voice: 'alice', language: 'en-US' }, "Hello! Thank you for calling our restaurant. I'm your AI booking assistant. Please tell me your name, party size, and when you'd like to dine. Speak after the beep.");

  twiml.record({ timeout: 10, finishOnKey: '#', action: `${SERVER_URL}/webhooks/process-booking`, method: 'POST', recordingStatusCallback: `${SERVER_URL}/webhooks/recording-status`, transcribe: false, maxLength: 30 });

  twiml.say("I didn't catch that. Please try again or press pound when finished.");
  res.type('text/xml');
  res.send(twiml.toString());
});

app.post('/webhooks/process-booking', async (req: Request, res: Response) => {
  const VoiceResponse = (twilio as any).twiml.VoiceResponse;
  const twiml = new VoiceResponse();
  const callSid = (req as any).body.CallSid;
  const recordingUrl = (req as any).body.RecordingUrl;

  console.log(`Processing recording for call ${callSid}: ${recordingUrl}`);

  if (!recordingUrl) {
    twiml.say("I'm sorry, I didn't receive your recording. Please say your request again.");
    twiml.record({ timeout: 10, finishOnKey: '#', action: `${SERVER_URL}/webhooks/process-booking`, method: 'POST', recordingStatusCallback: `${SERVER_URL}/webhooks/recording-status`, transcribe: false, maxLength: 30 });
    res.type('text/xml'); res.send(twiml.toString()); return;
  }

  try {
    const conversationResult = await processPhoneConversation(recordingUrl, callSid, (req as any).body.From);
    if (conversationResult && conversationResult.success) {
      const callSession = activeCalls.get(callSid);
      if (callSession) { callSession.conversationResult = conversationResult; callSession.status = conversationResult.action === 'booking_created' ? 'confirmed' : 'processing'; }

      twiml.say({ voice: 'alice', language: 'en-US' }, conversationResult.aiResponse);

      if (conversationResult.action === 'booking_created') { twiml.say('Have a wonderful day!'); twiml.hangup(); }
      else {
        twiml.record({ timeout: 10, finishOnKey: '#', action: `${SERVER_URL}/webhooks/process-booking`, method: 'POST', recordingStatusCallback: `${SERVER_URL}/webhooks/recording-status`, transcribe: false, maxLength: 30 });
        twiml.say("I didn't catch that. Please try again or press pound when finished.");
      }
    } else { twiml.say("I apologize, but I'm having trouble processing your request right now. Please try calling again in a moment."); twiml.hangup(); }
  } catch (error:any) {
    console.error('Error processing booking:', error);
    twiml.say("I'm sorry, there was a technical issue processing your request. Please try calling again later."); twiml.hangup();
  }

  res.type('text/xml'); res.send(twiml.toString());
});

app.post('/webhooks/recording-status', (req: Request, res: Response) => { console.log('Recording status:', (req as any).body); res.sendStatus(200); });

app.post('/webhooks/call-status', (req: Request, res: Response) => { const callSid = (req as any).body.CallSid; const callStatus = (req as any).body.CallStatus; console.log(`Call ${callSid} status: ${callStatus}`); if (callStatus === 'completed' || callStatus === 'failed') activeCalls.delete(callSid); res.sendStatus(200); });

app.get('/api/bookings', (req: Request, res: Response) => {
  const bookings = getBookings();
  res.json({ bookings });
});

app.get('/api/calls', (req: Request, res: Response) => { const calls = Array.from(activeCalls.entries()).map(([callSid, data]) => ({ callSid, ...data })); res.json({ activeCalls: calls, totalBookings: getBookings().length }); });

// Allow creating bookings via API (admin or webhook may use this)
app.post('/api/bookings', (req: Request, res: Response) => {
  const { text, phone, source } = req.body as { text?:string; phone?:string; source?:string };
  if (!text) return res.status(400).json({ error: 'Missing booking text' });
  const booking = addBooking({ text, phone, source: source || 'api', status: 'pending' });
  // Try to sync to calendar if configured
  (async () => {
    try {
      const calRes = await syncBookingToCalendar(booking as Booking);
      // store calendar sync metadata on booking
      updateBooking(booking.id, { status: 'confirmed' });
      console.log('Calendar sync result:', calRes);
    } catch (err:any) {
      console.warn('Calendar sync failed for booking', booking.id, err?.message || err);
    }
  })();
  res.json({ ok: true, booking });
});

app.post('/api/conversation', upload.single('audio'), async (req: Request, res: Response) => {
  try {
    if (!MISTRAL_API_KEY) return res.status(500).json({ error: 'Mistral API key not configured' });
    if (!req.file) return res.status(400).json({ error: 'No audio file provided' });
    const audioBuffer = fs.readFileSync((req.file as any).path);
    const conversationResult = await handleHybridConversation(audioBuffer);
    fs.unlinkSync((req.file as any).path);
    res.json({ success: true, transcription: conversationResult.transcription || 'Audio processed directly', aiResponse: conversationResult.response, booking: conversationResult.booking, action: conversationResult.action });
  } catch (error:any) {
    console.error('Conversation error:', error);
    if ((req as any).file && fs.existsSync((req as any).file.path)) fs.unlinkSync((req as any).file.path);
    res.status(500).json({ error: 'AI conversation failed', details: error.response?.data || error.message });
  }
});

async function processPhoneConversation(recordingUrl: string, callSid: string, phoneNumber: string) {
  try {
    const response = await axios.get(recordingUrl, { responseType: 'arraybuffer', auth: { username: TWILIO_ACCOUNT_SID, password: TWILIO_AUTH_TOKEN } });
    const audioBuffer = Buffer.from(response.data);
    const formData = new FormData();
    formData.append('file', audioBuffer, { filename: 'phone-recording.wav', contentType: 'audio/wav' });
    formData.append('model', 'whisper-large-v3');
    const transcriptionResponse = await axios.post('https://api.mistral.ai/v1/audio/transcriptions', formData, { headers: { 'Authorization': `Bearer ${MISTRAL_API_KEY}`, ...formData.getHeaders() } });
    const transcription = transcriptionResponse.data.text || '';
    if (!transcription.trim()) { return { success: true, aiResponse: "I'm sorry, I didn't catch that. Could you please repeat your booking request?", action: 'need_repeat' }; }
    const convResult = await interpretTranscription(transcription);
    return convResult;
  } catch (error:any) { console.error('processPhoneConversation error', error); throw error; }
}

async function handleHybridConversation(audioBuffer: Buffer) {
  // Placeholder simple transcription flow; in full migration we'd reuse advanced logic.
  return { transcription: 'processed', response: 'Thanks, we received your message', booking: null, action: 'greeting' };
}

async function interpretTranscription(text: string) {
  // Minimal intent extraction placeholder - simple booking detection and creation
  const lower = text.toLowerCase();
  const bookingKeywords = /\b(book|reservation|reserve|table)\b/;
  const partySizeMatch = text.match(/(party of|party)\s*(\d{1,2})/i) || text.match(/(for)\s*(\d{1,2})\s*(people|persons)/i);
  if (bookingKeywords.test(lower)) {
    // create a simple booking record
    const bookingText = text.trim();
    const phone = undefined as string | undefined;
    const created = addBooking({ text: bookingText, phone, source: 'phone', status: 'pending' });

    // Try calendar sync (best-effort)
    (async () => {
      try {
        const cal = await syncBookingToCalendar(created as Booking);
        console.log('Auto calendar sync result for call booking:', cal);
        updateBooking(created.id, { status: 'confirmed' });
      } catch (e:any) {
        console.warn('Auto calendar sync failed for booking', created.id, e?.message || e);
      }
    })();

    const aiResponse = `Thanks — I created a booking request (id ${created.id}). We'll confirm shortly.`;
    return { success: true, transcription: text, aiResponse, booking: created, action: 'booking_created' };
  }

  // fallback: ask for more info
  return { success: true, transcription: text, aiResponse: `You said: ${text}`, action: 'need_more_info' };
}

app.listen(PORT, () => { console.log(`Server (TS) listening on ${PORT}`); });

export {};
