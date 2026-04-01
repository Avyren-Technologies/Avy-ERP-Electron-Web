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
    Calendar,
    Paperclip,
    Trash2,
    ExternalLink,
    FileText,
    Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    useExpenseClaims,
    useExpenseCategories,
    useExpenseClaim,
} from "@/features/company-admin/api/use-recruitment-queries";
import { useEmployees } from "@/features/company-admin/api/use-hr-queries";
import {
    useCreateExpenseClaim,
    useUpdateExpenseClaim,
    useApproveExpenseClaim,
    useRejectExpenseClaim,
    useCreateExpenseCategory,
    useUpdateExpenseCategory,
    useDeleteExpenseCategory,
} from "@/features/company-admin/api/use-recruitment-mutations";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Constants ── */

const STATUS_FILTERS = ["All", "Draft", "Submitted", "Approved", "Rejected", "Paid"];

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

const EMPTY_CATEGORY = {
    name: "",
    code: "",
    description: "",
    requiresReceipt: false,
    receiptThreshold: "",
    maxAmountPerClaim: "",
    maxAmountPerMonth: "",
    maxAmountPerYear: "",
};

const formatDate = (d: string | null | undefined) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const formatCurrency = (amt: any) => {
    if (!amt && amt !== 0) return "—";
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
    const [mainTab, setMainTab] = useState<"claims" | "categories">("claims");
    const [activeTab, setActiveTab] = useState<"pending" | "all">("pending");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...EMPTY_CLAIM });
    const [detailTarget, setDetailTarget] = useState<any>(null);
    const [approveTarget, setApproveTarget] = useState<any>(null);
    const [approvedAmount, setApprovedAmount] = useState("");
    const [itemApprovals, setItemApprovals] = useState<Record<string, { approved: boolean; approvedAmount: string; reason: string }>>({});
    const [rejectTarget, setRejectTarget] = useState<any>(null);
    const [rejectNote, setRejectNote] = useState("");

    // Category management state
    const [categoryModalOpen, setCategoryModalOpen] = useState(false);
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [categoryForm, setCategoryForm] = useState({ ...EMPTY_CATEGORY });
    const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);

    const claimsQuery = useExpenseClaims(
        activeTab === "pending" ? { status: "submitted" } : statusFilter !== "All" ? { status: statusFilter.toLowerCase() } : undefined
    );
    const employeesQuery = useEmployees();
    const categoriesQuery = useExpenseCategories({ includeInactive: true });
    const detailQuery = useExpenseClaim(detailTarget?.id ?? "");

    const createClaim = useCreateExpenseClaim();
    const updateClaim = useUpdateExpenseClaim();
    const approveClaim = useApproveExpenseClaim();
    const rejectClaim = useRejectExpenseClaim();
    const createCategory = useCreateExpenseCategory();
    const updateCategory = useUpdateExpenseCategory();
    const deleteCategory = useDeleteExpenseCategory();

    const claims: any[] = claimsQuery.data?.data ?? [];
    const employees: any[] = employeesQuery.data?.data ?? [];
    const categories: any[] = categoriesQuery.data?.data ?? [];
    const categoryNames = categories.filter((c: any) => c.isActive !== false).map((c: any) => c.name);

    const employeeName = (id: string) => {
        const emp = employees.find((e: any) => e.id === id);
        if (!emp) return id;
        return [emp.firstName, emp.lastName].filter(Boolean).join(" ") || emp.fullName || emp.email || id;
    };

    const filtered = claims.filter((c: any) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return employeeName(c.employeeId)?.toLowerCase().includes(s) || c.title?.toLowerCase().includes(s) || c.category?.toLowerCase().includes(s) || c.claimNumber?.toLowerCase().includes(s);
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
            const payload: any = {
                employeeId: form.employeeId,
                title: form.title,
                amount: Number(form.amount) || 0,
                category: form.category,
                description: form.description || undefined,
                tripDate: form.expenseDate || undefined,
            };
            if (editingId) { await updateClaim.mutateAsync({ id: editingId, data: payload }); showSuccess("Claim Updated", `${form.title} updated.`); }
            else { await createClaim.mutateAsync(payload); showSuccess("Claim Created", `${form.title} submitted.`); }
            setModalOpen(false);
        } catch (err) { showApiError(err); }
    };

    const openApproveModal = (c: any) => {
        setApproveTarget(c);
        setApprovedAmount(String(c.amount ?? ""));
        // Initialize item approvals if claim has items
        const items = c.items ?? [];
        const approvalMap: Record<string, { approved: boolean; approvedAmount: string; reason: string }> = {};
        items.forEach((item: any) => {
            approvalMap[item.id] = { approved: true, approvedAmount: String(item.amount ?? ""), reason: "" };
        });
        setItemApprovals(approvalMap);
    };

    const handleApprove = async () => {
        if (!approveTarget) return;
        try {
            const data: any = {};
            const claimAmount = Number(approveTarget.amount) || 0;
            const approved = Number(approvedAmount) || 0;
            if (approved !== claimAmount) {
                data.approvedAmount = approved;
            }
            const items = approveTarget.items ?? [];
            if (items.length > 0) {
                data.itemApprovals = items.map((item: any) => {
                    const ia = itemApprovals[item.id];
                    return {
                        itemId: item.id,
                        approved: ia?.approved ?? true,
                        approvedAmount: ia ? Number(ia.approvedAmount) || 0 : Number(item.amount),
                        reason: ia?.reason || undefined,
                    };
                });
            }
            await approveClaim.mutateAsync({ id: approveTarget.id, data });
            showSuccess("Claim Approved", `Expense claim by ${employeeName(approveTarget.employeeId)} approved.`);
            setApproveTarget(null);
        } catch (err) { showApiError(err); }
    };

    const handleReject = async () => {
        if (!rejectTarget) return;
        try {
            await rejectClaim.mutateAsync({ id: rejectTarget.id, data: { rejectionReason: rejectNote || undefined } });
            showSuccess("Claim Rejected", "Expense claim rejected.");
            setRejectTarget(null);
            setRejectNote("");
        } catch (err) { showApiError(err); }
    };

    // Category handlers
    const openCreateCategory = () => { setEditingCategoryId(null); setCategoryForm({ ...EMPTY_CATEGORY }); setCategoryModalOpen(true); };
    const openEditCategory = (cat: any) => {
        setEditingCategoryId(cat.id);
        setCategoryForm({
            name: cat.name ?? "",
            code: cat.code ?? "",
            description: cat.description ?? "",
            requiresReceipt: cat.requiresReceipt ?? false,
            receiptThreshold: cat.receiptThreshold ?? "",
            maxAmountPerClaim: cat.maxAmountPerClaim ?? "",
            maxAmountPerMonth: cat.maxAmountPerMonth ?? "",
            maxAmountPerYear: cat.maxAmountPerYear ?? "",
        });
        setCategoryModalOpen(true);
    };

    const handleSaveCategory = async () => {
        try {
            const payload: any = {
                name: categoryForm.name,
                code: categoryForm.code,
                description: categoryForm.description || undefined,
                requiresReceipt: categoryForm.requiresReceipt,
                receiptThreshold: categoryForm.receiptThreshold ? Number(categoryForm.receiptThreshold) : undefined,
                maxAmountPerClaim: categoryForm.maxAmountPerClaim ? Number(categoryForm.maxAmountPerClaim) : undefined,
                maxAmountPerMonth: categoryForm.maxAmountPerMonth ? Number(categoryForm.maxAmountPerMonth) : undefined,
                maxAmountPerYear: categoryForm.maxAmountPerYear ? Number(categoryForm.maxAmountPerYear) : undefined,
            };
            if (editingCategoryId) {
                await updateCategory.mutateAsync({ id: editingCategoryId, data: payload });
                showSuccess("Category Updated", `${categoryForm.name} updated.`);
            } else {
                await createCategory.mutateAsync(payload);
                showSuccess("Category Created", `${categoryForm.name} created.`);
            }
            setCategoryModalOpen(false);
        } catch (err) { showApiError(err); }
    };

    const handleDeleteCategory = async () => {
        if (!deletingCategoryId) return;
        try {
            await deleteCategory.mutateAsync(deletingCategoryId);
            showSuccess("Category Deleted", "Expense category deleted.");
            setDeletingCategoryId(null);
        } catch (err) { showApiError(err); }
    };

    const saving = createClaim.isPending || updateClaim.isPending;
    const savingCategory = createCategory.isPending || updateCategory.isPending;
    const updateField = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));
    const updateCategoryField = (k: string, v: any) => setCategoryForm((p) => ({ ...p, [k]: v }));

    // Detail modal data: use fetched detail if available, fallback to detailTarget
    const detailData = detailQuery.data?.data ?? detailTarget;
    const detailItems: any[] = detailData?.items ?? [];
    const detailReceipts: any[] = detailData?.receipts ?? [];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Expense Claims</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Submit, review, and process employee expense claims</p>
                </div>
                <button onClick={mainTab === "claims" ? openCreate : openCreateCategory} className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none">
                    <Plus className="w-5 h-5" /> {mainTab === "claims" ? "New Claim" : "New Category"}
                </button>
            </div>

            {/* Main Tabs: Claims vs Categories */}
            <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl w-fit">
                <button onClick={() => setMainTab("claims")} className={cn("px-5 py-2 rounded-lg text-sm font-bold transition-all", mainTab === "claims" ? "bg-white dark:bg-neutral-700 text-primary-700 dark:text-primary-400 shadow-sm" : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300")}>
                    <span className="flex items-center gap-2"><Receipt size={14} />Claims</span>
                </button>
                <button onClick={() => setMainTab("categories")} className={cn("px-5 py-2 rounded-lg text-sm font-bold transition-all", mainTab === "categories" ? "bg-white dark:bg-neutral-700 text-primary-700 dark:text-primary-400 shadow-sm" : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300")}>
                    <span className="flex items-center gap-2"><Settings size={14} />Categories</span>
                </button>
            </div>

            {mainTab === "claims" && (
                <>
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

                    {/* Sub-Tabs */}
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
                            <input type="text" placeholder="Search by name, title, category, claim number..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
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
                        {claimsQuery.isLoading ? <SkeletonTable rows={6} cols={9} /> : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[1200px]">
                                    <thead>
                                        <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                            <th className="py-4 px-6 font-bold">Claim #</th>
                                            <th className="py-4 px-6 font-bold">Employee</th>
                                            <th className="py-4 px-6 font-bold">Title</th>
                                            <th className="py-4 px-6 font-bold">Category</th>
                                            <th className="py-4 px-6 font-bold text-right">Claimed</th>
                                            <th className="py-4 px-6 font-bold text-right">Approved</th>
                                            <th className="py-4 px-6 font-bold">Date</th>
                                            <th className="py-4 px-6 font-bold text-center">Status</th>
                                            <th className="py-4 px-6 font-bold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {filtered.map((c: any) => {
                                            const isPartial = c.approvedAmount != null && Number(c.approvedAmount) !== Number(c.amount);
                                            return (
                                                <tr key={c.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                                    <td className="py-4 px-6">
                                                        <span className="text-xs font-mono font-bold text-primary-600 dark:text-primary-400">{c.claimNumber || "—"}</span>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center shrink-0 text-xs font-bold text-accent-700 dark:text-accent-400">{employeeName(c.employeeId).charAt(0)}</div>
                                                            <span className="font-bold text-primary-950 dark:text-white">{employeeName(c.employeeId)}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">{c.title || "—"}</td>
                                                    <td className="py-4 px-6"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-50 text-accent-700 border border-accent-200 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50">{c.category}</span></td>
                                                    <td className="py-4 px-6 text-right font-bold text-primary-950 dark:text-white">{formatCurrency(c.amount)}</td>
                                                    <td className="py-4 px-6 text-right">
                                                        {c.approvedAmount != null ? (
                                                            <span className={cn("font-bold", isPartial ? "text-warning-600 dark:text-warning-400" : "text-success-600 dark:text-success-400")}>
                                                                {formatCurrency(c.approvedAmount)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-neutral-400">—</span>
                                                        )}
                                                    </td>
                                                    <td className="py-4 px-6 text-xs text-neutral-600 dark:text-neutral-400">{formatDate(c.expenseDate || c.tripDate)}</td>
                                                    <td className="py-4 px-6 text-center"><ClaimStatusBadge status={c.status ?? "Draft"} /></td>
                                                    <td className="py-4 px-6 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <button onClick={() => setDetailTarget(c)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="View"><Eye size={15} /></button>
                                                            {c.status?.toLowerCase() === "submitted" && (
                                                                <>
                                                                    <button onClick={() => openApproveModal(c)} disabled={approveClaim.isPending} className="p-2 text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20 rounded-lg transition-colors" title="Approve"><CheckCircle2 size={15} /></button>
                                                                    <button onClick={() => setRejectTarget(c)} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" title="Reject"><XCircle size={15} /></button>
                                                                </>
                                                            )}
                                                            {(c.status?.toLowerCase() === "draft") && (
                                                                <button onClick={() => openEdit(c)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit"><Edit3 size={15} /></button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {filtered.length === 0 && !claimsQuery.isLoading && (
                                            <tr><td colSpan={9}><EmptyState icon="list" title="No expense claims found" message={activeTab === "pending" ? "No claims awaiting review." : "Submit a new expense claim."} /></td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ── Categories Tab ── */}
            {mainTab === "categories" && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                    {categoriesQuery.isLoading ? <SkeletonTable rows={5} cols={7} /> : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[900px]">
                                <thead>
                                    <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                        <th className="py-4 px-6 font-bold">Name</th>
                                        <th className="py-4 px-6 font-bold">Code</th>
                                        <th className="py-4 px-6 font-bold text-right">Max / Claim</th>
                                        <th className="py-4 px-6 font-bold text-right">Monthly Limit</th>
                                        <th className="py-4 px-6 font-bold text-right">Yearly Limit</th>
                                        <th className="py-4 px-6 font-bold text-center">Receipt Required</th>
                                        <th className="py-4 px-6 font-bold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {categories.map((cat: any) => (
                                        <tr key={cat.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                            <td className="py-4 px-6">
                                                <div>
                                                    <p className="font-bold text-primary-950 dark:text-white">{cat.name}</p>
                                                    {cat.description && <p className="text-xs text-neutral-400 mt-0.5">{cat.description}</p>}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6"><span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">{cat.code}</span></td>
                                            <td className="py-4 px-6 text-right font-semibold text-primary-950 dark:text-white">{cat.maxAmountPerClaim ? formatCurrency(cat.maxAmountPerClaim) : "—"}</td>
                                            <td className="py-4 px-6 text-right font-semibold text-primary-950 dark:text-white">{cat.maxAmountPerMonth ? formatCurrency(cat.maxAmountPerMonth) : "—"}</td>
                                            <td className="py-4 px-6 text-right font-semibold text-primary-950 dark:text-white">{cat.maxAmountPerYear ? formatCurrency(cat.maxAmountPerYear) : "—"}</td>
                                            <td className="py-4 px-6 text-center">
                                                {cat.requiresReceipt ? (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success-50 text-success-700 border border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50">
                                                        Yes{cat.receiptThreshold ? ` (>${formatCurrency(cat.receiptThreshold)})` : ""}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 border border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700">No</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => openEditCategory(cat)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit"><Edit3 size={15} /></button>
                                                    <button onClick={() => setDeletingCategoryId(cat.id)} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" title="Delete"><Trash2 size={15} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {categories.length === 0 && !categoriesQuery.isLoading && (
                                        <tr><td colSpan={7}><EmptyState icon="list" title="No expense categories" message="Create your first expense category to get started." /></td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ── Create/Edit Claim Modal ── */}
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
                                        {categoryNames.length > 0 ? categoryNames.map((c) => <option key={c} value={c}>{c}</option>) : <option value="">No categories available</option>}
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
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <div>
                                <h2 className="text-lg font-bold text-primary-950 dark:text-white">Claim Details</h2>
                                {detailData?.claimNumber && (
                                    <p className="text-xs font-mono text-primary-600 dark:text-primary-400 mt-0.5">{detailData.claimNumber}</p>
                                )}
                            </div>
                            <button onClick={() => setDetailTarget(null)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-neutral-400 uppercase font-semibold">Status</span>
                                <ClaimStatusBadge status={detailData?.status ?? "Draft"} />
                            </div>

                            {/* Amount display — claimed vs approved */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 border border-primary-200 dark:border-primary-800/50 text-center">
                                    <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase">Claimed</span>
                                    <p className="text-2xl font-bold text-primary-700 dark:text-primary-300 mt-1">{formatCurrency(detailData?.amount)}</p>
                                </div>
                                <div className={cn("rounded-xl p-4 border text-center", detailData?.approvedAmount != null ? "bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800/50" : "bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700")}>
                                    <span className={cn("text-xs font-semibold uppercase", detailData?.approvedAmount != null ? "text-success-600 dark:text-success-400" : "text-neutral-400")}>Approved</span>
                                    <p className={cn("text-2xl font-bold mt-1", detailData?.approvedAmount != null ? "text-success-700 dark:text-success-300" : "text-neutral-400")}>{detailData?.approvedAmount != null ? formatCurrency(detailData.approvedAmount) : "—"}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><span className="text-xs text-neutral-400 block mb-0.5">Employee</span><p className="font-bold text-primary-950 dark:text-white">{employeeName(detailData?.employeeId)}</p></div>
                                <div><span className="text-xs text-neutral-400 block mb-0.5">Category</span><p className="font-bold text-primary-950 dark:text-white">{detailData?.category}</p></div>
                                <div><span className="text-xs text-neutral-400 block mb-0.5">Expense Date</span><p className="font-semibold text-primary-950 dark:text-white">{formatDate(detailData?.expenseDate || detailData?.tripDate)}</p></div>
                                <div><span className="text-xs text-neutral-400 block mb-0.5">Project</span><p className="font-semibold text-primary-950 dark:text-white">{detailData?.projectCode || "—"}</p></div>
                            </div>
                            {detailData?.description && (
                                <div><span className="text-xs text-neutral-400 block mb-0.5">Description</span><p className="text-sm text-neutral-600 dark:text-neutral-400">{detailData.description}</p></div>
                            )}
                            {detailData?.rejectionReason && (
                                <div className="bg-danger-50 dark:bg-danger-900/20 rounded-xl p-3 border border-danger-200 dark:border-danger-800/50">
                                    <span className="text-xs font-semibold text-danger-600 dark:text-danger-400 uppercase">Rejection Reason</span>
                                    <p className="text-sm text-danger-700 dark:text-danger-300 mt-1">{detailData.rejectionReason}</p>
                                </div>
                            )}

                            {/* Receipts */}
                            {detailReceipts.length > 0 && (
                                <div>
                                    <span className="text-xs text-neutral-400 uppercase font-semibold block mb-2">Receipts / Attachments</span>
                                    <div className="space-y-2">
                                        {detailReceipts.map((r: any, i: number) => {
                                            const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(r.fileUrl || r.fileName || "");
                                            return (
                                                <div key={i} className="flex items-center gap-3 p-2.5 bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
                                                    {isImage ? (
                                                        <img src={r.fileUrl} alt={r.fileName} className="w-10 h-10 rounded-lg object-cover border border-neutral-200 dark:border-neutral-700" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                                                            <FileText size={16} className="text-primary-600 dark:text-primary-400" />
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-primary-950 dark:text-white truncate">{r.fileName || "Receipt"}</p>
                                                    </div>
                                                    {r.fileUrl && (
                                                        <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors">
                                                            <ExternalLink size={14} />
                                                        </a>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Line Items */}
                            {detailItems.length > 0 && (
                                <div>
                                    <span className="text-xs text-neutral-400 uppercase font-semibold block mb-2">Line Items ({detailItems.length})</span>
                                    <div className="space-y-2">
                                        {detailItems.map((item: any, i: number) => (
                                            <div key={item.id || i} className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-primary-950 dark:text-white">{item.description}</p>
                                                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                                            {item.categoryCode && (
                                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-accent-50 text-accent-700 border border-accent-200 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50">{item.categoryCode}</span>
                                                            )}
                                                            {item.expenseDate && <span className="text-xs text-neutral-500 flex items-center gap-1"><Calendar size={10} />{formatDate(item.expenseDate)}</span>}
                                                            {item.merchantName && <span className="text-xs text-neutral-500">{item.merchantName}</span>}
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <p className="text-sm font-bold text-primary-950 dark:text-white">{formatCurrency(item.amount)}</p>
                                                        {item.approvedAmount != null && Number(item.approvedAmount) !== Number(item.amount) && (
                                                            <p className="text-[10px] font-semibold text-warning-600 dark:text-warning-400">Approved: {formatCurrency(item.approvedAmount)}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                {/* Item-level receipts */}
                                                {item.receipts?.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {item.receipts.map((r: any, ri: number) => (
                                                            <a key={ri} href={r.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary-600 dark:text-primary-400 hover:underline">
                                                                <Paperclip size={10} />{r.fileName || "Receipt"}
                                                            </a>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setDetailTarget(null)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Approve Modal (with partial approval) ── */}
            {approveTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-success-700 dark:text-success-400">Approve Expense Claim</h2>
                            <button onClick={() => setApproveTarget(null)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                Approving claim from <strong className="text-primary-950 dark:text-white">{employeeName(approveTarget.employeeId)}</strong>
                                {approveTarget.claimNumber && <> ({approveTarget.claimNumber})</>}
                            </p>
                            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 border border-primary-200 dark:border-primary-800/50 text-center">
                                <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase">Claimed Amount</span>
                                <p className="text-2xl font-bold text-primary-700 dark:text-primary-300 mt-1">{formatCurrency(approveTarget.amount)}</p>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Approved Amount</label>
                                <input type="number" value={approvedAmount} onChange={(e) => setApprovedAmount(e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                {Number(approvedAmount) !== Number(approveTarget.amount) && Number(approvedAmount) > 0 && (
                                    <p className="text-xs text-warning-600 dark:text-warning-400 mt-1 font-semibold">Partial approval: {formatCurrency(approvedAmount)} of {formatCurrency(approveTarget.amount)}</p>
                                )}
                            </div>

                            {/* Per-item approvals */}
                            {(approveTarget.items ?? []).length > 0 && (
                                <div>
                                    <span className="text-xs text-neutral-400 uppercase font-semibold block mb-2">Per-Item Approval</span>
                                    <div className="space-y-3">
                                        {(approveTarget.items ?? []).map((item: any) => {
                                            const ia = itemApprovals[item.id] ?? { approved: true, approvedAmount: String(item.amount ?? ""), reason: "" };
                                            return (
                                                <div key={item.id} className={cn("p-3 rounded-xl border", ia.approved ? "bg-success-50/50 dark:bg-success-900/10 border-success-200 dark:border-success-800/50" : "bg-danger-50/50 dark:bg-danger-900/10 border-danger-200 dark:border-danger-800/50")}>
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-bold text-primary-950 dark:text-white">{item.description}</p>
                                                            <p className="text-xs text-neutral-500 mt-0.5">Claimed: {formatCurrency(item.amount)}</p>
                                                        </div>
                                                        <label className="flex items-center gap-2 shrink-0">
                                                            <input type="checkbox" checked={ia.approved} onChange={(e) => setItemApprovals(prev => ({ ...prev, [item.id]: { ...ia, approved: e.target.checked } }))} className="rounded border-neutral-300 text-success-600 focus:ring-success-500" />
                                                            <span className="text-xs font-semibold">{ia.approved ? "Approve" : "Reject"}</span>
                                                        </label>
                                                    </div>
                                                    {ia.approved && (
                                                        <div className="mt-2">
                                                            <input type="number" value={ia.approvedAmount} onChange={(e) => setItemApprovals(prev => ({ ...prev, [item.id]: { ...ia, approvedAmount: e.target.value } }))} placeholder="Approved amount" className="w-full px-2.5 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                                        </div>
                                                    )}
                                                    {!ia.approved && (
                                                        <div className="mt-2">
                                                            <input type="text" value={ia.reason} onChange={(e) => setItemApprovals(prev => ({ ...prev, [item.id]: { ...ia, reason: e.target.value } }))} placeholder="Reason for rejection..." className="w-full px-2.5 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setApproveTarget(null)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleApprove} disabled={approveClaim.isPending} className="flex-1 py-2.5 rounded-xl bg-success-600 hover:bg-success-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {approveClaim.isPending && <Loader2 size={14} className="animate-spin" />}{approveClaim.isPending ? "Approving..." : "Approve"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Reject Dialog ── */}
            {rejectTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">Reject Expense Claim?</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                            Rejecting claim from <strong>{employeeName(rejectTarget.employeeId)}</strong>
                            {rejectTarget.claimNumber && <> ({rejectTarget.claimNumber})</>}
                            {" "}for {formatCurrency(rejectTarget.amount)}.
                        </p>
                        <div>
                            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Rejection Reason</label>
                            <textarea value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} rows={3} placeholder="Provide a reason for rejection..." className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none" />
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => { setRejectTarget(null); setRejectNote(""); }} className="flex-1 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleReject} disabled={rejectClaim.isPending} className="flex-1 py-3 rounded-xl bg-danger-600 hover:bg-danger-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {rejectClaim.isPending && <Loader2 size={14} className="animate-spin" />}{rejectClaim.isPending ? "Rejecting..." : "Reject"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Create/Edit Category Modal ── */}
            {categoryModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{editingCategoryId ? "Edit Category" : "New Expense Category"}</h2>
                            <button onClick={() => setCategoryModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Name</label>
                                    <input type="text" value={categoryForm.name} onChange={(e) => updateCategoryField("name", e.target.value)} placeholder="e.g., Travel" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Code</label>
                                    <input type="text" value={categoryForm.code} onChange={(e) => updateCategoryField("code", e.target.value.toUpperCase())} placeholder="e.g., TRAVEL" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white font-mono placeholder:text-neutral-400 transition-all" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Description</label>
                                <textarea value={categoryForm.description} onChange={(e) => updateCategoryField("description", e.target.value)} rows={2} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none" />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Max / Claim</label>
                                    <input type="number" value={categoryForm.maxAmountPerClaim} onChange={(e) => updateCategoryField("maxAmountPerClaim", e.target.value)} placeholder="0" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Monthly Limit</label>
                                    <input type="number" value={categoryForm.maxAmountPerMonth} onChange={(e) => updateCategoryField("maxAmountPerMonth", e.target.value)} placeholder="0" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Yearly Limit</label>
                                    <input type="number" value={categoryForm.maxAmountPerYear} onChange={(e) => updateCategoryField("maxAmountPerYear", e.target.value)} placeholder="0" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                                </div>
                            </div>
                            <div className="flex items-center gap-6 py-2">
                                <label className="flex items-center gap-2.5">
                                    <input type="checkbox" checked={categoryForm.requiresReceipt} onChange={(e) => updateCategoryField("requiresReceipt", e.target.checked)} className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500" />
                                    <span className="text-sm font-semibold text-primary-950 dark:text-white">Requires Receipt</span>
                                </label>
                                {categoryForm.requiresReceipt && (
                                    <div className="flex-1">
                                        <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Threshold Amount</label>
                                        <input type="number" value={categoryForm.receiptThreshold} onChange={(e) => updateCategoryField("receiptThreshold", e.target.value)} placeholder="Amount above which receipt is needed" className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setCategoryModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleSaveCategory} disabled={savingCategory} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {savingCategory && <Loader2 size={14} className="animate-spin" />}{savingCategory ? "Saving..." : editingCategoryId ? "Update" : "Create"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Category Confirm ── */}
            {deletingCategoryId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">Delete Category?</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">This action cannot be undone. Are you sure you want to delete this expense category?</p>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setDeletingCategoryId(null)} className="flex-1 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleDeleteCategory} disabled={deleteCategory.isPending} className="flex-1 py-3 rounded-xl bg-danger-600 hover:bg-danger-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {deleteCategory.isPending && <Loader2 size={14} className="animate-spin" />}{deleteCategory.isPending ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
