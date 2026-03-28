import { useState } from "react";
import {
    Star,
    Search,
    Filter,
    Loader2,
    X,
    Send,
    User,
    Grid3X3,
    Table,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppraisalEntries, useCalibrationData, useAppraisalCycles } from "@/features/company-admin/api/use-performance-queries";
import { useEmployees } from "@/features/company-admin/api/use-hr-queries";
import {
    useSubmitSelfReview,
    useSubmitManagerReview,
    usePublishAppraisalEntry,
    useUpdateAppraisalEntry,
} from "@/features/company-admin/api/use-performance-mutations";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Constants ── */

const STATUS_FILTERS = ["All", "Pending", "Self Review", "Manager Review", "Calibration", "Published"];

const NINE_BOX_LABELS: Record<string, { label: string; color: string }> = {
    "3-3": { label: "Star", color: "bg-success-500" },
    "3-2": { label: "Growth Engine", color: "bg-success-400" },
    "3-1": { label: "Rough Diamond", color: "bg-primary-400" },
    "2-3": { label: "High Performer", color: "bg-success-300" },
    "2-2": { label: "Core Player", color: "bg-primary-300" },
    "2-1": { label: "Inconsistent Talent", color: "bg-warning-400" },
    "1-3": { label: "Solid Professional", color: "bg-primary-200" },
    "1-2": { label: "Effective", color: "bg-warning-300" },
    "1-1": { label: "Risk", color: "bg-danger-400" },
};

/* ── Helpers ── */

function StatusBadge({ status }: { status: string }) {
    const s = status?.toLowerCase().replace(/\s+/g, "_");
    const map: Record<string, string> = {
        pending: "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700",
        self_review: "bg-info-50 text-info-700 border-info-200 dark:bg-info-900/20 dark:text-info-400 dark:border-info-800/50",
        manager_review: "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50",
        calibration: "bg-accent-50 text-accent-700 border-accent-200 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50",
        published: "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50",
    };
    return <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize", map[s] ?? map.pending)}>{status}</span>;
}

function RatingDisplay({ value, scale = 5 }: { value?: number; scale?: number }) {
    if (!value) return <span className="text-xs text-neutral-400">—</span>;
    const pct = (value / scale) * 100;
    const color = pct >= 80 ? "text-success-600 dark:text-success-400" : pct >= 60 ? "text-primary-600 dark:text-primary-400" : pct >= 40 ? "text-warning-600 dark:text-warning-400" : "text-danger-600 dark:text-danger-400";
    return (
        <div className="flex items-center gap-1.5">
            <Star size={12} className={cn(color, "fill-current")} />
            <span className={cn("text-sm font-bold", color)}>{Number(value).toFixed(1)}</span>
            <span className="text-[10px] text-neutral-400">/{scale}</span>
        </div>
    );
}

function SectionLabel({ title }: { title: string }) {
    return (
        <div className="pt-3 pb-1">
            <h3 className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider">{title}</h3>
            <div className="h-px bg-primary-100 dark:bg-primary-900/30 mt-1.5" />
        </div>
    );
}

/* ── Screen ── */

