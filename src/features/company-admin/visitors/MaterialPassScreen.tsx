import { useState } from "react";
import { Package, Plus, Loader2, X, Search, RotateCcw, Eye, QrCode, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMaterialPasses, useGates } from "@/features/company-admin/api/use-visitor-queries";
import { useCreateMaterialPass, useReturnMaterialPass } from "@/features/company-admin/api/use-visitor-mutations";
import { useCanPerform } from "@/hooks/useCanPerform";
import { useCompanyFormatter } from "@/hooks/useCompanyFormatter";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { useEmployees } from "@/features/company-admin/api/use-hr-queries";
import { useCompanyLocations } from "@/features/company-admin/api/use-company-admin-queries";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

const MATERIAL_TYPES = ["INWARD", "OUTWARD", "RETURNABLE"] as const;

const EMPTY_FORM = { description: "", quantityIssued: "", type: "INWARD" as string, authorizedBy: "", purpose: "", gateId: "", plantId: "", expectedReturnDate: "" };

export function MaterialPassScreen() {
    const fmt = useCompanyFormatter();
    const canCreate = useCanPerform("visitors:create");
    const { data, isLoading, isError } = useMaterialPasses();
    const createMutation = useCreateMaterialPass();
    const returnMutation = useReturnMaterialPass();

    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [returnTarget, setReturnTarget] = useState<any>(null);
    const [returnQuantity, setReturnQuantity] = useState("");
    const [returnStatus, setReturnStatus] = useState<"PARTIAL" | "FULLY_RETURNED">("FULLY_RETURNED");
    const [viewTarget, setViewTarget] = useState<any>(null);
    const [qrTarget, setQrTarget] = useState<any>(null);

    const employeesQuery = useEmployees({ limit: 500 });
    const employees: any[] = employeesQuery.data?.data ?? [];
    const locationsQuery = useCompanyLocations();
    const locations: any[] = (locationsQuery.data as any)?.data ?? [];
    const gatesQuery = useGates();
    const gates: any[] = gatesQuery.data?.data ?? [];

    const filteredGates = gates.filter((g: any) => !form.plantId || g.plantId === form.plantId);

    const passes: any[] = data?.data ?? [];
    const filtered = passes.filter((p: any) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return p.description?.toLowerCase().includes(s) || p.passNumber?.toLowerCase().includes(s);
    });

    const handleSave = async () => {
        try {
            const payload = {
                type: form.type,
                description: form.description,
                quantityIssued: form.quantityIssued || undefined,
                authorizedBy: form.authorizedBy,
                purpose: form.purpose,
                gateId: form.gateId,
                plantId: form.plantId,
                expectedReturnDate: form.expectedReturnDate || undefined,
            };
            await createMutation.mutateAsync(payload);
            showSuccess("Material Pass Created", "Material gate pass has been created.");
            setModalOpen(false);
            setForm({ ...EMPTY_FORM });
        } catch (err) { showApiError(err); }
    };

    const handleReturn = async () => {
        if (!returnTarget || !returnQuantity.trim()) return;
        try {
            await returnMutation.mutateAsync({ id: returnTarget.id, data: { quantityReturned: returnQuantity.trim(), returnStatus } });
            showSuccess("Material Returned", "Material return has been recorded.");
            setReturnTarget(null);
            setReturnQuantity("");
            setReturnStatus("FULLY_RETURNED");
        } catch (err) { showApiError(err); }
    };

    const updateField = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

    const handlePrintPass = (pass: any) => {
        const printWindow = window.open("", "_blank", "width=600,height=800");
        if (!printWindow) return;
        const returnStatusLabel = pass.returnStatus === "FULLY_RETURNED" ? "Returned" : pass.returnStatus === "PENDING_RETURN" ? "Pending Return" : pass.returnStatus === "PARTIAL" ? "Partial" : "N/A";
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Material Gate Pass - ${pass.passNumber || "Pass"}</title>
                <style>
                    body { font-family: Inter, system-ui, -apple-system, sans-serif; margin: 0; padding: 40px; background: #fff; color: #1e1b4b; }
                    .pass-container { max-width: 500px; margin: 0 auto; border: 2px solid #e5e7eb; border-radius: 16px; padding: 32px; }
                    .pass-title { text-align: center; font-size: 22px; font-weight: 800; text-transform: uppercase; letter-spacing: 3px; color: #4f46e5; margin-bottom: 4px; }
                    .company-divider { border-top: 2px solid #e5e7eb; margin: 16px 0; }
                    .pass-number { text-align: center; font-size: 28px; font-weight: 900; font-family: monospace; color: #1e1b4b; margin: 12px 0; }
                    .qr-section { text-align: center; margin: 20px 0; }
                    .qr-section img { border: 2px solid #e5e7eb; border-radius: 12px; padding: 8px; }
                    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 20px 0; }
                    .detail-item { }
                    .detail-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #9ca3af; margin-bottom: 4px; }
                    .detail-value { font-size: 14px; font-weight: 600; color: #1e1b4b; }
                    .detail-full { grid-column: 1 / -1; }
                    .type-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; }
                    .type-inward { background: #dcfce7; color: #15803d; }
                    .type-outward { background: #fef3c7; color: #a16207; }
                    .type-returnable { background: #ede9fe; color: #7c3aed; }
                    .instructions { text-align: center; font-size: 12px; color: #9ca3af; margin-top: 20px; padding-top: 16px; border-top: 1px dashed #e5e7eb; }
                    @media print { body { padding: 20px; } .pass-container { border: 1px solid #ccc; } }
                </style>
            </head>
            <body>
                <div class="pass-container">
                    <div class="pass-title">Material Gate Pass</div>
                    <div class="company-divider"></div>
                    <div class="pass-number">${pass.passNumber || "---"}</div>
                    ${pass.qrCode ? `<div class="qr-section"><img src="${pass.qrCode}" width="180" height="180" alt="QR Code" /></div>` : ""}
                    <div class="detail-grid">
                        <div class="detail-item detail-full">
                            <div class="detail-label">Material Description</div>
                            <div class="detail-value">${pass.description || "---"}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Type</div>
                            <div class="detail-value"><span class="type-badge type-${(pass.type || "inward").toLowerCase()}">${pass.type || "INWARD"}</span></div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Quantity Issued</div>
                            <div class="detail-value" style="font-family:monospace;">${pass.quantityIssued || "---"}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Authorized By</div>
                            <div class="detail-value">${pass.authorizedByName ?? pass.authorizedBy ?? "---"}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Return Status</div>
                            <div class="detail-value">${returnStatusLabel}</div>
                        </div>
                        <div class="detail-item detail-full">
                            <div class="detail-label">Purpose</div>
                            <div class="detail-value">${pass.purpose || "---"}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Gate</div>
                            <div class="detail-value">${pass.gate?.name ?? "---"}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Date</div>
                            <div class="detail-value">${pass.createdAt ? fmt.dateTime(pass.createdAt) : "---"}</div>
                        </div>
                    </div>
                    <div class="instructions">This pass must be presented at the gate for material verification.</div>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.onload = () => { printWindow.print(); printWindow.close(); };
    };

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
                                    <th className="py-4 px-6 font-bold">Pass No.</th>
                                    <th className="py-4 px-6 font-bold text-center">Qty Issued</th>
                                    <th className="py-4 px-6 font-bold">Type</th>
                                    <th className="py-4 px-6 font-bold">Authorized By</th>
                                    <th className="py-4 px-6 font-bold">Date</th>
                                    <th className="py-4 px-6 font-bold text-center">Return Status</th>
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
                                        <td className="py-4 px-6">
                                            {p.passNumber ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary-50 dark:bg-primary-900/30 text-[11px] font-bold font-mono text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800">{p.passNumber}</span>
                                            ) : <span className="text-neutral-400 text-xs">---</span>}
                                        </td>
                                        <td className="py-4 px-6 text-center font-mono font-bold text-primary-950 dark:text-white">{p.quantityIssued || "---"}</td>
                                        <td className="py-4 px-6">
                                            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", p.type === "INWARD" ? "bg-success-50 text-success-700 border-success-200" : p.type === "RETURNABLE" ? "bg-accent-50 text-accent-700 border-accent-200" : "bg-warning-50 text-warning-700 border-warning-200")}>{p.type || "INWARD"}</span>
                                        </td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">{p.authorizedByName ?? p.authorizedBy ?? "---"}</td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">{p.createdAt ? fmt.dateTime(p.createdAt) : "---"}</td>
                                        <td className="py-4 px-6 text-center">
                                            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", p.returnStatus === "FULLY_RETURNED" ? "bg-success-50 text-success-700 border-success-200" : p.returnStatus === "PENDING_RETURN" ? "bg-warning-50 text-warning-700 border-warning-200" : p.returnStatus === "PARTIAL" ? "bg-info-50 text-info-700 border-info-200" : "bg-neutral-100 text-neutral-600 border-neutral-200")}>{p.returnStatus === "FULLY_RETURNED" ? "Returned" : p.returnStatus === "PENDING_RETURN" ? "Pending Return" : p.returnStatus === "PARTIAL" ? "Partial" : "N/A"}</span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="inline-flex items-center gap-2">
                                                {p.qrCode && (
                                                    <button onClick={() => setQrTarget(p)} className="p-2 text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-900/30 rounded-lg transition-colors" title="View QR Code"><QrCode size={15} /></button>
                                                )}
                                                <button onClick={() => handlePrintPass(p)} className="p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors" title="Print Pass"><Printer size={15} /></button>
                                                <button onClick={() => setViewTarget(p)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100 transition-colors dark:bg-primary-900/30 dark:text-primary-300 dark:border-primary-800 dark:hover:bg-primary-900/50">
                                                    <Eye size={12} /> View
                                                </button>
                                                {(p.returnStatus === "PENDING_RETURN" || p.returnStatus === "PARTIAL") && canCreate && (
                                                    <button onClick={() => setReturnTarget(p)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-info-50 text-info-700 border border-info-200 hover:bg-info-100 transition-colors">
                                                        <RotateCcw size={12} /> Return
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && !isLoading && (
                                    <tr><td colSpan={8}><EmptyState icon="list" title="No material passes" message="Create a pass to track material movement." /></td></tr>
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
                                <div><label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Quantity Issued</label><input type="text" value={form.quantityIssued} onChange={(e) => updateField("quantityIssued", e.target.value)} placeholder='e.g. "5 boxes"' className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm dark:text-white placeholder:text-neutral-400 transition-all" /></div>
                                <div><label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Type *</label>
                                    <select value={form.type} onChange={(e) => updateField("type", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm dark:text-white">
                                        {MATERIAL_TYPES.map((mt) => <option key={mt} value={mt}>{mt}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <SearchableSelect
                                        label="Authorized By"
                                        value={form.authorizedBy}
                                        onChange={(v) => updateField("authorizedBy", v)}
                                        options={employees.map((e: any) => ({
                                            value: e.id,
                                            label: `${e.firstName} ${e.lastName}`,
                                            sublabel: e.designation?.name ?? e.department?.name ?? e.employeeCode ?? "",
                                        }))}
                                        placeholder="Search employee..."
                                        required
                                    />
                                </div>
                                <div><label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Purpose *</label><input type="text" value={form.purpose} onChange={(e) => updateField("purpose", e.target.value)} placeholder="Purpose" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm dark:text-white placeholder:text-neutral-400 transition-all" /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <SearchableSelect
                                        label="Location (Plant)"
                                        value={form.plantId}
                                        onChange={(v) => { updateField("plantId", v); updateField("gateId", ""); }}
                                        options={locations.map((l: any) => ({
                                            value: l.id,
                                            label: l.name,
                                            sublabel: l.city ? `${l.city}, ${l.state ?? ""}` : undefined,
                                        }))}
                                        placeholder="Select location..."
                                        required
                                    />
                                </div>
                                <div>
                                    <SearchableSelect
                                        label="Gate"
                                        value={form.gateId}
                                        onChange={(v) => updateField("gateId", v)}
                                        options={filteredGates.map((g: any) => ({
                                            value: g.id,
                                            label: `${g.name} (${g.code})`,
                                        }))}
                                        placeholder="Select gate..."
                                        required
                                    />
                                </div>
                            </div>
                            {form.type === "RETURNABLE" && (
                                <div><label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Expected Return Date</label><input type="date" value={form.expectedReturnDate} onChange={(e) => updateField("expectedReturnDate", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm dark:text-white transition-all" /></div>
                            )}
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 transition-colors">Cancel</button>
                            <button onClick={handleSave} disabled={createMutation.isPending || !form.description || !form.authorizedBy || !form.purpose || !form.gateId || !form.plantId} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {createMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                {createMutation.isPending ? "Creating..." : "Create Pass"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Return Modal */}
            {returnTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold text-primary-950 dark:text-white mb-2">Record Material Return</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Record return for <strong>{returnTarget.description}</strong>.</p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Quantity Returned *</label>
                                <input type="text" value={returnQuantity} onChange={(e) => setReturnQuantity(e.target.value)} placeholder='e.g. "3 boxes"' className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Return Status *</label>
                                <select value={returnStatus} onChange={(e) => setReturnStatus(e.target.value as "PARTIAL" | "FULLY_RETURNED")} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm dark:text-white">
                                    <option value="FULLY_RETURNED">Fully Returned</option>
                                    <option value="PARTIAL">Partial</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => { setReturnTarget(null); setReturnQuantity(""); setReturnStatus("FULLY_RETURNED"); }} className="flex-1 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleReturn} disabled={returnMutation.isPending || !returnQuantity.trim()} className="flex-1 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50">{returnMutation.isPending ? "Saving..." : "Confirm Return"}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* QR Code Modal */}
            {qrTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">Pass QR Code</h2>
                            <button onClick={() => setQrTarget(null)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 flex flex-col items-center">
                            <div className="bg-white p-4 rounded-2xl border border-neutral-100 shadow-inner">
                                <img src={qrTarget.qrCode} alt="QR Code" className="w-48 h-48" />
                            </div>
                            <p className="mt-4 font-mono text-sm font-bold text-primary-950 dark:text-white">{qrTarget.passNumber}</p>
                            <p className="mt-1 text-sm font-bold text-neutral-700 dark:text-neutral-300">{qrTarget.description}</p>
                            <span className={cn("mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full border", qrTarget.type === "INWARD" ? "bg-success-50 text-success-700 border-success-200" : qrTarget.type === "RETURNABLE" ? "bg-accent-50 text-accent-700 border-accent-200" : "bg-warning-50 text-warning-700 border-warning-200")}>{qrTarget.type || "INWARD"}</span>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button
                                onClick={() => {
                                    const link = document.createElement("a");
                                    link.href = qrTarget.qrCode;
                                    link.download = `material-pass-${qrTarget.passNumber}.png`;
                                    link.click();
                                }}
                                className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
                            >
                                Download
                            </button>
                            <button onClick={() => handlePrintPass(qrTarget)} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2">
                                <Printer size={14} /> Print
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Detail Modal */}
            {viewTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-warning-50 dark:bg-warning-900/30 flex items-center justify-center"><Package className="w-5 h-5 text-warning-600" /></div>
                                <div>
                                    <h2 className="text-lg font-bold text-primary-950 dark:text-white">Material Pass Details</h2>
                                    {viewTarget.passNumber && <p className="text-xs font-mono font-bold text-primary-600">{viewTarget.passNumber}</p>}
                                </div>
                            </div>
                            <button onClick={() => setViewTarget(null)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto">
                            <div>
                                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Description</p>
                                <p className="text-sm font-bold text-primary-950 dark:text-white">{viewTarget.description || "---"}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Type</p>
                                    <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full border", viewTarget.type === "INWARD" ? "bg-success-50 text-success-700 border-success-200" : viewTarget.type === "RETURNABLE" ? "bg-accent-50 text-accent-700 border-accent-200" : "bg-warning-50 text-warning-700 border-warning-200")}>{viewTarget.type || "INWARD"}</span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Qty Issued</p>
                                    <p className="text-sm font-mono font-bold text-primary-950 dark:text-white">{viewTarget.quantityIssued || "---"}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Qty Returned</p>
                                    <p className="text-sm font-mono text-neutral-700 dark:text-neutral-300">{viewTarget.quantityReturned || "---"}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Return Status</p>
                                    <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full border", viewTarget.returnStatus === "FULLY_RETURNED" ? "bg-success-50 text-success-700 border-success-200" : viewTarget.returnStatus === "PENDING_RETURN" ? "bg-warning-50 text-warning-700 border-warning-200" : viewTarget.returnStatus === "PARTIAL" ? "bg-info-50 text-info-700 border-info-200" : "bg-neutral-100 text-neutral-600 border-neutral-200")}>{viewTarget.returnStatus === "FULLY_RETURNED" ? "Returned" : viewTarget.returnStatus === "PENDING_RETURN" ? "Pending Return" : viewTarget.returnStatus === "PARTIAL" ? "Partial" : "N/A"}</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Authorized By</p>
                                <p className="text-sm text-neutral-700 dark:text-neutral-300">{viewTarget.authorizedByName ?? viewTarget.authorizedBy ?? "---"}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Purpose</p>
                                <p className="text-sm text-neutral-700 dark:text-neutral-300">{viewTarget.purpose || "---"}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Gate</p>
                                    <p className="text-sm text-neutral-700 dark:text-neutral-300">{viewTarget.gate?.name ?? viewTarget.gateName ?? "---"}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Plant / Location</p>
                                    <p className="text-sm text-neutral-700 dark:text-neutral-300">{viewTarget.plant?.name ?? viewTarget.plantName ?? "---"}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Created Date</p>
                                    <p className="text-sm text-neutral-700 dark:text-neutral-300">{viewTarget.createdAt ? fmt.dateTime(viewTarget.createdAt) : "---"}</p>
                                </div>
                                {viewTarget.expectedReturnDate && (
                                    <div>
                                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Expected Return</p>
                                        <p className="text-sm text-neutral-700 dark:text-neutral-300">{fmt.date(viewTarget.expectedReturnDate)}</p>
                                    </div>
                                )}
                            </div>
                            {viewTarget.qrCode && (
                                <div className="flex flex-col items-center pt-2">
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">QR Code</p>
                                    <div className="bg-white p-3 rounded-xl border border-neutral-100 shadow-inner">
                                        <img src={viewTarget.qrCode} alt="QR Code" className="w-36 h-36" />
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setViewTarget(null)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Close</button>
                            <button onClick={() => handlePrintPass(viewTarget)} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"><Printer size={14} /> Print Pass</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
