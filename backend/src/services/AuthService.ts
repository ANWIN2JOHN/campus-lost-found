/**
 * Authentication Service
 */

import jwt from "jsonwebtoken";
import { User } from "../models/index.js";
import { getConfig } from "../config/env.js";
import {
  AuthenticationError,
  ConflictError,
  NotFoundError,
} from "../utils/errors.js";
import type { IJWTPayload } from "../interfaces/index.js";

export class AuthService {
  static async login(
    email: string,
    password: string
  ): Promise<{ accessToken: string; refreshToken: string; user: object }> {
    // Find user with password field
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      throw new AuthenticationError("Invalid email or password");
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      throw new AuthenticationError("Invalid email or password");
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user._id.toString(), email);
    const refreshToken = this.generateRefreshToken(user._id.toString());

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    };
  }

  static async registerAdmin(email: string, password: string) {
    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new ConflictError("Email already in use");
    }

    // Create new user
    const user = new User({ email, password, role: "admin" });
    await user.save();

    return {
      id: user._id,
      email: user.email,
      role: user.role,
    };
  }

  static generateAccessToken(userId: string, email: string): string {
    const config = getConfig();
    const payload: IJWTPayload = {
      id: userId,
      email,
      role: "admin",
    };

    return jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpire,
    });
  }

  static generateRefreshToken(userId: string): string {
    const config = getConfig();
    const payload: IJWTPayload = {
      id: userId,
      email: "",
      role: "admin",
    };

    return jwt.sign(payload, config.jwtRefreshSecret, {
      expiresIn: config.jwtRefreshExpire,
    });
  }

  static verifyRefreshToken(token: string): IJWTPayload {
    const config = getConfig();
    try {
      return jwt.verify(token, config.jwtRefreshSecret) as IJWTPayload;
    } catch (error) {
      throw new AuthenticationError("Invalid refresh token");
    }
  }
}
