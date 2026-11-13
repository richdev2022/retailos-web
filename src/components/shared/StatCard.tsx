import * as React from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  trend?: { value: number; positive?: boolean };
  hint?: string;
  loading?: boolean;
  accent?: 'accent' | 'success' | 'warning' | 'destructive' | 'primary';
  className?: string;
}

const accentMap = {
  accent: 'bg-accent/10 text-accent',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/15 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
  primary: 'bg-primary/10 text-primary',
};

export function StatCard({ label, value, icon, trend, hint, loading, accent = 'accent', className }: StatCardProps) {
  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="h-7 w-24" />
          ) : (
            <p className="font-heading text-2xl font-semibold tracking-tight text-foreground">{value}</p>
          )}
          {(trend || hint) && (
            <div className="flex items-center gap-1.5 text-xs">
              {trend && (
                <span
                  className={cn(
                    'inline-flex items-center gap-0.5 font-medium',
                    trend.positive ? 'text-success' : 'text-destructive',
                  )}
                >
                  {trend.positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {Math.abs(trend.value)}%
                </span>
              )}
              {hint && <span className="text-muted-foreground">{hint}</span>}
            </div>
          )}
        </div>
        {icon && (
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', accentMap[accent])}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
