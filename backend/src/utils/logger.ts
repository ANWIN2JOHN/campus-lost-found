/**
 * Logger Utility
 */

type LogLevel = "info" | "warn" | "error" | "debug";

export class Logger {
  static log(level: LogLevel, message: string, data?: unknown) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    if (data) {
      console.log(prefix, message, data);
    } else {
      console.log(prefix, message);
    }
  }

  static info(message: string, data?: unknown) {
    this.log("info", message, data);
  }

  static warn(message: string, data?: unknown) {
    this.log("warn", message, data);
  }

  static error(message: string, error?: unknown) {
    this.log("error", message, error instanceof Error ? error.message : error);
  }

  static debug(message: string, data?: unknown) {
    if (process.env.NODE_ENV === "development") {
      this.log("debug", message, data);
    }
  }
}
