import {
  ResponsiveContainer,
  ScatterChart as RechartsScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';

interface ScatterChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
  xLabel?: string;
  yLabel?: string;
  nameKey?: string;
  height?: number;
  title?: string;
  quadrantLabels?: { topLeft?: string; topRight?: string; bottomLeft?: string; bottomRight?: string };
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="rounded-2xl border border-white/20 dark:border-neutral-700/40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl shadow-2xl shadow-black/10 px-5 py-3.5">
      {point.name && (
        <p className="text-xs font-bold text-neutral-700 dark:text-neutral-200 mb-1.5">
          {point.name}
        </p>
      )}
      {payload.map((entry: any, idx: number) => (
        <div key={idx} className="flex items-center gap-2 text-xs">
          <span className="text-neutral-500 dark:text-neutral-400 font-medium">{entry.name}:</span>
          <span className="font-bold text-neutral-800 dark:text-neutral-100">
            {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ScatterChart({
  data,
  xKey,
  yKey,
  xLabel,
  yLabel,
  height = 320,
  title,
  quadrantLabels,
}: ScatterChartProps) {
  // Calculate midpoints for quadrant lines
  const xValues = data.map((d) => Number(d[xKey]) || 0);
  const yValues = data.map((d) => Number(d[yKey]) || 0);
  const xMid = xValues.length ? (Math.min(...xValues) + Math.max(...xValues)) / 2 : 50;
  const yMid = yValues.length ? (Math.min(...yValues) + Math.max(...yValues)) / 2 : 50;

  return (
    <div className="rounded-2xl border border-neutral-200/60 dark:border-neutral-700/60 bg-white dark:bg-neutral-900 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden relative">
      {/* Chart header */}
      {title && (
        <div className="px-6 pt-5 pb-1">
          <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-100">{title}</h3>
          <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
            Scatter distribution
          </p>
        </div>
      )}

      {/* Quadrant Labels */}
      {quadrantLabels && (
        <div className="absolute inset-0 pointer-events-none z-0 m-5" style={{ top: title ? 60 : 20 }}>
          <div className="relative w-full h-full">
            {quadrantLabels.topLeft && (
              <span className="absolute top-4 left-16 text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-100/80 dark:bg-neutral-800/80 text-neutral-400 dark:text-neutral-500">
                {quadrantLabels.topLeft}
              </span>
            )}
            {quadrantLabels.topRight && (
              <span className="absolute top-4 right-8 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50/80 dark:bg-emerald-900/20 text-emerald-500 dark:text-emerald-400">
                {quadrantLabels.topRight}
              </span>
            )}
            {quadrantLabels.bottomLeft && (
              <span className="absolute bottom-12 left-16 text-[10px] font-bold px-2 py-0.5 rounded bg-red-50/80 dark:bg-red-900/20 text-red-400 dark:text-red-400">
                {quadrantLabels.bottomLeft}
              </span>
            )}
            {quadrantLabels.bottomRight && (
              <span className="absolute bottom-12 right-8 text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-100/80 dark:bg-neutral-800/80 text-neutral-400 dark:text-neutral-500">
                {quadrantLabels.bottomRight}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="px-5 pb-5 pt-2">
        <ResponsiveContainer width="100%" height={height}>
          <RechartsScatterChart margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-neutral-100 dark:text-neutral-800" />
            <XAxis
              dataKey={xKey}
              type="number"
              name={xLabel ?? xKey}
              tick={{ fontSize: 11, fill: '#a3a3a3', fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              label={xLabel ? { value: xLabel, position: 'insideBottom', offset: -5, fontSize: 11, fill: '#a3a3a3', fontWeight: 600 } : undefined}
            />
            <YAxis
              dataKey={yKey}
              type="number"
              name={yLabel ?? yKey}
              tick={{ fontSize: 11, fill: '#a3a3a3', fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft', fontSize: 11, fill: '#a3a3a3', fontWeight: 600 } : undefined}
            />
            {quadrantLabels && (
              <>
                <ReferenceLine x={xMid} stroke="#e5e5e5" strokeDasharray="6 4" strokeWidth={1.5} />
                <ReferenceLine y={yMid} stroke="#e5e5e5" strokeDasharray="6 4" strokeWidth={1.5} />
              </>
            )}
            <Tooltip content={<CustomTooltip />} />
            <Scatter
              data={data}
              fill="#6366f1"
              fillOpacity={0.75}
              strokeWidth={1.5}
              stroke="#4f46e5"
            />
          </RechartsScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
