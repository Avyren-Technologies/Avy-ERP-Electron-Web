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
    <div className="rounded-2xl border border-white/20 dark:border-neutral-700/40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl shadow-2xl shadow-black/10 px-5 py-3.5">
      <div className="flex items-center gap-2.5 text-sm">
        <div
          className="w-3 h-3 rounded-full ring-2 ring-white dark:ring-neutral-800"
          style={{ backgroundColor: entry.payload?.fill || entry.color }}
        />
        <span className="text-neutral-500 dark:text-neutral-400 font-medium">
          {entry.name || entry.payload?.label}
        </span>
        <span className="font-bold text-neutral-800 dark:text-neutral-100 ml-auto">
          {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
        </span>
      </div>
    </div>
  );
}

/* Center label for donut chart */
function DonutCenterLabel({ viewBox, total }: { viewBox?: any; total: number }) {
  if (!viewBox) return null;
  const { cx, cy } = viewBox;
  return (
    <g>
      <text x={cx} y={cy - 6} textAnchor="middle" dominantBaseline="central"
        className="fill-neutral-800 dark:fill-neutral-100" fontSize={22} fontWeight={800}>
        {total.toLocaleString()}
      </text>
      <text x={cx} y={cy + 16} textAnchor="middle" dominantBaseline="central"
        className="fill-neutral-400 dark:fill-neutral-500" fontSize={11} fontWeight={600}>
        Total
      </text>
    </g>
  );
}

export function DistributionChart({ distribution, height = 300 }: DistributionChartProps) {
  const { chartType, title } = distribution;
  const items = Array.isArray(distribution.items) ? distribution.items : [];

  const total = items.reduce((sum, item) => sum + (item.value || 0), 0);

  const coloredItems = items.map((item, idx) => ({
    ...item,
    fill: item.color ?? paletteColors[idx % paletteColors.length],
  }));

  const isPie = chartType === 'pie' || chartType === 'donut';
  const isHorizontal = chartType === 'horizontal-bar';

  return (
    <div className="rounded-2xl border border-neutral-200/60 dark:border-neutral-700/60 bg-white dark:bg-neutral-900 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
      {/* Chart header */}
      {title && (
        <div className="px-6 pt-5 pb-1">
          <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-100">
            {title}
          </h3>
          <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
            {isPie ? 'Distribution breakdown' : `${items.length} categories`}
          </p>
        </div>
      )}

      <div className="px-5 pb-3 pt-2">
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
                paddingAngle={3}
                strokeWidth={0}
                label={chartType !== 'donut' ? undefined : false}
              >
                {coloredItems.map((item, idx) => (
                  <Cell key={idx} fill={item.fill} />
                ))}
                {chartType === 'donut' && (
                  <Label content={<DonutCenterLabel total={total} />} position="center" />
                )}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 8, fontWeight: 500 }}
                iconType="circle"
                iconSize={8}
                formatter={(value: string) => (
                  <span className="text-neutral-600 dark:text-neutral-300">{value}</span>
                )}
              />
            </PieChart>
          ) : (
            <BarChart
              data={coloredItems}
              layout={isHorizontal ? 'vertical' : 'horizontal'}
              margin={{ top: 5, right: 10, left: isHorizontal ? 80 : -10, bottom: 5 }}
            >
              <defs>
                {coloredItems.map((item, idx) => (
                  <linearGradient key={`bar-grad-${idx}`} id={`bar-gradient-${idx}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={item.fill} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={item.fill} stopOpacity={0.55} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-neutral-100 dark:text-neutral-800" vertical={false} />
              {isHorizontal ? (
                <>
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#a3a3a3', fontWeight: 500 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: '#a3a3a3', fontWeight: 500 }} axisLine={false} tickLine={false} width={75} />
                </>
              ) : (
                <>
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#a3a3a3', fontWeight: 500 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#a3a3a3', fontWeight: 500 }} axisLine={false} tickLine={false} />
                </>
              )}
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.06)' }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={isHorizontal ? 20 : undefined}>
                {coloredItems.map((item, idx) => (
                  <Cell key={idx} fill={`url(#bar-gradient-${idx})`} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Enhanced legend with percentages for pie/donut */}
      {isPie && total > 0 && (
        <div className="border-t border-neutral-100 dark:border-neutral-800 px-5 py-3">
          <div className="grid grid-cols-2 gap-2">
            {coloredItems.slice(0, 6).map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.fill }} />
                <span className="text-neutral-500 dark:text-neutral-400 truncate flex-1">{item.label}</span>
                <span className="font-bold text-neutral-700 dark:text-neutral-200">
                  {((item.value / total) * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Need Label import for donut center
import { Label } from 'recharts';
