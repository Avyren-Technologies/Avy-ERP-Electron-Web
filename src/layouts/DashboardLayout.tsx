import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
    Building2,
    CreditCard,
    LayoutDashboard,
    LogOut,
    Settings,
    Blocks,
    Activity,
    Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";

const NAV_ITEMS = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/app/dashboard" },
    { icon: Building2, label: "Companies", path: "/app/companies" },
    { icon: CreditCard, label: "Billing", path: "/app/billing" },
];

const MORE_ITEMS = [
    { icon: Blocks, label: "Module Catalogue", path: "/app/modules" },
    { icon: Activity, label: "Platform Monitor", path: "/app/monitor" },
    { icon: Bell, label: "Notifications", path: "/app/notifications" },
    { icon: Settings, label: "Settings", path: "/app/settings" },
];

export function DashboardLayout() {
    const navigate = useNavigate();
    const signOut = useAuthStore((s) => s.signOut);

    const handleLogout = () => {
        signOut();
        navigate("/login");
    };

    return (
        <div className="flex h-screen w-full overflow-hidden bg-[var(--background)]">
            {/* Sidebar */}
            <aside className="w-64 flex-shrink-0 border-r border-neutral-200 bg-white flex flex-col justify-between shadow-sm z-20">
                <div>
                    {/* Brand */}
                    <div className="h-16 flex items-center px-6 border-b border-neutral-100 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-600 to-accent-500 flex items-center justify-center mr-3 shadow-md shadow-primary-500/20">
                            <span className="text-white font-bold text-sm tracking-wider">A</span>
                        </div>
                        <span className="font-bold text-lg text-primary-950 tracking-tight">Avyren ERP</span>
                    </div>

                    {/* Primary Nav */}
                    <nav className="px-3 space-y-1">
                        <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2 mt-4">
                            Overview
                        </p>
                        {NAV_ITEMS.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group text-sm font-medium",
                                        isActive
                                            ? "bg-primary-50 text-primary-700 font-semibold"
                                            : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                                    )
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <item.icon
                                            size={18}
                                            strokeWidth={isActive ? 2.5 : 2}
                                            className={cn(
                                                "transition-colors",
                                                isActive ? "text-primary-600" : "text-neutral-400 group-hover:text-neutral-600"
                                            )}
                                        />
                                        {item.label}
                                    </>
                                )}
                            </NavLink>
                        ))}

                        <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2 mt-8">
                            Platform Tools
                        </p>
                        {MORE_ITEMS.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group text-sm font-medium",
                                        isActive
                                            ? "bg-primary-50 text-primary-700 font-semibold"
                                            : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                                    )
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <item.icon
                                            size={18}
                                            strokeWidth={isActive ? 2.5 : 2}
                                            className={cn(
                                                "transition-colors",
                                                isActive ? "text-primary-600" : "text-neutral-400 group-hover:text-neutral-600"
                                            )}
                                        />
                                        {item.label}
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </nav>
                </div>

                {/* User Profile & Logout */}
                <div className="p-4 border-t border-neutral-100">
                    <div className="flex items-center gap-3 px-2 py-3 rounded-xl bg-neutral-50 border border-neutral-100 mb-2 cursor-pointer hover:bg-neutral-100 transition-colors">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-accent-400 to-primary-500 flex items-center justify-center">
                            <span className="text-white font-bold text-xs">SA</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-primary-950 truncate">Super Admin</p>
                            <p className="text-xs text-neutral-500 truncate">admin@avyren.com</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-danger-600 hover:bg-danger-50 transition-colors"
                    >
                        <LogOut size={16} strokeWidth={2.5} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 bg-[var(--background)]">
                {/* Top Header - Kept simple as Sidebar acts as primary navigation */}
                <header className="h-16 flex-shrink-0 border-b border-neutral-200/60 bg-white/80 backdrop-blur-md flex items-center px-8 z-10 sticky top-0">
                    <div className="flex-1" />
                    {/* Topbar actions (Notifications, Search) can go here later */}
                    <div className="flex items-center gap-4">
                        <button className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:bg-neutral-200 transition-colors">
                            <Bell size={16} />
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}
