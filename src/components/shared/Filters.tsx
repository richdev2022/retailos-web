import * as React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FiltersProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  onApply?: () => void;
  onReset?: () => void;
}

export function Filters({ children, defaultOpen = true, className, onApply, onReset }: FiltersProps) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className={cn('rounded-xl border border-border bg-card', className)}>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-foreground"
      >
        <span className="inline-flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          Filters
        </span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && (
        <div className="flex flex-wrap items-end gap-3 border-t border-border px-4 py-4 animate-fade-in">
          {children}
          {(onApply || onReset) && (
            <div className="ml-auto flex items-center gap-2">
              {onReset && (
                <Button variant="ghost" size="sm" onClick={onReset}>
                  Reset
                </Button>
              )}
              {onApply && (
                <Button variant="accent" size="sm" onClick={onApply}>
                  Apply
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
