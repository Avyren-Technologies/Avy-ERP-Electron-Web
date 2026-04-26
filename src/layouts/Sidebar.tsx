// ============================================================
// Sidebar — Manifest-driven, collapsible, sub-modules with dotted connector lines
// ============================================================
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard, Building2, CreditCard, Blocks, Activity,
    Settings, LogOut, ChevronDown,
    Users, FileText, BarChart3, Package, Wrench, ClipboardList,
    ShieldCheck, HelpCircle, PanelLeftClose, PanelLeftOpen,
    MapPin, Clock, Hash, Cpu, SlidersHorizontal, UserCog, Shield, ToggleLeft,
    Briefcase, UserCheck, Wallet,
    CalendarCheck, Calendar, CalendarDays, Timer, BookOpen, Send, Scale,
    DollarSign, FileSpreadsheet, Landmark, HandCoins, Receipt, Calculator,
    Play, PauseCircle, TrendingUp, Stamp,
    GitBranch, Mail, BellRing, FileCheck, UserCircle, CalendarOff,
    Target, Flag, MessageSquare, Star, Brain, GitFork,
    UserPlus, GraduationCap, Award, FileSignature, AlertTriangle, Gavel,
    ArrowLeftRight, LogIn, CheckCircle2,
} from 'lucide-react';
import { useAuthStore, getUserInitials, getDisplayName } from '@/store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import appLogo from '@/assets/logo/app-logo.png';

// ============================================================
// Manifest Types — for dynamic sidebar from API
// ============================================================

interface ManifestNavItem {
    id: string;
    label: string;
    icon: string;
    path: string;
    requiredPerm: string | null;
    module: string | null;
    children?: { label: string; path: string }[];
}

interface ManifestSection {
    group: string;
    moduleSeparator?: string;
    items: ManifestNavItem[];
}

// ============================================================
// Icon Map — resolves string icon names from manifest to components
// ============================================================

const ICON_MAP: Record<string, React.ComponentType<any>> = {
    'dashboard': LayoutDashboard, 'building': Building2, 'credit-card': CreditCard,
    'shield-check': ShieldCheck, 'blocks': Blocks, 'activity': Activity,
    'user-cog': UserCog, 'support': HelpCircle, 'user': UserCircle,
    'receipt': Receipt, 'calendar-off': CalendarOff, 'clock': Clock,
    'log-in': LogIn, 'calendar': Calendar, 'target': Target,
    'file-check': FileCheck, 'file-text': FileText, 'alert-triangle': AlertTriangle,
    'graduation-cap': GraduationCap, 'package': Package, 'message-circle': MessageSquare,
    'map-pin': MapPin, 'users': Users, 'shield': Shield, 'toggle-left': ToggleLeft,
    'hash': Hash, 'cpu': Cpu, 'sliders': SlidersHorizontal, 'settings': Settings,
    'briefcase': Briefcase, 'bar-chart': BarChart3, 'user-check': UserCheck,
    'wallet': Wallet, 'calendar-check': CalendarCheck, 'calendar-days': CalendarDays,
    'clipboard-list': ClipboardList, 'timer': Timer, 'book-open': BookOpen,
    'send': Send, 'scale': Scale, 'dollar-sign': DollarSign,
    'file-spreadsheet': FileSpreadsheet, 'calculator': Calculator,
    'landmark': Landmark, 'hand-coins': HandCoins, 'play': Play,
    'pause-circle': PauseCircle, 'trending-up': TrendingUp, 'stamp': Stamp,
    'git-branch': GitBranch, 'mail': Mail, 'bell-ring': BellRing,
    'arrow-left-right': ArrowLeftRight, 'flag': Flag, 'star': Star,
    'brain': Brain, 'git-fork': GitFork, 'user-plus': UserPlus,
    'award': Award, 'log-out': LogOut, 'gavel': Gavel,
    'file-signature': FileSignature, 'wrench': Wrench, 'check-square': CheckCircle2,
    'pen-tool': FileSignature, 'database': Blocks, 'factory': ClipboardList,
    'plane': Send, 'gift': Award, 'message-square': MessageSquare,
    'refresh-cw': Activity, 'default': Blocks,
};

