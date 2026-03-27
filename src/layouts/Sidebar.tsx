// ============================================================
// Sidebar — Role-based, collapsible, sub-modules with dotted connector lines
// ============================================================
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard, Building2, CreditCard, Blocks, Activity,
    Settings, LogOut, ChevronLeft, ChevronRight, ChevronDown,
    Users, FileText, BarChart3, Package, Wrench, ClipboardList,
    ShieldCheck, Bell, HelpCircle, PanelLeftClose, PanelLeftOpen,
    MapPin, Clock, Hash, Cpu, SlidersHorizontal, UserCog, Shield, ToggleLeft,
    Briefcase, UserCheck, Wallet,
    CalendarCheck, Calendar, CalendarDays, Timer, BookOpen, Send, Scale,
    DollarSign, FileSpreadsheet, Landmark, HandCoins, Receipt, Calculator,
    Play, PauseCircle, TrendingUp, Stamp,
    Settings2, GitBranch, Mail, BellRing, FileCheck, UserCircle, CalendarOff,
    Target, Flag, MessageSquare, Star, Brain, GitFork,
    UserPlus, GraduationCap, Award, FileSignature, AlertTriangle, Gavel,
    ArrowLeftRight, LogIn,
} from 'lucide-react';
import { useAuthStore, getUserInitials, getDisplayName } from '@/store/useAuthStore';
import { checkPermission } from '@/lib/api/auth';
import { useNavigate } from 'react-router-dom';

// ============================================================
// Nav Config — role-based
// ============================================================

export type SidebarUserRole = 'super_admin' | 'company_admin' | 'viewer';
/** @deprecated Use SidebarUserRole */
export type UserRole = SidebarUserRole;

interface SubItem {
    label: string;
    path: string;
    badge?: string | number;
    requiredPerm?: string;
}

interface NavSection {
    group: string;
    /** When set, renders a styled module divider above this section */
    moduleSeparator?: string;
    roles?: SidebarUserRole[]; // undefined = visible to all
    /** Permission required for the entire section */
    requiredPerm?: string;
    items: {
        icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
        label: string;
        path: string;
        badge?: string | number;
        roles?: SidebarUserRole[];
        /** Permission required for this specific item */
        requiredPerm?: string;
        children?: SubItem[];
    }[];
}

