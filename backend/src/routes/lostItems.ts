/**
 * Lost Item Routes
 */

import { Router } from "express";
import { LostItemController } from "../controllers/index.js";
import { validateRequest, schemas } from "../middleware/validation.js";
import { verifyToken, verifyAdmin } from "../middleware/auth.js";
import { catchAsync } from "../utils/catchAsync.js";

const router = Router();

/**
 * POST /api/items/lost/report
 * Public endpoint - report a lost item
 */
router.post(
  "/report",
  validateRequest(schemas.reportLostItemSchema),
  catchAsync(LostItemController.reportItem)
);

/**
 * GET /api/items/lost
 * Public endpoint - get lost items with search and filter
 */
router.get("/", catchAsync(LostItemController.getItems));

/**
 * GET /api/items/lost/:id
 * Public endpoint - get single lost item details
 */
router.get("/:id", catchAsync(LostItemController.getItemById));

/**
 * GET /api/items/lost/expired
 * Protected endpoint - get expired lost items
 */
router.get(
  "/expired",
  verifyToken,
  verifyAdmin,
  catchAsync(LostItemController.getExpiredItems)
);

/**
 * GET /api/items/lost/admin
 * Protected endpoint - get all lost items for admin
 */
router.get(
  "/admin/list",
  verifyToken,
  verifyAdmin,
  catchAsync(LostItemController.getAdminItems)
);

/**
 * PUT /api/items/lost/:id
 * Protected endpoint - update lost item status
 */
router.put(
  "/:id",
  validateRequest(schemas.updateStatusSchema),
  catchAsync(LostItemController.updateStatus)
);

/**
 * DELETE /api/items/lost/:id
 * Delete lost item
 */
router.delete(
  "/:id",
  catchAsync(LostItemController.deleteItem)
);

export default router;
