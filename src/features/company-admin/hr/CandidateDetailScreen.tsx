import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { R2Link } from '@/components/R2Link';
import { useCompanyFormatter } from "@/hooks/useCompanyFormatter";
import { useCanPerform } from "@/hooks/useCanPerform";
import {
    ArrowLeft,
    Plus,
    Edit3,
    Trash2,
    Loader2,
    X,
    Star,
    GraduationCap,
    Briefcase,
    FileText,
    Video,
    Send,
    Clock,
    CheckCircle2,
    XCircle,
    UserCheck,
    History,
    ExternalLink,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFileUpload } from "@/hooks/useFileUpload";
import { FileUploadZone } from "@/components/FileUploadZone";
import {
    useCandidate,
    useCandidateEducation,
    useCandidateExperience,
    useCandidateDocuments,
    useInterviews,
    useOffers,
    useInterviewEvaluations,
} from "@/features/company-admin/api/use-recruitment-queries";
import {
    useCreateCandidateEducation,
    useUpdateCandidateEducation,
    useDeleteCandidateEducation,
    useCreateCandidateExperience,
    useUpdateCandidateExperience,
    useDeleteCandidateExperience,
    useCreateCandidateDocument,
    useDeleteCandidateDocument,
    useSubmitInterviewEvaluations,
    useConvertCandidateToEmployee,
    useUpdateOfferStatus,
} from "@/features/company-admin/api/use-recruitment-mutations";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Constants ── */

const DOCUMENT_TYPES = [
    { value: "RESUME", label: "Resume" },
    { value: "COVER_LETTER", label: "Cover Letter" },
    { value: "CERTIFICATE", label: "Certificate" },
    { value: "ID_PROOF", label: "ID Proof" },
    { value: "PORTFOLIO", label: "Portfolio" },
];

const EVALUATION_DIMENSIONS = [
    "Technical Skills",
    "Communication",
    "Problem Solving",
    "Cultural Fit",
    "Domain Knowledge",
];

const RECOMMENDATION_OPTIONS = [
    { value: "STRONG_HIRE", label: "Strong Hire", cls: "text-success-700 bg-success-50 border-success-200" },
    { value: "HIRE", label: "Hire", cls: "text-success-600 bg-success-50/50 border-success-200" },
    { value: "MAYBE", label: "Maybe", cls: "text-warning-700 bg-warning-50 border-warning-200" },
    { value: "NO_HIRE", label: "No Hire", cls: "text-danger-600 bg-danger-50/50 border-danger-200" },
    { value: "STRONG_NO_HIRE", label: "Strong No Hire", cls: "text-danger-700 bg-danger-50 border-danger-200" },
];

const OFFER_STATUS_OPTIONS = [
    { value: "DRAFT", label: "Draft" },
    { value: "SENT", label: "Sent" },
    { value: "ACCEPTED", label: "Accepted" },
    { value: "REJECTED", label: "Rejected" },
    { value: "WITHDRAWN", label: "Withdrawn" },
    { value: "EXPIRED", label: "Expired" },
];

type BackgroundTab = "education" | "experience" | "documents";
type PipelineTab = "interviews" | "offers" | "history";

/* ── Empty Forms ── */

const EMPTY_EDUCATION = {
    qualification: "",
    degree: "",
    institution: "",
    university: "",
    yearOfPassing: "",
    percentage: "",
    certificateUrl: "",
};

const EMPTY_EXPERIENCE = {
    companyName: "",
    designation: "",
    fromDate: "",
    toDate: "",
    currentlyWorking: false,
    ctc: "",
    description: "",
};

const EMPTY_DOCUMENT = {
    documentType: "RESUME",
    fileName: "",
    fileUrl: "",
};

/* ── Badges ── */

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
        <span className={cn("text-xs font-bold px-3 py-1 rounded-full border capitalize", map[s] ?? map.applied)}>
            {stage}
        </span>
    );
}

function OfferStatusBadge({ status }: { status: string }) {
    const s = status?.toUpperCase();
    const map: Record<string, string> = {
        DRAFT: "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700",
        SENT: "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50",
        ACCEPTED: "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50",
        REJECTED: "bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50",
        WITHDRAWN: "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50",
        EXPIRED: "bg-neutral-100 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700",
    };
    const label = OFFER_STATUS_OPTIONS.find((o) => o.value === s)?.label ?? status;
    return (
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize", map[s] ?? map.DRAFT)}>
            {label}
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

function SourceBadge({ source }: { source: string | null | undefined }) {
    if (!source) return <span className="text-xs text-neutral-400">--</span>;
    return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-accent-50 text-accent-700 border-accent-200 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50">
            {source}
        </span>
    );
}

function RatingStars({ rating }: { rating: number | null | undefined }) {
    const r = rating ?? 0;
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
                <Star
                    key={i}
                    size={14}
                    className={cn(
                        i <= r ? "text-warning-500 fill-warning-500" : "text-neutral-300 dark:text-neutral-600"
                    )}
                />
            ))}
        </div>
    );
}

/* ── Evaluation Card for an Interview ── */

