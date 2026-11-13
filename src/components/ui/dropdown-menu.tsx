import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface DropdownContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  align: 'start' | 'end';
}
const DropdownContext = React.createContext<DropdownContextValue | null>(null);
function useDropdown() {
  const ctx = React.useContext(DropdownContext);
  if (!ctx) throw new Error('Dropdown components must be used within <DropdownMenu>');
  return ctx;
}

interface DropdownMenuProps {
  children: React.ReactNode;
  align?: 'start' | 'end';
}
export function DropdownMenu({ children, align = 'end' }: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false);
  return <DropdownContext.Provider value={{ open, setOpen, align }}>{children}</DropdownContext.Provider>;
}

export function DropdownMenuTrigger({ asChild, children }: { asChild?: boolean; children: React.ReactElement }) {
  const { open, setOpen } = useDropdown();
  const Comp = asChild ? 'span' : 'button';
  return (
    <Comp
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation();
        setOpen(!open);
      }}
      className={asChild ? 'inline-flex' : 'inline-flex items-center'}
    >
      {children}
    </Comp>
  );
}

export function DropdownMenuContent({ className, children, align }: { className?: string; children: React.ReactNode; align?: 'start' | 'end' }) {
  const { open, setOpen, align: ctxAlign } = useDropdown();
  const ref = React.useRef<HTMLDivElement>(null);
  const position = align ?? ctxAlign;
  const [coords, setCoords] = React.useState<{ top: number; left: number } | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const trigger = ref.current?.previousElementSibling as HTMLElement | null;
    if (trigger) {
      const rect = trigger.getBoundingClientRect();
      const menuWidth = 224;
      const left = position === 'end' ? rect.right - menuWidth : rect.left;
      setCoords({ top: rect.bottom + 6, left: Math.max(8, Math.min(left, window.innerWidth - menuWidth - 8)) });
    }
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, setOpen, position]);

  if (!open || !coords) return null;

  return createPortal(
    <div
      ref={ref}
      style={{ top: coords.top, left: coords.left }}
      className={cn('fixed z-50 w-56 overflow-hidden rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg animate-scale-in', className)}
    >
      {children}
    </div>,
    document.body,
  );
}

export function DropdownMenuItem({ className, children, onClick, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { setOpen } = useDropdown();
  return (
    <div
      role="menuitem"
      onClick={(e) => {
        onClick?.(e);
        setOpen(false);
      }}
      className={cn('flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent/10 hover:text-accent focus:bg-accent/10 [&_svg]:size-4', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function DropdownMenuLabel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-2 py-1.5 text-xs font-semibold text-muted-foreground', className)} {...props} />;
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return <div className={cn('my-1 h-px bg-border', className)} />;
}
