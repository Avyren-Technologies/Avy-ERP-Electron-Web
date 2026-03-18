// Step 03 — Address (Registered & Corporate)
import React from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SectionCard, FormInput, FormSelect, ToggleRow, TwoCol, ThreeCol } from '../atoms';
import { INDIAN_STATES, COUNTRIES } from '../constants';
import { useTenantOnboardingStore } from '../store';

const schema = z.object({
    regLine1: z.string().min(1, 'Required'),
    regLine2: z.string().optional(),
    regCity: z.string().min(1, 'Required'),
    regDistrict: z.string().optional(),
    regPin: z.string().min(1, 'Required'),
    regState: z.string().min(1, 'Required'),
    regCountry: z.string().min(1, 'Required'),
    regStdCode: z.string().optional(),
    sameAsRegistered: z.boolean(),
    corpLine1: z.string().optional(),
    corpLine2: z.string().optional(),
    corpCity: z.string().optional(),
    corpDistrict: z.string().optional(),
    corpState: z.string().optional(),
    corpCountry: z.string().optional(),
    corpPin: z.string().optional(),
    corpStdCode: z.string().optional(),
}).superRefine((data, ctx) => {
    if (!data.sameAsRegistered) {
        if (!data.corpLine1) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['corpLine1'], message: 'Required' });
        if (!data.corpCity) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['corpCity'], message: 'Required' });
        if (!data.corpState) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['corpState'], message: 'Required' });
        if (!data.corpCountry) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['corpCountry'], message: 'Required' });
        if (!data.corpPin) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['corpPin'], message: 'Required' });
    }
});

type FormData = z.infer<typeof schema>;

