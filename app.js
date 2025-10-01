// Legacy compatibility and utility functions
// Clean version without the corrupted content

// Utility selectors
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// Utility functions
function uid(prefix = '') {
  return prefix + Math.random().toString(36).slice(2, 9);
}

function nowISO() { 
  return new Date().toISOString(); 
}

function friendlyDate(iso) {
  if (!iso) return '—';
  try { 
    return new Date(iso).toLocaleString(); 
  } catch { 
    return iso; 
  }
}

// Format an ISO string into a value suitable for <input type="datetime-local">
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

// Notification function (backwards compatibility)
function showNotification(message, type = 'info') {
  if (window.UIManager) {
    UIManager.showNotification(message, type);
  } else {
    // Fallback notification
    const n = document.createElement('div');
    n.className = `fixed top-6 right-6 z-50 p-4 rounded-xl shadow-2xl animate-slide-up max-w-sm ${
      type === 'success' ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' : 
      type === 'error' ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' : 
      'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
    }`;
    n.innerHTML = `
      <div class="flex items-center space-x-3">
        <span class="font-medium">${message}</span>
        <button onclick="this.closest('div').remove()" class="ml-auto hover:bg-white/20 rounded p-1">✕</button>
      </div>
    `;
    document.body.appendChild(n);
    setTimeout(() => { 
      n.style.opacity = '0'; 
      setTimeout(() => n.remove(), 300); 
    }, 4500);
  }
}

// Backend status checking
async function checkBackendStatus() {
  if (window.restaurantApp && window.restaurantApp.apiClient) {
    try {
      const health = await window.restaurantApp.apiClient.checkHealth();
      return {
        available: true,
        mistralConfigured: health.mistral_configured,
        twilioConfigured: health.twilio_configured
      };
    } catch (error) {
      console.log('Backend not available:', error.message);
      return { available: false };
    }
  }
  return { available: false };
}

// Local storage utilities
const LS_KEYS = {
  BOOKINGS: 'ma:bookings:v1',
  LOGS: 'ma:logs:v1',
  REVIEWS: 'ma:reviews:v1',
  REVIEW_REPLIES: 'ma:review_replies:v1'
};

// Reviews functionality (if still needed)
let reviewsInterval;

function startReviewsMonitoring() {
  const placeId = $('#reviews-placeid')?.value;
  const interval = parseInt($('#reviews-interval')?.value || '5');
  
  if (!placeId) {
    showNotification('Please enter a Google Place ID', 'warning');
    return;
  }
  
  showNotification(`Starting reviews monitoring for Place ID: ${placeId} (every ${interval} minutes)`, 'info');
  
  // This would integrate with a reviews API
  reviewsInterval = setInterval(() => {
    console.log(`Checking reviews for ${placeId}...`);
    // Add reviews API integration here
  }, interval * 60000);
}

function stopReviewsMonitoring() {
  if (reviewsInterval) {
    clearInterval(reviewsInterval);
    reviewsInterval = null;
    showNotification('Reviews monitoring stopped', 'info');
  }
}

// Initialize legacy features when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('🔄 Loading legacy features...');
  
  // Set up reviews monitoring if elements exist
  const startReviewsBtn = $('#start-reviews');
  const stopReviewsBtn = $('#stop-reviews');
  
  if (startReviewsBtn) {
    startReviewsBtn.addEventListener('click', startReviewsMonitoring);
  }
  
  if (stopReviewsBtn) {
    stopReviewsBtn.addEventListener('click', stopReviewsMonitoring);
  }
  
  // Hide the fallback banner once everything is loaded
  setTimeout(() => {
    const fallback = $('#fallback-visible');
    if (fallback) {
      fallback.style.display = 'none';
    }
  }, 2000);
  
  console.log('✅ Legacy features loaded');
});

// Export utilities for global access
window.showNotification = showNotification;
window.checkBackendStatus = checkBackendStatus;
window.formatDateForInput = formatDateForInput;
window.friendlyDate = friendlyDate;
window.uid = uid;
window.nowISO = nowISO;