import { useState, useMemo } from "react";
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import {
    FileText,
    Loader2,
    Download,
    Mail,
    Calendar,
    CheckCircle2,
    Clock,
    AlertTriangle,
    RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStatutoryFilings } from "@/features/company-admin/api/use-payroll-run-queries";
import {
    useGenerateForm16,
    useGenerateForm24Q,
    useBulkEmailForm16,
} from "@/features/company-admin/api/use-payroll-run-mutations";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Atoms ── */

function StatusBadge({ status }: { status: string }) {
    const s = status?.toLowerCase();
    const cls =
        s === "completed" || s === "generated"
            ? "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50"
            : s === "processing" || s === "in_progress"
            ? "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50"
            : s === "failed"
            ? "bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50"
            : "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700";
    return (
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase", cls)}>
            {status}
        </span>
    );
}

function TypeBadge({ type }: { type: string }) {
    const t = type?.toUpperCase() ?? "";
    const isForm16 = t.includes("16") || t.includes("FORM_16");
    const isTDS = t.includes("TDS") || t.includes("24Q");
    const cls = isForm16
        ? "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50"
        : isTDS
        ? "bg-accent-50 text-accent-700 border-accent-200 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50"
        : "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700";
    return (
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", cls)}>
            {TYPE_LABELS[type] ?? type?.replace(/_/g, " ")}
        </span>
    );
}

/* ── Helpers ── */

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

const TYPE_LABELS: Record<string, string> = {
    PF_ECR: "PF ECR", ESI_CHALLAN: "ESI Challan", PT_CHALLAN: "Professional Tax",
    TDS_24Q: "TDS 24Q", LWF: "LWF", FORM_16: "Form 16", FORM_24Q: "Form 24Q",
};

/* ── Constants ── */

const FINANCIAL_YEARS = [
    { value: "2024-25", label: "FY 2024-25" },
    { value: "2025-26", label: "FY 2025-26" },
    { value: "2026-27", label: "FY 2026-27" },
];

const QUARTERS = [
    { value: "1", label: "Q1 (Apr-Jun)" },
    { value: "2", label: "Q2 (Jul-Sep)" },
    { value: "3", label: "Q3 (Oct-Dec)" },
    { value: "4", label: "Q4 (Jan-Mar)" },
];

/* ── Screen ── */

