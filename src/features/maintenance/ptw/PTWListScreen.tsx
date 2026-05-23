import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Filter, X, Plus, Loader2, Eye, Trash2, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePTWList } from "@/features/maintenance/api/use-maintenance-queries";
import { useCreatePTW, useDeletePTW } from "@/features/maintenance/api/use-maintenance-mutations";
import { useCompanyFormatter } from "@/hooks/useCompanyFormatter";
import { useCanPerform } from "@/hooks/useCanPerform";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Class badge ── */

const CLASS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
    HOT_WORK: { bg: "bg-danger-50 dark:bg-danger-900/20", text: "text-danger-700 dark:text-danger-400", label: "Hot Work" },
    CONFINED_SPACE: { bg: "bg-violet-50 dark:bg-violet-900/20", text: "text-violet-700 dark:text-violet-400", label: "Confined Space" },
    ELECTRICAL_ISOLATION: { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-700 dark:text-amber-400", label: "Electrical Isolation" },
    PRESSURE_RELEASE: { bg: "bg-cyan-50 dark:bg-cyan-900/20", text: "text-cyan-700 dark:text-cyan-400", label: "Pressure Release" },
    GENERAL_WORK: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-400", label: "General Work" },
};

function PTWClassBadge({ ptwClass }: { ptwClass: string }) {
    const cfg = CLASS_COLORS[ptwClass] ?? { bg: "bg-neutral-100 dark:bg-neutral-800", text: "text-neutral-600 dark:text-neutral-400", label: ptwClass };
    return <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", cfg.bg, cfg.text)}>{cfg.label}</span>;
}

/* ── Status badge ── */

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
    REQUESTED: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-400", label: "Requested" },
    UNDER_REVIEW: { bg: "bg-warning-50 dark:bg-warning-900/20", text: "text-warning-700 dark:text-warning-400", label: "Under Review" },
    ISSUED: { bg: "bg-success-50 dark:bg-success-900/20", text: "text-success-700 dark:text-success-400", label: "Issued" },
    ACTIVE: { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-400", label: "Active" },
    CLOSED: { bg: "bg-neutral-100 dark:bg-neutral-800", text: "text-neutral-600 dark:text-neutral-400", label: "Closed" },
    EXPIRED: { bg: "bg-neutral-100 dark:bg-neutral-800", text: "text-neutral-500 dark:text-neutral-500", label: "Expired" },
    REVOKED: { bg: "bg-danger-50 dark:bg-danger-900/20", text: "text-danger-700 dark:text-danger-400", label: "Revoked" },
};

function PTWStatusBadge({ status }: { status: string }) {
    const cfg = STATUS_COLORS[status] ?? STATUS_COLORS.REQUESTED;
    return <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", cfg.bg, cfg.text)}>{cfg.label}</span>;
}

/* ── Constants ── */

const CLASS_OPTIONS = [
    { value: "", label: "All Classes" },
    { value: "HOT_WORK", label: "Hot Work" },
    { value: "CONFINED_SPACE", label: "Confined Space" },
    { value: "ELECTRICAL_ISOLATION", label: "Electrical Isolation" },
    { value: "PRESSURE_RELEASE", label: "Pressure Release" },
    { value: "GENERAL_WORK", label: "General Work" },
];

const STATUS_OPTIONS = [
    { value: "", label: "All Statuses" },
    { value: "REQUESTED", label: "Requested" },
    { value: "UNDER_REVIEW", label: "Under Review" },
    { value: "ISSUED", label: "Issued" },
    { value: "ACTIVE", label: "Active" },
    { value: "CLOSED", label: "Closed" },
    { value: "EXPIRED", label: "Expired" },
    { value: "REVOKED", label: "Revoked" },
];

/* ── Screen ── */

