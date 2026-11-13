import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Warehouse, ArrowDownToLine, ArrowUpFromLine, SlidersHorizontal, ClipboardList, Package,
} from 'lucide-react';
import { inventoryService, productService } from '@/lib/services';
import { useActiveBusiness } from '@/hooks/use-active-business';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { StatCard } from '@/components/shared/StatCard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectItem } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { ApiError } from '@/lib/api';
import { formatMoney, formatDateTime, majorToMinorString } from '@/lib/format';
import { formatNumber } from '@/lib/utils';
import type { InventoryMovement, InventoryBalance, MovementType } from '@/lib/types';

const movementVariant: Record<MovementType, 'success' | 'destructive' | 'warning' | 'secondary'> = {
  INITIAL_STOCK: 'secondary', PURCHASE_RECEIPT: 'success', SALE_DEDUCTION: 'destructive', SALE_REVERSAL: 'warning',
  ADJUSTMENT: 'warning', DAMAGED: 'destructive', EXPIRED: 'destructive', SUPPLIER_RETURN: 'warning',
  BRANCH_TRANSFER_OUT: 'destructive', BRANCH_TRANSFER_IN: 'success', STOCK_OUT: 'destructive',
};

export default function InventoryPage() {
  const { activeBusiness } = useActiveBusiness();
  const currency = activeBusiness?.currency ?? 'NGN';
  const [tab, setTab] = React.useState('overview');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description="Track stock movements, balances and perform stocktakes."
        icon={<Warehouse className="h-5 w-5" />}
      />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview"><ClipboardList className="h-4 w-4" /> Overview</TabsTrigger>
          <TabsTrigger value="movements"><SlidersHorizontal className="h-4 w-4" /> Movements</TabsTrigger>
          <TabsTrigger value="stock-in"><ArrowDownToLine className="h-4 w-4" /> Stock In</TabsTrigger>
          <TabsTrigger value="stock-out"><ArrowUpFromLine className="h-4 w-4" /> Stock Out</TabsTrigger>
          <TabsTrigger value="adjust"><SlidersHorizontal className="h-4 w-4" /> Adjust</TabsTrigger>
        </TabsList>

        <TabsContent value="overview"><Overview currency={currency} /></TabsContent>
        <TabsContent value="movements"><Movements currency={currency} /></TabsContent>
        <TabsContent value="stock-in"><StockForm mode="in" currency={currency} /></TabsContent>
        <TabsContent value="stock-out"><StockForm mode="out" currency={currency} /></TabsContent>
        <TabsContent value="adjust"><StockForm mode="adjust" currency={currency} /></TabsContent>
      </Tabs>
    </div>
  );
}

function Overview({ currency }: { currency: string }) {
  const { activeBusiness } = useActiveBusiness();
  const [page, setPage] = React.useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['inventory-balances', page],
    queryFn: () => inventoryService.balances({ page, limit: 12 }),
    enabled: !!activeBusiness,
  });

  const balances = data?.items ?? [];
  const totalValue = balances.reduce((s, b) => s + Number(b.wacCostMinor) * b.quantity, 0);
  const lowStock = balances.filter((b) => b.quantity > 0 && b.quantity <= 5).length;
  const outStock = balances.filter((b) => b.quantity === 0).length;

  const columns: Column<InventoryBalance>[] = [
    {
      key: 'product', header: 'Product',
      cell: (b) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent"><Package className="h-4 w-4" /></div>
          <div><p className="font-medium">{b.productName}</p><p className="text-xs text-muted-foreground">{b.sku}</p></div>
        </div>
      ),
    },
    { key: 'qty', header: 'Quantity', align: 'right', cell: (b) => <span className="font-medium">{formatNumber(b.quantity)}</span> },
    { key: 'wac', header: 'Avg Cost', align: 'right', cell: (b) => <span className="text-muted-foreground">{formatMoney(b.wacCostMinor, currency)}</span> },
    { key: 'value', header: 'Value', align: 'right', cell: (b) => <span className="font-medium">{formatMoney(Number(b.wacCostMinor) * b.quantity, currency)}</span> },
    {
      key: 'status', header: 'Status',
      cell: (b) => b.quantity === 0 ? <Badge variant="destructive">Out</Badge> : b.quantity <= 5 ? <Badge variant="warning">Low</Badge> : <Badge variant="success">In stock</Badge>,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Inventory Value" value={isLoading ? '' : formatMoney(totalValue, currency)} loading={isLoading} icon={<Warehouse className="h-5 w-5" />} accent="primary" />
        <StatCard label="Low Stock Items" value={isLoading ? '' : formatNumber(lowStock)} loading={isLoading} icon={<SlidersHorizontal className="h-5 w-5" />} accent="warning" />
        <StatCard label="Out of Stock" value={isLoading ? '' : formatNumber(outStock)} loading={isLoading} icon={<ArrowUpFromLine className="h-5 w-5" />} accent="destructive" />
      </div>
      <DataTable
        columns={columns}
        data={balances}
        loading={isLoading}
        rowKey={(b) => b.productId}
        emptyTitle="No inventory balances"
        emptyIcon={<Package className="h-6 w-6" />}
        page={page}
        totalPages={data?.totalPages}
        total={data?.total}
        onPageChange={setPage}
      />
    </div>
  );
}

