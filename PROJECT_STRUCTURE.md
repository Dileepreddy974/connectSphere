# ConnectSphere Project Structure

## Complete Folder Layout

```
connectsphere/
│
├── .github/
│   └── copilot-instructions.md
│
├── .vscode/
│   └── settings.json
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/          # React components (to be built)
│   │   │   ├── Auth/
│   │   │   ├── Meeting/
│   │   │   ├── Chat/
│   │   │   └── Whiteboard/
│   │   ├── pages/               # Page components (to be built)
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── MeetingRoom.jsx
│   │   ├── services/
│   │   │   ├── api.js           # Axios configuration
│   │   │   ├── index.js         # API services (auth, rooms, files, messages)
│   │   │   └── socket.js        # Socket.io services
│   │   ├── utils/
│   │   │   ├── helpers.js       # Helper functions
│   │   │   ├── storage.js       # Local storage utilities
│   │   │   └── webrtc.js        # WebRTC utilities
│   │   ├── App.jsx              # Main app component
│   │   ├── App.css
│   │   ├── index.jsx            # Entry point
│   │   └── index.css            # Global styles
│   ├── .env.example
│   ├── .gitignore
│   ├── Dockerfile
│   ├── package.json
│   ├── postcss.config.js        # PostCSS config for Tailwind
│   └── tailwind.config.js       # Tailwind CSS config
│
├── backend/
│   ├── src/
│   │   ├── models/              # Mongoose schemas
│   │   │   ├── User.js
│   │   │   ├── Room.js
│   │   │   ├── Message.js
│   │   │   └── File.js
│   │   ├── routes/              # API routes
│   │   │   ├── auth.js
│   │   │   ├── rooms.js
│   │   │   ├── files.js
│   │   │   └── messages.js
│   │   ├── controllers/         # Business logic (to be implemented)
│   │   │   ├── authController.js
│   │   │   ├── roomController.js
│   │   │   ├── fileController.js
│   │   │   └── messageController.js
│   │   ├── middleware/
│   │   │   ├── auth.js          # JWT authentication
│   │   │   └── validation.js    # Input validation
│   │   ├── utils/
│   │   │   ├── helpers.js       # Helper functions (JWT, ID generation, etc)
│   │   │   └── logger.js        # Logging utilities
│   │   ├── config.js            # Configuration
│   │   └── index.js             # Entry point (Express server & Socket.io)
│   ├── .env.example
│   ├── .gitignore
│   ├── Dockerfile
│   └── package.json
│
├── .gitignore
├── .dockerignore
├── .prettierrc                  # Code formatting config
├── package.json                 # Root package.json
├── docker-compose.yml           # Docker services
├── README.md                    # Project overview
├── DEVELOPMENT.md               # Development guide
└── API_DOCUMENTATION.md         # API reference
```

## Key Files Explanation

### Configuration Files
- `.env.example` - Environment variable templates
- `.gitignore` - Git exclusions
- `.dockerignore` - Docker build exclusions
- `.prettierrc` - Code formatting rules
- `tailwind.config.js` - Tailwind CSS customization
- `postcss.config.js` - CSS processing
- `docker-compose.yml` - Docker services orchestration

### Frontend
- `services/api.js` - Axios instance with interceptors
- `services/index.js` - API service methods
- `services/socket.js` - Socket.io event handlers
- `utils/helpers.js` - Utility functions
- `utils/storage.js` - Local storage management
- `utils/webrtc.js` - WebRTC configuration

### Backend
- `models/` - MongoDB schemas with validation
- `routes/` - API endpoint definitions (stub implementations)
- `middleware/` - JWT auth, input validation, error handling
- `utils/` - JWT helpers, logger, response formatters
- `index.js` - Express server setup, Socket.io configuration

## Implementation Status

### ✅ Completed
- Project structure scaffolding
- Package.json configurations
- Environment variables setup
- Database schema definitions
- API route stubs
- Middleware implementations
- Frontend service layer setup
- Socket.io configuration
- Docker setup
- Documentation

### 🚀 Next Steps
1. Implement authentication controllers
2. Add user registration/login functionality
3. Build React components
4. Implement WebRTC video calling
5. Add real-time chat
6. Create whiteboard component
7. Add file sharing
8. Implement screen sharing
9. Add tests
10. Deploy to production

