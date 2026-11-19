import { Router, Request, Response } from 'express';
import { storageService } from '../services/storage.service.js';
import { publicApiRateLimiter } from '../middleware/rateLimiter.js';
import { config } from '../config/env.js';

const router = Router();

/**
 * GET /api/public/config
 * Returns public configuration needed for the guest landing page
 */
router.get('/config', publicApiRateLimiter, (_req: Request, res: Response) => {
  const settings = storageService.getSettings();
  const tokens = storageService.getTokens();
  const isDriveConnected = storageService.isDriveConnected();

  res.json({
    success: true,
    coupleNames: settings.coupleNames,
    weddingDate: settings.weddingDate,
    heading: settings.heading,
    subtitle: settings.subtitle,
    maxPhotosPerSession: settings.maxPhotosPerSession || config.upload.maxFiles,
    isDriveConnected,
    destinationFolderName: tokens.destinationFolderName,
    websiteUrl: settings.websiteUrl || config.frontendUrl,
  });
});

/**
 * GET /api/public/health
 * Simple health check endpoint
 */
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    driveConnected: storageService.isDriveConnected(),
  });
});

export default router;
