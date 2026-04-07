import { useState, useMemo } from "react";
import { Calculator, Search, X } from "lucide-react";
import { useFnFSettlements } from "../api/use-offboarding-queries";
import { useComputeFnF, useApproveFnF, usePayFnF } from "../api/use-offboarding-mutations";
import { toast } from "sonner";

// ============ TYPES ============

type FnFStatus = "Draft" | "Computed" | "Approved" | "Paid";

interface FnFBreakdown {
    salaryForWorkedDays: number;
    leaveEncashment: number;
    gratuity: number;
    bonusProRata: number;
    noticePay: number;
    loanRecovery: number;
    assetRecovery: number;
    reimbursement: number;
    tds: number;
    netAmount: number;
}

interface FnFSettlementItem {
    id: string;
    exitRequestId: string;
    employeeName: string;
    totalAmount: number;
    status: FnFStatus;
    breakdown?: FnFBreakdown;
}

// ============ CONSTANTS ============

const STATUS_FILTERS: ("All" | FnFStatus)[] = ["All", "Draft", "Computed", "Approved", "Paid"];

const STATUS_STYLES: Record<FnFStatus, string> = {
    Draft: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
    Computed: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    Approved: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    Paid: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
};

const FNF_LINE_ITEMS: { key: keyof FnFBreakdown; label: string; isDeduction?: boolean }[] = [
    { key: "salaryForWorkedDays", label: "Salary for Worked Days" },
    { key: "leaveEncashment", label: "Leave Encashment" },
    { key: "gratuity", label: "Gratuity" },
    { key: "bonusProRata", label: "Bonus Pro-rata" },
    { key: "noticePay", label: "Notice Pay" },
    { key: "loanRecovery", label: "Loan Recovery", isDeduction: true },
    { key: "assetRecovery", label: "Asset Recovery", isDeduction: true },
    { key: "reimbursement", label: "Reimbursement" },
    { key: "tds", label: "TDS", isDeduction: true },
    { key: "netAmount", label: "Net Amount" },
];

