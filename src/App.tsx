import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from 'sonner';
import { AuthLayout } from "./layouts/AuthLayout";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { useAuthStore } from "./store/useAuthStore";
import type { UserRole } from "./store/useAuthStore";
import { checkPermission } from "./lib/api/auth";
import { NoPermissionScreen } from "./features/shared/NoPermissionScreen";
import { getTenantContext, getLoginPath } from "@/lib/tenant";
import { useTenantBranding } from "@/lib/api/auth";

// ─── Suspense Fallback ───
const PageLoader = () => (
  <div className="flex h-full min-h-[60vh] items-center justify-center">
    <div className="w-7 h-7 rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin" />
  </div>
);

// ─── Helper: named-export lazy wrapper ───
// React.lazy expects default export, so we re-export named exports as default
const lazyNamed = <T extends React.ComponentType<Record<string, unknown>>>(
  factory: () => Promise<{ [key: string]: T }>,
  name: string,
) => lazy(() => factory().then((m) => ({ default: (m as Record<string, T>)[name] })));

// ─── Auth Screens (lazy) ───
const ProductShowcaseScreen = lazyNamed(() => import("./features/auth/ProductShowcaseScreen"), "ProductShowcaseScreen");
const LandingScreen = lazyNamed(() => import("./features/auth/LandingScreen"), "LandingScreen");
const LoginScreen = lazyNamed(() => import("./features/auth/LoginScreen"), "LoginScreen");
const ForgotPasswordScreen = lazyNamed(() => import("./features/auth/ForgotPasswordScreen"), "ForgotPasswordScreen");
const VerifyResetCodeScreen = lazyNamed(() => import("./features/auth/VerifyResetCodeScreen"), "VerifyResetCodeScreen");
const ResetPasswordScreen = lazyNamed(() => import("./features/auth/ResetPasswordScreen"), "ResetPasswordScreen");
const MfaVerifyScreen = lazyNamed(() => import("./features/auth/MfaVerifyScreen"), "MfaVerifyScreen");
const MfaSetupScreen = lazyNamed(() => import("./features/auth/MfaSetupScreen"), "MfaSetupScreen");
const RegisterCompanyScreen = lazyNamed(() => import("@/features/auth/RegisterCompanyScreen"), "RegisterCompanyScreen");
const TenantNotFoundScreen = lazyNamed(() => import("@/features/auth/TenantNotFoundScreen"), "TenantNotFoundScreen");

// ─── Super Admin Screens ───
const DashboardScreen = lazyNamed(() => import("./features/super-admin/DashboardScreen"), "DashboardScreen");
const CompanyListScreen = lazyNamed(() => import("./features/super-admin/CompanyListScreen"), "CompanyListScreen");
const CompanyDetailScreen = lazyNamed(() => import("./features/super-admin/CompanyDetailScreen"), "CompanyDetailScreen");
const AddCompanyWizard = lazyNamed(() => import("./features/super-admin/AddCompanyWizard"), "AddCompanyWizard");
const RegistrationListScreen = lazyNamed(() => import("./features/super-admin/RegistrationListScreen"), "RegistrationListScreen");
const RegistrationDetailScreen = lazyNamed(() => import("./features/super-admin/RegistrationDetailScreen"), "RegistrationDetailScreen");
const BillingOverviewScreen = lazyNamed(() => import("./features/super-admin/BillingOverviewScreen"), "BillingOverviewScreen");
const PlatformMonitorScreen = lazyNamed(() => import("./features/super-admin/PlatformMonitorScreen"), "PlatformMonitorScreen");
const ModuleCatalogueScreen = lazyNamed(() => import("./features/super-admin/ModuleCatalogueScreen"), "ModuleCatalogueScreen");
const ModuleAssignmentScreen = lazyNamed(() => import("./features/super-admin/ModuleAssignmentScreen"), "ModuleAssignmentScreen");
const AuditLogScreen = lazyNamed(() => import("./features/super-admin/AuditLogScreen"), "AuditLogScreen");
const PaymentHistoryScreen = lazyNamed(() => import("./features/super-admin/PaymentHistoryScreen"), "PaymentHistoryScreen");
const InvoiceListScreen = lazyNamed(() => import("./features/super-admin/InvoiceListScreen"), "InvoiceListScreen");
const InvoiceDetailScreen = lazyNamed(() => import("./features/super-admin/InvoiceDetailScreen"), "InvoiceDetailScreen");
const SubscriptionDetailScreen = lazyNamed(() => import("./features/super-admin/SubscriptionDetailScreen"), "SubscriptionDetailScreen");

