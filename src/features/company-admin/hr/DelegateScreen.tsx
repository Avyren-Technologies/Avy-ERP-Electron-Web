import { useState } from "react";
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import {
    UserCheck,
    Plus,
    Loader2,
    X,
    Search,
    ArrowRight,
    Info,
    XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDelegates } from "@/features/company-admin/api/use-transfer-queries";
import { useCreateDelegate, useRevokeDelegate } from "@/features/company-admin/api/use-transfer-mutations";
import { useEmployees } from "@/features/company-admin/api/use-hr-queries";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Helpers ── */

// formatDate moved inside component

const EMPTY_FORM = {
    managerId: "", delegateId: "", fromDate: "", toDate: "", reason: "",
};

/* ── Screen ── */

export function DelegateScreen() {
    const fmt = useCompanyFormatter();
    const formatDate = (d: string | null | undefined) => d ? fmt.date(d) : "—";
    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [revokeTarget, setRevokeTarget] = useState<any>(null);

    const delegatesQuery = useDelegates();
    const employeesQuery = useEmployees();
    const createMutation = useCreateDelegate();
    const revokeMutation = useRevokeDelegate();

    const delegates: any[] = delegatesQuery.data?.data ?? [];
    const employees: any[] = employeesQuery.data?.data ?? [];

    const getEmployeeName = (id: string) => {
        const e = employees.find((emp: any) => emp.id === id);
        return e ? `${e.firstName ?? ""} ${e.lastName ?? ""}`.trim() || e.email || id : id;
    };

    const filtered = delegates.filter((r: any) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (r.managerName || getEmployeeName(r.managerId))?.toLowerCase().includes(q) ||
            (r.delegateName || getEmployeeName(r.delegateId))?.toLowerCase().includes(q);
    });

    const openCreate = () => { setForm({ ...EMPTY_FORM }); setModalOpen(true); };
    const updateField = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));

    const handleCreate = async () => {
        try {
            await createMutation.mutateAsync(form);
            showSuccess("Delegation Created", "Manager delegation has been set up.");
            setModalOpen(false);
        } catch (err) { showApiError(err); }
    };

    const handleRevoke = async () => {
        if (!revokeTarget) return;
        try {
            await revokeMutation.mutateAsync(revokeTarget.id);
            showSuccess("Delegation Revoked", "Manager delegation has been revoked.");
            setRevokeTarget(null);
        } catch (err) { showApiError(err); }
    };

    const sameManager = form.managerId && form.delegateId && form.managerId === form.delegateId;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Manager Delegation</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Temporarily delegate approval authority when managers are unavailable</p>
                </div>
                <button onClick={openCreate} className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none">
                    <Plus className="w-5 h-5" />
                    Add Delegation
                </button>
            </div>

            {/* Info Banner */}
            <div className="bg-info-50 dark:bg-info-900/20 border border-info-200 dark:border-info-800/50 rounded-2xl p-4 flex items-start gap-3">
                <Info size={18} className="text-info-600 dark:text-info-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-info-700 dark:text-info-400">
                    When a manager is on leave, their approval authority is temporarily delegated to the specified person. Active delegations apply to all pending and new approval requests within the delegation period.
                </p>
            </div>

            {/* Search */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input type="text" placeholder="Search by manager or delegate name..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {delegatesQuery.isLoading ? <SkeletonTable rows={5} cols={6} /> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Manager</th>
                                    <th className="py-4 px-6 font-bold"></th>
                                    <th className="py-4 px-6 font-bold">Delegate</th>
                                    <th className="py-4 px-6 font-bold">From Date</th>
                                    <th className="py-4 px-6 font-bold">To Date</th>
                                    <th className="py-4 px-6 font-bold text-center">Active</th>
                                    <th className="py-4 px-6 font-bold">Reason</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.map((r: any) => (
                                    <tr key={r.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-accent-50 dark:bg-accent-900/30 flex items-center justify-center shrink-0">
                                                    <UserCheck className="w-4 h-4 text-accent-600 dark:text-accent-400" />
                                                </div>
                                                <span className="font-bold text-primary-950 dark:text-white">{r.managerName || getEmployeeName(r.managerId)}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6"><ArrowRight size={14} className="text-neutral-300" /></td>
                                        <td className="py-4 px-6 font-semibold text-primary-700 dark:text-primary-400">{r.delegateName || getEmployeeName(r.delegateId)}</td>
                                        <td className="py-4 px-6 text-xs text-neutral-600 dark:text-neutral-400">{formatDate(r.fromDate)}</td>
                                        <td className="py-4 px-6 text-xs text-neutral-600 dark:text-neutral-400">{formatDate(r.toDate)}</td>
                                        <td className="py-4 px-6 text-center">
                                            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border",
                                                r.active !== false
                                                    ? "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50"
                                                    : "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700"
                                            )}>{r.active !== false ? "Active" : "Revoked"}</span>
                                        </td>
                                        <td className="py-4 px-6 text-xs text-neutral-500 dark:text-neutral-400 max-w-[200px] truncate">{r.reason || "—"}</td>
                                        <td className="py-4 px-6 text-right">
                                            {r.active !== false && (
                                                <button onClick={() => setRevokeTarget(r)} className="p-1.5 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" title="Revoke">
                                                    <XCircle size={15} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && !delegatesQuery.isLoading && (
                                    <tr><td colSpan={8}><EmptyState icon="list" title="No delegations" message="Add a delegation to temporarily transfer approval authority." action={{ label: "Add Delegation", onClick: openCreate }} /></td></tr>
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
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">Add Delegation</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Manager *</label>
                                <select value={form.managerId} onChange={(e) => updateField("managerId", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                    <option value="">Select manager...</option>
                                    {employees.map((e: any) => <option key={e.id} value={e.id}>{`${e.firstName ?? ""} ${e.lastName ?? ""}`.trim() || e.id}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Delegate *</label>
                                <select value={form.delegateId} onChange={(e) => updateField("delegateId", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                    <option value="">Select delegate...</option>
                                    {employees.map((e: any) => <option key={e.id} value={e.id}>{`${e.firstName ?? ""} ${e.lastName ?? ""}`.trim() || e.id}</option>)}
                                </select>
                            </div>
                            {sameManager && (
                                <p className="text-xs text-danger-600 dark:text-danger-400 font-medium">Manager and delegate must be different people.</p>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">From Date *</label>
                                    <input type="date" value={form.fromDate} onChange={(e) => updateField("fromDate", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">To Date *</label>
                                    <input type="date" value={form.toDate} onChange={(e) => updateField("toDate", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Reason (optional)</label>
                                <textarea value={form.reason} onChange={(e) => updateField("reason", e.target.value)} placeholder="e.g. Annual leave" rows={2} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none" />
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleCreate} disabled={createMutation.isPending || !!sameManager} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {createMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                {createMutation.isPending ? "Saving..." : "Add Delegation"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Revoke Confirmation */}
            {revokeTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">Revoke Delegation?</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            This will revoke the delegation from <strong>{revokeTarget.managerName || getEmployeeName(revokeTarget.managerId)}</strong> to <strong>{revokeTarget.delegateName || getEmployeeName(revokeTarget.delegateId)}</strong>.
                        </p>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setRevokeTarget(null)} className="flex-1 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleRevoke} disabled={revokeMutation.isPending} className="flex-1 py-3 rounded-xl bg-danger-600 hover:bg-danger-700 text-white text-sm font-bold transition-colors disabled:opacity-50">{revokeMutation.isPending ? "Revoking..." : "Revoke"}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
