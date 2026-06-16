/**
 * Lost Item Service
 */

import { LostItem, ClaimedItem } from "../models/index.js";
import { NotFoundError, ValidationError } from "../utils/errors.js";
import { getCountdownInfo, isItemExpired } from "../utils/countdown.js";
import { ITEM_STATUS, PAGINATION } from "../constants/index.js";
import type {
  ILostItem,
  IPaginatedResponse,
  IPaginationQuery,
  ICountdownInfo,
} from "../interfaces/index.js";

interface ReportLostItemInput {
  name: string;
  description: string;
  category: string;
  customCategory?: string;
  location: string;
  dateLost: Date;
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

const PREDEFINED_CATEGORIES = [
  "Bags & Backpacks",
  "Water Bottles",
  "Electronics",
  "Books & Notebooks",
  "Keys & Keychains",
  "Accessories",
  "Eyewear",
];

const SYNONYM_MAP: Record<string, string[]> = {
  bag: ["backpack", "sack", "pouch", "tote", "knapsack", "haversack", "bagpack", "school bag", "travel bag", "handbag", "satchel", "kit bag", "gym bag", "skybag", "laptop bag", "duffle", "duffel"],
  backpack: ["bag", "school bag", "travel bag", "knapsack", "haversack", "bagpack", "rucksack", "skybag", "campus bag"],
  phone: ["mobile", "cell", "smartphone", "handphone", "iphone", "android", "cellphone", "handset"],
  mobile: ["phone", "cell", "smartphone", "handphone", "iphone", "android", "cellphone"],
  wallet: ["purse", "billfold", "card holder", "money clip"],
  bottle: ["water bottle", "flask", "tumbler", "sipper", "thermos", "canteen"],
  "water bottle": ["bottle", "flask", "tumbler", "sipper"],
  glasses: ["spectacles", "specs", "eyeglasses", "sunglasses", "shades", "goggles", "reading glasses", "frames"],
  spectacles: ["glasses", "specs", "eyeglasses", "frames"],
  keys: ["key", "keychain", "key ring", "keyring", "locket", "lanyard key"],
  key: ["keys", "keychain", "key ring", "keyring"],
  charger: ["adapter", "cable", "power adapter", "charging cable", "plug"],
  earphones: ["earbuds", "headphones", "headset", "airpods", "earpiece", "in-ear", "buds", "earphone"],
  earphone: ["earbuds", "headphones", "headset", "airpods", "earpiece", "in-ear", "buds", "earphones"],
  earbuds: ["earphone", "earphones", "headphones", "headset", "airpods", "buds"],
  earbud: ["earphone", "earphones", "headphones", "headset", "airpods", "buds"],
  headphones: ["earphones", "earbuds", "headset", "over-ear", "headphone"],
  headphone: ["earphones", "earbuds", "headset", "over-ear", "headphones"],
  umbrella: ["raincoat", "rain cover"],
  book: ["notebook", "textbook", "notes", "journal", "diary", "workbook", "books"],
  books: ["notebook", "textbook", "notes", "journal", "diary", "workbook", "book"],
  notebook: ["book", "books", "notes", "journal", "copy", "notepad", "notebooks"],
  notebooks: ["book", "books", "notes", "journal", "copy", "notepad", "notebook"],
  pen: ["pencil", "marker", "ballpoint", "ink pen", "sketch pen", "highlighter", "pens"],
  pens: ["pencil", "marker", "ballpoint", "ink pen", "sketch pen", "highlighter", "pen"],
  pencil: ["pen", "eraser", "sketch", "pencils"],
  pencils: ["pen", "eraser", "sketch", "pencil"],
  calculator: ["calc", "scientific calculator"],
  laptop: ["computer", "pc", "macbook", "notebook computer", "chromebook", "laptops"],
  laptops: ["computer", "pc", "macbook", "notebook computer", "chromebook", "laptop"],
  watch: ["wristwatch", "timepiece", "clock", "smartwatch", "watches"],
  watches: ["wristwatch", "timepiece", "clock", "smartwatch", "watch"],
  id: ["id card", "identity card", "student id", "college id", "college card", "access card", "pass"],
  "id card": ["identity card", "student id", "college card", "access card", "id"],
  earring: ["earrings", "stud", "hoop", "jewelry"],
  earrings: ["earring", "stud", "hoop", "jewelry"],
  necklace: ["chain", "pendant", "locket", "jewelry"],
  ring: ["band", "finger ring", "jewelry", "rings"],
  rings: ["band", "finger ring", "jewelry", "ring"],
  bracelet: ["bangle", "wristband", "jewelry"],
};

function getExpandedSearchRegex(query: string): RegExp {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const terms = new Set<string>();

  for (const word of words) {
    terms.add(word);
    
    // Add simple singular/plural variations
    if (word.endsWith("s") && word.length > 3) {
      terms.add(word.slice(0, -1));
    } else if (!word.endsWith("s")) {
      terms.add(word + "s");
    }

    // Add synonyms
    const synonyms = SYNONYM_MAP[word] || [];
    for (const syn of synonyms) {
      terms.add(syn);
      if (syn.endsWith("s") && syn.length > 3) {
        terms.add(syn.slice(0, -1));
      } else if (!syn.endsWith("s")) {
        terms.add(syn + "s");
      }
    }

    // Reverse synonym matches
    for (const [key, val] of Object.entries(SYNONYM_MAP)) {
      if (val.includes(word)) {
        terms.add(key);
        if (key.endsWith("s") && key.length > 3) {
          terms.add(key.slice(0, -1));
        } else if (!key.endsWith("s")) {
          terms.add(key + "s");
        }
      }
    }
  }

  const pattern = Array.from(terms)
    .map(term => term.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"))
    .join("|");
  return new RegExp(pattern, "i");
}

export class LostItemService {
  static async reportItem(data: ReportLostItemInput): Promise<ILostItem> {
    const contact = this.buildContact(data);

    const lostItem = new LostItem({
      name: data.name,
      description: data.description,
      category: data.category,
      customCategory: data.customCategory,
      location: data.location,
      dateLost: data.dateLost,
      contact,
      imageUrl: data.imageUrl,
    });

    await lostItem.save();
    return lostItem;
  }

  static async getItems(
    query: IPaginationQuery
  ): Promise<IPaginatedResponse<ILostItem & { countdownInfo: ICountdownInfo }>> {
    const page = Math.max(1, query.page || 1);
    const limit = query.limit || PAGINATION.BROWSE_PAGE_SIZE;
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = { status: query.status || ITEM_STATUS.NOT_RETURNED };

    if (query.location) {
      filter.location = new RegExp(query.location, "i");
    }

    if (query.dateFrom || query.dateTo) {
      filter.dateLost = {};
      if (query.dateFrom) {
        filter.dateLost.$gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        filter.dateLost.$lte = new Date(query.dateTo);
      }
    }

    const andConditions: any[] = [];

    if (query.category) {
      if (query.category === "Others") {
        andConditions.push({
          $or: [
            { category: "Others", customCategory: { $nin: PREDEFINED_CATEGORIES } },
            { category: "Others", customCategory: { $exists: false } },
            { category: "Others", customCategory: "" }
          ]
        });
      } else {
        andConditions.push({
          $or: [
            { category: query.category },
            { category: "Others", customCategory: query.category }
          ]
        });
      }
    }

    if (query.search) {
      const searchRegex = getExpandedSearchRegex(query.search);
      andConditions.push({
        $or: [
          { name: searchRegex },
          { description: searchRegex },
          { location: searchRegex },
          { "contact.studentName": searchRegex },
        ]
      });
    }

    if (andConditions.length > 0) {
      filter.$and = andConditions;
    }

    // Execute query
    const items = await LostItem.find(filter)
      .sort({ dateLost: -1, reportedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await LostItem.countDocuments(filter);

    // Add countdown info
    const itemsWithCountdown = items.map((item) => ({
      ...item.toObject(),
      countdownInfo: getCountdownInfo(item.reportedAt || item.dateLost),
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
    ILostItem & { countdownInfo: ICountdownInfo }
  > {
    const item = await LostItem.findById(id);

    if (!item) {
      throw new NotFoundError("Lost item");
    }

    return {
      ...item.toObject(),
      countdownInfo: getCountdownInfo(item.reportedAt || item.dateLost),
    };
  }

  static async updateStatus(
    id: string,
    status: string,
    returnedBy?: string,
    returnedRollNo?: string
  ): Promise<ILostItem> {
    const mongoId = id.replace("LOST-", "");

const item = await LostItem.findByIdAndUpdate(
  mongoId,
      {
        status,
        returnedBy,
        returnedRollNo,
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
      throw new NotFoundError("Lost item");
    }

    // If marked as returned, add to claimed items history
    if (status === ITEM_STATUS.RETURNED) {
      await ClaimedItem.create({
        itemName: item.name,
        itemType: "Lost",
        student: returnedBy || "Unknown",
        rollNo: returnedRollNo || "Unknown",
        returnedDate: new Date(),
      });
    }

    return item;
  }

  static async deleteItem(id: string): Promise<void> {
    const result = await LostItem.findByIdAndDelete(id);

    if (!result) {
      throw new NotFoundError("Lost item");
    }
  }

  static async getExpiredItems(): Promise<ILostItem[]> {
    const items = await LostItem.find({
      status: ITEM_STATUS.NOT_RETURNED,
    });

    return items.filter((item) => isItemExpired(item.reportedAt || item.dateLost));
  }

  static async getAdminItems(
    query: IPaginationQuery
  ): Promise<IPaginatedResponse<ILostItem>> {
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
    const items = await LostItem.find(filter)
      .sort({ dateLost: -1 })
      .skip(skip)
      .limit(limit);

    const total = await LostItem.countDocuments(filter);

    return {
      data: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + limit < total,
    };
  }

  private static buildContact(data: ReportLostItemInput) {
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
