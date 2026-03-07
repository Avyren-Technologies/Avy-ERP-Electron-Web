// Step 10 — Plants & Branches
import React, { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';
import {
    SectionCard, FormInput, FormSelect, ToggleRow,
    RadioOption, AddButton, ItemCard, TwoCol, ThreeCol, SectionDivider
} from '../atoms';
import {
    FACILITY_TYPES, FACILITY_STATUSES, INDIAN_STATES, COUNTRY_CODES, GEO_RADIUS_OPTIONS
} from '../constants';
import { useTenantOnboardingStore } from '../store';

const locationSchema = z.object({
    id: z.string(),
    name: z.string().min(1, 'Required'),
    code: z.string().min(1, 'Required'),
    status: z.string().optional(),
    facilityType: z.string().min(1, 'Required'),
    isHQ: z.boolean().optional(),
    gstin: z.string().optional(),
    addressLine1: z.string().min(1, 'Required'),
    addressLine2: z.string().optional(),
    city: z.string().min(1, 'Required'),
    pin: z.string().optional(),
    district: z.string().optional(),
    state: z.string().optional(),
    contactName: z.string().optional(),
    contactDesignation: z.string().optional(),
    contactEmail: z.string().email('Invalid email').optional().or(z.literal('')),
    contactCountryCode: z.string().optional(),
    contactPhone: z.string().optional(),
    geoEnabled: z.boolean().optional(),
    geoLocationName: z.string().optional(),
    geoRadius: z.number().optional(),
    geoLat: z.string().optional(),
    geoLng: z.string().optional(),
    geoShape: z.enum(['circle', 'freeform']).optional(),
});

const schema = z.object({
    multiLocationMode: z.boolean(),
    locationConfig: z.enum(['common', 'per-location']).optional(),
    locations: z.array(locationSchema).min(1, 'At least one location is required'),
});

type FormData = z.infer<typeof schema>;

// ---- Facility Type Selector with custom option ----
function FacilityTypeSelector({
    selected,
    onSelect,
    error
}: {
    selected: string;
    onSelect: (v: string) => void;
    error?: string;
}) {
    const [custom, setCustom] = useState('');
    const [showCustom, setShowCustom] = useState(
        selected !== '' && !FACILITY_TYPES.slice(0, -1).includes(selected)
    );

    return (
        <div className="space-y-2">
            <label className="block text-xs font-bold text-primary-900 dark:text-white">
                Facility Type <span className="text-danger-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
                {FACILITY_TYPES.map((opt) => {
                    const isCustomOpt = opt === 'Custom...';
                    const isActive = isCustomOpt ? showCustom : selected === opt && !showCustom;
                    return (
                        <button
                            key={opt}
                            type="button"
                            onClick={() => {
                                if (isCustomOpt) {
                                    setShowCustom(true);
                                    onSelect('Custom...');
                                } else {
                                    setShowCustom(false);
                                    setCustom('');
                                    onSelect(opt);
                                }
                            }}
                            className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150',
                                isActive
                                    ? 'bg-primary-600 text-white border-primary-600 dark:border-primary-500 shadow-sm'
                                    : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-primary-300 hover:text-primary-700 dark:text-primary-400',
                                error ? 'border-danger-500' : ''
                            )}
                        >
                            {opt}
                        </button>
                    );
                })}
            </div>

            {showCustom && (
                <div className="flex gap-2 mt-2 animate-in fade-in duration-150">
                    <input
                        type="text"
                        placeholder="Type your facility type (e.g. Cold Storage)"
                        value={custom}
                        onChange={(e) => setCustom(e.target.value)}
                        className="flex-1 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-4 py-2.5 text-sm text-neutral-800 dark:text-neutral-200
              focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                    />
                    <button
                        type="button"
                        onClick={() => {
                            if (custom.trim().length >= 2) {
                                onSelect(custom.trim());
                                setShowCustom(false);
                            }
                        }}
                        className="px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-bold hover:bg-primary-700"
                    >
                        Save
                    </button>
                </div>
            )}
            {error && <p className="text-[10px] text-danger-500 mt-1">{error}</p>}
        </div>
    );
}

// ---- Main Step ----

