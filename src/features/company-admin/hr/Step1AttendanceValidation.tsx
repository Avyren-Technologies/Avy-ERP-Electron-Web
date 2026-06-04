import { useMemo, useState, useRef, useEffect } from 'react';
import {
    Lock,
    Users,
    UserCheck,
    AlertTriangle,
    Calendar,
    Clock,
    Calculator,
    User,
    CheckCircle2,
    Info,
    ChevronDown,
    ChevronRight,
    Eye,
    Search,
    Filter,
    BookOpen,
    TrendingUp,
    TrendingDown,
    ChevronLeft,
    ChevronsLeft,
    ChevronsRight,
    RefreshCcw,
    Download,
    Loader2,
    ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    useAttendanceSummary,
    useAttendanceDetail,
    useBulkLockAttendance,
    useBulkUnlockAttendance,
} from '@/features/company-admin/api/use-payroll-run-queries';
import { payrollRunApi } from '@/lib/api/payroll-run';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { BulkActionsDropdown } from './payroll-wizard-modals';
import { showSuccess, showApiError } from '@/lib/toast';

const CUID_RE = /^c[a-z0-9]{24}$/i;
const looksLikeCuid = (v: unknown): boolean => typeof v === 'string' && CUID_RE.test(v);

interface StepProps {
    runId: string;
    runDetail: any;
    completedStep: number;
    onStepAction: () => void;
    anyMutating: boolean;
}

const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/* ──────────────────────────────────────────────────────────────────────── */
/* Atoms                                                                    */
/* ──────────────────────────────────────────────────────────────────────── */

function StatTile({
    icon: Icon, label, value, sub, tint = 'primary', valueTitle,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: React.ReactNode;
    sub?: string;
    tint?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'accent';
    valueTitle?: string;
}) {
    const tintMap = {
        primary: 'bg-primary-50 text-primary-600',
        success: 'bg-success-50 text-success-600',
        warning: 'bg-warning-50 text-warning-600',
        danger:  'bg-danger-50 text-danger-600',
        info:    'bg-info-50 text-info-600',
        accent:  'bg-accent-50 text-accent-600',
    } as const;
    return (
        <div className="flex items-start gap-3 rounded-2xl bg-white p-4 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', tintMap[tint])}>
                <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
                <div className="text-[10.5px] font-bold uppercase tracking-wider text-neutral-500">{label}</div>
                <div
                    className="text-xl font-bold text-neutral-900 mt-0.5 leading-tight truncate"
                    title={valueTitle ?? (typeof value === 'string' || typeof value === 'number' ? String(value) : undefined)}
                >
                    {value}
                </div>
                {sub && <div className="text-[11px] text-neutral-500 mt-0.5 truncate" title={sub}>{sub}</div>}
            </div>
        </div>
    );
}

function StatusPill({ status }: { status: 'OK' | 'HAS_ISSUES' | 'NO_DATA' | 'OVERRIDE' }) {
    if (status === 'OK') {
        return <span className="inline-flex items-center rounded-full bg-success-50 px-2.5 py-1 text-[11px] font-semibold text-success-700 ring-1 ring-success-200">Ready</span>;
    }
    if (status === 'OVERRIDE') {
        return <span className="inline-flex items-center rounded-full bg-warning-50 px-2.5 py-1 text-[11px] font-semibold text-warning-700 ring-1 ring-warning-200">Override</span>;
    }
    if (status === 'HAS_ISSUES') {
        return <span className="inline-flex items-center rounded-full bg-danger-50 px-2.5 py-1 text-[11px] font-semibold text-danger-700 ring-1 ring-danger-200">Issues</span>;
    }
    return <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-600 ring-1 ring-neutral-200">No Data</span>;
}

