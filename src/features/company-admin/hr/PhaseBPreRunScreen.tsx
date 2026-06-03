import { useMemo, useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
    Calendar,
    Clock,
    UserPlus,
    UserCheck,
    ArrowLeftRight,
    Lock,
    Landmark,
    Receipt,
    CalendarCheck,
    CheckCircle2,
    AlertCircle,
    AlertTriangle,
    Info,
    ChevronRight,
    ChevronDown,
    RefreshCcw,
    Download,
    BarChart3,
    Sparkles,
    Phone,
    Mail,
    Headphones,
    ArrowRight,
    Pencil,
    ShieldCheck,
    XCircle,
    HelpCircle,
    Activity,
} from 'lucide-react';
import { usePreRunChecklist } from '@/features/company-admin/api/use-payroll-phases-queries';
import { usePayrollRuns } from '@/features/company-admin/api/use-payroll-run-queries';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';

/* ──────────────────────────────────────────────────────────────────────── */
/* Types                                                                    */
/* ──────────────────────────────────────────────────────────────────────── */

type ActivityStatus = 'COMPLETE' | 'PENDING' | 'IN_PROGRESS' | 'BLOCKED';
type Priority = 'HIGH' | 'MEDIUM' | 'LOW';

interface BackendActivity {
    id: string;
    activityNumber: number;
    name: string;
    description: string;
    status: ActivityStatus;
    priority: Priority;
    pendingCount: number | null;
    blockerReason: string | null;
    /** Backend-provided deep link for this activity. Each activity routes to the
     * page where the user can actually resolve it (attendance, approvals, etc.). */
    actionUrl?: string;
}

interface BackendChecklist {
    completedCount: number;
    totalCount: number;
    run: { id: string; month: number; year: number; status: string; employeeCount: number };
    keyStats: { totalEmployees: number; totalMonthlyCTC: number; newJoiners: number; exits: number };
    activities: BackendActivity[];
}

interface ActivityMeta {
    icon: React.ComponentType<{ className?: string }>;
    iconTint: string;
    estMin: number;
    ownerRole: string;
    ownerTint: string;
}

const ACTIVITY_META: Record<string, ActivityMeta> = {
    verify_attendance:     { icon: CalendarCheck,  iconTint: 'bg-emerald-50 text-emerald-600', estMin: 20, ownerRole: 'HR Admin',        ownerTint: 'bg-emerald-100 text-emerald-700' },
    pending_approvals:     { icon: CheckCircle2,   iconTint: 'bg-success-50 text-success-600', estMin: 15, ownerRole: 'HR Admin',        ownerTint: 'bg-success-100 text-success-700' },
    salary_revisions:      { icon: UserCheck,      iconTint: 'bg-accent-50 text-accent-600',   estMin: 30, ownerRole: 'Payroll Officer', ownerTint: 'bg-accent-100 text-accent-700' },
    one_time_adjustments:  { icon: ArrowLeftRight, iconTint: 'bg-primary-50 text-primary-600', estMin: 20, ownerRole: 'Payroll Officer', ownerTint: 'bg-primary-100 text-primary-700' },
    review_exceptions:     { icon: AlertCircle,    iconTint: 'bg-warning-50 text-warning-600', estMin: 25, ownerRole: 'Payroll Officer', ownerTint: 'bg-warning-100 text-warning-700' },
    statutory_compliance:  { icon: ShieldCheck,    iconTint: 'bg-violet-50 text-violet-600',   estMin: 20, ownerRole: 'Compliance',      ownerTint: 'bg-violet-100 text-violet-700' },
    new_joiners_exits:     { icon: UserPlus,       iconTint: 'bg-sky-50 text-sky-600',         estMin: 20, ownerRole: 'HR Admin',        ownerTint: 'bg-sky-100 text-sky-700' },
    loan_adjustments:      { icon: Landmark,       iconTint: 'bg-amber-50 text-amber-600',     estMin: 15, ownerRole: 'Finance Lead',    ownerTint: 'bg-amber-100 text-amber-700' },
    salary_holds:          { icon: Lock,           iconTint: 'bg-danger-50 text-danger-600',   estMin: 15, ownerRole: 'Payroll Officer', ownerTint: 'bg-danger-100 text-danger-700' },
    payroll_readiness:     { icon: Activity,       iconTint: 'bg-neutral-100 text-neutral-700', estMin: 20, ownerRole: 'Payroll Officer', ownerTint: 'bg-neutral-200 text-neutral-700' },
};

