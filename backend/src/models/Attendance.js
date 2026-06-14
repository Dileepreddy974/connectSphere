import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  meetingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
    index: true
  },
  roomId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  joinTime: {
    type: Date,
    default: Date.now
  },
  leaveTime: {
    type: Date,
    default: null
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  socketId: {
    type: String,
    default: null
  },
  deviceInfo: {
    browser: String,
    os: String,
    type: String // 'desktop', 'mobile', 'tablet'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

attendanceSchema.index({ roomId: 1, userId: 1 });
attendanceSchema.index({ userId: 1, createdAt: -1 });

// Auto-calculate duration on leave
attendanceSchema.pre('save', function (next) {
  if (this.leaveTime && this.joinTime && !this.duration) {
    this.duration = Math.round((this.leaveTime - this.joinTime) / 1000);
  }
  next();
});

export default mongoose.model('Attendance', attendanceSchema);
