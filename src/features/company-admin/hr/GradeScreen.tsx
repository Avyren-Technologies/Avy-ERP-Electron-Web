import { useState } from "react";
import {
    Award,
    Plus,
    Edit3,
    Trash2,
    Loader2,
    X,
    Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGrades } from "@/features/company-admin/api/use-hr-queries";
import {
    useCreateGrade,
    useUpdateGrade,
    useDeleteGrade,
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
    suffix,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
    prefix?: string;
    suffix?: string;
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
                    className={cn(
                        "w-full py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all",
                        prefix ? "pl-8 pr-3" : "px-3",
                        suffix ? "pr-10" : ""
                    )}
                />
                {suffix && (
                    <span className="absolute right-3 text-sm text-neutral-500 dark:text-neutral-400 pointer-events-none">{suffix}</span>
                )}
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

/* ── Helpers ── */

function formatINR(value: number | string | undefined | null): string {
    if (value == null || value === "") return "—";
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num)) return "—";
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(num);
}

/* ── Constants ── */

const PF_TIERS = [
    { value: "Applicable", label: "Applicable" },
    { value: "Not Applicable", label: "Not Applicable" },
    { value: "Optional", label: "Optional" },
];

const EMPTY_GRADE = {
    code: "",
    name: "",
    ctcMin: "",
    ctcMax: "",
    hraPercent: "",
    pfTier: "",
    probationMonths: "",
    noticeDays: "",
    status: "Active",
};

/* ── Screen ── */