export function Step10Plants() {
    const { step10, setStep10, goNext } = useTenantOnboardingStore();

    const { control, handleSubmit, watch, setValue } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            multiLocationMode: step10.multiLocationMode,
            locationConfig: step10.locationConfig,
            locations: step10.locations.length > 0 ? step10.locations : [{
                id: Date.now().toString(),
                name: '',
                code: '',
                status: 'Active',
                facilityType: 'Head Office',
                isHQ: true,
                addressLine1: '',
                city: '',
                geoShape: 'circle',
                geoRadius: 100,
                contactCountryCode: '+91'
            }],
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'locations',
    });

    const multiLocationMode = watch('multiLocationMode');
    const locationConfig = watch('locationConfig');
    const watchedLocations = watch('locations');

    const onSubmit = (data: FormData) => {
        // Sanitize data to match PlantBranch[] (no undefined)
        const sanitizedData = {
            ...data,
            locations: data.locations.map(l => ({
                id: l.id,
                name: l.name,
                code: l.code,
                status: l.status || 'Active',
                facilityType: l.facilityType,
                customFacilityType: '', // Added missing property
                isHQ: !!l.isHQ,
                gstin: l.gstin || '',
                stateGST: '', // Added missing property
                addressLine1: l.addressLine1,
                addressLine2: l.addressLine2 || '',
                city: l.city,
                district: l.district || '',
                state: l.state || '',
                pin: l.pin || '',
                country: 'India', // Added missing property
                contactName: l.contactName || '',
                contactDesignation: l.contactDesignation || '',
                contactEmail: l.contactEmail || '',
                contactCountryCode: l.contactCountryCode || '+91',
                contactPhone: l.contactPhone || '',
                geoEnabled: !!l.geoEnabled,
                geoLocationName: l.geoLocationName || '',
                geoLat: l.geoLat || '',
                geoLng: l.geoLng || '',
                geoRadius: l.geoRadius || 200,
                geoShape: l.geoShape || 'circle',
            }))
        };
        setStep10(sanitizedData);
        goNext();
        document.getElementById('wizard-content')?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const countryOptions = COUNTRY_CODES.map(c => ({
        value: c.code,
        label: `${c.flag} ${c.code}`
    }));

    const setHQLoc = (indexToSet: number) => {
        watchedLocations.forEach((loc, i) => {
            setValue(`locations.${i}.isHQ`, i === indexToSet);
        });
    };

    return (
        <form id="wizard-step-form" onSubmit={handleSubmit(onSubmit)} className="space-y-0 animate-in fade-in slide-in-from-right-3 duration-300 pb-10">
            <SectionCard title="Multi-Location Configuration" subtitle="Define your company's physical location strategy">
                <Controller name="multiLocationMode" control={control} render={({ field }) => (
                    <ToggleRow
                        label="Multi-Location Mode"
                        subtitle="Enable if the company operates from multiple plants, branches, or office locations"
                        value={field.value}
                        onToggle={field.onChange}
                    />
                )} />

                {multiLocationMode && (
                    <div className="pt-2 space-y-3 animate-in fade-in duration-200">
                        <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400">Data Management Strategy</p>
                        <Controller name="locationConfig" control={control} render={({ field }) => (
                            <>
                                <RadioOption
                                    label="Common Configuration"
                                    subtitle="All locations share the same shift schedules, No Series, and IOT Reason lists"
                                    selected={field.value === 'common'}
                                    onSelect={() => field.onChange('common')}
                                />
                                <RadioOption
                                    label="Per-Location Configuration"
                                    subtitle="Each location has its own independent shift schedules and serial number tracking"
                                    selected={field.value === 'per-location'}
                                    onSelect={() => field.onChange('per-location')}
                                />
                            </>
                        )} />
                    </div>
                )}
            </SectionCard>

            <div className="bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-3 mb-4 dark:bg-neutral-800 dark:border-neutral-800">
                <p className="text-xs text-neutral-600 dark:text-neutral-300">
                    Define all physical locations — plants, branches, offices, and warehouses. Each location can have
                    its own address, GSTIN, geo-fencing boundary, and contact person. The HQ location's data reflects
                    in the company's General Information.
                </p>
            </div>

            {fields.map((field, idx) => (
                <Controller
                    key={field.id}
                    name={`locations.${idx}`}
                    control={control}
                    render={({ field: controllerField, formState }) => {
                        const plant = controllerField.value;
                        const errors = formState.errors.locations?.[idx];

                        return (
                            <ItemCard
                                title={plant.name || 'New Location'}
                                subtitle={[plant.facilityType, plant.city].filter(Boolean).join(' · ')}
                                badge={`Location ${idx + 1}${plant.isHQ ? ' — HQ' : ''}`}
                                badgeVariant={plant.isHQ ? 'success' : 'primary'}
                                onRemove={fields.length > 1 ? () => remove(idx) : undefined}
                                defaultOpen={idx === 0}
                            >
                                <div className="space-y-5">
                                    {/* HQ toggle */}
                                    <div className="flex items-center gap-3 bg-primary-50 rounded-xl px-4 py-3 border border-primary-100 dark:bg-primary-900/30 dark:border-primary-800/50">
                                        <Star
                                            size={16}
                                            className={plant.isHQ ? 'text-warning-500 fill-warning-500' : 'text-neutral-300 dark:text-neutral-500'}
                                        />
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-primary-950 dark:text-white">
                                                {plant.isHQ ? 'This is the HQ / Headquarters' : 'Set as HQ / Headquarters?'}
                                            </p>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400">HQ data reflects in Company's General Information</p>
                                        </div>
                                        {!plant.isHQ && (
                                            <button
                                                type="button"
                                                onClick={() => setHQLoc(idx)}
                                                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-primary-100 text-primary-700 hover:bg-primary-200 border border-primary-200 dark:bg-primary-900/40 dark:text-primary-400 dark:border-primary-800/50"
                                            >
                                                Set as HQ
                                            </button>
                                        )}
                                    </div>

                                    {/* Basic Info */}
                                    <SectionDivider label="Basic Information" />
                                    <TwoCol>
                                        <Controller name={`locations.${idx}.name`} control={control} render={({ field: subField }) => (
                                            <FormInput label="Location Name" placeholder="e.g. Bengaluru HQ, Pune Plant" {...subField} value={subField.value || ''} required error={errors?.name?.message} />
                                        )} />
                                        <Controller name={`locations.${idx}.code`} control={control} render={({ field: subField }) => (
                                            <FormInput label="Location Code" placeholder="BLR-HQ-001" {...subField} value={subField.value || ''} onChange={(e) => subField.onChange(e.toUpperCase())} required error={errors?.code?.message} />
                                        )} />
                                    </TwoCol>

                                    <TwoCol>
                                        <Controller name={`locations.${idx}.status`} control={control} render={({ field: subField }) => (
                                            <FormSelect label="Status" {...subField} value={subField.value || ''} options={FACILITY_STATUSES} />
                                        )} />
                                        <div /> {/* spacer */}
                                    </TwoCol>

                                    <Controller name={`locations.${idx}.facilityType`} control={control} render={({ field: subField }) => (
                                        <FacilityTypeSelector selected={subField.value} onSelect={subField.onChange} error={errors?.facilityType?.message} />
                                    )} />

                                    {/* GST */}
                                    <SectionDivider label="GST Details" />
                                    <Controller name={`locations.${idx}.gstin`} control={control} render={({ field: subField }) => (
                                        <FormInput label="Location GSTIN" placeholder="29AARCA5678F1Z3" {...subField} value={subField.value || ''} onChange={(e) => subField.onChange(e.toUpperCase())} hint="A separate GSTIN is required for each state of operation" monospace error={errors?.gstin?.message} />
                                    )} />

                                    {/* Address */}
                                    <SectionDivider label="Address" />
                                    <Controller name={`locations.${idx}.addressLine1`} control={control} render={({ field: subField }) => (
                                        <FormInput label="Address Line 1" placeholder="Street, plot, building" {...subField} value={subField.value || ''} required error={errors?.addressLine1?.message} />
                                    )} />
                                    <Controller name={`locations.${idx}.addressLine2`} control={control} render={({ field: subField }) => (
                                        <FormInput label="Address Line 2" placeholder="Area, landmark" {...subField} value={subField.value || ''} error={errors?.addressLine2?.message} />
                                    )} />
                                    <ThreeCol>
                                        <Controller name={`locations.${idx}.city`} control={control} render={({ field: subField }) => (
                                            <FormInput label="City" placeholder="Bengaluru" {...subField} value={subField.value || ''} required error={errors?.city?.message} />
                                        )} />
                                        <Controller name={`locations.${idx}.pin`} control={control} render={({ field: subField }) => (
                                            <FormInput label="PIN Code" placeholder="560001" {...subField} value={subField.value || ''} error={errors?.pin?.message} />
                                        )} />
                                        <Controller name={`locations.${idx}.district`} control={control} render={({ field: subField }) => (
                                            <FormInput label="District" placeholder="Bengaluru Urban" {...subField} value={subField.value || ''} error={errors?.district?.message} />
                                        )} />
                                    </ThreeCol>
                                    <Controller name={`locations.${idx}.state`} control={control} render={({ field: subField }) => (
                                        <FormSelect label="State" {...subField} value={subField.value || ''} options={INDIAN_STATES} placeholder="Select state" />
                                    )} />

                                    {/* Contact Person */}
                                    <SectionDivider label="Location Contact" />
                                    <TwoCol>
                                        <Controller name={`locations.${idx}.contactName`} control={control} render={({ field: subField }) => (
                                            <FormInput label="Contact Person Name" placeholder="Full name" {...subField} value={subField.value || ''} error={errors?.contactName?.message} />
                                        )} />
                                        <Controller name={`locations.${idx}.contactDesignation`} control={control} render={({ field: subField }) => (
                                            <FormInput label="Designation" placeholder="Branch Manager, Plant Head" {...subField} value={subField.value || ''} error={errors?.contactDesignation?.message} />
                                        )} />
                                    </TwoCol>
                                    <TwoCol>
                                        <Controller name={`locations.${idx}.contactEmail`} control={control} render={({ field: subField }) => (
                                            <FormInput label="Email" placeholder="branch@company.com" {...subField} value={subField.value || ''} type="email" error={errors?.contactEmail?.message} />
                                        )} />

                                        <div className="space-y-2 relative">
                                            <label className="block text-xs font-bold text-primary-900 dark:text-white">Phone Number</label>
                                            <div className="flex gap-2">
                                                <div className="w-24">
                                                    <Controller name={`locations.${idx}.contactCountryCode`} control={control} render={({ field: subField }) => (
                                                        <FormSelect label="" options={countryOptions} {...subField} value={subField.value || ''} />
                                                    )} />
                                                </div>
                                                <div className="flex-1 relative">
                                                    <Controller name={`locations.${idx}.contactPhone`} control={control} render={({ field: subField }) => (
                                                        <FormInput
                                                            label="Phone Number"
                                                            placeholder="9876543210"
                                                            type="tel"
                                                            {...subField}
                                                            value={subField.value || ''}
                                                            error={errors?.contactPhone?.message}
                                                        />
                                                    )} />
                                                </div>
                                            </div>
                                        </div>
                                    </TwoCol>

                                    {/* Geo-Fencing */}
                                    <SectionDivider label="Geo-Fencing" />
                                    <Controller name={`locations.${idx}.geoEnabled`} control={control} render={({ field: subField }) => (
                                        <ToggleRow
                                            label="Enable Geo-Fencing"
                                            subtitle="Restrict employee attendance punch-in to a defined geographic area"
                                            value={!!subField.value}
                                            onToggle={subField.onChange}
                                        />
                                    )} />

                                    {plant.geoEnabled && (
                                        <div className="pl-4 border-l-2 border-primary-200 space-y-4 animate-in fade-in duration-150 dark:border-primary-800/50">
                                            <TwoCol>
                                                <Controller name={`locations.${idx}.geoLocationName`} control={control} render={({ field: subField }) => (
                                                    <FormInput label="Location Name / Label" placeholder="e.g. Factory Main Gate" {...subField} value={subField.value || ''} error={errors?.geoLocationName?.message} />
                                                )} />
                                                <Controller name={`locations.${idx}.geoRadius`} control={control} render={({ field: subField }) => (
                                                    <FormSelect
                                                        label="Geo-Fence Radius"
                                                        value={String(subField.value)}
                                                        onChange={(v) => subField.onChange(parseInt(v))}
                                                        options={GEO_RADIUS_OPTIONS.map((o) => ({ value: String(o.value), label: o.label }))}
                                                    />
                                                )} />
                                            </TwoCol>
                                            <TwoCol>
                                                <Controller name={`locations.${idx}.geoLat`} control={control} render={({ field: subField }) => (
                                                    <FormInput label="Latitude" placeholder="12.9716" {...subField} value={subField.value || ''} monospace error={errors?.geoLat?.message} />
                                                )} />
                                                <Controller name={`locations.${idx}.geoLng`} control={control} render={({ field: subField }) => (
                                                    <FormInput label="Longitude" placeholder="77.5946" {...subField} value={subField.value || ''} monospace error={errors?.geoLng?.message} />
                                                )} />
                                            </TwoCol>
                                            <div className="space-y-2">
                                                <label className="block text-xs font-bold text-primary-900 dark:text-white">Fence Shape</label>
                                                <div className="flex gap-3">
                                                    {(['circle', 'freeform'] as const).map((shape) => (
                                                        <Controller key={shape} name={`locations.${idx}.geoShape`} control={control} render={({ field: subField }) => (
                                                            <RadioOption
                                                                label={shape.charAt(0).toUpperCase() + shape.slice(1)}
                                                                subtitle={shape === 'circle' ? 'Simple radius-based boundary' : 'Custom polygon boundary (set via map)'}
                                                                selected={subField.value === shape}
                                                                onSelect={() => subField.onChange(shape)}
                                                            />
                                                        )} />
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="bg-info-50 border border-info-200 rounded-xl px-4 py-3 dark:bg-info-900/20 dark:border-info-800/50">
                                                <p className="text-xs text-info-800 dark:text-info-400">
                                                    💡 For precise boundary drawing on a map, use the <strong>Geo-Fence Configuration</strong> tool in
                                                    the tenant's admin panel after activation. Coordinates entered here will be used as the initial center point.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </ItemCard>
                        );
                    }}
                />
            ))}

            <AddButton
                label="Add Location / Plant / Branch"
                onClick={() => append({
                    id: Date.now().toString(),
                    name: '',
                    code: '',
                    status: 'Active',
                    facilityType: 'Branch Office',
                    isHQ: false,
                    addressLine1: '',
                    city: '',
                    geoShape: 'circle',
                    geoRadius: 100,
                    contactCountryCode: '+91'
                })}
            />
        </form>
    );
}
