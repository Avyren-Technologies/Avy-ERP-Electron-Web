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
    FY_OPTIONS, MONTHS, WEEK_STARTS, TIMEZONES, DAYS_OF_WEEK
} from '../constants';
import { useTenantOnboardingStore } from '../store';

const schema = z.object({
    fyType: z.string().min(1, 'Required'),
    fyCustomStartMonth: z.string().optional(),
    fyCustomEndMonth: z.string().optional(),
    payrollFreq: z.string().optional(),
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

// ---- Day of Month Picker ----

function DayOfMonthPicker({ label, value, onSelect, hint }: { label: string; value: string; onSelect: (v: string) => void; hint?: string }) {
    const [open, setOpen] = React.useState(false);
    const days = Array.from({ length: 28 }, (_, i) => String(i + 1));

    return (
        <div className="space-y-1.5 relative">
            <label className="block text-xs font-bold text-primary-900 dark:text-white">{label}</label>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between rounded-2xl border border-neutral-200/60 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50 px-4 py-3 text-sm text-neutral-800 dark:text-neutral-200 hover:border-primary-400 transition-all"
            >
                <span className={value ? 'text-neutral-800 dark:text-neutral-200' : 'text-neutral-400'}>
                    {value ? `Day ${value} of month` : 'Select day'}
                </span>
                <span className="text-neutral-400">📅</span>
            </button>
            {hint && <p className="text-[10px] text-neutral-400 dark:text-neutral-500">{hint}</p>}
            {open && (
                <div className="absolute z-50 top-full mt-1 left-0 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow-xl p-3 w-64">
                    <p className="text-xs font-bold text-neutral-500 mb-2 dark:text-neutral-400">Select Day of Month</p>
                    <div className="grid grid-cols-7 gap-1">
                        {days.map(d => (
                            <button
                                key={d}
                                type="button"
                                onClick={() => { onSelect(d); setOpen(false); }}
                                className={`h-8 w-8 rounded-xl text-xs font-semibold transition-all ${value === d ? 'bg-primary-600 text-white' : 'hover:bg-primary-50 text-neutral-700 dark:text-neutral-300 dark:hover:bg-primary-900/30'}`}
                            >
                                {d}
                            </button>
                        ))}
                    </div>
                    <button type="button" onClick={() => setOpen(false)} className="mt-2 w-full text-xs text-neutral-400 hover:text-neutral-600">Cancel</button>
                </div>
            )}
        </div>
    );
}

// ---- Main Step ----

export function Step04Fiscal() {
    const { step4, setStep4, toggleWorkingDay, goNext } = useTenantOnboardingStore();

    const { control, handleSubmit, watch, setValue } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            fyType: step4.fyType || 'apr-mar',
            fyCustomStartMonth: step4.fyCustomStartMonth,
            fyCustomEndMonth: step4.fyCustomEndMonth,
            payrollFreq: 'Monthly',
            cutoffDay: step4.cutoffDay,
            disbursementDay: step4.disbursementDay,
            weekStart: step4.weekStart || 'Monday',
            timezone: step4.timezone || 'IST UTC+5:30',
        }
    });

    const fyType = watch('fyType');
    const cutoffDay = watch('cutoffDay');
    const disbursementDay = watch('disbursementDay');

    const onSubmit = (data: FormData) => {
        setStep4({ ...data, payrollFreq: 'Monthly' });
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
                <div className="rounded-2xl bg-info-50 dark:bg-info-900/20 border border-info-200 dark:border-info-800/50 px-4 py-3">
                    <p className="text-xs font-semibold text-info-700 dark:text-info-400">
                        Payroll frequency is set to Monthly. This is the standard for most Indian companies.
                    </p>
                </div>
                <TwoCol>
                    <DayOfMonthPicker
                        label="Salary Cutoff Day"
                        value={cutoffDay || ''}
                        onSelect={(v) => setValue('cutoffDay', v)}
                        hint="Attendance data is locked after this day for payroll processing"
                    />
                    <DayOfMonthPicker
                        label="Disbursement Day"
                        value={disbursementDay || ''}
                        onSelect={(v) => setValue('disbursementDay', v)}
                        hint="Day when salary is transferred to employee bank accounts"
                    />
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

                <SectionDivider label="Non-Working Days" />

                <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-primary-900 dark:text-white">Non-Working Days</label>
                    <p className="text-xs text-neutral-500 mb-3 dark:text-neutral-400">
                        Select the days that are non-working / weekly off for this company. Selected days are marked as non-working (weekly offs).
                    </p>
                    <div className="grid grid-cols-7 gap-2">
                        {DAYS_OF_WEEK.map((day) => {
                            // A day is "off" (non-working) if it is NOT in workingDays
                            const isOff = !step4.workingDays.includes(day);
                            return (
                                <button
                                    key={day}
                                    type="button"
                                    onClick={() => toggleWorkingDay(day)}
                                    className={cn(
                                        'py-3 px-1 rounded-xl text-xs font-bold text-center border transition-all duration-150',
                                        isOff
                                            ? 'bg-danger-500 text-white border-danger-500 dark:border-danger-400 shadow-sm shadow-danger-500/20'
                                            : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-danger-300'
                                    )}
                                >
                                    <span className="block">{day.slice(0, 3)}</span>
                                    <span className={cn('block text-[9px] mt-0.5 font-semibold', isOff ? 'text-danger-100' : 'text-neutral-400')}>
                                        {isOff ? 'Off' : 'Working'}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                    <p className="text-xs text-neutral-400 mt-2 dark:text-neutral-500">
                        {7 - step4.workingDays.length} non-working day{(7 - step4.workingDays.length) !== 1 ? 's' : ''} selected
                    </p>
                    {step4.workingDays.length === 0 && (
                        <p className="text-xs text-danger-500 mt-1">All days are marked as non-working. Please keep at least one working day.</p>
                    )}
                </div>
            </SectionCard>
        </form>
    );
}
