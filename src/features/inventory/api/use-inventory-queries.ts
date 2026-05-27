import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from './inventory-api';
import { inventoryKeys } from './inventory-keys';

// ── Config ──

export function useInventoryConfig() {
    return useQuery({
        queryKey: inventoryKeys.config(),
        queryFn: () => inventoryApi.getConfig(),
    });
}

export function useOnboardingStatus() {
    return useQuery({
        queryKey: inventoryKeys.onboardingStatus(),
        queryFn: () => inventoryApi.getOnboardingStatus(),
    });
}

// ── Warehouses ──

export function useWarehouses(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: inventoryKeys.warehouses(params),
        queryFn: () => inventoryApi.listWarehouses(params as any),
    });
}

export function useWarehouse(id: string) {
    return useQuery({
        queryKey: inventoryKeys.warehouse(id),
        queryFn: () => inventoryApi.getWarehouse(id),
        enabled: !!id,
    });
}

// ── Zones ──

export function useZones(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: inventoryKeys.zones(params),
        queryFn: () => inventoryApi.listZones(params as any),
    });
}

// ── Bins ──

export function useBins(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: inventoryKeys.bins(params),
        queryFn: () => inventoryApi.listBins(params as any),
    });
}

// ── Item Stock Policies ──

export function useItemPolicies(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: inventoryKeys.itemPolicies(params),
        queryFn: () => inventoryApi.listItemPolicies(params as any),
    });
}

export function useItemPolicy(partId: string) {
    return useQuery({
        queryKey: inventoryKeys.itemPolicy(partId),
        queryFn: () => inventoryApi.getItemPolicy(partId),
        enabled: !!partId,
    });
}

// ── Reason Codes ──

export function useReasonCodes(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: inventoryKeys.reasonCodes(params),
        queryFn: () => inventoryApi.listReasonCodes(params as any),
    });
}

// ── Approval Thresholds ──

export function useApprovalThresholds() {
    return useQuery({
        queryKey: inventoryKeys.approvalThresholds(),
        queryFn: () => inventoryApi.listApprovalThresholds(),
    });
}

// ── Handling Units ──

export function useHandlingUnits() {
    return useQuery({
        queryKey: inventoryKeys.handlingUnits(),
        queryFn: () => inventoryApi.listHandlingUnits(),
    });
}

// ── Stock Explorer ──

export function useStockOnHand(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: inventoryKeys.stockOnHand(params),
        queryFn: () => inventoryApi.getStockOnHand(params as any),
    });
}

export function useNetAvailable(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: inventoryKeys.netAvailable(params),
        queryFn: () => inventoryApi.getNetAvailable(params as any),
    });
}

export function useStockByStatus(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: inventoryKeys.stockByStatus(params),
        queryFn: () => inventoryApi.getStockByStatus(params as any),
    });
}

export function useLotHistory(lotId: string) {
    return useQuery({
        queryKey: inventoryKeys.lotHistory(lotId),
        queryFn: () => inventoryApi.getLotHistory(lotId),
        enabled: !!lotId,
    });
}

export function useSerialHistory(serialId: string) {
    return useQuery({
        queryKey: inventoryKeys.serialHistory(serialId),
        queryFn: () => inventoryApi.getSerialHistory(serialId),
        enabled: !!serialId,
    });
}

export function useExpiryReport(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: inventoryKeys.expiryReport(params),
        queryFn: () => inventoryApi.getExpiryReport(params as any),
    });
}

export function useAgingReport(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: inventoryKeys.agingReport(params),
        queryFn: () => inventoryApi.getAgingReport(params as any),
    });
}

export function useMovementHistory(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: inventoryKeys.movementHistory(params),
        queryFn: () => inventoryApi.getMovementHistory(params as any),
    });
}

// ── Transactions ──

export function useGrns(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: inventoryKeys.grns(params),
        queryFn: () => inventoryApi.listGrns(params as any),
    });
}

export function useGrn(id: string) {
    return useQuery({
        queryKey: inventoryKeys.grn(id),
        queryFn: () => inventoryApi.getGrn(id),
        enabled: !!id,
    });
}

export function useReceiveStock(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: inventoryKeys.receiveStock(params),
        queryFn: () => inventoryApi.listReceiveStock(params as any),
    });
}

export function usePendingPutaway(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: inventoryKeys.pendingPutaway(params),
        queryFn: () => inventoryApi.listPendingPutaway(params as any),
    });
}

export function useMoveStock(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: inventoryKeys.moveStock(params),
        queryFn: () => inventoryApi.listMoveStock(params as any),
    });
}

