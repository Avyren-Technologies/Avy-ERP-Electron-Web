import { useState } from "react";
import {
    Mail,
    Plus,
    Pencil,
    Trash2,
    X,
    Loader2,
    Search,
    Bell,
    Smartphone,
    MessageSquare,
    CheckCircle2,
    XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotificationTemplates } from "@/features/company-admin/api/use-ess-queries";
import {
    useCreateNotificationTemplate,
    useUpdateNotificationTemplate,
    useDeleteNotificationTemplate,
} from "@/features/company-admin/api/use-ess-mutations";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Constants ── */

const CHANNELS = [
    { value: "EMAIL", label: "Email", icon: Mail },
    { value: "PUSH", label: "Push", icon: Smartphone },
    { value: "SMS", label: "SMS", icon: MessageSquare },
    { value: "IN_APP", label: "In-App", icon: Bell },
    { value: "WHATSAPP", label: "WhatsApp", icon: MessageSquare },
];

const AVAILABLE_TOKENS = [
    { token: "{{employee_name}}", description: "Full name of employee" },
    { token: "{{employee_id}}", description: "Employee ID" },
    { token: "{{department}}", description: "Department name" },
    { token: "{{manager_name}}", description: "Reporting manager name" },
    { token: "{{company_name}}", description: "Company name" },
    { token: "{{request_type}}", description: "Request type" },
    { token: "{{request_date}}", description: "Request date" },
    { token: "{{status}}", description: "Current status" },
    { token: "{{approval_link}}", description: "Link to approve/reject" },
    { token: "{{from_date}}", description: "Start date" },
    { token: "{{to_date}}", description: "End date" },
    { token: "{{month_year}}", description: "Payslip month/year" },
    { token: "{{amount}}", description: "Amount (salary, loan, etc.)" },
];

const EMPTY_FORM = {
    name: "",
    channel: "EMAIL",
    subject: "",
    body: "",
    isActive: true,
};

/* ── Helpers ── */

function ChannelBadge({ channel }: { channel: string }) {
    const normalizedChannel = channel.toUpperCase();
    const ch = CHANNELS.find((c) => c.value === normalizedChannel);
    const Icon = ch?.icon ?? Mail;
    const colors: Record<string, string> = {
        EMAIL: "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50",
        PUSH: "bg-accent-50 text-accent-700 border-accent-200 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50",
        SMS: "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50",
        IN_APP: "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50",
        WHATSAPP: "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50",
    };
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize",
                colors[normalizedChannel] ?? colors.EMAIL
            )}
        >
            <Icon size={10} />
            {ch?.label ?? channel}
        </span>
    );
}

/* ── Screen ── */

