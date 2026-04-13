import { useState } from "react";
import {
    Plus,
    Edit3,
    Trash2,
    Loader2,
    X,
    Search,
    Users,
    Grid3X3,
    Table,
    Shield,
    AlertTriangle,
    CheckCircle2,
    Clock,
    BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSuccessionPlans, useNineBoxData, useBenchStrength } from "@/features/company-admin/api/use-performance-queries";
import { useEmployees } from "@/features/company-admin/api/use-hr-queries";
import {
    useCreateSuccessionPlan,
    useUpdateSuccessionPlan,
    useDeleteSuccessionPlan,
} from "@/features/company-admin/api/use-performance-mutations";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Constants ── */

// Backend enum: SuccessorReadiness { READY_NOW, ONE_YEAR, TWO_YEARS, NOT_READY }
const READINESS_LEVELS = [
    { value: "READY_NOW", label: "Ready Now", color: "bg-success-500", textColor: "text-success-700 dark:text-success-400", bgColor: "bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800/50" },
    { value: "ONE_YEAR", label: "1-2 Years", color: "bg-primary-500", textColor: "text-primary-700 dark:text-primary-400", bgColor: "bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800/50" },
    { value: "TWO_YEARS", label: "3-5 Years", color: "bg-warning-500", textColor: "text-warning-700 dark:text-warning-400", bgColor: "bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800/50" },
    { value: "NOT_READY", label: "Not Ready", color: "bg-neutral-400", textColor: "text-neutral-600 dark:text-neutral-400", bgColor: "bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700" },
];

const READINESS_FILTERS = ["All", "READY_NOW", "ONE_YEAR", "TWO_YEARS", "NOT_READY"];

const NINE_BOX_LABELS: Record<string, { label: string; color: string; desc: string }> = {
    "3-3": { label: "Star", color: "bg-success-500", desc: "High potential, high performance" },
    "3-2": { label: "Growth Engine", color: "bg-success-400", desc: "High potential, moderate performance" },
    "3-1": { label: "Rough Diamond", color: "bg-primary-400", desc: "High potential, low performance" },
    "2-3": { label: "High Performer", color: "bg-success-300", desc: "Moderate potential, high performance" },
    "2-2": { label: "Core Player", color: "bg-primary-300", desc: "Moderate potential, moderate performance" },
    "2-1": { label: "Inconsistent", color: "bg-warning-400", desc: "Moderate potential, low performance" },
    "1-3": { label: "Solid Pro", color: "bg-primary-200", desc: "Low potential, high performance" },
    "1-2": { label: "Effective", color: "bg-warning-300", desc: "Low potential, moderate performance" },
    "1-1": { label: "Risk", color: "bg-danger-400", desc: "Low potential, low performance" },
};

const EMPTY_FORM = {
    position: "",
    role: "",
    successors: [{ employeeId: "", readiness: "ONE_YEAR", notes: "" }],
};

/* ── Helpers ── */

