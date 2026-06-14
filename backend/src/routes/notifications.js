import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getNotifications,
  createNotification,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  getUnreadCount
} from '../controllers/notificationController.js';

const router = express.Router();

router.use(authMiddleware);

// Get unread count
router.get('/unread-count', getUnreadCount);

// Get all notifications
router.get('/', getNotifications);

// Mark all as read
router.put('/read-all', markAllNotificationsRead);

// Create notification (admin/internal)
router.post('/', createNotification);

// Mark single as read
router.put('/:id/read', markNotificationRead);

// Delete notification
router.delete('/:id', deleteNotification);

export default router;
