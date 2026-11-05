import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PeriodFilter } from '../types';
import {
  formatINR,
  isDateInPeriod,
  aggregateProfitAndLoss,
  calculateTotalStockValue,
} from '../utils/posCalculations';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Printer,
  ShoppingBag,
  Boxes,
  Percent,
  Receipt,
  FileSpreadsheet,
  AlertTriangle,
  Award,
} from 'lucide-react';

export const ReportsAnalytics: React.FC = () => {
  const { invoices, expenses, products, t, setActiveInvoice } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('today');

  // Filter based on selected period
  const filteredInvoices = invoices.filter((inv) =>
    isDateInPeriod(inv.date, selectedPeriod)
  );
  const filteredExpenses = expenses.filter((exp) =>
    isDateInPeriod(exp.date, selectedPeriod)
  );

  const stats = aggregateProfitAndLoss(filteredInvoices, filteredExpenses);
  const totalInventoryCost = calculateTotalStockValue(products);

  // Best selling products calculation
  const productSalesMap = new Map<
    string,
    { name: string; unitsSold: number; totalRevenue: number }
  >();

  filteredInvoices.forEach((inv) => {
    inv.items.forEach((item) => {
      const existing = productSalesMap.get(item.productId) || {
        name: item.productName,
        unitsSold: 0,
        totalRevenue: 0,
      };
      productSalesMap.set(item.productId, {
        name: item.productName,
        unitsSold: existing.unitsSold + item.quantity,
        totalRevenue: existing.totalRevenue + item.itemTotal,
      });
    });
  });

  const bestSellers = Array.from(productSalesMap.values())
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, 5);

  const isNetProfitPositive = stats.netProfit >= 0;

  // Export to CSV
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Invoice Number,Date,Customer,Grand Total,Payment,Profit\r\n';

    filteredInvoices.forEach((inv) => {
      const row = [
        inv.invoiceNumber,
        new Date(inv.date).toLocaleDateString('en-IN'),
        `"${inv.customerName || 'Walk-in'}"`,
        inv.grandTotal,
        inv.paymentMethod,
        inv.grossProfit,
      ].join(',');
      csvContent += row + '\r\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BuiltToStock_Sales_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Title & Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {t.reportsTitle}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t.profitFormulaNote}
          </p>
        </div>

        {/* Period Pills */}
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold overflow-x-auto no-scrollbar">
          {(['today', 'week', 'month', 'year', 'all'] as PeriodFilter[]).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                selectedPeriod === period
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {period === 'today' && t.periodToday}
              {period === 'week' && t.periodWeek}
              {period === 'month' && t.periodMonth}
              {period === 'year' && t.periodYear}
              {period === 'all' && t.periodAll}
            </button>
          ))}
        </div>
      </div>

      {/* PROFIT & LOSS METRICS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Sales Revenue */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
            {t.salesRevenue}
          </span>
          <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white">
            {formatINR(stats.totalSales)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            From {stats.billsCount} invoices
          </span>
        </div>

        {/* Cost of Goods Sold (COGS) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
            Cost of Goods (COGS)
          </span>
          <div className="text-lg sm:text-2xl font-black text-slate-700 dark:text-slate-300">
            {formatINR(stats.cogsTotal)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Purchase cost of sold items
          </span>
        </div>

        {/* Gross Profit */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
            {t.grossProfit}
          </span>
          <div className="text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {formatINR(stats.grossProfit)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Sales - COGS
          </span>
        </div>

        {/* Total Expenses */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
            {t.totalExpensesLabel}
          </span>
          <div className="text-lg sm:text-2xl font-black text-purple-600 dark:text-purple-400">
            {formatINR(stats.totalExpenses)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {filteredExpenses.length} shop expense items
          </span>
        </div>

        {/* NET PROFIT / NET LOSS (Highlighted: Green for profit, Red for loss!) */}
        <div
          className={`col-span-2 sm:col-span-2 rounded-2xl p-4 sm:p-5 border shadow-sm transition ${
            isNetProfitPositive
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  isNetProfitPositive
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-rose-700 dark:text-rose-300'
                }`}
              >
                {isNetProfitPositive ? t.netProfit : t.netLoss}
              </span>
              <div
                className={`text-2xl sm:text-3xl font-black mt-1 ${
                  isNetProfitPositive
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-rose-700 dark:text-rose-400'
                }`}
              >
                {formatINR(stats.netProfit)}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                Net Profit = Gross Profit ({formatINR(stats.grossProfit)}) - Expenses ({formatINR(stats.totalExpenses)})
              </p>
            </div>

            <div
              className={`p-3 rounded-2xl ${
                isNetProfitPositive
                  ? 'bg-emerald-200/80 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
                  : 'bg-rose-200/80 dark:bg-rose-900 text-rose-800 dark:text-rose-200'
              }`}
            >
              {isNetProfitPositive ? (
                <TrendingUp className="w-8 h-8" />
              ) : (
                <TrendingDown className="w-8 h-8" />
              )}
            </div>
          </div>
        </div>

        {/* Total Discounts & GST */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            {t.totalDiscountsGiven}
          </span>
          <div className="text-base sm:text-xl font-bold text-slate-900 dark:text-white">
            {formatINR(stats.totalDiscount)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Customer bill discounts
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            {t.totalGstCollected}
          </span>
          <div className="text-base sm:text-xl font-bold text-slate-900 dark:text-white">
            {formatINR(stats.totalGst)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Tax collected from sales
          </span>
        </div>
      </div>

      {/* VISUAL REVENUE & PROFIT COMPARISON BAR */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Financial Breakdown ({selectedPeriod.toUpperCase()})
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.exportReportCsv}</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Visual Multi-Segment Bar */}
        {stats.totalSales > 0 ? (
          <div className="space-y-2">
            <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${Math.min(100, Math.max(5, (stats.cogsTotal / stats.totalSales) * 100))}%` }}
                className="bg-amber-500 h-full"
                title={`COGS: ${formatINR(stats.cogsTotal)}`}
              />
              <div
                style={{ width: `${Math.min(100, Math.max(5, (stats.totalExpenses / stats.totalSales) * 100))}%` }}
                className="bg-purple-500 h-full"
                title={`Expenses: ${formatINR(stats.totalExpenses)}`}
              />
              <div
                style={{ width: `${Math.min(100, Math.max(5, (Math.max(0, stats.netProfit) / stats.totalSales) * 100))}%` }}
                className="bg-emerald-500 h-full"
                title={`Net Profit: ${formatINR(stats.netProfit)}`}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-1">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span>COGS: {formatINR(stats.cogsTotal)}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                <span>Expenses: {formatINR(stats.totalExpenses)}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  Net Profit: {formatINR(stats.netProfit)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-3 text-center">
            No sales recorded in this period.
          </p>
        )}
      </div>

      {/* BEST SELLING PRODUCTS & SALES INVOICES LIST */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Best Selling Products */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center space-x-2">
            <Award className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {t.bestSellingProducts}
            </h3>
          </div>

          {bestSellers.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">
              No sales data for best-selling items in this period.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {bestSellers.map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-6 h-6 rounded-lg bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold flex items-center justify-center text-xs">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {item.unitsSold} {t.unitsSold}
                      </div>
                    </div>
                  </div>

                  <div className="font-black text-slate-900 dark:text-white">
                    {formatINR(item.totalRevenue)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Period Sales Invoices */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Receipt className="w-4 h-4 text-emerald-500" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Sales Invoices ({filteredInvoices.length})
              </h3>
            </div>
          </div>

          {filteredInvoices.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">
              No invoices found for this time range.
            </p>
          ) : (
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredInvoices.map((inv) => (
                <div
                  key={inv.id}
                  onClick={() => setActiveInvoice(inv)}
                  className="py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl px-1.5 transition"
                >
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                      <span>{inv.invoiceNumber}</span>
                      <span className="text-[10px] text-slate-400">
                        ({inv.customerName || 'Walk-in'})
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {new Date(inv.date).toLocaleDateString('en-IN')} • {inv.items.length} items
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-slate-900 dark:text-white">
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
    </div>
  );
};
