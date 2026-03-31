import { BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ZeroDataStateProps {
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaPath?: string;
}

export function ZeroDataState({ title, description, ctaLabel, ctaPath }: ZeroDataStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6">
      {/* Gradient ring icon */}
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 blur-xl scale-150" />
        <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 flex items-center justify-center border border-indigo-100 dark:border-indigo-800/40 shadow-sm">
          <BarChart3 className="h-9 w-9 text-indigo-400 dark:text-indigo-500" />
        </div>
      </div>

      <h3 className="text-lg font-bold text-neutral-700 dark:text-neutral-200 mb-2 text-center">
        {title}
      </h3>

      {description && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center max-w-sm mb-8 leading-relaxed">
          {description}
        </p>
      )}

      {ctaLabel && ctaPath && (
        <Link
          to={ctaPath}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-bold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}
