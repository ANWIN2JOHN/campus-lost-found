/**
 * Found Item Model
 */

import mongoose, { Schema, Document } from "mongoose";
import type { IFoundItem } from "../interfaces/index.js";
import { ITEM_STATUS, CATEGORIES, COLLECT_FROM_OPTIONS } from "../constants/index.js";

interface IFoundItemDocument extends IFoundItem, Document {}

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

const foundItemSchema = new Schema<IFoundItemDocument>(
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
    dateFound: {
      type: Date,
      required: true,
    },
    collectFrom: {
      type: String,
      required: true,
      enum: COLLECT_FROM_OPTIONS,
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
    claimedBy: String,
    claimedRollNo: String,
    claimedPhone: String,
    claimedEmail: String,
    returnedDate: Date,
    returnedTime: String,
    imageUrl: String,
  },
  {
    timestamps: {
      createdAt: "foundAt",
      updatedAt: "lastUpdated",
    },
  }
);

// Index for faster queries
foundItemSchema.index({ status: 1, dateFound: -1 });
foundItemSchema.index({ category: 1 });
foundItemSchema.index({ location: 1 });
foundItemSchema.index({ "contact.studentEmail": 1 });

export const FoundItem = mongoose.model<IFoundItemDocument>(
  "FoundItem",
  foundItemSchema
);
