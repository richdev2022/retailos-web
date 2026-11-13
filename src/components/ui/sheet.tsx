import * as React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

interface SheetContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side: 'top' | 'bottom' | 'left' | 'right';
}
const SheetContext = React.createContext<SheetContextValue | null>(null);
function useSheet() {
  const ctx = React.useContext(SheetContext);
  if (!ctx) throw new Error('Sheet components must be used within <Sheet>');
  return ctx;
}

const sheetVariants = cva('fixed z-50 gap-4 bg-card p-6 shadow-xl transition-transform duration-300 ease-out', {
  variants: {
    side: {
      top: 'inset-x-0 top-0 border-b border-border rounded-b-xl',
      bottom: 'inset-x-0 bottom-0 border-t border-border rounded-t-xl',
      left: 'inset-y-0 left-0 h-full w-full max-w-sm border-r border-border',
      right: 'inset-y-0 right-0 h-full w-full max-w-md border-l border-border',
    },
  },
  defaultVariants: { side: 'right' },
});

interface SheetProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export function Sheet({ open: controlled, defaultOpen = false, onOpenChange, children, side = 'right' }: SheetProps) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultOpen);
  const open = controlled ?? uncontrolled;
  const handle = React.useCallback(
    (next: boolean) => {
      if (controlled === undefined) setUncontrolled(next);
      onOpenChange?.(next);
    },
    [controlled, onOpenChange],
  );
  return <SheetContext.Provider value={{ open, onOpenChange: handle, side }}>{children}</SheetContext.Provider>;
}

export function SheetTrigger({ asChild, children }: { asChild?: boolean; children: React.ReactElement }) {
  const { onOpenChange, open } = useSheet();
  const Comp = asChild ? 'span' : 'button';
  return (
    <Comp onClick={() => onOpenChange(!open)} className={asChild ? 'inline-flex' : 'inline-flex'}>
      {children}
    </Comp>
  );
}

export function SheetContent({ className, children, showClose = true, side }: { className?: string; children: React.ReactNode; showClose?: boolean; side?: 'top' | 'bottom' | 'left' | 'right' }) {
  const { open, onOpenChange, side: ctxSide } = useSheet();
  const resolvedSide = side ?? ctxSide;
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onOpenChange(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  const translate =
    resolvedSide === 'right'
      ? open ? 'translate-x-0' : 'translate-x-full'
      : resolvedSide === 'left'
        ? open ? 'translate-x-0' : '-translate-x-full'
        : resolvedSide === 'top'
          ? open ? 'translate-y-0' : '-translate-y-full'
          : open ? 'translate-y-0' : 'translate-y-full';

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => onOpenChange(false)} />
      <div className={cn(sheetVariants({ side: resolvedSide }), translate, 'overflow-y-auto scrollbar-thin', className)}>
        {showClose && (
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground opacity-70 transition-opacity hover:bg-muted hover:opacity-100"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4 flex flex-col space-y-1.5 pr-6', className)} {...props} />;
}
export function SheetTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('font-heading text-lg font-semibold tracking-tight', className)} {...props} />;
}
export function SheetDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />;
}
export function SheetFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)} {...props} />;
}
