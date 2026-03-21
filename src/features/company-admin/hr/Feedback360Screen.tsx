import { useState } from "react";
import {
    MessageSquare,
    Plus,
    Loader2,
    X,
    Search,
    Filter,
    Send,
    Star,
    User,
    BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFeedback360List, useFeedback360Report } from "@/features/company-admin/api/use-performance-queries";
import { useAppraisalCycles } from "@/features/company-admin/api/use-performance-queries";
import { useEmployees } from "@/features/company-admin/api/use-hr-queries";
import {
    useCreateFeedback360,
    useUpdateFeedback360,
} from "@/features/company-admin/api/use-performance-mutations";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Constants ── */

const RATER_TYPES = [
    { value: "MANAGER", label: "Manager" },
    { value: "PEER", label: "Peer" },
    { value: "DIRECT_REPORT", label: "Direct Report" },
    { value: "EXTERNAL", label: "External" },
];

const STATUS_FILTERS = ["All", "Pending", "Submitted", "Completed"];

const EMPTY_FORM = {
    employeeId: "",
    cycleId: "",
    raterIds: [] as string[],
    raterType: "PEER",
};

const SUBMIT_FORM = {
    rating: 3,
    communication: 3,
    teamwork: 3,
    leadership: 3,
    technicalSkills: 3,
    comments: "",
    strengths: "",
    improvements: "",
};

/* ── Helpers ── */

function StatusBadge({ status }: { status: string }) {
    const s = status?.toLowerCase();
    const map: Record<string, string> = {
        pending: "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50",
        submitted: "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50",
        completed: "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50",
        draft: "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700",
    };
    return <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize", map[s] ?? map.pending)}>{status}</span>;
}

function RaterTypeBadge({ type }: { type: string }) {
    const map: Record<string, string> = {
        manager: "bg-accent-50 text-accent-700 border-accent-200 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50",
        peer: "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50",
        direct_report: "bg-info-50 text-info-700 border-info-200 dark:bg-info-900/20 dark:text-info-400 dark:border-info-800/50",
        external: "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700",
    };
    return <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize", map[type?.toLowerCase()] ?? map.peer)}>{type?.replace("_", " ")}</span>;
}

function StarRating({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
                <button
                    key={i}
                    type="button"
                    disabled={readonly}
                    onClick={() => onChange?.(i)}
                    className={cn("p-0.5 transition-colors", readonly ? "cursor-default" : "cursor-pointer hover:scale-110")}
                >
                    <Star
                        size={16}
                        className={cn(
                            i <= value ? "text-warning-500 fill-warning-500" : "text-neutral-300 dark:text-neutral-600"
                        )}
                    />
                </button>
            ))}
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

