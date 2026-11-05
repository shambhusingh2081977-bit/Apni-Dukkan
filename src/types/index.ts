export type UnitType = 'pcs' | 'kg' | 'g' | 'l' | 'ml' | 'packet' | 'box';

export type ProductCategory =
  | 'Grocery & Staples'
  | 'Snacks & Beverages'
  | 'Personal Care'
  | 'Dairy & Bakery'
  | 'Household & Cleaning'
  | 'Stationery'
  | 'Electronics & Mobile'
  | 'Clothing & Footwear'
  | 'General';

export interface Product {
  id: string;
  name: string;
  nameHindi?: string;
  category: ProductCategory;
  purchasePrice: number; // Cost price (CP)
  sellingPrice: number;  // Selling price (MRP/SP)
  quantity: number;      // Current stock
  unit: UnitType;
  barcode: string;       // Unique barcode / SKU
  supplierName?: string;
  supplierPhone?: string;
  lowStockThreshold: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discountAmount?: number;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: UnitType;
  purchasePrice: number; // For COGS calculation
  sellingPrice: number;
  discountAmount: number;
  itemTotal: number;
}

export type PaymentMethod = 'cash' | 'upi' | 'card' | 'credit';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  customerName?: string;
  customerPhone?: string;
  items: SaleItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  cashTendered?: number;
  changeDue?: number;
  amountPaid?: number;   // Amount collected now (for credit sales)
  amountDue?: number;    // Balance added to customer's Khata
  creditAmountPaid?: number;  // Alias for amountPaid
  creditBalanceDue?: number;  // Alias for amountDue
  customerId?: string;        // Khata customer ID
  cogsTotal: number;     // Cost of goods sold
  grossProfit: number;   // Revenue - COGS
  isGstBill: boolean;
  notes?: string;
}

export type ExpenseCategory =
  | 'rent'
  | 'electricity'
  | 'transport'
  | 'salary'
  | 'packaging'
  | 'miscellaneous';

export interface Expense {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string; // ISO date string YYYY-MM-DD
  notes?: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: UnitType;
  purchasePrice: number;
  sellingPrice?: number;
  total: number;
}

export interface PurchaseRecord {
  id: string;
  purchaseInvoiceNo: string;
  supplierName: string;
  supplierPhone?: string;
  date: string;
  items: PurchaseItem[];
  totalAmount: number;
  paymentStatus: 'paid' | 'pending' | 'partial';
  notes?: string;
}

export type StockMovementType =
  | 'IN_PURCHASE'
  | 'OUT_SALE'
  | 'ADJUSTMENT_IN'
  | 'ADJUSTMENT_OUT';

export interface StockMovement {
  id: string;
  date: string;
  productId: string;
  productName: string;
  type: StockMovementType;
  quantityChange: number;
  finalQuantity: number;
  reason: string;
  referenceId?: string; // invoice number or purchase id
}

export interface CreditCustomer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  totalDue: number; // Current outstanding udhaar
  creditLimit?: number;
  createdAt: string;
  updatedAt: string;
}

export type CreditTransactionType = 'CREDIT_GIVEN' | 'PAYMENT_RECEIVED';

export interface CreditTransaction {
  id: string;
  customerId: string;
  customerName: string;
  date: string;
  type: CreditTransactionType;
  amount: number;
  balanceAfter: number;
  invoiceId?: string;
  paymentMethod?: 'cash' | 'upi' | 'card';
  notes?: string;
}

export interface ShopProfile {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  gstNumber: string;
  upiId: string;
  currencySymbol: string;
  thermalWidth: '58mm' | '80mm';
  defaultTaxPercent: number;
  language: 'en' | 'hi';
  theme: 'light' | 'dark';
  pinEnabled: boolean;
  pinCode: string; // 4-digit PIN
  lowStockAlertsEnabled: boolean;
  browserNotificationsEnabled: boolean;
  defaultLowStockThreshold: number;
}

export type PeriodFilter = 'today' | 'week' | 'month' | 'year' | 'all';

