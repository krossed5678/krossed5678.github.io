// TypeScript port of api-client.js
export default class APIClient {
  baseURL: string;
  constructor(baseURL = 'http://localhost:3001') {
    this.baseURL = baseURL;
  }

  async checkHealth(): Promise<any> {
    console.log('🔍 Checking server health...');
    const response = await fetch(`${this.baseURL}/health`);
    if (!response.ok) throw new Error(`Server health check failed: ${response.status}`);
    return await response.json();
  }

  async sendConversation(audioBlob: Blob): Promise<any> {
    console.log('🎵 Starting audio processing with Mistral AI...');
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    const response = await fetch(`${this.baseURL}/api/conversation`, { method: 'POST', body: formData });
    if (!response.ok) throw new Error(`AI conversation failed: ${response.status}`);
    return await response.json();
  }

  async sendTextConversation(transcript: string): Promise<any> {
    const response = await fetch(`${this.baseURL}/api/text-conversation`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ transcript }) });
    if (!response.ok) throw new Error(`Server error: ${response.status}`);
    return await response.json();
  }

  async getBookings(): Promise<any[]> {
    const response = await fetch(`${this.baseURL}/api/bookings`);
    if (!response.ok) throw new Error(`Failed to fetch bookings: ${response.status}`);
    const data = await response.json();
    return data.bookings || [];
  }

  async createBooking(bookingData: any): Promise<any> {
    const response = await fetch(`${this.baseURL}/api/bookings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bookingData) });
    if (!response.ok) throw new Error(`Failed to create booking: ${response.status}`);
    return await response.json();
  }
}

// Expose to global window for legacy modules
(window as any).APIClient = APIClient;
