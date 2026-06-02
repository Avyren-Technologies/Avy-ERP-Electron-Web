import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
    Calendar,
    Clock,
    Users,
    Banknote,
    Wallet,
    TrendingUp,
    TrendingDown,
    CheckCircle2,
    AlertCircle,
    Info,
    ChevronRight,
    BookOpen,
    Sparkles,
    Phone,
    Mail,
    Headphones,
    ArrowRight,
    Shield,
    Landmark,
    FileText,
    BarChart3,
    Receipt,
    FileSpreadsheet,
    Award,
    Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    useConfigurationStatus,
    usePostRunChecklist,
    usePostRunInsights,
    useCompletePostRunActivity,
} from '@/features/company-admin/api/use-payroll-phases-queries';
import { usePayrollRuns, usePayrollRun } from '@/features/company-admin/api/use-payroll-run-queries';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import { useAuthStore, getDisplayName } from '@/store/useAuthStore';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { showSuccess, showApiError } from '@/lib/toast';

type ActivityCategory = 'DISTRIBUTION' | 'STATUTORY' | 'RECONCILIATION' | 'REPORTING';
type ActivityStatus = 'COMPLETE' | 'PENDING' | 'NOT_APPLICABLE';

interface BackendActivity {
    id: string;
    activityNumber: number;
    name: string;
    description: string;
    category: ActivityCategory;
    status: ActivityStatus;
    dueDate: string | null;
    metadata: { count?: number; label?: string } | null;
}

const MANUAL_ACTIVITIES = ['bank_reconciliation', 'variance_audit', 'gl_posting'];

const ACTIVITY_META: Record<string, { icon: React.ComponentType<{ className?: string }>; iconTint: string; ownerRole: string; ownerTint: string }> = {
    payslip_generation:   { icon: FileText,        iconTint: 'bg-info-50 text-info-600',        ownerRole: 'Payroll Admin', ownerTint: 'bg-info-100 text-info-700' },
    payslip_distribution: { icon: FileText,        iconTint: 'bg-primary-50 text-primary-600', ownerRole: 'Payroll Admin', ownerTint: 'bg-primary-100 text-primary-700' },
    pf_filing:            { icon: Shield,          iconTint: 'bg-violet-50 text-violet-600',   ownerRole: 'Compliance',    ownerTint: 'bg-violet-100 text-violet-700' },
    esi_filing:           { icon: Shield,          iconTint: 'bg-accent-50 text-accent-600',   ownerRole: 'Compliance',    ownerTint: 'bg-accent-100 text-accent-700' },
    pt_filing:            { icon: Shield,          iconTint: 'bg-warning-50 text-warning-600', ownerRole: 'Compliance',    ownerTint: 'bg-warning-100 text-warning-700' },
    tds_filing:           { icon: Shield,          iconTint: 'bg-danger-50 text-danger-600',   ownerRole: 'Compliance',    ownerTint: 'bg-danger-100 text-danger-700' },
    bank_reconciliation:  { icon: Landmark,        iconTint: 'bg-primary-50 text-primary-600', ownerRole: 'Accounts',      ownerTint: 'bg-primary-100 text-primary-700' },
    variance_audit:       { icon: BarChart3,       iconTint: 'bg-warning-50 text-warning-600', ownerRole: 'Finance',       ownerTint: 'bg-warning-100 text-warning-700' },
    employee_notifications: { icon: Receipt,       iconTint: 'bg-success-50 text-success-600', ownerRole: 'System',        ownerTint: 'bg-success-100 text-success-700' },
    gl_posting:           { icon: FileSpreadsheet, iconTint: 'bg-accent-50 text-accent-600',   ownerRole: 'Finance Mgr',   ownerTint: 'bg-accent-100 text-accent-700' },
    form_16_generation:   { icon: Award,           iconTint: 'bg-emerald-50 text-emerald-600', ownerRole: 'Compliance',    ownerTint: 'bg-emerald-100 text-emerald-700' },
    archive_complete:     { icon: CheckCircle2,    iconTint: 'bg-success-50 text-success-600', ownerRole: 'Payroll Admin', ownerTint: 'bg-success-100 text-success-700' },
};

