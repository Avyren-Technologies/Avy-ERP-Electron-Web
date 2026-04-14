import { useState } from "react";
import {
    DoorOpen,
    Plus,
    Edit3,
    Trash2,
    Loader2,
    X,
    Search,
    Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGates } from "@/features/company-admin/api/use-visitor-queries";
import { useCreateGate, useUpdateGate, useDeleteGate } from "@/features/company-admin/api/use-visitor-mutations";
import { useCanPerform } from "@/hooks/useCanPerform";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Form atoms ── */

function FormField({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">{label}</label>
            <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
        </div>
    );
}

function ToggleSwitch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-primary-950 dark:text-white">{label}</span>
            <button type="button" onClick={() => onChange(!checked)} className={cn("w-10 h-6 rounded-full transition-colors relative", checked ? "bg-primary-600" : "bg-neutral-300 dark:bg-neutral-700")}>
                <div className={cn("w-4 h-4 rounded-full bg-white absolute top-1 transition-all", checked ? "left-5" : "left-1")} />
            </button>
        </div>
    );
}

const GATE_TYPES = [
    { value: "ENTRY", label: "Entry Only" },
    { value: "EXIT", label: "Exit Only" },
    { value: "BOTH", label: "Entry & Exit" },
];

const EMPTY_FORM = {
    name: "",
    code: "",
    type: "BOTH",
    plantId: "",
    plantName: "",
    operatingHoursStart: "06:00",
    operatingHoursEnd: "22:00",
    isActive: true,
    enableQR: true,
    allowedVisitorTypeIds: "",
    description: "",
};

/* ── Screen ── */

