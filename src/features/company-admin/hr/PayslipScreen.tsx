import { useState } from "react";
import {
    FileText,
    Search,
    Eye,
    Mail,
    Loader2,
    X,
    CheckCircle,
    Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    usePayslips,
    usePayslip,
} from "@/features/company-admin/api/use-payroll-run-queries";
import { useEmailPayslip } from "@/features/company-admin/api/use-payroll-run-mutations";
import { useEmployees } from "@/features/company-admin/api/use-hr-queries";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Helpers ── */

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

const formatCurrency = (v: number) => `\u20B9${(v ?? 0).toLocaleString("en-IN")}`;

/* ── Screen ── */

export function PayslipScreen() {
    const [search, setSearch] = useState("");
    const [monthFilter, setMonthFilter] = useState("");
    const [detailId, setDetailId] = useState<string | null>(null);

    const [filterMonth, setFilterMonth] = useState<number | undefined>();
    const [filterYear, setFilterYear] = useState<number | undefined>();

    const payslipsQuery = usePayslips({ month: filterMonth, year: filterYear });
    const detailQuery = usePayslip(detailId ?? "");
    const employeesQuery = useEmployees();
    const emailMutation = useEmailPayslip();

    const payslips: any[] = payslipsQuery.data?.data ?? [];
    const employees: any[] = employeesQuery.data?.data ?? [];
    const detail: any = detailQuery.data?.data ?? null;

    const getEmployeeName = (id: string) => {
        const e = employees.find((emp: any) => emp.id === id);
        return e ? `${e.firstName ?? ""} ${e.lastName ?? ""}`.trim() || e.email || id : id;
    };

    const filtered = payslips.filter((p: any) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return getEmployeeName(p.employeeId).toLowerCase().includes(q) || p.employeeName?.toLowerCase().includes(q);
    });

    const handleMonthChange = (val: string) => {
        setMonthFilter(val);
        if (val) {
            const [y, m] = val.split("-");
            setFilterYear(Number(y));
            setFilterMonth(Number(m));
        } else {
            setFilterYear(undefined);
            setFilterMonth(undefined);
        }
    };

    const handleEmail = async (id: string) => {
        try {
            await emailMutation.mutateAsync(id);
            showSuccess("Payslip Emailed", "Payslip has been sent to the employee.");
        } catch (err) {
            showApiError(err);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Payslips</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">View and distribute employee payslips</p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                        <input
                            type="text"
                            placeholder="Search employees..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                        />
                    </div>
                    <input
                        type="month"
                        value={monthFilter}
                        onChange={(e) => handleMonthChange(e.target.value)}
                        className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                    />
                </div>
            </div>

            {payslipsQuery.isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
                    Failed to load payslips. Please try again.
                </div>
            )}

            {/* Data Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {payslipsQuery.isLoading ? (
                    <SkeletonTable rows={8} cols={7} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Employee</th>
                                    <th className="py-4 px-6 font-bold">Month / Year</th>
                                    <th className="py-4 px-6 font-bold text-right">Gross (\u20B9)</th>
                                    <th className="py-4 px-6 font-bold text-right">Deductions (\u20B9)</th>
                                    <th className="py-4 px-6 font-bold text-right">Net Pay (\u20B9)</th>
                                    <th className="py-4 px-6 font-bold text-center">Emailed</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.map((p: any) => (
                                    <tr key={p.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                                                    <FileText className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                                </div>
                                                <div>
                                                    <span className="font-bold text-primary-950 dark:text-white">{p.employeeName || getEmployeeName(p.employeeId)}</span>
                                                    {p.employeeCode && <span className="block text-[11px] font-mono text-neutral-400 dark:text-neutral-500 mt-0.5">{p.employeeCode}</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">
                                            {p.month && p.year ? `${MONTHS[(p.month ?? 1) - 1]} ${p.year}` : "\u2014"}
                                        </td>
                                        <td className="py-4 px-6 text-right font-mono font-semibold text-primary-950 dark:text-white">{formatCurrency(p.grossPay ?? p.gross ?? 0)}</td>
                                        <td className="py-4 px-6 text-right font-mono text-neutral-600 dark:text-neutral-400">{formatCurrency(p.totalDeductions ?? p.deductions ?? 0)}</td>
                                        <td className="py-4 px-6 text-right font-mono font-bold text-success-700 dark:text-success-400">{formatCurrency(p.netPay ?? 0)}</td>
                                        <td className="py-4 px-6 text-center">
                                            {p.emailed ? (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50">
                                                    <CheckCircle size={10} />
                                                    Sent
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-neutral-100 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700">
                                                    Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => setDetailId(p.id)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="View">
                                                    <Eye size={15} />
                                                </button>
                                                <button
                                                    onClick={() => handleEmail(p.id)}
                                                    disabled={emailMutation.isPending}
                                                    className="p-2 text-info-600 dark:text-info-400 hover:bg-info-50 dark:hover:bg-info-900/20 rounded-lg transition-colors disabled:opacity-50"
                                                    title="Email"
                                                >
                                                    <Mail size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && !payslipsQuery.isLoading && (
                                    <tr>
                                        <td colSpan={7}>
                                            <EmptyState icon="list" title="No payslips found" message="Payslips will appear here after a payroll run is disbursed." />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Detail Modal ── */}
            {detailId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">Payslip Details</h2>
                            <button onClick={() => setDetailId(null)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-5">
                            {detailQuery.isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 size={24} className="animate-spin text-primary-500" />
                                </div>
                            ) : detail ? (
                                <>
                                    {/* Employee Info */}
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-primary-950 dark:text-white text-lg">{detail.employeeName || getEmployeeName(detail.employeeId)}</p>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400">{detail.employeeCode} &middot; {detail.designation ?? ""}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400">Pay Period</p>
                                            <p className="font-bold text-primary-950 dark:text-white">{detail.month && detail.year ? `${MONTHS[(detail.month ?? 1) - 1]} ${detail.year}` : "\u2014"}</p>
                                        </div>
                                    </div>

                                    {/* Earnings */}
                                    <div>
                                        <h4 className="text-xs font-bold text-success-600 dark:text-success-400 uppercase tracking-wider mb-2">Earnings</h4>
                                        <div className="bg-success-50/30 dark:bg-success-900/10 rounded-xl border border-success-100 dark:border-success-800/50 divide-y divide-success-100 dark:divide-success-800/50">
                                            {(detail.earnings ?? []).map((e: any, i: number) => (
                                                <div key={i} className="flex justify-between px-4 py-2.5 text-sm">
                                                    <span className="text-neutral-700 dark:text-neutral-300">{e.name ?? e.component}</span>
                                                    <span className="font-mono font-semibold text-primary-950 dark:text-white">{formatCurrency(e.amount)}</span>
                                                </div>
                                            ))}
                                            <div className="flex justify-between px-4 py-2.5 text-sm font-bold bg-success-50 dark:bg-success-900/20">
                                                <span className="text-success-700 dark:text-success-400">Total Earnings</span>
                                                <span className="font-mono text-success-700 dark:text-success-400">{formatCurrency(detail.grossPay ?? detail.gross ?? 0)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Deductions */}
                                    <div>
                                        <h4 className="text-xs font-bold text-danger-600 dark:text-danger-400 uppercase tracking-wider mb-2">Deductions</h4>
                                        <div className="bg-danger-50/30 dark:bg-danger-900/10 rounded-xl border border-danger-100 dark:border-danger-800/50 divide-y divide-danger-100 dark:divide-danger-800/50">
                                            {(detail.deductions ?? []).map((d: any, i: number) => (
                                                <div key={i} className="flex justify-between px-4 py-2.5 text-sm">
                                                    <span className="text-neutral-700 dark:text-neutral-300">{d.name ?? d.component}</span>
                                                    <span className="font-mono font-semibold text-primary-950 dark:text-white">{formatCurrency(d.amount)}</span>
                                                </div>
                                            ))}
                                            <div className="flex justify-between px-4 py-2.5 text-sm font-bold bg-danger-50 dark:bg-danger-900/20">
                                                <span className="text-danger-700 dark:text-danger-400">Total Deductions</span>
                                                <span className="font-mono text-danger-700 dark:text-danger-400">{formatCurrency(detail.totalDeductions ?? 0)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Employer Contributions */}
                                    {detail.employerContributions && detail.employerContributions.length > 0 && (
                                        <div>
                                            <h4 className="text-xs font-bold text-info-600 dark:text-info-400 uppercase tracking-wider mb-2">Employer Contributions</h4>
                                            <div className="bg-info-50/30 dark:bg-info-900/10 rounded-xl border border-info-100 dark:border-info-800/50 divide-y divide-info-100 dark:divide-info-800/50">
                                                {(detail.employerContributions ?? []).map((c: any, i: number) => (
                                                    <div key={i} className="flex justify-between px-4 py-2.5 text-sm">
                                                        <span className="text-neutral-700 dark:text-neutral-300">{c.name ?? c.component}</span>
                                                        <span className="font-mono font-semibold text-primary-950 dark:text-white">{formatCurrency(c.amount)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Net Pay */}
                                    <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-200 dark:border-primary-800/50 p-4 flex items-center justify-between">
                                        <span className="text-sm font-bold text-primary-700 dark:text-primary-400">Net Pay</span>
                                        <span className="text-2xl font-extrabold font-mono text-primary-700 dark:text-primary-400">{formatCurrency(detail.netPay ?? 0)}</span>
                                    </div>
                                </>
                            ) : (
                                <p className="text-sm text-neutral-400 text-center py-8">Payslip not found</p>
                            )}
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setDetailId(null)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                                Close
                            </button>
                            <button
                                onClick={() => { if (detailId) handleEmail(detailId); }}
                                disabled={emailMutation.isPending}
                                className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {emailMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                                Email Payslip
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
