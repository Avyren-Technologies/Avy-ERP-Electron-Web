import { useState } from "react";
import {
    Flag,
    Plus,
    Edit3,
    Trash2,
    Loader2,
    X,
    Search,
    Filter,
    ChevronRight,
    ChevronDown,
    GitBranch,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGoals } from "@/features/company-admin/api/use-performance-queries";
import { useAppraisalCycles } from "@/features/company-admin/api/use-performance-queries";
import { useEmployees } from "@/features/company-admin/api/use-hr-queries";
import {
    useCreateGoal,
    useUpdateGoal,
    useDeleteGoal,
} from "@/features/company-admin/api/use-performance-mutations";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Constants ── */

const GOAL_LEVELS = [
    { value: "COMPANY", label: "Company" },
    { value: "DEPARTMENT", label: "Department" },
    { value: "INDIVIDUAL", label: "Individual" },
];

const GOAL_STATUSES = ["All", "Draft", "Active", "Completed", "Cancelled"];

const EMPTY_FORM = {
    title: "",
    description: "",
    level: "INDIVIDUAL",
    cycleId: "",
    employeeId: "",
    departmentId: "",
    weightage: 0,
    targetValue: "",
    kpiMetric: "",
    achievedValue: "",
    dueDate: "",
    parentGoalId: "",
    status: "DRAFT",
};

/* ── Helpers ── */

// Backend Goal.level values: COMPANY, DEPARTMENT, INDIVIDUAL
const GOAL_LEVEL_LABELS: Record<string, string> = {
    COMPANY: "Company",
    DEPARTMENT: "Department",
    INDIVIDUAL: "Individual",
};

function LevelBadge({ level }: { level: string }) {
    const map: Record<string, string> = {
        company: "bg-accent-50 text-accent-700 border-accent-200 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50",
        department: "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50",
        individual: "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50",
    };
    const label = GOAL_LEVEL_LABELS[level] ?? level?.replace(/_/g, " ");
    return (
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize", map[level?.toLowerCase()] ?? map.individual)}>
            {label}
        </span>
    );
}

function StatusBadge({ status }: { status: string }) {
    const s = status?.toLowerCase();
    const map: Record<string, string> = {
        draft: "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700",
        active: "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50",
        completed: "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50",
        cancelled: "bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50",
    };
    return <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize", map[s] ?? map.draft)}>{status}</span>;
}

function ProgressBar({ achieved, target }: { achieved: number; target: number }) {
    const pct = target > 0 ? Math.min((achieved / target) * 100, 100) : 0;
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full transition-all", pct >= 100 ? "bg-success-500" : pct >= 50 ? "bg-primary-500" : "bg-warning-500")} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[10px] font-mono font-bold text-neutral-500 dark:text-neutral-400 w-8 text-right">{Math.round(pct)}%</span>
        </div>
    );
}

/* ── Screen ── */

