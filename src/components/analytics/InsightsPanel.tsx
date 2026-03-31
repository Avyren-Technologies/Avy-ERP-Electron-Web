import { useState } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Insight {
  type: string;
  severity: 'critical' | 'warning' | 'info' | 'positive';
  title: string;
  description: string;
  drilldownType?: string;
}

interface InsightsPanelProps {
  insights: Insight[];
  onDrilldown?: (type: string) => void;
}

const severityConfig = {
  critical: {
    border: 'border-l-red-500',
    bg: 'bg-red-50/80 dark:bg-red-950/20',
    icon: AlertTriangle,
    iconColor: 'text-red-500',
    glow: 'shadow-red-500/5',
    badge: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  },
  warning: {
    border: 'border-l-amber-500',
    bg: 'bg-amber-50/80 dark:bg-amber-950/20',
    icon: AlertCircle,
    iconColor: 'text-amber-500',
    glow: 'shadow-amber-500/5',
    badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  },
  info: {
    border: 'border-l-blue-500',
    bg: 'bg-blue-50/80 dark:bg-blue-950/20',
    icon: Info,
    iconColor: 'text-blue-500',
    glow: 'shadow-blue-500/5',
    badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  },
  positive: {
    border: 'border-l-emerald-500',
    bg: 'bg-emerald-50/80 dark:bg-emerald-950/20',
    icon: CheckCircle2,
    iconColor: 'text-emerald-500',
    glow: 'shadow-emerald-500/5',
    badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  },
};

export function InsightsPanel({ insights, onDrilldown }: InsightsPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const safeInsights = Array.isArray(insights) ? insights.filter(Boolean) : [];

  if (safeInsights.length === 0) return null;

  return (
    <div className="rounded-2xl border border-neutral-200/60 dark:border-neutral-700/60 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-neutral-50/80 dark:hover:bg-neutral-800/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-sm">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-bold text-neutral-800 dark:text-neutral-100">
            AI Insights
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
            {safeInsights.length}
          </span>
        </div>
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-neutral-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-neutral-400" />
        )}
      </button>

      {/* Insight Items */}
      {expanded && (
        <div className="border-t border-neutral-100 dark:border-neutral-800">
          {safeInsights.map((insight, idx) => {
            const config = severityConfig[insight.severity] ?? severityConfig.info;
            const Icon = config.icon;
            const isClickable = !!(insight.drilldownType && onDrilldown);
            const isLast = idx === safeInsights.length - 1;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => isClickable && onDrilldown?.(insight.drilldownType!)}
                disabled={!isClickable}
                className={cn(
                  'w-full text-left px-6 py-4 border-l-4 transition-all duration-200',
                  config.border,
                  config.bg,
                  'shadow-sm',
                  config.glow,
                  isClickable && 'hover:brightness-[0.97] dark:hover:brightness-110 cursor-pointer',
                  !isClickable && 'cursor-default',
                  !isLast && 'border-b border-neutral-100/50 dark:border-neutral-800/50',
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0">
                    <Icon className={cn('h-4.5 w-4.5', config.iconColor)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                        {insight.title}
                      </p>
                      <span className={cn('text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md', config.badge)}>
                        {insight.severity}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed line-clamp-2">
                      {insight.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
