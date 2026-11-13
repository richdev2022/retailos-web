import { uid } from '../utils';

/**
 * Realistic mock data for out-of-the-box demo when VITE_USE_MOCK=true.
 * Money fields are integers in minor units (kobo for NGN).
 */

const NGN = (major: number) => String(Math.round(major * 100));
const money = (major: number) => ({ minor: NGN(major), major });

const now = Date.now();
const daysAgo = (n: number) => new Date(now - n * 86400000).toISOString();
const hoursAgo = (n: number) => new Date(now - n * 3600000).toISOString();

export const mockUser = {
  id: 'usr_demo_001',
  fullName: 'Adaeze Okonkwo',
  email: 'adaeze@retailos.demo',
  phone: '+2348012345678',
  status: 'ACTIVE' as const,
  avatarUrl: null,
  lastLoginAt: hoursAgo(2),
  createdAt: daysAgo(120),
};

export const mockBusinesses = [
  {
    id: 'biz_demo_001',
    ownerId: 'usr_demo_001',
    name: 'Adaeze General Store',
    category: 'Grocery',
    phone: '+2348012345678',
    email: 'store@retailos.demo',
    country: 'NG',
    currency: 'NGN',
    address: '12 Market Road, Onitsha, Anambra',
    logoUrl: null,
    taxIdentifier: 'TIN-9876543-0001',
    taxRateBps: 750,
    status: 'ACTIVE' as const,
    createdAt: daysAgo(120),
    updatedAt: daysAgo(2),
  },
  {
    id: 'biz_demo_002',
    ownerId: 'usr_demo_001',
    name: 'Naija Electronics Hub',
    category: 'Electronics',
    phone: '+2348099988776',
    email: 'sales@naijaelectronics.demo',
    country: 'NG',
    currency: 'NGN',
    address: '45 Computer Village, Ikeja, Lagos',
    logoUrl: null,
    taxIdentifier: 'TIN-9876543-0002',
    taxRateBps: 750,
    status: 'ACTIVE' as const,
    createdAt: daysAgo(60),
    updatedAt: daysAgo(1),
  },
];

export const mockBranches = [
  { id: 'br_demo_hq', businessId: 'biz_demo_001', name: 'Adaeze General Store (HQ)', phone: '+2348012345678', email: 'store@retailos.demo', address: '12 Market Road, Onitsha', isHQ: true, createdAt: daysAgo(120) },
  { id: 'br_demo_002', businessId: 'biz_demo_001', name: 'Owerri Branch', phone: '+2348055544332', email: null, address: '7 Wetheral Rd, Owerri', isHQ: false, createdAt: daysAgo(45) },
];

const categories = [
  { id: 'cat_1', businessId: 'biz_demo_001', parentId: null, name: 'Beverages', description: 'Soft drinks, water, juices', createdAt: daysAgo(110) },
  { id: 'cat_2', businessId: 'biz_demo_001', parentId: null, name: 'Snacks', description: 'Chin-chin, biscuits', createdAt: daysAgo(110) },
  { id: 'cat_3', businessId: 'biz_demo_001', parentId: null, name: 'Household', description: 'Detergents, soap', createdAt: daysAgo(110) },
  { id: 'cat_4', businessId: 'biz_demo_001', parentId: null, name: 'Electronics', description: 'Phones, accessories', createdAt: daysAgo(110) },
];

const productSeed = [
  { name: 'Coca-Cola 50cl', sku: 'BEV-CC-50', barcode: '5012345678900', category: 'Beverages', cost: 250, price: 400, stock: 320, min: 50 },
  { name: 'Pepsi 50cl', sku: 'BEV-PP-50', barcode: '5012345678901', category: 'Beverages', cost: 240, price: 380, stock: 18, min: 50 },
  { name: 'Bigi Apple 60cl', sku: 'BEV-BG-60', barcode: '5012345678902', category: 'Beverages', cost: 200, price: 350, stock: 140, min: 40 },
  { name: 'Indomie Chicken 70g', sku: 'SNK-IND-70', barcode: '5012345678903', category: 'Snacks', cost: 130, price: 200, stock: 540, min: 100 },
  { name: 'Mini Chin-chin 200g', sku: 'SNK-CHN-200', barcode: '5012345678904', category: 'Snacks', cost: 350, price: 600, stock: 75, min: 30 },
  { name: 'Happy Hour Biscuit', sku: 'SNK-HHB-01', barcode: '5012345678905', category: 'Snacks', cost: 50, price: 100, stock: 0, min: 80 },
  { name: 'Dettol Soap 175g', sku: 'HSH-DTS-175', barcode: '5012345678906', category: 'Household', cost: 480, price: 750, stock: 60, min: 20 },
  { name: ' Ariel Detergent 1kg', sku: 'HSH-AD-1KG', barcode: '5012345678907', category: 'Household', cost: 1200, price: 1800, stock: 40, min: 15 },
  { name: 'Mamador Oil 3.5L', sku: 'HSH-MO-35', barcode: '5012345678908', category: 'Household', cost: 4500, price: 6200, stock: 22, min: 10 },
  { name: 'Tecno Spark 10 Case', sku: 'ELC-TS10-C', barcode: '5012345678909', category: 'Electronics', cost: 800, price: 1500, stock: 35, min: 10 },
  { name: 'USB-C Cable 1m', sku: 'ELC-USBC-1', barcode: '5012345678910', category: 'Electronics', cost: 300, price: 700, stock: 8, min: 20 },
  { name: 'Power Bank 10000mAh', sku: 'ELC-PB-10K', barcode: '5012345678911', category: 'Electronics', cost: 3500, price: 6500, stock: 14, min: 5 },
];

