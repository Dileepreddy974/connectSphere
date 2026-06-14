import express from 'express';
import { getProfile, updateProfile, uploadAvatar } from '../controllers/userController.js';
import { authMiddleware } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/profile/avatar', upload.single('avatar'), uploadAvatar);

export default router;