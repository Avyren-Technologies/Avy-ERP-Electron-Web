import { useState } from "react";
import {
    AlertTriangle,
    Plus,
    Edit3,
    Trash2,
    Loader2,
    X,
    Search,
    Layers,
    FileWarning,
    Eye,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Filter,
    Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    useGrievanceCategories,
    useGrievanceCases,
} from "@/features/company-admin/api/use-recruitment-queries";
import { useEmployees } from "@/features/company-admin/api/use-hr-queries";
import {
    useCreateGrievanceCategory,
    useUpdateGrievanceCategory,
    useDeleteGrievanceCategory,
    useCreateGrievanceCase,
    useUpdateGrievanceCase,
} from "@/features/company-admin/api/use-recruitment-mutations";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Constants ── */

const CASE_STATUSES = ["All", "Open", "Investigating", "Resolved", "Closed", "Escalated"];
const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Critical"];
const SLA_DAYS_OPTIONS = [3, 5, 7, 10, 14, 21, 30];

const EMPTY_CATEGORY = { name: "", code: "", description: "", slaDays: 7, escalationEnabled: true };
const EMPTY_CASE = {
    categoryId: "", employeeId: "", subject: "", description: "", priority: "Medium",
    status: "Open", assignedTo: "", resolution: "", isAnonymous: false,
};

const formatDate = (d: string | null | undefined) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

/* ── SLA Helper ── */

function SlaIndicator({ createdAt, slaDays, status }: { createdAt: string; slaDays: number; status: string }) {
    if (!createdAt || !slaDays) return <span className="text-xs text-neutral-400">—</span>;
    if (["resolved", "closed"].includes(status?.toLowerCase())) {
        return <span className="inline-flex items-center gap-1 text-[10px] font-bold text-success-600 dark:text-success-400"><CheckCircle2 size={10} />Completed</span>;
    }
    const created = new Date(createdAt);
    const deadline = new Date(created.getTime() + slaDays * 86400000);
    const now = new Date();
    const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / 86400000);
    if (daysLeft < 0) {
        return <span className="inline-flex items-center gap-1 text-[10px] font-bold text-danger-600 dark:text-danger-400"><AlertCircle size={10} />Breached ({Math.abs(daysLeft)}d over)</span>;
    }
    if (daysLeft <= 2) {
        return <span className="inline-flex items-center gap-1 text-[10px] font-bold text-warning-600 dark:text-warning-400"><Timer size={10} />{daysLeft}d left</span>;
    }
    return <span className="inline-flex items-center gap-1 text-[10px] font-bold text-success-600 dark:text-success-400"><Clock size={10} />{daysLeft}d left</span>;
}

/* ── Badges ── */

function CaseStatusBadge({ status }: { status: string }) {
    const s = status?.toLowerCase();
    const map: Record<string, string> = {
        open: "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50",
        investigating: "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50",
        resolved: "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50",
        closed: "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700",
        escalated: "bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50",
    };
    return <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize", map[s] ?? map.open)}>{status}</span>;
}

function PriorityBadge({ priority }: { priority: string }) {
    const p = priority?.toLowerCase();
    const map: Record<string, string> = {
        low: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
        medium: "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400",
        high: "bg-warning-50 text-warning-700 dark:bg-warning-900/20 dark:text-warning-400",
        critical: "bg-danger-50 text-danger-700 dark:bg-danger-900/20 dark:text-danger-400",
    };
    return <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full capitalize", map[p] ?? map.medium)}>{priority}</span>;
}

/* ── Screen ── */

