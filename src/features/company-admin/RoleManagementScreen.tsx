import { useState, useMemo, useCallback } from "react";
import {
    Shield,
    Plus,
    Edit3,
    Trash2,
    Loader2,
    X,
    Search,
    Lock,
    ChevronDown,
    ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRbacRoles, usePermissionCatalogue, useReferenceRoles } from "@/features/company-admin/api/use-company-admin-queries";
import { useCreateRole, useUpdateRole, useDeleteRole } from "@/features/company-admin/api/use-company-admin-mutations";
import type { RbacRole, PermissionModuleEntry } from "@/lib/api/company-admin";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

function buildPermissions(
    matrix: Record<string, boolean>,
    modules: Array<{ module: string; actions: string[]; subModules?: Array<{ key: string; actions: string[] }> }>,
): string[] {
    const result: string[] = [];
    modules.forEach((mod) => {
        // Parent-level permissions (e.g. "hr:read")
        mod.actions.forEach((action) => {
            const key = `${mod.module}:${action}`;
            if (matrix[key]) {
                result.push(key);
            }
        });
        // Sub-module permissions (e.g. "visitors.dashboard:read")
        if (mod.subModules) {
            mod.subModules.forEach((sub) => {
                sub.actions.forEach((action) => {
                    const subKey = `${sub.key}:${action}`;
                    // Only add sub-module permission if parent-level is NOT already set
                    if (matrix[subKey] && !matrix[`${mod.module}:${action}`]) {
                        result.push(subKey);
                    }
                });
            });
        }
    });
    return result;
}

/** Check if a sub-module action is effectively enabled (via direct, parent, or wildcard) */
function isSubModuleActionEnabled(
    matrix: Record<string, boolean>,
    parentModule: string,
    subKey: string,
    action: string,
): boolean {
    if (matrix[`${subKey}:${action}`]) return true;
    if (matrix[`${parentModule}:${action}`]) return true;
    if (matrix[`${parentModule}:*`]) return true;
    return false;
}

function flattenPermissions(permissions: string[] | unknown[]): Record<string, boolean> {
    const result: Record<string, boolean> = {};
    if (!permissions || permissions.length === 0) return result;
    // Handle string[] format from backend (e.g. "hr:read", "user:create")
    if (typeof permissions[0] === 'string') {
        (permissions as string[]).forEach((p) => {
            result[p] = true;
        });
    }
    return result;
}