export function Step03Address() {
    const { step3, setStep3, goNext } = useTenantOnboardingStore();

    const { control, handleSubmit } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            regLine1: step3.regLine1,
            regLine2: step3.regLine2,
            regCity: step3.regCity,
            regDistrict: step3.regDistrict,
            regPin: step3.regPin,
            regState: step3.regState,
            regCountry: step3.regCountry || 'India',
            regStdCode: step3.regStdCode,
            sameAsRegistered: step3.sameAsRegistered,
            corpLine1: step3.corpLine1,
            corpLine2: step3.corpLine2,
            corpCity: step3.corpCity,
            corpDistrict: step3.corpDistrict || '',
            corpState: step3.corpState,
            corpCountry: step3.corpCountry || 'India',
            corpPin: step3.corpPin,
            corpStdCode: step3.corpStdCode || '',
        }
    });

    const sameAsReg = useWatch({ control, name: 'sameAsRegistered' });

    const onSubmit = (data: FormData) => {
        setStep3({
            ...data,
            corpDistrict: data.corpDistrict || '',
            corpStdCode: data.corpStdCode || '',
        });
        goNext();
        document.getElementById('wizard-content')?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <form id="wizard-step-form" onSubmit={handleSubmit(onSubmit)} className="space-y-0 animate-in fade-in slide-in-from-right-3 duration-300 pb-10">

            {/* Registered Address */}
            <SectionCard title="Registered Address" subtitle="Official address as per incorporation documents — used in all statutory filings">
                <Controller name="regLine1" control={control} render={({ field, fieldState }) => (
                    <FormInput label="Address Line 1" placeholder="Plot no., Street, Building, Floor" {...field} value={field.value || ''} required error={fieldState.error?.message} />
                )} />
                <Controller name="regLine2" control={control} render={({ field, fieldState }) => (
                    <FormInput label="Address Line 2" placeholder="Area, Landmark, Locality" {...field} value={field.value || ''} error={fieldState.error?.message} />
                )} />
                <ThreeCol>
                    <Controller name="regCity" control={control} render={({ field, fieldState }) => (
                        <FormInput label="City / Town" placeholder="Bengaluru" {...field} value={field.value || ''} required error={fieldState.error?.message} />
                    )} />
                    <Controller name="regDistrict" control={control} render={({ field, fieldState }) => (
                        <FormInput label="District" placeholder="Bengaluru Urban" {...field} value={field.value || ''} error={fieldState.error?.message} />
                    )} />
                    <Controller name="regPin" control={control} render={({ field, fieldState }) => (
                        <FormInput label="PIN Code" placeholder="560001" type="text" {...field} value={field.value || ''} required error={fieldState.error?.message} />
                    )} />
                </ThreeCol>
                <TwoCol>
                    <Controller name="regState" control={control} render={({ field, fieldState }) => (
                        <FormSelect label="State" options={INDIAN_STATES} placeholder="Select state" {...field} value={field.value || ''} required hint="Determines CGST+SGST vs. IGST applicability" error={fieldState.error?.message} />
                    )} />
                    <Controller name="regCountry" control={control} render={({ field, fieldState }) => (
                        <FormSelect label="Country" options={COUNTRIES} placeholder="Select country" {...field} value={field.value || ''} required error={fieldState.error?.message} />
                    )} />
                </TwoCol>
                <Controller name="regStdCode" control={control} render={({ field, fieldState }) => (
                    <FormInput label="STD Code (Telephone)" placeholder="080" {...field} value={field.value || ''} hint="Area/STD code for the registered location's landline" error={fieldState.error?.message} />
                )} />
            </SectionCard>

            {/* Corporate / HQ Address */}
            <SectionCard
                title="Corporate / HQ Address"
                subtitle="Primary operational address — may differ from registered address"
            >
                <Controller name="sameAsRegistered" control={control} render={({ field }) => (
                    <ToggleRow
                        label="Same as Registered Address"
                        subtitle="Check if corporate HQ is at the same location as the registered office"
                        value={field.value}
                        onToggle={field.onChange}
                    />
                )} />

                {!sameAsReg && (
                    <div className="space-y-4 pt-2 animate-in fade-in duration-200">
                        <Controller name="corpLine1" control={control} render={({ field, fieldState }) => (
                            <FormInput label="Address Line 1" placeholder="Plot no., Street, Building, Floor" {...field} value={field.value || ''} required error={fieldState.error?.message} />
                        )} />
                        <Controller name="corpLine2" control={control} render={({ field, fieldState }) => (
                            <FormInput label="Address Line 2" placeholder="Area, Landmark, Locality" {...field} value={field.value || ''} error={fieldState.error?.message} />
                        )} />
                        <ThreeCol>
                            <Controller name="corpCity" control={control} render={({ field, fieldState }) => (
                                <FormInput label="City / Town" placeholder="Mumbai" {...field} value={field.value || ''} required error={fieldState.error?.message} />
                            )} />
                            <Controller name="corpDistrict" control={control} render={({ field, fieldState }) => (
                                <FormInput label="District" placeholder="Mumbai City" {...field} value={field.value || ''} error={fieldState.error?.message} />
                            )} />
                            <Controller name="corpPin" control={control} render={({ field, fieldState }) => (
                                <FormInput label="PIN Code" placeholder="400001" {...field} value={field.value || ''} required error={fieldState.error?.message} />
                            )} />
                        </ThreeCol>
                        <TwoCol>
                            <Controller name="corpState" control={control} render={({ field, fieldState }) => (
                                <FormSelect label="State" options={INDIAN_STATES} placeholder="Select state" {...field} value={field.value || ''} required error={fieldState.error?.message} />
                            )} />
                            <Controller name="corpCountry" control={control} render={({ field, fieldState }) => (
                                <FormSelect label="Country" options={COUNTRIES} placeholder="Select country" {...field} value={field.value || ''} required error={fieldState.error?.message} />
                            )} />
                        </TwoCol>
                        <Controller name="corpStdCode" control={control} render={({ field, fieldState }) => (
                            <FormInput label="STD Code (Telephone)" placeholder="022" {...field} value={field.value || ''} hint="Area/STD code for the corporate location's landline" error={fieldState.error?.message} />
                        )} />
                    </div>
                )}

                {sameAsReg && (
                    <div className="bg-success-50 rounded-xl border border-success-200 px-4 py-3 mt-2 dark:bg-success-900/20 dark:border-success-800/50">
                        <p className="text-xs font-semibold text-success-700 dark:text-success-400">
                            ✅ Corporate address will mirror the registered address above.
                        </p>
                    </div>
                )}
            </SectionCard>
        </form>
    );
}
