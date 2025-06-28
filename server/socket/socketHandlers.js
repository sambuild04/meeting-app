import { memoryStorage } from '../storage/memory.js';

export const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join meeting room
    socket.on('joinMeeting', async (data) => {
      try {
        const { meetingId, participantId } = data;

        if (!meetingId || !participantId) {
          socket.emit('error', { message: 'Missing meetingId or participantId' });
          return;
        }

        const meeting = memoryStorage.getMeeting(meetingId);
        
        if (!meeting) {
          socket.emit('error', { message: 'Meeting not found' });
          return;
        }

        // Check if meeting is expired
        if (meeting.isActive && meeting.startedAt) {
          const elapsed = Date.now() - meeting.startedAt.getTime();
          const durationMs = meeting.duration * 60 * 1000;
          if (elapsed >= durationMs) {
            meeting.isActive = false;
            meeting.endedAt = new Date();
            
            socket.emit('meetingEnded', {
              meetingId: meeting.id,
              reason: 'timeExpired'
            });
            return;
          }
        }

        const participant = meeting.participants.find(p => p.id === participantId);
        
        if (!participant) {
          socket.emit('error', { message: 'Participant not found in meeting' });
          return;
        }

        // Update participant's socket ID
        memoryStorage.updateParticipant(meetingId, participantId, { socketId: socket.id });

        // Join the meeting room
        socket.join(meetingId);

        // Notify other participants
        socket.to(meetingId).emit('participantJoined', {
          participant: {
            id: participant.id,
            name: participant.name,
            isHost: participant.isHost,
            isMuted: participant.isMuted,
            isCameraOn: participant.isCameraOn,
            joinedAt: participant.joinedAt
          }
        });

        // Send current meeting state to the joining participant
        const updatedMeeting = memoryStorage.getMeeting(meetingId);
        socket.emit('meetingJoined', {
          meeting: {
            id: updatedMeeting.id,
            title: updatedMeeting.title,
            duration: updatedMeeting.duration,
            isActive: updatedMeeting.isActive,
            startedAt: updatedMeeting.startedAt,
            participants: updatedMeeting.participants.map(p => ({
              id: p.id,
              name: p.name,
              isHost: p.isHost,
              isMuted: p.isMuted,
              isCameraOn: p.isCameraOn,
              joinedAt: p.joinedAt
            }))
          },
          currentParticipant: {
            id: participant.id,
            name: participant.name,
            isHost: participant.isHost,
            isMuted: participant.isMuted,
            isCameraOn: participant.isCameraOn
          }
        });

        console.log(`Participant ${participant.name} joined meeting ${meetingId}`);
      } catch (error) {
        console.error('Error joining meeting:', error);
        socket.emit('error', { message: 'Failed to join meeting' });
      }
    });

    // Start meeting (host only)
    socket.on('startMeeting', async (data) => {
      try {
        const { meetingId, hostId } = data;

        const meeting = memoryStorage.getMeeting(meetingId);
        
        if (!meeting) {
          socket.emit('error', { message: 'Meeting not found' });
          return;
        }

        const host = meeting.participants.find(p => p.id === hostId && p.isHost);
        if (!host) {
          socket.emit('error', { message: 'Only the host can start the meeting' });
          return;
        }

        if (meeting.isActive) {
          socket.emit('error', { message: 'Meeting is already active' });
          return;
        }

        const updatedMeeting = memoryStorage.startMeeting(meetingId, hostId);

        // Notify all participants
        io.to(meetingId).emit('meetingStarted', {
          meetingId: updatedMeeting.id,
          startedAt: updatedMeeting.startedAt,
          duration: updatedMeeting.duration
        });

        console.log(`Meeting ${meetingId} started by host ${host.name}`);
      } catch (error) {
        console.error('Error starting meeting:', error);
        socket.emit('error', { message: 'Failed to start meeting' });
      }
    });

    // End meeting (host only)
    socket.on('endMeeting', async (data) => {
      try {
        const { meetingId, hostId } = data;

        const meeting = memoryStorage.getMeeting(meetingId);
        
        if (!meeting) {
          socket.emit('error', { message: 'Meeting not found' });
          return;
        }

        const host = meeting.participants.find(p => p.id === hostId && p.isHost);
        if (!host) {
          socket.emit('error', { message: 'Only the host can end the meeting' });
          return;
        }

        memoryStorage.endMeeting(meetingId, hostId);

        // Notify all participants
        io.to(meetingId).emit('meetingEnded', {
          meetingId: meeting.id,
          reason: 'hostEnded'
        });

        console.log(`Meeting ${meetingId} ended by host ${host.name}`);
      } catch (error) {
        console.error('Error ending meeting:', error);
        socket.emit('error', { message: 'Failed to end meeting' });
      }
    });

    // Toggle mute
    socket.on('toggleMute', async (data) => {
      try {
        const { meetingId, participantId } = data;

        const meeting = memoryStorage.getMeeting(meetingId);
        
        if (!meeting) {
          socket.emit('error', { message: 'Meeting not found' });
          return;
        }

        const participant = meeting.participants.find(p => p.id === participantId);
        if (!participant) {
          socket.emit('error', { message: 'Participant not found' });
          return;
        }

        const updatedParticipant = memoryStorage.updateParticipant(meetingId, participantId, {
          isMuted: !participant.isMuted
        });

        // Notify all participants
        io.to(meetingId).emit('participantUpdated', {
          participantId: participant.id,
          updates: { isMuted: updatedParticipant.isMuted }
        });

        console.log(`Participant ${participant.name} ${updatedParticipant.isMuted ? 'muted' : 'unmuted'} in meeting ${meetingId}`);
      } catch (error) {
        console.error('Error toggling mute:', error);
        socket.emit('error', { message: 'Failed to toggle mute' });
      }
    });

    // Toggle camera
    socket.on('toggleCamera', async (data) => {
      try {
        const { meetingId, participantId } = data;

        const meeting = memoryStorage.getMeeting(meetingId);
        
        if (!meeting) {
          socket.emit('error', { message: 'Meeting not found' });
          return;
        }

        const participant = meeting.participants.find(p => p.id === participantId);
        if (!participant) {
          socket.emit('error', { message: 'Participant not found' });
          return;
        }

        const updatedParticipant = memoryStorage.updateParticipant(meetingId, participantId, {
          isCameraOn: !participant.isCameraOn
        });

        // Notify all participants
        io.to(meetingId).emit('participantUpdated', {
          participantId: participant.id,
          updates: { isCameraOn: updatedParticipant.isCameraOn }
        });

        console.log(`Participant ${participant.name} ${updatedParticipant.isCameraOn ? 'turned on' : 'turned off'} camera in meeting ${meetingId}`);
      } catch (error) {
        console.error('Error toggling camera:', error);
        socket.emit('error', { message: 'Failed to toggle camera' });
      }
    });

    // Update participant name
    socket.on('updateParticipantName', async (data) => {
      try {
        const { meetingId, participantId, name } = data;

        if (!name || name.trim().length === 0) {
          socket.emit('error', { message: 'Name cannot be empty' });
          return;
        }

        const meeting = memoryStorage.getMeeting(meetingId);
        
        if (!meeting) {
          socket.emit('error', { message: 'Meeting not found' });
          return;
        }

        const participant = meeting.participants.find(p => p.id === participantId);
        if (!participant) {
          socket.emit('error', { message: 'Participant not found' });
          return;
        }

        const updatedParticipant = memoryStorage.updateParticipant(meetingId, participantId, {
          name: name.trim()
        });

        // Notify all participants
        io.to(meetingId).emit('participantUpdated', {
          participantId: participant.id,
          updates: { name: updatedParticipant.name }
        });

        console.log(`Participant ${participantId} updated name to ${updatedParticipant.name} in meeting ${meetingId}`);
      } catch (error) {
        console.error('Error updating participant name:', error);
        socket.emit('error', { message: 'Failed to update name' });
      }
    });

    // Send chat message
    socket.on('sendMessage', async (data) => {
      try {
        const { meetingId, participantId, message } = data;

        if (!message || message.trim().length === 0) {
          return;
        }

        const meeting = memoryStorage.getMeeting(meetingId);
        
        if (!meeting) {
          socket.emit('error', { message: 'Meeting not found' });
          return;
        }

        const participant = meeting.participants.find(p => p.id === participantId);
        if (!participant) {
          socket.emit('error', { message: 'Participant not found' });
          return;
        }

        const messageData = {
          id: Date.now().toString(),
          participantId: participant.id,
          participantName: participant.name,
          message: message.trim(),
          timestamp: new Date()
        };

        // Broadcast message to all participants in the meeting
        io.to(meetingId).emit('newMessage', messageData);

        console.log(`Message from ${participant.name} in meeting ${meetingId}: ${message}`);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      try {
        console.log(`User disconnected: ${socket.id}`);

        // Find and update the participant's socket ID
        for (const [meetingId, meeting] of memoryStorage.meetings) {
          const participant = meeting.participants.find(p => p.socketId === socket.id);
          if (participant) {
            memoryStorage.updateParticipant(meetingId, participant.id, { socketId: '' });

            // Notify other participants
            socket.to(meetingId).emit('participantLeft', {
              participantId: participant.id,
              participantName: participant.name
            });

            console.log(`Participant ${participant.name} left meeting ${meetingId}`);
            break;
          }
        }
      } catch (error) {
        console.error('Error handling disconnect:', error);
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });
}; 