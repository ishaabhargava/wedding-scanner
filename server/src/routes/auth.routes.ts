import { Router, Request, Response } from 'express';
import { googleDriveService } from '../services/googleDrive.service.js';
import { storageService } from '../services/storage.service.js';
import { requireAdminAuth } from '../middleware/auth.middleware.js';
import { config } from '../config/env.js';

const router = Router();

/**
 * GET /api/auth/google/url
 * Generate Google OAuth 2.0 authorization URL for organizer
 */
router.get('/google/url', requireAdminAuth, (req: Request, res: Response) => {
  try {
    if (!config.google.clientId || !config.google.clientSecret) {
      res.status(400).json({
        success: false,
        error: 'Google OAuth Client ID or Secret is not configured. Please check your environment variables.',
      });
      return;
    }
    const authUrl = googleDriveService.getAuthorizationUrl();
    res.json({ success: true, authUrl });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/auth/google/callback
 * Google OAuth 2.0 callback endpoint
 */
router.get('/google/callback', async (req: Request, res: Response) => {
  const { code, error } = req.query;

  if (error) {
    const errorMsg = encodeURIComponent(String(error));
    res.redirect(`${config.frontendUrl}/admin?oauth=error&reason=${errorMsg}`);
    return;
  }

  if (!code || typeof code !== 'string') {
    res.redirect(`${config.frontendUrl}/admin?oauth=error&reason=missing_code`);
    return;
  }

  try {
    await googleDriveService.handleCallback(code);
    res.redirect(`${config.frontendUrl}/admin?oauth=success`);
  } catch (err: any) {
    console.error('OAuth callback processing failed:', err);
    const reason = encodeURIComponent(err.message || 'authentication_failed');
    res.redirect(`${config.frontendUrl}/admin?oauth=error&reason=${reason}`);
  }
});

/**
 * GET /api/auth/google/status
 * Check Google Drive connection status
 */
router.get('/google/status', requireAdminAuth, (req: Request, res: Response) => {
  const tokens = storageService.getTokens();
  const isConnected = storageService.isDriveConnected();

  res.json({
    success: true,
    isConnected,
    email: tokens.connectedEmail,
    name: tokens.connectedName,
    folderId: tokens.destinationFolderId,
    folderName: tokens.destinationFolderName,
    connectedAt: tokens.connectedAt,
  });
});

/**
 * POST /api/auth/google/disconnect
 * Disconnect Google Drive account and revoke tokens
 */
router.post('/google/disconnect', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    await googleDriveService.disconnect();
    res.json({
      success: true,
      message: 'Google Drive has been disconnected successfully.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
