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
    ClipboardList,
    Shield,
    Camera,
    PenTool,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCanPerform } from "@/hooks/useCanPerform";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";
import { useJobPlans, useChecklistTemplates } from "@/features/maintenance/api/use-maintenance-queries";
import {
    useCreateJobPlan,
    useUpdateJobPlan,
    useDeleteJobPlan,
} from "@/features/maintenance/api/use-maintenance-mutations";

/* ── Constants ── */

const ASSET_CLASS_OPTIONS = [
    { value: "", label: "All Asset Classes" },
    { value: "MACHINE", label: "Machine" },
    { value: "VEHICLE", label: "Vehicle" },
    { value: "BUILDING", label: "Building" },
    { value: "GARDEN", label: "Garden" },
    { value: "LAB_EQUIPMENT", label: "Lab Equipment" },
    { value: "TOOLING", label: "Tooling" },
    { value: "UTILITY", label: "Utility" },
    { value: "INFRASTRUCTURE", label: "Infrastructure" },
    { value: "PROJECT_SITE", label: "Project Site" },
    { value: "WAREHOUSE_EQUIPMENT", label: "Warehouse Equipment" },
];

const WO_TYPE_OPTIONS = [
    { value: "", label: "All WO Types" },
    { value: "PM", label: "PM" },
    { value: "CORRECTIVE", label: "Corrective" },
    { value: "BREAKDOWN", label: "Breakdown" },
    { value: "INSPECTION", label: "Inspection" },
    { value: "OVERHAUL", label: "Overhaul" },
    { value: "SHUTDOWN", label: "Shutdown" },
    { value: "VENDOR_SERVICE", label: "Vendor Service" },
    { value: "CALIBRATION", label: "Calibration" },
];

const PTW_CLASS_OPTIONS = [
    { value: "", label: "None" },
    { value: "HOT_WORK", label: "Hot Work" },
    { value: "CONFINED_SPACE", label: "Confined Space" },
    { value: "ELECTRICAL_ISOLATION", label: "Electrical Isolation" },
    { value: "PRESSURE_RELEASE", label: "Pressure Release" },
    { value: "GENERAL_WORK", label: "General Work" },
];

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

interface JobPlanForm {
    code: string;
    name: string;
    assetClass: string;
    woType: string;
    description: string;
    requiredSkills: string;
    estimatedHours: string;
    crewSize: string;
    permitRequired: boolean;
    ptwClass: string;
    qaReleaseRequired: boolean;
    photoRequired: boolean;
    signatureRequired: boolean;
    checklistTemplateId: string;
    isActive: boolean;
}

const EMPTY_FORM: JobPlanForm = {
    code: "", name: "", assetClass: "", woType: "", description: "", requiredSkills: "",
    estimatedHours: "", crewSize: "", permitRequired: false, ptwClass: "", qaReleaseRequired: false,
    photoRequired: false, signatureRequired: false, checklistTemplateId: "", isActive: true,
};

