import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LifeBuoy, Plus, MessageSquare, Clock, CheckCircle2 } from 'lucide-react';
import { supportService } from '@/lib/services';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';
import { ApiError } from '@/lib/api';
import { formatDate, formatRelative } from '@/lib/format';
import type { SupportTicket } from '@/lib/types';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  OPEN: 'default',
  IN_PROGRESS: 'secondary',
  RESOLVED: 'outline',
  CLOSED: 'secondary',
};
const STATUS_LABEL: Record<string, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

const schema = z.object({
  subject: z.string().min(4, 'Subject is required'),
  message: z.string().min(10, 'Please describe your issue in at least 10 characters'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
});
type FormValues = z.infer<typeof schema>;

export default function SupportPage() {
  const [createOpen, setCreateOpen] = React.useState(false);
  const { data: tickets, isLoading } = useQuery({ queryKey: ['support-tickets'], queryFn: supportService.list });

  const open = (tickets ?? []).filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;
  const resolved = (tickets ?? []).filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Help & Support"
        description="Get help, view ticket history and contact our team."
        icon={<LifeBuoy className="h-5 w-5" />}
        actions={<Button variant="accent" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> New ticket</Button>}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total tickets</p><p className="font-heading text-2xl font-semibold">{tickets?.length ?? 0}</p></div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><MessageSquare className="h-5 w-5" /></div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Open</p><p className="font-heading text-2xl font-semibold text-warning">{open}</p></div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/15 text-warning"><Clock className="h-5 w-5" /></div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Resolved</p><p className="font-heading text-2xl font-semibold text-success">{resolved}</p></div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success"><CheckCircle2 className="h-5 w-5" /></div>
          </div>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Ticket history</CardTitle><CardDescription>Your support requests and their status</CardDescription></CardHeader>
        <CardContent>
          {isLoading ? <div className="h-32 animate-pulse rounded-lg bg-muted" /> : (tickets ?? []).length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No tickets yet. Create one if you need help.</p>
          ) : (
            <div className="space-y-2">
              {(tickets ?? []).map((t: SupportTicket) => (
                <div key={t.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{t.subject}</p>
                        <Badge variant={STATUS_VARIANT[t.status]}>{STATUS_LABEL[t.status]}</Badge>
                        {t.priority === 'HIGH' && <Badge variant="destructive">High priority</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{t.message}</p>
                      <p className="text-xs text-muted-foreground">Created {formatRelative(t.createdAt)} · {formatDate(t.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <CreateTicketDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

function CreateTicketDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { subject: '', message: '', priority: 'MEDIUM' },
  });
  React.useEffect(() => { if (!open) reset(); }, [open, reset]);
  const priority = watch('priority');
  const mutation = useMutation({
    mutationFn: (v: FormValues) => supportService.create({ subject: v.subject, description: v.message, priority: v.priority }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['support-tickets'] }); toast.success('Ticket created'); onOpenChange(false); },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed to create ticket'),
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New support ticket</DialogTitle><DialogDescription>Tell us how we can help</DialogDescription></DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <Field label="Subject" required error={errors.subject?.message}><Input {...register('subject')} placeholder="Brief summary of the issue" /></Field>
          <Field label="Priority" required>
            <Select value={priority} onValueChange={(v) => setValue('priority', v as FormValues['priority'])}>
              <SelectTrigger>{priority === 'LOW' ? 'Low' : priority === 'MEDIUM' ? 'Medium' : 'High'}</SelectTrigger>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
            </Select>
          </Field>
          <Field label="Message" required error={errors.message?.message}><Textarea rows={4} {...register('message')} placeholder="Describe your issue in detail..." /></Field>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" variant="accent" disabled={mutation.isPending}>{mutation.isPending ? 'Creating...' : 'Create ticket'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
