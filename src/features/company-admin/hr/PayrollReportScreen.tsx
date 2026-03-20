import { useState } from "react";
import {
    BarChart3,
    FileSpreadsheet,
    Building,
    Landmark,
    Receipt,
    TrendingUp,
    ArrowLeft,
    Download,
    Loader2,
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

const formatCurrency = (v: number) => `\u20B9${(v ?? 0).toLocaleString("en-IN")}`;

type ReportKey = "salary-register" | "bank-file" | "pf-ecr" | "esi-challan" | "pt-challan" | "variance";

interface ReportCard {
    key: ReportKey;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string; size?: number }>;
    color: string;
    bgColor: string;
}

const REPORT_CARDS: ReportCard[] = [
    {
        key: "salary-register",
        label: "Salary Register",
        description: "Complete salary breakdown for all employees",
        icon: FileSpreadsheet,
        color: "text-primary-600 dark:text-primary-400",
        bgColor: "bg-primary-50 dark:bg-primary-900/20 border-primary-100 dark:border-primary-800/50",
    },
    {
        key: "bank-file",
        label: "Bank File",
        description: "Bank transfer file for salary disbursement",
        icon: Landmark,
        color: "text-success-600 dark:text-success-400",
        bgColor: "bg-success-50 dark:bg-success-900/20 border-success-100 dark:border-success-800/50",
    },
    {
        key: "pf-ecr",
        label: "PF ECR",
        description: "Provident Fund ECR challan report",
        icon: Building,
        color: "text-accent-600 dark:text-accent-400",
        bgColor: "bg-accent-50 dark:bg-accent-900/20 border-accent-100 dark:border-accent-800/50",
    },
    {
        key: "esi-challan",
        label: "ESI Challan",
        description: "Employee State Insurance challan report",
        icon: Receipt,
        color: "text-info-600 dark:text-info-400",
        bgColor: "bg-info-50 dark:bg-info-900/20 border-info-100 dark:border-info-800/50",
    },
    {
        key: "pt-challan",
        label: "PT Challan",
        description: "Professional Tax challan report",
        icon: Receipt,
        color: "text-warning-600 dark:text-warning-400",
        bgColor: "bg-warning-50 dark:bg-warning-900/20 border-warning-100 dark:border-warning-800/50",
    },
    {
        key: "variance",
        label: "Variance Report",
        description: "Month-over-month payroll variance analysis",
        icon: TrendingUp,
        color: "text-danger-600 dark:text-danger-400",
        bgColor: "bg-danger-50 dark:bg-danger-900/20 border-danger-100 dark:border-danger-800/50",
    },
];

/* ── Screen ── */

export function PayrollReportScreen() {
    const [selectedReport, setSelectedReport] = useState<ReportKey | null>(null);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());

    const params = { month, year };

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
    const reportColumns: string[] = activeQuery?.data?.data?.columns ?? [];

    const renderReportTable = () => {
        if (!selectedReport) return null;
        if (activeQuery?.isLoading) return <SkeletonTable rows={8} cols={6} />;
        if (reportData.length === 0) return <EmptyState icon="list" title="No data available" message={`No data found for ${MONTHS[month - 1]} ${year}. Run payroll first to generate reports.`} />;

        // Dynamic columns from API or fallback
        const cols = reportColumns.length > 0 ? reportColumns : Object.keys(reportData[0] ?? {}).filter(k => k !== "id");

        return (
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                        <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                            {cols.map((col) => (
                                <th key={col} className="py-4 px-6 font-bold whitespace-nowrap">
                                    {col.replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim()}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {reportData.map((row: any, i: number) => (
                            <tr key={row.id ?? i} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                {cols.map((col) => {
                                    const val = row[col];
                                    const isNumeric = typeof val === "number";
                                    return (
                                        <td key={col} className={cn("py-4 px-6", isNumeric ? "text-right font-mono" : "text-neutral-700 dark:text-neutral-300")}>
                                            {isNumeric ? formatCurrency(val) : (val ?? "\u2014")}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const activeCard = REPORT_CARDS.find((c) => c.key === selectedReport);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    {selectedReport ? (
                        <button
                            onClick={() => setSelectedReport(null)}
                            className="inline-flex items-center gap-2 text-sm font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 mb-2 transition-colors"
                        >
                            <ArrowLeft size={16} />
                            Back to Reports
                        </button>
                    ) : null}
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">
                        {selectedReport ? activeCard?.label ?? "Report" : "Payroll Reports"}
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                        {selectedReport ? activeCard?.description ?? "" : "Generate and view payroll compliance reports"}
                    </p>
                </div>
            </div>

            {/* Month/Year Selector */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Month</label>
                        <select
                            value={month}
                            onChange={(e) => setMonth(Number(e.target.value))}
                            className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-semibold text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        >
                            {MONTHS.map((m, i) => (
                                <option key={i} value={i + 1}>{m}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Year</label>
                        <input
                            type="number"
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                            min={2020}
                            max={2040}
                            className="w-24 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-semibold text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        />
                    </div>
                </div>
            </div>

            {/* Report Grid or Report Data */}
            {!selectedReport ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {REPORT_CARDS.map((card) => {
                        const Icon = card.icon;
                        return (
                            <button
                                key={card.key}
                                onClick={() => setSelectedReport(card.key)}
                                className={cn(
                                    "rounded-2xl border p-6 text-left hover:shadow-md transition-all group",
                                    card.bgColor
                                )}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center bg-white/60 dark:bg-neutral-900/40")}>
                                        <Icon size={24} className={card.color} />
                                    </div>
                                    <BarChart3 size={16} className="text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-400 transition-colors" />
                                </div>
                                <h3 className="font-bold text-primary-950 dark:text-white mb-1">{card.label}</h3>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">{card.description}</p>
                            </button>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                    {renderReportTable()}
                </div>
            )}
        </div>
    );
}
