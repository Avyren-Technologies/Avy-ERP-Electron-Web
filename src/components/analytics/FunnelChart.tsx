import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

export interface FunnelStage {
  label: string;
  value: number;
  color?: string;
}

interface FunnelChartProps {
  stages: FunnelStage[];
  height?: number;
  title?: string;
}

const defaultFunnelGradients = [
  { from: '#6366f1', to: '#818cf8' },
  { from: '#8b5cf6', to: '#a78bfa' },
  { from: '#06b6d4', to: '#22d3ee' },
  { from: '#10b981', to: '#34d399' },
  { from: '#f59e0b', to: '#fbbf24' },
  { from: '#ec4899', to: '#f472b6' },
  { from: '#14b8a6', to: '#2dd4bf' },
  { from: '#ef4444', to: '#f87171' },
];

export function FunnelChart({ stages, title }: FunnelChartProps) {
  if (stages.length === 0) return null;

  const maxValue = Math.max(...stages.map((s) => s.value));

  return (
    <div className="rounded-2xl border border-neutral-200/60 dark:border-neutral-700/60 bg-white dark:bg-neutral-900 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
      {title && (
        <div className="px-6 pt-5 pb-1">
          <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-100">{title}</h3>
          <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
            {stages.length} stages
          </p>
        </div>
      )}

      <div className="px-6 py-5 space-y-3">
        {stages.map((stage, idx) => {
          const widthPercent = maxValue > 0 ? (stage.value / maxValue) * 100 : 0;
          const conversionRate =
            idx > 0 && stages[idx - 1].value > 0
              ? ((stage.value / stages[idx - 1].value) * 100).toFixed(1)
              : null;
          const gradient = defaultFunnelGradients[idx % defaultFunnelGradients.length];

          return (
            <div key={idx}>
              {/* Conversion arrow */}
              {conversionRate && (
                <div className="flex items-center justify-center gap-1.5 py-1">
                  <ArrowRight className="h-3 w-3 text-neutral-300 dark:text-neutral-600 -rotate-90" />
                  <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500">
                    {conversionRate}% conversion
                  </span>
                </div>
              )}

              <div className="flex items-center gap-4">
                {/* Label */}
                <div className="w-28 flex-shrink-0 text-right">
                  <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                    {stage.label}
                  </span>
                </div>

                {/* Bar */}
                <div className="flex-1 relative">
                  <div
                    className="h-10 rounded-xl flex items-center justify-center transition-all duration-700 ease-out shadow-sm"
                    style={{
                      width: `${Math.max(widthPercent, 8)}%`,
                      marginLeft: 'auto',
                      marginRight: 'auto',
                      background: stage.color
                        ? stage.color
                        : `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`,
                    }}
                  >
                    <span className="text-xs font-bold text-white drop-shadow-sm">
                      {stage.value.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
