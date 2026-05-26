/**
 * All maintenance module routes.
 * Each module defines its own routes file.
 */
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
  pmScheduleNew: '/app/maintenance/pm-schedules/new',
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
