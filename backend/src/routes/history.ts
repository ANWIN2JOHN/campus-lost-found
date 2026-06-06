/**
 * History Routes
 */

import { Router } from "express";
import { HistoryController } from "../controllers/index.js";
import { verifyToken, verifyAdmin } from "../middleware/auth.js";
import { validateRequest, schemas } from "../middleware/validation.js";
import { catchAsync } from "../utils/catchAsync.js";

const router = Router();

/**
 * GET /api/history/claimed
 * Protected endpoint - get claimed items history
 */
router.get(
  "/claimed",
  verifyToken,
  verifyAdmin,
  catchAsync(HistoryController.getClaimedItems)
);

/**
 * GET /api/history/lost-not-found
 * Protected endpoint - get lost and not found items
 */
router.get(
  "/lost-not-found",
  verifyToken,
  verifyAdmin,
  catchAsync(HistoryController.getLostAndNotFound)
);

/**
 * GET /api/history/disposed
 * Protected endpoint - get disposed items
 */
router.get(
  "/disposed",
  verifyToken,
  verifyAdmin,
  catchAsync(HistoryController.getDisposedItems)
);

/**
 * POST /api/history/disposed/:itemId/:itemType
 * Protected endpoint - mark item as disposed
 */
router.post(
  "/disposed/:itemId/:itemType",
  verifyToken,
  verifyAdmin,
  validateRequest(schemas.markDisposedSchema),
  catchAsync(HistoryController.markAsDisposed)
);

export default router;
