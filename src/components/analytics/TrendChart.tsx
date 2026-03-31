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
    <div className="rounded-xl border border-neutral-200/60 dark:border-neutral-700/60 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm shadow-lg px-4 py-3">
      <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">
        {label}
      </p>
      {payload.map((entry: any, idx: number) => (
        <div key={idx} className="flex items-center gap-2 text-sm">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-neutral-600 dark:text-neutral-300">{entry.name}:</span>
          <span className="font-semibold text-neutral-800 dark:text-neutral-100">
            {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function TrendChart({ data: dataProp, series: rawSeries, xKey = 'period', height = 320 }: TrendChartProps) {
  // Normalise series: API trend objects carry { label, data[] }, convert to TrendSeries
  const series: TrendSeries[] = rawSeries.map((s) => ({
    key: s.key,
    name: 'name' in s ? s.name : (s as ApiTrendSeries).label,
    color: 'color' in s ? (s as TrendSeries).color : undefined,
    type: 'type' in s && (s as any).type !== 'line' && (s as any).type !== 'area' ? undefined : (s as TrendSeries).type,
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

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5">
      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <defs>
            {series.map((s, idx) => {
              const color = s.color ?? defaultColors[idx % defaultColors.length];
              return (
                <linearGradient key={s.key} id={`gradient-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              );
            })}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-neutral-200 dark:text-neutral-800" />
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: 12, fill: '#94a3b8' }}
            axisLine={{ stroke: '#e2e8f0' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
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
                  strokeWidth={2}
                  fill={`url(#gradient-${s.key})`}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2 }}
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
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2 }}
              />
            );
          })}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
}
