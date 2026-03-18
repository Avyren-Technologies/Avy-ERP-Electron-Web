// ============================================================
// Company Detail Screen — Comprehensive Tenant View
// Shows all 17 wizard sections in a rich, read-only detail page
// ============================================================
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
    Building2, ArrowLeft, Server, Users, AlertTriangle,
    Blocks, PowerOff, Trash2, Calendar, MapPin, Mail, Phone,
    ChevronDown, ChevronUp, Star, Shield, Clock, Settings,
    Landmark, CheckCircle2, XCircle, ExternalLink, Edit3, RefreshCw,
    Hash, UserPlus, Activity, Layers,
} from 'lucide-react';

// ============================================================
// MOCK DATA — Replace with API call in production
// ============================================================
const TENANT = {
    id: 'APEX-001',
    displayName: 'Apex Manufacturing Pvt. Ltd.',
    legalName: 'Apex Manufacturing Private Limited',
    shortName: 'Apex Mfg',
    status: 'Active' as const,
    industry: 'Automotive',
    businessType: 'Private Limited',
    companyCode: 'APEX',
    cin: 'U28999MH2018PTC305678',
    incorporationDate: '15 Jan 2018',
    employees: '500-1000',
    website: 'https://apexmfg.com',
    emailDomain: 'apex.com',
    logoUrl: null,

    // Statutory
    pan: 'AABCA1234H',
    tan: 'PNEA12345E',
    gstin: '27AABCA1234H1Z5',
    pfRegNo: 'MH/PUN/0012345',
    esiCode: '31-00-123456-000-0001',
    rocState: 'Maharashtra',
    ptReg: 'PT/MH/PUN/12345',
    lwfrNo: 'LWFR/MH/00567',

    // Address — Registered
    regLine1: 'Plot 45, MIDC Industrial Area, Bhosari',
    regLine2: 'Near Telco Circle',
    regCity: 'Pune',
    regDistrict: 'Pune',
    regPin: '411026',
    regState: 'Maharashtra',
    regCountry: 'India',
    regStdCode: '020',
    sameAsRegistered: true,
    corpLine1: '', corpLine2: '', corpCity: '', corpDistrict: '', corpPin: '', corpState: '', corpCountry: '', corpStdCode: '',

    // Fiscal
    fy: 'April – March',
    payrollFreq: 'Monthly',
    timezone: 'IST UTC+5:30',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    cutoffDay: '25',
    disbursementDay: '1',
    weekStart: 'Monday',

    // Preferences
    currency: 'INR — ₹',
    language: 'English',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'Indian (2,00,000)',
    timeFormat: '12-hour (AM/PM)',
    indiaCompliance: true,
    webApp: true,
    systemApp: false,
    mobileApp: true,
    bankIntegration: true,
    emailNotif: true,
    whatsapp: false,
    mfa: true,
    biometric: true,
    razorpayEnabled: true,

    // Endpoint
    endpointType: 'custom' as 'default' | 'custom',
    customUrl: 'https://erp.apex.com/api',
    endpointStatus: 'healthy' as 'healthy' | 'degraded' | 'unreachable',
    region: '',

    // Strategy
    multiLocationMode: true,
    locationConfig: 'per-location',

    // Modules
    modules: [
        { id: 'masters', name: 'Masters & Config', icon: '⚙️', price: 499 },
        { id: 'security', name: 'Security & RBAC', icon: '🔐', price: 1499 },
        { id: 'hr', name: 'HR & Payroll', icon: '👥', price: 2999 },
        { id: 'production', name: 'Production', icon: '🏭', price: 3499 },
        { id: 'machine-maintenance', name: 'Machine Maintenance', icon: '🔧', price: 2499 },
        { id: 'inventory', name: 'Inventory', icon: '📦', price: 1999 },
        { id: 'vendor', name: 'Vendor Management', icon: '🤝', price: 2499 },
        { id: 'sales', name: 'Sales & Invoicing', icon: '💰', price: 2999 },
        { id: 'finance', name: 'Finance & Accounts', icon: '📊', price: 2999 },
    ],

    // User Tier
    tier: 'Growth',
    tierRange: '51–200 users',
    tierBasePrice: 8999,
    perUserPrice: 44,
    billingCycle: 'Annual',
    trialDays: 14,
    renewalDate: 'Apr 12, 2027',

    // Users
    activeUsers: 156,
    maxUsers: 200,

    // Contacts
    contacts: [
        { name: 'Priya Sharma', designation: 'HR Manager', department: 'Human Resources', type: 'Primary', email: 'priya@apex.com', countryCode: '+91', mobile: '99821 43210', linkedin: 'linkedin.com/in/priyasharma' },
        { name: 'Vikram Nair', designation: 'IT Administrator', department: 'IT', type: 'IT Contact', email: 'vikram@apex.com', countryCode: '+91', mobile: '98765 12345' },
        { name: 'Meera Joshi', designation: 'CFO', department: 'Finance', type: 'Finance Contact', email: 'meera@apex.com', countryCode: '+91', mobile: '98123 67890' },
    ],

    // Locations
    locations: [
        { id: 'loc-1', name: 'Pune HQ', code: 'PUN-HQ', type: 'Head Office', city: 'Pune', state: 'Maharashtra', pin: '411026', isHQ: true, status: 'Active', geoEnabled: true, geoRadius: 200, gstin: '27AABCA1234H1Z5', contactName: 'Priya Sharma', contactDesignation: 'HR Manager', contactEmail: 'priya@apex.com', contactPhone: '+91 99821 43210', modules: ['hr', 'security', 'finance', 'masters'], userTier: 'Growth', billingCycle: 'Annual', trialDays: 0 },
        { id: 'loc-2', name: 'Mumbai Branch', code: 'MUM-BR', type: 'Branch Office', city: 'Mumbai', state: 'Maharashtra', pin: '400001', isHQ: false, status: 'Active', geoEnabled: false, geoRadius: 0, gstin: '27AABCA1234H2Z4', contactName: 'Amit Desai', contactDesignation: 'Branch Head', contactEmail: 'amit@apex.com', contactPhone: '+91 98456 78901', modules: ['hr', 'security', 'sales', 'finance', 'masters'], userTier: 'Starter', billingCycle: 'Annual', trialDays: 0 },
        { id: 'loc-3', name: 'Nashik Plant', code: 'NSK-PL', type: 'Manufacturing Plant', city: 'Nashik', state: 'Maharashtra', pin: '422001', isHQ: false, status: 'Active', geoEnabled: true, geoRadius: 500, gstin: '27AABCA1234H3Z3', contactName: 'Suresh Patil', contactDesignation: 'Plant Manager', contactEmail: 'suresh@apex.com', contactPhone: '+91 97654 32100', modules: ['hr', 'security', 'production', 'machine-maintenance', 'inventory', 'vendor', 'finance', 'masters'], userTier: 'Scale', billingCycle: 'Annual', trialDays: 14 },
    ],

    // Shifts
    dayStartTime: '06:00',
    dayEndTime: '06:00',
    weeklyOffs: ['Sunday'],
    shifts: [
        { name: 'Morning Shift', time: '06:00 – 14:00', noShuffle: false, downtimeSlots: [{ type: 'Lunch Break', duration: '30 min' }, { type: 'Tea Break', duration: '15 min' }] },
        { name: 'Afternoon Shift', time: '14:00 – 22:00', noShuffle: false, downtimeSlots: [{ type: 'Lunch Break', duration: '30 min' }, { type: 'Tea Break', duration: '15 min' }] },
        { name: 'Night Shift', time: '22:00 – 06:00', noShuffle: true, downtimeSlots: [{ type: 'Lunch Break', duration: '30 min' }] },
    ],

    // No. Series
    noSeries: [
        { code: 'INV', screen: 'Sales Invoice', prefix: 'INV-', suffix: '', digits: 6, start: 1, preview: 'INV-000001' },
        { code: 'PO', screen: 'Purchase Order', prefix: 'PO-', suffix: '', digits: 6, start: 1, preview: 'PO-000001' },
        { code: 'EMP', screen: 'Employee Master', prefix: 'EMP-', suffix: '', digits: 5, start: 1, preview: 'EMP-00001' },
        { code: 'WO', screen: 'Work Order', prefix: 'WO-', suffix: '', digits: 6, start: 1, preview: 'WO-000001' },
        { code: 'GRN', screen: 'Goods Receipt', prefix: 'GRN-', suffix: '', digits: 6, start: 1, preview: 'GRN-000001' },
        { code: 'MT', screen: 'Maintenance Ticket', prefix: 'MT-', suffix: '', digits: 5, start: 1, preview: 'MT-00001' },
    ],

    // IOT Reasons
    iotReasons: [
        { reasonType: 'Machine Idle', reason: 'MATERIAL SHORTAGE', department: 'Production', planned: false },
        { reasonType: 'Machine Idle', reason: 'CHANGEOVER', department: 'Production', planned: true },
        { reasonType: 'Machine Idle', reason: 'SCHEDULED BREAK', department: 'All', planned: true },
        { reasonType: 'Machine Alarm', reason: 'MACHINE BREAKDOWN', department: 'Maintenance', planned: false },
        { reasonType: 'Machine Alarm', reason: 'HYDRAULIC FAILURE', department: 'Maintenance', planned: false },
        { reasonType: 'Machine Alarm', reason: 'SPINDLE ERROR', department: 'Maintenance', planned: false },
    ],

    // Controls
    controls: {
        ncEditMode: false, loadUnload: true, cycleTime: true,
        payrollLock: true, leaveCarryForward: true, overtimeApproval: true,
        mfa: true,
    },

    // Users list
    users: [
        { fullName: 'Rahul Mehta', username: 'rahul.mehta', role: 'Company Admin', email: 'rahul@apex.com', department: 'IT', location: 'Pune HQ' },
        { fullName: 'Priya Sharma', username: 'priya.sharma', role: 'HR Manager', email: 'priya@apex.com', department: 'Human Resources', location: 'Pune HQ' },
        { fullName: 'Suresh Patil', username: 'suresh.patil', role: 'Plant Manager', email: 'suresh@apex.com', department: 'Production', location: 'Nashik Plant' },
        { fullName: 'Meera Joshi', username: 'meera.joshi', role: 'Finance Manager', email: 'meera@apex.com', department: 'Finance', location: 'Pune HQ' },
        { fullName: 'Amit Desai', username: 'amit.desai', role: 'IT Admin', email: 'amit@apex.com', department: 'IT', location: 'Mumbai Branch' },
    ],

    createdAt: 'Jan 12, 2026',
    createdBy: 'super.admin',
};

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

