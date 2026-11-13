import * as React from 'react';
import { Loader2, Search } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from './EmptyState';
import { Pagination } from './Pagination';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  align?: 'left' | 'right' | 'center';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: React.ReactNode;
  searchable?: boolean;
  searchValue?: string;
  onSearch?: (v: string) => void;
  searchPlaceholder?: string;
  page?: number;
  totalPages?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onRowClick?: (row: T) => void;
  rowKey: (row: T) => string;
  toolbar?: React.ReactNode;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  loading,
  emptyTitle = 'No records found',
  emptyDescription = 'Records will appear here once available.',
  emptyIcon,
  searchable,
  searchValue,
  onSearch,
  searchPlaceholder = 'Search...',
  page,
  totalPages,
  total,
  onPageChange,
  onRowClick,
  rowKey,
  toolbar,
  className,
}: DataTableProps<T>) {
  const alignClass = (a?: 'left' | 'right' | 'center') =>
    a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left';

  return (
    <div className={cn('overflow-hidden rounded-xl border border-border bg-card', className)}>
      {(searchable || toolbar) && (
        <div className="flex flex-col gap-2 border-b border-border p-3 sm:flex-row sm:items-center sm:justify-between">
          {searchable ? (
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchValue ?? ''}
                onChange={(e) => onSearch?.(e.target.value)}
                placeholder={searchPlaceholder}
                className="pl-9"
              />
            </div>
          ) : (
            <div />
          )}
          {toolbar && <div className="flex items-center gap-2">{toolbar}</div>}
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key} className={cn(col.headerClassName, alignClass(col.align))}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <TableRow key={i}>
                {columns.map((col) => (
                  <TableCell key={col.key} className={alignClass(col.align)}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="py-0">
                <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} className="border-0" />
              </TableCell>
            </TableRow>
          ) : (
            data.map((row) => (
              <TableRow
                key={rowKey(row)}
                onClick={() => onRowClick?.(row)}
                className={cn(onRowClick && 'cursor-pointer')}
              >
                {columns.map((col) => (
                  <TableCell key={col.key} className={cn(col.className, alignClass(col.align))}>
                    {col.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {loading && (
        <div className="flex items-center justify-center gap-2 border-t border-border py-3 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" /> Loading...
        </div>
      )}
      {page && totalPages && onPageChange && (
        <Pagination page={page} totalPages={totalPages} total={total} onPageChange={onPageChange} />
      )}
    </div>
  );
}
