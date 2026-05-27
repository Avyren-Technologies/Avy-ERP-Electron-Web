import { useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from './inventory-api';
import { inventoryKeys } from './inventory-keys';
import { showSuccess, showApiError } from '@/lib/toast';

// ── Config ──

export function useUpdateInventoryConfig() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => inventoryApi.updateConfig(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.config() });
            showSuccess('Configuration updated');
        },
        onError: (error: any) => showApiError(error),
    });
}

export function useCompleteOnboardingStep() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (step: number) => inventoryApi.completeOnboardingStep(step),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.onboardingStatus() });
            showSuccess('Onboarding step completed');
        },
        onError: (error: any) => showApiError(error),
    });
}

// ── Warehouses ──

export function useCreateWarehouse() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => inventoryApi.createWarehouse(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.warehouses() });
            showSuccess('Warehouse created');
        },
        onError: (error: any) => showApiError(error),
    });
}

export function useUpdateWarehouse() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            inventoryApi.updateWarehouse(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.warehouse(variables.id) });
            queryClient.invalidateQueries({ queryKey: inventoryKeys.warehouses() });
            showSuccess('Warehouse updated');
        },
        onError: (error: any) => showApiError(error),
    });
}

export function useDeleteWarehouse() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => inventoryApi.deleteWarehouse(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.warehouses() });
            showSuccess('Warehouse deleted');
        },
        onError: (error: any) => showApiError(error),
    });
}

// ── Zones ──

export function useCreateZone() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => inventoryApi.createZone(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.zones() });
            queryClient.invalidateQueries({ queryKey: inventoryKeys.warehouses() });
            showSuccess('Zone created');
        },
        onError: (error: any) => showApiError(error),
    });
}

export function useUpdateZone() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            inventoryApi.updateZone(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.zones() });
            showSuccess('Zone updated');
        },
        onError: (error: any) => showApiError(error),
    });
}

export function useDeleteZone() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => inventoryApi.deleteZone(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.zones() });
            queryClient.invalidateQueries({ queryKey: inventoryKeys.warehouses() });
            showSuccess('Zone deleted');
        },
        onError: (error: any) => showApiError(error),
    });
}

// ── Bins ──

export function useCreateBin() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => inventoryApi.createBin(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.bins() });
            queryClient.invalidateQueries({ queryKey: inventoryKeys.zones() });
            showSuccess('Bin created');
        },
        onError: (error: any) => showApiError(error),
    });
}

export function useUpdateBin() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            inventoryApi.updateBin(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.bins() });
            showSuccess('Bin updated');
        },
        onError: (error: any) => showApiError(error),
    });
}

export function useDeleteBin() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => inventoryApi.deleteBin(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.bins() });
            queryClient.invalidateQueries({ queryKey: inventoryKeys.zones() });
            showSuccess('Bin deleted');
        },
        onError: (error: any) => showApiError(error),
    });
}

// ── Item Stock Policies ──

export function useUpsertItemPolicy() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => inventoryApi.upsertItemPolicy(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.itemPolicies() });
            showSuccess('Item policy saved');
        },
        onError: (error: any) => showApiError(error),
    });
}

// ── Reason Codes ──

export function useCreateReasonCode() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => inventoryApi.createReasonCode(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.reasonCodes() });
            showSuccess('Reason code created');
        },
        onError: (error: any) => showApiError(error),
    });
}

export function useUpdateReasonCode() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            inventoryApi.updateReasonCode(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.reasonCodes() });
            showSuccess('Reason code updated');
        },
        onError: (error: any) => showApiError(error),
    });
}

export function useDeleteReasonCode() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => inventoryApi.deleteReasonCode(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.reasonCodes() });
            showSuccess('Reason code deleted');
        },
        onError: (error: any) => showApiError(error),
    });
}

// ── Approval Thresholds ──

export function useCreateApprovalThreshold() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => inventoryApi.createApprovalThreshold(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.approvalThresholds() });
            showSuccess('Approval threshold created');
        },
        onError: (error: any) => showApiError(error),
    });
}

export function useUpdateApprovalThreshold() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            inventoryApi.updateApprovalThreshold(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.approvalThresholds() });
            showSuccess('Approval threshold updated');
        },
        onError: (error: any) => showApiError(error),
    });
}

