// Step 15 — User Setup + Activation & Review
import React from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';
import {
    SectionCard, FormInput, FormSelect, SecretInput,
    AddButton, ItemCard, TwoCol, InfoBanner
} from '../atoms';
import { useTenantOnboardingStore } from '../store';

const USER_ROLES = [
    'Company Admin', 'HR Manager', 'Payroll Manager', 'Plant Manager',
    'Production Supervisor', 'Quality Manager', 'Maintenance Manager',
    'Finance Manager', 'IT Admin', 'Viewer',
];

const DEPARTMENTS = [
    'IT', 'HR', 'Finance', 'Operations', 'Production',
    'Quality', 'Maintenance', 'Stores', 'Management', 'Other',
];

const ACTIVATION_STATUSES = [
    { status: 'Draft', subtitle: 'Setup still in progress — not yet live', color: '#F59E0B' },
    { status: 'Pilot', subtitle: 'Company is in trial/UAT phase with limited users', color: '#3B82F6' },
    { status: 'Active', subtitle: 'Company is live — full production use', color: '#10B981' },
];

const CHECKLIST_PHASES = [
    {
        phase: 'Company Identity',
        items: ['Display name & legal name', 'Business type & industry', 'Company code & CIN', 'Incorporation date'],
    },
    {
        phase: 'Compliance & Statutory',
        items: ['PAN & TAN entered', 'GSTIN configured', 'PF & ESI details set', 'ROC filing state selected'],
    },
    {
        phase: 'Address',
        items: ['Registered address complete', 'Corporate/HQ address confirmed'],
    },
    {
        phase: 'Fiscal & Calendar',
        items: ['FY period selected', 'Payroll cycle configured', 'Timezone & working days set'],
    },
    {
        phase: 'Preferences',
        items: ['Currency & language set', 'Compliance toggles reviewed', 'Integrations configured'],
    },
    {
        phase: 'Backend Endpoint',
        items: ['Endpoint type selected (Default/Custom)', 'Region/custom URL configured'],
    },
    {
        phase: 'Modules & Pricing',
        items: ['Modules selected & priced', 'User tier confirmed', 'Trial days set', 'Billing cycle set'],
    },
    {
        phase: 'Locations',
        items: ['Locations/Plants added', 'Key contacts assigned', 'Geo-fencing configured (if applicable)'],
    },
    {
        phase: 'Time & Config',
        items: ['Shifts created', 'No. Series defined', 'IOT Reasons populated', 'Controls reviewed'],
    },
    {
        phase: 'User Access',
        items: ['Company Admin user created', 'Role assignments confirmed'],
    },
];

const userSchema = z.object({
    id: z.string(),
    fullName: z.string().min(1, 'Required'),
    role: z.string().min(1, 'Required'),
    username: z.string().min(1, 'Required').regex(/^[a-z0-9._]+$/, 'Lowercase alphanumeric, dots, and underscores only'),
    password: z.string().optional(),
    email: z.string().email('Invalid email').min(1, 'Required'),
    mobile: z.string().optional(),
    department: z.string().optional(),
});

const schema = z.object({
    users: z.array(userSchema).min(1, 'At least one user is required'),
});

type FormData = z.infer<typeof schema>;