// ─── Super Admin Support ───
const SupportDashboardScreen = lazyNamed(() => import("./features/super-admin/support/SupportDashboardScreen"), "SupportDashboardScreen");
const SupportTicketDetailScreen = lazyNamed(() => import("./features/super-admin/support/SupportTicketDetailScreen"), "SupportTicketDetailScreen");
const AdminAttendanceScreen = lazyNamed(() => import("./features/company-admin/hr/AdminAttendanceScreen"), "AdminAttendanceScreen");

// ─── Employee Screens ───
const DynamicDashboardScreen = lazyNamed(() => import("./features/employee/DynamicDashboardScreen"), "DynamicDashboardScreen");
const AnnouncementsScreen = lazyNamed(() => import("./features/employee/AnnouncementsScreen"), "AnnouncementsScreen");

// ─── Company Admin Screens ───
const CompanyProfileScreen = lazyNamed(() => import("./features/company-admin/CompanyProfileScreen"), "CompanyProfileScreen");
const LocationManagementScreen = lazyNamed(() => import("./features/company-admin/LocationManagementScreen"), "LocationManagementScreen");
const ShiftManagementScreen = lazyNamed(() => import("./features/company-admin/ShiftManagementScreen"), "ShiftManagementScreen");
const ContactManagementScreen = lazyNamed(() => import("./features/company-admin/ContactManagementScreen"), "ContactManagementScreen");
const NoSeriesManagementScreen = lazyNamed(() => import("./features/company-admin/NoSeriesManagementScreen"), "NoSeriesManagementScreen");
const IOTReasonManagementScreen = lazyNamed(() => import("./features/company-admin/IOTReasonManagementScreen"), "IOTReasonManagementScreen");
const SystemControlsScreen = lazyNamed(() => import("./features/company-admin/SystemControlsScreen"), "SystemControlsScreen");
const CompanySettingsScreen = lazyNamed(() => import("./features/company-admin/CompanySettingsScreen"), "CompanySettingsScreen");
const UserManagementScreen = lazyNamed(() => import("./features/company-admin/UserManagementScreen"), "UserManagementScreen");
const RoleManagementScreen = lazyNamed(() => import("./features/company-admin/RoleManagementScreen"), "RoleManagementScreen");
const BillingDashboardScreen = lazyNamed(() => import("./features/company-admin/BillingDashboardScreen"), "BillingDashboardScreen");
const MyInvoicesScreen = lazyNamed(() => import("./features/company-admin/MyInvoicesScreen"), "MyInvoicesScreen");
const MyPaymentsScreen = lazyNamed(() => import("./features/company-admin/MyPaymentsScreen"), "MyPaymentsScreen");

// ─── HR Org Structure ───
const DepartmentScreen = lazyNamed(() => import("./features/company-admin/hr/DepartmentScreen"), "DepartmentScreen");
const DesignationScreen = lazyNamed(() => import("./features/company-admin/hr/DesignationScreen"), "DesignationScreen");
const GradeScreen = lazyNamed(() => import("./features/company-admin/hr/GradeScreen"), "GradeScreen");
const EmployeeTypeScreen = lazyNamed(() => import("./features/company-admin/hr/EmployeeTypeScreen"), "EmployeeTypeScreen");
const CostCentreScreen = lazyNamed(() => import("./features/company-admin/hr/CostCentreScreen"), "CostCentreScreen");
const EmployeeDirectoryScreen = lazyNamed(() => import("./features/company-admin/hr/EmployeeDirectoryScreen"), "EmployeeDirectoryScreen");
const EmployeeProfileScreen = lazyNamed(() => import("./features/company-admin/hr/EmployeeProfileScreen"), "EmployeeProfileScreen");

