/* app.js
   Full frontend logic:
   - Tab switching
   - Bookings stored in localStorage (CRUD-lite)
   - System health that actively tests localStorage
   - Simple notifications + UI wiring
*/

const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

// ---------- Basic helpers ----------
function uid(prefix = '') {
  return prefix + Math.random().toString(36).slice(2, 9);
}
function nowISO() { return new Date().toISOString(); }
function friendlyDate(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
}
// format an ISO string into a value suitable for <input type="datetime-local"> (local time)
function formatDateForInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  const YYYY = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const DD = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  return `${YYYY}-${MM}-${DD}T${hh}:${mm}`;
}
function showNotification(msg, type = 'info') {
  const n = document.createElement('div');
  n.className = `fixed top-6 right-6 z-50 p-4 rounded-xl shadow-2xl animate-slide-up max-w-sm ${type === 'success' ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' : type==='error' ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'}`;
  n.innerHTML = `<div class="flex items-center space-x-3"><span class="font-medium">${msg}</span><button onclick="this.closest('div').remove()" class="ml-auto hover:bg-white/20 rounded p-1">✕</button></div>`;
  document.body.appendChild(n);
  setTimeout(() => { n.style.opacity = '0'; setTimeout(()=> n.remove(),300); }, 4500);
}

// ---------- AI-Powered Voice Recognition with Mistral API ----------
// Server-side AI processing for enhanced voice recognition and booking parsing
const API_BASE = 'http://localhost:3001'; // Mistral AI server endpoint

// ---------- Local storage utilities ----------
const LS_KEYS = {
  BOOKINGS: 'ma:bookings:v1',
  LOGS: 'ma:logs:v1',
  REVIEWS: 'ma:reviews:v1',
  REVIEW_REPLIES: 'ma:review_replies:v1'
};
function lsRead(key, fallback = null) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch (e) {
    console.error('lsRead error', e);
    return fallback;
  }
}
function lsWrite(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error('lsWrite error', e);
    return false;
  }
}
function lsRemove(key) {
  try { localStorage.removeItem(key); return true; } catch (e) { return false; }
}

// ---------- Bookings logic (stored in localStorage) ----------
function getBookings() {
  return lsRead(LS_KEYS.BOOKINGS, []);
}
function saveBookings(bookings) {
  return lsWrite(LS_KEYS.BOOKINGS, bookings);
}
function addBooking(data) {
  const bookings = getBookings();
  const b = {
    id: (bookings.length ? Math.max(...bookings.map(x => x.id || 0)) + 1 : 1),
    created_at: nowISO(),
    customer_name: data.customer_name || 'Unnamed',
    notes: data.notes || '',
    party_size: data.party_size || 1,
    start_time: data.start_time || null,
    end_time: data.end_time || null,
    status: data.status || 'pending'
  };
  bookings.unshift(b);
  saveBookings(bookings);
  addLog({ type: 'info', source: 'Bookings', text: `Booking created: ${b.customer_name}`, timestamp: nowISO() });
  return b;
}

// ---------- Logs (simple) ----------
function getLogs() { return lsRead(LS_KEYS.LOGS, []); }
function saveLogs(logs) { return lsWrite(LS_KEYS.LOGS, logs); }
function addLog(entry) {
  const logs = getLogs();
  logs.unshift({ id: uid('log_'), ...entry });
  // keep a reasonable cap
  saveLogs(logs.slice(0, 200));
}

// ---------- Rendering helpers ----------
function renderRecentBookings() {
  const recentNode = $('#recent-bookings');
  recentNode.innerHTML = '';
  const bookings = getBookings();
  if (!bookings.length) {
    recentNode.innerHTML = `<div class="text-center text-gray-500 py-8">No recent bookings</div>`;
    return;
  }
  bookings.slice(0,6).forEach(b => {
    const el = document.createElement('div');
    el.className = 'p-3 bg-white rounded-xl border border-gray-100 hover:shadow-lg transition-all cursor-pointer';
    el.innerHTML = `<div class="font-semibold text-gray-800">${b.customer_name}</div>
                    <div class="text-xs text-gray-500">${friendlyDate(b.start_time)} • Party of ${b.party_size}</div>`;
    el.onclick = () => {
      showNotification(`Selected: ${b.customer_name}`, 'info');
    };
    recentNode.appendChild(el);
  });
}

