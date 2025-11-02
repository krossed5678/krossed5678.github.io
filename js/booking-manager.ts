import APIClient from './api-client';

export default class BookingManager {
  apiClient: any;
  bookings: any[];
  constructor(apiClient?: any) {
    this.apiClient = apiClient || new APIClient();
    this.bookings = [];
  }

  async loadBookings() {
    try {
      const bookings = await this.apiClient.getBookings();
      this.bookings = bookings;
      this.renderBookings();
      console.log('✅ Bookings loaded:', bookings.length);
    } catch (error:any) {
      console.error('❌ Error loading bookings:', error);
      (window as any).UIManager.showNotification('Failed to load bookings: ' + (error.message || error), 'error');
    }
  }

  addBookingToUI(booking: any) {
    this.bookings.unshift(booking);
    this.renderBookings();
    (window as any).UIManager.showNotification(`Booking created`, 'success');
  }

  renderBookings() {
    const container = document.getElementById('bookings-list');
    if (!container) return;
    container.innerHTML = '';
    if (this.bookings.length === 0) {
      container.innerHTML = `<div class="text-center text-gray-500 py-8"><p>No bookings yet</p><p class="text-sm">Try making a booking using the voice interface above!</p></div>`;
      return;
    }
    this.bookings.forEach(booking => {
      const bookingElement = this.createBookingElement(booking);
      container.appendChild(bookingElement);
    });
  }

  createBookingElement(booking:any) {
    const element = document.createElement('div');
    element.className = 'bg-white rounded-lg border border-gray-200 p-4 mb-4 shadow-sm hover:shadow-md transition-shadow';
    element.innerHTML = `\n      <div class="flex justify-between items-start mb-2">\n        <h3 class="font-semibold text-lg text-gray-900">${booking.customer_name || 'Unknown Customer'}</h3>\n        <span class="text-sm text-gray-500">#${booking.id}</span>\n      </div>\n      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">\n        <div>\n          <span class="font-medium text-gray-700">Party Size:</span>\n          <span class="ml-2">${booking.party_size || 'Not specified'} people</span>\n        </div>\n        <div>\n          <span class="font-medium text-gray-700">Phone:</span>\n          <span class="ml-2">${(window as any).UIManager.formatPhoneNumber(booking.phone_number)}</span>\n        </div>\n        <div>\n          <span class="font-medium text-gray-700">Date & Time:</span>\n          <span class="ml-2">${(window as any).UIManager.formatDateTime(booking.date)} at ${booking.start_time || 'TBD'}</span>\n        </div>\n        <div>\n          <span class="font-medium text-gray-700">Created:</span>\n          <span class="ml-2">${(window as any).UIManager.formatDateTime(booking.created_at)}</span>\n        </div>\n        ${booking.notes ? `\n        <div class="md:col-span-2">\n          <span class="font-medium text-gray-700">Notes:</span>\n          <span class="ml-2">${booking.notes}</span>\n        </div>\n        ` : ''}\n        <div class="md:col-span-2">\n          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${booking.created_via === 'ai_conversation' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}">${booking.created_via === 'ai_conversation' ? '🤖 AI Booking' : '📝 Manual Booking'}</span>\n        </div>\n      </div>\n    `;
    return element;
  }

  async createManualBooking(formDataObj: any) {
    try {
      (window as any).UIManager.showLoader('Creating booking...');
      const result = await this.apiClient.createBooking(formDataObj);
      this.addBookingToUI(result.booking || result);
      this.clearBookingForm();
      (window as any).UIManager.hideLoader();
      (window as any).UIManager.showNotification('Booking created successfully!', 'success');
    } catch (error:any) {
      console.error('❌ Error creating manual booking:', error);
      (window as any).UIManager.hideLoader();
      (window as any).UIManager.showNotification('Failed to create booking: ' + (error.message || error), 'error');
    }
  }

  clearBookingForm() { const form = document.getElementById('booking-form') as HTMLFormElement | null; if (form) form.reset(); }

  initializeManualBookingForm() {
    const form = document.getElementById('booking-form') as HTMLFormElement | null;
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const bookingData:any = {
        customer_name: fd.get('customer_name'),
        phone_number: fd.get('phone_number'),
        party_size: Number(fd.get('party_size')) || 1,
        date: fd.get('date'),
        start_time: fd.get('start_time'),
        end_time: fd.get('end_time'),
        notes: fd.get('notes') || '',
        created_via: 'manual_form'
      };
      this.createManualBooking(bookingData);
    });
  }
}

(window as any).BookingManager = BookingManager;
