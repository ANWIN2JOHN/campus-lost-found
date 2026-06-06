/**
 * Found Item Routes
 */

import { Router } from "express";
import { FoundItemController } from "../controllers/index.js";
import { validateRequest, schemas } from "../middleware/validation.js";
import { verifyToken, verifyAdmin } from "../middleware/auth.js";
import { catchAsync } from "../utils/catchAsync.js";

const router = Router();

/**
 * POST /api/items/found/report
 * Public endpoint - report a found item
 */
router.post(
  "/report",
  validateRequest(schemas.reportFoundItemSchema),
  catchAsync(FoundItemController.reportItem)
);

/**
 * GET /api/items/found
 * Public endpoint - get found items with search and filter
 */
router.get("/", catchAsync(FoundItemController.getItems));

/**
 * GET /api/items/found/:id
 * Public endpoint - get single found item details
 */
router.get("/:id", catchAsync(FoundItemController.getItemById));

/**
 * GET /api/items/found/expired
 * Protected endpoint - get expired found items
 */
router.get(
  "/expired",
  verifyToken,
  verifyAdmin,
  catchAsync(FoundItemController.getExpiredItems)
);

/**
 * GET /api/items/found/admin/list
 * Protected endpoint - get all found items for admin
 */
router.get(
  "/admin/list",
  verifyToken,
  verifyAdmin,
  catchAsync(FoundItemController.getAdminItems)
);

/**
 * PUT /api/items/found/:id
 * Protected endpoint - update found item status
 */
router.put(
  "/:id",
  verifyToken,
  verifyAdmin,
  validateRequest(schemas.updateStatusSchema),
  catchAsync(FoundItemController.updateStatus)
);

/**
 * DELETE /api/items/found/:id
 * Protected endpoint - delete found item
 */
router.delete(
  "/:id",
  verifyToken,
  verifyAdmin,
  catchAsync(FoundItemController.deleteItem)
);

export default router;