export function Feedback360Screen() {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [cycleFilter, setCycleFilter] = useState("");
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [submitModalOpen, setSubmitModalOpen] = useState(false);
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState<any>(null);
    const [reportEmployee, setReportEmployee] = useState("");
    const [reportCycle, setReportCycle] = useState("");
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [submitForm, setSubmitForm] = useState({ ...SUBMIT_FORM });

    const params: Record<string, unknown> = {};
    if (statusFilter !== "All") params.status = statusFilter.toLowerCase();
    if (cycleFilter) params.cycleId = cycleFilter;

    const { data, isLoading, isError } = useFeedback360List(Object.keys(params).length ? params : undefined);
    const cyclesQuery = useAppraisalCycles();
    const employeesQuery = useEmployees();
    const reportQuery = useFeedback360Report(reportEmployee, reportCycle);
    const createMutation = useCreateFeedback360();
    const submitMutation = useUpdateFeedback360();

    const feedbackList: any[] = data?.data ?? [];
    const cycles: any[] = cyclesQuery.data?.data ?? [];
    const employees: any[] = employeesQuery.data?.data ?? [];

    const employeeName = (id: string) => {
        const emp = employees.find((e: any) => e.id === id);
        if (!emp) return id || "\u2014";
        return [emp.firstName, emp.lastName].filter(Boolean).join(" ") || emp.fullName || emp.email || id;
    };

    const filtered = feedbackList.filter((f: any) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return employeeName(f.employeeId)?.toLowerCase().includes(s) || employeeName(f.raterId)?.toLowerCase().includes(s);
    });

    const openCreate = () => {
        setForm({ ...EMPTY_FORM });
        setCreateModalOpen(true);
    };

    const openSubmit = (entry: any) => {
        setSelectedEntry(entry);
        setSubmitForm({ ...SUBMIT_FORM });
        setSubmitModalOpen(true);
    };

    const openReport = (employeeId: string, cycleId: string) => {
        setReportEmployee(employeeId);
        setReportCycle(cycleId);
        setReportModalOpen(true);
    };

    const handleCreate = async () => {
        try {
            const payload: any = {
                employeeId: form.employeeId,
                cycleId: form.cycleId,
                raterType: form.raterType,
                raterIds: form.raterIds,
            };
            await createMutation.mutateAsync(payload);
            showSuccess("Feedback Request Created", "360 feedback requests have been sent.");
            setCreateModalOpen(false);
        } catch (err) {
            showApiError(err);
        }
    };

    const handleSubmitFeedback = async () => {
        if (!selectedEntry) return;
        try {
            await submitMutation.mutateAsync({
                id: selectedEntry.id,
                data: {
                    ...submitForm,
                    status: "SUBMITTED",
                },
            });
            showSuccess("Feedback Submitted", "Your 360 feedback has been submitted successfully.");
            setSubmitModalOpen(false);
        } catch (err) {
            showApiError(err);
        }
    };

    const toggleRater = (id: string) => {
        setForm((p) => ({
            ...p,
            raterIds: p.raterIds.includes(id) ? p.raterIds.filter((r) => r !== id) : [...p.raterIds, id],
        }));
    };

    const updateField = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));
    const updateSubmitField = (key: string, value: any) => setSubmitForm((p) => ({ ...p, [key]: value }));

    const report: any = reportQuery.data?.data ?? null;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">360 Feedback</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Request, submit, and view multi-rater feedback for employees</p>
                </div>
                <button onClick={openCreate} className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none">
                    <Plus className="w-5 h-5" /> New Request
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                    <input type="text" placeholder="Search by employee or rater..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                </div>
                <div className="flex items-center gap-3 overflow-x-auto pb-1 lg:pb-0">
                    <div className="flex items-center gap-2">
                        <Filter size={14} className="text-neutral-400 shrink-0" />
                        <select value={cycleFilter} onChange={(e) => setCycleFilter(e.target.value)} className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-semibold text-neutral-700 dark:text-neutral-300 focus:outline-none">
                            <option value="">All Cycles</option>
                            {cycles.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-1">
                        {STATUS_FILTERS.map((f) => (
                            <button key={f} onClick={() => setStatusFilter(f)} className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all", statusFilter === f ? "bg-primary-50 text-primary-700 border-primary-300 dark:bg-primary-900/30 dark:text-primary-400 dark:border-primary-700" : "bg-neutral-50 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700")}>
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">Failed to load feedback entries. Please try again.</div>
            )}

            {/* Data Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? <SkeletonTable rows={6} cols={7} /> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Employee</th>
                                    <th className="py-4 px-6 font-bold">Rater</th>
                                    <th className="py-4 px-6 font-bold">Rater Type</th>
                                    <th className="py-4 px-6 font-bold">Cycle</th>
                                    <th className="py-4 px-6 font-bold text-center">Rating</th>
                                    <th className="py-4 px-6 font-bold text-center">Status</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.map((f: any) => {
                                    const cycleName = cycles.find((c: any) => c.id === f.cycleId)?.name ?? "\u2014";
                                    return (
                                        <tr key={f.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                                                        <User className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                                    </div>
                                                    <span className="font-bold text-primary-950 dark:text-white">{employeeName(f.employeeId)}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">{employeeName(f.raterId)}</td>
                                            <td className="py-4 px-6"><RaterTypeBadge type={f.raterType ?? "PEER"} /></td>
                                            <td className="py-4 px-6 text-xs text-neutral-600 dark:text-neutral-400">{cycleName}</td>
                                            <td className="py-4 px-6 text-center">
                                                {f.rating ? (
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Star size={12} className="text-warning-500 fill-warning-500" />
                                                        <span className="text-xs font-bold text-primary-950 dark:text-white">{Number(f.rating).toFixed(1)}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-neutral-400">\u2014</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 text-center"><StatusBadge status={f.status ?? "Pending"} /></td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {f.status?.toLowerCase() === "pending" && (
                                                        <button onClick={() => openSubmit(f)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Submit Feedback"><Send size={15} /></button>
                                                    )}
                                                    <button onClick={() => openReport(f.employeeId, f.cycleId)} className="p-2 text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-900/20 rounded-lg transition-colors" title="View Report"><BarChart3 size={15} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filtered.length === 0 && !isLoading && (
                                    <tr><td colSpan={7}><EmptyState icon="list" title="No feedback entries found" message="Create a 360 feedback request to get started." action={{ label: "New Request", onClick: openCreate }} /></td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Create Request Modal ── */}
            {createModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">New 360 Feedback Request</h2>
                            <button onClick={() => setCreateModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <SectionLabel title="Feedback Target" />
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Employee</label>
                                    <select value={form.employeeId} onChange={(e) => updateField("employeeId", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                        <option value="">Select employee...</option>
                                        {employees.map((e: any) => <option key={e.id} value={e.id}>{[e.firstName, e.lastName].filter(Boolean).join(" ") || e.fullName || e.email}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Appraisal Cycle</label>
                                    <select value={form.cycleId} onChange={(e) => updateField("cycleId", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                        <option value="">Select cycle...</option>
                                        {cycles.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Rater Type</label>
                                <select value={form.raterType} onChange={(e) => updateField("raterType", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                    {RATER_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </div>

                            <SectionLabel title="Select Raters" />
                            <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 max-h-60 overflow-y-auto">
                                {employees.filter((e: any) => e.id !== form.employeeId).map((e: any) => {
                                    const name = [e.firstName, e.lastName].filter(Boolean).join(" ") || e.fullName || e.email;
                                    const selected = form.raterIds.includes(e.id);
                                    return (
                                        <button
                                            key={e.id}
                                            type="button"
                                            onClick={() => toggleRater(e.id)}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-4 py-3 text-left border-b border-neutral-200 dark:border-neutral-700 last:border-0 transition-colors",
                                                selected ? "bg-primary-50 dark:bg-primary-900/20" : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors",
                                                selected ? "bg-primary-600 border-primary-600" : "border-neutral-300 dark:border-neutral-600"
                                            )}>
                                                {selected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                            </div>
                                            <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-xs font-bold text-primary-700 dark:text-primary-400">
                                                {name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <span className="text-sm font-medium text-primary-950 dark:text-white">{name}</span>
                                                {e.designation && <p className="text-[10px] text-neutral-400">{e.designation}</p>}
                                            </div>
                                        </button>
                                    );
                                })}
                                {employees.length === 0 && (
                                    <p className="text-sm text-neutral-400 text-center py-6">No employees available</p>
                                )}
                            </div>
                            {form.raterIds.length > 0 && (
                                <p className="text-xs text-primary-600 dark:text-primary-400 font-medium">{form.raterIds.length} rater{form.raterIds.length !== 1 ? "s" : ""} selected</p>
                            )}
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setCreateModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleCreate} disabled={createMutation.isPending || !form.employeeId || !form.cycleId || form.raterIds.length === 0} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {createMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                {createMutation.isPending ? "Sending..." : "Send Requests"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Submit Feedback Modal ── */}
            {submitModalOpen && selectedEntry && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <div>
                                <h2 className="text-lg font-bold text-primary-950 dark:text-white">Submit 360 Feedback</h2>
                                <p className="text-xs text-neutral-400 mt-0.5">For: {employeeName(selectedEntry.employeeId)}</p>
                            </div>
                            <button onClick={() => setSubmitModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <SectionLabel title="Competency Ratings" />
                            <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 divide-y divide-neutral-200 dark:divide-neutral-700">
                                {[
                                    ["rating", "Overall Rating"],
                                    ["communication", "Communication"],
                                    ["teamwork", "Teamwork & Collaboration"],
                                    ["leadership", "Leadership"],
                                    ["technicalSkills", "Technical Skills"],
                                ].map(([key, label]) => (
                                    <div key={key} className="flex items-center justify-between px-4 py-3">
                                        <span className="text-sm font-medium text-primary-950 dark:text-white">{label}</span>
                                        <StarRating value={(submitForm as any)[key]} onChange={(v) => updateSubmitField(key, v)} />
                                    </div>
                                ))}
                            </div>

                            <SectionLabel title="Written Feedback" />
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Key Strengths</label>
                                <textarea value={submitForm.strengths} onChange={(e) => updateSubmitField("strengths", e.target.value)} rows={2} placeholder="What does this person do well?" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Areas for Improvement</label>
                                <textarea value={submitForm.improvements} onChange={(e) => updateSubmitField("improvements", e.target.value)} rows={2} placeholder="Where can they grow?" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Additional Comments</label>
                                <textarea value={submitForm.comments} onChange={(e) => updateSubmitField("comments", e.target.value)} rows={2} placeholder="Any additional observations..." className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none" />
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setSubmitModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleSubmitFeedback} disabled={submitMutation.isPending} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {submitMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                {submitMutation.isPending ? "Submitting..." : "Submit Feedback"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Aggregated Report Modal ── */}
            {reportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-3xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <div>
                                <h2 className="text-lg font-bold text-primary-950 dark:text-white">360 Feedback Report</h2>
                                <p className="text-xs text-neutral-400 mt-0.5">Aggregated feedback for: {employeeName(reportEmployee)}</p>
                            </div>
                            <button onClick={() => setReportModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            {reportQuery.isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
                                </div>
                            ) : report ? (
                                <>
                                    {/* Summary Cards */}
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        {[
                                            { label: "Overall Avg", value: report.overallAverage ?? report.avgRating ?? "\u2014", color: "primary" },
                                            { label: "Total Responses", value: report.totalResponses ?? report.responseCount ?? 0, color: "accent" },
                                            { label: "Completion %", value: report.completionRate ? `${Math.round(report.completionRate)}%` : "\u2014", color: "success" },
                                            { label: "Rater Types", value: report.raterTypes?.length ?? report.uniqueRaterTypes ?? "\u2014", color: "info" },
                                        ].map((card) => (
                                            <div key={card.label} className={cn("rounded-xl p-4 border", `bg-${card.color}-50 border-${card.color}-200 dark:bg-${card.color}-900/20 dark:border-${card.color}-800/50`)}>
                                                <p className={cn("text-[10px] font-bold uppercase tracking-wider", `text-${card.color}-600 dark:text-${card.color}-400`)}>{card.label}</p>
                                                <p className={cn("text-2xl font-bold mt-1", `text-${card.color}-700 dark:text-${card.color}-300`)}>{card.value}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Competency Breakdown */}
                                    <SectionLabel title="Competency Scores" />
                                    <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 divide-y divide-neutral-200 dark:divide-neutral-700">
                                        {(report.competencies ?? report.breakdown ?? []).map((comp: any) => (
                                            <div key={comp.name ?? comp.competency} className="flex items-center justify-between px-4 py-3">
                                                <span className="text-sm font-medium text-primary-950 dark:text-white">{comp.name ?? comp.competency}</span>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-32 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                                                        <div className="h-full bg-primary-500 rounded-full" style={{ width: `${((comp.average ?? comp.avgScore ?? 0) / 5) * 100}%` }} />
                                                    </div>
                                                    <span className="text-sm font-bold text-primary-950 dark:text-white w-8 text-right">{Number(comp.average ?? comp.avgScore ?? 0).toFixed(1)}</span>
                                                </div>
                                            </div>
                                        ))}
                                        {(!report.competencies && !report.breakdown) && (
                                            <p className="text-sm text-neutral-400 text-center py-6">No competency data available yet</p>
                                        )}
                                    </div>

                                    {/* Qualitative Feedback */}
                                    <SectionLabel title="Qualitative Feedback" />
                                    <div className="space-y-3">
                                        {(report.comments ?? report.qualitative ?? []).map((item: any, i: number) => (
                                            <div key={i} className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <RaterTypeBadge type={item.raterType ?? "PEER"} />
                                                    {item.rating && <StarRating value={item.rating} readonly />}
                                                </div>
                                                {item.strengths && <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1"><strong className="text-success-600 dark:text-success-400">Strengths:</strong> {item.strengths}</p>}
                                                {item.improvements && <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1"><strong className="text-warning-600 dark:text-warning-400">To improve:</strong> {item.improvements}</p>}
                                                {item.comments && <p className="text-sm text-neutral-600 dark:text-neutral-400">{item.comments}</p>}
                                            </div>
                                        ))}
                                        {(!report.comments && !report.qualitative) && (
                                            <p className="text-sm text-neutral-400 text-center py-6">No qualitative feedback available yet</p>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center py-12 space-y-3">
                                    <MessageSquare className="w-10 h-10 text-neutral-300 dark:text-neutral-600" />
                                    <p className="text-sm text-neutral-400">No report data available for this employee and cycle</p>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setReportModalOpen(false)} className="w-full py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
