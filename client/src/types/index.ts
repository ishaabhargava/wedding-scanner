export interface PublicConfig {
  coupleNames: string;
  weddingDate: string;
  heading: string;
  subtitle: string;
  maxPhotosPerSession: number;
  isDriveConnected: boolean;
  destinationFolderName?: string;
  websiteUrl: string;
}

export interface SelectedPhoto {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  size: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  driveViewLink?: string;
}

export interface AdminStats {
  totalPhotosUploaded: number;
  recentUploads: {
    id: string;
    originalName: string;
    savedName: string;
    driveFileId: string;
    driveViewLink?: string;
    size: number;
    mimeType: string;
    uploadedAt: string;
    status: 'success' | 'failed';
  }[];
  totalFailures: number;
  recentFailures: {
    id: string;
    originalName: string;
    size: number;
    failedAt: string;
    reason: string;
  }[];
  isDriveConnected: boolean;
  connectedEmail?: string;
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
