import mongoose from 'mongoose';
import crypto from 'crypto';

const messageSchema = new mongoose.Schema({
  messageId: {
    type: String,
    unique: true,
    index: true,
    default: () => crypto.randomUUID()
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  roomId: {
    type: String,
    required: true,
    index: true
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: [5000, 'Message cannot be more than 5000 characters']
  },
  type: {
    type: String,
    enum: ['text', 'system', 'file', 'whiteboard'],
    default: 'text'
  },
  attachments: [
    {
      fileName: String,
      fileUrl: String,
      fileSize: Number,
      fileType: String
    }
  ],
  reactions: [
    {
      userId: mongoose.Schema.Types.ObjectId,
      emoji: String
    }
  ],
  readBy: [
    {
      userId: mongoose.Schema.Types.ObjectId,
      readAt: Date
    }
  ],
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

messageSchema.index({ roomId: 1, timestamp: -1 });

export default mongoose.model('Message', messageSchema);
