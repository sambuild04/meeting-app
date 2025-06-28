import React, { useState } from 'react';
import { Copy, Check, Video, Clock, Users, ArrowLeft, ArrowRight } from 'lucide-react';
import { generateMeetingLink } from '../utils/meetingUtils';
import { Meeting, MeetingSettings } from '../types/meeting';

interface LinkPageProps {
  meeting: Meeting;
  settings: MeetingSettings;
  onJoinMeeting: () => void;
  onBackToHome: () => void;
}

export const LinkPage: React.FC<LinkPageProps> = ({
  meeting,
  settings,
  onJoinMeeting,
  onBackToHome
}) => {
  const [linkCopied, setLinkCopied] = useState(false);
  const meetingLink = generateMeetingLink(meeting.id);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(meetingLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = meetingLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-6">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Meeting Created!
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your meeting is ready. Share the link below with participants or join now to start.
          </p>
        </div>

        {/* Meeting Details Card */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            {/* Meeting Info */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">{settings.title}</h2>
              <div className="flex items-center justify-center space-x-6 text-gray-600">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>{settings.duration} {settings.duration === 1 ? 'minute' : 'minutes'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Host: {settings.hostName}</span>
                </div>
              </div>
            </div>

            {/* Meeting Link */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Link
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={meetingLink}
                    readOnly
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono text-gray-700"
                  />
                  <button
                    onClick={copyToClipboard}
                    className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                      linkCopied 
                        ? 'bg-green-600 text-white' 
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {linkCopied ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">How to use this link:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Share this link with meeting participants</li>
                  <li>• Participants will enter their name to join</li>
                  <li>• The timer starts only when you click "Start Meeting"</li>
                  <li>• Meeting will automatically end after {settings.duration} {settings.duration === 1 ? 'minute' : 'minutes'}</li>
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <button
                onClick={onBackToHome}
                className="flex-1 flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-200"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </button>
              <button
                onClick={onJoinMeeting}
                className="flex-1 flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200"
              >
                <Video className="w-4 h-4 mr-2" />
                Join Meeting
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="text-center text-gray-600">
            <p className="text-sm">
              Meeting ID: <span className="font-mono font-medium text-gray-900">{meeting.id}</span>
            </p>
            <p className="text-xs mt-2">
              Keep this page open or bookmark it to manage your meeting
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};