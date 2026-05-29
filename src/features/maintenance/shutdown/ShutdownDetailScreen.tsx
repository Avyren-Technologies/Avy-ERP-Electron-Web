import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Loader2, Plus, Trash2, X, Wrench, Calendar, DollarSign, CheckCircle, BarChart3, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { useShutdown, useShutdownProgress, useWorkOrders } from "@/features/maintenance/api/use-maintenance-queries";
import { useApproveShutdown, useStartShutdown, useCompleteShutdown, useAddShutdownWOs, useRemoveShutdownWO, useUpdateShutdown } from "@/features/maintenance/api/use-maintenance-mutations";
import { useCompanyLocations } from "@/features/company-admin/api/use-company-admin-queries";
import { useCompanyFormatter } from "@/hooks/useCompanyFormatter";
import { useCanPerform } from "@/hooks/useCanPerform";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";
import { HelpDrawer } from "@/components/ui/HelpDrawer";
import { shutdownDetailHelp } from "@/features/maintenance/help";

/* ── Type badge ── */

const TYPE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
    PLANNED_OVERHAUL: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-400", label: "Planned Overhaul" },
    STATUTORY_INSPECTION: { bg: "bg-violet-50 dark:bg-violet-900/20", text: "text-violet-700 dark:text-violet-400", label: "Statutory Inspection" },
    CORRECTIVE_MAJOR: { bg: "bg-danger-50 dark:bg-danger-900/20", text: "text-danger-700 dark:text-danger-400", label: "Corrective Major" },
    COMMISSIONING: { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-400", label: "Commissioning" },
};

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
    DRAFT: { bg: "bg-neutral-100 dark:bg-neutral-800", text: "text-neutral-600 dark:text-neutral-400", label: "Draft" },
    APPROVED: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-400", label: "Approved" },
    IN_PROGRESS: { bg: "bg-warning-50 dark:bg-warning-900/20", text: "text-warning-700 dark:text-warning-400", label: "In Progress" },
    COMPLETED: { bg: "bg-success-50 dark:bg-success-900/20", text: "text-success-700 dark:text-success-400", label: "Completed" },
    CANCELLED: { bg: "bg-danger-50 dark:bg-danger-900/20", text: "text-danger-700 dark:text-danger-400", label: "Cancelled" },
};

const WO_STATUS_COLORS: Record<string, string> = {
    DRAFT: "bg-neutral-200 dark:bg-neutral-700",
    PLANNED: "bg-blue-200 dark:bg-blue-800",
    ASSIGNED: "bg-indigo-200 dark:bg-indigo-800",
    IN_PROGRESS: "bg-warning-200 dark:bg-warning-800",
    COMPLETED: "bg-success-200 dark:bg-success-800",
    CLOSED: "bg-neutral-300 dark:bg-neutral-600",
};

/* ── Screen ── */