export function Form16Screen() {
    const fmt = useCompanyFormatter();
    const [selectedFY, setSelectedFY] = useState("2025-26");
    const [selectedQuarter, setSelectedQuarter] = useState("1");

    const { data: filingsData, isLoading, isError } = useStatutoryFilings({ financialYear: selectedFY } as any);
    const generateForm16 = useGenerateForm16();
    const generateForm24Q = useGenerateForm24Q();
    const bulkEmail = useBulkEmailForm16();

    const filings: any[] = (filingsData as any)?.data ?? [];

    const form16Filings = useMemo(() => filings.filter((f: any) => f.type?.toLowerCase().includes("16")), [filings]);
    const form24QFilings = useMemo(() => filings.filter((f: any) => f.type === "TDS_24Q" || f.type?.toLowerCase().includes("24q")), [filings]);

    const handleGenerateForm16 = async () => {
        try {
            await generateForm16.mutateAsync({ financialYear: selectedFY });
            showSuccess("Form 16 Generated", `Form 16 for ${selectedFY} is being generated.`);
        } catch (err) {
            showApiError(err);
        }
    };

    const handleGenerateForm24Q = async () => {
        try {
            await generateForm24Q.mutateAsync({ quarter: Number(selectedQuarter), financialYear: selectedFY });
            showSuccess("Form 24Q Generated", `Form 24Q Q${selectedQuarter} for ${selectedFY} is being generated.`);
        } catch (err) {
            showApiError(err);
        }
    };

    const handleBulkEmail = async () => {
        try {
            await bulkEmail.mutateAsync({ financialYear: selectedFY });
            showSuccess("Emails Sent", `Form 16 for ${selectedFY} is being emailed to all employees.`);
        } catch (err) {
            showApiError(err);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Form 16 / 24Q</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Generate and manage statutory tax filings</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={selectedFY}
                        onChange={(e) => setSelectedFY(e.target.value)}
                        className="px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:text-white transition-all"
                    >
                        {FINANCIAL_YEARS.map((fy) => (
                            <option key={fy.value} value={fy.value}>{fy.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form 16 Card */}
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-primary-950 dark:text-white">Form 16</h3>
                            <p className="text-xs text-neutral-500">Annual TDS certificate for employees</p>
                        </div>
                    </div>
                    <div className="space-y-3 mb-5">
                        <div className="flex items-center justify-between py-2 px-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                            <span className="text-xs text-neutral-500">Financial Year</span>
                            <span className="text-xs font-bold text-primary-950 dark:text-white">{selectedFY}</span>
                        </div>
                        {form16Filings.length > 0 && (
                            <>
                                <div className="flex items-center justify-between py-2 px-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                    <span className="text-xs text-neutral-500">Employees</span>
                                    <span className="text-xs font-bold text-primary-950 dark:text-white">{form16Filings[0]?.employeeCount ?? "—"}</span>
                                </div>
                                <div className="flex items-center justify-between py-2 px-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                    <span className="text-xs text-neutral-500">Status</span>
                                    <StatusBadge status={form16Filings[0]?.status ?? "Pending"} />
                                </div>
                            </>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleGenerateForm16}
                            disabled={generateForm16.isPending}
                            className="flex-1 inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all disabled:opacity-50"
                        >
                            {generateForm16.isPending ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                            {generateForm16.isPending ? "Generating..." : "Generate"}
                        </button>
                        <button
                            onClick={handleBulkEmail}
                            disabled={bulkEmail.isPending || form16Filings.length === 0}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
                        >
                            {bulkEmail.isPending ? <Loader2 size={14} className="animate-spin" /> : <Mail className="w-4 h-4" />}
                            Email All
                        </button>
                    </div>
                </div>

                {/* Form 24Q Card */}
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-accent-50 dark:bg-accent-900/30 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-accent-600 dark:text-accent-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-primary-950 dark:text-white">Form 24Q</h3>
                            <p className="text-xs text-neutral-500">Quarterly TDS return for salaries</p>
                        </div>
                    </div>
                    <div className="space-y-3 mb-5">
                        <div className="flex items-center justify-between py-2 px-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                            <span className="text-xs text-neutral-500">Financial Year</span>
                            <span className="text-xs font-bold text-primary-950 dark:text-white">{selectedFY}</span>
                        </div>
                        <div>
                            <label className="block text-xs text-neutral-500 mb-1.5 px-1">Quarter</label>
                            <div className="flex gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
                                {QUARTERS.map((q) => (
                                    <button
                                        key={q.value}
                                        onClick={() => setSelectedQuarter(q.value)}
                                        className={cn(
                                            "flex-1 px-2 py-2 rounded-lg text-xs font-bold transition-all",
                                            selectedQuarter === q.value
                                                ? "bg-white dark:bg-neutral-700 text-accent-700 dark:text-accent-400 shadow-sm"
                                                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700"
                                        )}
                                    >
                                        Q{q.value}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {form24QFilings.length > 0 && (() => {
                            const latest = form24QFilings[0];
                            const details = latest?.details ?? {};
                            return (
                            <>
                                <div className="flex items-center justify-between py-2 px-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                    <span className="text-xs text-neutral-500">Deductees</span>
                                    <span className="text-xs font-bold text-primary-950 dark:text-white">{details.employeeCount ?? latest?.deducteeCount ?? "—"}</span>
                                </div>
                                <div className="flex items-center justify-between py-2 px-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                    <span className="text-xs text-neutral-500">Total TDS</span>
                                    <span className="text-xs font-bold text-primary-950 dark:text-white">{(details.totalTdsDeducted ?? latest?.amount) ? `₹${Number(details.totalTdsDeducted ?? latest.amount).toLocaleString("en-IN")}` : "—"}</span>
                                </div>
                            </>
                            );
                        })()}
                    </div>
                    <button
                        onClick={handleGenerateForm24Q}
                        disabled={generateForm24Q.isPending}
                        className="w-full inline-flex items-center justify-center gap-2 bg-accent-600 hover:bg-accent-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-accent-500/20 transition-all disabled:opacity-50"
                    >
                        {generateForm24Q.isPending ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        {generateForm24Q.isPending ? "Generating..." : `Generate Q${selectedQuarter}`}
                    </button>
                </div>
            </div>

            {isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
                    Failed to load filing history. Please try again.
                </div>
            )}

            {/* Filing History */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                    <h3 className="font-bold text-primary-950 dark:text-white">Filing History</h3>
                </div>
                {isLoading ? (
                    <SkeletonTable rows={5} cols={6} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Type</th>
                                    <th className="py-4 px-6 font-bold">Period</th>
                                    <th className="py-4 px-6 font-bold text-right">Amount (₹)</th>
                                    <th className="py-4 px-6 font-bold">Filed Date</th>
                                    <th className="py-4 px-6 font-bold">Due Date</th>
                                    <th className="py-4 px-6 font-bold text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filings.map((f: any) => (
                                    <tr
                                        key={f.id}
                                        className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors"
                                    >
                                        <td className="py-4 px-6">
                                            <TypeBadge type={f.type ?? "—"} />
                                        </td>
                                        <td className="py-4 px-6 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                            {f.month && f.year ? `${MONTHS[(f.month - 1)]} ${f.year}` : f.financialYear ?? "—"}
                                            {f.details?.quarter && <span className="ml-1 text-neutral-400">({f.details.quarter})</span>}
                                        </td>
                                        <td className="py-4 px-6 text-right font-mono text-xs font-semibold text-primary-950 dark:text-white">
                                            {f.amount ? `₹${Number(f.amount).toLocaleString("en-IN")}` : "—"}
                                        </td>
                                        <td className="py-4 px-6 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                                            {f.filedAt ? fmt.date(f.filedAt) : "—"}
                                        </td>
                                        <td className="py-4 px-6 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                                            {f.dueDate ? fmt.date(f.dueDate) : "—"}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <StatusBadge status={f.status ?? "Pending"} />
                                        </td>
                                    </tr>
                                ))}
                                {filings.length === 0 && !isLoading && (
                                    <tr>
                                        <td colSpan={6}>
                                            <EmptyState icon="list" title="No filings yet" message={`Generate Form 16 or 24Q for ${selectedFY} to get started.`} />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
