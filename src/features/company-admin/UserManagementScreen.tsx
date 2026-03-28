import { useState, useEffect, useCallback } from "react";
import {
    Users,
    Plus,
    Edit3,
    Loader2,
    X,
    Search,
    Filter,
    UserCheck,
    UserX,
    Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompanyUsers, useRbacRoles, useCompanyLocations } from "@/features/company-admin/api/use-company-admin-queries";
import { useDepartments } from "@/features/company-admin/api/use-hr-queries";
import { useCreateUser, useUpdateUser, useUpdateUserStatus, useAssignRole } from "@/features/company-admin/api/use-company-admin-mutations";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import type { CompanyUser, PaginationMeta } from "@/lib/api/company-admin";
import { showSuccess, showError, showApiError } from "@/lib/toast";

function FormField({ label, value, onChange, placeholder, type = "text" }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
    const fieldId = label.toLowerCase().replace(/\s+/g, '-');
    return (
        <div>
            <label htmlFor={fieldId} className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">{label}</label>
            <input
                id={fieldId}
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
            />
        </div>
    );
}

function UserModal({ editingId, form, updateField, onClose, onSave, saving, dynamicRoles, departments, locations }: {
    editingId: string | null;
    form: typeof EMPTY_USER;
    updateField: (key: string, value: string) => void;
    onClose: () => void;
    onSave: () => void;
    saving: boolean;
    dynamicRoles: Array<{ id: string; name: string }>;
    departments: Array<{ id: string; name: string }>;
    locations: Array<{ id: string; name: string }>;
}) {
    const handleEscKey = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
    }, [onClose]);

    useEffect(() => {
        document.addEventListener('keydown', handleEscKey);
        return () => document.removeEventListener('keydown', handleEscKey);
    }, [handleEscKey]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-labelledby="user-modal-title">
            <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                    <h2 id="user-modal-title" className="text-lg font-bold text-primary-950 dark:text-white">{editingId ? "Edit User" : "Add User"}</h2>
                    <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400"><X size={18} /></button>
                </div>
                <div className="p-6 overflow-y-auto flex-1 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="First Name" value={form.firstName} onChange={(v) => updateField("firstName", v)} placeholder="First name" />
                        <FormField label="Last Name" value={form.lastName} onChange={(v) => updateField("lastName", v)} placeholder="Last name" />
                    </div>
                    <FormField label="Email" value={form.email} onChange={(v) => updateField("email", v)} type="email" placeholder="user@company.com" />
                    {!editingId && (
                        <FormField label="Password" value={form.password} onChange={(v) => updateField("password", v)} type="password" placeholder="Min 6 characters" />
                    )}
                    <div>
                        <label htmlFor="user-role" className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Role</label>
                        <select
                            id="user-role"
                            value={form.role}
                            onChange={(e) => updateField("role", e.target.value)}
                            className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                        >
                            <option value="">Select role...</option>
                            {dynamicRoles.length > 0 ? (
                                dynamicRoles.map((r) => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))
                            ) : (
                                <option value="" disabled>Loading roles...</option>
                            )}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="user-department" className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Department</label>
                            <select
                                id="user-department"
                                value={form.department}
                                onChange={(e) => updateField("department", e.target.value)}
                                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                            >
                                <option value="">Select department...</option>
                                {departments.map((d) => (
                                    <option key={d.id} value={d.name}>{d.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="user-location" className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Location</label>
                            <select
                                id="user-location"
                                value={form.location}
                                onChange={(e) => updateField("location", e.target.value)}
                                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                            >
                                <option value="">Select location...</option>
                                {locations.map((l) => (
                                    <option key={l.id} value={l.name}>{l.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                    <button onClick={onSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                        {saving && <Loader2 size={14} className="animate-spin" />}
                        {saving ? "Saving..." : editingId ? "Update" : "Create"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ active }: { active: boolean }) {
    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border",
            active
                ? "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50"
                : "bg-neutral-100 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700"
        )}>
            <span className={cn("w-1.5 h-1.5 rounded-full", active ? "bg-success-500" : "bg-neutral-400")} />
            {active ? "Active" : "Inactive"}
        </span>
    );
}

const STATUS_FILTERS = ["All", "Active", "Inactive"];

const EMPTY_USER = {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "operator",
    department: "",
    location: "",
};

export function UserManagementScreen() {
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");
    const [page, setPage] = useState(1);
    const limit = 25;

    const { data: rolesData } = useRbacRoles();
    const dynamicRoles: Array<{ id: string; name: string }> = (rolesData?.data ?? []).map((r) => ({ id: r.id, name: r.name }));
    const roleFilterOptions = ["All", ...dynamicRoles.map((r) => r.name)];

    const { data: departmentsData } = useDepartments();
    const departmentsList: Array<{ id: string; name: string }> = (departmentsData?.data ?? []).map((d: any) => ({ id: d.id, name: d.name }));
    const { data: locationsData } = useCompanyLocations();
    const locationsList: Array<{ id: string; name: string }> = (locationsData?.data ?? []).map((l: any) => ({ id: l.id, name: l.name }));

    const { data, isLoading, isError } = useCompanyUsers({
        search: search || undefined,
        role: roleFilter === "All" ? undefined : roleFilter,
        status: statusFilter === "All" ? undefined : statusFilter.toLowerCase(),
        page,
        limit,
    });

    const createMutation = useCreateUser();
    const updateMutation = useUpdateUser();
    const statusMutation = useUpdateUserStatus();
    const assignRoleMutation = useAssignRole();

    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...EMPTY_USER });

    const users: CompanyUser[] = data?.data ?? [];
    const meta = data?.meta as PaginationMeta | undefined;
    const total = meta?.total ?? users.length;

    const openCreate = () => {
        setEditingId(null);
        setForm({ ...EMPTY_USER });
        setModalOpen(true);
    };

    const openEdit = (user: CompanyUser) => {
        setEditingId(user.id);
        setForm({
            firstName: user.firstName ?? "",
            lastName: user.lastName ?? "",
            email: user.email ?? "",
            password: "",
            role: user.role ?? "operator",
            department: user.department ?? "",
            location: user.location ?? "",
        });
        setModalOpen(true);
    };

    const validateForm = (): string | null => {
        if (!form.firstName.trim()) return "First name is required.";
        if (!form.lastName.trim()) return "Last name is required.";
        if (!form.email.trim()) return "Email is required.";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(form.email.trim())) return "Please enter a valid email address.";
        if (!editingId && form.password.length < 6) return "Password must be at least 6 characters.";
        return null;
    };

    const handleSave = async () => {
        const validationError = validateForm();
        if (validationError) {
            showError("Validation Error", validationError);
            return;
        }
        try {
            if (editingId) {
                const { password: _pw, department: _dept, location: _loc, role: selectedRole, ...updateData } = form;
                await updateMutation.mutateAsync({ id: editingId, data: updateData });
                // Assign role via RBAC endpoint if a dynamic role is selected
                if (selectedRole && dynamicRoles.some((r) => r.id === selectedRole)) {
                    await assignRoleMutation.mutateAsync({ userId: editingId, roleId: selectedRole });
                }
                showSuccess("User Updated", `${form.firstName} ${form.lastName} has been updated.`);
            } else {
                const { department: _dept, location: _loc, ...createData } = form;
                await createMutation.mutateAsync(createData);
                showSuccess("User Created", `${form.firstName} ${form.lastName} has been added.`);
            }
            setModalOpen(false);
        } catch (err) {
            showApiError(err);
        }
    };

    const handleToggleStatus = async (user: CompanyUser) => {
        const newStatus = user.isActive !== false ? "inactive" : "active";
        try {
            await statusMutation.mutateAsync({ id: user.id, status: newStatus });
            showSuccess("Status Updated", `${user.firstName ?? user.email} is now ${newStatus}.`);
        } catch (err) {
            showApiError(err);
        }
    };

    const saving = createMutation.isPending || updateMutation.isPending;
    const updateField = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

    const formatDate = (d: string | null | undefined) => {
        if (!d) return "—";
        return new Date(d).toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Users</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Manage user accounts and access</p>
                </div>
                <button onClick={openCreate} className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none">
                    <Plus className="w-5 h-5" />
                    Add User
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Search users by name or email..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                    />
                </div>
                <div className="flex items-center gap-4 overflow-x-auto pb-1 lg:pb-0">
                    <div className="flex items-center gap-2">
                        <Filter size={14} className="text-neutral-400 flex-shrink-0" />
                        <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 whitespace-nowrap">Role:</span>
                        <select
                            value={roleFilter}
                            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                            className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-semibold text-neutral-700 dark:text-neutral-300 focus:outline-none"
                        >
                            {roleFilterOptions.map((f) => (
                                <option key={f} value={f}>{f === "All" ? "All Roles" : f}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 whitespace-nowrap">Status:</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                            className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-semibold text-neutral-700 dark:text-neutral-300 focus:outline-none"
                        >
                            {STATUS_FILTERS.map((f) => (
                                <option key={f} value={f}>{f}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
                    Failed to load users.
                </div>
            )}

            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? (
                    <SkeletonTable rows={8} cols={6} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Name</th>
                                    <th className="py-4 px-6 font-bold">Email</th>
                                    <th className="py-4 px-6 font-bold">Role</th>
                                    <th className="py-4 px-6 font-bold">Status</th>
                                    <th className="py-4 px-6 font-bold">Last Login</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {users.map((user) => {
                                    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.fullName || user.email;
                                    const isActive = user.isActive !== false;
                                    return (
                                        <tr key={user.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-lg bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center shrink-0 text-sm font-bold text-accent-700 dark:text-accent-400">
                                                        {fullName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-primary-950 dark:text-white block">{fullName}</span>
                                                        {user.department && <span className="text-[10px] text-neutral-400 dark:text-neutral-500">{user.department}</span>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <a href={`mailto:${user.email}`} className="text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 text-xs">
                                                    <Mail size={11} />{user.email}
                                                </a>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="text-[10px] font-bold bg-primary-50 text-primary-700 px-2 py-0.5 rounded dark:bg-primary-900/30 dark:text-primary-400">
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6"><StatusBadge active={isActive} /></td>
                                            <td className="py-4 px-6 text-neutral-500 dark:text-neutral-400 text-xs">
                                                {formatDate(user.lastLoginAt ?? user.lastLogin)}
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => openEdit(user)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit" aria-label={`Edit ${fullName}`}>
                                                        <Edit3 size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleStatus(user)}
                                                        disabled={statusMutation.isPending}
                                                        className={cn(
                                                            "p-2 rounded-lg transition-colors",
                                                            isActive
                                                                ? "text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20"
                                                                : "text-success-500 hover:bg-success-50 dark:hover:bg-success-900/20"
                                                        )}
                                                        title={isActive ? "Deactivate" : "Activate"}
                                                        aria-label={isActive ? `Deactivate ${fullName}` : `Activate ${fullName}`}
                                                    >
                                                        {isActive ? <UserX size={15} /> : <UserCheck size={15} />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {users.length === 0 && !isLoading && (
                                    <tr><td colSpan={6}><EmptyState icon="search" title="No users found" message="Try adjusting your search or filters." /></td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400 bg-neutral-50/50 dark:bg-neutral-900/50">
                    <span className="font-medium">
                        Showing {users.length > 0 ? (page - 1) * limit + 1 : 0} to {Math.min(page * limit, total)} of {total} entries
                    </span>
                    <div className="flex gap-2">
                        <button onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50" disabled={page <= 1}>Previous</button>
                        <button onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50" disabled={!meta || page >= (meta.totalPages ?? 1)}>Next</button>
                    </div>
                </div>
            </div>

            {/* ── Create/Edit Modal ── */}
            {modalOpen && (
                <UserModal
                    editingId={editingId}
                    form={form}
                    updateField={updateField}
                    onClose={() => setModalOpen(false)}
                    onSave={handleSave}
                    saving={saving}
                    dynamicRoles={dynamicRoles}
                    departments={departmentsList}
                    locations={locationsList}
                />
            )}
        </div>
    );
}
