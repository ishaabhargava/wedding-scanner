import path from 'path';
import { config } from '../config/env.js';

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateFile(file: Express.Multer.File): FileValidationResult {
  if (!file) {
    return { valid: false, error: 'No file provided.' };
  }

  // Check file size limit
  const maxBytes = config.upload.maxFileSizeMb * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds limit of ${config.upload.maxFileSizeMb}MB.`,
    };
  }

  // Check extension
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'heic', 'heif', 'webp'];
  if (!allowedExtensions.includes(ext)) {
    return {
      valid: false,
      error: `File format .${ext} is not supported. Please upload JPG, PNG, HEIC, or WebP.`,
    };
  }

  // Check MIME type
  const mime = file.mimetype.toLowerCase();
  const isAllowedMime =
    config.upload.allowedMimeTypes.includes(mime) ||
    mime === 'image/heic-sequence' ||
    mime === 'application/octet-stream' && (ext === 'heic' || ext === 'heif'); // Some mobile browsers send HEIC as application/octet-stream

  if (!isAllowedMime) {
    return {
      valid: false,
      error: `Invalid file MIME type: ${file.mimetype}. Only image files are permitted.`,
    };
  }

  return { valid: true };
}

/**
 * Sanitize and format filename for safe storage and duplicate prevention.
 * Preserves the original file name while appending a short unique identifier if requested.
 */
export function sanitizeFilename(originalName: string, addUniqueSuffix = true): string {
  const ext = path.extname(originalName);
  const base = path.basename(originalName, ext)
    .replace(/[^a-zA-Z0-9_\-\s]/g, '')
    .trim()
    .replace(/\s+/g, '_') || 'wedding_photo';

  if (!addUniqueSuffix) {
    return `${base}${ext}`;
  }

  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 6);
  return `${base}_${timestamp}_${random}${ext}`;
}