function renderBookingsList() {
  const list = $('#bookings-list');
  list.innerHTML = '';
  const bookings = getBookings();
  if (!bookings.length) {
    list.innerHTML = `<div class="text-center text-gray-500 py-12">No bookings yet</div>`;
    return;
  }
  bookings.forEach((b, i) => {
    const card = document.createElement('div');
    card.className = 'p-6 bg-white rounded-xl border border-gray-100 hover:shadow-xl transition-all';
    card.innerHTML = `
      <div class="flex items-center justify-between mb-4">
        <div>
          <div class="font-bold text-gray-800 text-lg">${b.customer_name}</div>
          <div class="text-sm text-gray-500">Booking #${b.id} • ${friendlyDate(b.created_at)}</div>
        </div>
        <span class="px-3 py-1 rounded-full text-sm font-medium ${b.status==='confirmed'?'bg-green-100 text-green-800':'bg-yellow-100 text-yellow-800'}">${b.status}</span>
      </div>
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div><div class="text-xs text-gray-500 uppercase tracking-wide font-semibold">Start</div><div class="text-sm font-medium text-gray-800">${friendlyDate(b.start_time)}</div></div>
        <div><div class="text-xs text-gray-500 uppercase tracking-wide font-semibold">End</div><div class="text-sm font-medium text-gray-800">${friendlyDate(b.end_time)}</div></div>
      </div>
      <div class="flex items-center justify-between">
        <div class="text-sm text-gray-600">Party of ${b.party_size}</div>
        <div class="flex space-x-2">
          <button class="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg" data-action="edit" data-id="${b.id}">Edit</button>
          <button class="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-lg" data-action="cancel" data-id="${b.id}">Cancel</button>
        </div>
      </div>
    `;
    list.appendChild(card);
  });

  // attach handlers (delegation is fine for this small page)
  list.querySelectorAll('button[data-action]').forEach(btn => {
    btn.onclick = (ev) => {
      const id = Number(btn.dataset.id);
      const action = btn.dataset.action;
      const bookings = getBookings();
      const idx = bookings.findIndex(x => x.id === id);
      if (idx === -1) return;
      if (action === 'cancel') {
        bookings[idx].status = 'cancelled';
        saveBookings(bookings);
        showNotification('Booking cancelled', 'error');
        renderRecentBookings(); renderBookingsList();
      } else if (action === 'edit') {
        // simple inline quick edit: fill form and switch to bookings tab
        const b = bookings[idx];
        $('#b-name').value = b.customer_name;
        $('#b-notes').value = b.notes || '';
        $('#b-party').value = b.party_size || 1;
        $('#b-start').value = b.start_time ? formatDateForInput(b.start_time) : '';
        $('#b-end').value = b.end_time ? formatDateForInput(b.end_time) : '';
        showNotification('Booking loaded into form (edit then create to add new)', 'info');
        showTab('bookings');
      }
    };
  });
}

function renderLogs() {
  const node = $('#logs-list');
  node.innerHTML = '';
  const logs = getLogs();
  if (!logs.length) {
    node.innerHTML = `<div class="text-center text-gray-500 py-12">No logs available</div>`;
    return;
  }
  logs.slice(0, 80).forEach(l => {
    const el = document.createElement('div');
    el.className = 'p-3 bg-white rounded-xl border border-gray-100';
    el.innerHTML = `<div class="text-sm text-gray-800 font-semibold">${l.source || 'System'} • ${l.type || 'info'}</div>
                    <div class="text-xs text-gray-500">${friendlyDate(l.timestamp)}</div>
                    <div class="mt-2 text-sm text-gray-700">${l.text}</div>`;
    node.appendChild(el);
  });
}

// ---------- Reviews: storage, polling, generation ----------
function getReviews() { return lsRead(LS_KEYS.REVIEWS, []); }
function saveReviews(r) { return lsWrite(LS_KEYS.REVIEWS, r); }
function getReviewReplies() { return lsRead(LS_KEYS.REVIEW_REPLIES, []); }
function saveReviewReplies(r) { return lsWrite(LS_KEYS.REVIEW_REPLIES, r); }

// Simple review renderer
function renderReviews() {
  const node = $('#reviews-list');
  if (!node) return;
  node.innerHTML = '';
  const reviews = getReviews();
  if (!reviews.length) { node.innerHTML = '<div class="text-gray-500 text-sm py-6 text-center">No reviews yet</div>'; return; }
  reviews.slice(0,200).forEach((rv, idx) => {
    const el = document.createElement('div');
    el.className = 'p-3 bg-white rounded-lg border list-item';
    el.innerHTML = `<div class="flex justify-between items-start"><div><div class="font-semibold text-gray-800">${rv.author_name || 'Guest'}</div><div class="text-xs text-gray-500">${rv.rating||0} ★ • ${friendlyDate(rv.time)}</div></div><div class="text-sm text-gray-700">${rv.text || ''}</div></div>`;
    node.appendChild(el);
    // staggered show animation
    setTimeout(() => el.classList.add('show'), 30 + (idx * 30));
  });
}

