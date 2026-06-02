import { useMemo, useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Building2,
    Users,
    IndianRupee,
    LayoutGrid,
    UserPlus,
    Shield,
    Percent,
    FileText,
    Banknote,
    Landmark,
    Settings as SettingsIcon,
    Lock,
    Clock,
    Calendar,
    ChevronRight,
    ChevronDown,
    CheckCircle2,
    AlertCircle,
    Info,
    RefreshCcw,
    Download,
    SkipForward,
    Sparkles,
    Phone,
    Mail,
    Headphones,
    ArrowRight,
    BookOpen,
} from 'lucide-react';
import { useConfigurationStatus } from '@/features/company-admin/api/use-payroll-phases-queries';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { useAuthStore, getDisplayName } from '@/store/useAuthStore';
import { HelpCircle } from 'lucide-react';

/* ──────────────────────────────────────────────────────────────────────── */
/* Step metadata — visual mapping for the 11 Phase-A configuration steps    */
/* ──────────────────────────────────────────────────────────────────────── */

type StepStatus = 'COMPLETE' | 'IN_PROGRESS' | 'NOT_STARTED';

interface BackendStep {
    id: string;
    stepNumber: number;
    name: string;
    description: string;
    status: StepStatus;
    lastUpdated: string | null;
    actionUrl: string;
    metadata: { count?: number; label?: string } | null;
}

interface StepMeta {
    icon: React.ComponentType<{ className?: string }>;
    iconTint: string;     // tailwind classes for the icon tile
    estMin: number;
    ownerRole: string;
    ownerTint: string;    // role-tinted badge
    isNew?: boolean;
}

const STEP_META: Record<string, StepMeta> = {
    org_structure:       { icon: Building2,     iconTint: 'bg-info-50 text-info-600',         estMin: 10, ownerRole: 'HR Admin',        ownerTint: 'bg-info-100 text-info-700' },
    salary_components:   { icon: IndianRupee,   iconTint: 'bg-accent-50 text-accent-600',     estMin: 25, ownerRole: 'Payroll Officer', ownerTint: 'bg-accent-100 text-accent-700' },
    salary_structures:   { icon: LayoutGrid,    iconTint: 'bg-primary-50 text-primary-600',   estMin: 45, ownerRole: 'Payroll Officer', ownerTint: 'bg-primary-100 text-primary-700' },
    ctc_breakup:         { icon: UserPlus,      iconTint: 'bg-emerald-50 text-emerald-600',   estMin: 30, ownerRole: 'Payroll Officer', ownerTint: 'bg-emerald-100 text-emerald-700' },
    employee_salary:     { icon: Users,         iconTint: 'bg-sky-50 text-sky-600',           estMin: 20, ownerRole: 'HR Admin',        ownerTint: 'bg-sky-100 text-sky-700' },
    pf_esi_config:       { icon: Shield,        iconTint: 'bg-violet-50 text-violet-600',     estMin: 45, ownerRole: 'Finance Lead',    ownerTint: 'bg-violet-100 text-violet-700' },
    tds_pt_config:       { icon: Percent,       iconTint: 'bg-orange-50 text-orange-600',     estMin: 20, ownerRole: 'Finance Lead',    ownerTint: 'bg-orange-100 text-orange-700' },
    attendance_rules:    { icon: FileText,      iconTint: 'bg-rose-50 text-rose-600',         estMin: 30, ownerRole: 'HR Admin',        ownerTint: 'bg-rose-100 text-rose-700' },
    leave_types:         { icon: Banknote,      iconTint: 'bg-red-50 text-red-600',           estMin: 30, ownerRole: 'HR Admin',        ownerTint: 'bg-red-100 text-red-700' },
    leave_policy:        { icon: Landmark,      iconTint: 'bg-amber-50 text-amber-600',       estMin: 40, ownerRole: 'HR Admin',        ownerTint: 'bg-amber-100 text-amber-700', isNew: true },
    payroll_simulation:  { icon: SettingsIcon,  iconTint: 'bg-neutral-100 text-neutral-700',  estMin: 30, ownerRole: 'Payroll Officer', ownerTint: 'bg-neutral-200 text-neutral-700' },
};

/* ──────────────────────────────────────────────────────────────────────── */
/* Small atoms                                                              */
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
                    <linearGradient id="phaseA-donut" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#10B981" />
                        <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                </defs>
                <circle cx="50" cy="50" r={radius} fill="none" stroke="#E2E8F0" strokeWidth="9" />
                <circle
                    cx="50" cy="50" r={radius} fill="none"
                    stroke="url(#phaseA-donut)" strokeWidth="9" strokeLinecap="round"
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

