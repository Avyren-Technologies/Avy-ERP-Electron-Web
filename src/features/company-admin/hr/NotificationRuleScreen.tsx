import { useState } from "react";
import {
    BellRing,
    Plus,
    Pencil,
    Trash2,
    X,
    Loader2,
    Search,
    CheckCircle2,
    XCircle,
    Mail,
    Smartphone,
    MessageSquare,
    Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotificationRules, useNotificationTemplates } from "@/features/company-admin/api/use-ess-queries";
import {
    useCreateNotificationRule,
    useUpdateNotificationRule,
    useDeleteNotificationRule,
} from "@/features/company-admin/api/use-ess-mutations";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Constants ── */

const TRIGGER_EVENTS = [
    { value: "leave_applied", label: "Leave Applied" },
    { value: "leave_approved", label: "Leave Approved" },
    { value: "leave_rejected", label: "Leave Rejected" },
    { value: "attendance_regularized", label: "Attendance Regularized" },
    { value: "payslip_generated", label: "Payslip Generated" },
    { value: "salary_revision", label: "Salary Revision" },
    { value: "it_declaration_submitted", label: "IT Declaration Submitted" },
    { value: "approval_pending", label: "Approval Pending" },
    { value: "approval_escalated", label: "Approval Escalated" },
    { value: "profile_update_request", label: "Profile Update Request" },
    { value: "loan_approved", label: "Loan Approved" },
    { value: "new_employee_onboarded", label: "New Employee Onboarded" },
];

const RECIPIENT_ROLES = [
    { value: "employee", label: "Employee (Self)" },
    { value: "reporting_manager", label: "Reporting Manager" },
    { value: "department_head", label: "Department Head" },
    { value: "hr_manager", label: "HR Manager" },
    { value: "finance_manager", label: "Finance Manager" },
    { value: "all_admins", label: "All Admins" },
];

const CHANNELS = [
    { value: "email", label: "Email", icon: Mail },
    { value: "push", label: "Push", icon: Smartphone },
    { value: "sms", label: "SMS", icon: MessageSquare },
    { value: "in_app", label: "In-App", icon: Bell },
];

const EMPTY_FORM = {
    triggerEvent: "",
    templateId: "",
    recipientRole: "",
    channel: "email",
    active: true,
};

/* ── Helpers ── */

function ChannelBadge({ channel }: { channel: string }) {
    const ch = CHANNELS.find((c) => c.value === channel);
    const Icon = ch?.icon ?? Mail;
    const colors: Record<string, string> = {
        email: "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50",
        push: "bg-accent-50 text-accent-700 border-accent-200 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50",
        sms: "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50",
        in_app: "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50",
    };
    return (
        <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize", colors[channel] ?? colors.email)}>
            <Icon size={10} />
            {ch?.label ?? channel}
        </span>
    );
}

/* ── Screen ── */

