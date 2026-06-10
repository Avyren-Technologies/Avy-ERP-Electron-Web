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
import { SearchableSelect } from "@/components/ui/SearchableSelect";
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
    assignmentTargetIds: [] as string[],
    overrideAnnualEntitlement: false,
    annualEntitlement: 0,
    overrideCarryForward: false,
    carryForwardMaxDays: 0,
    overrideEncashment: false,
    encashmentMaxDays: 0,
    notes: "",
};

const LEVELS_WITH_TARGET_DROPDOWN = new Set(["department", "designation", "grade", "employee-type"]);

/* Backend uses `employeeType`; UI uses `employee-type`. Map both ways. */
function toBackendLevel(uiLevel: string): string {
    return uiLevel === "employee-type" ? "employeeType" : uiLevel === "employee" ? "individual" : uiLevel;
}
function toUiLevel(backendLevel: string | undefined | null): string {
    if (!backendLevel) return "company";
    if (backendLevel === "employeeType") return "employee-type";
    if (backendLevel === "individual") return "employee";
    return backendLevel;
}

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
    const [editingGroupPolicyIds, setEditingGroupPolicyIds] = useState<string[]>([]);
    const [form, setForm] = useState({ ...EMPTY_POLICY });
    const [deleteTarget, setDeleteTarget] = useState<PolicyGroup | null>(null);

    const policies: any[] = data?.data ?? [];
    const leaveTypes: any[] = leaveTypesQuery.data?.data ?? [];
    const departments: any[] = departmentsQuery.data?.data ?? [];
    const designations: any[] = designationsQuery.data?.data ?? [];
    const grades: any[] = gradesQuery.data?.data ?? [];
    const empTypes: any[] = empTypesQuery.data?.data ?? [];

    /* Group rows by (leaveType, level, overrides). All grouped policies share
       the same override profile and differ only by assignment target. */
    const stableStringify = (val: any): string => {
        if (val === null || val === undefined) return "null";
        if (typeof val !== "object") return JSON.stringify(val);
        if (Array.isArray(val)) return `[${val.map(stableStringify).join(",")}]`;
        const keys = Object.keys(val).sort();
        return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(val[k])}`).join(",")}}`;
    };

    interface PolicyGroup {
        groupKey: string;
        leaveTypeId: string;
        assignmentLevel: string;
        overrides: Record<string, any> | null;
        policyIds: string[];
        assignmentIds: string[];
    }

    const groups: PolicyGroup[] = (() => {
        const map = new Map<string, PolicyGroup>();
        for (const p of policies) {
            const key = `${p.leaveTypeId}::${p.assignmentLevel}::${stableStringify(p.overrides ?? null)}`;
            const existing = map.get(key);
            if (existing) {
                existing.policyIds.push(p.id);
                if (p.assignmentId) existing.assignmentIds.push(p.assignmentId);
            } else {
                map.set(key, {
                    groupKey: key,
                    leaveTypeId: p.leaveTypeId,
                    assignmentLevel: p.assignmentLevel,
                    overrides: p.overrides ?? null,
                    policyIds: [p.id],
                    assignmentIds: p.assignmentId ? [p.assignmentId] : [],
                });
            }
        }
        return Array.from(map.values());
    })();

    const leaveTypeName = (id: string) => leaveTypes.find((lt: any) => lt.id === id)?.name ?? id;

    /* Resolve target display name from local master lists since the backend
       does not denormalize this onto the LeavePolicy row. */
    const resolveTargetName = (level: string, assignmentId?: string | null): string => {
        if (!assignmentId) return "";
        const uiLevel = toUiLevel(level);
        const lookup: Record<string, any[]> = {
            department: departments,
            designation: designations,
            grade: grades,
            "employee-type": empTypes,
        };
        const list = lookup[uiLevel] ?? [];
        return list.find((x: any) => x.id === assignmentId)?.name ?? "";
    };

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

    const filtered = groups.filter((g) => {
        if (!search) return true;
        const s = search.toLowerCase();
        const ltName = leaveTypeName(g.leaveTypeId)?.toLowerCase() ?? "";
        const targetNames = g.assignmentIds.map((id) => resolveTargetName(g.assignmentLevel, id).toLowerCase()).join(" ");
        return (
            ltName.includes(s) ||
            g.assignmentLevel?.toLowerCase().includes(s) ||
            targetNames.includes(s)
        );
    });

    const openCreate = () => {
        setEditingId(null);
        setEditingGroupPolicyIds([]);
        setForm({ ...EMPTY_POLICY });
        setModalOpen(true);
    };

    const openEdit = (g: PolicyGroup) => {
        setEditingId(g.policyIds[0] ?? null);
        setEditingGroupPolicyIds(g.policyIds);
        const overrides = (g.overrides ?? {}) as Record<string, any>;
        setForm({
            leaveTypeId: g.leaveTypeId ?? "",
            assignmentLevel: toUiLevel(g.assignmentLevel),
            assignmentTargetIds: [...g.assignmentIds],
            overrideAnnualEntitlement: overrides.annualEntitlement != null,
            annualEntitlement: Number(overrides.annualEntitlement ?? 0),
            overrideCarryForward: overrides.maxCarryForwardDays != null,
            carryForwardMaxDays: Number(overrides.maxCarryForwardDays ?? 0),
            overrideEncashment: overrides.maxEncashableDays != null,
            encashmentMaxDays: Number(overrides.maxEncashableDays ?? 0),
            notes: overrides.notes ?? "",
        });
        setModalOpen(true);
    };

    const buildOverridesPayload = () => {
        const o: Record<string, any> = {};
        if (form.overrideAnnualEntitlement) o.annualEntitlement = Number(form.annualEntitlement);
        if (form.overrideCarryForward) o.maxCarryForwardDays = Number(form.carryForwardMaxDays);
        if (form.overrideEncashment) o.maxEncashableDays = Number(form.encashmentMaxDays);
        if (form.notes?.trim()) o.notes = form.notes.trim();
        return Object.keys(o).length > 0 ? o : null;
    };

    const handleSave = async () => {
        const backendLevel = toBackendLevel(form.assignmentLevel);
        const needsTarget = LEVELS_WITH_TARGET_DROPDOWN.has(form.assignmentLevel) || form.assignmentLevel === "employee";

        if (!form.leaveTypeId) {
            showApiError(new Error("Please select a leave type"));
            return;
        }
        if (needsTarget && form.assignmentTargetIds.length === 0) {
            showApiError(new Error("Please select at least one target"));
            return;
        }

        const payload: Record<string, any> = {
            leaveTypeId: form.leaveTypeId,
            assignmentLevel: backendLevel,
            overrides: buildOverridesPayload(),
        };
        if (needsTarget) payload.assignmentIds = form.assignmentTargetIds;
        // Pass full group to backend so removed targets get deleted.
        if (editingId && editingGroupPolicyIds.length > 0) payload.policyIds = editingGroupPolicyIds;

        try {
            if (editingId) {
                await updateMutation.mutateAsync({ id: editingId, data: payload });
                showSuccess(
                    "Policy Updated",
                    form.assignmentTargetIds.length > 1
                        ? `Leave policy applied to ${form.assignmentTargetIds.length} targets.`
                        : "Leave policy has been updated.",
                );
            } else {
                await createMutation.mutateAsync(payload);
                showSuccess(
                    "Policy Created",
                    form.assignmentTargetIds.length > 1
                        ? `Leave policy created for ${form.assignmentTargetIds.length} targets.`
                        : "Leave policy has been added.",
                );
            }
            setModalOpen(false);
        } catch (err) {
            showApiError(err);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await Promise.all(deleteTarget.policyIds.map((id) => deleteMutation.mutateAsync(id)));
            const n = deleteTarget.policyIds.length;
            showSuccess(
                "Policy Deleted",
                n > 1 ? `${n} leave policy entries have been removed.` : "Leave policy has been removed.",
            );
            setDeleteTarget(null);
        } catch (err) {
            showApiError(err);
        }
    };

    const saving = createMutation.isPending || updateMutation.isPending;
    const updateField = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));

    const buildOverrideSummary = (overrides: Record<string, any> | null) => {
        const o = (overrides ?? {}) as Record<string, any>;
        const parts: string[] = [];
        if (o.annualEntitlement != null) parts.push(`${o.annualEntitlement}d entitlement`);
        if (o.maxCarryForwardDays != null) parts.push(`CF: ${o.maxCarryForwardDays}d`);
        if (o.maxEncashableDays != null) parts.push(`Enc: ${o.maxEncashableDays}d`);
        return parts.length > 0 ? parts.join(", ") : "— (inherits defaults)";
    };

    const renderTargetCell = (g: PolicyGroup) => {
        if (g.assignmentLevel === "company") return "All Employees";
        if (g.assignmentIds.length === 0) return "—";
        const names = g.assignmentIds.map((id) => resolveTargetName(g.assignmentLevel, id) || id);
        if (names.length <= 3) {
            return (
                <div className="flex flex-wrap gap-1">
                    {names.map((n) => (
                        <span key={n} className="inline-block px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">{n}</span>
                    ))}
                </div>
            );
        }
        return (
            <div className="flex flex-wrap gap-1" title={names.join(", ")}>
                {names.slice(0, 2).map((n) => (
                    <span key={n} className="inline-block px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">{n}</span>
                ))}
                <span className="inline-block px-2 py-0.5 rounded-md bg-primary-50 dark:bg-primary-900/30 text-[11px] font-bold text-primary-700 dark:text-primary-300">+{names.length - 2} more</span>
            </div>
        );
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
                                {filtered.map((g) => (
                                    <tr
                                        key={g.groupKey}
                                        className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors"
                                    >
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-accent-50 dark:bg-accent-900/30 flex items-center justify-center shrink-0">
                                                    <Shield className="w-4 h-4 text-accent-600 dark:text-accent-400" />
                                                </div>
                                                <span className="font-bold text-primary-950 dark:text-white">{leaveTypeName(g.leaveTypeId)}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6"><LevelBadge level={toUiLevel(g.assignmentLevel)} /></td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">
                                            {renderTargetCell(g)}
                                        </td>
                                        <td className="py-4 px-6 text-xs text-neutral-600 dark:text-neutral-400">{buildOverrideSummary(g.overrides)}</td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => openEdit(g)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit">
                                                    <Edit3 size={15} />
                                                </button>
                                                <button onClick={() => setDeleteTarget(g)} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" title="Delete">
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
                                    updateField("assignmentTargetIds", []);
                                }}
                                options={ASSIGNMENT_LEVELS}
                            />

                            {LEVELS_WITH_TARGET_DROPDOWN.has(form.assignmentLevel) && (
                                <div>
                                    <SearchableSelect
                                        label={
                                            form.assignmentTargetIds.length > 1
                                                ? `Targets (${form.assignmentTargetIds.length} selected)`
                                                : "Target"
                                        }
                                        value=""
                                        onChange={() => { /* unused in multi mode */ }}
                                        options={getTargetOptions().map((o) => ({ value: o.value, label: o.label }))}
                                        placeholder={editingId ? "Edit targets..." : "Select one or more targets..."}
                                        multiple
                                        selectedValues={form.assignmentTargetIds}
                                        onMultiChange={(vals) => updateField("assignmentTargetIds", vals)}
                                        required
                                    />
                                    {form.assignmentTargetIds.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            {form.assignmentTargetIds.map((id) => {
                                                const label = getTargetOptions().find((o) => o.value === id)?.label ?? id;
                                                return (
                                                    <span
                                                        key={id}
                                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-semibold"
                                                    >
                                                        {label}
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                updateField(
                                                                    "assignmentTargetIds",
                                                                    form.assignmentTargetIds.filter((x) => x !== id),
                                                                )
                                                            }
                                                            className="hover:text-danger-600"
                                                            aria-label={`Remove ${label}`}
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    )}
                                    {editingId && (
                                        <p className="mt-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                                            Saving applies the current overrides to all selected targets. Targets removed here are deleted.
                                        </p>
                                    )}
                                </div>
                            )}

                            {form.assignmentLevel === "employee" && (
                                <FormField
                                    label="Employee ID"
                                    value={form.assignmentTargetIds[0] ?? ""}
                                    onChange={(v) => updateField("assignmentTargetIds", v ? [v] : [])}
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
                            {deleteTarget.policyIds.length > 1
                                ? `This will permanently remove this leave policy from ${deleteTarget.policyIds.length} targets. Affected employees will revert to default rules.`
                                : "This will permanently remove this leave policy assignment. Affected employees will revert to default rules."}
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
