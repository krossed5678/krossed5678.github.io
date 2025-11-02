export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface Booking {
  id: number;
  userId: number;
  date: string;
  time: string;
  partySize: number;
  specialRequests?: string;
  status: BookingStatus;
  created_at: string;
  updated_at: string;
  source?: string;
  text?: string;
  phone?: string;
}

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

export interface User {
  id: number;
  email: string;
  is_verified: number;
  created_at: string;
  last_login?: string;
}

export default class APIClient {
  private readonly baseURL: string;
  private token: string | null;

  constructor(baseURL = "http://localhost:3001") {
    this.baseURL = baseURL;
    this.token = localStorage.getItem("auth_token");
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const headers = new Headers(options.headers);
    headers.set("Content-Type", "application/json");

    if (this.token) {
      headers.set("Authorization", `Bearer ${this.token}`);
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "An error occurred");
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error("An error occurred");
    }
  }

  async login(email: string, password: string): Promise<ApiResponse<{ token: string; user: User }>> {
    const response = await this.request<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });

    if (response.data?.token) {
      this.token = response.data.token;
      localStorage.setItem("auth_token", response.data.token);
    }

    return response;
  }

  async register(email: string, password: string): Promise<ApiResponse<void>> {
    return this.request<void>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
  }

  async verifyEmail(token: string): Promise<ApiResponse<void>> {
    return this.request<void>("/auth/verify", {
      method: "POST",
      body: JSON.stringify({ token })
    });
  }

  async forgotPassword(email: string): Promise<ApiResponse<void>> {
    return this.request<void>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email })
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<ApiResponse<void>> {
    return this.request<void>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword })
    });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<void>> {
    return this.request<void>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword })
    });
  }

  async logout(): Promise<void> {
    await this.request<void>("/auth/logout", {
      method: "POST"
    });
    this.token = null;
    localStorage.removeItem("auth_token");
  }

  async getBookings(): Promise<ApiResponse<Booking[]>> {
    return this.request<Booking[]>("/api/bookings");
  }

  async createBooking(bookingData: Partial<Booking>): Promise<ApiResponse<Booking>> {
    return this.request<Booking>("/api/bookings", {
      method: "POST",
      body: JSON.stringify(bookingData)
    });
  }

  async updateBooking(id: number, data: Partial<Booking>): Promise<ApiResponse<Booking>> {
    return this.request<Booking>(`/api/bookings/${id}`, {
      method: "PUT",
      body: JSON.stringify(data)
    });
  }

  async deleteBooking(id: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/bookings/${id}`, {
      method: "DELETE"
    });
  }

  async getUpcomingBookings(): Promise<ApiResponse<Booking[]>> {
    return this.request<Booking[]>("/api/bookings/upcoming");
  }

  async getPastBookings(): Promise<ApiResponse<Booking[]>> {
    return this.request<Booking[]>("/api/bookings/past");
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  getToken(): string | null {
    return this.token;
  }

  async checkHealth(): Promise<ApiResponse<{ status: string }>> {
    return this.request<{ status: string }>("/health");
  }

  async sendConversation(audioBlob: Blob): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");
    
    const headers = new Headers();
    if (this.token) {
      headers.set("Authorization", `Bearer ${this.token}`);
    }

    const response = await fetch(`${this.baseURL}/api/conversation`, {
      method: "POST",
      headers,
      body: formData
    });

    if (!response.ok) {
      throw new Error(`AI conversation failed: ${response.status}`);
    }

    return response.json();
  }

  async sendTextConversation(transcript: string): Promise<ApiResponse<any>> {
    return this.request<any>("/api/text-conversation", {
      method: "POST",
      body: JSON.stringify({ transcript })
    });
  }
}
