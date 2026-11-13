import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center', className)}>
      {icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <h3 className="font-heading text-base font-semibold text-foreground">{title}</h3>
        {description && <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <Button onClick={action.onClick} variant="accent" size="sm">{action.label}</Button>}
    </div>
  );
}
