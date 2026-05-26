import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Loader2,
    X,
    Play,
    Pause,
    CheckCircle,
    Lock,
    Ban,
    RotateCcw,
    UserPlus,
    ThumbsUp,
    ThumbsDown,
    ShieldCheck,
    Plus,
    Clock,
    History,
    Package,
    ClipboardList,
    Image,
    DollarSign,
    Info,
    Undo2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkOrder, useActionCodes } from "@/features/maintenance/api/use-maintenance-queries";
import {
    useApproveWO,
    useAssignWO,
    useAcknowledgeWO,
    useDeclineWO,
    useStartWO,
    useHoldWO,
    useResumeWO,
    useCompleteWO,
    useQAReleaseWO,
    useCloseWO,
    useRejectWO,
    useCancelWO,
    useReopenWO,
    useAddWOParts,
    useReturnWOPart,
    useLogWOLabour,
    useAddWOEvidence,
    useSubmitChecklist,
} from "@/features/maintenance/api/use-maintenance-mutations";
import { useCompanyFormatter } from "@/hooks/useCompanyFormatter";
import { useCanPerform } from "@/hooks/useCanPerform";
import { PriorityBadge } from "@/features/maintenance/shared/PriorityBadge";
import { WOStatusBadge, WOTypeBadge } from "@/features/maintenance/shared/WOStatusBadge";
import { showSuccess, showApiError } from "@/lib/toast";
import { useEmployees } from "@/features/company-admin/api/use-hr-queries";
import { useCompanySettings } from "@/features/company-admin/api/use-company-admin-queries";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { DEFAULT_FORMAT_SETTINGS } from "@/lib/format/company-formatter";
import {
    buildAddPartsPayload,
    buildLogLabourPayload,
    computeLabourLineCost,
    computePartLineCost,
    emptyLogLabourForm,
    resolveTechnicianName,
    validateAddPartForm,
    validateLogLabourForm,
    type AddPartFormState,
    type LogLabourFormState,
} from "@/features/maintenance/work-orders/work-order-parts-labour";
import {
    buildObservationsForComplete,
    formatWorkOrderDescriptionDisplay,
    getWorkOrderClosureHistory,
    getWorkOrderExecutionObservations,
} from "@/features/maintenance/work-orders/work-order-description";
import { normalizeWorkOrderEvidence } from "@/features/maintenance/work-orders/work-order-evidence";
import { WorkOrderEvidenceTab } from "@/features/maintenance/work-orders/WorkOrderEvidenceTab";
import { resolveMaintenanceAssetNumber } from "@/features/maintenance/shared/maintenance-asset-display";
import {
    LabourQuickTimer,
    WOFormButton,
    WOFormField,
    WOFormPanel,
    WOFormSection,
    WorkOrderReasonModal,
    woFieldInputClass,
} from "@/features/maintenance/work-orders/WOFormPanel";

/* ── Tabs ── */

