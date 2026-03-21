import { useState } from "react";
import {
    Target,
    Plus,
    Edit3,
    Trash2,
    Loader2,
    X,
    Search,
    Play,
    Send,
    Lock,
    Check,
    Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppraisalCycles } from "@/features/company-admin/api/use-performance-queries";
import {
    useCreateAppraisalCycle,
    useUpdateAppraisalCycle,
    useDeleteAppraisalCycle,
    useActivateAppraisalCycle,
    usePublishAppraisalCycle,
    useCloseAppraisalCycle,
} from "@/features/company-admin/api/use-performance-mutations";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Constants ── */

const FREQUENCIES = [
    { value: "ANNUAL", label: "Annual" },
    { value: "SEMI_ANNUAL", label: "Semi-Annual" },
    { value: "QUARTERLY", label: "Quarterly" },
];

const RATING_SCALES = [
    { value: "3", label: "1\u20133 Scale" },
    { value: "5", label: "1\u20135 Scale" },
    { value: "10", label: "1\u201310 Scale" },
];

const STATUS_FILTERS = ["All", "Draft", "Active", "Published", "Closed"];

const EMPTY_FORM = {
    name: "",
    startDate: "",
    endDate: "",
    frequency: "ANNUAL",
    ratingScale: 5,
    kraWeightage: 70,
    competencyWeightage: 30,
    bellCurveEnabled: false,
    bellCurveDistribution: { outstanding: 10, exceeds: 20, meets: 50, below: 15, poor: 5 },
    selfReviewEnabled: true,
    managerReviewEnabled: true,
    peerReviewEnabled: false,
    midYearReview: false,
    status: "Draft",
};

/* ── Helpers ── */

function StatusBadge({ status }: { status: string }) {
    const s = status?.toLowerCase();
    const map: Record<string, string> = {
        draft: "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700",
        active: "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50",
        published: "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50",
        closed: "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50",
    };
    return (
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize", map[s] ?? map.draft)}>
            {status}
        </span>
    );
}

