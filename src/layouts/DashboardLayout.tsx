// ============================================================
// DashboardLayout — Main application shell
// ============================================================
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useAuthStore } from '@/store/useAuthStore';
import type { UserRole } from '@/store/useAuthStore';
import type { SidebarUserRole } from './Sidebar';
import { useNavigationManifest } from '@/features/company-admin/api';
import { usePermissionRefresh } from '@/hooks/usePermissionRefresh';

/** Map auth store role (hyphen) to sidebar role (underscore). */
function toSidebarRole(role: UserRole | null): SidebarUserRole {
    switch (role) {
        case 'super-admin': return 'super_admin';
        case 'company-admin': return 'company_admin';
        case 'user': return 'viewer';
        default: return 'viewer';
    }
}

export function DashboardLayout() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const userRole = useAuthStore((s) => s.userRole);
    const permissions = useAuthStore((s) => s.permissions);
    const { data: manifestData } = useNavigationManifest();

    // Auto-refresh permissions on dashboard load (picks up role changes without re-login)
    usePermissionRefresh();

    // Extract manifest sections from API response envelope
    const manifestSections = manifestData?.data ?? (Array.isArray(manifestData) ? manifestData : undefined);

    return (
        <div className="flex h-screen w-full overflow-hidden bg-[var(--background)] dark:bg-neutral-950 transition-colors">
            {/* Nav Sidebar */}
            <Sidebar
                collapsed={sidebarCollapsed}
                onCollapse={setSidebarCollapsed}
                role={toSidebarRole(userRole)}
                permissions={permissions}
                manifestSections={manifestSections}
            />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 bg-[var(--background)] dark:bg-neutral-950 transition-colors">
                <TopBar sidebarCollapsed={sidebarCollapsed} />

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}