export function RatingsScreen() {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [cycleFilter, setCycleFilter] = useState("");
    const [viewMode, setViewMode] = useState<"table" | "calibration">("table");
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [reviewType, setReviewType] = useState<"self" | "manager">("self");
    const [selectedEntry, setSelectedEntry] = useState<any>(null);
    const [reviewForm, setReviewForm] = useState({ rating: 3, kraScore: 3, competencyScore: 3, comments: "" });

    const params: Record<string, unknown> = {};
    if (statusFilter !== "All") params.status = statusFilter.toLowerCase().replace(/\s+/g, "_");
    if (cycleFilter) params.cycleId = cycleFilter;

    const { data, isLoading, isError } = useAppraisalEntries(Object.keys(params).length ? params : undefined);
    const cyclesQuery = useAppraisalCycles();
    const employeesQuery = useEmployees();
    const calibrationQuery = useCalibrationData(cycleFilter);

    const selfReviewMutation = useSubmitSelfReview();
    const managerReviewMutation = useSubmitManagerReview();
    const publishMutation = usePublishAppraisalEntry();
    const updateMutation = useUpdateAppraisalEntry();

    const entries: any[] = data?.data ?? [];
    const cycles: any[] = cyclesQuery.data?.data ?? [];
    const employees: any[] = employeesQuery.data?.data ?? [];
    const calibrationData: any = calibrationQuery.data?.data ?? null;

    const employeeName = (id: string) => {
        const emp = employees.find((e: any) => e.id === id);
        if (!emp) return id || "—";
        return [emp.firstName, emp.lastName].filter(Boolean).join(" ") || emp.fullName || emp.email || id;
    };

    const filtered = entries.filter((e: any) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return employeeName(e.employeeId)?.toLowerCase().includes(s);
    });

    const openReview = (entry: any, type: "self" | "manager") => {
        setSelectedEntry(entry);
        setReviewType(type);
        setReviewForm({
            rating: entry[type === "self" ? "selfRating" : "managerRating"] ?? 3,
            kraScore: entry[type === "self" ? "selfKraScore" : "managerKraScore"] ?? 3,
            competencyScore: entry[type === "self" ? "selfCompetencyScore" : "managerCompetencyScore"] ?? 3,
            comments: entry[type === "self" ? "selfComments" : "managerComments"] ?? "",
        });
        setReviewModalOpen(true);
    };

    const handleSubmitReview = async () => {
        if (!selectedEntry) return;
        try {
            const mutation = reviewType === "self" ? selfReviewMutation : managerReviewMutation;
            await mutation.mutateAsync({ id: selectedEntry.id, data: reviewForm });
            showSuccess(
                reviewType === "self" ? "Self Review Submitted" : "Manager Review Submitted",
                `Review for ${employeeName(selectedEntry.employeeId)} has been submitted.`
            );
            setReviewModalOpen(false);
        } catch (err) {
            showApiError(err);
        }
    };

    const handlePublish = async (entry: any) => {
        try {
            await publishMutation.mutateAsync(entry.id);
            showSuccess("Entry Published", `Appraisal for ${employeeName(entry.employeeId)} has been published.`);
        } catch (err) { showApiError(err); }
    };

    const handleInlineRatingUpdate = async (entry: any, field: string, value: number) => {
        try {
            await updateMutation.mutateAsync({ id: entry.id, data: { [field]: value } });
            showSuccess("Rating Updated", "Calibration adjustment saved.");
        } catch (err) { showApiError(err); }
    };

    const saving = selfReviewMutation.isPending || managerReviewMutation.isPending;

    // Build 9-box grid data
    const buildNineBox = () => {
        if (calibrationData?.grid) return calibrationData.grid;
        const grid: Record<string, any[]> = {};
        for (let p = 1; p <= 3; p++) {
            for (let perf = 1; perf <= 3; perf++) {
                grid[`${p}-${perf}`] = [];
            }
        }
        const ratedEntries = filtered.filter((e: any) => e.selfRating && e.managerRating);
        const scale = cycles.find((c: any) => c.id === cycleFilter)?.ratingScale ?? 5;
        ratedEntries.forEach((e: any) => {
            const selfBucket = Math.min(3, Math.max(1, Math.ceil((e.selfRating / scale) * 3)));
            const mgrBucket = Math.min(3, Math.max(1, Math.ceil((e.managerRating / scale) * 3)));
            const key = `${selfBucket}-${mgrBucket}`;
            if (grid[key]) grid[key].push(e);
        });
        return grid;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Ratings & Calibration</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Review appraisal entries, submit ratings, and calibrate across the organization</p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                    <input type="text" placeholder="Search employees..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                </div>
                <div className="flex items-center gap-3 overflow-x-auto pb-1 lg:pb-0">
                    <div className="flex items-center gap-2">
                        <Filter size={14} className="text-neutral-400 shrink-0" />
                        <select value={cycleFilter} onChange={(e) => setCycleFilter(e.target.value)} className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-semibold text-neutral-700 dark:text-neutral-300 focus:outline-none">
                            <option value="">All Cycles</option>
                            {cycles.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-1 border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
                        <button onClick={() => setViewMode("table")} className={cn("px-3 py-1.5 text-xs font-bold transition-colors flex items-center gap-1", viewMode === "table" ? "bg-primary-600 text-white" : "text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800")}><Table size={12} /> Table</button>
                        <button onClick={() => setViewMode("calibration")} className={cn("px-3 py-1.5 text-xs font-bold transition-colors flex items-center gap-1", viewMode === "calibration" ? "bg-primary-600 text-white" : "text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800")}><Grid3X3 size={12} /> 9-Box</button>
                    </div>
                    <div className="flex items-center gap-1">
                        {STATUS_FILTERS.map((f) => (
                            <button key={f} onClick={() => setStatusFilter(f)} className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all whitespace-nowrap", statusFilter === f ? "bg-primary-50 text-primary-700 border-primary-300 dark:bg-primary-900/30 dark:text-primary-400 dark:border-primary-700" : "bg-neutral-50 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700")}>
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">Failed to load appraisal entries.</div>
            )}

            {/* Table View */}
            {viewMode === "table" && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                    {isLoading ? <SkeletonTable rows={6} cols={8} /> : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[1100px]">
                                <thead>
                                    <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                        <th className="py-4 px-6 font-bold">Employee</th>
                                        <th className="py-4 px-6 font-bold">Cycle</th>
                                        <th className="py-4 px-6 font-bold text-center">Self Rating</th>
                                        <th className="py-4 px-6 font-bold text-center">Manager Rating</th>
                                        <th className="py-4 px-6 font-bold text-center">Final Rating</th>
                                        <th className="py-4 px-6 font-bold text-center">KRA Score</th>
                                        <th className="py-4 px-6 font-bold text-center">Status</th>
                                        <th className="py-4 px-6 font-bold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {filtered.map((e: any) => {
                                        const cycleName = cycles.find((c: any) => c.id === e.cycleId)?.name ?? "—";
                                        const scale = cycles.find((c: any) => c.id === e.cycleId)?.ratingScale ?? 5;
                                        return (
                                            <tr key={e.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                                                            <User className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                                        </div>
                                                        <div>
                                                            <span className="font-bold text-primary-950 dark:text-white">{employeeName(e.employeeId)}</span>
                                                            {e.designation && <p className="text-[10px] text-neutral-400">{e.designation}</p>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-xs text-neutral-600 dark:text-neutral-400">{cycleName}</td>
                                                <td className="py-4 px-6 text-center"><RatingDisplay value={e.selfRating} scale={scale} /></td>
                                                <td className="py-4 px-6 text-center"><RatingDisplay value={e.managerRating} scale={scale} /></td>
                                                <td className="py-4 px-6 text-center"><RatingDisplay value={e.finalRating} scale={scale} /></td>
                                                <td className="py-4 px-6 text-center">
                                                    {e.kraScore != null ? (
                                                        <span className="text-sm font-semibold text-primary-950 dark:text-white">{Number(e.kraScore).toFixed(1)}</span>
                                                    ) : <span className="text-xs text-neutral-400">—</span>}
                                                </td>
                                                <td className="py-4 px-6 text-center"><StatusBadge status={e.status ?? "Pending"} /></td>
                                                <td className="py-4 px-6 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {(!e.selfRating || e.status?.toLowerCase() === "pending" || e.status?.toLowerCase() === "self_review") && (
                                                            <button onClick={() => openReview(e, "self")} className="p-2 text-info-600 dark:text-info-400 hover:bg-info-50 dark:hover:bg-info-900/20 rounded-lg transition-colors" title="Self Review"><User size={15} /></button>
                                                        )}
                                                        {(e.selfRating && (!e.managerRating || e.status?.toLowerCase() === "manager_review")) && (
                                                            <button onClick={() => openReview(e, "manager")} className="p-2 text-warning-600 dark:text-warning-400 hover:bg-warning-50 dark:hover:bg-warning-900/20 rounded-lg transition-colors" title="Manager Review"><Star size={15} /></button>
                                                        )}
                                                        {e.managerRating && e.status?.toLowerCase() !== "published" && (
                                                            <button onClick={() => handlePublish(e)} disabled={publishMutation.isPending} className="p-2 text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20 rounded-lg transition-colors" title="Publish"><Send size={15} /></button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filtered.length === 0 && !isLoading && (
                                        <tr><td colSpan={8}><EmptyState icon="list" title="No appraisal entries found" message="Select a cycle to view appraisal entries." /></td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Calibration 9-Box Grid View */}
            {viewMode === "calibration" && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 p-6">
                    {!cycleFilter ? (
                        <div className="flex flex-col items-center py-12 space-y-3">
                            <Grid3X3 className="w-10 h-10 text-neutral-300 dark:text-neutral-600" />
                            <p className="text-sm text-neutral-400 font-medium">Select an appraisal cycle to view calibration grid</p>
                        </div>
                    ) : isLoading ? (
                        <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 text-primary-400 animate-spin" /></div>
                    ) : (
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <h3 className="text-lg font-bold text-primary-950 dark:text-white">9-Box Calibration Grid</h3>
                                <span className="text-xs text-neutral-400">Self Rating (vertical) vs Manager Rating (horizontal)</span>
                            </div>
                            <div className="flex">
                                {/* Y-axis label */}
                                <div className="flex flex-col items-center justify-center mr-3 w-6">
                                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>Self Rating</span>
                                </div>
                                <div className="flex-1">
                                    {/* Grid */}
                                    <div className="grid grid-cols-3 gap-2">
                                        {(() => {
                                            const grid = buildNineBox();
                                            const cells = [];
                                            for (let selfR = 3; selfR >= 1; selfR--) {
                                                for (let mgrR = 1; mgrR <= 3; mgrR++) {
                                                    const key = `${selfR}-${mgrR}`;
                                                    const config = NINE_BOX_LABELS[key];
                                                    const items = grid[key] ?? [];
                                                    cells.push(
                                                        <div
                                                            key={key}
                                                            className={cn(
                                                                "rounded-xl p-3 min-h-[120px] border transition-all",
                                                                items.length > 0
                                                                    ? "border-neutral-200 dark:border-neutral-700"
                                                                    : "border-dashed border-neutral-200 dark:border-neutral-700"
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-1.5 mb-2">
                                                                <div className={cn("w-2 h-2 rounded-full", config.color)} />
                                                                <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400">{config.label}</span>
                                                                {items.length > 0 && (
                                                                    <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 ml-auto">{items.length}</span>
                                                                )}
                                                            </div>
                                                            <div className="space-y-1">
                                                                {items.slice(0, 5).map((e: any) => (
                                                                    <div key={e.id} className="flex items-center gap-1.5 group">
                                                                        <div className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-[8px] font-bold text-primary-700 dark:text-primary-400">
                                                                            {employeeName(e.employeeId).charAt(0).toUpperCase()}
                                                                        </div>
                                                                        <span className="text-[10px] text-neutral-600 dark:text-neutral-400 truncate flex-1">{employeeName(e.employeeId)}</span>
                                                                    </div>
                                                                ))}
                                                                {items.length > 5 && (
                                                                    <span className="text-[10px] text-neutral-400">+{items.length - 5} more</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                            }
                                            return cells;
                                        })()}
                                    </div>
                                    {/* X-axis label */}
                                    <div className="text-center mt-3">
                                        <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Manager Rating</span>
                                    </div>
                                    {/* Axis ticks */}
                                    <div className="grid grid-cols-3 mt-1">
                                        <span className="text-[10px] text-neutral-400 text-center">Low</span>
                                        <span className="text-[10px] text-neutral-400 text-center">Medium</span>
                                        <span className="text-[10px] text-neutral-400 text-center">High</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Review Modal ── */}
            {reviewModalOpen && selectedEntry && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <div>
                                <h2 className="text-lg font-bold text-primary-950 dark:text-white">{reviewType === "self" ? "Self Review" : "Manager Review"}</h2>
                                <p className="text-xs text-neutral-400 mt-0.5">Employee: {employeeName(selectedEntry.employeeId)}</p>
                            </div>
                            <button onClick={() => setReviewModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <SectionLabel title="Ratings" />
                            <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 divide-y divide-neutral-200 dark:divide-neutral-700">
                                {[
                                    ["rating", "Overall Rating"],
                                    ["kraScore", "KRA Score"],
                                    ["competencyScore", "Competency Score"],
                                ].map(([key, label]) => (
                                    <div key={key} className="flex items-center justify-between px-4 py-3">
                                        <span className="text-sm font-medium text-primary-950 dark:text-white">{label}</span>
                                        <div className="flex items-center gap-1">
                                            {[1, 2, 3, 4, 5].map((v) => (
                                                <button
                                                    key={v}
                                                    onClick={() => setReviewForm((p) => ({ ...p, [key]: v }))}
                                                    className="p-0.5 hover:scale-110 transition-transform"
                                                >
                                                    <Star
                                                        size={18}
                                                        className={cn(
                                                            v <= (reviewForm as any)[key]
                                                                ? "text-warning-500 fill-warning-500"
                                                                : "text-neutral-300 dark:text-neutral-600"
                                                        )}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <SectionLabel title="Comments" />
                            <textarea
                                value={reviewForm.comments}
                                onChange={(e) => setReviewForm((p) => ({ ...p, comments: e.target.value }))}
                                rows={4}
                                placeholder={reviewType === "self" ? "Describe your accomplishments and areas of growth..." : "Provide feedback on performance, achievements, and development areas..."}
                                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none"
                            />
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setReviewModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleSubmitReview} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {saving && <Loader2 size={14} className="animate-spin" />}
                                {saving ? "Submitting..." : "Submit Review"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
