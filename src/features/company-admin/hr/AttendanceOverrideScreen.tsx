import { useState } from "react";
import {
    FileEdit,
    Plus,
    Loader2,
    X,
    Search,
    CheckCircle,
    XCircle,
    Clock,
    ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAttendanceOverrides } from "@/features/company-admin/api/use-attendance-queries";
import {
    useCreateAttendanceOverride,
    useUpdateAttendanceOverride,
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

function TextareaField({
    label,
    value,
    onChange,
    placeholder,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
}) {
    return (
        <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                {label}
            </label>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={3}
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none"
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

function StatusBadge({ status }: { status: string }) {
    const s = status?.toLowerCase();
    const cls =
        s === "approved"
            ? "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50"
            : s === "rejected"
            ? "bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50"
            : s === "pending"
            ? "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50"
            : "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700";
    return (
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", cls)}>
            {status}
        </span>
    );
}

/* ── Constants ── */

const TABS = ["All", "Pending", "Approved", "Rejected"] as const;
type TabValue = (typeof TABS)[number];

const ISSUE_TYPES = [
    { value: "Missing Punch-In", label: "Missing Punch-In" },
    { value: "Missing Punch-Out", label: "Missing Punch-Out" },
    { value: "Wrong Time", label: "Wrong Time" },
    { value: "System Error", label: "System Error" },
    { value: "Late Regularization", label: "Late Regularization" },
    { value: "Other", label: "Other" },
];

const EMPTY_OVERRIDE = {
    employeeName: "",
    employeeCode: "",
    date: "",
    issueType: "",
    correctedPunchIn: "",
    correctedPunchOut: "",
    reason: "",
};

/* ── Screen ── */

export function AttendanceOverrideScreen() {
    const [tab, setTab] = useState<TabValue>("All");
    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState({ ...EMPTY_OVERRIDE });

    const statusFilter = tab === "All" ? undefined : tab;
    const { data, isLoading, isError } = useAttendanceOverrides({ status: statusFilter });
    const createMutation = useCreateAttendanceOverride();
    const updateMutation = useUpdateAttendanceOverride();

    const overrides: any[] = (data as any)?.data ?? [];

    const filtered = overrides.filter((o: any) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
            o.employeeName?.toLowerCase().includes(s) ||
            o.employeeCode?.toLowerCase().includes(s) ||
            o.issueType?.toLowerCase().includes(s)
        );
    });

    const openCreate = () => {
        setForm({ ...EMPTY_OVERRIDE });
        setModalOpen(true);
    };

    const handleCreate = async () => {
        try {
            await createMutation.mutateAsync(form);
            showSuccess("Override Created", "Attendance override request submitted.");
            setModalOpen(false);
        } catch (err) {
            showApiError(err);
        }
    };

    const handleAction = async (id: string, action: "Approved" | "Rejected") => {
        try {
            await updateMutation.mutateAsync({ id, data: { status: action } });
            showSuccess(
                `Override ${action}`,
                `The attendance override has been ${action.toLowerCase()}.`
            );
        } catch (err) {
            showApiError(err);
        }
    };

    const updateField = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Attendance Overrides</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Review and manage attendance correction requests</p>
                </div>
                <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
                >
                    <Plus className="w-5 h-5" />
                    New Override
                </button>
            </div>

            {/* Tab Filter */}
            <div className="flex gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl w-fit">
                {TABS.map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={cn(
                            "px-5 py-2 rounded-lg text-sm font-bold transition-all",
                            tab === t
                                ? "bg-white dark:bg-neutral-700 text-primary-700 dark:text-primary-400 shadow-sm"
                                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
                        )}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                    <input
                        type="text"
                        placeholder="Search overrides..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                    />
                </div>
            </div>

            {isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
                    Failed to load overrides. Please try again.
                </div>
            )}

            {/* Data Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? (
                    <SkeletonTable rows={6} cols={7} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1050px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Employee</th>
                                    <th className="py-4 px-6 font-bold">Date</th>
                                    <th className="py-4 px-6 font-bold">Issue Type</th>
                                    <th className="py-4 px-6 font-bold">Corrected Times</th>
                                    <th className="py-4 px-6 font-bold">Reason</th>
                                    <th className="py-4 px-6 font-bold text-center">Status</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.map((o: any) => (
                                    <tr
                                        key={o.id}
                                        className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors"
                                    >
                                        <td className="py-4 px-6">
                                            <div>
                                                <span className="font-bold text-primary-950 dark:text-white">{o.employeeName ?? "\u2014"}</span>
                                                {o.employeeCode && (
                                                    <span className="block text-[11px] font-mono text-neutral-400 dark:text-neutral-500 mt-0.5">{o.employeeCode}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                                            {o.date ? new Date(o.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "\u2014"}
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-lg">
                                                {o.issueType ?? "\u2014"}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                                                <Clock size={12} className="text-neutral-400" />
                                                {o.correctedPunchIn ?? "\u2014"} &ndash; {o.correctedPunchOut ?? "\u2014"}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 max-w-[200px] truncate">{o.reason ?? "\u2014"}</td>
                                        <td className="py-4 px-6 text-center">
                                            <StatusBadge status={o.status ?? "Pending"} />
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            {(o.status?.toLowerCase() === "pending") ? (
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => handleAction(o.id, "Approved")}
                                                        disabled={updateMutation.isPending}
                                                        className="p-2 text-success-600 dark:text-success-400 hover:bg-success-50 dark:hover:bg-success-900/20 rounded-lg transition-colors"
                                                        title="Approve"
                                                    >
                                                        <CheckCircle size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(o.id, "Rejected")}
                                                        disabled={updateMutation.isPending}
                                                        className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors"
                                                        title="Reject"
                                                    >
                                                        <XCircle size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-neutral-400">\u2014</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && !isLoading && (
                                    <tr>
                                        <td colSpan={7}>
                                            <EmptyState
                                                icon="inbox"
                                                title="No overrides found"
                                                message={tab === "All" ? "No attendance override requests yet." : `No ${tab.toLowerCase()} overrides.`}
                                                action={tab === "All" ? { label: "New Override", onClick: openCreate } : undefined}
                                            />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Create Modal ── */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">New Override Request</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="Employee Name" value={form.employeeName} onChange={(v) => updateField("employeeName", v)} placeholder="Full name" />
                                <FormField label="Employee Code" value={form.employeeCode} onChange={(v) => updateField("employeeCode", v)} placeholder="e.g. EMP001" />
                            </div>
                            <FormField label="Date" value={form.date} onChange={(v) => updateField("date", v)} type="date" />
                            <SelectField
                                label="Issue Type"
                                value={form.issueType}
                                onChange={(v) => updateField("issueType", v)}
                                options={ISSUE_TYPES}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="Corrected Punch-In" value={form.correctedPunchIn} onChange={(v) => updateField("correctedPunchIn", v)} type="time" />
                                <FormField label="Corrected Punch-Out" value={form.correctedPunchOut} onChange={(v) => updateField("correctedPunchOut", v)} type="time" />
                            </div>
                            <TextareaField label="Reason" value={form.reason} onChange={(v) => updateField("reason", v)} placeholder="Explain the reason for the override..." />
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleCreate} disabled={createMutation.isPending} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {createMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                {createMutation.isPending ? "Submitting..." : "Submit"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
