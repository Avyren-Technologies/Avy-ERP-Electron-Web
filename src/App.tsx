import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from 'sonner';
import { AuthLayout } from "./layouts/AuthLayout";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { useAuthStore } from "./store/useAuthStore";
import type { UserRole } from "./store/useAuthStore";
import { checkPermission } from "./lib/api/auth";
import { NoPermissionScreen } from "./features/shared/NoPermissionScreen";

// Screens (Implemented)
import { LandingScreen } from "./features/auth/LandingScreen";
import { LoginScreen } from "./features/auth/LoginScreen";
import { ForgotPasswordScreen } from "./features/auth/ForgotPasswordScreen";
import { VerifyResetCodeScreen } from "./features/auth/VerifyResetCodeScreen";
import { ResetPasswordScreen } from "./features/auth/ResetPasswordScreen";
import { DashboardScreen } from "./features/super-admin/DashboardScreen";
import { DynamicDashboardScreen } from "./features/employee/DynamicDashboardScreen";
import { AnnouncementsScreen } from "./features/employee/AnnouncementsScreen";
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
import { BillingDashboardScreen } from "./features/company-admin/BillingDashboardScreen";
import { MyInvoicesScreen } from "./features/company-admin/MyInvoicesScreen";
import { MyPaymentsScreen } from "./features/company-admin/MyPaymentsScreen";

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

// Help & Support
import { HelpSupportScreen } from "./features/help/HelpSupportScreen";
import { TicketChatScreen } from "./features/support/TicketChatScreen";

// Super-admin Support
import { SupportDashboardScreen } from "./features/super-admin/support/SupportDashboardScreen";
import { SupportTicketDetailScreen } from "./features/super-admin/support/SupportTicketDetailScreen";

// HR Self-Service Screens
import { MyProfileScreen } from "./features/company-admin/hr/MyProfileScreen";
import { MyPayslipsScreen } from "./features/company-admin/hr/MyPayslipsScreen";
import { MyLeaveScreen } from "./features/company-admin/hr/MyLeaveScreen";
import { MyAttendanceScreen } from "./features/company-admin/hr/MyAttendanceScreen";
import { TeamViewScreen } from "./features/company-admin/hr/TeamViewScreen";
import { ShiftCheckInScreen } from "./features/company-admin/hr/ShiftCheckInScreen";

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

// HR Additional Screens
import { OnboardingScreen } from "./features/company-admin/hr/OnboardingScreen";
import { ProbationReviewScreen } from "./features/company-admin/hr/ProbationReviewScreen";
import { OrgChartScreen } from "./features/company-admin/hr/OrgChartScreen";
import { Form16Screen } from "./features/company-admin/hr/Form16Screen";
import { ChatbotScreen } from "./features/company-admin/hr/ChatbotScreen";
import { BonusBatchScreen } from "./features/company-admin/hr/BonusBatchScreen";
import { ESignScreen } from "./features/company-admin/hr/ESignScreen";
import { DataRetentionScreen } from "./features/company-admin/hr/DataRetentionScreen";
import { BiometricDeviceScreen } from "./features/company-admin/hr/BiometricDeviceScreen";
import { ShiftRotationScreen } from "./features/company-admin/hr/ShiftRotationScreen";
import { ProductionIncentiveScreen } from "./features/company-admin/hr/ProductionIncentiveScreen";
import { TravelAdvanceScreen } from "./features/company-admin/hr/TravelAdvanceScreen";

// HR Analytics Dashboard Screens
import { ExecutiveDashboardScreen as ExecAnalyticsScreen } from './features/company-admin/hr/analytics/ExecutiveDashboardScreen';
import { WorkforceDashboardScreen } from './features/company-admin/hr/analytics/WorkforceDashboardScreen';
import { AttendanceAnalyticsDashboardScreen } from './features/company-admin/hr/analytics/AttendanceAnalyticsDashboardScreen';
import { LeaveAnalyticsDashboardScreen } from './features/company-admin/hr/analytics/LeaveAnalyticsDashboardScreen';
import { PayrollAnalyticsDashboardScreen } from './features/company-admin/hr/analytics/PayrollAnalyticsDashboardScreen';
import { ComplianceDashboardScreen } from './features/company-admin/hr/analytics/ComplianceDashboardScreen';
import { PerformanceAnalyticsDashboardScreen } from './features/company-admin/hr/analytics/PerformanceAnalyticsDashboardScreen';
import { RecruitmentDashboardScreen } from './features/company-admin/hr/analytics/RecruitmentDashboardScreen';
import { AttritionDashboardScreen } from './features/company-admin/hr/analytics/AttritionDashboardScreen';
import { ReportsHubScreen } from './features/company-admin/hr/analytics/ReportsHubScreen';

