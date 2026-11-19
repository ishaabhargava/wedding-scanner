import React, { useState, useEffect, useRef } from 'react';
import { Heart, Sparkles, UploadCloud, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Header } from '../components/Header';
import { PhotoUploader } from '../components/PhotoUploader';
import { PhotoPreviewGrid } from '../components/PhotoPreviewGrid';
import { UploadProgressBar } from '../components/UploadProgressBar';
import { SuccessModal } from '../components/SuccessModal';
import { PublicConfig, SelectedPhoto } from '../types';
import { api } from '../services/api';

interface GuestUploadPageProps {
  onNavigateToAdmin: () => void;
}

export const GuestUploadPage: React.FC<GuestUploadPageProps> = ({ onNavigateToAdmin }) => {
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [selectedPhotos, setSelectedPhotos] = useState<SelectedPhoto[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastUploadedCount, setLastUploadedCount] = useState(0);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Reference to cancel or guard upload on page close
  const isUploadingRef = useRef(isUploading);
  isUploadingRef.current = isUploading;

  // Fetch wedding configuration
  const loadConfig = async () => {
    try {
      setIsLoadingConfig(true);
      const data = await api.getPublicConfig();
      setConfig(data);
    } catch (err: any) {
      console.error('Failed to load wedding details:', err);
      // Fallback default state
      setConfig({
        coupleNames: 'Niks & Sheku',
        weddingDate: 'December 2, 2026',
        heading: 'Every Moment Deserves to Be Remembered',
        subtitle: 'Share your favourite moments from our special day.',
        maxPhotosPerSession: 30,
        isDriveConnected: false,
        websiteUrl: window.location.origin,
      });
    } finally {
      setIsLoadingConfig(false);
    }
  };

  useEffect(() => {
    loadConfig();

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isUploadingRef.current) {
        e.preventDefault();
        e.returnValue = 'Photos are currently uploading. Leaving now will cancel unfinished uploads.';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const maxPhotos = config?.maxPhotosPerSession || 30;

  // Handle photos selected from file input or camera
  const handlePhotosSelected = async (newFiles: File[]) => {
    setGeneralError(null);

    const availableSlots = Math.max(0, maxPhotos - selectedPhotos.length);
    const filesToAdd = newFiles.slice(0, availableSlots);

    const newPhotoItems: SelectedPhoto[] = [];

    for (const file of filesToAdd) {
      const id = `photo_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      let previewUrl = '';

      // Check if HEIC
      const isHeic = file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
      if (isHeic) {
        try {
          // Attempt client-side preview conversion via heic2any
          const heic2anyModule = await import('heic2any');
          const heic2any = heic2anyModule.default || heic2anyModule;
          const blobResult = await (heic2any as any)({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.6,
          });
          const singleBlob = Array.isArray(blobResult) ? blobResult[0] : blobResult;
          previewUrl = URL.createObjectURL(singleBlob);
        } catch {
          // Fallback placeholder or direct object URL
          previewUrl = URL.createObjectURL(file);
        }
      } else {
        previewUrl = URL.createObjectURL(file);
      }

      newPhotoItems.push({
        id,
        file,
        previewUrl,
        name: file.name,
        size: file.size,
        status: 'pending',
        progress: 0,
      });
    }

    setSelectedPhotos((prev) => [...prev, ...newPhotoItems]);
  };

  // Remove photo from selection
  const handleRemovePhoto = (id: string) => {
    setSelectedPhotos((prev) => {
      const photoToRemove = prev.find((p) => p.id === id);
      if (photoToRemove?.previewUrl) {
        URL.revokeObjectURL(photoToRemove.previewUrl);
      }
      return prev.filter((p) => p.id !== id);
    });
  };

  // Clear all selected photos
  const handleClearAll = () => {
    selectedPhotos.forEach((p) => {
      if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
    });
    setSelectedPhotos([]);
    setGeneralError(null);
  };

  // Upload single photo helper
  const uploadPhotoItem = async (photo: SelectedPhoto): Promise<boolean> => {
    // Update status to uploading
    setSelectedPhotos((prev) =>
      prev.map((p) => (p.id === photo.id ? { ...p, status: 'uploading', progress: 5 } : p))
    );

    try {
      const result = await api.uploadSinglePhoto(photo.file, (percent) => {
        setSelectedPhotos((prev) =>
          prev.map((p) => (p.id === photo.id ? { ...p, progress: percent } : p))
        );
      });

      setSelectedPhotos((prev) =>
        prev.map((p) =>
          p.id === photo.id
            ? { ...p, status: 'success', progress: 100, driveViewLink: result.webViewLink }
            : p
        )
      );
      return true;
    } catch (err: any) {
      setSelectedPhotos((prev) =>
        prev.map((p) =>
          p.id === photo.id
            ? { ...p, status: 'error', progress: 0, error: err.message || 'Upload failed' }
            : p
        )
      );
      return false;
    }
  };

  // Retry an individual photo that failed
  const handleRetrySingle = async (id: string) => {
    const photo = selectedPhotos.find((p) => p.id === id);
    if (!photo) return;
    await uploadPhotoItem(photo);
  };

  // Main Upload Button: processes pending and errored photos with controlled concurrency (2 at a time)
  const handleStartUpload = async () => {
    if (selectedPhotos.length === 0 || isUploading) return;
    setGeneralError(null);

    // Verify Google Drive connection before starting
    if (!config?.isDriveConnected) {
      setGeneralError(
        'Google Drive has not been connected by the wedding organizer yet. Please inform the couple or organizer.'
      );
      return;
    }

    const itemsToUpload = selectedPhotos.filter(
      (p) => p.status === 'pending' || p.status === 'error'
    );

    if (itemsToUpload.length === 0) return;

    setIsUploading(true);

    let successCount = 0;
    const concurrency = 2; // Optimal concurrency for mobile connections

    // Queue processor
    let currentIndex = 0;
    const runWorker = async () => {
      while (currentIndex < itemsToUpload.length) {
        const item = itemsToUpload[currentIndex++];
        const ok = await uploadPhotoItem(item);
        if (ok) successCount++;
      }
    };

    const workers = [];
    for (let i = 0; i < Math.min(concurrency, itemsToUpload.length); i++) {
      workers.push(runWorker());
    }

    await Promise.all(workers);
    setIsUploading(false);

    // If all or some succeeded, open success modal
    if (successCount > 0) {
      setLastUploadedCount(successCount);
      setShowSuccessModal(true);
    } else {
      setGeneralError('All uploads failed. Please check your internet connection and retry.');
    }
  };

  // Retry all failed photos
  const handleRetryAllFailed = async () => {
    const failedItems = selectedPhotos.filter((p) => p.status === 'error');
    if (failedItems.length === 0 || isUploading) return;

    // Reset status to pending
    setSelectedPhotos((prev) =>
      prev.map((p) => (p.status === 'error' ? { ...p, status: 'pending', error: undefined } : p))
    );

    await handleStartUpload();
  };

  // Reset page after success modal
  const handleUploadMore = () => {
    setShowSuccessModal(false);
    handleClearAll();
  };

  // Calculate overall statistics
  const totalPhotos = selectedPhotos.length;
  const completedPhotos = selectedPhotos.filter((p) => p.status === 'success').length;
  const failedPhotos = selectedPhotos.filter((p) => p.status === 'error').length;
  const pendingPhotos = selectedPhotos.filter((p) => p.status === 'pending').length;
  const overallPercent =
    totalPhotos > 0 ? Math.round(((completedPhotos + failedPhotos) / totalPhotos) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5]">
      {/* Wedding Header */}
      <Header
        coupleNames={config?.coupleNames || 'Our Wedding Celebration'}
        weddingDate={config?.weddingDate || 'Special Day'}
        onAdminClick={onNavigateToAdmin}
      />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 sm:py-10 flex flex-col items-center">
        {/* Drive Connection Alert Banner (if organizer hasn't connected Google Drive yet) */}
        {!isLoadingConfig && !config?.isDriveConnected && (
          <div className="w-full mb-6 p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 shadow-sm flex items-start space-x-3 text-left">
            <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm">
              <p className="font-semibold text-amber-800">
                Wedding Album Setup Incomplete
              </p>
              <p className="mt-0.5 text-amber-700 leading-relaxed">
                The wedding organizer has not yet connected her Google Drive account. If you are the organizer, please sign in via the top-right settings icon to connect Drive.
              </p>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <div className="text-center space-y-3 mb-8 max-w-xl">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-champagne-100 text-gold-800 text-xs font-medium border border-champagne-300">
            <Sparkles className="w-3.5 h-3.5 text-gold-600" />
            <span>Guest Photo Contribution</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-charcoal-800 font-normal leading-tight">
            {config?.heading || 'Every Moment Deserves to Be Remembered'}
          </h2>

          <p className="text-sm sm:text-base text-charcoal-800/75 leading-relaxed font-light max-w-md mx-auto">
            {config?.subtitle || 'Share your favourite moments from our special day.'}
          </p>
        </div>

        {/* Photo Picker Component */}
        <div className="w-full">
          <PhotoUploader
            onPhotosSelected={handlePhotosSelected}
            currentCount={selectedPhotos.length}
            maxCount={maxPhotos}
            disabled={isUploading}
          />
        </div>

        {/* Overall Progress Bar during Upload */}
        <div className="w-full mt-4">
          <UploadProgressBar
            total={totalPhotos}
            completed={completedPhotos}
            failed={failedPhotos}
            overallPercent={overallPercent}
            isUploading={isUploading}
          />
        </div>

        {/* Photo Preview Grid */}
        <PhotoPreviewGrid
          photos={selectedPhotos}
          onRemove={handleRemovePhoto}
          onClearAll={handleClearAll}
          onRetrySingle={handleRetrySingle}
          isUploading={isUploading}
          maxCount={maxPhotos}
        />

        {/* General Error Banner */}
        {generalError && (
          <div className="w-full mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>{generalError}</span>
          </div>
        )}

        {/* Action Buttons: Upload / Retry */}
        {selectedPhotos.length > 0 && (
          <div className="w-full sticky bottom-4 z-30 pt-6">
            <div className="max-w-md mx-auto bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-champagne-300 flex flex-col sm:flex-row gap-2.5">
              {failedPhotos > 0 && !isUploading && (
                <button
                  type="button"
                  onClick={handleRetryAllFailed}
                  className="w-full sm:w-auto px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white text-sm font-semibold transition-all shadow-sm"
                >
                  Retry {failedPhotos} Failed
                </button>
              )}

              <button
                type="button"
                onClick={handleStartUpload}
                disabled={isUploading || (pendingPhotos === 0 && failedPhotos === 0)}
                className="flex-1 inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-gold-600 to-gold-700 hover:from-gold-700 hover:to-gold-800 active:scale-[0.98] text-white font-medium text-base shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin text-white" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                    <span>Uploading Photos...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-5 h-5" />
                    <span>
                      Upload {pendingPhotos > 0 ? `${pendingPhotos} ` : ''}Photo
                      {pendingPhotos === 1 ? '' : 's'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Success Modal */}
        <SuccessModal
          isOpen={showSuccessModal}
          uploadedCount={lastUploadedCount}
          coupleNames={config?.coupleNames || 'the Wedding Couple'}
          onUploadMore={handleUploadMore}
          onClose={() => setShowSuccessModal(false)}
        />
      </main>

      {/* Subtle Footer */}
      <footer className="w-full text-center py-6 text-xs text-charcoal-800/50 border-t border-champagne-200/50 mt-auto">
        <p className="flex items-center justify-center space-x-1">
          <span>Made with love for</span>
          <Heart className="w-3 h-3 text-gold-500 fill-gold-400" />
          <span>{config?.coupleNames || 'Our Wedding'}</span>
        </p>
      </footer>
    </div>
  );
};
