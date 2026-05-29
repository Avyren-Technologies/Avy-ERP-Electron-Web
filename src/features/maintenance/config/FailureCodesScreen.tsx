import { useState } from "react";
import {
    Plus,
    Edit3,
    Trash2,
    Loader2,
    X,
    Search,
    ChevronRight,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCanPerform } from "@/hooks/useCanPerform";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";
import {
    useFailureCodeSets,
    useFailureModes,
    useFailureCauses,
    useActionCodes,
} from "@/features/maintenance/api/use-maintenance-queries";
import { HelpDrawer } from "@/components/ui/HelpDrawer";
import { failureCodesHelp } from "@/features/maintenance/help";
import {
    useCreateFailureCodeSet,
    useUpdateFailureCodeSet,
    useDeleteFailureCodeSet,
    useCreateFailureMode,
    useUpdateFailureMode,
    useDeleteFailureMode,
    useCreateFailureCause,
    useUpdateFailureCause,
    useDeleteFailureCause,
    useCreateActionCode,
    useUpdateActionCode,
    useDeleteActionCode,
} from "@/features/maintenance/api/use-maintenance-mutations";

/* ── Constants ── */

const ASSET_CLASS_OPTIONS = [
    { value: "", label: "All Asset Classes" },
    { value: "MACHINE", label: "Machine" },
    { value: "VEHICLE", label: "Vehicle" },
    { value: "BUILDING", label: "Building" },
    { value: "GARDEN", label: "Garden" },
    { value: "LAB_EQUIPMENT", label: "Lab Equipment" },
    { value: "TOOLING", label: "Tooling" },
    { value: "UTILITY", label: "Utility" },
    { value: "INFRASTRUCTURE", label: "Infrastructure" },
    { value: "PROJECT_SITE", label: "Project Site" },
    { value: "WAREHOUSE_EQUIPMENT", label: "Warehouse Equipment" },
];

const TABS = ["Sets", "Modes", "Causes", "Action Codes"] as const;
type Tab = (typeof TABS)[number];

/* ── Shared Helpers ── */

function StatusBadge({ active }: { active: boolean }) {
    return active ? (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border bg-success-50 text-success-700 border-success-100 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50">
            <CheckCircle2 size={10} /> Active
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border bg-neutral-100 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700">
            <XCircle size={10} /> Inactive
        </span>
    );
}

function ModalShell({
    title,
    onClose,
    children,
    footer,
}: {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
    footer: React.ReactNode;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                    <h2 className="text-lg font-bold text-primary-950 dark:text-white">{title}</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                        <X size={18} />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto flex-1 space-y-4">{children}</div>
                <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">{footer}</div>
            </div>
        </div>
    );
}

