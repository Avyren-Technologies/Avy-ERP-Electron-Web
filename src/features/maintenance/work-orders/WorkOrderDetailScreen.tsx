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
    Upload,
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
import { useWorkOrder } from "@/features/maintenance/api/use-maintenance-queries";
import {
    useAssignWO,
    useAcknowledgeWO,
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
    useUpdateWorkOrder,
} from "@/features/maintenance/api/use-maintenance-mutations";
import { useCompanyFormatter } from "@/hooks/useCompanyFormatter";
import { useCanPerform } from "@/hooks/useCanPerform";
import { PriorityBadge } from "@/features/maintenance/shared/PriorityBadge";
import { WOStatusBadge, WOTypeBadge } from "@/features/maintenance/shared/WOStatusBadge";
import { showSuccess, showApiError } from "@/lib/toast";
import { useEmployees } from "@/features/company-admin/api/use-hr-queries";
import { SearchableSelect } from "@/components/ui/SearchableSelect";

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

/* ── Screen ── */

export function WorkOrderDetailScreen() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const fmt = useCompanyFormatter();
    const canManage = useCanPerform("maintenance.work-orders:approve");

    const [activeTab, setActiveTab] = useState<TabKey>("overview");

    // Modals
    const [modal, setModal] = useState<string | null>(null);
    const [modalData, setModalData] = useState<Record<string, string>>({});

    // Query
    const { data, isLoading, isError } = useWorkOrder(id!);
    const wo: any = data?.data ?? null;

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

    // Mutations
    const assignMutation = useAssignWO();
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
    const updateMutation = useUpdateWorkOrder();

    // Client-side simulated status overrides
    const [localStatusOverride, setLocalStatusOverride] = useState<string | null>(() => {
        return id ? localStorage.getItem(`wo_${id}_status`) : null;
    });

    const updateLocalStatus = (newStatus: string) => {
        setLocalStatusOverride(newStatus);
        if (id) {
            localStorage.setItem(`wo_${id}_status`, newStatus);
        }
    };

    const openModal = (name: string) => {
        setModal(name);
        setModalData({});
    };
    const closeModal = () => {
        setModal(null);
        setModalData({});
    };
    const setMD = (key: string, value: string) => setModalData((p) => ({ ...p, [key]: value }));

    // Action handlers
    const handleLifecycleAction = async (
        mutation: any,
        targetStatus: string,
        successTitle: string,
        successMsg: string,
        payload: any = { id: id! }
    ) => {
        const rawStatus = wo?.status;
        if (rawStatus === "DRAFT" || rawStatus === "PLANNED") {
            updateLocalStatus(targetStatus);
            showSuccess(successTitle, successMsg);
            closeModal();
        } else {
            try {
                await mutation.mutateAsync(payload);
                updateLocalStatus(targetStatus);
                showSuccess(successTitle, successMsg);
                closeModal();
            } catch (err) {
                showApiError(err);
            }
        }
    };

    const handleAssignConfirm = async () => {
        const techId = modalData.techId?.trim();
        if (!techId) return;

        // Resolve display name from picker options for list-screen persistence
        const techLabel = employeeOptions.find(o => o.value === techId)?.label ?? "";

        if (rawStatus === "DRAFT" || rawStatus === "PLANNED") {
            try {
                await updateMutation.mutateAsync({
                    id: id!,
                    data: { leadTechnicianId: techId }
                });
                updateLocalStatus("ASSIGNED");
                if (techLabel && id) localStorage.setItem(`wo_${id}_techName`, techLabel);
                showSuccess("Assigned", "Work order assigned persistently.");
                closeModal();
            } catch (err) {
                showApiError(err);
            }
        } else {
            try {
                await assignMutation.mutateAsync({
                    id: id!,
                    data: { leadTechnicianId: techId }
                });
                updateLocalStatus("ASSIGNED");
                if (techLabel && id) localStorage.setItem(`wo_${id}_techName`, techLabel);
                showSuccess("Assigned", "Work order assigned.");
                closeModal();
            } catch (err) {
                showApiError(err);
            }
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
    const evidence: any[] = wo.evidence ?? [];
    const events: any[] = wo.events ?? [];
    const checklist: any[] = wo.checklistSnapshot ?? [];

    const labourCost = labourLogs.reduce((s: number, l: any) => s + Number(l.cost || 0), 0);
    const partsCost = parts.reduce((s: number, p: any) => s + Number(p.totalCost || 0), 0);
    const vendorCost = Number(wo.vendorCost || 0);
    const totalCost = labourCost + partsCost + vendorCost;

    const rawStatus = wo.status;
    let status = localStatusOverride || rawStatus;
    if (status === "DRAFT" && (wo.leadTechnicianId || wo.leadTechnicianName)) {
        status = "ASSIGNED";
    }

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
                        {status === "DRAFT" && (
                            <ActionBtn icon={<CheckCircle className="w-4 h-4" />} label="Approve" color="success" onClick={() => {
                                updateLocalStatus("APPROVED");
                                showSuccess("Approved", "Work order approved.");
                            }} />
                        )}
                        {(status === "APPROVED" || status === "DRAFT" || status === "PLANNED") && (
                            <ActionBtn icon={<UserPlus className="w-4 h-4" />} label="Assign" color="accent" onClick={() => openModal("assign")} />
                        )}
                        {status === "ASSIGNED" && (
                            <>
                                <ActionBtn icon={<ThumbsUp className="w-4 h-4" />} label="Acknowledge" color="cyan" onClick={() => handleLifecycleAction(ackMutation, "ACKNOWLEDGED", "Acknowledged", "Work order acknowledged.")} isPending={ackMutation.isPending} />
                                <ActionBtn icon={<ThumbsDown className="w-4 h-4" />} label="Decline" color="danger" onClick={() => openModal("decline")} />
                            </>
                        )}
                        {(status === "ASSIGNED" || status === "ACKNOWLEDGED") && (
                            <ActionBtn icon={<Play className="w-4 h-4" />} label="Start" color="blue" onClick={() => handleLifecycleAction(startMutation, "IN_PROGRESS", "Started", "Work order started.")} isPending={startMutation.isPending} />
                        )}
                        {status === "IN_PROGRESS" && (
                            <>
                                <ActionBtn icon={<Pause className="w-4 h-4" />} label="Hold" color="warning" onClick={() => openModal("hold")} />
                                <ActionBtn icon={<CheckCircle className="w-4 h-4" />} label="Complete" color="success" onClick={() => openModal("complete")} />
                            </>
                        )}
                        {status === "ON_HOLD" && (
                            <ActionBtn icon={<Play className="w-4 h-4" />} label="Resume" color="blue" onClick={() => handleLifecycleAction(resumeMutation, "IN_PROGRESS", "Resumed", "Work order resumed.")} isPending={resumeMutation.isPending} />
                        )}
                        {status === "QA_REVIEW" && (
                            <>
                                <ActionBtn icon={<ShieldCheck className="w-4 h-4" />} label="QA Release" color="emerald" onClick={() => handleLifecycleAction(qaReleaseMutation, "AWAITING_QA", "QA Released", "Work order QA released.")} isPending={qaReleaseMutation.isPending} />
                                <ActionBtn icon={<ThumbsDown className="w-4 h-4" />} label="Reject" color="danger" onClick={() => openModal("reject")} />
                            </>
                        )}
                        {(status === "COMPLETED" || status === "QA_RELEASED") && (
                            <ActionBtn icon={<Lock className="w-4 h-4" />} label="Close" color="neutral" onClick={() => openModal("close")} />
                        )}
                        {status === "CLOSED" && (
                            <ActionBtn icon={<RotateCcw className="w-4 h-4" />} label="Reopen" color="warning" onClick={() => openModal("reopen")} />
                        )}
                        {!["CLOSED", "CANCELLED", "COMPLETED", "QA_REVIEW", "QA_RELEASED"].includes(status) && (
                            <ActionBtn icon={<Ban className="w-4 h-4" />} label="Cancel" color="danger" onClick={() => handleLifecycleAction(cancelMutation, "CANCELLED", "Cancelled", "Work order cancelled.")} isPending={cancelMutation.isPending} />
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
                    {activeTab === "overview" && <OverviewTab wo={wo} fmt={fmt} />}
                    {activeTab === "checklist" && <ChecklistTab checklist={checklist} woId={id!} submitMutation={submitChecklistMutation} canManage={canManage} status={status} />}
                    {activeTab === "parts" && <PartsTab parts={parts} woId={id!} addMutation={addPartsMutation} returnMutation={returnPartMutation} canManage={canManage} status={status} />}
                    {activeTab === "labour" && <LabourTab labourLogs={labourLogs} woId={id!} logMutation={logLabourMutation} canManage={canManage} status={status} fmt={fmt} />}
                    {activeTab === "evidence" && <EvidenceTab evidence={evidence} woId={id!} addMutation={addEvidenceMutation} canManage={canManage} status={status} />}
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
                    <ModalActions onClose={closeModal} onConfirm={handleAssignConfirm} isPending={assignMutation.isPending || updateMutation.isPending} disabled={!modalData.techId?.trim()} label="Assign" />
                </ActionModal>
            )}

            {modal === "hold" && (
                <ActionModal title="Hold Work Order" onClose={closeModal}>
                    <div>
                        <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Hold Reason <span className="text-red-500">*</span></label>
                        <textarea value={modalData.reason || ""} onChange={(e) => setMD("reason", e.target.value)} placeholder="Reason for putting on hold..." rows={3} className="modal-input resize-none" />
                    </div>
                    <ModalActions onClose={closeModal} onConfirm={() => handleLifecycleAction(holdMutation, "ON_HOLD", "On Hold", "Work order put on hold.", { id: id!, data: { holdReason: modalData.reason } })} isPending={holdMutation.isPending} disabled={!modalData.reason?.trim()} label="Put on Hold" color="warning" />
                </ActionModal>
            )}

            {modal === "complete" && (
                <ActionModal title="Complete Work Order" onClose={closeModal}>
                    <div>
                        <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Completion Notes</label>
                        <textarea value={modalData.notes || ""} onChange={(e) => setMD("notes", e.target.value)} placeholder="Notes about the completion..." rows={3} className="modal-input resize-none" />
                    </div>
                    <ModalActions onClose={closeModal} onConfirm={() => handleLifecycleAction(completeMutation, "COMPLETED", "Completed", "Work order completed.", { id: id!, data: { completionNotes: modalData.notes || undefined } })} isPending={completeMutation.isPending} label="Complete" color="success" />
                </ActionModal>
            )}

            {modal === "close" && (
                <ActionModal title="Close Work Order" onClose={closeModal}>
                    <div>
                        <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Closing Notes</label>
                        <textarea value={modalData.notes || ""} onChange={(e) => setMD("notes", e.target.value)} placeholder="Final closing notes..." rows={3} className="modal-input resize-none" />
                    </div>
                    <ModalActions onClose={closeModal} onConfirm={() => handleLifecycleAction(closeMutation, "CLOSED", "Closed", "Work order closed.", { id: id!, data: modalData.notes ? { closingNotes: modalData.notes } : undefined })} isPending={closeMutation.isPending} label="Close" />
                </ActionModal>
            )}

            {modal === "reject" && (
                <ActionModal title="Reject Work Order" onClose={closeModal}>
                    <div>
                        <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Rejection Reason <span className="text-red-500">*</span></label>
                        <textarea value={modalData.reason || ""} onChange={(e) => setMD("reason", e.target.value)} placeholder="Reason for rejection..." rows={3} className="modal-input resize-none" />
                    </div>
                    <ModalActions onClose={closeModal} onConfirm={() => handleLifecycleAction(rejectMutation, "REJECTED", "Rejected", "Work order rejected.", { id: id!, data: { rejectionReason: modalData.reason } })} isPending={rejectMutation.isPending} disabled={!modalData.reason?.trim()} label="Reject" color="danger" />
                </ActionModal>
            )}

            {modal === "reopen" && (
                <ActionModal title="Reopen Work Order" onClose={closeModal}>
                    <div>
                        <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Reopen Reason <span className="text-red-500">*</span></label>
                        <textarea value={modalData.reason || ""} onChange={(e) => setMD("reason", e.target.value)} placeholder="Reason for reopening..." rows={3} className="modal-input resize-none" />
                    </div>
                    <ModalActions onClose={closeModal} onConfirm={() => handleLifecycleAction(reopenMutation, "IN_PROGRESS", "Reopened", "Work order reopened.", { id: id!, data: { reopenReason: modalData.reason } })} isPending={reopenMutation.isPending} disabled={!modalData.reason?.trim()} label="Reopen" color="warning" />
                </ActionModal>
            )}

            {modal === "decline" && (
                <ActionModal title="Decline Work Order" onClose={closeModal}>
                    <div>
                        <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Decline Reason <span className="text-red-500">*</span></label>
                        <textarea value={modalData.reason || ""} onChange={(e) => setMD("reason", e.target.value)} placeholder="Reason for declining..." rows={3} className="modal-input resize-none" />
                    </div>
                    <ModalActions onClose={closeModal} onConfirm={() => handleLifecycleAction(null, "APPROVED", "Declined", "Work order declined.")} isPending={false} disabled={!modalData.reason?.trim()} label="Decline" color="danger" />
                </ActionModal>
            )}
        </div>
    );
}

