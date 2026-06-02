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
    Trash2,
    ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    usePayrollRuns,
    usePayrollRun,
} from "@/features/company-admin/api/use-payroll-run-queries";
import {
    useCreatePayrollRun,
    useDeletePayrollRun,
    useLockAttendance,
    useReviewExceptions,
    useComputeSalaries,
    useComputeStatutory,
    useApproveRun,
    useDisburseRun,
} from "@/features/company-admin/api/use-payroll-run-mutations";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";
import { Step1AttendanceValidation } from "@/features/company-admin/hr/Step1AttendanceValidation";
import { Step2PayrollExceptions } from "@/features/company-admin/hr/Step2PayrollExceptions";
import { Step3PayrollComputation } from "@/features/company-admin/hr/Step3PayrollComputation";
import { Step4StatutoryCompliance } from "@/features/company-admin/hr/Step4StatutoryCompliance";
import { Step5PayrollApproval } from "@/features/company-admin/hr/Step5PayrollApproval";
import { Step6Disbursement } from "@/features/company-admin/hr/Step6Disbursement";
import { Step7PostPayroll } from "@/features/company-admin/hr/Step7PostPayroll";

/* ── Helpers ── */

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

const formatCurrency = (v: unknown) => `₹${(Number(v) || 0).toLocaleString("en-IN")}`;

const STEP_LABELS = [
    "Lock Attendance",
    "Review Exceptions",
    "Compute Salaries",
    "Statutory",
    "Approve",
    "Disburse",
    "Post-Payroll",
];

const STEP_ICONS = [Lock, AlertTriangle, Calculator, Building2, CheckCircle2, Banknote, ClipboardList];

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

    const createMutation = useCreatePayrollRun();
    const deleteMutation = useDeletePayrollRun();
    const lockMutation = useLockAttendance();
    const reviewMutation = useReviewExceptions();
    const computeMutation = useComputeSalaries();
    const statutoryMutation = useComputeStatutory();
    const approveMutation = useApproveRun();
    const disburseMutation = useDisburseRun();

    const runs: any[] = runsQuery.data?.data ?? [];
    const runDetail: any = runDetailQuery.data?.data ?? null;

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
        setWizardStep(Math.min(step, 6));
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
                message: `Confirm that all exceptions have been reviewed before proceeding.`,
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

    const handleDeleteRun = () => {
        if (!selectedRunId || !runDetail) return;
        const periodLabel = `${MONTHS[(runDetail.month ?? 1) - 1]} ${runDetail.year}`;
        setConfirmAction({
            title: "Delete Payroll Run",
            message: `Delete the payroll run for ${periodLabel}? This action cannot be undone.`,
            label: "Delete Run",
            variant: "danger",
            action: async () => {
                await deleteMutation.mutateAsync(selectedRunId);
                showSuccess("Deleted", "Payroll run deleted successfully.");
                setSelectedRunId(null);
            },
        });
    };

    const anyMutating =
        lockMutation.isPending ||
        reviewMutation.isPending ||
        computeMutation.isPending ||
        statutoryMutation.isPending ||
        approveMutation.isPending ||
        disburseMutation.isPending ||
        deleteMutation.isPending;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Payroll Runs</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Process payroll through a 7-step guided wizard</p>
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
                                            <span className="font-mono">{formatCurrency(run.totalNet ?? run.totalNetPay ?? 0)}</span>
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
                                    <div className="flex items-center gap-3">
                                        <RunStatusBadge status={runDetail?.status ?? "draft"} />
                                        {runDetail?.status && !["disbursed", "archived"].includes(runDetail.status.toLowerCase()) && (
                                            <button
                                                onClick={handleDeleteRun}
                                                disabled={deleteMutation.isPending}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-danger-600 dark:text-danger-400 bg-danger-50 dark:bg-danger-900/20 hover:bg-danger-100 dark:hover:bg-danger-900/40 border border-danger-200 dark:border-danger-800 transition-colors disabled:opacity-50"
                                            >
                                                {deleteMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                                Delete Run
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <StepperBar currentStep={wizardStep} completedStep={completedStep} />
                            </div>

                            {/* Step Content */}
                            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-6">
                                {wizardStep === 0 && <Step1AttendanceValidation runId={selectedRunId!} runDetail={runDetail} completedStep={completedStep} onStepAction={() => handleStepAction(0)} anyMutating={anyMutating} />}
                                {wizardStep === 1 && <Step2PayrollExceptions runId={selectedRunId!} runDetail={runDetail} completedStep={completedStep} onStepAction={() => handleStepAction(1)} anyMutating={anyMutating} />}
                                {wizardStep === 2 && <Step3PayrollComputation runId={selectedRunId!} runDetail={runDetail} completedStep={completedStep} onStepAction={() => handleStepAction(2)} anyMutating={anyMutating} />}
                                {wizardStep === 3 && <Step4StatutoryCompliance runId={selectedRunId!} runDetail={runDetail} completedStep={completedStep} onStepAction={() => handleStepAction(3)} anyMutating={anyMutating} />}
                                {wizardStep === 4 && <Step5PayrollApproval runId={selectedRunId!} runDetail={runDetail} completedStep={completedStep} onStepAction={() => handleStepAction(4)} anyMutating={anyMutating} />}
                                {wizardStep === 5 && <Step6Disbursement runId={selectedRunId!} runDetail={runDetail} completedStep={completedStep} onStepAction={() => handleStepAction(5)} anyMutating={anyMutating} />}
                                {wizardStep === 6 && <Step7PostPayroll runId={selectedRunId!} runDetail={runDetail} completedStep={completedStep} onStepAction={() => {}} anyMutating={false} />}

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
                                        onClick={() => setWizardStep(Math.min(6, wizardStep + 1))}
                                        disabled={wizardStep >= completedStep || wizardStep === 6}
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
