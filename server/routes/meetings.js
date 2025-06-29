import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { memoryStorage } from '../storage/memory.js';

const router = express.Router();

// Create a new meeting
router.post('/', async (req, res) => {
  try {
    const { title, duration, hostName } = req.body;

    if (!title || !duration || !hostName) {
      return res.status(400).json({
        error: 'Missing required fields: title, duration, hostName'
      });
    }

    if (duration < 1 || duration > 1440) {
      return res.status(400).json({
        error: 'Duration must be between 1 and 1440 minutes'
      });
    }

    const meeting = memoryStorage.createMeeting({
      title,
      duration,
      hostName
    });

    // Find the host participant
    const host = meeting.participants.find(p => p.isHost);

    res.status(201).json({
      success: true,
      meeting: {
        id: meeting.id,
        title: meeting.title,
        duration: meeting.duration,
        createdAt: meeting.createdAt,
        participants: meeting.participants,
        isActive: meeting.isActive,
        hostId: meeting.hostId
      },
      host: host ? {
        id: host.id,
        name: host.name,
        isHost: host.isHost,
        isMuted: host.isMuted,
        isCameraOn: host.isCameraOn,
        joinedAt: host.joinedAt
      } : null
    });
  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({
      error: 'Failed to create meeting'
    });
  }
});

// Get meeting by ID
router.get('/:meetingId', async (req, res) => {
  try {
    const { meetingId } = req.params;
    
    const meeting = memoryStorage.getMeeting(meetingId);
    
    if (!meeting) {
      return res.status(404).json({
        error: 'Meeting not found'
      });
    }

    res.json({
      success: true,
      meeting: {
        id: meeting.id,
        title: meeting.title,
        duration: meeting.duration,
        createdAt: meeting.createdAt,
        startedAt: meeting.startedAt,
        endedAt: meeting.endedAt,
        participants: meeting.participants,
        isActive: meeting.isActive,
        timeRemaining: meeting.isActive && meeting.startedAt 
          ? Math.max(0, (meeting.duration * 60) - Math.floor((Date.now() - meeting.startedAt.getTime()) / 1000))
          : meeting.duration * 60
      }
    });
  } catch (error) {
    console.error('Error fetching meeting:', error);
    res.status(500).json({
      error: 'Failed to fetch meeting'
    });
  }
});

// Join meeting
router.post('/:meetingId/join', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { name, participantId: existingParticipantId } = req.body;

    if (!name) {
      return res.status(400).json({
        error: 'Name is required'
      });
    }

    const meeting = memoryStorage.getMeeting(meetingId);
    
    if (!meeting) {
      return res.status(404).json({
        error: 'Meeting not found'
      });
    }

    // Check if meeting is active and not expired
    if (meeting.isActive && meeting.startedAt) {
      const elapsed = Date.now() - meeting.startedAt.getTime();
      const durationMs = meeting.duration * 60 * 1000;
      if (elapsed >= durationMs) {
        meeting.isActive = false;
        meeting.endedAt = new Date();
        
        return res.status(400).json({
          error: 'Meeting has expired'
        });
      }
    }

    // Check if meeting allows participants to join
    if (!meeting.settings.allowParticipantsToJoin) {
      return res.status(403).json({
        error: 'Meeting is not accepting new participants'
      });
    }

    // Check participant limit
    if (meeting.participants.length >= meeting.settings.maxParticipants) {
      return res.status(403).json({
        error: 'Meeting is full'
      });
    }

    // Generate participant ID if not provided
    const newParticipantId = existingParticipantId || uuidv4();

    // Check if participant already exists
    const existingParticipant = meeting.participants.find(p => p.id === newParticipantId);
    
    if (existingParticipant) {
      // Update existing participant
      existingParticipant.name = name;
      existingParticipant.joinedAt = new Date();
      
      return res.json({
        success: true,
        participant: existingParticipant,
        meeting: {
          id: meeting.id,
          title: meeting.title,
          duration: meeting.duration,
          isActive: meeting.isActive,
          participants: meeting.participants
        }
      });
    }

    // Add new participant
    const newParticipantIdResult = memoryStorage.addParticipant(meetingId, {
      name,
      isHost: false
    });

    const updatedMeeting = memoryStorage.getMeeting(meetingId);
    const newParticipant = updatedMeeting.participants.find(p => p.id === newParticipantIdResult);

    res.json({
      success: true,
      participant: newParticipant,
      meeting: {
        id: updatedMeeting.id,
        title: updatedMeeting.title,
        duration: updatedMeeting.duration,
        isActive: updatedMeeting.isActive,
        participants: updatedMeeting.participants
      }
    });
  } catch (error) {
    console.error('Error joining meeting:', error);
    res.status(500).json({
      error: 'Failed to join meeting'
    });
  }
});

