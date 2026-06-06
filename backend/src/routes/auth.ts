/**
 * Auth Routes
 */

import { Router } from "express";
import { AuthController } from "../controllers/index.js";
import { validateRequest, schemas } from "../middleware/validation.js";
import { verifyToken } from "../middleware/auth.js";
import { catchAsync } from "../utils/catchAsync.js";

const router = Router();

/**
 * POST /api/auth/login
 * Public endpoint - login admin
 */
router.post(
  "/login",
  validateRequest(schemas.loginSchema),
  catchAsync(AuthController.login)
);

/**
 * POST /api/auth/refresh
 * Public endpoint - refresh access token
 */
router.post("/refresh-token", catchAsync(AuthController.refreshToken));

/**
 * GET /api/auth/profile
 * Protected endpoint - get current user profile
 */
router.get("/profile", verifyToken, catchAsync(AuthController.getProfile));

export default router;
