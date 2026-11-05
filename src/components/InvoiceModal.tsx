import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatINR } from '../utils/posCalculations';
import { renderBarcodeSvg } from '../utils/barcodeSvg';
import {
  Printer,
  Download,
  Share2,
  X,
  CheckCircle,
  FileSpreadsheet,
  Receipt,
  Check,
} from 'lucide-react';

export const InvoiceModal: React.FC = () => {
  const { activeInvoice, setActiveInvoice, shopProfile, t, setActiveTab } = useApp();
  const [thermalWidth, setThermalWidth] = useState<'58mm' | '80mm' | 'a4'>(
    shopProfile.thermalWidth || '80mm'
  );
  const [copiedShare, setCopiedShare] = useState(false);

  if (!activeInvoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const creditBreakdown = activeInvoice.paymentMethod === 'credit'
      ? `\nPayment Mode: CREDIT (उधार)\nPaid Now: ₹${activeInvoice.creditAmountPaid || 0}\nDue in Khata: ₹${activeInvoice.creditBalanceDue || 0}`
      : `\nPayment: ${activeInvoice.paymentMethod.toUpperCase()}`;

    const text = encodeURIComponent(
      `*${shopProfile.name}*\n` +
      `Bill #${activeInvoice.invoiceNumber}\n` +
      `Date: ${new Date(activeInvoice.date).toLocaleDateString('en-IN')}\n` +
      `Total Amount: ₹${activeInvoice.grandTotal}` +
      creditBreakdown + `\n` +
      `Items: ${activeInvoice.items.length}\n` +
      `Thank you for shopping with us!`
    );
    const phone = activeInvoice.customerPhone ? activeInvoice.customerPhone.replace(/[^0-9]/g, '') : '';
    const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  const handleCopySummary = () => {
    const creditPart = activeInvoice.paymentMethod === 'credit'
      ? ` [Credit: Paid ₹${activeInvoice.creditAmountPaid || 0}, Due ₹${activeInvoice.creditBalanceDue || 0}]`
      : ` [Paid via ${activeInvoice.paymentMethod.toUpperCase()}]`;
    const text =
      `${shopProfile.name} - Bill #${activeInvoice.invoiceNumber}\n` +
      `Total: ₹${activeInvoice.grandTotal}${creditPart}`;
    navigator.clipboard?.writeText(text);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Top Header & Printer Format Switcher */}
        <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                {t.invoice}
              </h3>
              <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                {activeInvoice.invoiceNumber}
              </p>
            </div>
          </div>

          {/* Width toggles */}
          <div className="flex items-center space-x-1 bg-slate-200 dark:bg-slate-700 p-0.5 rounded-lg text-[11px] font-bold">
            <button
              onClick={() => setThermalWidth('58mm')}
              className={`px-2 py-1 rounded-md transition ${
                thermalWidth === '58mm'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              58mm
            </button>
            <button
              onClick={() => setThermalWidth('80mm')}
              className={`px-2 py-1 rounded-md transition ${
                thermalWidth === '80mm'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              80mm
            </button>
            <button
              onClick={() => setThermalWidth('a4')}
              className={`px-2 py-1 rounded-md transition ${
                thermalWidth === 'a4'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              GST A4
            </button>
          </div>

          <button
            onClick={() => setActiveInvoice(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* RECEIPT / INVOICE PREVIEW CONTAINER */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-100 dark:bg-slate-950 flex justify-center">
          <div
            id="thermal-receipt-print-area"
            className={`bg-white text-black p-4 font-mono shadow-md border border-slate-200 transition-all ${
              thermalWidth === '58mm'
                ? 'w-[280px] text-[11px]'
                : thermalWidth === '80mm'
                ? 'w-[360px] text-xs'
                : 'w-full text-xs'
            }`}
          >
            {/* Shop Header */}
            <div className="text-center pb-3 border-b border-dashed border-black">
              <h2 className="text-base font-black tracking-tight uppercase">
                {shopProfile.name}
              </h2>
              {shopProfile.tagline && (
                <p className="text-[10px] text-slate-600">{shopProfile.tagline}</p>
              )}
              {shopProfile.address && (
                <p className="text-[10px] mt-0.5">{shopProfile.address}</p>
              )}
              {shopProfile.phone && (
                <p className="text-[10px]">Ph: {shopProfile.phone}</p>
              )}
              {shopProfile.gstNumber && (
                <p className="text-[10px] font-bold">GSTIN: {shopProfile.gstNumber}</p>
              )}
            </div>

            {/* Bill Meta */}
            <div className="py-2 border-b border-dashed border-black text-[11px] space-y-0.5">
              <div className="flex justify-between">
                <span>INVOICE:</span>
                <span className="font-bold">{activeInvoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>DATE:</span>
                <span>
                  {new Date(activeInvoice.date).toLocaleDateString('en-IN')}{' '}
                  {new Date(activeInvoice.date).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              {activeInvoice.customerName && (
                <div className="flex justify-between">
                  <span>CUSTOMER:</span>
                  <span className="font-bold">{activeInvoice.customerName}</span>
                </div>
              )}
              {activeInvoice.customerPhone && (
                <div className="flex justify-between">
                  <span>PHONE:</span>
                  <span>{activeInvoice.customerPhone}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>MODE:</span>
                <span className="font-bold uppercase">{activeInvoice.paymentMethod}</span>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="py-2 border-b border-dashed border-black">
              <div className="flex justify-between font-bold pb-1 text-[11px] border-b border-black">
                <span className="flex-1">ITEM</span>
                <span className="w-12 text-center">QTY</span>
                <span className="w-14 text-right">RATE</span>
                <span className="w-16 text-right">TOTAL</span>
              </div>

              <div className="divide-y divide-dotted divide-slate-300 py-1">
                {activeInvoice.items.map((item, idx) => (
                  <div key={idx} className="py-1 flex justify-between items-start text-[11px]">
                    <div className="flex-1 pr-1 truncate font-sans">
                      {item.productName}
                    </div>
                    <div className="w-12 text-center">
                      {item.quantity} {item.unit}
                    </div>
                    <div className="w-14 text-right">
                      {formatINR(item.sellingPrice, false)}
                    </div>
                    <div className="w-16 text-right font-bold">
                      {formatINR(item.itemTotal, false)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary calculations */}
            <div className="py-2 border-b border-dashed border-black space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Subtotal ({activeInvoice.items.length} items):</span>
                <span>{formatINR(activeInvoice.subtotal)}</span>
              </div>
              {activeInvoice.discountAmount > 0 && (
                <div className="flex justify-between font-bold">
                  <span>Discount ({activeInvoice.discountPercent}%):</span>
                  <span>-{formatINR(activeInvoice.discountAmount)}</span>
                </div>
              )}
              {activeInvoice.isGstBill && activeInvoice.taxAmount > 0 && (
                <>
                  <div className="flex justify-between">
                    <span>CGST ({activeInvoice.taxPercent / 2}%):</span>
                    <span>{formatINR(activeInvoice.taxAmount / 2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SGST ({activeInvoice.taxPercent / 2}%):</span>
                    <span>{formatINR(activeInvoice.taxAmount / 2)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between font-black text-sm pt-1 border-t border-black">
                <span>GRAND TOTAL:</span>
                <span>{formatINR(activeInvoice.grandTotal)}</span>
              </div>

              {activeInvoice.paymentMethod === 'cash' && activeInvoice.cashTendered && (
                <div className="pt-1 text-[10px] text-slate-700">
                  <div className="flex justify-between">
                    <span>Cash Tendered:</span>
                    <span>{formatINR(activeInvoice.cashTendered)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Change Returned:</span>
                    <span>{formatINR(activeInvoice.changeDue || 0)}</span>
                  </div>
                </div>
              )}

              {activeInvoice.paymentMethod === 'credit' && (
                <div className="pt-1.5 pb-1 text-[10px] border-t border-slate-300 mt-1">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>PAYMENT TYPE:</span>
                    <span>CREDIT (उधार)</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Amount Paid Now:</span>
                    <span>{formatINR(activeInvoice.creditAmountPaid || 0)}</span>
                  </div>
                  <div className="flex justify-between font-black text-amber-900">
                    <span>Balance Added to Khata:</span>
                    <span>{formatINR(activeInvoice.creditBalanceDue || 0)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Barcode & Footer */}
            <div className="text-center pt-3 space-y-1.5">
              <div
                className="w-44 h-8 mx-auto flex items-center justify-center"
                dangerouslySetInnerHTML={{
                  __html: renderBarcodeSvg(activeInvoice.invoiceNumber, 32),
                }}
              />
              <p className="text-[10px] font-bold tracking-widest">
                {activeInvoice.invoiceNumber}
              </p>
              <p className="text-[10px] font-sans font-medium text-slate-700">
                {t.thankYouMessage}
              </p>
              {shopProfile.upiId && (
                <p className="text-[9px] text-slate-500">Pay via UPI: {shopProfile.upiId}</p>
              )}
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>{t.printBill}</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handleCopySummary}
              className="px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-200"
              title="Copy bill details"
            >
              {copiedShare ? <Check className="w-4 h-4 text-emerald-500" /> : <Download className="w-4 h-4" />}
            </button>
          </div>

          <button
            onClick={() => {
              setActiveInvoice(null);
              setActiveTab('billing');
            }}
            className="px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs hover:bg-emerald-100"
          >
            + Next Bill
          </button>
        </div>
      </div>
    </div>
  );
};
