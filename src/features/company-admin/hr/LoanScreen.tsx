import { useState, useMemo } from "react";
import {
    Banknote,
    Plus,
    Loader2,
    X,
    Search,
    CheckCircle,
    ArrowRightCircle,
    XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLoans, useLoanPolicies } from "@/features/company-admin/api/use-payroll-queries";
import { useEmployees } from "@/features/company-admin/api/use-hr-queries";
import {
    useCreateLoan,
    useUpdateLoanStatus,
} from "@/features/company-admin/api/use-payroll-mutations";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Form atoms ── */

function NumberField({ label, value, onChange, placeholder, min }: { label: string; value: number; onChange: (v: number) => void; placeholder?: string; min?: number }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">{label}</label>
            <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} placeholder={placeholder} min={min} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
        </div>
    );
}

function SelectField({ label, value, onChange, options, placeholder }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder?: string }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">{label}</label>
            <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                <option value="">{placeholder ?? "Select..."}</option>
                {options.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
            </select>
        </div>
    );
}

function SectionLabel({ title }: { title: string }) {
    return (
        <div className="pt-3 pb-1">
            <h3 className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider">{title}</h3>
            <div className="h-px bg-primary-100 dark:bg-primary-900/30 mt-1.5" />
        </div>
    );
}

function LoanStatusBadge({ status }: { status: string }) {
    const colorMap: Record<string, string> = {
        pending: "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50",
        approved: "bg-info-50 text-info-700 border-info-200 dark:bg-info-900/20 dark:text-info-400 dark:border-info-800/50",
        disbursed: "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50",
        active: "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50",
        closed: "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700",
        rejected: "bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50",
    };
    const cls = colorMap[status?.toLowerCase()] ?? "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700";
    return (
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize", cls)}>
            {status || "Pending"}
        </span>
    );
}

const STATUS_FILTERS = [
    { value: "", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "disbursed", label: "Disbursed" },
    { value: "active", label: "Active" },
    { value: "closed", label: "Closed" },
    { value: "rejected", label: "Rejected" },
];

/* ── Empty form ── */

const EMPTY_LOAN = {
    employeeId: "",
    policyId: "",
    amount: 0,
    tenureMonths: 0,
};

/* ── Screen ── */