function renderReviewReplies() {
  const node = $('#reviews-replies'); if (!node) return;
  node.innerHTML = '';
  const replies = getReviewReplies();
  if (!replies.length) { node.innerHTML = '<div class="text-gray-500 text-sm py-6 text-center">No replies generated yet</div>'; return; }
  replies.slice(0,200).forEach(r => {
    const el = document.createElement('div');
    el.className = 'p-3 bg-white rounded-lg border list-item';
    el.innerHTML = `<div class="text-xs text-gray-500">To: ${r.review_author || 'Guest'} • ${friendlyDate(r.created_at)}</div><div class="mt-2 text-sm text-gray-800">${r.reply}</div>`;
    node.appendChild(el);
    setTimeout(() => el.classList.add('show'), 30 + (Math.random() * 120));
  });
}

// Simulate fetching reviews when no backend/API is configured.
function simulateFetchReviews() {
  // Generate 3-5 realistic demo reviews with varied ratings and content
  const names = ['Patricia M.', 'Tom R.', 'Sarah L.', 'Mike D.', 'Jennifer K.', 'David W.', 'Lisa C.', 'James P.'];
  const positiveReviews = [
    'Amazing service and lovely food! Will definitely come back.',
    'Excellent experience from start to finish. Highly recommend!',
    'Great atmosphere and the staff was so friendly.',
    'Best meal I\'ve had in a long time. Perfect for date night.',
    'Outstanding quality and wonderful presentation.'
  ];
  const neutralReviews = [
    'Good food but service was a bit slow during peak hours.',
    'Nice place, decent food. Could use some improvements.',
    'Average experience overall. Nothing special but not bad either.'
  ];
  const negativeReviews = [
    'Waited too long and the steak was overcooked.',
    'Disappointing experience. Food was cold when it arrived.',
    'Poor service and overpriced for what you get.',
    'Had to wait 45 minutes just to get seated.'
  ];

  const numReviews = 3 + Math.floor(Math.random() * 3); // 3-5 reviews
  const sample = [];
  
  for (let i = 0; i < numReviews; i++) {
    const rating = Math.random() < 0.6 ? (4 + Math.floor(Math.random() * 2)) : // 60% chance of 4-5 stars
                   Math.random() < 0.7 ? 3 : // 28% chance of 3 stars
                   (1 + Math.floor(Math.random() * 2)); // 12% chance of 1-2 stars
    
    let reviewText;
    if (rating >= 4) reviewText = positiveReviews[Math.floor(Math.random() * positiveReviews.length)];
    else if (rating === 3) reviewText = neutralReviews[Math.floor(Math.random() * neutralReviews.length)];
    else reviewText = negativeReviews[Math.floor(Math.random() * negativeReviews.length)];

    const dayOffset = Math.floor(Math.random() * 30); // Reviews from last 30 days
    const reviewDate = new Date(Date.now() - dayOffset * 24 * 60 * 60 * 1000);
    
    sample.push({
      id: uid('rev_'),
      author_name: names[Math.floor(Math.random() * names.length)],
      rating: rating,
      text: reviewText,
      time: reviewDate.toISOString()
    });
  }
  
  return Promise.resolve(sample);
}

// Attempt to fetch reviews from Google Places Reviews via Places API (requires API key/server proxy).
// We keep this optional: if no place id or network access, fall back to simulateFetchReviews.
async function fetchReviewsForPlace(placeId) {
  // Client-side only: always use simulated reviews
  // This creates realistic demo data for any place ID entered
  return simulateFetchReviews();
}

// Reply generator: craft a thoughtful reply based on rating and text heuristics
function generateReplyForReview(review) {
  const r = review.rating || 0;
  const text = (review.text || '').toLowerCase();
  let reply = '';
  if (r >= 4) {
    reply = `Hi ${review.author_name || 'there'}, thank you so much for your ${r}-star review! We're thrilled you enjoyed your experience. We hope to welcome you again soon.`;
    if (/amazing|love|excellent|great|best/.test(text)) reply += ' Your kind words mean a lot to our team.';
  } else if (r === 3) {
    reply = `Hi ${review.author_name || 'there'}, thanks for your feedback. We're glad some parts of your visit were good, and we'd love to learn how we can make it even better.`;
  } else {
    reply = `Hi ${review.author_name || 'there'}, I'm sorry to hear about your experience. Thank you for letting us know — we'd like to make this right. Could you share more details or contact us so we can follow up?`;
    if (/wait|slow|long/.test(text)) reply += ' We apologize for any wait time — we are reviewing staffing and service flow.';
    if (/overcook|cold|undercook|burnt|raw/.test(text)) reply += ' We take food quality seriously and will investigate with the kitchen team.';
  }
  return reply;
}

