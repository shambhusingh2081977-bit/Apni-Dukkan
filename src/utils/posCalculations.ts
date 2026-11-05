import { CartItem, Product, Expense, Invoice, CreditCustomer, CreditTransaction } from '../types';

/**
 * Calculates subtotal, discount, tax, and final total for the active billing cart.
 */
export function calculateCartTotals(
  items: CartItem[],
  discountPercent: number = 0,
  taxPercent: number = 0
): {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  grandTotal: number;
  cogsTotal: number;
} {
  // Sum of individual items (price * quantity - itemDiscount)
  const subtotal = items.reduce((sum, item) => {
    const itemRaw = item.product.sellingPrice * item.quantity;
    const itemDisc = item.discountAmount || 0;
    return sum + Math.max(0, itemRaw - itemDisc);
  }, 0);

  // Apply bill-level discount percent
  const clampedDiscountPercent = Math.max(0, Math.min(100, discountPercent));
  const discountAmount = Math.round((subtotal * clampedDiscountPercent) / 100 * 100) / 100;

  const taxableAmount = Math.max(0, subtotal - discountAmount);

  // GST / Tax calculation
  const clampedTaxPercent = Math.max(0, taxPercent);
  const taxAmount = Math.round((taxableAmount * clampedTaxPercent) / 100 * 100) / 100;

  const grandTotal = Math.round((taxableAmount + taxAmount) * 100) / 100;

  // Cost of Goods Sold for these items
  const cogsTotal = calculateCOGS(items);

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountAmount,
    taxableAmount,
    taxAmount,
    grandTotal,
    cogsTotal: Math.round(cogsTotal * 100) / 100,
  };
}

/**
 * Cost of Goods Sold: sum of (item.quantity * product.purchasePrice)
 */
export function calculateCOGS(items: CartItem[]): number {
  return items.reduce((sum, item) => {
    return sum + (item.quantity * (item.product.purchasePrice || 0));
  }, 0);
}

/**
 * Gross Profit = Sales Revenue - Cost of Goods Sold
 * (Sales Revenue is the taxable/net revenue generated before tax or after item discounts)
 */
export function calculateGrossProfit(salesRevenue: number, cogs: number): number {
  return Math.round((salesRevenue - cogs) * 100) / 100;
}

/**
 * Net Profit = Gross Profit - Expenses
 */
export function calculateNetProfit(grossProfit: number, totalExpenses: number): number {
  return Math.round((grossProfit - totalExpenses) * 100) / 100;
}

/**
 * Validates whether all items in cart have sufficient inventory in stock.
 * Returns { valid: boolean, errors: Array<{ productId: string, productName: string, requested: number, available: number }> }
 */