export function NotificationRuleScreen() {
    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [deleteTarget, setDeleteTarget] = useState<any>(null);

    const { data, isLoading, isError } = useNotificationRules();
    const templatesQuery = useNotificationTemplates();
    const createMutation = useCreateNotificationRule();
    const updateMutation = useUpdateNotificationRule();
    const deleteMutation = useDeleteNotificationRule();

    const rules: any[] = data?.data ?? [];
    const templates: any[] = templatesQuery.data?.data ?? [];

    const filtered = rules.filter((r: any) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return r.triggerEvent?.toLowerCase().includes(s) || r.recipientRole?.toLowerCase().includes(s);
    });

    const templateName = (id: string) => templates.find((t: any) => t.id === id)?.name ?? id;
    const eventLabel = (value: string) => TRIGGER_EVENTS.find((e) => e.value === value)?.label ?? value?.replace(/_/g, " ");
    const roleLabel = (value: string) => RECIPIENT_ROLES.find((r) => r.value === value)?.label ?? value?.replace(/_/g, " ");

    const openCreate = () => {
        setEditId(null);
        setForm({ ...EMPTY_FORM });
        setModalOpen(true);
    };

    const openEdit = (r: any) => {
        setEditId(r.id);
        setForm({
            triggerEvent: r.triggerEvent ?? "",
            templateId: r.templateId ?? "",
            recipientRole: r.recipientRole ?? "",
            channel: r.channel ?? "email",
            active: r.active ?? true,
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        try {
            if (editId) {
                await updateMutation.mutateAsync({ id: editId, data: form });
                showSuccess("Rule Updated", "Notification rule has been updated.");
            } else {
                await createMutation.mutateAsync(form);
                showSuccess("Rule Created", "Notification rule has been created.");
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
            showSuccess("Rule Deleted", "Notification rule has been removed.");
            setDeleteTarget(null);
        } catch (err) {
            showApiError(err);
        }
    };

    const saving = createMutation.isPending || updateMutation.isPending;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Notification Rules</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Configure when and to whom notifications are sent</p>
                </div>
                <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
                >
                    <Plus className="w-5 h-5" />
                    Add Rule
                </button>
            </div>

            {/* Search */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                    <input
                        type="text"
                        placeholder="Search rules..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? (
                    <SkeletonTable rows={5} cols={6} />
                ) : isError ? (
                    <div className="p-8 text-center text-danger-600 dark:text-danger-400 font-medium">Failed to load notification rules.</div>
                ) : filtered.length === 0 ? (
                    <EmptyState icon="list" title="No rules found" message="Create your first notification rule." />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Trigger Event</th>
                                    <th className="py-4 px-6 font-bold">Template</th>
                                    <th className="py-4 px-6 font-bold">Recipient Role</th>
                                    <th className="py-4 px-6 font-bold">Channel</th>
                                    <th className="py-4 px-6 font-bold text-center">Active</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.map((r: any) => (
                                    <tr key={r.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-accent-50 dark:bg-accent-900/30 flex items-center justify-center shrink-0">
                                                    <BellRing size={14} className="text-accent-600 dark:text-accent-400" />
                                                </div>
                                                <span className="font-bold text-primary-950 dark:text-white capitalize">{eventLabel(r.triggerEvent)}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">{templateName(r.templateId)}</td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 capitalize">{roleLabel(r.recipientRole)}</td>
                                        <td className="py-4 px-6"><ChannelBadge channel={r.channel} /></td>
                                        <td className="py-4 px-6 text-center">
                                            {r.active ? (
                                                <CheckCircle2 size={16} className="text-success-500 inline-block" />
                                            ) : (
                                                <XCircle size={16} className="text-neutral-300 dark:text-neutral-600 inline-block" />
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => openEdit(r)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit">
                                                    <Pencil size={15} />
                                                </button>
                                                <button onClick={() => setDeleteTarget(r)} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" title="Delete">
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Rule Modal ── */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{editId ? "Edit Rule" : "New Rule"}</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Trigger Event</label>
                                <select value={form.triggerEvent} onChange={(e) => setForm((p) => ({ ...p, triggerEvent: e.target.value }))} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                    <option value="">Select event...</option>
                                    {TRIGGER_EVENTS.map((e) => (<option key={e.value} value={e.value}>{e.label}</option>))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Notification Template</label>
                                <select value={form.templateId} onChange={(e) => setForm((p) => ({ ...p, templateId: e.target.value }))} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                    <option value="">Select template...</option>
                                    {templates.map((t: any) => (<option key={t.id} value={t.id}>{t.name}</option>))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Recipient Role</label>
                                <select value={form.recipientRole} onChange={(e) => setForm((p) => ({ ...p, recipientRole: e.target.value }))} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                    <option value="">Select recipient...</option>
                                    {RECIPIENT_ROLES.map((r) => (<option key={r.value} value={r.value}>{r.label}</option>))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Channel</label>
                                <select value={form.channel} onChange={(e) => setForm((p) => ({ ...p, channel: e.target.value }))} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                    {CHANNELS.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
                                </select>
                            </div>
                            <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 cursor-pointer pt-1">
                                <input type="checkbox" checked={form.active} onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))} className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500" />
                                Active
                            </label>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {saving && <Loader2 size={14} className="animate-spin" />}
                                {editId ? "Update Rule" : "Create Rule"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Confirmation ── */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">Delete Rule?</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            This will permanently delete this notification rule. This action cannot be undone.
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
