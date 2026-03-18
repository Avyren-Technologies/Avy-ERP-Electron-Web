// Step 16 — User Setup
import React from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
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

const userSchema = z.object({
    id: z.string(),
    fullName: z.string().min(1, 'Required'),
    role: z.string().min(1, 'Required'),
    username: z.string().min(1, 'Required').regex(/^[a-z0-9._]+$/, 'Lowercase alphanumeric, dots, and underscores only'),
    password: z.string().optional(),
    email: z.string().email('Invalid email').min(1, 'Required'),
    mobile: z.string().optional(),
    department: z.string().optional(),
    homeLocationId: z.string().optional(),
    allowedLocationIds: z.array(z.string()).optional(),
});

const schema = z.object({
    users: z.array(userSchema).min(1, 'At least one user is required'),
});

type FormData = z.infer<typeof schema>;

export function Step16Users({ onConfirmSubmit }: { onConfirmSubmit?: () => void }) {
    const { step10, step15, setStep15, goNext } = useTenantOnboardingStore();

    const locations = step10.locations;

    const locationOptions = locations.map(loc => ({
        value: loc.id,
        label: `${loc.name || 'Unnamed'}${loc.isHQ ? ' (HQ)' : ''}`,
    }));

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
                mobile: '',
                homeLocationId: locations[0]?.id || '',
                allowedLocationIds: locations.map(l => l.id),
            }],
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'users',
    });

    const onSubmit = (data: FormData) => {
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
                homeLocationId: u.homeLocationId || '',
                allowedLocationIds: u.allowedLocationIds || [],
            }))
        };
        setStep15(sanitizedData);
        goNext();
        document.getElementById('wizard-content')?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <form id="wizard-step-form" onSubmit={handleSubmit(onSubmit)} className="space-y-0 animate-in fade-in slide-in-from-right-3 duration-300 pb-10">

            <SectionCard
                title="Initial User Setup"
                subtitle="Create the first user accounts for this tenant. At least one Company Admin is required."
            >
                <InfoBanner variant="info">
                    These users will be able to log in immediately after activation. Additional users can be created
                    by the Company Admin from within the ERP. Each user can be assigned a home location and restricted
                    to specific locations.
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
                                                <FormInput
                                                    label="Username"
                                                    placeholder="e.g. rahul.mehta"
                                                    {...subField}
                                                    value={subField.value || ''}
                                                    onChange={(e) => subField.onChange(e.toLowerCase())}
                                                    required
                                                    monospace
                                                    hint="Used for login. Alphanumeric, dots and underscores allowed."
                                                    error={errors?.username?.message}
                                                />
                                            )} />
                                            <Controller name={`users.${idx}.password`} control={control} render={({ field: subField }) => (
                                                <SecretInput
                                                    label="Initial Password"
                                                    placeholder="Minimum 8 characters"
                                                    {...subField}
                                                    value={subField.value || ''}
                                                    hint="User will be prompted to change on first login"
                                                    error={errors?.password?.message}
                                                />
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

                                        {/* Location Assignment (only if locations are configured) */}
                                        {locations.length > 0 && (
                                            <div className="space-y-4 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                                                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider dark:text-neutral-400">Location Access</p>
                                                <TwoCol>
                                                    <Controller name={`users.${idx}.homeLocationId`} control={control} render={({ field: subField }) => (
                                                        <FormSelect
                                                            label="Home Location"
                                                            {...subField}
                                                            value={subField.value || ''}
                                                            options={locationOptions}
                                                            placeholder="Select home location"
                                                            hint="Primary location for attendance and data context"
                                                        />
                                                    )} />
                                                    <div className="space-y-2">
                                                        <label className="block text-xs font-bold text-primary-900 dark:text-white">
                                                            Allowed Locations
                                                        </label>
                                                        <div className="flex flex-wrap gap-2">
                                                            {locations.map((loc) => {
                                                                const isAllowed = (user.allowedLocationIds ?? []).includes(loc.id);
                                                                return (
                                                                    <button
                                                                        key={loc.id}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const current = user.allowedLocationIds ?? [];
                                                                            const next = isAllowed
                                                                                ? current.filter(id => id !== loc.id)
                                                                                : [...current, loc.id];
                                                                            controllerField.onChange({ ...user, allowedLocationIds: next });
                                                                        }}
                                                                        className={cn(
                                                                            'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150',
                                                                            isAllowed
                                                                                ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                                                                                : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-primary-300'
                                                                        )}
                                                                    >
                                                                        {loc.name || `Location ${locations.indexOf(loc) + 1}`}
                                                                        {loc.isHQ && <span className="ml-1 opacity-60 text-[10px]">HQ</span>}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                        <p className="text-[10px] text-neutral-400 dark:text-neutral-500">
                                                            Select which locations this user can access. Deselect to restrict.
                                                        </p>
                                                    </div>
                                                </TwoCol>
                                            </div>
                                        )}

                                        {fields.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => remove(idx)}
                                                className="text-xs font-semibold text-danger-500 hover:text-danger-700 transition-colors dark:text-danger-400"
                                            >
                                                Remove this user
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
                    mobile: '',
                    homeLocationId: locations[0]?.id || '',
                    allowedLocationIds: [],
                })} />
            </SectionCard>

            <div className="bg-info-50 border border-info-200 rounded-xl px-4 py-3 dark:bg-info-900/20 dark:border-info-800/50">
                <p className="text-xs font-semibold text-info-800 dark:text-info-300">User Credentials</p>
                <p className="text-xs text-info-700 mt-0.5 dark:text-info-400">
                    Login credentials will be sent to each user's configured email address upon tenant activation.
                    Users will be prompted to change their password on first login.
                </p>
            </div>
        </form>
    );
}
