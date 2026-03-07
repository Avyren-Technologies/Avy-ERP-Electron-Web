// Step 04 — Fiscal & Calendar
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import {
    SectionCard, FormSelect, ChipSelector, RadioOption, TwoCol, ThreeCol, InfoBanner, SectionDivider
} from '../atoms';
import {
    FY_OPTIONS, MONTHS, PAYROLL_FREQ, CUTOFF_DAYS,
    DISBURSEMENT_DAYS, WEEK_STARTS, TIMEZONES, DAYS_OF_WEEK
} from '../constants';
import { useTenantOnboardingStore } from '../store';

const schema = z.object({
    fyType: z.string().min(1, 'Required'),
    fyCustomStartMonth: z.string().optional(),
    fyCustomEndMonth: z.string().optional(),
    payrollFreq: z.string().min(1, 'Required'),
    cutoffDay: z.string().optional(),
    disbursementDay: z.string().optional(),
    weekStart: z.string().min(1, 'Required'),
    timezone: z.string().min(1, 'Required'),
}).superRefine((data, ctx) => {
    if (data.fyType === 'custom') {
        if (!data.fyCustomStartMonth) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['fyCustomStartMonth'], message: 'Required' });
        if (!data.fyCustomEndMonth) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['fyCustomEndMonth'], message: 'Required' });
    }
});

type FormData = z.infer<typeof schema>;

export function Step04Fiscal() {
    const { step4, setStep4, toggleWorkingDay, goNext } = useTenantOnboardingStore();

    const { control, handleSubmit, watch } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            fyType: step4.fyType || 'apr-mar',
            fyCustomStartMonth: step4.fyCustomStartMonth,
            fyCustomEndMonth: step4.fyCustomEndMonth,
            payrollFreq: step4.payrollFreq || 'Monthly',
            cutoffDay: step4.cutoffDay,
            disbursementDay: step4.disbursementDay,
            weekStart: step4.weekStart || 'Monday',
            timezone: step4.timezone || 'IST UTC+5:30',
        }
    });

    const fyType = watch('fyType');

    const onSubmit = (data: FormData) => {
        // Validation for working days (since it's an array toggled directly in store, we check here)
        if (step4.workingDays.length === 0) {
            // Cannot proceed if no working days
            // We can just return or show an error. The UI already shows the error visually below.
            return;
        }

        setStep4(data);
        goNext();
        document.getElementById('wizard-content')?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <form id="wizard-step-form" onSubmit={handleSubmit(onSubmit)} className="space-y-0 animate-in fade-in slide-in-from-right-3 duration-300 pb-10">

            {/* Financial Year */}
            <SectionCard title="Financial Year Period" subtitle="Controls fiscal reporting, P&L, balance sheet, and budget cycles">
                <Controller name="fyType" control={control} render={({ field }) => (
                    <div className="space-y-3">
                        {FY_OPTIONS.map((fy) => (
                            <RadioOption
                                key={fy.key}
                                label={fy.label}
                                subtitle={fy.subtitle}
                                selected={field.value === fy.key}
                                onSelect={() => field.onChange(fy.key)}
                                badge={fy.key === 'apr-mar' ? 'INDIA DEFAULT' : undefined}
                            />
                        ))}
                    </div>
                )} />

                {fyType === 'custom' && (
                    <div className="mt-4 space-y-3 animate-in fade-in duration-200">
                        <InfoBanner variant="info">
                            Define your custom financial year start and end months below.
                        </InfoBanner>
                        <TwoCol>
                            <Controller name="fyCustomStartMonth" control={control} render={({ field, fieldState }) => (
                                <FormSelect label="FY Start Month" options={MONTHS.map((m) => ({ value: m.key, label: m.label }))} placeholder="Select start month" {...field} value={field.value || ''} required error={fieldState.error?.message} />
                            )} />
                            <Controller name="fyCustomEndMonth" control={control} render={({ field, fieldState }) => (
                                <FormSelect label="FY End Month" options={MONTHS.map((m) => ({ value: m.key, label: m.label }))} placeholder="Select end month" {...field} value={field.value || ''} required error={fieldState.error?.message} />
                            )} />
                        </TwoCol>
                    </div>
                )}
            </SectionCard>

            {/* Payroll Cycle */}
            <SectionCard title="Payroll Cycle" subtitle="Controls when salaries are computed, locked, and disbursed">
                <Controller name="payrollFreq" control={control} render={({ field, fieldState }) => (
                    <ChipSelector label="Payroll Frequency" options={PAYROLL_FREQ} selected={field.value} onSelect={field.onChange} required hint={fieldState.error?.message} />
                )} />
                <TwoCol>
                    <Controller name="cutoffDay" control={control} render={({ field }) => (
                        <ChipSelector label="Salary Cutoff Day" options={CUTOFF_DAYS} selected={field.value || ''} onSelect={field.onChange} hint="Attendance data is locked after this day for payroll processing" />
                    )} />
                    <Controller name="disbursementDay" control={control} render={({ field }) => (
                        <ChipSelector label="Disbursement Day" options={DISBURSEMENT_DAYS} selected={field.value || ''} onSelect={field.onChange} hint="Day when salary is transferred to employee bank accounts" />
                    )} />
                </TwoCol>
            </SectionCard>

            {/* Calendar & Timezone */}
            <SectionCard title="Calendar & Timezone" subtitle="Controls scheduling, shift allocation, and time-based operations">
                <ThreeCol>
                    <Controller name="weekStart" control={control} render={({ field }) => (
                        <ChipSelector label="Week Starts On" options={WEEK_STARTS} selected={field.value} onSelect={field.onChange} />
                    )} />
                    <Controller name="timezone" control={control} render={({ field, fieldState }) => (
                        <FormSelect label="Timezone" options={TIMEZONES} {...field} value={field.value || ''} hint="Used for all timestamp calculations and reports" error={fieldState.error?.message} />
                    )} />
                    <div />
                </ThreeCol>

                <SectionDivider label="Working Days" />

                <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-primary-900 dark:text-white">Working Days</label>
                    <p className="text-xs text-neutral-500 mb-3 dark:text-neutral-400">
                        Select the standard working days for this company. Weekend overrides are handled per-shift.
                    </p>
                    <div className="grid grid-cols-7 gap-2">
                        {DAYS_OF_WEEK.map((day) => {
                            const selected = step4.workingDays.includes(day);
                            return (
                                <button
                                    key={day}
                                    type="button"
                                    onClick={() => toggleWorkingDay(day)}
                                    className={cn(
                                        'py-3 px-1 rounded-xl text-xs font-bold text-center border transition-all duration-150',
                                        selected
                                            ? 'bg-primary-600 text-white border-primary-600 dark:border-primary-500 shadow-sm shadow-primary-500/20'
                                            : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-primary-300'
                                    )}
                                >
                                    {day.slice(0, 3)}
                                </button>
                            );
                        })}
                    </div>
                    <p className="text-xs text-neutral-400 mt-2 dark:text-neutral-500">
                        {step4.workingDays.length} working day{step4.workingDays.length !== 1 ? 's' : ''} selected
                    </p>
                    {step4.workingDays.length === 0 && (
                        <p className="text-xs text-danger-500 mt-1">Please select at least one working day.</p>
                    )}
                </div>
            </SectionCard>
        </form>
    );
}
