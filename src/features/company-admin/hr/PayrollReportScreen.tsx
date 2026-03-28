import { useState, useMemo } from "react";
import {
    FileSpreadsheet,
    Building,
    Landmark,
    Receipt,
    TrendingUp,
    Download,
    Loader2,
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    useSalaryRegister,
    useBankFile,
    usePFECR,
    useESIChallan,
    usePTChallan,
    useVarianceReport,
} from "@/features/company-admin/api/use-payroll-run-queries";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

/* ── Helpers ── */

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

const formatCurrency = (v: number) => `\u20B9${(v ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const formatPercent = (v: number) => `${(v ?? 0).toFixed(1)}%`;

type ReportKey = "salary-register" | "bank-file" | "pf-ecr" | "esi-challan" | "pt-challan" | "variance";

interface ReportTab {
    key: ReportKey;
    label: string;
    shortLabel: string;
    description: string;
    icon: React.ComponentType<{ className?: string; size?: number }>;
    color: string;
    bgColor: string;
}

const REPORT_TABS: ReportTab[] = [
    {
        key: "salary-register",
        label: "Salary Register",
        shortLabel: "Salary Register",
        description: "Complete salary breakdown for all employees",
        icon: FileSpreadsheet,
        color: "text-primary-600 dark:text-primary-400",
        bgColor: "bg-primary-50 dark:bg-primary-900/20 border-primary-100 dark:border-primary-800/50",
    },
    {
        key: "bank-file",
        label: "Bank File",
        shortLabel: "Bank File",
        description: "Bank transfer file for salary disbursement",
        icon: Landmark,
        color: "text-success-600 dark:text-success-400",
        bgColor: "bg-success-50 dark:bg-success-900/20 border-success-100 dark:border-success-800/50",
    },
    {
        key: "pf-ecr",
        label: "PF ECR",
        shortLabel: "PF ECR",
        description: "Provident Fund ECR challan report",
        icon: Building,
        color: "text-accent-600 dark:text-accent-400",
        bgColor: "bg-accent-50 dark:bg-accent-900/20 border-accent-100 dark:border-accent-800/50",
    },
    {
        key: "esi-challan",
        label: "ESI Challan",
        shortLabel: "ESI",
        description: "Employee State Insurance challan report",
        icon: Receipt,
        color: "text-info-600 dark:text-info-400",
        bgColor: "bg-info-50 dark:bg-info-900/20 border-info-100 dark:border-info-800/50",
    },
    {
        key: "pt-challan",
        label: "PT Challan",
        shortLabel: "PT",
        description: "Professional Tax challan report",
        icon: Receipt,
        color: "text-warning-600 dark:text-warning-400",
        bgColor: "bg-warning-50 dark:bg-warning-900/20 border-warning-100 dark:border-warning-800/50",
    },
    {
        key: "variance",
        label: "Variance Report",
        shortLabel: "Variance",
        description: "Month-over-month payroll variance analysis",
        icon: TrendingUp,
        color: "text-danger-600 dark:text-danger-400",
        bgColor: "bg-danger-50 dark:bg-danger-900/20 border-danger-100 dark:border-danger-800/50",
    },
];

/* ── Report-specific column configs ── */

interface ColConfig {
    key: string;
    label: string;
    align?: "left" | "right";
    format?: "currency" | "percent" | "text" | "mono";
    highlight?: boolean;
}

const REPORT_COLUMNS: Record<ReportKey, ColConfig[]> = {
    "salary-register": [
        { key: "employeeCode", label: "Emp Code", format: "mono" },
        { key: "employeeName", label: "Employee Name" },
        { key: "department", label: "Department" },
        { key: "designation", label: "Designation" },
        { key: "grossEarnings", label: "Gross", align: "right", format: "currency" },
        { key: "totalDeductions", label: "Deductions", align: "right", format: "currency" },
        { key: "netPay", label: "Net Pay", align: "right", format: "currency", highlight: true },
        { key: "pfAmount", label: "PF", align: "right", format: "currency" },
        { key: "esiAmount", label: "ESI", align: "right", format: "currency" },
        { key: "ptAmount", label: "PT", align: "right", format: "currency" },
        { key: "tdsAmount", label: "TDS", align: "right", format: "currency" },
    ],
    "bank-file": [
        { key: "employeeCode", label: "Emp Code", format: "mono" },
        { key: "employeeName", label: "Employee Name" },
        { key: "bankName", label: "Bank" },
        { key: "ifscCode", label: "IFSC", format: "mono" },
        { key: "accountNumber", label: "Account No.", format: "mono" },
        { key: "netPay", label: "Net Pay", align: "right", format: "currency", highlight: true },
    ],
    "pf-ecr": [
        { key: "employeeCode", label: "Emp Code", format: "mono" },
        { key: "employeeName", label: "Employee Name" },
        { key: "uan", label: "UAN", format: "mono" },
        { key: "pfWages", label: "PF Wages", align: "right", format: "currency" },
        { key: "employeePF", label: "Employee PF", align: "right", format: "currency" },
        { key: "employerPF", label: "Employer PF", align: "right", format: "currency" },
        { key: "eps", label: "EPS", align: "right", format: "currency" },
        { key: "edliCharges", label: "EDLI", align: "right", format: "currency" },
    ],
    "esi-challan": [
        { key: "employeeCode", label: "Emp Code", format: "mono" },
        { key: "employeeName", label: "Employee Name" },
        { key: "ipNumber", label: "IP Number", format: "mono" },
        { key: "grossWages", label: "Gross Wages", align: "right", format: "currency" },
        { key: "employeeESI", label: "Employee ESI", align: "right", format: "currency" },
        { key: "employerESI", label: "Employer ESI", align: "right", format: "currency" },
        { key: "totalESI", label: "Total ESI", align: "right", format: "currency", highlight: true },
    ],
    "pt-challan": [
        { key: "state", label: "State" },
        { key: "employeeCode", label: "Emp Code", format: "mono" },
        { key: "employeeName", label: "Employee Name" },
        { key: "grossSalary", label: "Gross Salary", align: "right", format: "currency" },
        { key: "ptAmount", label: "PT Amount", align: "right", format: "currency", highlight: true },
    ],
    "variance": [
        { key: "employeeCode", label: "Emp Code", format: "mono" },
        { key: "employeeName", label: "Employee Name" },
        { key: "thisMonth", label: "This Month", align: "right", format: "currency" },
        { key: "lastMonth", label: "Last Month", align: "right", format: "currency" },
        { key: "varianceAmount", label: "Variance", align: "right", format: "currency" },
        { key: "variancePercent", label: "Variance %", align: "right", format: "percent" },
        { key: "flag", label: "Flag" },
    ],
};

/* ── CSV Export ── */

function downloadCSV(data: any[], columns: ColConfig[], filename: string) {
    if (data.length === 0) return;
    const headers = columns.map((c) => c.label);
    const rows = data.map((row) =>
        columns.map((c) => {
            const val = row[c.key];
            if (val === null || val === undefined) return "";
            return String(val);
        })
    );
    const csvContent = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

/* ── Screen ── */

export function PayrollReportScreen() {
    const [selectedReport, setSelectedReport] = useState<ReportKey>("salary-register");
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());

    const params = useMemo(() => ({ month, year }), [month, year]);

    const salaryRegisterQuery = useSalaryRegister(selectedReport === "salary-register" ? params : {});
    const bankFileQuery = useBankFile(selectedReport === "bank-file" ? { ...params, payrollRunId: "latest" } : {});
    const pfECRQuery = usePFECR(selectedReport === "pf-ecr" ? params : {});
    const esiChallanQuery = useESIChallan(selectedReport === "esi-challan" ? params : {});
    const ptChallanQuery = usePTChallan(selectedReport === "pt-challan" ? params : {});
    const varianceQuery = useVarianceReport(selectedReport === "variance" ? params : {});

    const getActiveQuery = () => {
        switch (selectedReport) {
            case "salary-register": return salaryRegisterQuery;
            case "bank-file": return bankFileQuery;
            case "pf-ecr": return pfECRQuery;
            case "esi-challan": return esiChallanQuery;
            case "pt-challan": return ptChallanQuery;
            case "variance": return varianceQuery;
            default: return null;
        }
    };

    const activeQuery = getActiveQuery();
    const reportData: any[] = activeQuery?.data?.data?.rows ?? activeQuery?.data?.data ?? [];
    const definedCols = REPORT_COLUMNS[selectedReport] ?? [];

    // Use defined columns, falling back to dynamic keys from data
    const effectiveCols: ColConfig[] = useMemo(() => {
        if (definedCols.length > 0) return definedCols;
        if (reportData.length === 0) return [];
        return Object.keys(reportData[0]).filter((k) => k !== "id").map((k) => ({
            key: k,
            label: k.replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim(),
            format: typeof reportData[0][k] === "number" ? "currency" as const : "text" as const,
            align: typeof reportData[0][k] === "number" ? "right" as const : "left" as const,
        }));
    }, [definedCols, reportData]);

    // Totals row for numeric columns
    const totals = useMemo(() => {
        if (reportData.length === 0) return null;
        const row: Record<string, number> = {};
        let hasNumeric = false;
        for (const col of effectiveCols) {
            if (col.format === "currency") {
                row[col.key] = reportData.reduce((sum, r) => sum + (Number(r[col.key]) || 0), 0);
                hasNumeric = true;
            }
        }
        return hasNumeric ? row : null;
    }, [reportData, effectiveCols]);

    const formatCell = (val: any, col: ColConfig) => {
        if (val === null || val === undefined) return "—";
        if (col.format === "currency" && typeof val === "number") return formatCurrency(val);
        if (col.format === "percent" && typeof val === "number") return formatPercent(val);
        if (col.key === "flag" && val) {
            const flagColor = val === "HIGH" || val === "high"
                ? "bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400"
                : val === "LOW" || val === "low"
                    ? "bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400"
                    : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400";
            return (
                <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase", flagColor)}>
                    {val === "HIGH" || val === "high" ? <AlertTriangle size={10} /> : null}
                    {val}
                </span>
            );
        }
        return String(val);
    };

    const handlePrevMonth = () => {
        if (month === 1) { setMonth(12); setYear((y) => y - 1); }
        else setMonth((m) => m - 1);
    };
    const handleNextMonth = () => {
        if (month === 12) { setMonth(1); setYear((y) => y + 1); }
        else setMonth((m) => m + 1);
    };

    const activeTab = REPORT_TABS.find((t) => t.key === selectedReport)!;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">
                        Payroll Reports
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                        Generate and view payroll compliance reports
                    </p>
                </div>
            </div>

            {/* Month/Year Selector */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handlePrevMonth}
                            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                            title="Previous month"
                        >
                            <ChevronLeft size={18} className="text-neutral-500" />
                        </button>
                        <div className="flex items-center gap-2">
                            <select
                                value={month}
                                onChange={(e) => setMonth(Number(e.target.value))}
                                className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-semibold text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                            >
                                {MONTHS.map((m, i) => (
                                    <option key={i} value={i + 1}>{m}</option>
                                ))}
                            </select>
                            <input
                                type="number"
                                value={year}
                                onChange={(e) => setYear(Number(e.target.value))}
                                min={2020}
                                max={2040}
                                className="w-24 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-semibold text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                            />
                        </div>
                        <button
                            onClick={handleNextMonth}
                            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                            title="Next month"
                        >
                            <ChevronRight size={18} className="text-neutral-500" />
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        {activeQuery?.isLoading && (
                            <Loader2 size={16} className="animate-spin text-primary-500" />
                        )}
                        <button
                            onClick={() => activeQuery?.refetch?.()}
                            disabled={activeQuery?.isLoading}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw size={13} />
                            Refresh
                        </button>
                        <button
                            onClick={() => downloadCSV(reportData, effectiveCols, `${selectedReport}_${MONTHS[month - 1]}_${year}.csv`)}
                            disabled={reportData.length === 0}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-md shadow-primary-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed dark:shadow-none"
                        >
                            <Download size={13} />
                            Download CSV
                        </button>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                <div className="flex overflow-x-auto border-b border-neutral-100 dark:border-neutral-800">
                    {REPORT_TABS.map((tab) => {
                        const Icon = tab.icon;
                        const active = selectedReport === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setSelectedReport(tab.key)}
                                className={cn(
                                    "flex items-center gap-2 px-5 py-3.5 text-sm font-bold whitespace-nowrap border-b-2 transition-all",
                                    active
                                        ? "border-primary-600 text-primary-700 dark:text-primary-400"
                                        : "border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600"
                                )}
                            >
                                <Icon size={16} />
                                <span className="hidden md:inline">{tab.label}</span>
                                <span className="md:hidden">{tab.shortLabel}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Report Data Table */}
                <div className="p-0">
                    {activeQuery?.isLoading ? (
                        <div className="p-6">
                            <SkeletonTable rows={8} cols={effectiveCols.length || 6} />
                        </div>
                    ) : activeQuery?.isError ? (
                        <div className="p-10 text-center">
                            <AlertTriangle size={28} className="text-danger-400 mx-auto mb-3" />
                            <p className="text-sm font-bold text-primary-950 dark:text-white mb-1">Failed to load report</p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">There was an error fetching {activeTab.label} data.</p>
                            <button
                                onClick={() => activeQuery?.refetch?.()}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold transition-all"
                            >
                                <RefreshCw size={13} />
                                Retry
                            </button>
                        </div>
                    ) : reportData.length === 0 ? (
                        <div className="p-6">
                            <EmptyState
                                icon="list"
                                title="No data available"
                                message={`No ${activeTab.label.toLowerCase()} data found for ${MONTHS[month - 1]} ${year}. Run payroll first to generate this report.`}
                            />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead>
                                    <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                        <th className="py-4 px-4 font-bold text-neutral-400 w-10">#</th>
                                        {effectiveCols.map((col) => (
                                            <th
                                                key={col.key}
                                                className={cn(
                                                    "py-4 px-4 font-bold whitespace-nowrap",
                                                    col.align === "right" && "text-right"
                                                )}
                                            >
                                                {col.label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {reportData.map((row: any, i: number) => (
                                        <tr
                                            key={row.id ?? row.employeeCode ?? i}
                                            className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors"
                                        >
                                            <td className="py-3.5 px-4 text-xs text-neutral-400 font-mono">{i + 1}</td>
                                            {effectiveCols.map((col) => {
                                                const val = row[col.key];
                                                return (
                                                    <td
                                                        key={col.key}
                                                        className={cn(
                                                            "py-3.5 px-4",
                                                            col.align === "right" && "text-right",
                                                            col.format === "mono" && "font-mono text-xs",
                                                            col.format === "currency" && "font-mono",
                                                            col.highlight && "font-bold text-primary-700 dark:text-primary-400",
                                                            !col.highlight && "text-neutral-700 dark:text-neutral-300"
                                                        )}
                                                    >
                                                        {formatCell(val, col)}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                                {/* Totals Row */}
                                {totals && (
                                    <tfoot>
                                        <tr className="bg-neutral-50 dark:bg-neutral-800/50 border-t-2 border-neutral-300 dark:border-neutral-700">
                                            <td className="py-4 px-4 text-xs font-bold text-neutral-500 uppercase">Total</td>
                                            {effectiveCols.map((col) => (
                                                <td
                                                    key={col.key}
                                                    className={cn(
                                                        "py-4 px-4 font-bold",
                                                        col.align === "right" && "text-right",
                                                        col.format === "currency" && "font-mono text-primary-700 dark:text-primary-400"
                                                    )}
                                                >
                                                    {col.format === "currency" && totals[col.key] !== undefined
                                                        ? formatCurrency(totals[col.key])
                                                        : ""}
                                                </td>
                                            ))}
                                        </tr>
                                    </tfoot>
                                )}
                            </table>

                            {/* Row count */}
                            <div className="px-6 py-3 bg-neutral-50/50 dark:bg-neutral-800/20 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                    Showing <span className="font-bold text-neutral-700 dark:text-neutral-300">{reportData.length}</span> {reportData.length === 1 ? "record" : "records"} for {MONTHS[month - 1]} {year}
                                </p>
                                <button
                                    onClick={() => downloadCSV(reportData, effectiveCols, `${selectedReport}_${MONTHS[month - 1]}_${year}.csv`)}
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                                >
                                    <Download size={12} />
                                    Export CSV
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
