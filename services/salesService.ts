import { SalesRecord, SalesProductItem, SalesMetrics, PaymentStatus } from '../types/sales';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';

const STORAGE_KEY = 'app_sales_records_v1';

export const SALES_TABLE_SQL = `-- 1. Create the sales table in Supabase
CREATE TABLE IF NOT EXISTS public.sales (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    sale_id TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    company_name TEXT NOT NULL,
    contact_person_name TEXT NOT NULL,
    contact_person_number TEXT NOT NULL,
    products JSONB NOT NULL DEFAULT '[]'::jsonb,
    saas_package TEXT DEFAULT 'None (Hardware Only)',
    saas_package_price NUMERIC(12, 2) DEFAULT 0,
    discount NUMERIC(12, 2) DEFAULT 0,
    total_value NUMERIC(12, 2) DEFAULT 0,
    sold_by TEXT NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'Paid',
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies to allow read, insert, update, delete for public anon & authenticated users
CREATE POLICY "Allow anon and auth read on sales" 
    ON public.sales FOR SELECT 
    TO anon, authenticated 
    USING (true);

CREATE POLICY "Allow anon and auth insert on sales" 
    ON public.sales FOR INSERT 
    TO anon, authenticated 
    WITH CHECK (true);

CREATE POLICY "Allow anon and auth update on sales" 
    ON public.sales FOR UPDATE 
    TO anon, authenticated 
    USING (true);

CREATE POLICY "Allow anon and auth delete on sales" 
    ON public.sales FOR DELETE 
    TO anon, authenticated 
    USING (true);

-- 4. Create Indexes for faster searches and metrics
CREATE INDEX IF NOT EXISTS idx_sales_date ON public.sales (date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_sale_id ON public.sales (sale_id);
CREATE INDEX IF NOT EXISTS idx_sales_company ON public.sales (company_name);
CREATE INDEX IF NOT EXISTS idx_sales_sold_by ON public.sales (sold_by);
CREATE INDEX IF NOT EXISTS idx_sales_payment_status ON public.sales (payment_status);`;

function mapRecordToDbRow(record: SalesRecord) {
  return {
    id: record.id,
    sale_id: record.sale_id,
    date: record.date || new Date().toISOString().split('T')[0],
    company_name: record.company_name,
    contact_person_name: record.contact_person_name,
    contact_person_number: record.contact_person_number,
    products: record.products || [],
    saas_package: record.saas_package || 'None (Hardware Only)',
    saas_package_price: Number(record.saas_package_price) || 0,
    discount: Number(record.discount) || 0,
    total_value: Number(record.total_value) || 0,
    sold_by: record.sold_by,
    payment_status: record.payment_status || 'Paid',
    notes: record.notes || '',
    created_at: record.created_at || new Date().toISOString(),
    updated_at: record.updated_at || new Date().toISOString(),
  };
}

function mapDbRowToRecord(row: any): SalesRecord {
  return {
    id: String(row.id),
    sale_id: row.sale_id || `SL-${row.id}`,
    date: row.date ? String(row.date).split('T')[0] : new Date().toISOString().split('T')[0],
    company_name: row.company_name || '',
    contact_person_name: row.contact_person_name || '',
    contact_person_number: row.contact_person_number || '',
    products: Array.isArray(row.products)
      ? row.products.map((p: any) => ({
          id: p.id || `p-${Date.now()}`,
          name: p.name || '',
          unit_price: Number(p.unit_price) || 0,
          quantity: Number(p.quantity) || 1,
          subtotal: Number(p.subtotal) || (Number(p.unit_price) || 0) * (Number(p.quantity) || 1),
        }))
      : (typeof row.products === 'string' ? JSON.parse(row.products || '[]') : []),
    saas_package: row.saas_package || 'None (Hardware Only)',
    saas_package_price: Number(row.saas_package_price) || 0,
    discount: Number(row.discount) || 0,
    total_value: Number(row.total_value) || 0,
    sold_by: row.sold_by || '',
    payment_status: (row.payment_status as PaymentStatus) || 'Paid',
    notes: row.notes || '',
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString(),
  };
}

