import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Receipt, MoreHorizontal, RotateCcw, Eye, Download, Filter } from 'lucide-react';
import { saleService } from '@/lib/services';
import { useActiveBusiness } from '@/hooks/use-active-business';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { DateRangeFilter, type DateRange } from '@/components/shared/DateRangeFilter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectItem } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/toast';
import { ApiError } from '@/lib/api';
import { formatMoney, formatDateTime, formatDate, toMajor } from '@/lib/format';
import { toCsv, downloadFile } from '@/lib/utils';
import type { Sale, SaleStatus, PaymentMethod } from '@/lib/types';

const statusVariant: Record<SaleStatus, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  COMPLETED: 'success', PARTIALLY_PAID: 'warning', PENDING_PAYMENT: 'warning', REFUNDED: 'destructive', CANCELLED: 'destructive', DRAFT: 'secondary',
};

export default function SalesPage() {
  const { activeBusiness } = useActiveBusiness();
  const navigate = useNavigate();
  const currency = activeBusiness?.currency ?? 'NGN';
  const [searchParams] = useSearchParams();
  const [range, setRange] = React.useState<DateRange>({ from: new Date(Date.now() - 30 * 86400000).toISOString(), to: new Date().toISOString() });
  const [method, setMethod] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [detail, setDetail] = React.useState<Sale | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['sales', { from: range.from, to: range.to, method, page }],
    queryFn: () => saleService.list({ from: range.from, to: range.to, method: method || undefined, page, limit: 12 }),
    enabled: !!activeBusiness,
  });

  const sales = data?.items ?? [];

  const columns: Column<Sale>[] = [
    {
      key: 'receipt', header: 'Receipt',
      cell: (s) => (
        <button onClick={() => setDetail(s)} className="text-left">
          <p className="font-medium hover:text-accent">{s.receiptNo}</p>
          <p className="text-xs text-muted-foreground">{formatDateTime(s.saleDate)}</p>
        </button>
      ),
    },
    { key: 'customer', header: 'Customer', cell: (s) => <span className="text-sm">{s.customerName ?? 'Walk-in'}</span> },
    { key: 'cashier', header: 'Cashier', cell: (s) => <span className="text-sm text-muted-foreground">{s.cashierName ?? '-'}</span> },
    {
      key: 'method', header: 'Method',
      cell: (s) => s.payments?.[0] ? <Badge variant="secondary">{s.payments[0].method.replace('_', ' ').toLowerCase()}</Badge> : <span className="text-muted-foreground">-</span>,
    },
    { key: 'total', header: 'Total', align: 'right', cell: (s) => <span className="font-medium">{formatMoney(s.totalMinor, currency)}</span> },
    { key: 'paid', header: 'Paid', align: 'right', cell: (s) => <span className="text-success">{formatMoney(s.amountPaidMinor, currency)}</span> },
    { key: 'status', header: 'Status', cell: (s) => <Badge variant={statusVariant[s.status]}>{s.status.replace('_', ' ').toLowerCase()}</Badge> },
    {
      key: 'actions', header: '', align: 'right',
      cell: (s) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><button className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"><MoreHorizontal className="h-4 w-4" /></button></DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setDetail(s)}><Eye className="h-4 w-4" /> View details</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/sales/${s.id}`)}><Receipt className="h-4 w-4" /> Full receipt</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => setDetail(s)}><RotateCcw className="h-4 w-4" /> Refund</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const exportCsv = () => {
    const rows = sales.map((s) => ({ receiptNo: s.receiptNo, date: formatDate(s.saleDate), customer: s.customerName ?? 'Walk-in', total: toMajor(s.totalMinor), paid: toMajor(s.amountPaidMinor), status: s.status }));
    downloadFile(`sales_${Date.now()}.csv`, toCsv(rows));
    toast.success('Sales exported to CSV');
  };

  void searchParams;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales"
        description="View all transactions, process refunds and export records."
        icon={<Receipt className="h-5 w-5" />}
        actions={
          <>
            <Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4" /> Export</Button>
            <Button variant="accent" onClick={() => navigate('/pos')}>New sale</Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <DateRangeFilter value={range} onChange={(r) => { setRange(r); setPage(1); }} />
        <Select value={method} onValueChange={(v) => { setMethod(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]"><Filter className="mr-1.5 h-4 w-4 text-muted-foreground" />{method ? method.replace('_', ' ').toLowerCase() : 'All methods'}</SelectTrigger>
          <SelectItem value="">All methods</SelectItem>
          {(['CASH', 'BANK_TRANSFER', 'CARD_POS', 'CUSTOMER_CREDIT'] as PaymentMethod[]).map((m) => <SelectItem key={m} value={m}>{m.replace('_', ' ').toLowerCase()}</SelectItem>)}
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={sales}
        loading={isLoading}
        rowKey={(s) => s.id}
        emptyTitle="No sales yet"
        emptyDescription="Process your first sale from the POS to see it here."
        emptyIcon={<Receipt className="h-6 w-6" />}
        page={page}
        totalPages={data?.totalPages}
        total={data?.total}
        onPageChange={setPage}
      />

      <SaleDetailSheet sale={detail} onClose={() => setDetail(null)} currency={currency} />
    </div>
  );
}

function SaleDetailSheet({ sale, onClose, currency }: { sale: Sale | null; onClose: () => void; currency: string }) {
  const queryClient = useQueryClient();
  const [refundOpen, setRefundOpen] = React.useState(false);
  React.useEffect(() => { if (!sale) setRefundOpen(false); }, [sale]);

  const refundMutation = useMutation({
    mutationFn: (body: { amountMinor: string; reason: string; restockItems: boolean }) => saleService.refund(sale!.id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast.success('Refund processed');
      setRefundOpen(false);
      onClose();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Refund failed'),
  });

  return (
    <Sheet open={!!sale} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-md">
        {sale && (
          <>
            <SheetHeader>
              <SheetTitle>Sale {sale.receiptNo}</SheetTitle>
              <SheetDescription>{formatDateTime(sale.saleDate)}</SheetDescription>
            </SheetHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">Customer</p><p className="font-medium">{sale.customerName ?? 'Walk-in'}</p></div>
                <div><p className="text-xs text-muted-foreground">Cashier</p><p className="font-medium">{sale.cashierName ?? '-'}</p></div>
                <div><p className="text-xs text-muted-foreground">Status</p><Badge variant={statusVariant[sale.status]}>{sale.status.replace('_', ' ').toLowerCase()}</Badge></div>
                <div><p className="text-xs text-muted-foreground">Method</p><p className="font-medium">{sale.payments?.[0]?.method.replace('_', ' ').toLowerCase() ?? '-'}</p></div>
              </div>

              <div className="rounded-lg border border-border">
                <div className="border-b border-border bg-muted/30 px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">Items</div>
                <div className="divide-y divide-border">
                  {sale.items?.map((item) => (
                    <div key={item.id} className="flex items-center justify-between px-3 py-2 text-sm">
                      <div><p className="font-medium">{item.productName}</p><p className="text-xs text-muted-foreground">{item.quantity} × {formatMoney(item.unitPriceMinor, currency)}</p></div>
                      <span className="font-medium">{formatMoney(item.totalMinor, currency)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span className="text-foreground">{formatMoney(sale.subtotalMinor, currency)}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Discount</span><span className="text-foreground">- {formatMoney(sale.discountMinor, currency)}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Tax</span><span className="text-foreground">{formatMoney(sale.taxMinor, currency)}</span></div>
                <div className="flex justify-between border-t border-border pt-1.5 font-heading text-lg font-bold"><span>Total</span><span className="text-accent">{formatMoney(sale.totalMinor, currency)}</span></div>
                <div className="flex justify-between text-success"><span>Paid</span><span>{formatMoney(sale.amountPaidMinor, currency)}</span></div>
                {Number(sale.outstandingMinor) > 0 && <div className="flex justify-between text-destructive"><span>Outstanding</span><span>{formatMoney(sale.outstandingMinor, currency)}</span></div>}
              </div>

              {sale.status === 'COMPLETED' && (
                <Button variant="outline" className="w-full text-destructive" onClick={() => setRefundOpen(true)}><RotateCcw className="h-4 w-4" /> Process refund</Button>
              )}
            </div>

            {refundOpen && (
              <div className="mt-4 space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                <p className="text-sm font-medium">Refund details</p>
                <RefundForm maxAmount={toMajor(sale.totalMinor)} currency={currency} onSubmit={(v) => refundMutation.mutate(v)} loading={refundMutation.isPending} />
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function RefundForm({ maxAmount, currency, onSubmit, loading }: { maxAmount: number; currency: string; onSubmit: (v: { amountMinor: string; reason: string; restockItems: boolean }) => void; loading: boolean }) {
  const [amount, setAmount] = React.useState(maxAmount);
  const [reason, setReason] = React.useState('');
  const [restock, setRestock] = React.useState(true);
  return (
    <>
      <label className="text-xs font-medium">Amount ({currency})</label>
      <input type="number" step="0.01" max={maxAmount} value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm" />
      <label className="text-xs font-medium">Reason</label>
      <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Customer return" className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm" />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={restock} onChange={(e) => setRestock(e.target.checked)} /> Restock items</label>
      <Button variant="destructive" size="sm" className="w-full" disabled={loading || !reason || amount <= 0} onClick={() => onSubmit({ amountMinor: String(Math.round(amount * 100)), reason, restockItems: restock })}>
        {loading ? 'Processing...' : 'Confirm refund'}
      </Button>
    </>
  );
}

