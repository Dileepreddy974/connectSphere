import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import {
  transcribe,
  getTranscriptions,
  getFullTranscript,
  createSummary,
  getSummaries,
  createActionItems,
  getActionItems,
  updateActionItem,
  deleteActionItem,
  createSpeakerAnalytics,
  getSpeakerAnalytics,
  getAIStatus
} from '../controllers/aiController.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// ── AI Status ──
router.get('/status', getAIStatus);

// ── Live Captions / Transcription ──
router.post('/transcribe', upload.single('audio'), transcribe);
router.get('/transcriptions/:roomId', getTranscriptions);
router.get('/transcriptions/:roomId/full', getFullTranscript);

// ── Meeting Summary ──
router.post('/summary', createSummary);
router.get('/summary/:roomId', getSummaries);

// ── Action Items ──
router.post('/action-items', createActionItems);
router.get('/action-items/:roomId', getActionItems);
router.patch('/action-items/:id', updateActionItem);
router.delete('/action-items/:id', deleteActionItem);

// ── Speaker Analytics ──
router.post('/speaker-analytics', createSpeakerAnalytics);
router.get('/speaker-analytics/:roomId', getSpeakerAnalytics);

export default router;
