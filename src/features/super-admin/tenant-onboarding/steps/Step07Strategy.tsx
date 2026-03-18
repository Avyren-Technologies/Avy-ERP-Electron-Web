// Step 07 — Configuration Strategy
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, Layers, DollarSign, AlertTriangle } from 'lucide-react';
import { SectionCard, RadioOption, ToggleRow } from '../atoms';
import { useTenantOnboardingStore } from '../store';

const schema = z.object({
    multiLocationMode: z.boolean(),
    locationConfig: z.enum(['common', 'per-location']),
});

type FormData = z.infer<typeof schema>;

export function Step07Strategy({ onConfirmSubmit }: { onConfirmSubmit?: () => void }) {
    const { strategyConfig, setStrategyConfig, goNext } = useTenantOnboardingStore();

    const { control, handleSubmit, watch } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            multiLocationMode: strategyConfig.multiLocationMode,
            locationConfig: strategyConfig.locationConfig,
        },
    });

    const multiLocationMode = watch('multiLocationMode');

    const onSubmit = (data: FormData) => {
        setStrategyConfig({ ...data, billingScope: 'per-location' });
        goNext();
        document.getElementById('wizard-content')?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <form id="wizard-step-form" onSubmit={handleSubmit(onSubmit)} className="space-y-0 animate-in fade-in slide-in-from-right-3 duration-300 pb-10">

            {/* Billing scope info banner */}
            <div className="bg-primary-50 border border-primary-200 rounded-2xl px-5 py-4 mb-1 dark:bg-primary-900/20 dark:border-primary-800/50">
                <div className="flex items-start gap-3">
                    <DollarSign size={16} className="text-primary-600 flex-shrink-0 mt-0.5 dark:text-primary-400" />
                    <div>
                        <p className="text-sm font-bold text-primary-800 dark:text-primary-300">Per-Location Billing</p>
                        <p className="text-xs text-primary-700 dark:text-primary-400 mt-0.5 leading-relaxed">
                            Module selection and user tier pricing are applied <strong>per location</strong>.
                            Each billable location is subscribed independently — totals are aggregated for billing.
                        </p>
                    </div>
                </div>
            </div>

            <SectionCard title="Location Mode" subtitle="Does this company operate from a single site or multiple locations?">
                <Controller name="multiLocationMode" control={control} render={({ field }) => (
                    <ToggleRow
                        label="Multi-Location Mode"
                        subtitle="Enable if the company operates from multiple plants, branches, or office locations"
                        value={field.value}
                        onToggle={field.onChange}
                    />
                )} />

                {!multiLocationMode && (
                    <div className="mt-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-neutral-400" />
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                Single-location mode: one HQ location will be created in the next step. All operational configurations (shifts, no-series, IOT) will apply to that location.
                            </p>
                        </div>
                    </div>
                )}
            </SectionCard>

            {multiLocationMode && (
                <SectionCard title="Operational Configuration Mode" subtitle="How should shifts, number series, and IOT reasons be managed across locations?">
                    <Controller name="locationConfig" control={control} render={({ field }) => (
                        <>
                            <RadioOption
                                label="Common Configuration"
                                subtitle="All locations share the same shift schedules, No. Series, and IOT Reason lists. Easiest to manage."
                                selected={field.value === 'common'}
                                onSelect={() => field.onChange('common')}
                                badge={field.value === 'common' ? 'SELECTED' : undefined}
                            />
                            <RadioOption
                                label="Per-Location Configuration"
                                subtitle="Each location has its own independent shift schedules, serial number tracking, and IOT configurations."
                                selected={field.value === 'per-location'}
                                onSelect={() => field.onChange('per-location')}
                            />
                        </>
                    )} />

                    <div className="mt-3 bg-warning-50 border border-warning-200 rounded-xl px-4 py-3 dark:bg-warning-900/20 dark:border-warning-800/50">
                        <div className="flex items-start gap-2">
                            <AlertTriangle size={14} className="text-warning-600 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-warning-700 dark:text-warning-400 leading-relaxed">
                                <strong>Downstream impact:</strong> This choice affects how Shifts, No. Series, and IOT steps are configured.
                                Switching after setting up those steps will require re-configuration.
                            </p>
                        </div>
                    </div>
                </SectionCard>
            )}

            <SectionCard title="Billing Scope" subtitle="Commercial billing model for this tenant">
                <div className="flex items-start gap-3 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800/50 rounded-xl px-4 py-3">
                    <Layers size={16} className="text-success-600 dark:text-success-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-success-800 dark:text-success-300">Per-Location Billing Enabled</p>
                        <p className="text-xs text-success-700 dark:text-success-400 mt-0.5 leading-relaxed">
                            Modules and user tier are subscribed independently for each location.
                            Billing totals are the sum of all active location subscriptions.
                            Annual billing applies a discount per location.
                        </p>
                    </div>
                </div>
            </SectionCard>
        </form>
    );
}