// Polling controller
let reviewsInterval = null;
async function pollReviewsNow() {
  const placeId = $('#reviews-placeid') ? $('#reviews-placeid').value.trim() : '';
  const items = await fetchReviewsForPlace(placeId);
  // merge into existing reviews store by id
  const existing = getReviews();
  const map = new Map(existing.map(x => [x.id, x]));
  const newOnes = [];
  items.forEach(it => {
    // normalize id
    const id = it.id || it.review_id || uid('rev_');
    if (!map.has(id)) {
      const rv = { id, author_name: it.author_name || it.author || 'Guest', rating: it.rating || it.stars || 0, text: it.text || it.review || '', time: it.time || nowISO() };
      existing.unshift(rv);
      newOnes.push(rv);
    }
  });
  saveReviews(existing.slice(0, 500));
  renderReviews();

  // For each new review, generate a reply and save it
  const replies = getReviewReplies();
  newOnes.forEach(nr => {
    const replyText = generateReplyForReview(nr);
    replies.unshift({ id: uid('rpl_'), review_id: nr.id, review_author: nr.author_name, reply: replyText, created_at: nowISO() });
  });
  saveReviewReplies(replies.slice(0, 500));
  renderReviewReplies();
}

function startReviewPolling(intervalMinutes = 5) {
  if (reviewsInterval) clearInterval(reviewsInterval);
  // poll immediately then every interval
  pollReviewsNow();
  reviewsInterval = setInterval(pollReviewsNow, Math.max(1, intervalMinutes) * 60 * 1000);
  showNotification('Review polling started', 'success');
}

function stopReviewPolling() {
  if (reviewsInterval) { clearInterval(reviewsInterval); reviewsInterval = null; showNotification('Review polling stopped', 'info'); }
}

// wire up buttons (safe if elements not present)
setTimeout(() => {
  const start = $('#reviews-start');
  const stop = $('#reviews-stop');
  const poll = $('#reviews-poll-now');
  if (start) start.onclick = () => { const iv = Number($('#reviews-interval').value) || 5; startReviewPolling(iv); };
  if (stop) stop.onclick = () => stopReviewPolling();
  if (poll) poll.onclick = () => pollReviewsNow();
  // initial render if reviews section present
  renderReviews(); renderReviewReplies();
}, 400);

function renderStaff(staff = []) {
  const node = $('#staff-list');
  node.innerHTML = '';
  if (!staff.length) {
    node.innerHTML = `<div class="text-center text-gray-500 py-12">No staff members</div>`;
    return;
  }
  staff.forEach((s, i) => {
    const el = document.createElement('div');
    el.className = 'p-6 bg-white rounded-2xl border border-gray-100';
    el.innerHTML = `<div class="flex items-center space-x-4 mb-4">
      <div class="w-16 h-16 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold">${s.name.charAt(0).toUpperCase()}</div>
      <div class="flex-1"><div class="font-bold text-gray-800">${s.name}</div><div class="text-sm text-gray-600">${s.role || 'Staff'}</div></div>
      <div class="status-indicator ${s.standby ? 'status-online' : 'status-warning'}"><span class="text-xs">${s.standby ? 'ON STANDBY' : 'OFF DUTY'}</span></div>
    </div>`;
    node.appendChild(el);
  });
}

// ---------- Tab switching ----------
function showTab(name) {
  // buttons
  $$('.nav-tab').forEach(btn => btn.classList.remove('active'));
  const btn = $(`#btn-${name}`);
  if (btn) btn.classList.add('active');

  // sections
  ['dashboard','bookings','staff','logs','reviews'].forEach(s => {
    const el = document.getElementById(s);
    if (!el) return;
    if (s === name) {
      el.classList.remove('hidden');
      el.style.opacity = '0';
      setTimeout(() => { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; }, 30);
    } else {
      el.classList.add('hidden');
    }
  });
}

// attach nav listeners
$('#btn-dashboard').onclick = () => showTab('dashboard');
$('#btn-bookings').onclick = () => showTab('bookings');
$('#btn-staff').onclick = () => showTab('staff');
$('#btn-logs').onclick = () => showTab('logs');
$('#btn-reviews').onclick = () => showTab('reviews');

