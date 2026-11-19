import React, { useRef, useState } from 'react';
import { Camera, ImagePlus, UploadCloud, AlertCircle } from 'lucide-react';
import { CameraModal } from './CameraModal';

interface PhotoUploaderProps {
  onPhotosSelected: (files: File[]) => void;
  currentCount: number;
  maxCount: number;
  disabled?: boolean;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  onPhotosSelected,
  currentCount,
  maxCount,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);

  const remainingSlots = Math.max(0, maxCount - currentCount);

  const processFiles = (rawFiles: FileList | null) => {
    if (!rawFiles || rawFiles.length === 0) return;
    setLocalError(null);

    const validFiles: File[] = [];
    const filesArray = Array.from(rawFiles);

    for (const file of filesArray) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      const validExtensions = ['jpg', 'jpeg', 'png', 'heic', 'heif', 'webp'];
      
      if (!ext || !validExtensions.includes(ext)) {
        setLocalError(`Skipped non-image file "${file.name}". Please upload JPG, PNG, HEIC, or WebP.`);
        continue;
      }

      // Check max file size (70MB)
      const maxBytes = 70 * 1024 * 1024;
      if (file.size > maxBytes) {
        setLocalError(`Skipped "${file.name}" (${(file.size / (1024 * 1024)).toFixed(1)}MB): exceeds the 70MB size limit.`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length > remainingSlots) {
      setLocalError(`You can only add ${remainingSlots} more photo${remainingSlots === 1 ? '' : 's'} (maximum ${maxCount} per session).`);
      onPhotosSelected(validFiles.slice(0, remainingSlots));
    } else {
      onPhotosSelected(validFiles);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && remainingSlots > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || remainingSlots <= 0) return;
    processFiles(e.dataTransfer.files);
  };

  const handleTakePhotoClick = () => {
    if (disabled || remainingSlots <= 0) return;

    // Check if live camera API is supported
    if (
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function'
    ) {
      setIsCameraModalOpen(true);
    } else {
      // Fallback to native camera input dialog
      cameraInputRef.current?.click();
    }
  };

  const handleCameraCapture = (file: File) => {
    onPhotosSelected([file]);
  };

  return (
    <div className="w-full">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/heic,image/heif,image/webp,.jpg,.jpeg,.png,.heic,.heif,.webp"
        className="hidden"
        onChange={(e) => {
          processFiles(e.target.files);
          e.target.value = ''; // Reset input to allow re-selecting same files
        }}
        disabled={disabled || remainingSlots <= 0}
      />

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          processFiles(e.target.files);
          e.target.value = '';
        }}
        disabled={disabled || remainingSlots <= 0}
      />

      {/* Drag & Drop Card */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all duration-300 ${
          isDragging
            ? 'border-gold-500 bg-champagne-100/60 scale-[1.01]'
            : 'border-champagne-300 hover:border-gold-400 bg-white/70 shadow-sm'
        } ${disabled || remainingSlots <= 0 ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-champagne-100 flex items-center justify-center text-gold-600 shadow-inner">
            <UploadCloud className="w-8 h-8 stroke-[1.5]" />
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-serif text-charcoal-800">
              Select Your Wedding Memories
            </h3>
            <p className="text-sm text-charcoal-800/70 mt-1 max-w-sm mx-auto">
              Choose from your photo library or snap photos directly using your camera.
            </p>
          </div>

          {/* Action buttons (Camera + Gallery) */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-xs sm:max-w-md pt-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || remainingSlots <= 0}
              className="w-full sm:w-auto flex-1 inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-gold-600 hover:bg-gold-700 active:scale-[0.98] text-white font-medium shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ImagePlus className="w-5 h-5" />
              <span>Choose Photos</span>
            </button>

            <button
              type="button"
              onClick={handleTakePhotoClick}
              disabled={disabled || remainingSlots <= 0}
              className="w-full sm:w-auto flex-1 inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-champagne-100 hover:bg-champagne-200 active:scale-[0.98] text-gold-800 font-medium border border-gold-300 shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Camera className="w-5 h-5 text-gold-700" />
              <span>Take Photo</span>
            </button>
          </div>

          {/* Supported formats & counter */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs text-charcoal-800/60">
            <span>Supports JPG, PNG, HEIC (up to 70MB)</span>
            <span>•</span>
            <span>Up to {maxCount} photos per upload</span>
          </div>
        </div>
      </div>

      {/* Warning message if limit exceeded or file error */}
      {localError && (
        <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs sm:text-sm flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
          <span>{localError}</span>
        </div>
      )}

      {/* In-browser Live Camera Viewfinder Modal */}
      <CameraModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={handleCameraCapture}
        remainingSlots={remainingSlots}
      />
    </div>
  );
};
