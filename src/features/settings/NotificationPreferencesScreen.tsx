import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Lock } from 'lucide-react';
import {
    notificationApi,
    type NotificationPreferenceData,
    type NotificationPreferencesResponse,
    type NotificationCategoryPreference,
    type NotificationChannel,
} from '@/lib/api/notifications';
import { showSuccess, showApiError } from '@/lib/toast';

// Channels displayed in the category matrix header (IN_APP is omitted
// because in-app delivery is always the system of record).
const CATEGORY_MATRIX_CHANNELS: Array<{ key: NotificationChannel; label: string }> = [
    { key: 'PUSH', label: 'Push' },
    { key: 'EMAIL', label: 'Email' },
    { key: 'SMS', label: 'SMS' },
    { key: 'WHATSAPP', label: 'WhatsApp' },
];

/** Separate root key so notification list/unread invalidations don't refetch preferences. */
export const notificationPreferencesKey = ['notification-preferences'] as const;

interface EnvelopeShape {
    data?: NotificationPreferencesResponse;
    success?: boolean;
}

interface ToggleRowProps {
    label: string;
    description: string;
    checked: boolean;
    disabled?: boolean;
    disabledReason?: string;
    onChange: (v: boolean) => void;
}

function ToggleRow({ label, description, checked, disabled, disabledReason, onChange }: ToggleRowProps) {
    return (
        <div className="flex items-start justify-between gap-4 py-3 border-b border-neutral-200 dark:border-neutral-800 last:border-b-0">
            <div className="flex-1 min-w-0">
                <div className="font-medium text-neutral-900 dark:text-neutral-100">{label}</div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">{description}</div>
                {disabled && disabledReason && (
                    <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">{disabledReason}</div>
                )}
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                aria-label={label}
                disabled={disabled}
                onClick={() => !disabled && onChange(!checked)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                    disabled
                        ? 'bg-neutral-200 cursor-not-allowed opacity-50'
                        : checked
                          ? 'bg-indigo-600'
                          : 'bg-neutral-300 dark:bg-neutral-700'
                }`}
            >
                <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                        checked ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
            </button>
        </div>
    );
}

export function NotificationPreferencesScreen() {
    const queryClient = useQueryClient();

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: notificationPreferencesKey,
        queryFn: notificationApi.getPreferences,
        staleTime: 30_000,
    });

    const envelope = data as EnvelopeShape | undefined;
    const preference = envelope?.data?.preference;
    const companyMasters = envelope?.data?.companyMasters;

    // Local state for quiet hours time inputs (debounced via blur instead of per-keystroke)
    const [quietStartDraft, setQuietStartDraft] = useState<string | null>(null);
    const [quietEndDraft, setQuietEndDraft] = useState<string | null>(null);

    const updateMutation = useMutation({
        mutationFn: (patch: Partial<NotificationPreferenceData>) => notificationApi.updatePreferences(patch),

        // Optimistic update with full rollback
        onMutate: async (patch) => {
            await queryClient.cancelQueries({ queryKey: notificationPreferencesKey });
            const previous = queryClient.getQueryData<EnvelopeShape>(notificationPreferencesKey);
            if (previous?.data) {
                queryClient.setQueryData<EnvelopeShape>(notificationPreferencesKey, {
                    ...previous,
                    data: {
                        ...previous.data,
                        preference: { ...previous.data.preference, ...patch },
                    },
                });
            }
            return { previous };
        },

        onError: (err, _patch, ctx) => {
            if (ctx?.previous) {
                queryClient.setQueryData(notificationPreferencesKey, ctx.previous);
            }
            showApiError(err);
        },

        onSuccess: (result) => {
            // Server returns the updated preference row (a full Prisma record
            // with id/userId/createdAt/updatedAt). Pick ONLY the known
            // NotificationPreferenceData fields so the cache never holds
            // unexpected shape drift.
            const existing = queryClient.getQueryData<EnvelopeShape>(notificationPreferencesKey);
            if (!existing?.data) return;

            const raw = (result as { data?: Record<string, unknown> } | undefined)?.data;
            if (!raw) return;

            const picked: NotificationPreferenceData = {
                inAppEnabled: Boolean(raw.inAppEnabled),
                pushEnabled: Boolean(raw.pushEnabled),
                emailEnabled: Boolean(raw.emailEnabled),
                smsEnabled: Boolean(raw.smsEnabled),
                whatsappEnabled: Boolean(raw.whatsappEnabled),
                deviceStrategy: (raw.deviceStrategy === 'LATEST_ONLY' ? 'LATEST_ONLY' : 'ALL'),
                quietHoursEnabled: Boolean(raw.quietHoursEnabled),
                quietHoursStart: (raw.quietHoursStart as string | null) ?? null,
                quietHoursEnd: (raw.quietHoursEnd as string | null) ?? null,
            };

            queryClient.setQueryData<EnvelopeShape>(notificationPreferencesKey, {
                ...existing,
                data: { ...existing.data, preference: picked },
            });
        },
    });

    const testMutation = useMutation({
        mutationFn: () => notificationApi.sendTestNotification(),
        onSuccess: () => showSuccess('Test notification sent'),
        onError: (err) => showApiError(err),
    });

    // Single-cell mutation for the category × channel matrix. Optimistic
    // update with rollback on error — matches the main preferences pattern.
    const categoryMutation = useMutation({
        mutationFn: (entry: NotificationCategoryPreference) =>
            notificationApi.updateCategoryPreferences([entry]),
        onMutate: async (entry) => {
            await queryClient.cancelQueries({ queryKey: notificationPreferencesKey });
            const previous = queryClient.getQueryData<EnvelopeShape>(notificationPreferencesKey);
            if (previous?.data) {
                const prefs = previous.data.categoryPreferences ?? [];
                const existingIdx = prefs.findIndex(
                    (p) => p.category === entry.category && p.channel === entry.channel,
                );
                const nextPrefs =
                    existingIdx >= 0
                        ? prefs.map((p, i) => (i === existingIdx ? entry : p))
                        : [...prefs, entry];
                queryClient.setQueryData<EnvelopeShape>(notificationPreferencesKey, {
                    ...previous,
                    data: { ...previous.data, categoryPreferences: nextPrefs },
                });
            }
            return { previous };
        },
        onError: (err, _entry, ctx) => {
            if (ctx?.previous) {
                queryClient.setQueryData(notificationPreferencesKey, ctx.previous);
            }
            showApiError(err);
        },
    });

    /** Look up the current enabled state for a (category, channel) cell. */
    const getCategoryCell = (
        prefs: NotificationCategoryPreference[] | undefined,
        category: string,
        channel: NotificationChannel,
    ): boolean => {
        const entry = prefs?.find((p) => p.category === category && p.channel === channel);
        return entry?.enabled ?? true; // default = enabled when no row exists
    };

    const toggleCategoryCell = (category: string, channel: NotificationChannel, enabled: boolean) => {
        categoryMutation.mutate({ category, channel, enabled });
    };

    const update = (patch: Partial<NotificationPreferenceData>) => {
        updateMutation.mutate(patch);
    };

    if (isError) {
        return (
            <div className="max-w-2xl p-8 text-center">
                <p className="text-red-600 dark:text-red-400 font-medium">Failed to load preferences.</p>
                <button
                    type="button"
                    onClick={() => refetch()}
                    className="mt-4 inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (isLoading || !preference || !companyMasters) {
        return (
            <div className="max-w-3xl p-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-neutral-200 dark:bg-neutral-800 rounded w-1/3" />
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-2/3" />
                    <div className="h-32 bg-neutral-100 dark:bg-neutral-900 rounded-xl" />
                    <div className="h-32 bg-neutral-100 dark:bg-neutral-900 rounded-xl" />
                    <div className="h-32 bg-neutral-100 dark:bg-neutral-900 rounded-xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Notification Preferences</h1>
                <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                    Control how and when you receive notifications. Your company administrator may restrict some channels.
                </p>
            </div>

            {/* Channels */}
            <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Delivery Channels</h2>

                <div className="flex items-start justify-between gap-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
                    <div className="flex-1 min-w-0">
                        <div className="font-medium text-neutral-900 dark:text-neutral-100">In-App Notifications</div>
                        <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                            Bell icon history is always shown — this is the system of record and cannot be disabled.
                        </div>
                    </div>
                    <div className="inline-flex items-center rounded-full bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                        Always on
                    </div>
                </div>
                <ToggleRow
                    label="Push Notifications"
                    description="Lock-screen alerts on your devices (mobile + browser)."
                    checked={preference.pushEnabled}
                    disabled={!companyMasters.push}
                    disabledReason={!companyMasters.push ? 'Disabled by company administrator' : undefined}
                    onChange={(v) => update({ pushEnabled: v })}
                />
                <ToggleRow
                    label="Email Notifications"
                    description="Email alerts for important events."
                    checked={preference.emailEnabled}
                    disabled={!companyMasters.email}
                    disabledReason={!companyMasters.email ? 'Disabled by company administrator' : undefined}
                    onChange={(v) => update({ emailEnabled: v })}
                />
                <ToggleRow
                    label="SMS Notifications"
                    description="Text message alerts (if enabled by your company)."
                    checked={preference.smsEnabled}
                    disabled={!companyMasters.sms}
                    disabledReason={!companyMasters.sms ? 'Disabled by company administrator' : undefined}
                    onChange={(v) => update({ smsEnabled: v })}
                />
                <ToggleRow
                    label="WhatsApp Notifications"
                    description="WhatsApp alerts (if enabled by your company)."
                    checked={preference.whatsappEnabled}
                    disabled={!companyMasters.whatsapp}
                    disabledReason={!companyMasters.whatsapp ? 'Disabled by company administrator' : undefined}
                    onChange={(v) => update({ whatsappEnabled: v })}
                />
            </section>

            {/* Device strategy */}
            <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Device Delivery</h2>
                <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="radio"
                            name="deviceStrategy"
                            checked={preference.deviceStrategy === 'ALL'}
                            onChange={() => update({ deviceStrategy: 'ALL' })}
                            className="w-4 h-4 accent-indigo-600"
                        />
                        <div>
                            <div className="font-medium text-neutral-900 dark:text-neutral-100">All Devices</div>
                            <div className="text-sm text-neutral-500 dark:text-neutral-400">
                                Send to every signed-in device (phone, tablet, browser).
                            </div>
                        </div>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="radio"
                            name="deviceStrategy"
                            checked={preference.deviceStrategy === 'LATEST_ONLY'}
                            onChange={() => update({ deviceStrategy: 'LATEST_ONLY' })}
                            className="w-4 h-4 accent-indigo-600"
                        />
                        <div>
                            <div className="font-medium text-neutral-900 dark:text-neutral-100">Latest Device Only</div>
                            <div className="text-sm text-neutral-500 dark:text-neutral-400">
                                Only the most recently active device receives push notifications.
                            </div>
                        </div>
                    </label>
                </div>
            </section>

            {/* Quiet hours */}
            <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Quiet Hours</h2>
                <ToggleRow
                    label="Enable Quiet Hours"
                    description="Suppress non-critical notifications during the set window. Critical notifications (security, payroll) still arrive."
                    checked={preference.quietHoursEnabled}
                    onChange={(v) => update({ quietHoursEnabled: v })}
                />
                {preference.quietHoursEnabled && (
                    <div className="mt-4 grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                Start
                            </label>
                            <input
                                type="time"
                                value={quietStartDraft ?? preference.quietHoursStart ?? ''}
                                onChange={(e) => setQuietStartDraft(e.target.value)}
                                onBlur={() => {
                                    if (quietStartDraft !== null && quietStartDraft !== preference.quietHoursStart) {
                                        update({ quietHoursStart: quietStartDraft });
                                    }
                                    setQuietStartDraft(null);
                                }}
                                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-neutral-900 dark:text-neutral-100"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                End
                            </label>
                            <input
                                type="time"
                                value={quietEndDraft ?? preference.quietHoursEnd ?? ''}
                                onChange={(e) => setQuietEndDraft(e.target.value)}
                                onBlur={() => {
                                    if (quietEndDraft !== null && quietEndDraft !== preference.quietHoursEnd) {
                                        update({ quietHoursEnd: quietEndDraft });
                                    }
                                    setQuietEndDraft(null);
                                }}
                                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-neutral-900 dark:text-neutral-100"
                            />
                        </div>
                    </div>
                )}
            </section>

            {/* Fine-tune by category */}
            <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                    Fine-tune by category
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                    Mute individual notification categories per channel. Locked categories (security alerts) cannot be disabled.
                </p>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-neutral-200 dark:border-neutral-800">
                                <th className="text-left py-2 pr-4 font-medium text-neutral-700 dark:text-neutral-300">
                                    Category
                                </th>
                                {CATEGORY_MATRIX_CHANNELS.map((c) => (
                                    <th
                                        key={c.key}
                                        className="text-center py-2 px-2 font-medium text-neutral-700 dark:text-neutral-300"
                                    >
                                        {c.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {(envelope?.data?.categoryCatalogue ?? []).map((cat) => (
                                <tr
                                    key={cat.code}
                                    className="border-b border-neutral-100 dark:border-neutral-800 last:border-b-0"
                                >
                                    <td className="py-3 pr-4">
                                        <div className="flex items-center gap-2">
                                            {cat.locked && (
                                                <Lock
                                                    size={14}
                                                    className="text-amber-500 shrink-0"
                                                    aria-label="Locked — cannot be disabled"
                                                />
                                            )}
                                            <div className="min-w-0">
                                                <div
                                                    className={`font-medium ${
                                                        cat.locked
                                                            ? 'text-neutral-400 dark:text-neutral-500'
                                                            : 'text-neutral-900 dark:text-neutral-100'
                                                    }`}
                                                >
                                                    {cat.label}
                                                </div>
                                                <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                                    {cat.description}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    {CATEGORY_MATRIX_CHANNELS.map((c) => {
                                        const checked = getCategoryCell(
                                            envelope?.data?.categoryPreferences,
                                            cat.code,
                                            c.key,
                                        );
                                        const disabled = !!cat.locked;
                                        return (
                                            <td key={c.key} className="py-3 px-2 text-center">
                                                <button
                                                    type="button"
                                                    role="switch"
                                                    aria-checked={checked}
                                                    aria-label={`${cat.label} ${c.label}`}
                                                    disabled={disabled}
                                                    onClick={() =>
                                                        !disabled && toggleCategoryCell(cat.code, c.key, !checked)
                                                    }
                                                    className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                                                        disabled
                                                            ? 'bg-neutral-200 dark:bg-neutral-700 cursor-not-allowed opacity-50'
                                                            : checked
                                                              ? 'bg-indigo-600 cursor-pointer'
                                                              : 'bg-neutral-300 dark:bg-neutral-700 cursor-pointer'
                                                    }`}
                                                >
                                                    <span
                                                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                                                            checked ? 'translate-x-4' : 'translate-x-0'
                                                        }`}
                                                    />
                                                </button>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Test notification */}
            <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Test Notification</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                    Send a test notification to yourself to verify delivery through your enabled channels.
                </p>
                <button
                    type="button"
                    onClick={() => testMutation.mutate()}
                    disabled={testMutation.isPending}
                    className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 disabled:opacity-50"
                >
                    {testMutation.isPending ? 'Sending…' : 'Send Test Notification'}
                </button>
            </section>
        </div>
    );
}

export default NotificationPreferencesScreen;
