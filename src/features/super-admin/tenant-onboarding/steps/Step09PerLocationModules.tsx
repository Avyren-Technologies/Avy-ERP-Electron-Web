// Step 09 — Per-Location Module Selection
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { Check, Copy, Lock, AlertTriangle, Plus, Minus } from 'lucide-react';
import { SectionCard, InfoBanner } from '../atoms';
import { MODULE_CATALOGUE, resolveModuleDependencies } from '../constants';
import { useTenantOnboardingStore } from '../store';

export function Step09PerLocationModules({ onConfirmSubmit }: { onConfirmSubmit?: () => void }) {
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

    // Ensure activeLocationId is valid after locations change
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

    const { resolved: resolvedModuleIds, auto: autoModuleIds } = resolveModuleDependencies(
        activeEntry.moduleIds,
        MODULE_CATALOGUE
    );

    const isSelected = (id: string) => resolvedModuleIds.includes(id);
    const isAutoAdded = (id: string) => autoModuleIds.includes(id) && !activeEntry.moduleIds.includes(id);

    const handleToggle = (moduleId: string) => {
        if (isAutoAdded(moduleId)) return;
        const current = activeEntry.moduleIds;
        let next: string[];
        if (current.includes(moduleId)) {
            next = current.filter(id => id !== moduleId);
        } else {
            next = [...current, moduleId];
        }
        setLocationCommercial(activeLocationId, { moduleIds: next });
    };

    const handleCustomPrice = (moduleId: string, price: string) => {
        const val = parseInt(price);
        if (!isNaN(val) && val > 0) {
            setLocationCommercial(activeLocationId, {
                customModulePricing: { ...activeEntry.customModulePricing, [moduleId]: val },
            });
        } else if (price === '') {
            const next = { ...activeEntry.customModulePricing };
            delete next[moduleId];
            setLocationCommercial(activeLocationId, { customModulePricing: next });
        }
    };

    const copyToAllLocations = () => {
        for (const loc of locations) {
            if (loc.id !== activeLocationId) {
                setLocationCommercial(loc.id, {
                    moduleIds: [...activeEntry.moduleIds],
                    customModulePricing: { ...activeEntry.customModulePricing },
                });
            }
        }
    };

    const activeLoc = locations.find(l => l.id === activeLocationId);

    // Calculate monthly total for the active location
    const monthlyTotal = resolvedModuleIds.reduce((sum, id) => {
        const mod = MODULE_CATALOGUE.find(m => m.id === id);
        if (!mod) return sum;
        return sum + (activeEntry.customModulePricing[id] ?? mod.price);
    }, 0);

    const { handleSubmit } = useForm();
    const onSubmit = () => {
        goNext();
        document.getElementById('wizard-content')?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <form id="wizard-step-form" onSubmit={handleSubmit(onSubmit)} className="space-y-0 animate-in fade-in slide-in-from-right-3 duration-300 pb-10">

            <InfoBanner variant="info" className="mb-5">
                <strong>Per-location billing:</strong> Module subscriptions are independent per location.
                Each active location must have at least one module selected.
                Dependencies are resolved automatically.
            </InfoBanner>

            {/* Location Tabs (multi-location only) */}
            {strategyConfig.multiLocationMode && locations.length > 0 && (
                <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-2 mb-1 overflow-x-auto">
                    <div className="flex gap-2 min-w-max">
                        {locations.map((loc) => {
                            const entry = locationCommercial[loc.id];
                            const { resolved: locResolved } = resolveModuleDependencies(
                                entry?.moduleIds ?? [],
                                MODULE_CATALOGUE
                            );
                            const hasModules = locResolved.length > 0;
                            return (
                                <button
                                    key={loc.id}
                                    type="button"
                                    onClick={() => setActiveLocationId(loc.id)}
                                    className={cn(
                                        'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap',
                                        loc.id === activeLocationId
                                            ? 'bg-primary-600 text-white shadow-sm'
                                            : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                                    )}
                                >
                                    {hasModules && (
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

            {/* Active location header + copy button */}
            {activeLoc && (
                <div className="flex items-center justify-between mb-1 px-1">
                    <p className="text-sm font-bold text-primary-950 dark:text-white">
                        {activeLoc.name || 'Location'} — Module Selection
                    </p>
                    {strategyConfig.multiLocationMode && locations.length > 1 && (
                        <button
                            type="button"
                            onClick={copyToAllLocations}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                        >
                            <Copy size={11} />
                            Copy to All Locations
                        </button>
                    )}
                </div>
            )}

            {/* Summary bar */}
            <div className="flex items-center justify-between bg-primary-950 text-white px-6 py-4 rounded-2xl mb-5">
                <div>
                    <p className="text-sm font-bold">
                        {resolvedModuleIds.length} module{resolvedModuleIds.length !== 1 ? 's' : ''} selected
                        {autoModuleIds.length > 0 && (
                            <span className="ml-2 text-primary-300 font-normal">
                                (incl. {autoModuleIds.length} auto-dependency)
                            </span>
                        )}
                    </p>
                    <p className="text-xs text-primary-300 mt-0.5">
                        {activeLoc?.name || 'Location'} — module subscription cost
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold">₹{monthlyTotal.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-primary-300">per month</p>
                </div>
            </div>

            {/* Module Catalogue */}
            <SectionCard
                title="Module Catalogue"
                subtitle={`Select modules for ${activeLoc?.name || 'this location'}. Dependencies are auto-resolved.`}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {MODULE_CATALOGUE.map((mod) => {
                        const selected = isSelected(mod.id);
                        const depAutoAdded = isAutoAdded(mod.id);
                        const userSelected = activeEntry.moduleIds.includes(mod.id);
                        const customPrice = activeEntry.customModulePricing[mod.id];

                        return (
                            <div
                                key={mod.id}
                                className={cn(
                                    'relative rounded-2xl border-2 transition-all duration-200 overflow-hidden',
                                    selected && !depAutoAdded
                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                                        : selected && depAutoAdded
                                            ? 'border-accent-400 bg-accent-50/50'
                                            : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-primary-200 dark:hover:border-primary-800/50'
                                )}
                            >
                                <div className="p-4">
                                    {/* Auto-dep badge */}
                                    {depAutoAdded && (
                                        <div className="absolute top-3 right-3">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-accent-100 text-accent-700 flex items-center gap-1">
                                                <Lock size={9} /> Auto-dependency
                                            </span>
                                        </div>
                                    )}
                                    {userSelected && !depAutoAdded && (
                                        <div className="absolute top-3 right-3">
                                            <Check size={16} className="text-primary-600" />
                                        </div>
                                    )}

                                    {/* Module header */}
                                    <div className="flex items-start gap-3 mb-3">
                                        <span className="text-2xl">{mod.icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-primary-950 dark:text-white">{mod.name}</p>
                                            <p className="text-xs text-neutral-500 leading-4 mt-0.5 dark:text-neutral-400">{mod.description}</p>
                                        </div>
                                    </div>

                                    {/* Dependencies */}
                                    {mod.dependencies && mod.dependencies.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mb-3">
                                            <span className="text-[10px] text-neutral-400 mt-0.5 dark:text-neutral-500">Requires:</span>
                                            {mod.dependencies.map((dep) => {
                                                const depMod = MODULE_CATALOGUE.find((m) => m.id === dep);
                                                return (
                                                    <span key={dep} className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                                                        {depMod?.icon} {depMod?.name}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Pricing row */}
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-primary-800 dark:text-primary-300">
                                                ₹{(customPrice ?? mod.price).toLocaleString('en-IN')}
                                                <span className="text-xs font-normal text-neutral-500 dark:text-neutral-400">/month</span>
                                            </p>
                                            {customPrice !== undefined && (
                                                <p className="text-[10px] text-warning-600">Standard: ₹{mod.price.toLocaleString('en-IN')}</p>
                                            )}
                                        </div>

                                        {!depAutoAdded ? (
                                            <button
                                                type="button"
                                                onClick={() => handleToggle(mod.id)}
                                                className={cn(
                                                    'flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-150',
                                                    userSelected
                                                        ? 'bg-danger-50 dark:bg-danger-900/20 text-danger-600 border-danger-200 dark:border-danger-800/50 hover:bg-danger-100'
                                                        : 'bg-primary-600 text-white border-primary-600 dark:border-primary-500 hover:bg-primary-700 shadow-sm'
                                                )}
                                            >
                                                {userSelected ? <><Minus size={12} /> Remove</> : <><Plus size={12} /> Add</>}
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-accent-100 border border-accent-200">
                                                <Lock size={11} className="text-accent-600" />
                                                <span className="text-xs font-bold text-accent-700">Included</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Custom pricing input (shows when selected) */}
                                {selected && (
                                    <div className="border-t border-neutral-100 dark:border-neutral-800 px-4 py-3 bg-white/70 dark:bg-neutral-900/70">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-neutral-500 whitespace-nowrap dark:text-neutral-400">Custom Price Override:</span>
                                            <div className="relative flex-1 max-w-[140px]">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 dark:text-neutral-500">₹</span>
                                                <input
                                                    type="number"
                                                    placeholder={String(mod.price)}
                                                    value={customPrice ?? ''}
                                                    onChange={(e) => handleCustomPrice(mod.id, e.target.value)}
                                                    className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 pl-7 pr-3 py-1.5 text-xs text-neutral-800 dark:text-neutral-200
                                                        focus:outline-none focus:ring-1 focus:ring-primary-400/40 focus:border-primary-400
                                                        [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                            </div>
                                            <span className="text-xs text-neutral-400 dark:text-neutral-500">/mo</span>
                                            {customPrice !== undefined && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleCustomPrice(mod.id, '')}
                                                    className="text-[10px] text-danger-500 hover:text-danger-700 font-bold dark:text-danger-400"
                                                >
                                                    Reset
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Location total */}
                {resolvedModuleIds.length > 0 && (
                    <div className="mt-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl px-4 py-3 flex items-center justify-between">
                        <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                            {activeLoc?.name || 'Location'} — {resolvedModuleIds.length} module{resolvedModuleIds.length > 1 ? 's' : ''}
                        </p>
                        <p className="text-sm font-bold text-primary-700 dark:text-primary-400">
                            ₹{monthlyTotal.toLocaleString('en-IN')}/mo
                        </p>
                    </div>
                )}
            </SectionCard>

            {/* Auto-dependency section */}
            {autoModuleIds.length > 0 && (
                <SectionCard title="Auto-Included Dependencies" subtitle="These modules were automatically added because a selected module requires them">
                    <div className="space-y-2">
                        {autoModuleIds.map((id) => {
                            const depMod = MODULE_CATALOGUE.find((m) => m.id === id);
                            if (!depMod) return null;
                            const requiredBy = MODULE_CATALOGUE
                                .filter((m) => activeEntry.moduleIds.includes(m.id) && m.dependencies?.includes(id))
                                .map((m) => m.name);
                            return (
                                <div key={id} className="flex items-center gap-3 bg-accent-50 border border-accent-200 rounded-xl px-4 py-3">
                                    <span className="text-lg">{depMod.icon}</span>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-primary-950 dark:text-white">{depMod.name}</p>
                                        <p className="text-xs text-neutral-600 dark:text-neutral-300">
                                            Required by: {requiredBy.join(', ')}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 text-accent-700">
                                        <AlertTriangle size={14} />
                                        <span className="text-xs font-bold">Auto-added</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </SectionCard>
            )}
        </form>
    );
}
