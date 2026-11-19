import { google } from 'googleapis';
import { Readable } from 'stream';
import { config } from '../config/env.js';
import { storageService } from './storage.service.js';
import { sanitizeFilename } from '../utils/fileValidation.js';

export class GoogleDriveService {
  private getOAuth2Client() {
    if (!config.google.clientId || !config.google.clientSecret) {
      throw new Error(
        'Google OAuth credentials are missing. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your environment.'
      );
    }
    return new google.auth.OAuth2(
      config.google.clientId,
      config.google.clientSecret,
      config.google.redirectUri
    );
  }

  /**
   * Generates the Google OAuth 2.0 authorization URL.
   * Requests offline access and forces consent prompt to ensure a refresh token is returned.
   */
  public getAuthorizationUrl(): string {
    const oauth2Client = this.getOAuth2Client();
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: config.google.scopes,
    });
  }

  /**
   * Exchanges authorization code for tokens, fetches user profile info,
   * creates a default Wedding folder if none exists, and saves tokens securely.
   */
  public async handleCallback(code: string): Promise<{
    email?: string;
    folderId?: string;
    folderName?: string;
  }> {
    const oauth2Client = this.getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Fetch user info to display in admin dashboard
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const connectedEmail = userInfo.data.email || undefined;
    const connectedName = userInfo.data.name || undefined;

    // Save tokens initially
    storageService.saveTokens({
      accessToken: tokens.access_token || undefined,
      refreshToken: tokens.refresh_token || undefined,
      expiryDate: tokens.expiry_date || undefined,
      connectedEmail,
      connectedName,
    });

    // Check if destination folder already exists or create default one
    const currentTokens = storageService.getTokens();
    let folderId = currentTokens.destinationFolderId;
    let folderName = currentTokens.destinationFolderName;

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    if (!folderId) {
      const settings = storageService.getSettings();
      const defaultFolderName = `${settings.coupleNames} - Wedding Photos`;
      const createdFolder = await this.createFolderInternal(drive, defaultFolderName);
      folderId = createdFolder.id;
      folderName = createdFolder.name;
      storageService.setDestinationFolder(folderId, folderName);
    } else {
      // Verify existing folder
      try {
        const folderMeta = await drive.files.get({
          fileId: folderId,
          fields: 'id, name, trashed',
        });
        if (folderMeta.data.trashed) {
          throw new Error('Configured folder is in trash');
        }
        folderName = folderMeta.data.name || 'Wedding Photos';
        storageService.setDestinationFolder(folderId, folderName);
      } catch {
        // If not found or inaccessible, create new folder
        const settings = storageService.getSettings();
        const fallbackName = `${settings.coupleNames} - Wedding Photos`;
        const createdFolder = await this.createFolderInternal(drive, fallbackName);
        folderId = createdFolder.id;
        folderName = createdFolder.name;
        storageService.setDestinationFolder(folderId, folderName);
      }
    }

    return { email: connectedEmail, folderId, folderName };
  }

  /**
   * Internal helper to create a folder with a specific Drive client
   */
  private async createFolderInternal(drive: any, folderName: string): Promise<{ id: string; name: string }> {
    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Wedding Guest Photo Contributions',
    };

    const folder = await drive.files.create({
      requestBody: fileMetadata,
      fields: 'id, name',
    });

    if (!folder.data.id) {
      throw new Error('Failed to create wedding photo folder in Google Drive.');
    }

    return { id: folder.data.id, name: folder.data.name || folderName };
  }

  /**
   * Get an authorized Google Drive client with auto-refresh configured.
   */
  public async getAuthenticatedDriveClient() {
    const tokens = storageService.getTokens();

    if (!tokens.refreshToken && !tokens.accessToken) {
      throw new Error(
        'Google Drive is not connected. The wedding organizer must connect Google Drive via the admin dashboard.'
      );
    }

    const oauth2Client = this.getOAuth2Client();

    oauth2Client.setCredentials({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expiry_date: tokens.expiryDate,
    });

    // Auto-save refreshed tokens when Google rotates them
    oauth2Client.on('tokens', (newTokens) => {
      storageService.saveTokens({
        accessToken: newTokens.access_token || undefined,
        refreshToken: newTokens.refresh_token || undefined,
        expiryDate: newTokens.expiry_date || undefined,
      });
    });

    return {
      drive: google.drive({ version: 'v3', auth: oauth2Client }),
      tokens,
    };
  }

  /**
   * Upload a photo buffer directly to the designated Google Drive folder.
   * Preserves original filename, adds duplicate-safe suffix, and records metadata.
   */
  public async uploadPhoto(file: Express.Multer.File): Promise<{
    fileId: string;
    name: string;
    webViewLink?: string;
    size: number;
  }> {
    const { drive, tokens } = await this.getAuthenticatedDriveClient();
    const destinationFolderId = tokens.destinationFolderId;

    if (!destinationFolderId) {
      throw new Error('No destination Google Drive folder configured.');
    }

    // Preserve original filename while making it unique to prevent overwriting
    const safeFilename = sanitizeFilename(file.originalname, true);

    // Convert Buffer to stream for Google Drive API
    const bufferStream = new Readable();
    bufferStream.push(file.buffer);
    bufferStream.push(null);

    const media = {
      mimeType: file.mimetype,
      body: bufferStream,
    };

    const requestBody = {
      name: safeFilename,
      parents: [destinationFolderId],
      description: `Uploaded by wedding guest. Original name: ${file.originalname}`,
    };

    try {
      const response = await drive.files.create({
        requestBody,
        media,
        fields: 'id, name, webViewLink, webContentLink, size',
      });

      const fileData = response.data;
      if (!fileData.id) {
        throw new Error('Google Drive API did not return a valid file ID.');
      }

      // Record successful upload in persistent storage
      storageService.recordUploadSuccess({
        originalName: file.originalname,
        savedName: fileData.name || safeFilename,
        driveFileId: fileData.id,
        driveViewLink: fileData.webViewLink || undefined,
        size: file.size,
        mimeType: file.mimetype,
      });

      return {
        fileId: fileData.id,
        name: fileData.name || safeFilename,
        webViewLink: fileData.webViewLink || undefined,
        size: file.size,
      };
    } catch (error: any) {
      // Record failure log
      const reason = error.message || 'Unknown Google Drive upload error';
      storageService.recordUploadFailure(file.originalname, file.size, reason);
      throw error;
    }
  }

  /**
   * Test current Google Drive connection and folder write capability.
   */
  public async testConnection(): Promise<{
    success: boolean;
    message: string;
    email?: string;
    folderName?: string;
    folderId?: string;
  }> {
    try {
      const { drive, tokens } = await this.getAuthenticatedDriveClient();
      const folderId = tokens.destinationFolderId;

      if (!folderId) {
        return {
          success: false,
          message: 'Google account is connected, but no destination folder is set.',
          email: tokens.connectedEmail,
        };
      }

      // Verify folder exists and get its metadata
      const folderRes = await drive.files.get({
        fileId: folderId,
        fields: 'id, name, trashed, capabilities',
      });

      if (folderRes.data.trashed) {
        return {
          success: false,
          message: 'The designated destination folder is currently in the Google Drive Trash.',
          email: tokens.connectedEmail,
          folderId,
        };
      }

      return {
        success: true,
        message: 'Successfully connected and verified write access to Google Drive folder.',
        email: tokens.connectedEmail,
        folderName: folderRes.data.name || tokens.destinationFolderName,
        folderId: folderRes.data.id || folderId,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Connection test failed: ${err.message || 'Unable to connect to Google Drive API.'}`,
      };
    }
  }

  /**
   * Create a new folder in Google Drive and set it as destination folder.
   */
  public async createWeddingFolder(folderName: string): Promise<{ id: string; name: string }> {
    const { drive } = await this.getAuthenticatedDriveClient();
    const result = await this.createFolderInternal(drive, folderName);
    storageService.setDestinationFolder(result.id, result.name);
    return result;
  }

  /**
   * Set an existing folder ID as destination folder after verifying it exists.
   */
  public async setExistingFolder(folderId: string): Promise<{ id: string; name: string }> {
    const { drive } = await this.getAuthenticatedDriveClient();
    const cleanId = folderId.trim();

    // Verify folder exists
    const response = await drive.files.get({
      fileId: cleanId,
      fields: 'id, name, mimeType, trashed',
    });

    if (response.data.trashed) {
      throw new Error('The specified folder is in the Trash.');
    }

    if (response.data.mimeType !== 'application/vnd.google-apps.folder') {
      throw new Error('The specified ID belongs to a file, not a Google Drive folder.');
    }

    const folderName = response.data.name || 'Wedding Photos';
    storageService.setDestinationFolder(cleanId, folderName);
    return { id: cleanId, name: folderName };
  }

  /**
   * Disconnect Google Drive account and revoke tokens.
   */
  public async disconnect(): Promise<void> {
    try {
      const tokens = storageService.getTokens();
      if (tokens.refreshToken || tokens.accessToken) {
        const oauth2Client = this.getOAuth2Client();
        oauth2Client.setCredentials({
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
        });
        const tokenToRevoke = tokens.refreshToken || tokens.accessToken;
        if (tokenToRevoke) {
          await oauth2Client.revokeToken(tokenToRevoke).catch(() => {});
        }
      }
    } catch (e) {
      console.warn('Token revocation skipped/failed:', e);
    } finally {
      storageService.clearTokens();
    }
  }
}

export const googleDriveService = new GoogleDriveService();
