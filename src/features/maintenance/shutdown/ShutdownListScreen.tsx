import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Filter, X, Plus, Loader2, Eye, Trash2, Calendar, DollarSign, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { useShutdowns } from "@/features/maintenance/api/use-maintenance-queries";
import { useCreateShutdown, useDeleteShutdown } from "@/features/maintenance/api/use-maintenance-mutations";
import { useCompanyLocations } from "@/features/company-admin/api/use-company-admin-queries";
import { useCompanyFormatter } from "@/hooks/useCompanyFormatter";
import { useCanPerform } from "@/hooks/useCanPerform";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";
import { HelpDrawer } from "@/components/ui/HelpDrawer";
import { shutdownListHelp } from "@/features/maintenance/help";

/* ── Type badge ── */

const TYPE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
    PLANNED_OVERHAUL: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-400", label: "Planned Overhaul" },
    STATUTORY_INSPECTION: { bg: "bg-violet-50 dark:bg-violet-900/20", text: "text-violet-700 dark:text-violet-400", label: "Statutory Inspection" },
    CORRECTIVE_MAJOR: { bg: "bg-danger-50 dark:bg-danger-900/20", text: "text-danger-700 dark:text-danger-400", label: "Corrective Major" },
    COMMISSIONING: { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-400", label: "Commissioning" },
};

function ShutdownTypeBadge({ type }: { type: string }) {
    const cfg = TYPE_COLORS[type] ?? { bg: "bg-neutral-100 dark:bg-neutral-800", text: "text-neutral-600 dark:text-neutral-400", label: type };
    return <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", cfg.bg, cfg.text)}>{cfg.label}</span>;
}

/* ── Status badge ── */

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
    DRAFT: { bg: "bg-neutral-100 dark:bg-neutral-800", text: "text-neutral-600 dark:text-neutral-400", label: "Draft" },
    APPROVED: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-400", label: "Approved" },
    IN_PROGRESS: { bg: "bg-warning-50 dark:bg-warning-900/20", text: "text-warning-700 dark:text-warning-400", label: "In Progress" },
    COMPLETED: { bg: "bg-success-50 dark:bg-success-900/20", text: "text-success-700 dark:text-success-400", label: "Completed" },
    CANCELLED: { bg: "bg-danger-50 dark:bg-danger-900/20", text: "text-danger-700 dark:text-danger-400", label: "Cancelled" },
};

function ShutdownStatusBadge({ status }: { status: string }) {
    const cfg = STATUS_COLORS[status] ?? STATUS_COLORS.DRAFT;
    return <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", cfg.bg, cfg.text)}>{cfg.label}</span>;
}

/* ── Constants ── */

const STATUS_OPTIONS = [
    { value: "", label: "All Statuses" },
    { value: "DRAFT", label: "Draft" },
    { value: "APPROVED", label: "Approved" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "COMPLETED", label: "Completed" },
    { value: "CANCELLED", label: "Cancelled" },
];

const TYPE_OPTIONS = [
    { value: "", label: "All Types" },
    { value: "PLANNED_OVERHAUL", label: "Planned Overhaul" },
    { value: "STATUTORY_INSPECTION", label: "Statutory Inspection" },
    { value: "CORRECTIVE_MAJOR", label: "Corrective Major" },
    { value: "COMMISSIONING", label: "Commissioning" },
];

/* ── Screen ── */

