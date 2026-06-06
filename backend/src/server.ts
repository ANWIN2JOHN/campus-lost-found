/**
 * Server Entry Point
 */

import "dotenv/config";
import app, { initializeApp } from "./app.js";
import { getConfig } from "./config/env.js";
import { Logger } from "./utils/logger.js";

const config = getConfig();

async function startServer() {
  try {
    // Initialize application
    await initializeApp();

    // Start listening
    app.listen(config.port, () => {
      Logger.info(
        `🚀 Server is running on http://localhost:${config.port}`
      );
      Logger.info(`📝 Environment: ${config.nodeEnv}`);
      Logger.info(`📋 API Documentation:`);
      Logger.info(`   - Auth: POST /api/auth/login`);
      Logger.info(`   - Lost Items: /api/items/lost`);
      Logger.info(`   - Found Items: /api/items/found`);
      Logger.info(`   - History: /api/history`);
    });
  } catch (error) {
    Logger.error("Failed to start server", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  Logger.info("Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  Logger.info("Shutting down gracefully...");
  process.exit(0);
});

// Start the server
startServer();
