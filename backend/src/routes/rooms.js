import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { validateRoomCreate, handleValidationErrors } from '../middleware/validation.js';
import { 
  createRoom, 
  joinRoom, 
  getRoomDetails, 
  getUserRooms, 
  leaveRoom 
} from '../controllers/roomController.js';

const router = express.Router();

// Get all rooms for current user
router.get('/', authMiddleware, getUserRooms);

// Create room
router.post('/create', authMiddleware, validateRoomCreate, handleValidationErrors, createRoom);

// Join room
router.post('/join', authMiddleware, joinRoom);

// Get room details
router.get('/:roomId', authMiddleware, getRoomDetails);

// Leave room
router.post('/:roomId/leave', authMiddleware, leaveRoom);

export default router;