// ─── HR Leave Management ───
const LeaveTypeScreen = lazyNamed(() => import("./features/company-admin/hr/LeaveTypeScreen"), "LeaveTypeScreen");
const LeavePolicyScreen = lazyNamed(() => import("./features/company-admin/hr/LeavePolicyScreen"), "LeavePolicyScreen");
const LeaveRequestScreen = lazyNamed(() => import("./features/company-admin/hr/LeaveRequestScreen"), "LeaveRequestScreen");
const LeaveBalanceScreen = lazyNamed(() => import("./features/company-admin/hr/LeaveBalanceScreen"), "LeaveBalanceScreen");

// ─── HR Attendance ───
const AttendanceDashboardScreen = lazyNamed(() => import("./features/company-admin/hr/AttendanceDashboardScreen"), "AttendanceDashboardScreen");
const HolidayScreen = lazyNamed(() => import("./features/company-admin/hr/HolidayScreen"), "HolidayScreen");
const RosterScreen = lazyNamed(() => import("./features/company-admin/hr/RosterScreen"), "RosterScreen");
const AttendanceRulesScreen = lazyNamed(() => import("./features/company-admin/hr/AttendanceRulesScreen"), "AttendanceRulesScreen");
const AttendanceOverrideScreen = lazyNamed(() => import("./features/company-admin/hr/AttendanceOverrideScreen"), "AttendanceOverrideScreen");
const OvertimeRulesScreen = lazyNamed(() => import("./features/company-admin/hr/OvertimeRulesScreen"), "OvertimeRulesScreen");

// ─── HR Payroll & Compliance ───
const SalaryComponentScreen = lazyNamed(() => import("./features/company-admin/hr/SalaryComponentScreen"), "SalaryComponentScreen");
const SalaryStructureScreen = lazyNamed(() => import("./features/company-admin/hr/SalaryStructureScreen"), "SalaryStructureScreen");
const EmployeeSalaryScreen = lazyNamed(() => import("./features/company-admin/hr/EmployeeSalaryScreen"), "EmployeeSalaryScreen");
const StatutoryConfigScreen = lazyNamed(() => import("./features/company-admin/hr/StatutoryConfigScreen"), "StatutoryConfigScreen");
const TaxConfigScreen = lazyNamed(() => import("./features/company-admin/hr/TaxConfigScreen"), "TaxConfigScreen");
const BankConfigScreen = lazyNamed(() => import("./features/company-admin/hr/BankConfigScreen"), "BankConfigScreen");
const LoanPolicyScreen = lazyNamed(() => import("./features/company-admin/hr/LoanPolicyScreen"), "LoanPolicyScreen");
const LoanScreen = lazyNamed(() => import("./features/company-admin/hr/LoanScreen"), "LoanScreen");

// ─── HR Payroll Operations ───
const PayrollRunScreen = lazyNamed(() => import("./features/company-admin/hr/PayrollRunScreen"), "PayrollRunScreen");
const PayslipScreen = lazyNamed(() => import("./features/company-admin/hr/PayslipScreen"), "PayslipScreen");
const SalaryHoldScreen = lazyNamed(() => import("./features/company-admin/hr/SalaryHoldScreen"), "SalaryHoldScreen");
const SalaryRevisionScreen = lazyNamed(() => import("./features/company-admin/hr/SalaryRevisionScreen"), "SalaryRevisionScreen");
const StatutoryFilingScreen = lazyNamed(() => import("./features/company-admin/hr/StatutoryFilingScreen"), "StatutoryFilingScreen");
const PayrollReportScreen = lazyNamed(() => import("./features/company-admin/hr/PayrollReportScreen"), "PayrollReportScreen");

// ─── HR ESS & Workflow ───
const EssConfigScreen = lazyNamed(() => import("./features/company-admin/hr/EssConfigScreen"), "EssConfigScreen");
const ApprovalWorkflowScreen = lazyNamed(() => import("./features/company-admin/hr/ApprovalWorkflowScreen"), "ApprovalWorkflowScreen");
const ApprovalRequestScreen = lazyNamed(() => import("./features/company-admin/hr/ApprovalRequestScreen"), "ApprovalRequestScreen");
const NotificationTemplateScreen = lazyNamed(() => import("./features/company-admin/hr/NotificationTemplateScreen"), "NotificationTemplateScreen");
const NotificationRuleScreen = lazyNamed(() => import("./features/company-admin/hr/NotificationRuleScreen"), "NotificationRuleScreen");
const ITDeclarationScreen = lazyNamed(() => import("./features/company-admin/hr/ITDeclarationScreen"), "ITDeclarationScreen");

