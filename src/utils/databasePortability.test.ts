import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createDatabaseExportPayload,
  generateDatabaseFileName,
  validateDatabaseImport,
} from './databasePortability';
import { ShopProfile, Product, Expense, CreditCustomer } from '../types';

const mockShopProfile: ShopProfile = {
  name: 'Apni Dukan',
  tagline: 'Aapki Apni Digital Dukan',
  address: 'Shop 12, Market Road, Jaipur',
  phone: '9876543210',
  gstNumber: '08AAAAA0000A1Z5',
  upiId: 'apnidukan@upi',
  currencySymbol: '₹',
  thermalWidth: '80mm',
  defaultTaxPercent: 0,
  language: 'hi',
  theme: 'light',
  pinEnabled: false,
  pinCode: '1234',
  lowStockAlertsEnabled: true,
  browserNotificationsEnabled: false,
  defaultLowStockThreshold: 5,
};

const mockProduct: Product = {
  id: 'p-1',
  name: 'Aashirvaad Atta 5kg',
  category: 'Grocery & Staples',
  purchasePrice: 210,
  sellingPrice: 245,
  quantity: 20,
  unit: 'packet',
  barcode: '8901030000001',
  lowStockThreshold: 4,
  createdAt: '2026-11-01T10:00:00.000Z',
  updatedAt: '2026-11-01T10:00:00.000Z',
};

const mockExpense: Expense = {
  id: 'exp-1',
  title: 'Shop electricity bill',
  category: 'electricity',
  amount: 1450,
  date: '2026-11-02',
};

test('createDatabaseExportPayload builds complete structured database schema', () => {
  const payload = createDatabaseExportPayload({
    shopProfile: mockShopProfile,
    products: [mockProduct],
    invoices: [],
    expenses: [mockExpense],
    purchases: [],
    stockMovements: [],
    creditCustomers: [],
    creditTransactions: [],
  });

  assert.equal(payload.version, '2.0');
  assert.equal(payload.appName, 'Apni Dukan');
  assert.ok(payload.exportedAt);
  assert.equal(payload.shopProfile?.name, 'Apni Dukan');
  assert.equal(payload.products.length, 1);
  assert.equal(payload.expenses?.length, 1);
  assert.equal(payload.metadata?.counts.products, 1);
  assert.equal(payload.metadata?.counts.expenses, 1);
  assert.equal(payload.metadata?.counts.invoices, 0);
});

test('generateDatabaseFileName sanitizes shop names and appends ISO date', () => {
  const fixedDate = new Date('2026-11-05T12:00:00.000Z');
  const filename = generateDatabaseFileName('Apni Dukan / Kirana @ Store #1!', fixedDate);
  assert.ok(filename.startsWith('ApniDukan_Database_Apni_Dukan_Kirana_Store_1'));
  assert.ok(filename.endsWith('_2026-11-05.json'));
});

test('validateDatabaseImport successfully validates authentic database export', () => {
  const payload = createDatabaseExportPayload({
    shopProfile: mockShopProfile,
    products: [mockProduct],
    invoices: [],
    expenses: [mockExpense],
    purchases: [],
    stockMovements: [],
    creditCustomers: [],
    creditTransactions: [],
  });

  const jsonStr = JSON.stringify(payload);
  const result = validateDatabaseImport(jsonStr);

  assert.equal(result.valid, true);
  assert.equal(result.error, undefined);
  assert.equal(result.data?.products.length, 1);
  assert.equal(result.metadata?.counts.products, 1);
  assert.equal(result.metadata?.counts.expenses, 1);
  assert.equal(result.metadata?.shopName, 'Apni Dukan');
});

test('handles database with zeroed stock (00) and zeroed khata (00) correctly', () => {
  const zeroProduct: Product = { ...mockProduct, quantity: 0 };
  const zeroCustomer: CreditCustomer = {
    id: 'c-1',
    name: 'Sharma Ji',
    phone: '9829012345',
    totalDue: 0,
    createdAt: '2026-11-01',
    updatedAt: '2026-11-05',
  };

  const payload = createDatabaseExportPayload({
    shopProfile: mockShopProfile,
    products: [zeroProduct],
    invoices: [],
    expenses: [],
    purchases: [],
    stockMovements: [],
    creditCustomers: [zeroCustomer],
    creditTransactions: [],
  });

  assert.equal(payload.products[0].quantity, 0);
  assert.equal(payload.creditCustomers?.[0]?.totalDue, 0);

  const jsonStr = JSON.stringify(payload);
  const result = validateDatabaseImport(jsonStr);

  assert.equal(result.valid, true);
  assert.equal(result.data?.products[0].quantity, 0);
  assert.equal(result.data?.creditCustomers?.[0].totalDue, 0);
  assert.equal(result.metadata?.counts.invoices, 0);
});

test('validateDatabaseImport handles legacy or minimal product backups gracefully', () => {
  const legacyJson = JSON.stringify({
    version: '1.0',
    products: [mockProduct],
  });

  const result = validateDatabaseImport(legacyJson);
  assert.equal(result.valid, true);
  assert.equal(result.data?.products.length, 1);
  assert.deepEqual(result.data?.invoices, []);
  assert.deepEqual(result.data?.expenses, []);
  assert.equal(result.metadata?.counts.products, 1);
});

test('validateDatabaseImport rejects invalid or corrupted JSON with clear errors', () => {
  const emptyResult = validateDatabaseImport('');
  assert.equal(emptyResult.valid, false);
  assert.ok(emptyResult.error?.includes('empty'));

  const corruptResult = validateDatabaseImport('{ corrupted json: true, ');
  assert.equal(corruptResult.valid, false);
  assert.ok(corruptResult.error?.includes('Invalid JSON format'));

  const missingProducts = validateDatabaseImport(JSON.stringify({ shopName: 'Test' }));
  assert.equal(missingProducts.valid, false);
  assert.ok(missingProducts.error?.includes('Missing products catalog'));

  const arrayResult = validateDatabaseImport('["not", "a", "database"]');
  assert.equal(arrayResult.valid, false);
  assert.ok(arrayResult.error?.includes('Invalid database structure'));
});