// hamburger mobile nav toggle (simple)
$('#hamburger').onclick = () => {
  // create overlay if missing
  let ov = document.getElementById('mobile-nav-overlay');
  if (!ov) {
    ov = document.createElement('div'); ov.id = 'mobile-nav-overlay';
    ov.className = 'fixed inset-0 bg-black/50 z-50 flex items-start p-6 mobile-nav-overlay';
    ov.innerHTML = `
      <div class="bg-white rounded-xl p-4 w-full max-w-xs">
        <div class="flex flex-col space-y-2">
          <button id="m-dashboard" class="px-4 py-2 text-left">Dashboard</button>
          <button id="m-bookings" class="px-4 py-2 text-left">Bookings</button>
          <button id="m-staff" class="px-4 py-2 text-left">Staff</button>
          <button id="m-logs" class="px-4 py-2 text-left">Logs</button>
          <button id="m-reviews" class="px-4 py-2 text-left">Reviews</button>
          <button id="m-close" class="mt-3 px-4 py-2 bg-gray-100 rounded">Close</button>
        </div>
      </div>`;
    document.body.appendChild(ov);
    // animate hamburger to X
    const ham = document.querySelector('#hamburger .hamburger');
    if (ham) ham.classList.add('open');
    // wire mobile buttons
    $('#m-dashboard').onclick = () => { showTab('dashboard'); ov.remove(); };
    $('#m-bookings').onclick = () => { showTab('bookings'); ov.remove(); };
    $('#m-staff').onclick = () => { showTab('staff'); ov.remove(); };
    $('#m-logs').onclick = () => { showTab('logs'); ov.remove(); };
    $('#m-reviews').onclick = () => { showTab('reviews'); ov.remove(); };
    $('#m-close').onclick = () => ov.remove();
    // when overlay removed, ensure hamburger returns
    const obs = new MutationObserver(() => {
      if (!document.getElementById('mobile-nav-overlay')) {
        if (ham) ham.classList.remove('open');
        obs.disconnect();
      }
    });
    obs.observe(document.body, { childList: true, subtree: false });
  } else {
    ov.remove();
    const ham = document.querySelector('#hamburger .hamburger'); if (ham) ham.classList.remove('open');
  }
};

// FAB goes to bookings
$('#fab').onclick = () => { showTab('bookings'); setTimeout(()=> $('#b-name').focus(), 250); };

// ---------- Booking form handling ----------
$('#booking-form').onsubmit = async (ev) => {
  ev.preventDefault();
  const btn = ev.target.querySelector('button[type="submit"]');
  const orig = btn.innerHTML;
  btn.innerHTML = 'Creating...';
  btn.disabled = true;

  try {
    const payload = {
      customer_name: $('#b-name').value.trim() || 'Guest',
      notes: $('#b-notes').value.trim(),
      party_size: Number($('#b-party').value) || 1,
    };
    const st = $('#b-start').value;
    const et = $('#b-end').value;
    if (st) payload.start_time = new Date(st).toISOString();
    if (et) payload.end_time = new Date(et).toISOString();

    // Try backend first, fallback to local
    try {
      await apiPost('/api/bookings', payload);
      showNotification('Saved to backend (if available)', 'success');
    } catch (e) {
      // fallback
      const b = addBooking(payload);
      showNotification(`Saved locally: ${b.customer_name}`, 'success');
    }
    // re-render
    renderRecentBookings();
    renderBookingsList();
    $('#booking-form').reset();
  } catch (err) {
    console.error(err);
    showNotification('Error creating booking', 'error');
  } finally {
    setTimeout(()=> { btn.innerHTML = orig; btn.disabled = false; }, 600);
  }
};

// voice-fill hooks (simple)
$('#voice-fill').onclick = () => $('#start-voice').click();

// ---------- Simple voice/TTS (kept minimal) ----------
let recognition = null;
$('#start-voice').onclick = () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) { showNotification('SpeechRecognition not supported', 'error'); return; }
  recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.continuous = false;
  recognition.onstart = () => { $('#recognized').textContent = 'Listening...'; $('#start-voice').textContent = 'Listening...'; };
  recognition.onresult = async (ev) => {
    const t = ev.results[0][0].transcript;
    // show interim in UI
    const short = t.length > 80 ? t.slice(0,77) + '...' : t;
    const rEl = document.getElementById('recognized'); if (rEl) rEl.textContent = short;
    const r2 = document.getElementById('recognized-summary'); if (r2) r2.textContent = short;

    // Try to parse and create a booking from the recognized text
    try {
      await createBookingFromSpeech(t);
    } catch (err) {
      console.error('Speech booking failed', err);
      showNotification('Failed to create booking from speech', 'error');
    }
  };
  recognition.onend = () => { $('#start-voice').textContent = 'Start Listening'; };
  recognition.onerror = (ev) => { showNotification('Recognition error: ' + ev.error, 'error'); };
  recognition.start();
};
$('#stop-voice').onclick = () => { if (recognition) recognition.stop(); };
$('#speak-sample').onclick = async () => {
  const utter = new SpeechSynthesisUtterance('Hello, this is the manager assistant. Local storage is being checked regularly.');
  window.speechSynthesis.speak(utter);
};