export function GateScreen() {
    const canConfigure = useCanPerform("visitors:configure");
    const { data, isLoading, isError } = useGates();
    const createMutation = useCreateGate();
    const updateMutation = useUpdateGate();
    const deleteMutation = useDeleteGate();

    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [deleteTarget, setDeleteTarget] = useState<any>(null);

    const gates: any[] = data?.data ?? [];

    const filtered = gates.filter((g: any) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return g.name?.toLowerCase().includes(s) || g.code?.toLowerCase().includes(s);
    });

    const openCreate = () => { setEditingId(null); setForm({ ...EMPTY_FORM }); setModalOpen(true); };

    const openEdit = (g: any) => {
        setEditingId(g.id);
        setForm({
            name: g.name ?? "",
            code: g.code ?? "",
            type: g.type ?? "BOTH",
            plantId: g.plantId ?? "",
            plantName: g.plant?.name ?? "",
            operatingHoursStart: g.operatingHoursStart ?? "06:00",
            operatingHoursEnd: g.operatingHoursEnd ?? "22:00",
            isActive: g.isActive ?? true,
            enableQR: g.enableQR ?? true,
            allowedVisitorTypeIds: (g.allowedVisitorTypeIds ?? []).join(", "),
            description: g.description ?? "",
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        try {
            const payload = {
                name: form.name,
                code: form.code || undefined,
                type: form.type,
                plantId: form.plantId || undefined,
                operatingHoursStart: form.operatingHoursStart || undefined,
                operatingHoursEnd: form.operatingHoursEnd || undefined,
                isActive: form.isActive,
                enableQR: form.enableQR,
                allowedVisitorTypeIds: (form.allowedVisitorTypeIds || "")
                    .split(",")
                    .map((id) => id.trim())
                    .filter(Boolean),
                description: form.description || undefined,
            };
            if (editingId) {
                await updateMutation.mutateAsync({ id: editingId, data: payload });
                showSuccess("Gate Updated", `${form.name} has been updated.`);
            } else {
                await createMutation.mutateAsync(payload);
                showSuccess("Gate Created", `${form.name} has been added.`);
            }
            setModalOpen(false);
        } catch (err) { showApiError(err); }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteMutation.mutateAsync(deleteTarget.id);
            showSuccess("Gate Deleted", `${deleteTarget.name} has been removed.`);
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
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Gates</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Manage facility gates and entry/exit points</p>
                </div>
                {canConfigure && (
                    <button onClick={openCreate} className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none">
                        <Plus className="w-5 h-5" /> Add Gate
                    </button>
                )}
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                    <input type="text" placeholder="Search gates..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                </div>
            </div>

            {isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">Failed to load gates.</div>
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
                                    <th className="py-4 px-6 font-bold">Gate</th>
                                    <th className="py-4 px-6 font-bold">Code</th>
                                    <th className="py-4 px-6 font-bold">Type</th>
                                    <th className="py-4 px-6 font-bold">Plant</th>
                                    <th className="py-4 px-6 font-bold">Hours</th>
                                    <th className="py-4 px-6 font-bold text-center">QR</th>
                                    <th className="py-4 px-6 font-bold text-center">Status</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.map((g: any) => (
                                    <tr key={g.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                                                    <DoorOpen className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                                </div>
                                                <span className="font-bold text-primary-950 dark:text-white">{g.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 font-mono text-xs text-neutral-600 dark:text-neutral-400">{g.code || "---"}</td>
                                        <td className="py-4 px-6">
                                            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", g.type === "ENTRY" ? "bg-success-50 text-success-700 border-success-200" : g.type === "EXIT" ? "bg-warning-50 text-warning-700 border-warning-200" : "bg-info-50 text-info-700 border-info-200")}>
                                                {g.type || "BOTH"}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">{g.plant?.name || "---"}</td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">
                                            {g.operatingHoursStart && g.operatingHoursEnd ? `${g.operatingHoursStart} - ${g.operatingHoursEnd}` : "24/7"}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            {g.enableQR ? (
                                                <span className="text-[10px] font-bold bg-success-50 text-success-700 px-2 py-0.5 rounded-full border border-success-200">Enabled</span>
                                            ) : (
                                                <span className="text-[10px] font-bold bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full border border-neutral-200">Disabled</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", g.isActive !== false ? "bg-success-50 text-success-700 border-success-200" : "bg-neutral-100 text-neutral-500 border-neutral-200")}>
                                                {g.isActive !== false ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            {canConfigure && (
                                                <div className="flex items-center justify-end gap-1">
                                                    {g.qrUrl && (
                                                        <button onClick={() => { navigator.clipboard.writeText(g.qrUrl); showSuccess("Copied", "QR URL copied to clipboard."); }} className="p-2 text-info-600 dark:text-info-400 hover:bg-info-50 dark:hover:bg-info-900/30 rounded-lg transition-colors" title="Copy QR URL">
                                                            <Copy size={15} />
                                                        </button>
                                                    )}
                                                    <button onClick={() => openEdit(g)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit">
                                                        <Edit3 size={15} />
                                                    </button>
                                                    <button onClick={() => setDeleteTarget(g)} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" title="Delete">
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && !isLoading && (
                                    <tr><td colSpan={8}><EmptyState icon="list" title="No gates found" message="Add your first gate to get started." action={canConfigure ? { label: "Add Gate", onClick: openCreate } : undefined} /></td></tr>
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
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{editingId ? "Edit Gate" : "Add Gate"}</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="Gate Name" value={form.name} onChange={(v) => updateField("name", v)} placeholder="e.g. Main Gate" />
                                <FormField label="Code" value={form.code} onChange={(v) => updateField("code", v)} placeholder="e.g. MG-01" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Gate Type</label>
                                <select value={form.type} onChange={(e) => updateField("type", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                    {GATE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </div>
                            <FormField label="Description" value={form.description} onChange={(v) => updateField("description", v)} placeholder="Gate description..." />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="Opening Time" value={form.operatingHoursStart} onChange={(v) => updateField("operatingHoursStart", v)} type="time" />
                                <FormField label="Closing Time" value={form.operatingHoursEnd} onChange={(v) => updateField("operatingHoursEnd", v)} type="time" />
                            </div>
                            <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700 space-y-1">
                                <ToggleSwitch label="Enable QR Code" checked={form.enableQR} onChange={(v) => updateField("enableQR", v)} />
                                <ToggleSwitch label="Active" checked={form.isActive} onChange={(v) => updateField("isActive", v)} />
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleSave} disabled={saving || !form.name} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {saving && <Loader2 size={14} className="animate-spin" />}
                                {saving ? "Saving..." : editingId ? "Update" : "Create"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">Delete Gate?</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">This will deactivate <strong>{deleteTarget.name}</strong>.</p>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleDelete} disabled={deleteMutation.isPending} className="flex-1 py-3 rounded-xl bg-danger-600 hover:bg-danger-700 text-white text-sm font-bold transition-colors disabled:opacity-50">{deleteMutation.isPending ? "Deleting..." : "Delete"}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
