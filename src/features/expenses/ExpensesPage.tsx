import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Wallet, Plus, Download } from 'lucide-react';
import { expenseService } from '@/lib/services';
import { useActiveBusiness } from '@/hooks/use-active-business';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { StatCard } from '@/components/shared/StatCard';
import { DateRangeFilter, type DateRange } from '@/components/shared/DateRangeFilter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { ApiError } from '@/lib/api';
import { formatMoney, formatDate, toMajor, majorToMinorString } from '@/lib/format';
import { toCsv, downloadFile } from '@/lib/utils';
import type { Expense, PaymentMethod } from '@/lib/types';

const categories = ['Rent', 'Utilities', 'Salaries', 'Transport', 'Maintenance', 'Marketing', 'Supplies', 'Miscellaneous'];

const schema = z.object({
  category: z.string().min(1, 'Select a category'),
  description: z.string().min(2, 'Description is required'),
  amount: z.coerce.number().min(0.01, 'Amount must be > 0'),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'CARD_POS', 'OTHER']),
  reference: z.string().optional(),
  expenseDate: z.string().min(1, 'Date is required'),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function ExpensesPage() {
  const { activeBusiness } = useActiveBusiness();
  const currency = activeBusiness?.currency ?? 'NGN';
  const [range, setRange] = React.useState<DateRange>({ from: new Date(Date.now() - 30 * 86400000).toISOString(), to: new Date().toISOString() });
  const [categoryFilter, setCategoryFilter] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [createOpen, setCreateOpen] = React.useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', { from: range.from, to: range.to, category: categoryFilter, page }],
    queryFn: () => expenseService.list({ from: range.from, to: range.to, category: categoryFilter || undefined, page, limit: 12 }),
    enabled: !!activeBusiness,
  });

  const expenses = data?.items ?? [];
  const totalExpenses = expenses.reduce((s, e) => s + toMajor(e.amountMinor), 0);

  const columns: Column<Expense>[] = [
    { key: 'date', header: 'Date', cell: (e) => <span className="text-sm text-muted-foreground">{formatDate(e.expenseDate)}</span> },
    { key: 'desc', header: 'Description', cell: (e) => <div><p className="font-medium">{e.description}</p><p className="text-xs text-muted-foreground">{e.reference ?? ''}</p></div> },
    { key: 'category', header: 'Category', cell: (e) => <Badge variant="secondary">{e.category}</Badge> },
    { key: 'method', header: 'Method', cell: (e) => <span className="text-sm text-muted-foreground">{e.paymentMethod.replace('_', ' ').toLowerCase()}</span> },
    { key: 'amount', header: 'Amount', align: 'right', cell: (e) => <span className="font-medium text-destructive">{formatMoney(e.amountMinor, currency)}</span> },
  ];

  const exportCsv = () => {
    const rows = expenses.map((e) => ({ date: formatDate(e.expenseDate), description: e.description, category: e.category, method: e.paymentMethod, amount: toMajor(e.amountMinor) }));
    downloadFile(`expenses_${Date.now()}.csv`, toCsv(rows));
    toast.success('Expenses exported');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        description="Record and track your business expenses by category."
        icon={<Wallet className="h-5 w-5" />}
        actions={
          <>
            <Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4" /> Export</Button>
            <Button variant="accent" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Add expense</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total (period)" value={isLoading ? '' : formatMoney(majorToMinorString(totalExpenses), currency)} loading={isLoading} icon={<Wallet className="h-5 w-5" />} accent="destructive" />
        <StatCard label="Transactions" value={isLoading ? '' : String(expenses.length)} loading={isLoading} icon={<Wallet className="h-5 w-5" />} accent="primary" />
        <StatCard label="Avg / day" value={isLoading ? '' : formatMoney(majorToMinorString(totalExpenses / 30), currency)} loading={isLoading} icon={<Wallet className="h-5 w-5" />} accent="warning" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <DateRangeFilter value={range} onChange={(r) => { setRange(r); setPage(1); }} />
        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">{categoryFilter || 'All categories'}</SelectTrigger>
          <SelectItem value="">All categories</SelectItem>
          {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={expenses}
        loading={isLoading}
        rowKey={(e) => e.id}
        emptyTitle="No expenses recorded"
        emptyDescription="Track your spending by adding your first expense."
        emptyIcon={<Wallet className="h-6 w-6" />}
        page={page}
        totalPages={data?.totalPages}
        total={data?.total}
        onPageChange={setPage}
      />

      <CreateExpenseDialog open={createOpen} onOpenChange={setCreateOpen} currency={currency} />
    </div>
  );
}

function CreateExpenseDialog({ open, onOpenChange, currency }: { open: boolean; onOpenChange: (v: boolean) => void; currency: string }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { category: '', description: '', amount: 0, paymentMethod: 'CASH', reference: '', expenseDate: new Date().toISOString().slice(0, 10), notes: '' },
  });

  React.useEffect(() => { if (!open) reset(); }, [open, reset]);

  const category = watch('category');
  const method = watch('paymentMethod');

  const mutation = useMutation({
    mutationFn: (v: FormValues) => expenseService.create({
      title: v.description, description: v.description, amount: String(v.amount), category: v.category,
      paymentMethod: v.paymentMethod as PaymentMethod, reference: v.reference || null, expenseDate: new Date(v.expenseDate).toISOString(), notes: v.notes,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense recorded');
      onOpenChange(false);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed to record expense'),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add expense</DialogTitle><DialogDescription>Record a new business expense</DialogDescription></DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category" required error={errors.category?.message}>
              <Select value={category} onValueChange={(v) => setValue('category', v, { shouldValidate: true })}>
                <SelectTrigger>{category || 'Select category'}</SelectTrigger>
                {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </Select>
            </Field>
            <Field label="Amount" required error={errors.amount?.message} helper={currency}>
              <Input type="number" step="0.01" {...register('amount')} placeholder="0.00" />
            </Field>
          </div>
          <Field label="Description" required error={errors.description?.message}>
            <Input {...register('description')} placeholder="Office supplies purchase" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Payment method" required error={errors.paymentMethod?.message}>
              <Select value={method} onValueChange={(v) => setValue('paymentMethod', v as FormValues['paymentMethod'])}>
                <SelectTrigger>{method.replace('_', ' ').toLowerCase()}</SelectTrigger>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="BANK_TRANSFER">Bank transfer</SelectItem>
                <SelectItem value="CARD_POS">Card / POS</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </Select>
            </Field>
            <Field label="Date" required error={errors.expenseDate?.message}>
              <Input type="date" {...register('expenseDate')} />
            </Field>
          </div>
          <Field label="Reference" error={errors.reference?.message}><Input {...register('reference')} placeholder="INV-001 (optional)" /></Field>
          <Field label="Notes"><Textarea rows={2} {...register('notes')} /></Field>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" variant="accent" disabled={mutation.isPending}>{mutation.isPending ? 'Saving...' : 'Save expense'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