export function ShutdownListScreen() {
    const fmt = useCompanyFormatter();
    const canCreate = useCanPerform("maintenance:create");
    const canDelete = useCanPerform("maintenance:delete");

    const locationsQuery = useCompanyLocations();
    const locations: any[] = locationsQuery.data?.data ?? [];

    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [eventType, setEventType] = useState("");
    const [page, setPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);

    // Create modal
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({
        name: "",
        eventType: "PLANNED_OVERHAUL",
        locationId: "",
        lineWorkCenter: "",
        plannedStart: "",
        plannedEnd: "",
        estimatedCost: "",
        description: "",
    });

    const params: Record<string, unknown> = { page, limit: 25 };
    if (search) params.search = search;
    if (status) params.status = status;
    if (eventType) params.eventType = eventType;

    const { data, isLoading, isError } = useShutdowns(params);
    const shutdowns: any[] = data?.data ?? [];
    const meta = data?.meta ?? {};

    const createMutation = useCreateShutdown();
    const deleteMutation = useDeleteShutdown();

    const hasFilters = !!status || !!eventType;
    const clearFilters = () => { setSearch(""); setStatus(""); setEventType(""); setPage(1); };

    const handleCreate = async () => {
        try {
            await createMutation.mutateAsync({
                ...form,
                estimatedCost: form.estimatedCost ? Number(form.estimatedCost) : undefined,
                locationId: form.locationId || undefined,
                lineWorkCenter: form.lineWorkCenter || undefined,
            });
            showSuccess("Created", "Shutdown event created.");
            setShowModal(false);
            setForm({ name: "", eventType: "PLANNED_OVERHAUL", locationId: "", lineWorkCenter: "", plannedStart: "", plannedEnd: "", estimatedCost: "", description: "" });
        } catch (err) { showApiError(err); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this shutdown event?")) return;
        try {
            await deleteMutation.mutateAsync(id);
            showSuccess("Deleted", "Shutdown event deleted.");
        } catch (err) { showApiError(err); }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold text-primary-950 dark:text-white flex items-center gap-2">
                            <Wrench size={24} className="text-primary-600" />
                            Shutdown Events
                        </h1>
                        <HelpDrawer help={shutdownListHelp} />
                    </div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Plan and track major shutdown/overhaul events</p>
                </div>
                {canCreate && (
                    <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-semibold text-sm shadow-sm hover:shadow transition-all">
                        <Plus size={16} /> Create Shutdown
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                    <input type="text" placeholder="Search shutdowns..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                </div>
                <button onClick={() => setShowFilters(!showFilters)} className={cn("inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all", hasFilters ? "border-primary-300 bg-primary-50 text-primary-700 dark:border-primary-700 dark:bg-primary-900/20 dark:text-primary-400" : "border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400")}>
                    <Filter size={16} /> Filters {hasFilters && <span className="w-2 h-2 rounded-full bg-primary-500" />}
                </button>
                {hasFilters && <button onClick={clearFilters} className="inline-flex items-center gap-1 px-3 py-2.5 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"><X size={14} /> Clear</button>}
            </div>

            {showFilters && (
                <div className="flex flex-wrap gap-3 p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">Status</label>
                        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm min-w-[150px] focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">Event Type</label>
                        <select value={eventType} onChange={(e) => { setEventType(e.target.value); setPage(1); }} className="px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm min-w-[180px] focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                            {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </div>
                </div>
            )}

            {/* Table */}
            {isLoading ? (
                <SkeletonTable rows={8} cols={8} />
            ) : isError ? (
                <EmptyState icon="error" title="Failed to load shutdowns" message="Please try again later." />
            ) : shutdowns.length === 0 ? (
                <EmptyState icon="inbox" title="No shutdown events" message={hasFilters || search ? "Try adjusting your filters." : "Create your first shutdown event."} />
            ) : (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                                    <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">Name</th>
                                    <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">Location / Line</th>
                                    <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">Type</th>
                                    <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">Status</th>
                                    <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">Planned Start - End</th>
                                    <th className="text-right px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">WO Count</th>
                                    <th className="text-right px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">Budget</th>
                                    <th className="text-right px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">Actual Cost</th>
                                    <th className="text-right px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {shutdowns.map((s: any) => (
                                    <tr key={s.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <Link to={`/app/maintenance/shutdown/${s.id}`} className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400">{s.name ?? "---"}</Link>
                                        </td>
                                        <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">
                                            {locations.find((l: any) => l.id === s.locationId)?.name || s.location?.name || "---"}
                                            {s.lineWorkCenter ? ` / ${s.lineWorkCenter}` : ""}
                                        </td>
                                        <td className="px-4 py-3"><ShutdownTypeBadge type={s.eventType} /></td>
                                        <td className="px-4 py-3"><ShutdownStatusBadge status={s.status} /></td>
                                        <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400 text-xs">
                                            {s.plannedStart ? fmt.date(s.plannedStart) : "---"} - {s.plannedEnd ? fmt.date(s.plannedEnd) : "---"}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-neutral-700 dark:text-neutral-300">{s._count?.workOrders ?? s.woCount ?? 0}</td>
                                        <td className="px-4 py-3 text-right font-medium text-neutral-700 dark:text-neutral-300">{s.estimatedCost ? Number(s.estimatedCost).toLocaleString() : "---"}</td>
                                        <td className="px-4 py-3 text-right font-medium text-neutral-700 dark:text-neutral-300">{s.actualCost ? Number(s.actualCost).toLocaleString() : "---"}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <Link to={`/app/maintenance/shutdown/${s.id}`} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-primary-600 transition-colors" title="View">
                                                    <Eye size={15} />
                                                </Link>
                                                {canDelete && s.status === "DRAFT" && (
                                                    <button onClick={() => handleDelete(s.id)} disabled={deleteMutation.isPending} className="p-1.5 rounded-lg hover:bg-danger-50 dark:hover:bg-danger-900/20 text-neutral-400 hover:text-danger-600 transition-colors" title="Delete">
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
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">Create Shutdown Event</h2>
                            <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"><X size={18} /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Name</label>
                                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm" placeholder="e.g., Annual Overhaul 2026" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Event Type</label>
                                <select value={form.eventType} onChange={(e) => setForm({ ...form, eventType: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm">
                                    <option value="PLANNED_OVERHAUL">Planned Overhaul</option>
                                    <option value="STATUTORY_INSPECTION">Statutory Inspection</option>
                                    <option value="CORRECTIVE_MAJOR">Corrective Major</option>
                                    <option value="COMMISSIONING">Commissioning</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Location</label>
                                    <select
                                        value={form.locationId}
                                        onChange={(e) => setForm({ ...form, locationId: e.target.value })}
                                        className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    >
                                        <option value="">Select location...</option>
                                        {locations.map((l: any) => (
                                            <option key={l.id} value={l.id}>{l.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Production Line</label>
                                    <input
                                        type="text"
                                        value={form.lineWorkCenter}
                                        onChange={(e) => setForm({ ...form, lineWorkCenter: e.target.value })}
                                        className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        placeholder="e.g., Line 1, Packaging"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Planned Start</label>
                                    <input type="date" value={form.plannedStart} onChange={(e) => setForm({ ...form, plannedStart: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Planned End</label>
                                    <input type="date" value={form.plannedEnd} onChange={(e) => setForm({ ...form, plannedEnd: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Estimated Budget</label>
                                <input type="number" value={form.estimatedCost} onChange={(e) => setForm({ ...form, estimatedCost: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm" placeholder="0.00" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Description</label>
                                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm resize-none" placeholder="Describe the shutdown scope..." />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-medium">Cancel</button>
                            <button onClick={handleCreate} disabled={!form.name || createMutation.isPending} className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-60">
                                {createMutation.isPending && <Loader2 size={14} className="animate-spin" />} Create
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
