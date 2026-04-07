import { useState } from "react";
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import {
    Gavel,
    Plus,
    Edit3,
    Loader2,
    X,
    Search,
    Eye,
    Filter,
    Clock,
    CheckCircle2,
    AlertTriangle,
    ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDisciplinaryActions } from "@/features/company-admin/api/use-recruitment-queries";
import { useEmployees } from "@/features/company-admin/api/use-hr-queries";
import {
    useCreateDisciplinaryAction,
    useUpdateDisciplinaryAction,
} from "@/features/company-admin/api/use-recruitment-mutations";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";
import { useCanPerform } from "@/hooks/useCanPerform";

/* ── Constants ── */

const ACTION_TYPES = [
    "Verbal Warning",
    "Written Warning",
    "Final Warning",
    "Suspension",
    "Demotion",
    "Pay Cut",
    "Probation",
    "Termination",
];

const STATUSES = ["All", "Draft", "Issued", "Acknowledged", "Appealed", "Resolved", "Closed"];
const SEVERITY_OPTIONS = ["Minor", "Moderate", "Major", "Severe"];

const EMPTY_ACTION = {
    employeeId: "",
    type: "Written Warning",
    severity: "Moderate",
    subject: "",
    description: "",
    incidentDate: "",
    issuedDate: "",
    status: "Draft",
    witnesses: "",
    previousWarnings: 0,
    actionTaken: "",
    improvementPlan: "",
    reviewDate: "",
    issuedById: "",
};

// formatDate moved inside component

/* ── Badges ── */

function ActionStatusBadge({ status }: { status: string }) {
    const s = status?.toLowerCase();
    const map: Record<string, { icon: typeof Clock; cls: string }> = {
        draft: { icon: Clock, cls: "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700" },
        issued: { icon: ShieldAlert, cls: "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50" },
        acknowledged: { icon: CheckCircle2, cls: "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50" },
        appealed: { icon: AlertTriangle, cls: "bg-accent-50 text-accent-700 border-accent-200 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50" },
        resolved: { icon: CheckCircle2, cls: "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50" },
        closed: { icon: CheckCircle2, cls: "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700" },
    };
    const c = map[s] ?? map.draft;
    const Icon = c.icon;
    return (
        <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize", c.cls)}>
            <Icon size={10} />{status}
        </span>
    );
}

function SeverityBadge({ severity }: { severity: string }) {
    const s = severity?.toLowerCase();
    const map: Record<string, string> = {
        minor: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
        moderate: "bg-warning-50 text-warning-700 dark:bg-warning-900/20 dark:text-warning-400",
        major: "bg-danger-50 text-danger-600 dark:bg-danger-900/20 dark:text-danger-400",
        severe: "bg-danger-100 text-danger-800 dark:bg-danger-900/30 dark:text-danger-300",
    };
    return <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full capitalize", map[s] ?? map.moderate)}>{severity}</span>;
}

function TypeBadge({ type }: { type: string }) {
    const isTermination = type?.toLowerCase().includes("termination");
    const isSuspension = type?.toLowerCase().includes("suspension");
    const cls = isTermination
        ? "bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50"
        : isSuspension
        ? "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50"
        : "bg-accent-50 text-accent-700 border-accent-200 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50";
    return <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", cls)}>{type}</span>;
}

/* ── Screen ── */

