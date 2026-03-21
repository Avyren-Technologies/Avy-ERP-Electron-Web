import { useState } from "react";
import {
    Clock,
    Plus,
    Edit3,
    Trash2,
    Loader2,
    X,
    Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompanyShifts } from "@/features/company-admin/api/use-company-admin-queries";
import { useCreateShift, useUpdateShift, useDeleteShift } from "@/features/company-admin/api/use-company-admin-mutations";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

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

const EMPTY_SHIFT = {
    name: "",
    fromTime: "",
    toTime: "",
    noShuffle: false,
    downtimeSlots: [] as Array<{ type: string; duration: string }>,
};

export function ShiftManagementScreen() {
    const { data, isLoading, isError } = useCompanyShifts();
    const createMutation = useCreateShift();
    const updateMutation = useUpdateShift();
    const deleteMutation = useDeleteShift();

    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...EMPTY_SHIFT });
    const [deleteTarget, setDeleteTarget] = useState<any>(null);

    const shifts: any[] = data?.data ?? [];
    const filtered = shifts.filter((s: any) => {
        if (!search) return true;
        return s.name?.toLowerCase().includes(search.toLowerCase());
    });

    const openCreate = () => {
        setEditingId(null);
        setForm({ ...EMPTY_SHIFT });
        setModalOpen(true);
    };

    const openEdit = (shift: any) => {
        setEditingId(shift.id);
        setForm({
            name: shift.name ?? "",
            fromTime: shift.fromTime ?? shift.startTime ?? "",
            toTime: shift.toTime ?? shift.endTime ?? "",
            noShuffle: shift.noShuffle ?? false,
            downtimeSlots: shift.downtimeSlots ?? [],
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        try {
            if (editingId) {
                await updateMutation.mutateAsync({ id: editingId, data: form });
                showSuccess("Shift Updated", `${form.name} has been updated.`);
            } else {
                await createMutation.mutateAsync(form);
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

    const saving = createMutation.isPending || updateMutation.isPending;

    const addDowntimeSlot = () => {
        setForm((p) => ({
            ...p,
            downtimeSlots: [...p.downtimeSlots, { type: "", duration: "" }],
        }));
    };

    const updateSlot = (index: number, key: string, value: string) => {
        setForm((p) => {
            const slots = [...p.downtimeSlots];
            slots[index] = { ...slots[index], [key]: value };
            return { ...p, downtimeSlots: slots };
        });
    };

    const removeSlot = (index: number) => {
        setForm((p) => ({
            ...p,
            downtimeSlots: p.downtimeSlots.filter((_, i) => i !== index),
        }));
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Shifts</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Configure work shifts and downtime slots</p>
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
                    <SkeletonTable rows={5} cols={5} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Name</th>
                                    <th className="py-4 px-6 font-bold">From Time</th>
                                    <th className="py-4 px-6 font-bold">To Time</th>
                                    <th className="py-4 px-6 font-bold text-center">No Shuffle</th>
                                    <th className="py-4 px-6 font-bold text-center">Downtime Slots</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.map((shift: any) => {
                                    const slots = (shift.downtimeSlots as any[] | null) ?? [];
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
                                            <td className="py-4 px-6 font-mono text-sm text-neutral-700 dark:text-neutral-300">{shift.fromTime}</td>
                                            <td className="py-4 px-6 font-mono text-sm text-neutral-700 dark:text-neutral-300">{shift.toTime}</td>
                                            <td className="py-4 px-6 text-center">
                                                {shift.noShuffle ? (
                                                    <span className="text-[10px] font-bold bg-warning-50 text-warning-700 px-2 py-0.5 rounded border border-warning-100 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50">Yes</span>
                                                ) : (
                                                    <span className="text-neutral-300 dark:text-neutral-600">\u2014</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className="font-semibold text-primary-950 dark:text-white">{slots.length}</span>
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
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{editingId ? "Edit Shift" : "Add Shift"}</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <FormField label="Shift Name" value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} placeholder="e.g. Morning Shift" />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="From Time" value={form.fromTime} onChange={(v) => setForm((p) => ({ ...p, fromTime: v }))} type="time" />
                                <FormField label="To Time" value={form.toTime} onChange={(v) => setForm((p) => ({ ...p, toTime: v }))} type="time" />
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setForm((p) => ({ ...p, noShuffle: !p.noShuffle }))}
                                    className={cn(
                                        "w-10 h-6 rounded-full transition-colors relative",
                                        form.noShuffle ? "bg-primary-600" : "bg-neutral-300 dark:bg-neutral-700"
                                    )}
                                >
                                    <div className={cn("w-4 h-4 rounded-full bg-white absolute top-1 transition-all", form.noShuffle ? "left-5" : "left-1")} />
                                </button>
                                <span className="text-sm font-medium text-primary-950 dark:text-white">No Shuffle</span>
                            </div>

                            {/* Downtime Slots */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Downtime Slots</label>
                                    <button onClick={addDowntimeSlot} className="text-xs font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400">+ Add Slot</button>
                                </div>
                                {form.downtimeSlots.map((slot, i) => (
                                    <div key={i} className="flex items-center gap-2 mb-2">
                                        <input
                                            type="text"
                                            value={slot.type}
                                            onChange={(e) => updateSlot(i, "type", e.target.value)}
                                            placeholder="Type (e.g. Lunch)"
                                            className="flex-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm dark:text-white"
                                        />
                                        <input
                                            type="text"
                                            value={slot.duration}
                                            onChange={(e) => updateSlot(i, "duration", e.target.value)}
                                            placeholder="Duration"
                                            className="w-28 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm dark:text-white"
                                        />
                                        <button onClick={() => removeSlot(i)} className="p-1.5 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg">
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                                {form.downtimeSlots.length === 0 && (
                                    <p className="text-xs text-neutral-400 dark:text-neutral-500 italic">No downtime slots configured.</p>
                                )}
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
