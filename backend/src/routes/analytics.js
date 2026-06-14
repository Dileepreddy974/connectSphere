import express from 'express';
import { authMiddleware, authorize } from '../middleware/auth.js';
import {
  getOverview,
  getDailyAnalytics,
  aggregateToday,
  getUserAnalytics
} from '../controllers/analyticsController.js';

const router = express.Router();

router.use(authMiddleware);

// Overview dashboard
router.get('/overview', getOverview);

// Daily analytics
router.get('/daily', getDailyAnalytics);

// Aggregate today (admin only)
router.post('/aggregate', authorize('admin'), aggregateToday);

// User-specific analytics
router.get('/user/:userId', getUserAnalytics);

export default router;