const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/* ──────────────────────────────────────────────────────────────────────── */
/* Atoms                                                                    */
/* ──────────────────────────────────────────────────────────────────────── */

function ProgressDonut({ completed, total }: { completed: number; total: number }) {
    const pct = total > 0 ? completed / total : 0;
    const radius = 38;
    const circ = 2 * Math.PI * radius;
    const offset = circ - pct * circ;
    return (
        <div className="relative w-[110px] h-[110px] shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <defs>
                    <linearGradient id="phaseB-donut" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#6366F1" />
                        <stop offset="100%" stopColor="#8B5CF6" />
                    </linearGradient>
                </defs>
                <circle cx="50" cy="50" r={radius} fill="none" stroke="#E2E8F0" strokeWidth="9" />
                <circle
                    cx="50" cy="50" r={radius} fill="none"
                    stroke="url(#phaseB-donut)" strokeWidth="9" strokeLinecap="round"
                    strokeDasharray={circ} strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset 600ms ease-out' }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[22px] font-bold text-neutral-900 leading-none">{completed}/{total}</span>
                <span className="text-[11px] text-neutral-500 mt-1 font-medium tracking-wide">Completed</span>
            </div>
        </div>
    );
}

function StatusPill({ status, pendingCount }: { status: ActivityStatus; pendingCount: number | null }) {
    const map: Record<ActivityStatus, { label: string; bg: string; text: string; ring: string; Icon: React.ComponentType<{ className?: string }> }> = {
        COMPLETE:    { label: 'Completed',   bg: 'bg-success-50', text: 'text-success-700', ring: 'ring-success-200', Icon: CheckCircle2 },
        IN_PROGRESS: { label: 'In Progress', bg: 'bg-warning-50', text: 'text-warning-700', ring: 'ring-warning-200', Icon: Clock },
        BLOCKED:     { label: 'Issues',      bg: 'bg-danger-50',  text: 'text-danger-700',  ring: 'ring-danger-200',  Icon: AlertCircle },
        PENDING:     { label: 'Pending',     bg: 'bg-neutral-100', text: 'text-neutral-600', ring: 'ring-neutral-200', Icon: Clock },
    };
    const { label, bg, text, ring, Icon } = map[status];
    return (
        <div className="flex flex-col gap-0.5">
            <span className={cn('inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1', bg, text, ring)}>
                <Icon className="w-3 h-3" /> {label}
            </span>
            {status === 'BLOCKED' && pendingCount != null && pendingCount > 0 && (
                <span className="text-[10.5px] text-danger-600 font-medium">{pendingCount} employees</span>
            )}
        </div>
    );
}

function PriorityChip({ priority }: { priority: Priority }) {
    const map: Record<Priority, string> = {
        HIGH:   'text-danger-600',
        MEDIUM: 'text-warning-600',
        LOW:    'text-neutral-500',
    };
    return <span className={cn('text-[11px] font-bold uppercase tracking-wider', map[priority])}>{priority}</span>;
}

