import { PublicConfig, AdminStats, WeddingSettings } from '../types';

// Supports VITE_API_BASE_URL (e.g. https://your-backend.onrender.com/api) or defaults to /api
const envApiUrl = import.meta.env.VITE_API_BASE_URL;
const API_BASE = envApiUrl ? envApiUrl.replace(/\/$/, '') : '/api';

// Helper for safe JSON parsing from fetch responses
async function parseResponseJson(res: Response): Promise<any> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    if (text.includes('Protected by Vercel Authentication') || text.includes('sso-api')) {
      throw new Error('Please use your public production domain (https://wedding-photos-7pvt.vercel.app)');
    }
    throw new Error(`Server response error (${res.status}): ${text.slice(0, 100) || res.statusText}`);
  }
}

export const api = {
  // Public endpoints
  async getPublicConfig(): Promise<PublicConfig> {
    const res = await fetch(`${API_BASE}/public/config`);
    const data = await parseResponseJson(res);
    if (!res.ok) {
      throw new Error(data.error || `Failed to load wedding details (${res.status})`);
    }
    return data;
  },

  // Upload an individual photo with accurate progress tracking via XMLHttpRequest
  uploadSinglePhoto(
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<{ id: string; name: string; originalName: string; size: number; webViewLink?: string }> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('photo', file);

      xhr.open('POST', `${API_BASE}/upload/single`);

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (data.success && data.file) {
              resolve(data.file);
            } else {
              reject(new Error(data.error || 'Upload failed without specific error'));
            }
          } catch {
            reject(new Error('Invalid response from server'));
          }
        } else {
          try {
            const data = JSON.parse(xhr.responseText);
            reject(new Error(data.error || `Upload failed with status ${xhr.status}`));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error during photo upload. Please check your connection.'));
      };

      xhr.ontimeout = () => {
        reject(new Error('Upload timed out. Please retry.'));
      };

      xhr.send(formData);
    });
  },

  // Admin endpoints
  async adminLogin(password: string): Promise<{ token: string }> {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    const data = await parseResponseJson(res);
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Invalid administrator password');
    }
    return { token: data.token };
  },

  async verifyAdminToken(token: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/admin/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async getAdminStats(token: string): Promise<AdminStats> {
    const res = await fetch(`${API_BASE}/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await parseResponseJson(res);
    if (!res.ok) throw new Error(data.error || 'Failed to fetch dashboard statistics');
    return data.stats;
  },

  async getAdminSettings(token: string): Promise<WeddingSettings> {
    const res = await fetch(`${API_BASE}/admin/settings`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await parseResponseJson(res);
    if (!res.ok) throw new Error(data.error || 'Failed to fetch settings');
    return data.settings;
  },

  async updateAdminSettings(token: string, settings: Partial<WeddingSettings>): Promise<WeddingSettings> {
    const res = await fetch(`${API_BASE}/admin/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(settings),
    });
    const data = await parseResponseJson(res);
    if (!res.ok) throw new Error(data.error || 'Failed to update settings');
    return data.settings;
  },

  async getGoogleAuthUrl(token: string): Promise<string> {
    const res = await fetch(`${API_BASE}/auth/google/url`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await parseResponseJson(res);
    if (!res.ok || !data.authUrl) throw new Error(data.error || 'Failed to initiate Google OAuth');
    return data.authUrl;
  },

  async disconnectGoogleDrive(token: string): Promise<void> {
    const res = await fetch(`${API_BASE}/auth/google/disconnect`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await parseResponseJson(res);
    if (!res.ok) throw new Error(data.error || 'Failed to disconnect Google Drive');
  },

  async testGoogleDrive(token: string): Promise<{ success: boolean; message: string; folderName?: string }> {
    const res = await fetch(`${API_BASE}/admin/test-drive`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await parseResponseJson(res);
    return data;
  },

  async createDriveFolder(token: string, folderName: string): Promise<{ id: string; name: string }> {
    const res = await fetch(`${API_BASE}/admin/create-folder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ folderName }),
    });
    const data = await parseResponseJson(res);
    if (!res.ok) throw new Error(data.error || 'Failed to create folder');
    return data.folder;
  },

  async setDriveFolder(token: string, folderId: string): Promise<{ id: string; name: string }> {
    const res = await fetch(`${API_BASE}/admin/set-folder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ folderId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to set folder');
    return data.folder;
  },
};
