import { useState } from "react";
import {
    Users,
    Search,
    Eye,
    LogIn,
    LogOut,
    Loader2,
    Filter,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useVisits, useVisitorTypes } from "@/features/company-admin/api/use-visitor-queries";
import { useCheckInVisit, useCheckOutVisit } from "@/features/company-admin/api/use-visitor-mutations";
import { useCompanyFormatter } from "@/hooks/useCompanyFormatter";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";
import { VisitStatusBadge } from "@/features/company-admin/visitors/components/VisitStatusBadge";

const STATUS_OPTIONS = [
    { value: "", label: "All Statuses" },
    { value: "PRE_REGISTERED", label: "Pre-Registered" },
    { value: "APPROVED", label: "Approved" },
    { value: "PENDING_APPROVAL", label: "Pending Approval" },
    { value: "CHECKED_IN", label: "Checked In" },
    { value: "CHECKED_OUT", label: "Checked Out" },
    { value: "REJECTED", label: "Rejected" },
    { value: "CANCELLED", label: "Cancelled" },
    { value: "OVERSTAY", label: "Overstay" },
];

/* ── Screen ── */

export function VisitorListScreen() {
    const fmt = useCompanyFormatter();
    const checkInMutation = useCheckInVisit();
    const checkOutMutation = useCheckOutVisit();

    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [visitorTypeId, setVisitorTypeId] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [page, setPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);
    const [actionId, setActionId] = useState<string | null>(null);

    const params: Record<string, unknown> = { page, limit: 25 };
    if (search) params.search = search;
    if (status) params.status = status;
    if (visitorTypeId) params.visitorTypeId = visitorTypeId;
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;

    const { data, isLoading, isError } = useVisits(params);
    const visitorTypesQuery = useVisitorTypes();

    const visits: any[] = data?.data ?? [];
    const meta = data?.meta ?? {};
    const visitorTypes: any[] = visitorTypesQuery.data?.data ?? [];

    const handleCheckIn = async (id: string) => {
        try {
            setActionId(id);
            await checkInMutation.mutateAsync({ id });
            showSuccess("Checked In", "Visitor has been checked in successfully.");
        } catch (err) {
            showApiError(err);
        } finally {
            setActionId(null);
        }
    };

    const handleCheckOut = async (id: string) => {
        try {
            setActionId(id);
            await checkOutMutation.mutateAsync({ id });
            showSuccess("Checked Out", "Visitor has been checked out successfully.");
        } catch (err) {
            showApiError(err);
        } finally {
            setActionId(null);
        }
    };

    const clearFilters = () => {
        setSearch("");
        setStatus("");
        setVisitorTypeId("");
        setDateFrom("");
        setDateTo("");
        setPage(1);
    };

    const hasFilters = status || visitorTypeId || dateFrom || dateTo;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">All Visits</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Browse and manage all visitor records</p>
                </div>
                <a
                    href="/app/company/visitors/pre-register"
                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
                >
                    <Users className="w-5 h-5" />
                    Pre-Register Visitor
                </a>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm space-y-3">
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                        <input
                            type="text"
                            placeholder="Search by name, company, code..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                        />
                    </div>
                    <select
                        value={status}
                        onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                        className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                    >
                        {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn(
                            "p-2.5 rounded-xl border transition-colors",
                            showFilters || hasFilters
                                ? "bg-primary-50 text-primary-600 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50"
                                : "border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                        )}
                    >
                        <Filter size={16} />
                    </button>
                    {hasFilters && (
                        <button onClick={clearFilters} className="text-xs font-bold text-danger-600 dark:text-danger-400 hover:underline flex items-center gap-1">
                            <X size={12} /> Clear
                        </button>
                    )}
                </div>

                {showFilters && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                        <div>
                            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Visitor Type</label>
                            <select
                                value={visitorTypeId}
                                onChange={(e) => { setVisitorTypeId(e.target.value); setPage(1); }}
                                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                            >
                                <option value="">All Types</option>
                                {visitorTypes.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Date From</label>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Date To</label>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                            />
                        </div>
                    </div>
                )}
            </div>

            {isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
                    Failed to load visits. Please try again.
                </div>
            )}

            {/* Data Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? (
                    <SkeletonTable rows={8} cols={9} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1100px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Visitor</th>
                                    <th className="py-4 px-6 font-bold">Company</th>
                                    <th className="py-4 px-6 font-bold">Type</th>
                                    <th className="py-4 px-6 font-bold">Host</th>
                                    <th className="py-4 px-6 font-bold">Purpose</th>
                                    <th className="py-4 px-6 font-bold">Date</th>
                                    <th className="py-4 px-6 font-bold">Check-In</th>
                                    <th className="py-4 px-6 font-bold text-center">Status</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {visits.map((v: any) => (
                                    <tr
                                        key={v.id}
                                        className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors"
                                    >
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-xs font-bold text-primary-700 dark:text-primary-400">
                                                    {(v.visitorName || "?")[0]?.toUpperCase()}
                                                </div>
                                                <div>
                                                    <span className="font-bold text-primary-950 dark:text-white block">{v.visitorName}</span>
                                                    <span className="text-[10px] text-neutral-400">{v.visitorMobile || v.visitorEmail || ""}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">{v.visitorCompany || "---"}</td>
                                        <td className="py-4 px-6">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-accent-50 text-accent-700 border-accent-200 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50">
                                                {v.visitorType?.name || v.visitorTypeName || "Visitor"}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">{v.hostEmployee?.name || v.hostName || "---"}</td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">{v.purpose || "---"}</td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">
                                            {v.visitDate ? fmt.date(v.visitDate) : v.expectedArrival ? fmt.date(v.expectedArrival) : "---"}
                                        </td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">
                                            {v.checkInTime ? fmt.time(v.checkInTime) : "---"}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <VisitStatusBadge status={v.status} />
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {(v.status === "PRE_REGISTERED" || v.status === "APPROVED") && (
                                                    <button
                                                        onClick={() => handleCheckIn(v.id)}
                                                        disabled={actionId === v.id}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-success-50 text-success-700 border border-success-200 hover:bg-success-100 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50 transition-colors disabled:opacity-50"
                                                    >
                                                        {actionId === v.id ? <Loader2 size={12} className="animate-spin" /> : <LogIn size={12} />}
                                                        In
                                                    </button>
                                                )}
                                                {v.status === "CHECKED_IN" && (
                                                    <button
                                                        onClick={() => handleCheckOut(v.id)}
                                                        disabled={actionId === v.id}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-neutral-100 text-neutral-700 border border-neutral-200 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700 transition-colors disabled:opacity-50"
                                                    >
                                                        {actionId === v.id ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={12} />}
                                                        Out
                                                    </button>
                                                )}
                                                <a
                                                    href={`/app/company/visitors/detail/${v.id}`}
                                                    className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                                                >
                                                    <Eye size={15} />
                                                </a>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {visits.length === 0 && !isLoading && (
                                    <tr>
                                        <td colSpan={9}>
                                            <EmptyState icon="list" title="No visits found" message="Adjust filters or pre-register a new visitor." />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {meta.totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                            Page {meta.page} of {meta.totalPages} ({meta.total} total)
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 transition-colors"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage((p) => p + 1)}
                                disabled={page >= meta.totalPages}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
