import { useState } from "react";
import {
    Receipt,
    Eye,
    Download,
    X,
    Search,
    Filter,
    IndianRupee,
    ArrowUpRight,
    ArrowDownRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMyPayslips } from "@/features/company-admin/api/use-ess-queries";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showInfo } from "@/lib/toast";

/* ── Helpers ── */

const formatCurrency = (amount: number | string | undefined) => {
    const n = Number(amount ?? 0);
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const YEARS = ["2026", "2025", "2024", "2023"];

/* ── Screen ── */

export function MyPayslipsScreen() {
    const [monthFilter, setMonthFilter] = useState("");
    const [yearFilter, setYearFilter] = useState("");
    const [detailTarget, setDetailTarget] = useState<any>(null);

    const { data, isLoading, isError } = useMyPayslips();
    const payslips: any[] = (data?.data as any) ?? [];

    const filtered = payslips.filter((p: any) => {
        if (monthFilter && p.month !== monthFilter) return false;
        if (yearFilter && p.year !== yearFilter) return false;
        return true;
    });

    const handleDownload = (payslip: any) => {
        showInfo("Download Started", `Payslip for ${payslip.monthLabel ?? payslip.month} ${payslip.year} is being prepared.`);
    };

    // Build detail breakdown
    const earnings: Array<{ label: string; amount: number }> = detailTarget?.earnings ?? [
        { label: "Basic Salary", amount: detailTarget?.basic ?? 0 },
        { label: "HRA", amount: detailTarget?.hra ?? 0 },
        { label: "Special Allowance", amount: detailTarget?.specialAllowance ?? 0 },
        { label: "Conveyance", amount: detailTarget?.conveyance ?? 0 },
        { label: "Medical Allowance", amount: detailTarget?.medicalAllowance ?? 0 },
    ].filter((e) => e.amount > 0);

    const deductions: Array<{ label: string; amount: number }> = detailTarget?.deductions ?? [
        { label: "PF (Employee)", amount: detailTarget?.pfEmployee ?? 0 },
        { label: "ESI (Employee)", amount: detailTarget?.esiEmployee ?? 0 },
        { label: "Professional Tax", amount: detailTarget?.professionalTax ?? 0 },
        { label: "TDS", amount: detailTarget?.tds ?? 0 },
        { label: "Loan EMI", amount: detailTarget?.loanEmi ?? 0 },
    ].filter((d) => d.amount > 0);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">My Payslips</h1>
                <p className="text-neutral-500 dark:text-neutral-400 mt-1">View and download your monthly salary statements</p>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-2">
                    <Filter size={14} className="text-neutral-400 flex-shrink-0" />
                    <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 whitespace-nowrap">Month:</span>
                    <select
                        value={monthFilter}
                        onChange={(e) => setMonthFilter(e.target.value)}
                        className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-semibold text-neutral-700 dark:text-neutral-300 focus:outline-none"
                    >
                        <option value="">All</option>
                        {MONTHS.map((m, i) => (
                            <option key={m} value={String(i + 1).padStart(2, "0")}>{m}</option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 whitespace-nowrap">Year:</span>
                    <select
                        value={yearFilter}
                        onChange={(e) => setYearFilter(e.target.value)}
                        className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-semibold text-neutral-700 dark:text-neutral-300 focus:outline-none"
                    >
                        <option value="">All</option>
                        {YEARS.map((y) => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? (
                    <SkeletonTable rows={6} cols={5} />
                ) : isError ? (
                    <div className="p-8 text-center text-danger-600 dark:text-danger-400 font-medium">Failed to load payslips.</div>
                ) : filtered.length === 0 ? (
                    <EmptyState icon="list" title="No payslips found" message="Payslips will appear here once they are generated." />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Month</th>
                                    <th className="py-4 px-6 font-bold text-right">Gross Earnings</th>
                                    <th className="py-4 px-6 font-bold text-right">Deductions</th>
                                    <th className="py-4 px-6 font-bold text-right">Net Pay</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.map((p: any) => (
                                    <tr key={p.id ?? `${p.month}-${p.year}`} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                                                    <Receipt size={14} className="text-primary-600 dark:text-primary-400" />
                                                </div>
                                                <div>
                                                    <span className="font-bold text-primary-950 dark:text-white">{p.monthLabel ?? MONTHS[(Number(p.month) || 1) - 1] ?? p.month}</span>
                                                    <span className="text-neutral-500 dark:text-neutral-400 ml-1.5 text-xs">{p.year}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <span className="flex items-center justify-end gap-1 font-mono font-semibold text-success-700 dark:text-success-400">
                                                <ArrowUpRight size={12} />
                                                {formatCurrency(p.grossEarnings ?? p.gross)}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <span className="flex items-center justify-end gap-1 font-mono font-semibold text-danger-600 dark:text-danger-400">
                                                <ArrowDownRight size={12} />
                                                {formatCurrency(p.totalDeductions ?? p.deductionsTotal)}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right font-mono font-bold text-primary-950 dark:text-white text-base">
                                            {formatCurrency(p.netPay ?? p.net)}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => setDetailTarget(p)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="View Detail">
                                                    <Eye size={15} />
                                                </button>
                                                <button onClick={() => handleDownload(p)} className="p-2 text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-900/20 rounded-lg transition-colors" title="Download PDF">
                                                    <Download size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Detail Modal ── */}
            {detailTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">
                                Payslip - {detailTarget.monthLabel ?? MONTHS[(Number(detailTarget.month) || 1) - 1]} {detailTarget.year}
                            </h2>
                            <button onClick={() => setDetailTarget(null)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-5">
                            {/* Earnings */}
                            <div>
                                <h4 className="text-xs font-bold text-success-600 dark:text-success-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                    <ArrowUpRight size={12} /> Earnings
                                </h4>
                                <div className="space-y-2">
                                    {earnings.map((e) => (
                                        <div key={e.label} className="flex items-center justify-between text-sm">
                                            <span className="text-neutral-600 dark:text-neutral-400">{e.label}</span>
                                            <span className="font-mono font-semibold text-primary-950 dark:text-white">{formatCurrency(e.amount)}</span>
                                        </div>
                                    ))}
                                    <div className="flex items-center justify-between text-sm pt-2 border-t border-neutral-200 dark:border-neutral-700">
                                        <span className="font-bold text-primary-950 dark:text-white">Gross Earnings</span>
                                        <span className="font-mono font-bold text-success-700 dark:text-success-400">{formatCurrency(detailTarget.grossEarnings ?? detailTarget.gross)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Deductions */}
                            <div>
                                <h4 className="text-xs font-bold text-danger-600 dark:text-danger-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                    <ArrowDownRight size={12} /> Deductions
                                </h4>
                                <div className="space-y-2">
                                    {deductions.map((d) => (
                                        <div key={d.label} className="flex items-center justify-between text-sm">
                                            <span className="text-neutral-600 dark:text-neutral-400">{d.label}</span>
                                            <span className="font-mono font-semibold text-primary-950 dark:text-white">{formatCurrency(d.amount)}</span>
                                        </div>
                                    ))}
                                    <div className="flex items-center justify-between text-sm pt-2 border-t border-neutral-200 dark:border-neutral-700">
                                        <span className="font-bold text-primary-950 dark:text-white">Total Deductions</span>
                                        <span className="font-mono font-bold text-danger-600 dark:text-danger-400">{formatCurrency(detailTarget.totalDeductions ?? detailTarget.deductionsTotal)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Net Pay */}
                            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 border border-primary-200 dark:border-primary-800/50 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <IndianRupee size={16} className="text-primary-600 dark:text-primary-400" />
                                    <span className="text-sm font-bold text-primary-700 dark:text-primary-400">Net Pay</span>
                                </div>
                                <span className="text-xl font-bold text-primary-700 dark:text-primary-300 font-mono">{formatCurrency(detailTarget.netPay ?? detailTarget.net)}</span>
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setDetailTarget(null)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Close</button>
                            <button onClick={() => handleDownload(detailTarget)} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2">
                                <Download size={14} />
                                Download PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
