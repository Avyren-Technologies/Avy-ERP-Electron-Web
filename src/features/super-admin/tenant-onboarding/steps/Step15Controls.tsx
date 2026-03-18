// Step 15 — System Controls
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SectionCard, ToggleRow, InfoBanner } from '../atoms';
import { useTenantOnboardingStore } from '../store';

const schema = z.object({
    ncEditMode: z.boolean(),
    loadUnload: z.boolean(),
    cycleTime: z.boolean(),
    payrollLock: z.boolean(),
    leaveCarryForward: z.boolean(),
    overtimeApproval: z.boolean(),
    mfa: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export function Step15Controls() {
    const { step14, setStep14, goNext } = useTenantOnboardingStore();

    const { control, handleSubmit, watch } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            ...step14
        }
    });

    const watchedForm = watch();

    const onSubmit = (data: FormData) => {
        setStep14(data);
        goNext();
        document.getElementById('wizard-content')?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <form id="wizard-step-form" onSubmit={handleSubmit(onSubmit)} className="space-y-0 animate-in fade-in slide-in-from-right-3 duration-300 pb-10">

            <InfoBanner variant="info" className="mb-5">
                System controls are <strong>company-level settings</strong> — they apply to all plants and
                locations. These settings can be modified post-activation by the Company Admin with Super-Admin approval.
            </InfoBanner>

            {/* NC Reason */}
            <SectionCard
                title="Non-Conformance (NC) Management"
                subtitle="Controls for quality and production NC entry behaviour"
            >
                <Controller name="ncEditMode" control={control} render={({ field }) => (
                    <ToggleRow
                        label="Enable NC Edit Mode"
                        subtitle="Allow operators to edit or delete existing NC entries in the NC Reason Assignment screen. When disabled, entries are immutable once saved."
                        value={field.value}
                        onToggle={field.onChange}
                    />
                )} />
            </SectionCard>

            {/* Load & Unload */}
            <SectionCard
                title="Load & Unload Assignment"
                subtitle="Production tracking controls for machine loading events"
            >
                <Controller name="loadUnload" control={control} render={({ field }) => (
                    <ToggleRow
                        label="Load / Unload Tracking"
                        subtitle="When enabled, Load & Unload time is tracked separately and must be assigned to a category. Used for OEE Performance analysis."
                        value={field.value}
                        onToggle={field.onChange}
                    />
                )} />
                <Controller name="cycleTime" control={control} render={({ field }) => (
                    <ToggleRow
                        label="Cycle Time Capture"
                        subtitle="Automatically capture cycle time data for each production run. Required for accurate OEE and throughput analysis."
                        value={field.value}
                        onToggle={field.onChange}
                    />
                )} />
            </SectionCard>

            {/* Payroll & Attendance */}
            <SectionCard
                title="Payroll & Attendance Controls"
                subtitle="Financial governance and leave management settings"
            >
                <Controller name="payrollLock" control={control} render={({ field }) => (
                    <ToggleRow
                        label="Payroll Lock Control"
                        subtitle="Prevent any payroll modifications after the payroll lock date. Authorized managers can unlock with audit trail."
                        value={field.value}
                        onToggle={field.onChange}
                    />
                )} />
                <Controller name="leaveCarryForward" control={control} render={({ field }) => (
                    <ToggleRow
                        label="Leave Carry Forward"
                        subtitle="Enable automatic carry forward of unused leave balances at year-end. Applied based on leaf policy rules."
                        value={field.value}
                        onToggle={field.onChange}
                    />
                )} />
                <Controller name="overtimeApproval" control={control} render={({ field }) => (
                    <ToggleRow
                        label="Overtime Approval"
                        subtitle="Require manager approval before overtime hours are counted for salary calculation. Prevents unauthorized OT."
                        value={field.value}
                        onToggle={field.onChange}
                    />
                )} />
            </SectionCard>

            {/* Security */}
            <SectionCard
                title="Security & Access Controls"
                subtitle="Authentication and data integrity settings"
                accent="warning"
            >
                <Controller name="mfa" control={control} render={({ field }) => (
                    <ToggleRow
                        label="Multi-Factor Authentication (MFA)"
                        subtitle="Require OTP via SMS/Email or an Authenticator app (Google/Microsoft Authenticator) for all user logins. Recommended for enterprise security."
                        value={field.value}
                        onToggle={field.onChange}
                    />
                )} />
            </SectionCard>

            {/* Summary */}
            <SectionCard title="Controls Summary" subtitle="Current configuration overview">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                        { label: 'NC Edit Mode', value: watchedForm.ncEditMode },
                        { label: 'Load/Unload Tracking', value: watchedForm.loadUnload },
                        { label: 'Cycle Time Capture', value: watchedForm.cycleTime },
                        { label: 'Payroll Lock', value: watchedForm.payrollLock },
                        { label: 'Leave Carry Forward', value: watchedForm.leaveCarryForward },
                        { label: 'Overtime Approval', value: watchedForm.overtimeApproval },
                        { label: 'MFA Required', value: watchedForm.mfa },
                    ].map((ctrl) => (
                        <div
                            key={ctrl.label}
                            className="flex items-center gap-3 bg-neutral-50 rounded-xl px-4 py-3 border border-neutral-100 dark:bg-neutral-800 dark:border-neutral-800"
                        >
                            <div
                                className={`w-2 h-2 rounded-full flex-shrink-0 ${ctrl.value ? 'bg-success-500' : 'bg-neutral-300'}`}
                            />
                            <span className="text-xs font-semibold text-primary-950 flex-1 dark:text-white">{ctrl.label}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${ctrl.value ? 'bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-400' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
                                }`}>
                                {ctrl.value ? 'ON' : 'OFF'}
                            </span>
                        </div>
                    ))}
                </div>
            </SectionCard>
        </form>
    );
}
