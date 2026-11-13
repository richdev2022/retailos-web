import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Truck, Plus, PackageCheck, Download, X } from 'lucide-react';
import { purchaseService, supplierService, productService } from '@/lib/services';
import { useActiveBusiness } from '@/hooks/use-active-business';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { ApiError } from '@/lib/api';
import { formatMoney, formatDate, majorToMinorString, toMajor } from '@/lib/format';
import { toCsv, downloadFile, uid } from '@/lib/utils';
import type { Purchase, PurchaseStatus } from '@/lib/types';

const statusVariant: Record<PurchaseStatus, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  DRAFT: 'secondary', ORDERED: 'warning', PARTIALLY_RECEIVED: 'warning', RECEIVED: 'success', CANCELLED: 'destructive',
};

export default function PurchasesPage() {
  const { activeBusiness } = useActiveBusiness();
  const currency = activeBusiness?.currency ?? 'NGN';
  const [page, setPage] = React.useState(1);
  const [statusFilter, setStatusFilter] = React.useState('');
  const [createOpen, setCreateOpen] = React.useState(false);
  const [receiveTarget, setReceiveTarget] = React.useState<Purchase | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['purchases', { status: statusFilter, page }],
    queryFn: () => purchaseService.list({ status: statusFilter || undefined, page, limit: 12 }),
    enabled: !!activeBusiness,
  });

  const columns: Column<Purchase>[] = [
    { key: 'ref', header: 'Reference', cell: (p) => <div><p className="font-medium">{p.reference}</p><p className="text-xs text-muted-foreground">{formatDate(p.orderDate)}</p></div> },
    { key: 'supplier', header: 'Supplier', cell: (p) => <span className="text-sm">{p.supplierName}</span> },
    { key: 'total', header: 'Total', align: 'right', cell: (p) => <span className="font-medium">{formatMoney(p.totalMinor, currency)}</span> },
    { key: 'paid', header: 'Paid', align: 'right', cell: (p) => <span className="text-success">{formatMoney(p.paidMinor, currency)}</span> },
    { key: 'outstanding', header: 'Outstanding', align: 'right', cell: (p) => Number(p.outstandingMinor) > 0 ? <span className="text-destructive">{formatMoney(p.outstandingMinor, currency)}</span> : <span className="text-muted-foreground">-</span> },
    { key: 'status', header: 'Status', cell: (p) => <Badge variant={statusVariant[p.status]}>{p.status.replace('_', ' ').toLowerCase()}</Badge> },
    {
      key: 'actions', header: '', align: 'right',
      cell: (p) => (
        p.status === 'ORDERED' || p.status === 'PARTIALLY_RECEIVED'
          ? <Button variant="outline" size="sm" onClick={() => setReceiveTarget(p)}><PackageCheck className="h-4 w-4" /> Receive</Button>
          : <span className="text-xs text-muted-foreground">{p.receivedAt ? formatDate(p.receivedAt) : '-'}</span>
      ),
    },
  ];

  const exportCsv = () => {
    const rows = (data?.items ?? []).map((p) => ({ reference: p.reference, supplier: p.supplierName, date: formatDate(p.orderDate), total: toMajor(p.totalMinor), paid: toMajor(p.paidMinor), status: p.status }));
    downloadFile(`purchases_${Date.now()}.csv`, toCsv(rows));
    toast.success('Purchases exported');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchases"
        description="Manage purchase orders from suppliers and receive goods."
        icon={<Truck className="h-5 w-5" />}
        actions={
          <>
            <Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4" /> Export</Button>
            <Button variant="accent" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> New purchase</Button>
          </>
        }
      />

      <div className="flex items-center gap-2">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">{statusFilter ? statusFilter.replace('_', ' ').toLowerCase() : 'All statuses'}</SelectTrigger>
          <SelectItem value="">All statuses</SelectItem>
          {(['DRAFT', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'] as PurchaseStatus[]).map((s) => <SelectItem key={s} value={s}>{s.replace('_', ' ').toLowerCase()}</SelectItem>)}
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        loading={isLoading}
        rowKey={(p) => p.id}
        emptyTitle="No purchases yet"
        emptyDescription="Create a purchase order to restock from suppliers."
        emptyIcon={<Truck className="h-6 w-6" />}
        page={page}
        totalPages={data?.totalPages}
        total={data?.total}
        onPageChange={setPage}
      />

      <CreatePurchaseDialog open={createOpen} onOpenChange={setCreateOpen} currency={currency} />
      <ReceiveDialog purchase={receiveTarget} onClose={() => setReceiveTarget(null)} currency={currency} />
    </div>
  );
}

function CreatePurchaseDialog({ open, onOpenChange, currency }: { open: boolean; onOpenChange: (v: boolean) => void; currency: string }) {
  const queryClient = useQueryClient();
  const { activeBusiness } = useActiveBusiness();
  const [supplierId, setSupplierId] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [lines, setLines] = React.useState<Array<{ id: string; productId: string; quantity: number; unitCost: number }>>([]);

  const { data: suppliers } = useQuery({ queryKey: ['suppliers', 'pos'], queryFn: () => supplierService.list({ limit: 100 }), enabled: !!activeBusiness });
  const { data: products } = useQuery({ queryKey: ['products', 'all'], queryFn: () => productService.list({ limit: 100 }), enabled: !!activeBusiness && open });

  const total = lines.reduce((s, l) => s + l.quantity * l.unitCost, 0);
  const addLine = () => setLines((p) => [...p, { id: uid('ln_'), productId: '', quantity: 1, unitCost: 0 }]);
  const updateLine = (id: string, patch: Partial<{ productId: string; quantity: number; unitCost: number }>) => setLines((p) => p.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const removeLine = (id: string) => setLines((p) => p.filter((l) => l.id !== id));

  React.useEffect(() => { if (open) { setSupplierId(''); setNotes(''); setLines([]); } }, [open]);

  const mutation = useMutation({
    mutationFn: () =>
      purchaseService.create({
        supplierId,
        notes: notes || null,
        totalMinor: majorToMinorString(total),
        items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity, unitCostMinor: majorToMinorString(l.unitCost), totalMinor: majorToMinorString(l.quantity * l.unitCost) })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      toast.success('Purchase order created');
      onOpenChange(false);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed to create purchase'),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>New purchase order</DialogTitle><DialogDescription>Select supplier and add line items</DialogDescription></DialogHeader>
        <div className="space-y-4">
          <Field label="Supplier" required>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger>{suppliers?.items.find((s) => s.id === supplierId)?.name ?? 'Select supplier'}</SelectTrigger>
              {suppliers?.items.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </Select>
          </Field>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Line items</p>
              <Button variant="outline" size="sm" onClick={addLine}><Plus className="h-4 w-4" /> Add item</Button>
            </div>
            {lines.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border py-6 text-center text-sm text-muted-foreground">No items added</p>
            ) : (
              <div className="space-y-2">
                {lines.map((line) => (
                  <div key={line.id} className="grid grid-cols-[1fr,80px,100px,auto] items-center gap-2">
                    <Select value={line.productId} onValueChange={(v) => updateLine(line.id, { productId: v })}>
                      <SelectTrigger className="h-9">{products?.items.find((p) => p.id === line.productId)?.name ?? 'Select product'}</SelectTrigger>
                      {products?.items.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </Select>
                    <Input type="number" placeholder="Qty" value={line.quantity} onChange={(e) => updateLine(line.id, { quantity: Number(e.target.value) })} className="h-9" />
                    <Input type="number" step="0.01" placeholder="Cost" value={line.unitCost} onChange={(e) => updateLine(line.id, { unitCost: Number(e.target.value) })} className="h-9" />
                    <Button variant="ghost" size="icon-sm" onClick={() => removeLine(line.id)} className="text-destructive"><X className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Field label="Notes"><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>

          <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
            <span className="text-sm font-medium">Total</span>
            <span className="font-heading text-xl font-bold text-accent">{formatMoney(majorToMinorString(total), currency)}</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="accent" disabled={!supplierId || lines.length === 0 || mutation.isPending} onClick={() => mutation.mutate()}>{mutation.isPending ? 'Creating...' : 'Create order'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReceiveDialog({ purchase, onClose, currency }: { purchase: Purchase | null; onClose: () => void; currency: string }) {
  const queryClient = useQueryClient();
  const [received, setReceived] = React.useState<Record<string, number>>({});
  const [mutating, setMutating] = React.useState(false);

  React.useEffect(() => { if (purchase) setReceived({}); }, [purchase]);

  const onReceive = async () => {
    if (!purchase) return;
    setMutating(true);
    try {
      await purchaseService.receive(purchase.id, { items: (purchase.items ?? []).map((i) => ({ productId: i.productId, receivedQuantity: received[i.id] ?? i.quantity })) });
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Goods received and stock updated');
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to receive goods');
    } finally {
      setMutating(false);
    }
  };

  return (
    <Dialog open={!!purchase} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Receive goods</DialogTitle><DialogDescription>{purchase?.reference} · {purchase?.supplierName}</DialogDescription></DialogHeader>
        {purchase?.items?.length ? (
          <div className="space-y-2">
            {purchase.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div><p className="text-sm font-medium">{item.productName ?? item.productId}</p><p className="text-xs text-muted-foreground">Ordered: {item.quantity} · {formatMoney(item.unitCostMinor, currency)}</p></div>
                <Input type="number" min={0} max={item.quantity} defaultValue={item.quantity} onChange={(e) => setReceived((p) => ({ ...p, [item.id]: Number(e.target.value) }))} className="h-9 w-24" />
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">No items on this order.</p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="accent" onClick={onReceive} disabled={mutating}>{mutating ? 'Receiving...' : 'Confirm receipt'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