export function NotificationTemplateScreen() {
    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [deleteTarget, setDeleteTarget] = useState<any>(null);

    const { data, isLoading, isError } = useNotificationTemplates();
    const createMutation = useCreateNotificationTemplate();
    const updateMutation = useUpdateNotificationTemplate();
    const deleteMutation = useDeleteNotificationTemplate();

    const templates: any[] = data?.data ?? [];

    const filtered = templates.filter((t: any) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return t.name?.toLowerCase().includes(s) || t.subject?.toLowerCase().includes(s) || t.channel?.toLowerCase().includes(s);
    });

    const openCreate = () => {
        setEditId(null);
        setForm({ ...EMPTY_FORM });
        setModalOpen(true);
    };

    const openEdit = (t: any) => {
        setEditId(t.id);
        setForm({
            name: t.name ?? "",
            channel: t.channel ?? "email",
            subject: t.subject ?? "",
            body: t.body ?? "",
            isActive: t.isActive ?? t.active ?? true,
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        try {
            if (editId) {
                await updateMutation.mutateAsync({ id: editId, data: form });
                showSuccess("Template Updated", `"${form.name}" has been updated.`);
            } else {
                await createMutation.mutateAsync(form);
                showSuccess("Template Created", `"${form.name}" has been created.`);
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
            showSuccess("Template Deleted", `"${deleteTarget.name}" has been removed.`);
            setDeleteTarget(null);
        } catch (err) {
            showApiError(err);
        }
    };

    const saving = createMutation.isPending || updateMutation.isPending;

    const insertToken = (token: string) => {
        setForm((p) => ({ ...p, body: p.body + token }));
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Notification Templates</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Create and manage notification templates for HR events</p>
                </div>
                <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
                >
                    <Plus className="w-5 h-5" />
                    Add Template
                </button>
            </div>

            {/* Search */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                    <input
                        type="text"
                        placeholder="Search templates..."
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
                    <div className="p-8 text-center text-danger-600 dark:text-danger-400 font-medium">Failed to load templates.</div>
                ) : filtered.length === 0 ? (
                    <EmptyState icon="list" title="No templates found" message="Create your first notification template." />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Name</th>
                                    <th className="py-4 px-6 font-bold">Channel</th>
                                    <th className="py-4 px-6 font-bold">Subject</th>
                                    <th className="py-4 px-6 font-bold text-center">Active</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.map((t: any) => (
                                    <tr key={t.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                                                    <Mail size={14} className="text-primary-600 dark:text-primary-400" />
                                                </div>
                                                <span className="font-bold text-primary-950 dark:text-white">{t.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6"><ChannelBadge channel={t.channel} /></td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-sm truncate max-w-[250px]">{t.subject || "—"}</td>
                                        <td className="py-4 px-6 text-center">
                                            {(t.isActive ?? t.active ?? true) ? (
                                                <CheckCircle2 size={16} className="text-success-500 inline-block" />
                                            ) : (
                                                <XCircle size={16} className="text-neutral-300 dark:text-neutral-600 inline-block" />
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => openEdit(t)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit">
                                                    <Pencil size={15} />
                                                </button>
                                                <button onClick={() => setDeleteTarget(t)} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" title="Delete">
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

            {/* ── Template Modal ── */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-3xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{editId ? "Edit Template" : "New Template"}</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Form */}
                                <div className="lg:col-span-2 space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Template Name</label>
                                        <input
                                            type="text"
                                            value={form.name}
                                            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                                            placeholder="e.g., Leave Approved Notification"
                                            className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Channel</label>
                                            <select
                                                value={form.channel}
                                                onChange={(e) => setForm((p) => ({ ...p, channel: e.target.value }))}
                                                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                                            >
                                                {CHANNELS.map((c) => (
                                                    <option key={c.value} value={c.value}>{c.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex items-end">
                                            <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={form.isActive}
                                                    onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                                                    className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                                                />
                                                Active
                                            </label>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Subject</label>
                                        <input
                                            type="text"
                                            value={form.subject}
                                            onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                                            placeholder="e.g., Your leave request has been {{status}}"
                                            className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Body</label>
                                        <textarea
                                            value={form.body}
                                            onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
                                            placeholder="Compose the notification body... Use tokens from the sidebar."
                                            rows={8}
                                            className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none font-mono"
                                        />
                                    </div>
                                </div>
                                {/* Token Sidebar */}
                                <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700">
                                    <h4 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">Available Tokens</h4>
                                    <div className="space-y-1.5 max-h-80 overflow-y-auto">
                                        {AVAILABLE_TOKENS.map((t) => (
                                            <button
                                                key={t.token}
                                                onClick={() => insertToken(t.token)}
                                                className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-white dark:hover:bg-neutral-700 transition-colors group"
                                            >
                                                <code className="text-[10px] font-mono font-bold text-primary-600 dark:text-primary-400 group-hover:text-primary-700">{t.token}</code>
                                                <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">{t.description}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {saving && <Loader2 size={14} className="animate-spin" />}
                                {editId ? "Update Template" : "Create Template"}
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
                            This will permanently delete <strong>"{deleteTarget.name}"</strong>.
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
