import { useState } from "react";
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import {
    Briefcase,
    Plus,
    Edit3,
    Trash2,
    Loader2,
    X,
    Search,
    Eye,
    Users,
    Calendar,
    ArrowRight,
    UserPlus,
    Video,
    CheckCircle2,
    XCircle,
    Clock,
    Filter,
    MapPin,
    DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    useRequisitions,
    useCandidates,
    useInterviews,
} from "@/features/company-admin/api/use-recruitment-queries";
import { useEmployees, useDepartments, useDesignations } from "@/features/company-admin/api/use-hr-queries";
import {
    useCreateRequisition,
    useUpdateRequisition,
    useDeleteRequisition,
    useCreateCandidate,
    useUpdateCandidate,
    useCreateInterview,
    useUpdateInterview,
} from "@/features/company-admin/api/use-recruitment-mutations";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Constants ── */

const REQ_STATUSES = ["All", "Open", "In Progress", "On Hold", "Filled", "Cancelled"];
const CANDIDATE_STAGES = ["Applied", "Screening", "Interview", "Offer", "Hired", "Rejected"];
const INTERVIEW_TYPES = ["Phone", "Video", "In-Person", "Technical", "HR", "Panel"];
const INTERVIEW_STATUSES = ["Scheduled", "Completed", "Cancelled", "No Show"];
const EMPLOYMENT_TYPES = ["Full-Time", "Part-Time", "Contract", "Intern"];
const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Urgent"];

const TABS = [
    { key: "requisitions" as const, label: "Requisitions", icon: Briefcase },
    { key: "candidates" as const, label: "Candidates", icon: UserPlus },
    { key: "interviews" as const, label: "Interviews", icon: Video },
];

type TabKey = (typeof TABS)[number]["key"];

/* ── Empty Forms ── */

const EMPTY_REQ = {
    title: "",
    department: "",
    positions: 1,
    employmentType: "Full-Time",
    priority: "Medium",
    location: "",
    minSalary: "",
    maxSalary: "",
    description: "",
    requirements: "",
    hiringManagerId: "",
    deadline: "",
};

const EMPTY_CANDIDATE = {
    requisitionId: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    stage: "Applied",
    source: "",
    resumeUrl: "",
    notes: "",
    experience: "",
    currentCompany: "",
};

const EMPTY_INTERVIEW = {
    candidateId: "",
    requisitionId: "",
    type: "Video",
    scheduledAt: "",
    duration: 60,
    interviewerIds: [] as string[],
    location: "",
    meetingLink: "",
    notes: "",
};

/* ── Helpers ── */

// formatDate and formatDateTime moved inside component

/* ── Badges ── */

function ReqStatusBadge({ status }: { status: string }) {
    const s = status?.toLowerCase();
    const map: Record<string, string> = {
        open: "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50",
        "in progress": "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50",
        "on hold": "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50",
        filled: "bg-accent-50 text-accent-700 border-accent-200 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50",
        cancelled: "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700",
    };
    return (
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize", map[s] ?? map.open)}>
            {status}
        </span>
    );
}

function StageBadge({ stage }: { stage: string }) {
    const s = stage?.toLowerCase();
    const map: Record<string, string> = {
        applied: "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700",
        screening: "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50",
        interview: "bg-accent-50 text-accent-700 border-accent-200 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50",
        offer: "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50",
        hired: "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50",
        rejected: "bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50",
    };
    return (
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize", map[s] ?? map.applied)}>
            {stage}
        </span>
    );
}

function InterviewStatusBadge({ status }: { status: string }) {
    const s = status?.toLowerCase();
    const map: Record<string, { icon: typeof Clock; cls: string }> = {
        scheduled: { icon: Clock, cls: "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50" },
        completed: { icon: CheckCircle2, cls: "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50" },
        cancelled: { icon: XCircle, cls: "bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50" },
        "no show": { icon: XCircle, cls: "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50" },
    };
    const c = map[s] ?? map.scheduled;
    const Icon = c.icon;
    return (
        <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize", c.cls)}>
            <Icon size={10} />
            {status}
        </span>
    );
}

