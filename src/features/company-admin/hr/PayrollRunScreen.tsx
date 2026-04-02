import { useState } from "react";
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import {
    Plus,
    Loader2,
    X,
    Search,
    Lock,
    AlertTriangle,
    Calculator,
    Building2,
    CheckCircle2,
    Banknote,
    ChevronRight,
    Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    usePayrollRuns,
    usePayrollRun,
    usePayrollEntries,
} from "@/features/company-admin/api/use-payroll-run-queries";
import {
    useCreatePayrollRun,
    useLockAttendance,
    useReviewExceptions,
    useComputeSalaries,
    useComputeStatutory,
    useApproveRun,
    useDisburseRun,
    useOverridePayrollEntry,
} from "@/features/company-admin/api/use-payroll-run-mutations";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Helpers ── */

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

const formatCurrency = (v: number) => `\u20B9${(v ?? 0).toLocaleString("en-IN")}`;

const STEP_LABELS = [
    "Lock Attendance",
    "Review Exceptions",
    "Compute Salaries",
    "Statutory",
    "Approve",
    "Disburse",
];

const STEP_ICONS = [Lock, AlertTriangle, Calculator, Building2, CheckCircle2, Banknote];

const STATUS_STEP_MAP: Record<string, number> = {
    draft: 0,
    attendance_locked: 1,
    exceptions_reviewed: 2,
    computed: 3,
    statutory_done: 4,
    approved: 5,
    disbursed: 6,
    archived: 6,
};

const STATUS_LABELS: Record<string, string> = {
    draft: "Draft",
    attendance_locked: "Attendance Locked",
    exceptions_reviewed: "Exceptions Reviewed",
    computed: "Computed",
    statutory_done: "Statutory Done",
    approved: "Approved",
    disbursed: "Disbursed",
    archived: "Archived",
};

function RunStatusBadge({ status }: { status: string }) {
    const s = status?.toLowerCase();
    const colorMap: Record<string, string> = {
        draft: "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700",
        attendance_locked: "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50",
        exceptions_reviewed: "bg-info-50 text-info-700 border-info-200 dark:bg-info-900/20 dark:text-info-400 dark:border-info-800/50",
        computed: "bg-accent-50 text-accent-700 border-accent-200 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50",
        statutory_done: "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50",
        approved: "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50",
        disbursed: "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50",
        archived: "bg-neutral-200 text-neutral-700 border-neutral-300 dark:bg-neutral-700 dark:text-neutral-300 dark:border-neutral-600",
    };
    const cls = colorMap[s] ?? colorMap.draft;
    return (
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize whitespace-nowrap", cls)}>
            {STATUS_LABELS[s] || status?.replace(/_/g, " ") || "Draft"}
        </span>
    );
}

/* ── Stepper ── */

