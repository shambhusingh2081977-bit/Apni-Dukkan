import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  CartItem,
  Invoice,
  Expense,
  PurchaseRecord,
  StockMovement,
  ShopProfile,
  CreditCustomer,
  CreditTransaction,
  PaymentMethod,
} from '../types';
import {
  initialProducts,
  initialExpenses,
  initialInvoices,
  initialPurchases,
  initialShopProfile,
  initialCreditCustomers,
  initialCreditTransactions,
} from '../utils/seedData';
import {
  calculateCartTotals,
  generateInvoiceNumber,
  validateStockAvailability,
} from '../utils/posCalculations';
import {
  triggerLowStockBrowserAlert,
  triggerTestNotification,
  requestNotificationPermission,
  getNotificationPermission,
} from '../utils/notifications';
import { translations, Language } from '../utils/translations';
import {
  createDatabaseExportPayload,
  generateDatabaseFileName,
  downloadDatabaseJson,
  validateDatabaseImport,
  DatabasePayload,
  DatabaseMetadata,
  ImportValidationResult,
} from '../utils/databasePortability';

interface AppContextType {
  // Shop profile & localization
  shopProfile: ShopProfile;
  updateShopProfile: (updates: Partial<ShopProfile>) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations['en'];
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  // Security Lock
  isLocked: boolean;
  unlockWithPin: (pin: string) => boolean;
  lockApp: () => void;

  // Inventory / Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => { success: boolean; error?: string };
  updateProduct: (id: string, updates: Partial<Product>) => { success: boolean; error?: string };
  deleteProduct: (id: string) => void;
  adjustStock: (id: string, changeQty: number, reason: string) => void;
  stockMovements: StockMovement[];

  // POS / Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => { success: boolean; error?: string };
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartDiscountPercent: number;
  setCartDiscountPercent: (val: number) => void;
  cartTaxPercent: number;
  setCartTaxPercent: (val: number) => void;
  isGstBill: boolean;
  setIsGstBill: (val: boolean) => void;
  customerName: string;
  setCustomerName: (val: string) => void;
  customerPhone: string;
  setCustomerPhone: (val: string) => void;
  completeBill: (
    paymentMethod: PaymentMethod,
    cashTendered?: number,
    notes?: string,
    creditDetails?: { amountPaidNow: number }
  ) => { success: boolean; invoice?: Invoice; error?: string };

  // Sales / Invoices
  invoices: Invoice[];
  activeInvoice: Invoice | null;
  setActiveInvoice: (inv: Invoice | null) => void;

  // Credit / Khata System
  creditCustomers: CreditCustomer[];
  creditTransactions: CreditTransaction[];
  addCreditCustomer: (customer: Omit<CreditCustomer, 'id' | 'createdAt' | 'updatedAt' | 'totalDue'>) => { success: boolean; customer?: CreditCustomer; error?: string };
  recordCustomerPayment: (customerId: string, amount: number, paymentMethod: 'cash' | 'upi' | 'card', notes?: string) => { success: boolean; error?: string };

  // Low-Stock Notifications & Alerts
  lowStockToast: { productName: string; quantity: number; unit: string; threshold?: number } | null;
  setLowStockToast: (toast: { productName: string; quantity: number; unit: string; threshold?: number } | null) => void;
  dismissLowStockToast: () => void;
  requestBrowserNotificationPermission: () => Promise<NotificationPermission>;
  testBrowserAlert: () => boolean;

  // Expenses
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  deleteExpense: (id: string) => void;

  // Purchases
  purchases: PurchaseRecord[];
  addPurchase: (purchase: Omit<PurchaseRecord, 'id'>) => void;

  // Data Portability & Backup
  exportBackup: () => void;
  getDatabasePayload: () => DatabasePayload;
  validateImportString: (jsonString: string) => ImportValidationResult;
  applyDatabaseRestore: (payload: DatabasePayload) => boolean;
  importBackup: (jsonString: string) => boolean;
  resetAllToZero: () => void;
  resetToDemoData: () => void;

