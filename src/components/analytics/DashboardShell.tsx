import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlobalFilters, type FilterValues } from './GlobalFilters';

const ANALYTICS_NAV = [
  { label: 'Executive', path: '/app/company/hr/analytics/executive' },
  { label: 'Workforce', path: '/app/company/hr/analytics/workforce' },
  { label: 'Attendance', path: '/app/company/hr/analytics/attendance' },
  { label: 'Leave', path: '/app/company/hr/analytics/leave' },
  { label: 'Payroll', path: '/app/company/hr/analytics/payroll' },
  { label: 'Compliance', path: '/app/company/hr/analytics/compliance' },
  { label: 'Performance', path: '/app/company/hr/analytics/performance' },
  { label: 'Recruitment', path: '/app/company/hr/analytics/recruitment' },
  { label: 'Attrition', path: '/app/company/hr/analytics/attrition' },
  { label: 'Reports', path: '/app/company/hr/analytics/reports' },
];

interface DashboardShellProps {
  title: string;
  children: React.ReactNode;
  filters?: FilterValues;
  onFiltersChange?: (filters: FilterValues) => void;
  loading?: boolean;
  error?: string | null;
}

export function DashboardShell({
  title,
  children,
  filters,
  onFiltersChange,
  loading,
  error,
}: DashboardShellProps) {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Gradient Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-500 px-6 py-8 sm:px-8">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        <h1 className="relative text-2xl font-bold text-white sm:text-3xl tracking-tight">
          {title}
        </h1>
      </div>

      {/* Analytics Sub-Navigation */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-x-auto">
        <nav className="flex px-6 sm:px-8 gap-1 min-w-max">
          {ANALYTICS_NAV.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                  isActive
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Filters */}
      {filters && onFiltersChange && (
        <div className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-6 py-4 sm:px-8">
          <GlobalFilters
            filters={filters}
            onChange={onFiltersChange}
          />
        </div>
      )}

      {/* Content */}
      <div className="px-6 py-6 sm:px-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading analytics...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
            <p className="text-sm text-neutral-600 dark:text-neutral-400">{error}</p>
          </div>
        ) : (
          <div className={cn('space-y-6 animate-in fade-in duration-300')}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
