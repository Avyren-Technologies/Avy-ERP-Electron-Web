import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export interface TrendSeries {
  key: string;
  name: string;
  color?: string;
  type?: 'line' | 'area';
}

/** An API trend object that carries its own data points. */
interface ApiTrendSeries {
  key: string;
  label: string;
  data: { date: string; value: number }[];
  chartType?: string;
}

interface TrendChartProps {
  /** Explicit data rows. If omitted, derived from series when they carry `data` (API trend objects). */
  data?: Record<string, unknown>[];
  series: (TrendSeries | ApiTrendSeries)[];
  xKey?: string;
  height?: number;
  title?: string;
}

const defaultColors = [
  '#6366f1', // indigo-500
  '#8b5cf6', // violet-500
  '#06b6d4', // cyan-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-2xl border border-white/20 dark:border-neutral-700/40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl shadow-2xl shadow-black/10 px-5 py-4 min-w-[160px]">
      <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2">
        {label}
      </p>
      <div className="space-y-1.5">
        {payload.map((entry: any, idx: number) => (
          <div key={idx} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-neutral-800"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                {entry.name}
              </span>
            </div>
            <span className="text-sm font-bold text-neutral-800 dark:text-neutral-100">
              {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TrendChart({ data: dataProp, series: rawSeries, xKey = 'period', height = 320, title }: TrendChartProps) {
  // Normalise series: API trend objects carry { label, data[] }, convert to TrendSeries
  const series: TrendSeries[] = rawSeries.map((s) => ({
    key: s.key,
    name: 'name' in s ? s.name : (s as ApiTrendSeries).label,
    color: 'color' in s ? (s as TrendSeries).color : undefined,
    type: 'type' in s && ((s as any).type === 'line' || (s as any).type === 'area') ? (s as TrendSeries).type : undefined,
  }));

  // Derive data from API trend objects if not explicitly provided
  const data: Record<string, unknown>[] = dataProp ?? (() => {
    const apiSeries = rawSeries.filter((s): s is ApiTrendSeries => 'data' in s && Array.isArray((s as any).data));
    if (apiSeries.length === 0) return [];
    // Merge all series data by date
    const byDate = new Map<string, Record<string, unknown>>();
    for (const s of apiSeries) {
      for (const point of s.data) {
        const existing = byDate.get(point.date) ?? { [xKey]: point.date };
        existing[s.key] = point.value;
        byDate.set(point.date, existing);
      }
    }
    return Array.from(byDate.values());
  })();

  const hasArea = series.some((s) => s.type === 'area');
  const ChartComponent = hasArea ? AreaChart : LineChart;

  // Derive title from first series if not explicitly provided
  const chartTitle = title ?? (series.length === 1 ? series[0].name : undefined);

  return (
    <div className="rounded-2xl border border-neutral-200/60 dark:border-neutral-700/60 bg-white dark:bg-neutral-900 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
      {/* Chart header */}
      {chartTitle && (
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <div>
            <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-100">
              {chartTitle}
            </h3>
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
              Showing trend over time
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </div>
        </div>
      )}

      <div className="px-5 pb-5 pt-2">
        <ResponsiveContainer width="100%" height={height}>
          <ChartComponent data={data} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
            <defs>
              {series.map((s, idx) => {
                const color = s.color ?? defaultColors[idx % defaultColors.length];
                return (
                  <linearGradient key={s.key} id={`gradient-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={color} stopOpacity={0.01} />
                  </linearGradient>
                );
              })}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-neutral-100 dark:text-neutral-800" vertical={false} />
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 11, fill: '#a3a3a3', fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              dy={8}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#a3a3a3', fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              dx={-4}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 16, fontWeight: 600 }}
              iconType="circle"
              iconSize={8}
            />
            {series.map((s, idx) => {
              const color = s.color ?? defaultColors[idx % defaultColors.length];
              if (s.type === 'area') {
                return (
                  <Area
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    name={s.name}
                    stroke={color}
                    strokeWidth={2.5}
                    fill={`url(#gradient-${s.key})`}
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 2, fill: '#fff', stroke: color }}
                  />
                );
              }
              return (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.name}
                  stroke={color}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2, fill: '#fff', stroke: color }}
                />
              );
            })}
          </ChartComponent>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
