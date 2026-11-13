/**
 * Shared domain types mirroring the RetailOS backend API contract.
 * Money is stored as integer minor units (kobo for NGN) and serialized as
 * strings (BigInt-safe). Reports return a `MoneyField` of `{ minor, major }`.
 */

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  code?: string;
  errors?: Array<{ field?: string; message: string }>;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export type MoneyField = { minor: string; major: number };

// ---------- Auth / User ----------
export interface User {
  id: string;
  fullName: string;
  email: string | null;
  phone: string;
  status: 'ACTIVE' | 'SUSPENDED';
  avatarUrl?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
}

export interface AuthSession {
  user: User;
  accessToken: string;
  expiresIn: number;
}

// ---------- Business ----------
export interface Business {
  id: string;
  ownerId: string;
  name: string;
  category: string | null;
  phone: string;
  email: string | null;
  country: string;
  currency: string;
  address: string | null;
  logoUrl: string | null;
  taxIdentifier: string | null;
  taxRateBps: number;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
  updatedAt: string;
}

export interface Branch {
  id: string;
  businessId: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  isHQ: boolean;
  createdAt: string;
}

// ---------- Products ----------
export interface Category {
  id: string;
  businessId: string;
  parentId: string | null;
  name: string;
  description: string | null;
  createdAt: string;
}

export interface Product {
  id: string;
  businessId: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  imageUrl: string | null;
  sku: string;
  barcode: string | null;
  brand: string | null;
  costPriceMinor: string;
  sellingPriceMinor: string;
  wholesalePriceMinor: string | null;
  minStock: number;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  stockQuantity?: number;
  wacCostMinor?: string;
  createdAt: string;
  updatedAt: string;
}

// ---------- Inventory ----------
export type MovementType =
  | 'INITIAL_STOCK'
  | 'PURCHASE_RECEIPT'
  | 'SALE_DEDUCTION'
  | 'SALE_REVERSAL'
  | 'ADJUSTMENT'
  | 'DAMAGED'
  | 'EXPIRED'
  | 'SUPPLIER_RETURN'
  | 'BRANCH_TRANSFER_OUT'
  | 'BRANCH_TRANSFER_IN'
  | 'STOCK_OUT';

export interface InventoryMovement {
  id: string;
  productId: string;
  productName?: string;
  movementType: MovementType;
  quantity: number;
  referenceType: string | null;
  referenceId: string | null;
  batchNo: string | null;
  unitCostMinor: string;
  totalCostMinor: string;
  reason: string | null;
  notes: string | null;
  createdAt: string;
}

export interface InventoryBalance {
  productId: string;
  productName?: string;
  sku?: string;
  quantity: number;
  wacCostMinor: string;
  updatedAt: string | null;
}

// ---------- Sales ----------
export type SaleStatus =
  | 'DRAFT'
  | 'PENDING_PAYMENT'
  | 'PARTIALLY_PAID'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CARD_POS' | 'CUSTOMER_CREDIT' | 'OTHER';

export interface SaleItem {
  id: string;
  productId: string;
  productName?: string;
  quantity: number;
  unitPriceMinor: string;
  unitCostMinor: string;
  discountMinor: string;
  totalMinor: string;
  totalCostMinor: string;
}

export interface SalePayment {
  id: string;
  method: PaymentMethod;
  amountMinor: string;
  reference: string | null;
  paidAt: string;
}

export interface Sale {
  id: string;
  receiptNo: string;
  cashierId: string;
  cashierName?: string;
  customerId: string | null;
  customerName?: string | null;
  status: SaleStatus;
  subtotalMinor: string;
  discountMinor: string;
  taxMinor: string;
  totalMinor: string;
  amountPaidMinor: string;
  outstandingMinor: string;
  notes: string | null;
  saleDate: string;
  items?: SaleItem[];
  payments?: SalePayment[];
  createdAt: string;
}

// ---------- Purchases ----------
export type PurchaseStatus = 'DRAFT' | 'ORDERED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';

export interface PurchaseItem {
  id: string;
  productId: string;
  productName?: string;
  quantity: number;
  receivedQuantity: number;
  unitCostMinor: string;
  totalMinor: string;
}

export interface Purchase {
  id: string;
  reference: string;
  supplierId: string;
  supplierName?: string;
  status: PurchaseStatus;
  totalMinor: string;
  paidMinor: string;
  outstandingMinor: string;
  notes: string | null;
  orderDate: string;
  receivedAt: string | null;
  items?: PurchaseItem[];
  createdAt: string;
}

// ---------- Expenses ----------
export interface Expense {
  id: string;
  category: string;
  description: string;
  amountMinor: string;
  paymentMethod: PaymentMethod;
  reference: string | null;
  expenseDate: string;
  createdAt: string;
}