function EditButton({ label = 'Edit' }: { label?: string }) {
    return (
        <button
            type="button"
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

// ============================================================
// Main Screen
// ============================================================

export function CompanyDetailScreen() {
    useParams();

    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        statutory: false,
        fiscal: false,
        preferences: false,
        controls: false,
        shifts: false,
        noSeries: false,
        iotReasons: false,
        users: false,
    });

    const toggle = (key: string) =>
        setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));

    const totalMonthlyModules = TENANT.modules.reduce((s, m) => s + m.price, 0);
    const totalMonthly = totalMonthlyModules + TENANT.tierBasePrice;

    const idleReasons = TENANT.iotReasons.filter(r => r.reasonType === 'Machine Idle');
    const alarmReasons = TENANT.iotReasons.filter(r => r.reasonType === 'Machine Alarm');

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
                        <span className="text-neutral-800 font-semibold dark:text-neutral-200">{TENANT.displayName}</span>
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
                        {TENANT.companyCode}
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
                                    <h1 className="text-2xl font-bold text-primary-950 dark:text-white">{TENANT.displayName}</h1>
                                    <StatusPill status={TENANT.status} />
                                </div>
                                <p className="text-sm text-neutral-500 font-medium dark:text-neutral-400">{TENANT.legalName}</p>
                                <div className="flex items-center gap-3 mt-2 text-xs text-neutral-400 flex-wrap dark:text-neutral-500">
                                    <span className="bg-neutral-100 px-2.5 py-1 rounded-lg font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">{TENANT.industry}</span>
                                    <span className="bg-neutral-100 px-2.5 py-1 rounded-lg font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">{TENANT.businessType}</span>
                                    <span className="font-mono text-neutral-400 dark:text-neutral-500">ID: {TENANT.id}</span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="flex gap-6 border-t md:border-t-0 border-neutral-100 pt-4 md:pt-0 flex-wrap dark:border-neutral-800 md:mt-2">
                            <div>
                                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1 dark:text-neutral-500">Users</p>
                                <p className="text-xl font-bold text-primary-950 dark:text-white">
                                    {TENANT.activeUsers}
                                    <span className="text-sm text-neutral-400 font-medium dark:text-neutral-500"> / {TENANT.maxUsers}</span>
                                </p>
                            </div>
                            <div className="w-px h-10 bg-neutral-200 hidden md:block self-center dark:bg-neutral-700" />
                            <div>
                                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1 dark:text-neutral-500">Modules</p>
                                <p className="text-xl font-bold text-primary-950 dark:text-white">
                                    {TENANT.modules.length}
                                    <span className="text-sm text-neutral-400 font-medium dark:text-neutral-500"> active</span>
                                </p>
                            </div>
                            <div className="w-px h-10 bg-neutral-200 hidden md:block self-center dark:bg-neutral-700" />
                            <div>
                                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1 dark:text-neutral-500">Locations</p>
                                <p className="text-xl font-bold text-primary-950 dark:text-white">
                                    {TENANT.locations.length}
                                </p>
                            </div>
                            <div className="w-px h-10 bg-neutral-200 hidden md:block self-center dark:bg-neutral-700" />
                            <div>
                                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1 dark:text-neutral-500">Created</p>
                                <p className="text-sm font-bold text-primary-950 dark:text-white">{TENANT.createdAt}</p>
                                <p className="text-[10px] text-neutral-400 dark:text-neutral-500">by {TENANT.createdBy}</p>
                            </div>
                        </div>
                    </div>

                    {/* Strategy Badge */}
                    {TENANT.multiLocationMode && (
                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                            <Layers size={13} className="text-accent-500" />
                            <span className="text-xs font-bold text-accent-700 dark:text-accent-400 bg-accent-50 dark:bg-accent-900/20 px-2.5 py-1 rounded-lg border border-accent-100 dark:border-accent-800/50">
                                Multi-Location · {TENANT.locationConfig === 'per-location' ? 'Per-Location Config' : 'Unified Config'}
                            </span>
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
                            <SectionHeader icon={Building2} title="Company Identity" action={<EditButton />} />
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-5 mt-5">
                                <DetailField label="Display Name" value={TENANT.displayName} />
                                <DetailField label="Legal Name" value={TENANT.legalName} />
                                <DetailField label="Short Name" value={TENANT.shortName} />
                                <DetailField label="Company Code" value={TENANT.companyCode} mono />
                                <DetailField label="CIN" value={TENANT.cin} mono />
                                <DetailField label="Incorporation Date" value={TENANT.incorporationDate} />
                                <DetailField label="Employee Count" value={TENANT.employees} />
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
                                <DetailField label="Email Domain" value={`@${TENANT.emailDomain}`} mono />
                            </div>
                        </CardBody>
                    </Card>

                    {/* --- Statutory & Tax (collapsible) --- */}
                    <Card>
                        <CardBody>
                            <SectionHeader
                                icon={Landmark}
                                title="Statutory & Tax"
                                action={<EditButton />}
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
                                    {[TENANT.pan, TENANT.gstin, TENANT.pfRegNo].map((val, i) => (
                                        <span key={i} className="font-mono text-xs bg-neutral-50 border border-neutral-100 px-2.5 py-1 rounded-lg text-neutral-600 dark:bg-neutral-800 dark:border-neutral-800 dark:text-neutral-300">
                                            {val}
                                        </span>
                                    ))}
                                    <span className="text-xs text-neutral-400 dark:text-neutral-500">+ more…</span>
                                </div>
                            )}
                        </CardBody>
                    </Card>

                    {/* --- Registered & Corporate Address --- */}
                    <Card>
                        <CardBody>
                            <SectionHeader icon={MapPin} title="Registered & Corporate Address" action={<EditButton />} />
                            <div className="mt-4 space-y-3">
                                {/* Registered Address */}
                                <div className="flex items-start gap-4 bg-neutral-50 rounded-xl px-5 py-4 border border-neutral-100 dark:bg-neutral-800 dark:border-neutral-800">
                                    <MapPin size={16} className="text-primary-500 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="text-xs font-bold text-primary-600 uppercase tracking-wider dark:text-primary-400">Registered Address</p>
                                        </div>
                                        <p className="text-sm font-bold text-primary-950 dark:text-white">{TENANT.regLine1}</p>
                                        {TENANT.regLine2 && <p className="text-sm text-neutral-600 dark:text-neutral-300">{TENANT.regLine2}</p>}
                                        <p className="text-sm text-neutral-600 dark:text-neutral-300">
                                            {TENANT.regCity}, {TENANT.regDistrict} – {TENANT.regPin}
                                        </p>
                                        <p className="text-sm text-neutral-600 dark:text-neutral-300">
                                            {TENANT.regState}, {TENANT.regCountry}
                                        </p>
                                        {TENANT.regStdCode && (
                                            <p className="text-xs text-neutral-400 mt-1 dark:text-neutral-500">STD Code: {TENANT.regStdCode}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Corporate Address */}
                                {TENANT.sameAsRegistered ? (
                                    <div className="flex items-center gap-2 px-5 py-3 bg-info-50 rounded-xl border border-info-100 dark:bg-info-900/20 dark:border-info-800/50">
                                        <CheckCircle2 size={13} className="text-info-500 flex-shrink-0" />
                                        <p className="text-xs font-semibold text-info-700 dark:text-info-400">Corporate address same as registered</p>
                                    </div>
                                ) : (
                                    <div className="flex items-start gap-4 bg-neutral-50 rounded-xl px-5 py-4 border border-neutral-100 dark:bg-neutral-800 dark:border-neutral-800">
                                        <MapPin size={16} className="text-accent-500 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="text-xs font-bold text-accent-600 uppercase tracking-wider dark:text-accent-400">Corporate Address</p>
                                            </div>
                                            <p className="text-sm font-bold text-primary-950 dark:text-white">{TENANT.corpLine1}</p>
                                            {TENANT.corpLine2 && <p className="text-sm text-neutral-600 dark:text-neutral-300">{TENANT.corpLine2}</p>}
                                            <p className="text-sm text-neutral-600 dark:text-neutral-300">
                                                {TENANT.corpCity}, {TENANT.corpDistrict} – {TENANT.corpPin}
                                            </p>
                                            <p className="text-sm text-neutral-600 dark:text-neutral-300">
                                                {TENANT.corpState}, {TENANT.corpCountry}
                                            </p>
                                            {TENANT.corpStdCode && (
                                                <p className="text-xs text-neutral-400 mt-1 dark:text-neutral-500">STD Code: {TENANT.corpStdCode}</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardBody>
                    </Card>

                    {/* --- Fiscal & Calendar (collapsible) --- */}
                    <Card>
                        <CardBody>
                            <SectionHeader
                                icon={Calendar}
                                title="Fiscal & Calendar"
                                action={<EditButton />}
                                expanded={expandedSections.fiscal}
                                onToggle={() => toggle('fiscal')}
                            />
                            {expandedSections.fiscal ? (
                                <div className="mt-5 space-y-4 animate-in fade-in duration-200">
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-5">
                                        <DetailField label="Financial Year" value={TENANT.fy} />
                                        <DetailField label="Payroll Frequency" value={TENANT.payrollFreq} />
                                        <DetailField label="Timezone" value={TENANT.timezone} />
                                        <DetailField label="Cutoff Day" value={`${TENANT.cutoffDay}th of month`} />
                                        <DetailField label="Disbursement Day" value={`${TENANT.disbursementDay}st of month`} />
                                        <DetailField label="Week Start" value={TENANT.weekStart} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 dark:text-neutral-500">Working Days</p>
                                        <div className="flex flex-wrap gap-2">
                                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d) => (
                                                <span key={d} className={cn(
                                                    'px-3 py-1 rounded-lg text-xs font-semibold border',
                                                    TENANT.workingDays.includes(d)
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
                                    <span className="font-semibold">{TENANT.fy}</span>
                                    <span>·</span>
                                    <span>{TENANT.payrollFreq}</span>
                                    <span>·</span>
                                    <span>{TENANT.timezone}</span>
                                    <span>·</span>
                                    <span>Cutoff: {TENANT.cutoffDay}th</span>
                                </div>
                            )}
                        </CardBody>
                    </Card>

                    {/* --- Backend Endpoint --- */}
                    <Card>
                        <CardBody>
                            <SectionHeader icon={Server} title="Backend Endpoint" action={<EditButton label="Configure" />} />
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
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <p className="font-bold text-primary-950 dark:text-white">
                                            {TENANT.endpointType === 'custom' ? 'Custom Self-Hosted Server' : 'Avyren Default Cloud'}
                                        </p>
                                        <span className={cn(
                                            'px-2 py-0.5 text-[10px] font-bold rounded-full',
                                            TENANT.endpointStatus === 'healthy'
                                                ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400'
                                                : TENANT.endpointStatus === 'degraded'
                                                    ? 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400'
                                                    : 'bg-danger-100 dark:bg-danger-900/30 text-danger-700 dark:text-danger-400'
                                        )}>
                                            {TENANT.endpointStatus === 'healthy' ? '✓ Healthy' :
                                                TENANT.endpointStatus === 'degraded' ? '⚠ Degraded' : '✗ Unreachable'}
                                        </span>
                                    </div>
                                    {TENANT.customUrl && (
                                        <p className="text-xs font-mono bg-white border border-primary-100 text-primary-700 px-3 py-1.5 rounded-lg inline-block dark:bg-neutral-900 dark:border-primary-800/50 dark:text-primary-400">
                                            {TENANT.customUrl}
                                        </p>
                                    )}
                                    {TENANT.region && (
                                        <p className="text-xs text-neutral-500 mt-1 dark:text-neutral-400">Region: {TENANT.region}</p>
                                    )}
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    {/* --- Active Modules --- */}
                    <Card>
                        <CardBody>
                            <SectionHeader icon={Blocks} title="Active Modules" subtitle={`${TENANT.modules.length} modules enabled`} action={<EditButton label="Manage" />} />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
                                {TENANT.modules.map((mod) => (
                                    <div key={mod.id} className="flex items-center justify-between bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-3 dark:bg-neutral-800 dark:border-neutral-800">
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg">{mod.icon}</span>
                                            <p className="text-sm font-semibold text-primary-950 dark:text-white">{mod.name}</p>
                                        </div>
                                        <span className="text-xs font-bold text-primary-600">
                                            ₹{mod.price.toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center justify-between bg-primary-50 rounded-xl px-4 py-3 mt-4 border border-primary-100 dark:bg-primary-900/30 dark:border-primary-800/50">
                                <p className="text-sm font-bold text-primary-800 dark:text-primary-300">Module Cost Subtotal</p>
                                <p className="text-lg font-bold text-primary-700 dark:text-primary-400">₹{totalMonthlyModules.toLocaleString('en-IN')}<span className="text-xs font-normal text-primary-500">/mo</span></p>
                            </div>
                        </CardBody>
                    </Card>

                    {/* --- Locations / Plants --- */}
                    <Card>
                        <CardBody>
                            <SectionHeader icon={MapPin} title="Plants & Locations" subtitle={`${TENANT.locations.length} locations`} action={<EditButton label="Manage" />} />
                            <div className="space-y-3 mt-5">
                                {TENANT.locations.map((loc) => (
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
                                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{loc.type} · {loc.city}, {loc.state} – {loc.pin}</p>
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
                                            <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400">GSTIN: {loc.gstin}</span>
                                            <span className="text-[10px] text-neutral-400 dark:text-neutral-500">·</span>
                                            <span className="text-[10px] text-neutral-600 dark:text-neutral-300">
                                                <Mail size={9} className="inline mr-1" />{loc.contactName} ({loc.contactDesignation})
                                            </span>
                                            <span className="text-[10px] text-neutral-400 dark:text-neutral-500">·</span>
                                            <span className="text-[10px] text-neutral-600 dark:text-neutral-300">{loc.modules.length} modules</span>
                                            <span className="text-[10px] text-neutral-400 dark:text-neutral-500">·</span>
                                            <span className="text-[10px] font-semibold text-accent-600 dark:text-accent-400">{loc.userTier} tier</span>
                                            <span className="text-[10px] text-neutral-400 dark:text-neutral-500">·</span>
                                            <span className="text-[10px] text-neutral-600 dark:text-neutral-300">{loc.billingCycle}</span>
                                            {loc.trialDays > 0 && (
                                                <>
                                                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500">·</span>
                                                    <span className="text-[10px] font-bold text-info-600 dark:text-info-400">{loc.trialDays}d trial</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>

                    {/* --- Shifts (collapsible) --- */}
                    <Card>
                        <CardBody>
                            <SectionHeader
                                icon={Clock}
                                title="Shifts & Time"
                                subtitle={`${TENANT.shifts.length} shifts configured`}
                                action={<EditButton label="Manage" />}
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
                                            <span className="text-xs font-mono font-bold text-primary-700 dark:text-primary-400">{TENANT.dayStartTime} – {TENANT.dayEndTime}</span>
                                        </div>
                                        <span className="text-neutral-300 dark:text-neutral-600">|</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">Weekly Off:</span>
                                            {TENANT.weeklyOffs.map((d) => (
                                                <span key={d} className="text-xs font-bold bg-danger-50 text-danger-700 px-2 py-0.5 rounded border border-danger-100 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50">
                                                    {d}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Shift cards */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {TENANT.shifts.map((sh, i) => (
                                            <div key={i} className="bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-4 dark:bg-neutral-800 dark:border-neutral-800">
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className="text-sm font-bold text-primary-950 dark:text-white">{sh.name}</p>
                                                    {sh.noShuffle && (
                                                        <span className="text-[10px] font-bold bg-warning-50 text-warning-700 px-1.5 py-0.5 rounded border border-warning-100 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50">
                                                            No Shuffle
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs font-mono text-neutral-600 dark:text-neutral-300">{sh.time}</p>
                                                {sh.downtimeSlots.length > 0 && (
                                                    <div className="mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-700 space-y-1">
                                                        {sh.downtimeSlots.map((slot, si) => (
                                                            <div key={si} className="flex items-center justify-between">
                                                                <span className="text-[10px] text-neutral-500 dark:text-neutral-400">{slot.type}</span>
                                                                <span className="text-[10px] font-semibold text-neutral-600 dark:text-neutral-300">{slot.duration}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {!expandedSections.shifts && (
                                <div className="flex items-center gap-3 mt-3 flex-wrap">
                                    <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400">{TENANT.dayStartTime}–{TENANT.dayEndTime}</span>
                                    <span className="text-xs text-neutral-300 dark:text-neutral-600">|</span>
                                    <p className="text-xs text-neutral-400 dark:text-neutral-500">{TENANT.shifts.map(s => s.name).join(' · ')}</p>
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
                                subtitle={`${TENANT.noSeries.length} series configured`}
                                action={<EditButton label="Manage" />}
                                expanded={expandedSections.noSeries}
                                onToggle={() => toggle('noSeries')}
                            />
                            {expandedSections.noSeries && (
                                <div className="mt-5 animate-in fade-in duration-200">
                                    <div className="rounded-xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
                                        {/* Table header */}
                                        <div className="grid grid-cols-4 bg-neutral-50 dark:bg-neutral-800 px-4 py-2.5 border-b border-neutral-100 dark:border-neutral-700">
                                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider dark:text-neutral-500">Code</span>
                                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider dark:text-neutral-500">Screen</span>
                                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider dark:text-neutral-500">Format</span>
                                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider dark:text-neutral-500 text-right">Preview</span>
                                        </div>
                                        {/* Table rows */}
                                        {TENANT.noSeries.map((ns, i) => (
                                            <div key={ns.code} className={cn(
                                                'grid grid-cols-4 px-4 py-3 items-center',
                                                i < TENANT.noSeries.length - 1 && 'border-b border-neutral-50 dark:border-neutral-800'
                                            )}>
                                                <span className="text-xs font-mono font-bold text-primary-700 dark:text-primary-400">{ns.code}</span>
                                                <span className="text-xs text-neutral-700 dark:text-neutral-300">{ns.screen}</span>
                                                <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                                                    {ns.prefix}<span className="text-neutral-300 dark:text-neutral-600">{'0'.repeat(ns.digits)}</span>{ns.suffix}
                                                </span>
                                                <span className="text-xs font-mono font-semibold text-primary-950 dark:text-white text-right">{ns.preview}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {!expandedSections.noSeries && (
                                <div className="flex items-center gap-2 mt-3 flex-wrap">
                                    {TENANT.noSeries.slice(0, 4).map((ns) => (
                                        <span key={ns.code} className="font-mono text-xs bg-neutral-50 border border-neutral-100 px-2.5 py-1 rounded-lg text-neutral-600 dark:bg-neutral-800 dark:border-neutral-800 dark:text-neutral-300">
                                            {ns.preview}
                                        </span>
                                    ))}
                                    {TENANT.noSeries.length > 4 && (
                                        <span className="text-xs text-neutral-400 dark:text-neutral-500">+{TENANT.noSeries.length - 4} more</span>
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
                                subtitle={`${TENANT.iotReasons.length} reasons configured`}
                                action={<EditButton label="Manage" />}
                                expanded={expandedSections.iotReasons}
                                onToggle={() => toggle('iotReasons')}
                            />
                            {expandedSections.iotReasons && (
                                <div className="mt-5 space-y-4 animate-in fade-in duration-200">
                                    {/* Summary badges */}
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-bold bg-warning-50 text-warning-700 border border-warning-200 px-3 py-1.5 rounded-lg dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50">
                                            ⏸ {idleReasons.length} Idle Reasons
                                        </span>
                                        <span className="text-xs font-bold bg-danger-50 text-danger-700 border border-danger-200 px-3 py-1.5 rounded-lg dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50">
                                            🚨 {alarmReasons.length} Alarm Reasons
                                        </span>
                                    </div>
                                    {/* Reason list */}
                                    <div className="space-y-2">
                                        {TENANT.iotReasons.map((r, i) => (
                                            <div key={i} className="flex items-center justify-between bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-3 dark:bg-neutral-800 dark:border-neutral-800">
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
                                action={<EditButton label="Configure" />}
                                expanded={expandedSections.controls}
                                onToggle={() => toggle('controls')}
                            />
                            {expandedSections.controls && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5 animate-in fade-in duration-200">
                                    <ControlBadge label="NC Edit Mode" value={TENANT.controls.ncEditMode} />
                                    <ControlBadge label="Load/Unload Tracking" value={TENANT.controls.loadUnload} />
                                    <ControlBadge label="Cycle Time Capture" value={TENANT.controls.cycleTime} />
                                    <ControlBadge label="Payroll Lock" value={TENANT.controls.payrollLock} />
                                    <ControlBadge label="Leave Carry Forward" value={TENANT.controls.leaveCarryForward} />
                                    <ControlBadge label="Overtime Approval" value={TENANT.controls.overtimeApproval} />
                                    <ControlBadge label="MFA Required" value={TENANT.controls.mfa} />
                                </div>
                            )}
                            {!expandedSections.controls && (
                                <div className="flex items-center gap-2 mt-3 flex-wrap">
                                    {Object.entries(TENANT.controls).filter(([, v]) => v).length} of {Object.keys(TENANT.controls).length}
                                    <span className="text-xs text-neutral-400 dark:text-neutral-500">controls enabled</span>
                                    <div className="flex gap-1.5">
                                        {Object.values(TENANT.controls).map((v, i) => (
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
                                    <p className="text-2xl font-black text-white">{TENANT.tier}</p>
                                    <p className="text-xs text-primary-200">{TENANT.tierRange}</p>
                                </div>
                                <p className="text-3xl font-bold text-white mt-3">
                                    ₹{totalMonthly.toLocaleString('en-IN')}
                                    <span className="text-base font-normal text-primary-200">/mo</span>
                                </p>
                                <p className="text-xs text-primary-200 mt-1">{TENANT.billingCycle} billing · {TENANT.trialDays}d trial</p>
                            </div>
                        </div>
                        <CardBody className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-neutral-500 dark:text-neutral-400">Tier Base</span>
                                <span className="font-semibold text-primary-950 dark:text-white">₹{TENANT.tierBasePrice.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-neutral-500 dark:text-neutral-400">Per-User Rate</span>
                                <span className="font-semibold text-primary-950 dark:text-white">₹{TENANT.perUserPrice}/user</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-neutral-500 dark:text-neutral-400">Modules ({TENANT.modules.length})</span>
                                <span className="font-semibold text-primary-950 dark:text-white">₹{totalMonthlyModules.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="pt-3 border-t border-neutral-100 flex items-center gap-2 dark:border-neutral-800">
                                <Calendar size={13} className="text-neutral-400 dark:text-neutral-500" />
                                <span className="text-xs text-neutral-500 dark:text-neutral-400">Renewal: <strong className="text-primary-950 dark:text-white">{TENANT.renewalDate}</strong></span>
                            </div>
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
                            <SectionHeader icon={Users} title="User Capacity" action={<EditButton label="Edit Limit" />} />
                            <div className="mt-5">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-3xl font-black text-primary-950 dark:text-white">{TENANT.activeUsers}</span>
                                    <span className="text-sm text-neutral-400 dark:text-neutral-500">/ {TENANT.maxUsers} max</span>
                                </div>
                                <div className="h-3 w-full bg-neutral-100 rounded-full overflow-hidden mb-2 dark:bg-neutral-800">
                                    <div
                                        className={cn(
                                            'h-full rounded-full transition-all duration-700',
                                            TENANT.activeUsers / TENANT.maxUsers > 0.9
                                                ? 'bg-danger-500'
                                                : TENANT.activeUsers / TENANT.maxUsers > 0.7
                                                    ? 'bg-warning-500'
                                                    : 'bg-gradient-to-r from-primary-500 to-accent-500'
                                        )}
                                        style={{ width: `${(TENANT.activeUsers / TENANT.maxUsers) * 100}%` }}
                                    />
                                </div>
                                <p className="text-xs text-neutral-400 dark:text-neutral-500">
                                    {Math.round((TENANT.activeUsers / TENANT.maxUsers) * 100)}% capacity used
                                    · {TENANT.maxUsers - TENANT.activeUsers} slots available
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
                                subtitle={`${TENANT.users.length} users provisioned`}
                                action={<EditButton label="Manage" />}
                                expanded={expandedSections.users}
                                onToggle={() => toggle('users')}
                            />
                            {expandedSections.users && (
                                <div className="space-y-3 mt-5 animate-in fade-in duration-200">
                                    {TENANT.users.map((u, i) => (
                                        <div key={i} className="flex items-start gap-3 bg-neutral-50 rounded-xl px-4 py-3 border border-neutral-100 dark:bg-neutral-800 dark:border-neutral-800">
                                            <div className="w-9 h-9 rounded-lg bg-accent-100 flex items-center justify-center flex-shrink-0 text-sm font-bold text-accent-700 dark:bg-accent-900/40 dark:text-accent-400">
                                                {u.fullName.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="text-sm font-bold text-primary-950 dark:text-white">{u.fullName}</p>
                                                    <span className="text-[10px] font-bold bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded dark:bg-primary-900/30 dark:text-primary-400">
                                                        {u.role}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">@{u.username}</p>
                                                <div className="flex items-center gap-3 mt-1 flex-wrap text-[10px] text-neutral-500 dark:text-neutral-400">
                                                    <span>{u.department}</span>
                                                    <span className="text-neutral-300 dark:text-neutral-600">·</span>
                                                    <span className="flex items-center gap-1"><MapPin size={8} />{u.location}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {!expandedSections.users && (
                                <div className="flex items-center gap-2 mt-3">
                                    <div className="flex -space-x-2">
                                        {TENANT.users.slice(0, 4).map((u, i) => (
                                            <div key={i} className="w-7 h-7 rounded-full bg-accent-100 border-2 border-white dark:border-neutral-900 flex items-center justify-center text-[10px] font-bold text-accent-700 dark:bg-accent-900/40 dark:text-accent-400">
                                                {u.fullName.charAt(0)}
                                            </div>
                                        ))}
                                    </div>
                                    {TENANT.users.length > 4 && (
                                        <span className="text-xs text-neutral-400 dark:text-neutral-500">+{TENANT.users.length - 4} more</span>
                                    )}
                                </div>
                            )}
                        </CardBody>
                    </Card>

                    {/* --- Key Contacts --- */}
                    <Card>
                        <CardBody>
                            <SectionHeader icon={Phone} title="Key Contacts" action={<EditButton label="Manage" />} />
                            <div className="space-y-3 mt-5">
                                {TENANT.contacts.map((c, i) => (
                                    <div key={i} className="flex items-start gap-3 bg-neutral-50 rounded-xl px-4 py-3 border border-neutral-100 dark:bg-neutral-800 dark:border-neutral-800">
                                        <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0 text-sm font-bold text-primary-700 dark:bg-primary-900/40 dark:text-primary-400">
                                            {c.name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-sm font-bold text-primary-950 dark:text-white">{c.name}</p>
                                                <TypeBadge type={c.type} variant={c.type === 'Primary' ? 'info' : 'default'} />
                                            </div>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400">{c.designation} · {c.department}</p>
                                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                                <a href={`mailto:${c.email}`} className="text-xs text-primary-600 flex items-center gap-1 hover:underline dark:text-primary-400">
                                                    <Mail size={10} /> {c.email}
                                                </a>
                                                <span className="text-xs text-neutral-500 flex items-center gap-1 dark:text-neutral-400">
                                                    <Phone size={10} /> {c.countryCode} {c.mobile}
                                                </span>
                                            </div>
                                            {'linkedin' in c && c.linkedin && (
                                                <a
                                                    href={`https://${c.linkedin}`}
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
                            </div>
                        </CardBody>
                    </Card>

                    {/* --- Preferences & Security (collapsible) --- */}
                    <Card>
                        <CardBody>
                            <SectionHeader
                                icon={Shield}
                                title="Preferences & Security"
                                expanded={expandedSections.preferences}
                                onToggle={() => toggle('preferences')}
                            />
                            {expandedSections.preferences && (
                                <div className="space-y-3 mt-4 animate-in fade-in duration-200">
                                    <div className="grid grid-cols-2 gap-3">
                                        <ControlBadge label="India Compliance" value={TENANT.indiaCompliance} />
                                        <ControlBadge label="MFA" value={TENANT.mfa} />
                                        <ControlBadge label="Web App" value={TENANT.webApp} />
                                        <ControlBadge label="System App" value={TENANT.systemApp} />
                                        <ControlBadge label="Mobile App" value={TENANT.mobileApp} />
                                        <ControlBadge label="Bank Integration" value={TENANT.bankIntegration} />
                                        <ControlBadge label="Email Notifications" value={TENANT.emailNotif} />
                                        <ControlBadge label="WhatsApp" value={TENANT.whatsapp} />
                                        <ControlBadge label="Biometric" value={TENANT.biometric} />
                                        <ControlBadge label="RazorpayX Payout" value={TENANT.razorpayEnabled} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                                        <DetailField label="Currency" value={TENANT.currency} />
                                        <DetailField label="Language" value={TENANT.language} />
                                        <DetailField label="Date Format" value={TENANT.dateFormat} />
                                        <DetailField label="Number Format" value={TENANT.numberFormat} />
                                        <DetailField label="Time Format" value={TENANT.timeFormat} />
                                    </div>
                                </div>
                            )}
                            {!expandedSections.preferences && (
                                <p className="text-xs text-neutral-400 mt-2 dark:text-neutral-500">
                                    {TENANT.currency} · {TENANT.language} · {[
                                        TENANT.mfa && 'MFA',
                                        TENANT.indiaCompliance && 'India',
                                        TENANT.bankIntegration && 'Bank',
                                        TENANT.biometric && 'Biometric',
                                    ].filter(Boolean).join(' · ')}
                                </p>
                            )}
                        </CardBody>
                    </Card>

                    {/* --- Danger Zone --- */}
                    <Card className="border-danger-200 dark:border-danger-800/50">
                        <div className="px-5 pt-4 pb-2">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-danger-50 flex items-center justify-center dark:bg-danger-900/20">
                                    <AlertTriangle size={15} className="text-danger-500" />
                                </div>
                                <h3 className="text-sm font-bold text-danger-900">Tenant Actions</h3>
                            </div>
                        </div>
                        <CardBody className="pt-3 space-y-2">
                            <button className="w-full flex items-center justify-between px-4 py-3 bg-white border border-danger-100 hover:bg-danger-50 text-danger-700 rounded-xl transition-colors text-sm font-bold group dark:bg-danger-900/20 dark:border-danger-800/50 dark:text-danger-400">
                                <div className="flex items-center gap-2">
                                    <PowerOff size={14} />
                                    Suspend Access
                                </div>
                                <span className="text-[10px] bg-warning-100 text-warning-700 px-2 py-0.5 rounded font-bold dark:bg-warning-900/30 dark:text-warning-400">Reversible</span>
                            </button>
                            <button className="w-full flex items-center justify-between px-4 py-3 bg-danger-600 hover:bg-danger-700 text-white rounded-xl transition-colors text-sm font-bold shadow-md shadow-danger-500/20">
                                <div className="flex items-center gap-2">
                                    <Trash2 size={14} />
                                    Delete Tenant
                                </div>
                                <span className="text-[10px] bg-danger-800/50 px-2 py-0.5 rounded text-danger-200">No Recovery</span>
                            </button>
                        </CardBody>
                    </Card>

                </div>
            </div>
        </div>
    );
}