// ─── Notifications ───
const NotificationListScreen = lazyNamed(() => import("./features/notifications/NotificationListScreen"), "NotificationListScreen");
const NotificationPreferencesScreen = lazyNamed(() => import("./features/settings/NotificationPreferencesScreen"), "NotificationPreferencesScreen");

// ─── Help & Support ───
const HelpSupportScreen = lazyNamed(() => import("./features/help/HelpSupportScreen"), "HelpSupportScreen");
const TicketChatScreen = lazyNamed(() => import("./features/support/TicketChatScreen"), "TicketChatScreen");

// ─── HR Self-Service ───
const MyProfileScreen = lazyNamed(() => import("./features/company-admin/hr/MyProfileScreen"), "MyProfileScreen");
const MyPayslipsScreen = lazyNamed(() => import("./features/company-admin/hr/MyPayslipsScreen"), "MyPayslipsScreen");
const MyLeaveScreen = lazyNamed(() => import("./features/company-admin/hr/MyLeaveScreen"), "MyLeaveScreen");
const MyAttendanceScreen = lazyNamed(() => import("./features/company-admin/hr/MyAttendanceScreen"), "MyAttendanceScreen");
const TeamViewScreen = lazyNamed(() => import("./features/company-admin/hr/TeamViewScreen"), "TeamViewScreen");
const ShiftCheckInScreen = lazyNamed(() => import("./features/company-admin/hr/ShiftCheckInScreen"), "ShiftCheckInScreen");

// ─── HR Recruitment & Training ───
const RequisitionScreen = lazyNamed(() => import("./features/company-admin/hr/RequisitionScreen"), "RequisitionScreen");
const CandidateScreen = lazyNamed(() => import("./features/company-admin/hr/CandidateScreen"), "CandidateScreen");
const CandidateDetailScreen = lazyNamed(() => import("./features/company-admin/hr/CandidateDetailScreen"), "CandidateDetailScreen");
const TrainingCatalogueScreen = lazyNamed(() => import("./features/company-admin/hr/TrainingCatalogueScreen"), "TrainingCatalogueScreen");
const TrainingNominationScreen = lazyNamed(() => import("./features/company-admin/hr/TrainingNominationScreen"), "TrainingNominationScreen");

// ─── HR Exit & Separation ───
const ExitRequestScreen = lazyNamed(() => import("./features/company-admin/hr/ExitRequestScreen"), "ExitRequestScreen");
const ClearanceDashboardScreen = lazyNamed(() => import("./features/company-admin/hr/ClearanceDashboardScreen"), "ClearanceDashboardScreen");
const FnFSettlementScreen = lazyNamed(() => import("./features/company-admin/hr/FnFSettlementScreen"), "FnFSettlementScreen");

// ─── HR Advanced ───
const AssetManagementScreen = lazyNamed(() => import("./features/company-admin/hr/AssetManagementScreen"), "AssetManagementScreen");
const ExpenseClaimScreen = lazyNamed(() => import("./features/company-admin/hr/ExpenseClaimScreen"), "ExpenseClaimScreen");
const HRLetterScreen = lazyNamed(() => import("./features/company-admin/hr/HRLetterScreen"), "HRLetterScreen");
const GrievanceScreen = lazyNamed(() => import("./features/company-admin/hr/GrievanceScreen"), "GrievanceScreen");
const DisciplinaryScreen = lazyNamed(() => import("./features/company-admin/hr/DisciplinaryScreen"), "DisciplinaryScreen");

// ─── HR Transfer, Promotion & Delegation ───
const TransferScreen = lazyNamed(() => import("./features/company-admin/hr/TransferScreen"), "TransferScreen");
const PromotionScreen = lazyNamed(() => import("./features/company-admin/hr/PromotionScreen"), "PromotionScreen");
const DelegateScreen = lazyNamed(() => import("./features/company-admin/hr/DelegateScreen"), "DelegateScreen");

