import { useState } from "react";
import {
    Wallet,
    Search,
    Loader2,
    X,
    ChevronDown,
    ChevronRight,
    Plus,
    Minus,
    Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLeaveBalances, useLeaveTypes } from "@/features/company-admin/api/use-leave-queries";
import { useEmployees } from "@/features/company-admin/api/use-hr-queries";
import { useAdjustLeaveBalance } from "@/features/company-admin/api/use-leave-mutations";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Shared form atoms ── */

function FormField({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
}) {
    return (
        <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                {label}
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

function NumberField({
    label,
    value,
    onChange,
    placeholder,
    min,
}: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    placeholder?: string;
    min?: number;
}) {
    return (
        <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                {label}
            </label>
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                placeholder={placeholder}
                min={min}
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
            />
        </div>
    );
}

function SelectField({
    label,
    value,
    onChange,
    options,
    placeholder,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
}) {
    return (
        <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                {label}
            </label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
            >
                <option value="">{placeholder ?? "Select..."}</option>
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

/* ── Balance Cell ── */

function roundTo2(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

function formatLeaveNumber(value: number): string {
    if (!Number.isFinite(value)) return "0";
    return roundTo2(value).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });
}

function BalanceCell({ taken, entitlement }: { taken: number; entitlement: number }) {
    const ratio = entitlement > 0 ? taken / entitlement : 0;
    const colorCls =
        ratio >= 0.9
            ? "text-danger-600 dark:text-danger-400"
            : ratio >= 0.7
              ? "text-warning-600 dark:text-warning-400"
              : "text-success-600 dark:text-success-400";

    return (
        <span className={cn("font-semibold text-xs", colorCls)}>
            {formatLeaveNumber(taken)}/{formatLeaveNumber(entitlement)}
        </span>
    );
}

/* ── Detail Panel Row ── */

function DetailRow({ label, value }: { label: string; value: number | string }) {
    const displayValue = typeof value === "number" ? formatLeaveNumber(value) : value;
    return (
        <div className="flex items-center justify-between py-1.5">
            <span className="text-xs text-neutral-500 dark:text-neutral-400">{label}</span>
            <span className="text-xs font-bold text-primary-950 dark:text-white">{displayValue}</span>
        </div>
    );
}

/* ── Helpers ── */

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const y = currentYear - 2 + i;
    return { value: String(y), label: String(y) };
});

/* ── Screen ── */

