// UI Manager Module
// Handles all UI updates and interactions

class UIManager {
  static showNotification(message, type = 'info') {
    console.log(`📢 Notification (${type}):`, message);
    
    // Remove any existing notifications
    const existing = document.getElementById('notification');
    if (existing) {
      existing.remove();
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.id = 'notification';
    notification.textContent = message;
    
    // Style based on type
    const baseClasses = 'fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 max-w-md';
    let typeClasses = '';
    
    switch (type) {
      case 'success':
        typeClasses = 'bg-green-500 text-white';
        break;
      case 'error':
        typeClasses = 'bg-red-500 text-white';
        break;
      case 'warning':
        typeClasses = 'bg-yellow-500 text-black';
        break;
      default:
        typeClasses = 'bg-blue-500 text-white';
    }
    
    notification.className = `${baseClasses} ${typeClasses}`;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }

  static updateElement(elementId, content) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = content;
      console.log(`🎯 Updated element #${elementId}:`, content);
    } else {
      console.warn(`⚠️ Element #${elementId} not found`);
    }
  }

  static updateVoiceButton(isRecording) {
    const button = document.getElementById('start-voice');
    const icon = document.getElementById('voice-icon');
    const text = document.getElementById('voice-text');
    
    if (button && icon && text) {
      if (isRecording) {
        // Change to stop recording state
        button.className = 'px-4 py-2 bg-red-500 text-white rounded-lg font-medium flex items-center transition-all duration-200 hover:bg-red-600';
        icon.innerHTML = '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clip-rule="evenodd"/>';
        text.textContent = '🔴 Stop Recording';
      } else {
        // Change to start listening state
        button.className = 'btn-premium px-4 py-2 text-white rounded-lg font-medium flex items-center transition-all duration-200';
        icon.innerHTML = '<path fill-rule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clip-rule="evenodd"/>';
        text.textContent = 'Start Listening';
      }
      console.log(`🎯 Voice button updated: ${isRecording ? 'Recording' : 'Ready'}`);
    } else {
      console.warn('⚠️ Voice button elements not found');
    }
  }

  static createElement(tag, attributes = {}, content = '') {
    const element = document.createElement(tag);
    
    // Set attributes
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'onclick') {
        element.onclick = value;
      } else {
        element.setAttribute(key, value);
      }
    });
    
    // Set content
    if (content) {
      element.textContent = content;
    }
    
    return element;
  }

  static formatDateTime(date) {
    if (!date) return 'Not specified';
    
    try {
      const d = new Date(date);
      return d.toLocaleString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.warn('⚠️ Error formatting date:', error);
      return date;
    }
  }

  static formatPhoneNumber(phone) {
    if (!phone) return 'Not provided';
    
    // Simple phone number formatting
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`;
    }
    return phone;
  }

  static showLoader(message = 'Loading...') {
    const loader = document.createElement('div');
    loader.id = 'loader';
    loader.innerHTML = `
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white p-6 rounded-lg shadow-xl">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p class="text-gray-700">${message}</p>
        </div>
      </div>
    `;
    document.body.appendChild(loader);
  }

  static hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
      loader.remove();
    }
  }
}

// Export for use in other modules
window.UIManager = UIManager;