export function GoalScreen() {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [cycleFilter, setCycleFilter] = useState("");
    const [levelFilter, setLevelFilter] = useState("");
    const [viewMode, setViewMode] = useState<"table" | "tree">("table");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [deleteTarget, setDeleteTarget] = useState<any>(null);
    const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());

    const params: Record<string, unknown> = {};
    if (statusFilter !== "All") params.status = statusFilter.toLowerCase();
    if (cycleFilter) params.cycleId = cycleFilter;
    if (levelFilter) params.level = levelFilter;

    const { data, isLoading, isError } = useGoals(Object.keys(params).length ? params : undefined);
    const cyclesQuery = useAppraisalCycles();
    const employeesQuery = useEmployees();
    const createMutation = useCreateGoal();
    const updateMutation = useUpdateGoal();
    const deleteMutation = useDeleteGoal();

    const goals: any[] = data?.data ?? [];
    const cycles: any[] = cyclesQuery.data?.data ?? [];
    const employees: any[] = employeesQuery.data?.data ?? [];

    const employeeName = (id: string) => {
        const emp = employees.find((e: any) => e.id === id);
        if (!emp) return id || "—";
        return [emp.firstName, emp.lastName].filter(Boolean).join(" ") || emp.fullName || emp.email || id;
    };

    const filtered = goals.filter((g: any) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return g.title?.toLowerCase().includes(s) || employeeName(g.employeeId)?.toLowerCase().includes(s);
    });

    // Build tree structure
    const rootGoals = filtered.filter((g: any) => !g.parentGoalId);
    const childMap: Record<string, any[]> = {};
    filtered.forEach((g: any) => {
        if (g.parentGoalId) {
            if (!childMap[g.parentGoalId]) childMap[g.parentGoalId] = [];
            childMap[g.parentGoalId].push(g);
        }
    });

    const toggleExpand = (id: string) => {
        setExpandedGoals((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const openCreate = () => {
        setEditingId(null);
        setForm({ ...EMPTY_FORM });
        setModalOpen(true);
    };

    const openEdit = (g: any) => {
        setEditingId(g.id);
        setForm({
            title: g.title ?? "",
            description: g.description ?? "",
            level: g.level ?? "INDIVIDUAL",
            cycleId: g.cycleId ?? "",
            employeeId: g.employeeId ?? "",
            departmentId: g.departmentId ?? "",
            weightage: g.weightage ?? 0,
            targetValue: String(g.targetValue ?? ""),
            kpiMetric: g.kpiMetric ?? "",
            achievedValue: String(g.achievedValue ?? ""),
            dueDate: g.dueDate ?? "",
            parentGoalId: g.parentGoalId ?? "",
            status: g.status ?? "DRAFT",
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        try {
            const payload: any = {
                ...form,
                weightage: Number(form.weightage) || 0,
                targetValue: form.targetValue ? Number(form.targetValue) : undefined,
            };
            // Remove empty optional strings
            if (!payload.employeeId) delete payload.employeeId;
            if (!payload.departmentId) delete payload.departmentId;
            if (!payload.parentGoalId) delete payload.parentGoalId;
            if (!payload.kpiMetric) delete payload.kpiMetric;
            if (!payload.description) delete payload.description;
            delete payload.achievedValue;
            delete payload.dueDate;
            if (editingId) {
                await updateMutation.mutateAsync({ id: editingId, data: payload });
                showSuccess("Goal Updated", `"${form.title}" has been updated.`);
            } else {
                await createMutation.mutateAsync(payload);
                showSuccess("Goal Created", `"${form.title}" has been created.`);
            }
            setModalOpen(false);
        } catch (err) { showApiError(err); }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteMutation.mutateAsync(deleteTarget.id);
            showSuccess("Goal Deleted", `"${deleteTarget.title}" has been removed.`);
            setDeleteTarget(null);
        } catch (err) { showApiError(err); }
    };

    const saving = createMutation.isPending || updateMutation.isPending;
    const updateField = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));

    const renderTreeRow = (g: any, depth: number = 0) => {
        const children = childMap[g.id] || [];
        const hasChildren = children.length > 0;
        const isExpanded = expandedGoals.has(g.id);

        return (
            <tbody key={g.id}>
                <tr className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="py-3 px-6">
                        <div className="flex items-center gap-2" style={{ paddingLeft: depth * 24 }}>
                            {hasChildren ? (
                                <button onClick={() => toggleExpand(g.id)} className="p-0.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
                                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </button>
                            ) : (
                                <span className="w-5" />
                            )}
                            {hasChildren && <GitBranch size={12} className="text-accent-500" />}
                            <span className="font-bold text-primary-950 dark:text-white text-sm">{g.title}</span>
                        </div>
                    </td>
                    <td className="py-3 px-6"><LevelBadge level={g.level ?? "individual"} /></td>
                    <td className="py-3 px-6 text-xs text-neutral-600 dark:text-neutral-400">{employeeName(g.employeeId)}</td>
                    <td className="py-3 px-6 text-center text-xs font-semibold text-primary-950 dark:text-white">{g.weightage ?? 0}%</td>
                    <td className="py-3 px-6 text-xs text-neutral-600 dark:text-neutral-400 text-center">{g.targetValue ?? "—"} {g.targetUnit ?? ""}</td>
                    <td className="py-3 px-6 w-40"><ProgressBar achieved={Number(g.achievedValue ?? 0)} target={Number(g.targetValue ?? 0)} /></td>
                    <td className="py-3 px-6 text-center"><StatusBadge status={g.status ?? "Draft"} /></td>
                    <td className="py-3 px-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openEdit(g)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit"><Edit3 size={14} /></button>
                            <button onClick={() => setDeleteTarget(g)} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" title="Delete"><Trash2 size={14} /></button>
                        </div>
                    </td>
                </tr>
                {isExpanded && children.map((child: any) => renderTreeRow(child, depth + 1))}
            </tbody>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Goals & OKRs</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Set, cascade, and track organizational and individual goals</p>
                </div>
                <button onClick={openCreate} className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none">
                    <Plus className="w-5 h-5" /> New Goal
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                    <input type="text" placeholder="Search goals..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                </div>
                <div className="flex items-center gap-3 overflow-x-auto pb-1 lg:pb-0">
                    <div className="flex items-center gap-2">
                        <Filter size={14} className="text-neutral-400 shrink-0" />
                        <select value={cycleFilter} onChange={(e) => setCycleFilter(e.target.value)} className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-semibold text-neutral-700 dark:text-neutral-300 focus:outline-none">
                            <option value="">All Cycles</option>
                            {cycles.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-semibold text-neutral-700 dark:text-neutral-300 focus:outline-none">
                        <option value="">All Levels</option>
                        {GOAL_LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                    </select>
                    <div className="flex items-center gap-1 border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
                        <button onClick={() => setViewMode("table")} className={cn("px-3 py-1.5 text-xs font-bold transition-colors", viewMode === "table" ? "bg-primary-600 text-white" : "text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800")}>Table</button>
                        <button onClick={() => setViewMode("tree")} className={cn("px-3 py-1.5 text-xs font-bold transition-colors", viewMode === "tree" ? "bg-primary-600 text-white" : "text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800")}>Tree</button>
                    </div>
                    <div className="flex items-center gap-1">
                        {GOAL_STATUSES.map((f) => (
                            <button key={f} onClick={() => setStatusFilter(f)} className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all", statusFilter === f ? "bg-primary-50 text-primary-700 border-primary-300 dark:bg-primary-900/30 dark:text-primary-400 dark:border-primary-700" : "bg-neutral-50 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700")}>
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">Failed to load goals.</div>
            )}

            {/* Data Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? <SkeletonTable rows={6} cols={8} /> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1100px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Title</th>
                                    <th className="py-4 px-6 font-bold">Level</th>
                                    <th className="py-4 px-6 font-bold">Employee</th>
                                    <th className="py-4 px-6 font-bold text-center">Weightage</th>
                                    <th className="py-4 px-6 font-bold text-center">Target</th>
                                    <th className="py-4 px-6 font-bold">Progress</th>
                                    <th className="py-4 px-6 font-bold text-center">Status</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            {viewMode === "tree" ? (
                                <>{rootGoals.map((g: any) => renderTreeRow(g, 0))}</>
                            ) : (
                                <tbody className="text-sm">
                                    {filtered.map((g: any) => (
                                        <tr key={g.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                                                        <Flag className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-primary-950 dark:text-white">{g.title}</span>
                                                        {g.parentGoalId && <p className="text-[10px] text-accent-500 font-medium mt-0.5">Cascaded</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6"><LevelBadge level={g.level ?? "individual"} /></td>
                                            <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">{employeeName(g.employeeId)}</td>
                                            <td className="py-4 px-6 text-center font-semibold text-primary-950 dark:text-white">{g.weightage ?? 0}%</td>
                                            <td className="py-4 px-6 text-center text-xs text-neutral-600 dark:text-neutral-400">{g.targetValue ?? "—"} {g.targetUnit ?? ""}</td>
                                            <td className="py-4 px-6 w-40"><ProgressBar achieved={Number(g.achievedValue ?? 0)} target={Number(g.targetValue ?? 0)} /></td>
                                            <td className="py-4 px-6 text-center"><StatusBadge status={g.status ?? "Draft"} /></td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => openEdit(g)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit"><Edit3 size={15} /></button>
                                                    <button onClick={() => setDeleteTarget(g)} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" title="Delete"><Trash2 size={15} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filtered.length === 0 && !isLoading && (
                                        <tr><td colSpan={8}><EmptyState icon="list" title="No goals found" message="Create your first goal to get started." action={{ label: "New Goal", onClick: openCreate }} /></td></tr>
                                    )}
                                </tbody>
                            )}
                        </table>
                    </div>
                )}
            </div>

            {/* ── Create/Edit Modal ── */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{editingId ? "Edit Goal" : "New Goal"}</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Title</label>
                                <input type="text" value={form.title} onChange={(e) => updateField("title", e.target.value)} placeholder="e.g., Increase revenue by 20%" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Description</label>
                                <textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} rows={2} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Level</label>
                                    <select value={form.level} onChange={(e) => updateField("level", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                        {GOAL_LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
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
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Employee</label>
                                    <select value={form.employeeId} onChange={(e) => updateField("employeeId", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                        <option value="">Select employee...</option>
                                        {employees.map((e: any) => <option key={e.id} value={e.id}>{[e.firstName, e.lastName].filter(Boolean).join(" ") || e.fullName || e.email}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Parent Goal (Cascade)</label>
                                    <select value={form.parentGoalId} onChange={(e) => updateField("parentGoalId", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                        <option value="">None (top-level)</option>
                                        {goals.filter((g: any) => g.id !== editingId).map((g: any) => <option key={g.id} value={g.id}>{g.title}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Weightage %</label>
                                    <input type="number" value={form.weightage} onChange={(e) => updateField("weightage", Number(e.target.value))} min={0} max={100} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Target</label>
                                    <input type="text" value={form.targetValue} onChange={(e) => updateField("targetValue", e.target.value)} placeholder="e.g., 100" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">KPI Metric</label>
                                    <input type="text" value={form.kpiMetric} onChange={(e) => updateField("kpiMetric", e.target.value)} placeholder="e.g., %" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Due Date</label>
                                    <input type="date" value={form.dueDate} onChange={(e) => updateField("dueDate", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                </div>
                            </div>
                            {editingId && (
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Achieved Value</label>
                                    <input type="text" value={form.achievedValue} onChange={(e) => updateField("achievedValue", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Status</label>
                                <select value={form.status} onChange={(e) => updateField("status", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                    {[{ v: "DRAFT", l: "Draft" }, { v: "ACTIVE", l: "Active" }, { v: "COMPLETED", l: "Completed" }, { v: "CANCELLED", l: "Cancelled" }].map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
                                </select>
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
                        <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">Delete Goal?</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">This will permanently delete <strong>"{deleteTarget.title}"</strong> and any cascaded child goals may be orphaned.</p>
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
