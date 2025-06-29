import React, { useState, useEffect } from 'react';
import { HomePage } from './components/HomePage';
import { LinkPage } from './components/LinkPage';
import { MeetingRoom } from './components/MeetingRoom';
import { Meeting, Participant, MeetingSettings } from './types/meeting';
import { apiService } from './services/api';
import { socketService } from './services/socket';
import { mediaService } from './services/media';

type AppState = 'home' | 'link' | 'meeting';

function App() {
  const [appState, setAppState] = useState<AppState>('home');
  const [currentMeeting, setCurrentMeeting] = useState<Meeting | null>(null);
  const [currentUser, setCurrentUser] = useState<Participant | null>(null);
  const [meetingSettings, setMeetingSettings] = useState<MeetingSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Socket.IO connection
  useEffect(() => {
    const initSocket = async () => {
      try {
        await socketService.connect();
      } catch (error) {
        console.error('Failed to connect to Socket.IO:', error);
      }
    };

    initSocket();

    return () => {
      socketService.disconnect();
    };
  }, []);

  // Handle URL hash routing
  useEffect(() => {
    const handleHashChange = async () => {
      const hash = window.location.hash;
      
      if (hash.startsWith('#/meeting/')) {
        const meetingId = hash.substring(10);
        
        // If we don't have a current user, we need to collect their name first
        if (!currentUser) {
          setAppState('home');
          // Store the meeting ID to join after name is provided
          if (meetingSettings) {
            setMeetingSettings({ ...meetingSettings, pendingMeetingId: meetingId });
          } else {
            setMeetingSettings({ title: '', duration: 30, hostName: '', pendingMeetingId: meetingId });
          }
          return;
        }
        
        // If we have a user but different meeting, join the new meeting
        if (!currentMeeting || currentMeeting.id !== meetingId) {
          // Join the meeting with current user's name
          await handleJoinMeeting(meetingId, currentUser.name);
          return;
        }
        
        // Same meeting, just ensure we're in meeting state
        setAppState('meeting');
        
      } else if (hash.startsWith('#/link/')) {
        const meetingId = hash.substring(7);
        if (currentMeeting && currentMeeting.id === meetingId) {
          setAppState('link');
        } else {
          // Someone clicked a link but we don't have this meeting loaded
          setAppState('home');
        }
      } else {
        setAppState('home');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentMeeting, currentUser, meetingSettings]);

  const handleCreateMeeting = async (settings: MeetingSettings) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.createMeeting(settings);
      
      if (response.success) {
        const meeting: Meeting = {
          id: response.meeting.id,
          title: response.meeting.title,
          duration: response.meeting.duration,
          createdAt: new Date(response.meeting.createdAt),
          participants: response.meeting.participants,
          isActive: response.meeting.isActive
        };

        // Use the host information from the API response
        if (!response.host) {
          throw new Error('Host not found in meeting');
        }

        const host: Participant = {
          id: response.host.id,
          name: response.host.name,
          isHost: response.host.isHost,
          isMuted: response.host.isMuted,
          isCameraOn: response.host.isCameraOn,
          joinedAt: new Date(response.host.joinedAt)
        };

        setCurrentMeeting(meeting);
        setCurrentUser(host);
        setMeetingSettings(settings);
        setAppState('link');
        
        // Update URL to link page
        window.location.hash = `#/link/${meeting.id}`;
      }
    } catch (error) {
      console.error('Error creating meeting:', error);
      setError(error instanceof Error ? error.message : 'Failed to create meeting');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinMeeting = async (meetingId: string, name: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.joinMeeting(meetingId, { name });
      
      if (response.success) {
        const meeting: Meeting = {
          id: response.meeting.id,
          title: response.meeting.title,
          duration: response.meeting.duration,
          createdAt: new Date(),
          participants: response.meeting.participants,
          isActive: response.meeting.isActive
        };

        const participant: Participant = {
          id: response.participant.id,
          name: response.participant.name,
          isHost: response.participant.isHost,
          isMuted: response.participant.isMuted,
          isCameraOn: response.participant.isCameraOn,
          joinedAt: new Date(response.participant.joinedAt)
        };

        setCurrentMeeting(meeting);
        setCurrentUser(participant);
        setAppState('meeting');
        
        // Clear any pending meeting ID
        setMeetingSettings(prev => prev ? { ...prev, pendingMeetingId: undefined } : null);
        
        // Update URL
        window.location.hash = `#/meeting/${meetingId}`;

        // Request media permissions with better error handling
        try {
          console.log('Requesting media permissions...');
          const streams = await mediaService.requestBothPermissions();
          
          if (!streams.audio && !streams.video) {
            console.warn('No media permissions granted');
            setError('Camera and microphone access denied. You can still participate in the meeting.');
          } else if (!streams.audio) {
            console.warn('Audio permission denied');
            setError('Microphone access denied. You can still participate with video.');
          } else if (!streams.video) {
            console.warn('Video permission denied');
            setError('Camera access denied. You can still participate with audio.');
          } else {
            console.log('Media permissions granted successfully');
          }
        } catch (error) {
          console.warn('Media permissions not granted:', error);
          setError('Media permissions not granted. You can still participate in the meeting.');
        }

        // Join Socket.IO room
        if (socketService.connected) {
          socketService.emit('joinMeeting', {
            meetingId: meeting.id,
            participantId: participant.id
          });
        }
      }
    } catch (error) {
      console.error('Error joining meeting:', error);
      setError(error instanceof Error ? error.message : 'Failed to join meeting');
    } finally {
      setLoading(false);
    }
  };

  const handleStartMeeting = async () => {
    if (!currentMeeting || !currentUser) return;
    
    setLoading(true);
    setError(null);

    try {
      // Only call the API to start the meeting, let Socket.IO handle the real-time updates
      const response = await apiService.startMeeting(currentMeeting.id, currentUser.id);
      
      if (response.success) {
        setCurrentMeeting(prev => prev ? {
          ...prev,
          startedAt: new Date(response.meeting.startedAt),
          isActive: response.meeting.isActive
        } : null);

        // Don't emit Socket.IO event here - the API call will trigger the server-side Socket.IO notification
        console.log('Meeting started successfully');
      }
    } catch (error) {
      console.error('Error starting meeting:', error);
      setError(error instanceof Error ? error.message : 'Failed to start meeting');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinFromLink = () => {
    if (!currentMeeting || !currentUser) return;
    
    setAppState('meeting');
    window.location.hash = `#/meeting/${currentMeeting.id}`;

    // Join Socket.IO room
    if (socketService.connected) {
      socketService.emit('joinMeeting', {
        meetingId: currentMeeting.id,
        participantId: currentUser.id
      });
    }
  };

  const handleEndMeeting = async () => {
    if (!currentMeeting || !currentUser) return;

    try {
      if (currentUser.isHost) {
        await apiService.endMeeting(currentMeeting.id, currentUser.id);
      }

      // Emit Socket.IO event
      if (socketService.connected) {
        socketService.emit('endMeeting', {
          meetingId: currentMeeting.id,
          hostId: currentUser.id
        });
      }
    } catch (error) {
      console.error('Error ending meeting:', error);
    } finally {
      // Clean up media streams
      mediaService.stopAll();
      
      setCurrentMeeting(null);
      setCurrentUser(null);
      setMeetingSettings(null);
      setAppState('home');
      window.location.hash = '';
    }
  };

  const handleToggleMute = async () => {
    if (!currentUser || !currentMeeting) return;
    
    try {
      const response = await apiService.updateParticipant(
        currentMeeting.id,
        currentUser.id,
        { isMuted: !currentUser.isMuted }
      );

      if (response.success) {
        const updatedUser = { ...currentUser, isMuted: !currentUser.isMuted };
        const updatedParticipants = currentMeeting.participants.map(p => 
          p.id === currentUser.id ? updatedUser : p
        );
        
        setCurrentUser(updatedUser);
        setCurrentMeeting(prev => prev ? { ...prev, participants: updatedParticipants } : null);

        // Control actual audio stream
        if (updatedUser.isMuted) {
          mediaService.muteAudio();
        } else {
          mediaService.unmuteAudio();
        }

        // Emit Socket.IO event
        if (socketService.connected) {
          socketService.emit('toggleMute', {
            meetingId: currentMeeting.id,
            participantId: currentUser.id
          });
        }
      }
    } catch (error) {
      console.error('Error toggling mute:', error);
    }
  };

  const handleToggleCamera = async () => {
    if (!currentUser || !currentMeeting) return;
    
    try {
      const response = await apiService.updateParticipant(
        currentMeeting.id,
        currentUser.id,
        { isCameraOn: !currentUser.isCameraOn }
      );

      if (response.success) {
        const updatedUser = { ...currentUser, isCameraOn: !currentUser.isCameraOn };
        const updatedParticipants = currentMeeting.participants.map(p => 
          p.id === currentUser.id ? updatedUser : p
        );
        
        setCurrentUser(updatedUser);
        setCurrentMeeting(prev => prev ? { ...prev, participants: updatedParticipants } : null);

        // Control actual video stream
        if (updatedUser.isCameraOn) {
          mediaService.enableVideo();
        } else {
          mediaService.disableVideo();
        }

        // Emit Socket.IO event
        if (socketService.connected) {
          socketService.emit('toggleCamera', {
            meetingId: currentMeeting.id,
            participantId: currentUser.id
          });
        }
      }
    } catch (error) {
      console.error('Error toggling camera:', error);
    }
  };

  // Socket.IO event handlers
  useEffect(() => {
    if (!socketService.connected) return;

    const handleMeetingJoined = (data: any) => {
      console.log('Meeting joined:', data);
      // Update meeting state with real-time data
      setCurrentMeeting(prev => prev ? {
        ...prev,
        participants: data.meeting.participants,
        isActive: data.meeting.isActive,
        startedAt: data.meeting.startedAt ? new Date(data.meeting.startedAt) : undefined
      } : null);
    };

    const handleParticipantJoined = (data: any) => {
      console.log('Participant joined:', data);
      setCurrentMeeting(prev => prev ? {
        ...prev,
        participants: [...prev.participants, data.participant]
      } : null);
    };

    const handleParticipantLeft = (data: any) => {
      console.log('Participant left:', data);
      setCurrentMeeting(prev => prev ? {
        ...prev,
        participants: prev.participants.filter(p => p.id !== data.participantId)
      } : null);
    };

    const handleParticipantUpdated = (data: any) => {
      console.log('Participant updated:', data);
      setCurrentMeeting(prev => prev ? {
        ...prev,
        participants: prev.participants.map(p => 
          p.id === data.participantId ? { ...p, ...data.updates } : p
        )
      } : null);
    };

    const handleMeetingStarted = (data: any) => {
      console.log('Meeting started:', data);
      setCurrentMeeting(prev => prev ? {
        ...prev,
        isActive: true,
        startedAt: new Date(data.startedAt)
      } : null);
    };

    const handleMeetingEnded = (data: any) => {
      console.log('Meeting ended:', data);
      setCurrentMeeting(null);
      setCurrentUser(null);
      setMeetingSettings(null);
      setAppState('home');
      window.location.hash = '';
    };

    const handleError = (data: any) => {
      console.error('Socket error:', data);
      setError(data.message);
    };

    // Register event listeners
    socketService.on('meetingJoined', handleMeetingJoined);
    socketService.on('participantJoined', handleParticipantJoined);
    socketService.on('participantLeft', handleParticipantLeft);
    socketService.on('participantUpdated', handleParticipantUpdated);
    socketService.on('meetingStarted', handleMeetingStarted);
    socketService.on('meetingEnded', handleMeetingEnded);
    socketService.on('error', handleError);

    // Cleanup
    return () => {
      socketService.off('meetingJoined');
      socketService.off('participantJoined');
      socketService.off('participantLeft');
      socketService.off('participantUpdated');
      socketService.off('meetingStarted');
      socketService.off('meetingEnded');
      socketService.off('error');
    };
  }, [socketService.connected]);

  if (appState === 'link' && currentMeeting && meetingSettings) {
    return (
      <LinkPage
        meeting={currentMeeting}
        settings={meetingSettings}
        onJoinMeeting={handleJoinFromLink}
        onBackToHome={() => {
          setAppState('home');
          window.location.hash = '';
        }}
      />
    );
  }

  if (appState === 'meeting' && currentMeeting && currentUser) {
    return (
      <MeetingRoom
        meeting={currentMeeting}
        currentUser={currentUser}
        onEndMeeting={handleEndMeeting}
        onToggleMute={handleToggleMute}
        onToggleCamera={handleToggleCamera}
        onStartMeeting={handleStartMeeting}
        loading={loading}
        error={error}
      />
    );
  }

  return (
    <HomePage
      onCreateMeeting={handleCreateMeeting}
      onJoinMeeting={handleJoinMeeting}
      loading={loading}
      error={error}
      pendingMeetingId={meetingSettings?.pendingMeetingId}
    />
  );
}

export default App;