export function JobPlansScreen() {
    const canConfigure = useCanPerform("maintenance:configure");
    const [search, setSearch] = useState("");
    const [filterAssetClass, setFilterAssetClass] = useState("");
    const [filterWoType, setFilterWoType] = useState("");
    const { data, isLoading } = useJobPlans({ search: search || undefined, assetClass: filterAssetClass || undefined, woType: filterWoType || undefined });
    const { data: checklistData } = useChecklistTemplates();
    const createMut = useCreateJobPlan();
    const updateMut = useUpdateJobPlan();
    const deleteMut = useDeleteJobPlan();

    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<JobPlanForm>({ ...EMPTY_FORM });
    const [deleteTarget, setDeleteTarget] = useState<any>(null);

    const plans: any[] = data?.data ?? [];
    const checklists: any[] = checklistData?.data ?? [];

    const openCreate = () => { setEditingId(null); setForm({ ...EMPTY_FORM }); setModalOpen(true); };
    const openEdit = (p: any) => {
        setEditingId(p.id);
        setForm({
            code: p.code ?? "", name: p.name ?? "", assetClass: p.assetClass ?? "", woType: p.woType ?? "",
            description: p.description ?? "", requiredSkills: (p.requiredSkills ?? []).join(", "),
            estimatedHours: p.estimatedHours != null ? String(Number(p.estimatedHours)) : "",
            crewSize: p.crewSize != null ? String(p.crewSize) : "",
            permitRequired: p.permitRequired ?? false, ptwClass: p.ptwClass ?? "",
            qaReleaseRequired: p.qaReleaseRequired ?? false, photoRequired: p.photoRequired ?? false,
            signatureRequired: p.signatureRequired ?? false, checklistTemplateId: p.checklistTemplateId ?? "",
            isActive: p.isActive ?? true,
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        if (!form.code.trim() || !form.name.trim()) { showApiError({ message: "Code and Name are required" }); return; }
        try {
            const skills = form.requiredSkills.split(",").map((s) => s.trim()).filter(Boolean);
            const payload: any = {
                code: form.code.trim(),
                name: form.name.trim(),
                assetClass: form.assetClass || undefined,
                woType: form.woType || undefined,
                description: form.description || undefined,
                requiredSkills: skills.length > 0 ? skills : undefined,
                estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : undefined,
                crewSize: form.crewSize ? Number(form.crewSize) : undefined,
                permitRequired: form.permitRequired,
                ptwClass: form.ptwClass || undefined,
                qaReleaseRequired: form.qaReleaseRequired,
                photoRequired: form.photoRequired,
                signatureRequired: form.signatureRequired,
                checklistTemplateId: form.checklistTemplateId || undefined,
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
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Job Plans</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Define standard job plans for work orders</p>
                </div>
                {canConfigure && (
                    <button onClick={openCreate} className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all">
                        <Plus className="w-5 h-5" /> Add Job Plan
                    </button>
                )}
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input type="text" placeholder="Search job plans..." value={search} onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                </div>
                <select value={filterAssetClass} onChange={(e) => setFilterAssetClass(e.target.value)}
                    className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                    {ASSET_CLASS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <select value={filterWoType} onChange={(e) => setFilterWoType(e.target.value)}
                    className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                    {WO_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? <SkeletonTable rows={5} cols={8} /> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Code</th>
                                    <th className="py-4 px-6 font-bold">Name</th>
                                    <th className="py-4 px-6 font-bold">Asset Class</th>
                                    <th className="py-4 px-6 font-bold">WO Type</th>
                                    <th className="py-4 px-6 font-bold text-center">Est. Hours</th>
                                    <th className="py-4 px-6 font-bold text-center">Flags</th>
                                    <th className="py-4 px-6 font-bold">Status</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {plans.map((p: any) => (
                                    <tr key={p.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="py-4 px-6 font-mono text-xs font-bold text-primary-600 dark:text-primary-400">{p.code}</td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                                                    <ClipboardList className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                                </div>
                                                <span className="font-bold text-primary-950 dark:text-white">{p.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-xs text-neutral-600 dark:text-neutral-300">{p.assetClass ? p.assetClass.replace(/_/g, " ") : "---"}</td>
                                        <td className="py-4 px-6 text-xs text-neutral-600 dark:text-neutral-300">{p.woType ?? "---"}</td>
                                        <td className="py-4 px-6 text-center font-mono text-xs">{p.estimatedHours != null ? Number(p.estimatedHours) : "---"}</td>
                                        <td className="py-4 px-6 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                {p.permitRequired && <Shield size={14} className="text-warning-500" title="Permit Required" />}
                                                {p.photoRequired && <Camera size={14} className="text-primary-500" title="Photo Required" />}
                                                {p.signatureRequired && <PenTool size={14} className="text-accent-500" title="Signature Required" />}
                                                {p.checklistTemplateId && <ClipboardList size={14} className="text-success-500" title="Has Checklist" />}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6"><StatusBadge active={p.isActive ?? true} /></td>
                                        <td className="py-4 px-6 text-right">
                                            {canConfigure && (
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => openEdit(p)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit"><Edit3 size={15} /></button>
                                                    <button onClick={() => setDeleteTarget(p)} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" title="Delete"><Trash2 size={15} /></button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {plans.length === 0 && !isLoading && (
                                    <tr><td colSpan={8}><EmptyState icon="list" title="No job plans" message="Add your first job plan to standardize maintenance tasks." action={canConfigure ? { label: "Add Job Plan", onClick: openCreate } : undefined} /></td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{editingId ? "Edit Job Plan" : "Add Job Plan"}</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            {/* Core */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Code<span className="text-danger-500 ml-0.5">*</span></label>
                                    <input type="text" value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} placeholder="e.g. JP-001"
                                        className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Name<span className="text-danger-500 ml-0.5">*</span></label>
                                    <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Quarterly Pump Service"
                                        className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Asset Class</label>
                                    <select value={form.assetClass} onChange={(e) => setForm((p) => ({ ...p, assetClass: e.target.value }))}
                                        className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                        {ASSET_CLASS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">WO Type</label>
                                    <select value={form.woType} onChange={(e) => setForm((p) => ({ ...p, woType: e.target.value }))}
                                        className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                        {WO_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Description</label>
                                <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Describe the job plan" rows={2}
                                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Required Skills (comma-separated)</label>
                                <input type="text" value={form.requiredSkills} onChange={(e) => setForm((p) => ({ ...p, requiredSkills: e.target.value }))} placeholder="e.g. Electrical, Welding, Mechanical"
                                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Estimated Hours</label>
                                    <input type="number" step="0.5" min="0" value={form.estimatedHours} onChange={(e) => setForm((p) => ({ ...p, estimatedHours: e.target.value }))} placeholder="e.g. 4"
                                        className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Crew Size</label>
                                    <input type="number" min="1" value={form.crewSize} onChange={(e) => setForm((p) => ({ ...p, crewSize: e.target.value }))} placeholder="e.g. 2"
                                        className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                                </div>
                            </div>

                            {/* Safety & Compliance */}
                            <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4">
                                <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">Safety & Compliance</p>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <button type="button" onClick={() => setForm((p) => ({ ...p, permitRequired: !p.permitRequired }))}
                                            className={cn("w-10 h-6 rounded-full transition-colors relative flex-shrink-0", form.permitRequired ? "bg-primary-600" : "bg-neutral-300 dark:bg-neutral-700")}>
                                            <div className={cn("w-4 h-4 rounded-full bg-white absolute top-1 transition-all", form.permitRequired ? "left-5" : "left-1")} />
                                        </button>
                                        <span className="text-sm font-medium text-primary-950 dark:text-white">Permit Required</span>
                                    </div>
                                    {form.permitRequired && (
                                        <div className="ml-13">
                                            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">PTW Class</label>
                                            <select value={form.ptwClass} onChange={(e) => setForm((p) => ({ ...p, ptwClass: e.target.value }))}
                                                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                                {PTW_CLASS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                            </select>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3">
                                        <button type="button" onClick={() => setForm((p) => ({ ...p, qaReleaseRequired: !p.qaReleaseRequired }))}
                                            className={cn("w-10 h-6 rounded-full transition-colors relative flex-shrink-0", form.qaReleaseRequired ? "bg-primary-600" : "bg-neutral-300 dark:bg-neutral-700")}>
                                            <div className={cn("w-4 h-4 rounded-full bg-white absolute top-1 transition-all", form.qaReleaseRequired ? "left-5" : "left-1")} />
                                        </button>
                                        <span className="text-sm font-medium text-primary-950 dark:text-white">QA Release Required</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button type="button" onClick={() => setForm((p) => ({ ...p, photoRequired: !p.photoRequired }))}
                                            className={cn("w-10 h-6 rounded-full transition-colors relative flex-shrink-0", form.photoRequired ? "bg-primary-600" : "bg-neutral-300 dark:bg-neutral-700")}>
                                            <div className={cn("w-4 h-4 rounded-full bg-white absolute top-1 transition-all", form.photoRequired ? "left-5" : "left-1")} />
                                        </button>
                                        <span className="text-sm font-medium text-primary-950 dark:text-white">Photo Required</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button type="button" onClick={() => setForm((p) => ({ ...p, signatureRequired: !p.signatureRequired }))}
                                            className={cn("w-10 h-6 rounded-full transition-colors relative flex-shrink-0", form.signatureRequired ? "bg-primary-600" : "bg-neutral-300 dark:bg-neutral-700")}>
                                            <div className={cn("w-4 h-4 rounded-full bg-white absolute top-1 transition-all", form.signatureRequired ? "left-5" : "left-1")} />
                                        </button>
                                        <span className="text-sm font-medium text-primary-950 dark:text-white">Signature Required</span>
                                    </div>
                                </div>
                            </div>

                            {/* Checklist Template */}
                            <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4">
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Checklist Template</label>
                                <select value={form.checklistTemplateId} onChange={(e) => setForm((p) => ({ ...p, checklistTemplateId: e.target.value }))}
                                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                    <option value="">None</option>
                                    {checklists.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>

                            {editingId && (
                                <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4">
                                    <div className="flex items-center gap-3">
                                        <button type="button" onClick={() => setForm((p) => ({ ...p, isActive: !p.isActive }))}
                                            className={cn("w-10 h-6 rounded-full transition-colors relative flex-shrink-0", form.isActive ? "bg-primary-600" : "bg-neutral-300 dark:bg-neutral-700")}>
                                            <div className={cn("w-4 h-4 rounded-full bg-white absolute top-1 transition-all", form.isActive ? "left-5" : "left-1")} />
                                        </button>
                                        <span className="text-sm font-medium text-primary-950 dark:text-white">Active</span>
                                    </div>
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
                        <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">Delete Job Plan?</h2>
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
