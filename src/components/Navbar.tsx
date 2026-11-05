import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Store,
  Languages,
  Moon,
  Sun,
  ScanBarcode,
  Lock,
  Wifi,
  Sparkles,
  Download,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

export const Navbar: React.FC = () => {
  const {
    shopProfile,
    language,
    setLanguage,
    isDarkMode,
    toggleDarkMode,
    setScannerOpen,
    lockApp,
    t,
  } = useApp();

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between">
        {/* Brand & Store Name */}
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
            <Store className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                {shopProfile.name || t.appName}
              </h1>
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                POS
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate hidden xs:block">
              {shopProfile.tagline || t.tagline}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* Direct Android APK Download Button */}
          <a
            href="/apni-dukan.apk"
            download="apni-dukan.apk"
            title="Download Apni Dukan Android APK"
            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:hover:bg-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 transition active:scale-95 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Download APK</span>
          </a>

          {/* In-App PWA Install Trigger */}
          <PWAInstallButton />

          {/* Offline Ready Badge */}
          <div
            title={t.offlineReady}
            className="hidden md:flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
          >
            <Wifi className="w-3.5 h-3.5 text-emerald-500" />
            <span>Offline Ready</span>
          </div>

          {/* Barcode scanner button */}
          <button
            onClick={() => setScannerOpen(true)}
            aria-label={t.actionScanBarcode}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition active:scale-95"
          >
            <ScanBarcode className="w-4 h-4" />
            <span className="hidden sm:inline">{t.actionScanBarcode}</span>
          </button>

          {/* Language Switcher */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
            aria-label="Switch Language"
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
            title={language === 'en' ? 'Switch to Hindi (हिन्दी)' : 'Switch to English'}
          >
            <Languages className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="font-bold">{language === 'en' ? 'हिन्दी' : 'EN'}</span>
          </button>

          {/* Theme Switcher */}
          <button
            onClick={toggleDarkMode}
            aria-label="Toggle Dark Mode"
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* PIN Lock button if enabled */}
          {shopProfile.pinEnabled && (
            <button
              onClick={lockApp}
              aria-label={t.lockAppNow}
              className="p-2 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition"
              title={t.lockAppNow}
            >
              <Lock className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
