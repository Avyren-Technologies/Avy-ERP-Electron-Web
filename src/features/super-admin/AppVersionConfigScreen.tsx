import { useState, useEffect } from 'react';
import {
  Smartphone,
  TabletSmartphone,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  WrenchIcon,
  X,
  Pencil,
  Plus,
  Trash2,
  Clock,
  Link,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import {
  useAppVersionList,
  useUpsertAppVersion,
  useUpdateAppVersion,
  useDeleteAppVersion,
} from '@/features/super-admin/api/use-app-version-queries';
import type { AppVersionConfig, UpsertAppVersionPayload, UpdateAppVersionPayload } from '@/lib/api/app-version';

// ── Types ──────────────────────────────────────────────────────────────────

type Platform = 'ANDROID' | 'IOS';

interface FormState {
  latestVersion: string;
  minimumVersion: string;
  recommendedVersion: string;
  updateUrl: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  latestVersion: '',
  minimumVersion: '',
  recommendedVersion: '',
  updateUrl: '',
  maintenanceMode: false,
  maintenanceMessage: '',
  isActive: true,
};

function configToForm(config: AppVersionConfig): FormState {
  return {
    latestVersion: config.latestVersion,
    minimumVersion: config.minimumVersion,
    recommendedVersion: config.recommendedVersion ?? '',
    updateUrl: config.updateUrl ?? '',
    maintenanceMode: config.maintenanceMode,
    maintenanceMessage: config.maintenanceMessage ?? '',
    isActive: config.isActive,
  };
}

// ── Toggle Switch ──────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled,
  size = 'md',
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}) {
  const sm = size === 'sm';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900',
        sm ? 'h-4 w-8' : 'h-6 w-11',
        checked ? 'bg-primary-600' : 'bg-neutral-200 dark:bg-neutral-700',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
          sm ? 'h-3 w-3' : 'h-5 w-5',
          checked ? (sm ? 'translate-x-4' : 'translate-x-5') : 'translate-x-0',
        )}
      />
    </button>
  );
}

// ── Skeleton Card ──────────────────────────────────────────────────────────

function SkeletonPlatformCard() {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden animate-pulse">
      <div className="p-6 border-b border-neutral-200/60 dark:border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800" />
          <div>
            <div className="w-24 h-4 bg-neutral-100 dark:bg-neutral-800 rounded mb-2" />
            <div className="w-16 h-3 bg-neutral-100 dark:bg-neutral-800 rounded" />
          </div>
        </div>
        <div className="w-20 h-6 bg-neutral-100 dark:bg-neutral-800 rounded-full" />
      </div>
      <div className="p-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex justify-between">
            <div className="w-28 h-3 bg-neutral-100 dark:bg-neutral-800 rounded" />
            <div className="w-20 h-3 bg-neutral-100 dark:bg-neutral-800 rounded" />
          </div>
        ))}
      </div>
      <div className="px-6 pb-6 pt-2 flex gap-3">
        <div className="h-9 flex-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl" />
        <div className="h-9 w-24 bg-neutral-100 dark:bg-neutral-800 rounded-xl" />
      </div>
    </div>
  );
}

// ── Platform Card ──────────────────────────────────────────────────────────

interface PlatformCardProps {
  platform: Platform;
  config: AppVersionConfig | undefined;
  onConfigure: () => void;
  onDelete: () => void;
  onToggleMaintenance: () => void;
  onToggleActive: () => void;
  isDeleting: boolean;
  isToggling: boolean;
}

