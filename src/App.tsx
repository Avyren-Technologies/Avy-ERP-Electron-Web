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
import { PaymentHistoryScreen } from "./features/super-admin/PaymentHistoryScreen";
import { InvoiceListScreen } from "./features/super-admin/InvoiceListScreen";
import { InvoiceDetailScreen } from "./features/super-admin/InvoiceDetailScreen";
import { SubscriptionDetailScreen } from "./features/super-admin/SubscriptionDetailScreen";

// Company Admin Screens
import { CompanyProfileScreen } from "./features/company-admin/CompanyProfileScreen";
import { LocationManagementScreen } from "./features/company-admin/LocationManagementScreen";
import { ShiftManagementScreen } from "./features/company-admin/ShiftManagementScreen";
import { ContactManagementScreen } from "./features/company-admin/ContactManagementScreen";
import { NoSeriesManagementScreen } from "./features/company-admin/NoSeriesManagementScreen";
import { IOTReasonManagementScreen } from "./features/company-admin/IOTReasonManagementScreen";
import { SystemControlsScreen } from "./features/company-admin/SystemControlsScreen";
import { CompanySettingsScreen } from "./features/company-admin/CompanySettingsScreen";
import { UserManagementScreen } from "./features/company-admin/UserManagementScreen";
import { RoleManagementScreen } from "./features/company-admin/RoleManagementScreen";
import { FeatureToggleScreen } from "./features/company-admin/FeatureToggleScreen";

// HR Org Structure Screens
import { DepartmentScreen } from "./features/company-admin/hr/DepartmentScreen";
import { DesignationScreen } from "./features/company-admin/hr/DesignationScreen";
import { GradeScreen } from "./features/company-admin/hr/GradeScreen";
import { EmployeeTypeScreen } from "./features/company-admin/hr/EmployeeTypeScreen";
import { CostCentreScreen } from "./features/company-admin/hr/CostCentreScreen";
import { EmployeeDirectoryScreen } from "./features/company-admin/hr/EmployeeDirectoryScreen";
import { EmployeeProfileScreen } from "./features/company-admin/hr/EmployeeProfileScreen";

// HR Leave Management Screens
import { LeaveTypeScreen } from "./features/company-admin/hr/LeaveTypeScreen";
import { LeavePolicyScreen } from "./features/company-admin/hr/LeavePolicyScreen";
import { LeaveRequestScreen } from "./features/company-admin/hr/LeaveRequestScreen";
import { LeaveBalanceScreen } from "./features/company-admin/hr/LeaveBalanceScreen";

// HR Attendance Screens
import { AttendanceDashboardScreen } from "./features/company-admin/hr/AttendanceDashboardScreen";
import { HolidayScreen } from "./features/company-admin/hr/HolidayScreen";
import { RosterScreen } from "./features/company-admin/hr/RosterScreen";
import { AttendanceRulesScreen } from "./features/company-admin/hr/AttendanceRulesScreen";
import { AttendanceOverrideScreen } from "./features/company-admin/hr/AttendanceOverrideScreen";
import { OvertimeRulesScreen } from "./features/company-admin/hr/OvertimeRulesScreen";

// HR Payroll & Compliance Screens
import { SalaryComponentScreen } from "./features/company-admin/hr/SalaryComponentScreen";
import { SalaryStructureScreen } from "./features/company-admin/hr/SalaryStructureScreen";
import { EmployeeSalaryScreen } from "./features/company-admin/hr/EmployeeSalaryScreen";
import { StatutoryConfigScreen } from "./features/company-admin/hr/StatutoryConfigScreen";
import { TaxConfigScreen } from "./features/company-admin/hr/TaxConfigScreen";
import { BankConfigScreen } from "./features/company-admin/hr/BankConfigScreen";
import { LoanPolicyScreen } from "./features/company-admin/hr/LoanPolicyScreen";
import { LoanScreen } from "./features/company-admin/hr/LoanScreen";

