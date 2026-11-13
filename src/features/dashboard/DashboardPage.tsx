import * as React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import {
  TrendingUp,
  Wallet,
  Package,
  Boxes,
  AlertTriangle,
  PackageX,
  CreditCard,
  Receipt,
  ArrowUpRight,
  ShoppingBag,
} from 'lucide-react';
import { reportService } from '@/lib/services';
import { useActiveBusiness } from '@/hooks/use-active-business';
import { StatCard } from '@/components/shared/StatCard';
import { DateRangeFilter, type DateRange } from '@/components/shared/DateRangeFilter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AreaChart, PieChart } from '@/components/charts';
import { formatMoney, formatDateTime, toMajor, currencySymbolFor } from '@/lib/format';
import { formatNumber } from '@/lib/utils';
import type { SaleStatus } from '@/lib/types';

const statusVariant: Record<SaleStatus, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  COMPLETED: 'success',
  PARTIALLY_PAID: 'warning',
  PENDING_PAYMENT: 'warning',
  REFUNDED: 'destructive',
  CANCELLED: 'destructive',
  DRAFT: 'secondary',
};

export default function DashboardPage() {
  const { activeBusiness } = useActiveBusiness();
  const [range, setRange] = React.useState<DateRange>({
    from: new Date(Date.now() - 30 * 86400000).toISOString(),
    to: new Date().toISOString(),
  });
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', range.from, range.to],
    queryFn: () => reportService.dashboard(),
    enabled: !!activeBusiness,
  });
  const currency = activeBusiness?.currency ?? 'NGN';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Here's what's happening at {activeBusiness?.name ?? 'your business'} today.</p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangeFilter value={range} onChange={setRange} />
          <Button variant="accent" asChild>
            <Link to="/pos"><ShoppingBag className="h-4 w-4" /> New sale</Link>
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Today's Sales" value={isLoading ? '' : formatMoney(data?.todaySales, currency)} loading={isLoading} icon={<Wallet className="h-5 w-5" />} trend={{ value: 12.4, positive: true }} hint={isLoading ? '' : `${data?.todaySalesCount ?? 0} transactions`} accent="accent" />
        <StatCard label="Gross Profit" value={isLoading ? '' : formatMoney(data?.grossProfit, currency)} loading={isLoading} icon={<TrendingUp className="h-5 w-5" />} trend={{ value: 8.1, positive: true }} hint="today" accent="success" />
        <StatCard label="Inventory Value" value={isLoading ? '' : formatMoney(data?.inventoryValue, currency, { compact: true })} loading={isLoading} icon={<Boxes className="h-5 w-5" />} hint={isLoading ? '' : `${formatNumber(data?.stockQty ?? 0)} units`} accent="primary" />
        <StatCard label="Outstanding Credit" value={isLoading ? '' : formatMoney(data?.outstandingCredit, currency)} loading={isLoading} icon={<CreditCard className="h-5 w-5" />} hint="owed by customers" accent="warning" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Products" value={isLoading ? '' : formatNumber(data?.productCount ?? 0)} loading={isLoading} icon={<Package className="h-5 w-5" />} accent="primary" />
        <StatCard label="Stock Quantity" value={isLoading ? '' : formatNumber(data?.stockQty ?? 0)} loading={isLoading} icon={<Boxes className="h-5 w-5" />} accent="primary" />
        <StatCard label="Low Stock" value={isLoading ? '' : formatNumber(data?.lowStockCount ?? 0)} loading={isLoading} icon={<AlertTriangle className="h-5 w-5" />} accent="warning" hint="need restocking" />
        <StatCard label="Out of Stock" value={isLoading ? '' : formatNumber(data?.outOfStockCount ?? 0)} loading={isLoading} icon={<PackageX className="h-5 w-5" />} accent="destructive" />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Sales & Profit Trend</CardTitle>
              <CardDescription>Last 14 days</CardDescription>
            </div>
            <Badge variant="accent">{currencySymbolFor(currency)}</Badge>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : (
              <AreaChart
                data={(data?.salesTrend ?? []).map((t) => ({
                  date: format(parseISO(t.date), 'MMM dd'),
                  sales: toMajor(t.sales ? String(t.sales) : 0),
                  profit: toMajor(t.profit ? String(t.profit) : 0),
                }))}
                xKey="date"
                series={[{ key: 'sales', name: 'Sales' }, { key: 'profit', name: 'Profit', color: '#0EA5E9' }]}
                valueFormatter={(v) => formatMoney(v * 100, currency, { compact: true })}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Today's breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : (
              <PieChart
                data={(data?.paymentMethodBreakdown ?? []).map((p) => ({ name: p.method.replace('_', ' '), value: toMajor(p.amount) }))}
                valueFormatter={(v) => formatMoney(v * 100, currency, { compact: true })}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top products + recent transactions */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Top Products</CardTitle>
              <CardDescription>Best sellers this period</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/products">View all <ArrowUpRight className="h-3.5 w-3.5" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-1">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
            ) : data?.topProducts.length ? (
              data.topProducts.map((p, i) => (
                <div key={p.productId} className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/50">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/10 text-xs font-semibold text-accent">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{formatNumber(p.quantitySold)} sold</p>
                  </div>
                  <p className="text-sm font-semibold">{formatMoney(p.revenue, currency)}</p>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">No sales yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest sales activity</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/sales">View all <ArrowUpRight className="h-3.5 w-3.5" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-1">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
            ) : data?.recentTransactions.length ? (
              data.recentTransactions.map((t) => (
                <Link key={t.id} to={`/sales/${t.id}`} className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/50">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Receipt className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.receiptNo}</p>
                    <p className="truncate text-xs text-muted-foreground">{t.customerName ?? 'Walk-in'} · {formatDateTime(t.date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatMoney(t.total, currency)}</p>
                    <Badge variant={statusVariant[t.status]} className="mt-0.5 text-[10px]">{t.status.replace('_', ' ').toLowerCase()}</Badge>
                  </div>
                </Link>
              ))
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">No transactions yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
