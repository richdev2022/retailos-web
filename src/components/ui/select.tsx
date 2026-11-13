import * as React from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectContextValue {
  value: string;
  setValue: (v: string) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
  labelMap: React.MutableRefObject<Record<string, string>>;
}
const SelectContext = React.createContext<SelectContextValue | null>(null);
function useSelect() {
  const ctx = React.useContext(SelectContext);
  if (!ctx) throw new Error('Select components must be used within <Select>');
  return ctx;
}

interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (v: string) => void;
  children: React.ReactNode;
}
export function Select({ value, defaultValue = '', onValueChange, children }: SelectProps) {
  const [internal, setInternal] = React.useState(defaultValue);
  const current = value ?? internal;
  const [open, setOpen] = React.useState(false);
  const labelMap = React.useRef<Record<string, string>>({});
  const setValue = React.useCallback(
    (v: string) => {
      if (value === undefined) setInternal(v);
      onValueChange?.(v);
    },
    [value, onValueChange],
  );
  return <SelectContext.Provider value={{ value: current, setValue, open, setOpen, labelMap }}>{children}</SelectContext.Provider>;
}

export function SelectTrigger({ className, children, id }: { className?: string; children: React.ReactNode; id?: string }) {
  const { open, setOpen, value, labelMap } = useSelect();
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = React.useState<{ top: number; left: number; width: number } | null>(null);

  React.useEffect(() => {
    if (!open) return;
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
    const onClick = (e: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, setOpen]);

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
      >
        <span className={cn('truncate', !value && 'text-muted-foreground')}>
          {value ? (labelMap.current[value] ?? value) : children}
        </span>
        <ChevronDown className={cn('h-4 w-4 opacity-50 transition-transform', open && 'rotate-180')} />
      </button>
      {open && coords && (
        <div
          className="fixed z-50 max-h-60 overflow-y-auto scrollbar-thin rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg animate-scale-in"
          style={{ top: coords.top, left: coords.left, width: coords.width }}
        >
          {children}
        </div>
      )}
    </>
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  return <span className="text-muted-foreground">{placeholder}</span>;
}

export function SelectItem({ value, children }: { value: string; children: React.ReactNode }) {
  const { value: current, setValue, setOpen, labelMap } = useSelect();
  React.useEffect(() => {
    labelMap.current[value] = typeof children === 'string' ? children : value;
  }, [value, children, labelMap]);
  const active = current === value;
  return (
    <div
      role="option"
      aria-selected={active}
      onClick={() => {
        setValue(value);
        setOpen(false);
      }}
      className={cn('relative flex w-full cursor-pointer select-none items-center rounded-md py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent/10 hover:text-accent', active && 'bg-accent/5 text-accent')}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {active && <Check className="h-3.5 w-3.5" />}
      </span>
      {children}
    </div>
  );
}