export function GradeScreen() {
    const { data, isLoading, isError } = useGrades();
    const createMutation = useCreateGrade();
    const updateMutation = useUpdateGrade();
    const deleteMutation = useDeleteGrade();

    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...EMPTY_GRADE });
    const [deleteTarget, setDeleteTarget] = useState<any>(null);

    const grades: any[] = data?.data ?? [];

    const filtered = grades.filter((g: any) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
            g.name?.toLowerCase().includes(s) ||
            g.code?.toLowerCase().includes(s)
        );
    });

    const openCreate = () => {
        setEditingId(null);
        setForm({ ...EMPTY_GRADE });
        setModalOpen(true);
    };

    const openEdit = (grade: any) => {
        setEditingId(grade.id);
        setForm({
            code: grade.code ?? "",
            name: grade.name ?? "",
            ctcMin: grade.ctcMin?.toString() ?? "",
            ctcMax: grade.ctcMax?.toString() ?? "",
            hraPercent: grade.hraPercent?.toString() ?? "",
            pfTier: grade.pfTier ?? "",
            probationMonths: grade.probationMonths?.toString() ?? "",
            noticeDays: grade.noticeDays?.toString() ?? "",
            status: grade.status ?? "Active",
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        try {
            const payload: Record<string, any> = {
                code: form.code,
                name: form.name,
                status: form.status,
            };
            if (form.ctcMin) payload.ctcMin = parseFloat(form.ctcMin);
            if (form.ctcMax) payload.ctcMax = parseFloat(form.ctcMax);
            if (form.hraPercent) payload.hraPercent = parseFloat(form.hraPercent);
            if (form.pfTier) payload.pfTier = form.pfTier;
            if (form.probationMonths) payload.probationMonths = parseInt(form.probationMonths, 10);
            if (form.noticeDays) payload.noticeDays = parseInt(form.noticeDays, 10);

            if (editingId) {
                await updateMutation.mutateAsync({ id: editingId, data: payload });
                showSuccess("Grade Updated", `${form.name} has been updated.`);
            } else {
                await createMutation.mutateAsync(payload);
                showSuccess("Grade Created", `${form.name} has been added.`);
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
            showSuccess("Grade Deleted", `${deleteTarget.name} has been removed.`);
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
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Grades & Bands</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Define salary grades, CTC ranges and statutory tiers</p>
                </div>
                <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
                >
                    <Plus className="w-5 h-5" />
                    Add Grade
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                    <input
                        type="text"
                        placeholder="Search grades..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                    />
                </div>
            </div>

            {isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
                    Failed to load grades. Please try again.
                </div>
            )}

            {/* Data Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? (
                    <SkeletonTable rows={5} cols={8} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1100px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Code</th>
                                    <th className="py-4 px-6 font-bold">Name</th>
                                    <th className="py-4 px-6 font-bold">CTC Range</th>
                                    <th className="py-4 px-6 font-bold text-center">HRA %</th>
                                    <th className="py-4 px-6 font-bold text-center">PF Tier</th>
                                    <th className="py-4 px-6 font-bold text-center">Probation</th>
                                    <th className="py-4 px-6 font-bold text-center">Notice</th>
                                    <th className="py-4 px-6 font-bold text-center">Status</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.map((grade: any) => (
                                    <tr
                                        key={grade.id}
                                        className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors"
                                    >
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-warning-50 dark:bg-warning-900/30 flex items-center justify-center shrink-0">
                                                    <Award className="w-4 h-4 text-warning-600 dark:text-warning-400" />
                                                </div>
                                                <span className="font-mono text-xs font-bold text-primary-950 dark:text-white">{grade.code}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 font-bold text-primary-950 dark:text-white">{grade.name}</td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">
                                            {formatINR(grade.ctcMin)} {"–"} {formatINR(grade.ctcMax)}
                                        </td>
                                        <td className="py-4 px-6 text-center text-neutral-600 dark:text-neutral-400">
                                            {grade.hraPercent != null ? `${grade.hraPercent}%` : "—"}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            {grade.pfTier ? (
                                                <span className="text-[10px] font-bold bg-info-50 text-info-700 px-2 py-0.5 rounded border border-info-100 dark:bg-info-900/20 dark:text-info-400 dark:border-info-800/50">
                                                    {grade.pfTier}
                                                </span>
                                            ) : (
                                                <span className="text-neutral-300 dark:text-neutral-600">{"—"}</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-center text-neutral-600 dark:text-neutral-400">
                                            {grade.probationMonths ? `${grade.probationMonths}m` : "—"}
                                        </td>
                                        <td className="py-4 px-6 text-center text-neutral-600 dark:text-neutral-400">
                                            {grade.noticeDays ? `${grade.noticeDays}d` : "—"}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <StatusBadge status={grade.status ?? "Active"} />
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => openEdit(grade)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit">
                                                    <Edit3 size={15} />
                                                </button>
                                                <button onClick={() => setDeleteTarget(grade)} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" title="Delete">
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && !isLoading && (
                                    <tr>
                                        <td colSpan={9}>
                                            <EmptyState icon="list" title="No grades configured" message="Add your first grade to get started." action={{ label: "Add Grade", onClick: openCreate }} />
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
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{editingId ? "Edit Grade" : "Add Grade"}</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="Grade Code" value={form.code} onChange={(v) => updateField("code", v)} placeholder="e.g. G1" />
                                <FormField label="Grade Name" value={form.name} onChange={(v) => updateField("name", v)} placeholder="e.g. Junior Band" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="CTC Min" value={form.ctcMin} onChange={(v) => updateField("ctcMin", v)} placeholder="e.g. 300000" type="number" prefix={"\u20B9"} />
                                <FormField label="CTC Max" value={form.ctcMax} onChange={(v) => updateField("ctcMax", v)} placeholder="e.g. 600000" type="number" prefix={"\u20B9"} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="HRA %" value={form.hraPercent} onChange={(v) => updateField("hraPercent", v)} placeholder="e.g. 40" type="number" suffix="%" />
                                <SelectField
                                    label="PF Tier"
                                    value={form.pfTier}
                                    onChange={(v) => updateField("pfTier", v)}
                                    placeholder="Select tier..."
                                    options={PF_TIERS}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="Probation (Months)" value={form.probationMonths} onChange={(v) => updateField("probationMonths", v)} placeholder="e.g. 6" type="number" />
                                <FormField label="Notice Period (Days)" value={form.noticeDays} onChange={(v) => updateField("noticeDays", v)} placeholder="e.g. 30" type="number" />
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
                        <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">Delete Grade?</h2>
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
