import { CheckCircle2, Check, Loader2, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompanyFormatter } from "@/hooks/useCompanyFormatter";
import { useApprovalSummary } from "@/features/company-admin/api/use-payroll-run-queries";
import { SkeletonTable } from "@/components/ui/Skeleton";

interface StepProps {
    runId: string;
    runDetail: any;
    completedStep: number;
    onStepAction: () => void;
    anyMutating: boolean;
}

const formatCurrency = (v: unknown) => `₹${(Number(v) || 0).toLocaleString("en-IN")}`;

/** Compact format for summary cards — uses L/Cr for large values */
const formatCompact = (v: unknown) => {
    const n = Number(v) || 0;
    if (Math.abs(n) >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
    if (Math.abs(n) >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
    return `₹${n.toLocaleString("en-IN")}`;
};

/** Format a comparison row value — currency or plain number */
const formatComparisonValue = (v: number, key: string) => {
    const numKeys = ["employees"];
    if (numKeys.includes(key)) return v.toLocaleString("en-IN");
    return formatCurrency(v);
};

/** Format audit user — resolve CUIDs to fallback label */
const formatAuditUser = (id: string | null) => {
    if (!id) return null;
    if (id.length > 20 && /^c[a-z0-9]+$/.test(id)) return "Admin";
    return id;
};

export function Step5PayrollApproval({ runId, runDetail, completedStep, onStepAction, anyMutating }: StepProps) {
    const fmt = useCompanyFormatter();
    const { data: summaryResp, isLoading } = useApprovalSummary(runId);
    const summary = summaryResp?.data;

    const exec = summary?.summary;
    const comparison = summary?.comparison;
    const departments: any[] = summary?.departmentBreakdown ?? [];
    const highVariance: any[] = summary?.highVarianceEmployees ?? [];
    const audit = summary?.audit;

    return (
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

            {isLoading ? (
                <SkeletonTable rows={6} cols={4} />
            ) : (
                <>
                    {/* Executive Summary cards */}
                    {exec && (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {[
                                { label: "Employees", value: String(exec.employees ?? runDetail?.employeeCount ?? 0), mono: false },
                                { label: "Gross Pay", value: formatCompact(exec.grossPay ?? runDetail?.totalGross ?? 0), mono: true },
                                { label: "Deductions", value: formatCompact(exec.totalDeductions ?? runDetail?.totalDeductions ?? 0), mono: true },
                                { label: "Statutory", value: formatCompact(exec.totalStatutory ?? 0), mono: true },
                                { label: "Net Pay", value: formatCompact(exec.netPay ?? runDetail?.totalNet ?? runDetail?.totalNetPay ?? 0), mono: true },
                                { label: "Employer Cost", value: formatCompact(exec.employerCost ?? exec.totalCostToCompany ?? 0), mono: true },
                            ].map((item) => (
                                <div key={item.label} className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 bg-neutral-50/50 dark:bg-neutral-800/30 overflow-hidden">
                                    <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{item.label}</span>
                                    <p className={cn("text-lg font-extrabold text-primary-950 dark:text-white mt-1 whitespace-nowrap truncate", item.mono && "font-mono")}>{item.value}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Fallback summary when approval summary API not available */}
                    {!exec && (
                        <div className="bg-neutral-50 dark:bg-neutral-800/30 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
                            <h4 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">Final Summary</h4>
                            <div className="space-y-2.5">
                                {[
                                    { label: "Employees", value: String(runDetail?.employeeCount ?? 0) },
                                    { label: "Total Gross Pay", value: formatCurrency(runDetail?.totalGross ?? 0) },
                                    { label: "Total Deductions", value: formatCurrency(runDetail?.totalDeductions ?? 0) },
                                    { label: "Total Net Pay", value: formatCurrency(runDetail?.totalNet ?? runDetail?.totalNetPay ?? 0) },
                                ].map((item) => (
                                    <div key={item.label} className="flex items-center justify-between py-1.5">
                                        <span className="text-sm text-neutral-600 dark:text-neutral-400">{item.label}</span>
                                        <span className="text-sm font-bold font-mono text-primary-950 dark:text-white">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Month-on-Month Comparison */}
                    {comparison && (
                        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                            <div className="px-4 py-3 bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-700">
                                <h4 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Month-on-Month Comparison</h4>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[500px]">
                                    <thead>
                                        <tr className="border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                            <th className="py-3 px-4 font-bold">Metric</th>
                                            <th className="py-3 px-4 font-bold text-right">Previous</th>
                                            <th className="py-3 px-4 font-bold text-right">Current</th>
                                            <th className="py-3 px-4 font-bold text-right">Variance</th>
                                            <th className="py-3 px-4 font-bold text-right">%</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm divide-y divide-neutral-100 dark:divide-neutral-800">
                                        {Object.keys(comparison.current ?? {}).map((key) => {
                                            const prev = Number(comparison.previous?.[key] ?? 0);
                                            const curr = Number(comparison.current?.[key] ?? 0);
                                            const variance = Number(comparison.variance?.[key] ?? (curr - prev));
                                            const pct = Number(comparison.variancePercent?.[key] ?? (prev ? ((variance / prev) * 100) : 0));
                                            const isUp = variance > 0;
                                            return (
                                                <tr key={key} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                                    <td className="py-3 px-4 font-bold text-primary-950 dark:text-white capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</td>
                                                    <td className="py-3 px-4 text-right font-mono text-neutral-600 dark:text-neutral-400">{formatComparisonValue(prev, key)}</td>
                                                    <td className="py-3 px-4 text-right font-mono font-bold text-primary-950 dark:text-white">{formatComparisonValue(curr, key)}</td>
                                                    <td className={cn("py-3 px-4 text-right font-mono font-bold", isUp ? "text-danger-600 dark:text-danger-400" : "text-success-600 dark:text-success-400")}>
                                                        <span className="inline-flex items-center gap-1">
                                                            {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                                            {key === "employees" ? Math.abs(variance).toLocaleString("en-IN") : formatCurrency(Math.abs(variance))}
                                                        </span>
                                                    </td>
                                                    <td className={cn("py-3 px-4 text-right font-mono font-bold", Math.abs(pct) > 10 ? "text-danger-600 dark:text-danger-400" : "text-neutral-600 dark:text-neutral-400")}>
                                                        {pct >= 0 ? "+" : ""}{pct.toFixed(1)}%
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Department Breakdown */}
                    {departments.length > 0 && (
                        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                            <div className="px-4 py-3 bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-700">
                                <h4 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Department Breakdown</h4>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[600px]">
                                    <thead>
                                        <tr className="border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                            <th className="py-3 px-4 font-bold">Department</th>
                                            <th className="py-3 px-4 font-bold text-right">Employees</th>
                                            <th className="py-3 px-4 font-bold text-right">Gross Pay</th>
                                            <th className="py-3 px-4 font-bold text-right">Net Pay</th>
                                            <th className="py-3 px-4 font-bold text-right">Employer Cost</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm divide-y divide-neutral-100 dark:divide-neutral-800">
                                        {departments.map((dept: any) => (
                                            <tr key={dept.department} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                                <td className="py-3 px-4 font-bold text-primary-950 dark:text-white">{dept.department}</td>
                                                <td className="py-3 px-4 text-right text-neutral-600 dark:text-neutral-400">{dept.employees}</td>
                                                <td className="py-3 px-4 text-right font-mono">{formatCurrency(dept.grossPay)}</td>
                                                <td className="py-3 px-4 text-right font-mono font-bold text-primary-950 dark:text-white">{formatCurrency(dept.netPay)}</td>
                                                <td className="py-3 px-4 text-right font-mono">{formatCurrency(dept.employerCost)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* High Variance Employees */}
                    {highVariance.length > 0 && (
                        <div className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800/50 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-1">
                                <AlertTriangle size={16} className="text-warning-600 dark:text-warning-400" />
                                <h4 className="text-sm font-bold text-warning-700 dark:text-warning-400">High Variance Employees ({highVariance.length})</h4>
                            </div>
                            <p className="text-[10px] text-warning-600 dark:text-warning-400/80 mb-3">Employees whose net pay changed by more than 10% compared to the previous month.</p>
                            <div className="space-y-2">
                                {highVariance.map((emp: any, i: number) => {
                                    const v = Number(emp.variance ?? 0);
                                    return (
                                    <div key={i} className="flex items-center justify-between text-xs">
                                        <span className="text-warning-700 dark:text-warning-300 font-bold">
                                            {emp.name} <span className="font-mono text-warning-500 dark:text-warning-400/80 ml-1">{emp.employeeCode}</span>
                                        </span>
                                        <span className={cn("font-mono font-bold", v > 0 ? "text-danger-600 dark:text-danger-400" : "text-success-600 dark:text-success-400")}>
                                            {v > 0 ? "+" : ""}{v.toFixed(2)}%
                                        </span>
                                    </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Audit Trail */}
                    {audit && (
                        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 bg-neutral-50/50 dark:bg-neutral-800/30">
                            <h4 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">Audit Trail</h4>
                            <div className="space-y-2">
                                {audit.createdAt && (
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-neutral-500 dark:text-neutral-400">Created</span>
                                        <span className="text-neutral-700 dark:text-neutral-300 font-semibold">{fmt.dateTime(audit.createdAt)}</span>
                                    </div>
                                )}
                                {audit.lockedBy && (
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-neutral-500 dark:text-neutral-400">Attendance Locked</span>
                                        <span className="text-neutral-700 dark:text-neutral-300 font-semibold">{formatAuditUser(audit.lockedBy)}{audit.lockedAt ? ` \u00B7 ${fmt.dateTime(audit.lockedAt)}` : ""}</span>
                                    </div>
                                )}
                                {audit.computedBy && (
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-neutral-500 dark:text-neutral-400">Computed</span>
                                        <span className="text-neutral-700 dark:text-neutral-300 font-semibold">{formatAuditUser(audit.computedBy)}{audit.computedAt ? ` \u00B7 ${fmt.dateTime(audit.computedAt)}` : ""}</span>
                                    </div>
                                )}
                                {audit.approvedBy && (
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-neutral-500 dark:text-neutral-400">Approved</span>
                                        <span className="text-neutral-700 dark:text-neutral-300 font-semibold">{formatAuditUser(audit.approvedBy)}{audit.approvedAt ? ` \u00B7 ${fmt.dateTime(audit.approvedAt)}` : ""}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Exception count note */}
                    {summary?.exceptionCount > 0 && (
                        <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                            <AlertTriangle size={14} />
                            <span className="font-semibold">{summary.exceptionCount} exception(s) were reviewed and accepted during this run</span>
                        </div>
                    )}
                </>
            )}

            {completedStep === 4 && (
                <button onClick={onStepAction} disabled={anyMutating} className="mt-4 inline-flex items-center gap-2 bg-success-600 hover:bg-success-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50">
                    {anyMutating ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
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
    );
}
