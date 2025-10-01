// Booking Manager Module
// Handles booking-related functionality

class BookingManager {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.bookings = [];
  }

  async loadBookings() {
    console.log('📋 Loading bookings...');
    try {
      const bookings = await this.apiClient.getBookings();
      this.bookings = bookings;
      this.renderBookings();
      console.log('✅ Bookings loaded:', bookings.length);
    } catch (error) {
      console.error('❌ Error loading bookings:', error);
      UIManager.showNotification('Failed to load bookings: ' + error.message, 'error');
    }
  }

  addBookingToUI(booking) {
    console.log('➕ Adding booking to UI:', booking);
    
    // Add to local array
    this.bookings.unshift(booking);
    
    // Re-render bookings
    this.renderBookings();
    
    // Show success message
    UIManager.showNotification(`Booking created for ${booking.customer_name}`, 'success');
  }

  renderBookings() {
    const container = document.getElementById('bookings-list');
    if (!container) {
      console.warn('⚠️ Bookings container not found');
      return;
    }

    // Clear existing bookings
    container.innerHTML = '';

    if (this.bookings.length === 0) {
      container.innerHTML = `
        <div class="text-center text-gray-500 py-8">
          <p>No bookings yet</p>
          <p class="text-sm">Try making a booking using the voice interface above!</p>
        </div>
      `;
      return;
    }

    // Render each booking
    this.bookings.forEach(booking => {
      const bookingElement = this.createBookingElement(booking);
      container.appendChild(bookingElement);
    });

    console.log('✅ Rendered', this.bookings.length, 'bookings');
  }

  createBookingElement(booking) {
    const element = document.createElement('div');
    element.className = 'bg-white rounded-lg border border-gray-200 p-4 mb-4 shadow-sm hover:shadow-md transition-shadow';
    
    element.innerHTML = `
      <div class="flex justify-between items-start mb-2">
        <h3 class="font-semibold text-lg text-gray-900">${booking.customer_name || 'Unknown Customer'}</h3>
        <span class="text-sm text-gray-500">#${booking.id}</span>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div>
          <span class="font-medium text-gray-700">Party Size:</span>
          <span class="ml-2">${booking.party_size || 'Not specified'} people</span>
        </div>
        
        <div>
          <span class="font-medium text-gray-700">Phone:</span>
          <span class="ml-2">${UIManager.formatPhoneNumber(booking.phone_number)}</span>
        </div>
        
        <div>
          <span class="font-medium text-gray-700">Date & Time:</span>
          <span class="ml-2">${UIManager.formatDateTime(booking.date)} at ${booking.start_time || 'TBD'}</span>
        </div>
        
        <div>
          <span class="font-medium text-gray-700">Created:</span>
          <span class="ml-2">${UIManager.formatDateTime(booking.created_at)}</span>
        </div>
        
        ${booking.notes ? `
        <div class="md:col-span-2">
          <span class="font-medium text-gray-700">Notes:</span>
          <span class="ml-2">${booking.notes}</span>
        </div>
        ` : ''}
        
        <div class="md:col-span-2">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            booking.created_via === 'ai_conversation' 
              ? 'bg-blue-100 text-blue-800' 
              : 'bg-gray-100 text-gray-800'
          }">
            ${booking.created_via === 'ai_conversation' ? '🤖 AI Booking' : '📝 Manual Booking'}
          </span>
        </div>
      </div>
    `;
    
    return element;
  }

  async createManualBooking(formData) {
    console.log('📝 Creating manual booking:', formData);
    
    try {
      UIManager.showLoader('Creating booking...');
      
      const booking = await this.apiClient.createBooking(formData);
      
      this.addBookingToUI(booking);
      
      // Clear form
      this.clearBookingForm();
      
      UIManager.hideLoader();
      UIManager.showNotification('Booking created successfully!', 'success');
      
      // Log the booking creation
      if (window.legacyFeatures) {
        window.legacyFeatures.addLog({
          type: 'success',
          source: 'Manual Booking',
          text: `Booking created: ${booking.customer_name} (${booking.phone_number || 'No phone'}) - Party of ${booking.party_size}`
        });
      }
      
    } catch (error) {
      console.error('❌ Error creating manual booking:', error);
      UIManager.hideLoader();
      UIManager.showNotification('Failed to create booking: ' + error.message, 'error');
    }
  }

  clearBookingForm() {
    const form = document.getElementById('booking-form');
    if (form) {
      form.reset();
      console.log('📝 Booking form cleared');
    }
  }

  initializeManualBookingForm() {
    const form = document.getElementById('booking-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const bookingData = {
          customer_name: formData.get('customer_name'),
          phone_number: formData.get('phone_number'),
          party_size: parseInt(formData.get('party_size')) || 1,
          date: formData.get('date'),
          start_time: formData.get('start_time'),
          end_time: formData.get('end_time'),
          notes: formData.get('notes') || '',
          created_via: 'manual_form'
        };
        
        this.createManualBooking(bookingData);
      });
      
      console.log('📝 Manual booking form initialized');
    }
  }
}

// Export for use in other modules
window.BookingManager = BookingManager;