// ESS Self-Service Screens (Employee)
import { MyGoalsScreen } from './features/ess/MyGoalsScreen';
import { MyForm16Screen } from './features/ess/MyForm16Screen';
import { MyGrievancesScreen } from './features/ess/MyGrievancesScreen';
import { MyTrainingScreen } from './features/ess/MyTrainingScreen';
import { MyAssetsScreen } from './features/ess/MyAssetsScreen';
import { ShiftSwapScreen } from './features/ess/ShiftSwapScreen';
import { WfhRequestScreen } from './features/ess/WfhRequestScreen';
import { MyDocumentsScreen } from './features/ess/MyDocumentsScreen';
import { PolicyDocumentsScreen } from './features/ess/PolicyDocumentsScreen';
import { MyHolidaysScreen } from './features/ess/MyHolidaysScreen';
import { MyExpenseClaimsScreen } from './features/ess/MyExpenseClaimsScreen';
import { MyLoanScreen } from './features/ess/MyLoanScreen';

// Operations Module Screens
import { InventoryScreen } from "./features/inventory/InventoryScreen";
import { ProductionScreen } from "./features/production/ProductionScreen";
import { MaintenanceScreen } from "./features/maintenance/MaintenanceScreen";
import { WorkOrdersScreen } from "./features/maintenance/WorkOrdersScreen";
import { MachineRegistryScreen } from "./features/maintenance/MachineRegistryScreen";

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

// Permission Guard — renders NoPermissionScreen if user lacks the required permission
const RequirePermission = ({ children, permission }: { children: React.ReactNode; permission: string | string[] }) => {
  const permissions = useAuthStore((s) => s.permissions) || [];
  const required = Array.isArray(permission) ? permission : [permission];
  const hasAccess = required.some(p => checkPermission(permissions, p));
  if (!hasAccess) {
    return <NoPermissionScreen />;
  }
  return <>{children}</>;
};

