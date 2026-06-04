import { useState } from "react";
import {
    History,
    Users,
    Truck,
    Package,
    X,
    Loader2,
    ChevronRight,
    Circle,
} from "lucide-react";
import {
    useVisits,
    useVehiclePasses,
    useMaterialPasses,
    useVehiclePassEvents,
    useMaterialPassEvents,
} from "@/features/company-admin/api/use-visitor-queries";
import { useCompanyFormatter } from "@/hooks/useCompanyFormatter";
import { SkeletonTable } from "@/components/ui/Skeleton";

type Tab = "visits" | "vehicles" | "materials";

const VISIT_STATUS_BADGE: Record<string, string> = {
    EXPECTED: "bg-info-50 text-info-700",
    ARRIVED: "bg-warning-50 text-warning-700",
    CHECKED_IN: "bg-success-50 text-success-700",
    CHECKED_OUT: "bg-neutral-100 text-neutral-600",
    AUTO_CHECKED_OUT: "bg-neutral-100 text-neutral-600",
    NO_SHOW: "bg-neutral-100 text-neutral-500",
    CANCELLED: "bg-neutral-100 text-neutral-500",
    REJECTED: "bg-danger-50 text-danger-700",
};

const PASS_STATUS_BADGE: Record<string, string> = {
    ISSUED: "bg-info-50 text-info-700",
    IN_USE: "bg-warning-50 text-warning-700",
    ACTIVE: "bg-success-50 text-success-700",
    COMPLETED: "bg-neutral-100 text-neutral-600",
    CANCELLED: "bg-neutral-100 text-neutral-500",
    REVOKED: "bg-danger-50 text-danger-700",
    EXPIRED: "bg-neutral-100 text-neutral-500",
};

const EVENT_LABELS: Record<string, string> = {
    CREATED: "Pass created",
    ENTRY: "Entry recorded",
    EXIT: "Exit recorded",
    PARTIAL_RETURN: "Partial return",
    FULL_RETURN: "Full return",
    CANCELLED: "Cancelled",
    EXPIRED: "Auto-expired",
};

const EVENT_TINT: Record<string, string> = {
    CREATED: "text-info-600",
    ENTRY: "text-success-600",
    EXIT: "text-warning-600",
    PARTIAL_RETURN: "text-info-600",
    FULL_RETURN: "text-success-600",
    CANCELLED: "text-danger-600",
    EXPIRED: "text-neutral-500",
};

