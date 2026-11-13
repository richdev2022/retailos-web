import * as React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Settings as SettingsIcon, Receipt, Bell, Shield, Building } from 'lucide-react';
import { settingsService } from '@/lib/services';
import { useActiveBusiness } from '@/hooks/use-active-business';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from '@/components/ui/toast';
import { ApiError } from '@/lib/api';

const schema = z.object({
  receiptHeader: z.string().optional(),
  receiptFooter: z.string().optional(),
  receiptShowLogo: z.boolean(),
  lowStockThreshold: z.coerce.number().min(0),
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

export default function SettingsPage() {
  const { activeBusiness } = useActiveBusiness();
  const { data, isLoading } = useQuery({ queryKey: ['settings'], queryFn: settingsService.get });
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: data ? {
      receiptHeader: data.receiptHeader,
      receiptFooter: data.receiptFooter,
      receiptShowLogo: data.receiptShowLogo,
      lowStockThreshold: data.lowStockThreshold,
      emailNotifications: data.emailNotifications,
      pushNotifications: data.pushNotifications,
    } : undefined,
  });
  React.useEffect(() => { if (data) reset(); }, [data, reset]);

  const mutation = useMutation({
    mutationFn: (v: FormValues) => settingsService.update({
      receiptHeader: v.receiptHeader,
      receiptFooter: v.receiptFooter,
      receiptShowLogo: v.receiptShowLogo,
      lowStockThreshold: v.lowStockThreshold,
      emailNotifications: v.emailNotifications,
      pushNotifications: v.pushNotifications,
    }),
    onSuccess: () => toast.success('Settings saved'),
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed to save settings'),
  });

  const receiptShowLogo = watch('receiptShowLogo');
  const emailNotifications = watch('emailNotifications');
  const pushNotifications = watch('pushNotifications');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Configure your business profile, receipts, alerts and security."
        icon={<SettingsIcon className="h-5 w-5" />}
      />

      <Tabs defaultValue="business">
        <TabsList>
          <TabsTrigger value="business">Business profile</TabsTrigger>
          <TabsTrigger value="receipt">Receipt</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="business" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Building className="h-5 w-5" /> Business profile</CardTitle><CardDescription>Update your business information</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Business name"><Input defaultValue={activeBusiness?.name} disabled /></Field>
                <Field label="Category"><Input defaultValue={activeBusiness?.category ?? ''} disabled /></Field>
                <Field label="Phone"><Input defaultValue={activeBusiness?.phone} disabled /></Field>
                <Field label="Email"><Input defaultValue={activeBusiness?.email ?? ''} disabled /></Field>
                <Field label="Currency"><Input defaultValue={activeBusiness?.currency} disabled /></Field>
                <Field label="Tax identifier"><Input defaultValue={activeBusiness?.taxIdentifier ?? ''} disabled /></Field>
              </div>
              <p className="text-xs text-muted-foreground">Business profile changes are handled through the admin. Contact support to update legal information.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receipt" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Receipt className="h-5 w-5" /> Receipt configuration</CardTitle><CardDescription>Customize the look of your printed and PDF receipts</CardDescription></CardHeader>
            <CardContent>
              {isLoading ? <div className="h-40 animate-pulse rounded-lg bg-muted" /> : (
                <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
                  <Field label="Header text"><Input {...register('receiptHeader')} placeholder="Business name" /></Field>
                  <Field label="Footer text"><Input {...register('receiptFooter')} placeholder="Thank you message" /></Field>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div><p className="font-medium">Show logo on receipts</p><p className="text-xs text-muted-foreground">Display business logo at the top of receipts</p></div>
                    <Switch checked={receiptShowLogo} onCheckedChange={(v) => setValue('receiptShowLogo', v)} />
                  </div>
                  <Button type="submit" variant="accent" disabled={mutation.isPending}>{mutation.isPending ? 'Saving...' : 'Save changes'}</Button>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Alerts &amp; notifications</CardTitle><CardDescription>Configure low-stock alerts and notification channels</CardDescription></CardHeader>
            <CardContent>
              {isLoading ? <div className="h-40 animate-pulse rounded-lg bg-muted" /> : (
                <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
                  <Field label="Low-stock threshold" error={errors.lowStockThreshold?.message} helper="Products at or below this quantity trigger an alert">
                    <Input type="number" {...register('lowStockThreshold')} />
                  </Field>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div><p className="font-medium">Email notifications</p><p className="text-xs text-muted-foreground">Daily summary, critical alerts</p></div>
                    <Switch checked={emailNotifications} onCheckedChange={(v) => setValue('emailNotifications', v)} />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div><p className="font-medium">Push notifications</p><p className="text-xs text-muted-foreground">Real-time alerts on this device</p></div>
                    <Switch checked={pushNotifications} onCheckedChange={(v) => setValue('pushNotifications', v)} />
                  </div>
                  <Button type="submit" variant="accent" disabled={mutation.isPending}>{mutation.isPending ? 'Saving...' : 'Save changes'}</Button>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Security</CardTitle><CardDescription>Manage your password and active sessions</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Field label="Current password"><Input type="password" placeholder="********" /></Field>
                <Field label="New password"><Input type="password" placeholder="********" /></Field>
                <Field label="Confirm new password"><Input type="password" placeholder="********" /></Field>
                <Button variant="outline" onClick={() => toast.info('Password change requires backend integration')}>Update password</Button>
              </div>
              <div className="border-t pt-4">
                <p className="mb-2 font-medium">Active sessions</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
                    <div><p className="font-medium">This device</p><p className="text-xs text-muted-foreground">Chrome on Windows &middot; Lagos, NG</p></div>
                    <Button variant="ghost" size="sm" onClick={() => toast.info('Sign out from account settings')}>Sign out</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
