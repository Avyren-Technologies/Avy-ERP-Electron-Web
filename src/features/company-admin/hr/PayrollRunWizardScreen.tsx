import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import {
    Loader2,
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
    ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePayrollRun } from "@/features/company-admin/api/use-payroll-run-queries";
import {
    useDeletePayrollRun,
    useLockAttendance,
    useReviewExceptions,
    useComputeSalaries,
    useComputeStatutory,
    useApproveRun,
    useDisburseRun,
} from "@/features/company-admin/api/use-payroll-run-mutations";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { showSuccess, showApiError } from "@/lib/toast";
import { Step1AttendanceValidation } from "@/features/company-admin/hr/Step1AttendanceValidation";
import { Step2PayrollExceptions } from "@/features/company-admin/hr/Step2PayrollExceptions";
import { Step3PayrollComputation } from "@/features/company-admin/hr/Step3PayrollComputation";
import { Step4StatutoryCompliance } from "@/features/company-admin/hr/Step4StatutoryCompliance";
import { Step5PayrollApproval } from "@/features/company-admin/hr/Step5PayrollApproval";
import { Step6Disbursement } from "@/features/company-admin/hr/Step6Disbursement";
import { Step7PostPayroll } from "@/features/company-admin/hr/Step7PostPayroll";

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const STEP_LABELS = ['Lock Attendance', 'Review Exceptions', 'Compute Salaries', 'Statutory', 'Approve', 'Disburse', 'Post-Payroll'];
const STEP_DESCRIPTIONS = ['Freeze attendance data', 'Inspect & resolve issues', 'Preview, compute & lock', 'PF, ESI, PT, TDS & filings', 'Manager / Finance approval', 'Disburse, archive & lock', 'Reports & exports'];
const STEP_ICONS = [Lock, AlertTriangle, Calculator, Building2, CheckCircle2, Banknote, ClipboardList];

const STATUS_STEP_MAP: Record<string, number> = {
    draft: 0, attendance_locked: 1, exceptions_reviewed: 2, computed: 3,
    statutory_done: 4, approved: 5, disbursed: 6, archived: 6,
};

const STATUS_LABELS: Record<string, string> = {
    draft: 'Draft', attendance_locked: 'Attendance Locked', exceptions_reviewed: 'Exceptions Reviewed',
    computed: 'Computed', statutory_done: 'Statutory Done', approved: 'Approved',
    disbursed: 'Disbursed', archived: 'Archived',
};

function RunStatusBadge({ status }: { status: string }) {
    const s = status?.toLowerCase();
    const colorMap: Record<string, string> = {
        draft: 'bg-neutral-100 text-neutral-600 border-neutral-200',
        attendance_locked: 'bg-primary-50 text-primary-700 border-primary-200',
        exceptions_reviewed: 'bg-info-50 text-info-700 border-info-200',
        computed: 'bg-accent-50 text-accent-700 border-accent-200',
        statutory_done: 'bg-warning-50 text-warning-700 border-warning-200',
        approved: 'bg-success-50 text-success-700 border-success-200',
        disbursed: 'bg-success-50 text-success-700 border-success-200',
        archived: 'bg-neutral-200 text-neutral-700 border-neutral-300',
    };
    return (
        <span className={cn('text-[11px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap', colorMap[s] ?? colorMap.draft)}>
            {STATUS_LABELS[s] || status?.replace(/_/g, ' ') || 'Draft'}
        </span>
    );
}

