import React from 'react';
import { LogOut, ArrowLeft, ShieldCheck, HardDrive } from 'lucide-react';

interface AdminNavbarProps {
  onBackToGuest: () => void;
  onLogout: () => void;
  isDriveConnected: boolean;
  connectedEmail?: string;
}

export const AdminNavbar: React.FC<AdminNavbarProps> = ({
  onBackToGuest,
  onLogout,
  isDriveConnected,
  connectedEmail,
}) => {
  return (
    <nav className="bg-white/95 border-b border-champagne-200 px-4 py-3 sticky top-0 z-40 shadow-sm backdrop-blur">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Left: Back button & Title */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToGuest}
            className="p-1.5 rounded-lg text-charcoal-800/70 hover:text-charcoal-800 hover:bg-champagne-100 transition-colors inline-flex items-center space-x-1 text-xs sm:text-sm font-medium"
            title="Return to Guest Upload Page"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Guest View</span>
          </button>

          <div className="h-4 w-[1px] bg-champagne-300 hidden sm:block"></div>

          <div className="flex items-center space-x-2">
            <span className="font-serif text-lg sm:text-xl font-medium text-charcoal-800">
              Organizer Dashboard
            </span>
            <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-gold-100 text-gold-800 border border-gold-200">
              <ShieldCheck className="w-3 h-3 mr-1 text-gold-600" />
              Secure Admin
            </span>
          </div>
        </div>

        {/* Right: Drive Status & Logout */}
        <div className="flex items-center space-x-3 text-xs sm:text-sm">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full border text-xs font-medium">
            <HardDrive className={`w-3.5 h-3.5 ${isDriveConnected ? 'text-emerald-600' : 'text-amber-500'}`} />
            <span className={isDriveConnected ? 'text-emerald-800' : 'text-amber-700'}>
              {isDriveConnected ? (
                <span className="truncate max-w-[120px] sm:max-w-[200px]" title={connectedEmail}>
                  {connectedEmail ? `Drive: ${connectedEmail}` : 'Drive Connected'}
                </span>
              ) : (
                'Drive Not Connected'
              )}
            </span>
          </div>

          <button
            onClick={onLogout}
            className="p-2 text-charcoal-800/60 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
            title="Log out of Admin Dashboard"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
};
