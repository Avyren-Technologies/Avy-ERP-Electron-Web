// Step 04 — Fiscal & Calendar
import { cn } from '@/lib/utils';
import {
    SectionCard, FormSelect, ChipSelector, RadioOption, TwoCol, ThreeCol, InfoBanner, SectionDivider
} from '../atoms';
import {
    FY_OPTIONS, MONTHS, PAYROLL_FREQ, CUTOFF_DAYS,
    DISBURSEMENT_DAYS, WEEK_STARTS, TIMEZONES, DAYS_OF_WEEK
} from '../constants';
import { useTenantOnboardingStore } from '../store';

export function Step04Fiscal() {
    const { step4, setStep4, toggleWorkingDay } = useTenantOnboardingStore();

    return (
        <div className="space-y-0 animate-in fade-in slide-in-from-right-3 duration-300">

            {/* Financial Year */}
            <SectionCard title="Financial Year Period" subtitle="Controls fiscal reporting, P&L, balance sheet, and budget cycles">
                <div className="space-y-3">
                    {FY_OPTIONS.map((fy) => (
                        <RadioOption
                            key={fy.key}
                            label={fy.label}
                            subtitle={fy.subtitle}
                            selected={step4.fyType === fy.key}
                            onSelect={() => setStep4({ fyType: fy.key })}
                            badge={fy.key === 'apr-mar' ? 'INDIA DEFAULT' : undefined}
                        />
                    ))}
                </div>

                {step4.fyType === 'custom' && (
                    <div className="mt-4 space-y-3 animate-in fade-in duration-200">
                        <InfoBanner variant="info">
                            Define your custom financial year start and end months below.
                        </InfoBanner>
                        <TwoCol>
                            <FormSelect
                                label="FY Start Month"
                                value={step4.fyCustomStartMonth}
                                onChange={(v) => setStep4({ fyCustomStartMonth: v })}
                                options={MONTHS.map((m) => ({ value: m.key, label: m.label }))}
                                placeholder="Select start month"
                                required
                            />
                            <FormSelect
                                label="FY End Month"
                                value={step4.fyCustomEndMonth}
                                onChange={(v) => setStep4({ fyCustomEndMonth: v })}
                                options={MONTHS.map((m) => ({ value: m.key, label: m.label }))}
                                placeholder="Select end month"
                                required
                            />
                        </TwoCol>
                    </div>
                )}
            </SectionCard>

            {/* Payroll Cycle */}
            <SectionCard title="Payroll Cycle" subtitle="Controls when salaries are computed, locked, and disbursed">
                <ChipSelector
                    label="Payroll Frequency"
                    options={PAYROLL_FREQ}
                    selected={step4.payrollFreq}
                    onSelect={(v) => setStep4({ payrollFreq: v })}
                    required
                />
                <TwoCol>
                    <ChipSelector
                        label="Salary Cutoff Day"
                        options={CUTOFF_DAYS}
                        selected={step4.cutoffDay}
                        onSelect={(v) => setStep4({ cutoffDay: v })}
                        hint="Attendance data is locked after this day for payroll processing"
                    />
                    <ChipSelector
                        label="Disbursement Day"
                        options={DISBURSEMENT_DAYS}
                        selected={step4.disbursementDay}
                        onSelect={(v) => setStep4({ disbursementDay: v })}
                        hint="Day when salary is transferred to employee bank accounts"
                    />
                </TwoCol>
            </SectionCard>

            {/* Calendar & Timezone */}
            <SectionCard title="Calendar & Timezone" subtitle="Controls scheduling, shift allocation, and time-based operations">
                <ThreeCol>
                    <ChipSelector
                        label="Week Starts On"
                        options={WEEK_STARTS}
                        selected={step4.weekStart}
                        onSelect={(v) => setStep4({ weekStart: v })}
                    />
                    <FormSelect
                        label="Timezone"
                        value={step4.timezone}
                        onChange={(v) => setStep4({ timezone: v })}
                        options={TIMEZONES}
                        hint="Used for all timestamp calculations and reports"
                    />
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
                </div>
            </SectionCard>
        </div>
    );
}
