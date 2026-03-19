import { useState } from "react";
import {
    Landmark,
    Plus,
    Edit3,
    Trash2,
    Loader2,
    X,
    Search,
} from "lucide-react";
import { useDepartments, useCostCentres } from "@/features/company-admin/api/use-hr-queries";
import {
    useCreateCostCentre,
    useUpdateCostCentre,
    useDeleteCostCentre,
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
    prefix,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
    prefix?: string;
}) {
    return (
        <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                {label}
            </label>
            <div className="relative flex items-center">
                {prefix && (
                    <span className="absolute left-3 text-sm text-neutral-500 dark:text-neutral-400 pointer-events-none">{prefix}</span>
                )}
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={`w-full ${prefix ? "pl-8" : "px-3"} pr-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all`}
                />
            </div>
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

/* ── Helpers ── */

function formatINR(value: number | string | undefined | null): string {
    if (value == null || value === "") return "\u2014";
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num)) return "\u2014";
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(num);
}

/* ── Empty form ── */

const EMPTY_CC = {
    code: "",
    name: "",
    departmentId: "",
    location: "",
    annualBudget: "",
    glAccountCode: "",
};

/* ── Screen ── */

export function CostCentreScreen() {
    const { data, isLoading, isError } = useCostCentres();
    const deptQuery = useDepartments();
    const createMutation = useCreateCostCentre();
    const updateMutation = useUpdateCostCentre();
    const deleteMutation = useDeleteCostCentre();

    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...EMPTY_CC });
    const [deleteTarget, setDeleteTarget] = useState<any>(null);

    const costCentres: any[] = data?.data ?? [];
    const departments: any[] = deptQuery.data?.data ?? [];

    const filtered = costCentres.filter((c: any) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
            c.name?.toLowerCase().includes(s) ||
            c.code?.toLowerCase().includes(s) ||
            c.glAccountCode?.toLowerCase().includes(s)
        );
    });

    const openCreate = () => {
        setEditingId(null);
        setForm({ ...EMPTY_CC });
        setModalOpen(true);
    };

    const openEdit = (cc: any) => {
        setEditingId(cc.id);
        setForm({
            code: cc.code ?? "",
            name: cc.name ?? "",
            departmentId: cc.departmentId ?? "",
            location: cc.location ?? "",
            annualBudget: cc.annualBudget?.toString() ?? "",
            glAccountCode: cc.glAccountCode ?? "",
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        try {
            const payload = {
                ...form,
                annualBudget: form.annualBudget ? parseFloat(form.annualBudget) : null,
            };
            if (editingId) {
                await updateMutation.mutateAsync({ id: editingId, data: payload });
                showSuccess("Cost Centre Updated", `${form.name} has been updated.`);
            } else {
                await createMutation.mutateAsync(payload);
                showSuccess("Cost Centre Created", `${form.name} has been added.`);
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
            showSuccess("Cost Centre Deleted", `${deleteTarget.name} has been removed.`);
            setDeleteTarget(null);
        } catch (err) {
            showApiError(err);
        }
    };

    const saving = createMutation.isPending || updateMutation.isPending;
    const updateField = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));

    const deptName = (id: string) => departments.find((d: any) => d.id === id)?.name ?? "\u2014";

    // Build location options from existing data
    const locations = Array.from(new Set(costCentres.map((c: any) => c.location).filter(Boolean))).map(
        (loc) => ({ value: loc, label: loc })
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Cost Centres</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Manage cost allocation centres and budgets</p>
                </div>
                <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
                >
                    <Plus className="w-5 h-5" />
                    Add Cost Centre
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                    <input
                        type="text"
                        placeholder="Search cost centres..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                    />
                </div>
            </div>

            {isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
                    Failed to load cost centres. Please try again.
                </div>
            )}

            {/* Data Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? (
                    <SkeletonTable rows={5} cols={6} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Code</th>
                                    <th className="py-4 px-6 font-bold">Name</th>
                                    <th className="py-4 px-6 font-bold">Department</th>
                                    <th className="py-4 px-6 font-bold">Location</th>
                                    <th className="py-4 px-6 font-bold text-right">Annual Budget</th>
                                    <th className="py-4 px-6 font-bold">GL Code</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.map((cc: any) => (
                                    <tr
                                        key={cc.id}
                                        className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors"
                                    >
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-accent-50 dark:bg-accent-900/30 flex items-center justify-center shrink-0">
                                                    <Landmark className="w-4 h-4 text-accent-600 dark:text-accent-400" />
                                                </div>
                                                <span className="font-mono text-xs font-bold text-primary-950 dark:text-white">{cc.code}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 font-bold text-primary-950 dark:text-white">{cc.name}</td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">{deptName(cc.departmentId)}</td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">{cc.location || "\u2014"}</td>
                                        <td className="py-4 px-6 text-right font-semibold text-primary-950 dark:text-white">
                                            {formatINR(cc.annualBudget)}
                                        </td>
                                        <td className="py-4 px-6 font-mono text-xs text-neutral-600 dark:text-neutral-400">{cc.glAccountCode || "\u2014"}</td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => openEdit(cc)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit">
                                                    <Edit3 size={15} />
                                                </button>
                                                <button onClick={() => setDeleteTarget(cc)} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" title="Delete">
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && !isLoading && (
                                    <tr>
                                        <td colSpan={7}>
                                            <EmptyState icon="list" title="No cost centres found" message="Add your first cost centre to get started." action={{ label: "Add Cost Centre", onClick: openCreate }} />
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
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{editingId ? "Edit Cost Centre" : "Add Cost Centre"}</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="Code" value={form.code} onChange={(v) => updateField("code", v)} placeholder="e.g. CC-001" />
                                <FormField label="Name" value={form.name} onChange={(v) => updateField("name", v)} placeholder="e.g. Engineering Ops" />
                            </div>
                            <SelectField
                                label="Department"
                                value={form.departmentId}
                                onChange={(v) => updateField("departmentId", v)}
                                placeholder="Select department..."
                                options={departments.map((d: any) => ({ value: d.id, label: d.name }))}
                            />
                            <FormField label="Location" value={form.location} onChange={(v) => updateField("location", v)} placeholder="e.g. Mumbai HQ" />
                            <FormField label="Annual Budget" value={form.annualBudget} onChange={(v) => updateField("annualBudget", v)} placeholder="e.g. 5000000" type="number" prefix={"\u20B9"} />
                            <FormField label="GL Account Code" value={form.glAccountCode} onChange={(v) => updateField("glAccountCode", v)} placeholder="e.g. 4100-001" />
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
                        <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">Delete Cost Centre?</h2>
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
