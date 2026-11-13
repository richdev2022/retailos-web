import * as React from 'react';
import {
  Area,
  AreaChart as ReAreaChart,
  Bar,
  BarChart as ReBarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart as ReLineChart,
  Pie,
  PieChart as RePieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { cn } from '@/lib/utils';

const CHART_COLORS = ['#10B981', '#0EA5E9', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

function useAxisStyle() {
  const [isDark, setIsDark] = React.useState(false);
  React.useEffect(() => {
    const obs = new MutationObserver(() => setIsDark(document.documentElement.classList.contains('dark')));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    setIsDark(document.documentElement.classList.contains('dark'));
    return () => obs.disconnect();
  }, []);
  const tick = isDark ? '#94a3b8' : '#64748b';
  const grid = isDark ? '#1e293b' : '#e2e8f0';
  return { tick, grid };
}

function ChartTooltip({ active, payload, label, formatter }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      {label && <p className="mb-1 font-medium text-foreground">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} className="flex items-center gap-2 text-muted-foreground">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="capitalize">{p.name}:</span>
          <span className="font-medium text-foreground">{formatter ? formatter(p.value, p.name) : p.value}</span>
        </p>
      ))}
    </div>
  );
}

interface LineChartProps {
  data: Array<Record<string, unknown>>;
  xKey: string;
  series: Array<{ key: string; name?: string; color?: string }>;
  height?: number;
  valueFormatter?: (v: number, name?: string) => string;
  className?: string;
}

export function LineChart({ data, xKey, series, height = 280, valueFormatter, className }: LineChartProps) {
  const { tick, grid } = useAxisStyle();
  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ReLineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
          <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: tick }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11, fill: tick }} tickLine={false} axisLine={false} width={48} />
          <Tooltip content={<ChartTooltip formatter={valueFormatter} />} />
          {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
          {series.map((s, i) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name ?? s.key}
              stroke={s.color ?? CHART_COLORS[i % CHART_COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </ReLineChart>
      </ResponsiveContainer>
    </div>
  );
}

interface AreaChartProps extends LineChartProps {}

export function AreaChart({ data, xKey, series, height = 280, valueFormatter, className }: AreaChartProps) {
  const { tick, grid } = useAxisStyle();
  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ReAreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            {series.map((s, i) => (
              <linearGradient key={s.key} id={`area-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={s.color ?? CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.3} />
                <stop offset="95%" stopColor={s.color ?? CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
          <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: tick }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11, fill: tick }} tickLine={false} axisLine={false} width={48} />
          <Tooltip content={<ChartTooltip formatter={valueFormatter} />} />
          {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
          {series.map((s, i) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name ?? s.key}
              stroke={s.color ?? CHART_COLORS[i % CHART_COLORS.length]}
              fill={`url(#area-${s.key})`}
              strokeWidth={2}
            />
          ))}
        </ReAreaChart>
      </ResponsiveContainer>
    </div>
  );
}

interface BarChartProps {
  data: Array<Record<string, unknown>>;
  xKey: string;
  series: Array<{ key: string; name?: string; color?: string }>;
  height?: number;
  valueFormatter?: (v: number, name?: string) => string;
  className?: string;
  layout?: 'horizontal' | 'vertical';
}

export function BarChart({ data, xKey, series, height = 280, valueFormatter, className, layout = 'horizontal' }: BarChartProps) {
  const { tick, grid } = useAxisStyle();
  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ReBarChart data={data} layout={layout} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={layout === 'vertical'} horizontal={layout === 'horizontal'} />
          {layout === 'horizontal' ? (
            <>
              <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: tick }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: tick }} tickLine={false} axisLine={false} width={48} />
            </>
          ) : (
            <>
              <XAxis type="number" tick={{ fontSize: 11, fill: tick }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey={xKey} tick={{ fontSize: 11, fill: tick }} tickLine={false} axisLine={false} width={120} />
            </>
          )}
          <Tooltip content={<ChartTooltip formatter={valueFormatter} />} cursor={{ fill: 'rgba(148,163,184,0.08)' }} />
          {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
          {series.map((s, i) => (
            <Bar key={s.key} dataKey={s.key} name={s.name ?? s.key} fill={s.color ?? CHART_COLORS[i % CHART_COLORS.length]} radius={[6, 6, 0, 0]} maxBarSize={48} />
          ))}
        </ReBarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface PieChartProps {
  data: Array<{ name: string; value: number; color?: string }>;
  height?: number;
  valueFormatter?: (v: number, name?: string) => string;
  className?: string;
  donut?: boolean;
}

export function PieChart({ data, height = 280, valueFormatter, className, donut = true }: PieChartProps) {
  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RePieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={donut ? 60 : 0}
            outerRadius={90}
            paddingAngle={2}
          >
            {data.map((d, i) => (
              <Cell key={i} fill={d.color ?? CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip formatter={valueFormatter} />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </RePieChart>
      </ResponsiveContainer>
    </div>
  );
}
