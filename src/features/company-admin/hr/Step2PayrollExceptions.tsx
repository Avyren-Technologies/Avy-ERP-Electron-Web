import { useMemo, useState, useRef, useEffect } from 'react';
import {
    AlertTriangle,
    AlertCircle,
    Users,
    Info,
    CheckCircle2,
    XCircle,
    Shield,
    BookOpen,
    Calendar,
    Clock,
    Calculator,
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePayrollRun } from '@/features/company-admin/api/use-payroll-run-queries';
import { useResolveException } from '@/features/company-admin/api/use-payroll-run-mutations';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import { showSuccess, showApiError } from '@/lib/toast';
import { SkeletonTable } from '@/components/ui/Skeleton';

interface StepProps {
    runId: string;
    runDetail: any;
    completedStep: number;
    onStepAction: () => void;
    anyMutating: boolean;
}

type Priority = 'HIGH' | 'MEDIUM' | 'LOW';
type PriorityFilter = 'all' | 'high' | 'medium' | 'low' | 'resolved';

interface ExceptionItem {
    employeeId: string;
    employeeName: string;
    department: string | null;
    type: string;
    category: 'info' | 'warning' | 'critical';
    priority: Priority;
    description: string;
    impactAmount: number | null;
    resolved: boolean;
    resolvedAction: 'RESOLVE' | 'SKIP' | null;
    resolvedNote: string | null;
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Atoms                                                                    */
/* ──────────────────────────────────────────────────────────────────────── */

function StatTile({
    icon: Icon, label, value, tint,
}: { icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; label: string; value: React.ReactNode; tint: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'neutral' }) {
    const tintMap = {
        primary: 'bg-primary-50 text-primary-600',
        success: 'bg-success-50 text-success-600',
        warning: 'bg-warning-50 text-warning-600',
        danger:  'bg-danger-50 text-danger-600',
        info:    'bg-info-50 text-info-600',
        accent:  'bg-accent-50 text-accent-600',
        neutral: 'bg-neutral-100 text-neutral-700',
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
                </div>
            </div>
        </div>
    );
}

function PriorityPill({ priority }: { priority: Priority }) {
    const map: Record<Priority, { bg: string; text: string; ring: string; label: string }> = {
        HIGH:   { bg: 'bg-danger-50',  text: 'text-danger-700',  ring: 'ring-danger-200',  label: 'High' },
        MEDIUM: { bg: 'bg-warning-50', text: 'text-warning-700', ring: 'ring-warning-200', label: 'Medium' },
        LOW:    { bg: 'bg-info-50',    text: 'text-info-700',    ring: 'ring-info-200',    label: 'Low' },
    };
    const t = map[priority] ?? map.LOW;
    return (
        <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 whitespace-nowrap', t.bg, t.text, t.ring)}>
            {t.label}
        </span>
    );
}

function ActionSelect({
    value, onChange, disabled,
}: { value: 'ACCEPT' | 'OVERRIDE' | 'RESOLVE' | null; onChange: (v: 'ACCEPT' | 'OVERRIDE' | 'RESOLVE') => void; disabled?: boolean }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!open) return;
        const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, [open]);
    const labelMap = { ACCEPT: 'Accepted', OVERRIDE: 'Overridden', RESOLVE: 'Resolved' };
    return (
        <div className="relative" ref={ref}>
            <button
                disabled={disabled}
                onClick={() => setOpen(o => !o)}
                className={cn(
                    'inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-neutral-700 hover:bg-neutral-50 whitespace-nowrap',
                    disabled && 'opacity-50 cursor-not-allowed',
                )}
            >
                {value ? labelMap[value] : 'Select Action'}
                <ChevronDown className="w-3 h-3" />
            </button>
            {open && !disabled && (
                <div className="absolute right-0 mt-1 w-36 rounded-lg border border-neutral-200 bg-white p-1 shadow-lg z-20">
                    {(['ACCEPT', 'OVERRIDE', 'RESOLVE'] as const).map(opt => (
                        <button key={opt} onClick={() => { setOpen(false); onChange(opt); }}
                            className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-[11px] text-neutral-700 hover:bg-neutral-50">
                            <span>{labelMap[opt]}</span>
                            {value === opt && <CheckCircle2 className="w-3 h-3 text-success-600" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function PriorityDonut({ high, medium, low }: { high: number; medium: number; low: number }) {
    const total = high + medium + low;
    const safe = total || 1;
    const radius = 38;
    const circ = 2 * Math.PI * radius;
    const highLen = (high / safe) * circ;
    const medLen = (medium / safe) * circ;
    const lowLen = (low / safe) * circ;
    return (
        <div className="relative w-[140px] h-[140px] shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r={radius} fill="none" stroke="#E2E8F0" strokeWidth="11" />
                {total > 0 && (
                    <>
                        <circle cx="50" cy="50" r={radius} fill="none" stroke="#EF4444" strokeWidth="11"
                            strokeDasharray={`${highLen} ${circ - highLen}`} strokeDashoffset={0} />
                        <circle cx="50" cy="50" r={radius} fill="none" stroke="#F59E0B" strokeWidth="11"
                            strokeDasharray={`${medLen} ${circ - medLen}`} strokeDashoffset={-highLen} />
                        <circle cx="50" cy="50" r={radius} fill="none" stroke="#3B82F6" strokeWidth="11"
                            strokeDasharray={`${lowLen} ${circ - lowLen}`} strokeDashoffset={-highLen - medLen} />
                    </>
                )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-neutral-900 leading-none">{total}</span>
                <span className="text-[10px] text-neutral-500 mt-1.5 font-bold uppercase tracking-wider">Total</span>
            </div>
        </div>
    );
}

function StatusBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
    const pct = total > 0 ? (value / total) * 100 : 0;
    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between text-[12px]">
                <span className="text-neutral-700">{label}</span>
                <span className="font-bold text-neutral-900">{value} <span className="font-normal text-neutral-500">({pct.toFixed(2)}%)</span></span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
            </div>
        </div>
    );
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
            <button onClick={() => setOpen(o => !o)}
                className="inline-flex items-center gap-2 rounded-lg border border-primary-200 bg-white px-4 py-2 text-sm font-semibold text-primary-700 shadow-sm hover:bg-primary-50">
                Payroll Actions <ChevronDown className={cn('w-4 h-4 transition-transform', open && 'rotate-180')} />
            </button>
            {open && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-lg ring-1 ring-black/5 z-30">
                    <button onClick={() => { setOpen(false); onRefresh(); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                        <RefreshCcw className="w-4 h-4" /> Refresh Exceptions
                    </button>
                    <button onClick={() => { setOpen(false); onExport(); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                        <Download className="w-4 h-4" /> Export Exceptions
                    </button>
                </div>
            )}
        </div>
    );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Main component                                                           */
/* ──────────────────────────────────────────────────────────────────────── */

export function Step2PayrollExceptions({ runId, runDetail, completedStep, onStepAction, anyMutating }: StepProps) {
    const fmt = useCompanyFormatter();
    const runDetailQuery = usePayrollRun(runId);
    const resolveMutation = useResolveException();

    const [activeTab, setActiveTab] = useState<PriorityFilter>('all');
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [selectedAction, setSelectedAction] = useState<Record<number, 'ACCEPT' | 'OVERRIDE' | 'RESOLVE'>>({});

    /* Debounce search */
    useEffect(() => {
        const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 300);
        return () => clearTimeout(t);
    }, [searchInput]);

    const exceptions: (ExceptionItem & { _idx: number })[] = useMemo(() => {
        const arr = (runDetail?.exceptions as ExceptionItem[]) ?? [];
        return arr.map((e, i) => ({ ...e, _idx: i }));
    }, [runDetail]);

    /* KPI counts */
    const counts = useMemo(() => {
        const c = { total: exceptions.length, high: 0, medium: 0, low: 0, accepted: 0, overridden: 0, resolved: 0, pending: 0 };
        exceptions.forEach(e => {
            if (e.priority === 'HIGH') c.high++;
            else if (e.priority === 'MEDIUM') c.medium++;
            else c.low++;
            if (e.resolved) {
                if (e.resolvedNote?.toLowerCase().includes('accept')) c.accepted++;
                else if (e.resolvedNote?.toLowerCase().includes('override')) c.overridden++;
                else c.resolved++;
            } else {
                c.pending++;
            }
        });
        return c;
    }, [exceptions]);

    /* Top exception types */
    const topTypes = useMemo(() => {
        const map: Record<string, number> = {};
        exceptions.forEach(e => {
            const k = humanType(e.type);
            map[k] = (map[k] ?? 0) + 1;
        });
        return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6);
    }, [exceptions]);

    /* Filter + paginate */
    const filtered = useMemo(() => {
        return exceptions.filter(e => {
            if (search) {
                const q = search.toLowerCase();
                if (!(e.employeeName ?? '').toLowerCase().includes(q) &&
                    !(e.type ?? '').toLowerCase().includes(q) &&
                    !(e.description ?? '').toLowerCase().includes(q)) return false;
            }
            if (activeTab === 'all') return true;
            if (activeTab === 'high') return e.priority === 'HIGH';
            if (activeTab === 'medium') return e.priority === 'MEDIUM';
            if (activeTab === 'low') return e.priority === 'LOW';
            if (activeTab === 'resolved') return e.resolved;
            return true;
        });
    }, [exceptions, search, activeTab]);

    const totalFiltered = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
    const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

    const isAlreadyReviewed = completedStep >= 2;
    const hasUnresolvedHigh = counts.high > 0 && exceptions.some(e => e.priority === 'HIGH' && !e.resolved);
    const allResolved = counts.pending === 0;

    const onRefresh = () => runDetailQuery.refetch();
    const onExport = () => window.print();

    const handleResolve = (idx: number, uiAction: 'ACCEPT' | 'OVERRIDE' | 'RESOLVE') => {
        if (!runId) return;
        // Backend supports RESOLVE / SKIP only — encode the UI action in the note
        const noteMap = { ACCEPT: 'Accepted system value', OVERRIDE: 'Manual override', RESOLVE: 'Marked resolved' };
        setSelectedAction(prev => ({ ...prev, [idx]: uiAction }));
        resolveMutation.mutate(
            { runId, exceptionIndex: idx, action: 'RESOLVE', note: noteMap[uiAction] },
            {
                onSuccess: () => { showSuccess('Exception resolved', noteMap[uiAction]); runDetailQuery.refetch(); },
                onError: (err) => showApiError(err),
            },
        );
    };

    const isLoading = runDetailQuery.isLoading && !runDetail;

    return (
        <div className="space-y-5">
            {/* Step header + About */}
            <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
                <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <div className="text-[11px] font-bold uppercase tracking-wider text-primary-600">Step 2 of 6</div>
                            <h2 className="mt-1 text-xl font-bold text-neutral-900">Review Exceptions</h2>
                            <p className="mt-1.5 text-[13px] text-neutral-600 max-w-2xl leading-snug">
                                The system has detected the following exceptions based on data validation rules.
                                Review each exception and take action: Accept (system value), Override (provide correction),
                                or Mark as Resolved (if already fixed in source).
                            </p>
                        </div>
                        <PayrollActionsDropdown onRefresh={onRefresh} onExport={onExport} />
                    </div>

                    {/* Period meta */}
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 rounded-xl bg-neutral-50/70 p-3 ring-1 ring-neutral-100">
                        <MetaPill icon={Calendar} label="Payroll Period" value={runDetail?.month && runDetail?.year ? `${fmt.date(new Date(runDetail.year, runDetail.month - 1, 1).toISOString())} – ${fmt.date(new Date(runDetail.year, runDetail.month, 0).toISOString())}` : '—'} tint="info" />
                        <MetaPill icon={Clock} label="Cut-off Day" value={runDetail?.month && runDetail?.year ? fmt.date(new Date(runDetail.year, runDetail.month, 0).toISOString()) : '—'} tint="accent" />
                        <MetaPill icon={Calculator} label="LOP Method" value="÷ Working Days" tint="warning" />
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
                        Review all exceptions before computing salaries. Unresolved high-priority exceptions will block payroll computation.
                    </p>
                    <a href="#" className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-semibold text-primary-600 hover:text-primary-700">
                        <BookOpen className="w-3.5 h-3.5" /> Learn more →
                    </a>
                </div>
            </div>

            {/* KPI strip (7 tiles) */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-7 gap-3">
                <StatTile icon={Users}         label="Total Exceptions" value={counts.total}      tint="primary" />
                <StatTile icon={Shield}        label="High Priority"    value={counts.high}       tint="danger" />
                <StatTile icon={Users}         label="Medium Priority"  value={counts.medium}     tint="warning" />
                <StatTile icon={Info}          label="Low Priority"     value={counts.low}        tint="info" />
                <StatTile icon={CheckCircle2}  label="Accepted"         value={counts.accepted}   tint="success" />
                <StatTile icon={XCircle}       label="Overridden"       value={counts.overridden} tint="accent" />
                <StatTile icon={CheckCircle2}  label="Resolved"         value={counts.resolved}   tint="success" />
            </div>

            {/* Main two-column layout */}
            <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
                {/* Tabs + table */}
                <div className="rounded-2xl bg-white ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 px-5 pt-4">
                        <div className="flex gap-6 overflow-x-auto">
                            {([
                                { id: 'all',      label: 'All Exceptions', count: counts.total },
                                { id: 'high',     label: 'High Priority',  count: counts.high },
                                { id: 'medium',   label: 'Medium Priority',count: counts.medium },
                                { id: 'low',      label: 'Low Priority',   count: counts.low },
                                { id: 'resolved', label: 'Resolved',       count: counts.total - counts.pending },
                            ] as const).map(t => (
                                <button key={t.id} onClick={() => { setActiveTab(t.id); setPage(1); }}
                                    className={cn(
                                        'pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap',
                                        activeTab === t.id ? 'border-primary-600 text-primary-700' : 'border-transparent text-neutral-500 hover:text-neutral-800',
                                    )}>
                                    {t.label} <span className="text-[11px] font-semibold text-neutral-400">({t.count})</span>
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 pb-3">
                            <button className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50">
                                Bulk Actions <ChevronDown className="w-3 h-3" />
                            </button>
                            <button className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50">
                                <Filter className="w-3 h-3" /> Filters
                            </button>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                                <input
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    placeholder="Search exceptions…"
                                    className="w-56 rounded-lg border border-neutral-200 bg-white pl-8 pr-3 py-1.5 text-xs text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        {isLoading ? (
                            <div className="p-5"><SkeletonTable rows={6} cols={9} /></div>
                        ) : paged.length === 0 ? (
                            exceptions.length === 0 ? (
                                <ExceptionCatalogueEmpty />
                            ) : (
                                <div className="px-6 py-12 text-center text-sm text-neutral-500">
                                    No exceptions match the current filters.
                                </div>
                            )
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 bg-neutral-50/60">
                                        <th className="px-4 py-3 w-10"><input type="checkbox" className="rounded border-neutral-300" /></th>
                                        <th className="px-4 py-3 whitespace-nowrap">Employee ID</th>
                                        <th className="px-4 py-3">Employee Name</th>
                                        <th className="px-4 py-3 whitespace-nowrap">Exception Type</th>
                                        <th className="px-4 py-3">Description</th>
                                        <th className="px-4 py-3 whitespace-nowrap">Priority</th>
                                        <th className="px-4 py-3 whitespace-nowrap">Impact</th>
                                        <th className="px-4 py-3">Suggested Action</th>
                                        <th className="px-4 py-3 whitespace-nowrap min-w-[140px]">Action Taken</th>
                                        <th className="px-4 py-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100">
                                    {paged.map(exc => {
                                        const idx = exc._idx;
                                        const empCode = exc.employeeId?.slice(-6).toUpperCase() ?? '—';
                                        const impact = Number(exc.impactAmount ?? 0);
                                        const impactColor = impact < 0 ? 'text-danger-700' : impact > 0 ? 'text-success-700' : 'text-neutral-400';
                                        const impactSign = impact === 0 ? '—' : impact < 0 ? `-₹${Math.abs(impact).toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : `+₹${impact.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
                                        const blocking = impact !== 0 && exc.priority === 'HIGH' && (exc.type ?? '').toLowerCase().includes('hold');
                                        const uiAction: 'ACCEPT' | 'OVERRIDE' | 'RESOLVE' | null = exc.resolved
                                            ? (exc.resolvedNote?.toLowerCase().includes('accept') ? 'ACCEPT'
                                                : exc.resolvedNote?.toLowerCase().includes('override') ? 'OVERRIDE' : 'RESOLVE')
                                            : selectedAction[idx] ?? null;

                                        return (
                                            <tr key={idx} className={cn('group hover:bg-neutral-50/60', exc.resolved && 'bg-success-50/30')}>
                                                <td className="px-4 py-3.5"><input type="checkbox" disabled={exc.resolved} className="rounded border-neutral-300" /></td>
                                                <td className="px-4 py-3.5 text-[12.5px] font-semibold text-neutral-700 whitespace-nowrap font-mono">EMP{empCode}</td>
                                                <td className="px-4 py-3.5 text-[13px] font-semibold text-neutral-900 whitespace-nowrap">{exc.employeeName ?? '—'}</td>
                                                <td className="px-4 py-3.5 text-[12.5px] text-neutral-700 whitespace-nowrap">{humanType(exc.type)}</td>
                                                <td className="px-4 py-3.5 text-[12.5px] text-neutral-600 leading-snug max-w-md">{exc.description}</td>
                                                <td className="px-4 py-3.5"><PriorityPill priority={exc.priority} /></td>
                                                <td className={cn('px-4 py-3.5 text-[12.5px] font-bold font-mono whitespace-nowrap', impactColor)}>
                                                    {blocking ? <span className="text-danger-700 font-semibold">Blocks Pay</span> : impactSign}
                                                </td>
                                                <td className="px-4 py-3.5 text-[12.5px] text-neutral-600 leading-snug">{suggestedAction(exc)}</td>
                                                <td className="px-4 py-3.5">
                                                    <ActionSelect value={uiAction} onChange={(v) => handleResolve(idx, v)} disabled={exc.resolved || resolveMutation.isPending || isAlreadyReviewed} />
                                                </td>
                                                <td className="px-4 py-3.5 text-right">
                                                    <button className="inline-flex items-center justify-center w-7 h-7 rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-primary-600">
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

                    {/* Pagination */}
                    {totalFiltered > 0 && (
                        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-neutral-100">
                            <span className="text-[12px] text-neutral-500">
                                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalFiltered)} of {totalFiltered} exceptions
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
                                <span className="ml-2 text-[12px] text-neutral-500">{pageSize} / page</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <aside className="space-y-4">
                    {/* Exceptions by priority donut */}
                    <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                        <h3 className="text-sm font-bold text-neutral-900 mb-3">Exceptions by Priority</h3>
                        <div className="flex items-center gap-4">
                            <PriorityDonut high={counts.high} medium={counts.medium} low={counts.low} />
                            <div className="space-y-2 flex-1 min-w-0">
                                <LegendRow color="#EF4444" label="High"   value={counts.high}   pct={counts.total > 0 ? (counts.high / counts.total) * 100 : 0} />
                                <LegendRow color="#F59E0B" label="Medium" value={counts.medium} pct={counts.total > 0 ? (counts.medium / counts.total) * 100 : 0} />
                                <LegendRow color="#3B82F6" label="Low"    value={counts.low}    pct={counts.total > 0 ? (counts.low / counts.total) * 100 : 0} />
                            </div>
                        </div>
                    </div>

                    {/* Exception Status */}
                    <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                        <h3 className="text-sm font-bold text-neutral-900 mb-3">Exception Status</h3>
                        <div className="space-y-3">
                            <StatusBar label="Accepted"   value={counts.accepted}   total={counts.total} color="#10B981" />
                            <StatusBar label="Overridden" value={counts.overridden} total={counts.total} color="#8B5CF6" />
                            <StatusBar label="Resolved"   value={counts.resolved}   total={counts.total} color="#10B981" />
                            <StatusBar label="Pending"    value={counts.pending}    total={counts.total} color="#94A3B8" />
                        </div>
                    </div>

                    {/* Top Exception Types */}
                    <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                        <h3 className="text-sm font-bold text-neutral-900 mb-3">Top Exception Types</h3>
                        {topTypes.length === 0 ? (
                            <p className="text-[12.5px] text-neutral-500">No exception types yet.</p>
                        ) : (
                            <ul className="space-y-2">
                                {topTypes.map(([name, count]) => (
                                    <li key={name} className="flex items-center justify-between text-[12.5px]">
                                        <span className="flex items-center gap-2 text-neutral-700 min-w-0 truncate">
                                            <AlertCircle className="w-3.5 h-3.5 text-warning-500 shrink-0" />
                                            {name}
                                        </span>
                                        <span className="font-bold text-neutral-900">{count}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {exceptions.length > topTypes.length && (
                            <a href="#" className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-semibold text-primary-600 hover:text-primary-700">
                                View All Exception Types <ChevronRight className="w-3.5 h-3.5" />
                            </a>
                        )}
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

            {/* Alerts row */}
            {!isAlreadyReviewed && (
                <div className="grid gap-3 lg:grid-cols-2">
                    {hasUnresolvedHigh && (
                        <div className="rounded-2xl bg-warning-50/70 p-4 ring-1 ring-warning-200">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-warning-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-semibold text-warning-800">High Priority Exceptions</p>
                                        <p className="text-[12.5px] text-warning-700/90 mt-0.5">
                                            {counts.high} high priority exception(s) must be resolved or accepted before
                                            proceeding to Step 3 — Compute Salaries.
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => { setActiveTab('high'); setPage(1); }}
                                    className="shrink-0 rounded-lg border border-warning-300 bg-white px-3 py-1.5 text-xs font-semibold text-warning-700 hover:bg-warning-50">
                                    View High Priority
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="rounded-2xl bg-info-50/70 p-4 ring-1 ring-info-200">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                                <Info className="w-5 h-5 text-info-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-semibold text-info-800">What happens next?</p>
                                    <p className="text-[12.5px] text-info-700/90 mt-0.5">
                                        Once all exceptions are resolved/accepted, you can proceed to preview salary computation.
                                    </p>
                                </div>
                            </div>
                            <button
                                disabled={hasUnresolvedHigh || anyMutating}
                                onClick={onStepAction}
                                className={cn('shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold',
                                    hasUnresolvedHigh ? 'border border-neutral-200 bg-white text-neutral-400 cursor-not-allowed'
                                                       : 'border border-primary-200 bg-white text-primary-700 hover:bg-primary-50')}>
                                Proceed to Step 3 (Preview)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer action bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-3 text-[12.5px] text-neutral-600">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Step 1 (Lock Attendance)</span>
                </div>
                <div className="text-[12.5px] text-neutral-500">
                    {counts.total} exceptions found · <span className="font-semibold text-warning-700">{counts.high} high priority</span> need attention
                </div>
                <div className="flex items-center gap-3">
                    <button className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">
                        <Save className="w-3.5 h-3.5" /> Save Progress
                    </button>
                    <button
                        disabled={isAlreadyReviewed || hasUnresolvedHigh || !allResolved || anyMutating}
                        onClick={onStepAction}
                        className={cn(
                            'inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold shadow-sm transition',
                            isAlreadyReviewed
                                ? 'bg-success-100 text-success-700 cursor-default'
                                : (!allResolved || hasUnresolvedHigh)
                                    ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-primary-500/25 hover:from-primary-700 hover:to-accent-700',
                        )}
                    >
                        {anyMutating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {isAlreadyReviewed ? 'Exceptions Reviewed' : 'Next: Proceed to Step 3 (Compute Salaries)'}
                        {!isAlreadyReviewed && <ArrowRight className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Helpers                                                                  */
/* ──────────────────────────────────────────────────────────────────────── */

function humanType(t: string): string {
    if (!t) return '—';
    return t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function suggestedAction(e: ExceptionItem): string {
    const t = (e.type ?? '').toLowerCase();
    if (t.includes('lop')) return 'Use Attendance LOP value';
    if (t.includes('missing_punch')) return 'Apply half-day LOP';
    if (t.includes('new_hire') || t.includes('new_joiner')) return 'Verify pro-rata calculation';
    if (t.includes('hold') || t.includes('salary_hold')) return 'Review hold and release if applicable';
    if (t.includes('overtime')) return 'Cap overtime to limit';
    if (t.includes('component')) return 'Add missing component';
    if (t.includes('bank')) return 'Update bank details';
    if (t.includes('exit') || t.includes('notice')) return 'Verify pro-rata for exit';
    return 'Review and confirm';
}

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

function LegendRow({ color, label, value, pct }: { color: string; label: string; value: number; pct: number }) {
    return (
        <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
            <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                <span className="text-[12px] text-neutral-700 leading-tight">{label} <span className="font-bold text-neutral-900">({value})</span></span>
                <span className="text-[11.5px] font-bold text-neutral-500">{pct.toFixed(2)}%</span>
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

/* ──────────────────────────────────────────────────────────────────────── */
/* Exception catalogue — shown when zero exceptions are detected            */
/* This documents WHAT the system checks so users can cross-verify          */
/* ──────────────────────────────────────────────────────────────────────── */

const EXCEPTION_CATALOGUE: Array<{ type: string; label: string; priority: Priority; category: 'info' | 'warning' | 'critical'; trigger: string; impact: string }> = [
    { type: 'NEW_HIRE',          label: 'New hire pro-ration',    priority: 'LOW',    category: 'info',     trigger: 'Employee joined in this payroll month',                            impact: 'Pro-rated salary may apply' },
    { type: 'EXIT_IN_MONTH',     label: 'Exit pro-ration / F&F',  priority: 'LOW',    category: 'info',     trigger: 'Last working date falls in this month',                            impact: 'Full & final may apply' },
    { type: 'SALARY_HOLD',       label: 'Salary on hold',         priority: 'MEDIUM', category: 'warning',  trigger: 'Unreleased SalaryHold record for this run',                         impact: 'Full salary may be withheld' },
    { type: 'NO_PAN',            label: 'Missing PAN',            priority: 'MEDIUM', category: 'warning',  trigger: 'Active employee has no PAN on file',                               impact: 'TDS deducted at maximum slab' },
    { type: 'NO_DEPARTMENT',     label: 'Missing department',     priority: 'MEDIUM', category: 'warning',  trigger: 'Employee has no department mapping',                               impact: 'Cost-centre reporting affected' },
    { type: 'NO_SALARY_RECORD',  label: 'No current salary',      priority: 'HIGH',   category: 'critical', trigger: 'Active employee has no EmployeeSalary with isCurrent=true',        impact: 'Cannot be computed — must resolve' },
    { type: 'NO_BANK_ACCOUNT',   label: 'Missing bank account',   priority: 'HIGH',   category: 'critical', trigger: 'Employee has current salary but no bank account number',           impact: 'Disbursement will fail for this employee' },
];

function ExceptionCatalogueEmpty() {
    const priorityTint: Record<Priority, { bg: string; text: string; ring: string }> = {
        HIGH:   { bg: 'bg-danger-50',  text: 'text-danger-700',  ring: 'ring-danger-200' },
        MEDIUM: { bg: 'bg-warning-50', text: 'text-warning-700', ring: 'ring-warning-200' },
        LOW:    { bg: 'bg-info-50',    text: 'text-info-700',    ring: 'ring-info-200' },
    };
    return (
        <div className="px-6 py-8">
            <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-success-50 text-success-600 mb-2">
                    <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-neutral-900">No exceptions detected</h3>
                <p className="text-[12.5px] text-neutral-500 mt-1 max-w-md mx-auto">
                    All employees passed validation for this payroll period. You can proceed to Step 3 — Compute Salaries.
                </p>
            </div>

            <div className="mt-6">
                <div className="flex items-center gap-2 mb-3">
                    <Info className="w-4 h-4 text-info-500" />
                    <h4 className="text-[13px] font-bold text-neutral-900">What we checked</h4>
                </div>
                <p className="text-[12px] text-neutral-500 mb-3">
                    Use this checklist to verify the data quality of your payroll for this period. An exception would have appeared if any of these conditions were met for any active employee.
                </p>
                <div className="overflow-x-auto rounded-xl ring-1 ring-neutral-200">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-[10.5px] font-semibold uppercase tracking-wider text-neutral-500 bg-neutral-50/60">
                                <th className="px-3 py-2.5">Exception</th>
                                <th className="px-3 py-2.5">Priority</th>
                                <th className="px-3 py-2.5">Trigger condition</th>
                                <th className="px-3 py-2.5">Impact when raised</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {EXCEPTION_CATALOGUE.map(e => (
                                <tr key={e.type} className="hover:bg-neutral-50/60">
                                    <td className="px-3 py-2.5">
                                        <div className="text-[12.5px] font-semibold text-neutral-900">{e.label}</div>
                                        <code className="text-[10.5px] text-neutral-500 font-mono">{e.type}</code>
                                    </td>
                                    <td className="px-3 py-2.5">
                                        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 whitespace-nowrap',
                                            priorityTint[e.priority].bg, priorityTint[e.priority].text, priorityTint[e.priority].ring)}>
                                            {e.priority}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2.5 text-[12px] text-neutral-700">{e.trigger}</td>
                                    <td className="px-3 py-2.5 text-[12px] text-neutral-600">{e.impact}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
