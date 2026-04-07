import { useState, useMemo } from 'react';
import {
    FileText, Download, CheckCircle2, Clock, AlertCircle,
    TrendingDown, IndianRupee, Calendar, ChevronRight, ChevronDown,
    BarChart3, Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMyForm16 } from '@/features/company-admin/api';
import { Skeleton } from '@/components/ui/Skeleton';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

/* ── helpers ── */

const num = (v: unknown): number => {
    const n = Number(v ?? 0);
    return Number.isFinite(n) ? n : 0;
};

const fmt = (amount: number) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount);

const MONTH_NAMES = [
    'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
    'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar',
];
const MONTH_FULL = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

/** Map a payslip {month, year} to "FY YYYY-YY" label */
function toFY(month: number, year: number): string {
    return month >= 4
        ? `${year}-${String(year + 1).slice(-2)}`
        : `${year - 1}-${String(year).slice(-2)}`;
}

/** Sort months in Indian financial-year order (Apr=1 → Mar=12) */
function fyMonthOrder(month: number): number {
    return month >= 4 ? month - 4 : month + 8;
}

/* ── sub-components ── */

function KPITile({
    label,
    value,
    sub,
    color = 'default',
    icon: Icon,
}: {
    label: string;
    value: string;
    sub?: string;
    color?: 'default' | 'danger' | 'success' | 'warning';
    icon: React.ComponentType<{ className?: string }>;
}) {
    const colorMap = {
        default: 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400',
        danger: 'bg-danger-50 dark:bg-danger-900/20 text-danger-600 dark:text-danger-400',
        success: 'bg-success-50 dark:bg-success-900/20 text-success-600 dark:text-success-400',
        warning: 'bg-warning-50 dark:bg-warning-900/20 text-warning-600 dark:text-warning-400',
    };
    const valMap = {
        default: 'text-primary-950 dark:text-white',
        danger: 'text-danger-700 dark:text-danger-400',
        success: 'text-success-700 dark:text-success-400',
        warning: 'text-warning-700 dark:text-warning-400',
    };
    return (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 p-5 shadow-sm flex flex-col gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', colorMap[color])}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{label}</p>
                <p className={cn('text-2xl font-bold mt-0.5 tabular-nums', valMap[color])}>{value}</p>
                {sub && <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

function CertificateBanner({ records }: { records: any[] }) {
    if (records.length > 0) {
        return (
            <div className="bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800/50 rounded-2xl p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-success-600 dark:text-success-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-success-700 dark:text-success-400">Form 16 Certificates Available</p>
                    <p className="text-xs text-success-600/80 dark:text-success-500 mt-0.5">
                        {records.length} certificate(s) issued by your employer. Download them below.
                    </p>
                </div>
                <div className="flex flex-col gap-2">
                    {records.map((r: any) => (
                        <button
                            key={r.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-success-600 hover:bg-success-700 text-white text-xs font-bold rounded-xl transition-colors"
                        >
                            <Download className="w-3.5 h-3.5" />
                            FY {r.financialYear ?? r.fy}
                        </button>
                    ))}
                </div>
            </div>
        );
    }
    return (
        <div className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800/50 rounded-2xl p-4 flex items-start gap-3">
            <Clock className="w-5 h-5 text-warning-600 dark:text-warning-400 flex-shrink-0 mt-0.5" />
            <div>
                <p className="text-sm font-bold text-warning-700 dark:text-warning-400">Form 16 Not Yet Issued</p>
                <p className="text-xs text-warning-600/80 dark:text-warning-500 mt-0.5">
                    Your employer has not yet issued a Form 16 certificate for this financial year. It is typically issued after 31st May. The summary below is computed from your payslips.
                </p>
            </div>
        </div>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TdsTooltip({ active, payload }: any) {
    if (!active || !payload?.[0]) return null;
    const d = payload[0].payload;
    return (
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg p-2.5 text-xs">
            <p className="font-bold text-neutral-800 dark:text-white mb-1">{d.label}</p>
            <p className="text-danger-600 dark:text-danger-400">TDS: <span className="font-semibold">{fmt(d.tds)}</span></p>
            <p className="text-neutral-500 dark:text-neutral-400">Gross: <span className="font-semibold">{fmt(d.gross)}</span></p>
        </div>
    );
}

/* ── main screen ── */

export function MyForm16Screen() {
    const { data, isLoading } = useMyForm16();
    const form16Records: any[] = data?.data?.form16Records ?? [];
    const payslips: any[] = data?.data?.payslips ?? [];

    // Group payslips by financial year
    const byYear = useMemo(() => {
        const map: Record<string, any[]> = {};
        for (const p of payslips) {
            const fy = toFY(num(p.month), num(p.year));
            if (!map[fy]) map[fy] = [];
            map[fy].push(p);
        }
        return map;
    }, [payslips]);

    const fyOptions = Object.keys(byYear).sort((a, b) => b.localeCompare(a));
    const [selectedFY, setSelectedFY] = useState<string | null>(null);
    const activeFY = selectedFY ?? fyOptions[0] ?? null;
    const slips = activeFY ? (byYear[activeFY] ?? []) : [];

    // Sort slips in FY month order (Apr → Mar)
    const sortedSlips = useMemo(
        () => [...slips].sort((a, b) => fyMonthOrder(num(a.month)) - fyMonthOrder(num(b.month))),
        [slips]
    );

    // Totals (num() handles string→number)
    const totalGross = slips.reduce((s, p) => s + num(p.grossEarnings), 0);
    const totalTds = slips.reduce((s, p) => s + num(p.tdsAmount), 0);
    const totalNet = slips.reduce((s, p) => s + num(p.netPay), 0);
    const totalDeductions = slips.reduce((s, p) => s + num(p.totalDeductions), 0);
    const effectiveTaxRate = totalGross > 0 ? (totalTds / totalGross) * 100 : 0;

    // Chart data — monthly TDS bar
    const chartData = sortedSlips.map((p) => ({
        label: `${MONTH_NAMES[fyMonthOrder(num(p.month))]} ${String(num(p.year)).slice(-2)}`,
        tds: num(p.tdsAmount),
        gross: num(p.grossEarnings),
    }));

    const [expandedMonth, setExpandedMonth] = useState<string | null>(null);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton height={56} borderRadius={16} />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={120} borderRadius={16} />)}
                </div>
                <Skeleton height={300} borderRadius={16} />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Form 16</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Annual tax deduction certificate &amp; payslip summary</p>
                </div>
                {/* FY Tabs */}
                {fyOptions.length > 1 && (
                    <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1">
                        {fyOptions.map((fy) => (
                            <button
                                key={fy}
                                onClick={() => setSelectedFY(fy)}
                                className={cn(
                                    'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                                    activeFY === fy
                                        ? 'bg-white dark:bg-neutral-700 text-primary-700 dark:text-primary-300 shadow-sm'
                                        : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                                )}
                            >
                                FY {fy}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {payslips.length === 0 ? (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 p-16 text-center shadow-sm">
                    <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-neutral-400 dark:text-neutral-500" />
                    </div>
                    <h3 className="text-lg font-bold text-neutral-600 dark:text-neutral-400">No Tax Records</h3>
                    <p className="text-neutral-400 dark:text-neutral-500 text-sm mt-1 max-w-xs mx-auto">
                        Form 16 data will appear here after payroll is processed for the financial year.
                    </p>
                </div>
            ) : (
                <>
                    {/* Certificate status banner */}
                    <CertificateBanner records={form16Records} />

                    {/* KPI row */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <KPITile label="Gross Earnings" value={fmt(totalGross)} sub={`FY ${activeFY}`} icon={IndianRupee} color="default" />
                        <KPITile label="TDS Deducted" value={fmt(totalTds)} sub={`Across ${slips.length} months`} icon={TrendingDown} color="danger" />
                        <KPITile label="Net Pay" value={fmt(totalNet)} sub="Take-home earnings" icon={CheckCircle2} color="success" />
                        <KPITile
                            label="Effective Tax Rate"
                            value={`${effectiveTaxRate.toFixed(2)}%`}
                            sub="TDS / Gross earnings"
                            icon={BarChart3}
                            color="warning"
                        />
                    </div>

                    {/* Monthly TDS Trend Chart */}
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-5">
                            <div className="w-8 h-8 rounded-lg bg-danger-50 dark:bg-danger-900/20 flex items-center justify-center">
                                <TrendingDown className="w-4 h-4 text-danger-600 dark:text-danger-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-neutral-800 dark:text-white">Monthly TDS Deducted</h3>
                                <p className="text-[10px] text-neutral-400 dark:text-neutral-500">FY {activeFY} — month by month</p>
                            </div>
                        </div>
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-neutral-100 dark:text-neutral-800" />
                                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                                    <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip content={<TdsTooltip />} cursor={{ fill: 'rgba(239,68,68,0.06)' }} />
                                    <Bar dataKey="tds" fill="#EF4444" radius={[5, 5, 0, 0]} maxBarSize={32} opacity={0.85} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Month-wise breakdown table */}
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm overflow-hidden">
                        <div className="flex items-center gap-2 p-5 border-b border-neutral-100 dark:border-neutral-800">
                            <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                                <Calendar className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-neutral-800 dark:text-white">Month-wise Payslip Breakdown</h3>
                                <p className="text-[10px] text-neutral-400 dark:text-neutral-500">FY {activeFY} — {sortedSlips.length} months</p>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[600px]">
                                <thead>
                                    <tr className="bg-neutral-50/60 dark:bg-neutral-800/40 border-b border-neutral-200 dark:border-neutral-800 text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500 font-bold">
                                        <th className="py-3 px-5">Month</th>
                                        <th className="py-3 px-5 text-right">Gross Earnings</th>
                                        <th className="py-3 px-5 text-right">TDS Deducted</th>
                                        <th className="py-3 px-5 text-right">Other Deductions</th>
                                        <th className="py-3 px-5 text-right">Net Pay</th>
                                        <th className="py-3 px-5 text-right">% of Annual TDS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedSlips.map((p) => {
                                        const month = num(p.month);
                                        const year = num(p.year);
                                        const gross = num(p.grossEarnings);
                                        const tds = num(p.tdsAmount);
                                        const net = num(p.netPay);
                                        const otherDed = num(p.totalDeductions) - tds;
                                        const tdsShare = totalTds > 0 ? (tds / totalTds) * 100 : 0;
                                        const monthKey = `${month}-${year}`;

                                        return (
                                            <tr
                                                key={p.id ?? monthKey}
                                                className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30 transition-colors"
                                            >
                                                <td className="py-3.5 px-5">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                                                            <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400">
                                                                {MONTH_NAMES[fyMonthOrder(month)]}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-neutral-800 dark:text-white">{MONTH_FULL[month - 1]}</p>
                                                            <p className="text-[10px] text-neutral-400 dark:text-neutral-500">{year}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-5 text-right font-mono text-sm font-semibold text-neutral-800 dark:text-white tabular-nums">
                                                    {fmt(gross)}
                                                </td>
                                                <td className="py-3.5 px-5 text-right font-mono text-sm font-semibold text-danger-600 dark:text-danger-400 tabular-nums">
                                                    {fmt(tds)}
                                                </td>
                                                <td className="py-3.5 px-5 text-right font-mono text-sm text-neutral-500 dark:text-neutral-400 tabular-nums">
                                                    {otherDed > 0 ? fmt(otherDed) : '—'}
                                                </td>
                                                <td className="py-3.5 px-5 text-right font-mono text-sm font-bold text-success-700 dark:text-success-400 tabular-nums">
                                                    {fmt(net)}
                                                </td>
                                                <td className="py-3.5 px-5 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <div className="w-16 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-danger-400 rounded-full"
                                                                style={{ width: `${Math.min(tdsShare, 100)}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums w-10 text-right">
                                                            {tdsShare.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                {/* Footer totals row */}
                                <tfoot>
                                    <tr className="bg-neutral-50/80 dark:bg-neutral-800/50 border-t-2 border-neutral-200 dark:border-neutral-700">
                                        <td className="py-4 px-5 text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                            Annual Total
                                        </td>
                                        <td className="py-4 px-5 text-right font-mono text-sm font-bold text-neutral-800 dark:text-white tabular-nums">
                                            {fmt(totalGross)}
                                        </td>
                                        <td className="py-4 px-5 text-right font-mono text-sm font-bold text-danger-600 dark:text-danger-400 tabular-nums">
                                            {fmt(totalTds)}
                                        </td>
                                        <td className="py-4 px-5 text-right font-mono text-sm font-bold text-neutral-500 dark:text-neutral-400 tabular-nums">
                                            {totalDeductions - totalTds > 0 ? fmt(totalDeductions - totalTds) : '—'}
                                        </td>
                                        <td className="py-4 px-5 text-right font-mono text-sm font-bold text-success-700 dark:text-success-400 tabular-nums">
                                            {fmt(totalNet)}
                                        </td>
                                        <td className="py-4 px-5 text-right text-xs font-bold text-warning-600 dark:text-warning-400 tabular-nums">
                                            {effectiveTaxRate.toFixed(2)}%
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Info note */}
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-700">
                        <Info className="w-4 h-4 text-neutral-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                            The figures above are derived from your monthly payslips and are for informational purposes. The official Form 16 (TDS Certificate) is issued by your employer and may contain additional breakdowns per the Income Tax Act. The effective tax rate shown is TDS as a percentage of Gross Earnings.
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}