export function LoanScreen() {
    const { data, isLoading, isError } = useLoans();
    const policiesQuery = useLoanPolicies();
    const employeesQuery = useEmployees();
    const createMutation = useCreateLoan();
    const statusMutation = useUpdateLoanStatus();

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState({ ...EMPTY_LOAN });

    const loans: any[] = data?.data ?? [];
    const policies: any[] = policiesQuery.data?.data ?? [];
    const employees: any[] = employeesQuery.data?.data ?? [];

    const getEmployeeName = (id: string) => { const e = employees.find((emp: any) => emp.id === id); return e ? `${e.firstName ?? ""} ${e.lastName ?? ""}`.trim() : id; };
    const getPolicyName = (id: string) => policies.find((p: any) => p.id === id)?.name ?? id;

    const filtered = loans.filter((l: any) => {
        if (statusFilter && l.status?.toLowerCase() !== statusFilter) return false;
        if (!search) return true;
        const q = search.toLowerCase();
        return getEmployeeName(l.employeeId).toLowerCase().includes(q) || getPolicyName(l.policyId).toLowerCase().includes(q);
    });

    const openCreate = () => { setForm({ ...EMPTY_LOAN }); setModalOpen(true); };

    const handleCreate = async () => {
        try {
            await createMutation.mutateAsync(form);
            showSuccess("Loan Created", "New loan has been created.");
            setModalOpen(false);
        } catch (err) { showApiError(err); }
    };

    const handleStatusChange = async (loanId: string, newStatus: string) => {
        try {
            await statusMutation.mutateAsync({ id: loanId, data: { status: newStatus } });
            showSuccess("Status Updated", `Loan status changed to ${newStatus}.`);
        } catch (err) { showApiError(err); }
    };

    const updateField = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));

    // Auto-computed EMI
    const computedEMI = useMemo(() => {
        if (!form.amount || !form.tenureMonths) return 0;
        const policy = policies.find((p: any) => p.id === form.policyId);
        const rate = (policy?.interestRate ?? 0) / 100 / 12;
        if (rate === 0) return Math.round(form.amount / form.tenureMonths);
        const emi = (form.amount * rate * Math.pow(1 + rate, form.tenureMonths)) / (Math.pow(1 + rate, form.tenureMonths) - 1);
        return Math.round(emi);
    }, [form.amount, form.tenureMonths, form.policyId, policies]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Loans</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Manage employee loans, approvals, and disbursements</p>
                </div>
                <button onClick={openCreate} className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none">
                    <Plus className="w-5 h-5" />
                    New Loan
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                        <input type="text" placeholder="Search by employee or policy..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                    </div>
                    <div className="flex gap-2">
                        {STATUS_FILTERS.map((sf) => (
                            <button
                                key={sf.value}
                                onClick={() => setStatusFilter(sf.value)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
                                    statusFilter === sf.value
                                        ? "bg-primary-50 text-primary-700 border-primary-300 dark:bg-primary-900/30 dark:text-primary-400 dark:border-primary-700"
                                        : "bg-neutral-50 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700 hover:border-neutral-300"
                                )}
                            >
                                {sf.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
                    Failed to load loans. Please try again.
                </div>
            )}

            {/* Data Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? (
                    <SkeletonTable rows={5} cols={8} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1100px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Employee</th>
                                    <th className="py-4 px-6 font-bold">Policy</th>
                                    <th className="py-4 px-6 font-bold text-right">Amount (₹)</th>
                                    <th className="py-4 px-6 font-bold text-right">EMI (₹)</th>
                                    <th className="py-4 px-6 font-bold text-right">Outstanding (₹)</th>
                                    <th className="py-4 px-6 font-bold text-center">Status</th>
                                    <th className="py-4 px-6 font-bold">Disbursed Date</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.map((l: any) => {
                                    const status = (l.status ?? "pending").toLowerCase();
                                    return (
                                        <tr key={l.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-warning-50 dark:bg-warning-900/30 flex items-center justify-center shrink-0">
                                                        <Banknote className="w-4 h-4 text-warning-600 dark:text-warning-400" />
                                                    </div>
                                                    <span className="font-bold text-primary-950 dark:text-white">{getEmployeeName(l.employeeId)}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-xs text-neutral-600 dark:text-neutral-400">{getPolicyName(l.policyId)}</td>
                                            <td className="py-4 px-6 text-right font-mono font-semibold text-primary-950 dark:text-white">₹{(l.amount ?? 0).toLocaleString("en-IN")}</td>
                                            <td className="py-4 px-6 text-right font-mono text-neutral-600 dark:text-neutral-400">₹{(l.emi ?? 0).toLocaleString("en-IN")}</td>
                                            <td className="py-4 px-6 text-right font-mono text-neutral-600 dark:text-neutral-400">₹{(l.outstanding ?? l.amount ?? 0).toLocaleString("en-IN")}</td>
                                            <td className="py-4 px-6 text-center"><LoanStatusBadge status={l.status ?? "pending"} /></td>
                                            <td className="py-4 px-6 text-xs text-neutral-600 dark:text-neutral-400">{l.disbursedDate || "\u2014"}</td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {status === "pending" && (
                                                        <>
                                                            <button onClick={() => handleStatusChange(l.id, "approved")} className="p-1.5 text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20 rounded-lg transition-colors" title="Approve"><CheckCircle size={15} /></button>
                                                            <button onClick={() => handleStatusChange(l.id, "rejected")} className="p-1.5 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" title="Reject"><XCircle size={15} /></button>
                                                        </>
                                                    )}
                                                    {status === "approved" && (
                                                        <button onClick={() => handleStatusChange(l.id, "disbursed")} className="p-1.5 text-info-600 hover:bg-info-50 dark:hover:bg-info-900/20 rounded-lg transition-colors" title="Disburse"><ArrowRightCircle size={15} /></button>
                                                    )}
                                                    {(status === "disbursed" || status === "active") && (
                                                        <button onClick={() => handleStatusChange(l.id, "closed")} className="p-1.5 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors" title="Close"><XCircle size={15} /></button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filtered.length === 0 && !isLoading && (
                                    <tr><td colSpan={8}><EmptyState icon="list" title="No loans found" message="Create a new loan to get started." action={{ label: "New Loan", onClick: openCreate }} /></td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Create Modal ── */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">New Loan</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <SelectField label="Employee" value={form.employeeId} onChange={(v) => updateField("employeeId", v)} options={employees.map((e: any) => ({ value: e.id, label: `${e.firstName ?? ""} ${e.lastName ?? ""}`.trim() || e.id }))} placeholder="Select employee..." />
                            <SelectField label="Loan Policy" value={form.policyId} onChange={(v) => updateField("policyId", v)} options={policies.filter((p: any) => p.status === "Active").map((p: any) => ({ value: p.id, label: p.name }))} placeholder="Select policy..." />
                            <div className="grid grid-cols-2 gap-4">
                                <NumberField label="Loan Amount (₹)" value={form.amount} onChange={(v) => updateField("amount", v)} min={0} />
                                <NumberField label="Tenure (months)" value={form.tenureMonths} onChange={(v) => updateField("tenureMonths", v)} min={1} />
                            </div>

                            {/* Auto-computed EMI */}
                            {computedEMI > 0 && (
                                <>
                                    <SectionLabel title="Auto-Computed EMI" />
                                    <div className="bg-primary-50/50 dark:bg-primary-900/10 rounded-xl border border-primary-100 dark:border-primary-800/50 p-4">
                                        <div className="flex justify-between py-1.5 text-sm">
                                            <span className="text-neutral-700 dark:text-neutral-300">Monthly EMI</span>
                                            <span className="font-mono font-bold text-primary-700 dark:text-primary-400">₹{computedEMI.toLocaleString("en-IN")}</span>
                                        </div>
                                        <div className="flex justify-between py-1.5 text-sm">
                                            <span className="text-neutral-700 dark:text-neutral-300">Total Repayment</span>
                                            <span className="font-mono font-semibold text-primary-950 dark:text-white">₹{(computedEMI * form.tenureMonths).toLocaleString("en-IN")}</span>
                                        </div>
                                        <div className="flex justify-between py-1.5 text-sm">
                                            <span className="text-neutral-700 dark:text-neutral-300">Total Interest</span>
                                            <span className="font-mono text-neutral-600 dark:text-neutral-400">₹{(computedEMI * form.tenureMonths - form.amount).toLocaleString("en-IN")}</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleCreate} disabled={createMutation.isPending} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {createMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                {createMutation.isPending ? "Creating..." : "Create Loan"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
