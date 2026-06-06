/**
 * History Controller
 */

import { Response } from "express";
import { HistoryService } from "../services/index.js";
import type { AuthenticatedRequest, IPaginationQuery } from "../interfaces/index.js";

export class HistoryController {
  static async getClaimedItems(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    const query: IPaginationQuery = {
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      search: req.query.search as string,
    };

    const result = await HistoryService.getClaimedItems(query);

    res.status(200).json({
      success: true,
      data: result,
    });
  }

  static async getLostAndNotFound(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    const query: IPaginationQuery = {
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      search: req.query.search as string,
    };

    const result = await HistoryService.getLostAndNotFound(query);

    res.status(200).json({
      success: true,
      data: result,
    });
  }

  static async getDisposedItems(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    const query: IPaginationQuery = {
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      search: req.query.search as string,
    };

    const result = await HistoryService.getDisposedItems(query);

    res.status(200).json({
      success: true,
      data: result,
    });
  }

  static async markAsDisposed(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    const { itemId, itemType } = req.params;
    const { disposalLocation, donatedTo, notes } = req.body;

    await HistoryService.markItemAsDisposed(itemId, itemType as "Lost" | "Found", {
      disposalLocation,
      donatedTo,
      notes,
    });

    res.status(200).json({
      success: true,
      message: "Item marked as disposed successfully",
    });
  }
}
