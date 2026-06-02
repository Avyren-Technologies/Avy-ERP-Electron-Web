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
} from '@/features/company-admin/api/use-payroll-run-queries';
import {
    useComputeStatutory,
    useResetToCompute,
} from '@/features/company-admin/api/use-payroll-run-mutations';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { showSuccess, showApiError } from '@/lib/toast';

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
    return (
        <div className="rounded-2xl bg-white px-4 py-4 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-3">
                <div className={cn('w-11 h-11 rounded-full flex items-center justify-center shrink-0', tintMap[tint])}>
                    <Icon className="w-5 h-5" strokeWidth={2.2} />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-[10.5px] font-bold uppercase tracking-wider text-neutral-500 leading-tight">{label}</div>
                    <div className="mt-0.5 text-[18px] font-extrabold text-neutral-900 leading-tight tabular-nums truncate">{value}</div>
                    {sub && <div className="text-[11px] text-neutral-500 mt-0.5">{sub}</div>}
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
    component, code, applicable, applicablePct, employeeAmount, employerAmount, total, computed,
}: {
    component: string; code: string; applicable: number; applicablePct: number;
    employeeAmount: number | null; employerAmount: number | null; total: number; computed: boolean;
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
                <button className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700">
                    View Details <Eye className="w-3.5 h-3.5" />
                </button>
            </td>
        </tr>
    );
}

