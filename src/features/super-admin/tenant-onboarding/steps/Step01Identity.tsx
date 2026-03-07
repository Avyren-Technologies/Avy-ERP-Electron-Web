// Step 01 — Company Identity
import React, { useRef } from 'react';
import { Building2, Upload, X, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    SectionCard, FormInput, ChipSelector, RadioOption, TwoCol, ThreeCol
} from '../atoms';
import { BUSINESS_TYPES, INDUSTRIES, COMPANY_STATUSES } from '../constants';
import { useTenantOnboardingStore } from '../store';

export function Step01Identity() {
    const { step1, setStep1 } = useTenantOnboardingStore();
    const fileRef = useRef<HTMLInputElement>(null);

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

    // Auto-generate company code from display name
    const handleDisplayNameChange = (v: string) => {
        setStep1({ displayName: v });
        if (!step1.companyCode || step1.companyCode.startsWith('AUTO-')) {
            const code = 'AUTO-' + v.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6);
            setStep1({ companyCode: code });
        }
    };

    return (
        <div className="space-y-0 animate-in fade-in slide-in-from-right-3 duration-300">

            {/* Company Logo */}
            <SectionCard title="Company Logo" subtitle="Upload your brand logo (PNG/JPG, max 2 MB, 200×200px recommended)">
                <div className="flex items-center gap-6">
                    {/* Preview / Placeholder */}
                    <div
                        className={cn(
                            'w-24 h-24 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden',
                            step1.logoPreviewUrl
                                ? 'border-2 border-primary-200'
                                : 'border-2 border-dashed border-neutral-200 bg-neutral-50'
                        )}
                    >
                        {step1.logoPreviewUrl ? (
                            <img
                                src={step1.logoPreviewUrl}
                                alt="Company logo"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <Building2 size={32} className="text-neutral-300" />
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
                    bg-primary-50 text-primary-700 border border-primary-200
                    hover:bg-primary-100 transition-colors"
                                >
                                    <Camera size={13} />
                                    Change Logo
                                </button>
                                <button
                                    type="button"
                                    onClick={removeLogo}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold
                    bg-danger-50 text-danger-600 border border-danger-200
                    hover:bg-danger-100 transition-colors"
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
                        <p className="text-xs text-neutral-400">
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
                    <FormInput
                        label="Display Name"
                        placeholder="e.g. Apex Manufacturing"
                        value={step1.displayName}
                        onChange={handleDisplayNameChange}
                        required
                        hint="Shown in the app header, portal, and all dashboards"
                    />
                    <FormInput
                        label="Legal / Registered Name"
                        placeholder="Full name as per incorporation documents"
                        value={step1.legalName}
                        onChange={(v) => setStep1({ legalName: v })}
                        required
                        hint="Used in GST invoices, P&L statement, statutory forms"
                    />
                </TwoCol>

                <TwoCol>
                    <div>
                        <ChipSelector
                            label="Business Type"
                            options={BUSINESS_TYPES}
                            selected={step1.businessType}
                            onSelect={(v) => setStep1({ businessType: v })}
                            required
                        />
                    </div>
                    <div>
                        <ChipSelector
                            label="Nature of Industry"
                            options={INDUSTRIES}
                            selected={step1.industry}
                            onSelect={(v) => setStep1({ industry: v })}
                            required
                        />
                    </div>
                </TwoCol>

                <ThreeCol>
                    <FormInput
                        label="Company Code"
                        placeholder="ABC-IN-001"
                        value={step1.companyCode}
                        onChange={(v) => setStep1({ companyCode: v.toUpperCase() })}
                        required
                        hint="Auto-generated. Override if needed."
                    />
                    <FormInput
                        label="Short Name"
                        placeholder="APEX"
                        value={step1.shortName}
                        onChange={(v) => setStep1({ shortName: v })}
                        hint="Abbreviated for headers and reports"
                    />
                    <FormInput
                        label="Date of Incorporation"
                        placeholder=""
                        value={step1.incorporationDate}
                        onChange={(v) => setStep1({ incorporationDate: v })}
                        type="date"
                        required
                    />
                </ThreeCol>

                <TwoCol>
                    <FormInput
                        label="Number of Employees (approx.)"
                        placeholder="e.g. 250"
                        value={step1.employees}
                        onChange={(v) => setStep1({ employees: v })}
                        type="number"
                        hint="Used for PF, ESI, PT compliance threshold checks"
                    />
                    <FormInput
                        label="CIN Number"
                        placeholder="U72900KA2019PTC312847"
                        value={step1.cin}
                        onChange={(v) => setStep1({ cin: v.toUpperCase() })}
                        hint="Company Identification Number from MCA"
                    />
                </TwoCol>

                <TwoCol>
                    <FormInput
                        label="Official Website"
                        placeholder="https://company.com"
                        value={step1.website}
                        onChange={(v) => setStep1({ website: v })}
                        type="url"
                    />
                    <FormInput
                        label="Corporate Email Domain"
                        placeholder="company.com"
                        value={step1.emailDomain}
                        onChange={(v) => setStep1({ emailDomain: v.toLowerCase() })}
                        required
                        hint="Used for auto-provisioning employee email IDs"
                    />
                </TwoCol>
            </SectionCard>

            {/* Company Status */}
            <SectionCard title="Company Status" subtitle="Controls tenant visibility and access lifecycle on the platform">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {COMPANY_STATUSES.map((s) => (
                        <RadioOption
                            key={s.value}
                            label={s.label}
                            subtitle={s.subtitle}
                            selected={step1.status === s.value}
                            onSelect={() => setStep1({ status: s.value })}
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
            </SectionCard>
        </div>
    );
}
