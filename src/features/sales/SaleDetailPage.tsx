import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Printer, Receipt as ReceiptIcon, User, CreditCard } from 'lucide-react';
import { saleService } from '@/lib/services';
import { useActiveBusiness } from '@/hooks/use-active-business';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { formatMoney, formatDateTime } from '@/lib/format';
import type { SaleStatus } from '@/lib/types';

const statusVariant: Record<SaleStatus, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  COMPLETED: 'success', PARTIALLY_PAID: 'warning', PENDING_PAYMENT: 'warning', REFUNDED: 'destructive', CANCELLED: 'destructive', DRAFT: 'secondary',
};

export default function SaleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeBusiness } = useActiveBusiness();
  const currency = activeBusiness?.currency ?? 'NGN';
  const { data: sale, isLoading } = useQuery({
    queryKey: ['sale', id],
    queryFn: () => saleService.get(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!sale) return <p className="text-muted-foreground">Sale not found.</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Button variant="ghost" onClick={() => navigate('/sales')}><ArrowLeft className="h-4 w-4" /> Back to sales</Button>

      <Card className="print-area">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent"><ReceiptIcon className="h-6 w-6" /></div>
            <h1 className="font-heading text-xl font-bold">{activeBusiness?.name ?? 'RetailOS'}</h1>
            <p className="text-xs text-muted-foreground">{activeBusiness?.address ?? ''}</p>
            <p className="mt-1 text-xs text-muted-foreground">Receipt #{sale.receiptNo}</p>
          </div>

          <div className="my-4 grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Customer</p><p className="font-medium">{sale.customerName ?? 'Walk-in'}</p></div></div>
            <div className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Date</p><p className="font-medium">{formatDateTime(sale.saleDate)}</p></div></div>
            <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Cashier</p><p className="font-medium">{sale.cashierName ?? '-'}</p></div></div>
            <div><p className="text-xs text-muted-foreground">Status</p><Badge variant={statusVariant[sale.status]}>{sale.status.replace('_', ' ').toLowerCase()}</Badge></div>
          </div>

          <Separator />

          <div className="my-4">
            <div className="grid grid-cols-[1fr,auto,auto] gap-2 border-b border-border pb-2 text-xs font-semibold uppercase text-muted-foreground">
              <span>Item</span><span className="text-right">Qty</span><span className="text-right">Total</span>
            </div>
            {sale.items?.map((item) => (
              <div key={item.id} className="grid grid-cols-[1fr,auto,auto] gap-2 py-2 text-sm">
                <div><p className="font-medium">{item.productName}</p><p className="text-xs text-muted-foreground">{formatMoney(item.unitPriceMinor, currency)} each</p></div>
                <span className="text-right">{item.quantity}</span>
                <span className="text-right font-medium">{formatMoney(item.totalMinor, currency)}</span>
              </div>
            ))}
          </div>

          <Separator />

          <div className="mt-4 space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span className="text-foreground">{formatMoney(sale.subtotalMinor, currency)}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>Discount</span><span className="text-foreground">- {formatMoney(sale.discountMinor, currency)}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>Tax</span><span className="text-foreground">{formatMoney(sale.taxMinor, currency)}</span></div>
            <div className="flex justify-between border-t border-border pt-2 font-heading text-lg font-bold"><span>Total</span><span className="text-accent">{formatMoney(sale.totalMinor, currency)}</span></div>
            <div className="flex justify-between text-success"><span>Amount paid</span><span>{formatMoney(sale.amountPaidMinor, currency)}</span></div>
            {Number(sale.outstandingMinor) > 0 && <div className="flex justify-between text-destructive"><span>Outstanding</span><span>{formatMoney(sale.outstandingMinor, currency)}</span></div>}
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">Thank you for your purchase!</p>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2 no-print">
        <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print receipt</Button>
      </div>
    </div>
  );
}
