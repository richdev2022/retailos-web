import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreditCard, Plus, Star, Trash2, Loader2, ShieldCheck, CheckCircle2, AlertCircle, Lock } from 'lucide-react';
import { paymentService, subscriptionService, type SavedCard } from '@/lib/services';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { toast } from '@/components/ui/toast';
import { ApiError } from '@/lib/api';
import { formatDate, formatMoney, formatRelative } from '@/lib/format';
import type { SubscriptionChargeRecord, SubscriptionEventRecord } from '@/lib/services';

const addCardSchema = z.object({
  cardNumber: z.string().min(12, 'Card number is required').max(19),
  cvv: z.string().min(3, 'CVV is required').max(4),
  expiryMonth: z.string().regex(/^\d{2}$/, 'MM'),
  expiryYear: z.string().regex(/^\d{2}$/, 'YY'),
  pin: z.string().regex(/^\d{4}$/).optional(),
});
type AddCardValues = z.infer<typeof addCardSchema>;

export default function SubscriptionPage() {
  const [addOpen, setAddOpen] = React.useState(false);
  const [tab, setTab] = React.useState('cards');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription"
        description="Manage your plan, payment methods and billing history."
        icon={<CreditCard className="h-5 w-5" />}
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="cards">Payment methods</TabsTrigger>
          <TabsTrigger value="charges">Billing history</TabsTrigger>
          <TabsTrigger value="events">Activity log</TabsTrigger>
        </TabsList>

        <TabsContent value="cards" className="space-y-4">
          <CardsTab onAdd={() => setAddOpen(true)} />
        </TabsContent>
        <TabsContent value="charges" className="space-y-4">
          <ChargesTab />
        </TabsContent>
        <TabsContent value="events" className="space-y-4">
          <EventsTab />
        </TabsContent>
      </Tabs>

      <AddCardDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}

// =====================================================
// Cards tab
// =====================================================

function CardsTab({ onAdd }: { onAdd: () => void }) {
  const { data: cards, isLoading } = useQuery({ queryKey: ['cards'], queryFn: paymentService.listCards });
  const { data: sub } = useQuery({ queryKey: ['subscription', 'current'], queryFn: subscriptionService.current });

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Saved cards</CardTitle>
            <CardDescription>Cards used for subscription renewals.</CardDescription>
          </div>
          <Button variant="accent" onClick={onAdd}><Plus className="h-4 w-4" /> Add card</Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">{[1, 2].map((i) => <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />)}</div>
          ) : (cards ?? []).length === 0 ? (
            <div className="rounded-lg border border-dashed py-12 text-center">
              <CreditCard className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="font-medium">No saved cards yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Add a card to enable automatic subscription renewals.</p>
              <Button variant="accent" className="mt-4" onClick={onAdd}><Plus className="h-4 w-4" /> Add your first card</Button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {cards!.map((card) => <CardItem key={card.id} card={card} />)}
            </div>
          )}
        </CardContent>
      </Card>

      {sub && (
        <Card className="bg-gradient-to-br from-accent/10 to-primary/5">
          <CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-heading text-lg font-semibold">{sub.plan.name} plan</p>
                <Badge variant={sub.status === 'ACTIVE' || sub.status === 'TRIAL' ? 'default' : 'destructive'}>{sub.status}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {sub.status === 'TRIAL' ? 'Trial active' : 'Active'} until {sub.endDate ? formatDate(sub.endDate) : 'N/A'}
              </p>
            </div>
            <RenewButton planId={sub.plan.id} />
          </CardContent>
        </Card>
      )}
    </>
  );
}

