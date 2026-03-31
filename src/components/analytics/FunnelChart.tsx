import { cn } from '@/lib/utils';

export interface FunnelStage {
  label: string;
  value: number;
  color?: string;
}

interface FunnelChartProps {
  stages: FunnelStage[];
  height?: number;
}

const defaultFunnelColors = [
  'bg-indigo-500',
  'bg-indigo-400',
  'bg-violet-500',
  'bg-violet-400',
  'bg-cyan-500',
  'bg-cyan-400',
  'bg-emerald-500',
  'bg-emerald-400',
];

export function FunnelChart({ stages }: FunnelChartProps) {
  if (stages.length === 0) return null;

  const maxValue = Math.max(...stages.map((s) => s.value));

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5">
      <div className="space-y-2">
        {stages.map((stage, idx) => {
          const widthPercent = maxValue > 0 ? (stage.value / maxValue) * 100 : 0;
          const conversionRate =
            idx > 0 && stages[idx - 1].value > 0
              ? ((stage.value / stages[idx - 1].value) * 100).toFixed(1)
              : null;

          return (
            <div key={idx} className="flex items-center gap-3">
              {/* Label */}
              <div className="w-28 flex-shrink-0 text-right">
                <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                  {stage.label}
                </span>
              </div>

              {/* Bar */}
              <div className="flex-1 relative">
                <div
                  className={cn(
                    'h-9 rounded-lg transition-all duration-500 flex items-center justify-center',
                    stage.color ?? defaultFunnelColors[idx % defaultFunnelColors.length],
                  )}
                  style={{
                    width: `${Math.max(widthPercent, 8)}%`,
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    ...(stage.color ? { backgroundColor: stage.color } : {}),
                  }}
                >
                  <span className="text-xs font-bold text-white drop-shadow-sm">
                    {stage.value.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Conversion rate */}
              <div className="w-14 flex-shrink-0">
                {conversionRate && (
                  <span className="text-[10px] font-medium text-neutral-400">
                    {conversionRate}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