function formatCurrency(amount: number | undefined): string {
    if (amount === undefined || amount === null) return "--";
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

// ============ DETAIL MODAL ============

function FnFDetailModal({ settlement, onClose, onCompute, onApprove, onPay, isComputing, isApproving, isPaying }: {
    settlement: FnFSettlementItem | null; onClose: () => void;
    onCompute: () => void; onApprove: () => void; onPay: () => void;
    isComputing: boolean; isApproving: boolean; isPaying: boolean;
}) {
    if (!settlement) return null;
    const breakdown = settlement.breakdown;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-sm font-bold text-primary-600 dark:text-primary-400">
                            {(settlement.employeeName ?? `${settlement.employee?.firstName ?? ''} ${settlement.employee?.lastName ?? ''}`.trim())?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">{settlement.employeeName ?? `${settlement.employee?.firstName ?? ''} ${settlement.employee?.lastName ?? ''}`.trim() || 'Unknown'}</h2>
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[settlement.status]}`}>{settlement.status}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-xl font-bold text-primary-600 dark:text-primary-400">{formatCurrency(settlement.totalAmount)}</span>
                        <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
                            <X className="w-5 h-5 text-neutral-500" />
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-4">F&F Breakdown</h3>
                    <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                                    <th className="text-left px-4 py-3 text-xs font-bold text-neutral-500 uppercase">Component</th>
                                    <th className="text-right px-4 py-3 text-xs font-bold text-neutral-500 uppercase">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {FNF_LINE_ITEMS.map((line) => {
                                    const amount = breakdown?.[line.key] ?? 0;
                                    const isNet = line.key === "netAmount";
                                    return (
                                        <tr key={line.key} className={`border-b border-neutral-100 dark:border-neutral-700 ${isNet ? "bg-primary-50 dark:bg-primary-900/20 font-bold" : ""}`}>
                                            <td className={`px-4 py-3 text-sm ${isNet ? "font-bold text-neutral-900 dark:text-white" : "text-neutral-700 dark:text-neutral-300"}`}>{line.label}</td>
                                            <td className={`px-4 py-3 text-sm text-right ${isNet ? "font-bold text-neutral-900 dark:text-white" : line.isDeduction ? "text-red-600 dark:text-red-400 font-semibold" : "text-neutral-700 dark:text-neutral-300 font-semibold"}`}>
                                                {line.isDeduction && amount > 0 ? `- ${formatCurrency(amount)}` : formatCurrency(amount)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex justify-end gap-3 p-6 border-t border-neutral-100 dark:border-neutral-800">
                    {settlement.status === "Draft" && (
                        <button onClick={onCompute} disabled={isComputing}
                            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors">
                            {isComputing ? "Computing..." : "Compute F&F"}
                        </button>
                    )}
                    {settlement.status === "Computed" && (
                        <button onClick={onApprove} disabled={isApproving}
                            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-colors">
                            {isApproving ? "Approving..." : "Approve"}
                        </button>
                    )}
                    {settlement.status === "Approved" && (
                        <button onClick={onPay} disabled={isPaying}
                            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 transition-colors">
                            {isPaying ? "Processing..." : "Mark as Paid"}
                        </button>
                    )}
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800">Close</button>
                </div>
            </div>
        </div>
    );
}

// ============ MAIN SCREEN ============

export function FnFSettlementScreen() {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<"All" | FnFStatus>("All");
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const { data, isLoading, refetch } = useFnFSettlements(
        statusFilter !== "All" ? { status: statusFilter } : undefined
    );
    const computeMutation = useComputeFnF();
    const approveMutation = useApproveFnF();
    const payMutation = usePayFnF();

    const settlements: FnFSettlementItem[] = useMemo(() => {
        const raw = (data as any)?.data ?? data ?? [];
        return Array.isArray(raw) ? raw : [];
    }, [data]);

    const filtered = useMemo(() => {
        let list = settlements;
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(s => {
                const name = s.employeeName ?? (s.employee ? `${s.employee.firstName ?? ''} ${s.employee.lastName ?? ''}`.trim() : '');
                return name.toLowerCase().includes(q) || (s.employee?.employeeId ?? '').toLowerCase().includes(q);
            });
        }
        return list;
    }, [settlements, search]);

    const selectedSettlement = useMemo(
        () => settlements.find(s => s.id === selectedId) ?? null,
        [settlements, selectedId]
    );

    const handleCompute = () => {
        if (!selectedSettlement) return;
        computeMutation.mutate(selectedSettlement.exitRequestId, {
            onSuccess: () => { toast.success("F&F computed"); refetch(); },
            onError: () => toast.error("Failed to compute F&F"),
        });
    };

    const handleApprove = () => {
        if (!selectedSettlement) return;
        approveMutation.mutate(selectedSettlement.id, {
            onSuccess: () => { toast.success("F&F approved"); refetch(); },
            onError: () => toast.error("Failed to approve F&F"),
        });
    };

    const handlePay = () => {
        if (!selectedSettlement) return;
        payMutation.mutate(selectedSettlement.id, {
            onSuccess: () => { toast.success("Payment recorded"); refetch(); setSelectedId(null); },
            onError: () => toast.error("Failed to record payment"),
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Actions */}
            <div className="flex items-center justify-between">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search settlements..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
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
                            <th className="text-right px-4 py-3 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Total F&F</th>
                            <th className="text-left px-4 py-3 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Status</th>
                            <th className="text-right px-4 py-3 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="border-b border-neutral-50 dark:border-neutral-800">
                                    {Array.from({ length: 4 }).map((_, j) => (
                                        <td key={j} className="px-4 py-3"><div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse w-24" /></td>
                                    ))}
                                </tr>
                            ))
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="text-center py-12">
                                    <Calculator className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
                                    <p className="text-neutral-500 dark:text-neutral-400 font-semibold">No F&F settlements found</p>
                                    <p className="text-neutral-400 dark:text-neutral-500 text-sm">Settlements appear here once exit requests are processed</p>
                                </td>
                            </tr>
                        ) : (
                            filtered.map((item) => (
                                <tr key={item.id} className="border-b border-neutral-50 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-xs font-bold text-primary-600 dark:text-primary-400">
                                                {(item.employeeName ?? `${item.employee?.firstName ?? ''} ${item.employee?.lastName ?? ''}`.trim())?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                                            </div>
                                            <span className="text-sm font-semibold text-neutral-900 dark:text-white">{item.employeeName ?? `${item.employee?.firstName ?? ''} ${item.employee?.lastName ?? ''}`.trim() || item.employeeId}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm font-bold text-primary-700 dark:text-primary-400">{formatCurrency(item.totalAmount)}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[item.status]}`}>{item.status}</span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button onClick={() => setSelectedId(item.id)}
                                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <FnFDetailModal
                settlement={selectedSettlement} onClose={() => setSelectedId(null)}
                onCompute={handleCompute} onApprove={handleApprove} onPay={handlePay}
                isComputing={computeMutation.isPending} isApproving={approveMutation.isPending} isPaying={payMutation.isPending}
            />
        </div>
    );
}