  // Active view routing
  activeTab: 'home' | 'stock' | 'billing' | 'credit' | 'purchases' | 'expenses' | 'reports' | 'settings';
  setActiveTab: (tab: 'home' | 'stock' | 'billing' | 'credit' | 'purchases' | 'expenses' | 'reports' | 'settings') => void;
  scannerOpen: boolean;
  setScannerOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PROFILE: 'bts_shop_profile',
  PRODUCTS: 'bts_products',
  INVOICES: 'bts_invoices',
  EXPENSES: 'bts_expenses',
  PURCHASES: 'bts_purchases',
  MOVEMENTS: 'bts_stock_movements',
  CREDIT_CUSTOMERS: 'bts_credit_customers',
  CREDIT_TRANSACTIONS: 'bts_credit_transactions',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load persisted state with fallbacks to realistic seed data
  const [shopProfile, setShopProfileState] = useState<ShopProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      return saved ? JSON.parse(saved) : initialShopProfile;
    } catch {
      return initialShopProfile;
    }
  });

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return saved ? JSON.parse(saved) : initialProducts;
    } catch {
      return initialProducts;
    }
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INVOICES);
      return saved ? JSON.parse(saved) : initialInvoices;
    } catch {
      return initialInvoices;
    }
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      return saved ? JSON.parse(saved) : initialExpenses;
    } catch {
      return initialExpenses;
    }
  });

  const [purchases, setPurchases] = useState<PurchaseRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PURCHASES);
      return saved ? JSON.parse(saved) : initialPurchases;
    } catch {
      return initialPurchases;
    }
  });

  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
      if (saved) return JSON.parse(saved);
      // Generate initial stock movement logs for seed products
      return initialProducts.map((p) => ({
        id: `mov-${p.id}`,
        date: p.createdAt,
        productId: p.id,
        productName: p.name,
        type: 'IN_PURCHASE' as const,
        quantityChange: p.quantity,
        finalQuantity: p.quantity,
        reason: 'Initial Store Opening Stock',
      }));
    } catch {
      return [];
    }
  });

  const [creditCustomers, setCreditCustomers] = useState<CreditCustomer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CREDIT_CUSTOMERS);
      return saved ? JSON.parse(saved) : initialCreditCustomers;
    } catch {
      return initialCreditCustomers;
    }
  });

  const [creditTransactions, setCreditTransactions] = useState<CreditTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CREDIT_TRANSACTIONS);
      return saved ? JSON.parse(saved) : initialCreditTransactions;
    } catch {
      return initialCreditTransactions;
    }
  });

  const [lowStockToast, setLowStockToast] = useState<{
    productName: string;
    quantity: number;
    unit: string;
    threshold?: number;
  } | null>(null);

  const dismissLowStockToast = () => setLowStockToast(null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(shopProfile));
  }, [shopProfile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(stockMovements));
  }, [stockMovements]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CREDIT_CUSTOMERS, JSON.stringify(creditCustomers));
  }, [creditCustomers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CREDIT_TRANSACTIONS, JSON.stringify(creditTransactions));
  }, [creditTransactions]);

  // Dark mode effect
  const isDarkMode = shopProfile.theme === 'dark';
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setShopProfileState((prev) => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  };

  const updateShopProfile = (updates: Partial<ShopProfile>) => {
    setShopProfileState((prev) => ({ ...prev, ...updates }));
  };

  const language = shopProfile.language;
  const setLanguage = (lang: Language) => {
    setShopProfileState((prev) => ({ ...prev, language: lang }));
  };

  const t = translations[language];

  // PIN security
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    return shopProfile.pinEnabled;
  });

  const unlockWithPin = (pin: string): boolean => {
    if (!shopProfile.pinEnabled || pin === shopProfile.pinCode) {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const lockApp = () => {
    if (shopProfile.pinEnabled) {
      setIsLocked(true);
    }
  };

  // Active view navigation
  const [activeTab, setActiveTab] = useState<'home' | 'stock' | 'billing' | 'credit' | 'purchases' | 'expenses' | 'reports' | 'settings'>('home');
  const [scannerOpen, setScannerOpen] = useState<boolean>(false);
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);

  // Cart / POS state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartDiscountPercent, setCartDiscountPercent] = useState<number>(0);
  const [cartTaxPercent, setCartTaxPercent] = useState<number>(shopProfile.defaultTaxPercent || 0);
  const [isGstBill, setIsGstBill] = useState<boolean>(false);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');

  // Cart operations
  const addToCart = (product: Product, quantityToAdd: number = 1) => {
    // Check if adding exceeds current inventory
    const existing = cart.find((item) => item.product.id === product.id);
    const currentQtyInCart = existing ? existing.quantity : 0;
    const targetQty = currentQtyInCart + quantityToAdd;

    if (targetQty > product.quantity) {
      return {
        success: false,
        error: `${t.insufficientStock} ${product.name}. ${t.availableOnly} ${product.quantity} ${product.unit}.`,
      };
    }

    if (existing) {
      setCart((prev) =>
        prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: targetQty }
            : item
        )
      );
    } else {
      setCart((prev) => [...prev, { product, quantity: quantityToAdd }]);
    }

    return { success: true };
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    if (quantity > prod.quantity) {
      return; // Do not allow exceeding available stock
    }

    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCartDiscountPercent(0);
    setCustomerName('');
    setCustomerPhone('');
  };

  // Complete bill with ATOMIC stock deduction & movement tracking
  const completeBill = (
    paymentMethod: PaymentMethod,
    cashTendered?: number,
    notes?: string,
    creditDetails?: { amountPaidNow: number }
  ): { success: boolean; invoice?: Invoice; error?: string } => {
    if (cart.length === 0) {
      return { success: false, error: 'Cart is empty!' };
    }

    // 1. Validate stock availability against current products
    const validation = validateStockAvailability(cart, products);
    if (!validation.valid) {
      const err = validation.errors[0];
      return {
        success: false,
        error: `${t.insufficientStock} ${err.productName}. Requested ${err.requested}, but only ${err.available} available.`,
      };
    }

    // 2. Calculate totals
    const effectiveTax = isGstBill ? cartTaxPercent : 0;
    const totals = calculateCartTotals(cart, cartDiscountPercent, effectiveTax);

    // 3. Generate unique invoice number
    const invNumber = generateInvoiceNumber(invoices.length, 'BTS');
    const nowIso = new Date().toISOString();

    const saleItems = cart.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      quantity: item.quantity,
      unit: item.product.unit,
      purchasePrice: item.product.purchasePrice,
      sellingPrice: item.product.sellingPrice,
      discountAmount: item.discountAmount || 0,
      itemTotal: item.product.sellingPrice * item.quantity,
    }));

    const grossProfit = totals.subtotal - totals.discountAmount - totals.cogsTotal;

    const changeDue =
      paymentMethod === 'cash' && cashTendered !== undefined
        ? Math.max(0, Math.round((cashTendered - totals.grandTotal) * 100) / 100)
        : 0;

    let amountPaid: number | undefined = undefined;
    let amountDue: number | undefined = undefined;

    if (paymentMethod === 'credit') {
      if (!customerName.trim() || !customerPhone.trim()) {
        return {
          success: false,
          error: t.customerRequiredForCredit,
        };
      }

      const paidNow = creditDetails?.amountPaidNow ?? 0;
      amountPaid = Math.max(0, Math.min(totals.grandTotal, paidNow));
      amountDue = Math.max(0, Math.round((totals.grandTotal - amountPaid) * 100) / 100);
    }

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: invNumber,
      date: nowIso,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      items: saleItems,
      subtotal: totals.subtotal,
      discountPercent: cartDiscountPercent,
      discountAmount: totals.discountAmount,
      taxPercent: effectiveTax,
      taxAmount: totals.taxAmount,
      grandTotal: totals.grandTotal,
      paymentMethod,
      cashTendered: paymentMethod === 'cash' ? cashTendered : undefined,
      changeDue: paymentMethod === 'cash' ? changeDue : undefined,
      amountPaid,
      amountDue,
      creditAmountPaid: amountPaid,
      creditBalanceDue: amountDue,
      cogsTotal: totals.cogsTotal,
      grossProfit: Math.round(grossProfit * 100) / 100,
      isGstBill,
      notes,
    };

    // 4. ATOMICALLY update product inventory and append stock movement logs
    const newMovements: StockMovement[] = [];
    const lowStockDetected: Array<{ name: string; quantity: number; unit: string; threshold: number }> = [];

    const updatedProducts = products.map((prod) => {
      const soldItem = cart.find((c) => c.product.id === prod.id);
      if (soldItem) {
        const remaining = Math.max(0, prod.quantity - soldItem.quantity);
        newMovements.push({
          id: `mov-${Date.now()}-${prod.id}`,
          date: nowIso,
          productId: prod.id,
          productName: prod.name,
          type: 'OUT_SALE',
          quantityChange: -soldItem.quantity,
          finalQuantity: remaining,
          reason: `Sale Invoice #${invNumber}`,
          referenceId: invNumber,
        });

        // Check low stock trigger
        if (remaining <= prod.lowStockThreshold) {
          lowStockDetected.push({
            name: prod.name,
            quantity: remaining,
            unit: prod.unit,
            threshold: prod.lowStockThreshold,
          });
        }

        return {
          ...prod,
          quantity: remaining,
          updatedAt: nowIso,
        };
      }
      return prod;
    });

    // Handle Credit Ledger entry
    if (paymentMethod === 'credit' && amountDue !== undefined && amountDue > 0) {
      const cleanPhone = customerPhone.trim();
      const cleanName = customerName.trim();

      const existingCust = creditCustomers.find(
        (c) => c.phone.replace(/[^0-9]/g, '') === cleanPhone.replace(/[^0-9]/g, '')
      );

      let targetCustId = existingCust ? existingCust.id : `cust-${Date.now()}`;
      let newBalance = (existingCust ? existingCust.totalDue : 0) + amountDue;

      if (existingCust) {
        setCreditCustomers((prev) =>
          prev.map((c) =>
            c.id === targetCustId
              ? { ...c, totalDue: newBalance, name: cleanName, updatedAt: nowIso }
              : c
          )
        );
      } else {
        const newCust: CreditCustomer = {
          id: targetCustId,
          name: cleanName,
          phone: cleanPhone,
          totalDue: amountDue,
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        setCreditCustomers((prev) => [newCust, ...prev]);
      }

      // Add Credit Transaction
      const newCreditTx: CreditTransaction = {
        id: `ctx-${Date.now()}`,
        customerId: targetCustId,
        customerName: cleanName,
        date: nowIso,
        type: 'CREDIT_GIVEN',
        amount: amountDue,
        balanceAfter: newBalance,
        invoiceId: invNumber,
        notes: `POS Bill #${invNumber} (Total: ₹${totals.grandTotal}${amountPaid ? `, Paid: ₹${amountPaid}` : ''})`,
      };
      setCreditTransactions((prev) => [newCreditTx, ...prev]);
    }

    // 5. Update state
    setProducts(updatedProducts);
    setStockMovements((prev) => [...newMovements, ...prev]);
    setInvoices((prev) => [newInvoice, ...prev]);
    setActiveInvoice(newInvoice);
    clearCart();

    // Trigger Low-Stock Notifications if enabled
    if (shopProfile.lowStockAlertsEnabled && lowStockDetected.length > 0) {
      const first = lowStockDetected[0];
      setLowStockToast({
        productName: first.name,
        quantity: first.quantity,
        unit: first.unit,
        threshold: first.threshold,
      });

      if (shopProfile.browserNotificationsEnabled) {
        triggerLowStockBrowserAlert(
          first.name,
          first.quantity,
          first.unit,
          first.threshold,
          shopProfile.name
        );
      }
    }

    return { success: true, invoice: newInvoice };
  };

  // Product CRUD
  const addProduct = (
    productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
  ): { success: boolean; error?: string } => {
    // Check barcode duplicate if barcode is provided
    if (productData.barcode.trim()) {
      const exists = products.some(
        (p) => p.barcode.trim().toLowerCase() === productData.barcode.trim().toLowerCase()
      );
      if (exists) {
        return { success: false, error: t.barcodeDuplicateError };
      }
    }

    const nowIso = new Date().toISOString();
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setProducts((prev) => [newProduct, ...prev]);

    // Record initial stock movement log
    if (newProduct.quantity > 0) {
      setStockMovements((prev) => [
        {
          id: `mov-${Date.now()}`,
          date: nowIso,
          productId: newProduct.id,
          productName: newProduct.name,
          type: 'IN_PURCHASE',
          quantityChange: newProduct.quantity,
          finalQuantity: newProduct.quantity,
          reason: 'Initial Product Stock Entry',
        },
        ...prev,
      ]);
    }

    return { success: true };
  };

  const updateProduct = (
    id: string,
    updates: Partial<Product>
  ): { success: boolean; error?: string } => {
    if (updates.barcode) {
      const exists = products.some(
        (p) =>
          p.id !== id &&
          p.barcode.trim().toLowerCase() === updates.barcode!.trim().toLowerCase()
      );
      if (exists) {
        return { success: false, error: t.barcodeDuplicateError };
      }
    }

    const nowIso = new Date().toISOString();
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: nowIso } : p))
    );

    return { success: true };
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setCart((prev) => prev.filter((item) => item.product.id !== id));
  };

  const adjustStock = (id: string, changeQty: number, reason: string) => {
    const prod = products.find((p) => p.id === id);
    if (!prod) return;

    const newQty = Math.max(0, prod.quantity + changeQty);
    const nowIso = new Date().toISOString();

    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, quantity: newQty, updatedAt: nowIso } : p))
    );

    setStockMovements((prev) => [
      {
        id: `mov-${Date.now()}`,
        date: nowIso,
        productId: prod.id,
        productName: prod.name,
        type: changeQty >= 0 ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT',
        quantityChange: changeQty,
        finalQuantity: newQty,
        reason: reason || 'Manual Stock Adjustment',
      },
      ...prev,
    ]);

    // Check low stock alert on stock adjustment
    if (shopProfile.lowStockAlertsEnabled && newQty <= prod.lowStockThreshold) {
      setLowStockToast({
        productName: prod.name,
        quantity: newQty,
        unit: prod.unit,
        threshold: prod.lowStockThreshold,
      });

      if (shopProfile.browserNotificationsEnabled) {
        triggerLowStockBrowserAlert(
          prod.name,
          newQty,
          prod.unit,
          prod.lowStockThreshold,
          shopProfile.name
        );
      }
    }
  };

  // Credit / Khata Methods
  const addCreditCustomer = (
    customerData: Omit<CreditCustomer, 'id' | 'createdAt' | 'updatedAt' | 'totalDue'>
  ): { success: boolean; customer?: CreditCustomer; error?: string } => {
    const cleanPhone = customerData.phone.trim();
    if (!customerData.name.trim() || !cleanPhone) {
      return { success: false, error: 'Customer name and phone number are required.' };
    }

    const exists = creditCustomers.some(
      (c) => c.phone.replace(/[^0-9]/g, '') === cleanPhone.replace(/[^0-9]/g, '')
    );
    if (exists) {
      return { success: false, error: 'A customer with this phone number already exists in Khata.' };
    }

    const nowIso = new Date().toISOString();
    const newCust: CreditCustomer = {
      ...customerData,
      id: `cust-${Date.now()}`,
      totalDue: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setCreditCustomers((prev) => [newCust, ...prev]);
    return { success: true, customer: newCust };
  };

  const recordCustomerPayment = (
    customerId: string,
    amount: number,
    paymentMethod: 'cash' | 'upi' | 'card' = 'cash',
    notes?: string
  ): { success: boolean; error?: string } => {
    const customer = creditCustomers.find((c) => c.id === customerId);
    if (!customer) {
      return { success: false, error: 'Customer not found.' };
    }
    if (amount <= 0) {
      return { success: false, error: 'Payment amount must be greater than zero.' };
    }

    const nowIso = new Date().toISOString();
    const newBalance = Math.max(0, Math.round((customer.totalDue - amount) * 100) / 100);

    // Update customer balance
    setCreditCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId
          ? { ...c, totalDue: newBalance, updatedAt: nowIso }
          : c
      )
    );

    // Add payment transaction
    const newTx: CreditTransaction = {
      id: `ctx-${Date.now()}`,
      customerId,
      customerName: customer.name,
      date: nowIso,
      type: 'PAYMENT_RECEIVED',
      amount,
      balanceAfter: newBalance,
      paymentMethod,
      notes: notes?.trim() || `Payment received via ${paymentMethod.toUpperCase()}`,
    };

    setCreditTransactions((prev) => [newTx, ...prev]);
    return { success: true };
  };

  // Browser Notification Handlers
  const requestBrowserNotificationPermission = async (): Promise<NotificationPermission> => {
    const result = await requestNotificationPermission();
    if (result === 'granted') {
      updateShopProfile({ browserNotificationsEnabled: true });
    }
    return result;
  };

  const testBrowserAlert = (): boolean => {
    return triggerTestNotification(shopProfile.name);
  };

  // Expenses CRUD
  const addExpense = (expenseData: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
    };
    setExpenses((prev) => [newExpense, ...prev]);
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  // Purchases CRUD
  const addPurchase = (purchaseData: Omit<PurchaseRecord, 'id'>) => {
    const newPurchase: PurchaseRecord = {
      ...purchaseData,
      id: `pur-${Date.now()}`,
    };

    // Update inventory automatically
    const nowIso = new Date().toISOString();
    const newMovements: StockMovement[] = [];

    setProducts((prev) => {
      const next = [...prev];
      for (const item of purchaseData.items) {
        const prodIndex = next.findIndex((p) => p.id === item.productId);
        if (prodIndex >= 0) {
          const oldProd = next[prodIndex];
          const newQty = oldProd.quantity + item.quantity;
          next[prodIndex] = {
            ...oldProd,
            quantity: newQty,
            purchasePrice: item.purchasePrice || oldProd.purchasePrice,
            sellingPrice: item.sellingPrice || oldProd.sellingPrice,
            updatedAt: nowIso,
          };
          newMovements.push({
            id: `mov-${Date.now()}-${item.productId}`,
            date: nowIso,
            productId: oldProd.id,
            productName: oldProd.name,
            type: 'IN_PURCHASE',
            quantityChange: item.quantity,
            finalQuantity: newQty,
            reason: `Vendor Purchase #${purchaseData.purchaseInvoiceNo} from ${purchaseData.supplierName}`,
            referenceId: purchaseData.purchaseInvoiceNo,
          });
        }
      }
      return next;
    });

    setStockMovements((prev) => [...newMovements, ...prev]);
    setPurchases((prev) => [newPurchase, ...prev]);
  };

  // Data Portability & Backup
  const getDatabasePayload = (): DatabasePayload => {
    return createDatabaseExportPayload({
      shopProfile,
      products,
      invoices,
      expenses,
      purchases,
      stockMovements,
      creditCustomers,
      creditTransactions,
    });
  };

  const exportBackup = () => {
    const payload = getDatabasePayload();
    const filename = generateDatabaseFileName(shopProfile.name);
    downloadDatabaseJson(payload, filename);
  };

  const validateImportString = (jsonString: string): ImportValidationResult => {
    return validateDatabaseImport(jsonString);
  };

  const applyDatabaseRestore = (payload: DatabasePayload): boolean => {
    try {
      if (payload.shopProfile) {
        setShopProfileState(payload.shopProfile);
        localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(payload.shopProfile));
      }
      setProducts(payload.products);
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(payload.products));

      const invs = payload.invoices || [];
      setInvoices(invs);
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invs));

      const exps = payload.expenses || [];
      setExpenses(exps);
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(exps));

      const purs = payload.purchases || [];
      setPurchases(purs);
      localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purs));

      const movs = payload.stockMovements || [];
      setStockMovements(movs);
      localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(movs));

      const custs = payload.creditCustomers || [];
      setCreditCustomers(custs);
      localStorage.setItem(STORAGE_KEYS.CREDIT_CUSTOMERS, JSON.stringify(custs));

      const ctxs = payload.creditTransactions || [];
      setCreditTransactions(ctxs);
      localStorage.setItem(STORAGE_KEYS.CREDIT_TRANSACTIONS, JSON.stringify(ctxs));

      clearCart();
      return true;
    } catch (err) {
      console.error('Failed to apply database restore', err);
      return false;
    }
  };

  const importBackup = (jsonString: string): boolean => {
    const result = validateDatabaseImport(jsonString);
    if (!result.valid || !result.data) {
      return false;
    }
    return applyDatabaseRestore(result.data);
  };

  const resetAllToZero = () => {
    // 1. Reset all products quantity to 0
    const zeroProducts = products.map((p) => ({
      ...p,
      quantity: 0,
      updatedAt: new Date().toISOString(),
    }));
    setProducts(zeroProducts);

    // 2. Reset all credit customers totalDue to 0
    const zeroCustomers = creditCustomers.map((c) => ({
      ...c,
      totalDue: 0,
      updatedAt: new Date().toISOString(),
    }));
    setCreditCustomers(zeroCustomers);

    // 3. Clear transactions, movements, invoices, expenses, purchases
    setCreditTransactions([]);
    setInvoices([]);
    setExpenses([]);
    setPurchases([]);
    setStockMovements([]);
    clearCart();

    // 4. Update localStorage immediately
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(zeroProducts));
      localStorage.setItem(STORAGE_KEYS.CREDIT_CUSTOMERS, JSON.stringify(zeroCustomers));
      localStorage.setItem(STORAGE_KEYS.CREDIT_TRANSACTIONS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify([]));
    } catch (err) {
      console.error('Failed to sync zero reset to localStorage', err);
    }
  };

  const resetToDemoData = () => {
    setShopProfileState(initialShopProfile);
    setProducts(initialProducts);
    setInvoices(initialInvoices);
    setExpenses(initialExpenses);
    setPurchases(initialPurchases);
    setCreditCustomers(initialCreditCustomers);
    setCreditTransactions(initialCreditTransactions);
    setStockMovements([]);
    clearCart();
  };

  return (
    <AppContext.Provider
      value={{
        shopProfile,
        updateShopProfile,
        language,
        setLanguage,
        t,
        isDarkMode,
        toggleDarkMode,
        isLocked,
        unlockWithPin,
        lockApp,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        stockMovements,
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
        invoices,
        activeInvoice,
        setActiveInvoice,
        creditCustomers,
        creditTransactions,
        addCreditCustomer,
        recordCustomerPayment,
        lowStockToast,
        setLowStockToast,
        dismissLowStockToast,
        requestBrowserNotificationPermission,
        testBrowserAlert,
        expenses,
        addExpense,
        deleteExpense,
        purchases,
        addPurchase,
        exportBackup,
        getDatabasePayload,
        validateImportString,
        applyDatabaseRestore,
        importBackup,
        resetAllToZero,
        resetToDemoData,
        activeTab,
        setActiveTab,
        scannerOpen,
        setScannerOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
