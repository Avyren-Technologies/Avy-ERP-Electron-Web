import { useState } from "react";
import { Siren, CheckCircle2, Loader2, Users, UserCheck, AlertTriangle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMusterList, useDashboardOnSite } from "@/features/company-admin/api/use-visitor-queries";
import { useTriggerEmergency, useMarkSafe, useResolveEmergency } from "@/features/company-admin/api/use-visitor-mutations";
import { useCanPerform } from "@/hooks/useCanPerform";
import { useCompanyFormatter } from "@/hooks/useCompanyFormatter";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { showSuccess, showApiError } from "@/lib/toast";

export function EmergencyMusterScreen() {
    const fmt = useCompanyFormatter();
    const canConfigure = useCanPerform("visitors:configure");
    const canCreate = useCanPerform("visitors:create");

    const { data: musterData, isLoading: musterLoading } = useMusterList();
    const { data: onSiteData } = useDashboardOnSite();
    const triggerMutation = useTriggerEmergency();
    const markSafeMutation = useMarkSafe();
    const resolveMutation = useResolveEmergency();

    const [showTrigger, setShowTrigger] = useState(false);
    const [triggerReason, setTriggerReason] = useState("");
    const [showResolve, setShowResolve] = useState(false);
    const [markingId, setMarkingId] = useState<string | null>(null);

    const musterList: any[] = musterData?.data?.visitors ?? musterData?.data ?? [];
    const emergency = musterData?.data?.emergency ?? musterData?.data;
    const isActive = emergency?.status === "ACTIVE" || musterList.length > 0;
    const onSiteVisitors: any[] = onSiteData?.data ?? [];

    const safeCount = musterList.filter((v: any) => v.markedSafe).length;
    const totalCount = musterList.length || onSiteVisitors.length;
    const unsafeCount = totalCount - safeCount;

    const handleTrigger = async () => {
        try {
            await triggerMutation.mutateAsync({ reason: triggerReason, type: "EVACUATION" });
            showSuccess("Emergency Triggered", "Emergency muster has been activated. All on-site visitors are being tracked.");
            setShowTrigger(false);
            setTriggerReason("");
        } catch (err) { showApiError(err); }
    };

    const handleMarkSafe = async (visitorId: string) => {
        try {
            setMarkingId(visitorId);
            await markSafeMutation.mutateAsync({ visitorId });
            showSuccess("Marked Safe", "Visitor has been marked as safe.");
        } catch (err) { showApiError(err); } finally { setMarkingId(null); }
    };

    const handleResolve = async () => {
        try {
            await resolveMutation.mutateAsync({});
            showSuccess("Emergency Resolved", "Emergency has been resolved. Normal operations can resume.");
            setShowResolve(false);
        } catch (err) { showApiError(err); }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Emergency Muster</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Emergency evacuation visitor accountability</p>
                </div>
                <div className="flex items-center gap-3">
                    {isActive && canConfigure && (
                        <button onClick={() => setShowResolve(true)} className="inline-flex items-center gap-2 bg-success-600 hover:bg-success-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all">
                            <ShieldCheck size={16} /> Resolve Emergency
                        </button>
                    )}
                    {!isActive && canConfigure && (
                        <button onClick={() => setShowTrigger(true)} className="inline-flex items-center gap-2 bg-danger-600 hover:bg-danger-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-danger-500/20 transition-all">
                            <Siren size={16} /> Trigger Emergency
                        </button>
                    )}
                </div>
            </div>

            {/* Status Banner */}
            {isActive && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border-2 border-danger-300 dark:border-danger-700 rounded-2xl p-6 animate-pulse">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-danger-100 dark:bg-danger-900/40 flex items-center justify-center">
                            <Siren className="w-8 h-8 text-danger-600 dark:text-danger-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-danger-700 dark:text-danger-400">EMERGENCY ACTIVE</h2>
                            <p className="text-sm text-danger-600 dark:text-danger-500">{emergency?.reason || "Evacuation in progress"}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <Users className="w-5 h-5 text-info-600" />
                        <span className="text-xs font-bold text-neutral-500 uppercase">Total On-Site</span>
                    </div>
                    <span className="text-3xl font-black text-primary-950 dark:text-white">{totalCount}</span>
                </div>
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-success-200 dark:border-success-800/50 p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <UserCheck className="w-5 h-5 text-success-600" />
                        <span className="text-xs font-bold text-neutral-500 uppercase">Accounted (Safe)</span>
                    </div>
                    <span className="text-3xl font-black text-success-700 dark:text-success-400">{safeCount}</span>
                </div>
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-danger-200 dark:border-danger-800/50 p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <AlertTriangle className="w-5 h-5 text-danger-600" />
                        <span className="text-xs font-bold text-neutral-500 uppercase">Unaccounted</span>
                    </div>
                    <span className="text-3xl font-black text-danger-700 dark:text-danger-400">{unsafeCount}</span>
                </div>
            </div>

            {/* Muster List */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                    <h2 className="text-sm font-bold text-primary-950 dark:text-white uppercase tracking-wider">Muster List</h2>
                </div>
                {musterLoading ? <SkeletonTable rows={5} cols={5} /> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Visitor</th>
                                    <th className="py-4 px-6 font-bold">Company</th>
                                    <th className="py-4 px-6 font-bold">Host</th>
                                    <th className="py-4 px-6 font-bold">Check-In</th>
                                    <th className="py-4 px-6 font-bold text-center">Status</th>
                                    <th className="py-4 px-6 font-bold text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {(musterList.length > 0 ? musterList : onSiteVisitors).map((v: any) => (
                                    <tr key={v.id} className={cn("border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 transition-colors", v.markedSafe ? "bg-success-50/30 dark:bg-success-900/5" : "bg-danger-50/20 dark:bg-danger-900/5")}>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold", v.markedSafe ? "bg-success-100 text-success-700" : "bg-danger-100 text-danger-700")}>
                                                    {(v.visitorName || "?")[0]?.toUpperCase()}
                                                </div>
                                                <span className="font-bold text-primary-950 dark:text-white">{v.visitorName}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">{v.visitorCompany || "---"}</td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">{v.hostName || v.hostEmployee?.name || "---"}</td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">{v.checkInTime ? fmt.time(v.checkInTime) : "---"}</td>
                                        <td className="py-4 px-6 text-center">
                                            {v.markedSafe ? (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-success-50 text-success-700 px-2 py-0.5 rounded-full border border-success-200"><CheckCircle2 size={10} /> Safe</span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-danger-50 text-danger-700 px-2 py-0.5 rounded-full border border-danger-200"><AlertTriangle size={10} /> Unaccounted</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            {!v.markedSafe && canCreate && (
                                                <button onClick={() => handleMarkSafe(v.id)} disabled={markingId === v.id} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-success-600 text-white hover:bg-success-700 transition-colors disabled:opacity-50">
                                                    {markingId === v.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Mark Safe
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {musterList.length === 0 && onSiteVisitors.length === 0 && (
                                    <tr><td colSpan={6} className="py-12 text-center text-neutral-400 text-sm">No visitors currently on site.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Trigger Modal */}
            {showTrigger && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-danger-100 flex items-center justify-center"><Siren className="w-5 h-5 text-danger-600" /></div>
                            <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400">Trigger Emergency</h2>
                        </div>
                        <p className="text-sm text-neutral-500 mb-4">This will activate the emergency muster list and lock all check-in/out operations.</p>
                        <div><label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Reason</label><input type="text" value={triggerReason} onChange={(e) => setTriggerReason(e.target.value)} placeholder="Fire, drill, etc." className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm dark:text-white placeholder:text-neutral-400 transition-all" /></div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowTrigger(false)} className="flex-1 py-3 rounded-xl border border-neutral-200 text-sm font-bold text-neutral-700 hover:bg-neutral-50 transition-colors">Cancel</button>
                            <button onClick={handleTrigger} disabled={triggerMutation.isPending} className="flex-1 py-3 rounded-xl bg-danger-600 hover:bg-danger-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {triggerMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                {triggerMutation.isPending ? "Triggering..." : "Trigger Now"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Resolve Modal */}
            {showResolve && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold text-success-700 dark:text-success-400 mb-2">Resolve Emergency</h2>
                        <p className="text-sm text-neutral-500">Confirm that the emergency is resolved and normal operations can resume.</p>
                        {unsafeCount > 0 && (
                            <div className="mt-3 p-3 bg-warning-50 border border-warning-200 rounded-xl text-xs text-warning-700 font-medium">
                                Warning: {unsafeCount} visitor(s) are still unaccounted for.
                            </div>
                        )}
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowResolve(false)} className="flex-1 py-3 rounded-xl border border-neutral-200 text-sm font-bold text-neutral-700 hover:bg-neutral-50 transition-colors">Cancel</button>
                            <button onClick={handleResolve} disabled={resolveMutation.isPending} className="flex-1 py-3 rounded-xl bg-success-600 hover:bg-success-700 text-white text-sm font-bold transition-colors disabled:opacity-50">{resolveMutation.isPending ? "Resolving..." : "Resolve"}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
