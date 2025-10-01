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
    phone_number: data.phone_number || '',
    notes: data.notes || '',
    party_size: data.party_size || 1,
    start_time: data.start_time || null,
    end_time: data.end_time || null,
    status: data.status || 'pending'
  };
  bookings.unshift(b);
  saveBookings(bookings);
  addLog({ type: 'info', source: 'Bookings', text: `Booking created: ${b.customer_name} (${b.phone_number})`, timestamp: nowISO() });
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
                    <div class="text-xs text-gray-500">${b.phone_number ? b.phone_number + ' • ' : ''}${friendlyDate(b.start_time)} • Party of ${b.party_size}</div>`;
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
        $('#b-phone').value = b.phone_number || '';
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
      phone_number: $('#b-phone').value.trim() || '',
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

// ---------- Mistral AI Voice Recognition ----------
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;

$('#start-voice').onclick = async () => {
  console.log('🎤 Voice button clicked');
  
  if (isRecording) {
    console.log('⏹️ Stopping current recording...');
    stopRecording();
    return;
  }
  
  try {
    console.log('🔍 Checking server health...');
    // Check if server is available
    const healthCheck = await fetch(`${API_BASE}/health`);
    console.log('🏥 Health check response:', {
      status: healthCheck.status,
      ok: healthCheck.ok
    });
    
    if (!healthCheck.ok) {
      console.error('❌ Server health check failed');
      showNotification('AI server not available - check if server is running', 'error');
      return;
    }
    console.log('✅ Server is healthy');

    console.log('🎤 Requesting microphone access...');
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log('✅ Microphone access granted');
    
    startRecording(stream);
  } catch (error) {
    console.error('❌ === MICROPHONE ACCESS ERROR ===');
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    console.error('❌ === END MICROPHONE ACCESS ERROR ===');
    showNotification('Microphone access denied or not available', 'error');
  }
};

function startRecording(stream) {
  console.log('🎬 Starting recording session...');
  console.log('📡 Stream details:', {
    active: stream.active,
    audioTracks: stream.getAudioTracks().length,
    videoTracks: stream.getVideoTracks().length
  });
  
  audioChunks = [];
  mediaRecorder = new MediaRecorder(stream, {
    mimeType: 'audio/webm;codecs=opus'
  });
  
  console.log('📹 MediaRecorder created:', {
    mimeType: mediaRecorder.mimeType,
    state: mediaRecorder.state
  });

  mediaRecorder.ondataavailable = (event) => {
    console.log('📊 Audio chunk received:', {
      size: event.data.size,
      type: event.data.type
    });
    if (event.data.size > 0) {
      audioChunks.push(event.data);
    }
  };

  mediaRecorder.onstop = async () => {
    console.log('⏹️ Recording stopped, processing audio...');
    console.log('📊 Total chunks collected:', audioChunks.length);
    
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    console.log('🎵 Audio blob created:', {
      size: audioBlob.size,
      type: audioBlob.type
    });
    
    await processAudioWithMistral(audioBlob);
    
    console.log('🎤 Stopping media tracks...');
    stream.getTracks().forEach(track => {
      console.log('🔇 Stopping track:', track.kind, track.label);
      track.stop();
    });
    console.log('✅ All tracks stopped');
  };

  console.log('▶️ Starting MediaRecorder...');
  mediaRecorder.start();
  isRecording = true;
  console.log('✅ Recording started successfully');
  
  $('#start-voice').textContent = '🔴 Stop Recording';
  $('#recognized').textContent = 'Recording... Speak your booking request';
  showNotification('Recording started - speak your booking request', 'info');
}

function stopRecording() {
  if (mediaRecorder && isRecording) {
    mediaRecorder.stop();
    isRecording = false;
    $('#start-voice').textContent = 'Start AI Voice';
    $('#recognized').textContent = 'Processing with Mistral AI...';
  }
}

async function processAudioWithMistral(audioBlob) {
  try {
    console.log('🎵 Starting audio processing with Mistral AI...');
    console.log('Audio blob details:', {
      size: audioBlob.size,
      type: audioBlob.type
    });
    
    showNotification('🤖 Having a conversation with Mistral AI...', 'info');
    
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    console.log('📤 Sending audio to server:', `${API_BASE}/api/conversation`);

    const response = await fetch(`${API_BASE}/api/conversation`, {
      method: 'POST',
      body: formData
    });

    console.log('📡 Server response status:', response.status);
    console.log('📡 Server response headers:', Object.fromEntries(response.headers));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Server returned error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`AI conversation failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Received conversation result:', result);
    
    // Display what customer said
    const short = result.transcription.length > 80 ? 
      result.transcription.slice(0,77) + '...' : result.transcription;
    $('#recognized').textContent = `You: ${short}`;
    console.log('📝 Transcription:', result.transcription);
    
    // Speak the AI's response
    if (result.aiResponse) {
      console.log('🤖 AI Response:', result.aiResponse);
      await speakAIResponse(result.aiResponse);
    } else {
      console.warn('⚠️ No AI response received');
    }
    
    // If AI created a booking, handle it
    if (result.booking && result.action === 'booking_created') {
      console.log('📝 Booking created:', result.booking);
      await handleAIBooking(result.booking, result.aiResponse);
      showNotification('🎉 Booking created by AI!', 'success');
    } else {
      console.log('💬 Conversation continues, action:', result.action);
      // Just show the AI's response as a conversation
      showNotification(`AI: ${result.aiResponse}`, 'info');
    }

  } catch (error) {
    console.error('❌ AI conversation error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause
    });
    console.error('❌ Full error object:', error);
    
    // Show detailed error to user
    const errorMsg = `AI conversation failed: ${error.message}`;
    showNotification(errorMsg, 'error');
    $('#recognized').textContent = 'AI conversation failed - check console for details';
  }
}

