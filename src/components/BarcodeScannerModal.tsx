import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { formatINR } from '../utils/posCalculations';
import {
  ScanBarcode,
  X,
  Camera,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  ShoppingBag,
  Flashlight,
  Volume2,
} from 'lucide-react';

export const BarcodeScannerModal: React.FC<{
  onAddNewProductWithBarcode?: (barcode: string) => void;
}> = ({ onAddNewProductWithBarcode }) => {
  const {
    scannerOpen,
    setScannerOpen,
    products,
    addToCart,
    setActiveTab,
    t,
  } = useApp();

  const [scannedCode, setScannedCode] = useState<string>('');
  const [matchedProduct, setMatchedProduct] = useState<Product | null>(null);
  const [manualInput, setManualInput] = useState<string>('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanSuccessMessage, setScanSuccessMessage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize camera stream when modal opens
  useEffect(() => {
    if (!scannerOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [scannerOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera API is not supported in this browser.');
        return;
      }

      // Safe timeout for environments without physical video capture
      const mediaPromise = navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Camera initialization timed out')), 2000)
      );

      const stream = await Promise.race([mediaPromise, timeoutPromise]);

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
        setCameraActive(true);
      }
    } catch {
      setCameraError(
        'Camera permission was not granted or not available. Use the simulation buttons or external USB/Bluetooth scanner.'
      );
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const processBarcode = (code: string) => {
    const clean = code.trim();
    if (!clean) return;
    setScannedCode(clean);

    const found = products.find(
      (p) => p.barcode.trim().toLowerCase() === clean.toLowerCase()
    );

    if (found) {
      setMatchedProduct(found);
      const res = addToCart(found, 1);
      if (res.success) {
        setScanSuccessMessage(`Added "${found.name}" to bill cart!`);
        // Beep feedback simulation
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          osc.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.1);
        } catch {}
      } else {
        setScanSuccessMessage(res.error || 'Out of stock!');
      }
    } else {
      setMatchedProduct(null);
      setScanSuccessMessage(null);
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      processBarcode(manualInput.trim());
      setManualInput('');
    }
  };

  if (!scannerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-emerald-500 text-white">
              <ScanBarcode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                {t.scannerTitle}
              </h3>
              <p className="text-[11px] text-slate-400">
                Camera & Barcode Reader
              </p>
            </div>
          </div>

          <button
            onClick={() => setScannerOpen(false)}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CAMERA VIEWPORT WITH SCANNING RETICLE */}
        <div className="relative w-full aspect-4/3 bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-800 shadow-inner">
          <video
            ref={videoRef}
            playsInline
            muted
            className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
          />

          {!cameraActive && (
            <div className="text-center p-4 space-y-2 text-slate-400">
              <Camera className="w-10 h-10 mx-auto opacity-40 text-slate-300" />
              <p className="text-xs">
                {cameraError || 'Initializing camera viewfinder...'}
              </p>
            </div>
          )}

          {/* Target Reticle Overlay */}
          <div className="absolute inset-8 border-2 border-emerald-400/80 rounded-2xl pointer-events-none flex items-center justify-center">
            {/* Red animated laser scanning beam */}
            <div className="w-full h-0.5 bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-pulse"></div>

            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-400"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-400"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-400"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-400"></div>
          </div>
        </div>

        {/* Scan Feedback Result Card */}
        {scannedCode && (
          <div
            className={`p-3 rounded-2xl border transition ${
              matchedProduct
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {t.barcodeDetected}
                </span>
                <p className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                  {scannedCode}
                </p>
              </div>

              {matchedProduct ? (
                <span className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{t.productFound}</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900 px-2 py-0.5 rounded-full">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Not Found</span>
                </span>
              )}
            </div>

            {matchedProduct ? (
              <div className="mt-2 pt-2 border-t border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
                <div>
                  <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                    {matchedProduct.name}
                  </h4>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Price: {formatINR(matchedProduct.sellingPrice)} • Stock: {matchedProduct.quantity} {matchedProduct.unit}
                  </div>
                </div>

                <button
                  onClick={() => {
                    addToCart(matchedProduct, 1);
                    setActiveTab('billing');
                    setScannerOpen(false);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-sm"
                >
                  Go to POS
                </button>
              </div>
            ) : (
              <div className="mt-2 pt-2 border-t border-amber-200 dark:border-amber-800/60 flex items-center justify-between">
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  {t.productNotFound} {scannedCode}
                </p>
                {onAddNewProductWithBarcode && (
                  <button
                    onClick={() => {
                      onAddNewProductWithBarcode(scannedCode);
                      setScannerOpen(false);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-amber-600 text-white font-bold text-xs shrink-0"
                  >
                    + Add Product
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Manual Barcode Input & USB Barcode Trigger */}
        <form onSubmit={handleManualSearch} className="flex space-x-2">
          <input
            type="text"
            placeholder="Type barcode or scan with USB gun..."
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white font-mono"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white font-bold text-xs rounded-xl hover:bg-slate-800"
          >
            Enter
          </button>
        </form>

        {/* QUICK TEST BARCODES (Ideal for simulated test verification) */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {t.quickTestBarcodes}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {products.slice(0, 4).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => processBarcode(p.barcode)}
                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-mono transition"
              >
                {p.barcode} ({p.name.split(' ')[0]})
              </button>
            ))}
            <button
              type="button"
              onClick={() => processBarcode('8909999999')}
              className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950 dark:hover:bg-amber-900 text-amber-700 dark:text-amber-300 text-[11px] font-mono transition"
            >
              8909999999 (Unknown)
            </button>
          </div>
        </div>

        {/* Bottom actions */}
        <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setScannerOpen(false)}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
          >
            {t.closeScanner}
          </button>
        </div>
      </div>
    </div>
  );
};
