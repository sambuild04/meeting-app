export interface Meeting {
  id: string;
  title: string;
  duration: number; // in minutes
  createdAt: Date;
  startedAt?: Date;
  participants: Participant[];
  isActive: boolean;
}

export interface Participant {
  id: string;
  name: string;
  isHost: boolean;
  isMuted: boolean;
  isCameraOn: boolean;
  joinedAt: Date;
}

export interface MeetingSettings {
  title: string;
  duration: number;
  hostName: string;
}