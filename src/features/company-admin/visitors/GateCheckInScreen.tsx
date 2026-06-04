import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    QrCode,
    Search,
    LogIn,
    LogOut,
    Loader2,
    Users,
    UserCheck,
    Clock,
    Hash,
    User,
    Phone,
    Building2,
    X,
    Camera,
    XCircle,
    BadgeCheck,
    Truck,
    Package,
    AlertTriangle,
    UserPlus,
    UsersRound,
    LogIn as LogInIcon,
    History,
    HardHat,
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import QRCodeReact from "react-qr-code";
import {
    useDashboardOnSite, useVisitByCode, useVmsConfig, useGates,
    useGateOpsStats, useGateOpsExpectedMaterials, useGateOpsExpectedVisitors, useGateOpsExpectedVehicles, useGateOpsRecentActivity,
} from "@/features/company-admin/api/use-visitor-queries";
import {
    useCheckInVisit, useCheckInRecurringPass, useCheckOutVisit, useCreateVisit, useCheckWatchlist,
    useRecordMaterialEntry, useReturnMaterialPass, useRecordVehicleEntry, useRecordVehicleExit,
    useCreateVehiclePass, useCreateMaterialPass,
} from "@/features/company-admin/api/use-visitor-mutations";
import { visitorsApi } from "@/lib/api/visitors";
import { useCompanyFormatter } from "@/hooks/useCompanyFormatter";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { useEmployees } from "@/features/company-admin/api/use-hr-queries";
import { useCompanyLocations } from "@/features/company-admin/api/use-company-admin-queries";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { showSuccess, showApiError, showWarning, showError } from "@/lib/toast";
import { VisitStatusBadge } from "@/features/company-admin/visitors/components/VisitStatusBadge";

/* ── Dashboard helper components ── */

