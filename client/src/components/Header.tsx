import React from 'react';
import { Heart, Settings } from 'lucide-react';

interface HeaderProps {
  coupleNames: string;
  weddingDate: string;
  onAdminClick?: () => void;
  isAdmin?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  coupleNames,
  weddingDate,
  onAdminClick,
  isAdmin = false,
}) => {
  return (
    <header className="relative w-full text-center pt-8 pb-6 px-4 border-b border-champagne-200/60 bg-gradient-to-b from-white/90 via-champagne-50/40 to-transparent">
      {/* Top action button (Admin Access) */}
      <div className="absolute top-4 right-4 flex items-center space-x-2">
        {onAdminClick && (
          <button
            onClick={onAdminClick}
            className="p-2 text-gold-600 hover:text-gold-800 hover:bg-champagne-100/70 rounded-full transition-all duration-200 focus:outline-none"
            title={isAdmin ? "Go to Admin Dashboard" : "Organizer Login"}
            aria-label="Organizer Login"
          >
            <Settings className="w-5 h-5 opacity-70 hover:opacity-100" />
          </button>
        )}
      </div>

      <div className="max-w-xl mx-auto flex flex-col items-center">
        {/* Subtle decorative monogram icon */}
        <div className="inline-flex items-center justify-center w-10 h-10 mb-3 rounded-full bg-champagne-100/80 border border-gold-200 text-gold-600 shadow-sm">
          <Heart className="w-4 h-4 fill-gold-400 stroke-gold-600" />
        </div>

        {/* Couple's Names */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif tracking-wide text-charcoal-800 font-normal">
          {coupleNames || 'Our Wedding Celebration'}
        </h1>

        {/* Decorative divider */}
        <div className="flex items-center justify-center space-x-3 my-2.5 w-full max-w-xs">
          <span className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-gold-300"></span>
          <span className="text-gold-500 text-xs tracking-widest uppercase font-serif">❦</span>
          <span className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-gold-300"></span>
        </div>

        {/* Wedding Date */}
        <p className="text-xs sm:text-sm uppercase tracking-widest text-gold-700/80 font-medium">
          {weddingDate || 'Special Day'}
        </p>
      </div>
    </header>
  );
};
