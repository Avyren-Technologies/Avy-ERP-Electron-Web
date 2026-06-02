import { useMemo, useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Plus,
    Upload,
    Search,
    Filter,
    Calendar,
    CheckCircle2,
    Loader2,
    Sparkles,
    XCircle,
    Banknote,
    Eye,
    MoreVertical,
    ChevronDown,
    ChevronRight,
    ChevronLeft,
    ChevronsLeft,
    ChevronsRight,
    LayoutGrid,
    Copy,
    FileSpreadsheet,
    Settings as SettingsIcon,
    Trash2,
    Lock,
    Hourglass,
    BarChart3,
    Headphones,
    Phone,
    Mail,
    X,
    TrendingUp,
    TrendingDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import { usePayrollRuns, useFiscalYearKpis } from '@/features/company-admin/api/use-payroll-run-queries';
import { useCreatePayrollRun, useDeletePayrollRun } from '@/features/company-admin/api/use-payroll-run-mutations';
import { useConfigurationStatus } from '@/features/company-admin/api/use-payroll-phases-queries';
import { useDepartments } from '@/features/company-admin/api/use-hr-queries';
import { useCompanyLocations } from '@/features/company-admin/api/use-company-admin-queries';
import { showSuccess, showApiError } from '@/lib/toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SkeletonTable } from '@/components/ui/Skeleton';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

type StatusFilter = 'all' | 'draft' | 'in_progress' | 'completed' | 'upcoming' | 'cancelled' | 'archived';

const STATUS_TABS: { id: StatusFilter; label: string }[] = [
    { id: 'all',         label: 'All Runs' },
    { id: 'draft',       label: 'Draft' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'completed',   label: 'Completed' },
    { id: 'upcoming',    label: 'Upcoming' },
    { id: 'cancelled',   label: 'Cancelled' },
    { id: 'archived',    label: 'Locked / Archived' },
];

/* ──────────────────────────────────────────────────────────────────────── */
/* Atoms                                                                    */
/* ──────────────────────────────────────────────────────────────────────── */

function StatTile({
    icon: Icon, label, sub, value, tint,
}: { icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; label: string; sub?: React.ReactNode; value: React.ReactNode; tint: 'primary' | 'success' | 'warning' | 'accent' | 'danger' | 'emerald' }) {
    const tintMap = {
        primary: 'bg-primary-50 text-primary-600',
        success: 'bg-success-50 text-success-600',
        warning: 'bg-warning-50 text-warning-600',
        accent:  'bg-accent-50 text-accent-600',
        danger:  'bg-danger-50 text-danger-600',
        emerald: 'bg-emerald-50 text-emerald-600',
    } as const;
    return (
        <div className="rounded-2xl bg-white px-4 py-5 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:shadow-md hover:ring-neutral-300">
            <div className="flex items-center gap-4">
                <div className={cn('w-12 h-12 rounded-full flex items-center justify-center shrink-0', tintMap[tint])}>
                    <Icon className="w-5 h-5" strokeWidth={2.2} />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-neutral-500 leading-tight">{label}</div>
                    <div className="mt-1.5 text-[28px] font-extrabold text-neutral-900 leading-none tabular-nums">{value}</div>
                    {sub && <div className="text-[12px] mt-1.5 leading-tight">{sub}</div>}
                </div>
            </div>
        </div>
    );
}

function RunStatusPill({ status }: { status: string }) {
    const s = status?.toLowerCase();
    const isCompleted = ['disbursed', 'archived'].includes(s);
    const isInProgress = ['attendance_locked', 'exceptions_reviewed', 'computed', 'statutory_done', 'approved'].includes(s);
    const isDraft = s === 'draft';

    if (isCompleted) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2.5 py-1 text-[11px] font-semibold text-success-700 ring-1 ring-success-200 whitespace-nowrap">
                <Lock className="w-3 h-3 shrink-0" /> Completed
            </span>
        );
    }
    if (isInProgress) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-warning-50 px-2.5 py-1 text-[11px] font-semibold text-warning-700 ring-1 ring-warning-200 whitespace-nowrap">
                <Hourglass className="w-3 h-3 shrink-0" /> In Progress
            </span>
        );
    }
    if (isDraft) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-50 px-2.5 py-1 text-[11px] font-semibold text-accent-700 ring-1 ring-accent-200 whitespace-nowrap">
                <Calendar className="w-3 h-3 shrink-0" /> Draft
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-600 ring-1 ring-neutral-200 whitespace-nowrap">
            {status}
        </span>
    );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Generic filter dropdown                                                  */