// Speak AI response using browser TTS
async function speakAIResponse(text) {
  try {
    // Clean up text for better TTS
    const cleanText = text.replace(/['"]/g, '').replace(/\s+/g, ' ').trim();
    
    // Use browser's built-in TTS (works great!)
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;
    
    // Find a good voice (prefer female, English)
    const voices = speechSynthesis.getVoices();
    const goodVoice = voices.find(v => 
      v.lang.includes('en') && v.name.toLowerCase().includes('female')
    ) || voices.find(v => v.lang.includes('en')) || voices[0];
    
    if (goodVoice) utterance.voice = goodVoice;
    
    console.log(`🔊 Speaking: "${cleanText}"`);
    speechSynthesis.speak(utterance);
    
  } catch (error) {
    console.error('TTS error:', error);
  }
}

// Handle booking created by AI
async function handleAIBooking(bookingData, aiResponse) {
  try {
    // Create the booking in local storage
    const booking = addBooking({
      customer_name: bookingData.customer_name || 'AI Guest',
      phone_number: bookingData.phone_number || '',
      party_size: bookingData.party_size || 1,
      start_time: bookingData.date && bookingData.start_time ? 
        new Date(`${bookingData.date}T${bookingData.start_time}`).toISOString() : null,
      end_time: bookingData.date && bookingData.end_time ? 
        new Date(`${bookingData.date}T${bookingData.end_time}`).toISOString() : null,
      notes: bookingData.notes || 'Created via AI conversation'
    });

    // Update displays
    renderRecentBookings();
    renderBookingsList();
    renderLogs();

    console.log('📝 AI created booking:', booking);

  } catch (error) {
    console.error('Failed to handle AI booking:', error);
    showNotification('Failed to save AI booking: ' + error.message, 'error');
  }
}

// Old function removed - now using handleAIBooking() instead

$('#stop-voice').onclick = () => stopRecording();
$('#speak-sample').onclick = async () => {
  speakText('Hello, this is the AI-powered restaurant booking assistant. Ready to take your reservation.');
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

// Check phone system status
async function checkPhoneSystem() {
  try {
    const response = await fetch(`${API_BASE}/health`);
    if (!response.ok) throw new Error('Server not available');
    
    const data = await response.json();
    const phoneStatus = $('#phone-status');
    const phoneText = $('#phone-text');
    const phoneDot = $('#phone-dot');
    
    phoneStatus.style.display = 'block';
    
    if (data.twilio_configured && data.phone_number) {
      phoneText.textContent = `📞 Phone bookings: ${data.phone_number}`;
      phoneDot.className = 'w-2 h-2 bg-green-400 rounded-full animate-pulse';
      addLog({ type: 'success', source: 'Phone', text: `Phone system ready: ${data.phone_number}`, timestamp: nowISO() });
    } else {
      phoneText.textContent = '📞 Phone system not configured';
      phoneDot.className = 'w-2 h-2 bg-yellow-400 rounded-full animate-pulse';
      addLog({ type: 'info', source: 'Phone', text: 'Phone system not configured', timestamp: nowISO() });
    }
  } catch (error) {
    const phoneStatus = $('#phone-status');
    const phoneText = $('#phone-text');
    const phoneDot = $('#phone-dot');
    
    phoneStatus.style.display = 'block';
    phoneText.textContent = '📞 Phone system offline';
    phoneDot.className = 'w-2 h-2 bg-red-400 rounded-full animate-pulse';
    console.warn('Phone system check failed:', error);
  }
}

// Load phone bookings
async function loadPhoneBookings() {
  try {
    const response = await fetch(`${API_BASE}/api/bookings`);
    if (!response.ok) return;
    
    const data = await response.json();
    if (data.bookings && data.bookings.length > 0) {
      // Merge phone bookings with local bookings
      const localBookings = getBookings();
      const phoneBookings = data.bookings.map(b => ({
        ...b,
        source: 'phone_call'
      }));
      
      // Combine and sort by creation date
      const allBookings = [...localBookings, ...phoneBookings]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      // Update display (don't save phone bookings to localStorage)
      const recentNode = $('#recent-bookings');
      recentNode.innerHTML = '';
      
      allBookings.slice(0, 6).forEach(b => {
        const el = document.createElement('div');
        el.className = `p-3 rounded-xl border border-gray-100 hover:shadow-lg transition-all cursor-pointer ${b.source === 'phone_call' ? 'bg-blue-50 border-blue-200' : 'bg-white'}`;
        el.innerHTML = `<div class="font-semibold text-gray-800">${b.customer_name} ${b.source === 'phone_call' ? '📞' : ''}</div>
                        <div class="text-xs text-gray-500">${b.phone_number ? b.phone_number + ' • ' : ''}${friendlyDate(b.start_time || b.created_at)} • Party of ${b.party_size}</div>`;
        el.onclick = () => {
          showNotification(`${b.source === 'phone_call' ? 'Phone booking' : 'Web booking'}: ${b.customer_name}`, 'info');
        };
        recentNode.appendChild(el);
      });
      
      addLog({ type: 'success', source: 'Phone', text: `Loaded ${data.bookings.length} phone bookings`, timestamp: nowISO() });
    }
  } catch (error) {
    console.warn('Failed to load phone bookings:', error);
  }
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

// Manual parsing removed - Mistral AI now handles all conversation and booking parsing!

// Old speech booking function removed - now using Mistral AI conversation system!

// Remove legacy DOM table population and duplicate load functions.
// We rely on renderBookingsList / renderRecentBookings for UI updates.

// Ensure recognition result handling is safe: when recognition exists, call createBookingFromSpeech
// (The click handler that creates recognition above will trigger onresult, which will call this.)
// If recognition is not present, do nothing here.

// =============================================================================
// APP INITIALIZATION
// =============================================================================

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Start health monitoring
  startHealthChecks();
  
  // Load initial data
  renderRecentBookings();
  renderBookingsList(); 
  renderLogs();
  
  // Check phone system status
  checkPhoneSystem();
  
  // Load phone bookings periodically
  loadPhoneBookings();
  setInterval(loadPhoneBookings, 10000); // Check every 10 seconds
  
  // Hide loading indicator
  const fallback = $('#fallback-visible');
  if (fallback) fallback.style.display = 'none';
  
  // Update status
  $('#client-text').textContent = 'System Ready';
  
  console.log('🚀 Restaurant AI Booking System initialized');
  console.log('📞 Phone bookings supported via Twilio + Mistral AI');
  console.log('🎤 Voice recognition available in browser');
});
