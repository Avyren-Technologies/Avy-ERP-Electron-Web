// ============================================================
// TopBar — Search (Cmd+K), Theme Switch, Notifications, Profile
// ============================================================
import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import {
    Search, Sun, Moon, Monitor, Bell, ChevronDown, X,
    LayoutDashboard, Building2, CreditCard, Blocks, Activity,
    Settings, Users, FileText, Package, Wrench, ClipboardList,
    ArrowRight, Command, LogOut,
} from 'lucide-react';
import { useThemeStore } from '@/store/useThemeStore';
import { useAuthStore, getUserInitials, getDisplayName, getRoleLabel } from '@/store/useAuthStore';
import { checkPermission } from '@/lib/api/auth';
import { essApi } from '@/lib/api/ess';
import { useNavigationManifest } from '@/features/company-admin/api';


// ============================================================
// Page title map
// ============================================================
const PAGE_TITLES: Record<string, { title: string; subtitle?: string }> = {
    '/app/dashboard': { title: 'Dashboard', subtitle: 'Overview of your platform' },
    '/app/companies': { title: 'Companies', subtitle: 'Manage all tenants' },
    '/app/billing': { title: 'Billing', subtitle: 'Subscriptions & invoices' },
    '/app/modules': { title: 'Module Catalogue', subtitle: 'Available platform modules' },
    '/app/monitor': { title: 'Platform Monitor', subtitle: 'System health & performance' },
    '/app/settings': { title: 'Settings', subtitle: 'Platform configuration' },
    '/app/notifications': { title: 'Notifications', subtitle: 'Alerts & updates' },
    '/app/help': { title: 'Help & Support', subtitle: '' },
    '/app/hr': { title: 'HR & People', subtitle: 'Workforce management' },
    '/app/company/profile': { title: 'Company Profile', subtitle: 'Manage your company information' },
    '/app/company/locations': { title: 'Locations', subtitle: 'Manage plants and branches' },
    '/app/company/shifts': { title: 'Shifts & Time', subtitle: 'Configure shift schedules' },
    '/app/company/contacts': { title: 'Key Contacts', subtitle: 'Manage company contacts' },
    '/app/company/no-series': { title: 'Number Series', subtitle: 'Configure document numbering' },
    '/app/company/iot-reasons': { title: 'IOT Reasons', subtitle: 'Manage IOT reason codes' },
    '/app/company/controls': { title: 'System Controls', subtitle: 'Configure system parameters' },
    '/app/company/settings': { title: 'Company Settings', subtitle: 'Company preferences and configuration' },
    '/app/company/users': { title: 'User Management', subtitle: 'Manage company users' },
    '/app/company/roles': { title: 'Roles & Permissions', subtitle: 'Configure access control' },
    '/app/company/hr/departments': { title: 'Departments', subtitle: 'Manage organization departments' },
    '/app/company/hr/designations': { title: 'Designations', subtitle: 'Configure job titles and designations' },
    '/app/company/hr/grades': { title: 'Grades & Bands', subtitle: 'Define employee grades and compensation bands' },
    '/app/company/hr/employee-types': { title: 'Employee Types', subtitle: 'Manage employee categories' },
    '/app/company/hr/cost-centres': { title: 'Cost Centres', subtitle: 'Define cost centres for budgeting' },
    '/app/company/hr/employees': { title: 'Employee Directory', subtitle: 'Browse and manage employees' },
    // Transfers & Promotions
    '/app/company/hr/transfers': { title: 'Employee Transfers', subtitle: 'Manage employee transfers across departments and locations' },
    '/app/company/hr/promotions': { title: 'Employee Promotions', subtitle: 'Manage employee promotions and grade changes' },
    '/app/company/hr/delegates': { title: 'Manager Delegation', subtitle: 'Temporarily delegate approval authority' },
    // Attendance
    '/app/company/hr/attendance': { title: 'Attendance Dashboard', subtitle: 'Track daily attendance and trends' },
    '/app/company/hr/holidays': { title: 'Holiday Calendar', subtitle: 'Manage company holidays' },
    '/app/company/hr/rosters': { title: 'Rosters', subtitle: 'Define and manage shift rosters' },
    '/app/company/hr/attendance-rules': { title: 'Attendance Rules', subtitle: 'Configure attendance policies' },
    '/app/company/hr/attendance-overrides': { title: 'Attendance Overrides', subtitle: 'Review override requests' },
    '/app/company/hr/overtime-rules': { title: 'Overtime Rules', subtitle: 'Configure overtime calculation rules' },
    // Leave Management
    '/app/company/hr/leave-types': { title: 'Leave Types', subtitle: 'Define leave categories' },
    '/app/company/hr/leave-policies': { title: 'Leave Policies', subtitle: 'Configure leave entitlements' },
    '/app/company/hr/leave-requests': { title: 'Leave Requests', subtitle: 'Review and manage leave applications' },
    '/app/company/hr/leave-balances': { title: 'Leave Balances', subtitle: 'View and adjust employee leave balances' },
    // Payroll & Compliance
    '/app/company/hr/salary-components': { title: 'Salary Components', subtitle: 'Define earnings and deduction components' },
    '/app/company/hr/salary-structures': { title: 'Salary Structures', subtitle: 'Configure salary templates' },
    '/app/company/hr/employee-salary': { title: 'Employee Salary', subtitle: 'Assign and manage employee compensation' },
    '/app/company/hr/statutory-config': { title: 'Statutory Config', subtitle: 'PF, ESI, PT, Gratuity, Bonus & LWF settings' },
    '/app/company/hr/tax-config': { title: 'Tax & TDS', subtitle: 'Income tax and TDS configuration' },
    '/app/company/hr/bank-config': { title: 'Bank Config', subtitle: 'Salary disbursement bank settings' },
    '/app/company/hr/loan-policies': { title: 'Loan Policies', subtitle: 'Define loan types and eligibility rules' },
    '/app/company/hr/loans': { title: 'Loans', subtitle: 'Manage employee loan records' },
    // Payroll Operations
    '/app/company/hr/payroll-runs': { title: 'Payroll Runs', subtitle: 'Execute monthly payroll processing' },
    '/app/company/hr/payslips': { title: 'Payslips', subtitle: 'View and distribute employee payslips' },
    '/app/company/hr/salary-holds': { title: 'Salary Holds', subtitle: 'Manage salary hold and release' },
    '/app/company/hr/salary-revisions': { title: 'Salary Revisions', subtitle: 'Process salary changes and arrears' },
    '/app/company/hr/statutory-filings': { title: 'Statutory Filings', subtitle: 'PF, ESI, PT and other compliance filings' },
    '/app/company/hr/payroll-reports': { title: 'Payroll Reports', subtitle: 'Salary register, bank file, variance and statutory reports' },
    // ESS & Workflows
    '/app/company/hr/ess-config': { title: 'ESS Config', subtitle: 'Configure Employee Self-Service settings and access' },
    '/app/company/hr/approval-workflows': { title: 'Approval Workflows', subtitle: 'Define multi-step approval chains' },
    '/app/company/hr/approval-requests': { title: 'Approval Requests', subtitle: 'Review and manage pending approvals' },
    '/app/company/hr/notification-templates': { title: 'Notification Templates', subtitle: 'Manage email and push notification templates' },
    '/app/company/hr/notification-rules': { title: 'Notification Rules', subtitle: 'Configure notification triggers and recipients' },
    '/app/company/hr/it-declarations': { title: 'IT Declarations', subtitle: 'Employee income tax declarations and verification' },
    // Exit & Separation
    '/app/company/hr/exit-requests': { title: 'Exit Requests', subtitle: 'Manage employee exit and separation processes' },
    '/app/company/hr/clearance-dashboard': { title: 'Clearance Dashboard', subtitle: 'Track department-wise exit clearances' },
    '/app/company/hr/fnf-settlement': { title: 'F&F Settlement', subtitle: 'Full & final settlement computation and disbursement' },
    // Self-Service
    '/app/company/hr/my-profile': { title: 'My Profile', subtitle: 'Your personal information and documents' },
    '/app/company/hr/my-payslips': { title: 'My Payslips', subtitle: 'View and download your payslips' },
    '/app/company/hr/my-leave': { title: 'My Leave', subtitle: 'Leave balances, applications, and history' },
    '/app/company/hr/my-attendance': { title: 'My Attendance', subtitle: 'Attendance records and regularization' },
    '/app/company/hr/shift-check-in': { title: 'Shift Check-In', subtitle: 'Clock in and out of your shift with GPS tracking' },
    '/app/company/hr/team-view': { title: 'Team View', subtitle: 'Manager self-service: team, approvals, and calendar' },
    // Recruitment & Training
    '/app/company/hr/requisitions': { title: 'Job Requisitions', subtitle: 'Create and manage hiring requisitions' },
    '/app/company/hr/candidates': { title: 'Candidates', subtitle: 'Track candidates through the hiring pipeline' },
    '/app/company/hr/training': { title: 'Training Catalogue', subtitle: 'Manage available training programmes' },
    '/app/company/hr/training-nominations': { title: 'Training Nominations', subtitle: 'Nominate employees for training programmes' },
    // Advanced HR
    '/app/company/hr/assets': { title: 'Asset Management', subtitle: 'Track and assign company assets to employees' },
    '/app/company/hr/expenses': { title: 'Expense Claims', subtitle: 'Submit and approve employee expense claims' },
    '/app/company/hr/hr-letters': { title: 'HR Letters', subtitle: 'Generate and manage HR letters and templates' },
    '/app/company/hr/grievances': { title: 'Grievances', subtitle: 'Manage employee grievance cases' },
    '/app/company/hr/disciplinary': { title: 'Disciplinary Actions', subtitle: 'Track disciplinary proceedings and actions' },
    // Performance Management
    '/app/company/hr/appraisal-cycles': { title: 'Appraisal Cycles', subtitle: 'Create and manage performance review cycles' },
    '/app/company/hr/goals': { title: 'Goals & OKRs', subtitle: 'Define KRAs, OKRs, and cascade goals across departments' },
    '/app/company/hr/feedback-360': { title: '360 Feedback', subtitle: 'Multi-rater feedback collection and reports' },
    '/app/company/hr/ratings': { title: 'Ratings & Calibration', subtitle: 'Appraisal ratings, self/manager review, and bell curve calibration' },
    '/app/company/hr/skills': { title: 'Skills & Mapping', subtitle: 'Skill library, employee skill mapping, and gap analysis' },
    '/app/company/hr/succession': { title: 'Succession Planning', subtitle: '9-box grid, bench strength, and succession pipelines' },
    '/app/company/hr/performance-dashboard': { title: 'Performance Dashboard', subtitle: 'Cycle progress, completion rates, and rating distribution' },
    // Additional HR screens
    '/app/company/hr/onboarding': { title: 'Onboarding Checklist', subtitle: 'Manage new employee onboarding tasks' },
    '/app/company/hr/probation-reviews': { title: 'Probation Reviews', subtitle: 'Track and manage probation review cycles' },
    '/app/company/hr/org-chart': { title: 'Organisation Chart', subtitle: 'Visual organisation hierarchy' },
    '/app/company/hr/form-16': { title: 'Form 16 & 24Q', subtitle: 'Generate and manage Form 16 and 24Q filings' },
    '/app/company/hr/chatbot': { title: 'HR Chatbot', subtitle: 'AI-powered HR assistant' },
    '/app/company/hr/bonus-batches': { title: 'Bonus Batches', subtitle: 'Process and manage bonus payouts' },
    '/app/company/hr/esign': { title: 'E-Sign Tracking', subtitle: 'Track document e-signatures' },
    '/app/company/hr/data-retention': { title: 'Data Retention & Privacy', subtitle: 'Configure data retention policies' },
    '/app/company/hr/biometric-devices': { title: 'Biometric Devices', subtitle: 'Manage biometric attendance devices' },
    '/app/company/hr/shift-rotations': { title: 'Shift Rotations', subtitle: 'Configure automatic shift rotation schedules' },
    '/app/company/hr/production-incentives': { title: 'Production Incentives', subtitle: 'Manage production-linked incentive schemes' },
    '/app/company/hr/travel-advances': { title: 'Travel Advances', subtitle: 'Process travel advance requests and settlements' },
};

