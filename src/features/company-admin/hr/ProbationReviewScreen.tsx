import { useState, useMemo } from "react";
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import {
    UserCheck,
    Loader2,
    X,
    Search,
    Star,
    Clock,
    AlertTriangle,
    ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProbationDue } from "@/features/company-admin/api/use-hr-queries";
import { useSubmitProbationReview } from "@/features/company-admin/api/use-hr-mutations";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Atoms ── */

function UrgencyBadge({ daysRemaining }: { daysRemaining: number }) {
    const cls =
        daysRemaining < 7
            ? "bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50"
            : daysRemaining < 15
            ? "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50"
            : daysRemaining < 30
            ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800/50"
            : "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50";
    return (
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", cls)}>
            {daysRemaining < 0 ? `${Math.abs(daysRemaining)}d overdue` : `${daysRemaining}d left`}
        </span>
    );
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => onChange(star)}
                    className="p-0.5 transition-colors"
                >
                    <Star
                        size={24}
                        className={cn(
                            "transition-colors",
                            star <= value
                                ? "text-warning-500 fill-warning-500"
                                : "text-neutral-300 dark:text-neutral-600"
                        )}
                    />
                </button>
            ))}
        </div>
    );
}

/* ── Helpers ── */

function getDaysRemaining(endDate: string): number {
    const end = new Date(endDate);
    const now = new Date();
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getRowUrgencyClass(days: number): string {
    if (days < 7) return "border-l-4 border-l-danger-400";
    if (days < 15) return "border-l-4 border-l-warning-400";
    if (days < 30) return "border-l-4 border-l-yellow-400";
    return "";
}

function displayRef(value: unknown): string {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value === "object") {
        const v = value as { name?: unknown; code?: unknown; id?: unknown; title?: unknown };
        if (typeof v.name === "string") return v.name;
        if (typeof v.title === "string") return v.title;
        if (typeof v.code === "string") return v.code;
        if (typeof v.id === "string") return v.id;
    }
    return String(value);
}

const DECISIONS = [
    { value: "CONFIRM", label: "Confirm" },
    { value: "EXTEND", label: "Extend Probation" },
    { value: "TERMINATE", label: "Terminate" },
];

/* ── Screen ── */

