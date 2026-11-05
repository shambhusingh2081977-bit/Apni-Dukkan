import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ExpenseCategory, PurchaseItem, UnitType } from '../types';
import { formatINR } from '../utils/posCalculations';
import {
  Wallet,
  Truck,
  Plus,
  Trash2,
  Calendar,
  Building,
  Zap,
  ShoppingBag,
  Users,
  Package,
  Layers,
  CheckCircle,
  X,
  FileText,
} from 'lucide-react';

export const PurchasesAndExpenses: React.FC = () => {
  const {
    expenses,
    addExpense,
    deleteExpense,
    purchases,
    addPurchase,
    products,
    t,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'expenses' | 'purchases'>('expenses');

  // Expense Modal State
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expTitle, setExpTitle] = useState('');
  const [expCategory, setExpCategory] = useState<ExpenseCategory>('miscellaneous');
  const [expAmount, setExpAmount] = useState<number | ''>('');
  const [expDate, setExpDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expNotes, setExpNotes] = useState('');

  // Purchase Modal State
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [purSupplierName, setPurSupplierName] = useState('');
  const [purSupplierPhone, setPurSupplierPhone] = useState('');
  const [purInvoiceNo, setPurInvoiceNo] = useState('');
  const [purDate, setPurDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [purNotes, setPurNotes] = useState('');
  const [purchaseItems, setPurchaseItems] = useState<
    Array<{
      productId: string;
      quantity: number;
      purchasePrice: number;
    }>
  >([]);

  // Category Icon & Color map
  const categoryMeta: Record<ExpenseCategory, { label: string; icon: any; color: string }> = {
    rent: { label: t.exp_rent, icon: Building, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/60' },
    electricity: { label: t.exp_electricity, icon: Zap, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/60' },
    transport: { label: t.exp_transport, icon: Truck, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60' },
    salary: { label: t.exp_salary, icon: Users, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/60' },
    packaging: { label: t.exp_packaging, icon: Package, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/60' },
    miscellaneous: { label: t.exp_miscellaneous, icon: Wallet, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/60' },
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle.trim() || expAmount === '' || expAmount <= 0) return;

    addExpense({
      title: expTitle.trim(),
      category: expCategory,
      amount: Number(expAmount),
      date: expDate,
      notes: expNotes.trim() || undefined,
    });

    setExpenseModalOpen(false);
    setExpTitle('');
    setExpAmount('');
    setExpNotes('');
  };

  const handleOpenPurchaseModal = () => {
    setPurSupplierName('');
    setPurSupplierPhone('');
    setPurInvoiceNo(`PUR-${Date.now().toString().slice(-6)}`);
    setPurNotes('');
    if (products.length > 0) {
      setPurchaseItems([
        {
          productId: products[0].id,
          quantity: 10,
          purchasePrice: products[0].purchasePrice,
        },
      ]);
    } else {
      setPurchaseItems([]);
    }
    setPurchaseModalOpen(true);
  };

  const handleSavePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!purSupplierName.trim() || purchaseItems.length === 0) return;

    const items: PurchaseItem[] = purchaseItems.map((item) => {
      const prod = products.find((p) => p.id === item.productId);
      return {
        productId: item.productId,
        productName: prod ? prod.name : 'Unknown Product',
        quantity: item.quantity,
        unit: prod ? prod.unit : 'pcs',
        purchasePrice: item.purchasePrice,
        total: item.quantity * item.purchasePrice,
      };
    });

    const totalAmount = items.reduce((sum, it) => sum + it.total, 0);

    addPurchase({
      purchaseInvoiceNo: purInvoiceNo,
      supplierName: purSupplierName.trim(),
      supplierPhone: purSupplierPhone.trim() || undefined,
      date: purDate,
      items,
      totalAmount,
      paymentStatus: 'paid',
      notes: purNotes.trim() || undefined,
    });

    setPurchaseModalOpen(false);
  };

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalPurchaseAmount = purchases.reduce((sum, p) => sum + p.totalAmount, 0);

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {t.purchasesAndExpenses}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track daily operating shop costs and wholesale stock entries
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'expenses'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {t.tabExpenses} ({expenses.length})
          </button>
          <button
            onClick={() => setActiveTab('purchases')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'purchases'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {t.tabPurchases} ({purchases.length})
          </button>
        </div>
      </div>

      {/* EXPENSES TAB CONTENT */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          {/* Summary Card + Add Button */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Total Expenses Recorded
              </span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                {formatINR(totalExpenseAmount)}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Deducted from gross profit to compute net profit
              </p>
            </div>

            <button
              onClick={() => setExpenseModalOpen(true)}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 active:scale-95 transition self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addExpense}</span>
            </button>
          </div>

          {/* Expenses List */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3">
              Expense Records ({expenses.length})
            </h3>

            {expenses.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No expense entries yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {expenses.map((exp) => {
                  const meta = categoryMeta[exp.category] || categoryMeta.miscellaneous;
                  const Icon = meta.icon;

                  return (
                    <div key={exp.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2.5 rounded-xl ${meta.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                            {exp.title}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center space-x-2">
                            <span>{new Date(exp.date).toLocaleDateString('en-IN')}</span>
                            <span>•</span>
                            <span className="capitalize">{meta.label}</span>
                            {exp.notes && (
                              <>
                                <span>•</span>
                                <span className="truncate max-w-[150px]">{exp.notes}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="font-black text-xs sm:text-sm text-rose-600 dark:text-rose-400 text-right">
                          -{formatINR(exp.amount)}
                        </div>
                        <button
                          onClick={() => deleteExpense(exp.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 transition"
                          title="Delete expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PURCHASES TAB CONTENT */}
      {activeTab === 'purchases' && (
        <div className="space-y-4">
          {/* Summary Card + Add Purchase */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Total Stock Purchases
              </span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                {formatINR(totalPurchaseAmount)}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Automatically increments inventory quantity on entry
              </p>
            </div>

            <button
              onClick={handleOpenPurchaseModal}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>{t.recordPurchase}</span>
            </button>
          </div>

          {/* Purchases List */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3">
              Purchase Ledger ({purchases.length})
            </h3>

            {purchases.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No vendor purchases recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {purchases.map((pur) => (
                  <div key={pur.id} className="py-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                            {pur.supplierName}
                          </span>
                          <span className="font-mono text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">
                            #{pur.purchaseInvoiceNo}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {new Date(pur.date).toLocaleDateString('en-IN')}
                          {pur.supplierPhone ? ` • ${pur.supplierPhone}` : ''}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                          {formatINR(pur.totalAmount)}
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded uppercase">
                          {pur.paymentStatus}
                        </span>
                      </div>
                    </div>

                    {/* Purchased items chips */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {pur.items.map((it, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-0.5 text-slate-600 dark:text-slate-300"
                        >
                          {it.productName}: <b>+{it.quantity} {it.unit}</b> @ {formatINR(it.purchasePrice)}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADD EXPENSE MODAL */}
      {expenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-sm text-slate-900 dark:text-white">
                {t.addExpense}
              </h3>
              <button
                onClick={() => setExpenseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">{t.expenseTitle} *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shop boy daily tea, electricity bill"
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">{t.expenseCategory}</label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value as ExpenseCategory)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                  >
                    <option value="rent">{t.exp_rent}</option>
                    <option value="electricity">{t.exp_electricity}</option>
                    <option value="transport">{t.exp_transport}</option>
                    <option value="salary">{t.exp_salary}</option>
                    <option value="packaging">{t.exp_packaging}</option>
                    <option value="miscellaneous">{t.exp_miscellaneous}</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold block mb-1">{t.expenseAmount} *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 250"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">{t.expenseDate}</label>
                <input
                  type="date"
                  value={expDate}
                  onChange={(e) => setExpDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-500 block mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="Receipt note or details"
                  value={expNotes}
                  onChange={(e) => setExpNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setExpenseModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-purple-600 text-white font-bold"
                >
                  {t.saveExpense}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD PURCHASE MODAL */}
      {purchaseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                {t.recordPurchase}
              </h3>
              <button
                onClick={() => setPurchaseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePurchase} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">{t.supplierName} *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Khandelwal Wholesale Agency"
                    value={purSupplierName}
                    onChange={(e) => setPurSupplierName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">Invoice / Bill #</label>
                  <input
                    type="text"
                    value={purInvoiceNo}
                    onChange={(e) => setPurInvoiceNo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Purchase items list */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    Products to Restock
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (products.length > 0) {
                        setPurchaseItems((prev) => [
                          ...prev,
                          {
                            productId: products[0].id,
                            quantity: 10,
                            purchasePrice: products[0].purchasePrice,
                          },
                        ]);
                      }
                    }}
                    className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                  >
                    + Add Another Product
                  </button>
                </div>

                {purchaseItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <select
                        value={item.productId}
                        onChange={(e) => {
                          const pid = e.target.value;
                          const found = products.find((p) => p.id === pid);
                          setPurchaseItems((prev) =>
                            prev.map((it, i) =>
                              i === idx
                                ? {
                                    ...it,
                                    productId: pid,
                                    purchasePrice: found ? found.purchasePrice : it.purchasePrice,
                                  }
                                : it
                            )
                          );
                        }}
                        className="flex-1 px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white font-medium"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.quantity} in stock)
                          </option>
                        ))}
                      </select>

                      {purchaseItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setPurchaseItems((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-rose-500 p-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block">Quantity to add</label>
                        <input
                          type="number"
                          step="any"
                          required
                          value={item.quantity}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setPurchaseItems((prev) =>
                              prev.map((it, i) => (i === idx ? { ...it, quantity: val } : it))
                            );
                          }}
                          className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white font-bold"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-500 block">Purchase Cost per unit (₹)</label>
                        <input
                          type="number"
                          step="any"
                          required
                          value={item.purchasePrice}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setPurchaseItems((prev) =>
                              prev.map((it, i) => (i === idx ? { ...it, purchasePrice: val } : it))
                            );
                          }}
                          className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white font-bold"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setPurchaseModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20"
                >
                  Record & Update Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