function StepperBar({ currentStep, completedStep }: { currentStep: number; completedStep: number }) {
    return (
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {STEP_LABELS.map((label, i) => {
                const Icon = STEP_ICONS[i];
                const isCompleted = i < completedStep;
                const isCurrent = i === currentStep;
                return (
                    <div key={i} className="flex items-center gap-1">
                        <div
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                                isCompleted
                                    ? "bg-success-50 text-success-700 dark:bg-success-900/20 dark:text-success-400"
                                    : isCurrent
                                    ? "bg-primary-50 text-primary-700 border border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50"
                                    : "bg-neutral-50 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500"
                            )}
                        >
                            {isCompleted ? <Check size={14} /> : <Icon size={14} />}
                            {label}
                        </div>
                        {i < STEP_LABELS.length - 1 && (
                            <ChevronRight size={14} className={cn("text-neutral-300 dark:text-neutral-600 flex-shrink-0", isCompleted && "text-success-400")} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

/* ── Confirm Modal ── */

function ConfirmDialog({
    open,
    title,
    message,
    confirmLabel,
    loading,
    onConfirm,
    onCancel,
    variant = "primary",
}: {
    open: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    loading: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    variant?: "primary" | "danger" | "success";
}) {
    if (!open) return null;
    const btnCls =
        variant === "danger"
            ? "bg-danger-600 hover:bg-danger-700"
            : variant === "success"
            ? "bg-success-600 hover:bg-success-700"
            : "bg-primary-600 hover:bg-primary-700";
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200">
                <h2 className="text-lg font-bold text-primary-950 dark:text-white mb-2">{title}</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">{message}</p>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                        Cancel
                    </button>
                    <button onClick={onConfirm} disabled={loading} className={cn("flex-1 py-3 rounded-xl text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2", btnCls)}>
                        {loading && <Loader2 size={14} className="animate-spin" />}
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── Screen ── */

export function PayrollRunScreen() {
    const fmt = useCompanyFormatter();
    const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
    const [wizardStep, setWizardStep] = useState(0);
    const [newRunModal, setNewRunModal] = useState(false);
    const [newMonth, setNewMonth] = useState(new Date().getMonth() + 1);
    const [newYear, setNewYear] = useState(new Date().getFullYear());
    const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; label: string; action: () => Promise<void>; variant?: "primary" | "danger" | "success" } | null>(null);
    const [search, setSearch] = useState("");

    const runsQuery = usePayrollRuns();
    const runDetailQuery = usePayrollRun(selectedRunId ?? "");
    const entriesQuery = usePayrollEntries(selectedRunId ?? "");

    const createMutation = useCreatePayrollRun();
    const lockMutation = useLockAttendance();
    const reviewMutation = useReviewExceptions();
    const computeMutation = useComputeSalaries();
    const statutoryMutation = useComputeStatutory();
    const approveMutation = useApproveRun();
    const disburseMutation = useDisburseRun();
    const overrideMutation = useOverridePayrollEntry();

    const runs: any[] = runsQuery.data?.data ?? [];
    const runDetail: any = runDetailQuery.data?.data ?? null;
    const entries: any[] = entriesQuery.data?.data ?? [];
    const exceptions = entries.filter((e: any) => e.isException);

    const completedStep = STATUS_STEP_MAP[runDetail?.status?.toLowerCase()] ?? 0;

    const filteredRuns = runs.filter((r: any) => {
        if (!search) return true;
        const q = search.toLowerCase();
        const label = `${MONTHS[(r.month ?? 1) - 1]} ${r.year}`.toLowerCase();
        return label.includes(q) || r.status?.toLowerCase().includes(q);
    });

    const handleCreateRun = async () => {
        try {
            const result = await createMutation.mutateAsync({ month: newMonth, year: newYear });
            showSuccess("Payroll Run Created", `Run for ${MONTHS[newMonth - 1]} ${newYear} created.`);
            setNewRunModal(false);
            if (result?.data?.id) {
                setSelectedRunId(result.data.id);
                setWizardStep(0);
            }
        } catch (err) {
            showApiError(err);
        }
    };

    const selectRun = (run: any) => {
        setSelectedRunId(run.id);
        const step = STATUS_STEP_MAP[run.status?.toLowerCase()] ?? 0;
        setWizardStep(Math.min(step, 5));
    };

    const handleStepAction = (step: number) => {
        if (!selectedRunId) return;
        const configs: Record<number, { title: string; message: string; label: string; action: () => Promise<void>; variant?: "primary" | "danger" | "success" }> = {
            0: {
                title: "Lock Attendance",
                message: "This will lock attendance data for this payroll period. No further attendance changes will be allowed.",
                label: "Lock Attendance",
                action: async () => { await lockMutation.mutateAsync(selectedRunId); showSuccess("Attendance Locked", "Attendance has been locked for this payroll run."); setWizardStep(1); },
            },
            1: {
                title: "Mark Exceptions Reviewed",
                message: `${exceptions.length} exception(s) found. Confirm that all exceptions have been reviewed.`,
                label: "Mark Reviewed",
                action: async () => { await reviewMutation.mutateAsync(selectedRunId); showSuccess("Exceptions Reviewed", "All exceptions have been marked as reviewed."); setWizardStep(2); },
            },
            2: {
                title: "Compute Salaries",
                message: "This will compute gross, deductions, and net pay for all employees in this payroll run.",
                label: "Compute",
                action: async () => { await computeMutation.mutateAsync(selectedRunId); showSuccess("Salaries Computed", "Salary computation completed successfully."); setWizardStep(3); },
            },
            3: {
                title: "Compute Statutory Deductions",
                message: "This will calculate PF, ESI, PT, TDS, and LWF for all employees.",
                label: "Compute Statutory",
                action: async () => { await statutoryMutation.mutateAsync(selectedRunId); showSuccess("Statutory Computed", "Statutory deductions calculated successfully."); setWizardStep(4); },
            },
            4: {
                title: "Approve Payroll Run",
                message: "This will approve the payroll run. Please verify all amounts before proceeding.",
                label: "Approve",
                variant: "success",
                action: async () => { await approveMutation.mutateAsync(selectedRunId); showSuccess("Payroll Approved", "Payroll run has been approved."); setWizardStep(5); },
            },
            5: {
                title: "Disburse & Generate Payslips",
                message: "This will mark salaries as disbursed and generate payslips for all employees. This action cannot be undone.",
                label: "Disburse & Generate",
                variant: "success",
                action: async () => { await disburseMutation.mutateAsync(selectedRunId); showSuccess("Payroll Disbursed", "Salaries disbursed and payslips generated."); },
            },
        };
        setConfirmAction(configs[step]);
    };

    const handleConfirm = async () => {
        if (!confirmAction) return;
        try {
            await confirmAction.action();
            setConfirmAction(null);
        } catch (err) {
            showApiError(err);
        }
    };

    const anyMutating = lockMutation.isPending || reviewMutation.isPending || computeMutation.isPending || statutoryMutation.isPending || approveMutation.isPending || disburseMutation.isPending;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Payroll Runs</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Process payroll through a 6-step guided wizard</p>
                </div>
                <button
                    onClick={() => setNewRunModal(true)}
                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
                >
                    <Plus className="w-5 h-5" />
                    New Payroll Run
                </button>
            </div>

            {/* Two-panel layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Run List */}
                <div className="lg:col-span-4 xl:col-span-3 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Search runs..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                        />
                    </div>
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm overflow-hidden">
                        {runsQuery.isLoading ? (
                            <div className="p-4 space-y-3">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="h-16 bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : filteredRuns.length === 0 ? (
                            <div className="p-6 text-center">
                                <p className="text-sm text-neutral-400">No payroll runs found</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-neutral-100 dark:divide-neutral-800 max-h-[calc(100vh-300px)] overflow-y-auto">
                                {filteredRuns.map((run: any) => (
                                    <button
                                        key={run.id}
                                        onClick={() => selectRun(run)}
                                        className={cn(
                                            "w-full text-left px-4 py-3.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors",
                                            selectedRunId === run.id && "bg-primary-50/50 dark:bg-primary-900/10 border-l-2 border-primary-500"
                                        )}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-bold text-sm text-primary-950 dark:text-white">
                                                {MONTHS[(run.month ?? 1) - 1]} {run.year}
                                            </span>
                                            <RunStatusBadge status={run.status ?? "draft"} />
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                                            <span>{run.employeeCount ?? 0} employees</span>
                                            <span className="font-mono">{formatCurrency(run.totalNetPay ?? 0)}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Wizard Panel */}
                <div className="lg:col-span-8 xl:col-span-9">
                    {!selectedRunId ? (
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                            <EmptyState icon="list" title="Select a payroll run" message="Choose a payroll run from the list or create a new one to get started." />
                        </div>
                    ) : runDetailQuery.isLoading ? (
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                            <SkeletonTable rows={6} cols={4} />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Run Header */}
                            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-primary-950 dark:text-white">
                                            {MONTHS[(runDetail?.month ?? 1) - 1]} {runDetail?.year} Payroll
                                        </h2>
                                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                            {runDetail?.employeeCount ?? 0} employees &middot; Created {runDetail?.createdAt ? fmt.date(runDetail.createdAt) : ""}
                                        </p>
                                    </div>
                                    <RunStatusBadge status={runDetail?.status ?? "draft"} />
                                </div>
                                <StepperBar currentStep={wizardStep} completedStep={completedStep} />
                            </div>

                            {/* Step Content */}
                            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-6">
                                {/* Step 0: Lock Attendance */}
                                {wizardStep === 0 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                                                <Lock size={20} className="text-primary-600 dark:text-primary-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-primary-950 dark:text-white">Step 1: Lock Attendance</h3>
                                                <p className="text-xs text-neutral-500 dark:text-neutral-400">Review attendance summary and lock for payroll processing</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {[
                                                { label: "Total Employees", value: runDetail?.employeeCount ?? 0 },
                                                { label: "Present Days (Avg)", value: runDetail?.avgPresentDays ?? 0 },
                                                { label: "Leave Days (Avg)", value: runDetail?.avgLeaveDays ?? 0 },
                                                { label: "Exceptions", value: runDetail?.exceptionCount ?? 0 },
                                            ].map((item) => (
                                                <div key={item.label} className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 bg-neutral-50/50 dark:bg-neutral-800/30">
                                                    <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{item.label}</span>
                                                    <p className="text-2xl font-extrabold text-primary-950 dark:text-white mt-1">{item.value}</p>
                                                </div>
                                            ))}
                                        </div>
                                        {completedStep === 0 && (
                                            <button onClick={() => handleStepAction(0)} disabled={anyMutating} className="mt-4 inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50">
                                                <Lock size={16} />
                                                Lock Attendance
                                            </button>
                                        )}
                                        {completedStep > 0 && (
                                            <div className="flex items-center gap-2 mt-4 text-success-600 dark:text-success-400">
                                                <Check size={16} />
                                                <span className="text-sm font-bold">Attendance locked</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Step 1: Review Exceptions */}
                                {wizardStep === 1 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-xl bg-warning-50 dark:bg-warning-900/20 flex items-center justify-center">
                                                <AlertTriangle size={20} className="text-warning-600 dark:text-warning-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-primary-950 dark:text-white">Step 2: Review Exceptions</h3>
                                                <p className="text-xs text-neutral-500 dark:text-neutral-400">Review and resolve attendance exceptions before computing salaries</p>
                                            </div>
                                        </div>
                                        {entriesQuery.isLoading ? (
                                            <SkeletonTable rows={5} cols={5} />
                                        ) : exceptions.length === 0 ? (
                                            <div className="bg-success-50/50 dark:bg-success-900/10 rounded-xl p-6 border border-success-100 dark:border-success-800/50 text-center">
                                                <Check size={24} className="text-success-600 dark:text-success-400 mx-auto mb-2" />
                                                <p className="font-bold text-success-700 dark:text-success-400">No exceptions found</p>
                                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">All attendance records are clean</p>
                                            </div>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left border-collapse min-w-[700px]">
                                                    <thead>
                                                        <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                                            <th className="py-3 px-4 font-bold">Employee</th>
                                                            <th className="py-3 px-4 font-bold">Exception</th>
                                                            <th className="py-3 px-4 font-bold">Days Affected</th>
                                                            <th className="py-3 px-4 font-bold text-center">Status</th>
                                                            <th className="py-3 px-4 font-bold text-right">Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="text-sm">
                                                        {exceptions.map((exc: any) => (
                                                            <tr key={exc.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                                                <td className="py-3 px-4 font-bold text-primary-950 dark:text-white">{exc.employeeName ?? exc.employeeId}</td>
                                                                <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400">{exc.exceptionType ?? "Mismatch"}</td>
                                                                <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400">{exc.daysAffected ?? 1}</td>
                                                                <td className="py-3 px-4 text-center">
                                                                    <span className={cn(
                                                                        "text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize",
                                                                        exc.resolved
                                                                            ? "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50"
                                                                            : "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50"
                                                                    )}>
                                                                        {exc.resolved ? "Resolved" : "Pending"}
                                                                    </span>
                                                                </td>
                                                                <td className="py-3 px-4 text-right">
                                                                    <button
                                                                        onClick={async () => {
                                                                            try {
                                                                                await overrideMutation.mutateAsync({ runId: selectedRunId!, entryId: exc.id, data: { action: "accept" } });
                                                                                showSuccess("Exception Resolved", "Exception has been accepted.");
                                                                            } catch (err) { showApiError(err); }
                                                                        }}
                                                                        disabled={exc.resolved || overrideMutation.isPending}
                                                                        className="px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400 text-xs font-bold hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors disabled:opacity-50"
                                                                    >
                                                                        Accept
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                        {completedStep === 1 && (
                                            <button onClick={() => handleStepAction(1)} disabled={anyMutating} className="mt-4 inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50">
                                                <CheckCircle2 size={16} />
                                                Mark All Reviewed
                                            </button>
                                        )}
                                        {completedStep > 1 && (
                                            <div className="flex items-center gap-2 mt-4 text-success-600 dark:text-success-400">
                                                <Check size={16} />
                                                <span className="text-sm font-bold">Exceptions reviewed</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Step 2: Compute Salaries */}
                                {wizardStep === 2 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-xl bg-accent-50 dark:bg-accent-900/20 flex items-center justify-center">
                                                <Calculator size={20} className="text-accent-600 dark:text-accent-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-primary-950 dark:text-white">Step 3: Compute Salaries</h3>
                                                <p className="text-xs text-neutral-500 dark:text-neutral-400">Calculate gross pay, deductions, and net pay for all employees</p>
                                            </div>
                                        </div>
                                        {completedStep >= 3 && (
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                {[
                                                    { label: "Total Gross", value: formatCurrency(runDetail?.totalGross ?? 0) },
                                                    { label: "Total Deductions", value: formatCurrency(runDetail?.totalDeductions ?? 0) },
                                                    { label: "Total Net Pay", value: formatCurrency(runDetail?.totalNetPay ?? 0) },
                                                    { label: "Variance", value: `${runDetail?.variancePercent ?? 0}%` },
                                                ].map((item) => (
                                                    <div key={item.label} className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 bg-neutral-50/50 dark:bg-neutral-800/30">
                                                        <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{item.label}</span>
                                                        <p className="text-xl font-extrabold text-primary-950 dark:text-white mt-1 font-mono">{item.value}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {runDetail?.variancePercent > 10 && completedStep >= 3 && (
                                            <div className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800/50 rounded-xl p-4 flex items-start gap-3">
                                                <AlertTriangle size={18} className="text-warning-600 dark:text-warning-400 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <p className="text-sm font-bold text-warning-700 dark:text-warning-400">High Variance Warning</p>
                                                    <p className="text-xs text-warning-600 dark:text-warning-400/80 mt-0.5">Payroll variance exceeds 10% compared to last month. Please review before proceeding.</p>
                                                </div>
                                            </div>
                                        )}
                                        {completedStep === 2 && (
                                            <button onClick={() => handleStepAction(2)} disabled={anyMutating} className="mt-4 inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50">
                                                {computeMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Calculator size={16} />}
                                                Compute Salaries
                                            </button>
                                        )}
                                        {completedStep > 2 && (
                                            <div className="flex items-center gap-2 mt-4 text-success-600 dark:text-success-400">
                                                <Check size={16} />
                                                <span className="text-sm font-bold">Salaries computed</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Step 3: Statutory */}
                                {wizardStep === 3 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-xl bg-info-50 dark:bg-info-900/20 flex items-center justify-center">
                                                <Building2 size={20} className="text-info-600 dark:text-info-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-primary-950 dark:text-white">Step 4: Statutory Deductions</h3>
                                                <p className="text-xs text-neutral-500 dark:text-neutral-400">Calculate PF, ESI, PT, TDS, and LWF contributions</p>
                                            </div>
                                        </div>
                                        {completedStep >= 4 && (
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                                {[
                                                    { label: "PF", value: runDetail?.statutory?.pf ?? 0 },
                                                    { label: "ESI", value: runDetail?.statutory?.esi ?? 0 },
                                                    { label: "PT", value: runDetail?.statutory?.pt ?? 0 },
                                                    { label: "TDS", value: runDetail?.statutory?.tds ?? 0 },
                                                    { label: "LWF", value: runDetail?.statutory?.lwf ?? 0 },
                                                ].map((item) => (
                                                    <div key={item.label} className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 bg-neutral-50/50 dark:bg-neutral-800/30 text-center">
                                                        <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{item.label}</span>
                                                        <p className="text-lg font-extrabold text-primary-950 dark:text-white mt-1 font-mono">{formatCurrency(item.value)}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {completedStep === 3 && (
                                            <button onClick={() => handleStepAction(3)} disabled={anyMutating} className="mt-4 inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50">
                                                {statutoryMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Building2 size={16} />}
                                                Compute Statutory
                                            </button>
                                        )}
                                        {completedStep > 3 && (
                                            <div className="flex items-center gap-2 mt-4 text-success-600 dark:text-success-400">
                                                <Check size={16} />
                                                <span className="text-sm font-bold">Statutory deductions computed</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Step 4: Approve */}
                                {wizardStep === 4 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-xl bg-success-50 dark:bg-success-900/20 flex items-center justify-center">
                                                <CheckCircle2 size={20} className="text-success-600 dark:text-success-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-primary-950 dark:text-white">Step 5: Approve Payroll</h3>
                                                <p className="text-xs text-neutral-500 dark:text-neutral-400">Review final summary and approve the payroll run</p>
                                            </div>
                                        </div>
                                        <div className="bg-neutral-50 dark:bg-neutral-800/30 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
                                            <h4 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">Final Summary</h4>
                                            <div className="space-y-2.5">
                                                {[
                                                    { label: "Employees", value: String(runDetail?.employeeCount ?? 0) },
                                                    { label: "Total Gross Pay", value: formatCurrency(runDetail?.totalGross ?? 0) },
                                                    { label: "Total Deductions", value: formatCurrency(runDetail?.totalDeductions ?? 0) },
                                                    { label: "Total Statutory", value: formatCurrency((runDetail?.statutory?.pf ?? 0) + (runDetail?.statutory?.esi ?? 0) + (runDetail?.statutory?.pt ?? 0) + (runDetail?.statutory?.tds ?? 0) + (runDetail?.statutory?.lwf ?? 0)) },
                                                    { label: "Total Net Pay", value: formatCurrency(runDetail?.totalNetPay ?? 0) },
                                                ].map((item) => (
                                                    <div key={item.label} className="flex items-center justify-between py-1.5">
                                                        <span className="text-sm text-neutral-600 dark:text-neutral-400">{item.label}</span>
                                                        <span className="text-sm font-bold font-mono text-primary-950 dark:text-white">{item.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        {completedStep === 4 && (
                                            <button onClick={() => handleStepAction(4)} disabled={anyMutating} className="mt-4 inline-flex items-center gap-2 bg-success-600 hover:bg-success-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50">
                                                <CheckCircle2 size={16} />
                                                Approve Payroll Run
                                            </button>
                                        )}
                                        {completedStep > 4 && (
                                            <div className="flex items-center gap-2 mt-4 text-success-600 dark:text-success-400">
                                                <Check size={16} />
                                                <span className="text-sm font-bold">Payroll approved</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Step 5: Disburse */}
                                {wizardStep === 5 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-xl bg-success-50 dark:bg-success-900/20 flex items-center justify-center">
                                                <Banknote size={20} className="text-success-600 dark:text-success-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-primary-950 dark:text-white">Step 6: Disburse & Generate Payslips</h3>
                                                <p className="text-xs text-neutral-500 dark:text-neutral-400">Disburse salaries and generate employee payslips</p>
                                            </div>
                                        </div>
                                        <div className="bg-success-50/50 dark:bg-success-900/10 rounded-xl border border-success-100 dark:border-success-800/50 p-5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-bold text-success-700 dark:text-success-400">Total Disbursement Amount</span>
                                                <span className="text-2xl font-extrabold font-mono text-success-700 dark:text-success-400">{formatCurrency(runDetail?.totalNetPay ?? 0)}</span>
                                            </div>
                                        </div>
                                        {completedStep === 5 && (
                                            <button onClick={() => handleStepAction(5)} disabled={anyMutating} className="mt-4 inline-flex items-center gap-2 bg-success-600 hover:bg-success-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50">
                                                <Banknote size={16} />
                                                Disburse & Generate Payslips
                                            </button>
                                        )}
                                        {completedStep > 5 && (
                                            <div className="flex items-center gap-2 mt-4 text-success-600 dark:text-success-400">
                                                <Check size={16} />
                                                <span className="text-sm font-bold">Payroll disbursed and payslips generated</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Step Navigation */}
                                <div className="flex items-center justify-between mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                                    <button
                                        onClick={() => setWizardStep(Math.max(0, wizardStep - 1))}
                                        disabled={wizardStep === 0}
                                        className="px-4 py-2 rounded-xl text-sm font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-30"
                                    >
                                        Previous
                                    </button>
                                    <div className="flex items-center gap-1">
                                        {STEP_LABELS.map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => { if (i <= completedStep) setWizardStep(i); }}
                                                className={cn(
                                                    "w-2 h-2 rounded-full transition-all",
                                                    i === wizardStep ? "w-6 bg-primary-600" : i < completedStep ? "bg-success-400" : "bg-neutral-300 dark:bg-neutral-600"
                                                )}
                                            />
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => setWizardStep(Math.min(5, wizardStep + 1))}
                                        disabled={wizardStep >= completedStep || wizardStep === 5}
                                        className="px-4 py-2 rounded-xl text-sm font-bold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors disabled:opacity-30"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── New Run Modal ── */}
            {newRunModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">New Payroll Run</h2>
                            <button onClick={() => setNewRunModal(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Month</label>
                                <select
                                    value={newMonth}
                                    onChange={(e) => setNewMonth(Number(e.target.value))}
                                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                                >
                                    {MONTHS.map((m, i) => (
                                        <option key={i} value={i + 1}>{m}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Year</label>
                                <input
                                    type="number"
                                    value={newYear}
                                    onChange={(e) => setNewYear(Number(e.target.value))}
                                    min={2020}
                                    max={2040}
                                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setNewRunModal(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleCreateRun} disabled={createMutation.isPending} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {createMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                Create Run
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Confirm Dialog ── */}
            <ConfirmDialog
                open={!!confirmAction}
                title={confirmAction?.title ?? ""}
                message={confirmAction?.message ?? ""}
                confirmLabel={confirmAction?.label ?? "Confirm"}
                loading={anyMutating}
                onConfirm={handleConfirm}
                onCancel={() => setConfirmAction(null)}
                variant={confirmAction?.variant}
            />
        </div>
    );
}
