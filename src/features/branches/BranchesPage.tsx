import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { GitBranch, Plus, Building, MapPin, ArrowRight, X } from 'lucide-react';
import { branchService, productService } from '@/lib/services';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectItem } from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import { ApiError } from '@/lib/api';
import { formatDate } from '@/lib/format';
import type { Branch } from '@/lib/types';

const schema = z.object({
  name: z.string().min(2, 'Branch name required'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function BranchesPage() {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [transferOpen, setTransferOpen] = React.useState(false);
  const { data: branches, isLoading } = useQuery({ queryKey: ['branches'], queryFn: branchService.list });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Branches"
        description="Manage multiple business locations and inter-branch stock transfers."
        icon={<GitBranch className="h-5 w-5" />}
        actions={
          <>
            <Button variant="outline" onClick={() => setTransferOpen(true)}><ArrowRight className="h-4 w-4" /> Transfer stock</Button>
            <Button variant="accent" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Add branch</Button>
          </>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((i) => <div key={i} className="h-40 animate-pulse rounded-lg bg-muted" />)}</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(branches ?? []).map((b: Branch) => (
            <Card key={b.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent"><Building className="h-5 w-5" /></div>
                  <div>
                    <p className="font-medium">{b.name}</p>
                    {b.isHQ && <Badge variant="default" className="mt-1">Headquarters</Badge>}
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                {b.address && <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3" />{b.address}</p>}
                {b.phone && <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3" />{b.phone}</p>}
                <p className="pt-2 text-xs">Created {formatDate(b.createdAt)}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CreateBranchDialog open={createOpen} onOpenChange={setCreateOpen} />
      <TransferDialog open={transferOpen} onOpenChange={setTransferOpen} branches={branches ?? []} />
    </div>
  );
}

function CreateBranchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', phone: '', email: '', address: '' },
  });
  React.useEffect(() => { if (!open) reset(); }, [open, reset]);
  const mutation = useMutation({
    mutationFn: (v: FormValues) => branchService.create({ name: v.name, phone: v.phone || null, email: v.email || null, address: v.address || null }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['branches'] }); toast.success('Branch created'); onOpenChange(false); },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed to create branch'),
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add branch</DialogTitle><DialogDescription>Create a new business location</DialogDescription></DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <Field label="Branch name" required error={errors.name?.message}><Input {...register('name')} placeholder="Lekki Phase 1" /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone"><Input {...register('phone')} placeholder="+234 801 234 5678" /></Field>
            <Field label="Email" error={errors.email?.message}><Input type="email" {...register('email')} placeholder="branch@business.com" /></Field>
          </div>
          <Field label="Address"><Input {...register('address')} placeholder="Street, city" /></Field>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" variant="accent" disabled={mutation.isPending}>{mutation.isPending ? 'Creating...' : 'Create branch'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface TransferItem { productId: string; quantity: number }
function TransferDialog({ open, onOpenChange, branches }: { open: boolean; onOpenChange: (v: boolean) => void; branches: Branch[] }) {
  const queryClient = useQueryClient();
  const [fromBranch, setFromBranch] = React.useState('');
  const [toBranch, setToBranch] = React.useState('');
  const [items, setItems] = React.useState<TransferItem[]>([]);
  const [productId, setProductId] = React.useState('');
  const [qty, setQty] = React.useState(1);

  const { data: products } = useQuery({ queryKey: ['products', 'all'], queryFn: () => productService.list({ limit: 100 }), enabled: open });

  React.useEffect(() => { if (!open) { setFromBranch(''); setToBranch(''); setItems([]); setProductId(''); setQty(1); } }, [open]);

  const addItem = () => {
    if (!productId || qty < 1) return;
    setItems((prev) => [...prev, { productId, quantity: qty }]);
    setProductId('');
    setQty(1);
  };
  const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  const mutation = useMutation({
    mutationFn: () => branchService.transfer({ fromBranchId: fromBranch, toBranchId: toBranch, items }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['inventory'] }); toast.success('Transfer initiated'); onOpenChange(false); },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed to initiate transfer'),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Stock transfer</DialogTitle><DialogDescription>Move stock between branches. Linked stock-out and stock-in movements will be created under one transfer reference.</DialogDescription></DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="From branch" required>
              <Select value={fromBranch} onValueChange={setFromBranch}>
                <SelectTrigger>{branches.find((b) => b.id === fromBranch)?.name ?? 'Select source'}</SelectTrigger>
                {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </Select>
            </Field>
            <Field label="To branch" required>
              <Select value={toBranch} onValueChange={setToBranch}>
                <SelectTrigger>{branches.find((b) => b.id === toBranch)?.name ?? 'Select destination'}</SelectTrigger>
                {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </Select>
            </Field>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Items to transfer</p>
            {items.length === 0 ? (
              <p className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">No items added yet</p>
            ) : (
              <div className="space-y-1.5">
                {items.map((it, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                    <span>{products?.items?.find((p) => p.id === it.productId)?.name ?? it.productId} × {it.quantity}</span>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(i)}><X className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-end gap-2 rounded-lg bg-muted p-3">
            <Field label="Product" className="flex-1">
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger>{products?.items?.find((p) => p.id === productId)?.name ?? 'Select product'}</SelectTrigger>
                {products?.items?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </Select>
            </Field>
            <Field label="Qty" className="w-20">
              <Input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
            </Field>
            <Button type="button" variant="outline" onClick={addItem}>Add</Button>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button variant="accent" disabled={mutation.isPending || items.length === 0 || !fromBranch || !toBranch} onClick={() => mutation.mutate()}>{mutation.isPending ? 'Initiating...' : 'Initiate transfer'}</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