export const mockProducts = productSeed.map((p, i) => {
  const cat = categories.find((c) => c.name === p.category)!;
  return {
    id: `prd_${String(i + 1).padStart(3, '0')}`,
    businessId: 'biz_demo_001',
    categoryId: cat.id,
    name: p.name.trim(),
    description: `${p.name} - quality product`,
    imageUrl: null,
    sku: p.sku,
    barcode: p.barcode,
    brand: 'Generic',
    costPriceMinor: NGN(p.cost),
    sellingPriceMinor: NGN(p.price),
    wholesalePriceMinor: NGN(Math.round(p.price * 0.9)),
    minStock: p.min,
    status: 'ACTIVE' as const,
    stockQuantity: p.stock,
    wacCostMinor: NGN(p.cost),
    createdAt: daysAgo(100 - i),
    updatedAt: daysAgo(i % 7),
  };
});

export { categories as mockCategories };

export const mockDashboard: import('../types').DashboardMetrics = {
  range: { from: daysAgo(29), to: new Date().toISOString() },
  todaySales: money(84250),
  todaySalesCount: 47,
  grossProfit: money(26180),
  productCount: mockProducts.length,
  stockQty: mockProducts.reduce((s, p) => s + (p.stockQuantity ?? 0), 0),
  inventoryValue: money(mockProducts.reduce((s, p) => s + (p.stockQuantity ?? 0) * (Number(p.costPriceMinor) / 100), 0)),
  lowStockCount: mockProducts.filter((p) => (p.stockQuantity ?? 0) > 0 && (p.stockQuantity ?? 0) <= p.minStock).length,
  outOfStockCount: mockProducts.filter((p) => (p.stockQuantity ?? 0) === 0).length,
  outstandingCredit: money(124500),
  expensesToday: money(8200),
  salesTrend: Array.from({ length: 14 }, (_, i) => {
    const d = daysAgo(13 - i);
    const base = 60000 + Math.sin(i / 2) * 18000 + i * 1200;
    const sales = Math.round(base + Math.random() * 12000);
    return {
      date: d,
      sales,
      profit: Math.round(sales * 0.31 + Math.random() * 2000),
    };
  }),
  paymentMethodBreakdown: [
    { method: 'CASH' as const, count: 28, amount: money(48200) },
    { method: 'BANK_TRANSFER' as const, count: 12, amount: money(24800) },
    { method: 'CARD_POS' as const, count: 7, amount: money(11250) },
  ],
  topProducts: [
    { productId: 'prd_001', name: 'Coca-Cola 50cl', quantitySold: 86, revenue: money(34400) },
    { productId: 'prd_004', name: 'Indomie Chicken 70g', quantitySold: 72, revenue: money(14400) },
    { productId: 'prd_008', name: 'Ariel Detergent 1kg', quantitySold: 19, revenue: money(34200) },
    { productId: 'prd_009', name: 'Mamador Oil 3.5L', quantitySold: 12, revenue: money(74400) },
    { productId: 'prd_012', name: 'Power Bank 10000mAh', quantitySold: 6, revenue: money(39000) },
  ],
  recentTransactions: [
    { id: uid('sale_'), receiptNo: 'RCP-002841', total: money(4200), status: 'COMPLETED', date: hoursAgo(1), customerName: 'Walk-in customer' },
    { id: uid('sale_'), receiptNo: 'RCP-002840', total: money(18500), status: 'COMPLETED', date: hoursAgo(2), customerName: 'Mr. Bola Adeyemi' },
    { id: uid('sale_'), receiptNo: 'RCP-002839', total: money(2300), status: 'COMPLETED', date: hoursAgo(3), customerName: 'Walk-in customer' },
    { id: uid('sale_'), receiptNo: 'RCP-002838', total: money(47000), status: 'PARTIALLY_PAID', date: hoursAgo(4), customerName: 'Mrs. Ngozi Eze' },
    { id: uid('sale_'), receiptNo: 'RCP-002837', total: money(1500), status: 'COMPLETED', date: hoursAgo(5), customerName: 'Walk-in customer' },
  ],
};

