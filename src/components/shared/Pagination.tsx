import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PaginationProps {
  page: number;
  totalPages: number;
  total?: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ page, totalPages, total, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;
  const pages: number[] = [];
  const start = Math.max(1, page - 1);
  const end = Math.min(totalPages, page + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className={cn('flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row', className)}>
      <p className="text-xs text-muted-foreground">
        Page {page} of {totalPages}
        {total !== undefined ? ` · ${total} records` : ''}
      </p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon-sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {start > 1 && (
          <Button variant="ghost" size="sm" onClick={() => onPageChange(1)}>1</Button>
        )}
        {start > 2 && <span className="px-1 text-muted-foreground"><MoreHorizontal className="h-4 w-4" /></span>}
        {pages.map((p) => (
          <Button key={p} variant={p === page ? 'default' : 'ghost'} size="sm" onClick={() => onPageChange(p)}>
            {p}
          </Button>
        ))}
        {end < totalPages - 1 && <span className="px-1 text-muted-foreground"><MoreHorizontal className="h-4 w-4" /></span>}
        {end < totalPages && (
          <Button variant="ghost" size="sm" onClick={() => onPageChange(totalPages)}>{totalPages}</Button>
        )}
        <Button variant="outline" size="icon-sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
