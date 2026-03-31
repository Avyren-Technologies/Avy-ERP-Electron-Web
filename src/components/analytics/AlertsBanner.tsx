import { AlertTriangle, AlertCircle, Info, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AlertData {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  createdAt?: string;
}

interface AlertsBannerProps {
  alerts: AlertData[];
  onAcknowledge?: (id: string) => void;
  onResolve?: (id: string) => void;
}

const alertConfig = {
  critical: {
    bg: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
    icon: AlertTriangle,
    iconColor: 'text-red-600 dark:text-red-400',
    badge: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
  },
  high: {
    bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
    icon: AlertCircle,
    iconColor: 'text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
  },
  medium: {
    bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
    icon: Info,
    iconColor: 'text-blue-600 dark:text-blue-400',
    badge: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
  },
  low: {
    bg: 'bg-neutral-50 dark:bg-neutral-900/30 border-neutral-200 dark:border-neutral-700',
    icon: Info,
    iconColor: 'text-neutral-500 dark:text-neutral-400',
    badge: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300',
  },
};

export function AlertsBanner({ alerts, onAcknowledge, onResolve }: AlertsBannerProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {alerts.map((alert) => {
        const config = alertConfig[alert.severity];
        const Icon = config.icon;

        return (
          <div
            key={alert.id}
            className={cn(
              'flex items-start gap-3 rounded-xl border p-4 transition-all animate-in fade-in slide-in-from-top-2 duration-300',
              config.bg,
            )}
          >
            <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', config.iconColor)} />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                  {alert.title}
                </span>
                <span className={cn('text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full', config.badge)}>
                  {alert.severity}
                </span>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-1">
                {alert.message}
              </p>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {onAcknowledge && (
                <button
                  type="button"
                  onClick={() => onAcknowledge(alert.id)}
                  title="Acknowledge"
                  className="p-1.5 rounded-lg hover:bg-white/60 dark:hover:bg-neutral-800/60 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
              )}
              {onResolve && (
                <button
                  type="button"
                  onClick={() => onResolve(alert.id)}
                  title="Resolve"
                  className="p-1.5 rounded-lg hover:bg-white/60 dark:hover:bg-neutral-800/60 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