// ─── HR Performance Management ───
const AppraisalCycleScreen = lazyNamed(() => import("./features/company-admin/hr/AppraisalCycleScreen"), "AppraisalCycleScreen");
const GoalScreen = lazyNamed(() => import("./features/company-admin/hr/GoalScreen"), "GoalScreen");
const Feedback360Screen = lazyNamed(() => import("./features/company-admin/hr/Feedback360Screen"), "Feedback360Screen");
const RatingsScreen = lazyNamed(() => import("./features/company-admin/hr/RatingsScreen"), "RatingsScreen");
const SkillScreen = lazyNamed(() => import("./features/company-admin/hr/SkillScreen"), "SkillScreen");
const SuccessionScreen = lazyNamed(() => import("./features/company-admin/hr/SuccessionScreen"), "SuccessionScreen");
const PerformanceDashboardScreen = lazyNamed(() => import("./features/company-admin/hr/PerformanceDashboardScreen"), "PerformanceDashboardScreen");

// ─── HR Additional ───
const OnboardingScreen = lazyNamed(() => import("./features/company-admin/hr/OnboardingScreen"), "OnboardingScreen");
const ProbationReviewScreen = lazyNamed(() => import("./features/company-admin/hr/ProbationReviewScreen"), "ProbationReviewScreen");
const OrgChartScreen = lazyNamed(() => import("./features/company-admin/hr/OrgChartScreen"), "OrgChartScreen");
const Form16Screen = lazyNamed(() => import("./features/company-admin/hr/Form16Screen"), "Form16Screen");
const ChatbotScreen = lazyNamed(() => import("./features/company-admin/hr/ChatbotScreen"), "ChatbotScreen");
const BonusBatchScreen = lazyNamed(() => import("./features/company-admin/hr/BonusBatchScreen"), "BonusBatchScreen");
const ESignScreen = lazyNamed(() => import("./features/company-admin/hr/ESignScreen"), "ESignScreen");
const DataRetentionScreen = lazyNamed(() => import("./features/company-admin/hr/DataRetentionScreen"), "DataRetentionScreen");
const BiometricDeviceScreen = lazyNamed(() => import("./features/company-admin/hr/BiometricDeviceScreen"), "BiometricDeviceScreen");
const ShiftRotationScreen = lazyNamed(() => import("./features/company-admin/hr/ShiftRotationScreen"), "ShiftRotationScreen");
const ProductionIncentiveScreen = lazyNamed(() => import("./features/company-admin/hr/ProductionIncentiveScreen"), "ProductionIncentiveScreen");
const TravelAdvanceScreen = lazyNamed(() => import("./features/company-admin/hr/TravelAdvanceScreen"), "TravelAdvanceScreen");

// ─── HR Analytics Dashboards ───
const ExecAnalyticsScreen = lazyNamed(() => import("./features/company-admin/hr/analytics/ExecutiveDashboardScreen"), "ExecutiveDashboardScreen");
const WorkforceDashboardScreen = lazyNamed(() => import("./features/company-admin/hr/analytics/WorkforceDashboardScreen"), "WorkforceDashboardScreen");
const AttendanceAnalyticsDashboardScreen = lazyNamed(() => import("./features/company-admin/hr/analytics/AttendanceAnalyticsDashboardScreen"), "AttendanceAnalyticsDashboardScreen");
const LeaveAnalyticsDashboardScreen = lazyNamed(() => import("./features/company-admin/hr/analytics/LeaveAnalyticsDashboardScreen"), "LeaveAnalyticsDashboardScreen");
const PayrollAnalyticsDashboardScreen = lazyNamed(() => import("./features/company-admin/hr/analytics/PayrollAnalyticsDashboardScreen"), "PayrollAnalyticsDashboardScreen");
const ComplianceDashboardScreen = lazyNamed(() => import("./features/company-admin/hr/analytics/ComplianceDashboardScreen"), "ComplianceDashboardScreen");
const PerformanceAnalyticsDashboardScreen = lazyNamed(() => import("./features/company-admin/hr/analytics/PerformanceAnalyticsDashboardScreen"), "PerformanceAnalyticsDashboardScreen");
const RecruitmentDashboardScreen = lazyNamed(() => import("./features/company-admin/hr/analytics/RecruitmentDashboardScreen"), "RecruitmentDashboardScreen");
const AttritionDashboardScreen = lazyNamed(() => import("./features/company-admin/hr/analytics/AttritionDashboardScreen"), "AttritionDashboardScreen");
const TrainingDashboardScreen = lazyNamed(() => import("./features/company-admin/hr/analytics/TrainingDashboardScreen"), "TrainingDashboardScreen");
const ReportsHubScreen = lazyNamed(() => import("./features/company-admin/hr/analytics/ReportsHubScreen"), "ReportsHubScreen");

