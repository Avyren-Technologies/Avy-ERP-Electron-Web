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
    <div className="flex flex-col items-center justify-center py-20 px-6">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-5">
        <BarChart3 className="h-8 w-8 text-indigo-400 dark:text-indigo-500" />
      </div>

      <h3 className="text-lg font-semibold text-neutral-700 dark:text-neutral-200 mb-1.5 text-center">
        {title}
      </h3>

      {description && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center max-w-sm mb-6">
          {description}
        </p>
      )}

      {ctaLabel && ctaPath && (
        <Link
          to={ctaPath}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}
