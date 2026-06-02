import { useState, useEffect } from "react";
import { Calculator, Check, Loader2, Search, ChevronDown, ChevronUp, AlertTriangle, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useComputeSummary, usePayrollEntries } from "@/features/company-admin/api/use-payroll-run-queries";
import { useResetToCompute } from "@/features/company-admin/api/use-payroll-run-mutations";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { showSuccess, showApiError } from "@/lib/toast";

interface StepProps {
    runId: string;
    runDetail: any;
    completedStep: number;
    onStepAction: () => void;
    anyMutating: boolean;
}

const formatCurrency = (v: unknown) => `₹${(Number(v) || 0).toLocaleString("en-IN")}`;

export function Step3PayrollComputation({ runId, runDetail, completedStep, onStepAction, anyMutating }: StepProps) {
    const isComputed = completedStep >= 3;
    const { data: summaryResp, isLoading: summaryLoading } = useComputeSummary(runId);
    const { data: entriesResp, isLoading: entriesLoading } = usePayrollEntries(runId);
    const resetMutation = useResetToCompute();

    const summary = summaryResp?.data;
    const entries: any[] = entriesResp?.data ?? [];

    const [empSearch, setEmpSearch] = useState("");
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 20;

    const filteredEntries = entries.filter((e: any) => {
        if (!empSearch) return true;
        const q = empSearch.toLowerCase();
        const fullName = [e.employee?.firstName, e.employee?.lastName].filter(Boolean).join(' ');
        return (
            fullName.toLowerCase().includes(q) ||
            (e.employee?.employeeId ?? "").toLowerCase().includes(q)
        );
    });

    // Reset page when search changes
    useEffect(() => setPage(1), [empSearch]);

    const totalPages = Math.ceil(filteredEntries.length / PAGE_SIZE);
    const paginatedEntries = filteredEntries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const handleReset = async () => {
        try {
            await resetMutation.mutateAsync(runId);
            showSuccess("Reset Successful", "Payroll has been reset to compute step.");
        } catch (err) {
            showApiError(err);
        }
    };

    return (
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

            {!isComputed ? (
                /* Pre-compute: just the button */
                <div className="text-center py-8">
                    <Calculator size={40} className="text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Click below to compute salaries for all employees in this payroll run.</p>
                    <button onClick={onStepAction} disabled={anyMutating} className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50">
                        {anyMutating ? <Loader2 size={16} className="animate-spin" /> : <Calculator size={16} />}
                        Compute Salaries
                    </button>
                </div>
            ) : summaryLoading ? (
                <SkeletonTable rows={6} cols={4} />
            ) : (
                <>
                    {/* Summary cards row */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {[
                            { label: "Employees", value: String(summary?.employeesProcessed ?? runDetail?.employeeCount ?? 0), mono: false },
                            { label: "Gross Earnings", value: formatCurrency(summary?.totalGrossEarnings ?? runDetail?.totalGross ?? 0), mono: true },
                            { label: "Deductions", value: formatCurrency(summary?.totalDeductions ?? runDetail?.totalDeductions ?? 0), mono: true },
                            { label: "Net Pay", value: formatCurrency(summary?.totalNetPay ?? runDetail?.totalNet ?? runDetail?.totalNetPay ?? 0), mono: true },
                            { label: "Employer Cost", value: formatCurrency(summary?.totalEmployerCost ?? 0), mono: true },
                        ].map((item) => (
                            <div key={item.label} className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 bg-neutral-50/50 dark:bg-neutral-800/30">
                                <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{item.label}</span>
                                <p className={cn("text-xl font-extrabold text-primary-950 dark:text-white mt-1", item.mono && "font-mono")}>{item.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Payroll inputs widget */}
                    {summary?.inputs && (
                        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 bg-neutral-50/50 dark:bg-neutral-800/30">
                            <h4 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">Payroll Inputs</h4>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                {[
                                    { label: "Expense Claims", value: summary.inputs.expenseClaims ?? 0 },
                                    { label: "Arrear Entries", value: summary.inputs.arrearEntries ?? 0 },
                                    { label: "Overtime Requests", value: summary.inputs.overtimeRequests ?? 0 },
                                    { label: "Salary Holds", value: summary.inputs.salaryHolds ?? 0 },
                                    { label: "Loan Deductions", value: summary.inputs.loanDeductions ?? 0 },
                                ].map((item) => (
                                    <div key={item.label} className="text-center">
                                        <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-semibold">{item.label}</span>
                                        <p className="text-lg font-bold text-primary-950 dark:text-white">{item.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Earnings & Deductions breakdown side by side */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Earnings */}
                        {summary?.earningsBreakdown && Object.keys(summary.earningsBreakdown).length > 0 && (
                            <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/30 overflow-hidden">
                                <div className="px-4 py-3 bg-success-50/50 dark:bg-success-900/10 border-b border-neutral-200 dark:border-neutral-700">
                                    <h4 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Earnings Breakdown</h4>
                                </div>
                                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {Object.entries(summary.earningsBreakdown).map(([component, amount]) => (
                                        <div key={component} className="flex items-center justify-between px-4 py-2.5">
                                            <span className="text-sm text-neutral-600 dark:text-neutral-400">{component.replace(/_/g, " ")}</span>
                                            <span className="text-sm font-bold font-mono text-primary-950 dark:text-white">{formatCurrency(amount)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Deductions */}
                        {summary?.deductionsBreakdown && Object.keys(summary.deductionsBreakdown).length > 0 && (
                            <div className="rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/10 overflow-hidden">
                                <div className="px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800/50">
                                    <h4 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Deductions Breakdown</h4>
                                </div>
                                <div className="divide-y divide-amber-100 dark:divide-amber-800/30">
                                    {Object.entries(summary.deductionsBreakdown).map(([component, amount]) => (
                                        <div key={component} className="flex items-center justify-between px-4 py-2.5">
                                            <span className="text-sm text-neutral-600 dark:text-neutral-400">{component.replace(/_/g, " ")}</span>
                                            <span className="text-sm font-bold font-mono text-primary-950 dark:text-white">{formatCurrency(amount)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Compute exceptions */}
                    {summary?.computeExceptions?.length > 0 && (
                        <div className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800/50 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle size={16} className="text-warning-600 dark:text-warning-400" />
                                <h4 className="text-sm font-bold text-warning-700 dark:text-warning-400">Computation Exceptions ({summary.computeExceptions.length})</h4>
                            </div>
                            <div className="space-y-1.5">
                                {summary.computeExceptions.map((exc: any, i: number) => (
                                    <div key={i} className="text-xs text-warning-600 dark:text-warning-400/80">
                                        <span className="font-bold">{exc.employeeName ?? exc.name ?? exc.employeeId}</span>
                                        {(exc.department || exc.designation) && (
                                            <span className="text-warning-500 dark:text-warning-400/60 ml-1">({[exc.department, exc.designation].filter(Boolean).join(" - ")})</span>
                                        )}
                                        {(exc.exceptionNote ?? exc.note) ? `: ${exc.exceptionNote ?? exc.note}` : ""}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Employee salary table */}
                    {!entriesLoading && entries.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Employee Salaries</h4>
                                <div className="relative w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                    <input
                                        type="text"
                                        placeholder="Search employees..."
                                        value={empSearch}
                                        onChange={(e) => setEmpSearch(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                                    />
                                </div>
                            </div>
                            <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-700">
                                <table className="w-full text-left border-collapse min-w-[700px]">
                                    <thead>
                                        <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                            <th className="py-3 px-4 font-bold">Employee</th>
                                            <th className="py-3 px-4 font-bold text-right">Gross</th>
                                            <th className="py-3 px-4 font-bold text-right">Deductions</th>
                                            <th className="py-3 px-4 font-bold text-right">Net Pay</th>
                                            <th className="py-3 px-4 font-bold text-center w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm divide-y divide-neutral-100 dark:divide-neutral-800">
                                        {paginatedEntries.map((entry: any) => (
                                            <>
                                                <tr key={entry.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer" onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}>
                                                    <td className="py-3 px-4">
                                                        <div>
                                                            <span className="font-bold text-primary-950 dark:text-white">{[entry.employee?.firstName, entry.employee?.lastName].filter(Boolean).join(' ') || "Employee"}</span>
                                                            {entry.employee?.employeeId && <span className="text-[10px] text-neutral-400 dark:text-neutral-500 ml-2 font-mono">{entry.employee.employeeId}</span>}
                                                        </div>
                                                        {entry.employee?.department?.name && (
                                                            <span className="text-[10px] text-neutral-400 dark:text-neutral-500">{entry.employee.department.name}{entry.employee?.designation?.name ? ` - ${entry.employee.designation.name}` : ""}</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-mono font-bold text-primary-950 dark:text-white">{formatCurrency(entry.grossEarnings ?? entry.gross ?? 0)}</td>
                                                    <td className="py-3 px-4 text-right font-mono text-danger-600 dark:text-danger-400">{formatCurrency(entry.totalDeductions ?? entry.deductions ?? 0)}</td>
                                                    <td className="py-3 px-4 text-right font-mono font-bold text-success-700 dark:text-success-400">{formatCurrency(entry.netPay ?? entry.net ?? 0)}</td>
                                                    <td className="py-3 px-4 text-center">
                                                        {expandedId === entry.id ? <ChevronUp size={14} className="text-neutral-400" /> : <ChevronDown size={14} className="text-neutral-400" />}
                                                    </td>
                                                </tr>
                                                {expandedId === entry.id && (
                                                    <tr key={`${entry.id}-detail`}>
                                                        <td colSpan={5} className="px-4 py-3 bg-neutral-50/80 dark:bg-neutral-800/40">
                                                            <div className="grid grid-cols-2 gap-4 text-xs">
                                                                {entry.components?.earnings && (
                                                                    <div>
                                                                        <span className="font-bold text-neutral-500 uppercase tracking-wider">Earnings</span>
                                                                        <div className="mt-1 space-y-1">
                                                                            {Object.entries(entry.components.earnings).map(([k, v]) => (
                                                                                <div key={k} className="flex justify-between">
                                                                                    <span className="text-neutral-600 dark:text-neutral-400">{k.replace(/_/g, " ")}</span>
                                                                                    <span className="font-mono font-bold text-primary-950 dark:text-white">{formatCurrency(v)}</span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {entry.components?.deductions && (
                                                                    <div>
                                                                        <span className="font-bold text-neutral-500 uppercase tracking-wider">Deductions</span>
                                                                        <div className="mt-1 space-y-1">
                                                                            {Object.entries(entry.components.deductions).map(([k, v]) => (
                                                                                <div key={k} className="flex justify-between">
                                                                                    <span className="text-neutral-600 dark:text-neutral-400">{k.replace(/_/g, " ")}</span>
                                                                                    <span className="font-mono font-bold text-danger-600 dark:text-danger-400">{formatCurrency(v)}</span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
                                        ))}
                                    </tbody>
                                </table>
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200 dark:border-neutral-800">
                                        <span className="text-xs text-neutral-500 dark:text-neutral-400">Page {page} of {totalPages} ({filteredEntries.length} employees)</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 rounded-lg text-xs font-bold border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-30">Previous</button>
                                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1.5 rounded-lg text-xs font-bold border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-30">Next</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Re-compute button (danger style) */}
                    {completedStep >= 3 && completedStep < 5 && (
                        <div className="flex items-center gap-3 pt-2">
                            <button onClick={handleReset} disabled={resetMutation.isPending || anyMutating} className="inline-flex items-center gap-2 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 text-danger-700 dark:text-danger-400 px-4 py-2 rounded-xl font-bold text-xs hover:bg-danger-100 dark:hover:bg-danger-900/40 transition-colors disabled:opacity-50">
                                {resetMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                                Re-compute Salaries
                            </button>
                        </div>
                    )}

                    {completedStep > 2 && (
                        <div className="flex items-center gap-2 mt-2 text-success-600 dark:text-success-400">
                            <Check size={16} />
                            <span className="text-sm font-bold">Salaries computed</span>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
