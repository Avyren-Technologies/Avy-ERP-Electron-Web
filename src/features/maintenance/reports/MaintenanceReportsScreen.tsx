import { useState, useCallback } from "react";
import { FileText, Download, Loader2, Play, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { maintenanceApi } from "@/features/maintenance/api/maintenance-api";
import { showSuccess, showApiError } from "@/lib/toast";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

/* ── Types ── */

interface ReportDef {
    key: string;
    label: string;
    description: string;
    fetcher: (params?: any) => Promise<any>;
}

/* ── Report Definitions ── */

const OPERATIONAL_REPORTS: ReportDef[] = [
    { key: "pm-due-overdue", label: "PM Due & Overdue", description: "Preventive maintenance tasks due or overdue", fetcher: maintenanceApi.getReportPMDueOverdue },
    { key: "open-breakdowns", label: "Open Breakdowns", description: "Currently open breakdown records", fetcher: maintenanceApi.getReportOpenBreakdowns },
    { key: "technician-workload", label: "Technician Workload", description: "Work distribution across technicians", fetcher: maintenanceApi.getReportTechnicianWorkload },
    { key: "vendor-sla", label: "Vendor SLA", description: "Vendor performance against SLA targets", fetcher: maintenanceApi.getReportVendorSLA },
    { key: "parts-availability", label: "Parts Availability", description: "Spare parts stock and readiness", fetcher: maintenanceApi.getReportPartsAvailability },
    { key: "asset-movement", label: "Asset Movement", description: "Asset transfer and relocation history", fetcher: maintenanceApi.getReportAssetMovement },
    { key: "shutdown-progress", label: "Shutdown Progress", description: "Planned shutdown execution status", fetcher: maintenanceApi.getReportShutdownProgress },
];

const MANAGEMENT_REPORTS: ReportDef[] = [
    { key: "availability-trend", label: "Availability Trend", description: "Asset availability over time", fetcher: maintenanceApi.getReportAvailabilityTrend },
    { key: "recurring-failures", label: "Recurring Failures", description: "Assets with repeat failure patterns", fetcher: maintenanceApi.getReportRecurringFailures },
    { key: "planned-vs-unplanned", label: "Planned vs Unplanned", description: "Ratio of PM to breakdown work orders", fetcher: maintenanceApi.getReportPlannedVsUnplanned },
    { key: "cost-breakdown", label: "Cost Breakdown", description: "Maintenance cost by category and asset class", fetcher: maintenanceApi.getReportCostBreakdown },
    { key: "repair-vs-replace", label: "Repair vs Replace", description: "Assets recommended for replacement", fetcher: maintenanceApi.getReportRepairVsReplace },
    { key: "warranty-amc-recovery", label: "Warranty & AMC Recovery", description: "Costs covered under warranty or AMC", fetcher: maintenanceApi.getReportWarrantyAMCRecovery },
];

const COMPLIANCE_REPORTS: ReportDef[] = [
    { key: "calibration-due", label: "Calibration Due", description: "Assets due for calibration", fetcher: maintenanceApi.getReportCalibrationDue },
    { key: "statutory-due-overdue", label: "Statutory Due & Overdue", description: "Regulatory compliance items status", fetcher: maintenanceApi.getReportStatutoryDueOverdue },
    { key: "closure-evidence-missing", label: "Closure Evidence Missing", description: "Closed WOs missing required evidence", fetcher: maintenanceApi.getReportClosureEvidenceMissing },
    { key: "approval-audit-trail", label: "Approval Audit Trail", description: "Approval actions and workflow history", fetcher: maintenanceApi.getReportApprovalAuditTrail },
    { key: "ptw-compliance", label: "PTW Compliance", description: "Permit to work issuance and compliance", fetcher: maintenanceApi.getReportPTWCompliance },
];

const REPORT_CATEGORIES = [
    { key: "operational", label: "Operational", reports: OPERATIONAL_REPORTS },
    { key: "management", label: "Management", reports: MANAGEMENT_REPORTS },
    { key: "compliance", label: "Compliance", reports: COMPLIANCE_REPORTS },
] as const;

type CategoryKey = (typeof REPORT_CATEGORIES)[number]["key"];

/* ── CSV Export ── */

function exportToCSV(data: any[], filename: string) {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvRows = [
        headers.join(","),
        ...data.map((row) =>
            headers.map((h) => `"${String(row[h] ?? "").replace(/"/g, '""')}"`).join(","),
        ),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

/* ── Report Card ── */

function ReportCard({
    report,
    onGenerate,
    isLoading,
    isActive,
}: {
    report: ReportDef;
    onGenerate: () => void;
    isLoading: boolean;
    isActive: boolean;
}) {
    return (
        <div className={cn(
            "flex items-center justify-between p-4 rounded-xl border transition-all",
            isActive
                ? "bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800/50"
                : "bg-white dark:bg-neutral-900 border-neutral-200/60 dark:border-neutral-800 hover:border-primary-300 dark:hover:border-primary-700",
        )}>
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="min-w-0">
                    <div className="text-sm font-bold text-primary-950 dark:text-white truncate">{report.label}</div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{report.description}</div>
                </div>
            </div>
            <button
                onClick={onGenerate}
                disabled={isLoading}
                className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex-shrink-0 ml-3",
                    isLoading
                        ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-wait"
                        : "bg-primary-600 text-white hover:bg-primary-700 shadow-sm",
                )}
            >
                {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                {isLoading ? "Loading..." : "Generate"}
            </button>
        </div>
    );
}

/* ── Report Results Table ── */

function ReportResultsTable({ data, reportLabel }: { data: any; reportLabel: string }) {
    const rows = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
    if (rows.length === 0 || !rows[0] || typeof rows[0] !== "object") {
        return (
            <EmptyState icon="list" title="No data" message="This report returned no results for the selected filters." />
        );
    }

    const headers = Object.keys(rows[0]);

    return (
        <div>
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                <h2 className="text-sm font-bold text-primary-950 dark:text-white uppercase tracking-wider">
                    {reportLabel} ({rows.length} records)
                </h2>
                <button
                    onClick={() => exportToCSV(rows, reportLabel.toLowerCase().replace(/\s+/g, "-"))}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-success-600 text-white hover:bg-success-700 shadow-sm transition-all"
                >
                    <Download className="w-3 h-3" />
                    Export CSV
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                            {headers.map((h) => (
                                <th key={h} className="py-3 px-6 font-bold whitespace-nowrap">
                                    {h.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {rows.slice(0, 100).map((row: any, idx: number) => (
                            <tr key={idx} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50">
                                {headers.map((h) => (
                                    <td key={h} className="py-3 px-6 text-primary-950 dark:text-white whitespace-nowrap">
                                        {row[h] != null ? String(row[h]) : "-"}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {data.length > 100 && (
                    <div className="px-6 py-3 text-xs text-neutral-400 text-center border-t border-neutral-100 dark:border-neutral-800">
                        Showing first 100 of {data.length} records. Export CSV for full data.
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── Main Screen ── */

export function MaintenanceReportsScreen() {
    const [activeCategory, setActiveCategory] = useState<CategoryKey>("operational");
    const [loadingReport, setLoadingReport] = useState<string | null>(null);
    const [reportData, setReportData] = useState<any[] | null>(null);
    const [activeReportLabel, setActiveReportLabel] = useState<string>("");

    const currentCategory = REPORT_CATEGORIES.find((c) => c.key === activeCategory)!;

    const handleGenerate = useCallback(async (report: ReportDef) => {
        setLoadingReport(report.key);
        try {
            const result = await report.fetcher();
            const data = result?.data ?? [];
            setReportData(data);
            setActiveReportLabel(report.label);
            if (data.length > 0) {
                showSuccess("Report Generated", `${report.label}: ${data.length} records found`);
            }
        } catch (err) {
            showApiError(err);
        } finally {
            setLoadingReport(null);
        }
    }, []);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">
                    Maintenance Reports
                </h1>
                <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                    Generate operational, management, and compliance reports
                </p>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl w-fit">
                {REPORT_CATEGORIES.map((cat) => (
                    <button
                        key={cat.key}
                        onClick={() => { setActiveCategory(cat.key); setReportData(null); }}
                        className={cn(
                            "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                            activeCategory === cat.key
                                ? "bg-white dark:bg-neutral-900 text-primary-700 dark:text-primary-400 shadow-sm"
                                : "text-neutral-500 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-300",
                        )}
                    >
                        {cat.label} ({cat.reports.length})
                    </button>
                ))}
            </div>

            {/* Report List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {currentCategory.reports.map((report) => (
                    <ReportCard
                        key={report.key}
                        report={report}
                        onGenerate={() => handleGenerate(report)}
                        isLoading={loadingReport === report.key}
                        isActive={activeReportLabel === report.label && reportData !== null}
                    />
                ))}
            </div>

            {/* Report Results */}
            {reportData != null && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                    <ReportResultsTable data={reportData} reportLabel={activeReportLabel} />
                </div>
            )}
        </div>
    );
}
