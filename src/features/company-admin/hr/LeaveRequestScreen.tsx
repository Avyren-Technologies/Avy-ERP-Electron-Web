import { useState } from "react";
import {
    CalendarCheck,
    Plus,
    Eye,
    Loader2,
    X,
    Search,
    Filter,
    CheckCircle2,
    XCircle,
    Clock,
    Ban,
    CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLeaveRequests, useLeaveTypes } from "@/features/company-admin/api/use-leave-queries";
import { useEmployees } from "@/features/company-admin/api/use-hr-queries";
import {
    useCreateLeaveRequest,
    useApproveLeaveRequest,
    useRejectLeaveRequest,
    useCancelLeaveRequest,
} from "@/features/company-admin/api/use-leave-mutations";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Shared form atoms ── */

function FormField({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
}) {
    return (
        <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                {label}
            </label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
            />
        </div>
    );
}

function SelectField({
    label,
    value,
    onChange,
    options,
    placeholder,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
}) {
    return (
        <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                {label}
            </label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
            >
                <option value="">{placeholder ?? "Select..."}</option>
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

function ToggleSwitch({
    label,
    checked,
    onChange,
}: {
    label: string;
    checked: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-primary-950 dark:text-white">{label}</span>
            <button
                type="button"
                onClick={() => onChange(!checked)}
                className={cn(
                    "w-10 h-6 rounded-full transition-colors relative",
                    checked ? "bg-primary-600" : "bg-neutral-300 dark:bg-neutral-700"
                )}
            >
                <div className={cn("w-4 h-4 rounded-full bg-white absolute top-1 transition-all", checked ? "left-5" : "left-1")} />
            </button>
        </div>
    );
}

function RequestStatusBadge({ status }: { status: string }) {
    const s = status?.toLowerCase();
    const config: Record<string, { icon: typeof Clock; cls: string }> = {
        pending: {
            icon: Clock,
            cls: "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50",
        },
        approved: {
            icon: CheckCircle2,
            cls: "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50",
        },
        rejected: {
            icon: XCircle,
            cls: "bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50",
        },
        cancelled: {
            icon: Ban,
            cls: "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700",
        },
    };
    const c = config[s] ?? config.pending;
    const Icon = c.icon;
    return (
        <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize", c.cls)}>
            <Icon size={10} />
            {status}
        </span>
    );
}

/* ── Constants ── */

const STATUS_FILTERS = ["All", "Pending", "Approved", "Rejected", "Cancelled"];

/* ── Empty form ── */

const EMPTY_REQUEST = {
    employeeId: "",
    leaveTypeId: "",
    fromDate: "",
    toDate: "",
    isHalfDay: false,
    halfDayType: "" as "" | "FIRST_HALF" | "SECOND_HALF",
    reason: "",
};

/* ── Helpers ── */

const formatDate = (d: string | null | undefined) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const calcDays = (start: string, end: string, halfStart: boolean, halfEnd: boolean) => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    if (e < s) return 0;
    let days = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (halfStart) days -= 0.5;
    if (halfEnd) days -= 0.5;
    return Math.max(days, 0.5);
};

/* ── Screen ── */

export function LeaveRequestScreen() {
    const [activeTab, setActiveTab] = useState<"pending" | "all">("pending");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [dateFilter, setDateFilter] = useState("");

    const { data, isLoading, isError } = useLeaveRequests({
        status: activeTab === "pending" ? "pending" : statusFilter === "All" ? undefined : statusFilter.toLowerCase(),
    });
    const leaveTypesQuery = useLeaveTypes();
    const employeesQuery = useEmployees();

    const createMutation = useCreateLeaveRequest();
    const approveMutation = useApproveLeaveRequest();
    const rejectMutation = useRejectLeaveRequest();
    const cancelMutation = useCancelLeaveRequest();

    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState({ ...EMPTY_REQUEST });
    const [rejectTarget, setRejectTarget] = useState<any>(null);
    const [rejectNote, setRejectNote] = useState("");
    const [cancelTarget, setCancelTarget] = useState<any>(null);
    const [detailTarget, setDetailTarget] = useState<any>(null);

    const requests: any[] = data?.data ?? [];
    const leaveTypes: any[] = leaveTypesQuery.data?.data ?? [];
    const employees: any[] = employeesQuery.data?.data ?? [];

    const leaveTypeName = (id: string) => leaveTypes.find((lt: any) => lt.id === id)?.name ?? id;
    const employeeName = (id: string) => {
        const emp = employees.find((e: any) => e.id === id);
        if (!emp) return id;
        return [emp.firstName, emp.lastName].filter(Boolean).join(" ") || emp.fullName || emp.email || id;
    };

    const filtered = requests.filter((r: any) => {
        if (!search) return true;
        const s = search.toLowerCase();
        const eName = employeeName(r.employeeId)?.toLowerCase();
        const ltName = leaveTypeName(r.leaveTypeId)?.toLowerCase();
        return eName?.includes(s) || ltName?.includes(s);
    }).filter((r: any) => {
        if (!dateFilter) return true;
        return (r.fromDate ?? r.startDate)?.startsWith(dateFilter) || (r.toDate ?? r.endDate)?.startsWith(dateFilter);
    });

    const openApply = () => {
        setForm({ ...EMPTY_REQUEST });
        setModalOpen(true);
    };

    const handleApply = async () => {
        try {
            const days = calcDays(form.fromDate, form.toDate, form.isHalfDay, false);
            const payload: any = {
                employeeId: form.employeeId,
                leaveTypeId: form.leaveTypeId,
                fromDate: form.fromDate,
                toDate: form.toDate,
                days,
                isHalfDay: form.isHalfDay,
                reason: form.reason,
            };
            if (form.isHalfDay && form.halfDayType) {
                payload.halfDayType = form.halfDayType;
            }
            await createMutation.mutateAsync(payload);
            showSuccess("Leave Applied", "Leave request has been submitted.");
            setModalOpen(false);
        } catch (err) {
            showApiError(err);
        }
    };

    const handleApprove = async (req: any) => {
        try {
            await approveMutation.mutateAsync({ id: req.id });
            showSuccess("Request Approved", `Leave request for ${employeeName(req.employeeId)} has been approved.`);
        } catch (err) {
            showApiError(err);
        }
    };

    const handleReject = async () => {
        if (!rejectTarget) return;
        try {
            await rejectMutation.mutateAsync({ id: rejectTarget.id, data: { note: rejectNote } });
            showSuccess("Request Rejected", `Leave request has been rejected.`);
            setRejectTarget(null);
            setRejectNote("");
        } catch (err) {
            showApiError(err);
        }
    };

    const handleCancel = async () => {
        if (!cancelTarget) return;
        try {
            await cancelMutation.mutateAsync({ id: cancelTarget.id });
            showSuccess("Request Cancelled", "Leave request has been cancelled.");
            setCancelTarget(null);
        } catch (err) {
            showApiError(err);
        }
    };

    const saving = createMutation.isPending;
    const updateField = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));
    const computedDays = calcDays(form.fromDate, form.toDate, form.isHalfDay, false);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Leave Requests</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Review, approve, and manage employee leave requests</p>
                </div>
                <button
                    onClick={openApply}
                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
                >
                    <Plus className="w-5 h-5" />
                    Apply Leave
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab("pending")}
                    className={cn(
                        "px-5 py-2 rounded-lg text-sm font-bold transition-all",
                        activeTab === "pending"
                            ? "bg-white dark:bg-neutral-700 text-primary-700 dark:text-primary-400 shadow-sm"
                            : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
                    )}
                >
                    <span className="flex items-center gap-2">
                        <Clock size={14} />
                        Pending Approvals
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab("all")}
                    className={cn(
                        "px-5 py-2 rounded-lg text-sm font-bold transition-all",
                        activeTab === "all"
                            ? "bg-white dark:bg-neutral-700 text-primary-700 dark:text-primary-400 shadow-sm"
                            : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
                    )}
                >
                    <span className="flex items-center gap-2">
                        <CalendarDays size={14} />
                        All Requests
                    </span>
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                    <input
                        type="text"
                        placeholder="Search by employee or leave type..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                    />
                </div>
                <div className="flex items-center gap-4 overflow-x-auto pb-1 lg:pb-0">
                    {activeTab === "all" && (
                        <div className="flex items-center gap-2">
                            <Filter size={14} className="text-neutral-400 flex-shrink-0" />
                            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 whitespace-nowrap">Status:</span>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-semibold text-neutral-700 dark:text-neutral-300 focus:outline-none"
                            >
                                {STATUS_FILTERS.map((f) => (
                                    <option key={f} value={f}>{f}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 whitespace-nowrap">Date:</span>
                        <input
                            type="month"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-semibold text-neutral-700 dark:text-neutral-300 focus:outline-none"
                        />
                    </div>
                </div>
            </div>

            {isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
                    Failed to load leave requests. Please try again.
                </div>
            )}

            {/* Pending Tab — Card Layout */}
            {activeTab === "pending" && (
                <div>
                    {isLoading ? (
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                            <SkeletonTable rows={5} cols={6} />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                            <EmptyState icon="list" title="No pending requests" message="All leave requests have been reviewed." />
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {filtered.map((req: any) => (
                                <div
                                    key={req.id}
                                    className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-5 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-warning-50 dark:bg-warning-900/20 flex items-center justify-center shrink-0">
                                                <CalendarCheck className="w-5 h-5 text-warning-600 dark:text-warning-400" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-primary-950 dark:text-white text-sm">{employeeName(req.employeeId)}</p>
                                                <p className="text-xs text-neutral-500 dark:text-neutral-400">{leaveTypeName(req.leaveTypeId)}</p>
                                            </div>
                                        </div>
                                        <RequestStatusBadge status={req.status ?? "Pending"} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                                        <div>
                                            <span className="text-neutral-400">From</span>
                                            <p className="font-semibold text-primary-950 dark:text-white">{formatDate(req.fromDate)}</p>
                                        </div>
                                        <div>
                                            <span className="text-neutral-400">To</span>
                                            <p className="font-semibold text-primary-950 dark:text-white">{formatDate(req.toDate)}</p>
                                        </div>
                                        <div>
                                            <span className="text-neutral-400">Days</span>
                                            <p className="font-semibold text-primary-950 dark:text-white">{req.days ?? "—"}</p>
                                        </div>
                                        <div>
                                            <span className="text-neutral-400">Applied</span>
                                            <p className="font-semibold text-primary-950 dark:text-white">{formatDate(req.createdAt)}</p>
                                        </div>
                                    </div>
                                    {req.reason && (
                                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4 line-clamp-2 italic">"{req.reason}"</p>
                                    )}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleApprove(req)}
                                            disabled={approveMutation.isPending}
                                            className="flex-1 py-2 rounded-xl bg-success-600 hover:bg-success-700 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                                        >
                                            {approveMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => setRejectTarget(req)}
                                            className="flex-1 py-2 rounded-xl bg-danger-600 hover:bg-danger-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                                        >
                                            <XCircle size={12} />
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => setDetailTarget(req)}
                                            className="py-2 px-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                                        >
                                            <Eye size={12} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* All Tab — Table Layout */}
            {activeTab === "all" && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                    {isLoading ? (
                        <SkeletonTable rows={8} cols={8} />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[1000px]">
                                <thead>
                                    <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                        <th className="py-4 px-6 font-bold">Employee</th>
                                        <th className="py-4 px-6 font-bold">Leave Type</th>
                                        <th className="py-4 px-6 font-bold">From</th>
                                        <th className="py-4 px-6 font-bold">To</th>
                                        <th className="py-4 px-6 font-bold text-center">Days</th>
                                        <th className="py-4 px-6 font-bold text-center">Status</th>
                                        <th className="py-4 px-6 font-bold">Approver</th>
                                        <th className="py-4 px-6 font-bold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {filtered.map((req: any) => (
                                        <tr
                                            key={req.id}
                                            className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors"
                                        >
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center shrink-0 text-xs font-bold text-accent-700 dark:text-accent-400">
                                                        {employeeName(req.employeeId).charAt(0)}
                                                    </div>
                                                    <span className="font-bold text-primary-950 dark:text-white">{employeeName(req.employeeId)}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">{leaveTypeName(req.leaveTypeId)}</td>
                                            <td className="py-4 px-6 text-xs text-neutral-600 dark:text-neutral-400">{formatDate(req.fromDate)}</td>
                                            <td className="py-4 px-6 text-xs text-neutral-600 dark:text-neutral-400">{formatDate(req.toDate)}</td>
                                            <td className="py-4 px-6 text-center font-semibold text-primary-950 dark:text-white">{req.days ?? "—"}</td>
                                            <td className="py-4 px-6 text-center"><RequestStatusBadge status={req.status ?? "Pending"} /></td>
                                            <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">{req.approverName || req.approverId || "—"}</td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => setDetailTarget(req)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="View">
                                                        <Eye size={15} />
                                                    </button>
                                                    {req.status?.toLowerCase() === "pending" && (
                                                        <>
                                                            <button
                                                                onClick={() => handleApprove(req)}
                                                                disabled={approveMutation.isPending}
                                                                className="p-2 text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20 rounded-lg transition-colors"
                                                                title="Approve"
                                                            >
                                                                <CheckCircle2 size={15} />
                                                            </button>
                                                            <button
                                                                onClick={() => setRejectTarget(req)}
                                                                className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors"
                                                                title="Reject"
                                                            >
                                                                <XCircle size={15} />
                                                            </button>
                                                        </>
                                                    )}
                                                    {(req.status?.toLowerCase() === "pending" || req.status?.toLowerCase() === "approved") && (
                                                        <button
                                                            onClick={() => setCancelTarget(req)}
                                                            className="p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                                                            title="Cancel"
                                                        >
                                                            <Ban size={15} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filtered.length === 0 && !isLoading && (
                                        <tr>
                                            <td colSpan={8}>
                                                <EmptyState icon="search" title="No leave requests found" message="Try adjusting your search or filters." />
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ── Apply Leave Modal ── */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">Apply Leave</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <SelectField
                                label="Employee"
                                value={form.employeeId}
                                onChange={(v) => updateField("employeeId", v)}
                                options={employees.map((e: any) => ({
                                    value: e.id,
                                    label: [e.firstName, e.lastName].filter(Boolean).join(" ") || e.fullName || e.email,
                                }))}
                                placeholder="Select employee..."
                            />
                            <SelectField
                                label="Leave Type"
                                value={form.leaveTypeId}
                                onChange={(v) => updateField("leaveTypeId", v)}
                                options={leaveTypes.map((lt: any) => ({ value: lt.id, label: lt.name }))}
                                placeholder="Select leave type..."
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="From Date" value={form.fromDate} onChange={(v) => updateField("fromDate", v)} type="date" />
                                <FormField label="To Date" value={form.toDate} onChange={(v) => updateField("toDate", v)} type="date" />
                            </div>
                            <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700 space-y-1">
                                <ToggleSwitch label="Half Day" checked={form.isHalfDay} onChange={(v) => { updateField("isHalfDay", v); if (v) updateField("halfDayType", "FIRST_HALF"); else updateField("halfDayType", ""); }} />
                                {form.isHalfDay && (
                                    <div className="flex gap-2 pt-1">
                                        {[{ value: "FIRST_HALF", label: "First Half" }, { value: "SECOND_HALF", label: "Second Half" }].map((opt) => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => updateField("halfDayType", opt.value)}
                                                className={cn(
                                                    "flex-1 py-2 rounded-lg text-xs font-bold border transition-all text-center",
                                                    form.halfDayType === opt.value
                                                        ? "bg-primary-50 text-primary-700 border-primary-300 dark:bg-primary-900/30 dark:text-primary-400 dark:border-primary-700"
                                                        : "bg-white text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700"
                                                )}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {form.fromDate && form.toDate && (
                                <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 border border-primary-200 dark:border-primary-800/50 text-center">
                                    <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase">Total Days</span>
                                    <p className="text-2xl font-bold text-primary-700 dark:text-primary-300 mt-1">{computedDays}</p>
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                                    Reason
                                </label>
                                <textarea
                                    value={form.reason}
                                    onChange={(e) => updateField("reason", e.target.value)}
                                    placeholder="Reason for leave..."
                                    rows={3}
                                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleApply} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {saving && <Loader2 size={14} className="animate-spin" />}
                                {saving ? "Submitting..." : "Submit Request"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Reject Dialog ── */}
            {rejectTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">Reject Leave Request?</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                            Rejecting leave request for <strong>{employeeName(rejectTarget.employeeId)}</strong>.
                        </p>
                        <div>
                            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                                Rejection Note
                            </label>
                            <textarea
                                value={rejectNote}
                                onChange={(e) => setRejectNote(e.target.value)}
                                placeholder="Reason for rejection..."
                                rows={3}
                                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none"
                            />
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => { setRejectTarget(null); setRejectNote(""); }} className="flex-1 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleReject} disabled={rejectMutation.isPending} className="flex-1 py-3 rounded-xl bg-danger-600 hover:bg-danger-700 text-white text-sm font-bold transition-colors disabled:opacity-50">
                                {rejectMutation.isPending ? "Rejecting..." : "Reject"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Cancel Confirmation ── */}
            {cancelTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold text-warning-700 dark:text-warning-400 mb-2">Cancel Leave Request?</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            This will cancel the leave request for <strong>{employeeName(cancelTarget.employeeId)}</strong> ({formatDate(cancelTarget.fromDate)} - {formatDate(cancelTarget.toDate)}).
                        </p>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setCancelTarget(null)} className="flex-1 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Back</button>
                            <button onClick={handleCancel} disabled={cancelMutation.isPending} className="flex-1 py-3 rounded-xl bg-warning-600 hover:bg-warning-700 text-white text-sm font-bold transition-colors disabled:opacity-50">
                                {cancelMutation.isPending ? "Cancelling..." : "Confirm Cancel"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Detail View Modal ── */}
            {detailTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">Request Details</h2>
                            <button onClick={() => setDetailTarget(null)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-neutral-400 uppercase font-semibold">Status</span>
                                <RequestStatusBadge status={detailTarget.status ?? "Pending"} />
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-xs text-neutral-400 block mb-0.5">Employee</span>
                                    <p className="font-bold text-primary-950 dark:text-white">{employeeName(detailTarget.employeeId)}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-neutral-400 block mb-0.5">Leave Type</span>
                                    <p className="font-bold text-primary-950 dark:text-white">{leaveTypeName(detailTarget.leaveTypeId)}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-neutral-400 block mb-0.5">From</span>
                                    <p className="font-semibold text-primary-950 dark:text-white">{formatDate(detailTarget.fromDate)}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-neutral-400 block mb-0.5">To</span>
                                    <p className="font-semibold text-primary-950 dark:text-white">{formatDate(detailTarget.toDate)}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-neutral-400 block mb-0.5">Days</span>
                                    <p className="font-semibold text-primary-950 dark:text-white">{detailTarget.days ?? "—"}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-neutral-400 block mb-0.5">Approver</span>
                                    <p className="font-semibold text-primary-950 dark:text-white">{detailTarget.approverName || detailTarget.approverId || "—"}</p>
                                </div>
                            </div>
                            {detailTarget.reason && (
                                <div>
                                    <span className="text-xs text-neutral-400 block mb-0.5">Reason</span>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400 italic">"{detailTarget.reason}"</p>
                                </div>
                            )}
                            {detailTarget.rejectionNote && (
                                <div className="bg-danger-50 dark:bg-danger-900/20 rounded-xl p-3 border border-danger-200 dark:border-danger-800/50">
                                    <span className="text-xs text-danger-600 dark:text-danger-400 block mb-0.5 font-semibold">Rejection Note</span>
                                    <p className="text-sm text-danger-700 dark:text-danger-400">"{detailTarget.rejectionNote}"</p>
                                </div>
                            )}
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