function DeleteConfirm({
    name,
    onCancel,
    onDelete,
    loading,
}: {
    name: string;
    onCancel: () => void;
    onDelete: () => void;
    loading: boolean;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200">
                <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">Delete?</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    This will permanently delete <strong>{name}</strong>. This action cannot be undone.
                </p>
                <div className="flex gap-3 mt-6">
                    <button onClick={onCancel} className="flex-1 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                    <button onClick={onDelete} disabled={loading} className="flex-1 py-3 rounded-xl bg-danger-600 hover:bg-danger-700 text-white text-sm font-bold transition-colors disabled:opacity-50">
                        {loading ? "Deleting..." : "Delete"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function FormField({ label, value, onChange, placeholder, required }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean;
}) {
    return (
        <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                {label}{required && <span className="text-danger-500 ml-0.5">*</span>}
            </label>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
            />
        </div>
    );
}

function FormSelect({ label, value, onChange, options }: {
    label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
}) {
    return (
        <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">{label}</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
            >
                {options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>
        </div>
    );
}

function FormToggle({ label, checked, onChange }: {
    label: string; checked: boolean; onChange: (v: boolean) => void;
}) {
    return (
        <div className="flex items-center gap-3">
            <button
                type="button"
                onClick={() => onChange(!checked)}
                className={cn(
                    "w-10 h-6 rounded-full transition-colors relative flex-shrink-0",
                    checked ? "bg-primary-600" : "bg-neutral-300 dark:bg-neutral-700"
                )}
            >
                <div className={cn("w-4 h-4 rounded-full bg-white absolute top-1 transition-all", checked ? "left-5" : "left-1")} />
            </button>
            <span className="text-sm font-medium text-primary-950 dark:text-white">{label}</span>
        </div>
    );
}

/* ── Sets Tab ── */

function SetsTab({ onSelectSet, canConfigure }: { onSelectSet: (set: any) => void; canConfigure: boolean }) {
    const [search, setSearch] = useState("");
    const { data, isLoading } = useFailureCodeSets({ search: search || undefined });
    const createMut = useCreateFailureCodeSet();
    const updateMut = useUpdateFailureCodeSet();
    const deleteMut = useDeleteFailureCodeSet();

    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ name: "", description: "", assetClass: "", isActive: true });
    const [deleteTarget, setDeleteTarget] = useState<any>(null);

    const sets: any[] = data?.data ?? [];

    const openCreate = () => {
        setEditingId(null);
        setForm({ name: "", description: "", assetClass: "", isActive: true });
        setModalOpen(true);
    };

    const openEdit = (s: any) => {
        setEditingId(s.id);
        setForm({ name: s.name ?? "", description: s.description ?? "", assetClass: s.assetClass ?? "", isActive: s.isActive ?? true });
        setModalOpen(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) { showApiError({ message: "Name is required" }); return; }
        try {
            const payload: any = { name: form.name.trim(), description: form.description || undefined, assetClass: form.assetClass || undefined };
            if (editingId) {
                await updateMut.mutateAsync({ id: editingId, data: { ...payload, isActive: form.isActive } });
                showSuccess("Updated", `${form.name} updated.`);
            } else {
                await createMut.mutateAsync(payload);
                showSuccess("Created", `${form.name} created.`);
            }
            setModalOpen(false);
        } catch (err) { showApiError(err); }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteMut.mutateAsync(deleteTarget.id);
            showSuccess("Deleted", `${deleteTarget.name} deleted.`);
            setDeleteTarget(null);
        } catch (err) { showApiError(err); }
    };

    const saving = createMut.isPending || updateMut.isPending;

    return (
        <>
            {/* Toolbar */}
            <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input type="text" placeholder="Search sets..." value={search} onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                </div>
                {canConfigure && (
                    <button onClick={openCreate} className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all">
                        <Plus className="w-4 h-4" /> Add Set
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? <SkeletonTable rows={5} cols={5} /> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Name</th>
                                    <th className="py-4 px-6 font-bold">Asset Class</th>
                                    <th className="py-4 px-6 font-bold text-center">Modes</th>
                                    <th className="py-4 px-6 font-bold">Status</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {sets.map((s: any) => (
                                    <tr key={s.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer" onClick={() => onSelectSet(s)}>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-danger-50 dark:bg-danger-900/30 flex items-center justify-center shrink-0">
                                                    <AlertTriangle className="w-4 h-4 text-danger-600 dark:text-danger-400" />
                                                </div>
                                                <div>
                                                    <span className="font-bold text-primary-950 dark:text-white">{s.name}</span>
                                                    {s.description && <p className="text-xs text-neutral-400 mt-0.5 line-clamp-1">{s.description}</p>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            {s.assetClass ? (
                                                <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">{s.assetClass.replace(/_/g, " ")}</span>
                                            ) : (
                                                <span className="text-xs text-neutral-400 italic">Any</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-center font-semibold text-primary-950 dark:text-white">{s._count?.failureModes ?? s.modeCount ?? 0}</td>
                                        <td className="py-4 px-6"><StatusBadge active={s.isActive ?? true} /></td>
                                        <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => onSelectSet(s)} className="p-2 text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg transition-colors" title="View Modes">
                                                    <ChevronRight size={15} />
                                                </button>
                                                {canConfigure && (
                                                    <>
                                                        <button onClick={() => openEdit(s)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit">
                                                            <Edit3 size={15} />
                                                        </button>
                                                        <button onClick={() => setDeleteTarget(s)} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" title="Delete">
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {sets.length === 0 && !isLoading && (
                                    <tr><td colSpan={5}><EmptyState icon="list" title="No failure code sets" message="Create your first set to start categorizing failures." action={canConfigure ? { label: "Add Set", onClick: openCreate } : undefined} /></td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {modalOpen && (
                <ModalShell title={editingId ? "Edit Failure Code Set" : "Add Failure Code Set"} onClose={() => setModalOpen(false)}
                    footer={<>
                        <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                        <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                            {saving && <Loader2 size={14} className="animate-spin" />}
                            {saving ? "Saving..." : editingId ? "Update" : "Create"}
                        </button>
                    </>}>
                    <FormField label="Name" value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} placeholder="e.g. Mechanical Failures" required />
                    <FormField label="Description" value={form.description} onChange={(v) => setForm((p) => ({ ...p, description: v }))} placeholder="Optional description" />
                    <FormSelect label="Asset Class" value={form.assetClass} onChange={(v) => setForm((p) => ({ ...p, assetClass: v }))} options={ASSET_CLASS_OPTIONS} />
                    {editingId && <FormToggle label="Active" checked={form.isActive} onChange={(v) => setForm((p) => ({ ...p, isActive: v }))} />}
                </ModalShell>
            )}

            {deleteTarget && <DeleteConfirm name={deleteTarget.name} onCancel={() => setDeleteTarget(null)} onDelete={handleDelete} loading={deleteMut.isPending} />}
        </>
    );
}

/* ── Modes Tab ── */

function ModesTab({ set, onSelectMode, onBack, canConfigure }: { set: any; onSelectMode: (m: any) => void; onBack: () => void; canConfigure: boolean }) {
    const { data, isLoading } = useFailureModes(set.id);
    const createMut = useCreateFailureMode();
    const updateMut = useUpdateFailureMode();
    const deleteMut = useDeleteFailureMode();

    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ code: "", name: "", description: "", isActive: true });
    const [deleteTarget, setDeleteTarget] = useState<any>(null);

    const modes: any[] = data?.data ?? [];

    const openCreate = () => { setEditingId(null); setForm({ code: "", name: "", description: "", isActive: true }); setModalOpen(true); };
    const openEdit = (m: any) => { setEditingId(m.id); setForm({ code: m.code ?? "", name: m.name ?? "", description: m.description ?? "", isActive: m.isActive ?? true }); setModalOpen(true); };

    const handleSave = async () => {
        if (!form.code.trim() || !form.name.trim()) { showApiError({ message: "Code and Name are required" }); return; }
        try {
            if (editingId) {
                await updateMut.mutateAsync({ setId: set.id, id: editingId, data: { code: form.code.trim(), name: form.name.trim(), description: form.description || undefined, isActive: form.isActive } });
                showSuccess("Updated", `${form.name} updated.`);
            } else {
                await createMut.mutateAsync({ setId: set.id, data: { failureCodeSetId: set.id, code: form.code.trim(), name: form.name.trim(), description: form.description || undefined } });
                showSuccess("Created", `${form.name} created.`);
            }
            setModalOpen(false);
        } catch (err) { showApiError(err); }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try { await deleteMut.mutateAsync({ setId: set.id, id: deleteTarget.id }); showSuccess("Deleted", `${deleteTarget.name} deleted.`); setDeleteTarget(null); } catch (err) { showApiError(err); }
    };

    const saving = createMut.isPending || updateMut.isPending;

    return (
        <>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-4 text-sm">
                <button onClick={onBack} className="flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:underline font-medium">
                    <ArrowLeft size={14} /> Sets
                </button>
                <ChevronRight size={14} className="text-neutral-400" />
                <span className="font-bold text-primary-950 dark:text-white">{set.name}</span>
                <ChevronRight size={14} className="text-neutral-400" />
                <span className="text-neutral-500">Modes</span>
            </div>

            <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Failure modes for <strong>{set.name}</strong></p>
                {canConfigure && (
                    <button onClick={openCreate} className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all">
                        <Plus className="w-4 h-4" /> Add Mode
                    </button>
                )}
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? <SkeletonTable rows={4} cols={5} /> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Code</th>
                                    <th className="py-4 px-6 font-bold">Name</th>
                                    <th className="py-4 px-6 font-bold">Description</th>
                                    <th className="py-4 px-6 font-bold">Status</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {modes.map((m: any) => (
                                    <tr key={m.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer" onClick={() => onSelectMode(m)}>
                                        <td className="py-4 px-6 font-mono text-xs font-bold text-primary-600 dark:text-primary-400">{m.code}</td>
                                        <td className="py-4 px-6 font-semibold text-primary-950 dark:text-white">{m.name}</td>
                                        <td className="py-4 px-6 text-neutral-500 dark:text-neutral-400 text-xs line-clamp-1">{m.description || "---"}</td>
                                        <td className="py-4 px-6"><StatusBadge active={m.isActive ?? true} /></td>
                                        <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => onSelectMode(m)} className="p-2 text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg transition-colors" title="View Causes">
                                                    <ChevronRight size={15} />
                                                </button>
                                                {canConfigure && (
                                                    <>
                                                        <button onClick={() => openEdit(m)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit"><Edit3 size={15} /></button>
                                                        <button onClick={() => setDeleteTarget(m)} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" title="Delete"><Trash2 size={15} /></button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {modes.length === 0 && !isLoading && (
                                    <tr><td colSpan={5}><EmptyState icon="list" title="No failure modes" message="Add failure modes to this set." action={canConfigure ? { label: "Add Mode", onClick: openCreate } : undefined} /></td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {modalOpen && (
                <ModalShell title={editingId ? "Edit Failure Mode" : "Add Failure Mode"} onClose={() => setModalOpen(false)}
                    footer={<>
                        <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                        <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                            {saving && <Loader2 size={14} className="animate-spin" />}{saving ? "Saving..." : editingId ? "Update" : "Create"}
                        </button>
                    </>}>
                    <FormField label="Code" value={form.code} onChange={(v) => setForm((p) => ({ ...p, code: v }))} placeholder="e.g. FM-001" required />
                    <FormField label="Name" value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} placeholder="e.g. Bearing Failure" required />
                    <FormField label="Description" value={form.description} onChange={(v) => setForm((p) => ({ ...p, description: v }))} placeholder="Optional description" />
                    {editingId && <FormToggle label="Active" checked={form.isActive} onChange={(v) => setForm((p) => ({ ...p, isActive: v }))} />}
                </ModalShell>
            )}

            {deleteTarget && <DeleteConfirm name={deleteTarget.name} onCancel={() => setDeleteTarget(null)} onDelete={handleDelete} loading={deleteMut.isPending} />}
        </>
    );
}

/* ── Causes Tab ── */

function CausesTab({ set, mode, onBack, canConfigure }: { set: any; mode: any; onBack: () => void; canConfigure: boolean }) {
    const { data, isLoading } = useFailureCauses(mode.id);
    const createMut = useCreateFailureCause();
    const updateMut = useUpdateFailureCause();
    const deleteMut = useDeleteFailureCause();

    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ code: "", name: "", mechanism: "", isActive: true });
    const [deleteTarget, setDeleteTarget] = useState<any>(null);

    const causes: any[] = data?.data ?? [];

    const openCreate = () => { setEditingId(null); setForm({ code: "", name: "", mechanism: "", isActive: true }); setModalOpen(true); };
    const openEdit = (c: any) => { setEditingId(c.id); setForm({ code: c.code ?? "", name: c.name ?? "", mechanism: c.mechanism ?? "", isActive: c.isActive ?? true }); setModalOpen(true); };

    const handleSave = async () => {
        if (!form.code.trim() || !form.name.trim()) { showApiError({ message: "Code and Name are required" }); return; }
        try {
            if (editingId) {
                await updateMut.mutateAsync({ modeId: mode.id, id: editingId, data: { code: form.code.trim(), name: form.name.trim(), mechanism: form.mechanism || undefined, isActive: form.isActive } });
                showSuccess("Updated", `${form.name} updated.`);
            } else {
                await createMut.mutateAsync({ modeId: mode.id, data: { failureModeId: mode.id, code: form.code.trim(), name: form.name.trim(), mechanism: form.mechanism || undefined } });
                showSuccess("Created", `${form.name} created.`);
            }
            setModalOpen(false);
        } catch (err) { showApiError(err); }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try { await deleteMut.mutateAsync({ modeId: mode.id, id: deleteTarget.id }); showSuccess("Deleted", `${deleteTarget.name} deleted.`); setDeleteTarget(null); } catch (err) { showApiError(err); }
    };

    const saving = createMut.isPending || updateMut.isPending;

    return (
        <>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-4 text-sm flex-wrap">
                <button onClick={onBack} className="flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:underline font-medium">
                    <ArrowLeft size={14} /> Sets
                </button>
                <ChevronRight size={14} className="text-neutral-400" />
                <span className="font-semibold text-primary-950 dark:text-white">{set.name}</span>
                <ChevronRight size={14} className="text-neutral-400" />
                <span className="font-semibold text-primary-950 dark:text-white">{mode.name}</span>
                <ChevronRight size={14} className="text-neutral-400" />
                <span className="text-neutral-500">Causes</span>
            </div>

            <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Failure causes for mode <strong>{mode.name}</strong></p>
                {canConfigure && (
                    <button onClick={openCreate} className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all">
                        <Plus className="w-4 h-4" /> Add Cause
                    </button>
                )}
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? <SkeletonTable rows={4} cols={5} /> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Code</th>
                                    <th className="py-4 px-6 font-bold">Name</th>
                                    <th className="py-4 px-6 font-bold">Mechanism</th>
                                    <th className="py-4 px-6 font-bold">Status</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {causes.map((c: any) => (
                                    <tr key={c.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="py-4 px-6 font-mono text-xs font-bold text-primary-600 dark:text-primary-400">{c.code}</td>
                                        <td className="py-4 px-6 font-semibold text-primary-950 dark:text-white">{c.name}</td>
                                        <td className="py-4 px-6 text-neutral-500 dark:text-neutral-400 text-xs">{c.mechanism || "---"}</td>
                                        <td className="py-4 px-6"><StatusBadge active={c.isActive ?? true} /></td>
                                        <td className="py-4 px-6 text-right">
                                            {canConfigure && (
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => openEdit(c)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit"><Edit3 size={15} /></button>
                                                    <button onClick={() => setDeleteTarget(c)} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" title="Delete"><Trash2 size={15} /></button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {causes.length === 0 && !isLoading && (
                                    <tr><td colSpan={5}><EmptyState icon="list" title="No failure causes" message="Add causes for this failure mode." action={canConfigure ? { label: "Add Cause", onClick: openCreate } : undefined} /></td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {modalOpen && (
                <ModalShell title={editingId ? "Edit Failure Cause" : "Add Failure Cause"} onClose={() => setModalOpen(false)}
                    footer={<>
                        <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                        <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                            {saving && <Loader2 size={14} className="animate-spin" />}{saving ? "Saving..." : editingId ? "Update" : "Create"}
                        </button>
                    </>}>
                    <FormField label="Code" value={form.code} onChange={(v) => setForm((p) => ({ ...p, code: v }))} placeholder="e.g. FC-001" required />
                    <FormField label="Name" value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} placeholder="e.g. Lubrication Failure" required />
                    <FormField label="Mechanism" value={form.mechanism} onChange={(v) => setForm((p) => ({ ...p, mechanism: v }))} placeholder="e.g. Wear and Tear" />
                    {editingId && <FormToggle label="Active" checked={form.isActive} onChange={(v) => setForm((p) => ({ ...p, isActive: v }))} />}
                </ModalShell>
            )}

            {deleteTarget && <DeleteConfirm name={deleteTarget.name} onCancel={() => setDeleteTarget(null)} onDelete={handleDelete} loading={deleteMut.isPending} />}
        </>
    );
}

/* ── Action Codes Tab ── */

function ActionCodesTab({ canConfigure }: { canConfigure: boolean }) {
    const [search, setSearch] = useState("");
    const { data, isLoading } = useActionCodes({ search: search || undefined });
    const createMut = useCreateActionCode();
    const updateMut = useUpdateActionCode();
    const deleteMut = useDeleteActionCode();

    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ code: "", name: "", description: "", isActive: true });
    const [deleteTarget, setDeleteTarget] = useState<any>(null);

    const codes: any[] = data?.data ?? [];

    const openCreate = () => { setEditingId(null); setForm({ code: "", name: "", description: "", isActive: true }); setModalOpen(true); };
    const openEdit = (c: any) => { setEditingId(c.id); setForm({ code: c.code ?? "", name: c.name ?? "", description: c.description ?? "", isActive: c.isActive ?? true }); setModalOpen(true); };

    const handleSave = async () => {
        if (!form.code.trim() || !form.name.trim()) { showApiError({ message: "Code and Name are required" }); return; }
        try {
            if (editingId) {
                await updateMut.mutateAsync({ id: editingId, data: { code: form.code.trim(), name: form.name.trim(), description: form.description || undefined, isActive: form.isActive } });
                showSuccess("Updated", `${form.name} updated.`);
            } else {
                await createMut.mutateAsync({ code: form.code.trim(), name: form.name.trim(), description: form.description || undefined });
                showSuccess("Created", `${form.name} created.`);
            }
            setModalOpen(false);
        } catch (err) { showApiError(err); }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try { await deleteMut.mutateAsync(deleteTarget.id); showSuccess("Deleted", `${deleteTarget.name} deleted.`); setDeleteTarget(null); } catch (err) { showApiError(err); }
    };

    const saving = createMut.isPending || updateMut.isPending;

    return (
        <>
            <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input type="text" placeholder="Search action codes..." value={search} onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                </div>
                {canConfigure && (
                    <button onClick={openCreate} className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all">
                        <Plus className="w-4 h-4" /> Add Action Code
                    </button>
                )}
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? <SkeletonTable rows={5} cols={4} /> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Code</th>
                                    <th className="py-4 px-6 font-bold">Name</th>
                                    <th className="py-4 px-6 font-bold">Description</th>
                                    <th className="py-4 px-6 font-bold">Status</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {codes.map((c: any) => (
                                    <tr key={c.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="py-4 px-6 font-mono text-xs font-bold text-primary-600 dark:text-primary-400">{c.code}</td>
                                        <td className="py-4 px-6 font-semibold text-primary-950 dark:text-white">{c.name}</td>
                                        <td className="py-4 px-6 text-neutral-500 dark:text-neutral-400 text-xs line-clamp-1">{c.description || "---"}</td>
                                        <td className="py-4 px-6"><StatusBadge active={c.isActive ?? true} /></td>
                                        <td className="py-4 px-6 text-right">
                                            {canConfigure && (
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => openEdit(c)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit"><Edit3 size={15} /></button>
                                                    <button onClick={() => setDeleteTarget(c)} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" title="Delete"><Trash2 size={15} /></button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {codes.length === 0 && !isLoading && (
                                    <tr><td colSpan={5}><EmptyState icon="list" title="No action codes" message="Add action codes for remediation steps." action={canConfigure ? { label: "Add Action Code", onClick: openCreate } : undefined} /></td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {modalOpen && (
                <ModalShell title={editingId ? "Edit Action Code" : "Add Action Code"} onClose={() => setModalOpen(false)}
                    footer={<>
                        <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                        <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                            {saving && <Loader2 size={14} className="animate-spin" />}{saving ? "Saving..." : editingId ? "Update" : "Create"}
                        </button>
                    </>}>
                    <FormField label="Code" value={form.code} onChange={(v) => setForm((p) => ({ ...p, code: v }))} placeholder="e.g. AC-001" required />
                    <FormField label="Name" value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} placeholder="e.g. Replace Bearing" required />
                    <FormField label="Description" value={form.description} onChange={(v) => setForm((p) => ({ ...p, description: v }))} placeholder="Optional description" />
                    {editingId && <FormToggle label="Active" checked={form.isActive} onChange={(v) => setForm((p) => ({ ...p, isActive: v }))} />}
                </ModalShell>
            )}

            {deleteTarget && <DeleteConfirm name={deleteTarget.name} onCancel={() => setDeleteTarget(null)} onDelete={handleDelete} loading={deleteMut.isPending} />}
        </>
    );
}

/* ── Main Screen ── */

export function FailureCodesScreen() {
    const canConfigure = useCanPerform("maintenance:configure");
    const [activeTab, setActiveTab] = useState<Tab>("Sets");
    const [selectedSet, setSelectedSet] = useState<any>(null);
    const [selectedMode, setSelectedMode] = useState<any>(null);

    const handleSelectSet = (set: any) => {
        setSelectedSet(set);
        setSelectedMode(null);
        setActiveTab("Modes");
    };

    const handleSelectMode = (mode: any) => {
        setSelectedMode(mode);
        setActiveTab("Causes");
    };

    const handleBackToSets = () => {
        setSelectedSet(null);
        setSelectedMode(null);
        setActiveTab("Sets");
    };

    const handleBackToModes = () => {
        setSelectedMode(null);
        setActiveTab("Modes");
    };

    // Determine which tab to actually show
    const effectiveTab = activeTab === "Causes" && selectedMode ? "Causes"
        : activeTab === "Modes" && selectedSet ? "Modes"
        : activeTab === "Action Codes" ? "Action Codes"
        : "Sets";

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Failure Codes</h1>
                    <HelpDrawer help={failureCodesHelp} />
                </div>
                <p className="text-neutral-500 dark:text-neutral-400 mt-1">Manage failure code sets, modes, causes, and action codes</p>
            </div>

            {/* Tab Bar */}
            <div className="bg-white dark:bg-neutral-900 px-1 py-1 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm inline-flex gap-1">
                {TABS.map((tab) => {
                    const isActive = effectiveTab === tab;
                    const isDisabled = (tab === "Modes" && !selectedSet) || (tab === "Causes" && !selectedMode);
                    return (
                        <button
                            key={tab}
                            onClick={() => !isDisabled && setActiveTab(tab)}
                            disabled={isDisabled}
                            className={cn(
                                "px-4 py-2 rounded-xl text-sm font-bold transition-all",
                                isActive
                                    ? "bg-primary-600 text-white shadow-md shadow-primary-500/20"
                                    : isDisabled
                                        ? "text-neutral-300 dark:text-neutral-600 cursor-not-allowed"
                                        : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                            )}
                        >
                            {tab}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            {effectiveTab === "Sets" && <SetsTab onSelectSet={handleSelectSet} canConfigure={canConfigure} />}
            {effectiveTab === "Modes" && selectedSet && <ModesTab set={selectedSet} onSelectMode={handleSelectMode} onBack={handleBackToSets} canConfigure={canConfigure} />}
            {effectiveTab === "Causes" && selectedSet && selectedMode && <CausesTab set={selectedSet} mode={selectedMode} onBack={handleBackToModes} canConfigure={canConfigure} />}
            {effectiveTab === "Action Codes" && <ActionCodesTab canConfigure={canConfigure} />}
        </div>
    );
}