export function useDeleteApprovalThreshold() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => inventoryApi.deleteApprovalThreshold(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.approvalThresholds() });
            showSuccess('Approval threshold deleted');
        },
        onError: (error: any) => showApiError(error),
    });
}

// ── Handling Units ──

export function useCreateHandlingUnit() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => inventoryApi.createHandlingUnit(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.handlingUnits() });
            showSuccess('Handling unit created');
        },
        onError: (error: any) => showApiError(error),
    });
}

export function useUpdateHandlingUnit() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            inventoryApi.updateHandlingUnit(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.handlingUnits() });
            showSuccess('Handling unit updated');
        },
        onError: (error: any) => showApiError(error),
    });
}

export function useDeleteHandlingUnit() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => inventoryApi.deleteHandlingUnit(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.handlingUnits() });
            showSuccess('Handling unit deleted');
        },
        onError: (error: any) => showApiError(error),
    });
}

// ── Helper for stock-affecting mutations ──

function invalidateStockQueries(queryClient: ReturnType<typeof useQueryClient>) {
    queryClient.invalidateQueries({ queryKey: inventoryKeys.stockOnHand() });
    queryClient.invalidateQueries({ queryKey: inventoryKeys.netAvailable() });
    queryClient.invalidateQueries({ queryKey: inventoryKeys.stockByStatus() });
    queryClient.invalidateQueries({ queryKey: inventoryKeys.dashboard() });
}

// ── Transactions: Receive Stock ──

export function useCreateReceiveStock() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => inventoryApi.createReceiveStock(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.receiveStock() });
            invalidateStockQueries(queryClient);
            showSuccess('Stock received');
        },
        onError: (error: any) => showApiError(error),
    });
}

// ── Transactions: GRN ──

export function useCreateGrn() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => inventoryApi.createGrn(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.grns() });
            queryClient.invalidateQueries({ queryKey: inventoryKeys.pendingPutaway() });
            invalidateStockQueries(queryClient);
            showSuccess('GRN created');
        },
        onError: (error: any) => showApiError(error),
    });
}

// ── Transactions: Put-Away ──

export function useConfirmPutaway() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => inventoryApi.confirmPutaway(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.pendingPutaway() });
            invalidateStockQueries(queryClient);
            showSuccess('Put-away confirmed');
        },
        onError: (error: any) => showApiError(error),
    });
}

// ── Transactions: Move Stock ──

export function useCreateMoveStock() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => inventoryApi.createMoveStock(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.moveStock() });
            invalidateStockQueries(queryClient);
            showSuccess('Stock move initiated');
        },
        onError: (error: any) => showApiError(error),
    });
}

export function useConfirmMoveReceipt() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => inventoryApi.confirmMoveReceipt(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.moveStock() });
            invalidateStockQueries(queryClient);
            showSuccess('Move receipt confirmed');
        },
        onError: (error: any) => showApiError(error),
    });
}

// ── Transactions: Reserve Stock ──

export function useCreateReserveStock() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => inventoryApi.createReserveStock(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.reservations() });
            invalidateStockQueries(queryClient);
            showSuccess('Stock reserved');
        },
        onError: (error: any) => showApiError(error),
    });
}

export function useReleaseReservation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => inventoryApi.releaseReservation(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.reservations() });
            invalidateStockQueries(queryClient);
            showSuccess('Reservation released');
        },
        onError: (error: any) => showApiError(error),
    });
}

// ── Transactions: Adjust Stock ──

export function useCreateAdjustStock() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => inventoryApi.createAdjustStock(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.adjustments() });
            queryClient.invalidateQueries({ queryKey: inventoryKeys.pendingApprovals() });
            invalidateStockQueries(queryClient);
            showSuccess('Stock adjustment created');
        },
        onError: (error: any) => showApiError(error),
    });
}

export function useCreateOpeningBalance() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => inventoryApi.createOpeningBalance(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.adjustments() });
            invalidateStockQueries(queryClient);
            showSuccess('Opening balance posted');
        },
        onError: (error: any) => showApiError(error),
    });
}

// ── Transactions: Change Status ──

export function useCreateChangeStatus() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => inventoryApi.createChangeStatus(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.statusChanges() });
            invalidateStockQueries(queryClient);
            showSuccess('Status changed');
        },
        onError: (error: any) => showApiError(error),
    });
}

