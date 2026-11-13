import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, Plus, Phone, Mail } from 'lucide-react';
import { supplierService } from '@/lib/services';
import { useActiveBusiness } from '@/hooks/use-active-business';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { StatCard } from '@/components/shared/StatCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { ApiError } from '@/lib/api';
import { formatMoney, formatDate } from '@/lib/format';
import type { Supplier } from '@/lib/types';

const schema = z.object({
  name: z.string().min(2, 'Supplier name is required'),
  contactPerson: z.string().optional(),
  phone: z.string().min(6, 'Phone is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function SuppliersPage() {
  const { activeBusiness } = useActiveBusiness();
  const currency = activeBusiness?.currency ?? 'NGN';
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [createOpen, setCreateOpen] = React.useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', { search, page }],
    queryFn: () => supplierService.list({ search: search || undefined, page, limit: 15 }),
    enabled: !!activeBusiness,
  });
  const suppliers = data?.items ?? [];
  const payables = suppliers.reduce((s, x) => s + Number(x.payablesMinor), 0);

  const columns: Column<Supplier>[] = [
    { key: 'name', header: 'Supplier', cell: (s) => (
      <div>
        <p className="font-medium">{s.name}</p>
        {s.contactPerson && <p className="text-xs text-muted-foreground">{s.contactPerson}</p>}
      </div>
    ) },
    { key: 'phone', header: 'Contact', cell: (s) => (
      <div className="space-y-0.5 text-sm">
        {s.phone && <p className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-muted-foreground" />{s.phone}</p>}
        {s.email && <p className="flex items-center gap-1.5 text-muted-foreground"><Mail className="h-3 w-3" />{s.email}</p>}
      </div>
    ) },
    { key: 'payables', header: 'Payables', align: 'right', cell: (s) => {
      const bal = Number(s.payablesMinor);
      return bal > 0 ? <span className="font-medium text-warning">{formatMoney(bal, currency)}</span> : <Badge variant="secondary">Settled</Badge>;
    } },
    { key: 'created', header: 'Added', cell: (s) => <span className="text-sm text-muted-foreground">{formatDate(s.createdAt)}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suppliers"
        description="Track suppliers, purchase history and outstanding payables."
        icon={<Building2 className="h-5 w-5" />}
        actions={<Button variant="accent" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Add supplier</Button>}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total suppliers" value={isLoading ? '' : String(data?.total ?? 0)} loading={isLoading} icon={<Building2 className="h-5 w-5" />} accent="primary" />
        <StatCard label="With payables" value={isLoading ? '' : String(suppliers.filter((s) => Number(s.payablesMinor) > 0).length)} loading={isLoading} icon={<Building2 className="h-5 w-5" />} accent="warning" />
        <StatCard label="Total payables" value={isLoading ? '' : formatMoney(payables, currency)} loading={isLoading} icon={<Building2 className="h-5 w-5" />} accent="destructive" />
      </div>
      <DataTable
        columns={columns}
        data={suppliers}
        loading={isLoading}
        rowKey={(s) => s.id}
        searchable
        searchValue={search}
        onSearch={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search by name or phone..."
        emptyTitle="No suppliers yet"
        emptyDescription="Add your first supplier to start tracking purchases and payables."
        emptyIcon={<Building2 className="h-6 w-6" />}
        page={page}
        totalPages={data?.totalPages}
        total={data?.total}
        onPageChange={setPage}
      />
      <CreateSupplierDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

function CreateSupplierDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', contactPerson: '', phone: '', email: '', address: '', notes: '' },
  });
  React.useEffect(() => { if (!open) reset(); }, [open, reset]);
  const mutation = useMutation({
    mutationFn: (v: FormValues) => supplierService.create({ name: v.name, contactPerson: v.contactPerson || null, phone: v.phone, email: v.email || null, address: v.address || null, notes: v.notes || null }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['suppliers'] }); toast.success('Supplier added'); onOpenChange(false); },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed to add supplier'),
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add supplier</DialogTitle><DialogDescription>Create a new supplier profile</DialogDescription></DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <Field label="Supplier name" required error={errors.name?.message}><Input {...register('name')} placeholder="ABC Distributors Ltd" /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Contact person"><Input {...register('contactPerson')} placeholder="John Doe" /></Field>
            <Field label="Phone" required error={errors.phone?.message}><Input {...register('phone')} placeholder="+234 801 234 5678" /></Field>
          </div>
          <Field label="Email" error={errors.email?.message}><Input type="email" {...register('email')} placeholder="sales@supplier.com" /></Field>
          <Field label="Address"><Input {...register('address')} placeholder="Warehouse address" /></Field>
          <Field label="Notes"><Textarea rows={2} {...register('notes')} placeholder="Payment terms, lead time, etc." /></Field>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" variant="accent" disabled={mutation.isPending}>{mutation.isPending ? 'Saving...' : 'Save supplier'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
