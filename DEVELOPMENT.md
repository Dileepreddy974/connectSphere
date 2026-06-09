# Development Guide

## Overview

ConnectSphere is a full-stack real-time video conferencing application. This guide helps you set up and develop locally.

## Prerequisites

- Node.js 16+ or Docker
- npm or yarn
- Git
- MongoDB (local or Atlas account)

## Quick Start

### Option 1: Local Development (Recommended)

1. **Install dependencies**
   ```bash
   npm run install-all
   ```

2. **Setup environment variables**
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

3. **Edit backend/.env**
   - Set `MONGODB_URI` to your MongoDB connection string
   - Generate and set `JWT_SECRET`
   - Update `FRONTEND_URL` if needed

4. **Start development servers**
   ```bash
   npm run dev
   ```
   - Backend: http://localhost:5000
   - Frontend: http://localhost:3000

### Option 2: Docker Development

1. **Set environment variables**
   ```bash
   cp backend/.env.example backend/.env
   ```

2. **Start services**
   ```bash
   docker-compose up
   ```

3. **Access applications**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000
   - MongoDB: localhost:27017

## Project Structure

```
connectsphere/
├── frontend/               # React application
│   ├── src/
│   │   ├── components/    # React components (to build)
│   │   ├── pages/         # Page components (to build)
│   │   ├── services/      # API & Socket services
│   │   ├── utils/         # Utilities
│   │   └── App.jsx
│   └── package.json
├── backend/               # Node.js/Express server
│   ├── src/
│   │   ├── models/        # Mongoose schemas
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Custom middleware
│   │   ├── utils/         # Utilities
│   │   └── index.js
│   └── package.json
└── docker-compose.yml     # Docker services
```

## Development Commands

### Backend
```bash
cd backend
npm run dev        # Start dev server with hot reload
npm test           # Run tests
npm start          # Production start
```

### Frontend
```bash
cd frontend
npm start          # Start dev server
npm build          # Build for production
npm test           # Run tests
```

### Root
```bash
npm run install-all    # Install all dependencies
npm run dev            # Start both dev servers
npm run build          # Build both for production
npm run test           # Run all tests
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/logout` - Logout

### Rooms
- `POST /api/rooms/create` - Create room
- `POST /api/rooms/join` - Join room
- `GET /api/rooms/:id` - Get room
- `POST /api/rooms/:id/leave` - Leave room

### Files
- `POST /api/files/upload` - Upload file
- `GET /api/files/download/:id` - Download file
- `GET /api/files/room/:roomId` - Get room files

### Messages
- `POST /api/messages/send` - Send message
- `GET /api/messages/room/:roomId` - Get room messages

## Socket Events

- `join-room` - Join video room
- `user-connected` - User joined
- `send-message` - Send chat message
- `receive-message` - Receive message
- `screen-share` - Share screen
- `whiteboard-update` - Sync whiteboard

## Database

### Collections
- **Users** - User accounts and authentication
- **Rooms** - Meeting rooms and participants
- **Messages** - Chat history
- **Files** - File metadata

## Debugging

### Backend Debugging
```bash
cd backend
# Terminal 1
npm run dev

# Terminal 2 - Check logs
docker logs connectsphere-backend
```

### Frontend Debugging
- Use Chrome DevTools (F12)
- Check Console for errors
- Use React DevTools extension

### MongoDB Debugging
```bash
# Connect to MongoDB
mongosh mongodb://admin:password@localhost:27017/connectsphere

# List collections
show collections

# Query users
db.users.find().pretty()
```

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port
# Linux/Mac: lsof -i :5000 | grep LISTEN | awk '{print $2}' | xargs kill
# Windows: netstat -ano | findstr :5000
```

### MongoDB Connection Failed
- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env`
- For Atlas: Add IP to whitelist

### WebRTC Issues
- Check STUN/TURN server configuration
- Ensure camera/microphone permissions granted
- Check browser console for errors

## Production Deployment

### Frontend (Vercel)
1. Push to GitHub
2. Connect repository to Vercel
3. Set environment variables
4. Deploy

### Backend (Railway/Render)
1. Push to GitHub
2. Connect repository to Railway/Render
3. Set environment variables
4. Deploy

### Database (MongoDB Atlas)
1. Create cluster on Atlas
2. Get connection string
3. Set as `MONGODB_URI`

## Performance Tips

- Use React lazy loading for components
- Optimize images and media
- Enable gzip compression
- Use CDN for static files
- Monitor WebRTC bandwidth
- Implement connection pooling for database

## Security Checklist

- [ ] Change `JWT_SECRET` in production
- [ ] Enable HTTPS
- [ ] Set secure cookies
- [ ] Implement rate limiting
- [ ] Validate all inputs
- [ ] Use environment variables for secrets
- [ ] Enable CORS properly
- [ ] Add authentication to WebSocket

## Resources

- [React Documentation](https://react.dev)
- [Express.js Documentation](https://expressjs.com)
- [Socket.io Documentation](https://socket.io)
- [WebRTC Documentation](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [MongoDB Documentation](https://docs.mongodb.com)

## Support

For issues:
1. Check the troubleshooting section
2. Review logs and console errors
3. Check GitHub issues
4. Create a new issue with details

---

Happy coding! 🚀
