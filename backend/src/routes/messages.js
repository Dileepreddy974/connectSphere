import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { 
  sendMessage, 
  getRoomMessages, 
  deleteMessage 
} from '../controllers/messageController.js';

const router = express.Router();

// Send a message
router.post('/send', authMiddleware, sendMessage);

// Get messages for a specific room
router.get('/room/:roomId', authMiddleware, getRoomMessages);

// Delete a message
router.delete('/:messageId', authMiddleware, deleteMessage);

export default router;
