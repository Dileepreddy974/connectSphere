import mongoose from 'mongoose';

const transcriptionSegmentSchema = new mongoose.Schema({
  speakerId: { type: String, default: null },
  speakerName: { type: String, default: 'Unknown' },
  text: { type: String, required: true },
  startTime: { type: Number, required: true },   // seconds from start
  endTime: { type: Number, required: true },
  confidence: { type: Number, min: 0, max: 1, default: 0 },
  isInterim: { type: Boolean, default: false },
}, { _id: true });

const transcriptionSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
  meetingId: { type: String, default: null },
  language: { type: String, default: 'en' },
  segments: [transcriptionSegmentSchema],
  fullText: { type: String, default: '' },
  duration: { type: Number, default: 0 },        // total seconds
  status: {
    type: String,
    enum: ['recording', 'processing', 'completed', 'failed'],
    default: 'recording'
  },
  metadata: {
    model: { type: String, default: 'whisper-1' },
    totalTokens: { type: Number, default: 0 },
    processedAt: { type: Date }
  }
}, { timestamps: true });

// Index for quick room lookups
transcriptionSchema.index({ createdAt: -1 });

export default mongoose.model('Transcription', transcriptionSchema);