export function GrievanceScreen() {
    const [activeTab, setActiveTab] = useState<"categories" | "cases">("cases");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    const [catModalOpen, setCatModalOpen] = useState(false);
    const [catEditingId, setCatEditingId] = useState<string | null>(null);
    const [catForm, setCatForm] = useState({ ...EMPTY_CATEGORY });
    const [catDeleteTarget, setCatDeleteTarget] = useState<any>(null);

    const [caseModalOpen, setCaseModalOpen] = useState(false);
    const [caseEditingId, setCaseEditingId] = useState<string | null>(null);
    const [caseForm, setCaseForm] = useState({ ...EMPTY_CASE });
    const [caseDetailTarget, setCaseDetailTarget] = useState<any>(null);

    const catQuery = useGrievanceCategories();
    const caseQuery = useGrievanceCases(statusFilter !== "All" ? { status: statusFilter.toLowerCase() } : undefined);
    const employeesQuery = useEmployees();

    const createCat = useCreateGrievanceCategory();
    const updateCat = useUpdateGrievanceCategory();
    const deleteCat = useDeleteGrievanceCategory();
    const createCase = useCreateGrievanceCase();
    const updateCase = useUpdateGrievanceCase();

    const categories: any[] = catQuery.data?.data ?? [];
    const cases: any[] = caseQuery.data?.data ?? [];
    const employees: any[] = employeesQuery.data?.data ?? [];

    const categoryName = (id: string) => categories.find((c: any) => c.id === id)?.name ?? id;
    const categorySla = (id: string) => categories.find((c: any) => c.id === id)?.slaDays ?? 7;
    const employeeName = (id: string) => {
        const emp = employees.find((e: any) => e.id === id);
        if (!emp) return id;
        return [emp.firstName, emp.lastName].filter(Boolean).join(" ") || emp.fullName || emp.email || id;
    };

    const filteredCats = categories.filter((c: any) => !search || c.name?.toLowerCase().includes(search.toLowerCase()));
    const filteredCases = cases.filter((c: any) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return c.subject?.toLowerCase().includes(s) || employeeName(c.employeeId)?.toLowerCase().includes(s) || categoryName(c.categoryId)?.toLowerCase().includes(s);
    });

    /* Category handlers */
    const openCreateCat = () => { setCatEditingId(null); setCatForm({ ...EMPTY_CATEGORY }); setCatModalOpen(true); };
    const openEditCat = (c: any) => {
        setCatEditingId(c.id);
        setCatForm({ name: c.name ?? "", code: c.code ?? "", description: c.description ?? "", slaDays: c.slaDays ?? 7, escalationEnabled: c.escalationEnabled ?? true });
        setCatModalOpen(true);
    };
    const handleSaveCat = async () => {
        try {
            const payload: any = {
                name: catForm.name,
                slaHours: (catForm.slaDays || 7) * 24,
            };
            if (catEditingId) { await updateCat.mutateAsync({ id: catEditingId, data: payload }); showSuccess("Category Updated", `${catForm.name} updated.`); }
            else { await createCat.mutateAsync(payload); showSuccess("Category Created", `${catForm.name} created.`); }
            setCatModalOpen(false);
        } catch (err) { showApiError(err); }
    };
    const handleDeleteCat = async () => {
        if (!catDeleteTarget) return;
        try { await deleteCat.mutateAsync(catDeleteTarget.id); showSuccess("Category Deleted", `${catDeleteTarget.name} removed.`); setCatDeleteTarget(null); }
        catch (err) { showApiError(err); }
    };

    /* Case handlers */
    const openCreateCase = () => { setCaseEditingId(null); setCaseForm({ ...EMPTY_CASE }); setCaseModalOpen(true); };
    const openEditCase = (c: any) => {
        setCaseEditingId(c.id);
        setCaseForm({
            categoryId: c.categoryId ?? "", employeeId: c.employeeId ?? "", subject: c.subject ?? "",
            description: c.description ?? "", priority: c.priority ?? "Medium", status: c.status ?? "Open",
            assignedTo: c.assignedTo ?? "", resolution: c.resolution ?? "", isAnonymous: c.isAnonymous ?? false,
        });
        setCaseModalOpen(true);
    };
    const handleSaveCase = async () => {
        try {
            if (caseEditingId) {
                const updatePayload: any = {
                    description: caseForm.description || undefined,
                    status: caseForm.status?.toUpperCase() || undefined,
                    resolution: caseForm.resolution || undefined,
                    resolvedBy: caseForm.assignedTo || undefined,
                };
                await updateCase.mutateAsync({ id: caseEditingId, data: updatePayload });
                showSuccess("Case Updated", "Grievance case updated.");
            } else {
                const createPayload: any = {
                    categoryId: caseForm.categoryId,
                    description: [caseForm.subject, caseForm.description].filter(Boolean).join(" - "),
                    isAnonymous: caseForm.isAnonymous,
                    employeeId: caseForm.isAnonymous ? undefined : (caseForm.employeeId || undefined),
                };
                await createCase.mutateAsync(createPayload);
                showSuccess("Case Filed", "Grievance case has been filed.");
            }
            setCaseModalOpen(false);
        } catch (err) { showApiError(err); }
    };

    const savingCat = createCat.isPending || updateCat.isPending;
    const savingCase = createCase.isPending || updateCase.isPending;
    const updateCatField = (k: string, v: any) => setCatForm((p) => ({ ...p, [k]: v }));
    const updateCaseField = (k: string, v: any) => setCaseForm((p) => ({ ...p, [k]: v }));

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Grievances</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Manage grievance categories and track employee grievance cases with SLA</p>
                </div>
                <button
                    onClick={() => activeTab === "categories" ? openCreateCat() : openCreateCase()}
                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
                >
                    <Plus className="w-5 h-5" />{activeTab === "categories" ? "New Category" : "File Grievance"}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl w-fit">
                <button onClick={() => { setActiveTab("cases"); setSearch(""); }} className={cn("px-5 py-2 rounded-lg text-sm font-bold transition-all", activeTab === "cases" ? "bg-white dark:bg-neutral-700 text-primary-700 dark:text-primary-400 shadow-sm" : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300")}>
                    <span className="flex items-center gap-2"><FileWarning size={14} />Cases</span>
                </button>
                <button onClick={() => { setActiveTab("categories"); setSearch(""); }} className={cn("px-5 py-2 rounded-lg text-sm font-bold transition-all", activeTab === "categories" ? "bg-white dark:bg-neutral-700 text-primary-700 dark:text-primary-400 shadow-sm" : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300")}>
                    <span className="flex items-center gap-2"><Layers size={14} />Categories</span>
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                    <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                </div>
                {activeTab === "cases" && (
                    <div className="flex items-center gap-2">
                        <Filter size={14} className="text-neutral-400" />
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-semibold text-neutral-700 dark:text-neutral-300 focus:outline-none">
                            {CASE_STATUSES.map((f) => <option key={f} value={f}>{f}</option>)}
                        </select>
                    </div>
                )}
            </div>

            {/* ── Categories Tab ── */}
            {activeTab === "categories" && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                    {catQuery.isLoading ? <SkeletonTable rows={5} cols={5} /> : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[700px]">
                                <thead>
                                    <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                        <th className="py-4 px-6 font-bold">Name</th>
                                        <th className="py-4 px-6 font-bold">Code</th>
                                        <th className="py-4 px-6 font-bold text-center">SLA (days)</th>
                                        <th className="py-4 px-6 font-bold text-center">Escalation</th>
                                        <th className="py-4 px-6 font-bold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {filteredCats.map((c: any) => (
                                        <tr key={c.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-warning-50 dark:bg-warning-900/20 flex items-center justify-center shrink-0"><AlertTriangle className="w-4 h-4 text-warning-600 dark:text-warning-400" /></div>
                                                    <div>
                                                        <span className="font-bold text-primary-950 dark:text-white">{c.name}</span>
                                                        {c.description && <p className="text-[10px] text-neutral-400 truncate max-w-[200px]">{c.description}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-xs font-mono text-neutral-600 dark:text-neutral-400">{c.code || "—"}</td>
                                            <td className="py-4 px-6 text-center font-semibold text-primary-950 dark:text-white">{c.slaDays ?? 7}</td>
                                            <td className="py-4 px-6 text-center">
                                                {c.escalationEnabled !== false ? (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success-50 text-success-700 border border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50">Enabled</span>
                                                ) : (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500">Disabled</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => openEditCat(c)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit"><Edit3 size={15} /></button>
                                                    <button onClick={() => setCatDeleteTarget(c)} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" title="Delete"><Trash2 size={15} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredCats.length === 0 && !catQuery.isLoading && (
                                        <tr><td colSpan={5}><EmptyState icon="list" title="No categories found" message="Create grievance categories." action={{ label: "New Category", onClick: openCreateCat }} /></td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ── Cases Tab ── */}
            {activeTab === "cases" && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                    {caseQuery.isLoading ? <SkeletonTable rows={6} cols={8} /> : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[1100px]">
                                <thead>
                                    <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                        <th className="py-4 px-6 font-bold">Subject</th>
                                        <th className="py-4 px-6 font-bold">Employee</th>
                                        <th className="py-4 px-6 font-bold">Category</th>
                                        <th className="py-4 px-6 font-bold text-center">Priority</th>
                                        <th className="py-4 px-6 font-bold text-center">Status</th>
                                        <th className="py-4 px-6 font-bold">SLA</th>
                                        <th className="py-4 px-6 font-bold">Filed</th>
                                        <th className="py-4 px-6 font-bold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {filteredCases.map((c: any) => (
                                        <tr key={c.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-warning-50 dark:bg-warning-900/20 flex items-center justify-center shrink-0"><FileWarning className="w-4 h-4 text-warning-600 dark:text-warning-400" /></div>
                                                    <span className="font-bold text-primary-950 dark:text-white truncate max-w-[200px]">{c.subject}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">{c.isAnonymous ? "Anonymous" : employeeName(c.employeeId)}</td>
                                            <td className="py-4 px-6 text-xs text-neutral-500 dark:text-neutral-400">{categoryName(c.categoryId)}</td>
                                            <td className="py-4 px-6 text-center"><PriorityBadge priority={c.priority ?? "Medium"} /></td>
                                            <td className="py-4 px-6 text-center"><CaseStatusBadge status={c.status ?? "Open"} /></td>
                                            <td className="py-4 px-6"><SlaIndicator createdAt={c.createdAt} slaDays={categorySla(c.categoryId)} status={c.status ?? "Open"} /></td>
                                            <td className="py-4 px-6 text-xs text-neutral-600 dark:text-neutral-400">{formatDate(c.createdAt)}</td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => setCaseDetailTarget(c)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="View"><Eye size={15} /></button>
                                                    <button onClick={() => openEditCase(c)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit"><Edit3 size={15} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredCases.length === 0 && !caseQuery.isLoading && (
                                        <tr><td colSpan={8}><EmptyState icon="list" title="No grievance cases found" message="File a new grievance case." action={{ label: "File Grievance", onClick: openCreateCase }} /></td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ── Category Modal ── */}
            {catModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{catEditingId ? "Edit Category" : "New Category"}</h2>
                            <button onClick={() => setCatModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Name</label>
                                    <input type="text" value={catForm.name} onChange={(e) => updateCatField("name", e.target.value)} placeholder="e.g., Workplace Harassment" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Code</label>
                                    <input type="text" value={catForm.code} onChange={(e) => updateCatField("code", e.target.value)} placeholder="GRV-HAR" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Description</label>
                                <textarea value={catForm.description} onChange={(e) => updateCatField("description", e.target.value)} rows={2} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">SLA (days)</label>
                                <select value={catForm.slaDays} onChange={(e) => updateCatField("slaDays", Number(e.target.value))} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                    {SLA_DAYS_OPTIONS.map((d) => <option key={d} value={d}>{d} days</option>)}
                                </select>
                            </div>
                            <div className="flex items-center justify-between py-2 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl px-4 border border-neutral-200 dark:border-neutral-700">
                                <span className="text-sm font-medium text-primary-950 dark:text-white">Auto-Escalation</span>
                                <button type="button" onClick={() => updateCatField("escalationEnabled", !catForm.escalationEnabled)} className={cn("w-10 h-6 rounded-full transition-colors relative", catForm.escalationEnabled ? "bg-primary-600" : "bg-neutral-300 dark:bg-neutral-700")}>
                                    <div className={cn("w-4 h-4 rounded-full bg-white absolute top-1 transition-all", catForm.escalationEnabled ? "left-5" : "left-1")} />
                                </button>
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setCatModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleSaveCat} disabled={savingCat} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {savingCat && <Loader2 size={14} className="animate-spin" />}{savingCat ? "Saving..." : catEditingId ? "Update" : "Create"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Case Modal ── */}
            {caseModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{caseEditingId ? "Update Case" : "File Grievance"}</h2>
                            <button onClick={() => setCaseModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Category</label>
                                <select value={caseForm.categoryId} onChange={(e) => updateCaseField("categoryId", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                    <option value="">Select category...</option>
                                    {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Employee</label>
                                <select value={caseForm.employeeId} onChange={(e) => updateCaseField("employeeId", e.target.value)} disabled={caseForm.isAnonymous} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all disabled:opacity-50">
                                    <option value="">Select employee...</option>
                                    {employees.map((e: any) => <option key={e.id} value={e.id}>{[e.firstName, e.lastName].filter(Boolean).join(" ") || e.email}</option>)}
                                </select>
                            </div>
                            <div className="flex items-center justify-between py-2 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl px-4 border border-neutral-200 dark:border-neutral-700">
                                <span className="text-sm font-medium text-primary-950 dark:text-white">Anonymous Filing</span>
                                <button type="button" onClick={() => updateCaseField("isAnonymous", !caseForm.isAnonymous)} className={cn("w-10 h-6 rounded-full transition-colors relative", caseForm.isAnonymous ? "bg-primary-600" : "bg-neutral-300 dark:bg-neutral-700")}>
                                    <div className={cn("w-4 h-4 rounded-full bg-white absolute top-1 transition-all", caseForm.isAnonymous ? "left-5" : "left-1")} />
                                </button>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Subject</label>
                                <input type="text" value={caseForm.subject} onChange={(e) => updateCaseField("subject", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Priority</label>
                                    <select value={caseForm.priority} onChange={(e) => updateCaseField("priority", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                        {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                {caseEditingId && (
                                    <div>
                                        <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Status</label>
                                        <select value={caseForm.status} onChange={(e) => updateCaseField("status", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                            {CASE_STATUSES.filter((s) => s !== "All").map((s) => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Description</label>
                                <textarea value={caseForm.description} onChange={(e) => updateCaseField("description", e.target.value)} rows={3} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none" />
                            </div>
                            {caseEditingId && (
                                <>
                                    <div>
                                        <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Assigned To</label>
                                        <select value={caseForm.assignedTo} onChange={(e) => updateCaseField("assignedTo", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                            <option value="">Select investigator...</option>
                                            {employees.map((e: any) => <option key={e.id} value={e.id}>{[e.firstName, e.lastName].filter(Boolean).join(" ") || e.email}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Resolution</label>
                                        <textarea value={caseForm.resolution} onChange={(e) => updateCaseField("resolution", e.target.value)} rows={2} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none" />
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setCaseModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleSaveCase} disabled={savingCase} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {savingCase && <Loader2 size={14} className="animate-spin" />}{savingCase ? "Saving..." : caseEditingId ? "Update" : "File"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Case Detail ── */}
            {caseDetailTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">Case Details</h2>
                            <button onClick={() => setCaseDetailTarget(null)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div className="flex items-center justify-between">
                                <CaseStatusBadge status={caseDetailTarget.status ?? "Open"} />
                                <PriorityBadge priority={caseDetailTarget.priority ?? "Medium"} />
                            </div>
                            <div><span className="text-xs text-neutral-400 block mb-0.5">Subject</span><p className="font-bold text-primary-950 dark:text-white">{caseDetailTarget.subject}</p></div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><span className="text-xs text-neutral-400 block mb-0.5">Employee</span><p className="font-semibold text-primary-950 dark:text-white">{caseDetailTarget.isAnonymous ? "Anonymous" : employeeName(caseDetailTarget.employeeId)}</p></div>
                                <div><span className="text-xs text-neutral-400 block mb-0.5">Category</span><p className="font-semibold text-primary-950 dark:text-white">{categoryName(caseDetailTarget.categoryId)}</p></div>
                                <div><span className="text-xs text-neutral-400 block mb-0.5">Filed</span><p className="font-semibold text-primary-950 dark:text-white">{formatDate(caseDetailTarget.createdAt)}</p></div>
                                <div><span className="text-xs text-neutral-400 block mb-0.5">SLA</span><SlaIndicator createdAt={caseDetailTarget.createdAt} slaDays={categorySla(caseDetailTarget.categoryId)} status={caseDetailTarget.status ?? "Open"} /></div>
                            </div>
                            {caseDetailTarget.description && (
                                <div><span className="text-xs text-neutral-400 block mb-0.5">Description</span><p className="text-sm text-neutral-600 dark:text-neutral-400">{caseDetailTarget.description}</p></div>
                            )}
                            {caseDetailTarget.resolution && (
                                <div className="bg-success-50 dark:bg-success-900/20 rounded-xl p-3 border border-success-200 dark:border-success-800/50">
                                    <span className="text-xs text-success-600 dark:text-success-400 block mb-0.5 font-semibold">Resolution</span>
                                    <p className="text-sm text-success-700 dark:text-success-400">{caseDetailTarget.resolution}</p>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setCaseDetailTarget(null)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Category ── */}
            {catDeleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">Delete Category?</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">This will permanently delete <strong>{catDeleteTarget.name}</strong>.</p>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setCatDeleteTarget(null)} className="flex-1 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleDeleteCat} disabled={deleteCat.isPending} className="flex-1 py-3 rounded-xl bg-danger-600 hover:bg-danger-700 text-white text-sm font-bold transition-colors disabled:opacity-50">{deleteCat.isPending ? "Deleting..." : "Delete"}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
