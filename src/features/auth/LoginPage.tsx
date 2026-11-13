import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Mail, Phone } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { useAuthStore } from '@/stores/auth-store';
import { useBusinessStore } from '@/stores/business-store';
import { businessService, authService } from '@/lib/services';
import { toast } from '@/components/ui/toast';
import { ApiError } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

const schema = z.object({
  identifier: z.string().min(3, 'Enter your email or phone'),
  password: z.string().min(1, 'Enter your password'),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setAuth } = useAuthStore();
  const { setBusinesses, setActiveBusiness } = useBusinessStore();
  const [submitting, setSubmitting] = React.useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { identifier: '', password: '' },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const session = await authService.login(values);
      setAuth(session.user, session.accessToken);
      toast.success('Welcome back, ' + session.user.fullName.split(' ')[0] + '!');
      try {
        const businesses = await businessService.list();
        setBusinesses(businesses);
        if (businesses.length > 0) {
          await businessService.activate(businesses[0]!.id);
          setActiveBusiness(businesses[0]!.id);
          navigate('/dashboard');
        } else {
          navigate('/onboarding/business');
        }
      } catch {
        navigate('/dashboard');
      }
      void queryClient;
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Login failed. Please try again.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to your RetailOS account"
      footer={
        <>
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-accent hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Email or phone" htmlFor="identifier" required error={errors.identifier?.message}>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="identifier" placeholder="you@example.com" className="pl-9" {...register('identifier')} />
          </div>
        </Field>
        <Field label="Password" htmlFor="password" required error={errors.password?.message}>
          <PasswordInput id="password" {...register('password')} placeholder="••••••••" />
        </Field>
        <div className="flex items-center justify-between">
          <Link to="/forgot-password" className="text-sm text-accent hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" variant="accent" size="lg" className="w-full" disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Sign in
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-2 text-muted-foreground">or</span>
        </div>
      </div>

      <Button variant="outline" size="lg" className="w-full" onClick={() => toast.info('Phone OTP login coming soon')}>
        <Phone className="h-4 w-4" /> Continue with phone
      </Button>
    </AuthLayout>
  );
}

import { Eye, EyeOff } from 'lucide-react';
export function PasswordInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = React.useState(false);
  return (
    <div className="relative">
      <Input type={show ? 'text' : 'password'} className="pr-10" {...props} />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        tabIndex={-1}
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
