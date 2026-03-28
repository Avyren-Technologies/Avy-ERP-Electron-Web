import { useState } from "react";
import {
    Activity,
    Plus,
    Edit3,
    Trash2,
    Loader2,
    X,
    Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompanyIOTReasons } from "@/features/company-admin/api/use-company-admin-queries";
import { useCreateIOTReason, useUpdateIOTReason, useDeleteIOTReason } from "@/features/company-admin/api/use-company-admin-mutations";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

function FormField({ label, value, onChange, placeholder, type = "text" }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
    return (
        <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">{label}</label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
            />
        </div>
    );
}

const EMPTY_REASON = {
    reasonType: "Machine Idle",
    reason: "",
    department: "",
    planned: false,
    duration: "",
};

export function IOTReasonManagementScreen() {
    const { data, isLoading, isError } = useCompanyIOTReasons();
    const createMutation = useCreateIOTReason();
    const updateMutation = useUpdateIOTReason();
    const deleteMutation = useDeleteIOTReason();

    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState("All");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...EMPTY_REASON });
    const [deleteTarget, setDeleteTarget] = useState<any>(null);

    const reasons: any[] = data?.data ?? [];
    const filtered = reasons.filter((r: any) => {
        if (filterType !== "All" && r.reasonType !== filterType) return false;
        if (!search) return true;
        const s = search.toLowerCase();
        return r.reason?.toLowerCase().includes(s) || r.department?.toLowerCase().includes(s);
    });

    const openCreate = () => {
        setEditingId(null);
        setForm({ ...EMPTY_REASON });
        setModalOpen(true);
    };

    const openEdit = (reason: any) => {
        setEditingId(reason.id);
        setForm({
            reasonType: reason.reasonType ?? "Machine Idle",
            reason: reason.reason ?? "",
            department: reason.department ?? "",
            planned: reason.planned ?? false,
            duration: reason.duration ?? "",
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        try {
            const payload = { ...form };
            if (!payload.planned) {
                payload.duration = "";
            }
            if (editingId) {
                await updateMutation.mutateAsync({ id: editingId, data: payload });
                showSuccess("Reason Updated", `${form.reason} has been updated.`);
            } else {
                await createMutation.mutateAsync(payload);
                showSuccess("Reason Created", `${form.reason} has been added.`);
            }
            setModalOpen(false);
        } catch (err) {
            showApiError(err);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteMutation.mutateAsync(deleteTarget.id);
            showSuccess("Reason Deleted", `${deleteTarget.reason} has been removed.`);
            setDeleteTarget(null);
        } catch (err) {
            showApiError(err);
        }
    };

    const saving = createMutation.isPending || updateMutation.isPending;
    const updateField = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));

    const idleCount = reasons.filter((r: any) => r.reasonType === "Machine Idle").length;
    const alarmCount = reasons.filter((r: any) => r.reasonType === "Machine Alarm").length;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">IOT Reasons</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Configure machine idle and alarm reasons</p>
                </div>
                <button onClick={openCreate} className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none">
                    <Plus className="w-5 h-5" />
                    Add Reason
                </button>
            </div>

            {/* Summary badges */}
            <div className="flex items-center gap-3">
                <span className="text-xs font-bold bg-warning-50 text-warning-700 border border-warning-200 px-3 py-1.5 rounded-lg dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50">
                    {idleCount} Idle Reasons
                </span>
                <span className="text-xs font-bold bg-danger-50 text-danger-700 border border-danger-200 px-3 py-1.5 rounded-lg dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50">
                    {alarmCount} Alarm Reasons
                </span>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Search reasons..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                    />
                </div>
                <div className="flex items-center gap-2">
                    {["All", "Machine Idle", "Machine Alarm"].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilterType(f)}
                            className={cn(
                                "px-4 py-1.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors",
                                filterType === f
                                    ? "bg-primary-600 text-white shadow-sm"
                                    : "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                            )}
                        >
                            {f === "Machine Idle" ? "Idle" : f === "Machine Alarm" ? "Alarm" : f}
                        </button>
                    ))}
                </div>
            </div>

            {isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
                    Failed to load IOT reasons.
                </div>
            )}

            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? (
                    <SkeletonTable rows={6} cols={6} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Type</th>
                                    <th className="py-4 px-6 font-bold">Reason</th>
                                    <th className="py-4 px-6 font-bold">Department</th>
                                    <th className="py-4 px-6 font-bold text-center">Planned</th>
                                    <th className="py-4 px-6 font-bold">Duration</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.map((r: any) => (
                                    <tr key={r.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <span className={cn(
                                                "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                                                r.reasonType === "Machine Idle"
                                                    ? "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50"
                                                    : "bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50"
                                            )}>
                                                {r.reasonType === "Machine Idle" ? "Idle" : "Alarm"}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 font-semibold text-primary-950 dark:text-white">{r.reason}</td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">{r.department || "—"}</td>
                                        <td className="py-4 px-6 text-center">
                                            {r.planned ? (
                                                <span className="text-[10px] font-bold bg-success-50 text-success-700 border border-success-100 px-2 py-0.5 rounded dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50">Planned</span>
                                            ) : (
                                                <span className="text-neutral-300 dark:text-neutral-600">—</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">{r.duration || "—"}</td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => openEdit(r)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"><Edit3 size={15} /></button>
                                                <button onClick={() => setDeleteTarget(r)} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors"><Trash2 size={15} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && !isLoading && (
                                    <tr><td colSpan={6}><EmptyState icon="list" title="No IOT reasons" message="Add your first reason." action={{ label: "Add Reason", onClick: openCreate }} /></td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Modal ── */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{editingId ? "Edit Reason" : "Add Reason"}</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Reason Type</label>
                                <select
                                    value={form.reasonType}
                                    onChange={(e) => updateField("reasonType", e.target.value)}
                                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                                >
                                    <option value="Machine Idle">Machine Idle</option>
                                    <option value="Machine Alarm">Machine Alarm</option>
                                </select>
                            </div>
                            <FormField label="Reason" value={form.reason} onChange={(v) => updateField("reason", v)} placeholder="e.g. Material shortage" />
                            <FormField label="Department" value={form.department} onChange={(v) => updateField("department", v)} placeholder="e.g. Production" />
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => updateField("planned", !form.planned)}
                                    className={cn(
                                        "w-10 h-6 rounded-full transition-colors relative",
                                        form.planned ? "bg-primary-600" : "bg-neutral-300 dark:bg-neutral-700"
                                    )}
                                >
                                    <div className={cn("w-4 h-4 rounded-full bg-white absolute top-1 transition-all", form.planned ? "left-5" : "left-1")} />
                                </button>
                                <span className="text-sm font-medium text-primary-950 dark:text-white">Planned Downtime</span>
                            </div>
                            {form.planned && (
                                <FormField label="Duration" value={form.duration} onChange={(v) => updateField("duration", v)} placeholder="e.g. 30 min" />
                            )}
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {saving && <Loader2 size={14} className="animate-spin" />}
                                {saving ? "Saving..." : editingId ? "Update" : "Create"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Confirmation ── */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">Delete Reason?</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">This will permanently delete <strong>{deleteTarget.reason}</strong>.</p>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleDelete} disabled={deleteMutation.isPending} className="flex-1 py-3 rounded-xl bg-danger-600 hover:bg-danger-700 text-white text-sm font-bold transition-colors disabled:opacity-50">
                                {deleteMutation.isPending ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
