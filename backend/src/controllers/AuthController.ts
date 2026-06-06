/**
 * Authentication Controller
 */

import { Response } from "express";
import { AuthService } from "../services/index.js";
import type { AuthenticatedRequest } from "../interfaces/index.js";

export class AuthController {
  static async login(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { email, password } = req.body;

    const { accessToken, refreshToken, user } = await AuthService.login(
      email,
      password
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user,
        accessToken,
        refreshToken,
      },
    });
  }

  static async refreshToken(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        message: "Refresh token required",
      });
      return;
    }

    const decoded = AuthService.verifyRefreshToken(refreshToken);
    const newAccessToken = AuthService.generateAccessToken(
      decoded.id,
      decoded.email
    );

    res.status(200).json({
      success: true,
      message: "Token refreshed",
      data: {
        accessToken: newAccessToken,
      },
    });
  }

  static async getProfile(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    res.status(200).json({
      success: true,
      data: {
        user: req.user,
      },
    });
  }
}
