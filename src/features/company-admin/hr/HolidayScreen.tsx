import { useState } from "react";
import {
    CalendarDays,
    Plus,
    Edit3,
    Trash2,
    Loader2,
    X,
    Search,
    Copy,
    AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHolidays } from "@/features/company-admin/api/use-attendance-queries";
import {
    useCreateHoliday,
    useUpdateHoliday,
    useDeleteHoliday,
    useCloneHolidays,
} from "@/features/company-admin/api/use-attendance-mutations";
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
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>
        </div>
    );
}

function TypeBadge({ type }: { type: string }) {
    const t = type?.toLowerCase();
    const cls =
        t === "national" || t === "gazetted"
            ? "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50"
            : t === "restricted" || t === "optional"
            ? "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50"
            : t === "company"
            ? "bg-accent-50 text-accent-700 border-accent-200 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50"
            : "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700";
    return (
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", cls)}>
            {type}
        </span>
    );
}

function CheckBadge({ checked }: { checked: boolean }) {
    return (
        <span className={cn(
            "text-[10px] font-bold px-2 py-0.5 rounded-full border",
            checked
                ? "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50"
                : "bg-neutral-100 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700"
        )}>
            {checked ? "Yes" : "No"}
        </span>
    );
}

/* ── Constants ── */

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

const EMPTY_HOLIDAY = {
    name: "",
    date: "",
    type: "National",
    branchScope: "All",
    optional: false,
};

const HOLIDAY_TYPES = [
    { value: "National", label: "National" },
    { value: "Gazetted", label: "Gazetted" },
    { value: "Restricted", label: "Restricted" },
    { value: "Optional", label: "Optional" },
    { value: "Company", label: "Company" },
];

/* ── Screen ── */

