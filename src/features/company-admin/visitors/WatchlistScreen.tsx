import { useState } from "react";
import {
    ShieldAlert,
    Plus,
    Edit3,
    Trash2,
    Loader2,
    X,
    Search,
    ShieldBan,
    AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWatchlist } from "@/features/company-admin/api/use-visitor-queries";
import { useCreateWatchlistEntry, useUpdateWatchlistEntry, useDeleteWatchlistEntry } from "@/features/company-admin/api/use-visitor-mutations";
import { useCanPerform } from "@/hooks/useCanPerform";
import { useCompanyFormatter } from "@/hooks/useCompanyFormatter";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

const EMPTY_FORM = {
    name: "",
    mobile: "",
    email: "",
    idNumber: "",
    type: "BLOCKLIST",
    reason: "",
    validFrom: "",
    validUntil: "",
    notes: "",
};

/* ── Screen ── */

export function WatchlistScreen() {
    const fmt = useCompanyFormatter();
    const canConfigure = useCanPerform("visitors:configure");
    const [tab, setTab] = useState<"BLOCKLIST" | "WATCHLIST">("BLOCKLIST");
    const [search, setSearch] = useState("");

    const { data, isLoading, isError } = useWatchlist({ type: tab, search: search || undefined });
    const createMutation = useCreateWatchlistEntry();
    const updateMutation = useUpdateWatchlistEntry();
    const deleteMutation = useDeleteWatchlistEntry();

    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [deleteTarget, setDeleteTarget] = useState<any>(null);

    const entries: any[] = data?.data ?? [];

    const openCreate = () => { setEditingId(null); setForm({ ...EMPTY_FORM, type: tab }); setModalOpen(true); };

    const openEdit = (e: any) => {
        setEditingId(e.id);
        setForm({
            name: e.name ?? "",
            mobile: e.mobile ?? "",
            email: e.email ?? "",
            idNumber: e.idNumber ?? "",
            type: e.type ?? tab,
            reason: e.reason ?? "",
            validFrom: e.validFrom ? e.validFrom.split("T")[0] : "",
            validUntil: e.validUntil ? e.validUntil.split("T")[0] : "",
            notes: e.notes ?? "",
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        try {
            const payload = {
                name: form.name,
                mobile: form.mobile || undefined,
                email: form.email || undefined,
                idNumber: form.idNumber || undefined,
                type: form.type,
                reason: form.reason,
                validFrom: form.validFrom || undefined,
                validUntil: form.validUntil || undefined,
                notes: form.notes || undefined,
            };
            if (editingId) {
                await updateMutation.mutateAsync({ id: editingId, data: payload });
                showSuccess("Entry Updated", `${form.name} has been updated.`);
            } else {
                await createMutation.mutateAsync(payload);
                showSuccess("Entry Added", `${form.name} has been added to the ${form.type === "BLOCKLIST" ? "blocklist" : "watchlist"}.`);
            }
            setModalOpen(false);
        } catch (err) { showApiError(err); }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteMutation.mutateAsync(deleteTarget.id);
            showSuccess("Entry Removed", `${deleteTarget.name} has been removed.`);
            setDeleteTarget(null);
        } catch (err) { showApiError(err); }
    };

    const saving = createMutation.isPending || updateMutation.isPending;
    const updateField = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Watchlist & Blocklist</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Manage flagged and blocked visitors</p>
                </div>
                {canConfigure && (
                    <button onClick={openCreate} className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none">
                        <Plus className="w-5 h-5" /> Add Entry
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1">
                        <button
                            onClick={() => setTab("BLOCKLIST")}
                            className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all", tab === "BLOCKLIST" ? "bg-danger-600 text-white shadow-sm" : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white")}
                        >
                            <ShieldBan size={14} className="inline mr-1.5" /> Blocklist
                        </button>
                        <button
                            onClick={() => setTab("WATCHLIST")}
                            className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all", tab === "WATCHLIST" ? "bg-warning-600 text-white shadow-sm" : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white")}
                        >
                            <AlertTriangle size={14} className="inline mr-1.5" /> Watchlist
                        </button>
                    </div>
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                        <input type="text" placeholder="Search by name, mobile, ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                    </div>
                </div>
            </div>

            {isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">Failed to load entries.</div>
            )}

            {/* Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? (
                    <SkeletonTable rows={5} cols={7} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Name</th>
                                    <th className="py-4 px-6 font-bold">Mobile</th>
                                    <th className="py-4 px-6 font-bold">ID Number</th>
                                    <th className="py-4 px-6 font-bold">Reason</th>
                                    <th className="py-4 px-6 font-bold">Valid Until</th>
                                    <th className="py-4 px-6 font-bold text-center">Type</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {entries.map((e: any) => (
                                    <tr key={e.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", e.type === "BLOCKLIST" ? "bg-danger-50 dark:bg-danger-900/30" : "bg-warning-50 dark:bg-warning-900/30")}>
                                                    <ShieldAlert className={cn("w-4 h-4", e.type === "BLOCKLIST" ? "text-danger-600 dark:text-danger-400" : "text-warning-600 dark:text-warning-400")} />
                                                </div>
                                                <span className="font-bold text-primary-950 dark:text-white">{e.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">{e.mobile || "---"}</td>
                                        <td className="py-4 px-6 font-mono text-xs text-neutral-600 dark:text-neutral-400">{e.idNumber || "---"}</td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs max-w-[200px] truncate">{e.reason || "---"}</td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">
                                            {e.validUntil ? fmt.date(e.validUntil) : "Permanent"}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", e.type === "BLOCKLIST" ? "bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400" : "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400")}>
                                                {e.type === "BLOCKLIST" ? "Blocked" : "Watch"}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            {canConfigure && (
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => openEdit(e)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"><Edit3 size={15} /></button>
                                                    <button onClick={() => setDeleteTarget(e)} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors"><Trash2 size={15} /></button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {entries.length === 0 && !isLoading && (
                                    <tr><td colSpan={7}><EmptyState icon="list" title={`No ${tab === "BLOCKLIST" ? "blocklist" : "watchlist"} entries`} message={`Add a person to the ${tab === "BLOCKLIST" ? "blocklist" : "watchlist"} to flag them at check-in.`} action={canConfigure ? { label: "Add Entry", onClick: openCreate } : undefined} /></td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{editingId ? "Edit Entry" : "Add Entry"}</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Name *</label>
                                <input type="text" value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="Full name" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Mobile</label>
                                    <input type="text" value={form.mobile} onChange={(e) => updateField("mobile", e.target.value)} placeholder="Phone number" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">ID Number</label>
                                    <input type="text" value={form.idNumber} onChange={(e) => updateField("idNumber", e.target.value)} placeholder="ID document number" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">List Type</label>
                                <select value={form.type} onChange={(e) => updateField("type", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                    <option value="BLOCKLIST">Blocklist (Deny Entry)</option>
                                    <option value="WATCHLIST">Watchlist (Flag at Check-In)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Reason *</label>
                                <textarea value={form.reason} onChange={(e) => updateField("reason", e.target.value)} placeholder="Reason for listing..." rows={3} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Valid From</label>
                                    <input type="date" value={form.validFrom} onChange={(e) => updateField("validFrom", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Valid Until</label>
                                    <input type="date" value={form.validUntil} onChange={(e) => updateField("validUntil", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleSave} disabled={saving || !form.name || !form.reason} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {saving && <Loader2 size={14} className="animate-spin" />}
                                {saving ? "Saving..." : editingId ? "Update" : "Add"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">Remove Entry?</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">Remove <strong>{deleteTarget.name}</strong> from the {deleteTarget.type === "BLOCKLIST" ? "blocklist" : "watchlist"}?</p>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleDelete} disabled={deleteMutation.isPending} className="flex-1 py-3 rounded-xl bg-danger-600 hover:bg-danger-700 text-white text-sm font-bold transition-colors disabled:opacity-50">{deleteMutation.isPending ? "Removing..." : "Remove"}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
