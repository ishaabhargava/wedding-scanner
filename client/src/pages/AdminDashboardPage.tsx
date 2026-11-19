import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  CheckCircle2,
  XCircle,
  FolderPlus,
  FolderSync,
  ExternalLink,
  QrCode,
  Image as ImageIcon,
  Save,
  AlertTriangle,
  RefreshCw,
  Folder,
  Sliders,
  FileText,
  Unlink,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { AdminNavbar } from '../components/AdminNavbar';
import { AdminStats, WeddingSettings } from '../types';
import { api } from '../services/api';

interface AdminDashboardPageProps {
  token: string;
  onLogout: () => void;
  onBackToGuest: () => void;
  onNavigateToPrintQR: () => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  token,
  onLogout,
  onBackToGuest,
  onNavigateToPrintQR,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'folder' | 'qrcode' | 'logs'>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [settings, setSettings] = useState<WeddingSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Folder management state
  const [newFolderName, setNewFolderName] = useState('');
  const [existingFolderId, setExistingFolderId] = useState('');
  const [isFolderActionLoading, setIsFolderActionLoading] = useState(false);

  // Test connection state
  const [isTestingDrive, setIsTestingDrive] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Settings form state
  const [formCoupleNames, setFormCoupleNames] = useState('');
  const [formWeddingDate, setFormWeddingDate] = useState('');
  const [formHeading, setFormHeading] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formMaxPhotos, setFormMaxPhotos] = useState(30);
  const [formWebsiteUrl, setFormWebsiteUrl] = useState('');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [fetchedStats, fetchedSettings] = await Promise.all([
        api.getAdminStats(token),
        api.getAdminSettings(token),
      ]);
      setStats(fetchedStats);
      setSettings(fetchedSettings);

      setFormCoupleNames(fetchedSettings.coupleNames);
      setFormWeddingDate(fetchedSettings.weddingDate);
      setFormHeading(fetchedSettings.heading);
      setFormSubtitle(fetchedSettings.subtitle);
      setFormMaxPhotos(fetchedSettings.maxPhotosPerSession || 35);
      setFormWebsiteUrl(fetchedSettings.websiteUrl || window.location.origin);
    } catch (err: any) {
      if (err.message?.includes('401') || err.message?.includes('Invalid')) {
        onLogout();
      } else {
        setFeedback({ type: 'error', message: err.message || 'Failed to load dashboard data.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Check if redirected from OAuth callback with query params
    const params = new URLSearchParams(window.location.search);
    if (params.get('oauth') === 'success') {
      setFeedback({ type: 'success', message: 'Google Drive connected successfully!' });
      window.history.replaceState({}, '', window.location.pathname);
      loadData();
    } else if (params.get('oauth') === 'error') {
      const reason = params.get('reason') || 'Authorization was cancelled or failed.';
      setFeedback({ type: 'error', message: `Google Drive connection failed: ${decodeURIComponent(reason)}` });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Connect Google Drive
  const handleConnectDrive = async () => {
    try {
      const authUrl = await api.getGoogleAuthUrl(token);
      window.location.href = authUrl;
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Could not initiate Google OAuth.' });
    }
  };

  // Disconnect Google Drive
  const handleDisconnectDrive = async () => {
    if (!window.confirm('Are you sure you want to disconnect Google Drive? Guests will not be able to upload until Drive is reconnected.')) {
      return;
    }

    try {
      await api.disconnectGoogleDrive(token);
      setFeedback({ type: 'success', message: 'Google Drive disconnected.' });
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to disconnect.' });
    }
  };

  // Test Connection
  const handleTestConnection = async () => {
    try {
      setIsTestingDrive(true);
      setTestResult(null);
      const res = await api.testGoogleDrive(token);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Test failed' });
    } finally {
      setIsTestingDrive(false);
    }
  };

  // Create New Drive Folder
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      setIsFolderActionLoading(true);
      const folder = await api.createDriveFolder(token, newFolderName.trim());
      setFeedback({ type: 'success', message: `Created and set folder "${folder.name}"!` });
      setNewFolderName('');
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to create folder.' });
    } finally {
      setIsFolderActionLoading(false);
    }
  };

  // Set Existing Drive Folder
  const handleSetFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!existingFolderId.trim()) return;

    try {
      setIsFolderActionLoading(true);
      const folder = await api.setDriveFolder(token, existingFolderId.trim());
      setFeedback({ type: 'success', message: `Destination set to "${folder.name}"!` });
      setExistingFolderId('');
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to set folder ID.' });
    } finally {
      setIsFolderActionLoading(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const updated = await api.updateAdminSettings(token, {
        coupleNames: formCoupleNames,
        weddingDate: formWeddingDate,
        heading: formHeading,
        subtitle: formSubtitle,
        maxPhotosPerSession: formMaxPhotos,
        websiteUrl: formWebsiteUrl,
      });
      setSettings(updated);
      setFeedback({ type: 'success', message: 'Wedding settings updated successfully!' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save settings.' });
    } finally {
      setIsSaving(false);
    }
  };

  const guestUrl = formWebsiteUrl || window.location.origin;

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col">
      <AdminNavbar
        onBackToGuest={onBackToGuest}
        onLogout={onLogout}
        isDriveConnected={stats?.isDriveConnected ?? false}
        connectedEmail={stats?.connectedEmail}
      />

      <div className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {isLoading ? (
          <div className="py-24 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-gold-600 animate-spin mx-auto" />
            <p className="text-sm font-serif text-charcoal-800">Loading wedding dashboard...</p>
          </div>
        ) : (
          <>
            {/* Banner feedback notification */}
        {feedback && (
          <div
            className={`mb-6 p-4 rounded-2xl flex items-center justify-between text-xs sm:text-sm shadow-sm ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs underline hover:no-underline font-medium opacity-80"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Dashboard Navigation Tabs */}
        <div className="flex items-center space-x-2 border-b border-champagne-300 pb-2 mb-6 overflow-x-auto text-xs sm:text-sm">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl font-medium flex items-center space-x-2 transition-colors whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-gold-600 text-white shadow-sm'
                : 'text-charcoal-800/70 hover:bg-champagne-100'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Overview & Drive</span>
          </button>

          <button
            onClick={() => setActiveTab('folder')}
            className={`px-4 py-2 rounded-xl font-medium flex items-center space-x-2 transition-colors whitespace-nowrap ${
              activeTab === 'folder'
                ? 'bg-gold-600 text-white shadow-sm'
                : 'text-charcoal-800/70 hover:bg-champagne-100'
            }`}
          >
            <Folder className="w-4 h-4" />
            <span>Destination Folder</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-xl font-medium flex items-center space-x-2 transition-colors whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-gold-600 text-white shadow-sm'
                : 'text-charcoal-800/70 hover:bg-champagne-100'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Wedding Details</span>
          </button>

          <button
            onClick={() => setActiveTab('qrcode')}
            className={`px-4 py-2 rounded-xl font-medium flex items-center space-x-2 transition-colors whitespace-nowrap ${
              activeTab === 'qrcode'
                ? 'bg-gold-600 text-white shadow-sm'
                : 'text-charcoal-800/70 hover:bg-champagne-100'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>QR Code & Print</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-xl font-medium flex items-center space-x-2 transition-colors whitespace-nowrap ${
              activeTab === 'logs'
                ? 'bg-gold-600 text-white shadow-sm'
                : 'text-charcoal-800/70 hover:bg-champagne-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Upload Logs ({stats?.totalPhotosUploaded || 0})</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW & GOOGLE DRIVE */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Top Stat Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-champagne-300 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-charcoal-800/60 font-semibold">
                    Total Photos Uploaded
                  </span>
                  <div className="p-2 bg-champagne-100 rounded-xl text-gold-700">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-3xl font-serif font-bold text-charcoal-800 mt-2">
                  {stats?.totalPhotosUploaded || 0}
                </p>
                <p className="text-xs text-charcoal-800/50 mt-1">
                  Stored directly in Google Drive
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-champagne-300 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-charcoal-800/60 font-semibold">
                    Drive Status
                  </span>
                  <div
                    className={`p-2 rounded-xl ${
                      stats?.isDriveConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    <HardDrive className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-serif font-bold text-charcoal-800 mt-2 flex items-center space-x-2">
                  {stats?.isDriveConnected ? (
                    <span className="text-emerald-700">Connected</span>
                  ) : (
                    <span className="text-amber-700">Not Connected</span>
                  )}
                </p>
                <p className="text-xs text-charcoal-800/50 mt-1 truncate" title={stats?.connectedEmail}>
                  {stats?.connectedEmail || 'Action required by organizer'}
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-champagne-300 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-charcoal-800/60 font-semibold">
                    Upload Failures
                  </span>
                  <div className="p-2 bg-rose-100 rounded-xl text-rose-700">
                    <XCircle className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-3xl font-serif font-bold text-charcoal-800 mt-2">
                  {stats?.totalFailures || 0}
                </p>
                <p className="text-xs text-charcoal-800/50 mt-1">
                  View full logs in Upload Logs tab
                </p>
              </div>
            </div>

            {/* Google Drive Connection Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-champagne-300 shadow-sm space-y-6">
              <div>
                <h2 className="text-2xl font-serif text-charcoal-800">
                  Google Drive Integration
                </h2>
                <p className="text-xs sm:text-sm text-charcoal-800/70 mt-1">
                  Authenticate your Google account once via OAuth 2.0. All wedding guest uploads will automatically transfer to your designated folder.
                </p>
              </div>

              {stats?.isDriveConnected ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-champagne-50/70 border border-champagne-200 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm">
                      <div>
                        <span className="text-charcoal-800/60 block text-[11px] uppercase tracking-wider font-semibold">
                          Connected Google Account
                        </span>
                        <span className="font-semibold text-charcoal-800">
                          {stats.connectedEmail || 'Authenticated User'}
                        </span>
                      </div>

                      <div>
                        <span className="text-charcoal-800/60 block text-[11px] uppercase tracking-wider font-semibold">
                          Destination Folder
                        </span>
                        <div className="flex items-center space-x-1.5">
                          <Folder className="w-4 h-4 text-gold-600" />
                          <span className="font-semibold text-charcoal-800">
                            {stats.destinationFolderName || 'Wedding Photos'}
                          </span>
                        </div>
                      </div>

                      {stats.destinationFolderId && (
                        <div>
                          <a
                            href={`https://drive.google.com/drive/folders/${stats.destinationFolderId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-white border border-champagne-300 text-gold-800 hover:bg-champagne-100 text-xs font-medium shadow-sm transition-colors"
                          >
                            <span>Open Folder in Drive</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Test Connection Button & Result */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={isTestingDrive}
                      className="px-4 py-2.5 rounded-xl bg-champagne-100 hover:bg-champagne-200 text-gold-800 border border-gold-300 text-xs sm:text-sm font-medium shadow-sm transition-all flex items-center space-x-2"
                    >
                      <RefreshCw className={`w-4 h-4 ${isTestingDrive ? 'animate-spin' : ''}`} />
                      <span>{isTestingDrive ? 'Testing Connection...' : 'Test Connection'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDisconnectDrive}
                      className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs sm:text-sm font-medium transition-all flex items-center space-x-2"
                    >
                      <Unlink className="w-4 h-4" />
                      <span>Disconnect Google Drive</span>
                    </button>
                  </div>

                  {testResult && (
                    <div
                      className={`p-3.5 rounded-xl text-xs sm:text-sm flex items-start space-x-2 border ${
                        testResult.success
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-rose-50 border-rose-200 text-rose-800'
                      }`}
                    >
                      {testResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                      )}
                      <span>{testResult.message}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="border border-dashed border-gold-300 rounded-2xl p-6 sm:p-8 text-center bg-champagne-50/50 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-gold-100 text-gold-700 mx-auto flex items-center justify-center shadow-inner">
                    <HardDrive className="w-8 h-8" />
                  </div>
                  <div className="max-w-md mx-auto">
                    <h3 className="text-lg font-serif text-charcoal-800">
                      Connect Organizer's Google Drive
                    </h3>
                    <p className="text-xs text-charcoal-800/70 mt-1">
                      Click below to sign in with your Google account. We request permission only to create and manage the wedding photos folder.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleConnectDrive}
                    className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-gold-600 hover:bg-gold-700 text-white font-medium shadow-md transition-all duration-200 text-sm"
                  >
                    <HardDrive className="w-4 h-4" />
                    <span>Connect Google Drive</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: DESTINATION FOLDER SETTINGS */}
        {activeTab === 'folder' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-champagne-300 shadow-sm space-y-8">
            <div>
              <h2 className="text-2xl font-serif text-charcoal-800">
                Destination Folder Management
              </h2>
              <p className="text-xs sm:text-sm text-charcoal-800/70 mt-1">
                Configure where all guest wedding photos will be saved in your Google Drive.
              </p>
            </div>

            {/* Current folder banner */}
            <div className="p-4 rounded-2xl bg-champagne-100/60 border border-gold-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-charcoal-800/60 font-semibold block">
                  Active Destination Folder
                </span>
                <span className="text-lg font-serif font-medium text-charcoal-800">
                  {stats?.destinationFolderName || 'Wedding Photos'}
                </span>
                <p className="text-xs text-charcoal-800/60 font-mono mt-0.5">
                  ID: {stats?.destinationFolderId || 'Not set'}
                </p>
              </div>

              {stats?.destinationFolderId && (
                <a
                  href={`https://drive.google.com/drive/folders/${stats.destinationFolderId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white border border-champagne-300 text-gold-800 text-xs font-medium shadow-sm hover:bg-champagne-50 transition-colors self-start sm:self-auto"
                >
                  <span>View in Drive</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Option 1: Create New Folder */}
              <div className="border border-champagne-200 rounded-2xl p-5 bg-champagne-50/30 space-y-4">
                <div className="flex items-center space-x-2 text-charcoal-800">
                  <FolderPlus className="w-5 h-5 text-gold-600" />
                  <h3 className="font-semibold text-sm">Create New Folder</h3>
                </div>
                <p className="text-xs text-charcoal-800/70">
                  Creates a dedicated wedding folder directly inside your Google Drive.
                </p>

                <form onSubmit={handleCreateFolder} className="space-y-3">
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="e.g., Niks & Sheku - Wedding 2026"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-champagne-300 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
                    disabled={isFolderActionLoading || !stats?.isDriveConnected}
                  />
                  <button
                    type="submit"
                    disabled={isFolderActionLoading || !newFolderName.trim() || !stats?.isDriveConnected}
                    className="w-full py-2.5 px-4 rounded-xl bg-gold-600 hover:bg-gold-700 text-white text-xs sm:text-sm font-medium shadow-sm disabled:opacity-50 transition-colors"
                  >
                    {isFolderActionLoading ? 'Creating Folder...' : 'Create Folder'}
                  </button>
                </form>
              </div>

              {/* Option 2: Set Existing Folder ID */}
              <div className="border border-champagne-200 rounded-2xl p-5 bg-champagne-50/30 space-y-4">
                <div className="flex items-center space-x-2 text-charcoal-800">
                  <FolderSync className="w-5 h-5 text-gold-600" />
                  <h3 className="font-semibold text-sm">Use Existing Folder ID</h3>
                </div>
                <p className="text-xs text-charcoal-800/70">
                  Paste the ID of an existing Google Drive folder from its URL (the string after <code className="bg-champagne-100 px-1 rounded">/folders/</code>).
                </p>

                <form onSubmit={handleSetFolder} className="space-y-3">
                  <input
                    type="text"
                    value={existingFolderId}
                    onChange={(e) => setExistingFolderId(e.target.value)}
                    placeholder="Paste Google Drive folder ID..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-champagne-300 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 font-mono"
                    disabled={isFolderActionLoading || !stats?.isDriveConnected}
                  />
                  <button
                    type="submit"
                    disabled={isFolderActionLoading || !existingFolderId.trim() || !stats?.isDriveConnected}
                    className="w-full py-2.5 px-4 rounded-xl bg-champagne-200 hover:bg-champagne-300 text-gold-900 text-xs sm:text-sm font-medium shadow-sm disabled:opacity-50 transition-colors"
                  >
                    {isFolderActionLoading ? 'Setting Folder...' : 'Set Destination Folder'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: WEDDING DETAILS & CONFIGURATION */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-champagne-300 shadow-sm space-y-6">
            <div>
              <h2 className="text-2xl font-serif text-charcoal-800">
                Wedding Celebration Details
              </h2>
              <p className="text-xs sm:text-sm text-charcoal-800/70 mt-1">
                Customize the couple's names, date, and messages displayed to your guests.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                    Couple's Names
                  </label>
                  <input
                    type="text"
                    value={formCoupleNames}
                    onChange={(e) => setFormCoupleNames(e.target.value)}
                    placeholder="e.g., Niks & Sheku"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-champagne-300 bg-champagne-50/20 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                    Wedding Date
                  </label>
                  <input
                    type="text"
                    value={formWeddingDate}
                    onChange={(e) => setFormWeddingDate(e.target.value)}
                    placeholder="e.g., December 2, 2026"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-champagne-300 bg-champagne-50/20 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                  Landing Heading
                </label>
                <input
                  type="text"
                  value={formHeading}
                  onChange={(e) => setFormHeading(e.target.value)}
                  placeholder="Every Moment Deserves to Be Remembered"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-champagne-300 bg-champagne-50/20 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                  Landing Subtitle
                </label>
                <input
                  type="text"
                  value={formSubtitle}
                  onChange={(e) => setFormSubtitle(e.target.value)}
                  placeholder="Share your favourite moments from our special day."
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-champagne-300 bg-champagne-50/20 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                    Max Photos Per Upload Session
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formMaxPhotos}
                    onChange={(e) => setFormMaxPhotos(parseInt(e.target.value, 10))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-champagne-300 bg-champagne-50/20 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
                  />
                  <span className="text-[10px] text-charcoal-800/50 mt-0.5 block">
                    Maximum limit is 30 photos.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                    Public Website URL
                  </label>
                  <input
                    type="text"
                    value={formWebsiteUrl}
                    onChange={(e) => setFormWebsiteUrl(e.target.value)}
                    placeholder="https://our-wedding.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-champagne-300 bg-champagne-50/20 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 font-mono"
                  />
                  <span className="text-[10px] text-charcoal-800/50 mt-0.5 block">
                    Used to generate the QR code for tables.
                  </span>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gold-600 hover:bg-gold-700 text-white font-medium text-xs sm:text-sm shadow-md transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving Changes...' : 'Save Settings'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 4: QR CODE & PRINT CENTER */}
        {activeTab === 'qrcode' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-champagne-300 shadow-sm space-y-6">
            <div>
              <h2 className="text-2xl font-serif text-charcoal-800">
                QR Code & Reception Cards
              </h2>
              <p className="text-xs sm:text-sm text-charcoal-800/70 mt-1">
                Display this QR code on reception tables so guests can scan and share their moments instantly.
              </p>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-8 pt-2">
              {/* QR Code preview */}
              <div className="p-6 bg-champagne-50 rounded-2xl border border-champagne-300 shadow-inner flex flex-col items-center">
                <div className="p-3 bg-white rounded-xl shadow-md border border-champagne-200">
                  <QRCodeSVG
                    value={guestUrl}
                    size={200}
                    level="H"
                    includeMargin={true}
                    fgColor="#2A2521"
                    bgColor="#FFFFFF"
                  />
                </div>
                <p className="text-[11px] text-charcoal-800/60 mt-3 font-mono break-all text-center max-w-[220px]">
                  {guestUrl}
                </p>
              </div>

              {/* Actions & Info */}
              <div className="flex-1 space-y-4 text-left">
                <div>
                  <h3 className="font-semibold text-charcoal-800 text-base">
                    Print-Friendly Table Card
                  </h3>
                  <p className="text-xs sm:text-sm text-charcoal-800/70 mt-1 leading-relaxed">
                    We designed an elegant, print-ready 5x7 or A4 table card featuring your custom wedding names, date, and "Scan to Share Your Wedding Memories" banner.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onNavigateToPrintQR}
                    className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gold-600 hover:bg-gold-700 text-white font-medium text-xs sm:text-sm shadow-md transition-all"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Open Print-Ready Card</span>
                  </button>

                  <a
                    href={guestUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white border border-champagne-300 text-charcoal-800 hover:bg-champagne-50 font-medium text-xs sm:text-sm shadow-sm transition-all"
                  >
                    <span>Test Guest Link</span>
                    <ExternalLink className="w-4 h-4 text-charcoal-800/60" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: UPLOAD LOGS & HISTORY */}
        {activeTab === 'logs' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-champagne-300 shadow-sm space-y-6">
            <div>
              <h2 className="text-2xl font-serif text-charcoal-800">
                Upload History & Activity Logs
              </h2>
              <p className="text-xs sm:text-sm text-charcoal-800/70 mt-1">
                Real-time log of successfully uploaded guest photos and any failed attempts.
              </p>
            </div>

            {/* Recent Uploads Table */}
            <div>
              <h3 className="text-sm font-semibold text-charcoal-800 mb-3 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Recent Successful Uploads ({stats?.recentUploads.length || 0})</span>
              </h3>

              {!stats?.recentUploads || stats.recentUploads.length === 0 ? (
                <p className="text-xs text-charcoal-800/50 py-4 text-center border border-dashed border-champagne-200 rounded-xl">
                  No photos uploaded yet. When guests upload photos, they will appear here.
                </p>
              ) : (
                <div className="overflow-x-auto border border-champagne-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-champagne-100/60 text-charcoal-800/80 font-semibold border-b border-champagne-200">
                      <tr>
                        <th className="py-2.5 px-3">Original Filename</th>
                        <th className="py-2.5 px-3">Size</th>
                        <th className="py-2.5 px-3">Uploaded At</th>
                        <th className="py-2.5 px-3 text-right">Drive Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-champagne-100">
                      {stats.recentUploads.map((item) => (
                        <tr key={item.id} className="hover:bg-champagne-50/40">
                          <td className="py-2.5 px-3 font-medium text-charcoal-800 truncate max-w-xs" title={item.originalName}>
                            {item.originalName}
                          </td>
                          <td className="py-2.5 px-3 text-charcoal-800/70">
                            {(item.size / (1024 * 1024)).toFixed(2)} MB
                          </td>
                          <td className="py-2.5 px-3 text-charcoal-800/60">
                            {new Date(item.uploadedAt).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {item.driveViewLink ? (
                              <a
                                href={item.driveViewLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center space-x-1 text-gold-700 hover:text-gold-900 font-medium underline"
                              >
                                <span>View File</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-charcoal-800/40">Saved</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Failure Records Table */}
            {stats?.recentFailures && stats.recentFailures.length > 0 && (
              <div className="pt-4 border-t border-champagne-200">
                <h3 className="text-sm font-semibold text-rose-800 mb-3 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Failure Records ({stats.recentFailures.length})</span>
                </h3>

                <div className="overflow-x-auto border border-rose-200 rounded-xl bg-rose-50/20">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-rose-100/60 text-rose-900 font-semibold border-b border-rose-200">
                      <tr>
                        <th className="py-2.5 px-3">Filename</th>
                        <th className="py-2.5 px-3">Time</th>
                        <th className="py-2.5 px-3">Failure Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rose-100">
                      {stats.recentFailures.map((fail) => (
                        <tr key={fail.id}>
                          <td className="py-2.5 px-3 font-medium text-rose-950">
                            {fail.originalName}
                          </td>
                          <td className="py-2.5 px-3 text-rose-800/70">
                            {new Date(fail.failedAt).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-rose-700">
                            {fail.reason}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {settings?.updatedAt && (
          <p className="text-[11px] text-charcoal-800/40 text-center mt-6">
            Settings last updated: {new Date(settings.updatedAt).toLocaleString()}
          </p>
        )}
      </>
    )}
  </div>
</div>
);
};