// ── Transactions: Pick Items ──

export function useCreatePickItems() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => inventoryApi.createPickItems(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.pickItems() });
            invalidateStockQueries(queryClient);
            showSuccess('Pick list created');
        },
        onError: (error: any) => showApiError(error),
    });
}

export function useConfirmPick() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            inventoryApi.confirmPick(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.pickItems() });
            invalidateStockQueries(queryClient);
            showSuccess('Pick confirmed');
        },
        onError: (error: any) => showApiError(error),
    });
}

// ── Transactions: Pack ──

export function useCreatePack() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => inventoryApi.createPack(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.packs() });
            showSuccess('Pack created');
        },
        onError: (error: any) => showApiError(error),
    });
}

// ── Transactions: Dispatch ──

export function useCreateDispatch() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => inventoryApi.createDispatch(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.dispatches() });
            invalidateStockQueries(queryClient);
            showSuccess('Dispatch created');
        },
        onError: (error: any) => showApiError(error),
    });
}

// ── Transactions: Customer Return ──

export function useCreateCustomerReturn() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => inventoryApi.createCustomerReturn(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.customerReturns() });
            invalidateStockQueries(queryClient);
            showSuccess('Customer return logged');
        },
        onError: (error: any) => showApiError(error),
    });
}

export function useInspectReturn() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            inventoryApi.inspectReturn(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.customerReturns() });
            invalidateStockQueries(queryClient);
            showSuccess('Return inspection completed');
        },
        onError: (error: any) => showApiError(error),
    });
}

// ── Transactions: Vendor Return ──

export function useCreateVendorReturn() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => inventoryApi.createVendorReturn(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.vendorReturns() });
            invalidateStockQueries(queryClient);
            showSuccess('Vendor return created');
        },
        onError: (error: any) => showApiError(error),
    });
}

// ── Counts ──

export function useCreateCount() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => inventoryApi.createCount(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.counts() });
            showSuccess('Count created');
        },
        onError: (error: any) => showApiError(error),
    });
}

export function useEnterCount() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            inventoryApi.enterCount(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.count(variables.id) });
            queryClient.invalidateQueries({ queryKey: inventoryKeys.counts() });
            showSuccess('Count entries saved');
        },
        onError: (error: any) => showApiError(error),
    });
}

export function useSubmitCount() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => inventoryApi.submitCount(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.counts() });
            queryClient.invalidateQueries({ queryKey: inventoryKeys.pendingApprovals() });
            showSuccess('Count submitted for approval');
        },
        onError: (error: any) => showApiError(error),
    });
}

export function useApproveCount() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data?: any }) =>
            inventoryApi.approveCount(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.count(variables.id) });
            queryClient.invalidateQueries({ queryKey: inventoryKeys.counts() });
            queryClient.invalidateQueries({ queryKey: inventoryKeys.pendingApprovals() });
            invalidateStockQueries(queryClient);
            showSuccess('Count approved');
        },
        onError: (error: any) => showApiError(error),
    });
}

// ── Approvals ──

export function useApproveTransaction() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => inventoryApi.approveTransaction(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.pendingApprovals() });
            queryClient.invalidateQueries({ queryKey: inventoryKeys.approvalHistory() });
            invalidateStockQueries(queryClient);
            showSuccess('Transaction approved');
        },
        onError: (error: any) => showApiError(error),
    });
}

export function useRejectTransaction() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            inventoryApi.rejectTransaction(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.pendingApprovals() });
            queryClient.invalidateQueries({ queryKey: inventoryKeys.approvalHistory() });
            showSuccess('Transaction rejected');
        },
        onError: (error: any) => showApiError(error),
    });
}

// ── Production: Issue to Production ──

export function useCreateIssueToProduction() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => inventoryApi.createIssueToProduction(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.issueToProduction() });
            invalidateStockQueries(queryClient);
            queryClient.invalidateQueries({ queryKey: inventoryKeys.wipStock() });
            showSuccess('Material issued to production');
        },
        onError: (error: any) => showApiError(error),
    });
}

// ── Production: FG Receipt ──