function initials(s: string): string {
    return s.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('');
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Atoms                                                                    */
/* ──────────────────────────────────────────────────────────────────────── */

function ProgressDonut({ completed, total }: { completed: number; total: number }) {
    const pct = total > 0 ? completed / total : 0;
    const radius = 38;
    const circ = 2 * Math.PI * radius;
    const offset = circ - pct * circ;
    return (
        <div className="relative w-[80px] h-[80px] shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <defs>
                    <linearGradient id="phaseD-donut" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#10B981" />
                        <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                </defs>
                <circle cx="50" cy="50" r={radius} fill="none" stroke="#E2E8F0" strokeWidth="11" />
                <circle cx="50" cy="50" r={radius} fill="none" stroke="url(#phaseD-donut)" strokeWidth="11"
                    strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset 600ms ease-out' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-base font-bold text-neutral-900 leading-none">{Math.round(pct * 100)}%</span>
            </div>
        </div>
    );
}

function StatusPill({ status, dueLabel }: { status: ActivityStatus; dueLabel?: string }) {
    if (status === 'COMPLETE') {
        return <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2.5 py-1 text-[11px] font-semibold text-success-700 ring-1 ring-success-200 whitespace-nowrap"><CheckCircle2 className="w-3 h-3" /> Completed</span>;
    }
    if (status === 'NOT_APPLICABLE') {
        return <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-600 ring-1 ring-neutral-200 whitespace-nowrap">{dueLabel ?? 'Not Due'}</span>;
    }
    return <span className="inline-flex items-center gap-1 rounded-full bg-warning-50 px-2.5 py-1 text-[11px] font-semibold text-warning-700 ring-1 ring-warning-200 whitespace-nowrap"><Clock className="w-3 h-3" /> {dueLabel ?? 'In Progress'}</span>;
}

function InsightTile({
    icon: Icon, label, value, delta, deltaLabel, accent, inverse,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: React.ReactNode;
    delta?: number | null;
    deltaLabel?: string;
    accent?: 'success' | 'danger' | 'warning' | 'primary' | 'emerald';
    inverse?: boolean;
}) {
    const tintMap = {
        success: 'bg-success-50 text-success-600',
        danger:  'bg-danger-50 text-danger-600',
        warning: 'bg-warning-50 text-warning-600',
        primary: 'bg-primary-50 text-primary-600',
        emerald: 'bg-emerald-50 text-emerald-600',
    } as const;
    const showDelta = delta != null && Number.isFinite(delta) && delta !== 0;
    const up = (delta ?? 0) >= 0;
    const positive = inverse ? !up : up;
    return (
        <div className="rounded-2xl bg-white px-4 py-4 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex items-start gap-3">
                <div className={cn('w-10 h-10 rounded-full flex items-center justify-center shrink-0', tintMap[accent ?? 'primary'])}>
                    <Icon className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-[10.5px] font-bold uppercase tracking-wider text-neutral-500">{label}</div>
                    <div className="mt-0.5 text-[20px] font-extrabold text-neutral-900 leading-none tabular-nums truncate">{value}</div>
                    {showDelta && (
                        <div className={cn('mt-1.5 inline-flex items-center gap-0.5 text-[11px] font-bold', positive ? 'text-success-700' : 'text-danger-700')}>
                            {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {up ? '+' : ''}{delta!.toFixed(2)}%
                        </div>
                    )}
                    {deltaLabel && <div className="text-[10.5px] text-neutral-500 mt-0.5 truncate">{deltaLabel}</div>}
                </div>
            </div>
        </div>
    );
}

function HealthRow({ icon: Icon, iconTint, label, value, sub }: {
    icon: React.ComponentType<{ className?: string }>;
    iconTint: string;
    label: string;
    value: string;
    sub: string;
}) {
    return (
        <li className="flex items-start gap-3">
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', iconTint)}>
                <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
                <div className="text-[12.5px] font-bold text-neutral-900 leading-tight">{label}</div>
                <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-[14px] font-extrabold text-neutral-900 tabular-nums">{value}</span>
                </div>
                <div className="text-[10.5px] text-neutral-500 mt-0.5">{sub}</div>
            </div>
        </li>
    );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Main screen                                                              */
/* ──────────────────────────────────────────────────────────────────────── */

export function PhaseDPostRunScreen() {
    const fmt = useCompanyFormatter();
    const navigate = useNavigate();
    const authUser = useAuthStore(s => s.user);
    const authUserName = getDisplayName(authUser);
    const [searchParams] = useSearchParams();
    const explicitRunId = searchParams.get('runId') ?? '';

    /* Resolve runId — prefer disbursed/archived runs for post-run */
    const { data: runsResp, isLoading: runsLoading } = usePayrollRuns({ limit: 20 });
    const runs: any[] = useMemo(() => (runsResp?.data as any[]) ?? [], [runsResp]);
    const inferredRunId = useMemo(() => {
        if (explicitRunId) return explicitRunId;
        const disbursed = runs.find(r => ['DISBURSED', 'ARCHIVED'].includes(r.status));
        if (disbursed) return disbursed.id;
        return runs[0]?.id ?? '';
    }, [explicitRunId, runs]);

    const { data: runResp } = usePayrollRun(inferredRunId);
    const runDetail: any = runResp?.data ?? null;

    const { data: checklistResp, isLoading: checklistLoading, refetch: refetchChecklist } = usePostRunChecklist(inferredRunId);
    const checklist: any = checklistResp?.data ?? null;

    const { data: insightsResp, refetch: refetchInsights } = usePostRunInsights(inferredRunId);
    const insights: any = insightsResp?.data ?? null;

    const { data: configResp } = useConfigurationStatus();
    const configStatus: any = configResp?.data ?? null;
    const phaseAComplete = configStatus ? configStatus.completedCount >= configStatus.totalCount : true;

    const completeMutation = useCompletePostRunActivity();

    const activities: BackendActivity[] = checklist?.activities ?? [];
    const completedCount = checklist?.completedCount ?? 0;
    const totalCount = checklist?.totalCount ?? activities.length ?? 0;
    const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    const handleAction = (activity: BackendActivity) => {
        const isManual = MANUAL_ACTIVITIES.includes(activity.id);
        if (activity.status === 'COMPLETE') return;
        if (isManual) {
            completeMutation.mutate(
                { runId: inferredRunId, activityId: activity.id, note: undefined },
                {
                    onSuccess: () => { showSuccess('Marked Complete', `${activity.name} marked complete.`); refetchChecklist(); refetchInsights(); },
                    onError: (err) => showApiError(err),
                },
            );
        } else {
            // Auto activities — navigate to the relevant page for the user to take action
            const routes: Record<string, string> = {
                payslip_generation:   '/app/company/hr/payslips',
                payslip_distribution: '/app/company/hr/payslips',
                pf_filing:            '/app/company/hr/statutory-filings',
                esi_filing:           '/app/company/hr/statutory-filings',
                pt_filing:            '/app/company/hr/statutory-filings',
                tds_filing:           '/app/company/hr/statutory-filings',
                employee_notifications: '/app/company/hr/notification-rules',
                form_16_generation:   '/app/company/hr/form-16',
                archive_complete:     `/app/company/hr/payroll-runs/${inferredRunId}/wizard`,
            };
            navigate(routes[activity.id] ?? '/app/company/hr/payroll-runs');
        }
    };

    /* Period meta from runDetail */
    const m = runDetail?.month;
    const y = runDetail?.year;
    const monthStart = m && y ? new Date(y, m - 1, 1).toISOString() : null;
    const monthEnd = m && y ? new Date(y, m, 0).toISOString() : null;
    const payDate = m && y ? new Date(y, m, 5).toISOString() : null;
    const runCompletedAt = runDetail?.disbursedAt ?? null;

    /* Upcoming deadlines from activities with dueDate */
    const upcomingDeadlines = useMemo(() => {
        const now = Date.now();
        return activities
            .filter(a => a.dueDate && a.status !== 'COMPLETE' && new Date(a.dueDate).getTime() >= now)
            .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
            .slice(0, 4);
    }, [activities]);

    if (!phaseAComplete) {
        return (
            <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-3xl mx-auto">
                <div className="rounded-2xl bg-white border border-warning-200 shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-warning-50 to-rose-50 px-6 py-5 border-b border-warning-200">
                        <h2 className="text-lg font-bold text-neutral-900">Configuration required</h2>
                        <p className="text-sm text-neutral-600">Complete Phase A before accessing post-run activities.</p>
                    </div>
                    <div className="p-6">
                        <Link to="/app/company/hr/payroll-config-prerequisites"
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-accent-600 px-4 py-3 text-sm font-bold text-white shadow">
                            Open Phase A <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (!runsLoading && runs.length === 0) {
        return (
            <div className="px-4 sm:px-6 lg:px-8 py-10 max-w-2xl mx-auto text-center">
                <div className="rounded-2xl bg-white p-10 ring-1 ring-neutral-200">
                    <Info className="w-10 h-10 mx-auto text-info-400 mb-3" />
                    <h2 className="text-lg font-bold text-neutral-900">No payroll runs yet</h2>
                    <p className="text-sm text-neutral-600 mt-1">Disburse a payroll run before completing post-run activities.</p>
                    <Link to="/app/company/hr/payroll-runs" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-accent-600 px-4 py-3 text-sm font-bold text-white">
                        Open Payroll Runs <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto font-inter space-y-5">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-xs text-neutral-500">
                <Link to="/app/company/hr/payroll-runs" className="hover:text-neutral-800 transition">Payroll</Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-neutral-800 font-medium">Payroll Lifecycle</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-neutral-800 font-medium">Phase D – Post-Run Activities</span>
            </nav>

            {/* Header */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-neutral-900">Phase D – Post-Run Activities</h1>
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-700 ring-1 ring-accent-200">
                            <Sparkles className="w-3 h-3" /> After Each Payroll Run
                        </span>
                    </div>
                    <p className="text-sm text-neutral-500 mt-2 max-w-2xl">
                        Complete post-payroll activities to ensure compliance, reporting accuracy and smooth reconciliation.
                    </p>
                </div>
                <div className="flex items-center gap-2.5">
                    <button className="inline-flex items-center gap-2 rounded-lg border border-primary-200 bg-white px-4 py-2 text-sm font-semibold text-primary-700 shadow-sm hover:bg-primary-50">
                        Payroll Actions
                    </button>
                    <button className="inline-flex items-center gap-2 rounded-lg border border-primary-200 bg-white px-4 py-2 text-sm font-semibold text-primary-700 shadow-sm hover:bg-primary-50">
                        <Calendar className="w-4 h-4" /> {m ? `${['','January','February','March','April','May','June','July','August','September','October','November','December'][m]} ${y}` : 'Current Period'}
                    </button>
                </div>
            </div>

            {/* Period strip */}
            <div className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
                    <MetaTile icon={Calendar}      label="Payroll Period"  value={monthStart && monthEnd ? `${fmt.date(monthStart)} – ${fmt.date(monthEnd)}` : '—'} tint="info" />
                    <MetaTile icon={Calendar}      label="Pay Date"        value={payDate ? fmt.date(payDate) : '—'} tint="accent" />
                    <MetaTile icon={CheckCircle2}  label="Run Completed On" value={runCompletedAt ? `${fmt.date(runCompletedAt)} ${fmt.time(runCompletedAt)}` : '—'} tint="success" />
                    <MetaTile icon={Users}         label="Processed By"    value={runDetail?.approvedByName ?? runDetail?.createdByName ?? authUserName ?? '—'} sub="Admin" tint="primary" />
                    <MetaTile icon={Users}         label="Total Employees" value={String(runDetail?.employeeCount ?? insights?.employeeCount ?? 0)} sub="Active Employees" tint="primary" />
                    <MetaTile icon={Banknote}      label="Net Pay Disbursed" value={`₹${Number(runDetail?.totalNet ?? insights?.totalNetPay ?? 0).toLocaleString('en-IN')}`} tint="emerald" />
                    <MetaTile icon={CheckCircle2}  label="Payroll Status"  value={runDetail?.status === 'ARCHIVED' ? 'Completed & Archived' : runDetail?.status === 'DISBURSED' ? 'Disbursed' : runDetail?.status ?? '—'} tint="success" />
                </div>
            </div>

            {/* Phase tabs */}
            <div className="rounded-2xl bg-white ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
                <div className="flex gap-8 px-5 pt-3 overflow-x-auto">
                    {[
                        { id: 'A', label: 'Phase A',   sub: 'Configuration Prerequisites', to: '/app/company/hr/payroll-config-prerequisites' },
                        { id: 'B', label: 'Phase B',   sub: 'Pre-Run Activities',          to: '/app/company/hr/payroll-pre-run' },
                        { id: 'C', label: 'Phase C',   sub: 'Payroll Run Wizard',          to: '/app/company/hr/payroll-runs' },
                        { id: 'D', label: 'Phase D',   sub: 'Post-Run Activities',         to: '#', active: true },
                    ].map(t => (
                        <Link key={t.id} to={t.to}
                            className={cn(
                                'pb-3 pt-1 text-center min-w-[150px] border-b-2 transition',
                                t.active ? 'border-primary-600 text-primary-700' : 'border-transparent text-neutral-500 hover:text-neutral-800',
                            )}>
                            <div className="text-sm font-bold">{t.label}</div>
                            <div className="text-[11px]">{t.sub}</div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Two-column main */}
            <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
                {/* Activities checklist */}
                <div className="rounded-2xl bg-white ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-5 py-4">
                        <div>
                            <h2 className="text-base font-bold text-neutral-900">Post-Run Activities Checklist</h2>
                            <p className="text-[12px] text-neutral-500 mt-0.5">Complete these activities after payroll run to ensure compliance and smooth operations.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Overall Progress</div>
                                <div className="text-[12.5px] font-semibold text-neutral-700">{completedCount} of {totalCount} completed</div>
                            </div>
                            <ProgressDonut completed={completedCount} total={totalCount} />
                            <button className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 bg-white px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-50">
                                <Calendar className="w-3 h-3" /> View Activity Calendar
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        {checklistLoading && !checklist ? (
                            <div className="p-5"><SkeletonTable rows={6} cols={6} /></div>
                        ) : activities.length === 0 ? (
                            <div className="px-6 py-12 text-center text-sm text-neutral-500">
                                No post-run activities available. Disburse a payroll run first.
                            </div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 bg-neutral-50/60">
                                        <th className="px-4 py-3 w-14">Step</th>
                                        <th className="px-4 py-3">Activity</th>
                                        <th className="px-4 py-3 hidden md:table-cell">Description</th>
                                        <th className="px-4 py-3 hidden lg:table-cell">Owner</th>
                                        <th className="px-4 py-3 whitespace-nowrap">Status</th>
                                        <th className="px-4 py-3 hidden xl:table-cell whitespace-nowrap">Due Date</th>
                                        <th className="px-4 py-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100">
                                    {activities.map(a => {
                                        const meta = ACTIVITY_META[a.id] ?? { icon: Info, iconTint: 'bg-neutral-100 text-neutral-600', ownerRole: 'System', ownerTint: 'bg-neutral-200 text-neutral-700' };
                                        const Icon = meta.icon;
                                        const dueLabel = a.status === 'NOT_APPLICABLE' ? 'Not Due' : undefined;
                                        const isManual = MANUAL_ACTIVITIES.includes(a.id);
                                        return (
                                            <tr key={a.id} className="group hover:bg-neutral-50/60">
                                                <td className="px-4 py-3.5 text-[12.5px] font-bold text-neutral-700">{a.activityNumber}</td>
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-start gap-3">
                                                        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', meta.iconTint)}>
                                                            <Icon className="w-[18px] h-[18px]" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="text-[13.5px] font-bold text-neutral-900 whitespace-nowrap">{a.name}</div>
                                                            <div className="md:hidden text-[12px] text-neutral-500 mt-1 leading-snug">{a.description}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 hidden md:table-cell">
                                                    <p className="text-[12.5px] text-neutral-600 leading-snug max-w-md">{a.description}</p>
                                                </td>
                                                <td className="px-4 py-3.5 hidden lg:table-cell">
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold', meta.ownerTint)}>
                                                            {initials(meta.ownerRole)}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="text-[12.5px] font-semibold text-neutral-800 leading-tight">{meta.ownerRole}</div>
                                                            <div className="text-[10.5px] text-neutral-500">{a.category.toLowerCase()}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    <StatusPill status={a.status} dueLabel={dueLabel} />
                                                    {a.metadata?.label && (
                                                        <div className="text-[10.5px] text-neutral-500 mt-0.5">{a.metadata.label}</div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5 hidden xl:table-cell whitespace-nowrap text-[12.5px] text-neutral-600">
                                                    {a.dueDate ? `${fmt.date(a.dueDate)}` : '—'}
                                                </td>
                                                <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                                    {a.status === 'COMPLETE' ? (
                                                        <button className="inline-flex items-center gap-1 rounded-md border border-success-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-success-700">
                                                            View Details <ChevronRight className="w-3 h-3" />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleAction(a)}
                                                            disabled={completeMutation.isPending}
                                                            className={cn(
                                                                'inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold',
                                                                isManual ? 'bg-primary-600 text-white hover:bg-primary-700'
                                                                         : 'border border-primary-200 bg-white text-primary-700 hover:bg-primary-50',
                                                                completeMutation.isPending && 'opacity-50 cursor-not-allowed',
                                                            )}
                                                        >
                                                            {completeMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                                            {isManual ? 'Mark Complete' : 'Continue'} <ChevronRight className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Right sidebar */}
                <aside className="space-y-4">
                    {/* Post-Run Health Summary */}
                    <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-neutral-900">Post-Run Health Summary</h3>
                            <a href="#" className="text-[11.5px] font-semibold text-primary-600 hover:text-primary-700">View All</a>
                        </div>
                        <ul className="grid grid-cols-2 gap-3">
                            <HealthRow icon={FileText}      iconTint="bg-success-50 text-success-600" label="Payslips Distributed"  value={`${insights?.payslipsEmailed ?? 0} / ${insights?.payslipsGenerated ?? 0}`} sub={insights?.payslipsGenerated > 0 ? `${Math.round(((insights?.payslipsEmailed ?? 0) / insights.payslipsGenerated) * 100)}%` : '0%'} />
                            <HealthRow icon={Landmark}      iconTint="bg-primary-50 text-primary-600" label="Bank Reconciliation"   value="—"                                                                                                  sub="Open Differences" />
                            <HealthRow icon={Shield}        iconTint="bg-warning-50 text-warning-600" label="Statutory Returns"     value={`${activities.filter(a => a.category === 'STATUTORY' && a.status === 'COMPLETE').length} / ${activities.filter(a => a.category === 'STATUTORY').length}`} sub="Filed" />
                            <HealthRow icon={BarChart3}     iconTint="bg-accent-50 text-accent-600"   label="Reports Generated"     value={String(activities.filter(a => a.category === 'REPORTING' && a.status === 'COMPLETE').length)}     sub="This Month" />
                            <HealthRow icon={FileSpreadsheet} iconTint="bg-info-50 text-info-600"     label="GL Entries Posted"     value={activities.find(a => a.id === 'gl_posting')?.status === 'COMPLETE' ? 'Posted' : 'Pending'}            sub={activities.find(a => a.id === 'gl_posting')?.metadata?.label ?? '—'} />
                            <HealthRow icon={Award}         iconTint="bg-success-50 text-success-600" label="Compliance Status"     value={(insights?.complianceScore ?? 0) >= 80 ? 'Good' : (insights?.complianceScore ?? 0) >= 50 ? 'Fair' : 'Weak'} sub={`${insights?.complianceScore ?? 0}/100`} />
                        </ul>
                    </div>

                    {/* Upcoming deadlines */}
                    <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-neutral-900">Upcoming Deadlines</h3>
                            <a href="#" className="text-[11.5px] font-semibold text-primary-600 hover:text-primary-700">View Calendar</a>
                        </div>
                        {upcomingDeadlines.length === 0 ? (
                            <p className="text-[12.5px] text-neutral-500">No upcoming deadlines.</p>
                        ) : (
                            <ul className="space-y-3">
                                {upcomingDeadlines.map(a => {
                                    const days = Math.ceil((new Date(a.dueDate!).getTime() - Date.now()) / 86_400_000);
                                    const month = new Date(a.dueDate!).toLocaleDateString('en-IN', { month: 'short' }).toUpperCase();
                                    const day = new Date(a.dueDate!).getDate();
                                    const urgent = days <= 10;
                                    return (
                                        <li key={a.id} className="flex items-center gap-3">
                                            <div className="w-11 h-11 rounded-xl bg-warning-50 text-warning-700 flex flex-col items-center justify-center shrink-0">
                                                <span className="text-[10px] font-bold uppercase tracking-wider">{month}</span>
                                                <span className="text-[14px] font-extrabold leading-none">{day}</span>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-[12.5px] font-bold text-neutral-900 truncate">{a.name}</div>
                                                <div className={cn('text-[11px] font-semibold', urgent ? 'text-danger-600' : 'text-neutral-500')}>
                                                    Due in {days} day{days === 1 ? '' : 's'}
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>

                    {/* Quick Links */}
                    <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                        <h3 className="text-sm font-bold text-neutral-900 mb-3">Quick Links</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <QuickLink icon={Shield}          label="Statutory Filing Center" to="/app/company/hr/statutory-filings" />
                            <QuickLink icon={Receipt}         label="Payslip Distribution Log" to="/app/company/hr/payslips" />
                            <QuickLink icon={FileSpreadsheet} label="GL Integration Dashboard" to="/app/company/hr/analytics/payroll" />
                            <QuickLink icon={Landmark}        label="Bank Reconciliation" to="/app/company/hr/payroll-runs" />
                            <QuickLink icon={BarChart3}       label="Payroll Reports" to="/app/company/hr/payroll-reports" />
                            <QuickLink icon={Award}           label="Compliance Dashboard" to="/app/company/hr/analytics/payroll" />
                        </div>
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

            {/* Post-Run Insights */}
            <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <h3 className="text-sm font-bold text-neutral-900 mb-3">Post-Run Insights</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                    <InsightTile icon={Banknote}     label="Net Pay Disbursed"  value={`₹${Number(insights?.totalNetPay ?? 0).toLocaleString('en-IN')}`} accent="primary" />
                    <InsightTile icon={Wallet}       label="Total Deductions"    value={`₹${Number(insights?.totalDeductions ?? 0).toLocaleString('en-IN')}`} accent="danger" inverse />
                    <InsightTile icon={Users}        label="Employees Paid"      value={`${insights?.employeeCount ?? 0} / ${insights?.employeeCount ?? 0}`} deltaLabel="100%" accent="success" />
                    <InsightTile icon={Clock}        label="Avg. Processing Time" value="—" deltaLabel="vs last month" accent="warning" />
                    <InsightTile icon={Award}        label="Statutory Compliance" value={(insights?.complianceScore ?? 0) >= 80 ? 'Good' : 'Fair'} deltaLabel="No overdue items" accent="success" />
                    <InsightTile icon={Landmark}     label="Bank Reconciliation"  value="—" deltaLabel="vs last month" accent="emerald" />
                </div>
            </div>

            {/* Footer */}
            <div className="rounded-xl bg-info-50/40 p-3.5 ring-1 ring-info-100 flex items-center gap-2.5">
                <Info className="w-4 h-4 text-info-500" />
                <p className="text-[12.5px] text-info-800">Complete all post-run activities to ensure compliance, accurate reporting and smooth financial reconciliation.</p>
            </div>
        </div>
    );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Helpers                                                                  */
/* ──────────────────────────────────────────────────────────────────────── */

function MetaTile({
    icon: Icon, label, value, sub, tint,
}: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; sub?: string; tint: 'primary' | 'success' | 'warning' | 'info' | 'accent' | 'emerald' }) {
    const tintMap = {
        primary: 'bg-primary-100 text-primary-600',
        success: 'bg-success-100 text-success-600',
        warning: 'bg-warning-100 text-warning-600',
        info:    'bg-info-100 text-info-600',
        accent:  'bg-accent-100 text-accent-600',
        emerald: 'bg-emerald-100 text-emerald-600',
    } as const;
    return (
        <div className="flex items-center gap-2.5 min-w-0">
            <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', tintMap[tint])}>
                <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">{label}</div>
                <div className="text-[13px] font-bold text-neutral-900 truncate">{value}</div>
                {sub && <div className="text-[10.5px] text-neutral-500 truncate">{sub}</div>}
            </div>
        </div>
    );
}

function QuickLink({ icon: Icon, label, to }: { icon: React.ComponentType<{ className?: string }>; label: string; to: string }) {
    return (
        <Link to={to} className="group flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-[12.5px] font-semibold text-neutral-700 hover:bg-neutral-50 hover:border-primary-200 transition">
            <Icon className="w-3.5 h-3.5 text-primary-500" />
            <span className="truncate">{label}</span>
        </Link>
    );
}

export default PhaseDPostRunScreen;
