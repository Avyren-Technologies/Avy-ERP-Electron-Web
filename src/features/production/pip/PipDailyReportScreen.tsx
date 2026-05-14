import { useState, useMemo } from 'react';
import {
  Calendar,
  Download,
  FileText,
  Users,
  TrendingUp,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePipDailyEntrySummary } from '@/features/production/pip/api/use-pip-queries';
import { useCompanyShifts } from '@/features/company-admin/api/use-company-admin-queries';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { client } from '@/lib/api/client';

/* ── Helpers ── */

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

interface OperatorRow {
  operatorId: string;
  operatorName: string;
  employeeId: string;
  machineCode: string;
  machineName: string;
  parts: { partNumber: string; qty: number }[];
  totalQty: number;
  completionPct: number;
  isEligible: boolean;
  incentiveAmount: number;
}

function parseOperatorRows(data: Record<string, unknown> | undefined): OperatorRow[] {
  if (!data) return [];
  const operators = (data.operators ?? data.entries ?? []) as Record<string, unknown>[];
  return operators.map((op) => ({
    operatorId: String(op.operatorId ?? ''),
    operatorName: String(op.operatorName ?? op.name ?? ''),
    employeeId: String(op.employeeId ?? ''),
    machineCode: String(op.machineCode ?? op.assetCode ?? ''),
    machineName: String(op.machineName ?? op.assetName ?? ''),
    parts: ((op.parts ?? []) as Record<string, unknown>[]).map((p) => ({
      partNumber: String(p.partNumber ?? ''),
      qty: Number(p.qtyProduced ?? p.qty ?? 0),
    })),
    totalQty: Number(op.totalQty ?? 0),
    completionPct: Number(op.completionPct ?? op.cumulativeRatio ?? op.achievementPct ?? 0),
    isEligible: Boolean(op.isEligible),
    incentiveAmount: Number(op.incentiveAmount ?? op.totalIncentive ?? 0),
  }));
}

/* ── Metric Card ── */

function MetricCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
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
        </div>
      </div>
    </div>
  );
}

/* ── Screen ── */

