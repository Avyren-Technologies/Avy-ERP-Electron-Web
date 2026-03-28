import { useState } from "react";
import {
    Phone,
    Plus,
    Edit3,
    Trash2,
    Loader2,
    X,
    Search,
    Mail,
    User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompanyContacts } from "@/features/company-admin/api/use-company-admin-queries";
import { useCreateContact, useUpdateContact, useDeleteContact } from "@/features/company-admin/api/use-company-admin-mutations";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

function FormField({ label, value, onChange, placeholder, type = "text" }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
    return (
        <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">{label}</label>
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

function TypeBadge({ type }: { type: string }) {
    const styles: Record<string, string> = {
        Primary: "bg-info-50 text-info-700 border-info-200 dark:bg-info-900/20 dark:text-info-400 dark:border-info-800/50",
        Secondary: "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700",
        Emergency: "bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50",
        Technical: "bg-accent-50 text-accent-700 border-accent-200 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50",
    };
    return (
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", styles[type] ?? styles.Secondary)}>
            {type}
        </span>
    );
}

const EMPTY_CONTACT = {
    name: "",
    designation: "",
    department: "",
    type: "Primary",
    email: "",
    countryCode: "+91",
    mobile: "",
    linkedin: "",
};

export function ContactManagementScreen() {
    const { data, isLoading, isError } = useCompanyContacts();
    const createMutation = useCreateContact();
    const updateMutation = useUpdateContact();
    const deleteMutation = useDeleteContact();

    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...EMPTY_CONTACT });
    const [deleteTarget, setDeleteTarget] = useState<any>(null);

    const contacts: any[] = data?.data ?? [];
    const filtered = contacts.filter((c: any) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
            c.name?.toLowerCase().includes(s) ||
            c.email?.toLowerCase().includes(s) ||
            c.department?.toLowerCase().includes(s)
        );
    });

    const openCreate = () => {
        setEditingId(null);
        setForm({ ...EMPTY_CONTACT });
        setModalOpen(true);
    };

    const openEdit = (contact: any) => {
        setEditingId(contact.id);
        setForm({
            name: contact.name ?? "",
            designation: contact.designation ?? "",
            department: contact.department ?? "",
            type: contact.type ?? "Primary",
            email: contact.email ?? "",
            countryCode: contact.countryCode ?? "+91",
            mobile: contact.mobile ?? "",
            linkedin: contact.linkedin ?? "",
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        try {
            if (editingId) {
                await updateMutation.mutateAsync({ id: editingId, data: form });
                showSuccess("Contact Updated", `${form.name} has been updated.`);
            } else {
                await createMutation.mutateAsync(form);
                showSuccess("Contact Created", `${form.name} has been added.`);
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
            showSuccess("Contact Deleted", `${deleteTarget.name} has been removed.`);
            setDeleteTarget(null);
        } catch (err) {
            showApiError(err);
        }
    };

    const saving = createMutation.isPending || updateMutation.isPending;
    const updateField = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Contacts</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Manage key company contacts</p>
                </div>
                <button onClick={openCreate} className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none">
                    <Plus className="w-5 h-5" />
                    Add Contact
                </button>
            </div>

            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Search contacts..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                    />
                </div>
            </div>

            {isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
                    Failed to load contacts.
                </div>
            )}

            {/* Data Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? (
                    <SkeletonTable rows={5} cols={6} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[850px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Name</th>
                                    <th className="py-4 px-6 font-bold">Designation</th>
                                    <th className="py-4 px-6 font-bold">Department</th>
                                    <th className="py-4 px-6 font-bold">Type</th>
                                    <th className="py-4 px-6 font-bold">Email</th>
                                    <th className="py-4 px-6 font-bold">Phone</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.map((c: any) => (
                                    <tr key={c.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0 text-sm font-bold text-primary-700 dark:text-primary-400">
                                                    {c.name?.charAt(0) ?? "?"}
                                                </div>
                                                <span className="font-bold text-primary-950 dark:text-white">{c.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">{c.designation || "—"}</td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">{c.department || "—"}</td>
                                        <td className="py-4 px-6"><TypeBadge type={c.type ?? "Primary"} /></td>
                                        <td className="py-4 px-6">
                                            <a href={`mailto:${c.email}`} className="text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 text-xs">
                                                <Mail size={11} />{c.email}
                                            </a>
                                        </td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">
                                            {c.countryCode} {c.mobile}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => openEdit(c)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"><Edit3 size={15} /></button>
                                                <button onClick={() => setDeleteTarget(c)} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors"><Trash2 size={15} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && !isLoading && (
                                    <tr><td colSpan={7}><EmptyState icon="list" title="No contacts" message="Add your first contact." action={{ label: "Add Contact", onClick: openCreate }} /></td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Create/Edit Modal ── */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{editingId ? "Edit Contact" : "Add Contact"}</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <FormField label="Full Name" value={form.name} onChange={(v) => updateField("name", v)} placeholder="Contact name" />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="Designation" value={form.designation} onChange={(v) => updateField("designation", v)} placeholder="e.g. CTO" />
                                <FormField label="Department" value={form.department} onChange={(v) => updateField("department", v)} placeholder="e.g. Engineering" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Contact Type</label>
                                <select
                                    value={form.type}
                                    onChange={(e) => updateField("type", e.target.value)}
                                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                                >
                                    <option value="Primary">Primary</option>
                                    <option value="Secondary">Secondary</option>
                                    <option value="Technical">Technical</option>
                                    <option value="Emergency">Emergency</option>
                                </select>
                            </div>
                            <FormField label="Email" value={form.email} onChange={(v) => updateField("email", v)} type="email" placeholder="email@example.com" />
                            <div className="grid grid-cols-3 gap-4">
                                <FormField label="Country Code" value={form.countryCode} onChange={(v) => updateField("countryCode", v)} placeholder="+91" />
                                <div className="col-span-2">
                                    <FormField label="Mobile" value={form.mobile} onChange={(v) => updateField("mobile", v)} placeholder="9876543210" type="tel" />
                                </div>
                            </div>
                            <FormField label="LinkedIn (optional)" value={form.linkedin} onChange={(v) => updateField("linkedin", v)} placeholder="linkedin.com/in/..." />
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
                        <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">Delete Contact?</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            This will permanently delete <strong>{deleteTarget.name}</strong>.
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