export function ProbationReviewScreen() {
    const fmt = useCompanyFormatter();
    const [search, setSearch] = useState("");
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState("");
    const [decision, setDecision] = useState("");
    const [extensionMonths, setExtensionMonths] = useState("3");

    const { data, isLoading, isError } = useProbationDue();
    const submitMutation = useSubmitProbationReview();

    const employees: any[] = (data as any)?.data ?? [];

    const filtered = useMemo(() => {
        if (!search) return employees;
        const s = search.toLowerCase();
        return employees.filter((e: any) =>
            displayRef(e.name).toLowerCase().includes(s) ||
            displayRef(e.employeeId).toLowerCase().includes(s) ||
            displayRef(e.department).toLowerCase().includes(s) ||
            displayRef(e.designation).toLowerCase().includes(s)
        );
    }, [employees, search]);

    const openReview = (emp: any) => {
        setSelectedEmployee(emp);
        setRating(0);
        setFeedback("");
        setDecision("");
        setExtensionMonths("3");
        setReviewModalOpen(true);
    };

    const handleSubmit = async () => {
        if (!selectedEmployee || !decision || rating === 0) return;
        try {
            await submitMutation.mutateAsync({
                id: selectedEmployee.id,
                data: {
                    rating,
                    feedback,
                    decision,
                    extensionMonths: decision === "EXTEND" ? Number(extensionMonths) : undefined,
                },
            });
            showSuccess("Review Submitted", `Probation review for ${displayRef(selectedEmployee.name) || "employee"} has been submitted.`);
            setReviewModalOpen(false);
        } catch (err) {
            showApiError(err);
        }
    };

    const dueCount = employees.length;
    const urgentCount = employees.filter((e: any) => getDaysRemaining(e.probationEndDate ?? e.probationEnd) < 7).length;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Probation Reviews</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                        {dueCount} employee{dueCount !== 1 ? "s" : ""} due for review
                        {urgentCount > 0 && (
                            <span className="text-danger-500 font-semibold ml-2">
                                ({urgentCount} urgent)
                            </span>
                        )}
                    </p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                            <UserCheck className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-primary-950 dark:text-white">{dueCount}</p>
                            <p className="text-xs text-neutral-500">Total Due</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-danger-50 dark:bg-danger-900/30 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-danger-600 dark:text-danger-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-danger-600 dark:text-danger-400">{urgentCount}</p>
                            <p className="text-xs text-neutral-500">{"< 7 Days"}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-warning-50 dark:bg-warning-900/30 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-warning-600 dark:text-warning-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-warning-600 dark:text-warning-400">
                                {employees.filter((e: any) => { const d = getDaysRemaining(e.probationEndDate ?? e.probationEnd); return d >= 7 && d < 30; }).length}
                            </p>
                            <p className="text-xs text-neutral-500">{"< 30 Days"}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                    <input
                        type="text"
                        placeholder="Search by name, ID, department..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                    />
                </div>
            </div>

            {isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
                    Failed to load probation data. Please try again.
                </div>
            )}

            {/* Data Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? (
                    <SkeletonTable rows={6} cols={6} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Employee</th>
                                    <th className="py-4 px-6 font-bold">Employee ID</th>
                                    <th className="py-4 px-6 font-bold">Department</th>
                                    <th className="py-4 px-6 font-bold">Designation</th>
                                    <th className="py-4 px-6 font-bold">Probation Ends</th>
                                    <th className="py-4 px-6 font-bold text-center">Urgency</th>
                                    <th className="py-4 px-6 font-bold text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.map((e: any) => {
                                    const days = getDaysRemaining(e.probationEndDate ?? e.probationEnd);
                                    return (
                                        <tr
                                            key={e.id}
                                            className={cn(
                                                "border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors",
                                                getRowUrgencyClass(days)
                                            )}
                                        >
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                                                        <span className="text-xs font-bold text-primary-700 dark:text-primary-400">
                                                            {(displayRef(e.name) || "?")[0]?.toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <span className="font-bold text-primary-950 dark:text-white">{displayRef(e.name) || "—"}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 font-mono text-xs text-neutral-600 dark:text-neutral-400">{displayRef(e.employeeId) || "—"}</td>
                                            <td className="py-4 px-6 text-neutral-700 dark:text-neutral-300 text-xs">{displayRef(e.department) || "—"}</td>
                                            <td className="py-4 px-6 text-neutral-700 dark:text-neutral-300 text-xs">{displayRef(e.designation) || "—"}</td>
                                            <td className="py-4 px-6 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                                                {(e.probationEndDate ?? e.probationEnd) ? fmt.date(e.probationEndDate ?? e.probationEnd) : "—"}
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <UrgencyBadge daysRemaining={days} />
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <button
                                                    onClick={() => openReview(e)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs font-bold hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
                                                >
                                                    Review
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filtered.length === 0 && !isLoading && (
                                    <tr>
                                        <td colSpan={7}>
                                            <EmptyState icon="list" title="No probation reviews due" message="All employees have been reviewed or none are on probation." />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Review Modal ── */}
            {reviewModalOpen && selectedEmployee && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">Probation Review</h2>
                            <button onClick={() => setReviewModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-5">
                            {/* Employee Info */}
                            <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-4">
                                <p className="font-bold text-primary-950 dark:text-white">{displayRef(selectedEmployee.name) || "—"}</p>
                                <p className="text-xs text-neutral-500 mt-0.5">{displayRef(selectedEmployee.employeeId) || "—"} &middot; {displayRef(selectedEmployee.department) || "—"} &middot; {displayRef(selectedEmployee.designation) || "—"}</p>
                            </div>

                            {/* Rating */}
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
                                    Performance Rating <span className="text-danger-500">*</span>
                                </label>
                                <StarRating value={rating} onChange={setRating} />
                            </div>

                            {/* Feedback */}
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                                    Feedback
                                </label>
                                <textarea
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    placeholder="Enter review feedback..."
                                    rows={4}
                                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none"
                                />
                            </div>

                            {/* Decision */}
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                                    Decision <span className="text-danger-500">*</span>
                                </label>
                                <select
                                    value={decision}
                                    onChange={(e) => setDecision(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                                >
                                    <option value="">Select decision...</option>
                                    {DECISIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                                </select>
                            </div>

                            {/* Extension Months */}
                            {decision === "EXTEND" && (
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                                        Extension Period (months)
                                    </label>
                                    <select
                                        value={extensionMonths}
                                        onChange={(e) => setExtensionMonths(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                                    >
                                        {[1, 2, 3, 6].map((m) => <option key={m} value={String(m)}>{m} month{m > 1 ? "s" : ""}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setReviewModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button
                                onClick={handleSubmit}
                                disabled={submitMutation.isPending || !decision || rating === 0}
                                className={cn(
                                    "flex-1 py-2.5 rounded-xl text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2",
                                    decision === "TERMINATE" ? "bg-danger-600 hover:bg-danger-700" : "bg-primary-600 hover:bg-primary-700"
                                )}
                            >
                                {submitMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                {submitMutation.isPending ? "Submitting..." : "Submit Review"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
