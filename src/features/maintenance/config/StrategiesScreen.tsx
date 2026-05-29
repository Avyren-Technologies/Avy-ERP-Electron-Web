import { useState } from "react";
import {
    Plus,
    Edit3,
    Trash2,
    Loader2,
    X,
    Search,
    CheckCircle2,
    XCircle,
    Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCanPerform } from "@/hooks/useCanPerform";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";
import { useStrategies } from "@/features/maintenance/api/use-maintenance-queries";
import { HelpDrawer } from "@/components/ui/HelpDrawer";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { strategiesHelp } from "@/features/maintenance/help";
import {
    useCreateStrategy,
    useUpdateStrategy,
    useDeleteStrategy,
} from "@/features/maintenance/api/use-maintenance-mutations";

/* ── Constants ── */

const STRATEGY_TYPES = [
    { value: "PREVENTIVE_CALENDAR", label: "Preventive (Calendar)" },
    { value: "PREVENTIVE_METER", label: "Preventive (Meter)" },
    { value: "CORRECTIVE", label: "Corrective" },
    { value: "CONDITION_BASED", label: "Condition Based" },
    { value: "PREDICTIVE", label: "Predictive" },
    { value: "SEASONAL", label: "Seasonal" },
    { value: "STATUTORY", label: "Statutory" },
    { value: "AMC_MANAGED", label: "AMC Managed" },
    { value: "RUN_TO_FAILURE", label: "Run to Failure" },
    { value: "SHUTDOWN_OVERHAUL", label: "Shutdown / Overhaul" },
];

const STRATEGY_TYPE_MAP: Record<string, string> = Object.fromEntries(STRATEGY_TYPES.map((t) => [t.value, t.label]));

const STRATEGY_TEMPLATES: Record<string, string> = {
    PREVENTIVE_CALENDAR: JSON.stringify({ intervalDays: 30, nonWorkingDayRule: "MOVE_LATER" }, null, 2),
    PREVENTIVE_METER: JSON.stringify({ meterType: "RUNTIME_HOURS", intervalValue: 250, limitValue: 5000 }, null, 2),
    CORRECTIVE: JSON.stringify({ triggerOnFailure: true }, null, 2),
    CONDITION_BASED: JSON.stringify({ metric: "TEMPERATURE", operator: "GREATER_THAN", threshold: 80 }, null, 2),
    PREDICTIVE: JSON.stringify({ anomalyThreshold: 0.85, windowDays: 7 }, null, 2),
    SEASONAL: JSON.stringify({ season: "SUMMER", startMonth: 5, endMonth: 8 }, null, 2),
    STATUTORY: JSON.stringify({ regulatoryBody: "OSHA", inspectionIntervalMonths: 12 }, null, 2),
    AMC_MANAGED: JSON.stringify({ contractId: "AMC-100", visitFrequency: "QUARTERLY" }, null, 2),
    RUN_TO_FAILURE: JSON.stringify({ allowBreakdown: true }, null, 2),
    SHUTDOWN_OVERHAUL: JSON.stringify({ shutdownEventId: "MAJOR_SHUTDOWN", requireOverhaul: true }, null, 2),
};

function StatusBadge({ active }: { active: boolean }) {
    return active ? (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border bg-success-50 text-success-700 border-success-100 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50">
            <CheckCircle2 size={10} /> Active
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border bg-neutral-100 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700">
            <XCircle size={10} /> Inactive
        </span>
    );
}

interface StrategyForm {
    name: string;
    strategyType: string;
    description: string;
    triggerConfig: string;
    isActive: boolean;
}

const EMPTY_FORM: StrategyForm = { name: "", strategyType: "PREVENTIVE_CALENDAR", description: "", triggerConfig: "", isActive: true };