export function useReservations(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: inventoryKeys.reservations(params),
        queryFn: () => inventoryApi.listReservations(params as any),
    });
}

export function useAdjustments(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: inventoryKeys.adjustments(params),
        queryFn: () => inventoryApi.listAdjustments(params as any),
    });
}

export function useStatusChanges(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: inventoryKeys.statusChanges(params),
        queryFn: () => inventoryApi.listStatusChanges(params as any),
    });
}

export function usePickItems(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: inventoryKeys.pickItems(params),
        queryFn: () => inventoryApi.listPickItems(params as any),
    });
}

export function usePacks(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: inventoryKeys.packs(params),
        queryFn: () => inventoryApi.listPacks(params as any),
    });
}

export function useDispatches(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: inventoryKeys.dispatches(params),
        queryFn: () => inventoryApi.listDispatches(params as any),
    });
}

export function useDispatch(id: string) {
    return useQuery({
        queryKey: inventoryKeys.dispatch(id),
        queryFn: () => inventoryApi.getDispatch(id),
        enabled: !!id,
    });
}

export function useCustomerReturns(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: inventoryKeys.customerReturns(params),
        queryFn: () => inventoryApi.listCustomerReturns(params as any),
    });
}

export function useVendorReturns(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: inventoryKeys.vendorReturns(params),
        queryFn: () => inventoryApi.listVendorReturns(params as any),
    });
}

// ── Counts ──

export function useCounts(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: inventoryKeys.counts(params),
        queryFn: () => inventoryApi.listCounts(params as any),
    });
}

export function useCount(id: string) {
    return useQuery({
        queryKey: inventoryKeys.count(id),
        queryFn: () => inventoryApi.getCount(id),
        enabled: !!id,
    });
}

// ── Approvals ──

export function usePendingApprovals() {
    return useQuery({
        queryKey: inventoryKeys.pendingApprovals(),
        queryFn: () => inventoryApi.listPendingApprovals(),
    });
}

export function useApprovalHistory(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: inventoryKeys.approvalHistory(params),
        queryFn: () => inventoryApi.getApprovalHistory(params as any),
    });
}

// ── Dashboard ──

export function useInventoryDashboard() {
    return useQuery({
        queryKey: inventoryKeys.dashboard(),
        queryFn: () => inventoryApi.getDashboard(),
    });
}

export function useActivitySummary(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: inventoryKeys.activitySummary(params),
        queryFn: () => inventoryApi.getActivitySummary(params as any),
    });
}

// ── Production ──

export function useIssueToProduction(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: inventoryKeys.issueToProduction(params),
        queryFn: () => inventoryApi.listIssueToProduction(params as any),
    });
}

export function useIssueToProductionDetail(id: string) {
    return useQuery({
        queryKey: inventoryKeys.issueToProductionDetail(id),
        queryFn: () => inventoryApi.getIssueToProduction(id),
        enabled: !!id,
    });
}

export function useIssuesByWorkOrder(workOrderId: string) {
    return useQuery({
        queryKey: inventoryKeys.issuesByWorkOrder(workOrderId),
        queryFn: () => inventoryApi.getIssuesByWorkOrder(workOrderId),
        enabled: !!workOrderId,
    });
}

export function useFgReceipts(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: inventoryKeys.fgReceipts(params),
        queryFn: () => inventoryApi.listFgReceipts(params as any),
    });
}

export function useFgReceipt(id: string) {
    return useQuery({
        queryKey: inventoryKeys.fgReceipt(id),
        queryFn: () => inventoryApi.getFgReceipt(id),
        enabled: !!id,
    });
}

export function useMaterialReturns(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: inventoryKeys.materialReturns(params),
        queryFn: () => inventoryApi.listMaterialReturns(params as any),
    });
}

export function useProductionScraps(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: inventoryKeys.productionScraps(params),
        queryFn: () => inventoryApi.listProductionScraps(params as any),
    });
}

export function useScrapCategories(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: inventoryKeys.scrapCategories(params),
        queryFn: () => inventoryApi.listScrapCategories(params as any),
    });
}

export function useWoReconciliation(workOrderId: string) {
    return useQuery({
        queryKey: inventoryKeys.woReconciliation(workOrderId),
        queryFn: () => inventoryApi.getWoReconciliation(workOrderId),
        enabled: !!workOrderId,
    });
}

export function useWipStock(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: inventoryKeys.wipStock(params),
        queryFn: () => inventoryApi.getWipStock(params as any),
    });
}