// ---------- Customers ----------
export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  type: string | null;
  notes: string | null;
  outstandingBalanceMinor: string;
  createdAt: string;
}

// ---------- Suppliers ----------
export interface Supplier {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  contactPerson: string | null;
  payablesMinor: string;
  createdAt: string;
}

// ---------- Reports ----------
export interface DashboardMetrics {
  range: { from: string; to: string };
  todaySales: MoneyField;
  todaySalesCount: number;
  grossProfit: MoneyField;
  productCount: number;
  stockQty: number;
  inventoryValue: MoneyField;
  lowStockCount: number;
  outOfStockCount: number;
  outstandingCredit: MoneyField;
  expensesToday: MoneyField;
  salesTrend: Array<{ date: string; sales: number; profit: number }>;
  paymentMethodBreakdown: Array<{ method: PaymentMethod; count: number; amount: MoneyField }>;
  topProducts: Array<{
    productId: string;
    name: string;
    quantitySold: number;
    revenue: MoneyField;
  }>;
  recentTransactions: Array<{
    id: string;
    receiptNo: string;
    total: MoneyField;
    status: SaleStatus;
    date: string;
    customerName: string | null;
  }>;
}

export interface SalesReport {
  from: string;
  to: string;
  salesCount: number;
  totalRevenue: MoneyField;
  totalDiscount: MoneyField;
  totalTax: MoneyField;
  totalPaid: MoneyField;
  totalOutstanding: MoneyField;
  statusCounts: Record<string, number>;
  daily: Array<{
    date: string;
    sales: number;
    revenue: MoneyField;
    discount: MoneyField;
    tax: MoneyField;
  }>;
}

export interface ProfitLossReport {
  from: string;
  to: string;
  grossSales: MoneyField;
  salesReturns: MoneyField;
  netSales: MoneyField;
  cogs: MoneyField;
  grossProfit: MoneyField;
  operatingExpenses: MoneyField;
  operatingProfit: MoneyField;
  taxCollected: MoneyField;
  daily: Array<{
    date: string;
    grossSales: MoneyField;
    returns: MoneyField;
    cogs: MoneyField;
    expenses: MoneyField;
  }>;
}

export interface InventoryReport {
  totalSkuCount: number;
  totalStockQty: number;
  totalValue: MoneyField;
  items: Array<{
    productId: string;
    name: string;
    sku: string;
    quantity: number;
    wacCost: MoneyField;
    value: MoneyField;
    minStock: number;
    stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  }>;
}

export interface ExpensesReport {
  from: string;
  to: string;
  total: MoneyField;
  categories: Array<{ category: string; count: number; total: MoneyField }>;
}

export interface CashierReport {
  items: Array<{
    cashierId: string;
    name: string;
    salesCount: number;
    revenue: MoneyField;
    refunds: MoneyField;
  }>;
}

export interface CustomerCreditReport {
  items: Array<{
    customerId: string;
    name: string;
    outstanding: MoneyField;
    oldestCredit: string | null;
  }>;
  total: MoneyField;
}

export interface SupplierReport {
  items: Array<{
    supplierId: string;
    name: string;
    totalPurchases: MoneyField;
    totalPaid: MoneyField;
    payables: MoneyField;
  }>;
  total: MoneyField;
}

// ---------- Staff ----------
export interface StaffMember {
  id: string;
  userId: string;
  fullName: string;
  email: string | null;
  phone: string;
  role: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  lastLoginAt: string | null;
  createdAt: string;
}

export interface StaffInvitation {
  id: string;
  email: string;
  role: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED';
  expiresAt: string;
  createdAt: string;
}

// ---------- Subscriptions ----------
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  priceMinor: string;
  interval: 'MONTHLY' | 'YEARLY';
  features: string[];
  productLimit: number | null;
  staffLimit: number | null;
  branchLimit: number | null;
  popular?: boolean;
}

export interface Subscription {
  id: string;
  plan: SubscriptionPlan;
  status: 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  startDate: string;
  endDate: string | null;
  graceEndsAt: string | null;
}

// ---------- Notifications ----------
export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: 'SALE' | 'STOCK' | 'SYSTEM' | 'SUBSCRIPTION' | 'STAFF';
  read: boolean;
  createdAt: string;
}

// ---------- Support ----------
export interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
}

// ---------- Settings ----------
export interface AppSettings {
  currency: string;
  taxRateBps: number;
  receiptHeader: string;
  receiptFooter: string;
  receiptShowLogo: boolean;
  lowStockThreshold: number;
  emailNotifications: boolean;
  pushNotifications: boolean;
}
