import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuthStore } from '@/stores/auth-store';
import { authService } from '@/lib/services';
import { toast } from '@/components/ui/toast';
import { ApiError } from '@/lib/api';
import { PasswordInput } from './LoginPage';

const schema = z
  .object({
    fullName: z.string().min(2, 'Full name is too short'),
    email: z.string().email('Enter a valid email').optional().or(z.literal('')),
    phone: z.string().min(6, 'Enter a valid phone number'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    acceptedTerms: z.literal(true, { errorMap: () => ({ message: 'You must accept the terms' }) }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [submitting, setSubmitting] = React.useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', email: '', phone: '', password: '', confirmPassword: '', acceptedTerms: false as unknown as true },
  });

  const password = watch('password') ?? '';
  const strength = React.useMemo(() => scorePassword(password), [password]);

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const session = await authService.register({
        fullName: values.fullName,
        email: values.email || undefined,
        phone: values.phone,
        password: values.password,
        acceptedTerms: true,
      });
      setAuth(session.user, session.accessToken);
      toast.success("Account created! Let's set up your business.");
      navigate('/onboarding/business');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Registration failed';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      description="Start your 14-day free trial. No card required."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-accent hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Full name" htmlFor="fullName" required error={errors.fullName?.message}>
          <Input id="fullName" placeholder="Adaeze Okonkwo" {...register('fullName')} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email" htmlFor="email" helper="Optional" error={errors.email?.message}>
            <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
          </Field>
          <Field label="Phone" htmlFor="phone" required error={errors.phone?.message}>
            <Input id="phone" placeholder="+234 801 234 5678" {...register('phone')} />
          </Field>
        </div>
        <Field label="Password" htmlFor="password" required error={errors.password?.message}>
          <PasswordInput id="password" placeholder="At least 8 characters" {...register('password')} />
          {password && (
            <div className="mt-2 flex items-center gap-1.5">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${i < strength.score ? strength.color : 'bg-muted'}`}
                />
              ))}
              <span className="ml-1 text-xs text-muted-foreground">{strength.label}</span>
            </div>
          )}
        </Field>
        <Field label="Confirm password" htmlFor="confirmPassword" required error={errors.confirmPassword?.message}>
          <PasswordInput id="confirmPassword" placeholder="Re-enter password" {...register('confirmPassword')} />
        </Field>
        <Field error={errors.acceptedTerms?.message}>
          <label className="flex items-start gap-2.5 text-sm text-muted-foreground">
            <Checkbox {...register('acceptedTerms')} />
            <span>
              I agree to the{' '}
              <a href="#" className="text-accent hover:underline">Terms of Service</a> and{' '}
              <a href="#" className="text-accent hover:underline">Privacy Policy</a>
            </span>
          </label>
        </Field>
        <Button type="submit" variant="accent" size="lg" className="w-full" disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}

function scorePassword(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['bg-destructive', 'bg-warning', 'bg-warning', 'bg-accent', 'bg-success'];
  return { score, label: labels[score]!, color: colors[score]! };
}
