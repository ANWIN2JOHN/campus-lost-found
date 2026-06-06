/**
 * Disposed Record Model (Historical)
 */

import mongoose, { Schema, HydratedDocument } from "mongoose";
import type { IDisposedRecord } from "../interfaces/index.js";
import { ITEM_TYPE } from "../constants/index.js";

type IDisposedRecordDocument = HydratedDocument<IDisposedRecord>;

const disposedRecordSchema = new Schema<IDisposedRecordDocument>(
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
    dateReported: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    reporter: {
      type: String,
      required: true,
      trim: true,
    },
    reporterPhone: String,
    reporterEmail: String,
    disposalLocation: {
      type: String,
      required: true,
      trim: true,
    },
    donatedTo: {
      type: String,
      trim: true,
    },
    disposedDate: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
disposedRecordSchema.index({ itemType: 1, disposedDate: -1 });
disposedRecordSchema.index({ disposedDate: 1 });

export const DisposedRecord = mongoose.model<IDisposedRecordDocument>(
  "DisposedRecord",
  disposedRecordSchema
);