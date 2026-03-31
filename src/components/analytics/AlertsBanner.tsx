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
    bg: 'bg-red-50/90 dark:bg-red-950/30 border-red-200 dark:border-red-800/60',
    icon: AlertTriangle,
    iconColor: 'text-red-600 dark:text-red-400',
    iconBg: 'bg-red-100 dark:bg-red-900/40',
    badge: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
    glow: 'shadow-red-500/10',
  },
  high: {
    bg: 'bg-amber-50/90 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60',
    icon: AlertCircle,
    iconColor: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-900/40',
    badge: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
    glow: 'shadow-amber-500/10',
  },
  medium: {
    bg: 'bg-blue-50/90 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/60',
    icon: Info,
    iconColor: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-100 dark:bg-blue-900/40',
    badge: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
    glow: 'shadow-blue-500/10',
  },
  low: {
    bg: 'bg-neutral-50/90 dark:bg-neutral-900/30 border-neutral-200 dark:border-neutral-700/60',
    icon: Info,
    iconColor: 'text-neutral-500 dark:text-neutral-400',
    iconBg: 'bg-neutral-100 dark:bg-neutral-800',
    badge: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300',
    glow: '',
  },
};

export function AlertsBanner({ alerts, onAcknowledge, onResolve }: AlertsBannerProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {alerts.map((alert, idx) => {
        const config = alertConfig[alert.severity];
        const Icon = config.icon;

        return (
          <div
            key={alert.id}
            className={cn(
              'flex items-start gap-3.5 rounded-2xl border p-5 transition-all',
              'animate-in fade-in slide-in-from-top-2 duration-300',
              'shadow-sm',
              config.bg,
              config.glow,
            )}
            style={{ animationDelay: `${idx * 80}ms` }}
          >
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', config.iconBg)}>
              <Icon className={cn('h-[18px] w-[18px]', config.iconColor)} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold text-neutral-800 dark:text-neutral-100">
                  {alert.title}
                </span>
                <span className={cn('text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md', config.badge)}>
                  {alert.severity}
                </span>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed line-clamp-2">
                {alert.message}
              </p>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              {onAcknowledge && (
                <button
                  type="button"
                  onClick={() => onAcknowledge(alert.id)}
                  title="Acknowledge"
                  className="p-2 rounded-xl hover:bg-white/60 dark:hover:bg-neutral-800/60 text-neutral-400 hover:text-emerald-500 transition-all duration-200"
                >
                  <Check className="h-4 w-4" />
                </button>
              )}
              {onResolve && (
                <button
                  type="button"
                  onClick={() => onResolve(alert.id)}
                  title="Resolve"
                  className="p-2 rounded-xl hover:bg-white/60 dark:hover:bg-neutral-800/60 text-neutral-400 hover:text-neutral-600 transition-all duration-200"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
