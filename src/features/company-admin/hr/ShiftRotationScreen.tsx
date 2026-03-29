import { useState } from "react";
import {
    RotateCcw,
    Plus,
    Edit3,
    Trash2,
    Loader2,
    X,
    Search,
    Play,
    Users,
    UserMinus,
    Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useShiftRotations } from "@/features/company-admin/api/use-shift-rotation-queries";
import {
    useCreateShiftRotation,
    useUpdateShiftRotation,
    useDeleteShiftRotation,
    useAssignShiftRotation,
    useUnassignShiftRotation,
    useExecuteShiftRotations,
} from "@/features/company-admin/api/use-shift-rotation-mutations";
import { useCompanyShifts } from "@/features/company-admin/api/use-company-admin-queries";
import { useEmployees } from "@/features/company-admin/api/use-hr-queries";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Atoms ── */

function FormField({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
    required,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
    required?: boolean;
}) {
    return (
        <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                {label} {required && <span className="text-danger-500">*</span>}
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
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>
        </div>
    );
}

function PatternBadge({ pattern }: { pattern: string }) {
    const p = pattern?.toUpperCase();
    const cls =
        p === "WEEKLY"
            ? "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50"
            : p === "FORTNIGHTLY"
            ? "bg-accent-50 text-accent-700 border-accent-200 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50"
            : p === "MONTHLY"
            ? "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50"
            : "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700";
    return (
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", cls)}>
            {pattern}
        </span>
    );
}

function ActiveBadge({ active }: { active: boolean }) {
    return (
        <span className={cn(
            "text-[10px] font-bold px-2 py-0.5 rounded-full border",
            active
                ? "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50"
                : "bg-neutral-100 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700"
        )}>
            {active ? "Active" : "Inactive"}
        </span>
    );
}

/* ── Constants ── */

const PATTERNS = [
    { value: "WEEKLY", label: "Weekly" },
    { value: "FORTNIGHTLY", label: "Fortnightly" },
    { value: "MONTHLY", label: "Monthly" },
];

const EMPTY_FORM = {
    name: "",
    pattern: "WEEKLY",
    effectiveFrom: "",
    effectiveTo: "",
    description: "",
    isActive: true,
    shifts: [] as { shiftId: string; shiftName: string; weekNumber: number }[],
};

/* ── Screen ── */

