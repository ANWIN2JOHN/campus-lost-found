/**
 * TypeScript Interfaces for the Application
 */

import { Request } from "express";

export interface IUser {
  _id: string;
  email: string;
  password: string;
  role: "admin";
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

export interface IContactInfo {
  type: "student" | "staff";
  studentName?: string;
  rollNo?: string;
  studentPhone?: string;
  studentEmail?: string;
  staffName?: string;
  employeeId?: string;
  department?: string;
  staffPhone?: string;
  staffEmail?: string;
}

export interface ILostItem {
  _id: string;
  name: string;
  description: string;
  category: string;
  customCategory?: string;
  location: string;
  dateLost: Date;
  contact: IContactInfo;
  status: "Not Returned" | "Returned";
  returnedBy?: string;
  returnedRollNo?: string;
  returnedDate?: Date;
  returnedTime?: string;
  reportedAt: Date;
  lastUpdated: Date;
  imageUrl?: string;
}

export interface IFoundItem {
  _id: string;
  name: string;
  description: string;
  category: string;
  location: string;
  dateFound: Date;
  collectFrom: string;
  contact: IContactInfo;
  status: "Not Returned" | "Returned";
  claimedBy?: string;
  claimedRollNo?: string;
  claimedPhone?: string;
  claimedEmail?: string;
  returnedDate?: Date;
  returnedTime?: string;
  foundAt: Date;
  lastUpdated: Date;
  imageUrl?: string;
}

export interface IClaimedItem {
  _id: string;
  itemName: string;
  itemType: "Lost" | "Found";
  student: string;
  rollNo: string;
  returnedDate: Date;
  status: "Returned";
}

export interface IDisposedRecord {
  _id: string;
  itemName: string;
  itemType: "Lost" | "Found";
  dateReported: Date;
  location: string;
  reporter: string;
  reporterPhone: string;
  reporterEmail: string;
  disposalLocation: string;
  donatedTo: string;
  disposedDate: Date;
  notes?: string;
}

export interface IJWTPayload {
  id: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: IJWTPayload;
}

export interface IPaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  location?: string;
  status?: string;
  countdownStatus?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface IPaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ICountdownInfo {
  daysRemaining: number;
  daysElapsed: number;
  isExpired: boolean;
  countdownStatus: "active" | "expiring" | "last10" | "expired";
}

export interface IItemStatistics {
  totalFound: number;
  returnedCount: number;
  availableCount: number;
  expiringSoonCount: number;
}