function PayrollActionsDropdown({ onRefresh, onExport }: { onRefresh: () => void; onExport: () => void }) {
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
            <button
                onClick={() => setOpen(o => !o)}
                className="inline-flex items-center gap-2 rounded-lg border border-primary-200 bg-white px-4 py-2 text-sm font-semibold text-primary-700 shadow-sm transition hover:bg-primary-50"
            >
                Payroll Actions <ChevronDown className={cn('w-4 h-4 transition-transform', open && 'rotate-180')} />
            </button>
            {open && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-lg ring-1 ring-black/5 z-30">
                    <button onClick={() => { setOpen(false); onRefresh(); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                        <RefreshCcw className="w-4 h-4" /> Refresh Data
                    </button>
                    <button onClick={() => { setOpen(false); onExport(); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                        <Download className="w-4 h-4" /> Export Attendance
                    </button>
                </div>
            )}
        </div>
    );
}

function LockSummaryDonut({ ready, override, notReady }: { ready: number; override: number; notReady: number }) {
    const total = ready + override + notReady;
    const radius = 38;
    const circ = 2 * Math.PI * radius;
    const safeTotal = total || 1;
    const readyLen = (ready / safeTotal) * circ;
    const overrideLen = (override / safeTotal) * circ;
    return (
        <div className="relative w-[130px] h-[130px] shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r={radius} fill="none" stroke="#E2E8F0" strokeWidth="10" />
                {total > 0 && (
                    <>
                        <circle cx="50" cy="50" r={radius} fill="none" stroke="#10B981" strokeWidth="10"
                            strokeDasharray={`${readyLen} ${circ - readyLen}`} strokeDashoffset={0} />
                        <circle cx="50" cy="50" r={radius} fill="none" stroke="#F59E0B" strokeWidth="10"
                            strokeDasharray={`${overrideLen} ${circ - overrideLen}`} strokeDashoffset={-readyLen} />
                    </>
                )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-neutral-900 leading-none">{ready}</span>
                <span className="text-[10px] font-bold text-neutral-500 mt-1 tracking-wider">
                    {total > 0 ? `(${((ready / total) * 100).toFixed(2)}%)` : '—'}
                </span>
                <span className="text-[10px] text-neutral-500 mt-0.5">Ready to Lock</span>
            </div>
        </div>
    );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Main component                                                           */
/* ──────────────────────────────────────────────────────────────────────── */

export function Step1AttendanceValidation({ runId, runDetail, completedStep, onStepAction, anyMutating }: StepProps) {
    const fmt = useCompanyFormatter();
    const [activeTab, setActiveTab] = useState<'attendance' | 'overrides' | 'history'>('attendance');
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const limit = 8;

    /* Filters / selection / bulk actions state */
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'all' | 'OK' | 'HAS_ISSUES' | 'OVERRIDE' | 'NO_DATA'>('all');
    const [departmentFilter, setDepartmentFilter] = useState<string>('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [bulkOpen, setBulkOpen] = useState(false);
    const [lockDisclosureOpen, setLockDisclosureOpen] = useState(true);
    /* Row "view details" modal — shows why this employee row is NO_DATA / HAS_ISSUES */
    const [detailRow, setDetailRow] = useState<any | null>(null);

    /* Debounced search input */
    const debounceRef = useRef<number | null>(null);
    useEffect(() => {
        if (debounceRef.current) window.clearTimeout(debounceRef.current);
        debounceRef.current = window.setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, 300);
        return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
    }, [searchInput]);

    const { data: summaryResp, isLoading: summaryLoading, refetch: refetchSummary } = useAttendanceSummary(runId);
    const { data: detailResp, isLoading: detailLoading, isFetching: detailFetching, refetch: refetchDetail } =
        useAttendanceDetail(runId, {
            page,
            limit,
            search: search || undefined,
            ...(departmentFilter ? { department: departmentFilter } : {}),
        });

    const bulkLockMutation = useBulkLockAttendance();
    const bulkUnlockMutation = useBulkUnlockAttendance();
    const [exporting, setExporting] = useState(false);

    const summary = summaryResp?.data;
    const detail = detailResp?.data;

    const employees: any[] = detail?.employees ?? [];
    const totalEmployees = detail?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalEmployees / limit));

    /* Client-side status filter (server-side support would be ideal but is not exposed yet) */
    const filteredEmployees = useMemo(() => {
        if (statusFilter === 'all') return employees;
        return employees.filter(e => e.status === statusFilter);
    }, [employees, statusFilter]);

    /* GLOBAL counts — sourced from /attendance-summary endpoint, NOT current page rows */
    const globalCounts = useMemo(() => {
        const lockStatus: any = (summaryResp?.data as any)?.lockStatus ?? {};
        const ready = Number(lockStatus.ready ?? 0);
        const notReady = Number(lockStatus.notReady ?? lockStatus.has_issues ?? 0);
        const noData = Number(lockStatus.noData ?? 0);
        const total = ready + notReady + noData;
        return { ready, notReady, noData, total };
    }, [summaryResp]);

    /* Lock summary chart — always from global /attendance-summary lockStatus */
    const lockChartReady = globalCounts.ready;
    const lockChartNotReady = globalCounts.notReady + globalCounts.noData;
    const lockChartDenom = Math.max(1, globalCounts.total);

    /* Available departments for filter (from current page — caveat noted in report) */
    const departmentOptions = useMemo(() => {
        const set = new Set<string>();
        employees.forEach(e => { if (e.department) set.add(e.department); });
        return Array.from(set).sort();
    }, [employees]);

    const overridePending = summary?.overrideSummary?.pending ?? 0;
    const overrideApproved = summary?.overrideSummary?.approved ?? 0;
    const overrideRejected = summary?.overrideSummary?.rejected ?? 0;
    const overrideTotal = summary?.overrideSummary?.total ?? (overridePending + overrideApproved + overrideRejected);

    const totalActive = summary?.headcount?.totalActive ?? 0;
    const withSalary = summary?.headcount?.withSalary ?? 0;
    const attendancePresent = summary?.attendance?.employeesWithAttendance ?? 0;
    const totalLOP = summary?.attendance?.lop ?? 0;

    const month = runDetail?.month;
    const year = runDetail?.year;
    const monthStart = month && year ? new Date(year, month - 1, 1) : null;
    const monthEnd = month && year ? new Date(year, month, 0) : null;
    const cutoffDate = monthEnd;

    /* Prefer joined name; fall back defensively to a label if backend returned only the CUID */
    const lockedByRaw = runDetail?.lockedByName ?? runDetail?.lockedBy ?? null;
    const lockedBy = looksLikeCuid(lockedByRaw) ? 'Unknown User' : lockedByRaw;
    const lockedAt = runDetail?.lockedAt;

    const vs = summary?.vsLastMonth;
    const presentDelta = vs ? (vs.currentAvgPresent - vs.previousAvgPresent) : 0;
    const presentPct = vs?.changePercent ?? 0;
    const currentTotalLOP = vs?.currentTotalLOP ?? totalLOP;
    const previousTotalLOP = vs?.previousTotalLOP ?? 0;
    const lopDelta = currentTotalLOP - previousTotalLOP;
    const lopPct = previousTotalLOP > 0 ? ((lopDelta / previousTotalLOP) * 100) : 0;

    const isAlreadyLocked = completedStep >= 1;
    const presentPercent = withSalary > 0 ? ((attendancePresent / withSalary) * 100).toFixed(2) : '0.00';

    const onRefresh = () => { refetchSummary(); refetchDetail(); };

    /* Download a Blob using the standard object-URL + anchor click + revoke pattern. */
    const downloadBlob = (blob: Blob, filename: string) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    const exportFilename = () => {
        const m = runDetail?.month;
        const y = runDetail?.year;
        const period = m && y ? `${y}-${String(m).padStart(2, '0')}` : 'period';
        return `attendance-${period}.xlsx`;
    };

    const onExport = async () => {
        if (!runId) return;
        try {
            setExporting(true);
            const blob = await payrollRunApi.exportAttendance(runId);
            downloadBlob(blob, exportFilename());
            showSuccess('Export ready', 'Attendance Excel downloaded.');
        } catch (err) {
            showApiError(err);
        } finally {
            setExporting(false);
        }
    };

    /* Selection helpers */
    const visibleIds = filteredEmployees.map(e => e.employeeId);
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.has(id));
    const someVisibleSelected = visibleIds.some(id => selectedIds.has(id));
    const toggleSelectAll = () => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (allVisibleSelected) {
                visibleIds.forEach(id => next.delete(id));
            } else {
                visibleIds.forEach(id => next.add(id));
            }
            return next;
        });
    };
    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const onBulkLock = () => {
        const ids = Array.from(selectedIds);
        if (ids.length === 0) return;
        bulkLockMutation.mutate(
            { runId, employeeIds: ids },
            {
                onSuccess: () => {
                    showSuccess('Attendance Locked', `Locked attendance for ${ids.length} employee(s).`);
                    setSelectedIds(new Set());
                    refetchSummary();
                    refetchDetail();
                },
                onError: (err) => showApiError(err),
            },
        );
    };
    const onBulkUnlock = () => {
        const ids = Array.from(selectedIds);
        if (ids.length === 0) return;
        bulkUnlockMutation.mutate(
            { runId, employeeIds: ids },
            {
                onSuccess: () => {
                    showSuccess('Attendance Unlocked', `Unlocked attendance for ${ids.length} employee(s).`);
                    setSelectedIds(new Set());
                    refetchSummary();
                    refetchDetail();
                },
                onError: (err) => showApiError(err),
            },
        );
    };
    const onBulkExport = async () => {
        const ids = Array.from(selectedIds);
        if (!runId) return;
        try {
            setExporting(true);
            const blob = await payrollRunApi.exportAttendance(runId, ids);
            downloadBlob(blob, exportFilename());
            showSuccess('Export ready', `Exported ${ids.length || 'all'} record(s).`);
        } catch (err) {
            showApiError(err);
        } finally {
            setExporting(false);
        }
    };

    /* Reset selection when filters/search/page change */
    useEffect(() => { setSelectedIds(new Set()); }, [search, statusFilter, departmentFilter, page]);

    /* Indeterminate checkbox effect */
    const selectAllRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        if (selectAllRef.current) {
            selectAllRef.current.indeterminate = !allVisibleSelected && someVisibleSelected;
        }
    }, [allVisibleSelected, someVisibleSelected]);

    return (
        <div className="space-y-5">
            {/* ── Step header + About sidebar ───────────────────────── */}
            <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
                <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <div className="text-[11px] font-bold uppercase tracking-wider text-primary-600">Step 1 of 6</div>
                            <h2 className="mt-1 text-xl font-bold text-neutral-900">Lock Attendance</h2>
                            <p className="mt-1.5 text-[13px] text-neutral-600 max-w-2xl leading-snug">
                                Freeze attendance for the selected payroll period. You can apply manual overrides with
                                reason and approval where required. Once locked, no further changes will be allowed
                                unless unlocked by an authorized approver.
                            </p>
                        </div>
                        <PayrollActionsDropdown onRefresh={onRefresh} onExport={onExport} />
                    </div>

                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 rounded-xl bg-neutral-50/70 p-3 ring-1 ring-neutral-100">
                        <MetaPill icon={Calendar}      label="Payroll Period" value={monthStart && monthEnd ? `${fmt.date(monthStart.toISOString())} – ${fmt.date(monthEnd.toISOString())}` : '—'} tint="info" />
                        <MetaPill icon={Clock}         label="Cut-off Day"    value={cutoffDate ? fmt.date(cutoffDate.toISOString()) : '—'} tint="accent" />
                        <MetaPill
                            icon={Calculator}
                            label="LOP Method"
                            value="÷ Working Days"
                            tint="warning"
                            tooltip="LOP = (Basic Salary ÷ Working Days in Month) × LOP Days. Working Days excludes weekly offs and holidays."
                        />
                        <MetaPill icon={CheckCircle2} label="Pro-rata Rules" value="Enabled" tint="success" />
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
                        Locking attendance ensures no further changes can be made to attendance for this period without approval.
                    </p>
                    <a href="#" className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-semibold text-primary-600 hover:text-primary-700">
                        <BookOpen className="w-3.5 h-3.5" /> Learn more →
                    </a>
                </div>
            </div>

            {/* ── KPI strip ─────────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                <StatTile icon={Users}         label="Total Employees"      value={totalActive}    sub="Active Employees" tint="primary" />
                <StatTile icon={UserCheck}     label="Attendance Available"
                    value={<span>{attendancePresent} <span className="text-[12px] text-success-600 font-semibold">({presentPercent}%)</span></span>}
                    sub="Employees" tint="success" />
                <StatTile icon={AlertTriangle} label="Manual Overrides"     value={overrideTotal}
                    sub={overridePending > 0 ? `(${overridePending} Pending Approval)` : 'All approved'} tint="warning" />
                <StatTile icon={Calculator}    label="LOP Days (Total)"     value={totalLOP.toFixed(1)} sub="Across all employees" tint="danger" />
                <StatTile icon={User}          label="Attendance Locked By"
                    value={isAlreadyLocked ? (lockedBy ?? '—') : '—'}
                    valueTitle={isAlreadyLocked ? (lockedBy ?? '—') : 'Not Locked Yet'}
                    sub={isAlreadyLocked ? 'See activity log' : 'Not Locked Yet'} tint="info" />
                <StatTile icon={Clock}         label="Attendance Locked On"
                    value={isAlreadyLocked && lockedAt ? fmt.date(lockedAt) : '—'}
                    sub={isAlreadyLocked && lockedAt ? fmt.time(lockedAt) : 'Not Locked Yet'} tint="accent" />
            </div>

            {/* ── Main two-column layout ────────────────────────────── */}
            <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
                {/* Tabs + table */}
                <div className="rounded-2xl bg-white ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 px-5 pt-4">
                        <div className="flex gap-6">
                            {([
                                { id: 'attendance', label: 'Employee Attendance Summary' },
                                { id: 'overrides',  label: 'Overrides', count: overridePending },
                                { id: 'history',    label: 'Approval History' },
                            ] as const).map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setActiveTab(t.id)}
                                    className={cn(
                                        'pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap',
                                        activeTab === t.id ? 'border-primary-600 text-primary-700' : 'border-transparent text-neutral-500 hover:text-neutral-800',
                                    )}
                                >
                                    {t.label}
                                    {('count' in t) && t.count > 0 && (
                                        <span className={cn(
                                            'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold',
                                            activeTab === t.id ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-600',
                                        )}>{t.count}</span>
                                    )}
                                </button>
                            ))}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 pb-3">
                            <BulkActionsDropdown
                                open={bulkOpen}
                                onToggle={() => setBulkOpen(o => !o)}
                                onClose={() => setBulkOpen(false)}
                                selectedCount={selectedIds.size}
                                onLock={onBulkLock}
                                onUnlock={onBulkUnlock}
                                onExport={onBulkExport}
                            />
                            <button
                                onClick={() => setFiltersOpen(o => !o)}
                                className={cn(
                                    'inline-flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold transition',
                                    filtersOpen ? 'border-primary-300 bg-primary-50 text-primary-700' : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50',
                                )}
                            >
                                <Filter className="w-3 h-3" /> Filters
                                {(statusFilter !== 'all' || departmentFilter) && (
                                    <span className="rounded-full bg-primary-100 text-primary-700 px-1.5 text-[10px] font-bold">
                                        {[statusFilter !== 'all', !!departmentFilter].filter(Boolean).length}
                                    </span>
                                )}
                            </button>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                                <input
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    placeholder="Search employees…"
                                    className="w-56 rounded-lg border border-neutral-200 bg-white pl-8 pr-3 py-1.5 text-xs text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
                                />
                            </div>
                        </div>
                    </div>

                    {filtersOpen && (
                        <div className="border-b border-neutral-100 bg-neutral-50/40 px-5 py-3 flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Status</label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }}
                                    className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-200"
                                >
                                    <option value="all">All</option>
                                    <option value="OK">Ready</option>
                                    <option value="HAS_ISSUES">Issues</option>
                                    <option value="OVERRIDE">Override</option>
                                    <option value="NO_DATA">No Data</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Department</label>
                                <select
                                    value={departmentFilter}
                                    onChange={(e) => { setDepartmentFilter(e.target.value); setPage(1); }}
                                    className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-200"
                                >
                                    <option value="">All Departments</option>
                                    {departmentOptions.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            {(statusFilter !== 'all' || departmentFilter) && (
                                <button
                                    onClick={() => { setStatusFilter('all'); setDepartmentFilter(''); setPage(1); }}
                                    className="ml-auto text-[11.5px] font-semibold text-primary-600 hover:text-primary-700"
                                >
                                    Reset filters
                                </button>
                            )}
                        </div>
                    )}

                    {activeTab === 'attendance' ? (
                        <>
                            <div className="overflow-x-auto">
                                {detailLoading && !detail ? (
                                    <div className="p-5"><SkeletonTable rows={6} cols={9} /></div>
                                ) : filteredEmployees.length === 0 ? (
                                    <div className="px-6 py-12 text-center text-sm text-neutral-500">
                                        No employees found{search ? ` for "${search}"` : ''}.
                                    </div>
                                ) : (
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 bg-neutral-50/60">
                                                <th className="px-4 py-3 w-10">
                                                    <input
                                                        ref={selectAllRef}
                                                        type="checkbox"
                                                        className="rounded border-neutral-300"
                                                        checked={allVisibleSelected}
                                                        onChange={toggleSelectAll}
                                                        aria-label="Select all visible employees"
                                                    />
                                                </th>
                                                <th className="px-4 py-3 whitespace-nowrap">Employee ID</th>
                                                <th className="px-4 py-3">Employee Name</th>
                                                <th className="px-4 py-3 hidden md:table-cell">Department</th>
                                                <th className="px-4 py-3 whitespace-nowrap">Working Days</th>
                                                <th className="px-4 py-3 whitespace-nowrap">Present</th>
                                                <th className="px-4 py-3 whitespace-nowrap">LOP</th>
                                                <th className="px-4 py-3 whitespace-nowrap hidden lg:table-cell">Overtime (Hrs)</th>
                                                <th className="px-4 py-3 whitespace-nowrap">Status</th>
                                                <th className="px-4 py-3 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className={cn('divide-y divide-neutral-100', detailFetching && 'opacity-60 transition-opacity')}>
                                            {filteredEmployees.map((emp) => {
                                                const hasIssues = emp.status === 'HAS_ISSUES';
                                                const isChecked = selectedIds.has(emp.employeeId);
                                                return (
                                                    <tr key={emp.employeeId} className={cn('group hover:bg-neutral-50/60', isChecked && 'bg-primary-50/30')}>
                                                        <td className="px-4 py-3.5">
                                                            <input
                                                                type="checkbox"
                                                                className="rounded border-neutral-300"
                                                                checked={isChecked}
                                                                onChange={() => toggleSelect(emp.employeeId)}
                                                                aria-label={`Select ${emp.firstName} ${emp.lastName}`}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3.5 text-[12.5px] font-semibold text-neutral-700 whitespace-nowrap">{emp.employeeCode}</td>
                                                        <td className="px-4 py-3.5 text-[13px] font-semibold text-neutral-900 whitespace-nowrap">{emp.firstName} {emp.lastName}</td>
                                                        <td className="px-4 py-3.5 text-[12.5px] text-neutral-600 hidden md:table-cell whitespace-nowrap">{emp.department ?? '—'}</td>
                                                        <td className="px-4 py-3.5 text-[12.5px] text-neutral-700">{emp.workingDays}</td>
                                                        <td className="px-4 py-3.5 text-[12.5px] text-neutral-700">{emp.present}</td>
                                                        <td className={cn('px-4 py-3.5 text-[12.5px] font-semibold', hasIssues ? 'text-danger-600' : 'text-neutral-700')}>
                                                            {emp.lop.toFixed(1)}
                                                        </td>
                                                        <td className="px-4 py-3.5 text-[12.5px] text-neutral-700 hidden lg:table-cell">{emp.otHours.toFixed(1)}</td>
                                                        <td className="px-4 py-3.5"><StatusPill status={emp.status} /></td>
                                                        <td className="px-4 py-3.5 text-right">
                                                            <button
                                                                type="button"
                                                                onClick={() => setDetailRow(emp)}
                                                                title="View attendance details and issue reason"
                                                                aria-label={`View details for ${emp.firstName} ${emp.lastName}`}
                                                                className="inline-flex items-center justify-center w-7 h-7 rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            {totalEmployees > 0 && (
                                <Pagination
                                    page={page}
                                    totalPages={totalPages}
                                    onChange={setPage}
                                    rangeLabel={`Showing ${(page - 1) * limit + 1} to ${Math.min(page * limit, totalEmployees)} of ${totalEmployees} employees`}
                                />
                            )}
                        </>
                    ) : activeTab === 'overrides' ? (
                        <div className="px-6 py-10 text-center text-sm text-neutral-500">
                            <AlertTriangle className="w-8 h-8 mx-auto text-warning-400 mb-2" />
                            {overrideTotal === 0
                                ? 'No manual overrides for this period.'
                                : `${overridePending} pending / ${overrideApproved} approved / ${overrideRejected} rejected — open the Overrides screen to review.`}
                        </div>
                    ) : (
                        <div className="px-6 py-10 text-center text-sm text-neutral-500">
                            <Info className="w-8 h-8 mx-auto text-info-400 mb-2" />
                            Approval history will appear here once overrides are approved or rejected.
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <aside className="space-y-4">
                    <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-1.5 min-w-0">
                                <h3 className="text-sm font-bold text-neutral-900">Attendance Lock Summary</h3>
                                <InfoTooltip content="Company-wide lock readiness for all employees in this payroll run (with current salary). Counts do not change when you paginate or filter the attendance table. Ready = attendance captured with no absent or LOP days. Not Ready = has absent or LOP records. Overrides Pending = manual adjustments awaiting approval." />
                            </div>
                            <span className="text-[10.5px] font-semibold text-neutral-500 shrink-0">Global</span>
                        </div>
                        {summaryLoading ? (
                            <div className="h-[130px] animate-pulse rounded-xl bg-neutral-100" />
                        ) : (
                            <div className="flex items-center gap-4">
                                <LockSummaryDonut ready={lockChartReady} override={overridePending} notReady={lockChartNotReady} />
                                <div className="space-y-2 flex-1 min-w-0">
                                    <LegendRow color="#10B981" label="Ready to Lock"     value={lockChartReady}     pct={(lockChartReady / lockChartDenom) * 100} />
                                    <LegendRow color="#F59E0B" label="Overrides Pending" value={overridePending}    pct={(overridePending / lockChartDenom) * 100} />
                                    <LegendRow color="#EF4444" label="Not Ready"         value={lockChartNotReady}  pct={(lockChartNotReady / lockChartDenom) * 100} />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                        <h3 className="text-sm font-bold text-neutral-900 mb-3">Override Statistics</h3>
                        <OverrideRow color="bg-primary-500" label="Total Overrides"  value={overrideTotal} />
                        <OverrideRow color="bg-success-500" label="Approved"         value={overrideApproved} />
                        <OverrideRow color="bg-warning-500" label="Pending Approval" value={overridePending} />
                        <OverrideRow color="bg-danger-500"  label="Rejected"         value={overrideRejected} />
                        {overrideTotal > 0 && (
                            <a href="#" className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-semibold text-primary-600 hover:text-primary-700">
                                View all overrides <ChevronRight className="w-3.5 h-3.5" />
                            </a>
                        )}
                    </div>

                    <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                        <h3 className="text-sm font-bold text-neutral-900 mb-3">Attendance vs Last Month</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <DeltaTile
                                label="LOP Days"
                                value={currentTotalLOP.toFixed(1)}
                                delta={lopDelta}
                                pct={lopPct}
                                prev={`vs ${prevMonthLabel(month, year)} (${previousTotalLOP.toFixed(1)})`}
                                inverse
                            />
                            <DeltaTile
                                label="Present Days %"
                                value={`${presentPercent}%`}
                                delta={presentDelta}
                                pct={presentPct}
                                prev={`vs ${prevMonthLabel(month, year)} (${(vs?.previousAvgPresent ?? 0).toFixed(1)})`}
                            />
                        </div>
                    </div>
                </aside>
            </div>

            {/* ── Lock Disclosure (what gets locked) ────────────────── */}
            {!isAlreadyLocked && (
                <div className="rounded-2xl bg-info-50/40 p-4 ring-1 ring-info-200">
                    <button
                        type="button"
                        onClick={() => setLockDisclosureOpen(o => !o)}
                        className="flex items-center gap-2 text-[13px] font-semibold text-info-900"
                    >
                        <ShieldAlert className="w-4 h-4 text-info-600" />
                        What gets locked when you proceed?
                        <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', lockDisclosureOpen && 'rotate-180')} />
                    </button>
                    {lockDisclosureOpen && (
                        <div className="mt-2 text-[12.5px] text-info-900/90 leading-relaxed pl-6">
                            When you lock attendance for this period, the following becomes immutable:
                            <ul className="list-disc pl-5 mt-1.5 space-y-0.5">
                                <li>Daily attendance records (in/out, late, half-day)</li>
                                <li>Leave applications already approved for this period</li>
                                <li>Overtime entries logged in-period</li>
                                <li>Any manual attendance adjustments</li>
                            </ul>
                            Once locked, only an admin override can modify these. Make sure all attendance corrections
                            are completed before locking.
                        </div>
                    )}
                </div>
            )}

            {/* ── Warning + Lock CTA ────────────────────────────────── */}
            {!isAlreadyLocked && (
                <div className="rounded-2xl bg-warning-50/70 p-4 ring-1 ring-warning-200">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-start gap-3 max-w-2xl">
                            <AlertTriangle className="w-5 h-5 text-warning-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-warning-800">Once attendance is locked, no further changes will be allowed unless unlocked by an authorized approver.</p>
                                <p className="text-[12.5px] text-warning-700/90 mt-0.5">Please review all data carefully before locking.</p>
                            </div>
                        </div>
                        {overridePending > 0 && (
                            <div className="flex items-center gap-3 text-[12.5px]">
                                <span className="font-semibold text-warning-700">{overridePending} override(s) pending approval</span>
                                <button className="rounded-lg border border-warning-300 bg-white px-3 py-1.5 text-xs font-semibold text-warning-700 hover:bg-warning-50">
                                    Review Overrides
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-neutral-600">
                    <Info className="w-4 h-4 text-info-500" />
                    <span>All manual overrides must be approved before locking attendance.</span>
                    <a href="#" className="font-semibold text-primary-600 hover:text-primary-700">View Override Approval History →</a>
                </div>
                <button
                    disabled={isAlreadyLocked || anyMutating || (summaryLoading && !summary)}
                    onClick={onStepAction}
                    className={cn(
                        'inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold shadow-sm transition min-w-[220px] justify-center',
                        isAlreadyLocked
                            ? 'bg-success-100 text-success-700 cursor-default'
                            : 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-primary-500/25 hover:from-primary-700 hover:to-accent-700',
                        anyMutating && 'opacity-60 cursor-not-allowed',
                    )}
                >
                    {anyMutating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                    {isAlreadyLocked ? 'Attendance Locked' : 'Lock Attendance'}
                </button>
            </div>
            {!isAlreadyLocked && overridePending > 0 && (
                <p className="text-right text-[11.5px] text-neutral-500 -mt-2">
                    You will be able to unlock with approved request if required.
                </p>
            )}

            {/* Row "view details" modal — opens when user clicks the eye icon on a table row */}
            {detailRow && (
                <AttendanceRowDetailModal row={detailRow} onClose={() => setDetailRow(null)} />
            )}
        </div>
    );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Attendance row detail modal                                              */
/* ──────────────────────────────────────────────────────────────────────── */

function AttendanceRowDetailModal({ row, onClose }: { row: any; onClose: () => void }) {
    const status: 'OK' | 'HAS_ISSUES' | 'NO_DATA' = row.status ?? 'OK';
    const reasons: string[] = Array.isArray(row.reasons) ? row.reasons : [];
    const suggestions: string[] = Array.isArray(row.suggestions) ? row.suggestions : [];

    const statusBadge =
        status === 'OK'
            ? { label: 'Ready', cls: 'bg-success-50 text-success-700 ring-success-200' }
            : status === 'NO_DATA'
              ? { label: 'No Data', cls: 'bg-neutral-100 text-neutral-700 ring-neutral-200' }
              : { label: 'Has Issues', cls: 'bg-danger-50 text-danger-700 ring-danger-200' };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 backdrop-blur-sm p-4"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md rounded-2xl bg-white shadow-xl ring-1 ring-neutral-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between p-5 border-b border-neutral-100">
                    <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Attendance Detail</p>
                        <h3 className="mt-0.5 text-base font-bold text-neutral-900 truncate">
                            {row.firstName} {row.lastName}
                        </h3>
                        <p className="text-xs text-neutral-500 mt-0.5">
                            {row.employeeCode}{row.department ? ` · ${row.department}` : ''}
                        </p>
                    </div>
                    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1', statusBadge.cls)}>
                        {statusBadge.label}
                    </span>
                </div>

                <div className="p-5 space-y-4">
                    <div className="grid grid-cols-4 gap-2">
                        <SummaryStat label="Working" value={Number(row.workingDays ?? 0)} />
                        <SummaryStat label="Present" value={Number(row.present ?? 0)} tint="success" />
                        <SummaryStat label="Absent"  value={Number(row.absent ?? 0)} tint={Number(row.absent ?? 0) > 0 ? 'danger' : 'neutral'} />
                        <SummaryStat label="LOP"     value={Number(row.lop ?? 0)} tint={Number(row.lop ?? 0) > 0 ? 'warning' : 'neutral'} />
                    </div>

                    {reasons.length > 0 ? (
                        <div className="rounded-xl bg-danger-50/60 ring-1 ring-danger-200 p-3.5">
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <AlertTriangle className="w-4 h-4 text-danger-600" />
                                <p className="text-[12.5px] font-bold text-danger-800">Issue Reason</p>
                            </div>
                            <ul className="ml-1 list-disc list-inside space-y-1 text-[12.5px] text-danger-900">
                                {reasons.map((r, i) => <li key={i}>{r}</li>)}
                            </ul>
                        </div>
                    ) : (
                        <div className="rounded-xl bg-success-50/60 ring-1 ring-success-200 p-3.5">
                            <div className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-success-600" />
                                <p className="text-[12.5px] font-bold text-success-800">All attendance checks passed</p>
                            </div>
                        </div>
                    )}

                    {suggestions.length > 0 && (
                        <div className="rounded-xl bg-info-50/60 ring-1 ring-info-200 p-3.5">
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <Info className="w-4 h-4 text-info-600" />
                                <p className="text-[12.5px] font-bold text-info-800">Suggested Action</p>
                            </div>
                            <ul className="ml-1 list-disc list-inside space-y-1 text-[12.5px] text-info-900">
                                {suggestions.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-end gap-2 p-4 border-t border-neutral-100 bg-neutral-50/40 rounded-b-2xl">
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3.5 py-1.5 text-[12.5px] font-semibold text-neutral-700 hover:bg-neutral-50"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

function SummaryStat({ label, value, tint = 'neutral' }: { label: string; value: number; tint?: 'neutral' | 'success' | 'warning' | 'danger' }) {
    const tintCls = {
        neutral: 'text-neutral-900',
        success: 'text-success-700',
        warning: 'text-warning-700',
        danger:  'text-danger-700',
    }[tint];
    return (
        <div className="rounded-lg bg-neutral-50/70 ring-1 ring-neutral-200 p-2 text-center">
            <div className={cn('text-base font-bold', tintCls)}>{value}</div>
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-neutral-500 mt-0.5">{label}</div>
        </div>
    );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Small atoms                                                              */
/* ──────────────────────────────────────────────────────────────────────── */

function MetaPill({
    icon: Icon, label, value, tint, tooltip,
}: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; tint: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'accent'; tooltip?: string }) {
    const tintMap = {
        primary: 'bg-primary-100 text-primary-600',
        success: 'bg-success-100 text-success-600',
        warning: 'bg-warning-100 text-warning-600',
        danger:  'bg-danger-100 text-danger-600',
        info:    'bg-info-100 text-info-600',
        accent:  'bg-accent-100 text-accent-600',
    } as const;
    return (
        <div className="flex items-center gap-2.5 min-w-0" title={value}>
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', tintMap[tint])}>
                <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                    <span>{label}</span>
                    {tooltip && <InfoTooltip content={tooltip} />}
                </div>
                <div className="text-[12.5px] font-bold text-neutral-900 truncate">{value}</div>
            </div>
        </div>
    );
}

function LegendRow({ color, label, value, pct }: { color: string; label: string; value: number; pct: number }) {
    return (
        <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
            <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                <span className="text-[11.5px] text-neutral-700 leading-tight">{label}</span>
                <span className="text-[11.5px] font-bold text-neutral-900 whitespace-nowrap">{value} <span className="font-normal text-neutral-500">({pct.toFixed(2)}%)</span></span>
            </div>
        </div>
    );
}

function OverrideRow({ color, label, value }: { color: string; label: string; value: number }) {
    return (
        <div className="flex items-center justify-between py-1.5">
            <div className="flex items-center gap-2.5">
                <span className={cn('w-2 h-2 rounded-full', color)} />
                <span className="text-[12.5px] text-neutral-700">{label}</span>
            </div>
            <span className="text-[12.5px] font-bold text-neutral-900">{value}</span>
        </div>
    );
}

function DeltaTile({
    label, value, delta, pct, prev, inverse,
}: { label: string; value: string; delta: number; pct: number; prev: string; inverse?: boolean }) {
    const up = delta >= 0;
    const positive = inverse ? !up : up;
    const Arrow = up ? TrendingUp : TrendingDown;
    const tint = positive ? 'text-success-600' : 'text-danger-600';
    const bg = positive ? 'bg-success-50' : 'bg-danger-50';
    return (
        <div className="rounded-xl bg-neutral-50/70 p-3 ring-1 ring-neutral-100">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">{label}</span>
                <span className={cn('inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5', bg, tint)}>
                    <Arrow className="w-3 h-3" />
                </span>
            </div>
            <div className="mt-1 text-base font-bold text-neutral-900">{value}</div>
            <div className={cn('text-[10.5px] font-semibold', tint)}>
                {up ? '+' : ''}{delta.toFixed(1)} ({up ? '+' : ''}{pct.toFixed(2)}%)
            </div>
            <div className="text-[10px] text-neutral-500 mt-0.5 truncate">{prev}</div>
        </div>
    );
}

function Pagination({
    page, totalPages, onChange, rangeLabel,
}: { page: number; totalPages: number; onChange: (p: number) => void; rangeLabel: string }) {
    const pages = useMemo(() => {
        const result: (number | '…')[] = [];
        const range = 1;
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= page - range && i <= page + range)) {
                result.push(i);
            } else if (result[result.length - 1] !== '…') {
                result.push('…');
            }
        }
        return result;
    }, [page, totalPages]);
    return (
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-neutral-100">
            <span className="text-[12px] text-neutral-500">{rangeLabel}</span>
            <div className="flex items-center gap-1">
                <PaginationBtn disabled={page === 1} onClick={() => onChange(1)}><ChevronsLeft className="w-3.5 h-3.5" /></PaginationBtn>
                <PaginationBtn disabled={page === 1} onClick={() => onChange(page - 1)}><ChevronLeft className="w-3.5 h-3.5" /></PaginationBtn>
                {pages.map((p, i) =>
                    p === '…' ? (
                        <span key={`e${i}`} className="px-2 text-xs text-neutral-400">…</span>
                    ) : (
                        <button
                            key={p}
                            onClick={() => onChange(p)}
                            className={cn(
                                'min-w-[28px] h-7 px-2 rounded-md text-xs font-semibold',
                                p === page ? 'bg-primary-600 text-white' : 'text-neutral-700 hover:bg-neutral-100',
                            )}
                        >
                            {p}
                        </button>
                    )
                )}
                <PaginationBtn disabled={page === totalPages} onClick={() => onChange(page + 1)}><ChevronRight className="w-3.5 h-3.5" /></PaginationBtn>
                <PaginationBtn disabled={page === totalPages} onClick={() => onChange(totalPages)}><ChevronsRight className="w-3.5 h-3.5" /></PaginationBtn>
            </div>
        </div>
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

function prevMonthLabel(month?: number, year?: number) {
    if (!month || !year) return 'last month';
    const pm = month === 1 ? 12 : month - 1;
    const py = month === 1 ? year - 1 : year;
    return `${MONTHS[pm]!.slice(0, 3)} ${py}`;
}