export function Step15Activation({ onConfirmSubmit }: { onConfirmSubmit?: () => void }) {
    const { step1, step15, setStep15, setStep1, goNext } = useTenantOnboardingStore();

    const { control, handleSubmit } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            users: step15.users.length > 0 ? step15.users : [{
                id: Date.now().toString(),
                fullName: '',
                role: 'Company Admin',
                username: '',
                password: '',
                email: '',
                department: '',
                mobile: ''
            }],
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'users',
    });

    const onSubmit = (data: FormData) => {
        // Sanitize data (ensure no undefined strings)
        const sanitizedData = {
            users: data.users.map(u => ({
                id: u.id,
                fullName: u.fullName,
                username: u.username,
                password: u.password || '',
                role: u.role,
                email: u.email,
                mobile: u.mobile || '',
                department: u.department || '',
            }))
        };
        setStep15(sanitizedData);
        if (onConfirmSubmit) {
            onConfirmSubmit();
        }
    };

    return (
        <form id="wizard-step-form" onSubmit={handleSubmit(onSubmit)} className="space-y-0 animate-in fade-in slide-in-from-right-3 duration-300 pb-10">

            {/* Hero Banner */}
            <div className="relative overflow-hidden rounded-3xl mb-5 bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 px-8 py-10 text-white">
                {/* Decorative circles */}
                <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
                <div className="absolute -bottom-10 -left-6 w-32 h-32 rounded-full bg-white/5" />
                <div className="absolute top-1/2 -translate-y-1/2 right-20 w-20 h-20 rounded-full bg-white/5" />

                <div className="relative flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-3xl flex-shrink-0">
                        🚀
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Almost Ready to Activate!</h2>
                        <p className="text-primary-200 mt-1">
                            {step1.displayName || 'New Company'} · Final review & activation
                        </p>
                    </div>
                </div>
            </div>

            {/* Initial Users */}
            <SectionCard
                title="Initial User Setup"
                subtitle="Create the first user accounts for this tenant. At least one Company Admin is required."
            >
                <InfoBanner variant="info">
                    These users will be able to log in immediately after activation. Additional users can be created
                    by the Company Admin from within the ERP.
                </InfoBanner>

                {fields.map((field, idx) => (
                    <Controller
                        key={field.id}
                        name={`users.${idx}`}
                        control={control}
                        render={({ field: controllerField, formState }) => {
                            const user = controllerField.value;
                            const errors = formState.errors.users?.[idx];

                            return (
                                <ItemCard
                                    title={user.fullName || `User ${idx + 1}`}
                                    subtitle={[user.role, user.department].filter(Boolean).join(' · ')}
                                    badge={idx === 0 ? 'Primary Admin' : `User ${idx + 1}`}
                                    badgeVariant={idx === 0 ? 'primary' : 'info'}
                                    onRemove={fields.length > 1 ? () => remove(idx) : undefined}
                                    defaultOpen={idx === 0}
                                >
                                    <div className="space-y-4">
                                        <TwoCol>
                                            <Controller name={`users.${idx}.fullName`} control={control} render={({ field: subField }) => (
                                                <FormInput label="Full Name" placeholder="e.g. Rahul Mehta" {...subField} value={subField.value || ''} required error={errors?.fullName?.message} />
                                            )} />
                                            <Controller name={`users.${idx}.role`} control={control} render={({ field: subField }) => (
                                                <FormSelect label="Role / Access Level" {...subField} value={subField.value || ''} options={USER_ROLES} required />
                                            )} />
                                        </TwoCol>

                                        <TwoCol>
                                            <Controller name={`users.${idx}.username`} control={control} render={({ field: subField }) => (
                                                <FormInput label="Username" placeholder="e.g. rahul.mehta" {...subField} value={subField.value || ''} onChange={(e) => subField.onChange(e.toLowerCase())} required monospace hint="Used for login. Alphanumeric, dots and underscores allowed." error={errors?.username?.message} />
                                            )} />
                                            <Controller name={`users.${idx}.password`} control={control} render={({ field: subField }) => (
                                                <SecretInput label="Initial Password" placeholder="Minimum 8 characters" {...subField} value={subField.value || ''} hint="User will be prompted to change on first login" error={errors?.password?.message} />
                                            )} />
                                        </TwoCol>

                                        <TwoCol>
                                            <Controller name={`users.${idx}.email`} control={control} render={({ field: subField }) => (
                                                <FormInput label="Email Address" placeholder="rahul@company.com" {...subField} value={subField.value || ''} type="email" required error={errors?.email?.message} />
                                            )} />
                                            <Controller name={`users.${idx}.mobile`} control={control} render={({ field: subField }) => (
                                                <FormInput label="Mobile Number" placeholder="9876543210" {...subField} value={subField.value || ''} type="tel" hint="Used for MFA / OTP authentication" error={errors?.mobile?.message} />
                                            )} />
                                        </TwoCol>

                                        <Controller name={`users.${idx}.department`} control={control} render={({ field: subField }) => (
                                            <FormSelect label="Department" {...subField} value={subField.value || ''} options={DEPARTMENTS} />
                                        )} />

                                        {fields.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => remove(idx)}
                                                className="text-xs font-semibold text-danger-500 hover:text-danger-700 transition-colors dark:text-danger-400"
                                            >
                                                🗑 Remove this user
                                            </button>
                                        )}
                                    </div>
                                </ItemCard>
                            );
                        }}
                    />
                ))}

                <AddButton label="Add Another User" onClick={() => append({
                    id: Date.now().toString(),
                    fullName: '',
                    role: 'Viewer',
                    username: '',
                    password: '',
                    email: '',
                    department: '',
                    mobile: ''
                })} />
            </SectionCard>

            {/* Activation Status */}
            <SectionCard
                title="Set Company Status"
                subtitle="Select the activation status for this tenant after creation"
            >
                <div className="space-y-3">
                    {ACTIVATION_STATUSES.map((opt) => (
                        <button
                            key={opt.status}
                            type="button"
                            onClick={() => setStep1({ status: opt.status as any })}
                            className={cn(
                                'w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left transition-all duration-150',
                                step1.status === opt.status
                                    ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/30 shadow-sm'
                                    : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-neutral-300'
                            )}
                        >
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: opt.color }} />
                            <div className="flex-1">
                                <p className={cn(
                                    'text-sm font-bold',
                                    step1.status === opt.status ? 'text-primary-800 dark:text-primary-300' : 'text-primary-950 dark:text-white'
                                )}>
                                    {opt.status}
                                </p>
                                <p className="text-xs text-neutral-500 mt-0.5 dark:text-neutral-400">{opt.subtitle}</p>
                            </div>
                            <div className={cn(
                                'w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                                step1.status === opt.status ? 'border-primary-600 dark:border-primary-500 bg-primary-600' : 'border-neutral-300'
                            )}>
                                {step1.status === opt.status && <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-neutral-900" />}
                            </div>
                        </button>
                    ))}
                </div>
            </SectionCard>

            {/* Provisioning Checklist */}
            <SectionCard
                title="Provisioning Checklist"
                subtitle="Verify all phases are complete before going live. Items without explicit data will use system defaults."
                accent="success"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {CHECKLIST_PHASES.map((phase) => (
                        <div key={phase.phase} className="bg-neutral-50 rounded-xl border border-neutral-100 px-5 py-4 dark:bg-neutral-800 dark:border-neutral-800">
                            <p className="text-xs font-bold text-primary-900 mb-2 dark:text-white">{phase.phase}</p>
                            <div className="space-y-1.5">
                                {phase.items.map((item) => (
                                    <div key={item} className="flex items-start gap-2">
                                        <CheckCircle2 size={13} className="text-success-500 flex-shrink-0 mt-0.5" />
                                        <p className="text-xs text-neutral-600 leading-4 dark:text-neutral-300">{item}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </SectionCard>

            {/* Final confirmation notice */}
            <InfoBanner variant="warning">
                <strong>Before you click "Create Company":</strong> Verify all the data above. After creation, statutory
                identifiers (PAN, TAN, GSTIN) cannot be changed without Super-Admin override and audit trail.
                User credentials will be sent to the email addresses configured for each user.
            </InfoBanner>
        </form>
    );
}
