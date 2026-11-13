import * as React from 'react';
import { format, subDays } from 'date-fns';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface DateRange {
  from: string;
  to: string;
}

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (v: DateRange) => void;
  className?: string;
}

const presets: Array<{ label: string; value: string; days: number }> = [
  { label: 'Today', value: 'today', days: 0 },
  { label: 'Last 7 days', value: '7d', days: 7 },
  { label: 'Last 14 days', value: '14d', days: 14 },
  { label: 'Last 30 days', value: '30d', days: 30 },
  { label: 'Last 90 days', value: '90d', days: 90 },
];

export function DateRangeFilter({ value, onChange, className }: DateRangeFilterProps) {
  const [preset, setPreset] = React.useState('30d');

  const applyPreset = (val: string) => {
    setPreset(val);
    const p = presets.find((x) => x.value === val);
    if (!p) return;
    const to = new Date();
    const from = subDays(to, p.days);
    onChange({ from: from.toISOString(), to: to.toISOString() });
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <div className="relative">
        <Select value={preset} onValueChange={applyPreset}>
          <SelectTrigger className="h-9 w-[150px] pr-8 text-xs">
            <Calendar className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
            {presets.find((p) => p.value === preset)?.label ?? 'Custom'}
          </SelectTrigger>
          {presets.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              {p.label}
            </SelectItem>
          ))}
        </Select>
      </div>
      <Input
        type="date"
        value={value.from ? value.from.slice(0, 10) : ''}
        onChange={(e) => {
          setPreset('custom');
          onChange({ ...value, from: e.target.value ? new Date(e.target.value).toISOString() : value.from });
        }}
        className="h-9 w-[140px] text-xs"
        aria-label="From date"
      />
      <span className="text-xs text-muted-foreground">to</span>
      <Input
        type="date"
        value={value.to ? value.to.slice(0, 10) : format(new Date(), 'yyyy-MM-dd')}
        onChange={(e) => {
          setPreset('custom');
          onChange({ ...value, to: e.target.value ? new Date(e.target.value).toISOString() : value.to });
        }}
        className="h-9 w-[140px] text-xs"
        aria-label="To date"
      />
      <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => applyPreset('30d')}>
        Reset
      </Button>
    </div>
  );
}