export function LeaveBalanceScreen() {
    const [search, setSearch] = useState("");
    const [year, setYear] = useState(String(currentYear));
    const [employeeFilter, setEmployeeFilter] = useState("");
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [adjustModal, setAdjustModal] = useState(false);
    const [adjustForm, setAdjustForm] = useState({
        employeeId: "",
        leaveTypeId: "",
        action: "credit",
        days: 0,
        reason: "",
    });

    const { data, isLoading, isError } = useLeaveBalances({ year: Number(year), employeeId: employeeFilter || undefined });
    const leaveTypesQuery = useLeaveTypes();
    const employeesQuery = useEmployees();
    const adjustMutation = useAdjustLeaveBalance();

    const rawBalances: any[] = data?.data ?? [];
    const leaveTypes: any[] = leaveTypesQuery.data?.data ?? [];
    const employees: any[] = employeesQuery.data?.data ?? [];

    // Normalize API balance records: Prisma Decimal fields come as strings,
    // and there is no `entitlement` field — compute it as openingBalance + accrued.
    const balances: any[] = rawBalances.map((b: any) => ({
        ...b,
        openingBalance: Number(b.openingBalance ?? 0),
        accrued: Number(b.accrued ?? 0),
        taken: Number(b.taken ?? 0),
        adjusted: Number(b.adjusted ?? 0),
        balance: Number(b.balance ?? 0),
        entitlement: Number(b.openingBalance ?? 0) + Number(b.accrued ?? 0),
        // Flatten nested relations for display
        employeeId: b.employeeId,
        leaveTypeId: b.leaveTypeId ?? b.leaveType?.id,
    }));

    const employeeName = (id: string) => {
        // First check the balance records for nested employee data
        const balanceWithEmp = balances.find((b: any) => b.employeeId === id && b.employee);
        if (balanceWithEmp?.employee) {
            const emp = balanceWithEmp.employee;
            return [emp.firstName, emp.lastName].filter(Boolean).join(" ") || id;
        }
        const emp = employees.find((e: any) => e.id === id);
        if (!emp) return id;
        return [emp.firstName, emp.lastName].filter(Boolean).join(" ") || emp.fullName || emp.email || id;
    };

    // Group balances by employee
    const groupedByEmployee: Record<string, any[]> = {};
    balances.forEach((b: any) => {
        const key = b.employeeId;
        if (!groupedByEmployee[key]) groupedByEmployee[key] = [];
        groupedByEmployee[key].push(b);
    });

    // Filter by search
    const filteredEmployees = Object.keys(groupedByEmployee).filter((empId) => {
        if (!search) return true;
        const name = employeeName(empId).toLowerCase();
        return name.includes(search.toLowerCase());
    });

    // Get active leave type columns (take first 6 for display)
    const activeLeaveTypes = leaveTypes.filter((lt: any) => lt.status?.toLowerCase() === "active" || !lt.status).slice(0, 6);

    const getBalance = (empBalances: any[], leaveTypeId: string) => {
        const b = empBalances.find((bal: any) => bal.leaveTypeId === leaveTypeId);
        return { taken: b?.taken ?? 0, entitlement: b?.entitlement ?? 0 };
    };

    const getTotals = (empBalances: any[]) => {
        let totalTaken = 0;
        let totalEntitlement = 0;
        empBalances.forEach((b: any) => {
            totalTaken += b.taken ?? 0;
            totalEntitlement += b.entitlement ?? 0;
        });
        return { taken: roundTo2(totalTaken), entitlement: roundTo2(totalEntitlement) };
    };

    const openAdjust = (employeeId?: string) => {
        setAdjustForm({
            employeeId: employeeId ?? "",
            leaveTypeId: "",
            action: "credit",
            days: 0,
            reason: "",
        });
        setAdjustModal(true);
    };

    const handleAdjust = async () => {
        try {
            await adjustMutation.mutateAsync(adjustForm);
            showSuccess(
                "Balance Adjusted",
                `${adjustForm.days} day(s) ${adjustForm.action === "credit" ? "credited to" : "debited from"} ${employeeName(adjustForm.employeeId)}.`
            );
            setAdjustModal(false);
        } catch (err) {
            showApiError(err);
        }
    };

    const updateAdjustField = (key: string, value: any) => setAdjustForm((p) => ({ ...p, [key]: value }));

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Leave Balances</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">View and adjust employee leave balances</p>
                </div>
                <button
                    onClick={() => openAdjust()}
                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
                >
                    <Wallet className="w-5 h-5" />
                    Adjust Balance
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                    <input
                        type="text"
                        placeholder="Search employees..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                    />
                </div>
                <div className="flex items-center gap-4 overflow-x-auto pb-1 lg:pb-0">
                    <div className="flex items-center gap-2">
                        <Filter size={14} className="text-neutral-400 flex-shrink-0" />
                        <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 whitespace-nowrap">Employee:</span>
                        <select
                            value={employeeFilter}
                            onChange={(e) => setEmployeeFilter(e.target.value)}
                            className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-semibold text-neutral-700 dark:text-neutral-300 focus:outline-none max-w-[200px]"
                        >
                            <option value="">All Employees</option>
                            {employees.map((e: any) => (
                                <option key={e.id} value={e.id}>
                                    {[e.firstName, e.lastName].filter(Boolean).join(" ") || e.fullName || e.email}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 whitespace-nowrap">Year:</span>
                        <select
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-semibold text-neutral-700 dark:text-neutral-300 focus:outline-none"
                        >
                            {yearOptions.map((y) => (
                                <option key={y.value} value={y.value}>{y.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
                    Failed to load leave balances. Please try again.
                </div>
            )}

            {/* Data Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? (
                    <SkeletonTable rows={8} cols={8} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold w-8"></th>
                                    <th className="py-4 px-6 font-bold">Employee</th>
                                    {activeLeaveTypes.map((lt: any) => (
                                        <th key={lt.id} className="py-4 px-6 font-bold text-center">{lt.code || lt.name?.substring(0, 4)}</th>
                                    ))}
                                    <th className="py-4 px-6 font-bold text-center">Total</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filteredEmployees.map((empId) => {
                                    const empBalances = groupedByEmployee[empId];
                                    const totals = getTotals(empBalances);
                                    const isExpanded = expandedRow === empId;
                                    return (
                                        <tr key={empId} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                            <td className="py-4 px-3">
                                                <button
                                                    onClick={() => setExpandedRow(isExpanded ? null : empId)}
                                                    className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"
                                                >
                                                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                </button>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center shrink-0 text-xs font-bold text-accent-700 dark:text-accent-400">
                                                        {employeeName(empId).charAt(0)}
                                                    </div>
                                                    <span className="font-bold text-primary-950 dark:text-white">{employeeName(empId)}</span>
                                                </div>
                                            </td>
                                            {activeLeaveTypes.map((lt: any) => {
                                                const bal = getBalance(empBalances, lt.id);
                                                return (
                                                    <td key={lt.id} className="py-4 px-6 text-center">
                                                        <BalanceCell taken={bal.taken} entitlement={bal.entitlement} />
                                                    </td>
                                                );
                                            })}
                                            <td className="py-4 px-6 text-center">
                                                <BalanceCell taken={totals.taken} entitlement={totals.entitlement} />
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <button
                                                    onClick={() => openAdjust(empId)}
                                                    className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                                                    title="Adjust Balance"
                                                >
                                                    <Wallet size={15} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {/* Expanded Detail Rows */}
                                {filteredEmployees.map((empId) => {
                                    if (expandedRow !== empId) return null;
                                    const empBalances = groupedByEmployee[empId];
                                    return (
                                        <tr key={`${empId}-detail`} className="bg-neutral-50/80 dark:bg-neutral-800/30">
                                            <td colSpan={activeLeaveTypes.length + 4} className="px-6 py-4">
                                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                    {empBalances.map((bal: any) => {
                                                        const lt = leaveTypes.find((l: any) => l.id === bal.leaveTypeId);
                                                        const name = lt?.name ?? bal.leaveType?.name ?? bal.leaveTypeId;
                                                        return (
                                                            <div
                                                                key={bal.leaveTypeId}
                                                                className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-3"
                                                            >
                                                                <p className="text-xs font-bold text-primary-700 dark:text-primary-400 mb-2">{name}</p>
                                                                <DetailRow label="Opening" value={bal.openingBalance} />
                                                                <DetailRow label="Accrued" value={bal.accrued} />
                                                                <DetailRow label="Taken" value={bal.taken} />
                                                                <DetailRow label="Adjusted" value={bal.adjusted} />
                                                                <div className="border-t border-neutral-100 dark:border-neutral-800 mt-1 pt-1">
                                                                    <DetailRow label="Balance" value={bal.balance} />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                    {empBalances.length === 0 && (
                                                        <p className="text-sm text-neutral-400 italic col-span-full">No balance records for this employee.</p>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {filteredEmployees.length === 0 && !isLoading && (
                                    <tr>
                                        <td colSpan={activeLeaveTypes.length + 4}>
                                            <EmptyState icon="search" title="No balance records found" message="Try adjusting your search or filters." />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 text-xs text-neutral-500 dark:text-neutral-400">
                <span className="font-semibold">Cell format: taken / entitlement</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-success-500" /> &lt; 70% used</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-warning-500" /> 70-90% used</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-danger-500" /> &gt; 90% used</span>
            </div>

            {/* ── Adjust Balance Modal ── */}
            {adjustModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">Adjust Leave Balance</h2>
                            <button onClick={() => setAdjustModal(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <SelectField
                                label="Employee"
                                value={adjustForm.employeeId}
                                onChange={(v) => updateAdjustField("employeeId", v)}
                                options={employees.map((e: any) => ({
                                    value: e.id,
                                    label: [e.firstName, e.lastName].filter(Boolean).join(" ") || e.fullName || e.email,
                                }))}
                                placeholder="Select employee..."
                            />
                            <SelectField
                                label="Leave Type"
                                value={adjustForm.leaveTypeId}
                                onChange={(v) => updateAdjustField("leaveTypeId", v)}
                                options={leaveTypes.map((lt: any) => ({ value: lt.id, label: lt.name }))}
                                placeholder="Select leave type..."
                            />
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                                    Action
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => updateAdjustField("action", "credit")}
                                        className={cn(
                                            "flex-1 py-2.5 rounded-xl text-sm font-bold border flex items-center justify-center gap-2 transition-all",
                                            adjustForm.action === "credit"
                                                ? "bg-success-50 text-success-700 border-success-300 dark:bg-success-900/20 dark:text-success-400 dark:border-success-700"
                                                : "bg-neutral-50 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700 hover:border-neutral-300"
                                        )}
                                    >
                                        <Plus size={14} /> Credit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => updateAdjustField("action", "debit")}
                                        className={cn(
                                            "flex-1 py-2.5 rounded-xl text-sm font-bold border flex items-center justify-center gap-2 transition-all",
                                            adjustForm.action === "debit"
                                                ? "bg-danger-50 text-danger-700 border-danger-300 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-700"
                                                : "bg-neutral-50 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700 hover:border-neutral-300"
                                        )}
                                    >
                                        <Minus size={14} /> Debit
                                    </button>
                                </div>
                            </div>
                            <NumberField label="Days" value={adjustForm.days} onChange={(v) => updateAdjustField("days", v)} min={0} placeholder="0" />
                            <FormField label="Reason" value={adjustForm.reason} onChange={(v) => updateAdjustField("reason", v)} placeholder="Reason for adjustment..." />
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setAdjustModal(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleAdjust} disabled={adjustMutation.isPending} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {adjustMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                {adjustMutation.isPending ? "Adjusting..." : "Adjust Balance"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
