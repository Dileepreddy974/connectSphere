import Message from '../models/Message.js';
import Room from '../models/Room.js';
import { getPagination } from '../utils/pagination.js';

/**
 * Send a message
 */
export const sendMessage = async (req, res, next) => {
  try {
    const { roomId, content, type } = req.body;

    // Check if room exists
    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    const message = await Message.create({
      roomId,
      senderId: req.user.id,
      content,
      type: type || 'text'
    });

    const populatedMessage = await message.populate('senderId', 'name email');

    return res.status(201).json({
      success: true,
      data: populatedMessage
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get messages for a room
 */
export const getRoomMessages = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { page, limit, skip } = getPagination(req.query);
    
    const messages = await Message.find({ roomId })
      .populate('senderId', 'name email')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,
      data: messages.reverse(),
      pagination: { page, limit }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a message
 */
export const deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Only sender can delete
    if (message.senderId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this message'
      });
    }

    await message.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
