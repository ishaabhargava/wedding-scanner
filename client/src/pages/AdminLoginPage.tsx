import React, { useState } from 'react';
import { Lock, ArrowLeft, KeyRound, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

interface AdminLoginPageProps {
  onSuccess: (token: string) => void;
  onBackToGuest: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onSuccess, onBackToGuest }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setError(null);
    setIsLoading(true);

    try {
      const { token } = await api.adminLogin(password);
      localStorage.setItem('wedding_admin_token', token);
      onSuccess(token);
    } catch (err: any) {
      setError(err.message || 'Incorrect password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back button */}
        <button
          onClick={onBackToGuest}
          className="mb-6 inline-flex items-center space-x-1.5 text-xs sm:text-sm font-medium text-charcoal-800/70 hover:text-charcoal-800 hover:underline transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Guest Upload Page</span>
        </button>

        {/* Card */}
        <div className="bg-white/95 rounded-3xl p-6 sm:p-8 shadow-xl border border-champagne-300">
          <div className="text-center space-y-3 mb-6">
            <div className="w-14 h-14 mx-auto rounded-full bg-champagne-100 flex items-center justify-center text-gold-600 border border-gold-200 shadow-inner">
              <Lock className="w-6 h-6 stroke-[1.75]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif text-charcoal-800 font-normal">
              Organizer Sign In
            </h1>
            <p className="text-xs sm:text-sm text-charcoal-800/70">
              Access dashboard to connect Google Drive, view uploads, and customize wedding details.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-800 mb-1.5">
                Administrator Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-charcoal-800/40">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password..."
                  required
                  className="w-full pl-9 pr-10 py-3 rounded-xl border border-champagne-300 bg-champagne-50/30 text-charcoal-800 placeholder-charcoal-800/40 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent text-sm transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-charcoal-800/40 hover:text-charcoal-800 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !password}
              className="w-full py-3.5 px-4 rounded-xl bg-gold-600 hover:bg-gold-700 active:scale-[0.98] text-white font-medium text-sm shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : (
                <span>Access Dashboard</span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-champagne-200 text-center text-xs text-charcoal-800/60">
            <span>Default password in development: </span>
            <code className="bg-champagne-100 text-gold-900 px-1.5 py-0.5 rounded font-mono font-medium">wedding2025</code>
          </div>
        </div>
      </div>
    </div>
  );
};