function FileCard({
    type, fileName, employees, amount, statesCount, dueDate, fileUrl, status,
}: {
    type: 'PF_ECR' | 'ESI_CHALLAN' | 'PT_CHALLAN' | 'TDS_24Q' | string;
    fileName: string; employees?: number; amount?: number; statesCount?: number;
    dueDate?: string | null; fileUrl?: string | null; status: 'NOT_GENERATED' | 'PENDING' | 'FILED' | string;
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
                    <div className="flex items-center justify-between"><span className="text-neutral-500">Due:</span><span className="font-semibold text-warning-700">{new Date(dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>
                )}
            </div>
            <a
                href={fileUrl ?? '#'}
                onClick={(e) => { if (!fileUrl) e.preventDefault(); }}
                className={cn(
                    'mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition',
                    generated && fileUrl
                        ? 'border-primary-200 bg-white text-primary-700 hover:bg-primary-50'
                        : 'border-neutral-200 bg-neutral-50 text-neutral-400 cursor-not-allowed',
                )}
            >
                <Download className="w-3.5 h-3.5" />
                {generated ? 'Download' : 'Not generated'}
            </a>
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

    const summary: any = summaryQuery.data?.data ?? null;
    const filesData: any = filesQuery.data?.data ?? null;
    const files: any[] = filesData?.files ?? [];

    const totalEmployees = runDetail?.employeeCount ?? 0;

    const pfEmp        = Number(summary?.pfEmployeeTotal ?? 0);
    const pfEmpr       = Number(summary?.pfEmployerTotal ?? 0);
    const esiEmp       = Number(summary?.esiEmployeeTotal ?? 0);
    const esiEmpr      = Number(summary?.esiEmployerTotal ?? 0);
    const ptTotal      = Number(summary?.ptTotal ?? 0);
    const tdsTotal     = Number(summary?.tdsTotal ?? 0);
    const lwfEmp       = Number(summary?.lwfEmployeeTotal ?? 0);
    const lwfEmpr      = Number(summary?.lwfEmployerTotal ?? 0);

    const pfEligible      = Number(summary?.pfEligible ?? 0);
    const esiEligible     = Number(summary?.esiEligible ?? 0);
    const ptApplicable    = Number(summary?.ptApplicable ?? 0);
    const tdsApplicable   = Number(summary?.tdsApplicable ?? 0);

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
                                        <ComponentRow component="Provident Fund (PF)" code="EPFO" applicable={pfEligible} applicablePct={pct(pfEligible)} employeeAmount={pfEmp} employerAmount={pfEmpr} total={pfEmp + pfEmpr} computed={computeStatusByType.PF || pfEmp > 0} />
                                        <ComponentRow component="Employees' State Insurance (ESI)" code="ESIC" applicable={esiEligible} applicablePct={pct(esiEligible)} employeeAmount={esiEmp} employerAmount={esiEmpr} total={esiEmp + esiEmpr} computed={computeStatusByType.ESI || esiEmp > 0} />
                                        <ComponentRow component="Professional Tax (PT)" code="State Wise" applicable={ptApplicable} applicablePct={pct(ptApplicable)} employeeAmount={ptTotal} employerAmount={null} total={ptTotal} computed={computeStatusByType.PT || ptTotal > 0} />
                                        <ComponentRow component="Tax Deducted at Source (TDS)" code="Income Tax" applicable={tdsApplicable} applicablePct={pct(tdsApplicable)} employeeAmount={tdsTotal} employerAmount={null} total={tdsTotal} computed={computeStatusByType.TDS || tdsTotal > 0} />
                                        {(lwfEmp > 0 || lwfEmpr > 0) && (
                                            <ComponentRow component="Labour Welfare Fund (LWF)" code="State Wise" applicable={totalEmployees} applicablePct={100} employeeAmount={lwfEmp} employerAmount={lwfEmpr} total={lwfEmp + lwfEmpr} computed={true} />
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
                                <div className="px-6 py-12 text-center text-sm text-neutral-500">
                                    No statutory files generated yet. Compute statutory deductions first.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-3">
                                    {files.map((f: any) => (
                                        <FileCard key={f.id ?? f.type}
                                            type={f.type}
                                            fileName={f.label ?? `${f.type}_${runDetail?.month}_${runDetail?.year}.xml`}
                                            employees={f.employeeCount}
                                            amount={f.amount}
                                            dueDate={f.dueDate}
                                            fileUrl={f.fileUrl}
                                            status={f.status} />
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="px-6 py-12 text-center text-sm text-neutral-500">
                            <Info className="w-8 h-8 mx-auto text-info-400 mb-2" />
                            Per-employee {activeTab.toUpperCase()} breakdown coming soon. Use the Summary tab for totals.
                        </div>
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
                                    <span className="font-bold text-neutral-900 whitespace-nowrap">{d.date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Generated Files Summary */}
                    <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                        <h3 className="text-sm font-bold text-neutral-900 mb-3">Generated Files Summary</h3>
                        {files.length === 0 ? (
                            <p className="text-[12px] text-neutral-500">No files generated yet.</p>
                        ) : (
                            <ul className="space-y-2">
                                {[
                                    { type: 'PF_ECR',      label: 'PF ECR File' },
                                    { type: 'ESI_CHALLAN', label: 'ESI Challan File' },
                                    { type: 'PT_CHALLAN',  label: 'Professional Tax Challan File' },
                                    { type: 'TDS_24Q',     label: 'TDS 24Q Data File' },
                                ].map(item => {
                                    const f = findFile(item.type);
                                    return (
                                        <li key={item.type} className="flex items-center justify-between text-[12.5px]">
                                            <span className="text-neutral-700">{item.label}</span>
                                            <span className="flex items-center gap-2">
                                                <span className="font-bold text-neutral-900">{f ? 1 : 0}</span>
                                                <a
                                                    href={f?.fileUrl ?? '#'}
                                                    onClick={(e) => { if (!f?.fileUrl) e.preventDefault(); }}
                                                    className={cn('inline-flex items-center justify-center w-6 h-6 rounded-md',
                                                        f?.fileUrl ? 'text-primary-600 hover:bg-primary-50' : 'text-neutral-300 cursor-not-allowed')}
                                                >
                                                    <Download className="w-3.5 h-3.5" />
                                                </a>
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
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
                    <a href="#" className="ml-3 inline-flex items-center gap-1 font-semibold text-primary-600 hover:text-primary-700">View Computation Log</a>
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
