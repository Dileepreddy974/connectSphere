import Attendance from '../models/Attendance.js';
import Room from '../models/Room.js';
import { asyncHandler, sendResponse, calculatePagination } from '../utils/logger.js';

/**
 * POST /api/attendance
 * Record a user joining a meeting
 */
export const recordJoin = asyncHandler(async (req, res) => {
  const { roomId, socketId, deviceInfo } = req.body;

  const room = await Room.findOne({ roomId });
  if (!room) {
    return sendResponse(res, 404, false, 'Room not found');
  }

  const record = await Attendance.create({
    meetingId: room._id,
    roomId,
    userId: req.user.id,
    socketId: socketId || null,
    deviceInfo: deviceInfo || {}
  });

  sendResponse(res, 201, true, 'Attendance recorded', record);
});

/**
 * PUT /api/attendance/:id/leave
 * Record a user leaving a meeting
 */
export const recordLeave = asyncHandler(async (req, res) => {
  const record = await Attendance.findByIdAndUpdate(
    req.params.id,
    { leaveTime: new Date() },
    { new: true }
  );

  if (!record) {
    return sendResponse(res, 404, false, 'Attendance record not found');
  }

  // Calculate duration
  record.duration = Math.round((record.leaveTime - record.joinTime) / 1000);
  await record.save();

  sendResponse(res, 200, true, 'Leave recorded', record);
});

/**
 * GET /api/attendance/room/:roomId
 * Get attendance for a meeting room
 */
export const getRoomAttendance = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const { skip } = calculatePagination(page, limit);

  const [records, total] = await Promise.all([
    Attendance.find({ roomId: req.params.roomId })
      .sort({ joinTime: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'name email avatar')
      .lean(),
    Attendance.countDocuments({ roomId: req.params.roomId })
  ]);

  sendResponse(res, 200, true, 'Attendance retrieved', {
    records,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * GET /api/attendance/my
 * Get current user's attendance history
 */
export const getMyAttendance = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const { skip } = calculatePagination(page, limit);

  const [records, total] = await Promise.all([
    Attendance.find({ userId: req.user.id })
      .sort({ joinTime: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Attendance.countDocuments({ userId: req.user.id })
  ]);

  // Calculate total meeting time
  const aggregate = await Attendance.aggregate([
    { $match: { userId: req.user._id || req.user.id, duration: { $gt: 0 } } },
    { $group: { _id: null, totalDuration: { $sum: '$duration' }, meetingCount: { $sum: 1 } } }
  ]);

  sendResponse(res, 200, true, 'Attendance history retrieved', {
    records,
    summary: {
      totalDuration: aggregate[0]?.totalDuration || 0,
      meetingCount: aggregate[0]?.meetingCount || 0
    },
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});
