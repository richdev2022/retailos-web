import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Check, Store, ChevronLeft, ChevronRight, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Select, SelectTrigger, SelectItem } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { businessService } from '@/lib/services';
import { useBusinessStore } from '@/stores/business-store';
import { toast } from '@/components/ui/toast';
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';

const categories = ['Grocery', 'Electronics', 'Fashion', 'Pharmacy', 'Restaurant', 'Hardware', 'Cosmetics', 'General'];

const schema = z.object({
  name: z.string().min(2, 'Business name is required'),
  category: z.string().min(1, 'Select a category'),
  phone: z.string().min(6, 'Phone is required'),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  country: z.string().default('NG'),
  currency: z.string().default('NGN'),
  address: z.string().optional(),
  taxRateBps: z.number().min(0).max(10000).default(0),
});
type FormValues = z.infer<typeof schema>;

const steps = [
  { id: 1, title: 'Business details', desc: 'Tell us about your business' },
  { id: 2, title: 'Location & contact', desc: 'Where are you located?' },
  { id: 3, title: 'Tax & currency', desc: 'Configure your preferences' },
];

export default function CreateBusinessPage() {
  const navigate = useNavigate();
  const { setActiveBusiness, setBusinesses } = useBusinessStore();
  const [step, setStep] = React.useState(1);
  const [submitting, setSubmitting] = React.useState(false);

  const { register, handleSubmit, watch, setValue, trigger, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', category: '', phone: '', email: '', country: 'NG', currency: 'NGN', address: '', taxRateBps: 0 },
  });

  const category = watch('category');
  const currency = watch('currency');

  const next = async () => {
    const fields: Record<number, (keyof FormValues)[]> = {
      1: ['name', 'category', 'phone'],
      2: ['email'],
    };
    const toValidate = fields[step] ?? [];
    const valid = toValidate.length ? await trigger(toValidate) : true;
    if (valid) setStep((s) => Math.min(3, s + 1));
  };

  const back = () => setStep((s) => Math.max(1, s - 1));

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const biz = await businessService.create({
        name: values.name,
        category: values.category,
        phone: values.phone,
        email: values.email || null,
        country: values.country,
        currency: values.currency,
        address: values.address || null,
        taxRateBps: values.taxRateBps,
      });
      try {
        await businessService.activate(biz.id);
      } catch {
        /* ignore */
      }
      const list = await businessService.list();
      setBusinesses(list);
      setActiveBusiness(biz.id);
      toast.success('Business created successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to create business');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden w-1/3 flex-col justify-between bg-sidebar p-12 lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent font-heading text-xl font-bold text-accent-foreground">R</div>
          <span className="font-heading text-xl font-bold text-sidebar-foreground">RetailOS</span>
        </div>
        <div className="space-y-4">
          <h2 className="font-heading text-3xl font-bold text-sidebar-foreground">Let's set up your store</h2>
          <p className="text-sidebar-foreground/60">A few details and you'll be ready to start selling.</p>
        </div>
        <p className="text-xs text-sidebar-foreground/40">Step {step} of {steps.length}</p>
      </div>

      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-border p-6">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar font-bold text-accent">R</div>
            <span className="font-heading font-bold">RetailOS</span>
          </div>
          <span className="ml-auto text-sm text-muted-foreground">Step {step} of {steps.length}</span>
        </div>

        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-xl">
            {/* Stepper */}
            <div className="mb-8 flex items-center justify-between">
              {steps.map((s, i) => (
                <React.Fragment key={s.id}>
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors',
                        step > s.id ? 'border-accent bg-accent text-accent-foreground' : step === s.id ? 'border-accent text-accent' : 'border-border text-muted-foreground',
                      )}
                    >
                      {step > s.id ? <Check className="h-4 w-4" /> : s.id}
                    </div>
                    <span className={cn('hidden text-xs sm:block', step === s.id ? 'font-medium text-foreground' : 'text-muted-foreground')}>{s.title}</span>
                  </div>
                  {i < steps.length - 1 && <div className={cn('mx-2 h-0.5 flex-1 rounded', step > s.id ? 'bg-accent' : 'bg-border')} />}
                </React.Fragment>
              ))}
            </div>

            <Card className="p-6 sm:p-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {step === 1 && (
                  <div className="space-y-5 animate-fade-in">
                    <div className="space-y-1.5">
                      <h3 className="font-heading text-xl font-semibold">Business details</h3>
                      <p className="text-sm text-muted-foreground">What's your business called?</p>
                    </div>
                    <Field label="Business name" htmlFor="name" required error={errors.name?.message}>
                      <div className="relative">
                        <Store className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input id="name" placeholder="Adaeze General Store" className="pl-9" {...register('name')} />
                      </div>
                    </Field>
                    <Field label="Category" htmlFor="category" required error={errors.category?.message}>
                      <Select value={category} onValueChange={(v) => setValue('category', v, { shouldValidate: true })}>
                        <SelectTrigger id="category"><Building2 className="mr-1.5 h-4 w-4 text-muted-foreground" />{category || 'Select category'}</SelectTrigger>
                        {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </Select>
                    </Field>
                    <Field label="Phone" htmlFor="phone" required error={errors.phone?.message}>
                      <Input id="phone" placeholder="+234 801 234 5678" {...register('phone')} />
                    </Field>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-5 animate-fade-in">
                    <div className="space-y-1.5">
                      <h3 className="font-heading text-xl font-semibold">Location & contact</h3>
                      <p className="text-sm text-muted-foreground">How can customers reach you?</p>
                    </div>
                    <Field label="Email" htmlFor="email" helper="Optional" error={errors.email?.message}>
                      <Input id="email" type="email" placeholder="store@example.com" {...register('email')} />
                    </Field>
                    <Field label="Address" htmlFor="address" helper="Optional">
                      <Textarea id="address" placeholder="12 Market Road, Onitsha, Anambra" rows={3} {...register('address')} />
                    </Field>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-5 animate-fade-in">
                    <div className="space-y-1.5">
                      <h3 className="font-heading text-xl font-semibold">Tax & currency</h3>
                      <p className="text-sm text-muted-foreground">Configure your financial preferences.</p>
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label="Currency" htmlFor="currency">
                        <Select value={currency} onValueChange={(v) => setValue('currency', v)}>
                          <SelectTrigger id="currency">{currency}</SelectTrigger>
                          <SelectItem value="NGN">NGN - Nigerian Naira</SelectItem>
                          <SelectItem value="USD">USD - US Dollar</SelectItem>
                          <SelectItem value="GHS">GHS - Ghana Cedi</SelectItem>
                          <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
                        </Select>
                      </Field>
                      <Field label="Tax rate (%)" htmlFor="taxRate" helper="VAT/sales tax">
                        <Input
                          id="taxRate"
                          type="number"
                          step="0.1"
                          defaultValue={0}
                          onChange={(e) => setValue('taxRateBps', Math.round((Number(e.target.value) || 0) * 100))}
                          placeholder="7.5"
                        />
                      </Field>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <Button type="button" variant="ghost" onClick={step === 1 ? () => navigate(-1) : back}>
                    <ChevronLeft className="h-4 w-4" /> {step === 1 ? 'Cancel' : 'Back'}
                  </Button>
                  {step < 3 ? (
                    <Button type="button" variant="accent" onClick={next}>
                      Continue <ChevronRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button type="submit" variant="accent" disabled={submitting}>
                      {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                      Create business
                    </Button>
                  )}
                </div>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
