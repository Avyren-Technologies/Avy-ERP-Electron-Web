import { Banknote, Check, Loader2, FileText } from "lucide-react";
import { useCompanyFormatter } from "@/hooks/useCompanyFormatter";

interface StepProps {
    runId: string;
    runDetail: any;
    completedStep: number;
    onStepAction: () => void;
    anyMutating: boolean;
}

const formatCurrency = (v: unknown) => `₹${(Number(v) || 0).toLocaleString("en-IN")}`;

export function Step6Disbursement({ runId, runDetail, completedStep, onStepAction, anyMutating }: StepProps) {
    const fmt = useCompanyFormatter();
    const isDisbursed = completedStep > 5;

    return (
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

            {!isDisbursed ? (
                <>
                    {/* Pre-disburse: confirmation with totals */}
                    <div className="bg-success-50/50 dark:bg-success-900/10 rounded-xl border border-success-100 dark:border-success-800/50 p-5">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-bold text-success-700 dark:text-success-400">Total Disbursement Amount</span>
                            <span className="text-2xl font-extrabold font-mono text-success-700 dark:text-success-400">{formatCurrency(runDetail?.totalNet ?? runDetail?.totalNetPay ?? 0)}</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {[
                                { label: "Employees", value: String(runDetail?.employeeCount ?? 0) },
                                { label: "Gross Pay", value: formatCurrency(runDetail?.totalGross ?? 0) },
                                { label: "Deductions", value: formatCurrency(runDetail?.totalDeductions ?? 0) },
                            ].map((item) => (
                                <div key={item.label} className="text-center">
                                    <span className="text-[10px] text-success-600/70 dark:text-success-400/60 font-semibold uppercase tracking-wider">{item.label}</span>
                                    <p className="text-sm font-bold text-success-700 dark:text-success-300 font-mono">{item.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {completedStep === 5 && (
                        <button onClick={onStepAction} disabled={anyMutating} className="mt-4 inline-flex items-center gap-2 bg-success-600 hover:bg-success-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50">
                            {anyMutating ? <Loader2 size={16} className="animate-spin" /> : <Banknote size={16} />}
                            Disburse & Generate Payslips
                        </button>
                    )}
                </>
            ) : (
                <>
                    {/* Post-disburse: success summary */}
                    <div className="bg-success-50/50 dark:bg-success-900/10 rounded-xl border border-success-100 dark:border-success-800/50 p-6 text-center">
                        <Check size={32} className="text-success-600 dark:text-success-400 mx-auto mb-3" />
                        <p className="text-lg font-bold text-success-700 dark:text-success-400">Payroll Disbursed Successfully</p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Payslips have been generated for all employees.</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: "Employees Paid", value: String(runDetail?.employeeCount ?? 0) },
                            { label: "Net Disbursed", value: formatCurrency(runDetail?.totalNet ?? runDetail?.totalNetPay ?? 0) },
                            { label: "Disbursed On", value: runDetail?.disbursedAt ? fmt.date(runDetail.disbursedAt) : "-" },
                            { label: "Status", value: "Completed" },
                        ].map((item) => (
                            <div key={item.label} className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 bg-neutral-50/50 dark:bg-neutral-800/30 text-center">
                                <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{item.label}</span>
                                <p className="text-lg font-extrabold text-primary-950 dark:text-white mt-1 font-mono">{item.value}</p>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <a
                            href="/app/company/hr/payslips"
                            className="inline-flex items-center gap-2 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-400 px-4 py-2 rounded-xl font-bold text-xs hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors"
                        >
                            <FileText size={14} />
                            View Payslips
                        </a>
                    </div>

                    <div className="flex items-center gap-2 mt-2 text-success-600 dark:text-success-400">
                        <Check size={16} />
                        <span className="text-sm font-bold">Payroll disbursed and payslips generated</span>
                    </div>
                </>
            )}
        </div>
    );
}
