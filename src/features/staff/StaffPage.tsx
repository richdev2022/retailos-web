import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserCog, Plus, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import { staffService } from '@/lib/services';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from '@/components/ui/toast';
import { ApiError } from '@/lib/api';
import { formatDate, formatRelative } from '@/lib/format';
import type { StaffMember } from '@/lib/types';

const ROLE_LABELS: Record<string, string> = {
  BUSINESS_OWNER: 'Owner',
  BUSINESS_ADMIN: 'Admin',
  MANAGER: 'Manager',
  CASHIER: 'Cashier',
  INVENTORY_OFFICER: 'Inventory',
  ACCOUNTANT: 'Accountant',
};

const PERMISSION_MATRIX = [
  { feature: 'Dashboard', owner: 'Full', manager: 'Yes', cashier: 'Limited', inventory: 'Limited' },
  { feature: 'View products', owner: 'Yes', manager: 'Yes', cashier: 'Yes', inventory: 'Yes' },
  { feature: 'Create products', owner: 'Yes', manager: 'Yes', cashier: 'No', inventory: 'Yes' },
  { feature: 'Edit prices', owner: 'Yes', manager: 'Configurable', cashier: 'No', inventory: 'No' },
  { feature: 'Stock entry', owner: 'Yes', manager: 'Yes', cashier: 'No', inventory: 'Yes' },
  { feature: 'Process sales', owner: 'Yes', manager: 'Yes', cashier: 'Yes', inventory: 'No' },
  { feature: 'Cancel sales', owner: 'Yes', manager: 'Configurable', cashier: 'No', inventory: 'No' },
  { feature: 'View profits', owner: 'Yes', manager: 'Yes', cashier: 'No', inventory: 'No' },
  { feature: 'Manage expenses', owner: 'Yes', manager: 'Yes', cashier: 'No', inventory: 'No' },
  { feature: 'View reports', owner: 'Yes', manager: 'Yes', cashier: 'Limited', inventory: 'Limited' },
  { feature: 'Manage staff', owner: 'Yes', manager: 'Configurable', cashier: 'No', inventory: 'No' },
  { feature: 'Subscription', owner: 'Yes', manager: 'No', cashier: 'No', inventory: 'No' },
];

const schema = z.object({
  email: z.string().email('Valid email required'),
  role: z.enum(['MANAGER', 'CASHIER', 'INVENTORY_OFFICER', 'ACCOUNTANT', 'BUSINESS_ADMIN']),
});
type FormValues = z.infer<typeof schema>;

export default function StaffPage() {
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const { data: staff, isLoading } = useQuery({ queryKey: ['staff'], queryFn: staffService.list });

  const columns: Column<StaffMember>[] = [
    { key: 'name', header: 'Name', cell: (s) => (
      <div>
        <p className="font-medium">{s.fullName}</p>
        <p className="text-xs text-muted-foreground">{s.email ?? s.phone}</p>
      </div>
    ) },
    { key: 'role', header: 'Role', cell: (s) => <Badge variant={s.role === 'BUSINESS_OWNER' ? 'default' : 'secondary'}>{ROLE_LABELS[s.role] ?? s.role}</Badge> },
    { key: 'status', header: 'Status', cell: (s) => s.status === 'ACTIVE' ? <span className="flex items-center gap-1.5 text-sm text-success"><CheckCircle2 className="h-4 w-4" /> Active</span> : <span className="flex items-center gap-1.5 text-sm text-muted-foreground"><XCircle className="h-4 w-4" /> Suspended</span> },
    { key: 'lastLogin', header: 'Last active', cell: (s) => <span className="text-sm text-muted-foreground">{s.lastLoginAt ? formatRelative(s.lastLoginAt) : 'Never'}</span> },
    { key: 'joined', header: 'Joined', cell: (s) => <span className="text-sm text-muted-foreground">{formatDate(s.createdAt)}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff"
        description="Invite team members, assign roles and manage permissions."
        icon={<UserCog className="h-5 w-5" />}
        actions={<Button variant="accent" onClick={() => setInviteOpen(true)}><Plus className="h-4 w-4" /> Invite staff</Button>}
      />

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="permissions">Permission matrix</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <DataTable
            columns={columns}
            data={staff ?? []}
            loading={isLoading}
            rowKey={(s) => s.id}
            emptyTitle="No staff yet"
            emptyDescription="Invite your first team member to delegate work."
            emptyIcon={<UserCog className="h-6 w-6" />}
          />
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> Permission matrix</CardTitle>
              <CardDescription>Default capabilities by role. Owners can fine-tune permissions per staff member.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-3 pr-4 font-medium">Feature</th>
                      <th className="px-4 font-medium">Owner</th>
                      <th className="px-4 font-medium">Manager</th>
                      <th className="px-4 font-medium">Cashier</th>
                      <th className="px-4 font-medium">Inventory</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PERMISSION_MATRIX.map((row) => (
                      <tr key={row.feature} className="border-b last:border-0">
                        <td className="py-3 pr-4 font-medium">{row.feature}</td>
                        <td className="px-4 text-success">{row.owner}</td>
                        <td className="px-4 text-muted-foreground">{row.manager}</td>
                        <td className="px-4 text-muted-foreground">{row.cashier}</td>
                        <td className="px-4 text-muted-foreground">{row.inventory}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <InviteStaffDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  );
}

function InviteStaffDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', role: 'CASHIER' },
  });
  React.useEffect(() => { if (!open) reset(); }, [open, reset]);
  const role = watch('role');
  const mutation = useMutation({
    mutationFn: (v: FormValues) => staffService.invite({ email: v.email, role: v.role }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['staff'] }); toast.success('Invitation sent'); onOpenChange(false); },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed to send invitation'),
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Invite staff member</DialogTitle><DialogDescription>Send an invitation to join your business</DialogDescription></DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <Field label="Email" required error={errors.email?.message}><Input type="email" {...register('email')} placeholder="staff@business.com" /></Field>
          <Field label="Role" required error={errors.role?.message}>
            <Select value={role} onValueChange={(v) => setValue('role', v as FormValues['role'])}>
              <SelectTrigger>{ROLE_LABELS[role] ?? role}</SelectTrigger>
              <SelectItem value="BUSINESS_ADMIN">Admin</SelectItem>
              <SelectItem value="MANAGER">Manager</SelectItem>
              <SelectItem value="CASHIER">Cashier</SelectItem>
              <SelectItem value="INVENTORY_OFFICER">Inventory Officer</SelectItem>
              <SelectItem value="ACCOUNTANT">Accountant</SelectItem>
            </Select>
          </Field>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" variant="accent" disabled={mutation.isPending}>{mutation.isPending ? 'Sending...' : 'Send invite'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
