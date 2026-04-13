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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useVisitorTypes } from "@/features/company-admin/api/use-visitor-queries";
import { useCreateVisitorType, useUpdateVisitorType, useDeleteVisitorType } from "@/features/company-admin/api/use-visitor-mutations";
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
    { value: "blue", label: "Blue" },
    { value: "green", label: "Green" },
    { value: "orange", label: "Orange" },
    { value: "red", label: "Red" },
    { value: "purple", label: "Purple" },
    { value: "yellow", label: "Yellow" },
    { value: "gray", label: "Gray" },
];

const EMPTY_FORM = {
    name: "",
    code: "",
    description: "",
    badgeColor: "blue",
    requiresApproval: false,
    requiresInduction: false,
    requiresNDA: false,
    requiresPPE: false,
    requiresEscort: false,
    requiresIdVerification: true,
    maxVisitDuration: "",
    allowedAreas: "",
};

/* ── Screen ── */

export function VisitorTypeScreen() {
    const canConfigure = useCanPerform("visitors:configure");
    const { data, isLoading, isError } = useVisitorTypes();
    const createMutation = useCreateVisitorType();
    const updateMutation = useUpdateVisitorType();
    const deleteMutation = useDeleteVisitorType();

    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...EMPTY_FORM });
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
            description: t.description ?? "",
            badgeColor: t.badgeColor ?? "blue",
            requiresApproval: t.requiresApproval ?? false,
            requiresInduction: t.requiresInduction ?? false,
            requiresNDA: t.requiresNDA ?? false,
            requiresPPE: t.requiresPPE ?? false,
            requiresEscort: t.requiresEscort ?? false,
            requiresIdVerification: t.requiresIdVerification ?? true,
            maxVisitDuration: String(t.maxVisitDuration ?? ""),
            allowedAreas: t.allowedAreas ?? "",
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        try {
            const payload = {
                name: form.name,
                code: form.code || undefined,
                description: form.description || undefined,
                badgeColor: form.badgeColor,
                requiresApproval: form.requiresApproval,
                requiresInduction: form.requiresInduction,
                requiresNDA: form.requiresNDA,
                requiresPPE: form.requiresPPE,
                requiresEscort: form.requiresEscort,
                requiresIdVerification: form.requiresIdVerification,
                maxVisitDuration: form.maxVisitDuration ? Number(form.maxVisitDuration) : undefined,
                allowedAreas: form.allowedAreas || undefined,
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

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteMutation.mutateAsync(deleteTarget.id);
            showSuccess("Type Deleted", `${deleteTarget.name} has been removed.`);
            setDeleteTarget(null);
        } catch (err) {
            showApiError(err);
        }
    };

    const saving = createMutation.isPending || updateMutation.isPending;
    const updateField = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));

    const badgeColorClass = (color: string) => {
        const map: Record<string, string> = {
            blue: "bg-blue-100 text-blue-700 border-blue-200",
            green: "bg-green-100 text-green-700 border-green-200",
            orange: "bg-orange-100 text-orange-700 border-orange-200",
            red: "bg-red-100 text-red-700 border-red-200",
            purple: "bg-purple-100 text-purple-700 border-purple-200",
            yellow: "bg-yellow-100 text-yellow-700 border-yellow-200",
            gray: "bg-gray-100 text-gray-700 border-gray-200",
        };
        return map[color] ?? map.blue;
    };

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
                                    <th className="py-4 px-6 font-bold text-center">Approval</th>
                                    <th className="py-4 px-6 font-bold text-center">Induction</th>
                                    <th className="py-4 px-6 font-bold text-center">NDA</th>
                                    <th className="py-4 px-6 font-bold text-center">PPE</th>
                                    <th className="py-4 px-6 font-bold text-center">ID Check</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.map((t: any) => (
                                    <tr key={t.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-accent-50 dark:bg-accent-900/30 flex items-center justify-center shrink-0">
                                                    <Tag className="w-4 h-4 text-accent-600 dark:text-accent-400" />
                                                </div>
                                                <div>
                                                    <span className="font-bold text-primary-950 dark:text-white block">{t.name}</span>
                                                    {t.description && <span className="text-[10px] text-neutral-400 line-clamp-1">{t.description}</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 font-mono text-xs text-neutral-600 dark:text-neutral-400">{t.code || "---"}</td>
                                        <td className="py-4 px-6">
                                            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize", badgeColorClass(t.badgeColor))}>
                                                {t.badgeColor || "blue"}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-center"><YesNoBadge enabled={t.requiresApproval} /></td>
                                        <td className="py-4 px-6 text-center"><YesNoBadge enabled={t.requiresInduction} /></td>
                                        <td className="py-4 px-6 text-center"><YesNoBadge enabled={t.requiresNDA} /></td>
                                        <td className="py-4 px-6 text-center"><YesNoBadge enabled={t.requiresPPE} /></td>
                                        <td className="py-4 px-6 text-center"><YesNoBadge enabled={t.requiresIdVerification} /></td>
                                        <td className="py-4 px-6 text-right">
                                            {canConfigure && (
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => openEdit(t)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit">
                                                        <Edit3 size={15} />
                                                    </button>
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
                                        <td colSpan={9}>
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
                                <FormField label="Code" value={form.code} onChange={(v) => updateField("code", v)} placeholder="e.g. CONT" />
                            </div>
                            <FormField label="Description" value={form.description} onChange={(v) => updateField("description", v)} placeholder="Brief description..." />
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Badge Color</label>
                                    <select
                                        value={form.badgeColor}
                                        onChange={(e) => updateField("badgeColor", e.target.value)}
                                        className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                                    >
                                        {BADGE_COLORS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                                    </select>
                                </div>
                                <FormField label="Max Duration (min)" value={form.maxVisitDuration} onChange={(v) => updateField("maxVisitDuration", v)} placeholder="e.g. 480" />
                            </div>

                            <SectionLabel title="Requirements" />
                            <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700 space-y-1">
                                <ToggleSwitch label="Requires Approval" checked={form.requiresApproval} onChange={(v) => updateField("requiresApproval", v)} />
                                <ToggleSwitch label="Requires Safety Induction" checked={form.requiresInduction} onChange={(v) => updateField("requiresInduction", v)} />
                                <ToggleSwitch label="Requires NDA Signing" checked={form.requiresNDA} onChange={(v) => updateField("requiresNDA", v)} />
                                <ToggleSwitch label="Requires PPE" checked={form.requiresPPE} onChange={(v) => updateField("requiresPPE", v)} />
                                <ToggleSwitch label="Requires Escort" checked={form.requiresEscort} onChange={(v) => updateField("requiresEscort", v)} />
                                <ToggleSwitch label="Requires ID Verification" checked={form.requiresIdVerification} onChange={(v) => updateField("requiresIdVerification", v)} />
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
                        <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">Delete Visitor Type?</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            This will deactivate <strong>{deleteTarget.name}</strong>. Existing visits of this type will not be affected.
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
