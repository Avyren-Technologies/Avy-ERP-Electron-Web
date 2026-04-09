import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi, type NotificationPreferenceData, type NotificationPreferencesResponse } from '@/lib/api/notifications';
import { showSuccess, showApiError } from '@/lib/toast';

const PREF_KEY = ['notifications', 'preferences'] as const;

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

    const { data, isLoading } = useQuery({
        queryKey: PREF_KEY,
        queryFn: notificationApi.getPreferences,
        staleTime: 30_000,
    });

    const [pref, setPref] = useState<NotificationPreferenceData | null>(null);

    const updateMutation = useMutation({
        mutationFn: (data: Partial<NotificationPreferenceData>) => notificationApi.updatePreferences(data),
        onSuccess: () => {
            showSuccess('Preferences updated');
            queryClient.invalidateQueries({ queryKey: PREF_KEY });
        },
        onError: (err) => showApiError(err),
    });

    const testMutation = useMutation({
        mutationFn: () => notificationApi.sendTestNotification(),
        onSuccess: () => showSuccess('Test notification sent'),
        onError: (err) => showApiError(err),
    });

    useEffect(() => {
        const envelope = data as { data?: NotificationPreferencesResponse } | undefined;
        if (envelope?.data?.preference) setPref(envelope.data.preference);
    }, [data]);

    const envelope = data as { data?: NotificationPreferencesResponse } | undefined;
    const companyMasters = envelope?.data?.companyMasters;

    const update = (patch: Partial<NotificationPreferenceData>) => {
        if (!pref) return;
        const next = { ...pref, ...patch };
        setPref(next);
        updateMutation.mutate(patch);
    };

    if (isLoading || !pref || !companyMasters) {
        return (
            <div className="p-8">
                <div className="animate-pulse space-y-3">
                    <div className="h-8 bg-neutral-200 dark:bg-neutral-800 rounded w-1/3" />
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-2/3" />
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

                <ToggleRow
                    label="In-App Notifications"
                    description="Bell icon history is always shown regardless of this toggle."
                    checked={pref.inAppEnabled}
                    disabled={true}
                    disabledReason="Always enabled — in-app is the system of record."
                    onChange={() => {}}
                />
                <ToggleRow
                    label="Push Notifications"
                    description="Lock-screen alerts on your devices (mobile + browser)."
                    checked={pref.pushEnabled}
                    disabled={!companyMasters.push}
                    disabledReason={!companyMasters.push ? 'Disabled by company administrator' : undefined}
                    onChange={(v) => update({ pushEnabled: v })}
                />
                <ToggleRow
                    label="Email Notifications"
                    description="Email alerts for important events."
                    checked={pref.emailEnabled}
                    disabled={!companyMasters.email}
                    disabledReason={!companyMasters.email ? 'Disabled by company administrator' : undefined}
                    onChange={(v) => update({ emailEnabled: v })}
                />
                <ToggleRow
                    label="SMS Notifications"
                    description="Text message alerts (if enabled by your company)."
                    checked={pref.smsEnabled}
                    disabled={!companyMasters.sms}
                    disabledReason={!companyMasters.sms ? 'Disabled by company administrator' : undefined}
                    onChange={(v) => update({ smsEnabled: v })}
                />
                <ToggleRow
                    label="WhatsApp Notifications"
                    description="WhatsApp alerts (if enabled by your company)."
                    checked={pref.whatsappEnabled}
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
                            checked={pref.deviceStrategy === 'ALL'}
                            onChange={() => update({ deviceStrategy: 'ALL' })}
                            className="w-4 h-4 text-indigo-600"
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
                            checked={pref.deviceStrategy === 'LATEST_ONLY'}
                            onChange={() => update({ deviceStrategy: 'LATEST_ONLY' })}
                            className="w-4 h-4 text-indigo-600"
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
                    checked={pref.quietHoursEnabled}
                    onChange={(v) => update({ quietHoursEnabled: v })}
                />
                {pref.quietHoursEnabled && (
                    <div className="mt-4 grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                Start
                            </label>
                            <input
                                type="time"
                                value={pref.quietHoursStart ?? ''}
                                onChange={(e) => update({ quietHoursStart: e.target.value })}
                                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-neutral-900 dark:text-neutral-100"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                End
                            </label>
                            <input
                                type="time"
                                value={pref.quietHoursEnd ?? ''}
                                onChange={(e) => update({ quietHoursEnd: e.target.value })}
                                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-neutral-900 dark:text-neutral-100"
                            />
                        </div>
                    </div>
                )}
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