export function ShutdownDetailScreen() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const fmt = useCompanyFormatter();
    const canApprove = useCanPerform("maintenance:approve");
    const canManage = useCanPerform("maintenance:create");

    const { data, isLoading } = useShutdown(id ?? "");
    const shutdown: any = data?.data ?? {};

    const { data: progressData } = useShutdownProgress(id ?? "");
    const progress: any = progressData?.data ?? {};

    const locationsQuery = useCompanyLocations();
    const locations: any[] = locationsQuery.data?.data ?? [];

    const [activeTab, setActiveTab] = useState<"overview" | "work-orders" | "progress">("overview");

    // Add WO modal
    const [showAddWO, setShowAddWO] = useState(false);
    const [woSearch, setWoSearch] = useState("");
    const { data: woData } = useWorkOrders({ search: woSearch || undefined, limit: 20 });
    const searchWOs: any[] = woData?.data ?? [];

    const approveMutation = useApproveShutdown();
    const startMutation = useStartShutdown();
    const completeMutation = useCompleteShutdown();
    const addWOMutation = useAddShutdownWOs();
    const removeWOMutation = useRemoveShutdownWO();
    const updateMutation = useUpdateShutdown();

    // Edit state
    const [showEdit, setShowEdit] = useState(false);
    const [editForm, setEditForm] = useState<any>(null);

    const openEdit = () => {
        setEditForm({
            name: shutdown.name ?? "",
            eventType: shutdown.eventType ?? "PLANNED_OVERHAUL",
            plannedStart: shutdown.plannedStart ? shutdown.plannedStart.slice(0, 10) : "",
            plannedEnd: shutdown.plannedEnd ? shutdown.plannedEnd.slice(0, 10) : "",
            estimatedCost: shutdown.estimatedCost != null ? String(shutdown.estimatedCost) : "",
            locationId: shutdown.locationId ?? "",
            lineWorkCenter: shutdown.lineWorkCenter ?? "",
            actualCost: shutdown.actualCost != null ? String(shutdown.actualCost) : "",
        });
        setShowEdit(true);
    };

    const handleEdit = async () => {
        if (!id || !editForm) return;
        try {
            await updateMutation.mutateAsync({
                id,
                data: {
                    name: editForm.name || undefined,
                    eventType: editForm.eventType || undefined,
                    plannedStart: editForm.plannedStart || undefined,
                    plannedEnd: editForm.plannedEnd || undefined,
                    estimatedCost: editForm.estimatedCost !== "" ? Number(editForm.estimatedCost) : undefined,
                    locationId: editForm.locationId || undefined,
                    lineWorkCenter: editForm.lineWorkCenter || undefined,
                    actualCost: editForm.actualCost !== "" ? Number(editForm.actualCost) : undefined,
                },
            });
            showSuccess("Updated", "Shutdown event updated successfully.");
            setShowEdit(false);
        } catch (err) { showApiError(err); }
    };

    const isPending = approveMutation.isPending || startMutation.isPending || completeMutation.isPending;

    const shutdownWOs: any[] = shutdown.workOrders ?? shutdown.shutdownWorkOrders ?? [];
    const typeCfg = TYPE_COLORS[shutdown.eventType] ?? TYPE_COLORS.PLANNED_OVERHAUL;
    const statusCfg = STATUS_COLORS[shutdown.status] ?? STATUS_COLORS.DRAFT;

    const completionPct = progress.completionPct ?? (shutdownWOs.length > 0 ? Math.round((shutdownWOs.filter((w: any) => w.status === "COMPLETED" || w.status === "CLOSED").length / shutdownWOs.length) * 100) : 0);

    const handleAction = async (action: "approve" | "start" | "complete") => {
        if (!id) return;
        try {
            if (action === "approve") await approveMutation.mutateAsync({ id });
            else if (action === "start") await startMutation.mutateAsync({ id });
            else await completeMutation.mutateAsync({ id });
            showSuccess("Updated", `Shutdown ${action === "approve" ? "approved" : action === "start" ? "started" : "completed"}.`);
        } catch (err) { showApiError(err); }
    };

    const handleAddWO = async (woId: string) => {
        if (!id) return;
        try {
            await addWOMutation.mutateAsync({ id, data: { workOrderIds: [woId] } });
            showSuccess("Added", "Work order linked.");
            setShowAddWO(false);
            setWoSearch("");
        } catch (err) { showApiError(err); }
    };

    const handleRemoveWO = async (woId: string) => {
        if (!id) return;
        try {
            await removeWOMutation.mutateAsync({ id, woId });
            showSuccess("Removed", "Work order removed.");
        } catch (err) { showApiError(err); }
    };

    if (isLoading) return <SkeletonTable rows={6} cols={3} />;

    const tabs = ["overview", "work-orders", "progress"] as const;

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"><ArrowLeft size={18} /></button>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold text-primary-950 dark:text-white flex items-center gap-2">
                            <Wrench size={22} className="text-primary-600" />
                            {shutdown.name ?? "Shutdown Detail"}
                        </h1>
                        <HelpDrawer help={shutdownDetailHelp} />
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                        <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", typeCfg.bg, typeCfg.text)}>{typeCfg.label}</span>
                        <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", statusCfg.bg, statusCfg.text)}>{statusCfg.label}</span>
                    </div>
                </div>
                {canManage && ["DRAFT", "APPROVED"].includes(shutdown.status) && (
                    <button onClick={openEdit} className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                        <Pencil size={14} /> Edit
                    </button>
                )}
                {canApprove && (
                    <div className="flex items-center gap-2">
                        {shutdown.status === "DRAFT" && (
                            <button onClick={() => handleAction("approve")} disabled={isPending} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">
                                {isPending && <Loader2 size={14} className="animate-spin" />} Approve
                            </button>
                        )}
                        {shutdown.status === "APPROVED" && (
                            <button onClick={() => handleAction("start")} disabled={isPending} className="inline-flex items-center gap-2 px-4 py-2 bg-warning-600 text-white rounded-xl text-sm font-semibold hover:bg-warning-700 disabled:opacity-60">
                                {isPending && <Loader2 size={14} className="animate-spin" />} Start
                            </button>
                        )}
                        {shutdown.status === "IN_PROGRESS" && (
                            <button onClick={() => handleAction("complete")} disabled={isPending} className="inline-flex items-center gap-2 px-4 py-2 bg-success-600 text-white rounded-xl text-sm font-semibold hover:bg-success-700 disabled:opacity-60">
                                {isPending && <Loader2 size={14} className="animate-spin" />} Complete
                            </button>
                        )}
                        {(shutdown.status === "IN_PROGRESS" || shutdown.status === "APPROVED") && (
                            <Link to={`/app/maintenance/shutdown/${id}/progress`} className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-800">
                                <BarChart3 size={14} /> Progress
                            </Link>
                        )}
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-neutral-200 dark:border-neutral-700 gap-1">
                {tabs.map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={cn("px-4 py-2.5 text-sm font-medium capitalize border-b-2 -mb-px transition-colors", activeTab === tab ? "border-primary-600 text-primary-700 dark:text-primary-400" : "border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300")}>
                        {tab.replace("-", " ")}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === "overview" && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                            { label: "Location", value: locations.find((l: any) => l.id === shutdown.locationId)?.name || shutdown.location?.name || "---" },
                            { label: "Production Line", value: shutdown.lineWorkCenter ?? "---" },
                            { label: "Planned Start", value: shutdown.plannedStart ? fmt.date(shutdown.plannedStart) : "---" },
                            { label: "Planned End", value: shutdown.plannedEnd ? fmt.date(shutdown.plannedEnd) : "---" },
                        ].map((c) => (
                            <div key={c.label} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">{c.label}</p>
                                <p className="text-sm font-semibold text-primary-950 dark:text-white truncate">{c.value}</p>
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                            { label: "Work Orders", value: String(shutdownWOs.length), icon: Wrench },
                            { label: "Completion", value: `${completionPct}%`, icon: CheckCircle },
                            { label: "Budget", value: shutdown.estimatedCost ? Number(shutdown.estimatedCost).toLocaleString() : "---", icon: DollarSign },
                            { label: "Actual Cost", value: shutdown.actualCost ? Number(shutdown.actualCost).toLocaleString() : "---", icon: DollarSign },
                        ].map((c) => (
                            <div key={c.label} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1 flex items-center gap-1"><c.icon size={10} /> {c.label}</p>
                                <p className="text-lg font-bold text-primary-950 dark:text-white">{c.value}</p>
                            </div>
                        ))}
                    </div>
                    {shutdown.description && (
                        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">Description</h3>
                            <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">{shutdown.description}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Work Orders Tab */}
            {activeTab === "work-orders" && (
                <div className="space-y-4">
                    {canManage && (shutdown.status === "DRAFT" || shutdown.status === "APPROVED" || shutdown.status === "IN_PROGRESS") && (
                        <button onClick={() => setShowAddWO(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700">
                            <Plus size={14} /> Add Work Orders
                        </button>
                    )}
                    {shutdownWOs.length === 0 ? (
                        <EmptyState icon="inbox" title="No work orders" message="Add work orders to this shutdown event." />
                    ) : (
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                                        <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">WO Number</th>
                                        <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">Type</th>
                                        <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">Status</th>
                                        <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">Asset</th>
                                        <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">Assignee</th>
                                        <th className="text-right px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {shutdownWOs.map((wo: any) => {
                                        const woItem = wo.workOrder ?? wo;
                                        return (
                                            <tr key={woItem.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                                                <td className="px-4 py-3">
                                                    <Link to={`/app/maintenance/work-orders/${woItem.id}`} className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400">{woItem.woNumber ?? "---"}</Link>
                                                </td>
                                                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{woItem.woType ?? "---"}</td>
                                                <td className="px-4 py-3">
                                                    <span className={cn("inline-block w-2 h-2 rounded-full mr-1.5", WO_STATUS_COLORS[woItem.status] ?? "bg-neutral-300")} />
                                                    <span className="text-xs text-neutral-600 dark:text-neutral-400">{woItem.status}</span>
                                                </td>
                                                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{woItem.asset?.name ?? "---"}</td>
                                                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{woItem.assignee?.name ?? "---"}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex justify-end">
                                                        {canManage && shutdown.status !== "COMPLETED" && (
                                                            <button onClick={() => handleRemoveWO(woItem.id)} disabled={removeWOMutation.isPending} className="p-1.5 rounded-lg hover:bg-danger-50 dark:hover:bg-danger-900/20 text-neutral-400 hover:text-danger-600 transition-colors" title="Remove">
                                                                <Trash2 size={15} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Progress Tab */}
            {activeTab === "progress" && (
                <div className="space-y-6">
                    {/* Completion bar */}
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-primary-950 dark:text-white">Overall Completion</h3>
                            <span className="text-2xl font-bold text-primary-600">{completionPct}%</span>
                        </div>
                        <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-3">
                            <div className="bg-primary-600 h-3 rounded-full transition-all duration-500" style={{ width: `${completionPct}%` }} />
                        </div>
                    </div>

                    {/* WO Status breakdown */}
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
                        <h3 className="text-sm font-bold text-primary-950 dark:text-white mb-4">Work Order Status Breakdown</h3>
                        {(() => {
                            const statusCounts: Record<string, number> = {};
                            shutdownWOs.forEach((wo: any) => {
                                const s = (wo.workOrder ?? wo).status ?? "UNKNOWN";
                                statusCounts[s] = (statusCounts[s] ?? 0) + 1;
                            });
                            const total = shutdownWOs.length || 1;
                            return (
                                <div className="space-y-3">
                                    {Object.entries(statusCounts).map(([s, count]) => (
                                        <div key={s}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">{s.replace(/_/g, " ")}</span>
                                                <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">{count}</span>
                                            </div>
                                            <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2">
                                                <div className={cn("h-2 rounded-full transition-all", WO_STATUS_COLORS[s] ?? "bg-neutral-400")} style={{ width: `${(count / total) * 100}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                    </div>

                    {/* Budget vs Actual */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">Budget</h3>
                            <p className="text-2xl font-bold text-primary-950 dark:text-white">{shutdown.estimatedCost ? Number(shutdown.estimatedCost).toLocaleString() : "---"}</p>
                        </div>
                        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">Actual Cost</h3>
                            <p className={cn("text-2xl font-bold", shutdown.actualCost && shutdown.estimatedCost && Number(shutdown.actualCost) > Number(shutdown.estimatedCost) ? "text-danger-600" : "text-success-600")}>
                                {shutdown.actualCost ? Number(shutdown.actualCost).toLocaleString() : "---"}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Add WO Modal */}
            {showAddWO && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowAddWO(false)}>
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">Add Work Orders</h2>
                            <button onClick={() => setShowAddWO(false)} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"><X size={18} /></button>
                        </div>
                        <input type="text" placeholder="Search work orders..." value={woSearch} onChange={(e) => setWoSearch(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm" />
                        <div className="max-h-60 overflow-y-auto space-y-1">
                            {searchWOs.length === 0 ? (
                                <p className="text-sm text-neutral-400 text-center py-4">No work orders found</p>
                            ) : searchWOs.map((wo: any) => (
                                <button key={wo.id} onClick={() => handleAddWO(wo.id)} disabled={addWOMutation.isPending} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center justify-between">
                                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{wo.woNumber} - {wo.asset?.name ?? "N/A"}</span>
                                    <span className="text-xs text-neutral-400">{wo.status}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Edit Shutdown Modal ── */}
            {showEdit && editForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
                    <div className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white flex items-center gap-2"><Pencil size={16} /> Edit Shutdown Event</h2>
                            <button onClick={() => setShowEdit(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"><X size={18} /></button>
                        </div>

                        {/* Modal Body */}
                        <div className="overflow-y-auto p-6 space-y-4 flex-1">
                            {/* Name */}
                            <div>
                                <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1.5 uppercase tracking-wider">Event Name *</label>
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>

                            {/* Location */}
                            <div>
                                <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1.5 uppercase tracking-wider">Location</label>
                                <select
                                    value={editForm.locationId}
                                    onChange={(e) => setEditForm({ ...editForm, locationId: e.target.value })}
                                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                >
                                    <option value="">Select location...</option>
                                    {locations.map((l: any) => (
                                        <option key={l.id} value={l.id}>{l.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Production Line */}
                            <div>
                                <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1.5 uppercase tracking-wider">Production Line</label>
                                <input
                                    type="text"
                                    value={editForm.lineWorkCenter}
                                    onChange={(e) => setEditForm({ ...editForm, lineWorkCenter: e.target.value })}
                                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="e.g., Line 1, Packaging"
                                />
                            </div>

                            {/* Actual Cost */}
                            <div>
                                <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1.5 uppercase tracking-wider">Actual Cost</label>
                                <input
                                    type="number"
                                    value={editForm.actualCost}
                                    onChange={(e) => setEditForm({ ...editForm, actualCost: e.target.value })}
                                    placeholder="0.00"
                                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>

                            {/* Event Type */}
                            <div>
                                <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1.5 uppercase tracking-wider">Event Type</label>
                                <select
                                    value={editForm.eventType}
                                    onChange={(e) => setEditForm({ ...editForm, eventType: e.target.value })}
                                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                >
                                    <option value="PLANNED_OVERHAUL">Planned Overhaul</option>
                                    <option value="STATUTORY_INSPECTION">Statutory Inspection</option>
                                    <option value="CORRECTIVE_MAJOR">Corrective Major</option>
                                    <option value="COMMISSIONING">Commissioning</option>
                                </select>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1.5 uppercase tracking-wider">Planned Start</label>
                                    <input
                                        type="date"
                                        value={editForm.plannedStart}
                                        onChange={(e) => setEditForm({ ...editForm, plannedStart: e.target.value })}
                                        className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1.5 uppercase tracking-wider">Planned End</label>
                                    <input
                                        type="date"
                                        value={editForm.plannedEnd}
                                        onChange={(e) => setEditForm({ ...editForm, plannedEnd: e.target.value })}
                                        className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Estimated Budget (estimatedCost) */}
                            <div>
                                <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1.5 uppercase tracking-wider">Estimated Budget</label>
                                <input
                                    type="number"
                                    value={editForm.estimatedCost}
                                    onChange={(e) => setEditForm({ ...editForm, estimatedCost: e.target.value })}
                                    placeholder="0.00"
                                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-700 flex justify-end gap-3">
                            <button onClick={() => setShowEdit(false)} className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={handleEdit}
                                disabled={updateMutation.isPending || !editForm.name}
                                className="px-5 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-60 flex items-center gap-2 transition-colors"
                            >
                                {updateMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
