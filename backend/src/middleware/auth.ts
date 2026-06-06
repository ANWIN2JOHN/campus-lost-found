/**
 * JWT Authentication Middleware
 */

import jwt from "jsonwebtoken";
import { getConfig } from "../config/env.js";
import { AuthenticationError, AuthorizationError } from "../utils/errors.js";
import type { AuthenticatedRequest, IJWTPayload } from "../interfaces/index.js";
import { NextFunction, Response } from "express";

export function verifyToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const token = extractToken(req);

    if (!token) {
      throw new AuthenticationError("No token provided");
    }

    const config = getConfig();
    const decoded = jwt.verify(token, config.jwtSecret) as IJWTPayload;

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: "Token expired" });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: "Invalid token" });
    } else {
      res.status(401).json({ message: (error as Error).message });
    }
  }
}

export function verifyAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    if (!req.user) {
      throw new AuthenticationError("User not authenticated");
    }

    if (req.user.role !== "admin") {
      throw new AuthorizationError("Admin access required");
    }

    next();
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
}

function extractToken(req: AuthenticatedRequest): string | null {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  return null;
}

// Import for error handling
import { AppError } from "../utils/errors.js";
