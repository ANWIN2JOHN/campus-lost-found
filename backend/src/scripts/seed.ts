#!/usr/bin/env node

/**
 * Data Seeding Script
 * 
 * This script populates the database with sample data for testing and development.
 * Run with: npm run seed
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { getConfig } from '../config/env.js';
import { LostItem, FoundItem, ClaimedItem, DisposedRecord, User } from '../models/index.js';
import { Logger } from '../utils/logger.js';

const config = getConfig();

async function seedDatabase() {
  try {
    // Connect to database
    await mongoose.connect(config.mongoUri);
    Logger.info('✓ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      LostItem.deleteMany({}),
      FoundItem.deleteMany({}),
      ClaimedItem.deleteMany({}),
      DisposedRecord.deleteMany({}),
    ]);
    Logger.info('✓ Cleared existing data');

    // Seed Lost Items
    const lostItems = await LostItem.insertMany([
      {
        name: 'Blue Laptop Bag',
        description: 'Navy blue bag with laptop and charger',
        category: 'Bags & Backpacks',
        location: 'Library - 3rd Floor',
        dateLost: new Date('2024-01-10'),
        contact: {
          type: 'student',
          studentName: 'John Doe',
          rollNo: '2024001',
          studentPhone: '+91-9876543210',
          studentEmail: 'john@campus.edu',
        },
        status: 'Not Returned',
      },
      {
        name: 'Red Water Bottle',
        description: 'Red insulated water bottle with lid',
        category: 'Water Bottles',
        location: 'Sports Complex',
        dateLost: new Date('2024-01-12'),
        contact: {
          type: 'student',
          studentName: 'Jane Smith',
          rollNo: '2024002',
          studentPhone: '+91-9876543211',
          studentEmail: 'jane@campus.edu',
        },
        status: 'Not Returned',
      },
      {
        name: 'iPhone 14 Pro',
        description: 'Silver iPhone 14 Pro with cracked screen',
        category: 'Electronics',
        location: 'Cafeteria',
        dateLost: new Date('2024-01-08'),
        contact: {
          type: 'staff',
          staffName: 'Mr. ABC',
          employeeId: 'EMP001',
          department: 'Computer Science',
          staffPhone: '+91-9876543212',
          staffEmail: 'abc@campus.edu',
        },
        status: 'Not Returned',
      },
    ]);
    Logger.info(`✓ Seeded ${lostItems.length} lost items`);

    // Seed Found Items
    const foundItems = await FoundItem.insertMany([
      {
        name: 'Silver Keychain',
        description: 'Silver keychain with metal name tag',
        category: 'Keys & Keychains',
        location: 'Main Gate',
        dateFound: new Date('2024-01-15'),
        collectFrom: 'Admin Reception',
        contact: {
          type: 'student',
          studentName: 'Alice Johnson',
          rollNo: '2024003',
          studentPhone: '+91-9876543213',
          studentEmail: 'alice@campus.edu',
        },
        status: 'Not Returned',
      },
      {
        name: 'Black Sunglasses',
        description: 'Designer black sunglasses in case',
        category: 'Eyewear',
        location: 'Academic Building',
        dateFound: new Date('2024-01-18'),
        collectFrom: 'Main Reception',
        contact: {
          type: 'staff',
          staffName: 'Mrs. XYZ',
          employeeId: 'EMP002',
          department: 'Administration',
          staffPhone: '+91-9876543214',
          staffEmail: 'xyz@campus.edu',
        },
        status: 'Not Returned',
      },
    ]);
    Logger.info(`✓ Seeded ${foundItems.length} found items`);

    // Seed Claimed Items
    const claimedItems = await ClaimedItem.insertMany([
      {
        itemName: 'Physics Textbook',
        itemType: 'Lost',
        student: 'Robert Brown',
        rollNo: '2024004',
        returnedDate: new Date('2024-01-09'),
        status: 'Returned',
      },
      {
        itemName: 'Blue Pen Set',
        itemType: 'Found',
        student: 'Emily Davis',
        rollNo: '2024005',
        returnedDate: new Date('2024-01-11'),
        status: 'Returned',
      },
    ]);
    Logger.info(`✓ Seeded ${claimedItems.length} claimed items`);

    // Seed Disposed Records
    const disposedRecords = await DisposedRecord.insertMany([
      {
        itemName: 'Old Textbook',
        itemType: 'Lost',
        dateReported: new Date('2023-08-01'),
        location: 'Library',
        reporter: 'John Student',
        reporterPhone: '+91-9876543215',
        reporterEmail: 'john.student@campus.edu',
        disposalLocation: 'Storage Room A',
        donatedTo: 'NSS',
        disposedDate: new Date('2024-01-12'),
        notes: 'Condition poor, suitable for donation',
      },
    ]);
    Logger.info(`✓ Seeded ${disposedRecords.length} disposed records`);

    Logger.info('✅ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    Logger.error('❌ Error seeding database', error);
    process.exit(1);
  }
}

seedDatabase();