export function useCreateFgReceipt() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => inventoryApi.createFgReceipt(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.fgReceipts() });
            invalidateStockQueries(queryClient);
            queryClient.invalidateQueries({ queryKey: inventoryKeys.wipStock() });
            showSuccess('FG receipt recorded');
        },
        onError: (error: any) => showApiError(error),
    });
}

// ── Production: Material Return ──

export function useCreateMaterialReturn() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => inventoryApi.createMaterialReturn(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.materialReturns() });
            invalidateStockQueries(queryClient);
            queryClient.invalidateQueries({ queryKey: inventoryKeys.wipStock() });
            showSuccess('Material returned from production');
        },
        onError: (error: any) => showApiError(error),
    });
}

// ── Production: Production Scrap ──

export function useCreateProductionScrap() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => inventoryApi.createProductionScrap(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.productionScraps() });
            invalidateStockQueries(queryClient);
            queryClient.invalidateQueries({ queryKey: inventoryKeys.wipStock() });
            showSuccess('Production scrap logged');
        },
        onError: (error: any) => showApiError(error),
    });
}

// ── Scrap Categories ──

export function useCreateScrapCategory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => inventoryApi.createScrapCategory(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.scrapCategories() });
            showSuccess('Scrap category created');
        },
        onError: (error: any) => showApiError(error),
    });
}

export function useUpdateScrapCategory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            inventoryApi.updateScrapCategory(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.scrapCategories() });
            showSuccess('Scrap category updated');
        },
        onError: (error: any) => showApiError(error),
    });
}

export function useDeleteScrapCategory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => inventoryApi.deleteScrapCategory(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.scrapCategories() });
            showSuccess('Scrap category deleted');
        },
        onError: (error: any) => showApiError(error),
    });
}

// ── WO Reconciliation ──

export function useGenerateWoReconciliation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (workOrderId: string) => inventoryApi.generateWoReconciliation(workOrderId),
        onSuccess: (_, workOrderId) => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.woReconciliation(workOrderId) });
            showSuccess('Reconciliation generated');
        },
        onError: (error: any) => showApiError(error),
    });
}

// ── Helper for tool-affecting mutations ──

function invalidateToolQueries(queryClient: ReturnType<typeof useQueryClient>) {
    queryClient.invalidateQueries({ queryKey: inventoryKeys.stockOnHand() });
    queryClient.invalidateQueries({ queryKey: inventoryKeys.toolsAtMachine() });
    queryClient.invalidateQueries({ queryKey: inventoryKeys.toolStatusReport() });
    queryClient.invalidateQueries({ queryKey: inventoryKeys.dashboard() });
}

// ── Putaway Rules ──

export function useCreatePutawayRule() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => inventoryApi.createPutawayRule(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.putawayRules() });
            showSuccess('Putaway rule created');
        },
        onError: (error: any) => showApiError(error),
    });
}

export function useUpdatePutawayRule() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            inventoryApi.updatePutawayRule(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.putawayRules() });
            showSuccess('Putaway rule updated');
        },
        onError: (error: any) => showApiError(error),
    });
}

export function useDeletePutawayRule() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => inventoryApi.deletePutawayRule(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.putawayRules() });
            showSuccess('Putaway rule deleted');
        },
        onError: (error: any) => showApiError(error),
    });
}

export function useSuggestBin() {
    return useMutation({
        mutationFn: (data: any) => inventoryApi.suggestBin(data),
        onError: (error: any) => showApiError(error),
    });
}

// ── Pallets ──

export function useCreatePallet() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => inventoryApi.createPallet(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.pallets() });
            showSuccess('Pallet created');
        },
        onError: (error: any) => showApiError(error),
    });
}

export function useAddPalletItems() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            inventoryApi.addPalletItems(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.pallet(variables.id) });
            queryClient.invalidateQueries({ queryKey: inventoryKeys.pallets() });
            showSuccess('Items added to pallet');
        },
        onError: (error: any) => showApiError(error),
    });
}

export function useClosePallet() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => inventoryApi.closePallet(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.pallets() });
            showSuccess('Pallet closed');
        },
        onError: (error: any) => showApiError(error),
    });
}

// ── Tool Life Policies ──

export function useUpsertToolLifePolicy() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => inventoryApi.upsertToolLifePolicy(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.toolLifePolicies() });
            showSuccess('Tool life policy saved');
        },
        onError: (error: any) => showApiError(error),
    });
}

