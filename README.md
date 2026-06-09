# ConnectSphere

Real-time video conferencing and collaboration platform for students, developers, and teams.

## Project Overview

ConnectSphere is a lightweight, secure, and scalable collaboration tool designed to enable:
- Multi-user video conferencing
- Screen sharing
- Real-time file exchange
- Live whiteboard collaboration
- Instant messaging

## Tech Stack

### Frontend
- **React.js** - UI library
- **Tailwind CSS** - Styling
- **WebRTC API** - Real-time media streaming
- **Canvas API** - Whiteboard rendering
- **Socket.io Client** - Real-time events

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **Socket.io** - WebSocket communication
- **MongoDB** - Database
- **JWT** - Authentication

### Infrastructure
- **Frontend Deployment** - Vercel
- **Backend Deployment** - Render/Railway/AWS
- **Database** - MongoDB Atlas

## Project Structure

```
connectsphere/
├── frontend/               # React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── utils/         # Utility functions
│   │   ├── styles/        # Tailwind styles
│   │   └── App.jsx
│   ├── package.json
│   └── tailwind.config.js
├── backend/               # Node.js/Express server
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── models/        # Database models
│   │   ├── controllers/   # Business logic
│   │   ├── middleware/    # Custom middleware
│   │   ├── utils/         # Utilities
│   │   └── index.js       # Entry point
│   ├── .env.example
│   └── package.json
├── .github/
│   └── copilot-instructions.md
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd connectsphere
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run dev
   ```

3. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   npm start
   ```

## Development

### Backend Development
```bash
cd backend
npm run dev          # Start dev server with hot reload
npm run build        # Build for production
npm start            # Start production server
npm test             # Run tests
```

### Frontend Development
```bash
cd frontend
npm start            # Start dev server
npm run build        # Build for production
npm test             # Run tests
```

## Core Features

### Phase 1
- [x] Authentication (Register/Login)
- [x] Room creation and joining
- [x] Basic UI

### Phase 2
- [x] WebRTC video calling
- [x] Socket.io signaling
- [x] Participant management

### Phase 3
- [x] Screen sharing
- [x] Real-time chat system

### Phase 4
- [x] Whiteboard collaboration
- [x] File sharing

### Phase 5
- [ ] End-to-end encryption
- [x] Performance optimization
- [ ] Production deployment

## Database Schema

### Users
- `id` (ObjectId)
- `name` (String)
- `email` (String)
- `password` (Hashed String)
- `createdAt` (Date)

### Rooms
- `roomId` (String)
- `createdBy` (UserId)
- `participants` (Array)
- `createdAt` (Date)

### Messages
- `messageId` (String)
- `senderId` (UserId)
- `roomId` (String)
- `content` (String)
- `timestamp` (Date)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile

### Rooms
- `POST /api/rooms/create` - Create new room
- `POST /api/rooms/join` - Join existing room
- `GET /api/rooms/:id` - Get room details

### Files
- `POST /api/files/upload` - Upload file
- `GET /api/files/download/:id` - Download file

## Socket Events

| Event | Purpose |
|-------|---------|
| `join-room` | Join meeting |
| `user-connected` | Notify participants |
| `send-message` | Chat message |
| `receive-message` | Receive chat |
| `screen-share` | Share screen |
| `whiteboard-update` | Sync drawing |

## Security

- HTTPS/WSS for secure transport
- JWT token-based authentication
- Password hashing with bcrypt
- Rate limiting
- Input validation and sanitization

## Performance Targets

- Signaling latency: < 300ms
- Video latency: < 500ms
- Support 100+ concurrent users
- 99% uptime target

## Contributing

1. Create a feature branch
2. Commit your changes
3. Push to branch
4. Create Pull Request

## License

MIT

## Support

For issues and questions, please create an GitHub issue.

---

**Last Updated:** May 23, 2026
