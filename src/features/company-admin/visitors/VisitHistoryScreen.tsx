import { useState } from "react";
import { Search, Eye, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVisits } from "@/features/company-admin/api/use-visitor-queries";
import { useCompanyFormatter } from "@/hooks/useCompanyFormatter";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { VisitStatusBadge } from "@/features/company-admin/visitors/components/VisitStatusBadge";

export function VisitHistoryScreen() {
    const fmt = useCompanyFormatter();
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [page, setPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);

    const params: Record<string, unknown> = { page, limit: 25 };
    if (search) params.search = search;
    if (status) params.status = status;
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;

    const { data, isLoading, isError } = useVisits(params);
    const visits: any[] = data?.data ?? [];
    const meta = data?.meta ?? {};

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Visit History</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Historical visitor records with full audit trail</p>
                </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm space-y-3">
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <input type="text" placeholder="Search visits..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                    </div>
                    <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none dark:text-white">
                        <option value="">All Statuses</option>
                        <option value="CHECKED_OUT">Checked Out</option>
                        <option value="CANCELLED">Cancelled</option>
                        <option value="REJECTED">Rejected</option>
                    </select>
                    <button onClick={() => setShowFilters(!showFilters)} className={cn("p-2.5 rounded-xl border transition-colors", showFilters ? "bg-primary-50 text-primary-600 border-primary-200" : "border-neutral-200 text-neutral-500 hover:bg-neutral-50")}><Filter size={16} /></button>
                </div>
                {showFilters && (
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                        <div><label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">From</label><input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm dark:text-white" /></div>
                        <div><label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">To</label><input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm dark:text-white" /></div>
                    </div>
                )}
            </div>

            {isError && <div className="bg-danger-50 border border-danger-200 rounded-xl p-4 text-sm text-danger-700 font-medium">Failed to load history.</div>}

            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? <SkeletonTable rows={8} cols={8} /> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Visitor</th>
                                    <th className="py-4 px-6 font-bold">Company</th>
                                    <th className="py-4 px-6 font-bold">Host</th>
                                    <th className="py-4 px-6 font-bold">Visit Date</th>
                                    <th className="py-4 px-6 font-bold">Check-In</th>
                                    <th className="py-4 px-6 font-bold">Check-Out</th>
                                    <th className="py-4 px-6 font-bold">Duration</th>
                                    <th className="py-4 px-6 font-bold text-center">Status</th>
                                    <th className="py-4 px-6 font-bold text-right">Detail</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {visits.map((v: any) => {
                                    let duration = "---";
                                    if (v.checkInTime && v.checkOutTime) {
                                        const ms = new Date(v.checkOutTime).getTime() - new Date(v.checkInTime).getTime();
                                        const mins = Math.round(ms / 60000);
                                        duration = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
                                    }
                                    return (
                                        <tr key={v.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-xs font-bold text-primary-700 dark:text-primary-400">{(v.visitorName || "?")[0]?.toUpperCase()}</div>
                                                    <div>
                                                        <span className="font-bold text-primary-950 dark:text-white block">{v.visitorName}</span>
                                                        <span className="text-[10px] font-mono text-neutral-400">{v.visitCode}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">{v.visitorCompany || "---"}</td>
                                            <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">{v.hostName || v.hostEmployee?.name || "---"}</td>
                                            <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">{v.visitDate ? fmt.date(v.visitDate) : v.createdAt ? fmt.date(v.createdAt) : "---"}</td>
                                            <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">{v.checkInTime ? fmt.time(v.checkInTime) : "---"}</td>
                                            <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">{v.checkOutTime ? fmt.time(v.checkOutTime) : "---"}</td>
                                            <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs font-mono">{duration}</td>
                                            <td className="py-4 px-6 text-center"><VisitStatusBadge status={v.status} /></td>
                                            <td className="py-4 px-6 text-right">
                                                <a href={`/app/company/visitors/detail/${v.id}`} className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors inline-block"><Eye size={15} /></a>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {visits.length === 0 && !isLoading && (
                                    <tr><td colSpan={9}><EmptyState icon="list" title="No visit history" message="Historical records will appear here after visitors check out." /></td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
                {meta.totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                        <span className="text-xs text-neutral-500">Page {meta.page} of {meta.totalPages}</span>
                        <div className="flex gap-2">
                            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 rounded-lg text-xs font-bold border border-neutral-200 dark:border-neutral-700 disabled:opacity-50">Previous</button>
                            <button onClick={() => setPage((p) => p + 1)} disabled={page >= meta.totalPages} className="px-3 py-1.5 rounded-lg text-xs font-bold border border-neutral-200 dark:border-neutral-700 disabled:opacity-50">Next</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
