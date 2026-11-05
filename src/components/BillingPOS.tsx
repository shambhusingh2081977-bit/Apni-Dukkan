import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Product, ProductCategory, PaymentMethod } from '../types';
import { calculateCartTotals, formatINR } from '../utils/posCalculations';
import { UpiQrCode } from './UpiQrCode';
import { createUpiPaymentUri } from '../utils/barcodeSvg';
import {
  Search,
  ScanBarcode,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  QrCode,
  CreditCard,
  Banknote,
  User,
  Phone,
  Percent,
  Receipt,
  RotateCcw,
  Sparkles,
  ShoppingBag,
  Users,
} from 'lucide-react';

export const BillingPOS: React.FC = () => {
  const {
    products,
    cart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartDiscountPercent,
    setCartDiscountPercent,
    cartTaxPercent,
    setCartTaxPercent,
    isGstBill,
    setIsGstBill,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    completeBill,
    setScannerOpen,
    shopProfile,
    t,
  } = useApp();

  // Search & category filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashTendered, setCashTendered] = useState<number | ''>('');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  // Hardware USB/Bluetooth scanner buffer listener
  const barcodeBufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing inside an explicit input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      const now = Date.now();
      if (now - lastKeyTimeRef.current > 100) {
        barcodeBufferRef.current = '';
      }
      lastKeyTimeRef.current = now;

      if (e.key === 'Enter') {
        const scannedCode = barcodeBufferRef.current.trim();
        if (scannedCode.length >= 3) {
          const match = products.find(
            (p) => p.barcode.trim().toLowerCase() === scannedCode.toLowerCase()
          );
          if (match) {
            const res = addToCart(match);
            if (!res.success) {
              setCheckoutError(res.error || 'Cannot add product');
            }
          }
        }
        barcodeBufferRef.current = '';
      } else if (e.key.length === 1) {
        barcodeBufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products, addToCart]);

  // Categories list
  const categories = [
    'All',
    'Grocery & Staples',
    'Snacks & Beverages',
    'Personal Care',
    'Dairy & Bakery',
    'Household & Cleaning',
    'General',
  ];

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.nameHindi && p.nameHindi.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.barcode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Calculate totals
  const effectiveTaxPercent = isGstBill ? cartTaxPercent : 0;
  const totals = calculateCartTotals(cart, cartDiscountPercent, effectiveTaxPercent);

  // Change calculation for cash payment
  const numericTendered = typeof cashTendered === 'number' ? cashTendered : 0;
  const changeDue = Math.max(0, Math.round((numericTendered - totals.grandTotal) * 100) / 100);

  const [creditPaidNow, setCreditPaidNow] = useState<number | ''>('');
  const { creditCustomers } = useApp();

  const handleCompleteSale = () => {
    setCheckoutError(null);
    if (cart.length === 0) {
      setCheckoutError(t.cartEmpty);
      return;
    }

    if (paymentMethod === 'cash' && numericTendered > 0 && numericTendered < totals.grandTotal) {
      setCheckoutError('Cash tendered is less than Grand Total!');
      return;
    }

    if (paymentMethod === 'credit') {
      if (!customerName.trim() || !customerPhone.trim()) {
        setCheckoutError(t.customerRequiredForCredit);
        return;
      }
    }

    const result = completeBill(
      paymentMethod,
      numericTendered > 0 ? numericTendered : totals.grandTotal,
      undefined,
      paymentMethod === 'credit' ? { amountPaidNow: Number(creditPaidNow) || 0 } : undefined
    );

    if (!result.success) {
      setCheckoutError(result.error || 'Failed to complete transaction.');
    } else {
      setCartDrawerOpen(false);
      setCashTendered('');
      setCreditPaidNow('');
    }
  };

  const quickTenderValues = [
    Math.ceil(totals.grandTotal),
    Math.ceil(totals.grandTotal / 50) * 50 || 50,
    Math.ceil(totals.grandTotal / 100) * 100 || 100,
    500,
  ].filter((v, i, arr) => arr.indexOf(v) === i && v >= totals.grandTotal);

  return (
    <div className="pb-24">
      {/* Header with Search and Barcode Button */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {t.posTitle}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select products or scan barcodes to bill
            </p>
          </div>

          {/* Mobile Cart Trigger Badge Button */}
          <button
            onClick={() => setCartDrawerOpen(true)}
            className="lg:hidden flex items-center space-x-2 px-3 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{cart.length} {t.itemCount}</span>
            <span className="bg-white/20 px-1.5 py-0.5 rounded text-[11px]">
              {formatINR(totals.grandTotal)}
            </span>
          </button>
        </div>

        {/* Search Bar + Barcode Scanner Trigger */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchProductPlaceholder}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={() => setScannerOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-bold text-xs transition shadow-sm shrink-0 active:scale-95"
            title="Scan product barcode with camera"
          >
            <ScanBarcode className="w-4 h-4" />
            <span className="hidden sm:inline">Camera Scan</span>
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full whitespace-nowrap font-semibold transition shrink-0 ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {cat === 'All' ? t.allCategories : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Products on Left, Cart on Right (Responsive) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* PRODUCTS CATALOG GRID (Left col 7/12) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Catalog ({filteredProducts.length} items)
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center border border-slate-200 dark:border-slate-800">
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                No products found matching &quot;{searchQuery}&quot;
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
              {filteredProducts.map((prod) => {
                const inCart = cart.find((c) => c.product.id === prod.id);
                const isOutOfStock = prod.quantity <= 0;
                const isLowStock = prod.quantity <= prod.lowStockThreshold && !isOutOfStock;

                return (
                  <div
                    key={prod.id}
                    onClick={() => {
                      if (!isOutOfStock) {
                        const res = addToCart(prod);
                        if (!res.success) setCheckoutError(res.error || null);
                        else setCheckoutError(null);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className={`relative text-left bg-white dark:bg-slate-900 rounded-xl p-3 border transition flex flex-col justify-between shadow-sm cursor-pointer select-none active:scale-[0.98] ${
                      inCart
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-emerald-400'
                    } ${isOutOfStock ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {/* Top details */}
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate">
                          #{prod.barcode.slice(-4)}
                        </span>
                        {isOutOfStock ? (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded">
                            {t.outOfStock}
                          </span>
                        ) : isLowStock ? (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded">
                            {prod.quantity} {prod.unit}
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                            {prod.quantity} {prod.unit}
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-2 leading-tight">
                        {prod.name}
                      </h4>
                      {prod.nameHindi && (
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                          {prod.nameHindi}
                        </p>
                      )}
                    </div>

                    {/* Bottom Price & Add Indicator */}
                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                      <div className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                        {formatINR(prod.sellingPrice)}
                        <span className="text-[10px] font-normal text-slate-400 ml-0.5">
                          /{prod.unit}
                        </span>
                      </div>

                      {inCart ? (
                        <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                          {inCart.quantity}
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition">
                          <Plus className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CART & POS CHECKOUT PANEL (Right col 5/12 on desktop, or slide-over drawer on mobile) */}
        <div
          className={`lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-5 flex flex-col space-y-4 lg:sticky lg:top-20 ${
            cartDrawerOpen
              ? 'fixed inset-x-2 bottom-20 z-40 max-h-[85vh] overflow-y-auto ring-4 ring-slate-900/10 dark:ring-white/10'
              : 'hidden lg:flex'
          }`}
        >
          {/* Cart Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-black text-base text-slate-900 dark:text-white">
                {t.cart} ({cart.length})
              </h3>
            </div>

            <div className="flex items-center space-x-2">
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-rose-500 hover:text-rose-600 flex items-center space-x-1 font-semibold"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{t.clearCart}</span>
                </button>
              )}
              {cartDrawerOpen && (
                <button
                  onClick={() => setCartDrawerOpen(false)}
                  className="lg:hidden text-xs text-slate-400 p-1"
                >
                  ✕ Close
                </button>
              )}
            </div>
          </div>

          {/* Checkout Error Message */}
          {checkoutError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{checkoutError}</span>
            </div>
          )}

          {/* Cart Items List */}
          {cart.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs">
              <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>{t.cartEmpty}</p>
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 -mx-1 px-1">
              {cart.map((item) => (
                <div key={item.product.id} className="py-2.5 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                      {item.product.name}
                    </h5>
                    <div className="text-[11px] text-slate-400">
                      {formatINR(item.product.sellingPrice)} × {item.quantity} {item.product.unit}
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center space-x-2 shrink-0">
                    <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-800">
                      <button
                        onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2 font-bold text-xs text-slate-900 dark:text-white min-w-[24px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => {
                          if (item.quantity < item.product.quantity) {
                            updateCartQuantity(item.product.id, item.quantity + 1);
                          } else {
                            setCheckoutError(`Cannot exceed available stock (${item.product.quantity} ${item.product.unit})`);
                          }
                        }}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white w-16 text-right">
                      {formatINR(item.product.sellingPrice * item.quantity)}
                    </div>

                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-1 text-slate-400 hover:text-rose-500"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Customer Details (Optional) */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <User className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Customer Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full pl-8 pr-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs dark:text-white"
                />
              </div>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full pl-8 pr-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Discount & GST Controls */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">{t.discountPercent}</span>
              <div className="flex items-center space-x-1 w-24">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={cartDiscountPercent || ''}
                  onChange={(e) => setCartDiscountPercent(Number(e.target.value))}
                  placeholder="0"
                  className="w-full text-right px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs dark:text-white font-bold"
                />
                <span className="text-slate-400">%</span>
              </div>
            </div>

            {/* GST Invoice Toggle */}
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-1.5 cursor-pointer text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={isGstBill}
                  onChange={(e) => setIsGstBill(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-medium">{t.isGstInvoice}</span>
              </label>

              {isGstBill && (
                <select
                  value={cartTaxPercent}
                  onChange={(e) => setCartTaxPercent(Number(e.target.value))}
                  className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs dark:text-white font-bold"
                >
                  <option value={5}>5% GST</option>
                  <option value={12}>12% GST</option>
                  <option value={18}>18% GST</option>
                  <option value={28}>28% GST</option>
                </select>
              )}
            </div>
          </div>

          {/* Bill Totals Summary */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>{t.subtotal}</span>
              <span>{formatINR(totals.subtotal)}</span>
            </div>
            {totals.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>{t.discount} ({cartDiscountPercent}%)</span>
                <span>-{formatINR(totals.discountAmount)}</span>
              </div>
            )}
            {isGstBill && totals.taxAmount > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>{t.tax} ({cartTaxPercent}%)</span>
                <span>+{formatINR(totals.taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-sm sm:text-base font-black text-slate-900 dark:text-white pt-1 border-t border-slate-100 dark:border-slate-800">
              <span>{t.grandTotal}</span>
              <span className="text-emerald-600 dark:text-emerald-400 text-lg sm:text-xl font-black">
                {formatINR(totals.grandTotal)}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {t.paymentMethod}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`py-2 px-2 rounded-xl border flex flex-col items-center space-y-1 transition text-xs font-bold ${
                  paymentMethod === 'cash'
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>{t.payCash}</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                className={`py-2 px-2 rounded-xl border flex flex-col items-center space-y-1 transition text-xs font-bold ${
                  paymentMethod === 'upi'
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>{t.payUPI}</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`py-2 px-2 rounded-xl border flex flex-col items-center space-y-1 transition text-xs font-bold ${
                  paymentMethod === 'card'
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>{t.payCard}</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('credit')}
                className={`py-2 px-2 rounded-xl border flex flex-col items-center space-y-1 transition text-xs font-bold ${
                  paymentMethod === 'credit'
                    ? 'bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-200 border-rose-500 ring-2 ring-rose-500/20'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>{t.payCredit}</span>
              </button>
            </div>

            {/* CASH TENDER & CHANGE CALCULATOR */}
            {paymentMethod === 'cash' && cart.length > 0 && (
              <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                    {t.cashTendered}:
                  </span>
                  <input
                    type="number"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value ? Number(e.target.value) : '')}
                    placeholder={String(totals.grandTotal)}
                    className="w-28 text-right px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-black dark:text-white"
                  />
                </div>

                {/* Quick denomination chips */}
                <div className="flex items-center space-x-1.5 overflow-x-auto text-[11px]">
                  {quickTenderValues.map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setCashTendered(val)}
                      className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:border-emerald-500 shrink-0"
                    >
                      ₹{val}
                    </button>
                  ))}
                </div>

                {numericTendered > 0 && (
                  <div className="flex justify-between items-center text-xs font-bold pt-1 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500">{t.changeDue}:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm">
                      {formatINR(changeDue)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* CREDIT (UDHAAR / KHATA) DETAILS & CUSTOMER PICKER */}
            {paymentMethod === 'credit' && cart.length > 0 && (
              <div className="bg-rose-50/60 dark:bg-rose-950/30 p-3 rounded-xl border border-rose-200 dark:border-rose-900/60 space-y-2.5 text-xs">
                {/* Quick pick from saved Khata customers */}
                {creditCustomers.length > 0 && (
                  <div>
                    <label className="text-[11px] font-bold text-rose-900 dark:text-rose-200 block mb-1">
                      Quick Select Khata Customer:
                    </label>
                    <select
                      value=""
                      onChange={(e) => {
                        const found = creditCustomers.find((c) => c.id === e.target.value);
                        if (found) {
                          setCustomerName(found.name);
                          setCustomerPhone(found.phone);
                        }
                      }}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 rounded-lg dark:text-white font-medium text-xs"
                    >
                      <option value="">-- Choose from existing Khata ({creditCustomers.length}) --</option>
                      {creditCustomers.map((cust) => (
                        <option key={cust.id} value={cust.id}>
                          {cust.name} ({cust.phone}) • Due: ₹{cust.totalDue}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Partial payment now */}
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {t.amountPaidNow} (Optional):
                  </span>
                  <input
                    type="number"
                    step="any"
                    value={creditPaidNow}
                    onChange={(e) => setCreditPaidNow(e.target.value ? Number(e.target.value) : '')}
                    placeholder="0"
                    className="w-28 text-right px-2 py-1 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 rounded-lg font-bold dark:text-white"
                  />
                </div>

                <div className="flex justify-between items-center pt-1 border-t border-rose-200/80 dark:border-rose-900/60 font-bold">
                  <span className="text-rose-800 dark:text-rose-300">{t.amountDueKhata}:</span>
                  <span className="text-rose-700 dark:text-rose-400 font-black text-sm">
                    {formatINR(Math.max(0, totals.grandTotal - (Number(creditPaidNow) || 0)))}
                  </span>
                </div>
              </div>
            )}

            {/* UPI QR CODE FOR INSTANT SCANNING */}
            {paymentMethod === 'upi' && cart.length > 0 && (
              <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-center space-y-2">
                <p className="text-xs text-slate-500">Scan QR with Google Pay, PhonePe, Paytm</p>
                <div className="flex justify-center">
                  <UpiQrCode
                    value={createUpiPaymentUri(
                      shopProfile.upiId,
                      shopProfile.name,
                      totals.grandTotal,
                      'POS'
                    )}
                    size={140}
                  />
                </div>
                <div className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
                  UPI ID: {shopProfile.upiId}
                </div>
              </div>
            )}
          </div>

          {/* COMPLETE BILL PRIMARY ACTION BUTTON */}
          <button
            onClick={handleCompleteSale}
            disabled={cart.length === 0}
            className={`w-full py-3.5 px-4 rounded-xl font-black text-sm flex items-center justify-center space-x-2 text-white shadow-lg transition active:scale-95 ${
              cart.length === 0
                ? 'bg-slate-300 dark:bg-slate-800 cursor-not-allowed text-slate-500'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/25'
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{t.completeBill} • {formatINR(totals.grandTotal)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
