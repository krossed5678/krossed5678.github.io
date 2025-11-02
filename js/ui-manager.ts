// TypeScript port of ui-manager.js
export default class UIManager {
  static showNotification(message: string, type = 'info') {
    console.log(`📢 Notification (${type}):`, message);
    const existing = document.getElementById('notification');
    if (existing) existing.remove();
    const notification = document.createElement('div');
    notification.id = 'notification';
    notification.textContent = message;
    const baseClasses = 'fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 max-w-md';
    let typeClasses = '';
    switch (type) {
      case 'success': typeClasses = 'bg-green-500 text-white'; break;
      case 'error': typeClasses = 'bg-red-500 text-white'; break;
      case 'warning': typeClasses = 'bg-yellow-500 text-black'; break;
      default: typeClasses = 'bg-blue-500 text-white';
    }
    notification.className = `${baseClasses} ${typeClasses}`;
    document.body.appendChild(notification);
    setTimeout(() => { if (notification.parentNode) notification.remove(); }, 5000);
  }

  static updateElement(elementId: string, content: string) {
    const element = document.getElementById(elementId);
    if (element) element.textContent = content; else console.warn(`⚠️ Element #${elementId} not found`);
  }

  static updateVoiceButton(isRecording: boolean) {
    const button = document.getElementById('start-voice');
    const icon = document.getElementById('voice-icon');
    const text = document.getElementById('voice-text');
    if (button && icon && text) {
      if (isRecording) {
        button.className = 'px-4 py-2 bg-red-500 text-white rounded-lg font-medium flex items-center transition-all duration-200 hover:bg-red-600';
        icon.innerHTML = '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clip-rule="evenodd"/>';
        text.textContent = '🔴 Stop Recording';
      } else {
        button.className = 'btn-premium px-4 py-2 text-white rounded-lg font-medium flex items-center transition-all duration-200';
        icon.innerHTML = '<path fill-rule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clip-rule="evenodd"/>';
        text.textContent = 'Start Listening';
      }
    } else {
      console.warn('⚠️ Voice button elements not found');
    }
  }

  static createElement(tag: string, attributes: Record<string,string|Function> = {}, content = ''): HTMLElement {
    const element = document.createElement(tag);
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'className') element.className = String(value);
      else if (key === 'onclick') (element as any).onclick = value;
      else element.setAttribute(key, String(value));
    });
    if (content) element.textContent = content;
    return element;
  }

  static formatDateTime(date?: string) {
    if (!date) return 'Not specified';
    try { const d = new Date(date); return d.toLocaleString('en-US', { weekday:'short', year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }); } catch (e) { return date; }
  }

  static formatPhoneNumber(phone?: string) {
    if (!phone) return 'Not provided';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) return `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`;
    return phone;
  }

  static showLoader(message = 'Loading...') {
    const loader = document.createElement('div'); loader.id = 'loader'; loader.innerHTML = `\n      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">\n        <div class="bg-white p-6 rounded-lg shadow-xl">\n          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>\n          <p class="text-gray-700">${message}</p>\n        </div>\n      </div>\n    `; document.body.appendChild(loader);
  }

  static hideLoader() { const loader = document.getElementById('loader'); if (loader) loader.remove(); }
}

(window as any).UIManager = UIManager;
