import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from 'sonner';
import { AuthLayout } from "./layouts/AuthLayout";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { useAuthStore } from "./store/useAuthStore";
import type { UserRole } from "./store/useAuthStore";
import { NoPermissionScreen } from "./features/shared/NoPermissionScreen";

// Screens (Implemented)
import { LandingScreen } from "./features/auth/LandingScreen";
import { LoginScreen } from "./features/auth/LoginScreen";
import { ForgotPasswordScreen } from "./features/auth/ForgotPasswordScreen";
import { VerifyResetCodeScreen } from "./features/auth/VerifyResetCodeScreen";
import { ResetPasswordScreen } from "./features/auth/ResetPasswordScreen";
import { DashboardScreen } from "./features/super-admin/DashboardScreen";
import { CompanyAdminDashboard } from "./features/company-admin/CompanyAdminDashboard";
import { CompanyListScreen } from "./features/super-admin/CompanyListScreen";
import { CompanyDetailScreen } from "./features/super-admin/CompanyDetailScreen";
import { AddCompanyWizard } from "./features/super-admin/AddCompanyWizard";
import { BillingOverviewScreen } from "./features/super-admin/BillingOverviewScreen";
import { PlatformMonitorScreen } from "./features/super-admin/PlatformMonitorScreen";
import { ModuleCatalogueScreen } from "./features/super-admin/ModuleCatalogueScreen";
import { ModuleAssignmentScreen } from "./features/super-admin/ModuleAssignmentScreen";
import { AuditLogScreen } from "./features/super-admin/AuditLogScreen";

// Placeholder components to prevent router crashes before we build them
const Placeholder = ({ name }: { name: string }) => (
  <div className="flex items-center justify-center p-12 h-full">
    <div className="text-center">
      <h2 className="text-2xl font-bold text-neutral-400 mb-2">{name}</h2>
      <p className="text-neutral-500">Screen pending implementation</p>
    </div>
  </div>
);

// Private Route Wrapper — redirects to login if not authenticated
// While status is 'idle' (hydrating), show a minimal loading indicator to avoid flashing
const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const status = useAuthStore((s) => s.status);

  if (status === 'idle') {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-neutral-950">
        <div className="w-6 h-6 rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin" />
      </div>
    );
  }

  if (status === 'signOut') {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Role Guard — renders NoPermissionScreen if user doesn't have the required role
const RequireRole = ({ children, roles }: { children: React.ReactNode; roles: UserRole[] }) => {
  const userRole = useAuthStore((s) => s.userRole);

  // While auth is still hydrating (idle), wait — RequireAuth above handles the idle state
  if (userRole !== null && !roles.includes(userRole)) {
    return <NoPermissionScreen />;
  }

  return children;
};

function RoleBasedDashboard() {
  const userRole = useAuthStore((s) => s.userRole);
  if (userRole === 'company-admin') return <CompanyAdminDashboard />;
  return <DashboardScreen />;
}

function App() {
  return (
    <>
    <Toaster position="top-right" richColors closeButton toastOptions={{ style: { fontFamily: 'Inter, system-ui, sans-serif' } }} />
    <Routes>
      {/* Public Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/" element={<LandingScreen />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
        <Route path="/reset-password/verify" element={<VerifyResetCodeScreen />} />
        <Route path="/reset-password/new" element={<ResetPasswordScreen />} />
      </Route>

      {/* Protected App Routes */}
      <Route
        path="/app"
        element={
          <RequireAuth>
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<RoleBasedDashboard />} />
        {/* Super-admin-only routes */}
        <Route path="companies" element={<RequireRole roles={['super-admin']}><CompanyListScreen /></RequireRole>} />
        <Route path="companies/add" element={<RequireRole roles={['super-admin']}><AddCompanyWizard /></RequireRole>} />
        <Route path="companies/:id" element={<RequireRole roles={['super-admin']}><CompanyDetailScreen /></RequireRole>} />
        <Route path="companies/:id/modules" element={<RequireRole roles={['super-admin']}><ModuleAssignmentScreen /></RequireRole>} />
        <Route path="billing" element={<RequireRole roles={['super-admin']}><BillingOverviewScreen /></RequireRole>} />
        <Route path="reports/audit" element={<RequireRole roles={['super-admin']}><AuditLogScreen /></RequireRole>} />
        {/* Super-admin + company-admin routes */}
        <Route path="modules" element={<RequireRole roles={['super-admin', 'company-admin']}><ModuleCatalogueScreen /></RequireRole>} />
        <Route path="monitor" element={<RequireRole roles={['super-admin', 'company-admin']}><PlatformMonitorScreen /></RequireRole>} />
        {/* All authenticated users */}
        <Route path="notifications" element={<Placeholder name="Notifications" />} />
        <Route path="settings" element={<Placeholder name="Settings" />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}

export default App;
