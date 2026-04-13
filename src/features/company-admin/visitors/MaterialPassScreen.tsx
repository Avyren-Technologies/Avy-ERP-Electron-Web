import { useState } from "react";
import { Package, Plus, Loader2, X, Search, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMaterialPasses } from "@/features/company-admin/api/use-visitor-queries";
import { useCreateMaterialPass, useReturnMaterialPass } from "@/features/company-admin/api/use-visitor-mutations";
import { useCanPerform } from "@/hooks/useCanPerform";
import { useCompanyFormatter } from "@/hooks/useCompanyFormatter";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

const EMPTY_FORM = { description: "", quantity: "1", type: "INWARD", visitorName: "", vehicleNumber: "", purpose: "", remarks: "" };

export function MaterialPassScreen() {
    const fmt = useCompanyFormatter();
    const canCreate = useCanPerform("visitors:create");
    const { data, isLoading, isError } = useMaterialPasses();
    const createMutation = useCreateMaterialPass();
    const returnMutation = useReturnMaterialPass();

    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [actionId, setActionId] = useState<string | null>(null);

    const passes: any[] = data?.data ?? [];
    const filtered = passes.filter((p: any) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return p.description?.toLowerCase().includes(s) || p.visitorName?.toLowerCase().includes(s);
    });

    const handleSave = async () => {
        try {
            await createMutation.mutateAsync({ ...form, quantity: Number(form.quantity) || 1 });
            showSuccess("Material Pass Created", "Material gate pass has been created.");
            setModalOpen(false);
            setForm({ ...EMPTY_FORM });
        } catch (err) { showApiError(err); }
    };

    const handleReturn = async (id: string) => {
        try {
            setActionId(id);
            await returnMutation.mutateAsync({ id });
            showSuccess("Material Returned", "Material has been marked as returned.");
        } catch (err) { showApiError(err); } finally { setActionId(null); }
    };

    const updateField = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Material Gate Passes</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Track material inward and outward movement</p>
                </div>
                {canCreate && (
                    <button onClick={() => { setForm({ ...EMPTY_FORM }); setModalOpen(true); }} className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none">
                        <Plus className="w-5 h-5" /> New Material Pass
                    </button>
                )}
            </div>

            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input type="text" placeholder="Search materials..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                </div>
            </div>

            {isError && <div className="bg-danger-50 border border-danger-200 rounded-xl p-4 text-sm text-danger-700 font-medium">Failed to load material passes.</div>}

            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? <SkeletonTable rows={5} cols={7} /> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Description</th>
                                    <th className="py-4 px-6 font-bold text-center">Qty</th>
                                    <th className="py-4 px-6 font-bold">Direction</th>
                                    <th className="py-4 px-6 font-bold">Visitor / Carrier</th>
                                    <th className="py-4 px-6 font-bold">Date</th>
                                    <th className="py-4 px-6 font-bold text-center">Status</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.map((p: any) => (
                                    <tr key={p.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-warning-50 dark:bg-warning-900/30 flex items-center justify-center shrink-0"><Package className="w-4 h-4 text-warning-600" /></div>
                                                <span className="font-bold text-primary-950 dark:text-white">{p.description || "Material"}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-center font-mono font-bold text-primary-950 dark:text-white">{p.quantity || 1}</td>
                                        <td className="py-4 px-6">
                                            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", p.type === "INWARD" ? "bg-success-50 text-success-700 border-success-200" : "bg-warning-50 text-warning-700 border-warning-200")}>{p.type || "INWARD"}</span>
                                        </td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">{p.visitorName || "---"}</td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">{p.createdAt ? fmt.dateTime(p.createdAt) : "---"}</td>
                                        <td className="py-4 px-6 text-center">
                                            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", p.returnedAt ? "bg-neutral-100 text-neutral-600 border-neutral-200" : "bg-info-50 text-info-700 border-info-200")}>{p.returnedAt ? "Returned" : "Pending"}</span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            {!p.returnedAt && canCreate && (
                                                <button onClick={() => handleReturn(p.id)} disabled={actionId === p.id} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-info-50 text-info-700 border border-info-200 hover:bg-info-100 transition-colors disabled:opacity-50">
                                                    {actionId === p.id ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />} Return
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && !isLoading && (
                                    <tr><td colSpan={7}><EmptyState icon="list" title="No material passes" message="Create a pass to track material movement." /></td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">New Material Pass</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div><label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Material Description *</label><input type="text" value={form.description} onChange={(e) => updateField("description", e.target.value)} placeholder="Describe material" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm dark:text-white placeholder:text-neutral-400 transition-all" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Quantity</label><input type="number" value={form.quantity} onChange={(e) => updateField("quantity", e.target.value)} min={1} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm dark:text-white transition-all" /></div>
                                <div><label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Direction</label>
                                    <select value={form.type} onChange={(e) => updateField("type", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm dark:text-white">
                                        <option value="INWARD">Inward</option>
                                        <option value="OUTWARD">Outward</option>
                                    </select>
                                </div>
                            </div>
                            <div><label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Visitor / Carrier Name</label><input type="text" value={form.visitorName} onChange={(e) => updateField("visitorName", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm dark:text-white placeholder:text-neutral-400 transition-all" /></div>
                            <div><label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Purpose</label><input type="text" value={form.purpose} onChange={(e) => updateField("purpose", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm dark:text-white placeholder:text-neutral-400 transition-all" /></div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 transition-colors">Cancel</button>
                            <button onClick={handleSave} disabled={createMutation.isPending || !form.description} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {createMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                {createMutation.isPending ? "Creating..." : "Create Pass"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