function resolveIcon(iconName: string): React.ComponentType<any> {
    return ICON_MAP[iconName] ?? ICON_MAP['default'];
}

// ============================================================
// Sidebar Component
// ============================================================

interface SidebarProps {
    collapsed: boolean;
    onCollapse: (v: boolean) => void;
    manifestSections?: ManifestSection[];
}

export function Sidebar({ collapsed, onCollapse, manifestSections }: SidebarProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const signOut = useAuthStore((s) => s.signOut);
    const user = useAuthStore((s) => s.user);
    const initials = getUserInitials(user);
    const displayName = getDisplayName(user);
    const email = user?.email ?? '';

    // Track which groups are expanded
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        if (manifestSections) {
            manifestSections.forEach((section) => {
                section.items.forEach((item) => {
                    if (item.children?.some((c) => location.pathname.startsWith(c.path)) ||
                        location.pathname.startsWith(item.path)) {
                        initial[item.path] = true;
                    }
                });
            });
        }
        return initial;
    });

    // Auto-expand active section when route changes
    useEffect(() => {
        if (!manifestSections) return;
        manifestSections.forEach((section) => {
            section.items.forEach((item) => {
                if (item.children?.some((c) => location.pathname.startsWith(c.path))) {
                    setOpenGroups((prev) => ({ ...prev, [item.path]: true }));
                }
            });
        });
    }, [location.pathname, manifestSections]);

    const handleLogout = () => {
        signOut();
        navigate('/login');
    };

    const toggleGroup = (path: string) => {
        setOpenGroups((prev) => ({ ...prev, [path]: !prev[path] }));
    };

    // ── Section-level collapse/expand ──
    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        const defaultExpanded = ['Overview', 'My Workspace', 'Team Management'];
        if (manifestSections) {
            const seen = new Set<string>();
            manifestSections.forEach((section) => {
                if (seen.has(section.group)) return;
                seen.add(section.group);
                if (defaultExpanded.includes(section.group)) return;
                // Skip sections whose items all have children (already self-collapsible)
                if (section.items.every(i => i.children && i.children.length > 0)) return;
                const hasActive = section.items.some(item =>
                    location.pathname === item.path ||
                    location.pathname.startsWith(item.path + '/') ||
                    item.children?.some(c => location.pathname.startsWith(c.path))
                );
                if (!hasActive) initial[section.group] = true;
            });
        }
        return initial;
    });

    // Auto-expand section containing active route
    useEffect(() => {
        if (!manifestSections) return;
        manifestSections.forEach((section) => {
            const hasActive = section.items.some(item =>
                location.pathname === item.path ||
                location.pathname.startsWith(item.path + '/') ||
                item.children?.some(c => location.pathname.startsWith(c.path))
            );
            if (hasActive) {
                setCollapsedSections(prev => {
                    if (prev[section.group]) return { ...prev, [section.group]: false };
                    return prev;
                });
            }
        });
    }, [location.pathname, manifestSections]);

    const toggleSection = (group: string) => {
        if (group === 'Overview') return;
        setCollapsedSections(prev => ({ ...prev, [group]: !prev[group] }));
    };

    // ── Module-level collapse (HRMS, Operations, etc.) ──
    const [collapsedModules, setCollapsedModules] = useState<Record<string, boolean>>({});
    const toggleModule = (moduleName: string) => {
        setCollapsedModules(prev => ({ ...prev, [moduleName]: !prev[moduleName] }));
    };

    const isItemActive = (item: { path: string; children?: { path: string }[] }) => {
        if (item.children) {
            return item.children.some((c) => location.pathname.startsWith(c.path));
        }
        return location.pathname === item.path || location.pathname.startsWith(item.path + '/');
    };

    // Sections come pre-filtered from the navigation manifest API.
    // Deduplicate items within each section by path to avoid duplicate React keys.
    const visibleSections = (manifestSections ?? []).map((s) => {
        const seen = new Set<string>();
        return {
            group: s.group,
            moduleSeparator: s.moduleSeparator,
            items: s.items
                .filter((i) => {
                    if (seen.has(i.path)) return false;
                    seen.add(i.path);
                    return true;
                })
                .map((i) => ({
                    icon: resolveIcon(i.icon),
                    label: i.label,
                    path: i.path,
                    children: i.children,
                    badge: (i as any).badge as number | undefined,
                })),
        };
    });

    // Build module→section mapping for module-level collapse
    const sectionModuleMap: Record<string, string> = {};
    let _currentMod = '';
    for (const s of visibleSections) {
        if (s.moduleSeparator) _currentMod = s.moduleSeparator;
        if (_currentMod) sectionModuleMap[s.group] = _currentMod;
    }

    // Global Tooltip State for Collapsed Mode
    const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);
    const [hoveredRect, setHoveredRect] = useState<DOMRect | null>(null);

    const navRef = useRef<HTMLElement>(null);

    // Scroll the active sidebar item into view on route change or data load
    useEffect(() => {
        if (collapsed || !manifestSections) return;
        requestAnimationFrame(() => {
            const activeEl = navRef.current?.querySelector('[data-active="true"]');
            activeEl?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        });
    }, [location.pathname, collapsed, manifestSections]);

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
                collapsed ? 'px-3 justify-center' : 'px-4 justify-between'
            )}>
                <div className="flex min-w-0 items-center gap-2">
                    <img
                        src={appLogo}
                        alt="Avy ERP"
                        className="h-[60px] w-[60px] shrink-0 object-contain"
                    />
                    {!collapsed && (
                        <span
                            className="truncate bg-gradient-to-br from-[#9333EA] via-[#4F46E5] to-[#22D3EE] bg-clip-text text-xl font-bold leading-none tracking-tight text-transparent"
                        >
                            Avy ERP
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
            <nav ref={navRef} className="flex-1 py-3 overflow-y-auto overflow-x-hidden custom-scrollbar">
                {visibleSections.map((section) => {
                    const isOverview = section.group === 'Overview';
                    const hasOnlyChildItems = section.items.every(item => item.children && item.children.length > 0);
                    const isNonCollapsible = isOverview || hasOnlyChildItems;
                    const isSectionCollapsed = !isNonCollapsible && !collapsed && !!collapsedSections[section.group];
                    const moduleOfSection = sectionModuleMap[section.group];
                    const isModuleCollapsed = !!moduleOfSection && !!collapsedModules[moduleOfSection];
                    const sectionHasActive = section.items.some(item => isItemActive(item));
                    const SectionIcon = section.items[0]?.icon ?? Blocks;

                    return (
                    <div key={section.group}>
                        {/* Module Separator — clickable to collapse entire module */}
                        {section.moduleSeparator && !collapsed && (
                            <button
                                onClick={() => toggleModule(section.moduleSeparator!)}
                                className="w-full flex items-center gap-2 px-5 pt-5 pb-1 cursor-pointer group/mod"
                            >
                                <div className="flex-1 h-px bg-primary-100 dark:bg-primary-900/40" />
                                <span className="text-[9px] font-bold uppercase tracking-[2px] text-primary-500 dark:text-primary-400 whitespace-nowrap">
                                    {section.moduleSeparator}
                                </span>
                                <ChevronDown
                                    size={11}
                                    className={cn(
                                        'text-primary-400 dark:text-primary-500 transition-transform duration-200',
                                        isModuleCollapsed && '-rotate-90'
                                    )}
                                />
                                <div className="flex-1 h-px bg-primary-100 dark:bg-primary-900/40" />
                            </button>
                        )}
                        {collapsed && section.moduleSeparator && (
                            <div className="mx-3 mt-3 mb-1 h-px bg-primary-100 dark:bg-primary-900/40" />
                        )}

                        {!isModuleCollapsed && (
                        <div className={cn('mb-1', collapsed ? 'px-2' : 'px-3')}>
                            {/* Section header */}
                            {!collapsed && (isNonCollapsible ? (
                                <p className="px-3 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-neutral-600 dark:text-neutral-300">
                                    {section.group}
                                </p>
                            ) : (
                                <button
                                    onClick={() => toggleSection(section.group)}
                                    className={cn(
                                        'w-full flex items-center gap-3 rounded-xl transition-all duration-150 group relative',
                                        'px-3 py-2.5',
                                        sectionHasActive
                                            ? 'bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
                                            : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-200'
                                    )}
                                >
                                    {sectionHasActive && (
                                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary-600 rounded-r-full" />
                                    )}
                                    <SectionIcon
                                        size={18}
                                        strokeWidth={sectionHasActive ? 2.5 : 2}
                                        className={cn(
                                            'flex-shrink-0 transition-colors',
                                            sectionHasActive ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-700 dark:group-hover:text-neutral-300'
                                        )}
                                    />
                                    <span className={cn('flex-1 text-left text-sm font-medium whitespace-nowrap', sectionHasActive && 'font-semibold')}>
                                        {section.group}
                                    </span>
                                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                                        {section.items.length}
                                    </span>
                                    <ChevronDown
                                        size={13}
                                        className={cn(
                                            'text-neutral-400 transition-transform duration-200 flex-shrink-0',
                                            isSectionCollapsed ? '-rotate-90' : 'rotate-0'
                                        )}
                                    />
                                </button>
                            ))}
                            {collapsed && <div className="h-3" />}

                            {/* Collapsible sections: child-style items with dotted connectors */}
                            {!isNonCollapsible && !collapsed && (
                                <div className={cn(
                                    'grid transition-[grid-template-rows] duration-200 ease-in-out',
                                    isSectionCollapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'
                                )}>
                                <div className="overflow-hidden">
                                    <div className="relative mt-0.5 mb-1">
                                        {/* Vertical dotted line */}
                                        <div className="absolute left-[21px] top-0 bottom-[18px] w-[2px] animated-dash-y text-neutral-200 dark:text-neutral-700 pointer-events-none" />
                                        <div className="space-y-0.5">
                                            {section.items.map((item) => {
                                                const active = isItemActive(item);
                                                return (
                                                    <NavLink
                                                        key={`${section.group}::${item.path}`}
                                                        to={item.path}
                                                        data-active={active ? "true" : undefined}
                                                        className={cn(
                                                            'flex items-center gap-2.5 pl-[48px] pr-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 group/sub relative',
                                                            active
                                                                ? 'text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/30 font-semibold'
                                                                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                                                        )}
                                                    >
                                                        {/* Horizontal connector */}
                                                        <span className={cn(
                                                            'absolute left-[21px] top-1/2 -translate-y-1/2 w-[14px] h-[2px] pointer-events-none animated-dash-x',
                                                            active ? 'text-primary-400 dark:text-primary-600' : 'text-neutral-200 dark:text-neutral-700'
                                                        )} />
                                                        {/* Dot */}
                                                        <span className={cn(
                                                            'absolute left-[35px] top-1/2 -translate-y-1/2 w-[5px] h-[5px] rounded-full flex-shrink-0 pointer-events-none',
                                                            active ? 'bg-primary-600 dark:bg-primary-400' : 'bg-neutral-300 dark:bg-neutral-600'
                                                        )} />
                                                        {item.label}
                                                    </NavLink>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                                </div>
                            )}

                            {/* Non-collapsible or collapsed sidebar: full nav items */}
                            {(isNonCollapsible || collapsed) && section.items.map((item) => {
                            const active = isItemActive(item);
                            const hasChildren = item.children && item.children.length > 0;
                            const isOpen = openGroups[item.path];

                            return (
                                <div key={`${section.group}::${item.path}`}>
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
                                        data-active={active && !hasChildren ? "true" : undefined}
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
                                                            key={`${section.group}::${item.path}::${child.path}::${ci}`}
                                                            to={child.path}
                                                            data-active={childActive ? "true" : undefined}
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
                                                            {(child as any).badge !== undefined && (
                                                                <span className="ml-auto px-1.5 py-0.5 text-[9px] font-bold bg-danger-100 text-danger-700 rounded-full">
                                                                    {(child as any).badge}
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
                        )}
                    </div>
                    );
                })}
            </nav>

            {/* ---- Bottom: User profile card & sign-out ---- */}
            <div className={cn(
                'border-t border-neutral-100 dark:border-neutral-800 flex-shrink-0',
                collapsed ? 'py-3 px-2' : 'px-3 py-2'
            )}>
                {/* User profile card */}
                <div className={cn(
                    collapsed && 'flex justify-center'
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
