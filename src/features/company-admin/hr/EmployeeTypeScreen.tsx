import { useState } from "react";
import {
    UserCog,
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
import { useEmployeeTypes } from "@/features/company-admin/api/use-hr-queries";
import {
    useCreateEmployeeType,
    useUpdateEmployeeType,
    useDeleteEmployeeType,
} from "@/features/company-admin/api/use-hr-mutations";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Form atoms ── */

function FormField({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
}) {
    return (
        <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                {label}
            </label>
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

function SelectField({
    label,
    value,
    onChange,
    options,
    placeholder,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
}) {
    return (
        <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                {label}
            </label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
            >
                <option value="">{placeholder ?? "Select..."}</option>
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const active = status?.toLowerCase() === "active";
    return (
        <span
            className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                active
                    ? "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50"
                    : "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700"
            )}
        >
            {status}
        </span>
    );
}

function ToggleSwitch({
    label,
    checked,
    onChange,
}: {
    label: string;
    checked: boolean;
    onChange: (v: boolean) => void;
}) {
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

function StatutoryBadge({ enabled }: { enabled: boolean }) {
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

/* ── Empty form ── */

const EMPTY_EMPTYPE = {
    name: "",
    code: "",
    pfApplicable: true,
    esiApplicable: true,
    ptApplicable: true,
    gratuityApplicable: false,
    bonusApplicable: false,
    status: "Active",
};

/* ── Screen ── */

export function EmployeeTypeScreen() {
    const { data, isLoading, isError } = useEmployeeTypes();
    const createMutation = useCreateEmployeeType();
    const updateMutation = useUpdateEmployeeType();
    const deleteMutation = useDeleteEmployeeType();

    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...EMPTY_EMPTYPE });
    const [deleteTarget, setDeleteTarget] = useState<any>(null);

    const empTypes: any[] = data?.data ?? [];

    const filtered = empTypes.filter((e: any) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
            e.name?.toLowerCase().includes(s) ||
            e.code?.toLowerCase().includes(s)
        );
    });

    const openCreate = () => {
        setEditingId(null);
        setForm({ ...EMPTY_EMPTYPE });
        setModalOpen(true);
    };

    const openEdit = (et: any) => {
        setEditingId(et.id);
        setForm({
            name: et.name ?? "",
            code: et.code ?? "",
            pfApplicable: et.pfApplicable ?? false,
            esiApplicable: et.esiApplicable ?? false,
            ptApplicable: et.ptApplicable ?? false,
            gratuityApplicable: et.gratuityApplicable ?? false,
            bonusApplicable: et.bonusApplicable ?? false,
            status: et.status ?? "Active",
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        try {
            if (editingId) {
                await updateMutation.mutateAsync({ id: editingId, data: form });
                showSuccess("Employee Type Updated", `${form.name} has been updated.`);
            } else {
                await createMutation.mutateAsync(form);
                showSuccess("Employee Type Created", `${form.name} has been added.`);
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
            showSuccess("Employee Type Deleted", `${deleteTarget.name} has been removed.`);
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
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Employee Types</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Define employment categories and statutory applicability</p>
                </div>
                <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
                >
                    <Plus className="w-5 h-5" />
                    Add Employee Type
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                    <input
                        type="text"
                        placeholder="Search employee types..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                    />
                </div>
            </div>

            {isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
                    Failed to load employee types. Please try again.
                </div>
            )}

            {/* Data Table */}
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
                                    <th className="py-4 px-6 font-bold text-center">PF</th>
                                    <th className="py-4 px-6 font-bold text-center">ESI</th>
                                    <th className="py-4 px-6 font-bold text-center">PT</th>
                                    <th className="py-4 px-6 font-bold text-center">Gratuity</th>
                                    <th className="py-4 px-6 font-bold text-center">Bonus</th>
                                    <th className="py-4 px-6 font-bold text-center">Status</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.map((et: any) => (
                                    <tr
                                        key={et.id}
                                        className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors"
                                    >
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-info-50 dark:bg-info-900/30 flex items-center justify-center shrink-0">
                                                    <UserCog className="w-4 h-4 text-info-600 dark:text-info-400" />
                                                </div>
                                                <span className="font-bold text-primary-950 dark:text-white">{et.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 font-mono text-xs text-neutral-600 dark:text-neutral-400">{et.code || "\u2014"}</td>
                                        <td className="py-4 px-6 text-center"><StatutoryBadge enabled={et.pfApplicable} /></td>
                                        <td className="py-4 px-6 text-center"><StatutoryBadge enabled={et.esiApplicable} /></td>
                                        <td className="py-4 px-6 text-center"><StatutoryBadge enabled={et.ptApplicable} /></td>
                                        <td className="py-4 px-6 text-center"><StatutoryBadge enabled={et.gratuityApplicable} /></td>
                                        <td className="py-4 px-6 text-center"><StatutoryBadge enabled={et.bonusApplicable} /></td>
                                        <td className="py-4 px-6 text-center">
                                            <StatusBadge status={et.status ?? "Active"} />
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => openEdit(et)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit">
                                                    <Edit3 size={15} />
                                                </button>
                                                <button onClick={() => setDeleteTarget(et)} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" title="Delete">
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && !isLoading && (
                                    <tr>
                                        <td colSpan={9}>
                                            <EmptyState icon="list" title="No employee types found" message="Add your first employee type to get started." action={{ label: "Add Employee Type", onClick: openCreate }} />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Create/Edit Modal ── */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{editingId ? "Edit Employee Type" : "Add Employee Type"}</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <FormField label="Type Name" value={form.name} onChange={(v) => updateField("name", v)} placeholder="e.g. Full-Time" />
                            <FormField label="Code" value={form.code} onChange={(v) => updateField("code", v)} placeholder="e.g. FT" />

                            <div className="pt-2">
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">
                                    Statutory Applicability
                                </label>
                                <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 space-y-1 border border-neutral-200 dark:border-neutral-700">
                                    <ToggleSwitch label="Provident Fund (PF)" checked={form.pfApplicable} onChange={(v) => updateField("pfApplicable", v)} />
                                    <ToggleSwitch label="ESI (Employee State Insurance)" checked={form.esiApplicable} onChange={(v) => updateField("esiApplicable", v)} />
                                    <ToggleSwitch label="Professional Tax (PT)" checked={form.ptApplicable} onChange={(v) => updateField("ptApplicable", v)} />
                                    <ToggleSwitch label="Gratuity" checked={form.gratuityApplicable} onChange={(v) => updateField("gratuityApplicable", v)} />
                                    <ToggleSwitch label="Bonus" checked={form.bonusApplicable} onChange={(v) => updateField("bonusApplicable", v)} />
                                </div>
                            </div>

                            <SelectField
                                label="Status"
                                value={form.status}
                                onChange={(v) => updateField("status", v)}
                                options={[
                                    { value: "Active", label: "Active" },
                                    { value: "Inactive", label: "Inactive" },
                                ]}
                            />
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
                        <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">Delete Employee Type?</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            This will permanently delete <strong>{deleteTarget.name}</strong>. This action cannot be undone.
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
