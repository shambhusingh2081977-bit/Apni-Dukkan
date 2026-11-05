import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCartTotals,
  calculateCOGS,
  calculateGrossProfit,
  calculateNetProfit,
  validateStockAvailability,
  formatINR,
  generateInvoiceNumber,
  aggregateProfitAndLoss,
  aggregateCreditStats,
} from './posCalculations';
import { CartItem, Product, Expense, Invoice } from '../types';

const mockProduct1: Product = {
  id: 'p1',
  name: 'Basmati Rice',
  category: 'Grocery & Staples',
  purchasePrice: 80, // Cost price
  sellingPrice: 110, // Selling price
  quantity: 25,
  unit: 'kg',
  barcode: '8901234567890',
  lowStockThreshold: 5,
  createdAt: '2026-11-01',
  updatedAt: '2026-11-01',
};

const mockProduct2: Product = {
  id: 'p2',
  name: 'Tata Salt',
  category: 'Grocery & Staples',
  purchasePrice: 20,
  sellingPrice: 28,
  quantity: 50,
  unit: 'packet',
  barcode: '8901234567891',
  lowStockThreshold: 10,
  createdAt: '2026-11-01',
  updatedAt: '2026-11-01',
};

test('Cart calculations compute subtotal, discount, tax, and COGS accurately', () => {
  const cartItems: CartItem[] = [
    { product: mockProduct1, quantity: 2 }, // 2 * 110 = 220, COGS = 2 * 80 = 160
    { product: mockProduct2, quantity: 3 }, // 3 * 28 = 84, COGS = 3 * 20 = 60
  ];

  // Subtotal = 220 + 84 = 304
  // 10% discount = 30.40 -> Taxable = 273.60
  // 5% GST on 273.60 = 13.68 -> Grand total = 287.28
  const totals = calculateCartTotals(cartItems, 10, 5);

  assert.equal(totals.subtotal, 304);
  assert.equal(totals.discountAmount, 30.4);
  assert.equal(totals.taxAmount, 13.68);
  assert.equal(totals.grandTotal, 287.28);
  assert.equal(totals.cogsTotal, 220); // 160 + 60 = 220
});

test('Gross Profit and Net Profit formula correctness (Gross = Revenue - COGS, Net = Gross - Expenses)', () => {
  const salesRevenue = 3000;
  const cogs = 2100;
  const grossProfit = calculateGrossProfit(salesRevenue, cogs);
  assert.equal(grossProfit, 900); // 3000 - 2100 = 900

  const expenses = 350;
  const netProfit = calculateNetProfit(grossProfit, expenses);
  assert.equal(netProfit, 550); // 900 - 350 = 550

  // Loss scenario
  const highExpenses = 1200;
  const netLoss = calculateNetProfit(grossProfit, highExpenses);
  assert.equal(netLoss, -300); // 900 - 1200 = -300
});

test('Inventory stock validation blocks order if quantity exceeds available stock', () => {
  const inventory: Product[] = [mockProduct1, mockProduct2];

  // Valid order
  const validCart: CartItem[] = [
    { product: mockProduct1, quantity: 10 },
    { product: mockProduct2, quantity: 40 },
  ];
  const validCheck = validateStockAvailability(validCart, inventory);
  assert.equal(validCheck.valid, true);
  assert.equal(validCheck.errors.length, 0);

  // Insufficient stock order
  const invalidCart: CartItem[] = [
    { product: mockProduct1, quantity: 30 }, // Available is 25
  ];
  const invalidCheck = validateStockAvailability(invalidCart, inventory);
  assert.equal(invalidCheck.valid, false);
  assert.equal(invalidCheck.errors.length, 1);
  assert.equal(invalidCheck.errors[0].available, 25);
  assert.equal(invalidCheck.errors[0].requested, 30);
});

test('formatINR formats currency with rupee symbol correctly', () => {
  assert.equal(formatINR(500), '₹500');
  assert.equal(formatINR(125000), '₹1,25,000');
  assert.equal(formatINR(-450), '-₹450');
});

test('generateInvoiceNumber creates sequential standardized invoice code', () => {
  const invNo = generateInvoiceNumber(5, 'BTS');
  assert.match(invNo, /^BTS-\d{8}-0006$/);
});

test('aggregateProfitAndLoss aggregates metrics across bills and expenses', () => {
  const sampleInvoices: Invoice[] = [
    {
      id: 'inv-1',
      invoiceNumber: 'INV-20261104-0001',
      date: '2026-11-04T10:00:00Z',
      items: [],
      subtotal: 1000,
      discountPercent: 0,
      discountAmount: 100,
      taxPercent: 5,
      taxAmount: 45,
      grandTotal: 945,
      paymentMethod: 'cash',
      cogsTotal: 600,
      grossProfit: 300, // (1000 - 100) - 600 = 300
      isGstBill: true,
    },
  ];

  const sampleExpenses: Expense[] = [
    {
      id: 'e1',
      title: 'Shop electricity bill',
      category: 'electricity',
      amount: 120,
      date: '2026-11-04',
    },
  ];

  const agg = aggregateProfitAndLoss(sampleInvoices, sampleExpenses);
  assert.equal(agg.totalSales, 900); // 1000 - 100
  assert.equal(agg.cogsTotal, 600);
  assert.equal(agg.grossProfit, 300);
  assert.equal(agg.totalExpenses, 120);
  assert.equal(agg.netProfit, 180); // 300 - 120
  assert.equal(agg.billsCount, 1);
});

test('aggregateCreditStats calculates outstanding due and daily customer ledger changes', () => {
  const mockCustomers = [
    { id: 'c1', name: 'Ramesh', phone: '123', totalDue: 500, createdAt: '', updatedAt: '' },
    { id: 'c2', name: 'Suresh', phone: '456', totalDue: 0, createdAt: '', updatedAt: '' },
    { id: 'c3', name: 'Mahesh', phone: '789', totalDue: 350, createdAt: '', updatedAt: '' },
  ];

  const todayStr = new Date().toISOString();
  const mockTransactions = [
    { id: 't1', customerId: 'c1', customerName: 'Ramesh', date: todayStr, type: 'CREDIT_GIVEN' as const, amount: 200, balanceAfter: 500 },
    { id: 't2', customerId: 'c3', customerName: 'Mahesh', date: todayStr, type: 'PAYMENT_RECEIVED' as const, amount: 150, balanceAfter: 350 },
  ];

  const stats = aggregateCreditStats(mockCustomers, mockTransactions);
  assert.equal(stats.totalOutstandingDue, 850); // 500 + 350
  assert.equal(stats.customersWithDueCount, 2);
  assert.equal(stats.todayCreditGiven, 200);
  assert.equal(stats.todayPaymentReceived, 150);
});
