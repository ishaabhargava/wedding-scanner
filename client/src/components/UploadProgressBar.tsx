import React from 'react';
import { Upload, CheckCircle2 } from 'lucide-react';

interface UploadProgressBarProps {
  total: number;
  completed: number;
  failed: number;
  overallPercent: number;
  isUploading: boolean;
}

export const UploadProgressBar: React.FC<UploadProgressBarProps> = ({
  total,
  completed,
  failed,
  overallPercent,
  isUploading,
}) => {
  if (!isUploading && completed === 0 && failed === 0) return null;

  return (
    <div className="w-full bg-white/90 border border-champagne-300 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between text-xs sm:text-sm">
        <div className="flex items-center space-x-2 font-medium text-charcoal-800">
          <Upload className="w-4 h-4 text-gold-600 animate-bounce" />
          <span>
            {isUploading ? 'Uploading to Wedding Album...' : 'Upload Complete'}
          </span>
        </div>
        <div className="text-gold-700 font-semibold">
          {completed + failed} of {total} processed ({overallPercent}%)
        </div>
      </div>

      {/* Progress Bar Track */}
      <div className="w-full h-3 bg-champagne-100 rounded-full overflow-hidden border border-champagne-200 p-0.5">
        <div
          className="h-full bg-gradient-to-r from-gold-500 via-gold-400 to-amber-500 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, overallPercent))}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] text-charcoal-800/70 pt-0.5">
        <span className="flex items-center space-x-1 text-emerald-700">
          <CheckCircle2 className="w-3 h-3" />
          <span>{completed} succeeded</span>
        </span>
        {failed > 0 && (
          <span className="text-rose-600 font-medium">
            {failed} failed (retry available)
          </span>
        )}
      </div>
    </div>
  );
};
