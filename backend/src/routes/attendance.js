import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { body, handleValidationErrors } from 'express-validator';
import {
  recordJoin,
  recordLeave,
  getRoomAttendance,
  getMyAttendance
} from '../controllers/attendanceController.js';

const router = express.Router();

const validateRecordJoin = [
  body('roomId').trim().notEmpty().withMessage('Room ID is required')
];

router.use(authMiddleware);

// Get current user's attendance history
router.get('/my', getMyAttendance);

// Record join
router.post('/', validateRecordJoin, handleValidationErrors, recordJoin);

// Record leave
router.put('/:id/leave', recordLeave);

// Get room attendance
router.get('/room/:roomId', getRoomAttendance);

export default router;
