import { useState, useMemo } from "react";
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import {
    ClipboardList,
    Plus,
    Edit3,
    Trash2,
    Loader2,
    X,
    Search,
    CheckCircle2,
    SkipForward,
    ListChecks,
    FileText,
    AlertTriangle,
    Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    useOnboardingTemplates,
    useOnboardingTasks,
    useOnboardingProgress,
} from "@/features/company-admin/api/use-onboarding-queries";
import {
    useCreateOnboardingTemplate,
    useUpdateOnboardingTemplate,
    useDeleteOnboardingTemplate,
    useGenerateOnboardingTasks,
    useUpdateOnboardingTask,
} from "@/features/company-admin/api/use-onboarding-mutations";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Atoms ── */

function FormField({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
    required,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
    required?: boolean;
}) {
    return (
        <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                {label} {required && <span className="text-danger-500">*</span>}
            </label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
            />
        </div>
    );
}

function SelectField({
    label,
    value,
    onChange,
    options,
    placeholder,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
}) {
    return (
        <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                {label}
            </label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
            >
                <option value="">{placeholder ?? "Select..."}</option>
                {options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const s = status?.toLowerCase();
    const cls =
        s === "completed"
            ? "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50"
            : s === "skipped"
            ? "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700"
            : s === "overdue"
            ? "bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50"
            : "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50";
    return (
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase", cls)}>
            {status}
        </span>
    );
}

function DefaultBadge() {
    return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50">
            Default
        </span>
    );
}

function ProgressBar({ percentage }: { percentage: number }) {
    return (
        <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                    className={cn(
                        "h-full rounded-full transition-all",
                        percentage >= 100 ? "bg-success-500" : percentage >= 50 ? "bg-primary-500" : "bg-warning-500"
                    )}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                />
            </div>
            <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400 min-w-[40px] text-right">
                {Math.round(percentage)}%
            </span>
        </div>
    );
}

/* ── Constants ── */

type Tab = "templates" | "tasks";

const TASK_STATUSES = [
    { value: "PENDING", label: "Pending" },
    { value: "COMPLETED", label: "Completed" },
    { value: "SKIPPED", label: "Skipped" },
    { value: "OVERDUE", label: "Overdue" },
];

const EMPTY_TEMPLATE = {
    name: "",
    description: "",
    items: "",
    isDefault: false,
};

/* ── Screen ── */

export function OnboardingScreen() {
    const fmt = useCompanyFormatter();
    const [activeTab, setActiveTab] = useState<Tab>("templates");
    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...EMPTY_TEMPLATE });
    const [deleteTarget, setDeleteTarget] = useState<any>(null);
    const [taskStatusFilter, setTaskStatusFilter] = useState("");
    const [taskDeptFilter, setTaskDeptFilter] = useState("");
    const [selectedEmployee, setSelectedEmployee] = useState("");

    const { data: templatesData, isLoading: templatesLoading, isError: templatesError } = useOnboardingTemplates();
    const { data: tasksData, isLoading: tasksLoading, isError: tasksError } = useOnboardingTasks(
        { status: taskStatusFilter || undefined, department: taskDeptFilter || undefined, employeeId: selectedEmployee || undefined } as any
    );

    const createMutation = useCreateOnboardingTemplate();
    const updateMutation = useUpdateOnboardingTemplate();
    const deleteMutation = useDeleteOnboardingTemplate();
    const generateTasksMutation = useGenerateOnboardingTasks();
    const updateTaskMutation = useUpdateOnboardingTask();

    const templates: any[] = (templatesData as any)?.data ?? [];
    const tasks: any[] = (tasksData as any)?.data ?? [];

    const filteredTemplates = useMemo(() => {
        if (!search) return templates;
        const s = search.toLowerCase();
        return templates.filter((t: any) => t.name?.toLowerCase().includes(s));
    }, [templates, search]);

    const filteredTasks = useMemo(() => {
        if (!search) return tasks;
        const s = search.toLowerCase();
        return tasks.filter((t: any) =>
            t.title?.toLowerCase().includes(s) ||
            t.employeeName?.toLowerCase().includes(s) ||
            t.department?.toLowerCase().includes(s)
        );
    }, [tasks, search]);

    // Group tasks by employee for progress
    const employeeProgress = useMemo(() => {
        const map = new Map<string, { name: string; total: number; completed: number }>();
        tasks.forEach((t: any) => {
            const key = t.employeeId ?? t.employee?.id ?? "unknown";
            const name = t.employeeName ?? t.employee?.name ?? "Unknown";
            if (!map.has(key)) map.set(key, { name, total: 0, completed: 0 });
            const entry = map.get(key)!;
            entry.total++;
            if (t.status === "COMPLETED" || t.status === "completed") entry.completed++;
        });
        return Array.from(map.entries());
    }, [tasks]);

    const openCreate = () => {
        setEditingId(null);
        setForm({ ...EMPTY_TEMPLATE });
        setModalOpen(true);
    };

    const openEdit = (template: any) => {
        setEditingId(template.id);
        setForm({
            name: template.name ?? "",
            description: template.description ?? "",
            items: Array.isArray(template.items) ? template.items.map((i: any) => typeof i === "string" ? i : i.title ?? i.name).join("\n") : "",
            isDefault: template.isDefault ?? false,
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        try {
            const payload = {
                name: form.name,
                description: form.description || undefined,
                items: form.items.split("\n").map((s) => s.trim()).filter(Boolean),
                isDefault: form.isDefault,
            };
            if (editingId) {
                await updateMutation.mutateAsync({ id: editingId, data: payload });
                showSuccess("Template Updated", `${form.name} has been updated.`);
            } else {
                await createMutation.mutateAsync(payload);
                showSuccess("Template Created", `${form.name} has been created.`);
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
            showSuccess("Template Deleted", `${deleteTarget.name} has been removed.`);
            setDeleteTarget(null);
        } catch (err) {
            showApiError(err);
        }
    };

    const handleTaskAction = async (taskId: string, action: "COMPLETED" | "SKIPPED") => {
        try {
            await updateTaskMutation.mutateAsync({ id: taskId, data: { status: action } });
            showSuccess("Task Updated", `Task marked as ${action.toLowerCase()}.`);
        } catch (err) {
            showApiError(err);
        }
    };

    const saving = createMutation.isPending || updateMutation.isPending;
    const updateField = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Onboarding</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Manage onboarding templates and track employee tasks</p>
                </div>
                {activeTab === "templates" && (
                    <button
                        onClick={openCreate}
                        className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
                    >
                        <Plus className="w-5 h-5" />
                        Add Template
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl w-fit">
                {(["templates", "tasks"] as Tab[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => { setActiveTab(tab); setSearch(""); }}
                        className={cn(
                            "px-5 py-2 rounded-lg text-sm font-bold transition-all capitalize flex items-center gap-2",
                            activeTab === tab
                                ? "bg-white dark:bg-neutral-700 text-primary-700 dark:text-primary-400 shadow-sm"
                                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
                        )}
                    >
                        {tab === "templates" ? <FileText className="w-4 h-4" /> : <ListChecks className="w-4 h-4" />}
                        {tab}
                    </button>
                ))}
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                        <input
                            type="text"
                            placeholder={activeTab === "templates" ? "Search templates..." : "Search tasks..."}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                        />
                    </div>
                    {activeTab === "tasks" && (
                        <>
                            <select
                                value={taskStatusFilter}
                                onChange={(e) => setTaskStatusFilter(e.target.value)}
                                className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:text-white transition-all"
                            >
                                <option value="">All Statuses</option>
                                {TASK_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                            <select
                                value={taskDeptFilter}
                                onChange={(e) => setTaskDeptFilter(e.target.value)}
                                className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:text-white transition-all"
                            >
                                <option value="">All Departments</option>
                            </select>
                        </>
                    )}
                </div>
            </div>

            {/* Employee Progress (Tasks tab only) */}
            {activeTab === "tasks" && employeeProgress.length > 0 && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-5">
                    <h3 className="text-sm font-bold text-primary-950 dark:text-white mb-4 flex items-center gap-2">
                        <Users className="w-4 h-4" /> Employee Progress
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {employeeProgress.map(([id, info]) => (
                            <div key={id} className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-bold text-primary-950 dark:text-white">{info.name}</span>
                                    <span className="text-xs text-neutral-500">{info.completed}/{info.total}</span>
                                </div>
                                <ProgressBar percentage={info.total > 0 ? (info.completed / info.total) * 100 : 0} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {(activeTab === "templates" ? templatesError : tasksError) && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
                    Failed to load {activeTab}. Please try again.
                </div>
            )}

            {/* Templates Table */}
            {activeTab === "templates" && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                    {templatesLoading ? (
                        <SkeletonTable rows={5} cols={5} />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[700px]">
                                <thead>
                                    <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                        <th className="py-4 px-6 font-bold">Template Name</th>
                                        <th className="py-4 px-6 font-bold">Description</th>
                                        <th className="py-4 px-6 font-bold text-center">Items</th>
                                        <th className="py-4 px-6 font-bold text-center">Default</th>
                                        <th className="py-4 px-6 font-bold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {filteredTemplates.map((t: any) => (
                                        <tr
                                            key={t.id}
                                            className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors"
                                        >
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                                                        <ClipboardList className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                                    </div>
                                                    <span className="font-bold text-primary-950 dark:text-white">{t.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">{t.description || "—"}</td>
                                            <td className="py-4 px-6 text-center">
                                                <span className="font-bold text-primary-700 dark:text-primary-400">
                                                    {Array.isArray(t.items) ? t.items.length : 0}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                {t.isDefault && <DefaultBadge />}
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => openEdit(t)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit">
                                                        <Edit3 size={15} />
                                                    </button>
                                                    <button onClick={() => setDeleteTarget(t)} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" title="Delete">
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredTemplates.length === 0 && !templatesLoading && (
                                        <tr>
                                            <td colSpan={5}>
                                                <EmptyState icon="list" title="No templates found" message="Create your first onboarding template to get started." action={{ label: "Add Template", onClick: openCreate }} />
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Tasks Table */}
            {activeTab === "tasks" && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                    {tasksLoading ? (
                        <SkeletonTable rows={6} cols={7} />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[900px]">
                                <thead>
                                    <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                        <th className="py-4 px-6 font-bold">Task</th>
                                        <th className="py-4 px-6 font-bold">Employee</th>
                                        <th className="py-4 px-6 font-bold">Department</th>
                                        <th className="py-4 px-6 font-bold text-center">Status</th>
                                        <th className="py-4 px-6 font-bold">Due Date</th>
                                        <th className="py-4 px-6 font-bold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {filteredTasks.map((t: any) => (
                                        <tr
                                            key={t.id}
                                            className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors"
                                        >
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-accent-50 dark:bg-accent-900/30 flex items-center justify-center shrink-0">
                                                        <ListChecks className="w-4 h-4 text-accent-600 dark:text-accent-400" />
                                                    </div>
                                                    <span className="font-bold text-primary-950 dark:text-white">{t.title ?? t.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-neutral-700 dark:text-neutral-300 text-xs font-medium">{t.employeeName ?? t.employee?.name ?? "—"}</td>
                                            <td className="py-4 px-6">
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-accent-50 text-accent-700 border-accent-200 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50">
                                                    {t.department ?? "—"}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <StatusBadge status={t.status ?? "PENDING"} />
                                            </td>
                                            <td className="py-4 px-6 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                                                {t.dueDate ? fmt.date(t.dueDate) : "—"}
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                {(t.status === "PENDING" || t.status === "pending") && (
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            onClick={() => handleTaskAction(t.id, "COMPLETED")}
                                                            className="p-2 text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20 rounded-lg transition-colors"
                                                            title="Complete"
                                                        >
                                                            <CheckCircle2 size={15} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleTaskAction(t.id, "SKIPPED")}
                                                            className="p-2 text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                                                            title="Skip"
                                                        >
                                                            <SkipForward size={15} />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredTasks.length === 0 && !tasksLoading && (
                                        <tr>
                                            <td colSpan={6}>
                                                <EmptyState icon="list" title="No tasks found" message="Generate onboarding tasks from a template to get started." />
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ── Create/Edit Template Modal ── */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{editingId ? "Edit Template" : "Add Template"}</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <FormField label="Template Name" value={form.name} onChange={(v) => updateField("name", v)} placeholder="e.g. Standard Onboarding" required />
                            <FormField label="Description" value={form.description} onChange={(v) => updateField("description", v)} placeholder="Optional description" />
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                                    Checklist Items <span className="text-danger-500">*</span>
                                </label>
                                <textarea
                                    value={form.items}
                                    onChange={(e) => updateField("items", e.target.value)}
                                    placeholder="One item per line, e.g.&#10;Issue laptop&#10;Create email account&#10;Assign mentor"
                                    rows={6}
                                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none"
                                />
                                <p className="text-[10px] text-neutral-400 mt-1">{form.items.split("\n").filter(Boolean).length} items</p>
                            </div>
                            <div className="flex items-center justify-between px-1">
                                <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Set as Default</label>
                                <button
                                    type="button"
                                    onClick={() => updateField("isDefault", !form.isDefault)}
                                    className={cn(
                                        "w-11 h-6 rounded-full transition-colors relative flex-shrink-0",
                                        form.isDefault ? "bg-success-500" : "bg-neutral-300 dark:bg-neutral-700"
                                    )}
                                >
                                    <div className={cn("w-[18px] h-[18px] rounded-full bg-white absolute top-[3px] transition-all shadow-sm", form.isDefault ? "left-[22px]" : "left-[3px]")} />
                                </button>
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleSave} disabled={saving || !form.name.trim()} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
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
                        <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">Delete Template?</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            This will permanently delete <strong>{deleteTarget.name}</strong>. This action cannot be undone.
                        </p>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleDelete} disabled={deleteMutation.isPending} className="flex-1 py-3 rounded-xl bg-danger-600 hover:bg-danger-700 text-white text-sm font-bold transition-colors disabled:opacity-50">
                                {deleteMutation.isPending ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
