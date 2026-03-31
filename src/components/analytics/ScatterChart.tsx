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
  quadrantLabels?: { topLeft?: string; topRight?: string; bottomLeft?: string; bottomRight?: string };
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="rounded-xl border border-neutral-200/60 dark:border-neutral-700/60 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm shadow-lg px-4 py-3">
      {point.name && (
        <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-200 mb-1">
          {point.name}
        </p>
      )}
      {payload.map((entry: any, idx: number) => (
        <div key={idx} className="flex items-center gap-2 text-xs">
          <span className="text-neutral-500 dark:text-neutral-400">{entry.name}:</span>
          <span className="font-semibold text-neutral-800 dark:text-neutral-100">
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
  quadrantLabels,
}: ScatterChartProps) {
  // Calculate midpoints for quadrant lines
  const xValues = data.map((d) => Number(d[xKey]) || 0);
  const yValues = data.map((d) => Number(d[yKey]) || 0);
  const xMid = xValues.length ? (Math.min(...xValues) + Math.max(...xValues)) / 2 : 50;
  const yMid = yValues.length ? (Math.min(...yValues) + Math.max(...yValues)) / 2 : 50;

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5 relative">
      {/* Quadrant Labels */}
      {quadrantLabels && (
        <div className="absolute inset-0 pointer-events-none z-0 m-5">
          <div className="relative w-full h-full">
            {quadrantLabels.topLeft && (
              <span className="absolute top-8 left-16 text-[10px] font-medium text-neutral-300 dark:text-neutral-600">
                {quadrantLabels.topLeft}
              </span>
            )}
            {quadrantLabels.topRight && (
              <span className="absolute top-8 right-8 text-[10px] font-medium text-neutral-300 dark:text-neutral-600">
                {quadrantLabels.topRight}
              </span>
            )}
            {quadrantLabels.bottomLeft && (
              <span className="absolute bottom-8 left-16 text-[10px] font-medium text-neutral-300 dark:text-neutral-600">
                {quadrantLabels.bottomLeft}
              </span>
            )}
            {quadrantLabels.bottomRight && (
              <span className="absolute bottom-8 right-8 text-[10px] font-medium text-neutral-300 dark:text-neutral-600">
                {quadrantLabels.bottomRight}
              </span>
            )}
          </div>
        </div>
      )}

      <ResponsiveContainer width="100%" height={height}>
        <RechartsScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-neutral-200 dark:text-neutral-800" />
          <XAxis
            dataKey={xKey}
            type="number"
            name={xLabel ?? xKey}
            tick={{ fontSize: 12, fill: '#94a3b8' }}
            axisLine={{ stroke: '#e2e8f0' }}
            tickLine={false}
            label={xLabel ? { value: xLabel, position: 'insideBottom', offset: -5, fontSize: 11, fill: '#94a3b8' } : undefined}
          />
          <YAxis
            dataKey={yKey}
            type="number"
            name={yLabel ?? yKey}
            tick={{ fontSize: 12, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft', fontSize: 11, fill: '#94a3b8' } : undefined}
          />
          {quadrantLabels && (
            <>
              <ReferenceLine x={xMid} stroke="#cbd5e1" strokeDasharray="4 4" />
              <ReferenceLine y={yMid} stroke="#cbd5e1" strokeDasharray="4 4" />
            </>
          )}
          <Tooltip content={<CustomTooltip />} />
          <Scatter
            data={data}
            fill="#6366f1"
            fillOpacity={0.7}
            strokeWidth={1}
            stroke="#4f46e5"
          />
        </RechartsScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