function PlatformCard({
  platform,
  config,
  onConfigure,
  onDelete,
  onToggleMaintenance,
  onToggleActive,
  isDeleting,
  isToggling,
}: PlatformCardProps) {
  const fmt = useCompanyFormatter();

  const isAndroid = platform === 'ANDROID';
  const Icon = isAndroid ? Smartphone : TabletSmartphone;
  const iconBg = isAndroid
    ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
    : 'bg-gradient-to-br from-neutral-700 to-neutral-900 dark:from-neutral-600 dark:to-neutral-800';
  const platformLabel = isAndroid ? 'Android' : 'iOS';
  const urlPlaceholder = isAndroid ? 'Play Store URL' : 'App Store URL';

  const statusBadge = !config
    ? { label: 'Not Configured', cls: 'bg-neutral-100 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700' }
    : !config.isActive
      ? { label: 'Inactive', cls: 'bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50' }
      : config.maintenanceMode
        ? { label: 'Maintenance', cls: 'bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50' }
        : { label: 'Active', cls: 'bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50' };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden flex flex-col">
      {/* Card Header */}
      <div className="p-6 border-b border-neutral-200/60 dark:border-neutral-800">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm flex-shrink-0', iconBg)}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-primary-950 dark:text-white">{platformLabel}</h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mt-0.5">
                {isAndroid ? 'Google Play Store' : 'Apple App Store'}
              </p>
            </div>
          </div>

          <span className={cn(
            'text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border flex-shrink-0',
            statusBadge.cls,
          )}>
            {statusBadge.label}
          </span>
        </div>

        {/* Maintenance indicator */}
        {config?.maintenanceMode && (
          <div className="mt-4 flex items-center gap-2 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl px-3 py-2">
            <AlertTriangle className="w-4 h-4 text-danger-600 dark:text-danger-400 flex-shrink-0" />
            <p className="text-xs font-semibold text-danger-700 dark:text-danger-400 line-clamp-2">
              {config.maintenanceMessage || 'Maintenance mode is active — users cannot access the app.'}
            </p>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-6 flex-1">
        {!config ? (
          /* Not configured empty state */
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700 flex items-center justify-center mb-4">
              <Icon className="w-7 h-7 text-neutral-300 dark:text-neutral-600" />
            </div>
            <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
              No configuration
            </p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500">
              Set up version control for {platformLabel} to manage updates.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Version rows */}
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between py-2.5 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success-500" />
                  Latest Version
                </span>
                <span className="text-sm font-bold text-primary-950 dark:text-white font-mono">
                  {config.latestVersion}
                </span>
              </div>

              <div className="flex items-center justify-between py-2.5 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-warning-500" />
                  Minimum Version
                </span>
                <span className="text-sm font-bold text-primary-950 dark:text-white font-mono">
                  {config.minimumVersion}
                </span>
              </div>

              {config.recommendedVersion && (
                <div className="flex items-center justify-between py-2.5 border-b border-neutral-100 dark:border-neutral-800">
                  <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-primary-400" />
                    Recommended
                  </span>
                  <span className="text-sm font-bold text-primary-950 dark:text-white font-mono">
                    {config.recommendedVersion}
                  </span>
                </div>
              )}

              {config.updateUrl && (
                <div className="flex items-center justify-between py-2.5 border-b border-neutral-100 dark:border-neutral-800">
                  <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
                    <Link className="w-3.5 h-3.5 text-neutral-400" />
                    {urlPlaceholder}
                  </span>
                  <a
                    href={config.updateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline max-w-[140px] truncate"
                  >
                    {config.updateUrl}
                  </a>
                </div>
              )}
            </div>

            {/* Quick toggles */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <WrenchIcon className="w-4 h-4 text-danger-500 dark:text-danger-400" />
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Maintenance Mode</span>
                </div>
                <Toggle
                  checked={config.maintenanceMode}
                  onChange={onToggleMaintenance}
                  disabled={isToggling}
                  size="sm"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-500 dark:text-success-400" />
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Active</span>
                </div>
                <Toggle
                  checked={config.isActive}
                  onChange={onToggleActive}
                  disabled={isToggling}
                  size="sm"
                />
              </div>
            </div>

            {/* Last updated */}
            <div className="flex items-center gap-1.5 pt-2">
              <Clock className="w-3.5 h-3.5 text-neutral-400" />
              <span className="text-xs text-neutral-400 dark:text-neutral-500">
                Updated {fmt.dateTime(config.updatedAt)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="px-6 pb-6 pt-2 flex items-center gap-3">
        <button
          onClick={onConfigure}
          className="flex-1 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl px-4 py-2.5 transition-colors text-sm"
        >
          {config ? (
            <><Pencil className="w-4 h-4" /> Edit Config</>
          ) : (
            <><Plus className="w-4 h-4" /> Configure</>
          )}
        </button>

        {config && (
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="flex items-center gap-1.5 bg-danger-50 text-danger-600 hover:bg-danger-100 dark:bg-danger-900/20 dark:text-danger-400 dark:hover:bg-danger-900/40 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Config Modal ───────────────────────────────────────────────────────────

interface ConfigModalProps {
  platform: Platform;
  config: AppVersionConfig | undefined;
  onClose: () => void;
}

function ConfigModal({ platform, config, onClose }: ConfigModalProps) {
  const isEditing = !!config;
  const isAndroid = platform === 'ANDROID';
  const upsert = useUpsertAppVersion();
  const update = useUpdateAppVersion();

  const [form, setForm] = useState<FormState>(() =>
    config ? configToForm(config) : EMPTY_FORM,
  );
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof FormState, string>> = {};
    const semVerish = /^\d+\.\d+(\.\d+)?$/;

    if (!form.latestVersion.trim()) {
      newErrors.latestVersion = 'Latest version is required';
    } else if (!semVerish.test(form.latestVersion.trim())) {
      newErrors.latestVersion = 'Use format like 1.2.3 or 1.2';
    }

    if (!form.minimumVersion.trim()) {
      newErrors.minimumVersion = 'Minimum version is required';
    } else if (!semVerish.test(form.minimumVersion.trim())) {
      newErrors.minimumVersion = 'Use format like 1.2.3 or 1.2';
    }

    if (form.recommendedVersion.trim() && !semVerish.test(form.recommendedVersion.trim())) {
      newErrors.recommendedVersion = 'Use format like 1.2.3 or 1.2';
    }

    if (form.updateUrl.trim()) {
      try {
        new URL(form.updateUrl.trim());
      } catch {
        newErrors.updateUrl = 'Enter a valid URL';
      }
    }

    if (form.maintenanceMode && !form.maintenanceMessage.trim()) {
      newErrors.maintenanceMessage = 'Provide a message when maintenance mode is on';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;

    const payload = {
      latestVersion: form.latestVersion.trim(),
      minimumVersion: form.minimumVersion.trim(),
      recommendedVersion: form.recommendedVersion.trim() || undefined,
      updateUrl: form.updateUrl.trim() || undefined,
      maintenanceMode: form.maintenanceMode,
      maintenanceMessage: form.maintenanceMessage.trim() || undefined,
      isActive: form.isActive,
    };

    if (isEditing && config) {
      update.mutate(
        { id: config.id, data: payload as UpdateAppVersionPayload },
        { onSuccess: onClose },
      );
    } else {
      const upsertPayload: UpsertAppVersionPayload = { ...payload, platform };
      upsert.mutate(upsertPayload, { onSuccess: onClose });
    }
  }

  const isPending = upsert.isPending || update.isPending;
  const platformLabel = isAndroid ? 'Android' : 'iOS';
  const urlPlaceholder = isAndroid
    ? 'https://play.google.com/store/apps/details?id=...'
    : 'https://apps.apple.com/app/...';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-2xl flex flex-col max-h-[90vh]"
        style={{ animation: 'modalSlideUp 0.28s cubic-bezier(0.16,1,0.3,1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-200/60 dark:border-neutral-800 flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-primary-950 dark:text-white">
              {isEditing ? 'Edit' : 'Configure'} {platformLabel} Version
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {isEditing ? 'Update the version control settings.' : 'Set up version enforcement for the first time.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Version Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                Latest Version <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                value={form.latestVersion}
                onChange={(e) => setField('latestVersion', e.target.value)}
                placeholder="e.g. 2.5.0"
                className={cn(
                  'w-full rounded-xl border bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-primary-950 dark:text-white placeholder-neutral-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all',
                  errors.latestVersion
                    ? 'border-danger-400 dark:border-danger-500'
                    : 'border-neutral-300 dark:border-neutral-700',
                )}
              />
              {errors.latestVersion && (
                <p className="mt-1 text-xs text-danger-600 dark:text-danger-400">{errors.latestVersion}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                Minimum Version <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                value={form.minimumVersion}
                onChange={(e) => setField('minimumVersion', e.target.value)}
                placeholder="e.g. 2.0.0"
                className={cn(
                  'w-full rounded-xl border bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-primary-950 dark:text-white placeholder-neutral-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all',
                  errors.minimumVersion
                    ? 'border-danger-400 dark:border-danger-500'
                    : 'border-neutral-300 dark:border-neutral-700',
                )}
              />
              {errors.minimumVersion && (
                <p className="mt-1 text-xs text-danger-600 dark:text-danger-400">{errors.minimumVersion}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
              Recommended Version
              <span className="ml-2 text-[10px] font-normal text-neutral-400 dark:text-neutral-500">Optional</span>
            </label>
            <input
              type="text"
              value={form.recommendedVersion}
              onChange={(e) => setField('recommendedVersion', e.target.value)}
              placeholder="e.g. 2.4.0"
              className={cn(
                'w-full rounded-xl border bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-primary-950 dark:text-white placeholder-neutral-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all',
                errors.recommendedVersion
                  ? 'border-danger-400 dark:border-danger-500'
                  : 'border-neutral-300 dark:border-neutral-700',
              )}
            />
            {errors.recommendedVersion && (
              <p className="mt-1 text-xs text-danger-600 dark:text-danger-400">{errors.recommendedVersion}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
              Update URL
              <span className="ml-2 text-[10px] font-normal text-neutral-400 dark:text-neutral-500">Optional</span>
            </label>
            <input
              type="url"
              value={form.updateUrl}
              onChange={(e) => setField('updateUrl', e.target.value)}
              placeholder={urlPlaceholder}
              className={cn(
                'w-full rounded-xl border bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-primary-950 dark:text-white placeholder-neutral-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all',
                errors.updateUrl
                  ? 'border-danger-400 dark:border-danger-500'
                  : 'border-neutral-300 dark:border-neutral-700',
              )}
            />
            {errors.updateUrl && (
              <p className="mt-1 text-xs text-danger-600 dark:text-danger-400">{errors.updateUrl}</p>
            )}
          </div>

          {/* Toggles section */}
          <div className="border border-neutral-200/60 dark:border-neutral-800 rounded-xl overflow-hidden divide-y divide-neutral-200/60 dark:divide-neutral-800">
            {/* Active toggle */}
            <div className="flex items-center justify-between px-4 py-3.5">
              <div>
                <p className="text-sm font-semibold text-primary-950 dark:text-white">Active</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Enable this platform's version enforcement</p>
              </div>
              <Toggle
                checked={form.isActive}
                onChange={(v) => setField('isActive', v)}
              />
            </div>

            {/* Maintenance toggle */}
            <div className="flex items-center justify-between px-4 py-3.5">
              <div>
                <p className="text-sm font-semibold text-primary-950 dark:text-white">Maintenance Mode</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Block all app access with a custom message</p>
              </div>
              <Toggle
                checked={form.maintenanceMode}
                onChange={(v) => setField('maintenanceMode', v)}
              />
            </div>
          </div>

          {/* Maintenance message */}
          {form.maintenanceMode && (
            <div>
              <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                Maintenance Message <span className="text-danger-500">*</span>
              </label>
              <textarea
                value={form.maintenanceMessage}
                onChange={(e) => setField('maintenanceMessage', e.target.value)}
                rows={3}
                placeholder="We're performing scheduled maintenance. Please check back soon."
                className={cn(
                  'w-full rounded-xl border bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-primary-950 dark:text-white placeholder-neutral-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all resize-none',
                  errors.maintenanceMessage
                    ? 'border-danger-400 dark:border-danger-500'
                    : 'border-neutral-300 dark:border-neutral-700',
                )}
              />
              {errors.maintenanceMessage && (
                <p className="mt-1 text-xs text-danger-600 dark:text-danger-400">{errors.maintenanceMessage}</p>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200/60 dark:border-neutral-800 flex-shrink-0 bg-neutral-50/50 dark:bg-neutral-900/80">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 text-sm font-bold text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors disabled:opacity-60"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEditing ? 'Save Changes' : 'Create Config'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
      `}</style>
    </div>
  );
}

// ── Delete Confirm Modal ───────────────────────────────────────────────────

function DeleteConfirmModal({
  platform,
  onConfirm,
  onClose,
  isDeleting,
}: {
  platform: Platform;
  onConfirm: () => void;
  onClose: () => void;
  isDeleting: boolean;
}) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-2xl p-6"
        style={{ animation: 'modalSlideUp 0.28s cubic-bezier(0.16,1,0.3,1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-2xl bg-danger-50 dark:bg-danger-900/20 flex items-center justify-center mb-4">
          <Trash2 className="w-6 h-6 text-danger-600 dark:text-danger-400" />
        </div>
        <h3 className="text-lg font-bold text-primary-950 dark:text-white mb-1">Delete Configuration?</h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
          This will permanently remove the {platform === 'ANDROID' ? 'Android' : 'iOS'} version config. The app will fall back to no version enforcement.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 text-sm font-bold text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-danger-600 hover:bg-danger-700 rounded-xl transition-colors disabled:opacity-60"
          >
            {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
            Delete
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
      `}</style>
    </div>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────

type ModalState =
  | { type: 'configure'; platform: Platform }
  | { type: 'delete'; platform: Platform; id: string }
  | null;

export function AppVersionConfigScreen() {
  const { data, isLoading, isError } = useAppVersionList();
  const updateMutation = useUpdateAppVersion();
  const deleteMutation = useDeleteAppVersion();

  const [modal, setModal] = useState<ModalState>(null);

  const configs: AppVersionConfig[] = data?.data ?? [];
  const androidConfig = configs.find((c) => c.platform === 'ANDROID');
  const iosConfig = configs.find((c) => c.platform === 'IOS');

  function handleToggleMaintenance(config: AppVersionConfig) {
    updateMutation.mutate({
      id: config.id,
      data: { maintenanceMode: !config.maintenanceMode },
    });
  }

  function handleToggleActive(config: AppVersionConfig) {
    updateMutation.mutate({
      id: config.id,
      data: { isActive: !config.isActive },
    });
  }

  function handleDelete(id: string) {
    deleteMutation.mutate(id, { onSuccess: () => setModal(null) });
  }

  const modalConfig =
    modal?.type === 'configure'
      ? modal.platform === 'ANDROID'
        ? androidConfig
        : iosConfig
      : undefined;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">
            App Version Control
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Manage version enforcement, minimum requirements, and maintenance windows for mobile clients.
          </p>
        </div>

        {/* Summary badge */}
        {!isLoading && (
          <div className="flex items-center gap-2 px-4 py-2 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl flex-shrink-0">
            <div className={cn(
              'w-2 h-2 rounded-full',
              configs.some((c) => c.maintenanceMode)
                ? 'bg-danger-500 animate-pulse'
                : configs.length > 0
                  ? 'bg-success-500'
                  : 'bg-neutral-400',
            )} />
            <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
              {configs.some((c) => c.maintenanceMode)
                ? 'Maintenance Active'
                : configs.length === 2
                  ? 'Both Platforms Configured'
                  : configs.length === 1
                    ? '1 Platform Configured'
                    : 'Not Configured'}
            </span>
          </div>
        )}
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/50 rounded-2xl px-5 py-4">
        <Info className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-primary-800 dark:text-primary-300">How version control works</p>
          <p className="text-sm text-primary-700 dark:text-primary-400 mt-0.5">
            The mobile app checks these settings on launch. Users on versions below the <strong>minimum</strong> are forced to update.
            Users on versions below <strong>recommended</strong> see a soft prompt. Enabling <strong>maintenance mode</strong> blocks all access regardless of version.
          </p>
        </div>
      </div>

      {/* Platform cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonPlatformCard />
          <SkeletonPlatformCard />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-danger-50 dark:bg-danger-900/20 flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7 text-danger-500" />
          </div>
          <h2 className="text-lg font-bold text-primary-950 dark:text-white mb-1">
            Failed to load version configs
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Unable to fetch app version data. Please try refreshing.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {(['ANDROID', 'IOS'] as Platform[]).map((platform) => {
            const config = platform === 'ANDROID' ? androidConfig : iosConfig;
            return (
              <PlatformCard
                key={platform}
                platform={platform}
                config={config}
                onConfigure={() => setModal({ type: 'configure', platform })}
                onDelete={() => config && setModal({ type: 'delete', platform, id: config.id })}
                onToggleMaintenance={() => config && handleToggleMaintenance(config)}
                onToggleActive={() => config && handleToggleActive(config)}
                isDeleting={deleteMutation.isPending && modal?.type === 'delete' && modal.platform === platform}
                isToggling={updateMutation.isPending}
              />
            );
          })}
        </div>
      )}

      {/* Configure/Edit Modal */}
      {modal?.type === 'configure' && (
        <ConfigModal
          platform={modal.platform}
          config={modalConfig}
          onClose={() => setModal(null)}
        />
      )}

      {/* Delete Confirm Modal */}
      {modal?.type === 'delete' && (
        <DeleteConfirmModal
          platform={modal.platform}
          onConfirm={() => handleDelete(modal.id)}
          onClose={() => setModal(null)}
          isDeleting={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
