import { useState } from "react";
import {
    Shield,
    Plus,
    Edit3,
    Trash2,
    Loader2,
    X,
    Search,
    CheckSquare,
    Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRbacRoles } from "@/features/company-admin/api/use-company-admin-queries";
import { useCreateRole, useUpdateRole, useDeleteRole } from "@/features/company-admin/api/use-company-admin-mutations";
import type { RbacRole, RolePermission } from "@/lib/api/company-admin";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

// ── Module list for permission matrix ──

const MODULES = [
    "Dashboard",
    "HR Management",
    "Attendance",
    "Payroll",
    "Production",
    "Quality",
    "Inventory",
    "Maintenance",
    "Reports",
    "Settings",
];

const ACTIONS = ["view", "create", "edit", "delete", "approve"] as const;

const ROLE_TEMPLATES: Record<string, Partial<Record<string, boolean>>> = {
    admin: Object.fromEntries(MODULES.flatMap((m) => ACTIONS.map((a) => [`${m}.${a}`, true]))),
    manager: Object.fromEntries(MODULES.flatMap((m) => ACTIONS.filter((a) => a !== "delete").map((a) => [`${m}.${a}`, true]))),
    operator: Object.fromEntries(MODULES.flatMap((m) => ["view", "create"].map((a) => [`${m}.${a}`, true]))),
    viewer: Object.fromEntries(MODULES.map((m) => [`${m}.view`, true])),
};

function buildPermissions(matrix: Record<string, boolean>): RolePermission[] {
    return MODULES.map((mod) => ({
        module: mod,
        view: matrix[`${mod}.view`] ?? false,
        create: matrix[`${mod}.create`] ?? false,
        edit: matrix[`${mod}.edit`] ?? false,
        delete: matrix[`${mod}.delete`] ?? false,
        approve: matrix[`${mod}.approve`] ?? false,
    }));
}

function flattenPermissions(permissions: RolePermission[]): Record<string, boolean> {
    const result: Record<string, boolean> = {};
    permissions.forEach((p) => {
        ACTIONS.forEach((a) => {
            result[`${p.module}.${a}`] = p[a] ?? false;
        });
    });
    return result;
}