export function validateStockAvailability(
  items: CartItem[],
  inventory: Product[]
): {
  valid: boolean;
  errors: Array<{
    productId: string;
    productName: string;
    requested: number;
    available: number;
  }>;
} {
  const errors: Array<{
    productId: string;
    productName: string;
    requested: number;
    available: number;
  }> = [];

  const inventoryMap = new Map<string, Product>();
  for (const prod of inventory) {
    inventoryMap.set(prod.id, prod);
  }

  for (const item of items) {
    const product = inventoryMap.get(item.product.id);
    const available = product ? product.quantity : 0;
    if (item.quantity > available) {
      errors.push({
        productId: item.product.id,
        productName: item.product.name,
        requested: item.quantity,
        available,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Total stock valuation: sum of (quantity * purchasePrice) for all inventory
 */
export function calculateTotalStockValue(inventory: Product[]): number {
  const val = inventory.reduce((sum, p) => sum + (p.quantity * p.purchasePrice), 0);
  return Math.round(val * 100) / 100;
}

/**
 * Total retail valuation: sum of (quantity * sellingPrice) for all inventory
 */
export function calculateTotalRetailValue(inventory: Product[]): number {
  const val = inventory.reduce((sum, p) => sum + (p.quantity * p.sellingPrice), 0);
  return Math.round(val * 100) / 100;
}

/**
 * Formats a number in Indian Rupee format (e.g. ₹1,25,000.00 or ₹450)
 */
export function formatINR(amount: number, showDecimals: boolean = true): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹0';
  }
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  const options: Intl.NumberFormatOptions = {
    minimumFractionDigits: showDecimals ? (absAmount % 1 !== 0 ? 2 : 0) : 0,
    maximumFractionDigits: 2,
  };

  const formatted = new Intl.NumberFormat('en-IN', options).format(absAmount);
  return `${isNegative ? '-' : ''}₹${formatted}`;
}

/**
 * Generates sequential formatted unique invoice number
 */
export function generateInvoiceNumber(totalInvoicesCount: number, prefix: string = 'INV'): string {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const seq = String(totalInvoicesCount + 1).padStart(4, '0');
  return `${prefix}-${yyyy}${mm}${dd}-${seq}`;
}

/**
 * Check if a date string (ISO YYYY-MM-DD or full timestamp) falls within a period filter
 */
export function isDateInPeriod(
  dateStr: string,
  period: 'today' | 'week' | 'month' | 'year' | 'all',
  refDate: Date = new Date()
): boolean {
  if (period === 'all') return true;

  const itemDate = new Date(dateStr);
  if (isNaN(itemDate.getTime())) return false;

  const refYear = refDate.getFullYear();
  const refMonth = refDate.getMonth();
  const refDay = refDate.getDate();

  if (period === 'today') {
    return (
      itemDate.getFullYear() === refYear &&
      itemDate.getMonth() === refMonth &&
      itemDate.getDate() === refDay
    );
  }

  if (period === 'week') {
    // Current week starting from Monday (or past 7 days)
    const sevenDaysAgo = new Date(refDate);
    sevenDaysAgo.setDate(refDay - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    return itemDate >= sevenDaysAgo && itemDate <= refDate;
  }

  if (period === 'month') {
    return (
      itemDate.getFullYear() === refYear &&
      itemDate.getMonth() === refMonth
    );
  }

  if (period === 'year') {
    return itemDate.getFullYear() === refYear;
  }

  return true;
}

/**
 * Aggregate profit & loss metrics for a given set of invoices and expenses
 */
export function aggregateProfitAndLoss(
  invoices: Invoice[],
  expenses: Expense[]
): {
  totalSales: number;
  cogsTotal: number;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
  totalDiscount: number;
  totalGst: number;
  billsCount: number;
} {
  const totalSales = invoices.reduce((sum, inv) => sum + (inv.subtotal - inv.discountAmount), 0);
  const cogsTotal = invoices.reduce((sum, inv) => sum + inv.cogsTotal, 0);
  const grossProfit = calculateGrossProfit(totalSales, cogsTotal);
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const netProfit = calculateNetProfit(grossProfit, totalExpenses);
  const totalDiscount = invoices.reduce((sum, inv) => sum + inv.discountAmount, 0);
  const totalGst = invoices.reduce((sum, inv) => sum + inv.taxAmount, 0);

  return {
    totalSales: Math.round(totalSales * 100) / 100,
    cogsTotal: Math.round(cogsTotal * 100) / 100,
    grossProfit: Math.round(grossProfit * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    netProfit: Math.round(netProfit * 100) / 100,
    totalDiscount: Math.round(totalDiscount * 100) / 100,
    totalGst: Math.round(totalGst * 100) / 100,
    billsCount: invoices.length,
  };
}

/**
 * Aggregate credit/udhaar metrics
 */
export function aggregateCreditStats(
  customers: CreditCustomer[],
  transactions: CreditTransaction[]
): {
  totalOutstandingDue: number;
  customersWithDueCount: number;
  todayCreditGiven: number;
  todayPaymentReceived: number;
} {
  const totalOutstandingDue = customers.reduce((sum, c) => sum + (c.totalDue || 0), 0);
  const customersWithDueCount = customers.filter((c) => (c.totalDue || 0) > 0).length;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayTransactions = transactions.filter((t) => t.date.startsWith(todayStr));

  const todayCreditGiven = todayTransactions
    .filter((t) => t.type === 'CREDIT_GIVEN')
    .reduce((sum, t) => sum + t.amount, 0);

  const todayPaymentReceived = todayTransactions
    .filter((t) => t.type === 'PAYMENT_RECEIVED')
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    totalOutstandingDue: Math.round(totalOutstandingDue * 100) / 100,
    customersWithDueCount,
    todayCreditGiven: Math.round(todayCreditGiven * 100) / 100,
    todayPaymentReceived: Math.round(todayPaymentReceived * 100) / 100,
  };
}
