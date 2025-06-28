// Simple in-memory storage (data lost on server restart)
class MemoryStorage {
  constructor() {
    this.meetings = new Map();
    this.participants = new Map();
    this.cleanupInterval = null;
    this.startCleanup();
  }

  // Generate unique meeting ID
  generateMeetingId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Create a new meeting
  createMeeting(meetingData) {
    const id = this.generateMeetingId();
    const meeting = {
      id,
      title: meetingData.title,
      duration: meetingData.duration,
      createdAt: new Date(),
      participants: [],
      isActive: false,
      hostId: null,
      settings: {
        allowParticipantsToJoin: true,
        requireApproval: false,
        maxParticipants: 50
      }
    };

    // Add host as first participant
    const hostId = this.addParticipant(id, {
      name: meetingData.hostName,
      isHost: true
    });

    meeting.hostId = hostId;
    this.meetings.set(id, meeting);
    
    console.log(`Created meeting: ${id}`);
    return meeting;
  }

  // Get meeting by ID
  getMeeting(id) {
    const meeting = this.meetings.get(id);
    if (!meeting) return null;

    // Check if meeting is expired
    if (meeting.isActive && meeting.startedAt) {
      const elapsed = Date.now() - meeting.startedAt.getTime();
      const durationMs = meeting.duration * 60 * 1000;
      if (elapsed >= durationMs) {
        meeting.isActive = false;
        meeting.endedAt = new Date();
        this.meetings.set(id, meeting);
      }
    }

    return meeting;
  }

  // Add participant to meeting
  addParticipant(meetingId, participantData) {
    const meeting = this.meetings.get(meetingId);
    if (!meeting) return null;

    const participantId = Date.now().toString();
    const participant = {
      id: participantId,
      name: participantData.name,
      isHost: participantData.isHost || false,
      isMuted: false,
      isCameraOn: true,
      joinedAt: new Date(),
      socketId: ''
    };

    meeting.participants.push(participant);
    this.meetings.set(meetingId, meeting);
    
    console.log(`Added participant ${participant.name} to meeting ${meetingId}`);
    return participantId;
  }

  // Update participant
  updateParticipant(meetingId, participantId, updates) {
    const meeting = this.meetings.get(meetingId);
    if (!meeting) return null;

    const participant = meeting.participants.find(p => p.id === participantId);
    if (!participant) return null;

    Object.assign(participant, updates);
    this.meetings.set(meetingId, meeting);
    
    return participant;
  }

  // Remove participant
  removeParticipant(meetingId, participantId) {
    const meeting = this.meetings.get(meetingId);
    if (!meeting) return null;

    meeting.participants = meeting.participants.filter(p => p.id !== participantId);
    this.meetings.set(meetingId, meeting);
    
    return true;
  }

  // Start meeting
  startMeeting(meetingId, hostId) {
    const meeting = this.meetings.get(meetingId);
    if (!meeting) return null;

    const host = meeting.participants.find(p => p.id === hostId && p.isHost);
    if (!host) return null;

    meeting.isActive = true;
    meeting.startedAt = new Date();
    this.meetings.set(meetingId, meeting);
    
    console.log(`Started meeting: ${meetingId}`);
    return meeting;
  }

  // End meeting
  endMeeting(meetingId, hostId) {
    const meeting = this.meetings.get(meetingId);
    if (!meeting) return null;

    const host = meeting.participants.find(p => p.id === hostId && p.isHost);
    if (!host) return null;

    meeting.isActive = false;
    meeting.endedAt = new Date();
    this.meetings.set(meetingId, meeting);
    
    console.log(`Ended meeting: ${meetingId}`);
    return meeting;
  }

  // Get all active meetings
  getActiveMeetings() {
    const activeMeetings = [];
    for (const [id, meeting] of this.meetings) {
      if (meeting.isActive) {
        activeMeetings.push({
          id: meeting.id,
          title: meeting.title,
          duration: meeting.duration,
          createdAt: meeting.createdAt,
          participantsCount: meeting.participants.length,
          isActive: meeting.isActive
        });
      }
    }
    return activeMeetings;
  }

  // Cleanup expired meetings
  cleanupExpiredMeetings() {
    const now = new Date();
    let cleanedCount = 0;

    for (const [id, meeting] of this.meetings) {
      if (meeting.isActive && meeting.startedAt) {
        const elapsed = now.getTime() - meeting.startedAt.getTime();
        const durationMs = meeting.duration * 60 * 1000;
        
        if (elapsed >= durationMs) {
          meeting.isActive = false;
          meeting.endedAt = now;
          this.meetings.set(id, meeting);
          cleanedCount++;
        }
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired meetings`);
    }
  }

  // Start automatic cleanup
  startCleanup() {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredMeetings();
    }, 60 * 1000); // Run every minute
  }

  // Stop cleanup
  stopCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  // Get storage stats
  getStats() {
    return {
      totalMeetings: this.meetings.size,
      activeMeetings: this.getActiveMeetings().length,
      totalParticipants: Array.from(this.meetings.values())
        .reduce((sum, meeting) => sum + meeting.participants.length, 0)
    };
  }
}

export const memoryStorage = new MemoryStorage(); 