export function HolidayScreen() {
    const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [cloneModalOpen, setCloneModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...EMPTY_HOLIDAY });
    const [deleteTarget, setDeleteTarget] = useState<any>(null);
    const [cloneFrom, setCloneFrom] = useState(String(CURRENT_YEAR));
    const [cloneTo, setCloneTo] = useState(String(CURRENT_YEAR + 1));

    const { data, isLoading, isError } = useHolidays({ year: selectedYear });
    const createMutation = useCreateHoliday();
    const updateMutation = useUpdateHoliday();
    const deleteMutation = useDeleteHoliday();
    const cloneMutation = useCloneHolidays();

    const holidays: any[] = (data as any)?.data ?? [];

    const filtered = holidays.filter((h: any) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return h.name?.toLowerCase().includes(s) || h.type?.toLowerCase().includes(s);
    });

    const openCreate = () => {
        setEditingId(null);
        setForm({ ...EMPTY_HOLIDAY });
        setModalOpen(true);
    };

    const openEdit = (holiday: any) => {
        setEditingId(holiday.id);
        setForm({
            name: holiday.name ?? "",
            date: holiday.date ?? "",
            type: holiday.type ?? "National",
            branchScope: holiday.branchScope ?? "All",
            optional: holiday.optional ?? false,
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        try {
            if (editingId) {
                await updateMutation.mutateAsync({ id: editingId, data: { ...form, year: selectedYear } });
                showSuccess("Holiday Updated", `${form.name} has been updated.`);
            } else {
                await createMutation.mutateAsync({ ...form, year: selectedYear });
                showSuccess("Holiday Created", `${form.name} has been added.`);
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
            showSuccess("Holiday Deleted", `${deleteTarget.name} has been removed.`);
            setDeleteTarget(null);
        } catch (err) {
            showApiError(err);
        }
    };

    const handleClone = async () => {
        try {
            await cloneMutation.mutateAsync({ fromYear: Number(cloneFrom), toYear: Number(cloneTo) });
            showSuccess("Holidays Cloned", `Holidays cloned from ${cloneFrom} to ${cloneTo}.`);
            setCloneModalOpen(false);
            setSelectedYear(Number(cloneTo));
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
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Holidays</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Manage company holiday calendar</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setCloneModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                        <Copy className="w-4 h-4" />
                        Clone Year
                    </button>
                    <button
                        onClick={openCreate}
                        className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
                    >
                        <Plus className="w-5 h-5" />
                        Add Holiday
                    </button>
                </div>
            </div>

            {/* Year Tabs */}
            <div className="flex gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl w-fit">
                {YEARS.map((year) => (
                    <button
                        key={year}
                        onClick={() => setSelectedYear(year)}
                        className={cn(
                            "px-5 py-2 rounded-lg text-sm font-bold transition-all",
                            selectedYear === year
                                ? "bg-white dark:bg-neutral-700 text-primary-700 dark:text-primary-400 shadow-sm"
                                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
                        )}
                    >
                        {year}
                    </button>
                ))}
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                    <input
                        type="text"
                        placeholder="Search holidays..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                    />
                </div>
            </div>

            {isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
                    Failed to load holidays. Please try again.
                </div>
            )}

            {/* Data Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? (
                    <SkeletonTable rows={6} cols={6} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[850px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Name</th>
                                    <th className="py-4 px-6 font-bold">Date</th>
                                    <th className="py-4 px-6 font-bold text-center">Type</th>
                                    <th className="py-4 px-6 font-bold">Branch Scope</th>
                                    <th className="py-4 px-6 font-bold text-center">Optional</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.map((h: any) => (
                                    <tr
                                        key={h.id}
                                        className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors"
                                    >
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                                                    <CalendarDays className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                                </div>
                                                <span className="font-bold text-primary-950 dark:text-white">{h.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                                            {h.date ? new Date(h.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "\u2014"}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <TypeBadge type={h.type ?? "National"} />
                                        </td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">{h.branchScope ?? "All"}</td>
                                        <td className="py-4 px-6 text-center">
                                            <CheckBadge checked={h.optional ?? false} />
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => openEdit(h)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit">
                                                    <Edit3 size={15} />
                                                </button>
                                                <button onClick={() => setDeleteTarget(h)} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" title="Delete">
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && !isLoading && (
                                    <tr>
                                        <td colSpan={6}>
                                            <EmptyState icon="list" title="No holidays found" message={`Add holidays for ${selectedYear} to get started.`} action={{ label: "Add Holiday", onClick: openCreate }} />
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
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{editingId ? "Edit Holiday" : "Add Holiday"}</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <FormField label="Holiday Name" value={form.name} onChange={(v) => updateField("name", v)} placeholder="e.g. Republic Day" />
                            <FormField label="Date" value={form.date} onChange={(v) => updateField("date", v)} type="date" />
                            <SelectField
                                label="Type"
                                value={form.type}
                                onChange={(v) => updateField("type", v)}
                                options={HOLIDAY_TYPES}
                            />
                            <FormField label="Branch Scope" value={form.branchScope} onChange={(v) => updateField("branchScope", v)} placeholder="All, or specific branch names" />
                            <div className="flex items-center justify-between px-1">
                                <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Optional Holiday</label>
                                <button
                                    type="button"
                                    onClick={() => updateField("optional", !form.optional)}
                                    className={cn(
                                        "w-11 h-6 rounded-full transition-colors relative flex-shrink-0",
                                        form.optional ? "bg-success-500" : "bg-neutral-300 dark:bg-neutral-700"
                                    )}
                                >
                                    <div className={cn("w-[18px] h-[18px] rounded-full bg-white absolute top-[3px] transition-all shadow-sm", form.optional ? "left-[22px]" : "left-[3px]")} />
                                </button>
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

            {/* ── Clone Modal ── */}
            {cloneModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">Clone Holidays</h2>
                            <button onClick={() => setCloneModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <SelectField
                                label="From Year"
                                value={cloneFrom}
                                onChange={setCloneFrom}
                                options={YEARS.map((y) => ({ value: String(y), label: String(y) }))}
                            />
                            <SelectField
                                label="To Year"
                                value={cloneTo}
                                onChange={setCloneTo}
                                options={YEARS.map((y) => ({ value: String(y), label: String(y) }))}
                            />
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setCloneModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleClone} disabled={cloneMutation.isPending} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {cloneMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                {cloneMutation.isPending ? "Cloning..." : "Clone"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Confirmation ── */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">Delete Holiday?</h2>
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
