import { useState } from "react";
import {
    Plane,
    Plus,
    Loader2,
    X,
    Search,
    CheckCircle,
    ArrowRightLeft,
    IndianRupee,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTravelAdvances } from "@/features/company-admin/api/use-payroll-queries";
import {
    useCreateTravelAdvance,
    useSettleTravelAdvance,
} from "@/features/company-admin/api/use-payroll-mutations";
import { useEmployees } from "@/features/company-admin/api/use-hr-queries";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Atoms ── */

function FormField({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
    required,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
    required?: boolean;
}) {
    return (
        <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                {label} {required && <span className="text-danger-500">*</span>}
            </label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
            />
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const s = status?.toUpperCase();
    const cls =
        s === "PENDING"
            ? "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50"
            : s === "APPROVED"
            ? "bg-info-50 text-info-700 border-info-200 dark:bg-info-900/20 dark:text-info-400 dark:border-info-800/50"
            : s === "ACTIVE"
            ? "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50"
            : s === "CLOSED" || s === "SETTLED"
            ? "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50"
            : s === "REJECTED"
            ? "bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50"
            : "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700";
    return (
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", cls)}>
            {status}
        </span>
    );
}

function SettledBadge({ settled }: { settled: boolean }) {
    return (
        <span className={cn(
            "text-[10px] font-bold px-2 py-0.5 rounded-full border",
            settled
                ? "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50"
                : "bg-neutral-100 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700"
        )}>
            {settled ? "Settled" : "Unsettled"}
        </span>
    );
}

/* ── Constants ── */

const TRAVEL_MODES = [
    { value: "FLIGHT", label: "Flight" },
    { value: "TRAIN", label: "Train" },
    { value: "BUS", label: "Bus" },
    { value: "CAR", label: "Car" },
    { value: "OTHER", label: "Other" },
];

const EMPTY_FORM = {
    employeeId: "",
    amount: "",
    tripPurpose: "",
    tripDestination: "",
    travelDateFrom: "",
    travelDateTo: "",
    travelMode: "",
    accommodationEstimate: "",
    transportEstimate: "",
    mealsEstimate: "",
    otherEstimate: "",
};

/* ── Screen ── */

export function TravelAdvanceScreen() {
    const [search, setSearch] = useState("");
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [showBreakdown, setShowBreakdown] = useState(false);
    const [settleTarget, setSettleTarget] = useState<any>(null);
    const [settleExpenseClaimId, setSettleExpenseClaimId] = useState("");
    const [settlementResult, setSettlementResult] = useState<any>(null);

    const { data, isLoading, isError } = useTravelAdvances();
    const createMutation = useCreateTravelAdvance();
    const settleMutation = useSettleTravelAdvance();
    const { data: empData } = useEmployees();

    const employees: any[] = (empData as any)?.data ?? empData ?? [];
    const advances: any[] = (data as any)?.data ?? [];

    const employeeOptions = Array.isArray(employees) ? employees.map((e: any) => ({
        value: e.id,
        label: `${e.firstName ?? ""} ${e.lastName ?? ""}`.trim() || e.id,
        sublabel: e.employeeId ?? e.id,
    })) : [];

    const filtered = advances.filter((a: any) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
            a.employeeName?.toLowerCase().includes(s) ||
            a.tripPurpose?.toLowerCase().includes(s) ||
            a.status?.toLowerCase().includes(s)
        );
    });

    // Auto-calculate total from breakdown
    const breakdownTotal =
        (Number(form.accommodationEstimate) || 0) +
        (Number(form.transportEstimate) || 0) +
        (Number(form.mealsEstimate) || 0) +
        (Number(form.otherEstimate) || 0);

    const handleCreate = async () => {
        try {
            await createMutation.mutateAsync({
                employeeId: form.employeeId,
                amount: Number(form.amount),
                tripPurpose: form.tripPurpose,
                tripDestination: form.tripDestination || undefined,
                travelDateFrom: form.travelDateFrom || undefined,
                travelDateTo: form.travelDateTo || undefined,
                travelMode: form.travelMode || undefined,
                estimatedExpenses: showBreakdown ? {
                    accommodation: Number(form.accommodationEstimate) || 0,
                    transport: Number(form.transportEstimate) || 0,
                    meals: Number(form.mealsEstimate) || 0,
                    other: Number(form.otherEstimate) || 0,
                    total: breakdownTotal,
                } : undefined,
            });
            showSuccess("Advance Created", "Travel advance has been created.");
            setCreateModalOpen(false);
            setForm({ ...EMPTY_FORM });
            setShowBreakdown(false);
        } catch (err) {
            showApiError(err);
        }
    };

    const handleSettle = async () => {
        if (!settleTarget) return;
        try {
            const result = await settleMutation.mutateAsync({
                id: settleTarget.id,
                data: { expenseClaimId: settleExpenseClaimId || undefined },
            } as any);
            const settlement = (result as any)?.data ?? result;
            setSettlementResult({
                advanceAmount: settleTarget.amount,
                claimAmount: settlement?.claimAmount ?? settlement?.expenseAmount ?? 0,
                difference: settlement?.difference ?? settlement?.balance ?? 0,
                outcome: settlement?.outcome ?? settlement?.settlementType ?? "EXACT_MATCH",
            });
            showSuccess("Advance Settled", "Travel advance has been settled.");
        } catch (err) {
            showApiError(err);
        }
    };

    const getOutcomeText = (outcome: string, difference: number) => {
        const o = outcome?.toUpperCase();
        if (o === "EMPLOYEE_OWES" || difference > 0)
            return { text: `Employee Owes ₹${Math.abs(difference).toLocaleString("en-IN")}`, color: "text-warning-700 dark:text-warning-400" };
        if (o === "COMPANY_OWES" || difference < 0)
            return { text: `Company Owes ₹${Math.abs(difference).toLocaleString("en-IN")}`, color: "text-info-700 dark:text-info-400" };
        return { text: "Exact Match", color: "text-success-700 dark:text-success-400" };
    };

    const updateField = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Travel Advances</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Manage employee travel advance requests and settlements</p>
                </div>
                <button
                    onClick={() => { setForm({ ...EMPTY_FORM }); setShowBreakdown(false); setCreateModalOpen(true); }}
                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
                >
                    <Plus className="w-5 h-5" />
                    New Advance
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                    <input
                        type="text"
                        placeholder="Search advances..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                    />
                </div>
            </div>

            {isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
                    Failed to load travel advances. Please try again.
                </div>
            )}

            {/* Data Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? (
                    <SkeletonTable rows={6} cols={6} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Employee</th>
                                    <th className="py-4 px-6 font-bold text-right">Amount</th>
                                    <th className="py-4 px-6 font-bold">Trip Purpose</th>
                                    <th className="py-4 px-6 font-bold text-center">Status</th>
                                    <th className="py-4 px-6 font-bold text-center">Settled</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.map((a: any) => (
                                    <tr
                                        key={a.id}
                                        className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors"
                                    >
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                                                    <Plane className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                                </div>
                                                <span className="font-bold text-primary-950 dark:text-white">{a.employeeName ?? a.employeeId ?? "—"}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-right font-bold text-primary-950 dark:text-white font-mono">{"₹"}{Number(a.amount ?? 0).toLocaleString("en-IN")}</td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">{a.tripPurpose || "—"}</td>
                                        <td className="py-4 px-6 text-center"><StatusBadge status={a.status ?? "PENDING"} /></td>
                                        <td className="py-4 px-6 text-center"><SettledBadge settled={a.isSettled ?? a.settled ?? false} /></td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {!(a.isSettled ?? a.settled) && (a.status === "ACTIVE" || a.status === "APPROVED") && (
                                                    <button
                                                        onClick={() => { setSettleTarget(a); setSettleExpenseClaimId(""); setSettlementResult(null); }}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-accent-700 dark:text-accent-400 bg-accent-50 dark:bg-accent-900/20 hover:bg-accent-100 dark:hover:bg-accent-900/40 transition-colors"
                                                    >
                                                        <ArrowRightLeft size={13} />
                                                        Settle
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && !isLoading && (
                                    <tr>
                                        <td colSpan={6}>
                                            <EmptyState icon="list" title="No advances found" message="Create a travel advance to get started." action={{ label: "New Advance", onClick: () => { setForm({ ...EMPTY_FORM }); setCreateModalOpen(true); } }} />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Create Modal ── */}
            {createModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">New Travel Advance</h2>
                            <button onClick={() => setCreateModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <SearchableSelect
                                label="Employee"
                                value={form.employeeId}
                                onChange={(v) => updateField("employeeId", v)}
                                options={employeeOptions}
                                placeholder="Search employee..."
                                required
                            />
                            <FormField label="Trip Purpose" value={form.tripPurpose} onChange={(v) => updateField("tripPurpose", v)} placeholder="e.g. Client meeting in Mumbai" required />
                            <FormField label="Trip Destination" value={form.tripDestination} onChange={(v) => updateField("tripDestination", v)} placeholder="e.g. Mumbai, Maharashtra" />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="Travel From" value={form.travelDateFrom} onChange={(v) => updateField("travelDateFrom", v)} type="date" />
                                <FormField label="Travel To" value={form.travelDateTo} onChange={(v) => updateField("travelDateTo", v)} type="date" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Travel Mode</label>
                                    <select
                                        value={form.travelMode}
                                        onChange={(e) => updateField("travelMode", e.target.value)}
                                        className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                                    >
                                        <option value="">Select mode...</option>
                                        {TRAVEL_MODES.map((m) => (
                                            <option key={m.value} value={m.value}>{m.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <FormField label={`Amount (₹)`} value={form.amount} onChange={(v) => updateField("amount", v)} placeholder="10000" type="number" required />
                            </div>

                            {/* Estimated Expenses Breakdown */}
                            <div className="border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden">
                                <button
                                    onClick={() => setShowBreakdown(!showBreakdown)}
                                    className="w-full flex items-center justify-between px-4 py-3 bg-neutral-50 dark:bg-neutral-800 text-sm font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                                >
                                    <span>Estimated Expenses Breakdown (optional)</span>
                                    {showBreakdown ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>
                                {showBreakdown && (
                                    <div className="p-4 space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <FormField label="Accommodation" value={form.accommodationEstimate} onChange={(v) => updateField("accommodationEstimate", v)} placeholder="0" type="number" />
                                            <FormField label="Transport" value={form.transportEstimate} onChange={(v) => updateField("transportEstimate", v)} placeholder="0" type="number" />
                                            <FormField label="Meals" value={form.mealsEstimate} onChange={(v) => updateField("mealsEstimate", v)} placeholder="0" type="number" />
                                            <FormField label="Other" value={form.otherEstimate} onChange={(v) => updateField("otherEstimate", v)} placeholder="0" type="number" />
                                        </div>
                                        <div className="flex justify-between items-center pt-2 border-t border-neutral-200 dark:border-neutral-700">
                                            <span className="text-xs font-semibold text-neutral-500 uppercase">Estimated Total</span>
                                            <span className="text-sm font-bold text-primary-700 dark:text-primary-400">{"₹"}{breakdownTotal.toLocaleString("en-IN")}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setCreateModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleCreate} disabled={createMutation.isPending || !form.employeeId || !form.amount || !form.tripPurpose} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {createMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                {createMutation.isPending ? "Creating..." : "Create Advance"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Settle Modal ── */}
            {settleTarget && !settlementResult && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">Settle Advance</h2>
                            <button onClick={() => setSettleTarget(null)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-4">
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Employee</p>
                                <p className="text-sm font-bold text-primary-950 dark:text-white">{settleTarget.employeeName ?? settleTarget.employeeId}</p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-3 mb-1">Advance Amount</p>
                                <p className="text-lg font-bold text-primary-600 dark:text-primary-400">{"₹"}{Number(settleTarget.amount ?? 0).toLocaleString("en-IN")}</p>
                                {settleTarget.tripPurpose && (
                                    <>
                                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-3 mb-1">Trip Purpose</p>
                                        <p className="text-sm text-primary-950 dark:text-white">{settleTarget.tripPurpose}</p>
                                    </>
                                )}
                            </div>
                            <FormField label="Expense Claim ID (optional)" value={settleExpenseClaimId} onChange={setSettleExpenseClaimId} placeholder="Link to an expense claim" />
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setSettleTarget(null)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleSettle} disabled={settleMutation.isPending} className="flex-1 py-2.5 rounded-xl bg-accent-600 hover:bg-accent-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {settleMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                {settleMutation.isPending ? "Settling..." : "Settle"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Settlement Result ── */}
            {settlementResult && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200 text-center">
                        <div className="w-14 h-14 rounded-full bg-success-50 dark:bg-success-900/30 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-7 h-7 text-success-600 dark:text-success-400" />
                        </div>
                        <h2 className="text-lg font-bold text-primary-950 dark:text-white mb-4">Settlement Summary</h2>
                        <div className="space-y-3 text-left bg-neutral-50 dark:bg-neutral-800 rounded-xl p-4 mb-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-neutral-500 dark:text-neutral-400">Original Advance</span>
                                <span className="font-bold text-primary-950 dark:text-white">{"₹"}{Number(settlementResult.advanceAmount ?? 0).toLocaleString("en-IN")}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-neutral-500 dark:text-neutral-400">Expense Claim</span>
                                <span className="font-bold text-primary-950 dark:text-white">{"₹"}{Number(settlementResult.claimAmount ?? 0).toLocaleString("en-IN")}</span>
                            </div>
                            <div className="border-t border-neutral-200 dark:border-neutral-700 pt-3 flex justify-between text-sm">
                                <span className="text-neutral-500 dark:text-neutral-400">Difference</span>
                                <span className="font-bold text-primary-950 dark:text-white">{"₹"}{Math.abs(settlementResult.difference ?? 0).toLocaleString("en-IN")}</span>
                            </div>
                        </div>
                        <p className={cn("text-lg font-bold mb-4", getOutcomeText(settlementResult.outcome, settlementResult.difference).color)}>
                            {getOutcomeText(settlementResult.outcome, settlementResult.difference).text}
                        </p>
                        <button onClick={() => { setSettlementResult(null); setSettleTarget(null); }} className="w-full py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors">Done</button>
                    </div>
                </div>
            )}
        </div>
    );
}
