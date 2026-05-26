/**
 * Test data constants for E2E tests.
 * Update these if your test environment has different seed data.
 */

export const TEST_CREDENTIALS = {
  companyAdmin: {
    email: process.env.E2E_USER_EMAIL || 'admin@test.com',
    password: process.env.E2E_USER_PASSWORD || 'Test@123',
  },
};

export const WO_TYPES = ['PM', 'CORRECTIVE', 'BREAKDOWN', 'INSPECTION', 'OVERHAUL', 'SHUTDOWN', 'VENDOR_SERVICE', 'CALIBRATION'] as const;
export const WO_PRIORITIES = ['EMERGENCY', 'HIGH', 'MEDIUM', 'LOW'] as const;
export const WO_STATUSES = ['DRAFT', 'PLANNED', 'APPROVED', 'ASSIGNED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'AWAITING_QA', 'CLOSED', 'REJECTED', 'CANCELLED'] as const;
export const WR_TYPES = ['BREAKDOWN', 'PLANNED_SERVICE', 'INSPECTION', 'REPLACEMENT', 'SAFETY', 'OTHER'] as const;
export const WR_STATUSES = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'CONVERTED', 'REJECTED', 'CANCELLED'] as const;

export const MAINTENANCE_ROUTES = {
  dashboard: '/app/maintenance/dashboard',
  assets: '/app/maintenance/assets',
  assetDetail: (id: string) => `/app/maintenance/assets/${id}`,
  workRequests: '/app/maintenance/work-requests',
  workRequestNew: '/app/maintenance/work-requests/new',
  workRequestDetail: (id: string) => `/app/maintenance/work-requests/${id}`,
  workOrders: '/app/maintenance/work-orders',
  workOrderNew: '/app/maintenance/work-orders/new',
  workOrderDetail: (id: string) => `/app/maintenance/work-orders/${id}`,
  workOrderBoard: '/app/maintenance/work-orders/board',
  pmSchedules: '/app/maintenance/pm-schedules',
  pmCalendar: '/app/maintenance/pm-calendar',
  breakdowns: '/app/maintenance/breakdowns',
  breakdownLog: '/app/maintenance/breakdowns/log',
  downtime: '/app/maintenance/downtime',
  contracts: '/app/maintenance/contracts',
  ptw: '/app/maintenance/ptw',
  shutdown: '/app/maintenance/shutdown',
  analytics: '/app/maintenance/analytics',
  reliability: '/app/maintenance/reliability',
  reports: '/app/maintenance/reports',
  configFailureCodes: '/app/maintenance/config/failure-codes',
  configStrategies: '/app/maintenance/config/strategies',
  configJobPlans: '/app/maintenance/config/job-plans',
  configChecklists: '/app/maintenance/config/checklists',
  config: '/app/maintenance/config',
};
