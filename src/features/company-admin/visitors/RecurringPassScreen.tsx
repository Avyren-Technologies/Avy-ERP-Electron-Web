import { useState } from "react";
import {
    Repeat,
    Plus,
    Edit3,
    Loader2,
    X,
    Search,
    Ban,
    LogIn,
    QrCode,
    Printer,
    Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRecurringPasses, useGates } from "@/features/company-admin/api/use-visitor-queries";
import { useCreateRecurringPass, useUpdateRecurringPass, useRevokeRecurringPass, useCheckInRecurringPass } from "@/features/company-admin/api/use-visitor-mutations";
import { useCanPerform } from "@/hooks/useCanPerform";
import { useCompanyFormatter } from "@/hooks/useCompanyFormatter";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { useEmployees } from "@/features/company-admin/api/use-hr-queries";
import { useCompanyLocations } from "@/features/company-admin/api/use-company-admin-queries";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const PASS_TYPES = ["WEEKLY", "MONTHLY", "QUARTERLY", "ANNUAL"] as const;

const EMPTY_FORM = {
    visitorName: "",
    visitorMobile: "",
    visitorCompany: "",
    visitorEmail: "",
    visitorIdType: "",
    visitorIdNumber: "",
    hostEmployeeId: "",
    purpose: "",
    passType: "MONTHLY" as string,
    validFrom: "",
    validUntil: "",
    allowedDays: [1, 2, 3, 4, 5] as number[],
    allowedTimeFrom: "",
    allowedTimeTo: "",
    plantId: "",
};