function EvaluationSection({ interviewId }: { interviewId: string }) {
    const fmt = useCompanyFormatter();
    const { data: evalData, isLoading } = useInterviewEvaluations(interviewId);
    const evaluations: any[] = evalData?.data ?? [];

    if (isLoading) return <div className="py-3 text-xs text-neutral-400">Loading evaluations...</div>;
    if (evaluations.length === 0) return <div className="py-3 text-xs text-neutral-400">No evaluations submitted yet.</div>;

    return (
        <div className="space-y-3 mt-3">
            {evaluations.map((ev: any) => (
                <div key={ev.id} className="p-3 bg-neutral-50 dark:bg-neutral-800/30 rounded-lg border border-neutral-100 dark:border-neutral-700/50">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">{ev.dimension}</span>
                        <div className="flex items-center gap-2">
                            <RatingStars rating={ev.rating} />
                            {ev.recommendation && (
                                <span className={cn(
                                    "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                                    RECOMMENDATION_OPTIONS.find(r => r.value === ev.recommendation)?.cls ?? "bg-neutral-100 text-neutral-600"
                                )}>
                                    {RECOMMENDATION_OPTIONS.find(r => r.value === ev.recommendation)?.label ?? ev.recommendation}
                                </span>
                            )}
                        </div>
                    </div>
                    {ev.comments && <p className="text-xs text-neutral-500 dark:text-neutral-400">{ev.comments}</p>}
                    <p className="text-[10px] text-neutral-400 mt-1">{fmt.dateTime(ev.createdAt)}</p>
                </div>
            ))}
        </div>
    );
}

/* ── Modal Wrapper ── */

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4">
                <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-neutral-800">
                    <h3 className="text-lg font-bold text-primary-950 dark:text-white">{title}</h3>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                        <X size={18} className="text-neutral-400" />
                    </button>
                </div>
                <div className="p-5">{children}</div>
            </div>
        </div>
    );
}

/* ── Screen ── */