export const POPULAR_PRODUCTS = [
  { name: 'Biometric Attendance Device (IN-Bio 400)', defaultPrice: 16500 },
  { name: 'Face Recognition Terminal (FacePass Pro)', defaultPrice: 28500 },
  { name: 'RFID Smart Cards (Pack of 100)', defaultPrice: 3500 },
  { name: 'Access Control Magnetic Door Lock Kit', defaultPrice: 8500 },
  { name: 'Cloud HRM & Payroll Software License', defaultPrice: 45000 },
  { name: 'Mobile Attendance App Addon (Android/iOS)', defaultPrice: 12000 },
  { name: 'GPS Vehicle Tracking Device (Fleet Pro)', defaultPrice: 6500 },
  { name: 'Thermal Receipt / Token Printer', defaultPrice: 9500 },
  { name: 'Annual Maintenance Contract (AMC)', defaultPrice: 24000 },
  { name: 'On-site Installation & Training Package', defaultPrice: 8000 },
];

export const SAAS_PACKAGES = [
  { name: 'Starter (Up to 50 Users)', price: 3500 },
  { name: 'Professional (Up to 250 Users)', price: 8500 },
  { name: 'Enterprise (Unlimited Users)', price: 18000 },
  { name: 'Custom Enterprise Suite', price: 35000 },
  { name: 'None (Hardware Only)', price: 0 },
];

export const SALES_REPRESENTATIVES = [
  'Fuad',
  'Rahat',
  'Foysal',
  'Taqi',
  'Fariha',
];

