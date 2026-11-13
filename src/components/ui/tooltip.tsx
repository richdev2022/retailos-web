import * as React from 'react';
import { cn } from '@/lib/utils';

interface TooltipContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
}
const TooltipContext = React.createContext<TooltipContextValue | null>(null);

export function Tooltip({ children, delay = 200 }: { children: React.ReactNode; delay?: number }) {
  const [open, setOpen] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout>>();
  const show = () => {
    timer.current = setTimeout(() => setOpen(true), delay);
  };
  const hide = () => {
    if (timer.current) clearTimeout(timer.current);
    setOpen(false);
  };
  return (
    <TooltipContext.Provider value={{ open, setOpen }}>
      <span className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
        {children}
      </span>
    </TooltipContext.Provider>
  );
}

export function TooltipTrigger({ children }: { children: React.ReactElement }) {
  return <span className="inline-flex">{children}</span>;
}

export function TooltipContent({ children, className }: { children: React.ReactNode; className?: string }) {
  const ctx = React.useContext(TooltipContext);
  if (!ctx?.open) return null;
  return (
    <span
      role="tooltip"
      className={cn(
        'pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground shadow-md animate-fade-in',
        className,
      )}
    >
      {children}
    </span>
  );
}
