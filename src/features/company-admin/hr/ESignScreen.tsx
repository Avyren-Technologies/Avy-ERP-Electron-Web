import { useState } from "react";
import {
    FileSignature,
    Loader2,
    Search,
    RefreshCw,
    FileCheck2,
    FileX2,
    Clock,
    Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePendingESign, useESignStatus } from "@/features/company-admin/api/use-recruitment-queries";
import { useDispatchESign } from "@/features/company-admin/api/use-recruitment-mutations";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";
import { useCanPerform } from "@/hooks/useCanPerform";

/* ── Atoms ── */

function StatusBadge({ status }: { status: string }) {
    const s = status?.toUpperCase();
    const cls =
        s === "PENDING"
            ? "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50"
            : s === "SIGNED"
            ? "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50"
            : s === "DECLINED"
            ? "bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50"
            : "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700";
    return (
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase", cls)}>
            {status}
        </span>
    );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
    const colorMap: Record<string, string> = {
        warning: "bg-warning-50 text-warning-600 dark:bg-warning-900/20 dark:text-warning-400",
        success: "bg-success-50 text-success-600 dark:bg-success-900/20 dark:text-success-400",
        danger: "bg-danger-50 text-danger-600 dark:bg-danger-900/20 dark:text-danger-400",
    };
    return (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 p-5 shadow-sm">
            <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", colorMap[color])}>
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-2xl font-bold text-primary-950 dark:text-white">{value}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-semibold">{label}</p>
                </div>
            </div>
        </div>
    );
}

/* ── Constants ── */

const STATUS_FILTERS = [
    { value: "", label: "All" },
    { value: "PENDING", label: "Pending" },
    { value: "SIGNED", label: "Signed" },
    { value: "DECLINED", label: "Declined" },
];

/* ── Screen ── */

export function ESignScreen() {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const isHrAdmin = useCanPerform('hr:read');

    const { data, isLoading, isError } = usePendingESign();
    const { data: statsData } = useESignStatus('');
    const dispatchMutation = useDispatchESign();

    const records: any[] = (data as any)?.data ?? [];
    const stats: any = (statsData as any)?.data ?? { pending: 0, signedThisMonth: 0, declined: 0 };

    const filtered = records.filter((r: any) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
            r.employeeName?.toLowerCase().includes(s) ||
            r.letterType?.toLowerCase().includes(s) ||
            r.status?.toLowerCase().includes(s)
        );
    });

    const handleResend = async (id: string) => {
        try {
            await dispatchMutation.mutateAsync({ id } as any);
            showSuccess("E-Sign Resent", "The e-signature request has been resent.");
        } catch (err) {
            showApiError(err);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">{isHrAdmin ? "E-Signatures" : "My E-Sign Requests"}</h1>
                <p className="text-neutral-500 dark:text-neutral-400 mt-1">{isHrAdmin ? "Track and manage electronic signature requests for HR letters" : "View your pending and completed e-signature requests"}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard icon={Clock} label="Pending" value={stats.pending ?? 0} color="warning" />
                <StatCard icon={FileCheck2} label="Signed This Month" value={stats.signedThisMonth ?? 0} color="success" />
                <StatCard icon={FileX2} label="Declined" value={stats.declined ?? 0} color="danger" />
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                        <input
                            type="text"
                            placeholder="Search by employee or letter type..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                        />
                    </div>
                    <div className="flex gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl w-fit">
                        {STATUS_FILTERS.map((f) => (
                            <button
                                key={f.value}
                                onClick={() => setStatusFilter(f.value)}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                                    statusFilter === f.value
                                        ? "bg-white dark:bg-neutral-700 text-primary-700 dark:text-primary-400 shadow-sm"
                                        : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
                                )}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
                    Failed to load e-signature records. Please try again.
                </div>
            )}

            {/* Data Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? (
                    <SkeletonTable rows={6} cols={5} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[750px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Letter Type</th>
                                    {isHrAdmin && <th className="py-4 px-6 font-bold">Employee</th>}
                                    <th className="py-4 px-6 font-bold">Dispatched</th>
                                    <th className="py-4 px-6 font-bold text-center">Status</th>
                                    {isHrAdmin && <th className="py-4 px-6 font-bold text-right">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.map((r: any) => (
                                    <tr
                                        key={r.id}
                                        className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors"
                                    >
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                                                    <FileSignature className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                                </div>
                                                <span className="font-bold text-primary-950 dark:text-white">{r.letterType ?? "HR Letter"}</span>
                                            </div>
                                        </td>
                                        {isHrAdmin && <td className="py-4 px-6 text-neutral-700 dark:text-neutral-300 font-medium">{r.employeeName ?? "—"}</td>}
                                        <td className="py-4 px-6 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                                            {r.dispatchedAt ? new Date(r.dispatchedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <StatusBadge status={r.status ?? "PENDING"} />
                                        </td>
                                        {isHrAdmin && (
                                            <td className="py-4 px-6 text-right">
                                                {r.status === "PENDING" && (
                                                    <button
                                                        onClick={() => handleResend(r.id)}
                                                        disabled={dispatchMutation.isPending}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
                                                    >
                                                        <RefreshCw size={13} />
                                                        Resend
                                                    </button>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {filtered.length === 0 && !isLoading && (
                                    <tr>
                                        <td colSpan={isHrAdmin ? 5 : 3}>
                                            <EmptyState icon="list" title="No e-signature records" message={statusFilter ? `No ${statusFilter.toLowerCase()} requests found.` : "No e-signature requests found."} />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
