/**
 * Found Item Service
 */

import { FoundItem, ClaimedItem } from "../models/index.js";
import { NotFoundError } from "../utils/errors.js";
import { getCountdownInfo, isItemExpired } from "../utils/countdown.js";
import { ITEM_STATUS, PAGINATION } from "../constants/index.js";
import type {
  IFoundItem,
  IPaginatedResponse,
  IPaginationQuery,
  ICountdownInfo,
} from "../interfaces/index.js";

interface ReportFoundItemInput {
  name: string;
  description: string;
  category: string;
  location: string;
  dateFound: Date;
  collectFrom: string;
  contactType: "student" | "staff";
  studentName?: string;
  rollNo?: string;
  studentPhone?: string;
  studentEmail?: string;
  staffName?: string;
  employeeId?: string;
  department?: string;
  staffPhone?: string;
  staffEmail?: string;
  imageUrl?: string;
}

export class FoundItemService {
  static async reportItem(data: ReportFoundItemInput): Promise<IFoundItem> {
    const contact = this.buildContact(data);

    const foundItem = new FoundItem({
      name: data.name,
      description: data.description,
      category: data.category,
      location: data.location,
      dateFound: data.dateFound,
      collectFrom: data.collectFrom,
      contact,
      imageUrl: data.imageUrl,
    });

    await foundItem.save();
    return foundItem;
  }

  static async getItems(
    query: IPaginationQuery
  ): Promise<IPaginatedResponse<IFoundItem & { countdownInfo: ICountdownInfo }>> {
    const page = Math.max(1, query.page || 1);
    const limit = query.limit || PAGINATION.BROWSE_PAGE_SIZE;
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = { status: query.status || ITEM_STATUS.NOT_RETURNED };

    if (query.category) {
      filter.category = query.category;
    }

    if (query.location) {
      filter.location = new RegExp(query.location, "i");
    }

    if (query.search) {
      const searchRegex = new RegExp(query.search, "i");
      filter.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { location: searchRegex },
        { "contact.studentName": searchRegex },
      ];
    }

    if (query.dateFrom || query.dateTo) {
      filter.dateFound = {};
      if (query.dateFrom) {
        filter.dateFound.$gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        filter.dateFound.$lte = new Date(query.dateTo);
      }
    }

    // Execute query
    const items = await FoundItem.find(filter)
      .sort({ dateFound: -1 })
      .skip(skip)
      .limit(limit);

    const total = await FoundItem.countDocuments(filter);

    // Add countdown info
    const itemsWithCountdown = items.map((item) => ({
      ...item.toObject(),
      countdownInfo: getCountdownInfo(item.dateFound),
    }));

    return {
      data: itemsWithCountdown,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + limit < total,
    };
  }

  static async getItemById(id: string): Promise<
    IFoundItem & { countdownInfo: ICountdownInfo }
  > {
    const item = await FoundItem.findById(id);

    if (!item) {
      throw new NotFoundError("Found item");
    }

    return {
      ...item.toObject(),
      countdownInfo: getCountdownInfo(item.dateFound),
    };
  }

  static async updateStatus(
    id: string,
    status: string,
    claimedBy?: string,
    claimedRollNo?: string,
    claimedPhone?: string,
    claimedEmail?: string
  ): Promise<IFoundItem> {
    const mongoId = id.replace("FOUND-", "");

      const item = await FoundItem.findByIdAndUpdate(
        mongoId,
      {
        status,
        claimedBy,
        claimedRollNo,
        claimedPhone,
        claimedEmail,
        returnedDate: status === ITEM_STATUS.RETURNED ? new Date() : undefined,
        returnedTime:
          status === ITEM_STATUS.RETURNED
            ? new Date().toLocaleTimeString()
            : undefined,
        lastUpdated: new Date(),
      },
      { new: true }
    );

    if (!item) {
      throw new NotFoundError("Found item");
    }

    // If marked as returned, add to claimed items history
    if (status === ITEM_STATUS.RETURNED) {
      await ClaimedItem.create({
        itemName: item.name,
        itemType: "Found",
        student: claimedBy || "Unknown",
        rollNo: claimedRollNo || "Unknown",
        returnedDate: new Date(),
      });
    }

    return item;
  }

  static async deleteItem(id: string): Promise<void> {
    const result = await FoundItem.findByIdAndDelete(id);

    if (!result) {
      throw new NotFoundError("Found item");
    }
  }

  static async getExpiredItems(): Promise<IFoundItem[]> {
    const items = await FoundItem.find({
      status: ITEM_STATUS.NOT_RETURNED,
    });

    return items.filter((item) => isItemExpired(item.dateFound));
  }

  static async getAdminItems(
    query: IPaginationQuery
  ): Promise<IPaginatedResponse<IFoundItem>> {
    const page = Math.max(1, query.page || 1);
    const limit = query.limit || PAGINATION.ADMIN_DEFAULT_ROWS;
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = {};

    if (query.status) {
      filter.status = query.status;
    }

    if (query.category) {
      filter.category = query.category;
    }

    if (query.search) {
      const searchRegex = new RegExp(query.search, "i");
      filter.$or = [
        { name: searchRegex },
        { "contact.studentName": searchRegex },
        { "contact.studentEmail": searchRegex },
      ];
    }

    // Execute query
    const items = await FoundItem.find(filter)
      .sort({ dateFound: -1 })
      .skip(skip)
      .limit(limit);

    const total = await FoundItem.countDocuments(filter);

    return {
      data: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + limit < total,
    };
  }

  private static buildContact(data: ReportFoundItemInput) {
    const contact: any = { type: data.contactType };

    if (data.contactType === "student") {
      contact.studentName = data.studentName;
      contact.rollNo = data.rollNo;
      contact.studentPhone = data.studentPhone;
      contact.studentEmail = data.studentEmail;
    } else {
      contact.staffName = data.staffName;
      contact.employeeId = data.employeeId;
      contact.department = data.department;
      contact.staffPhone = data.staffPhone;
      contact.staffEmail = data.staffEmail;
    }

    return contact;
  }
}
