import { TrendingUp, TrendingDown, Minus, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface KPICardData {
  key: string;
  label: string;
  value: string | number;
  trend?: number;
  trendDirection?: 'up' | 'down' | 'neutral';
  icon?: LucideIcon;
  drilldownType?: string;
}

interface KPIGridProps {
  kpis: KPICardData[];
  onDrilldown?: (type: string) => void;
}

export function KPIGrid({ kpis, onDrilldown }: KPIGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => {
        const TrendIcon =
          kpi.trendDirection === 'up'
            ? TrendingUp
            : kpi.trendDirection === 'down'
              ? TrendingDown
              : Minus;

        const trendColor =
          kpi.trendDirection === 'up'
            ? 'text-emerald-500'
            : kpi.trendDirection === 'down'
              ? 'text-red-500'
              : 'text-neutral-400';

        const isClickable = !!(kpi.drilldownType && onDrilldown);

        return (
          <button
            key={kpi.key}
            type="button"
            onClick={() => isClickable && onDrilldown?.(kpi.drilldownType!)}
            disabled={!isClickable}
            className={cn(
              'relative overflow-hidden rounded-2xl border border-neutral-200/60 dark:border-neutral-700/60',
              'bg-white/70 dark:bg-neutral-900/70 backdrop-blur-sm',
              'p-5 text-left transition-all duration-200',
              isClickable && 'hover:shadow-lg hover:shadow-indigo-500/5 hover:border-indigo-300 dark:hover:border-indigo-700 cursor-pointer',
              !isClickable && 'cursor-default',
            )}
          >
            {/* Subtle gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-violet-500" />

            <div className="flex items-start justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                {kpi.label}
              </span>
              {kpi.icon && (
                <kpi.icon className="h-4 w-4 text-indigo-400 dark:text-indigo-300 flex-shrink-0" />
              )}
            </div>

            <div className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
              {kpi.value}
            </div>

            {kpi.trend !== undefined && (
              <div className={cn('flex items-center gap-1 mt-2 text-xs font-medium', trendColor)}>
                <TrendIcon className="h-3.5 w-3.5" />
                <span>{Math.abs(kpi.trend).toFixed(1)}%</span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