function Movements({ currency }: { currency: string }) {
  const { activeBusiness } = useActiveBusiness();
  const [page, setPage] = React.useState(1);
  const [typeFilter, setTypeFilter] = React.useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['inventory-movements', { type: typeFilter, page }],
    queryFn: () => inventoryService.movements({ type: typeFilter || undefined, page, limit: 12 }),
    enabled: !!activeBusiness,
  });

  const columns: Column<InventoryMovement>[] = [
    { key: 'date', header: 'Date', cell: (m) => <span className="text-sm text-muted-foreground">{formatDateTime(m.createdAt)}</span> },
    {
      key: 'product', header: 'Product',
      cell: (m) => (<div><p className="font-medium">{m.productName}</p><p className="text-xs text-muted-foreground">{m.referenceType ?? 'Manual'}</p></div>),
    },
    {
      key: 'type', header: 'Type',
      cell: (m) => <Badge variant={movementVariant[m.movementType]}>{m.movementType.replace(/_/g, ' ').toLowerCase()}</Badge>,
    },
    { key: 'qty', header: 'Qty', align: 'right', cell: (m) => <span className={`font-medium ${m.quantity < 0 ? 'text-destructive' : 'text-success'}`}>{m.quantity > 0 ? '+' : ''}{m.quantity}</span> },
    { key: 'cost', header: 'Unit Cost', align: 'right', cell: (m) => <span className="text-muted-foreground">{formatMoney(m.unitCostMinor, currency)}</span> },
    { key: 'total', header: 'Total', align: 'right', cell: (m) => <span>{formatMoney(m.totalCostMinor, currency)}</span> },
    { key: 'reason', header: 'Reason', cell: (m) => <span className="text-sm text-muted-foreground">{m.reason ?? '-'}</span> },
  ];

  return (
    <DataTable
      columns={columns}
      data={data?.items ?? []}
      loading={isLoading}
      rowKey={(m) => m.id}
      emptyTitle="No movements yet"
      emptyIcon={<SlidersHorizontal className="h-6 w-6" />}
      page={page}
      totalPages={data?.totalPages}
      total={data?.total}
      onPageChange={setPage}
      toolbar={
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">{typeFilter || 'All types'}</SelectTrigger>
          <SelectItem value="">All types</SelectItem>
          {(['PURCHASE_RECEIPT','SALE_DEDUCTION','SALE_REVERSAL','ADJUSTMENT','DAMAGED','EXPIRED','STOCK_OUT','SUPPLIER_RETURN'] as MovementType[]).map((t) => <SelectItem key={t} value={t}>{t.replace(/_/g,' ').toLowerCase()}</SelectItem>)}
        </Select>
      }
    />
  );
}