const INITIAL_SALES: SalesRecord[] = [
  {
    id: 'sale-001',
    sale_id: 'SL-2026-001',
    date: '2026-03-02',
    company_name: 'Apex Footwear Ltd.',
    contact_person_name: 'Tanvir Hossain',
    contact_person_number: '+880 1711-456789',
    products: [
      {
        id: 'p-1',
        name: 'Face Recognition Terminal (FacePass Pro)',
        unit_price: 28500,
        quantity: 2,
        subtotal: 57000,
      },
      {
        id: 'p-2',
        name: 'RFID Smart Cards (Pack of 100)',
        unit_price: 3500,
        quantity: 5,
        subtotal: 17500,
      },
    ],
    saas_package: 'Enterprise (Unlimited Users)',
    saas_package_price: 18000,
    discount: 2500,
    total_value: 90000,
    sold_by: 'Fuad',
    payment_status: 'Paid',
    notes: 'Full deployment done across Gazipur factory premises.',
    created_at: '2026-03-02T10:15:00Z',
    updated_at: '2026-03-02T10:15:00Z',
  },
  {
    id: 'sale-002',
    sale_id: 'SL-2026-002',
    date: '2026-03-08',
    company_name: 'Beximco Pharma Ltd.',
    contact_person_name: 'Dr. Shahinur Alam',
    contact_person_number: '+880 1819-234567',
    products: [
      {
        id: 'p-3',
        name: 'Biometric Attendance Device (IN-Bio 400)',
        unit_price: 16500,
        quantity: 4,
        subtotal: 66000,
      },
      {
        id: 'p-4',
        name: 'Access Control Magnetic Door Lock Kit',
        unit_price: 8500,
        quantity: 4,
        subtotal: 34000,
      },
    ],
    saas_package: 'Professional (Up to 250 Users)',
    saas_package_price: 8500,
    discount: 3500,
    total_value: 105000,
    sold_by: 'Rahat',
    payment_status: 'Paid',
    notes: 'Tongie facility access control expansion.',
    created_at: '2026-03-08T14:30:00Z',
    updated_at: '2026-03-08T14:30:00Z',
  },
  {
    id: 'sale-003',
    sale_id: 'SL-2026-003',
    date: '2026-03-15',
    company_name: 'Square Textiles PLC',
    contact_person_name: 'Khandaker Rafiq',
    contact_person_number: '+880 1912-987654',
    products: [
      {
        id: 'p-5',
        name: 'Cloud HRM & Payroll Software License',
        unit_price: 45000,
        quantity: 1,
        subtotal: 45000,
      },
      {
        id: 'p-6',
        name: 'Mobile Attendance App Addon (Android/iOS)',
        unit_price: 12000,
        quantity: 1,
        subtotal: 12000,
      },
      {
        id: 'p-7',
        name: 'On-site Installation & Training Package',
        unit_price: 8000,
        quantity: 1,
        subtotal: 8000,
      },
    ],
    saas_package: 'Enterprise (Unlimited Users)',
    saas_package_price: 18000,
    discount: 5000,
    total_value: 78000,
    sold_by: 'Foysal',
    payment_status: 'Partial',
    notes: 'Advance 50% paid, remaining after UAT approval.',
    created_at: '2026-03-15T09:00:00Z',
    updated_at: '2026-03-15T09:00:00Z',
  },
  {
    id: 'sale-004',
    sale_id: 'SL-2026-004',
    date: '2026-03-21',
    company_name: 'Akij Food & Beverage Ltd.',
    contact_person_name: 'Mohammad Faruk',
    contact_person_number: '+880 1613-445566',
    products: [
      {
        id: 'p-8',
        name: 'GPS Vehicle Tracking Device (Fleet Pro)',
        unit_price: 6500,
        quantity: 8,
        subtotal: 52000,
      },
    ],
    saas_package: 'Custom Enterprise Suite',
    saas_package_price: 25000,
    discount: 2000,
    total_value: 75000,
    sold_by: 'Taqi',
    payment_status: 'Paid',
    notes: 'Distribution truck tracking rollout.',
    created_at: '2026-03-21T11:45:00Z',
    updated_at: '2026-03-21T11:45:00Z',
  },
  {
    id: 'sale-005',
    sale_id: 'SL-2026-005',
    date: '2026-03-28',
    company_name: 'Walton Hi-Tech Industries',
    contact_person_name: 'Engr. Nazmul Haque',
    contact_person_number: '+880 1713-112233',
    products: [
      {
        id: 'p-9',
        name: 'Face Recognition Terminal (FacePass Pro)',
        unit_price: 28500,
        quantity: 3,
        subtotal: 85500,
      },
      {
        id: 'p-10',
        name: 'Annual Maintenance Contract (AMC)',
        unit_price: 24000,
        quantity: 1,
        subtotal: 24000,
      },
    ],
    saas_package: 'Enterprise (Unlimited Users)',
    saas_package_price: 18000,
    discount: 7500,
    total_value: 120000,
    sold_by: 'Fariha',
    payment_status: 'Paid',
    notes: 'Chandra HQ gate upgrade with AMC coverage.',
    created_at: '2026-03-28T16:20:00Z',
    updated_at: '2026-03-28T16:20:00Z',
  },
  {
    id: 'sale-006',
    sale_id: 'SL-2026-006',
    date: '2026-04-02',
    company_name: 'Pran-RFL Group',
    contact_person_name: 'Saiful Islam',
    contact_person_number: '+880 1817-778899',
    products: [
      {
        id: 'p-11',
        name: 'Biometric Attendance Device (IN-Bio 400)',
        unit_price: 16500,
        quantity: 2,
        subtotal: 33000,
      },
      {
        id: 'p-12',
        name: 'RFID Smart Cards (Pack of 100)',
        unit_price: 3500,
        quantity: 2,
        subtotal: 7000,
      },
    ],
    saas_package: 'Starter (Up to 50 Users)',
    saas_package_price: 3500,
    discount: 500,
    total_value: 43000,
    sold_by: 'Fuad',
    payment_status: 'Due',
    notes: 'Invoice generated, net 15 days payment terms.',
    created_at: '2026-04-02T13:10:00Z',
    updated_at: '2026-04-02T13:10:00Z',
  },
  {
    id: 'sale-007',
    sale_id: 'SL-2026-007',
    date: '2026-04-05',
    company_name: 'ACI Logistics (Shwapno)',
    contact_person_name: 'Ferdous Ahmed',
    contact_person_number: '+880 1711-234567',
    products: [
      {
        id: 'p-13',
        name: 'Handheld POS Barcode Scanner (Wireless)',
        unit_price: 8500,
        quantity: 4,
        subtotal: 34000,
      },
    ],
    saas_package: 'Standard (Up to 200 Users)',
    saas_package_price: 7500,
    discount: 0,
    total_value: 41500,
    sold_by: 'Rahat',
    payment_status: 'Paid',
    notes: 'Deployment for 4 new outlet checkout counters.',
    created_at: '2026-04-05T11:00:00Z',
    updated_at: '2026-04-05T11:00:00Z',
  },
  {
    id: 'sale-008',
    sale_id: 'SL-2026-008',
    date: '2026-04-08',
    company_name: 'Beximco Pharmaceuticals',
    contact_person_name: 'Dr. Mahbubur Rahman',
    contact_person_number: '+880 1912-345678',
    products: [
      {
        id: 'p-14',
        name: 'Face Recognition Terminal (FacePass Pro)',
        unit_price: 28500,
        quantity: 2,
        subtotal: 57000,
      },
      {
        id: 'p-15',
        name: 'Smart Access Turnstile Gate (Flap Barrier)',
        unit_price: 85000,
        quantity: 1,
        subtotal: 85000,
      },
    ],
    saas_package: 'Enterprise (Unlimited Users)',
    saas_package_price: 18000,
    discount: 5000,
    total_value: 155000,
    sold_by: 'Foysal',
    payment_status: 'Paid',
    notes: 'Factory main entrance access control installation.',
    created_at: '2026-04-08T15:30:00Z',
    updated_at: '2026-04-08T15:30:00Z',
  },
  {
    id: 'sale-009',
    sale_id: 'SL-2026-009',
    date: '2026-04-10',
    company_name: 'City Bank Limited',
    contact_person_name: 'Tanvir Hasan',
    contact_person_number: '+880 1819-876543',
    products: [
      {
        id: 'p-16',
        name: 'CCTV Security Camera Set (4-Cam NVR)',
        unit_price: 32000,
        quantity: 2,
        subtotal: 64000,
      },
    ],
    saas_package: 'Custom Enterprise Suite',
    saas_package_price: 25000,
    discount: 4000,
    total_value: 85000,
    sold_by: 'Taqi',
    payment_status: 'Partial',
    notes: 'Advance 50% received; balance upon branch rollout.',
    created_at: '2026-04-10T14:15:00Z',
    updated_at: '2026-04-10T14:15:00Z',
  },
  {
    id: 'sale-010',
    sale_id: 'SL-2026-010',
    date: '2026-04-12',
    company_name: 'Aarong / BRAC Enterprises',
    contact_person_name: 'Nusrat Jahan',
    contact_person_number: '+880 1730-998877',
    products: [
      {
        id: 'p-17',
        name: 'Thermal Receipt Printer (80mm USB/LAN)',
        unit_price: 7200,
        quantity: 5,
        subtotal: 36000,
      },
      {
        id: 'p-18',
        name: 'Barcode Label Printer (Desktop)',
        unit_price: 14500,
        quantity: 2,
        subtotal: 29000,
      },
    ],
    saas_package: 'Standard (Up to 200 Users)',
    saas_package_price: 7500,
    discount: 2500,
    total_value: 70000,
    sold_by: 'Fariha',
    payment_status: 'Paid',
    notes: 'Warehouse & billing counter inventory printing equipment.',
    created_at: '2026-04-12T17:00:00Z',
    updated_at: '2026-04-12T17:00:00Z',
  },
];

