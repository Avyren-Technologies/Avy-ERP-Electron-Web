// Step 10 — Per-Location User Tier & Pricing
import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { Star, Check, Zap, TrendingUp } from 'lucide-react';
import { SectionCard, FormInput, InfoBanner } from '../atoms';
import { USER_TIERS, MODULE_CATALOGUE, resolveModuleDependencies } from '../constants';
import { useTenantOnboardingStore } from '../store';

const locationTierSchema = z.object({
    userTier: z.string().min(1, 'Required'),
    customUserLimit: z.string().optional(),
    customTierPrice: z.string().optional(),
    billingCycle: z.enum(['monthly', 'annual']),
    trialDays: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.userTier === 'custom') {
        if (!data.customUserLimit) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['customUserLimit'], message: 'Required' });
        if (!data.customTierPrice) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['customTierPrice'], message: 'Required' });
    }
});

type LocationTierFormData = z.infer<typeof locationTierSchema>;

export function Step10PerLocationTier({ onConfirmSubmit }: { onConfirmSubmit?: () => void }) {
    const {
        strategyConfig,
        step10,
        locationCommercial,
        setLocationCommercial,
        initLocationCommercial,
        goNext,
    } = useTenantOnboardingStore();

    const locations = step10.locations;
    const [activeLocationId, setActiveLocationId] = React.useState<string>(locations[0]?.id ?? '');

    // Initialize commercial entries for all locations on mount
    useEffect(() => {
        for (const loc of locations) {
            initLocationCommercial(loc.id);
        }
    }, [locations, initLocationCommercial]);

    // Ensure activeLocationId stays valid
    useEffect(() => {
        if (locations.length > 0 && !locations.find(l => l.id === activeLocationId)) {
            setActiveLocationId(locations[0].id);
        }
    }, [locations, activeLocationId]);

    const activeEntry = locationCommercial[activeLocationId] ?? {
        moduleIds: [],
        customModulePricing: {},
        userTier: 'starter' as const,
        customUserLimit: '',
        customTierPrice: '',
        billingCycle: 'monthly' as const,
        trialDays: '14',
    };

    const activeLoc = locations.find(l => l.id === activeLocationId);

    const { control, handleSubmit, watch, reset } = useForm<LocationTierFormData>({
        resolver: zodResolver(locationTierSchema),
        defaultValues: {
            userTier: activeEntry.userTier,
            customUserLimit: activeEntry.customUserLimit,
            customTierPrice: activeEntry.customTierPrice,
            billingCycle: activeEntry.billingCycle,
            trialDays: activeEntry.trialDays,
        },
    });

    // Re-sync form when switching locations
    useEffect(() => {
        const entry = locationCommercial[activeLocationId];
        if (entry) {
            reset({
                userTier: entry.userTier,
                customUserLimit: entry.customUserLimit,
                customTierPrice: entry.customTierPrice,
                billingCycle: entry.billingCycle,
                trialDays: entry.trialDays,
            });
        }
    }, [activeLocationId, locationCommercial, reset]);

    const userTier = watch('userTier');
    const billingCycle = watch('billingCycle');
    const customTierPrice = watch('customTierPrice');

    const currentTier = USER_TIERS.find(t => t.key === userTier);

    // Module cost for this location
    const { resolved: resolvedModuleIds } = resolveModuleDependencies(
        activeEntry.moduleIds,
        MODULE_CATALOGUE
    );
    const moduleCost = resolvedModuleIds.reduce((sum, id) => {
        const mod = MODULE_CATALOGUE.find(m => m.id === id);
        const custom = activeEntry.customModulePricing[id];
        return sum + (custom ?? mod?.price ?? 0);
    }, 0);

    const tierBaseCost = userTier === 'custom'
        ? parseInt(customTierPrice || '0') || 0
        : currentTier?.basePrice ?? 0;

    const locationMonthly = moduleCost + tierBaseCost;
    const locationAnnual = locationMonthly * 10;

    // Grand totals across all locations
    const grandMonthly = locations.reduce((sum, loc) => {
        const entry = locationCommercial[loc.id];
        if (!entry) return sum;
        const { resolved } = resolveModuleDependencies(entry.moduleIds, MODULE_CATALOGUE);
        const modCost = resolved.reduce((s, id) => {
            const mod = MODULE_CATALOGUE.find(m => m.id === id);
            return s + (entry.customModulePricing[id] ?? mod?.price ?? 0);
        }, 0);
        const tier = USER_TIERS.find(t => t.key === entry.userTier);
        const tierCost = entry.userTier === 'custom'
            ? parseInt(entry.customTierPrice || '0') || 0
            : tier?.basePrice ?? 0;
        return sum + modCost + tierCost;
    }, 0);
    const grandAnnual = grandMonthly * 10;

    const onSubmit = (data: LocationTierFormData) => {
        // Save current location's tier data before advancing
        setLocationCommercial(activeLocationId, {
            userTier: data.userTier as any,
            customUserLimit: data.customUserLimit || '',
            customTierPrice: data.customTierPrice || '',
            billingCycle: data.billingCycle,
            trialDays: data.trialDays || '14',
        });
        goNext();
        document.getElementById('wizard-content')?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const saveAndSwitchLocation = (newLocationId: string) => {
        // Auto-save current form state before switching
        const values = control._formValues as LocationTierFormData;
        setLocationCommercial(activeLocationId, {
            userTier: (values.userTier as any) || 'starter',
            customUserLimit: values.customUserLimit || '',
            customTierPrice: values.customTierPrice || '',
            billingCycle: values.billingCycle || 'monthly',
            trialDays: values.trialDays || '14',
        });
        setActiveLocationId(newLocationId);
    };

    return (
        <form id="wizard-step-form" onSubmit={handleSubmit(onSubmit)} className="space-y-0 animate-in fade-in slide-in-from-right-3 duration-300 pb-10">

            <InfoBanner variant="info" className="mb-5">
                <strong>Per-location billing:</strong> Each location has its own user tier and billing cycle.
                Annual billing applies a 2-month discount per location.
            </InfoBanner>

            {/* Location Tabs (multi-location only) */}
            {strategyConfig.multiLocationMode && locations.length > 0 && (
                <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-2 mb-1 overflow-x-auto">
                    <div className="flex gap-2 min-w-max">
                        {locations.map((loc) => {
                            const entry = locationCommercial[loc.id];
                            const hasTier = entry && entry.userTier !== 'starter';
                            return (
                                <button
                                    key={loc.id}
                                    type="button"
                                    onClick={() => saveAndSwitchLocation(loc.id)}
                                    className={cn(
                                        'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap',
                                        loc.id === activeLocationId
                                            ? 'bg-primary-600 text-white shadow-sm'
                                            : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                                    )}
                                >
                                    {hasTier && (
                                        <Check
                                            size={11}
                                            strokeWidth={3}
                                            className={loc.id === activeLocationId ? 'text-white' : 'text-success-500'}
                                        />
                                    )}
                                    {loc.name || `Location ${locations.indexOf(loc) + 1}`}
                                    {loc.isHQ && (
                                        <span className={cn(
                                            'text-[10px]',
                                            loc.id === activeLocationId ? 'opacity-70' : 'text-neutral-400 dark:text-neutral-500'
                                        )}>HQ</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Active location header */}
            {activeLoc && (
                <div className="px-1 mb-1">
                    <p className="text-sm font-bold text-primary-950 dark:text-white">
                        {activeLoc.name || 'Location'} — User Tier & Billing
                    </p>
                </div>
            )}

            {/* Tier Selection */}
            <SectionCard
                title="Select User Tier"
                subtitle={`Choose the tier matching ${activeLoc?.name || 'this location'}'s expected concurrent user count`}
            >
                <Controller name="userTier" control={control} render={({ field }) => (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {USER_TIERS.map((tier) => {
                            const selected = field.value === tier.key;
                            return (
                                <button
                                    key={tier.key}
                                    type="button"
                                    onClick={() => field.onChange(tier.key)}
                                    className={cn(
                                        'relative flex flex-col items-start text-left p-5 rounded-2xl border-2 transition-all duration-200',
                                        selected
                                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 shadow-lg shadow-primary-500/10'
                                            : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-primary-200 dark:hover:border-primary-800/50 hover:bg-primary-50/30'
                                    )}
                                >
                                    {tier.popular && (
                                        <div className="absolute -top-2.5 left-4 px-3 py-0.5 rounded-full bg-gradient-to-r from-primary-600 to-accent-600 text-white text-[10px] font-bold flex items-center gap-1">
                                            <Star size={8} fill="white" /> MOST POPULAR
                                        </div>
                                    )}
                                    {selected && (
                                        <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center">
                                            <Check size={11} strokeWidth={3} className="text-white" />
                                        </div>
                                    )}
                                    <div className="mb-3">
                                        <span className={cn(
                                            'text-xs font-bold px-2.5 py-1 rounded-lg mb-2 inline-block',
                                            selected
                                                ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400'
                                                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                                        )}>
                                            {tier.label}
                                        </span>
                                        <p className="text-lg font-bold text-primary-950 mt-2 dark:text-white">{tier.range}</p>
                                        <p className="text-xs text-neutral-500 mt-1 dark:text-neutral-400">{tier.description}</p>
                                    </div>
                                    {tier.key !== 'custom' ? (
                                        <div className="mt-auto">
                                            <p className="text-2xl font-bold text-primary-800 dark:text-primary-300">
                                                ₹{tier.basePrice.toLocaleString('en-IN')}
                                            </p>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                                /month base + ₹{tier.perUserPrice}/user
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="mt-auto">
                                            <p className="text-lg font-bold text-accent-700">Negotiated Pricing</p>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400">Contact Avyren for custom quote</p>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )} />

                {/* Custom tier inputs */}
                {userTier === 'custom' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 animate-in fade-in duration-200">
                        <Controller name="customUserLimit" control={control} render={({ field, fieldState }) => (
                            <FormInput
                                label="Custom User Limit"
                                placeholder="e.g. 2500"
                                {...field}
                                value={field.value || ''}
                                type="number"
                                required
                                hint="Maximum concurrent users for this location"
                                error={fieldState.error?.message}
                            />
                        )} />
                        <Controller name="customTierPrice" control={control} render={({ field, fieldState }) => (
                            <FormInput
                                label="Custom Monthly Tier Price (₹)"
                                placeholder="e.g. 60000"
                                {...field}
                                value={field.value || ''}
                                type="number"
                                required
                                hint="Negotiated monthly tier base price; excludes module costs"
                                error={fieldState.error?.message}
                            />
                        )} />
                    </div>
                )}
            </SectionCard>

            {/* Billing Cycle */}
            <SectionCard title="Billing Cycle" subtitle="Annual billing includes a 2-month discount (pay for 10, get 12)">
                <Controller name="billingCycle" control={control} render={({ field }) => (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => field.onChange('monthly')}
                            className={cn(
                                'flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-200',
                                field.value === 'monthly'
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 shadow-sm'
                                    : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-primary-200 dark:hover:border-primary-800/50'
                            )}
                        >
                            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-lg dark:bg-primary-900/40">📅</div>
                            <div>
                                <p className="text-sm font-bold text-primary-950 dark:text-white">Monthly Billing</p>
                                <p className="text-xs text-neutral-500 mt-0.5 dark:text-neutral-400">Billed every month. Cancel anytime.</p>
                            </div>
                            {field.value === 'monthly' && <Check size={16} className="ml-auto text-primary-600 flex-shrink-0" />}
                        </button>

                        <button
                            type="button"
                            onClick={() => field.onChange('annual')}
                            className={cn(
                                'relative flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-200',
                                field.value === 'annual'
                                    ? 'border-success-500 bg-success-50 dark:bg-success-900/20 shadow-sm'
                                    : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-success-200 dark:hover:border-success-800/50'
                            )}
                        >
                            <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-success-500 text-white text-[10px] font-bold flex items-center gap-1">
                                <Zap size={8} fill="white" /> SAVE 2 MONTHS
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-success-100 flex items-center justify-center text-lg dark:bg-success-900/30">📆</div>
                            <div>
                                <p className="text-sm font-bold text-primary-950 dark:text-white">Annual Billing</p>
                                <p className="text-xs text-neutral-500 mt-0.5 dark:text-neutral-400">Billed once per year. 2 months free.</p>
                            </div>
                            {field.value === 'annual' && <Check size={16} className="ml-auto text-success-600 flex-shrink-0" />}
                        </button>
                    </div>
                )} />
            </SectionCard>

            {/* Trial Days */}
            <SectionCard title="Trial Period" subtitle="Free trial days before billing begins (standard: 14 days)">
                <Controller name="trialDays" control={control} render={({ field, fieldState }) => (
                    <div className="flex items-center gap-4">
                        <FormInput
                            label="Trial Days"
                            placeholder="14"
                            type="number"
                            {...field}
                            value={field.value || ''}
                            hint="After trial, billing activates automatically unless cancelled"
                            className="max-w-[200px]"
                            error={fieldState.error?.message}
                        />
                        <div className="bg-primary-50 border border-primary-200 rounded-xl px-4 py-3 dark:bg-primary-900/30 dark:border-primary-800/50">
                            <p className="text-xs font-bold text-primary-800 dark:text-primary-300">14 days = Standard trial</p>
                            <p className="text-xs text-primary-600 dark:text-primary-400">Set to 0 to skip trial (for managed onboarding)</p>
                        </div>
                    </div>
                )} />
            </SectionCard>

            {/* Location Pricing Summary */}
            <SectionCard
                title={`${activeLoc?.name || 'Location'} — Pricing Summary`}
                subtitle="Module costs + tier for this location"
                accent="success"
            >
                <div className="space-y-3">
                    {resolvedModuleIds.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider dark:text-neutral-400">Modules</p>
                            {resolvedModuleIds.map((id) => {
                                const mod = MODULE_CATALOGUE.find(m => m.id === id);
                                if (!mod) return null;
                                const price = activeEntry.customModulePricing[id] ?? mod.price;
                                return (
                                    <div key={id} className="flex items-center justify-between text-sm">
                                        <span className="text-neutral-700 dark:text-neutral-300">{mod.icon} {mod.name}</span>
                                        <span className="font-semibold text-primary-800 dark:text-primary-300">₹{price.toLocaleString('en-IN')}</span>
                                    </div>
                                );
                            })}
                            <div className="border-t border-neutral-100 pt-2 flex items-center justify-between text-sm font-bold dark:border-neutral-800">
                                <span className="text-neutral-700 dark:text-neutral-300">Modules Subtotal</span>
                                <span className="text-primary-800 dark:text-primary-300">₹{moduleCost.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    )}

                    {currentTier && (
                        <div className="space-y-2">
                            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider dark:text-neutral-400">User Tier</p>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-neutral-700 dark:text-neutral-300">{currentTier.label} Tier ({currentTier.range})</span>
                                <span className="font-semibold text-primary-800 dark:text-primary-300">
                                    {userTier === 'custom'
                                        ? `₹${parseInt(customTierPrice || '0').toLocaleString('en-IN')}`
                                        : `₹${tierBaseCost.toLocaleString('en-IN')}`}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="border-t-2 border-primary-200 pt-3 flex items-center justify-between dark:border-primary-800/50">
                        <div>
                            <p className="text-base font-bold text-primary-950 dark:text-white">
                                {activeLoc?.name || 'Location'} — {billingCycle === 'annual' ? 'Annual' : 'Monthly'}
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                {billingCycle === 'annual'
                                    ? `₹${locationAnnual.toLocaleString('en-IN')}/year (2 months free)`
                                    : 'Billed monthly'}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-3xl font-bold text-primary-600">
                                ₹{(billingCycle === 'annual' ? locationAnnual : locationMonthly).toLocaleString('en-IN')}
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                {billingCycle === 'annual' ? '/year' : '/month'}
                            </p>
                        </div>
                    </div>
                </div>
            </SectionCard>

            {/* Grand Totals Panel (multi-location) */}
            {strategyConfig.multiLocationMode && locations.length > 1 && (
                <SectionCard
                    title="Grand Total — All Locations"
                    subtitle="Aggregated billing across all configured locations"
                >
                    <div className="space-y-3">
                        {locations.map((loc) => {
                            const entry = locationCommercial[loc.id];
                            if (!entry) return null;
                            const { resolved } = resolveModuleDependencies(entry.moduleIds, MODULE_CATALOGUE);
                            const locModCost = resolved.reduce((s, id) => {
                                const mod = MODULE_CATALOGUE.find(m => m.id === id);
                                return s + (entry.customModulePricing[id] ?? mod?.price ?? 0);
                            }, 0);
                            const locTier = USER_TIERS.find(t => t.key === entry.userTier);
                            const locTierCost = entry.userTier === 'custom'
                                ? parseInt(entry.customTierPrice || '0') || 0
                                : locTier?.basePrice ?? 0;
                            const locTotal = locModCost + locTierCost;
                            const locAnnual = locTotal * 10;

                            return (
                                <div key={loc.id} className="flex items-center justify-between text-sm py-2 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                                    <div>
                                        <p className="font-semibold text-primary-950 dark:text-white">
                                            {loc.name || `Location ${locations.indexOf(loc) + 1}`}
                                            {loc.isHQ && <span className="ml-1.5 text-[10px] text-neutral-400">HQ</span>}
                                        </p>
                                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                            {resolved.length} module{resolved.length !== 1 ? 's' : ''} · {locTier?.label || entry.userTier} tier · {entry.billingCycle}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-primary-800 dark:text-primary-300">
                                            ₹{(entry.billingCycle === 'annual' ? locAnnual : locTotal).toLocaleString('en-IN')}
                                        </p>
                                        <p className="text-xs text-neutral-400 dark:text-neutral-500">
                                            /{entry.billingCycle === 'annual' ? 'year' : 'month'}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}

                        <div className="bg-primary-950 rounded-xl px-5 py-4 flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2">
                                <TrendingUp size={16} className="text-primary-300" />
                                <div>
                                    <p className="text-sm font-bold text-white">Grand Total (Monthly)</p>
                                    <p className="text-xs text-primary-300">If all locations billed monthly</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-white">₹{grandMonthly.toLocaleString('en-IN')}</p>
                                <p className="text-xs text-primary-300">Annual equivalent: ₹{grandAnnual.toLocaleString('en-IN')}</p>
                            </div>
                        </div>
                    </div>
                </SectionCard>
            )}
        </form>
    );
}
