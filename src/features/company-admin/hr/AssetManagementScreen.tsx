import { useState } from "react";
import {
    Package,
    Plus,
    Edit3,
    Trash2,
    Loader2,
    X,
    Search,
    Layers,
    Box,
    UserCheck,
    Filter,
    CheckCircle2,
    AlertCircle,
    Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    useAssetCategories,
    useAssets,
    useAssetAssignments,
} from "@/features/company-admin/api/use-recruitment-queries";
import { useEmployees } from "@/features/company-admin/api/use-hr-queries";
import {
    useCreateAssetCategory,
    useUpdateAssetCategory,
    useDeleteAssetCategory,
    useCreateAsset,
    useUpdateAsset,
    useCreateAssetAssignment,
    useUpdateAssetAssignment,
} from "@/features/company-admin/api/use-recruitment-mutations";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Constants ── */

const TABS = [
    { key: "categories" as const, label: "Categories", icon: Layers },
    { key: "inventory" as const, label: "Inventory", icon: Box },
    { key: "assignments" as const, label: "Assignments", icon: UserCheck },
];
type TabKey = (typeof TABS)[number]["key"];

const ASSET_STATUSES = ["All", "Available", "Assigned", "In Repair", "Retired", "Lost"];
const ASSET_CONDITIONS = ["New", "Good", "Fair", "Poor"];
const ASSIGNMENT_STATUSES = ["Assigned", "Returned", "Lost", "Damaged"];

const EMPTY_CATEGORY = { name: "", code: "", description: "", depreciationRate: "", usefulLife: "" };
const EMPTY_ASSET = {
    name: "", assetTag: "", categoryId: "", serialNumber: "", purchaseDate: "",
    purchaseCost: "", condition: "New", status: "Available", location: "", vendor: "", warrantyExpiry: "", notes: "",
};
const EMPTY_ASSIGNMENT = {
    assetId: "", employeeId: "", assignedDate: "", returnDate: "", status: "Assigned", notes: "",
};

