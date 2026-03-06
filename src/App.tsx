import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthLayout } from "./layouts/AuthLayout";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { useAuthStore } from "./store/useAuthStore";

// Screens (Implemented)
import { LandingScreen } from "./features/auth/LandingScreen";
import { LoginScreen } from "./features/auth/LoginScreen";
import { DashboardScreen } from "./features/super-admin/DashboardScreen";
import { CompanyListScreen } from "./features/super-admin/CompanyListScreen";
import { CompanyDetailScreen } from "./features/super-admin/CompanyDetailScreen";
import { AddCompanyWizard } from "./features/super-admin/AddCompanyWizard";
import { BillingOverviewScreen } from "./features/super-admin/BillingOverviewScreen";
import { PlatformMonitorScreen } from "./features/super-admin/PlatformMonitorScreen";
import { ModuleCatalogueScreen } from "./features/super-admin/ModuleCatalogueScreen";
import { ModuleAssignmentScreen } from "./features/super-admin/ModuleAssignmentScreen";

// Placeholder components to prevent router crashes before we build them
const Placeholder = ({ name }: { name: string }) => (
  <div className="flex items-center justify-center p-12 h-full">
    <div className="text-center">
      <h2 className="text-2xl font-bold text-neutral-400 mb-2">{name}</h2>
      <p className="text-neutral-500">Screen pending implementation</p>
    </div>
  </div>
);

// Private Route Wrapper
const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const status = useAuthStore((s) => s.status);

  if (status === 'signOut') {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/" element={<LandingScreen />} />
        <Route path="/login" element={<LoginScreen />} />
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
        <Route path="dashboard" element={<DashboardScreen />} />
        <Route path="companies" element={<CompanyListScreen />} />
        <Route path="companies/add" element={<AddCompanyWizard />} />
        <Route path="companies/:id" element={<CompanyDetailScreen />} />
        <Route path="companies/:id/modules" element={<ModuleAssignmentScreen />} />
        <Route path="billing" element={<BillingOverviewScreen />} />
        <Route path="modules" element={<ModuleCatalogueScreen />} />
        <Route path="monitor" element={<PlatformMonitorScreen />} />
        <Route path="notifications" element={<Placeholder name="Notifications" />} />
        <Route path="settings" element={<Placeholder name="Settings" />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
