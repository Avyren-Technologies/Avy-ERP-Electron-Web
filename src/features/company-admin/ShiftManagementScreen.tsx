import { useState } from "react";
import {
    Clock,
    Plus,
    Edit3,
    Trash2,
    Loader2,
    X,
    Search,
    Moon,
    Sun,
    Zap,
    Coffee,
    CheckCircle2,
    XCircle,
} from "lucide-react";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { cn } from "@/lib/utils";
import { useCompanyShifts } from "@/features/company-admin/api/use-company-admin-queries";
import {
    useCreateShift,
    useUpdateShift,
    useDeleteShift,
    useCreateShiftBreak,
    useUpdateShiftBreak,
    useDeleteShiftBreak,
} from "@/features/company-admin/api/use-company-admin-mutations";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";
import type { CompanyShift, ShiftBreak, ShiftType, BreakType, CreateShiftPayload, CreateShiftBreakPayload } from "@/lib/api/company-admin";

/* ── Shared Form Components ── */

function FormField({ label, value, onChange, placeholder, type = "text" }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
    return (
        <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">{label}</label>
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

function FormToggle({ label, description, checked, onChange, tooltip }: {
    label: string; description?: string; checked: boolean; onChange: (v: boolean) => void; tooltip?: string;
}) {
    return (
        <div className="flex items-start gap-3">
            <button
                type="button"
                onClick={() => onChange(!checked)}
                className={cn(
                    "w-10 h-6 rounded-full transition-colors relative flex-shrink-0 mt-0.5",
                    checked ? "bg-primary-600" : "bg-neutral-300 dark:bg-neutral-700"
                )}
            >
                <div className={cn("w-4 h-4 rounded-full bg-white absolute top-1 transition-all", checked ? "left-5" : "left-1")} />
            </button>
            <div>
                <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-primary-950 dark:text-white">{label}</span>
                    {tooltip && <InfoTooltip content={tooltip} />}
                </div>
                {description && <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{description}</p>}
            </div>
        </div>
    );
}

function NullableNumberField({ label, value, onChange, suffix, min, max, step, tooltip }: {
    label: string; value: number | null; onChange: (v: number | null) => void; suffix?: string; min?: number; max?: number; step?: number; tooltip?: string;
}) {
    const isDefault = value === null;
    return (
        <div className="flex items-center justify-between px-4 py-3 rounded-lg border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/50">
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => onChange(e.target.checked ? null : (min ?? 0))}
                    className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
                <div className="flex items-center gap-1.5">
                    <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">{label}</p>
                    {tooltip && <InfoTooltip content={tooltip} />}
                </div>
            </div>
            {!isDefault ? (
                <div className="flex items-center gap-1.5 ml-3">
                    <input
                        type="number"
                        value={value ?? 0}
                        onChange={(e) => onChange(Number(e.target.value))}
                        min={min}
                        max={max}
                        step={step}
                        className="w-16 px-2 py-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded text-xs text-right font-mono focus:outline-none focus:ring-1 focus:ring-primary-500/20 dark:text-white"
                    />
                    {suffix && <span className="text-[10px] text-neutral-400">{suffix}</span>}
                </div>
            ) : (
                <span className="text-[10px] font-medium text-primary-500 ml-3">Use Default</span>
            )}
        </div>
    );
}

/* ── Constants ── */

const SHIFT_TYPE_OPTIONS = [
    { value: "DAY", label: "Day" },
    { value: "NIGHT", label: "Night" },
    { value: "FLEXIBLE", label: "Flexible" },
];

const BREAK_TYPE_OPTIONS = [
    { value: "FIXED", label: "Fixed" },
    { value: "FLEXIBLE", label: "Flexible" },
];

const SHIFT_TYPE_ICON: Record<ShiftType, typeof Sun> = {
    DAY: Sun,
    NIGHT: Moon,
    FLEXIBLE: Zap,
};

const SHIFT_TYPE_COLOR: Record<ShiftType, string> = {
    DAY: "bg-warning-50 text-warning-700 border-warning-100 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50",
    NIGHT: "bg-accent-50 text-accent-700 border-accent-100 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50",
    FLEXIBLE: "bg-primary-50 text-primary-700 border-primary-100 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50",
};

interface ShiftFormState {
    name: string;
    shiftType: ShiftType;
    startTime: string;
    endTime: string;
    isCrossDay: boolean;
    noShuffle: boolean;
    autoClockOutMinutes: number | null;
    gracePeriodMinutes: number | null;
    earlyExitToleranceMinutes: number | null;
    halfDayThresholdHours: number | null;
    fullDayThresholdHours: number | null;
    maxLateCheckInMinutes: number | null;
    minWorkingHoursForOT: number | null;
    requireSelfie: boolean | null;
    requireGPS: boolean | null;
}

const EMPTY_SHIFT: ShiftFormState = {
    name: "",
    shiftType: "DAY",
    startTime: "09:00",
    endTime: "17:00",
    isCrossDay: false,
    noShuffle: false,
    autoClockOutMinutes: null,
    gracePeriodMinutes: null,
    earlyExitToleranceMinutes: null,
    halfDayThresholdHours: null,
    fullDayThresholdHours: null,
    maxLateCheckInMinutes: null,
    minWorkingHoursForOT: null,
    requireSelfie: null,
    requireGPS: null,
};

interface BreakFormState {
    name: string;
    type: BreakType;
    startTime: string;
    duration: number;
    isPaid: boolean;
}

const EMPTY_BREAK: BreakFormState = {
    name: "",
    type: "FIXED",
    startTime: "",
    duration: 30,
    isPaid: false,
};

/* ── Screen ── */

export function ShiftManagementScreen() {
    const { data, isLoading, isError } = useCompanyShifts();
    const createMutation = useCreateShift();
    const updateMutation = useUpdateShift();
    const deleteMutation = useDeleteShift();
    const createBreakMutation = useCreateShiftBreak();
    const updateBreakMutation = useUpdateShiftBreak();
    const deleteBreakMutation = useDeleteShiftBreak();

    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<ShiftFormState>({ ...EMPTY_SHIFT });
    const [deleteTarget, setDeleteTarget] = useState<CompanyShift | null>(null);

    // Break management state
    const [breakForm, setBreakForm] = useState<BreakFormState>({ ...EMPTY_BREAK });
    const [editingBreakId, setEditingBreakId] = useState<string | null>(null);
    const [showBreakForm, setShowBreakForm] = useState(false);
    const [currentBreaks, setCurrentBreaks] = useState<ShiftBreak[]>([]);

    const shifts: CompanyShift[] = data?.data ?? [];
    const filtered = shifts.filter((s) => {
        if (!search) return true;
        return s.name?.toLowerCase().includes(search.toLowerCase());
    });

    const openCreate = () => {
        setEditingId(null);
        setForm({ ...EMPTY_SHIFT });
        setCurrentBreaks([]);
        setShowBreakForm(false);
        setModalOpen(true);
    };

    const openEdit = (shift: CompanyShift) => {
        setEditingId(shift.id);
        setForm({
            name: shift.name ?? "",
            shiftType: shift.shiftType ?? "DAY",
            startTime: shift.startTime ?? "09:00",
            endTime: shift.endTime ?? "17:00",
            isCrossDay: shift.isCrossDay ?? false,
            noShuffle: shift.noShuffle ?? false,
            autoClockOutMinutes: shift.autoClockOutMinutes ?? null,
            gracePeriodMinutes: shift.gracePeriodMinutes ?? null,
            earlyExitToleranceMinutes: shift.earlyExitToleranceMinutes ?? null,
            halfDayThresholdHours: shift.halfDayThresholdHours ?? null,
            fullDayThresholdHours: shift.fullDayThresholdHours ?? null,
            maxLateCheckInMinutes: shift.maxLateCheckInMinutes ?? null,
            minWorkingHoursForOT: shift.minWorkingHoursForOT ?? null,
            requireSelfie: shift.requireSelfie ?? null,
            requireGPS: shift.requireGPS ?? null,
        });
        setCurrentBreaks(shift.breaks ?? []);
        setShowBreakForm(false);
        setModalOpen(true);
    };

    const handleSave = async () => {
        try {
            const payload: CreateShiftPayload = {
                name: form.name,
                shiftType: form.shiftType,
                startTime: form.startTime,
                endTime: form.endTime,
                isCrossDay: form.isCrossDay,
                noShuffle: form.noShuffle,
                autoClockOutMinutes: form.autoClockOutMinutes,
                gracePeriodMinutes: form.gracePeriodMinutes,
                earlyExitToleranceMinutes: form.earlyExitToleranceMinutes,
                halfDayThresholdHours: form.halfDayThresholdHours,
                fullDayThresholdHours: form.fullDayThresholdHours,
                maxLateCheckInMinutes: form.maxLateCheckInMinutes,
                minWorkingHoursForOT: form.minWorkingHoursForOT,
                requireSelfie: form.requireSelfie,
                requireGPS: form.requireGPS,
            };
            if (editingId) {
                await updateMutation.mutateAsync({ id: editingId, data: payload });
                showSuccess("Shift Updated", `${form.name} has been updated.`);
            } else {
                await createMutation.mutateAsync(payload);
                showSuccess("Shift Created", `${form.name} has been added.`);
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
            showSuccess("Shift Deleted", `${deleteTarget.name} has been removed.`);
            setDeleteTarget(null);
        } catch (err) {
            showApiError(err);
        }
    };

    const handleSaveBreak = async () => {
        if (!editingId) return;
        try {
            const payload: CreateShiftBreakPayload = {
                name: breakForm.name,
                type: breakForm.type,
                startTime: breakForm.type === "FIXED" && breakForm.startTime ? breakForm.startTime : null,
                duration: breakForm.duration,
                isPaid: breakForm.isPaid,
            };
            if (editingBreakId) {
                await updateBreakMutation.mutateAsync({ shiftId: editingId, breakId: editingBreakId, data: payload });
                showSuccess("Break Updated", `${breakForm.name} has been updated.`);
            } else {
                await createBreakMutation.mutateAsync({ shiftId: editingId, data: payload });
                showSuccess("Break Added", `${breakForm.name} has been added.`);
            }
            setShowBreakForm(false);
            setEditingBreakId(null);
            setBreakForm({ ...EMPTY_BREAK });
            // Refetch breaks from updated shifts will happen via query invalidation
        } catch (err) {
            showApiError(err);
        }
    };

    const handleDeleteBreak = async (brk: ShiftBreak) => {
        if (!editingId) return;
        try {
            await deleteBreakMutation.mutateAsync({ shiftId: editingId, breakId: brk.id });
            showSuccess("Break Deleted", `${brk.name} has been removed.`);
            setCurrentBreaks((prev) => prev.filter((b) => b.id !== brk.id));
        } catch (err) {
            showApiError(err);
        }
    };

    const openEditBreak = (brk: ShiftBreak) => {
        setEditingBreakId(brk.id);
        setBreakForm({
            name: brk.name,
            type: brk.type,
            startTime: brk.startTime ?? "",
            duration: brk.duration,
            isPaid: brk.isPaid,
        });
        setShowBreakForm(true);
    };

    const saving = createMutation.isPending || updateMutation.isPending;
    const breakSaving = createBreakMutation.isPending || updateBreakMutation.isPending;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Shifts</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Configure work shifts, breaks, and policy overrides</p>
                </div>
                <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
                >
                    <Plus className="w-5 h-5" />
                    Add Shift
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                    <input
                        type="text"
                        placeholder="Search shifts..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                    />
                </div>
            </div>

            {isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
                    Failed to load shifts. Please try again.
                </div>
            )}

            {/* Data Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? (
                    <SkeletonTable rows={5} cols={6} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Name</th>
                                    <th className="py-4 px-6 font-bold">Type</th>
                                    <th className="py-4 px-6 font-bold">Timing</th>
                                    <th className="py-4 px-6 font-bold text-center">Cross-Day</th>
                                    <th className="py-4 px-6 font-bold text-center">Breaks</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.map((shift) => {
                                    const TypeIcon = SHIFT_TYPE_ICON[shift.shiftType] ?? Sun;
                                    const breaks = shift.breaks ?? [];
                                    return (
                                        <tr key={shift.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-accent-50 dark:bg-accent-900/30 flex items-center justify-center shrink-0">
                                                        <Clock className="w-4 h-4 text-accent-600 dark:text-accent-400" />
                                                    </div>
                                                    <span className="font-bold text-primary-950 dark:text-white">{shift.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={cn("inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded border", SHIFT_TYPE_COLOR[shift.shiftType])}>
                                                    <TypeIcon size={10} />
                                                    {shift.shiftType}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 font-mono text-sm text-neutral-700 dark:text-neutral-300">
                                                {shift.startTime} — {shift.endTime}
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                {shift.isCrossDay ? (
                                                    <span className="text-[10px] font-bold bg-accent-50 text-accent-700 px-2 py-0.5 rounded border border-accent-100 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50">Yes</span>
                                                ) : (
                                                    <span className="text-[10px] font-bold bg-neutral-100 text-neutral-600 dark:bg-neutral-800/80 dark:text-neutral-400 px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-700">No</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className="font-semibold text-primary-950 dark:text-white">{breaks.length}</span>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => openEdit(shift)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit">
                                                        <Edit3 size={15} />
                                                    </button>
                                                    <button onClick={() => setDeleteTarget(shift)} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" title="Delete">
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filtered.length === 0 && !isLoading && (
                                    <tr>
                                        <td colSpan={6}>
                                            <EmptyState icon="list" title="No shifts configured" message="Add your first shift to get started." action={{ label: "Add Shift", onClick: openCreate }} />
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
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{editingId ? "Edit Shift" : "Add Shift"}</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-5">
                            {/* Core */}
                            <FormField label="Shift Name" value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} placeholder="e.g. Morning Shift" />
                            <div className="grid grid-cols-3 gap-4">
                                <FormSelect label="Shift Type" value={form.shiftType} onChange={(v) => setForm((p) => ({ ...p, shiftType: v as ShiftType }))} options={SHIFT_TYPE_OPTIONS} />
                                <FormField label="Start Time" value={form.startTime} onChange={(v) => setForm((p) => ({ ...p, startTime: v }))} type="time" />
                                <FormField label="End Time" value={form.endTime} onChange={(v) => setForm((p) => ({ ...p, endTime: v }))} type="time" />
                            </div>
                            <div className="flex gap-6">
                                <FormToggle label="Cross-Day Shift" description="Shift spans midnight" checked={form.isCrossDay} onChange={(v) => setForm((p) => ({ ...p, isCrossDay: v }))} tooltip="Enable for night shifts that span midnight (e.g., 22:00 to 06:00). Attendance date will be the shift start date." />
                                <FormToggle label="No Shuffle" description="Disable auto shift rotation" checked={form.noShuffle} onChange={(v) => setForm((p) => ({ ...p, noShuffle: v }))} />
                            </div>

                            {/* Policy Overrides */}
                            <div className="border-t border-neutral-100 dark:border-neutral-800 pt-5">
                                <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Policy Overrides</p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3 leading-relaxed">Leave fields empty to inherit from company-wide Attendance Rules. Set a value to override for this specific shift.</p>
                                <div className="space-y-2">
                                    <NullableNumberField label="Grace Period" value={form.gracePeriodMinutes} onChange={(v) => setForm((p) => ({ ...p, gracePeriodMinutes: v }))} suffix="min" min={0} max={60} />
                                    <NullableNumberField label="Early Exit Tolerance" value={form.earlyExitToleranceMinutes} onChange={(v) => setForm((p) => ({ ...p, earlyExitToleranceMinutes: v }))} suffix="min" min={0} max={60} />
                                    <NullableNumberField label="Half Day Threshold" value={form.halfDayThresholdHours} onChange={(v) => setForm((p) => ({ ...p, halfDayThresholdHours: v }))} suffix="hrs" min={1} max={12} step={0.5} />
                                    <NullableNumberField label="Full Day Threshold" value={form.fullDayThresholdHours} onChange={(v) => setForm((p) => ({ ...p, fullDayThresholdHours: v }))} suffix="hrs" min={1} max={24} step={0.5} />
                                    <NullableNumberField label="Max Late Check-In" value={form.maxLateCheckInMinutes} onChange={(v) => setForm((p) => ({ ...p, maxLateCheckInMinutes: v }))} suffix="min" min={0} max={480} />
                                    <NullableNumberField label="Min Working Hours for OT" value={form.minWorkingHoursForOT} onChange={(v) => setForm((p) => ({ ...p, minWorkingHoursForOT: v }))} suffix="hrs" min={0} max={24} step={0.5} tooltip="Minimum hours an employee must work in this shift before overtime starts accumulating." />
                                    <NullableNumberField label="Auto Clock-Out After" value={form.autoClockOutMinutes} onChange={(v) => setForm((p) => ({ ...p, autoClockOutMinutes: v }))} suffix="min" min={0} max={480} tooltip="Automatically clock out employees this many minutes after shift end if they haven't punched out." />
                                </div>
                            </div>

                            {/* Capture Overrides */}
                            <div className="border-t border-neutral-100 dark:border-neutral-800 pt-5">
                                <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">Capture Overrides</p>
                                <div className="space-y-3">
                                    <TriStateToggle label="Require Selfie" value={form.requireSelfie} onChange={(v) => setForm((p) => ({ ...p, requireSelfie: v }))} />
                                    <TriStateToggle label="Require GPS" value={form.requireGPS} onChange={(v) => setForm((p) => ({ ...p, requireGPS: v }))} />
                                </div>
                            </div>

                            {/* Break Management (only for existing shifts) */}
                            {editingId && (
                                <div className="border-t border-neutral-100 dark:border-neutral-800 pt-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <Coffee size={14} className="text-primary-600" />
                                            <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Breaks</p>
                                        </div>
                                        <button
                                            onClick={() => { setShowBreakForm(true); setEditingBreakId(null); setBreakForm({ ...EMPTY_BREAK }); }}
                                            className="text-xs font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400"
                                        >
                                            + Add Break
                                        </button>
                                    </div>

                                    {currentBreaks.length > 0 && (
                                        <div className="space-y-2 mb-3">
                                            {currentBreaks.map((brk) => (
                                                <div key={brk.id} className="flex items-center justify-between px-4 py-2.5 rounded-lg border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/50">
                                                    <div className="flex items-center gap-3">
                                                        <Coffee size={12} className="text-neutral-400" />
                                                        <div>
                                                            <p className="text-xs font-bold text-primary-950 dark:text-white">{brk.name}</p>
                                                            <p className="text-[10px] text-neutral-400">
                                                                {brk.type} {brk.startTime ? `at ${brk.startTime}` : ""} / {brk.duration}min / {brk.isPaid ? "Paid" : "Unpaid"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button onClick={() => openEditBreak(brk)} className="p-1 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded">
                                                            <Edit3 size={12} />
                                                        </button>
                                                        <button onClick={() => handleDeleteBreak(brk)} className="p-1 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded">
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {currentBreaks.length === 0 && !showBreakForm && (
                                        <p className="text-xs text-neutral-400 dark:text-neutral-500 italic mb-3">No breaks configured.</p>
                                    )}

                                    {showBreakForm && (
                                        <div className="bg-primary-50/50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-800/50 rounded-xl p-4 space-y-3">
                                            <FormField label="Break Name" value={breakForm.name} onChange={(v) => setBreakForm((p) => ({ ...p, name: v }))} placeholder="e.g. Lunch Break" />
                                            <div className="grid grid-cols-3 gap-3">
                                                <FormSelect label="Type" value={breakForm.type} onChange={(v) => setBreakForm((p) => ({ ...p, type: v as BreakType }))} options={BREAK_TYPE_OPTIONS} />
                                                {breakForm.type === "FIXED" && (
                                                    <FormField label="Start Time" value={breakForm.startTime} onChange={(v) => setBreakForm((p) => ({ ...p, startTime: v }))} type="time" />
                                                )}
                                                <div>
                                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Duration (min)</label>
                                                    <input
                                                        type="number"
                                                        value={breakForm.duration}
                                                        onChange={(e) => setBreakForm((p) => ({ ...p, duration: Number(e.target.value) }))}
                                                        min={1}
                                                        max={120}
                                                        className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                                                    />
                                                </div>
                                            </div>
                                            <FormToggle label="Paid Break" description="Count break time as working hours" checked={breakForm.isPaid} onChange={(v) => setBreakForm((p) => ({ ...p, isPaid: v }))} />
                                            <div className="flex gap-2 pt-1">
                                                <button onClick={() => { setShowBreakForm(false); setEditingBreakId(null); }} className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800">Cancel</button>
                                                <button onClick={handleSaveBreak} disabled={breakSaving} className="px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-bold hover:bg-primary-700 disabled:opacity-50 flex items-center gap-1">
                                                    {breakSaving && <Loader2 size={10} className="animate-spin" />}
                                                    {editingBreakId ? "Update" : "Add"} Break
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
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
                        <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">Delete Shift?</h2>
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

/* ── Tri-State Toggle (null = inherit, true, false) ── */

function TriStateToggle({ label, value, onChange }: {
    label: string; value: boolean | null; onChange: (v: boolean | null) => void;
}) {
    const isInherit = value === null;
    return (
        <div className="flex items-center justify-between px-4 py-3 rounded-lg border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/50">
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <input
                    type="checkbox"
                    checked={isInherit}
                    onChange={(e) => onChange(e.target.checked ? null : false)}
                    className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
                <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">{label}</p>
            </div>
            {isInherit ? (
                <span className="text-[10px] font-medium text-primary-500 ml-3">Use Default</span>
            ) : (
                <button
                    type="button"
                    onClick={() => onChange(!value)}
                    className={cn(
                        "w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ml-3",
                        value ? "bg-success-500" : "bg-neutral-300 dark:bg-neutral-700"
                    )}
                >
                    <div className={cn("w-[14px] h-[14px] rounded-full bg-white absolute top-[3px] transition-all shadow-sm", value ? "left-[18px]" : "left-[3px]")} />
                </button>
            )}
        </div>
    );
}