const formatDate = (d: string | null | undefined) => {
    if (!d) return "\u2014";
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

/* ── Badges ── */

function AssetStatusBadge({ status }: { status: string }) {
    const s = status?.toLowerCase();
    const map: Record<string, string> = {
        available: "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50",
        assigned: "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50",
        "in repair": "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50",
        retired: "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700",
        lost: "bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50",
    };
    return <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize", map[s] ?? map.available)}>{status}</span>;
}

/* ── Screen ── */

export function AssetManagementScreen() {
    const [activeTab, setActiveTab] = useState<TabKey>("categories");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    /* Category state */
    const [catModalOpen, setCatModalOpen] = useState(false);
    const [catEditingId, setCatEditingId] = useState<string | null>(null);
    const [catForm, setCatForm] = useState({ ...EMPTY_CATEGORY });
    const [catDeleteTarget, setCatDeleteTarget] = useState<any>(null);

    /* Asset state */
    const [assetModalOpen, setAssetModalOpen] = useState(false);
    const [assetEditingId, setAssetEditingId] = useState<string | null>(null);
    const [assetForm, setAssetForm] = useState({ ...EMPTY_ASSET });

    /* Assignment state */
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [assignEditingId, setAssignEditingId] = useState<string | null>(null);
    const [assignForm, setAssignForm] = useState({ ...EMPTY_ASSIGNMENT });

    /* Queries */
    const catQuery = useAssetCategories();
    const assetQuery = useAssets(statusFilter !== "All" ? { status: statusFilter.toLowerCase() } : undefined);
    const assignQuery = useAssetAssignments();
    const employeesQuery = useEmployees();

    /* Mutations */
    const createCat = useCreateAssetCategory();
    const updateCat = useUpdateAssetCategory();
    const deleteCat = useDeleteAssetCategory();
    const createAsset = useCreateAsset();
    const updateAsset = useUpdateAsset();
    const createAssign = useCreateAssetAssignment();
    const updateAssign = useUpdateAssetAssignment();

    const categories: any[] = catQuery.data?.data ?? [];
    const assets: any[] = assetQuery.data?.data ?? [];
    const assignments: any[] = assignQuery.data?.data ?? [];
    const employees: any[] = employeesQuery.data?.data ?? [];

    const categoryName = (id: string) => categories.find((c: any) => c.id === id)?.name ?? id;
    const assetName = (id: string) => assets.find((a: any) => a.id === id)?.name ?? id;
    const employeeName = (id: string) => {
        const emp = employees.find((e: any) => e.id === id);
        if (!emp) return id;
        return [emp.firstName, emp.lastName].filter(Boolean).join(" ") || emp.fullName || emp.email || id;
    };

    /* Filtering */
    const filteredCats = categories.filter((c: any) => !search || c.name?.toLowerCase().includes(search.toLowerCase()));
    const filteredAssets = assets.filter((a: any) => !search || a.name?.toLowerCase().includes(search.toLowerCase()) || a.assetTag?.toLowerCase().includes(search.toLowerCase()));
    const filteredAssigns = assignments.filter((a: any) => !search || employeeName(a.employeeId)?.toLowerCase().includes(search.toLowerCase()) || assetName(a.assetId)?.toLowerCase().includes(search.toLowerCase()));

    /* Category handlers */
    const openCreateCat = () => { setCatEditingId(null); setCatForm({ ...EMPTY_CATEGORY }); setCatModalOpen(true); };
    const openEditCat = (c: any) => {
        setCatEditingId(c.id);
        setCatForm({ name: c.name ?? "", code: c.code ?? "", description: c.description ?? "", depreciationRate: c.depreciationRate ?? "", usefulLife: c.usefulLife ?? "" });
        setCatModalOpen(true);
    };
    const handleSaveCat = async () => {
        try {
            if (catEditingId) { await updateCat.mutateAsync({ id: catEditingId, data: catForm }); showSuccess("Category Updated", `${catForm.name} updated.`); }
            else { await createCat.mutateAsync(catForm); showSuccess("Category Created", `${catForm.name} created.`); }
            setCatModalOpen(false);
        } catch (err) { showApiError(err); }
    };
    const handleDeleteCat = async () => {
        if (!catDeleteTarget) return;
        try { await deleteCat.mutateAsync(catDeleteTarget.id); showSuccess("Category Deleted", `${catDeleteTarget.name} removed.`); setCatDeleteTarget(null); }
        catch (err) { showApiError(err); }
    };

    /* Asset handlers */
    const openCreateAsset = () => { setAssetEditingId(null); setAssetForm({ ...EMPTY_ASSET }); setAssetModalOpen(true); };
    const openEditAsset = (a: any) => {
        setAssetEditingId(a.id);
        setAssetForm({
            name: a.name ?? "", assetTag: a.assetTag ?? "", categoryId: a.categoryId ?? "", serialNumber: a.serialNumber ?? "",
            purchaseDate: a.purchaseDate ?? "", purchaseCost: a.purchaseCost ?? "", condition: a.condition ?? "New",
            status: a.status ?? "Available", location: a.location ?? "", vendor: a.vendor ?? "", warrantyExpiry: a.warrantyExpiry ?? "", notes: a.notes ?? "",
        });
        setAssetModalOpen(true);
    };
    const handleSaveAsset = async () => {
        try {
            if (assetEditingId) { await updateAsset.mutateAsync({ id: assetEditingId, data: assetForm }); showSuccess("Asset Updated", `${assetForm.name} updated.`); }
            else { await createAsset.mutateAsync(assetForm); showSuccess("Asset Created", `${assetForm.name} created.`); }
            setAssetModalOpen(false);
        } catch (err) { showApiError(err); }
    };

    /* Assignment handlers */
    const openCreateAssign = () => { setAssignEditingId(null); setAssignForm({ ...EMPTY_ASSIGNMENT }); setAssignModalOpen(true); };
    const openEditAssign = (a: any) => {
        setAssignEditingId(a.id);
        setAssignForm({
            assetId: a.assetId ?? "", employeeId: a.employeeId ?? "", assignedDate: a.assignedDate ?? "",
            returnDate: a.returnDate ?? "", status: a.status ?? "Assigned", notes: a.notes ?? "",
        });
        setAssignModalOpen(true);
    };
    const handleSaveAssign = async () => {
        try {
            if (assignEditingId) { await updateAssign.mutateAsync({ id: assignEditingId, data: assignForm }); showSuccess("Assignment Updated", "Asset assignment updated."); }
            else { await createAssign.mutateAsync(assignForm); showSuccess("Asset Assigned", "Asset has been assigned to the employee."); }
            setAssignModalOpen(false);
        } catch (err) { showApiError(err); }
    };

    const savingCat = createCat.isPending || updateCat.isPending;
    const savingAsset = createAsset.isPending || updateAsset.isPending;
    const savingAssign = createAssign.isPending || updateAssign.isPending;

    const updateCatField = (k: string, v: any) => setCatForm((p) => ({ ...p, [k]: v }));
    const updateAssetField = (k: string, v: any) => setAssetForm((p) => ({ ...p, [k]: v }));
    const updateAssignField = (k: string, v: any) => setAssignForm((p) => ({ ...p, [k]: v }));

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Asset Management</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Track company assets, categories, and employee assignments</p>
                </div>
                <button
                    onClick={() => { if (activeTab === "categories") openCreateCat(); else if (activeTab === "inventory") openCreateAsset(); else openCreateAssign(); }}
                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
                >
                    <Plus className="w-5 h-5" />
                    {activeTab === "categories" ? "New Category" : activeTab === "inventory" ? "Add Asset" : "Assign Asset"}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl w-fit">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSearch(""); }} className={cn("px-5 py-2 rounded-lg text-sm font-bold transition-all", activeTab === tab.key ? "bg-white dark:bg-neutral-700 text-primary-700 dark:text-primary-400 shadow-sm" : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300")}>
                            <span className="flex items-center gap-2"><Icon size={14} />{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                    <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                </div>
                {activeTab === "inventory" && (
                    <div className="flex items-center gap-2">
                        <Filter size={14} className="text-neutral-400 flex-shrink-0" />
                        <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 whitespace-nowrap">Status:</span>
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-semibold text-neutral-700 dark:text-neutral-300 focus:outline-none">
                            {ASSET_STATUSES.map((f) => <option key={f} value={f}>{f}</option>)}
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
                                        <th className="py-4 px-6 font-bold">Depreciation Rate</th>
                                        <th className="py-4 px-6 font-bold">Useful Life</th>
                                        <th className="py-4 px-6 font-bold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {filteredCats.map((c: any) => (
                                        <tr key={c.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0"><Layers className="w-4 h-4 text-primary-600 dark:text-primary-400" /></div>
                                                    <div>
                                                        <span className="font-bold text-primary-950 dark:text-white">{c.name}</span>
                                                        {c.description && <p className="text-[10px] text-neutral-400 truncate max-w-[200px]">{c.description}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-xs font-mono text-neutral-600 dark:text-neutral-400">{c.code || "\u2014"}</td>
                                            <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">{c.depreciationRate ? `${c.depreciationRate}%` : "\u2014"}</td>
                                            <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">{c.usefulLife ? `${c.usefulLife} yrs` : "\u2014"}</td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => openEditCat(c)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit"><Edit3 size={15} /></button>
                                                    <button onClick={() => setCatDeleteTarget(c)} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" title="Delete"><Trash2 size={15} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredCats.length === 0 && !catQuery.isLoading && (
                                        <tr><td colSpan={5}><EmptyState icon="list" title="No categories found" message="Create asset categories to organize your inventory." action={{ label: "New Category", onClick: openCreateCat }} /></td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ── Inventory Tab ── */}
            {activeTab === "inventory" && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                    {assetQuery.isLoading ? <SkeletonTable rows={6} cols={8} /> : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[1100px]">
                                <thead>
                                    <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                        <th className="py-4 px-6 font-bold">Asset</th>
                                        <th className="py-4 px-6 font-bold">Tag</th>
                                        <th className="py-4 px-6 font-bold">Category</th>
                                        <th className="py-4 px-6 font-bold">Serial No.</th>
                                        <th className="py-4 px-6 font-bold">Condition</th>
                                        <th className="py-4 px-6 font-bold text-center">Status</th>
                                        <th className="py-4 px-6 font-bold text-right">Cost</th>
                                        <th className="py-4 px-6 font-bold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {filteredAssets.map((a: any) => (
                                        <tr key={a.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center shrink-0"><Package className="w-4 h-4 text-accent-600 dark:text-accent-400" /></div>
                                                    <span className="font-bold text-primary-950 dark:text-white">{a.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-xs font-mono text-neutral-600 dark:text-neutral-400">{a.assetTag || "\u2014"}</td>
                                            <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">{categoryName(a.categoryId)}</td>
                                            <td className="py-4 px-6 text-xs font-mono text-neutral-500 dark:text-neutral-400">{a.serialNumber || "\u2014"}</td>
                                            <td className="py-4 px-6"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">{a.condition || "\u2014"}</span></td>
                                            <td className="py-4 px-6 text-center"><AssetStatusBadge status={a.status ?? "Available"} /></td>
                                            <td className="py-4 px-6 text-right font-semibold text-primary-950 dark:text-white">{a.purchaseCost ? `\u20B9${Number(a.purchaseCost).toLocaleString("en-IN")}` : "\u2014"}</td>
                                            <td className="py-4 px-6 text-right">
                                                <button onClick={() => openEditAsset(a)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit"><Edit3 size={15} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredAssets.length === 0 && !assetQuery.isLoading && (
                                        <tr><td colSpan={8}><EmptyState icon="list" title="No assets found" message="Add assets to your inventory." action={{ label: "Add Asset", onClick: openCreateAsset }} /></td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ── Assignments Tab ── */}
            {activeTab === "assignments" && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                    {assignQuery.isLoading ? <SkeletonTable rows={6} cols={6} /> : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[900px]">
                                <thead>
                                    <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                        <th className="py-4 px-6 font-bold">Employee</th>
                                        <th className="py-4 px-6 font-bold">Asset</th>
                                        <th className="py-4 px-6 font-bold">Assigned</th>
                                        <th className="py-4 px-6 font-bold">Returned</th>
                                        <th className="py-4 px-6 font-bold text-center">Status</th>
                                        <th className="py-4 px-6 font-bold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {filteredAssigns.map((a: any) => (
                                        <tr key={a.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center shrink-0 text-xs font-bold text-accent-700 dark:text-accent-400">{employeeName(a.employeeId).charAt(0)}</div>
                                                    <span className="font-bold text-primary-950 dark:text-white">{employeeName(a.employeeId)}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">{assetName(a.assetId)}</td>
                                            <td className="py-4 px-6 text-xs text-neutral-600 dark:text-neutral-400">{formatDate(a.assignedDate)}</td>
                                            <td className="py-4 px-6 text-xs text-neutral-600 dark:text-neutral-400">{formatDate(a.returnDate)}</td>
                                            <td className="py-4 px-6 text-center"><AssetStatusBadge status={a.status ?? "Assigned"} /></td>
                                            <td className="py-4 px-6 text-right">
                                                <button onClick={() => openEditAssign(a)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit"><Edit3 size={15} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredAssigns.length === 0 && !assignQuery.isLoading && (
                                        <tr><td colSpan={6}><EmptyState icon="list" title="No assignments found" message="Assign assets to employees." action={{ label: "Assign Asset", onClick: openCreateAssign }} /></td></tr>
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
                                    <input type="text" value={catForm.name} onChange={(e) => updateCatField("name", e.target.value)} placeholder="e.g., Laptops" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Code</label>
                                    <input type="text" value={catForm.code} onChange={(e) => updateCatField("code", e.target.value)} placeholder="LAP" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Description</label>
                                <textarea value={catForm.description} onChange={(e) => updateCatField("description", e.target.value)} rows={2} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Depreciation Rate (%)</label>
                                    <input type="number" value={catForm.depreciationRate} onChange={(e) => updateCatField("depreciationRate", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Useful Life (years)</label>
                                    <input type="number" value={catForm.usefulLife} onChange={(e) => updateCatField("usefulLife", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                </div>
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

            {/* ── Asset Modal ── */}
            {assetModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{assetEditingId ? "Edit Asset" : "Add Asset"}</h2>
                            <button onClick={() => setAssetModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Asset Name</label>
                                    <input type="text" value={assetForm.name} onChange={(e) => updateAssetField("name", e.target.value)} placeholder="e.g., MacBook Pro 14" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Asset Tag</label>
                                    <input type="text" value={assetForm.assetTag} onChange={(e) => updateAssetField("assetTag", e.target.value)} placeholder="AST-001" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Category</label>
                                    <select value={assetForm.categoryId} onChange={(e) => updateAssetField("categoryId", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                        <option value="">Select category...</option>
                                        {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Serial Number</label>
                                    <input type="text" value={assetForm.serialNumber} onChange={(e) => updateAssetField("serialNumber", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Condition</label>
                                    <select value={assetForm.condition} onChange={(e) => updateAssetField("condition", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                        {ASSET_CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Status</label>
                                    <select value={assetForm.status} onChange={(e) => updateAssetField("status", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                        {ASSET_STATUSES.filter((s) => s !== "All").map((s) => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Purchase Date</label>
                                    <input type="date" value={assetForm.purchaseDate} onChange={(e) => updateAssetField("purchaseDate", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Purchase Cost (INR)</label>
                                    <input type="number" value={assetForm.purchaseCost} onChange={(e) => updateAssetField("purchaseCost", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Vendor</label>
                                    <input type="text" value={assetForm.vendor} onChange={(e) => updateAssetField("vendor", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Warranty Expiry</label>
                                    <input type="date" value={assetForm.warrantyExpiry} onChange={(e) => updateAssetField("warrantyExpiry", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Location</label>
                                <input type="text" value={assetForm.location} onChange={(e) => updateAssetField("location", e.target.value)} placeholder="Office, Warehouse..." className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Notes</label>
                                <textarea value={assetForm.notes} onChange={(e) => updateAssetField("notes", e.target.value)} rows={2} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none" />
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setAssetModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleSaveAsset} disabled={savingAsset} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {savingAsset && <Loader2 size={14} className="animate-spin" />}{savingAsset ? "Saving..." : assetEditingId ? "Update" : "Create"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Assignment Modal ── */}
            {assignModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{assignEditingId ? "Edit Assignment" : "Assign Asset"}</h2>
                            <button onClick={() => setAssignModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Asset</label>
                                <select value={assignForm.assetId} onChange={(e) => updateAssignField("assetId", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                    <option value="">Select asset...</option>
                                    {assets.map((a: any) => <option key={a.id} value={a.id}>{a.name} ({a.assetTag || "no tag"})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Employee</label>
                                <select value={assignForm.employeeId} onChange={(e) => updateAssignField("employeeId", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                    <option value="">Select employee...</option>
                                    {employees.map((e: any) => <option key={e.id} value={e.id}>{[e.firstName, e.lastName].filter(Boolean).join(" ") || e.email}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Assigned Date</label>
                                    <input type="date" value={assignForm.assignedDate} onChange={(e) => updateAssignField("assignedDate", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Return Date</label>
                                    <input type="date" value={assignForm.returnDate} onChange={(e) => updateAssignField("returnDate", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Status</label>
                                <select value={assignForm.status} onChange={(e) => updateAssignField("status", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                    {ASSIGNMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Notes</label>
                                <textarea value={assignForm.notes} onChange={(e) => updateAssignField("notes", e.target.value)} rows={2} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none" />
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setAssignModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleSaveAssign} disabled={savingAssign} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {savingAssign && <Loader2 size={14} className="animate-spin" />}{savingAssign ? "Saving..." : assignEditingId ? "Update" : "Assign"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Category Confirmation ── */}
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