export const mockCustomers = [
  { id: 'cus_001', name: 'Bola Adeyemi', phone: '+2348023456789', email: 'bola@example.com', address: ' Lagos Island', type: 'RETAILER', notes: null, outstandingBalanceMinor: NGN(0), createdAt: daysAgo(80) },
  { id: 'cus_002', name: 'Ngozi Eze', phone: '+2348034567890', email: null, address: 'Onitsha', type: 'WHOLESALE', notes: 'Pays monthly', outstandingBalanceMinor: NGN(47000), createdAt: daysAgo(70) },
  { id: 'cus_003', name: 'Ibrahim Musa', phone: '+2348045678901', email: null, address: 'Kano', type: 'INDIVIDUAL', notes: null, outstandingBalanceMinor: NGN(12500), createdAt: daysAgo(40) },
  { id: 'cus_004', name: 'Grace Obi', phone: '+2348056789012', email: 'grace@example.com', address: 'Enugu', type: 'RETAILER', notes: null, outstandingBalanceMinor: NGN(0), createdAt: daysAgo(20) },
];

export const mockSuppliers = [
  { id: 'sup_001', name: 'Coca-Cola Nigeria', phone: '+2347000000001', email: 'orders@cchellenic.ng', address: 'Lagos', contactPerson: 'Sales Rep', payablesMinor: NGN(0), createdAt: daysAgo(110) },
  { id: 'sup_002', name: 'Dufil Prima Foods', phone: '+2347000000002', email: null, address: 'Agbara', contactPerson: 'Tunde', payablesMinor: NGN(84000), createdAt: daysAgo(100) },
  { id: 'sup_003', name: 'PZ Cussons', phone: '+2347000000003', email: 'trade@pzcussons.com', address: 'Ikeja', contactPerson: null, payablesMinor: NGN(0), createdAt: daysAgo(90) },
];

export const mockSales: import('../types').Sale[] = Array.from({ length: 18 }, (_, i) => {
  const items = [
    { id: uid('si_'), productId: mockProducts[i % mockProducts.length]!.id, productName: mockProducts[i % mockProducts.length]!.name, quantity: 2 + (i % 5), unitPriceMinor: mockProducts[i % mockProducts.length]!.sellingPriceMinor, unitCostMinor: mockProducts[i % mockProducts.length]!.costPriceMinor, discountMinor: '0', totalMinor: NGN((2 + (i % 5)) * (Number(mockProducts[i % mockProducts.length]!.sellingPriceMinor) / 100)), totalCostMinor: NGN((2 + (i % 5)) * (Number(mockProducts[i % mockProducts.length]!.costPriceMinor) / 100)) },
  ];
  const total = Number(items[0]!.totalMinor);
  const paid = i % 7 === 0 ? Math.round(total * 0.5) : total;
  return {
    id: uid('sale_'),
    receiptNo: `RCP-00${2822 - i}`,
    cashierId: 'usr_demo_001',
    cashierName: 'Adaeze Okonkwo',
    customerId: i % 3 === 0 ? mockCustomers[i % mockCustomers.length]!.id : null,
    customerName: i % 3 === 0 ? mockCustomers[i % mockCustomers.length]!.name : 'Walk-in customer',
    status: i % 7 === 0 ? 'PARTIALLY_PAID' : 'COMPLETED',
    subtotalMinor: String(total),
    discountMinor: '0',
    taxMinor: String(Math.round(total * 0.075)),
    totalMinor: String(total + Math.round(total * 0.075)),
    amountPaidMinor: String(paid),
    outstandingMinor: String(total - paid),
    notes: null,
    saleDate: hoursAgo(i * 3 + 1),
    items,
    payments: [{ id: uid('pay_'), method: (i % 3 === 0 ? 'CASH' : i % 3 === 1 ? 'BANK_TRANSFER' : 'CARD_POS') as 'CASH' | 'BANK_TRANSFER' | 'CARD_POS', amountMinor: String(paid), reference: null, paidAt: hoursAgo(i * 3 + 1) }],
    createdAt: hoursAgo(i * 3 + 1),
  };
});

export const mockPlans: import('../types').SubscriptionPlan[] = [
  { id: 'plan_starter', name: 'Starter', description: 'For small shops getting started', priceMinor: NGN(5000), interval: 'MONTHLY', features: ['Up to 100 products', '1 branch', '2 staff', 'Basic reports'], productLimit: 100, staffLimit: 2, branchLimit: 1 },
  { id: 'plan_growth', name: 'Growth', description: 'For growing retailers', priceMinor: NGN(12000), interval: 'MONTHLY', features: ['Up to 5,000 products', '3 branches', '10 staff', 'Advanced reports', 'Multi-currency'], productLimit: 5000, staffLimit: 10, branchLimit: 3, popular: true },
  { id: 'plan_enterprise', name: 'Enterprise', description: 'For large operations', priceMinor: NGN(35000), interval: 'MONTHLY', features: ['Unlimited products', 'Unlimited branches', 'Unlimited staff', 'Custom reports', 'API access', 'Priority support'], productLimit: null, staffLimit: null, branchLimit: null },
];

export const mockSubscription: import('../types').Subscription = {
  id: 'sub_demo_001',
  plan: mockPlans[1]!,
  status: 'TRIAL',
  startDate: daysAgo(10),
  endDate: daysAgo(-4),
  graceEndsAt: daysAgo(-7),
};