// HR Payroll Operations Screens
import { PayrollRunScreen } from "./features/company-admin/hr/PayrollRunScreen";
import { PayslipScreen } from "./features/company-admin/hr/PayslipScreen";
import { SalaryHoldScreen } from "./features/company-admin/hr/SalaryHoldScreen";
import { SalaryRevisionScreen } from "./features/company-admin/hr/SalaryRevisionScreen";
import { StatutoryFilingScreen } from "./features/company-admin/hr/StatutoryFilingScreen";
import { PayrollReportScreen } from "./features/company-admin/hr/PayrollReportScreen";

// HR ESS & Workflow Screens
import { EssConfigScreen } from "./features/company-admin/hr/EssConfigScreen";
import { ApprovalWorkflowScreen } from "./features/company-admin/hr/ApprovalWorkflowScreen";
import { ApprovalRequestScreen } from "./features/company-admin/hr/ApprovalRequestScreen";
import { NotificationTemplateScreen } from "./features/company-admin/hr/NotificationTemplateScreen";
import { NotificationRuleScreen } from "./features/company-admin/hr/NotificationRuleScreen";
import { ITDeclarationScreen } from "./features/company-admin/hr/ITDeclarationScreen";

// HR Self-Service Screens
import { MyProfileScreen } from "./features/company-admin/hr/MyProfileScreen";
import { MyPayslipsScreen } from "./features/company-admin/hr/MyPayslipsScreen";
import { MyLeaveScreen } from "./features/company-admin/hr/MyLeaveScreen";
import { MyAttendanceScreen } from "./features/company-admin/hr/MyAttendanceScreen";
import { TeamViewScreen } from "./features/company-admin/hr/TeamViewScreen";

// HR Recruitment & Training Screens
import { RequisitionScreen } from "./features/company-admin/hr/RequisitionScreen";
import { CandidateScreen } from "./features/company-admin/hr/CandidateScreen";
import { TrainingCatalogueScreen } from "./features/company-admin/hr/TrainingCatalogueScreen";
import { TrainingNominationScreen } from "./features/company-admin/hr/TrainingNominationScreen";

// HR Exit & Separation Screens
import { ExitRequestScreen } from "./features/company-admin/hr/ExitRequestScreen";
import { ClearanceDashboardScreen } from "./features/company-admin/hr/ClearanceDashboardScreen";
import { FnFSettlementScreen } from "./features/company-admin/hr/FnFSettlementScreen";

// HR Advanced HR Screens
import { AssetManagementScreen } from "./features/company-admin/hr/AssetManagementScreen";
import { ExpenseClaimScreen } from "./features/company-admin/hr/ExpenseClaimScreen";
import { HRLetterScreen } from "./features/company-admin/hr/HRLetterScreen";
import { GrievanceScreen } from "./features/company-admin/hr/GrievanceScreen";
import { DisciplinaryScreen } from "./features/company-admin/hr/DisciplinaryScreen";

// HR Transfer, Promotion & Delegation Screens
import { TransferScreen } from "./features/company-admin/hr/TransferScreen";
import { PromotionScreen } from "./features/company-admin/hr/PromotionScreen";
import { DelegateScreen } from "./features/company-admin/hr/DelegateScreen";

