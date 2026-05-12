import { useState, useEffect, useCallback, useMemo } from 'react';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import {
  Users,
  UserCheck,
  UserX,
  Building2,
  ShieldCheck,
  Plus,
  Search,
  Filter,
  Edit3,
  KeyRound,
  Trash2,
  Loader2,
  X,
  Mail,
  Phone,
  AlertTriangle,
  Eye,
  EyeOff,
  Crown,
  Shield,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlatformUsers, usePlatformUserStats, usePlatformCompanies } from '@/features/super-admin/api/use-platform-user-queries';
import {
  useCreatePlatformUser,
  useUpdatePlatformUser,
  useResetPlatformUserPassword,
  useUpdatePlatformUserStatus,
  useDeletePlatformUser,
} from '@/features/super-admin/api/use-platform-user-mutations';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { showSuccess, showError, showApiError } from '@/lib/toast';
import type { PlatformUser, CompanyOption } from '@/lib/api/platform-users';

// ─── Constants ───────────────────────────────────────────────────────
const ROLE_OPTIONS = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'COMPANY_ADMIN', label: 'Company Admin' },
  { value: 'USER', label: 'User' },
] as const;

const STATUS_OPTIONS = ['All', 'Active', 'Inactive'] as const;

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  phone: '',
  companyId: '',
  role: 'USER' as 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'USER',
};

// ─── Helpers ─────────────────────────────────────────────────────────
function getRoleBadge(role: string) {
  switch (role) {
    case 'SUPER_ADMIN':
      return {
        icon: Crown,
        label: 'Super Admin',
        cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50',
      };
    case 'COMPANY_ADMIN':
      return {
        icon: Shield,
        label: 'Company Admin',
        cls: 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50',
      };
    default:
      return {
        icon: User,
        label: 'User',
        cls: 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700',
      };
  }
}

// ─── Stat Card ───────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, accent }: {
  icon: typeof Users;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 p-5 shadow-sm transition-colors">
      <div className="flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center border', accent)}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-extrabold text-primary-950 dark:text-white tracking-tight">{value}</p>
          <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{label}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Status Badge ────────────────────────────────────────────────────
function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border',
      active
        ? 'bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50'
        : 'bg-neutral-100 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700',
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full', active ? 'bg-success-500' : 'bg-neutral-400')} />
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

