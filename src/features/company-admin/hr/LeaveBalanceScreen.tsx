import { useState, useMemo, useRef } from "react";
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
    Pencil,
    Clock,
    PlayCircle,
    RefreshCw,
    ArrowRightLeft,
    Upload,
    Download,
    Banknote,
    CheckCircle2,
    XCircle,
    ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { useLeaveBalances, useLeaveTypes, useBalanceTransactions } from "@/features/company-admin/api/use-leave-queries";
import { useEmployees } from "@/features/company-admin/api/use-hr-queries";
import {
    useAdjustLeaveBalance,
    useUpdateBalance,
    useEncashBalance,
    useRunAccrual,
    useRunCarryForward,
    useInitializeLeaveBalances,
    useValidateBalanceUpload,
    useConfirmBalanceImport,
} from "@/features/company-admin/api/use-leave-mutations";
import { leaveApi } from "@/lib/api/leave";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";
import { useCompanyFormatter } from "@/hooks/useCompanyFormatter";

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
    max,
    step,
}: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    placeholder?: string;
    min?: number;
    max?: number;
    step?: number;
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
                max={max}
                step={step}
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

function TextareaField({
    label,
    value,
    onChange,
    placeholder,
    rows = 3,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    rows?: number;
}) {
    return (
        <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                {label}
            </label>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={rows}
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none"
            />
        </div>
    );
}

/* ── Modal Shell ── */

function ModalShell({
    open,
    onClose,
    title,
    children,
    maxWidth = "max-w-md",
}: {
    open: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    maxWidth?: string;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className={cn("bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]", maxWidth)}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                    <h2 className="text-lg font-bold text-primary-950 dark:text-white">{title}</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                        <X size={18} />
                    </button>
                </div>
                {children}
            </div>
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

/* ── Transaction type color helper ── */

function txnTypeColor(type: string): string {
    switch (type) {
        case "ACCRUAL": return "text-success-600 bg-success-50 dark:text-success-400 dark:bg-success-900/20";
        case "ADJUSTMENT": return "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20";
        case "LEAVE_TAKEN": return "text-danger-600 bg-danger-50 dark:text-danger-400 dark:bg-danger-900/20";
        case "CARRY_FORWARD": return "text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20";
        case "ENCASHMENT": return "text-violet-600 bg-violet-50 dark:text-violet-400 dark:bg-violet-900/20";
        case "INITIALIZED": return "text-primary-600 bg-primary-50 dark:text-primary-400 dark:bg-primary-900/20";
        default: return "text-neutral-600 bg-neutral-50 dark:text-neutral-400 dark:bg-neutral-800";
    }
}

/* ── Helpers ── */

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const y = currentYear - 2 + i;
    return { value: String(y), label: String(y) };
});

const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: new Date(2000, i).toLocaleString(undefined, { month: "long" }),
}));

/* ── Screen ── */

