# Meeting App - Real-time Video Conferencing

A modern, real-time video conferencing application built with React, Node.js, and Socket.IO. Features time-limited meetings with automatic shutdown, unique share links, and real-time participant management.

## Features

- 🎥 **Real-time Video Conferencing** - Built with Socket.IO for instant communication
- ⏰ **Time-Limited Meetings** - Automatic meeting shutdown when time expires
- 🔗 **Unique Share Links** - Easy meeting sharing with generated IDs
- 👥 **Participant Management** - Real-time participant join/leave notifications
- 🎤 **Audio/Video Controls** - Mute/unmute, camera on/off functionality
- 💬 **Real-time Chat** - Built-in messaging system
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🔒 **Secure** - Rate limiting, CORS protection, and input validation
- ⚡ **Simple Setup** - No database required, in-memory storage

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Lucide React for icons
- Socket.IO Client for real-time communication

### Backend
- Node.js with Express
- Socket.IO for real-time features
- In-memory storage (no database setup required)
- Rate limiting and security middleware

## Prerequisites

- Node.js 18+ 
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd meeting-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   PORT=3001
   FRONTEND_URL=http://localhost:5173
   ```

4. **Run the application**
   ```bash
   # Development (both frontend and backend)
   npm run dev
   
   # Or run separately:
   npm run dev:frontend  # Frontend only (port 5173)
   npm run dev:backend   # Backend only (port 3001)
   ```

5. **Open your browser**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - Health check: http://localhost:3001/health

6. **Test the backend**
   ```bash
   node test-backend.js
   ```

## API Endpoints

### Meetings
- `POST /api/meetings` - Create a new meeting
- `GET /api/meetings/:meetingId` - Get meeting details
- `POST /api/meetings/:meetingId/join` - Join a meeting
- `POST /api/meetings/:meetingId/start` - Start meeting (host only)
- `POST /api/meetings/:meetingId/end` - End meeting (host only)
- `PATCH /api/meetings/:meetingId/participants/:participantId` - Update participant
- `GET /api/meetings` - Get active meetings
- `GET /api/meetings/stats` - Get storage statistics

### Socket.IO Events

#### Client to Server
- `joinMeeting` - Join a meeting room
- `startMeeting` - Start the meeting (host only)
- `endMeeting` - End the meeting (host only)
- `toggleMute` - Toggle participant mute
- `toggleCamera` - Toggle participant camera
- `updateParticipantName` - Update participant name
- `sendMessage` - Send chat message

#### Server to Client
- `meetingJoined` - Confirmation of joining meeting
- `participantJoined` - New participant joined
- `participantLeft` - Participant left
- `participantUpdated` - Participant state updated
- `meetingStarted` - Meeting started
- `meetingEnded` - Meeting ended
- `newMessage` - New chat message
- `error` - Error notification

## Usage

### Creating a Meeting
1. Open the app in your browser
2. Click "Create Meeting" tab
3. Fill in meeting title, your name, and duration
4. Click "Create Meeting"
5. Share the generated link with participants

### Joining a Meeting
1. Click the meeting link or enter meeting ID
2. Enter your name
3. Click "Join Meeting"
4. Wait for host to start the meeting

### During the Meeting
- **Host Controls**: Start/end meeting, manage participants
- **Audio/Video**: Toggle mute and camera
- **Chat**: Send messages to all participants
- **Participants**: View who's in the meeting
- **Timer**: See remaining time (turns red when < 5 minutes)

## Project Structure

```
meeting-app/
├── src/                    # Frontend React code
│   ├── components/         # React components
│   ├── services/          # API and Socket.IO services
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── server/                # Backend Node.js code
│   ├── storage/           # In-memory storage
│   ├── routes/            # Express routes
│   └── socket/            # Socket.IO handlers
├── package.json           # Dependencies and scripts
├── env.example           # Environment variables template
├── test-backend.js       # Backend testing script
└── README.md             # This file
```

## Development

### Available Scripts
- `npm run dev` - Start both frontend and backend in development
- `npm run dev:frontend` - Start frontend only
- `npm run dev:backend` - Start backend only
- `npm run build` - Build frontend for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Adding Features
1. **Frontend**: Add components in `src/components/`
2. **Backend**: Add routes in `server/routes/` and storage methods in `server/storage/`
3. **Real-time**: Add Socket.IO events in `server/socket/socketHandlers.js`

## Deployment

### Frontend (Vercel/Netlify)
1. Build the project: `npm run build`
2. Deploy the `dist` folder to your hosting service

### Backend (Heroku/Railway/Render)
1. Set environment variables in your hosting platform
2. Deploy the `server` folder
3. Update `FRONTEND_URL` in backend environment

## Storage

This app uses **in-memory storage** which means:
- ✅ **Fast Performance** - No database queries
- ✅ **Simple Setup** - No database installation required
- ✅ **Easy Development** - No configuration needed
- ❌ **Data Loss** - All data is lost when server restarts
- ❌ **Single Server** - Cannot scale to multiple instances

### For Production Use
Consider upgrading to a persistent database:
- **MongoDB Atlas** - Cloud database with free tier
- **PostgreSQL** - Reliable SQL database
- **Redis** - Fast in-memory with persistence

## Security Features

- **Rate Limiting**: Prevents abuse with express-rate-limit
- **CORS Protection**: Configured for specific origins
- **Input Validation**: All inputs validated and sanitized
- **Helmet**: Security headers with helmet middleware
- **Environment Variables**: Sensitive data in environment files

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints

---

**Note**: This is a simplified demo application using in-memory storage. For production use with persistent data, consider adding a database like MongoDB or PostgreSQL. 