export function PTWListScreen() {
    const fmt = useCompanyFormatter();
    const navigate = useNavigate();
    const canCreate = useCanPerform("maintenance:create");
    const canDelete = useCanPerform("maintenance:delete");

    const [search, setSearch] = useState("");
    const [ptwClass, setPtwClass] = useState("");
    const [status, setStatus] = useState("");
    const [page, setPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);

    // Create modal
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({
        ptwClass: "GENERAL_WORK",
        description: "",
        hazards: "",
        precautions: "",
        emergencyContact: "",
        isolationDetails: "",
    });

    const params: Record<string, unknown> = { page, limit: 25 };
    if (search) params.search = search;
    if (ptwClass) params.ptwClass = ptwClass;
    if (status) params.status = status;

    const { data, isLoading, isError } = usePTWList(params);
    const permits: any[] = data?.data ?? [];
    const meta = data?.meta ?? {};

    const createMutation = useCreatePTW();
    const deleteMutation = useDeletePTW();

    const hasFilters = ptwClass || status;
    const clearFilters = () => { setSearch(""); setPtwClass(""); setStatus(""); setPage(1); };

    const handleCreate = async () => {
        try {
            await createMutation.mutateAsync(form);
            showSuccess("Created", "Permit to Work created successfully.");
            setShowModal(false);
            setForm({ ptwClass: "GENERAL_WORK", description: "", hazards: "", precautions: "", emergencyContact: "", isolationDetails: "" });
        } catch (err) { showApiError(err); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this permit?")) return;
        try {
            await deleteMutation.mutateAsync(id);
            showSuccess("Deleted", "Permit deleted.");
        } catch (err) { showApiError(err); }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-primary-950 dark:text-white flex items-center gap-2">
                        <ShieldAlert size={24} className="text-primary-600" />
                        Permit to Work
                    </h1>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Manage safety permits for hazardous work activities</p>
                </div>
                {canCreate && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-semibold text-sm shadow-sm hover:shadow transition-all"
                    >
                        <Plus size={16} /> Create PTW
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search permits..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                </div>
                <button onClick={() => setShowFilters(!showFilters)} className={cn("inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all", hasFilters ? "border-primary-300 bg-primary-50 text-primary-700 dark:border-primary-700 dark:bg-primary-900/20 dark:text-primary-400" : "border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400")}>
                    <Filter size={16} /> Filters {hasFilters && <span className="w-2 h-2 rounded-full bg-primary-500" />}
                </button>
                {hasFilters && (
                    <button onClick={clearFilters} className="inline-flex items-center gap-1 px-3 py-2.5 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"><X size={14} /> Clear</button>
                )}
            </div>

            {showFilters && (
                <div className="flex flex-wrap gap-3 p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <select value={ptwClass} onChange={(e) => { setPtwClass(e.target.value); setPage(1); }} className="px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm">
                        {CLASS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm">
                        {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </div>
            )}

            {/* Table */}
            {isLoading ? (
                <SkeletonTable rows={8} cols={7} />
            ) : isError ? (
                <EmptyState icon="error" title="Failed to load permits" message="Please try again later." />
            ) : permits.length === 0 ? (
                <EmptyState icon="inbox" title="No permits found" message={hasFilters || search ? "Try adjusting your filters." : "Create your first Permit to Work."} />
            ) : (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                                    <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">Permit #</th>
                                    <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">Asset</th>
                                    <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">Class</th>
                                    <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">Status</th>
                                    <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">Requested By</th>
                                    <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">Requested Date</th>
                                    <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">Issued Date</th>
                                    <th className="text-right px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {permits.map((p: any) => (
                                    <tr key={p.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <Link to={`/app/maintenance/ptw/${p.id}`} className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400">{p.permitNumber ?? `PTW-${p.id?.slice(0, 6)}`}</Link>
                                        </td>
                                        <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">{p.asset?.name ?? p.assetName ?? "---"}</td>
                                        <td className="px-4 py-3"><PTWClassBadge ptwClass={p.ptwClass} /></td>
                                        <td className="px-4 py-3"><PTWStatusBadge status={p.status} /></td>
                                        <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">{p.requestedBy?.name ?? p.requestedByName ?? "---"}</td>
                                        <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">{p.createdAt ? fmt.date(p.createdAt) : "---"}</td>
                                        <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">{p.issuedAt ? fmt.date(p.issuedAt) : "---"}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <Link to={`/app/maintenance/ptw/${p.id}`} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-primary-600 transition-colors" title="View">
                                                    <Eye size={15} />
                                                </Link>
                                                {canDelete && p.status === "REQUESTED" && (
                                                    <button onClick={() => handleDelete(p.id)} disabled={deleteMutation.isPending} className="p-1.5 rounded-lg hover:bg-danger-50 dark:hover:bg-danger-900/20 text-neutral-400 hover:text-danger-600 transition-colors" title="Delete">
                                                        <Trash2 size={15} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination */}
                    {(meta.totalPages ?? 1) > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-100 dark:border-neutral-800">
                            <span className="text-xs text-neutral-500">Page {page} of {meta.totalPages} ({meta.total} total)</span>
                            <div className="flex gap-1">
                                <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 rounded-lg text-xs font-medium border border-neutral-200 dark:border-neutral-700 disabled:opacity-40">Prev</button>
                                <button disabled={page >= (meta.totalPages ?? 1)} onClick={() => setPage(page + 1)} className="px-3 py-1.5 rounded-lg text-xs font-medium border border-neutral-200 dark:border-neutral-700 disabled:opacity-40">Next</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">Create Permit to Work</h2>
                            <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"><X size={18} /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">PTW Class</label>
                                <select value={form.ptwClass} onChange={(e) => setForm({ ...form, ptwClass: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm">
                                    <option value="GENERAL_WORK">General Work</option>
                                    <option value="HOT_WORK">Hot Work</option>
                                    <option value="CONFINED_SPACE">Confined Space</option>
                                    <option value="ELECTRICAL_ISOLATION">Electrical Isolation</option>
                                    <option value="PRESSURE_RELEASE">Pressure Release</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Description</label>
                                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm resize-none" placeholder="Describe the work to be performed..." />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Hazards</label>
                                <textarea value={form.hazards} onChange={(e) => setForm({ ...form, hazards: e.target.value })} rows={2} className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm resize-none" placeholder="Identify potential hazards..." />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Precautions</label>
                                <textarea value={form.precautions} onChange={(e) => setForm({ ...form, precautions: e.target.value })} rows={2} className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm resize-none" placeholder="Safety precautions to follow..." />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Emergency Contact</label>
                                    <input value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm" placeholder="Phone or name" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Isolation Details</label>
                                    <input value={form.isolationDetails} onChange={(e) => setForm({ ...form, isolationDetails: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm" placeholder="LOTO, switches..." />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-medium">Cancel</button>
                            <button onClick={handleCreate} disabled={createMutation.isPending} className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-60">
                                {createMutation.isPending && <Loader2 size={14} className="animate-spin" />} Create
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
