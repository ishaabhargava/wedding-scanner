import { Router, Request, Response } from 'express';
import { storageService } from '../services/storage.service.js';
import { googleDriveService } from '../services/googleDrive.service.js';
import { requireAdminAuth, generateAdminToken } from '../middleware/auth.middleware.js';
import { adminLoginRateLimiter } from '../middleware/rateLimiter.js';
import { config } from '../config/env.js';

const router = Router();

/**
 * POST /api/admin/login
 * Authenticate admin using organizer password
 */
router.post('/login', adminLoginRateLimiter, (req: Request, res: Response) => {
  const { password } = req.body;

  if (!password) {
    res.status(400).json({ success: false, error: 'Password is required.' });
    return;
  }

  if (password !== config.admin.password) {
    res.status(401).json({ success: false, error: 'Incorrect administrator password.' });
    return;
  }

  const token = generateAdminToken();
  res.json({
    success: true,
    token,
    message: 'Authentication successful.',
  });
});

/**
 * GET /api/admin/me
 * Validate current admin session
 */
router.get('/me', requireAdminAuth, (_req: Request, res: Response) => {
  res.json({ success: true, authenticated: true });
});

/**
 * GET /api/admin/stats
 * Get comprehensive upload stats, history, and drive status
 */
router.get('/stats', requireAdminAuth, (_req: Request, res: Response) => {
  const stats = storageService.getStats();
  res.json({ success: true, stats });
});

/**
 * GET /api/admin/settings
 * Get current wedding couple details and configuration
 */
router.get('/settings', requireAdminAuth, (_req: Request, res: Response) => {
  const settings = storageService.getSettings();
  res.json({ success: true, settings });
});

/**
 * PUT /api/admin/settings
 * Update wedding details (couple names, date, heading, etc.)
 */
router.put('/settings', requireAdminAuth, (req: Request, res: Response) => {
  const { coupleNames, weddingDate, heading, subtitle, maxPhotosPerSession, websiteUrl } = req.body;

  const updated = storageService.updateSettings({
    ...(coupleNames ? { coupleNames: String(coupleNames).trim() } : {}),
    ...(weddingDate ? { weddingDate: String(weddingDate).trim() } : {}),
    ...(heading ? { heading: String(heading).trim() } : {}),
    ...(subtitle ? { subtitle: String(subtitle).trim() } : {}),
    ...(maxPhotosPerSession ? { maxPhotosPerSession: Math.min(30, Math.max(1, Number(maxPhotosPerSession))) } : {}),
    ...(websiteUrl ? { websiteUrl: String(websiteUrl).trim() } : {}),
  });

  res.json({ success: true, settings: updated });
});

/**
 * POST /api/admin/test-drive
 * Test Google Drive connection and folder write capability
 */
router.post('/test-drive', requireAdminAuth, async (_req: Request, res: Response) => {
  try {
    const result = await googleDriveService.testConnection();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/admin/create-folder
 * Create a new folder in Google Drive for wedding photos
 */
router.post('/create-folder', requireAdminAuth, async (req: Request, res: Response) => {
  const { folderName } = req.body;

  if (!folderName || typeof folderName !== 'string') {
    res.status(400).json({ success: false, error: 'A folder name is required.' });
    return;
  }

  try {
    const folder = await googleDriveService.createWeddingFolder(folderName.trim());
    res.json({
      success: true,
      folder,
      message: `Successfully created folder "${folder.name}" in Google Drive.`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/admin/set-folder
 * Change destination folder to an existing Google Drive folder ID
 */
router.post('/set-folder', requireAdminAuth, async (req: Request, res: Response) => {
  const { folderId } = req.body;

  if (!folderId || typeof folderId !== 'string') {
    res.status(400).json({ success: false, error: 'A valid Google Drive folder ID is required.' });
    return;
  }

  try {
    const folder = await googleDriveService.setExistingFolder(folderId.trim());
    res.json({
      success: true,
      folder,
      message: `Destination folder set to "${folder.name}".`,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
