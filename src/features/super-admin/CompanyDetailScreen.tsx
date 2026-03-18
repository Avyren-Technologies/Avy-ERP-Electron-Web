// ============================================================
// Company Detail Screen — Comprehensive Tenant View
// Shows all 15 wizard sections in a rich, read-only detail page
// ============================================================
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
    Building2, ArrowLeft, Server, Users, AlertTriangle,
    Blocks, PowerOff, Trash2, Calendar, MapPin, Mail, Phone,
    ChevronDown, ChevronUp, Star, Shield, Clock, Settings,
    Landmark, CheckCircle2, XCircle, ExternalLink, Edit3, RefreshCw,
} from 'lucide-react';

// ============================================================
// MOCK DATA — Replace with API call in production
// ============================================================
const TENANT = {
    id: 'APEX-001',
    displayName: 'Apex Manufacturing Pvt. Ltd.',
    legalName: 'Apex Manufacturing Private Limited',
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

    // Address
    hqAddress: 'Plot 45, MIDC Industrial Area, Bhosari',
    hqCity: 'Pune',
    hqState: 'Maharashtra',
    hqPin: '411026',

    // Fiscal
    fy: 'April – March',
    payrollFreq: 'Monthly',
    timezone: 'IST UTC+5:30',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],

    // Preferences
    currency: 'INR — ₹',
    language: 'English',
    dateFormat: 'DD/MM/YYYY',
    mfa: true,
    ess: true,
    mobileApp: true,
    biometric: true,
    razorpayEnabled: true,

    // Endpoint
    endpointType: 'custom' as 'default' | 'custom',
    customUrl: 'https://erp.apex.com/api',
    endpointStatus: 'healthy' as 'healthy' | 'degraded' | 'unreachable',
    region: '',

    // Modules
    modules: [
        { id: 'masters', name: 'Masters & Config', icon: '⚙️', price: 0 },
        { id: 'security', name: 'Security & RBAC', icon: '🔐', price: 2000 },
        { id: 'hr', name: 'HR & Payroll', icon: '👥', price: 8000 },
        { id: 'production', name: 'Production', icon: '🏭', price: 6000 },
        { id: 'machine', name: 'Machine Maintenance', icon: '🔧', price: 4000 },
        { id: 'inventory', name: 'Inventory', icon: '📦', price: 5000 },
        { id: 'vendor', name: 'Vendor Management', icon: '🤝', price: 3000 },
        { id: 'sales', name: 'Sales & Invoicing', icon: '💰', price: 4500 },
    ],

    // User Tier
    tier: 'Growth',
    tierRange: '51–200 users',
    tierBasePrice: 15000,
    perUserPrice: 150,
    billingCycle: 'Annual',
    trialDays: 14,
    renewalDate: 'Apr 12, 2027',

    // Users
    activeUsers: 156,
    maxUsers: 200,

    // Contacts
    contacts: [
        { name: 'Priya Sharma', role: 'HR Manager', email: 'priya@apex.com', phone: '+91 99821 43210', type: 'Primary' },
        { name: 'Vikram Nair', role: 'IT Admin', email: 'vikram@apex.com', phone: '+91 98765 12345', type: 'IT' },
    ],

    // Locations
    locations: [
        { name: 'Pune HQ', type: 'Headquarters', city: 'Pune', state: 'Maharashtra', isHQ: true, status: 'Active', geoEnabled: true },
        { name: 'Mumbai Branch', type: 'Branch Office', city: 'Mumbai', state: 'Maharashtra', isHQ: false, status: 'Active', geoEnabled: false },
        { name: 'Nashik Plant', type: 'Manufacturing Plant', city: 'Nashik', state: 'Maharashtra', isHQ: false, status: 'Active', geoEnabled: true },
    ],

    // Shifts
    shifts: [
        { name: 'Morning Shift', time: '06:00 – 14:00', breaks: 1 },
        { name: 'Afternoon Shift', time: '14:00 – 22:00', breaks: 1 },
        { name: 'Night Shift', time: '22:00 – 06:00', breaks: 1 },
    ],

    // Controls
    controls: {
        ncEditMode: false, loadUnload: true, cycleTime: true,
        payrollLock: true, leaveCarryForward: true, overtimeApproval: true,
        mfa: true,
    },

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
    });

    const toggle = (key: string) =>
        setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));

    const totalMonthlyModules = TENANT.modules.reduce((s, m) => s + m.price, 0);
    const totalMonthly = totalMonthlyModules + TENANT.tierBasePrice;

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

                    {/* --- HQ Address --- */}
                    <Card>
                        <CardBody>
                            <SectionHeader icon={MapPin} title="Registered & HQ Address" action={<EditButton />} />
                            <div className="mt-4 flex items-start gap-4 bg-neutral-50 rounded-xl px-5 py-4 border border-neutral-100 dark:bg-neutral-800 dark:border-neutral-800">
                                <MapPin size={16} className="text-primary-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold text-primary-950 dark:text-white">{TENANT.hqAddress}</p>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-300">
                                        {TENANT.hqCity}, {TENANT.hqState} – {TENANT.hqPin}
                                    </p>
                                    <p className="text-xs text-primary-500 mt-1 font-semibold">Headquarters</p>
                                </div>
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
                                            {mod.price === 0 ? 'Free' : `₹${mod.price.toLocaleString('en-IN')}`}
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
                                {TENANT.locations.map((loc, i) => (
                                    <div key={i} className="flex items-center justify-between bg-neutral-50 rounded-xl px-5 py-4 border border-neutral-100 dark:bg-neutral-800 dark:border-neutral-800">
                                        <div className="flex items-center gap-4">
                                            {loc.isHQ && <Star size={14} className="text-warning-500 fill-warning-400 flex-shrink-0" />}
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="text-sm font-bold text-primary-950 dark:text-white">{loc.name}</p>
                                                    {loc.isHQ && (
                                                        <span className="text-[10px] font-bold bg-warning-100 text-warning-700 px-1.5 py-0.5 rounded dark:bg-warning-900/30 dark:text-warning-400">HQ</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-neutral-500 dark:text-neutral-400">{loc.type} · {loc.city}, {loc.state}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap justify-end">
                                            <StatusPill status={loc.status} />
                                            {loc.geoEnabled && (
                                                <span className="text-[10px] font-bold bg-info-50 text-info-700 border border-info-100 px-2 py-0.5 rounded-full dark:bg-info-900/20 dark:text-info-400 dark:border-info-800/50">
                                                    📍 Geo-fenced
                                                </span>
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
                                title="Shifts"
                                subtitle={`${TENANT.shifts.length} shifts configured`}
                                action={<EditButton label="Manage" />}
                                expanded={expandedSections.shifts}
                                onToggle={() => toggle('shifts')}
                            />
                            {expandedSections.shifts && (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 animate-in fade-in duration-200">
                                    {TENANT.shifts.map((sh, i) => (
                                        <div key={i} className="bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-4 dark:bg-neutral-800 dark:border-neutral-800">
                                            <p className="text-sm font-bold text-primary-950 mb-1 dark:text-white">{sh.name}</p>
                                            <p className="text-xs font-mono text-neutral-600 dark:text-neutral-300">{sh.time}</p>
                                            <p className="text-[10px] text-neutral-400 mt-1 dark:text-neutral-500">{sh.breaks} break slot</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {!expandedSections.shifts && (
                                <p className="text-xs text-neutral-400 mt-3 dark:text-neutral-500">{TENANT.shifts.map(s => s.name).join(' · ')}</p>
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
                                            <p className="text-sm font-bold text-primary-950 dark:text-white">{c.name}</p>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400">{c.role}</p>
                                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                                <a href={`mailto:${c.email}`} className="text-xs text-primary-600 flex items-center gap-1 hover:underline">
                                                    <Mail size={10} /> {c.email}
                                                </a>
                                            </div>
                                        </div>
                                        {i === 0 && (
                                            <span className="text-[10px] font-bold bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full flex-shrink-0 dark:bg-primary-900/40 dark:text-primary-400">
                                                Primary
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>

                    {/* --- Preferences Summary (collapsible) --- */}
                    <Card>
                        <CardBody>
                            <SectionHeader
                                icon={Shield}
                                title="Preferences & Security"
                                expanded={expandedSections.preferences}
                                onToggle={() => toggle('preferences')}
                            />
                            {expandedSections.preferences && (
                                <div className="space-y-2 mt-4 animate-in fade-in duration-200">
                                    <ControlBadge label="MFA" value={TENANT.mfa} />
                                    <ControlBadge label="ESS Portal" value={TENANT.ess} />
                                    <ControlBadge label="Mobile App" value={TENANT.mobileApp} />
                                    <ControlBadge label="Biometric" value={TENANT.biometric} />
                                    <ControlBadge label="RazorpayX Payout" value={TENANT.razorpayEnabled} />
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 mt-4">
                                        <DetailField label="Currency" value={TENANT.currency} />
                                        <DetailField label="Language" value={TENANT.language} />
                                        <DetailField label="Date Format" value={TENANT.dateFormat} />
                                    </div>
                                </div>
                            )}
                            {!expandedSections.preferences && (
                                <p className="text-xs text-neutral-400 mt-2 dark:text-neutral-500">
                                    {TENANT.currency} · {TENANT.language} · {[
                                        TENANT.mfa && 'MFA',
                                        TENANT.ess && 'ESS',
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
