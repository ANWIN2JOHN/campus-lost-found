/**
 * Claimed Item Model (Historical)
 */

import mongoose, { Schema, Document } from "mongoose";
import type { IClaimedItem } from "../interfaces/index.js";
import { ITEM_TYPE } from "../constants/index.js";

interface IClaimedItemDocument extends IClaimedItem, Document {}

const claimedItemSchema = new Schema<IClaimedItemDocument>(
  {
    itemName: {
      type: String,
      required: true,
      trim: true,
    },
    itemType: {
      type: String,
      enum: Object.values(ITEM_TYPE),
      required: true,
    },
    student: {
      type: String,
      required: true,
      trim: true,
    },
    rollNo: {
      type: String,
      required: true,
      trim: true,
    },
    returnedDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["Returned"],
      default: "Returned",
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
claimedItemSchema.index({ itemType: 1, returnedDate: -1 });
claimedItemSchema.index({ student: 1 });

export const ClaimedItem = mongoose.model<IClaimedItemDocument>(
  "ClaimedItem",
  claimedItemSchema
);
