import React from 'react';
import { X, CheckCircle2, AlertCircle, RefreshCw, Trash2 } from 'lucide-react';
import { SelectedPhoto } from '../types';

interface PhotoPreviewGridProps {
  photos: SelectedPhoto[];
  onRemove: (id: string) => void;
  onClearAll: () => void;
  onRetrySingle?: (id: string) => void;
  isUploading: boolean;
  maxCount: number;
}

export const PhotoPreviewGrid: React.FC<PhotoPreviewGridProps> = ({
  photos,
  onRemove,
  onClearAll,
  onRetrySingle,
  isUploading,
  maxCount,
}) => {
  if (photos.length === 0) return null;

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full mt-6 space-y-4">
      {/* Header bar with photo count and Clear All */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-charcoal-800">
            Selected Photos:
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-champagne-200 text-gold-900 border border-gold-300">
            {photos.length} / {maxCount}
          </span>
        </div>

        {!isUploading && (
          <button
            type="button"
            onClick={onClearAll}
            className="inline-flex items-center space-x-1 text-xs text-rose-700 hover:text-rose-900 hover:underline transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {/* Responsive Thumbnail Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        {photos.map((item) => {
          return (
            <div
              key={item.id}
              className={`group relative rounded-xl overflow-hidden bg-champagne-100/70 border border-champagne-300 shadow-sm transition-all duration-200 ${
                item.status === 'error'
                  ? 'ring-2 ring-rose-400'
                  : item.status === 'success'
                  ? 'ring-1 ring-emerald-400'
                  : ''
              }`}
            >
              {/* Image Thumbnail Container */}
              <div className="aspect-square w-full relative bg-charcoal-900/5">
                <img
                  src={item.previewUrl}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />

                {/* Status Overlays */}
                {item.status === 'uploading' && (
                  <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px] flex flex-col items-center justify-center p-2 text-white">
                    <div className="w-8 h-8 relative flex items-center justify-center">
                      <svg className="w-full h-full animate-spin text-champagne-200" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="3"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z"
                        />
                      </svg>
                    </div>
                    <span className="text-[11px] font-semibold mt-1">
                      {item.progress}%
                    </span>
                  </div>
                )}

                {item.status === 'success' && (
                  <div className="absolute top-2 left-2 bg-emerald-500/90 text-white rounded-full p-1 shadow-md">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                )}

                {item.status === 'error' && (
                  <div className="absolute inset-0 bg-rose-950/60 flex flex-col items-center justify-center p-2 text-white text-center">
                    <AlertCircle className="w-5 h-5 text-rose-300 mb-1" />
                    <span className="text-[10px] leading-tight line-clamp-2 text-rose-100">
                      {item.error || 'Upload failed'}
                    </span>
                    {onRetrySingle && (
                      <button
                        type="button"
                        onClick={() => onRetrySingle(item.id)}
                        className="mt-1.5 px-2 py-0.5 rounded bg-white text-rose-700 text-[10px] font-semibold hover:bg-rose-50 flex items-center space-x-1"
                      >
                        <RefreshCw className="w-2.5 h-2.5" />
                        <span>Retry</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Remove button (when not uploading and not success) */}
                {!isUploading && item.status !== 'success' && (
                  <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/50 hover:bg-rose-600 text-white transition-colors duration-150 shadow"
                    title="Remove photo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Caption / File Details */}
              <div className="p-2 bg-white/90 text-left">
                <p className="text-xs font-medium text-charcoal-800 truncate" title={item.name}>
                  {item.name}
                </p>
                <p className="text-[10px] text-charcoal-800/60 mt-0.5">
                  {formatSize(item.size)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
