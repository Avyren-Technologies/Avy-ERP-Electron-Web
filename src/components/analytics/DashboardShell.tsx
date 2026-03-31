import React from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlobalFilters, type FilterValues, type FilterOptions } from './GlobalFilters';

interface DashboardShellProps {
  title: string;
  headerSubtitle?: string;
  headerAside?: React.ReactNode;
  children: React.ReactNode;
  filters?: FilterValues;
  onFiltersChange?: (filters: FilterValues) => void;
  filterOptions?: FilterOptions;
  loading?: boolean;
  error?: string | null;
}

export function DashboardShell({
  title,
  headerSubtitle = 'Real-time analytics & insights',
  headerAside,
  children,
  filters,
  onFiltersChange,
  filterOptions,
  loading,
  error,
}: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100/50 dark:from-neutral-950 dark:to-neutral-900/50">
      {/* ── Gradient Header ── */}
      <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-[#4338CA] via-indigo-500 to-violet-500 px-6 py-6 shadow-[0_18px_40px_-22px_rgba(67,56,202,0.65)] sm:px-8 sm:py-7">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0.04)_42%,rgba(255,255,255,0.02)_100%)]" />
        {/* Decorative circles */}
        <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-white/[0.08] blur-sm" />
        <div className="absolute -bottom-12 -left-8 h-44 w-44 rounded-full bg-white/[0.05]" />
        <div className="absolute right-24 top-6 h-20 w-20 rounded-full bg-white/[0.07]" />

        {/* Dot grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.09]"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        />

        <div className="relative z-10 flex flex-col gap-3.5 md:flex-row md:items-start md:justify-between">
          <div className="max-w-3xl">
            <h1 className="text-xl font-extrabold text-white sm:text-2xl tracking-tight">
              {title}
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm font-medium text-white/85">
              {headerSubtitle}
            </p>
          </div>
          {headerAside ? (
            <div className="flex-shrink-0 rounded-2xl border border-white/20 bg-white/10 p-1.5 backdrop-blur-md">
              {headerAside}
            </div>
          ) : null}
        </div>
      </div>

      {/* ── Filters ── */}
      {filters && onFiltersChange && filterOptions && (
        <div className="border-b border-neutral-200/80 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm px-6 py-4 sm:px-8 shadow-sm">
          <GlobalFilters
            filters={filters}
            onChange={onFiltersChange}
            {...filterOptions}
          />
        </div>
      )}

      {/* ── Content ── */}
      <div className="px-6 py-8 sm:px-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping" />
              <Loader2 className="relative h-10 w-10 animate-spin text-indigo-500" />
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">
              Loading analytics...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">
              {error}
            </p>
          </div>
        ) : (
          <div className={cn('space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500')}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