export function useScrapAnalysis(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: inventoryKeys.scrapAnalysis(params),
        queryFn: () => inventoryApi.getScrapAnalysis(params as any),
    });
}

// ── Putaway Rules ──

export function usePutawayRules(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: inventoryKeys.putawayRules(params),
        queryFn: () => inventoryApi.listPutawayRules(params as any),
    });
}

// ── Pallets ──

export function usePallets(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: inventoryKeys.pallets(params),
        queryFn: () => inventoryApi.listPallets(params as any),
    });
}

export function usePallet(id: string) {
    return useQuery({
        queryKey: inventoryKeys.pallet(id),
        queryFn: () => inventoryApi.getPallet(id),
        enabled: !!id,
    });
}

// ── Staging ──

export function useStagingInbound(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: inventoryKeys.stagingInbound(params),
        queryFn: () => inventoryApi.getStagingInbound(params as any),
    });
}

export function useStagingOutbound(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: inventoryKeys.stagingOutbound(params),
        queryFn: () => inventoryApi.getStagingOutbound(params as any),
    });
}

// ── Tool Life Policies ──

export function useToolLifePolicies(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: inventoryKeys.toolLifePolicies(params),
        queryFn: () => inventoryApi.listToolLifePolicies(params as any),
    });
}

export function useToolLifePolicy(partId: string) {
    return useQuery({
        queryKey: inventoryKeys.toolLifePolicy(partId),
        queryFn: () => inventoryApi.getToolLifePolicy(partId),
        enabled: !!partId,
    });
}

// ── Tools at Machine ──

export function useToolsAtMachine(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: inventoryKeys.toolsAtMachine(params),
        queryFn: () => inventoryApi.getToolsAtMachine(params as any),
    });
}

// ── Reconditioning ──

export function useReconditioning(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: inventoryKeys.reconditioning(params),
        queryFn: () => inventoryApi.listReconditioning(params as any),
    });
}

export function useOverdueReconditioning() {
    return useQuery({
        queryKey: inventoryKeys.overdueReconditioning(),
        queryFn: () => inventoryApi.getOverdueReconditioning(),
    });
}

// ── Tool Reports ──

export function useToolStatusReport(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: inventoryKeys.toolStatusReport(params),
        queryFn: () => inventoryApi.getToolStatusReport(params as any),
    });
}

export function useToolsAtMachineReport(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: inventoryKeys.toolsAtMachineReport(params),
        queryFn: () => inventoryApi.getToolsAtMachineReport(params as any),
    });
}

export function useToolConsumptionReport(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: inventoryKeys.toolConsumptionReport(params),
        queryFn: () => inventoryApi.getToolConsumptionReport(params as any),
    });
}

export function useReconditioningRegister(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: inventoryKeys.reconditioningRegister(params),
        queryFn: () => inventoryApi.getReconditioningRegister(params as any),
    });
}

export function useToolBreakageReport(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: inventoryKeys.toolBreakageReport(params),
        queryFn: () => inventoryApi.getToolBreakageReport(params as any),
    });
}

// ── Industry Templates ──

export function useIndustryTemplates() {
    return useQuery({
        queryKey: inventoryKeys.industryTemplates(),
        queryFn: () => inventoryApi.listIndustryTemplates(),
    });
}

export function useIndustryTemplate(id: string) {
    return useQuery({
        queryKey: inventoryKeys.industryTemplate(id),
        queryFn: () => inventoryApi.getIndustryTemplate(id),
        enabled: !!id,
    });
}

export function useActiveFieldConfig() {
    return useQuery({
        queryKey: inventoryKeys.activeFieldConfig(),
        queryFn: () => inventoryApi.getActiveFieldConfig(),
    });
}

// ── Compliance Documents ──

export function useComplianceDocuments(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: inventoryKeys.complianceDocuments(params),
        queryFn: () => inventoryApi.listComplianceDocuments(params as any),
    });
}

export function useComplianceDocument(id: string) {
    return useQuery({
        queryKey: inventoryKeys.complianceDocument(id),
        queryFn: () => inventoryApi.getComplianceDocument(id),
        enabled: !!id,
    });
}

export function useComplianceByLot(lotId: string) {
    return useQuery({
        queryKey: inventoryKeys.complianceByLot(lotId),
        queryFn: () => inventoryApi.getComplianceByLot(lotId),
        enabled: !!lotId,
    });
}

export function useComplianceByPart(partId: string) {
    return useQuery({
        queryKey: inventoryKeys.complianceByPart(partId),
        queryFn: () => inventoryApi.getComplianceByPart(partId),
        enabled: !!partId,
    });
}
