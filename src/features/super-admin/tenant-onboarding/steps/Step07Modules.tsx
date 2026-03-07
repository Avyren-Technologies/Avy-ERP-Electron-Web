// Step 07 — Module Selection (WEB EXCLUSIVE — MISSING FROM MOBILE)
// Full module catalogue with dependency auto-resolution and custom pricing
import { cn } from '@/lib/utils';
import { Check, Plus, Minus, AlertTriangle, Lock } from 'lucide-react';
import { SectionCard, InfoBanner } from '../atoms';
import { MODULE_CATALOGUE, resolveModuleDependencies } from '../constants';
import { useTenantOnboardingStore } from '../store';

export function Step07Modules() {
    const { step7, toggleModule, setModuleCustomPrice } = useTenantOnboardingStore();

    const { resolved, auto } = resolveModuleDependencies(step7.selectedModuleIds, MODULE_CATALOGUE);

    const totalMonthly = resolved.reduce((sum, id) => {
        const mod = MODULE_CATALOGUE.find((m) => m.id === id);
        if (!mod) return sum;
        return sum + (step7.customModulePricing[id] ?? mod.price);
    }, 0);

    const handleToggle = (id: string) => {
        // If it's auto-added as a dependency, don't allow toggling off directly
        if (auto.includes(id) && !step7.selectedModuleIds.includes(id)) return;
        toggleModule(id);
    };

    const isAutoAdded = (id: string) => auto.includes(id) && !step7.selectedModuleIds.includes(id);
    const isSelected = (id: string) => resolved.includes(id);
  
    return (
        <div className="space-y-0 animate-in fade-in slide-in-from-right-3 duration-300">

            <InfoBanner variant="info" className="mb-5">
                Select the modules this company will use. Dependencies are resolved automatically and shown below each module.
                You can override the default price for custom enterprise deals.
            </InfoBanner>

            {/* Summary bar */}
            <div className="flex items-center justify-between bg-primary-950 text-white px-6 py-4 rounded-2xl mb-5">
                <div>
                    <p className="text-sm font-bold">
                        {resolved.length} module{resolved.length !== 1 ? 's' : ''} selected
                        {auto.length > 0 && (
                            <span className="ml-2 text-primary-300 font-normal">
                                (incl. {auto.length} auto-dependency)
                            </span>
                        )}
                    </p>
                    <p className="text-xs text-primary-300 mt-0.5">
                        Module subscription cost (module tier billed separately on next step)
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold">₹{totalMonthly.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-primary-300">per month</p>
                </div>
            </div>

            {/* Module Grid */}
            <SectionCard title="Module Catalogue" subtitle="All active modules for this ERP platform — select what the company needs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {MODULE_CATALOGUE.map((mod) => {
                        const selected = isSelected(mod.id);
                        const depAutoAdded = isAutoAdded(mod.id);
                        const userSelected = step7.selectedModuleIds.includes(mod.id);
                        const customPrice = step7.customModulePricing[mod.id];

                        return (
                            <div
                                key={mod.id}
                                className={cn(
                                    'relative rounded-2xl border-2 transition-all duration-200 overflow-hidden',
                                    selected && !depAutoAdded
                                        ? 'border-primary-500 bg-primary-50'
                                        : selected && depAutoAdded
                                            ? 'border-accent-400 bg-accent-50/50'
                                            : 'border-neutral-200 bg-white hover:border-primary-200'
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
                                            <p className="text-sm font-bold text-primary-950">{mod.name}</p>
                                            <p className="text-xs text-neutral-500 leading-4 mt-0.5">{mod.description}</p>
                                        </div>
                                    </div>

                                    {/* Dependencies */}
                                    {mod.dependencies && mod.dependencies.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mb-3">
                                            <span className="text-[10px] text-neutral-400 mt-0.5">Requires:</span>
                                            {mod.dependencies.map((dep) => {
                                                const depMod = MODULE_CATALOGUE.find((m) => m.id === dep);
                                                return (
                                                    <span key={dep} className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600">
                                                        {depMod?.icon} {depMod?.name}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Pricing row */}
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-primary-800">
                                                ₹{(customPrice ?? mod.price).toLocaleString('en-IN')}
                                                <span className="text-xs font-normal text-neutral-500">/month</span>
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
                                                        ? 'bg-danger-50 text-danger-600 border-danger-200 hover:bg-danger-100'
                                                        : 'bg-primary-600 text-white border-primary-600 hover:bg-primary-700 shadow-sm'
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
                                    <div className="border-t border-neutral-100 px-4 py-3 bg-white/70">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-neutral-500 whitespace-nowrap">Custom Price Override:</span>
                                            <div className="relative flex-1 max-w-[140px]">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">₹</span>
                                                <input
                                                    type="number"
                                                    placeholder={String(mod.price)}
                                                    value={customPrice ?? ''}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value);
                                                        if (!isNaN(val)) setModuleCustomPrice(mod.id, val);
                                                        else if (e.target.value === '') {
                                                            const next = { ...step7.customModulePricing };
                                                            delete next[mod.id];
                                                            // reset — user cleared the override
                                                        }
                                                    }}
                                                    className="w-full rounded-lg border border-neutral-200 bg-neutral-50 pl-7 pr-3 py-1.5 text-xs text-neutral-800
                            focus:outline-none focus:ring-1 focus:ring-primary-400/40 focus:border-primary-400
                            [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                            </div>
                                            <span className="text-xs text-neutral-400">/mo</span>
                                            {customPrice !== undefined && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const next = { ...step7.customModulePricing };
                                                        delete next[mod.id];
                                                        useTenantOnboardingStore.getState().setStep7({ customModulePricing: next });
                                                    }}
                                                    className="text-[10px] text-danger-500 hover:text-danger-700 font-bold"
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
            </SectionCard>

            {/* Dependency alert */}
            {auto.length > 0 && (
                <SectionCard title="Auto-Included Dependencies" subtitle="These modules were automatically added because a selected module requires them">
                    <div className="space-y-2">
                        {auto.map((id) => {
                            const depMod = MODULE_CATALOGUE.find((m) => m.id === id);
                            if (!depMod) return null;
                            const requiredBy = MODULE_CATALOGUE
                                .filter((m) => step7.selectedModuleIds.includes(m.id) && m.dependencies?.includes(id))
                                .map((m) => m.name);
                            return (
                                <div key={id} className="flex items-center gap-3 bg-accent-50 border border-accent-200 rounded-xl px-4 py-3">
                                    <span className="text-lg">{depMod.icon}</span>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-primary-950">{depMod.name}</p>
                                        <p className="text-xs text-neutral-600">
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
        </div>
    );
}
