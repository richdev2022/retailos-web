import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Download, TrendingUp, Package, Wallet, Users } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { reportService } from '@/lib/services';
import { useActiveBusiness } from '@/hooks/use-active-business';
import { PageHeader } from '@/components/shared/PageHeader';
import { DateRangeFilter, type DateRange } from '@/components/shared/DateRangeFilter';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { formatMoney, toMajor } from '@/lib/format';
import { toCsv, downloadFile } from '@/lib/utils';

const PIE_COLORS = ['#10B981', '#0EA5E9', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function ReportsPage() {
  const { activeBusiness } = useActiveBusiness();
  const currency = activeBusiness?.currency ?? 'NGN';
  const [range, setRange] = React.useState<DateRange>({
    from: new Date(Date.now() - 30 * 86400000).toISOString(),
    to: new Date().toISOString(),
  });
  const [tab, setTab] = React.useState('sales');

  const salesQ = useQuery({
    queryKey: ['report', 'sales', range],
    queryFn: () => reportService.sales({ from: range.from, to: range.to }),
    enabled: !!activeBusiness && tab === 'sales',
  });
  const plQ = useQuery({
    queryKey: ['report', 'profit-loss', range],
    queryFn: () => reportService.profitLoss({ from: range.from, to: range.to }),
    enabled: !!activeBusiness && tab === 'profit-loss',
  });
  const invQ = useQuery({
    queryKey: ['report', 'inventory'],
    queryFn: () => reportService.inventory(),
    enabled: !!activeBusiness && tab === 'inventory',
  });
  const expQ = useQuery({
    queryKey: ['report', 'expenses', range],
    queryFn: () => reportService.expenses({ from: range.from, to: range.to }),
    enabled: !!activeBusiness && tab === 'expenses',
  });

  const exportCurrent = () => {
    let rows: Array<Record<string, unknown>> = [];
    let filename = `report_${Date.now()}.csv`;
    if (tab === 'sales' && salesQ.data) {
      rows = salesQ.data.daily.map((d) => ({ date: d.date, sales: d.sales, revenue: toMajor(d.revenue) }));
      filename = `sales_report_${Date.now()}.csv`;
    } else if (tab === 'profit-loss' && plQ.data) {
      rows = plQ.data.daily.map((d) => ({ date: d.date, grossSales: toMajor(d.grossSales), cogs: toMajor(d.cogs), expenses: toMajor(d.expenses) }));
      filename = `profit_loss_${Date.now()}.csv`;
    } else if (tab === 'inventory' && invQ.data) {
      rows = invQ.data.items.map((i) => ({ name: i.name, sku: i.sku, quantity: i.quantity, value: toMajor(i.value) }));
      filename = `inventory_valuation_${Date.now()}.csv`;
    } else if (tab === 'expenses' && expQ.data) {
      rows = expQ.data.categories.map((c) => ({ category: c.category, total: toMajor(c.total), count: c.count }));
      filename = `expenses_report_${Date.now()}.csv`;
    }
    if (rows.length === 0) return;
    downloadFile(filename, toCsv(rows));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Analytics"
        description="Sales, profit, inventory and expense insights for your business."
        icon={<BarChart3 className="h-5 w-5" />}
        actions={<Button variant="outline" onClick={exportCurrent}><Download className="h-4 w-4" /> Export CSV</Button>}
      />
      <DateRangeFilter value={range} onChange={setRange} />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="profit-loss">Profit &amp; Loss</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          {salesQ.isLoading ? <ReportSkeleton /> : salesQ.data && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Kpi label="Total sales" value={String(salesQ.data.salesCount)} icon={<TrendingUp className="h-5 w-5" />} />
                <Kpi label="Gross revenue" value={formatMoney(salesQ.data.totalRevenue, currency)} icon={<Wallet className="h-5 w-5" />} />
                <Kpi label="Collected" value={formatMoney(salesQ.data.totalPaid, currency)} icon={<Wallet className="h-5 w-5" />} />
                <Kpi label="Outstanding" value={formatMoney(salesQ.data.totalOutstanding, currency)} icon={<Users className="h-5 w-5" />} />
              </div>
              <Card>
                <CardHeader><CardTitle>Daily revenue</CardTitle><CardDescription>Revenue trend over the selected period</CardDescription></CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesQ.data.daily.map((d) => ({ date: d.date.slice(5), revenue: toMajor(d.revenue) }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v) => formatMoney(Number(v) * 100, currency)} />
                      <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="profit-loss" className="space-y-4">
          {plQ.isLoading ? <ReportSkeleton /> : plQ.data && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Kpi label="Gross sales" value={formatMoney(plQ.data.grossSales, currency)} icon={<TrendingUp className="h-5 w-5" />} />
                <Kpi label="COGS" value={formatMoney(plQ.data.cogs, currency)} icon={<Package className="h-5 w-5" />} />
                <Kpi label="Gross profit" value={formatMoney(plQ.data.grossProfit, currency)} icon={<TrendingUp className="h-5 w-5" />} />
                <Kpi label="Operating profit" value={formatMoney(plQ.data.operatingProfit, currency)} icon={<Wallet className="h-5 w-5" />} />
              </div>
              <Card>
                <CardHeader><CardTitle>Profit vs expenses</CardTitle><CardDescription>Daily gross sales, COGS and expenses</CardDescription></CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={plQ.data.daily.map((d) => ({ date: d.date.slice(5), sales: toMajor(d.grossSales), cogs: toMajor(d.cogs), expenses: toMajor(d.expenses) }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v) => formatMoney(Number(v) * 100, currency)} />
                      <Legend />
                      <Bar dataKey="sales" fill="#10B981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="cogs" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          {invQ.isLoading ? <ReportSkeleton /> : invQ.data && (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <Kpi label="Total stock value" value={formatMoney(invQ.data.totalValue, currency)} icon={<Package className="h-5 w-5" />} />
                <Kpi label="Total units" value={String(invQ.data.totalStockQty)} icon={<Package className="h-5 w-5" />} />
                <Kpi label="SKUs in stock" value={String(invQ.data.totalSkuCount)} icon={<Package className="h-5 w-5" />} />
              </div>
              <Card>
                <CardHeader><CardTitle>Inventory by value</CardTitle><CardDescription>Top 8 products by stock value</CardDescription></CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={[...invQ.data.items].sort((a, b) => toMajor(b.value) - toMajor(a.value)).slice(0, 8).map((i) => ({ name: i.name.slice(0, 20), value: toMajor(i.value) }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                      <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => formatMoney(Number(v) * 100, currency)} />
                      <Bar dataKey="value" fill="#0EA5E9" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          {expQ.isLoading ? <ReportSkeleton /> : expQ.data && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Kpi label="Total expenses" value={formatMoney(expQ.data.total, currency)} icon={<Wallet className="h-5 w-5" />} />
                <Kpi label="Categories" value={String(expQ.data.categories.length)} icon={<Wallet className="h-5 w-5" />} />
              </div>
              <Card>
                <CardHeader><CardTitle>Expenses by category</CardTitle><CardDescription>Distribution of spend across categories</CardDescription></CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={expQ.data.categories.map((c) => ({ name: c.category, value: toMajor(c.total) }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e) => e.name}>
                        {expQ.data.categories.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v) => formatMoney(Number(v) * 100, currency)} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Kpi({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="font-heading text-2xl font-semibold">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">{icon}</div>
      </div>
    </Card>
  );
}

function ReportSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-4">
      {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 animate-pulse rounded-lg bg-muted" />)}
    </div>
  );
}
