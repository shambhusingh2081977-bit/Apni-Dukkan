import React from 'react';
import { useApp } from '../context/AppContext';
import {
  calculateTotalStockValue,
  formatINR,
  isDateInPeriod,
  aggregateProfitAndLoss,
  aggregateCreditStats,
} from '../utils/posCalculations';
import {
  TrendingUp,
  TrendingDown,
  Boxes,
  Receipt,
  Wallet,
  AlertTriangle,
  FileText,
  ScanBarcode,
  PlusCircle,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  IndianRupee,
  Layers,
  BookOpen,
} from 'lucide-react';

export const Dashboard: React.FC<{ onOpenAddProduct: () => void }> = ({ onOpenAddProduct }) => {
  const {
    products,
    invoices,
    expenses,
    creditCustomers,
    creditTransactions,
    setActiveTab,
    setScannerOpen,
    setActiveInvoice,
    t,
  } = useApp();

  // Filter today's transactions
  const todayInvoices = invoices.filter((inv) => isDateInPeriod(inv.date, 'today'));
  const todayExpenses = expenses.filter((exp) => isDateInPeriod(exp.date, 'today'));
  const todayStats = aggregateProfitAndLoss(todayInvoices, todayExpenses);

  // Credit Khata metrics
  const creditStats = aggregateCreditStats(creditCustomers, creditTransactions);

  // Overall stock metrics
  const totalStockValue = calculateTotalStockValue(products);
  const lowStockProducts = products.filter((p) => p.quantity <= p.lowStockThreshold);

  const isNetProfitPositive = todayStats.netProfit >= 0;

  return (
    <div className="space-y-5 pb-24">
      {/* Welcome & Quick Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t.dashboardTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        </div>

        {/* Live today badge */}
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>
            {todayStats.billsCount} {todayStats.billsCount === 1 ? 'Sale Completed' : 'Sales Completed'} Today
          </span>
        </div>
      </div>

      {/* Critical Low Stock Warning Banner */}
      {lowStockProducts.length > 0 && (
        <div
          onClick={() => setActiveTab('stock')}
          role="button"
          tabIndex={0}
          className="cursor-pointer bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-amber-500/5 dark:from-amber-950/40 dark:to-amber-900/20 border border-amber-300 dark:border-amber-700/60 rounded-2xl p-3.5 flex items-center justify-between text-amber-900 dark:text-amber-200 transition hover:shadow-md"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0 shadow-sm">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold">
                {lowStockProducts.length} {t.criticalStockWarning}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300/80 mt-0.5">
                {lowStockProducts.slice(0, 3).map((p) => p.name).join(', ')}
                {lowStockProducts.length > 3 ? ` +${lowStockProducts.length - 3} more` : ''}
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 ml-2" />
        </div>
      )}

      {/* PRIMARY STATS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Stock Value */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-700 transition">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t.totalStockValue}</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white">
            {formatINR(totalStockValue)}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            Cost valuation of {products.length} items
          </p>
        </div>

        {/* Today's Sales */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-700 transition">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t.todaySales}</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white">
            {formatINR(todayStats.totalSales)}
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
            {todayStats.billsCount} {t.todayBills}
          </p>
        </div>

        {/* Today's Net Profit - Green for Profit, Red for Loss */}
        <div
          className={`rounded-2xl p-4 border shadow-sm transition ${
            isNetProfitPositive
              ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/80'
              : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/80'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${
                isNetProfitPositive
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : 'text-rose-700 dark:text-rose-300'
              }`}
            >
              {t.todayNetProfit}
            </span>
            <div
              className={`p-2 rounded-xl ${
                isNetProfitPositive
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300'
              }`}
            >
              {isNetProfitPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
            </div>
          </div>
          <div
            className={`text-lg sm:text-2xl font-black ${
              isNetProfitPositive
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-rose-700 dark:text-rose-400'
            }`}
          >
            {formatINR(todayStats.netProfit)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Gross: {formatINR(todayStats.grossProfit)} - Exp: {formatINR(todayStats.totalExpenses)}
          </p>
        </div>

        {/* Today's Expenses */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-700 transition">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t.todayExpenses}</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white">
            {formatINR(todayStats.totalExpenses)}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            {todayExpenses.length} expense entries today
          </p>
        </div>
      </div>

      {/* SECONDARY ROW: Quick Counts + Khata Due */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <button
          onClick={() => setActiveTab('stock')}
          className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-left transition hover:border-emerald-500 shadow-xs"
        >
          <div className="text-xs text-slate-500 dark:text-slate-400">{t.totalProducts}</div>
          <div className="text-base sm:text-xl font-bold text-slate-900 dark:text-white mt-0.5">
            {products.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Inventory items</div>
        </button>

        <button
          onClick={() => setActiveTab('stock')}
          className={`p-3 rounded-xl border text-left transition shadow-xs ${
            lowStockProducts.length > 0
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
          }`}
        >
          <div className="text-xs">{t.lowStockAlerts}</div>
          <div className="text-base sm:text-xl font-bold mt-0.5 flex items-center space-x-1">
            <span>{lowStockProducts.length}</span>
            {lowStockProducts.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            )}
          </div>
          <div className="text-[10px] opacity-75 mt-0.5">Needs reorder</div>
        </button>

        <button
          onClick={() => setActiveTab('billing')}
          className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-left transition hover:border-emerald-500 shadow-xs"
        >
          <div className="text-xs text-slate-500 dark:text-slate-400">{t.todayBills}</div>
          <div className="text-base sm:text-xl font-bold text-slate-900 dark:text-white mt-0.5">
            {todayStats.billsCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Checkout receipts</div>
        </button>

        {/* Khata / Credit Due Card */}
        <button
          onClick={() => setActiveTab('credit')}
          className={`p-3 rounded-xl border text-left transition shadow-xs ${
            creditStats.totalOutstandingDue > 0
              ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/70 hover:border-amber-500'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-500'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-800 dark:text-amber-300 font-semibold">{t.creditKhata}</span>
            <BookOpen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-base sm:text-xl font-black text-amber-700 dark:text-amber-400 mt-0.5">
            {formatINR(creditStats.totalOutstandingDue)}
          </div>
          <div className="text-[10px] text-amber-600 dark:text-amber-300/80 mt-0.5">
            {creditStats.customersWithDueCount} {creditStats.customersWithDueCount === 1 ? 'customer due' : 'customers due'}
          </div>
        </button>
      </div>

      {/* QUICK ACCESS LARGE BUTTONS FOR SHOPKEEPERS */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2.5 flex items-center space-x-1.5">
          <Sparkles className="w-4 h-4 text-emerald-500" />
          <span>{t.quickActions}</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
          {/* New Bill POS Button */}
          <button
            onClick={() => setActiveTab('billing')}
            className="flex items-center space-x-3 p-3.5 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 hover:from-emerald-700 hover:to-teal-800 active:scale-95 transition text-left"
          >
            <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold">{t.actionNewBill}</div>
              <div className="text-[11px] text-emerald-100 font-normal">Fast POS Checkout</div>
            </div>
          </button>

          {/* Khata / Credit System Button */}
          <button
            onClick={() => setActiveTab('credit')}
            className="flex items-center space-x-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-sm hover:border-amber-500 dark:hover:border-amber-500 active:scale-95 transition text-left shadow-sm"
          >
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold">{t.creditKhata}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                {creditStats.customersWithDueCount > 0 ? `${formatINR(creditStats.totalOutstandingDue)} Due` : 'Khata Ledger'}
              </div>
            </div>
          </button>

          {/* Add Product Button */}
          <button
            onClick={onOpenAddProduct}
            className="flex items-center space-x-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-sm hover:border-emerald-500 dark:hover:border-emerald-500 active:scale-95 transition text-left shadow-sm"
          >
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 shrink-0">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold">{t.actionAddProduct}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">New inventory</div>
            </div>
          </button>

          {/* Scan Barcode Button */}
          <button
            onClick={() => setScannerOpen(true)}
            className="flex items-center space-x-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-sm hover:border-emerald-500 dark:hover:border-emerald-500 active:scale-95 transition text-left shadow-sm"
          >
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 shrink-0">
              <ScanBarcode className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold">{t.actionScanBarcode}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">Camera / USB</div>
            </div>
          </button>

          {/* Reports Button */}
          <button
            onClick={() => setActiveTab('reports')}
            className="flex items-center space-x-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-sm hover:border-emerald-500 dark:hover:border-emerald-500 active:scale-95 transition text-left shadow-sm col-span-2 sm:col-span-1"
          >
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold">{t.actionReports}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">Sales & P&L</div>
            </div>
          </button>
        </div>
      </div>

      {/* TODAY'S RECENT INVOICES */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center space-x-2">
            <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              {t.recentBills}
            </h3>
          </div>
          {invoices.length > 0 && (
            <button
              onClick={() => setActiveTab('reports')}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-0.5"
            >
              <span>{t.viewAll}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {invoices.length === 0 ? (
          <div className="text-center py-8 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <ShoppingBag className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {t.noRecentBills}
            </p>
            <button
              onClick={() => setActiveTab('billing')}
              className="mt-3 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-sm hover:bg-emerald-700 transition"
            >
              {t.actionNewBill}
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {invoices.slice(0, 5).map((inv) => (
              <div
                key={inv.id}
                onClick={() => setActiveInvoice(inv)}
                className="py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl px-2 transition -mx-2"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0 font-bold text-xs">
                    #{inv.invoiceNumber.split('-').pop()}
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                      <span>{inv.customerName || 'Walk-in Customer'}</span>
                      <span className="text-[10px] uppercase px-1.5 py-0.5 rounded font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        {inv.paymentMethod}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {new Date(inv.date).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })} • {inv.items.length} {inv.items.length === 1 ? 'item' : 'items'}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                    {formatINR(inv.grandTotal)}
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    Profit: {formatINR(inv.grossProfit)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
