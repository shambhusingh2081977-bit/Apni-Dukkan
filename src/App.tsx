import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { Dashboard } from './components/Dashboard';
import { StockManagement } from './components/StockManagement';
import { BillingPOS } from './components/BillingPOS';
import { PurchasesAndExpenses } from './components/PurchasesAndExpenses';
import { ReportsAnalytics } from './components/ReportsAnalytics';
import { SettingsModal } from './components/SettingsModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { InvoiceModal } from './components/InvoiceModal';
import { PinLockScreen } from './components/PinLockScreen';
import { CreditKhata } from './components/CreditKhata';
import { AlertTriangle, X, ArrowRight } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { activeTab, setActiveTab, isLocked, lowStockToast, dismissLowStockToast } = useApp();
  const [addProductModalOpen, setAddProductModalOpen] = useState(false);

  if (isLocked) {
    return <PinLockScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <Navbar />

      {/* Floating Low-Stock Alert Toast */}
      {lowStockToast && (
        <div className="fixed top-16 right-4 left-4 sm:left-auto sm:w-96 z-50 animate-bounce-short">
          <div className="bg-amber-500 text-slate-950 px-4 py-3 rounded-2xl shadow-xl border-2 border-amber-300 flex items-start justify-between gap-3">
            <div className="flex items-start space-x-2.5">
              <div className="p-1.5 rounded-lg bg-amber-600/40 text-slate-950 shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 font-bold" />
              </div>
              <div className="text-xs">
                <div className="font-black text-sm uppercase tracking-wide">
                  Low Stock Alert!
                </div>
                <div className="font-medium text-slate-900 mt-0.5">
                  <span className="font-bold">{lowStockToast.productName}</span> is low:{' '}
                  <span className="font-black underline">{lowStockToast.quantity} {lowStockToast.unit}</span> left
                  {lowStockToast.threshold !== undefined && ` (Limit: ${lowStockToast.threshold})`}.
                </div>
                <button
                  onClick={() => {
                    dismissLowStockToast();
                    setActiveTab('stock');
                  }}
                  className="mt-2 inline-flex items-center space-x-1 text-[11px] font-extrabold bg-slate-950 text-amber-300 px-2.5 py-1 rounded-lg hover:bg-slate-800 transition"
                >
                  <span>Refill Stock</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
            <button
              onClick={dismissLowStockToast}
              className="p-1 rounded-lg text-slate-900 hover:bg-amber-600/30 transition shrink-0"
              aria-label="Dismiss alert"
            >
              <X className="w-4 h-4 font-bold" />
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 pt-4 sm:pt-6">
        {activeTab === 'home' && (
          <Dashboard
            onOpenAddProduct={() => setAddProductModalOpen(true)}
          />
        )}
        {activeTab === 'stock' && (
          <StockManagement
            addProductModalOpen={addProductModalOpen}
            setAddProductModalOpen={setAddProductModalOpen}
          />
        )}
        {activeTab === 'billing' && <BillingPOS />}
        {activeTab === 'credit' && <CreditKhata />}
        {activeTab === 'purchases' && <PurchasesAndExpenses />}
        {activeTab === 'reports' && <ReportsAnalytics />}
        {activeTab === 'settings' && <SettingsModal />}
      </main>

      {/* Floating modals */}
      <BarcodeScannerModal
        onAddNewProductWithBarcode={(barcode) => {
          setAddProductModalOpen(true);
        }}
      />
      <InvoiceModal />

      {/* Fixed Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
