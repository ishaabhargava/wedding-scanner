import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Heart, Sparkles, ImagePlus, Check } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  uploadedCount: number;
  coupleNames: string;
  onUploadMore: () => void;
  onClose: () => void;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  uploadedCount,
  coupleNames,
  onUploadMore,
  onClose,
}) => {
  useEffect(() => {
    if (isOpen) {
      // Fire festive wedding confetti with gold, ivory, and champagne tones
      const count = 200;
      const defaults = {
        origin: { y: 0.7 },
        colors: ['#B48F56', '#D5BD9C', '#FAF0DE', '#E8DCC4', '#BC8F42'],
      };

      const fire = (particleRatio: number, opts: confetti.Options) => {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        });
      };

      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 text-center shadow-2xl border border-champagne-300 transform transition-all duration-300 scale-100">
        {/* Decorative badge */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-tr from-gold-100 to-champagne-200 border-2 border-gold-300 flex items-center justify-center text-gold-600 shadow-md">
          <Heart className="w-8 h-8 fill-gold-500 stroke-gold-600" />
        </div>

        {/* Heading */}
        <h2 className="text-2xl sm:text-3xl font-serif text-charcoal-800">
          Thank You for Sharing!
        </h2>

        {/* Subtitle */}
        <p className="text-sm text-charcoal-800/80 mt-2 leading-relaxed">
          Your <strong className="text-gold-700">{uploadedCount} memories</strong> have been safely uploaded to{' '}
          <strong>{coupleNames}</strong>'s wedding album.
        </p>

        {/* Subtle decorative divider */}
        <div className="flex items-center justify-center space-x-2 my-4">
          <span className="w-12 h-[1px] bg-gold-200"></span>
          <Sparkles className="w-4 h-4 text-gold-500" />
          <span className="w-12 h-[1px] bg-gold-200"></span>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col space-y-2.5 pt-2">
          <button
            type="button"
            onClick={onUploadMore}
            className="w-full inline-flex items-center justify-center space-x-2 py-3 px-5 rounded-xl bg-gold-600 hover:bg-gold-700 active:scale-[0.98] text-white font-medium shadow-md transition-all duration-200"
          >
            <ImagePlus className="w-4 h-4" />
            <span>Upload More Memories</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full inline-flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-charcoal-800/70 hover:bg-champagne-100 text-sm font-medium transition-colors"
          >
            <Check className="w-4 h-4" />
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
};
