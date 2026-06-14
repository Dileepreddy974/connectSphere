import Room from '../models/Room.js';
import crypto from 'crypto';
import { getPagination } from '../utils/pagination.js';

/**
 * Create a new room
 */
export const createRoom = async (req, res, next) => {
  try {
    const { title, description, isPrivate, password, maxParticipants } = req.body;

    const roomId = crypto.randomUUID().substring(0, 8); // Simple unique ID

    const room = await Room.create({
      roomId,
      title,
      description,
      isPrivate,
      password, // Note: In production, password should be hashed if used
      maxParticipants,
      createdBy: req.user.id,
      participants: [{
        userId: req.user.id,
        isActive: true
      }]
    });

    return res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: room
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Join an existing room
 */
export const joinRoom = async (req, res, next) => {
  try {
    let { roomId, password } = req.body;

    if (roomId) {
      roomId = roomId.toLowerCase();
    }

    const room = await Room.findOne({ roomId, isActive: true });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found or inactive'
      });
    }

    // Check privacy
    if (room.isPrivate && room.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password for this room'
      });
    }

    // Check if user already in room
    const isParticipant = room.participants.find(p => p.userId.toString() === req.user.id);

    if (!isParticipant) {
      // Check if room is full
      if (room.participants.length >= room.maxParticipants) {
        return res.status(400).json({
          success: false,
          message: 'Room is full'
        });
      }

      room.participants.push({
        userId: req.user.id,
        isActive: true
      });
    } else {
      // Re-activate if they were inactive
      isParticipant.isActive = true;
    }

    await room.save();

    return res.status(200).json({
      success: true,
      message: 'Joined room successfully',
      data: room
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get room details
 */
export const getRoomDetails = async (req, res, next) => {
  try {
    let { roomId } = req.params;
    if (roomId) {
      roomId = roomId.toLowerCase();
    }
    const room = await Room.findOne({ roomId })
      .populate('createdBy', 'name email')
      .populate('participants.userId', 'name email');

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: room
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's active rooms
 */
export const getUserRooms = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query, 25, 50);

    // Find rooms where user is a participant or creator
    const rooms = await Room.find({
      $or: [
        { createdBy: req.user.id },
        { 'participants.userId': req.user.id }
      ],
      isActive: true
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,
      data: rooms,
      pagination: { page, limit }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Leave room
 */
export const leaveRoom = async (req, res, next) => {
  try {
    let { roomId } = req.params;
    if (roomId) {
      roomId = roomId.toLowerCase();
    }
    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    const participantIndex = room.participants.findIndex(p => p.userId.toString() === req.user.id);
    if (participantIndex !== -1) {
      room.participants[participantIndex].isActive = false;
      await room.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Left room successfully'
    });
  } catch (error) {
    next(error);
  }
};
