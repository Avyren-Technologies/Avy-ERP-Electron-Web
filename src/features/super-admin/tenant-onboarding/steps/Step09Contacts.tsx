// Step 09 — Key Contacts
import React from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    SectionCard, FormInput, FormSelect, PhoneInput, AddButton, ItemCard, TwoCol
} from '../atoms';
import { CONTACT_TYPES, COUNTRY_CODES } from '../constants';
import { useTenantOnboardingStore } from '../store';

const contactSchema = z.object({
    id: z.string(),
    name: z.string().min(1, 'Required'),
    designation: z.string().optional(),
    department: z.string().optional(),
    type: z.string().optional(),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    countryCode: z.string().optional(),
    mobile: z.string().optional(),
    linkedin: z.string().url('Invalid URL').optional().or(z.literal('')),
});

const schema = z.object({
    contacts: z.array(contactSchema).min(1, 'At least one contact is required'),
});

type FormData = z.infer<typeof schema>;

export function Step09Contacts() {
    const { step9, setStep9, goNext } = useTenantOnboardingStore();

    const { control, handleSubmit } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            contacts: step9.contacts.length > 0 ? step9.contacts : [{
                id: Date.now().toString(),
                name: '',
                designation: '',
                department: '',
                type: 'Primary',
                email: '',
                countryCode: '+91',
                mobile: '',
                linkedin: ''
            }],
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'contacts',
    });

    const onSubmit = (data: FormData) => {
        // Sanitize data to match Contact[] (no undefined)
        const sanitizedData = {
            contacts: data.contacts.map(c => ({
                id: c.id,
                name: c.name,
                designation: c.designation || '',
                department: c.department || '',
                type: c.type || '',
                email: c.email || '',
                countryCode: c.countryCode || '+91',
                mobile: c.mobile || '',
                linkedin: c.linkedin || '',
            }))
        };
        setStep9(sanitizedData);
        goNext();
        document.getElementById('wizard-content')?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const countryOptions = COUNTRY_CODES.map(c => ({
        value: c.code,
        label: `${c.flag} ${c.code}`
    }));

    return (
        <form id="wizard-step-form" onSubmit={handleSubmit(onSubmit)} className="space-y-0 animate-in fade-in slide-in-from-right-3 duration-300 pb-10">
            <SectionCard
                title="Key Company Contacts"
                subtitle="Contacts for HR, Finance, IT, Legal, and Operations — used for notifications and escalations"
            >
                <div className="bg-info-50 border border-info-200 rounded-xl px-4 py-3 mb-4 dark:bg-info-900/20 dark:border-info-800/50">
                    <p className="text-xs text-info-800 dark:text-info-400">
                        Add at least one primary contact. These contacts receive system alerts, billing notices, and
                        support communications. Unlike users, contacts don't have login access.
                    </p>
                </div>

                <div className="space-y-0">
                    {fields.map((field, idx) => (
                        <Controller
                            key={field.id}
                            name={`contacts.${idx}`}
                            control={control}
                            render={({ field: controllerField, formState }) => {
                                const contact = controllerField.value;
                                const errors = formState.errors.contacts?.[idx];

                                return (
                                    <ItemCard
                                        title={contact.name || 'New Contact'}
                                        subtitle={[contact.designation, contact.department].filter(Boolean).join(' · ')}
                                        badge={`Contact ${idx + 1}`}
                                        badgeVariant={contact.type === 'Primary' ? 'primary' : 'info'}
                                        onRemove={fields.length > 1 ? () => remove(idx) : undefined}
                                        defaultOpen={idx === 0}
                                    >
                                        <div className="space-y-4">
                                            <TwoCol>
                                                <Controller name={`contacts.${idx}.name`} control={control} render={({ field: subField }) => (
                                                    <FormInput label="Full Name" placeholder="e.g. Priya Sharma" {...subField} value={subField.value || ''} required error={errors?.name?.message} />
                                                )} />
                                                <Controller name={`contacts.${idx}.designation`} control={control} render={({ field: subField }) => (
                                                    <FormInput label="Designation / Title" placeholder="e.g. HR Manager" {...subField} value={subField.value || ''} error={errors?.designation?.message} />
                                                )} />
                                            </TwoCol>

                                            <TwoCol>
                                                <Controller name={`contacts.${idx}.department`} control={control} render={({ field: subField }) => (
                                                    <FormInput label="Department" placeholder="e.g. Human Resources" {...subField} value={subField.value || ''} error={errors?.department?.message} />
                                                )} />
                                                <Controller name={`contacts.${idx}.type`} control={control} render={({ field: subField }) => {
                                                    const isCustom = !CONTACT_TYPES.includes(subField.value || '') && subField.value !== '';
                                                    const [showCustom, setShowCustom] = React.useState(isCustom);
                                                    const displayValue = isCustom ? 'Custom...' : (subField.value || '');
                                                    return (
                                                        <div className="space-y-2">
                                                            <FormSelect
                                                                label="Contact Type"
                                                                value={displayValue}
                                                                onChange={(v) => {
                                                                    if (v === 'Custom...') {
                                                                        setShowCustom(true);
                                                                        subField.onChange('');
                                                                    } else {
                                                                        setShowCustom(false);
                                                                        subField.onChange(v);
                                                                    }
                                                                }}
                                                                options={[...CONTACT_TYPES, 'Custom...']}
                                                            />
                                                            {showCustom && (
                                                                <FormInput
                                                                    label="Custom Type"
                                                                    placeholder="e.g. Procurement Contact"
                                                                    value={isCustom ? subField.value : ''}
                                                                    onChange={(v) => {
                                                                        if (v.length > 0 && v.length <= 50) subField.onChange(v);
                                                                        else if (v.length === 0) subField.onChange('');
                                                                    }}
                                                                    hint="Max 50 characters"
                                                                />
                                                            )}
                                                        </div>
                                                    );
                                                }} />
                                            </TwoCol>

                                            <TwoCol>
                                                <Controller name={`contacts.${idx}.email`} control={control} render={({ field: subField }) => (
                                                    <FormInput label="Email Address" placeholder="priya@company.com" {...subField} value={subField.value || ''} type="email" required error={errors?.email?.message} />
                                                )} />
                                                <div className="space-y-1.5">
                                                    <label className="block text-xs font-bold text-primary-900 dark:text-white">Mobile Number</label>
                                                    <div className="flex items-end gap-2">
                                                        <div className="w-24 flex-shrink-0">
                                                            <Controller name={`contacts.${idx}.countryCode`} control={control} render={({ field: subField }) => (
                                                                <FormSelect label="" options={countryOptions} {...subField} value={subField.value || ''} />
                                                            )} />
                                                        </div>
                                                        <div className="flex-1">
                                                            <Controller name={`contacts.${idx}.mobile`} control={control} render={({ field: subField }) => (
                                                                <FormInput label="" placeholder="9876543210" type="tel" {...subField} value={subField.value || ''} error={errors?.mobile?.message} />
                                                            )} />
                                                        </div>
                                                    </div>
                                                    {errors?.mobile?.message && <p className="text-[10px] text-danger-500">{errors.mobile.message}</p>}
                                                </div>
                                            </TwoCol>

                                            <Controller name={`contacts.${idx}.linkedin`} control={control} render={({ field: subField }) => (
                                                <FormInput label="LinkedIn Profile (Optional)" placeholder="https://linkedin.com/in/username" {...subField} value={subField.value || ''} type="url" error={errors?.linkedin?.message} />
                                            )} />
                                        </div>
                                    </ItemCard>
                                );
                            }}
                        />
                    ))}
                </div>

                <AddButton label="Add Another Contact" onClick={() => append({
                    id: Date.now().toString(),
                    name: '',
                    designation: '',
                    department: '',
                    type: 'Secondary',
                    email: '',
                    countryCode: '+91',
                    mobile: '',
                    linkedin: ''
                })} />
            </SectionCard>
        </form>
    );
}
