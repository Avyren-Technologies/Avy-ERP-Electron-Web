import { useState } from "react";
import {
    Tag,
    Plus,
    Edit3,
    Trash2,
    Loader2,
    X,
    Search,
    Check,
    Minus,
    Power,
    PowerOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useVisitorTypes, useSafetyInductions } from "@/features/company-admin/api/use-visitor-queries";
import { useCreateVisitorType, useUpdateVisitorType, useDeactivateVisitorType, useActivateVisitorType, useDeleteVisitorType } from "@/features/company-admin/api/use-visitor-mutations";
import { useCanPerform } from "@/hooks/useCanPerform";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Form atoms ── */

function FormField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">{label}</label>
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

function ToggleSwitch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-primary-950 dark:text-white">{label}</span>
            <button
                type="button"
                onClick={() => onChange(!checked)}
                className={cn(
                    "w-10 h-6 rounded-full transition-colors relative",
                    checked ? "bg-primary-600" : "bg-neutral-300 dark:bg-neutral-700"
                )}
            >
                <div className={cn("w-4 h-4 rounded-full bg-white absolute top-1 transition-all", checked ? "left-5" : "left-1")} />
            </button>
        </div>
    );
}

function YesNoBadge({ enabled }: { enabled: boolean }) {
    return enabled ? (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-success-50 text-success-700 px-2 py-0.5 rounded-full border border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50">
            <Check size={10} /> Yes
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full border border-neutral-200 dark:bg-neutral-800 dark:text-neutral-500 dark:border-neutral-700">
            <Minus size={10} /> No
        </span>
    );
}

function SectionLabel({ title }: { title: string }) {
    return (
        <div className="pt-3 pb-1">
            <h3 className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider">{title}</h3>
            <div className="h-px bg-primary-100 dark:bg-primary-900/30 mt-1.5" />
        </div>
    );
}

const BADGE_COLORS = [
    { value: "#3B82F6", label: "Blue" },
    { value: "#22C55E", label: "Green" },
    { value: "#F97316", label: "Orange" },
    { value: "#EF4444", label: "Red" },
    { value: "#A855F7", label: "Purple" },
    { value: "#F59E0B", label: "Yellow" },
    { value: "#6B7280", label: "Gray" },
];

const EMPTY_FORM = {
    name: "",
    code: "",
    badgeColour: "#3B82F6",
    requirePhoto: true,
    requireIdVerification: true,
    requireHostApproval: true,
    requireSafetyInduction: false,
    requireNda: false,
    requireEscort: false,
    defaultMaxDurationMinutes: "",
    safetyInductionId: "",
};

/* ── Screen ── */

