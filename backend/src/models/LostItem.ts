/**
 * Lost Item Model
 */

import mongoose, { Schema, HydratedDocument } from "mongoose";
import type { ILostItem } from "../interfaces/index.js";
import { ITEM_STATUS, CATEGORIES } from "../constants/index.js";

type ILostItemDocument = HydratedDocument<ILostItem>;

const contactSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["student", "staff"],
      required: true,
    },
    studentName: String,
    rollNo: String,
    studentPhone: String,
    studentEmail: String,
    staffName: String,
    employeeId: String,
    department: String,
    staffPhone: String,
    staffEmail: String,
  },
  { _id: false }
);

const lostItemSchema = new Schema<ILostItemDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: CATEGORIES.map((c) => c.name),
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    dateLost: {
      type: Date,
      required: true,
    },
    contact: {
      type: contactSchema,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ITEM_STATUS),
      default: ITEM_STATUS.NOT_RETURNED,
    },
    returnedBy: String,
    returnedRollNo: String,
    returnedDate: Date,
    returnedTime: String,
    imageUrl: String,
  },
  {
    timestamps: {
      createdAt: "reportedAt",
      updatedAt: "lastUpdated",
    },
  }
);

// Index for faster queries
lostItemSchema.index({ status: 1, dateLost: -1 });
lostItemSchema.index({ category: 1 });
lostItemSchema.index({ location: 1 });
lostItemSchema.index({ "contact.studentEmail": 1 });

export const LostItem = mongoose.model<ILostItemDocument>(
  "LostItem",
  lostItemSchema
);