export function CandidateDetailScreen() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const fmt = useCompanyFormatter();
    const canCreate = useCanPerform("hr:create");
    const canDelete = useCanPerform("hr:delete");

    const formatDate = (d: string | null | undefined) => (d ? fmt.date(d) : "--");
    const formatDateTime = (d: string | null | undefined) => (d ? fmt.dateTime(d) : "--");

    /* Data */
    const candidateQuery = useCandidate(id ?? "");
    const candidate = candidateQuery.data?.data;

    const educationQuery = useCandidateEducation(id ?? "");
    const educationList: any[] = educationQuery.data?.data ?? [];

    const experienceQuery = useCandidateExperience(id ?? "");
    const experienceList: any[] = experienceQuery.data?.data ?? [];

    const documentsQuery = useCandidateDocuments(id ?? "");
    const documentsList: any[] = documentsQuery.data?.data ?? [];

    const interviewsQuery = useInterviews({ candidateId: id });
    const interviewsList: any[] = interviewsQuery.data?.data ?? [];

    const offersQuery = useOffers({ candidateId: id });
    const offersList: any[] = offersQuery.data?.data ?? [];

    const stageHistory: any[] = candidate?.stageHistory ?? [];

    /* Mutations */
    const createEducation = useCreateCandidateEducation();
    const updateEducation = useUpdateCandidateEducation();
    const deleteEducation = useDeleteCandidateEducation();
    const createExperience = useCreateCandidateExperience();
    const updateExperience = useUpdateCandidateExperience();
    const deleteExperience = useDeleteCandidateExperience();
    const createDocument = useCreateCandidateDocument();
    const deleteDocument = useDeleteCandidateDocument();
    const { upload: uploadCandidateDoc, isUploading: isCandidateDocUploading, error: candidateDocUploadError, reset: resetCandidateDocUpload } = useFileUpload({
        category: 'candidate-document',
        entityId: id ?? 'new',
    });
    const submitEvaluation = useSubmitInterviewEvaluations();
    const convertToEmployee = useConvertCandidateToEmployee();
    const updateOfferStatus = useUpdateOfferStatus();

    /* Tabs */
    const [bgTab, setBgTab] = useState<BackgroundTab>("education");
    const [pipeTab, setPipeTab] = useState<PipelineTab>("interviews");

    /* Education Modal */
    const [eduModalOpen, setEduModalOpen] = useState(false);
    const [eduEditingId, setEduEditingId] = useState<string | null>(null);
    const [eduForm, setEduForm] = useState({ ...EMPTY_EDUCATION });

    /* Experience Modal */
    const [expModalOpen, setExpModalOpen] = useState(false);
    const [expEditingId, setExpEditingId] = useState<string | null>(null);
    const [expForm, setExpForm] = useState({ ...EMPTY_EXPERIENCE });

    /* Document Modal */
    const [docModalOpen, setDocModalOpen] = useState(false);
    const [docForm, setDocForm] = useState({ ...EMPTY_DOCUMENT });

    /* Evaluation Modal */
    const [evalModalOpen, setEvalModalOpen] = useState(false);
    const [evalInterviewId, setEvalInterviewId] = useState<string | null>(null);
    const [evalDimensions, setEvalDimensions] = useState<Array<{ dimension: string; rating: number; comments: string; recommendation: string }>>(
        EVALUATION_DIMENSIONS.map((d) => ({ dimension: d, rating: 0, comments: "", recommendation: "" }))
    );

    /* Expanded interviews (for showing evaluations inline) */
    const [expandedInterviews, setExpandedInterviews] = useState<Set<string>>(new Set());

    if (!id) return <div>Invalid candidate ID</div>;

    /* Handlers */
    const toggleInterview = (interviewId: string) => {
        setExpandedInterviews((prev) => {
            const next = new Set(prev);
            if (next.has(interviewId)) next.delete(interviewId);
            else next.add(interviewId);
            return next;
        });
    };

    const openAddEducation = () => {
        setEduEditingId(null);
        setEduForm({ ...EMPTY_EDUCATION });
        setEduModalOpen(true);
    };
    const openEditEducation = (edu: any) => {
        setEduEditingId(edu.id);
        setEduForm({
            qualification: edu.qualification ?? "",
            degree: edu.degree ?? "",
            institution: edu.institution ?? "",
            university: edu.university ?? "",
            yearOfPassing: edu.yearOfPassing?.toString() ?? "",
            percentage: edu.percentage?.toString() ?? "",
            certificateUrl: edu.certificateUrl ?? "",
        });
        setEduModalOpen(true);
    };
    const handleSaveEducation = () => {
        const payload: Record<string, unknown> = {
            qualification: eduForm.qualification || undefined,
            degree: eduForm.degree || undefined,
            institution: eduForm.institution || undefined,
            university: eduForm.university || undefined,
            yearOfPassing: eduForm.yearOfPassing ? parseInt(eduForm.yearOfPassing) : undefined,
            percentage: eduForm.percentage ? parseFloat(eduForm.percentage) : undefined,
            certificateUrl: eduForm.certificateUrl || undefined,
        };
        if (eduEditingId) {
            updateEducation.mutate(
                { id: eduEditingId, data: payload },
                {
                    onSuccess: () => { showSuccess("Education updated"); setEduModalOpen(false); },
                    onError: (e) => showApiError(e),
                }
            );
        } else {
            createEducation.mutate(
                { candidateId: id, data: payload },
                {
                    onSuccess: () => { showSuccess("Education added"); setEduModalOpen(false); },
                    onError: (e) => showApiError(e),
                }
            );
        }
    };
    const handleDeleteEducation = (eduId: string) => {
        deleteEducation.mutate(eduId, {
            onSuccess: () => showSuccess("Education deleted"),
            onError: (e) => showApiError(e),
        });
    };

    const openAddExperience = () => {
        setExpEditingId(null);
        setExpForm({ ...EMPTY_EXPERIENCE });
        setExpModalOpen(true);
    };
    const openEditExperience = (exp: any) => {
        setExpEditingId(exp.id);
        setExpForm({
            companyName: exp.companyName ?? "",
            designation: exp.designation ?? "",
            fromDate: exp.fromDate?.split("T")[0] ?? "",
            toDate: exp.toDate?.split("T")[0] ?? "",
            currentlyWorking: exp.currentlyWorking ?? false,
            ctc: exp.ctc?.toString() ?? "",
            description: exp.description ?? "",
        });
        setExpModalOpen(true);
    };
    const handleSaveExperience = () => {
        const payload: Record<string, unknown> = {
            companyName: expForm.companyName || undefined,
            designation: expForm.designation || undefined,
            fromDate: expForm.fromDate || undefined,
            toDate: expForm.currentlyWorking ? undefined : expForm.toDate || undefined,
            currentlyWorking: expForm.currentlyWorking,
            ctc: expForm.ctc ? parseFloat(expForm.ctc) : undefined,
            description: expForm.description || undefined,
        };
        if (expEditingId) {
            updateExperience.mutate(
                { id: expEditingId, data: payload },
                {
                    onSuccess: () => { showSuccess("Experience updated"); setExpModalOpen(false); },
                    onError: (e) => showApiError(e),
                }
            );
        } else {
            createExperience.mutate(
                { candidateId: id, data: payload },
                {
                    onSuccess: () => { showSuccess("Experience added"); setExpModalOpen(false); },
                    onError: (e) => showApiError(e),
                }
            );
        }
    };
    const handleDeleteExperience = (expId: string) => {
        deleteExperience.mutate(expId, {
            onSuccess: () => showSuccess("Experience deleted"),
            onError: (e) => showApiError(e),
        });
    };

    const openAddDocument = () => {
        setDocForm({ ...EMPTY_DOCUMENT });
        resetCandidateDocUpload();
        setDocModalOpen(true);
    };
    const handleSaveDocument = () => {
        createDocument.mutate(
            { candidateId: id, data: { documentType: docForm.documentType, fileName: docForm.fileName, fileUrl: docForm.fileUrl } },
            {
                onSuccess: () => { showSuccess("Document added"); setDocModalOpen(false); },
                onError: (e) => showApiError(e),
            }
        );
    };
    const handleDeleteDocument = (docId: string) => {
        deleteDocument.mutate(docId, {
            onSuccess: () => showSuccess("Document deleted"),
            onError: (e) => showApiError(e),
        });
    };

    const openEvaluation = (interviewId: string) => {
        setEvalInterviewId(interviewId);
        setEvalDimensions(EVALUATION_DIMENSIONS.map((d) => ({ dimension: d, rating: 0, comments: "", recommendation: "" })));
        setEvalModalOpen(true);
    };
    const handleSubmitEvaluation = () => {
        if (!evalInterviewId) return;
        submitEvaluation.mutate(
            { interviewId: evalInterviewId, data: { evaluations: evalDimensions } },
            {
                onSuccess: () => { showSuccess("Evaluation submitted"); setEvalModalOpen(false); },
                onError: (e) => showApiError(e),
            }
        );
    };

    const handleConvertToEmployee = () => {
        if (!id) return;
        convertToEmployee.mutate(id, {
            onSuccess: () => showSuccess("Candidate converted to employee"),
            onError: (e) => showApiError(e),
        });
    };

    const handleOfferStatusChange = (offerId: string, status: string) => {
        updateOfferStatus.mutate(
            { id: offerId, data: { status } },
            {
                onSuccess: () => showSuccess("Offer status updated"),
                onError: (e) => showApiError(e),
            }
        );
    };

    /* Loading & Error */
    if (candidateQuery.isLoading) {
        return (
            <div className="p-8">
                <SkeletonTable rows={5} cols={3} />
            </div>
        );
    }

    if (!candidate) {
        return (
            <div className="p-8">
                <EmptyState icon="list" title="Candidate not found" message="This candidate may have been deleted or the link is invalid." />
            </div>
        );
    }

    const candidateName = candidate.name || [candidate.firstName, candidate.lastName].filter(Boolean).join(" ") || "Unknown";
    const initials = candidateName.split(" ").map((w: string) => w.charAt(0)).join("").slice(0, 2).toUpperCase();
    const isHired = candidate.stage?.toLowerCase() === "hired";

    return (
        <div className="space-y-6 pb-8">
            {/* Back Button */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-sm text-neutral-500 hover:text-primary-600 dark:text-neutral-400 dark:hover:text-primary-400 transition-colors"
            >
                <ArrowLeft size={16} />
                Back to Candidates
            </button>

            {/* ── Profile Card ── */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-500 to-primary-500 flex items-center justify-center shrink-0 text-xl font-bold text-white">
                        {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-1">
                            <h1 className="text-2xl font-bold text-primary-950 dark:text-white">{candidateName}</h1>
                            <StageBadge stage={candidate.stage ?? "Applied"} />
                            <SourceBadge source={candidate.source} />
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-500 dark:text-neutral-400">
                            {candidate.email && <span>{candidate.email}</span>}
                            {candidate.phone && <span>{candidate.phone}</span>}
                            {candidate.experience && <span>{candidate.experience} yrs experience</span>}
                            {candidate.currentCompany && <span>at {candidate.currentCompany}</span>}
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                            <RatingStars rating={candidate.rating} />
                            {candidate.requisition?.title && (
                                <span className="text-xs text-neutral-400">
                                    Requisition: <span className="font-medium text-neutral-600 dark:text-neutral-300">{candidate.requisition.title}</span>
                                </span>
                            )}
                        </div>
                    </div>
                    {isHired && canCreate && (
                        <button
                            onClick={handleConvertToEmployee}
                            disabled={convertToEmployee.isPending}
                            className="flex items-center gap-2 px-4 py-2.5 bg-success-600 text-white rounded-xl font-bold text-sm hover:bg-success-700 transition-colors disabled:opacity-50 shrink-0"
                        >
                            {convertToEmployee.isPending ? <Loader2 size={16} className="animate-spin" /> : <UserCheck size={16} />}
                            Convert to Employee
                        </button>
                    )}
                </div>
            </div>

            {/* ── Tab Group 1: Background ── */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm">
                <div className="flex items-center gap-1 p-1.5 border-b border-neutral-100 dark:border-neutral-800">
                    {([
                        { key: "education" as const, label: "Education", icon: GraduationCap },
                        { key: "experience" as const, label: "Experience", icon: Briefcase },
                        { key: "documents" as const, label: "Documents", icon: FileText },
                    ]).map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setBgTab(tab.key)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors",
                                    bgTab === tab.key
                                        ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                                        : "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:text-neutral-300 dark:hover:bg-neutral-800/50"
                                )}
                            >
                                <Icon size={16} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                <div className="p-5">
                    {/* Education Tab */}
                    {bgTab === "education" && (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Education Records</h3>
                                {canCreate && (
                                    <button onClick={openAddEducation} className="flex items-center gap-1.5 text-xs font-bold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 px-3 py-1.5 rounded-lg transition-colors">
                                        <Plus size={14} /> Add Education
                                    </button>
                                )}
                            </div>
                            {educationQuery.isLoading ? (
                                <SkeletonTable rows={3} cols={4} />
                            ) : educationList.length === 0 ? (
                                <EmptyState icon="list" title="No education records" message="Add education details for this candidate." />
                            ) : (
                                <div className="space-y-3">
                                    {educationList.map((edu: any) => (
                                        <div key={edu.id} className="flex items-start justify-between p-4 bg-neutral-50 dark:bg-neutral-800/30 rounded-xl border border-neutral-100 dark:border-neutral-700/50">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-sm text-primary-950 dark:text-white">{edu.degree || edu.qualification || "Degree"}</span>
                                                    {edu.yearOfPassing && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400">{edu.yearOfPassing}</span>}
                                                </div>
                                                <p className="text-xs text-neutral-600 dark:text-neutral-400">{edu.institution || "--"}</p>
                                                {edu.university && <p className="text-xs text-neutral-500 dark:text-neutral-400">University: {edu.university}</p>}
                                                {edu.percentage && <p className="text-xs text-neutral-500">Score: {edu.percentage}%</p>}
                                                {edu.certificateUrl && (
                                                    <R2Link fileKey={edu.certificateUrl} className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline mt-1">
                                                        <ExternalLink size={10} /> View Certificate
                                                    </R2Link>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                {canCreate && (
                                                    <button onClick={() => openEditEducation(edu)} className="p-1.5 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors">
                                                        <Edit3 size={14} />
                                                    </button>
                                                )}
                                                {canDelete && (
                                                    <button onClick={() => handleDeleteEducation(edu.id)} className="p-1.5 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors">
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Experience Tab */}
                    {bgTab === "experience" && (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Work Experience</h3>
                                {canCreate && (
                                    <button onClick={openAddExperience} className="flex items-center gap-1.5 text-xs font-bold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 px-3 py-1.5 rounded-lg transition-colors">
                                        <Plus size={14} /> Add Experience
                                    </button>
                                )}
                            </div>
                            {experienceQuery.isLoading ? (
                                <SkeletonTable rows={3} cols={4} />
                            ) : experienceList.length === 0 ? (
                                <EmptyState icon="list" title="No experience records" message="Add work experience for this candidate." />
                            ) : (
                                <div className="space-y-3">
                                    {experienceList.map((exp: any) => (
                                        <div key={exp.id} className="flex items-start justify-between p-4 bg-neutral-50 dark:bg-neutral-800/30 rounded-xl border border-neutral-100 dark:border-neutral-700/50">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-sm text-primary-950 dark:text-white">{exp.designation || "Role"}</span>
                                                    {exp.currentlyWorking && (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success-50 text-success-700 border border-success-200">Current</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-neutral-600 dark:text-neutral-400">{exp.companyName || "--"}</p>
                                                <p className="text-xs text-neutral-500 mt-1">
                                                    {formatDate(exp.fromDate)} - {exp.currentlyWorking ? "Present" : formatDate(exp.toDate)}
                                                </p>
                                                {exp.ctc && <p className="text-xs text-neutral-500">CTC: {Number(exp.ctc).toLocaleString()}</p>}
                                                {exp.description && <p className="text-xs text-neutral-500 mt-1">{exp.description}</p>}
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                {canCreate && (
                                                    <button onClick={() => openEditExperience(exp)} className="p-1.5 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors">
                                                        <Edit3 size={14} />
                                                    </button>
                                                )}
                                                {canDelete && (
                                                    <button onClick={() => handleDeleteExperience(exp.id)} className="p-1.5 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors">
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Documents Tab */}
                    {bgTab === "documents" && (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Documents</h3>
                                {canCreate && (
                                    <button onClick={openAddDocument} className="flex items-center gap-1.5 text-xs font-bold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 px-3 py-1.5 rounded-lg transition-colors">
                                        <Plus size={14} /> Add Document
                                    </button>
                                )}
                            </div>
                            {documentsQuery.isLoading ? (
                                <SkeletonTable rows={3} cols={3} />
                            ) : documentsList.length === 0 ? (
                                <EmptyState icon="list" title="No documents" message="Upload documents for this candidate." />
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-neutral-100 dark:border-neutral-800 text-[10px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                                                <th className="py-3 px-4 font-bold text-left">Type</th>
                                                <th className="py-3 px-4 font-bold text-left">File Name</th>
                                                <th className="py-3 px-4 font-bold text-left">Link</th>
                                                <th className="py-3 px-4 font-bold text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-sm">
                                            {documentsList.map((doc: any) => (
                                                <tr key={doc.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                                    <td className="py-3 px-4">
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-accent-50 text-accent-700 border-accent-200 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50">
                                                            {DOCUMENT_TYPES.find((t) => t.value === doc.documentType)?.label ?? doc.documentType}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-neutral-700 dark:text-neutral-300 font-medium">{doc.fileName || "--"}</td>
                                                    <td className="py-3 px-4">
                                                        {doc.fileUrl ? (
                                                            <R2Link fileKey={doc.fileUrl} className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline">
                                                                <ExternalLink size={10} /> Open
                                                            </R2Link>
                                                        ) : "--"}
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        {canDelete && (
                                                            <button onClick={() => handleDeleteDocument(doc.id)} className="p-1.5 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors">
                                                                <Trash2 size={14} />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Tab Group 2: Hiring Pipeline ── */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm">
                <div className="flex items-center gap-1 p-1.5 border-b border-neutral-100 dark:border-neutral-800">
                    {([
                        { key: "interviews" as const, label: "Interviews", icon: Video },
                        { key: "offers" as const, label: "Offers", icon: Send },
                        { key: "history" as const, label: "Stage History", icon: History },
                    ]).map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setPipeTab(tab.key)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors",
                                    pipeTab === tab.key
                                        ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                                        : "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:text-neutral-300 dark:hover:bg-neutral-800/50"
                                )}
                            >
                                <Icon size={16} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                <div className="p-5">
                    {/* Interviews Tab */}
                    {pipeTab === "interviews" && (
                        <div>
                            {interviewsQuery.isLoading ? (
                                <SkeletonTable rows={3} cols={4} />
                            ) : interviewsList.length === 0 ? (
                                <EmptyState icon="list" title="No interviews" message="No interviews have been scheduled for this candidate." />
                            ) : (
                                <div className="space-y-3">
                                    {interviewsList.map((iv: any) => (
                                        <div key={iv.id} className="p-4 bg-neutral-50 dark:bg-neutral-800/30 rounded-xl border border-neutral-100 dark:border-neutral-700/50">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                                        <span className="font-bold text-sm text-primary-950 dark:text-white">Round: {iv.type || iv.round || "Interview"}</span>
                                                        <InterviewStatusBadge status={iv.status ?? "Scheduled"} />
                                                    </div>
                                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                                        Scheduled: {formatDateTime(iv.scheduledAt)}
                                                        {iv.duration && <span className="ml-2">({iv.duration} mins)</span>}
                                                    </p>
                                                    {iv.location && <p className="text-xs text-neutral-500 mt-0.5">Location: {iv.location}</p>}
                                                    {iv.meetingLink && (
                                                        <a href={iv.meetingLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline mt-0.5">
                                                            <ExternalLink size={10} /> Join Meeting
                                                        </a>
                                                    )}
                                                    {iv.interviewers && iv.interviewers.length > 0 && (
                                                        <p className="text-xs text-neutral-400 mt-1">
                                                            Panelists: {iv.interviewers.map((p: any) => p.employee?.firstName || p.name || "Unknown").join(", ")}
                                                        </p>
                                                    )}
                                                    {iv.feedbackNotes && (
                                                        <div className="mt-2 p-2 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-100 dark:border-neutral-700/50">
                                                            <p className="text-[10px] font-bold text-neutral-400 uppercase mb-1">Feedback</p>
                                                            <p className="text-xs text-neutral-600 dark:text-neutral-400">{iv.feedbackNotes}</p>
                                                            {iv.feedbackRating && <RatingStars rating={iv.feedbackRating} />}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    {canCreate && iv.status?.toLowerCase() === "completed" && (
                                                        <button
                                                            onClick={() => openEvaluation(iv.id)}
                                                            className="flex items-center gap-1 text-xs font-bold text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-900/30 px-2.5 py-1.5 rounded-lg transition-colors"
                                                        >
                                                            <Star size={12} /> Evaluate
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => toggleInterview(iv.id)}
                                                        className="p-1.5 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700/50 rounded-lg transition-colors"
                                                        title="Toggle evaluations"
                                                    >
                                                        {expandedInterviews.has(iv.id) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                    </button>
                                                </div>
                                            </div>
                                            {expandedInterviews.has(iv.id) && <EvaluationSection interviewId={iv.id} />}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Offers Tab */}
                    {pipeTab === "offers" && (
                        <div>
                            {offersQuery.isLoading ? (
                                <SkeletonTable rows={3} cols={5} />
                            ) : offersList.length === 0 ? (
                                <EmptyState icon="list" title="No offers" message="No offers have been made for this candidate." />
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-neutral-100 dark:border-neutral-800 text-[10px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                                                <th className="py-3 px-4 font-bold text-left">CTC</th>
                                                <th className="py-3 px-4 font-bold text-left">Department</th>
                                                <th className="py-3 px-4 font-bold text-left">Designation</th>
                                                <th className="py-3 px-4 font-bold text-left">Joining Date</th>
                                                <th className="py-3 px-4 font-bold text-left">Valid Until</th>
                                                <th className="py-3 px-4 font-bold text-center">Status</th>
                                                <th className="py-3 px-4 font-bold text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-sm">
                                            {offersList.map((o: any) => (
                                                <tr key={o.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                                    <td className="py-3 px-4 font-bold text-primary-950 dark:text-white">
                                                        {o.offeredCtc ? Number(o.offeredCtc).toLocaleString() : "--"}
                                                    </td>
                                                    <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400">
                                                        {o.department?.name ?? "--"}
                                                    </td>
                                                    <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400">
                                                        {o.designation?.title ?? "--"}
                                                    </td>
                                                    <td className="py-3 px-4 text-xs text-neutral-500">{formatDate(o.joiningDate)}</td>
                                                    <td className="py-3 px-4 text-xs text-neutral-500">{formatDate(o.validUntil)}</td>
                                                    <td className="py-3 px-4 text-center"><OfferStatusBadge status={o.status ?? "DRAFT"} /></td>
                                                    <td className="py-3 px-4 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            {o.status === "DRAFT" && canCreate && (
                                                                <button
                                                                    onClick={() => handleOfferStatusChange(o.id, "SENT")}
                                                                    className="p-1.5 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                                                                    title="Send Offer"
                                                                >
                                                                    <Send size={14} />
                                                                </button>
                                                            )}
                                                            {o.status === "SENT" && canCreate && (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleOfferStatusChange(o.id, "ACCEPTED")}
                                                                        className="p-1.5 text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20 rounded-lg transition-colors"
                                                                        title="Accept"
                                                                    >
                                                                        <CheckCircle2 size={14} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleOfferStatusChange(o.id, "REJECTED")}
                                                                        className="p-1.5 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors"
                                                                        title="Reject"
                                                                    >
                                                                        <XCircle size={14} />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Stage History Tab */}
                    {pipeTab === "history" && (
                        <div>
                            {stageHistory.length === 0 ? (
                                <EmptyState icon="list" title="No stage history" message="Stage transitions will appear here." />
                            ) : (
                                <div className="relative">
                                    <div className="absolute left-[18px] top-0 bottom-0 w-0.5 bg-neutral-200 dark:bg-neutral-700" />
                                    <div className="space-y-4">
                                        {stageHistory.map((sh: any, idx: number) => (
                                            <div key={sh.id ?? idx} className="relative flex items-start gap-4 pl-10">
                                                <div className="absolute left-[12px] top-1 w-3 h-3 rounded-full border-2 border-primary-500 bg-white dark:bg-neutral-900 z-10" />
                                                <div className="flex-1 p-3 bg-neutral-50 dark:bg-neutral-800/30 rounded-xl border border-neutral-100 dark:border-neutral-700/50">
                                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                                        {sh.fromStage && (
                                                            <span className="text-xs text-neutral-500">{sh.fromStage}</span>
                                                        )}
                                                        {sh.fromStage && sh.toStage && (
                                                            <span className="text-xs text-neutral-400">→</span>
                                                        )}
                                                        <span className="text-xs font-bold text-primary-700 dark:text-primary-400">{sh.toStage || sh.stage || "Stage"}</span>
                                                    </div>
                                                    {sh.reason && <p className="text-xs text-neutral-600 dark:text-neutral-400">{sh.reason}</p>}
                                                    {sh.notes && <p className="text-xs text-neutral-500 mt-0.5">{sh.notes}</p>}
                                                    <div className="flex items-center gap-3 mt-1 text-[10px] text-neutral-400">
                                                        <span>{formatDateTime(sh.changedAt ?? sh.createdAt)}</span>
                                                        {sh.changedBy && <span>by {sh.changedBy.firstName || sh.changedBy.name || "Unknown"}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Education Modal ── */}
            <Modal open={eduModalOpen} onClose={() => setEduModalOpen(false)} title={eduEditingId ? "Edit Education" : "Add Education"}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-neutral-500 mb-1">Qualification</label>
                        <input
                            value={eduForm.qualification}
                            onChange={(e) => setEduForm((f) => ({ ...f, qualification: e.target.value }))}
                            className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:text-white"
                            placeholder="e.g., B.Tech, MBA"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-neutral-500 mb-1">Degree</label>
                        <input
                            value={eduForm.degree}
                            onChange={(e) => setEduForm((f) => ({ ...f, degree: e.target.value }))}
                            className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:text-white"
                            placeholder="e.g., Computer Science"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 mb-1">Institution</label>
                            <input
                                value={eduForm.institution}
                                onChange={(e) => setEduForm((f) => ({ ...f, institution: e.target.value }))}
                                className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:text-white"
                                placeholder="College/School"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 mb-1">University</label>
                            <input
                                value={eduForm.university}
                                onChange={(e) => setEduForm((f) => ({ ...f, university: e.target.value }))}
                                className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:text-white"
                                placeholder="University"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 mb-1">Year of Passing</label>
                            <input
                                value={eduForm.yearOfPassing}
                                onChange={(e) => setEduForm((f) => ({ ...f, yearOfPassing: e.target.value }))}
                                className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:text-white"
                                placeholder="2024"
                                type="number"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 mb-1">Percentage/CGPA</label>
                            <input
                                value={eduForm.percentage}
                                onChange={(e) => setEduForm((f) => ({ ...f, percentage: e.target.value }))}
                                className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:text-white"
                                placeholder="85.5"
                                type="number"
                                step="0.1"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-neutral-500 mb-1">Certificate URL</label>
                        <input
                            value={eduForm.certificateUrl}
                            onChange={(e) => setEduForm((f) => ({ ...f, certificateUrl: e.target.value }))}
                            className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:text-white"
                            placeholder="https://..."
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button onClick={() => setEduModalOpen(false)} className="px-4 py-2.5 text-sm font-bold text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors">
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveEducation}
                            disabled={createEducation.isPending || updateEducation.isPending}
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl font-bold text-sm hover:bg-primary-700 transition-colors disabled:opacity-50"
                        >
                            {(createEducation.isPending || updateEducation.isPending) && <Loader2 size={14} className="animate-spin" />}
                            {eduEditingId ? "Update" : "Add"}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* ── Experience Modal ── */}
            <Modal open={expModalOpen} onClose={() => setExpModalOpen(false)} title={expEditingId ? "Edit Experience" : "Add Experience"}>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 mb-1">Company Name</label>
                            <input
                                value={expForm.companyName}
                                onChange={(e) => setExpForm((f) => ({ ...f, companyName: e.target.value }))}
                                className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:text-white"
                                placeholder="Company"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 mb-1">Designation</label>
                            <input
                                value={expForm.designation}
                                onChange={(e) => setExpForm((f) => ({ ...f, designation: e.target.value }))}
                                className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:text-white"
                                placeholder="Role"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 mb-1">From Date</label>
                            <input
                                value={expForm.fromDate}
                                onChange={(e) => setExpForm((f) => ({ ...f, fromDate: e.target.value }))}
                                className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:text-white"
                                type="date"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 mb-1">To Date</label>
                            <input
                                value={expForm.toDate}
                                onChange={(e) => setExpForm((f) => ({ ...f, toDate: e.target.value }))}
                                className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:text-white"
                                type="date"
                                disabled={expForm.currentlyWorking}
                            />
                        </div>
                    </div>
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={expForm.currentlyWorking}
                            onChange={(e) => setExpForm((f) => ({ ...f, currentlyWorking: e.target.checked }))}
                            className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-neutral-600 dark:text-neutral-400">Currently Working</span>
                    </label>
                    <div>
                        <label className="block text-xs font-bold text-neutral-500 mb-1">CTC</label>
                        <input
                            value={expForm.ctc}
                            onChange={(e) => setExpForm((f) => ({ ...f, ctc: e.target.value }))}
                            className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:text-white"
                            placeholder="Annual CTC"
                            type="number"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-neutral-500 mb-1">Description</label>
                        <textarea
                            value={expForm.description}
                            onChange={(e) => setExpForm((f) => ({ ...f, description: e.target.value }))}
                            className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:text-white resize-none"
                            rows={3}
                            placeholder="Role description..."
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button onClick={() => setExpModalOpen(false)} className="px-4 py-2.5 text-sm font-bold text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors">
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveExperience}
                            disabled={createExperience.isPending || updateExperience.isPending}
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl font-bold text-sm hover:bg-primary-700 transition-colors disabled:opacity-50"
                        >
                            {(createExperience.isPending || updateExperience.isPending) && <Loader2 size={14} className="animate-spin" />}
                            {expEditingId ? "Update" : "Add"}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* ── Document Modal ── */}
            <Modal open={docModalOpen} onClose={() => setDocModalOpen(false)} title="Add Document">
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-neutral-500 mb-1">Document Type</label>
                        <select
                            value={docForm.documentType}
                            onChange={(e) => setDocForm((f) => ({ ...f, documentType: e.target.value }))}
                            className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:text-white"
                        >
                            {DOCUMENT_TYPES.map((t) => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-neutral-500 mb-1">File</label>
                        <FileUploadZone
                            onFileSelected={async (file) => {
                                const key = await uploadCandidateDoc(file);
                                if (key) {
                                    setDocForm((f) => ({ ...f, fileUrl: key, fileName: file.name }));
                                }
                            }}
                            isUploading={isCandidateDocUploading}
                            uploadedFileName={docForm.fileName || null}
                            error={candidateDocUploadError}
                            onClear={() => {
                                setDocForm((f) => ({ ...f, fileUrl: '', fileName: '' }));
                                resetCandidateDocUpload();
                            }}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button onClick={() => setDocModalOpen(false)} className="px-4 py-2.5 text-sm font-bold text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors">
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveDocument}
                            disabled={createDocument.isPending || isCandidateDocUploading || !docForm.fileUrl || !docForm.documentType}
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl font-bold text-sm hover:bg-primary-700 transition-colors disabled:opacity-50"
                        >
                            {createDocument.isPending && <Loader2 size={14} className="animate-spin" />}
                            Add
                        </button>
                    </div>
                </div>
            </Modal>

            {/* ── Evaluation Modal ── */}
            <Modal open={evalModalOpen} onClose={() => setEvalModalOpen(false)} title="Submit Evaluation">
                <div className="space-y-5">
                    {evalDimensions.map((dim, idx) => (
                        <div key={dim.dimension} className="p-4 bg-neutral-50 dark:bg-neutral-800/30 rounded-xl border border-neutral-100 dark:border-neutral-700/50">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300">{dim.dimension}</span>
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((r) => (
                                        <button
                                            key={r}
                                            onClick={() => {
                                                setEvalDimensions((prev) => prev.map((d, i) => i === idx ? { ...d, rating: r } : d));
                                            }}
                                            className="p-0.5"
                                        >
                                            <Star
                                                size={18}
                                                className={cn(
                                                    r <= dim.rating ? "text-warning-500 fill-warning-500" : "text-neutral-300 dark:text-neutral-600",
                                                    "transition-colors"
                                                )}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <textarea
                                value={dim.comments}
                                onChange={(e) => {
                                    setEvalDimensions((prev) => prev.map((d, i) => i === idx ? { ...d, comments: e.target.value } : d));
                                }}
                                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:text-white resize-none mb-2"
                                rows={2}
                                placeholder="Comments..."
                            />
                            <select
                                value={dim.recommendation}
                                onChange={(e) => {
                                    setEvalDimensions((prev) => prev.map((d, i) => i === idx ? { ...d, recommendation: e.target.value } : d));
                                }}
                                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:text-white"
                            >
                                <option value="">Select Recommendation</option>
                                {RECOMMENDATION_OPTIONS.map((r) => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                            </select>
                        </div>
                    ))}
                    <div className="flex justify-end gap-3 pt-2">
                        <button onClick={() => setEvalModalOpen(false)} className="px-4 py-2.5 text-sm font-bold text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors">
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmitEvaluation}
                            disabled={submitEvaluation.isPending}
                            className="flex items-center gap-2 px-5 py-2.5 bg-accent-600 text-white rounded-xl font-bold text-sm hover:bg-accent-700 transition-colors disabled:opacity-50"
                        >
                            {submitEvaluation.isPending && <Loader2 size={14} className="animate-spin" />}
                            Submit Evaluation
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
