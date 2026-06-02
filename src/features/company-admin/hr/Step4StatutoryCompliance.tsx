import { useState, useEffect } from "react";
import { Building2, Check, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStatutorySummary } from "@/features/company-admin/api/use-payroll-run-queries";
import { SkeletonTable } from "@/components/ui/Skeleton";

interface StepProps {
    runId: string;
    runDetail: any;
    completedStep: number;
    onStepAction: () => void;
    anyMutating: boolean;
}

const formatCurrency = (v: unknown) => `₹${(Number(v) || 0).toLocaleString("en-IN")}`;

export function Step4StatutoryCompliance({ runId, runDetail, completedStep, onStepAction, anyMutating }: StepProps) {
    const isComputed = completedStep >= 4;
    const { data: summaryResp, isLoading } = useStatutorySummary(runId);
    const summary = summaryResp?.data;
    const [empSearch, setEmpSearch] = useState("");

    const empContrib = summary?.employeeContributions;
    const empTotal = empContrib
        ? Number(empContrib.pfEmployee ?? 0) + Number(empContrib.esiEmployee ?? 0) + Number(empContrib.ptTotal ?? 0) + Number(empContrib.tdsTotal ?? 0) + Number(empContrib.lwfEmployee ?? 0) + Number(empContrib.vpfTotal ?? 0)
        : 0;

    const erContrib = summary?.employerContributions;
    const erTotal = erContrib
        ? Number(erContrib.pfEmployer ?? 0) + Number(erContrib.esiEmployer ?? 0) + Number(erContrib.lwfEmployer ?? 0) + Number(erContrib.gratuityProvision ?? 0) + Number(erContrib.bonusProvision ?? 0)
        : 0;

    const [page, setPage] = useState(1);
    const PAGE_SIZE = 20;

    const employees: any[] = summary?.employeeStatutory ?? [];
    const filtered = employees.filter((e: any) => {
        if (!empSearch) return true;
        const q = empSearch.toLowerCase();
        return (e.name ?? "").toLowerCase().includes(q) || (e.department ?? "").toLowerCase().includes(q);
    });

    // Reset page when search changes
    useEffect(() => setPage(1), [empSearch]);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paginatedFiltered = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
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

            {!isComputed ? (
                <div className="text-center py-8">
                    <Building2 size={40} className="text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Click below to compute statutory deductions for all employees.</p>
                    <button onClick={onStepAction} disabled={anyMutating} className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50">
                        {anyMutating ? <Loader2 size={16} className="animate-spin" /> : <Building2 size={16} />}
                        Compute Statutory
                    </button>
                </div>
            ) : isLoading ? (
                <SkeletonTable rows={5} cols={4} />
            ) : (
                <>
                    {/* Two cards: Employee Deductions (amber) + Employer Contributions (blue) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Employee Deductions */}
                        <div className="rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/10 overflow-hidden">
                            <div className="px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800/50">
                                <h4 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Employee Deductions</h4>
                            </div>
                            <div className="divide-y divide-amber-100 dark:divide-amber-800/30">
                                {empContrib && [
                                    { label: "PF (Employee)", value: empContrib.pfEmployee },
                                    { label: "ESI (Employee)", value: empContrib.esiEmployee },
                                    { label: "Professional Tax", value: empContrib.ptTotal },
                                    { label: "TDS", value: empContrib.tdsTotal },
                                    { label: "LWF (Employee)", value: empContrib.lwfEmployee },
                                    { label: "VPF", value: empContrib.vpfTotal },
                                ].map((item) => (
                                    <div key={item.label} className="flex items-center justify-between px-4 py-2.5">
                                        <span className="text-sm text-neutral-600 dark:text-neutral-400">{item.label}</span>
                                        <span className="text-sm font-bold font-mono text-primary-950 dark:text-white">{formatCurrency(item.value)}</span>
                                    </div>
                                ))}
                                <div className="flex items-center justify-between px-4 py-3 bg-amber-100/50 dark:bg-amber-900/20">
                                    <span className="text-sm font-bold text-amber-800 dark:text-amber-300">Total</span>
                                    <span className="text-sm font-extrabold font-mono text-amber-800 dark:text-amber-300">{formatCurrency(empTotal)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Employer Contributions */}
                        <div className="rounded-xl border border-blue-200 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-900/10 overflow-hidden">
                            <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800/50">
                                <h4 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Employer Contributions</h4>
                            </div>
                            <div className="divide-y divide-blue-100 dark:divide-blue-800/30">
                                {erContrib && [
                                    { label: "PF (Employer)", value: erContrib.pfEmployer },
                                    { label: "ESI (Employer)", value: erContrib.esiEmployer },
                                    { label: "LWF (Employer)", value: erContrib.lwfEmployer },
                                    { label: "Gratuity Provision", value: erContrib.gratuityProvision },
                                    { label: "Bonus Provision", value: erContrib.bonusProvision },
                                ].map((item) => (
                                    <div key={item.label} className="flex items-center justify-between px-4 py-2.5">
                                        <span className="text-sm text-neutral-600 dark:text-neutral-400">{item.label}</span>
                                        <span className="text-sm font-bold font-mono text-primary-950 dark:text-white">{formatCurrency(item.value)}</span>
                                    </div>
                                ))}
                                <div className="flex items-center justify-between px-4 py-3 bg-blue-100/50 dark:bg-blue-900/20">
                                    <span className="text-sm font-bold text-blue-800 dark:text-blue-300">Total</span>
                                    <span className="text-sm font-extrabold font-mono text-blue-800 dark:text-blue-300">{formatCurrency(erTotal)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Eligibility counts */}
                    {summary?.eligibility && (
                        <div className="flex items-center gap-3 flex-wrap">
                            {[
                                { label: "PF Eligible", value: summary.eligibility.pfEligible },
                                { label: "ESI Eligible", value: summary.eligibility.esiEligible },
                                { label: "PT Applicable", value: summary.eligibility.ptApplicable },
                                { label: "TDS Applicable", value: summary.eligibility.tdsApplicable },
                            ].map((item) => (
                                <span key={item.label} className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700">
                                    {item.label}: {item.value ?? 0}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Per-employee statutory table */}
                    {employees.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Per-Employee Statutory</h4>
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
                                <table className="w-full text-left border-collapse min-w-[900px]">
                                    <thead>
                                        <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                            <th className="py-3 px-4 font-bold">Employee</th>
                                            <th className="py-3 px-4 font-bold">Department</th>
                                            <th className="py-3 px-4 font-bold text-right">PF (EE)</th>
                                            <th className="py-3 px-4 font-bold text-right">PF (ER)</th>
                                            <th className="py-3 px-4 font-bold text-right">ESI (EE)</th>
                                            <th className="py-3 px-4 font-bold text-right">ESI (ER)</th>
                                            <th className="py-3 px-4 font-bold text-right">PT</th>
                                            <th className="py-3 px-4 font-bold text-right">TDS</th>
                                            <th className="py-3 px-4 font-bold text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm divide-y divide-neutral-100 dark:divide-neutral-800">
                                        {paginatedFiltered.map((emp: any) => (
                                            <tr key={emp.employeeId} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                                <td className="py-3 px-4 font-bold text-primary-950 dark:text-white">{emp.name}</td>
                                                <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400">{emp.department ?? "-"}</td>
                                                <td className="py-3 px-4 text-right font-mono">{formatCurrency(emp.pfEmployee)}</td>
                                                <td className="py-3 px-4 text-right font-mono">{formatCurrency(emp.pfEmployer)}</td>
                                                <td className="py-3 px-4 text-right font-mono">{formatCurrency(emp.esiEmployee)}</td>
                                                <td className="py-3 px-4 text-right font-mono">{formatCurrency(emp.esiEmployer)}</td>
                                                <td className="py-3 px-4 text-right font-mono">{formatCurrency(emp.pt)}</td>
                                                <td className="py-3 px-4 text-right font-mono">{formatCurrency(emp.tds)}</td>
                                                <td className="py-3 px-4 text-right font-mono font-bold text-primary-950 dark:text-white">{formatCurrency(emp.total)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200 dark:border-neutral-800">
                                        <span className="text-xs text-neutral-500 dark:text-neutral-400">Page {page} of {totalPages} ({filtered.length} employees)</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 rounded-lg text-xs font-bold border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-30">Previous</button>
                                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1.5 rounded-lg text-xs font-bold border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-30">Next</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {completedStep > 3 && (
                        <div className="flex items-center gap-2 mt-2 text-success-600 dark:text-success-400">
                            <Check size={16} />
                            <span className="text-sm font-bold">Statutory deductions computed</span>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
