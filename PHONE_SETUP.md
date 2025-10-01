# 📞 Phone-Based AI Booking Setup Guide

This guide will help you set up **real phone number integration** so customers can call and make reservations using voice commands.

## 🎯 Overview

Customers will be able to:
1. **Call your restaurant's phone number**
2. **Speak their booking request** (name, party size, date, time)
3. **Receive immediate confirmation** via voice
4. **Automatically create bookings** in your system

## 📋 Step-by-Step Setup

### 1. Get Twilio Account (Phone Service)

1. **Sign up**: Go to [twilio.com](https://www.twilio.com) and create account
2. **Get free trial**: Twilio gives $15 credit to start
3. **Buy a phone number**: 
   - Go to Phone Numbers → Manage → Buy a number
   - Choose a local number for your restaurant
   - Cost: ~$1/month for the number

### 2. Get Your Twilio Credentials

In Twilio Console, find:
- **Account SID**: Found on main dashboard
- **Auth Token**: Click "show" on main dashboard  
- **Phone Number**: The number you purchased (format: +1234567890)

### 3. Add Credentials to .env File

Edit `server/.env`:
```env
MISTRAL_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
SERVER_URL=https://your-domain.com
```

### 4. Deploy Your Server (Required for Phone Calls)

Twilio needs a **public URL** to send webhooks. Options:

#### Option A: Ngrok (For Testing)
```bash
# Install ngrok
npm install -g ngrok

# Start your server locally
npm start

# In another terminal, expose it publicly
ngrok http 3001

# Copy the https URL (e.g., https://abc123.ngrok.io)
```

#### Option B: Deploy to Cloud (Production)
- **Railway**: Connect GitHub, auto-deploy
- **Heroku**: `git push heroku main`  
- **Render**: Connect repo, one-click deploy

### 5. Configure Twilio Webhook

1. **Go to Twilio Console** → Phone Numbers → Manage → Active Numbers
2. **Click your phone number**
3. **In "Voice Configuration"**:
   - Webhook URL: `https://your-domain.com/webhooks/voice`
   - HTTP Method: `POST`
4. **Save configuration**

### 6. Test Your Phone Booking System

1. **Call your Twilio number**
2. **Say something like**: *"Hi, this is John Smith, I'd like a table for 4 people tomorrow at 7 PM"*
3. **Listen for confirmation**
4. **Check your booking system** - the reservation should appear automatically!

## 💰 Pricing

### Twilio Costs
- **Phone number**: ~$1/month
- **Incoming calls**: ~$0.0085/minute
- **Recording**: ~$0.0025/minute
- **Example**: 100 calls/month × 2 min avg = ~$2.50/month

### Mistral AI Costs  
- **Speech-to-text**: ~$0.002/minute
- **AI parsing**: ~$0.001/request
- **Example**: 100 calls/month = ~$0.30/month

**Total estimated cost: ~$4/month for 100 booking calls**

## 🎤 How It Works

```
Customer calls → Twilio answers → AI greeting → 
Customer speaks → Recording sent to Mistral AI →
AI extracts booking info → Confirmation spoken → 
Booking saved to system
```

## 🧪 Testing Examples

### What customers can say:
- *"Hi, I'm Sarah Johnson, I need a table for 2 people this Friday at 6:30 PM"*
- *"Hello, this is Mike, party of 4, tomorrow night around 7"*
- *"Good morning, I'd like to make a reservation for 6 people on Saturday evening"*

### AI will extract:
- **Name**: Sarah Johnson, Mike, etc.
- **Party size**: 2, 4, 6 people
- **Date**: This Friday, tomorrow, Saturday
- **Time**: 6:30 PM, 7 PM, evening

## 🔧 Troubleshooting

### Common Issues:

**"Call doesn't connect"**
- Check webhook URL is correct and publicly accessible
- Verify server is running and responding

**"AI can't understand speech"**  
- Check Mistral API key is valid
- Ensure good phone connection (cellular/landline work better than VoIP)

**"No booking created"**
- Check server logs for AI parsing errors
- Verify booking data structure in console

**"Webhook errors"**
- Use ngrok for local testing
- Check Twilio error logs in console

## 🚀 Advanced Features

### Add to your system later:
- **SMS confirmations**: Send booking confirmations via text
- **Multiple languages**: Support Spanish, French, etc.
- **Cancellations**: Handle "cancel my reservation" calls  
- **Availability checking**: Check real-time table availability
- **CRM integration**: Connect to customer management system

## 📞 Going Live

1. **Test thoroughly** with friends/family calling
2. **Update restaurant materials** with new booking number
3. **Train staff** on the automated system
4. **Monitor call logs** for issues
5. **Collect feedback** and improve AI prompts

Your customers can now call and make reservations 24/7 with AI! 🎉