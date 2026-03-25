import { useState } from "react";
import {
    ArrowLeftRight,
    Plus,
    Loader2,
    X,
    Search,
    Eye,
    CheckCircle2,
    XCircle,
    ArrowRightCircle,
    Ban,
    Clock,
    ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTransfers } from "@/features/company-admin/api/use-transfer-queries";
import {
    useCreateTransfer,
    useApproveTransfer,
    useApplyTransfer,
    useRejectTransfer,
    useCancelTransfer,
} from "@/features/company-admin/api/use-transfer-mutations";
import { useEmployees } from "@/features/company-admin/api/use-hr-queries";
import { useDepartments, useDesignations } from "@/features/company-admin/api/use-hr-queries";
import { useCompanyLocations } from "@/features/company-admin/api/use-company-admin-queries";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Helpers ── */

const formatDate = (d: string | null | undefined) => {
    if (!d) return "\u2014";
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

function TransferStatusBadge({ status }: { status: string }) {
    const colorMap: Record<string, string> = {
        requested: "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50",
        approved: "bg-info-50 text-info-700 border-info-200 dark:bg-info-900/20 dark:text-info-400 dark:border-info-800/50",
        applied: "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50",
        rejected: "bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50",
        cancelled: "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700",
    };
    const cls = colorMap[status?.toLowerCase()] ?? colorMap.requested;
    return <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize", cls)}>{status || "Requested"}</span>;
}

function TypeBadge({ type }: { type: string }) {
    const colorMap: Record<string, string> = {
        lateral: "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400",
        relocation: "bg-accent-50 text-accent-700 border-accent-200 dark:bg-accent-900/20 dark:text-accent-400",
        restructuring: "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400",
    };
    const cls = colorMap[type?.toLowerCase()] ?? colorMap.lateral;
    return <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize", cls)}>{type || "Lateral"}</span>;
}

const STATUS_FILTERS = [
    { value: "", label: "All" },
    { value: "requested", label: "Requested" },
    { value: "approved", label: "Approved" },
    { value: "applied", label: "Applied" },
    { value: "rejected", label: "Rejected" },
    { value: "cancelled", label: "Cancelled" },
];

const TRANSFER_TYPES = [
    { value: "LATERAL", label: "Lateral" },
    { value: "RELOCATION", label: "Relocation" },
    { value: "RESTRUCTURING", label: "Restructuring" },
];

const EMPTY_FORM = {
    employeeId: "", toDepartmentId: "", toDesignationId: "", toLocationId: "",
    toManagerId: "", effectiveDate: "", reason: "", transferType: "LATERAL",
};

/* ── Screen ── */

export function TransferScreen() {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [rejectTarget, setRejectTarget] = useState<any>(null);
    const [rejectNote, setRejectNote] = useState("");
    const [detailTarget, setDetailTarget] = useState<any>(null);

    const transfersQuery = useTransfers({ status: statusFilter || undefined });
    const employeesQuery = useEmployees();
    const departmentsQuery = useDepartments();
    const designationsQuery = useDesignations();
    const locationsQuery = useCompanyLocations();

    const createMutation = useCreateTransfer();
    const approveMutation = useApproveTransfer();
    const applyMutation = useApplyTransfer();
    const rejectMutation = useRejectTransfer();
    const cancelMutation = useCancelTransfer();

    const transfers: any[] = transfersQuery.data?.data ?? [];
    const employees: any[] = employeesQuery.data?.data ?? [];
    const departments: any[] = departmentsQuery.data?.data ?? [];
    const designations: any[] = designationsQuery.data?.data ?? [];
    const locations: any[] = locationsQuery.data?.data ?? [];

    const getEmployeeName = (id: string) => {
        const e = employees.find((emp: any) => emp.id === id);
        return e ? `${e.firstName ?? ""} ${e.lastName ?? ""}`.trim() || e.email || id : id;
    };

    const filtered = transfers.filter((r: any) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (r.employeeName || getEmployeeName(r.employeeId))?.toLowerCase().includes(q) ||
            r.toDepartment?.toLowerCase().includes(q) || r.toLocation?.toLowerCase().includes(q);
    });

    const openCreate = () => { setForm({ ...EMPTY_FORM }); setModalOpen(true); };
    const updateField = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));

    const handleCreate = async () => {
        try {
            const payload: any = {
                employeeId: form.employeeId,
                effectiveDate: form.effectiveDate,
                reason: form.reason,
                transferType: form.transferType,
            };
            if (form.toDepartmentId) payload.toDepartmentId = form.toDepartmentId;
            if (form.toDesignationId) payload.toDesignationId = form.toDesignationId;
            if (form.toLocationId) payload.toLocationId = form.toLocationId;
            if (form.toManagerId) payload.toManagerId = form.toManagerId;
            await createMutation.mutateAsync(payload);
            showSuccess("Transfer Initiated", "Employee transfer has been submitted.");
            setModalOpen(false);
        } catch (err) { showApiError(err); }
    };

    const handleApprove = async (r: any) => {
        try {
            await approveMutation.mutateAsync({ id: r.id });
            showSuccess("Transfer Approved", `Transfer for ${r.employeeName || getEmployeeName(r.employeeId)} has been approved.`);
        } catch (err) { showApiError(err); }
    };

    const handleApply = async (r: any) => {
        try {
            await applyMutation.mutateAsync({ id: r.id });
            showSuccess("Transfer Applied", "Employee profile has been updated.");
        } catch (err) { showApiError(err); }
    };

    const handleReject = async () => {
        if (!rejectTarget) return;
        try {
            await rejectMutation.mutateAsync({ id: rejectTarget.id, data: { rejectionNote: rejectNote } });
            showSuccess("Transfer Rejected", "Transfer has been rejected.");
            setRejectTarget(null); setRejectNote("");
        } catch (err) { showApiError(err); }
    };

    const handleCancel = async (r: any) => {
        try {
            await cancelMutation.mutateAsync({ id: r.id });
            showSuccess("Transfer Cancelled", "Transfer has been cancelled.");
        } catch (err) { showApiError(err); }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Employee Transfers</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Manage employee transfers across departments and locations</p>
                </div>
                <button onClick={openCreate} className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none">
                    <Plus className="w-5 h-5" />
                    Initiate Transfer
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                        <input type="text" placeholder="Search by name, department, location..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {STATUS_FILTERS.map((sf) => (
                            <button key={sf.value} onClick={() => setStatusFilter(sf.value)}
                                className={cn("px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
                                    statusFilter === sf.value
                                        ? "bg-primary-50 text-primary-700 border-primary-300 dark:bg-primary-900/30 dark:text-primary-400 dark:border-primary-700"
                                        : "bg-neutral-50 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700 hover:border-neutral-300"
                                )}>{sf.label}</button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {transfersQuery.isLoading ? <SkeletonTable rows={5} cols={8} /> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1100px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Employee</th>
                                    <th className="py-4 px-6 font-bold">From Dept</th>
                                    <th className="py-4 px-6 font-bold"></th>
                                    <th className="py-4 px-6 font-bold">To Dept</th>
                                    <th className="py-4 px-6 font-bold">Location</th>
                                    <th className="py-4 px-6 font-bold">Effective</th>
                                    <th className="py-4 px-6 font-bold text-center">Type</th>
                                    <th className="py-4 px-6 font-bold text-center">Status</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.map((r: any) => {
                                    const status = (r.status ?? "requested").toLowerCase();
                                    return (
                                        <tr key={r.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-accent-50 dark:bg-accent-900/30 flex items-center justify-center shrink-0">
                                                        <ArrowLeftRight className="w-4 h-4 text-accent-600 dark:text-accent-400" />
                                                    </div>
                                                    <span className="font-bold text-primary-950 dark:text-white">{r.employeeName || getEmployeeName(r.employeeId)}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">{r.fromDepartment || "\u2014"}</td>
                                            <td className="py-4 px-6"><ArrowRight size={14} className="text-neutral-300" /></td>
                                            <td className="py-4 px-6 font-semibold text-primary-700 dark:text-primary-400 text-xs">{r.toDepartment || "\u2014"}</td>
                                            <td className="py-4 px-6 text-xs text-neutral-600 dark:text-neutral-400">{r.toLocation || "\u2014"}</td>
                                            <td className="py-4 px-6 text-xs text-neutral-600 dark:text-neutral-400">{formatDate(r.effectiveDate)}</td>
                                            <td className="py-4 px-6 text-center"><TypeBadge type={r.transferType ?? "Lateral"} /></td>
                                            <td className="py-4 px-6 text-center"><TransferStatusBadge status={r.status ?? "Requested"} /></td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => setDetailTarget(r)} className="p-1.5 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="View"><Eye size={15} /></button>
                                                    {status === "requested" && (
                                                        <>
                                                            <button onClick={() => handleApprove(r)} disabled={approveMutation.isPending} className="p-1.5 text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20 rounded-lg transition-colors" title="Approve"><CheckCircle2 size={15} /></button>
                                                            <button onClick={() => setRejectTarget(r)} className="p-1.5 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" title="Reject"><XCircle size={15} /></button>
                                                        </>
                                                    )}
                                                    {status === "approved" && (
                                                        <button onClick={() => handleApply(r)} disabled={applyMutation.isPending} className="p-1.5 text-info-600 hover:bg-info-50 dark:hover:bg-info-900/20 rounded-lg transition-colors" title="Apply"><ArrowRightCircle size={15} /></button>
                                                    )}
                                                    {(status === "requested" || status === "approved") && (
                                                        <button onClick={() => handleCancel(r)} className="p-1.5 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors" title="Cancel"><Ban size={15} /></button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filtered.length === 0 && !transfersQuery.isLoading && (
                                    <tr><td colSpan={9}><EmptyState icon="list" title="No transfers" message="Initiate a transfer to get started." action={{ label: "New Transfer", onClick: openCreate }} /></td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">Initiate Transfer</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Employee *</label>
                                <select value={form.employeeId} onChange={(e) => updateField("employeeId", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                    <option value="">Select employee...</option>
                                    {employees.map((e: any) => <option key={e.id} value={e.id}>{`${e.firstName ?? ""} ${e.lastName ?? ""}`.trim() || e.id}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">To Department</label>
                                    <select value={form.toDepartmentId} onChange={(e) => updateField("toDepartmentId", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                        <option value="">Select...</option>
                                        {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">To Designation</label>
                                    <select value={form.toDesignationId} onChange={(e) => updateField("toDesignationId", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                        <option value="">Select...</option>
                                        {designations.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">To Location</label>
                                    <select value={form.toLocationId} onChange={(e) => updateField("toLocationId", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                        <option value="">Select...</option>
                                        {locations.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Effective Date *</label>
                                    <input type="date" value={form.effectiveDate} onChange={(e) => updateField("effectiveDate", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Transfer Type</label>
                                <div className="flex gap-2">
                                    {TRANSFER_TYPES.map(t => (
                                        <button key={t.value} onClick={() => updateField("transferType", t.value)} className={cn("px-3 py-1.5 rounded-lg text-xs font-bold border transition-all", form.transferType === t.value ? "bg-primary-50 text-primary-700 border-primary-300 dark:bg-primary-900/30 dark:text-primary-400 dark:border-primary-700" : "bg-neutral-50 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700")}>{t.label}</button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Reason *</label>
                                <textarea value={form.reason} onChange={(e) => updateField("reason", e.target.value)} placeholder="Reason for transfer..." rows={3} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none" />
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleCreate} disabled={createMutation.isPending} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {createMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                {createMutation.isPending ? "Submitting..." : "Initiate Transfer"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Dialog */}
            {rejectTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">Reject Transfer?</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Rejecting transfer for <strong>{rejectTarget.employeeName || getEmployeeName(rejectTarget.employeeId)}</strong>.</p>
                        <textarea value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} placeholder="Reason for rejection..." rows={3} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none dark:text-white placeholder:text-neutral-400 transition-all resize-none" />
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => { setRejectTarget(null); setRejectNote(""); }} className="flex-1 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleReject} disabled={rejectMutation.isPending} className="flex-1 py-3 rounded-xl bg-danger-600 hover:bg-danger-700 text-white text-sm font-bold transition-colors disabled:opacity-50">{rejectMutation.isPending ? "Rejecting..." : "Reject"}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {detailTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">Transfer Details</h2>
                            <button onClick={() => setDetailTarget(null)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-neutral-400 uppercase font-semibold">Status</span>
                                <TransferStatusBadge status={detailTarget.status ?? "Requested"} />
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><span className="text-xs text-neutral-400 block mb-0.5">Employee</span><p className="font-bold text-primary-950 dark:text-white">{detailTarget.employeeName || getEmployeeName(detailTarget.employeeId)}</p></div>
                                <div><span className="text-xs text-neutral-400 block mb-0.5">Transfer Type</span><p className="font-bold text-primary-950 dark:text-white">{detailTarget.transferType || "Lateral"}</p></div>
                                <div><span className="text-xs text-neutral-400 block mb-0.5">From Dept</span><p className="font-semibold text-neutral-600 dark:text-neutral-400">{detailTarget.fromDepartment || "\u2014"}</p></div>
                                <div><span className="text-xs text-neutral-400 block mb-0.5">To Dept</span><p className="font-semibold text-primary-700 dark:text-primary-400">{detailTarget.toDepartment || "\u2014"}</p></div>
                                <div><span className="text-xs text-neutral-400 block mb-0.5">From Location</span><p className="font-semibold text-neutral-600 dark:text-neutral-400">{detailTarget.fromLocation || "\u2014"}</p></div>
                                <div><span className="text-xs text-neutral-400 block mb-0.5">To Location</span><p className="font-semibold text-primary-700 dark:text-primary-400">{detailTarget.toLocation || "\u2014"}</p></div>
                                <div><span className="text-xs text-neutral-400 block mb-0.5">Effective Date</span><p className="font-semibold text-primary-950 dark:text-white">{formatDate(detailTarget.effectiveDate)}</p></div>
                            </div>
                            {detailTarget.reason && <div><span className="text-xs text-neutral-400 block mb-0.5">Reason</span><p className="text-sm text-neutral-600 dark:text-neutral-400 italic">"{detailTarget.reason}"</p></div>}
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setDetailTarget(null)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
