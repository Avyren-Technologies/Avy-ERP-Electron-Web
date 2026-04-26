import { useState } from "react";
import { Car, Plus, Loader2, X, Search, LogOut, Eye, QrCode, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVehiclePasses, useGates } from "@/features/company-admin/api/use-visitor-queries";
import { useCreateVehiclePass, useRecordVehicleExit } from "@/features/company-admin/api/use-visitor-mutations";
import { useCanPerform } from "@/hooks/useCanPerform";
import { useCompanyFormatter } from "@/hooks/useCompanyFormatter";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { useCompanyLocations } from "@/features/company-admin/api/use-company-admin-queries";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

const VEHICLE_TYPES = ["CAR", "TWO_WHEELER", "AUTO", "TRUCK", "VAN", "TEMPO", "BUS"] as const;

const EMPTY_FORM = { vehicleRegNumber: "", vehicleType: "CAR", driverName: "", driverMobile: "", purpose: "", visitId: "", materialDescription: "", entryGateId: "", plantId: "" };

export function VehiclePassScreen() {
    const fmt = useCompanyFormatter();
    const canCreate = useCanPerform("visitors:create");
    const { data, isLoading, isError } = useVehiclePasses();
    const createMutation = useCreateVehiclePass();
    const exitMutation = useRecordVehicleExit();

    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [exitTarget, setExitTarget] = useState<any>(null);
    const [exitGateId, setExitGateId] = useState("");
    const [viewTarget, setViewTarget] = useState<any>(null);
    const [qrTarget, setQrTarget] = useState<any>(null);

    const locationsQuery = useCompanyLocations();
    const locations: any[] = (locationsQuery.data as any)?.data ?? [];
    const gatesQuery = useGates();
    const gates: any[] = gatesQuery.data?.data ?? [];

    const filteredGates = gates.filter((g: any) => !form.plantId || g.plantId === form.plantId);

    const passes: any[] = data?.data ?? [];
    const filtered = passes.filter((p: any) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return p.vehicleRegNumber?.toLowerCase().includes(s) || p.driverName?.toLowerCase().includes(s) || p.passNumber?.toLowerCase().includes(s);
    });

    const handleSave = async () => {
        try {
            const payload = {
                vehicleRegNumber: form.vehicleRegNumber,
                vehicleType: form.vehicleType,
                driverName: form.driverName,
                driverMobile: form.driverMobile || undefined,
                purpose: form.purpose,
                visitId: form.visitId || undefined,
                materialDescription: form.materialDescription || undefined,
                entryGateId: form.entryGateId,
                plantId: form.plantId,
            };
            await createMutation.mutateAsync(payload);
            showSuccess("Vehicle Pass Created", `Pass for ${form.vehicleRegNumber} has been created.`);
            setModalOpen(false);
            setForm({ ...EMPTY_FORM });
        } catch (err) { showApiError(err); }
    };

    const handleExit = async () => {
        if (!exitTarget || !exitGateId.trim()) return;
        try {
            await exitMutation.mutateAsync({ id: exitTarget.id, data: { exitGateId: exitGateId.trim() } });
            showSuccess("Vehicle Exit Recorded", "Vehicle exit has been logged.");
            setExitTarget(null);
            setExitGateId("");
        } catch (err) { showApiError(err); }
    };

    const updateField = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

    const handlePrintPass = (pass: any) => {
        const printWindow = window.open("", "_blank", "width=600,height=800");
        if (!printWindow) return;
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Vehicle Gate Pass - ${pass.passNumber || "Pass"}</title>
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
                    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; }
                    .status-onsite { background: #dcfce7; color: #15803d; }
                    .status-exited { background: #f3f4f6; color: #6b7280; }
                    .instructions { text-align: center; font-size: 12px; color: #9ca3af; margin-top: 20px; padding-top: 16px; border-top: 1px dashed #e5e7eb; }
                    @media print { body { padding: 20px; } .pass-container { border: 1px solid #ccc; } }
                </style>
            </head>
            <body>
                <div class="pass-container">
                    <div class="pass-title">Vehicle Gate Pass</div>
                    <div class="company-divider"></div>
                    <div class="pass-number">${pass.passNumber || "---"}</div>
                    ${pass.qrCode ? `<div class="qr-section"><img src="${pass.qrCode}" width="180" height="180" alt="QR Code" /></div>` : ""}
                    <div class="detail-grid">
                        <div class="detail-item">
                            <div class="detail-label">Vehicle Reg. No.</div>
                            <div class="detail-value" style="font-family:monospace;">${pass.vehicleRegNumber || "---"}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Vehicle Type</div>
                            <div class="detail-value">${(pass.vehicleType || "---").replace(/_/g, " ")}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Driver Name</div>
                            <div class="detail-value">${pass.driverName || "---"}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Driver Mobile</div>
                            <div class="detail-value">${pass.driverMobile || "---"}</div>
                        </div>
                        <div class="detail-item detail-full">
                            <div class="detail-label">Purpose</div>
                            <div class="detail-value">${pass.purpose || "---"}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Entry Time</div>
                            <div class="detail-value">${pass.entryTime ? fmt.dateTime(pass.entryTime) : pass.createdAt ? fmt.dateTime(pass.createdAt) : "---"}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Exit Time</div>
                            <div class="detail-value">${pass.exitTime ? fmt.dateTime(pass.exitTime) : "---"}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Entry Gate</div>
                            <div class="detail-value">${pass.entryGate?.name || "---"}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Status</div>
                            <div class="detail-value"><span class="status-badge ${pass.exitTime ? "status-exited" : "status-onsite"}">${pass.exitTime ? "Exited" : "On-Site"}</span></div>
                        </div>
                    </div>
                    ${pass.materialDescription ? `<div class="detail-grid"><div class="detail-item detail-full"><div class="detail-label">Material Description</div><div class="detail-value">${pass.materialDescription}</div></div></div>` : ""}
                    <div class="instructions">Keep this pass visible on the vehicle dashboard at all times.</div>
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
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Vehicle Gate Passes</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Track vehicle entry and exit</p>
                </div>
                {canCreate && (
                    <button onClick={() => { setForm({ ...EMPTY_FORM }); setModalOpen(true); }} className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none">
                        <Plus className="w-5 h-5" /> New Vehicle Pass
                    </button>
                )}
            </div>

            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input type="text" placeholder="Search by vehicle number or driver..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                </div>
            </div>

            {isError && <div className="bg-danger-50 border border-danger-200 rounded-xl p-4 text-sm text-danger-700 font-medium">Failed to load vehicle passes.</div>}

            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? <SkeletonTable rows={5} cols={7} /> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Vehicle</th>
                                    <th className="py-4 px-6 font-bold">Pass No.</th>
                                    <th className="py-4 px-6 font-bold">Type</th>
                                    <th className="py-4 px-6 font-bold">Driver</th>
                                    <th className="py-4 px-6 font-bold">Purpose</th>
                                    <th className="py-4 px-6 font-bold">Entry Time</th>
                                    <th className="py-4 px-6 font-bold">Exit Time</th>
                                    <th className="py-4 px-6 font-bold text-center">Status</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.map((p: any) => (
                                    <tr key={p.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-info-50 dark:bg-info-900/30 flex items-center justify-center shrink-0"><Car className="w-4 h-4 text-info-600" /></div>
                                                <span className="font-bold font-mono text-primary-950 dark:text-white">{p.vehicleRegNumber}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            {p.passNumber ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary-50 dark:bg-primary-900/30 text-[11px] font-bold font-mono text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800">{p.passNumber}</span>
                                            ) : <span className="text-neutral-400 text-xs">---</span>}
                                        </td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs capitalize">{p.vehicleType || "---"}</td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">{p.driverName || "---"}</td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">{p.purpose || "---"}</td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">{p.entryTime ? fmt.dateTime(p.entryTime) : p.createdAt ? fmt.dateTime(p.createdAt) : "---"}</td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">{p.exitTime ? fmt.dateTime(p.exitTime) : "---"}</td>
                                        <td className="py-4 px-6 text-center">
                                            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", p.exitTime ? "bg-neutral-100 text-neutral-600 border-neutral-200" : "bg-success-50 text-success-700 border-success-200")}>{p.exitTime ? "Exited" : "On-Site"}</span>
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
                                                {!p.exitTime && canCreate && (
                                                    <button onClick={() => setExitTarget(p)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-neutral-100 text-neutral-700 border border-neutral-200 hover:bg-neutral-200 transition-colors">
                                                        <LogOut size={12} /> Exit
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && !isLoading && (
                                    <tr><td colSpan={9}><EmptyState icon="list" title="No vehicle passes" message="Create a vehicle pass when a vehicle enters the premises." /></td></tr>
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
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">New Vehicle Pass</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Vehicle Registration *</label><input type="text" value={form.vehicleRegNumber} onChange={(e) => updateField("vehicleRegNumber", e.target.value.toUpperCase())} placeholder="KA-01-AB-1234" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" /></div>
                                <div><label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Vehicle Type *</label>
                                    <select value={form.vehicleType} onChange={(e) => updateField("vehicleType", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm dark:text-white">
                                        {VEHICLE_TYPES.map((vt) => <option key={vt} value={vt}>{vt.replace(/_/g, " ")}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Driver Name *</label><input type="text" value={form.driverName} onChange={(e) => updateField("driverName", e.target.value)} placeholder="Driver full name" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm dark:text-white placeholder:text-neutral-400 transition-all" /></div>
                                <div><label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Driver Mobile</label><input type="text" value={form.driverMobile} onChange={(e) => updateField("driverMobile", e.target.value)} placeholder="Phone number" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm dark:text-white placeholder:text-neutral-400 transition-all" /></div>
                            </div>
                            <div><label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Purpose *</label><input type="text" value={form.purpose} onChange={(e) => updateField("purpose", e.target.value)} placeholder="Delivery, pickup, etc." className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm dark:text-white placeholder:text-neutral-400 transition-all" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <SearchableSelect
                                        label="Location (Plant)"
                                        value={form.plantId}
                                        onChange={(v) => { updateField("plantId", v); updateField("entryGateId", ""); }}
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
                                        label="Entry Gate"
                                        value={form.entryGateId}
                                        onChange={(v) => updateField("entryGateId", v)}
                                        options={filteredGates.map((g: any) => ({
                                            value: g.id,
                                            label: `${g.name} (${g.code})`,
                                        }))}
                                        placeholder="Select gate..."
                                        required
                                    />
                                </div>
                            </div>
                            <div><label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Material Description</label><textarea value={form.materialDescription} onChange={(e) => updateField("materialDescription", e.target.value)} rows={2} placeholder="Description of materials carried" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm dark:text-white placeholder:text-neutral-400 transition-all resize-none" /></div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 transition-colors">Cancel</button>
                            <button onClick={handleSave} disabled={createMutation.isPending || !form.vehicleRegNumber || !form.driverName || !form.purpose || !form.entryGateId || !form.plantId} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {createMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                {createMutation.isPending ? "Creating..." : "Create Pass"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Exit Gate Modal */}
            {exitTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold text-primary-950 dark:text-white mb-2">Record Vehicle Exit</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Enter exit gate for vehicle <strong>{exitTarget.vehicleRegNumber}</strong>.</p>
                        <SearchableSelect
                            label="Exit Gate"
                            value={exitGateId}
                            onChange={(v) => setExitGateId(v)}
                            options={gates.map((g: any) => ({
                                value: g.id,
                                label: `${g.name} (${g.code})`,
                            }))}
                            placeholder="Select gate..."
                            required
                        />
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => { setExitTarget(null); setExitGateId(""); }} className="flex-1 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleExit} disabled={exitMutation.isPending || !exitGateId.trim()} className="flex-1 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50">{exitMutation.isPending ? "Recording..." : "Record Exit"}</button>
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
                            <p className="mt-1 text-sm font-bold text-neutral-700 dark:text-neutral-300">{qrTarget.vehicleRegNumber}</p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">{qrTarget.driverName}</p>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button
                                onClick={() => {
                                    const link = document.createElement("a");
                                    link.href = qrTarget.qrCode;
                                    link.download = `vehicle-pass-${qrTarget.passNumber}.png`;
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
                                <div className="w-9 h-9 rounded-xl bg-info-50 dark:bg-info-900/30 flex items-center justify-center"><Car className="w-5 h-5 text-info-600" /></div>
                                <div>
                                    <h2 className="text-lg font-bold text-primary-950 dark:text-white">Vehicle Pass Details</h2>
                                    {viewTarget.passNumber && <p className="text-xs font-mono font-bold text-primary-600">{viewTarget.passNumber}</p>}
                                </div>
                            </div>
                            <button onClick={() => setViewTarget(null)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Vehicle Reg. No.</p>
                                    <p className="text-sm font-bold font-mono text-primary-950 dark:text-white">{viewTarget.vehicleRegNumber || "---"}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Vehicle Type</p>
                                    <p className="text-sm text-neutral-700 dark:text-neutral-300 capitalize">{viewTarget.vehicleType?.replace(/_/g, " ") || "---"}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Driver Name</p>
                                    <p className="text-sm text-neutral-700 dark:text-neutral-300">{viewTarget.driverName || "---"}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Driver Mobile</p>
                                    <p className="text-sm text-neutral-700 dark:text-neutral-300">{viewTarget.driverMobile || "---"}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Purpose</p>
                                <p className="text-sm text-neutral-700 dark:text-neutral-300">{viewTarget.purpose || "---"}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Entry Time</p>
                                    <p className="text-sm text-neutral-700 dark:text-neutral-300">{viewTarget.entryTime ? fmt.dateTime(viewTarget.entryTime) : viewTarget.createdAt ? fmt.dateTime(viewTarget.createdAt) : "---"}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Exit Time</p>
                                    <p className="text-sm text-neutral-700 dark:text-neutral-300">{viewTarget.exitTime ? fmt.dateTime(viewTarget.exitTime) : "---"}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Status</p>
                                <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full border", viewTarget.exitTime ? "bg-neutral-100 text-neutral-600 border-neutral-200" : "bg-success-50 text-success-700 border-success-200")}>{viewTarget.exitTime ? "Exited" : "On-Site"}</span>
                            </div>
                            {viewTarget.materialDescription && (
                                <div>
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Material Description</p>
                                    <p className="text-sm text-neutral-700 dark:text-neutral-300">{viewTarget.materialDescription}</p>
                                </div>
                            )}
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