function StepperBar({ currentStep, completedStep, onJump }: { currentStep: number; completedStep: number; onJump: (i: number) => void }) {
    const phaseSteps = STEP_LABELS.slice(0, 6);
    return (
        <div className="rounded-2xl bg-white ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-3 overflow-x-auto">
            <div className="flex items-stretch gap-2 min-w-fit">
                {phaseSteps.map((label, i) => {
                    const Icon = STEP_ICONS[i]!;
                    const isCompleted = i < completedStep;
                    const isCurrent = i === currentStep;
                    const isClickable = i <= completedStep || i === currentStep;
                    return (
                        <div key={i} className="flex items-center gap-2">
                            <button
                                onClick={() => isClickable && onJump(i)}
                                disabled={!isClickable}
                                className={cn(
                                    'flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all min-w-[180px] text-left',
                                    isCurrent ? 'bg-primary-50 ring-2 ring-primary-300'
                                        : isCompleted ? 'bg-success-50/60 hover:bg-success-50'
                                        : 'bg-neutral-50',
                                    !isClickable && 'opacity-60 cursor-not-allowed',
                                )}
                            >
                                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                                    isCurrent ? 'bg-primary-600 text-white'
                                        : isCompleted ? 'bg-success-600 text-white'
                                        : 'bg-neutral-200 text-neutral-500')}>
                                    {isCompleted ? <Check size={18} /> : <Icon size={18} />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <span className={cn('text-[11px] font-bold',
                                            isCurrent ? 'text-primary-700' : isCompleted ? 'text-success-700' : 'text-neutral-500')}>{i + 1}</span>
                                        <span className={cn('text-[13px] font-bold whitespace-nowrap',
                                            isCurrent ? 'text-primary-900' : isCompleted ? 'text-success-800' : 'text-neutral-700')}>{label}</span>
                                    </div>
                                    <div className="text-[11px] text-neutral-500 mt-0.5 whitespace-nowrap">{STEP_DESCRIPTIONS[i]}</div>
                                </div>
                            </button>
                            {i < phaseSteps.length - 1 && (
                                <svg width="20" height="6" viewBox="0 0 20 6" className={isCompleted ? 'text-success-300' : 'text-neutral-300'}>
                                    <line x1="0" y1="3" x2="20" y2="3" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" strokeLinecap="round" />
                                </svg>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export function PayrollRunWizardScreen() {
    const { runId } = useParams<{ runId: string }>();
    const navigate = useNavigate();
    const fmt = useCompanyFormatter();

    const [wizardStep, setWizardStep] = useState(0);
    const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; label: string; action: () => Promise<void>; variant?: 'primary' | 'danger' | 'success' } | null>(null);

    const runDetailQuery = usePayrollRun(runId ?? '');
    const runDetail: any = runDetailQuery.data?.data ?? null;

    const deleteMutation = useDeletePayrollRun();
    const lockMutation = useLockAttendance();
    const reviewMutation = useReviewExceptions();
    const computeMutation = useComputeSalaries();
    const statutoryMutation = useComputeStatutory();
    const approveMutation = useApproveRun();
    const disburseMutation = useDisburseRun();

    const completedStep = STATUS_STEP_MAP[runDetail?.status?.toLowerCase()] ?? 0;

    /* Sync wizardStep with run status on first load */
    useEffect(() => {
        if (runDetail) setWizardStep(Math.min(completedStep, 6));
    }, [runDetail?.status]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleStepAction = (step: number) => {
        if (!runId) return;
        const configs: Record<number, { title: string; message: string; label: string; action: () => Promise<void>; variant?: 'primary' | 'danger' | 'success' }> = {
            0: { title: 'Lock Attendance', message: 'This will lock attendance data for this payroll period.', label: 'Lock Attendance',
                action: async () => { await lockMutation.mutateAsync(runId); showSuccess('Attendance Locked', 'Attendance locked.'); setWizardStep(1); } },
            1: { title: 'Mark Exceptions Reviewed', message: 'Confirm that all exceptions have been reviewed.', label: 'Mark Reviewed',
                action: async () => { await reviewMutation.mutateAsync(runId); showSuccess('Exceptions Reviewed', 'All marked.'); setWizardStep(2); } },
            2: { title: 'Compute Salaries', message: 'Compute gross, deductions, and net pay.', label: 'Compute',
                action: async () => { await computeMutation.mutateAsync(runId); showSuccess('Salaries Computed', 'Done.'); setWizardStep(3); } },
            3: { title: 'Compute Statutory Deductions', message: 'Calculate PF, ESI, PT, TDS, LWF.', label: 'Compute Statutory',
                action: async () => { await statutoryMutation.mutateAsync(runId); showSuccess('Statutory Computed', 'Done.'); setWizardStep(4); } },
            4: { title: 'Approve Payroll Run', message: 'Approve payroll run. Verify amounts.', label: 'Approve', variant: 'success',
                action: async () => { await approveMutation.mutateAsync(runId); showSuccess('Payroll Approved', 'Approved.'); setWizardStep(5); } },
            5: { title: 'Disburse & Generate Payslips', message: 'Mark disbursed and generate payslips. This cannot be undone.', label: 'Disburse', variant: 'success',
                action: async () => { await disburseMutation.mutateAsync(runId); showSuccess('Disbursed', 'Salaries disbursed.'); } },
        };
        setConfirmAction(configs[step] ?? null);
    };

    const handleConfirm = async () => {
        if (!confirmAction) return;
        try { await confirmAction.action(); setConfirmAction(null); }
        catch (err) { showApiError(err); }
    };

    const handleDeleteRun = () => {
        if (!runId || !runDetail) return;
        const periodLabel = `${MONTHS[(runDetail.month ?? 1) - 1]} ${runDetail.year}`;
        setConfirmAction({
            title: 'Delete Payroll Run',
            message: `Delete the payroll run for ${periodLabel}? This action cannot be undone.`,
            label: 'Delete Run',
            variant: 'danger',
            action: async () => {
                await deleteMutation.mutateAsync(runId);
                showSuccess('Deleted', 'Payroll run deleted.');
                navigate('/app/company/hr/payroll-runs');
            },
        });
    };

    const anyMutating = lockMutation.isPending || reviewMutation.isPending || computeMutation.isPending ||
        statutoryMutation.isPending || approveMutation.isPending || disburseMutation.isPending || deleteMutation.isPending;

    if (runDetailQuery.isLoading || !runDetail) {
        return (
            <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto">
                <SkeletonTable rows={6} cols={4} />
            </div>
        );
    }

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto font-inter space-y-5">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-xs text-neutral-500">
                <Link to="/app/company/hr/payroll-runs" className="hover:text-neutral-800 transition">Payroll Runs</Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-neutral-800 font-medium">{MONTHS[(runDetail.month ?? 1) - 1]} {runDetail.year} Payroll Wizard</span>
            </nav>

            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <div className="flex items-center gap-3">
                        <Link to="/app/company/hr/payroll-runs" className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-500 hover:text-neutral-800">
                            <ArrowLeft className="w-3.5 h-3.5" /> Back to Payroll Runs
                        </Link>
                    </div>
                    <h1 className="mt-1 text-2xl sm:text-[28px] font-bold tracking-tight text-neutral-900">
                        {MONTHS[(runDetail.month ?? 1) - 1]} {runDetail.year} Payroll
                    </h1>
                    <div className="mt-1.5 flex items-center gap-2.5 text-sm text-neutral-500">
                        <span>{runDetail.employeeCount ?? 0} employees</span>
                        <span>·</span>
                        <span>Created {runDetail.createdAt ? fmt.date(runDetail.createdAt) : '—'}</span>
                        <RunStatusBadge status={runDetail.status ?? 'draft'} />
                    </div>
                </div>
                {runDetail.status && !['disbursed', 'archived'].includes(runDetail.status.toLowerCase()) && (
                    <button
                        onClick={handleDeleteRun}
                        disabled={deleteMutation.isPending}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-danger-200 bg-white px-3 py-2 text-sm font-semibold text-danger-700 hover:bg-danger-50 disabled:opacity-50"
                    >
                        {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        Delete Run
                    </button>
                )}
            </div>

            {/* Stepper */}
            <StepperBar currentStep={wizardStep} completedStep={completedStep} onJump={setWizardStep} />

            {/* Step content (full-screen) */}
            <div>
                {wizardStep === 0 && <Step1AttendanceValidation runId={runId!} runDetail={runDetail} completedStep={completedStep} onStepAction={() => handleStepAction(0)} anyMutating={anyMutating} />}
                {wizardStep === 1 && <Step2PayrollExceptions   runId={runId!} runDetail={runDetail} completedStep={completedStep} onStepAction={() => handleStepAction(1)} anyMutating={anyMutating} />}
                {wizardStep === 2 && <Step3PayrollComputation  runId={runId!} runDetail={runDetail} completedStep={completedStep} onStepAction={() => handleStepAction(2)} anyMutating={anyMutating} />}
                {wizardStep === 3 && <Step4StatutoryCompliance runId={runId!} runDetail={runDetail} completedStep={completedStep} onStepAction={() => handleStepAction(3)} anyMutating={anyMutating} />}
                {wizardStep === 4 && <Step5PayrollApproval     runId={runId!} runDetail={runDetail} completedStep={completedStep} onStepAction={() => handleStepAction(4)} anyMutating={anyMutating} />}
                {wizardStep === 5 && <Step6Disbursement        runId={runId!} runDetail={runDetail} completedStep={completedStep} onStepAction={() => handleStepAction(5)} anyMutating={anyMutating} />}
                {wizardStep === 6 && <Step7PostPayroll         runId={runId!} runDetail={runDetail} completedStep={completedStep} onStepAction={() => {}} anyMutating={false} />}
            </div>

            <ConfirmDialog
                open={!!confirmAction}
                title={confirmAction?.title ?? ''}
                message={confirmAction?.message ?? ''}
                confirmLabel={confirmAction?.label ?? 'Confirm'}
                cancelLabel="Cancel"
                loading={anyMutating}
                onConfirm={handleConfirm}
                onCancel={() => setConfirmAction(null)}
                variant={confirmAction?.variant}
            />
        </div>
    );
}

export default PayrollRunWizardScreen;