// Start meeting (host only)
router.post('/:meetingId/start', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { hostId } = req.body;

    if (!hostId) {
      return res.status(400).json({
        error: 'Host ID is required'
      });
    }

    const meeting = memoryStorage.getMeeting(meetingId);
    
    if (!meeting) {
      return res.status(404).json({
        error: 'Meeting not found'
      });
    }

    // Verify host
    const host = meeting.participants.find(p => p.id === hostId && p.isHost);
    if (!host) {
      return res.status(403).json({
        error: 'Only the host can start the meeting'
      });
    }

    if (meeting.isActive) {
      return res.status(400).json({
        error: 'Meeting is already active'
      });
    }

    const updatedMeeting = memoryStorage.startMeeting(meetingId, hostId);

    // Emit Socket.IO event to notify all participants
    const io = req.app.get('io');
    if (io) {
      io.to(meetingId).emit('meetingStarted', {
        meetingId: updatedMeeting.id,
        startedAt: updatedMeeting.startedAt,
        duration: updatedMeeting.duration
      });
    }

    res.json({
      success: true,
      meeting: {
        id: updatedMeeting.id,
        isActive: updatedMeeting.isActive,
        startedAt: updatedMeeting.startedAt,
        timeRemaining: updatedMeeting.duration * 60
      }
    });
  } catch (error) {
    console.error('Error starting meeting:', error);
    res.status(500).json({
      error: 'Failed to start meeting'
    });
  }
});

// End meeting (host only)
router.post('/:meetingId/end', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { hostId } = req.body;

    if (!hostId) {
      return res.status(400).json({
        error: 'Host ID is required'
      });
    }

    const meeting = memoryStorage.getMeeting(meetingId);
    
    if (!meeting) {
      return res.status(404).json({
        error: 'Meeting not found'
      });
    }

    // Verify host
    const host = meeting.participants.find(p => p.id === hostId && p.isHost);
    if (!host) {
      return res.status(403).json({
        error: 'Only the host can end the meeting'
      });
    }

    memoryStorage.endMeeting(meetingId, hostId);

    res.json({
      success: true,
      message: 'Meeting ended successfully'
    });
  } catch (error) {
    console.error('Error ending meeting:', error);
    res.status(500).json({
      error: 'Failed to end meeting'
    });
  }
});

// Update participant (mute, camera, etc.)
router.patch('/:meetingId/participants/:participantId', async (req, res) => {
  try {
    const { meetingId, participantId } = req.params;
    const updates = req.body;

    const meeting = memoryStorage.getMeeting(meetingId);
    
    if (!meeting) {
      return res.status(404).json({
        error: 'Meeting not found'
      });
    }

    const participant = meeting.participants.find(p => p.id === participantId);
    if (!participant) {
      return res.status(404).json({
        error: 'Participant not found'
      });
    }

    // Only allow certain fields to be updated
    const allowedUpdates = ['isMuted', 'isCameraOn', 'name'];
    const filteredUpdates = {};
    
    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }

    const updatedParticipant = memoryStorage.updateParticipant(meetingId, participantId, filteredUpdates);

    res.json({
      success: true,
      participant: updatedParticipant
    });
  } catch (error) {
    console.error('Error updating participant:', error);
    res.status(500).json({
      error: 'Failed to update participant'
    });
  }
});

// Get active meetings (for admin purposes)
router.get('/', async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    
    const activeMeetings = memoryStorage.getActiveMeetings();
    const paginatedMeetings = activeMeetings
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    res.json({
      success: true,
      meetings: paginatedMeetings,
      total: activeMeetings.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching active meetings:', error);
    res.status(500).json({
      error: 'Failed to fetch meetings'
    });
  }
});

// Get storage stats
router.get('/stats', async (req, res) => {
  try {
    const stats = memoryStorage.getStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      error: 'Failed to fetch stats'
    });
  }
});

export default router; 