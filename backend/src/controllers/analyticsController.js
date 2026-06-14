import mongoose from 'mongoose';
import Analytics from '../models/Analytics.js';
import Room from '../models/Room.js';
import User from '../models/User.js';
import Message from '../models/Message.js';
import Attendance from '../models/Attendance.js';
import { asyncHandler, sendResponse } from '../utils/logger.js';

/**
 * GET /api/analytics/overview
 * Get overall analytics dashboard data
 */
export const getOverview = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalRooms,
    totalMessages,
    activeRooms,
    todayAnalytics
  ] = await Promise.all([
    User.countDocuments(),
    Room.countDocuments(),
    Message.countDocuments(),
    Room.countDocuments({ isActive: true }),
    Analytics.findOne({ date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } })
  ]);

  sendResponse(res, 200, true, 'Analytics overview', {
    totalUsers,
    totalRooms,
    totalMessages,
    activeRooms,
    today: todayAnalytics?.metrics || null
  });
});

/**
 * GET /api/analytics/daily
 * Get daily analytics for a date range
 */
export const getDailyAnalytics = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  const since = new Date();
  since.setDate(since.getDate() - parseInt(days));

  const analytics = await Analytics.find({
    date: { $gte: since }
  }).sort({ date: -1 }).lean();

  sendResponse(res, 200, true, 'Daily analytics', analytics);
});

/**
 * POST /api/analytics/aggregate
 * Trigger aggregation of today's analytics (admin)
 */
export const aggregateToday = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    meetingCount,
    activeUsers,
    totalMessages,
    newRegistrations
  ] = await Promise.all([
    Room.countDocuments({ createdAt: { $gte: today } }),
    Attendance.distinct('userId', { joinTime: { $gte: today } }).then(r => r.length),
    Message.countDocuments({ timestamp: { $gte: today } }),
    User.countDocuments({ createdAt: { $gte: today } })
  ]);

  const analytics = await Analytics.findOneAndUpdate(
    { date: today },
    {
      $set: {
        'metrics.meetingCount': meetingCount,
        'metrics.activeUsers': activeUsers,
        'metrics.totalMessages': totalMessages,
        'metrics.newRegistrations': newRegistrations,
        updatedAt: new Date()
      }
    },
    { upsert: true, new: true }
  );

  sendResponse(res, 200, true, 'Analytics aggregated', analytics);
});

/**
 * GET /api/analytics/user/:userId
 * Get analytics for a specific user
 */
export const getUserAnalytics = asyncHandler(async (req, res) => {
  const userId = req.params.userId;

  const [
    meetingsCreated,
    meetingsAttended,
    messagesSent,
    totalAttendance
  ] = await Promise.all([
    Room.countDocuments({ createdBy: userId }),
    Attendance.countDocuments({ userId }),
    Message.countDocuments({ senderId: userId }),
    Attendance.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, totalDuration: { $sum: '$duration' } } }
    ])
  ]);

  sendResponse(res, 200, true, 'User analytics', {
    meetingsCreated,
    meetingsAttended,
    messagesSent,
    totalMeetingDuration: totalAttendance[0]?.totalDuration || 0
  });
});