export function DisciplinaryScreen() {
    const fmt = useCompanyFormatter();
    const formatDate = (d: string | null | undefined) => d ? fmt.date(d) : "—";
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...EMPTY_ACTION });
    const [detailTarget, setDetailTarget] = useState<any>(null);

    const isHrAdmin = useCanPerform('hr:read');

    const actionsQuery = useDisciplinaryActions(statusFilter !== "All" ? { status: statusFilter.toLowerCase() } : undefined);
    const employeesQuery = useEmployees();

    const createAction = useCreateDisciplinaryAction();
    const updateAction = useUpdateDisciplinaryAction();

    const actions: any[] = actionsQuery.data?.data ?? [];
    const employees: any[] = employeesQuery.data?.data ?? [];

    const employeeName = (id: string, empObj?: any) => {
        if (empObj) {
            const name = [empObj.firstName, empObj.lastName].filter(Boolean).join(" ");
            if (name) return name;
        }
        const emp = employees.find((e: any) => e.id === id);
        if (!emp) return id;
        return [emp.firstName, emp.lastName].filter(Boolean).join(" ") || emp.fullName || emp.email || id;
    };

    const formatEnumValue = (val: string) => {
        if (!val) return "—";
        return val.replace(/_/g, " ").replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
    };

    const filtered = actions.filter((a: any) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return employeeName(a.employeeId, a.employee)?.toLowerCase().includes(s) || a.charges?.toLowerCase().includes(s) || a.type?.toLowerCase().includes(s);
    });

    const openCreate = () => { setEditingId(null); setForm({ ...EMPTY_ACTION }); setModalOpen(true); };
    const openEdit = (a: any) => {
        setEditingId(a.id);
        setForm({
            employeeId: a.employeeId ?? "", type: a.type ?? "Written Warning", severity: a.severity ?? "Moderate",
            subject: a.subject ?? "", description: a.description ?? "", incidentDate: a.incidentDate ?? "",
            issuedDate: a.issuedDate ?? "", status: a.status ?? "Draft", witnesses: a.witnesses ?? "",
            previousWarnings: a.previousWarnings ?? 0, actionTaken: a.actionTaken ?? "",
            improvementPlan: a.improvementPlan ?? "", reviewDate: a.reviewDate ?? "", issuedById: a.issuedById ?? "",
        });
        setModalOpen(true);
    };
    const typeToEnum: Record<string, string> = {
        "Verbal Warning": "VERBAL_WARNING",
        "Written Warning": "WRITTEN_WARNING",
        "Final Warning": "SHOW_CAUSE",
        "Suspension": "SUSPENSION",
        "Demotion": "PIP",
        "Pay Cut": "PIP",
        "Probation": "PIP",
        "Termination": "TERMINATION",
    };

    const handleSave = async () => {
        try {
            const payload: any = {
                employeeId: form.employeeId,
                type: typeToEnum[form.type] || "WRITTEN_WARNING",
                charges: [form.subject, form.description].filter(Boolean).join(" - ") || form.subject || form.description,
                replyDueBy: form.reviewDate || undefined,
                issuedBy: form.issuedById || undefined,
            };
            if (editingId) { await updateAction.mutateAsync({ id: editingId, data: payload }); showSuccess("Action Updated", "Disciplinary action has been updated."); }
            else { await createAction.mutateAsync(payload); showSuccess("Action Created", "Disciplinary action has been recorded."); }
            setModalOpen(false);
        } catch (err) { showApiError(err); }
    };

    const saving = createAction.isPending || updateAction.isPending;
    const updateField = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

    /* Type-specific fields display */
    const showSuspensionFields = form.type === "Suspension";
    const showTerminationFields = form.type === "Termination";
    const showImprovementPlan = ["Written Warning", "Final Warning", "Probation"].includes(form.type);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">{isHrAdmin ? "Disciplinary Actions" : "My Disciplinary Actions"}</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">{isHrAdmin ? "Record and manage employee disciplinary proceedings" : "View disciplinary actions related to you"}</p>
                </div>
                {isHrAdmin && (
                    <button onClick={openCreate} className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none">
                        <Plus className="w-5 h-5" /> New Action
                    </button>
                )}
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                    <input type="text" placeholder="Search by employee, subject, or type..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                </div>
                <div className="flex items-center gap-2">
                    <Filter size={14} className="text-neutral-400" />
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-semibold text-neutral-700 dark:text-neutral-300 focus:outline-none">
                        {STATUSES.map((f: string) => <option key={f} value={f}>{f}</option>)}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {actionsQuery.isLoading ? <SkeletonTable rows={6} cols={8} /> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1100px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Employee</th>
                                    <th className="py-4 px-6 font-bold">Subject</th>
                                    <th className="py-4 px-6 font-bold">Type</th>
                                    <th className="py-4 px-6 font-bold text-center">Severity</th>
                                    <th className="py-4 px-6 font-bold">Incident Date</th>
                                    <th className="py-4 px-6 font-bold">Issued</th>
                                    <th className="py-4 px-6 font-bold text-center">Status</th>
                                    {isHrAdmin && <th className="py-4 px-6 font-bold text-right">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.map((a: any) => (
                                    <tr key={a.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-danger-50 dark:bg-danger-900/20 flex items-center justify-center shrink-0">
                                                    <Gavel className="w-4 h-4 text-danger-600 dark:text-danger-400" />
                                                </div>
                                                <span className="font-bold text-primary-950 dark:text-white">{employeeName(a.employeeId, a.employee)}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 truncate max-w-[200px]">{a.charges || a.subject || "—"}</td>
                                        <td className="py-4 px-6"><TypeBadge type={formatEnumValue(a.type) ?? "Written Warning"} /></td>
                                        <td className="py-4 px-6 text-center"><SeverityBadge severity={a.severity ?? "Moderate"} /></td>
                                        <td className="py-4 px-6 text-xs text-neutral-600 dark:text-neutral-400">{formatDate(a.createdAt || a.incidentDate)}</td>
                                        <td className="py-4 px-6 text-xs text-neutral-600 dark:text-neutral-400">{formatDate(a.createdAt || a.issuedDate)}</td>
                                        <td className="py-4 px-6 text-center"><ActionStatusBadge status={a.status ?? "Draft"} /></td>
                                        {isHrAdmin && (
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => setDetailTarget(a)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="View"><Eye size={15} /></button>
                                                    <button onClick={() => openEdit(a)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit"><Edit3 size={15} /></button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {filtered.length === 0 && !actionsQuery.isLoading && (
                                    <tr><td colSpan={isHrAdmin ? 8 : 7}><EmptyState icon="list" title="No disciplinary actions found" message={isHrAdmin ? "Record a new disciplinary action." : "No disciplinary actions on record."} action={isHrAdmin ? { label: "New Action", onClick: openCreate } : undefined} /></td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Create/Edit Modal ── */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{editingId ? "Update Action" : "New Disciplinary Action"}</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Employee</label>
                                <select value={form.employeeId} onChange={(e) => updateField("employeeId", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                    <option value="">Select employee...</option>
                                    {employees.map((e: any) => <option key={e.id} value={e.id}>{[e.firstName, e.lastName].filter(Boolean).join(" ") || e.email}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Action Type</label>
                                    <select value={form.type} onChange={(e) => updateField("type", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                        {ACTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Severity</label>
                                    <select value={form.severity} onChange={(e) => updateField("severity", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                        {SEVERITY_OPTIONS.map((s: string) => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Subject</label>
                                <input type="text" value={form.subject} onChange={(e) => updateField("subject", e.target.value)} placeholder="Brief description of the incident" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Incident Date</label>
                                    <input type="date" value={form.incidentDate} onChange={(e) => updateField("incidentDate", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Issued Date</label>
                                    <input type="date" value={form.issuedDate} onChange={(e) => updateField("issuedDate", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Description</label>
                                <textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} rows={3} placeholder="Detailed account of the incident and findings..." className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Witnesses</label>
                                    <input type="text" value={form.witnesses} onChange={(e) => updateField("witnesses", e.target.value)} placeholder="Comma-separated names" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Previous Warnings</label>
                                    <input type="number" value={form.previousWarnings} onChange={(e) => updateField("previousWarnings", Number(e.target.value))} min={0} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Action Taken</label>
                                <textarea value={form.actionTaken} onChange={(e) => updateField("actionTaken", e.target.value)} rows={2} placeholder="Describe the action taken..." className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none" />
                            </div>
                            {showImprovementPlan && (
                                <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 border border-primary-200 dark:border-primary-800/50 space-y-3">
                                    <h4 className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase">Performance Improvement Plan</h4>
                                    <div>
                                        <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Improvement Plan</label>
                                        <textarea value={form.improvementPlan} onChange={(e) => updateField("improvementPlan", e.target.value)} rows={2} placeholder="Expected improvement actions..." className="w-full px-3 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Review Date</label>
                                        <input type="date" value={form.reviewDate} onChange={(e) => updateField("reviewDate", e.target.value)} className="w-full px-3 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                    </div>
                                </div>
                            )}
                            {(showSuspensionFields || showTerminationFields) && (
                                <div className="bg-danger-50 dark:bg-danger-900/20 rounded-xl p-4 border border-danger-200 dark:border-danger-800/50">
                                    <h4 className="text-xs font-bold text-danger-600 dark:text-danger-400 uppercase mb-2">
                                        {showTerminationFields ? "Termination Details" : "Suspension Details"}
                                    </h4>
                                    <p className="text-xs text-danger-600 dark:text-danger-400">
                                        {showTerminationFields
                                            ? "Ensure all legal requirements are met before proceeding with termination."
                                            : "Specify the suspension period and conditions in the action taken field above."}
                                    </p>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Issued By</label>
                                    <select value={form.issuedById} onChange={(e) => updateField("issuedById", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                        <option value="">Select issuer...</option>
                                        {employees.map((e: any) => <option key={e.id} value={e.id}>{[e.firstName, e.lastName].filter(Boolean).join(" ") || e.email}</option>)}
                                    </select>
                                </div>
                                {editingId && (
                                    <div>
                                        <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Status</label>
                                        <select value={form.status} onChange={(e) => updateField("status", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                            {STATUSES.filter((s: string) => s !== "All").map((s: string) => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {saving && <Loader2 size={14} className="animate-spin" />}{saving ? "Saving..." : editingId ? "Update" : "Record"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Detail Modal ── */}
            {detailTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">Action Details</h2>
                            <button onClick={() => setDetailTarget(null)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <ActionStatusBadge status={detailTarget.status ?? "Draft"} />
                                <div className="flex gap-2">
                                    <TypeBadge type={formatEnumValue(detailTarget.type) ?? "Written Warning"} />
                                    <SeverityBadge severity={detailTarget.severity ?? "Moderate"} />
                                </div>
                            </div>
                            <div><span className="text-xs text-neutral-400 block mb-0.5">Employee</span><p className="font-bold text-primary-950 dark:text-white text-lg">{employeeName(detailTarget.employeeId, detailTarget.employee)}</p></div>
                            <div><span className="text-xs text-neutral-400 block mb-0.5">Subject</span><p className="font-bold text-primary-950 dark:text-white">{detailTarget.charges || detailTarget.subject || "—"}</p></div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><span className="text-xs text-neutral-400 block mb-0.5">Incident Date</span><p className="font-semibold text-primary-950 dark:text-white">{formatDate(detailTarget.createdAt || detailTarget.incidentDate)}</p></div>
                                <div><span className="text-xs text-neutral-400 block mb-0.5">Issued By</span><p className="font-semibold text-primary-950 dark:text-white">{detailTarget.issuedById ? employeeName(detailTarget.issuedById) : "System"}</p></div>
                                <div><span className="text-xs text-neutral-400 block mb-0.5">Reply Due</span><p className="font-semibold text-primary-950 dark:text-white">{formatDate(detailTarget.replyDueBy || detailTarget.reviewDate)}</p></div>
                                <div><span className="text-xs text-neutral-400 block mb-0.5">PIP Outcome</span><p className="font-semibold text-primary-950 dark:text-white">{detailTarget.pipOutcome || "—"}</p></div>
                            </div>
                            {detailTarget.description && (
                                <div><span className="text-xs text-neutral-400 block mb-0.5">Description</span><p className="text-sm text-neutral-600 dark:text-neutral-400">{detailTarget.description}</p></div>
                            )}
                            {detailTarget.witnesses && (
                                <div><span className="text-xs text-neutral-400 block mb-0.5">Witnesses</span><p className="text-sm text-neutral-600 dark:text-neutral-400">{detailTarget.witnesses}</p></div>
                            )}
                            {detailTarget.actionTaken && (
                                <div className="bg-warning-50 dark:bg-warning-900/20 rounded-xl p-3 border border-warning-200 dark:border-warning-800/50">
                                    <span className="text-xs text-warning-600 dark:text-warning-400 block mb-0.5 font-semibold">Action Taken</span>
                                    <p className="text-sm text-warning-700 dark:text-warning-400">{detailTarget.actionTaken}</p>
                                </div>
                            )}
                            {detailTarget.replyReceived && (
                                <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-3 border border-primary-200 dark:border-primary-800/50">
                                    <span className="text-xs text-primary-600 dark:text-primary-400 block mb-0.5 font-semibold">Reply Received</span>
                                    <p className="text-sm text-primary-700 dark:text-primary-400">{detailTarget.replyReceived}</p>
                                </div>
                            )}
                            {detailTarget.improvementPlan && (
                                <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-3 border border-primary-200 dark:border-primary-800/50">
                                    <span className="text-xs text-primary-600 dark:text-primary-400 block mb-0.5 font-semibold">Improvement Plan</span>
                                    <p className="text-sm text-primary-700 dark:text-primary-400">{detailTarget.improvementPlan}</p>
                                    {detailTarget.reviewDate && <p className="text-xs text-primary-500 mt-1">Review by: {formatDate(detailTarget.reviewDate)}</p>}
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setDetailTarget(null)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
