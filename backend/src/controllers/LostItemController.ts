/**
 * Lost Item Controller
 */

import { Response } from "express";
import { LostItemService } from "../services/index.js";
import type { AuthenticatedRequest, IPaginationQuery } from "../interfaces/index.js";

export class LostItemController {
  static async reportItem(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    const item = await LostItemService.reportItem(req.body);

    res.status(201).json({
      success: true,
      message: "Lost item reported successfully",
      data: item,
    });
  }

  static async getItems(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    const query: IPaginationQuery = {
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      search: req.query.search as string,
      category: req.query.category as string,
      location: req.query.location as string,
      status: req.query.status as string,
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string,
    };

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (query.dateFrom) {
      const fromDate = new Date(query.dateFrom);
      if (!isNaN(fromDate.getTime()) && fromDate > today) {
        res.status(400).json({
          success: false,
          message: "Future dates are not allowed",
        });
        return;
      }
    }

    if (query.dateTo) {
      const toDate = new Date(query.dateTo);
      if (!isNaN(toDate.getTime()) && toDate > today) {
        res.status(400).json({
          success: false,
          message: "Future dates are not allowed",
        });
        return;
      }
    }

    const result = await LostItemService.getItems(query);

    res.status(200).json({
      success: true,
      data: result,
    });
  }

  static async getItemById(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    const { id } = req.params;
    const item = await LostItemService.getItemById(id);

    res.status(200).json({
      success: true,
      data: item,
    });
  }

  static async updateStatus(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    const { id } = req.params;
    const { status, returnedBy, returnedRollNo } = req.body;

    const item = await LostItemService.updateStatus(
      id,
      status,
      returnedBy,
      returnedRollNo
    );

    res.status(200).json({
      success: true,
      message: "Item status updated successfully",
      data: item,
    });
  }

  static async deleteItem(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    const { id } = req.params;
    await LostItemService.deleteItem(id);

    res.status(200).json({
      success: true,
      message: "Lost item deleted successfully",
    });
  }

  static async getExpiredItems(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    const items = await LostItemService.getExpiredItems();

    res.status(200).json({
      success: true,
      data: {
        items,
        count: items.length,
      },
    });
  }

  static async getAdminItems(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    const query: IPaginationQuery = {
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      search: req.query.search as string,
      category: req.query.category as string,
      status: req.query.status as string,
    };

    const result = await LostItemService.getAdminItems(query);

    res.status(200).json({
      success: true,
      data: result,
    });
  }
}
