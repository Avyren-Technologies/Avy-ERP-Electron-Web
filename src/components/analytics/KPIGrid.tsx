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
  gridClassName?: string;
}

/* ── Unique pastel palettes that rotate per card ── */
const CARD_PALETTES = [
  {
    bg: 'bg-blue-50/70 dark:bg-blue-950/20',
    border: 'border-blue-100/60 dark:border-blue-900/40',
    hoverBorder: 'hover:border-blue-300 dark:hover:border-blue-700',
    hoverShadow: 'hover:shadow-blue-500/8',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-500 dark:text-blue-400',
    accent: 'from-blue-500 to-blue-400',
    wave: '#3B82F6',
  },
  {
    bg: 'bg-violet-50/70 dark:bg-violet-950/20',
    border: 'border-violet-100/60 dark:border-violet-900/40',
    hoverBorder: 'hover:border-violet-300 dark:hover:border-violet-700',
    hoverShadow: 'hover:shadow-violet-500/8',
    iconBg: 'bg-violet-100 dark:bg-violet-900/30',
    iconColor: 'text-violet-500 dark:text-violet-400',
    accent: 'from-violet-500 to-violet-400',
    wave: '#8B5CF6',
  },
  {
    bg: 'bg-amber-50/70 dark:bg-amber-950/20',
    border: 'border-amber-100/60 dark:border-amber-900/40',
    hoverBorder: 'hover:border-amber-300 dark:hover:border-amber-700',
    hoverShadow: 'hover:shadow-amber-500/8',
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    iconColor: 'text-amber-500 dark:text-amber-400',
    accent: 'from-amber-500 to-amber-400',
    wave: '#F59E0B',
  },
  {
    bg: 'bg-emerald-50/70 dark:bg-emerald-950/20',
    border: 'border-emerald-100/60 dark:border-emerald-900/40',
    hoverBorder: 'hover:border-emerald-300 dark:hover:border-emerald-700',
    hoverShadow: 'hover:shadow-emerald-500/8',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    iconColor: 'text-emerald-500 dark:text-emerald-400',
    accent: 'from-emerald-500 to-emerald-400',
    wave: '#10B981',
  },
  {
    bg: 'bg-rose-50/70 dark:bg-rose-950/20',
    border: 'border-rose-100/60 dark:border-rose-900/40',
    hoverBorder: 'hover:border-rose-300 dark:hover:border-rose-700',
    hoverShadow: 'hover:shadow-rose-500/8',
    iconBg: 'bg-rose-100 dark:bg-rose-900/30',
    iconColor: 'text-rose-500 dark:text-rose-400',
    accent: 'from-rose-500 to-rose-400',
    wave: '#F43F5E',
  },
  {
    bg: 'bg-cyan-50/70 dark:bg-cyan-950/20',
    border: 'border-cyan-100/60 dark:border-cyan-900/40',
    hoverBorder: 'hover:border-cyan-300 dark:hover:border-cyan-700',
    hoverShadow: 'hover:shadow-cyan-500/8',
    iconBg: 'bg-cyan-100 dark:bg-cyan-900/30',
    iconColor: 'text-cyan-500 dark:text-cyan-400',
    accent: 'from-cyan-500 to-cyan-400',
    wave: '#06B6D4',
  },
];

/* Mini sparkline SVG wave decoration */
function SparklineWave({ color }: { color: string }) {
  return (
    <svg
      className="absolute bottom-0 right-0 opacity-[0.08] dark:opacity-[0.06]"
      width="120"
      height="48"
      viewBox="0 0 120 48"
      fill="none"
    >
      <path
        d="M0 40 C15 28, 25 38, 40 30 S65 18, 80 24 S100 36, 120 20 L120 48 L0 48 Z"
        fill={color}
      />
      <path
        d="M0 44 C20 36, 30 42, 50 34 S75 24, 90 30 S105 40, 120 28 L120 48 L0 48 Z"
        fill={color}
        opacity="0.5"
      />
    </svg>
  );
}

export function KPIGrid({ kpis, onDrilldown, gridClassName }: KPIGridProps) {
  return (
    <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4', gridClassName)}>
      {kpis.map((kpi, idx) => {
        const TrendIcon =
          kpi.trendDirection === 'up'
            ? TrendingUp
            : kpi.trendDirection === 'down'
              ? TrendingDown
              : Minus;

        const trendColor =
          kpi.trendDirection === 'up'
            ? 'text-emerald-600 dark:text-emerald-400'
            : kpi.trendDirection === 'down'
              ? 'text-red-500 dark:text-red-400'
              : 'text-neutral-400';

        const trendBg =
          kpi.trendDirection === 'up'
            ? 'bg-emerald-50 dark:bg-emerald-900/20'
            : kpi.trendDirection === 'down'
              ? 'bg-red-50 dark:bg-red-900/20'
              : 'bg-neutral-100 dark:bg-neutral-800';

        const palette = CARD_PALETTES[idx % CARD_PALETTES.length];
        const isClickable = !!(kpi.drilldownType && onDrilldown);

        return (
          <button
            key={kpi.key}
            type="button"
            onClick={() => isClickable && onDrilldown?.(kpi.drilldownType!)}
            disabled={!isClickable}
            className={cn(
              'relative overflow-hidden rounded-2xl border',
              palette.bg,
              palette.border,
              'p-3.5 sm:p-4 text-left transition-all duration-300 ease-out',
              'shadow-sm dark:shadow-none',
              isClickable && [
                'hover:shadow-xl',
                palette.hoverShadow,
                palette.hoverBorder,
                'hover:scale-[1.02] active:scale-[0.98] cursor-pointer',
              ],
              !isClickable && 'cursor-default',
            )}
            style={{ animationDelay: `${idx * 60}ms` }}
          >
            {/* Top accent gradient bar */}
            <div className={cn('absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r', palette.accent)} />

            {/* Sparkline wave decoration */}
            <SparklineWave color={palette.wave} />

            {/* Icon + Label row */}
            <div className="mb-2.5 flex items-center gap-2">
              {kpi.icon && (
                <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg', palette.iconBg)}>
                  <kpi.icon className={cn('h-3.5 w-3.5', palette.iconColor)} />
                </div>
              )}
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">
                {kpi.label}
              </span>
            </div>

            {/* Value */}
            <div className="relative z-10 text-3xl leading-tight font-extrabold tracking-tight text-neutral-800 dark:text-white">
              {kpi.value}
            </div>

            {/* Trend badge */}
            {kpi.trend !== undefined && (
              <div className={cn('relative z-10 mt-2.5 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold', trendBg, trendColor)}>
                <TrendIcon className="h-3 w-3" />
                <span>{Math.abs(kpi.trend).toFixed(1)}%</span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