function StatTile({
    value, label, tone,
}: { value: number | string; label: string; tone: 'success' | 'warning' | 'pending' | 'idle' }) {
    const toneMap: Record<typeof tone, string> = {
        success: 'bg-success-50 ring-success-100 text-success-700',
        warning: 'bg-warning-50 ring-warning-100 text-warning-700',
        pending: 'bg-accent-50 ring-accent-100 text-accent-700',
        idle:    'bg-neutral-100 ring-neutral-200 text-neutral-700',
    };
    const subMap: Record<typeof tone, string> = {
        success: 'text-success-700/80',
        warning: 'text-warning-700/80',
        pending: 'text-accent-700/80',
        idle:    'text-neutral-600',
    };
    return (
        <div className={cn('flex flex-col items-center justify-center px-4 py-4 rounded-2xl ring-1 min-w-[92px]', toneMap[tone])}>
            <span className="text-2xl font-bold leading-none">{value}</span>
            <span className={cn('text-[11px] font-semibold mt-2 uppercase tracking-wider', subMap[tone])}>{label}</span>
        </div>
    );
}

function StatusPill({ status }: { status: StepStatus }) {
    if (status === 'COMPLETE') {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2.5 py-1 text-[11px] font-semibold text-success-700 ring-1 ring-success-200">
                <CheckCircle2 className="w-3 h-3" /> Completed
            </span>
        );
    }
    if (status === 'IN_PROGRESS') {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-warning-50 px-2.5 py-1 text-[11px] font-semibold text-warning-700 ring-1 ring-warning-200">
                <AlertCircle className="w-3 h-3" /> In Progress
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-600 ring-1 ring-neutral-200">
            <Clock className="w-3 h-3" /> Pending
        </span>
    );
}

