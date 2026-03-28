import { useState, useMemo } from "react";
import {
    Briefcase,
    Plus,
    Edit3,
    Trash2,
    Loader2,
    X,
    Search,
    Filter,
    Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { useDesignations, useDepartments, useGrades } from "@/features/company-admin/api/use-hr-queries";
import {
    useCreateDesignation,
    useUpdateDesignation,
    useDeleteDesignation,
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
        <div className="flex items-center gap-3">
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
            <span className="text-sm font-medium text-primary-950 dark:text-white">{label}</span>
        </div>
    );
}

/* ── Constants ── */

const JOB_LEVELS = [
    { value: "L1", label: "L1 - Entry" },
    { value: "L2", label: "L2 - Junior" },
    { value: "L3", label: "L3 - Mid" },
    { value: "L4", label: "L4 - Senior" },
    { value: "L5", label: "L5 - Lead" },
    { value: "L6", label: "L6 - Director" },
    { value: "L7", label: "L7 - Executive" },
];

const EMPTY_DESIG = {
    name: "",
    code: "",
    departmentId: "",
    gradeId: "",
    jobLevel: "",
    managerialFlag: false,
    reportsTo: "",
    probationDays: "",
    status: "Active",
};

/* ── Screen ── */

export function DesignationScreen() {
    const { data, isLoading, isError } = useDesignations();
    const deptQuery = useDepartments();
    const gradeQuery = useGrades();
    const createMutation = useCreateDesignation();
    const updateMutation = useUpdateDesignation();
    const deleteMutation = useDeleteDesignation();

    const [search, setSearch] = useState("");
    const [filterDept, setFilterDept] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...EMPTY_DESIG });
    const [deleteTarget, setDeleteTarget] = useState<any>(null);
    const [codeAutoGenerated, setCodeAutoGenerated] = useState(true);

    const designations: any[] = data?.data ?? [];
    const departments: any[] = deptQuery.data?.data ?? [];
    const grades: any[] = gradeQuery.data?.data ?? [];

    const departmentOptions = useMemo(() =>
        departments.map((d: any) => ({ value: d.id, label: d.name, sublabel: d.code })),
        [departments]
    );
    const gradeOptions = useMemo(() =>
        grades.map((g: any) => ({ value: g.id, label: g.name, sublabel: g.code })),
        [grades]
    );
    const designationOptions = useMemo(() =>
        designations.map((d: any) => ({ value: d.id, label: d.name, sublabel: d.code })),
        [designations]
    );

    const filtered = designations.filter((d: any) => {
        if (filterDept && d.departmentId !== filterDept) return false;
        if (!search) return true;
        const s = search.toLowerCase();
        return (
            d.name?.toLowerCase().includes(s) ||
            d.code?.toLowerCase().includes(s)
        );
    });

    const openCreate = () => {
        setEditingId(null);
        setForm({ ...EMPTY_DESIG });
        setCodeAutoGenerated(true);
        setModalOpen(true);
    };

    const openEdit = (desig: any) => {
        setEditingId(desig.id);
        setForm({
            name: desig.name ?? "",
            code: desig.code ?? "",
            departmentId: desig.departmentId ?? "",
            gradeId: desig.gradeId ?? "",
            jobLevel: desig.jobLevel ?? "",
            managerialFlag: desig.managerialFlag ?? false,
            reportsTo: desig.reportsTo ?? "",
            probationDays: desig.probationDays?.toString() ?? "",
            status: desig.status ?? "Active",
        });
        setCodeAutoGenerated(false);
        setModalOpen(true);
    };

    const handleSave = async () => {
        try {
            const payload: Record<string, any> = {
                name: form.name,
                code: form.code,
                managerialFlag: form.managerialFlag,
                status: form.status,
            };
            if (form.departmentId) payload.departmentId = form.departmentId;
            if (form.gradeId) payload.gradeId = form.gradeId;
            if (form.jobLevel) payload.jobLevel = form.jobLevel;
            if (form.reportsTo) payload.reportsTo = form.reportsTo;
            if (form.probationDays) payload.probationDays = parseInt(form.probationDays, 10);

            if (editingId) {
                await updateMutation.mutateAsync({ id: editingId, data: payload });
                showSuccess("Designation Updated", `${form.name} has been updated.`);
            } else {
                await createMutation.mutateAsync(payload);
                showSuccess("Designation Created", `${form.name} has been added.`);
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
            showSuccess("Designation Deleted", `${deleteTarget.name} has been removed.`);
            setDeleteTarget(null);
        } catch (err) {
            showApiError(err);
        }
    };

    const saving = createMutation.isPending || updateMutation.isPending;
    const updateField = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));

    const generateCode = (name: string): string => {
        if (!name.trim()) return "";
        const words = name.trim().split(/\s+/);
        const abbr = words.length >= 2
            ? words.map(w => w[0]!.toUpperCase()).join("").slice(0, 4)
            : name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
        return `${abbr}-001`;
    };

    const handleNameChange = (name: string) => {
        updateField('name', name);
        if (codeAutoGenerated && !editingId) {
            updateField('code', generateCode(name));
        }
    };

    const handleCodeChange = (code: string) => {
        updateField('code', code);
        setCodeAutoGenerated(false);
    };

    const deptName = (id: string) => departments.find((d: any) => d.id === id)?.name ?? "—";
    const gradeName = (id: string) => grades.find((g: any) => g.id === id)?.name ?? "—";

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Designations</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Manage job titles and role hierarchy</p>
                </div>
                <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
                >
                    <Plus className="w-5 h-5" />
                    Add Designation
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                        <input
                            type="text"
                            placeholder="Search designations..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                        />
                    </div>
                    <div className="relative w-full sm:w-56">
                        <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                        <select
                            value={filterDept}
                            onChange={(e) => setFilterDept(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all appearance-none"
                        >
                            <option value="">All Departments</option>
                            {departments.map((d: any) => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
                    Failed to load designations. Please try again.
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
                                    <th className="py-4 px-6 font-bold">Name</th>
                                    <th className="py-4 px-6 font-bold">Code</th>
                                    <th className="py-4 px-6 font-bold">Department</th>
                                    <th className="py-4 px-6 font-bold">Grade</th>
                                    <th className="py-4 px-6 font-bold text-center">Job Level</th>
                                    <th className="py-4 px-6 font-bold text-center">Managerial</th>
                                    <th className="py-4 px-6 font-bold text-center">Probation</th>
                                    <th className="py-4 px-6 font-bold text-center">Status</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.map((desig: any) => (
                                    <tr
                                        key={desig.id}
                                        className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors"
                                    >
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-accent-50 dark:bg-accent-900/30 flex items-center justify-center shrink-0">
                                                    <Briefcase className="w-4 h-4 text-accent-600 dark:text-accent-400" />
                                                </div>
                                                <span className="font-bold text-primary-950 dark:text-white">{desig.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 font-mono text-xs text-neutral-600 dark:text-neutral-400">{desig.code || "—"}</td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">{deptName(desig.departmentId)}</td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">{gradeName(desig.gradeId)}</td>
                                        <td className="py-4 px-6 text-center">
                                            {desig.jobLevel ? (
                                                <span className="text-[10px] font-bold bg-primary-50 text-primary-700 px-2 py-0.5 rounded border border-primary-100 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50">
                                                    {desig.jobLevel}
                                                </span>
                                            ) : (
                                                <span className="text-neutral-300 dark:text-neutral-600">{"—"}</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            {desig.managerialFlag ? (
                                                <Check size={16} className="inline text-success-600 dark:text-success-400" />
                                            ) : (
                                                <span className="text-neutral-300 dark:text-neutral-600">{"—"}</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-center text-neutral-600 dark:text-neutral-400">
                                            {desig.probationDays ? `${desig.probationDays}d` : "—"}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <StatusBadge status={desig.status ?? "Active"} />
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => openEdit(desig)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit">
                                                    <Edit3 size={15} />
                                                </button>
                                                <button onClick={() => setDeleteTarget(desig)} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" title="Delete">
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && !isLoading && (
                                    <tr>
                                        <td colSpan={9}>
                                            <EmptyState icon="list" title="No designations found" message="Add your first designation to get started." action={{ label: "Add Designation", onClick: openCreate }} />
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
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{editingId ? "Edit Designation" : "Add Designation"}</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <FormField label="Designation Name" value={form.name} onChange={handleNameChange} placeholder="e.g. Senior Engineer" />
                            <FormField label="Code" value={form.code} onChange={handleCodeChange} placeholder="e.g. SR-ENG" />
                            <div className="grid grid-cols-2 gap-4">
                                <SearchableSelect
                                    label="Department"
                                    value={form.departmentId}
                                    onChange={(v) => updateField("departmentId", v)}
                                    options={departmentOptions}
                                    placeholder="Select department..."
                                    onCreateNew={() => window.open('/app/company/hr/departments', '_blank')}
                                    createNewLabel="Create Department"
                                />
                                <SearchableSelect
                                    label="Grade"
                                    value={form.gradeId}
                                    onChange={(v) => updateField("gradeId", v)}
                                    options={gradeOptions}
                                    placeholder="Select grade..."
                                    onCreateNew={() => window.open('/app/company/hr/grades', '_blank')}
                                    createNewLabel="Create Grade"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <SelectField
                                    label="Job Level"
                                    value={form.jobLevel}
                                    onChange={(v) => updateField("jobLevel", v)}
                                    placeholder="Select level..."
                                    options={JOB_LEVELS}
                                />
                                <FormField label="Probation Days" value={form.probationDays} onChange={(v) => updateField("probationDays", v)} placeholder="e.g. 180" type="number" />
                            </div>
                            <ToggleSwitch label="Managerial Role" checked={form.managerialFlag} onChange={(v) => updateField("managerialFlag", v)} />
                            <SearchableSelect
                                label="Reports To"
                                value={form.reportsTo}
                                onChange={(v) => updateField("reportsTo", v)}
                                options={designationOptions.filter(d => d.value !== editingId)}
                                placeholder="Select reporting designation (optional)"
                            />
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
                        <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">Delete Designation?</h2>
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