function QuickActionChip({ icon, bg, label, onClick }: { icon: React.ReactNode; bg: string; label: string; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border border-neutral-200/60 dark:border-neutral-700/60 bg-white dark:bg-neutral-900 hover:shadow-md transition-all"
        >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg}`}>{icon}</div>
            <span className="text-[11px] font-bold text-primary-950 dark:text-white text-center leading-tight">{label}</span>
        </button>
    );
}

const TILE_TINTS: Record<string, { bg: string; fg: string; iconBg: string }> = {
    success: { bg: "bg-success-50 dark:bg-success-900/15", fg: "text-success-700 dark:text-success-300", iconBg: "bg-success-100/70 dark:bg-success-900/30 text-success-600" },
    primary: { bg: "bg-primary-50 dark:bg-primary-900/15", fg: "text-primary-700 dark:text-primary-300", iconBg: "bg-primary-100/70 dark:bg-primary-900/30 text-primary-600" },
    warning: { bg: "bg-warning-50 dark:bg-warning-900/15", fg: "text-warning-700 dark:text-warning-300", iconBg: "bg-warning-100/70 dark:bg-warning-900/30 text-warning-600" },
    accent:  { bg: "bg-accent-50 dark:bg-accent-900/15",   fg: "text-accent-700 dark:text-accent-300",   iconBg: "bg-accent-100/70 dark:bg-accent-900/30 text-accent-600"   },
    info:    { bg: "bg-info-50 dark:bg-info-900/15",       fg: "text-info-700 dark:text-info-300",       iconBg: "bg-info-100/70 dark:bg-info-900/30 text-info-600"         },
};

function StatTile({ value, label, icon, tint, onClick }: { value: number | string; label: string; icon: React.ReactNode; tint: keyof typeof TILE_TINTS; onClick?: () => void }) {
    const t = TILE_TINTS[tint] ?? TILE_TINTS.primary!;
    return (
        <button onClick={onClick} className={`text-left p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-700/60 ${t.bg} hover:shadow-md transition-all`}>
            <div className="flex items-center justify-between">
                <div className={`w-9 h-9 rounded-lg ${t.iconBg} flex items-center justify-center`}>{icon}</div>
            </div>
            <p className={`text-3xl font-bold mt-2 ${t.fg}`}>{value}</p>
            <p className={`text-[11px] font-bold uppercase tracking-widest mt-0.5 ${t.fg}`}>{label}</p>
        </button>
    );
}

type ScanCaptureKind = "material-entry" | "material-return" | "vehicle-entry" | "vehicle-exit";

function ScanCaptureModal({
    mode,
    onSubmit,
    onCancel,
    isSaving,
}: {
    mode: { kind: ScanCaptureKind; pass: any } | null;
    onSubmit: (payload: Record<string, unknown>) => void;
    onCancel: () => void;
    isSaving: boolean;
}) {
    const [qty, setQty] = useState("");
    const [notes, setNotes] = useState("");
    const [odometer, setOdometer] = useState("");
    const [returnStatus, setReturnStatus] = useState<"PARTIAL" | "FULLY_RETURNED">("FULLY_RETURNED");

    useEffect(() => {
        if (!mode) return;
        setNotes("");
        setOdometer("");
        if (mode.kind === "material-entry") {
            setQty(mode.pass?.quantityValue != null ? String(mode.pass.quantityValue) : "");
        } else if (mode.kind === "material-return") {
            const issued = mode.pass?.quantityValue != null ? String(mode.pass.quantityValue) : (mode.pass?.quantityIssued ?? "");
            setQty(issued);
            setReturnStatus("FULLY_RETURNED");
        } else {
            setQty("");
        }
    }, [mode]);

    if (!mode) return null;
    const { kind, pass } = mode;
    const isMaterial = kind === "material-entry" || kind === "material-return";
    const isReturn = kind === "material-return";
    const isVehicle = kind === "vehicle-entry" || kind === "vehicle-exit";
    const isVehicleExit = kind === "vehicle-exit";
    const title = kind === "material-entry"
        ? (pass?.type === "OUTWARD" || pass?.type === "RETURNABLE" ? "Record Material Exit" : "Record Material Entry")
        : kind === "material-return" ? "Record Material Return"
        : kind === "vehicle-entry" ? "Record Vehicle Entry"
        : "Record Vehicle Exit";

    const handleSubmit = () => {
        const payload: Record<string, unknown> = {};
        if (notes.trim()) payload.notes = notes.trim();
        if (isMaterial && qty.trim()) {
            const n = Number(qty);
            if (!Number.isNaN(n) && n > 0) {
                if (isReturn) {
                    payload.quantityReturned = qty.trim();
                    payload.quantityReturnedValue = n;
                    payload.returnStatus = returnStatus;
                } else {
                    payload.quantityValue = n;
                }
            } else if (isReturn) {
                payload.quantityReturned = qty.trim();
                payload.returnStatus = returnStatus;
            }
        }
        if (isVehicle && odometer.trim()) payload.odometer = odometer.trim();
        onSubmit(payload);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                    <h2 className="text-lg font-bold text-primary-950 dark:text-white">{title}</h2>
                    <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                        {isMaterial ? (
                            <>
                                <p className="text-sm font-bold text-primary-950 dark:text-white">{pass?.description}</p>
                                <p className="text-xs text-neutral-500 mt-0.5">{pass?.type}{pass?.vendorName ? ` · ${pass.vendorName}` : ""}</p>
                                <p className="text-[11px] font-mono text-neutral-400 mt-0.5">{pass?.passNumber}</p>
                            </>
                        ) : (
                            <>
                                <p className="text-sm font-bold text-primary-950 dark:text-white">{pass?.vehicleRegNumber}</p>
                                <p className="text-xs text-neutral-500 mt-0.5">{pass?.vehicleType} · Driver: {pass?.driverName}</p>
                                <p className="text-[11px] font-mono text-neutral-400 mt-0.5">{pass?.passNumber}</p>
                            </>
                        )}
                    </div>

                    {isMaterial && (
                        <div>
                            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
                                {isReturn ? "Quantity Returned" : "Quantity at Gate"}{pass?.unitOfMeasure?.abbreviation ? ` (${pass.unitOfMeasure.abbreviation})` : ""}
                            </label>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={qty}
                                onChange={(e) => setQty(e.target.value)}
                                placeholder="e.g. 1500"
                                className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white"
                            />
                        </div>
                    )}

                    {isReturn && (
                        <div>
                            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Return Status</label>
                            <div className="grid grid-cols-2 gap-2">
                                {(["FULLY_RETURNED", "PARTIAL"] as const).map((opt) => (
                                    <button
                                        key={opt}
                                        type="button"
                                        onClick={() => setReturnStatus(opt)}
                                        className={`py-2 rounded-lg text-xs font-bold border transition-colors ${returnStatus === opt ? "bg-primary-600 text-white border-primary-600" : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50"}`}
                                    >
                                        {opt === "FULLY_RETURNED" ? "Fully Returned" : "Partial"}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {isVehicle && (
                        <div>
                            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Odometer (optional)</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={odometer}
                                onChange={(e) => setOdometer(e.target.value)}
                                placeholder="km / miles"
                                className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Notes (optional)</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder={isVehicleExit ? "Exit observations…" : "Notes for this scan…"}
                            rows={3}
                            className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                        <button type="button" onClick={handleSubmit} disabled={isSaving} className={`flex-[2] py-2.5 rounded-xl text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${isVehicleExit ? "bg-warning-600 hover:bg-warning-700" : "bg-success-600 hover:bg-success-700"}`}>
                            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <BadgeCheck size={14} />}
                            Confirm
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

const WEB_VEHICLE_TYPES = ["CAR", "TWO_WHEELER", "AUTO", "TRUCK", "VAN", "TEMPO", "BUS"] as const;
const WEB_MATERIAL_TYPES = ["INWARD", "OUTWARD", "RETURNABLE"] as const;

function QuickCreateVehicleModal({
    open,
    onClose,
    onCreated,
    locations,
    gates,
}: {
    open: boolean;
    onClose: () => void;
    onCreated: (passId: string) => void;
    locations: any[];
    gates: any[];
}) {
    const createMutation = useCreateVehiclePass();
    const [reg, setReg] = useState("");
    const [vtype, setVtype] = useState<typeof WEB_VEHICLE_TYPES[number]>("CAR");
    const [driver, setDriver] = useState("");
    const [mobile, setMobile] = useState("");
    const [purpose, setPurpose] = useState("");
    const [plantId, setPlantId] = useState("");
    const [gateId, setGateId] = useState("");
    const [validDays, setValidDays] = useState("30");

    useEffect(() => {
        if (open) {
            setReg(""); setVtype("CAR"); setDriver(""); setMobile(""); setPurpose("");
            setPlantId(locations[0]?.id ?? ""); setGateId(""); setValidDays("30");
        }
    }, [open, locations]);

    if (!open) return null;
    const filteredGates = gates.filter((g) => !plantId || !g.plantId || g.plantId === plantId);
    const canSubmit = reg.trim() && driver.trim() && purpose.trim() && plantId && gateId;

    const handleSubmit = async () => {
        if (!canSubmit) return;
        const now = new Date();
        const validUntil = new Date(now.getTime() + Number(validDays || 30) * 86_400_000);
        try {
            const res = await createMutation.mutateAsync({
                vehicleRegNumber: reg.trim().toUpperCase(),
                vehicleType: vtype,
                driverName: driver.trim(),
                driverMobile: mobile.trim() || undefined,
                purpose: purpose.trim(),
                entryGateId: gateId,
                plantId,
                validFrom: now.toISOString(),
                validUntil: validUntil.toISOString(),
            });
            const id = (res as any)?.data?.id ?? (res as any)?.id;
            showSuccess("Vehicle Pass Created", `${reg.trim().toUpperCase()} ready at gate`);
            onClose();
            if (id) onCreated(id);
        } catch (err) { showApiError(err); }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                    <h2 className="text-lg font-bold text-primary-950 dark:text-white flex items-center gap-2"><Truck size={18} /> Quick Create Vehicle Pass</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto">
                    <WebField label="Vehicle Reg Number *"><input type="text" value={reg} onChange={(e) => setReg(e.target.value.toUpperCase())} className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white" placeholder="KA 03 AB 1234" /></WebField>
                    <WebField label="Vehicle Type">
                        <div className="flex flex-wrap gap-1.5">
                            {WEB_VEHICLE_TYPES.map((t) => (
                                <button key={t} onClick={() => setVtype(t)} type="button" className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors ${vtype === t ? "bg-primary-600 text-white border-primary-600" : "bg-white dark:bg-neutral-800 text-neutral-600 border-neutral-200 hover:bg-neutral-50"}`}>{t.replace("_", " ")}</button>
                            ))}
                        </div>
                    </WebField>
                    <WebField label="Driver Name *"><input type="text" value={driver} onChange={(e) => setDriver(e.target.value)} className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white" /></WebField>
                    <WebField label="Driver Mobile"><input type="text" value={mobile} onChange={(e) => setMobile(e.target.value)} className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white" /></WebField>
                    <WebField label="Purpose *"><textarea rows={2} value={purpose} onChange={(e) => setPurpose(e.target.value)} className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white" /></WebField>
                    <WebField label="Plant *">
                        <SearchableSelect value={plantId} onChange={(v) => { setPlantId(v); setGateId(""); }} options={locations.map((l: any) => ({ value: l.id, label: l.name }))} placeholder="Select plant…" />
                    </WebField>
                    <WebField label="Entry Gate *">
                        <SearchableSelect value={gateId} onChange={setGateId} options={filteredGates.map((g: any) => ({ value: g.id, label: g.name }))} placeholder="Select gate…" />
                    </WebField>
                    <WebField label="Valid for (days)"><input type="number" value={validDays} onChange={(e) => setValidDays(e.target.value)} className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white" min={1} /></WebField>
                </div>
                <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50">Cancel</button>
                    <button onClick={handleSubmit} disabled={!canSubmit || createMutation.isPending} className="flex-[2] py-2.5 rounded-xl bg-success-600 hover:bg-success-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                        {createMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <BadgeCheck size={14} />}
                        Create Pass
                    </button>
                </div>
            </div>
        </div>
    );
}

function QuickCreateMaterialModal({
    open,
    onClose,
    onCreated,
    locations,
    gates,
    employees,
}: {
    open: boolean;
    onClose: () => void;
    onCreated: (passId: string) => void;
    locations: any[];
    gates: any[];
    employees: any[];
}) {
    const createMutation = useCreateMaterialPass();
    const [type, setType] = useState<typeof WEB_MATERIAL_TYPES[number]>("INWARD");
    const [description, setDescription] = useState("");
    const [qty, setQty] = useState("");
    const [vendor, setVendor] = useState("");
    const [authorizedBy, setAuthorizedBy] = useState("");
    const [purpose, setPurpose] = useState("");
    const [plantId, setPlantId] = useState("");
    const [gateId, setGateId] = useState("");
    const [returnDate, setReturnDate] = useState("");

    useEffect(() => {
        if (open) {
            setType("INWARD"); setDescription(""); setQty(""); setVendor("");
            setAuthorizedBy(""); setPurpose("");
            setPlantId(locations[0]?.id ?? ""); setGateId(""); setReturnDate("");
        }
    }, [open, locations]);

    if (!open) return null;
    const filteredGates = gates.filter((g) => !plantId || !g.plantId || g.plantId === plantId);
    const canSubmit = description.trim() && authorizedBy && purpose.trim() && plantId && gateId && (type !== "RETURNABLE" || returnDate);

    const handleSubmit = async () => {
        if (!canSubmit) return;
        try {
            const res = await createMutation.mutateAsync({
                type,
                description: description.trim(),
                quantityValue: qty.trim() ? Number(qty) : undefined,
                quantityIssued: qty.trim() || undefined,
                vendorName: vendor.trim() || undefined,
                authorizedBy,
                purpose: purpose.trim(),
                gateId,
                plantId,
                ...(type === "RETURNABLE" ? { expectedReturnDate: returnDate } : {}),
            });
            const id = (res as any)?.data?.id ?? (res as any)?.id;
            showSuccess("Material Pass Created", description.trim());
            onClose();
            if (id) onCreated(id);
        } catch (err) { showApiError(err); }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                    <h2 className="text-lg font-bold text-primary-950 dark:text-white flex items-center gap-2"><Package size={18} /> Quick Create Material Pass</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto">
                    <WebField label="Type *">
                        <div className="grid grid-cols-3 gap-2">
                            {WEB_MATERIAL_TYPES.map((t) => (
                                <button key={t} onClick={() => setType(t)} type="button" className={`py-2 rounded-lg text-xs font-bold border ${type === t ? "bg-primary-600 text-white border-primary-600" : "bg-white dark:bg-neutral-800 text-neutral-600 border-neutral-200 hover:bg-neutral-50"}`}>{t}</button>
                            ))}
                        </div>
                    </WebField>
                    <WebField label="Description *"><textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white" /></WebField>
                    <WebField label="Quantity"><input type="text" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white" placeholder="e.g. 1500" /></WebField>
                    <WebField label="Vendor / Source"><input type="text" value={vendor} onChange={(e) => setVendor(e.target.value)} className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white" /></WebField>
                    <WebField label="Authorized By *">
                        <SearchableSelect value={authorizedBy} onChange={setAuthorizedBy} options={employees.map((e: any) => ({ value: e.id, label: `${e.firstName ?? ""} ${e.lastName ?? ""}`.trim() || e.id }))} placeholder="Select employee…" />
                    </WebField>
                    <WebField label="Purpose *"><textarea rows={2} value={purpose} onChange={(e) => setPurpose(e.target.value)} className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white" /></WebField>
                    <WebField label="Plant *">
                        <SearchableSelect value={plantId} onChange={(v) => { setPlantId(v); setGateId(""); }} options={locations.map((l: any) => ({ value: l.id, label: l.name }))} placeholder="Select plant…" />
                    </WebField>
                    <WebField label="Gate *">
                        <SearchableSelect value={gateId} onChange={setGateId} options={filteredGates.map((g: any) => ({ value: g.id, label: g.name }))} placeholder="Select gate…" />
                    </WebField>
                    {type === "RETURNABLE" && (
                        <WebField label="Expected Return Date *"><input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white" /></WebField>
                    )}
                </div>
                <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50">Cancel</button>
                    <button onClick={handleSubmit} disabled={!canSubmit || createMutation.isPending} className="flex-[2] py-2.5 rounded-xl bg-success-600 hover:bg-success-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                        {createMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <BadgeCheck size={14} />}
                        Create Pass
                    </button>
                </div>
            </div>
        </div>
    );
}

function WebField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5">{label}</label>
            {children}
        </div>
    );
}

/**
 * Refined card shell used by the three "Expected …" columns on Gate Ops.
 * Provides consistent header (icon + title + count badge + View All), divided
 * list area, empty state, and loading skeleton.
 */
function ExpectedCard({
    title,
    accent,
    icon,
    count,
    loading,
    viewAllHref,
    emptyText,
    children,
}: {
    title: string;
    accent: "success" | "primary" | "accent";
    icon: React.ReactNode;
    count: number;
    loading?: boolean;
    viewAllHref: string;
    emptyText: string;
    children?: React.ReactNode;
}) {
    const tint =
        accent === "success" ? { headerIcon: "text-success-600 dark:text-success-400", chip: "bg-success-50 text-success-700 dark:bg-success-900/20 dark:text-success-300" }
        : accent === "primary" ? { headerIcon: "text-primary-600 dark:text-primary-400", chip: "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300" }
        : { headerIcon: "text-accent-600 dark:text-accent-400", chip: "bg-accent-50 text-accent-700 dark:bg-accent-900/20 dark:text-accent-300" };

    return (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <h2 className="text-sm font-bold text-primary-950 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <span className={tint.headerIcon}>{icon}</span>
                    {title}
                    <span className={`ml-1 inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-md text-[10px] font-bold ${tint.chip}`}>{count}</span>
                </h2>
                <a href={viewAllHref} className="text-xs font-bold text-primary-600 hover:text-primary-700">View All ›</a>
            </div>
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800 flex-1">
                {loading ? (
                    <div className="px-6 py-3 space-y-3">
                        {[0, 1, 2].map((i) => (
                            <div key={i} className="flex items-center gap-3 animate-pulse">
                                <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800" />
                                <div className="flex-1 space-y-1.5">
                                    <div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded w-3/4" />
                                    <div className="h-2.5 bg-neutral-100 dark:bg-neutral-800 rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : count === 0 ? (
                    <div className="py-10 px-6 text-center text-sm text-neutral-400">{emptyText}</div>
                ) : (
                    children
                )}
            </div>
        </div>
    );
}

/* ── Screen ── */

export function GateCheckInScreen() {
    const fmt = useCompanyFormatter();
    const navigate = useNavigate();
    const checkInMutation = useCheckInVisit();
    const recurringPassCheckInMutation = useCheckInRecurringPass();
    const checkOutMutation = useCheckOutVisit();
    const createMutation = useCreateVisit();
    const checkWatchlist = useCheckWatchlist();
    const recordMaterialEntryMutation = useRecordMaterialEntry();
    const markMaterialReturnedMutation = useReturnMaterialPass();
    const recordVehicleEntryMutation = useRecordVehicleEntry();
    const recordVehicleExitMutation = useRecordVehicleExit();
    const createVehiclePassMutation = useCreateVehiclePass();
    const createMaterialPassMutation = useCreateMaterialPass();
    const [showQuickVehicle, setShowQuickVehicle] = useState(false);
    const [showQuickMaterial, setShowQuickMaterial] = useState(false);

    const [visitCode, setVisitCode] = useState("");
    const [searchCode, setSearchCode] = useState("");
    const [actionId, setActionId] = useState<string | null>(null);
    const [visitorPhoto, setVisitorPhoto] = useState<string | null>(null);
    const [showWalkIn, setShowWalkIn] = useState(false);
    const [walkInForm, setWalkInForm] = useState({
        visitorName: "",
        visitorMobile: "",
        visitorEmail: "",
        visitorCompany: "",
        purpose: "" as string,
        hostEmployeeId: "",
        visitorTypeId: "",
        plantId: "",
    });

    // Badge QR modal state after check-in
    const [checkedInBadge, setCheckedInBadge] = useState<{ visitorName: string; badgeNumber: string; visitCode: string } | null>(null);

    // Pre-check-in modal state
    const [pendingCheckIn, setPendingCheckIn] = useState<any>(null);
    const [passInfo, setPassInfo] = useState<{ type: string; data: any } | null>(null);
    const [preCheckIdType, setPreCheckIdType] = useState("");
    const [preCheckIdNumber, setPreCheckIdNumber] = useState("");
    const [preCheckGateId, setPreCheckGateId] = useState("");

    // QR Scanner state
    const [showQrScanner, setShowQrScanner] = useState(false);
    const qrScannerRef = useRef<Html5Qrcode | null>(null);
    const qrContainerId = "qr-reader-container";

    // Webcam photo state
    const [showPhotoCamera, setShowPhotoCamera] = useState(false);
    const photoVideoRef = useRef<HTMLVideoElement>(null);
    const photoCanvasRef = useRef<HTMLCanvasElement>(null);

    const employeesQuery = useEmployees({ limit: 500 });
    const employees: any[] = employeesQuery.data?.data ?? [];
    const locationsQuery = useCompanyLocations();
    const locations: any[] = (locationsQuery.data as any)?.data ?? [];

    const onSiteQuery = useDashboardOnSite();
    const codeQuery = useVisitByCode(searchCode);
    const configQuery = useVmsConfig();
    const gatesQuery = useGates();
    const gateOpsStatsQuery = useGateOpsStats();
    const expectedMaterialsQuery = useGateOpsExpectedMaterials({ limit: 5 });
    const expectedVisitorsQuery = useGateOpsExpectedVisitors({ limit: 5 });
    const expectedVehiclesQuery = useGateOpsExpectedVehicles({ limit: 5 });
    const recentActivityQuery = useGateOpsRecentActivity({ limit: 8 });
    const gateOpsStats = (gateOpsStatsQuery.data as any)?.data ?? {};
    const todayStats = gateOpsStats.today ?? {};
    const liveStats = gateOpsStats.live ?? {};
    const expectedMaterials: any[] = (expectedMaterialsQuery.data as any)?.data ?? [];
    const expectedVisitors: any[] = (expectedVisitorsQuery.data as any)?.data ?? [];
    const expectedVehicles: any[] = (expectedVehiclesQuery.data as any)?.data ?? [];
    const recentActivity: any[] = (recentActivityQuery.data as any)?.data ?? [];

    const vmsConfig = configQuery.data?.data;
    const gatesList: any[] = (gatesQuery.data?.data ?? []).filter((g: any) => g.isActive !== false);

    const onSiteVisitors: any[] = onSiteQuery.data?.data ?? [];
    const foundVisit = codeQuery.data?.data;

    // ── QR Scanner functions ──
    const startQrScanner = useCallback(async () => {
        setShowQrScanner(true);
        // Wait for DOM element to render
        setTimeout(async () => {
            try {
                const html5QrCode = new Html5Qrcode(qrContainerId);
                qrScannerRef.current = html5QrCode;
                await html5QrCode.start(
                    { facingMode: "environment" },
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    (decodedText) => {
                        // Extract visit code from URL or use raw text
                        let code = decodedText;
                        // If it's a URL like /visit/register/PLT-2 or contains a visit code
                        const urlMatch = decodedText.match(/\/visit\/(?:register\/)?([A-Z0-9-]+)/i);
                        if (urlMatch) code = urlMatch[1]!;
                        // Also handle raw visit codes
                        const codeMatch = decodedText.match(/^[A-Z0-9]{6}$/i);
                        if (codeMatch) code = codeMatch[0]!;

                        setVisitCode(code.toUpperCase());
                        stopQrScanner();
                        showSuccess("QR Scanned", `Code: ${code.toUpperCase()}`);
                        // Use unified lookup after setting code
                        visitorsApi.gateLookup(code.toUpperCase()).then((result) => {
                            const entityType = result?.data?.type;
                            const entity = result?.data?.data;
                            if (entityType === "visit") {
                                setSearchCode(code.toUpperCase());
                            } else if (entityType === "recurring_pass" || entityType === "vehicle_pass" || entityType === "material_pass") {
                                setPassInfo({ type: entityType, data: entity });
                            }
                        }).catch(() => showWarning("Not Found", "No visit or pass found for scanned code"));
                    },
                    () => { /* ignore scan failures */ },
                );
            } catch (err) {
                showError("Camera Error", "Could not access camera. Please check permissions.");
                setShowQrScanner(false);
            }
        }, 100);
    }, []);

    const stopQrScanner = useCallback(() => {
        if (qrScannerRef.current?.isScanning) {
            qrScannerRef.current.stop().catch(() => {});
            qrScannerRef.current.clear();
        }
        qrScannerRef.current = null;
        setShowQrScanner(false);
    }, []);

    // Cleanup scanner on unmount
    useEffect(() => {
        return () => {
            if (qrScannerRef.current?.isScanning) {
                qrScannerRef.current.stop().catch(() => {});
            }
        };
    }, []);

    // ── Webcam Photo functions ──
    const startPhotoCamera = useCallback(async () => {
        setShowPhotoCamera(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 320, height: 320 } });
            if (photoVideoRef.current) {
                photoVideoRef.current.srcObject = stream;
                photoVideoRef.current.play();
            }
        } catch {
            showError("Camera Error", "Could not access camera.");
            setShowPhotoCamera(false);
        }
    }, []);

    const capturePhoto = useCallback(() => {
        if (!photoVideoRef.current || !photoCanvasRef.current) return;
        const canvas = photoCanvasRef.current;
        canvas.width = 320;
        canvas.height = 320;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(photoVideoRef.current, 0, 0, 320, 320);
        setVisitorPhoto(canvas.toDataURL("image/jpeg", 0.7));
        stopPhotoCamera();
    }, []);

    const stopPhotoCamera = useCallback(() => {
        if (photoVideoRef.current?.srcObject) {
            (photoVideoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
            photoVideoRef.current.srcObject = null;
        }
        setShowPhotoCamera(false);
    }, []);

    const [lookupLoading, setLookupLoading] = useState(false);

    const handleLookupCode = async () => {
        if (!visitCode.trim()) return;
        setLookupLoading(true);
        setSearchCode(""); // Clear old visit-by-code query
        setPassInfo(null);
        try {
            const result = await visitorsApi.gateLookup(visitCode.trim());
            const entityType = result?.data?.type;
            const entity = result?.data?.data;
            if (!entity?.id) { showWarning("Not Found", "No visit or pass found for this code"); return; }

            if (entityType === "visit") {
                setSearchCode(visitCode.trim()); // trigger useVisitByCode for display
            } else if (entityType === "recurring_pass" || entityType === "vehicle_pass" || entityType === "material_pass") {
                setPassInfo({ type: entityType, data: entity });
            }
        } catch {
            showWarning("Not Found", "No visit or pass found for this code");
        } finally {
            setLookupLoading(false);
        }
    };

    // Requirement logic: mirrors backend logic
    const getRequirements = (visit: any) => {
        const vt = visit?.visitorType;
        const photoRequired = vmsConfig?.photoCapture === "ALWAYS" || (vmsConfig?.photoCapture === "PER_VISITOR_TYPE" && vt?.requirePhoto);
        const idRequired = vmsConfig?.idVerification === "ALWAYS" || (vmsConfig?.idVerification === "PER_VISITOR_TYPE" && vt?.requireIdVerification);
        const preArrivalRequired = vmsConfig?.preArrivalForm === "ALWAYS" || (vmsConfig?.preArrivalForm === "PER_VISITOR_TYPE" && vt?.requirePreArrivalForm);
        return { photoRequired: !!photoRequired, idRequired: !!idRequired, preArrivalRequired: !!preArrivalRequired };
    };

    // Open pre-check-in modal instead of directly checking in
    const openPreCheckIn = (visit: any) => {
        setPreCheckIdType("");
        setPreCheckIdNumber("");
        setPreCheckGateId(visit?.gateId ?? visit?.checkInGateId ?? "");
        setPendingCheckIn(visit);
    };

    const handleCheckIn = async (id: string) => {
        // Find the visit data and open pre-check-in modal
        const visit = expectedVisitors.find((v: any) => v.id === id) ?? foundVisit;
        if (visit) openPreCheckIn(visit);
    };

    const handlePreCheckInSubmit = async () => {
        if (!pendingCheckIn?.id) return;
        try {
            setActionId(pendingCheckIn.id);
            const checkInData: Record<string, unknown> = {};
            if (visitorPhoto) checkInData.visitorPhoto = visitorPhoto;
            if (preCheckIdType) checkInData.governmentIdType = preCheckIdType;
            if (preCheckIdNumber.trim()) checkInData.governmentIdNumber = preCheckIdNumber.trim();
            if (pendingCheckIn?.gateId) checkInData.checkInGateId = pendingCheckIn.gateId;

            const result = await checkInMutation.mutateAsync({
                id: pendingCheckIn.id,
                data: Object.keys(checkInData).length > 0 ? checkInData : undefined,
            });
            const badgeNo = result?.data?.badgeNumber;
            const warning = result?.data?.watchlistWarning;
            if (warning) showWarning("Watchlist Alert", warning);
            const checkInWarnings: string[] = result?.data?.warnings ?? [];
            if (checkInWarnings.length) {
                checkInWarnings.forEach((w: string) => showWarning("Requirement", w));
            }
            showSuccess("Checked In", badgeNo ? `Badge: ${badgeNo}` : "Visitor has been checked in successfully.");

            setCheckedInBadge({
                visitorName: pendingCheckIn?.visitorName ?? "Visitor",
                badgeNumber: badgeNo ?? "",
                visitCode: pendingCheckIn?.visitCode ?? "",
            });

            setPendingCheckIn(null);
            setSearchCode("");
            setVisitCode("");
            setVisitorPhoto(null);
        } catch (err) {
            showApiError(err);
        } finally {
            setActionId(null);
        }
    };

    const handleCheckOut = async (id: string) => {
        try {
            setActionId(id);
            await checkOutMutation.mutateAsync({ id, data: { checkOutMethod: "SECURITY_DESK" } });
            showSuccess("Checked Out", "Visitor has been checked out.");
        } catch (err) {
            showApiError(err);
        } finally {
            setActionId(null);
        }
    };

    const handleWalkIn = async () => {
        try {
            // Watchlist check (non-blocking on network error)
            if (walkInForm.visitorMobile) {
                try {
                    const watchlistResult = await checkWatchlist.mutateAsync({ mobile: walkInForm.visitorMobile });
                    const match = watchlistResult?.data;
                    if (match?.type === "BLOCKLIST" || match?.listType === "BLOCKLIST") {
                        showError("Blocked Visitor", `${walkInForm.visitorName} is on the blocklist: ${match.reason || "entry denied"}.`);
                        return;
                    }
                    if (match?.type === "WATCHLIST" || match?.listType === "WATCHLIST") {
                        showWarning("Watchlist Match", `${walkInForm.visitorName} is on the watchlist: ${match.reason || "proceed with caution"}.`);
                    }
                } catch {
                    // Network error — proceed with registration anyway
                }
            }

            const today = new Date().toISOString().slice(0, 10);
            await createMutation.mutateAsync({
                visitorName: walkInForm.visitorName,
                visitorMobile: walkInForm.visitorMobile || undefined,
                visitorEmail: walkInForm.visitorEmail || undefined,
                visitorCompany: walkInForm.visitorCompany || undefined,
                purpose: walkInForm.purpose || "OTHER",
                hostEmployeeId: walkInForm.hostEmployeeId || undefined,
                visitorTypeId: walkInForm.visitorTypeId || undefined,
                plantId: walkInForm.plantId || undefined,
                expectedDate: today,
            });
            showSuccess("Walk-In Registered", `${walkInForm.visitorName} has been registered.`);
            setShowWalkIn(false);
            setWalkInForm({ visitorName: "", visitorMobile: "", visitorEmail: "", visitorCompany: "", purpose: "", hostEmployeeId: "", visitorTypeId: "", plantId: "" });
        } catch (err) {
            showApiError(err);
        }
    };

    // ── Scan-driven pass actions — open the rich capture modal ──

    const [scanCaptureMode, setScanCaptureMode] = useState<null | { kind: "material-entry" | "material-return" | "vehicle-entry" | "vehicle-exit"; pass: any }>(null);

    const handleRecordMaterialEntry = () => {
        if (!passInfo || passInfo.type !== "material_pass") return;
        setScanCaptureMode({ kind: "material-entry", pass: passInfo.data });
    };

    const handleMarkMaterialReturned = () => {
        if (!passInfo || passInfo.type !== "material_pass") return;
        setScanCaptureMode({ kind: "material-return", pass: passInfo.data });
    };

    const handleRecordVehicleEntry = () => {
        if (!passInfo || passInfo.type !== "vehicle_pass") return;
        setScanCaptureMode({ kind: "vehicle-entry", pass: passInfo.data });
    };

    const handleRecordVehicleExit = () => {
        if (!passInfo || passInfo.type !== "vehicle_pass") return;
        setScanCaptureMode({ kind: "vehicle-exit", pass: passInfo.data });
    };

    const submitScanCapture = async (payload: Record<string, unknown>) => {
        if (!scanCaptureMode) return;
        const { kind, pass } = scanCaptureMode;
        try {
            if (kind === "material-entry") {
                await recordMaterialEntryMutation.mutateAsync({ id: pass.id, data: payload });
                showSuccess("Entry Recorded", "Material entry has been recorded.");
            } else if (kind === "material-return") {
                await markMaterialReturnedMutation.mutateAsync({ id: pass.id, data: payload as any });
                showSuccess("Return Recorded", "Material return has been recorded.");
            } else if (kind === "vehicle-entry") {
                await recordVehicleEntryMutation.mutateAsync({ id: pass.id, data: payload });
                showSuccess("Entry Recorded", `Entry recorded for ${pass.vehicleRegNumber}.`);
            } else if (kind === "vehicle-exit") {
                await recordVehicleExitMutation.mutateAsync({ id: pass.id, data: payload });
                showSuccess("Exit Recorded", `Exit recorded for ${pass.vehicleRegNumber}.`);
            }
            setScanCaptureMode(null);
            setPassInfo(null);
            setVisitCode("");
        } catch (err) {
            showApiError(err);
        }
    };

    const isScanCaptureSaving =
        recordMaterialEntryMutation.isPending ||
        markMaterialReturnedMutation.isPending ||
        recordVehicleEntryMutation.isPending ||
        recordVehicleExitMutation.isPending;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Gate Operations</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Watchman home — scan, register, monitor.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate("/app/company/visitors/pass-history")} className="flex items-center gap-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-2 hover:bg-neutral-50 transition-colors">
                        <History size={16} className="text-primary-600 dark:text-primary-400" />
                        <span className="text-sm font-bold text-primary-700 dark:text-primary-300">Pass History</span>
                    </button>
                </div>
            </div>

            {/* Universal Scanner + Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 p-6">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500 text-center mb-3">UNIVERSAL GATE SCANNER</p>
                    <div className="relative rounded-2xl border-2 border-dashed border-primary-300 dark:border-primary-700 bg-primary-50/50 dark:bg-primary-900/10 px-6 py-8 flex flex-col items-center justify-center min-h-[180px]">
                        {!showQrScanner ? (
                            <button onClick={startQrScanner} className="flex flex-col items-center gap-2 text-primary-700 dark:text-primary-300 hover:text-primary-800 dark:hover:text-primary-200 transition-colors">
                                <QrCode size={48} className="text-primary-500 dark:text-primary-400" />
                                <span className="text-base font-bold text-primary-950 dark:text-white">Scan Any QR / Barcode</span>
                                <span className="text-xs text-neutral-500">Visitor · Vehicle · Material · Group</span>
                                <span className="text-[11px] text-neutral-400 mt-1">Tap to scan</span>
                            </button>
                        ) : (
                            <div className="w-full space-y-3">
                                <div id={qrContainerId} className="rounded-xl overflow-hidden bg-black w-full" />
                                <button onClick={stopQrScanner} className="w-full py-2 rounded-xl border border-danger-300 text-danger-600 text-sm font-bold hover:bg-danger-50 transition-colors flex items-center justify-center gap-2">
                                    <XCircle size={14} /> Stop Scanner
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="flex items-stretch gap-2 mt-4">
                        <input
                            type="text"
                            value={visitCode}
                            onChange={(e) => setVisitCode(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === "Enter" && handleLookupCode()}
                            placeholder="VIS-00001 / MGP-000451 / VGP-…"
                            className="flex-1 px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white"
                        />
                        <button onClick={handleLookupCode} disabled={!visitCode.trim() || codeQuery.isFetching || lookupLoading} className="px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2">
                            {(codeQuery.isFetching || lookupLoading) ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                        </button>
                    </div>
                    {foundVisit && (
                        <div className="mt-4 p-4 bg-success-50 dark:bg-success-900/10 border border-success-200 dark:border-success-800/50 rounded-xl space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-success-700 dark:text-success-400">Visit Found</span>
                                <VisitStatusBadge status={foundVisit.status} />
                            </div>
                            <div className="text-sm space-y-1">
                                <p className="font-bold text-primary-950 dark:text-white">{foundVisit.visitorName}</p>
                                <p className="text-neutral-500 dark:text-neutral-400 text-xs">{foundVisit.visitorCompany || "No company"} · Host: {foundVisit.hostEmployeeName ?? foundVisit.hostEmployeeId ?? "---"}</p>
                            </div>
                            {(foundVisit.status === "EXPECTED" || foundVisit.status === "ARRIVED") && (
                                <button onClick={() => handleCheckIn(foundVisit.id)} disabled={actionId === foundVisit.id} className="w-full py-2.5 rounded-xl bg-success-600 hover:bg-success-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                    {actionId === foundVisit.id ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} />}
                                    Check In Now
                                </button>
                            )}
                            {foundVisit.status === "CHECKED_IN" && (
                                <button onClick={() => handleCheckOut(foundVisit.id)} disabled={actionId === foundVisit.id} className="w-full py-2.5 rounded-xl bg-neutral-600 hover:bg-neutral-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                    {actionId === foundVisit.id ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
                                    Check Out
                                </button>
                            )}
                        </div>
                    )}
                    {searchCode && !codeQuery.isFetching && !foundVisit && !passInfo && (
                        <div className="mt-4 p-4 bg-warning-50 dark:bg-warning-900/10 border border-warning-200 dark:border-warning-800/50 rounded-xl text-sm text-warning-700 dark:text-warning-400 font-medium">
                            No visit or pass found for &quot;{searchCode}&quot;.
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="lg:col-span-3 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 p-6">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500 mb-4">QUICK ACTIONS</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        <QuickActionChip icon={<UserPlus size={26} className="text-success-600" />} bg="bg-success-50 dark:bg-success-900/20" label="Walk-In Visitor" onClick={() => setShowWalkIn(true)} />
                        <QuickActionChip icon={<Truck size={26} className="text-primary-600" />} bg="bg-primary-50 dark:bg-primary-900/20" label="Vehicle Pass" onClick={() => setShowQuickVehicle(true)} />
                        <QuickActionChip icon={<Package size={26} className="text-accent-600" />} bg="bg-accent-50 dark:bg-accent-900/20" label="Material Pass" onClick={() => setShowQuickMaterial(true)} />
                        <QuickActionChip icon={<UsersRound size={26} className="text-info-600" />} bg="bg-info-50 dark:bg-info-900/20" label="Group Visit" onClick={() => navigate("/app/company/visitors/group-visits")} />
                        <QuickActionChip icon={<AlertTriangle size={26} className="text-danger-600" />} bg="bg-danger-50 dark:bg-danger-900/20" label="Emergency" onClick={() => navigate("/app/company/visitors/emergency")} />
                    </div>
                </div>
            </div>

            {/* Today at a Glance */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">TODAY AT A GLANCE</p>
                    <span className="text-xs text-neutral-400">{fmt.date(new Date().toISOString())}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatTile value={todayStats.expectedVisitors ?? 0} label="Expected Visitors" icon={<Users size={18} />} tint="success" onClick={() => navigate("/app/company/visitors/list?status=EXPECTED")} />
                    <StatTile value={todayStats.checkedInVisitors ?? 0} label="Checked-In" icon={<UserCheck size={18} />} tint="primary" onClick={() => navigate("/app/company/visitors/list?status=CHECKED_IN")} />
                    <StatTile value={todayStats.checkedOutVisitors ?? 0} label="Checked-Out" icon={<LogOut size={18} />} tint="warning" onClick={() => navigate("/app/company/visitors/list?status=CHECKED_OUT")} />
                    <StatTile value={todayStats.yetToArriveVisitors ?? 0} label="Yet to Arrive" icon={<Clock size={18} />} tint="accent" onClick={() => navigate("/app/company/visitors/list?status=EXPECTED")} />
                </div>
            </div>

            {/* Live Inside Premises */}
            <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500 mb-3">LIVE INSIDE PREMISES</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatTile value={liveStats.visitorsInside ?? 0} label="Visitors Inside" icon={<Users size={18} />} tint="success" onClick={() => navigate("/app/company/visitors/list?status=CHECKED_IN")} />
                    <StatTile value={liveStats.vehiclesInside ?? 0} label="Vehicles Inside" icon={<Truck size={18} />} tint="primary" onClick={() => navigate("/app/company/visitors/vehicle-passes")} />
                    <StatTile value={liveStats.contractorsInside ?? 0} label="Contractors" icon={<HardHat size={18} />} tint="warning" onClick={() => navigate("/app/company/visitors/list")} />
                    <StatTile value={liveStats.materialsPending ?? 0} label="Materials Pending" icon={<Package size={18} />} tint="accent" onClick={() => navigate("/app/company/visitors/material-passes")} />
                </div>
            </div>

            {/* Expected Visitors · Vehicles · Materials — 3-column at-a-glance pre-arrival board */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

                {/* ── Expected Visitors ── */}
                <ExpectedCard
                    title="Expected Visitors"
                    accent="success"
                    icon={<Users size={16} />}
                    count={expectedVisitors.length}
                    loading={expectedVisitorsQuery.isLoading}
                    viewAllHref="/app/company/visitors/list?status=EXPECTED"
                    emptyText="No pre-registered visitors pending arrival today."
                >
                    {expectedVisitors.map((v: any) => {
                        const initials = (v.visitorName ?? "?").split(" ").map((p: string) => p[0]).join("").slice(0, 2).toUpperCase();
                        const at = v.expectedTime ? fmt.shiftTime(v.expectedTime) : v.expectedDate ? fmt.date(v.expectedDate) : "";
                        return (
                            <div key={v.id} className="px-6 py-3 flex items-center gap-3 hover:bg-success-50/30 dark:hover:bg-success-900/10 transition-colors">
                                <div className="w-10 h-10 rounded-xl bg-success-50 dark:bg-success-900/20 flex items-center justify-center">
                                    <span className="text-sm font-bold text-success-700 dark:text-success-300">{initials}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-primary-950 dark:text-white truncate">{v.visitorName}</p>
                                    {v.visitorCompany ? <p className="text-xs text-neutral-500 truncate">{v.visitorCompany}</p> : null}
                                    <p className="text-[11px] text-neutral-400 truncate mt-0.5">{v.visitNumber}{v.hostName ? ` · Host: ${v.hostName}` : ""}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-[11px] font-bold text-success-700">{at}</p>
                                    {v.visitorType?.name ? (
                                        <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold border" style={{ backgroundColor: (v.visitorType.badgeColour ?? "#10B981") + "15", color: v.visitorType.badgeColour ?? "#047857", borderColor: (v.visitorType.badgeColour ?? "#10B981") + "30" }}>
                                            {v.visitorType.name}
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                        );
                    })}
                </ExpectedCard>

                {/* ── Expected Vehicles ── */}
                <ExpectedCard
                    title="Expected Vehicles"
                    accent="primary"
                    icon={<Truck size={16} />}
                    count={expectedVehicles.length}
                    loading={expectedVehiclesQuery.isLoading}
                    viewAllHref="/app/company/visitors/vehicle-passes"
                    emptyText="No active vehicle passes are awaiting entry."
                >
                    {expectedVehicles.map((p: any) => (
                        <div key={p.id} className="px-6 py-3 flex items-center gap-3 hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-colors">
                            <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                                <Truck size={18} className="text-primary-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-primary-950 dark:text-white truncate">{p.vehicleRegNumber}</p>
                                <p className="text-xs text-neutral-500 truncate">{p.vehicleType} · {p.driverName}</p>
                                <p className="text-[11px] text-neutral-400 truncate mt-0.5">{p.passNumber}{p.validUntil ? ` · valid till ${fmt.date(p.validUntil)}` : ""}</p>
                            </div>
                            <span className="shrink-0 inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-success-50 text-success-700 border border-success-200">ACTIVE</span>
                        </div>
                    ))}
                </ExpectedCard>

                {/* ── Expected Materials ── */}
                <ExpectedCard
                    title="Expected Materials"
                    accent="accent"
                    icon={<Package size={16} />}
                    count={expectedMaterials.length}
                    loading={expectedMaterialsQuery.isLoading}
                    viewAllHref="/app/company/visitors/material-passes"
                    emptyText="No materials pending entry today."
                >
                    {expectedMaterials.map((m: any) => (
                        <div key={m.id} className="px-6 py-3 flex items-center gap-3 hover:bg-accent-50/30 dark:hover:bg-accent-900/10 transition-colors">
                            <div className="w-10 h-10 rounded-xl bg-accent-50 dark:bg-accent-900/20 flex items-center justify-center">
                                <Package size={18} className="text-accent-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-primary-950 dark:text-white truncate">{m.description}</p>
                                {m.vendorName ? <p className="text-xs text-neutral-500 truncate">From: {m.vendorName}</p> : null}
                                <p className="text-[11px] text-neutral-400 truncate mt-0.5">{m.passNumber}{m.quantityValue ? ` · ${m.quantityValue} ${m.unitOfMeasure?.abbreviation ?? ""}` : m.quantityIssued ? ` · ${m.quantityIssued}` : ""}</p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-[11px] font-bold text-accent-700">{m.createdAt ? fmt.time(m.createdAt) : ""}</p>
                                <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-success-50 text-success-700 border border-success-200">Yet to Arrive</span>
                            </div>
                        </div>
                    ))}
                </ExpectedCard>
            </div>

            {/* Recent Activity — full-width merged feed */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-primary-950 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <History size={16} className="text-primary-600 dark:text-primary-400" />
                        Recent Activity
                    </h2>
                    <button onClick={() => navigate("/app/company/visitors/pass-history")} className="text-xs font-bold text-primary-600 hover:text-primary-700">View All ›</button>
                </div>
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {recentActivity.length === 0 ? (
                        <div className="py-10 text-center text-sm text-neutral-400">Scans and check-ins will appear here.</div>
                    ) : recentActivity.map((a: any) => {
                        const Icon = a.kind === "vehicle" ? Truck : a.kind === "material" ? Package : Users;
                        const tint = a.kind === "vehicle" ? "text-primary-600 bg-primary-50 dark:bg-primary-900/20" : a.kind === "material" ? "text-accent-600 bg-accent-50 dark:bg-accent-900/20" : "text-success-600 bg-success-50 dark:bg-success-900/20";
                        return (
                            <div key={a.id} className="px-6 py-3 flex items-center gap-3 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tint}`}><Icon size={18} /></div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-primary-950 dark:text-white truncate">{a.title}</p>
                                    {a.subtitle ? <p className="text-xs text-neutral-500 truncate">{a.subtitle}</p> : null}
                                </div>
                                <span className="text-[11px] font-bold text-neutral-400">{a.at ? fmt.time(a.at) : ""}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Webcam Photo Capture Modal */}
            {showPhotoCamera && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white flex items-center gap-2"><Camera size={18} /> Capture Visitor Photo</h2>
                            <button onClick={stopPhotoCamera} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 flex flex-col items-center gap-4">
                            <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-primary-200 dark:border-primary-700 bg-black">
                                <video ref={photoVideoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                            </div>
                            <canvas ref={photoCanvasRef} className="hidden" />
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center">Position the visitor's face within the circle</p>
                            <div className="flex gap-3 w-full">
                                <button type="button" onClick={stopPhotoCamera} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition-colors">Cancel</button>
                                <button type="button" onClick={capturePhoto} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"><Camera size={14} /> Capture</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Badge QR Modal (shown after successful check-in) */}
            {checkedInBadge && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white flex items-center gap-2">
                                <BadgeCheck size={18} className="text-success-600" /> Check-In Complete
                            </h2>
                            <button onClick={() => setCheckedInBadge(null)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 flex flex-col items-center gap-4">
                            <div className="text-center">
                                <p className="text-lg font-bold text-primary-950 dark:text-white">{checkedInBadge.visitorName}</p>
                                {checkedInBadge.badgeNumber && (
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Badge: <span className="font-mono font-semibold">{checkedInBadge.badgeNumber}</span></p>
                                )}
                            </div>
                            {checkedInBadge.visitCode && (
                                <div className="bg-white p-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
                                    <QRCodeReact
                                        value={`${window.location.origin}/visit/${checkedInBadge.visitCode}/badge`}
                                        size={200}
                                    />
                                </div>
                            )}
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center">
                                Show this QR code to the visitor to access their digital badge
                            </p>
                            <button
                                onClick={() => setCheckedInBadge(null)}
                                className="w-full py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Pre-Check-In Modal */}
            {pendingCheckIn && (() => {
                const reqs = getRequirements(pendingCheckIn);
                const approvalPending = pendingCheckIn.approvalStatus === "PENDING";
                const approvalRejected = pendingCheckIn.approvalStatus === "REJECTED";
                const preArrivalPending = reqs.preArrivalRequired && !pendingCheckIn.preArrivalSubmittedAt;
                const hasBlocker = approvalPending || approvalRejected || preArrivalPending;
                const photoSatisfied = !!visitorPhoto || !!pendingCheckIn.visitorPhoto;
                const idSatisfied = (!!preCheckIdType && !!preCheckIdNumber.trim()) || !!pendingCheckIn.governmentIdType;
                const canSubmit = !hasBlocker && (!reqs.photoRequired || photoSatisfied) && (!reqs.idRequired || idSatisfied);
                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                        <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                                <h2 className="text-lg font-bold text-primary-950 dark:text-white flex items-center gap-2"><LogIn size={18} /> Pre-Check-In</h2>
                                <button onClick={() => setPendingCheckIn(null)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                            </div>
                            <div className="p-6 space-y-5 overflow-y-auto min-h-0">
                                {/* Visitor Info */}
                                <div className="flex items-center gap-3 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                                    <div className="w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-sm font-bold text-primary-700 dark:text-primary-400">
                                        {(pendingCheckIn.visitorName || "?")[0]?.toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-primary-950 dark:text-white truncate">{pendingCheckIn.visitorName}</p>
                                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{pendingCheckIn.visitorCompany || "No company"} &middot; {pendingCheckIn.visitCode}</p>
                                    </div>
                                    {pendingCheckIn.visitorType?.name && (
                                        <span className="text-[10px] font-bold px-2 py-1 rounded-md" style={{ backgroundColor: (pendingCheckIn.visitorType.badgeColour ?? "#4F46E5") + "15", color: pendingCheckIn.visitorType.badgeColour ?? "#4F46E5" }}>{pendingCheckIn.visitorType.name}</span>
                                    )}
                                </div>

                                {/* Approval Blocker */}
                                {(approvalPending || approvalRejected) && (
                                    <div className={`p-5 rounded-xl border-2 text-center ${approvalRejected ? "border-danger-300 bg-danger-50 dark:bg-danger-900/10" : "border-warning-300 bg-warning-50 dark:bg-warning-900/10"}`}>
                                        <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${approvalRejected ? "bg-danger-100" : "bg-warning-100"}`}>
                                            {approvalRejected
                                                ? <XCircle size={24} className="text-danger-600" />
                                                : <Clock size={24} className="text-warning-600" />
                                            }
                                        </div>
                                        <h3 className={`text-sm font-bold ${approvalRejected ? "text-danger-700" : "text-warning-700"}`}>
                                            {approvalRejected ? "Visit Rejected" : "Awaiting Host Approval"}
                                        </h3>
                                        <p className={`text-xs mt-1 ${approvalRejected ? "text-danger-600" : "text-warning-600"}`}>
                                            {approvalRejected
                                                ? "This visit has been rejected by the host employee. The visitor cannot be checked in."
                                                : "The host employee has not yet approved this visit. Please ask the visitor to contact their host or wait for approval."}
                                        </p>
                                    </div>
                                )}

                                {/* Pre-Arrival Form Blocker */}
                                {preArrivalPending && !approvalPending && !approvalRejected && (
                                    <div className="p-5 rounded-xl border-2 border-warning-300 bg-warning-50 dark:bg-warning-900/10 text-center">
                                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-warning-100 flex items-center justify-center">
                                            <svg className="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-sm font-bold text-warning-700">Pre-Arrival Form Required</h3>
                                        <p className="text-xs text-warning-600 mt-1 mb-4">
                                            This visitor must complete the pre-arrival form before check-in. Ask them to check their invitation email or scan the QR code below.
                                        </p>
                                        <div className="inline-block bg-white p-4 rounded-xl border border-neutral-200">
                                            <QRCodeReact value={`${window.location.origin}/visit/${pendingCheckIn.visitCode}`} size={150} />
                                            <p className="text-[10px] text-neutral-500 mt-2">Scan to open Pre-Arrival Form</p>
                                        </div>
                                    </div>
                                )}

                                {/* Photo & ID sections — only when no blockers */}
                                {!hasBlocker && (<>
                                {/* Photo Section */}
                                <div className={`p-4 rounded-xl border ${reqs.photoRequired && !photoSatisfied ? "border-danger-300 bg-danger-50/30 dark:bg-danger-900/10" : "border-neutral-200 dark:border-neutral-700"}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Visitor Photo {reqs.photoRequired ? "" : "(Optional)"}</label>
                                        {reqs.photoRequired && <span className="text-[10px] font-bold text-danger-600 bg-danger-50 px-2 py-0.5 rounded">Required</span>}
                                    </div>
                                    {visitorPhoto ? (
                                        <div className="flex items-center gap-3">
                                            <img src={visitorPhoto} alt="Visitor" className="w-14 h-14 rounded-full object-cover border-2 border-success-200" />
                                            <span className="text-xs text-success-600 font-medium flex-1">Photo captured</span>
                                            <button type="button" onClick={startPhotoCamera} className="text-xs text-primary-600 hover:text-primary-700 font-semibold">Retake</button>
                                            <button type="button" onClick={() => setVisitorPhoto(null)} className="text-xs text-danger-500 hover:text-danger-700 font-semibold">Remove</button>
                                        </div>
                                    ) : pendingCheckIn.visitorPhoto ? (
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-success-600 font-medium bg-success-50 px-3 py-1.5 rounded-lg">Photo already on file</span>
                                            <button type="button" onClick={startPhotoCamera} className="text-xs text-primary-600 hover:text-primary-700 font-semibold">Take New</button>
                                        </div>
                                    ) : (
                                        <button type="button" onClick={startPhotoCamera} className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-primary-300 dark:border-primary-700 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 text-sm text-primary-700 dark:text-primary-400 font-semibold transition-colors w-full justify-center">
                                            <Camera className="w-4 h-4" /> Capture Photo
                                        </button>
                                    )}
                                </div>

                                {/* ID Verification Section */}
                                {vmsConfig?.idVerification !== "NEVER" && (
                                    <div className={`p-4 rounded-xl border ${reqs.idRequired && !idSatisfied ? "border-danger-300 bg-danger-50/30 dark:bg-danger-900/10" : "border-neutral-200 dark:border-neutral-700"}`}>
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">ID Verification {reqs.idRequired ? "" : "(Optional)"}</label>
                                            {reqs.idRequired && <span className="text-[10px] font-bold text-danger-600 bg-danger-50 px-2 py-0.5 rounded">Required</span>}
                                        </div>
                                        {pendingCheckIn.governmentIdType ? (
                                            <p className="text-xs text-success-600 font-medium bg-success-50 px-3 py-1.5 rounded-lg inline-block">ID verified: {pendingCheckIn.governmentIdType} — {pendingCheckIn.governmentIdNumber}</p>
                                        ) : (
                                            <div className="space-y-3">
                                                <select value={preCheckIdType} onChange={e => setPreCheckIdType(e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                                    <option value="">Select ID type...</option>
                                                    <option value="AADHAAR">Aadhaar Card</option>
                                                    <option value="PAN">PAN Card</option>
                                                    <option value="PASSPORT">Passport</option>
                                                    <option value="DRIVING_LICENSE">Driving License</option>
                                                    <option value="VOTER_ID">Voter ID</option>
                                                </select>
                                                <input type="text" value={preCheckIdNumber} onChange={e => setPreCheckIdNumber(e.target.value.toUpperCase())} placeholder="Enter ID number" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Gate is auto-assigned from the QR code scanned at the gate */}
                                </>)}
                            </div>
                            <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
                                {!canSubmit && <p className="text-xs text-danger-500 text-center">{approvalPending ? "Check-in blocked — awaiting host approval" : approvalRejected ? "Check-in blocked — visit rejected" : preArrivalPending ? "Check-in blocked — pre-arrival form not completed" : "Please complete all required fields before check-in"}</p>}
                                <div className="flex gap-3">
                                    <button onClick={() => setPendingCheckIn(null)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                                    <button onClick={handlePreCheckInSubmit} disabled={!canSubmit || actionId === pendingCheckIn.id} className="flex-[2] py-2.5 rounded-xl bg-success-600 hover:bg-success-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                        {actionId === pendingCheckIn.id ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} />}
                                        Complete Check-In
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Pass Info Modal — recurring, vehicle, material passes */}
            {passInfo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">
                                {passInfo.type === "recurring_pass" ? "Recurring Pass" : passInfo.type === "vehicle_pass" ? "Vehicle Pass" : "Material Pass"}
                            </h2>
                            <button onClick={() => setPassInfo(null)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                                <p className="text-xs text-neutral-500 font-mono">{passInfo.data.passNumber}</p>
                                {passInfo.type === "recurring_pass" && (
                                    <>
                                        <p className="text-base font-bold text-primary-950 dark:text-white mt-1">{passInfo.data.visitorName}</p>
                                        {passInfo.data.visitorCompany && <p className="text-xs text-neutral-500">{passInfo.data.visitorCompany}</p>}
                                        <div className="flex gap-2 mt-2">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary-50 text-primary-700">{passInfo.data.passType}</span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${passInfo.data.status === "ACTIVE" ? "bg-success-50 text-success-700" : "bg-danger-50 text-danger-700"}`}>{passInfo.data.status}</span>
                                        </div>
                                        {passInfo.data.validFrom && <p className="text-xs text-neutral-500 mt-2">Valid: {fmt.date(passInfo.data.validFrom)} — {fmt.date(passInfo.data.validUntil)}</p>}
                                    </>
                                )}
                                {passInfo.type === "vehicle_pass" && (
                                    <>
                                        <p className="text-base font-bold text-primary-950 dark:text-white mt-1">{passInfo.data.vehicleRegNumber}</p>
                                        <p className="text-xs text-neutral-500">{passInfo.data.vehicleType} — Driver: {passInfo.data.driverName}</p>
                                    </>
                                )}
                                {passInfo.type === "material_pass" && (
                                    <>
                                        <p className="text-base font-bold text-primary-950 dark:text-white mt-1">{passInfo.data.description}</p>
                                        <p className="text-xs text-neutral-500">{passInfo.data.type} — Qty: {passInfo.data.quantityIssued} — {passInfo.data.returnStatus}</p>
                                    </>
                                )}
                            </div>

                            {passInfo.type === "recurring_pass" && passInfo.data.status === "ACTIVE" && (
                                <button
                                    onClick={async () => {
                                        try {
                                            const result = await recurringPassCheckInMutation.mutateAsync({ id: passInfo.data.id, data: passInfo.data.gateId ? { gateId: passInfo.data.gateId } : {} });
                                            const badgeNo = result?.data?.badgeNumber;
                                            showSuccess("Checked In", badgeNo ? `Badge: ${badgeNo}` : "Recurring pass visitor checked in");
                                            setPassInfo(null);
                                            setVisitCode("");
                                        } catch (err) { showApiError(err); }
                                    }}
                                    disabled={recurringPassCheckInMutation.isPending}
                                    className="w-full py-2.5 rounded-xl bg-success-600 hover:bg-success-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {recurringPassCheckInMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} />}
                                    Check In via Recurring Pass
                                </button>
                            )}
                            {passInfo.type === "vehicle_pass" && (
                                <div className="space-y-2">
                                    {passInfo.data.status === "ACTIVE" ? (
                                        <>
                                            <button onClick={handleRecordVehicleEntry} disabled={recordVehicleEntryMutation.isPending} className="w-full py-2.5 rounded-xl bg-success-600 hover:bg-success-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                                {recordVehicleEntryMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <LogInIcon size={14} />}
                                                Record Entry
                                            </button>
                                            <button onClick={handleRecordVehicleExit} disabled={recordVehicleExitMutation.isPending} className="w-full py-2.5 rounded-xl bg-warning-600 hover:bg-warning-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                                {recordVehicleExitMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
                                                Record Exit
                                            </button>
                                            {passInfo.data.validUntil && (
                                                <p className="text-[11px] text-neutral-500 text-center">Valid until: {fmt.date(passInfo.data.validUntil)}</p>
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-xs text-neutral-500 text-center">This pass is {String(passInfo.data.status ?? "").toLowerCase()} and cannot be used at the gate.</p>
                                    )}
                                </div>
                            )}

                            {passInfo.type === "material_pass" && (() => {
                                const mtype = passInfo.data.type;
                                const mstatus = passInfo.data.status;
                                const isOutwardLike = mtype === "OUTWARD" || mtype === "RETURNABLE";
                                const showEntry = mstatus === "ISSUED";
                                const showReturn = mstatus === "IN_USE" && mtype === "RETURNABLE";
                                const isTerminal = ["COMPLETED", "CANCELLED", "EXPIRED"].includes(mstatus);
                                return (
                                    <div className="space-y-2">
                                        {showEntry && (
                                            <button onClick={handleRecordMaterialEntry} disabled={recordMaterialEntryMutation.isPending} className={`w-full py-2.5 rounded-xl text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${isOutwardLike ? "bg-warning-600 hover:bg-warning-700" : "bg-success-600 hover:bg-success-700"}`}>
                                                {recordMaterialEntryMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : isOutwardLike ? <LogOut size={14} /> : <LogInIcon size={14} />}
                                                {isOutwardLike ? "Record Exit" : "Record Entry"}
                                            </button>
                                        )}
                                        {showReturn && (
                                            <>
                                                <button onClick={handleMarkMaterialReturned} disabled={markMaterialReturnedMutation.isPending} className="w-full py-2.5 rounded-xl bg-success-600 hover:bg-success-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                                    {markMaterialReturnedMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <LogInIcon size={14} />}
                                                    Record Full Return
                                                </button>
                                                <p className="text-[11px] text-neutral-500 text-center">For partial returns, open this pass from Material Passes screen.</p>
                                            </>
                                        )}
                                        {isTerminal && (
                                            <p className="text-xs text-neutral-500 text-center">This pass is {String(mstatus).toLowerCase()} and cannot be actioned at the gate.</p>
                                        )}
                                    </div>
                                );
                            })()}

                            <button onClick={() => setPassInfo(null)} className="w-full py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition-colors">Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Walk-In Modal */}
            {showWalkIn && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">Walk-In Registration</h2>
                            <button onClick={() => setShowWalkIn(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto min-h-0">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                                    Visitor Name <span className="text-danger-500">*</span>
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                    <input
                                        type="text"
                                        value={walkInForm.visitorName}
                                        onChange={(e) => setWalkInForm((p) => ({ ...p, visitorName: e.target.value }))}
                                        placeholder="Full name"
                                        className="w-full pl-10 pr-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Mobile</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                    <input
                                        type="text"
                                        value={walkInForm.visitorMobile}
                                        onChange={(e) => setWalkInForm((p) => ({ ...p, visitorMobile: e.target.value }))}
                                        placeholder="+91 98765 43210"
                                        className="w-full pl-10 pr-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Email <span className="text-neutral-400 text-[10px] font-normal normal-case">(for digital badge)</span></label>
                                <input
                                    type="email"
                                    value={walkInForm.visitorEmail}
                                    onChange={(e) => setWalkInForm((p) => ({ ...p, visitorEmail: e.target.value }))}
                                    placeholder="visitor@company.com"
                                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Company</label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                    <input
                                        type="text"
                                        value={walkInForm.visitorCompany}
                                        onChange={(e) => setWalkInForm((p) => ({ ...p, visitorCompany: e.target.value }))}
                                        placeholder="Company name"
                                        className="w-full pl-10 pr-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Purpose</label>
                                <select
                                    value={walkInForm.purpose}
                                    onChange={(e) => setWalkInForm((p) => ({ ...p, purpose: e.target.value }))}
                                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                                >
                                    <option value="">Select purpose...</option>
                                    <option value="MEETING">Meeting</option>
                                    <option value="DELIVERY">Delivery</option>
                                    <option value="MAINTENANCE">Maintenance</option>
                                    <option value="AUDIT">Audit</option>
                                    <option value="INTERVIEW">Interview</option>
                                    <option value="SITE_TOUR">Site Tour</option>
                                    <option value="PERSONAL">Personal</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>
                            <SearchableSelect
                                label="Host Employee"
                                value={walkInForm.hostEmployeeId}
                                onChange={(v) => setWalkInForm((p) => ({ ...p, hostEmployeeId: v }))}
                                options={employees.map((e: any) => ({
                                    value: e.id,
                                    label: `${e.firstName} ${e.lastName}`,
                                    sublabel: e.designation?.name ?? e.department?.name ?? e.employeeCode ?? "",
                                }))}
                                placeholder="Search employee..."
                            />
                            <SearchableSelect
                                label="Location (Plant)"
                                value={walkInForm.plantId}
                                onChange={(v) => setWalkInForm((p) => ({ ...p, plantId: v }))}
                                options={locations.map((l: any) => ({
                                    value: l.id,
                                    label: l.name,
                                    sublabel: l.city ? `${l.city}, ${l.state ?? ""}` : undefined,
                                }))}
                                placeholder="Select location..."
                            />
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setShowWalkIn(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button
                                onClick={handleWalkIn}
                                disabled={
                                    createMutation.isPending
                                    || !walkInForm.visitorName.trim()
                                    || !walkInForm.visitorMobile.trim()
                                    || walkInForm.visitorMobile.trim().length < 10
                                    || !walkInForm.purpose
                                    || !walkInForm.visitorTypeId
                                    || !walkInForm.plantId
                                }
                                className="flex-1 py-2.5 rounded-xl bg-success-600 hover:bg-success-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {createMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} />}
                                {createMutation.isPending ? "Registering..." : "Register & Check In"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick-Create Vehicle Pass */}
            <QuickCreateVehicleModal
                open={showQuickVehicle}
                onClose={() => setShowQuickVehicle(false)}
                onCreated={(id) => {
                    recordVehicleEntryMutation.mutate({ id, data: { notes: "Created at gate" } });
                }}
                locations={locations}
                gates={gatesList}
            />

            {/* Quick-Create Material Pass */}
            <QuickCreateMaterialModal
                open={showQuickMaterial}
                onClose={() => setShowQuickMaterial(false)}
                onCreated={(id) => {
                    recordMaterialEntryMutation.mutate({ id, data: { notes: "Created at gate" } });
                }}
                locations={locations}
                gates={gatesList}
                employees={employees}
            />

            {/* Scan Capture Modal — quantity / status / odometer / notes */}
            <ScanCaptureModal
                mode={scanCaptureMode}
                onSubmit={submitScanCapture}
                onCancel={() => setScanCaptureMode(null)}
                isSaving={isScanCaptureSaving}
            />
        </div>
    );
}
