import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  PlusCircle, 
  Trash2, 
  Save, 
  Building2, 
  Calendar, 
  User, 
  Phone, 
  Package, 
  Layers, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';
import { SalesHeader } from './SalesHeader';
import { salesService } from '../../services/salesService';
import { SalesProductItem, PaymentStatus } from '../../types/sales';
import { dbService } from '../../services/dbService';

export const AddSales: React.FC = () => {
  const navigate = useNavigate();

  // Form State
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [companyName, setCompanyName] = useState('');
  const [contactPersonName, setContactPersonName] = useState('');
  const [contactPersonNumber, setContactPersonNumber] = useState('');
  
  // Multiple Products (written/typed directly)
  const [products, setProducts] = useState<SalesProductItem[]>([
    {
      id: `p-${Date.now()}-0`,
      name: '',
      unit_price: 0,
      quantity: 1,
      subtotal: 0,
    },
  ]);

  // SaaS Package (typed directly)
  const [saasPackage, setSaasPackage] = useState('');
  const [saasPackagePrice, setSaasPackagePrice] = useState<number>(0);
  
  // Financials & Sold By (loaded from setting assigned persons)
  const [discount, setDiscount] = useState<number>(0);
  const [assignedPersons, setAssignedPersons] = useState<string[]>([]);
  const [soldBy, setSoldBy] = useState('');
  const [customRep, setCustomRep] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Paid');
  const [notes, setNotes] = useState('');

  // UI state
  const [companySuggestions, setCompanySuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<{ id: string; sale_id: string } | null>(null);

  // Load assigned persons from settings and client names from issues/db
  useEffect(() => {
    // 1. Fetch assigned persons configured in Settings
    dbService.getSettingsByCategory('assigned_person').then((items) => {
      const names = items.map((i) => i.name).filter(Boolean);
      if (names.length > 0) {
        setAssignedPersons(names);
        setSoldBy((prev) => prev || names[0]);
      } else {
        const fallback = ['Fuad', 'Rahat', 'Foysal', 'Taqi', 'Fariha'];
        setAssignedPersons(fallback);
        setSoldBy((prev) => prev || fallback[0]);
      }
    }).catch(() => {
      const fallback = ['Fuad', 'Rahat', 'Foysal', 'Taqi', 'Fariha'];
      setAssignedPersons(fallback);
      setSoldBy((prev) => prev || fallback[0]);
    });

    // 2. Client autocomplete suggestions
    dbService.getIssues().then((issues) => {
      const names = Array.from(new Set(issues.map((i) => i.client_name).filter(Boolean)));
      setCompanySuggestions(names as string[]);
    }).catch(() => {});
  }, []);

  // Product Row Handlers
  const handleAddProductRow = () => {
    const newId = `p-${Date.now()}-${products.length}`;
    setProducts([
      ...products,
      {
        id: newId,
        name: '',
        unit_price: 0,
        quantity: 1,
        subtotal: 0,
      },
    ]);
  };

  const handleRemoveProductRow = (index: number) => {
    if (products.length <= 1) {
      // Keep at least one row, just reset it
      setProducts([
        {
          id: `p-${Date.now()}-0`,
          name: '',
          unit_price: 0,
          quantity: 1,
          subtotal: 0,
        },
      ]);
      return;
    }
    const updated = products.filter((_, i) => i !== index);
    setProducts(updated);
  };

  const handleProductChange = (index: number, field: keyof SalesProductItem, value: any) => {
    const updated = [...products];
    const item = { ...updated[index] };

    if (field === 'name') {
      item.name = value;
    } else if (field === 'unit_price') {
      item.unit_price = Math.max(0, Number(value) || 0);
    } else if (field === 'quantity') {
      item.quantity = Math.max(1, Number(value) || 1);
    }

    item.subtotal = item.unit_price * item.quantity;
    updated[index] = item;
    setProducts(updated);
  };

  // Calculations
  const productsTotal = products.reduce((sum, p) => sum + (p.subtotal || 0), 0);
  const totalItemsCount = products.reduce((sum, p) => sum + (p.quantity || 0), 0);
  const finalTotalValue = Math.max(0, productsTotal + saasPackagePrice - (discount || 0));

  // Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!companyName.trim()) {
      setError('Please provide the Company Name.');
      return;
    }
    if (!contactPersonName.trim()) {
      setError('Please provide Contact Person Name.');
      return;
    }
    if (!contactPersonNumber.trim()) {
      setError('Please provide Contact Person Phone Number.');
      return;
    }

    const validProducts = products.filter((p) => p.name.trim().length > 0);
    if (validProducts.length === 0) {
      setError('Please add at least one product with name, price, and quantity.');
      return;
    }

    if (!soldBy.trim() || (soldBy === 'Other' && !customRep.trim())) {
      setError('Please select who made this sale (Sold By).');
      return;
    }

    const finalSoldBy = soldBy === 'Other' ? (customRep.trim() || 'Custom Rep') : soldBy;

    try {
      const created = salesService.addSale({
        date,
        company_name: companyName,
        contact_person_name: contactPersonName,
        contact_person_number: contactPersonNumber,
        products: validProducts,
        saas_package: saasPackage,
        saas_package_price: saasPackagePrice,
        discount: Number(discount) || 0,
        total_value: finalTotalValue,
        sold_by: finalSoldBy,
        payment_status: paymentStatus,
        notes,
      });

      setSuccessNotice({ id: created.id, sale_id: created.sale_id });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err?.message || 'Failed to save sales record.');
    }
  };

  const handleReset = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setCompanyName('');
    setContactPersonName('');
    setContactPersonNumber('');
    setProducts([
      {
        id: `p-${Date.now()}-0`,
        name: '',
        unit_price: 0,
        quantity: 1,
        subtotal: 0,
      },
    ]);
    setSaasPackage('');
    setSaasPackagePrice(0);
    setDiscount(0);
    setSoldBy(assignedPersons[0] || '');
    setCustomRep('');
    setPaymentStatus('Paid');
    setNotes('');
    setError(null);
    setSuccessNotice(null);
  };

  const filteredCompanySuggestions = companySuggestions.filter((c) =>
    companyName.trim() && c.toLowerCase().includes(companyName.toLowerCase().trim())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-300">
      <SalesHeader />

      {/* Success Notification Banner */}
      {successNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in zoom-in-95 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
                Sale Recorded Successfully! ({successNotice.sale_id})
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                The transaction of ৳{finalTotalValue.toLocaleString()} has been added to the sales registry.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors"
            >
              + Add Another Sale
            </button>
            <Link
              to="/sales/report"
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-1 shadow-xs"
            >
              <span>View in Sales Report</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5 animate-shake">
          <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Entry Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column (2 Cols): Client & Order Information */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. Client & Deal Metadata Card */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Building2 size={18} className="text-emerald-600 dark:text-emerald-400" />
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    1. Client & Contact Details
                  </h2>
                </div>
                <span className="text-[11px] text-slate-400">All fields required *</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Sale Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Sale Date *
                  </label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900 dark:text-white font-medium"
                      required
                    />
                  </div>
                </div>

                {/* Company Name with Suggestions */}
                <div className="relative">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => {
                      setCompanyName(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="e.g. Apex Footwear Ltd."
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900 dark:text-white font-medium"
                    required
                  />

                  {/* Company Suggestions dropdown */}
                  {showSuggestions && filteredCompanySuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredCompanySuggestions.map((name) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => {
                            setCompanyName(name);
                            setShowSuggestions(false);
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between"
                        >
                          <span>{name}</span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Select</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Contact Person Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Contact Person Name *
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={contactPersonName}
                      onChange={(e) => setContactPersonName(e.target.value)}
                      placeholder="e.g. Tanvir Hossain (Admin Manager)"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900 dark:text-white"
                      required
                    />
                  </div>
                </div>

                {/* Contact Person Phone Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Contact Person Number *
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={contactPersonNumber}
                      onChange={(e) => setContactPersonNumber(e.target.value)}
                      placeholder="e.g. +880 1711-234567"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900 dark:text-white font-mono"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Multiple Products Section (Repeatable Rows) */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Package size={18} className="text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    2. Product Items (Multiple Products)
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {products.length} Item{products.length > 1 ? 's' : ''} ({totalItemsCount} Qty total)
                  </span>
                  <button
                    type="button"
                    onClick={handleAddProductRow}
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors"
                  >
                    <PlusCircle size={13} />
                    <span>+ Add Product Row</span>
                  </button>
                </div>
              </div>

              {/* Product Rows List */}
              <div className="space-y-3">
                {products.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Item #{idx + 1}
                      </span>
                      {products.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveProductRow(idx)}
                          className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 font-medium transition-colors"
                          title="Remove item"
                        >
                          <Trash2 size={13} />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                      {/* Product Name (written/typed directly, no dropdown) */}
                      <div className="sm:col-span-6">
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                          Product Name *
                        </label>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleProductChange(idx, 'name', e.target.value)}
                          placeholder="Enter product name"
                          className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                          required
                        />
                      </div>

                      {/* Unit Price (kon product ar koto dam) */}
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                          Price (BDT) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={item.unit_price}
                          onChange={(e) => handleProductChange(idx, 'unit_price', e.target.value)}
                          placeholder="Price"
                          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                          required
                        />
                      </div>

                      {/* Quantity (qty) */}
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                          Qty *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleProductChange(idx, 'quantity', e.target.value)}
                          placeholder="Qty"
                          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                          required
                        />
                      </div>

                      {/* Subtotal */}
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                          Subtotal
                        </label>
                        <div className="px-2.5 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white font-mono text-right truncate">
                          ৳{(item.subtotal || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Row Button under table */}
              <button
                type="button"
                onClick={handleAddProductRow}
                className="w-full py-2 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center justify-center gap-1.5"
              >
                <PlusCircle size={14} />
                <span>+ Add Another Product Item</span>
              </button>
            </div>

            {/* 3. SaaS Package & Plan Details (written/typed directly, no dropdown) */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <Layers size={18} className="text-teal-600 dark:text-teal-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  3. SaaS Package & Plan
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    SaaS Package
                  </label>
                  <input
                    type="text"
                    value={saasPackage}
                    onChange={(e) => setSaasPackage(e.target.value)}
                    placeholder="Enter SaaS package (e.g. Starter, Professional, Enterprise)"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Package Fee (BDT)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={saasPackagePrice}
                    onChange={(e) => setSaasPackagePrice(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* 4. Sales Representative & Payment Status */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <CreditCard size={18} className="text-amber-600 dark:text-amber-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  4. Sales Representative & Payment Status
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Sold By */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Sold By *
                  </label>
                  <select
                    value={soldBy}
                    onChange={(e) => setSoldBy(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    required
                  >
                    {assignedPersons.length === 0 ? (
                      <option value="" disabled>Loading assigned persons...</option>
                    ) : (
                      assignedPersons.map((name) => (
                        <option key={name} value={name} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                          {name}
                        </option>
                      ))
                    )}
                    <option value="Other" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      Other / Custom Name
                    </option>
                  </select>

                  {soldBy === 'Other' && (
                    <input
                      type="text"
                      value={customRep}
                      onChange={(e) => setCustomRep(e.target.value)}
                      placeholder="Type sales agent name"
                      className="mt-2 w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                      required
                    />
                  )}
                </div>

                {/* Payment Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Payment Status
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  >
                    <option value="Paid" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Paid (Full)</option>
                    <option value="Partial" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Partial (Advance)</option>
                    <option value="Pending" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Pending Approval</option>
                    <option value="Due" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Due (Unpaid)</option>
                  </select>
                </div>

                {/* Discount */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Discount (BDT)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Deal Notes & Implementation Scope
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. 50% advance received, installation scheduled for next Monday..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white resize-none focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Right Column (1 Col): Live Calculation & Summary Card */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm sticky top-20 space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <Sparkles size={18} className="text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Order Total Summary
                </h3>
              </div>

              {/* Breakdown */}
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Products Subtotal ({products.length} line items):</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">
                    ৳{productsTotal.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>SaaS Package Fee:</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">
                    + ৳{saasPackagePrice.toLocaleString()}
                  </span>
                </div>

                {discount > 0 && (
                  <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
                    <span>Discount applied:</span>
                    <span className="font-mono font-semibold">
                      - ৳{discount.toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 block">
                      Total Deal Value
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold">
                      Auto-calculated net value
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      ৳{finalTotalValue.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deal Metadata Snapshot */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60 space-y-2 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Representative:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {soldBy === 'Other' ? (customRep || 'Other') : soldBy}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Payment Status:</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold ${
                    paymentStatus === 'Paid'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : paymentStatus === 'Partial'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      : paymentStatus === 'Due'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                  }`}>
                    {paymentStatus}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Selected SaaS:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                    {saasPackage}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <Save size={16} />
                  <span>Save & Record Sale (৳{finalTotalValue.toLocaleString()})</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RotateCcw size={14} />
                  <span>Reset Form</span>
                </button>
              </div>

              <div className="flex items-start gap-2 text-[11px] text-slate-400 bg-slate-50/50 dark:bg-slate-800/30 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                <Info size={13} className="shrink-0 mt-0.5 text-indigo-500" />
                <span>
                  Adding a sale will automatically update the Sales Dashboard and provide an itemized receipt in the Sales Report.
                </span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
