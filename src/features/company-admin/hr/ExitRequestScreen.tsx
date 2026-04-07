import { useState, useMemo } from "react";
import { LogOut, Plus, Search, X, ChevronDown } from "lucide-react";
import { useExitRequests } from "../api/use-offboarding-queries";
import { useCreateExitRequest, useUpdateExitRequest } from "../api/use-offboarding-mutations";
import { toast } from "sonner";

// ============ TYPES ============

type SeparationType = "Resignation" | "Retirement" | "Termination" | "Layoff" | "Death";
type ExitStatus = "Initiated" | "Notice Period" | "Clearance Pending" | "Interview Done" | "F&F Pending" | "Closed";

interface ExitRequestItem {
    id: string;
    employeeId: string;
    employeeName: string;
    separationType: SeparationType;
    resignationDate: string;
    lastWorkingDate: string;
    noticePeriodDays: number;
    noticeWaiver: boolean;
    status: ExitStatus;
    createdAt: string;
}

// ============ CONSTANTS ============

const SEPARATION_TYPES: SeparationType[] = ["Resignation", "Retirement", "Termination", "Layoff", "Death"];
const STATUS_FILTERS: ("All" | ExitStatus)[] = ["All", "Initiated", "Notice Period", "Clearance Pending", "Interview Done", "F&F Pending", "Closed"];

const SEPARATION_STYLES: Record<SeparationType, string> = {
    Resignation: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    Retirement: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    Termination: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    Layoff: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    Death: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
};

const STATUS_STYLES: Record<ExitStatus, string> = {
    "Initiated": "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    "Notice Period": "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    "Clearance Pending": "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
    "Interview Done": "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
    "F&F Pending": "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    "Closed": "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300",
};

// ============ INITIATE EXIT MODAL ============

function InitiateExitModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const createMutation = useCreateExitRequest();
    const [employeeId, setEmployeeId] = useState("");
    const [employeeName, setEmployeeName] = useState("");
    const [separationType, setSeparationType] = useState<SeparationType>("Resignation");
    const [resignationDate, setResignationDate] = useState("");
    const [lastWorkingDate, setLastWorkingDate] = useState("");
    const [noticeWaiver, setNoticeWaiver] = useState(false);
    const [reason, setReason] = useState("");

    const resetForm = () => {
        setEmployeeId(""); setEmployeeName(""); setSeparationType("Resignation");
        setResignationDate(""); setLastWorkingDate(""); setNoticeWaiver(false); setReason("");
    };

    const handleSubmit = () => {
        if (!employeeName || !resignationDate) {
            toast.error("Employee name and resignation date are required");
            return;
        }
        createMutation.mutate(
            { employeeId, employeeName, separationType, resignationDate, lastWorkingDate, noticeWaiver, reason },
            {
                onSuccess: () => { toast.success("Exit request initiated"); resetForm(); onClose(); },
                onError: () => toast.error("Failed to create exit request"),
            }
        );
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-neutral-100 dark:border-neutral-800">
                    <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Initiate Exit</h2>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
                        <X className="w-5 h-5 text-neutral-500" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Employee Name *</label>
                        <input value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} placeholder="Enter employee name"
                            className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Separation Type</label>
                        <div className="flex flex-wrap gap-2">
                            {SEPARATION_TYPES.map(t => (
                                <button key={t} onClick={() => setSeparationType(t)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${t === separationType ? "bg-primary-600 text-white border-primary-600" : "border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-primary-300"}`}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Resignation Date *</label>
                            <input type="date" value={resignationDate} onChange={(e) => setResignationDate(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Last Working Date</label>
                            <input type="date" value={lastWorkingDate} onChange={(e) => setLastWorkingDate(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Notice Period Waiver</label>
                        <button onClick={() => setNoticeWaiver(!noticeWaiver)}
                            className={`w-10 h-6 rounded-full transition-colors ${noticeWaiver ? "bg-primary-500" : "bg-neutral-300 dark:bg-neutral-600"}`}>
                            <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform mx-1 ${noticeWaiver ? "translate-x-4" : ""}`} />
                        </button>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Reason / Notes</label>
                        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Optional notes..."
                            className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none" />
                    </div>
                </div>
                <div className="flex justify-end gap-3 p-6 border-t border-neutral-100 dark:border-neutral-800">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800">Cancel</button>
                    <button onClick={handleSubmit} disabled={createMutation.isPending || !employeeName || !resignationDate}
                        className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 transition-colors">
                        {createMutation.isPending ? "Submitting..." : "Submit"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============ MAIN SCREEN ============

export function ExitRequestScreen() {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<"All" | ExitStatus>("All");
    const [showModal, setShowModal] = useState(false);

    const { data, isLoading } = useExitRequests();

    const exitRequests: ExitRequestItem[] = useMemo(() => {
        const raw = (data as any)?.data ?? data ?? [];
        return Array.isArray(raw) ? raw : [];
    }, [data]);

    const filtered = useMemo(() => {
        let list = exitRequests;
        if (statusFilter !== "All") list = list.filter(r => r.status === statusFilter);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(r => {
                const name = r.employeeName ?? (r.employee ? `${r.employee.firstName ?? ''} ${r.employee.lastName ?? ''}`.trim() : '');
                return name.toLowerCase().includes(q) || (r.employee?.employeeId ?? '').toLowerCase().includes(q);
            });
        }
        return list;
    }, [exitRequests, statusFilter, search]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Actions */}
            <div className="flex items-center justify-between">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employees..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <button onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors">
                    <Plus className="w-4 h-4" /> Initiate Exit
                </button>
            </div>

            {/* Status Filters */}
            <div className="flex flex-wrap gap-2">
                {STATUS_FILTERS.map(s => (
                    <button key={s} onClick={() => setStatusFilter(s)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${s === statusFilter ? "bg-primary-600 text-white border-primary-600" : "border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-primary-300"}`}>
                        {s}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
                            <th className="text-left px-4 py-3 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Employee</th>
                            <th className="text-left px-4 py-3 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Type</th>
                            <th className="text-left px-4 py-3 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Resignation Date</th>
                            <th className="text-left px-4 py-3 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Last Working Day</th>
                            <th className="text-left px-4 py-3 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Notice (days)</th>
                            <th className="text-left px-4 py-3 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="border-b border-neutral-50 dark:border-neutral-800">
                                    {Array.from({ length: 6 }).map((_, j) => (
                                        <td key={j} className="px-4 py-3"><div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse w-24" /></td>
                                    ))}
                                </tr>
                            ))
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center py-12">
                                    <LogOut className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
                                    <p className="text-neutral-500 dark:text-neutral-400 font-semibold">No exit requests found</p>
                                    <p className="text-neutral-400 dark:text-neutral-500 text-sm">Click "Initiate Exit" to begin a separation process</p>
                                </td>
                            </tr>
                        ) : (
                            filtered.map((item) => (
                                <tr key={item.id} className="border-b border-neutral-50 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-xs font-bold text-primary-600 dark:text-primary-400">
                                                {(item.employeeName ?? `${item.employee?.firstName ?? ''} ${item.employee?.lastName ?? ''}`.trim())?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                                            </div>
                                            <div>
                                                <span className="text-sm font-semibold text-neutral-900 dark:text-white">{item.employeeName ?? `${item.employee?.firstName ?? ''} ${item.employee?.lastName ?? ''}`.trim() || item.employeeId}</span>
                                                {item.employee?.employeeId && <span className="block text-[11px] font-mono text-neutral-400">{item.employee.employeeId}</span>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${SEPARATION_STYLES[item.separationType] ?? ""}`}>
                                            {item.separationType}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300">{item.resignationDate || "--"}</td>
                                    <td className="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300">{item.lastWorkingDate || "--"}</td>
                                    <td className="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300">{item.noticePeriodDays ?? "--"}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[item.status] ?? ""}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <InitiateExitModal open={showModal} onClose={() => setShowModal(false)} />
        </div>
    );
}
