import React, { useState, useEffect } from 'react';
import { Video, Clock, Users, Link, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { MeetingSettings } from '../types/meeting';

interface HomePageProps {
  onCreateMeeting: (settings: MeetingSettings) => void;
  onJoinMeeting: (meetingId: string, name: string) => void;
  loading?: boolean;
  error?: string | null;
  pendingMeetingId?: string;
}

export const HomePage: React.FC<HomePageProps> = ({ 
  onCreateMeeting, 
  onJoinMeeting, 
  loading = false, 
  error = null,
  pendingMeetingId
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [meetingSettings, setMeetingSettings] = useState<MeetingSettings>({
    title: '',
    duration: 30,
    hostName: ''
  });
  const [joinData, setJoinData] = useState({ meetingId: '', name: '' });

  // Auto-switch to join tab and fill meeting ID if there's a pending meeting
  useEffect(() => {
    if (pendingMeetingId) {
      setActiveTab('join');
      setJoinData(prev => ({ ...prev, meetingId: pendingMeetingId }));
    }
  }, [pendingMeetingId]);

  const handleCreateMeeting = () => {
    if (!meetingSettings.title.trim() || !meetingSettings.hostName.trim()) return;
    onCreateMeeting(meetingSettings);
  };

  const handleJoinMeeting = () => {
    if (!joinData.meetingId.trim() || !joinData.name.trim()) return;
    onJoinMeeting(joinData.meetingId, joinData.name);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-6">
            <Video className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Connect Instantly
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Create secure video meetings with time limits and instant links. 
            Professional video conferencing made simple.
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Main Interface */}
        <div className="max-w-2xl mx-auto">
          {/* Tab Navigation */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-8">
            <button
              onClick={() => setActiveTab('create')}
              className={`flex-1 py-3 px-6 rounded-md font-medium transition-all duration-200 ${
                activeTab === 'create'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Create Meeting
            </button>
            <button
              onClick={() => setActiveTab('join')}
              className={`flex-1 py-3 px-6 rounded-md font-medium transition-all duration-200 ${
                activeTab === 'join'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Join Meeting
            </button>
          </div>

          {/* Create Meeting Form */}
          {activeTab === 'create' && (
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Create New Meeting</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meeting Title
                  </label>
                  <input
                    type="text"
                    value={meetingSettings.title}
                    onChange={(e) => setMeetingSettings(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter meeting title"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name (Host)
                  </label>
                  <input
                    type="text"
                    value={meetingSettings.hostName}
                    onChange={(e) => setMeetingSettings(prev => ({ ...prev, hostName: e.target.value }))}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="inline w-4 h-4 mr-1" />
                    Meeting Duration
                  </label>
                  <select
                    value={meetingSettings.duration}
                    onChange={(e) => setMeetingSettings(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    disabled={loading}
                  >
                    <option value={1}>1 minute</option>
                    <option value={5}>5 minutes</option>
                    <option value={10}>10 minutes</option>
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>

                <button
                  onClick={handleCreateMeeting}
                  disabled={!meetingSettings.title.trim() || !meetingSettings.hostName.trim() || loading}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Meeting...
                    </>
                  ) : (
                    <>
                      Create Meeting
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Join Meeting Form */}
          {activeTab === 'join' && (
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Join Meeting</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meeting ID
                  </label>
                  <input
                    type="text"
                    value={joinData.meetingId}
                    onChange={(e) => setJoinData(prev => ({ ...prev, meetingId: e.target.value }))}
                    placeholder="Enter meeting ID"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={joinData.name}
                    onChange={(e) => setJoinData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    disabled={loading}
                  />
                </div>

                <button
                  onClick={handleJoinMeeting}
                  disabled={!joinData.meetingId.trim() || !joinData.name.trim() || loading}
                  className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Joining Meeting...
                    </>
                  ) : (
                    <>
                      <Users className="mr-2 w-4 h-4" />
                      Join Meeting
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mt-16">
          <div className="text-center p-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Time-Limited Sessions</h3>
            <p className="text-gray-600">Set meeting duration from 1 minute to 2 hours with automatic shutdown.</p>
          </div>
          
          <div className="text-center p-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
              <Link className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Instant Links</h3>
            <p className="text-gray-600">Generate unique meeting links instantly and share with participants.</p>
          </div>
          
          <div className="text-center p-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Real-time Collaboration</h3>
            <p className="text-gray-600">See participants join and leave in real-time with live updates.</p>
          </div>
        </div>
      </div>
    </div>
  );
};