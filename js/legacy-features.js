// Legacy Features Module
// Contains tab switching, logs, reviews, and localStorage functionality

class LegacyFeatures {
  constructor() {
    this.LS_KEYS = {
      BOOKINGS: 'ma:bookings:v1',
      LOGS: 'ma:logs:v1',
      REVIEWS: 'ma:reviews:v1',
      REVIEW_REPLIES: 'ma:review_replies:v1'
    };
    
    this.init();
  }

  init() {
    console.log('🔄 Loading legacy features...');
    this.setupTabSwitching();
    this.setupLocalStorage();
    this.initializeTabs();
    console.log('✅ Legacy features loaded');
  }

  // ---------- Utility Functions ----------
  uid(prefix = '') {
    return prefix + Math.random().toString(36).slice(2, 9);
  }

  nowISO() {
    return new Date().toISOString();
  }

  friendlyDate(iso) {
    if (!iso) return '—';
    try { 
      return new Date(iso).toLocaleString(); 
    } catch { 
      return iso; 
    }
  }

  formatDateForInput(iso) {
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

  // ---------- LocalStorage Utilities ----------
  lsRead(key, defaultValue = null) {
    try {
      const v = localStorage.getItem(key);
      if (v === null || v === undefined) return defaultValue;
      return JSON.parse(v);
    } catch (e) {
      console.warn(`Error reading localStorage key "${key}":`, e);
      return defaultValue;
    }
  }

  lsWrite(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`Error writing to localStorage key "${key}":`, e);
      return false;
    }
  }

  lsDelete(key) {
    try { 
      localStorage.removeItem(key); 
      return true; 
    } catch (e) { 
      return false; 
    }
  }

  // ---------- Logs Management ----------
  getLogs() { 
    return this.lsRead(this.LS_KEYS.LOGS, []); 
  }

  saveLogs(logs) { 
    return this.lsWrite(this.LS_KEYS.LOGS, logs); 
  }

  addLog(entry) {
    const logs = this.getLogs();
    logs.unshift({ 
      id: this.uid('log_'), 
      timestamp: this.nowISO(),
      ...entry 
    });
    this.saveLogs(logs.slice(0, 1000)); // Keep only last 1000 entries
    this.renderLogs();
  }

  renderLogs() {
    const logsList = document.getElementById('logs-list');
    if (!logsList) return;

    const logs = this.getLogs();
    if (logs.length === 0) {
      logsList.innerHTML = '<div class="text-center text-gray-500 py-8">No logs yet</div>';
      return;
    }

    logsList.innerHTML = logs.map(log => `
      <div class="log-entry p-4 border border-gray-200 rounded-lg mb-2">
        <div class="flex justify-between items-start">
          <div>
            <span class="font-medium text-${log.type === 'error' ? 'red' : log.type === 'success' ? 'green' : 'blue'}-600">
              ${log.type?.toUpperCase() || 'INFO'}
            </span>
            <span class="text-gray-500 ml-2">${log.source || 'System'}</span>
          </div>
          <span class="text-xs text-gray-400">${this.friendlyDate(log.timestamp)}</span>
        </div>
        <div class="mt-2 text-gray-700">${log.text || log.message || 'No message'}</div>
      </div>
    `).join('');
  }

  // ---------- Tab Switching ----------
  setupTabSwitching() {
    console.log('🔧 Setting up tab switching...');

    // Tab buttons
    const tabButtons = document.querySelectorAll('.nav-tab');
    
    tabButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const tabId = e.target.id.replace('btn-', '');
        this.switchTab(tabId);
      });
    });

    // Hamburger menu
    const hamburger = document.getElementById('hamburger');
    if (hamburger) {
      hamburger.addEventListener('click', this.toggleMobileMenu);
    }
  }

  switchTab(tabName) {
    console.log(`🔄 Switching to tab: ${tabName}`);

    // Update active button
    document.querySelectorAll('.nav-tab').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`btn-${tabName}`);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }

    // Hide all tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.style.display = 'none';
    });

    // Show target tab
    const targetTab = document.getElementById(`tab-${tabName}`);
    if (targetTab) {
      targetTab.style.display = 'block';
      
      // Initialize tab-specific content
      this.initializeTab(tabName);
    }
  }

  initializeTab(tabName) {
    switch (tabName) {
      case 'logs':
        this.renderLogs();
        break;
      case 'reviews':
        this.renderReviews();
        break;
      case 'dashboard':
        this.renderDashboard();
        break;
      case 'staff':
        this.renderStaff();
        break;
      default:
        console.log(`No specific initialization for tab: ${tabName}`);
    }
  }

  initializeTabs() {
    // Initialize with dashboard tab
    this.switchTab('dashboard');
  }

  toggleMobileMenu() {
    const menu = document.querySelector('.md\\:flex');
    if (menu) {
      menu.classList.toggle('hidden');
    }
  }

  // ---------- Reviews Management ----------
  renderReviews() {
    const reviewsList = document.getElementById('reviews-list');
    if (!reviewsList) return;

    const reviews = this.lsRead(this.LS_KEYS.REVIEWS, []);
    
    if (reviews.length === 0) {
      reviewsList.innerHTML = '<div class="text-center text-gray-500 py-8">No reviews yet</div>';
      return;
    }

    reviewsList.innerHTML = reviews.map(review => `
      <div class="review-entry p-4 border border-gray-200 rounded-lg mb-4">
        <div class="flex justify-between items-start">
          <div>
            <h4 class="font-medium">${review.author_name || 'Anonymous'}</h4>
            <div class="text-yellow-500">${'★'.repeat(review.rating || 0)}${'☆'.repeat(5 - (review.rating || 0))}</div>
          </div>
          <span class="text-xs text-gray-400">${this.friendlyDate(review.time)}</span>
        </div>
        <div class="mt-2 text-gray-700">${review.text || 'No review text'}</div>
      </div>
    `).join('');
  }

  // ---------- Dashboard Rendering ----------
  renderDashboard() {
    // Dashboard is handled by other modules, just add any legacy dashboard features here
    console.log('📊 Dashboard tab initialized');
  }

  // ---------- Staff Management ----------
  renderStaff() {
    const staffList = document.getElementById('staff-list');
    if (!staffList) return;

    // Placeholder staff management
    staffList.innerHTML = `
      <div class="text-center text-gray-500 py-8">
        <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
        </svg>
        <h3 class="text-lg font-medium">Staff Management</h3>
        <p class="text-sm">Staff management features coming soon</p>
      </div>
    `;
  }
}

// Initialize legacy features when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  if (!window.legacyFeatures) {
    window.legacyFeatures = new LegacyFeatures();
  }
});

// Export for other modules to use
if (typeof window !== 'undefined') {
  window.LegacyFeatures = LegacyFeatures;
}