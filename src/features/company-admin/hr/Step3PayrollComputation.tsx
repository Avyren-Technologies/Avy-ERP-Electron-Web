import { useMemo, useState, useRef, useEffect } from 'react';
import {
    Calculator,
    Banknote,
    TrendingDown,
    TrendingUp,
    Users,
    Info,
    AlertTriangle,
    BookOpen,
    ChevronDown,
    ChevronRight,
    ChevronLeft,
    ChevronsLeft,
    ChevronsRight,
    Eye,
    Search,
    Filter,
    RefreshCcw,
    Download,
    Save,
    Loader2,
    ArrowRight,
    ArrowLeft,
    Headphones,
    Phone,
    Mail,
    RotateCcw,
    Calendar,
    Clock,
    CheckCircle2,
    Sparkles,
    Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useComputeSummary, usePayrollEntries } from '@/features/company-admin/api/use-payroll-run-queries';
import { useResetToCompute } from '@/features/company-admin/api/use-payroll-run-mutations';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { showSuccess, showApiError } from '@/lib/toast';

interface StepProps {
    runId: string;
    runDetail: any;
    completedStep: number;
    onStepAction: () => void;
    anyMutating: boolean;
}

const formatINR = (v: unknown): string => `₹${(Number(v) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const formatINRCompact = (v: unknown): string => {
    const n = Number(v) || 0;
    if (Math.abs(n) >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
    if (Math.abs(n) >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
    if (Math.abs(n) >= 1e3) return `₹${(n / 1e3).toFixed(1)}K`;
    return formatINR(n);
};

/* ──────────────────────────────────────────────────────────────────────── */
/* Atoms                                                                    */
/* ──────────────────────────────────────────────────────────────────────── */

function StatTile({
    icon: Icon, label, value, sub, tint,
}: { icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; label: string; value: React.ReactNode; sub?: React.ReactNode; tint: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'emerald' }) {
    const tintMap = {
        primary: 'bg-primary-50 text-primary-600',
        success: 'bg-success-50 text-success-600',
        warning: 'bg-warning-50 text-warning-600',
        danger:  'bg-danger-50 text-danger-600',
        info:    'bg-info-50 text-info-600',
        accent:  'bg-accent-50 text-accent-600',
        emerald: 'bg-emerald-50 text-emerald-600',
    } as const;
    return (
        <div className="rounded-2xl bg-white px-4 py-4 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-3">
                <div className={cn('w-11 h-11 rounded-full flex items-center justify-center shrink-0', tintMap[tint])}>
                    <Icon className="w-5 h-5" strokeWidth={2.2} />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-[10.5px] font-bold uppercase tracking-wider text-neutral-500 leading-tight">{label}</div>
                    <div className="mt-0.5 text-2xl font-extrabold text-neutral-900 leading-none tabular-nums">{value}</div>
                    {sub && <div className="text-[11px] text-neutral-500 mt-0.5">{sub}</div>}
                </div>
            </div>
        </div>
    );
}

function PayrollActionsDropdown({ onRefresh, onExport, onReset, allowReset }: { onRefresh: () => void; onExport: () => void; onReset: () => void; allowReset: boolean }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!open) return;
        const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, [open]);
    return (
        <div className="relative" ref={ref}>
            <button onClick={() => setOpen(o => !o)}
                className="inline-flex items-center gap-2 rounded-lg border border-primary-200 bg-white px-4 py-2 text-sm font-semibold text-primary-700 shadow-sm hover:bg-primary-50">
                Payroll Actions <ChevronDown className={cn('w-4 h-4 transition-transform', open && 'rotate-180')} />
            </button>
            {open && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-lg z-30">
                    <button onClick={() => { setOpen(false); onRefresh(); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                        <RefreshCcw className="w-4 h-4" /> Refresh Computation
                    </button>
                    <button onClick={() => { setOpen(false); onExport(); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                        <Download className="w-4 h-4" /> Export Salary Sheet
                    </button>
                    {allowReset && (
                        <button onClick={() => { setOpen(false); onReset(); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-warning-700 hover:bg-warning-50">
                            <RotateCcw className="w-4 h-4" /> Reset to Recompute
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

function BreakdownBar({ label, amount, total, color }: { label: string; amount: number; total: number; color: string }) {
    const pct = total > 0 ? (amount / total) * 100 : 0;
    return (
        <div>
            <div className="flex items-center justify-between text-[12px] mb-1">
                <span className="text-neutral-700">{label}</span>
                <span className="font-bold text-neutral-900 font-mono">{formatINR(amount)}</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
            </div>
        </div>
    );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Main component                                                           */
/* ──────────────────────────────────────────────────────────────────────── */

export function Step3PayrollComputation({ runId, runDetail, completedStep, onStepAction, anyMutating }: StepProps) {
    const fmt = useCompanyFormatter();
    const isComputed = completedStep >= 3;

    const summaryQuery = useComputeSummary(runId);
    const entriesQuery = usePayrollEntries(runId);
    const resetMutation = useResetToCompute();

    const [search, setSearchInput] = useState('');
    const [debounced, setDebounced] = useState('');
    const [tab, setTab] = useState<'all' | 'exceptions'>('all');
    const [page, setPage] = useState(1);
    const pageSize = 10;

    useEffect(() => {
        const t = setTimeout(() => { setDebounced(search); setPage(1); }, 300);
        return () => clearTimeout(t);
    }, [search]);

    const summary: any = summaryQuery.data?.data ?? null;
    const entries: any[] = useMemo(() => {
        const env: any = entriesQuery.data;
        const arr = env?.data ?? env;
        return Array.isArray(arr) ? arr : [];
    }, [entriesQuery.data]);

    const totalGross         = Number(summary?.totalGross ?? runDetail?.totalGross ?? 0);
    const totalDeductions    = Number(summary?.totalDeductions ?? runDetail?.totalDeductions ?? 0);
    const totalNet           = Number(summary?.totalNet ?? runDetail?.totalNet ?? 0);
    const totalEmployerCost  = Number(summary?.totalEmployerCost ?? runDetail?.totalEmployerCost ?? 0);

    const earningsBreakdown: Record<string, number> = summary?.earningsBreakdown ?? {};
    const deductionsBreakdown: Record<string, number> = summary?.deductionsBreakdown ?? {};

    const topEarnings = Object.entries(earningsBreakdown).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topDeductions = Object.entries(deductionsBreakdown).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const exceptionRows: any[] = summary?.computeExceptions ?? [];
    const exceptionCount = exceptionRows.length;

    const employeeRows: any[] = useMemo(() => {
        if (summary?.employeeRows && Array.isArray(summary.employeeRows)) return summary.employeeRows;
        return entries.map((e) => ({
            employeeId: e.employeeId,
            employeeName: `${e.employee?.firstName ?? ''} ${e.employee?.lastName ?? ''}`.trim() || e.employeeCode || '—',
            department: e.employee?.department?.name ?? null,
            designation: e.employee?.designation?.name ?? null,
            grossEarnings: Number(e.grossEarnings ?? 0),
            totalDeductions: Number(e.totalDeductions ?? 0),
            netPay: Number(e.netPay ?? 0),
            isException: !!e.isException,
            exceptionNote: e.exceptionNote ?? null,
            employeeCode: e.employee?.employeeId ?? e.employeeCode ?? '—',
        }));
    }, [summary, entries]);

    const filtered = useMemo(() => {
        return employeeRows.filter((r) => {
            if (debounced) {
                const q = debounced.toLowerCase();
                if (!(r.employeeName ?? '').toLowerCase().includes(q) &&
                    !(r.employeeCode ?? '').toLowerCase().includes(q) &&
                    !(r.department ?? '').toLowerCase().includes(q)) return false;
            }
            if (tab === 'exceptions') return !!r.isException;
            return true;
        });
    }, [employeeRows, debounced, tab]);

    const totalFiltered = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
    const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

    const inputs = summary?.inputsCounts ?? {};

    const onRefresh = () => { summaryQuery.refetch(); entriesQuery.refetch(); };
    const onExport = () => window.print();
    const onReset = () => {
        if (!confirm('Reset will return this run to EXCEPTIONS_REVIEWED so you can re-run computation. Continue?')) return;
        resetMutation.mutate(runId, {
            onSuccess: () => { showSuccess('Reset complete', 'You can now recompute salaries.'); onRefresh(); },
            onError: (err) => showApiError(err),
        });
    };

    const employeeCount = summary?.employeeRows?.length ?? entries.length ?? runDetail?.employeeCount ?? 0;
    const avgNetPay = employeeCount > 0 ? totalNet / employeeCount : 0;

    const isLoading = (summaryQuery.isLoading || entriesQuery.isLoading) && !summary;

    return (
        <div className="space-y-5">
            {/* Step header + About */}
            <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
                <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <div className="text-[11px] font-bold uppercase tracking-wider text-primary-600">Step 3 of 6</div>
                            <h2 className="mt-1 text-xl font-bold text-neutral-900">Compute Salaries</h2>
                            <p className="mt-1.5 text-[13px] text-neutral-600 max-w-2xl leading-snug">
                                Preview gross, deductions and net for every active employee. Re-run computation if you've
                                updated inputs upstream. Once you proceed, the computed entries are locked for statutory processing.
                            </p>
                        </div>
                        <PayrollActionsDropdown onRefresh={onRefresh} onExport={onExport} onReset={onReset} allowReset={isComputed} />
                    </div>

                    {/* Period meta */}
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 rounded-xl bg-neutral-50/70 p-3 ring-1 ring-neutral-100">
                        <MetaPill icon={Calendar} label="Payroll Period" value={runDetail?.month && runDetail?.year ? `${fmt.date(new Date(runDetail.year, runDetail.month - 1, 1).toISOString())} – ${fmt.date(new Date(runDetail.year, runDetail.month, 0).toISOString())}` : '—'} tint="info" />
                        <MetaPill icon={Users} label="Employees" value={String(employeeCount)} tint="primary" />
                        <MetaPill icon={Sparkles} label="Avg Net Pay" value={formatINRCompact(avgNetPay)} tint="success" />
                        <MetaPill icon={Clock} label="Run Status" value={isComputed ? 'Computed' : 'Pending'} tint={isComputed ? 'success' : 'warning'} />
                    </div>
                </div>

                <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-info-50 text-info-600 flex items-center justify-center">
                            <Info className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-bold text-neutral-900">About this step</h3>
                    </div>
                    <p className="text-[12.5px] text-neutral-600 leading-relaxed">
                        Salary computation aggregates attendance, salary structure, expense claims, arrears, overtime,
                        holds and loan EMIs into one PayrollEntry per employee.
                    </p>
                    <a href="#" className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-semibold text-primary-600 hover:text-primary-700">
                        <BookOpen className="w-3.5 h-3.5" /> Learn more →
                    </a>
                </div>
            </div>

            {/* KPI strip */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
                <StatTile icon={Banknote}      label="Total Gross"     value={formatINRCompact(totalGross)}        sub={formatINR(totalGross)}     tint="primary" />
                <StatTile icon={TrendingDown}  label="Total Deductions" value={formatINRCompact(totalDeductions)}  sub={formatINR(totalDeductions)} tint="danger" />
                <StatTile icon={Wallet}        label="Total Net Pay"    value={formatINRCompact(totalNet)}         sub={formatINR(totalNet)}        tint="success" />
                <StatTile icon={TrendingUp}    label="Employer Cost"    value={formatINRCompact(totalEmployerCost)} sub={formatINR(totalEmployerCost)} tint="accent" />
                <StatTile icon={AlertTriangle} label="Compute Issues"   value={exceptionCount}                      sub={exceptionCount > 0 ? 'Review before lock' : 'All clean'} tint={exceptionCount > 0 ? 'warning' : 'success'} />
            </div>

            {/* Two-column main */}
            <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
                <div className="rounded-2xl bg-white ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
                    {/* Tabs */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 px-5 pt-4">
                        <div className="flex gap-6">
                            {([
                                { id: 'all',        label: 'All Employees',      count: employeeRows.length },
                                { id: 'exceptions', label: 'Computation Issues', count: exceptionCount },
                            ] as const).map(t => (
                                <button key={t.id} onClick={() => { setTab(t.id); setPage(1); }}
                                    className={cn('pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap',
                                        tab === t.id ? 'border-primary-600 text-primary-700' : 'border-transparent text-neutral-500 hover:text-neutral-800')}>
                                    {t.label} <span className="text-[11px] font-semibold text-neutral-400">({t.count})</span>
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 pb-3">
                            <button className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50">
                                <Filter className="w-3 h-3" /> Filters
                            </button>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                                <input
                                    value={search}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    placeholder="Search employees…"
                                    className="w-56 rounded-lg border border-neutral-200 bg-white pl-8 pr-3 py-1.5 text-xs text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        {isLoading ? (
                            <div className="p-5"><SkeletonTable rows={6} cols={6} /></div>
                        ) : paged.length === 0 ? (
                            <div className="px-6 py-12 text-center text-sm text-neutral-500">
                                {employeeRows.length === 0 ? 'No computed entries yet. Click "Compute Salaries" to generate them.' : 'No employees match your filters.'}
                            </div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 bg-neutral-50/60">
                                        <th className="px-4 py-3 whitespace-nowrap">Employee ID</th>
                                        <th className="px-4 py-3">Employee Name</th>
                                        <th className="px-4 py-3 hidden md:table-cell">Department</th>
                                        <th className="px-4 py-3 whitespace-nowrap text-right">Gross</th>
                                        <th className="px-4 py-3 whitespace-nowrap text-right">Deductions</th>
                                        <th className="px-4 py-3 whitespace-nowrap text-right">Net Pay</th>
                                        <th className="px-4 py-3 whitespace-nowrap">Status</th>
                                        <th className="px-4 py-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100">
                                    {paged.map((r, i) => (
                                        <tr key={r.employeeId ?? i} className={cn('group hover:bg-neutral-50/60', r.isException && 'bg-warning-50/30')}>
                                            <td className="px-4 py-3.5 text-[12.5px] font-semibold text-neutral-700 whitespace-nowrap font-mono">{r.employeeCode}</td>
                                            <td className="px-4 py-3.5 text-[13px] font-semibold text-neutral-900 whitespace-nowrap">{r.employeeName}</td>
                                            <td className="px-4 py-3.5 text-[12.5px] text-neutral-600 hidden md:table-cell">{r.department ?? '—'}</td>
                                            <td className="px-4 py-3.5 text-[12.5px] text-neutral-700 font-mono text-right whitespace-nowrap">{formatINR(r.grossEarnings)}</td>
                                            <td className="px-4 py-3.5 text-[12.5px] text-danger-700 font-mono text-right whitespace-nowrap">-{formatINR(r.totalDeductions)}</td>
                                            <td className="px-4 py-3.5 text-[13px] font-bold text-success-700 font-mono text-right whitespace-nowrap">{formatINR(r.netPay)}</td>
                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                {r.isException ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-warning-50 px-2.5 py-1 text-[11px] font-semibold text-warning-700 ring-1 ring-warning-200">
                                                        <AlertTriangle className="w-3 h-3" /> Issue
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2.5 py-1 text-[11px] font-semibold text-success-700 ring-1 ring-success-200">
                                                        <CheckCircle2 className="w-3 h-3" /> Computed
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5 text-right">
                                                <button className="inline-flex items-center justify-center w-7 h-7 rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-primary-600">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {totalFiltered > 0 && (
                        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-neutral-100">
                            <span className="text-[12px] text-neutral-500">
                                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalFiltered)} of {totalFiltered} employees
                            </span>
                            <div className="flex items-center gap-1">
                                <PaginationBtn disabled={page === 1} onClick={() => setPage(1)}><ChevronsLeft className="w-3.5 h-3.5" /></PaginationBtn>
                                <PaginationBtn disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="w-3.5 h-3.5" /></PaginationBtn>
                                {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                                    const p = i + 1;
                                    return (
                                        <button key={p} onClick={() => setPage(p)}
                                            className={cn('min-w-[28px] h-7 px-2 rounded-md text-xs font-semibold',
                                                p === page ? 'bg-primary-600 text-white' : 'text-neutral-700 hover:bg-neutral-100')}>
                                            {p}
                                        </button>
                                    );
                                })}
                                {totalPages > 3 && <span className="px-1 text-xs text-neutral-400">…</span>}
                                <PaginationBtn disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="w-3.5 h-3.5" /></PaginationBtn>
                                <PaginationBtn disabled={page === totalPages} onClick={() => setPage(totalPages)}><ChevronsRight className="w-3.5 h-3.5" /></PaginationBtn>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <aside className="space-y-4">
                    {/* Earnings breakdown */}
                    <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                        <h3 className="text-sm font-bold text-neutral-900 mb-3">Top Earnings</h3>
                        {topEarnings.length === 0 ? (
                            <p className="text-[12.5px] text-neutral-500">No data yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {topEarnings.map(([k, v]) => (
                                    <BreakdownBar key={k} label={k} amount={v} total={totalGross} color="#10B981" />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Deductions breakdown */}
                    <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                        <h3 className="text-sm font-bold text-neutral-900 mb-3">Top Deductions</h3>
                        {topDeductions.length === 0 ? (
                            <p className="text-[12.5px] text-neutral-500">No data yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {topDeductions.map(([k, v]) => (
                                    <BreakdownBar key={k} label={k} amount={v} total={totalDeductions} color="#EF4444" />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Inputs ingested */}
                    <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                        <h3 className="text-sm font-bold text-neutral-900 mb-3">Inputs Ingested</h3>
                        <ul className="space-y-2">
                            <InputRow label="Expense Claims" value={inputs.expenseClaimCount ?? 0} />
                            <InputRow label="Arrear Entries" value={inputs.arrearEntryCount ?? 0} />
                            <InputRow label="Overtime Entries" value={inputs.overtimeCount ?? 0} />
                            <InputRow label="Salary Holds" value={inputs.salaryHoldCount ?? 0} />
                            <InputRow label="Loan EMIs" value={inputs.loanDeductionCount ?? 0} />
                        </ul>
                    </div>

                    {/* Need Help */}
                    <div className="relative overflow-hidden rounded-2xl p-5 shadow-lg shadow-primary-500/20">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700" />
                        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
                        <div className="relative">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center">
                                    <Headphones className="w-4 h-4 text-white" />
                                </div>
                                <h3 className="text-sm font-bold text-white">Need Help?</h3>
                            </div>
                            <p className="text-[12.5px] text-white/80 mb-3">Contact Payroll Support Team</p>
                            <a href="mailto:payroll.support@avyerp.com" className="flex items-center gap-2 text-[12.5px] text-white hover:text-white/90"><Mail className="w-3.5 h-3.5" /> payroll.support@avyerp.com</a>
                            <a href="tel:+91 9019189889" className="flex items-center gap-2 text-[12.5px] text-white hover:text-white/90 mt-1.5"><Phone className="w-3.5 h-3.5" /> +91 9019189889</a>
                        </div>
                    </div>
                </aside>
            </div>

            {/* Alerts */}
            {!isComputed && exceptionCount > 0 && (
                <div className="rounded-2xl bg-warning-50/70 p-4 ring-1 ring-warning-200">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-warning-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-warning-800">Compute Issues Detected</p>
                            <p className="text-[12.5px] text-warning-700/90 mt-0.5">
                                {exceptionCount} employee{exceptionCount === 1 ? '' : 's'} flagged with computation variance or override.
                                Review the "Computation Issues" tab before proceeding.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-3 text-[12.5px] text-neutral-600">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Step 2 (Review Exceptions)</span>
                </div>
                <div className="text-[12.5px] text-neutral-500">
                    Total Net Pay: <span className="font-bold text-neutral-900 font-mono">{formatINR(totalNet)}</span> across <span className="font-semibold">{employeeCount}</span> employees
                </div>
                <div className="flex items-center gap-3">
                    <button className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">
                        <Save className="w-3.5 h-3.5" /> Save Progress
                    </button>
                    <button
                        disabled={isComputed || anyMutating}
                        onClick={onStepAction}
                        className={cn(
                            'inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold shadow-sm transition',
                            isComputed
                                ? 'bg-success-100 text-success-700 cursor-default'
                                : 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-primary-500/25 hover:from-primary-700 hover:to-accent-700',
                            anyMutating && 'opacity-60 cursor-not-allowed',
                        )}
                    >
                        {anyMutating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
                        {isComputed ? 'Salaries Computed' : 'Compute Salaries & Lock'}
                        {!isComputed && <ArrowRight className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Small atoms                                                              */
/* ──────────────────────────────────────────────────────────────────────── */

function MetaPill({
    icon: Icon, label, value, tint,
}: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; tint: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'accent' }) {
    const tintMap = {
        primary: 'bg-primary-100 text-primary-600',
        success: 'bg-success-100 text-success-600',
        warning: 'bg-warning-100 text-warning-600',
        danger:  'bg-danger-100 text-danger-600',
        info:    'bg-info-100 text-info-600',
        accent:  'bg-accent-100 text-accent-600',
    } as const;
    return (
        <div className="flex items-center gap-2.5 min-w-0">
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', tintMap[tint])}>
                <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">{label}</div>
                <div className="text-[12.5px] font-bold text-neutral-900 truncate">{value}</div>
            </div>
        </div>
    );
}

function InputRow({ label, value }: { label: string; value: number }) {
    return (
        <li className="flex items-center justify-between text-[12.5px]">
            <span className="text-neutral-700">{label}</span>
            <span className="font-bold text-neutral-900">{value}</span>
        </li>
    );
}

function PaginationBtn({ children, disabled, onClick }: { children: React.ReactNode; disabled?: boolean; onClick: () => void }) {
    return (
        <button
            disabled={disabled}
            onClick={onClick}
            className={cn(
                'inline-flex items-center justify-center w-7 h-7 rounded-md text-neutral-700 hover:bg-neutral-100',
                disabled && 'opacity-40 cursor-not-allowed hover:bg-transparent',
            )}
        >
            {children}
        </button>
    );
}
