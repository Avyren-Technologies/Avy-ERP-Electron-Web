import { useState } from "react";
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import {
    GraduationCap,
    Plus,
    Edit3,
    Trash2,
    Loader2,
    X,
    Search,
    BookOpen,
    Award,
    Clock,
    Users,
    Calendar,
    Filter,
    CheckCircle2,
    XCircle,
    Play,
    Square,
    ClipboardList,
    UserCheck,
    Star,
    Layers,
    DollarSign,
    FileText,
    Link,
    Video,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFileUpload } from '@/hooks/useFileUpload';
import { FileUploadZone } from '@/components/FileUploadZone';
import {
    useTrainingCatalogue,
    useTrainingNominations,
    useTrainingSessions,
    useTrainers,
    useSessionAttendance,
    useTrainingPrograms,
    useTrainingProgram,
    useProgramEnrollments,
    useTrainingBudgets,
    useBudgetUtilization,
    useTrainingMaterials,
} from "@/features/company-admin/api/use-recruitment-queries";
import { useEmployees, useDepartments } from "@/features/company-admin/api/use-hr-queries";
import {
    useCreateTrainingCatalogue,
    useUpdateTrainingCatalogue,
    useDeleteTrainingCatalogue,
    useCreateTrainingNomination,
    useUpdateTrainingNomination,
    useCreateTrainingSession,
    useUpdateTrainingSession,
    useUpdateTrainingSessionStatus,
    useDeleteTrainingSession,
    useRegisterSessionAttendees,
    useBulkMarkAttendance,
    useCreateTrainer,
    useUpdateTrainer,
    useDeleteTrainer,
    useCreateTrainingProgram,
    useUpdateTrainingProgram,
    useDeleteTrainingProgram,
    useAddProgramCourse,
    useRemoveProgramCourse,
    useEnrollInProgram,
    useCreateTrainingBudget,
    useUpdateTrainingBudget,
    useCreateTrainingMaterial,
    useUpdateTrainingMaterial,
    useDeleteTrainingMaterial,
} from "@/features/company-admin/api/use-recruitment-mutations";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Constants ── */

const DELIVERY_MODES = ["Classroom", "Online", "Hybrid", "On-the-Job", "Workshop", "Seminar"];
const CATEGORIES = ["Technical", "Soft Skills", "Compliance", "Leadership", "Safety", "Product", "Process"];
const NOM_STATUSES = ["All", "Nominated", "Approved", "In Progress", "Completed", "Cancelled"];
const SESSION_STATUSES = ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
const ATTENDANCE_STATUSES = ["REGISTERED", "PRESENT", "ABSENT", "LATE", "EXCUSED"];

const EMPTY_COURSE = {
    name: "",
    code: "",
    category: "Technical",
    deliveryMode: "Online",
    duration: "",
    durationUnit: "hours",
    maxParticipants: "",
    provider: "",
    cost: "",
    description: "",
    objectives: "",
    isActive: true,
};

const EMPTY_NOMINATION = {
    courseId: "",
    employeeId: "",
    batchDate: "",
    status: "Nominated",
    notes: "",
    completionDate: "",
    score: "",
    feedback: "",
};

const EMPTY_SESSION = {
    trainingId: "",
    batchName: "",
    startDateTime: "",
    endDateTime: "",
    venue: "",
    meetingLink: "",
    maxParticipants: "",
    trainerId: "",
};

const EMPTY_TRAINER = {
    name: "",
    email: "",
    phone: "",
    specializations: "",
    qualifications: "",
    experienceYears: "",
    isInternal: false,
    employeeId: "",
};

const PROGRAM_CATEGORIES = ["CERTIFICATION", "SKILL_DEVELOPMENT", "COMPLIANCE", "ONBOARDING"];
const PROGRAM_LEVELS = ["Beginner", "Intermediate", "Advanced"];
const ENROLLMENT_STATUSES = ["ENROLLED", "IN_PROGRESS", "COMPLETED", "FAILED", "ABANDONED"];
const MATERIAL_TYPES = ["PDF", "VIDEO", "LINK", "DOCUMENT", "PRESENTATION", "AUDIO"];

const EMPTY_PROGRAM = {
    name: "",
    description: "",
    category: "SKILL_DEVELOPMENT",
    level: "Beginner",
    totalDuration: "",
    isCompulsory: false,
};

const EMPTY_BUDGET = {
    fiscalYear: "",
    departmentId: "",
    allocatedAmount: "",
};

const EMPTY_ADD_COURSE = {
    trainingId: "",
    sequenceOrder: "",
    isPrerequisite: false,
    minPassScore: "",
};

const EMPTY_MATERIAL = {
    name: "",
    type: "PDF",
    url: "",
    description: "",
    sequenceOrder: "",
    isMandatory: false,
};

/* ── Badges ── */

function NomStatusBadge({ status }: { status: string }) {
    const s = status?.toLowerCase();
    const map: Record<string, { icon: typeof Clock; cls: string }> = {
        nominated: { icon: Clock, cls: "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50" },
        approved: { icon: CheckCircle2, cls: "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50" },
        "in progress": { icon: Clock, cls: "bg-accent-50 text-accent-700 border-accent-200 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50" },
        completed: { icon: CheckCircle2, cls: "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50" },
        cancelled: { icon: XCircle, cls: "bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50" },
    };
    const c = map[s] ?? map.nominated;
    const Icon = c.icon;
    return (
        <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize", c.cls)}>
            <Icon size={10} />
            {status}
        </span>
    );
}

function SessionStatusBadge({ status }: { status: string }) {
    const map: Record<string, { icon: typeof Clock; cls: string }> = {
        SCHEDULED: { icon: Calendar, cls: "bg-info-50 text-info-700 border-info-200 dark:bg-info-900/20 dark:text-info-400 dark:border-info-800/50" },
        IN_PROGRESS: { icon: Play, cls: "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50" },
        COMPLETED: { icon: CheckCircle2, cls: "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50" },
        CANCELLED: { icon: XCircle, cls: "bg-neutral-100 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700" },
    };
    const c = map[status] ?? map.SCHEDULED;
    const Icon = c.icon;
    const label = status.replace(/_/g, ' ');
    return (
        <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase", c.cls)}>
            <Icon size={10} />
            {label}
        </span>
    );
}

function AttendanceStatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        REGISTERED: "bg-info-50 text-info-700 border-info-200 dark:bg-info-900/20 dark:text-info-400",
        PRESENT: "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400",
        ABSENT: "bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400",
        LATE: "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400",
        EXCUSED: "bg-neutral-100 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400",
    };
    return (
        <span className={cn("inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase", map[status] ?? map.REGISTERED)}>
            {status}
        </span>
    );
}

function ProgramCategoryBadge({ category }: { category: string }) {
    const map: Record<string, string> = {
        CERTIFICATION: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800/50",
        SKILL_DEVELOPMENT: "bg-info-50 text-info-700 border-info-200 dark:bg-info-900/20 dark:text-info-400 dark:border-info-800/50",
        COMPLIANCE: "bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50",
        ONBOARDING: "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50",
    };
    return (
        <span className={cn("inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase", map[category] ?? map.SKILL_DEVELOPMENT)}>
            {category.replace(/_/g, ' ')}
        </span>
    );
}

function EnrollmentStatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        ENROLLED: "bg-info-50 text-info-700 border-info-200 dark:bg-info-900/20 dark:text-info-400 dark:border-info-800/50",
        IN_PROGRESS: "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50",
        COMPLETED: "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50",
        FAILED: "bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50",
        ABANDONED: "bg-neutral-100 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700",
    };
    return (
        <span className={cn("inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase", map[status] ?? map.ENROLLED)}>
            {status.replace(/_/g, ' ')}
        </span>
    );
}

