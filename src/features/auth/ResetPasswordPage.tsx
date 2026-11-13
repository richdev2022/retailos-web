import * as React from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { authService } from '@/lib/services';
import { toast } from '@/components/ui/toast';
import { ApiError } from '@/lib/api';
import { PasswordInput } from './LoginPage';

const schema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });
type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') ?? '';
  const [submitting, setSubmitting] = React.useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    if (!token) {
      toast.error('Invalid or missing reset token');
      return;
    }
    setSubmitting(true);
    try {
      await authService.resetPassword(token, values.password);
      toast.success('Password reset successfully. Please sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to reset password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Set a new password"
      description="Choose a strong password for your account"
      footer={
        <Link to="/login" className="font-medium text-accent hover:underline">Back to sign in</Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="New password" htmlFor="password" required error={errors.password?.message}>
          <PasswordInput id="password" placeholder="At least 8 characters" {...register('password')} />
        </Field>
        <Field label="Confirm password" htmlFor="confirmPassword" required error={errors.confirmPassword?.message}>
          <PasswordInput id="confirmPassword" placeholder="Re-enter password" {...register('confirmPassword')} />
        </Field>
        <Button type="submit" variant="accent" size="lg" className="w-full" disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Reset password
        </Button>
      </form>
    </AuthLayout>
  );
}