// ─── Form Field ──────────────────────────────────────────────────────
function FormField({ label, value, onChange, placeholder, type = 'text', required, disabled }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean; disabled?: boolean;
}) {
  const id = `field-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-danger-500 ml-0.5">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all disabled:opacity-50"
      />
    </div>
  );
}

// ─── Create/Edit Modal ───────────────────────────────────────────────
function UserFormModal({ editingId, form, updateField, onClose, onSave, saving, companies }: {
  editingId: string | null;
  form: typeof EMPTY_FORM;
  updateField: (key: string, value: string) => void;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
  companies: CompanyOption[];
}) {
  const handleEsc = useCallback((e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }, [onClose]);
  useEffect(() => { document.addEventListener('keydown', handleEsc); return () => document.removeEventListener('keydown', handleEsc); }, [handleEsc]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
      <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="text-lg font-bold text-primary-950 dark:text-white">{editingId ? 'Edit User' : 'Create User'}</h2>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400"><X size={18} /></button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="First Name" value={form.firstName} onChange={(v) => updateField('firstName', v)} placeholder="First name" required />
            <FormField label="Last Name" value={form.lastName} onChange={(v) => updateField('lastName', v)} placeholder="Last name" required />
          </div>
          <FormField label="Email" value={form.email} onChange={(v) => updateField('email', v)} type="email" placeholder="user@company.com" required />
          {!editingId && (
            <FormField label="Password" value={form.password} onChange={(v) => updateField('password', v)} type="password" placeholder="Min 6 characters" required />
          )}
          <FormField label="Phone" value={form.phone} onChange={(v) => updateField('phone', v)} placeholder="+91 98765 43210" />

          <div>
            <label htmlFor="user-company" className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
              Company<span className="text-danger-500 ml-0.5">*</span>
            </label>
            <select
              id="user-company"
              value={form.companyId}
              onChange={(e) => updateField('companyId', e.target.value)}
              className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
            >
              <option value="">Select company...</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="user-role" className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
              Platform Role<span className="text-danger-500 ml-0.5">*</span>
            </label>
            <select
              id="user-role"
              value={form.role}
              onChange={(e) => updateField('role', e.target.value)}
              className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
            Cancel
          </button>
          <button onClick={onSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Password Reset Modal ────────────────────────────────────────────
function PasswordResetModal({ user, onClose, onSave, saving }: {
  user: PlatformUser;
  onClose: () => void;
  onSave: (password: string) => void;
  saving: boolean;
}) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleEsc = useCallback((e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }, [onClose]);
  useEffect(() => { document.addEventListener('keydown', handleEsc); return () => document.removeEventListener('keydown', handleEsc); }, [handleEsc]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
      <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <KeyRound size={18} className="text-warning-500" />
            <h2 className="text-lg font-bold text-primary-950 dark:text-white">Reset Password</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800/50 rounded-xl p-3 flex items-start gap-2">
            <AlertTriangle size={16} className="text-warning-600 dark:text-warning-400 mt-0.5 shrink-0" />
            <p className="text-xs text-warning-700 dark:text-warning-400">
              Resetting password for <span className="font-bold">{user.firstName} {user.lastName}</span> ({user.email}). This will also unlock the account if locked.
            </p>
          </div>
          <div>
            <label htmlFor="new-password" className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">New Password</label>
            <div className="relative">
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full px-3 py-2.5 pr-10 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => onSave(password)}
            disabled={saving || password.length < 6}
            className="flex-1 py-2.5 rounded-xl bg-warning-600 hover:bg-warning-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? 'Resetting...' : 'Reset Password'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirmation Modal ───────────────────────────────────────
function DeleteConfirmModal({ user, onClose, onConfirm, deleting }: {
  user: PlatformUser;
  onClose: () => void;
  onConfirm: () => void;
  deleting: boolean;
}) {
  const [confirmText, setConfirmText] = useState('');
  const canDelete = confirmText === user.email;

  const handleEsc = useCallback((e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }, [onClose]);
  useEffect(() => { document.addEventListener('keydown', handleEsc); return () => document.removeEventListener('keydown', handleEsc); }, [handleEsc]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
      <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <Trash2 size={18} className="text-danger-500" />
            <h2 className="text-lg font-bold text-primary-950 dark:text-white">Delete User</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-3 flex items-start gap-2">
            <AlertTriangle size={16} className="text-danger-600 dark:text-danger-400 mt-0.5 shrink-0" />
            <div className="text-xs text-danger-700 dark:text-danger-400">
              <p className="font-bold mb-1">This action is permanent and cannot be undone.</p>
              <p>
                Deleting <span className="font-bold">{user.firstName} {user.lastName}</span> will remove their account,
                all session data, tenant role assignments, and authentication tokens.
              </p>
            </div>
          </div>
          <div>
            <label htmlFor="confirm-delete" className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1.5">
              Type <span className="font-mono font-bold text-danger-600 dark:text-danger-400">{user.email}</span> to confirm:
            </label>
            <input
              id="confirm-delete"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={user.email}
              className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-danger-500/20 focus:border-danger-500 dark:text-white placeholder:text-neutral-400 transition-all"
            />
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!canDelete || deleting}
            className="flex-1 py-2.5 rounded-xl bg-danger-600 hover:bg-danger-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {deleting && <Loader2 size={14} className="animate-spin" />}
            {deleting ? 'Deleting...' : 'Delete Permanently'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────
export function PlatformUserManagementScreen() {
  const fmt = useCompanyFormatter();

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const limit = 25;

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  // Queries
  const { data: statsData } = usePlatformUserStats();
  const stats = statsData?.data;

  const { data: companiesData } = usePlatformCompanies();
  const companies: CompanyOption[] = companiesData?.data ?? [];

  const params = useMemo(() => ({
    page,
    limit,
    search: debouncedSearch || undefined,
    companyId: companyFilter || undefined,
    role: roleFilter || undefined,
    isActive: statusFilter === 'All' ? undefined : statusFilter === 'Active',
  }), [page, limit, debouncedSearch, companyFilter, roleFilter, statusFilter]);

  const { data, isLoading, isError } = usePlatformUsers(params);
  const users: PlatformUser[] = data?.data ?? [];
  const meta = data?.meta;
  const total = meta?.total ?? users.length;

  // Mutations
  const createMutation = useCreatePlatformUser();
  const updateMutation = useUpdatePlatformUser();
  const passwordMutation = useResetPlatformUserPassword();
  const statusMutation = useUpdatePlatformUserStatus();
  const deleteMutation = useDeletePlatformUser();

  // Modal state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const [passwordTarget, setPasswordTarget] = useState<PlatformUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PlatformUser | null>(null);

  // Handlers
  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setFormModalOpen(true);
  };

  const openEdit = (user: PlatformUser) => {
    setEditingId(user.id);
    setForm({
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      email: user.email ?? '',
      password: '',
      phone: user.phone ?? '',
      companyId: user.companyId ?? '',
      role: user.role ?? 'USER',
    });
    setFormModalOpen(true);
  };

  const validateForm = (): string | null => {
    if (!form.firstName.trim()) return 'First name is required.';
    if (!form.lastName.trim()) return 'Last name is required.';
    if (!form.email.trim()) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return 'Invalid email address.';
    if (!editingId && form.password.length < 6) return 'Password must be at least 6 characters.';
    if (!form.companyId) return 'Company is required.';
    return null;
  };

  const handleSave = async () => {
    const err = validateForm();
    if (err) { showError('Validation Error', err); return; }
    try {
      if (editingId) {
        const { password: _pw, ...updateData } = form;
        await updateMutation.mutateAsync({ id: editingId, data: updateData });
        showSuccess('User Updated', `${form.firstName} ${form.lastName} has been updated.`);
      } else {
        await createMutation.mutateAsync(form);
        showSuccess('User Created', `${form.firstName} ${form.lastName} has been added.`);
      }
      setFormModalOpen(false);
    } catch (e) { showApiError(e); }
  };

  const handlePasswordReset = async (password: string) => {
    if (!passwordTarget) return;
    if (password.length < 6) { showError('Validation Error', 'Password must be at least 6 characters.'); return; }
    try {
      await passwordMutation.mutateAsync({ id: passwordTarget.id, password });
      showSuccess('Password Reset', `Password for ${passwordTarget.firstName} ${passwordTarget.lastName} has been reset.`);
      setPasswordTarget(null);
    } catch (e) { showApiError(e); }
  };

  const handleToggleStatus = async (user: PlatformUser) => {
    try {
      await statusMutation.mutateAsync({ id: user.id, isActive: !user.isActive });
      showSuccess('Status Updated', `${user.firstName} ${user.lastName} is now ${!user.isActive ? 'active' : 'inactive'}.`);
    } catch (e) { showApiError(e); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      showSuccess('User Deleted', `${deleteTarget.firstName} ${deleteTarget.lastName} has been permanently deleted.`);
      setDeleteTarget(null);
    } catch (e) { showApiError(e); }
  };

  const saving = createMutation.isPending || updateMutation.isPending;
  const updateField = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const formatDate = (d: string | null | undefined) => {
    if (!d) return '—';
    try { return fmt.dateTime(d); } catch { return d; }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center border border-primary-100 dark:border-primary-800/50">
            <Users className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">User Management</h1>
            <p className="text-neutral-500 dark:text-neutral-400 mt-1">Manage all platform users across companies</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
        >
          <Plus className="w-5 h-5" />
          Add User
        </button>
      </div>

      {/* ── Stats Cards ── */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total Users" value={stats.total} accent="bg-primary-50 text-primary-600 border-primary-100 dark:bg-primary-900/30 dark:text-primary-400 dark:border-primary-800/50" />
          <StatCard icon={UserCheck} label="Active" value={stats.active} accent="bg-success-50 text-success-600 border-success-100 dark:bg-success-900/30 dark:text-success-400 dark:border-success-800/50" />
          <StatCard icon={UserX} label="Inactive" value={stats.inactive} accent="bg-neutral-100 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700" />
          <StatCard icon={Building2} label="Companies" value={stats.companies} accent="bg-accent-50 text-accent-600 border-accent-100 dark:bg-accent-900/30 dark:text-accent-400 dark:border-accent-800/50" />
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm flex flex-col gap-4 transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Search */}
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:focus:border-primary-500 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 transition-all"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 ml-auto overflow-x-auto pb-1 lg:pb-0">
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-neutral-400 flex-shrink-0" />
              <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 whitespace-nowrap">Company:</span>
              <select
                value={companyFilter}
                onChange={(e) => { setCompanyFilter(e.target.value); setPage(1); }}
                className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-semibold text-neutral-700 dark:text-neutral-300 focus:outline-none max-w-[200px]"
              >
                <option value="">All Companies</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 whitespace-nowrap">Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-semibold text-neutral-700 dark:text-neutral-300 focus:outline-none"
              >
                <option value="">All Roles</option>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
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
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ── Error ── */}
      {isError && (
        <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
          Failed to load users. Please try again.
        </div>
      )}

      {/* ── Data Table ── */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden transition-colors">
        {isLoading ? <SkeletonTable rows={10} cols={7} /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead>
                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                  <th className="py-4 px-6 font-bold">User</th>
                  <th className="py-4 px-6 font-bold">Company</th>
                  <th className="py-4 px-6 font-bold">Platform Role</th>
                  <th className="py-4 px-6 font-bold">Tenant Role</th>
                  <th className="py-4 px-6 font-bold">Status</th>
                  <th className="py-4 px-6 font-bold">Last Login</th>
                  <th className="py-4 px-6 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {users.map((user) => {
                  const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email;
                  const roleBadge = getRoleBadge(user.role);
                  const RoleIcon = roleBadge.icon;
                  const isSuperAdmin = user.role === 'SUPER_ADMIN';

                  return (
                    <tr key={user.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                      {/* User */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center shrink-0 text-sm font-bold text-accent-700 dark:text-accent-400">
                            {fullName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-primary-950 dark:text-white block truncate">{fullName}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <a href={`mailto:${user.email}`} className="text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 text-[11px] truncate">
                                <Mail size={10} />{user.email}
                              </a>
                              {user.phone && (
                                <span className="text-neutral-400 dark:text-neutral-500 flex items-center gap-1 text-[11px]">
                                  <Phone size={10} />{user.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Company */}
                      <td className="py-4 px-6">
                        <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-md truncate max-w-[180px] block">
                          {user.companyName ?? '—'}
                        </span>
                      </td>

                      {/* Platform Role */}
                      <td className="py-4 px-6">
                        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border', roleBadge.cls)}>
                          <RoleIcon size={12} />
                          {roleBadge.label}
                        </span>
                      </td>

                      {/* Tenant Role */}
                      <td className="py-4 px-6">
                        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                          {user.tenantRoleName ?? '—'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        <StatusBadge active={user.isActive} />
                        {user.lockedUntil && new Date(user.lockedUntil) > new Date() && (
                          <span className="block text-[10px] text-danger-500 font-semibold mt-1">Locked</span>
                        )}
                      </td>

                      {/* Last Login */}
                      <td className="py-4 px-6 text-neutral-500 dark:text-neutral-400 text-xs">
                        {formatDate(user.lastLogin)}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(user)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit user">
                            <Edit3 size={15} />
                          </button>
                          <button onClick={() => setPasswordTarget(user)} className="p-2 text-warning-600 dark:text-warning-400 hover:bg-warning-50 dark:hover:bg-warning-900/20 rounded-lg transition-colors" title="Reset password">
                            <KeyRound size={15} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(user)}
                            disabled={statusMutation.isPending || isSuperAdmin}
                            className={cn(
                              'p-2 rounded-lg transition-colors disabled:opacity-30',
                              user.isActive
                                ? 'text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20'
                                : 'text-success-500 hover:bg-success-50 dark:hover:bg-success-900/20',
                            )}
                            title={isSuperAdmin ? 'Cannot deactivate super admin' : user.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {user.isActive ? <UserX size={15} /> : <UserCheck size={15} />}
                          </button>
                          <button
                            onClick={() => setDeleteTarget(user)}
                            disabled={isSuperAdmin}
                            className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors disabled:opacity-30"
                            title={isSuperAdmin ? 'Cannot delete super admin' : 'Delete user'}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {users.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState icon="search" title="No users found" message="Try adjusting your search or filters." />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ── */}
        <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400 bg-neutral-50/50 dark:bg-neutral-900/50">
          <span className="font-medium">
            Showing {users.length > 0 ? (page - 1) * limit + 1 : 0} to {Math.min(page * limit, total)} of {total} entries
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
              disabled={page <= 1}
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
              disabled={!meta || page >= (meta.totalPages ?? 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {formModalOpen && (
        <UserFormModal
          editingId={editingId}
          form={form}
          updateField={updateField}
          onClose={() => setFormModalOpen(false)}
          onSave={handleSave}
          saving={saving}
          companies={companies}
        />
      )}

      {passwordTarget && (
        <PasswordResetModal
          user={passwordTarget}
          onClose={() => setPasswordTarget(null)}
          onSave={handlePasswordReset}
          saving={passwordMutation.isPending}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          user={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          deleting={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
