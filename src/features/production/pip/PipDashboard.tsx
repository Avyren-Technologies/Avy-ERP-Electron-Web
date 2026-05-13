import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Package,
  Cpu,
  Settings2,
  IndianRupee,
  ArrowRight,
  FileText,
  ClipboardList,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { usePipDashboard, usePipDailyEntrySummary } from '@/features/production/pip/api/use-pip-queries';
import type { PipDashboardMetrics } from '@/lib/api/pip';

/* ── Helpers ── */

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDisplayDate(d: Date): string {
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

interface TodayOperatorRow {
  operatorName: string;
  parts: { partNumber: string; qty: number }[];
  completionPct: number;
  incentiveAmount: number;
}

function parseTodayRows(data: Record<string, unknown> | undefined): TodayOperatorRow[] {
  if (!data) return [];
  const operators = (data.operators ?? data.entries ?? []) as Record<string, unknown>[];
  return operators.map((op) => ({
    operatorName: String(op.operatorName ?? op.name ?? ''),
    parts: ((op.parts ?? []) as Record<string, unknown>[]).map((p) => ({
      partNumber: String(p.partNumber ?? ''),
      qty: Number(p.qtyProduced ?? p.qty ?? 0),
    })),
    completionPct: Number(op.completionPct ?? op.cumulativeRatio ?? op.achievementPct ?? 0),
    incentiveAmount: Number(op.incentiveAmount ?? op.totalIncentive ?? 0),
  }));
}

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

/* ── Quick Access Tile ── */

function QuickTile({
  label,
  sub,
  icon,
  color,
  borderColor,
  onClick,
}: {
  label: string;
  sub: string;
  icon: React.ReactNode;
  color: string;
  borderColor: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'bg-white dark:bg-neutral-900 rounded-2xl border-2 border-neutral-200/60 dark:border-neutral-800 shadow-sm p-5 text-left transition-all hover:shadow-md group',
        borderColor,
      )}
    >
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', color)}>
        {icon}
      </div>
      <p className="text-sm font-bold text-primary-950 dark:text-white">{label}</p>
      <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">{sub}</p>
      <ArrowRight
        size={14}
        className="mt-2 text-neutral-300 dark:text-neutral-600 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors"
      />
    </button>
  );
}

/* ── Screen ── */

export function PipDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const firstName = user?.firstName ?? 'there';

  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => formatDate(today), [today]);

  const { data: dashData, isLoading: dashLoading } = usePipDashboard();
  const { data: summaryData, isLoading: summaryLoading } = usePipDailyEntrySummary({ entryDate: todayStr });

  const metrics: PipDashboardMetrics | undefined = dashData?.data;
  const todayRows = useMemo(
    () => parseTodayRows(summaryData?.data as Record<string, unknown> | undefined),
    [summaryData],
  );

  const isLoading = dashLoading;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">
            Good morning, {firstName}
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Production Incentive Plan &mdash; Today&apos;s snapshot &middot; {formatDisplayDate(today)}
          </p>
        </div>
        <button
          onClick={() => navigate('/app/company/production/pip/daily-entry')}
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
        >
          <Plus size={16} />
          New Entry
        </button>
      </div>

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
            label="Parts Configured"
            value={metrics?.partCount ?? 0}
            icon={<Package className="w-5 h-5 text-primary-600 dark:text-primary-400" />}
            color="bg-primary-50 dark:bg-primary-900/20"
          />
          <MetricCard
            label="Machines"
            value={metrics?.machineCount ?? 0}
            icon={<Cpu className="w-5 h-5 text-success-600 dark:text-success-400" />}
            color="bg-success-50 dark:bg-success-900/20"
          />
          <MetricCard
            label="Slab Configs"
            value={metrics?.slabConfigCount ?? 0}
            icon={<Settings2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
            color="bg-amber-50 dark:bg-amber-900/20"
          />
          <MetricCard
            label="Today's Incentive"
            value={`\u20B9${Number(metrics?.todayIncentive ?? 0).toFixed(2)}`}
            sub={`${metrics?.todayOperatorCount ?? 0} operators`}
            icon={<IndianRupee className="w-5 h-5 text-danger-600 dark:text-danger-400" />}
            color="bg-danger-50 dark:bg-danger-900/20"
          />
        </div>
      )}

      {/* Two-column: Today's Summary + Quick Access */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Production Summary — takes 2/3 */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-primary-950 dark:text-white">
                Today&apos;s Summary
              </h2>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                Production logged today
              </p>
            </div>
          </div>

          {summaryLoading ? (
            <div className="p-6">
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-12 bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
                ))}
              </div>
            </div>
          ) : todayRows.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-3">
                <ClipboardList className="w-7 h-7 text-neutral-400 dark:text-neutral-500" />
              </div>
              <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
                No entries today
              </p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                Start logging production with the New Entry button.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                    <th className="py-3 px-6 font-bold">Operator</th>
                    <th className="py-3 px-6 font-bold">Parts</th>
                    <th className="py-3 px-6 font-bold">Completion</th>
                    <th className="py-3 px-6 font-bold text-right">Incentive</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {todayRows.map((row, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors"
                    >
                      <td className="py-3 px-6 font-bold text-primary-950 dark:text-white text-xs">
                        {row.operatorName}
                      </td>
                      <td className="py-3 px-6">
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
                      <td className="py-3 px-6">
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
                      </td>
                      <td className="py-3 px-6 text-right">
                        {row.incentiveAmount > 0 ? (
                          <span className="text-xs font-bold text-success-600 dark:text-success-400">
                            {'\u20B9'}{row.incentiveAmount.toFixed(2)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded border bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50">
                            Below target
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Access Tiles — takes 1/3 */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            Quick Access
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            <QuickTile
              label="Part Master"
              sub={`${metrics?.partCount ?? 0} parts`}
              icon={<Package className="w-5 h-5 text-violet-600 dark:text-violet-400" />}
              color="bg-violet-50 dark:bg-violet-900/20"
              borderColor="hover:border-violet-300 dark:hover:border-violet-700"
              onClick={() => navigate('/app/company/masters/parts')}
            />
            <QuickTile
              label="Slab Config"
              sub="Incentive tiers"
              icon={<Settings2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
              color="bg-amber-50 dark:bg-amber-900/20"
              borderColor="hover:border-amber-300 dark:hover:border-amber-700"
              onClick={() => navigate('/app/company/production/pip/slab-config')}
            />
            <QuickTile
              label="Daily Entry"
              sub="Log production"
              icon={<ClipboardList className="w-5 h-5 text-success-600 dark:text-success-400" />}
              color="bg-success-50 dark:bg-success-900/20"
              borderColor="hover:border-success-300 dark:hover:border-success-700"
              onClick={() => navigate('/app/company/production/pip/daily-entry')}
            />
            <QuickTile
              label="Reports"
              sub="Incentive summaries"
              icon={<BarChart3 className="w-5 h-5 text-primary-600 dark:text-primary-400" />}
              color="bg-primary-50 dark:bg-primary-900/20"
              borderColor="hover:border-primary-300 dark:hover:border-primary-700"
              onClick={() => navigate('/app/company/production/pip/summary-report')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