export const salesService = {
  // Flag to avoid duplicate background fetches on initial mount
  _hasAttemptedDbFetch: false,

  async fetchSalesFromDb(): Promise<SalesRecord[]> {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === 'PGRST205') {
          console.warn("Supabase 'sales' table does not exist yet in schema cache. Please run SQL schema in Supabase SQL Editor.");
        } else {
          console.error('Error fetching sales from Supabase:', error);
        }
        return this.getSales();
      }

      if (data && data.length > 0) {
        const records = data.map(mapDbRowToRecord);
        // Persist fresh data from Supabase to local storage
        this.saveSales(records);
        return records;
      } else if (data && data.length === 0) {
        // Supabase table is empty; if we have local records, keep them
        return this.getSales();
      }
    } catch (err) {
      console.error('Failed to fetch sales from Supabase:', err);
    }
    return this.getSales();
  },

  async saveToSupabase(record: SalesRecord): Promise<{ success: boolean; error?: string; isTableMissing?: boolean }> {
    try {
      const payload = mapRecordToDbRow(record);
      const { error } = await supabase
        .from('sales')
        .insert([payload]);

      if (error) {
        console.warn('Supabase sales insert response:', error);
        return {
          success: false,
          error: error.message,
          isTableMissing: error.code === 'PGRST205',
        };
      }

      return { success: true };
    } catch (err: any) {
      console.error('Supabase sales save exception:', err);
      return {
        success: false,
        error: err?.message || 'Unexpected network or database error',
      };
    }
  },

  async updateInSupabase(record: SalesRecord): Promise<void> {
    try {
      const payload = mapRecordToDbRow(record);
      const { error } = await supabase
        .from('sales')
        .update(payload)
        .eq('id', record.id);

      if (error && error.code !== 'PGRST205') {
        console.error('Error updating sale in Supabase:', error);
      }
    } catch (err) {
      console.error('Exception updating sale in Supabase:', err);
    }
  },

  async deleteFromSupabase(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('sales')
        .delete()
        .or(`id.eq.${id},sale_id.eq.${id}`);

      if (error && error.code !== 'PGRST205') {
        console.error('Error deleting sale from Supabase:', error);
      }
    } catch (err) {
      console.error('Exception deleting sale from Supabase:', err);
    }
  },

  async syncLocalToSupabase(): Promise<{ synced: number; error?: string; isTableMissing?: boolean }> {
    try {
      const current = this.getSales();
      if (current.length === 0) return { synced: 0 };

      const payloads = current.map(mapRecordToDbRow);
      const { error } = await supabase
        .from('sales')
        .upsert(payloads, { onConflict: 'id' });

      if (error) {
        return {
          synced: 0,
          error: error.message,
          isTableMissing: error.code === 'PGRST205',
        };
      }

      return { synced: current.length };
    } catch (err: any) {
      return { synced: 0, error: err?.message };
    }
  },

  getSales(): SalesRecord[] {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) {
            // Trigger one background fetch from Supabase on first call in session
            if (!this._hasAttemptedDbFetch) {
              this._hasAttemptedDbFetch = true;
              this.fetchSalesFromDb().catch(() => {});
            }

            if (parsed.length >= 10) {
              return parsed;
            }
            // Merge missing initial sales if fewer than 10
            const existingIds = new Set(parsed.map((p: any) => p.id || p.sale_id));
            const combined = [...parsed];
            for (const item of INITIAL_SALES) {
              if (!existingIds.has(item.id) && !existingIds.has(item.sale_id)) {
                combined.push(item);
              }
            }
            this.saveSales(combined);
            return combined;
          }
        }
      }
    } catch (e) {
      console.error('Failed to load sales from storage', e);
    }
    // Seed initial sales
    this.saveSales(INITIAL_SALES);
    if (!this._hasAttemptedDbFetch && typeof window !== 'undefined') {
      this._hasAttemptedDbFetch = true;
      this.fetchSalesFromDb().catch(() => {});
    }
    return INITIAL_SALES;
  },

  saveSales(sales: SalesRecord[]): void {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sales));
        window.dispatchEvent(new CustomEvent('sales-updated'));
      }
    } catch (e) {
      console.error('Failed to save sales to storage', e);
    }
  },

  getSaleById(id: string): SalesRecord | undefined {
    const list = this.getSales();
    return list.find((s) => s.id === id || s.sale_id === id);
  },

  addSale(saleData: {
    date: string;
    company_name: string;
    contact_person_name: string;
    contact_person_number: string;
    products: SalesProductItem[];
    saas_package: string;
    saas_package_price?: number;
    discount?: number;
    total_value?: number;
    sold_by: string;
    payment_status: 'Paid' | 'Partial' | 'Pending' | 'Due';
    notes?: string;
  }): SalesRecord {
    const current = this.getSales();
    const id = `sale-${Date.now()}`;
    const year = saleData.date ? saleData.date.substring(0, 4) : new Date().getFullYear();
    const count = current.length + 1;
    const sale_id = `SL-${year}-${String(count).padStart(3, '0')}`;

    // Calculate product subtotals if not present
    const productsWithSubtotal = (saleData.products || []).map((p, idx) => ({
      id: p.id || `p-${Date.now()}-${idx}`,
      name: p.name.trim(),
      unit_price: Number(p.unit_price) || 0,
      quantity: Number(p.quantity) || 1,
      subtotal: (Number(p.unit_price) || 0) * (Number(p.quantity) || 1),
    }));

    const productsSum = productsWithSubtotal.reduce((acc, p) => acc + p.subtotal, 0);
    const saasPrice = Number(saleData.saas_package_price) || 0;
    const discount = Number(saleData.discount) || 0;
    const calculatedTotal = saleData.total_value !== undefined && saleData.total_value !== null
      ? Number(saleData.total_value)
      : Math.max(0, productsSum + saasPrice - discount);

    const newRecord: SalesRecord = {
      id,
      sale_id,
      date: saleData.date || new Date().toISOString().split('T')[0],
      company_name: saleData.company_name.trim(),
      contact_person_name: saleData.contact_person_name.trim(),
      contact_person_number: saleData.contact_person_number.trim(),
      products: productsWithSubtotal,
      saas_package: saleData.saas_package || 'None (Hardware Only)',
      saas_package_price: saasPrice,
      discount,
      total_value: calculatedTotal,
      sold_by: saleData.sold_by.trim(),
      payment_status: saleData.payment_status || 'Paid',
      notes: saleData.notes?.trim() || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedList = [newRecord, ...current];
    this.saveSales(updatedList);

    // Save to Supabase asynchronously in background
    this.saveToSupabase(newRecord).catch((err) => {
      console.warn('Background Supabase save encountered:', err);
    });

    return newRecord;
  },

  async addSaleAsync(saleData: {
    date: string;
    company_name: string;
    contact_person_name: string;
    contact_person_number: string;
    products: SalesProductItem[];
    saas_package: string;
    saas_package_price?: number;
    discount?: number;
    total_value?: number;
    sold_by: string;
    payment_status: 'Paid' | 'Partial' | 'Pending' | 'Due';
    notes?: string;
  }): Promise<{ record: SalesRecord; supabaseSaved: boolean; error?: string; isTableMissing?: boolean }> {
    const record = this.addSale(saleData);
    const res = await this.saveToSupabase(record);
    return {
      record,
      supabaseSaved: res.success,
      error: res.error,
      isTableMissing: res.isTableMissing,
    };
  },

  updateSale(id: string, updated: Partial<SalesRecord>): SalesRecord | null {
    const current = this.getSales();
    const index = current.findIndex((s) => s.id === id);
    if (index === -1) return null;

    const existing = current[index];
    const products = updated.products
      ? updated.products.map((p) => ({
          ...p,
          subtotal: (Number(p.unit_price) || 0) * (Number(p.quantity) || 1),
        }))
      : existing.products;

    const productsSum = products.reduce((acc, p) => acc + p.subtotal, 0);
    const saasPrice = updated.saas_package_price !== undefined
      ? Number(updated.saas_package_price)
      : existing.saas_package_price;
    const discount = updated.discount !== undefined
      ? Number(updated.discount)
      : existing.discount;

    const total_value = updated.total_value !== undefined
      ? Number(updated.total_value)
      : Math.max(0, productsSum + saasPrice - discount);

    const merged: SalesRecord = {
      ...existing,
      ...updated,
      products,
      saas_package_price: saasPrice,
      discount,
      total_value,
      updated_at: new Date().toISOString(),
    };

    current[index] = merged;
    this.saveSales(current);

    // Update in Supabase
    this.updateInSupabase(merged);

    return merged;
  },

  deleteSale(id: string): boolean {
    const current = this.getSales();
    const filtered = current.filter((s) => s.id !== id && s.sale_id !== id);
    if (filtered.length !== current.length) {
      this.saveSales(filtered);
      // Delete in Supabase
      this.deleteFromSupabase(id);
      return true;
    }
    return false;
  },

  getSalesMetrics(monthFilter?: string, repFilter?: string, yearFilter?: string): SalesMetrics {
    let list = this.getSales();

    if (yearFilter && yearFilter !== 'all') {
      list = list.filter((s) => s.date.startsWith(yearFilter));
    }

    if (monthFilter && monthFilter !== 'all') {
      list = list.filter((s) => {
        const m = s.date.substring(5, 7);
        return m === monthFilter;
      });
    }

    if (repFilter && repFilter !== 'all') {
      list = list.filter((s) => s.sold_by.toLowerCase() === repFilter.toLowerCase());
    }

    const totalRevenue = list.reduce((acc, s) => acc + (s.total_value || 0), 0);
    const totalDeals = list.length;
    const averageDealValue = totalDeals > 0 ? Math.round(totalRevenue / totalDeals) : 0;

    let totalProductsSold = 0;
    const productStats: Record<string, { quantity: number; revenue: number }> = {};
    const repStats: Record<string, { revenue: number; deals: number }> = {};
    const packageStats: Record<string, { count: number; revenue: number }> = {};
    const monthlyMap: Record<string, { revenue: number; deals: number }> = {};

    let paidRevenue = 0;
    let dueRevenue = 0;

    list.forEach((sale) => {
      if (sale.payment_status === 'Paid') {
        paidRevenue += sale.total_value;
      } else {
        dueRevenue += sale.total_value;
      }

      // Products breakdown
      (sale.products || []).forEach((item) => {
        const qty = Number(item.quantity) || 0;
        const sub = Number(item.subtotal) || 0;
        totalProductsSold += qty;

        if (!productStats[item.name]) {
          productStats[item.name] = { quantity: 0, revenue: 0 };
        }
        productStats[item.name].quantity += qty;
        productStats[item.name].revenue += sub;
      });

      // Rep breakdown
      const rep = sale.sold_by || 'Unassigned';
      if (!repStats[rep]) {
        repStats[rep] = { revenue: 0, deals: 0 };
      }
      repStats[rep].revenue += sale.total_value;
      repStats[rep].deals += 1;

      // Package breakdown
      const pkg = sale.saas_package || 'None';
      if (!packageStats[pkg]) {
        packageStats[pkg] = { count: 0, revenue: 0 };
      }
      packageStats[pkg].count += 1;
      packageStats[pkg].revenue += sale.total_value;

      // Monthly map (YYYY-MM)
      const ym = sale.date.substring(0, 7);
      if (!monthlyMap[ym]) {
        monthlyMap[ym] = { revenue: 0, deals: 0 };
      }
      monthlyMap[ym].revenue += sale.total_value;
      monthlyMap[ym].deals += 1;
    });

    // Top Sales Rep
    let topSalesRep = 'N/A';
    let maxRepRevenue = -1;
    Object.entries(repStats).forEach(([rep, data]) => {
      if (data.revenue > maxRepRevenue) {
        maxRepRevenue = data.revenue;
        topSalesRep = `${rep} (৳${data.revenue.toLocaleString()})`;
      }
    });

    // Monthly sorted
    const monthlyRevenue = Object.entries(monthlyMap)
      .map(([month, data]) => ({
        month,
        revenue: data.revenue,
        deals: data.deals,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Sales by Rep sorted
    const salesByRep = Object.entries(repStats)
      .map(([rep, data]) => ({
        rep,
        revenue: data.revenue,
        deals: data.deals,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Top Products sorted
    const topProducts = Object.entries(productStats)
      .map(([name, data]) => ({
        name,
        quantity: data.quantity,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Package breakdown sorted
    const packageBreakdown = Object.entries(packageStats)
      .map(([name, data]) => ({
        name,
        count: data.count,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return {
      totalRevenue,
      totalDeals,
      averageDealValue,
      topSalesRep,
      totalProductsSold,
      paidRevenue,
      dueRevenue,
      monthlyRevenue,
      salesByRep,
      topProducts,
      packageBreakdown,
    };
  },

  exportToExcel(sales: SalesRecord[]): void {
    const rows = sales.map((s, idx) => ({
      'SL #': idx + 1,
      'Sale ID': s.sale_id,
      'Date': s.date,
      'Company Name': s.company_name,
      'Contact Person': s.contact_person_name,
      'Contact Phone': s.contact_person_number,
      'Products Summary': (s.products || [])
        .map((p) => `${p.name} (Qty: ${p.quantity}, ৳${p.unit_price} each = ৳${p.subtotal})`)
        .join('; '),
      'Total Products Qty': (s.products || []).reduce((acc, p) => acc + (p.quantity || 0), 0),
      'SaaS Package': s.saas_package,
      'Package Fee (BDT)': s.saas_package_price,
      'Discount (BDT)': s.discount,
      'Total Value (BDT)': s.total_value,
      'Sold By': s.sold_by,
      'Payment Status': s.payment_status,
      'Notes': s.notes || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Records');
    XLSX.writeFile(workbook, `sales_report_${new Date().toISOString().split('T')[0]}.xlsx`);
  },
};