function ReadinessBadge({ readiness }: { readiness: string }) {
    const config = READINESS_LEVELS.find((r) => r.value === readiness) ?? READINESS_LEVELS[3];
    return <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", config.bgColor, config.textColor)}>{config.label}</span>;
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

export function SuccessionScreen() {
    const [search, setSearch] = useState("");
    const [readinessFilter, setReadinessFilter] = useState("All");
    const [viewMode, setViewMode] = useState<"table" | "ninebox" | "bench">("table");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<any>(null);
    const [form, setForm] = useState<any>({ ...EMPTY_FORM });

    const params: Record<string, unknown> = {};
    if (readinessFilter !== "All") params.readiness = readinessFilter;

    const { data, isLoading, isError } = useSuccessionPlans(Object.keys(params).length ? params : undefined);
    const nineBoxQuery = useNineBoxData();
    const benchQuery = useBenchStrength();
    const employeesQuery = useEmployees();
    const createMutation = useCreateSuccessionPlan();
    const updateMutation = useUpdateSuccessionPlan();
    const deleteMutation = useDeleteSuccessionPlan();

    const plans: any[] = data?.data ?? [];
    const employees: any[] = employeesQuery.data?.data ?? [];
    const nineBoxData: any = nineBoxQuery.data?.data ?? null;
    const benchData: any[] = benchQuery.data?.data ?? [];

    const employeeName = (idOrRecord: string | any, nestedField = 'employee', idField = 'employeeId') => {
        const id = typeof idOrRecord === 'string' ? idOrRecord : idOrRecord?.[idField];
        const record = typeof idOrRecord === 'string' ? null : idOrRecord;
        const emp = record?.[nestedField] ?? employees.find((e: any) => e.id === id);
        if (!emp) return id || '—';
        return `${emp.firstName ?? ''} ${emp.lastName ?? ''}`.trim() || emp.fullName || emp.employeeCode || emp.email || id || '—';
    };

    /** Extract the successor employee name from the backend nested `successor` relation */
    const successorName = (plan: any) => {
        const s = plan.successor;
        if (s?.firstName || s?.lastName) return `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim();
        return employeeName(plan.successorId ?? plan, 'successor', 'successorId');
    };

    /** Get position/role title — backend uses criticalRoleTitle + criticalRoleDesignation */
    const getPosition = (p: any) => p.position || p.criticalRoleTitle || '—';
    const getRole = (p: any) => p.role || p.criticalRoleDesignation?.name || '';

    // Group plans by criticalRoleTitle for the table view (multiple successors per role)
    const groupedPlans = plans.reduce((acc: Record<string, any>, p: any) => {
        const key = getPosition(p);
        if (!acc[key]) {
            acc[key] = {
                id: p.id,
                criticalRoleTitle: p.criticalRoleTitle,
                criticalRoleDesignation: p.criticalRoleDesignation,
                position: getPosition(p),
                role: getRole(p),
                successors: [],
            };
        }
        acc[key].successors.push({
            employeeId: p.successorId,
            employee: p.successor,
            readiness: p.readiness,
            notes: p.developmentPlan,
        });
        return acc;
    }, {});
    const groupedPlanList: any[] = Object.values(groupedPlans);

    const filtered = groupedPlanList.filter((p: any) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return p.position?.toLowerCase().includes(s) || p.role?.toLowerCase().includes(s);
    });

    const openCreate = () => {
        setEditingId(null);
        setForm({ ...EMPTY_FORM, successors: [{ employeeId: "", readiness: "ONE_YEAR", notes: "" }] });
        setModalOpen(true);
    };

    const openEdit = (p: any) => {
        setEditingId(p.id);
        setForm({
            position: p.position ?? p.criticalRoleTitle ?? "",
            role: p.role ?? p.criticalRoleDesignation?.name ?? "",
            successors: p.successors?.length ? p.successors.map((s: any) => ({
                employeeId: s.employeeId ?? "",
                readiness: s.readiness ?? "ONE_YEAR",
                notes: s.notes ?? "",
            })) : [{ employeeId: "", readiness: "ONE_YEAR", notes: "" }],
        });
        setModalOpen(true);
    };

    const addSuccessor = () => {
        setForm((p: any) => ({ ...p, successors: [...p.successors, { employeeId: "", readiness: "ONE_YEAR", notes: "" }] }));
    };

    const removeSuccessor = (index: number) => {
        setForm((p: any) => ({ ...p, successors: p.successors.filter((_: any, i: number) => i !== index) }));
    };

    const updateSuccessor = (index: number, key: string, value: string) => {
        setForm((p: any) => ({
            ...p,
            successors: p.successors.map((s: any, i: number) => i === index ? { ...s, [key]: value } : s),
        }));
    };

    const handleSave = async () => {
        try {
            const validSuccessors = form.successors.filter((s: any) => s.employeeId);
            if (validSuccessors.length === 0) {
                showApiError(new Error("At least one successor is required"));
                return;
            }
            if (editingId) {
                // Update first successor's plan record, create additional ones
                const [first, ...rest] = validSuccessors;
                await updateMutation.mutateAsync({
                    id: editingId,
                    data: {
                        criticalRoleTitle: form.position,
                        successorId: first.employeeId,
                        readiness: first.readiness,
                        developmentPlan: first.notes || undefined,
                    },
                });
                for (const s of rest) {
                    await createMutation.mutateAsync({
                        criticalRoleTitle: form.position,
                        successorId: s.employeeId,
                        readiness: s.readiness,
                        developmentPlan: s.notes || undefined,
                    });
                }
                showSuccess("Plan Updated", `Succession plan for "${form.position}" has been updated.`);
            } else {
                // Create one record per successor
                for (const s of validSuccessors) {
                    await createMutation.mutateAsync({
                        criticalRoleTitle: form.position,
                        successorId: s.employeeId,
                        readiness: s.readiness,
                        developmentPlan: s.notes || undefined,
                    });
                }
                showSuccess("Plan Created", `Succession plan for "${form.position}" has been created.`);
            }
            setModalOpen(false);
        } catch (err) { showApiError(err); }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteMutation.mutateAsync(deleteTarget.id);
            showSuccess("Plan Deleted", `Succession plan for "${deleteTarget.position}" has been removed.`);
            setDeleteTarget(null);
        } catch (err) { showApiError(err); }
    };

    const saving = createMutation.isPending || updateMutation.isPending;

    // Build 9-box from API data or fallback
    const buildNineBox = () => {
        if (nineBoxData?.grid) return nineBoxData.grid;
        const grid: Record<string, any[]> = {};
        for (let pot = 1; pot <= 3; pot++) {
            for (let perf = 1; perf <= 3; perf++) {
                grid[`${pot}-${perf}`] = [];
            }
        }
        if (nineBoxData?.employees) {
            (nineBoxData.employees as any[]).forEach((e: any) => {
                const pot = Math.min(3, Math.max(1, e.potentialBucket ?? 2));
                const perf = Math.min(3, Math.max(1, e.performanceBucket ?? 2));
                grid[`${pot}-${perf}`].push(e);
            });
        }
        return grid;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Succession Planning</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Plan leadership pipelines, assess bench strength, and visualize talent readiness</p>
                </div>
                <button onClick={openCreate} className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none">
                    <Plus className="w-5 h-5" /> New Plan
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                    <input type="text" placeholder="Search positions, roles..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                </div>
                <div className="flex items-center gap-3 overflow-x-auto pb-1 lg:pb-0">
                    <div className="flex items-center gap-1 border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
                        <button onClick={() => setViewMode("table")} className={cn("px-3 py-1.5 text-xs font-bold transition-colors flex items-center gap-1", viewMode === "table" ? "bg-primary-600 text-white" : "text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800")}><Table size={12} /> Plans</button>
                        <button onClick={() => setViewMode("ninebox")} className={cn("px-3 py-1.5 text-xs font-bold transition-colors flex items-center gap-1", viewMode === "ninebox" ? "bg-primary-600 text-white" : "text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800")}><Grid3X3 size={12} /> 9-Box</button>
                        <button onClick={() => setViewMode("bench")} className={cn("px-3 py-1.5 text-xs font-bold transition-colors flex items-center gap-1", viewMode === "bench" ? "bg-primary-600 text-white" : "text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800")}><BarChart3 size={12} /> Bench</button>
                    </div>
                    {viewMode === "table" && (
                        <div className="flex items-center gap-1">
                            {READINESS_FILTERS.map((f) => {
                                const label = f === "All" ? "All" : READINESS_LEVELS.find((r) => r.value === f)?.label ?? f;
                                return (
                                    <button key={f} onClick={() => setReadinessFilter(f)} className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all", readinessFilter === f ? "bg-primary-50 text-primary-700 border-primary-300 dark:bg-primary-900/30 dark:text-primary-400 dark:border-primary-700" : "bg-neutral-50 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700")}>
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">Failed to load succession data.</div>
            )}

            {/* Plans Table View */}
            {viewMode === "table" && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                    {isLoading ? <SkeletonTable rows={5} cols={6} /> : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[1000px]">
                                <thead>
                                    <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                        <th className="py-4 px-6 font-bold">Position / Role</th>
                                        <th className="py-4 px-6 font-bold">Successors</th>
                                        <th className="py-4 px-6 font-bold text-center">Bench Depth</th>
                                        <th className="py-4 px-6 font-bold text-center">Readiness</th>
                                        <th className="py-4 px-6 font-bold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {filtered.map((p: any) => {
                                        const successors = p.successors ?? [];
                                        const readyNow = successors.filter((s: any) => s.readiness === "READY_NOW").length;
                                        return (
                                            <tr key={p.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-accent-50 dark:bg-accent-900/30 flex items-center justify-center shrink-0">
                                                            <Shield className="w-4 h-4 text-accent-600 dark:text-accent-400" />
                                                        </div>
                                                        <div>
                                                            <span className="font-bold text-primary-950 dark:text-white">{p.position}</span>
                                                            {p.role && <p className="text-[10px] text-neutral-400">{p.role}</p>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex flex-wrap gap-1">
                                                        {successors.slice(0, 3).map((s: any, i: number) => {
                                                            const name = s.employee?.firstName
                                                                ? `${s.employee.firstName ?? ''} ${s.employee.lastName ?? ''}`.trim()
                                                                : employeeName(s.employeeId);
                                                            return (
                                                                <div key={i} className="flex items-center gap-1">
                                                                    <span className="text-xs text-neutral-600 dark:text-neutral-400">{name}</span>
                                                                    <ReadinessBadge readiness={s.readiness} />
                                                                </div>
                                                            );
                                                        })}
                                                        {successors.length > 3 && <span className="text-[10px] text-neutral-400">+{successors.length - 3} more</span>}
                                                        {successors.length === 0 && <span className="text-xs text-neutral-400">No successors</span>}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        {readyNow > 0 ? (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-success-700 dark:text-success-400 bg-success-50 dark:bg-success-900/20 px-2 py-0.5 rounded-full border border-success-200 dark:border-success-800/50">
                                                                <CheckCircle2 size={10} /> {readyNow} ready
                                                            </span>
                                                        ) : successors.length > 0 ? (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-warning-700 dark:text-warning-400 bg-warning-50 dark:bg-warning-900/20 px-2 py-0.5 rounded-full border border-warning-200 dark:border-warning-800/50">
                                                                <Clock size={10} /> In pipeline
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-danger-600 dark:text-danger-400 bg-danger-50 dark:bg-danger-900/20 px-2 py-0.5 rounded-full border border-danger-200 dark:border-danger-800/50">
                                                                <AlertTriangle size={10} /> No bench
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    {(() => {
                                                        const bestReadiness = successors.reduce((best: string | null, s: any) => {
                                                            const order = ['READY_NOW', 'ONE_YEAR', 'TWO_YEARS', 'NOT_READY'];
                                                            if (!best) return s.readiness;
                                                            return order.indexOf(s.readiness) < order.indexOf(best) ? s.readiness : best;
                                                        }, null);
                                                        return bestReadiness ? <ReadinessBadge readiness={bestReadiness} /> : <span className="text-xs text-neutral-400">—</span>;
                                                    })()}
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button onClick={() => openEdit(p)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit"><Edit3 size={15} /></button>
                                                        <button onClick={() => setDeleteTarget(p)} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" title="Delete"><Trash2 size={15} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filtered.length === 0 && !isLoading && (
                                        <tr><td colSpan={5}><EmptyState icon="list" title="No succession plans found" message="Create a succession plan to start building your leadership pipeline." action={{ label: "New Plan", onClick: openCreate }} /></td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* 9-Box Grid View */}
            {viewMode === "ninebox" && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 p-6">
                    {nineBoxQuery.isLoading ? (
                        <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 text-primary-400 animate-spin" /></div>
                    ) : (
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <h3 className="text-lg font-bold text-primary-950 dark:text-white">Talent 9-Box Grid</h3>
                                <span className="text-xs text-neutral-400">Potential (vertical) vs Performance (horizontal)</span>
                            </div>
                            <div className="flex">
                                <div className="flex flex-col items-center justify-center mr-3 w-6">
                                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>Potential</span>
                                </div>
                                <div className="flex-1">
                                    <div className="grid grid-cols-3 gap-2">
                                        {(() => {
                                            const grid = buildNineBox();
                                            const cells = [];
                                            for (let pot = 3; pot >= 1; pot--) {
                                                for (let perf = 1; perf <= 3; perf++) {
                                                    const key = `${pot}-${perf}`;
                                                    const config = NINE_BOX_LABELS[key];
                                                    const items = grid[key] ?? [];
                                                    cells.push(
                                                        <div key={key} className={cn("rounded-xl p-3 min-h-[130px] border transition-all", items.length > 0 ? "border-neutral-200 dark:border-neutral-700" : "border-dashed border-neutral-200 dark:border-neutral-700")}>
                                                            <div className="flex items-center gap-1.5 mb-1">
                                                                <div className={cn("w-2 h-2 rounded-full", config.color)} />
                                                                <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400">{config.label}</span>
                                                                {items.length > 0 && <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 ml-auto">{items.length}</span>}
                                                            </div>
                                                            <p className="text-[8px] text-neutral-400 mb-2">{config.desc}</p>
                                                            <div className="space-y-1">
                                                                {items.slice(0, 4).map((e: any, i: number) => (
                                                                    <div key={i} className="flex items-center gap-1.5">
                                                                        <div className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-[8px] font-bold text-primary-700 dark:text-primary-400">
                                                                            {employeeName(e.employeeId ?? e.id).charAt(0).toUpperCase()}
                                                                        </div>
                                                                        <span className="text-[10px] text-neutral-600 dark:text-neutral-400 truncate">{employeeName(e.employeeId ?? e.id)}</span>
                                                                    </div>
                                                                ))}
                                                                {items.length > 4 && <span className="text-[9px] text-neutral-400">+{items.length - 4} more</span>}
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                            }
                                            return cells;
                                        })()}
                                    </div>
                                    <div className="text-center mt-3">
                                        <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Performance</span>
                                    </div>
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

            {/* Bench Strength View */}
            {viewMode === "bench" && (
                <div className="space-y-4">
                    {benchQuery.isLoading ? (
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 p-12 flex items-center justify-center"><Loader2 className="w-8 h-8 text-primary-400 animate-spin" /></div>
                    ) : (
                        <>
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    { label: "Total Critical Roles", value: plans.length, icon: Shield, color: "primary" },
                                    { label: "With Successors", value: plans.filter((p: any) => (p.successors?.length ?? 0) > 0).length, icon: Users, color: "success" },
                                    { label: "Ready Now", value: plans.filter((p: any) => p.successors?.some((s: any) => s.readiness === "READY_NOW")).length, icon: CheckCircle2, color: "accent" },
                                    { label: "No Bench", value: plans.filter((p: any) => (p.successors?.length ?? 0) === 0).length, icon: AlertTriangle, color: "danger" },
                                ].map((card) => (
                                    <div key={card.label} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 p-5 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", `bg-${card.color}-50 dark:bg-${card.color}-900/30`)}>
                                                <card.icon className={cn("w-5 h-5", `text-${card.color}-600 dark:text-${card.color}-400`)} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{card.label}</p>
                                                <p className="text-2xl font-bold text-primary-950 dark:text-white">{card.value}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Bench Strength Bars */}
                            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 p-6">
                                <h3 className="text-lg font-bold text-primary-950 dark:text-white mb-4">Bench Strength by Position</h3>
                                <div className="space-y-4">
                                    {(benchData.length > 0 ? benchData : plans).map((item: any, i: number) => {
                                        const successorCount = item.successorCount ?? item.successors?.length ?? 0;
                                        const readyNowCount = item.readyNowCount ?? item.successors?.filter((s: any) => s.readiness === "READY_NOW").length ?? 0;
                                        const maxSuccessors = 5;
                                        const pct = Math.min((successorCount / maxSuccessors) * 100, 100);
                                        return (
                                            <div key={i} className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-bold text-primary-950 dark:text-white">{item.position ?? item.role ?? "Unnamed"}</span>
                                                        <span className="text-xs text-neutral-400">{employeeName(item.currentHolderId ?? "")}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">{successorCount} successor{successorCount !== 1 ? "s" : ""}</span>
                                                        {readyNowCount > 0 && <span className="text-[10px] font-bold text-success-600 dark:text-success-400">({readyNowCount} ready)</span>}
                                                    </div>
                                                </div>
                                                <div className="h-2.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                                                    <div
                                                        className={cn("h-full rounded-full transition-all", successorCount === 0 ? "bg-danger-400" : readyNowCount > 0 ? "bg-success-400" : "bg-warning-400")}
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {plans.length === 0 && benchData.length === 0 && (
                                        <div className="flex flex-col items-center py-12 space-y-3">
                                            <BarChart3 className="w-10 h-10 text-neutral-300 dark:text-neutral-600" />
                                            <p className="text-sm text-neutral-400">Create succession plans to view bench strength analysis</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ── Create/Edit Modal ── */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{editingId ? "Edit Succession Plan" : "New Succession Plan"}</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <SectionLabel title="Position Details" />
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Position Title</label>
                                    <input type="text" value={form.position} onChange={(e) => setForm((p: any) => ({ ...p, position: e.target.value }))} placeholder="e.g., VP of Engineering" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Role</label>
                                    <input type="text" value={form.role} onChange={(e) => setForm((p: any) => ({ ...p, role: e.target.value }))} placeholder="e.g., Engineering Leadership" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                                </div>
                            </div>
                            <SectionLabel title="Potential Successors" />
                            <div className="space-y-3">
                                {form.successors.map((s: any, index: number) => (
                                    <div key={index} className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">Successor #{index + 1}</span>
                                            {form.successors.length > 1 && (
                                                <button onClick={() => removeSuccessor(index)} className="p-1 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors"><X size={14} /></button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[10px] text-neutral-400 mb-1">Employee</label>
                                                <select value={s.employeeId} onChange={(e) => updateSuccessor(index, "employeeId", e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none dark:text-white">
                                                    <option value="">Select...</option>
                                                    {employees.map((e: any) => <option key={e.id} value={e.id}>{[e.firstName, e.lastName].filter(Boolean).join(" ") || e.fullName || e.email}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-neutral-400 mb-1">Readiness</label>
                                                <select value={s.readiness} onChange={(e) => updateSuccessor(index, "readiness", e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none dark:text-white">
                                                    {READINESS_LEVELS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-neutral-400 mb-1">Notes</label>
                                            <input type="text" value={s.notes} onChange={(e) => updateSuccessor(index, "notes", e.target.value)} placeholder="Development areas, timeline..." className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none dark:text-white placeholder:text-neutral-400" />
                                        </div>
                                    </div>
                                ))}
                                <button onClick={addSuccessor} className="w-full py-2.5 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 text-sm font-bold text-neutral-500 dark:text-neutral-400 hover:border-primary-400 hover:text-primary-600 dark:hover:border-primary-600 dark:hover:text-primary-400 transition-colors flex items-center justify-center gap-2">
                                    <Plus size={14} /> Add Successor
                                </button>
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleSave} disabled={saving || !form.position} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
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
                        <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">Delete Succession Plan?</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">This will permanently delete the succession plan for <strong>"{deleteTarget.position}"</strong>.</p>
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
