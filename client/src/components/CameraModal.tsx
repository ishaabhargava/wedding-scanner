import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, AlertCircle, Check, SwitchCamera } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  remainingSlots: number;
}

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  remainingSlots,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [capturedCount, setCapturedCount] = useState(0);

  // Start video stream when modal opens or when facingMode changes
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedCount(0);
      return;
    }

    startCamera(facingMode);

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startCamera = async (mode: 'environment' | 'user') => {
    stopCamera();
    setErrorMessage(null);
    setHasCameraPermission(null);

    // Check if mediaDevices is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHasCameraPermission(false);
      setErrorMessage(
        'Direct in-browser camera is not supported on this browser or requires a secure HTTPS connection. Please use the system file picker instead.'
      );
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setHasCameraPermission(true);
    } catch (err: any) {
      console.warn('Camera access error with ideal constraint, trying basic video constraint:', err);
      try {
        // Fallback with minimal video constraints
        const basicStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = basicStream;
        if (videoRef.current) {
          videoRef.current.srcObject = basicStream;
          videoRef.current.play().catch(() => {});
        }
        setHasCameraPermission(true);
      } catch (fallbackErr: any) {
        setHasCameraPermission(false);
        if (fallbackErr.name === 'NotAllowedError' || fallbackErr.name === 'PermissionDeniedError') {
          setErrorMessage('Camera access was denied. Please allow camera permissions in your browser settings.');
        } else if (fallbackErr.name === 'NotFoundError' || fallbackErr.name === 'DevicesNotFoundError') {
          setErrorMessage('No camera device was detected on your device.');
        } else {
          setErrorMessage(`Could not access camera: ${fallbackErr.message || 'Unknown error'}`);
        }
      }
    }
  };

  const handleSwitchCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current || remainingSlots <= capturedCount) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Trigger shutter flash effect
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 180);

    // If using user-facing camera, optionally flip horizontally for natural mirror feel
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `wedding_camera_${timestamp}.jpg`;
        const file = new File([blob], filename, { type: 'image/jpeg', lastModified: Date.now() });

        onCapture(file);
        setCapturedCount((prev) => prev + 1);
      },
      'image/jpeg',
      0.92
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-charcoal-900/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-charcoal-900 rounded-3xl overflow-hidden border border-gold-400/40 shadow-2xl flex flex-col text-white">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-charcoal-900/90 border-b border-white/10 z-10">
          <div className="flex items-center space-x-2">
            <Camera className="w-5 h-5 text-gold-400" />
            <span className="font-serif text-lg tracking-wide">Take Wedding Photo</span>
          </div>

          <div className="flex items-center space-x-2">
            {capturedCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {capturedCount} captured
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Close camera"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewfinder Area */}
        <div className="relative w-full aspect-[4/3] sm:aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
          {/* Shutter flash overlay */}
          {isFlashing && (
            <div className="absolute inset-0 bg-white z-30 transition-opacity duration-150 animate-pulse" />
          )}

          {/* Video Stream Element */}
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
          />

          {/* Camera Viewfinder Crosshairs */}
          {hasCameraPermission === true && (
            <div className="absolute inset-6 pointer-events-none border border-white/20 rounded-2xl flex items-center justify-center">
              <div className="w-12 h-12 border-2 border-gold-300/40 rounded-full" />
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-gold-400" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-gold-400" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-gold-400" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-gold-400" />
            </div>
          )}

          {/* Loading Camera State */}
          {hasCameraPermission === null && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 space-y-3 p-4 text-center">
              <RefreshCw className="w-8 h-8 text-gold-400 animate-spin" />
              <p className="text-sm font-serif text-champagne-100">Connecting to camera...</p>
            </div>
          )}

          {/* Camera Error State */}
          {hasCameraPermission === false && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-charcoal-900/95 space-y-3 p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-300">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="text-base font-serif text-white">Camera Access Needed</h4>
              <p className="text-xs text-white/70 max-w-sm leading-relaxed">
                {errorMessage || 'Unable to open camera.'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => startCamera(facingMode)}
                  className="px-4 py-2 rounded-xl bg-gold-600 hover:bg-gold-700 text-xs font-semibold text-white transition-colors"
                >
                  Try Again
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
                >
                  Use Gallery Instead
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Control Bar */}
        <div className="p-4 sm:p-5 bg-charcoal-900 border-t border-white/10 flex items-center justify-between">
          {/* Flip / Switch Camera Button */}
          <button
            type="button"
            onClick={handleSwitchCamera}
            disabled={!hasCameraPermission}
            className="p-3 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-all disabled:opacity-40"
            title="Switch Camera (Front / Back)"
          >
            <SwitchCamera className="w-5 h-5 text-champagne-100" />
          </button>

          {/* Circular Shutter Button */}
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={handleCapturePhoto}
              disabled={!hasCameraPermission || remainingSlots <= capturedCount}
              className="w-16 h-16 rounded-full border-4 border-gold-400 p-1 bg-white hover:bg-champagne-100 active:scale-90 transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
              title="Snap Photo"
            >
              <div className="w-full h-full rounded-full bg-gold-600 hover:bg-gold-700 transition-colors" />
            </button>
            <span className="text-[10px] text-white/60 mt-1.5 font-medium">
              {remainingSlots - capturedCount > 0
                ? `${remainingSlots - capturedCount} slots remaining`
                : 'Limit reached'}
            </span>
          </div>

          {/* Done / Finish Button */}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-gold-600 hover:bg-gold-700 active:scale-95 text-xs font-semibold text-white shadow-md transition-all flex items-center space-x-1"
          >
            <Check className="w-4 h-4" />
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
};