function getPageTitle(path: string) {
    // Exact match first
    if (PAGE_TITLES[path]) return PAGE_TITLES[path];
    // Prefix match
    const match = Object.keys(PAGE_TITLES)
        .filter((k) => path.startsWith(k))
        .sort((a, b) => b.length - a.length)[0];
    return match ? PAGE_TITLES[match] : { title: 'Avyren ERP', subtitle: '' };
}

// ============================================================
// Command Palette search items
// ============================================================
type SearchItem = {
    icon: typeof LayoutDashboard;
    label: string;
    path: string;
    group: string;
};

// ============================================================
// Theme Switch Component
// ============================================================
function ThemeSwitch() {
    const { mode, setMode } = useThemeStore();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const options = [
        { value: 'light' as const, icon: Sun, label: 'Light' },
        { value: 'dark' as const, icon: Moon, label: 'Dark' },
        { value: 'system' as const, icon: Monitor, label: 'System' },
    ];

    const ActiveIcon = options.find((o) => o.value === mode)?.icon ?? Sun;

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen((o) => !o)}
                className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150',
                    'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200',
                    'hover:bg-neutral-100 dark:hover:bg-neutral-800',
                    open && 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200'
                )}
                title="Toggle theme"
            >
                <ActiveIcon size={17} strokeWidth={2} />
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-36 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow-xl shadow-neutral-900/10 p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-100">
                    {options.map(({ value, icon: Icon, label }) => (
                        <button
                            key={value}
                            onClick={() => { setMode(value); setOpen(false); }}
                            className={cn(
                                'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                                mode === value
                                    ? 'bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 font-semibold'
                                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-neutral-200'
                            )}
                        >
                            <Icon size={14} strokeWidth={2} />
                            {label}
                            {mode === value && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-600 dark:bg-primary-400" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ============================================================
// Notifications Panel
// ============================================================
const MOCK_NOTIFICATIONS = [
    { id: 1, title: 'New company registered', body: 'Apex Manufacturing just completed onboarding', time: '2m ago', unread: true, type: 'info' },
    { id: 2, title: 'Module assignment updated', body: 'Production module enabled for TechCorp', time: '15m ago', unread: true, type: 'success' },
    { id: 3, title: 'Trial period ending', body: 'Vertex Pvt. Ltd. has 3 days left on trial', time: '1h ago', unread: true, type: 'warning' },
    { id: 4, title: 'Payment received', body: '₹18,500 subscription renewal — Apex Mfg.', time: '3h ago', unread: false, type: 'success' },
    { id: 5, title: 'Server health alert', body: 'Custom endpoint for BRT Corp showing latency', time: '5h ago', unread: false, type: 'danger' },
];

function NotificationsPanel() {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const unreadCount = MOCK_NOTIFICATIONS.filter((n) => n.unread).length;
    const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const typeColors = {
        info: 'bg-info-50 text-info-600 dark:bg-info-900/40',
        success: 'bg-success-50 text-success-600 dark:bg-success-900/40',
        warning: 'bg-warning-50 text-warning-600 dark:bg-warning-900/40',
        danger: 'bg-danger-50 text-danger-600 dark:bg-danger-900/40',
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen((o) => !o)}
                className={cn(
                    'relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150',
                    'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200',
                    'hover:bg-neutral-100 dark:hover:bg-neutral-800',
                    open && 'bg-neutral-100 dark:bg-neutral-800'
                )}
                title="Notifications"
            >
                <Bell size={17} strokeWidth={2} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full ring-2 ring-white dark:ring-neutral-900" />
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow-2xl shadow-neutral-900/15 z-50 animate-in fade-in slide-in-from-top-2 duration-100 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-primary-950 dark:text-white">Notifications</h3>
                            {unreadCount > 0 && (
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 rounded-full">
                                    {unreadCount} new
                                </span>
                            )}
                        </div>
                        <button
                            onClick={() => setNotifications((n) => n.map((i) => ({ ...i, unread: false })))}
                            className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline"
                        >
                            Mark all read
                        </button>
                    </div>

                    {/* List */}
                    <div className="max-h-[400px] overflow-y-auto divide-y divide-neutral-50 dark:divide-neutral-800">
                        {notifications.map((n) => (
                            <div
                                key={n.id}
                                className={cn(
                                    'flex items-start gap-3 px-5 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors',
                                    n.unread && 'bg-primary-50/60 dark:bg-primary-900/10'
                                )}
                            >
                                <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm', typeColors[n.type as keyof typeof typeColors])}>
                                    {n.type === 'info' && '💬'}
                                    {n.type === 'success' && '✓'}
                                    {n.type === 'warning' && '⚠'}
                                    {n.type === 'danger' && '🔴'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={cn('text-sm font-semibold text-primary-950 dark:text-white', !n.unread && 'font-medium text-neutral-700 dark:text-neutral-300')}>
                                        {n.title}
                                    </p>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-4">{n.body}</p>
                                    <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1 font-medium">{n.time}</p>
                                </div>
                                {n.unread && <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-1.5" />}
                            </div>
                        ))}
                    </div>

                    <div className="px-5 py-3 border-t border-neutral-100 dark:border-neutral-800">
                        <button className="w-full text-center text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 py-1">
                            View all notifications
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================================
// Profile Dropdown
// ============================================================
function ProfileDropdown() {
    const [open, setOpen] = useState(false);
    const [imageLoadFailed, setImageLoadFailed] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const signOut = useAuthStore((s) => s.signOut);
    const status = useAuthStore((s) => s.status);
    const user = useAuthStore((s) => s.user);
    const userRole = useAuthStore((s) => s.userRole);
    const permissions = useAuthStore((s) => s.permissions);
    const initials = getUserInitials(user);
    const displayName = getDisplayName(user);
    
    // Prefer tenant role name when available; fall back to platform role label.
    const tenantRoleName = typeof user?.roleName === 'string' ? user.roleName.trim() : '';
    const rawRole = user?.role || '';
    const roleLabel = tenantRoleName
        ? tenantRoleName
        : rawRole
        ? rawRole.replace(/[_-]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
        : getRoleLabel(userRole);

    const email = user?.email ?? '';
    const canFetchEssProfile = checkPermission(permissions, 'ess:view-profile');

    const { data: myProfileData } = useQuery({
        queryKey: ['topbar', 'my-profile-avatar'],
        queryFn: () => essApi.getMyProfile(),
        enabled: status === 'signIn' && canFetchEssProfile,
        staleTime: 5 * 60 * 1000,
        retry: false,
    });

    const profilePhotoUrl = myProfileData?.data?.profilePhotoUrl;
    const showProfilePhoto =
        !imageLoadFailed &&
        typeof profilePhotoUrl === 'string' &&
        profilePhotoUrl.length > 0 &&
        (profilePhotoUrl.startsWith('http://') || profilePhotoUrl.startsWith('https://') || profilePhotoUrl.startsWith('/') || profilePhotoUrl.startsWith('data:image/'));

    useEffect(() => {
        setImageLoadFailed(false);
    }, [profilePhotoUrl]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen((o) => !o)}
                className={cn(
                    'flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-2xl transition-all duration-150',
                    'hover:bg-neutral-100 dark:hover:bg-neutral-800',
                    open && 'bg-neutral-100 dark:bg-neutral-800'
                )}
            >
                {showProfilePhoto ? (
                    <img
                        src={profilePhotoUrl}
                        alt={displayName}
                        onError={() => setImageLoadFailed(true)}
                        className="w-8 h-8 rounded-xl object-cover border border-neutral-200 dark:border-neutral-700 shadow-sm flex-shrink-0"
                    />
                ) : (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-accent-400 to-primary-500 flex items-center justify-center shadow-sm flex-shrink-0">
                        <span className="text-white font-bold text-[11px]">{initials}</span>
                    </div>
                )}
                <div className="hidden md:block text-left">
                    <p className="text-xs font-bold text-primary-950 dark:text-white leading-none">{displayName}</p>
                    <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">{roleLabel}</p>
                </div>
                <ChevronDown size={12} className={cn('text-neutral-400 transition-transform duration-150', open && 'rotate-180')} />
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow-2xl shadow-neutral-900/15 z-50 animate-in fade-in slide-in-from-top-2 duration-100 overflow-hidden">
                    <div className="px-4 py-4 border-b border-neutral-100 dark:border-neutral-800">
                        <div className="flex items-center gap-3">
                            {showProfilePhoto ? (
                                <img
                                    src={profilePhotoUrl}
                                    alt={displayName}
                                    onError={() => setImageLoadFailed(true)}
                                    className="w-10 h-10 rounded-xl object-cover border border-neutral-200 dark:border-neutral-700 shadow-sm"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent-400 to-primary-500 flex items-center justify-center shadow-sm">
                                    <span className="text-white font-bold text-sm">{initials}</span>
                                </div>
                            )}
                            <div>
                                <p className="text-sm font-bold text-primary-950 dark:text-white">{displayName}</p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">{email}</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-2">
                        {[
                            { icon: Users, label: 'My Profile', action: () => navigate('/app/company/hr/my-profile') },
                        ].map(({ icon: Icon, label, action }) => (
                            <button
                                key={label}
                                onClick={() => { action(); setOpen(false); }}
                                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors font-medium"
                            >
                                <Icon size={15} className="text-neutral-400 dark:text-neutral-500" />
                                {label}
                            </button>
                        ))}
                        <div className="border-t border-neutral-100 dark:border-neutral-800 mt-1 pt-1">
                            <button
                                onClick={() => { signOut(); navigate('/login'); }}
                                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-950 transition-colors font-semibold"
                            >
                                <LogOut size={15} />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================================
// Icon resolver for manifest items in command palette
// ============================================================
const SEARCH_ICON_MAP: Record<string, typeof LayoutDashboard> = {
    'dashboard': LayoutDashboard, 'building': Building2, 'credit-card': CreditCard,
    'blocks': Blocks, 'activity': Activity, 'settings': Settings,
    'users': Users, 'user': Users, 'user-cog': Users, 'user-check': Users, 'user-plus': Users,
    'file-text': FileText, 'file-check': FileText, 'file-spreadsheet': FileText, 'file-signature': FileText,
    'package': Package, 'wrench': Wrench, 'clipboard-list': ClipboardList,
    'shield-check': FileText, 'shield': FileText, 'toggle-left': Settings,
    'map-pin': Building2, 'clock': Settings, 'hash': FileText, 'cpu': Settings,
    'sliders': Settings, 'briefcase': FileText, 'bar-chart': FileText,
    'wallet': CreditCard, 'calendar-check': FileText, 'calendar': FileText,
    'calendar-days': FileText, 'calendar-off': FileText, 'timer': Settings,
    'book-open': FileText, 'send': FileText, 'scale': FileText,
    'dollar-sign': CreditCard, 'calculator': CreditCard, 'landmark': CreditCard,
    'hand-coins': CreditCard, 'receipt': CreditCard, 'play': Settings,
    'pause-circle': Settings, 'trending-up': FileText, 'stamp': FileText,
    'git-branch': Settings, 'mail': FileText, 'bell-ring': FileText,
    'arrow-left-right': FileText, 'flag': FileText, 'target': FileText,
    'star': FileText, 'brain': FileText, 'git-fork': FileText,
    'graduation-cap': FileText, 'award': FileText, 'log-out': FileText,
    'log-in': FileText, 'gavel': FileText, 'alert-triangle': FileText,
    'support': FileText, 'message-circle': FileText, 'check-square': FileText,
    'pen-tool': FileText, 'database': Settings, 'factory': ClipboardList,
    'plane': FileText, 'gift': FileText, 'message-square': FileText,
    'refresh-cw': Settings,
};

function resolveSearchIcon(iconName: string): typeof LayoutDashboard {
    return SEARCH_ICON_MAP[iconName] ?? FileText;
}

// ============================================================
// Command Palette (Cmd+K / Ctrl+K)
// ============================================================
function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);
    const { data: manifestData } = useNavigationManifest();

    useEffect(() => {
        if (open) {
            setQuery('');
            setActiveIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [open]);

    // Build search items from manifest (pre-filtered by backend)
    const visibleItems: SearchItem[] = (() => {
        const rawManifest = manifestData?.data ?? (Array.isArray(manifestData) ? manifestData : null);
        if (!rawManifest || !Array.isArray(rawManifest)) return [];

        const items: SearchItem[] = [];
        for (const section of rawManifest) {
            for (const item of section.items ?? []) {
                items.push({
                    icon: resolveSearchIcon(item.icon),
                    label: item.label,
                    path: item.path,
                    group: section.group,
                });
                if (item.children) {
                    for (const child of item.children) {
                        items.push({
                            icon: resolveSearchIcon(item.icon),
                            label: child.label,
                            path: child.path,
                            group: section.group,
                        });
                    }
                }
            }
        }
        return items;
    })();

    const grouped = visibleItems.reduce((acc, item) => {
        if (query && !item.label.toLowerCase().includes(query.toLowerCase())) return acc;
        if (!acc[item.group]) acc[item.group] = [];
        acc[item.group].push(item);
        return acc;
    }, {} as Record<string, SearchItem[]>);

    // Flatten all visible items for index-based navigation
    const flatItems = Object.values(grouped).flat();

    // Reset active index when query changes
    useEffect(() => { setActiveIndex(0); }, [query]);

    // Scroll active item into view
    useEffect(() => {
        const el = document.querySelector('[data-active="true"]');
        el?.scrollIntoView({ block: 'nearest' });
    }, [activeIndex]);

    // Keyboard handler on the input
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex((i) => Math.min(i + 1, flatItems.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (flatItems[activeIndex]) {
                navigate(flatItems[activeIndex].path);
                onClose();
            }
        }
    };

    if (!open) return null;

    let globalIndex = 0;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-neutral-900/40 dark:bg-neutral-950/60 backdrop-blur-sm" />

            {/* Palette */}
            <div
                className="relative w-full max-w-xl bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl shadow-neutral-900/30 border border-neutral-200 dark:border-neutral-700 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Search Input */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
                    <Search size={18} className="text-neutral-400 flex-shrink-0" />
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search pages, modules, actions…"
                        className="flex-1 text-sm font-medium bg-transparent outline-none text-primary-950 dark:text-white placeholder:text-neutral-400"
                    />
                    <div className="flex items-center gap-1">
                        {query ? (
                            <button onClick={() => setQuery('')} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400">
                                <X size={14} />
                            </button>
                        ) : (
                            <kbd className="px-2 py-1 text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-500 rounded-lg border border-neutral-200 dark:border-neutral-700">
                                ESC
                            </kbd>
                        )}
                    </div>
                </div>

                {/* Results */}
                <div className="max-h-[400px] overflow-y-auto p-2">
                    {Object.keys(grouped).length === 0 ? (
                        <div className="py-10 text-center">
                            <p className="text-sm text-neutral-400 dark:text-neutral-500">No results for "{query}"</p>
                        </div>
                    ) : (
                        Object.entries(grouped).map(([group, items]) => (
                            <div key={group} className="mb-2">
                                <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                                    {group}
                                </p>
                                {items.map((item) => {
                                    const idx = globalIndex++;
                                    return (
                                        <button
                                            key={item.path}
                                            data-active={idx === activeIndex}
                                            onClick={() => { navigate(item.path); onClose(); }}
                                            onMouseEnter={() => setActiveIndex(idx)}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-3 py-3 rounded-xl group transition-colors",
                                                idx === activeIndex
                                                    ? "bg-primary-50 dark:bg-primary-900/30"
                                                    : "hover:bg-primary-50 dark:hover:bg-primary-900/30"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
                                                idx === activeIndex
                                                    ? "bg-primary-100 dark:bg-primary-800/50"
                                                    : "bg-neutral-100 dark:bg-neutral-800 group-hover:bg-primary-100 dark:group-hover:bg-primary-800/50"
                                            )}>
                                                <item.icon size={15} className={cn(
                                                    "transition-colors",
                                                    idx === activeIndex
                                                        ? "text-primary-600 dark:text-primary-400"
                                                        : "text-neutral-500 dark:text-neutral-400 group-hover:text-primary-600 dark:group-hover:text-primary-400"
                                                )} />
                                            </div>
                                            <span className="flex-1 text-left text-sm font-semibold text-primary-950 dark:text-white">{item.label}</span>
                                            <ArrowRight size={14} className={cn(
                                                "transition-colors",
                                                idx === activeIndex
                                                    ? "text-primary-400"
                                                    : "text-neutral-300 dark:text-neutral-600 group-hover:text-primary-400"
                                            )} />
                                        </button>
                                    );
                                })}
                            </div>
                        ))
                    )}
                </div>

                {/* Footer hint */}
                <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center gap-3 text-[10px] text-neutral-400 dark:text-neutral-500">
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded font-bold border border-neutral-200 dark:border-neutral-700">↵</kbd>
                            to select
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded font-bold border border-neutral-200 dark:border-neutral-700">↑↓</kbd>
                            to navigate
                        </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-neutral-400 dark:text-neutral-500">
                        <Command size={10} />
                        <span>K to open</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// TopBar
// ============================================================
interface TopBarProps {
    sidebarCollapsed: boolean;
}

export function TopBar({ sidebarCollapsed }: TopBarProps) {
    const location = useLocation();
    const [cmdOpen, setCmdOpen] = useState(false);

    const pageInfo = getPageTitle(location.pathname);

    // Global keyboard shortcut
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            setCmdOpen((o) => !o);
        }
        if (e.key === 'Escape') setCmdOpen(false);
    }, []);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    return (
        <>
            <header className="h-16 flex-shrink-0 flex items-center justify-between px-6 gap-4 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-b border-neutral-200/60 dark:border-neutral-800 sticky top-0 z-10">

                {/* Left — page title */}
                <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-0">
                        <h2 className="text-base font-bold text-primary-950 dark:text-white leading-none">
                            {pageInfo.title}
                        </h2>
                        {pageInfo.subtitle && (
                            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5 truncate">{pageInfo.subtitle}</p>
                        )}
                    </div>
                </div>

                {/* Center — Search trigger */}
                <button
                    onClick={() => setCmdOpen(true)}
                    className={cn(
                        'hidden sm:flex items-center gap-3 px-4 py-2 rounded-2xl border transition-all duration-150',
                        'border-neutral-200 dark:border-neutral-700',
                        'bg-neutral-50 dark:bg-neutral-800',
                        'text-neutral-400 dark:text-neutral-500',
                        'hover:border-primary-300 dark:hover:border-primary-700 hover:bg-white dark:hover:bg-neutral-750',
                        'min-w-[320px] max-w-xs'
                    )}
                >
                    <Search size={14} className="flex-shrink-0" />
                    <span className="flex-1 text-left text-sm">Search anything…</span>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                        <kbd className="px-1.5 py-0.5 text-[10px] font-bold bg-white dark:bg-neutral-700 text-neutral-400 dark:text-neutral-400 rounded-md border border-neutral-200 dark:border-neutral-600">
                            ⌘
                        </kbd>
                        <kbd className="px-1.5 py-0.5 text-[10px] font-bold bg-white dark:bg-neutral-700 text-neutral-400 dark:text-neutral-400 rounded-md border border-neutral-200 dark:border-neutral-600">
                            K
                        </kbd>
                    </div>
                </button>

                {/* Right — Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Mobile search */}
                    <button
                        onClick={() => setCmdOpen(true)}
                        className="sm:hidden w-9 h-9 rounded-xl flex items-center justify-center text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                        <Search size={17} />
                    </button>

                    <ThemeSwitch />
                    <NotificationsPanel />

                    {/* Divider */}
                    <div className="w-px h-6 bg-neutral-200 dark:bg-neutral-700 mx-1" />

                    <ProfileDropdown />
                </div>
            </header>

            <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
        </>
    );
}
