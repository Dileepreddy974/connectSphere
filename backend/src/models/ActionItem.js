import mongoose from 'mongoose';

const actionItemSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
  summaryId: { type: mongoose.Schema.Types.ObjectId, ref: 'MeetingSummary', default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  description: { type: String, default: '' },
  assignee: {
    userId: { type: String, default: null },
    name: { type: String, default: null },
    email: { type: String, default: null }
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  dueDate: { type: Date, default: null },
  tags: [{ type: String }],
  context: {
    originalText: { type: String, default: '' },
    speakerName: { type: String, default: '' },
    timestamp: { type: Number, default: null }   // seconds into meeting
  },
  completedAt: { type: Date, default: null },
  completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

actionItemSchema.index({ status: 1, priority: -1 });
actionItemSchema.index({ 'assignee.userId': 1 });

export default mongoose.model('ActionItem', actionItemSchema);
