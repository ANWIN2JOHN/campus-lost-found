/**
 * Error Handling Middleware
 */

import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/errors.js";
import { Logger } from "../utils/logger.js";

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  Logger.error("Request error", err);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
    return;
  }

  // Handle Mongoose validation errors
  if (err.name === "ValidationError") {
    res.status(400).json({
      success: false,
      message: "Validation error",
      details: err.message,
    });
    return;
  }

  // Handle Mongoose duplicate key error
  if (err.name === "MongoServerError" && "code" in err && err.code === 11000) {
    res.status(409).json({
      success: false,
      message: "Duplicate field value entered",
    });
    return;
  }

  // Generic server error
  res.status(500).json({
    success: false,
    message: "Internal server error",
    ...(process.env.NODE_ENV === "development" && { error: err.message }),
  });
}

export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
}
