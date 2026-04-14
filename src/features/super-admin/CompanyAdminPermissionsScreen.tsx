import { useState, useMemo } from 'react';
import {
  ShieldCheck,
  RefreshCw,
  Pencil,
  X,
  Info,
  AlertTriangle,
  CheckSquare,
  Square,
  Clock,
  Building2,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import {
  useCompanyAdminRoles,
  useUpdateCompanyAdminPermissions,
  useSyncAllCompanyAdminPermissions,
} from '@/features/super-admin/api/use-company-admin-roles-queries';
import type { CompanyAdminRole } from '@/lib/api/company-admin-roles';

// ── Permission module definitions ─────────────────────────────────────────

const SYSTEM_MODULES = ['company', 'user', 'role', 'reports', 'audit', 'billing', 'analytics'];
const BUSINESS_MODULES = [
  'hr', 'ess', 'attendance', 'production', 'inventory', 'sales',
  'finance', 'maintenance', 'vendor', 'security', 'visitors', 'masters',
];
const ALL_MODULES = [...SYSTEM_MODULES, ...BUSINESS_MODULES];

const CANONICAL_PERMISSIONS = ALL_MODULES.map((m) => `${m}:*`);

// ── Helpers ───────────────────────────────────────────────────────────────

function extractModule(permission: string): string {
  return permission.split(':')[0] ?? permission;
}

function getMissingModules(permissions: string[]): string[] {
  const grantedModules = new Set(permissions.map(extractModule));
  return ALL_MODULES.filter((m) => !grantedModules.has(m));
}

// ── Sub-components ────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const isActive = status.toUpperCase() === 'ACTIVE';
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
        isActive
          ? 'bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50'
          : 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700',
      )}
    >
      {isActive ? 'Active' : status}
    </span>
  );
}

function ModuleChip({ module, missing }: { module: string; missing?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border',
        missing
          ? 'bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50'
          : 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50',
      )}
    >
      {module}
    </span>
  );
}

function SkeletonCompanyCard() {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800" />
          <div>
            <div className="w-36 h-4 bg-neutral-100 dark:bg-neutral-800 rounded mb-2" />
            <div className="w-16 h-3 bg-neutral-100 dark:bg-neutral-800 rounded" />
          </div>
        </div>
        <div className="w-20 h-8 bg-neutral-100 dark:bg-neutral-800 rounded-xl" />
      </div>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="w-16 h-5 bg-neutral-100 dark:bg-neutral-800 rounded-md" />
        ))}
      </div>
      <div className="w-40 h-3 bg-neutral-100 dark:bg-neutral-800 rounded" />
    </div>
  );
}

// ── Edit Permissions Modal ─────────────────────────────────────────────────

interface EditModalProps {
  role: CompanyAdminRole;
  onClose: () => void;
}

