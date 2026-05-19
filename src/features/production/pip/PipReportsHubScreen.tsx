import { useState } from 'react';
import { DateTime } from 'luxon';
import {
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  History,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useReportHistory, useRateLimit } from '@/features/company-admin/api/use-analytics-queries';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import { ExportMenu } from '@/components/analytics/ExportMenu';

/* ── Report Catalog ── */

const PIP_REPORTS = [
  { key: 'pip-daily-production', title: 'Daily Production', description: 'Day-wise output by operator, machine, and operation', sheets: 3 },
  { key: 'pip-incentive-summary', title: 'Incentive Summary', description: 'Monthly incentive consolidation with breakdowns', sheets: 5 },
  { key: 'pip-operator-performance', title: 'Operator Performance', description: 'Achievement rates and operator ranking', sheets: 3 },
  { key: 'pip-machine-utilization', title: 'Machine Utilization', description: 'Machine productivity and downtime analysis', sheets: 4 },
  { key: 'pip-shift-productivity', title: 'Shift Productivity', description: 'Shift-wise comparison and trends', sheets: 3 },
  { key: 'pip-payroll-merge', title: 'Payroll Merge', description: 'Audit trail of incentives merged into payroll', sheets: 2 },
  { key: 'pip-exception', title: 'Exception Report', description: 'Below-target, missing entries, duplicates, high downtime', sheets: 4 },
  { key: 'pip-slab-config', title: 'Slab Configuration', description: 'Current slab configs with tier details', sheets: 2 },
];

/* ── Screen ── */

export function PipReportsHubScreen() {
  const fmt = useCompanyFormatter();

  // Date range filter — computed once on mount (stable default values)
  const [dateFrom, setDateFrom] = useState(() => DateTime.now().minus({ days: 30 }).toISODate()!);
  const [dateTo, setDateTo] = useState(() => DateTime.now().toISODate()!);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Rate limit info
  const { data: rateLimitData } = useRateLimit();
  const rateLimit = rateLimitData?.data;

  // Report history (filtered to Production category)
  const { data: historyData, isLoading: historyLoading } = useReportHistory({ category: 'Production' });
  const history = historyData?.data ?? [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">
            PIP Reports
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Download production reports in Excel or PDF
          </p>
        </div>
      </div>

      {/* Rate Limit Info */}
      {rateLimit && (
        <div className="flex items-center gap-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/50 rounded-2xl px-5 py-3">
          <Download className="w-4 h-4 text-primary-600 dark:text-primary-400 shrink-0" />
          <p className="text-sm text-primary-800 dark:text-primary-300">
            <span className="font-bold">{rateLimit.remaining ?? rateLimit.limit}</span> of{' '}
            <span className="font-bold">{rateLimit.limit}</span> exports remaining today
            {rateLimit.remaining === 0 && (
              <span className="ml-2 text-amber-600 dark:text-amber-400 font-semibold">
                — resets {rateLimit.resetAt ? fmt.time(rateLimit.resetAt) : 'tomorrow'}
              </span>
            )}
          </p>
        </div>
      )}

      {/* Date Range Filter */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            Date Range
          </span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
          />
          <span className="text-xs text-neutral-400">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
          />
        </div>
      </div>

      {/* Report Cards Grid
          All reports receive dateFrom/dateTo — the backend's buildPipWhere()
          normalizes these into the appropriate date range for each report type.
          Month-based reports (incentive-summary, payroll-merge) and snapshot
          reports (slab-config) handle the date params gracefully server-side. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {PIP_REPORTS.map((report) => (
          <div
            key={report.key}
            className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm hover:shadow-md transition-shadow p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <FileSpreadsheet className="w-4 h-4 text-primary-600 dark:text-primary-400 shrink-0" />
                  <h3 className="text-sm font-bold text-primary-950 dark:text-white truncate">
                    {report.title}
                  </h3>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed mb-3">
                  {report.description}
                </p>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 text-[10px] font-bold border border-primary-100 dark:border-primary-800/50">
                  {report.sheets} sheets
                </span>
              </div>
              <ExportMenu
                reportType={report.key}
                filters={{ dateFrom, dateTo }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Report History (Collapsible) */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setHistoryOpen(!historyOpen)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
            <span className="text-sm font-bold text-primary-950 dark:text-white">
              Export History
            </span>
            {history.length > 0 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-[10px] font-bold">
                {history.length}
              </span>
            )}
          </div>
          {historyOpen ? (
            <ChevronUp className="w-4 h-4 text-neutral-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-neutral-400" />
          )}
        </button>

        {historyOpen && (
          <div className="border-t border-neutral-100 dark:border-neutral-800">
            {historyLoading ? (
              <div className="p-8 text-center">
                <div className="w-5 h-5 rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin mx-auto" />
              </div>
            ) : history.length === 0 ? (
              <div className="p-8 text-center">
                <AlertTriangle className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
                <p className="text-xs text-neutral-400 dark:text-neutral-500">
                  No export history found for production reports.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                      <th className="py-3 px-6 font-bold">Report</th>
                      <th className="py-3 px-6 font-bold">Format</th>
                      <th className="py-3 px-6 font-bold">Generated</th>
                      <th className="py-3 px-6 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {history.slice(0, 20).map((item: Record<string, unknown>, idx: number) => (
                      <tr
                        key={typeof item.id === 'string' || typeof item.id === 'number' ? item.id : idx}
                        className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors"
                      >
                        <td className="py-3 px-6 font-bold text-primary-950 dark:text-white text-xs">
                          {String(item.reportType ?? item.type ?? '--')}
                        </td>
                        <td className="py-3 px-6 text-xs">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-[10px] font-bold uppercase">
                            {String(item.format ?? '--')}
                          </span>
                        </td>
                        <td className="py-3 px-6 text-xs text-neutral-500 dark:text-neutral-400">
                          {item.createdAt ? fmt.dateTime(String(item.createdAt)) : '--'}
                        </td>
                        <td className="py-3 px-6">
                          <span
                            className={cn(
                              'inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded border',
                              item.status === 'COMPLETED'
                                ? 'bg-success-50 text-success-700 border-success-100 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50'
                                : item.status === 'FAILED'
                                  ? 'bg-danger-50 text-danger-700 border-danger-100 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50'
                                  : 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50',
                            )}
                          >
                            {String(item.status ?? 'PENDING')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default PipReportsHubScreen;
