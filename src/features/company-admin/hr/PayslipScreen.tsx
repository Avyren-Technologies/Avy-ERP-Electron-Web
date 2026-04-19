import { useState, useMemo } from "react";
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import { R2Link } from '@/components/R2Link';
import {
    FileText,
    Search,
    Eye,
    Mail,
    Loader2,
    X,
    CheckCircle,
    Download,
    Building2,
    User,
    Calendar,
    Banknote,
    CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    usePayslips,
    usePayslip,
} from "@/features/company-admin/api/use-payroll-run-queries";
import { useSalaryComponents } from "@/features/company-admin/api/use-payroll-queries";
import { useEmailPayslip } from "@/features/company-admin/api/use-payroll-run-mutations";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Helpers ── */

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

const num = (v: unknown) => Number(v) || 0;
const inr = (v: unknown) => `₹${num(v).toLocaleString("en-IN")}`;

const COMPONENT_LABELS: Record<string, string> = {
    BASIC: "Basic Salary", HRA: "House Rent Allowance", DA: "Dearness Allowance",
    CONVEYANCE: "Conveyance Allowance", MEDICAL: "Medical Allowance", SPECIAL: "Special Allowance",
    REIMBURSEMENT: "Reimbursement", OVERTIME: "Overtime", BONUS: "Bonus", LTA: "Leave Travel Allowance",
    PF_EMPLOYEE: "Provident Fund (Employee)", PF_EMPLOYER: "Provident Fund (Employer)",
    ESI_EMPLOYEE: "ESI (Employee)", ESI_EMPLOYER: "ESI (Employer)",
    PT: "Professional Tax", TDS: "Tax Deducted at Source",
    LWF_EMPLOYEE: "Labour Welfare Fund", LWF_EMPLOYER: "LWF (Employer)",
    LOAN_DEDUCTION: "Loan Deduction", ADVANCE_SALARY: "Advance Salary Recovery",
};

/** Convert JSON object { code: amount } or array to array of { name, amount } */
function toComponentArray(data: unknown, componentMap: Map<string, string>): { name: string; amount: number }[] {
    if (!data) return [];
    if (Array.isArray(data)) {
        return data.map((item: any) => ({ name: item.name ?? item.component ?? "Unknown", amount: num(item.amount ?? item.value) }));
    }
    if (typeof data === "object") {
        return Object.entries(data as Record<string, unknown>)
            .map(([code, amount]) => ({ name: componentMap.get(code) ?? COMPONENT_LABELS[code] ?? code.replace(/_/g, " "), amount: num(amount) }))
            .filter(item => item.amount !== 0);
    }
    return [];
}

