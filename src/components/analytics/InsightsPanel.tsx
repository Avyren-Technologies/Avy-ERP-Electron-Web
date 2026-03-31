import { useState } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Lightbulb,
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
    bg: 'bg-red-50 dark:bg-red-950/20',
    icon: AlertTriangle,
    iconColor: 'text-red-500',
  },
  warning: {
    border: 'border-l-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    icon: AlertCircle,
    iconColor: 'text-amber-500',
  },
  info: {
    border: 'border-l-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    icon: Info,
    iconColor: 'text-blue-500',
  },
  positive: {
    border: 'border-l-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    icon: CheckCircle2,
    iconColor: 'text-emerald-500',
  },
};

export function InsightsPanel({ insights, onDrilldown }: InsightsPanelProps) {
  const [expanded, setExpanded] = useState(true);

  if (insights.length === 0) return null;

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-violet-500" />
          <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
            AI Insights
          </span>
          <span className="px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-medium">
            {insights.length}
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
        <div className="border-t border-neutral-100 dark:border-neutral-800 divide-y divide-neutral-100 dark:divide-neutral-800">
          {insights.map((insight, idx) => {
            const config = severityConfig[insight.severity];
            const Icon = config.icon;
            const isClickable = !!(insight.drilldownType && onDrilldown);

            return (
              <button
                key={idx}
                type="button"
                onClick={() => isClickable && onDrilldown?.(insight.drilldownType!)}
                disabled={!isClickable}
                className={cn(
                  'w-full text-left px-5 py-3 border-l-4 transition-colors',
                  config.border,
                  config.bg,
                  isClickable && 'hover:brightness-95 dark:hover:brightness-110 cursor-pointer',
                  !isClickable && 'cursor-default',
                )}
              >
                <div className="flex items-start gap-3">
                  <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', config.iconColor)} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                      {insight.title}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2">
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