const NAV_CONFIG: NavSection[] = [
    // ── Overview ──
    {
        group: 'Overview',
        items: [
            { icon: LayoutDashboard, label: 'Dashboard', path: '/app/dashboard' },
        ],
    },

    // ══════════ SUPER ADMIN: PLATFORM MANAGEMENT ══════════
    {
        group: 'Platform Management',
        moduleSeparator: 'Platform Management',
        roles: ['super_admin'],
        items: [
            { icon: Building2, label: 'Companies', path: '/app/companies' },
            {
                icon: CreditCard, label: 'Billing', path: '/app/billing',
                children: [
                    { label: 'Overview', path: '/app/billing' },
                    { label: 'Invoices', path: '/app/billing/invoices' },
                    { label: 'Payments', path: '/app/billing/payments' },
                ],
            },
            { icon: ShieldCheck, label: 'Audit Log', path: '/app/reports/audit' },
            { icon: MessageSquare, label: 'Support', path: '/app/support' },
        ],
    },
    {
        group: 'System',
        moduleSeparator: 'System',
        roles: ['super_admin'],
        items: [
            { icon: Blocks, label: 'Module Catalogue', path: '/app/modules' },
            { icon: Activity, label: 'Platform Monitor', path: '/app/monitor' },
            { icon: UserCog, label: 'User Management', path: '/app/admin/users' },
        ],
    },

    // ══════════ COMPANY ADMIN ══════════
    {
        group: 'Company',
        moduleSeparator: 'Company Admin',
        roles: ['company_admin'],
        requiredPerm: 'company:read',
        items: [
            { icon: Building2, label: 'Company Profile', path: '/app/company/profile', requiredPerm: 'company:read' },
            { icon: MapPin, label: 'Locations', path: '/app/company/locations', requiredPerm: 'company:read' },
            { icon: Clock, label: 'Shifts & Time', path: '/app/company/shifts', requiredPerm: 'company:read' },
            { icon: Users, label: 'Key Contacts', path: '/app/company/contacts', requiredPerm: 'company:read' },
        ],
    },
    {
        group: 'People & Access',
        roles: ['company_admin'],
        items: [
            { icon: UserCog, label: 'User Management', path: '/app/company/users', requiredPerm: 'user:read' },
            { icon: Shield, label: 'Roles & Permissions', path: '/app/company/roles', requiredPerm: 'role:read' },
            { icon: ToggleLeft, label: 'Feature Toggles', path: '/app/company/feature-toggles', requiredPerm: 'role:read' },
        ],
    },
    {
        group: 'Configuration',
        roles: ['company_admin'],
        requiredPerm: 'company:read',
        items: [
            { icon: Hash, label: 'Number Series', path: '/app/company/no-series', requiredPerm: 'company:read' },
            { icon: Cpu, label: 'IOT Reasons', path: '/app/company/iot-reasons', requiredPerm: 'company:read' },
            { icon: SlidersHorizontal, label: 'System Controls', path: '/app/company/controls', requiredPerm: 'company:configure' },
            { icon: Settings, label: 'Settings', path: '/app/company/settings', requiredPerm: 'company:read' },
        ],
    },
    {
        group: 'Billing',
        roles: ['company_admin'],
        requiredPerm: 'company:read',
        items: [
            {
                icon: CreditCard, label: 'Billing', path: '/app/company/billing', requiredPerm: 'company:read',
                children: [
                    { label: 'Overview', path: '/app/company/billing' },
                    { label: 'Invoices', path: '/app/company/billing/invoices' },
                    { label: 'Payments', path: '/app/company/billing/payments' },
                ],
            },
        ],
    },

    // ══════════ HRMS ══════════
    {
        group: 'Org Structure',
        moduleSeparator: 'HRMS',
        roles: ['company_admin'],
        requiredPerm: 'hr:read',
        items: [
            { icon: Building2, label: 'Departments', path: '/app/company/hr/departments', requiredPerm: 'hr:read' },
            { icon: Briefcase, label: 'Designations', path: '/app/company/hr/designations', requiredPerm: 'hr:read' },
            { icon: BarChart3, label: 'Grades & Bands', path: '/app/company/hr/grades', requiredPerm: 'hr:read' },
            { icon: UserCheck, label: 'Employee Types', path: '/app/company/hr/employee-types', requiredPerm: 'hr:read' },
            { icon: Wallet, label: 'Cost Centres', path: '/app/company/hr/cost-centres', requiredPerm: 'hr:read' },
            { icon: Users, label: 'Employee Directory', path: '/app/company/hr/employees', requiredPerm: 'hr:read' },
        ],
    },
    {
        group: 'Attendance',
        roles: ['company_admin'],
        requiredPerm: 'hr:read',
        items: [
            { icon: CalendarCheck, label: 'Attendance Dashboard', path: '/app/company/hr/attendance', requiredPerm: 'hr:read' },
            { icon: Calendar, label: 'Holiday Calendar', path: '/app/company/hr/holidays', requiredPerm: 'hr:read' },
            { icon: CalendarDays, label: 'Rosters', path: '/app/company/hr/rosters', requiredPerm: 'hr:read' },
            { icon: ClipboardList, label: 'Attendance Rules', path: '/app/company/hr/attendance-rules', requiredPerm: 'hr:read' },
            { icon: Timer, label: 'Overtime Rules', path: '/app/company/hr/overtime-rules', requiredPerm: 'hr:read' },
        ],
    },
    {
        group: 'Leave Management',
        roles: ['company_admin'],
        requiredPerm: 'hr:read',
        items: [
            { icon: FileText, label: 'Leave Types', path: '/app/company/hr/leave-types', requiredPerm: 'hr:read' },
            { icon: BookOpen, label: 'Leave Policies', path: '/app/company/hr/leave-policies', requiredPerm: 'hr:read' },
            { icon: Send, label: 'Leave Requests', path: '/app/company/hr/leave-requests', requiredPerm: 'hr:read' },
            { icon: Scale, label: 'Leave Balances', path: '/app/company/hr/leave-balances', requiredPerm: 'hr:read' },
        ],
    },
    {
        group: 'Payroll & Compliance',
        roles: ['company_admin'],
        requiredPerm: 'hr:read',
        items: [
            { icon: DollarSign, label: 'Salary Components', path: '/app/company/hr/salary-components', requiredPerm: 'hr:read' },
            { icon: FileSpreadsheet, label: 'Salary Structures', path: '/app/company/hr/salary-structures', requiredPerm: 'hr:read' },
            { icon: CreditCard, label: 'Employee Salary', path: '/app/company/hr/employee-salary', requiredPerm: 'hr:read' },
            { icon: Shield, label: 'Statutory Config', path: '/app/company/hr/statutory-config', requiredPerm: 'hr:configure' },
            { icon: Calculator, label: 'Tax & TDS', path: '/app/company/hr/tax-config', requiredPerm: 'hr:configure' },
            { icon: Landmark, label: 'Bank Config', path: '/app/company/hr/bank-config', requiredPerm: 'hr:configure' },
            { icon: HandCoins, label: 'Loan Policies', path: '/app/company/hr/loan-policies', requiredPerm: 'hr:read' },
            { icon: Receipt, label: 'Loans', path: '/app/company/hr/loans', requiredPerm: 'hr:read' },
        ],
    },
    {
        group: 'Payroll Operations',
        roles: ['company_admin'],
        requiredPerm: 'hr:read',
        items: [
            { icon: Play, label: 'Payroll Runs', path: '/app/company/hr/payroll-runs', requiredPerm: 'hr:read' },
            { icon: FileText, label: 'Payslips', path: '/app/company/hr/payslips', requiredPerm: 'hr:read' },
            { icon: PauseCircle, label: 'Salary Holds', path: '/app/company/hr/salary-holds', requiredPerm: 'hr:read' },
            { icon: TrendingUp, label: 'Salary Revisions', path: '/app/company/hr/salary-revisions', requiredPerm: 'hr:read' },
            { icon: Stamp, label: 'Statutory Filings', path: '/app/company/hr/statutory-filings', requiredPerm: 'hr:read' },
            { icon: BarChart3, label: 'Payroll Reports', path: '/app/company/hr/payroll-reports', requiredPerm: 'hr:read' },
        ],
    },
    {
        group: 'Self-Service',
        roles: ['company_admin'],
        requiredPerm: 'hr:read',
        items: [
            { icon: UserCircle, label: 'My Profile', path: '/app/company/hr/my-profile', requiredPerm: 'hr:read' },
            { icon: Receipt, label: 'My Payslips', path: '/app/company/hr/my-payslips', requiredPerm: 'hr:read' },
            { icon: CalendarOff, label: 'My Leave', path: '/app/company/hr/my-leave', requiredPerm: 'hr:read' },
            { icon: Clock, label: 'My Attendance', path: '/app/company/hr/my-attendance', requiredPerm: 'hr:read' },
            { icon: LogIn, label: 'Shift Check-In', path: '/app/company/hr/shift-check-in', requiredPerm: 'hr:read' },
            { icon: Users, label: 'Team View (MSS)', path: '/app/company/hr/team-view', requiredPerm: 'hr:read' },
        ],
    },
    {
        group: 'ESS & Workflows',
        roles: ['company_admin'],
        requiredPerm: 'hr:read',
        items: [
            { icon: Settings2, label: 'ESS Config', path: '/app/company/hr/ess-config', requiredPerm: 'hr:configure' },
            { icon: GitBranch, label: 'Approval Workflows', path: '/app/company/hr/approval-workflows', requiredPerm: 'hr:configure' },
            { icon: Send, label: 'Approval Requests', path: '/app/company/hr/approval-requests', requiredPerm: 'hr:read' },
            { icon: Mail, label: 'Notification Templates', path: '/app/company/hr/notification-templates', requiredPerm: 'hr:configure' },
            { icon: BellRing, label: 'Notification Rules', path: '/app/company/hr/notification-rules', requiredPerm: 'hr:configure' },
            { icon: FileCheck, label: 'IT Declarations', path: '/app/company/hr/it-declarations', requiredPerm: 'hr:read' },
        ],
    },
    {
        group: 'Transfers & Promotions',
        roles: ['company_admin'],
        requiredPerm: 'hr:read',
        items: [
            { icon: ArrowLeftRight, label: 'Employee Transfers', path: '/app/company/hr/transfers', requiredPerm: 'hr:read' },
            { icon: TrendingUp, label: 'Employee Promotions', path: '/app/company/hr/promotions', requiredPerm: 'hr:read' },
            { icon: UserCheck, label: 'Manager Delegation', path: '/app/company/hr/delegates', requiredPerm: 'hr:read' },
        ],
    },
    {
        group: 'Performance',
        roles: ['company_admin'],
        requiredPerm: 'hr:read',
        items: [
            { icon: Target, label: 'Appraisal Cycles', path: '/app/company/hr/appraisal-cycles', requiredPerm: 'hr:read' },
            { icon: Flag, label: 'Goals & OKRs', path: '/app/company/hr/goals', requiredPerm: 'hr:read' },
            { icon: MessageSquare, label: '360 Feedback', path: '/app/company/hr/feedback-360', requiredPerm: 'hr:read' },
            { icon: Star, label: 'Ratings & Calibration', path: '/app/company/hr/ratings', requiredPerm: 'hr:read' },
            { icon: Brain, label: 'Skills & Mapping', path: '/app/company/hr/skills', requiredPerm: 'hr:read' },
            { icon: GitFork, label: 'Succession Planning', path: '/app/company/hr/succession', requiredPerm: 'hr:read' },
            { icon: Activity, label: 'Performance Dashboard', path: '/app/company/hr/performance-dashboard', requiredPerm: 'hr:read' },
        ],
    },
    {
        group: 'Recruitment & Training',
        roles: ['company_admin'],
        requiredPerm: 'hr:read',
        items: [
            { icon: Briefcase, label: 'Job Requisitions', path: '/app/company/hr/requisitions', requiredPerm: 'hr:read' },
            { icon: UserPlus, label: 'Candidates', path: '/app/company/hr/candidates', requiredPerm: 'hr:read' },
            { icon: GraduationCap, label: 'Training Catalogue', path: '/app/company/hr/training', requiredPerm: 'hr:read' },
            { icon: Award, label: 'Training Nominations', path: '/app/company/hr/training-nominations', requiredPerm: 'hr:read' },
        ],
    },
    {
        group: 'Exit & Separation',
        roles: ['company_admin'],
        requiredPerm: 'hr:read',
        items: [
            { icon: LogOut, label: 'Exit Requests', path: '/app/company/hr/exit-requests', requiredPerm: 'hr:read' },
            { icon: ClipboardList, label: 'Clearance Dashboard', path: '/app/company/hr/clearance-dashboard', requiredPerm: 'hr:read' },
            { icon: Calculator, label: 'F&F Settlement', path: '/app/company/hr/fnf-settlement', requiredPerm: 'hr:read' },
        ],
    },
    {
        group: 'Advanced HR',
        roles: ['company_admin'],
        requiredPerm: 'hr:read',
        items: [
            { icon: Package, label: 'Asset Management', path: '/app/company/hr/assets', requiredPerm: 'hr:read' },
            { icon: Receipt, label: 'Expense Claims', path: '/app/company/hr/expenses', requiredPerm: 'hr:read' },
            { icon: FileSignature, label: 'HR Letters', path: '/app/company/hr/hr-letters', requiredPerm: 'hr:read' },
            { icon: AlertTriangle, label: 'Grievances', path: '/app/company/hr/grievances', requiredPerm: 'hr:read' },
            { icon: Gavel, label: 'Disciplinary Actions', path: '/app/company/hr/disciplinary', requiredPerm: 'hr:read' },
        ],
    },

    // ══════════ OPERATIONS ══════════
    {
        group: 'Operations',
        moduleSeparator: 'Operations',
        roles: ['company_admin'],
        items: [
            { icon: Package, label: 'Inventory', path: '/app/inventory', requiredPerm: 'inventory:read' },
            {
                icon: Wrench, label: 'Maintenance', path: '/app/maintenance', requiredPerm: 'maintenance:read',
                children: [
                    { label: 'Work Orders', path: '/app/maintenance/orders' },
                    { label: 'Machine Registry', path: '/app/maintenance/machines' },
                ],
            },
            { icon: ClipboardList, label: 'Production', path: '/app/production', requiredPerm: 'production:read' },
        ],
    },

    // ══════════ REPORTS ══════════
    {
        group: 'Reports',
        roles: ['company_admin'],
        requiredPerm: 'audit:read',
        items: [
            { icon: FileText, label: 'Audit Logs', path: '/app/reports/audit', requiredPerm: 'audit:read' },
        ],
    },
];

