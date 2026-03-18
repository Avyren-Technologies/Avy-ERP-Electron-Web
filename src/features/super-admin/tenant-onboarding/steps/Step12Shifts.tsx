// Step 12 — Shifts & Time
import React from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import {
    SectionCard, FormInput, FormSelect, ToggleRow,
    AddButton, ItemCard, TwoCol, SectionDivider, InfoBanner
} from '../atoms';
import { DOWNTIME_TYPES } from '../constants';
import { useTenantOnboardingStore } from '../store';

const downtimeSlotSchema = z.object({
    id: z.string(),
    type: z.string(),
    duration: z.string(),
});

const shiftSchema = z.object({
    id: z.string(),
    name: z.string().min(1, 'Required'),
    fromTime: z.string().min(1, 'Required'),
    toTime: z.string().min(1, 'Required'),
    noShuffle: z.boolean().optional(),
    downtimeSlots: z.array(downtimeSlotSchema),
});

const schema = z.object({
    dayStartTime: z.string().min(1, 'Required'),
    dayEndTime: z.string().min(1, 'Required'),
    totalShiftsPerDay: z.string().optional(),
    shifts: z.array(shiftSchema),
});

type FormData = z.infer<typeof schema>;

// ---- Main Step ----

export function Step12Shifts() {
    const { step11, setStep11, goNext } = useTenantOnboardingStore();

    const { control, handleSubmit, watch, setValue, formState } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            dayStartTime: step11.dayStartTime || '00:00',
            dayEndTime: step11.dayEndTime || '23:59',
            totalShiftsPerDay: '',
            shifts: step11.shifts,
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'shifts',
    });

    const onSubmit = (data: FormData) => {
        // Sanitize data (ensure no undefined booleans)
        const sanitizedData = {
            dayStartTime: data.dayStartTime,
            dayEndTime: data.dayEndTime,
            weeklyOffs: (step11 as any).weeklyOffs || [],
            shifts: data.shifts.map(sh => ({
                ...sh,
                noShuffle: !!sh.noShuffle
            }))
        };
        setStep11(sanitizedData);
        goNext();
        document.getElementById('wizard-content')?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <form id="wizard-step-form" onSubmit={handleSubmit(onSubmit)} className="space-y-0 animate-in fade-in slide-in-from-right-3 duration-300 pb-10">

            {/* Working Hours Config */}
            <SectionCard title="Operational Day Window" subtitle="The outer boundary within which all shifts must fall">
                <InfoBanner variant="info">
                    The Operational Day Window defines the start and end of the entire working day. Individual shifts
                    must fall within this window. This is used for OEE calculation and production planning.
                </InfoBanner>
                <TwoCol>
                    <Controller name="dayStartTime" control={control} render={({ field, fieldState }) => (
                        <FormInput label="Day Start Time" type="time" required hint="Earliest any shift can begin" {...field} value={field.value || ''} error={fieldState.error?.message} />
                    )} />
                    <Controller name="dayEndTime" control={control} render={({ field, fieldState }) => (
                        <FormInput label="Day End Time" type="time" required hint="Latest any shift can end (may cross midnight)" {...field} value={field.value || ''} error={fieldState.error?.message} />
                    )} />
                </TwoCol>

                <Controller name="totalShiftsPerDay" control={control} render={({ field }) => (
                    <div className="space-y-1.5">
                        <FormSelect
                            label="Total Shifts Per Day"
                            value={field.value || ''}
                            onChange={(v) => {
                                field.onChange(v);
                                // Auto-generate shifts when we have valid day times and shift count
                                const startTime = watch('dayStartTime');
                                const endTime = watch('dayEndTime');
                                const count = parseInt(v);
                                if (!startTime || !endTime || !count || count < 1) return;

                                // Calculate shift windows
                                const parseTime = (t: string) => {
                                    const [h, m] = t.split(':').map(Number);
                                    return h * 60 + m;
                                };
                                const startMin = parseTime(startTime);
                                let endMin = parseTime(endTime);
                                if (endMin <= startMin) endMin += 24 * 60; // crosses midnight
                                const shiftDuration = Math.floor((endMin - startMin) / count);

                                const formatTime = (minutes: number) => {
                                    const normalised = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
                                    return `${String(Math.floor(normalised / 60)).padStart(2, '0')}:${String(normalised % 60).padStart(2, '0')}`;
                                };

                                const shiftNames = ['Morning Shift', 'Afternoon Shift', 'Night Shift', 'Shift 4', 'Shift 5'];
                                const autoShifts = Array.from({ length: count }, (_, i) => ({
                                    id: Date.now().toString() + i,
                                    name: shiftNames[i] || `Shift ${i + 1}`,
                                    fromTime: formatTime(startMin + i * shiftDuration),
                                    toTime: formatTime(startMin + (i + 1) * shiftDuration),
                                    noShuffle: false,
                                    downtimeSlots: [],
                                }));
                                // Only replace if shifts is empty or all empty-named shifts
                                const currentShifts = watch('shifts');
                                if (!currentShifts || currentShifts.length === 0 || currentShifts.every((s: any) => !s.name)) {
                                    setValue('shifts', autoShifts);
                                }
                            }}
                            options={['1 Shift', '2 Shifts', '3 Shifts', '4 Shifts', '5 Shifts']}
                            hint="Auto-configures shifts within the operational day window. You can adjust after generation."
                        />
                    </div>
                )} />
            </SectionCard>

            {/* Shift Master */}
            <SectionCard title="Shift Master" subtitle="Define all working shifts. Each shift can have its own downtime slots.">
                {fields.length === 0 && (
                    <div className="bg-neutral-50 border border-dashed border-neutral-200 rounded-xl px-5 py-8 text-center mb-4 dark:bg-neutral-800 dark:border-neutral-700">
                        <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">No shifts defined</p>
                        <p className="text-xs text-neutral-400 mt-1 dark:text-neutral-500">Add your first shift below (e.g. Morning, Evening, Night)</p>
                    </div>
                )}

                {fields.map((field, idx) => {
                    const shift = watch(`shifts.${idx}`);
                    const shiftErrors = formState.errors.shifts?.[idx];
                    const downtimeSlots = shift?.downtimeSlots || [];

                    const addDowntime = () => {
                        setValue(`shifts.${idx}.downtimeSlots`, [
                            ...downtimeSlots,
                            { id: Date.now().toString(), type: 'Lunch Break', duration: '30' }
                        ], { shouldDirty: true });
                    };

                    const removeSlot = (slotId: string) => {
                        setValue(`shifts.${idx}.downtimeSlots`,
                            downtimeSlots.filter((s: any) => s.id !== slotId),
                            { shouldDirty: true }
                        );
                    };

                    return (
                        <ItemCard
                            key={field.id}
                            title={shift?.name || `Shift ${idx + 1}`}
                            subtitle={shift?.fromTime && shift?.toTime ? `${shift.fromTime} – ${shift.toTime}` : 'Time not set'}
                            badge={`Shift ${idx + 1}`}
                            defaultOpen={idx === 0}
                        >
                            <div className="space-y-4">
                                <TwoCol>
                                    <Controller name={`shifts.${idx}.name`} control={control} render={({ field: subField }) => (
                                        <FormInput label="Shift Name" placeholder="e.g. Morning Shift, Night Shift" {...subField} value={subField.value || ''} required error={shiftErrors?.name?.message} />
                                    )} />
                                    <div /> {/* spacer */}
                                </TwoCol>

                                <TwoCol>
                                    <Controller name={`shifts.${idx}.fromTime`} control={control} render={({ field: subField }) => (
                                        <FormInput label="From Time" type="time" required hint="Shift start time" {...subField} value={subField.value || ''} error={shiftErrors?.fromTime?.message} />
                                    )} />
                                    <Controller name={`shifts.${idx}.toTime`} control={control} render={({ field: subField }) => (
                                        <FormInput label="To Time" type="time" required hint="Shift end time" {...subField} value={subField.value || ''} error={shiftErrors?.toTime?.message} />
                                    )} />
                                </TwoCol>

                                <Controller name={`shifts.${idx}.noShuffle`} control={control} render={({ field: subField }) => (
                                    <ToggleRow label="No Shuffle" subtitle="Prevent this shift from being rotated in multi-shift scheduling" value={!!subField.value} onToggle={subField.onChange} />
                                )} />

                                <SectionDivider label="Planned Downtime Slots" />

                                {downtimeSlots.length > 0 ? (
                                    <div className="space-y-2">
                                        {downtimeSlots.map((slot: any, slotIdx: number) => (
                                            <div key={slot.id} className="flex items-center gap-3 bg-neutral-50 rounded-xl px-4 py-3 border border-neutral-100 dark:bg-neutral-800 dark:border-neutral-800">
                                                <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-3">
                                                    <Controller name={`shifts.${idx}.downtimeSlots.${slotIdx}.type`} control={control} render={({ field: slotTypeField }) => (
                                                        <FormSelect label="Type" {...slotTypeField} value={slotTypeField.value || ''} options={DOWNTIME_TYPES} />
                                                    )} />
                                                    <Controller name={`shifts.${idx}.downtimeSlots.${slotIdx}.duration`} control={control} render={({ field: slotDurField }) => (
                                                        <FormInput label="Duration (min)" placeholder="30" type="number" {...slotDurField} value={slotDurField.value || ''} />
                                                    )} />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeSlot(slot.id)}
                                                    className="flex-shrink-0 mt-5 w-8 h-8 flex items-center justify-center rounded-lg text-danger-500 hover:bg-danger-50 dark:bg-danger-900/20 hover:text-danger-600 transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-neutral-400 dark:text-neutral-500">
                                        No downtime slots defined. Add breaks like Lunch, Tea Break, Changeover.
                                    </p>
                                )}

                                <button
                                    type="button"
                                    onClick={addDowntime}
                                    className="flex items-center gap-2 text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 transition-colors"
                                >
                                    <Plus size={13} strokeWidth={2.5} />
                                    Add Downtime Slot
                                </button>

                                <div className="pt-2">
                                    <button
                                        type="button"
                                        onClick={() => remove(idx)}
                                        className="flex items-center gap-1.5 text-xs font-semibold text-danger-500 hover:text-danger-700 dark:text-danger-400 transition-colors"
                                    >
                                        <Trash2 size={13} />
                                        Remove This Shift
                                    </button>
                                </div>
                            </div>
                        </ItemCard>
                    );
                })}

                <AddButton label="Add Shift" onClick={() => append({
                    id: Date.now().toString(),
                    name: '',
                    fromTime: '',
                    toTime: '',
                    noShuffle: false,
                    downtimeSlots: []
                })} />
            </SectionCard>
        </form>
    );
}
