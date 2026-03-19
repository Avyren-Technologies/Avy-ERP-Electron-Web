// ============================================================
// Subscription Detail Screen — Per-location cost breakdown & actions
// ============================================================
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, CreditCard, Users, Layers, Calendar, RefreshCw,
    XCircle, AlertTriangle, CheckCircle2, MapPin, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { showSuccess, showError as showToastError } from '@/lib/toast';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { USER_TIERS } from '@/features/super-admin/tenant-onboarding/constants';

import {
    useSubscriptionDetail,
    useChangeBillingType,
    useChangeTier,
    useExtendTrial,
    useCancelSubscription,
    useReactivateSubscription,
} from '@/features/super-admin/api/use-subscription-queries';

import type {
    BillingType,
    SubscriptionStatus,
    AmcStatus,
    LocationCostBreakdown,
} from '@/lib/api/subscription';

// ============ HELPERS ============

const BILLING_TYPE_LABELS: Record<BillingType, string> = {
    MONTHLY: 'Monthly',
    ANNUAL: 'Annual',
    ONE_TIME_AMC: 'One-Time + AMC',
};

function statusConfig(status: SubscriptionStatus) {
    const map: Record<SubscriptionStatus, { bg: string; text: string; dot: string; label: string }> = {
        TRIAL: { bg: 'bg-info-50 dark:bg-info-900/20 border-info-200 dark:border-info-800/50', text: 'text-info-700 dark:text-info-400', dot: 'bg-info-500', label: 'Trial' },
        ACTIVE: { bg: 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800/50', text: 'text-success-700 dark:text-success-400', dot: 'bg-success-500', label: 'Active' },
        SUSPENDED: { bg: 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800/50', text: 'text-warning-700 dark:text-warning-400', dot: 'bg-warning-500', label: 'Suspended' },
        CANCELLED: { bg: 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700', text: 'text-neutral-600 dark:text-neutral-400', dot: 'bg-neutral-400', label: 'Cancelled' },
        EXPIRED: { bg: 'bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800/50', text: 'text-danger-700 dark:text-danger-400', dot: 'bg-danger-500', label: 'Expired' },
    };
    return map[status] ?? map.ACTIVE;
}

function amcStatusStyle(status: AmcStatus) {
    const map: Record<string, { bg: string; text: string }> = {
        ACTIVE: { bg: 'bg-success-50 border-success-200', text: 'text-success-700' },
        OVERDUE: { bg: 'bg-warning-50 border-warning-200', text: 'text-warning-700' },
        LAPSED: { bg: 'bg-danger-50 border-danger-200', text: 'text-danger-700' },
        NOT_APPLICABLE: { bg: 'bg-neutral-50 border-neutral-200', text: 'text-neutral-500' },
    };
    return map[status] ?? map.NOT_APPLICABLE;
}

function formatCurrency(amount?: number): string {
    if (amount == null) return '--';
    return `\u20B9${amount.toLocaleString('en-IN')}`;
}

function formatDate(dateStr?: string): string {
    if (!dateStr) return '--';
    try {
        return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
        return dateStr;
    }
}

const isReactivatable = (status: SubscriptionStatus) =>
    status === 'SUSPENDED' || status === 'CANCELLED' || status === 'EXPIRED';

// ============ SUB-COMPONENTS ============

function StatusPill({ status }: { status: SubscriptionStatus }) {
    const cfg = statusConfig(status);
    return (
        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border', cfg.bg, cfg.text)}>
            <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
            {cfg.label}
        </span>
    );
}

function BillingBadge({ type }: { type: BillingType }) {
    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary-50 text-primary-700 border border-primary-100 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50">
            {BILLING_TYPE_LABELS[type]}
        </span>
    );
}

function TierBadgeWeb({ tier }: { tier: string }) {
    const tierMeta = USER_TIERS.find((t) => t.key === tier.toLowerCase());
    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-100 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-800/50">
            {tierMeta?.label ?? tier}
        </span>
    );
}

function AmcBadge({ status }: { status: AmcStatus }) {
    const cfg = amcStatusStyle(status);
    return (
        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border', cfg.bg, cfg.text)}>
            AMC: {status}
        </span>
    );
}

function LocationCardWeb({ location }: { location: LocationCostBreakdown }) {
    const showAmc = location.billingType === 'ONE_TIME_AMC' && location.endpointType === 'default';

    return (
        <div className="glass-panel p-5 rounded-xl border border-neutral-100 dark:border-neutral-800 hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                        <MapPin size={14} className="text-primary-600" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-primary-950 dark:text-white truncate">{location.locationName}</p>
                        <p className="text-xs text-neutral-400 dark:text-neutral-500">{location.facilityType}</p>
                    </div>
                </div>
                <BillingBadge type={location.billingType} />
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 mb-3">
                <TierBadgeWeb tier={location.userTier} />
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                    {location.modulesCount} modules
                </span>
                {showAmc && location.amcStatus && location.amcStatus !== 'NOT_APPLICABLE' && (
                    <AmcBadge status={location.amcStatus} />
                )}
            </div>

            {/* Cost */}
            <div className="border-t border-neutral-100 dark:border-neutral-800 pt-3 space-y-1.5">
                {location.billingType === 'MONTHLY' && (
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-neutral-500">Monthly Cost</span>
                        <span className="text-sm font-bold text-primary-900 dark:text-white">{formatCurrency(location.monthlyCost)}/month</span>
                    </div>
                )}
                {location.billingType === 'ANNUAL' && (
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-neutral-500">Annual Cost</span>
                        <span className="text-sm font-bold text-primary-900 dark:text-white">{formatCurrency(location.annualCost)}/year</span>
                    </div>
                )}
                {location.billingType === 'ONE_TIME_AMC' && (
                    <>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-neutral-500">One-Time Cost</span>
                            <span className="text-sm font-bold text-primary-900 dark:text-white">{formatCurrency(location.oneTimeCost)} one-time</span>
                        </div>
                        {showAmc && location.amcCost != null && (
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-neutral-500">AMC</span>
                                <span className="text-sm font-bold text-primary-900 dark:text-white">{formatCurrency(location.amcCost)}/year</span>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Dates */}
            <div className="flex gap-4 mt-3 pt-2 border-t border-neutral-50 dark:border-neutral-800/50">
                {location.nextRenewalDate && (
                    <div>
                        <p className="text-[10px] text-neutral-400">Next Renewal</p>
                        <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{formatDate(location.nextRenewalDate)}</p>
                    </div>
                )}
                {showAmc && location.amcDueDate && (
                    <div>
                        <p className="text-[10px] text-neutral-400">AMC Due</p>
                        <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{formatDate(location.amcDueDate)}</p>
                    </div>
                )}
                {location.trialEndDate && (
                    <div>
                        <p className="text-[10px] text-neutral-400">Trial Ends</p>
                        <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{formatDate(location.trialEndDate)}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ============ ACTION MODALS ============

type ModalType = 'billing' | 'tier' | 'trial' | 'cancel' | 'reactivate' | null;

function RadioOption({
    label,
    subtitle,
    selected,
    onSelect,
}: {
    label: string;
    subtitle?: string;
    selected: boolean;
    onSelect: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onSelect}
            className={cn(
                'flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all w-full',
                selected
                    ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-600'
                    : 'border-neutral-200 bg-neutral-50 dark:bg-neutral-800 dark:border-neutral-700 hover:border-neutral-300',
            )}
        >
            <div
                className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                    selected ? 'border-primary-600' : 'border-neutral-300',
                )}
            >
                {selected && <div className="w-2.5 h-2.5 rounded-full bg-primary-600" />}
            </div>
            <div className="flex-1">
                <p className="text-sm font-semibold text-primary-950 dark:text-white">{label}</p>
                {subtitle && <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">{subtitle}</p>}
            </div>
        </button>
    );
}

// ============ MAIN SCREEN ============

export function SubscriptionDetailScreen() {
    const { companyId } = useParams<{ companyId: string }>();
    const navigate = useNavigate();

    // Data
    const { data: subResponse, isLoading, isError, refetch } = useSubscriptionDetail(companyId ?? '');
    const subscription = (subResponse as any)?.data ?? subResponse;

    // Mutations
    const changeBillingMutation = useChangeBillingType();
    const changeTierMutation = useChangeTier();
    const extendTrialMutation = useExtendTrial();
    const cancelMutation = useCancelSubscription();
    const reactivateMutation = useReactivateSubscription();

    // Modal state
    const [activeModal, setActiveModal] = useState<ModalType>(null);
    const [selectedBillingType, setSelectedBillingType] = useState<BillingType>('MONTHLY');
    const [selectedTier, setSelectedTier] = useState<string>('starter');
    const [trialDate, setTrialDate] = useState<string>('');

    const isMutating = changeBillingMutation.isPending || changeTierMutation.isPending
        || extendTrialMutation.isPending || cancelMutation.isPending || reactivateMutation.isPending;

    // Handlers
    const handleChangeBillingType = () => {
        if (!companyId) return;
        changeBillingMutation.mutate(
            { companyId, data: { billingType: selectedBillingType } },
            {
                onSuccess: () => {
                    showSuccess('Billing Type Updated');
                    setActiveModal(null);
                },
                onError: (err) => showToastError('Failed to update billing type'),
            },
        );
    };

    const handleChangeTier = () => {
        if (!companyId) return;
        changeTierMutation.mutate(
            { companyId, data: { newTier: selectedTier } },
            {
                onSuccess: () => {
                    showSuccess('Tier Updated');
                    setActiveModal(null);
                },
                onError: () => showToastError('Failed to update tier'),
            },
        );
    };

    const handleExtendTrial = () => {
        if (!companyId || !trialDate) return;
        extendTrialMutation.mutate(
            { companyId, data: { newEndDate: trialDate } },
            {
                onSuccess: () => {
                    showSuccess('Trial Extended');
                    setActiveModal(null);
                },
                onError: () => showToastError('Failed to extend trial'),
            },
        );
    };

    const handleCancel = () => {
        if (!companyId) return;
        cancelMutation.mutate(companyId, {
            onSuccess: () => {
                showSuccess('Subscription Cancelled');
                setActiveModal(null);
            },
            onError: () => showToastError('Failed to cancel subscription'),
        });
    };

    const handleReactivate = () => {
        if (!companyId) return;
        reactivateMutation.mutate(companyId, {
            onSuccess: () => {
                showSuccess('Subscription Reactivated');
                setActiveModal(null);
            },
            onError: () => showToastError('Failed to reactivate subscription'),
        });
    };

    // Open modals with defaults
    const openBillingModal = () => {
        setSelectedBillingType(subscription?.defaultBillingType ?? 'MONTHLY');
        setActiveModal('billing');
    };

    const openTierModal = () => {
        const firstTier = subscription?.locations?.[0]?.userTier ?? 'starter';
        setSelectedTier(firstTier.toLowerCase());
        setActiveModal('tier');
    };

    const openTrialModal = () => {
        setTrialDate('');
        setActiveModal('trial');
    };

    // ============ LOADING ============

    if (isLoading) {
        return (
            <div className="p-6 space-y-6 max-w-6xl mx-auto">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition">
                        <ArrowLeft size={20} className="text-neutral-500" />
                    </button>
                    <div className="h-8 w-48 bg-neutral-200 dark:bg-neutral-700 rounded-lg animate-pulse" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            </div>
        );
    }

    // ============ ERROR ============

    if (isError || !subscription) {
        return (
            <div className="p-6 max-w-6xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition">
                        <ArrowLeft size={20} className="text-neutral-500" />
                    </button>
                </div>
                <EmptyState
                    icon="error"
                    title="Subscription Not Found"
                    message="Could not load subscription details for this company."
                    action={{ label: 'Retry', onClick: () => refetch() }}
                />
            </div>
        );
    }

    const status = subscription.status as SubscriptionStatus;
    const locations = (subscription.locations ?? []) as LocationCostBreakdown[];

    // ============ RENDER ============

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                    >
                        <ArrowLeft size={20} className="text-neutral-500" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-primary-950 dark:text-white">
                            {subscription.tenantName}
                        </h1>
                        <p className="text-sm text-neutral-400 dark:text-neutral-500">
                            Subscription Detail &middot; Started {formatDate(subscription.startDate)}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <StatusPill status={status} />
                    <BillingBadge type={subscription.defaultBillingType} />
                </div>
            </div>

            {/* Action toolbar */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={openBillingModal}
                    disabled={isMutating}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-primary-50 text-primary-700 border border-primary-100 hover:bg-primary-100 transition disabled:opacity-50 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50"
                >
                    <CreditCard size={14} />
                    Change Billing Type
                </button>
                <button
                    onClick={openTierModal}
                    disabled={isMutating}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-primary-50 text-primary-700 border border-primary-100 hover:bg-primary-100 transition disabled:opacity-50 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50"
                >
                    <Users size={14} />
                    Change Tier
                </button>
                <button
                    onClick={openTrialModal}
                    disabled={isMutating}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-primary-50 text-primary-700 border border-primary-100 hover:bg-primary-100 transition disabled:opacity-50 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50"
                >
                    <Calendar size={14} />
                    Extend Trial
                </button>
                <button
                    onClick={() => setActiveModal('cancel')}
                    disabled={isMutating}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-danger-50 text-danger-700 border border-danger-100 hover:bg-danger-100 transition disabled:opacity-50 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50"
                >
                    <XCircle size={14} />
                    Cancel Subscription
                </button>
                {isReactivatable(status) && (
                    <button
                        onClick={() => setActiveModal('reactivate')}
                        disabled={isMutating}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-success-50 text-success-700 border border-success-100 hover:bg-success-100 transition disabled:opacity-50 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50"
                    >
                        <RefreshCw size={14} />
                        Reactivate
                    </button>
                )}
            </div>

            {/* Location cards grid */}
            <div>
                <h2 className="text-sm font-bold text-primary-950 dark:text-white mb-3">
                    Locations ({locations.length})
                </h2>
                {locations.length === 0 ? (
                    <EmptyState
                        icon="inbox"
                        title="No Locations"
                        message="No location cost breakdown available."
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {locations.map((loc) => (
                            <LocationCardWeb key={loc.locationId} location={loc} />
                        ))}
                    </div>
                )}
            </div>

            {/* ===== MODALS ===== */}

            {/* Change Billing Type */}
            <Modal
                isOpen={activeModal === 'billing'}
                onClose={() => setActiveModal(null)}
                title="Change Billing Type"
                footerContent={
                    <>
                        <button
                            onClick={() => setActiveModal(null)}
                            className="px-4 py-2 rounded-lg text-sm font-semibold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition dark:bg-neutral-800 dark:text-neutral-300"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleChangeBillingType}
                            disabled={changeBillingMutation.isPending}
                            className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 transition disabled:opacity-50 flex items-center gap-1.5"
                        >
                            {changeBillingMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                            Update
                        </button>
                    </>
                }
            >
                <p className="text-sm text-neutral-500 mb-4 dark:text-neutral-400">
                    Select the new billing type for this subscription.
                </p>
                <div className="space-y-2">
                    {(['MONTHLY', 'ANNUAL', 'ONE_TIME_AMC'] as BillingType[]).map((bt) => (
                        <RadioOption
                            key={bt}
                            label={BILLING_TYPE_LABELS[bt]}
                            selected={selectedBillingType === bt}
                            onSelect={() => setSelectedBillingType(bt)}
                        />
                    ))}
                </div>
            </Modal>

            {/* Change Tier */}
            <Modal
                isOpen={activeModal === 'tier'}
                onClose={() => setActiveModal(null)}
                title="Change User Tier"
                footerContent={
                    <>
                        <button
                            onClick={() => setActiveModal(null)}
                            className="px-4 py-2 rounded-lg text-sm font-semibold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition dark:bg-neutral-800 dark:text-neutral-300"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleChangeTier}
                            disabled={changeTierMutation.isPending}
                            className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 transition disabled:opacity-50 flex items-center gap-1.5"
                        >
                            {changeTierMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                            Update
                        </button>
                    </>
                }
            >
                <p className="text-sm text-neutral-500 mb-4 dark:text-neutral-400">
                    Select the new tier for this subscription.
                </p>
                <div className="space-y-2">
                    {USER_TIERS.map((tier) => (
                        <RadioOption
                            key={tier.key}
                            label={tier.label}
                            subtitle={`Up to ${tier.maxUsers} users \u00b7 ${formatCurrency(tier.basePrice)}/mo`}
                            selected={selectedTier === tier.key}
                            onSelect={() => setSelectedTier(tier.key)}
                        />
                    ))}
                </div>
            </Modal>

            {/* Extend Trial */}
            <Modal
                isOpen={activeModal === 'trial'}
                onClose={() => setActiveModal(null)}
                title="Extend Trial Period"
                footerContent={
                    <>
                        <button
                            onClick={() => setActiveModal(null)}
                            className="px-4 py-2 rounded-lg text-sm font-semibold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition dark:bg-neutral-800 dark:text-neutral-300"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleExtendTrial}
                            disabled={extendTrialMutation.isPending || !trialDate}
                            className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 transition disabled:opacity-50 flex items-center gap-1.5"
                        >
                            {extendTrialMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                            Extend
                        </button>
                    </>
                }
            >
                <p className="text-sm text-neutral-500 mb-4 dark:text-neutral-400">
                    Enter the new trial end date.
                </p>
                <input
                    type="date"
                    value={trialDate}
                    onChange={(e) => setTrialDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm font-semibold text-primary-950 dark:text-white focus:border-primary-400 focus:outline-none transition"
                />
            </Modal>

            {/* Cancel Subscription */}
            <Modal
                isOpen={activeModal === 'cancel'}
                onClose={() => setActiveModal(null)}
                title="Cancel Subscription"
                footerContent={
                    <>
                        <button
                            onClick={() => setActiveModal(null)}
                            className="px-4 py-2 rounded-lg text-sm font-semibold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition dark:bg-neutral-800 dark:text-neutral-300"
                        >
                            Keep Active
                        </button>
                        <button
                            onClick={handleCancel}
                            disabled={cancelMutation.isPending}
                            className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-danger-600 hover:bg-danger-700 transition disabled:opacity-50 flex items-center gap-1.5"
                        >
                            {cancelMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                            Cancel Subscription
                        </button>
                    </>
                }
            >
                <div className="flex items-start gap-3 p-4 rounded-xl bg-danger-50 border border-danger-100 dark:bg-danger-900/20 dark:border-danger-800/50">
                    <AlertTriangle size={20} className="text-danger-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-danger-800 dark:text-danger-400">
                            This will cancel the subscription and set a 30-day export window.
                        </p>
                        <p className="text-xs text-danger-600 dark:text-danger-400/80 mt-1">
                            All data will be available for export during this period. After 30 days, data may be permanently deleted. This action cannot be easily undone.
                        </p>
                    </div>
                </div>
            </Modal>

            {/* Reactivate */}
            <Modal
                isOpen={activeModal === 'reactivate'}
                onClose={() => setActiveModal(null)}
                title="Reactivate Subscription"
                footerContent={
                    <>
                        <button
                            onClick={() => setActiveModal(null)}
                            className="px-4 py-2 rounded-lg text-sm font-semibold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition dark:bg-neutral-800 dark:text-neutral-300"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleReactivate}
                            disabled={reactivateMutation.isPending}
                            className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-success-600 hover:bg-success-700 transition disabled:opacity-50 flex items-center gap-1.5"
                        >
                            {reactivateMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                            Reactivate
                        </button>
                    </>
                }
            >
                <div className="flex items-start gap-3 p-4 rounded-xl bg-success-50 border border-success-100 dark:bg-success-900/20 dark:border-success-800/50">
                    <CheckCircle2 size={20} className="text-success-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-success-800 dark:text-success-400">
                            This will reactivate the subscription and restore access to all modules and features.
                        </p>
                        <p className="text-xs text-success-600 dark:text-success-400/80 mt-1">
                            Billing will resume from the next cycle.
                        </p>
                    </div>
                </div>
            </Modal>

            {/* Global loading overlay */}
            {isMutating && (
                <div className="fixed inset-0 bg-white/50 dark:bg-neutral-950/50 z-50 flex items-center justify-center">
                    <Loader2 size={32} className="text-primary-600 animate-spin" />
                </div>
            )}
        </div>
    );
}
