import Invitation from '../models/Invitation.js';
import Room from '../models/Room.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { asyncHandler, sendResponse, calculatePagination } from '../utils/logger.js';

/**
 * POST /api/invitations
 * Send a meeting invitation
 */
export const sendInvitation = asyncHandler(async (req, res) => {
  const { roomId, email, message } = req.body;

  const room = await Room.findOne({ roomId });
  if (!room) {
    return sendResponse(res, 404, false, 'Meeting room not found');
  }

  // Check if user is already a participant
  const invitedUser = await User.findOne({ email });

  // Check for existing pending invitation
  const existing = await Invitation.findOne({
    roomId,
    email,
    status: 'pending'
  });
  if (existing) {
    return sendResponse(res, 400, false, 'Invitation already sent to this email');
  }

  const invitation = await Invitation.create({
    meetingId: room._id,
    roomId,
    invitedBy: req.user.id,
    email,
    invitedUserId: invitedUser?._id || null,
    message: message || ''
  });

  // Create notification for the invited user if they exist
  if (invitedUser) {
    await Notification.create({
      userId: invitedUser._id,
      title: 'Meeting Invitation',
      message: `${req.user.name || 'Someone'} invited you to "${room.title}"`,
      type: 'invitation',
      actionUrl: `/room/${roomId}`,
      metadata: { invitationId: invitation._id, roomId }
    });
  }

  sendResponse(res, 201, true, 'Invitation sent', invitation);
});

/**
 * GET /api/invitations
 * Get invitations for the authenticated user
 */
export const getInvitations = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const { skip } = calculatePagination(page, limit);

  const filter = {};
  // Find by email or invitedUserId
  if (req.user.email) {
    filter.$or = [
      { email: req.user.email },
      { invitedUserId: req.user.id }
    ];
  }
  if (status) filter.status = status;

  const [invitations, total] = await Promise.all([
    Invitation.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('invitedBy', 'name email avatar')
      .populate('meetingId', 'title roomId')
      .lean(),
    Invitation.countDocuments(filter)
  ]);

  sendResponse(res, 200, true, 'Invitations retrieved', {
    invitations,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * PUT /api/invitations/:id/respond
 * Accept or decline an invitation
 */
export const respondToInvitation = asyncHandler(async (req, res) => {
  const { status } = req.body; // 'accepted' or 'declined'

  if (!['accepted', 'declined'].includes(status)) {
    return sendResponse(res, 400, false, 'Status must be accepted or declined');
  }

  const invitation = await Invitation.findOneAndUpdate(
    {
      _id: req.params.id,
      $or: [
        { invitedUserId: req.user.id },
        { email: req.user.email }
      ],
      status: 'pending'
    },
    { status, respondedAt: new Date() },
    { new: true }
  );

  if (!invitation) {
    return sendResponse(res, 404, false, 'Invitation not found or already responded');
  }

  // If accepted, auto-join the room
  if (status === 'accepted') {
    const room = await Room.findOne({ roomId: invitation.roomId });
    if (room) {
      const alreadyJoined = room.participants.some(
        (p) => p.userId.toString() === req.user.id
      );
      if (!alreadyJoined) {
        room.participants.push({
          userId: req.user.id,
          joinedAt: new Date(),
          isActive: true
        });
        await room.save();
      }
    }
  }

  sendResponse(res, 200, true, `Invitation ${status}`, invitation);
});

/**
 * DELETE /api/invitations/:id
 * Cancel an invitation (by the inviter)
 */
export const cancelInvitation = asyncHandler(async (req, res) => {
  const invitation = await Invitation.findOneAndDelete({
    _id: req.params.id,
    invitedBy: req.user.id
  });

  if (!invitation) {
    return sendResponse(res, 404, false, 'Invitation not found');
  }

  sendResponse(res, 200, true, 'Invitation cancelled');
});