function ActionLink({ status, actionUrl }: { status: ActivityStatus; actionUrl: string }) {
    let label = 'Start';
    let tint = 'text-primary-600 hover:text-primary-700';
    if (status === 'COMPLETE')         { label = 'View Details'; }
    else if (status === 'IN_PROGRESS') { label = 'Continue'; }
    else if (status === 'BLOCKED')     { label = 'Resolve Issues'; tint = 'text-danger-600 hover:text-danger-700'; }

    return (
        <Link to={actionUrl} className={cn('inline-flex items-center gap-1 text-xs font-semibold whitespace-nowrap', tint)}>
            {label} <ChevronRight className="w-3.5 h-3.5" />
        </Link>
    );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Pre-Run Actions dropdown                                                  */
/* ──────────────────────────────────────────────────────────────────────── */

function PreRunActions({ onRefresh, onExport }: { onRefresh: () => void; onExport: () => void }) {
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
                Pre-Run Actions <ChevronDown className={cn('w-4 h-4 transition-transform', open && 'rotate-180')} />
            </button>
            {open && (
                <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-neutral-200 bg-white p-1.5 shadow-lg ring-1 ring-black/5 z-30">
                    <button onClick={() => { setOpen(false); onRefresh(); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                        <RefreshCcw className="w-4 h-4" /> Refresh Status
                    </button>
                    <button onClick={() => { setOpen(false); onExport(); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                        <Download className="w-4 h-4" /> Export Checklist
                    </button>
                </div>
            )}
        </div>
    );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Right-sidebar data (static for now — backend extensions later)            */
/* ──────────────────────────────────────────────────────────────────────── */

const DOCUMENTS = [
    { label: 'Attendance Summary',     icon: CalendarCheck, to: '/app/company/hr/attendance' },
    { label: 'Leave Summary',          icon: Calendar,      to: '/app/company/hr/my-leave' },
    { label: 'Pending Regularizations', icon: AlertCircle,  to: '/app/company/hr/attendance-overrides' },
    { label: 'Reimbursement Claims',   icon: Receipt,       to: '/app/company/hr/expenses' },
    { label: 'Salary Revision Report', icon: BarChart3,     to: '/app/company/hr/salary-revisions' },
];

/* ──────────────────────────────────────────────────────────────────────── */
/* Main screen                                                              */
/* ──────────────────────────────────────────────────────────────────────── */

export function PhaseBPreRunScreen() {
    const navigate = useNavigate();
    const fmt = useCompanyFormatter();
    const [searchParams] = useSearchParams();
    const explicitRunId = searchParams.get('runId') ?? '';
    const [activeTab, setActiveTab] = useState<'pre-run' | 'full-run'>('pre-run');

    /* ── 1. Resolve active runId ── */
    const { data: runsResp, isLoading: runsLoading } = usePayrollRuns({ pageSize: 20 });
    const runsList: any[] = (runsResp?.data as any[]) ?? [];

    const inferredRunId = useMemo(() => {
        if (explicitRunId) return explicitRunId;
        const preExec = runsList.find(r => ['DRAFT', 'ATTENDANCE_LOCKED', 'EXCEPTIONS_REVIEWED', 'COMPUTED', 'STATUTORY_DONE'].includes(r.status));
        if (preExec) return preExec.id;
        return runsList[0]?.id ?? '';
    }, [explicitRunId, runsList]);

    /* ── 2. Fetch checklist for that run ── */
    const { data: checklistResp, isLoading: checklistLoading, refetch } = usePreRunChecklist(inferredRunId);
    const checklist = checklistResp?.data as BackendChecklist | undefined;

    /* ── 3. Derived state ── */
    const counts = useMemo(() => {
        const c = { complete: 0, inProgress: 0, issues: 0, pending: 0 };
        (checklist?.activities ?? []).forEach(a => {
            if (a.status === 'COMPLETE') c.complete++;
            else if (a.status === 'IN_PROGRESS') c.inProgress++;
            else if (a.status === 'BLOCKED') c.issues++;
            else c.pending++;
        });
        return c;
    }, [checklist]);

    const completed = checklist?.completedCount ?? 0;
    const total = checklist?.totalCount ?? 10;

    const blockingIssues = (checklist?.activities ?? []).filter(a => a.status === 'BLOCKED');
    const blockingHolds = (checklist?.activities ?? []).find(a => a.id === 'salary_holds' && a.status === 'BLOCKED');
    const allReady = completed >= total && blockingIssues.length === 0;

    const onRefresh = () => refetch();
    const onExport = () => window.print();

    /* ── 4. Empty state — no payroll runs at all ── */
    if (!runsLoading && runsList.length === 0) {
        return (
            <div className="px-6 py-10 font-inter">
                <EmptyState
                    icon="inbox"
                    title="No payroll runs yet"
                    message="You need to create a payroll run before pre-run activities can be evaluated."
                    action={{ label: 'Open Payroll Run Wizard', onClick: () => navigate('/app/company/hr/payroll-runs') }}
                />
            </div>
        );
    }

    /* ── 5. Loading state ── */
    if (runsLoading || checklistLoading || !checklist) {
        return (
            <div className="p-6 space-y-4 font-inter">
                <SkeletonTable rows={6} cols={6} />
            </div>
        );
    }

    /* ── 6. Compute Pre-Run Health Check rows from checklist data ── */
    const acts = checklist.activities;
    const get = (id: string) => acts.find(a => a.id === id);

    const healthChecks = [
        {
            label: 'Attendance Closed',
            sub: (() => {
                const pending = get('verify_attendance')?.pendingCount ?? 0;
                return pending === 0 ? 'All attendance reviewed' : `${pending} record${pending === 1 ? '' : 's'} pending review`;
            })(),
            ok: get('verify_attendance')?.status === 'COMPLETE',
            warn: false,
            icon: CalendarCheck,
        },
        {
            label: 'Leaves Actioned',
            sub: 'All leave requests are actioned',
            ok: get('pending_approvals')?.status === 'COMPLETE',
            warn: false,
            icon: Calendar,
        },
        {
            label: 'Pending Regularizations',
            sub: `${get('review_exceptions')?.pendingCount ?? 0} pending`,
            ok: (get('review_exceptions')?.pendingCount ?? 0) === 0,
            warn: false,
            icon: AlertCircle,
        },
        {
            label: 'Salary Holds',
            sub: `${get('salary_holds')?.pendingCount ?? 0} employees on hold`,
            ok: (get('salary_holds')?.pendingCount ?? 0) === 0,
            warn: false,
            icon: Lock,
        },
        {
            label: 'Loan EMI Schedules',
            sub: 'All active and verified',
            ok: get('loan_adjustments')?.status === 'COMPLETE',
            warn: false,
            icon: Landmark,
        },
        {
            label: 'Reimbursement Claims',
            sub: `${get('one_time_adjustments')?.pendingCount ?? 0} pending review`,
            ok: (get('one_time_adjustments')?.pendingCount ?? 0) === 0,
            warn: (get('one_time_adjustments')?.pendingCount ?? 0) > 0,
            icon: Receipt,
        },
    ];

    const pendingItems = acts
        .filter(a => a.status === 'BLOCKED' || (a.status === 'PENDING' && (a.pendingCount ?? 0) > 0))
        .slice(0, 4)
        .map(a => ({
            label: a.name,
            sub: a.blockerReason || (a.pendingCount != null ? `${a.pendingCount} pending` : 'Needs attention'),
            priority: a.priority,
            id: a.id,
        }));

    const periodLabel = `${MONTHS[checklist.run.month]} ${checklist.run.year} Payroll`;
    const monthStart = new Date(checklist.run.year, checklist.run.month - 1, 1).toISOString();
    const monthEnd = new Date(checklist.run.year, checklist.run.month, 0).toISOString();
    const payDate = new Date(checklist.run.year, checklist.run.month, 5).toISOString();

    /* ── Render ───────────────────────────────────────────────── */
    return (
        <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto font-inter pb-24">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-xs text-neutral-500 mb-2">
                <Link to="/app/company/hr/payroll-runs" className="hover:text-neutral-800 transition">Payroll</Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-neutral-800 font-medium">Pre-Run Activities (Phase B)</span>
            </nav>

            {/* Header */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-6">
                <div>
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-neutral-900">Phase B – Pre-Run Activities</h1>
                        <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-3 py-1 text-xs font-semibold text-success-700 ring-1 ring-success-200">
                            <Sparkles className="w-3 h-3" /> Every Payroll Cycle
                        </span>
                    </div>
                    <p className="text-sm text-neutral-500 mt-2 max-w-2xl">
                        Complete all pre-run activities to ensure accurate and smooth payroll execution.
                    </p>
                </div>
                <div className="flex items-center gap-2.5">
                    <PreRunActions onRefresh={onRefresh} onExport={onExport} />
                    <button
                        disabled={!allReady}
                        onClick={() => navigate(`/app/company/hr/payroll-runs/${checklist.run.id}/wizard`)}
                        className={cn(
                            'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold shadow-sm transition',
                            allReady
                                ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-primary-500/25 hover:from-primary-700 hover:to-accent-700'
                                : 'bg-neutral-200 text-neutral-500 cursor-not-allowed',
                        )}
                    >
                        Proceed to Payroll Run Wizard <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Hero: 3 cards (progress / period / key stats) */}
            <div className="grid gap-4 mb-6 lg:grid-cols-3">
                {/* Pre-Run Progress */}
                <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                    <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3">Pre-Run Progress</div>
                    <div className="flex items-center gap-5">
                        <ProgressDonut completed={completed} total={total} />
                        <div className="space-y-2 flex-1">
                            <div className="flex items-center justify-between gap-3">
                                <span className="flex items-center gap-2 text-[12.5px] text-neutral-700"><span className="w-2 h-2 rounded-full bg-success-500" /> Completed</span>
                                <span className="text-sm font-bold text-neutral-900">{counts.complete}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span className="flex items-center gap-2 text-[12.5px] text-neutral-700"><span className="w-2 h-2 rounded-full bg-warning-500" /> In Progress</span>
                                <span className="text-sm font-bold text-neutral-900">{counts.inProgress}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span className="flex items-center gap-2 text-[12.5px] text-neutral-700"><span className="w-2 h-2 rounded-full bg-danger-500" /> Issues</span>
                                <span className="text-sm font-bold text-neutral-900">{counts.issues}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span className="flex items-center gap-2 text-[12.5px] text-neutral-700"><span className="w-2 h-2 rounded-full bg-neutral-400" /> Pending</span>
                                <span className="text-sm font-bold text-neutral-900">{counts.pending}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payroll Period */}
                <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                            <div className="w-7 h-7 rounded-full bg-info-50 text-info-600 flex items-center justify-center">
                                <Calendar className="w-3.5 h-3.5" />
                            </div>
                            Payroll Period
                        </div>
                        <button
                            onClick={() => navigate(`/app/company/hr/payroll-runs/${checklist.run.id}/wizard`)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700"
                        >
                            <Pencil className="w-3 h-3" /> Edit Period
                        </button>
                    </div>
                    <div className="text-xl font-bold text-neutral-900">{periodLabel}</div>
                    <div className="text-[12.5px] text-neutral-600 mt-2">
                        {fmt.date(monthStart)} – {fmt.date(monthEnd)}
                    </div>
                    <div className="text-[12.5px] text-neutral-500 mt-1">
                        Pay Date (Tentative): <span className="font-semibold text-neutral-700">{fmt.date(payDate)}</span>
                    </div>
                </div>

                {/* Key Stats */}
                <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3">
                        <div className="w-7 h-7 rounded-full bg-accent-50 text-accent-600 flex items-center justify-center">
                            <BarChart3 className="w-3.5 h-3.5" />
                        </div>
                        Key Stats
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <KeyStat label="Total Employees" value={checklist.keyStats.totalEmployees} />
                        <KeyStat label="Active" value={checklist.run.employeeCount || checklist.keyStats.totalEmployees} />
                        <KeyStat label="New Joiners" value={checklist.keyStats.newJoiners} accent="success" />
                        <KeyStat label="Exits in Period" value={checklist.keyStats.exits} accent="danger" />
                    </div>
                </div>
            </div>

            {/* Two-column main */}
            <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
                {/* Checklist table */}
                <div className="rounded-2xl bg-white ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
                    {/* Tabs */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 px-5 pt-4">
                        <div className="flex gap-6">
                            <button
                                onClick={() => setActiveTab('pre-run')}
                                className={cn(
                                    'pb-3 text-sm font-bold border-b-2 transition',
                                    activeTab === 'pre-run' ? 'border-primary-600 text-primary-700' : 'border-transparent text-neutral-500 hover:text-neutral-800',
                                )}
                            >
                                Pre-Run Activities <span className={cn('ml-1.5 text-[11px] font-semibold', activeTab === 'pre-run' ? 'text-primary-600' : 'text-neutral-400')}>({total})</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('full-run')}
                                className={cn(
                                    'pb-3 text-sm font-bold border-b-2 transition',
                                    activeTab === 'full-run' ? 'border-primary-600 text-primary-700' : 'border-transparent text-neutral-500 hover:text-neutral-800',
                                )}
                            >
                                Full-Run Activities
                            </button>
                        </div>
                        <div className="flex items-center gap-4 text-[11px] text-neutral-500 pb-3">
                            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-danger-500" /> High</span>
                            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning-500" /> Medium</span>
                            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-neutral-400" /> Low</span>
                            <span className="inline-flex items-center gap-1.5 ml-2"><Clock className="w-3 h-3" /> Estimated Time</span>
                        </div>
                    </div>

                    {activeTab === 'pre-run' ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 bg-neutral-50/60">
                                        <th className="px-4 py-3 w-20">Priority</th>
                                        <th className="px-4 py-3">Activity</th>
                                        <th className="px-4 py-3 hidden md:table-cell">Description</th>
                                        <th className="px-4 py-3 whitespace-nowrap">Status</th>
                                        <th className="px-4 py-3 hidden xl:table-cell">Owner Role</th>
                                        <th className="px-4 py-3 hidden lg:table-cell whitespace-nowrap">Est. Time</th>
                                        <th className="px-4 py-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100">
                                    {acts.map((a) => {
                                        const meta = ACTIVITY_META[a.id] ?? { icon: Activity, iconTint: 'bg-neutral-100 text-neutral-700', estMin: 15, ownerName: '—', ownerRole: '—', ownerTint: 'bg-neutral-200 text-neutral-700' };
                                        const Icon = meta.icon;
                                        return (
                                            <tr key={a.id} className="group transition-colors hover:bg-neutral-50/60">
                                                <td className="px-4 py-4 align-top">
                                                    <PriorityChip priority={a.priority} />
                                                </td>
                                                <td className="px-4 py-4 align-top">
                                                    <div className="flex items-start gap-3">
                                                        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', meta.iconTint)}>
                                                            <Icon className="w-[18px] h-[18px]" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="font-semibold text-neutral-900 text-[13.5px] leading-tight">{a.name}</div>
                                                            <div className="md:hidden text-[12px] text-neutral-500 mt-1 leading-snug">{a.description}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 align-top hidden md:table-cell">
                                                    <p className="text-[12.5px] text-neutral-600 leading-snug max-w-md">{a.description}</p>
                                                </td>
                                                <td className="px-4 py-4 align-top whitespace-nowrap">
                                                    <StatusPill status={a.status} pendingCount={a.pendingCount} />
                                                </td>
                                                <td className="px-4 py-4 align-top hidden xl:table-cell">
                                                    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset', meta.ownerTint)}>
                                                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                                                        {meta.ownerRole}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 align-top hidden lg:table-cell whitespace-nowrap text-[12.5px] text-neutral-600">
                                                    ~{meta.estMin} min
                                                </td>
                                                <td className="px-4 py-4 align-top text-right whitespace-nowrap">
                                                    <ActionLink status={a.status} actionUrl={a.actionUrl ?? `/app/company/hr/payroll-runs/${checklist.run.id}/wizard`} />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {/* Salary holds alert */}
                            {blockingHolds && (
                                <div className="border-t border-neutral-100 bg-danger-50/60 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex items-center gap-2.5 text-[12.5px] text-danger-700">
                                        <AlertTriangle className="w-4 h-4 text-danger-600 shrink-0" />
                                        <span className="font-semibold">{blockingHolds.pendingCount} employee{(blockingHolds.pendingCount ?? 0) !== 1 ? 's are' : ' is'} on salary hold. Please resolve all issues before proceeding.</span>
                                    </div>
                                    <button
                                        onClick={() => navigate('/app/company/hr/salary-holds')}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-danger-200 bg-white px-3 py-1.5 text-xs font-semibold text-danger-700 hover:bg-danger-50"
                                    >
                                        Review Holds <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}

                            <div className="border-t border-neutral-100 bg-neutral-50/50 px-5 py-3.5 flex items-center gap-2.5 text-[12.5px] text-neutral-600">
                                <Info className="w-4 h-4 text-info-500 shrink-0" />
                                {allReady ? (
                                    <span className="font-medium">All items complete. You can proceed to Phase C — Payroll Run Wizard.</span>
                                ) : (
                                    <span>Complete all items above to proceed to Phase C — Payroll Run Wizard.</span>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="px-6 py-12 text-center">
                            <BarChart3 className="w-10 h-10 mx-auto text-neutral-300 mb-3" />
                            <p className="text-sm text-neutral-500">Full-run activities open inside the Payroll Run Wizard for the active payroll period.</p>
                            <button
                                onClick={() => navigate(`/app/company/hr/payroll-runs/${checklist.run.id}/wizard`)}
                                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-primary-200 bg-white px-4 py-2 text-sm font-semibold text-primary-700 hover:bg-primary-50"
                            >
                                Open Payroll Run Wizard <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <aside className="space-y-4">
                    {/* Pre-Run Health Check */}
                    <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-neutral-900">Pre-Run Health Check</h3>
                            <button onClick={onRefresh} className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-primary-600 hover:text-primary-700">
                                <RefreshCcw className="w-3 h-3" /> Refresh
                            </button>
                        </div>
                        <ul className="space-y-3">
                            {healthChecks.map(h => {
                                const Icon = h.icon;
                                return (
                                    <li key={h.label} className="flex items-center gap-3">
                                        <div className={cn(
                                            'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                                            h.ok ? 'bg-success-50 text-success-600' : h.warn ? 'bg-warning-50 text-warning-600' : 'bg-danger-50 text-danger-600',
                                        )}>
                                            <Icon className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-[12.5px] font-semibold text-neutral-800 leading-tight">{h.label}</div>
                                            <div className="text-[11px] text-neutral-500 mt-0.5">{h.sub}</div>
                                        </div>
                                        <div className={cn(
                                            'w-5 h-5 rounded-full flex items-center justify-center shrink-0',
                                            h.ok ? 'bg-success-100 text-success-700' : h.warn ? 'bg-warning-100 text-warning-700' : 'bg-danger-100 text-danger-700',
                                        )}>
                                            {h.ok ? <CheckCircle2 className="w-3 h-3" /> : h.warn ? <AlertCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    {/* Pending Items */}
                    <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-neutral-900">Pending Items Requiring Attention</h3>
                            <Link to="#" className="text-[11.5px] font-semibold text-primary-600 hover:text-primary-700">View All</Link>
                        </div>
                        {pendingItems.length === 0 ? (
                            <p className="text-[12px] text-neutral-500">No pending items 🎉</p>
                        ) : (
                            <ul className="space-y-3">
                                {pendingItems.map(p => {
                                    const tint = p.priority === 'HIGH' ? 'text-danger-600' : p.priority === 'MEDIUM' ? 'text-warning-600' : 'text-neutral-500';
                                    const iconTint = p.priority === 'HIGH' ? 'bg-danger-50 text-danger-600' : p.priority === 'MEDIUM' ? 'bg-warning-50 text-warning-600' : 'bg-neutral-100 text-neutral-500';
                                    return (
                                        <li key={p.id} className="flex items-start gap-3">
                                            <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', iconTint)}>
                                                <AlertCircle className="w-3.5 h-3.5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-[12.5px] font-semibold text-neutral-800 leading-tight">{p.label}</div>
                                                <div className="text-[11px] text-neutral-500 mt-0.5">{p.sub}</div>
                                            </div>
                                            <span className={cn('text-[10.5px] font-bold uppercase tracking-wider', tint)}>{p.priority === 'HIGH' ? 'High' : p.priority === 'MEDIUM' ? 'Medium' : 'Low'}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>

                    {/* Documents & Reports */}
                    <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                        <h3 className="text-sm font-bold text-neutral-900 mb-3">Documents & Reports</h3>
                        <ul className="space-y-1">
                            {DOCUMENTS.map(d => {
                                const Icon = d.icon;
                                return (
                                    <li key={d.label}>
                                        <Link to={d.to} className="group flex items-center justify-between rounded-lg px-2 py-2 transition hover:bg-neutral-50">
                                            <span className="flex items-center gap-2.5 text-[12.5px] text-primary-600 group-hover:text-primary-700">
                                                <Icon className="w-3.5 h-3.5" />
                                                {d.label} – {MONTHS[checklist.run.month]!.slice(0, 3)} {checklist.run.year}
                                            </span>
                                            <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-primary-500" />
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    {/* Need Help */}
                    <div className="relative overflow-hidden rounded-2xl p-5 shadow-lg shadow-primary-500/20">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700" />
                        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
                        <div className="relative">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center">
                                    <Headphones className="w-[18px] h-[18px] text-white" />
                                </div>
                                <h3 className="text-sm font-bold text-white">Need Help?</h3>
                            </div>
                            <p className="text-[12.5px] text-white/80 mb-3">Contact Payroll Support Team</p>
                            <div className="space-y-1.5">
                                <a href="mailto:payroll.support@avyerp.com" className="flex items-center gap-2 text-[12.5px] text-white hover:text-white/90">
                                    <Mail className="w-3.5 h-3.5" />
                                    payroll.support@avyerp.com
                                </a>
                                <a href="tel:+91 9019189889" className="flex items-center gap-2 text-[12.5px] text-white hover:text-white/90">
                                    <Phone className="w-3.5 h-3.5" />
                                    +91 9019189889
                                </a>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>

            {/* Sticky bottom action bar */}
            <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-neutral-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 text-[12.5px]">
                        {allReady ? (
                            <>
                                <CheckCircle2 className="w-4 h-4 text-success-600 shrink-0" />
                                <span className="font-semibold text-success-700">All pre-run activities complete. Ready to proceed.</span>
                            </>
                        ) : blockingIssues.length > 0 ? (
                            <>
                                <Lock className="w-4 h-4 text-neutral-500 shrink-0" />
                                <span className="font-semibold text-neutral-700">Cannot proceed: {blockingIssues.length} blocking item{blockingIssues.length === 1 ? '' : 's'} need{blockingIssues.length === 1 ? 's' : ''} attention</span>
                                <HelpCircle className="w-3.5 h-3.5 text-neutral-400" />
                            </>
                        ) : (
                            <>
                                <Clock className="w-4 h-4 text-neutral-500 shrink-0" />
                                <span className="font-semibold text-neutral-700">{total - completed} of {total} activities remaining</span>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {!allReady && <span className="text-[11.5px] text-neutral-500">Resolve all issues to enable</span>}
                        <button
                            disabled={!allReady}
                            onClick={() => navigate(`/app/company/hr/payroll-runs/${checklist.run.id}/wizard`)}
                            className={cn(
                                'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold shadow-sm transition',
                                allReady
                                    ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-primary-500/25 hover:from-primary-700 hover:to-accent-700'
                                    : 'bg-neutral-200 text-neutral-500 cursor-not-allowed',
                            )}
                        >
                            <Lock className={cn('w-3.5 h-3.5', allReady && 'hidden')} />
                            Proceed to Payroll Run Wizard <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* KeyStat atom                                                              */
/* ──────────────────────────────────────────────────────────────────────── */

function KeyStat({ label, value, accent }: { label: string; value: number; accent?: 'success' | 'danger' }) {
    const tint = accent === 'success' ? 'text-success-600' : accent === 'danger' ? 'text-danger-600' : 'text-neutral-900';
    return (
        <div>
            <div className={cn('text-2xl font-bold leading-tight', tint)}>{value}</div>
            <div className="text-[11px] text-neutral-500 mt-1 font-medium uppercase tracking-wider">{label}</div>
        </div>
    );
}

export default PhaseBPreRunScreen;