function PriorityBadge({ priority }: { priority: string }) {
    const p = priority?.toLowerCase();
    const map: Record<string, string> = {
        low: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
        medium: "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400",
        high: "bg-warning-50 text-warning-700 dark:bg-warning-900/20 dark:text-warning-400",
        urgent: "bg-danger-50 text-danger-700 dark:bg-danger-900/20 dark:text-danger-400",
    };
    return <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full capitalize", map[p] ?? map.medium)}>{priority}</span>;
}

/* ── Screen ── */

export function RequisitionScreen() {
    const fmt = useCompanyFormatter();
    const formatDate = (d: string | null | undefined) => d ? fmt.date(d) : "—";
    const formatDateTime = (d: string | null | undefined) => d ? fmt.dateTime(d) : "—";
    const [activeTab, setActiveTab] = useState<TabKey>("requisitions");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [selectedReqId, setSelectedReqId] = useState<string | null>(null);

    /* Modals */
    const [reqModalOpen, setReqModalOpen] = useState(false);
    const [reqEditingId, setReqEditingId] = useState<string | null>(null);
    const [reqForm, setReqForm] = useState({ ...EMPTY_REQ });
    const [deleteTarget, setDeleteTarget] = useState<any>(null);

    const [candModalOpen, setCandModalOpen] = useState(false);
    const [candEditingId, setCandEditingId] = useState<string | null>(null);
    const [candForm, setCandForm] = useState({ ...EMPTY_CANDIDATE });
    const [candDetailTarget, setCandDetailTarget] = useState<any>(null);

    const [intModalOpen, setIntModalOpen] = useState(false);
    const [intEditingId, setIntEditingId] = useState<string | null>(null);
    const [intForm, setIntForm] = useState({ ...EMPTY_INTERVIEW });

    /* Queries */
    const reqQuery = useRequisitions(statusFilter !== "All" ? { status: statusFilter.toLowerCase() } : undefined);
    const candQuery = useCandidates(selectedReqId ? { requisitionId: selectedReqId } : undefined);
    const intQuery = useInterviews(selectedReqId ? { requisitionId: selectedReqId } : undefined);
    const employeesQuery = useEmployees();
    const departmentsQuery = useDepartments();
    const designationsQuery = useDesignations();

    /* Mutations */
    const createReq = useCreateRequisition();
    const updateReq = useUpdateRequisition();
    const deleteReq = useDeleteRequisition();
    const createCand = useCreateCandidate();
    const updateCand = useUpdateCandidate();
    const createInt = useCreateInterview();
    const updateInt = useUpdateInterview();

    const requisitions: any[] = reqQuery.data?.data ?? [];
    const candidates: any[] = candQuery.data?.data ?? [];
    const interviews: any[] = intQuery.data?.data ?? [];
    const employees: any[] = employeesQuery.data?.data ?? [];
    const departments: any[] = departmentsQuery.data?.data ?? [];
    const designations: any[] = designationsQuery.data?.data ?? [];

    const employeeName = (id: string) => {
        const emp = employees.find((e: any) => e.id === id);
        if (!emp) return id;
        return [emp.firstName, emp.lastName].filter(Boolean).join(" ") || emp.fullName || emp.email || id;
    };

    const reqTitle = (id: string) => requisitions.find((r: any) => r.id === id)?.title ?? id;
    const candName = (id: string) => {
        const c = candidates.find((c: any) => c.id === id);
        return c ? [c.firstName, c.lastName].filter(Boolean).join(" ") : id;
    };

    /* Filtering */
    const filteredReqs = requisitions.filter((r: any) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return r.title?.toLowerCase().includes(s) || r.department?.toLowerCase().includes(s) || r.location?.toLowerCase().includes(s);
    });

    const filteredCands = candidates.filter((c: any) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return c.firstName?.toLowerCase().includes(s) || c.lastName?.toLowerCase().includes(s) || c.email?.toLowerCase().includes(s);
    });

    const filteredInts = interviews.filter((i: any) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return i.type?.toLowerCase().includes(s) || candName(i.candidateId)?.toLowerCase().includes(s);
    });

    /* ── Requisition Handlers ── */
    const openCreateReq = () => { setReqEditingId(null); setReqForm({ ...EMPTY_REQ }); setReqModalOpen(true); };
    const openEditReq = (r: any) => {
        setReqEditingId(r.id);
        setReqForm({
            title: r.title ?? "", department: r.department ?? "", positions: r.positions ?? 1,
            employmentType: r.employmentType ?? "Full-Time", priority: r.priority ?? "Medium",
            location: r.location ?? "", minSalary: r.minSalary ?? "", maxSalary: r.maxSalary ?? "",
            description: r.description ?? "", requirements: r.requirements ?? "",
            hiringManagerId: r.hiringManagerId ?? "", deadline: r.deadline ?? "",
        });
        setReqModalOpen(true);
    };
    const handleSaveReq = async () => {
        try {
            const payload: any = {
                title: reqForm.title,
                departmentId: reqForm.department || undefined,
                designationId: reqForm.hiringManagerId ? undefined : undefined,
                openings: Number(reqForm.positions) || 1,
                description: reqForm.description || undefined,
                budgetMin: reqForm.minSalary ? Number(reqForm.minSalary) : undefined,
                budgetMax: reqForm.maxSalary ? Number(reqForm.maxSalary) : undefined,
                targetDate: reqForm.deadline || undefined,
                approvedBy: reqForm.hiringManagerId || undefined,
            };
            if (reqEditingId) {
                await updateReq.mutateAsync({ id: reqEditingId, data: payload });
                showSuccess("Requisition Updated", `${reqForm.title} has been updated.`);
            } else {
                await createReq.mutateAsync(payload);
                showSuccess("Requisition Created", `${reqForm.title} has been created.`);
            }
            setReqModalOpen(false);
        } catch (err) { showApiError(err); }
    };
    const handleDeleteReq = async () => {
        if (!deleteTarget) return;
        try {
            await deleteReq.mutateAsync(deleteTarget.id);
            showSuccess("Requisition Deleted", `${deleteTarget.title} has been removed.`);
            setDeleteTarget(null);
            if (selectedReqId === deleteTarget.id) setSelectedReqId(null);
        } catch (err) { showApiError(err); }
    };

    /* ── Candidate Handlers ── */
    const openCreateCand = () => {
        setCandEditingId(null);
        setCandForm({ ...EMPTY_CANDIDATE, requisitionId: selectedReqId ?? "" });
        setCandModalOpen(true);
    };
    const openEditCand = (c: any) => {
        setCandEditingId(c.id);
        setCandForm({
            requisitionId: c.requisitionId ?? selectedReqId ?? "", firstName: c.firstName ?? "",
            lastName: c.lastName ?? "", email: c.email ?? "", phone: c.phone ?? "",
            stage: c.stage ?? "Applied", source: c.source ?? "", resumeUrl: c.resumeUrl ?? "",
            notes: c.notes ?? "", experience: c.experience ?? "", currentCompany: c.currentCompany ?? "",
        });
        setCandModalOpen(true);
    };
    const handleSaveCand = async () => {
        try {
            const fullName = [candForm.firstName, candForm.lastName].filter(Boolean).join(" ");
            const payload: any = {
                requisitionId: candForm.requisitionId,
                name: fullName,
                email: candForm.email,
                phone: candForm.phone || undefined,
                source: candForm.source || undefined,
                notes: candForm.notes || undefined,
            };
            if (candEditingId) {
                await updateCand.mutateAsync({ id: candEditingId, data: payload });
                showSuccess("Candidate Updated", `${fullName} updated.`);
            } else {
                await createCand.mutateAsync(payload);
                showSuccess("Candidate Added", `${fullName} added.`);
            }
            setCandModalOpen(false);
        } catch (err) { showApiError(err); }
    };

    /* ── Interview Handlers ── */
    const openCreateInt = () => {
        setIntEditingId(null);
        setIntForm({ ...EMPTY_INTERVIEW, requisitionId: selectedReqId ?? "" });
        setIntModalOpen(true);
    };
    const openEditInt = (i: any) => {
        setIntEditingId(i.id);
        setIntForm({
            candidateId: i.candidateId ?? "", requisitionId: i.requisitionId ?? selectedReqId ?? "",
            type: i.type ?? "Video", scheduledAt: i.scheduledAt ?? "", duration: i.duration ?? 60,
            interviewerIds: i.interviewerIds ?? [], location: i.location ?? "",
            meetingLink: i.meetingLink ?? "", notes: i.notes ?? "",
        });
        setIntModalOpen(true);
    };
    const handleSaveInt = async () => {
        try {
            const payload: any = {
                candidateId: intForm.candidateId,
                round: intForm.type,
                panelists: intForm.interviewerIds?.length ? intForm.interviewerIds : undefined,
                scheduledAt: intForm.scheduledAt,
                duration: intForm.duration || undefined,
                meetingLink: intForm.meetingLink || undefined,
            };
            if (intEditingId) {
                await updateInt.mutateAsync({ id: intEditingId, data: payload });
                showSuccess("Interview Updated", "Interview has been updated.");
            } else {
                await createInt.mutateAsync(payload);
                showSuccess("Interview Scheduled", "Interview has been scheduled.");
            }
            setIntModalOpen(false);
        } catch (err) { showApiError(err); }
    };

    const savingReq = createReq.isPending || updateReq.isPending;
    const savingCand = createCand.isPending || updateCand.isPending;
    const savingInt = createInt.isPending || updateInt.isPending;

    const updateReqField = (key: string, value: any) => setReqForm((p) => ({ ...p, [key]: value }));
    const updateCandField = (key: string, value: any) => setCandForm((p) => ({ ...p, [key]: value }));
    const updateIntField = (key: string, value: any) => setIntForm((p) => ({ ...p, [key]: value }));

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Recruitment</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Manage job requisitions, candidates, and interviews</p>
                </div>
                <button
                    onClick={() => {
                        if (activeTab === "requisitions") openCreateReq();
                        else if (activeTab === "candidates") openCreateCand();
                        else openCreateInt();
                    }}
                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
                >
                    <Plus className="w-5 h-5" />
                    {activeTab === "requisitions" ? "New Requisition" : activeTab === "candidates" ? "Add Candidate" : "Schedule Interview"}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl w-fit">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => { setActiveTab(tab.key); setSearch(""); }}
                            className={cn(
                                "px-5 py-2 rounded-lg text-sm font-bold transition-all",
                                activeTab === tab.key
                                    ? "bg-white dark:bg-neutral-700 text-primary-700 dark:text-primary-400 shadow-sm"
                                    : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
                            )}
                        >
                            <span className="flex items-center gap-2"><Icon size={14} />{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                    <input
                        type="text"
                        placeholder={activeTab === "requisitions" ? "Search requisitions..." : activeTab === "candidates" ? "Search candidates..." : "Search interviews..."}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                    />
                </div>
                <div className="flex items-center gap-3 overflow-x-auto pb-1 lg:pb-0">
                    {activeTab === "requisitions" && (
                        <div className="flex items-center gap-2">
                            <Filter size={14} className="text-neutral-400 flex-shrink-0" />
                            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 whitespace-nowrap">Status:</span>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-semibold text-neutral-700 dark:text-neutral-300 focus:outline-none"
                            >
                                {REQ_STATUSES.map((f) => <option key={f} value={f}>{f}</option>)}
                            </select>
                        </div>
                    )}
                    {(activeTab === "candidates" || activeTab === "interviews") && selectedReqId && (
                        <div className="flex items-center gap-2">
                            <Briefcase size={14} className="text-primary-500" />
                            <span className="text-xs font-bold text-primary-600 dark:text-primary-400 truncate max-w-[200px]">{reqTitle(selectedReqId)}</span>
                            <button onClick={() => setSelectedReqId(null)} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400"><X size={12} /></button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Requisitions Tab ── */}
            {activeTab === "requisitions" && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                    {reqQuery.isLoading ? <SkeletonTable rows={6} cols={8} /> : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[1100px]">
                                <thead>
                                    <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                        <th className="py-4 px-6 font-bold">Title</th>
                                        <th className="py-4 px-6 font-bold">Department</th>
                                        <th className="py-4 px-6 font-bold text-center">Positions</th>
                                        <th className="py-4 px-6 font-bold">Type</th>
                                        <th className="py-4 px-6 font-bold text-center">Priority</th>
                                        <th className="py-4 px-6 font-bold">Location</th>
                                        <th className="py-4 px-6 font-bold text-center">Status</th>
                                        <th className="py-4 px-6 font-bold">Deadline</th>
                                        <th className="py-4 px-6 font-bold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {filteredReqs.map((r: any) => (
                                        <tr key={r.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                                                        <Briefcase className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                                    </div>
                                                    <span className="font-bold text-primary-950 dark:text-white">{r.title}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">{r.department || "—"}</td>
                                            <td className="py-4 px-6 text-center font-semibold text-primary-950 dark:text-white">{r.positions ?? 1}</td>
                                            <td className="py-4 px-6"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-50 text-accent-700 border border-accent-200 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50">{r.employmentType || "Full-Time"}</span></td>
                                            <td className="py-4 px-6 text-center"><PriorityBadge priority={r.priority ?? "Medium"} /></td>
                                            <td className="py-4 px-6 text-xs text-neutral-600 dark:text-neutral-400">{r.location || "—"}</td>
                                            <td className="py-4 px-6 text-center"><ReqStatusBadge status={r.status ?? "Open"} /></td>
                                            <td className="py-4 px-6 text-xs text-neutral-600 dark:text-neutral-400">{formatDate(r.deadline)}</td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => { setSelectedReqId(r.id); setActiveTab("candidates"); }}
                                                        className="p-2 text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-900/30 rounded-lg transition-colors"
                                                        title="View Candidates"
                                                    >
                                                        <Users size={15} />
                                                    </button>
                                                    <button onClick={() => openEditReq(r)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit">
                                                        <Edit3 size={15} />
                                                    </button>
                                                    <button onClick={() => setDeleteTarget(r)} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" title="Delete">
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredReqs.length === 0 && !reqQuery.isLoading && (
                                        <tr><td colSpan={9}><EmptyState icon="list" title="No requisitions found" message="Create a new job requisition to start recruiting." action={{ label: "New Requisition", onClick: openCreateReq }} /></td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ── Candidates Tab ── */}
            {activeTab === "candidates" && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                    {candQuery.isLoading ? <SkeletonTable rows={6} cols={7} /> : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[1000px]">
                                <thead>
                                    <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                        <th className="py-4 px-6 font-bold">Candidate</th>
                                        <th className="py-4 px-6 font-bold">Email</th>
                                        <th className="py-4 px-6 font-bold">Experience</th>
                                        <th className="py-4 px-6 font-bold">Source</th>
                                        <th className="py-4 px-6 font-bold text-center">Stage</th>
                                        <th className="py-4 px-6 font-bold">Applied</th>
                                        <th className="py-4 px-6 font-bold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {filteredCands.map((c: any) => (
                                        <tr key={c.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center shrink-0 text-xs font-bold text-accent-700 dark:text-accent-400">
                                                        {(c.firstName?.charAt(0) ?? "") + (c.lastName?.charAt(0) ?? "")}
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-primary-950 dark:text-white">{[c.firstName, c.lastName].filter(Boolean).join(" ")}</span>
                                                        {c.currentCompany && <p className="text-[10px] text-neutral-400">{c.currentCompany}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">{c.email || "—"}</td>
                                            <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">{c.experience ? `${c.experience} yrs` : "—"}</td>
                                            <td className="py-4 px-6 text-xs text-neutral-500 dark:text-neutral-400">{c.source || "—"}</td>
                                            <td className="py-4 px-6 text-center"><StageBadge stage={c.stage ?? "Applied"} /></td>
                                            <td className="py-4 px-6 text-xs text-neutral-600 dark:text-neutral-400">{formatDate(c.createdAt)}</td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => setCandDetailTarget(c)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="View">
                                                        <Eye size={15} />
                                                    </button>
                                                    <button onClick={() => openEditCand(c)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit">
                                                        <Edit3 size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => { setSelectedReqId(c.requisitionId); setActiveTab("interviews"); }}
                                                        className="p-2 text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-900/30 rounded-lg transition-colors"
                                                        title="Schedule Interview"
                                                    >
                                                        <ArrowRight size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredCands.length === 0 && !candQuery.isLoading && (
                                        <tr><td colSpan={7}><EmptyState icon="list" title="No candidates found" message={selectedReqId ? "No candidates for this requisition yet." : "Select a requisition to view candidates."} /></td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ── Interviews Tab ── */}
            {activeTab === "interviews" && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                    {intQuery.isLoading ? <SkeletonTable rows={6} cols={7} /> : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[1000px]">
                                <thead>
                                    <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                        <th className="py-4 px-6 font-bold">Candidate</th>
                                        <th className="py-4 px-6 font-bold">Type</th>
                                        <th className="py-4 px-6 font-bold">Scheduled</th>
                                        <th className="py-4 px-6 font-bold text-center">Duration</th>
                                        <th className="py-4 px-6 font-bold">Location / Link</th>
                                        <th className="py-4 px-6 font-bold text-center">Status</th>
                                        <th className="py-4 px-6 font-bold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {filteredInts.map((i: any) => (
                                        <tr key={i.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                            <td className="py-4 px-6 font-bold text-primary-950 dark:text-white">{candName(i.candidateId)}</td>
                                            <td className="py-4 px-6"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-50 text-accent-700 border border-accent-200 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50">{i.type}</span></td>
                                            <td className="py-4 px-6 text-xs text-neutral-600 dark:text-neutral-400">{formatDateTime(i.scheduledAt)}</td>
                                            <td className="py-4 px-6 text-center text-neutral-600 dark:text-neutral-400">{i.duration ?? 60} min</td>
                                            <td className="py-4 px-6 text-xs text-neutral-500 dark:text-neutral-400 truncate max-w-[200px]">{i.meetingLink || i.location || "—"}</td>
                                            <td className="py-4 px-6 text-center"><InterviewStatusBadge status={i.status ?? "Scheduled"} /></td>
                                            <td className="py-4 px-6 text-right">
                                                <button onClick={() => openEditInt(i)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit">
                                                    <Edit3 size={15} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredInts.length === 0 && !intQuery.isLoading && (
                                        <tr><td colSpan={7}><EmptyState icon="list" title="No interviews found" message="Schedule an interview to get started." action={{ label: "Schedule Interview", onClick: openCreateInt }} /></td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ── Requisition Create/Edit Modal ── */}
            {reqModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{reqEditingId ? "Edit Requisition" : "New Requisition"}</h2>
                            <button onClick={() => setReqModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Job Title</label>
                                <input type="text" value={reqForm.title} onChange={(e) => updateReqField("title", e.target.value)} placeholder="e.g., Senior Software Engineer" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Department</label>
                                    <select value={reqForm.department} onChange={(e) => updateReqField("department", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                        <option value="">Select department...</option>
                                        {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Positions</label>
                                    <input type="number" value={reqForm.positions} onChange={(e) => updateReqField("positions", Number(e.target.value))} min={1} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Employment Type</label>
                                    <select value={reqForm.employmentType} onChange={(e) => updateReqField("employmentType", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                        {EMPLOYMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Priority</label>
                                    <select value={reqForm.priority} onChange={(e) => updateReqField("priority", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                        {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Location</label>
                                    <input type="text" value={reqForm.location} onChange={(e) => updateReqField("location", e.target.value)} placeholder="Bangalore" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Deadline</label>
                                    <input type="date" value={reqForm.deadline} onChange={(e) => updateReqField("deadline", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Min Salary</label>
                                    <input type="text" value={reqForm.minSalary} onChange={(e) => updateReqField("minSalary", e.target.value)} placeholder="e.g., 800000" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Max Salary</label>
                                    <input type="text" value={reqForm.maxSalary} onChange={(e) => updateReqField("maxSalary", e.target.value)} placeholder="e.g., 1200000" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Hiring Manager</label>
                                <select value={reqForm.hiringManagerId} onChange={(e) => updateReqField("hiringManagerId", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                    <option value="">Select manager...</option>
                                    {employees.map((e: any) => <option key={e.id} value={e.id}>{[e.firstName, e.lastName].filter(Boolean).join(" ") || e.email}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Description</label>
                                <textarea value={reqForm.description} onChange={(e) => updateReqField("description", e.target.value)} placeholder="Job description..." rows={3} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Requirements</label>
                                <textarea value={reqForm.requirements} onChange={(e) => updateReqField("requirements", e.target.value)} placeholder="Skills and qualifications..." rows={3} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none" />
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setReqModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleSaveReq} disabled={savingReq} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {savingReq && <Loader2 size={14} className="animate-spin" />}
                                {savingReq ? "Saving..." : reqEditingId ? "Update" : "Create"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Candidate Create/Edit Modal ── */}
            {candModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{candEditingId ? "Edit Candidate" : "Add Candidate"}</h2>
                            <button onClick={() => setCandModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Requisition</label>
                                <select value={candForm.requisitionId} onChange={(e) => updateCandField("requisitionId", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                    <option value="">Select requisition...</option>
                                    {requisitions.map((r: any) => <option key={r.id} value={r.id}>{r.title}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">First Name</label>
                                    <input type="text" value={candForm.firstName} onChange={(e) => updateCandField("firstName", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Last Name</label>
                                    <input type="text" value={candForm.lastName} onChange={(e) => updateCandField("lastName", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Email</label>
                                    <input type="email" value={candForm.email} onChange={(e) => updateCandField("email", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Phone</label>
                                    <input type="tel" value={candForm.phone} onChange={(e) => updateCandField("phone", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Experience (years)</label>
                                    <input type="text" value={candForm.experience} onChange={(e) => updateCandField("experience", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Current Company</label>
                                    <input type="text" value={candForm.currentCompany} onChange={(e) => updateCandField("currentCompany", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Stage</label>
                                    <select value={candForm.stage} onChange={(e) => updateCandField("stage", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                        {CANDIDATE_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Source</label>
                                    <input type="text" value={candForm.source} onChange={(e) => updateCandField("source", e.target.value)} placeholder="LinkedIn, Referral..." className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Notes</label>
                                <textarea value={candForm.notes} onChange={(e) => updateCandField("notes", e.target.value)} rows={3} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none" />
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setCandModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleSaveCand} disabled={savingCand} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {savingCand && <Loader2 size={14} className="animate-spin" />}
                                {savingCand ? "Saving..." : candEditingId ? "Update" : "Add"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Interview Schedule Modal ── */}
            {intModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{intEditingId ? "Edit Interview" : "Schedule Interview"}</h2>
                            <button onClick={() => setIntModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Candidate</label>
                                <select value={intForm.candidateId} onChange={(e) => updateIntField("candidateId", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                    <option value="">Select candidate...</option>
                                    {candidates.map((c: any) => <option key={c.id} value={c.id}>{[c.firstName, c.lastName].filter(Boolean).join(" ")}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Type</label>
                                    <select value={intForm.type} onChange={(e) => updateIntField("type", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                        {INTERVIEW_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Duration (min)</label>
                                    <input type="number" value={intForm.duration} onChange={(e) => updateIntField("duration", Number(e.target.value))} min={15} step={15} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Scheduled At</label>
                                <input type="datetime-local" value={intForm.scheduledAt} onChange={(e) => updateIntField("scheduledAt", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Meeting Link</label>
                                <input type="url" value={intForm.meetingLink} onChange={(e) => updateIntField("meetingLink", e.target.value)} placeholder="https://meet.google.com/..." className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Location</label>
                                <input type="text" value={intForm.location} onChange={(e) => updateIntField("location", e.target.value)} placeholder="Conference Room A" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Notes</label>
                                <textarea value={intForm.notes} onChange={(e) => updateIntField("notes", e.target.value)} rows={2} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none" />
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setIntModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleSaveInt} disabled={savingInt} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {savingInt && <Loader2 size={14} className="animate-spin" />}
                                {savingInt ? "Saving..." : intEditingId ? "Update" : "Schedule"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Requisition Confirmation ── */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">Delete Requisition?</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">This will permanently delete <strong>{deleteTarget.title}</strong> and all associated candidates.</p>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleDeleteReq} disabled={deleteReq.isPending} className="flex-1 py-3 rounded-xl bg-danger-600 hover:bg-danger-700 text-white text-sm font-bold transition-colors disabled:opacity-50">{deleteReq.isPending ? "Deleting..." : "Delete"}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Candidate Detail Modal ── */}
            {candDetailTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">Candidate Details</h2>
                            <button onClick={() => setCandDetailTarget(null)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center text-lg font-bold text-accent-700 dark:text-accent-400">
                                    {(candDetailTarget.firstName?.charAt(0) ?? "") + (candDetailTarget.lastName?.charAt(0) ?? "")}
                                </div>
                                <div>
                                    <p className="font-bold text-primary-950 dark:text-white text-lg">{[candDetailTarget.firstName, candDetailTarget.lastName].filter(Boolean).join(" ")}</p>
                                    <StageBadge stage={candDetailTarget.stage ?? "Applied"} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-xs text-neutral-400 block mb-0.5">Email</span>
                                    <p className="font-semibold text-primary-950 dark:text-white">{candDetailTarget.email || "—"}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-neutral-400 block mb-0.5">Phone</span>
                                    <p className="font-semibold text-primary-950 dark:text-white">{candDetailTarget.phone || "—"}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-neutral-400 block mb-0.5">Experience</span>
                                    <p className="font-semibold text-primary-950 dark:text-white">{candDetailTarget.experience ? `${candDetailTarget.experience} years` : "—"}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-neutral-400 block mb-0.5">Current Company</span>
                                    <p className="font-semibold text-primary-950 dark:text-white">{candDetailTarget.currentCompany || "—"}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-neutral-400 block mb-0.5">Source</span>
                                    <p className="font-semibold text-primary-950 dark:text-white">{candDetailTarget.source || "—"}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-neutral-400 block mb-0.5">Applied</span>
                                    <p className="font-semibold text-primary-950 dark:text-white">{formatDate(candDetailTarget.createdAt)}</p>
                                </div>
                            </div>
                            {candDetailTarget.notes && (
                                <div>
                                    <span className="text-xs text-neutral-400 block mb-0.5">Notes</span>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400 italic">"{candDetailTarget.notes}"</p>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setCandDetailTarget(null)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