const BOTTOM_NAV = [
    { icon: Bell, label: 'Notifications', path: '/app/notifications', badge: 3 },
    { icon: Settings, label: 'Settings', path: '/app/settings' },
    { icon: HelpCircle, label: 'Help & Support', path: '/app/help' },
];

// ============================================================
// Sidebar Component
// ============================================================

interface SidebarProps {
    collapsed: boolean;
    onCollapse: (v: boolean) => void;
    role?: SidebarUserRole;
    permissions?: string[];
}

export function Sidebar({ collapsed, onCollapse, role = 'super_admin', permissions = [] }: SidebarProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const signOut = useAuthStore((s) => s.signOut);
    const user = useAuthStore((s) => s.user);
    const initials = getUserInitials(user);
    const displayName = getDisplayName(user);
    const email = user?.email ?? '';

    // Track which groups are expanded
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
        // Auto-open the section that contains the current path
        const initial: Record<string, boolean> = {};
        NAV_CONFIG.forEach((section) => {
            section.items.forEach((item) => {
                if (item.children?.some((c) => location.pathname.startsWith(c.path)) ||
                    location.pathname.startsWith(item.path)) {
                    initial[item.path] = true;
                }
            });
        });
        return initial;
    });

    // Auto-expand active section when route changes
    useEffect(() => {
        NAV_CONFIG.forEach((section) => {
            section.items.forEach((item) => {
                if (item.children?.some((c) => location.pathname.startsWith(c.path))) {
                    setOpenGroups((prev) => ({ ...prev, [item.path]: true }));
                }
            });
        });
    }, [location.pathname]);

    const handleLogout = () => {
        signOut();
        navigate('/login');
    };

    const toggleGroup = (path: string) => {
        setOpenGroups((prev) => ({ ...prev, [path]: !prev[path] }));
    };

    const isItemActive = (item: NavSection['items'][number]) => {
        if (item.children) {
            return item.children.some((c) => location.pathname.startsWith(c.path));
        }
        return location.pathname === item.path || location.pathname.startsWith(item.path + '/');
    };

    const hasPerm = (perm: string) => checkPermission(permissions, perm);

    // Filter sections by role AND permissions
    const visibleSections = NAV_CONFIG.filter((s) => {
        if (s.roles && !s.roles.includes(role)) return false;
        if (s.requiredPerm && !hasPerm(s.requiredPerm)) return false;
        return true;
    }).map((s) => ({
        ...s,
        items: s.items.filter((i) => {
            if (i.roles && !i.roles.includes(role)) return false;
            if (i.requiredPerm && !hasPerm(i.requiredPerm)) return false;
            return true;
        }),
    })).filter((s) => s.items.length > 0);

    // Global Tooltip State for Collapsed Mode
    const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);
    const [hoveredRect, setHoveredRect] = useState<DOMRect | null>(null);

    const handleMouseEnter = (e: React.MouseEvent<HTMLElement>, label: string) => {
        if (collapsed) {
            setHoveredLabel(label);
            setHoveredRect(e.currentTarget.getBoundingClientRect());
        }
    };

    const handleMouseLeave = () => {
        if (collapsed) {
            setHoveredLabel(null);
            setHoveredRect(null);
        }
    };

    return (
        <aside
            className={cn(
                'relative flex flex-col h-screen border-r border-neutral-200 dark:border-neutral-800',
                'bg-white dark:bg-neutral-900',
                'transition-all duration-300 ease-in-out z-20 flex-shrink-0',
                collapsed ? 'w-[72px]' : 'w-[240px]'
            )}
        >
            {/* ---- Brand ---- */}
            <div className={cn(
                'h-16 flex items-center border-b border-neutral-100 dark:border-neutral-800 flex-shrink-0',
                collapsed ? 'px-4 justify-center' : 'px-5 justify-between'
            )}>
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary-600 to-accent-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary-500/30">
                        <span className="text-white font-black text-sm">A</span>
                    </div>
                    {!collapsed && (
                        <span className="font-bold text-base text-primary-950 dark:text-white tracking-tight whitespace-nowrap">
                            Avyren ERP
                        </span>
                    )}
                </div>
                {!collapsed && (
                    <button
                        onClick={() => onCollapse(true)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        title="Collapse sidebar"
                        aria-label="Collapse sidebar"
                    >
                        <PanelLeftClose size={15} />
                    </button>
                )}
            </div>

            {/* Expand button when collapsed */}
            {collapsed && (
                <button
                    onClick={() => onCollapse(false)}
                    className="mx-auto mt-3 p-2 rounded-xl text-neutral-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
                    title="Expand sidebar"
                    aria-label="Expand sidebar"
                >
                    <PanelLeftOpen size={16} />
                </button>
            )}

            {/* ---- Navigation ---- */}
            <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden custom-scrollbar">
                {visibleSections.map((section) => (
                    <div key={section.group}>
                        {/* Module Separator */}
                        {section.moduleSeparator && !collapsed && (
                            <div className="flex items-center gap-2 px-5 pt-5 pb-1">
                                <div className="flex-1 h-px bg-primary-100 dark:bg-primary-900/40" />
                                <span className="text-[9px] font-bold uppercase tracking-[2px] text-primary-500 dark:text-primary-400 whitespace-nowrap">
                                    {section.moduleSeparator}
                                </span>
                                <div className="flex-1 h-px bg-primary-100 dark:bg-primary-900/40" />
                            </div>
                        )}
                        {collapsed && section.moduleSeparator && (
                            <div className="mx-3 mt-3 mb-1 h-px bg-primary-100 dark:bg-primary-900/40" />
                        )}

                        <div className={cn('mb-1', collapsed ? 'px-2' : 'px-3')}>
                            {/* Section label */}
                            {!collapsed && (
                                <p className="px-3 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                                    {section.group}
                                </p>
                            )}
                            {collapsed && <div className="h-3" />}

                            {section.items.map((item) => {
                            const active = isItemActive(item);
                            const hasChildren = item.children && item.children.length > 0;
                            const isOpen = openGroups[item.path];

                            return (
                                <div key={item.path}>
                                    {/* Main Nav Item */}
                                    <button
                                        onMouseEnter={(e) => handleMouseEnter(e, item.label)}
                                        onMouseLeave={handleMouseLeave}
                                        onClick={() => {
                                            if (hasChildren && !collapsed) {
                                                toggleGroup(item.path);
                                            } else {
                                                navigate(item.path);
                                            }
                                        }}
                                        title={undefined}
                                        className={cn(
                                            'w-full flex items-center gap-3 rounded-xl transition-all duration-150 group relative',
                                            collapsed ? 'px-2.5 py-2.5 justify-center' : 'px-3 py-2.5',
                                            active
                                                ? 'bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
                                                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-200'
                                        )}
                                    >
                                        {/* Active indicator bar */}
                                        {active && !collapsed && (
                                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary-600 rounded-r-full" />
                                        )}

                                        <item.icon
                                            size={18}
                                            strokeWidth={active ? 2.5 : 2}
                                            className={cn(
                                                'flex-shrink-0 transition-colors',
                                                active ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-700 dark:group-hover:text-neutral-300'
                                            )}
                                        />

                                        {!collapsed && (
                                            <>
                                                <span className={cn('flex-1 text-left text-sm font-medium whitespace-nowrap', active && 'font-semibold')}>
                                                    {item.label}
                                                </span>
                                                {item.badge !== undefined && (
                                                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300">
                                                        {item.badge}
                                                    </span>
                                                )}
                                                {hasChildren && (
                                                    <ChevronDown
                                                        size={13}
                                                        className={cn(
                                                            'text-neutral-400 transition-transform duration-200 flex-shrink-0',
                                                            isOpen && 'rotate-180'
                                                        )}
                                                    />
                                                )}
                                            </>
                                        )}
                                    </button>

                                    {/* Sub-items with dotted connector */}
                                    {hasChildren && !collapsed && isOpen && (
                                        <div className="relative mt-0.5 mb-1 animate-in fade-in slide-in-from-top-1 duration-150">
                                            {/* Vertical dotted line */}
                                            <div className="absolute left-[21px] top-0 bottom-[18px] w-[2px] animated-dash-y text-neutral-200 dark:text-neutral-700 pointer-events-none" />

                                            <div className="space-y-0.5">
                                                {item.children!.map((child, ci) => {
                                                    const childActive = location.pathname === child.path ||
                                                        location.pathname.startsWith(child.path + '/');
                                                    return (
                                                        <NavLink
                                                            key={child.path}
                                                            to={child.path}
                                                            className={cn(
                                                                'flex items-center gap-2.5 pl-[48px] pr-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 group/sub relative',
                                                                childActive
                                                                    ? 'text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/30 font-semibold'
                                                                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                                                            )}
                                                        >
                                                            {/* Horizontal connector dot-line */}
                                                            <span className={cn(
                                                                'absolute left-[21px] top-1/2 -translate-y-1/2 w-[14px] h-[2px] pointer-events-none animated-dash-x',
                                                                childActive ? 'text-primary-400 dark:text-primary-600' : 'text-neutral-200 dark:text-neutral-700'
                                                            )} />
                                                            {/* Dot at end of horizontal line */}
                                                            <span className={cn(
                                                                'absolute left-[35px] top-1/2 -translate-y-1/2 w-[5px] h-[5px] rounded-full flex-shrink-0 pointer-events-none',
                                                                childActive ? 'bg-primary-600 dark:bg-primary-400' : 'bg-neutral-300 dark:bg-neutral-600'
                                                            )} />
                                                            {child.label}
                                                            {child.badge !== undefined && (
                                                                <span className="ml-auto px-1.5 py-0.5 text-[9px] font-bold bg-danger-100 text-danger-700 rounded-full">
                                                                    {child.badge}
                                                                </span>
                                                            )}
                                                        </NavLink>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* ---- Bottom Items ---- */}
            <div className={cn(
                'border-t border-neutral-100 dark:border-neutral-800 py-3 flex-shrink-0',
                collapsed ? 'px-2' : 'px-3'
            )}>
                {BOTTOM_NAV.map((item) => {
                    const active = location.pathname === item.path;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onMouseEnter={(e) => handleMouseEnter(e, item.label)}
                            onMouseLeave={handleMouseLeave}
                            title={undefined}
                            className={cn(
                                'w-full flex items-center gap-3 rounded-xl transition-all duration-150 group relative mb-0.5',
                                collapsed ? 'px-2.5 py-2.5 justify-center' : 'px-3 py-2.5',
                                active
                                    ? 'bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
                                    : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-800 dark:hover:text-neutral-200'
                            )}
                        >
                            <div className="relative flex-shrink-0">
                                <item.icon
                                    size={17}
                                    strokeWidth={active ? 2.5 : 2}
                                    className={active ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-700 dark:group-hover:text-neutral-300'}
                                />
                                {item.badge !== undefined && (
                                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-danger-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                                        {item.badge}
                                    </span>
                                )}
                            </div>
                            {!collapsed && (
                                <>
                                    <span className={cn('flex-1 text-sm font-medium', active && 'font-semibold')}>
                                        {item.label}
                                    </span>
                                    {item.badge !== undefined && (
                                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-danger-100 text-danger-700">
                                            {item.badge}
                                        </span>
                                    )}
                                </>
                            )}
                        </NavLink>
                    );
                })}

                {/* User profile card */}
                <div className={cn(
                    'mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800',
                    collapsed ? 'flex justify-center' : ''
                )}>
                    {collapsed ? (
                        <button
                            onClick={handleLogout}
                            title="Sign Out"
                            aria-label={`Sign out ${displayName}`}
                            className="w-9 h-9 rounded-xl bg-gradient-to-tr from-accent-400 to-primary-500 flex items-center justify-center shadow-sm"
                        >
                            <span className="text-white font-bold text-xs">{initials}</span>
                        </button>
                    ) : (
                        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-accent-400 to-primary-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                                <span className="text-white font-bold text-[11px]">{initials}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-primary-950 dark:text-white truncate">{displayName}</p>
                                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">{email}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                title="Sign Out"
                                aria-label="Sign out"
                                className="p-1.5 rounded-lg text-neutral-400 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-950 transition-colors flex-shrink-0"
                            >
                                <LogOut size={13} strokeWidth={2.5} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Global Hover Tooltip for Collapsed Sidebar */}
            {collapsed && hoveredLabel && hoveredRect && document.body && createPortal(
                <span
                    className="fixed z-[9999] px-3 py-1.5 bg-neutral-900 dark:bg-neutral-700 text-white text-xs font-semibold rounded-xl whitespace-nowrap pointer-events-none shadow-xl animate-in fade-in zoom-in-95 duration-100"
                    style={{
                        top: hoveredRect.top + hoveredRect.height / 2,
                        left: hoveredRect.right + 12,
                        transform: 'translateY(-50%)'
                    }}
                >
                    {hoveredLabel}
                    <span className="absolute right-full top-1/2 -translate-y-1/2 border-y-4 border-y-transparent border-r-4 border-r-neutral-900 dark:border-r-neutral-700" />
                </span>,
                document.body
            )}
        </aside>
    );
}
