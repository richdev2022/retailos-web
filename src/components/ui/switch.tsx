import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  onCheckedChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, onCheckedChange, checked, defaultChecked, onChange, ...props }, ref) => {
    const [internal, setInternal] = React.useState(defaultChecked ?? false);
    const isControlled = checked !== undefined;
    const value = isControlled ? checked : internal;
    return (
      <label className={cn('relative inline-flex h-6 w-11 cursor-pointer items-center', className)}>
        <input
          ref={ref}
          type="checkbox"
          role="switch"
          className="peer sr-only"
          checked={value}
          onChange={(e) => {
            if (!isControlled) setInternal(e.target.checked);
            onChange?.(e);
            onCheckedChange?.(e.target.checked);
          }}
          {...props}
        />
        <span className="absolute inset-0 rounded-full bg-input transition-colors peer-checked:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2" />
        <span className="absolute left-0.5 inline-block h-5 w-5 transform rounded-full bg-background shadow-md transition-transform peer-checked:translate-x-5" />
      </label>
    );
  },
);
Switch.displayName = 'Switch';

export { Switch };