function getEmpName(p: any) {
    const emp = p.employee;
    if (emp) return `${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim() || emp.employeeId || p.employeeId;
    return p.employeeName || p.employeeId;
}
function getEmpCode(p: any) { return p.employee?.employeeId ?? p.employeeCode ?? ""; }
function getEmpDept(p: any) { return p.employee?.department?.name ?? ""; }
function getEmpDesignation(p: any) { return p.employee?.designation?.name ?? p.designation ?? ""; }

/* ── Screen ── */

export function PayslipScreen() {
    const fmt = useCompanyFormatter();
    const [search, setSearch] = useState("");
    const [monthFilter, setMonthFilter] = useState("");
    const [detailId, setDetailId] = useState<string | null>(null);
    const [filterMonth, setFilterMonth] = useState<number | undefined>();
    const [filterYear, setFilterYear] = useState<number | undefined>();

    const payslipsQuery = usePayslips({ month: filterMonth, year: filterYear });
    const detailQuery = usePayslip(detailId ?? "");
    const componentsQuery = useSalaryComponents();
    const emailMutation = useEmailPayslip();

    const payslips: any[] = payslipsQuery.data?.data ?? [];
    const detail: any = detailQuery.data?.data ?? null;

    const componentMap = useMemo(() => {
        const map = new Map<string, string>();
        const comps: any[] = componentsQuery.data?.data ?? [];
        comps.forEach((c: any) => { if (c.code) { map.set(c.code, c.name); map.set(c.code.toUpperCase(), c.name); } });
        return map;
    }, [componentsQuery.data]);

    const filtered = payslips.filter((p: any) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return getEmpName(p).toLowerCase().includes(q) || getEmpCode(p).toLowerCase().includes(q) || getEmpDept(p).toLowerCase().includes(q);
    });

    const handleMonthChange = (val: string) => {
        setMonthFilter(val);
        if (val) { const [y, m] = val.split("-"); setFilterYear(Number(y)); setFilterMonth(Number(m)); }
        else { setFilterYear(undefined); setFilterMonth(undefined); }
    };

    const handleEmail = async (id: string) => {
        try { await emailMutation.mutateAsync(id); showSuccess("Payslip Emailed", "Payslip has been sent to the employee."); }
        catch (err) { showApiError(err); }
    };

    const detailEarnings = useMemo(() => toComponentArray(detail?.earnings, componentMap), [detail?.earnings, componentMap]);
    const detailDeductions = useMemo(() => toComponentArray(detail?.deductions, componentMap), [detail?.deductions, componentMap]);
    const detailEmployerContribs = useMemo(() => toComponentArray(detail?.employerContributions, componentMap), [detail?.employerContributions, componentMap]);

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
                        <input type="text" placeholder="Search by employee name, ID, or department..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                    </div>
                    <input type="month" value={monthFilter} onChange={(e) => handleMonthChange(e.target.value)} className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                </div>
            </div>

            {payslipsQuery.isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">Failed to load payslips. Please try again.</div>
            )}

            {/* Data Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {payslipsQuery.isLoading ? <SkeletonTable rows={8} cols={7} /> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Employee</th>
                                    <th className="py-4 px-6 font-bold">Month / Year</th>
                                    <th className="py-4 px-6 font-bold text-right">Gross (₹)</th>
                                    <th className="py-4 px-6 font-bold text-right">Deductions (₹)</th>
                                    <th className="py-4 px-6 font-bold text-right">Net Pay (₹)</th>
                                    <th className="py-4 px-6 font-bold text-center">Emailed</th>
                                    <th className="py-4 px-6 font-bold text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.map((p: any) => (
                                    <tr key={p.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0"><FileText className="w-4 h-4 text-primary-600 dark:text-primary-400" /></div>
                                                <div>
                                                    <span className="font-bold text-primary-950 dark:text-white">{getEmpName(p)}</span>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        {getEmpCode(p) && <span className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500">{getEmpCode(p)}</span>}
                                                        {getEmpDept(p) && <span className="text-[10px] text-neutral-400 dark:text-neutral-500">· {getEmpDept(p)}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">{p.month && p.year ? `${MONTHS[(p.month ?? 1) - 1]} ${p.year}` : "—"}</td>
                                        <td className="py-4 px-6 text-right font-mono font-semibold text-primary-950 dark:text-white">{inr(p.grossEarnings ?? p.grossPay)}</td>
                                        <td className="py-4 px-6 text-right font-mono text-neutral-600 dark:text-neutral-400">{inr(p.totalDeductions)}</td>
                                        <td className="py-4 px-6 text-right font-mono font-bold text-success-700 dark:text-success-400">{inr(p.netPay)}</td>
                                        <td className="py-4 px-6 text-center">
                                            {p.emailedAt ? (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50"><CheckCircle size={10} /> Sent</span>
                                            ) : (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-neutral-100 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700">Pending</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button onClick={() => setDetailId(p.id)} className="p-1.5 rounded-lg text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/40 border border-primary-200 dark:border-primary-800/50 transition-colors" title="View Payslip"><Eye size={14} /></button>
                                                <button onClick={() => handleEmail(p.id)} disabled={emailMutation.isPending} className="p-1.5 rounded-lg text-info-600 dark:text-info-400 bg-info-50 dark:bg-info-900/20 hover:bg-info-100 dark:hover:bg-info-900/40 border border-info-200 dark:border-info-800/50 transition-colors disabled:opacity-50" title="Email Payslip"><Mail size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && !payslipsQuery.isLoading && (
                                    <tr><td colSpan={7}><EmptyState icon="list" title="No payslips found" message="Payslips will appear here after a payroll run is disbursed." /></td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ══════════════════════════════════════════════════════════
                PROFESSIONAL PAYSLIP DETAIL MODAL
               ══════════════════════════════════════════════════════════ */}
            {detailId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setDetailId(null)}>
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">Payslip</h2>
                            <div className="flex items-center gap-2">
                                {detail?.pdfUrl && <R2Link fileKey={detail.pdfUrl} className="p-1.5 rounded-lg text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors" title="Download PDF"><Download size={16} /></R2Link>}
                                <button onClick={() => setDetailId(null)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                            </div>
                        </div>
                        <div className="overflow-y-auto flex-1">
                            {detailQuery.isLoading ? (
                                <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-primary-500" /></div>
                            ) : detail ? (
                                <div className="p-6 space-y-0">
                                    <div className="border border-neutral-200 dark:border-neutral-700 rounded-2xl overflow-hidden">
                                        {/* Header Banner */}
                                        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-5 text-white">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><Building2 size={20} /></div>
                                                    <div>
                                                        <p className="font-bold text-lg">Payslip</p>
                                                        <p className="text-primary-200 text-xs font-medium">Salary Statement</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xl font-bold">{detail.month && detail.year ? `${MONTHS[(detail.month ?? 1) - 1]} ${detail.year}` : "—"}</p>
                                                    <p className="text-primary-200 text-xs font-medium">Pay Period</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Employee Details */}
                                        <div className="bg-neutral-50 dark:bg-neutral-800/50 px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div>
                                                    <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Employee Name</p>
                                                    <p className="text-sm font-bold text-primary-950 dark:text-white mt-0.5">{getEmpName(detail)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Employee ID</p>
                                                    <p className="text-sm font-mono font-semibold text-neutral-700 dark:text-neutral-300 mt-0.5">{getEmpCode(detail) || "—"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Department</p>
                                                    <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mt-0.5">{getEmpDept(detail) || "—"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Designation</p>
                                                    <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mt-0.5">{getEmpDesignation(detail) || "—"}</p>
                                                </div>
                                            </div>
                                            {(detail.workingDays != null || detail.presentDays != null) && (
                                                <div className="flex gap-6 mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                                                    {detail.workingDays != null && <div className="flex items-center gap-1.5 text-xs text-neutral-500"><Calendar size={11} /><span>Working Days: <span className="font-bold text-neutral-700 dark:text-neutral-300">{detail.workingDays}</span></span></div>}
                                                    {detail.presentDays != null && <div className="flex items-center gap-1.5 text-xs text-neutral-500"><CheckCircle size={11} /><span>Present: <span className="font-bold text-neutral-700 dark:text-neutral-300">{num(detail.presentDays)}</span></span></div>}
                                                    {num(detail.lopDays) > 0 && <div className="flex items-center gap-1.5 text-xs text-danger-500"><X size={11} /><span>LOP: <span className="font-bold">{num(detail.lopDays)}</span></span></div>}
                                                </div>
                                            )}
                                        </div>

                                        {/* Earnings & Deductions Side by Side */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-neutral-200 dark:divide-neutral-700">
                                            <div className="p-5">
                                                <h4 className="text-xs font-bold text-success-600 dark:text-success-400 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Banknote size={12} /> Earnings</h4>
                                                {detailEarnings.map((e, i) => (
                                                    <div key={i} className="flex justify-between py-2 border-b border-neutral-100 dark:border-neutral-800/50 last:border-0">
                                                        <span className="text-xs text-neutral-600 dark:text-neutral-400">{e.name}</span>
                                                        <span className="text-xs font-mono font-semibold text-neutral-800 dark:text-neutral-200">{inr(e.amount)}</span>
                                                    </div>
                                                ))}
                                                {detailEarnings.length === 0 && <p className="text-xs text-neutral-400 py-2">No earnings data</p>}
                                                {detail.arrearsAmount && num(detail.arrearsAmount) > 0 && (
                                                    <div className="flex justify-between py-2 border-b border-neutral-100 dark:border-neutral-800/50 last:border-0">
                                                        <span className="text-xs text-accent-600 dark:text-accent-400 font-medium">Arrears</span>
                                                        <span className="text-xs font-mono font-semibold text-accent-600 dark:text-accent-400">{inr(detail.arrearsAmount)}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between py-2.5 mt-1 border-t-2 border-success-200 dark:border-success-800/50">
                                                    <span className="text-xs font-bold text-success-700 dark:text-success-400">Total Earnings</span>
                                                    <span className="text-xs font-mono font-bold text-success-700 dark:text-success-400">{inr(detail.grossEarnings ?? detail.grossPay)}</span>
                                                </div>
                                            </div>
                                            <div className="p-5">
                                                <h4 className="text-xs font-bold text-danger-600 dark:text-danger-400 uppercase tracking-wider mb-3 flex items-center gap-1.5"><CreditCard size={12} /> Deductions</h4>
                                                {detailDeductions.map((d, i) => (
                                                    <div key={i} className="flex justify-between py-2 border-b border-neutral-100 dark:border-neutral-800/50 last:border-0">
                                                        <span className="text-xs text-neutral-600 dark:text-neutral-400">{d.name}</span>
                                                        <span className="text-xs font-mono font-semibold text-neutral-800 dark:text-neutral-200">{inr(d.amount)}</span>
                                                    </div>
                                                ))}
                                                {detailDeductions.length === 0 && <p className="text-xs text-neutral-400 py-2">No deductions</p>}
                                                <div className="flex justify-between py-2.5 mt-1 border-t-2 border-danger-200 dark:border-danger-800/50">
                                                    <span className="text-xs font-bold text-danger-700 dark:text-danger-400">Total Deductions</span>
                                                    <span className="text-xs font-mono font-bold text-danger-700 dark:text-danger-400">{inr(detail.totalDeductions)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Employer Contributions */}
                                        {detailEmployerContribs.length > 0 && (
                                            <div className="border-t border-neutral-200 dark:border-neutral-700 px-5 py-4">
                                                <h4 className="text-xs font-bold text-info-600 dark:text-info-400 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Building2 size={12} /> Employer Contributions</h4>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-1">
                                                    {detailEmployerContribs.map((c, i) => (
                                                        <div key={i} className="flex justify-between py-1.5">
                                                            <span className="text-xs text-neutral-500 dark:text-neutral-400">{c.name}</span>
                                                            <span className="text-xs font-mono font-semibold text-neutral-700 dark:text-neutral-300">{inr(c.amount)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* NET PAY Hero */}
                                        <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-900/10 px-6 py-5 border-t border-primary-200 dark:border-primary-800/50">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider">Net Pay</p>
                                                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Amount credited to bank</p>
                                                </div>
                                                <p className="text-3xl font-extrabold font-mono text-primary-700 dark:text-primary-400">{inr(detail.netPay)}</p>
                                            </div>
                                        </div>

                                        {/* Bank & Statutory */}
                                        {(detail.employee?.bankAccountNumber || detail.employee?.panNumber || detail.employee?.uan) && (
                                            <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/30">
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                    {detail.employee?.bankAccountNumber && (
                                                        <div>
                                                            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Bank A/C</p>
                                                            <p className="text-xs font-mono text-neutral-600 dark:text-neutral-400 mt-0.5">****{detail.employee.bankAccountNumber.slice(-4)}{detail.employee.bankName && ` (${detail.employee.bankName})`}</p>
                                                        </div>
                                                    )}
                                                    {detail.employee?.panNumber && <div><p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">PAN</p><p className="text-xs font-mono text-neutral-600 dark:text-neutral-400 mt-0.5">{detail.employee.panNumber}</p></div>}
                                                    {detail.employee?.uan && <div><p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">UAN</p><p className="text-xs font-mono text-neutral-600 dark:text-neutral-400 mt-0.5">{detail.employee.uan}</p></div>}
                                                </div>
                                            </div>
                                        )}

                                        {/* Footer */}
                                        <div className="px-6 py-3 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/30">
                                            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 italic text-center">
                                                This is a computer-generated payslip and does not require a signature.
                                                {detail.tdsProvisional && " TDS shown is provisional and subject to final computation."}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-neutral-400 text-center py-12">Payslip not found</p>
                            )}
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setDetailId(null)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Close</button>
                            <button onClick={() => { if (detailId) handleEmail(detailId); }} disabled={emailMutation.isPending} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
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
