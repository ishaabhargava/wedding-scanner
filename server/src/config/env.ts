import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';

import fs from 'fs';

// Load .env from server directory or project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

function cleanEnv(val: string | undefined, defaultVal = ''): string {
  if (!val) return defaultVal;
  let cleaned = String(val).trim();
  // Strip outer quotes if any
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  // If the variable was accidentally pasted with tab separation (e.g. "KEY\tVALUE")
  if (cleaned.includes('\t')) {
    cleaned = cleaned.split('\t').pop()!.trim();
  }
  // If the variable was accidentally pasted with key name prefix e.g. "GOOGLE_CLIENT_ID 336687..."
  if (cleaned.includes(' ') && !cleaned.includes('://')) {
    cleaned = cleaned.split(/\s+/).pop()!.trim();
  }
  return cleaned;
}

export const config = {
  port: parseInt(cleanEnv(process.env.PORT, '5001'), 10),
  nodeEnv: cleanEnv(process.env.NODE_ENV, 'development'),
  isProduction: cleanEnv(process.env.NODE_ENV, 'development') === 'production',
  frontendUrl: cleanEnv(process.env.FRONTEND_URL, 'http://localhost:3000'),

  // Google OAuth
  google: {
    clientId: cleanEnv(process.env.GOOGLE_CLIENT_ID, ''),
    clientSecret: cleanEnv(process.env.GOOGLE_CLIENT_SECRET, ''),
    redirectUri: cleanEnv(
      process.env.GOOGLE_REDIRECT_URI,
      'http://localhost:5001/api/auth/google/callback'
    ),
    defaultFolderId: cleanEnv(process.env.GOOGLE_DRIVE_FOLDER_ID, ''),
    // drive.file is the least invasive scope that allows creating/managing files and folders created by the app
    // We also support drive scope if organizer prefers to use existing folders
    scopes: [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ],
  },

  // Security & Admin
  admin: {
    password: cleanEnv(process.env.ADMIN_PASSWORD, 'wedding2025'),
    jwtSecret: cleanEnv(process.env.JWT_SECRET, 'wedding-photo-sharing-secret-key-2025'),
    jwtExpiresIn: '7d',
  },

  // Encryption key for tokens (derived or fallback deterministic for dev)
  encryptionKey: cleanEnv(process.env.ENCRYPTION_KEY, 'wedding-secure-key-32-chars-long!'),

  // Upload limits
  upload: {
    maxFiles: parseInt(cleanEnv(process.env.MAX_FILES_PER_UPLOAD, '30'), 10),
    maxFileSizeMb: parseInt(cleanEnv(process.env.MAX_FILE_SIZE_MB, '70'), 10),
    allowedMimeTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/heic',
      'image/heif',
      'image/webp',
    ],
  },

  // Storage directory
  dataDir: process.env.DATA_DIR || (
    fs.existsSync(path.resolve(process.cwd(), 'server/data'))
      ? path.resolve(process.cwd(), 'server/data')
      : path.resolve(process.cwd(), 'data')
  ),
};
