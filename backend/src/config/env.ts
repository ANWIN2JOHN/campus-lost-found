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
  // Enforce Render-only execution
  if (process.env.RENDER !== "true") {
    throw new Error(
      "Render execution hardening: Backend startup failed. Execution is restricted to the approved Render environment."
    );
  }

  const nodeEnv = process.env.NODE_ENV || "production";
  if (nodeEnv === "development") {
    throw new Error(
      "Render execution hardening: Invalid NODE_ENV. Must be set to a non-development value (e.g. 'production') on Render."
    );
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("Render execution hardening: MONGODB_URI environment variable is required.");
  }
  if (mongoUri.includes("localhost") || mongoUri.includes("127.0.0.1")) {
    throw new Error("Render execution hardening: Local database URL is not permitted in MONGODB_URI.");
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("Render execution hardening: JWT_SECRET environment variable is required.");
  }
  if (
    jwtSecret === "your-secret-key" ||
    jwtSecret === "your_jwt_secret_key_here_change_in_production"
  ) {
    throw new Error("Render execution hardening: Default secret key is not permitted in JWT_SECRET.");
  }

  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
  if (!jwtRefreshSecret) {
    throw new Error("Render execution hardening: JWT_REFRESH_SECRET environment variable is required.");
  }
  if (
    jwtRefreshSecret === "your-refresh-secret-key" ||
    jwtRefreshSecret === "your_jwt_refresh_secret_key_here_change_in_production"
  ) {
    throw new Error("Render execution hardening: Default refresh secret key is not permitted in JWT_REFRESH_SECRET.");
  }

  const frontendUrl = process.env.FRONTEND_URL;
  if (!frontendUrl) {
    throw new Error("Render execution hardening: FRONTEND_URL environment variable is required.");
  }
  if (frontendUrl.includes("localhost") || frontendUrl.includes("127.0.0.1")) {
    throw new Error("Render execution hardening: Local frontend URL is not permitted in FRONTEND_URL.");
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    throw new Error("Render execution hardening: ADMIN_EMAIL environment variable is required.");
  }
  if (adminEmail === "admin@campus.edu") {
    throw new Error("Render execution hardening: Default email admin@campus.edu is not permitted in ADMIN_EMAIL.");
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error("Render execution hardening: ADMIN_PASSWORD environment variable is required.");
  }
  if (adminPassword === "admin@12345") {
    throw new Error("Render execution hardening: Default password admin@12345 is not permitted in ADMIN_PASSWORD.");
  }

  return {
    nodeEnv,
    port: parseInt(process.env.PORT || "5000", 10),
    mongoUri,
    jwtSecret,
    jwtRefreshSecret,
    jwtExpire: process.env.JWT_EXPIRE || "24h",
    jwtRefreshExpire: process.env.JWT_REFRESH_EXPIRE || "7d",
    cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || "",
    cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || "",
    frontendUrl,
    adminEmail,
    adminPassword,
  };
}

let configInstance: Config | null = null;

export function getConfig(): Config {
  if (!configInstance) {
    configInstance = loadConfig();
  }
  return configInstance;
}
