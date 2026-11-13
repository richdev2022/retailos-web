import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Users, Plus, Phone, Mail } from 'lucide-react';
import { customerService } from '@/lib/services';
import { useActiveBusiness } from '@/hooks/use-active-business';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { StatCard } from '@/components/shared/StatCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { ApiError } from '@/lib/api';
import { formatMoney, formatDate } from '@/lib/format';
import type { Customer } from '@/lib/types';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().min(6, 'Phone is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  type: z.enum(['INDIVIDUAL', 'BUSINESS']),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function CustomersPage() {
  const { activeBusiness } = useActiveBusiness();
  const currency = activeBusiness?.currency ?? 'NGN';
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [createOpen, setCreateOpen] = React.useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['customers', { search, page }],
    queryFn: () => customerService.list({ search: search || undefined, page, limit: 15 }),
    enabled: !!activeBusiness,
  });
  const customers = data?.items ?? [];
  const outstanding = customers.reduce((s, c) => s + Number(c.outstandingBalanceMinor), 0);

  const columns: Column<Customer>[] = [
    { key: 'name', header: 'Customer', cell: (c) => (
      <div>
        <p className="font-medium">{c.name}</p>
        <p className="text-xs text-muted-foreground">{c.type?.toLowerCase() ?? 'individual'}</p>
      </div>
    ) },
    { key: 'phone', header: 'Contact', cell: (c) => (
      <div className="space-y-0.5 text-sm">
        {c.phone && <p className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-muted-foreground" />{c.phone}</p>}
        {c.email && <p className="flex items-center gap-1.5 text-muted-foreground"><Mail className="h-3 w-3" />{c.email}</p>}
      </div>
    ) },
    { key: 'balance', header: 'Outstanding', align: 'right', cell: (c) => {
      const bal = Number(c.outstandingBalanceMinor);
      return bal > 0 ? <span className="font-medium text-warning">{formatMoney(bal, currency)}</span> : <Badge variant="secondary">Settled</Badge>;
    } },
    { key: 'created', header: 'Customer since', cell: (c) => <span className="text-sm text-muted-foreground">{formatDate(c.createdAt)}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Manage customer profiles, purchase history and credit balances."
        icon={<Users className="h-5 w-5" />}
        actions={<Button variant="accent" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Add customer</Button>}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total customers" value={isLoading ? '' : String(data?.total ?? 0)} loading={isLoading} icon={<Users className="h-5 w-5" />} accent="primary" />
        <StatCard label="With outstanding credit" value={isLoading ? '' : String(customers.filter((c) => Number(c.outstandingBalanceMinor) > 0).length)} loading={isLoading} icon={<Users className="h-5 w-5" />} accent="warning" />
        <StatCard label="Total outstanding" value={isLoading ? '' : formatMoney(outstanding, currency)} loading={isLoading} icon={<Users className="h-5 w-5" />} accent="destructive" />
      </div>
      <DataTable
        columns={columns}
        data={customers}
        loading={isLoading}
        rowKey={(c) => c.id}
        searchable
        searchValue={search}
        onSearch={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search by name or phone..."
        emptyTitle="No customers yet"
        emptyDescription="Add your first customer to start tracking purchases and credit."
        emptyIcon={<Users className="h-6 w-6" />}
        page={page}
        totalPages={data?.totalPages}
        total={data?.total}
        onPageChange={setPage}
      />
      <CreateCustomerDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

function CreateCustomerDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', phone: '', email: '', address: '', type: 'INDIVIDUAL', notes: '' },
  });
  React.useEffect(() => { if (!open) reset(); }, [open, reset]);
  const type = watch('type');
  const mutation = useMutation({
    mutationFn: (v: FormValues) => customerService.create({ name: v.name, phone: v.phone, email: v.email || null, address: v.address || null, type: v.type, notes: v.notes || null }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['customers'] }); toast.success('Customer added'); onOpenChange(false); },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed to add customer'),
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add customer</DialogTitle><DialogDescription>Create a new customer profile</DialogDescription></DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <Field label="Full name" required error={errors.name?.message}><Input {...register('name')} placeholder="John Doe" /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone" required error={errors.phone?.message}><Input {...register('phone')} placeholder="+234 801 234 5678" /></Field>
            <Field label="Email" error={errors.email?.message}><Input type="email" {...register('email')} placeholder="customer@email.com" /></Field>
          </div>
          <Field label="Customer type" required>
            <Select value={type} onValueChange={(v) => setValue('type', v as FormValues['type'])}>
              <SelectTrigger>{type === 'INDIVIDUAL' ? 'Individual' : 'Business'}</SelectTrigger>
              <SelectItem value="INDIVIDUAL">Individual</SelectItem>
              <SelectItem value="BUSINESS">Business</SelectItem>
            </Select>
          </Field>
          <Field label="Address"><Input {...register('address')} placeholder="Street, city" /></Field>
          <Field label="Notes"><Textarea rows={2} {...register('notes')} placeholder="Preferences, VIP, etc." /></Field>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" variant="accent" disabled={mutation.isPending}>{mutation.isPending ? 'Saving...' : 'Save customer'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