// ---------- Health: actively test localStorage every few seconds ----------
const HEALTH = {
  lastChecked: null,
  localStorageOK: false,
  lastError: null
};

function testLocalStorage() {
  const TEST_KEY = 'ma:health:test';
  try {
    const payload = { t: nowISO(), id: uid('test_') };
    localStorage.setItem(TEST_KEY, JSON.stringify(payload));
    const readback = JSON.parse(localStorage.getItem(TEST_KEY));
    localStorage.removeItem(TEST_KEY);

    if (!readback || readback.id !== payload.id) {
      throw new Error('mismatch or corrupt');
    }
    HEALTH.lastChecked = new Date();
    HEALTH.localStorageOK = true;
    HEALTH.lastError = null;
    addLog({ type: 'success', source: 'Health', text: 'localStorage test passed', timestamp: nowISO() });
  } catch (e) {
    HEALTH.lastChecked = new Date();
    HEALTH.localStorageOK = false;
    HEALTH.lastError = e.message || String(e);
    addLog({ type: 'error', source: 'Health', text: 'localStorage test failed: ' + HEALTH.lastError, timestamp: nowISO() });
    console.warn('localStorage health test failed', e);
  }
  renderHealthCards();
}

let healthInterval = null;
function startHealthChecks(intervalMs = 3000) {
  if (healthInterval) clearInterval(healthInterval);
  testLocalStorage();
  healthInterval = setInterval(testLocalStorage, intervalMs);
}

function renderHealthCards() {
  const container = $('#health-cards');
  container.innerHTML = '';

  // local storage card
  const lsOk = HEALTH.localStorageOK;
  const lsCard = document.createElement('div');
  lsCard.className = `metric-card p-6 rounded-2xl text-white ${lsOk ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-red-500 to-red-600'}`;
  lsCard.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">🔒</div>
      <div class="status-indicator ${lsOk ? 'status-online' : 'status-offline'}"><span class="text-xs font-medium">${lsOk ? 'ONLINE' : 'ERROR'}</span></div>
    </div>
    <h3 class="text-lg font-bold mb-1">Local Storage</h3>
    <p class="text-sm opacity-80">${lsOk ? 'Read/write OK' : 'Read/write failed'}</p>
    <div class="mt-3 text-xs">${HEALTH.lastChecked ? 'Last: ' + HEALTH.lastChecked.toLocaleTimeString() : ''}</div>
    ${HEALTH.lastError ? `<div class="mt-2 text-xs bg-black/10 p-2 rounded">${HEALTH.lastError}</div>` : ''}
  `;
  container.appendChild(lsCard);

  // add a "bookings storage" card (shows counts)
  const bookings = getBookings();
  const bCard = document.createElement('div');
  bCard.className = 'metric-card p-6 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white';
  bCard.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">📚</div>
      <div class="status-indicator ${bookings.length ? 'status-online' : 'status-warning'}"><span class="text-xs font-medium">${bookings.length ? 'STORED' : 'EMPTY'}</span></div>
    </div>
    <h3 class="text-lg font-bold mb-1">Bookings Storage</h3>
    <p class="text-sm opacity-80">${bookings.length} booking(s) saved</p>
    <div class="mt-3 text-xs">Last checked: ${HEALTH.lastChecked ? HEALTH.lastChecked.toLocaleTimeString() : '—'}</div>
  `;
  container.appendChild(bCard);

  // backend card (attempt to call /health once if API_BASE is configured)
  const backendCard = document.createElement('div');
  backendCard.className = 'metric-card p-6 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 text-white';
  backendCard.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">🔌</div>
      <div class="status-indicator status-warning"><span class="text-xs font-medium">UNKNOWN</span></div>
    </div>
    <h3 class="text-lg font-bold mb-1">Backend Server</h3>
    <p class="text-sm opacity-80">No backend configured (local-only)</p>
  `;
  container.appendChild(backendCard);

  // update small client status indicator
  $('#client-text').textContent = HEALTH.localStorageOK ? `Local storage healthy • ${HEALTH.lastChecked ? HEALTH.lastChecked.toLocaleTimeString() : ''}` : `Storage failing • ${HEALTH.lastChecked ? HEALTH.lastChecked.toLocaleTimeString() : ''}`;
  $('#client-dot').className = HEALTH.localStorageOK ? 'w-2 h-2 bg-green-400 rounded-full animate-pulse' : 'w-2 h-2 bg-red-400 rounded-full animate-pulse';
}

// Manual refresh handlers
$('#refresh-health').onclick = () => testLocalStorage();
$('#refresh-all').onclick = () => {
  renderRecentBookings();
  renderBookingsList();
  renderLogs();
  renderStaff([]);
  showNotification('Refreshed (local) data', 'success');
};

// ---------- Small UX wiring ----------
$('#start-sim').onclick = () => { showNotification('Simulator started (mock)', 'info'); addLog({type:'info', source:'Simulator', text:'Simulator started', timestamp: nowISO()}); renderLogs(); };
$('#finalize').onclick = () => { showNotification('Finalize triggered (mock)', 'info'); addLog({type:'info', source:'System', text:'Bookings finalized (mock)', timestamp: nowISO()}); renderLogs(); };

$('#protocol-instructions').onclick = (e) => {
  e.preventDefault();
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 overlay-blur flex items-center justify-center z-50 p-4';
  modal.innerHTML = `
    <div class="card-premium rounded-2xl p-8 max-w-2xl w-full">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-2xl font-bold text-gray-800">Protocol Setup Instructions</h3>
        <button id="close-modal" class="w-10 h-10 bg-gray-100 rounded-xl">✕</button>
      </div>
      <div class="space-y-4">
        <p class="text-gray-700">This is a local prototype. To enable a backend, set <code>API_BASE</code> in <code>app.js</code> to your server URL and implement the endpoints.</p>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  $('#close-modal').onclick = () => modal.remove();
};

