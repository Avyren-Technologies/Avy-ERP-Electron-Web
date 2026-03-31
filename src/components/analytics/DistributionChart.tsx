import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export interface DistributionItem {
  label: string;
  value: number;
  color?: string;
}

export interface Distribution {
  title?: string;
  chartType: 'pie' | 'donut' | 'bar' | 'horizontal-bar';
  items: DistributionItem[];
}

interface DistributionChartProps {
  distribution: Distribution;
  height?: number;
}

const paletteColors = [
  '#6366f1', // indigo-500
  '#8b5cf6', // violet-500
  '#06b6d4', // cyan-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
  '#f97316', // orange-500
  '#64748b', // slate-500
];

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];

  return (
    <div className="rounded-xl border border-neutral-200/60 dark:border-neutral-700/60 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm shadow-lg px-4 py-3">
      <div className="flex items-center gap-2 text-sm">
        <div
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: entry.payload?.fill || entry.color }}
        />
        <span className="text-neutral-600 dark:text-neutral-300">
          {entry.name || entry.payload?.label}:
        </span>
        <span className="font-semibold text-neutral-800 dark:text-neutral-100">
          {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
        </span>
      </div>
    </div>
  );
}

export function DistributionChart({ distribution, height = 300 }: DistributionChartProps) {
  const { chartType, items, title } = distribution;

  const coloredItems = items.map((item, idx) => ({
    ...item,
    fill: item.color ?? paletteColors[idx % paletteColors.length],
  }));

  const isPie = chartType === 'pie' || chartType === 'donut';
  const isHorizontal = chartType === 'horizontal-bar';

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5">
      {title && (
        <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200 mb-4">
          {title}
        </h3>
      )}

      <ResponsiveContainer width="100%" height={height}>
        {isPie ? (
          <PieChart>
            <Pie
              data={coloredItems}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={chartType === 'donut' ? '55%' : 0}
              outerRadius="80%"
              paddingAngle={2}
              strokeWidth={0}
            >
              {coloredItems.map((item, idx) => (
                <Cell key={idx} fill={item.fill} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12 }}
              formatter={(value: string) => (
                <span className="text-neutral-600 dark:text-neutral-300">{value}</span>
              )}
            />
          </PieChart>
        ) : (
          <BarChart
            data={coloredItems}
            layout={isHorizontal ? 'vertical' : 'horizontal'}
            margin={{ top: 5, right: 20, left: isHorizontal ? 80 : 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-neutral-200 dark:text-neutral-800" />
            {isHorizontal ? (
              <>
                <XAxis type="number" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={75} />
              </>
            ) : (
              <>
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              </>
            )}
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {coloredItems.map((item, idx) => (
                <Cell key={idx} fill={item.fill} />
              ))}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