const stockSchema = z.object({
  productId: z.string().min(1, 'Select a product'),
  quantity: z.coerce.number().min(1, 'Quantity must be >= 1'),
  unitCost: z.coerce.number().min(0).optional(),
  reason: z.string().optional(),
  batchNo: z.string().optional(),
  notes: z.string().optional(),
});
type StockFormValues = z.infer<typeof stockSchema>;

function StockForm({ mode, currency }: { mode: 'in' | 'out' | 'adjust'; currency: string }) {
  const { activeBusiness } = useActiveBusiness();
  const queryClient = useQueryClient();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<StockFormValues>({ resolver: zodResolver(stockSchema) });

  const productId = watch('productId');
  const { data: products } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: () => productService.list({ limit: 100 }),
    enabled: !!activeBusiness,
  });

  const selected = products?.items.find((p) => p.id === productId);

  const mutation = useMutation({
    mutationFn: async (v: StockFormValues) => {
      const payload: Record<string, unknown> = {
        productId: v.productId, quantity: v.quantity, reason: v.reason || null,
        batchNo: v.batchNo || null, notes: v.notes || null,
      };
      if (mode === 'in') { payload.unitCostMinor = majorToMinorString(v.unitCost ?? 0); return inventoryService.stockIn(payload); }
      if (mode === 'out') return inventoryService.stockOut(payload);
      return inventoryService.adjust(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(mode === 'in' ? 'Stock received' : mode === 'out' ? 'Stock removed' : 'Stock adjusted');
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Operation failed'),
  });

  const config = {
    in: { title: 'Stock In', desc: 'Receive new stock into inventory', icon: ArrowDownToLine, label: 'Receive' },
    out: { title: 'Stock Out', desc: 'Remove stock (damaged, expired, returned)', icon: ArrowUpFromLine, label: 'Remove' },
    adjust: { title: 'Stock Adjustment', desc: 'Correct discrepancies (positive or negative)', icon: SlidersHorizontal, label: 'Adjust' },
  }[mode];

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><config.icon className="h-5 w-5 text-accent" /> {config.title}</CardTitle>
        <CardDescription>{config.desc}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <Field label="Product" required error={errors.productId?.message}>
            <Select value={productId ?? ''} onValueChange={(v) => setValue('productId', v, { shouldValidate: true })}>
              <SelectTrigger>{selected ? selected.name : 'Select product'}</SelectTrigger>
              {products?.items.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>)}
            </Select>
          </Field>
          {selected && (
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3 text-sm">
              <span className="text-muted-foreground">Current stock: <span className="font-medium text-foreground">{selected.stockQuantity ?? 0}</span></span>
              <span className="text-muted-foreground">Cost: <span className="font-medium text-foreground">{formatMoney(selected.costPriceMinor, currency)}</span></span>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={mode === 'adjust' ? 'Quantity (+/-)' : 'Quantity'} required error={errors.quantity?.message}>
              <Input type="number" step="1" {...register('quantity')} placeholder="10" />
            </Field>
            {mode === 'in' && (
              <Field label="Unit cost" error={errors.unitCost?.message} helper={`in ${currency}`}>
                <Input type="number" step="0.01" {...register('unitCost')} placeholder="250" />
              </Field>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Batch no." error={errors.batchNo?.message}><Input {...register('batchNo')} placeholder="BATCH-001" /></Field>
            <Field label="Reason" error={errors.reason?.message}>
              {mode === 'out' ? (
                <Select onValueChange={(v) => setValue('reason', v)}>
                  <SelectTrigger>Select reason</SelectTrigger>
                  <SelectItem value="DAMAGED">Damaged</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                  <SelectItem value="SUPPLIER_RETURN">Supplier return</SelectItem>
                  <SelectItem value="STOCK_OUT">General</SelectItem>
                </Select>
              ) : <Input {...register('reason')} placeholder="Optional" />}
            </Field>
          </div>
          <Field label="Notes"><Textarea rows={2} {...register('notes')} /></Field>
          <Button type="submit" variant="accent" disabled={mutation.isPending}>{mutation.isPending ? 'Processing...' : config.label} stock</Button>
        </form>
      </CardContent>
    </Card>
  );
}