function EditPermissionsModal({ role, onClose }: EditModalProps) {
  const updateMutation = useUpdateCompanyAdminPermissions();

  const initialSelected = useMemo(() => {
    const grantedModules = new Set(role.permissions.map(extractModule));
    return new Set(ALL_MODULES.filter((m) => grantedModules.has(m)));
  }, [role.permissions]);

  const [selected, setSelected] = useState<Set<string>>(initialSelected);

  function toggle(module: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(module)) {
        next.delete(module);
      } else {
        next.add(module);
      }
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(ALL_MODULES));
  }

  function deselectAll() {
    setSelected(new Set());
  }

  function handleSave() {
    const permissions = Array.from(selected).map((m) => `${m}:*`);
    updateMutation.mutate(
      { roleId: role.roleId, permissions },
      { onSuccess: () => onClose() },
    );
  }

  const isDirty = useMemo(() => {
    if (selected.size !== initialSelected.size) return true;
    for (const m of selected) {
      if (!initialSelected.has(m)) return true;
    }
    return false;
  }, [selected, initialSelected]);

  function renderCheckboxGroup(modules: string[], groupLabel: string) {
    return (
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">
          {groupLabel}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {modules.map((module) => {
            const checked = selected.has(module);
            return (
              <label
                key={module}
                className={cn(
                  'flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-colors',
                  checked
                    ? 'bg-primary-50 border-primary-200 dark:bg-primary-900/20 dark:border-primary-800/50'
                    : 'bg-neutral-50 border-neutral-200 dark:bg-neutral-800/50 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800',
                )}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  onChange={() => toggle(module)}
                />
                {checked ? (
                  <CheckSquare className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                )}
                <span
                  className={cn(
                    'text-sm font-medium capitalize',
                    checked
                      ? 'text-primary-700 dark:text-primary-300'
                      : 'text-neutral-700 dark:text-neutral-300',
                  )}
                >
                  {module}
                </span>
              </label>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-200/60 dark:border-neutral-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white leading-tight">
                Edit Permissions
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                {role.companyName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Select / Deselect All */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              <span className="font-semibold text-neutral-900 dark:text-white">{selected.size}</span>
              {' '}of {ALL_MODULES.length} modules selected
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline"
              >
                Select All
              </button>
              <span className="text-neutral-300 dark:text-neutral-700">|</span>
              <button
                type="button"
                onClick={deselectAll}
                className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 hover:underline"
              >
                Deselect All
              </button>
            </div>
          </div>

          {renderCheckboxGroup(SYSTEM_MODULES, 'System')}
          {renderCheckboxGroup(BUSINESS_MODULES, 'Business')}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200/60 dark:border-neutral-800 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty || updateMutation.isPending}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-colors',
              isDirty && !updateMutation.isPending
                ? 'bg-primary-600 hover:bg-primary-700 text-white'
                : 'bg-primary-300 dark:bg-primary-900/40 text-primary-100 dark:text-primary-700 cursor-not-allowed',
            )}
          >
            {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Permissions
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Company Role Card ──────────────────────────────────────────────────────

interface CompanyRoleCardProps {
  role: CompanyAdminRole;
  onEdit: (role: CompanyAdminRole) => void;
}

function CompanyRoleCard({ role, onEdit }: CompanyRoleCardProps) {
  const fmt = useCompanyFormatter();
  const grantedModules = useMemo(
    () => [...new Set(role.permissions.map(extractModule))].sort(),
    [role.permissions],
  );
  const missingModules = useMemo(() => getMissingModules(role.permissions), [role.permissions]);

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 p-6 flex flex-col gap-4">
      {/* Card header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white truncate">
              {role.companyName}
            </h3>
            <div className="mt-1">
              <StatusBadge status={role.companyStatus} />
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onEdit(role)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/40 border border-primary-200 dark:border-primary-800/50 rounded-xl transition-colors flex-shrink-0"
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit
        </button>
      </div>

      {/* Granted modules */}
      <div>
        <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-2">
          Granted Modules ({grantedModules.length})
        </p>
        {grantedModules.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {grantedModules.map((mod) => (
              <ModuleChip key={mod} module={mod} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-neutral-400 dark:text-neutral-600 italic">No permissions granted</p>
        )}
      </div>

      {/* Missing modules */}
      {missingModules.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-warning-600 dark:text-warning-400 mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3" />
            Missing Modules ({missingModules.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {missingModules.map((mod) => (
              <ModuleChip key={mod} module={mod} missing />
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-1.5 pt-1 border-t border-neutral-100 dark:border-neutral-800">
        <Clock className="w-3 h-3 text-neutral-400" />
        <span className="text-xs text-neutral-400 dark:text-neutral-500">
          Updated {(() => { try { return fmt.dateTime(role.updatedAt); } catch { return role.updatedAt; } })()}
        </span>
      </div>
    </div>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────

export function CompanyAdminPermissionsScreen() {
  const { data, isLoading, isError } = useCompanyAdminRoles();
  const syncMutation = useSyncAllCompanyAdminPermissions();

  const [editingRole, setEditingRole] = useState<CompanyAdminRole | null>(null);

  const roles: CompanyAdminRole[] = data?.data ?? [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">
              Company Admin Permissions
            </h1>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2 ml-0.5">
            Manage what modules each company's admin role can access. Sync ensures all companies receive the latest canonical permission set.
          </p>
        </div>
        <button
          type="button"
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl transition-colors flex-shrink-0',
            syncMutation.isPending
              ? 'bg-primary-300 dark:bg-primary-900/40 text-primary-100 dark:text-primary-700 cursor-not-allowed'
              : 'bg-primary-600 hover:bg-primary-700 text-white',
          )}
        >
          {syncMutation.isPending
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <RefreshCw className="w-4 h-4" />
          }
          Sync All Permissions
        </button>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-info-50 dark:bg-info-900/20 border border-info-200 dark:border-info-800/50 rounded-xl">
        <Info className="w-4 h-4 text-info-600 dark:text-info-400 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-info-700 dark:text-info-300">
          <p className="font-semibold mb-0.5">About this screen</p>
          <p>
            Each company has a <span className="font-semibold">Company Admin</span> role that controls which
            modules the admin can configure. The canonical set includes{' '}
            <span className="font-semibold">{CANONICAL_PERMISSIONS.length} module permissions</span>.
            Use <span className="font-semibold">Sync All</span> to bring all companies to the latest defaults,
            or edit individual companies to customise access.
          </p>
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <div className="flex items-center gap-3 p-4 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-danger-600 dark:text-danger-400 flex-shrink-0" />
          <p className="text-sm text-danger-700 dark:text-danger-300 font-medium">
            Failed to load company admin roles. Please try refreshing.
          </p>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCompanyCard key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && roles.length === 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 py-16 flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            <Building2 className="w-8 h-8 text-neutral-400" />
          </div>
          <div className="text-center">
            <p className="text-base font-bold text-neutral-900 dark:text-white mb-1">No companies found</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              No companies with Company Admin roles exist yet.
            </p>
          </div>
        </div>
      )}

      {/* Company cards grid */}
      {!isLoading && !isError && roles.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              <span className="font-semibold text-neutral-900 dark:text-white">{roles.length}</span>{' '}
              {roles.length === 1 ? 'company' : 'companies'}
            </p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500">
              Canonical set: {CANONICAL_PERMISSIONS.length} modules
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {roles.map((role) => (
              <CompanyRoleCard key={role.roleId} role={role} onEdit={setEditingRole} />
            ))}
          </div>
        </>
      )}

      {/* Edit modal */}
      {editingRole && (
        <EditPermissionsModal
          role={editingRole}
          onClose={() => setEditingRole(null)}
        />
      )}
    </div>
  );
}
