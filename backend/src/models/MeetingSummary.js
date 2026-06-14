import mongoose from 'mongoose';

const meetingSummarySchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
  transcriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transcription', default: null },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, default: '' },
  summary: { type: String, required: true },
  keyPoints: [{ type: String }],
  topics: [{
    topic: { type: String },
    description: { type: String },
    startTime: { type: Number, default: null },
    endTime: { type: Number, default: null }
  }],
  participantSummary: [{
    userId: { type: String },
    name: { type: String },
    contributions: { type: Number, default: 0 },
    mainTopics: [{ type: String }]
  }],
  sentiment: {
    overall: { type: String, enum: ['positive', 'neutral', 'negative', 'mixed'], default: 'neutral' },
    score: { type: Number, min: -1, max: 1, default: 0 }
  },
  language: { type: String, default: 'en' },
  metadata: {
    model: { type: String, default: 'gpt-4o' },
    tokensUsed: { type: Number, default: 0 },
    processingTimeMs: { type: Number, default: 0 }
  }
}, { timestamps: true });

meetingSummarySchema.index({ createdAt: -1 });

export default mongoose.model('MeetingSummary', meetingSummarySchema);
