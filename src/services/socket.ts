import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export interface SocketEvents {
  // Client to Server
  joinMeeting: (data: { meetingId: string; participantId: string }) => void;
  startMeeting: (data: { meetingId: string; hostId: string }) => void;
  endMeeting: (data: { meetingId: string; hostId: string }) => void;
  toggleMute: (data: { meetingId: string; participantId: string }) => void;
  toggleCamera: (data: { meetingId: string; participantId: string }) => void;
  updateParticipantName: (data: { meetingId: string; participantId: string; name: string }) => void;
  sendMessage: (data: { meetingId: string; participantId: string; message: string }) => void;

  // Server to Client
  meetingJoined: (data: {
    meeting: {
      id: string;
      title: string;
      duration: number;
      isActive: boolean;
      startedAt?: string;
      participants: any[];
    };
    currentParticipant: {
      id: string;
      name: string;
      isHost: boolean;
      isMuted: boolean;
      isCameraOn: boolean;
    };
  }) => void;
  participantJoined: (data: { participant: any }) => void;
  participantLeft: (data: { participantId: string; participantName: string }) => void;
  participantUpdated: (data: { participantId: string; updates: any }) => void;
  meetingStarted: (data: { meetingId: string; startedAt: string; duration: number }) => void;
  meetingEnded: (data: { meetingId: string; reason: string }) => void;
  newMessage: (data: {
    id: string;
    participantId: string;
    participantName: string;
    message: string;
    timestamp: string;
  }) => void;
  error: (data: { message: string }) => void;
}

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(SOCKET_URL, {
          transports: ['websocket', 'polling'],
          timeout: 20000,
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.reconnectDelay,
        });

        this.socket.on('connect', () => {
          console.log('Connected to Socket.IO server');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve();
        });

        this.socket.on('disconnect', (reason: string) => {
          console.log('Disconnected from Socket.IO server:', reason);
          this.isConnected = false;
        });

        this.socket.on('connect_error', (error: Error) => {
          console.error('Socket.IO connection error:', error);
          this.reconnectAttempts++;
          
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            reject(new Error('Failed to connect to Socket.IO server after multiple attempts'));
          }
        });

        this.socket.on('error', (error: Error) => {
          console.error('Socket.IO error:', error);
        });

      } catch (error) {
        console.error('Error creating Socket.IO connection:', error);
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  emit<T extends keyof SocketEvents>(event: T, data: Parameters<SocketEvents[T]>[0]): void {
    if (!this.socket || !this.isConnected) {
      console.warn('Socket not connected, cannot emit event:', event);
      return;
    }

    this.socket.emit(event, data);
  }

  on<T extends keyof SocketEvents>(event: T, callback: SocketEvents[T]): void {
    if (!this.socket) {
      console.warn('Socket not initialized, cannot listen to event:', event);
      return;
    }

    this.socket.on(event, callback as any);
  }

  off<T extends keyof SocketEvents>(event: T, callback?: SocketEvents[T]): void {
    if (!this.socket) {
      return;
    }

    if (callback) {
      this.socket.off(event, callback as any);
    } else {
      this.socket.off(event);
    }
  }

  get connected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  get id(): string | undefined {
    return this.socket?.id;
  }
}

export const socketService = new SocketService(); 