const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Meeting endpoints
  async createMeeting(data: {
    title: string;
    duration: number;
    hostName: string;
  }) {
    return this.request<{
      success: boolean;
      meeting: {
        id: string;
        title: string;
        duration: number;
        createdAt: string;
        participants: any[];
        isActive: boolean;
      };
    }>('/meetings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMeeting(meetingId: string) {
    return this.request<{
      success: boolean;
      meeting: {
        id: string;
        title: string;
        duration: number;
        createdAt: string;
        startedAt?: string;
        endedAt?: string;
        participants: any[];
        isActive: boolean;
        timeRemaining: number;
      };
    }>(`/meetings/${meetingId}`);
  }

  async joinMeeting(meetingId: string, data: {
    name: string;
    participantId?: string;
  }) {
    return this.request<{
      success: boolean;
      participant: any;
      meeting: {
        id: string;
        title: string;
        duration: number;
        isActive: boolean;
        participants: any[];
      };
    }>(`/meetings/${meetingId}/join`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async startMeeting(meetingId: string, hostId: string) {
    return this.request<{
      success: boolean;
      meeting: {
        id: string;
        isActive: boolean;
        startedAt: string;
        timeRemaining: number;
      };
    }>(`/meetings/${meetingId}/start`, {
      method: 'POST',
      body: JSON.stringify({ hostId }),
    });
  }

  async endMeeting(meetingId: string, hostId: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/meetings/${meetingId}/end`, {
      method: 'POST',
      body: JSON.stringify({ hostId }),
    });
  }

  async updateParticipant(
    meetingId: string,
    participantId: string,
    updates: {
      isMuted?: boolean;
      isCameraOn?: boolean;
      name?: string;
    }
  ) {
    return this.request<{
      success: boolean;
      participant: any;
    }>(`/meetings/${meetingId}/participants/${participantId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async getActiveMeetings(limit = 20, offset = 0) {
    return this.request<{
      success: boolean;
      meetings: any[];
      total: number;
      limit: number;
      offset: number;
    }>(`/meetings?limit=${limit}&offset=${offset}`);
  }

  // Health check
  async healthCheck() {
    return this.request<{
      status: string;
      timestamp: string;
    }>('/health');
  }
}

export const apiService = new ApiService(API_BASE_URL); 