/* ── Tab Components ── */

function OverviewTab({ wo, fmt }: { wo: any; fmt: any }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                {/* Job Description */}
                <div>
                    <h3 className="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">Description</h3>
                    <p className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed whitespace-pre-wrap">
                        {wo.description || wo.observations || wo.workRequests?.[0]?.description || "No description provided."}
                    </p>
                </div>

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
                            <p className="text-xs text-neutral-400">{wo.asset.assetNumber}</p>
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
                        <DetailRow label="Lead Technician" value={wo.leadTechnicianName || wo.leadTechnicianId || "---"} />
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

function PartsTab({ parts, woId, addMutation, returnMutation, canManage, status }: { parts: any[]; woId: string; addMutation: any; returnMutation: any; canManage: boolean; status: string }) {
    const [showAdd, setShowAdd] = useState(false);
    const [partForm, setPartForm] = useState({ itemName: "", quantity: "1", unitCost: "" });
    const isActive = ["IN_PROGRESS", "ON_HOLD"].includes(status);

    const handleAdd = async () => {
        try {
            await addMutation.mutateAsync({
                id: woId,
                data: {
                    itemName: partForm.itemName,
                    quantity: Number(partForm.quantity),
                    unitCost: partForm.unitCost ? Number(partForm.unitCost) : undefined,
                },
            });
            showSuccess("Added", "Part added to work order.");
            setPartForm({ itemName: "", quantity: "1", unitCost: "" });
            setShowAdd(false);
        } catch (err) {
            showApiError(err);
        }
    };

    const handleReturn = async (partId: string) => {
        try {
            await returnMutation.mutateAsync({ id: woId, partId, data: { quantity: 1 } });
            showSuccess("Returned", "Part returned.");
        } catch (err) {
            showApiError(err);
        }
    };

    return (
        <div className="space-y-4">
            {canManage && isActive && (
                <div className="flex justify-end">
                    <button onClick={() => setShowAdd(!showAdd)} className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl font-bold text-sm transition-all">
                        <Plus size={16} /> Add Part
                    </button>
                </div>
            )}

            {showAdd && (
                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <input type="text" placeholder="Item name" value={partForm.itemName} onChange={(e) => setPartForm((p) => ({ ...p, itemName: e.target.value }))} className="modal-input" />
                        <input type="number" placeholder="Quantity" value={partForm.quantity} onChange={(e) => setPartForm((p) => ({ ...p, quantity: e.target.value }))} className="modal-input" />
                        <input type="number" placeholder="Unit cost" value={partForm.unitCost} onChange={(e) => setPartForm((p) => ({ ...p, unitCost: e.target.value }))} className="modal-input" />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400">Cancel</button>
                        <button onClick={handleAdd} disabled={addMutation.isPending || !partForm.itemName.trim()} className="px-4 py-1.5 text-sm font-bold rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 flex items-center gap-1.5">
                            {addMutation.isPending && <Loader2 size={12} className="animate-spin" />}
                            Add
                        </button>
                    </div>
                </div>
            )}

            {parts.length === 0 ? (
                <EmptySection title="No Parts" message="No parts have been used for this work order." />
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-neutral-200 dark:border-neutral-700 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                <th className="py-3 px-4 font-bold">Item</th>
                                <th className="py-3 px-4 font-bold">Qty</th>
                                <th className="py-3 px-4 font-bold">Unit Cost</th>
                                <th className="py-3 px-4 font-bold">Total</th>
                                <th className="py-3 px-4 font-bold">Status</th>
                                {canManage && isActive && <th className="py-3 px-4 font-bold text-right">Action</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {parts.map((p: any) => (
                                <tr key={p.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0">
                                    <td className="py-3 px-4 font-medium text-neutral-900 dark:text-white">{p.itemName || p.inventoryItem?.name || "---"}</td>
                                    <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400">{p.quantity}</td>
                                    <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400">{p.unitCost ? Number(p.unitCost).toFixed(2) : "---"}</td>
                                    <td className="py-3 px-4 font-bold text-neutral-900 dark:text-white">{p.totalCost ? Number(p.totalCost).toFixed(2) : "---"}</td>
                                    <td className="py-3 px-4">
                                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize", p.returned ? "text-warning-700 bg-warning-50 border-warning-200 dark:text-warning-400 dark:bg-warning-900/20 dark:border-warning-800/50" : "text-success-700 bg-success-50 border-success-200 dark:text-success-400 dark:bg-success-900/20 dark:border-success-800/50")}>
                                            {p.returned ? "Returned" : "Used"}
                                        </span>
                                    </td>
                                    {canManage && isActive && (
                                        <td className="py-3 px-4 text-right">
                                            {!p.returned && (
                                                <button onClick={() => handleReturn(p.id)} disabled={returnMutation.isPending} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold text-warning-700 bg-warning-50 border border-warning-200 hover:bg-warning-100 dark:text-warning-400 dark:bg-warning-900/20 dark:border-warning-800/50 transition-colors disabled:opacity-50">
                                                    <Undo2 size={10} /> Return
                                                </button>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function LabourTab({ labourLogs, woId, logMutation, canManage, status, fmt }: { labourLogs: any[]; woId: string; logMutation: any; canManage: boolean; status: string; fmt: any }) {
    const [showAdd, setShowAdd] = useState(false);
    const [logForm, setLogForm] = useState({ technicianName: "", hours: "", description: "", costPerHour: "" });
    const isActive = ["IN_PROGRESS", "ON_HOLD"].includes(status);

    const handleAdd = async () => {
        try {
            await logMutation.mutateAsync({
                id: woId,
                data: {
                    technicianName: logForm.technicianName,
                    hours: Number(logForm.hours),
                    description: logForm.description || undefined,
                    costPerHour: logForm.costPerHour ? Number(logForm.costPerHour) : undefined,
                },
            });
            showSuccess("Logged", "Labour logged.");
            setLogForm({ technicianName: "", hours: "", description: "", costPerHour: "" });
            setShowAdd(false);
        } catch (err) {
            showApiError(err);
        }
    };

    return (
        <div className="space-y-4">
            {canManage && isActive && (
                <div className="flex justify-end">
                    <button onClick={() => setShowAdd(!showAdd)} className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl font-bold text-sm transition-all">
                        <Plus size={16} /> Log Labour
                    </button>
                </div>
            )}

            {showAdd && (
                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input type="text" placeholder="Technician name" value={logForm.technicianName} onChange={(e) => setLogForm((p) => ({ ...p, technicianName: e.target.value }))} className="modal-input" />
                        <input type="number" placeholder="Hours" value={logForm.hours} onChange={(e) => setLogForm((p) => ({ ...p, hours: e.target.value }))} className="modal-input" />
                        <input type="number" placeholder="Cost per hour" value={logForm.costPerHour} onChange={(e) => setLogForm((p) => ({ ...p, costPerHour: e.target.value }))} className="modal-input" />
                        <input type="text" placeholder="Description" value={logForm.description} onChange={(e) => setLogForm((p) => ({ ...p, description: e.target.value }))} className="modal-input" />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400">Cancel</button>
                        <button onClick={handleAdd} disabled={logMutation.isPending || !logForm.technicianName.trim() || !logForm.hours} className="px-4 py-1.5 text-sm font-bold rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 flex items-center gap-1.5">
                            {logMutation.isPending && <Loader2 size={12} className="animate-spin" />}
                            Log
                        </button>
                    </div>
                </div>
            )}

            {labourLogs.length === 0 ? (
                <EmptySection title="No Labour Logs" message="No labour has been logged for this work order." />
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-neutral-200 dark:border-neutral-700 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                <th className="py-3 px-4 font-bold">Technician</th>
                                <th className="py-3 px-4 font-bold">Hours</th>
                                <th className="py-3 px-4 font-bold">Cost/Hr</th>
                                <th className="py-3 px-4 font-bold">Total Cost</th>
                                <th className="py-3 px-4 font-bold">Description</th>
                                <th className="py-3 px-4 font-bold">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {labourLogs.map((l: any) => (
                                <tr key={l.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0">
                                    <td className="py-3 px-4 font-medium text-neutral-900 dark:text-white">{l.technicianName || l.technicianId || "---"}</td>
                                    <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400">{Number(l.hours || 0)}h</td>
                                    <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400">{l.costPerHour ? Number(l.costPerHour).toFixed(2) : "---"}</td>
                                    <td className="py-3 px-4 font-bold text-neutral-900 dark:text-white">{l.cost ? Number(l.cost).toFixed(2) : "---"}</td>
                                    <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400 text-xs max-w-[200px] truncate">{l.description || "---"}</td>
                                    <td className="py-3 px-4 text-neutral-400 text-xs">{l.createdAt ? fmt.dateTime(l.createdAt) : "---"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function EvidenceTab({ evidence, woId, addMutation, canManage, status }: { evidence: any[]; woId: string; addMutation: any; canManage: boolean; status: string }) {
    const [showAdd, setShowAdd] = useState(false);
    const [url, setUrl] = useState("");
    const [description, setDescription] = useState("");
    const isActive = !["CLOSED", "CANCELLED"].includes(status);

    const handleAdd = async () => {
        try {
            await addMutation.mutateAsync({ id: woId, data: { url, description: description || undefined } });
            showSuccess("Added", "Evidence added.");
            setUrl("");
            setDescription("");
            setShowAdd(false);
        } catch (err) {
            showApiError(err);
        }
    };

    return (
        <div className="space-y-4">
            {canManage && isActive && (
                <div className="flex justify-end">
                    <button onClick={() => setShowAdd(!showAdd)} className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl font-bold text-sm transition-all">
                        <Upload size={16} /> Add Evidence
                    </button>
                </div>
            )}

            {showAdd && (
                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 space-y-3">
                    <input type="url" placeholder="File/image URL" value={url} onChange={(e) => setUrl(e.target.value)} className="modal-input" />
                    <input type="text" placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} className="modal-input" />
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400">Cancel</button>
                        <button onClick={handleAdd} disabled={addMutation.isPending || !url.trim()} className="px-4 py-1.5 text-sm font-bold rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 flex items-center gap-1.5">
                            {addMutation.isPending && <Loader2 size={12} className="animate-spin" />}
                            Add
                        </button>
                    </div>
                </div>
            )}

            {evidence.length === 0 ? (
                <EmptySection title="No Evidence" message="No evidence has been added to this work order." />
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {evidence.map((e: any, idx: number) => (
                        <div key={e.id || idx} className="rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                            {e.url && /\.(jpg|jpeg|png|gif|webp)$/i.test(e.url) ? (
                                <img src={e.url} alt={e.description || `Evidence ${idx + 1}`} className="w-full aspect-square object-cover" />
                            ) : (
                                <div className="w-full aspect-square flex items-center justify-center">
                                    <Image size={32} className="text-neutral-400" />
                                </div>
                            )}
                            {e.description && (
                                <p className="text-xs text-neutral-600 dark:text-neutral-400 p-2 truncate">{e.description}</p>
                            )}
                        </div>
                    ))}
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

function ActionModal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white">{title}</h3>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:text-neutral-300 dark:hover:bg-neutral-800 transition-colors">
                        <X size={18} />
                    </button>
                </div>
                <div className="px-6 py-4 space-y-4">{children}</div>
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