// remove fallback message on JS load
setTimeout(()=> {
  const f = $('#fallback-visible');
  if (f) f.remove();
}, 750);

// keyboard shortcuts
document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey) {
    if (e.key === '1') { e.preventDefault(); showTab('dashboard'); }
    if (e.key === '2') { e.preventDefault(); showTab('bookings'); }
    if (e.key === '3') { e.preventDefault(); showTab('staff'); }
    if (e.key === '4') { e.preventDefault(); showTab('logs'); }
    if (e.key.toLowerCase() === 'r') { e.preventDefault(); $('#refresh-all').click(); }
  }
});

// ---------- Initialize UI ----------
(function init() {
  // seed logs if empty
  if (!getLogs().length) {
    addLog({ type: 'info', source: 'System', text: 'System started', timestamp: nowISO() });
    addLog({ type: 'info', source: 'Health', text: 'Initial health check queued', timestamp: nowISO() });
    renderLogs();
  }

  renderRecentBookings();
  renderBookingsList();
  renderLogs();
  renderStaff([]);

  // start health checks
  startHealthChecks(3000);

  // load dashboard tab by default
  showTab('dashboard');

  showNotification('Manager Assistant loaded (local mode)', 'success');
})();
// ---------- Voice booking parsing + confirm TTS ----------
function speakText(text) {
  try {
    const u = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch (e) { console.warn('TTS failed', e); }
}

function parseBookingCommand(text) {
  if (!text || !text.trim()) return null;
  const raw = String(text).trim();
  const lower = raw.toLowerCase();

  // determine base date (today / tomorrow)
  const base = new Date();
  if (/tomorrow/.test(lower)) base.setDate(base.getDate() + 1);

  // helper: parse a time expression like '9', '9:00', '9 am', '12pm', 'noon', 'midnight', 'in the morning'
  function parseTimeFragment(fragment, refDate) {
    fragment = fragment.trim();
    if (!fragment) return null;
    const f = fragment.toLowerCase();
    const d = new Date(refDate.getTime());

    if (/noon/.test(f)) { d.setHours(12,0,0,0); return d; }
    if (/midnight/.test(f)) { d.setHours(0,0,0,0); return d; }

    // look for explicit hh:mm or hh
    let m = f.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (m) {
      let hh = Number(m[1]);
      const mm = m[2] ? Number(m[2]) : 0;
      const ampm = m[3];
      if (ampm) {
        if (/pm/i.test(ampm) && hh < 12) hh += 12;
        if (/am/i.test(ampm) && hh === 12) hh = 0;
      }
      d.setHours(hh, mm, 0, 0);
      return d;
    }

    // phrases: "in the morning" -> assume 9:00, "in the afternoon" -> 15:00, "in the evening" -> 19:00
    if (/morning/.test(f)) { d.setHours(9,0,0,0); return d; }
    if (/afternoon/.test(f)) { d.setHours(15,0,0,0); return d; }
    if (/evening/.test(f)) { d.setHours(19,0,0,0); return d; }

    return null;
  }

  // name extraction: prefer "my name is X", "this is X", or "this is X and I'd like" patterns
  let name = null;
  let m = raw.match(/(?:my name is|this is|i am|i'm)\s+([A-Za-z][A-Za-z'\-\.]+(?:\s+[A-Za-z'\-\.]+){0,3})/i);
  if (m) name = m[1].trim();
  if (!name) {
    // try 'for NAME' but ensure it's not 'for 2 people' or 'for 9 am'
    m = raw.match(/for\s+([A-Za-z][A-Za-z'\-\.]+(?:\s+[A-Za-z'\-\.]+){0,3})/i);
    if (m && !/\d/.test(m[1])) name = m[1].trim();
  }
  if (!name) name = 'Guest';

  // party size
  let party = 1;
  m = raw.match(/party of\s*(\d{1,2})/i) || raw.match(/for\s*(\d{1,2})\s*(people|persons)/i) || raw.match(/(\d{1,2})\s*people/i);
  if (m) party = Number(m[1]);

  // times: prefer explicit "from X to Y" ranges, else look for single time and optional duration
  let startDate = null;
  let endDate = null;

  // look for 'from X to Y' or 'between X and Y'
  m = raw.match(/(?:from|between)\s+([^,;]+?)\s+(?:to|and)\s+([^,;]+?)(?:\s|\.|,|$)/i);
  if (m) {
    const partA = m[1].trim();
    const partB = m[2].trim();
    const a = parseTimeFragment(partA, base);
    const b = parseTimeFragment(partB, base);
    if (a) startDate = a;
    if (b) endDate = b;
  }

  // fallback: look for a single 'at X' or just 'X am/pm' occurrence (take first match)
  if (!startDate) {
    m = raw.match(/(?:at\s*)?(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i) || raw.match(/(noon|midnight|in the morning|in the afternoon|in the evening)/i);
    if (m) {
      const frag = m[1] || m[0];
      const a = parseTimeFragment(frag, base);
      if (a) startDate = a;
    }
  }

  // if we have a start but no explicit end, try duration e.g. 'for 2 hours' or default +2h
  if (startDate && !endDate) {
    m = raw.match(/for\s*(\d+)\s*(hour|hours|hr|hrs)/i) || raw.match(/for\s*(\d+)\s*(min|mins|minute|minutes)/i);
    if (m) {
      const val = Number(m[1]);
      const unit = m[2];
      const e = new Date(startDate.getTime());
      if (/hour|hr/.test(unit)) e.setHours(e.getHours() + val);
      else e.setMinutes(e.getMinutes() + val);
      endDate = e;
    } else {
      const e = new Date(startDate.getTime()); e.setHours(e.getHours() + 3); endDate = e; // default to 3h so edits show a clear range
    }
  }

  // final fallback: if neither parsed, set default 19:00-21:00
  if (!startDate) {
    const sd = new Date(base.getTime()); sd.setHours(19,0,0,0); startDate = sd;
  }
  if (!endDate) {
    const ed = new Date(startDate.getTime()); ed.setHours(startDate.getHours() + 3, 0, 0, 0); endDate = ed;
  }

  // ensure end is after start; if not, add 2 hours
  if (endDate <= startDate) {
    const ed = new Date(startDate.getTime()); ed.setHours(startDate.getHours() + 2); endDate = ed;
  }

  return {
    customer_name: name,
    party_size: party,
    start_time: startDate.toISOString(),
    end_time: endDate.toISOString(),
    notes: raw
  };
}

async function createBookingFromSpeech(text) {
  const payload = parseBookingCommand(text);
  if (!payload) {
    showNotification('Could not parse booking from speech', 'error');
    return null;
  }

  // save via existing addBooking (stores into LS_KEYS.BOOKINGS)
  const b = addBooking(payload);
  renderRecentBookings(); renderBookingsList(); renderLogs();

  const when = new Date(b.start_time).toLocaleString();
  const confirmText = `Created booking for ${b.customer_name}, party of ${b.party_size}, on ${when}. Saved locally.`;
  speakText(confirmText);
  showNotification(confirmText, 'success');

  // update small UI recognized displays
  const short = text.length > 80 ? text.slice(0,77) + '...' : text;
  const rEl = document.getElementById('recognized'); if (rEl) rEl.textContent = short;
  const r2 = document.getElementById('recognized-summary'); if (r2) r2.textContent = short;

  return b;
}

// Remove legacy DOM table population and duplicate load functions.
// We rely on renderBookingsList / renderRecentBookings for UI updates.

// Ensure recognition result handling is safe: when recognition exists, call createBookingFromSpeech
// (The click handler that creates recognition above will trigger onresult, which will call this.)
// If recognition is not present, do nothing here.