export function PassHistoryScreen() {
    const fmt = useCompanyFormatter();
    const [tab, setTab] = useState<Tab>("visits");
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [selected, setSelected] = useState<null | { kind: Tab; data: any }>(null);

    const visitsQuery = useVisits({ limit: 100 });
    const vehiclesQuery = useVehiclePasses({ limit: 100, ...(statusFilter && tab === "vehicles" ? { status: statusFilter } : {}) });
    const materialsQuery = useMaterialPasses({ limit: 100, ...(statusFilter && tab === "materials" ? { status: statusFilter } : {}) });

    const visits: any[] = (visitsQuery.data as any)?.data ?? [];
    const vehicles: any[] = (vehiclesQuery.data as any)?.data ?? [];
    const materials: any[] = (materialsQuery.data as any)?.data ?? [];

    const filteredVisits = statusFilter && tab === "visits"
        ? visits.filter((v) => v.status === statusFilter)
        : visits;

    const activeLoading = tab === "visits"
        ? visitsQuery.isLoading
        : tab === "vehicles" ? vehiclesQuery.isLoading : materialsQuery.isLoading;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight flex items-center gap-3">
                        <History size={28} className="text-primary-600" />
                        Pass History
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Complete activity log for visits, vehicles, and material passes.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                <div className="flex border-b border-neutral-100 dark:border-neutral-800">
                    {(["visits", "vehicles", "materials"] as Tab[]).map((t) => {
                        const Icon = t === "visits" ? Users : t === "vehicles" ? Truck : Package;
                        const label = t === "visits" ? "Visits" : t === "vehicles" ? "Vehicles" : "Materials";
                        return (
                            <button
                                key={t}
                                onClick={() => { setTab(t); setStatusFilter(""); }}
                                className={`flex-1 py-3 px-4 text-sm font-bold transition-colors flex items-center justify-center gap-2 border-b-2 ${tab === t ? "border-primary-600 text-primary-700 dark:text-primary-300" : "border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"}`}
                            >
                                <Icon size={16} />
                                {label}
                            </button>
                        );
                    })}
                </div>

                {/* Filter chips */}
                <div className="px-6 py-3 border-b border-neutral-100 dark:border-neutral-800 flex flex-wrap gap-2 items-center">
                    <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest">Status:</span>
                    {(tab === "visits"
                        ? ["", "EXPECTED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED", "REJECTED"]
                        : tab === "vehicles"
                        ? ["", "ACTIVE", "EXPIRED", "REVOKED"]
                        : ["", "ISSUED", "IN_USE", "COMPLETED", "CANCELLED", "EXPIRED"]
                    ).map((s) => (
                        <button
                            key={s || "all"}
                            onClick={() => setStatusFilter(s)}
                            className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-colors ${statusFilter === s ? "bg-primary-600 text-white border-primary-600" : "bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50"}`}
                        >
                            {s ? s.replace(/_/g, " ") : "All"}
                        </button>
                    ))}
                </div>

                {/* Table */}
                {activeLoading ? (
                    <SkeletonTable rows={6} cols={5} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    {tab === "visits" && (<>
                                        <th className="py-3 px-5 font-bold">Visitor</th>
                                        <th className="py-3 px-5 font-bold">Visit No.</th>
                                        <th className="py-3 px-5 font-bold">Check-In</th>
                                        <th className="py-3 px-5 font-bold">Check-Out</th>
                                        <th className="py-3 px-5 font-bold text-center">Status</th>
                                        <th className="py-3 px-5 font-bold text-right"></th>
                                    </>)}
                                    {tab === "vehicles" && (<>
                                        <th className="py-3 px-5 font-bold">Vehicle</th>
                                        <th className="py-3 px-5 font-bold">Pass No.</th>
                                        <th className="py-3 px-5 font-bold">Driver</th>
                                        <th className="py-3 px-5 font-bold">Valid Until</th>
                                        <th className="py-3 px-5 font-bold text-center">Status</th>
                                        <th className="py-3 px-5 font-bold text-right"></th>
                                    </>)}
                                    {tab === "materials" && (<>
                                        <th className="py-3 px-5 font-bold">Description</th>
                                        <th className="py-3 px-5 font-bold">Pass No.</th>
                                        <th className="py-3 px-5 font-bold">Type</th>
                                        <th className="py-3 px-5 font-bold">Quantity</th>
                                        <th className="py-3 px-5 font-bold text-center">Status</th>
                                        <th className="py-3 px-5 font-bold text-right"></th>
                                    </>)}
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {tab === "visits" && (filteredVisits.length === 0 ? (
                                    <tr><td colSpan={6} className="py-12 text-center text-neutral-400 text-sm">No visits match this filter.</td></tr>
                                ) : filteredVisits.map((v: any) => (
                                    <tr key={v.id} onClick={() => setSelected({ kind: "visits", data: v })} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer">
                                        <td className="py-3 px-5"><span className="font-bold text-primary-950 dark:text-white">{v.visitorName}</span><span className="text-xs text-neutral-500 ml-2">{v.visitorCompany ?? ""}</span></td>
                                        <td className="py-3 px-5 text-xs font-mono text-neutral-500">{v.visitNumber}</td>
                                        <td className="py-3 px-5 text-xs text-neutral-600 dark:text-neutral-400">{v.checkInTime ? fmt.dateTime(v.checkInTime) : "—"}</td>
                                        <td className="py-3 px-5 text-xs text-neutral-600 dark:text-neutral-400">{v.checkOutTime ? fmt.dateTime(v.checkOutTime) : "—"}</td>
                                        <td className="py-3 px-5 text-center"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${VISIT_STATUS_BADGE[v.status] ?? "bg-neutral-100 text-neutral-600"}`}>{(v.status ?? "").replace(/_/g, " ")}</span></td>
                                        <td className="py-3 px-5 text-right"><ChevronRight size={14} className="text-neutral-300 inline" /></td>
                                    </tr>
                                )))}
                                {tab === "vehicles" && (vehicles.length === 0 ? (
                                    <tr><td colSpan={6} className="py-12 text-center text-neutral-400 text-sm">No vehicle passes yet.</td></tr>
                                ) : vehicles.map((p: any) => (
                                    <tr key={p.id} onClick={() => setSelected({ kind: "vehicles", data: p })} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer">
                                        <td className="py-3 px-5"><span className="font-bold text-primary-950 dark:text-white">{p.vehicleRegNumber}</span><span className="text-xs text-neutral-500 ml-2">{p.vehicleType}</span></td>
                                        <td className="py-3 px-5 text-xs font-mono text-neutral-500">{p.passNumber}</td>
                                        <td className="py-3 px-5 text-xs text-neutral-600">{p.driverName}</td>
                                        <td className="py-3 px-5 text-xs text-neutral-600">{p.validUntil ? fmt.date(p.validUntil) : "—"}</td>
                                        <td className="py-3 px-5 text-center"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${PASS_STATUS_BADGE[p.status] ?? "bg-neutral-100 text-neutral-600"}`}>{(p.status ?? "").replace(/_/g, " ")}</span></td>
                                        <td className="py-3 px-5 text-right"><ChevronRight size={14} className="text-neutral-300 inline" /></td>
                                    </tr>
                                )))}
                                {tab === "materials" && (materials.length === 0 ? (
                                    <tr><td colSpan={6} className="py-12 text-center text-neutral-400 text-sm">No material passes yet.</td></tr>
                                ) : materials.map((p: any) => {
                                    const qty = p.quantityValue != null
                                        ? `${p.quantityValue}${p.unitOfMeasure?.abbreviation ? ` ${p.unitOfMeasure.abbreviation}` : ""}`
                                        : p.quantityIssued ?? "—";
                                    return (
                                        <tr key={p.id} onClick={() => setSelected({ kind: "materials", data: p })} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer">
                                            <td className="py-3 px-5"><span className="font-bold text-primary-950 dark:text-white truncate block max-w-xs">{p.description}</span>{p.vendorName ? <span className="text-xs text-neutral-500">{p.vendorName}</span> : null}</td>
                                            <td className="py-3 px-5 text-xs font-mono text-neutral-500">{p.passNumber}</td>
                                            <td className="py-3 px-5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-accent-50 text-accent-700">{p.type}</span></td>
                                            <td className="py-3 px-5 text-xs text-neutral-600">{qty}</td>
                                            <td className="py-3 px-5 text-center"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${PASS_STATUS_BADGE[p.status] ?? "bg-neutral-100 text-neutral-600"}`}>{(p.status ?? "").replace(/_/g, " ")}</span></td>
                                            <td className="py-3 px-5 text-right"><ChevronRight size={14} className="text-neutral-300 inline" /></td>
                                        </tr>
                                    );
                                }))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selected && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <div>
                                <h2 className="text-lg font-bold text-primary-950 dark:text-white">
                                    {selected.kind === "visits" ? "Visit Details" : selected.kind === "vehicles" ? "Vehicle Pass" : "Material Pass"}
                                </h2>
                                <p className="text-xs font-mono text-neutral-500 mt-0.5">{selected.kind === "visits" ? selected.data.visitNumber : selected.data.passNumber}</p>
                            </div>
                            <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-6">
                            <DetailGrid selection={selected} fmt={fmt} />
                            {selected.kind !== "visits" && (
                                <EventTimeline kind={selected.kind} passId={selected.data.id} fmt={fmt} />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function DetailGrid({ selection, fmt }: { selection: { kind: Tab; data: any }; fmt: any }) {
    const rows: { label: string; value: string | null | undefined }[] = [];
    if (selection.kind === "visits") {
        const v = selection.data;
        rows.push(
            { label: "Visitor", value: v.visitorName },
            { label: "Mobile", value: v.visitorMobile },
            { label: "Company", value: v.visitorCompany },
            { label: "Purpose", value: v.purpose },
            { label: "Status", value: v.status?.replace(/_/g, " ") },
            { label: "Check-In", value: v.checkInTime ? fmt.dateTime(v.checkInTime) : "—" },
            { label: "Check-Out", value: v.checkOutTime ? fmt.dateTime(v.checkOutTime) : "—" },
            { label: "Badge", value: v.badgeNumber ?? "—" },
            { label: "Duration", value: v.visitDurationMinutes ? `${Math.floor(v.visitDurationMinutes / 60)}h ${v.visitDurationMinutes % 60}m` : "—" },
        );
    } else if (selection.kind === "vehicles") {
        const p = selection.data;
        rows.push(
            { label: "Vehicle", value: p.vehicleRegNumber },
            { label: "Type", value: p.vehicleType },
            { label: "Driver", value: p.driverName },
            { label: "Driver Mobile", value: p.driverMobile ?? "—" },
            { label: "Purpose", value: p.purpose },
            { label: "Status", value: p.status },
            { label: "Valid From", value: p.validFrom ? fmt.date(p.validFrom) : "—" },
            { label: "Valid Until", value: p.validUntil ? fmt.date(p.validUntil) : "—" },
        );
    } else {
        const p = selection.data;
        const qty = p.quantityValue != null
            ? `${p.quantityValue}${p.unitOfMeasure?.abbreviation ? ` ${p.unitOfMeasure.abbreviation}` : ""}`
            : p.quantityIssued ?? "—";
        rows.push(
            { label: "Description", value: p.description },
            { label: "Type", value: p.type },
            { label: "Quantity", value: qty },
            { label: "Vendor", value: p.vendorName ?? "—" },
            { label: "Purpose", value: p.purpose },
            { label: "Status", value: p.status },
            { label: "Return Status", value: (p.returnStatus ?? "NOT_APPLICABLE").replace(/_/g, " ") },
            { label: "Expected Return", value: p.expectedReturnDate ? fmt.date(p.expectedReturnDate) : "—" },
            { label: "Returned At", value: p.returnedAt ? fmt.dateTime(p.returnedAt) : "—" },
        );
    }
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            {rows.map((r) => (
                <div key={r.label} className="flex justify-between gap-4">
                    <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest">{r.label}</span>
                    <span className="text-sm font-medium text-primary-950 dark:text-white text-right">{r.value ?? "—"}</span>
                </div>
            ))}
        </div>
    );
}

function EventTimeline({ kind, passId, fmt }: { kind: "vehicles" | "materials"; passId: string; fmt: any }) {
    const vehicleEvents = useVehiclePassEvents(kind === "vehicles" ? passId : "");
    const materialEvents = useMaterialPassEvents(kind === "materials" ? passId : "");
    const query = kind === "vehicles" ? vehicleEvents : materialEvents;
    const events: any[] = (query.data as any)?.data ?? [];

    return (
        <div>
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-neutral-500 mb-3">Activity Log</h3>
            {query.isLoading ? (
                <div className="flex items-center gap-2 text-neutral-400"><Loader2 size={14} className="animate-spin" /><span className="text-xs">Loading events…</span></div>
            ) : events.length === 0 ? (
                <p className="text-xs text-neutral-400 py-2">No events recorded yet.</p>
            ) : (
                <ol className="relative border-l-2 border-neutral-100 dark:border-neutral-800 ml-2 space-y-4">
                    {events.map((e) => (
                        <li key={e.id} className="ml-4">
                            <span className="absolute -left-[7px] mt-1.5 w-3 h-3 rounded-full bg-primary-500 ring-2 ring-white dark:ring-neutral-900" />
                            <div className="flex items-center gap-2">
                                <Circle size={8} className={EVENT_TINT[e.type] ?? "text-neutral-400"} fill="currentColor" />
                                <span className="text-sm font-bold text-primary-950 dark:text-white">{EVENT_LABELS[e.type] ?? e.type}</span>
                            </div>
                            <p className="text-xs text-neutral-500 mt-0.5">
                                {e.recordedAt ? fmt.dateTime(e.recordedAt) : ""}
                                {e.quantityValue != null ? ` · qty ${e.quantityValue}` : ""}
                            </p>
                            {e.notes ? <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">{e.notes}</p> : null}
                        </li>
                    ))}
                </ol>
            )}
        </div>
    );
}
