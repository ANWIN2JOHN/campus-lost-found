/**
 * Environment Configuration
 */

export interface Config {
  nodeEnv: string;
  port: number;
  mongoUri: string;
  jwtSecret: string;
  jwtRefreshSecret: string;
  jwtExpire: string;
  jwtRefreshExpire: string;
  cloudinaryCloudName: string;
  cloudinaryApiKey: string;
  cloudinaryApiSecret: string;
  frontendUrl: string;
  adminEmail: string;
  adminPassword: string;
}

export function loadConfig(): Config {
  return {
    nodeEnv: process.env.NODE_ENV || "development",
    port: parseInt(process.env.PORT || "5000", 10),
    mongoUri: process.env.MONGODB_URI || "mongodb://localhost:27017/campus-lost-found",
    jwtSecret: process.env.JWT_SECRET || "your-secret-key",
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key",
    jwtExpire: process.env.JWT_EXPIRE || "24h",
    jwtRefreshExpire: process.env.JWT_REFRESH_EXPIRE || "7d",
    cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || "",
    cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || "",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
    adminEmail: process.env.ADMIN_EMAIL || "admin@campus.edu",
    adminPassword: process.env.ADMIN_PASSWORD || "admin@12345",
  };
}

let configInstance: Config | null = null;

export function getConfig(): Config {
  if (!configInstance) {
    configInstance = loadConfig();
  }
  return configInstance;
}
