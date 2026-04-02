import { useState } from "react";
import {
    GitBranch,
    Plus,
    Pencil,
    Trash2,
    X,
    Loader2,
    Search,
    ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApprovalWorkflows, useApprovalWorkflowConfig } from "@/features/company-admin/api/use-ess-queries";
import {
    useCreateApprovalWorkflow,
    useUpdateApprovalWorkflow,
    useDeleteApprovalWorkflow,
} from "@/features/company-admin/api/use-ess-mutations";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Constants ── */

const EMPTY_STEP = {
    stepOrder: 1,
    approverRole: "",
    slaHours: 24,
    autoEscalate: false,
    autoApprove: false,
    autoReject: false,
};

const EMPTY_FORM = {
    name: "",
    triggerEvent: "",
    isActive: true,
    steps: [{ ...EMPTY_STEP }],
};

/* ── Screen ── */

export function ApprovalWorkflowScreen() {
    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [deleteTarget, setDeleteTarget] = useState<any>(null);

    const { data, isLoading, isError } = useApprovalWorkflows();
    const { data: configData } = useApprovalWorkflowConfig();
    const createMutation = useCreateApprovalWorkflow();
    const updateMutation = useUpdateApprovalWorkflow();
    const deleteMutation = useDeleteApprovalWorkflow();

    const TRIGGER_EVENTS: Array<{ value: string; label: string }> = configData?.data?.triggerEvents ?? [];
    const APPROVER_ROLES: Array<{ value: string; label: string }> = configData?.data?.approverRoles ?? [];

    function TriggerBadge({ event }: { event: string }) {
        const label = TRIGGER_EVENTS.find((t: any) => t.value === event)?.label ?? event;
        return (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border bg-accent-50 text-accent-700 border-accent-200 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50 capitalize">
                {label}
            </span>
        );
    }

    const workflows: any[] = data?.data ?? [];

    const filtered = workflows.filter((w: any) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return w.name?.toLowerCase().includes(s) || w.triggerEvent?.toLowerCase().includes(s);
    });

    const openCreate = () => {
        setEditId(null);
        setForm({ ...EMPTY_FORM, steps: [{ ...EMPTY_STEP }] });
        setModalOpen(true);
    };

    const openEdit = (w: any) => {
        setEditId(w.id);
        setForm({
            name: w.name ?? "",
            triggerEvent: w.triggerEvent ?? "",
            isActive: w.isActive ?? w.active ?? true,
            steps: (w.steps ?? []).length > 0 ? w.steps.map((s: any) => ({ ...EMPTY_STEP, ...s })) : [{ ...EMPTY_STEP }],
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        const payload = {
            ...form,
            steps: form.steps.map((s: any, i: number) => ({
                approverRole: s.approverRole,
                slaHours: Math.max(1, Number(s.slaHours) || 24),
                autoEscalate: s.autoEscalate ?? false,
                autoApprove: s.autoApprove ?? false,
                autoReject: s.autoReject ?? false,
                ...(s.approverId ? { approverId: s.approverId } : {}),
                stepOrder: s.stepOrder ?? i + 1,
            })),
        };
        try {
            if (editId) {
                await updateMutation.mutateAsync({ id: editId, data: payload });
                showSuccess("Workflow Updated", `"${form.name}" has been updated.`);
            } else {
                await createMutation.mutateAsync(payload);
                showSuccess("Workflow Created", `"${form.name}" has been created.`);
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
            showSuccess("Workflow Deleted", `"${deleteTarget.name}" has been removed.`);
            setDeleteTarget(null);
        } catch (err) {
            showApiError(err);
        }
    };

    const toggleActive = async (w: any) => {
        const currentIsActive = w.isActive ?? w.active ?? true;
        try {
            await updateMutation.mutateAsync({ id: w.id, data: { isActive: !currentIsActive } });
            showSuccess(currentIsActive ? "Workflow Deactivated" : "Workflow Activated", `"${w.name}" is now ${currentIsActive ? "inactive" : "active"}.`);
        } catch (err) {
            showApiError(err);
        }
    };

    const updateStep = (index: number, key: string, value: any) => {
        setForm((prev) => ({
            ...prev,
            steps: prev.steps.map((s, i) => (i === index ? { ...s, [key]: value } : s)),
        }));
    };

    const addStep = () => setForm((prev) => ({ ...prev, steps: [...prev.steps, { ...EMPTY_STEP }] }));
    const removeStep = (index: number) => setForm((prev) => ({ ...prev, steps: prev.steps.filter((_, i) => i !== index) }));

    const saving = createMutation.isPending || updateMutation.isPending;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Approval Workflows</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Design multi-step approval chains for various processes</p>
                </div>
                <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
                >
                    <Plus className="w-5 h-5" />
                    Add Workflow
                </button>
            </div>

            {/* Search */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                    <input
                        type="text"
                        placeholder="Search workflows..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? (
                    <SkeletonTable rows={5} cols={5} />
                ) : isError ? (
                    <div className="p-8 text-center text-danger-600 dark:text-danger-400 font-medium">Failed to load workflows.</div>
                ) : filtered.length === 0 ? (
                    <EmptyState icon="list" title="No workflows found" message="Create your first approval workflow to get started." />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Name</th>
                                    <th className="py-4 px-6 font-bold">Trigger Event</th>
                                    <th className="py-4 px-6 font-bold text-center">Steps</th>
                                    <th className="py-4 px-6 font-bold text-center">Active</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.map((w: any) => (
                                    (() => {
                                        const isWorkflowActive = w.isActive ?? w.active ?? true;
                                        return (
                                    <tr key={w.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                                                    <GitBranch size={14} className="text-primary-600 dark:text-primary-400" />
                                                </div>
                                                <span className="font-bold text-primary-950 dark:text-white">{w.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6"><TriggerBadge event={w.triggerEvent} /></td>
                                        <td className="py-4 px-6 text-center font-semibold text-primary-950 dark:text-white">{(w.steps ?? []).length}</td>
                                        <td className="py-4 px-6 text-center">
                                            <button
                                                onClick={() => toggleActive(w)}
                                                className={cn(
                                                    "w-10 h-6 rounded-full transition-colors relative inline-block",
                                                    isWorkflowActive ? "bg-success-500" : "bg-neutral-300 dark:bg-neutral-700"
                                                )}
                                            >
                                                <div className={cn("w-4 h-4 rounded-full bg-white absolute top-1 transition-all", isWorkflowActive ? "left-5" : "left-1")} />
                                            </button>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => openEdit(w)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit">
                                                    <Pencil size={15} />
                                                </button>
                                                <button onClick={() => setDeleteTarget(w)} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" title="Delete">
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                        );
                                    })()
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Workflow Modal ── */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{editId ? "Edit Workflow" : "New Workflow"}</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-5">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Workflow Name</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                                    placeholder="e.g., Leave Approval Chain"
                                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Trigger Event</label>
                                <select
                                    value={form.triggerEvent}
                                    onChange={(e) => setForm((p) => ({ ...p, triggerEvent: e.target.value }))}
                                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                                >
                                    <option value="">Select trigger event...</option>
                                    {TRIGGER_EVENTS.map((t) => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">Approval Steps</label>
                                <div className="space-y-3">
                                    {form.steps.map((step, i) => (
                                        <div key={i}>
                                            <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-primary-600 dark:text-primary-400">Step {i + 1}</span>
                                                    {form.steps.length > 1 && (
                                                        <button onClick={() => removeStep(i)} className="p-1 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors">
                                                            <Trash2 size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-[10px] text-neutral-400 mb-1">Approver Role</label>
                                                        <select
                                                            value={step.approverRole}
                                                            onChange={(e) => updateStep(i, "approverRole", e.target.value)}
                                                            className="w-full px-2.5 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none dark:text-white"
                                                        >
                                                            <option value="">Select role...</option>
                                                            {APPROVER_ROLES.map((r) => (
                                                                <option key={r.value} value={r.value}>{r.label}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] text-neutral-400 mb-1">SLA (Hours)</label>
                                                        <input
                                                            type="number"
                                                            value={step.slaHours}
                                                            onChange={(e) => updateStep(i, "slaHours", Number(e.target.value))}
                                                            min={1}
                                                            className="w-full px-2.5 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-mono focus:outline-none dark:text-white"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex gap-6">
                                                    <label className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer">
                                                        <input type="checkbox" checked={step.autoEscalate} onChange={(e) => updateStep(i, "autoEscalate", e.target.checked)} className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500" />
                                                        Auto-Escalate on SLA breach
                                                    </label>
                                                    <label className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer">
                                                        <input type="checkbox" checked={step.autoApprove} onChange={(e) => updateStep(i, "autoApprove", e.target.checked)} className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500" />
                                                        Auto-Approve on SLA breach
                                                    </label>
                                                </div>
                                            </div>
                                            {i < form.steps.length - 1 && (
                                                <div className="flex justify-center py-1">
                                                    <ArrowDown size={16} className="text-neutral-300 dark:text-neutral-600" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button onClick={addStep} className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors">
                                    <Plus size={14} /> Add Step
                                </button>
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {saving && <Loader2 size={14} className="animate-spin" />}
                                {editId ? "Update Workflow" : "Create Workflow"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Confirmation ── */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">Delete Workflow?</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            This will permanently delete <strong>"{deleteTarget.name}"</strong>. This action cannot be undone.
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