// ── Tool Issue ──

export function useCreateToolIssue() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => inventoryApi.createToolIssue(data),
        onSuccess: () => {
            invalidateToolQueries(queryClient);
            showSuccess('Tool issued to machine');
        },
        onError: (error: any) => showApiError(error),
    });
}

// ── Tool Return ──

export function useCreateToolReturn() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => inventoryApi.createToolReturn(data),
        onSuccess: () => {
            invalidateToolQueries(queryClient);
            queryClient.invalidateQueries({ queryKey: inventoryKeys.reconditioning() });
            showSuccess('Tool returned from machine');
        },
        onError: (error: any) => showApiError(error),
    });
}

// ── Reconditioning ──

export function useInitiateReconditioning() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => inventoryApi.initiateReconditioning(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.reconditioning() });
            invalidateToolQueries(queryClient);
            showSuccess('Reconditioning initiated');
        },
        onError: (error: any) => showApiError(error),
    });
}

export function useCompleteReconditioning() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            inventoryApi.completeReconditioning(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.reconditioning() });
            queryClient.invalidateQueries({ queryKey: inventoryKeys.overdueReconditioning() });
            invalidateToolQueries(queryClient);
            showSuccess('Reconditioning completed');
        },
        onError: (error: any) => showApiError(error),
    });
}

// ── Industry Templates ──

export function useActivateIndustryTemplate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => inventoryApi.activateIndustryTemplate(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.industryTemplates() });
            queryClient.invalidateQueries({ queryKey: inventoryKeys.activeFieldConfig() });
            queryClient.invalidateQueries({ queryKey: inventoryKeys.config() });
            showSuccess('Industry template activated');
        },
        onError: (error: any) => showApiError(error),
    });
}

export function useCloneIndustryTemplate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            inventoryApi.cloneIndustryTemplate(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.industryTemplates() });
            showSuccess('Template cloned');
        },
        onError: (error: any) => showApiError(error),
    });
}

export function useUpdateFieldConfig() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ templateId, fieldId, data }: { templateId: string; fieldId: string; data: any }) =>
            inventoryApi.updateFieldConfig(templateId, fieldId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.industryTemplate(variables.templateId) });
            queryClient.invalidateQueries({ queryKey: inventoryKeys.activeFieldConfig() });
            showSuccess('Field configuration updated');
        },
        onError: (error: any) => showApiError(error),
    });
}

export function useSeedIndustryTemplates() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => inventoryApi.seedIndustryTemplates(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.industryTemplates() });
            showSuccess('System templates seeded');
        },
        onError: (error: any) => showApiError(error),
    });
}

// ── Compliance Documents ──

export function useCreateComplianceDocument() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => inventoryApi.createComplianceDocument(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.complianceDocuments() });
            showSuccess('Compliance document uploaded');
        },
        onError: (error: any) => showApiError(error),
    });
}

export function useUpdateComplianceDocument() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            inventoryApi.updateComplianceDocument(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.complianceDocuments() });
            showSuccess('Compliance document updated');
        },
        onError: (error: any) => showApiError(error),
    });
}

export function useDeleteComplianceDocument() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => inventoryApi.deleteComplianceDocument(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.complianceDocuments() });
            showSuccess('Compliance document deleted');
        },
        onError: (error: any) => showApiError(error),
    });
}

// ── Sync ──

export function useUploadSyncActions() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => inventoryApi.uploadSyncActions(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.syncConflicts() });
            queryClient.invalidateQueries({ queryKey: inventoryKeys.syncStats() });
            invalidateStockQueries(queryClient);
        },
        onError: (error: any) => showApiError(error),
    });
}

export function useResolveSyncConflict() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            inventoryApi.resolveSyncConflict(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.syncConflicts() });
            queryClient.invalidateQueries({ queryKey: inventoryKeys.syncStats() });
            invalidateStockQueries(queryClient);
            showSuccess('Conflict resolved');
        },
        onError: (error: any) => showApiError(error),
    });
}

export function useRetrySyncFailed() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => inventoryApi.retrySyncFailed(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.syncConflicts() });
            queryClient.invalidateQueries({ queryKey: inventoryKeys.syncStats() });
            showSuccess('Retrying failed sync actions');
        },
        onError: (error: any) => showApiError(error),
    });
}
