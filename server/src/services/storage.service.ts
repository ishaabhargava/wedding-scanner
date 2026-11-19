import fs from 'fs';
import path from 'path';
import { config } from '../config/env.js';
import { encrypt, decrypt } from '../utils/encryption.js';

export interface OAuthTokensData {
  accessToken?: string;
  refreshTokenEncrypted?: string;
  expiryDate?: number;
  tokenType?: string;
  connectedEmail?: string;
  connectedName?: string;
  connectedAt?: string;
  destinationFolderId?: string;
  destinationFolderName?: string;
}

export interface WeddingSettings {
  coupleNames: string;
  weddingDate: string;
  heading: string;
  subtitle: string;
  maxPhotosPerSession: number;
  websiteUrl: string;
  updatedAt: string;
}

export interface UploadRecord {
  id: string;
  originalName: string;
  savedName: string;
  driveFileId: string;
  driveViewLink?: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
  status: 'success' | 'failed';
  error?: string;
}

export interface FailureRecord {
  id: string;
  originalName: string;
  size: number;
  failedAt: string;
  reason: string;
}

export interface AppData {
  tokens: OAuthTokensData;
  settings: WeddingSettings;
  uploads: UploadRecord[];
  failures: FailureRecord[];
}

const DEFAULT_SETTINGS: WeddingSettings = {
  coupleNames: 'Niks & Sheku',
  weddingDate: 'December 2, 2026',
  heading: 'Every Moment Deserves to Be Remembered',
  subtitle: 'Share your favourite moments from our special day.',
  maxPhotosPerSession: config.upload.maxFiles,
  websiteUrl: config.frontendUrl,
  updatedAt: new Date().toISOString(),
};

class StorageService {
  private filePath: string;
  private data: AppData;

  constructor() {
    const dir = config.dataDir;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    this.filePath = path.join(dir, 'app-data.json');
    this.data = this.loadData();
  }

  private loadData(): AppData {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          tokens: parsed.tokens || {},
          settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
          uploads: parsed.uploads || [],
          failures: parsed.failures || [],
        };
      }
    } catch (err) {
      console.error('Error reading app-data.json, initializing fresh data:', err);
    }

    const initialData: AppData = {
      tokens: {},
      settings: DEFAULT_SETTINGS,
      uploads: [],
      failures: [],
    };
    this.saveData(initialData);
    return initialData;
  }

  private saveData(data: AppData = this.data): void {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write app-data.json:', err);
    }
  }

  // --- OAuth Tokens Management ---

  public getTokens(): {
    accessToken?: string;
    refreshToken?: string;
    expiryDate?: number;
    connectedEmail?: string;
    connectedName?: string;
    connectedAt?: string;
    destinationFolderId?: string;
    destinationFolderName?: string;
  } {
    const raw = this.data.tokens;
    const refreshToken = raw.refreshTokenEncrypted ? decrypt(raw.refreshTokenEncrypted) : undefined;
    return {
      accessToken: raw.accessToken,
      refreshToken,
      expiryDate: raw.expiryDate,
      connectedEmail: raw.connectedEmail,
      connectedName: raw.connectedName,
      connectedAt: raw.connectedAt,
      destinationFolderId: raw.destinationFolderId || config.google.defaultFolderId,
      destinationFolderName: raw.destinationFolderName,
    };
  }

  public saveTokens(tokens: {
    accessToken?: string;
    refreshToken?: string;
    expiryDate?: number;
    connectedEmail?: string;
    connectedName?: string;
    destinationFolderId?: string;
    destinationFolderName?: string;
  }): void {
    // Preserve existing refresh token if Google didn't return a new one on re-auth
    let refreshTokenEncrypted = this.data.tokens.refreshTokenEncrypted;
    if (tokens.refreshToken) {
      refreshTokenEncrypted = encrypt(tokens.refreshToken);
    }

    this.data.tokens = {
      ...this.data.tokens,
      accessToken: tokens.accessToken ?? this.data.tokens.accessToken,
      refreshTokenEncrypted,
      expiryDate: tokens.expiryDate ?? this.data.tokens.expiryDate,
      connectedEmail: tokens.connectedEmail ?? this.data.tokens.connectedEmail,
      connectedName: tokens.connectedName ?? this.data.tokens.connectedName,
      connectedAt: this.data.tokens.connectedAt || new Date().toISOString(),
      destinationFolderId: tokens.destinationFolderId ?? this.data.tokens.destinationFolderId,
      destinationFolderName: tokens.destinationFolderName ?? this.data.tokens.destinationFolderName,
    };
    this.saveData();
  }

  public setDestinationFolder(folderId: string, folderName?: string): void {
    this.data.tokens.destinationFolderId = folderId;
    if (folderName) {
      this.data.tokens.destinationFolderName = folderName;
    }
    this.saveData();
  }

  public clearTokens(): void {
    this.data.tokens = {};
    this.saveData();
  }

  public isDriveConnected(): boolean {
    const tokens = this.getTokens();
    return Boolean(tokens.refreshToken || tokens.accessToken);
  }

  // --- Wedding Settings ---

  public getSettings(): WeddingSettings {
    return { ...this.data.settings };
  }

  public updateSettings(partial: Partial<WeddingSettings>): WeddingSettings {
    this.data.settings = {
      ...this.data.settings,
      ...partial,
      updatedAt: new Date().toISOString(),
    };
    this.saveData();
    return this.getSettings();
  }

  // --- Upload Records & Analytics ---

  public recordUploadSuccess(record: Omit<UploadRecord, 'id' | 'uploadedAt' | 'status'>): UploadRecord {
    const fullRecord: UploadRecord = {
      ...record,
      id: `up_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      uploadedAt: new Date().toISOString(),
      status: 'success',
    };
    // Keep last 500 records to prevent infinite file growth
    this.data.uploads.unshift(fullRecord);
    if (this.data.uploads.length > 500) {
      this.data.uploads = this.data.uploads.slice(0, 500);
    }
    this.saveData();
    return fullRecord;
  }

  public recordUploadFailure(originalName: string, size: number, reason: string): FailureRecord {
    const failure: FailureRecord = {
      id: `fail_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      originalName,
      size,
      failedAt: new Date().toISOString(),
      reason,
    };
    this.data.failures.unshift(failure);
    if (this.data.failures.length > 200) {
      this.data.failures = this.data.failures.slice(0, 200);
    }
    this.saveData();
    return failure;
  }

  public getStats() {
    return {
      totalPhotosUploaded: this.data.uploads.length,
      recentUploads: this.data.uploads.slice(0, 50),
      totalFailures: this.data.failures.length,
      recentFailures: this.data.failures.slice(0, 50),
      isDriveConnected: this.isDriveConnected(),
      connectedEmail: this.data.tokens.connectedEmail,
      destinationFolderId: this.data.tokens.destinationFolderId,
      destinationFolderName: this.data.tokens.destinationFolderName,
    };
  }
}

export const storageService = new StorageService();