function YesNoBadge({ enabled }: { enabled: boolean }) {
    return enabled ? (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-success-50 text-success-700 px-2 py-0.5 rounded-full border border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50">
            <Check size={10} /> Yes
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full border border-neutral-200 dark:bg-neutral-800 dark:text-neutral-500 dark:border-neutral-700">
            <Minus size={10} /> No
        </span>
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

export function AppraisalCycleScreen() {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [deleteTarget, setDeleteTarget] = useState<any>(null);

    const { data, isLoading, isError } = useAppraisalCycles(
        statusFilter !== "All" ? { status: statusFilter.toLowerCase() } : undefined
    );
    const createMutation = useCreateAppraisalCycle();
    const updateMutation = useUpdateAppraisalCycle();
    const deleteMutation = useDeleteAppraisalCycle();
    const activateMutation = useActivateAppraisalCycle();
    const publishMutation = usePublishAppraisalCycle();
    const closeMutation = useCloseAppraisalCycle();

    const cycles: any[] = data?.data ?? [];

    const filtered = cycles.filter((c: any) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return c.name?.toLowerCase().includes(s);
    });

    const openCreate = () => {
        setEditingId(null);
        setForm({ ...EMPTY_FORM });
        setModalOpen(true);
    };

    const openEdit = (c: any) => {
        setEditingId(c.id);
        setForm({
            name: c.name ?? "",
            startDate: c.startDate ?? c.periodStart ?? "",
            endDate: c.endDate ?? c.periodEnd ?? "",
            frequency: c.frequency ?? "ANNUAL",
            ratingScale: c.ratingScale ?? 5,
            kraWeightage: c.kraWeightage ?? 70,
            competencyWeightage: c.competencyWeightage ?? 30,
            bellCurveEnabled: c.bellCurveEnabled ?? false,
            bellCurveDistribution: c.bellCurveDistribution ?? EMPTY_FORM.bellCurveDistribution,
            selfReviewEnabled: c.selfReviewEnabled ?? true,
            managerReviewEnabled: c.managerReviewEnabled ?? true,
            peerReviewEnabled: c.peerReviewEnabled ?? false,
            midYearReview: c.midYearReview ?? false,
            status: c.status ?? "Draft",
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        try {
            const payload: any = {
                name: form.name,
                startDate: form.startDate,
                endDate: form.endDate,
                frequency: form.frequency,
                ratingScale: Number(form.ratingScale) || 5,
                kraWeightage: Number(form.kraWeightage) || 70,
                competencyWeightage: Number(form.competencyWeightage) || 30,
                midYearReview: form.midYearReview ?? false,
            };
            if (form.bellCurveEnabled) {
                payload.forcedDistribution = true;
                payload.bellCurve = form.bellCurveDistribution;
            }
            if (editingId) {
                await updateMutation.mutateAsync({ id: editingId, data: payload });
                showSuccess("Cycle Updated", `${form.name} has been updated.`);
            } else {
                await createMutation.mutateAsync(payload);
                showSuccess("Cycle Created", `${form.name} has been created.`);
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
            showSuccess("Cycle Deleted", `${deleteTarget.name} has been removed.`);
            setDeleteTarget(null);
        } catch (err) {
            showApiError(err);
        }
    };

    const handleActivate = async (c: any) => {
        try {
            await activateMutation.mutateAsync(c.id);
            showSuccess("Cycle Activated", `${c.name} is now active.`);
        } catch (err) { showApiError(err); }
    };

    const handlePublish = async (c: any) => {
        try {
            await publishMutation.mutateAsync(c.id);
            showSuccess("Cycle Published", `${c.name} results have been published.`);
        } catch (err) { showApiError(err); }
    };

    const handleClose = async (c: any) => {
        try {
            await closeMutation.mutateAsync(c.id);
            showSuccess("Cycle Closed", `${c.name} has been closed.`);
        } catch (err) { showApiError(err); }
    };

    const saving = createMutation.isPending || updateMutation.isPending;
    const updateField = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Appraisal Cycles</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Configure appraisal periods, rating scales, and evaluation criteria</p>
                </div>
                <button onClick={openCreate} className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none">
                    <Plus className="w-5 h-5" /> New Cycle
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                    <input type="text" placeholder="Search cycles..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                </div>
                <div className="flex items-center gap-2">
                    {STATUS_FILTERS.map((f) => (
                        <button key={f} onClick={() => setStatusFilter(f)} className={cn("px-3 py-1.5 rounded-lg text-xs font-bold border transition-all", statusFilter === f ? "bg-primary-50 text-primary-700 border-primary-300 dark:bg-primary-900/30 dark:text-primary-400 dark:border-primary-700" : "bg-neutral-50 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700 hover:border-neutral-300")}>
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">Failed to load appraisal cycles. Please try again.</div>
            )}

            {/* Data Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? <SkeletonTable rows={5} cols={8} /> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1100px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Name</th>
                                    <th className="py-4 px-6 font-bold">Period</th>
                                    <th className="py-4 px-6 font-bold">Frequency</th>
                                    <th className="py-4 px-6 font-bold text-center">Rating Scale</th>
                                    <th className="py-4 px-6 font-bold text-center">KRA / Competency</th>
                                    <th className="py-4 px-6 font-bold text-center">Bell Curve</th>
                                    <th className="py-4 px-6 font-bold text-center">Status</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.map((c: any) => (
                                    <tr key={c.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                                                    <Target className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                                </div>
                                                <span className="font-bold text-primary-950 dark:text-white">{c.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs font-mono">{(c.startDate || c.periodStart) && (c.endDate || c.periodEnd) ? `${c.startDate || c.periodStart} \u2014 ${c.endDate || c.periodEnd}` : "\u2014"}</td>
                                        <td className="py-4 px-6"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-accent-50 text-accent-700 border-accent-200 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50 capitalize">{c.frequency || "annual"}</span></td>
                                        <td className="py-4 px-6 text-center font-semibold text-primary-950 dark:text-white">1\u2013{c.ratingScale ?? 5}</td>
                                        <td className="py-4 px-6 text-center text-xs text-neutral-600 dark:text-neutral-400">{c.kraWeightage ?? 70}% / {c.competencyWeightage ?? 30}%</td>
                                        <td className="py-4 px-6 text-center"><YesNoBadge enabled={c.bellCurveEnabled ?? false} /></td>
                                        <td className="py-4 px-6 text-center"><StatusBadge status={c.status ?? "Draft"} /></td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {c.status?.toLowerCase() === "draft" && (
                                                    <button onClick={() => handleActivate(c)} disabled={activateMutation.isPending} className="p-2 text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20 rounded-lg transition-colors" title="Activate"><Play size={15} /></button>
                                                )}
                                                {c.status?.toLowerCase() === "active" && (
                                                    <button onClick={() => handlePublish(c)} disabled={publishMutation.isPending} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Publish"><Send size={15} /></button>
                                                )}
                                                {c.status?.toLowerCase() === "published" && (
                                                    <button onClick={() => handleClose(c)} disabled={closeMutation.isPending} className="p-2 text-warning-600 hover:bg-warning-50 dark:hover:bg-warning-900/20 rounded-lg transition-colors" title="Close"><Lock size={15} /></button>
                                                )}
                                                <button onClick={() => openEdit(c)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit"><Edit3 size={15} /></button>
                                                {c.status?.toLowerCase() === "draft" && (
                                                    <button onClick={() => setDeleteTarget(c)} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" title="Delete"><Trash2 size={15} /></button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && !isLoading && (
                                    <tr><td colSpan={8}><EmptyState icon="list" title="No appraisal cycles found" message="Create your first appraisal cycle to get started." action={{ label: "New Cycle", onClick: openCreate }} /></td></tr>
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
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{editingId ? "Edit Cycle" : "New Appraisal Cycle"}</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <SectionLabel title="Basic Information" />
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Cycle Name</label>
                                <input type="text" value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="e.g., FY 2025-26 Annual Review" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Start Date</label>
                                    <input type="date" value={form.startDate} onChange={(e) => updateField("startDate", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">End Date</label>
                                    <input type="date" value={form.endDate} onChange={(e) => updateField("endDate", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Frequency</label>
                                    <select value={form.frequency} onChange={(e) => updateField("frequency", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                        {FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Rating Scale</label>
                                    <select value={form.ratingScale} onChange={(e) => updateField("ratingScale", Number(e.target.value))} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                        {RATING_SCALES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                                    </select>
                                </div>
                            </div>

                            <SectionLabel title="KRA / Competency Split" />
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">KRA Weightage (%)</label>
                                    <input type="number" value={form.kraWeightage} onChange={(e) => { const v = Number(e.target.value); updateField("kraWeightage", v); updateField("competencyWeightage", 100 - v); }} min={0} max={100} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Competency Weightage (%)</label>
                                    <input type="number" value={form.competencyWeightage} readOnly className="w-full px-3 py-2.5 bg-neutral-100 dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-500 dark:text-neutral-400 cursor-not-allowed" />
                                </div>
                            </div>

                            <SectionLabel title="Bell Curve" />
                            <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700 space-y-3">
                                <div className="flex items-center justify-between py-1">
                                    <span className="text-sm font-medium text-primary-950 dark:text-white">Enable Bell Curve Distribution</span>
                                    <button type="button" onClick={() => updateField("bellCurveEnabled", !form.bellCurveEnabled)} className={cn("w-10 h-6 rounded-full transition-colors relative", form.bellCurveEnabled ? "bg-primary-600" : "bg-neutral-300 dark:bg-neutral-700")}>
                                        <div className={cn("w-4 h-4 rounded-full bg-white absolute top-1 transition-all", form.bellCurveEnabled ? "left-5" : "left-1")} />
                                    </button>
                                </div>
                                {form.bellCurveEnabled && (
                                    <div className="grid grid-cols-5 gap-2">
                                        {(["outstanding", "exceeds", "meets", "below", "poor"] as const).map((k) => (
                                            <div key={k}>
                                                <label className="block text-[10px] text-neutral-400 mb-1 capitalize">{k} %</label>
                                                <input type="number" value={form.bellCurveDistribution[k]} onChange={(e) => updateField("bellCurveDistribution", { ...form.bellCurveDistribution, [k]: Number(e.target.value) })} min={0} max={100} className="w-full px-2 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-mono text-center focus:outline-none dark:text-white" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <SectionLabel title="Review Types" />
                            <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700 space-y-1">
                                {([["selfReviewEnabled", "Self Review"], ["managerReviewEnabled", "Manager Review"], ["peerReviewEnabled", "Peer / 360 Review"]] as const).map(([key, label]) => (
                                    <div key={key} className="flex items-center justify-between py-2">
                                        <span className="text-sm font-medium text-primary-950 dark:text-white">{label}</span>
                                        <button type="button" onClick={() => updateField(key, !(form as any)[key])} className={cn("w-10 h-6 rounded-full transition-colors relative", (form as any)[key] ? "bg-primary-600" : "bg-neutral-300 dark:bg-neutral-700")}>
                                            <div className={cn("w-4 h-4 rounded-full bg-white absolute top-1 transition-all", (form as any)[key] ? "left-5" : "left-1")} />
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

            {/* ── Delete Confirmation ── */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">Delete Appraisal Cycle?</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">This will permanently delete <strong>{deleteTarget.name}</strong>. All associated goals and reviews will be affected.</p>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleDelete} disabled={deleteMutation.isPending} className="flex-1 py-3 rounded-xl bg-danger-600 hover:bg-danger-700 text-white text-sm font-bold transition-colors disabled:opacity-50">{deleteMutation.isPending ? "Deleting..." : "Delete"}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
