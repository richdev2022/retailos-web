import * as React from 'react';
import { cn } from '@/lib/utils';

/** Field wrapper with label, error message and helper text. */
interface FieldProps {
  label?: string;
  htmlFor?: string;
  error?: string;
  helper?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Field({ label, htmlFor, error, helper, required, className, children }: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-sm font-medium leading-none text-foreground">
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs font-medium text-destructive">{error}</p>
      ) : helper ? (
        <p className="text-xs text-muted-foreground">{helper}</p>
      ) : null}
    </div>
  );
}