// ─── ESS Self-Service ───
const MyGoalsScreen = lazyNamed(() => import("./features/ess/MyGoalsScreen"), "MyGoalsScreen");
const MyForm16Screen = lazyNamed(() => import("./features/ess/MyForm16Screen"), "MyForm16Screen");
const MyGrievancesScreen = lazyNamed(() => import("./features/ess/MyGrievancesScreen"), "MyGrievancesScreen");
const MyTrainingScreen = lazyNamed(() => import("./features/ess/MyTrainingScreen"), "MyTrainingScreen");
const MyAssetsScreen = lazyNamed(() => import("./features/ess/MyAssetsScreen"), "MyAssetsScreen");
const ShiftSwapScreen = lazyNamed(() => import("./features/ess/ShiftSwapScreen"), "ShiftSwapScreen");
const WfhRequestScreen = lazyNamed(() => import("./features/ess/WfhRequestScreen"), "WfhRequestScreen");
const MyDocumentsScreen = lazyNamed(() => import("./features/ess/MyDocumentsScreen"), "MyDocumentsScreen");
const PolicyDocumentsScreen = lazyNamed(() => import("./features/ess/PolicyDocumentsScreen"), "PolicyDocumentsScreen");
const MyHolidaysScreen = lazyNamed(() => import("./features/ess/MyHolidaysScreen"), "MyHolidaysScreen");
const MyExpenseClaimsScreen = lazyNamed(() => import("./features/ess/MyExpenseClaimsScreen"), "MyExpenseClaimsScreen");
const MyLoanScreen = lazyNamed(() => import("./features/ess/MyLoanScreen"), "MyLoanScreen");
const MyAppraisalScreen = lazyNamed(() => import("./features/ess/MyAppraisalScreen"), "MyAppraisalScreen");

