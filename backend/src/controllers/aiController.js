import Transcription from '../models/Transcription.js';
import MeetingSummary from '../models/MeetingSummary.js';
import ActionItem from '../models/ActionItem.js';
import SpeakerAnalytic from '../models/SpeakerAnalytic.js';
import {
  transcribeAudio,
  generateSummary,
  extractActionItems,
  analyzeSpeakers,
  isAIEnabled
} from '../services/openaiService.js';
import logger from '../utils/winstonLogger.js';

// ─────────────────────────────────────────────
// LIVE CAPTIONS / TRANSCRIPTION
// ─────────────────────────────────────────────

/**
 * POST /api/ai/transcribe
 * Upload audio chunk and get transcription back.
 * Used for live captions via REST fallback.
 */
export async function transcribe(req, res) {
  try {
    if (!isAIEnabled()) {
      return res.status(503).json({ success: false, message: 'AI features are not configured. Set OPENAI_API_KEY.' });
    }

    const { roomId, language } = req.body;
    if (!roomId) return res.status(400).json({ success: false, message: 'roomId is required' });

    // Expect audio file in multipart upload
    if (!req.file) return res.status(400).json({ success: false, message: 'Audio file is required' });

    const audioBuffer = req.file.buffer || require('fs').readFileSync(req.file.path);
    const filename = req.file.originalname || 'audio.webm';

    const result = await transcribeAudio(audioBuffer, filename, language || 'en');

    // Store transcription segments
    const transcription = await Transcription.create({
      roomId,
      language: language || 'en',
      segments: result.segments.map(seg => ({
        speakerName: 'Speaker',
        text: seg.text,
        startTime: seg.startTime,
        endTime: seg.endTime,
        confidence: seg.confidence
      })),
      fullText: result.text,
      duration: result.duration,
      status: 'completed',
      metadata: { model: 'whisper-1', processedAt: new Date() }
    });

    logger.info('Transcription created', { roomId, transcriptionId: transcription._id });

    res.json({
      success: true,
      data: {
        transcriptionId: transcription._id,
        text: result.text,
        segments: result.segments,
        duration: result.duration
      }
    });
  } catch (error) {
    logger.error('Transcribe endpoint error', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/ai/transcriptions/:roomId
 * Get all transcriptions for a room
 */
export async function getTranscriptions(req, res) {
  try {
    const { roomId } = req.params;
    const { limit = 50, page = 1 } = req.query;

    const transcriptions = await Transcription.find({ roomId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Transcription.countDocuments({ roomId });

    res.json({
      success: true,
      data: transcriptions,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    logger.error('Get transcriptions error', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/ai/transcriptions/:roomId/full
 * Get the full combined transcript for a room
 */
export async function getFullTranscript(req, res) {
  try {
    const { roomId } = req.params;
    const transcriptions = await Transcription.find({ roomId, status: 'completed' })
      .sort({ createdAt: 1 });

    const allSegments = transcriptions.flatMap(t => t.segments);
    const fullText = transcriptions.map(t => t.fullText).join('\n');

    res.json({
      success: true,
      data: {
        segments: allSegments,
        fullText,
        segmentCount: allSegments.length
      }
    });
  } catch (error) {
    logger.error('Get full transcript error', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// ─────────────────────────────────────────────
// MEETING SUMMARY
// ─────────────────────────────────────────────

/**
 * POST /api/ai/summary
 * Generate a meeting summary from existing transcriptions.
 */
export async function createSummary(req, res) {
  try {
    if (!isAIEnabled()) {
      return res.status(503).json({ success: false, message: 'AI features are not configured.' });
    }

    const { roomId, language } = req.body;
    if (!roomId) return res.status(400).json({ success: false, message: 'roomId is required' });

    // Gather all transcription segments for this room
    const transcriptions = await Transcription.find({ roomId, status: 'completed' }).sort({ createdAt: 1 });
    if (transcriptions.length === 0) {
      return res.status(404).json({ success: false, message: 'No transcriptions found for this room. Start captions first.' });
    }

    const allSegments = transcriptions.flatMap(t => t.segments);
    const fullText = transcriptions.map(t => t.fullText).join('\n');

    const summaryResult = await generateSummary(fullText, allSegments, language || 'en');

    const summary = await MeetingSummary.create({
      roomId,
      requestedBy: req.user.id,
      title: summaryResult.title || 'Meeting Summary',
      summary: summaryResult.summary,
      keyPoints: summaryResult.keyPoints || [],
      topics: summaryResult.topics || [],
      participantSummary: summaryResult.participantSummary || [],
      sentiment: summaryResult.sentiment || { overall: 'neutral', score: 0 },
      language: language || 'en',
      metadata: summaryResult.metadata
    });

    logger.info('Meeting summary created', { roomId, summaryId: summary._id });

    res.json({ success: true, data: summary });
  } catch (error) {
    logger.error('Create summary error', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/ai/summary/:roomId
 * Get all summaries for a room
 */
export async function getSummaries(req, res) {
  try {
    const { roomId } = req.params;
    const summaries = await MeetingSummary.find({ roomId })
      .sort({ createdAt: -1 })
      .populate('requestedBy', 'name email');

    res.json({ success: true, data: summaries });
  } catch (error) {
    logger.error('Get summaries error', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// ─────────────────────────────────────────────
// ACTION ITEMS
// ─────────────────────────────────────────────

/**
 * POST /api/ai/action-items
 * Extract action items from meeting transcriptions.
 */
export async function createActionItems(req, res) {
  try {
    if (!isAIEnabled()) {
      return res.status(503).json({ success: false, message: 'AI features are not configured.' });
    }

    const { roomId } = req.body;
    if (!roomId) return res.status(400).json({ success: false, message: 'roomId is required' });

    const transcriptions = await Transcription.find({ roomId, status: 'completed' }).sort({ createdAt: 1 });
    if (transcriptions.length === 0) {
      return res.status(404).json({ success: false, message: 'No transcriptions found for this room.' });
    }

    const allSegments = transcriptions.flatMap(t => t.segments);
    const fullText = transcriptions.map(t => t.fullText).join('\n');

    const items = await extractActionItems(fullText, allSegments);

    // Save each action item
    const savedItems = await ActionItem.insertMany(
      items.map(item => ({
        roomId,
        createdBy: req.user.id,
        text: item.text,
        description: item.description || '',
        assignee: item.assignee || { name: null, userId: null },
        priority: item.priority || 'medium',
        tags: item.tags || [],
        context: item.context || {}
      }))
    );

    logger.info('Action items extracted', { roomId, count: savedItems.length });

    res.json({ success: true, data: savedItems });
  } catch (error) {
    logger.error('Create action items error', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/ai/action-items/:roomId
 * Get action items for a room
 */
export async function getActionItems(req, res) {
  try {
    const { roomId } = req.params;
    const { status } = req.query;

    const filter = { roomId };
    if (status) filter.status = status;

    const items = await ActionItem.find(filter)
      .sort({ priority: -1, createdAt: -1 })
      .populate('createdBy', 'name email');

    res.json({ success: true, data: items });
  } catch (error) {
    logger.error('Get action items error', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * PATCH /api/ai/action-items/:id
 * Update action item status
 */
export async function updateActionItem(req, res) {
  try {
    const { id } = req.params;
    const { status, dueDate, priority, assignee } = req.body;

    const updates = {};
    if (status) {
      updates.status = status;
      if (status === 'completed') {
        updates.completedAt = new Date();
        updates.completedBy = req.user.id;
      }
    }
    if (dueDate !== undefined) updates.dueDate = dueDate;
    if (priority) updates.priority = priority;
    if (assignee) updates.assignee = assignee;

    const item = await ActionItem.findByIdAndUpdate(id, updates, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Action item not found' });

    res.json({ success: true, data: item });
  } catch (error) {
    logger.error('Update action item error', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * DELETE /api/ai/action-items/:id
 */
export async function deleteActionItem(req, res) {
  try {
    const { id } = req.params;
    await ActionItem.findByIdAndDelete(id);
    res.json({ success: true, message: 'Action item deleted' });
  } catch (error) {
    logger.error('Delete action item error', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// ─────────────────────────────────────────────
// SPEAKER ANALYTICS
// ─────────────────────────────────────────────

/**
 * POST /api/ai/speaker-analytics
 * Analyze speakers from meeting transcriptions.
 */
export async function createSpeakerAnalytics(req, res) {
  try {
    if (!isAIEnabled()) {
      return res.status(503).json({ success: false, message: 'AI features are not configured.' });
    }

    const { roomId } = req.body;
    if (!roomId) return res.status(400).json({ success: false, message: 'roomId is required' });

    const transcriptions = await Transcription.find({ roomId, status: 'completed' }).sort({ createdAt: 1 });
    if (transcriptions.length === 0) {
      return res.status(404).json({ success: false, message: 'No transcriptions found for this room.' });
    }

    const allSegments = transcriptions.flatMap(t => t.segments);
    const totalDuration = transcriptions.reduce((sum, t) => sum + (t.duration || 0), 0);

    const speakerResults = await analyzeSpeakers(allSegments, totalDuration);

    // Upsert analytics for each speaker
    const saved = [];
    for (const speaker of speakerResults) {
      const analytic = await SpeakerAnalytic.findOneAndUpdate(
        { roomId, userId: speaker.userId || speaker.userName },
        {
          userName: speaker.userName,
          totalSpeakTime: speaker.totalSpeakTime || 0,
          wordCount: speaker.wordCount || 0,
          wordsPerMinute: speaker.wordsPerMinute || 0,
          percentageOfTalkTime: speaker.percentageOfTalkTime || 0,
          sentiment: speaker.sentiment || { label: 'neutral', score: 0 },
          topics: speaker.topics || [],
          questions: speaker.questions || [],
          fillerWords: speaker.fillerWords || { total: 0, breakdown: {} },
          interruptions: speaker.interruptions || 0,
          'metadata.analyzedAt': new Date()
        },
        { new: true, upsert: true }
      );
      saved.push(analytic);
    }

    logger.info('Speaker analytics generated', { roomId, speakers: saved.length });

    res.json({ success: true, data: saved });
  } catch (error) {
    logger.error('Create speaker analytics error', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/ai/speaker-analytics/:roomId
 * Get speaker analytics for a room
 */
export async function getSpeakerAnalytics(req, res) {
  try {
    const { roomId } = req.params;
    const analytics = await SpeakerAnalytic.find({ roomId }).sort({ totalSpeakTime: -1 });
    res.json({ success: true, data: analytics });
  } catch (error) {
    logger.error('Get speaker analytics error', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/ai/status
 * Check if AI features are enabled
 */
export function getAIStatus(req, res) {
  res.json({
    success: true,
    data: {
      enabled: isAIEnabled(),
      models: {
        transcription: 'whisper-1',
        summary: process.env.OPENAI_SUMMARY_MODEL || 'gpt-4o',
        actionItems: process.env.OPENAI_SUMMARY_MODEL || 'gpt-4o',
        speakerAnalytics: process.env.OPENAI_SUMMARY_MODEL || 'gpt-4o'
      }
    }
  });
}
