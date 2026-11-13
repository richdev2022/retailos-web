import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart, Search, Plus, Minus, Trash2, X, User, Barcode, CreditCard,
  Printer, CheckCircle2, Banknote, ArrowLeftRight,
} from 'lucide-react';
import { saleService, productService, customerService } from '@/lib/services';
import { useActiveBusiness } from '@/hooks/use-active-business';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Field } from '@/components/ui/field';
import { toast } from '@/components/ui/toast';
import { ApiError } from '@/lib/api';
import { cn, uid } from '@/lib/utils';
import { formatMoney, majorToMinorString, toMajor, currencySymbolFor, formatDateTime } from '@/lib/format';
import { offlineDb } from '@/lib/offline-db';
import type { Product, Customer, PaymentMethod, Sale } from '@/lib/types';

interface CartItem { product: Product; quantity: number; discount: number }

export default function POSPage() {
  const { activeBusiness } = useActiveBusiness();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currency = activeBusiness?.currency ?? 'NGN';
  const [search, setSearch] = React.useState('');
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [customerId, setCustomerId] = React.useState('');
  const [customerOpen, setCustomerOpen] = React.useState(false);
  const [checkoutOpen, setCheckoutOpen] = React.useState(false);
  const [receipt, setReceipt] = React.useState<Sale | null>(null);
  const [barcode, setBarcode] = React.useState('');

  const { data: products } = useQuery({
    queryKey: ['products', 'pos', search],
    queryFn: () => productService.list({ search, limit: 24 }),
    enabled: !!activeBusiness,
  });

  const { data: customers } = useQuery({
    queryKey: ['customers', 'pos'],
    queryFn: () => customerService.list({ limit: 100 }),
    enabled: !!activeBusiness,
  });

  const selectedCustomer = customers?.items.find((c) => c.id === customerId) ?? null;

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) return prev.map((i) => (i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
      return [...prev, { product, quantity: 1, discount: 0 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) => prev.map((i) => (i.product.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i)));
  };
  const removeItem = (id: string) => setCart((prev) => prev.filter((i) => i.product.id !== id));
  const clearCart = () => { setCart([]); setCustomerId(''); };

  const onBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = products?.items.find((p) => p.barcode === barcode || p.sku === barcode);
    if (found) { addToCart(found); setBarcode(''); toast.success(`${found.name} added`); }
    else { toast.error('Product not found'); }
  };

  const subtotal = cart.reduce((s, i) => s + toMajor(i.product.sellingPriceMinor) * i.quantity, 0);
  const totalDiscount = cart.reduce((s, i) => s + i.discount, 0);
  const taxRate = (activeBusiness?.taxRateBps ?? 0) / 10000;
  const taxable = subtotal - totalDiscount;
  const tax = taxable * taxRate;
  const total = taxable + tax;

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4 lg:flex-row">
      {/* Product grid */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="mb-3 flex gap-2">
          <form onSubmit={onBarcodeSubmit} className="flex flex-1 gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="pl-9" />
            </div>
            <Input value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="Scan barcode" className="w-44" />
            <Button type="submit" variant="accent" size="icon"><Barcode className="h-4 w-4" /></Button>
          </form>
        </div>
        <div className="grid flex-1 grid-cols-2 gap-3 overflow-y-auto scrollbar-thin pb-2 sm:grid-cols-3 xl:grid-cols-4">
          {!products ? (
            Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-32" />)
          ) : products.items.length === 0 ? (
            <div className="col-span-full flex h-32 items-center justify-center text-sm text-muted-foreground">No products found</div>
          ) : (
            products.items.map((p) => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                disabled={(p.stockQuantity ?? 0) <= 0}
                className="group flex flex-col rounded-xl border border-border bg-card p-3 text-left transition-all hover:border-accent hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="mb-2 flex aspect-square items-center justify-center rounded-lg bg-accent/5 text-accent">
                  <span className="text-2xl font-bold">{p.name.charAt(0)}</span>
                </div>
                <p className="truncate text-sm font-medium">{p.name}</p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="font-semibold text-accent">{formatMoney(p.sellingPriceMinor, currency)}</span>
                  <Badge variant={(p.stockQuantity ?? 0) <= 0 ? 'destructive' : 'secondary'} className="text-[10px]">{p.stockQuantity ?? 0}</Badge>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Cart */}
      <Card className="flex w-full flex-col lg:w-96">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-accent" />
            <h3 className="font-heading font-semibold">Current Sale</h3>
            {cart.length > 0 && <Badge variant="accent">{cart.length}</Badge>}
          </div>
          {cart.length > 0 && <Button variant="ghost" size="icon-sm" onClick={clearCart}><Trash2 className="h-4 w-4" /></Button>}
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-3">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
              <ShoppingCart className="h-10 w-10 opacity-30" />
              <p className="text-sm">Cart is empty</p>
              <p className="text-xs">Tap products to add them</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map((item) => (
                <div key={item.product.id} className="flex items-center gap-2 rounded-lg border border-border p-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">{formatMoney(item.product.sellingPriceMinor, currency)} each</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon-sm" onClick={() => updateQty(item.product.id, -1)}><Minus className="h-3 w-3" /></Button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <Button variant="outline" size="icon-sm" onClick={() => updateQty(item.product.id, 1)}><Plus className="h-3 w-3" /></Button>
                  </div>
                  <span className="w-20 text-right text-sm font-semibold">{formatMoney(majorToMinorString(toMajor(item.product.sellingPriceMinor) * item.quantity), currency)}</span>
                  <Button variant="ghost" size="icon-sm" onClick={() => removeItem(item.product.id)} className="text-destructive"><X className="h-3.5 w-3.5" /></Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Customer + totals + checkout */}
        <div className="border-t border-border p-4 space-y-3">
          <button onClick={() => setCustomerOpen(true)} className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:border-accent hover:text-accent">
            <User className="h-4 w-4" />
            {selectedCustomer ? <span className="text-foreground">{selectedCustomer.name}</span> : 'Select customer (optional)'}
          </button>
          <div className="space-y-1 text-sm">
            <Row label="Subtotal" value={formatMoney(majorToMinorString(subtotal), currency)} />
            <Row label="Discount" value={`- ${formatMoney(majorToMinorString(totalDiscount), currency)}`} />
            <Row label={`Tax (${(taxRate * 100).toFixed(1)}%)`} value={formatMoney(majorToMinorString(tax), currency)} />
            <Separator className="my-1.5" />
            <div className="flex items-center justify-between">
              <span className="font-semibold">Total</span>
              <span className="font-heading text-xl font-bold text-accent">{formatMoney(majorToMinorString(total), currency)}</span>
            </div>
          </div>
          <Button variant="accent" size="lg" className="w-full" disabled={cart.length === 0} onClick={() => setCheckoutOpen(true)}>
            <CreditCard className="h-4 w-4" /> Checkout
          </Button>
        </div>
      </Card>

      <CustomerPickerSheet open={customerOpen} onOpenChange={setCustomerOpen} customers={customers?.items ?? []} selected={customerId} onSelect={(id) => { setCustomerId(id); setCustomerOpen(false); }} />

      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        total={total}
        currency={currency}
        onConfirm={async (method, amountPaid) => {
          const syncId = uid('sale_');
          const payload = {
            syncId,
            customerId: customerId || null,
            subtotalMinor: majorToMinorString(subtotal),
            discountMinor: majorToMinorString(totalDiscount),
            taxMinor: majorToMinorString(tax),
            totalMinor: majorToMinorString(total),
            amountPaidMinor: majorToMinorString(amountPaid),
            items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity, unitPriceMinor: i.product.sellingPriceMinor, discountMinor: majorToMinorString(i.discount) })),
            payments: [{ method, amountMinor: majorToMinorString(amountPaid) }],
          };
          try {
            const sale = await saleService.create(payload);
            queryClient.invalidateQueries({ queryKey: ['sales'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            setReceipt(sale);
            setCheckoutOpen(false);
            clearCart();
          } catch (err) {
            if (navigator.onLine === false) {
              await offlineDb.enqueueSale({ syncId, payload, createdAt: new Date().toISOString() });
              toast.success('Sale saved offline — will sync when online');
              clearCart();
              setCheckoutOpen(false);
            } else {
              toast.error(err instanceof ApiError ? err.message : 'Checkout failed');
            }
          }
        }}
      />

      <ReceiptDialog sale={receipt} onClose={() => setReceipt(null)} currency={currency} businessName={activeBusiness?.name ?? 'RetailOS'} onNewSale={() => { setReceipt(null); navigate('/sales'); }} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

function CustomerPickerSheet({ open, onOpenChange, customers, selected, onSelect }: { open: boolean; onOpenChange: (v: boolean) => void; customers: Customer[]; selected: string; onSelect: (id: string) => void }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader><SheetTitle>Select customer</SheetTitle></SheetHeader>
        <div className="space-y-1">
          <button onClick={() => onSelect('')} className="flex w-full items-center justify-between rounded-lg p-2 hover:bg-muted">
            <span className="text-sm">Walk-in customer</span>
            {selected === '' && <CheckCircle2 className="h-4 w-4 text-accent" />}
          </button>
          {customers.map((c) => (
            <button key={c.id} onClick={() => onSelect(c.id)} className="flex w-full items-center justify-between rounded-lg p-2 hover:bg-muted">
              <div className="text-left"><p className="text-sm font-medium">{c.name}</p><p className="text-xs text-muted-foreground">{c.phone ?? c.email ?? ''}</p></div>
              {selected === c.id && <CheckCircle2 className="h-4 w-4 text-accent" />}
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function CheckoutDialog({ open, onOpenChange, total, currency, onConfirm }: { open: boolean; onOpenChange: (v: boolean) => void; total: number; currency: string; onConfirm: (method: PaymentMethod, amountPaid: number) => Promise<void> }) {
  const [method, setMethod] = React.useState<PaymentMethod>('CASH');
  const [amountPaid, setAmountPaid] = React.useState(total);
  const [processing, setProcessing] = React.useState(false);
  React.useEffect(() => { if (open) { setAmountPaid(total); } }, [open, total]);

  const change = Math.max(0, amountPaid - total);
  const methods: Array<{ value: PaymentMethod; label: string; icon: typeof Banknote }> = [
    { value: 'CASH', label: 'Cash', icon: Banknote },
    { value: 'BANK_TRANSFER', label: 'Transfer', icon: ArrowLeftRight },
    { value: 'CARD_POS', label: 'Card / POS', icon: CreditCard },
  ];

  const confirm = async () => {
    setProcessing(true);
    try { await onConfirm(method, amountPaid); } finally { setProcessing(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Checkout</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg bg-accent/5 p-4 text-center">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Total due</p>
            <p className="font-heading text-3xl font-bold text-accent">{formatMoney(majorToMinorString(total), currency)}</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {methods.map((m) => (
              <button key={m.value} onClick={() => setMethod(m.value)} className={cn('flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs transition-colors', method === m.value ? 'border-accent bg-accent/5 text-accent' : 'border-border hover:border-accent/50')}>
                <m.icon className="h-5 w-5" /> {m.label}
              </button>
            ))}
          </div>
          <Field label={`Amount received (${currencySymbolFor(currency)})`}>
            <Input type="number" step="0.01" value={amountPaid} onChange={(e) => setAmountPaid(Number(e.target.value))} />
          </Field>
          {change > 0 && (
            <div className="flex items-center justify-between rounded-lg bg-success/5 p-3">
              <span className="text-sm text-success">Change to give</span>
              <span className="font-semibold text-success">{formatMoney(majorToMinorString(change), currency)}</span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="accent" onClick={confirm} disabled={processing || amountPaid < total}>{processing ? 'Processing...' : 'Complete sale'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReceiptDialog({ sale, onClose, currency, businessName, onNewSale }: { sale: Sale | null; onClose: () => void; currency: string; businessName: string; onNewSale: () => void }) {
  return (
    <Dialog open={!!sale} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm print-area">
        {sale && (
          <div className="space-y-4 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success"><CheckCircle2 className="h-6 w-6" /></div>
              <h2 className="font-heading text-xl font-bold">Sale completed</h2>
              <p className="text-xs text-muted-foreground">{formatDateTime(sale.saleDate)}</p>
            </div>
            <div className="rounded-lg border border-dashed border-border p-4 text-left text-sm">
              <p className="text-center font-heading font-bold">{businessName}</p>
              <p className="text-center text-xs text-muted-foreground">Receipt #{sale.receiptNo}</p>
              <Separator className="my-2" />
              {sale.items?.map((item) => (
                <div key={item.id} className="flex justify-between py-0.5">
                  <span className="text-muted-foreground">{item.quantity}× {item.productName}</span>
                  <span>{formatMoney(item.totalMinor, currency)}</span>
                </div>
              ))}
              <Separator className="my-2" />
              <div className="flex justify-between font-semibold"><span>Total</span><span>{formatMoney(sale.totalMinor, currency)}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Paid</span><span>{formatMoney(sale.amountPaidMinor, currency)}</span></div>
              {Number(sale.outstandingMinor) > 0 && <div className="flex justify-between text-destructive"><span>Outstanding</span><span>{formatMoney(sale.outstandingMinor, currency)}</span></div>}
            </div>
            <div className="flex gap-2 no-print">
              <Button variant="outline" className="flex-1" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print</Button>
              <Button variant="accent" className="flex-1" onClick={onNewSale}>New sale</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

