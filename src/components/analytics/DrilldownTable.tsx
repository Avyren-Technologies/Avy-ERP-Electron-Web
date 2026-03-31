import { useState } from 'react';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExportMenu } from './ExportMenu';

export interface DrilldownColumn<T = Record<string, unknown>> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
}

interface DrilldownTableProps<T = Record<string, unknown>> {
  data: T[];
  columns: DrilldownColumn<T>[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  onSearch?: (query: string) => void;
  exportReportType?: string;
  exportFilters?: Record<string, unknown>;
}

export function DrilldownTable<T extends Record<string, unknown>>({
  data,
  columns,
  total,
  page,
  limit,
  onPageChange,
  onSort,
  onSearch,
  exportReportType,
  exportFilters,
}: DrilldownTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const totalPages = Math.ceil(total / limit);

  const handleSort = (key: string) => {
    const newDir = sortKey === key && sortDir === 'asc' ? 'desc' : 'asc';
    setSortKey(key);
    setSortDir(newDir);
    onSort?.(key, newDir);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  };

  return (
    <div className="rounded-2xl border border-neutral-200/60 dark:border-neutral-700/60 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
        {onSearch && (
          <div className={cn(
            'relative flex-1 min-w-[200px] max-w-sm transition-all duration-300',
            searchFocused && 'max-w-md',
          )}>
            <Search className={cn(
              'absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200',
              searchFocused ? 'text-indigo-500' : 'text-neutral-400',
            )} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search records..."
              className={cn(
                'w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border rounded-xl text-sm',
                'focus:outline-none transition-all duration-200 dark:text-white',
                searchFocused
                  ? 'border-indigo-300 dark:border-indigo-600 ring-2 ring-indigo-500/10 bg-white dark:bg-neutral-800'
                  : 'border-neutral-200 dark:border-neutral-700',
              )}
            />
          </div>
        )}
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs font-bold text-neutral-500 dark:text-neutral-400">
            {total} record{total !== 1 ? 's' : ''}
          </span>
          {exportReportType && exportFilters && (
            <ExportMenu reportType={exportReportType} filters={exportFilters} />
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-gradient-to-r from-neutral-50 to-neutral-50/50 dark:from-neutral-800/40 dark:to-neutral-800/20">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400',
                    col.sortable && 'cursor-pointer select-none hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors',
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1.5">
                    {col.header}
                    {col.sortable && (
                      sortKey === col.key ? (
                        sortDir === 'asc' ? (
                          <ArrowUp className="h-3 w-3 text-indigo-500" />
                        ) : (
                          <ArrowDown className="h-3 w-3 text-indigo-500" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-25" />
                      )
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100/80 dark:divide-neutral-800/80">
            {data.map((item, rowIdx) => (
              <tr
                key={rowIdx}
                className="group hover:bg-indigo-50/40 dark:hover:bg-indigo-900/10 transition-colors duration-150"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-6 py-4 text-sm text-neutral-700 dark:text-neutral-300"
                  >
                    {col.render
                      ? col.render(item)
                      : (item[col.key] as React.ReactNode) ?? '-'}
                  </td>
                ))}
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-16 text-center text-sm text-neutral-400"
                >
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/20">
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
            Page <strong className="text-neutral-700 dark:text-neutral-200">{page}</strong> of <strong className="text-neutral-700 dark:text-neutral-200">{totalPages}</strong>
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-2 rounded-xl hover:bg-white dark:hover:bg-neutral-800 border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
            >
              <ChevronLeft className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
            </button>
            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-2 rounded-xl hover:bg-white dark:hover:bg-neutral-800 border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
            >
              <ChevronRight className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
