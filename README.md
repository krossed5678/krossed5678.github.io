Krossed5678 - Local appointment demo
===================================

This repository is a small demo for local appointment booking with a voice-driven UI and an optional server-side proxy to fetch Google Place reviews.

Enabling Google Reviews (optional)
----------------------------------
- The client-side app can fetch real Google Place reviews, but the Google Places API requires a server-side API key for security.
- Start the server proxy located at `server/reviews-proxy.js` (see `server/README.md`) with a valid `GOOGLE_API_KEY`.
- Then edit `app.js` and set `API_BASE = 'http://localhost:3001'` (or your proxy URL). After that, open the Reviews tab and enter your Place ID (for example the one you provided: ChIJid4p4h_f3IARiNsEkKvNGQg) and click "Poll Now".

If you don't run the proxy the app will show simulated reviews instead.

