// ============================================================
// Company Detail Screen — Comprehensive Tenant View
// Shows all 17 wizard sections in a rich, read-only detail page
// ============================================================
import { useState } from 'react';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
    Building2, ArrowLeft, Server, Users, AlertTriangle,
    Blocks, PowerOff, Trash2, Calendar, MapPin, Mail, Phone,
    ChevronDown, ChevronUp, Star, Shield, Clock, Settings,
    Landmark, CheckCircle2, XCircle, ExternalLink, Edit3, RefreshCw,
    Hash, UserPlus, Activity, Layers, Loader2, History, Inbox,
    Play, Zap, RotateCcw,
} from 'lucide-react';
import { useTenantDetail, useUpdateCompanyStatus, useDeleteCompany } from '@/features/super-admin/api/use-tenant-queries';
import { useEntityAuditLogs } from '@/features/super-admin/api/use-audit-queries';
import { showSuccess } from '@/lib/toast';
import { CompanyDetailEditModal } from '@/features/super-admin/CompanyDetailEditModal';
import { MODULE_CATALOGUE, USER_TIERS, FY_OPTIONS, MONTHS } from '@/features/super-admin/tenant-onboarding/constants';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';

// ============================================================
// Reusable detail primitives
// ============================================================

function DetailField({ label, value, mono = false }: { label: string; value?: string | null; mono?: boolean }) {
    return (
        <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1 dark:text-neutral-500">{label}</p>
            <p className={cn(
                'text-sm font-semibold text-primary-950 dark:text-white',
                mono && 'font-mono bg-neutral-50 dark:bg-neutral-800 px-2 py-1 rounded-lg border border-neutral-100 dark:border-neutral-800 text-xs inline-block',
                !value && 'text-neutral-300 dark:text-neutral-500 italic font-normal'
            )}>
                {value || '—'}
            </p>
        </div>
    );
}

