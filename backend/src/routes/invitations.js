import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { body } from 'express-validator';
import { handleValidationErrors } from '../middleware/validation.js';
import {
  sendInvitation,
  getInvitations,
  respondToInvitation,
  cancelInvitation
} from '../controllers/invitationController.js';

const router = express.Router();

const validateInvitation = [
  body('roomId').trim().notEmpty().withMessage('Room ID is required'),
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('message').optional().trim().isLength({ max: 500 })
];

const validateInvitationResponse = [
  body('status')
    .isIn(['accepted', 'declined'])
    .withMessage('Status must be accepted or declined')
];

router.use(authMiddleware);

// Get invitations
router.get('/', getInvitations);

// Send invitation
router.post('/', validateInvitation, handleValidationErrors, sendInvitation);

// Respond to invitation
router.put('/:id/respond', validateInvitationResponse, handleValidationErrors, respondToInvitation);

// Cancel invitation
router.delete('/:id', cancelInvitation);

export default router;
