// Step 10 — Plants & Branches
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';
import {
    SectionCard, FormInput, FormSelect, ToggleRow,
    RadioOption, PhoneInput, AddButton, ItemCard, TwoCol, ThreeCol, SectionDivider
} from '../atoms';
import {
    FACILITY_TYPES, FACILITY_STATUSES, INDIAN_STATES, COUNTRY_CODES, GEO_RADIUS_OPTIONS
} from '../constants';
import { useTenantOnboardingStore } from '../store';
import type { PlantBranch } from '../types';

// ---- Facility Type Selector with custom option ----

function FacilityTypeSelector({
    selected,
    onSelect,
}: {
    selected: string;
    onSelect: (v: string) => void;
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
                                    : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-primary-300 hover:text-primary-700 dark:text-primary-400'
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
        </div>
    );
}

// ---- Single Plant/Branch Form ----

function PlantForm({
    plant,
    onUpdate,
    onSetHQ,
}: {
    plant: PlantBranch;
    onUpdate: (u: Partial<PlantBranch>) => void;
    onSetHQ: () => void;
}) {
    return (
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
                        onClick={onSetHQ}
                        className="px-4 py-1.5 rounded-lg text-xs font-bold bg-primary-100 text-primary-700 hover:bg-primary-200 border border-primary-200 dark:bg-primary-900/40 dark:text-primary-400 dark:border-primary-800/50"
                    >
                        Set as HQ
                    </button>
                )}
            </div>

            {/* Basic Info */}
            <SectionDivider label="Basic Information" />
            <TwoCol>
                <FormInput
                    label="Location Name"
                    placeholder="e.g. Bengaluru HQ, Pune Plant"
                    value={plant.name}
                    onChange={(v) => onUpdate({ name: v })}
                    required
                />
                <FormInput
                    label="Location Code"
                    placeholder="BLR-HQ-001"
                    value={plant.code}
                    onChange={(v) => onUpdate({ code: v.toUpperCase() })}
                    required
                />
            </TwoCol>

            <TwoCol>
                <FormSelect
                    label="Status"
                    value={plant.status}
                    onChange={(v) => onUpdate({ status: v })}
                    options={FACILITY_STATUSES}
                />
                <div /> {/* spacer */}
            </TwoCol>

            <FacilityTypeSelector
                selected={plant.facilityType}
                onSelect={(v) => onUpdate({ facilityType: v })}
            />

            {/* GST */}
            <SectionDivider label="GST Details" />
            <FormInput
                label="Location GSTIN"
                placeholder="29AARCA5678F1Z3"
                value={plant.gstin}
                onChange={(v) => onUpdate({ gstin: v.toUpperCase() })}
                hint="A separate GSTIN is required for each state of operation"
                monospace
            />

            {/* Address */}
            <SectionDivider label="Address" />
            <FormInput
                label="Address Line 1"
                placeholder="Street, plot, building"
                value={plant.addressLine1}
                onChange={(v) => onUpdate({ addressLine1: v })}
                required
            />
            <FormInput
                label="Address Line 2"
                placeholder="Area, landmark"
                value={plant.addressLine2}
                onChange={(v) => onUpdate({ addressLine2: v })}
            />
            <ThreeCol>
                <FormInput
                    label="City"
                    placeholder="Bengaluru"
                    value={plant.city}
                    onChange={(v) => onUpdate({ city: v })}
                    required
                />
                <FormInput
                    label="PIN Code"
                    placeholder="560001"
                    value={plant.pin}
                    onChange={(v) => onUpdate({ pin: v })}
                />
                <FormInput
                    label="District"
                    placeholder="Bengaluru Urban"
                    value={plant.district}
                    onChange={(v) => onUpdate({ district: v })}
                />
            </ThreeCol>
            <FormSelect
                label="State"
                value={plant.state}
                onChange={(v) => onUpdate({ state: v })}
                options={INDIAN_STATES}
                placeholder="Select state"
            />

            {/* Contact Person */}
            <SectionDivider label="Location Contact" />
            <TwoCol>
                <FormInput
                    label="Contact Person Name"
                    placeholder="Full name"
                    value={plant.contactName}
                    onChange={(v) => onUpdate({ contactName: v })}
                />
                <FormInput
                    label="Designation"
                    placeholder="Branch Manager, Plant Head"
                    value={plant.contactDesignation}
                    onChange={(v) => onUpdate({ contactDesignation: v })}
                />
            </TwoCol>
            <TwoCol>
                <FormInput
                    label="Email"
                    placeholder="branch@company.com"
                    value={plant.contactEmail}
                    onChange={(v) => onUpdate({ contactEmail: v })}
                    type="email"
                />
                <PhoneInput
                    label="Phone Number"
                    countryCode={plant.contactCountryCode}
                    phone={plant.contactPhone}
                    onCountryCodeChange={(v) => onUpdate({ contactCountryCode: v })}
                    onPhoneChange={(v) => onUpdate({ contactPhone: v })}
                    options={COUNTRY_CODES}
                />
            </TwoCol>

            {/* Geo-Fencing */}
            <SectionDivider label="Geo-Fencing" />
            <ToggleRow
                label="Enable Geo-Fencing"
                subtitle="Restrict employee attendance punch-in to a defined geographic area"
                value={plant.geoEnabled}
                onToggle={(v) => onUpdate({ geoEnabled: v })}
            />

            {plant.geoEnabled && (
                <div className="pl-4 border-l-2 border-primary-200 space-y-4 animate-in fade-in duration-150 dark:border-primary-800/50">
                    <TwoCol>
                        <FormInput
                            label="Location Name / Label"
                            placeholder="e.g. Factory Main Gate"
                            value={plant.geoLocationName}
                            onChange={(v) => onUpdate({ geoLocationName: v })}
                        />
                        <FormSelect
                            label="Geo-Fence Radius"
                            value={String(plant.geoRadius)}
                            onChange={(v) => onUpdate({ geoRadius: parseInt(v) })}
                            options={GEO_RADIUS_OPTIONS.map((o) => ({ value: String(o.value), label: o.label }))}
                        />
                    </TwoCol>
                    <TwoCol>
                        <FormInput
                            label="Latitude"
                            placeholder="12.9716"
                            value={plant.geoLat}
                            onChange={(v) => onUpdate({ geoLat: v })}
                            monospace
                        />
                        <FormInput
                            label="Longitude"
                            placeholder="77.5946"
                            value={plant.geoLng}
                            onChange={(v) => onUpdate({ geoLng: v })}
                            monospace
                        />
                    </TwoCol>
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-primary-900 dark:text-white">Fence Shape</label>
                        <div className="flex gap-3">
                            {(['circle', 'freeform'] as const).map((shape) => (
                                <RadioOption
                                    key={shape}
                                    label={shape.charAt(0).toUpperCase() + shape.slice(1)}
                                    subtitle={shape === 'circle' ? 'Simple radius-based boundary' : 'Custom polygon boundary (set via map)'}
                                    selected={plant.geoShape === shape}
                                    onSelect={() => onUpdate({ geoShape: shape })}
                                />
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
    );
}

// ---- Main Step ----

export function Step10Plants() {
    const { step10, setStep10, addLocation, updateLocation, removeLocation, setHQLoc } = useTenantOnboardingStore();

    return (
        <div className="space-y-0 animate-in fade-in slide-in-from-right-3 duration-300">
            <SectionCard title="Multi-Location Configuration" subtitle="Define your company's physical location strategy">
                <ToggleRow
                    label="Multi-Location Mode"
                    subtitle="Enable if the company operates from multiple plants, branches, or office locations"
                    value={step10.multiLocationMode}
                    onToggle={(v) => setStep10({ multiLocationMode: v })}
                />

                {step10.multiLocationMode && (
                    <div className="pt-2 space-y-3 animate-in fade-in duration-200">
                        <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400">Data Management Strategy</p>
                        <RadioOption
                            label="Common Configuration"
                            subtitle="All locations share the same shift schedules, No Series, and IOT Reason lists"
                            selected={step10.locationConfig === 'common'}
                            onSelect={() => setStep10({ locationConfig: 'common' })}
                        />
                        <RadioOption
                            label="Per-Location Configuration"
                            subtitle="Each location has its own independent shift schedules and serial number tracking"
                            selected={step10.locationConfig === 'per-location'}
                            onSelect={() => setStep10({ locationConfig: 'per-location' })}
                        />
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

            {step10.locations.map((plant, idx) => (
                <ItemCard
                    key={plant.id}
                    title={plant.name || 'New Location'}
                    subtitle={[plant.facilityType, plant.city].filter(Boolean).join(' · ')}
                    badge={`Location ${idx + 1}${plant.isHQ ? ' — HQ' : ''}`}
                    badgeVariant={plant.isHQ ? 'success' : 'primary'}
                    onRemove={step10.locations.length > 1 ? () => removeLocation(plant.id) : undefined}
                    defaultOpen={idx === 0}
                >
                    <PlantForm
                        plant={plant}
                        onUpdate={(u) => updateLocation(plant.id, u)}
                        onSetHQ={() => setHQLoc(plant.id)}
                    />
                </ItemCard>
            ))}

            <AddButton
                label="Add Location / Plant / Branch"
                onClick={addLocation}
            />
        </div>
    );
}
