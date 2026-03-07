// Step 08 — User Tier & Pricing (WEB EXCLUSIVE — MISSING FROM MOBILE)
// PRD Section 7.2 — Starter / Growth / Scale / Enterprise / Custom

import { cn } from '@/lib/utils';
import { Star, Check, Zap } from 'lucide-react';
import { SectionCard, FormInput, InfoBanner } from '../atoms';
import { USER_TIERS, MODULE_CATALOGUE, resolveModuleDependencies } from '../constants';
import { useTenantOnboardingStore } from '../store';

export function Step08UserTier() {
    const { step7, step8, setStep8 } = useTenantOnboardingStore();

    const currentTier = USER_TIERS.find((t) => t.key === step8.userTier);

    // Calculate total pricing
    const { resolved } = resolveModuleDependencies(step7.selectedModuleIds, MODULE_CATALOGUE);
    const moduleCost = resolved.reduce((sum, id) => {
        const mod = MODULE_CATALOGUE.find((m) => m.id === id);
        const custom = step7.customModulePricing[id];
        return sum + (custom ?? mod?.price ?? 0);
    }, 0);

    const tierBaseCost = step8.userTier === 'custom'
        ? parseInt(step8.customTierPrice || '0') || 0
        : currentTier?.basePrice ?? 0;

    const totalMonthly = moduleCost + tierBaseCost;
    const totalAnnual = totalMonthly * 10; // 2-month discount for annual

    return (
        <div className="space-y-0 animate-in fade-in slide-in-from-right-3 duration-300">

            <InfoBanner variant="info" className="mb-5">
                <strong>User Tier</strong> determines the maximum number of concurrent users allowed for this tenant.
                If active users exceed the subscribed tier's ceiling, additional billing applies automatically and the
                Company-Admin is notified.
            </InfoBanner>

            {/* Tier Selection */}
            <SectionCard title="Select User Tier" subtitle="Choose the tier matching the company's expected concurrent user count">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {USER_TIERS.map((tier) => {
                        const selected = step8.userTier === tier.key;

                        return (
                            <button
                                key={tier.key}
                                type="button"
                                onClick={() => setStep8({ userTier: tier.key as typeof step8.userTier })}
                                className={cn(
                                    'relative flex flex-col items-start text-left p-5 rounded-2xl border-2 transition-all duration-200',
                                    selected
                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 shadow-lg shadow-primary-500/10'
                                        : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-primary-200 dark:border-primary-800/50 hover:bg-primary-50/30'
                                )}
                            >
                                {/* Popular badge */}
                                {tier.popular && (
                                    <div className="absolute -top-2.5 left-4 px-3 py-0.5 rounded-full bg-gradient-to-r from-primary-600 to-accent-600 text-white text-[10px] font-bold flex items-center gap-1">
                                        <Star size={8} fill="white" /> MOST POPULAR
                                    </div>
                                )}

                                {/* Selected indicator */}
                                {selected && (
                                    <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center">
                                        <Check size={11} strokeWidth={3} className="text-white" />
                                    </div>
                                )}

                                {/* Tier info */}
                                <div className="mb-3">
                                    <span
                                        className={cn(
                                            'text-xs font-bold px-2.5 py-1 rounded-lg mb-2 inline-block',
                                            selected ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                                        )}
                                    >
                                        {tier.label}
                                    </span>
                                    <p className="text-lg font-bold text-primary-950 mt-2 dark:text-white">{tier.range}</p>
                                    <p className="text-xs text-neutral-500 mt-1 dark:text-neutral-400">{tier.description}</p>
                                </div>

                                {/* Pricing */}
                                {tier.key !== 'custom' ? (
                                    <div className="mt-auto">
                                        <p className="text-2xl font-bold text-primary-800 dark:text-primary-300">
                                            ₹{tier.basePrice.toLocaleString('en-IN')}
                                        </p>
                                        <p className="text-xs text-neutral-500 dark:text-neutral-400">/month base + ₹{tier.perUserPrice}/user</p>
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

                {/* Custom tier inputs */}
                {step8.userTier === 'custom' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 animate-in fade-in duration-200">
                        <FormInput
                            label="Custom User Limit"
                            placeholder="e.g. 2500"
                            value={step8.customUserLimit}
                            onChange={(v) => setStep8({ customUserLimit: v })}
                            type="number"
                            required
                            hint="Maximum concurrent users for this tenant"
                        />
                        <FormInput
                            label="Custom Monthly Tier Price (₹)"
                            placeholder="e.g. 60000"
                            value={step8.customTierPrice}
                            onChange={(v) => setStep8({ customTierPrice: v })}
                            type="number"
                            required
                            hint="Negotiated monthly tier base price; excludes module costs"
                        />
                    </div>
                )}
            </SectionCard>

            {/* Billing Cycle */}
            <SectionCard title="Billing Cycle" subtitle="Annual billing includes a 2-month discount (pay for 10, get 12)">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                        type="button"
                        onClick={() => setStep8({ billingCycle: 'monthly' })}
                        className={cn(
                            'flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-200',
                            step8.billingCycle === 'monthly'
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 shadow-sm'
                                : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-primary-200 dark:border-primary-800/50'
                        )}
                    >
                        <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-lg dark:bg-primary-900/40">📅</div>
                        <div>
                            <p className="text-sm font-bold text-primary-950 dark:text-white">Monthly Billing</p>
                            <p className="text-xs text-neutral-500 mt-0.5 dark:text-neutral-400">Billed every month. Cancel anytime.</p>
                        </div>
                        {step8.billingCycle === 'monthly' && <Check size={16} className="ml-auto text-primary-600 flex-shrink-0" />}
                    </button>

                    <button
                        type="button"
                        onClick={() => setStep8({ billingCycle: 'annual' })}
                        className={cn(
                            'relative flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-200',
                            step8.billingCycle === 'annual'
                                ? 'border-success-500 bg-success-50 dark:bg-success-900/20 shadow-sm'
                                : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-success-200 dark:border-success-800/50'
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
                        {step8.billingCycle === 'annual' && <Check size={16} className="ml-auto text-success-600 flex-shrink-0" />}
                    </button>
                </div>
            </SectionCard>

            {/* Trial Days */}
            <SectionCard title="Trial Period" subtitle="Free trial days before billing begins (PRD: 14 days standard)">
                <div className="flex items-center gap-4">
                    <FormInput
                        label="Trial Days"
                        placeholder="14"
                        value={step8.trialDays}
                        onChange={(v) => setStep8({ trialDays: v })}
                        type="number"
                        hint="After trial, billing activates automatically unless cancelled"
                        className="max-w-[200px]"
                    />
                    <div className="bg-primary-50 border border-primary-200 rounded-xl px-4 py-3 mt-5 dark:bg-primary-900/30 dark:border-primary-800/50">
                        <p className="text-xs font-bold text-primary-800 dark:text-primary-300">14 days = Standard trial</p>
                        <p className="text-xs text-primary-600">Set to 0 to skip trial (for managed onboarding)</p>
                    </div>
                </div>
            </SectionCard>

            {/* Pricing Summary */}
            <SectionCard
                title="Pricing Summary"
                subtitle="Combined breakdown of selected modules + user tier"
                accent="success"
            >
                <div className="space-y-3">
                    {resolved.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider dark:text-neutral-400">Modules</p>
                            {resolved.map((id) => {
                                const mod = MODULE_CATALOGUE.find((m) => m.id === id);
                                if (!mod) return null;
                                const price = step7.customModulePricing[id] ?? mod.price;
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
                                    {step8.userTier === 'custom'
                                        ? `₹${parseInt(step8.customTierPrice || '0').toLocaleString('en-IN')}`
                                        : `₹${tierBaseCost.toLocaleString('en-IN')}`}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="border-t-2 border-primary-200 pt-3 flex items-center justify-between dark:border-primary-800/50">
                        <div>
                            <p className="text-base font-bold text-primary-950 dark:text-white">
                                Total {step8.billingCycle === 'annual' ? 'Annual' : 'Monthly'}
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                {step8.billingCycle === 'annual'
                                    ? `₹${totalAnnual.toLocaleString('en-IN')}/year (2 months free)`
                                    : 'Billed monthly'}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-3xl font-bold text-primary-600">
                                ₹{(step8.billingCycle === 'annual' ? totalAnnual : totalMonthly).toLocaleString('en-IN')}
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                {step8.billingCycle === 'annual' ? '/year' : '/month'}
                            </p>
                        </div>
                    </div>
                </div>
            </SectionCard>
        </div>
    );
}
