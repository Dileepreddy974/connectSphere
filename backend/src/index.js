import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import { createServer } from "http";
import { initSocket } from "./socket.js";
import client from "prom-client";
import logger from "./utils/winstonLogger.js";
import { centralizedErrorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { apiRateLimiter } from "./middleware/traffic.js";

// Routes
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import roomRoutes from "./routes/rooms.js";
import fileRoutes from "./routes/files.js";
import messageRoutes from "./routes/messages.js";
import notificationRoutes from "./routes/notifications.js";
import invitationRoutes from "./routes/invitations.js";
import attendanceRoutes from "./routes/attendance.js";
import analyticsRoutes from "./routes/analytics.js";

dotenv.config();

const app = express();
const server = createServer(app);
const io = initSocket(server);

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan("combined", {
  stream: { write: (msg) => logger.info(msg.trim(), { source: 'http' }) }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: process.env.CLIENT_URL || true,
    credentials: true
  })
);

// Static files
app.use('/uploads', express.static('uploads'));

// Root Route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "ConnectSphere Backend Running",
    version: "1.0.0"
  });
});

// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memoryUsage: process.memoryUsage(),
    nodeVersion: process.version
  });
});

// Readiness Check
app.get("/ready", (req, res) => {
  const isReady = mongoose.connection.readyState === 1;

  res.status(isReady ? 200 : 503).json({
    status: isReady ? "ready" : "not ready",
    database: mongoose.connection.readyState
  });
});

// Prometheus Metrics Endpoint
app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", client.register.contentType);
    res.end(await client.register.metrics());
  } catch (err) {
    res.status(500).end(err.message);
  }
});

// Apply rate limiting to all API routes
app.use("/api", apiRateLimiter);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/invitations", invitationRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/analytics", analyticsRoutes);

// 404 + Error handlers
app.use(notFoundHandler);
app.use(centralizedErrorHandler);

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI environment variable is missing");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    logger.info("MongoDB Connected", { uri: process.env.MONGODB_URI.replace(/\/\/.*@/, '//***@') });

    server.listen(PORT, "0.0.0.0", () => {
      logger.info(`Server running on port ${PORT}`, { env: process.env.NODE_ENV || 'development' });
    });
  } catch (error) {
    logger.error("Failed to start server", error);
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  logger.info("SIGINT received, shutting down gracefully...");
  await mongoose.connection.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully...");
  await mongoose.connection.close();
  process.exit(0);
});

startServer();

export { app, server };