import { useMemo, useState, useEffect } from 'react';
import { X, Search, Download, Loader2, AlertCircle, FileX } from 'lucide-react';
import { useStatutoryDetails } from '@/features/company-admin/api/use-payroll-run-queries';
import { exportToExcel } from '@/lib/export-utils';
import { showApiError } from '@/lib/toast';
import { cn } from '@/lib/utils';

export type StatutoryCategory = 'PF' | 'ESI' | 'PT' | 'TDS' | 'LWF';

interface Props {
    open: boolean;
    onClose: () => void;
    runId: string;
    category: StatutoryCategory;
    period?: string;
}

const formatINR = (v: unknown): string => `₹${(Number(v) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const CATEGORY_META: Record<StatutoryCategory, { title: string; columns: { key: string; label: string; align?: 'left' | 'right' }[] }> = {
    PF: {
        title: 'PF (Provident Fund)',
        columns: [
            { key: 'employeeCode', label: 'Code' },
            { key: 'employeeName', label: 'Name' },
            { key: 'designation', label: 'Designation' },
            { key: 'basic', label: 'Basic', align: 'right' },
            { key: 'gross', label: 'Gross', align: 'right' },
            { key: 'pfBase', label: 'PF Base', align: 'right' },
            { key: 'employeeAmount', label: 'Employee PF', align: 'right' },
            { key: 'employerAmount', label: 'Employer PF', align: 'right' },
            { key: 'total', label: 'Total', align: 'right' },
        ],
    },
    ESI: {
        title: 'ESI (Employees\' State Insurance)',
        columns: [
            { key: 'employeeCode', label: 'Code' },
            { key: 'employeeName', label: 'Name' },
            { key: 'designation', label: 'Designation' },
            { key: 'gross', label: 'Gross', align: 'right' },
            { key: 'employeeAmount', label: 'Employee ESI', align: 'right' },
            { key: 'employerAmount', label: 'Employer ESI', align: 'right' },
            { key: 'total', label: 'Total', align: 'right' },
        ],
    },
    PT: {
        title: 'PT (Professional Tax)',
        columns: [
            { key: 'employeeCode', label: 'Code' },
            { key: 'employeeName', label: 'Name' },
            { key: 'designation', label: 'Designation' },
            { key: 'state', label: 'State' },
            { key: 'gross', label: 'Gross', align: 'right' },
            { key: 'employeeAmount', label: 'PT Amount', align: 'right' },
        ],
    },
    TDS: {
        title: 'TDS (Tax Deducted at Source)',
        columns: [
            { key: 'employeeCode', label: 'Code' },
            { key: 'employeeName', label: 'Name' },
            { key: 'designation', label: 'Designation' },
            { key: 'regime', label: 'Regime' },
            { key: 'gross', label: 'Gross', align: 'right' },
            { key: 'taxableIncome', label: 'Taxable Income', align: 'right' },
            { key: 'employeeAmount', label: 'TDS', align: 'right' },
        ],
    },
    LWF: {
        title: 'LWF (Labour Welfare Fund)',
        columns: [
            { key: 'employeeCode', label: 'Code' },
            { key: 'employeeName', label: 'Name' },
            { key: 'designation', label: 'Designation' },
            { key: 'state', label: 'State' },
            { key: 'employeeAmount', label: 'Employee LWF', align: 'right' },
            { key: 'employerAmount', label: 'Employer LWF', align: 'right' },
            { key: 'total', label: 'Total', align: 'right' },
        ],
    },
};

const NUMERIC_KEYS = new Set(['basic', 'gross', 'pfBase', 'taxableIncome', 'employeeAmount', 'employerAmount', 'total']);

export function StatutoryDetailModal({ open, onClose, runId, category, period }: Props) {
    const detailQuery = useStatutoryDetails(runId, category, open);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (!open) setSearch('');
    }, [open]);

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

    const meta = CATEGORY_META[category];

    const totals = useMemo(() => {
        const t: Record<string, number> = {};
        for (const col of meta.columns) {
            if (NUMERIC_KEYS.has(col.key)) {
                t[col.key] = filtered.reduce((sum, r) => sum + (Number(r[col.key]) || 0), 0);
            }
        }
        return t;
    }, [filtered, meta.columns]);

    const handleDownload = () => {
        try {
            if (!filtered.length) {
                showApiError(new Error('No data to export'));
                return;
            }
            const headers = meta.columns.map(c => c.label);
            const dataRows = filtered.map(r =>
                meta.columns.map(c => {
                    const v = r[c.key];
                    if (NUMERIC_KEYS.has(c.key)) return Number(v) || 0;
                    return v ?? '';
                }),
            );
            exportToExcel(headers, dataRows, {
                fileName: `${category}-Details-${period ?? 'Period'}`.replace(/\s+/g, '-'),
                sheetName: category,
                title: `${meta.title} Details`,
                reportDate: period,
            });
        } catch (err) {
            showApiError(err);
        }
    };

    if (!open) return null;

    const errorObj: any = detailQuery.error as any;
    const status = errorObj?.response?.status;
    const isUnavailable = status === 404;
    const isLoading = detailQuery.isLoading;
    const hasError = !!detailQuery.error && !isUnavailable;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
                    <div>
                        <h2 className="text-lg font-bold text-neutral-900">
                            {meta.title} Details
                            {period && <span className="text-neutral-500 font-medium"> — {period}</span>}
                        </h2>
                        <p className="text-xs text-neutral-500 mt-0.5">
                            Per-employee breakdown ({rows.length} {rows.length === 1 ? 'employee' : 'employees'})
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-b border-neutral-100 bg-neutral-50/50">
                    <div className="relative flex-1 min-w-[220px] max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by code or name..."
                            className="w-full rounded-lg border border-neutral-200 bg-white pl-9 pr-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
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

                {/* Body */}
                <div className="flex-1 overflow-auto">
                    {isLoading ? (
                        <div className="px-6 py-16 text-center text-sm text-neutral-500">
                            <Loader2 className="w-6 h-6 mx-auto animate-spin text-neutral-400 mb-2" />
                            Loading...
                        </div>
                    ) : isUnavailable ? (
                        <div className="px-6 py-16 text-center text-sm text-neutral-500">
                            <FileX className="w-8 h-8 mx-auto text-neutral-400 mb-2" />
                            Data not yet available. The detail endpoint will be enabled after backend deployment.
                        </div>
                    ) : hasError ? (
                        <div className="px-6 py-16 text-center text-sm text-danger-600">
                            <AlertCircle className="w-8 h-8 mx-auto text-danger-500 mb-2" />
                            Failed to load details. Please try again.
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="px-6 py-16 text-center text-sm text-neutral-500">
                            No employees found.
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-neutral-50/80 sticky top-0">
                                <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                                    {meta.columns.map(c => (
                                        <th
                                            key={c.key}
                                            className={cn('px-4 py-3 whitespace-nowrap', c.align === 'right' && 'text-right')}
                                        >
                                            {c.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                                {filtered.map((r, idx) => (
                                    <tr key={r.employeeId ?? r.id ?? idx} className="hover:bg-neutral-50/60">
                                        {meta.columns.map(c => {
                                            const v = r[c.key];
                                            const isNum = NUMERIC_KEYS.has(c.key);
                                            return (
                                                <td
                                                    key={c.key}
                                                    className={cn(
                                                        'px-4 py-2.5 whitespace-nowrap',
                                                        c.align === 'right' && 'text-right font-mono',
                                                        isNum && 'tabular-nums',
                                                    )}
                                                    title={isNum ? formatINR(v) : String(v ?? '')}
                                                >
                                                    {isNum ? formatINR(v) : (v ?? '—')}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                                {/* Totals */}
                                <tr className="bg-primary-50/40 font-bold sticky bottom-0">
                                    {meta.columns.map((c, idx) => {
                                        if (idx === 0) {
                                            return (
                                                <td key={c.key} className="px-4 py-3 text-[12.5px] text-primary-900" colSpan={Math.min(3, meta.columns.length)}>
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
                                                {NUMERIC_KEYS.has(c.key) ? formatINR(totals[c.key] ?? 0) : ''}
                                            </td>
                                        );
                                    })}
                                </tr>
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end px-6 py-3 border-t border-neutral-100 bg-neutral-50/50">
                    <button
                        onClick={onClose}
                        className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
