import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, Printer, Download, Heart, Sparkles } from 'lucide-react';
import { WeddingSettings } from '../types';

interface PrintQRCodePageProps {
  settings: WeddingSettings | null;
  guestUrl: string;
  onBack: () => void;
}

export const PrintQRCodePage: React.FC<PrintQRCodePageProps> = ({
  settings,
  guestUrl,
  onBack,
}) => {
  const qrRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPng = () => {
    // Generate a high-resolution canvas for printing
    const svgElement = qrRef.current?.querySelector('svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    // High resolution 1024x1024 for crisp printing
    canvas.width = 1024;
    canvas.height = 1024;

    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 64, 64, 896, 896);

        const a = document.createElement('a');
        a.download = `wedding-qr-code-${settings?.coupleNames.replace(/\s+/g, '_') || 'wedding'}.png`;
        a.href = canvas.toDataURL('image/png');
        a.click();
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const couple = settings?.coupleNames || 'Our Wedding Celebration';
  const date = settings?.weddingDate || 'Our Special Day';

  return (
    <div className="min-h-screen bg-[#FAF8F5] p-4 sm:p-8 flex flex-col items-center">
      {/* Top action bar (hidden during print) */}
      <div className="no-print w-full max-w-xl mx-auto flex items-center justify-between mb-6 pb-4 border-b border-champagne-300">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 text-xs sm:text-sm font-medium text-charcoal-800/70 hover:text-charcoal-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownloadPng}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white border border-gold-300 text-gold-800 hover:bg-champagne-50 text-xs sm:text-sm font-medium shadow-sm transition-colors"
          >
            <Download className="w-4 h-4 text-gold-600" />
            <span>Download PNG</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-gold-600 hover:bg-gold-700 text-white text-xs sm:text-sm font-medium shadow-md transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Card</span>
          </button>
        </div>
      </div>

      {/* Printable Wedding Table Card (5x7 / A4 printable size) */}
      <div className="printable-card relative w-full max-w-md bg-white border-2 border-gold-400 rounded-3xl p-8 sm:p-12 text-center shadow-2xl flex flex-col items-center justify-center my-auto">
        {/* Ornate corner flourishes */}
        <div className="absolute top-3 left-3 text-gold-400 text-lg leading-none select-none">⌜</div>
        <div className="absolute top-3 right-3 text-gold-400 text-lg leading-none select-none">⌝</div>
        <div className="absolute bottom-3 left-3 text-gold-400 text-lg leading-none select-none">⌞</div>
        <div className="absolute bottom-3 right-3 text-gold-400 text-lg leading-none select-none">⌟</div>

        {/* Inner subtle decorative border */}
        <div className="absolute inset-2 border border-gold-200/60 rounded-[22px] pointer-events-none"></div>

        {/* Monogram Icon */}
        <div className="w-12 h-12 rounded-full bg-champagne-100 border border-gold-300 flex items-center justify-center text-gold-600 mb-4 shadow-sm">
          <Heart className="w-6 h-6 fill-gold-400 stroke-gold-600" />
        </div>

        {/* Heading */}
        <h2 className="text-2xl sm:text-3xl font-serif text-charcoal-800 font-normal tracking-wide">
          Scan to Share Your Wedding Memories
        </h2>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-charcoal-800/75 mt-2 max-w-xs leading-relaxed font-light">
          Every moment deserves to be remembered. Open your phone camera to scan and upload your photos directly to our album.
        </p>

        {/* Divider */}
        <div className="flex items-center justify-center space-x-2 my-5 w-32">
          <span className="h-[1px] flex-1 bg-gold-300"></span>
          <Sparkles className="w-3.5 h-3.5 text-gold-500" />
          <span className="h-[1px] flex-1 bg-gold-300"></span>
        </div>

        {/* QR Code Container */}
        <div
          ref={qrRef}
          className="p-4 bg-white rounded-2xl border-2 border-gold-300/80 shadow-md inline-block my-2"
        >
          <QRCodeSVG
            value={guestUrl}
            size={220}
            level="H"
            includeMargin={true}
            fgColor="#2A2521"
            bgColor="#FFFFFF"
          />
        </div>

        <p className="text-[11px] uppercase tracking-wider text-gold-700/80 font-medium mt-3">
          No App or Sign-in Required
        </p>

        {/* Couple & Date */}
        <div className="mt-6 pt-4 border-t border-gold-200/80 w-full">
          <h3 className="font-serif text-xl sm:text-2xl text-charcoal-800 font-normal">
            {couple}
          </h3>
          <p className="text-xs uppercase tracking-widest text-gold-700/80 mt-1">
            {date}
          </p>
        </div>
      </div>

      <p className="no-print text-xs text-charcoal-800/50 mt-6 text-center max-w-sm">
        Tip: Print this card on sturdy 5x7 or A4 cardstock and place on guest reception tables!
      </p>
    </div>
  );
};
