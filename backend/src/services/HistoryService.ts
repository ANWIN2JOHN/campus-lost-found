/**
 * Item History Service
 */

import fs from "fs";
import path from "path";

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
  static async checkAndArchiveHistory(): Promise<void> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const startYear = month < 5 ? year - 1 : year;
    const academicYearStart = new Date(startYear, 5, 1, 0, 0, 0, 0); // June 1st of current academic year

    // 1. Fetch old ClaimedItems (returnedDate < academicYearStart)
    const oldClaimed = await ClaimedItem.find({ returnedDate: { $lt: academicYearStart } });
    
    // 2. Fetch old DisposedRecords (disposedDate < academicYearStart)
    const oldDisposed = await DisposedRecord.find({ disposedDate: { $lt: academicYearStart } });

    if (oldClaimed.length === 0 && oldDisposed.length === 0) {
      return; // Nothing to archive
    }

    // Group oldClaimed by academic year
    const claimedByYear: Record<string, typeof oldClaimed> = {};
    for (const item of oldClaimed) {
      const itemDate = new Date(item.returnedDate);
      const iy = itemDate.getFullYear();
      const im = itemDate.getMonth();
      const isy = im < 5 ? iy - 1 : iy;
      const key = `${isy}-${isy + 1}`;
      if (!claimedByYear[key]) claimedByYear[key] = [];
      claimedByYear[key].push(item);
    }

    // Group oldDisposed by academic year
    const disposedByYear: Record<string, typeof oldDisposed> = {};
    for (const item of oldDisposed) {
      const itemDate = new Date(item.disposedDate);
      const iy = itemDate.getFullYear();
      const im = itemDate.getMonth();
      const isy = im < 5 ? iy - 1 : iy;
      const key = `${isy}-${isy + 1}`;
      if (!disposedByYear[key]) disposedByYear[key] = [];
      disposedByYear[key].push(item);
    }

    // Determine secure archive path
    const archivesDir = path.join(process.cwd(), "archives");
    if (!fs.existsSync(archivesDir)) {
      fs.mkdirSync(archivesDir, { recursive: true });
    }

    const escapeCsvValue = (val: any): string => {
      if (val === null || val === undefined) return "";
      let str = String(val);
      str = str.replace(/"/g, '""');
      if (str.includes(",") || str.includes("\n") || str.includes("\r") || str.includes('"')) {
        str = `"${str}"`;
      }
      return str;
    };

    // Process claimed item archives by year
    for (const [ayKey, records] of Object.entries(claimedByYear)) {
      const csvHeaders = ["itemName", "itemType", "student", "rollNo", "returnedDate", "status", "createdAt", "updatedAt"];
      const csvRows = [csvHeaders.join(",")];

      for (const r of records) {
        const row = [
          escapeCsvValue(r.itemName),
          escapeCsvValue(r.itemType),
          escapeCsvValue(r.student),
          escapeCsvValue(r.rollNo),
          escapeCsvValue(r.returnedDate?.toISOString()),
          escapeCsvValue(r.status),
          escapeCsvValue((r as any).createdAt?.toISOString()),
          escapeCsvValue((r as any).updatedAt?.toISOString()),
        ];
        csvRows.push(row.join(","));
      }

      const fileName = `claimed_${ayKey}.csv`;
      const filePath = path.join(archivesDir, fileName);
      fs.writeFileSync(filePath, csvRows.join("\n"), "utf8");

      // Delete archived items from database
      const ids = records.map(r => r._id);
      await ClaimedItem.deleteMany({ _id: { $in: ids } });
    }

    // Process disposed record archives by year
    for (const [ayKey, records] of Object.entries(disposedByYear)) {
      const csvHeaders = [
        "itemName", "itemType", "dateReported", "location", "reporter",
        "reporterPhone", "reporterEmail", "disposalLocation", "donatedTo",
        "disposedDate", "notes", "createdAt", "updatedAt"
      ];
      const csvRows = [csvHeaders.join(",")];

      for (const r of records) {
        const row = [
          escapeCsvValue(r.itemName),
          escapeCsvValue(r.itemType),
          escapeCsvValue(r.dateReported?.toISOString()),
          escapeCsvValue(r.location),
          escapeCsvValue(r.reporter),
          escapeCsvValue(r.reporterPhone),
          escapeCsvValue(r.reporterEmail),
          escapeCsvValue(r.disposalLocation),
          escapeCsvValue(r.donatedTo),
          escapeCsvValue(r.disposedDate?.toISOString()),
          escapeCsvValue(r.notes),
          escapeCsvValue((r as any).createdAt?.toISOString()),
          escapeCsvValue((r as any).updatedAt?.toISOString()),
        ];
        csvRows.push(row.join(","));
      }

      const fileName = `disposed_${ayKey}.csv`;
      const filePath = path.join(archivesDir, fileName);
      fs.writeFileSync(filePath, csvRows.join("\n"), "utf8");

      // Delete archived records from database
      const ids = records.map(r => r._id);
      await DisposedRecord.deleteMany({ _id: { $in: ids } });
    }
  }

  static async getClaimedItems(
    query: IPaginationQuery
  ): Promise<IPaginatedResponse<IClaimedItem>> {
    await HistoryService.checkAndArchiveHistory();

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
    await HistoryService.checkAndArchiveHistory();

    const page = Math.max(1, query.page || 1);
    const limit = query.limit || PAGINATION.ADMIN_DEFAULT_ROWS;
    const skip = (page - 1) * limit;

    const allLostItems = await LostItem.find({
      status: ITEM_STATUS.NOT_RETURNED,
    });

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const startYear = month < 5 ? year - 1 : year;
    const academicYearStart = new Date(startYear, 5, 1, 0, 0, 0, 0);

    const lostAndNotFound = allLostItems.filter((item) => {
      const itemDate = new Date(item.reportedAt || item.dateLost);
      return itemDate >= academicYearStart && isItemExpired(item.reportedAt || item.dateLost);
    });

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
    await HistoryService.checkAndArchiveHistory();

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
    await HistoryService.checkAndArchiveHistory();

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