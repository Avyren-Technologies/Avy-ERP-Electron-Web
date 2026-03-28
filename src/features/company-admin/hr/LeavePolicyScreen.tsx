import { useState } from "react";
import {
    Shield,
    Plus,
    Edit3,
    Trash2,
    Loader2,
    X,
    Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLeaveTypes, useLeavePolicies } from "@/features/company-admin/api/use-leave-queries";
import { useDepartments, useDesignations, useEmployeeTypes, useGrades } from "@/features/company-admin/api/use-hr-queries";
import {
    useCreateLeavePolicy,
    useUpdateLeavePolicy,
    useDeleteLeavePolicy,
} from "@/features/company-admin/api/use-leave-mutations";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Shared form atoms ── */

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

function NumberField({
    label,
    value,
    onChange,
    placeholder,
    min,
}: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    placeholder?: string;
    min?: number;
}) {
    return (
        <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                {label}
            </label>
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                placeholder={placeholder}
                min={min}
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

function LevelBadge({ level }: { level: string }) {
    const colorMap: Record<string, string> = {
        company: "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50",
        department: "bg-info-50 text-info-700 border-info-200 dark:bg-info-900/20 dark:text-info-400 dark:border-info-800/50",
        designation: "bg-accent-50 text-accent-700 border-accent-200 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50",
        grade: "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50",
        "employee-type": "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50",
        employee: "bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50",
    };
    const cls = colorMap[level?.toLowerCase()] ?? "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700";
    const display = level === "employee-type" ? "Emp. Type" : level;
    return (
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize", cls)}>
            {display || "Company"}
        </span>
    );
}

/* ── Constants ── */

const ASSIGNMENT_LEVELS = [
    { value: "company", label: "Company-wide" },
    { value: "department", label: "Department" },
    { value: "designation", label: "Designation" },
    { value: "grade", label: "Grade" },
    { value: "employee-type", label: "Employee Type" },
    { value: "employee", label: "Individual Employee" },
];

/* ── Empty form ── */

const EMPTY_POLICY = {
    leaveTypeId: "",
    assignmentLevel: "company",
    assignmentTargetId: "",
    assignmentTargetName: "",
    overrideAnnualEntitlement: false,
    annualEntitlement: 0,
    overrideCarryForward: false,
    carryForwardMaxDays: 0,
    overrideEncashment: false,
    encashmentMaxDays: 0,
    notes: "",
};

/* ── Screen ── */

export function LeavePolicyScreen() {
    const { data, isLoading, isError } = useLeavePolicies();
    const leaveTypesQuery = useLeaveTypes();
    const departmentsQuery = useDepartments();
    const designationsQuery = useDesignations();
    const gradesQuery = useGrades();
    const empTypesQuery = useEmployeeTypes();
    const createMutation = useCreateLeavePolicy();
    const updateMutation = useUpdateLeavePolicy();
    const deleteMutation = useDeleteLeavePolicy();

    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...EMPTY_POLICY });
    const [deleteTarget, setDeleteTarget] = useState<any>(null);

    const policies: any[] = data?.data ?? [];
    const leaveTypes: any[] = leaveTypesQuery.data?.data ?? [];
    const departments: any[] = departmentsQuery.data?.data ?? [];
    const designations: any[] = designationsQuery.data?.data ?? [];
    const grades: any[] = gradesQuery.data?.data ?? [];
    const empTypes: any[] = empTypesQuery.data?.data ?? [];

    const leaveTypeName = (id: string) => leaveTypes.find((lt: any) => lt.id === id)?.name ?? id;

    const getTargetOptions = (): { value: string; label: string }[] => {
        switch (form.assignmentLevel) {
            case "department":
                return departments.map((d: any) => ({ value: d.id, label: d.name }));
            case "designation":
                return designations.map((d: any) => ({ value: d.id, label: d.name }));
            case "grade":
                return grades.map((g: any) => ({ value: g.id, label: g.name }));
            case "employee-type":
                return empTypes.map((et: any) => ({ value: et.id, label: et.name }));
            default:
                return [];
        }
    };

    const filtered = policies.filter((p: any) => {
        if (!search) return true;
        const s = search.toLowerCase();
        const ltName = leaveTypeName(p.leaveTypeId)?.toLowerCase();
        return (
            ltName?.includes(s) ||
            p.assignmentLevel?.toLowerCase().includes(s) ||
            p.assignmentTargetName?.toLowerCase().includes(s)
        );
    });

    const openCreate = () => {
        setEditingId(null);
        setForm({ ...EMPTY_POLICY });
        setModalOpen(true);
    };

    const openEdit = (p: any) => {
        setEditingId(p.id);
        setForm({
            leaveTypeId: p.leaveTypeId ?? "",
            assignmentLevel: p.assignmentLevel ?? "company",
            assignmentTargetId: p.assignmentTargetId ?? "",
            assignmentTargetName: p.assignmentTargetName ?? "",
            overrideAnnualEntitlement: p.overrideAnnualEntitlement ?? false,
            annualEntitlement: p.annualEntitlement ?? 0,
            overrideCarryForward: p.overrideCarryForward ?? false,
            carryForwardMaxDays: p.carryForwardMaxDays ?? 0,
            overrideEncashment: p.overrideEncashment ?? false,
            encashmentMaxDays: p.encashmentMaxDays ?? 0,
            notes: p.notes ?? "",
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        try {
            if (editingId) {
                await updateMutation.mutateAsync({ id: editingId, data: form });
                showSuccess("Policy Updated", "Leave policy has been updated.");
            } else {
                await createMutation.mutateAsync(form);
                showSuccess("Policy Created", "Leave policy has been added.");
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
            showSuccess("Policy Deleted", "Leave policy has been removed.");
            setDeleteTarget(null);
        } catch (err) {
            showApiError(err);
        }
    };

    const saving = createMutation.isPending || updateMutation.isPending;
    const updateField = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));

    const buildOverrideSummary = (p: any) => {
        const parts: string[] = [];
        if (p.overrideAnnualEntitlement) parts.push(`${p.annualEntitlement}d entitlement`);
        if (p.overrideCarryForward) parts.push(`CF: ${p.carryForwardMaxDays}d`);
        if (p.overrideEncashment) parts.push(`Enc: ${p.encashmentMaxDays}d`);
        return parts.length > 0 ? parts.join(", ") : "— (inherits defaults)";
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Leave Policies</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Assign and override leave rules by department, grade, or employee</p>
                </div>
                <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
                >
                    <Plus className="w-5 h-5" />
                    Add Policy
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                    <input
                        type="text"
                        placeholder="Search policies..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                    />
                </div>
            </div>

            {isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
                    Failed to load leave policies. Please try again.
                </div>
            )}

            {/* Data Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? (
                    <SkeletonTable rows={5} cols={5} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Leave Type</th>
                                    <th className="py-4 px-6 font-bold">Assignment Level</th>
                                    <th className="py-4 px-6 font-bold">Assignment Target</th>
                                    <th className="py-4 px-6 font-bold">Override Summary</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.map((p: any) => (
                                    <tr
                                        key={p.id}
                                        className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors"
                                    >
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-accent-50 dark:bg-accent-900/30 flex items-center justify-center shrink-0">
                                                    <Shield className="w-4 h-4 text-accent-600 dark:text-accent-400" />
                                                </div>
                                                <span className="font-bold text-primary-950 dark:text-white">{leaveTypeName(p.leaveTypeId)}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6"><LevelBadge level={p.assignmentLevel} /></td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">
                                            {p.assignmentLevel === "company" ? "All Employees" : p.assignmentTargetName || "—"}
                                        </td>
                                        <td className="py-4 px-6 text-xs text-neutral-600 dark:text-neutral-400">{buildOverrideSummary(p)}</td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => openEdit(p)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit">
                                                    <Edit3 size={15} />
                                                </button>
                                                <button onClick={() => setDeleteTarget(p)} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" title="Delete">
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && !isLoading && (
                                    <tr>
                                        <td colSpan={5}>
                                            <EmptyState icon="list" title="No leave policies found" message="Add your first leave policy to get started." action={{ label: "Add Policy", onClick: openCreate }} />
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
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{editingId ? "Edit Policy" : "Add Policy"}</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <SelectField
                                label="Leave Type"
                                value={form.leaveTypeId}
                                onChange={(v) => updateField("leaveTypeId", v)}
                                options={leaveTypes.map((lt: any) => ({ value: lt.id, label: lt.name }))}
                                placeholder="Select leave type..."
                            />

                            <SelectField
                                label="Assignment Level"
                                value={form.assignmentLevel}
                                onChange={(v) => {
                                    updateField("assignmentLevel", v);
                                    updateField("assignmentTargetId", "");
                                    updateField("assignmentTargetName", "");
                                }}
                                options={ASSIGNMENT_LEVELS}
                            />

                            {form.assignmentLevel !== "company" && form.assignmentLevel !== "employee" && (
                                <SelectField
                                    label="Target"
                                    value={form.assignmentTargetId}
                                    onChange={(v) => {
                                        updateField("assignmentTargetId", v);
                                        const opts = getTargetOptions();
                                        const match = opts.find((o) => o.value === v);
                                        updateField("assignmentTargetName", match?.label ?? "");
                                    }}
                                    options={getTargetOptions()}
                                    placeholder="Select target..."
                                />
                            )}

                            {form.assignmentLevel === "employee" && (
                                <FormField
                                    label="Employee ID or Name"
                                    value={form.assignmentTargetId}
                                    onChange={(v) => {
                                        updateField("assignmentTargetId", v);
                                        updateField("assignmentTargetName", v);
                                    }}
                                    placeholder="Enter employee ID..."
                                />
                            )}

                            <div className="pt-2">
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">
                                    Overrides
                                </label>
                                <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 space-y-3 border border-neutral-200 dark:border-neutral-700">
                                    <ToggleSwitch label="Override Annual Entitlement" checked={form.overrideAnnualEntitlement} onChange={(v) => updateField("overrideAnnualEntitlement", v)} />
                                    {form.overrideAnnualEntitlement && (
                                        <NumberField label="Annual Entitlement (Days)" value={form.annualEntitlement} onChange={(v) => updateField("annualEntitlement", v)} min={0} />
                                    )}
                                    <ToggleSwitch label="Override Carry Forward" checked={form.overrideCarryForward} onChange={(v) => updateField("overrideCarryForward", v)} />
                                    {form.overrideCarryForward && (
                                        <NumberField label="Max Carry Forward Days" value={form.carryForwardMaxDays} onChange={(v) => updateField("carryForwardMaxDays", v)} min={0} />
                                    )}
                                    <ToggleSwitch label="Override Encashment" checked={form.overrideEncashment} onChange={(v) => updateField("overrideEncashment", v)} />
                                    {form.overrideEncashment && (
                                        <NumberField label="Max Encashment Days" value={form.encashmentMaxDays} onChange={(v) => updateField("encashmentMaxDays", v)} min={0} />
                                    )}
                                </div>
                            </div>

                            <FormField label="Notes" value={form.notes} onChange={(v) => updateField("notes", v)} placeholder="Optional notes..." />
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
                        <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">Delete Policy?</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            This will permanently remove this leave policy assignment. Affected employees will revert to default rules.
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
