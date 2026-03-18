// Step 14 — IOT Reasons (Machine Downtime & Idle Reasons)
import React from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    SectionCard, FormInput, FormSelect, FormTextarea, ToggleRow,
    ChipSelector, AddButton, ItemCard, TwoCol, InfoBanner
} from '../atoms';
import { IOT_REASON_TYPES } from '../constants';
import { useTenantOnboardingStore } from '../store';

const DEPARTMENTS = [
    'Production', 'Maintenance', 'Quality', 'Stores', 'Admin',
    'HR', 'Finance', 'IT', 'Engineering', 'All',
];

const iotReasonSchema = z.object({
    id: z.string(),
    reasonType: z.string().min(1, 'Required'),
    department: z.string().optional(),
    reason: z.string().min(1, 'Required'),
    description: z.string().optional(),
    duration: z.string().optional(),
    planned: z.boolean().optional(),
});

const schema = z.object({
    reasons: z.array(iotReasonSchema),
});

type FormData = z.infer<typeof schema>;

export function Step14IOTReasons() {
    const { step13, setStep13, goNext } = useTenantOnboardingStore();

    const { control, handleSubmit, watch } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            reasons: step13.reasons,
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'reasons',
    });

    const watchedReasons = watch('reasons');
    const idle = watchedReasons.filter((r) => r.reasonType === 'Machine Idle');
    const alarm = watchedReasons.filter((r) => r.reasonType === 'Machine Alarm');

    const onSubmit = (data: FormData) => {
        // Sanitize data (ensure no undefined values)
        const sanitizedData = {
            reasons: data.reasons.map(r => ({
                id: r.id,
                reasonType: r.reasonType,
                reason: r.reason,
                department: r.department || '',
                description: r.description || '',
                duration: r.duration || '',
                planned: !!r.planned,
            }))
        };
        setStep13(sanitizedData);
        goNext();
        document.getElementById('wizard-content')?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <form id="wizard-step-form" onSubmit={handleSubmit(onSubmit)} className="space-y-0 animate-in fade-in slide-in-from-right-3 duration-300 pb-10">

            <InfoBanner variant="info" className="mb-5">
                <strong>IOT Reason Configuration</strong> — Machine Idle and Alarm reasons are used by the Andon
                system to classify production downtime. These appear in OEE dashboards, NC reports, and shift handover
                summaries. Planned downtimes (e.g. scheduled maintenance) are excluded from OEE Availability loss calculations.
            </InfoBanner>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="bg-warning-50 border border-warning-200 rounded-2xl px-5 py-4 dark:bg-warning-900/20 dark:border-warning-800/50">
                    <p className="text-2xl font-bold text-warning-700 dark:text-warning-400">{idle.length}</p>
                    <p className="text-sm font-semibold text-warning-800 dark:text-warning-400">Machine Idle Reasons</p>
                    <p className="text-xs text-warning-600 mt-1">Material shortage, changeover, operator absence...</p>
                </div>
                <div className="bg-danger-50 border border-danger-200 rounded-2xl px-5 py-4 dark:bg-danger-900/20 dark:border-danger-800/50">
                    <p className="text-2xl font-bold text-danger-700 dark:text-danger-400">{alarm.length}</p>
                    <p className="text-sm font-semibold text-danger-800 dark:text-danger-400">Machine Alarm Reasons</p>
                    <p className="text-xs text-danger-600 mt-1">Breakdown, hydraulic failure, spindle error...</p>
                </div>
            </div>

            <SectionCard title="IOT Reason List" subtitle="Add all reasons that operators will use to classify machine downtime on the shop floor">
                {fields.length === 0 ? (
                    <div className="bg-neutral-50 border border-dashed border-neutral-200 rounded-xl py-10 text-center mb-4 dark:bg-neutral-800 dark:border-neutral-700">
                        <p className="text-2xl mb-3">📡</p>
                        <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">No IOT reasons defined</p>
                        <p className="text-xs text-neutral-400 mt-1 dark:text-neutral-500">
                            Add reasons for machine idle time and alarms. Operators select these during downtime logging.
                        </p>
                    </div>
                ) : (
                    fields.map((field, idx) => (
                        <Controller
                            key={field.id}
                            name={`reasons.${idx}`}
                            control={control}
                            render={({ field: controllerField, formState }) => {
                                const r = controllerField.value;
                                const errors = formState.errors.reasons?.[idx];

                                return (
                                    <ItemCard
                                        title={r.reason || `Reason ${idx + 1}`}
                                        subtitle={[r.reasonType, r.department].filter(Boolean).join(' · ')}
                                        badge={r.reasonType === 'Machine Idle' ? '⚡ Idle' : '🚨 Alarm'}
                                        badgeVariant={r.reasonType === 'Machine Idle' ? 'warning' : 'info'}
                                        defaultOpen={idx === 0}
                                    >
                                        <div className="space-y-4">
                                            <TwoCol>
                                                <Controller name={`reasons.${idx}.reasonType`} control={control} render={({ field: subField }) => (
                                                    <ChipSelector
                                                        label="Reason Type"
                                                        options={IOT_REASON_TYPES}
                                                        selected={subField.value || ''}
                                                        onSelect={subField.onChange}
                                                        required
                                                    />
                                                )} />
                                                <Controller name={`reasons.${idx}.department`} control={control} render={({ field: subField }) => (
                                                    <FormSelect label="Department" {...subField} value={subField.value || ''} options={DEPARTMENTS} />
                                                )} />
                                            </TwoCol>

                                            <Controller name={`reasons.${idx}.reason`} control={control} render={({ field: subField }) => (
                                                <FormInput label="Reason (Short Label)" placeholder="e.g. Tool Breakage, Power Failure, Raw Material Shortage" {...subField} value={subField.value || ''} required hint="This label appears in the Andon board, reports, and OEE Dashboard" error={errors?.reason?.message} />
                                            )} />

                                            <Controller name={`reasons.${idx}.description`} control={control} render={({ field: subField }) => (
                                                <FormTextarea label="Description" placeholder="Optional detailed description of when this reason applies..." {...subField} value={subField.value || ''} rows={2} error={errors?.description?.message} />
                                            )} />

                                            <TwoCol>
                                                <Controller name={`reasons.${idx}.duration`} control={control} render={({ field: subField }) => (
                                                    <FormInput label="Threshold Duration (min)" placeholder="15" type="number" {...subField} value={subField.value || ''} hint="Minimum downtime duration before this reason must be logged" error={errors?.duration?.message} />
                                                )} />
                                                <div className="flex items-center pt-5">
                                                    <Controller name={`reasons.${idx}.planned`} control={control} render={({ field: subField }) => (
                                                        <ToggleRow label="Planned Downtime" subtitle="Planned losses don't count against OEE Availability" value={!!subField.value} onToggle={subField.onChange} />
                                                    )} />
                                                </div>
                                            </TwoCol>

                                            <button
                                                type="button"
                                                onClick={() => remove(idx)}
                                                className="text-xs font-semibold text-danger-500 hover:text-danger-700 transition-colors dark:text-danger-400"
                                            >
                                                🗑 Remove this reason
                                            </button>
                                        </div>
                                    </ItemCard>
                                );
                            }}
                        />
                    ))
                )}

                <AddButton label="Add IOT Reason" onClick={() => append({
                    id: Date.now().toString(),
                    reasonType: 'Machine Idle',
                    department: 'Production',
                    reason: '',
                    description: '',
                    duration: '0',
                    planned: false,
                })} />
            </SectionCard>

            {/* Quick populate reference */}
            <SectionCard title="Common Reasons Reference" subtitle="Typical IOT reasons for manufacturing companies — add as needed" accent="info">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs font-bold text-warning-600 mb-2">⚡ Common Idle Reasons</p>
                        <div className="space-y-1">
                            {[
                                'Material Shortage', 'Changeover', 'Operator Absence',
                                'Quality Hold', 'Tool Change', 'Scheduled Break',
                                'Power Fluctuation', 'No Job Order',
                            ].map((s) => (
                                <p key={s} className="text-xs text-neutral-600 bg-warning-50 rounded-lg px-3 py-1.5 border border-warning-100 dark:text-neutral-300 dark:bg-warning-900/20">
                                    • {s}
                                </p>
                            ))}
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-danger-600 mb-2">🚨 Common Alarm Reasons</p>
                        <div className="space-y-1">
                            {[
                                'Machine Breakdown', 'Hydraulic Failure', 'Spindle Error',
                                'Coolant System Fault', 'Electrical Fault', 'Servo Alarm',
                                'Chuck Pressure Low', 'Emergency Stop Triggered',
                            ].map((s) => (
                                <p key={s} className="text-xs text-neutral-600 bg-danger-50 rounded-lg px-3 py-1.5 border border-danger-100 dark:text-neutral-300 dark:bg-danger-900/20 dark:border-danger-800/50">
                                    • {s}
                                </p>
                            ))}
                        </div>
                    </div>
                </div>
            </SectionCard>
        </form>
    );
}