export function PipDailyReportScreen() {
  const [entryDate, setEntryDate] = useState(formatDate(new Date()));
  const [shiftId, setShiftId] = useState('');

  const { data: shiftsData } = useCompanyShifts();
  const shifts = shiftsData?.data ?? [];

  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = { entryDate };
    if (shiftId) params.shiftId = shiftId;
    return params;
  }, [entryDate, shiftId]);

  const { data: summaryData, isLoading } = usePipDailyEntrySummary(queryParams);
  const rows = useMemo(() => parseOperatorRows(summaryData?.data as Record<string, unknown> | undefined), [summaryData]);

  // Metrics
  const totalProduction = rows.reduce((s, r) => s + r.totalQty, 0);
  const operatorsLogged = rows.length;
  const avgAchievement = rows.length > 0
    ? rows.reduce((s, r) => s + r.completionPct, 0) / rows.length
    : 0;
  const belowTarget = rows.filter((r) => r.completionPct < 100).length;

  // Export helpers
  const handleExport = async (format: 'pdf' | 'excel') => {
    try {
      const params: Record<string, string> = { entryDate, format };
      if (shiftId) params.shiftId = shiftId;
      const response = await client.get('/production/pip/export/daily-report', {
        params,
        responseType: 'blob',
      });
      const contentType = response.headers['content-type'] || (format === 'excel'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'text/csv');
      const blob = new Blob([response.data], { type: contentType });
      // Derive extension from Content-Disposition or content type
      const disposition = response.headers['content-disposition'] || '';
      const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
      const filename = filenameMatch?.[1] || `daily-report-${entryDate}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: CSV export from client-side data
      const headers = ['Operator', 'Employee ID', 'Machine', 'Parts', 'Total Qty', 'Completion %', 'Status', 'Incentive'];
      const csvRows = rows.map((r) => [
        r.operatorName,
        r.employeeId,
        r.machineCode,
        r.parts.map((p) => `${p.partNumber}(${p.qty})`).join(' '),
        String(r.totalQty),
        `${r.completionPct.toFixed(1)}%`,
        r.isEligible ? 'Eligible' : 'Not Eligible',
        `${r.incentiveAmount.toFixed(2)}`,
      ]);
      const csv = [headers, ...csvRows].map((row) => row.map((c) => `"${c}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `daily-report-${entryDate}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">
            Daily Production Report
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Date-specific production and incentive summary
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="date"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
            className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
          />
          <select
            value={shiftId}
            onChange={(e) => setShiftId(e.target.value)}
            className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
          >
            <option value="">All Shifts</option>
            {shifts.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => handleExport('pdf')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-sm font-bold transition-colors"
          >
            <FileText size={16} />
            PDF
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-sm font-bold transition-colors"
          >
            <Download size={16} />
            Excel
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Production"
          value={totalProduction.toLocaleString()}
          icon={<BarChart3 className="w-5 h-5 text-primary-600 dark:text-primary-400" />}
          color="bg-primary-50 dark:bg-primary-900/20"
        />
        <MetricCard
          label="Operators Logged"
          value={operatorsLogged}
          icon={<Users className="w-5 h-5 text-success-600 dark:text-success-400" />}
          color="bg-success-50 dark:bg-success-900/20"
        />
        <MetricCard
          label="Avg Achievement"
          value={`${avgAchievement.toFixed(1)}%`}
          icon={<TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
          color="bg-amber-50 dark:bg-amber-900/20"
        />
        <MetricCard
          label="Below Target"
          value={belowTarget}
          icon={<AlertTriangle className="w-5 h-5 text-danger-600 dark:text-danger-400" />}
          color="bg-danger-50 dark:bg-danger-900/20"
        />
      </div>

      {/* Detail Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
        {isLoading ? (
          <SkeletonTable rows={8} cols={7} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon="list"
            title="No entries for this date"
            message="No daily production entries were recorded for the selected date and shift."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                  <th className="py-4 px-6 font-bold">Operator</th>
                  <th className="py-4 px-6 font-bold">Machine</th>
                  <th className="py-4 px-6 font-bold">Parts</th>
                  <th className="py-4 px-6 font-bold">Total Qty</th>
                  <th className="py-4 px-6 font-bold">Completion</th>
                  <th className="py-4 px-6 font-bold">Status</th>
                  <th className="py-4 px-6 font-bold text-right">Incentive</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {rows.map((row, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    {/* Operator */}
                    <td className="py-4 px-6">
                      <span className="font-bold text-primary-950 dark:text-white">
                        {row.operatorName}
                      </span>
                      <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5 font-mono">
                        {row.employeeId}
                      </p>
                    </td>
                    {/* Machine */}
                    <td className="py-4 px-6">
                      <span className="font-mono text-xs font-bold text-neutral-700 dark:text-neutral-300">
                        {row.machineCode}
                      </span>
                    </td>
                    {/* Parts */}
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1">
                        {row.parts.map((p, pi) => (
                          <span
                            key={pi}
                            className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 text-[10px] font-bold border border-primary-100 dark:border-primary-800/50"
                          >
                            {p.partNumber}({p.qty})
                          </span>
                        ))}
                      </div>
                    </td>
                    {/* Total Qty */}
                    <td className="py-4 px-6">
                      <span className="font-bold text-primary-950 dark:text-white">
                        {row.totalQty}
                      </span>
                    </td>
                    {/* Completion */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 max-w-[80px] h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              row.completionPct >= 100
                                ? 'bg-success-500'
                                : row.completionPct >= 75
                                  ? 'bg-amber-500'
                                  : 'bg-danger-500',
                            )}
                            style={{ width: `${Math.min(row.completionPct, 100)}%` }}
                          />
                        </div>
                        <span
                          className={cn(
                            'text-xs font-bold',
                            row.completionPct >= 100
                              ? 'text-success-600 dark:text-success-400'
                              : row.completionPct >= 75
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-danger-600 dark:text-danger-400',
                          )}
                        >
                          {row.completionPct.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    {/* Status */}
                    <td className="py-4 px-6">
                      <span
                        className={cn(
                          'inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded border',
                          row.isEligible && row.incentiveAmount > 0
                            ? 'bg-success-50 text-success-700 border-success-100 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50'
                            : row.isEligible
                              ? 'bg-primary-50 text-primary-700 border-primary-100 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50'
                              : 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50',
                        )}
                      >
                        {row.isEligible && row.incentiveAmount > 0
                          ? 'Incentive'
                          : row.isEligible
                            ? 'Eligible'
                            : 'Not Eligible'}
                      </span>
                    </td>
                    {/* Incentive */}
                    <td className="py-4 px-6 text-right">
                      <span
                        className={cn(
                          'font-bold',
                          row.incentiveAmount > 0
                            ? 'text-success-600 dark:text-success-400'
                            : 'text-neutral-400',
                        )}
                      >
                        {row.incentiveAmount > 0 ? `\u20B9${row.incentiveAmount.toFixed(2)}` : '\u20B90'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
