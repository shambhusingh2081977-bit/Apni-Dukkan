import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Store,
  Languages,
  Moon,
  Sun,
  Lock,
  Download,
  Upload,
  RotateCcw,
  ShieldCheck,
  Check,
  AlertCircle,
  Wifi,
  Printer,
  Sparkles,
  Bell,
  BellRing,
  Smartphone,
  Database,
  FileJson,
  Copy,
  RefreshCw,
  AlertTriangle,
  X,
  FileUp,
} from 'lucide-react';
import { getNotificationPermission, isNotificationSupported } from '../utils/notifications';
import { DatabasePayload } from '../utils/databasePortability';

export const SettingsModal: React.FC = () => {
  const {
    shopProfile,
    updateShopProfile,
    language,
    setLanguage,
    isDarkMode,
    toggleDarkMode,
    exportBackup,
    getDatabasePayload,
    validateImportString,
    applyDatabaseRestore,
    resetAllToZero,
    resetToDemoData,
    products,
    invoices,
    creditCustomers,
    expenses,
    purchases,
    lockApp,
    requestBrowserNotificationPermission,
    testBrowserAlert,
    t,
  } = useApp();

  const [formName, setFormName] = useState(shopProfile.name);
  const [formTagline, setFormTagline] = useState(shopProfile.tagline);
  const [formAddress, setFormAddress] = useState(shopProfile.address);
  const [formPhone, setFormPhone] = useState(shopProfile.phone);
  const [formGstin, setFormGstin] = useState(shopProfile.gstNumber);
  const [formUpi, setFormUpi] = useState(shopProfile.upiId);
  const [formThermal, setFormThermal] = useState<'58mm' | '80mm'>(shopProfile.thermalWidth || '80mm');
  const [pinEnabled, setPinEnabled] = useState(shopProfile.pinEnabled);
  const [pinCode, setPinCode] = useState(shopProfile.pinCode);

  // Low Stock Notification states
  const [lowStockAlertsEnabled, setLowStockAlertsEnabled] = useState(
    shopProfile.lowStockAlertsEnabled !== false
  );
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(
    shopProfile.browserNotificationsEnabled !== false
  );
  const [defaultThreshold, setDefaultThreshold] = useState<number>(
    shopProfile.defaultLowStockThreshold || 5
  );
  const [testSent, setTestSent] = useState(false);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [importPreviewData, setImportPreviewData] = useState<DatabasePayload | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pastedJsonText, setPastedJsonText] = useState('');
  const [showZeroConfirm, setShowZeroConfirm] = useState(false);
  const [zeroResetNotice, setZeroResetNotice] = useState<string | null>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateShopProfile({
      name: formName.trim(),
      tagline: formTagline.trim(),
      address: formAddress.trim(),
      phone: formPhone.trim(),
      gstNumber: formGstin.trim(),
      upiId: formUpi.trim(),
      thermalWidth: formThermal,
      pinEnabled,
      pinCode: pinCode.trim() || '1234',
      lowStockAlertsEnabled,
      browserNotificationsEnabled,
      defaultLowStockThreshold: Number(defaultThreshold) || 5,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = validateImportString(content);
      if (res.valid && res.data) {
        setImportPreviewData(res.data);
        setImportError(null);
      } else {
        setImportError(res.error || 'Invalid backup JSON file.');
        setImportPreviewData(null);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleProcessPastedJson = () => {
    if (!pastedJsonText.trim()) return;
    const res = validateImportString(pastedJsonText);
    if (res.valid && res.data) {
      setImportPreviewData(res.data);
      setImportError(null);
      setShowPasteModal(false);
      setPastedJsonText('');
    } else {
      setImportError(res.error || 'Invalid JSON database format.');
    }
  };

  const handleCopyJson = async () => {
    try {
      const payload = getDatabasePayload();
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2500);
    } catch (err) {
      console.error('Failed to copy JSON to clipboard', err);
    }
  };

  const handleConfirmRestore = () => {
    if (!importPreviewData) return;
    const ok = applyDatabaseRestore(importPreviewData);
    if (ok) {
      const pCount = importPreviewData.products?.length || 0;
      const iCount = importPreviewData.invoices?.length || 0;
      const cCount = importPreviewData.creditCustomers?.length || 0;
      setImportSuccess(`Database restored successfully! (${pCount} products, ${iCount} bills, ${cCount} Khata customers)`);
      setTimeout(() => setImportSuccess(null), 4000);
    } else {
      setImportError('Failed to restore database. Please check file integrity.');
    }
    setImportPreviewData(null);
  };

  const handleExecuteZeroReset = () => {
    resetAllToZero();
    setShowZeroConfirm(false);
    setZeroResetNotice('All stock quantities and Khata balances refreshed to 00!');
    setTimeout(() => setZeroResetNotice(null), 4000);
  };

  return (
    <div className="space-y-5 pb-24 max-w-2xl mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
          {t.settingsTitle}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Configure shop details, security PIN, printer format, and offline backups
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center space-x-2">
          <Check className="w-4 h-4" />
          <span>Shop settings updated successfully!</span>
        </div>
      )}

      {/* SHOP PROFILE FORM */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
          <Store className="w-4 h-4 text-emerald-500" />
          <span>{t.shopProfile}</span>
        </h3>

        <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
          <div>
            <label className="font-bold block mb-1">{t.shopName} *</label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white font-medium"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-500 block mb-1">Tagline / Slogan</label>
            <input
              type="text"
              value={formTagline}
              onChange={(e) => setFormTagline(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="font-bold block mb-1">{t.shopPhone}</label>
              <input
                type="text"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white font-medium"
              />
            </div>

            <div>
              <label className="font-bold block mb-1">{t.gstin}</label>
              <input
                type="text"
                placeholder="22AAAAA0000A1Z5"
                value={formGstin}
                onChange={(e) => setFormGstin(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="font-bold block mb-1">{t.shopAddress}</label>
            <input
              type="text"
              value={formAddress}
              onChange={(e) => setFormAddress(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="font-bold block mb-1">{t.upiVpa}</label>
              <input
                type="text"
                placeholder="shop@okaxis"
                value={formUpi}
                onChange={(e) => setFormUpi(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="font-bold block mb-1">{t.thermalPrinterWidth}</label>
              <select
                value={formThermal}
                onChange={(e) => setFormThermal(e.target.value as '58mm' | '80mm')}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white font-medium"
              >
                <option value="58mm">{t.width58mm}</option>
                <option value="80mm">{t.width80mm}</option>
              </select>
            </div>
          </div>

          {/* Security PIN Option */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold block text-slate-800 dark:text-slate-200">
                  {t.securityPin}
                </span>
                <span className="text-[11px] text-slate-400">
                  Protect shop data with a 4-digit PIN lock
                </span>
              </div>
              <input
                type="checkbox"
                checked={pinEnabled}
                onChange={(e) => setPinEnabled(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
              />
            </div>

            {pinEnabled && (
              <div className="w-48 pt-1">
                <label className="text-[11px] font-bold block mb-1">{t.enterPin}</label>
                <input
                  type="password"
                  maxLength={6}
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  placeholder="1234"
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white font-mono text-center tracking-widest font-black text-sm"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
            >
              Save Shop Settings
            </button>
          </div>
        </form>
      </div>

      {/* LOW-STOCK NOTIFICATIONS & ALERTS CONFIGURATION */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {t.lowStockNotifications}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Receive browser and in-app alerts when products fall below threshold
              </p>
            </div>
          </div>

          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
              lowStockAlertsEnabled
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            {lowStockAlertsEnabled ? 'Active' : 'Disabled'}
          </span>
        </div>

        <div className="space-y-3 pt-1 text-xs">
          {/* Main Low Stock Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div>
              <span className="font-bold block text-slate-800 dark:text-slate-200">
                {t.enableLowStockAlerts}
              </span>
              <span className="text-[11px] text-slate-400">
                Display critical warning banners and in-app alert toasts
              </span>
            </div>
            <input
              type="checkbox"
              checked={lowStockAlertsEnabled}
              onChange={(e) => {
                setLowStockAlertsEnabled(e.target.checked);
                updateShopProfile({ lowStockAlertsEnabled: e.target.checked });
              }}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-5 h-5 cursor-pointer"
            />
          </div>

          {/* Browser Push Notifications Toggle & Permission */}
          {lowStockAlertsEnabled && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold block text-slate-800 dark:text-slate-200">
                    {t.browserNotifications}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Send native desktop/mobile notifications when stock decreases
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={browserNotificationsEnabled}
                  onChange={(e) => {
                    setBrowserNotificationsEnabled(e.target.checked);
                    updateShopProfile({ browserNotificationsEnabled: e.target.checked });
                  }}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-5 h-5 cursor-pointer"
                />
              </div>

              {/* Permission & Test Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center space-x-1.5 text-[11px]">
                  {getNotificationPermission() === 'granted' ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center space-x-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>{t.notificationPermissionGranted}</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={async () => {
                        const perm = await requestBrowserNotificationPermission();
                        if (perm === 'granted') {
                          setBrowserNotificationsEnabled(true);
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                    >
                      {t.notificationPermissionRequest}
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const sent = testBrowserAlert();
                    setTestSent(true);
                    setTimeout(() => setTestSent(false), 2000);
                  }}
                  className="px-3 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center space-x-1"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>{testSent ? 'Alert Sent!' : t.testNotification}</span>
                </button>
              </div>
            </div>
          )}

          {/* Default Minimum Threshold */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div>
              <span className="font-bold block text-slate-800 dark:text-slate-200">
                {t.defaultAlertThreshold}
              </span>
              <span className="text-[11px] text-slate-400">
                Trigger warning when product quantity reaches or drops below this count
              </span>
            </div>
            <div className="flex items-center space-x-1.5 w-24 shrink-0">
              <input
                type="number"
                min="1"
                max="1000"
                value={defaultThreshold}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setDefaultThreshold(val);
                  updateShopProfile({ defaultLowStockThreshold: val });
                }}
                className="w-full text-right px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-black dark:text-white"
              />
              <span className="text-slate-400 font-bold text-xs">units</span>
            </div>
          </div>
        </div>
      </div>

      {/* LANGUAGE & APPEARANCE QUICK TOGGLE */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white">
          Language & Appearance
        </h3>

        <div className="grid grid-cols-2 gap-3 text-xs">
          {/* Language Switch */}
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
            <span className="font-bold block text-slate-700 dark:text-slate-300">
              {t.languageOption}
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => setLanguage('en')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition ${
                  language === 'en'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition ${
                  language === 'hi'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                हिन्दी
              </button>
            </div>
          </div>

          {/* Theme Switch */}
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
            <span className="font-bold block text-slate-700 dark:text-slate-300">
              {t.themeOption}
            </span>
            <button
              onClick={toggleDarkMode}
              className="w-full py-1.5 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center space-x-1.5"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              <span>{isDarkMode ? t.themeLight : t.themeDark}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ANDROID APP (APK) DOWNLOAD */}
      <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-slate-100 dark:to-slate-800/60 rounded-2xl p-4 sm:p-5 border border-emerald-200 dark:border-emerald-800/60 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/30">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Apni Dukan Android APK
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Direct Android debug package (5.7 MB) • No Google Play account required
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
            v1.0.0 Ready
          </span>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300">
          Install Apni Dukan directly on any Android smartphone (Android 7.0 / API 24 or newer). Signed with standard debug keystore for easy sideloading.
        </p>

        <div className="pt-1">
          <a
            href="/apni-dukan.apk"
            download="apni-dukan.apk"
            className="flex items-center justify-center space-x-2 w-full p-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition"
          >
            <Download className="w-4 h-4" />
            <span>Download apni-dukan.apk (5.7 MB)</span>
          </a>
        </div>
      </div>

      {/* DATABASE PORTABILITY & JSON BACKUP */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Database Portability (JSON Export & Restore)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Full data ownership. Export your complete store database as JSON or restore it anytime.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            JSON v2.0
          </span>
        </div>

        {/* Current Database Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Total Products</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">
              {products.length} <span className="text-xs font-normal text-slate-400">({products.reduce((acc, p) => acc + p.quantity, 0)} units)</span>
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Sales Invoices</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">
              {invoices.length} <span className="text-xs font-normal text-slate-400">bills</span>
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Khata Customers</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">
              {creditCustomers.length} <span className="text-xs font-normal text-slate-400">(₹{creditCustomers.reduce((acc, c) => acc + c.totalDue, 0)} due)</span>
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Daily Expenses</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">
              {expenses.length} <span className="text-xs font-normal text-slate-400">records</span>
            </span>
          </div>
        </div>

        {/* Status notifications */}
        {importSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{importSuccess}</span>
          </div>
        )}

        {importError && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{importError}</span>
            </div>
            <button
              onClick={() => setImportError(null)}
              className="text-rose-500 hover:text-rose-700 text-xs font-bold"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {/* Download JSON */}
          <button
            onClick={exportBackup}
            className="flex items-center justify-center space-x-2 p-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs transition active:scale-[0.98] shadow-sm"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export Database (JSON)</span>
          </button>

          {/* Copy JSON */}
          <button
            onClick={handleCopyJson}
            className="flex items-center justify-center space-x-2 p-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs transition active:scale-[0.98]"
          >
            {copiedJson ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">JSON Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-indigo-500" />
                <span>Copy Database JSON</span>
              </>
            )}
          </button>

          {/* Upload JSON file */}
          <label className="flex items-center justify-center space-x-2 p-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs cursor-pointer transition active:scale-[0.98]">
            <Upload className="w-4 h-4 text-emerald-500" />
            <span>Import Database File</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {/* Paste JSON text */}
          <button
            onClick={() => setShowPasteModal(true)}
            className="flex items-center justify-center space-x-2 p-3 rounded-xl border border-dashed border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 font-bold text-xs transition active:scale-[0.98]"
          >
            <FileJson className="w-4 h-4 text-indigo-500" />
            <span>Paste JSON Text</span>
          </button>
        </div>
      </div>

      {/* REFRESH EVERYTHING TO 00 (ZERO RESET) */}
      <div className="bg-amber-500/5 dark:bg-amber-500/10 rounded-2xl p-4 sm:p-5 border border-amber-200 dark:border-amber-800/60 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-amber-600 text-white shadow-sm shadow-amber-600/30">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Refresh Everything to 00 (Stock 00 & Khata 00)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Zero out all product quantities to 0 and all customer Khata dues to ₹0.00 for a clean fresh start.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
            Fresh Store Start
          </span>
        </div>

        {zeroResetNotice && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{zeroResetNotice}</span>
          </div>
        )}

        <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <button
            onClick={() => setShowZeroConfirm(true)}
            className="flex items-center justify-center space-x-2 p-3 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white font-bold text-xs shadow-md shadow-amber-600/20 transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh All to 00 (Stock 00 & Khata 00)</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm(t.confirmReset)) {
                resetToDemoData();
              }
            }}
            className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-bold flex items-center justify-center space-x-1 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.resetDemoData}</span>
          </button>
        </div>
      </div>

      {/* CONFIRM ZERO RESET MODAL */}
      {showZeroConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base">
                  Refresh Everything to 00?
                </h4>
                <p className="text-xs text-slate-500">
                  Clean slate for store opening
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              This action will set all product inventory quantities to <strong>00</strong>, reset all customer Khata dues to <strong>₹0.00</strong>, and clear current bill history. All product names, barcodes, and customer contacts will be preserved.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowZeroConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteZeroReset}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/30 transition"
              >
                Yes, Set Everything to 00
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DATABASE RESTORE PREVIEW & CONFIRMATION MODAL */}
      {importPreviewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400 shrink-0">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">
                    Verify & Restore Database
                  </h4>
                  <p className="text-xs text-slate-500">
                    Review backup contents before overwriting active data
                  </p>
                </div>
              </div>
              <button
                onClick={() => setImportPreviewData(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Backup Info */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Shop Name:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {importPreviewData.shopProfile?.name || importPreviewData.metadata?.shopName || 'Retail Store'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Export Timestamp:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {new Date(importPreviewData.exportedAt).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Schema Version:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  v{importPreviewData.version || '1.0'}
                </span>
              </div>
            </div>

            {/* Itemized Count Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80">
                <span className="text-slate-400 block text-[11px]">Products</span>
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {importPreviewData.products?.length || 0}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80">
                <span className="text-slate-400 block text-[11px]">Sales Bills</span>
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {importPreviewData.invoices?.length || 0}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80">
                <span className="text-slate-400 block text-[11px]">Khata Customers</span>
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {importPreviewData.creditCustomers?.length || 0}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80">
                <span className="text-slate-400 block text-[11px]">Expenses</span>
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {importPreviewData.expenses?.length || 0}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80">
                <span className="text-slate-400 block text-[11px]">Purchases</span>
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {importPreviewData.purchases?.length || 0}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80">
                <span className="text-slate-400 block text-[11px]">Stock Audit Logs</span>
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {importPreviewData.stockMovements?.length || 0}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <span>
                <strong>Warning:</strong> Restoring will replace your current active store data with this backup point.
              </span>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setImportPreviewData(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRestore}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30 transition flex items-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Confirm & Restore Database</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PASTE JSON MODAL */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-400 shrink-0">
                  <FileJson className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">
                    Paste Database JSON
                  </h4>
                  <p className="text-xs text-slate-500">
                    Paste raw JSON exported from another device
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowPasteModal(false);
                  setPastedJsonText('');
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <textarea
              value={pastedJsonText}
              onChange={(e) => setPastedJsonText(e.target.value)}
              placeholder='Paste JSON here (e.g. { "version": "2.0", "products": [...] })'
              rows={8}
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
            />

            <div className="flex items-center justify-end space-x-2 pt-1">
              <button
                onClick={() => {
                  setShowPasteModal(false);
                  setPastedJsonText('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleProcessPastedJson}
                disabled={!pastedJsonText.trim()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white shadow-md shadow-indigo-600/30 transition flex items-center space-x-1.5"
              >
                <FileUp className="w-4 h-4" />
                <span>Verify & Preview</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