// HR Performance Management Screens
import { AppraisalCycleScreen } from "./features/company-admin/hr/AppraisalCycleScreen";
import { GoalScreen } from "./features/company-admin/hr/GoalScreen";
import { Feedback360Screen } from "./features/company-admin/hr/Feedback360Screen";
import { RatingsScreen } from "./features/company-admin/hr/RatingsScreen";
import { SkillScreen } from "./features/company-admin/hr/SkillScreen";
import { SuccessionScreen } from "./features/company-admin/hr/SuccessionScreen";
import { PerformanceDashboardScreen } from "./features/company-admin/hr/PerformanceDashboardScreen";

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
        <Route path="billing/invoices" element={<RequireRole roles={['super-admin']}><InvoiceListScreen /></RequireRole>} />
        <Route path="billing/invoices/:id" element={<RequireRole roles={['super-admin']}><InvoiceDetailScreen /></RequireRole>} />
        <Route path="billing/payments" element={<RequireRole roles={['super-admin']}><PaymentHistoryScreen /></RequireRole>} />
        <Route path="billing/subscriptions/:companyId" element={<RequireRole roles={['super-admin']}><SubscriptionDetailScreen /></RequireRole>} />
        <Route path="reports/audit" element={<RequireRole roles={['super-admin', 'company-admin']}><AuditLogScreen /></RequireRole>} />
        {/* Company-admin-only routes */}
        <Route path="company/profile" element={<RequireRole roles={['company-admin']}><CompanyProfileScreen /></RequireRole>} />
        <Route path="company/locations" element={<RequireRole roles={['company-admin']}><LocationManagementScreen /></RequireRole>} />
        <Route path="company/shifts" element={<RequireRole roles={['company-admin']}><ShiftManagementScreen /></RequireRole>} />
        <Route path="company/contacts" element={<RequireRole roles={['company-admin']}><ContactManagementScreen /></RequireRole>} />
        <Route path="company/no-series" element={<RequireRole roles={['company-admin']}><NoSeriesManagementScreen /></RequireRole>} />
        <Route path="company/iot-reasons" element={<RequireRole roles={['company-admin']}><IOTReasonManagementScreen /></RequireRole>} />
        <Route path="company/controls" element={<RequireRole roles={['company-admin']}><SystemControlsScreen /></RequireRole>} />
        <Route path="company/settings" element={<RequireRole roles={['company-admin']}><CompanySettingsScreen /></RequireRole>} />
        <Route path="company/users" element={<RequireRole roles={['company-admin']}><UserManagementScreen /></RequireRole>} />
        <Route path="company/roles" element={<RequireRole roles={['company-admin']}><RoleManagementScreen /></RequireRole>} />
        <Route path="company/feature-toggles" element={<RequireRole roles={['company-admin']}><FeatureToggleScreen /></RequireRole>} />
        {/* Company-admin HR routes */}
        <Route path="company/hr/departments" element={<RequireRole roles={['company-admin']}><DepartmentScreen /></RequireRole>} />
        <Route path="company/hr/designations" element={<RequireRole roles={['company-admin']}><DesignationScreen /></RequireRole>} />
        <Route path="company/hr/grades" element={<RequireRole roles={['company-admin']}><GradeScreen /></RequireRole>} />
        <Route path="company/hr/employee-types" element={<RequireRole roles={['company-admin']}><EmployeeTypeScreen /></RequireRole>} />
        <Route path="company/hr/cost-centres" element={<RequireRole roles={['company-admin']}><CostCentreScreen /></RequireRole>} />
        <Route path="company/hr/employees" element={<RequireRole roles={['company-admin']}><EmployeeDirectoryScreen /></RequireRole>} />
        <Route path="company/hr/employees/:id" element={<RequireRole roles={['company-admin']}><EmployeeProfileScreen /></RequireRole>} />
        {/* Company-admin Attendance routes */}
        <Route path="company/hr/attendance" element={<RequireRole roles={['company-admin']}><AttendanceDashboardScreen /></RequireRole>} />
        <Route path="company/hr/holidays" element={<RequireRole roles={['company-admin']}><HolidayScreen /></RequireRole>} />
        <Route path="company/hr/rosters" element={<RequireRole roles={['company-admin']}><RosterScreen /></RequireRole>} />
        <Route path="company/hr/attendance-rules" element={<RequireRole roles={['company-admin']}><AttendanceRulesScreen /></RequireRole>} />
        <Route path="company/hr/attendance-overrides" element={<RequireRole roles={['company-admin']}><AttendanceOverrideScreen /></RequireRole>} />
        <Route path="company/hr/overtime-rules" element={<RequireRole roles={['company-admin']}><OvertimeRulesScreen /></RequireRole>} />
        {/* Company-admin Leave Management routes */}
        <Route path="company/hr/leave-types" element={<RequireRole roles={['company-admin']}><LeaveTypeScreen /></RequireRole>} />
        <Route path="company/hr/leave-policies" element={<RequireRole roles={['company-admin']}><LeavePolicyScreen /></RequireRole>} />
        <Route path="company/hr/leave-requests" element={<RequireRole roles={['company-admin']}><LeaveRequestScreen /></RequireRole>} />
        <Route path="company/hr/leave-balances" element={<RequireRole roles={['company-admin']}><LeaveBalanceScreen /></RequireRole>} />
        {/* Company-admin Payroll & Compliance routes */}
        <Route path="company/hr/salary-components" element={<RequireRole roles={['company-admin']}><SalaryComponentScreen /></RequireRole>} />
        <Route path="company/hr/salary-structures" element={<RequireRole roles={['company-admin']}><SalaryStructureScreen /></RequireRole>} />
        <Route path="company/hr/employee-salary" element={<RequireRole roles={['company-admin']}><EmployeeSalaryScreen /></RequireRole>} />
        <Route path="company/hr/statutory-config" element={<RequireRole roles={['company-admin']}><StatutoryConfigScreen /></RequireRole>} />
        <Route path="company/hr/tax-config" element={<RequireRole roles={['company-admin']}><TaxConfigScreen /></RequireRole>} />
        <Route path="company/hr/bank-config" element={<RequireRole roles={['company-admin']}><BankConfigScreen /></RequireRole>} />
        <Route path="company/hr/loan-policies" element={<RequireRole roles={['company-admin']}><LoanPolicyScreen /></RequireRole>} />
        <Route path="company/hr/loans" element={<RequireRole roles={['company-admin']}><LoanScreen /></RequireRole>} />
        {/* Company-admin Payroll Operations routes */}
        <Route path="company/hr/payroll-runs" element={<RequireRole roles={['company-admin']}><PayrollRunScreen /></RequireRole>} />
        <Route path="company/hr/payslips" element={<RequireRole roles={['company-admin']}><PayslipScreen /></RequireRole>} />
        <Route path="company/hr/salary-holds" element={<RequireRole roles={['company-admin']}><SalaryHoldScreen /></RequireRole>} />
        <Route path="company/hr/salary-revisions" element={<RequireRole roles={['company-admin']}><SalaryRevisionScreen /></RequireRole>} />
        <Route path="company/hr/statutory-filings" element={<RequireRole roles={['company-admin']}><StatutoryFilingScreen /></RequireRole>} />
        <Route path="company/hr/payroll-reports" element={<RequireRole roles={['company-admin']}><PayrollReportScreen /></RequireRole>} />
        {/* Company-admin ESS & Workflow routes */}
        <Route path="company/hr/ess-config" element={<RequireRole roles={['company-admin']}><EssConfigScreen /></RequireRole>} />
        <Route path="company/hr/approval-workflows" element={<RequireRole roles={['company-admin']}><ApprovalWorkflowScreen /></RequireRole>} />
        <Route path="company/hr/approval-requests" element={<RequireRole roles={['company-admin']}><ApprovalRequestScreen /></RequireRole>} />
        <Route path="company/hr/notification-templates" element={<RequireRole roles={['company-admin']}><NotificationTemplateScreen /></RequireRole>} />
        <Route path="company/hr/notification-rules" element={<RequireRole roles={['company-admin']}><NotificationRuleScreen /></RequireRole>} />
        <Route path="company/hr/it-declarations" element={<RequireRole roles={['company-admin']}><ITDeclarationScreen /></RequireRole>} />
        {/* Company-admin Self-Service routes */}
        <Route path="company/hr/my-profile" element={<RequireRole roles={['company-admin']}><MyProfileScreen /></RequireRole>} />
        <Route path="company/hr/my-payslips" element={<RequireRole roles={['company-admin']}><MyPayslipsScreen /></RequireRole>} />
        <Route path="company/hr/my-leave" element={<RequireRole roles={['company-admin']}><MyLeaveScreen /></RequireRole>} />
        <Route path="company/hr/my-attendance" element={<RequireRole roles={['company-admin']}><MyAttendanceScreen /></RequireRole>} />
        <Route path="company/hr/team-view" element={<RequireRole roles={['company-admin']}><TeamViewScreen /></RequireRole>} />
        {/* Company-admin Recruitment & Training routes */}
        <Route path="company/hr/requisitions" element={<RequireRole roles={['company-admin']}><RequisitionScreen /></RequireRole>} />
        <Route path="company/hr/candidates" element={<RequireRole roles={['company-admin']}><CandidateScreen /></RequireRole>} />
        <Route path="company/hr/training" element={<RequireRole roles={['company-admin']}><TrainingCatalogueScreen /></RequireRole>} />
        <Route path="company/hr/training-nominations" element={<RequireRole roles={['company-admin']}><TrainingNominationScreen /></RequireRole>} />
        {/* Company-admin Exit & Separation routes */}
        <Route path="company/hr/exit-requests" element={<RequireRole roles={['company-admin']}><ExitRequestScreen /></RequireRole>} />
        <Route path="company/hr/clearance-dashboard" element={<RequireRole roles={['company-admin']}><ClearanceDashboardScreen /></RequireRole>} />
        <Route path="company/hr/fnf-settlement" element={<RequireRole roles={['company-admin']}><FnFSettlementScreen /></RequireRole>} />
        {/* Company-admin Advanced HR routes */}
        <Route path="company/hr/assets" element={<RequireRole roles={['company-admin']}><AssetManagementScreen /></RequireRole>} />
        <Route path="company/hr/expenses" element={<RequireRole roles={['company-admin']}><ExpenseClaimScreen /></RequireRole>} />
        <Route path="company/hr/hr-letters" element={<RequireRole roles={['company-admin']}><HRLetterScreen /></RequireRole>} />
        <Route path="company/hr/grievances" element={<RequireRole roles={['company-admin']}><GrievanceScreen /></RequireRole>} />
        <Route path="company/hr/disciplinary" element={<RequireRole roles={['company-admin']}><DisciplinaryScreen /></RequireRole>} />
        {/* Company-admin Transfer, Promotion & Delegation routes */}
        <Route path="company/hr/transfers" element={<RequireRole roles={['company-admin']}><TransferScreen /></RequireRole>} />
        <Route path="company/hr/promotions" element={<RequireRole roles={['company-admin']}><PromotionScreen /></RequireRole>} />
        <Route path="company/hr/delegates" element={<RequireRole roles={['company-admin']}><DelegateScreen /></RequireRole>} />
        {/* Company-admin Performance Management routes */}
        <Route path="company/hr/appraisal-cycles" element={<RequireRole roles={['company-admin']}><AppraisalCycleScreen /></RequireRole>} />
        <Route path="company/hr/goals" element={<RequireRole roles={['company-admin']}><GoalScreen /></RequireRole>} />
        <Route path="company/hr/feedback-360" element={<RequireRole roles={['company-admin']}><Feedback360Screen /></RequireRole>} />
        <Route path="company/hr/ratings" element={<RequireRole roles={['company-admin']}><RatingsScreen /></RequireRole>} />
        <Route path="company/hr/skills" element={<RequireRole roles={['company-admin']}><SkillScreen /></RequireRole>} />
        <Route path="company/hr/succession" element={<RequireRole roles={['company-admin']}><SuccessionScreen /></RequireRole>} />
        <Route path="company/hr/performance-dashboard" element={<RequireRole roles={['company-admin']}><PerformanceDashboardScreen /></RequireRole>} />
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
