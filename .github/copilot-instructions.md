# ConnectSphere Development Instructions

ConnectSphere is a real-time video conferencing and collaboration platform with React frontend and Node.js/Express backend.

## Project Architecture

- **Frontend**: React.js with Tailwind CSS
- **Backend**: Node.js + Express + Socket.io
- **Database**: MongoDB
- **Authentication**: JWT
- **Real-time**: WebRTC + Socket.io

## Development Guidelines

### Code Style
- Use ES6+ syntax
- Consistent naming conventions (camelCase for variables, PascalCase for components)
- Add JSDoc comments for functions
- Keep functions small and focused

### Frontend Standards
- Functional components with hooks
- Keep components in `src/components/`
- Utility functions in `src/utils/`
- Custom hooks in `src/hooks/`
- API calls in `src/services/`

### Backend Standards
- RESTful API design
- Middleware for error handling and validation
- Models in `src/models/`
- Routes in `src/routes/`
- Controllers in `src/controllers/`
- Utility functions in `src/utils/`

### Database Schema
Use MongoDB collections with validated schemas for:
- Users (authentication)
- Rooms (meeting rooms)
- Messages (chat history)
- Files (file storage metadata)

### Git Workflow
- Create feature branches: `feature/feature-name`
- Create bugfix branches: `bugfix/bug-name`
- Commit messages: `type: description` (feat, fix, docs, style, refactor)

## Setup Instructions

1. Install dependencies:
   ```bash
   cd frontend && npm install
   cd ../backend && npm install
   ```

2. Configure environment:
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with actual values
   ```

3. Start development servers:
   - Backend: `cd backend && npm run dev`
   - Frontend: `cd frontend && npm start`

## Common Tasks

- **Add new API endpoint**: Create route in `backend/src/routes/`, add controller
- **Create new component**: Add to `frontend/src/components/`
- **Add database model**: Create schema in `backend/src/models/`
- **Add Socket event**: Define in backend and connect in frontend

## Testing & Validation

- Run backend tests: `npm test` in backend folder
- Run frontend tests: `npm test` in frontend folder
- Check for console errors during development
- Test with multiple browser windows for real-time features

## Deployment

- Frontend → Vercel (connected to GitHub)
- Backend → Render/Railway/AWS
- Database → MongoDB Atlas

Environment variables must be configured before deployment.