export function LeaveBalanceScreen() {
    const fmt = useCompanyFormatter();

    const [search, setSearch] = useState("");
    const [year, setYear] = useState(String(currentYear));
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    // Adjust modal state
    const [adjustModal, setAdjustModal] = useState(false);
    const [adjustForm, setAdjustForm] = useState({
        employeeId: "",
        leaveTypeId: "",
        action: "credit",
        days: 0,
        reason: "",
    });

    // Edit balance modal state
    const [editModal, setEditModal] = useState(false);
    const [editForm, setEditForm] = useState({
        balanceId: "",
        openingBalance: 0,
        accrued: 0,
        taken: 0,
        adjusted: 0,
        reason: "",
    });

    // Initialize modal state
    const [initializeModal, setInitializeModal] = useState(false);
    const [initForm, setInitForm] = useState({ employeeId: "", year: currentYear });

    // Accrual modal state
    const [accrualModal, setAccrualModal] = useState(false);
    const [accrualForm, setAccrualForm] = useState({ month: new Date().getMonth() + 1, year: currentYear });
    const [accrualResult, setAccrualResult] = useState<any>(null);

    // Carry forward modal state
    const [carryForwardModal, setCarryForwardModal] = useState(false);
    const [cfForm, setCfForm] = useState({ fromYear: currentYear - 1, toYear: currentYear });

    // Import modal state
    const [importModal, setImportModal] = useState(false);
    const [importStep, setImportStep] = useState(1);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [validationResult, setValidationResult] = useState<any>(null);
    const [importResult, setImportResult] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Encash modal state
    const [encashModal, setEncashModal] = useState(false);
    const [encashForm, setEncashForm] = useState({
        balanceId: "",
        employeeId: "",
        leaveTypeId: "",
        days: 0,
        reason: "",
        maxDays: 0,
    });

    // Transaction history modal state
    const [txnModal, setTxnModal] = useState(false);
    const [txnBalanceId, setTxnBalanceId] = useState("");
    const [txnPage, setTxnPage] = useState(1);

    // ── Queries & Mutations ──

    const { data, isLoading, isError } = useLeaveBalances({ year: Number(year), limit: 100 });
    const leaveTypesQuery = useLeaveTypes();
    const employeesQuery = useEmployees({ limit: 100 });
    const adjustMutation = useAdjustLeaveBalance();
    const updateBalanceMutation = useUpdateBalance();
    const encashMutation = useEncashBalance();
    const accrualMutation = useRunAccrual();
    const carryForwardMutation = useRunCarryForward();
    const initializeMutation = useInitializeLeaveBalances();
    const validateUploadMutation = useValidateBalanceUpload();
    const confirmImportMutation = useConfirmBalanceImport();
    const txnQuery = useBalanceTransactions(txnBalanceId, { page: txnPage, limit: 15 });

    const rawBalances: any[] = data?.data ?? [];
    const leaveTypes: any[] = leaveTypesQuery.data?.data ?? [];
    const employees: any[] = employeesQuery.data?.data ?? [];

    const employeeOptions = useMemo(() =>
        employees.map((e: any) => ({
            value: e.id,
            label: [e.firstName, e.lastName].filter(Boolean).join(" ") || e.fullName || e.email || e.id,
            sublabel: [e.employeeId, e.department?.name].filter(Boolean).join(" · "),
        })),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [employees]
    );

    const leaveTypeOptions = useMemo(() =>
        leaveTypes.map((lt: any) => ({ value: lt.id, label: lt.name })),
        [leaveTypes]
    );

    // Normalize API balance records
    const balances: any[] = rawBalances.map((b: any) => ({
        ...b,
        openingBalance: Number(b.openingBalance ?? 0),
        accrued: Number(b.accrued ?? 0),
        taken: Number(b.taken ?? 0),
        adjusted: Number(b.adjusted ?? 0),
        balance: Number(b.balance ?? 0),
        entitlement: Number(b.openingBalance ?? 0) + Number(b.accrued ?? 0),
        employeeId: b.employeeId,
        leaveTypeId: b.leaveTypeId ?? b.leaveType?.id,
    }));

    const employeeName = (id: string) => {
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

    // ── Adjust Balance ──

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
            await adjustMutation.mutateAsync({ ...adjustForm, year: Number(year) });
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

    // ── Edit Balance ──

    const openEditBalance = (bal: any) => {
        setEditForm({
            balanceId: bal.id,
            openingBalance: bal.openingBalance,
            accrued: bal.accrued,
            taken: bal.taken,
            adjusted: bal.adjusted,
            reason: "",
        });
        setEditModal(true);
    };

    const editComputedBalance = roundTo2(editForm.openingBalance + editForm.accrued - editForm.taken + editForm.adjusted);

    const handleEditBalance = async () => {
        try {
            await updateBalanceMutation.mutateAsync({
                id: editForm.balanceId,
                data: {
                    openingBalance: editForm.openingBalance,
                    accrued: editForm.accrued,
                    taken: editForm.taken,
                    adjusted: editForm.adjusted,
                    reason: editForm.reason,
                },
            });
            showSuccess("Balance Updated", "Leave balance has been updated.");
            setEditModal(false);
        } catch (err) {
            showApiError(err);
        }
    };

    // ── Initialize Balances ──

    const handleInitialize = async () => {
        try {
            await initializeMutation.mutateAsync({ employeeId: initForm.employeeId, year: initForm.year });
            showSuccess("Balances Initialized", "Leave balances have been initialized successfully.");
            setInitializeModal(false);
        } catch (err) {
            showApiError(err);
        }
    };

    // ── Accrual ──

    const handleAccrual = async () => {
        try {
            const result = await accrualMutation.mutateAsync({ month: accrualForm.month, year: accrualForm.year });
            setAccrualResult(result);
            showSuccess("Accrual Complete", "Leave accrual has been processed successfully.");
        } catch (err) {
            showApiError(err);
        }
    };

    // ── Carry Forward ──

    const handleCarryForward = async () => {
        try {
            await carryForwardMutation.mutateAsync({ fromYear: cfForm.fromYear, toYear: cfForm.toYear });
            showSuccess("Carry Forward Complete", "Leave balances have been carried forward successfully.");
            setCarryForwardModal(false);
        } catch (err) {
            showApiError(err);
        }
    };

    // ── Import ──

    const handleDownloadTemplate = async () => {
        try {
            const blob = await leaveApi.downloadBalanceTemplate();
            const url = window.URL.createObjectURL(new Blob([blob]));
            const a = document.createElement("a");
            a.href = url;
            a.download = "leave-balance-template.xlsx";
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            showApiError(err);
        }
    };

    const handleFileUpload = async () => {
        if (!importFile) return;
        try {
            const result = await validateUploadMutation.mutateAsync(importFile);
            setValidationResult(result?.data ?? result);
            setImportStep(2);
        } catch (err) {
            showApiError(err);
        }
    };

    const handleConfirmImport = async () => {
        if (!validationResult?.rows) return;
        const validRows = validationResult.rows.filter((r: any) => r.valid === true);
        if (validRows.length === 0) return;
        try {
            const result = await confirmImportMutation.mutateAsync(validRows);
            setImportResult(result?.data ?? result);
            setImportStep(3);
            showSuccess("Import Complete", "Leave balances have been imported successfully.");
        } catch (err) {
            showApiError(err);
        }
    };

    const resetImportModal = () => {
        setImportModal(false);
        setImportStep(1);
        setImportFile(null);
        setValidationResult(null);
        setImportResult(null);
    };

    // ── Encash ──

    const openEncash = (bal: any) => {
        const lt = leaveTypes.find((l: any) => l.id === bal.leaveTypeId);
        setEncashForm({
            balanceId: bal.id,
            employeeId: bal.employeeId,
            leaveTypeId: bal.leaveTypeId,
            days: 0,
            reason: "",
            maxDays: lt?.maxEncashmentDays ?? bal.balance ?? 0,
        });
        setEncashModal(true);
    };

    const handleEncash = async () => {
        try {
            await encashMutation.mutateAsync({
                employeeId: encashForm.employeeId,
                leaveTypeId: encashForm.leaveTypeId,
                year: Number(year),
                days: encashForm.days,
                reason: encashForm.reason,
            });
            showSuccess("Leave Encashed", `${encashForm.days} day(s) have been encashed.`);
            setEncashModal(false);
        } catch (err) {
            showApiError(err);
        }
    };

    // ── Transaction History ──

    const openTransactions = (balanceId: string) => {
        setTxnBalanceId(balanceId);
        setTxnPage(1);
        setTxnModal(true);
    };

    const transactions: any[] = txnQuery.data?.data ?? [];
    const txnMeta = txnQuery.data?.meta;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Leave Balances</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">View and adjust employee leave balances</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => openAdjust()}
                        className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
                    >
                        <Wallet className="w-4 h-4" />
                        Adjust Balance
                    </button>
                    <button
                        onClick={() => { setInitForm({ employeeId: "", year: currentYear }); setInitializeModal(true); }}
                        className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-bold text-sm transition-all"
                    >
                        <PlayCircle className="w-4 h-4" />
                        Initialize Balances
                    </button>
                    <button
                        onClick={() => { setAccrualForm({ month: new Date().getMonth() + 1, year: currentYear }); setAccrualResult(null); setAccrualModal(true); }}
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold text-sm transition-all"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Run Accrual
                    </button>
                    <button
                        onClick={() => { setCfForm({ fromYear: currentYear - 1, toYear: currentYear }); setCarryForwardModal(true); }}
                        className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl font-bold text-sm transition-all"
                    >
                        <ArrowRightLeft className="w-4 h-4" />
                        Carry Forward
                    </button>
                    <button
                        onClick={() => { resetImportModal(); setImportModal(true); }}
                        className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl font-bold text-sm transition-all"
                    >
                        <Upload className="w-4 h-4" />
                        Import Balances
                    </button>
                </div>
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
                                                        const canEncash = lt?.encashmentAllowed === true;
                                                        return (
                                                            <div
                                                                key={bal.leaveTypeId}
                                                                className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-3"
                                                            >
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <p className="text-xs font-bold text-primary-700 dark:text-primary-400">{name}</p>
                                                                    <div className="flex items-center gap-1">
                                                                        <button
                                                                            onClick={() => openEditBalance(bal)}
                                                                            className="p-1 rounded-md text-neutral-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:text-primary-400 dark:hover:bg-primary-900/30 transition-colors"
                                                                            title="Edit Balance"
                                                                        >
                                                                            <Pencil size={12} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => openTransactions(bal.id)}
                                                                            className="p-1 rounded-md text-neutral-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/30 transition-colors"
                                                                            title="Transaction History"
                                                                        >
                                                                            <Clock size={12} />
                                                                        </button>
                                                                        {canEncash && (
                                                                            <button
                                                                                onClick={() => openEncash(bal)}
                                                                                className="p-1 rounded-md text-neutral-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:text-violet-400 dark:hover:bg-violet-900/30 transition-colors"
                                                                                title="Encash"
                                                                            >
                                                                                <Banknote size={12} />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
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
                            <SearchableSelect
                                label="Employee"
                                value={adjustForm.employeeId}
                                onChange={(v) => updateAdjustField("employeeId", v)}
                                options={employeeOptions}
                                placeholder="Select employee..."
                            />
                            <SearchableSelect
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

            {/* ── Edit Balance Modal ── */}
            <ModalShell open={editModal} onClose={() => setEditModal(false)} title="Edit Leave Balance">
                <div className="p-6 overflow-y-auto flex-1 space-y-4">
                    <NumberField label="Opening Balance" value={editForm.openingBalance} onChange={(v) => setEditForm((p) => ({ ...p, openingBalance: v }))} min={0} step={0.5} />
                    <NumberField label="Accrued" value={editForm.accrued} onChange={(v) => setEditForm((p) => ({ ...p, accrued: v }))} min={0} step={0.5} />
                    <NumberField label="Taken" value={editForm.taken} onChange={(v) => setEditForm((p) => ({ ...p, taken: v }))} min={0} step={0.5} />
                    <NumberField label="Adjusted" value={editForm.adjusted} onChange={(v) => setEditForm((p) => ({ ...p, adjusted: v }))} step={0.5} />
                    <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-3 border border-primary-100 dark:border-primary-800/50">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider">Computed Balance</span>
                            <span className="text-lg font-bold text-primary-700 dark:text-primary-300">{formatLeaveNumber(editComputedBalance)}</span>
                        </div>
                        <p className="text-xs text-primary-500 dark:text-primary-500 mt-1">Opening + Accrued - Taken + Adjusted</p>
                    </div>
                    <TextareaField label="Reason *" value={editForm.reason} onChange={(v) => setEditForm((p) => ({ ...p, reason: v }))} placeholder="Reason for editing balance..." />
                </div>
                <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                    <button onClick={() => setEditModal(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                    <button onClick={handleEditBalance} disabled={updateBalanceMutation.isPending || !editForm.reason.trim()} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                        {updateBalanceMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                        {updateBalanceMutation.isPending ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </ModalShell>

            {/* ── Initialize Balances Modal ── */}
            <ModalShell open={initializeModal} onClose={() => setInitializeModal(false)} title="Initialize Leave Balances">
                <div className="p-6 overflow-y-auto flex-1 space-y-4">
                    <SearchableSelect
                        label="Employee"
                        value={initForm.employeeId}
                        onChange={(v) => setInitForm((p) => ({ ...p, employeeId: v }))}
                        options={employeeOptions}
                        placeholder="Select employee..."
                    />
                    <NumberField label="Year" value={initForm.year} onChange={(v) => setInitForm((p) => ({ ...p, year: v }))} min={2020} max={2099} />
                </div>
                <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                    <button onClick={() => setInitializeModal(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                    <button onClick={handleInitialize} disabled={initializeMutation.isPending || !initForm.employeeId} className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                        {initializeMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                        {initializeMutation.isPending ? "Initializing..." : "Initialize"}
                    </button>
                </div>
            </ModalShell>

            {/* ── Run Accrual Modal ── */}
            <ModalShell open={accrualModal} onClose={() => setAccrualModal(false)} title="Run Leave Accrual">
                <div className="p-6 overflow-y-auto flex-1 space-y-4">
                    <SelectField
                        label="Month"
                        value={String(accrualForm.month)}
                        onChange={(v) => setAccrualForm((p) => ({ ...p, month: Number(v) }))}
                        options={monthOptions}
                        placeholder="Select month..."
                    />
                    <NumberField label="Year" value={accrualForm.year} onChange={(v) => setAccrualForm((p) => ({ ...p, year: v }))} min={2020} max={2099} />
                    <div className="bg-warning-50 dark:bg-warning-900/20 rounded-xl p-3 border border-warning-200 dark:border-warning-800/50">
                        <p className="text-xs text-warning-700 dark:text-warning-400 font-medium">
                            This will accrue leave balances for all employees based on configured leave types.
                        </p>
                    </div>
                    {accrualResult && (
                        <div className="bg-success-50 dark:bg-success-900/20 rounded-xl p-3 border border-success-200 dark:border-success-800/50">
                            <p className="text-xs font-bold text-success-700 dark:text-success-400 mb-1">Accrual Complete</p>
                            <p className="text-xs text-success-600 dark:text-success-400">
                                {accrualResult?.data?.employeesProcessed ?? accrualResult?.employeesProcessed ?? "All"} employee(s) processed.
                            </p>
                        </div>
                    )}
                </div>
                <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                    <button onClick={() => setAccrualModal(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Close</button>
                    <button onClick={handleAccrual} disabled={accrualMutation.isPending} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                        {accrualMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                        {accrualMutation.isPending ? "Running..." : "Run Accrual"}
                    </button>
                </div>
            </ModalShell>

            {/* ── Carry Forward Modal ── */}
            <ModalShell open={carryForwardModal} onClose={() => setCarryForwardModal(false)} title="Carry Forward Leave Balances">
                <div className="p-6 overflow-y-auto flex-1 space-y-4">
                    <NumberField label="From Year" value={cfForm.fromYear} onChange={(v) => setCfForm((p) => ({ ...p, fromYear: v }))} min={2020} max={2099} />
                    <NumberField label="To Year" value={cfForm.toYear} onChange={(v) => setCfForm((p) => ({ ...p, toYear: v }))} min={2020} max={2099} />
                    <div className="bg-warning-50 dark:bg-warning-900/20 rounded-xl p-3 border border-warning-200 dark:border-warning-800/50">
                        <p className="text-xs text-warning-700 dark:text-warning-400 font-medium">
                            This will carry forward unused leave balances from {cfForm.fromYear} to {cfForm.toYear} based on configured carry forward limits per leave type.
                        </p>
                    </div>
                </div>
                <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                    <button onClick={() => setCarryForwardModal(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                    <button onClick={handleCarryForward} disabled={carryForwardMutation.isPending} className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                        {carryForwardMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                        {carryForwardMutation.isPending ? "Processing..." : "Carry Forward"}
                    </button>
                </div>
            </ModalShell>

            {/* ── Import Balances Modal (3-step) ── */}
            <ModalShell open={importModal} onClose={resetImportModal} title="Import Leave Balances" maxWidth="max-w-2xl">
                <div className="p-6 overflow-y-auto flex-1 space-y-4">
                    {/* Step indicator */}
                    <div className="flex items-center gap-2 mb-2">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className="flex items-center gap-2">
                                <div className={cn(
                                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                                    importStep >= s
                                        ? "bg-violet-600 text-white"
                                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400"
                                )}>
                                    {s}
                                </div>
                                {s < 3 && <div className={cn("w-8 h-0.5", importStep > s ? "bg-violet-600" : "bg-neutral-200 dark:bg-neutral-700")} />}
                            </div>
                        ))}
                        <span className="text-xs text-neutral-500 dark:text-neutral-400 ml-2">
                            {importStep === 1 ? "Upload" : importStep === 2 ? "Validate" : "Results"}
                        </span>
                    </div>

                    {importStep === 1 && (
                        <>
                            <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700">
                                <p className="text-sm text-neutral-700 dark:text-neutral-300 font-medium mb-3">Step 1: Download the template, fill it in, and upload.</p>
                                <button
                                    onClick={handleDownloadTemplate}
                                    className="inline-flex items-center gap-2 bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-neutral-700 dark:text-neutral-200 px-4 py-2 rounded-xl text-sm font-bold hover:bg-neutral-50 dark:hover:bg-neutral-600 transition-colors"
                                >
                                    <Download size={14} />
                                    Download Template
                                </button>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                                    Upload File (.xlsx)
                                </label>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx"
                                    onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-700 dark:text-neutral-300 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-violet-100 file:text-violet-700 dark:file:bg-violet-900/30 dark:file:text-violet-400"
                                />
                            </div>
                        </>
                    )}

                    {importStep === 2 && validationResult && (
                        <>
                            <div className="flex items-center gap-4 text-sm">
                                <span className="flex items-center gap-1.5 text-success-600 dark:text-success-400 font-medium">
                                    <CheckCircle2 size={14} /> {validationResult.rows?.filter((r: any) => r.valid === true).length ?? 0} valid
                                </span>
                                <span className="flex items-center gap-1.5 text-danger-600 dark:text-danger-400 font-medium">
                                    <XCircle size={14} /> {validationResult.rows?.filter((r: any) => !r.valid).length ?? 0} invalid
                                </span>
                            </div>
                            <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-700">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="bg-neutral-50 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                            <th className="py-2.5 px-3 font-bold">Row</th>
                                            <th className="py-2.5 px-3 font-bold">Employee</th>
                                            <th className="py-2.5 px-3 font-bold">Leave Type</th>
                                            <th className="py-2.5 px-3 font-bold">Status</th>
                                            <th className="py-2.5 px-3 font-bold">Errors</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(validationResult.rows ?? []).map((row: any, idx: number) => (
                                            <tr key={idx} className={cn(
                                                "border-t border-neutral-100 dark:border-neutral-800",
                                                row.valid
                                                    ? "bg-success-50/50 dark:bg-success-900/10"
                                                    : "bg-danger-50/50 dark:bg-danger-900/10"
                                            )}>
                                                <td className="py-2 px-3 font-mono">{row.rowNumber ?? idx + 1}</td>
                                                <td className="py-2 px-3">{row.employee ?? row.employeeName ?? "-"}</td>
                                                <td className="py-2 px-3">{row.leaveType ?? row.leaveTypeName ?? "-"}</td>
                                                <td className="py-2 px-3">
                                                    <span className={cn(
                                                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold",
                                                        row.valid
                                                            ? "bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400"
                                                            : "bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400"
                                                    )}>
                                                        {row.valid ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                                                        {row.valid ? "valid" : "invalid"}
                                                    </span>
                                                </td>
                                                <td className="py-2 px-3 text-danger-600 dark:text-danger-400 max-w-[200px] truncate">
                                                    {row.errors?.join(", ") ?? "-"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {importStep === 3 && importResult && (
                        <div className="space-y-3">
                            <div className="bg-success-50 dark:bg-success-900/20 rounded-xl p-4 border border-success-200 dark:border-success-800/50">
                                <p className="text-sm font-bold text-success-700 dark:text-success-400 mb-1">Import Complete</p>
                                <div className="flex items-center gap-4 text-xs text-success-600 dark:text-success-400">
                                    <span>Success: {importResult.successCount ?? importResult.imported ?? 0}</span>
                                    <span>Failed: {importResult.failureCount ?? importResult.failed ?? 0}</span>
                                </div>
                            </div>
                            {importResult.results && (
                                <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-700 max-h-60">
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr className="bg-neutral-50 dark:bg-neutral-800 text-neutral-500 uppercase tracking-wider">
                                                <th className="py-2 px-3 font-bold">Row</th>
                                                <th className="py-2 px-3 font-bold">Status</th>
                                                <th className="py-2 px-3 font-bold">Message</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {importResult.results.map((r: any, idx: number) => (
                                                <tr key={idx} className="border-t border-neutral-100 dark:border-neutral-800">
                                                    <td className="py-2 px-3 font-mono">{r.rowNumber ?? idx + 1}</td>
                                                    <td className="py-2 px-3">
                                                        {r.success ? (
                                                            <CheckCircle2 size={14} className="text-success-500" />
                                                        ) : (
                                                            <XCircle size={14} className="text-danger-500" />
                                                        )}
                                                    </td>
                                                    <td className="py-2 px-3 text-neutral-600 dark:text-neutral-400">{r.message ?? r.error ?? "-"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                    <button onClick={resetImportModal} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                        {importStep === 3 ? "Done" : "Cancel"}
                    </button>
                    {importStep === 1 && (
                        <button
                            onClick={handleFileUpload}
                            disabled={!importFile || validateUploadMutation.isPending}
                            className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {validateUploadMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                            {validateUploadMutation.isPending ? "Validating..." : "Upload & Validate"}
                        </button>
                    )}
                    {importStep === 2 && (
                        <button
                            onClick={handleConfirmImport}
                            disabled={confirmImportMutation.isPending || (validationResult?.rows?.filter((r: any) => r.valid === true).length ?? 0) === 0}
                            className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {confirmImportMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                            {confirmImportMutation.isPending ? "Importing..." : "Confirm Import"}
                        </button>
                    )}
                </div>
            </ModalShell>

            {/* ── Encash Balance Modal ── */}
            <ModalShell open={encashModal} onClose={() => setEncashModal(false)} title="Encash Leave Balance">
                <div className="p-6 overflow-y-auto flex-1 space-y-4">
                    <NumberField
                        label="Days to Encash"
                        value={encashForm.days}
                        onChange={(v) => setEncashForm((p) => ({ ...p, days: v }))}
                        min={0}
                        max={encashForm.maxDays > 0 ? encashForm.maxDays : undefined}
                        step={0.5}
                    />
                    {encashForm.maxDays > 0 && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            Max encashable: <span className="font-bold text-primary-600 dark:text-primary-400">{formatLeaveNumber(encashForm.maxDays)} days</span>
                        </p>
                    )}
                    <TextareaField
                        label="Reason *"
                        value={encashForm.reason}
                        onChange={(v) => setEncashForm((p) => ({ ...p, reason: v }))}
                        placeholder="Reason for encashment..."
                    />
                </div>
                <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                    <button onClick={() => setEncashModal(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                    <button onClick={handleEncash} disabled={encashMutation.isPending || encashForm.days <= 0 || !encashForm.reason.trim()} className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                        {encashMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                        {encashMutation.isPending ? "Processing..." : "Encash"}
                    </button>
                </div>
            </ModalShell>

            {/* ── Transaction History Modal ── */}
            <ModalShell open={txnModal} onClose={() => { setTxnModal(false); setTxnBalanceId(""); }} title="Transaction History" maxWidth="max-w-2xl">
                <div className="p-6 overflow-y-auto flex-1 space-y-4">
                    {txnQuery.isLoading ? (
                        <SkeletonTable rows={5} cols={6} />
                    ) : transactions.length === 0 ? (
                        <p className="text-sm text-neutral-400 dark:text-neutral-500 text-center py-8 italic">No transactions found for this balance.</p>
                    ) : (
                        <>
                            <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-700">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="bg-neutral-50 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                            <th className="py-2.5 px-3 font-bold">Date</th>
                                            <th className="py-2.5 px-3 font-bold">Type</th>
                                            <th className="py-2.5 px-3 font-bold text-right">Delta</th>
                                            <th className="py-2.5 px-3 font-bold text-right">Balance</th>
                                            <th className="py-2.5 px-3 font-bold">Changed By</th>
                                            <th className="py-2.5 px-3 font-bold">Reason</th>
                                            <th className="py-2.5 px-3 font-bold">Source</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.map((txn: any, idx: number) => (
                                            <tr key={txn.id ?? idx} className="border-t border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                                                <td className="py-2 px-3 whitespace-nowrap text-neutral-700 dark:text-neutral-300">
                                                    {txn.createdAt ? fmt.dateTime(txn.createdAt) : "-"}
                                                </td>
                                                <td className="py-2 px-3">
                                                    <span className={cn("inline-block px-2 py-0.5 rounded-full text-xs font-bold", txnTypeColor(txn.type))}>
                                                        {txn.type?.replace(/_/g, " ") ?? "-"}
                                                    </span>
                                                </td>
                                                <td className={cn(
                                                    "py-2 px-3 text-right font-bold",
                                                    Number(txn.delta ?? 0) >= 0 ? "text-success-600 dark:text-success-400" : "text-danger-600 dark:text-danger-400"
                                                )}>
                                                    {Number(txn.delta ?? 0) >= 0 ? "+" : ""}{formatLeaveNumber(Number(txn.delta ?? 0))}
                                                </td>
                                                <td className="py-2 px-3 text-right font-bold text-primary-950 dark:text-white">
                                                    {formatLeaveNumber(Number(txn.resultingBalance ?? 0))}
                                                </td>
                                                <td className="py-2 px-3 text-neutral-600 dark:text-neutral-400 max-w-[100px] truncate">
                                                    {txn.changedBy ?? txn.changedByName ?? "-"}
                                                </td>
                                                <td className="py-2 px-3 text-neutral-600 dark:text-neutral-400 max-w-[150px] truncate" title={txn.reason}>
                                                    {txn.reason ?? "-"}
                                                </td>
                                                <td className="py-2 px-3 text-neutral-500 dark:text-neutral-500">
                                                    {txn.source ?? "-"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {txnMeta && txnMeta.totalPages > 1 && (
                                <div className="flex items-center justify-between pt-2">
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                        Page {txnMeta.page} of {txnMeta.totalPages} ({txnMeta.total} entries)
                                    </p>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setTxnPage((p) => Math.max(1, p - 1))}
                                            disabled={txnPage <= 1}
                                            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-40 transition-colors"
                                        >
                                            <ChevronLeft size={14} />
                                        </button>
                                        <button
                                            onClick={() => setTxnPage((p) => Math.min(txnMeta.totalPages, p + 1))}
                                            disabled={txnPage >= txnMeta.totalPages}
                                            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-40 transition-colors"
                                        >
                                            <ChevronRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
                <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                    <button onClick={() => { setTxnModal(false); setTxnBalanceId(""); }} className="w-full py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Close</button>
                </div>
            </ModalShell>
        </div>
    );
}
