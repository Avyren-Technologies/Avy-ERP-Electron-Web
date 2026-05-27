import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Filter, X, Plus, Loader2, Eye, Trash2, Edit2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useContracts, useExpiringContracts } from "@/features/maintenance/api/use-maintenance-queries";
import { useCreateContract, useUpdateContract, useDeleteContract } from "@/features/maintenance/api/use-maintenance-mutations";
import { useCompanyFormatter } from "@/hooks/useCompanyFormatter";
import { useCanPerform } from "@/hooks/useCanPerform";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Type Badge ── */

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
    WARRANTY: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-400" },
    AMC: { bg: "bg-violet-50 dark:bg-violet-900/20", text: "text-violet-700 dark:text-violet-400" },
    CAMC: { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-400" },
    RENTAL: { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-700 dark:text-amber-400" },
    SERVICE: { bg: "bg-cyan-50 dark:bg-cyan-900/20", text: "text-cyan-700 dark:text-cyan-400" },
};

function ContractTypeBadge({ type }: { type: string }) {
    const cfg = TYPE_COLORS[type] ?? { bg: "bg-neutral-100 dark:bg-neutral-800", text: "text-neutral-600 dark:text-neutral-400" };
    return <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", cfg.bg, cfg.text)}>{type}</span>;
}

/* ── Expiry Badge ── */

function ExpiryBadge({ endDate }: { endDate: string }) {
    if (!endDate) return <span className="text-xs text-neutral-400">---</span>;
    const now = new Date();
    const end = new Date(endDate);
    const daysLeft = Math.ceil((end.getTime() - now.getTime()) / 86400000);

    if (daysLeft < 0) return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500">Expired</span>;
    if (daysLeft <= 30) return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-danger-50 text-danger-700 dark:bg-danger-900/20 dark:text-danger-400">{daysLeft}d left</span>;
    if (daysLeft <= 90) return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-warning-50 text-warning-700 dark:bg-warning-900/20 dark:text-warning-400">{daysLeft}d left</span>;
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-success-50 text-success-700 dark:bg-success-900/20 dark:text-success-400">{daysLeft}d left</span>;
}

/* ── Screen ── */

export function ContractListScreen() {
    const fmt = useCompanyFormatter();
    const canCreate = useCanPerform("maintenance:create");
    const canDelete = useCanPerform("maintenance:delete");

    const [search, setSearch] = useState("");
    const [type, setType] = useState("");
    const [active, setActive] = useState("");
    const [page, setPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState({ name: "", code: "", contractType: "AMC", vendorName: "", startDate: "", endDate: "", callLimit: "", contractValue: "", coverageScope: "" });

    const params: Record<string, unknown> = { page, limit: 25 };
    if (search) params.search = search;
    if (type) params.contractType = type;
    if (active) params.active = active;

    const { data, isLoading, isError } = useContracts(params);
    const contracts: any[] = data?.data ?? [];
    const meta = data?.meta ?? {};

    const { data: expiringData } = useExpiringContracts({ withinDays: 30 });
    const expiringContracts: any[] = expiringData?.data ?? [];

    const createMutation = useCreateContract();
    const updateMutation = useUpdateContract();
    const deleteMutation = useDeleteContract();

    const hasFilters = type || active;

    const clearFilters = () => { setSearch(""); setType(""); setActive(""); setPage(1); };

    const openAddModal = () => {
        setEditId(null);
        setForm({ name: "", code: "", contractType: "AMC", vendorName: "", startDate: "", endDate: "", callLimit: "", contractValue: "", coverageScope: "" });
        setShowModal(true);
    };

    const openEditModal = (c: any) => {
        setEditId(c.id);
        setForm({
            name: c.name ?? "",
            code: c.contractCode ?? "",
            contractType: c.contractType ?? "AMC",
            vendorName: c.vendorName ?? "",
            startDate: c.startDate ? c.startDate.split("T")[0] : "",
            endDate: c.endDate ? c.endDate.split("T")[0] : "",
            callLimit: c.callLimit?.toString() ?? "",
            contractValue: c.contractValue?.toString() ?? "",
            coverageScope: c.coverageScope ?? "",
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        try {
            const { code, ...rest } = form;
            const payload = {
                ...rest,
                callLimit: form.callLimit ? Number(form.callLimit) : undefined,
                contractValue: form.contractValue ? Number(form.contractValue) : undefined,
            };
            if (editId) {
                await updateMutation.mutateAsync({ id: editId, data: payload });
                showSuccess("Updated", "Contract updated successfully.");
            } else {
                await createMutation.mutateAsync(payload);
                showSuccess("Created", "Contract created successfully.");
            }
            setShowModal(false);
        } catch (err) {
            showApiError(err);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteMutation.mutateAsync(id);
            showSuccess("Deleted", "Contract deleted successfully.");
        } catch (err) {
            showApiError(err);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Contracts</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Manage maintenance contracts, AMCs, and warranties</p>
                </div>
                {canCreate && (
                    <button onClick={openAddModal} className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none">
                        <Plus className="w-5 h-5" />
                        Add Contract
                    </button>
                )}
            </div>

            {/* Expiring Soon Alert */}
            {expiringContracts.length > 0 && (
                <div className="bg-warning-50 dark:bg-warning-900/10 border border-warning-200 dark:border-warning-800/50 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-warning-600 dark:text-warning-400" />
                        <span className="text-sm font-bold text-warning-700 dark:text-warning-400">Expiring Soon ({expiringContracts.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {expiringContracts.slice(0, 5).map((c: any) => (
                            <Link key={c.id} to={`/app/maintenance/contracts/${c.id}`} className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-neutral-800 rounded-lg border border-warning-200 dark:border-warning-800/50 text-xs font-bold text-warning-700 dark:text-warning-400 hover:bg-warning-50 transition-colors">
                                {c.name} <ExpiryBadge endDate={c.endDate} />
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm space-y-3">
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                        <input type="text" placeholder="Search contracts..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                    </div>
                    <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                        <option value="">All Types</option>
                        <option value="WARRANTY">Warranty</option>
                        <option value="AMC">AMC</option>
                        <option value="CAMC">CAMC</option>
                        <option value="RENTAL">Rental</option>
                        <option value="SERVICE">Service</option>
                    </select>
                    <button onClick={() => setShowFilters(!showFilters)} className={cn("p-2.5 rounded-xl border transition-colors", showFilters || hasFilters ? "bg-primary-50 text-primary-600 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50" : "border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800")}><Filter size={16} /></button>
                    {hasFilters && <button onClick={clearFilters} className="text-xs font-bold text-danger-600 dark:text-danger-400 hover:underline flex items-center gap-1"><X size={12} /> Clear</button>}
                </div>

                {showFilters && (
                    <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800">
                        <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Status</label>
                        <select value={active} onChange={(e) => { setActive(e.target.value); setPage(1); }} className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                            <option value="">All</option>
                            <option value="true">Active</option>
                            <option value="false">Expired</option>
                        </select>
                    </div>
                )}
            </div>

            {isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
                    Failed to load contracts.
                </div>
            )}

            {/* Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? (
                    <SkeletonTable rows={8} cols={8} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1100px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Code</th>
                                    <th className="py-4 px-6 font-bold">Name</th>
                                    <th className="py-4 px-6 font-bold">Type</th>
                                    <th className="py-4 px-6 font-bold">Vendor</th>
                                    <th className="py-4 px-6 font-bold">Period</th>
                                    <th className="py-4 px-6 font-bold text-center">Calls</th>
                                    <th className="py-4 px-6 font-bold">Expiry</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {contracts.map((c: any) => (
                                    <tr key={c.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50">{c.contractCode ?? "---"}</span>
                                        </td>
                                        <td className="py-4 px-6 font-bold text-primary-950 dark:text-white">{c.name ?? "---"}</td>
                                        <td className="py-4 px-6"><ContractTypeBadge type={c.contractType ?? "AMC"} /></td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">{c.vendorName ?? "---"}</td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">
                                            {c.startDate ? fmt.date(c.startDate) : "---"} - {c.endDate ? fmt.date(c.endDate) : "---"}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            {(() => {
                                                const exceeded = c.callLimit != null && (c.callsUsed ?? 0) > c.callLimit;
                                                return (
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span className={cn(
                                                            "text-xs font-bold",
                                                            exceeded ? "text-danger-600 dark:text-danger-400" : "text-neutral-700 dark:text-neutral-300"
                                                        )}>
                                                            {c.callsUsed ?? 0}/{c.callLimit ?? "∞"}
                                                        </span>
                                                        {exceeded && (
                                                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-danger-50 text-danger-700 border border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50">
                                                                ⚠ Exceeded
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                        <td className="py-4 px-6"><ExpiryBadge endDate={c.endDate} /></td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => openEditModal(c)} className="p-2 text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg transition-colors" title="Edit"><Edit2 size={14} /></button>
                                                <Link to={`/app/maintenance/contracts/${c.id}`} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="View"><Eye size={15} /></Link>
                                                {canDelete && (
                                                    <button onClick={() => handleDelete(c.id)} disabled={deleteMutation.isPending} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" title="Delete"><Trash2 size={14} /></button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {contracts.length === 0 && !isLoading && (
                                    <tr><td colSpan={8}><EmptyState icon="list" title="No contracts found" message="Add a contract to manage maintenance agreements." /></td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {meta.totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">Page {meta.page} of {meta.totalPages} ({meta.total} total)</span>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 rounded-lg text-xs font-bold border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 transition-colors">Previous</button>
                            <button onClick={() => setPage((p) => p + 1)} disabled={page >= meta.totalPages} className="px-3 py-1.5 rounded-lg text-xs font-bold border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 transition-colors">Next</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
                            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">{editId ? "Edit Contract" : "Add Contract"}</h3>
                            <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:text-neutral-300 dark:hover:bg-neutral-800 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Name <span className="text-red-500">*</span></label>
                                    <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Type</label>
                                    <select value={form.contractType} onChange={(e) => setForm({ ...form, contractType: e.target.value })} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                        <option value="WARRANTY">Warranty</option>
                                        <option value="AMC">AMC</option>
                                        <option value="CAMC">CAMC</option>
                                        <option value="RENTAL">Rental</option>
                                        <option value="SERVICE">Service</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Vendor</label>
                                    <input type="text" value={form.vendorName} onChange={(e) => setForm({ ...form, vendorName: e.target.value })} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Start Date</label>
                                    <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">End Date</label>
                                    <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Call Limit</label>
                                    <input type="number" value={form.callLimit} onChange={(e) => setForm({ ...form, callLimit: e.target.value })} placeholder="Unlimited" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Contract Value</label>
                                    <input type="number" value={form.contractValue} onChange={(e) => setForm({ ...form, contractValue: e.target.value })} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                </div>
                                {editId && (
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Contract Code</label>
                                        <input type="text" value={form.code} disabled className="w-full px-3 py-2.5 bg-neutral-100 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm dark:text-neutral-400 text-neutral-500 cursor-not-allowed" />
                                    </div>
                                )}
                                <div className="col-span-2">
                                    <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Coverage Scope</label>
                                    <textarea value={form.coverageScope} onChange={(e) => setForm({ ...form, coverageScope: e.target.value })} rows={3} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all resize-none" placeholder="Describe contract coverage, terms, and inclusions..." />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 px-6 py-4 border-t border-neutral-200 dark:border-neutral-700">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium rounded-xl border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending || !form.name} className="px-6 py-2 text-sm font-bold rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center gap-2">
                                {(createMutation.isPending || updateMutation.isPending) && <Loader2 size={14} className="animate-spin" />}
                                {editId ? "Update" : "Create"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
