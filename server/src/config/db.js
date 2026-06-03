/**
 * server/src/config/db.js
 * ─────────────────────────────────────────────────────────────────────────────
 * DATABASE CONNECTION — MongoDB via Mongoose
 * ─────────────────────────────────────────────────────────────────────────────
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Connect to MongoDB using the MONGODB_URI environment variable.
 */
export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      'MONGODB_URI is not set. Create a server/.env file based on .env.example'
    );
  }

  try {
    await mongoose.connect(uri);
    console.log('[DB] Connected to MongoDB ✓');
  } catch (error) {
    console.error('[DB] MongoDB connection failed:', error);
    process.exit(1);
  }
}

/**
 * Gracefully close the Mongoose connection.
 */
export async function disconnectDB() {
  await mongoose.disconnect();
  console.log('[DB] MongoDB disconnected.');
}
