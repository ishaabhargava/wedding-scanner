import { Router, Request, Response } from 'express';
import multer from 'multer';
import { googleDriveService } from '../services/googleDrive.service.js';
import { storageService } from '../services/storage.service.js';
import { validateFile } from '../utils/fileValidation.js';
import { uploadRateLimiter } from '../middleware/rateLimiter.js';
import { config } from '../config/env.js';

const router = Router();
const memoryStorage = multer.memoryStorage();

// Single file uploader (for smooth mobile queueing and accurate per-file progress)
const singleUpload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: config.upload.maxFileSizeMb * 1024 * 1024,
  },
}).single('photo');

// Batch uploader (up to 35 files)
const batchUpload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: config.upload.maxFileSizeMb * 1024 * 1024,
    files: config.upload.maxFiles,
  },
}).array('photos', config.upload.maxFiles);

/**
 * POST /api/upload/single
 * Uploads an individual photo directly to Google Drive.
 * Provides fine-grained progress and resilience for mobile networks.
 */
router.post('/single', uploadRateLimiter, (req: Request, res: Response) => {
  singleUpload(req, res, async (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({
          success: false,
          error: `Photo exceeds the maximum size limit of ${config.upload.maxFileSizeMb}MB.`,
        });
        return;
      }
      res.status(400).json({ success: false, error: err.message });
      return;
    } else if (err) {
      res.status(400).json({ success: false, error: err.message });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, error: 'No photo provided for upload.' });
      return;
    }

    // Validate file first
    const validation = validateFile(file);
    if (!validation.valid) {
      res.status(400).json({ success: false, error: validation.error });
      return;
    }

    // Check if Google Drive is connected
    if (!storageService.isDriveConnected()) {
      res.status(503).json({
        success: false,
        error: 'Wedding Google Drive is not connected yet. Please contact the wedding organizer to connect Drive.',
      });
      return;
    }

    try {
      const uploadResult = await googleDriveService.uploadPhoto(file);
      res.json({
        success: true,
        file: {
          id: uploadResult.fileId,
          name: uploadResult.name,
          originalName: file.originalname,
          size: uploadResult.size,
          webViewLink: uploadResult.webViewLink,
        },
      });
    } catch (uploadErr: any) {
      console.error(`Failed to upload ${file.originalname}:`, uploadErr);
      res.status(500).json({
        success: false,
        originalName: file.originalname,
        error: uploadErr.message || 'Failed to upload photo to Google Drive.',
      });
    }
  });
});

/**
 * POST /api/upload/batch
 * Uploads up to 35 photos in a single batch request.
 * Processes each photo and returns lists of successful and failed items.
 */
router.post('/batch', uploadRateLimiter, (req: Request, res: Response) => {
  batchUpload(req, res, async (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_COUNT') {
        res.status(400).json({
          success: false,
          error: `Maximum upload limit is ${config.upload.maxFiles} photos per session.`,
        });
        return;
      }
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({
          success: false,
          error: `One or more files exceed the size limit of ${config.upload.maxFileSizeMb}MB.`,
        });
        return;
      }
      res.status(400).json({ success: false, error: err.message });
      return;
    } else if (err) {
      res.status(400).json({ success: false, error: err.message });
      return;
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ success: false, error: 'No photos selected for upload.' });
      return;
    }

    if (files.length > config.upload.maxFiles) {
      res.status(400).json({
        success: false,
        error: `Upload session exceeds the limit of ${config.upload.maxFiles} photos.`,
      });
      return;
    }

    if (!storageService.isDriveConnected()) {
      res.status(503).json({
        success: false,
        error: 'Wedding Google Drive is not connected yet. Please contact the wedding organizer to connect Drive.',
      });
      return;
    }

    const successful: any[] = [];
    const failed: any[] = [];

    // Process files sequentially to avoid Google Drive API rate spikes and network choking
    for (const file of files) {
      const validation = validateFile(file);
      if (!validation.valid) {
        failed.push({
          originalName: file.originalname,
          size: file.size,
          reason: validation.error,
        });
        storageService.recordUploadFailure(file.originalname, file.size, validation.error || 'Invalid file');
        continue;
      }

      try {
        const uploadResult = await googleDriveService.uploadPhoto(file);
        successful.push({
          id: uploadResult.fileId,
          name: uploadResult.name,
          originalName: file.originalname,
          size: uploadResult.size,
          webViewLink: uploadResult.webViewLink,
        });
      } catch (uploadErr: any) {
        console.error(`Failed to upload ${file.originalname}:`, uploadErr);
        failed.push({
          originalName: file.originalname,
          size: file.size,
          reason: uploadErr.message || 'Google Drive upload failed',
        });
      }
    }

    res.json({
      success: true,
      totalSubmitted: files.length,
      successfulCount: successful.length,
      failedCount: failed.length,
      uploaded: successful,
      failed,
    });
  });
});

export default router;
