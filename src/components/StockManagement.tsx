import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Product, ProductCategory, UnitType } from '../types';
import { calculateTotalStockValue, formatINR } from '../utils/posCalculations';
import { renderBarcodeSvg } from '../utils/barcodeSvg';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Edit2,
  Trash2,
  ArrowUpDown,
  History,
  Barcode,
  Printer,
  CheckCircle,
  X,
  Layers,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface StockManagementProps {
  addProductModalOpen: boolean;
  setAddProductModalOpen: (open: boolean) => void;
}

export const StockManagement: React.FC<StockManagementProps> = ({
  addProductModalOpen,
  setAddProductModalOpen,
}) => {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    stockMovements,
    t,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'products' | 'movements' | 'barcodes'>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);

  // Edit Product Modal State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Adjust Stock Modal State
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustmentQty, setAdjustmentQty] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('');

  // Delete confirmation
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Add Product Form State
  const [formName, setFormName] = useState('');
  const [formNameHindi, setFormNameHindi] = useState('');
  const [formCategory, setFormCategory] = useState<ProductCategory>('Grocery & Staples');
  const [formPurchasePrice, setFormPurchasePrice] = useState<number | ''>('');
  const [formSellingPrice, setFormSellingPrice] = useState<number | ''>('');
  const [formQuantity, setFormQuantity] = useState<number | ''>('');
  const [formUnit, setFormUnit] = useState<UnitType>('pcs');
  const [formBarcode, setFormBarcode] = useState('');
  const [formSupplierName, setFormSupplierName] = useState('');
  const [formLowStockThreshold, setFormLowStockThreshold] = useState<number>(5);
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setFormName('');
    setFormNameHindi('');
    setFormCategory('Grocery & Staples');
    setFormPurchasePrice('');
    setFormSellingPrice('');
    setFormQuantity('');
    setFormUnit('pcs');
    setFormBarcode('');
    setFormSupplierName('');
    setFormLowStockThreshold(5);
    setFormError(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    // Auto generate suggestion barcode
    const randomCode = '890' + Math.floor(1000000 + Math.random() * 9000000);
    setFormBarcode(randomCode);
    setAddProductModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormNameHindi(product.nameHindi || '');
    setFormCategory(product.category);
    setFormPurchasePrice(product.purchasePrice);
    setFormSellingPrice(product.sellingPrice);
    setFormQuantity(product.quantity);
    setFormUnit(product.unit);
    setFormBarcode(product.barcode);
    setFormSupplierName(product.supplierName || '');
    setFormLowStockThreshold(product.lowStockThreshold || 5);
    setFormError(null);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) {
      setFormError('Product name is required');
      return;
    }
    if (formPurchasePrice === '' || formPurchasePrice < 0) {
      setFormError('Please enter a valid purchase price');
      return;
    }
    if (formSellingPrice === '' || formSellingPrice < 0) {
      setFormError('Please enter a valid selling price');
      return;
    }
    if (formQuantity === '' || formQuantity < 0) {
      setFormError('Please enter initial stock quantity');
      return;
    }

    const payload = {
      name: formName.trim(),
      nameHindi: formNameHindi.trim() || undefined,
      category: formCategory,
      purchasePrice: Number(formPurchasePrice),
      sellingPrice: Number(formSellingPrice),
      quantity: Number(formQuantity),
      unit: formUnit,
      barcode: formBarcode.trim() || ('890' + Date.now().toString().slice(-7)),
      supplierName: formSupplierName.trim() || undefined,
      lowStockThreshold: Number(formLowStockThreshold) || 5,
    };

    if (editingProduct) {
      const res = updateProduct(editingProduct.id, payload);
      if (!res.success) {
        setFormError(res.error || 'Failed to update product');
        return;
      }
      setEditingProduct(null);
    } else {
      const res = addProduct(payload);
      if (!res.success) {
        setFormError(res.error || 'Failed to add product');
        return;
      }
      setAddProductModalOpen(false);
    }
    resetForm();
  };

  const handleSaveAdjustment = () => {
    if (!adjustingProduct || adjustmentQty === 0) return;
    adjustStock(adjustingProduct.id, adjustmentQty, adjustmentReason || 'Manual Inventory Adjustment');
    setAdjustingProduct(null);
    setAdjustmentQty(0);
    setAdjustmentReason('');
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.nameHindi && p.nameHindi.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.barcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.supplierName && p.supplierName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesLowStock = !filterLowStockOnly || p.quantity <= p.lowStockThreshold;

    return matchesSearch && matchesCat && matchesLowStock;
  });

  const totalValuation = calculateTotalStockValue(products);
  const lowStockCount = products.filter((p) => p.quantity <= p.lowStockThreshold).length;

  return (
    <div className="space-y-4 pb-24">
      {/* Top Header & Metrics Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {t.stockTitle}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Total Valuation: <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatINR(totalValuation)}</span> • {products.length} products
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleOpenAdd}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addProduct}</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs: Products Catalog, Movement Logs, Barcode Label Sheet */}
      <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-bold self-start inline-flex">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-3 py-1.5 rounded-lg transition ${
            activeTab === 'products'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          {t.totalProducts} ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('movements')}
          className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1 ${
            activeTab === 'movements'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>{t.movementHistory}</span>
        </button>
        <button
          onClick={() => setActiveTab('barcodes')}
          className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1 ${
            activeTab === 'barcodes'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Barcode className="w-3.5 h-3.5" />
          <span>{t.printBarcodes}</span>
        </button>
      </div>

      {activeTab === 'products' && (
        <div className="space-y-3">
          {/* Search & Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <div className="sm:col-span-7 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchProductPlaceholder}
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="sm:col-span-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-white font-medium"
              >
                <option value="All">{t.allCategories}</option>
                <option value="Grocery & Staples">Grocery & Staples</option>
                <option value="Snacks & Beverages">Snacks & Beverages</option>
                <option value="Personal Care">Personal Care</option>
                <option value="Dairy & Bakery">Dairy & Bakery</option>
                <option value="Household & Cleaning">Household & Cleaning</option>
                <option value="General">General Goods</option>
              </select>
            </div>

            <div className="sm:col-span-2 flex items-center">
              <button
                onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
                className={`w-full py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1 transition ${
                  filterLowStockOnly
                    ? 'bg-amber-500 text-white border-amber-600'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Low ({lowStockCount})</span>
              </button>
            </div>
          </div>

          {/* Products Table / Cards */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3 text-right">Cost (CP)</th>
                    <th className="py-3 px-3 text-right">MRP (SP)</th>
                    <th className="py-3 px-3 text-center">Available Stock</th>
                    <th className="py-3 px-3 text-right">Total Value</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {filteredProducts.map((prod) => {
                    const isOutOfStock = prod.quantity <= 0;
                    const isLowStock = prod.quantity <= prod.lowStockThreshold && !isOutOfStock;
                    const stockVal = prod.quantity * prod.purchasePrice;
                    const margin = prod.sellingPrice > prod.purchasePrice
                      ? Math.round(((prod.sellingPrice - prod.purchasePrice) / prod.sellingPrice) * 100)
                      : 0;

                    return (
                      <tr
                        key={prod.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                      >
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {prod.name}
                          </div>
                          {prod.nameHindi && (
                            <div className="text-[11px] text-slate-400">
                              {prod.nameHindi}
                            </div>
                          )}
                          <div className="text-[10px] font-mono text-slate-400 flex items-center space-x-1 mt-0.5">
                            <Barcode className="w-3 h-3" />
                            <span>{prod.barcode}</span>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {prod.category}
                          </span>
                          {prod.supplierName && (
                            <div className="text-[10px] text-slate-400 mt-1 truncate max-w-[120px]">
                              {prod.supplierName}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right font-medium text-slate-600 dark:text-slate-400">
                          {formatINR(prod.purchasePrice)}
                        </td>

                        <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                          <div>{formatINR(prod.sellingPrice)}</div>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            {margin}% margin
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex items-center space-x-1">
                            {isOutOfStock ? (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                                0 {prod.unit}
                              </span>
                            ) : isLowStock ? (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                {prod.quantity} {prod.unit} (Low)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                                {prod.quantity} {prod.unit}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                          {formatINR(stockVal)}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            {/* Adjust stock button */}
                            <button
                              onClick={() => {
                                setAdjustingProduct(prod);
                                setAdjustmentQty(0);
                                setAdjustmentReason('');
                              }}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                              title={t.adjustStock}
                            >
                              <ArrowUpDown className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit product button */}
                            <button
                              onClick={() => handleOpenEdit(prod)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                              title={t.editProduct}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete product button */}
                            <button
                              onClick={() => setProductToDelete(prod)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-400"
                              title={t.delete}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Movement History Tab */}
      {activeTab === 'movements' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-1.5">
            <History className="w-4 h-4 text-emerald-500" />
            <span>Audit Trail & Stock In/Out Log</span>
          </h3>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {stockMovements.map((mov) => {
              const isPositive = mov.quantityChange > 0;
              return (
                <div key={mov.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {mov.productName}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {new Date(mov.date).toLocaleDateString('en-IN')} {new Date(mov.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} • {mov.reason}
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`font-black text-xs px-2 py-0.5 rounded-md ${
                        isPositive
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
                      }`}
                    >
                      {isPositive ? `+${mov.quantityChange}` : mov.quantityChange}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Bal: {mov.finalQuantity}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Barcode Sticker Label Sheet Generator */}
      {activeTab === 'barcodes' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Barcode Stickers for Retail Shelves & Packaging
              </h3>
              <p className="text-xs text-slate-400">
                Ready to print on adhesive sticker sheets
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Sheet</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {products.map((p) => (
              <div
                key={p.id}
                className="p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white text-black text-center space-y-1"
              >
                <div className="font-bold text-[11px] truncate">{p.name}</div>
                <div
                  className="w-full h-8 flex items-center justify-center my-1"
                  dangerouslySetInnerHTML={{
                    __html: renderBarcodeSvg(p.barcode, 28),
                  }}
                />
                <div className="text-[10px] font-mono tracking-widest">{p.barcode}</div>
                <div className="text-xs font-black text-emerald-700">
                  MRP: {formatINR(p.sellingPrice)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADD / EDIT PRODUCT MODAL */}
      {(addProductModalOpen || editingProduct) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {editingProduct ? t.editProduct : t.addProduct}
              </h3>
              <button
                onClick={() => {
                  setAddProductModalOpen(false);
                  setEditingProduct(null);
                  resetForm();
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {t.productName} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fortune Refined Sunflower Oil 1L"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-500 block mb-1">
                  Name in Hindi (optional)
                </label>
                <input
                  type="text"
                  placeholder="उदा. फॉर्च्यून रिफाइंड तेल"
                  value={formNameHindi}
                  onChange={(e) => setFormNameHindi(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {t.category}
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ProductCategory)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white font-medium"
                  >
                    <option value="Grocery & Staples">Grocery & Staples</option>
                    <option value="Snacks & Beverages">Snacks & Beverages</option>
                    <option value="Personal Care">Personal Care</option>
                    <option value="Dairy & Bakery">Dairy & Bakery</option>
                    <option value="Household & Cleaning">Household & Cleaning</option>
                    <option value="General">General Goods</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {t.unit}
                  </label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value as UnitType)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white font-medium"
                  >
                    <option value="pcs">{t.unit_pcs}</option>
                    <option value="packet">{t.unit_packet}</option>
                    <option value="kg">{t.unit_kg}</option>
                    <option value="g">{t.unit_g}</option>
                    <option value="l">{t.unit_l}</option>
                    <option value="ml">{t.unit_ml}</option>
                    <option value="box">{t.unit_box}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {t.purchasePrice} (₹) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 110"
                    value={formPurchasePrice}
                    onChange={(e) => setFormPurchasePrice(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {t.sellingPrice} (₹) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 140"
                    value={formSellingPrice}
                    onChange={(e) => setFormSellingPrice(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {t.quantity} ({formUnit}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 50"
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {t.lowStockThreshold}
                  </label>
                  <input
                    type="number"
                    placeholder="Alert below"
                    value={formLowStockThreshold}
                    onChange={(e) => setFormLowStockThreshold(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white font-medium"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    {t.barcode}
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormBarcode('890' + Math.floor(1000000 + Math.random() * 9000000))}
                    className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                  >
                    Generate Random
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Scan or type barcode"
                  value={formBarcode}
                  onChange={(e) => setFormBarcode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-500 block mb-1">
                  {t.supplierName} (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Adani Wilmar Distributorship"
                  value={formSupplierName}
                  onChange={(e) => setFormSupplierName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white font-medium"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setAddProductModalOpen(false);
                    setEditingProduct(null);
                    resetForm();
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20"
                >
                  {t.saveProduct}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK ADJUST STOCK MODAL */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-3">
            <h3 className="font-black text-sm text-slate-900 dark:text-white">
              {t.adjustStock}
            </h3>
            <p className="text-xs text-slate-500">
              {adjustingProduct.name} • Current: <span className="font-bold text-slate-900 dark:text-white">{adjustingProduct.quantity} {adjustingProduct.unit}</span>
            </p>

            <div className="space-y-2 text-xs">
              <div>
                <label className="font-bold block mb-1">{t.adjustQuantity}</label>
                <input
                  type="number"
                  placeholder="e.g. +10 or -5"
                  value={adjustmentQty || ''}
                  onChange={(e) => setAdjustmentQty(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  New stock will be: {Math.max(0, adjustingProduct.quantity + adjustmentQty)} {adjustingProduct.unit}
                </span>
              </div>

              <div>
                <label className="font-bold block mb-1">{t.adjustmentReason}</label>
                <input
                  type="text"
                  placeholder="e.g. Restock from godown / Damaged packet"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setAdjustingProduct(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleSaveAdjustment}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs"
              >
                Apply Adjustment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-3">
            <h3 className="font-black text-sm text-slate-900 dark:text-white">
              Delete Product
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {t.confirmDeleteProduct}
            </p>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 font-bold text-xs">
              {productToDelete.name}
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setProductToDelete(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
              >
                {t.cancel}
              </button>
              <button
                onClick={() => {
                  deleteProduct(productToDelete.id);
                  setProductToDelete(null);
                }}
                className="px-4 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs"
              >
                {t.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
