import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Loader2, X, Calendar, DollarSign, Phone, Shield, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { useContract, useContractUtilisation, useAssets } from "@/features/maintenance/api/use-maintenance-queries";
import { useAddContractAsset, useRemoveContractAsset, useLogContractVisit } from "@/features/maintenance/api/use-maintenance-mutations";
import { useCompanyFormatter } from "@/hooks/useCompanyFormatter";
import { useCanPerform } from "@/hooks/useCanPerform";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

export function ContractDetailScreen() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const fmt = useCompanyFormatter();
    const canManage = useCanPerform("maintenance:create");

    const { data, isLoading } = useContract(id ?? "");
    const contract: any = data?.data ?? {};

    const { data: utilData } = useContractUtilisation(id ?? "");
    const utilisation: any = utilData?.data ?? {};

    const [activeTab, setActiveTab] = useState<"info" | "assets" | "visits" | "utilisation">("info");

    // Add asset modal
    const [showAddAsset, setShowAddAsset] = useState(false);
    const [assetSearch, setAssetSearch] = useState("");
    const { data: assetsData } = useAssets({ search: assetSearch || undefined, limit: 20 });
    const searchAssets: any[] = assetsData?.data ?? [];

    // Log visit modal
    const [showVisitModal, setShowVisitModal] = useState(false);
    const [visitForm, setVisitForm] = useState({ visitDate: "", vendorTechName: "", serviceReport: "", invoiceAmount: "" });

    const addAssetMutation = useAddContractAsset();
    const removeAssetMutation = useRemoveContractAsset();
    const logVisitMutation = useLogContractVisit();

    const linkedAssets: any[] = contract.assets ?? contract.contractAssets ?? [];
    const visits: any[] = contract.visits ?? contract.contractVisits ?? [];

    // Expiry countdown
    const daysLeft = contract.endDate
        ? Math.ceil((new Date(contract.endDate).getTime() - Date.now()) / 86400000)
        : null;

    const handleAddAsset = async (assetId: string) => {
        if (!id) return;
        try {
            await addAssetMutation.mutateAsync({ id, data: { assetId } });
            showSuccess("Added", "Asset linked to contract.");
            setShowAddAsset(false);
            setAssetSearch("");
        } catch (err) { showApiError(err); }
    };

    const handleRemoveAsset = async (assetId: string) => {
        if (!id) return;
        try {
            await removeAssetMutation.mutateAsync({ id, assetId });
            showSuccess("Removed", "Asset removed from contract.");
        } catch (err) { showApiError(err); }
    };

    const handleLogVisit = async () => {
        if (!id) return;
        try {
            await logVisitMutation.mutateAsync({
                id,
                data: {
                    visitDate: visitForm.visitDate,
                    vendorTechName: visitForm.vendorTechName || undefined,
                    serviceReport: visitForm.serviceReport || undefined,
                    invoiceAmount: visitForm.invoiceAmount ? Number(visitForm.invoiceAmount) : undefined,
                },
            });
            showSuccess("Logged", "Visit logged successfully.");
            setShowVisitModal(false);
            setVisitForm({ visitDate: "", vendorTechName: "", serviceReport: "", invoiceAmount: "" });
        } catch (err) { showApiError(err); }
    };

    if (isLoading) return <SkeletonTable rows={6} cols={4} />;

    const callsPct = contract.callLimit ? Math.min(100, Math.round(((contract.callsUsed ?? 0) / contract.callLimit) * 100)) : 0;
    // Fallback: sum visit invoice amounts if backend costClaimed is 0 but visits have costs
    const visitsCostSum = visits.reduce((sum: number, v: any) => sum + (v.invoiceAmount ? Number(v.invoiceAmount) : 0), 0);
    const effectiveCostClaimed = Number(utilisation.costClaimed ?? 0) > 0 ? Number(utilisation.costClaimed) : visitsCostSum;
    const usingCostFallback = Number(utilisation.costClaimed ?? 0) === 0 && visitsCostSum > 0;
    const costPct = contract.contractValue && effectiveCostClaimed > 0
        ? Math.min(100, Math.round((effectiveCostClaimed / Number(contract.contractValue)) * 100))
        : (utilisation.costClaimedPct ? Math.min(100, Number(utilisation.costClaimedPct)) : 0);
    const callLimitExceeded = contract.callLimit != null && (contract.callsUsed ?? 0) > contract.callLimit;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                    <ArrowLeft size={18} />
                </button>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">{contract.name ?? "Contract Detail"}</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">{contract.contractCode ?? ""} - {contract.contractType ?? ""}</p>
                </div>
                {daysLeft !== null && (
                    <div className={cn(
                        "px-4 py-2 rounded-xl text-sm font-bold border",
                        daysLeft < 0 ? "bg-neutral-100 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-500 dark:border-neutral-700" :
                        daysLeft <= 30 ? "bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50" :
                        daysLeft <= 90 ? "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50" :
                        "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50"
                    )}>
                        {daysLeft < 0 ? "Expired" : `${daysLeft} days remaining`}
                    </div>
                )}
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {[
                    { icon: Shield, label: "Type", value: contract.contractType ?? "---", color: "text-violet-600" },
                    { icon: Calendar, label: "Period", value: `${contract.startDate ? fmt.date(contract.startDate) : "---"} to ${contract.endDate ? fmt.date(contract.endDate) : "---"}`, color: "text-blue-600" },
                    { icon: Phone, label: "Calls Used", value: `${contract.callsUsed ?? 0} / ${contract.callLimit ?? "Unlimited"}`, color: callLimitExceeded ? "text-danger-600" : "text-emerald-600", exceeded: callLimitExceeded },
                    { icon: DollarSign, label: "Value", value: contract.contractValue ? `${Number(contract.contractValue).toLocaleString()}` : "---", color: "text-amber-600" },
                ].map((card: any, i) => (
                    <div key={i} className={cn(
                        "bg-white dark:bg-neutral-900 rounded-2xl border p-4 shadow-sm",
                        card.exceeded
                            ? "border-danger-300 dark:border-danger-800 bg-danger-50/40 dark:bg-danger-900/10"
                            : "border-neutral-200/60 dark:border-neutral-800"
                    )}>
                        <div className="flex items-center gap-2 mb-1">
                            <card.icon size={14} className={card.color} />
                            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{card.label}</span>
                            {card.exceeded && <span className="ml-auto text-xs font-bold text-danger-600 dark:text-danger-400">⚠ Exceeded</span>}
                        </div>
                        <span className={cn(
                            "text-sm font-bold",
                            card.exceeded ? "text-danger-600 dark:text-danger-400" : "text-primary-950 dark:text-white"
                        )}>{card.value}</span>
                    </div>
                ))}
            </div>

            {/* Call limit exceeded banner */}
            {callLimitExceeded && (
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50">
                    <span className="text-lg leading-none">⚠️</span>
                    <div>
                        <p className="text-sm font-bold text-danger-700 dark:text-danger-400">Call Limit Exceeded</p>
                        <p className="text-xs text-danger-600 dark:text-danger-500 mt-0.5">
                            {contract.callsUsed} calls used out of {contract.callLimit} allowed. Contact the vendor to review the contract terms.
                        </p>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl w-fit">
                {(["info", "assets", "visits", "utilisation"] as const).map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={cn("px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all", activeTab === tab ? "bg-white dark:bg-neutral-700 text-primary-700 dark:text-primary-400 shadow-sm" : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700")}>
                        {tab}
                    </button>
                ))}
            </div>

            {/* Info Tab */}
            {activeTab === "info" && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 p-6 shadow-sm space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><span className="text-xs font-semibold text-neutral-500 uppercase">Vendor</span><p className="font-bold text-primary-950 dark:text-white mt-1">{contract.vendorName ?? "---"}</p></div>
                        <div><span className="text-xs font-semibold text-neutral-500 uppercase">Contact</span><p className="font-bold text-primary-950 dark:text-white mt-1">{contract.vendorContact ?? "---"}</p></div>
                        <div className="col-span-2"><span className="text-xs font-semibold text-neutral-500 uppercase">Coverage</span><p className="text-neutral-600 dark:text-neutral-400 mt-1">{contract.coverageScope ?? "---"}</p></div>
                    </div>
                </div>
            )}

            {/* Assets Tab */}
            {activeTab === "assets" && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                        <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Linked Assets ({linkedAssets.length})</span>
                        {canManage && <button onClick={() => setShowAddAsset(true)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50 transition-colors"><Plus size={12} /> Add Asset</button>}
                    </div>
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                <th className="py-3 px-6 font-bold">Asset</th>
                                <th className="py-3 px-6 font-bold">Number</th>
                                <th className="py-3 px-6 font-bold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {linkedAssets.map((a: any) => (
                                <tr key={a.id ?? a.assetId} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0">
                                    <td className="py-3 px-6 font-bold text-primary-950 dark:text-white">{a.asset?.name ?? a.name ?? "---"}</td>
                                    <td className="py-3 px-6 text-xs text-neutral-400">{a.asset?.assetNumber ?? a.assetNumber ?? "---"}</td>
                                    <td className="py-3 px-6 text-right">
                                        {canManage && <button onClick={() => handleRemoveAsset(a.assetId ?? a.id)} className="p-1.5 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors"><Trash2 size={14} /></button>}
                                    </td>
                                </tr>
                            ))}
                            {linkedAssets.length === 0 && (
                                <tr><td colSpan={3}><EmptyState icon="list" title="No assets linked" message="Add assets covered by this contract." /></td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Visits Tab */}
            {activeTab === "visits" && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                        <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Visit Log ({visits.length})</span>
                        {canManage && <button onClick={() => setShowVisitModal(true)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50 transition-colors"><Plus size={12} /> Log Visit</button>}
                    </div>
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                <th className="py-3 px-6 font-bold">Date</th>
                                <th className="py-3 px-6 font-bold">Technician</th>
                                <th className="py-3 px-6 font-bold">Notes</th>
                                <th className="py-3 px-6 font-bold text-right">Cost</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visits.map((v: any, idx: number) => (
                                <tr key={idx} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0">
                                    <td className="py-3 px-6 text-xs">{v.visitDate ? fmt.date(v.visitDate) : "---"}</td>
                                    <td className="py-3 px-6 text-xs font-bold text-primary-950 dark:text-white">{v.vendorTechName ?? "---"}</td>
                                    <td className="py-3 px-6 text-xs text-neutral-500 max-w-[200px] truncate">{v.serviceReport ?? "---"}</td>
                                    <td className="py-3 px-6 text-xs text-right font-bold">{v.invoiceAmount ? Number(v.invoiceAmount).toLocaleString() : "---"}</td>
                                </tr>
                            ))}
                            {visits.length === 0 && (
                                <tr><td colSpan={4}><EmptyState icon="list" title="No visits logged" message="Log a vendor visit to track contract usage." /></td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Utilisation Tab */}
            {activeTab === "utilisation" && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 p-6 shadow-sm space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Calls Used</span>
                            <div className="mt-2 flex items-center gap-3">
                                <div className="flex-1 bg-neutral-100 dark:bg-neutral-800 rounded-full h-3 overflow-hidden">
                                    <div className={cn("h-full rounded-full transition-all", callLimitExceeded ? "bg-danger-500" : callsPct >= 90 ? "bg-danger-500" : callsPct >= 70 ? "bg-warning-500" : "bg-primary-500")} style={{ width: `${Math.min(callsPct, 100)}%` }} />
                                </div>
                                <span className={cn("text-sm font-bold", callLimitExceeded ? "text-danger-600 dark:text-danger-400" : "text-neutral-700 dark:text-neutral-300")}>{callLimitExceeded ? '100%+' : `${callsPct}%`}</span>
                            </div>
                            <p className={cn("text-xs mt-1", callLimitExceeded ? "text-danger-600 dark:text-danger-400 font-semibold" : "text-neutral-400")}>
                                {contract.callsUsed ?? 0} of {contract.callLimit ?? "Unlimited"} calls used{callLimitExceeded ? " — Limit exceeded!" : ""}
                            </p>
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Cost Claimed</span>
                            <div className="mt-2 flex items-center gap-3">
                                <div className="flex-1 bg-neutral-100 dark:bg-neutral-800 rounded-full h-3 overflow-hidden">
                                    <div className={cn("h-full rounded-full transition-all", costPct >= 90 ? "bg-danger-500" : costPct >= 70 ? "bg-warning-500" : "bg-emerald-500")} style={{ width: `${costPct}%` }} />
                                </div>
                                <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300">{costPct.toFixed(1)}%</span>
                            </div>
                            <p className="text-xs text-neutral-400 mt-1">
                                {effectiveCostClaimed > 0 ? Number(effectiveCostClaimed).toLocaleString() : "0"} of {contract.contractValue ? Number(contract.contractValue).toLocaleString() : "---"}
                                {usingCostFallback && <span className="ml-1 text-warning-500">*</span>}
                            </p>
                            {usingCostFallback && <p className="text-[10px] text-warning-500 dark:text-warning-400 mt-0.5">* Computed from visit invoices</p>}
                        </div>
                    </div>
                </div>
            )}

            {/* Add Asset Modal */}
            {showAddAsset && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowAddAsset(false)}>
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
                            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Add Asset</h3>
                            <button onClick={() => setShowAddAsset(false)} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:text-neutral-300 dark:hover:bg-neutral-800 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="px-6 py-4 space-y-3">
                            <input type="text" placeholder="Search assets..." value={assetSearch} onChange={(e) => setAssetSearch(e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                            <div className="max-h-48 overflow-y-auto space-y-1">
                                {searchAssets.map((a: any) => (
                                    <button key={a.id} onClick={() => handleAddAsset(a.id)} disabled={addAssetMutation.isPending} className="w-full text-left px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg text-sm transition-colors flex items-center justify-between">
                                        <div>
                                            <span className="font-bold text-primary-950 dark:text-white">{a.name}</span>
                                            <span className="text-xs text-neutral-400 ml-2">{a.assetNumber}</span>
                                        </div>
                                        <Plus size={14} className="text-primary-500" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Log Visit Modal */}
            {showVisitModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowVisitModal(false)}>
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
                            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Log Visit</h3>
                            <button onClick={() => setShowVisitModal(false)} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:text-neutral-300 dark:hover:bg-neutral-800 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="px-6 py-4 space-y-4">
                            <div><label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Visit Date</label><input type="date" value={visitForm.visitDate} onChange={(e) => setVisitForm({ ...visitForm, visitDate: e.target.value })} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" /></div>
                            <div><label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Technician</label><input type="text" value={visitForm.vendorTechName} onChange={(e) => setVisitForm({ ...visitForm, vendorTechName: e.target.value })} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" /></div>
                            <div><label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Notes</label><textarea rows={2} value={visitForm.serviceReport} onChange={(e) => setVisitForm({ ...visitForm, serviceReport: e.target.value })} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all resize-none" /></div>
                            <div><label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Cost</label><input type="number" value={visitForm.invoiceAmount} onChange={(e) => setVisitForm({ ...visitForm, invoiceAmount: e.target.value })} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" /></div>
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setShowVisitModal(false)} className="px-4 py-2 text-sm font-medium rounded-xl border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                                <button onClick={handleLogVisit} disabled={logVisitMutation.isPending} className="px-6 py-2 text-sm font-bold rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center gap-2">
                                    {logVisitMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                    Log Visit
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