function MaterialTypeBadge({ type }: { type: string }) {
    const map: Record<string, { icon: typeof FileText; cls: string }> = {
        PDF: { icon: FileText, cls: "bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400" },
        VIDEO: { icon: Video, cls: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400" },
        LINK: { icon: Link, cls: "bg-info-50 text-info-700 border-info-200 dark:bg-info-900/20 dark:text-info-400" },
        DOCUMENT: { icon: FileText, cls: "bg-accent-50 text-accent-700 border-accent-200 dark:bg-accent-900/20 dark:text-accent-400" },
        PRESENTATION: { icon: Layers, cls: "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400" },
        AUDIO: { icon: Play, cls: "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400" },
    };
    const c = map[type] ?? map.DOCUMENT;
    const Icon = c.icon;
    return (
        <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border", c.cls)}>
            <Icon size={10} />
            {type}
        </span>
    );
}

/* ── Screen ── */

type TabKey = "catalogue" | "nominations" | "sessions" | "trainers" | "programs" | "budgets";

export function TrainingCatalogueScreen() {
    const fmt = useCompanyFormatter();
    const formatDate = (d: string | null | undefined) => d ? fmt.date(d) : "\u2014";
    const formatDateTime = (d: string | null | undefined) => d ? fmt.dateTime(d) : "\u2014";
    const [activeTab, setActiveTab] = useState<TabKey>("catalogue");
    const [search, setSearch] = useState("");
    const [nomStatusFilter, setNomStatusFilter] = useState("All");

    const [courseModalOpen, setCourseModalOpen] = useState(false);
    const [courseEditingId, setCourseEditingId] = useState<string | null>(null);
    const [courseForm, setCourseForm] = useState({ ...EMPTY_COURSE });
    const [deleteTarget, setDeleteTarget] = useState<any>(null);

    const [nomModalOpen, setNomModalOpen] = useState(false);
    const [nomEditingId, setNomEditingId] = useState<string | null>(null);
    const [nomForm, setNomForm] = useState({ ...EMPTY_NOMINATION });

    const [sessionModalOpen, setSessionModalOpen] = useState(false);
    const [sessionEditingId, setSessionEditingId] = useState<string | null>(null);
    const [sessionForm, setSessionForm] = useState({ ...EMPTY_SESSION });
    const [deleteSessionTarget, setDeleteSessionTarget] = useState<any>(null);
    const [cancelSessionTarget, setCancelSessionTarget] = useState<any>(null);
    const [cancelReason, setCancelReason] = useState("");

    const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
    const [attendanceSessionId, setAttendanceSessionId] = useState("");
    const [registerEmployeeIds, setRegisterEmployeeIds] = useState<string[]>([]);
    const [attendanceUpdates, setAttendanceUpdates] = useState<Record<string, string>>({});

    const [trainerModalOpen, setTrainerModalOpen] = useState(false);
    const [trainerEditingId, setTrainerEditingId] = useState<string | null>(null);
    const [trainerForm, setTrainerForm] = useState({ ...EMPTY_TRAINER });
    const [deleteTrainerTarget, setDeleteTrainerTarget] = useState<any>(null);

    // Programs state
    const [programModalOpen, setProgramModalOpen] = useState(false);
    const [programEditingId, setProgramEditingId] = useState<string | null>(null);
    const [programForm, setProgramForm] = useState({ ...EMPTY_PROGRAM });
    const [deleteProgramTarget, setDeleteProgramTarget] = useState<any>(null);
    const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
    const [addCourseForm, setAddCourseForm] = useState({ ...EMPTY_ADD_COURSE });
    const [enrollModalOpen, setEnrollModalOpen] = useState(false);
    const [enrollEmployeeIds, setEnrollEmployeeIds] = useState<string[]>([]);

    // Budgets state
    const [budgetModalOpen, setBudgetModalOpen] = useState(false);
    const [budgetEditingId, setBudgetEditingId] = useState<string | null>(null);
    const [budgetForm, setBudgetForm] = useState({ ...EMPTY_BUDGET });
    const [budgetFiscalYear, setBudgetFiscalYear] = useState("");

    // Materials state
    const [materialsTrainingId, setMaterialsTrainingId] = useState<string | null>(null);
    const [materialModalOpen, setMaterialModalOpen] = useState(false);
    const [materialEditingId, setMaterialEditingId] = useState<string | null>(null);
    const [materialForm, setMaterialForm] = useState({ ...EMPTY_MATERIAL });
    const [deleteMaterialTarget, setDeleteMaterialTarget] = useState<any>(null);

    const catQuery = useTrainingCatalogue();
    const nomQuery = useTrainingNominations(nomStatusFilter !== "All" ? { status: nomStatusFilter.toLowerCase() } : undefined);
    const sessionsQuery = useTrainingSessions();
    const trainersQuery = useTrainers();
    const employeesQuery = useEmployees();
    const attendanceQuery = useSessionAttendance(attendanceSessionId);

    const createCourse = useCreateTrainingCatalogue();
    const updateCourse = useUpdateTrainingCatalogue();
    const deleteCourse = useDeleteTrainingCatalogue();
    const createNom = useCreateTrainingNomination();
    const updateNom = useUpdateTrainingNomination();
    const createSession = useCreateTrainingSession();
    const updateSession = useUpdateTrainingSession();
    const updateSessionStatus = useUpdateTrainingSessionStatus();
    const deleteSession = useDeleteTrainingSession();
    const registerAttendees = useRegisterSessionAttendees();
    const bulkMark = useBulkMarkAttendance();
    const createTrainerMut = useCreateTrainer();
    const updateTrainerMut = useUpdateTrainer();
    const deleteTrainerMut = useDeleteTrainer();

    // Programs
    const programsQuery = useTrainingPrograms();
    const selectedProgram = useTrainingProgram(selectedProgramId ?? "");
    const enrollmentsQuery = useProgramEnrollments(selectedProgramId ?? "");
    const createProgramMut = useCreateTrainingProgram();
    const updateProgramMut = useUpdateTrainingProgram();
    const deleteProgramMut = useDeleteTrainingProgram();
    const addCourseMut = useAddProgramCourse();
    const removeCourseMut = useRemoveProgramCourse();
    const enrollMut = useEnrollInProgram();

    // Budgets
    const budgetsQuery = useTrainingBudgets();
    const utilizationQuery = useBudgetUtilization(budgetFiscalYear);
    const departmentsQuery = useDepartments();
    const createBudgetMut = useCreateTrainingBudget();
    const updateBudgetMut = useUpdateTrainingBudget();

    // Materials
    const materialsQuery = useTrainingMaterials(materialsTrainingId ?? "");
    const createMaterialMut = useCreateTrainingMaterial();
    const updateMaterialMut = useUpdateTrainingMaterial();
    const deleteMaterialMut = useDeleteTrainingMaterial();
    const { upload: uploadMaterial, isUploading: isMaterialUploading, error: materialUploadError, reset: resetMaterialUpload } = useFileUpload({
        category: 'training-material',
        entityId: materialsTrainingId ?? 'new',
    });

    const courses: any[] = catQuery.data?.data ?? [];
    const nominations: any[] = nomQuery.data?.data ?? [];
    const sessions: any[] = sessionsQuery.data?.data ?? [];
    const trainers: any[] = trainersQuery.data?.data ?? [];
    const employees: any[] = employeesQuery.data?.data ?? [];
    const attendanceRecords: any[] = attendanceQuery.data?.data ?? [];
    const programs: any[] = programsQuery.data?.data ?? [];
    const budgets: any[] = budgetsQuery.data?.data ?? [];
    const departments: any[] = departmentsQuery.data?.data ?? [];
    const materials: any[] = materialsQuery.data?.data ?? [];
    const programDetail: any = selectedProgram.data?.data ?? null;
    const enrollments: any[] = enrollmentsQuery.data?.data ?? [];
    const utilization: any[] = utilizationQuery.data?.data ?? [];

    const courseName = (id: string) => courses.find((c: any) => c.id === id)?.name ?? id;
    const employeeName = (id: string) => {
        const emp = employees.find((e: any) => e.id === id);
        if (!emp) return id;
        return [emp.firstName, emp.lastName].filter(Boolean).join(" ") || emp.fullName || emp.email || id;
    };
    const trainerName = (id: string) => trainers.find((t: any) => t.id === id)?.name ?? id;

    const filteredCourses = courses.filter((c: any) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return c.name?.toLowerCase().includes(s) || c.code?.toLowerCase().includes(s) || c.category?.toLowerCase().includes(s);
    });

    const filteredNoms = nominations.filter((n: any) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return courseName(n.courseId)?.toLowerCase().includes(s) || employeeName(n.employeeId)?.toLowerCase().includes(s);
    });

    const filteredSessions = sessions.filter((s: any) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return s.batchName?.toLowerCase().includes(q) || s.training?.name?.toLowerCase().includes(q) || s.venue?.toLowerCase().includes(q);
    });

    const filteredTrainers = trainers.filter((t: any) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return t.name?.toLowerCase().includes(q) || t.email?.toLowerCase().includes(q) || t.specializations?.some((s: string) => s.toLowerCase().includes(q));
    });

    /* ── Course Handlers ── */
    const openCreateCourse = () => { setCourseEditingId(null); setCourseForm({ ...EMPTY_COURSE }); setCourseModalOpen(true); };
    const openEditCourse = (c: any) => {
        setCourseEditingId(c.id);
        setCourseForm({
            name: c.name ?? "", code: c.code ?? "", category: c.category ?? "Technical",
            deliveryMode: c.deliveryMode ?? "Online", duration: c.duration ?? "", durationUnit: c.durationUnit ?? "hours",
            maxParticipants: c.maxParticipants ?? "", provider: c.provider ?? "", cost: c.cost ?? "",
            description: c.description ?? "", objectives: c.objectives ?? "", isActive: c.isActive ?? true,
        });
        setCourseModalOpen(true);
    };
    const handleSaveCourse = async () => {
        try {
            if (courseEditingId) {
                await updateCourse.mutateAsync({ id: courseEditingId, data: courseForm });
                showSuccess("Course Updated", `${courseForm.name} has been updated.`);
            } else {
                await createCourse.mutateAsync(courseForm);
                showSuccess("Course Created", `${courseForm.name} has been created.`);
            }
            setCourseModalOpen(false);
        } catch (err) { showApiError(err); }
    };
    const handleDeleteCourse = async () => {
        if (!deleteTarget) return;
        try {
            await deleteCourse.mutateAsync(deleteTarget.id);
            showSuccess("Course Deleted", `${deleteTarget.name} has been removed.`);
            setDeleteTarget(null);
        } catch (err) { showApiError(err); }
    };

    /* ── Nomination Handlers ── */
    const openCreateNom = () => { setNomEditingId(null); setNomForm({ ...EMPTY_NOMINATION }); setNomModalOpen(true); };
    const openEditNom = (n: any) => {
        setNomEditingId(n.id);
        setNomForm({
            courseId: n.courseId ?? "", employeeId: n.employeeId ?? "", batchDate: n.batchDate ?? "",
            status: n.status ?? "Nominated", notes: n.notes ?? "", completionDate: n.completionDate ?? "",
            score: n.score ?? "", feedback: n.feedback ?? "",
        });
        setNomModalOpen(true);
    };
    const handleSaveNom = async () => {
        try {
            if (nomEditingId) {
                await updateNom.mutateAsync({ id: nomEditingId, data: nomForm });
                showSuccess("Nomination Updated", "Training nomination has been updated.");
            } else {
                await createNom.mutateAsync(nomForm);
                showSuccess("Nomination Created", "Employee has been nominated for training.");
            }
            setNomModalOpen(false);
        } catch (err) { showApiError(err); }
    };

    /* ── Session Handlers ── */
    const openCreateSession = () => { setSessionEditingId(null); setSessionForm({ ...EMPTY_SESSION }); setSessionModalOpen(true); };
    const openEditSession = (s: any) => {
        setSessionEditingId(s.id);
        setSessionForm({
            trainingId: s.trainingId ?? s.training?.id ?? "",
            batchName: s.batchName ?? "",
            startDateTime: s.startDateTime ? s.startDateTime.slice(0, 16) : "",
            endDateTime: s.endDateTime ? s.endDateTime.slice(0, 16) : "",
            venue: s.venue ?? "",
            meetingLink: s.meetingLink ?? "",
            maxParticipants: s.maxParticipants ?? "",
            trainerId: s.trainerId ?? "",
        });
        setSessionModalOpen(true);
    };
    const handleSaveSession = async () => {
        try {
            const payload = {
                ...sessionForm,
                maxParticipants: sessionForm.maxParticipants ? Number(sessionForm.maxParticipants) : undefined,
                startDateTime: sessionForm.startDateTime ? new Date(sessionForm.startDateTime).toISOString() : undefined,
                endDateTime: sessionForm.endDateTime ? new Date(sessionForm.endDateTime).toISOString() : undefined,
            };
            if (sessionEditingId) {
                await updateSession.mutateAsync({ id: sessionEditingId, data: payload });
                showSuccess("Session Updated", `${sessionForm.batchName} has been updated.`);
            } else {
                await createSession.mutateAsync(payload);
                showSuccess("Session Created", `${sessionForm.batchName} has been created.`);
            }
            setSessionModalOpen(false);
        } catch (err) { showApiError(err); }
    };
    const handleDeleteSession = async () => {
        if (!deleteSessionTarget) return;
        try {
            await deleteSession.mutateAsync(deleteSessionTarget.id);
            showSuccess("Session Deleted", `${deleteSessionTarget.batchName} has been removed.`);
            setDeleteSessionTarget(null);
        } catch (err) { showApiError(err); }
    };
    const handleSessionStatusChange = async (id: string, status: string) => {
        try {
            if (status === "CANCELLED") {
                setCancelSessionTarget({ id });
                return;
            }
            await updateSessionStatus.mutateAsync({ id, data: { status } });
            showSuccess("Status Updated", `Session status changed to ${status.replace(/_/g, ' ')}.`);
        } catch (err) { showApiError(err); }
    };
    const handleCancelSession = async () => {
        if (!cancelSessionTarget) return;
        try {
            await updateSessionStatus.mutateAsync({ id: cancelSessionTarget.id, data: { status: "CANCELLED", cancelledReason: cancelReason } });
            showSuccess("Session Cancelled", "The session has been cancelled.");
            setCancelSessionTarget(null);
            setCancelReason("");
        } catch (err) { showApiError(err); }
    };

    /* ── Attendance Handlers ── */
    const openAttendance = (sessionId: string) => {
        setAttendanceSessionId(sessionId);
        setAttendanceUpdates({});
        setRegisterEmployeeIds([]);
        setAttendanceModalOpen(true);
    };
    const handleRegisterEmployees = async () => {
        if (!registerEmployeeIds.length) return;
        try {
            await registerAttendees.mutateAsync({ sessionId: attendanceSessionId, data: { employeeIds: registerEmployeeIds } });
            showSuccess("Registered", `${registerEmployeeIds.length} employee(s) registered.`);
            setRegisterEmployeeIds([]);
        } catch (err) { showApiError(err); }
    };
    const handleBulkMarkPresent = async () => {
        const records = attendanceRecords.map((a: any) => ({ id: a.id, status: "PRESENT" }));
        if (!records.length) return;
        try {
            await bulkMark.mutateAsync({ sessionId: attendanceSessionId, data: { records } });
            showSuccess("Attendance Marked", "All attendees marked as present.");
        } catch (err) { showApiError(err); }
    };
    const handleBulkSaveAttendance = async () => {
        const records = Object.entries(attendanceUpdates).map(([id, status]) => ({ id, status }));
        if (!records.length) return;
        try {
            await bulkMark.mutateAsync({ sessionId: attendanceSessionId, data: { records } });
            showSuccess("Attendance Saved", "Attendance has been updated.");
            setAttendanceUpdates({});
        } catch (err) { showApiError(err); }
    };

    /* ── Trainer Handlers ── */
    const openCreateTrainer = () => { setTrainerEditingId(null); setTrainerForm({ ...EMPTY_TRAINER }); setTrainerModalOpen(true); };
    const openEditTrainer = (t: any) => {
        setTrainerEditingId(t.id);
        setTrainerForm({
            name: t.name ?? "",
            email: t.email ?? "",
            phone: t.phone ?? "",
            specializations: Array.isArray(t.specializations) ? t.specializations.join(", ") : (t.specializations ?? ""),
            qualifications: t.qualifications ?? "",
            experienceYears: t.experienceYears ?? "",
            isInternal: t.isInternal ?? false,
            employeeId: t.employeeId ?? "",
        });
        setTrainerModalOpen(true);
    };
    const handleSaveTrainer = async () => {
        try {
            const payload = {
                ...trainerForm,
                specializations: trainerForm.specializations ? trainerForm.specializations.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
                experienceYears: trainerForm.experienceYears ? Number(trainerForm.experienceYears) : undefined,
                employeeId: trainerForm.isInternal && trainerForm.employeeId ? trainerForm.employeeId : undefined,
            };
            if (trainerEditingId) {
                await updateTrainerMut.mutateAsync({ id: trainerEditingId, data: payload });
                showSuccess("Trainer Updated", `${trainerForm.name} has been updated.`);
            } else {
                await createTrainerMut.mutateAsync(payload);
                showSuccess("Trainer Created", `${trainerForm.name} has been added.`);
            }
            setTrainerModalOpen(false);
        } catch (err) { showApiError(err); }
    };
    const handleDeleteTrainer = async () => {
        if (!deleteTrainerTarget) return;
        try {
            await deleteTrainerMut.mutateAsync(deleteTrainerTarget.id);
            showSuccess("Trainer Deactivated", `${deleteTrainerTarget.name} has been deactivated.`);
            setDeleteTrainerTarget(null);
        } catch (err) { showApiError(err); }
    };

    /* ── Program Handlers ── */
    const openCreateProgram = () => { setProgramEditingId(null); setProgramForm({ ...EMPTY_PROGRAM }); setProgramModalOpen(true); };
    const openEditProgram = (p: any) => {
        setProgramEditingId(p.id);
        setProgramForm({
            name: p.name ?? "", description: p.description ?? "", category: p.category ?? "SKILL_DEVELOPMENT",
            level: p.level ?? "Beginner", totalDuration: p.totalDuration ?? "", isCompulsory: p.isCompulsory ?? false,
        });
        setProgramModalOpen(true);
    };
    const handleSaveProgram = async () => {
        try {
            const payload = { ...programForm, totalDuration: programForm.totalDuration ? Number(programForm.totalDuration) : undefined };
            if (programEditingId) {
                await updateProgramMut.mutateAsync({ id: programEditingId, data: payload });
                showSuccess("Program Updated", `${programForm.name} has been updated.`);
            } else {
                await createProgramMut.mutateAsync(payload);
                showSuccess("Program Created", `${programForm.name} has been created.`);
            }
            setProgramModalOpen(false);
        } catch (err) { showApiError(err); }
    };
    const handleDeleteProgram = async () => {
        if (!deleteProgramTarget) return;
        try {
            await deleteProgramMut.mutateAsync(deleteProgramTarget.id);
            showSuccess("Program Deleted", `${deleteProgramTarget.name} has been removed.`);
            setDeleteProgramTarget(null);
            if (selectedProgramId === deleteProgramTarget.id) setSelectedProgramId(null);
        } catch (err) { showApiError(err); }
    };
    const handleAddCourseToProgram = async () => {
        if (!selectedProgramId || !addCourseForm.trainingId) return;
        try {
            await addCourseMut.mutateAsync({
                programId: selectedProgramId,
                data: {
                    trainingId: addCourseForm.trainingId,
                    sequenceOrder: addCourseForm.sequenceOrder ? Number(addCourseForm.sequenceOrder) : 1,
                    isPrerequisite: addCourseForm.isPrerequisite,
                    minPassScore: addCourseForm.minPassScore ? Number(addCourseForm.minPassScore) : undefined,
                },
            });
            showSuccess("Course Added", "Course added to program.");
            setAddCourseForm({ ...EMPTY_ADD_COURSE });
        } catch (err) { showApiError(err); }
    };
    const handleRemoveCourse = async (courseId: string) => {
        if (!selectedProgramId) return;
        try {
            await removeCourseMut.mutateAsync({ programId: selectedProgramId, courseId });
            showSuccess("Course Removed", "Course removed from program.");
        } catch (err) { showApiError(err); }
    };
    const handleEnroll = async () => {
        if (!selectedProgramId || !enrollEmployeeIds.length) return;
        try {
            await enrollMut.mutateAsync({ programId: selectedProgramId, data: { employeeIds: enrollEmployeeIds } });
            showSuccess("Enrolled", `${enrollEmployeeIds.length} employee(s) enrolled.`);
            setEnrollEmployeeIds([]);
            setEnrollModalOpen(false);
        } catch (err) { showApiError(err); }
    };

    /* ── Budget Handlers ── */
    const openCreateBudget = () => { setBudgetEditingId(null); setBudgetForm({ ...EMPTY_BUDGET }); setBudgetModalOpen(true); };
    const openEditBudget = (b: any) => {
        setBudgetEditingId(b.id);
        setBudgetForm({
            fiscalYear: b.fiscalYear ?? "",
            departmentId: b.departmentId ?? "",
            allocatedAmount: b.allocatedAmount ?? "",
        });
        setBudgetModalOpen(true);
    };
    const handleSaveBudget = async () => {
        try {
            const payload = {
                fiscalYear: budgetForm.fiscalYear,
                departmentId: budgetForm.departmentId || undefined,
                allocatedAmount: budgetForm.allocatedAmount ? Number(budgetForm.allocatedAmount) : 0,
            };
            if (budgetEditingId) {
                await updateBudgetMut.mutateAsync({ id: budgetEditingId, data: payload });
                showSuccess("Budget Updated", "Training budget has been updated.");
            } else {
                await createBudgetMut.mutateAsync(payload);
                showSuccess("Budget Created", "Training budget has been created.");
            }
            setBudgetModalOpen(false);
        } catch (err) { showApiError(err); }
    };

    /* ── Material Handlers ── */
    const openMaterials = (trainingId: string) => { setMaterialsTrainingId(trainingId); };
    const closeMaterials = () => { setMaterialsTrainingId(null); };
    const openCreateMaterial = () => { setMaterialEditingId(null); setMaterialForm({ ...EMPTY_MATERIAL }); resetMaterialUpload(); setMaterialModalOpen(true); };
    const openEditMaterial = (m: any) => {
        setMaterialEditingId(m.id);
        setMaterialForm({
            name: m.name ?? "", type: m.type ?? "PDF", url: m.url ?? "",
            description: m.description ?? "", sequenceOrder: m.sequenceOrder ?? "", isMandatory: m.isMandatory ?? false,
        });
        setMaterialModalOpen(true);
    };
    const handleSaveMaterial = async () => {
        if (!materialsTrainingId) return;
        try {
            const payload = {
                ...materialForm,
                sequenceOrder: materialForm.sequenceOrder ? Number(materialForm.sequenceOrder) : 1,
            };
            if (materialEditingId) {
                await updateMaterialMut.mutateAsync({ id: materialEditingId, data: payload });
                showSuccess("Material Updated", `${materialForm.name} has been updated.`);
            } else {
                await createMaterialMut.mutateAsync({ trainingId: materialsTrainingId, data: payload });
                showSuccess("Material Created", `${materialForm.name} has been added.`);
            }
            setMaterialModalOpen(false);
        } catch (err) { showApiError(err); }
    };
    const handleDeleteMaterial = async () => {
        if (!deleteMaterialTarget) return;
        try {
            await deleteMaterialMut.mutateAsync(deleteMaterialTarget.id);
            showSuccess("Material Deleted", `${deleteMaterialTarget.name} has been removed.`);
            setDeleteMaterialTarget(null);
        } catch (err) { showApiError(err); }
    };

    const savingCourse = createCourse.isPending || updateCourse.isPending;
    const savingNom = createNom.isPending || updateNom.isPending;
    const savingSession = createSession.isPending || updateSession.isPending;
    const savingTrainer = createTrainerMut.isPending || updateTrainerMut.isPending;
    const updateCourseField = (key: string, value: any) => setCourseForm((p) => ({ ...p, [key]: value }));
    const updateNomField = (key: string, value: any) => setNomForm((p) => ({ ...p, [key]: value }));
    const updateSessionField = (key: string, value: any) => setSessionForm((p) => ({ ...p, [key]: value }));
    const updateTrainerField = (key: string, value: any) => setTrainerForm((p) => ({ ...p, [key]: value }));
    const savingProgram = createProgramMut.isPending || updateProgramMut.isPending;
    const savingBudget = createBudgetMut.isPending || updateBudgetMut.isPending;
    const savingMaterial = createMaterialMut.isPending || updateMaterialMut.isPending;
    const updateProgramField = (key: string, value: any) => setProgramForm((p) => ({ ...p, [key]: value }));
    const updateBudgetField = (key: string, value: any) => setBudgetForm((p) => ({ ...p, [key]: value }));
    const updateAddCourseField = (key: string, value: any) => setAddCourseForm((p) => ({ ...p, [key]: value }));
    const updateMaterialField = (key: string, value: any) => setMaterialForm((p) => ({ ...p, [key]: value }));
    const departmentName = (id: string) => departments.find((d: any) => d.id === id)?.name ?? "Company-wide";

    const getAddButtonConfig = (): { label: string; onClick: () => void } => {
        switch (activeTab) {
            case "catalogue": return { label: "New Course", onClick: openCreateCourse };
            case "nominations": return { label: "Nominate", onClick: openCreateNom };
            case "sessions": return { label: "New Session", onClick: openCreateSession };
            case "trainers": return { label: "New Trainer", onClick: openCreateTrainer };
            case "programs": return { label: "New Program", onClick: openCreateProgram };
            case "budgets": return { label: "New Budget", onClick: openCreateBudget };
        }
    };

    const addBtn = getAddButtonConfig();

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Training</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Manage training programmes, sessions, and trainers</p>
                </div>
                <button
                    onClick={addBtn.onClick}
                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
                >
                    <Plus className="w-5 h-5" />
                    {addBtn.label}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl w-fit">
                {([
                    { key: "catalogue" as TabKey, icon: BookOpen, label: "Catalogue" },
                    { key: "nominations" as TabKey, icon: Award, label: "Nominations" },
                    { key: "sessions" as TabKey, icon: Calendar, label: "Sessions" },
                    { key: "trainers" as TabKey, icon: UserCheck, label: "Trainers" },
                    { key: "programs" as TabKey, icon: Layers, label: "Programs" },
                    { key: "budgets" as TabKey, icon: DollarSign, label: "Budgets" },
                ]).map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => { setActiveTab(tab.key); setSearch(""); }}
                        className={cn("px-5 py-2 rounded-lg text-sm font-bold transition-all", activeTab === tab.key ? "bg-white dark:bg-neutral-700 text-primary-700 dark:text-primary-400 shadow-sm" : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300")}
                    >
                        <span className="flex items-center gap-2"><tab.icon size={14} />{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                    <input type="text" placeholder={`Search ${activeTab}...`} value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                </div>
                {activeTab === "nominations" && (
                    <div className="flex items-center gap-2">
                        <Filter size={14} className="text-neutral-400 flex-shrink-0" />
                        <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 whitespace-nowrap">Status:</span>
                        <select value={nomStatusFilter} onChange={(e) => setNomStatusFilter(e.target.value)} className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-semibold text-neutral-700 dark:text-neutral-300 focus:outline-none">
                            {NOM_STATUSES.map((f) => <option key={f} value={f}>{f}</option>)}
                        </select>
                    </div>
                )}
            </div>

            {/* ── Catalogue Tab ── */}
            {activeTab === "catalogue" && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                    {catQuery.isLoading ? <SkeletonTable rows={6} cols={8} /> : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[1100px]">
                                <thead>
                                    <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                        <th className="py-4 px-6 font-bold">Course</th>
                                        <th className="py-4 px-6 font-bold">Code</th>
                                        <th className="py-4 px-6 font-bold">Category</th>
                                        <th className="py-4 px-6 font-bold">Mode</th>
                                        <th className="py-4 px-6 font-bold">Duration</th>
                                        <th className="py-4 px-6 font-bold">Provider</th>
                                        <th className="py-4 px-6 font-bold text-right">Cost</th>
                                        <th className="py-4 px-6 font-bold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {filteredCourses.map((c: any) => (
                                        <tr key={c.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                                                        <GraduationCap className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-primary-950 dark:text-white">{c.name}</span>
                                                        {!c.isActive && <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500">Inactive</span>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-xs font-mono text-neutral-600 dark:text-neutral-400">{c.code || "\u2014"}</td>
                                            <td className="py-4 px-6"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-50 text-accent-700 border border-accent-200 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50">{c.category}</span></td>
                                            <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">{c.deliveryMode || "\u2014"}</td>
                                            <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">{c.duration ? `${c.duration} ${c.durationUnit || "hrs"}` : "\u2014"}</td>
                                            <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">{c.provider || "\u2014"}</td>
                                            <td className="py-4 px-6 text-right font-semibold text-primary-950 dark:text-white">{c.cost ? `₹${Number(c.cost).toLocaleString("en-IN")}` : "\u2014"}</td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => openMaterials(c.id)} className="p-2 text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-900/20 rounded-lg transition-colors" title="Materials"><FileText size={15} /></button>
                                                    <button onClick={() => openEditCourse(c)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit"><Edit3 size={15} /></button>
                                                    <button onClick={() => setDeleteTarget(c)} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" title="Delete"><Trash2 size={15} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredCourses.length === 0 && !catQuery.isLoading && (
                                        <tr><td colSpan={8}><EmptyState icon="list" title="No courses found" message="Create your first training course." action={{ label: "New Course", onClick: openCreateCourse }} /></td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ── Nominations Tab ── */}
            {activeTab === "nominations" && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                    {nomQuery.isLoading ? <SkeletonTable rows={6} cols={7} /> : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[1000px]">
                                <thead>
                                    <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                        <th className="py-4 px-6 font-bold">Employee</th>
                                        <th className="py-4 px-6 font-bold">Course</th>
                                        <th className="py-4 px-6 font-bold">Batch Date</th>
                                        <th className="py-4 px-6 font-bold text-center">Status</th>
                                        <th className="py-4 px-6 font-bold">Completed</th>
                                        <th className="py-4 px-6 font-bold text-center">Score</th>
                                        <th className="py-4 px-6 font-bold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {filteredNoms.map((n: any) => (
                                        <tr key={n.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center shrink-0 text-xs font-bold text-accent-700 dark:text-accent-400">
                                                        {employeeName(n.employeeId).charAt(0)}
                                                    </div>
                                                    <span className="font-bold text-primary-950 dark:text-white">{employeeName(n.employeeId)}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">{courseName(n.courseId)}</td>
                                            <td className="py-4 px-6 text-xs text-neutral-600 dark:text-neutral-400">{formatDate(n.batchDate)}</td>
                                            <td className="py-4 px-6 text-center"><NomStatusBadge status={n.status ?? "Nominated"} /></td>
                                            <td className="py-4 px-6 text-xs text-neutral-600 dark:text-neutral-400">{formatDate(n.completionDate)}</td>
                                            <td className="py-4 px-6 text-center font-semibold text-primary-950 dark:text-white">{n.score ?? "\u2014"}</td>
                                            <td className="py-4 px-6 text-right">
                                                <button onClick={() => openEditNom(n)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit"><Edit3 size={15} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredNoms.length === 0 && !nomQuery.isLoading && (
                                        <tr><td colSpan={7}><EmptyState icon="list" title="No nominations found" message="Nominate employees for training programmes." action={{ label: "Nominate", onClick: openCreateNom }} /></td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ── Sessions Tab ── */}
            {activeTab === "sessions" && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                    {sessionsQuery.isLoading ? <SkeletonTable rows={6} cols={9} /> : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[1200px]">
                                <thead>
                                    <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                        <th className="py-4 px-6 font-bold">Batch Name</th>
                                        <th className="py-4 px-6 font-bold">Training</th>
                                        <th className="py-4 px-6 font-bold">Start Date</th>
                                        <th className="py-4 px-6 font-bold">End Date</th>
                                        <th className="py-4 px-6 font-bold">Venue</th>
                                        <th className="py-4 px-6 font-bold">Trainer</th>
                                        <th className="py-4 px-6 font-bold text-center">Status</th>
                                        <th className="py-4 px-6 font-bold text-center">Capacity</th>
                                        <th className="py-4 px-6 font-bold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {filteredSessions.map((s: any) => (
                                        <tr key={s.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-info-50 dark:bg-info-900/30 flex items-center justify-center shrink-0">
                                                        <Calendar className="w-4 h-4 text-info-600 dark:text-info-400" />
                                                    </div>
                                                    <span className="font-bold text-primary-950 dark:text-white">{s.batchName || "\u2014"}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">{s.training?.name ?? "\u2014"}</td>
                                            <td className="py-4 px-6 text-xs text-neutral-600 dark:text-neutral-400">{formatDateTime(s.startDateTime)}</td>
                                            <td className="py-4 px-6 text-xs text-neutral-600 dark:text-neutral-400">{formatDateTime(s.endDateTime)}</td>
                                            <td className="py-4 px-6 text-xs text-neutral-600 dark:text-neutral-400">{s.venue || "\u2014"}</td>
                                            <td className="py-4 px-6 text-xs text-neutral-600 dark:text-neutral-400">{s.trainer?.name ?? "\u2014"}</td>
                                            <td className="py-4 px-6 text-center"><SessionStatusBadge status={s.status ?? "SCHEDULED"} /></td>
                                            <td className="py-4 px-6 text-center font-semibold text-primary-950 dark:text-white">{s.maxParticipants ?? "\u2014"}</td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => openAttendance(s.id)} className="p-2 text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-900/20 rounded-lg transition-colors" title="Attendance"><ClipboardList size={15} /></button>
                                                    {s.status === "SCHEDULED" && (
                                                        <>
                                                            <button onClick={() => handleSessionStatusChange(s.id, "IN_PROGRESS")} className="p-2 text-warning-600 hover:bg-warning-50 dark:hover:bg-warning-900/20 rounded-lg transition-colors" title="Start"><Play size={15} /></button>
                                                            <button onClick={() => openEditSession(s)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit"><Edit3 size={15} /></button>
                                                            <button onClick={() => setDeleteSessionTarget(s)} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" title="Delete"><Trash2 size={15} /></button>
                                                        </>
                                                    )}
                                                    {s.status === "IN_PROGRESS" && (
                                                        <button onClick={() => handleSessionStatusChange(s.id, "COMPLETED")} className="p-2 text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20 rounded-lg transition-colors" title="Complete"><Square size={15} /></button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredSessions.length === 0 && !sessionsQuery.isLoading && (
                                        <tr><td colSpan={9}><EmptyState icon="list" title="No sessions found" message="Create your first training session." action={{ label: "New Session", onClick: openCreateSession }} /></td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ── Trainers Tab ── */}
            {activeTab === "trainers" && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                    {trainersQuery.isLoading ? <SkeletonTable rows={6} cols={7} /> : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[1000px]">
                                <thead>
                                    <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                        <th className="py-4 px-6 font-bold">Name</th>
                                        <th className="py-4 px-6 font-bold">Type</th>
                                        <th className="py-4 px-6 font-bold">Email</th>
                                        <th className="py-4 px-6 font-bold">Specializations</th>
                                        <th className="py-4 px-6 font-bold text-center">Rating</th>
                                        <th className="py-4 px-6 font-bold text-center">Sessions</th>
                                        <th className="py-4 px-6 font-bold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {filteredTrainers.map((t: any) => (
                                        <tr key={t.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0 text-xs font-bold text-primary-700 dark:text-primary-400">
                                                        {(t.name ?? "T").charAt(0)}
                                                    </div>
                                                    <span className="font-bold text-primary-950 dark:text-white">{t.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", t.isInternal ? "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50" : "bg-accent-50 text-accent-700 border-accent-200 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50")}>
                                                    {t.isInternal ? "Internal" : "External"}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-xs text-neutral-600 dark:text-neutral-400">{t.email || "\u2014"}</td>
                                            <td className="py-4 px-6">
                                                <div className="flex flex-wrap gap-1">
                                                    {(Array.isArray(t.specializations) ? t.specializations : []).slice(0, 3).map((s: string, i: number) => (
                                                        <span key={i} className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">{s}</span>
                                                    ))}
                                                    {(t.specializations?.length ?? 0) > 3 && <span className="text-[10px] text-neutral-400">+{t.specializations.length - 3}</span>}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                {t.averageRating != null ? (
                                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-warning-600 dark:text-warning-400">
                                                        <Star size={12} className="fill-warning-400" />
                                                        {Number(t.averageRating).toFixed(1)}
                                                    </span>
                                                ) : "\u2014"}
                                            </td>
                                            <td className="py-4 px-6 text-center font-semibold text-primary-950 dark:text-white">{t._count?.sessions ?? t.sessionsCount ?? "\u2014"}</td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => openEditTrainer(t)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit"><Edit3 size={15} /></button>
                                                    <button onClick={() => setDeleteTrainerTarget(t)} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" title="Deactivate"><Trash2 size={15} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredTrainers.length === 0 && !trainersQuery.isLoading && (
                                        <tr><td colSpan={7}><EmptyState icon="list" title="No trainers found" message="Add your first trainer." action={{ label: "New Trainer", onClick: openCreateTrainer }} /></td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ── Course Create/Edit Modal ── */}
            {courseModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{courseEditingId ? "Edit Course" : "New Course"}</h2>
                            <button onClick={() => setCourseModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Course Name</label>
                                    <input type="text" value={courseForm.name} onChange={(e) => updateCourseField("name", e.target.value)} placeholder="e.g., Advanced React" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Code</label>
                                    <input type="text" value={courseForm.code} onChange={(e) => updateCourseField("code", e.target.value)} placeholder="TRN-001" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Category</label>
                                    <select value={courseForm.category} onChange={(e) => updateCourseField("category", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Delivery Mode</label>
                                    <select value={courseForm.deliveryMode} onChange={(e) => updateCourseField("deliveryMode", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                        {DELIVERY_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Duration</label>
                                    <input type="number" value={courseForm.duration} onChange={(e) => updateCourseField("duration", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Unit</label>
                                    <select value={courseForm.durationUnit} onChange={(e) => updateCourseField("durationUnit", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                        <option value="hours">Hours</option>
                                        <option value="days">Days</option>
                                        <option value="weeks">Weeks</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Max Participants</label>
                                    <input type="number" value={courseForm.maxParticipants} onChange={(e) => updateCourseField("maxParticipants", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Provider</label>
                                    <input type="text" value={courseForm.provider} onChange={(e) => updateCourseField("provider", e.target.value)} placeholder="Training provider" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Cost (INR)</label>
                                    <input type="number" value={courseForm.cost} onChange={(e) => updateCourseField("cost", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Description</label>
                                <textarea value={courseForm.description} onChange={(e) => updateCourseField("description", e.target.value)} rows={2} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Objectives</label>
                                <textarea value={courseForm.objectives} onChange={(e) => updateCourseField("objectives", e.target.value)} rows={2} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none" />
                            </div>
                            <div className="flex items-center justify-between py-2 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl px-4 border border-neutral-200 dark:border-neutral-700">
                                <span className="text-sm font-medium text-primary-950 dark:text-white">Active</span>
                                <button type="button" onClick={() => updateCourseField("isActive", !courseForm.isActive)} className={cn("w-10 h-6 rounded-full transition-colors relative", courseForm.isActive ? "bg-primary-600" : "bg-neutral-300 dark:bg-neutral-700")}>
                                    <div className={cn("w-4 h-4 rounded-full bg-white absolute top-1 transition-all", courseForm.isActive ? "left-5" : "left-1")} />
                                </button>
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setCourseModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleSaveCourse} disabled={savingCourse} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {savingCourse && <Loader2 size={14} className="animate-spin" />}
                                {savingCourse ? "Saving..." : courseEditingId ? "Update" : "Create"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Nomination Create/Edit Modal ── */}
            {nomModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{nomEditingId ? "Edit Nomination" : "Nominate Employee"}</h2>
                            <button onClick={() => setNomModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Course</label>
                                <select value={nomForm.courseId} onChange={(e) => updateNomField("courseId", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                    <option value="">Select course...</option>
                                    {courses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Employee</label>
                                <select value={nomForm.employeeId} onChange={(e) => updateNomField("employeeId", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                    <option value="">Select employee...</option>
                                    {employees.map((e: any) => <option key={e.id} value={e.id}>{[e.firstName, e.lastName].filter(Boolean).join(" ") || e.email}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Batch Date</label>
                                    <input type="date" value={nomForm.batchDate} onChange={(e) => updateNomField("batchDate", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Status</label>
                                    <select value={nomForm.status} onChange={(e) => updateNomField("status", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                        {NOM_STATUSES.filter((s) => s !== "All").map((s) => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                            {(nomForm.status === "Completed") && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Completion Date</label>
                                        <input type="date" value={nomForm.completionDate} onChange={(e) => updateNomField("completionDate", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Score</label>
                                        <input type="text" value={nomForm.score} onChange={(e) => updateNomField("score", e.target.value)} placeholder="e.g., 85%" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                                    </div>
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Notes</label>
                                <textarea value={nomForm.notes} onChange={(e) => updateNomField("notes", e.target.value)} rows={2} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none" />
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setNomModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleSaveNom} disabled={savingNom} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {savingNom && <Loader2 size={14} className="animate-spin" />}
                                {savingNom ? "Saving..." : nomEditingId ? "Update" : "Nominate"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Session Create/Edit Modal ── */}
            {sessionModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{sessionEditingId ? "Edit Session" : "New Training Session"}</h2>
                            <button onClick={() => setSessionModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Training Programme</label>
                                <select value={sessionForm.trainingId} onChange={(e) => updateSessionField("trainingId", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                    <option value="">Select training...</option>
                                    {courses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Batch Name</label>
                                <input type="text" value={sessionForm.batchName} onChange={(e) => updateSessionField("batchName", e.target.value)} placeholder="e.g., Batch 2026-Q2" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Start Date & Time</label>
                                    <input type="datetime-local" value={sessionForm.startDateTime} onChange={(e) => updateSessionField("startDateTime", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">End Date & Time</label>
                                    <input type="datetime-local" value={sessionForm.endDateTime} onChange={(e) => updateSessionField("endDateTime", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Venue</label>
                                    <input type="text" value={sessionForm.venue} onChange={(e) => updateSessionField("venue", e.target.value)} placeholder="e.g., Conference Room A" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Meeting Link</label>
                                    <input type="url" value={sessionForm.meetingLink} onChange={(e) => updateSessionField("meetingLink", e.target.value)} placeholder="https://..." className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Max Participants</label>
                                    <input type="number" value={sessionForm.maxParticipants} onChange={(e) => updateSessionField("maxParticipants", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Trainer</label>
                                    <select value={sessionForm.trainerId} onChange={(e) => updateSessionField("trainerId", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                        <option value="">Select trainer...</option>
                                        {trainers.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setSessionModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleSaveSession} disabled={savingSession} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {savingSession && <Loader2 size={14} className="animate-spin" />}
                                {savingSession ? "Saving..." : sessionEditingId ? "Update" : "Create"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Trainer Create/Edit Modal ── */}
            {trainerModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{trainerEditingId ? "Edit Trainer" : "New Trainer"}</h2>
                            <button onClick={() => setTrainerModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div className="flex items-center justify-between py-2 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl px-4 border border-neutral-200 dark:border-neutral-700">
                                <span className="text-sm font-medium text-primary-950 dark:text-white">Internal Trainer</span>
                                <button type="button" onClick={() => updateTrainerField("isInternal", !trainerForm.isInternal)} className={cn("w-10 h-6 rounded-full transition-colors relative", trainerForm.isInternal ? "bg-primary-600" : "bg-neutral-300 dark:bg-neutral-700")}>
                                    <div className={cn("w-4 h-4 rounded-full bg-white absolute top-1 transition-all", trainerForm.isInternal ? "left-5" : "left-1")} />
                                </button>
                            </div>
                            {trainerForm.isInternal && (
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Employee</label>
                                    <select value={trainerForm.employeeId} onChange={(e) => {
                                        updateTrainerField("employeeId", e.target.value);
                                        const emp = employees.find((emp: any) => emp.id === e.target.value);
                                        if (emp) {
                                            updateTrainerField("name", [emp.firstName, emp.lastName].filter(Boolean).join(" ") || emp.fullName || "");
                                            updateTrainerField("email", emp.email || "");
                                        }
                                    }} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                        <option value="">Select employee...</option>
                                        {employees.map((e: any) => <option key={e.id} value={e.id}>{[e.firstName, e.lastName].filter(Boolean).join(" ") || e.email}</option>)}
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Name</label>
                                <input type="text" value={trainerForm.name} onChange={(e) => updateTrainerField("name", e.target.value)} placeholder="Full name" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Email</label>
                                    <input type="email" value={trainerForm.email} onChange={(e) => updateTrainerField("email", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Phone</label>
                                    <input type="tel" value={trainerForm.phone} onChange={(e) => updateTrainerField("phone", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Specializations (comma-separated)</label>
                                <input type="text" value={trainerForm.specializations} onChange={(e) => updateTrainerField("specializations", e.target.value)} placeholder="e.g., React, TypeScript, Leadership" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Qualifications</label>
                                    <input type="text" value={trainerForm.qualifications} onChange={(e) => updateTrainerField("qualifications", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Experience (Years)</label>
                                    <input type="number" value={trainerForm.experienceYears} onChange={(e) => updateTrainerField("experienceYears", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setTrainerModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleSaveTrainer} disabled={savingTrainer} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {savingTrainer && <Loader2 size={14} className="animate-spin" />}
                                {savingTrainer ? "Saving..." : trainerEditingId ? "Update" : "Create"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Attendance Modal ── */}
            {attendanceModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-3xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">Session Attendance</h2>
                            <button onClick={() => { setAttendanceModalOpen(false); setAttendanceSessionId(""); }} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            {/* Register Employees */}
                            <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700">
                                <h3 className="text-sm font-bold text-primary-950 dark:text-white mb-3">Register Employees</h3>
                                <div className="flex gap-2">
                                    <select
                                        multiple
                                        value={registerEmployeeIds}
                                        onChange={(e) => setRegisterEmployeeIds(Array.from(e.target.selectedOptions, o => o.value))}
                                        className="flex-1 px-3 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all max-h-24"
                                    >
                                        {employees.map((e: any) => <option key={e.id} value={e.id}>{[e.firstName, e.lastName].filter(Boolean).join(" ") || e.email}</option>)}
                                    </select>
                                    <button
                                        onClick={handleRegisterEmployees}
                                        disabled={registerAttendees.isPending || !registerEmployeeIds.length}
                                        className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                                    >
                                        {registerAttendees.isPending ? <Loader2 size={14} className="animate-spin" /> : "Register"}
                                    </button>
                                </div>
                            </div>

                            {/* Attendance List */}
                            {attendanceQuery.isLoading ? (
                                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
                            ) : attendanceRecords.length === 0 ? (
                                <div className="text-center py-8 text-neutral-400 text-sm">No attendees registered yet.</div>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-bold text-primary-950 dark:text-white">Attendees ({attendanceRecords.length})</h3>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleBulkMarkPresent}
                                                disabled={bulkMark.isPending}
                                                className="px-3 py-1.5 bg-success-600 hover:bg-success-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                                            >
                                                Mark All Present
                                            </button>
                                            {Object.keys(attendanceUpdates).length > 0 && (
                                                <button
                                                    onClick={handleBulkSaveAttendance}
                                                    disabled={bulkMark.isPending}
                                                    className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                                                >
                                                    Save Changes
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden">
                                        <table className="w-full text-left text-sm">
                                            <thead>
                                                <tr className="bg-neutral-50 dark:bg-neutral-800/50 text-xs text-neutral-500 dark:text-neutral-400 uppercase">
                                                    <th className="py-3 px-4 font-bold">Employee</th>
                                                    <th className="py-3 px-4 font-bold text-center">Status</th>
                                                    <th className="py-3 px-4 font-bold">Check-in</th>
                                                    <th className="py-3 px-4 font-bold">Check-out</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {attendanceRecords.map((a: any) => (
                                                    <tr key={a.id} className="border-t border-neutral-100 dark:border-neutral-800/50">
                                                        <td className="py-3 px-4 font-medium text-primary-950 dark:text-white">{a.employee?.firstName ? `${a.employee.firstName} ${a.employee.lastName ?? ''}`.trim() : employeeName(a.employeeId)}</td>
                                                        <td className="py-3 px-4 text-center">
                                                            <select
                                                                value={attendanceUpdates[a.id] ?? a.status ?? "REGISTERED"}
                                                                onChange={(e) => setAttendanceUpdates(prev => ({ ...prev, [a.id]: e.target.value }))}
                                                                className="px-2 py-1 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-bold focus:outline-none dark:text-white"
                                                            >
                                                                {ATTENDANCE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                                                            </select>
                                                        </td>
                                                        <td className="py-3 px-4 text-xs text-neutral-500">{a.checkInTime ? fmt.time(a.checkInTime) : "\u2014"}</td>
                                                        <td className="py-3 px-4 text-xs text-neutral-500">{a.checkOutTime ? fmt.time(a.checkOutTime) : "\u2014"}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Programs Tab ── */}
            {activeTab === "programs" && (
                <div className="space-y-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                        {programsQuery.isLoading ? <SkeletonTable rows={6} cols={8} /> : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[1100px]">
                                    <thead>
                                        <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                            <th className="py-4 px-6 font-bold">Program Name</th>
                                            <th className="py-4 px-6 font-bold">Category</th>
                                            <th className="py-4 px-6 font-bold">Level</th>
                                            <th className="py-4 px-6 font-bold text-center">Courses</th>
                                            <th className="py-4 px-6 font-bold text-center">Enrollments</th>
                                            <th className="py-4 px-6 font-bold text-center">Compulsory</th>
                                            <th className="py-4 px-6 font-bold text-center">Status</th>
                                            <th className="py-4 px-6 font-bold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {programs.map((p: any) => (
                                            <tr key={p.id} className={cn("border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer", selectedProgramId === p.id && "bg-primary-50/50 dark:bg-primary-900/10")} onClick={() => setSelectedProgramId(selectedProgramId === p.id ? null : p.id)}>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                                                            <Layers className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                                        </div>
                                                        <div>
                                                            <span className="font-bold text-primary-950 dark:text-white">{p.name}</span>
                                                            {p.description && <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-1">{p.description}</p>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6"><ProgramCategoryBadge category={p.category ?? "SKILL_DEVELOPMENT"} /></td>
                                                <td className="py-4 px-6"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700">{p.level ?? "Beginner"}</span></td>
                                                <td className="py-4 px-6 text-center font-semibold text-primary-950 dark:text-white">{p._count?.courses ?? p.coursesCount ?? 0}</td>
                                                <td className="py-4 px-6 text-center font-semibold text-primary-950 dark:text-white">{p._count?.enrollments ?? p.enrollmentsCount ?? 0}</td>
                                                <td className="py-4 px-6 text-center">
                                                    {p.isCompulsory ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-danger-50 text-danger-700 border border-danger-200 dark:bg-danger-900/20 dark:text-danger-400">Required</span> : <span className="text-neutral-400 text-xs">Optional</span>}
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", p.isActive !== false ? "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400" : "bg-neutral-100 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400")}>
                                                        {p.isActive !== false ? "Active" : "Inactive"}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button onClick={() => setSelectedProgramId(selectedProgramId === p.id ? null : p.id)} className="p-2 text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-900/20 rounded-lg transition-colors" title="Details">{selectedProgramId === p.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</button>
                                                        <button onClick={() => openEditProgram(p)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit"><Edit3 size={15} /></button>
                                                        <button onClick={() => setDeleteProgramTarget(p)} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" title="Delete"><Trash2 size={15} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {programs.length === 0 && !programsQuery.isLoading && (
                                            <tr><td colSpan={8}><EmptyState icon="list" title="No programs found" message="Create your first training program." action={{ label: "New Program", onClick: openCreateProgram }} /></td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Program Detail Panel */}
                    {selectedProgramId && (
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 p-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-primary-950 dark:text-white">{programDetail?.name ?? "Program Details"}</h3>
                                <button onClick={() => setEnrollModalOpen(true)} className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors">
                                    <Users size={14} /> Enroll Employees
                                </button>
                            </div>

                            {/* Courses */}
                            <div>
                                <h4 className="text-sm font-bold text-primary-950 dark:text-white mb-3">Courses</h4>
                                {(programDetail?.courses ?? []).length > 0 ? (
                                    <div className="border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden">
                                        <table className="w-full text-left text-sm">
                                            <thead>
                                                <tr className="bg-neutral-50 dark:bg-neutral-800/50 text-xs text-neutral-500 dark:text-neutral-400 uppercase">
                                                    <th className="py-3 px-4 font-bold">#</th>
                                                    <th className="py-3 px-4 font-bold">Training</th>
                                                    <th className="py-3 px-4 font-bold text-center">Prerequisite</th>
                                                    <th className="py-3 px-4 font-bold text-center">Min Score</th>
                                                    <th className="py-3 px-4 font-bold text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(programDetail.courses as any[]).sort((a: any, b: any) => (a.sequenceOrder ?? 0) - (b.sequenceOrder ?? 0)).map((c: any) => (
                                                    <tr key={c.id} className="border-t border-neutral-100 dark:border-neutral-800/50">
                                                        <td className="py-3 px-4 font-mono text-xs text-neutral-500">{c.sequenceOrder ?? 1}</td>
                                                        <td className="py-3 px-4 font-medium text-primary-950 dark:text-white">{c.training?.name ?? courseName(c.trainingId)}</td>
                                                        <td className="py-3 px-4 text-center">
                                                            {c.isPrerequisite ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-warning-50 text-warning-700 border border-warning-200 dark:bg-warning-900/20 dark:text-warning-400">Required</span> : <span className="text-neutral-400 text-xs">No</span>}
                                                        </td>
                                                        <td className="py-3 px-4 text-center font-semibold">{c.minPassScore != null ? `${c.minPassScore}%` : "\u2014"}</td>
                                                        <td className="py-3 px-4 text-right">
                                                            <button onClick={() => handleRemoveCourse(c.id)} disabled={removeCourseMut.isPending} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" title="Remove"><Trash2 size={14} /></button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-sm text-neutral-400 dark:text-neutral-500">No courses added yet.</p>
                                )}

                                {/* Add Course Form */}
                                <div className="mt-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700">
                                    <h5 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">Add Course</h5>
                                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                                        <div>
                                            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Training</label>
                                            <select value={addCourseForm.trainingId} onChange={(e) => updateAddCourseField("trainingId", e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                                <option value="">Select...</option>
                                                {courses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Sequence</label>
                                            <input type="number" value={addCourseForm.sequenceOrder} onChange={(e) => updateAddCourseField("sequenceOrder", e.target.value)} placeholder="1" className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Min Score (%)</label>
                                            <input type="number" value={addCourseForm.minPassScore} onChange={(e) => updateAddCourseField("minPassScore", e.target.value)} placeholder="Optional" className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button type="button" onClick={() => updateAddCourseField("isPrerequisite", !addCourseForm.isPrerequisite)} className={cn("w-8 h-5 rounded-full transition-colors relative shrink-0", addCourseForm.isPrerequisite ? "bg-primary-600" : "bg-neutral-300 dark:bg-neutral-700")}>
                                                <div className={cn("w-3.5 h-3.5 rounded-full bg-white absolute top-[3px] transition-all", addCourseForm.isPrerequisite ? "left-[14px]" : "left-[3px]")} />
                                            </button>
                                            <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Prerequisite</span>
                                        </div>
                                        <div>
                                            <button onClick={handleAddCourseToProgram} disabled={addCourseMut.isPending || !addCourseForm.trainingId} className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                                {addCourseMut.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Enrollments */}
                            <div>
                                <h4 className="text-sm font-bold text-primary-950 dark:text-white mb-3">Enrollments ({enrollments.length})</h4>
                                {enrollments.length > 0 ? (
                                    <div className="border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden">
                                        <table className="w-full text-left text-sm">
                                            <thead>
                                                <tr className="bg-neutral-50 dark:bg-neutral-800/50 text-xs text-neutral-500 dark:text-neutral-400 uppercase">
                                                    <th className="py-3 px-4 font-bold">Employee</th>
                                                    <th className="py-3 px-4 font-bold text-center">Progress</th>
                                                    <th className="py-3 px-4 font-bold text-center">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {enrollments.map((e: any) => (
                                                    <tr key={e.id} className="border-t border-neutral-100 dark:border-neutral-800/50">
                                                        <td className="py-3 px-4 font-medium text-primary-950 dark:text-white">
                                                            {e.employee?.firstName ? `${e.employee.firstName} ${e.employee.lastName ?? ''}`.trim() : employeeName(e.employeeId)}
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div className="flex items-center gap-2 justify-center">
                                                                <div className="flex-1 max-w-[120px] bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                                                                    <div className="bg-primary-600 h-2 rounded-full transition-all" style={{ width: `${e.progressPercentage ?? 0}%` }} />
                                                                </div>
                                                                <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">{e.progressPercentage ?? 0}%</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4 text-center"><EnrollmentStatusBadge status={e.status ?? "ENROLLED"} /></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-sm text-neutral-400 dark:text-neutral-500">No enrollments yet.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Budgets Tab ── */}
            {activeTab === "budgets" && (
                <div className="space-y-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                        {budgetsQuery.isLoading ? <SkeletonTable rows={6} cols={7} /> : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[900px]">
                                    <thead>
                                        <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                            <th className="py-4 px-6 font-bold">Fiscal Year</th>
                                            <th className="py-4 px-6 font-bold">Department</th>
                                            <th className="py-4 px-6 font-bold text-right">Allocated</th>
                                            <th className="py-4 px-6 font-bold text-right">Used</th>
                                            <th className="py-4 px-6 font-bold text-right">Remaining</th>
                                            <th className="py-4 px-6 font-bold text-center">Utilization</th>
                                            <th className="py-4 px-6 font-bold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {budgets.map((b: any) => {
                                            const allocated = Number(b.allocatedAmount ?? 0);
                                            const used = Number(b.usedAmount ?? 0);
                                            const remaining = allocated - used;
                                            const pct = allocated > 0 ? Math.round((used / allocated) * 100) : 0;
                                            return (
                                                <tr key={b.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-accent-50 dark:bg-accent-900/30 flex items-center justify-center shrink-0">
                                                                <DollarSign className="w-4 h-4 text-accent-600 dark:text-accent-400" />
                                                            </div>
                                                            <span className="font-bold text-primary-950 dark:text-white">{b.fiscalYear}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">{b.department?.name ?? departmentName(b.departmentId) ?? "Company-wide"}</td>
                                                    <td className="py-4 px-6 text-right font-semibold text-primary-950 dark:text-white">{"₹"}{allocated.toLocaleString("en-IN")}</td>
                                                    <td className="py-4 px-6 text-right font-semibold text-warning-600 dark:text-warning-400">{"₹"}{used.toLocaleString("en-IN")}</td>
                                                    <td className="py-4 px-6 text-right font-semibold text-success-600 dark:text-success-400">{"₹"}{remaining.toLocaleString("en-IN")}</td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-2 justify-center">
                                                            <div className="flex-1 max-w-[80px] bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                                                                <div className={cn("h-2 rounded-full transition-all", pct > 90 ? "bg-danger-500" : pct > 70 ? "bg-warning-500" : "bg-success-500")} style={{ width: `${Math.min(pct, 100)}%` }} />
                                                            </div>
                                                            <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">{pct}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 text-right">
                                                        <button onClick={() => openEditBudget(b)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit"><Edit3 size={15} /></button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {budgets.length === 0 && !budgetsQuery.isLoading && (
                                            <tr><td colSpan={7}><EmptyState icon="list" title="No budgets found" message="Create your first training budget." action={{ label: "New Budget", onClick: openCreateBudget }} /></td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Utilization Section */}
                    {budgets.length > 0 && (
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-primary-950 dark:text-white">Budget Utilization</h3>
                                <select value={budgetFiscalYear} onChange={(e) => setBudgetFiscalYear(e.target.value)} className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-semibold text-neutral-700 dark:text-neutral-300 focus:outline-none">
                                    <option value="">Select fiscal year...</option>
                                    {[...new Set(budgets.map((b: any) => b.fiscalYear))].map((fy: any) => <option key={fy} value={fy}>{fy}</option>)}
                                </select>
                            </div>
                            {budgetFiscalYear && utilizationQuery.data ? (
                                <div className="space-y-3">
                                    {utilization.map((u: any, i: number) => {
                                        const alloc = Number(u.allocatedAmount ?? 0);
                                        const used = Number(u.usedAmount ?? 0);
                                        const pct = alloc > 0 ? Math.round((used / alloc) * 100) : 0;
                                        return (
                                            <div key={i} className="flex items-center gap-4">
                                                <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 w-32 truncate">{u.department?.name ?? "Company-wide"}</span>
                                                <div className="flex-1 bg-neutral-200 dark:bg-neutral-700 rounded-full h-3">
                                                    <div className={cn("h-3 rounded-full transition-all", pct > 90 ? "bg-danger-500" : pct > 70 ? "bg-warning-500" : "bg-primary-500")} style={{ width: `${Math.min(pct, 100)}%` }} />
                                                </div>
                                                <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400 w-16 text-right">{pct}%</span>
                                                <span className="text-xs text-neutral-500 w-40 text-right">{"₹"}{used.toLocaleString("en-IN")} / {"₹"}{alloc.toLocaleString("en-IN")}</span>
                                            </div>
                                        );
                                    })}
                                    {utilization.length === 0 && <p className="text-sm text-neutral-400">No utilization data for this fiscal year.</p>}
                                </div>
                            ) : (
                                <p className="text-sm text-neutral-400 dark:text-neutral-500">Select a fiscal year to view utilization breakdown.</p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ── Program Create/Edit Modal ── */}
            {programModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{programEditingId ? "Edit Program" : "New Training Program"}</h2>
                            <button onClick={() => setProgramModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Program Name</label>
                                <input type="text" value={programForm.name} onChange={(e) => updateProgramField("name", e.target.value)} placeholder="e.g., Full Stack Developer Certification" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Description</label>
                                <textarea value={programForm.description} onChange={(e) => updateProgramField("description", e.target.value)} rows={2} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Category</label>
                                    <select value={programForm.category} onChange={(e) => updateProgramField("category", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                        {PROGRAM_CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Level</label>
                                    <select value={programForm.level} onChange={(e) => updateProgramField("level", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                        {PROGRAM_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Total Duration (hours)</label>
                                <input type="number" value={programForm.totalDuration} onChange={(e) => updateProgramField("totalDuration", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                            </div>
                            <div className="flex items-center justify-between py-2 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl px-4 border border-neutral-200 dark:border-neutral-700">
                                <span className="text-sm font-medium text-primary-950 dark:text-white">Compulsory</span>
                                <button type="button" onClick={() => updateProgramField("isCompulsory", !programForm.isCompulsory)} className={cn("w-10 h-6 rounded-full transition-colors relative", programForm.isCompulsory ? "bg-primary-600" : "bg-neutral-300 dark:bg-neutral-700")}>
                                    <div className={cn("w-4 h-4 rounded-full bg-white absolute top-1 transition-all", programForm.isCompulsory ? "left-5" : "left-1")} />
                                </button>
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setProgramModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleSaveProgram} disabled={savingProgram} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {savingProgram && <Loader2 size={14} className="animate-spin" />}
                                {savingProgram ? "Saving..." : programEditingId ? "Update" : "Create"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Enroll Employees Modal ── */}
            {enrollModalOpen && selectedProgramId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">Enroll Employees</h2>
                            <button onClick={() => setEnrollModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Select Employees</label>
                                <select
                                    multiple
                                    value={enrollEmployeeIds}
                                    onChange={(e) => setEnrollEmployeeIds(Array.from(e.target.selectedOptions, o => o.value))}
                                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all max-h-48"
                                >
                                    {employees.map((e: any) => <option key={e.id} value={e.id}>{[e.firstName, e.lastName].filter(Boolean).join(" ") || e.email}</option>)}
                                </select>
                                <p className="text-xs text-neutral-400 mt-1">Hold Ctrl/Cmd to select multiple employees.</p>
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setEnrollModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleEnroll} disabled={enrollMut.isPending || !enrollEmployeeIds.length} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {enrollMut.isPending && <Loader2 size={14} className="animate-spin" />}
                                {enrollMut.isPending ? "Enrolling..." : `Enroll (${enrollEmployeeIds.length})`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Budget Create/Edit Modal ── */}
            {budgetModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{budgetEditingId ? "Edit Budget" : "New Training Budget"}</h2>
                            <button onClick={() => setBudgetModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Fiscal Year</label>
                                <input type="text" value={budgetForm.fiscalYear} onChange={(e) => updateBudgetField("fiscalYear", e.target.value)} placeholder="e.g., 2026-27" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Department (optional = company-wide)</label>
                                <select value={budgetForm.departmentId} onChange={(e) => updateBudgetField("departmentId", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                    <option value="">Company-wide</option>
                                    {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Allocated Amount (INR)</label>
                                <input type="number" value={budgetForm.allocatedAmount} onChange={(e) => updateBudgetField("allocatedAmount", e.target.value)} placeholder="0" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setBudgetModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleSaveBudget} disabled={savingBudget} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {savingBudget && <Loader2 size={14} className="animate-spin" />}
                                {savingBudget ? "Saving..." : budgetEditingId ? "Update" : "Create"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Materials Modal ── */}
            {materialsTrainingId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-3xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">Training Materials</h2>
                            <div className="flex items-center gap-2">
                                <button onClick={openCreateMaterial} className="inline-flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg font-bold text-xs transition-colors">
                                    <Plus size={14} /> Add Material
                                </button>
                                <button onClick={closeMaterials} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                            </div>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            {materialsQuery.isLoading ? (
                                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
                            ) : materials.length === 0 ? (
                                <div className="text-center py-8 text-neutral-400 text-sm">No materials added yet.</div>
                            ) : (
                                <div className="border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="bg-neutral-50 dark:bg-neutral-800/50 text-xs text-neutral-500 dark:text-neutral-400 uppercase">
                                                <th className="py-3 px-4 font-bold">Name</th>
                                                <th className="py-3 px-4 font-bold text-center">Type</th>
                                                <th className="py-3 px-4 font-bold">URL</th>
                                                <th className="py-3 px-4 font-bold text-center">Mandatory</th>
                                                <th className="py-3 px-4 font-bold text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {materials.map((m: any) => (
                                                <tr key={m.id} className="border-t border-neutral-100 dark:border-neutral-800/50">
                                                    <td className="py-3 px-4">
                                                        <div>
                                                            <span className="font-medium text-primary-950 dark:text-white">{m.name}</span>
                                                            {m.description && <p className="text-xs text-neutral-400 mt-0.5 line-clamp-1">{m.description}</p>}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-center"><MaterialTypeBadge type={m.type ?? "DOCUMENT"} /></td>
                                                    <td className="py-3 px-4">
                                                        {m.url ? (
                                                            <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 dark:text-primary-400 hover:underline truncate max-w-[200px] block">{m.url}</a>
                                                        ) : "\u2014"}
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        {m.isMandatory ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-danger-50 text-danger-700 border border-danger-200 dark:bg-danger-900/20 dark:text-danger-400">Required</span> : <span className="text-neutral-400 text-xs">Optional</span>}
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <button onClick={() => openEditMaterial(m)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit"><Edit3 size={14} /></button>
                                                            <button onClick={() => setDeleteMaterialTarget(m)} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" title="Delete"><Trash2 size={14} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Material Create/Edit Modal ── */}
            {materialModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{materialEditingId ? "Edit Material" : "Add Material"}</h2>
                            <button onClick={() => setMaterialModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Name</label>
                                <input type="text" value={materialForm.name} onChange={(e) => updateMaterialField("name", e.target.value)} placeholder="e.g., Course Handbook" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Type</label>
                                    <select value={materialForm.type} onChange={(e) => { updateMaterialField("type", e.target.value); updateMaterialField("url", ""); resetMaterialUpload(); }} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                        {MATERIAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Sequence Order</label>
                                    <input type="number" value={materialForm.sequenceOrder} onChange={(e) => updateMaterialField("sequenceOrder", e.target.value)} placeholder="1" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                </div>
                            </div>
                            {materialForm.type === 'VIDEO' || materialForm.type === 'LINK' ? (
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">URL</label>
                                    <input type="url" value={materialForm.url} onChange={(e) => updateMaterialField("url", e.target.value)} placeholder="https://youtube.com/..." className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">File</label>
                                    <FileUploadZone
                                        onFileSelected={async (file) => {
                                            const key = await uploadMaterial(file);
                                            if (key) {
                                                updateMaterialField('url', key);
                                            }
                                        }}
                                        isUploading={isMaterialUploading}
                                        uploadedFileName={materialForm.url && !materialForm.url.startsWith('http') ? materialForm.url.split('/').pop() ?? null : null}
                                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                                        error={materialUploadError}
                                        onClear={() => {
                                            updateMaterialField('url', '');
                                            resetMaterialUpload();
                                        }}
                                    />
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Description</label>
                                <textarea value={materialForm.description} onChange={(e) => updateMaterialField("description", e.target.value)} rows={2} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none" />
                            </div>
                            <div className="flex items-center justify-between py-2 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl px-4 border border-neutral-200 dark:border-neutral-700">
                                <span className="text-sm font-medium text-primary-950 dark:text-white">Mandatory</span>
                                <button type="button" onClick={() => updateMaterialField("isMandatory", !materialForm.isMandatory)} className={cn("w-10 h-6 rounded-full transition-colors relative", materialForm.isMandatory ? "bg-primary-600" : "bg-neutral-300 dark:bg-neutral-700")}>
                                    <div className={cn("w-4 h-4 rounded-full bg-white absolute top-1 transition-all", materialForm.isMandatory ? "left-5" : "left-1")} />
                                </button>
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setMaterialModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleSaveMaterial} disabled={savingMaterial} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {savingMaterial && <Loader2 size={14} className="animate-spin" />}
                                {savingMaterial ? "Saving..." : materialEditingId ? "Update" : "Add"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Program Confirmation ── */}
            {deleteProgramTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">Delete Program?</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">This will permanently delete <strong>{deleteProgramTarget.name}</strong>.</p>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setDeleteProgramTarget(null)} className="flex-1 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleDeleteProgram} disabled={deleteProgramMut.isPending} className="flex-1 py-3 rounded-xl bg-danger-600 hover:bg-danger-700 text-white text-sm font-bold transition-colors disabled:opacity-50">{deleteProgramMut.isPending ? "Deleting..." : "Delete"}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Material Confirmation ── */}
            {deleteMaterialTarget && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">Delete Material?</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">This will permanently delete <strong>{deleteMaterialTarget.name}</strong>.</p>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setDeleteMaterialTarget(null)} className="flex-1 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleDeleteMaterial} disabled={deleteMaterialMut.isPending} className="flex-1 py-3 rounded-xl bg-danger-600 hover:bg-danger-700 text-white text-sm font-bold transition-colors disabled:opacity-50">{deleteMaterialMut.isPending ? "Deleting..." : "Delete"}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Course Confirmation ── */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">Delete Course?</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">This will permanently delete <strong>{deleteTarget.name}</strong>.</p>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleDeleteCourse} disabled={deleteCourse.isPending} className="flex-1 py-3 rounded-xl bg-danger-600 hover:bg-danger-700 text-white text-sm font-bold transition-colors disabled:opacity-50">{deleteCourse.isPending ? "Deleting..." : "Delete"}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Session Confirmation ── */}
            {deleteSessionTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">Delete Session?</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">This will permanently delete <strong>{deleteSessionTarget.batchName}</strong>.</p>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setDeleteSessionTarget(null)} className="flex-1 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleDeleteSession} disabled={deleteSession.isPending} className="flex-1 py-3 rounded-xl bg-danger-600 hover:bg-danger-700 text-white text-sm font-bold transition-colors disabled:opacity-50">{deleteSession.isPending ? "Deleting..." : "Delete"}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Cancel Session Confirmation ── */}
            {cancelSessionTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">Cancel Session?</h2>
                        <div className="space-y-3">
                            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Reason for cancellation</label>
                            <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} rows={3} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white resize-none" />
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => { setCancelSessionTarget(null); setCancelReason(""); }} className="flex-1 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Back</button>
                            <button onClick={handleCancelSession} disabled={updateSessionStatus.isPending} className="flex-1 py-3 rounded-xl bg-danger-600 hover:bg-danger-700 text-white text-sm font-bold transition-colors disabled:opacity-50">{updateSessionStatus.isPending ? "Cancelling..." : "Cancel Session"}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Trainer Confirmation ── */}
            {deleteTrainerTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">Deactivate Trainer?</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">This will deactivate <strong>{deleteTrainerTarget.name}</strong>.</p>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setDeleteTrainerTarget(null)} className="flex-1 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleDeleteTrainer} disabled={deleteTrainerMut.isPending} className="flex-1 py-3 rounded-xl bg-danger-600 hover:bg-danger-700 text-white text-sm font-bold transition-colors disabled:opacity-50">{deleteTrainerMut.isPending ? "Deactivating..." : "Deactivate"}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
