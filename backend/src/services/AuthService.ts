
/**
 * Authentication Service
 */

import jwt, { SignOptions } from "jsonwebtoken";
import { User } from "../models/index.js";
import { getConfig } from "../config/env.js";
import {
  AuthenticationError,
  ConflictError,
} from "../utils/errors.js";
import type { IJWTPayload } from "../interfaces/index.js";

export class AuthService {
  static async login(
    email: string,
    password: string
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    user: object;
  }> {
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      throw new AuthenticationError("Invalid email or password");
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      throw new AuthenticationError("Invalid email or password");
    }

    const accessToken = this.generateAccessToken(
      user._id.toString(),
      email
    );

    const refreshToken = this.generateRefreshToken(
      user._id.toString()
    );

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

  static async registerAdmin(
    email: string,
    password: string
  ) {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new ConflictError("Email already in use");
    }

    const user = new User({
      email,
      password,
      role: "admin",
    });

    await user.save();

    return {
      id: user._id,
      email: user.email,
      role: user.role,
    };
  }

  static generateAccessToken(
    userId: string,
    email: string
  ): string {
    const config = getConfig();

    const payload: IJWTPayload = {
      id: userId,
      email,
      role: "admin",
    };

    const options: SignOptions = {
      expiresIn: config.jwtExpire as SignOptions["expiresIn"],
    };

    return jwt.sign(
      payload,
      config.jwtSecret as string,
      options
    );
  }

  static generateRefreshToken(
    userId: string
  ): string {
    const config = getConfig();

    const payload: IJWTPayload = {
      id: userId,
      email: "",
      role: "admin",
    };

    const options: SignOptions = {
      expiresIn:
        config.jwtRefreshExpire as SignOptions["expiresIn"],
    };

    return jwt.sign(
      payload,
      config.jwtRefreshSecret as string,
      options
    );
  }

  static verifyRefreshToken(
    token: string
  ): IJWTPayload {
    const config = getConfig();

    try {
      return jwt.verify(
        token,
        config.jwtRefreshSecret as string
      ) as IJWTPayload;
    } catch {
      throw new AuthenticationError(
        "Invalid refresh token"
      );
    }
  }
}
