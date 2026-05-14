import { useState, useMemo } from 'react';
import {
  FileText,
  Send,
  CheckCircle2,
  XCircle,
  Loader2,
  Calendar,
  IndianRupee,
  TrendingUp,
  Zap,
  GitMerge,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  usePipMonthlyReports,
  usePipMonthlyReport,
} from '@/features/production/pip/api/use-pip-queries';
import {
  useGeneratePipMonthlyReport,
  useSubmitPipMonthlyReport,
  useMergePipToPayroll,
} from '@/features/production/pip/api/use-pip-mutations';
import { showSuccess, showApiError } from '@/lib/toast';
import type { PipMonthlyReport } from '@/lib/api/pip';
import { exportToExcel, exportToCsv } from '@/lib/export-utils';

/* ── Helpers ── */

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getMonthOptions(): { label: string; month: number; year: number }[] {
  const now = new Date();
  const options: { label: string; month: number; year: number }[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push({
      label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
      month: d.getMonth() + 1,
      year: d.getFullYear(),
    });
  }
  return options;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  DRAFT: { bg: 'bg-neutral-50 dark:bg-neutral-800/50', text: 'text-neutral-600 dark:text-neutral-400', border: 'border-neutral-200 dark:border-neutral-700' },
  SUBMITTED: { bg: 'bg-primary-50 dark:bg-primary-900/20', text: 'text-primary-700 dark:text-primary-400', border: 'border-primary-100 dark:border-primary-800/50' },
  APPROVED: { bg: 'bg-success-50 dark:bg-success-900/20', text: 'text-success-700 dark:text-success-400', border: 'border-success-100 dark:border-success-800/50' },
  REJECTED: { bg: 'bg-danger-50 dark:bg-danger-900/20', text: 'text-danger-700 dark:text-danger-400', border: 'border-danger-100 dark:border-danger-800/50' },
  MERGED: { bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-700 dark:text-violet-400', border: 'border-violet-100 dark:border-violet-800/50' },
};

/* ── Metric Card ── */

function MetricCard({
  label,
  value,
  sub,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-5">
      <div className="flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', color)}>
          {icon}
        </div>
        <div>
          <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            {label}
          </p>
          <p className="text-xl font-extrabold text-primary-950 dark:text-white mt-0.5">{value}</p>
          {sub && (
            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">{sub}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Bar Chart ── */

function DayBarChart({ dailyTrend }: { dailyTrend: Record<string, unknown>[] }) {
  if (!dailyTrend.length) return null;

  const maxVal = Math.max(...dailyTrend.map((d) => Number(d.total ?? d.incentive ?? 0)), 1);

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-6">
      <h3 className="text-sm font-bold text-primary-950 dark:text-white mb-4">
        Day-wise Incentive Trend
      </h3>
      <div className="flex items-end gap-1 h-48 overflow-x-auto pb-6 relative">
        {dailyTrend.map((d, idx) => {
          const val = Number(d.total ?? d.incentive ?? 0);
          const height = maxVal > 0 ? (val / maxVal) * 100 : 0;
          const day = String(d.day ?? d.date ?? idx + 1);
          const displayDay = day.length > 2 ? day.slice(-2) : day;
          return (
            <div key={idx} className="flex flex-col items-center flex-1 min-w-[20px] group relative">
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                <div className="bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap shadow-lg">
                  Day {displayDay}: {'\u20B9'}{val.toFixed(2)}
                </div>
              </div>
              <div
                className={cn(
                  'w-full rounded-t-md transition-all',
                  val > 0
                    ? 'bg-primary-500 dark:bg-primary-400 group-hover:bg-primary-600 dark:group-hover:bg-primary-300'
                    : 'bg-neutral-200 dark:bg-neutral-700',
                )}
                style={{ height: `${Math.max(height, 2)}%` }}
              />
              <span className="text-[9px] text-neutral-400 dark:text-neutral-500 mt-1 font-mono">
                {displayDay}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Screen ── */

export function PipIncentiveSummaryScreen() {
  const monthOptions = useMemo(() => getMonthOptions(), []);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const selected = monthOptions[selectedIdx];

  const queryParams = useMemo(
    () => ({ month: selected.month, year: selected.year }),
    [selected],
  );

  const { data: reportsData, isLoading } = usePipMonthlyReports(queryParams);
  const reports: PipMonthlyReport[] = reportsData?.data ?? [];
  const report = reports.length > 0 ? reports[0] : null;

  // If we have a report, fetch full detail
  const { data: reportDetail } = usePipMonthlyReport(report?.id ?? '');
  const detail: PipMonthlyReport | undefined = reportDetail?.data;

  const generateMutation = useGeneratePipMonthlyReport();
  const submitMutation = useSubmitPipMonthlyReport();
  const mergeMutation = useMergePipToPayroll();

  // Derived data from the report
  const operatorSummary = (detail?.operatorSummary ?? report?.operatorSummary ?? []) as Record<string, unknown>[];
  const partSummary = (detail?.partSummary ?? report?.partSummary ?? []) as Record<string, unknown>[];
  const dailyTrend = (detail?.dailyTrend ?? report?.dailyTrend ?? []) as Record<string, unknown>[];

  const totalIncentive = Number(detail?.totalIncentive ?? report?.totalIncentive ?? 0);
  const workingDays = detail?.workingDays ?? report?.workingDays ?? 0;
  const avgPerDay = Number(detail?.avgPerDay ?? report?.avgPerDay ?? 0);
  const maxSingleDay = Number(detail?.maxSingleDay ?? report?.maxSingleDay ?? 0);
  const maxSingleDayDate = detail?.maxSingleDayDate ?? report?.maxSingleDayDate;
  const status = detail?.status ?? report?.status ?? '';

  const statusStyle = STATUS_STYLES[status] ?? STATUS_STYLES.DRAFT;

  const handleGenerateAndSubmit = async () => {
    try {
      let reportId = report?.id;
      if (!reportId) {
        // Generate first
        const gen = await generateMutation.mutateAsync({
          month: selected.month,
          year: selected.year,
        });
        reportId = gen?.data?.id;
        if (!reportId) {
          showApiError({ message: 'Failed to generate report' });
          return;
        }
      }
      await submitMutation.mutateAsync(reportId);
      showSuccess('Report Submitted', 'Monthly incentive report sent for approval.');
    } catch (err) {
      showApiError(err);
    }
  };

  const handleMerge = async () => {
    if (!report?.id) return;
    try {
      await mergeMutation.mutateAsync({ id: report.id, data: {} });
      showSuccess('Merged to Payroll', 'Incentives have been merged to the payroll run.');
    } catch (err) {
      showApiError(err);
    }
  };

  const handleExport = (format: 'excel' | 'csv') => {
    // Operator-wise summary export
    const headers = ['Operator', 'Days Eligible', 'Total Days', 'Total Incentive', 'Avg/Day'];
    const csvRows = operatorSummary.map((op) => {
      const total = Number(op.totalIncentive ?? op.total ?? 0);
      const daysEligible = Number(op.daysEligible ?? op.eligibleDays ?? 0);
      const totalDays = Number(op.totalDays ?? workingDays);
      const avg = daysEligible > 0 ? total / daysEligible : 0;
      return [
        String(op.operatorName ?? op.name ?? '--'),
        String(daysEligible),
        String(totalDays),
        total.toFixed(2),
        avg.toFixed(2),
      ];
    });

    const fileName = `incentive-summary-${selected.label.replace(/\s+/g, '-')}`;

    if (format === 'excel') {
      exportToExcel(headers, csvRows, {
        fileName,
        sheetName: 'Incentive Summary',
        title: `Incentive Summary Report - ${selected.label}`,
        reportDate: `${selected.label}`,
      });
    } else {
      exportToCsv(headers, csvRows, fileName);
    }
  };

  const isSubmitting = generateMutation.isPending || submitMutation.isPending;
  const isMerging = mergeMutation.isPending;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">
            Incentive Summary Report
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Monthly incentive aggregation for payroll
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={selectedIdx}
            onChange={(e) => setSelectedIdx(Number(e.target.value))}
            className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
          >
            {monthOptions.map((m, i) => (
              <option key={i} value={i}>
                {m.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => handleExport('excel')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-sm font-bold transition-colors"
          >
            <FileText size={16} />
            Excel
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-sm font-bold transition-colors"
          >
            <FileText size={16} />
            CSV
          </button>
          {(!status || status === 'DRAFT') && (
            <button
              onClick={handleGenerateAndSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {isSubmitting ? 'Submitting...' : 'Send for Approval'}
            </button>
          )}
          {status === 'APPROVED' && (
            <button
              onClick={handleMerge}
              disabled={isMerging}
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-violet-500/20 transition-all dark:shadow-none disabled:opacity-50"
            >
              {isMerging ? <Loader2 size={16} className="animate-spin" /> : <GitMerge size={16} />}
              {isMerging ? 'Merging...' : 'Merge to Payroll'}
            </button>
          )}
        </div>
      </div>

      {/* Status badge */}
      {status && (
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 rounded-lg border',
              statusStyle.bg,
              statusStyle.text,
              statusStyle.border,
            )}
          >
            {status === 'APPROVED' && <CheckCircle2 size={12} />}
            {status === 'REJECTED' && <XCircle size={12} />}
            {status === 'MERGED' && <GitMerge size={12} />}
            {status}
          </span>
          {status === 'MERGED' && report?.mergedAt && (
            <span className="text-xs text-neutral-400 dark:text-neutral-500">
              Merged on {new Date(report.mergedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      )}

      {/* 4 Metric Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-neutral-100 dark:bg-neutral-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Total Incentive"
            value={`\u20B9${totalIncentive.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={<IndianRupee className="w-5 h-5 text-success-600 dark:text-success-400" />}
            color="bg-success-50 dark:bg-success-900/20"
          />
          <MetricCard
            label="Working Days"
            value={workingDays}
            sub={`${operatorSummary.length} operators`}
            icon={<Calendar className="w-5 h-5 text-primary-600 dark:text-primary-400" />}
            color="bg-primary-50 dark:bg-primary-900/20"
          />
          <MetricCard
            label="Avg / Day"
            value={`\u20B9${avgPerDay.toFixed(2)}`}
            sub="per eligible operator"
            icon={<TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
            color="bg-amber-50 dark:bg-amber-900/20"
          />
          <MetricCard
            label="Max Single Day"
            value={`\u20B9${maxSingleDay.toFixed(2)}`}
            sub={maxSingleDayDate ? new Date(maxSingleDayDate).toLocaleDateString() : undefined}
            icon={<Zap className="w-5 h-5 text-danger-600 dark:text-danger-400" />}
            color="bg-danger-50 dark:bg-danger-900/20"
          />
        </div>
      )}

      {/* Two tables side by side */}
      {!isLoading && report && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Operator-wise Table */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="text-sm font-bold text-primary-950 dark:text-white">
                Operator-wise Summary
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                    <th className="py-3 px-4 font-bold">Operator</th>
                    <th className="py-3 px-4 font-bold">Days Eligible</th>
                    <th className="py-3 px-4 font-bold">Total</th>
                    <th className="py-3 px-4 font-bold">Avg/Day</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {operatorSummary.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-neutral-400 dark:text-neutral-500 text-xs">
                        No operator data
                      </td>
                    </tr>
                  ) : (
                    operatorSummary.map((op, idx) => {
                      const total = Number(op.totalIncentive ?? op.total ?? 0);
                      const daysEligible = Number(op.daysEligible ?? op.eligibleDays ?? 0);
                      const totalDays = Number(op.totalDays ?? workingDays);
                      const avg = daysEligible > 0 ? total / daysEligible : 0;
                      return (
                        <tr
                          key={idx}
                          className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors"
                        >
                          <td className="py-3 px-4 font-bold text-primary-950 dark:text-white text-xs">
                            {String(op.operatorName ?? op.name ?? '--')}
                          </td>
                          <td className="py-3 px-4 text-xs text-neutral-600 dark:text-neutral-400">
                            {daysEligible}/{totalDays}
                          </td>
                          <td className="py-3 px-4 text-xs font-bold text-success-600 dark:text-success-400">
                            {'\u20B9'}{total.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-xs text-neutral-600 dark:text-neutral-400">
                            {'\u20B9'}{avg.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Part-wise Table */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="text-sm font-bold text-primary-950 dark:text-white">
                Part-wise Summary
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                    <th className="py-3 px-4 font-bold">Part</th>
                    <th className="py-3 px-4 font-bold">Excess Pcs</th>
                    <th className="py-3 px-4 font-bold">Incentive</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {partSummary.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-neutral-400 dark:text-neutral-500 text-xs">
                        No part data
                      </td>
                    </tr>
                  ) : (
                    partSummary.map((ps, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 text-[10px] font-bold border border-primary-100 dark:border-primary-800/50">
                            {String(ps.partNumber ?? ps.part ?? '--')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs font-bold text-primary-950 dark:text-white">
                          {Number(ps.excessPcs ?? ps.excessQty ?? 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-xs font-bold text-success-600 dark:text-success-400">
                          {'\u20B9'}{Number(ps.incentive ?? ps.incentiveAmount ?? 0).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Day-wise bar chart */}
      {!isLoading && dailyTrend.length > 0 && <DayBarChart dailyTrend={dailyTrend} />}

      {/* No report state */}
      {!isLoading && !report && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-neutral-400 dark:text-neutral-500" />
          </div>
          <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
            No report for {selected.label}
          </p>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1 max-w-md mx-auto">
            Click &ldquo;Send for Approval&rdquo; to generate and submit the monthly incentive report.
          </p>
        </div>
      )}
    </div>
  );
}