export function ShiftRotationScreen() {
    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [deleteTarget, setDeleteTarget] = useState<any>(null);
    const [detailTarget, setDetailTarget] = useState<any>(null);
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
    const [executeResult, setExecuteResult] = useState<any>(null);

    const { data, isLoading, isError } = useShiftRotations();
    const createMutation = useCreateShiftRotation();
    const updateMutation = useUpdateShiftRotation();
    const deleteMutation = useDeleteShiftRotation();
    const assignMutation = useAssignShiftRotation();
    const unassignMutation = useUnassignShiftRotation();
    const executeMutation = useExecuteShiftRotations();

    const { data: shiftsData } = useCompanyShifts();
    const availableShifts: any[] = (shiftsData as any)?.data ?? [];
    const shiftOptions = availableShifts.map((s: any) => ({
        value: s.id,
        label: s.name,
        sublabel: `${s.fromTime} — ${s.toTime}`,
    }));

    const { data: empData } = useEmployees();
    const allEmployees: any[] = (empData as any)?.data ?? [];
    const employeeOptions = allEmployees.map((e: any) => ({
        value: e.id,
        label: `${e.firstName} ${e.lastName}`,
        sublabel: e.employeeId,
    }));

    // Build a lookup map for employee names
    const employeeMap = new Map(allEmployees.map((e: any) => [e.id, `${e.firstName} ${e.lastName} (${e.employeeId})`]));

    const schedules: any[] = (data as any)?.data ?? [];

    const filtered = schedules.filter((s: any) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return s.name?.toLowerCase().includes(q) || s.pattern?.toLowerCase().includes(q);
    });

    const openCreate = () => {
        setEditingId(null);
        setForm({ ...EMPTY_FORM, shifts: [] });
        setModalOpen(true);
    };

    const openEdit = (schedule: any) => {
        setEditingId(schedule.id);
        setForm({
            name: schedule.name ?? "",
            pattern: schedule.pattern ?? "WEEKLY",
            effectiveFrom: schedule.effectiveFrom ? schedule.effectiveFrom.substring(0, 10) : "",
            effectiveTo: schedule.effectiveTo ? schedule.effectiveTo.substring(0, 10) : "",
            description: schedule.description ?? "",
            isActive: schedule.isActive ?? true,
            shifts: (schedule.shifts ?? []).map((s: any, i: number) => ({
                shiftId: s.shiftId ?? "",
                shiftName: s.shiftName ?? availableShifts.find((sh: any) => sh.id === s.shiftId)?.name ?? "",
                weekNumber: s.weekNumber ?? i + 1,
            })),
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        try {
            const payload = {
                name: form.name,
                rotationPattern: form.pattern,
                effectiveFrom: form.effectiveFrom,
                effectiveTo: form.effectiveTo || undefined,
                description: form.description || undefined,
                isActive: form.isActive,
                shifts: form.shifts.map((s, i) => ({
                    shiftId: s.shiftId,
                    weekNumber: i + 1,
                })),
            };
            if (editingId) {
                await updateMutation.mutateAsync({ id: editingId, data: payload });
                showSuccess("Schedule Updated", `${form.name} has been updated.`);
            } else {
                await createMutation.mutateAsync(payload);
                showSuccess("Schedule Created", `${form.name} has been added.`);
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
            showSuccess("Schedule Deleted", `${deleteTarget.name} has been removed.`);
            setDeleteTarget(null);
        } catch (err) {
            showApiError(err);
        }
    };

    const handleAssign = async () => {
        if (!detailTarget || selectedEmployeeIds.length === 0) return;
        try {
            await assignMutation.mutateAsync({ id: detailTarget.id, data: { employeeIds: selectedEmployeeIds } });
            showSuccess("Employees Assigned", `${selectedEmployeeIds.length} employee(s) assigned to ${detailTarget.name}.`);
            setAssignModalOpen(false);
            setSelectedEmployeeIds([]);
        } catch (err) {
            showApiError(err);
        }
    };

    const handleRemoveEmployee = async (scheduleId: string, employeeId: string) => {
        try {
            await unassignMutation.mutateAsync({ id: scheduleId, employeeId });
            showSuccess("Employee Removed", "Employee has been removed from the schedule.");
        } catch (err) {
            showApiError(err);
        }
    };

    const handleExecute = async (schedule: any) => {
        try {
            const result = await executeMutation.mutateAsync(undefined as void);
            const count = (result as any)?.data?.rotatedCount ?? (result as any)?.rotatedCount ?? 0;
            setExecuteResult({ name: schedule.name, count });
            showSuccess("Rotation Executed", `${count} employee(s) rotated for ${schedule.name}.`);
        } catch (err) {
            showApiError(err);
        }
    };

    const addShiftRow = () => {
        setForm((p) => ({ ...p, shifts: [...p.shifts, { shiftId: "", shiftName: "", weekNumber: p.shifts.length + 1 }] }));
    };

    const removeShiftRow = (index: number) => {
        setForm((p) => ({ ...p, shifts: p.shifts.filter((_, i) => i !== index) }));
    };

    const updateShiftRow = (index: number, field: string, value: any) => {
        setForm((p) => ({
            ...p,
            shifts: p.shifts.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
        }));
    };

    const saving = createMutation.isPending || updateMutation.isPending;
    const updateField = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Shift Rotations</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Manage shift rotation schedules</p>
                </div>
                <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
                >
                    <Plus className="w-5 h-5" />
                    Add Schedule
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                    <input
                        type="text"
                        placeholder="Search schedules..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                    />
                </div>
            </div>

            {isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
                    Failed to load schedules. Please try again.
                </div>
            )}

            {/* Data Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? (
                    <SkeletonTable rows={6} cols={7} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Name</th>
                                    <th className="py-4 px-6 font-bold text-center">Pattern</th>
                                    <th className="py-4 px-6 font-bold text-center">Shifts</th>
                                    <th className="py-4 px-6 font-bold text-center">Employees</th>
                                    <th className="py-4 px-6 font-bold">Effective From</th>
                                    <th className="py-4 px-6 font-bold text-center">Status</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.map((s: any) => (
                                    <tr
                                        key={s.id}
                                        className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors"
                                    >
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-accent-50 dark:bg-accent-900/30 flex items-center justify-center shrink-0">
                                                    <RotateCcw className="w-4 h-4 text-accent-600 dark:text-accent-400" />
                                                </div>
                                                <button onClick={() => setDetailTarget(s)} className="font-bold text-primary-950 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-left">
                                                    {s.name}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-center"><PatternBadge pattern={s.pattern ?? "WEEKLY"} /></td>
                                        <td className="py-4 px-6 text-center text-neutral-600 dark:text-neutral-400 font-bold">{s.shifts?.length ?? s.shiftCount ?? 0}</td>
                                        <td className="py-4 px-6 text-center text-neutral-600 dark:text-neutral-400 font-bold">{s.assignedEmployees?.length ?? s.employeeCount ?? 0}</td>
                                        <td className="py-4 px-6 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                                            {s.effectiveFrom ? new Date(s.effectiveFrom).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                                        </td>
                                        <td className="py-4 px-6 text-center"><ActiveBadge active={s.isActive ?? true} /></td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => handleExecute(s)}
                                                    disabled={executeMutation.isPending}
                                                    className="p-2 text-success-600 dark:text-success-400 hover:bg-success-50 dark:hover:bg-success-900/30 rounded-lg transition-colors"
                                                    title="Execute Rotation"
                                                >
                                                    <Play size={15} />
                                                </button>
                                                <button onClick={() => { setDetailTarget(s); setAssignModalOpen(true); }} className="p-2 text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-900/30 rounded-lg transition-colors" title="Assign Employees">
                                                    <Users size={15} />
                                                </button>
                                                <button onClick={() => openEdit(s)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit">
                                                    <Edit3 size={15} />
                                                </button>
                                                <button onClick={() => setDeleteTarget(s)} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" title="Delete">
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && !isLoading && (
                                    <tr>
                                        <td colSpan={7}>
                                            <EmptyState icon="list" title="No schedules found" message="Create a shift rotation schedule to get started." action={{ label: "Add Schedule", onClick: openCreate }} />
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
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{editingId ? "Edit Schedule" : "Add Schedule"}</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <FormField label="Schedule Name" value={form.name} onChange={(v) => updateField("name", v)} placeholder="e.g. Weekly A-B-C Rotation" required />
                            <SelectField label="Pattern" value={form.pattern} onChange={(v) => updateField("pattern", v)} options={PATTERNS} />
                            <FormField label="Effective From" value={form.effectiveFrom} onChange={(v) => updateField("effectiveFrom", v)} type="date" required />
                            <FormField label="Effective To" value={form.effectiveTo} onChange={(v) => updateField("effectiveTo", v)} type="date" />
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                                    Description
                                </label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => updateField("description", e.target.value)}
                                    placeholder="Notes about this schedule..."
                                    rows={2}
                                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none"
                                />
                            </div>
                            <div className="flex items-center justify-between px-1">
                                <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Active</label>
                                <button
                                    type="button"
                                    onClick={() => updateField("isActive", !form.isActive)}
                                    className={cn(
                                        "w-11 h-6 rounded-full transition-colors relative flex-shrink-0",
                                        form.isActive ? "bg-success-500" : "bg-neutral-300 dark:bg-neutral-700"
                                    )}
                                >
                                    <div className={cn("w-[18px] h-[18px] rounded-full bg-white absolute top-[3px] transition-all shadow-sm", form.isActive ? "left-[22px]" : "left-[3px]")} />
                                </button>
                            </div>
                            {/* Shifts array */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Shifts</label>
                                    <button onClick={addShiftRow} className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline">+ Add Shift</button>
                                </div>
                                {form.shifts.map((shift, i) => (
                                    <div key={i} className="flex items-center gap-2 mb-2">
                                        <div className="flex-1">
                                            <SearchableSelect
                                                value={shift.shiftId}
                                                onChange={(v) => {
                                                    const selected = availableShifts.find((s: any) => s.id === v);
                                                    updateShiftRow(i, "shiftId", v);
                                                    if (selected) updateShiftRow(i, "shiftName", selected.name);
                                                }}
                                                options={shiftOptions}
                                                placeholder="Select shift..."
                                            />
                                        </div>
                                        <div className="w-16 h-10 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center text-sm font-bold text-neutral-600 dark:text-neutral-300">
                                            #{i + 1}
                                        </div>
                                        <button onClick={() => removeShiftRow(i)} className="p-1.5 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg">
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
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

            {/* ── Detail / Employees Panel ── */}
            {detailTarget && !assignModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{detailTarget.name}</h2>
                            <button onClick={() => setDetailTarget(null)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="flex items-center gap-3 mb-4">
                                <PatternBadge pattern={detailTarget.pattern ?? "WEEKLY"} />
                                <ActiveBadge active={detailTarget.isActive ?? true} />
                            </div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
                                Effective from: {detailTarget.effectiveFrom ? new Date(detailTarget.effectiveFrom).toLocaleDateString("en-IN") : "Not set"}
                            </p>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-primary-950 dark:text-white">Assigned Employees</h3>
                                <button onClick={() => setAssignModalOpen(true)} className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline">+ Assign</button>
                            </div>
                            {(detailTarget.assignedEmployees ?? []).length === 0 ? (
                                <p className="text-sm text-neutral-400 dark:text-neutral-500">No employees assigned yet.</p>
                            ) : (
                                <div className="space-y-2">
                                    {(detailTarget.assignedEmployees ?? []).map((emp: any) => (
                                        <div key={emp.id ?? emp.employeeId} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                                            <span className="text-sm font-medium text-primary-950 dark:text-white">{emp.name ?? emp.employeeName ?? employeeMap.get(emp.id ?? emp.employeeId) ?? emp.id}</span>
                                            <button
                                                onClick={() => handleRemoveEmployee(detailTarget.id, emp.id ?? emp.employeeId)}
                                                className="p-1 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg"
                                            >
                                                <UserMinus size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setDetailTarget(null)} className="w-full py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Assign Employees Modal ── */}
            {assignModalOpen && detailTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">Assign Employees</h2>
                            <button onClick={() => setAssignModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">Select employees to assign to this schedule.</p>
                            <SearchableSelect
                                label="Select Employees"
                                value=""
                                onChange={() => {}}
                                multiple
                                selectedValues={selectedEmployeeIds}
                                onMultiChange={setSelectedEmployeeIds}
                                options={employeeOptions}
                                placeholder="Search employees..."
                            />
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => { setAssignModalOpen(false); setSelectedEmployeeIds([]); }} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleAssign} disabled={assignMutation.isPending || selectedEmployeeIds.length === 0} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {assignMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                {assignMutation.isPending ? "Assigning..." : `Assign (${selectedEmployeeIds.length})`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Execute Result ── */}
            {executeResult && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200 text-center">
                        <div className="w-14 h-14 rounded-full bg-success-50 dark:bg-success-900/30 flex items-center justify-center mx-auto mb-4">
                            <Play className="w-7 h-7 text-success-600 dark:text-success-400" />
                        </div>
                        <h2 className="text-lg font-bold text-primary-950 dark:text-white mb-2">Rotation Executed</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{executeResult.name}</p>
                        <p className="text-2xl font-bold text-success-600 dark:text-success-400">{executeResult.count} employee(s) rotated</p>
                        <button onClick={() => setExecuteResult(null)} className="mt-6 w-full py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors">Done</button>
                    </div>
                </div>
            )}

            {/* ── Delete Confirmation ── */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">Delete Schedule?</h2>
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
