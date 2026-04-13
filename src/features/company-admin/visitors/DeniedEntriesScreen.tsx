import { useState } from "react";
import { Search, Filter, ShieldBan } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDeniedEntries } from "@/features/company-admin/api/use-visitor-queries";
import { useCompanyFormatter } from "@/hooks/useCompanyFormatter";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

const DENIAL_REASONS = [
    { value: "", label: "All Reasons" },
    { value: "BLOCKLIST_MATCH", label: "Blocklist Match" },
    { value: "HOST_REJECTED", label: "Host Rejected" },
    { value: "INDUCTION_FAILED", label: "Induction Failed" },
    { value: "GATE_CLOSED", label: "Gate Closed" },
    { value: "WRONG_DATE", label: "Wrong Date" },
    { value: "WRONG_GATE", label: "Wrong Gate" },
    { value: "PASS_EXPIRED", label: "Pass Expired" },
    { value: "APPROVAL_TIMEOUT", label: "Approval Timeout" },
    { value: "MANUAL_DENIAL", label: "Manual Denial" },
    { value: "VISIT_CANCELLED", label: "Visit Cancelled" },
];

function DenialReasonBadge({ reason }: { reason: string }) {
    const colorMap: Record<string, string> = {
        BLOCKLIST_MATCH: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800/50",
        HOST_REJECTED: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50",
        INDUCTION_FAILED: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800/50",
        GATE_CLOSED: "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700",
        WRONG_DATE: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/50",
        WRONG_GATE: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/50",
        PASS_EXPIRED: "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700",
        APPROVAL_TIMEOUT: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50",
        MANUAL_DENIAL: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-800/50",
        VISIT_CANCELLED: "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700",
    };
    const cls = colorMap[reason] ?? "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700";
    return (
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize", cls)}>
            {(reason || "unknown").replace(/_/g, " ").toLowerCase()}
        </span>
    );
}

export function DeniedEntriesScreen() {
    const fmt = useCompanyFormatter();
    const [search, setSearch] = useState("");
    const [denialReason, setDenialReason] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [page, setPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);

    const params: Record<string, unknown> = { page, limit: 25 };
    if (search) params.search = search;
    if (denialReason) params.denialReason = denialReason;
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;

    const { data, isLoading, isError } = useDeniedEntries(params);
    const entries: any[] = data?.data ?? [];
    const meta = data?.meta ?? {};

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Denied Entries</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Visitors denied entry at check-in</p>
                </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm space-y-3">
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <input type="text" placeholder="Search denied entries..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                    </div>
                    <select value={denialReason} onChange={(e) => { setDenialReason(e.target.value); setPage(1); }} className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none dark:text-white">
                        {DENIAL_REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
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

            {isError && <div className="bg-danger-50 border border-danger-200 rounded-xl p-4 text-sm text-danger-700 font-medium">Failed to load denied entries.</div>}

            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? <SkeletonTable rows={8} cols={8} /> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Visitor Name</th>
                                    <th className="py-4 px-6 font-bold">Mobile</th>
                                    <th className="py-4 px-6 font-bold">Company</th>
                                    <th className="py-4 px-6 font-bold text-center">Denial Reason</th>
                                    <th className="py-4 px-6 font-bold">Gate</th>
                                    <th className="py-4 px-6 font-bold">Denied By</th>
                                    <th className="py-4 px-6 font-bold">Denied At</th>
                                    <th className="py-4 px-6 font-bold">Details</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {entries.map((e: any) => (
                                    <tr key={e.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-danger-50 dark:bg-danger-900/30 flex items-center justify-center text-xs font-bold text-danger-700 dark:text-danger-400">
                                                    <ShieldBan className="w-4 h-4" />
                                                </div>
                                                <span className="font-bold text-primary-950 dark:text-white">{e.visitorName || "---"}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">{e.visitorMobile || "---"}</td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">{e.visitorCompany || "---"}</td>
                                        <td className="py-4 px-6 text-center"><DenialReasonBadge reason={e.denialReason || e.reason} /></td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">{e.gate?.name || e.gateName || "---"}</td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">{e.deniedByName || e.deniedBy?.name || "---"}</td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">{e.deniedAt ? fmt.dateTime(e.deniedAt) : e.createdAt ? fmt.dateTime(e.createdAt) : "---"}</td>
                                        <td className="py-4 px-6 text-neutral-500 dark:text-neutral-400 text-xs max-w-[200px] truncate">{e.details || e.notes || "---"}</td>
                                    </tr>
                                ))}
                                {entries.length === 0 && !isLoading && (
                                    <tr><td colSpan={8}><EmptyState icon="list" title="No denied entries" message="No visitors have been denied entry during the selected period." /></td></tr>
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
