import winston from 'winston';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    const stackStr = stack ? `\n${stack}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}${stackStr}`;
  })
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: logFormat,
  defaultMeta: { service: 'connectsphere' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    }),
    // File transport for production
    ...(process.env.NODE_ENV === 'production'
      ? [
          new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
          }),
          new winston.transports.File({
            filename: 'logs/combined.log',
            maxsize: 5242880,
            maxFiles: 5
          })
        ]
      : [])
  ]
});

// Structured log helpers
export const logUserLogin = (userId, email, ip) => {
  logger.info('User login', { userId, email, ip, event: 'auth.login' });
};

export const logUserRegister = (userId, email) => {
  logger.info('User registered', { userId, email, event: 'auth.register' });
};

export const logMeetingCreate = (roomId, title, userId) => {
  logger.info('Meeting created', { roomId, title, userId, event: 'meeting.create' });
};

export const logMeetingJoin = (roomId, userId, socketId) => {
  logger.info('User joined meeting', { roomId, userId, socketId, event: 'meeting.join' });
};

export const logMeetingLeave = (roomId, userId, duration) => {
  logger.info('User left meeting', { roomId, userId, duration, event: 'meeting.leave' });
};

export const logRecordingStart = (roomId, userId) => {
  logger.info('Recording started', { roomId, userId, event: 'recording.start' });
};

export const logRecordingStop = (roomId, userId, duration) => {
  logger.info('Recording stopped', { roomId, userId, duration, event: 'recording.stop' });
};

export const logError = (message, error, context = {}) => {
  logger.error(message, { ...context, error: error?.message, stack: error?.stack });
};

export default logger;