export function RoleManagementScreen() {
    const { data: rolesData, isLoading: loading, isError: error } = useRbacRoles();
    const createMutation = useCreateRole();
    const updateMutation = useUpdateRole();
    const deleteMutation = useDeleteRole();

    const roles: RbacRole[] = rolesData?.data ?? [];

    const [search, setSearch] = useState("");

    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formName, setFormName] = useState("");
    const [formDescription, setFormDescription] = useState("");
    const [matrix, setMatrix] = useState<Record<string, boolean>>({});
    const [deleteTarget, setDeleteTarget] = useState<RbacRole | null>(null);

    const saving = createMutation.isPending || updateMutation.isPending;
    const deleting = deleteMutation.isPending;

    const filtered = roles.filter((r) => {
        if (!search) return true;
        return r.name.toLowerCase().includes(search.toLowerCase());
    });

    const openCreate = () => {
        setEditingId(null);
        setFormName("");
        setFormDescription("");
        setMatrix({});
        setModalOpen(true);
    };

    const openEdit = (role: RbacRole) => {
        if (role.isSystem) return;
        setEditingId(role.id);
        setFormName(role.name);
        setFormDescription(role.description ?? "");
        setMatrix(flattenPermissions(role.permissions ?? []));
        setModalOpen(true);
    };

    const applyTemplate = (templateKey: string) => {
        setMatrix({ ...ROLE_TEMPLATES[templateKey] } as Record<string, boolean>);
    };

    const togglePermission = (key: string) => {
        setMatrix((p) => ({ ...p, [key]: !p[key] }));
    };

    const handleSave = async () => {
        const permissions = buildPermissions(matrix);
        const payload = { name: formName, description: formDescription, permissions };
        try {
            if (editingId) {
                await updateMutation.mutateAsync({ id: editingId, data: payload });
                showSuccess("Role Updated", `${formName} has been updated.`);
            } else {
                await createMutation.mutateAsync(payload);
                showSuccess("Role Created", `${formName} has been created.`);
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
            showSuccess("Role Deleted", `${deleteTarget.name} has been removed.`);
            setDeleteTarget(null);
        } catch (err) {
            showApiError(err);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Roles</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Manage roles and permission assignments</p>
                </div>
                <button onClick={openCreate} className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none">
                    <Plus className="w-5 h-5" />
                    Create Role
                </button>
            </div>

            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input type="text" placeholder="Search roles..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                </div>
            </div>

            {error && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">Failed to load roles.</div>
            )}

            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {loading ? (
                    <SkeletonTable rows={5} cols={4} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Role</th>
                                    <th className="py-4 px-6 font-bold">Description</th>
                                    <th className="py-4 px-6 font-bold text-center">Type</th>
                                    <th className="py-4 px-6 font-bold text-center">Users</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.map((role) => (
                                    <tr key={role.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", role.isSystem ? "bg-warning-50 dark:bg-warning-900/20" : "bg-accent-50 dark:bg-accent-900/20")}>
                                                    {role.isSystem ? <Lock size={14} className="text-warning-600 dark:text-warning-400" /> : <Shield size={14} className="text-accent-600 dark:text-accent-400" />}
                                                </div>
                                                <span className="font-bold text-primary-950 dark:text-white">{role.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">{role.description || "\u2014"}</td>
                                        <td className="py-4 px-6 text-center">
                                            {role.isSystem ? (
                                                <span className="text-[10px] font-bold bg-warning-50 text-warning-700 border border-warning-200 px-2 py-0.5 rounded-full dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50">System</span>
                                            ) : (
                                                <span className="text-[10px] font-bold bg-accent-50 text-accent-700 border border-accent-200 px-2 py-0.5 rounded-full dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50">Custom</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-center font-semibold text-primary-950 dark:text-white">{role.userCount ?? 0}</td>
                                        <td className="py-4 px-6 text-right">
                                            {!role.isSystem && (
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => openEdit(role)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"><Edit3 size={15} /></button>
                                                    <button onClick={() => setDeleteTarget(role)} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors"><Trash2 size={15} /></button>
                                                </div>
                                            )}
                                            {role.isSystem && (
                                                <span className="text-xs text-neutral-400 dark:text-neutral-500 italic">Non-editable</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && !loading && (
                                    <tr><td colSpan={5}><EmptyState icon="list" title="No roles found" message="Create a custom role." action={{ label: "Create Role", onClick: openCreate }} /></td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Create/Edit Modal with Permission Matrix ── */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-3xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{editingId ? "Edit Role" : "Create Role"}</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Role Name</label>
                                    <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Floor Supervisor" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Description</label>
                                    <input type="text" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Brief description" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                </div>
                            </div>

                            {/* Role Templates */}
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">Apply Template</label>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {Object.keys(ROLE_TEMPLATES).map((key) => (
                                        <button
                                            key={key}
                                            onClick={() => applyTemplate(key)}
                                            className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200 dark:hover:bg-primary-900/20 dark:hover:text-primary-400 transition-colors"
                                        >
                                            {key.charAt(0).toUpperCase() + key.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Permission Matrix */}
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">Permission Matrix</label>
                                <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-neutral-50 dark:bg-neutral-800/50">
                                                    <th className="py-3 px-4 text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Module</th>
                                                    {ACTIONS.map((a) => (
                                                        <th key={a} className="py-3 px-3 text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider text-center">{a}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {MODULES.map((mod, i) => (
                                                    <tr key={mod} className={cn(i < MODULES.length - 1 && "border-b border-neutral-100 dark:border-neutral-800")}>
                                                        <td className="py-2.5 px-4 text-xs font-semibold text-primary-950 dark:text-white">{mod}</td>
                                                        {ACTIONS.map((action) => {
                                                            const key = `${mod}.${action}`;
                                                            const checked = matrix[key] ?? false;
                                                            return (
                                                                <td key={action} className="py-2.5 px-3 text-center">
                                                                    <button
                                                                        onClick={() => togglePermission(key)}
                                                                        className={cn(
                                                                            "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors",
                                                                            checked
                                                                                ? "bg-primary-600 border-primary-600 text-white"
                                                                                : "border-neutral-300 dark:border-neutral-600 hover:border-primary-400"
                                                                        )}
                                                                    >
                                                                        {checked && <CheckSquare size={12} />}
                                                                    </button>
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleSave} disabled={saving || !formName.trim()} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {saving && <Loader2 size={14} className="animate-spin" />}
                                {saving ? "Saving..." : editingId ? "Update Role" : "Create Role"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Confirmation ── */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">Delete Role?</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">This will permanently delete <strong>{deleteTarget.name}</strong> and remove all permission assignments.</p>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleDelete} disabled={deleting} className="flex-1 py-3 rounded-xl bg-danger-600 hover:bg-danger-700 text-white text-sm font-bold transition-colors disabled:opacity-50">
                                {deleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
