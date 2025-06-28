# Backend Setup Guide

This document provides a complete guide to setting up and running the meeting app backend.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
```bash
cp env.example .env
```

Edit `.env` with your configuration:
```env
PORT=3001
FRONTEND_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/meeting-app
JWT_SECRET=your-super-secret-jwt-key-here
```

### 3. Start MongoDB
**Local MongoDB:**
```bash
# macOS with Homebrew
brew services start mongodb-community

# Ubuntu/Debian
sudo systemctl start mongod

# Windows
net start MongoDB
```

**Or use MongoDB Atlas (recommended for production):**
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a cluster
3. Get connection string and update `MONGODB_URI`

### 4. Run the Application
```bash
# Development (both frontend and backend)
npm run dev

# Or run separately:
npm run dev:frontend  # Frontend only (port 5173)
npm run dev:backend   # Backend only (port 3001)
```

### 5. Test the Backend
```bash
node test-backend.js
```

## 📁 Backend Structure

```
server/
├── index.js              # Main server file
├── models/
│   └── Meeting.js        # MongoDB schema and methods
├── routes/
│   └── meetings.js       # REST API endpoints
└── socket/
    └── socketHandlers.js # Socket.IO event handlers
```

## 🔧 API Endpoints

### Meetings
- `POST /api/meetings` - Create a new meeting
- `GET /api/meetings/:meetingId` - Get meeting details
- `POST /api/meetings/:meetingId/join` - Join a meeting
- `POST /api/meetings/:meetingId/start` - Start meeting (host only)
- `POST /api/meetings/:meetingId/end` - End meeting (host only)
- `PATCH /api/meetings/:meetingId/participants/:participantId` - Update participant
- `GET /api/meetings` - Get active meetings

### Health Check
- `GET /health` - Server health status

## 🔌 Socket.IO Events

### Client to Server
- `joinMeeting` - Join a meeting room
- `startMeeting` - Start the meeting (host only)
- `endMeeting` - End the meeting (host only)
- `toggleMute` - Toggle participant mute
- `toggleCamera` - Toggle participant camera
- `updateParticipantName` - Update participant name
- `sendMessage` - Send chat message

### Server to Client
- `meetingJoined` - Confirmation of joining meeting
- `participantJoined` - New participant joined
- `participantLeft` - Participant left
- `participantUpdated` - Participant state updated
- `meetingStarted` - Meeting started
- `meetingEnded` - Meeting ended
- `newMessage` - New chat message
- `error` - Error notification

## 🗄️ Database Schema

### Meeting Collection
```javascript
{
  id: String,              // Unique meeting ID
  title: String,           // Meeting title
  duration: Number,        // Duration in minutes
  createdAt: Date,         // Creation timestamp
  startedAt: Date,         // Start timestamp (optional)
  endedAt: Date,           // End timestamp (optional)
  participants: [          // Array of participants
    {
      id: String,          // Participant ID
      name: String,        // Participant name
      isHost: Boolean,     // Is host flag
      isMuted: Boolean,    // Mute status
      isCameraOn: Boolean, // Camera status
      joinedAt: Date,      // Join timestamp
      socketId: String     // Socket.IO connection ID
    }
  ],
  isActive: Boolean,       // Meeting status
  hostId: String,          // Host participant ID
  settings: {              // Meeting settings
    allowParticipantsToJoin: Boolean,
    requireApproval: Boolean,
    maxParticipants: Number
  }
}
```

## 🔒 Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS Protection**: Configured for specific origins
- **Input Validation**: All inputs validated and sanitized
- **Helmet**: Security headers middleware
- **Environment Variables**: Sensitive data protection

## 🧪 Testing

### Manual Testing
```bash
# Test backend API
node test-backend.js

# Test Socket.IO connection
# Open browser console and check for connection logs
```

### API Testing with curl
```bash
# Health check
curl http://localhost:3001/health

# Create meeting
curl -X POST http://localhost:3001/api/meetings \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","duration":30,"hostName":"Host"}'

# Get meeting
curl http://localhost:3001/api/meetings/{meeting-id}

# Join meeting
curl -X POST http://localhost:3001/api/meetings/{meeting-id}/join \
  -H "Content-Type: application/json" \
  -d '{"name":"Participant"}'
```

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   ```
   Error: MongoDB connection error
   ```
   **Solution**: Ensure MongoDB is running and connection string is correct

2. **Port Already in Use**
   ```
   Error: listen EADDRINUSE: address already in use :::3001
   ```
   **Solution**: Change PORT in .env or kill existing process

3. **CORS Error**
   ```
   Error: CORS policy blocked request
   ```
   **Solution**: Check FRONTEND_URL in .env matches your frontend URL

4. **Socket.IO Connection Failed**
   ```
   Error: Failed to connect to Socket.IO server
   ```
   **Solution**: Ensure backend is running and SOCKET_URL is correct

### Debug Mode
```bash
# Enable debug logging
DEBUG=socket.io:* npm run dev:backend
```

### Logs
- Server logs: Console output
- MongoDB logs: Check MongoDB service logs
- Socket.IO logs: Browser console

## 🚀 Production Deployment

### Environment Variables for Production
```env
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://yourdomain.com
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/meeting-app
JWT_SECRET=your-production-secret-key
```

### Deployment Platforms
- **Heroku**: Deploy server folder
- **Railway**: Deploy entire project
- **Render**: Deploy server folder
- **Vercel**: Deploy server folder (with limitations)

### Database
- Use MongoDB Atlas for cloud database
- Set up proper indexes for performance
- Configure backup and monitoring

## 📊 Monitoring

### Health Checks
- `/health` endpoint for uptime monitoring
- Database connection status
- Socket.IO connection status

### Performance
- Monitor meeting creation rate
- Track participant join/leave events
- Monitor database query performance

## 🔄 Updates and Maintenance

### Regular Tasks
- Monitor expired meetings cleanup
- Check database indexes
- Update dependencies
- Review security settings

### Backup Strategy
- MongoDB Atlas automatic backups
- Manual database exports
- Configuration backups

## 📞 Support

For issues and questions:
1. Check this documentation
2. Review error logs
3. Test with provided scripts
4. Create issue in repository

---

**Note**: This backend is designed for the meeting app frontend. Ensure both frontend and backend are properly configured and running for full functionality. 