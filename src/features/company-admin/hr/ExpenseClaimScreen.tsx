import { useState } from "react";
import {
    Receipt,
    Plus,
    Edit3,
    Loader2,
    X,
    Search,
    Filter,
    Eye,
    CheckCircle2,
    XCircle,
    Clock,
    IndianRupee,
    Calendar,
    Paperclip,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useExpenseClaims } from "@/features/company-admin/api/use-recruitment-queries";
import { useEmployees } from "@/features/company-admin/api/use-hr-queries";
import {
    useCreateExpenseClaim,
    useUpdateExpenseClaim,
    useApproveExpenseClaim,
    useRejectExpenseClaim,
} from "@/features/company-admin/api/use-recruitment-mutations";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Constants ── */

const STATUS_FILTERS = ["All", "Draft", "Submitted", "Approved", "Rejected", "Paid"];
const EXPENSE_CATEGORIES = ["Travel", "Meals", "Accommodation", "Office Supplies", "Software", "Training", "Client Entertainment", "Communication", "Other"];

const EMPTY_CLAIM = {
    employeeId: "",
    title: "",
    category: "Travel",
    amount: "",
    currency: "INR",
    expenseDate: "",
    description: "",
    receiptUrl: "",
    projectCode: "",
};

const formatDate = (d: string | null | undefined) => {
    if (!d) return "\u2014";
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const formatCurrency = (amt: any) => {
    if (!amt) return "\u2014";
    return `\u20B9${Number(amt).toLocaleString("en-IN")}`;
};

/* ── Badge ── */

function ClaimStatusBadge({ status }: { status: string }) {
    const s = status?.toLowerCase();
    const map: Record<string, { icon: typeof Clock; cls: string }> = {
        draft: { icon: Clock, cls: "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700" },
        submitted: { icon: Clock, cls: "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50" },
        approved: { icon: CheckCircle2, cls: "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50" },
        rejected: { icon: XCircle, cls: "bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50" },
        paid: { icon: CheckCircle2, cls: "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50" },
    };
    const c = map[s] ?? map.draft;
    const Icon = c.icon;
    return (
        <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize", c.cls)}>
            <Icon size={10} />{status}
        </span>
    );
}

/* ── Screen ── */

export function ExpenseClaimScreen() {
    const [activeTab, setActiveTab] = useState<"pending" | "all">("pending");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...EMPTY_CLAIM });
    const [detailTarget, setDetailTarget] = useState<any>(null);
    const [rejectTarget, setRejectTarget] = useState<any>(null);
    const [rejectNote, setRejectNote] = useState("");

    const claimsQuery = useExpenseClaims(
        activeTab === "pending" ? { status: "submitted" } : statusFilter !== "All" ? { status: statusFilter.toLowerCase() } : undefined
    );
    const employeesQuery = useEmployees();

    const createClaim = useCreateExpenseClaim();
    const updateClaim = useUpdateExpenseClaim();
    const approveClaim = useApproveExpenseClaim();
    const rejectClaim = useRejectExpenseClaim();

    const claims: any[] = claimsQuery.data?.data ?? [];
    const employees: any[] = employeesQuery.data?.data ?? [];

    const employeeName = (id: string) => {
        const emp = employees.find((e: any) => e.id === id);
        if (!emp) return id;
        return [emp.firstName, emp.lastName].filter(Boolean).join(" ") || emp.fullName || emp.email || id;
    };

    const filtered = claims.filter((c: any) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return employeeName(c.employeeId)?.toLowerCase().includes(s) || c.title?.toLowerCase().includes(s) || c.category?.toLowerCase().includes(s);
    });

    const totalAmount = filtered.reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0);

    const openCreate = () => { setEditingId(null); setForm({ ...EMPTY_CLAIM }); setModalOpen(true); };
    const openEdit = (c: any) => {
        setEditingId(c.id);
        setForm({
            employeeId: c.employeeId ?? "", title: c.title ?? "", category: c.category ?? "Travel",
            amount: c.amount ?? "", currency: c.currency ?? "INR", expenseDate: c.expenseDate ?? "",
            description: c.description ?? "", receiptUrl: c.receiptUrl ?? "", projectCode: c.projectCode ?? "",
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        try {
            if (editingId) { await updateClaim.mutateAsync({ id: editingId, data: form }); showSuccess("Claim Updated", `${form.title} updated.`); }
            else { await createClaim.mutateAsync(form); showSuccess("Claim Created", `${form.title} submitted.`); }
            setModalOpen(false);
        } catch (err) { showApiError(err); }
    };

    const handleApprove = async (c: any) => {
        try { await approveClaim.mutateAsync(c.id); showSuccess("Claim Approved", `Expense claim by ${employeeName(c.employeeId)} approved.`); }
        catch (err) { showApiError(err); }
    };

    const handleReject = async () => {
        if (!rejectTarget) return;
        try { await rejectClaim.mutateAsync(rejectTarget.id); showSuccess("Claim Rejected", "Expense claim rejected."); setRejectTarget(null); setRejectNote(""); }
        catch (err) { showApiError(err); }
    };

    const saving = createClaim.isPending || updateClaim.isPending;
    const updateField = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Expense Claims</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Submit, review, and process employee expense claims</p>
                </div>
                <button onClick={openCreate} className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none">
                    <Plus className="w-5 h-5" /> New Claim
                </button>
            </div>

            {/* Summary Card */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: "Total Claims", value: filtered.length, cls: "text-primary-600 dark:text-primary-400" },
                    { label: "Total Amount", value: formatCurrency(totalAmount), cls: "text-accent-600 dark:text-accent-400" },
                    { label: "Pending", value: claims.filter((c: any) => c.status?.toLowerCase() === "submitted").length, cls: "text-warning-600 dark:text-warning-400" },
                    { label: "Approved", value: claims.filter((c: any) => c.status?.toLowerCase() === "approved").length, cls: "text-success-600 dark:text-success-400" },
                ].map((s) => (
                    <div key={s.label} className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                        <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">{s.label}</p>
                        <p className={cn("text-2xl font-bold mt-1", s.cls)}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl w-fit">
                <button onClick={() => setActiveTab("pending")} className={cn("px-5 py-2 rounded-lg text-sm font-bold transition-all", activeTab === "pending" ? "bg-white dark:bg-neutral-700 text-primary-700 dark:text-primary-400 shadow-sm" : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300")}>
                    <span className="flex items-center gap-2"><Clock size={14} />Pending Review</span>
                </button>
                <button onClick={() => setActiveTab("all")} className={cn("px-5 py-2 rounded-lg text-sm font-bold transition-all", activeTab === "all" ? "bg-white dark:bg-neutral-700 text-primary-700 dark:text-primary-400 shadow-sm" : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300")}>
                    <span className="flex items-center gap-2"><Receipt size={14} />All Claims</span>
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                    <input type="text" placeholder="Search claims..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                </div>
                {activeTab === "all" && (
                    <div className="flex items-center gap-2">
                        <Filter size={14} className="text-neutral-400" />
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-semibold text-neutral-700 dark:text-neutral-300 focus:outline-none">
                            {STATUS_FILTERS.map((f) => <option key={f} value={f}>{f}</option>)}
                        </select>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {claimsQuery.isLoading ? <SkeletonTable rows={6} cols={8} /> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1100px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Employee</th>
                                    <th className="py-4 px-6 font-bold">Title</th>
                                    <th className="py-4 px-6 font-bold">Category</th>
                                    <th className="py-4 px-6 font-bold text-right">Amount</th>
                                    <th className="py-4 px-6 font-bold">Date</th>
                                    <th className="py-4 px-6 font-bold text-center">Status</th>
                                    <th className="py-4 px-6 font-bold">Project</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.map((c: any) => (
                                    <tr key={c.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center shrink-0 text-xs font-bold text-accent-700 dark:text-accent-400">{employeeName(c.employeeId).charAt(0)}</div>
                                                <span className="font-bold text-primary-950 dark:text-white">{employeeName(c.employeeId)}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">{c.title || "\u2014"}</td>
                                        <td className="py-4 px-6"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-50 text-accent-700 border border-accent-200 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50">{c.category}</span></td>
                                        <td className="py-4 px-6 text-right font-bold text-primary-950 dark:text-white">{formatCurrency(c.amount)}</td>
                                        <td className="py-4 px-6 text-xs text-neutral-600 dark:text-neutral-400">{formatDate(c.expenseDate)}</td>
                                        <td className="py-4 px-6 text-center"><ClaimStatusBadge status={c.status ?? "Draft"} /></td>
                                        <td className="py-4 px-6 text-xs text-neutral-500 dark:text-neutral-400">{c.projectCode || "\u2014"}</td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => setDetailTarget(c)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="View"><Eye size={15} /></button>
                                                {c.status?.toLowerCase() === "submitted" && (
                                                    <>
                                                        <button onClick={() => handleApprove(c)} disabled={approveClaim.isPending} className="p-2 text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20 rounded-lg transition-colors" title="Approve"><CheckCircle2 size={15} /></button>
                                                        <button onClick={() => setRejectTarget(c)} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" title="Reject"><XCircle size={15} /></button>
                                                    </>
                                                )}
                                                {(c.status?.toLowerCase() === "draft") && (
                                                    <button onClick={() => openEdit(c)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit"><Edit3 size={15} /></button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && !claimsQuery.isLoading && (
                                    <tr><td colSpan={8}><EmptyState icon="list" title="No expense claims found" message={activeTab === "pending" ? "No claims awaiting review." : "Submit a new expense claim."} /></td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Create/Edit Modal ── */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{editingId ? "Edit Claim" : "New Expense Claim"}</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Employee</label>
                                <select value={form.employeeId} onChange={(e) => updateField("employeeId", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                    <option value="">Select employee...</option>
                                    {employees.map((e: any) => <option key={e.id} value={e.id}>{[e.firstName, e.lastName].filter(Boolean).join(" ") || e.email}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Title</label>
                                <input type="text" value={form.title} onChange={(e) => updateField("title", e.target.value)} placeholder="e.g., Client meeting travel" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Category</label>
                                    <select value={form.category} onChange={(e) => updateField("category", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                        {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Amount (INR)</label>
                                    <input type="number" value={form.amount} onChange={(e) => updateField("amount", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Expense Date</label>
                                    <input type="date" value={form.expenseDate} onChange={(e) => updateField("expenseDate", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Project Code</label>
                                    <input type="text" value={form.projectCode} onChange={(e) => updateField("projectCode", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Description</label>
                                <textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} rows={3} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none" />
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {saving && <Loader2 size={14} className="animate-spin" />}{saving ? "Saving..." : editingId ? "Update" : "Submit"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Detail Modal ── */}
            {detailTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">Claim Details</h2>
                            <button onClick={() => setDetailTarget(null)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-neutral-400 uppercase font-semibold">Status</span>
                                <ClaimStatusBadge status={detailTarget.status ?? "Draft"} />
                            </div>
                            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 border border-primary-200 dark:border-primary-800/50 text-center">
                                <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase">Amount</span>
                                <p className="text-2xl font-bold text-primary-700 dark:text-primary-300 mt-1">{formatCurrency(detailTarget.amount)}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><span className="text-xs text-neutral-400 block mb-0.5">Employee</span><p className="font-bold text-primary-950 dark:text-white">{employeeName(detailTarget.employeeId)}</p></div>
                                <div><span className="text-xs text-neutral-400 block mb-0.5">Category</span><p className="font-bold text-primary-950 dark:text-white">{detailTarget.category}</p></div>
                                <div><span className="text-xs text-neutral-400 block mb-0.5">Expense Date</span><p className="font-semibold text-primary-950 dark:text-white">{formatDate(detailTarget.expenseDate)}</p></div>
                                <div><span className="text-xs text-neutral-400 block mb-0.5">Project</span><p className="font-semibold text-primary-950 dark:text-white">{detailTarget.projectCode || "\u2014"}</p></div>
                            </div>
                            {detailTarget.description && (
                                <div><span className="text-xs text-neutral-400 block mb-0.5">Description</span><p className="text-sm text-neutral-600 dark:text-neutral-400">{detailTarget.description}</p></div>
                            )}
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setDetailTarget(null)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Reject Dialog ── */}
            {rejectTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">Reject Expense Claim?</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Rejecting claim from <strong>{employeeName(rejectTarget.employeeId)}</strong> for {formatCurrency(rejectTarget.amount)}.</p>
                        <div>
                            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Reason (optional)</label>
                            <textarea value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} rows={2} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none" />
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => { setRejectTarget(null); setRejectNote(""); }} className="flex-1 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleReject} disabled={rejectClaim.isPending} className="flex-1 py-3 rounded-xl bg-danger-600 hover:bg-danger-700 text-white text-sm font-bold transition-colors disabled:opacity-50">{rejectClaim.isPending ? "Rejecting..." : "Reject"}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
