import { useState } from "react";
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
    Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    useTrainingCatalogue,
    useTrainingNominations,
} from "@/features/company-admin/api/use-recruitment-queries";
import { useEmployees } from "@/features/company-admin/api/use-hr-queries";
import {
    useCreateTrainingCatalogue,
    useUpdateTrainingCatalogue,
    useDeleteTrainingCatalogue,
    useCreateTrainingNomination,
    useUpdateTrainingNomination,
} from "@/features/company-admin/api/use-recruitment-mutations";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Constants ── */

const DELIVERY_MODES = ["Classroom", "Online", "Hybrid", "On-the-Job", "Workshop", "Seminar"];
const CATEGORIES = ["Technical", "Soft Skills", "Compliance", "Leadership", "Safety", "Product", "Process"];
const NOM_STATUSES = ["All", "Nominated", "Approved", "In Progress", "Completed", "Cancelled"];

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

const formatDate = (d: string | null | undefined) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
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

/* ── Screen ── */

export function TrainingCatalogueScreen() {
    const [activeTab, setActiveTab] = useState<"catalogue" | "nominations">("catalogue");
    const [search, setSearch] = useState("");
    const [nomStatusFilter, setNomStatusFilter] = useState("All");

    const [courseModalOpen, setCourseModalOpen] = useState(false);
    const [courseEditingId, setCourseEditingId] = useState<string | null>(null);
    const [courseForm, setCourseForm] = useState({ ...EMPTY_COURSE });
    const [deleteTarget, setDeleteTarget] = useState<any>(null);

    const [nomModalOpen, setNomModalOpen] = useState(false);
    const [nomEditingId, setNomEditingId] = useState<string | null>(null);
    const [nomForm, setNomForm] = useState({ ...EMPTY_NOMINATION });

    const catQuery = useTrainingCatalogue();
    const nomQuery = useTrainingNominations(nomStatusFilter !== "All" ? { status: nomStatusFilter.toLowerCase() } : undefined);
    const employeesQuery = useEmployees();

    const createCourse = useCreateTrainingCatalogue();
    const updateCourse = useUpdateTrainingCatalogue();
    const deleteCourse = useDeleteTrainingCatalogue();
    const createNom = useCreateTrainingNomination();
    const updateNom = useUpdateTrainingNomination();

    const courses: any[] = catQuery.data?.data ?? [];
    const nominations: any[] = nomQuery.data?.data ?? [];
    const employees: any[] = employeesQuery.data?.data ?? [];

    const courseName = (id: string) => courses.find((c: any) => c.id === id)?.name ?? id;
    const employeeName = (id: string) => {
        const emp = employees.find((e: any) => e.id === id);
        if (!emp) return id;
        return [emp.firstName, emp.lastName].filter(Boolean).join(" ") || emp.fullName || emp.email || id;
    };

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

    const savingCourse = createCourse.isPending || updateCourse.isPending;
    const savingNom = createNom.isPending || updateNom.isPending;
    const updateCourseField = (key: string, value: any) => setCourseForm((p) => ({ ...p, [key]: value }));
    const updateNomField = (key: string, value: any) => setNomForm((p) => ({ ...p, [key]: value }));

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Training</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Manage training programmes and employee nominations</p>
                </div>
                <button
                    onClick={() => activeTab === "catalogue" ? openCreateCourse() : openCreateNom()}
                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
                >
                    <Plus className="w-5 h-5" />
                    {activeTab === "catalogue" ? "New Course" : "Nominate"}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl w-fit">
                <button
                    onClick={() => { setActiveTab("catalogue"); setSearch(""); }}
                    className={cn("px-5 py-2 rounded-lg text-sm font-bold transition-all", activeTab === "catalogue" ? "bg-white dark:bg-neutral-700 text-primary-700 dark:text-primary-400 shadow-sm" : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300")}
                >
                    <span className="flex items-center gap-2"><BookOpen size={14} />Catalogue</span>
                </button>
                <button
                    onClick={() => { setActiveTab("nominations"); setSearch(""); }}
                    className={cn("px-5 py-2 rounded-lg text-sm font-bold transition-all", activeTab === "nominations" ? "bg-white dark:bg-neutral-700 text-primary-700 dark:text-primary-400 shadow-sm" : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300")}
                >
                    <span className="flex items-center gap-2"><Award size={14} />Nominations</span>
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                    <input type="text" placeholder={activeTab === "catalogue" ? "Search courses..." : "Search nominations..."} value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
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
                                            <td className="py-4 px-6 text-xs font-mono text-neutral-600 dark:text-neutral-400">{c.code || "—"}</td>
                                            <td className="py-4 px-6"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-50 text-accent-700 border border-accent-200 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50">{c.category}</span></td>
                                            <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">{c.deliveryMode || "—"}</td>
                                            <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">{c.duration ? `${c.duration} ${c.durationUnit || "hrs"}` : "—"}</td>
                                            <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">{c.provider || "—"}</td>
                                            <td className="py-4 px-6 text-right font-semibold text-primary-950 dark:text-white">{c.cost ? `\u20B9${Number(c.cost).toLocaleString("en-IN")}` : "—"}</td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-1">
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
                                            <td className="py-4 px-6 text-center font-semibold text-primary-950 dark:text-white">{n.score ?? "—"}</td>
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
        </div>
    );
}
