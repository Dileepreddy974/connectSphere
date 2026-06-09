import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  validateLogin,
  validateRegister,
  handleValidationErrors
} from '../middleware/validation.js';
import {
  registerUser,
  loginUser,
  getProfile,
  logoutUser
} from '../controllers/authController.js';

const router = express.Router();

// Register endpoint
router.post('/register', validateRegister, handleValidationErrors, registerUser);

// Login endpoint
router.post('/login', validateLogin, handleValidationErrors, loginUser);

// Get profile endpoint
router.get('/profile', authMiddleware, getProfile);

// Logout endpoint
router.post('/logout', authMiddleware, logoutUser);

export default router;
