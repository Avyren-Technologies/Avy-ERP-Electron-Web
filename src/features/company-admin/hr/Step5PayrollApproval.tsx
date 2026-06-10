import { useMemo, useState, useRef, useEffect } from 'react';
import {
    CheckCircle2,
    Loader2,
    AlertTriangle,
    Users,
    Banknote,
    Wallet,
    TrendingUp,
    TrendingDown,
    Building2,
    Landmark,
    Shield,
    ChevronDown,
    Download,
    RefreshCcw,
    ArrowRight,
    ArrowLeft,
    Headphones,
    Phone,
    Mail,
    BookOpen,
    Info,
    Calendar,
    Clock,
    Upload,
    FileText,
    Save,
    X,
    Eye,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import {
    useApprovalSummary,
    useApprovalWorkflow,
    useComponentBreakdown,
    useStatutorySummary,
    usePayrollRun,
} from '@/features/company-admin/api/use-payroll-run-queries';
import {
    useApproveRun,
    useSaveApprovalNotes,
} from '@/features/company-admin/api/use-payroll-run-mutations';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import { useAuthStore, getDisplayName } from '@/store/useAuthStore';
import { showSuccess, showApiError } from '@/lib/toast';

interface StepProps {
    runId: string;
    runDetail: any;
    completedStep: number;
    onStepAction: () => void;
    anyMutating: boolean;
}

const formatINR = (v: unknown): string => `₹${(Number(v) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

/* ──────────────────────────────────────────────────────────────────────── */
/* Atoms                                                                    */
/* ──────────────────────────────────────────────────────────────────────── */

function StatTile({
    icon: Icon, label, value, tooltip, fullValue, tint,
}: {
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    label: string;
    value: React.ReactNode;
    tooltip?: string;
    fullValue?: string;
    tint: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'emerald' | 'violet';
}) {
    const tintMap = {
        primary: 'bg-primary-50 text-primary-600',
        success: 'bg-success-50 text-success-600',
        warning: 'bg-warning-50 text-warning-600',
        danger:  'bg-danger-50 text-danger-600',
        info:    'bg-info-50 text-info-600',
        accent:  'bg-accent-50 text-accent-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        violet:  'bg-violet-50 text-violet-600',
    } as const;
    return (
        <div className="rounded-2xl bg-white px-4 py-4 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-3">
                <div className={cn('w-11 h-11 rounded-full flex items-center justify-center shrink-0', tintMap[tint])}>
                    <Icon className="w-5 h-5" strokeWidth={2.2} />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wider text-neutral-500 leading-tight">
                        <span className="truncate">{label}</span>
                        {tooltip && <InfoTooltip content={tooltip} />}
                    </div>
                    <div
                        className="mt-0.5 text-[18px] font-extrabold text-neutral-900 leading-tight tabular-nums truncate"
                        title={fullValue ?? (typeof value === 'string' || typeof value === 'number' ? String(value) : undefined)}
                    >
                        {value}
                    </div>
                </div>
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
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-lg z-30">
                    <button onClick={() => { setOpen(false); onRefresh(); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                        <RefreshCcw className="w-4 h-4" /> Refresh Summary
                    </button>
                    <button onClick={() => { setOpen(false); onExport(); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                        <Download className="w-4 h-4" /> Export Payroll Report
                    </button>
                </div>
            )}
        </div>
    );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Main component                                                           */
/* ──────────────────────────────────────────────────────────────────────── */

export function Step5PayrollApproval({ runId, runDetail, completedStep, onStepAction, anyMutating }: StepProps) {
    const fmt = useCompanyFormatter();
    const authUser = useAuthStore(s => s.user);
    const authUserName = getDisplayName(authUser);
    const isApproved = completedStep >= 5;

    const approvalQuery = useApprovalSummary(runId);
    const statutoryQuery = useStatutorySummary(runId);
    const runDetailQuery = usePayrollRun(runId);
    const workflowQuery = useApprovalWorkflow(runId);
    const componentQuery = useComponentBreakdown(runId);

    const approveMutation = useApproveRun();
    const saveNotesMutation = useSaveApprovalNotes();

    const [tab, setTab] = useState<'payroll' | 'statutory' | 'department' | 'bank' | 'workflow'>('payroll');
    const [notes, setNotes] = useState<string>(runDetail?.approvalNotes ?? '');
    const [files, setFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (typeof runDetail?.approvalNotes === 'string') setNotes(runDetail.approvalNotes);
    }, [runDetail?.approvalNotes]);

    const approval: any = approvalQuery.data?.data ?? null;
    const statutory: any = statutoryQuery.data?.data ?? null;
    // Backend returns: { success, data: { workflow, approvalRequest, message } }.
    // Drill one extra level to extract the actual workflow object (with `steps`).
    const workflow: any = workflowQuery.data?.data?.workflow ?? null;
    const components: any = componentQuery.data?.data ?? null;

    // Backend `getApprovalSummary` nests executive metrics under `summary`,
    // and exposes `comparison.previous` / `comparison.current` for variance.
    const summary = approval?.summary ?? approval?.comparison?.current ?? null;
    const employees       = Number(summary?.employees ?? runDetail?.employeeCount ?? 0);
    const totalGross      = Number(summary?.grossPay ?? runDetail?.totalGross ?? 0);
    const totalDeductions = Number(summary?.totalDeductions ?? runDetail?.totalDeductions ?? 0);
    const totalNet        = Number(summary?.netPay ?? runDetail?.totalNet ?? 0);
    const totalStatutory  = Number(summary?.totalStatutory ?? runDetail?.totalStatutory ?? 0);
    const employerCost    = Number(summary?.employerCost ?? runDetail?.totalEmployerCost ?? 0);
    const totalPayable    = totalNet + employerCost;

    /* Earnings breakdown (component-breakdown endpoint; backend returns `componentName` + `totalAmount`) */
    const earningComponents: Array<{ name: string; total: number; employeeCount: number }> = (
        Array.isArray(components?.earnings) ? components.earnings : []
    ).map((c: any) => ({
        name: c.componentName ?? c.name ?? c.componentCode ?? '—',
        total: Number(c.totalAmount ?? c.total ?? 0),
        employeeCount: Number(c.employeeCount ?? 0),
    }));
    const deductionComponents: Array<{ name: string; total: number; employeeCount: number }> = (
        Array.isArray(components?.deductions) ? components.deductions : []
    ).map((c: any) => ({
        name: c.componentName ?? c.name ?? c.componentCode ?? '—',
        total: Number(c.totalAmount ?? c.total ?? 0),
        employeeCount: Number(c.employeeCount ?? 0),
    }));

    /* Aggregate maps for legacy `earningsBreakdown` consumers */
    const earningsBreakdown: Record<string, number> = Object.fromEntries(
        earningComponents.map(c => [c.name, c.total]),
    );
    const deductionsBreakdown: Record<string, number> = Object.fromEntries(
        deductionComponents.map(c => [c.name, c.total]),
    );

    /* Department breakdown — backend uses `department` field, not `deptName`/`name` */
    const departments: any[] = approval?.departmentBreakdown ?? [];

    /* Bank disbursement breakdown — backend nests under `bankDisbursementSummary` */
    const bankDisbursement: any = approval?.bankDisbursementSummary ?? {};
    const bankBreakdown: any[] = Array.isArray(bankDisbursement?.bankBreakdown)
        ? bankDisbursement.bankBreakdown
        : [];
    const paymentModeBreakdown: any[] = Array.isArray(bankDisbursement?.paymentModeBreakdown)
        ? bankDisbursement.paymentModeBreakdown
        : [];
    const employeesWithoutBank: number = Number(bankDisbursement?.employeesWithoutBank?.count ?? 0);

    /* Statutory total breakdown — backend nests under `totals` (canonical) and exposes
     * `employeeContributions` aliases (`pfEmployeeTotal`, `esiEmployeeTotal`, `ptAmount`, etc). */
    const statutoryTotals: any = statutory?.totals ?? statutory ?? {};
    const statutoryEmpSum = Number(statutoryTotals?.pfEmployee ?? statutory?.pfEmployeeTotal ?? 0)
        + Number(statutoryTotals?.esiEmployee ?? statutory?.esiEmployeeTotal ?? 0)
        + Number(statutoryTotals?.pt ?? statutory?.ptTotal ?? 0)
        + Number(statutoryTotals?.tds ?? statutory?.tdsTotal ?? 0)
        + Number(statutoryTotals?.lwfEmployee ?? statutory?.lwfEmployeeTotal ?? 0);
    const statutoryEmprSum = Number(statutoryTotals?.pfEmployer ?? statutory?.pfEmployerTotal ?? 0)
        + Number(statutoryTotals?.esiEmployer ?? statutory?.esiEmployerTotal ?? 0)
        + Number(statutoryTotals?.lwfEmployer ?? statutory?.lwfEmployerTotal ?? 0);
    useEffect(() => {
        if (statutory && (totalStatutory > 0 || employerCost > 0) && statutoryEmpSum === 0 && statutoryEmprSum === 0) {
            // eslint-disable-next-line no-console
            console.warn('[Step5] Statutory totals reported but component breakdown is zero', {
                runId,
                totalStatutory,
                employerCost,
                statutory,
            });
        }
    }, [statutory, totalStatutory, employerCost, statutoryEmpSum, statutoryEmprSum, runId]);

    /* Variance — backend exposes both `comparison.variancePercent` and a flat `previous` snapshot */
    const variancePct: any = approval?.comparison?.variancePercent ?? approval?.variancePercent ?? {};
    const grossVariance = Number(variancePct.grossPay ?? 0);
    const netVariance = Number(variancePct.netPay ?? 0);
    const previous: any = approval?.comparison?.previous ?? approval?.previous ?? null;

    const isLoading = (approvalQuery.isLoading || statutoryQuery.isLoading) && !approval;

    const onRefresh = () => {
        approvalQuery.refetch();
        statutoryQuery.refetch();
        runDetailQuery.refetch();
        workflowQuery.refetch();
        componentQuery.refetch();
    };
    const onExport = () => window.print();

    const handleSaveDraft = () => {
        saveNotesMutation.mutate(
            { runId, notes },
            {
                onSuccess: () => { showSuccess('Notes saved', 'Approval notes saved as draft.'); },
                onError: (err) => showApiError(err),
            },
        );
    };

    const [showApproveDialog, setShowApproveDialog] = useState(false);
    const [notesError, setNotesError] = useState<string | null>(null);

    const handleApproveClick = () => {
        // Approval notes are mandatory for audit trail
        if (!notes.trim()) {
            setNotesError('Approval notes are required before submitting for approval.');
            return;
        }
        setNotesError(null);
        setShowApproveDialog(true);
    };

    const handleConfirmApprove = async () => {
        const fireApprove = () => {
            approveMutation.mutate(runId, {
                onSuccess: () => {
                    showSuccess('Payroll Approved', 'The payroll run has been approved.');
                    setShowApproveDialog(false);
                    // Parent's useEffect will auto-advance to Step 6 when runDetail.status updates
                },
                onError: (err) => { showApiError(err); setShowApproveDialog(false); },
            });
        };
        if (notes.trim() && notes !== (runDetail?.approvalNotes ?? '')) {
            saveNotesMutation.mutate(
                { runId, notes },
                { onSuccess: fireApprove, onError: (err) => { showApiError(err); setShowApproveDialog(false); } },
            );
        } else {
            fireApprove();
        }
    };

    /* Approval workflow — fetched from backend `GET /hr/payroll-runs/:id/approval-workflow`.
       Backend returns the configured ApprovalWorkflow row for trigger PAYROLL_APPROVAL (alias: PAYROLL_RUN_APPROVAL),
       wrapped as { workflow, approvalRequest, message }. We unwrap `workflow` which contains
       `steps` (each step: { stepOrder, approverRole, approverName, slaHours, ... }). */
    const workflowMissing = workflowQuery.isError
        || (workflowQuery.isSuccess && (!workflow || !Array.isArray(workflow?.steps) || workflow.steps.length === 0));
    const workflowSteps: any[] = Array.isArray(workflow?.steps) ? workflow.steps : [];
    const currentApprovalLevel: number = Number(
        runDetail?.approvalCurrentLevel
            ?? workflow?.currentLevel
            ?? approval?.approvalCurrentLevel
            ?? (isApproved ? (workflowSteps.length || 1) + 1 : 1),
    );
    const approvers = workflowSteps.length > 0
        ? workflowSteps.map((s: any, idx: number) => {
            const level = Number(s.level ?? idx + 1);
            const explicitStatus = (s.status ?? s.approvalStatus ?? '').toString().toUpperCase();
            let status: 'APPROVED' | 'REJECTED' | 'CURRENT' | 'PENDING';
            if (explicitStatus === 'APPROVED' || explicitStatus === 'REJECTED') {
                status = explicitStatus as 'APPROVED' | 'REJECTED';
            } else if (isApproved || level < currentApprovalLevel) {
                status = 'APPROVED';
            } else if (level === currentApprovalLevel) {
                status = 'CURRENT';
            } else {
                status = 'PENDING';
            }
            return {
                level,
                role: s.approverRole ?? s.role ?? `Level ${level} Approver`,
                name: s.approverName ?? s.name ?? (status === 'CURRENT' ? authUserName || '—' : '—'),
                status,
                when: s.approvedAt ?? s.when ?? null,
            };
        })
        : [];

    /* Previous run approver context (from runDetail computed/approved meta if any) */
    const prevApproverName = runDetail?.approvedByName ?? null;
    const prevApprovedAt = runDetail?.approvedAt ?? null;

    return (
        <div className="space-y-5">
            {/* Step header + About */}
            <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
                <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <div className="text-[11px] font-bold uppercase tracking-wider text-primary-600">Step 5 of 6</div>
                            <h2 className="mt-1 text-xl font-bold text-neutral-900">Approval</h2>
                            <p className="mt-1.5 text-[13px] text-neutral-600 max-w-2xl leading-snug">
                                Review the complete payroll summary, statutory amounts, and bank disbursement totals.
                                Submit for approval to Finance Manager, then CFO (as per approval workflow).
                            </p>
                        </div>
                        <PayrollActionsDropdown onRefresh={onRefresh} onExport={onExport} />
                    </div>

                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 rounded-xl bg-neutral-50/70 p-3 ring-1 ring-neutral-100">
                        <MetaPill icon={Calendar} label="Payroll Period" value={runDetail?.month && runDetail?.year ? `${fmt.date(new Date(runDetail.year, runDetail.month - 1, 1).toISOString())} – ${fmt.date(new Date(runDetail.year, runDetail.month, 0).toISOString())}` : '—'} tint="info" />
                        <MetaPill icon={Clock} label="Cut-off Day" value={runDetail?.month && runDetail?.year ? fmt.date(new Date(runDetail.year, runDetail.month, 0).toISOString()) : '—'} tint="accent" />
                        <MetaPill icon={Calendar} label="Tentative Pay Date" value={runDetail?.month && runDetail?.year ? fmt.date(new Date(runDetail.year, runDetail.month, 5).toISOString()) : '—'} tint="warning" />
                        <MetaPill icon={CheckCircle2} label="Approved By (Prev Run)" value={prevApproverName ? `${prevApproverName}${prevApprovedAt ? ` · ${fmt.date(prevApprovedAt)}` : ''}` : '—'} tint="success" />
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
                        Payroll requires approval from Finance Manager followed by CFO as per the defined approval
                        workflow. All approvers will be notified.
                    </p>
                    <a href="#" className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-semibold text-primary-600 hover:text-primary-700">
                        <BookOpen className="w-3.5 h-3.5" /> Learn more →
                    </a>
                </div>
            </div>

            {/* Warning */}
            {!isApproved && (
                <div className="rounded-2xl bg-warning-50/70 p-4 ring-1 ring-warning-200">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-warning-600 shrink-0 mt-0.5" />
                        <p className="text-[13px] text-warning-800 font-medium">
                            Please review all totals and statutory amounts carefully. Once approved, the payroll will be disbursed and cannot be changed.
                        </p>
                    </div>
                </div>
            )}

            {/* KPI strip — 6 tiles */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                <StatTile icon={Users}     label="Total Employees"
                    value={employees}
                    fullValue={String(employees)}
                    tooltip="Headcount included in this payroll run after exceptions and on-hold cases were resolved."
                    tint="primary" />
                <StatTile icon={Banknote}  label="Total Gross Pay"
                    value={formatINR(totalGross)}
                    fullValue={formatINR(totalGross)}
                    tooltip="Sum of all earning components (Basic, HRA, allowances, bonuses, overtime, arrears) across all employees, before any deductions."
                    tint="success" />
                <StatTile icon={TrendingDown} label="Total Deductions"
                    value={formatINR(totalDeductions)}
                    fullValue={formatINR(totalDeductions)}
                    tooltip="Sum of employee-side deductions: PF (employee share), ESI (employee share), Professional Tax, TDS, LWF (employee share), loans, advances and other recoveries."
                    tint="danger" />
                <StatTile icon={Wallet}    label="Total Net Pay"
                    value={formatINR(totalNet)}
                    fullValue={formatINR(totalNet)}
                    tooltip="Gross Pay − Total Deductions. This is the amount to be transferred to employee bank accounts."
                    tint="emerald" />
                <StatTile icon={Shield}    label="Employer Statutory (Total)"
                    value={formatINR(employerCost)}
                    fullValue={formatINR(employerCost)}
                    tooltip="Employer-side statutory contributions (PF employer share, ESI employer share, LWF employer share). These are above and beyond Gross Pay."
                    tint="accent" />
                <StatTile icon={Landmark}  label="Total Payable (Net+Employer)"
                    value={formatINR(totalPayable)}
                    fullValue={formatINR(totalPayable)}
                    tooltip="Total outflow from company bank account: Net Pay (to employees) + Employer Statutory contributions (to PF/ESI/LWF authorities)."
                    tint="violet" />
            </div>

            {/* Two-column main */}
            <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
                <div className="rounded-2xl bg-white ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
                    {/* Tabs */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 px-5 pt-4">
                        <div className="flex gap-6 overflow-x-auto">
                            {([
                                { id: 'payroll',    label: 'Payroll Summary' },
                                { id: 'statutory',  label: 'Statutory Summary' },
                                { id: 'department', label: 'Department Summary' },
                                { id: 'bank',       label: 'Bank Disbursement Summary' },
                                { id: 'workflow',   label: 'Approval Workflow' },
                            ] as const).map(t => (
                                <button key={t.id} onClick={() => setTab(t.id)}
                                    className={cn(
                                        'pb-3 text-sm font-bold border-b-2 transition whitespace-nowrap',
                                        tab === t.id ? 'border-primary-600 text-primary-700' : 'border-transparent text-neutral-500 hover:text-neutral-800',
                                    )}>
                                    {t.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 pb-3">
                            <button onClick={onExport} className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 bg-white px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-50">
                                <Download className="w-3 h-3" /> Export
                            </button>
                        </div>
                    </div>

                    {/* Payroll Summary tab */}
                    {tab === 'payroll' && (
                        <div className="overflow-x-auto">
                            {isLoading ? (
                                <div className="p-5">Loading…</div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 bg-neutral-50/60">
                                            <th className="px-4 py-3">Particulars</th>
                                            <th className="px-4 py-3 text-right whitespace-nowrap">Amount (₹)</th>
                                            <th className="px-4 py-3 text-right whitespace-nowrap">Employees</th>
                                            <th className="px-4 py-3 text-right whitespace-nowrap">% of Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100">
                                        {/* EARNINGS section */}
                                        <tr><td colSpan={4} className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-success-700 bg-success-50/40">Earnings</td></tr>
                                        {Object.entries(earningsBreakdown).length > 0
                                            ? Object.entries(earningsBreakdown).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                                                <SummaryRow key={k} label={k} amount={v} employees={employees} total={totalGross} />
                                            ))
                                            : <SummaryRow label="No detailed earnings breakdown available" amount={totalGross} employees={employees} total={totalGross} />}
                                        <tr className="bg-success-50/40">
                                            <td className="px-4 py-3 text-[13px] font-bold text-success-900">Total Gross Pay</td>
                                            <td className="px-4 py-3 text-right text-[13px] font-bold text-success-900 font-mono">{formatINR(totalGross)}</td>
                                            <td className="px-4 py-3 text-right text-[13px] font-bold text-success-900">{employees}</td>
                                            <td className="px-4 py-3 text-right text-[13px] font-bold text-success-900">100.00%</td>
                                        </tr>

                                        {/* DEDUCTIONS section */}
                                        <tr><td colSpan={4} className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-danger-700 bg-danger-50/40">Deductions (Employee)</td></tr>
                                        {Object.entries(deductionsBreakdown).length > 0
                                            ? Object.entries(deductionsBreakdown).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                                                <SummaryRow key={k} label={k} amount={v} employees={employees} total={totalDeductions} />
                                            ))
                                            : <SummaryRow label="No detailed deductions breakdown available" amount={totalDeductions} employees={employees} total={totalDeductions} />}
                                        <tr className="bg-danger-50/40">
                                            <td className="px-4 py-3 text-[13px] font-bold text-danger-900">Total Deductions</td>
                                            <td className="px-4 py-3 text-right text-[13px] font-bold text-danger-900 font-mono">{formatINR(totalDeductions)}</td>
                                            <td className="px-4 py-3 text-right text-[13px] font-bold text-danger-900">{employees}</td>
                                            <td className="px-4 py-3 text-right text-[13px] font-bold text-danger-900">100.00%</td>
                                        </tr>

                                        {/* NET */}
                                        <tr className="bg-primary-50/40">
                                            <td className="px-4 py-3.5 text-[13.5px] font-extrabold text-primary-900">Total Net Pay (Bank Transfer)</td>
                                            <td className="px-4 py-3.5 text-right text-[13.5px] font-extrabold text-primary-900 font-mono">{formatINR(totalNet)}</td>
                                            <td className="px-4 py-3.5 text-right text-[13.5px] font-extrabold text-primary-900">{employees}</td>
                                            <td className="px-4 py-3.5 text-right text-[13.5px] font-extrabold text-primary-900">—</td>
                                        </tr>
                                    </tbody>
                                </table>
                            )}
                            <div className="px-5 py-3 text-[11px] text-neutral-500">Note: All amounts are in INR.</div>
                        </div>
                    )}

                    {tab === 'statutory' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 bg-neutral-50/60">
                                        <th className="px-4 py-3">Component</th>
                                        <th className="px-4 py-3 text-right whitespace-nowrap">Employee</th>
                                        <th className="px-4 py-3 text-right whitespace-nowrap">Employer</th>
                                        <th className="px-4 py-3 text-right whitespace-nowrap">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100">
                                    <StatutoryRow label="Provident Fund (PF)" emp={Number(statutoryTotals?.pfEmployee ?? statutory?.pfEmployeeTotal ?? 0)} empr={Number(statutoryTotals?.pfEmployer ?? statutory?.pfEmployerTotal ?? 0)} />
                                    <StatutoryRow label="Employees' State Insurance (ESI)" emp={Number(statutoryTotals?.esiEmployee ?? statutory?.esiEmployeeTotal ?? 0)} empr={Number(statutoryTotals?.esiEmployer ?? statutory?.esiEmployerTotal ?? 0)} />
                                    <StatutoryRow label="Professional Tax (PT)" emp={Number(statutoryTotals?.pt ?? statutory?.ptTotal ?? 0)} empr={0} />
                                    <StatutoryRow label="TDS (Income Tax)" emp={Number(statutoryTotals?.tds ?? statutory?.tdsTotal ?? 0)} empr={0} />
                                    <StatutoryRow label="Labour Welfare Fund (LWF)" emp={Number(statutoryTotals?.lwfEmployee ?? statutory?.lwfEmployeeTotal ?? 0)} empr={Number(statutoryTotals?.lwfEmployer ?? statutory?.lwfEmployerTotal ?? 0)} />
                                    <tr className="bg-primary-50/40">
                                        <td className="px-4 py-3 text-[13px] font-bold text-primary-900">Total</td>
                                        <td className="px-4 py-3 text-right text-[13px] font-bold text-primary-900 font-mono">{formatINR(totalStatutory)}</td>
                                        <td className="px-4 py-3 text-right text-[13px] font-bold text-primary-900 font-mono">{formatINR(employerCost)}</td>
                                        <td className="px-4 py-3 text-right text-[13px] font-bold text-primary-900 font-mono">{formatINR(totalStatutory + employerCost)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}

                    {tab === 'department' && (
                        <div className="overflow-x-auto">
                            {departments.length === 0 ? (
                                <div className="px-6 py-12 text-center text-sm text-neutral-500">No department-level breakdown available for this run.</div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 bg-neutral-50/60">
                                            <th className="px-4 py-3">Department</th>
                                            <th className="px-4 py-3 text-right">Employees</th>
                                            <th className="px-4 py-3 text-right">
                                                <span className="inline-flex items-center justify-end gap-1">
                                                    Gross
                                                    <InfoTooltip content="Total earnings (Basic, HRA, allowances, overtime, arrears, bonuses) for this department, before deductions." />
                                                </span>
                                            </th>
                                            <th className="px-4 py-3 text-right">
                                                <span className="inline-flex items-center justify-end gap-1">
                                                    Net Pay
                                                    <InfoTooltip content="Gross Pay minus employee-side deductions (PF, ESI, PT, TDS, LWF, loans). Amount transferred to employees in this department." />
                                                </span>
                                            </th>
                                            <th className="px-4 py-3 text-right">
                                                <span className="inline-flex items-center justify-end gap-1">
                                                    Employer Cost
                                                    <InfoTooltip content="Gross Pay plus employer-side statutory contributions (PF, ESI, LWF employer share). Total cost-to-company for this department." />
                                                </span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100">
                                        {departments.map((d: any, i: number) => {
                                            const rawName = d.department ?? d.deptName ?? d.departmentName ?? d.name;
                                            const isUnassigned = rawName == null || String(rawName).trim() === '';
                                            const grossVal = Number(d.grossPay ?? d.gross ?? 0);
                                            const netVal = Number(d.netPay ?? d.net ?? 0);
                                            const employerVal = Number(
                                                d.employerCost
                                                    ?? d.totalEmployerCost
                                                    ?? (grossVal + Number(d.employerStatutory ?? 0)),
                                            );
                                            return (
                                                <tr key={i}>
                                                    <td className="px-4 py-3 text-[13px] font-semibold text-neutral-900">
                                                        {isUnassigned ? (
                                                            <span className="inline-flex items-center gap-1.5 text-neutral-500 italic">
                                                                Unassigned
                                                                <InfoTooltip content="Employees without a department assigned to their profile. Update employee master to fix." />
                                                            </span>
                                                        ) : rawName}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">{Number(d.employees ?? d.employeeCount ?? 0)}</td>
                                                    <td className="px-4 py-3 text-right font-mono">{formatINR(grossVal)}</td>
                                                    <td className="px-4 py-3 text-right font-mono">{formatINR(netVal)}</td>
                                                    <td className="px-4 py-3 text-right font-mono">{formatINR(employerVal)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {tab === 'bank' && (
                        <div className="p-5 space-y-5">
                            {/* Headline: total disbursable */}
                            <div className="rounded-xl border border-neutral-200 p-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center"><Building2 className="w-5 h-5" /></div>
                                    <div>
                                        <h3 className="text-base font-bold text-neutral-900">Total Disbursable Amount</h3>
                                        <p className="text-xs text-neutral-500">Aggregate amount to be debited from the company account on pay date</p>
                                    </div>
                                </div>
                                <div className="text-3xl font-extrabold text-primary-900 font-mono" title={formatINR(totalNet)}>{formatINR(totalNet)}</div>
                                <div className="mt-2 text-[12.5px] text-neutral-600">Across <span className="font-bold">{employees}</span> employees · Tentative pay date <span className="font-bold">{runDetail?.month && runDetail?.year ? fmt.date(new Date(runDetail.year, runDetail.month, 5).toISOString()) : '—'}</span></div>
                            </div>

                            {/* Bank-wise breakdown */}
                            <div className="rounded-xl border border-neutral-200 overflow-hidden">
                                <div className="px-4 py-3 bg-neutral-50/60 border-b border-neutral-200">
                                    <h4 className="text-[13px] font-bold text-neutral-900">Bank-wise Breakdown</h4>
                                </div>
                                {bankBreakdown.length === 0 ? (
                                    <div className="px-4 py-8 text-center text-[12.5px] text-neutral-500">
                                        Bank-wise breakdown not available. Backend may not yet expose it for this run.
                                    </div>
                                ) : (
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 bg-neutral-50/40">
                                                <th className="px-4 py-2.5">Bank</th>
                                                <th className="px-4 py-2.5 text-right">Employees</th>
                                                <th className="px-4 py-2.5 text-right">Total Amount</th>
                                                <th className="px-4 py-2.5 text-right">% of Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral-100">
                                            {bankBreakdown.map((b: any, i: number) => {
                                                const amount = Number(b.amount ?? b.totalAmount ?? 0);
                                                const count = Number(b.employeeCount ?? b.employees ?? 0);
                                                const pct = totalNet > 0 ? (amount / totalNet) * 100 : 0;
                                                return (
                                                    <tr key={i}>
                                                        <td className="px-4 py-2.5 text-[12.5px] font-semibold text-neutral-800">
                                                            {b.bankName ?? b.name ?? <span className="italic text-neutral-500">Unassigned</span>}
                                                        </td>
                                                        <td className="px-4 py-2.5 text-right text-[12.5px] text-neutral-700">{count}</td>
                                                        <td className="px-4 py-2.5 text-right text-[12.5px] font-mono">{formatINR(amount)}</td>
                                                        <td className="px-4 py-2.5 text-right text-[12.5px] text-neutral-600">{pct.toFixed(2)}%</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            {/* Payment mode breakdown */}
                            <div className="rounded-xl border border-neutral-200 overflow-hidden">
                                <div className="px-4 py-3 bg-neutral-50/60 border-b border-neutral-200">
                                    <h4 className="text-[13px] font-bold text-neutral-900">Payment Mode Breakdown</h4>
                                </div>
                                {paymentModeBreakdown.length === 0 ? (
                                    <div className="px-4 py-8 text-center text-[12.5px] text-neutral-500">
                                        Payment mode breakdown not available for this run.
                                    </div>
                                ) : (
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 bg-neutral-50/40">
                                                <th className="px-4 py-2.5">Mode</th>
                                                <th className="px-4 py-2.5 text-right">Employees</th>
                                                <th className="px-4 py-2.5 text-right">Total Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral-100">
                                            {paymentModeBreakdown.map((m: any, i: number) => (
                                                <tr key={i}>
                                                    <td className="px-4 py-2.5 text-[12.5px] font-semibold text-neutral-800">{m.mode ?? m.paymentMode ?? '—'}</td>
                                                    <td className="px-4 py-2.5 text-right text-[12.5px] text-neutral-700">{Number(m.employeeCount ?? m.employees ?? 0)}</td>
                                                    <td className="px-4 py-2.5 text-right text-[12.5px] font-mono">{formatINR(Number(m.amount ?? m.totalAmount ?? 0))}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            {/* Employees without bank account */}
                            {employeesWithoutBank > 0 && (
                                <div className="rounded-xl border border-warning-200 bg-warning-50/50 p-4">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 text-warning-600 shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <h4 className="text-[13px] font-bold text-warning-900">
                                                {employeesWithoutBank} employee{employeesWithoutBank === 1 ? '' : 's'} missing bank account details
                                            </h4>
                                            <p className="mt-1 text-[12px] text-warning-800">
                                                These employees cannot receive bank transfers. They will be paid via the fallback method (cheque / cash) configured in payroll settings.
                                            </p>
                                            <Link
                                                to={`/app/company/hr/payroll-run/${runId}/entries?withoutBank=1`}
                                                className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-semibold text-warning-900 hover:text-warning-700"
                                            >
                                                <Eye className="w-3.5 h-3.5" /> View list
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {tab === 'workflow' && (
                        <div className="p-5">
                            {workflowQuery.isLoading ? (
                                <div className="flex items-center justify-center py-12 text-sm text-neutral-500">
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading approval workflow…
                                </div>
                            ) : workflowMissing ? (
                                <div className="rounded-xl border-2 border-dashed border-warning-200 bg-warning-50/40 p-8 text-center">
                                    <AlertTriangle className="w-10 h-10 mx-auto text-warning-600 mb-3" />
                                    <h4 className="text-[14px] font-bold text-neutral-900">No Approval Workflow Configured</h4>
                                    <p className="mt-2 text-[12.5px] text-neutral-600 max-w-md mx-auto leading-relaxed">
                                        No <span className="font-semibold">Payroll Approval</span> workflow has been configured for this company.
                                        Without an approval chain, payroll cannot move through proper financial governance.
                                    </p>
                                    <Link
                                        to="/app/company/hr/approval-workflows"
                                        className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-primary-700"
                                    >
                                        Configure Now <ArrowRight className="w-3.5 h-3.5" />
                                    </Link>
                                </div>
                            ) : (
                                <>
                                    {/* Vertical stepper */}
                                    <ol className="relative space-y-0">
                                        {approvers.map((a: any, idx: number) => {
                                            const isLast = idx === approvers.length - 1;
                                            const bgRing = a.status === 'APPROVED' ? 'bg-success-600 text-white ring-success-100'
                                                : a.status === 'REJECTED' ? 'bg-danger-600 text-white ring-danger-100'
                                                : a.status === 'CURRENT' ? 'bg-primary-600 text-white ring-primary-100 animate-pulse'
                                                : 'bg-neutral-100 text-neutral-500 ring-neutral-100';
                                            const connector = a.status === 'APPROVED' ? 'bg-success-300' : 'bg-neutral-200';
                                            return (
                                                <li key={idx} className="relative pl-12 pb-4 last:pb-0">
                                                    {!isLast && <span className={cn('absolute left-[15px] top-8 w-0.5 h-full', connector)} />}
                                                    <span className={cn(
                                                        'absolute left-0 top-0 w-8 h-8 rounded-full font-bold flex items-center justify-center text-[12px] ring-4',
                                                        bgRing,
                                                    )}>
                                                        {a.status === 'APPROVED' ? '✓' : a.status === 'REJECTED' ? '✕' : a.level ?? idx + 1}
                                                    </span>
                                                    <div className={cn(
                                                        'rounded-xl border p-3',
                                                        a.status === 'CURRENT' ? 'border-primary-300 bg-primary-50/50 shadow-sm' : 'border-neutral-200',
                                                    )}>
                                                        <div className="flex items-center justify-between gap-3">
                                                            <div className="min-w-0">
                                                                <div className="text-[10.5px] font-bold uppercase tracking-wider text-neutral-500">Level {a.level ?? idx + 1}</div>
                                                                <div className="text-[13.5px] font-bold text-neutral-900 truncate">{a.role}</div>
                                                            </div>
                                                            <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 shrink-0',
                                                                a.status === 'APPROVED' ? 'bg-success-50 text-success-700 ring-success-200'
                                                                : a.status === 'REJECTED' ? 'bg-danger-50 text-danger-700 ring-danger-200'
                                                                : a.status === 'CURRENT' ? 'bg-primary-50 text-primary-700 ring-primary-200'
                                                                : 'bg-neutral-50 text-neutral-600 ring-neutral-200')}>
                                                                {a.status === 'APPROVED' ? 'Approved' : a.status === 'REJECTED' ? 'Rejected' : a.status === 'CURRENT' ? 'Awaiting' : 'Pending'}
                                                            </span>
                                                        </div>
                                                        <div className="mt-1 text-[12.5px] text-neutral-700">
                                                            <span className="font-semibold">Approver: </span>
                                                            <span>{a.name ?? '—'}</span>
                                                        </div>
                                                        {a.when && (
                                                            <div className="mt-0.5 text-[11px] text-neutral-500">
                                                                {fmt.date(a.when)} · {fmt.time(a.when)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ol>

                                    <div className="mt-4 rounded-lg bg-info-50/60 px-3 py-2 text-[11.5px] text-info-800 ring-1 ring-info-100">
                                        <Info className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />
                                        Workflow definition is sourced from <span className="font-semibold">Approval Workflows → Payroll Approval</span>.
                                        {(workflow?.name || workflow?.workflowName) && <> Active workflow: <span className="font-semibold">{workflow.name ?? workflow.workflowName}</span>.</>}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                </div>

                {/* Sidebar */}
                <aside className="space-y-4">
                    {/* Approval Workflow card (always visible) */}
                    <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-neutral-900">Approval Workflow</h3>
                            <button onClick={() => setTab('workflow')} className="text-[11px] font-semibold text-primary-600 hover:text-primary-700">View →</button>
                        </div>
                        {workflowQuery.isLoading ? (
                            <div className="flex items-center gap-2 text-[12.5px] text-neutral-500"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading…</div>
                        ) : workflowMissing ? (
                            <div className="rounded-lg border border-warning-200 bg-warning-50/40 p-3 text-center">
                                <AlertTriangle className="w-5 h-5 text-warning-600 mx-auto mb-1.5" />
                                <p className="text-[11.5px] text-warning-900 font-semibold">Not configured</p>
                                <p className="mt-1 text-[10.5px] text-neutral-600 leading-snug">
                                    No Payroll Approval workflow is set up.
                                </p>
                                <Link to="/app/company/hr/approval-workflows" className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-primary-600 hover:text-primary-700">
                                    Configure Now <ArrowRight className="w-3 h-3" />
                                </Link>
                            </div>
                        ) : (
                            <ol className="space-y-3">
                                {approvers.map((a: any, idx: number) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0',
                                            a.status === 'APPROVED' ? 'bg-success-600 text-white'
                                            : a.status === 'REJECTED' ? 'bg-danger-600 text-white'
                                            : a.status === 'CURRENT' ? 'bg-primary-600 text-white'
                                            : 'bg-neutral-100 text-neutral-500')}>
                                            {a.status === 'APPROVED' ? '✓' : a.status === 'REJECTED' ? '✕' : a.level ?? idx + 1}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="text-[12.5px] font-bold text-neutral-900 truncate" title={a.role}>{a.role}</div>
                                                <span className={cn('text-[10.5px] font-semibold uppercase tracking-wider shrink-0',
                                                    a.status === 'APPROVED' ? 'text-success-700'
                                                    : a.status === 'REJECTED' ? 'text-danger-700'
                                                    : a.status === 'CURRENT' ? 'text-primary-700'
                                                    : 'text-neutral-500')}>
                                                    {a.status === 'CURRENT' ? 'Awaiting' : a.status}
                                                </span>
                                            </div>
                                            <div className="text-[11.5px] text-neutral-600 truncate" title={a.name ?? ''}>{a.name ?? '—'}</div>
                                            {a.when && <div className="text-[10.5px] text-neutral-500">{fmt.date(a.when)} {fmt.time(a.when)}</div>}
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        )}
                    </div>

                    {/* Approval Notes */}
                    <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                        <h3 className="text-sm font-bold text-neutral-900 mb-3">
                            Approval Notes <span className="text-danger-600">*</span>
                        </h3>
                        <textarea
                            value={notes}
                            onChange={(e) => { setNotes(e.target.value.slice(0, 500)); if (notesError) setNotesError(null); }}
                            placeholder="Add your comments before approving…"
                            disabled={isApproved}
                            rows={4}
                            className={cn(
                                'w-full rounded-lg border bg-white p-3 text-[12.5px] text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 disabled:opacity-60',
                                notesError ? 'border-danger-300 focus:ring-danger-200' : 'border-neutral-200 focus:ring-primary-200',
                            )}
                        />
                        <div className="mt-1 flex items-center justify-between text-[11px]">
                            <span className={cn(notesError ? 'text-danger-600' : 'text-neutral-500')}>
                                {notesError ?? 'Required — explains the approval decision in the audit trail.'}
                            </span>
                            <span className="text-neutral-500">{notes.length}/500 characters</span>
                        </div>
                    </div>

                    {/* Attachments */}
                    <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                        <div className="flex items-center gap-1.5 mb-3">
                            <h3 className="text-sm font-bold text-neutral-900">Attachments</h3>
                            <span className="group relative inline-flex">
                                <Info className="w-3.5 h-3.5 text-neutral-400 cursor-help" />
                                <span className="invisible group-hover:visible absolute z-30 left-0 top-5 w-64 rounded-md bg-neutral-900 px-3 py-2 text-[11px] font-normal text-white shadow-lg leading-snug">
                                    Attach supporting documents — board approvals, variance memos, scanned bank-mandate forms, finance committee notes. These appear in the audit log alongside this approval and are accessible from the Payroll Run Wizard archive.
                                </span>
                            </span>
                        </div>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="cursor-pointer rounded-xl border-2 border-dashed border-primary-200 bg-primary-50/30 p-5 text-center hover:bg-primary-50/60 transition"
                        >
                            <Upload className="w-7 h-7 mx-auto text-primary-500 mb-2" />
                            <p className="text-[12.5px] font-semibold text-neutral-700">Drag & drop files here or</p>
                            <p className="text-[12px] text-primary-600 font-semibold">Choose Files to Upload</p>
                            <p className="mt-1 text-[10.5px] text-neutral-500">PDF, XLS, XLSX, PNG, JPG (Max 10 MB each)</p>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept=".pdf,.xls,.xlsx,.png,.jpg,.jpeg"
                            className="hidden"
                            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                        />
                        {files.length > 0 && (
                            <ul className="mt-3 space-y-1.5">
                                {files.map((f, i) => (
                                    <li key={i} className="flex items-center justify-between gap-2 rounded-lg bg-neutral-50 px-2.5 py-1.5 text-[11.5px]">
                                        <span className="truncate text-neutral-700">{f.name}</span>
                                        <button onClick={() => setFiles(files.filter((_, j) => j !== i))} className="p-0.5 rounded text-neutral-400 hover:text-danger-600">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
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

            {/* Earnings & Deductions Component Breakdown */}
            <div className="rounded-2xl bg-white ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-100">
                    <h3 className="text-sm font-bold text-neutral-900">Earnings & Deductions Breakdown</h3>
                    <InfoTooltip content="Component-level totals derived from individual payroll entries. Each row aggregates the same component across employees." />
                </div>
                {componentQuery.isLoading ? (
                    <div className="flex items-center justify-center py-10 text-sm text-neutral-500">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading component breakdown…
                    </div>
                ) : componentQuery.isError || (!earningComponents.length && !deductionComponents.length) ? (
                    <div className="px-5 py-8 text-center text-[12.5px] text-neutral-500">
                        {componentQuery.isError
                            ? 'Data not available — component breakdown endpoint is unavailable for this run.'
                            : 'No component-level breakdown available yet. Recompute the payroll run to populate this view.'}
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-neutral-100">
                        {/* Earnings */}
                        <div>
                            <div className="px-5 py-2.5 bg-success-50/40 text-[11px] font-bold uppercase tracking-wider text-success-700">Earnings</div>
                            {earningComponents.length === 0 ? (
                                <div className="px-5 py-6 text-center text-[12px] text-neutral-500">No earning components.</div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-[10.5px] font-semibold uppercase tracking-wider text-neutral-500 bg-neutral-50/40">
                                            <th className="px-5 py-2">Component</th>
                                            <th className="px-5 py-2 text-right">Employees</th>
                                            <th className="px-5 py-2 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100">
                                        {earningComponents
                                            .slice()
                                            .sort((a, b) => Number(b.total ?? 0) - Number(a.total ?? 0))
                                            .map((c, i) => (
                                                <tr key={i}>
                                                    <td className="px-5 py-2 text-[12.5px] text-neutral-800">{c.name ?? '—'}</td>
                                                    <td className="px-5 py-2 text-right text-[12.5px] text-neutral-600">{Number(c.employeeCount ?? 0)}</td>
                                                    <td className="px-5 py-2 text-right text-[12.5px] font-mono">{formatINR(Number(c.total ?? 0))}</td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Deductions */}
                        <div>
                            <div className="px-5 py-2.5 bg-danger-50/40 text-[11px] font-bold uppercase tracking-wider text-danger-700">Deductions</div>
                            {deductionComponents.length === 0 ? (
                                <div className="px-5 py-6 text-center text-[12px] text-neutral-500">No deduction components.</div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-[10.5px] font-semibold uppercase tracking-wider text-neutral-500 bg-neutral-50/40">
                                            <th className="px-5 py-2">Component</th>
                                            <th className="px-5 py-2 text-right">Employees</th>
                                            <th className="px-5 py-2 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100">
                                        {deductionComponents
                                            .slice()
                                            .sort((a, b) => Number(b.total ?? 0) - Number(a.total ?? 0))
                                            .map((c, i) => (
                                                <tr key={i}>
                                                    <td className="px-5 py-2 text-[12.5px] text-neutral-800">{c.name ?? '—'}</td>
                                                    <td className="px-5 py-2 text-right text-[12.5px] text-neutral-600">{Number(c.employeeCount ?? 0)}</td>
                                                    <td className="px-5 py-2 text-right text-[12.5px] font-mono">{formatINR(Number(c.total ?? 0))}</td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Variance hint */}
            {previous && (Number.isFinite(grossVariance) || Number.isFinite(netVariance)) && (
                <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-3 text-[12.5px] text-neutral-700 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                        <span className="inline-flex items-center gap-1">
                            {grossVariance >= 0 ? <TrendingUp className="w-3.5 h-3.5 text-success-600" /> : <TrendingDown className="w-3.5 h-3.5 text-danger-600" />}
                            Gross vs prev month: <span className={cn('font-bold', grossVariance >= 0 ? 'text-success-700' : 'text-danger-700')}>{grossVariance >= 0 ? '+' : ''}{grossVariance.toFixed(2)}%</span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                            {netVariance >= 0 ? <TrendingUp className="w-3.5 h-3.5 text-success-600" /> : <TrendingDown className="w-3.5 h-3.5 text-danger-600" />}
                            Net vs prev month: <span className={cn('font-bold', netVariance >= 0 ? 'text-success-700' : 'text-danger-700')}>{netVariance >= 0 ? '+' : ''}{netVariance.toFixed(2)}%</span>
                        </span>
                    </div>
                    <span className="text-neutral-500">Prev gross: <span className="font-bold text-neutral-700">{formatINR(previous?.grossPay)}</span></span>
                </div>
            )}

            {/* Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 sticky bottom-0 bg-[var(--background)] py-3 -mx-4 px-4">
                <div className="flex items-center gap-3 text-[12.5px] text-neutral-600">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Step 4 (Statutory Deductions)</span>
                    <span className="ml-3 inline-flex items-center gap-1 text-neutral-500">
                        <Shield className="w-3.5 h-3.5" />
                        Payroll will be moved to the next approver after your approval.
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSaveDraft}
                        disabled={isApproved || saveNotesMutation.isPending}
                        className={cn('inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50',
                            (isApproved || saveNotesMutation.isPending) && 'opacity-50 cursor-not-allowed')}
                    >
                        {saveNotesMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Save as Draft
                    </button>
                    <button
                        disabled={isApproved || anyMutating}
                        onClick={() => alert('Reject flow uses ESS workflow rejection — open the approval request to reject.')}
                        className={cn('inline-flex items-center gap-1.5 rounded-lg border border-danger-200 bg-white px-4 py-2 text-sm font-semibold text-danger-700 hover:bg-danger-50',
                            (isApproved) && 'opacity-50 cursor-not-allowed')}
                    >
                        <X className="w-3.5 h-3.5" />
                        Reject Payroll
                    </button>
                    <button
                        disabled={isApproved || anyMutating || approveMutation.isPending}
                        onClick={handleApproveClick}
                        className={cn(
                            'inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold shadow-sm transition',
                            isApproved
                                ? 'bg-success-100 text-success-700 cursor-default'
                                : 'bg-gradient-to-r from-success-600 to-emerald-600 text-white shadow-success-500/25 hover:from-success-700 hover:to-emerald-700',
                            (anyMutating || approveMutation.isPending) && 'opacity-60 cursor-not-allowed',
                        )}
                    >
                        {approveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        {isApproved ? 'Payroll Approved' : 'Approve & Submit'}
                        {!isApproved && <ArrowRight className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Confirm Approve dialog — replaces native window.confirm() */}
            <ConfirmDialog
                open={showApproveDialog}
                title="Approve Payroll Run?"
                message={`You are about to approve ${runDetail?.month && runDetail?.year ? `${['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][runDetail.month]} ${runDetail.year}` : 'this'} payroll for ${employees} employees with a total net payout of ${formatINR(totalNet)} (₹${totalPayable.toLocaleString('en-IN')} including employer cost). Once approved, the payroll will move to disbursement and cannot be edited.`}
                confirmLabel="Approve & Submit"
                variant="success"
                loading={approveMutation.isPending || saveNotesMutation.isPending}
                onConfirm={handleConfirmApprove}
                onCancel={() => setShowApproveDialog(false)}
            />
        </div>
    );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Helpers                                                                  */
/* ──────────────────────────────────────────────────────────────────────── */

function SummaryRow({ label, amount, employees, total }: { label: string; amount: number; employees: number; total: number }) {
    const pct = total > 0 ? (amount / total) * 100 : 0;
    return (
        <tr>
            <td className="px-4 py-2.5 text-[12.5px] text-neutral-700">{label}</td>
            <td className="px-4 py-2.5 text-right text-[12.5px] font-mono text-neutral-700">{formatINR(amount)}</td>
            <td className="px-4 py-2.5 text-right text-[12.5px] text-neutral-600">{employees}</td>
            <td className="px-4 py-2.5 text-right text-[12.5px] text-neutral-600">{pct.toFixed(2)}%</td>
        </tr>
    );
}

function StatutoryRow({ label, emp, empr }: { label: string; emp: number; empr: number }) {
    return (
        <tr>
            <td className="px-4 py-2.5 text-[12.5px] text-neutral-700">{label}</td>
            <td className="px-4 py-2.5 text-right text-[12.5px] font-mono text-neutral-700">{formatINR(emp)}</td>
            <td className="px-4 py-2.5 text-right text-[12.5px] font-mono text-neutral-700">{formatINR(empr)}</td>
            <td className="px-4 py-2.5 text-right text-[12.5px] font-mono font-bold text-neutral-900">{formatINR(emp + empr)}</td>
        </tr>
    );
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
