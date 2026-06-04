import { useMemo, useState, useRef, useEffect } from 'react';
import {
    Shield,
    Users,
    Receipt,
    Percent,
    FileText,
    CheckCircle2,
    AlertTriangle,
    Info,
    Calendar,
    Clock,
    Calculator,
    ChevronDown,
    Download,
    RefreshCcw,
    Save,
    Loader2,
    ArrowRight,
    ArrowLeft,
    Headphones,
    Phone,
    Mail,
    BookOpen,
    Filter,
    Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    useStatutorySummary,
    useStatutoryFiles,
    usePayrollRun,
    useStatutoryDetails,
} from '@/features/company-admin/api/use-payroll-run-queries';
import {
    useComputeStatutory,
    useResetToCompute,
} from '@/features/company-admin/api/use-payroll-run-mutations';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { showSuccess, showApiError } from '@/lib/toast';
import { exportToExcel } from '@/lib/export-utils';
import { StatutoryDetailModal, type StatutoryCategory } from './StatutoryDetailModal';
import { ComputationLogModal } from './ComputationLogModal';

interface StepProps {
    runId: string;
    runDetail: any;
    completedStep: number;
    onStepAction: () => void;
    anyMutating: boolean;
}

const formatINR = (v: unknown): string => `₹${(Number(v) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

/* ──────────────────────────────────────────────────────────────────────── */
/* Atoms                                                                    */
/* ──────────────────────────────────────────────────────────────────────── */

function StatTile({
    icon: Icon, label, value, sub, tint,
}: { icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; label: string; value: React.ReactNode; sub?: string; tint: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'emerald' }) {
    const tintMap = {
        primary: 'bg-primary-50 text-primary-600',
        success: 'bg-success-50 text-success-600',
        warning: 'bg-warning-50 text-warning-600',
        danger:  'bg-danger-50 text-danger-600',
        info:    'bg-info-50 text-info-600',
        accent:  'bg-accent-50 text-accent-600',
        emerald: 'bg-emerald-50 text-emerald-600',
    } as const;
    const valueTitle = typeof value === 'string' || typeof value === 'number' ? String(value) : undefined;
    return (
        <div
            className="rounded-2xl bg-white px-4 py-4 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
            title={valueTitle ? `${label}: ${valueTitle}${sub ? ` (${sub})` : ''}` : label}
        >
            <div className="flex items-center gap-3">
                <div className={cn('w-11 h-11 rounded-full flex items-center justify-center shrink-0', tintMap[tint])}>
                    <Icon className="w-5 h-5" strokeWidth={2.2} />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-[10.5px] font-bold uppercase tracking-wider text-neutral-500 leading-tight">{label}</div>
                    <div
                        className="mt-0.5 text-[18px] font-extrabold text-neutral-900 leading-tight tabular-nums truncate"
                        title={valueTitle}
                    >
                        {value}
                    </div>
                    {sub && <div className="text-[11px] text-neutral-500 mt-0.5" title={sub}>{sub}</div>}
                </div>
            </div>
        </div>
    );
}

function PayrollActionsDropdown({ onRefresh, onExport, onReset, allowReset }: { onRefresh: () => void; onExport: () => void; onReset: () => void; allowReset: boolean }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!open) return;
        const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, [open]);
    return (
        <div className="relative" ref={ref}>
            <button onClick={() => setOpen(o => !o)}
                className="inline-flex items-center gap-2 rounded-lg border border-primary-200 bg-white px-4 py-2 text-sm font-semibold text-primary-700 shadow-sm hover:bg-primary-50">
                Payroll Actions <ChevronDown className={cn('w-4 h-4 transition-transform', open && 'rotate-180')} />
            </button>
            {open && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-lg z-30">
                    <button onClick={() => { setOpen(false); onRefresh(); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                        <RefreshCcw className="w-4 h-4" /> Refresh Statutory
                    </button>
                    <button onClick={() => { setOpen(false); onExport(); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                        <Download className="w-4 h-4" /> Export Summary
                    </button>
                    {allowReset && (
                        <button onClick={() => { setOpen(false); onReset(); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-warning-700 hover:bg-warning-50">
                            <RefreshCcw className="w-4 h-4" /> Reset & Recalculate
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

function ComponentRow({
    component, code, applicable, applicablePct, employeeAmount, employerAmount, total, computed, onViewDetails,
}: {
    component: string; code: string; applicable: number; applicablePct: number;
    employeeAmount: number | null; employerAmount: number | null; total: number; computed: boolean;
    onViewDetails?: () => void;
}) {
    return (
        <tr className="group hover:bg-neutral-50/60">
            <td className="px-4 py-3.5">
                <div className="text-[13px] font-bold text-neutral-900 whitespace-nowrap">{component}</div>
                <div className="text-[11px] text-neutral-500">{code}</div>
            </td>
            <td className="px-4 py-3.5 whitespace-nowrap">
                <div className="text-[12.5px] font-semibold text-neutral-700">{applicable}</div>
                <div className="text-[11px] text-neutral-500">({applicablePct.toFixed(2)}%)</div>
            </td>
            <td className="px-4 py-3.5 text-right font-mono text-[12.5px] text-neutral-700 whitespace-nowrap">
                {employeeAmount !== null ? formatINR(employeeAmount) : '—'}
            </td>
            <td className="px-4 py-3.5 text-right font-mono text-[12.5px] text-neutral-700 whitespace-nowrap">
                {employerAmount !== null ? formatINR(employerAmount) : '—'}
            </td>
            <td className="px-4 py-3.5 text-right font-mono text-[13px] font-bold text-neutral-900 whitespace-nowrap">{formatINR(total)}</td>
            <td className="px-4 py-3.5 whitespace-nowrap">
                {computed ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2.5 py-1 text-[11px] font-semibold text-success-700 ring-1 ring-success-200">
                        <CheckCircle2 className="w-3 h-3" /> Computed
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-600 ring-1 ring-neutral-200">
                        <Clock className="w-3 h-3" /> Pending
                    </span>
                )}
            </td>
            <td className="px-4 py-3.5 text-right whitespace-nowrap">
                <button
                    onClick={onViewDetails}
                    disabled={!onViewDetails}
                    className={cn(
                        'inline-flex items-center gap-1 text-xs font-semibold',
                        onViewDetails ? 'text-primary-600 hover:text-primary-700' : 'text-neutral-300 cursor-not-allowed',
                    )}
                >
                    View Details <Eye className="w-3.5 h-3.5" />
                </button>
            </td>
        </tr>
    );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Statutory Detail Tab (inline)                                            */
/* ──────────────────────────────────────────────────────────────────────── */

const CATEGORY_TAB_COLUMNS: Record<StatutoryCategory, { key: string; label: string; align?: 'left' | 'right' }[]> = {
    PF: [
        { key: 'employeeCode', label: 'Code' },
        { key: 'employeeName', label: 'Name' },
        { key: 'designation', label: 'Designation' },
        { key: 'basic', label: 'Basic', align: 'right' },
        { key: 'pfBase', label: 'PF Base', align: 'right' },
        { key: 'employeeAmount', label: 'Employee PF', align: 'right' },
        { key: 'employerAmount', label: 'Employer PF', align: 'right' },
        { key: 'total', label: 'Total', align: 'right' },
    ],
    ESI: [
        { key: 'employeeCode', label: 'Code' },
        { key: 'employeeName', label: 'Name' },
        { key: 'designation', label: 'Designation' },
        { key: 'gross', label: 'Gross', align: 'right' },
        { key: 'employeeAmount', label: 'Employee ESI', align: 'right' },
        { key: 'employerAmount', label: 'Employer ESI', align: 'right' },
        { key: 'total', label: 'Total', align: 'right' },
    ],
    PT: [
        { key: 'employeeCode', label: 'Code' },
        { key: 'employeeName', label: 'Name' },
        { key: 'designation', label: 'Designation' },
        { key: 'state', label: 'State' },
        { key: 'gross', label: 'Gross', align: 'right' },
        { key: 'employeeAmount', label: 'PT Amount', align: 'right' },
    ],
    TDS: [
        { key: 'employeeCode', label: 'Code' },
        { key: 'employeeName', label: 'Name' },
        { key: 'designation', label: 'Designation' },
        { key: 'regime', label: 'Regime' },
        { key: 'gross', label: 'Gross', align: 'right' },
        { key: 'taxableIncome', label: 'Taxable Income', align: 'right' },
        { key: 'employeeAmount', label: 'TDS', align: 'right' },
    ],
    LWF: [],
};

const NUMERIC_TAB_KEYS = new Set(['basic', 'gross', 'pfBase', 'taxableIncome', 'employeeAmount', 'employerAmount', 'total']);

function StatutoryDetailTab({
    runId, category, period, totalEmployees,
}: {
    runId: string;
    category: StatutoryCategory;
    period?: string;
    totalEmployees: number;
}) {
    const detailQuery = useStatutoryDetails(runId, category, true);
    const [search, setSearch] = useState('');
    const columns = CATEGORY_TAB_COLUMNS[category];

    const rows: any[] = useMemo(() => {
        const data: any = detailQuery.data?.data;
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if (Array.isArray(data.rows)) return data.rows;
        if (Array.isArray(data.employees)) return data.employees;
        return [];
    }, [detailQuery.data]);

    const filtered = useMemo(() => {
        if (!search.trim()) return rows;
        const q = search.toLowerCase();
        return rows.filter(r =>
            String(r.employeeName ?? '').toLowerCase().includes(q) ||
            String(r.employeeCode ?? '').toLowerCase().includes(q),
        );
    }, [rows, search]);

    const totals = useMemo(() => {
        const t: Record<string, number> = {};
        for (const col of columns) {
            if (NUMERIC_TAB_KEYS.has(col.key)) {
                t[col.key] = filtered.reduce((sum, r) => sum + (Number(r[col.key]) || 0), 0);
            }
        }
        return t;
    }, [filtered, columns]);

    const totalEmployee = filtered.reduce((s, r) => s + (Number(r.employeeAmount) || 0), 0);
    const totalEmployer = filtered.reduce((s, r) => s + (Number(r.employerAmount) || 0), 0);
    const grandTotal = totalEmployee + totalEmployer;

    const handleDownload = () => {
        try {
            if (!filtered.length) {
                showApiError(new Error('No data to export'));
                return;
            }
            const headers = columns.map(c => c.label);
            const dataRows = filtered.map(r =>
                columns.map(c => {
                    const v = r[c.key];
                    if (NUMERIC_TAB_KEYS.has(c.key)) return Number(v) || 0;
                    return v ?? '';
                }),
            );
            exportToExcel(headers, dataRows, {
                fileName: `${category}-Details-${period ?? 'Period'}`.replace(/\s+/g, '-'),
                sheetName: category,
                title: `${category} Details`,
                reportDate: period,
            });
        } catch (err) {
            showApiError(err);
        }
    };

    const errorObj: any = detailQuery.error as any;
    const status = errorObj?.response?.status;
    const isUnavailable = status === 404;
    const isLoading = detailQuery.isLoading;
    const hasError = !!detailQuery.error && !isUnavailable;

    return (
        <div className="p-5 space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <SmallStat label="Employees" value={isLoading ? '…' : filtered.length} sub={totalEmployees ? `of ${totalEmployees}` : undefined} tint="primary" />
                <SmallStat label="Employee Contribution" value={formatINR(totalEmployee)} tint="emerald" />
                <SmallStat label="Employer Contribution" value={category === 'PT' || category === 'TDS' ? '—' : formatINR(totalEmployer)} tint="success" />
                <SmallStat label="Grand Total" value={formatINR(category === 'PT' || category === 'TDS' ? totalEmployee : grandTotal)} tint="accent" />
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="relative flex-1 min-w-[220px] max-w-md">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by code or name..."
                        className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                </div>
                <button
                    onClick={handleDownload}
                    disabled={!filtered.length || isLoading}
                    className={cn(
                        'inline-flex items-center gap-1.5 rounded-lg border border-primary-200 bg-white px-3 py-2 text-xs font-semibold text-primary-700 hover:bg-primary-50',
                        (!filtered.length || isLoading) && 'opacity-50 cursor-not-allowed',
                    )}
                >
                    <Download className="w-3.5 h-3.5" /> Download Excel
                </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-neutral-100">
                {isLoading ? (
                    <div className="px-6 py-16 text-center text-sm text-neutral-500">
                        <Loader2 className="w-6 h-6 mx-auto animate-spin text-neutral-400 mb-2" />
                        Loading...
                    </div>
                ) : isUnavailable ? (
                    <div className="px-6 py-16 text-center text-sm text-neutral-500">
                        <Info className="w-8 h-8 mx-auto text-info-400 mb-2" />
                        Data not yet available. Detail endpoint will be enabled after backend deployment.
                    </div>
                ) : hasError ? (
                    <div className="px-6 py-16 text-center text-sm text-danger-600">
                        Failed to load details. Please refresh and try again.
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="px-6 py-16 text-center text-sm text-neutral-500">
                        No matching employees.
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-neutral-50/80">
                            <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                                {columns.map(c => (
                                    <th key={c.key} className={cn('px-4 py-3 whitespace-nowrap', c.align === 'right' && 'text-right')}>
                                        {c.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {filtered.map((r, idx) => (
                                <tr key={r.employeeId ?? r.id ?? idx} className="hover:bg-neutral-50/60">
                                    {columns.map(c => {
                                        const v = r[c.key];
                                        const isNum = NUMERIC_TAB_KEYS.has(c.key);
                                        return (
                                            <td
                                                key={c.key}
                                                className={cn('px-4 py-2.5 whitespace-nowrap', c.align === 'right' && 'text-right font-mono', isNum && 'tabular-nums')}
                                                title={isNum ? formatINR(v) : String(v ?? '')}
                                            >
                                                {isNum ? formatINR(v) : (v ?? '—')}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                            <tr className="bg-primary-50/40 font-bold">
                                {columns.map((c, idx) => {
                                    if (idx === 0) {
                                        return (
                                            <td key={c.key} className="px-4 py-3 text-[12.5px] text-primary-900" colSpan={Math.min(3, columns.length)}>
                                                Total ({filtered.length})
                                            </td>
                                        );
                                    }
                                    if (idx < 3) return null;
                                    return (
                                        <td
                                            key={c.key}
                                            className={cn('px-4 py-3 text-[12.5px] text-primary-900', c.align === 'right' && 'text-right font-mono tabular-nums')}
                                        >
                                            {NUMERIC_TAB_KEYS.has(c.key) ? formatINR(totals[c.key] ?? 0) : ''}
                                        </td>
                                    );
                                })}
                            </tr>
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

function SmallStat({ label, value, sub, tint }: { label: string; value: React.ReactNode; sub?: string; tint: 'primary' | 'success' | 'emerald' | 'accent' }) {
    const tintMap = {
        primary: 'bg-primary-50 text-primary-700 ring-primary-100',
        success: 'bg-success-50 text-success-700 ring-success-100',
        emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
        accent: 'bg-accent-50 text-accent-700 ring-accent-100',
    } as const;
    return (
        <div className={cn('rounded-xl px-4 py-3 ring-1', tintMap[tint])}>
            <div className="text-[10.5px] font-bold uppercase tracking-wider opacity-80">{label}</div>
            <div className="mt-0.5 text-[15px] font-extrabold tabular-nums truncate" title={typeof value === 'string' ? value : undefined}>
                {value}
            </div>
            {sub && <div className="text-[11px] opacity-70 mt-0.5">{sub}</div>}
        </div>
    );
}

function FileCard({
    type, fileName, employees, amount, statesCount, dueDate, fileUrl, status, onDownload, downloading, dueDateLabel,
}: {
    type: 'PF_ECR' | 'ESI_CHALLAN' | 'PT_CHALLAN' | 'TDS_24Q' | string;
    fileName: string; employees?: number; amount?: number; statesCount?: number;
    dueDate?: string | null; fileUrl?: string | null; status: 'NOT_GENERATED' | 'PENDING' | 'FILED' | string;
    onDownload?: () => void; downloading?: boolean;
    dueDateLabel?: string | null;
}) {
    const meta = {
        PF_ECR:      { label: 'PF ECR File',                 tint: 'bg-primary-50 text-primary-700' },
        ESI_CHALLAN: { label: 'ESI Challan File',            tint: 'bg-accent-50 text-accent-700' },
        PT_CHALLAN:  { label: 'Professional Tax Challan',    tint: 'bg-warning-50 text-warning-700' },
        TDS_24Q:     { label: 'TDS 24Q Data File',           tint: 'bg-danger-50 text-danger-700' },
    } as const;
    const m = (meta as any)[type] ?? { label: type, tint: 'bg-neutral-100 text-neutral-700' };
    const generated = status === 'FILED' || status === 'PENDING';
    return (
        <div className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex items-start gap-3">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-[10px]', m.tint)}>
                    {type === 'PF_ECR' ? 'ECR' : type === 'ESI_CHALLAN' ? 'ESI' : type === 'PT_CHALLAN' ? 'PT' : type === 'TDS_24Q' ? 'TDS' : '—'}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-bold text-neutral-900 truncate">{m.label}</div>
                    <div className="text-[11px] text-neutral-500 font-mono truncate">{fileName}</div>
                </div>
            </div>
            <div className="mt-3 space-y-1 text-[12px]">
                {employees !== undefined && (
                    <div className="flex items-center justify-between"><span className="text-neutral-500">Employees:</span><span className="font-bold text-neutral-900">{employees}</span></div>
                )}
                {statesCount !== undefined && (
                    <div className="flex items-center justify-between"><span className="text-neutral-500">States:</span><span className="font-bold text-neutral-900">{statesCount}</span></div>
                )}
                {amount !== undefined && (
                    <div className="flex items-center justify-between"><span className="text-neutral-500">Amount:</span><span className="font-bold text-neutral-900 font-mono">{formatINR(amount)}</span></div>
                )}
                {dueDate && (
                    <div className="flex items-center justify-between"><span className="text-neutral-500">Due:</span><span className="font-semibold text-warning-700" title={dueDate ?? undefined}>{dueDateLabel ?? dueDate}</span></div>
                )}
            </div>
            {fileUrl ? (
                <a
                    href={fileUrl}
                    className={cn(
                        'mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition',
                        'border-primary-200 bg-white text-primary-700 hover:bg-primary-50',
                    )}
                    download
                >
                    <Download className="w-3.5 h-3.5" />
                    Download
                </a>
            ) : (
                <button
                    onClick={onDownload}
                    disabled={downloading}
                    className={cn(
                        'mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition',
                        onDownload && !downloading
                            ? 'border-primary-200 bg-white text-primary-700 hover:bg-primary-50'
                            : 'border-neutral-200 bg-neutral-50 text-neutral-400 cursor-not-allowed',
                    )}
                >
                    {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    {downloading ? 'Generating...' : onDownload ? 'Download Excel' : (generated ? 'Pending file URL' : 'Not generated')}
                </button>
            )}
        </div>
    );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Main component                                                           */
/* ──────────────────────────────────────────────────────────────────────── */

export function Step4StatutoryCompliance({ runId, runDetail, completedStep, onStepAction, anyMutating }: StepProps) {
    const fmt = useCompanyFormatter();
    const isStatutoryDone = completedStep >= 4;
    const isPostApproval = completedStep >= 5;

    const summaryQuery = useStatutorySummary(runId);
    const filesQuery = useStatutoryFiles(runId);
    const runDetailQuery = usePayrollRun(runId);

    const computeMutation = useComputeStatutory();
    const resetMutation = useResetToCompute();

    const [activeTab, setActiveTab] = useState<'summary' | 'pf' | 'esi' | 'pt' | 'tds' | 'files'>('summary');
    const [detailModalCategory, setDetailModalCategory] = useState<StatutoryCategory | null>(null);
    const [logModalOpen, setLogModalOpen] = useState(false);
    const [downloadingType, setDownloadingType] = useState<string | null>(null);

    const period = useMemo(() => {
        if (!runDetail?.month || !runDetail?.year) return undefined;
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${monthNames[runDetail.month - 1]} ${runDetail.year}`;
    }, [runDetail?.month, runDetail?.year]);

    const summary: any = summaryQuery.data?.data ?? null;
    const filesData: any = filesQuery.data?.data ?? null;
    const files: any[] = filesData?.files ?? [];

    const totalEmployees = runDetail?.employeeCount ?? 0;

    // Backend `getStatutorySummary` returns a structured envelope:
    //   { totals: {...}, employeeContributions: {...}, employerContributions: {...}, eligibility: {...} }
    // Read from `totals` (canonical flat shape) with fallbacks for legacy callers.
    const totals: any        = summary?.totals ?? {};
    const empContrib: any    = summary?.employeeContributions ?? {};
    const emprContrib: any   = summary?.employerContributions ?? {};
    const eligibility: any   = summary?.eligibility ?? {};

    const pfEmp        = Number(totals?.pfEmployee ?? empContrib?.pfEmployeeTotal ?? summary?.pfEmployeeTotal ?? 0);
    const pfEmpr       = Number(totals?.pfEmployer ?? emprContrib?.pfEmployerTotal ?? summary?.pfEmployerTotal ?? 0);
    const esiEmp       = Number(totals?.esiEmployee ?? empContrib?.esiEmployeeTotal ?? summary?.esiEmployeeTotal ?? 0);
    const esiEmpr      = Number(totals?.esiEmployer ?? emprContrib?.esiEmployerTotal ?? summary?.esiEmployerTotal ?? 0);
    const ptTotal      = Number(totals?.pt ?? empContrib?.ptTotal ?? summary?.ptTotal ?? 0);
    const tdsTotal     = Number(totals?.tds ?? empContrib?.tdsTotal ?? summary?.tdsTotal ?? 0);
    const lwfEmp       = Number(totals?.lwfEmployee ?? empContrib?.lwfEmployeeTotal ?? summary?.lwfEmployeeTotal ?? 0);
    const lwfEmpr      = Number(totals?.lwfEmployer ?? emprContrib?.lwfEmployerTotal ?? summary?.lwfEmployerTotal ?? 0);

    const pfEligible      = Number(eligibility?.pfEligible ?? summary?.pfEligible ?? 0);
    const esiEligible     = Number(eligibility?.esiEligible ?? summary?.esiEligible ?? 0);
    const ptApplicable    = Number(eligibility?.ptApplicable ?? summary?.ptApplicable ?? 0);
    const tdsApplicable   = Number(eligibility?.tdsApplicable ?? summary?.tdsApplicable ?? 0);

    const totalEmployee = pfEmp + esiEmp + ptTotal + tdsTotal + lwfEmp;
    const totalEmployer = pfEmpr + esiEmpr + lwfEmpr;
    const grandTotal = totalEmployee + totalEmployer;

    const pct = (n: number) => totalEmployees > 0 ? (n / totalEmployees) * 100 : 0;

    const onRefresh = () => { summaryQuery.refetch(); filesQuery.refetch(); runDetailQuery.refetch(); };
    const onExport = () => window.print();
    const onReset = () => {
        if (!confirm('Reset to "Computed" status so you can recompute statutory amounts. Continue?')) return;
        resetMutation.mutate(runId, {
            onSuccess: () => { showSuccess('Reset complete', 'You can now recompute statutory.'); onRefresh(); },
            onError: (err) => showApiError(err),
        });
    };

    const findFile = (t: string) => files.find(f => f.type === t);

    // File-type → statutory category for export
    const FILE_TO_CATEGORY: Record<string, StatutoryCategory> = {
        PF_ECR: 'PF',
        ESI_CHALLAN: 'ESI',
        PT_CHALLAN: 'PT',
        TDS_24Q: 'TDS',
    };

    // File type → backend statutory-files route segment
    const FILE_TYPE_TO_BACKEND_TYPE: Record<string, 'pf-ecr' | 'esi-return' | 'pt-return' | 'tds-return'> = {
        PF_ECR: 'pf-ecr',
        ESI_CHALLAN: 'esi-return',
        PT_CHALLAN: 'pt-return',
        TDS_24Q: 'tds-return',
    };

    const downloadBlob = (blob: Blob, filename: string) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    const clientSideFallbackExport = async (fileType: string, category: StatutoryCategory) => {
        const { payrollRunApi } = await import('@/lib/api/payroll-run');
        const res: any = await payrollRunApi.getStatutoryDetails(runId, category);
        const data: any = res?.data;
        const rows: any[] = Array.isArray(data)
            ? data
            : Array.isArray(data?.rows)
              ? data.rows
              : Array.isArray(data?.employees)
                ? data.employees
                : [];
        if (!rows.length) {
            throw new Error('No data available to export');
        }
        const cols = CATEGORY_TAB_COLUMNS[category];
        const headers = cols.map(c => c.label);
        const dataRows = rows.map(r =>
            cols.map(c => {
                const v = r[c.key];
                if (NUMERIC_TAB_KEYS.has(c.key)) return Number(v) || 0;
                return v ?? '';
            }),
        );
        exportToExcel(headers, dataRows, {
            fileName: `${fileType.replace(/_/g, '-')}-${period ?? 'Period'}`.replace(/\s+/g, '-'),
            sheetName: category,
            title: `${fileType.replace(/_/g, ' ')} — ${period ?? ''}`,
            reportDate: period,
        });
    };

    const handleFileDownload = async (fileType: string) => {
        const category = FILE_TO_CATEGORY[fileType];
        const backendType = FILE_TYPE_TO_BACKEND_TYPE[fileType];
        if (!category || !backendType) {
            showApiError(new Error('Unknown file type'));
            return;
        }
        try {
            setDownloadingType(fileType);
            // Prefer backend-generated Excel file
            const { payrollRunApi } = await import('@/lib/api/payroll-run');
            try {
                const blob = await payrollRunApi.downloadStatutoryFile(runId, backendType);
                const filename = `${fileType.replace(/_/g, '-')}-${period ?? 'Period'}`.replace(/\s+/g, '-') + '.xlsx';
                downloadBlob(blob, filename);
                showSuccess('Download ready', `${fileType.replace(/_/g, ' ')} exported.`);
                return;
            } catch (err: any) {
                // Fall back to client-side Excel build ONLY on 404 (backend endpoint absent)
                if (err?.response?.status === 404) {
                    await clientSideFallbackExport(fileType, category);
                    showSuccess('Download ready', `${fileType.replace(/_/g, ' ')} exported (client-side).`);
                    return;
                }
                throw err;
            }
        } catch (err: any) {
            showApiError(err);
        } finally {
            setDownloadingType(null);
        }
    };

    const importantDates = useMemo(() => {
        const m = runDetail?.month;
        const y = runDetail?.year;
        if (!m || !y) return [];
        const next = m === 12 ? { m: 1, y: y + 1 } : { m: m + 1, y };
        // Indian deadlines per backend logic
        const pfDue = new Date(next.y, next.m - 1, 15);
        const esiDue = new Date(next.y, next.m - 1, 15);
        const ptDue = new Date(next.y, next.m - 1, 20);
        let tdsDue: Date;
        if (m >= 1 && m <= 3)      tdsDue = new Date(y, 4, 31);
        else if (m >= 4 && m <= 6) tdsDue = new Date(y, 6, 31);
        else if (m >= 7 && m <= 9) tdsDue = new Date(y, 9, 31);
        else                        tdsDue = new Date(y + 1, 0, 31);
        return [
            { label: 'PF ECR Due Date',        date: pfDue },
            { label: 'ESI Challan Due Date',   date: esiDue },
            { label: 'Professional Tax Due Date', date: ptDue },
            { label: 'TDS (24Q) Filing Due Date', date: tdsDue },
        ];
    }, [runDetail]);

    const complianceMeter = filesData?.complianceMeter;
    const computeStatusByType = useMemo(() => {
        const set = new Set(files.map((f: any) => f.type));
        return {
            PF: set.has('PF_ECR'),
            ESI: set.has('ESI_CHALLAN'),
            PT: set.has('PT_CHALLAN'),
            TDS: set.has('TDS_24Q'),
        };
    }, [files]);

    const computedOn = runDetail?.lockedAt ?? null;
    const computedBy = runDetail?.lockedByName ?? runDetail?.createdByName ?? null;

    const isLoading = (summaryQuery.isLoading || filesQuery.isLoading) && !summary;

    return (
        <div className="space-y-5">
            {/* Step header + About */}
            <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
                <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <div className="text-[11px] font-bold uppercase tracking-wider text-primary-600">Step 4 of 6</div>
                            <h2 className="mt-1 text-xl font-bold text-neutral-900">Statutory Deductions</h2>
                            <p className="mt-1.5 text-[13px] text-neutral-600 max-w-2xl leading-snug">
                                Statutory deductions have been computed for all applicable employees. Review the summary below.
                                You can download statutory files and challan data for submission.
                            </p>
                        </div>
                        <PayrollActionsDropdown onRefresh={onRefresh} onExport={onExport} onReset={onReset} allowReset={isStatutoryDone && !isPostApproval} />
                    </div>

                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 rounded-xl bg-neutral-50/70 p-3 ring-1 ring-neutral-100">
                        <MetaPill icon={Calendar} label="Payroll Period" value={runDetail?.month && runDetail?.year ? `${fmt.date(new Date(runDetail.year, runDetail.month - 1, 1).toISOString())} – ${fmt.date(new Date(runDetail.year, runDetail.month, 0).toISOString())}` : '—'} tint="info" />
                        <MetaPill icon={Clock} label="Cut-off Day" value={runDetail?.month && runDetail?.year ? fmt.date(new Date(runDetail.year, runDetail.month, 0).toISOString()) : '—'} tint="accent" />
                        <MetaPill icon={Calculator} label="LOP Method" value="÷ Working Days" tint="warning" />
                        <MetaPill icon={CheckCircle2} label="Pro-rata Rules" value="Enabled" tint="success" />
                    </div>
                </div>

                <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-info-50 text-info-600 flex items-center justify-center">
                            <Info className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-bold text-neutral-900">About this step</h3>
                    </div>
                    <p className="text-[12.5px] text-neutral-600 leading-relaxed">
                        In this step, statutory deductions are finalized and required files are generated for submission to
                        respective authorities.
                    </p>
                    <a href="#" className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-semibold text-primary-600 hover:text-primary-700">
                        <BookOpen className="w-3.5 h-3.5" /> Learn more →
                    </a>
                </div>
            </div>

            {/* KPI strip — 7 tiles */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-7 gap-3">
                <StatTile icon={Users}   label="Total Employees"        value={totalEmployees}             sub="Active Employees" tint="primary" />
                <StatTile icon={Shield}  label="PF (Employee Share)"    value={formatINR(pfEmp)}           sub={`${pfEligible} Employees`} tint="emerald" />
                <StatTile icon={Shield}  label="PF (Employer Share)"    value={formatINR(pfEmpr)}          sub={`${pfEligible} Employees`} tint="success" />
                <StatTile icon={Receipt} label="ESI (Employee Share)"   value={formatINR(esiEmp)}          sub={`${esiEligible} Employees`} tint="info" />
                <StatTile icon={Receipt} label="ESI (Employer Share)"   value={formatINR(esiEmpr)}         sub={`${esiEligible} Employees`} tint="accent" />
                <StatTile icon={Percent} label="Professional Tax"       value={formatINR(ptTotal)}         sub={`${ptApplicable} Employees`} tint="warning" />
                <StatTile icon={FileText} label="TDS (Income Tax)"      value={formatINR(tdsTotal)}        sub={`${tdsApplicable} Employees`} tint="danger" />
            </div>

            {/* Two-column main */}
            <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
                <div className="rounded-2xl bg-white ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
                    {/* Tabs */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 px-5 pt-4">
                        <div className="flex gap-6 overflow-x-auto">
                            {([
                                { id: 'summary', label: 'Statutory Summary' },
                                { id: 'pf',      label: 'PF ECR Details' },
                                { id: 'esi',     label: 'ESI Details' },
                                { id: 'pt',      label: 'Professional Tax Details' },
                                { id: 'tds',     label: 'TDS Details' },
                                { id: 'files',   label: 'Generated Files' },
                            ] as const).map(t => (
                                <button key={t.id} onClick={() => setActiveTab(t.id)}
                                    className={cn(
                                        'pb-3 text-sm font-bold border-b-2 transition whitespace-nowrap',
                                        activeTab === t.id ? 'border-primary-600 text-primary-700' : 'border-transparent text-neutral-500 hover:text-neutral-800',
                                    )}>
                                    {t.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 pb-3">
                            <button className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50">
                                <Filter className="w-3 h-3" /> Filters
                            </button>
                            <button className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 bg-white px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-50">
                                <Download className="w-3 h-3" /> Export
                            </button>
                        </div>
                    </div>

                    {activeTab === 'summary' ? (
                        <div className="overflow-x-auto">
                            {isLoading ? (
                                <div className="p-5"><SkeletonTable rows={5} cols={6} /></div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 bg-neutral-50/60">
                                            <th className="px-4 py-3">Statutory Component</th>
                                            <th className="px-4 py-3 whitespace-nowrap">Applicable Employees</th>
                                            <th className="px-4 py-3 text-right whitespace-nowrap">Employee Amount (₹)</th>
                                            <th className="px-4 py-3 text-right whitespace-nowrap">Employer Amount (₹)</th>
                                            <th className="px-4 py-3 text-right whitespace-nowrap">Total Amount (₹)</th>
                                            <th className="px-4 py-3 whitespace-nowrap">Status</th>
                                            <th className="px-4 py-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100">
                                        <ComponentRow component="Provident Fund (PF)" code="EPFO" applicable={pfEligible} applicablePct={pct(pfEligible)} employeeAmount={pfEmp} employerAmount={pfEmpr} total={pfEmp + pfEmpr} computed={computeStatusByType.PF || pfEmp > 0} onViewDetails={() => setDetailModalCategory('PF')} />
                                        <ComponentRow component="Employees' State Insurance (ESI)" code="ESIC" applicable={esiEligible} applicablePct={pct(esiEligible)} employeeAmount={esiEmp} employerAmount={esiEmpr} total={esiEmp + esiEmpr} computed={computeStatusByType.ESI || esiEmp > 0} onViewDetails={() => setDetailModalCategory('ESI')} />
                                        <ComponentRow component="Professional Tax (PT)" code="State Wise" applicable={ptApplicable} applicablePct={pct(ptApplicable)} employeeAmount={ptTotal} employerAmount={null} total={ptTotal} computed={computeStatusByType.PT || ptTotal > 0} onViewDetails={() => setDetailModalCategory('PT')} />
                                        <ComponentRow component="Tax Deducted at Source (TDS)" code="Income Tax" applicable={tdsApplicable} applicablePct={pct(tdsApplicable)} employeeAmount={tdsTotal} employerAmount={null} total={tdsTotal} computed={computeStatusByType.TDS || tdsTotal > 0} onViewDetails={() => setDetailModalCategory('TDS')} />
                                        {(lwfEmp > 0 || lwfEmpr > 0) && (
                                            <ComponentRow component="Labour Welfare Fund (LWF)" code="State Wise" applicable={totalEmployees} applicablePct={100} employeeAmount={lwfEmp} employerAmount={lwfEmpr} total={lwfEmp + lwfEmpr} computed={true} onViewDetails={() => setDetailModalCategory('LWF')} />
                                        )}
                                        <tr className="bg-primary-50/40">
                                            <td className="px-4 py-3.5 text-[13px] font-bold text-primary-900">Total</td>
                                            <td className="px-4 py-3.5 text-[13px] font-bold text-primary-900">{totalEmployees}</td>
                                            <td className="px-4 py-3.5 text-right text-[13px] font-bold text-primary-900 font-mono">{formatINR(totalEmployee)}</td>
                                            <td className="px-4 py-3.5 text-right text-[13px] font-bold text-primary-900 font-mono">{formatINR(totalEmployer)}</td>
                                            <td className="px-4 py-3.5 text-right text-[13px] font-bold text-primary-900 font-mono">{formatINR(grandTotal)}</td>
                                            <td className="px-4 py-3.5" />
                                            <td className="px-4 py-3.5" />
                                        </tr>
                                    </tbody>
                                </table>
                            )}
                        </div>
                    ) : activeTab === 'files' ? (
                        <div className="p-5">
                            {files.length === 0 ? (
                                <div className="space-y-3">
                                    <div className="px-6 py-8 text-center text-sm text-neutral-500 rounded-xl bg-neutral-50/60 ring-1 ring-neutral-100">
                                        <Info className="w-8 h-8 mx-auto text-info-400 mb-2" />
                                        No pre-generated statutory files for this run. You can still export per-employee data below.
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {(['PF_ECR', 'ESI_CHALLAN', 'PT_CHALLAN', 'TDS_24Q'] as const).map(t => (
                                            <FileCard
                                                key={t}
                                                type={t}
                                                fileName={`${t}_${runDetail?.month ?? ''}_${runDetail?.year ?? ''}.xlsx`}
                                                fileUrl={null}
                                                status="NOT_GENERATED"
                                                onDownload={() => handleFileDownload(t)}
                                                downloading={downloadingType === t}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-3">
                                    {files.map((f: any) => (
                                        <FileCard
                                            key={f.id ?? f.type}
                                            type={f.type}
                                            fileName={f.label ?? `${f.type}_${runDetail?.month}_${runDetail?.year}.xml`}
                                            employees={f.employeeCount}
                                            amount={f.amount}
                                            dueDate={f.dueDate}
                                            dueDateLabel={f.dueDate ? fmt.date(f.dueDate) : null}
                                            fileUrl={f.fileUrl}
                                            status={f.status}
                                            onDownload={f.fileUrl ? undefined : () => handleFileDownload(f.type)}
                                            downloading={downloadingType === f.type}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <StatutoryDetailTab
                            runId={runId}
                            category={activeTab.toUpperCase() as StatutoryCategory}
                            period={period}
                            totalEmployees={totalEmployees}
                        />
                    )}
                </div>

                {/* Sidebar */}
                <aside className="space-y-4">
                    {/* Compliance Status */}
                    <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                        <h3 className="text-sm font-bold text-neutral-900 mb-3">Statutory Compliance Status</h3>
                        <ul className="space-y-2.5">
                            <ComplianceRow label="PF"            ready={computeStatusByType.PF}  text={computeStatusByType.PF ? 'Ready for Submission' : 'Pending'} />
                            <ComplianceRow label="ESI"           ready={computeStatusByType.ESI} text={computeStatusByType.ESI ? 'Ready for Submission' : 'Pending'} />
                            <ComplianceRow label="Professional Tax" ready={computeStatusByType.PT} text={computeStatusByType.PT ? 'Ready for Submission' : 'Pending'} />
                            <ComplianceRow label="TDS (24Q)"     ready={computeStatusByType.TDS} text={computeStatusByType.TDS ? 'Ready for Filing' : 'Pending'} />
                        </ul>
                        {complianceMeter && (
                            <div className="mt-3 rounded-lg bg-neutral-50/70 p-2.5 text-[12px]">
                                <div className="flex items-center justify-between">
                                    <span className="text-neutral-600">Compliance Score</span>
                                    <span className="font-bold text-neutral-900">{complianceMeter.score}/100</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Important dates */}
                    <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                        <h3 className="text-sm font-bold text-neutral-900 mb-3">Important Dates</h3>
                        <ul className="space-y-2.5">
                            {importantDates.map(d => (
                                <li key={d.label} className="flex items-center justify-between text-[12.5px]">
                                    <span className="text-neutral-700">{d.label}</span>
                                    <span className="font-bold text-neutral-900 whitespace-nowrap" title={d.date.toISOString()}>{fmt.date(d.date.toISOString())}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Generated Files Summary */}
                    <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                        <h3 className="text-sm font-bold text-neutral-900 mb-3">Generated Files Summary</h3>
                        <ul className="space-y-2">
                            {[
                                { type: 'PF_ECR',      label: 'PF ECR File' },
                                { type: 'ESI_CHALLAN', label: 'ESI Challan File' },
                                { type: 'PT_CHALLAN',  label: 'Professional Tax Challan File' },
                                { type: 'TDS_24Q',     label: 'TDS 24Q Data File' },
                            ].map(item => {
                                const f = findFile(item.type);
                                const dl = downloadingType === item.type;
                                return (
                                    <li key={item.type} className="flex items-center justify-between text-[12.5px]">
                                        <span className="text-neutral-700">{item.label}</span>
                                        <span className="flex items-center gap-2">
                                            <span className="font-bold text-neutral-900">{f ? 1 : 0}</span>
                                            {f?.fileUrl ? (
                                                <a
                                                    href={f.fileUrl}
                                                    download
                                                    className="inline-flex items-center justify-center w-6 h-6 rounded-md text-primary-600 hover:bg-primary-50"
                                                    title={`Download ${item.label}`}
                                                >
                                                    <Download className="w-3.5 h-3.5" />
                                                </a>
                                            ) : (
                                                <button
                                                    onClick={() => handleFileDownload(item.type)}
                                                    disabled={dl}
                                                    className="inline-flex items-center justify-center w-6 h-6 rounded-md text-primary-600 hover:bg-primary-50 disabled:text-neutral-300 disabled:cursor-not-allowed"
                                                    title={`Generate & download ${item.label}`}
                                                >
                                                    {dl ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                                                </button>
                                            )}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    {/* Need Help */}
                    <div className="relative overflow-hidden rounded-2xl p-5 shadow-lg shadow-primary-500/20">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700" />
                        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
                        <div className="relative">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center">
                                    <Headphones className="w-4 h-4 text-white" />
                                </div>
                                <h3 className="text-sm font-bold text-white">Need Help?</h3>
                            </div>
                            <p className="text-[12.5px] text-white/80 mb-3">Contact Payroll Support Team</p>
                            <a href="mailto:payroll.support@avyerp.com" className="flex items-center gap-2 text-[12.5px] text-white hover:text-white/90"><Mail className="w-3.5 h-3.5" /> payroll.support@avyerp.com</a>
                            <a href="tel:+91 9019189889" className="flex items-center gap-2 text-[12.5px] text-white hover:text-white/90 mt-1.5"><Phone className="w-3.5 h-3.5" /> +91 9019189889</a>
                        </div>
                    </div>
                </aside>
            </div>

            {/* Warning */}
            {!isPostApproval && (
                <div className="rounded-2xl bg-warning-50/70 p-4 ring-1 ring-warning-200">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-warning-600 shrink-0 mt-0.5" />
                        <p className="text-[13px] text-warning-800 font-medium">
                            Please verify the statutory amounts and generated files before proceeding. Any changes in salary or employee data will require re-computation.
                        </p>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-3 text-[12.5px] text-neutral-600">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Step 3 (Compute Salaries)</span>
                </div>
                <div className="text-[12.5px] text-neutral-500">
                    {computedOn ? (
                        <>All statutory amounts computed on <span className="font-semibold text-neutral-700">{fmt.date(computedOn)} {fmt.time(computedOn)}</span>{computedBy ? <> by <span className="font-semibold text-neutral-700">{computedBy}</span></> : null}</>
                    ) : (
                        <>Statutory not yet computed</>
                    )}
                    <button
                        type="button"
                        onClick={() => setLogModalOpen(true)}
                        className="ml-3 inline-flex items-center gap-1 font-semibold text-primary-600 hover:text-primary-700"
                    >
                        View Computation Log
                    </button>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={onReset}
                        disabled={!isStatutoryDone || isPostApproval || resetMutation.isPending}
                        className={cn(
                            'inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50',
                            (!isStatutoryDone || isPostApproval) && 'opacity-50 cursor-not-allowed',
                        )}
                    >
                        <Save className="w-3.5 h-3.5" /> Save & Recalculate
                    </button>
                    <button
                        disabled={isStatutoryDone || anyMutating}
                        onClick={() => {
                            if (computeMutation.isPending) return;
                            // If the run is still at COMPUTED status, statutory hasn't been computed yet —
                            // call computeStatutory first; otherwise call onStepAction (which advances the wizard).
                            const status = (runDetail?.status ?? '').toUpperCase();
                            if (status === 'COMPUTED') {
                                computeMutation.mutate(runId, {
                                    onSuccess: () => { showSuccess('Statutory Computed', 'PF, ESI, PT, TDS calculated.'); onStepAction(); },
                                    onError: (err) => showApiError(err),
                                });
                            } else {
                                onStepAction();
                            }
                        }}
                        className={cn(
                            'inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold shadow-sm transition',
                            isStatutoryDone
                                ? 'bg-success-100 text-success-700 cursor-default'
                                : 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-primary-500/25 hover:from-primary-700 hover:to-accent-700',
                            anyMutating && 'opacity-60 cursor-not-allowed',
                        )}
                    >
                        {(anyMutating || computeMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {isStatutoryDone ? 'Statutory Computed' : 'Next: Proceed to Step 5 (Approval)'}
                        {!isStatutoryDone && <ArrowRight className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Modals */}
            <StatutoryDetailModal
                open={detailModalCategory !== null}
                onClose={() => setDetailModalCategory(null)}
                runId={runId}
                category={detailModalCategory ?? 'PF'}
                period={period}
            />
            <ComputationLogModal
                open={logModalOpen}
                onClose={() => setLogModalOpen(false)}
                runId={runId}
            />
        </div>
    );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Small atoms                                                              */
/* ──────────────────────────────────────────────────────────────────────── */

function MetaPill({
    icon: Icon, label, value, tint,
}: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; tint: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'accent' }) {
    const tintMap = {
        primary: 'bg-primary-100 text-primary-600',
        success: 'bg-success-100 text-success-600',
        warning: 'bg-warning-100 text-warning-600',
        danger:  'bg-danger-100 text-danger-600',
        info:    'bg-info-100 text-info-600',
        accent:  'bg-accent-100 text-accent-600',
    } as const;
    return (
        <div className="flex items-center gap-2.5 min-w-0">
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', tintMap[tint])}>
                <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">{label}</div>
                <div className="text-[12.5px] font-bold text-neutral-900 truncate">{value}</div>
            </div>
        </div>
    );
}

function ComplianceRow({ label, ready, text }: { label: string; ready: boolean; text: string }) {
    return (
        <li className="flex items-center justify-between text-[12.5px]">
            <span className="flex items-center gap-2 text-neutral-700">
                {ready ? <CheckCircle2 className="w-4 h-4 text-success-600" /> : <Clock className="w-4 h-4 text-neutral-400" />}
                {label}
            </span>
            <span className={cn('font-semibold whitespace-nowrap', ready ? 'text-success-600' : 'text-neutral-500')}>{text}</span>
        </li>
    );
}
