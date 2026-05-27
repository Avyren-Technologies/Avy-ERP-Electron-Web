/**
 * All inventory & warehouse management module routes.
 * Each module defines its own routes file.
 */
export const INVENTORY_ROUTES = {
  dashboard: '/app/inventory/dashboard',
  stockExplorer: '/app/inventory/stock',
  receive: '/app/inventory/receive',
  grn: '/app/inventory/grn',
  grnDetail: (id: string) => `/app/inventory/grn/${id}`,
  putAway: '/app/inventory/put-away',
  transfer: '/app/inventory/transfer',
  adjustments: '/app/inventory/adjustments',
  issue: '/app/inventory/issue',
  dispatch: '/app/inventory/dispatch',
  returns: '/app/inventory/returns',
  vendorReturns: '/app/inventory/returns/vendor',
  counts: '/app/inventory/counts',
  countsNew: '/app/inventory/counts/new',
  countDetail: (id: string) => `/app/inventory/counts/${id}`,
  approvals: '/app/inventory/approvals',
  reports: '/app/inventory/reports',
  config: '/app/inventory/config',
  configWarehouses: '/app/inventory/config/warehouses',
  configItemPolicies: '/app/inventory/config/item-policies',
  // Phase 2 — Production Integration
  productionIssue: '/app/inventory/production/issue',
  productionIssueDetail: (id: string) => `/app/inventory/production/issue/${id}`,
  fgReceipt: '/app/inventory/production/fg-receipt',
  materialReturn: '/app/inventory/production/material-return',
  productionScrap: '/app/inventory/production/scrap',
  woReconciliation: '/app/inventory/production/reconciliation',
  // Phase 3 — Warehouse Advanced
  putawayRules: '/app/inventory/warehouse/putaway-rules',
  pallets: '/app/inventory/warehouse/pallets',
  staging: '/app/inventory/warehouse/staging',
  // Phase 3 — Tool Room
  toolLifePolicies: '/app/inventory/tool-room/policies',
  toolIssue: '/app/inventory/tool-room/issue',
  toolReturn: '/app/inventory/tool-room/return',
  reconditioning: '/app/inventory/tool-room/reconditioning',
  toolReports: '/app/inventory/tool-room/reports',
  toolReportsAtMachine: '/app/inventory/tool-room/reports/at-machine',
  toolReportsConsumption: '/app/inventory/tool-room/reports/consumption',
  toolReportsReconditioning: '/app/inventory/tool-room/reports/reconditioning',
  toolReportsBreakage: '/app/inventory/tool-room/reports/breakage',
};