/* ──────────────────────────────────────────────────────────────────────── */

interface DropdownOption { value: string; label: string; sub?: string }

function FilterDropdown({
    icon: Icon, label, value, options, onChange, accent, alignRight,
}: {
    icon?: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    options: DropdownOption[];
    onChange: (v: string) => void;
    accent?: boolean;
    alignRight?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!open) return;
        const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, [open]);
    const selected = options.find(o => o.value === value);
    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(o => !o)}
                className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition',
                    accent
                        ? 'border-primary-200 bg-white text-primary-700 hover:bg-primary-50'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50',
                )}
            >
                {Icon && <Icon className="w-3 h-3" />}
                {selected?.label ?? label}
                <ChevronDown className={cn('w-3 h-3 transition-transform', open && 'rotate-180')} />
            </button>
            {open && (
                <div className={cn(
                    'absolute mt-2 w-56 max-h-72 overflow-y-auto rounded-xl border border-neutral-200 bg-white p-1.5 shadow-lg ring-1 ring-black/5 z-30',
                    alignRight ? 'right-0' : 'left-0',
                )}>
                    {options.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-neutral-500">No options</div>
                    ) : options.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => { onChange(opt.value); setOpen(false); }}
                            className={cn(
                                'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50',
                                opt.value === value && 'bg-primary-50 text-primary-700',
                            )}
                        >
                            <span className="min-w-0">
                                <span className="block truncate">{opt.label}</span>
                                {opt.sub && <span className="block text-[11px] text-neutral-500 truncate">{opt.sub}</span>}
                            </span>
                            {opt.value === value && <CheckCircle2 className="w-3.5 h-3.5 text-primary-600 shrink-0" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function ProgressBar({ percent, color = 'success' }: { percent: number; color?: 'success' | 'warning' | 'neutral' }) {
    const tintMap = { success: 'bg-success-500', warning: 'bg-warning-500', neutral: 'bg-neutral-400' } as const;
    return (
        <div className="w-full h-1.5 rounded-full bg-neutral-100 overflow-hidden">
            <div className={cn('h-full rounded-full transition-all', tintMap[color])} style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} />
        </div>
    );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* New Run modal                                                            */
/* ──────────────────────────────────────────────────────────────────────── */

function NewRunModal({
    onClose, onSubmit, isPending,
}: { onClose: () => void; onSubmit: (month: number, year: number) => void; isPending: boolean }) {
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm">
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
                    <h2 className="text-lg font-bold text-neutral-900">New Payroll Run</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Month</label>
                        <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
                            className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20">
                            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Year</label>
                        <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} min={2020} max={2040}
                            className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
                    </div>
                </div>
                <div className="flex gap-3 px-6 py-4 border-t border-neutral-100">
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-sm font-bold text-neutral-700 hover:bg-neutral-50">Cancel</button>
                    <button onClick={() => onSubmit(month, year)} disabled={isPending}
                        className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                        {isPending && <Loader2 className="w-4 h-4 animate-spin" />} Create Run
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Phase A guard                                                            */
/* ──────────────────────────────────────────────────────────────────────── */

function PayrollPhaseGuard({ totalSteps, completedSteps }: { totalSteps: number; completedSteps: number }) {
    const navigate = useNavigate();
    const remaining = totalSteps - completedSteps;
    const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
    return (
        <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-3xl mx-auto">
            <div className="rounded-2xl bg-white border border-warning-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-warning-50 to-rose-50 px-6 py-5 border-b border-warning-200 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-warning-100 text-warning-600 flex items-center justify-center">
                        <Lock className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-neutral-900">Configuration required</h2>
                        <p className="text-sm text-neutral-600">Complete Phase A before processing payroll runs.</p>
                    </div>
                </div>
                <div className="p-6">
                    <div className="flex items-center justify-between text-xs font-semibold mb-2">
                        <span className="text-neutral-600">Phase A progress</span>
                        <span className="text-neutral-900">{completedSteps}/{totalSteps}</span>
                    </div>
                    <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary-500 to-accent-500" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="mt-4 text-sm text-neutral-600">{remaining} step{remaining === 1 ? '' : 's'} remaining.</p>
                    <div className="mt-5 flex gap-3">
                        <button onClick={() => navigate('/app/company/hr/payroll-config-prerequisites')}
                            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-accent-600 px-4 py-3 text-sm font-bold text-white shadow">
                            Open Phase A <ChevronRight className="w-4 h-4" />
                        </button>
                        <button onClick={() => navigate('/app/company/hr/payroll-pre-run')}
                            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-primary-200 bg-white px-4 py-3 text-sm font-bold text-primary-700 hover:bg-primary-50">
                            Open Phase B
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Calendar widget                                                          */
/* ──────────────────────────────────────────────────────────────────────── */

function RunCalendar({ runs }: { runs: any[] }) {
    const [cursor, setCursor] = useState(() => {
        const now = new Date();
        return { y: now.getFullYear(), m: now.getMonth() };
    });
    const monthLabel = `${MONTHS[cursor.m]} ${cursor.y}`;
    const first = new Date(cursor.y, cursor.m, 1);
    const lastDay = new Date(cursor.y, cursor.m + 1, 0).getDate();
    const startOffset = first.getDay();
    const today = new Date();
    const isToday = (day: number) => today.getFullYear() === cursor.y && today.getMonth() === cursor.m && today.getDate() === day;

    // Days with payroll runs
    const runDays = new Set<number>();
    runs.forEach(r => {
        const runDate = new Date(r.year, (r.month ?? 1) - 1, 1); // first of month
        if (runDate.getFullYear() === cursor.y && runDate.getMonth() === cursor.m) {
            runDays.add(1); // first day of month is the conventional "run date"
        }
    });

    const cells: (number | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= lastDay; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    return (
        <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-neutral-900">Payroll Run Calendar</h3>
            </div>
            <div className="flex items-center justify-between mb-2">
                <button onClick={() => setCursor(c => c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 })}
                    className="p-1 rounded-md hover:bg-neutral-100 text-neutral-500">
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-bold text-neutral-900">{monthLabel}</span>
                <button onClick={() => setCursor(c => c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 })}
                    className="p-1 rounded-md hover:bg-neutral-100 text-neutral-500">
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-[10px] font-semibold text-neutral-500 text-center">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="py-1">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1 mt-1">
                {cells.map((day, i) => {
                    if (day === null) return <div key={i} className="aspect-square" />;
                    const has = runDays.has(day);
                    return (
                        <div key={i} className={cn(
                            'aspect-square flex items-center justify-center text-[11px] rounded-md transition-colors',
                            isToday(day) ? 'bg-primary-600 text-white font-bold'
                                : has ? 'bg-success-50 text-success-700 font-semibold'
                                : 'text-neutral-700 hover:bg-neutral-50',
                        )}>
                            {day}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Main screen                                                              */
/* ──────────────────────────────────────────────────────────────────────── */

export function PayrollRunScreen() {
    const navigate = useNavigate();
    const fmt = useCompanyFormatter();

    const [activeTab, setActiveTab] = useState<StatusFilter>('all');
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [showNewRun, setShowNewRun] = useState(false);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ runId: string; label: string } | null>(null);

    /* Toolbar filter state */
    const inferDefaultFyStart = () => {
        const now = new Date();
        return now.getMonth() + 1 >= 4 ? now.getFullYear() : now.getFullYear() - 1;
    };
    const [fyStart, setFyStart] = useState<number>(inferDefaultFyStart());
    const [selectedDeptId, setSelectedDeptId] = useState<string>('all');
    const [selectedLocationId, setSelectedLocationId] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'runDate' | 'status' | 'netPay' | 'employees'>('runDate');

    const limit = 8;

    const debounceRef = useRef<number | null>(null);
    useEffect(() => {
        if (debounceRef.current) window.clearTimeout(debounceRef.current);
        debounceRef.current = window.setTimeout(() => { setSearch(searchInput); setPage(1); }, 300);
        return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
    }, [searchInput]);

    const configStatusQuery = useConfigurationStatus();
    const configStatus = configStatusQuery.data?.data;
    const phaseAComplete = configStatus ? configStatus.completedCount >= configStatus.totalCount : true;

    const runsQuery = usePayrollRuns({ page, limit });
    const kpisQuery = useFiscalYearKpis(fyStart);

    /* Filter option sources */
    const departmentsQuery = useDepartments();
    const locationsQuery = useCompanyLocations();
    const departments: any[] = (departmentsQuery.data?.data as any[]) ?? [];
    const locations: any[] = (locationsQuery.data?.data as any[]) ?? [];

    /* FY dropdown options (current FY + 4 prior) */
    const fyOptions: DropdownOption[] = useMemo(() => {
        const cur = inferDefaultFyStart();
        const arr: DropdownOption[] = [];
        for (let i = 0; i < 5; i++) {
            const y = cur - i;
            arr.push({ value: String(y), label: `FY ${y}-${String(y + 1).slice(-2)}` });
        }
        return arr;
    }, []);

    const deptOptions: DropdownOption[] = useMemo(() => [
        { value: 'all', label: 'All Departments' },
        ...departments.map((d: any) => ({ value: d.id, label: d.name })),
    ], [departments]);

    const locationOptions: DropdownOption[] = useMemo(() => [
        { value: 'all', label: 'All Locations' },
        ...locations.map((l: any) => ({ value: l.id, label: l.name, sub: l.city ?? undefined })),
    ], [locations]);

    const sortOptions: DropdownOption[] = [
        { value: 'runDate',   label: 'Run Date (newest first)' },
        { value: 'status',    label: 'Status' },
        { value: 'netPay',    label: 'Net Pay (high → low)' },
        { value: 'employees', label: 'Employees (high → low)' },
    ];

    const runs: any[] = runsQuery.data?.data ?? [];
    const meta: any = runsQuery.data?.meta ?? null;
    const total = meta?.total ?? runs.length;
    const totalPages = Math.max(1, meta?.totalPages ?? Math.ceil(total / limit));

    const kpis: any = kpisQuery.data?.data ?? null;

    const createMutation = useCreatePayrollRun();
    const deleteMutation = useDeletePayrollRun();

    /* Local filter + sort on top of paginated server response */
    const filteredRuns = useMemo(() => {
        const filtered = runs.filter((r: any) => {
            if (search) {
                const q = search.toLowerCase();
                const label = `${MONTHS[(r.month ?? 1) - 1]} ${r.year}`.toLowerCase();
                if (!label.includes(q) && !(r.status ?? '').toLowerCase().includes(q)) return false;
            }
            // Fiscal-year filter (Indian FY: Apr–Mar)
            const runFyStart = (r.month ?? 1) >= 4 ? r.year : r.year - 1;
            if (runFyStart !== fyStart) return false;

            // Status tab
            const s = (r.status ?? '').toLowerCase();
            if (activeTab !== 'all') {
                if (activeTab === 'draft' && s !== 'draft') return false;
                if (activeTab === 'in_progress' && !['attendance_locked', 'exceptions_reviewed', 'computed', 'statutory_done', 'approved'].includes(s)) return false;
                if (activeTab === 'completed' && !['disbursed', 'archived'].includes(s)) return false;
                if (activeTab === 'upcoming') {
                    const now = new Date();
                    const runDate = new Date(r.year, (r.month ?? 1) - 1, 1);
                    if (!(s === 'draft' && runDate > now)) return false;
                }
                if (activeTab === 'archived' && s !== 'archived') return false;
                if (activeTab === 'cancelled' && s !== 'cancelled') return false;
            }
            return true;
        });

        // Sort
        const STATUS_ORDER: Record<string, number> = {
            draft: 0, attendance_locked: 1, exceptions_reviewed: 2, computed: 3,
            statutory_done: 4, approved: 5, disbursed: 6, archived: 7,
        };
        const sorted = [...filtered];
        if (sortBy === 'runDate') {
            sorted.sort((a, b) => (b.year - a.year) || ((b.month ?? 1) - (a.month ?? 1)));
        } else if (sortBy === 'status') {
            sorted.sort((a, b) => (STATUS_ORDER[(b.status ?? '').toLowerCase()] ?? 0) - (STATUS_ORDER[(a.status ?? '').toLowerCase()] ?? 0));
        } else if (sortBy === 'netPay') {
            sorted.sort((a, b) => Number(b.totalNet ?? 0) - Number(a.totalNet ?? 0));
        } else if (sortBy === 'employees') {
            sorted.sort((a, b) => (b.employeeCount ?? 0) - (a.employeeCount ?? 0));
        }
        return sorted;
    }, [runs, search, activeTab, fyStart, sortBy]);

    /* Active-filter badge counter for the "Filters" button */
    const activeFilterCount = (selectedDeptId !== 'all' ? 1 : 0) + (selectedLocationId !== 'all' ? 1 : 0);

    /* Close per-row kebab menu on outside click */
    useEffect(() => {
        if (!openMenuId) return;
        const h = () => setOpenMenuId(null);
        document.addEventListener('click', h);
        return () => document.removeEventListener('click', h);
    }, [openMenuId]);

    const handleCreateRun = async (month: number, year: number) => {
        try {
            const result = await createMutation.mutateAsync({ month, year });
            showSuccess('Payroll Run Created', `Run for ${MONTHS[month - 1]} ${year} created.`);
            setShowNewRun(false);
            const newId = result?.data?.id;
            if (newId) navigate(`/app/company/hr/payroll-runs/${newId}/wizard`);
        } catch (err) {
            showApiError(err);
        }
    };

    const requestDelete = (runId: string, label: string) => {
        setOpenMenuId(null);
        setDeleteConfirm({ runId, label });
    };

    const handleConfirmDelete = async () => {
        if (!deleteConfirm) return;
        try {
            await deleteMutation.mutateAsync(deleteConfirm.runId);
            showSuccess('Deleted', 'Payroll run deleted.');
            setDeleteConfirm(null);
        } catch (err) {
            showApiError(err);
        }
    };

    /* ── Guard: incomplete Phase A ── */
    if (configStatusQuery.isLoading) {
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }
    if (configStatus && !phaseAComplete) {
        return <PayrollPhaseGuard totalSteps={configStatus.totalCount} completedSteps={configStatus.completedCount} />;
    }

    const vsLastFY = kpis?.vsLastFYPct ?? 0;

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto font-inter space-y-5">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-xs text-neutral-500">
                <span className="text-neutral-600">Payroll</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-neutral-800 font-medium">Payroll Runs</span>
            </nav>

            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-neutral-900">Payroll Runs</h1>
                    <p className="text-sm text-neutral-500 mt-1.5">Create, manage and track all your payroll runs in one place.</p>
                </div>
                <div className="flex items-center gap-2.5">
                    <button className="inline-flex items-center gap-2 rounded-lg border border-primary-200 bg-white px-4 py-2 text-sm font-semibold text-primary-700 shadow-sm hover:bg-primary-50">
                        <Upload className="w-4 h-4" /> Import Payroll Run
                    </button>
                    <button onClick={() => setShowNewRun(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary-600 to-accent-600 px-4 py-2 text-sm font-bold text-white shadow-primary-500/25 shadow-md hover:from-primary-700 hover:to-accent-700">
                        <Plus className="w-4 h-4" /> New Payroll Run
                    </button>
                </div>
            </div>

            {/* KPI strip (6 tiles) */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                <StatTile icon={Calendar}     label="Total Payroll Runs"  value={kpis?.totalRuns ?? '—'}   sub={kpis?.fiscalYear ?? ''} tint="primary" />
                <StatTile icon={CheckCircle2} label="Completed Runs"      value={kpis?.completed ?? '—'}   sub={kpis ? <span className="text-success-600 font-semibold">{kpis.completedPct}%</span> : null} tint="success" />
                <StatTile icon={Hourglass}    label="In Progress Runs"    value={kpis?.inProgress ?? '—'}  sub={kpis ? <span className="text-warning-600 font-semibold">{kpis.inProgressPct}%</span> : null} tint="warning" />
                <StatTile icon={Calendar}     label="Upcoming Runs"       value={kpis?.upcoming ?? '—'}    sub={kpis ? <span className="text-accent-600 font-semibold">{kpis.upcomingPct}%</span> : null} tint="accent" />
                <StatTile icon={XCircle}      label="Cancelled Runs"      value={kpis?.cancelled ?? '—'}   sub={kpis ? <span className="text-danger-600 font-semibold">{kpis.cancelledPct}%</span> : null} tint="danger" />
                <StatTile icon={Banknote}     label="Net Pay Disbursed (FY)"
                    value={<span className="text-emerald-700">₹{Number(kpis?.netPayDisbursed ?? 0).toLocaleString('en-IN')}</span>}
                    sub={kpis ? (
                        <span className={cn('font-semibold inline-flex items-center gap-0.5', vsLastFY >= 0 ? 'text-success-600' : 'text-danger-600')}>
                            {vsLastFY >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            vs Last FY {vsLastFY >= 0 ? '+' : ''}{vsLastFY}%
                        </span>
                    ) : null}
                    tint="emerald" />
            </div>

            {/* Two-column main */}
            <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
                {/* Tabs + filters + table */}
                <div className="rounded-2xl bg-white ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
                    {/* Tabs */}
                    <div className="flex gap-5 overflow-x-auto border-b border-neutral-100 px-5 pt-4">
                        {STATUS_TABS.map(t => (
                            <button
                                key={t.id}
                                onClick={() => { setActiveTab(t.id); setPage(1); }}
                                className={cn(
                                    'pb-3 text-sm font-bold border-b-2 transition whitespace-nowrap',
                                    activeTab === t.id ? 'border-primary-600 text-primary-700' : 'border-transparent text-neutral-500 hover:text-neutral-800',
                                )}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-neutral-100">
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                                <input
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    placeholder="Search by run name or period…"
                                    className="w-64 rounded-lg border border-neutral-200 bg-white pl-8 pr-3 py-1.5 text-xs text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
                                />
                            </div>
                            <FilterDropdown
                                icon={Calendar}
                                label="Current FY"
                                value={String(fyStart)}
                                options={fyOptions}
                                onChange={(v) => { setFyStart(Number(v)); setPage(1); }}
                            />
                            <FilterDropdown
                                label="All Departments"
                                value={selectedDeptId}
                                options={deptOptions}
                                onChange={setSelectedDeptId}
                            />
                            <FilterDropdown
                                label="All Locations"
                                value={selectedLocationId}
                                options={locationOptions}
                                onChange={setSelectedLocationId}
                            />
                            <button
                                onClick={() => { setSelectedDeptId('all'); setSelectedLocationId('all'); setSortBy('runDate'); setFyStart(inferDefaultFyStart()); }}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 bg-white px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-50"
                            >
                                <Filter className="w-3 h-3" /> Reset
                                {activeFilterCount > 0 && (
                                    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary-600 text-white text-[10px] font-bold">{activeFilterCount}</span>
                                )}
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-neutral-500">Sort by:</span>
                            <FilterDropdown
                                label="Run Date"
                                value={sortBy}
                                options={sortOptions}
                                onChange={(v) => setSortBy(v as 'runDate' | 'status' | 'netPay' | 'employees')}
                                alignRight
                            />
                            <button className="p-1.5 rounded-lg border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50" title="Grid view (coming soon)">
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        {runsQuery.isLoading ? (
                            <div className="p-5"><SkeletonTable rows={6} cols={9} /></div>
                        ) : filteredRuns.length === 0 ? (
                            <div className="px-6 py-12 text-center text-sm text-neutral-500">No payroll runs found.</div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 bg-neutral-50/60">
                                        <th className="px-4 py-3">Run Name</th>
                                        <th className="px-4 py-3 hidden md:table-cell">Payroll Period</th>
                                        <th className="px-4 py-3 hidden lg:table-cell">Pay Date</th>
                                        <th className="px-4 py-3 hidden lg:table-cell">Employees</th>
                                        <th className="px-4 py-3">Net Pay (₹)</th>
                                        <th className="px-4 py-3 whitespace-nowrap min-w-[120px]">Status</th>
                                        <th className="px-4 py-3 hidden xl:table-cell">Progress</th>
                                        <th className="px-4 py-3 hidden xl:table-cell">Created By</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100">
                                    {filteredRuns.map((r) => {
                                        const monthLabel = MONTHS[(r.month ?? 1) - 1];
                                        const monthShort = monthLabel?.slice(0, 3).toUpperCase();
                                        const monthStart = new Date(r.year, (r.month ?? 1) - 1, 1).toISOString();
                                        const monthEnd = new Date(r.year, r.month ?? 1, 0).toISOString();
                                        const payDate = new Date(r.year, r.month ?? 1, 5);
                                        const s = (r.status ?? '').toLowerCase();
                                        const completedStep = ({
                                            draft: 0, attendance_locked: 1, exceptions_reviewed: 2, computed: 3,
                                            statutory_done: 4, approved: 5, disbursed: 6, archived: 6,
                                        } as Record<string, number>)[s] ?? 0;
                                        const pct = Math.round((completedStep / 6) * 100);
                                        const isCompleted = ['disbursed', 'archived'].includes(s);
                                        const isCancelled = s === 'cancelled';
                                        const progressColor: 'success' | 'warning' | 'neutral' = isCompleted ? 'success' : isCancelled ? 'neutral' : 'warning';

                                        return (
                                            <tr key={r.id} className="group hover:bg-neutral-50/60 cursor-pointer"
                                                onClick={() => navigate(`/app/company/hr/payroll-runs/${r.id}/wizard`)}>
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 rounded-xl bg-primary-50 flex flex-col items-center justify-center shrink-0">
                                                            <span className="text-[9px] font-bold text-primary-600 uppercase tracking-wider">{monthShort}</span>
                                                            <span className="text-[10px] font-bold text-primary-700">{r.year}</span>
                                                        </div>
                                                        <div>
                                                            <div className="text-[13.5px] font-bold text-neutral-900 whitespace-nowrap">{monthLabel} {r.year} Payroll</div>
                                                            <div className="text-[11.5px] text-neutral-500">Regular Payroll</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 hidden md:table-cell whitespace-nowrap">
                                                    <div className="text-[12.5px] text-neutral-700">{fmt.date(monthStart)} – {fmt.date(monthEnd)}</div>
                                                    <div className="text-[11px] text-neutral-500">Monthly</div>
                                                </td>
                                                <td className="px-4 py-3.5 hidden lg:table-cell whitespace-nowrap">
                                                    <div className="text-[12.5px] text-neutral-700">{fmt.date(payDate.toISOString())}</div>
                                                    <div className="text-[11px] text-neutral-500">{payDate.toLocaleDateString('en-US', { weekday: 'long' })}</div>
                                                </td>
                                                <td className="px-4 py-3.5 hidden lg:table-cell">
                                                    <div className="text-[12.5px] font-semibold text-neutral-700">{r.employeeCount ?? 0}</div>
                                                    <div className="text-[11px] text-neutral-500">{isCancelled ? 'Cancelled' : 'Active'}</div>
                                                </td>
                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    {r.totalNet || r.totalNetPay ? (
                                                        <span className="text-[13px] font-bold font-mono text-neutral-900">
                                                            ₹{Number(r.totalNet ?? r.totalNetPay).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                                        </span>
                                                    ) : <span className="text-neutral-400">—</span>}
                                                </td>
                                                <td className="px-4 py-3.5 whitespace-nowrap min-w-[120px]"><RunStatusPill status={r.status ?? 'draft'} /></td>
                                                <td className="px-4 py-3.5 hidden xl:table-cell w-[180px]">
                                                    <div className="space-y-1.5">
                                                        <div className="flex items-center justify-between text-[11px]">
                                                            <span className={cn('font-semibold', isCompleted ? 'text-success-600' : isCancelled ? 'text-neutral-400' : 'text-warning-600')}>{pct}%</span>
                                                        </div>
                                                        <ProgressBar percent={pct} color={progressColor} />
                                                        <div className="text-[10.5px] text-neutral-500">
                                                            {isCompleted ? `Completed on ${r.lockedAt ? fmt.date(r.lockedAt) : fmt.date(monthEnd)}`
                                                                : isCancelled ? 'Cancelled'
                                                                : completedStep === 0 ? 'Not Started'
                                                                : `Step ${completedStep} of 6`}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 hidden xl:table-cell whitespace-nowrap">
                                                    <div className="text-[12.5px] font-semibold text-neutral-700">{r.createdByName ?? r.lockedByName ?? r.computedByName ?? r.approvedByName ?? 'System'}</div>
                                                    <div className="text-[11px] text-neutral-500">{r.createdAt ? fmt.date(r.createdAt) : '—'}</div>
                                                </td>
                                                <td className="px-4 py-3.5 text-right">
                                                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                                        <button onClick={() => navigate(`/app/company/hr/payroll-runs/${r.id}/wizard`)}
                                                            className="inline-flex items-center justify-center w-7 h-7 rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-primary-600">
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <div className="relative">
                                                            <button onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === r.id ? null : r.id); }}
                                                                className="inline-flex items-center justify-center w-7 h-7 rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700">
                                                                <MoreVertical className="w-4 h-4" />
                                                            </button>
                                                            {openMenuId === r.id && (
                                                                <div className="absolute right-0 top-8 w-48 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-lg z-20"
                                                                    onClick={(e) => e.stopPropagation()}>
                                                                    <button onClick={() => navigate(`/app/company/hr/payroll-runs/${r.id}/wizard`)}
                                                                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                                                                        <Eye className="w-4 h-4" /> View / Continue
                                                                    </button>
                                                                    {!['disbursed', 'archived'].includes(s) && (
                                                                        <button onClick={() => requestDelete(r.id, `${monthLabel} ${r.year}`)}
                                                                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger-600 hover:bg-danger-50">
                                                                            <Trash2 className="w-4 h-4" /> Delete Run
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {total > 0 && (
                        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-neutral-100">
                            <span className="text-[12px] text-neutral-500">
                                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} payroll runs
                            </span>
                            <div className="flex items-center gap-1">
                                <button disabled={page === 1} onClick={() => setPage(1)}
                                    className={cn('w-7 h-7 rounded-md text-neutral-700 hover:bg-neutral-100', page === 1 && 'opacity-40 cursor-not-allowed')}>
                                    <ChevronsLeft className="w-3.5 h-3.5 mx-auto" />
                                </button>
                                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                                    className={cn('w-7 h-7 rounded-md text-neutral-700 hover:bg-neutral-100', page === 1 && 'opacity-40 cursor-not-allowed')}>
                                    <ChevronLeft className="w-3.5 h-3.5 mx-auto" />
                                </button>
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    const p = i + 1;
                                    return (
                                        <button key={p} onClick={() => setPage(p)}
                                            className={cn('min-w-[28px] h-7 px-2 rounded-md text-xs font-semibold',
                                                p === page ? 'bg-primary-600 text-white' : 'text-neutral-700 hover:bg-neutral-100')}>
                                            {p}
                                        </button>
                                    );
                                })}
                                {totalPages > 5 && <span className="px-2 text-xs text-neutral-400">…</span>}
                                {totalPages > 5 && (
                                    <button onClick={() => setPage(totalPages)}
                                        className={cn('min-w-[28px] h-7 px-2 rounded-md text-xs font-semibold',
                                            page === totalPages ? 'bg-primary-600 text-white' : 'text-neutral-700 hover:bg-neutral-100')}>
                                        {totalPages}
                                    </button>
                                )}
                                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                                    className={cn('w-7 h-7 rounded-md text-neutral-700 hover:bg-neutral-100', page === totalPages && 'opacity-40 cursor-not-allowed')}>
                                    <ChevronRight className="w-3.5 h-3.5 mx-auto" />
                                </button>
                                <button disabled={page === totalPages} onClick={() => setPage(totalPages)}
                                    className={cn('w-7 h-7 rounded-md text-neutral-700 hover:bg-neutral-100', page === totalPages && 'opacity-40 cursor-not-allowed')}>
                                    <ChevronsRight className="w-3.5 h-3.5 mx-auto" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right sidebar */}
                <aside className="space-y-4">
                    {/* Create New */}
                    <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                        <h3 className="text-sm font-bold text-neutral-900">Create New Payroll Run</h3>
                        <p className="text-[12.5px] text-neutral-500 mt-1">Start a new payroll run for a specific month.</p>
                        <button onClick={() => setShowNewRun(true)}
                            className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-accent-600 px-4 py-3 text-sm font-bold text-white shadow-primary-500/25 shadow-md hover:from-primary-700 hover:to-accent-700">
                            <Plus className="w-4 h-4" /> New Payroll Run
                        </button>
                        <button className="mt-2 w-full inline-flex items-center justify-center gap-1 text-[12.5px] font-semibold text-primary-600 hover:text-primary-700">
                            or Schedule in Advance <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Quick Actions */}
                    <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                        <h3 className="text-sm font-bold text-neutral-900 mb-3">Quick Actions</h3>
                        <ul className="space-y-1">
                            {[
                                { icon: Copy, label: 'Duplicate Payroll Run', onClick: () => {} },
                                { icon: Upload, label: 'Import Payroll Run', onClick: () => {} },
                                { icon: FileSpreadsheet, label: 'Payroll Run Templates', onClick: () => {} },
                                { icon: SettingsIcon, label: 'Configure Payroll Settings', onClick: () => navigate('/app/company/hr/payroll-config-prerequisites') },
                            ].map(a => (
                                <li key={a.label}>
                                    <button onClick={a.onClick} className="group flex items-center gap-2.5 w-full rounded-lg px-2 py-2 text-[12.5px] text-neutral-700 hover:bg-neutral-50">
                                        <a.icon className="w-3.5 h-3.5 text-primary-500" />
                                        {a.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Calendar */}
                    <RunCalendar runs={runs} />

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
                            <a href="mailto:payroll.support@avyerp.com" className="flex items-center gap-2 text-[12.5px] text-white hover:text-white/90">
                                <Mail className="w-3.5 h-3.5" /> payroll.support@avyerp.com
                            </a>
                            <a href="tel:+91 9019189889" className="flex items-center gap-2 text-[12.5px] text-white hover:text-white/90 mt-1.5">
                                <Phone className="w-3.5 h-3.5" /> +91 9019189889
                            </a>
                        </div>
                    </div>
                </aside>
            </div>

            {showNewRun && (
                <NewRunModal
                    onClose={() => setShowNewRun(false)}
                    onSubmit={handleCreateRun}
                    isPending={createMutation.isPending}
                />
            )}

            <ConfirmDialog
                open={!!deleteConfirm}
                title="Delete Payroll Run"
                message={
                    deleteConfirm
                        ? `Delete the payroll run for ${deleteConfirm.label}? This action cannot be undone.`
                        : ''
                }
                confirmLabel="Delete Run"
                loading={deleteMutation.isPending}
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeleteConfirm(null)}
                variant="danger"
            />
        </div>
    );
}

export default PayrollRunScreen;
