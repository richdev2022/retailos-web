import * as React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreditCard, Check, Crown, Rocket, Building2, Sparkles } from 'lucide-react';
import { subscriptionService } from '@/lib/services';
import { useActiveBusiness } from '@/hooks/use-active-business';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';
import { ApiError } from '@/lib/api';
import { formatMoney, formatDate, majorToMinorString } from '@/lib/format';
import type { SubscriptionPlan } from '@/lib/types';

const PLAN_ICONS: Record<string, React.ReactNode> = {
  Free: <Building2 className="h-5 w-5" />,
  Pro: <Rocket className="h-5 w-5" />,
  Business: <Crown className="h-5 w-5" />,
  Enterprise: <Sparkles className="h-5 w-5" />,
};

const schema = z.object({
  reference: z.string().min(4, 'Payment reference required'),
  amount: z.coerce.number().min(1, 'Amount required'),
  proofUrl: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function SubscriptionPage() {
  const { activeBusiness } = useActiveBusiness();
  const currency = activeBusiness?.currency ?? 'NGN';
  const [submitOpen, setSubmitOpen] = React.useState(false);
  const [selectedPlan, setSelectedPlan] = React.useState<SubscriptionPlan | null>(null);

  const { data: sub, isLoading: subLoading } = useQuery({ queryKey: ['subscription', 'current'], queryFn: subscriptionService.current });
  const { data: plans, isLoading: plansLoading } = useQuery({ queryKey: ['subscription', 'plans'], queryFn: subscriptionService.plans });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription"
        description="Manage your plan, view entitlements and submit payments."
        icon={<CreditCard className="h-5 w-5" />}
      />

      {subLoading ? (
        <div className="h-32 animate-pulse rounded-lg bg-muted" />
      ) : sub && (
        <Card className="bg-gradient-to-br from-accent/10 to-primary/5">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-heading text-2xl font-semibold">{sub.plan.name} plan</p>
                <Badge variant={sub.status === 'ACTIVE' || sub.status === 'TRIAL' ? 'default' : 'destructive'}>{sub.status}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {sub.status === 'TRIAL' ? 'Trial active' : 'Active'} until {sub.endDate ? formatDate(sub.endDate) : 'N/A'}
                {sub.graceEndsAt && ` · grace ends ${formatDate(sub.graceEndsAt)}`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div className="rounded-lg border bg-card p-3"><p className="text-xs text-muted-foreground">Products</p><p className="font-medium">{sub.plan.productLimit ?? 'Unlimited'}</p></div>
              <div className="rounded-lg border bg-card p-3"><p className="text-xs text-muted-foreground">Staff</p><p className="font-medium">{sub.plan.staffLimit ?? 'Unlimited'}</p></div>
              <div className="rounded-lg border bg-card p-3"><p className="text-xs text-muted-foreground">Branches</p><p className="font-medium">{sub.plan.branchLimit ?? 'Unlimited'}</p></div>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="mb-4 font-heading text-lg font-semibold">Available plans</h2>
        {plansLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[1, 2, 3, 4].map((i) => <div key={i} className="h-72 animate-pulse rounded-lg bg-muted" />)}</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(plans ?? []).map((plan: SubscriptionPlan) => (
              <Card key={plan.id} className={plan.popular ? 'border-accent shadow-md' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">{PLAN_ICONS[plan.name] ?? <CreditCard className="h-5 w-5" />}</div>
                    {plan.popular && <Badge variant="default">Popular</Badge>}
                  </div>
                  <CardTitle className="mt-2">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <span className="font-heading text-3xl font-semibold">{formatMoney(plan.priceMinor, currency)}</span>
                    <span className="text-sm text-muted-foreground">/{plan.interval.toLowerCase().replace('ly', '')}</span>
                  </div>
                  <ul className="space-y-2 text-sm">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    variant={plan.popular ? 'accent' : 'outline'}
                    className="w-full"
                    disabled={sub?.plan?.id === plan.id}
                    onClick={() => { setSelectedPlan(plan); setSubmitOpen(true); }}
                  >
                    {sub?.plan?.id === plan.id ? 'Current plan' : `Choose ${plan.name}`}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {selectedPlan && (
        <PaymentDialog open={submitOpen} onOpenChange={setSubmitOpen} plan={selectedPlan} currency={currency} />
      )}
    </div>
  );
}

function PaymentDialog({ open, onOpenChange, plan, currency }: { open: boolean; onOpenChange: (v: boolean) => void; plan: SubscriptionPlan; currency: string }) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { reference: '', amount: Number(plan.priceMinor) / 100, proofUrl: '' },
  });
  const mutation = useMutation({
    mutationFn: (v: FormValues) => subscriptionService.submitPayment({
      planId: plan.id,
      amountMinor: majorToMinorString(v.amount),
      reference: v.reference,
      proofUrl: v.proofUrl || undefined,
    }),
    onSuccess: () => { toast.success('Payment submitted for review'); onOpenChange(false); },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed to submit payment'),
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Subscribe to {plan.name}</DialogTitle>
          <DialogDescription>Submit a bank transfer payment for verification</DialogDescription>
        </DialogHeader>
        <div className="mb-4 rounded-lg bg-muted p-4 text-sm">
          <p className="font-medium">Bank transfer details</p>
          <p className="mt-1 text-muted-foreground">Bank: <span className="font-medium text-foreground">RetailOS Bank</span></p>
          <p className="text-muted-foreground">Account: <span className="font-medium text-foreground">0123456789</span></p>
          <p className="text-muted-foreground">Amount: <span className="font-medium text-foreground">{formatMoney(plan.priceMinor, currency)}</span></p>
        </div>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <Field label="Payment reference" required error={errors.reference?.message}><Input {...register('reference')} placeholder="TRF-20251113-001" /></Field>
          <Field label="Amount paid" required error={errors.amount?.message} helper={currency}>
            <Input type="number" step="0.01" {...register('amount')} />
          </Field>
          <Field label="Proof URL (optional)" error={errors.proofUrl?.message}><Input {...register('proofUrl')} placeholder="https://proof-url.com/receipt.png" /></Field>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" variant="accent" disabled={mutation.isPending}>{mutation.isPending ? 'Submitting...' : 'Submit payment'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