const TABS = [
    { key: "overview", label: "Overview", icon: Info },
    { key: "checklist", label: "Checklist", icon: ClipboardList },
    { key: "parts", label: "Parts", icon: Package },
    { key: "labour", label: "Labour", icon: Clock },
    { key: "evidence", label: "Evidence", icon: Image },
    { key: "cost", label: "Cost", icon: DollarSign },
    { key: "history", label: "History", icon: History },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const HOLD_REASON_OPTIONS = [
    { value: "WAITING_PARTS", label: "Waiting for Parts" },
    { value: "WAITING_VENDOR", label: "Waiting for Vendor" },
    { value: "WAITING_SHUTDOWN", label: "Waiting for Shutdown" },
    { value: "WAITING_PTW", label: "Waiting for PTW" },
    { value: "WAITING_QA", label: "Waiting for QA" },
    { value: "WAITING_APPROVAL", label: "Waiting for Approval" },
    { value: "OTHER", label: "Other" },
];

/* ── Screen ── */

export function WorkOrderDetailScreen() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const fmt = useCompanyFormatter();
    const canManage = useCanPerform("maintenance.work-orders:approve");
    const canUpdateWO = useCanPerform("maintenance.work-orders:update");
    const { data: companySettings } = useCompanySettings();
    const companyTimezone =
        companySettings?.data?.timezone ?? DEFAULT_FORMAT_SETTINGS.timezone;

    const [activeTab, setActiveTab] = useState<TabKey>("overview");

    // Modals
    const [modal, setModal] = useState<string | null>(null);
    const [modalData, setModalData] = useState<Record<string, string>>({});

    // Query
    const { data, isLoading, isError } = useWorkOrder(id!);
    const wo: any = data?.data ?? null;

    const actionCodesQuery = useActionCodes({ limit: 500 });
    const actionCodes: any[] = (actionCodesQuery.data as any)?.data ?? [];

    // Employee picker for technician assignment
    const empQuery = useEmployees({ limit: 500 });
    const employeeOptions = useMemo(() => {
        const employees: any[] = (empQuery.data as any)?.data ?? [];
        return employees.map((emp: any) => ({
            value: emp.id,
            label: `${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim() || emp.name || emp.employeeId,
            sublabel: [
                emp.employeeId,
                emp.department?.name,
                emp.designation?.name,
            ].filter(Boolean).join(" · "),
        }));
    }, [empQuery.data]);

    const resolvedTechName = useMemo(() => {
        if (wo?.leadTechnician) {
            const t = wo.leadTechnician;
            const full = `${t.firstName ?? ""} ${t.lastName ?? ""}`.trim();
            if (full || t.name) return full || t.name;
        }
        if (wo?.leadTechnicianName) return wo.leadTechnicianName;
        if (wo?.leadTechnicianId) {
            const employees: any[] = (empQuery.data as any)?.data ?? [];
            const emp = employees.find((e: any) => e.id === wo.leadTechnicianId);
            if (emp) {
                return `${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim() || emp.name || emp.employeeId;
            }
            return wo.leadTechnicianId;
        }
        return "---";
    }, [wo, empQuery.data]);


    // Mutations
    const approveMutation = useApproveWO();
    const assignMutation = useAssignWO();
    const declineMutation = useDeclineWO();
    const ackMutation = useAcknowledgeWO();
    const startMutation = useStartWO();
    const holdMutation = useHoldWO();
    const resumeMutation = useResumeWO();
    const completeMutation = useCompleteWO();
    const qaReleaseMutation = useQAReleaseWO();
    const closeMutation = useCloseWO();
    const rejectMutation = useRejectWO();
    const cancelMutation = useCancelWO();
    const reopenMutation = useReopenWO();
    const addPartsMutation = useAddWOParts();
    const returnPartMutation = useReturnWOPart();
    const logLabourMutation = useLogWOLabour();
    const addEvidenceMutation = useAddWOEvidence();
    const submitChecklistMutation = useSubmitChecklist();

    const openModal = (name: string) => {
        setModal(name);
        if (name === "complete" && wo) {
            setModalData({
                observations: getWorkOrderExecutionObservations(wo),
                rootCauseCode: wo.rootCauseCode ?? "",
                actionTakenCode: wo.actionTakenCode ?? "",
                actionDescription: wo.actionDescription ?? "",
                recommendations: wo.recommendations ?? "",
                closureReason: "",
            });
        } else {
            setModalData({});
        }
    };
    const closeModal = () => {
        setModal(null);
        setModalData({});
    };
    const setMD = (key: string, value: string) => setModalData((p) => ({ ...p, [key]: value }));

    // Action handlers — all call real backend APIs
    const handleLifecycleAction = async (
        mutation: any,
        successTitle: string,
        successMsg: string,
        payload: any = { id: id! }
    ) => {
        try {
            await mutation.mutateAsync(payload);
            showSuccess(successTitle, successMsg);
            closeModal();
        } catch (err) {
            showApiError(err);
        }
    };

    const handleCompleteAndClose = async () => {
        const closureReason = modalData.closureReason?.trim();
        if (!closureReason || !wo) return;

        try {
            await completeMutation.mutateAsync({
                id: id!,
                data: {
                    observations: buildObservationsForComplete(wo, {
                        executionObservations: modalData.observations,
                    }),
                    rootCauseCode: modalData.rootCauseCode || undefined,
                    actionTakenCode: modalData.actionTakenCode || undefined,
                    actionDescription: modalData.actionDescription?.trim() || undefined,
                    recommendations: modalData.recommendations?.trim() || undefined,
                },
            });
            await closeMutation.mutateAsync({
                id: id!,
                data: { reason: closureReason },
            });
            showSuccess("Closed", "Work order completed and closed.");
            closeModal();
        } catch (err) {
            showApiError(err);
        }
    };

    const handleAssignConfirm = async () => {
        const techId = modalData.techId?.trim();
        if (!techId) return;

        try {
            await assignMutation.mutateAsync({
                id: id!,
                data: { leadTechnicianId: techId }
            });
            showSuccess("Assigned", "Work order assigned.");
            closeModal();
        } catch (err) {
            showApiError(err);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 size={32} className="animate-spin text-primary-500" />
            </div>
        );
    }

    if (isError || !wo) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <p className="text-neutral-500 dark:text-neutral-400">Work order not found.</p>
                <button onClick={() => navigate("/app/maintenance/work-orders")} className="text-primary-600 dark:text-primary-400 text-sm font-bold hover:underline">
                    Back to Work Orders
                </button>
            </div>
        );
    }

    const parts: any[] = wo.partsUsed ?? [];
    const labourLogs: any[] = wo.labourLogs ?? [];
    const evidence = normalizeWorkOrderEvidence(wo);
    const events: any[] = wo.events ?? [];
    const checklist: any[] = wo.checklistSnapshot ?? [];

    const labourCost = labourLogs.reduce((s: number, l: any) => s + computeLabourLineCost(l), 0);
    const partsCost = parts.reduce((s: number, p: any) => s + Number(p.totalCost || 0), 0);
    const vendorCost = Number(wo.vendorCost || 0);
    const totalCost = labourCost + partsCost + vendorCost;

    const status = wo.status;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    <button
                        onClick={() => navigate("/app/maintenance/work-orders")}
                        className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors mt-1"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50">
                                {wo.woNumber}
                            </span>
                            <WOStatusBadge status={status} size="md" />
                            <WOTypeBadge type={wo.woType} />
                            <PriorityBadge priority={wo.priority} />
                            {wo.pmScheduleId && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50">
                                    PM Linked
                                </span>
                            )}
                        </div>
                        <h1 className="text-2xl font-bold text-primary-950 dark:text-white tracking-tight">Work Order Detail</h1>
                    </div>
                </div>

                {/* Action Buttons */}
                {canManage && (
                    <div className="flex items-center gap-2 flex-wrap">
                        {(status === "DRAFT" || status === "PLANNED") && (
                            <ActionBtn icon={<CheckCircle className="w-4 h-4" />} label="Approve" color="success" onClick={() => handleLifecycleAction(approveMutation, "Approved", "Work order approved.")} isPending={approveMutation.isPending} />
                        )}
                        {status === "APPROVED" && (
                            <ActionBtn icon={<UserPlus className="w-4 h-4" />} label="Assign" color="accent" onClick={() => openModal("assign")} />
                        )}
                        {status === "ASSIGNED" && (
                            <>
                                <ActionBtn icon={<ThumbsUp className="w-4 h-4" />} label="Acknowledge" color="cyan" onClick={() => handleLifecycleAction(ackMutation, "Acknowledged", "Work order acknowledged.")} isPending={ackMutation.isPending} />
                                <ActionBtn icon={<ThumbsDown className="w-4 h-4" />} label="Decline" color="danger" onClick={() => openModal("decline")} />
                            </>
                        )}
                        {(status === "ASSIGNED" || status === "ACKNOWLEDGED") && (
                            <ActionBtn icon={<Play className="w-4 h-4" />} label="Start" color="blue" onClick={() => handleLifecycleAction(startMutation, "Started", "Work order started.")} isPending={startMutation.isPending} />
                        )}
                        {status === "IN_PROGRESS" && (
                            <>
                                <ActionBtn icon={<Pause className="w-4 h-4" />} label="Hold" color="warning" onClick={() => openModal("hold")} />
                                <ActionBtn icon={<CheckCircle className="w-4 h-4" />} label="Complete" color="success" onClick={() => openModal("complete")} />
                            </>
                        )}
                        {status === "ON_HOLD" && (
                            <ActionBtn icon={<Play className="w-4 h-4" />} label="Resume" color="blue" onClick={() => handleLifecycleAction(resumeMutation, "Resumed", "Work order resumed.")} isPending={resumeMutation.isPending} />
                        )}
                        {status === "AWAITING_QA" && (
                            <>
                                <ActionBtn icon={<ShieldCheck className="w-4 h-4" />} label="QA Release" color="emerald" onClick={() => handleLifecycleAction(qaReleaseMutation, "QA Released", "Work order QA released.")} isPending={qaReleaseMutation.isPending} />
                                <ActionBtn icon={<ThumbsDown className="w-4 h-4" />} label="Reject" color="danger" onClick={() => openModal("reject")} />
                            </>
                        )}
                        {(status === "COMPLETED" || status === "AWAITING_QA") && (
                            <ActionBtn icon={<Lock className="w-4 h-4" />} label="Close" color="neutral" onClick={() => openModal("close")} />
                        )}
                        {status === "CLOSED" && (
                            <ActionBtn icon={<RotateCcw className="w-4 h-4" />} label="Reopen" color="warning" onClick={() => openModal("reopen")} />
                        )}
                        {!["CLOSED", "CANCELLED", "COMPLETED", "AWAITING_QA"].includes(status) && (
                            <ActionBtn icon={<Ban className="w-4 h-4" />} label="Cancel" color="danger" onClick={() => handleLifecycleAction(cancelMutation, "Cancelled", "Work order cancelled.")} isPending={cancelMutation.isPending} />
                        )}
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <div className="flex border-b border-neutral-200 dark:border-neutral-800 overflow-x-auto">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={cn(
                                    "flex items-center gap-2 px-5 py-3.5 text-sm font-bold whitespace-nowrap border-b-2 transition-colors",
                                    activeTab === tab.key
                                        ? "border-primary-500 text-primary-600 dark:text-primary-400"
                                        : "border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
                                )}
                            >
                                <Icon size={16} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                <div className="p-6">
                    {activeTab === "overview" && <OverviewTab wo={wo} fmt={fmt} resolvedTechName={resolvedTechName} />}
                    {activeTab === "checklist" && <ChecklistTab checklist={checklist} woId={id!} submitMutation={submitChecklistMutation} canManage={canManage} status={status} />}
                    {activeTab === "parts" && (
                        <PartsTab
                            parts={parts}
                            woId={id!}
                            addMutation={addPartsMutation}
                            returnMutation={returnPartMutation}
                            canEdit={canUpdateWO}
                            status={status}
                        />
                    )}
                    {activeTab === "labour" && (
                        <LabourTab
                            labourLogs={labourLogs}
                            woId={id!}
                            logMutation={logLabourMutation}
                            canEdit={canUpdateWO}
                            status={status}
                            fmt={fmt}
                            employeeOptions={employeeOptions}
                            companyTimezone={companyTimezone}
                            defaultTechnicianId={wo?.leadTechnicianId ?? ""}
                        />
                    )}
                    {activeTab === "evidence" && (
                        <WorkOrderEvidenceTab
                            evidence={evidence}
                            woId={id!}
                            addMutation={addEvidenceMutation}
                            canManage={canManage}
                            status={status}
                        />
                    )}
                    {activeTab === "cost" && <CostTab labourCost={labourCost} partsCost={partsCost} vendorCost={vendorCost} totalCost={totalCost} />}
                    {activeTab === "history" && <HistoryTab events={events} fmt={fmt} />}
                </div>
            </div>

            {/* ── Modals ── */}

            {modal === "assign" && (
                <ActionModal title="Assign Work Order" onClose={closeModal}>
                    <div>
                        <SearchableSelect
                            label="Lead Technician"
                            required
                            value={modalData.techId || ""}
                            onChange={(v) => setMD("techId", v)}
                            options={employeeOptions}
                            placeholder="Search by name, ID or department..."
                            isLoading={empQuery.isLoading}
                        />
                        {modalData.techId && (() => {
                            const sel = employeeOptions.find(o => o.value === modalData.techId);
                            return sel ? (
                                <p className="mt-2 text-xs text-neutral-400 dark:text-neutral-500">
                                    {sel.sublabel}
                                </p>
                            ) : null;
                        })()}
                    </div>
                    <ModalActions onClose={closeModal} onConfirm={handleAssignConfirm} isPending={assignMutation.isPending} disabled={!modalData.techId?.trim()} label="Assign" />
                </ActionModal>
            )}

            {modal === "hold" && (
                <ActionModal title="Hold Work Order" onClose={closeModal}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">
                                Hold Reason <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={modalData.holdReason || ""}
                                onChange={(e) => setMD("holdReason", e.target.value)}
                                className="modal-input w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                            >
                                <option value="" className="text-neutral-400">Select reason for putting on hold...</option>
                                {HOLD_REASON_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">
                                Optional Notes
                            </label>
                            <textarea
                                value={modalData.holdNotes || ""}
                                onChange={(e) => setMD("holdNotes", e.target.value)}
                                placeholder="Provide any additional details or notes..."
                                rows={3}
                                className="modal-input w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors resize-none"
                            />
                        </div>
                    </div>
                    <ModalActions
                        onClose={closeModal}
                        onConfirm={() =>
                            handleLifecycleAction(holdMutation, "On Hold", "Work order put on hold.", {
                                id: id!,
                                data: {
                                    holdReason: modalData.holdReason,
                                    holdNotes: modalData.holdNotes?.trim() || undefined,
                                },
                            })
                        }
                        isPending={holdMutation.isPending}
                        disabled={!modalData.holdReason}
                        label="Put on Hold"
                        color="warning"
                    />
                </ActionModal>
            )}

            {modal === "complete" && (() => {
                const partsUsed: any[] = wo?.partsUsed ?? [];
                const labourLogs: any[] = wo?.labourLogs ?? [];
                const totalLabourHrs = labourLogs.reduce((sum: number, l: any) => sum + Number(l.hours ?? 0), 0);
                const partsCost = partsUsed.reduce((sum: number, p: any) => sum + Number(p.totalCost ?? (Number(p.quantity ?? 0) * Number(p.unitCost ?? 0))), 0);
                const labourCost = labourLogs.reduce((sum: number, l: any) => sum + Number(l.totalCost ?? (Number(l.hours ?? 0) * Number(l.hourlyRate ?? l.costPerHour ?? 0))), 0);
                const totalCost = partsCost + labourCost;

                return (
                    <ActionModal
                        title="Complete & Close Job"
                        onClose={closeModal}
                        className="max-w-2xl"
                        footer={
                            <ModalActions
                                onClose={closeModal}
                                onConfirm={handleCompleteAndClose}
                                isPending={completeMutation.isPending || closeMutation.isPending}
                                disabled={!modalData.closureReason?.trim()}
                                label="Complete & Close"
                                color="success"
                            />
                        }
                    >
                        <div className="space-y-4 pb-2">
                            {/* Summary Card */}
                            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-100 dark:border-neutral-700/60 space-y-3">
                                <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Closure Summary</h4>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-neutral-700 dark:text-neutral-300">
                                    <div className="flex justify-between border-b border-neutral-100 dark:border-neutral-800 py-1">
                                        <span>Total Labour Time:</span>
                                        <span className="font-semibold">{totalLabourHrs.toFixed(1)} hrs</span>
                                    </div>
                                    <div className="flex justify-between border-b border-neutral-100 dark:border-neutral-800 py-1">
                                        <span>Labour Cost:</span>
                                        <span className="font-semibold">{labourCost.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-neutral-100 dark:border-neutral-800 py-1">
                                        <span>Parts Cost:</span>
                                        <span className="font-semibold">{partsCost.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-neutral-100 dark:border-neutral-800 py-1">
                                        <span>Total Cost:</span>
                                        <span className="font-bold text-primary-600 dark:text-primary-400">{totalCost.toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between text-xs text-neutral-500 pt-1">
                                    <span>Actual End Time:</span>
                                    <span className="font-medium text-success-600">{new Date().toLocaleString()}</span>
                                </div>

                                {/* Parts details if any */}
                                {partsUsed.length > 0 && (
                                    <div className="mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-700 space-y-1.5">
                                        <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Parts Details</p>
                                        <div className="max-h-24 overflow-y-auto space-y-1">
                                            {partsUsed.map((p: any, idx: number) => (
                                                <div key={idx} className="flex justify-between text-xs text-neutral-600 dark:text-neutral-400">
                                                    <span className="truncate max-w-[280px]">{p.partName ?? p.partNumber ?? `Part #${idx+1}`}</span>
                                                    <span className="font-mono">
                                                        {p.quantity} x {Number(p.unitCost ?? 0).toFixed(2)} = {Number(p.totalCost ?? (Number(p.quantity ?? 0) * Number(p.unitCost ?? 0))).toFixed(2)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <WOFormField label="Closure Reason" required hint="Required to complete and close this work order">
                                <textarea
                                    value={modalData.closureReason || ""}
                                    onChange={(e) => setMD("closureReason", e.target.value)}
                                    placeholder="Summarize why this job is complete and ready to close..."
                                    rows={3}
                                    className={cn(woFieldInputClass, "resize-none min-h-[88px]")}
                                />
                            </WOFormField>

                            {/* Dropdowns Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">Root Cause Code</label>
                                    <select
                                        value={modalData.rootCauseCode || ""}
                                        onChange={(e) => setMD("rootCauseCode", e.target.value)}
                                        className="modal-input w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="">Select root cause...</option>
                                        {actionCodes.map((ac) => (
                                            <option key={ac.id} value={ac.code ?? ac.name}>
                                                {ac.code ?? ac.name} - {ac.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">Action Code</label>
                                    <select
                                        value={modalData.actionTakenCode || ""}
                                        onChange={(e) => setMD("actionTakenCode", e.target.value)}
                                        className="modal-input w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="">Select action code...</option>
                                        {actionCodes.map((ac) => (
                                            <option key={ac.id} value={ac.code ?? ac.name}>
                                                {ac.code ?? ac.name} - {ac.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Text Inputs */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">Observations</label>
                                    <textarea
                                        value={modalData.observations || ""}
                                        onChange={(e) => setMD("observations", e.target.value)}
                                        placeholder="Detailed observations about the failure/job..."
                                        rows={2}
                                        className="modal-input w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">Action Description (Notes)</label>
                                    <textarea
                                        value={modalData.actionDescription || ""}
                                        onChange={(e) => setMD("actionDescription", e.target.value)}
                                        placeholder="Describe the action taken to resolve the issue..."
                                        rows={2}
                                        className="modal-input w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">Recommendations</label>
                                    <textarea
                                        value={modalData.recommendations || ""}
                                        onChange={(e) => setMD("recommendations", e.target.value)}
                                        placeholder="Any subsequent recommendations..."
                                        rows={2}
                                        className="modal-input w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </ActionModal>
                );
            })()}

            {modal === "close" && (
                <WorkOrderReasonModal
                    title="Close Work Order"
                    subtitle="Provide a reason before closing this work order"
                    fieldLabel="Close Reason"
                    placeholder="Why is this work order being closed?"
                    value={modalData.reason || ""}
                    onChange={(v) => setMD("reason", v)}
                    onClose={closeModal}
                    onConfirm={() =>
                        handleLifecycleAction(closeMutation, "Closed", "Work order closed.", {
                            id: id!,
                            data: { reason: modalData.reason?.trim() },
                        })
                    }
                    isPending={closeMutation.isPending}
                    confirmLabel="Close Work Order"
                    confirmVariant="success"
                    disabled={!modalData.reason?.trim()}
                />
            )}

            {modal === "reject" && (
                <ActionModal title="Reject Work Order" onClose={closeModal}>
                    <div>
                        <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Rejection Reason <span className="text-red-500">*</span></label>
                        <textarea value={modalData.reason || ""} onChange={(e) => setMD("reason", e.target.value)} placeholder="Reason for rejection..." rows={3} className="modal-input resize-none" />
                    </div>
                    <ModalActions onClose={closeModal} onConfirm={() => handleLifecycleAction(rejectMutation, "Rejected", "Work order rejected.", { id: id!, data: { reason: modalData.reason } })} isPending={rejectMutation.isPending} disabled={!modalData.reason?.trim()} label="Reject" color="danger" />
                </ActionModal>
            )}

            {modal === "reopen" && (
                <WorkOrderReasonModal
                    title="Reopen Work Order"
                    subtitle="This will move the work order back to In Progress"
                    tone="warning"
                    fieldLabel="Reopen Reason"
                    placeholder="Why does this work order need to be reopened?"
                    value={modalData.reason || ""}
                    onChange={(v) => setMD("reason", v)}
                    onClose={closeModal}
                    onConfirm={() =>
                        handleLifecycleAction(reopenMutation, "Reopened", "Work order reopened.", {
                            id: id!,
                            data: { reason: modalData.reason?.trim() },
                        })
                    }
                    isPending={reopenMutation.isPending}
                    confirmLabel="Reopen Work Order"
                    confirmVariant="warning"
                    disabled={!modalData.reason?.trim()}
                />
            )}

            {modal === "decline" && (
                <ActionModal title="Decline Work Order" onClose={closeModal}>
                    <div>
                        <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Decline Reason <span className="text-red-500">*</span></label>
                        <textarea value={modalData.reason || ""} onChange={(e) => setMD("reason", e.target.value)} placeholder="Reason for declining..." rows={3} className="modal-input resize-none" />
                    </div>
                    <ModalActions onClose={closeModal} onConfirm={() => handleLifecycleAction(declineMutation, "Declined", "Work order declined.", { id: id!, data: { reason: modalData.reason } })} isPending={declineMutation.isPending} disabled={!modalData.reason?.trim()} label="Decline" color="danger" />
                </ActionModal>
            )}
        </div>
    );
}

/* ── Tab Components ── */

function OverviewTab({ wo, fmt, resolvedTechName }: { wo: any; fmt: any; resolvedTechName: string }) {
    const closureHistory = getWorkOrderClosureHistory(wo);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                {/* Job Description */}
                <div>
                    <h3 className="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">Description</h3>
                    <p className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed whitespace-pre-wrap">
                        {formatWorkOrderDescriptionDisplay(wo)}
                    </p>
                </div>

                {closureHistory.length > 0 && (
                    <div>
                        <h3 className="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">Closure History</h3>
                        <ul className="space-y-2">
                            {closureHistory.map((note, idx) => (
                                <li
                                    key={`${idx}-${note.slice(0, 24)}`}
                                    className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap pl-3 border-l-2 border-neutral-200 dark:border-neutral-700"
                                >
                                    {note}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Scheduling */}
                <div>
                    <h3 className="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">Scheduling</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <InfoCard label="Planned Start" value={wo.plannedStart ? fmt.dateTime(wo.plannedStart) : "---"} />
                        <InfoCard label="Planned End" value={wo.plannedEnd ? fmt.dateTime(wo.plannedEnd) : "---"} />
                        <InfoCard label="Actual Start" value={wo.actualStart ? fmt.dateTime(wo.actualStart) : "---"} />
                        <InfoCard label="Actual End" value={wo.actualEnd ? fmt.dateTime(wo.actualEnd) : "---"} />
                    </div>
                </div>

                {/* Findings */}
                {wo.findings && (
                    <div>
                        <h3 className="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">Findings</h3>
                        <p className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed whitespace-pre-wrap">{wo.findings}</p>
                    </div>
                )}

                {/* Completion Notes */}
                {wo.completionNotes && (
                    <div>
                        <h3 className="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">Completion Notes</h3>
                        <p className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed whitespace-pre-wrap">{wo.completionNotes}</p>
                    </div>
                )}
            </div>

            <div className="space-y-6">
                {/* Asset */}
                <SideCard title="Asset">
                    {wo.asset ? (
                        <div className="space-y-2">
                            <a href={`/app/maintenance/assets/${wo.asset.id}`} className="text-sm font-bold text-primary-600 dark:text-primary-400 hover:underline block">
                                {wo.asset.name}
                            </a>
                            <p className="text-xs text-neutral-400">{resolveMaintenanceAssetNumber(wo.asset)}</p>
                            {wo.asset.location?.name && <p className="text-xs text-neutral-400">Location: {wo.asset.location.name}</p>}
                        </div>
                    ) : (
                        <p className="text-sm text-neutral-400">No asset linked.</p>
                    )}
                </SideCard>

                {/* Details */}
                <SideCard title="Details">
                    <div className="space-y-3">
                        <DetailRow label="WO Type" value={(wo.woType || "").replace(/_/g, " ")} />
                        <DetailRow label="Priority" value={wo.priority} />
                        <DetailRow label="Estimated Hours" value={wo.estimatedHours ? `${Number(wo.estimatedHours)}h` : "---"} />
                        <DetailRow label="Lead Technician" value={resolvedTechName} />
                        <DetailRow label="Job Plan" value={wo.jobPlan?.name || "---"} />
                        <DetailRow label="Created" value={fmt.dateTime(wo.createdAt)} />
                        <DetailRow label="Updated" value={fmt.dateTime(wo.updatedAt)} />
                    </div>
                </SideCard>

                {/* Work Request */}
                {wo.workRequestId && (
                    <SideCard title="Source">
                        <a href={`/app/maintenance/work-requests/${wo.workRequestId}`} className="text-sm font-bold text-primary-600 dark:text-primary-400 hover:underline">
                            View Work Request
                        </a>
                    </SideCard>
                )}
            </div>
        </div>
    );
}

function ChecklistTab({ checklist, woId, submitMutation, canManage, status }: { checklist: any[]; woId: string; submitMutation: any; canManage: boolean; status: string }) {
    const [responses, setResponses] = useState<Record<string, string>>({});
    const isEditable = canManage && status === "IN_PROGRESS";

    const handleSubmit = async () => {
        try {
            await submitMutation.mutateAsync({ id: woId, data: { responses } });
            showSuccess("Saved", "Checklist responses saved.");
        } catch (err) {
            showApiError(err);
        }
    };

    if (!checklist || checklist.length === 0) {
        return <EmptySection title="No Checklist" message="This work order has no checklist items." />;
    }

    return (
        <div className="space-y-4">
            {checklist.map((item: any, idx: number) => (
                <div key={idx} className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-sm font-bold text-neutral-900 dark:text-white">{item.label || item.question || `Item ${idx + 1}`}</p>
                            {item.description && <p className="text-xs text-neutral-400 mt-0.5">{item.description}</p>}
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 mt-1 inline-block">{item.fieldType || item.type || "text"}</span>
                        </div>
                    </div>
                    {item.response !== undefined && item.response !== null && (
                        <p className="text-sm text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-900 rounded-lg px-3 py-2 border border-neutral-200 dark:border-neutral-700">{String(item.response)}</p>
                    )}
                    {isEditable && (
                        <input
                            type="text"
                            placeholder="Enter response..."
                            value={responses[item.id || idx] || ""}
                            onChange={(e) => setResponses((p) => ({ ...p, [item.id || idx]: e.target.value }))}
                            className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                        />
                    )}
                </div>
            ))}
            {isEditable && Object.keys(responses).length > 0 && (
                <div className="flex justify-end">
                    <button
                        onClick={handleSubmit}
                        disabled={submitMutation.isPending}
                        className="px-6 py-2 text-sm font-bold rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                        {submitMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                        Save Checklist
                    </button>
                </div>
            )}
        </div>
    );
}

function PartsTab({
    parts,
    woId,
    addMutation,
    returnMutation,
    canEdit,
    status,
}: {
    parts: any[];
    woId: string;
    addMutation: any;
    returnMutation: any;
    canEdit: boolean;
    status: string;
}) {
    const [showAdd, setShowAdd] = useState(false);
    const [partForm, setPartForm] = useState<AddPartFormState>({
        partName: "",
        partNumber: "",
        quantity: "1",
        unitCost: "",
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [returningPart, setReturningPart] = useState<{ id: string; name: string; maxQty: number } | null>(null);
    const [returnQty, setReturnQty] = useState("1");
    const [returnCondition, setReturnCondition] = useState("");
    const [returnError, setReturnError] = useState("");
    const isActive = ["IN_PROGRESS", "ON_HOLD"].includes(status);

    const handleAdd = async () => {
        const errors = validateAddPartForm(partForm);
        setFormErrors(errors);
        if (Object.keys(errors).length > 0) return;

        try {
            await addMutation.mutateAsync({
                id: woId,
                data: buildAddPartsPayload(partForm),
            });
            showSuccess("Added", "Part added to work order.");
            setPartForm({ partName: "", partNumber: "", quantity: "1", unitCost: "" });
            setFormErrors({});
            setShowAdd(false);
        } catch (err) {
            showApiError(err);
        }
    };

    const handleReturn = async () => {
        if (!returningPart) return;
        const qty = Number(returnQty);
        if (!qty || qty <= 0 || qty > returningPart.maxQty) {
            setReturnError(`Return quantity must be between 1 and ${returningPart.maxQty}`);
            return;
        }
        setReturnError("");

        try {
            await returnMutation.mutateAsync({
                id: woId,
                partId: returningPart.id,
                data: {
                    returnQty: qty,
                    returnCondition: returnCondition.trim() || undefined,
                },
            });
            showSuccess("Returned", "Part returned.");
            setReturningPart(null);
            setReturnQty("1");
            setReturnCondition("");
        } catch (err) {
            showApiError(err);
        }
    };

    return (
        <div className="space-y-5">
            {canEdit && isActive && !showAdd && !returningPart && (
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={() => setShowAdd(true)}
                        className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm shadow-primary-500/20 transition-all"
                    >
                        <Plus size={16} /> Add Part
                    </button>
                </div>
            )}

            {showAdd && (
                <WOFormPanel
                    title="Add Part"
                    subtitle="Record a spare part used on this work order"
                    icon={Package}
                    onClose={() => setShowAdd(false)}
                    footer={
                        <>
                            <WOFormButton variant="secondary" onClick={() => setShowAdd(false)}>
                                Cancel
                            </WOFormButton>
                            <WOFormButton variant="primary" onClick={handleAdd} loading={addMutation.isPending}>
                                Add Part
                            </WOFormButton>
                        </>
                    }
                >
                    <WOFormSection title="Part details">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <WOFormField label="Part Name" required error={formErrors.partName} className="sm:col-span-2">
                                <input
                                    type="text"
                                    placeholder="e.g. Bearing assembly"
                                    value={partForm.partName}
                                    onChange={(e) => {
                                        setPartForm((p) => ({ ...p, partName: e.target.value }));
                                        if (formErrors.partName) setFormErrors((prev) => ({ ...prev, partName: "" }));
                                    }}
                                    className={cn(woFieldInputClass, formErrors.partName && "border-danger-400 focus:border-danger-400 focus:ring-danger-500/20")}
                                />
                            </WOFormField>
                            <WOFormField label="Part Number" hint="Optional catalogue or SKU reference">
                                <input
                                    type="text"
                                    placeholder="e.g. BRG-2040"
                                    value={partForm.partNumber}
                                    onChange={(e) => setPartForm((p) => ({ ...p, partNumber: e.target.value }))}
                                    className={woFieldInputClass}
                                />
                            </WOFormField>
                            <WOFormField label="Quantity" required error={formErrors.quantity}>
                                <input
                                    type="number"
                                    min={0}
                                    step="any"
                                    placeholder="1"
                                    value={partForm.quantity}
                                    onChange={(e) => {
                                        setPartForm((p) => ({ ...p, quantity: e.target.value }));
                                        if (formErrors.quantity) setFormErrors((prev) => ({ ...prev, quantity: "" }));
                                    }}
                                    className={cn(woFieldInputClass, formErrors.quantity && "border-danger-400 focus:border-danger-400 focus:ring-danger-500/20")}
                                />
                            </WOFormField>
                        </div>
                    </WOFormSection>
                    <WOFormSection title="Cost">
                            <WOFormField label="Unit Cost" hint="Leave blank if cost is unknown">
                                <input
                                    type="number"
                                    min={0}
                                    step="any"
                                    placeholder="0.00"
                                    value={partForm.unitCost}
                                    onChange={(e) => setPartForm((p) => ({ ...p, unitCost: e.target.value }))}
                                    className={woFieldInputClass}
                                />
                            </WOFormField>
                    </WOFormSection>
                </WOFormPanel>
            )}

            {returningPart && (
                <WOFormPanel
                    title="Return Part"
                    subtitle={`Returning "${returningPart.name}"`}
                    icon={Undo2}
                    tone="warning"
                    onClose={() => setReturningPart(null)}
                    footer={
                        <>
                            <WOFormButton variant="secondary" onClick={() => setReturningPart(null)}>
                                Cancel
                            </WOFormButton>
                            <WOFormButton variant="warning" onClick={handleReturn} loading={returnMutation.isPending}>
                                Confirm Return
                            </WOFormButton>
                        </>
                    }
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <WOFormField label="Return Quantity" required error={returnError} hint={`Max ${returningPart.maxQty}`}>
                            <input
                                type="number"
                                min={1}
                                max={returningPart.maxQty}
                                value={returnQty}
                                onChange={(e) => {
                                    setReturnQty(e.target.value);
                                    if (returnError) setReturnError("");
                                }}
                                className={cn(woFieldInputClass, returnError && "border-danger-400")}
                            />
                        </WOFormField>
                        <WOFormField label="Return Condition" hint="e.g. Good, Damaged, Refurbished">
                            <input
                                type="text"
                                placeholder="Condition on return"
                                value={returnCondition}
                                onChange={(e) => setReturnCondition(e.target.value)}
                                className={woFieldInputClass}
                            />
                        </WOFormField>
                    </div>
                </WOFormPanel>
            )}

            {parts.length === 0 ? (
                <EmptySection title="No Parts" message="No parts have been used for this work order." />
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-neutral-200 dark:border-neutral-700 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                <th className="py-3 px-4 font-bold">Part</th>
                                <th className="py-3 px-4 font-bold">Part No.</th>
                                <th className="py-3 px-4 font-bold">Qty</th>
                                <th className="py-3 px-4 font-bold">Unit Cost</th>
                                <th className="py-3 px-4 font-bold">Total</th>
                                <th className="py-3 px-4 font-bold">Status</th>
                                {canEdit && isActive && <th className="py-3 px-4 font-bold text-right">Action</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {parts.map((p: any) => {
                                const lineTotal = computePartLineCost(p);
                                const isReturned = Boolean(p.isReturned);
                                return (
                                    <tr key={p.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0">
                                        <td className="py-3 px-4 font-medium text-neutral-900 dark:text-white">{p.partName || "---"}</td>
                                        <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400">{p.partNumber || "---"}</td>
                                        <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400">{p.quantity}</td>
                                        <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400">{p.unitCost != null ? Number(p.unitCost).toFixed(2) : "---"}</td>
                                        <td className="py-3 px-4 font-bold text-neutral-900 dark:text-white">{lineTotal > 0 ? lineTotal.toFixed(2) : "---"}</td>
                                        <td className="py-3 px-4">
                                            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize", isReturned ? "text-warning-700 bg-warning-50 border-warning-200 dark:text-warning-400 dark:bg-warning-900/20 dark:border-warning-800/50" : "text-success-700 bg-success-50 border-success-200 dark:text-success-400 dark:bg-success-900/20 dark:border-success-800/50")}>
                                                {isReturned ? "Returned" : "Used"}
                                            </span>
                                        </td>
                                        {canEdit && isActive && (
                                            <td className="py-3 px-4 text-right">
                                                {!isReturned && (
                                                    <button
                                                        onClick={() => {
                                                            setReturningPart({
                                                                id: p.id,
                                                                name: p.partName || "Part",
                                                                maxQty: Number(p.quantity) || 1,
                                                            });
                                                            setReturnQty(String(Number(p.quantity) || 1));
                                                            setReturnCondition("");
                                                        }}
                                                        disabled={returnMutation.isPending}
                                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold text-warning-700 bg-warning-50 border border-warning-200 hover:bg-warning-100 dark:text-warning-400 dark:bg-warning-900/20 dark:border-warning-800/50 transition-colors disabled:opacity-50"
                                                    >
                                                        <Undo2 size={10} /> Return
                                                    </button>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function LabourTab({
    labourLogs,
    woId,
    logMutation,
    canEdit,
    status,
    fmt,
    employeeOptions,
    companyTimezone,
    defaultTechnicianId,
}: {
    labourLogs: any[];
    woId: string;
    logMutation: any;
    canEdit: boolean;
    status: string;
    fmt: ReturnType<typeof useCompanyFormatter>;
    employeeOptions: { value: string; label: string; sublabel?: string }[];
    companyTimezone: string;
    defaultTechnicianId: string;
}) {
    const [showAdd, setShowAdd] = useState(false);
    const [logForm, setLogForm] = useState<LogLabourFormState>(() => {
        const base = emptyLogLabourForm(companyTimezone);
        return { ...base, technicianId: defaultTechnicianId };
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const isActive = ["IN_PROGRESS", "ON_HOLD"].includes(status);
    const openAddForm = () => {
        const base = emptyLogLabourForm(companyTimezone);
        setLogForm({ ...base, technicianId: defaultTechnicianId || logForm.technicianId });
        setFormErrors({});
        setShowAdd(true);
    };

    const handleAdd = async () => {
        const errors = validateLogLabourForm(logForm, companyTimezone);
        setFormErrors(errors);
        if (Object.keys(errors).length > 0) return;

        const payload = buildLogLabourPayload(logForm, companyTimezone);
        if (!payload) return;

        try {
            await logMutation.mutateAsync({ id: woId, data: payload });
            showSuccess("Logged", "Labour logged.");
            setLogForm(emptyLogLabourForm(companyTimezone));
            setFormErrors({});
            setShowAdd(false);
        } catch (err) {
            showApiError(err);
        }
    };

    return (
        <div className="space-y-5">
            {canEdit && isActive && !showAdd && (
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={openAddForm}
                        className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm shadow-primary-500/20 transition-all"
                    >
                        <Plus size={16} /> Log Labour
                    </button>
                </div>
            )}

            {showAdd && (
                <WOFormPanel
                    title="Log Labour"
                    subtitle="Record technician time and cost for this work order"
                    icon={Clock}
                    onClose={() => setShowAdd(false)}
                    footer={
                        <>
                            <WOFormButton variant="secondary" onClick={() => setShowAdd(false)}>
                                Cancel
                            </WOFormButton>
                            <WOFormButton variant="primary" onClick={handleAdd} loading={logMutation.isPending}>
                                Log Labour
                            </WOFormButton>
                        </>
                    }
                >
                    <WOFormSection title="Technician">
                        <WOFormField label="Technician" required error={formErrors.technicianId}>
                            <SearchableSelect
                                value={logForm.technicianId}
                                onChange={(v) => {
                                    setLogForm((p) => ({ ...p, technicianId: v }));
                                    if (formErrors.technicianId) setFormErrors((prev) => ({ ...prev, technicianId: "" }));
                                }}
                                options={employeeOptions}
                                placeholder="Search and select technician..."
                            />
                        </WOFormField>
                    </WOFormSection>

                    <LabourQuickTimer
                        timezone={companyTimezone}
                        onTimerStart={({ startTime }) => {
                            setLogForm((p) => ({
                                ...p,
                                startTime,
                                endTime: "",
                            }));
                            if (formErrors.startTime) setFormErrors((prev) => ({ ...prev, startTime: "" }));
                        }}
                        onTimerStop={({ startTime, endTime, hours }) => {
                            setLogForm((p) => ({
                                ...p,
                                startTime,
                                endTime,
                                hours,
                            }));
                            if (formErrors.startTime) setFormErrors((prev) => ({ ...prev, startTime: "" }));
                            if (formErrors.hours) setFormErrors((prev) => ({ ...prev, hours: "" }));
                        }}
                    />

                    <WOFormSection title="Time & duration">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <WOFormField label="Start Time" required error={formErrors.startTime}>
                                <input
                                    type="datetime-local"
                                    value={logForm.startTime}
                                    onChange={(e) => {
                                        setLogForm((p) => ({ ...p, startTime: e.target.value }));
                                        if (formErrors.startTime) setFormErrors((prev) => ({ ...prev, startTime: "" }));
                                    }}
                                    className={cn(woFieldInputClass, formErrors.startTime && "border-danger-400")}
                                />
                            </WOFormField>
                            <WOFormField label="End Time" hint="Optional — used to calculate hours">
                                <input
                                    type="datetime-local"
                                    value={logForm.endTime}
                                    onChange={(e) => setLogForm((p) => ({ ...p, endTime: e.target.value }))}
                                    className={woFieldInputClass}
                                />
                            </WOFormField>
                            <WOFormField label="Hours Worked" required error={formErrors.hours} hint="Total labour hours for this entry">
                                <input
                                    type="number"
                                    min={0}
                                    step="any"
                                    placeholder="e.g. 2.5"
                                    value={logForm.hours}
                                    onChange={(e) => {
                                        setLogForm((p) => ({ ...p, hours: e.target.value }));
                                        if (formErrors.hours) setFormErrors((prev) => ({ ...prev, hours: "" }));
                                    }}
                                    className={cn(woFieldInputClass, formErrors.hours && "border-danger-400")}
                                />
                            </WOFormField>
                        </div>
                    </WOFormSection>

                    <WOFormSection title="Cost & notes">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <WOFormField label="Hourly Rate" hint="Optional — used to compute total labour cost">
                                <input
                                    type="number"
                                    min={0}
                                    step="any"
                                    placeholder="0.00"
                                    value={logForm.hourlyRate}
                                    onChange={(e) => setLogForm((p) => ({ ...p, hourlyRate: e.target.value }))}
                                    className={woFieldInputClass}
                                />
                            </WOFormField>
                            <WOFormField label="Notes" className="sm:col-span-2">
                                <textarea
                                    rows={3}
                                    placeholder="Describe work performed..."
                                    value={logForm.notes}
                                    onChange={(e) => setLogForm((p) => ({ ...p, notes: e.target.value }))}
                                    className={cn(woFieldInputClass, "resize-none min-h-[88px]")}
                                />
                            </WOFormField>
                        </div>
                    </WOFormSection>
                </WOFormPanel>
            )}

            {labourLogs.length === 0 ? (
                <EmptySection title="No Labour Logs" message="No labour has been logged for this work order." />
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-neutral-200 dark:border-neutral-700 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                <th className="py-3 px-4 font-bold">Technician</th>
                                <th className="py-3 px-4 font-bold">Start</th>
                                <th className="py-3 px-4 font-bold">End</th>
                                <th className="py-3 px-4 font-bold">Hours</th>
                                <th className="py-3 px-4 font-bold">Rate/Hr</th>
                                <th className="py-3 px-4 font-bold">Total</th>
                                <th className="py-3 px-4 font-bold">Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {labourLogs.map((l: any) => (
                                <tr key={l.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0">
                                    <td className="py-3 px-4 font-medium text-neutral-900 dark:text-white">
                                        {resolveTechnicianName(l.technicianId, employeeOptions)}
                                    </td>
                                    <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400 text-xs">
                                        {l.startTime ? fmt.dateTime(l.startTime) : "---"}
                                    </td>
                                    <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400 text-xs">
                                        {l.endTime ? fmt.dateTime(l.endTime) : "---"}
                                    </td>
                                    <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400">{Number(l.hours || 0).toFixed(1)}h</td>
                                    <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400">
                                        {l.hourlyRate != null ? Number(l.hourlyRate).toFixed(2) : "---"}
                                    </td>
                                    <td className="py-3 px-4 font-bold text-neutral-900 dark:text-white">
                                        {computeLabourLineCost(l) > 0 ? computeLabourLineCost(l).toFixed(2) : "---"}
                                    </td>
                                    <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400 text-xs max-w-[200px] truncate">{l.notes || "---"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function CostTab({ labourCost, partsCost, vendorCost, totalCost }: { labourCost: number; partsCost: number; vendorCost: number; totalCost: number }) {
    return (
        <div className="max-w-md space-y-4">
            <h3 className="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Cost Summary</h3>
            <div className="space-y-3">
                <CostRow label="Labour Cost" value={labourCost} />
                <CostRow label="Parts Cost" value={partsCost} />
                <CostRow label="Vendor Cost" value={vendorCost} />
                <div className="border-t border-neutral-200 dark:border-neutral-700 pt-3">
                    <CostRow label="Total Cost" value={totalCost} bold />
                </div>
            </div>
        </div>
    );
}

function HistoryTab({ events, fmt }: { events: any[]; fmt: any }) {
    if (!events || events.length === 0) {
        return <EmptySection title="No History" message="No events recorded." />;
    }

    return (
        <div className="space-y-3">
            {events.map((evt: any, idx: number) => (
                <div key={evt.id || idx} className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                    <div>
                        <p className="text-sm font-bold text-neutral-900 dark:text-white">
                            {(evt.eventType || evt.action || "Event").replace(/_/g, " ")}
                        </p>
                        {evt.description && <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">{evt.description}</p>}
                        <p className="text-[10px] text-neutral-400">
                            {evt.createdAt ? fmt.dateTime(evt.createdAt) : "---"}
                            {(evt.performedByName || evt.performedById) && ` by ${evt.performedByName || evt.performedById}`}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ── Shared Components ── */

function ActionBtn({ icon, label, color, onClick, isPending }: { icon: React.ReactNode; label: string; color: string; onClick: () => void; isPending?: boolean }) {
    const colorMap: Record<string, string> = {
        success: "bg-success-600 hover:bg-success-700 text-white",
        danger: "bg-danger-600 hover:bg-danger-700 text-white",
        warning: "bg-warning-500 hover:bg-warning-600 text-white",
        blue: "bg-blue-600 hover:bg-blue-700 text-white",
        accent: "bg-accent-600 hover:bg-accent-700 text-white",
        cyan: "bg-cyan-600 hover:bg-cyan-700 text-white",
        emerald: "bg-emerald-600 hover:bg-emerald-700 text-white",
        neutral: "bg-neutral-600 hover:bg-neutral-700 text-white",
    };
    return (
        <button
            onClick={onClick}
            disabled={isPending}
            className={cn("inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50", colorMap[color] || colorMap.neutral)}
        >
            {isPending ? <Loader2 size={16} className="animate-spin" /> : icon}
            {label}
        </button>
    );
}

function ActionModal({
    title,
    onClose,
    children,
    className,
    footer,
}: {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
    className?: string;
    footer?: React.ReactNode;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
            <div
                className={cn(
                    "bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-h-[min(92vh,900px)] flex flex-col animate-in fade-in zoom-in-95 duration-200",
                    className || "max-w-md",
                )}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 shrink-0">
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white">{title}</h3>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:text-neutral-300 dark:hover:bg-neutral-800 transition-colors">
                        <X size={18} />
                    </button>
                </div>
                <div className={cn("px-6 py-4 space-y-4", footer ? "flex-1 min-h-0 overflow-y-auto overscroll-contain" : "")}>
                    {children}
                </div>
                {footer ? (
                    <div className="shrink-0 px-6 py-4 border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-b-3xl">
                        {footer}
                    </div>
                ) : null}
            </div>
        </div>
    );
}

function ModalActions({ onClose, onConfirm, isPending, disabled, label, color = "primary" }: { onClose: () => void; onConfirm: () => void; isPending: boolean; disabled?: boolean; label: string; color?: string }) {
    const colorMap: Record<string, string> = {
        primary: "bg-primary-600 hover:bg-primary-700",
        danger: "bg-danger-600 hover:bg-danger-700",
        warning: "bg-warning-500 hover:bg-warning-600",
        success: "bg-success-600 hover:bg-success-700",
    };
    return (
        <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-xl border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
            <button
                onClick={onConfirm}
                disabled={isPending || disabled}
                className={cn("px-6 py-2 text-sm font-bold rounded-xl text-white disabled:opacity-50 transition-colors flex items-center gap-2", colorMap[color] || colorMap.primary)}
            >
                {isPending && <Loader2 size={14} className="animate-spin" />}
                {label}
            </button>
        </div>
    );
}

function SideCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-neutral-50 dark:bg-neutral-800/30 rounded-xl border border-neutral-100 dark:border-neutral-800 p-4">
            <h3 className="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">{title}</h3>
            {children}
        </div>
    );
}

function InfoCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-3">
            <p className="text-[10px] text-neutral-400 uppercase tracking-wider mb-1">{label}</p>
            <p className="text-sm font-bold text-neutral-900 dark:text-white">{value}</p>
        </div>
    );
}

function DetailRow({ label, value }: { label: string; value: any }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500 dark:text-neutral-400">{label}</span>
            <span className="text-xs font-medium text-neutral-900 dark:text-white">{value || "---"}</span>
        </div>
    );
}

function CostRow({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
    return (
        <div className="flex items-center justify-between">
            <span className={cn("text-sm", bold ? "font-bold text-neutral-900 dark:text-white" : "text-neutral-600 dark:text-neutral-400")}>{label}</span>
            <span className={cn("text-sm", bold ? "font-bold text-primary-600 dark:text-primary-400" : "font-medium text-neutral-900 dark:text-white")}>{value.toFixed(2)}</span>
        </div>
    );
}

function EmptySection({ title, message }: { title: string; message: string }) {
    return (
        <div className="text-center py-12">
            <p className="text-sm font-bold text-neutral-500 dark:text-neutral-400">{title}</p>
            <p className="text-xs text-neutral-400 mt-1">{message}</p>
        </div>
    );
}
