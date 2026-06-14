import Notification from '../models/Notification.js';
import { asyncHandler, sendResponse, calculatePagination } from '../utils/logger.js';

/**
 * GET /api/notifications
 * Get notifications for the authenticated user
 */
export const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly } = req.query;
  const { skip } = calculatePagination(page, limit);

  const filter = { userId: req.user.id };
  if (unreadOnly === 'true') filter.read = false;

  const [notifications, total] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Notification.countDocuments(filter)
  ]);

  sendResponse(res, 200, true, 'Notifications retrieved', {
    notifications,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * POST /api/notifications
 * Create a notification (internal / admin use)
 */
export const createNotification = asyncHandler(async (req, res) => {
  const { userId, title, message, type, actionUrl, metadata } = req.body;

  const notification = await Notification.create({
    userId,
    title,
    message,
    type,
    actionUrl,
    metadata
  });

  sendResponse(res, 201, true, 'Notification created', notification);
});

/**
 * PUT /api/notifications/:id/read
 * Mark a notification as read
 */
export const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    { read: true },
    { new: true }
  );

  if (!notification) {
    return sendResponse(res, 404, false, 'Notification not found');
  }

  sendResponse(res, 200, true, 'Notification marked as read', notification);
});

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read for the user
 */
export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { userId: req.user.id, read: false },
    { read: true }
  );

  sendResponse(res, 200, true, 'All notifications marked as read');
});

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
export const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    userId: req.user.id
  });

  if (!notification) {
    return sendResponse(res, 404, false, 'Notification not found');
  }

  sendResponse(res, 200, true, 'Notification deleted');
});

/**
 * GET /api/notifications/unread-count
 * Get unread notification count
 */
export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    userId: req.user.id,
    read: false
  });

  sendResponse(res, 200, true, 'Unread count retrieved', { count });
});
