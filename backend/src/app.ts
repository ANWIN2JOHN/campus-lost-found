/**
 * Main Express Application Setup
 */

import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { getConfig } from "./config/env.js";
import { connectDatabase } from "./config/database.js";
import {
  errorHandler,
  notFoundHandler,
  verifyToken,
  verifyAdmin,
} from "./middleware/index.js";
import { Logger } from "./utils/logger.js";
import authRoutes from "./routes/auth.js";
import lostItemRoutes from "./routes/lostItems.js";
import foundItemRoutes from "./routes/foundItems.js";
import historyRoutes from "./routes/history.js";
import { User } from "./models/index.js";

const app = express();
const config = getConfig();

/**
 * Middleware Setup
 */

// Security middleware
app.use(helmet());

// CORS
app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
  })
);

// Body parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

/**
 * Request Logging
 */
app.use((req, express, next) => {
  Logger.debug(`${req.method} ${req.path}`);
  next();
});

/**
 * Health Check Endpoint
 */
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

/**
 * Routes
 */

// Auth routes (public)
app.use("/api/auth", authRoutes);

// Item routes
app.use("/api/items/lost", lostItemRoutes);
app.use("/api/items/found", foundItemRoutes);

// History routes (protected)
app.use("/api/history", historyRoutes);

/**
 * Error Handling
 */

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

/**
 * Database Initialization & Default Admin
 */
export async function initializeApp(): Promise<void> {
  // Connect to database
  await connectDatabase();

  // Create default admin if not exists
  const adminExists = await User.findOne({ email: config.adminEmail });

  if (!adminExists) {
    const admin = new User({
      email: config.adminEmail,
      password: config.adminPassword,
      role: "admin",
    });

    await admin.save();
    Logger.info(
      `✓ Default admin created: ${config.adminEmail}`,
      `(Change password in production!)`
    );
  } else {
    Logger.info(`✓ Admin user already exists`);
  }
}

export default app;
