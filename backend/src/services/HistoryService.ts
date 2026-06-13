/**
 * Item History Service
 */

import {
  ClaimedItem,
  DisposedRecord,
  LostItem,
  FoundItem,
} from "../models/index.js";

import { isItemExpired } from "../utils/countdown.js";
import { ITEM_STATUS, PAGINATION } from "../constants/index.js";

import type {
  IClaimedItem,
  IDisposedRecord,
  ILostItem,
  IPaginatedResponse,
  IPaginationQuery,
} from "../interfaces/index.js";

export class HistoryService {
  static async getClaimedItems(
    query: IPaginationQuery
  ): Promise<IPaginatedResponse<IClaimedItem>> {
    const page = Math.max(1, query.page || 1);
    const limit = query.limit || PAGINATION.ADMIN_DEFAULT_ROWS;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (query.search) {
      const searchRegex = new RegExp(query.search, "i");

      filter.$or = [
        { itemName: searchRegex },
        { student: searchRegex },
      ];
    }

    const items = await ClaimedItem.find(filter)
      .sort({ returnedDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ClaimedItem.countDocuments(filter);

    return {
      data: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + limit < total,
    };
  }

  static async getLostAndNotFound(
    query: IPaginationQuery
  ): Promise<IPaginatedResponse<ILostItem>> {
    const page = Math.max(1, query.page || 1);
    const limit = query.limit || PAGINATION.ADMIN_DEFAULT_ROWS;
    const skip = (page - 1) * limit;

    const allLostItems = await LostItem.find({
      status: ITEM_STATUS.NOT_RETURNED,
    });

    const lostAndNotFound = allLostItems.filter((item) =>
      isItemExpired(item.reportedAt || item.dateLost)
    );

    let filtered = lostAndNotFound;

    if (query.search) {
      const searchRegex = new RegExp(query.search, "i");

      filtered = lostAndNotFound.filter(
        (item) =>
          searchRegex.test(item.name) ||
          searchRegex.test(item.location) ||
          (item.contact?.studentName
            ? searchRegex.test(item.contact.studentName)
            : false)
      );
    }

    const paginatedItems = filtered.slice(skip, skip + limit);

    return {
      data: paginatedItems,
      total: filtered.length,
      page,
      limit,
      totalPages: Math.ceil(filtered.length / limit),
      hasMore: skip + limit < filtered.length,
    };
  }

  static async getDisposedItems(
    query: IPaginationQuery
  ): Promise<IPaginatedResponse<IDisposedRecord>> {
    const page = Math.max(1, query.page || 1);
    const limit = query.limit || PAGINATION.ADMIN_DEFAULT_ROWS;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (query.search) {
      const searchRegex = new RegExp(query.search, "i");

      filter.$or = [
        { itemName: searchRegex },
        { reporter: searchRegex },
      ];
    }

    const items = await DisposedRecord.find(filter)
      .sort({ disposedDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await DisposedRecord.countDocuments(filter);

    return {
      data: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + limit < total,
    };
  }

  static async markItemAsDisposed(
    itemId: string,
    itemType: "Lost" | "Found",
    disposalData: {
      disposalLocation: string;
      donatedTo?: string;
      notes?: string;
    }
  ): Promise<void> {
    let item: any;

    if (itemType === "Lost") {
      item = await LostItem.findById(itemId);
    } else {
      item = await FoundItem.findById(itemId);
    }

    if (!item) {
      throw new Error(`${itemType} item not found`);
    }

    await DisposedRecord.create({
      itemName: item.name,
      itemType,
      dateReported:
        itemType === "Lost"
          ? item.dateLost
          : item.dateFound,
      location: item.location,
      reporter:
        item.contact?.studentName ||
        item.contact?.staffName ||
        "Unknown",
      reporterPhone:
        item.contact?.studentPhone ||
        item.contact?.staffPhone ||
        "",
      reporterEmail:
        item.contact?.studentEmail ||
        item.contact?.staffEmail ||
        "",
      disposalLocation: disposalData.disposalLocation,
      donatedTo: disposalData.donatedTo || "",
      disposedDate: new Date(),
      notes: disposalData.notes || "",
    });

    if (itemType === "Lost") {
      await LostItem.findByIdAndDelete(itemId);
    } else {
      await FoundItem.findByIdAndDelete(itemId);
    }
  }
}