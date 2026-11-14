/**
 * Domain services. Each method calls the real API via `http`, unless
 * VITE_USE_MOCK=true, in which case it returns realistic mock data after a
 * short latency. This lets the app demo out-of-the-box.
 */
import { http, USE_MOCK, endpoints, ApiError } from './api';
import { sleep, uid, toQuery } from './utils';
import { toMajor } from './format';
import * as mock from './mock/data';
import type {
  AuthSession,
  Business,
  Branch,
  Product,
  Category,
  InventoryMovement,
  InventoryBalance,
  Sale,
  Purchase,
  Expense,
  Customer,
  Supplier,
  DashboardMetrics,
  SalesReport,
  ProfitLossReport,
  InventoryReport,
  ExpensesReport,
  CashierReport,
  CustomerCreditReport,
  SupplierReport,
  StaffMember,
  StaffInvitation,
  SubscriptionPlan,
  Subscription,
  AppNotification,
  SupportTicket,
  AppSettings,
  Paginated,
} from './types';

// ---------- helpers for mock pagination ----------
function paginate<T>(items: T[], page = 1, limit = 20): Paginated<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  return {
    items: items.slice(start, start + limit),
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

// =====================================================
// Auth
// =====================================================
export const authService = {
  async register(body: { fullName: string; email?: string; phone: string; password: string; acceptedTerms: boolean }): Promise<AuthSession> {
    if (USE_MOCK) {
      await sleep(600);
      return { user: { ...mock.mockUser, fullName: body.fullName, email: body.email ?? null, phone: body.phone }, accessToken: 'mock-access-token', expiresIn: 900 };
    }
    return http.post<AuthSession>(endpoints.auth.register, body);
  },
  async login(body: { identifier: string; password: string }): Promise<AuthSession> {
    if (USE_MOCK) {
      await sleep(500);
      return { user: mock.mockUser, accessToken: 'mock-access-token', expiresIn: 900 };
    }
    return http.post<AuthSession>(endpoints.auth.login, body);
  },
  async me(): Promise<AuthSession['user']> {
    if (USE_MOCK) {
      await sleep(200);
      return mock.mockUser;
    }
    return http.get<AuthSession['user']>(endpoints.auth.me);
  },
  async logout(): Promise<void> {
    if (USE_MOCK) {
      await sleep(200);
      return;
    }
    await http.post<void>(endpoints.auth.logout);
  },
  async forgotPassword(email: string): Promise<void> {
    if (USE_MOCK) {
      await sleep(500);
      return;
    }
    await http.post<void>(endpoints.auth.forgotPassword, { email });
  },
  async resetPassword(token: string, password: string): Promise<void> {
    if (USE_MOCK) {
      await sleep(500);
      return;
    }
    await http.post<void>(endpoints.auth.resetPassword, { token, password });
  },
};

// =====================================================
// Businesses
// =====================================================
export const businessService = {
  async list(): Promise<Business[]> {
    if (USE_MOCK) {
      await sleep(250);
      return mock.mockBusinesses;
    }
    return http.get<Business[]>(endpoints.businesses.base);
  },
  async create(body: Partial<Business>): Promise<Business> {
    if (USE_MOCK) {
      await sleep(700);
      const biz: Business = {
        id: uid('biz_'),
        ownerId: mock.mockUser.id,
        name: body.name ?? 'New Business',
        category: body.category ?? null,
        phone: body.phone ?? '',
        email: body.email ?? null,
        country: body.country ?? 'NG',
        currency: body.currency ?? 'NGN',
        address: body.address ?? null,
        logoUrl: body.logoUrl ?? null,
        taxIdentifier: body.taxIdentifier ?? null,
        taxRateBps: body.taxRateBps ?? 0,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return biz;
    }
    return http.post<Business>(endpoints.businesses.base, body);
  },
  async update(id: string, body: Partial<Business>): Promise<Business> {
    if (USE_MOCK) {
      await sleep(500);
      return { ...(mock.mockBusinesses[0] as Business), ...body, id };
    }
    return http.patch<Business>(endpoints.businesses.byId(id), body);
  },
  async activate(id: string): Promise<Business> {
    if (USE_MOCK) {
      await sleep(300);
      return mock.mockBusinesses.find((b) => b.id === id) as Business;
    }
    return http.post<Business>(endpoints.businesses.activate(id), {});
  },
};

// =====================================================
// Branches
// =====================================================
export const branchService = {
  async list(): Promise<Branch[]> {
    if (USE_MOCK) {
      await sleep(200);
      return mock.mockBranches;
    }
    return http.get<Branch[]>(endpoints.branches.base);
  },
  async create(body: Partial<Branch>): Promise<Branch> {
    if (USE_MOCK) {
      await sleep(500);
      return { id: uid('br_'), businessId: 'biz_demo_001', isHQ: false, createdAt: new Date().toISOString(), name: body.name ?? 'New Branch', phone: body.phone ?? null, email: body.email ?? null, address: body.address ?? null };
    }
    return http.post<Branch>(endpoints.branches.base, body);
  },
  async transfer(body: { fromBranchId: string; toBranchId: string; items: Array<{ productId: string; quantity: number }> }): Promise<void> {
    if (USE_MOCK) {
      await sleep(700);
      return;
    }
    await http.post<void>(endpoints.branches.transfers, body);
  },
};

// =====================================================
// Products
// =====================================================
export const productService = {
  async list(params: { search?: string; categoryId?: string; status?: string; page?: number; limit?: number } = {}): Promise<Paginated<Product>> {
    if (USE_MOCK) {
      await sleep(300);
      let items = [...mock.mockProducts as Product[]];
      if (params.search) {
        const q = params.search.toLowerCase();
        items = items.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || (p.barcode ?? '').includes(q));
      }
      if (params.categoryId) items = items.filter((p) => p.categoryId === params.categoryId);
      if (params.status) items = items.filter((p) => p.status === params.status);
      return paginate(items, params.page, params.limit);
    }
    return http.get<Paginated<Product>>(endpoints.products.base, params as Record<string, unknown>);
  },
  async get(id: string): Promise<Product> {
    if (USE_MOCK) {
      await sleep(200);
      const p = (mock.mockProducts as Product[]).find((x) => x.id === id);
      if (!p) throw new ApiError('Product not found', 404, 'NOT_FOUND');
      return p;
    }
    return http.get<Product>(endpoints.products.byId(id));
  },
  async create(body: Record<string, unknown>): Promise<Product> {
    if (USE_MOCK) {
      await sleep(600);
      return { ...(mock.mockProducts[0] as Product), id: uid('prd_'), ...body } as Product;
    }
    return http.post<Product>(endpoints.products.base, body);
  },
  async update(id: string, body: Record<string, unknown>): Promise<Product> {
    if (USE_MOCK) {
      await sleep(500);
      return { ...(mock.mockProducts[0] as Product), ...body, id } as Product;
    }
    return http.patch<Product>(endpoints.products.byId(id), body);
  },
  async import(rows: Array<Record<string, unknown>>): Promise<{ imported: number }> {
    if (USE_MOCK) {
      await sleep(900);
      return { imported: rows.length };
    }
    return http.post<{ imported: number }>(endpoints.products.import, { rows });
  },
  async listCategories(): Promise<Category[]> {
    if (USE_MOCK) {
      await sleep(150);
      return mock.mockCategories as Category[];
    }
    return http.get<Category[]>('/products/categories');
  },
  async createCategory(body: { name: string; description?: string }): Promise<Category> {
    if (USE_MOCK) {
      await sleep(400);
      return { id: uid('cat_'), businessId: 'biz_demo_001', parentId: null, name: body.name, description: body.description ?? null, createdAt: new Date().toISOString() };
    }
    return http.post<Category>('/products/categories', body);
  },
};

// =====================================================
// Inventory
// =====================================================
export const inventoryService = {
  async balances(params: { search?: string; page?: number; limit?: number } = {}): Promise<Paginated<InventoryBalance>> {
    if (USE_MOCK) {
      await sleep(300);
      const items: InventoryBalance[] = (mock.mockProducts as Product[]).map((p) => ({
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        quantity: p.stockQuantity ?? 0,
        wacCostMinor: p.costPriceMinor,
        updatedAt: p.updatedAt,
      }));
      if (params.search) {
        const q = params.search.toLowerCase();
        return paginate(items.filter((i) => (i.productName ?? '').toLowerCase().includes(q) || (i.sku ?? '').toLowerCase().includes(q)), params.page, params.limit);
      }
      return paginate(items, params.page, params.limit);
    }
    return http.get<Paginated<InventoryBalance>>(endpoints.inventory.balances, params as Record<string, unknown>);
  },
  async movements(params: { productId?: string; type?: string; page?: number; limit?: number } = {}): Promise<Paginated<InventoryMovement>> {
    if (USE_MOCK) {
      await sleep(300);
      const items: InventoryMovement[] = Array.from({ length: 22 }, (_, i) => {
        const p = (mock.mockProducts as Product[])[i % mock.mockProducts.length]!;
        const types = ['STOCK_OUT', 'SALE_DEDUCTION', 'PURCHASE_RECEIPT', 'ADJUSTMENT', 'DAMAGED'] as const;
        const qty = (i % 4) + 1;
        return {
          id: uid('mv_'),
          productId: p.id,
          productName: p.name,
          movementType: types[i % types.length]!,
          quantity: i % 2 === 0 ? qty : -qty,
          referenceType: i % 3 === 0 ? 'SALE' : i % 3 === 1 ? 'PURCHASE' : null,
          referenceId: uid('ref_'),
          batchNo: null,
          unitCostMinor: p.costPriceMinor,
          totalCostMinor: String((Number(p.costPriceMinor) * qty)),
          reason: i % 2 === 0 ? null : 'Damaged in transit',
          notes: null,
          createdAt: new Date(Date.now() - i * 7200000).toISOString(),
        };
      });
      return paginate(items, params.page, params.limit);
    }
    return http.get<Paginated<InventoryMovement>>(endpoints.inventory.movements, params as Record<string, unknown>);
  },
  async stockIn(body: Record<string, unknown>): Promise<InventoryMovement> {
    if (USE_MOCK) {
      await sleep(600);
      return { id: uid('mv_'), productId: body.productId as string, movementType: 'PURCHASE_RECEIPT', quantity: body.quantity as number, referenceType: null, referenceId: null, batchNo: (body.batchNo as string) ?? null, unitCostMinor: String(body.unitCostMinor ?? '0'), totalCostMinor: String((Number(body.unitCostMinor ?? 0)) * (body.quantity as number)), reason: null, notes: (body.notes as string) ?? null, createdAt: new Date().toISOString() };
    }
    return http.post<InventoryMovement>(endpoints.inventory.stockIn, body);
  },
  async stockOut(body: Record<string, unknown>): Promise<InventoryMovement> {
    if (USE_MOCK) {
      await sleep(600);
      return { id: uid('mv_'), productId: body.productId as string, movementType: 'STOCK_OUT', quantity: -(body.quantity as number), referenceType: null, referenceId: null, batchNo: null, unitCostMinor: '0', totalCostMinor: '0', reason: (body.reason as string) ?? null, notes: (body.notes as string) ?? null, createdAt: new Date().toISOString() };
    }
    return http.post<InventoryMovement>(endpoints.inventory.stockOut, body);
  },
  async adjust(body: Record<string, unknown>): Promise<InventoryMovement> {
    if (USE_MOCK) {
      await sleep(600);
      return { id: uid('mv_'), productId: body.productId as string, movementType: 'ADJUSTMENT', quantity: body.quantity as number, referenceType: null, referenceId: null, batchNo: null, unitCostMinor: '0', totalCostMinor: '0', reason: (body.reason as string) ?? null, notes: (body.notes as string) ?? null, createdAt: new Date().toISOString() };
    }
    return http.post<InventoryMovement>(endpoints.inventory.adjustments, body);
  },
};

// =====================================================
// Sales
// =====================================================
export const saleService = {
  async list(params: { from?: string; to?: string; method?: string; cashierId?: string; page?: number; limit?: number } = {}): Promise<Paginated<Sale>> {
    if (USE_MOCK) {
      await sleep(300);
      let items = [...(mock.mockSales as Sale[])];
      if (params.method) items = items.filter((s) => s.payments?.[0]?.method === params.method);
      return paginate(items, params.page, params.limit);
    }
    return http.get<Paginated<Sale>>(endpoints.sales.base, params as Record<string, unknown>);
  },
  async get(id: string): Promise<Sale> {
    if (USE_MOCK) {
      await sleep(200);
      const s = (mock.mockSales as Sale[]).find((x) => x.id === id) ?? (mock.mockSales as Sale[])[0]!;
      return s;
    }
    return http.get<Sale>(endpoints.sales.byId(id));
  },
  async create(body: Record<string, unknown>): Promise<Sale> {
    if (USE_MOCK) {
      await sleep(800);
      const total = Number(body.totalMinor ?? '0');
      return {
        id: uid('sale_'),
        receiptNo: `RCP-${Math.floor(100000 + Math.random() * 899999)}`,
        cashierId: mock.mockUser.id,
        cashierName: mock.mockUser.fullName,
        customerId: (body.customerId as string) ?? null,
        customerName: 'Walk-in customer',
        status: 'COMPLETED',
        subtotalMinor: String(body.subtotalMinor ?? total),
        discountMinor: String(body.discountMinor ?? '0'),
        taxMinor: String(body.taxMinor ?? '0'),
        totalMinor: String(total),
        amountPaidMinor: String(body.amountPaidMinor ?? total),
        outstandingMinor: '0',
        notes: (body.notes as string) ?? null,
        saleDate: new Date().toISOString(),
        items: (body.items as Sale['items']) ?? [],
        payments: (body.payments as Sale['payments']) ?? [],
        createdAt: new Date().toISOString(),
      };
    }
    return http.post<Sale>(endpoints.sales.base, body);
  },
  async refund(id: string, body: { amountMinor: string; reason: string; restockItems: boolean }): Promise<void> {
    if (USE_MOCK) {
      await sleep(600);
      return;
    }
    await http.post<void>(endpoints.sales.refund(id), body);
  },
};

// =====================================================
// Purchases
// =====================================================
export const purchaseService = {
  async list(params: { page?: number; limit?: number; status?: string } = {}): Promise<Paginated<Purchase>> {
    if (USE_MOCK) {
      await sleep(300);
      const items: Purchase[] = Array.from({ length: 10 }, (_, i) => {
        const sup = mock.mockSuppliers[i % mock.mockSuppliers.length]!;
        const total = 45000 + i * 12500;
        const paid = i % 3 === 0 ? Math.round(total * 0.5) : total;
        return {
          id: uid('pur_'),
          reference: `PO-${1000 + i}`,
          supplierId: sup.id,
          supplierName: sup.name,
          status: (i % 4 === 0 ? 'ORDERED' : i % 4 === 1 ? 'RECEIVED' : i % 4 === 2 ? 'PARTIALLY_RECEIVED' : 'DRAFT') as Purchase['status'],
          totalMinor: String(total * 100),
          paidMinor: String(paid * 100),
          outstandingMinor: String((total - paid) * 100),
          notes: null,
          orderDate: new Date(Date.now() - i * 86400000 * 2).toISOString(),
          receivedAt: i % 4 === 1 ? new Date(Date.now() - i * 86400000).toISOString() : null,
          createdAt: new Date(Date.now() - i * 86400000 * 2).toISOString(),
        };
      });
      if (params.status) return paginate(items.filter((p) => p.status === params.status), params.page, params.limit);
      return paginate(items, params.page, params.limit);
    }
    return http.get<Paginated<Purchase>>(endpoints.purchases.base, params as Record<string, unknown>);
  },
  async create(body: Record<string, unknown>): Promise<Purchase> {
    if (USE_MOCK) {
      await sleep(800);
      return { id: uid('pur_'), reference: `PO-${Math.floor(1000 + Math.random() * 8999)}`, supplierId: body.supplierId as string, supplierName: 'Supplier', status: 'ORDERED', totalMinor: String(body.totalMinor ?? '0'), paidMinor: '0', outstandingMinor: String(body.totalMinor ?? '0'), notes: (body.notes as string) ?? null, orderDate: new Date().toISOString(), receivedAt: null, items: (body.items as Purchase['items']) ?? [], createdAt: new Date().toISOString() };
    }
    return http.post<Purchase>(endpoints.purchases.base, body);
  },
  async receive(id: string, body: { items: Array<{ productId: string; receivedQuantity: number }> }): Promise<Purchase> {
    if (USE_MOCK) {
      await sleep(700);
      return { id, reference: 'PO-1000', supplierId: 'sup_001', supplierName: 'Coca-Cola Nigeria', status: 'RECEIVED', totalMinor: '4500000', paidMinor: '4500000', outstandingMinor: '0', notes: null, orderDate: new Date().toISOString(), receivedAt: new Date().toISOString(), createdAt: new Date().toISOString() };
    }
    return http.post<Purchase>(endpoints.purchases.receive(id), body);
  },
};

// =====================================================
// Expenses
// =====================================================
export const expenseService = {
  async list(params: { from?: string; to?: string; category?: string; page?: number; limit?: number } = {}): Promise<Paginated<Expense>> {
    if (USE_MOCK) {
      await sleep(300);
      const cats = ['Rent', 'Utilities', 'Salaries', 'Transport', 'Maintenance', 'Marketing'];
      const items: Expense[] = Array.from({ length: 14 }, (_, i) => ({
        id: uid('exp_'),
        category: cats[i % cats.length]!,
        description: `${cats[i % cats.length]} payment`,
        amountMinor: String((5000 + i * 3200) * 100),
        paymentMethod: (i % 2 === 0 ? 'CASH' : 'BANK_TRANSFER') as Expense['paymentMethod'],
        reference: `REF-${1000 + i}`,
        expenseDate: new Date(Date.now() - i * 86400000).toISOString(),
        createdAt: new Date(Date.now() - i * 86400000).toISOString(),
      }));
      if (params.category) return paginate(items.filter((e) => e.category === params.category), params.page, params.limit);
      return paginate(items, params.page, params.limit);
    }
    return http.get<Paginated<Expense>>(endpoints.expenses.base, params as Record<string, unknown>);
  },
  async create(body: Record<string, unknown>): Promise<Expense> {
    if (USE_MOCK) {
      await sleep(600);
      return { id: uid('exp_'), category: (body.category as string) ?? 'General', description: (body.description as string) ?? '', amountMinor: String(body.amountMinor ?? '0'), paymentMethod: (body.paymentMethod as Expense['paymentMethod']) ?? 'CASH', reference: (body.reference as string) ?? null, expenseDate: (body.expenseDate as string) ?? new Date().toISOString(), createdAt: new Date().toISOString() };
    }
    return http.post<Expense>(endpoints.expenses.base, body);
  },
};

// =====================================================
// Customers & Suppliers
// =====================================================
export const customerService = {
  async list(params: { search?: string; type?: string; page?: number; limit?: number } = {}): Promise<Paginated<Customer>> {
    if (USE_MOCK) {
      await sleep(250);
      let items = [...(mock.mockCustomers as Customer[])];
      if (params.search) {
        const q = params.search.toLowerCase();
        items = items.filter((c) => c.name.toLowerCase().includes(q) || (c.phone ?? '').includes(q));
      }
      if (params.type) items = items.filter((c) => c.type === params.type);
      return paginate(items, params.page, params.limit);
    }
    return http.get<Paginated<Customer>>(endpoints.customers.base, params as Record<string, unknown>);
  },
  async create(body: Record<string, unknown>): Promise<Customer> {
    if (USE_MOCK) {
      await sleep(500);
      return { id: uid('cus_'), name: (body.name as string) ?? '', phone: (body.phone as string) ?? null, email: (body.email as string) ?? null, address: (body.address as string) ?? null, type: (body.type as string) ?? 'INDIVIDUAL', notes: (body.notes as string) ?? null, outstandingBalanceMinor: '0', createdAt: new Date().toISOString() };
    }
    return http.post<Customer>(endpoints.customers.base, body);
  },
  async get(id: string): Promise<Customer> {
    if (USE_MOCK) {
      await sleep(200);
      return (mock.mockCustomers as Customer[]).find((c) => c.id === id) ?? (mock.mockCustomers as Customer[])[0]!;
    }
    return http.get<Customer>(endpoints.customers.byId(id));
  },
};

export const supplierService = {
  async list(params: { search?: string; page?: number; limit?: number } = {}): Promise<Paginated<Supplier>> {
    if (USE_MOCK) {
      await sleep(250);
      let items = [...(mock.mockSuppliers as Supplier[])];
      if (params.search) {
        const q = params.search.toLowerCase();
        items = items.filter((s) => s.name.toLowerCase().includes(q) || (s.phone ?? '').includes(q));
      }
      return paginate(items, params.page, params.limit);
    }
    return http.get<Paginated<Supplier>>(endpoints.suppliers.base, params as Record<string, unknown>);
  },
  async create(body: Record<string, unknown>): Promise<Supplier> {
    if (USE_MOCK) {
      await sleep(500);
      return { id: uid('sup_'), name: (body.name as string) ?? '', phone: (body.phone as string) ?? null, email: (body.email as string) ?? null, address: (body.address as string) ?? null, contactPerson: (body.contactPerson as string) ?? null, payablesMinor: '0', createdAt: new Date().toISOString() };
    }
    return http.post<Supplier>(endpoints.suppliers.base, body);
  },
  async get(id: string): Promise<Supplier> {
    if (USE_MOCK) {
      await sleep(200);
      return (mock.mockSuppliers as Supplier[]).find((s) => s.id === id) ?? (mock.mockSuppliers as Supplier[])[0]!;
    }
    return http.get<Supplier>(endpoints.suppliers.byId(id));
  },
};

// =====================================================
// Reports
// =====================================================
export const reportService = {
  async dashboard(): Promise<DashboardMetrics> {
    if (USE_MOCK) {
      await sleep(400);
      return mock.mockDashboard;
    }
    return http.get<DashboardMetrics>(endpoints.reports.dashboard);
  },
  async sales(params: { from?: string; to?: string; branchId?: string }): Promise<SalesReport> {
    if (USE_MOCK) {
      await sleep(400);
      const daily = mock.mockDashboard.salesTrend.map((t) => ({ date: t.date.slice(0, 10), sales: Math.round(t.sales / 400), revenue: { minor: String(t.sales * 100), major: t.sales }, discount: { minor: '0', major: 0 }, tax: { minor: String(Math.round(t.sales * 7.5 * 100) / 100), major: Math.round(t.sales * 7.5) } }));
      return {
        from: params.from ?? mock.mockDashboard.range.from,
        to: params.to ?? mock.mockDashboard.range.to,
        salesCount: daily.reduce((s, d) => s + d.sales, 0),
        totalRevenue: { minor: String(daily.reduce((s, d) => s + d.revenue.major, 0) * 100), major: daily.reduce((s, d) => s + d.revenue.major, 0) },
        totalDiscount: { minor: '0', major: 0 },
        totalTax: { minor: '0', major: 0 },
        totalPaid: { minor: '0', major: daily.reduce((s, d) => s + d.revenue.major, 0) },
        totalOutstanding: { minor: String(12450000), major: 124500 },
        statusCounts: { COMPLETED: 280, PARTIALLY_PAID: 12, REFUNDED: 3 },
        daily,
      };
    }
    return http.get<SalesReport>(endpoints.reports.sales, params as Record<string, unknown>);
  },
  async profitLoss(params: { from?: string; to?: string; branchId?: string }): Promise<ProfitLossReport> {
    if (USE_MOCK) {
      await sleep(400);
      const daily = mock.mockDashboard.salesTrend.map((t) => ({ date: t.date.slice(0, 10), grossSales: { minor: String(t.sales * 100), major: t.sales }, returns: { minor: '0', major: 0 }, cogs: { minor: String(Math.round(t.sales * 0.69 * 100)), major: Math.round(t.sales * 0.69) }, expenses: { minor: String(Math.round(t.profit * 0.3 * 100)), major: Math.round(t.profit * 0.3) } }));
      const gross = daily.reduce((s, d) => s + d.grossSales.major, 0);
      const cogs = daily.reduce((s, d) => s + d.cogs.major, 0);
      const exp = daily.reduce((s, d) => s + d.expenses.major, 0);
      return {
        from: params.from ?? mock.mockDashboard.range.from,
        to: params.to ?? mock.mockDashboard.range.to,
        grossSales: { minor: String(gross * 100), major: gross },
        salesReturns: { minor: '0', major: 0 },
        netSales: { minor: String(gross * 100), major: gross },
        cogs: { minor: String(cogs * 100), major: cogs },
        grossProfit: { minor: String((gross - cogs) * 100), major: gross - cogs },
        operatingExpenses: { minor: String(exp * 100), major: exp },
        operatingProfit: { minor: String((gross - cogs - exp) * 100), major: gross - cogs - exp },
        taxCollected: { minor: String(Math.round(gross * 7.5 * 100)), major: Math.round(gross * 7.5) },
        daily,
      };
    }
    return http.get<ProfitLossReport>(endpoints.reports.profitLoss, params as Record<string, unknown>);
  },
  async inventory(): Promise<InventoryReport> {
    if (USE_MOCK) {
      await sleep(400);
      const items = (mock.mockProducts as Product[]).map((p) => {
        const qty = p.stockQuantity ?? 0;
        return {
          productId: p.id,
          name: p.name,
          sku: p.sku,
          quantity: qty,
          wacCost: { minor: p.costPriceMinor, major: toMajor(p.costPriceMinor) },
          value: { minor: String(Number(p.costPriceMinor) * qty), major: toMajor(p.costPriceMinor) * qty },
          minStock: p.minStock,
          stockStatus: qty === 0 ? 'out_of_stock' as const : qty <= p.minStock ? 'low_stock' as const : 'in_stock' as const,
        };
      });
      return {
        totalSkuCount: items.length,
        totalStockQty: items.reduce((s, i) => s + i.quantity, 0),
        totalValue: { minor: String(items.reduce((s, i) => s + Number(i.value.minor), 0)), major: items.reduce((s, i) => s + i.value.major, 0) },
        items,
      };
    }
    return http.get<InventoryReport>(endpoints.reports.inventory);
  },
  async expenses(params: { from?: string; to?: string; branchId?: string }): Promise<ExpensesReport> {
    if (USE_MOCK) {
      await sleep(400);
      const cats = ['Rent', 'Utilities', 'Salaries', 'Transport', 'Maintenance', 'Marketing'];
      const categories = cats.map((c, i) => ({ category: c, count: 3 + i, total: { minor: String((8000 + i * 4200) * 100), major: 8000 + i * 4200 } }));
      return { from: params.from ?? mock.mockDashboard.range.from, to: params.to ?? mock.mockDashboard.range.to, total: { minor: String(categories.reduce((s, c) => s + c.total.major, 0) * 100), major: categories.reduce((s, c) => s + c.total.major, 0) }, categories };
    }
    return http.get<ExpensesReport>(endpoints.reports.expenses, params as Record<string, unknown>);
  },
  async cashier(params: { from?: string; to?: string; branchId?: string }): Promise<CashierReport> {
    if (USE_MOCK) {
      await sleep(400);
      return { items: [{ cashierId: mock.mockUser.id, name: mock.mockUser.fullName, salesCount: 247, revenue: { minor: '8425000', major: 84250 }, refunds: { minor: '42000', major: 420 } }] };
    }
    return http.get<CashierReport>(endpoints.reports.cashier, params as Record<string, unknown>);
  },
  async customerCredit(): Promise<CustomerCreditReport> {
    if (USE_MOCK) {
      await sleep(400);
      const items = (mock.mockCustomers as Customer[]).filter((c) => Number(c.outstandingBalanceMinor) > 0).map((c) => ({ customerId: c.id, name: c.name, outstanding: { minor: c.outstandingBalanceMinor, major: toMajor(c.outstandingBalanceMinor) }, oldestCredit: c.createdAt }));
      return { items, total: { minor: String(items.reduce((s, i) => s + Number(i.outstanding.minor), 0)), major: items.reduce((s, i) => s + i.outstanding.major, 0) } };
    }
    return http.get<CustomerCreditReport>(endpoints.reports.customerCredit);
  },
  async supplier(): Promise<SupplierReport> {
    if (USE_MOCK) {
      await sleep(400);
      const items = (mock.mockSuppliers as Supplier[]).map((s) => ({ supplierId: s.id, name: s.name, totalPurchases: { minor: String(240000 * 100), major: 240000 }, totalPaid: { minor: String((240000 - toMajor(s.payablesMinor)) * 100), major: 240000 - toMajor(s.payablesMinor) }, payables: { minor: s.payablesMinor, major: toMajor(s.payablesMinor) } }));
      return { items, total: { minor: String(items.reduce((s, i) => s + i.payables.major, 0) * 100), major: items.reduce((s, i) => s + i.payables.major, 0) } };
    }
    return http.get<SupplierReport>(endpoints.reports.supplier);
  },
  async exportCsv(type: 'sales' | 'expenses' | 'inventory' | 'profit-loss', params: { from?: string; to?: string; branchId?: string }): Promise<Blob> {
    if (USE_MOCK) {
      await sleep(500);
      const rows = type === 'inventory' ? (mock.mockProducts as Product[]).map((p) => ({ name: p.name, sku: p.sku, quantity: p.stockQuantity ?? 0, cost: toMajor(p.costPriceMinor), value: toMajor(p.costPriceMinor) * (p.stockQuantity ?? 0) })) : (mock.mockSales as Sale[]).map((s) => ({ receiptNo: s.receiptNo, date: s.saleDate, total: toMajor(s.totalMinor), status: s.status }));
      const header = Object.keys(rows[0] ?? {}).join(',');
      const body = rows.map((r) => Object.values(r).join(',')).join('\r\n');
      return new Blob([`${header}\r\n${body}`], { type: 'text/csv' });
    }
    const qs = toQuery({ type, ...params });
    const res = await http.raw.get(`${endpoints.reports.sales.replace('/reports/sales', '/reports/export')}${qs}`, { responseType: 'blob' });
    return res.data as Blob;
  },
};

// =====================================================
// Staff
// =====================================================
export const staffService = {
  async list(): Promise<StaffMember[]> {
    if (USE_MOCK) {
      await sleep(300);
      return [
        { id: 'mem_001', userId: mock.mockUser.id, fullName: mock.mockUser.fullName, email: mock.mockUser.email, phone: mock.mockUser.phone, role: 'BUSINESS_OWNER', status: 'ACTIVE', lastLoginAt: mock.mockUser.lastLoginAt, createdAt: mock.mockUser.createdAt },
        { id: 'mem_002', userId: 'usr_demo_002', fullName: 'Chidi Okafor', email: 'chidi@retailos.demo', phone: '+2348077788990', role: 'CASHIER', status: 'ACTIVE', lastLoginAt: new Date(Date.now() - 3600000 * 5).toISOString(), createdAt: new Date(Date.now() - 86400000 * 30).toISOString() },
        { id: 'mem_003', userId: 'usr_demo_003', fullName: 'Fatima Bello', email: 'fatima@retailos.demo', phone: '+2348088899001', role: 'MANAGER', status: 'ACTIVE', lastLoginAt: new Date(Date.now() - 86400000 * 2).toISOString(), createdAt: new Date(Date.now() - 86400000 * 60).toISOString() },
      ];
    }
    return http.get<StaffMember[]>(endpoints.staff.base);
  },
  async invite(body: { email: string; role: string }): Promise<StaffInvitation> {
    if (USE_MOCK) {
      await sleep(600);
      return { id: uid('inv_'), email: body.email, role: body.role, status: 'PENDING', expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(), createdAt: new Date().toISOString() };
    }
    return http.post<StaffInvitation>(endpoints.staff.invitations, body);
  },
};

// =====================================================
// Subscriptions
// =====================================================
export const subscriptionService = {
  async current(): Promise<Subscription> {
    if (USE_MOCK) {
      await sleep(300);
      return mock.mockSubscription;
    }
    return http.get<Subscription>(endpoints.subscriptions.current);
  },
  async plans(): Promise<SubscriptionPlan[]> {
    if (USE_MOCK) {
      await sleep(300);
      return mock.mockPlans;
    }
    return http.get<SubscriptionPlan[]>(endpoints.subscriptions.plans);
  },
  async submitPayment(body: { planId: string; amountMinor: string; reference: string; proofUrl?: string }): Promise<void> {
    if (USE_MOCK) {
      await sleep(800);
      return;
    }
    await http.post<void>(endpoints.subscriptions.paymentSubmissions, body);
  },
};

// =====================================================
// Notifications, Support, Settings
// =====================================================
export const notificationService = {
  async list(): Promise<AppNotification[]> {
    if (USE_MOCK) {
      await sleep(250);
      return [
        { id: uid('ntf_'), title: 'New sale recorded', body: 'Receipt RCP-002841 for \u20A64,200', type: 'SALE', read: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
        { id: uid('ntf_'), title: 'Low stock alert', body: 'Pepsi 50cl is below minimum stock', type: 'STOCK', read: false, createdAt: new Date(Date.now() - 7200000).toISOString() },
        { id: uid('ntf_'), title: 'Trial ending soon', body: 'Your Growth plan trial ends in 4 days', type: 'SUBSCRIPTION', read: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
      ];
    }
    return http.get<AppNotification[]>(endpoints.notifications.base);
  },
  async markAllRead(): Promise<void> {
    if (USE_MOCK) {
      await sleep(200);
      return;
    }
    await http.post<void>(endpoints.notifications.markAllRead);
  },
};

export const supportService = {
  async list(): Promise<SupportTicket[]> {
    if (USE_MOCK) {
      await sleep(250);
      return [
        { id: uid('tkt_'), subject: 'Cannot import products', message: 'CSV upload fails with 500 error', status: 'IN_PROGRESS', priority: 'HIGH', createdAt: new Date(Date.now() - 86400000).toISOString() },
        { id: uid('tkt_'), subject: 'Receipt printer setup', message: 'How do I connect a thermal printer?', status: 'RESOLVED', priority: 'LOW', createdAt: new Date(Date.now() - 86400000 * 3).toISOString() },
      ];
    }
    return http.get<SupportTicket[]>(endpoints.support.base);
  },
  async create(body: { subject: string; description: string; priority?: string }): Promise<SupportTicket> {
    if (USE_MOCK) {
      await sleep(700);
      return { id: uid('tkt_'), subject: body.subject, message: body.description, status: 'OPEN', priority: (body.priority as SupportTicket['priority']) ?? 'MEDIUM', createdAt: new Date().toISOString() };
    }
    return http.post<SupportTicket>(endpoints.support.base, { ...body, message: body.description });
  },
};

export const settingsService = {
  async get(): Promise<AppSettings> {
    if (USE_MOCK) {
      await sleep(200);
      return { currency: 'NGN', taxRateBps: 750, receiptHeader: 'Adaeze General Store', receiptFooter: 'Thank you for shopping with us!', receiptShowLogo: true, lowStockThreshold: 10, emailNotifications: true, pushNotifications: true };
    }
    return http.get<AppSettings>(endpoints.settings.base);
  },
  async update(body: Partial<AppSettings>): Promise<AppSettings> {
    if (USE_MOCK) {
      await sleep(500);
      return { currency: 'NGN', taxRateBps: 750, receiptHeader: 'Adaeze General Store', receiptFooter: 'Thank you!', receiptShowLogo: true, lowStockThreshold: 10, emailNotifications: true, pushNotifications: true, ...body };
    }
    return http.patch<AppSettings>(endpoints.settings.base, body);
  },
};

// =====================================================
// Payment methods + subscription charges (Flutterwave)
// =====================================================

export interface SavedCard {
  id: string;
  brand: string;
  last4: string;
  first6: string;
  issuer: string | null;
  country: string | null;
  cardType: string | null;
  expiry: string | null;
  isDefault: boolean;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface SubscriptionChargeRecord {
  id: string;
  txRef: string;
  amountMinor: string;
  currency: string;
  status: 'PENDING' | 'REQUIRES_OTP' | 'SUCCESSFUL' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
  narration: string | null;
  chargeResponseMessage: string | null;
  failureReason: string | null;
  attemptedAt: string;
  finalizedAt: string | null;
  retryCount: number;
  plan: { id: string; name: string } | null;
  card: { id: string; brand: string; last4: string } | null;
}

export interface SubscriptionEventRecord {
  id: string;
  type: string;
  description: string;
  amountMinor: string | null;
  currency: string | null;
  chargeId: string | null;
  cardId: string | null;
  plan: { id: string; name: string } | null;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const paymentService = {
  async getPublicKey(): Promise<{ publicKey: string; title: string; logoUrl: string }> {
    if (USE_MOCK) {
      await sleep(200);
      return { publicKey: 'FLWPUBK_TEST-mock-key-X', title: 'RetailOS Subscription', logoUrl: '' };
    }
    return http.get('/payments/public-key');
  },
  async listCards(): Promise<SavedCard[]> {
    if (USE_MOCK) {
      await sleep(250);
      return [
        { id: 'card_demo_1', brand: 'VISA', last4: '4242', first6: '424242', issuer: 'GTBank', country: 'NG', cardType: 'VISA', expiry: '12/28', isDefault: true, isActive: true, lastUsedAt: new Date(Date.now() - 86400000).toISOString(), createdAt: new Date(Date.now() - 30 * 86400000).toISOString() },
      ];
    }
    return http.get('/payments/cards');
  },
  async addCard(body: { cardNumber: string; cvv: string; expiryMonth: string; expiryYear: string; pin?: string }): Promise<SavedCard | { status: 'pending_otp' | 'pending_3ds'; flwRef?: string; authUrl?: string; flwTransactionId?: number; txRef: string; chargeResponseMessage?: string }> {
    if (USE_MOCK) {
      await sleep(800);
      return { id: 'card_demo_' + Date.now(), brand: 'MASTERCARD', last4: body.cardNumber.slice(-4), first6: body.cardNumber.slice(0, 6), issuer: 'GTBank', country: 'NG', cardType: 'MASTERCARD', expiry: `${body.expiryMonth}/${body.expiryYear}`, isDefault: false, isActive: true, lastUsedAt: null, createdAt: new Date().toISOString() };
    }
    return http.post('/payments/cards', body);
  },
  async removeCard(id: string, force = false): Promise<void> {
    if (USE_MOCK) { await sleep(500); return; }
    await http.delete(`/payments/cards/${id}${force ? '?force=true' : ''}`);
  },
  async setDefaultCard(id: string): Promise<void> {
    if (USE_MOCK) { await sleep(400); return; }
    await http.post(`/payments/cards/${id}/default`);
  },
  async chargeNow(body: { planId?: string; cardId?: string; interval: 'monthly' | 'annual' }): Promise<{ chargeId: string; txRef: string; status: string; flwTransactionId?: number; subscriptionId?: string; newEndDate?: string; amountMinor?: string; currency?: string; message?: string; authUrl?: string }> {
    if (USE_MOCK) {
      await sleep(1000);
      return { chargeId: 'chg_demo_' + Date.now(), txRef: 'MOCK-' + Date.now(), status: 'SUCCESSFUL', newEndDate: new Date(Date.now() + 30 * 86400000).toISOString(), amountMinor: '1500000', currency: 'NGN' };
    }
    return http.post('/payments/charge', body);
  },
  async listCharges(page = 1, limit = 20): Promise<PaginatedResponse<SubscriptionChargeRecord>> {
    if (USE_MOCK) {
      await sleep(300);
      return {
        items: [
          { id: 'chg_demo_1', txRef: 'FLW-retailos-1234-abc', amountMinor: '1500000', currency: 'NGN', status: 'SUCCESSFUL', narration: 'Monthly renewal — Pro plan', chargeResponseMessage: 'Approved', failureReason: null, attemptedAt: new Date(Date.now() - 86400000).toISOString(), finalizedAt: new Date(Date.now() - 86400000).toISOString(), retryCount: 0, plan: { id: 'plan_pro', name: 'Pro' }, card: { id: 'card_demo_1', brand: 'VISA', last4: '4242' } },
        ],
        page: 1, limit: 20, total: 1, totalPages: 1,
      };
    }
    return http.get('/payments/charges', { page, limit });
  },
  async retryCharge(id: string): Promise<{ chargeId: string; status: string }> {
    if (USE_MOCK) { await sleep(800); return { chargeId: id, status: 'SUCCESSFUL' }; }
    return http.post(`/payments/charges/${id}/retry`);
  },
  async listEvents(page = 1, limit = 20): Promise<PaginatedResponse<SubscriptionEventRecord>> {
    if (USE_MOCK) {
      await sleep(300);
      return {
        items: [
          { id: 'evt_1', type: 'CHARGE_SUCCESSFUL', description: 'Charged ₦15,000 for Pro plan', amountMinor: '1500000', currency: 'NGN', chargeId: 'chg_demo_1', cardId: 'card_demo_1', plan: { id: 'plan_pro', name: 'Pro' }, createdAt: new Date(Date.now() - 86400000).toISOString() },
          { id: 'evt_2', type: 'CARD_ADDED', description: 'Added VISA card ending 4242', amountMinor: null, currency: null, chargeId: null, cardId: 'card_demo_1', plan: null, createdAt: new Date(Date.now() - 30 * 86400000).toISOString() },
        ],
        page: 1, limit: 20, total: 2, totalPages: 1,
      };
    }
    return http.get('/payments/events', { page, limit });
  },
};