## Database Schema

### Users Collection
- `id` (ObjectId)
- `name` (String)
- `email` (String) - unique
- `password` (Hashed String)
- `avatar` (String, optional)
- `bio` (String, optional)
- `isEmailVerified` (Boolean)
- `role` (String: 'user' | 'admin')
- `createdAt` (Date)
- `updatedAt` (Date)

### Rooms Collection
- `roomId` (String) - unique
- `title` (String)
- `description` (String)
- `createdBy` (ObjectId - Reference to User)
- `participants` (Array of Objects)
- `isActive` (Boolean)
- `maxParticipants` (Number)
- `isPrivate` (Boolean)
- `password` (String, optional)
- `createdAt` (Date)
- `updatedAt` (Date)

### Messages Collection
- `messageId` (String) - unique
- `senderId` (ObjectId - Reference to User)
- `roomId` (ObjectId - Reference to Room)
- `content` (String)
- `type` (String: 'text' | 'system' | 'file' | 'whiteboard')
- `attachments` (Array of Objects)
- `reactions` (Array of Objects)
- `readBy` (Array of Objects)
- `timestamp` (Date)
- `updatedAt` (Date)

### Files Collection
- `fileName` (String)
- `fileUrl` (String)
- `fileSize` (Number)
- `fileType` (String)
- `uploadedBy` (ObjectId - Reference to User)
- `roomId` (ObjectId - Reference to Room)
- `isPublic` (Boolean)
- `downloadCount` (Number)
- `uploadedAt` (Date)

## API Endpoints Overview

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/logout` - Logout

### Rooms
- `POST /api/rooms/create` - Create new room
- `POST /api/rooms/join` - Join existing room
- `GET /api/rooms/:id` - Get room details
- `GET /api/rooms` - Get all user's rooms
- `POST /api/rooms/:id/leave` - Leave room

### Files
- `POST /api/files/upload` - Upload file
- `GET /api/files/download/:id` - Download file
- `GET /api/files/room/:roomId` - Get room files
- `DELETE /api/files/:id` - Delete file

### Messages
- `POST /api/messages/send` - Send message
- `GET /api/messages/room/:roomId` - Get room messages
- `PUT /api/messages/:id` - Edit message
- `DELETE /api/messages/:id` - Delete message

## Socket Events

| Event | Direction | Purpose |
|-------|-----------|---------|
| `join-room` | Client → Server | Join video room |
| `user-connected` | Server → Client | Notify new participant |
| `user-disconnected` | Server → Broadcast | User left |
| `send-message` | Client → Server | Send chat message |
| `receive-message` | Server → Broadcast | Broadcast message |
| `screen-share` | Client → Server | Share screen |
| `whiteboard-update` | Client → Server | Update drawing |
| `whiteboard-update` | Server → Broadcast | Sync drawing |

## Technology Stack

### Frontend
- React.js 18+
- Tailwind CSS
- WebRTC API
- Canvas API
- Socket.io Client
- Axios
- React Router

### Backend
- Node.js 18+
- Express.js
- Socket.io
- Mongoose/MongoDB
- JWT
- Bcrypt
- Multer (file upload)

### Infrastructure
- Docker & Docker Compose
- MongoDB (Atlas optional)
- Vercel (Frontend)
- Railway/Render (Backend)

## Development Workflow

1. **Start Development**
   ```bash
   npm run install-all
   npm run dev
   ```

2. **Frontend Development**
   - Build components in `src/components/`
   - Use services from `src/services/`
   - Test in browser at `http://localhost:3000`

3. **Backend Development**
   - Implement controllers in `src/controllers/`
   - Update routes as needed
   - Test endpoints at `http://localhost:5000/api`

4. **Database**
   - Models are already defined
   - Use Mongoose queries in controllers
   - Validate data in middleware

## Quick Reference

### Install Dependencies
```bash
npm run install-all
```

### Start Development Servers
```bash
npm run dev
```

### Run Only Backend
```bash
npm run dev:backend
```

### Run Only Frontend
```bash
npm run dev:frontend
```

### Build for Production
```bash
npm run build
```

### Docker Development
```bash
docker-compose up
```

---

**Project Ready for Development!** 🎉

All scaffolding is complete. Start by implementing the controllers and React components based on the stubs provided.