export function VisitorTypeScreen() {
    const canConfigure = useCanPerform("visitors:configure");
    const { data, isLoading, isError } = useVisitorTypes();
    const createMutation = useCreateVisitorType();
    const updateMutation = useUpdateVisitorType();
    const deactivateMutation = useDeactivateVisitorType();
    const activateMutation = useActivateVisitorType();
    const deleteMutation = useDeleteVisitorType();
    const { data: inductionsData } = useSafetyInductions();
    const safetyInductions: any[] = inductionsData?.data ?? [];

    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [deactivateTarget, setDeactivateTarget] = useState<any>(null);
    const [deleteTarget, setDeleteTarget] = useState<any>(null);

    const visitorTypes: any[] = data?.data ?? [];

    const filtered = visitorTypes.filter((t: any) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return t.name?.toLowerCase().includes(s) || t.code?.toLowerCase().includes(s);
    });

    const openCreate = () => {
        setEditingId(null);
        setForm({ ...EMPTY_FORM });
        setModalOpen(true);
    };

    const openEdit = (t: any) => {
        setEditingId(t.id);
        setForm({
            name: t.name ?? "",
            code: t.code ?? "",
            badgeColour: t.badgeColour ?? "#3B82F6",
            requirePhoto: t.requirePhoto ?? true,
            requireIdVerification: t.requireIdVerification ?? true,
            requireHostApproval: t.requireHostApproval ?? true,
            requireSafetyInduction: t.requireSafetyInduction ?? false,
            requireNda: t.requireNda ?? false,
            requireEscort: t.requireEscort ?? false,
            defaultMaxDurationMinutes: String(t.defaultMaxDurationMinutes ?? ""),
            safetyInductionId: t.safetyInductionId ?? "",
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        try {
            const payload = {
                name: form.name,
                code: form.code,
                badgeColour: form.badgeColour,
                requirePhoto: form.requirePhoto,
                requireIdVerification: form.requireIdVerification,
                requireHostApproval: form.requireHostApproval,
                requireSafetyInduction: form.requireSafetyInduction,
                requireNda: form.requireNda,
                requireEscort: form.requireEscort,
                defaultMaxDurationMinutes: form.defaultMaxDurationMinutes ? Number(form.defaultMaxDurationMinutes) : undefined,
                safetyInductionId: form.requireSafetyInduction && form.safetyInductionId ? form.safetyInductionId : null,
            };
            if (editingId) {
                await updateMutation.mutateAsync({ id: editingId, data: payload });
                showSuccess("Type Updated", `${form.name} has been updated.`);
            } else {
                await createMutation.mutateAsync(payload);
                showSuccess("Type Created", `${form.name} has been added.`);
            }
            setModalOpen(false);
        } catch (err) {
            showApiError(err);
        }
    };

    const handleDeactivate = async () => {
        if (!deactivateTarget) return;
        try {
            await deactivateMutation.mutateAsync(deactivateTarget.id);
            showSuccess("Type Deactivated", `${deactivateTarget.name} has been deactivated.`);
            setDeactivateTarget(null);
        } catch (err) {
            showApiError(err);
        }
    };

    const handleActivate = async (t: any) => {
        try {
            await activateMutation.mutateAsync(t.id);
            showSuccess("Type Activated", `${t.name} has been activated.`);
        } catch (err) {
            showApiError(err);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteMutation.mutateAsync(deleteTarget.id);
            showSuccess("Type Deleted", `${deleteTarget.name} has been permanently deleted.`);
            setDeleteTarget(null);
        } catch (err) {
            showApiError(err);
        }
    };

    const saving = createMutation.isPending || updateMutation.isPending;
    const updateField = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Visitor Types</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Configure visitor categories and their requirements</p>
                </div>
                {canConfigure && (
                    <button
                        onClick={openCreate}
                        className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
                    >
                        <Plus className="w-5 h-5" />
                        Add Type
                    </button>
                )}
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                    <input
                        type="text"
                        placeholder="Search visitor types..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                    />
                </div>
            </div>

            {isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
                    Failed to load visitor types. Please try again.
                </div>
            )}

            {/* Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? (
                    <SkeletonTable rows={5} cols={8} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Name</th>
                                    <th className="py-4 px-6 font-bold">Code</th>
                                    <th className="py-4 px-6 font-bold">Badge</th>
                                    <th className="py-4 px-6 font-bold text-center">Photo</th>
                                    <th className="py-4 px-6 font-bold text-center">ID Check</th>
                                    <th className="py-4 px-6 font-bold text-center">Approval</th>
                                    <th className="py-4 px-6 font-bold text-center">Induction</th>
                                    <th className="py-4 px-6 font-bold text-center">NDA</th>
                                    <th className="py-4 px-6 font-bold text-center">Escort</th>
                                    <th className="py-4 px-6 font-bold text-center">Status</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.map((t: any) => (
                                    <tr key={t.id} className={cn("border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors", !t.isActive && "opacity-60")}>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${t.badgeColour ?? '#3B82F6'}20` }}>
                                                    <Tag className="w-4 h-4" style={{ color: t.badgeColour ?? '#3B82F6' }} />
                                                </div>
                                                <span className="font-bold text-primary-950 dark:text-white">{t.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 font-mono text-xs text-neutral-600 dark:text-neutral-400">{t.code || "---"}</td>
                                        <td className="py-4 px-6">
                                            <div className="w-6 h-6 rounded-full border border-neutral-200" style={{ backgroundColor: t.badgeColour ?? '#3B82F6' }} />
                                        </td>
                                        <td className="py-4 px-6 text-center"><YesNoBadge enabled={t.requirePhoto} /></td>
                                        <td className="py-4 px-6 text-center"><YesNoBadge enabled={t.requireIdVerification} /></td>
                                        <td className="py-4 px-6 text-center"><YesNoBadge enabled={t.requireHostApproval} /></td>
                                        <td className="py-4 px-6 text-center"><YesNoBadge enabled={t.requireSafetyInduction} /></td>
                                        <td className="py-4 px-6 text-center"><YesNoBadge enabled={t.requireNda} /></td>
                                        <td className="py-4 px-6 text-center"><YesNoBadge enabled={t.requireEscort} /></td>
                                        <td className="py-4 px-6 text-center">
                                            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", t.isActive !== false ? "bg-success-50 text-success-700 border-success-200" : "bg-neutral-100 text-neutral-500 border-neutral-200")}>
                                                {t.isActive !== false ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            {canConfigure && (
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => openEdit(t)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit">
                                                        <Edit3 size={15} />
                                                    </button>
                                                    {t.isActive !== false ? (
                                                        <button onClick={() => setDeactivateTarget(t)} className="p-2 text-warning-600 dark:text-warning-400 hover:bg-warning-50 dark:hover:bg-warning-900/20 rounded-lg transition-colors" title="Deactivate">
                                                            <PowerOff size={15} />
                                                        </button>
                                                    ) : (
                                                        <button onClick={() => handleActivate(t)} disabled={activateMutation.isPending} className="p-2 text-success-600 dark:text-success-400 hover:bg-success-50 dark:hover:bg-success-900/20 rounded-lg transition-colors" title="Activate">
                                                            <Power size={15} />
                                                        </button>
                                                    )}
                                                    <button onClick={() => setDeleteTarget(t)} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" title="Delete">
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && !isLoading && (
                                    <tr>
                                        <td colSpan={11}>
                                            <EmptyState icon="list" title="No visitor types found" message="Add your first visitor type to get started." action={canConfigure ? { label: "Add Type", onClick: openCreate } : undefined} />
                                        </td>
                                    </tr>
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
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{editingId ? "Edit Visitor Type" : "Add Visitor Type"}</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <SectionLabel title="Basic" />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="Name" value={form.name} onChange={(v) => updateField("name", v)} placeholder="e.g. Contractor" />
                                <FormField label="Code" value={form.code} onChange={(v) => updateField("code", v)} placeholder="e.g. CT" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Badge Colour</label>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {BADGE_COLORS.map((c) => (
                                            <button key={c.value} type="button" onClick={() => updateField("badgeColour", c.value)} className={cn("w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center", form.badgeColour === c.value ? "border-primary-600 scale-110 shadow-md" : "border-transparent hover:scale-105")} style={{ backgroundColor: c.value }} title={c.label}>
                                                {form.badgeColour === c.value && <Check size={14} className="text-white" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <FormField label="Max Duration (min)" value={form.defaultMaxDurationMinutes} onChange={(v) => updateField("defaultMaxDurationMinutes", v)} placeholder="e.g. 480" />
                            </div>

                            <SectionLabel title="Requirements" />
                            <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700 space-y-1">
                                <ToggleSwitch label="Require Photo" checked={form.requirePhoto} onChange={(v) => updateField("requirePhoto", v)} />
                                <ToggleSwitch label="Require ID Verification" checked={form.requireIdVerification} onChange={(v) => updateField("requireIdVerification", v)} />
                                <ToggleSwitch label="Require Host Approval" checked={form.requireHostApproval} onChange={(v) => updateField("requireHostApproval", v)} />
                                <ToggleSwitch label="Require Safety Induction" checked={form.requireSafetyInduction} onChange={(v) => { updateField("requireSafetyInduction", v); if (!v) updateField("safetyInductionId", ""); }} />
                                {form.requireSafetyInduction && (
                                    <div className="pl-2 pb-2">
                                        <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Safety Induction</label>
                                        <select
                                            value={form.safetyInductionId}
                                            onChange={(e) => updateField("safetyInductionId", e.target.value)}
                                            className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                                        >
                                            <option value="">Auto (first active induction)</option>
                                            {safetyInductions.filter((si: any) => si.isActive !== false).map((si: any) => (
                                                <option key={si.id} value={si.id}>{si.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <ToggleSwitch label="Require NDA Signing" checked={form.requireNda} onChange={(v) => updateField("requireNda", v)} />
                                <ToggleSwitch label="Require Escort" checked={form.requireEscort} onChange={(v) => updateField("requireEscort", v)} />
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

            {/* Deactivate Confirmation */}
            {deactivateTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold text-warning-700 dark:text-warning-400 mb-2">Deactivate Visitor Type?</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            <strong>{deactivateTarget.name}</strong> will be deactivated and hidden from active lists. Existing visits of this type will not be affected.
                        </p>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setDeactivateTarget(null)} className="flex-1 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleDeactivate} disabled={deactivateMutation.isPending} className="flex-1 py-3 rounded-xl bg-warning-600 hover:bg-warning-700 text-white text-sm font-bold transition-colors disabled:opacity-50">
                                {deactivateMutation.isPending ? "Deactivating..." : "Deactivate"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">Delete Visitor Type?</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            This will permanently delete <strong>{deleteTarget.name}</strong>. This cannot be undone. Types with existing visits cannot be deleted.
                        </p>
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