function CardItem({ card }: { card: SavedCard }) {
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const setDefaultMut = useMutation({
    mutationFn: () => paymentService.setDefaultCard(card.id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cards'] }); toast.success('Default card updated'); },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed'),
  });
  const deleteMut = useMutation({
    mutationFn: () => paymentService.removeCard(card.id, true),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cards'] }); toast.success('Card removed'); setConfirmDelete(false); },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed'),
  });

  return (
    <div className={`rounded-xl border p-5 ${card.isDefault ? 'border-accent shadow-sm' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-14 items-center justify-center rounded-md bg-gradient-to-br from-slate-700 to-slate-900 text-xs font-bold text-white">
            {card.brand.slice(0, 6).toUpperCase()}
          </div>
          <div>
            <p className="font-medium">•••• {card.last4}</p>
            <p className="text-xs text-muted-foreground">{card.issuer ?? card.brand}{card.expiry ? ` • exp ${card.expiry}` : ''}</p>
          </div>
        </div>
        {card.isDefault && <Badge variant="accent"><Star className="h-3 w-3" /> Default</Badge>}
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>Last used: {card.lastUsedAt ? formatRelative(card.lastUsedAt) : 'Never'}</span>
        <span>Added {formatDate(card.createdAt)}</span>
      </div>
      <div className="mt-4 flex gap-2">
        {!card.isDefault && (
          <Button variant="outline" size="sm" className="flex-1" disabled={setDefaultMut.isPending} onClick={() => setDefaultMut.mutate()}>
            {setDefaultMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Star className="h-3 w-3" />} Set default
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={() => setConfirmDelete(true)}>
          <Trash2 className="h-3 w-3" /> Remove
        </Button>
      </div>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove {card.brand} ending {card.last4}?</DialogTitle>
            <DialogDescription>
              This card will no longer be available for subscription renewals.
              {card.isDefault && ' A different card will be promoted to default if you have one.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button variant="destructive" disabled={deleteMut.isPending} onClick={() => deleteMut.mutate()}>
              {deleteMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />} Remove card
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RenewButton({ planId }: { planId: string }) {
  const queryClient = useQueryClient();
  const mut = useMutation({
    mutationFn: () => paymentService.chargeNow({ planId, interval: 'monthly' }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['subscription', 'current'] });
      queryClient.invalidateQueries({ queryKey: ['charges'] });
      if (res.status === 'SUCCESSFUL') {
        toast.success(`Payment successful — renewed until ${res.newEndDate ? formatDate(res.newEndDate) : 'N/A'}`);
      } else if (res.status === 'REQUIRES_OTP') {
        toast.info(res.message ?? 'OTP/3DS verification required');
      } else {
        toast.error('Payment failed');
      }
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Payment failed'),
  });
  return (
    <Button variant="accent" disabled={mut.isPending} onClick={() => mut.mutate()}>
      {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />} Renew now
    </Button>
  );
}

// =====================================================
// Add card dialog (with Flutterwave inline JS SDK reference)
// =====================================================

function AddCardDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddCardValues>({
    resolver: zodResolver(addCardSchema),
    defaultValues: { cardNumber: '', cvv: '', expiryMonth: '', expiryYear: '', pin: '' },
  });
  React.useEffect(() => { if (!open) reset(); }, [open, reset]);

  const mut = useMutation({
    mutationFn: (v: AddCardValues) => paymentService.addCard({
      cardNumber: v.cardNumber.replace(/\s/g, ''),
      cvv: v.cvv,
      expiryMonth: v.expiryMonth,
      expiryYear: v.expiryYear,
      pin: v.pin,
    }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      if ('status' in res && (res.status === 'pending_otp' || res.status === 'pending_3ds')) {
        toast.info(`Card requires ${res.status === 'pending_3ds' ? '3DS' : 'OTP'} verification. ${res.authUrl ? 'Open the auth URL to complete.' : 'Check your phone for the OTP.'}`);
      } else {
        toast.success('Card added successfully');
      }
      onOpenChange(false);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed to add card'),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a card</DialogTitle>
          <DialogDescription>We'll charge NGN 100 to verify the card, then immediately refund it. Your card details are processed securely by Flutterwave — never stored on our servers.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mut.mutate(v))} className="space-y-4">
          <Field label="Card number" required error={errors.cardNumber?.message}>
            <Input {...register('cardNumber')} placeholder="4242 4242 4242 4242" maxLength={19} />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Expiry MM" required error={errors.expiryMonth?.message}>
              <Input {...register('expiryMonth')} placeholder="12" maxLength={2} />
            </Field>
            <Field label="Expiry YY" required error={errors.expiryYear?.message}>
              <Input {...register('expiryYear')} placeholder="28" maxLength={2} />
            </Field>
            <Field label="CVV" required error={errors.cvv?.message}>
              <Input {...register('cvv')} placeholder="123" maxLength={4} />
            </Field>
          </div>
          <Field label="PIN (4 digits — Nigerian cards only)" error={errors.pin?.message} helper="Required for Nigerian bank cards.">
            <Input type="password" {...register('pin')} placeholder="••••" maxLength={4} />
          </Field>
          <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
            <Lock className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Card details are sent directly to Flutterwave over HTTPS. We only store the resulting card token, never the raw card number.</span>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" variant="accent" disabled={mut.isPending}>
              {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Verify & add card
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// =====================================================
// Charges history tab
// =====================================================

function ChargesTab() {
  const [page, setPage] = React.useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['charges', page],
    queryFn: () => paymentService.listCharges(page, 15),
  });
  const queryClient = useQueryClient();
  const retryMut = useMutation({
    mutationFn: (id: string) => paymentService.retryCharge(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charges'] });
      toast.success('Retry successful');
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Retry failed'),
  });

  const columns: Column<SubscriptionChargeRecord>[] = [
    { key: 'date', header: 'Date', cell: (c) => <span className="text-sm text-muted-foreground">{formatDate(c.attemptedAt)}</span> },
    { key: 'ref', header: 'Reference', cell: (c) => <span className="font-mono text-xs">{c.txRef}</span> },
    { key: 'plan', header: 'Plan', cell: (c) => c.plan ? <Badge variant="secondary">{c.plan.name}</Badge> : <span className="text-xs text-muted-foreground">—</span> },
    { key: 'amount', header: 'Amount', align: 'right', cell: (c) => <span className="font-medium">{formatMoney(c.amountMinor, c.currency)}</span> },
    { key: 'card', header: 'Card', cell: (c) => c.card ? <span className="text-xs text-muted-foreground">{c.card.brand} •• {c.card.last4}</span> : <span className="text-xs text-muted-foreground">—</span> },
    { key: 'status', header: 'Status', cell: (c) => {
      const variant = c.status === 'SUCCESSFUL' ? 'success' : c.status === 'FAILED' ? 'destructive' : c.status === 'REQUIRES_OTP' ? 'warning' : 'secondary';
      const icon = c.status === 'SUCCESSFUL' ? <CheckCircle2 className="h-3 w-3" /> : c.status === 'FAILED' ? <AlertCircle className="h-3 w-3" /> : null;
      return <Badge variant={variant as 'success' | 'destructive' | 'warning' | 'secondary'}>{icon} {c.status.replace('_', ' ')}</Badge>;
    } },
    { key: 'actions', header: '', align: 'right', cell: (c) => c.status === 'FAILED' ? (
      <Button variant="ghost" size="sm" disabled={retryMut.isPending} onClick={() => retryMut.mutate(c.id)}>Retry</Button>
    ) : null },
  ];

  return (
    <DataTable
      columns={columns}
      data={data?.items ?? []}
      loading={isLoading}
      rowKey={(c) => c.id}
      emptyTitle="No charges yet"
      emptyDescription="Your subscription billing history will appear here."
      page={page}
      totalPages={data?.totalPages}
      total={data?.total}
      onPageChange={setPage}
    />
  );
}

// =====================================================
// Events log tab
// =====================================================

function EventsTab() {
  const [page, setPage] = React.useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['payment-events', page],
    queryFn: () => paymentService.listEvents(page, 20),
  });

  const columns: Column<SubscriptionEventRecord>[] = [
    { key: 'date', header: 'Date', cell: (e) => <span className="text-sm text-muted-foreground">{formatDate(e.createdAt)}</span> },
    { key: 'type', header: 'Type', cell: (e) => <Badge variant="secondary" className="font-mono text-xs">{e.type}</Badge> },
    { key: 'desc', header: 'Description', cell: (e) => <span className="text-sm">{e.description}</span> },
    { key: 'amount', header: 'Amount', align: 'right', cell: (e) => e.amountMinor ? <span className="font-medium">{formatMoney(e.amountMinor, e.currency ?? 'NGN')}</span> : <span className="text-xs text-muted-foreground">—</span> },
    { key: 'plan', header: 'Plan', cell: (e) => e.plan ? <Badge variant="secondary">{e.plan.name}</Badge> : <span className="text-xs text-muted-foreground">—</span> },
  ];

  return (
    <DataTable
      columns={columns}
      data={data?.items ?? []}
      loading={isLoading}
      rowKey={(e) => e.id}
      emptyTitle="No activity yet"
      emptyDescription="Subscription events will be recorded here."
      page={page}
      totalPages={data?.totalPages}
      total={data?.total}
      onPageChange={setPage}
    />
  );
}
