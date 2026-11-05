import {
  ShopProfile,
  Product,
  Invoice,
  Expense,
  PurchaseRecord,
  StockMovement,
  CreditCustomer,
  CreditTransaction,
} from '../types';

export interface DatabaseRecordCounts {
  products: number;
  invoices: number;
  expenses: number;
  purchases: number;
  stockMovements: number;
  creditCustomers: number;
  creditTransactions: number;
}

export interface DatabaseMetadata {
  version: string;
  appName: string;
  exportedAt: string;
  shopName: string;
  counts: DatabaseRecordCounts;
}

export interface DatabasePayload {
  version: string;
  appName?: string;
  exportedAt: string;
  shopProfile?: ShopProfile;
  products: Product[];
  invoices?: Invoice[];
  expenses?: Expense[];
  purchases?: PurchaseRecord[];
  stockMovements?: StockMovement[];
  creditCustomers?: CreditCustomer[];
  creditTransactions?: CreditTransaction[];
  metadata?: DatabaseMetadata;
}

export interface ImportValidationResult {
  valid: boolean;
  error?: string;
  data?: DatabasePayload;
  metadata?: DatabaseMetadata;
}

/**
 * Creates a structured, portable database payload for export.
 */
export function createDatabaseExportPayload(params: {
  shopProfile: ShopProfile;
  products: Product[];
  invoices: Invoice[];
  expenses: Expense[];
  purchases: PurchaseRecord[];
  stockMovements: StockMovement[];
  creditCustomers: CreditCustomer[];
  creditTransactions: CreditTransaction[];
}): DatabasePayload {
  const exportedAt = new Date().toISOString();
  const counts: DatabaseRecordCounts = {
    products: params.products?.length || 0,
    invoices: params.invoices?.length || 0,
    expenses: params.expenses?.length || 0,
    purchases: params.purchases?.length || 0,
    stockMovements: params.stockMovements?.length || 0,
    creditCustomers: params.creditCustomers?.length || 0,
    creditTransactions: params.creditTransactions?.length || 0,
  };

  const metadata: DatabaseMetadata = {
    version: '2.0',
    appName: 'Apni Dukan',
    exportedAt,
    shopName: params.shopProfile?.name || 'Apni Dukan',
    counts,
  };

  return {
    version: '2.0',
    appName: 'Apni Dukan',
    exportedAt,
    shopProfile: params.shopProfile,
    products: params.products || [],
    invoices: params.invoices || [],
    expenses: params.expenses || [],
    purchases: params.purchases || [],
    stockMovements: params.stockMovements || [],
    creditCustomers: params.creditCustomers || [],
    creditTransactions: params.creditTransactions || [],
    metadata,
  };
}

/**
 * Formats a clean, standard filename for database exports.
 */
export function generateDatabaseFileName(
  shopName: string = 'Shop',
  date: Date = new Date()
): string {
  const cleanName = shopName
    .trim()
    .replace(/[^a-zA-Z0-9_\u0900-\u097F]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 30) || 'ApniDukan';
  const dateStr = date.toISOString().split('T')[0];
  return `ApniDukan_Database_${cleanName}_${dateStr}.json`;
}

/**
 * Validates, checks integrity, and normalizes an imported JSON string.
 * Supports current v2.0 schema as well as legacy v1.x formats.
 */
export function validateDatabaseImport(jsonString: string): ImportValidationResult {
  if (!jsonString || typeof jsonString !== 'string' || !jsonString.trim()) {
    return {
      valid: false,
      error: 'The provided file is empty.',
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err) {
    return {
      valid: false,
      error: 'Invalid JSON format. Please verify the file is not corrupted.',
    };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      valid: false,
      error: 'Invalid database structure. Expected a valid shop database object.',
    };
  }

  const raw = parsed as Record<string, unknown>;

  // Products array is mandatory for an inventory POS database
  if (!raw.products || !Array.isArray(raw.products)) {
    return {
      valid: false,
      error: 'Missing products catalog. A valid backup must contain a products array.',
    };
  }

  // Sanitize and normalize arrays
  const products: Product[] = raw.products as Product[];
  const invoices: Invoice[] = Array.isArray(raw.invoices) ? (raw.invoices as Invoice[]) : [];
  const expenses: Expense[] = Array.isArray(raw.expenses) ? (raw.expenses as Expense[]) : [];
  const purchases: PurchaseRecord[] = Array.isArray(raw.purchases)
    ? (raw.purchases as PurchaseRecord[])
    : [];
  const stockMovements: StockMovement[] = Array.isArray(raw.stockMovements)
    ? (raw.stockMovements as StockMovement[])
    : [];
  const creditCustomers: CreditCustomer[] = Array.isArray(raw.creditCustomers)
    ? (raw.creditCustomers as CreditCustomer[])
    : [];
  const creditTransactions: CreditTransaction[] = Array.isArray(raw.creditTransactions)
    ? (raw.creditTransactions as CreditTransaction[])
    : [];

  const shopProfile =
    raw.shopProfile && typeof raw.shopProfile === 'object'
      ? (raw.shopProfile as ShopProfile)
      : undefined;

  const version = typeof raw.version === 'string' ? raw.version : '1.0';
  const exportedAt =
    typeof raw.exportedAt === 'string' ? raw.exportedAt : new Date().toISOString();

  const counts: DatabaseRecordCounts = {
    products: products.length,
    invoices: invoices.length,
    expenses: expenses.length,
    purchases: purchases.length,
    stockMovements: stockMovements.length,
    creditCustomers: creditCustomers.length,
    creditTransactions: creditTransactions.length,
  };

  const metadata: DatabaseMetadata = {
    version,
    appName: typeof raw.appName === 'string' ? raw.appName : 'Apni Dukan',
    exportedAt,
    shopName: shopProfile?.name || 'Apni Dukan',
    counts,
  };

  const normalizedPayload: DatabasePayload = {
    version,
    appName: metadata.appName,
    exportedAt,
    shopProfile,
    products,
    invoices,
    expenses,
    purchases,
    stockMovements,
    creditCustomers,
    creditTransactions,
    metadata,
  };

  return {
    valid: true,
    data: normalizedPayload,
    metadata,
  };
}

/**
 * Downloads a database payload as a JSON file in the browser.
 */
export function downloadDatabaseJson(payload: DatabasePayload, filename: string): void {
  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
