import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, checked, defaultChecked, onChange, ...props }, ref) => {
    const [internal, setInternal] = React.useState(defaultChecked ?? false);
    const isControlled = checked !== undefined;
    const value = isControlled ? checked : internal;
    return (
      <span className={cn('relative inline-flex h-4 w-4 shrink-0 items-center justify-center', className)}>
        <input
          ref={ref}
          type="checkbox"
          className="peer absolute inset-0 m-0 cursor-pointer appearance-none rounded border border-input bg-background shadow-sm checked:border-accent checked:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
          checked={value}
          onChange={(e) => {
            if (!isControlled) setInternal(e.target.checked);
            onChange?.(e);
            onCheckedChange?.(e.target.checked);
          }}
          {...props}
        />
        {value && (
          <Check className="pointer-events-none absolute h-3 w-3 text-accent-foreground" strokeWidth={3} />
        )}
      </span>
    );
  },
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