function RoleBasedDashboard() {
  const userRole = useAuthStore((s) => s.userRole);

  if (userRole === 'super-admin') return <DashboardScreen />;

  // All other roles (Company Admin, employees, managers) use the dynamic dashboard
  // which adapts its widgets based on permissions and role
  return <DynamicDashboardScreen />;
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
        <Route path="dashboard" element={<RequirePermission permission={['hr:read', 'ess:view-dashboard', 'ess:view-profile']}><RoleBasedDashboard /></RequirePermission>} />
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
        <Route path="support" element={<RequireRole roles={['super-admin']}><SupportDashboardScreen /></RequireRole>} />
        <Route path="support/ticket/:id" element={<RequireRole roles={['super-admin']}><SupportTicketDetailScreen /></RequireRole>} />
        {/* Company-admin-only routes */}
        <Route path="company/profile" element={<RequirePermission permission="company:read"><CompanyProfileScreen /></RequirePermission>} />
        <Route path="company/locations" element={<RequirePermission permission="company:read"><LocationManagementScreen /></RequirePermission>} />
        <Route path="company/shifts" element={<RequirePermission permission="company:read"><ShiftManagementScreen /></RequirePermission>} />
        <Route path="company/contacts" element={<RequirePermission permission="company:read"><ContactManagementScreen /></RequirePermission>} />
        <Route path="company/no-series" element={<RequirePermission permission="company:read"><NoSeriesManagementScreen /></RequirePermission>} />
        <Route path="company/iot-reasons" element={<RequirePermission permission="company:read"><IOTReasonManagementScreen /></RequirePermission>} />
        <Route path="company/controls" element={<RequirePermission permission="company:configure"><SystemControlsScreen /></RequirePermission>} />
        <Route path="company/settings" element={<RequirePermission permission="company:read"><CompanySettingsScreen /></RequirePermission>} />
        <Route path="company/users" element={<RequirePermission permission="user:read"><UserManagementScreen /></RequirePermission>} />
        <Route path="company/roles" element={<RequirePermission permission="role:read"><RoleManagementScreen /></RequirePermission>} />
        {/* Company-admin Billing routes */}
        <Route path="company/billing" element={<RequireRole roles={['company-admin']}><BillingDashboardScreen /></RequireRole>} />
        <Route path="company/billing/invoices" element={<RequireRole roles={['company-admin']}><MyInvoicesScreen /></RequireRole>} />
        <Route path="company/billing/payments" element={<RequireRole roles={['company-admin']}><MyPaymentsScreen /></RequireRole>} />
        {/* Company-admin HR routes */}
        <Route path="company/hr/departments" element={<RequirePermission permission="hr:read"><DepartmentScreen /></RequirePermission>} />
        <Route path="company/hr/designations" element={<RequirePermission permission="hr:read"><DesignationScreen /></RequirePermission>} />
        <Route path="company/hr/grades" element={<RequirePermission permission="hr:read"><GradeScreen /></RequirePermission>} />
        <Route path="company/hr/employee-types" element={<RequirePermission permission="hr:read"><EmployeeTypeScreen /></RequirePermission>} />
        <Route path="company/hr/cost-centres" element={<RequirePermission permission="hr:read"><CostCentreScreen /></RequirePermission>} />
        <Route path="company/hr/employees" element={<RequirePermission permission={['hr:read', 'ess:view-directory']}><EmployeeDirectoryScreen /></RequirePermission>} />
        <Route path="company/hr/employees/:id" element={<RequirePermission permission={['hr:read', 'ess:view-profile']}><EmployeeProfileScreen /></RequirePermission>} />
        {/* Company-admin Attendance routes */}
        <Route path="company/hr/attendance" element={<RequirePermission permission="hr:read"><AttendanceDashboardScreen /></RequirePermission>} />
        <Route path="company/hr/holidays" element={<RequirePermission permission={['hr:read', 'ess:view-holidays']}><HolidayScreen /></RequirePermission>} />
        <Route path="company/hr/rosters" element={<RequirePermission permission="hr:read"><RosterScreen /></RequirePermission>} />
        <Route path="company/hr/attendance-rules" element={<RequirePermission permission="hr:read"><AttendanceRulesScreen /></RequirePermission>} />
        <Route path="company/hr/attendance-overrides" element={<RequirePermission permission="hr:read"><AttendanceOverrideScreen /></RequirePermission>} />
        <Route path="company/hr/overtime-rules" element={<RequirePermission permission="hr:read"><OvertimeRulesScreen /></RequirePermission>} />
        {/* Company-admin Leave Management routes */}
        <Route path="company/hr/leave-types" element={<RequirePermission permission={['hr:read', 'ess:view-leave']}><LeaveTypeScreen /></RequirePermission>} />
        <Route path="company/hr/leave-policies" element={<RequirePermission permission="hr:read"><LeavePolicyScreen /></RequirePermission>} />
        <Route path="company/hr/leave-requests" element={<RequirePermission permission={['hr:read', 'ess:apply-leave']}><LeaveRequestScreen /></RequirePermission>} />
        <Route path="company/hr/leave-balances" element={<RequirePermission permission={['hr:read', 'ess:view-leave']}><LeaveBalanceScreen /></RequirePermission>} />
        {/* Company-admin Payroll & Compliance routes */}
        <Route path="company/hr/salary-components" element={<RequirePermission permission="hr:read"><SalaryComponentScreen /></RequirePermission>} />
        <Route path="company/hr/salary-structures" element={<RequirePermission permission="hr:read"><SalaryStructureScreen /></RequirePermission>} />
        <Route path="company/hr/employee-salary" element={<RequirePermission permission="hr:read"><EmployeeSalaryScreen /></RequirePermission>} />
        <Route path="company/hr/statutory-config" element={<RequirePermission permission="hr:configure"><StatutoryConfigScreen /></RequirePermission>} />
        <Route path="company/hr/tax-config" element={<RequirePermission permission="hr:configure"><TaxConfigScreen /></RequirePermission>} />
        <Route path="company/hr/bank-config" element={<RequirePermission permission="hr:configure"><BankConfigScreen /></RequirePermission>} />
        <Route path="company/hr/loan-policies" element={<RequirePermission permission="hr:read"><LoanPolicyScreen /></RequirePermission>} />
        <Route path="company/hr/loans" element={<RequirePermission permission="hr:read"><LoanScreen /></RequirePermission>} />
        {/* Company-admin Payroll Operations routes */}
        <Route path="company/hr/payroll-runs" element={<RequirePermission permission="hr:read"><PayrollRunScreen /></RequirePermission>} />
        <Route path="company/hr/payslips" element={<RequirePermission permission="hr:read"><PayslipScreen /></RequirePermission>} />
        <Route path="company/hr/salary-holds" element={<RequirePermission permission="hr:read"><SalaryHoldScreen /></RequirePermission>} />
        <Route path="company/hr/salary-revisions" element={<RequirePermission permission="hr:read"><SalaryRevisionScreen /></RequirePermission>} />
        <Route path="company/hr/statutory-filings" element={<RequirePermission permission="hr:read"><StatutoryFilingScreen /></RequirePermission>} />
        <Route path="company/hr/payroll-reports" element={<RequirePermission permission="hr:read"><PayrollReportScreen /></RequirePermission>} />
        {/* Company-admin ESS & Workflow routes */}
        <Route path="company/hr/ess-config" element={<RequirePermission permission="hr:configure"><EssConfigScreen /></RequirePermission>} />
        <Route path="company/hr/approval-workflows" element={<RequirePermission permission="hr:configure"><ApprovalWorkflowScreen /></RequirePermission>} />
        <Route path="company/hr/approval-requests" element={<RequirePermission permission="hr:read"><ApprovalRequestScreen /></RequirePermission>} />
        <Route path="company/hr/notification-templates" element={<RequirePermission permission="hr:configure"><NotificationTemplateScreen /></RequirePermission>} />
        <Route path="company/hr/notification-rules" element={<RequirePermission permission="hr:configure"><NotificationRuleScreen /></RequirePermission>} />
        <Route path="company/hr/it-declarations" element={<RequirePermission permission={['hr:read', 'ess:it-declaration']}><ITDeclarationScreen /></RequirePermission>} />
        {/* Self-Service routes (accessible to all users with ESS permissions) */}
        <Route path="company/hr/my-profile" element={<RequirePermission permission="ess:view-profile"><MyProfileScreen /></RequirePermission>} />
        <Route path="company/hr/my-payslips" element={<RequirePermission permission="ess:view-payslips"><MyPayslipsScreen /></RequirePermission>} />
        <Route path="company/hr/my-leave" element={<RequirePermission permission="ess:view-leave"><MyLeaveScreen /></RequirePermission>} />
        <Route path="company/hr/my-attendance" element={<RequirePermission permission="ess:view-attendance"><MyAttendanceScreen /></RequirePermission>} />
        <Route path="company/hr/shift-check-in" element={<RequirePermission permission="ess:view-attendance"><ShiftCheckInScreen /></RequirePermission>} />
        <Route path="company/hr/team-view" element={<RequirePermission permission="hr:read"><TeamViewScreen /></RequirePermission>} />
        <Route path="company/hr/my-goals" element={<RequirePermission permission="ess:view-goals"><MyGoalsScreen /></RequirePermission>} />
        <Route path="company/hr/my-form16" element={<RequirePermission permission="ess:download-form16"><MyForm16Screen /></RequirePermission>} />
        <Route path="company/hr/my-grievances" element={<RequirePermission permission={['hr:read', 'ess:raise-grievance']}><MyGrievancesScreen /></RequirePermission>} />
        <Route path="company/hr/my-training" element={<RequirePermission permission={['hr:read', 'ess:enroll-training']}><MyTrainingScreen /></RequirePermission>} />
        <Route path="company/hr/my-assets" element={<RequirePermission permission={['hr:read', 'ess:view-assets']}><MyAssetsScreen /></RequirePermission>} />
        <Route path="company/hr/shift-swap" element={<RequirePermission permission={['hr:read', 'ess:swap-shift']}><ShiftSwapScreen /></RequirePermission>} />
        <Route path="company/hr/wfh-requests" element={<RequirePermission permission="ess:request-wfh"><WfhRequestScreen /></RequirePermission>} />
        <Route path="company/hr/my-documents" element={<RequirePermission permission="ess:upload-document"><MyDocumentsScreen /></RequirePermission>} />
        <Route path="company/hr/policy-documents" element={<RequirePermission permission="ess:view-policies"><PolicyDocumentsScreen /></RequirePermission>} />
        <Route path="company/hr/my-holidays" element={<RequirePermission permission="ess:view-holidays"><MyHolidaysScreen /></RequirePermission>} />
        <Route path="company/hr/my-expense-claims" element={<RequirePermission permission={['hr:read', 'ess:claim-expense']}><MyExpenseClaimsScreen /></RequirePermission>} />
        <Route path="company/hr/my-loans" element={<RequirePermission permission={['hr:read', 'ess:apply-loan']}><MyLoanScreen /></RequirePermission>} />
        {/* Company-admin Recruitment & Training routes */}
        <Route path="company/hr/requisitions" element={<RequirePermission permission="hr:read"><RequisitionScreen /></RequirePermission>} />
        <Route path="company/hr/candidates" element={<RequirePermission permission="hr:read"><CandidateScreen /></RequirePermission>} />
        <Route path="company/hr/training" element={<RequirePermission permission="hr:read"><TrainingCatalogueScreen /></RequirePermission>} />
        <Route path="company/hr/training-nominations" element={<RequirePermission permission="hr:read"><TrainingNominationScreen /></RequirePermission>} />
        {/* Company-admin Exit & Separation routes */}
        <Route path="company/hr/exit-requests" element={<RequirePermission permission="hr:read"><ExitRequestScreen /></RequirePermission>} />
        <Route path="company/hr/clearance-dashboard" element={<RequirePermission permission="hr:read"><ClearanceDashboardScreen /></RequirePermission>} />
        <Route path="company/hr/fnf-settlement" element={<RequirePermission permission="hr:read"><FnFSettlementScreen /></RequirePermission>} />
        {/* Company-admin Advanced HR routes */}
        <Route path="company/hr/assets" element={<RequirePermission permission="hr:read"><AssetManagementScreen /></RequirePermission>} />
        <Route path="company/hr/expenses" element={<RequirePermission permission="hr:read"><ExpenseClaimScreen /></RequirePermission>} />
        <Route path="company/hr/hr-letters" element={<RequirePermission permission="hr:read"><HRLetterScreen /></RequirePermission>} />
        <Route path="company/hr/grievances" element={<RequirePermission permission="hr:read"><GrievanceScreen /></RequirePermission>} />
        <Route path="company/hr/disciplinary" element={<RequirePermission permission={['hr:read', 'ess:view-disciplinary']}><DisciplinaryScreen /></RequirePermission>} />
        {/* Company-admin Transfer, Promotion & Delegation routes */}
        <Route path="company/hr/transfers" element={<RequirePermission permission="hr:read"><TransferScreen /></RequirePermission>} />
        <Route path="company/hr/promotions" element={<RequirePermission permission="hr:read"><PromotionScreen /></RequirePermission>} />
        <Route path="company/hr/delegates" element={<RequirePermission permission="hr:read"><DelegateScreen /></RequirePermission>} />
        {/* Company-admin Performance Management routes */}
        <Route path="company/hr/appraisal-cycles" element={<RequirePermission permission="hr:read"><AppraisalCycleScreen /></RequirePermission>} />
        <Route path="company/hr/goals" element={<RequirePermission permission={['hr:read', 'ess:view-goals']}><GoalScreen /></RequirePermission>} />
        <Route path="company/hr/feedback-360" element={<RequirePermission permission={['hr:read', 'ess:submit-feedback']}><Feedback360Screen /></RequirePermission>} />
        <Route path="company/hr/ratings" element={<RequirePermission permission={['hr:read', 'ess:submit-appraisal']}><RatingsScreen /></RequirePermission>} />
        <Route path="company/hr/skills" element={<RequirePermission permission="hr:read"><SkillScreen /></RequirePermission>} />
        <Route path="company/hr/succession" element={<RequirePermission permission="hr:read"><SuccessionScreen /></RequirePermission>} />
        <Route path="company/hr/performance-dashboard" element={<RequirePermission permission="hr:read"><PerformanceDashboardScreen /></RequirePermission>} />
        {/* Company-admin Additional HR routes */}
        <Route path="company/hr/onboarding" element={<RequirePermission permission="hr:read"><OnboardingScreen /></RequirePermission>} />
        <Route path="company/hr/probation-reviews" element={<RequirePermission permission="hr:read"><ProbationReviewScreen /></RequirePermission>} />
        <Route path="company/hr/org-chart" element={<RequirePermission permission={['hr:read', 'ess:view-org-chart']}><OrgChartScreen /></RequirePermission>} />
        <Route path="company/hr/form-16" element={<RequirePermission permission="hr:read"><Form16Screen /></RequirePermission>} />
        <Route path="company/hr/chatbot" element={<RequirePermission permission={['hr:read', 'ess:view-profile']}><ChatbotScreen /></RequirePermission>} />
        <Route path="company/hr/bonus-batches" element={<RequirePermission permission="hr:read"><BonusBatchScreen /></RequirePermission>} />
        <Route path="company/hr/esign" element={<RequirePermission permission={['hr:read', 'ess:view-esign']}><ESignScreen /></RequirePermission>} />
        <Route path="company/hr/data-retention" element={<RequirePermission permission="hr:read"><DataRetentionScreen /></RequirePermission>} />
        <Route path="company/hr/biometric-devices" element={<RequirePermission permission="hr:read"><BiometricDeviceScreen /></RequirePermission>} />
        <Route path="company/hr/shift-rotations" element={<RequirePermission permission="hr:read"><ShiftRotationScreen /></RequirePermission>} />
        <Route path="company/hr/production-incentives" element={<RequirePermission permission="hr:read"><ProductionIncentiveScreen /></RequirePermission>} />
        <Route path="company/hr/travel-advances" element={<RequirePermission permission="hr:read"><TravelAdvanceScreen /></RequirePermission>} />
        {/* HR Analytics Dashboard routes */}
        <Route path="company/hr/analytics/reports" element={<RequirePermission permission="hr:read"><ReportsHubScreen /></RequirePermission>} />
        <Route path="company/hr/analytics" element={<RequirePermission permission="hr:read"><ExecAnalyticsScreen /></RequirePermission>} />
        <Route path="company/hr/analytics/executive" element={<RequirePermission permission="hr:read"><ExecAnalyticsScreen /></RequirePermission>} />
        <Route path="company/hr/analytics/workforce" element={<RequirePermission permission="hr:read"><WorkforceDashboardScreen /></RequirePermission>} />
        <Route path="company/hr/analytics/attendance" element={<RequirePermission permission="hr:read"><AttendanceAnalyticsDashboardScreen /></RequirePermission>} />
        <Route path="company/hr/analytics/leave" element={<RequirePermission permission="hr:read"><LeaveAnalyticsDashboardScreen /></RequirePermission>} />
        <Route path="company/hr/analytics/payroll" element={<RequirePermission permission="hr:read"><PayrollAnalyticsDashboardScreen /></RequirePermission>} />
        <Route path="company/hr/analytics/compliance" element={<RequirePermission permission="hr:read"><ComplianceDashboardScreen /></RequirePermission>} />
        <Route path="company/hr/analytics/performance" element={<RequirePermission permission="hr:read"><PerformanceAnalyticsDashboardScreen /></RequirePermission>} />
        <Route path="company/hr/analytics/recruitment" element={<RequirePermission permission="hr:read"><RecruitmentDashboardScreen /></RequirePermission>} />
        <Route path="company/hr/analytics/attrition" element={<RequirePermission permission="hr:read"><AttritionDashboardScreen /></RequirePermission>} />
        {/* Operations module routes */}
        <Route path="inventory" element={<RequireRole roles={['super-admin', 'company-admin']}><InventoryScreen /></RequireRole>} />
        <Route path="production" element={<RequireRole roles={['super-admin', 'company-admin']}><ProductionScreen /></RequireRole>} />
        <Route path="maintenance" element={<RequireRole roles={['super-admin', 'company-admin']}><MaintenanceScreen /></RequireRole>} />
        <Route path="maintenance/orders" element={<RequireRole roles={['super-admin', 'company-admin']}><WorkOrdersScreen /></RequireRole>} />
        <Route path="maintenance/machines" element={<RequireRole roles={['super-admin', 'company-admin']}><MachineRegistryScreen /></RequireRole>} />
        {/* Super-admin + company-admin routes */}
        <Route path="modules" element={<RequireRole roles={['super-admin', 'company-admin']}><ModuleCatalogueScreen /></RequireRole>} />
        <Route path="monitor" element={<RequireRole roles={['super-admin', 'company-admin']}><PlatformMonitorScreen /></RequireRole>} />
        {/* All authenticated users */}
        <Route path="announcements" element={<AnnouncementsScreen />} />
        <Route path="help/ticket/:id" element={<TicketChatScreen />} />
        <Route path="help" element={<HelpSupportScreen />} />
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
