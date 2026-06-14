import mongoose from 'mongoose';

const speakerAnalyticSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
  userId: { type: String, required: true },
  userName: { type: String, default: 'Unknown' },
  totalSpeakTime: { type: Number, default: 0 },         // seconds
  speakSegments: [{
    startTime: { type: Number },
    endTime: { type: Number },
    duration: { type: Number },
    wordCount: { type: Number, default: 0 }
  }],
  wordCount: { type: Number, default: 0 },
  wordsPerMinute: { type: Number, default: 0 },
  percentageOfTalkTime: { type: Number, default: 0 },   // 0–100
  sentiment: {
    label: { type: String, enum: ['positive', 'neutral', 'negative', 'mixed'], default: 'neutral' },
    score: { type: Number, min: -1, max: 1, default: 0 }
  },
  topics: [{ type: String }],
  questions: [{ type: String }],
  fillerWords: {
    total: { type: Number, default: 0 },
    breakdown: { type: Map, of: Number, default: {} }
  },
  interruptions: { type: Number, default: 0 },
  metadata: {
    analyzedAt: { type: Date, default: Date.now },
    model: { type: String, default: 'gpt-4o' }
  }
}, { timestamps: true });

speakerAnalyticSchema.index({ roomId: 1, userId: 1 }, { unique: true });

export default mongoose.model('SpeakerAnalytic', speakerAnalyticSchema);
