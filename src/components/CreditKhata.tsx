import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CreditCustomer, CreditTransaction } from '../types';
import { formatINR, aggregateCreditStats } from '../utils/posCalculations';
import {
  Users,
  Plus,
  Search,
  Phone,
  MapPin,
  ArrowDownLeft,
  ArrowUpRight,
  Share2,
  Calendar,
  CheckCircle2,
  Wallet,
  IndianRupee,
  FileText,
  X,
  CreditCard,
  Banknote,
  QrCode,
  AlertCircle,
  History,
} from 'lucide-react';

export const CreditKhata: React.FC = () => {
  const {
    creditCustomers,
    creditTransactions,
    addCreditCustomer,
    recordCustomerPayment,
    shopProfile,
    t,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CreditCustomer | null>(null);

  // Add Customer Modal
  const [addCustomerModalOpen, setAddCustomerModalOpen] = useState(false);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custLimit, setCustLimit] = useState<number | ''>('');
  const [custError, setCustError] = useState<string | null>(null);

  // Record Payment Modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<number | ''>('');
  const [payMethod, setPayMethod] = useState<'cash' | 'upi' | 'card'>('cash');
  const [payNotes, setPayNotes] = useState('');
  const [payError, setPayError] = useState<string | null>(null);

  const stats = aggregateCreditStats(creditCustomers, creditTransactions);

  // Filter customers
  const filteredCustomers = creditCustomers.filter((c) => {
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.phone.includes(q);
  });

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    setCustError(null);

    const res = addCreditCustomer({
      name: custName.trim(),
      phone: custPhone.trim(),
      address: custAddress.trim() || undefined,
      creditLimit: custLimit ? Number(custLimit) : undefined,
    });

    if (!res.success) {
      setCustError(res.error || 'Failed to add customer.');
      return;
    }

    setAddCustomerModalOpen(false);
    setCustName('');
    setCustPhone('');
    setCustAddress('');
    setCustLimit('');
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setPayError(null);
    if (!selectedCustomer || payAmount === '' || payAmount <= 0) {
      setPayError('Please enter a valid payment amount.');
      return;
    }

    const res = recordCustomerPayment(
      selectedCustomer.id,
      Number(payAmount),
      payMethod,
      payNotes
    );

    if (!res.success) {
      setPayError(res.error || 'Failed to record payment.');
      return;
    }

    setPaymentModalOpen(false);
    setPayAmount('');
    setPayNotes('');
    // refresh selected customer view
    const updated = creditCustomers.find((c) => c.id === selectedCustomer.id);
    if (updated) setSelectedCustomer(updated);
  };

  const handleSendReminder = (customer: CreditCustomer) => {
    const text = encodeURIComponent(
      `*${shopProfile.name}*\n` +
      `Namaste ${customer.name} ji,\n` +
      `Your outstanding credit (उधार) balance is *₹${customer.totalDue}*.\n` +
      `Please pay at your earliest convenience via Cash or UPI (${shopProfile.upiId || 'shop UPI'}).\n` +
      `Thank you!`
    );
    const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  // Get customer specific transactions
  const customerTxs = selectedCustomer
    ? creditTransactions.filter((t) => t.customerId === selectedCustomer.id)
    : [];

  return (
    <div className="space-y-4 pb-24">
      {/* Top Header & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {t.creditTitle}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Digital Kirana Khata & Customer Udhaar Ledger
          </p>
        </div>

        <button
          onClick={() => {
            setCustError(null);
            setAddCustomerModalOpen(true);
          }}
          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addCustomer}</span>
        </button>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Outstanding Due */}
        <div className="bg-rose-50/70 dark:bg-rose-950/30 rounded-2xl p-4 border border-rose-200 dark:border-rose-800/80 shadow-sm">
          <div className="flex items-center justify-between text-rose-700 dark:text-rose-300 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">{t.totalOutstandingCredit}</span>
            <IndianRupee className="w-4 h-4" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-700 dark:text-rose-400">
            {formatINR(stats.totalOutstandingDue)}
          </div>
          <span className="text-[11px] text-rose-600 dark:text-rose-300 mt-1 block font-medium">
            {stats.customersWithDueCount} {t.customersWithDue}
          </span>
        </div>

        {/* Customers count */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Total Khata Accounts</span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {creditCustomers.length}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Saved shop customers
          </span>
        </div>

        {/* Today's Credit Given */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">{t.todayCreditGiven}</span>
            <ArrowUpRight className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {formatINR(stats.todayCreditGiven)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Udhaar billed today
          </span>
        </div>

        {/* Today's Payment Collected */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">{t.todayCreditCollected}</span>
            <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {formatINR(stats.todayPaymentReceived)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Payment received today
          </span>
        </div>
      </div>

      {/* Main Grid: Customer List on Left, Passbook Detail on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Customer list (col 6/12 on large screens) */}
        <div className="lg:col-span-6 space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customer by name or phone..."
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-white"
            />
          </div>

          {filteredCustomers.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center border border-slate-200 dark:border-slate-800">
              <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-xs text-slate-500">{t.noCreditCustomers}</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredCustomers.map((cust) => {
                const isSelected = selectedCustomer?.id === cust.id;
                const hasDue = cust.totalDue > 0;

                return (
                  <div
                    key={cust.id}
                    onClick={() => setSelectedCustomer(cust)}
                    role="button"
                    tabIndex={0}
                    className={`bg-white dark:bg-slate-900 rounded-2xl p-4 border transition cursor-pointer shadow-xs ${
                      isSelected
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {cust.name}
                        </h4>
                        <div className="flex items-center space-x-1.5 text-xs text-slate-400 mt-0.5">
                          <Phone className="w-3 h-3" />
                          <span>{cust.phone}</span>
                        </div>
                        {cust.address && (
                          <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 mt-0.5">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-[200px]">{cust.address}</span>
                          </div>
                        )}
                      </div>

                      {/* Due Balance */}
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          {t.balanceDue}
                        </span>
                        <div
                          className={`text-base font-black ${
                            hasDue
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {formatINR(cust.totalDue)}
                        </div>
                        {cust.creditLimit && (
                          <span className="text-[10px] text-slate-400 block">
                            Limit: {formatINR(cust.creditLimit)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick actions for this customer */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCustomer(cust);
                            setPayAmount(cust.totalDue > 0 ? cust.totalDue : '');
                            setPayError(null);
                            setPaymentModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-bold text-xs transition"
                        >
                          + {t.recordPaymentIn}
                        </button>

                        {hasDue && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendReminder(cust);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center space-x-1 transition"
                            title="Send WhatsApp payment reminder"
                          >
                            <Share2 className="w-3 h-3 text-emerald-600" />
                            <span>WhatsApp</span>
                          </button>
                        )}
                      </div>

                      <span className="text-[11px] text-slate-400 font-semibold">
                        Passbook →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CUSTOMER PASSBOOK & LEDGER (col 6/12 on large screens) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-4">
          {selectedCustomer ? (
            <>
              <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    {selectedCustomer.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Ph: {selectedCustomer.phone}
                    {selectedCustomer.address ? ` • ${selectedCustomer.address}` : ''}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    Current Udhaar Due
                  </span>
                  <div className="text-xl font-black text-rose-600 dark:text-rose-400">
                    {formatINR(selectedCustomer.totalDue)}
                  </div>
                </div>
              </div>

              {/* Action Buttons for selected customer */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setPayAmount(selectedCustomer.totalDue > 0 ? selectedCustomer.totalDue : '');
                    setPayError(null);
                    setPaymentModalOpen(true);
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition"
                >
                  + {t.recordPaymentIn}
                </button>

                {selectedCustomer.totalDue > 0 && (
                  <button
                    onClick={() => handleSendReminder(selectedCustomer)}
                    className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center space-x-1.5 transition"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{t.sendReminderWhatsApp}</span>
                  </button>
                )}
              </div>

              {/* Transactions list */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                  <History className="w-3.5 h-3.5" />
                  <span>{t.paymentHistory} ({customerTxs.length})</span>
                </div>

                {customerTxs.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">
                    No transactions recorded for this customer yet.
                  </p>
                ) : (
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 -mx-1 px-1 text-xs">
                    {customerTxs.map((tx) => {
                      const isCreditGiven = tx.type === 'CREDIT_GIVEN';

                      return (
                        <div key={tx.id} className="py-2.5 flex items-center justify-between">
                          <div className="flex items-center space-x-2.5">
                            <div
                              className={`p-1.5 rounded-lg ${
                                isCreditGiven
                                  ? 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-300'
                                  : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300'
                              }`}
                            >
                              {isCreditGiven ? (
                                <ArrowUpRight className="w-4 h-4" />
                              ) : (
                                <ArrowDownLeft className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white">
                                {isCreditGiven ? 'Credit Given (उधार)' : 'Payment Received (जमा)'}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {new Date(tx.date).toLocaleDateString('en-IN')}{' '}
                                {new Date(tx.date).toLocaleTimeString('en-IN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                                {tx.notes ? ` • ${tx.notes}` : ''}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div
                              className={`font-black text-xs sm:text-sm ${
                                isCreditGiven
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : 'text-emerald-600 dark:text-emerald-400'
                              }`}
                            >
                              {isCreditGiven ? `+${formatINR(tx.amount)}` : `-${formatINR(tx.amount)}`}
                            </div>
                            <span className="text-[10px] text-slate-400 block">
                              Bal: {formatINR(tx.balanceAfter)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <FileText className="w-10 h-10 mx-auto opacity-40 text-slate-300" />
              <p className="text-xs">
                Select a customer from the left to view ledger passbook and record payments.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ADD CUSTOMER MODAL */}
      {addCustomerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-sm text-slate-900 dark:text-white">
                {t.addCustomer}
              </h3>
              <button
                onClick={() => setAddCustomerModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {custError && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
                {custError}
              </div>
            )}

            <form onSubmit={handleSaveCustomer} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Sharma"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Mobile / Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98290 00000"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-500 block mb-1">Address / Landmark (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Near Shiv Mandir, Ward 4"
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-500 block mb-1">Credit Limit (₹) (Optional)</label>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  value={custLimit}
                  onChange={(e) => setCustLimit(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setAddCustomerModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {paymentModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-sm text-slate-900 dark:text-white">
                {t.recordPaymentIn}
              </h3>
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Customer: <span className="font-bold text-slate-900 dark:text-white">{selectedCustomer.name}</span> • Pending Due: <span className="font-bold text-rose-600">{formatINR(selectedCustomer.totalDue)}</span>
            </p>

            {payError && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
                {payError}
              </div>
            )}

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Amount Received (₹) *</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder={String(selectedCustomer.totalDue)}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white font-black text-sm"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Payment Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayMethod('cash')}
                    className={`py-1.5 px-2 rounded-lg border text-center font-bold text-xs ${
                      payMethod === 'cash'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod('upi')}
                    className={`py-1.5 px-2 rounded-lg border text-center font-bold text-xs ${
                      payMethod === 'upi'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    UPI
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod('card')}
                    className={`py-1.5 px-2 rounded-lg border text-center font-bold text-xs ${
                      payMethod === 'card'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Card
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-500 block mb-1">Notes / Receipt reference</label>
                <input
                  type="text"
                  placeholder="e.g. Paid in cash at counter"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
