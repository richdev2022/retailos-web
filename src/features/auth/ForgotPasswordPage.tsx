import * as React from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, MailCheck } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { authService } from '@/lib/services';
import { toast } from '@/components/ui/toast';
import { ApiError } from '@/lib/api';

const schema = z.object({ email: z.string().email('Enter a valid email') });
type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      await authService.forgotPassword(values.email);
      setSent(true);
      toast.success('Reset link sent to your email');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to send reset link');
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout
        title="Check your email"
        description="We've sent a password reset link"
        footer={
          <Link to="/login" className="font-medium text-accent hover:underline">Back to sign in</Link>
        }
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
            <MailCheck className="h-7 w-7" />
          </div>
          <p className="text-sm text-muted-foreground">
            If an account exists for that email, you'll receive a reset link shortly.
            The link expires in 30 minutes.
          </p>
          <Button variant="outline" className="w-full" onClick={() => setSent(false)}>
            Try a different email
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot password?"
      description="Enter your email and we'll send you a reset link"
      footer={
        <>
          Remember your password?{' '}
          <Link to="/login" className="font-medium text-accent hover:underline">Sign in</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Email" htmlFor="email" required error={errors.email?.message}>
          <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
        </Field>
        <Button type="submit" variant="accent" size="lg" className="w-full" disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Send reset link
        </Button>
      </form>
    </AuthLayout>
  );
}
