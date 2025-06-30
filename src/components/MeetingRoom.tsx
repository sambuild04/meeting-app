import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, Video, VideoOff, Phone, Users, 
  Settings, MoreHorizontal, Clock, User, Play, AlertCircle 
} from 'lucide-react';
import { formatTime } from '../utils/meetingUtils';
import { Meeting, Participant } from '../types/meeting';
import { mediaService } from '../services/media';

interface MeetingRoomProps {
  meeting: Meeting;
  currentUser: Participant;
  onEndMeeting: () => void;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onStartMeeting: () => void;
  loading?: boolean;
  error?: string | null;
}

export const MeetingRoom: React.FC<MeetingRoomProps> = ({
  meeting,
  currentUser,
  onEndMeeting,
  onToggleMute,
  onToggleCamera,
  onStartMeeting,
  loading = false,
  error = null
}) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [showParticipants, setShowParticipants] = useState(false);

  useEffect(() => {
    if (!meeting.startedAt || !meeting.isActive) {
      // Meeting hasn't started yet, show full duration
      setTimeRemaining(meeting.duration * 60);
      return;
    }

    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - meeting.startedAt!.getTime()) / 1000);
      const totalSeconds = meeting.duration * 60;
      const remaining = Math.max(0, totalSeconds - elapsed);
      
      setTimeRemaining(remaining);
      
      if (remaining === 0) {
        onEndMeeting();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [meeting.startedAt, meeting.duration, meeting.isActive, onEndMeeting]);

  const getGridCols = (participantCount: number) => {
    if (participantCount === 1) return 'grid-cols-1';
    if (participantCount === 2) return 'grid-cols-2';
    if (participantCount <= 4) return 'grid-cols-2';
    if (participantCount <= 6) return 'grid-cols-3';
    return 'grid-cols-3';
  };

  const VideoPlaceholder: React.FC<{ participant: Participant; isLarge?: boolean; isLocal?: boolean }> = ({ 
    participant, 
    isLarge = false,
    isLocal = false
  }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);

    useEffect(() => {
      if (isLocal && participant.isCameraOn && videoRef.current) {
        const stream = mediaService.getVideoStream();
        console.log('Attaching video stream:', stream);
        if (stream && stream.getVideoTracks().length > 0) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setCameraError(null);
        } else {
          setCameraError('No camera found or permission denied.');
          console.warn('No video tracks found in stream');
        }
      }
    }, [isLocal, participant.isCameraOn]);

    if (isLocal && participant.isCameraOn) {
      return (
        <div className={`relative w-full h-full ${isLarge ? 'aspect-video' : ''}`}>
          <video ref={videoRef} autoPlay muted className="w-full h-full object-cover rounded-lg" style={{ border: '2px solid red' }} />
          {cameraError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 text-white text-lg font-semibold rounded-lg">
              {cameraError}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className={`relative bg-gray-900 rounded-lg overflow-hidden ${
        isLarge ? 'aspect-video' : 'aspect-video'
      }`}>
        {participant.isCameraOn ? (
          <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
          </div>
        ) : (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <User className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-white text-sm font-medium">{participant.name}</p>
            </div>
          </div>
        )}
        
        {/* Participant Info */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <span className="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
              {participant.name}
              {participant.isHost && ' (Host)'}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            {!participant.isMuted ? (
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <Mic className="w-3 h-3 text-white" />
              </div>
            ) : (
              <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <MicOff className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-white">{meeting.title}</h1>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className={`text-sm font-mono ${
              meeting.isActive 
                ? (timeRemaining < 300 ? 'text-red-400' : 'text-gray-300')
                : 'text-blue-400'
            }`}>
              {meeting.isActive ? formatTime(timeRemaining) : `${meeting.duration}:00`}
            </span>
            {!meeting.isActive && (
              <span className="text-xs text-gray-400 ml-2">(Not started)</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Start Meeting Button - Only show for host if meeting not started */}
          {currentUser.isHost && !meeting.isActive && (
            <button
              onClick={onStartMeeting}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Play className="w-4 h-4" />
              <span>{loading ? 'Starting...' : 'Start Meeting'}</span>
            </button>
          )}
          
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-700 rounded-lg text-gray-300 hover:text-white hover:bg-gray-600 transition-colors"
          >
            <Users className="w-4 h-4" />
            <span>{meeting.participants.length}</span>
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900 bg-opacity-50 border-b border-red-700 px-6 py-3">
          <div className="flex items-center space-x-3 text-red-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      <div className="flex-1 flex">
        {/* Main Video Area */}
        <div className="flex-1 p-6">
          {!meeting.isActive && (
            <div className="mb-4 p-4 bg-blue-900 bg-opacity-50 rounded-lg text-center">
              <p className="text-blue-200">
                {currentUser.isHost 
                  ? "Click 'Start Meeting' to begin the timer and start the session"
                  : "Waiting for the host to start the meeting..."
                }
              </p>
            </div>
          )}
          
          <div className={`grid gap-4 h-full ${getGridCols(meeting.participants.length)}`}>
            {meeting.participants.map(participant => (
              <VideoPlaceholder 
                key={participant.id} 
                participant={participant}
                isLarge={meeting.participants.length === 1}
                isLocal={participant.id === currentUser.id}
              />
            ))}
          </div>
        </div>

        {/* Participants Sidebar */}
        {showParticipants && (
          <div className="w-80 bg-gray-800 border-l border-gray-700">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">
                Participants ({meeting.participants.length})
              </h3>
            </div>
            <div className="p-4 space-y-3">
              {meeting.participants.map(participant => (
                <div key={participant.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{participant.name}</p>
                      {participant.isHost && (
                        <p className="text-xs text-gray-400">Host</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {participant.isMuted ? (
                      <MicOff className="w-4 h-4 text-red-400" />
                    ) : (
                      <Mic className="w-4 h-4 text-green-400" />
                    )}
                    {participant.isCameraOn ? (
                      <Video className="w-4 h-4 text-green-400" />
                    ) : (
                      <VideoOff className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 px-6 py-4 flex items-center justify-center space-x-4">
        <button
          onClick={onToggleMute}
          disabled={loading}
          className={`p-4 rounded-full transition-all duration-200 ${
            currentUser.isMuted
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-gray-600 hover:bg-gray-500 text-gray-300 hover:text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title={currentUser.isMuted ? 'Unmute' : 'Mute'}
        >
          {currentUser.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <button
          onClick={onToggleCamera}
          disabled={loading}
          className={`p-4 rounded-full transition-all duration-200 ${
            !currentUser.isCameraOn
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-gray-600 hover:bg-gray-500 text-gray-300 hover:text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title={currentUser.isCameraOn ? 'Turn off camera' : 'Turn on camera'}
        >
          {currentUser.isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>

        <button 
          disabled={loading}
          className="p-4 bg-gray-600 hover:bg-gray-500 rounded-full text-gray-300 hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>

        <button 
          disabled={loading}
          className="p-4 bg-gray-600 hover:bg-gray-500 rounded-full text-gray-300 hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          title="More options"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>

        <button
          onClick={onEndMeeting}
          disabled={loading}
          className="p-4 bg-red-500 hover:bg-red-600 rounded-full text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          title="End meeting"
        >
          <Phone className="w-5 h-5 transform rotate-135" />
        </button>
      </div>
    </div>
  );
};