// ─── Operations Modules ───
const InventoryScreen = lazyNamed(() => import("./features/inventory/InventoryScreen"), "InventoryScreen");
const ProductionScreen = lazyNamed(() => import("./features/production/ProductionScreen"), "ProductionScreen");
const MaintenanceScreen = lazyNamed(() => import("./features/maintenance/MaintenanceScreen"), "MaintenanceScreen");
const WorkOrdersScreen = lazyNamed(() => import("./features/maintenance/WorkOrdersScreen"), "WorkOrdersScreen");
const MachineRegistryScreen = lazyNamed(() => import("./features/maintenance/MachineRegistryScreen"), "MachineRegistryScreen");

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
    return <Navigate to={getLoginPath()} replace />;
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
  const tenantContext = getTenantContext();
  const { data: branding, isLoading: brandingLoading } = useTenantBranding(tenantContext.slug);

  // Show 404 for invalid tenant subdomains
  if (tenantContext.mode === 'tenant' && !brandingLoading && branding && !branding.exists) {
    return <TenantNotFoundScreen />;
  }

  return (
    <>
    <Toaster position="top-right" richColors closeButton toastOptions={{ style: { fontFamily: 'Inter, system-ui, sans-serif' } }} />
    <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* Public Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/" element={
          tenantContext.mode === 'main' ? <LandingScreen /> : <Navigate to="/login" replace />
        } />
        <Route path="/product" element={
          tenantContext.mode === 'main' ? <ProductShowcaseScreen /> : <Navigate to="/login" replace />
        } />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
        <Route path="/reset-password/verify" element={<VerifyResetCodeScreen />} />
        <Route path="/reset-password/new" element={<ResetPasswordScreen />} />
        <Route path="/mfa-verify" element={<MfaVerifyScreen />} />
        <Route path="/mfa-setup" element={<MfaSetupScreen />} />
        {tenantContext.mode === 'main' && (
          <Route path="/register" element={<RegisterCompanyScreen />} />
        )}
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
        <Route path="registrations" element={<RequireRole roles={['super-admin']}><RegistrationListScreen /></RequireRole>} />
        <Route path="registrations/:id" element={<RequireRole roles={['super-admin']}><RegistrationDetailScreen /></RequireRole>} />
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
        <Route path="company/billing" element={<RequirePermission permission="billing:read"><BillingDashboardScreen /></RequirePermission>} />
        <Route path="company/billing/invoices" element={<RequirePermission permission="billing:read"><MyInvoicesScreen /></RequirePermission>} />
        <Route path="company/billing/payments" element={<RequirePermission permission="billing:read"><MyPaymentsScreen /></RequirePermission>} />
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
        <Route path="company/hr/admin-attendance" element={<RequirePermission permission="attendance:mark"><AdminAttendanceScreen /></RequirePermission>} />
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
        <Route path="company/hr/my-appraisal" element={<RequirePermission permission={['hr:read', 'ess:submit-appraisal']}><MyAppraisalScreen /></RequirePermission>} />
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
        <Route path="company/hr/candidates/:id" element={<RequirePermission permission="hr:read"><CandidateDetailScreen /></RequirePermission>} />
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
        <Route path="company/hr/analytics/reports" element={<RequirePermission permission="analytics:export"><ReportsHubScreen /></RequirePermission>} />
        <Route path="company/hr/analytics" element={<RequirePermission permission="analytics:read"><ExecAnalyticsScreen /></RequirePermission>} />
        <Route path="company/hr/analytics/executive" element={<RequirePermission permission="analytics:read"><ExecAnalyticsScreen /></RequirePermission>} />
        <Route path="company/hr/analytics/workforce" element={<RequirePermission permission="analytics:read"><WorkforceDashboardScreen /></RequirePermission>} />
        <Route path="company/hr/analytics/attendance" element={<RequirePermission permission="analytics:read"><AttendanceAnalyticsDashboardScreen /></RequirePermission>} />
        <Route path="company/hr/analytics/leave" element={<RequirePermission permission="analytics:read"><LeaveAnalyticsDashboardScreen /></RequirePermission>} />
        <Route path="company/hr/analytics/payroll" element={<RequirePermission permission="analytics:read"><PayrollAnalyticsDashboardScreen /></RequirePermission>} />
        <Route path="company/hr/analytics/compliance" element={<RequirePermission permission="analytics:read"><ComplianceDashboardScreen /></RequirePermission>} />
        <Route path="company/hr/analytics/performance" element={<RequirePermission permission="analytics:read"><PerformanceAnalyticsDashboardScreen /></RequirePermission>} />
        <Route path="company/hr/analytics/recruitment" element={<RequirePermission permission="analytics:read"><RecruitmentDashboardScreen /></RequirePermission>} />
        <Route path="company/hr/analytics/attrition" element={<RequirePermission permission="analytics:read"><AttritionDashboardScreen /></RequirePermission>} />
        <Route path="company/hr/analytics/training" element={<RequirePermission permission="analytics:read"><TrainingDashboardScreen /></RequirePermission>} />
        {/* Operations module routes */}
        <Route path="inventory" element={<RequireRole roles={['super-admin', 'company-admin']}><InventoryScreen /></RequireRole>} />
        <Route path="production" element={<RequireRole roles={['super-admin', 'company-admin']}><ProductionScreen /></RequireRole>} />
        <Route path="maintenance" element={<RequireRole roles={['super-admin', 'company-admin']}><MaintenanceScreen /></RequireRole>} />
        <Route path="maintenance/orders" element={<RequireRole roles={['super-admin', 'company-admin']}><WorkOrdersScreen /></RequireRole>} />
        <Route path="maintenance/machines" element={<RequireRole roles={['super-admin', 'company-admin']}><MachineRegistryScreen /></RequireRole>} />
        {/* Super-admin + company-admin routes */}
        <Route path="modules" element={<RequirePermission permission={['platform:admin', 'company:read']}><ModuleCatalogueScreen /></RequirePermission>} />
        <Route path="monitor" element={<RequirePermission permission={['platform:admin', 'company:read']}><PlatformMonitorScreen /></RequirePermission>} />
        {/* All authenticated users */}
        <Route path="announcements" element={<AnnouncementsScreen />} />
        <Route path="help/ticket/:id" element={<TicketChatScreen />} />
        <Route path="help" element={<HelpSupportScreen />} />
        <Route path="notifications" element={<NotificationListScreen />} />
        <Route path="settings/notifications" element={<NotificationPreferencesScreen />} />
        <Route path="settings" element={<Placeholder name="Settings" />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
    </>
  );
}

export default App;
