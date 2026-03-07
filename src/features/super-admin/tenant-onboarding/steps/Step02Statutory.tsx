// Step 02 — Statutory & Tax
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SectionCard, FormInput, FormSelect, InfoBanner, TwoCol } from '../atoms';
import { INDIAN_STATES } from '../constants';
import { useTenantOnboardingStore } from '../store';

const schema = z.object({
    pan: z.string().min(1, 'PAN is required'),
    tan: z.string().min(1, 'TAN is required'),
    gstin: z.string().optional(),
    pfRegNo: z.string().min(1, 'PF Registration No. is required'),
    esiCode: z.string().optional(),
    ptReg: z.string().optional(),
    lwfrNo: z.string().optional(),
    rocState: z.string().min(1, 'ROC Filing State is required'),
});

type FormData = z.infer<typeof schema>;

export function Step02Statutory() {
    const { step2, setStep2, goNext } = useTenantOnboardingStore();

    const { control, handleSubmit } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            pan: step2.pan,
            tan: step2.tan,
            gstin: step2.gstin,
            pfRegNo: step2.pfRegNo,
            esiCode: step2.esiCode,
            ptReg: step2.ptReg,
            lwfrNo: step2.lwfrNo,
            rocState: step2.rocState,
        }
    });

    const onSubmit = (data: FormData) => {
        setStep2(data);
        goNext();
        document.getElementById('wizard-content')?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <form id="wizard-step-form" onSubmit={handleSubmit(onSubmit)} className="space-y-0 animate-in fade-in slide-in-from-right-3 duration-300 pb-10">
            <InfoBanner variant="warning" className="mb-6">
                <strong>Critical:</strong> These identifiers drive payroll computation, TDS deductions, and all statutory
                filings. Ensure 100% accuracy — incorrect values can cause compliance failures and penalty notices.
            </InfoBanner>

            <SectionCard title="India Statutory Identifiers" subtitle="Government-issued registration numbers for compliant operations">
                <TwoCol>
                    <Controller name="pan" control={control} render={({ field, fieldState }) => (
                        <FormInput label="PAN" placeholder="AARCA5678F" {...field} value={field.value || ''} onChange={v => field.onChange(v.toUpperCase())} required hint="Required for TDS, Form 16, Form 24Q filing" monospace error={fieldState.error?.message} />
                    )} />
                    <Controller name="tan" control={control} render={({ field, fieldState }) => (
                        <FormInput label="TAN (Tax Deduction Account Number)" placeholder="BLRA98765T" {...field} value={field.value || ''} onChange={v => field.onChange(v.toUpperCase())} required hint="Required for TDS deduction and quarterly returns" monospace error={fieldState.error?.message} />
                    )} />
                </TwoCol>

                <TwoCol>
                    <Controller name="gstin" control={control} render={({ field, fieldState }) => (
                        <FormInput label="GSTIN" placeholder="29AARCA5678F1Z3" {...field} value={field.value || ''} onChange={v => field.onChange(v.toUpperCase())} hint="Required if GST-registered. State code auto-prefixed from registration state." monospace error={fieldState.error?.message} />
                    )} />
                    <Controller name="pfRegNo" control={control} render={({ field, fieldState }) => (
                        <FormInput label="PF Registration No." placeholder="KA/BLR/0112345/000/0001" {...field} value={field.value || ''} required hint="Required for PF deductions and ECR uploads to EPFO portal" monospace error={fieldState.error?.message} />
                    )} />
                </TwoCol>

                <TwoCol>
                    <Controller name="esiCode" control={control} render={({ field, fieldState }) => (
                        <FormInput label="ESI Employer Code" placeholder="53-00-123456-000-0001" {...field} value={field.value || ''} hint="Required if any employee earns ≤ ₹21,000/month gross salary" monospace error={fieldState.error?.message} />
                    )} />
                    <Controller name="ptReg" control={control} render={({ field, fieldState }) => (
                        <FormInput label="PT Registration No. (Professional Tax)" placeholder="State-specific format" {...field} value={field.value || ''} hint="Required in PT-applicable states (Karnataka, Maharashtra, AP, etc.)" monospace error={fieldState.error?.message} />
                    )} />
                </TwoCol>

                <TwoCol>
                    <Controller name="lwfrNo" control={control} render={({ field, fieldState }) => (
                        <FormInput label="LWFR Number (Labour Welfare Fund)" placeholder="Labour Welfare Fund Registration" {...field} value={field.value || ''} hint="Required under the Labour Welfare Fund Act in applicable states" monospace error={fieldState.error?.message} />
                    )} />
                    <Controller name="rocState" control={control} render={({ field, fieldState }) => (
                        <FormSelect label="ROC Filing State" options={INDIAN_STATES} placeholder="Select state" {...field} value={field.value || ''} required hint="State where company is registered with Registrar of Companies" error={fieldState.error?.message} />
                    )} />
                </TwoCol>
            </SectionCard>

            <SectionCard
                title="Compliance Notes"
                subtitle="Quick reference for mandatory vs optional registrations"
                accent="info"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                        { label: 'PAN', note: 'Mandatory for all companies', status: 'required' },
                        { label: 'TAN', note: 'Mandatory if deducting TDS', status: 'required' },
                        { label: 'GSTIN', note: 'Mandatory if annual turnover > ₹40L', status: 'conditional' },
                        { label: 'PF Reg.', note: 'Mandatory if ≥ 20 employees', status: 'required' },
                        { label: 'ESI Code', note: 'Mandatory if ≥ 10 employees with salary ≤ ₹21K', status: 'conditional' },
                        { label: 'PT Reg.', note: 'State-specific applicability', status: 'conditional' },
                        { label: 'LWF Reg.', note: 'State-specific applicability', status: 'optional' },
                        { label: 'ROC State', note: 'Always required', status: 'required' },
                    ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between bg-neutral-50 rounded-xl px-4 py-3 dark:bg-neutral-800">
                            <span className="text-sm font-bold text-primary-900 dark:text-white">{item.label}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-neutral-600 dark:text-neutral-300">{item.note}</span>
                                <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase
                    ${item.status === 'required' ? 'bg-danger-50 dark:bg-danger-900/20 text-danger-600' :
                                            item.status === 'conditional' ? 'bg-warning-50 dark:bg-warning-900/20 text-warning-600' :
                                                'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400'}`}
                                >
                                    {item.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </SectionCard>
        </form>
    );
}
