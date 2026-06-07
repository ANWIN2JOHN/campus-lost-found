#!/usr/bin/env node

/**

* Database Seed Script
*
* Creates only the admin account.
* No demo records are inserted.
*
* Run:
* npm run seed
  */

import "dotenv/config";
import mongoose from "mongoose";

import { getConfig } from "../config/env.js";
import {
LostItem,
FoundItem,
ClaimedItem,
DisposedRecord,
User,
} from "../models/index.js";
import { Logger } from "../utils/logger.js";

const config = getConfig();

async function seedDatabase() {
try {
await mongoose.connect(config.mongoUri);

Logger.info("✓ Connected to MongoDB");

// Clear all collections
await Promise.all([
  LostItem.deleteMany({}),
  FoundItem.deleteMany({}),
  ClaimedItem.deleteMany({}),
  DisposedRecord.deleteMany({}),
  User.deleteMany({}),
]);

Logger.info("✓ Database cleaned");

// Create Admin User
const adminUser = new User({
  email: config.adminEmail,
  password: config.adminPassword,
  role: "admin",
});

await adminUser.save();

Logger.info(`✓ Admin user created (${config.adminEmail})`);

Logger.info("✅ Database seeded successfully");

process.exit(0);


} catch (error) {
Logger.error("❌ Database seeding failed", error);
process.exit(1);
}
}

seedDatabase();
