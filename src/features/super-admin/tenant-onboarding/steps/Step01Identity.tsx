// Step 01 — Company Identity
import React, { useRef, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, Upload, X, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    SectionCard, FormInput, ChipSelector, RadioOption, TwoCol, ThreeCol
} from '../atoms';
import { BUSINESS_TYPES, INDUSTRIES, COMPANY_STATUSES } from '../constants';
import { useTenantOnboardingStore } from '../store';

const schema = z.object({
    displayName: z.string().min(1, 'Display Name is required'),
    legalName: z.string().min(1, 'Legal / Registered Name is required'),
    businessType: z.string().min(1, 'Business Type is required'),
    industry: z.string().min(1, 'Industry is required'),
    companyCode: z.string().min(1, 'Company Code is required'),
    shortName: z.string().optional(),
    incorporationDate: z.string().min(1, 'Date of Incorporation is required'),
    employees: z.string().optional(),
    cin: z.string().optional(),
    website: z.string().url('Invalid URL, include https://').optional().or(z.literal('')),
    emailDomain: z.string().min(1, 'Corporate Email Domain is required'),
    status: z.string().min(1, 'Company Status is required'),
});

type FormData = z.infer<typeof schema>;

export function Step01Identity({ onConfirmSubmit }: { onConfirmSubmit?: () => void }) {
    const { step1, setStep1, goNext } = useTenantOnboardingStore();
    const fileRef = useRef<HTMLInputElement>(null);

    const { control, handleSubmit, setValue, watch } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            displayName: step1.displayName,
            legalName: step1.legalName,
            businessType: step1.businessType || 'Private Limited (Pvt. Ltd.)',
            industry: step1.industry || 'IT',
            companyCode: step1.companyCode,
            shortName: step1.shortName,
            incorporationDate: step1.incorporationDate,
            employees: step1.employees,
            cin: step1.cin,
            website: step1.website,
            emailDomain: step1.emailDomain,
            status: step1.status || 'Draft',
        }
    });

    const watchedDisplayName = watch('displayName');

    // Auto-generate company code from display name if empty or starts with AUTO-
    useEffect(() => {
        const currentCode = watch('companyCode');
        if (watchedDisplayName && (!currentCode || currentCode.startsWith('AUTO-'))) {
            const code = 'AUTO-' + watchedDisplayName.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6);
            setValue('companyCode', code, { shouldValidate: true });
        }
    }, [watchedDisplayName, setValue, watch]);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setStep1({ logoFile: file, logoPreviewUrl: url });
    };

    const removeLogo = () => {
        setStep1({ logoFile: null, logoPreviewUrl: '' });
        if (fileRef.current) fileRef.current.value = '';
    };

    const onSubmit = (data: FormData) => {
        setStep1(data);
        goNext();
        document.getElementById('wizard-content')?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <form id="wizard-step-form" onSubmit={handleSubmit(onSubmit)} className="space-y-0 animate-in fade-in slide-in-from-right-3 duration-300 pb-10">

            {/* Company Logo */}
            <SectionCard title="Company Logo" subtitle="Upload your brand logo (PNG/JPG, max 2 MB, 200×200px recommended)">
                <div className="flex items-center gap-6">
                    {/* Preview / Placeholder */}
                    <div
                        className={cn(
                            'w-24 h-24 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden',
                            step1.logoPreviewUrl
                                ? 'border-2 border-primary-200 dark:border-primary-800/50'
                                : 'border-2 border-dashed border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800'
                        )}
                    >
                        {step1.logoPreviewUrl ? (
                            <img
                                src={step1.logoPreviewUrl}
                                alt="Company logo"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <Building2 size={32} className="text-neutral-300 dark:text-neutral-500" />
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex-1 space-y-3">
                        {step1.logoPreviewUrl ? (
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => fileRef.current?.click()}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold
                    bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 border border-primary-200 dark:border-primary-800/50
                    hover:bg-primary-100 dark:bg-primary-900/40 transition-colors"
                                >
                                    <Camera size={13} />
                                    Change Logo
                                </button>
                                <button
                                    type="button"
                                    onClick={removeLogo}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold
                    bg-danger-50 dark:bg-danger-900/20 text-danger-600 border border-danger-200 dark:border-danger-800/50
                    hover:bg-danger-100 dark:bg-danger-900/30 transition-colors"
                                >
                                    <X size={13} />
                                    Remove
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileRef.current?.click()}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold
                  bg-primary-600 text-white hover:bg-primary-700 shadow-sm shadow-primary-500/20
                  transition-colors"
                            >
                                <Upload size={14} />
                                Upload Logo
                            </button>
                        )}
                        <p className="text-xs text-neutral-400 dark:text-neutral-500">
                            Appears in documents, portal header, and tenant dashboard.
                        </p>
                    </div>
                </div>
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleFile}
                />
            </SectionCard>

            {/* Core Identity */}
            <SectionCard title="Core Identity" subtitle="Primary identifiers displayed across the ERP platform">
                <TwoCol>
                    <Controller name="displayName" control={control} render={({ field, fieldState }) => (
                        <FormInput label="Display Name" placeholder="e.g. Apex Manufacturing" {...field} value={field.value || ''} required hint="Shown in the app header, portal, and all dashboards" error={fieldState.error?.message} />
                    )} />
                    <Controller name="legalName" control={control} render={({ field, fieldState }) => (
                        <FormInput label="Legal / Registered Name" placeholder="Full name as per incorporation documents" {...field} value={field.value || ''} required hint="Used in GST invoices, P&L statement, statutory forms" error={fieldState.error?.message} />
                    )} />
                </TwoCol>

                <TwoCol>
                    <Controller name="businessType" control={control} render={({ field, fieldState }) => (
                        <ChipSelector label="Business Type" options={BUSINESS_TYPES} selected={field.value} onSelect={field.onChange} required hint={fieldState.error?.message} />
                    )} />
                    <Controller name="industry" control={control} render={({ field, fieldState }) => (
                        <ChipSelector label="Nature of Industry" options={INDUSTRIES} selected={field.value} onSelect={field.onChange} required hint={fieldState.error?.message} />
                    )} />
                </TwoCol>

                <ThreeCol>
                    <Controller name="companyCode" control={control} render={({ field, fieldState }) => (
                        <FormInput label="Company Code" placeholder="ABC-IN-001" {...field} value={field.value || ''} onChange={v => field.onChange(v.toUpperCase())} required hint="Auto-generated. Override if needed." error={fieldState.error?.message} />
                    )} />
                    <Controller name="shortName" control={control} render={({ field, fieldState }) => (
                        <FormInput label="Short Name" placeholder="APEX" {...field} value={field.value || ''} hint="Abbreviated for headers and reports" error={fieldState.error?.message} />
                    )} />
                    <Controller name="incorporationDate" control={control} render={({ field, fieldState }) => (
                        <FormInput label="Date of Incorporation" type="date" {...field} value={field.value || ''} required error={fieldState.error?.message} />
                    )} />
                </ThreeCol>

                <TwoCol>
                    <Controller name="employees" control={control} render={({ field, fieldState }) => (
                        <FormInput label="Number of Employees (approx.)" placeholder="e.g. 250" type="number" {...field} value={field.value || ''} hint="Used for PF, ESI, PT compliance threshold checks" error={fieldState.error?.message} />
                    )} />
                    <Controller name="cin" control={control} render={({ field, fieldState }) => (
                        <FormInput label="CIN Number" placeholder="U72900KA2019PTC312847" {...field} value={field.value || ''} onChange={v => field.onChange(v.toUpperCase())} hint="Company Identification Number from MCA" error={fieldState.error?.message} />
                    )} />
                </TwoCol>

                <TwoCol>
                    <Controller name="website" control={control} render={({ field, fieldState }) => (
                        <FormInput label="Official Website" placeholder="https://company.com" type="url" {...field} value={field.value || ''} error={fieldState.error?.message} />
                    )} />
                    <Controller name="emailDomain" control={control} render={({ field, fieldState }) => (
                        <FormInput label="Corporate Email Domain" placeholder="company.com" {...field} value={field.value || ''} onChange={v => field.onChange(v.toLowerCase())} required hint="Used for auto-provisioning employee email IDs" error={fieldState.error?.message} />
                    )} />
                </TwoCol>
            </SectionCard>

            {/* Company Status */}
            <SectionCard title="Company Status" subtitle="Controls tenant visibility and access lifecycle on the platform">
                <Controller name="status" control={control} render={({ field }) => (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {COMPANY_STATUSES.map((s) => (
                            <RadioOption
                                key={s.value}
                                label={s.label}
                                subtitle={s.subtitle}
                                selected={field.value === s.value}
                                onSelect={() => field.onChange(s.value)}
                                badge={s.value === 'Draft' ? 'DEFAULT' : undefined}
                                color={
                                    s.color === 'warning' ? '#F59E0B' :
                                        s.color === 'info' ? '#3B82F6' :
                                            s.color === 'success' ? '#10B981' :
                                                '#EF4444'
                                }
                            />
                        ))}
                    </div>
                )} />
            </SectionCard>
        </form>
    );
}