function StatusPill({ status }: { status: string }) {
    const config: Record<string, { bg: string; text: string; dot: string }> = {
        Active: { bg: 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800/50', text: 'text-success-700 dark:text-success-400', dot: 'bg-success-500' },
        Draft: { bg: 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800/50', text: 'text-warning-700 dark:text-warning-400', dot: 'bg-warning-500' },
        Pilot: { bg: 'bg-info-50 dark:bg-info-900/20 border-info-200 dark:border-info-800/50', text: 'text-info-700 dark:text-info-400', dot: 'bg-info-500' },
        Suspended: { bg: 'bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800/50', text: 'text-danger-700 dark:text-danger-400', dot: 'bg-danger-500' },
        Inactive: { bg: 'bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800/50', text: 'text-danger-700 dark:text-danger-400', dot: 'bg-danger-500' },
    };
    const cfg = config[status] ?? config.Draft;
    return (
        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border', cfg.bg, cfg.text)}>
            <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
            {status}
        </span>
    );
}

function ControlBadge({ label, value }: { label: string; value: boolean }) {
    return (
        <div className={cn(
            'flex items-center gap-2.5 px-4 py-3 rounded-xl border',
            value ? 'bg-success-50 dark:bg-success-900/20 border-success-100 dark:border-success-800/50' : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-100 dark:border-neutral-800'
        )}>
            {value
                ? <CheckCircle2 size={14} className="text-success-500 flex-shrink-0" />
                : <XCircle size={14} className="text-neutral-300 flex-shrink-0 dark:text-neutral-500" />}
            <span className={cn('text-xs font-semibold', value ? 'text-success-800 dark:text-success-400' : 'text-neutral-400 dark:text-neutral-500')}>
                {label}
            </span>
        </div>
    );
}

function SectionHeader({
    icon: Icon,
    title,
    subtitle,
    action,
    expanded,
    onToggle,
}: {
    icon: React.ComponentType<{ className?: string; size?: number }>;
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
    expanded?: boolean;
    onToggle?: () => void;
}) {
    return (
        <div
            className={cn(
                'flex items-center justify-between',
                onToggle && 'cursor-pointer'
            )}
            onClick={onToggle}
        >
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0 dark:bg-primary-900/30">
                    <Icon size={16} className="text-primary-600" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-primary-950 dark:text-white">{title}</h3>
                    {subtitle && <p className="text-xs text-neutral-400 mt-0.5 dark:text-neutral-500">{subtitle}</p>}
                </div>
            </div>
            <div className="flex items-center gap-2">
                {action}
                {onToggle !== undefined && (
                    expanded
                        ? <ChevronUp size={15} className="text-neutral-400 dark:text-neutral-500" />
                        : <ChevronDown size={15} className="text-neutral-400 dark:text-neutral-500" />
                )}
            </div>
        </div>
    );
}

function Card({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn('bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm overflow-hidden', className)}>
            {children}
        </div>
    );
}

function CardBody({ children, className }: { children: React.ReactNode; className?: string }) {
    return <div className={cn('p-6', className)}>{children}</div>;
}

function EditButton({ label = 'Edit', onClick }: { label?: string; onClick?: () => void }) {
    return (
        <button
            type="button"
            onClick={(e) => {
                e.stopPropagation();
                onClick?.();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-primary-600
                bg-primary-50 dark:bg-primary-900/30 hover:bg-primary-100 dark:bg-primary-900/40 border border-primary-100 dark:border-primary-800/50 transition-colors"
        >
            <Edit3 size={11} />
            {label}
        </button>
    );
}

function TypeBadge({ type, variant = 'default' }: { type: string; variant?: 'default' | 'warning' | 'danger' | 'info' | 'success' }) {
    const styles: Record<string, string> = {
        default: 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700',
        warning: 'bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50',
        danger: 'bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50',
        info: 'bg-info-50 text-info-700 border-info-200 dark:bg-info-900/20 dark:text-info-400 dark:border-info-800/50',
        success: 'bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50',
    };
    return (
        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', styles[variant])}>
            {type}
        </span>
    );
}

function Spinner() {
    return (
        <div className="flex items-center justify-center py-24">
            <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
        </div>
    );
}

const MODULE_MAP: Record<string, { name: string; icon: string; price: number }> = MODULE_CATALOGUE.reduce(
    (acc, moduleItem) => {
        acc[moduleItem.id] = {
            name: moduleItem.name,
            icon: moduleItem.icon,
            price: moduleItem.price,
        };
        return acc;
    },
    {} as Record<string, { name: string; icon: string; price: number }>,
);

// ============================================================
// Audit History Section
// ============================================================

function AuditActionBadge({ action }: { action: string }) {
    const upper = (action ?? '').toUpperCase();
    let style = 'bg-info-50 text-info-700 border-info-200 dark:bg-info-900/20 dark:text-info-400 dark:border-info-800/50';
    if (upper.includes('CREATE')) {
        style = 'bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50';
    } else if (upper.includes('DELETE')) {
        style = 'bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50';
    } else if (upper.includes('UPDATE')) {
        style = 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50';
    }
    return (
        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', style)}>
            {upper}
        </span>
    );
}

function AuditHistorySection({ companyId, expanded, onToggle }: { companyId: string; expanded: boolean; onToggle: () => void }) {
    const fmt = useCompanyFormatter();
    const { data, isLoading } = useEntityAuditLogs('COMPANY', companyId);
    const logs: any[] = data?.data ?? data ?? [];

    const formatTimestamp = (ts: string) => {
        if (!ts) return '';
        return fmt.dateTime(ts);
    };

    return (
        <Card>
            <CardBody>
                <SectionHeader
                    icon={History}
                    title="Audit History"
                    subtitle="Recent changes to this company"
                    expanded={expanded}
                    onToggle={onToggle}
                />
                {expanded && (
                    <div className="mt-5 animate-in fade-in duration-200">
                        {isLoading ? (
                            <div className="space-y-3">
                                <Skeleton width="100%" height={48} borderRadius={12} />
                                <Skeleton width="100%" height={48} borderRadius={12} />
                                <Skeleton width="80%" height={48} borderRadius={12} />
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <Inbox size={40} className="text-neutral-200 dark:text-neutral-700 mb-3" />
                                <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">No audit history</p>
                                <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">Changes to this company will be recorded here.</p>
                            </div>
                        ) : (
                            <div className="space-y-0">
                                {logs.slice(0, 20).map((log: any, i: number) => (
                                    <div
                                        key={log.id ?? i}
                                        className={cn(
                                            'flex items-start gap-3 py-3',
                                            i < Math.min(logs.length, 20) - 1 && 'border-b border-neutral-50 dark:border-neutral-800'
                                        )}
                                    >
                                        {/* Timeline dot */}
                                        <div className="w-2 h-2 rounded-full bg-primary-300 mt-1.5 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <AuditActionBadge action={log.action ?? ''} />
                                                <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                                                    {formatTimestamp(log.createdAt ?? log.timestamp ?? '')}
                                                </span>
                                            </div>
                                            <p className="text-sm font-semibold text-primary-950 dark:text-white truncate">
                                                {log.description ?? log.action ?? ''}
                                            </p>
                                            {log.performedBy && (
                                                <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                                                    by {log.performedBy}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                {!expanded && (
                    <p className="text-xs text-neutral-400 mt-2 dark:text-neutral-500">
                        {isLoading ? 'Loading...' : `${logs.length} audit entries`}
                    </p>
                )}
            </CardBody>
        </Card>
    );
}

// ============================================================
// Main Screen
// ============================================================

export function CompanyDetailScreen() {
    const fmt = useCompanyFormatter();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data, isLoading, isError } = useTenantDetail(id ?? '');
    const statusMutation = useUpdateCompanyStatus();
    const deleteMutation = useDeleteCompany();

    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        statutory: false,
        fiscal: false,
        preferences: false,
        controls: false,
        shifts: false,
        noSeries: false,
        iotReasons: false,
        users: false,
        audit: false,
    });

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [editSection, setEditSection] = useState<string | null>(null);
    const [editData, setEditData] = useState<Record<string, any> | null>(null);
    const [showStatusConfirm, setShowStatusConfirm] = useState<string | null>(null);

    const openEdit = (section: string, sectionData: Record<string, any>) => {
        setEditSection(section);
        setEditData(sectionData);
    };

    const closeEdit = () => {
        setEditSection(null);
        setEditData(null);
    };

    const toggle = (key: string) =>
        setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));

    if (isLoading) return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
            <Skeleton width="100%" height={200} borderRadius={16} />
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginTop: 24 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <SkeletonCard /><SkeletonCard /><SkeletonCard />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <SkeletonCard /><SkeletonCard />
                </div>
            </div>
        </div>
    );
    if (isError || !data?.data) {
        return (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <AlertTriangle className="w-12 h-12 text-danger-400" />
                <p className="text-lg font-bold text-primary-950 dark:text-white">Company not found</p>
                <Link to="/app/companies" className="text-sm text-primary-600 font-semibold hover:underline">Back to Companies</Link>
            </div>
        );
    }

    const TENANT = {
        ...data.data,
        slug: data.data?.tenant?.slug ?? data.data?.slug ?? '',
        customDomain: data.data?.tenant?.customDomain ?? data.data?.customDomain ?? null,
    };

    // Parse JSON fields
    const regAddress = (TENANT.registeredAddress as any) ?? {};
    const corpAddress = (TENANT.corporateAddress as any) ?? {};
    const fiscalConfig = (TENANT.fiscalConfig as any) ?? {};
    const preferences = (TENANT.preferences as any) ?? {};
    const razorpayConfig = (TENANT.razorpayConfig as any) ?? {};
    const controls = (TENANT.systemControls as any) ?? {};
    const weeklyOffs = (TENANT.weeklyOffs as string[] | null) ?? [];
    // Contacts, locations, shifts, noSeries, iotReasons, users come as relations
    const contacts = TENANT.contacts ?? [];
    const locations = TENANT.locations ?? [];
    const shifts = TENANT.shifts ?? [];
    const noSeries = TENANT.noSeries ?? [];
    const iotReasons = TENANT.iotReasons ?? [];
    const users = TENANT.users ?? [];

    // API commercial shape is location-based for per-location onboarding.
    const locationModuleRows: Array<{ moduleId: string; price: number }> = locations.flatMap((loc: any) => {
        const moduleIds = (loc.moduleIds as string[] | null) ?? [];
        const customPricing = (loc.customModulePricing as Record<string, number> | null) ?? {};
        return moduleIds.map((moduleId) => ({
            moduleId,
            price: customPricing[moduleId] ?? MODULE_MAP[moduleId]?.price ?? 0,
        }));
    });

    const uniqueModuleIds: string[] = Array.from(new Set(locationModuleRows.map((row) => row.moduleId)));
    const modules = uniqueModuleIds.map((moduleId) => ({
        id: moduleId,
        name: MODULE_MAP[moduleId]?.name ?? moduleId,
        icon: MODULE_MAP[moduleId]?.icon ?? '📦',
        price: MODULE_MAP[moduleId]?.price ?? 0,
    }));

    const totalMonthlyModules = locationModuleRows.reduce((sum, row) => sum + row.price, 0);

    const idleReasons = iotReasons.filter((r: any) => r.reasonType === 'Machine Idle');
    const alarmReasons = iotReasons.filter((r: any) => r.reasonType === 'Machine Alarm');

    const activeUsers = users.filter((u: any) => u.isActive !== false).length;
    const locationTierRows: Array<{
        tier: string | null | undefined;
        customUserLimit: string | number | null | undefined;
        customTierPrice: string | number | null | undefined;
    }> = locations.map((loc: any) => ({
        tier: loc.userTier as string | null | undefined,
        customUserLimit: loc.customUserLimit as string | number | null | undefined,
        customTierPrice: loc.customTierPrice as string | number | null | undefined,
    })).filter((row: { tier: string | null | undefined }) => !!row.tier);

    const uniqueTiers: string[] = Array.from(new Set(locationTierRows.map((row) => String(row.tier).toLowerCase())));
    const tierLabel = uniqueTiers.length === 0
        ? 'Starter'
        : uniqueTiers.length === 1
            ? `${uniqueTiers[0].charAt(0).toUpperCase()}${uniqueTiers[0].slice(1)}`
            : 'Mixed';
    const billingCycle = TENANT.billingCycle ?? 'monthly';
    const billingLabel = billingCycle.charAt(0).toUpperCase() + billingCycle.slice(1);
    const trialDays = TENANT.trialDays ?? 0;
    const maxUsers = locationTierRows.reduce((sum, row) => {
        const tierKey = String(row.tier).toLowerCase();
        if (tierKey === 'custom') {
            return sum + (row.customUserLimit ? parseInt(String(row.customUserLimit), 10) || 0 : 0);
        }
        const tier = USER_TIERS.find((item) => item.key === tierKey);
        return sum + (tier?.maxUsers ?? 0);
    }, 0);
    const tierBasePrice = locationTierRows.reduce((sum, row) => {
        const tierKey = String(row.tier).toLowerCase();
        if (tierKey === 'custom') {
            return sum + (row.customTierPrice ? parseInt(String(row.customTierPrice), 10) || 0 : 0);
        }
        const tier = USER_TIERS.find((item) => item.key === tierKey);
        return sum + (tier?.basePrice ?? 0);
    }, 0);
    const totalMonthly = totalMonthlyModules + tierBasePrice;

    const VALID_TRANSITIONS: Record<string, string[]> = {
        Draft: ['Pilot', 'Active'],
        Pilot: ['Active', 'Inactive'],
        Active: ['Inactive'],
        Inactive: ['Active'],
        Suspended: ['Active', 'Inactive'],
    };

    const currentStatus = (TENANT.wizardStatus ?? 'Draft') as string;
    const allowedTransitions = VALID_TRANSITIONS[currentStatus] ?? [];

    const handleStatusChange = async (newStatus: string) => {
        if (!id) return;
        setShowStatusConfirm(null);
        await statusMutation.mutateAsync({ companyId: id, status: newStatus });
        showSuccess('Status Updated', `Company status changed to ${newStatus}.`);
    };

    const handleDelete = async () => {
        if (!id) return;
        await deleteMutation.mutateAsync(id);
        showSuccess('Company Deleted', 'Company has been permanently removed.');
        navigate('/app/companies');
    };

    const formatDate = (d: string | null | undefined) => {
        if (!d) return '—';
        return fmt.date(d);
    };

    return (
        <div className="space-y-5 animate-in fade-in duration-300 pb-16">

            {/* ===== BREADCRUMB ===== */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link
                        to="/app/companies"
                        className="p-2 -ml-2 rounded-xl hover:bg-neutral-100 text-neutral-500 transition-colors dark:bg-neutral-800 dark:text-neutral-400"
                    >
                        <ArrowLeft size={18} />
                    </Link>
                    <div className="flex items-center gap-2 text-sm text-neutral-400 font-medium dark:text-neutral-500">
                        <Link to="/app/companies" className="hover:text-primary-600 transition-colors dark:hover:text-primary-400">Companies</Link>
                        <span>/</span>
                        <span className="text-neutral-800 font-semibold dark:text-neutral-200">{TENANT.displayName || TENANT.name}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-neutral-200 text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition-colors dark:border-neutral-700 dark:text-neutral-300 dark:bg-neutral-800">
                        <RefreshCw size={13} />
                        Sync Status
                    </button>
                </div>
            </div>

            {/* ===== HERO HEADER CARD ===== */}
            <Card>
                {/* Gradient banner */}
                <div className="h-28 bg-gradient-to-r from-primary-700 via-primary-500 to-accent-500 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20" style={{
                        backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                    }} />
                    <div className="absolute bottom-4 right-6 text-white/20 font-black text-5xl tracking-tighter select-none">
                        {TENANT.companyCode ?? ''}
                    </div>
                </div>

                <CardBody>
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
                        {/* Logo + Name */}
                        <div className="flex items-end gap-5">
                            <div className="w-24 h-24 -mt-14 rounded-2xl bg-white border-4 border-white shadow-xl shadow-neutral-900/10 flex-shrink-0 overflow-hidden dark:bg-neutral-900 dark:border-neutral-800">
                                {TENANT.logoUrl ? (
                                    <img src={TENANT.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-tr from-primary-100 to-accent-100 flex items-center justify-center">
                                        <Building2 size={32} className="text-primary-500" />
                                    </div>
                                )}
                            </div>
                            <div className="mb-1 pt-2">
                                <div className="flex items-center gap-3 flex-wrap mb-1">
                                    <h1 className="text-2xl font-bold text-primary-950 dark:text-white">{TENANT.displayName || TENANT.name}</h1>
                                    <StatusPill status={TENANT.wizardStatus ?? 'Draft'} />
                                </div>
                                <p className="text-sm text-neutral-500 font-medium dark:text-neutral-400">{TENANT.legalName ?? ''}</p>
                                <div className="flex items-center gap-3 mt-2 text-xs text-neutral-400 flex-wrap dark:text-neutral-500">
                                    <span className="bg-neutral-100 px-2.5 py-1 rounded-lg font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">{TENANT.industry}</span>
                                    <span className="bg-neutral-100 px-2.5 py-1 rounded-lg font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">{TENANT.businessType ?? ''}</span>
                                    <span className="font-mono text-neutral-400 dark:text-neutral-500">ID: {TENANT.id}</span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="flex gap-6 border-t md:border-t-0 border-neutral-100 pt-4 md:pt-0 flex-wrap dark:border-neutral-800 md:mt-2">
                            <div>
                                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1 dark:text-neutral-500">Users</p>
                                <p className="text-xl font-bold text-primary-950 dark:text-white">
                                    {activeUsers}
                                    <span className="text-sm text-neutral-400 font-medium dark:text-neutral-500"> / {maxUsers}</span>
                                </p>
                            </div>
                            <div className="w-px h-10 bg-neutral-200 hidden md:block self-center dark:bg-neutral-700" />
                            <div>
                                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1 dark:text-neutral-500">Modules</p>
                                <p className="text-xl font-bold text-primary-950 dark:text-white">
                                    {modules.length}
                                    <span className="text-sm text-neutral-400 font-medium dark:text-neutral-500"> active</span>
                                </p>
                            </div>
                            <div className="w-px h-10 bg-neutral-200 hidden md:block self-center dark:bg-neutral-700" />
                            <div>
                                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1 dark:text-neutral-500">Locations</p>
                                <p className="text-xl font-bold text-primary-950 dark:text-white">
                                    {locations.length}
                                </p>
                            </div>
                            <div className="w-px h-10 bg-neutral-200 hidden md:block self-center dark:bg-neutral-700" />
                            <div>
                                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1 dark:text-neutral-500">Created</p>
                                <p className="text-sm font-bold text-primary-950 dark:text-white">{formatDate(TENANT.createdAt)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Strategy Badge */}
                    {TENANT.multiLocationMode && (
                        <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                            <div className="flex items-center gap-2">
                                <Layers size={13} className="text-accent-500" />
                                <span className="text-xs font-bold text-accent-700 dark:text-accent-400 bg-accent-50 dark:bg-accent-900/20 px-2.5 py-1 rounded-lg border border-accent-100 dark:border-accent-800/50">
                                    Multi-Location · {TENANT.locationConfig === 'per-location' ? 'Per-Location Config' : 'Unified Config'}
                                </span>
                            </div>
                            <EditButton label="Edit Strategy" onClick={() => openEdit('strategy', { multiLocationMode: TENANT.multiLocationMode, locationConfig: TENANT.locationConfig })} />
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* ===== MAIN GRID ===== */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* ========= LEFT COLUMN (col-span-2) ========= */}
                <div className="lg:col-span-2 space-y-5">

                    {/* --- Company Identity --- */}
                    <Card>
                        <CardBody>
                            <SectionHeader icon={Building2} title="Company Identity" action={<EditButton onClick={() => openEdit('identity', TENANT)} />} />
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-5 mt-5">
                                <DetailField label="Display Name" value={TENANT.displayName} />
                                <DetailField label="Legal Name" value={TENANT.legalName} />
                                <DetailField label="Short Name" value={TENANT.shortName} />
                                <DetailField label="Company Code" value={TENANT.companyCode} mono />
                                <div>
                                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1 dark:text-neutral-500">Subdomain</p>
                                    {TENANT.slug ? (
                                        <a href={`https://${TENANT.slug}.avyren.in`} target="_blank" rel="noopener noreferrer"
                                            className="text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1 dark:text-primary-400">
                                            {TENANT.slug}.avyren.in <ExternalLink size={11} />
                                        </a>
                                    ) : <p className="text-neutral-300 text-sm italic dark:text-neutral-500">—</p>}
                                </div>
                                <DetailField label="Custom Domain" value={TENANT.customDomain} mono />
                                <DetailField label="Slug" value={TENANT.slug} mono />
                                <DetailField label="CIN" value={TENANT.cin} mono />
                                <DetailField label="Incorporation Date" value={TENANT.incorporationDate} />
                                <DetailField label="Employee Count" value={TENANT.employeeCount} />
                                <div className="flex items-center gap-2">
                                    <div>
                                        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1 dark:text-neutral-500">Website</p>
                                        {TENANT.website ? (
                                            <a href={TENANT.website} target="_blank" rel="noopener noreferrer"
                                                className="text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1 dark:text-primary-400">
                                                {TENANT.website} <ExternalLink size={11} />
                                            </a>
                                        ) : <p className="text-neutral-300 text-sm italic dark:text-neutral-500">—</p>}
                                    </div>
                                </div>
                                <DetailField label="Email Domain" value={TENANT.emailDomain ? `@${TENANT.emailDomain}` : null} mono />
                            </div>
                        </CardBody>
                    </Card>

                    {/* --- Statutory & Tax (collapsible) --- */}
                    <Card>
                        <CardBody>
                            <SectionHeader
                                icon={Landmark}
                                title="Statutory & Tax"
                                action={<EditButton onClick={() => openEdit('statutory', TENANT)} />}
                                expanded={expandedSections.statutory}
                                onToggle={() => toggle('statutory')}
                            />
                            {expandedSections.statutory && (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-5 mt-5 animate-in fade-in duration-200">
                                    <DetailField label="PAN" value={TENANT.pan} mono />
                                    <DetailField label="TAN" value={TENANT.tan} mono />
                                    <DetailField label="GSTIN (Primary)" value={TENANT.gstin} mono />
                                    <DetailField label="PF Reg. No." value={TENANT.pfRegNo} mono />
                                    <DetailField label="ESI Code" value={TENANT.esiCode} mono />
                                    <DetailField label="ROC Filing State" value={TENANT.rocState} />
                                    <DetailField label="PT Registration" value={TENANT.ptReg} mono />
                                    <DetailField label="LWFR No." value={TENANT.lwfrNo} mono />
                                </div>
                            )}
                            {!expandedSections.statutory && (
                                <div className="flex items-center gap-2 mt-4">
                                    {[TENANT.pan, TENANT.gstin, TENANT.pfRegNo].filter(Boolean).map((val: string, i: number) => (
                                        <span key={i} className="font-mono text-xs bg-neutral-50 border border-neutral-100 px-2.5 py-1 rounded-lg text-neutral-600 dark:bg-neutral-800 dark:border-neutral-800 dark:text-neutral-300">
                                            {val}
                                        </span>
                                    ))}
                                    <span className="text-xs text-neutral-400 dark:text-neutral-500">+ more...</span>
                                </div>
                            )}
                        </CardBody>
                    </Card>

                    {/* --- Registered & Corporate Address --- */}
                    <Card>
                        <CardBody>
                            <SectionHeader icon={MapPin} title="Registered & Corporate Address" action={<EditButton onClick={() => openEdit('address', { registeredAddress: regAddress, corporateAddress: corpAddress, sameAsRegistered: TENANT.sameAsRegistered })} />} />
                            <div className="mt-4 space-y-3">
                                {/* Registered Address */}
                                <div className="flex items-start gap-4 bg-neutral-50 rounded-xl px-5 py-4 border border-neutral-100 dark:bg-neutral-800 dark:border-neutral-800">
                                    <MapPin size={16} className="text-primary-500 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="text-xs font-bold text-primary-600 uppercase tracking-wider dark:text-primary-400">Registered Address</p>
                                        </div>
                                        <p className="text-sm font-bold text-primary-950 dark:text-white">{regAddress.line1 || '—'}</p>
                                        {regAddress.line2 && <p className="text-sm text-neutral-600 dark:text-neutral-300">{regAddress.line2}</p>}
                                        <p className="text-sm text-neutral-600 dark:text-neutral-300">
                                            {[regAddress.city, regAddress.district, regAddress.pin].filter(Boolean).join(', ')}
                                        </p>
                                        <p className="text-sm text-neutral-600 dark:text-neutral-300">
                                            {[regAddress.state, regAddress.country].filter(Boolean).join(', ')}
                                        </p>
                                        {regAddress.stdCode && (
                                            <p className="text-xs text-neutral-400 mt-1 dark:text-neutral-500">STD Code: {regAddress.stdCode}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Corporate Address */}
                                {TENANT.sameAsRegistered ? (
                                    <div className="flex items-center gap-2 px-5 py-3 bg-info-50 rounded-xl border border-info-100 dark:bg-info-900/20 dark:border-info-800/50">
                                        <CheckCircle2 size={13} className="text-info-500 flex-shrink-0" />
                                        <p className="text-xs font-semibold text-info-700 dark:text-info-400">Corporate address same as registered</p>
                                    </div>
                                ) : corpAddress.line1 ? (
                                    <div className="flex items-start gap-4 bg-neutral-50 rounded-xl px-5 py-4 border border-neutral-100 dark:bg-neutral-800 dark:border-neutral-800">
                                        <MapPin size={16} className="text-accent-500 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="text-xs font-bold text-accent-600 uppercase tracking-wider dark:text-accent-400">Corporate Address</p>
                                            </div>
                                            <p className="text-sm font-bold text-primary-950 dark:text-white">{corpAddress.line1}</p>
                                            {corpAddress.line2 && <p className="text-sm text-neutral-600 dark:text-neutral-300">{corpAddress.line2}</p>}
                                            <p className="text-sm text-neutral-600 dark:text-neutral-300">
                                                {[corpAddress.city, corpAddress.district, corpAddress.pin].filter(Boolean).join(', ')}
                                            </p>
                                            <p className="text-sm text-neutral-600 dark:text-neutral-300">
                                                {[corpAddress.state, corpAddress.country].filter(Boolean).join(', ')}
                                            </p>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </CardBody>
                    </Card>

                    {/* --- Fiscal & Calendar (collapsible) --- */}
                    <Card>
                        <CardBody>
                            <SectionHeader
                                icon={Calendar}
                                title="Fiscal & Calendar"
                                action={<EditButton onClick={() => openEdit('fiscal', { fiscalConfig })} />}
                                expanded={expandedSections.fiscal}
                                onToggle={() => toggle('fiscal')}
                            />
                            {expandedSections.fiscal ? (
                                <div className="mt-5 space-y-4 animate-in fade-in duration-200">
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-5">
                                        <DetailField label="Financial Year" value={(() => {
                                            const fyOpt = FY_OPTIONS.find((o) => o.key === fiscalConfig.fyType);
                                            if (fiscalConfig.fyType === 'custom' && fiscalConfig.fyCustomStartMonth && fiscalConfig.fyCustomEndMonth) {
                                                const startMonth = MONTHS.find((m) => m.key === fiscalConfig.fyCustomStartMonth || m.label === fiscalConfig.fyCustomStartMonth);
                                                const endMonth = MONTHS.find((m) => m.key === fiscalConfig.fyCustomEndMonth || m.label === fiscalConfig.fyCustomEndMonth);
                                                return `${startMonth?.label ?? fiscalConfig.fyCustomStartMonth} – ${endMonth?.label ?? fiscalConfig.fyCustomEndMonth}`;
                                            }
                                            return fyOpt?.label ?? fiscalConfig.fyType;
                                        })()} />
                                        <DetailField label="Payroll Frequency" value={fiscalConfig.payrollFreq} />
                                        <DetailField label="Timezone" value={fiscalConfig.timezone} />
                                        <DetailField label="Cutoff Day" value={fiscalConfig.cutoffDay} />
                                        <DetailField label="Disbursement Day" value={fiscalConfig.disbursementDay} />
                                        <DetailField label="Week Start" value={fiscalConfig.weekStart} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 dark:text-neutral-500">Working Days</p>
                                        <div className="flex flex-wrap gap-2">
                                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d) => (
                                                <span key={d} className={cn(
                                                    'px-3 py-1 rounded-lg text-xs font-semibold border',
                                                    (fiscalConfig.workingDays ?? []).includes(d)
                                                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 border-primary-200 dark:border-primary-800/50'
                                                        : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 border-neutral-100 dark:border-neutral-800 line-through'
                                                )}>
                                                    {d.slice(0, 3)}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-4 mt-4 text-xs text-neutral-500 dark:text-neutral-400">
                                    <span className="font-semibold">{(() => {
                                        const fyOpt = FY_OPTIONS.find((o) => o.key === fiscalConfig.fyType);
                                        if (fiscalConfig.fyType === 'custom' && fiscalConfig.fyCustomStartMonth && fiscalConfig.fyCustomEndMonth) {
                                            const startMonth = MONTHS.find((m) => m.key === fiscalConfig.fyCustomStartMonth || m.label === fiscalConfig.fyCustomStartMonth);
                                            const endMonth = MONTHS.find((m) => m.key === fiscalConfig.fyCustomEndMonth || m.label === fiscalConfig.fyCustomEndMonth);
                                            return `${startMonth?.label ?? fiscalConfig.fyCustomStartMonth} – ${endMonth?.label ?? fiscalConfig.fyCustomEndMonth}`;
                                        }
                                        return fyOpt?.label ?? fiscalConfig.fyType ?? '—';
                                    })()}</span>
                                    <span>·</span>
                                    <span>{fiscalConfig.payrollFreq ?? '—'}</span>
                                    <span>·</span>
                                    <span>{fiscalConfig.timezone ?? '—'}</span>
                                </div>
                            )}
                        </CardBody>
                    </Card>

                    {/* --- Backend Endpoint --- */}
                    <Card>
                        <CardBody>
                            <SectionHeader icon={Server} title="Backend Endpoint" action={<EditButton label="Configure" onClick={() => openEdit('endpoint', { endpointType: TENANT.endpointType, customEndpointUrl: TENANT.customEndpointUrl })} />} />
                            <div className={cn(
                                'mt-4 flex items-start gap-4 p-5 rounded-2xl border-2',
                                TENANT.endpointType === 'custom'
                                    ? 'border-primary-200 dark:border-primary-800/50 bg-primary-50 dark:bg-primary-900/30'
                                    : 'border-success-200 dark:border-success-800/50 bg-success-50 dark:bg-success-900/20'
                            )}>
                                <div className={cn(
                                    'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                                    TENANT.endpointType === 'custom' ? 'bg-primary-100 dark:bg-primary-900/40' : 'bg-success-100 dark:bg-success-900/30'
                                )}>
                                    <Server size={18} className={TENANT.endpointType === 'custom' ? 'text-primary-600' : 'text-success-600'} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-primary-950 dark:text-white">
                                        {TENANT.endpointType === 'custom' ? 'Custom Self-Hosted Server' : 'Avyren Default Cloud'}
                                    </p>
                                    {TENANT.customEndpointUrl && (
                                        <p className="text-xs font-mono bg-white border border-primary-100 text-primary-700 px-3 py-1.5 rounded-lg inline-block mt-2 dark:bg-neutral-900 dark:border-primary-800/50 dark:text-primary-400">
                                            {TENANT.customEndpointUrl}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    {/* --- Active Modules --- */}
                    <Card>
                        <CardBody>
                            <SectionHeader icon={Blocks} title="Active Modules" subtitle={`${modules.length} modules enabled`} action={<EditButton label="Manage" onClick={() => openEdit('commercial', {
                                selectedModuleIds: uniqueModuleIds,
                                customModulePricing: {},
                                userTier: TENANT.userTier ?? '',
                                customUserLimit: TENANT.customUserLimit ?? '',
                                customTierPrice: TENANT.customTierPrice ?? '',
                                billingType: TENANT.billingType ?? 'monthly',
                                trialDays: TENANT.trialDays ?? 0,
                            })} />} />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
                                {modules.map((mod) => (
                                    <div key={mod.id} className="flex items-center justify-between bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-3 dark:bg-neutral-800 dark:border-neutral-800">
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg">{mod.icon}</span>
                                            <p className="text-sm font-semibold text-primary-950 dark:text-white">{mod.name}</p>
                                        </div>
                                        {/* Pricing hidden — uncomment when pricing is finalized
                                        {mod.price > 0 && (
                                            <span className="text-xs font-bold text-primary-600">
                                                ₹{mod.price.toLocaleString('en-IN')}
                                            </span>
                                        )}
                                        */}
                                    </div>
                                ))}
                                {modules.length === 0 && (
                                    <p className="text-sm text-neutral-400 dark:text-neutral-500 col-span-2 text-center py-4">No modules configured.</p>
                                )}
                            </div>
                            {/* Pricing hidden — uncomment when pricing is finalized
                            {totalMonthlyModules > 0 && (
                                <div className="flex items-center justify-between bg-primary-50 rounded-xl px-4 py-3 mt-4 border border-primary-100 dark:bg-primary-900/30 dark:border-primary-800/50">
                                    <p className="text-sm font-bold text-primary-800 dark:text-primary-300">Module Cost Subtotal</p>
                                    <p className="text-lg font-bold text-primary-700 dark:text-primary-400">₹{totalMonthlyModules.toLocaleString('en-IN')}<span className="text-xs font-normal text-primary-500">/mo</span></p>
                                </div>
                            )}
                            */}
                        </CardBody>
                    </Card>

                    {/* --- Locations / Plants --- */}
                    <Card>
                        <CardBody>
                            <SectionHeader icon={MapPin} title="Plants & Locations" subtitle={`${locations.length} locations`} action={<EditButton label="Manage" onClick={() => openEdit('locations', { locations })} />} />
                            <div className="space-y-3 mt-5">
                                {locations.map((loc: any) => (
                                    <div key={loc.id} className="bg-neutral-50 rounded-xl px-5 py-4 border border-neutral-100 dark:bg-neutral-800 dark:border-neutral-800">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                {loc.isHQ && <Star size={14} className="text-warning-500 fill-warning-400 flex-shrink-0" />}
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="text-sm font-bold text-primary-950 dark:text-white">{loc.name}</p>
                                                        <span className="font-mono text-[10px] bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 px-1.5 py-0.5 rounded">{loc.code}</span>
                                                        {loc.isHQ && (
                                                            <span className="text-[10px] font-bold bg-warning-100 text-warning-700 px-1.5 py-0.5 rounded dark:bg-warning-900/30 dark:text-warning-400">HQ</span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{loc.facilityType} · {[loc.city, loc.state, loc.pin].filter(Boolean).join(', ')}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-wrap justify-end">
                                                <StatusPill status={loc.status} />
                                                {loc.geoEnabled && (
                                                    <span className="text-[10px] font-bold bg-info-50 text-info-700 border border-info-100 px-2 py-0.5 rounded-full dark:bg-info-900/20 dark:text-info-400 dark:border-info-800/50">
                                                        📍 {loc.geoRadius}m
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {/* Location details row */}
                                        <div className="flex items-center gap-4 flex-wrap mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-700">
                                            {loc.gstin && <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400">GSTIN: {loc.gstin}</span>}
                                            {loc.contactName && (
                                                <>
                                                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500">·</span>
                                                    <span className="text-[10px] text-neutral-600 dark:text-neutral-300">
                                                        <Mail size={9} className="inline mr-1" />{loc.contactName} {loc.contactDesignation ? `(${loc.contactDesignation})` : ''}
                                                    </span>
                                                </>
                                            )}
                                            {loc.userTier && (
                                                <>
                                                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500">·</span>
                                                    <span className="text-[10px] font-semibold text-accent-600 dark:text-accent-400">{loc.userTier} tier</span>
                                                </>
                                            )}
                                            {loc.billingCycle && (
                                                <>
                                                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500">·</span>
                                                    <span className="text-[10px] text-neutral-600 dark:text-neutral-300">{loc.billingCycle}</span>
                                                </>
                                            )}
                                            {loc.trialDays > 0 && (
                                                <>
                                                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500">·</span>
                                                    <span className="text-[10px] font-bold text-info-600 dark:text-info-400">{loc.trialDays}d trial</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {locations.length === 0 && (
                                    <p className="text-sm text-neutral-400 dark:text-neutral-500 text-center py-4">No locations configured.</p>
                                )}
                            </div>
                        </CardBody>
                    </Card>

                    {/* --- Shifts (collapsible) --- */}
                    <Card>
                        <CardBody>
                            <SectionHeader
                                icon={Clock}
                                title="Shifts & Time"
                                subtitle={`${shifts.length} shifts configured`}
                                action={<EditButton label="Manage" onClick={() => openEdit('shifts', { dayStartTime: TENANT.dayStartTime, dayEndTime: TENANT.dayEndTime, weeklyOffs: TENANT.weeklyOffs ?? [], shifts })} />}
                                expanded={expandedSections.shifts}
                                onToggle={() => toggle('shifts')}
                            />
                            {expandedSections.shifts && (
                                <div className="mt-5 space-y-4 animate-in fade-in duration-200">
                                    {/* Day boundary + weekly offs */}
                                    <div className="flex items-center gap-4 flex-wrap bg-neutral-50 rounded-xl px-4 py-3 border border-neutral-100 dark:bg-neutral-800 dark:border-neutral-800">
                                        <div className="flex items-center gap-2">
                                            <Clock size={13} className="text-neutral-400" />
                                            <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">Day Boundary:</span>
                                            <span className="text-xs font-mono font-bold text-primary-700 dark:text-primary-400">{TENANT.dayStartTime ?? '—'} – {TENANT.dayEndTime ?? '—'}</span>
                                        </div>
                                        <span className="text-neutral-300 dark:text-neutral-600">|</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">Weekly Off:</span>
                                            {weeklyOffs.map((d: string) => (
                                                <span key={d} className="text-xs font-bold bg-danger-50 text-danger-700 px-2 py-0.5 rounded border border-danger-100 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50">
                                                    {d}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Shift cards */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {shifts.map((sh: any, i: number) => {
                                            const slots = (sh.downtimeSlots as any[] | null) ?? [];
                                            return (
                                                <div key={sh.id ?? i} className="bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-4 dark:bg-neutral-800 dark:border-neutral-800">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <p className="text-sm font-bold text-primary-950 dark:text-white">{sh.name}</p>
                                                        {sh.noShuffle && (
                                                            <span className="text-[10px] font-bold bg-warning-50 text-warning-700 px-1.5 py-0.5 rounded border border-warning-100 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50">
                                                                No Shuffle
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs font-mono text-neutral-600 dark:text-neutral-300">{sh.fromTime} – {sh.toTime}</p>
                                                    {slots.length > 0 && (
                                                        <div className="mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-700 space-y-1">
                                                            {slots.map((slot: any, si: number) => (
                                                                <div key={si} className="flex items-center justify-between">
                                                                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400">{slot.type}</span>
                                                                    <span className="text-[10px] font-semibold text-neutral-600 dark:text-neutral-300">{slot.duration}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                            {!expandedSections.shifts && (
                                <div className="flex items-center gap-3 mt-3 flex-wrap">
                                    <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400">{TENANT.dayStartTime ?? '—'}–{TENANT.dayEndTime ?? '—'}</span>
                                    <span className="text-xs text-neutral-300 dark:text-neutral-600">|</span>
                                    <p className="text-xs text-neutral-400 dark:text-neutral-500">{shifts.map((s: any) => s.name).join(' · ')}</p>
                                </div>
                            )}
                        </CardBody>
                    </Card>

                    {/* --- No. Series (collapsible) --- */}
                    <Card>
                        <CardBody>
                            <SectionHeader
                                icon={Hash}
                                title="Number Series"
                                subtitle={`${noSeries.length} series configured`}
                                action={<EditButton label="Manage" onClick={() => openEdit('noSeries', { noSeries })} />}
                                expanded={expandedSections.noSeries}
                                onToggle={() => toggle('noSeries')}
                            />
                            {expandedSections.noSeries && (
                                <div className="mt-5 animate-in fade-in duration-200">
                                    <div className="rounded-xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
                                        <div className="grid grid-cols-4 bg-neutral-50 dark:bg-neutral-800 px-4 py-2.5 border-b border-neutral-100 dark:border-neutral-700">
                                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider dark:text-neutral-500">Code</span>
                                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider dark:text-neutral-500">Screen</span>
                                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider dark:text-neutral-500">Format</span>
                                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider dark:text-neutral-500 text-right">Preview</span>
                                        </div>
                                        {noSeries.map((ns: any, i: number) => {
                                            const digits = ns.numberCount ?? 5;
                                            const start = ns.startNumber ?? 1;
                                            const preview = `${ns.prefix ?? ''}${ns.suffix ?? ''}${String(start).padStart(digits, '0')}`;
                                            return (
                                                <div key={ns.id ?? ns.code} className={cn(
                                                    'grid grid-cols-4 px-4 py-3 items-center',
                                                    i < noSeries.length - 1 && 'border-b border-neutral-50 dark:border-neutral-800'
                                                )}>
                                                    <span className="text-xs font-mono font-bold text-primary-700 dark:text-primary-400">{ns.code}</span>
                                                    <span className="text-xs text-neutral-700 dark:text-neutral-300">{ns.linkedScreen}</span>
                                                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                                                        {ns.prefix ?? ''}{ns.suffix ?? ''}<span className="text-neutral-300 dark:text-neutral-600">{'0'.repeat(digits)}</span>
                                                    </span>
                                                    <span className="text-xs font-mono font-semibold text-primary-950 dark:text-white text-right">{preview}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                            {!expandedSections.noSeries && (
                                <div className="flex items-center gap-2 mt-3 flex-wrap">
                                    {noSeries.slice(0, 4).map((ns: any) => {
                                        const digits = ns.numberCount ?? 5;
                                        const start = ns.startNumber ?? 1;
                                        const preview = `${ns.prefix ?? ''}${ns.suffix ?? ''}${String(start).padStart(digits, '0')}`;
                                        return (
                                            <span key={ns.code} className="font-mono text-xs bg-neutral-50 border border-neutral-100 px-2.5 py-1 rounded-lg text-neutral-600 dark:bg-neutral-800 dark:border-neutral-800 dark:text-neutral-300">
                                                {preview}
                                            </span>
                                        );
                                    })}
                                    {noSeries.length > 4 && (
                                        <span className="text-xs text-neutral-400 dark:text-neutral-500">+{noSeries.length - 4} more</span>
                                    )}
                                </div>
                            )}
                        </CardBody>
                    </Card>

                    {/* --- IOT Reasons (collapsible) --- */}
                    <Card>
                        <CardBody>
                            <SectionHeader
                                icon={Activity}
                                title="IOT Reasons"
                                subtitle={`${iotReasons.length} reasons configured`}
                                action={<EditButton label="Manage" onClick={() => openEdit('iotReasons', { iotReasons })} />}
                                expanded={expandedSections.iotReasons}
                                onToggle={() => toggle('iotReasons')}
                            />
                            {expandedSections.iotReasons && (
                                <div className="mt-5 space-y-4 animate-in fade-in duration-200">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-bold bg-warning-50 text-warning-700 border border-warning-200 px-3 py-1.5 rounded-lg dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50">
                                            ⏸ {idleReasons.length} Idle Reasons
                                        </span>
                                        <span className="text-xs font-bold bg-danger-50 text-danger-700 border border-danger-200 px-3 py-1.5 rounded-lg dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50">
                                            🚨 {alarmReasons.length} Alarm Reasons
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        {iotReasons.map((r: any, i: number) => (
                                            <div key={r.id ?? i} className="flex items-center justify-between bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-3 dark:bg-neutral-800 dark:border-neutral-800">
                                                <div className="flex items-center gap-3">
                                                    <TypeBadge
                                                        type={r.reasonType === 'Machine Idle' ? 'Idle' : 'Alarm'}
                                                        variant={r.reasonType === 'Machine Idle' ? 'warning' : 'danger'}
                                                    />
                                                    <p className="text-sm font-semibold text-primary-950 dark:text-white">{r.reason}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400">{r.department}</span>
                                                    {r.planned && (
                                                        <span className="text-[10px] font-bold bg-success-50 text-success-700 border border-success-100 px-1.5 py-0.5 rounded dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50">
                                                            Planned
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {!expandedSections.iotReasons && (
                                <div className="flex items-center gap-3 mt-3">
                                    <span className="text-xs text-warning-600 font-semibold dark:text-warning-400">⏸ {idleReasons.length} idle</span>
                                    <span className="text-xs text-neutral-300 dark:text-neutral-600">·</span>
                                    <span className="text-xs text-danger-600 font-semibold dark:text-danger-400">🚨 {alarmReasons.length} alarm</span>
                                </div>
                            )}
                        </CardBody>
                    </Card>

                    {/* --- System Controls (collapsible) --- */}
                    <Card>
                        <CardBody>
                            <SectionHeader
                                icon={Settings}
                                title="System Controls"
                                action={<EditButton label="Configure" onClick={() => openEdit('controls', { systemControls: controls })} />}
                                expanded={expandedSections.controls}
                                onToggle={() => toggle('controls')}
                            />
                            {expandedSections.controls && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5 animate-in fade-in duration-200">
                                    <ControlBadge label="NC Edit Mode" value={controls.ncEditMode ?? false} />
                                    <ControlBadge label="Load/Unload Tracking" value={controls.loadUnload ?? false} />
                                    <ControlBadge label="Cycle Time Capture" value={controls.cycleTime ?? false} />
                                    <ControlBadge label="Payroll Lock" value={controls.payrollLock ?? false} />
                                    <ControlBadge label="Leave Carry Forward" value={controls.leaveCarryForward ?? false} />
                                    <ControlBadge label="Overtime Approval" value={controls.overtimeApproval ?? false} />
                                    <ControlBadge label="MFA Required" value={controls.mfa ?? false} />
                                </div>
                            )}
                            {!expandedSections.controls && (
                                <div className="flex items-center gap-2 mt-3 flex-wrap">
                                    {Object.entries(controls).filter(([, v]) => v).length} of {Object.keys(controls).length}
                                    <span className="text-xs text-neutral-400 dark:text-neutral-500">controls enabled</span>
                                    <div className="flex gap-1.5">
                                        {Object.values(controls).map((v, i) => (
                                            <div key={i} className={cn('w-2 h-2 rounded-full', v ? 'bg-success-400' : 'bg-neutral-200 dark:bg-neutral-700')} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardBody>
                    </Card>

                </div>

                {/* ========= RIGHT COLUMN ========= */}
                <div className="space-y-5">

                    {/* --- Subscription Summary --- */}
                    <Card>
                        <div className="p-5 bg-gradient-to-br from-primary-600 to-accent-600 relative overflow-hidden">
                            <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/5" />
                            <div className="absolute -bottom-8 -left-6 w-20 h-20 rounded-full bg-white/5" />
                            <div className="relative">
                                <p className="text-[10px] font-bold text-primary-200 uppercase tracking-wider mb-1">Current Plan</p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-2xl font-black text-white">{tierLabel}</p>
                                </div>
                                {/* Pricing hidden — uncomment when pricing is finalized
                                {totalMonthly > 0 && (
                                    <p className="text-3xl font-bold text-white mt-3">
                                        ₹{totalMonthly.toLocaleString('en-IN')}
                                        <span className="text-base font-normal text-primary-200">/mo</span>
                                    </p>
                                )}
                                */}
                                <p className="text-xs text-primary-200 mt-1">{billingLabel} billing · {trialDays}d trial</p>
                            </div>
                        </div>
                        <CardBody className="space-y-3">
                            {/* Pricing hidden — uncomment when pricing is finalized
                            {tierBasePrice > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-neutral-500 dark:text-neutral-400">Tier Base</span>
                                    <span className="font-semibold text-primary-950 dark:text-white">₹{tierBasePrice.toLocaleString('en-IN')}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm">
                                <span className="text-neutral-500 dark:text-neutral-400">Modules ({modules.length})</span>
                                <span className="font-semibold text-primary-950 dark:text-white">₹{totalMonthlyModules.toLocaleString('en-IN')}</span>
                            </div>
                            */}
                            <button className="w-full py-2.5 mt-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-sm font-bold rounded-xl transition-colors dark:bg-neutral-700 dark:text-neutral-200">
                                View Billing History
                            </button>
                            <button className="w-full py-2.5 bg-primary-50 hover:bg-primary-100 text-primary-700 text-sm font-bold rounded-xl transition-colors border border-primary-100 dark:bg-primary-900/40 dark:text-primary-400 dark:border-primary-800/50">
                                Change Plan
                            </button>
                        </CardBody>
                    </Card>

                    {/* --- User Capacity --- */}
                    <Card>
                        <CardBody>
                            <SectionHeader icon={Users} title="User Capacity" />
                            <div className="mt-5">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-3xl font-black text-primary-950 dark:text-white">{activeUsers}</span>
                                    <span className="text-sm text-neutral-400 dark:text-neutral-500">/ {maxUsers} max</span>
                                </div>
                                <div className="h-3 w-full bg-neutral-100 rounded-full overflow-hidden mb-2 dark:bg-neutral-800">
                                    <div
                                        className={cn(
                                            'h-full rounded-full transition-all duration-700',
                                            maxUsers > 0 && activeUsers / maxUsers > 0.9
                                                ? 'bg-danger-500'
                                                : maxUsers > 0 && activeUsers / maxUsers > 0.7
                                                    ? 'bg-warning-500'
                                                    : 'bg-gradient-to-r from-primary-500 to-accent-500'
                                        )}
                                        style={{ width: `${maxUsers > 0 ? Math.min((activeUsers / maxUsers) * 100, 100) : 0}%` }}
                                    />
                                </div>
                                <p className="text-xs text-neutral-400 dark:text-neutral-500">
                                    {maxUsers > 0 ? Math.round((activeUsers / maxUsers) * 100) : 0}% capacity used
                                    · {Math.max(maxUsers - activeUsers, 0)} slots available
                                </p>
                            </div>
                        </CardBody>
                    </Card>

                    {/* --- Users & Access (collapsible) --- */}
                    <Card>
                        <CardBody>
                            <SectionHeader
                                icon={UserPlus}
                                title="Users & Access"
                                subtitle={`${users.length} users provisioned`}
                                action={<EditButton label="Manage" onClick={() => openEdit('users', { users })} />}
                                expanded={expandedSections.users}
                                onToggle={() => toggle('users')}
                            />
                            {expandedSections.users && (
                                <div className="space-y-3 mt-5 animate-in fade-in duration-200">
                                    {users.map((u: any, i: number) => {
                                        const fullName = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.fullName || u.email;
                                        return (
                                            <div key={u.id ?? i} className="flex items-start gap-3 bg-neutral-50 rounded-xl px-4 py-3 border border-neutral-100 dark:bg-neutral-800 dark:border-neutral-800">
                                                <div className="w-9 h-9 rounded-lg bg-accent-100 flex items-center justify-center flex-shrink-0 text-sm font-bold text-accent-700 dark:bg-accent-900/40 dark:text-accent-400">
                                                    {fullName.charAt(0)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="text-sm font-bold text-primary-950 dark:text-white">{fullName}</p>
                                                        <span className="text-[10px] font-bold bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded dark:bg-primary-900/30 dark:text-primary-400">
                                                            {u.role}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-neutral-400 dark:text-neutral-500">{u.email}</p>
                                                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                                                        {[u.department, u.location].filter(Boolean).join(' · ') || '—'}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            {!expandedSections.users && (
                                <div className="flex items-center gap-2 mt-3">
                                    <div className="flex -space-x-2">
                                        {users.slice(0, 4).map((u: any, i: number) => {
                                            const fullName = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.fullName || u.email;
                                            return (
                                                <div key={u.id ?? i} className="w-7 h-7 rounded-full bg-accent-100 border-2 border-white dark:border-neutral-900 flex items-center justify-center text-[10px] font-bold text-accent-700 dark:bg-accent-900/40 dark:text-accent-400">
                                                    {fullName.charAt(0)}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {users.length > 4 && (
                                        <span className="text-xs text-neutral-400 dark:text-neutral-500">+{users.length - 4} more</span>
                                    )}
                                </div>
                            )}
                        </CardBody>
                    </Card>

                    {/* --- Key Contacts --- */}
                    <Card>
                        <CardBody>
                            <SectionHeader icon={Phone} title="Key Contacts" action={<EditButton label="Manage" onClick={() => openEdit('contacts', { contacts })} />} />
                            <div className="space-y-3 mt-5">
                                {contacts.map((c: any, i: number) => (
                                    <div key={c.id ?? i} className="flex items-start gap-3 bg-neutral-50 rounded-xl px-4 py-3 border border-neutral-100 dark:bg-neutral-800 dark:border-neutral-800">
                                        <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0 text-sm font-bold text-primary-700 dark:bg-primary-900/40 dark:text-primary-400">
                                            {c.name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-sm font-bold text-primary-950 dark:text-white">{c.name}</p>
                                                <TypeBadge type={c.type} variant={c.type === 'Primary' ? 'info' : 'default'} />
                                            </div>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400">{[c.designation, c.department].filter(Boolean).join(' · ')}</p>
                                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                                <a href={`mailto:${c.email}`} className="text-xs text-primary-600 flex items-center gap-1 hover:underline dark:text-primary-400">
                                                    <Mail size={10} /> {c.email}
                                                </a>
                                                <span className="text-xs text-neutral-500 flex items-center gap-1 dark:text-neutral-400">
                                                    <Phone size={10} /> {c.countryCode} {c.mobile}
                                                </span>
                                            </div>
                                            {c.linkedin && (
                                                <a
                                                    href={String(c.linkedin).startsWith('http') ? c.linkedin : `https://${c.linkedin}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[10px] text-info-600 flex items-center gap-1 mt-1 hover:underline dark:text-info-400"
                                                >
                                                    <ExternalLink size={9} /> {c.linkedin}
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {contacts.length === 0 && (
                                    <p className="text-sm text-neutral-400 dark:text-neutral-500 text-center py-4">No contacts configured.</p>
                                )}
                            </div>
                        </CardBody>
                    </Card>

                    {/* --- Preferences & Security (collapsible) --- */}
                    <Card>
                        <CardBody>
                            <SectionHeader
                                icon={Shield}
                                title="Preferences & Security"
                                action={<EditButton onClick={() => openEdit('preferences', { preferences, razorpayConfig })} />}
                                expanded={expandedSections.preferences}
                                onToggle={() => toggle('preferences')}
                            />
                            {expandedSections.preferences && (
                                <div className="space-y-3 mt-4 animate-in fade-in duration-200">
                                    <div className="grid grid-cols-2 gap-3">
                                        <ControlBadge label="India Compliance" value={preferences.indiaCompliance ?? false} />
                                        <ControlBadge label="MFA" value={controls.mfa ?? false} />
                                        <ControlBadge label="Web App" value={preferences.webApp ?? false} />
                                        <ControlBadge label="System App" value={preferences.systemApp ?? false} />
                                        <ControlBadge label="Mobile App" value={preferences.mobileApp ?? false} />
                                        <ControlBadge label="Bank Integration" value={preferences.bankIntegration ?? false} />
                                        <ControlBadge label="Email Notifications" value={preferences.emailNotif ?? false} />
                                        <ControlBadge label="WhatsApp" value={preferences.whatsapp ?? false} />
                                        <ControlBadge label="Biometric" value={preferences.biometric ?? false} />
                                        <ControlBadge label="RazorpayX Payout" value={razorpayConfig.enabled ?? preferences.razorpayEnabled ?? false} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                                        <DetailField label="Currency" value={preferences.currency} />
                                        <DetailField label="Language" value={preferences.language} />
                                        <DetailField label="Date Format" value={preferences.dateFormat} />
                                        <DetailField label="Number Format" value={preferences.numberFormat} />
                                        <DetailField label="Time Format" value={preferences.timeFormat} />
                                    </div>
                                </div>
                            )}
                            {!expandedSections.preferences && (
                                <p className="text-xs text-neutral-400 mt-2 dark:text-neutral-500">
                                    {[
                                        preferences.currency,
                                        preferences.language,
                                        controls.mfa && 'MFA',
                                        preferences.indiaCompliance && 'India',
                                        preferences.bankIntegration && 'Bank',
                                        preferences.biometric && 'Biometric',
                                    ].filter(Boolean).join(' · ') || '—'}
                                </p>
                            )}
                        </CardBody>
                    </Card>

                    {/* --- Audit History (collapsible) --- */}
                    <AuditHistorySection companyId={id ?? ''} expanded={expandedSections.audit} onToggle={() => toggle('audit')} />

                    {/* --- Status Management --- */}
                    <Card>
                        <CardBody>
                            <SectionHeader icon={Activity} title="Status Management" subtitle="Change company lifecycle status" />
                            <div className="mt-5 space-y-4">
                                {/* Current Status */}
                                <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 border border-neutral-100 dark:bg-neutral-800 dark:border-neutral-800">
                                    <div>
                                        <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1 dark:text-neutral-500">Current Status</p>
                                        <StatusPill status={currentStatus} />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1 dark:text-neutral-500">Available Transitions</p>
                                        <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">
                                            {allowedTransitions.length > 0 ? allowedTransitions.join(', ') : 'None'}
                                        </p>
                                    </div>
                                </div>

                                {/* Transition Buttons */}
                                {allowedTransitions.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {allowedTransitions.includes('Pilot') && (
                                            <button
                                                onClick={() => setShowStatusConfirm('Pilot')}
                                                disabled={statusMutation.isPending}
                                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-info-200 bg-info-50 text-info-700 text-sm font-bold hover:bg-info-100 transition-colors dark:bg-info-900/20 dark:border-info-800/50 dark:text-info-400 disabled:opacity-50"
                                            >
                                                <Zap size={14} />
                                                Move to Pilot
                                            </button>
                                        )}
                                        {allowedTransitions.includes('Active') && (
                                            <button
                                                onClick={() => setShowStatusConfirm('Active')}
                                                disabled={statusMutation.isPending}
                                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-success-200 bg-success-50 text-success-700 text-sm font-bold hover:bg-success-100 transition-colors dark:bg-success-900/20 dark:border-success-800/50 dark:text-success-400 disabled:opacity-50"
                                            >
                                                {currentStatus === 'Inactive' ? <RotateCcw size={14} /> : <Play size={14} />}
                                                {currentStatus === 'Inactive' ? 'Reactivate' : 'Activate'}
                                            </button>
                                        )}
                                        {allowedTransitions.includes('Inactive') && (
                                            <button
                                                onClick={() => setShowStatusConfirm('Inactive')}
                                                disabled={statusMutation.isPending}
                                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-danger-200 bg-danger-50 text-danger-700 text-sm font-bold hover:bg-danger-100 transition-colors dark:bg-danger-900/20 dark:border-danger-800/50 dark:text-danger-400 disabled:opacity-50"
                                            >
                                                <PowerOff size={14} />
                                                Deactivate
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardBody>
                    </Card>

                    {/* --- Danger Zone --- */}
                    <Card className="border-danger-200 dark:border-danger-800/50">
                        <div className="px-5 pt-4 pb-2">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-danger-50 flex items-center justify-center dark:bg-danger-900/20">
                                    <AlertTriangle size={15} className="text-danger-500" />
                                </div>
                                <h3 className="text-sm font-bold text-danger-900 dark:text-danger-400">Danger Zone</h3>
                            </div>
                        </div>
                        <CardBody className="pt-3">
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                disabled={deleteMutation.isPending}
                                className="w-full flex items-center justify-between px-4 py-3 bg-danger-600 hover:bg-danger-700 text-white rounded-xl transition-colors text-sm font-bold shadow-md shadow-danger-500/20 disabled:opacity-50"
                            >
                                <div className="flex items-center gap-2">
                                    <Trash2 size={14} />
                                    {deleteMutation.isPending ? 'Deleting...' : 'Delete Tenant'}
                                </div>
                                <span className="text-[10px] bg-danger-800/50 px-2 py-0.5 rounded text-danger-200">No Recovery</span>
                            </button>
                        </CardBody>
                    </Card>

                </div>
            </div>

            {/* ===== DELETE CONFIRMATION MODAL ===== */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200 dark:bg-neutral-900">
                        <h2 className="text-lg font-bold text-danger-700 mb-2 dark:text-danger-400">Delete this company?</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            This will permanently delete <strong>{TENANT.displayName || TENANT.name}</strong>, all its data, users, and tenant schema. This action cannot be undone.
                        </p>
                        <div className="flex gap-3 mt-6">
                            <button
                                type="button"
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 py-3 rounded-xl border border-neutral-200 text-sm font-bold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:bg-neutral-800"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={deleteMutation.isPending}
                                className="flex-1 py-3 rounded-xl bg-danger-600 text-white text-sm font-bold hover:bg-danger-700 disabled:opacity-50"
                            >
                                {deleteMutation.isPending ? 'Deleting...' : 'Delete Forever'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== STATUS CHANGE CONFIRMATION MODAL ===== */}
            {showStatusConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200 dark:bg-neutral-900">
                        <h2 className={cn(
                            'text-lg font-bold mb-2',
                            showStatusConfirm === 'Inactive' ? 'text-danger-700 dark:text-danger-400' :
                            showStatusConfirm === 'Active' ? 'text-success-700 dark:text-success-400' :
                            'text-info-700 dark:text-info-400'
                        )}>
                            {showStatusConfirm === 'Inactive' ? 'Deactivate Company?' :
                             showStatusConfirm === 'Active' && currentStatus === 'Inactive' ? 'Reactivate Company?' :
                             `Change Status to ${showStatusConfirm}?`}
                        </h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            {showStatusConfirm === 'Inactive'
                                ? `This will deactivate ${TENANT.displayName || TENANT.name}. All users will immediately lose access.`
                                : showStatusConfirm === 'Active' && currentStatus === 'Inactive'
                                ? `This will reactivate ${TENANT.displayName || TENANT.name}. Users will regain access immediately.`
                                : showStatusConfirm === 'Pilot'
                                ? `This will move ${TENANT.displayName || TENANT.name} to Pilot status for trial evaluation.`
                                : `This will change the status of ${TENANT.displayName || TENANT.name} to ${showStatusConfirm}.`}
                        </p>
                        <div className="flex gap-3 mt-6">
                            <button
                                type="button"
                                onClick={() => setShowStatusConfirm(null)}
                                className="flex-1 py-3 rounded-xl border border-neutral-200 text-sm font-bold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:bg-neutral-800"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => handleStatusChange(showStatusConfirm)}
                                disabled={statusMutation.isPending}
                                className={cn(
                                    'flex-1 py-3 rounded-xl text-white text-sm font-bold disabled:opacity-50',
                                    showStatusConfirm === 'Inactive' ? 'bg-danger-600 hover:bg-danger-700' :
                                    showStatusConfirm === 'Active' ? 'bg-success-600 hover:bg-success-700' :
                                    'bg-info-600 hover:bg-info-700'
                                )}
                            >
                                {statusMutation.isPending ? 'Updating...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== SECTION EDIT MODAL ===== */}
            <CompanyDetailEditModal
                open={editSection !== null}
                onClose={closeEdit}
                companyId={id ?? ''}
                section={editSection ?? ''}
                currentData={editData ?? {}}
                onSaved={closeEdit}
            />
        </div>
    );
}