function ActionLink({ status, to }: { status: StepStatus; to: string }) {
    const label = status === 'COMPLETE' ? 'View Details' : status === 'IN_PROGRESS' ? 'Continue Setup' : 'Start Setup';
    const tint = status === 'COMPLETE'
        ? 'text-primary-600 hover:text-primary-700'
        : status === 'IN_PROGRESS'
            ? 'text-warning-700 hover:text-warning-800'
            : 'text-primary-600 hover:text-primary-700';
    return (
        <Link to={to} className={cn('inline-flex items-center gap-1 text-xs font-semibold whitespace-nowrap', tint)}>
            {label} <ChevronRight className="w-3.5 h-3.5" />
        </Link>
    );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Actions dropdown                                                          */
/* ──────────────────────────────────────────────────────────────────────── */

function PhaseAActions({ onRefresh, onExport, onSkip }: { onRefresh: () => void; onExport: () => void; onSkip: () => void }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!open) return;
        const handle = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handle);
        return () => document.removeEventListener('mousedown', handle);
    }, [open]);
    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(o => !o)}
                className="inline-flex items-center gap-2 rounded-lg border border-primary-200 bg-white px-4 py-2 text-sm font-semibold text-primary-700 shadow-sm transition hover:bg-primary-50"
            >
                Phase A Actions <ChevronDown className={cn('w-4 h-4 transition-transform', open && 'rotate-180')} />
            </button>
            {open && (
                <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-neutral-200 bg-white p-1.5 shadow-lg ring-1 ring-black/5 z-30">
                    <button onClick={() => { setOpen(false); onRefresh(); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                        <RefreshCcw className="w-4 h-4" /> Refresh Status
                    </button>
                    <button onClick={() => { setOpen(false); onExport(); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                        <Download className="w-4 h-4" /> Export Checklist
                    </button>
                    <button onClick={() => { setOpen(false); onSkip(); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                        <SkipForward className="w-4 h-4" /> Skip to Phase B
                    </button>
                </div>
            )}
        </div>
    );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Quick Links sidebar item                                                  */
/* ──────────────────────────────────────────────────────────────────────── */

const QUICK_LINKS: { label: string; to: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { label: 'Organisation Structure',       to: '/app/company/hr/departments',        icon: Building2 },
    { label: 'Salary Component Master',      to: '/app/company/hr/salary-components',  icon: IndianRupee },
    { label: 'Salary Structure Templates',   to: '/app/company/hr/salary-structures',  icon: LayoutGrid },
    { label: 'Statutory Configuration',      to: '/app/company/hr/statutory-config',   icon: Shield },
    { label: 'Bank Master',                  to: '/app/company/hr/bank-config',        icon: Banknote },
    { label: 'Loan Policy Configuration',    to: '/app/company/hr/loan-policies',      icon: Landmark },
    { label: 'Payroll Run Configuration',    to: '/app/company/hr/payroll-runs',       icon: SettingsIcon },
    { label: 'IT Declaration Settings',      to: '/app/company/hr/it-declarations',    icon: FileText },
];

const KEY_BENEFITS = [
    'Accurate salary computation',
    'Statutory compliance',
    'Reduced payroll errors',
    'Faster payroll processing',
    'Audit ready setup',
];

/* ──────────────────────────────────────────────────────────────────────── */
/* Main screen                                                              */
/* ──────────────────────────────────────────────────────────────────────── */

export function PhaseAConfigScreen() {
    const navigate = useNavigate();
    const fmt = useCompanyFormatter();
    const authUser = useAuthStore(s => s.user);
    const authUserName = getDisplayName(authUser);
    const { data, isLoading, refetch } = useConfigurationStatus();
    const status = data?.data;

    const steps: BackendStep[] = useMemo(() => (status?.steps as BackendStep[]) ?? [], [status]);

    const counts = useMemo(() => {
        const c = { complete: 0, inProgress: 0, pending: 0, notStarted: 0 };
        steps.forEach(s => {
            if (s.status === 'COMPLETE') c.complete++;
            else if (s.status === 'IN_PROGRESS') c.inProgress++;
            else c.pending++;
        });
        return c;
    }, [steps]);

    const completedCount = status?.completedCount ?? 0;
    const totalCount = status?.totalCount ?? 11;
    const estMin = status?.estimatedMinutesRemaining ?? 0;
    const remainingHours = Math.floor(estMin / 60);
    const remainingMin = estMin % 60;
    const remainingSteps = totalCount - completedCount;

    const phaseAComplete = completedCount >= totalCount;

    /* Action handlers */
    const onRefresh = () => refetch();
    const onExport = () => window.print();
    const onSkip = () => navigate('/app/company/hr/payroll-pre-run');

    if (isLoading) {
        return (
            <div className="p-6 space-y-4">
                <SkeletonTable rows={6} cols={6} />
            </div>
        );
    }

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto font-inter pb-24">
            {/* ── Breadcrumb + page header ───────────────────────────── */}
            <nav className="flex items-center gap-1.5 text-xs text-neutral-500 mb-2">
                <Link to="/app/company/hr/payroll-runs" className="hover:text-neutral-800 transition">Payroll</Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-neutral-800 font-medium">Payroll Configuration</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-neutral-800 font-medium">Phase A – Configuration Prerequisites</span>
            </nav>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-6">
                <div>
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-neutral-900">Phase A – Configuration Prerequisites</h1>
                        <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-3 py-1 text-xs font-semibold text-success-700 ring-1 ring-success-200">
                            <Sparkles className="w-3 h-3" /> One-time Setup
                        </span>
                    </div>
                    <p className="text-sm text-neutral-500 mt-2 max-w-2xl">
                        Complete all configuration prerequisites to ensure accurate, compliant and audit-ready payroll processing.
                    </p>
                </div>
                <PhaseAActions onRefresh={onRefresh} onExport={onExport} onSkip={onSkip} />
            </div>

            {/* ── Hero: progress + stat tiles + estimated time ──────── */}
            <div className="grid gap-4 lg:grid-cols-[1fr_400px] mb-6">
                <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-4">
                            <ProgressDonut completed={completedCount} total={totalCount} />
                            <div>
                                <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Overall</div>
                                <div className="text-lg font-bold text-neutral-900">Progress</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 flex-1 min-w-0">
                            <StatTile value={counts.complete}   label="Completed"   tone="success" />
                            <StatTile value={counts.inProgress} label="In Progress" tone="warning" />
                            <StatTile value={counts.pending}    label="Pending"     tone="pending" />
                            <StatTile value={0}                 label="Not Started" tone="idle" />
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                                <div className="w-7 h-7 rounded-full bg-info-50 text-info-600 flex items-center justify-center">
                                    <Clock className="w-3.5 h-3.5" />
                                </div>
                                <span>Estimated Time</span>
                            </div>
                            <div className="mt-2 text-2xl font-bold text-neutral-900">
                                {remainingHours > 0 ? `~${remainingHours}h ${remainingMin}m` : `~${remainingMin}m`}
                            </div>
                            <div className="text-xs text-neutral-500 mt-1">Across {remainingSteps} steps</div>
                        </div>
                        <div className="border-l border-neutral-100 pl-4">
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                                <div className="w-7 h-7 rounded-full bg-accent-50 text-accent-600 flex items-center justify-center">
                                    <Calendar className="w-3.5 h-3.5" />
                                </div>
                                <span>Last Updated</span>
                            </div>
                            <div className="mt-2 text-base font-bold text-neutral-900">
                                {status?.lastActivity ? fmt.date(status.lastActivity) : '—'}
                            </div>
                            <div className="text-xs text-neutral-500 mt-1">
                                {status?.lastActivity && authUser ? <>by {authUserName}</> : <>No activity yet</>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Main two-column layout ────────────────────────────── */}
            <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
                {/* Configuration steps table */}
                <div className="rounded-2xl bg-white ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-neutral-100">
                        <h2 className="text-base font-bold text-neutral-900">Configuration Steps <span className="text-neutral-500 font-semibold">({totalCount})</span></h2>
                        <div className="flex items-center gap-5 text-[11px] text-neutral-500">
                            <span className="inline-flex items-center gap-1.5"><Lock className="w-3 h-3" /> Dependent on previous step</span>
                            <span className="inline-flex items-center gap-1.5"><Clock className="w-3 h-3" /> Estimated time</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 bg-neutral-50/60">
                                    <th className="px-4 py-3 w-12">#</th>
                                    <th className="px-4 py-3">Step</th>
                                    <th className="px-4 py-3 hidden md:table-cell">Description</th>
                                    <th className="px-4 py-3 hidden lg:table-cell whitespace-nowrap">Est. Time</th>
                                    <th className="px-4 py-3 whitespace-nowrap">Status</th>
                                    <th className="px-4 py-3 hidden xl:table-cell whitespace-nowrap">Last Updated</th>
                                    <th className="px-4 py-3 hidden xl:table-cell">Owner Role</th>
                                    <th className="px-4 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                                {steps.map((step, idx) => {
                                    const meta = STEP_META[step.id] ?? {
                                        icon: SettingsIcon, iconTint: 'bg-neutral-100 text-neutral-600', estMin: 15,
                                        ownerRole: 'HR', ownerTint: 'bg-neutral-200 text-neutral-700',
                                    };
                                    const isLocked = idx > 0 && steps[idx - 1]!.status !== 'COMPLETE' && step.status !== 'COMPLETE' && step.status !== 'IN_PROGRESS';
                                    const Icon = meta.icon;
                                    return (
                                        <tr key={step.id} className="group transition-colors hover:bg-neutral-50/60">
                                            <td className="px-4 py-4 align-top">
                                                <div className="flex items-center gap-1.5">
                                                    <span className={cn('text-sm font-bold', isLocked ? 'text-neutral-400' : 'text-neutral-700')}>{step.stepNumber}</span>
                                                    {isLocked && <Lock className="w-3 h-3 text-neutral-400" />}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 align-top">
                                                <div className="flex items-start gap-3">
                                                    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', meta.iconTint)}>
                                                        <Icon className="w-4.5 h-4.5" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <span className="font-semibold text-neutral-900 text-[13.5px] leading-tight">{step.name}</span>
                                                            {meta.isNew && (
                                                                <span className="inline-flex items-center rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200">
                                                                    NEW
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="md:hidden text-[12px] text-neutral-500 mt-1 leading-snug">{step.description}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 align-top hidden md:table-cell">
                                                <p className="text-[12.5px] text-neutral-600 leading-snug max-w-md">{step.description}</p>
                                            </td>
                                            <td className="px-4 py-4 align-top hidden lg:table-cell whitespace-nowrap text-[12.5px] text-neutral-600">
                                                ~{meta.estMin} min
                                            </td>
                                            <td className="px-4 py-4 align-top whitespace-nowrap">
                                                <StatusPill status={step.status} />
                                            </td>
                                            <td className="px-4 py-4 align-top hidden xl:table-cell whitespace-nowrap text-[12.5px] text-neutral-600">
                                                {step.lastUpdated ? fmt.date(step.lastUpdated) : '—'}
                                            </td>
                                            <td className="px-4 py-4 align-top hidden xl:table-cell">
                                                <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset', meta.ownerTint)}>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                                                    {meta.ownerRole}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 align-top text-right whitespace-nowrap">
                                                <ActionLink status={step.status} to={step.actionUrl} />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                </div>

                {/* Right sidebar */}
                <aside className="space-y-4">
                    {/* About */}
                    <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-7 h-7 rounded-full bg-info-50 text-info-600 flex items-center justify-center">
                                <Info className="w-3.5 h-3.5" />
                            </div>
                            <h3 className="text-sm font-bold text-neutral-900">About Phase A</h3>
                        </div>
                        <p className="text-[12.5px] text-neutral-600 leading-relaxed">
                            Phase A is a one-time configuration of masters, rules and preferences. Once completed, you can proceed to Phase B (Pre-Run Activities) every payroll cycle.
                        </p>
                        <Link to="#" className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-semibold text-primary-600 hover:text-primary-700">
                            Learn more <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    {/* Key Benefits */}
                    <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                        <h3 className="text-sm font-bold text-neutral-900 mb-3">Key Benefits</h3>
                        <ul className="space-y-2.5">
                            {KEY_BENEFITS.map(b => (
                                <li key={b} className="flex items-center gap-2.5">
                                    <div className="w-4.5 h-4.5 rounded-full bg-success-100 text-success-600 flex items-center justify-center shrink-0">
                                        <CheckCircle2 className="w-3 h-3" />
                                    </div>
                                    <span className="text-[12.5px] text-neutral-700">{b}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Quick Links */}
                    <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                        <h3 className="text-sm font-bold text-neutral-900 mb-3">Quick Links</h3>
                        <ul className="space-y-1">
                            {QUICK_LINKS.map(l => {
                                const Icon = l.icon;
                                return (
                                    <li key={l.label}>
                                        <Link
                                            to={l.to}
                                            className="group flex items-center justify-between rounded-lg px-2 py-2 transition hover:bg-neutral-50"
                                        >
                                            <span className="flex items-center gap-2.5 text-[12.5px] text-neutral-700 group-hover:text-primary-700">
                                                <Icon className="w-3.5 h-3.5 text-primary-500" />
                                                {l.label}
                                            </span>
                                            <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-primary-500" />
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    {/* Need Help — gradient card */}
                    <div className="relative overflow-hidden rounded-2xl p-5 shadow-lg shadow-primary-500/20">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700" />
                        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
                        <div className="relative">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center">
                                    <Headphones className="w-4.5 h-4.5 text-white" />
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

                    {/* Documentation link (extra polish) */}
                    <Link to="#" className="block rounded-2xl border border-dashed border-neutral-300 bg-white px-4 py-3 text-center text-[12.5px] font-semibold text-primary-600 transition hover:border-primary-300 hover:bg-primary-50">
                        <BookOpen className="w-3.5 h-3.5 inline-block mr-1" /> Read setup documentation
                    </Link>
                </aside>
            </div>

            {/* ── Sticky bottom action bar (mirrors Phase B) ────────── */}
            <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-neutral-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 text-[12.5px]">
                        {phaseAComplete ? (
                            <>
                                <CheckCircle2 className="w-4 h-4 text-success-600 shrink-0" />
                                <span className="font-semibold text-success-700">All {totalCount} configuration steps complete. Ready to proceed.</span>
                            </>
                        ) : (
                            <>
                                <Lock className="w-4 h-4 text-neutral-500 shrink-0" />
                                <span className="font-semibold text-neutral-700">Cannot proceed: {totalCount - completedCount} step{totalCount - completedCount === 1 ? '' : 's'} pending in Phase A</span>
                                <HelpCircle className="w-3.5 h-3.5 text-neutral-400" />
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {!phaseAComplete && <span className="text-[11.5px] text-neutral-500">Complete all steps to enable</span>}
                        <button
                            disabled={!phaseAComplete}
                            onClick={() => navigate('/app/company/hr/payroll-pre-run')}
                            className={cn(
                                'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold shadow-sm transition',
                                phaseAComplete
                                    ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-primary-500/25 hover:from-primary-700 hover:to-accent-700'
                                    : 'bg-neutral-200 text-neutral-500 cursor-not-allowed',
                            )}
                        >
                            <Lock className={cn('w-3.5 h-3.5', phaseAComplete && 'hidden')} />
                            Proceed to Phase B — Pre-Run Activities <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PhaseAConfigScreen;