export function StrategiesScreen() {
    const canConfigure = useCanPerform("maintenance:configure");
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState("");
    const { data, isLoading } = useStrategies({ search: search || undefined, strategyType: filterType || undefined });
    const createMut = useCreateStrategy();
    const updateMut = useUpdateStrategy();
    const deleteMut = useDeleteStrategy();

    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<StrategyForm>({ ...EMPTY_FORM });
    const [deleteTarget, setDeleteTarget] = useState<any>(null);

    const strategies: any[] = data?.data ?? [];

    const openCreate = () => { setEditingId(null); setForm({ ...EMPTY_FORM }); setModalOpen(true); };
    const openEdit = (s: any) => {
        setEditingId(s.id);
        setForm({
            name: s.name ?? "",
            strategyType: s.strategyType ?? "PREVENTIVE_CALENDAR",
            description: s.description ?? "",
            triggerConfig: s.triggerConfig ? JSON.stringify(s.triggerConfig, null, 2) : "",
            isActive: s.isActive ?? true,
        });
        setModalOpen(true);
    };

    const handleTypeChange = (type: string) => {
        setForm((p) => {
            const isCurrentTemplateOrEmpty = !p.triggerConfig.trim() || Object.values(STRATEGY_TEMPLATES).includes(p.triggerConfig);
            return {
                ...p,
                strategyType: type,
                triggerConfig: isCurrentTemplateOrEmpty ? (STRATEGY_TEMPLATES[type] ?? "") : p.triggerConfig,
            };
        });
    };

    const handleSave = async () => {
        if (!form.name.trim()) { showApiError({ message: "Name is required" }); return; }
        let triggerConfig: Record<string, unknown> | undefined;
        if (form.triggerConfig.trim()) {
            try { triggerConfig = JSON.parse(form.triggerConfig); } catch { showApiError({ message: "Invalid JSON in trigger config" }); return; }
        }
        try {
            const payload: any = {
                name: form.name.trim(),
                strategyType: form.strategyType,
                description: form.description || undefined,
                triggerConfig,
            };
            if (editingId) {
                await updateMut.mutateAsync({ id: editingId, data: { ...payload, isActive: form.isActive } });
                showSuccess("Updated", `${form.name} updated.`);
            } else {
                await createMut.mutateAsync(payload);
                showSuccess("Created", `${form.name} created.`);
            }
            setModalOpen(false);
        } catch (err) { showApiError(err); }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try { await deleteMut.mutateAsync(deleteTarget.id); showSuccess("Deleted", `${deleteTarget.name} deleted.`); setDeleteTarget(null); } catch (err) { showApiError(err); }
    };

    const saving = createMut.isPending || updateMut.isPending;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Maintenance Strategies</h1>
                        <HelpDrawer help={strategiesHelp} />
                    </div>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Define maintenance strategies and scheduling rules</p>
                </div>
                {canConfigure && (
                    <button onClick={openCreate} className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all">
                        <Plus className="w-5 h-5" /> Add Strategy
                    </button>
                )}
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input type="text" placeholder="Search strategies..." value={search} onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                </div>
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                    <option value="">All Types</option>
                    {STRATEGY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? <SkeletonTable rows={5} cols={5} /> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Name</th>
                                    <th className="py-4 px-6 font-bold">Strategy Type</th>
                                    <th className="py-4 px-6 font-bold">Description</th>
                                    <th className="py-4 px-6 font-bold">Status</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {strategies.map((s: any) => (
                                    <tr key={s.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-accent-50 dark:bg-accent-900/30 flex items-center justify-center shrink-0">
                                                    <Target className="w-4 h-4 text-accent-600 dark:text-accent-400" />
                                                </div>
                                                <span className="font-bold text-primary-950 dark:text-white">{s.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">
                                                {STRATEGY_TYPE_MAP[s.strategyType] ?? s.strategyType}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-neutral-500 dark:text-neutral-400 text-xs line-clamp-1 max-w-[200px]">{s.description || "---"}</td>
                                        <td className="py-4 px-6"><StatusBadge active={s.isActive ?? true} /></td>
                                        <td className="py-4 px-6 text-right">
                                            {canConfigure && (
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => openEdit(s)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit"><Edit3 size={15} /></button>
                                                    <button onClick={() => setDeleteTarget(s)} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" title="Delete"><Trash2 size={15} /></button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {strategies.length === 0 && !isLoading && (
                                    <tr><td colSpan={5}><EmptyState icon="list" title="No strategies configured" message="Add your first maintenance strategy." action={canConfigure ? { label: "Add Strategy", onClick: openCreate } : undefined} /></td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{editingId ? "Edit Strategy" : "Add Strategy"}</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                                    Name<span className="text-danger-500 ml-0.5">*</span>
                                </label>
                                <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Monthly PM"
                                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">Strategy Type <InfoTooltip content={strategiesHelp.fields!.strategyType} /></label>
                                <select value={form.strategyType} onChange={(e) => handleTypeChange(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                    {STRATEGY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Description</label>
                                <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Optional description" rows={2}
                                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none" />
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">Trigger Config (JSON) <InfoTooltip content={strategiesHelp.fields!.triggerConfig} /></label>
                                    <button type="button" onClick={() => setForm((p) => ({ ...p, triggerConfig: STRATEGY_TEMPLATES[p.strategyType] ?? "" }))}
                                        className="text-xs font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
                                        Load Template
                                    </button>
                                </div>
                                <textarea value={form.triggerConfig} onChange={(e) => setForm((p) => ({ ...p, triggerConfig: e.target.value }))} placeholder='{"intervalDays": 30}' rows={4}
                                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none" />
                            </div>
                            {editingId && (
                                <div className="flex items-center gap-3">
                                    <button type="button" onClick={() => setForm((p) => ({ ...p, isActive: !p.isActive }))}
                                        className={cn("w-10 h-6 rounded-full transition-colors relative flex-shrink-0", form.isActive ? "bg-primary-600" : "bg-neutral-300 dark:bg-neutral-700")}>
                                        <div className={cn("w-4 h-4 rounded-full bg-white absolute top-1 transition-all", form.isActive ? "left-5" : "left-1")} />
                                    </button>
                                    <span className="text-sm font-medium text-primary-950 dark:text-white">Active</span>
                                </div>
                            )}
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

            {/* Delete Confirm */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">Delete Strategy?</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            This will permanently delete <strong>{deleteTarget.name}</strong>. This action cannot be undone.
                        </p>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleDelete} disabled={deleteMut.isPending} className="flex-1 py-3 rounded-xl bg-danger-600 hover:bg-danger-700 text-white text-sm font-bold transition-colors disabled:opacity-50">
                                {deleteMut.isPending ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