export function RecurringPassScreen() {
    const fmt = useCompanyFormatter();
    const canCreate = useCanPerform("visitors:create");
    const { data, isLoading, isError } = useRecurringPasses();
    const createMutation = useCreateRecurringPass();
    const updateMutation = useUpdateRecurringPass();
    const revokeMutation = useRevokeRecurringPass();
    const checkInMutation = useCheckInRecurringPass();

    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [revokeTarget, setRevokeTarget] = useState<any>(null);
    const [revokeReason, setRevokeReason] = useState("");
    const [checkInTarget, setCheckInTarget] = useState<any>(null);
    const [checkInGateId, setCheckInGateId] = useState("");
    const [qrTarget, setQrTarget] = useState<any>(null);

    const employeesQuery = useEmployees({ limit: 500 });
    const employees: any[] = employeesQuery.data?.data ?? [];
    const locationsQuery = useCompanyLocations();
    const locations: any[] = (locationsQuery.data as any)?.data ?? [];
    const gatesQuery = useGates();
    const gates: any[] = gatesQuery.data?.data ?? [];

    const passes: any[] = data?.data ?? [];

    const filtered = passes.filter((p: any) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return p.visitorName?.toLowerCase().includes(s) || p.visitorCompany?.toLowerCase().includes(s) || p.passNumber?.toLowerCase().includes(s);
    });

    const openCreate = () => { setEditingId(null); setForm({ ...EMPTY_FORM }); setModalOpen(true); };
    const openEdit = (p: any) => {
        setEditingId(p.id);
        setForm({
            visitorName: p.visitorName ?? "",
            visitorMobile: p.visitorMobile ?? "",
            visitorCompany: p.visitorCompany ?? "",
            visitorEmail: p.visitorEmail ?? "",
            visitorIdType: p.visitorIdType ?? "",
            visitorIdNumber: p.visitorIdNumber ?? "",
            hostEmployeeId: p.hostEmployeeId ?? "",
            purpose: p.purpose ?? "",
            passType: p.passType ?? "MONTHLY",
            validFrom: p.validFrom ? p.validFrom.split("T")[0] : "",
            validUntil: p.validUntil ? p.validUntil.split("T")[0] : "",
            allowedDays: Array.isArray(p.allowedDays) ? p.allowedDays : [1, 2, 3, 4, 5],
            allowedTimeFrom: p.allowedTimeFrom ?? "",
            allowedTimeTo: p.allowedTimeTo ?? "",
            plantId: p.plantId ?? "",
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        try {
            const payload: Record<string, unknown> = {
                visitorName: form.visitorName,
                visitorMobile: form.visitorMobile,
                visitorCompany: form.visitorCompany,
                visitorEmail: form.visitorEmail || undefined,
                visitorIdType: form.visitorIdType || undefined,
                visitorIdNumber: form.visitorIdNumber || undefined,
                hostEmployeeId: form.hostEmployeeId,
                purpose: form.purpose,
                passType: form.passType,
                validFrom: form.validFrom,
                validUntil: form.validUntil,
                allowedDays: form.allowedDays,
                allowedTimeFrom: form.allowedTimeFrom || undefined,
                allowedTimeTo: form.allowedTimeTo || undefined,
                plantId: form.plantId,
            };
            if (editingId) {
                await updateMutation.mutateAsync({ id: editingId, data: payload });
                showSuccess("Pass Updated", `Pass for ${form.visitorName} has been updated.`);
            } else {
                await createMutation.mutateAsync(payload);
                showSuccess("Pass Created", `Recurring pass for ${form.visitorName} has been created.`);
            }
            setModalOpen(false);
        } catch (err) { showApiError(err); }
    };

    const handleRevoke = async () => {
        if (!revokeTarget || !revokeReason.trim()) return;
        try {
            await revokeMutation.mutateAsync({ id: revokeTarget.id, data: { reason: revokeReason.trim() } });
            showSuccess("Pass Revoked", `Pass for ${revokeTarget.visitorName} has been revoked.`);
            setRevokeTarget(null);
            setRevokeReason("");
        } catch (err) { showApiError(err); }
    };

    const handleCheckIn = async () => {
        if (!checkInTarget || !checkInGateId.trim()) return;
        try {
            await checkInMutation.mutateAsync({ id: checkInTarget.id, data: { gateId: checkInGateId.trim() } });
            showSuccess("Checked In", "Visitor checked in via recurring pass.");
            setCheckInTarget(null);
            setCheckInGateId("");
        } catch (err) { showApiError(err); }
    };

    const saving = createMutation.isPending || updateMutation.isPending;
    const updateField = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Recurring Passes</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Manage recurring visitor passes for regular visitors</p>
                </div>
                {canCreate && (
                    <button onClick={openCreate} className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none">
                        <Plus className="w-5 h-5" /> New Pass
                    </button>
                )}
            </div>

            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                    <input type="text" placeholder="Search passes..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                </div>
            </div>

            {isError && <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">Failed to load passes.</div>}

            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? <SkeletonTable rows={5} cols={8} /> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Pass #</th>
                                    <th className="py-4 px-6 font-bold">Visitor</th>
                                    <th className="py-4 px-6 font-bold">Company</th>
                                    <th className="py-4 px-6 font-bold">Type</th>
                                    <th className="py-4 px-6 font-bold">Valid From</th>
                                    <th className="py-4 px-6 font-bold">Valid Until</th>
                                    <th className="py-4 px-6 font-bold text-center">Status</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.map((p: any) => (
                                    <tr key={p.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-accent-50 dark:bg-accent-900/30 flex items-center justify-center shrink-0">
                                                    <Repeat className="w-4 h-4 text-accent-600 dark:text-accent-400" />
                                                </div>
                                                <span className="font-mono text-xs font-bold text-primary-950 dark:text-white">{p.passNumber || p.id?.slice(0, 8)}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 font-bold text-primary-950 dark:text-white">{p.visitorName}</td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">{p.visitorCompany || "---"}</td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">{p.passType || "---"}</td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">{p.validFrom ? fmt.date(p.validFrom) : "---"}</td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">{p.validUntil ? fmt.date(p.validUntil) : "---"}</td>
                                        <td className="py-4 px-6 text-center">
                                            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", p.status === "ACTIVE" ? "bg-success-50 text-success-700 border-success-200" : p.status === "REVOKED" ? "bg-danger-50 text-danger-700 border-danger-200" : "bg-neutral-100 text-neutral-600 border-neutral-200")}>
                                                {p.status || "Active"}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {p.qrCode && (
                                                    <button onClick={() => setQrTarget(p)} className="p-2 text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-900/30 rounded-lg transition-colors" title="View QR Code"><QrCode size={15} /></button>
                                                )}
                                                {p.status === "ACTIVE" && canCreate && (
                                                    <button onClick={() => setCheckInTarget(p)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-success-50 text-success-700 border border-success-200 hover:bg-success-100 transition-colors">
                                                        <LogIn size={12} /> In
                                                    </button>
                                                )}
                                                <button onClick={() => openEdit(p)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"><Edit3 size={15} /></button>
                                                {p.status !== "REVOKED" && (
                                                    <button onClick={() => setRevokeTarget(p)} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors"><Ban size={15} /></button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && !isLoading && (
                                    <tr><td colSpan={8}><EmptyState icon="list" title="No recurring passes" message="Create a recurring pass for regular visitors." action={canCreate ? { label: "New Pass", onClick: openCreate } : undefined} /></td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{editingId ? "Edit Pass" : "New Recurring Pass"}</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Visitor Name *</label><input type="text" value={form.visitorName} onChange={(e) => updateField("visitorName", e.target.value)} placeholder="Full name" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" /></div>
                                <div><label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Mobile *</label><input type="text" value={form.visitorMobile} onChange={(e) => updateField("visitorMobile", e.target.value)} placeholder="Phone number" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Company *</label><input type="text" value={form.visitorCompany} onChange={(e) => updateField("visitorCompany", e.target.value)} placeholder="Visitor's company" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" /></div>
                                <div><label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Email</label><input type="email" value={form.visitorEmail} onChange={(e) => updateField("visitorEmail", e.target.value)} placeholder="Email address" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <SearchableSelect
                                        label="Host Employee"
                                        value={form.hostEmployeeId}
                                        onChange={(v) => updateField("hostEmployeeId", v)}
                                        options={employees.map((e: any) => ({
                                            value: e.id,
                                            label: `${e.firstName} ${e.lastName}`,
                                            sublabel: e.designation?.name ?? e.department?.name ?? e.employeeCode ?? "",
                                        }))}
                                        placeholder="Search employee..."
                                        required
                                    />
                                </div>
                                <div>
                                    <SearchableSelect
                                        label="Location (Plant)"
                                        value={form.plantId}
                                        onChange={(v) => updateField("plantId", v)}
                                        options={locations.map((l: any) => ({
                                            value: l.id,
                                            label: l.name,
                                            sublabel: l.city ? `${l.city}, ${l.state ?? ""}` : undefined,
                                        }))}
                                        placeholder="Select location..."
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Pass Type *</label>
                                <select value={form.passType} onChange={(e) => updateField("passType", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                    {PASS_TYPES.map((pt) => <option key={pt} value={pt}>{pt}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Valid From *</label><input type="date" value={form.validFrom} onChange={(e) => updateField("validFrom", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" /></div>
                                <div><label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Valid Until *</label><input type="date" value={form.validUntil} onChange={(e) => updateField("validUntil", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" /></div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Allowed Days</label>
                                <div className="flex flex-wrap gap-2">
                                    {DAY_LABELS.map((label, idx) => {
                                        const selected = form.allowedDays.includes(idx);
                                        return (
                                            <button key={idx} type="button" onClick={() => setForm((prev) => ({ ...prev, allowedDays: selected ? prev.allowedDays.filter((d) => d !== idx) : [...prev.allowedDays, idx] }))} className={cn("px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors", selected ? "bg-primary-600 text-white border-primary-600" : "bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700")}>
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div><label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Purpose *</label><input type="text" value={form.purpose} onChange={(e) => updateField("purpose", e.target.value)} placeholder="Purpose of recurring visits" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" /></div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleSave} disabled={saving || !form.visitorName || !form.visitorMobile || !form.visitorCompany || !form.hostEmployeeId || !form.purpose || !form.validFrom || !form.validUntil || !form.plantId} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {saving && <Loader2 size={14} className="animate-spin" />}
                                {saving ? "Saving..." : editingId ? "Update" : "Create"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Revoke Confirmation */}
            {revokeTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">Revoke Pass?</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Revoke the recurring pass for <strong>{revokeTarget.visitorName}</strong>? They will no longer be able to check in with this pass.</p>
                        <div>
                            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Reason *</label>
                            <input type="text" value={revokeReason} onChange={(e) => setRevokeReason(e.target.value)} placeholder="Reason for revoking" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => { setRevokeTarget(null); setRevokeReason(""); }} className="flex-1 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleRevoke} disabled={revokeMutation.isPending || !revokeReason.trim()} className="flex-1 py-3 rounded-xl bg-danger-600 hover:bg-danger-700 text-white text-sm font-bold transition-colors disabled:opacity-50">{revokeMutation.isPending ? "Revoking..." : "Revoke"}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Check-In Gate Modal */}
            {checkInTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold text-primary-950 dark:text-white mb-2">Check In via Pass</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Check in <strong>{checkInTarget.visitorName}</strong> at which gate?</p>
                        <SearchableSelect
                            label="Gate"
                            value={checkInGateId}
                            onChange={(v) => setCheckInGateId(v)}
                            options={gates.map((g: any) => ({
                                value: g.id,
                                label: `${g.name} (${g.code})`,
                            }))}
                            placeholder="Select gate..."
                            required
                        />
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => { setCheckInTarget(null); setCheckInGateId(""); }} className="flex-1 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleCheckIn} disabled={checkInMutation.isPending || !checkInGateId.trim()} className="flex-1 py-3 rounded-xl bg-success-600 hover:bg-success-700 text-white text-sm font-bold transition-colors disabled:opacity-50">{checkInMutation.isPending ? "Checking In..." : "Check In"}</button>
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
                            <p className="mt-1 text-sm font-bold text-neutral-700 dark:text-neutral-300">{qrTarget.visitorName}</p>
                            {qrTarget.visitorCompany && <p className="text-xs text-neutral-500 dark:text-neutral-400">{qrTarget.visitorCompany}</p>}
                            <div className="flex items-center gap-2 mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                                <span>{qrTarget.validFrom ? fmt.date(qrTarget.validFrom) : "---"}</span>
                                <span>to</span>
                                <span>{qrTarget.validUntil ? fmt.date(qrTarget.validUntil) : "---"}</span>
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button
                                onClick={() => {
                                    const link = document.createElement("a");
                                    link.href = qrTarget.qrCode;
                                    link.download = `pass-${qrTarget.passNumber}.png`;
                                    link.click();
                                }}
                                className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
                            >
                                <Share2 size={14} /> Share
                            </button>
                            <button
                                onClick={() => {
                                    const printWindow = window.open("", "_blank");
                                    if (printWindow) {
                                        printWindow.document.write(`<html><head><title>Pass ${qrTarget.passNumber}</title><style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui,sans-serif;margin:0;}</style></head><body><img src="${qrTarget.qrCode}" width="300" height="300" /><h2>${qrTarget.passNumber}</h2><p>${qrTarget.visitorName}</p>${qrTarget.visitorCompany ? `<p>${qrTarget.visitorCompany}</p>` : ""}</body></html>`);
                                        printWindow.document.close();
                                        printWindow.print();
                                    }
                                }}
                                className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
                            >
                                <Printer size={14} /> Print
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
