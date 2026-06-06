/**
 * MongoDB Configuration
 */

import mongoose from "mongoose";
import { Logger } from "../utils/logger.js";

export async function connectDatabase() {
  try {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error("MONGODB_URI environment variable is not set");
    }

    await mongoose.connect(uri);
    Logger.info("✓ MongoDB connected successfully");
  } catch (error) {
    Logger.error("✗ MongoDB connection failed", error);
    process.exit(1);
  }
}

export async function disconnectDatabase() {
  try {
    await mongoose.disconnect();
    Logger.info("✓ MongoDB disconnected");
  } catch (error) {
    Logger.error("✗ MongoDB disconnection failed", error);
  }
}

export function getMongooseConnection() {
  return mongoose;
}
