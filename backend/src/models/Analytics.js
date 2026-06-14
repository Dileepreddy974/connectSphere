import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    index: true
  },
  metrics: {
    meetingCount: {
      type: Number,
      default: 0
    },
    activeUsers: {
      type: Number,
      default: 0
    },
    recordingHours: {
      type: Number,
      default: 0
    },
    totalMessages: {
      type: Number,
      default: 0
    },
    totalFilesUploaded: {
      type: Number,
      default: 0
    },
    totalFileStorage: {
      type: Number, // in bytes
      default: 0
    },
    peakConcurrentUsers: {
      type: Number,
      default: 0
    },
    avgMeetingDuration: {
      type: Number, // in seconds
      default: 0
    },
    newRegistrations: {
      type: Number,
      default: 0
    }
  },
  hourlyBreakdown: [{
    hour: Number,
    activeUsers: Number,
    meetings: Number
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

analyticsSchema.index({ date: -1 });

export default mongoose.model('Analytics', analyticsSchema);