export function RoleManagementScreen() {
    const { data: rolesData, isLoading: loading, isError: error } = useRbacRoles();
    const { data: catalogueData, isLoading: catalogueLoading } = usePermissionCatalogue();
    const { data: referenceData } = useReferenceRoles();
    const createMutation = useCreateRole();
    const updateMutation = useUpdateRole();
    const deleteMutation = useDeleteRole();

    const roles: RbacRole[] = rolesData?.data ?? [];

    // Permission catalogue from API — only show implemented modules
    const IMPLEMENTED_MODULES = useMemo(() => new Set([
        'hr', 'visitors', 'ess', 'attendance', 'user', 'role', 'company',
        'analytics', 'reports', 'audit', 'billing', 'docdiff', 'production', 'masters',
    ]), []);

    const catalogueModules = useMemo(() => {
        const modules = catalogueData?.data?.modules ?? [];
        return modules.filter((m) => IMPLEMENTED_MODULES.has(m.module));
    }, [catalogueData, IMPLEMENTED_MODULES]);

    // Reference roles as templates — backend returns Record<name, {description, permissions}>
    const roleTemplates = useMemo(() => {
        const refs = referenceData?.data;
        if (!refs || typeof refs !== 'object') return {};
        const templates: Record<string, Record<string, boolean>> = {};
        // Handle both array format [{name, permissions}] and object format {name: {permissions}}
        if (Array.isArray(refs)) {
            refs.forEach((ref: any) => {
                templates[ref.name] = {};
                (ref.permissions ?? []).forEach((p: string) => { templates[ref.name][p] = true; });
            });
        } else {
            Object.entries(refs).forEach(([name, value]: [string, any]) => {
                templates[name] = {};
                (value.permissions ?? []).forEach((p: string) => { templates[name][p] = true; });
            });
        }
        return templates;
    }, [referenceData]);

    const [search, setSearch] = useState("");

    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formName, setFormName] = useState("");
    const [formDescription, setFormDescription] = useState("");
    const [matrix, setMatrix] = useState<Record<string, boolean>>({});
    const [deleteTarget, setDeleteTarget] = useState<RbacRole | null>(null);
    const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

    const saving = createMutation.isPending || updateMutation.isPending;
    const deleting = deleteMutation.isPending;

    const filtered = roles.filter((r) => {
        if (!search) return true;
        return r.name.toLowerCase().includes(search.toLowerCase());
    });

    const toggleModuleExpanded = useCallback((moduleKey: string) => {
        setExpandedModules((prev) => ({ ...prev, [moduleKey]: !prev[moduleKey] }));
    }, []);

    const openCreate = () => {
        setEditingId(null);
        setFormName("");
        setFormDescription("");
        setMatrix({});
        setExpandedModules({});
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
        setMatrix({ ...roleTemplates[templateKey] } as Record<string, boolean>);
    };

    const togglePermission = (key: string) => {
        setMatrix((p) => ({ ...p, [key]: !p[key] }));
    };

    /** Toggle a parent-level action checkbox for a module with sub-modules */
    const toggleModuleAction = useCallback((mod: PermissionModuleEntry, action: string) => {
        const parentKey = `${mod.module}:${action}`;
        setMatrix((prev) => {
            const next = { ...prev };
            const wasOn = prev[parentKey];
            if (wasOn) {
                // Turn off parent
                next[parentKey] = false;
            } else {
                // Turn on parent — also clear individual sub-module keys for this action
                next[parentKey] = true;
                if (mod.subModules) {
                    mod.subModules.forEach((sub) => {
                        delete next[`${sub.key}:${action}`];
                    });
                }
            }
            return next;
        });
    }, []);

    /** Toggle a sub-module action checkbox */
    const toggleSubModuleAction = useCallback((mod: PermissionModuleEntry, subKey: string, action: string) => {
        setMatrix((prev) => {
            const next = { ...prev };
            const parentKey = `${mod.module}:${action}`;

            // If parent is currently on, we need to "expand" it: turn off parent, turn on all other subs
            if (prev[parentKey]) {
                next[parentKey] = false;
                if (mod.subModules) {
                    mod.subModules.forEach((sub) => {
                        if (sub.actions.includes(action)) {
                            // Turn on all except the one being toggled off
                            if (sub.key !== subKey) {
                                next[`${sub.key}:${action}`] = true;
                            }
                        }
                    });
                }
                return next;
            }

            // Toggle the individual sub-module
            const subPermKey = `${subKey}:${action}`;
            const newVal = !prev[subPermKey];
            next[subPermKey] = newVal;

            // Auto-collapse: if ALL sub-modules for this action are now checked, replace with parent
            if (newVal && mod.subModules) {
                const allSubsChecked = mod.subModules
                    .filter((s) => s.actions.includes(action))
                    .every((s) => s.key === subKey || next[`${s.key}:${action}`]);
                if (allSubsChecked) {
                    next[parentKey] = true;
                    mod.subModules.forEach((s) => {
                        delete next[`${s.key}:${action}`];
                    });
                }
            }

            return next;
        });
    }, []);

    /** Toggle all actions for a module (the "Select All" checkbox) */
    const toggleModuleAll = useCallback((mod: PermissionModuleEntry) => {
        const moduleKeys = mod.actions.map((a) => `${mod.module}:${a}`);
        setMatrix((prev) => {
            const allSelected = moduleKeys.every((k) => prev[k]);
            const next = { ...prev };
            moduleKeys.forEach((k) => { next[k] = !allSelected; });
            // If deselecting all, also clear sub-module keys
            if (allSelected && mod.subModules) {
                mod.subModules.forEach((sub) => {
                    sub.actions.forEach((a) => {
                        delete next[`${sub.key}:${a}`];
                    });
                });
            }
            // If selecting all, clear sub-module keys (parent covers them)
            if (!allSelected && mod.subModules) {
                mod.subModules.forEach((sub) => {
                    sub.actions.forEach((a) => {
                        delete next[`${sub.key}:${a}`];
                    });
                });
            }
            return next;
        });
    }, []);

    /** Get the selection state for a module's "Select All" checkbox */
    const getModuleSelectionState = useCallback((mod: PermissionModuleEntry, currentMatrix: Record<string, boolean>): 'none' | 'some' | 'all' => {
        const moduleKeys = mod.actions.map((a) => `${mod.module}:${a}`);
        const selectedCount = moduleKeys.filter((k) => currentMatrix[k]).length;
        if (selectedCount === 0) {
            // Check if any sub-module permissions are set
            if (mod.subModules) {
                const hasAnySub = mod.subModules.some((sub) =>
                    sub.actions.some((a) => currentMatrix[`${sub.key}:${a}`])
                );
                if (hasAnySub) return 'some';
            }
            return 'none';
        }
        if (selectedCount === moduleKeys.length) return 'all';
        return 'some';
    }, []);

    /** Get the state for a module-level action column checkbox (for modules with sub-modules) */
    const getModuleActionState = useCallback((mod: PermissionModuleEntry, action: string, currentMatrix: Record<string, boolean>): 'none' | 'some' | 'all' => {
        const parentKey = `${mod.module}:${action}`;
        if (currentMatrix[parentKey]) return 'all';
        if (!mod.subModules) return 'none';

        const subsWithAction = mod.subModules.filter((s) => s.actions.includes(action));
        if (subsWithAction.length === 0) return 'none';

        const checkedCount = subsWithAction.filter((s) => currentMatrix[`${s.key}:${action}`]).length;
        if (checkedCount === 0) return 'none';
        if (checkedCount === subsWithAction.length) return 'all';
        return 'some';
    }, []);

    const handleSave = async () => {
        const permissions = buildPermissions(matrix, catalogueModules);
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
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">{role.description || "—"}</td>
                                        <td className="py-4 px-6 text-center">
                                            {role.isSystem ? (
                                                <span className="text-[10px] font-bold bg-warning-50 text-warning-700 border border-warning-200 px-2 py-0.5 rounded-full dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50">System</span>
                                            ) : (
                                                <span className="text-[10px] font-bold bg-accent-50 text-accent-700 border border-accent-200 px-2 py-0.5 rounded-full dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50">Custom</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-center font-semibold text-primary-950 dark:text-white">{role.userCount ?? (role as any)._count?.users ?? 0}</td>
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

                            {/* Role Templates from reference roles */}
                            {Object.keys(roleTemplates).length > 0 && (
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">Apply Template</label>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {Object.keys(roleTemplates).map((key) => (
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
                            )}

                            {/* Permission Matrix */}
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">Permission Matrix</label>
                                {catalogueLoading ? (
                                    <div className="flex items-center gap-2 text-sm text-neutral-400 py-6 justify-center">
                                        <Loader2 size={14} className="animate-spin" /> Loading permissions...
                                    </div>
                                ) : catalogueModules.length === 0 ? (
                                    <div className="text-sm text-neutral-400 py-6 text-center">No permission modules available.</div>
                                ) : (
                                    <div className="space-y-3">
                                        {catalogueModules.map((mod) => {
                                            const hasSubModules = mod.subModules && mod.subModules.length > 0;
                                            const isExpanded = expandedModules[mod.module] ?? false;
                                            const selectionState = getModuleSelectionState(mod, matrix);

                                            // Count selected permissions for badge
                                            const selectedCount = (() => {
                                                let count = 0;
                                                mod.actions.forEach((a) => { if (matrix[`${mod.module}:${a}`]) count++; });
                                                if (mod.subModules) {
                                                    mod.subModules.forEach((sub) => {
                                                        sub.actions.forEach((a) => {
                                                            if (matrix[`${sub.key}:${a}`]) count++;
                                                        });
                                                    });
                                                }
                                                return count;
                                            })();

                                            // Group sub-modules by their group field
                                            const groupedSubs = (() => {
                                                if (!mod.subModules) return {};
                                                const groups: Record<string, typeof mod.subModules> = {};
                                                mod.subModules.forEach((sub) => {
                                                    const g = sub.group || 'General';
                                                    if (!groups[g]) groups[g] = [];
                                                    groups[g]!.push(sub);
                                                });
                                                return groups;
                                            })();

                                            return (
                                                <div
                                                    key={mod.module}
                                                    className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200/60 dark:border-neutral-800 overflow-hidden"
                                                >
                                                    {/* Module header */}
                                                    <div className="flex items-center justify-between px-4 py-3">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            {hasSubModules ? (
                                                                <button
                                                                    onClick={() => toggleModuleExpanded(mod.module)}
                                                                    className="flex items-center gap-2 text-sm font-semibold text-primary-950 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                                                >
                                                                    {isExpanded
                                                                        ? <ChevronDown size={16} className="text-neutral-400 shrink-0" />
                                                                        : <ChevronRight size={16} className="text-neutral-400 shrink-0" />
                                                                    }
                                                                    {mod.label}
                                                                </button>
                                                            ) : (
                                                                <span className="text-sm font-semibold text-primary-950 dark:text-white">{mod.label}</span>
                                                            )}
                                                            {selectedCount > 0 && (
                                                                <span className="text-[10px] font-bold bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 px-1.5 py-0.5 rounded-full">
                                                                    {selectedCount}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {/* Select All toggle */}
                                                        <button
                                                            onClick={() => toggleModuleAll(mod)}
                                                            className={cn(
                                                                "text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors",
                                                                selectionState === 'all'
                                                                    ? "bg-primary-600 border-primary-600 text-white"
                                                                    : selectionState === 'some'
                                                                        ? "bg-primary-100 border-primary-300 text-primary-700 dark:bg-primary-900/40 dark:border-primary-700 dark:text-primary-300"
                                                                        : "border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400"
                                                            )}
                                                        >
                                                            {selectionState === 'all' ? 'Deselect All' : 'Select All'}
                                                        </button>
                                                    </div>

                                                    {/* Simple module (no sub-modules): show action chips inline */}
                                                    {!hasSubModules && (
                                                        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                                                            {mod.actions.map((action) => {
                                                                const key = `${mod.module}:${action}`;
                                                                const checked = matrix[key] ?? false;
                                                                return (
                                                                    <button
                                                                        key={action}
                                                                        onClick={() => togglePermission(key)}
                                                                        className={cn(
                                                                            "px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors capitalize",
                                                                            checked
                                                                                ? "bg-primary-600 border-primary-600 text-white"
                                                                                : "bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400"
                                                                        )}
                                                                    >
                                                                        {action.replace(/-/g, ' ')}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                    {/* Module with sub-modules: expandable content */}
                                                    {hasSubModules && isExpanded && (
                                                        <div className="border-t border-neutral-100 dark:border-neutral-800">
                                                            {/* Module-level action chips (parent-level permissions) */}
                                                            {mod.actions.length > 0 && (
                                                                <div className="px-4 pt-3 pb-2">
                                                                    <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Module-Level Actions</span>
                                                                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                                        {mod.actions.map((action) => {
                                                                            const actionState = getModuleActionState(mod, action, matrix);
                                                                            return (
                                                                                <button
                                                                                    key={action}
                                                                                    onClick={() => toggleModuleAction(mod, action)}
                                                                                    className={cn(
                                                                                        "px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors capitalize",
                                                                                        actionState === 'all'
                                                                                            ? "bg-primary-600 border-primary-600 text-white"
                                                                                            : actionState === 'some'
                                                                                                ? "bg-primary-100 border-primary-300 text-primary-700 dark:bg-primary-900/40 dark:border-primary-700 dark:text-primary-300"
                                                                                                : "bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400"
                                                                                    )}
                                                                                >
                                                                                    {action.replace(/-/g, ' ')}
                                                                                </button>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Grouped sub-modules */}
                                                            {Object.entries(groupedSubs).map(([groupName, subs]) => (
                                                                <div key={groupName} className="px-4 pb-2 pt-1">
                                                                    <div className="py-1.5">
                                                                        <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">{groupName}</span>
                                                                    </div>
                                                                    <div className="bg-neutral-50/80 dark:bg-neutral-800/30 rounded-lg border border-neutral-100 dark:border-neutral-800/50">
                                                                        {subs!.map((sub, subIdx) => {
                                                                            const isLastSub = subIdx === subs!.length - 1;
                                                                            return (
                                                                                <div
                                                                                    key={sub.key}
                                                                                    className={cn(
                                                                                        "flex items-center justify-between gap-3 px-3 py-2",
                                                                                        !isLastSub && "border-b border-neutral-100/50 dark:border-neutral-800/30"
                                                                                    )}
                                                                                >
                                                                                    <span className="text-[11px] text-neutral-600 dark:text-neutral-400 shrink-0">{sub.label}</span>
                                                                                    <div className="flex flex-wrap gap-1 justify-end">
                                                                                        {sub.actions.map((action) => {
                                                                                            const checked = isSubModuleActionEnabled(matrix, mod.module, sub.key, action);
                                                                                            const isFromParent = matrix[`${mod.module}:${action}`] || matrix[`${mod.module}:*`];
                                                                                            return (
                                                                                                <button
                                                                                                    key={action}
                                                                                                    onClick={() => toggleSubModuleAction(mod, sub.key, action)}
                                                                                                    disabled={!!isFromParent}
                                                                                                    className={cn(
                                                                                                        "px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors capitalize",
                                                                                                        checked
                                                                                                            ? isFromParent
                                                                                                                ? "bg-primary-100 dark:bg-primary-900/30 border-dashed border-primary-300 dark:border-primary-700 text-primary-600 dark:text-primary-400 opacity-75 cursor-not-allowed"
                                                                                                                : "bg-primary-600 border-primary-600 text-white"
                                                                                                            : "bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400"
                                                                                                    )}
                                                                                                    title={isFromParent ? `Inherited from ${mod.label} module-level permission` : `Toggle ${action} for ${sub.label}`}
                                                                                                >
                                                                                                    {isFromParent && <Lock size={8} className="inline mr-0.5 -mt-px" />}
                                                                                                    {action.replace(/-/g, ' ')}
                                                                                                </button>
                                                                                            );
                                                                                        })}
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
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
