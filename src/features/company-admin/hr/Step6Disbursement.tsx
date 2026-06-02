import { useMemo, useState, useRef, useEffect } from 'react';
import {
    Users,
    Banknote,
    Landmark,
    CheckCircle2,
    XCircle,
    Wallet,
    Clock,
    Shield,
    ChevronDown,
    Download,
    RefreshCcw,
    ArrowRight,
    ArrowLeft,
    Headphones,
    Phone,
    Mail,
    Info,
    Calendar,
    Lock,
    FileText,
    Archive,
    Eye,
    Send,
    Globe,
    MessageCircle,
    Loader2,
    AlertCircle,
    FileSpreadsheet,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
    useDisbursementBreakdown,
    usePayrollRun,
    useStatutoryFiles,
} from '@/features/company-admin/api/use-payroll-run-queries';
import {
    useDisburseRun,
    useArchiveRun,
} from '@/features/company-admin/api/use-payroll-run-mutations';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import { useAuthStore, getDisplayName } from '@/store/useAuthStore';
import { showSuccess, showApiError } from '@/lib/toast';
import { SkeletonTable } from '@/components/ui/Skeleton';

interface StepProps {
    runId: string;
    runDetail: any;
    completedStep: number;
    onStepAction: () => void;
    anyMutating: boolean;
}

const formatINR = (v: unknown): string => `₹${(Number(v) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const MONTHS_SHORT = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/* ──────────────────────────────────────────────────────────────────────── */
/* Atoms                                                                    */
/* ──────────────────────────────────────────────────────────────────────── */

function StatTile({
    icon: Icon, label, value, sub, tint,
}: { icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; label: string; value: React.ReactNode; sub?: React.ReactNode; tint: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'emerald' | 'violet' | 'neutral' }) {
    const tintMap = {
        primary: 'bg-primary-50 text-primary-600',
        success: 'bg-success-50 text-success-600',
        warning: 'bg-warning-50 text-warning-600',
        danger:  'bg-danger-50 text-danger-600',
        info:    'bg-info-50 text-info-600',
        accent:  'bg-accent-50 text-accent-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        violet:  'bg-violet-50 text-violet-600',
        neutral: 'bg-neutral-100 text-neutral-700',
    } as const;
    return (
        <div className="rounded-2xl bg-white px-4 py-4 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-3">
                <div className={cn('w-11 h-11 rounded-full flex items-center justify-center shrink-0', tintMap[tint])}>
                    <Icon className="w-5 h-5" strokeWidth={2.2} />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 leading-tight">{label}</div>
                    <div className="mt-0.5 text-[16px] font-extrabold text-neutral-900 leading-tight tabular-nums truncate">{value}</div>
                    {sub && <div className="text-[11px] text-neutral-500 mt-0.5 truncate">{sub}</div>}
                </div>
            </div>
        </div>
    );
}

function DisburseDonut({ successful, pending, failed, total }: { successful: number; pending: number; failed: number; total: number }) {
    const safe = total || 1;
    const radius = 42;
    const circ = 2 * Math.PI * radius;
    const sucLen = (successful / safe) * circ;
    const penLen = (pending / safe) * circ;
    const failLen = (failed / safe) * circ;
    return (
        <div className="relative w-[160px] h-[160px] shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r={radius} fill="none" stroke="#E2E8F0" strokeWidth="10" />
                {total > 0 && (
                    <>
                        <circle cx="50" cy="50" r={radius} fill="none" stroke="#10B981" strokeWidth="10"
                            strokeDasharray={`${sucLen} ${circ - sucLen}`} strokeDashoffset={0} />
                        <circle cx="50" cy="50" r={radius} fill="none" stroke="#F59E0B" strokeWidth="10"
                            strokeDasharray={`${penLen} ${circ - penLen}`} strokeDashoffset={-sucLen} />
                        <circle cx="50" cy="50" r={radius} fill="none" stroke="#EF4444" strokeWidth="10"
                            strokeDasharray={`${failLen} ${circ - failLen}`} strokeDashoffset={-sucLen - penLen} />
                    </>
                )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-neutral-900 leading-none">{total}</span>
                <span className="text-[10px] text-neutral-500 mt-1.5 font-bold uppercase tracking-wider">Total</span>
                <span className="text-[10px] text-neutral-500">Transactions</span>
            </div>
        </div>
    );
}

function ApprovalTimelineRow({
    role, name, statusLabel, statusTone, when, isLast,
}: { role: string; name: string; statusLabel: string; statusTone: 'success' | 'warning' | 'danger' | 'neutral'; when?: string; isLast?: boolean }) {
    const fmt = useCompanyFormatter();
    const toneMap = {
        success: { bg: 'bg-success-600', text: 'text-success-700', tint: 'bg-success-50' },
        warning: { bg: 'bg-warning-500', text: 'text-warning-700', tint: 'bg-warning-50' },
        danger:  { bg: 'bg-danger-600',  text: 'text-danger-700',  tint: 'bg-danger-50' },
        neutral: { bg: 'bg-neutral-400', text: 'text-neutral-600', tint: 'bg-neutral-50' },
    };
    const t = toneMap[statusTone];
    return (
        <div className="flex items-start gap-3 pb-3 relative">
            {!isLast && <span className="absolute left-3.5 top-7 w-px h-full bg-neutral-200" />}
            <div className={cn('w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white text-[10px] font-bold relative z-10', t.bg)}>
                {statusTone === 'success' ? '✓' : statusTone === 'danger' ? '✕' : '•'}
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                    <div className="text-[13px] font-bold text-neutral-900">{role}</div>
                    <span className={cn('text-[10.5px] font-bold uppercase tracking-wider', t.text)}>{statusLabel}</span>
                </div>
                <div className="text-[12px] text-neutral-600">{name || '—'}</div>
                {when && <div className="text-[10.5px] text-neutral-500">{fmt.date(when)} {fmt.time(when)}</div>}
            </div>
        </div>
    );
}

function ArchiveArtifact({ label, locked }: { label: string; locked: boolean }) {
    const Icon = label.includes('PDF') || label.includes('Salary Register') ? FileText
        : label.includes('Excel') ? FileSpreadsheet
        : label.includes('Snapshot') ? Archive
        : label.includes('Bank') ? Landmark
        : label.includes('PF') || label.includes('ESI') || label.includes('PT') || label.includes('TDS') ? Shield
        : label.includes('Audit') ? Shield
        : Archive;
    return (
        <div className="flex items-center gap-3 rounded-xl border border-neutral-200 px-3 py-2.5">
            <div className="w-7 h-7 rounded-md bg-success-50 text-success-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="w-7 h-7 rounded-md bg-neutral-100 text-neutral-600 flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
                <div className="text-[12.5px] font-bold text-neutral-900 truncate">{label}</div>
                <div className="text-[10.5px] text-neutral-500 font-semibold">
                    {locked ? '🔒 Locked' : 'Available'}
                </div>
            </div>
        </div>
    );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Main component                                                           */
/* ──────────────────────────────────────────────────────────────────────── */

export function Step6Disbursement({ runId, runDetail, completedStep, onStepAction, anyMutating }: StepProps) {
    const fmt = useCompanyFormatter();
    const navigate = useNavigate();
    const authUser = useAuthStore(s => s.user);
    const authUserName = getDisplayName(authUser);

    const status = (runDetail?.status ?? '').toUpperCase();
    const isApproved = ['APPROVED', 'DISBURSED', 'ARCHIVED'].includes(status);
    const isDisbursed = ['DISBURSED', 'ARCHIVED'].includes(status);
    const isArchived = status === 'ARCHIVED';

    const breakdownQuery = useDisbursementBreakdown(runId);
    const filesQuery = useStatutoryFiles(runId);
    const runDetailQuery = usePayrollRun(runId);

    const disburseMutation = useDisburseRun();
    const archiveMutation = useArchiveRun();

    const breakdown: any = breakdownQuery.data?.data ?? null;
    const filesData: any = filesQuery.data?.data ?? null;

    /* Disbursement metrics */
    const totals = breakdown?.totals ?? {};
    const distribution = breakdown?.distributionStatus ?? {};
    const employees = Number(totals.totalEmployees ?? runDetail?.employeeCount ?? 0);
    const netDisbursed = Number(totals.netDisbursed ?? runDetail?.totalNet ?? 0);
    const bankTransferTotal = Number(totals.netDisbursed ?? runDetail?.totalNet ?? 0);

    const successful = Number(distribution?.processed?.count ?? (isDisbursed ? employees : 0));
    const pending = Number(distribution?.pending?.count ?? 0);
    const failed = Number(distribution?.failed?.count ?? 0);
    const totalTx = successful + pending + failed || employees;
    const successPct = totalTx > 0 ? (successful / totalTx) * 100 : 0;
    const failedPct = totalTx > 0 ? (failed / totalTx) * 100 : 0;
    const avgNet = employees > 0 ? netDisbursed / employees : 0;

    /* Approval trail */
    const lock = breakdown?.payrollLock ?? {};
    const computedAt = lock.computedAt ?? runDetail?.computedAt;
    const approvedAt = lock.approvedAt ?? runDetail?.approvedAt;
    const disbursedAt = lock.disbursedAt ?? runDetail?.disbursedAt;
    const lockedAt = lock.lockedAt ?? runDetail?.lockedAt;

    const lockedByName = runDetail?.lockedByName ?? null;
    const computedByName = runDetail?.computedByName ?? null;
    const approvedByName = runDetail?.approvedByName ?? null;

    /* Total processing time = disbursedAt - lockedAt */
    const processingTime = useMemo(() => {
        if (!lockedAt || !disbursedAt) return null;
        const diffMs = new Date(disbursedAt).getTime() - new Date(lockedAt).getTime();
        if (diffMs <= 0) return null;
        const hours = Math.floor(diffMs / 3600000);
        const minutes = Math.floor((diffMs % 3600000) / 60000);
        const seconds = Math.floor((diffMs % 60000) / 1000);
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }, [lockedAt, disbursedAt]);

    /* Payslip distribution counts — from breakdown if present, else derive */
    const payslipStats = breakdown?.payslipDistribution ?? {};
    const payslipsGenerated = Number(payslipStats.generated ?? (isDisbursed ? employees : 0));
    const portalPublished = Number(payslipStats.portalPublished ?? payslipsGenerated);
    const emailSent = Number(payslipStats.emailSent ?? 0);
    const whatsappDelivered = Number(payslipStats.whatsapp ?? 0);
    const failedDeliveries = Number(payslipStats.failedDeliveries ?? 0);

    /* Bank file naming (client-side per backend convention) */
    const bankFileName = useMemo(() => {
        if (!runDetail?.month || !runDetail?.year) return null;
        return `PAYROLL_${MONTHS_SHORT[runDetail.month]?.toUpperCase()}${runDetail.year}_${disbursedAt ? new Date(disbursedAt).toISOString().slice(0, 10).replace(/-/g, '') : new Date().toISOString().slice(0, 10).replace(/-/g, '')}.txt`;
    }, [runDetail, disbursedAt]);

    const onRefresh = () => { breakdownQuery.refetch(); filesQuery.refetch(); runDetailQuery.refetch(); };
    const onExport = () => window.print();

    const handleDisburse = () => {
        if (!confirm('Disburse salaries to all employees? Payslips will be generated and credit notifications sent. This cannot be undone.')) return;
        disburseMutation.mutate(runId, {
            onSuccess: () => { showSuccess('Payroll Disbursed', 'Salaries disbursed and payslips generated.'); onRefresh(); },
            onError: (err) => showApiError(err),
        });
    };

    const handleArchive = () => {
        if (!confirm('Archive this payroll run? All artifacts will be locked for audit.')) return;
        archiveMutation.mutate(
            { runId, payload: { archivePayslips: true, archiveBankFile: true, archiveStatutoryFiles: true, archiveReports: true } },
            {
                onSuccess: () => { showSuccess('Run Archived', 'All artifacts have been locked.'); onRefresh(); onStepAction(); },
                onError: (err) => showApiError(err),
            },
        );
    };

    const isLoading = (breakdownQuery.isLoading) && !breakdown;

    return (
        <div className="space-y-5">
            {/* Step header + Success card */}
            <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
                <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <div className="text-[11px] font-bold uppercase tracking-wider text-primary-600">Step 6 of 6</div>
                            <h2 className="mt-1 text-xl font-bold text-neutral-900">Disburse &amp; Archive</h2>
                            <p className="mt-1.5 text-[13px] text-neutral-600 max-w-2xl leading-snug">
                                {isArchived
                                    ? 'Salaries have been disbursed successfully to employees\' bank accounts. The payroll run has been archived and locked for audit and compliance.'
                                    : isDisbursed
                                        ? 'Salaries have been disbursed successfully. Archive the run to lock all artifacts for audit.'
                                        : 'Disburse salaries to employees and archive the payroll run for audit and compliance.'}
                            </p>
                        </div>
                        <PayrollActionsDropdown onRefresh={onRefresh} onExport={onExport} />
                    </div>

                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 rounded-xl bg-neutral-50/70 p-3 ring-1 ring-neutral-100">
                        <MetaPill icon={Calendar} label="Payroll Period" value={runDetail?.month && runDetail?.year ? `${fmt.date(new Date(runDetail.year, runDetail.month - 1, 1).toISOString())} – ${fmt.date(new Date(runDetail.year, runDetail.month, 0).toISOString())}` : '—'} tint="info" />
                        <MetaPill icon={Calendar} label="Pay Date" value={runDetail?.month && runDetail?.year ? fmt.date(new Date(runDetail.year, runDetail.month, 5).toISOString()) : '—'} tint="accent" />
                        <MetaPill icon={Clock} label="Disbursed On" value={disbursedAt ? `${fmt.date(disbursedAt)} ${fmt.time(disbursedAt)}` : '—'} tint="warning" />
                        <MetaPill icon={Users} label="Processed By" value={approvedByName ?? lockedByName ?? authUserName ?? '—'} tint="success" />
                    </div>
                </div>

                {/* Success card */}
                <div className={cn(
                    'rounded-2xl p-5 ring-1 shadow-[0_1px_2px_rgba(15,23,42,0.04)]',
                    isArchived ? 'bg-success-50/60 ring-success-200'
                        : isDisbursed ? 'bg-info-50/60 ring-info-200'
                            : 'bg-warning-50/60 ring-warning-200',
                )}>
                    <div className="flex items-center gap-2 mb-2">
                        <div className={cn('w-8 h-8 rounded-full flex items-center justify-center',
                            isArchived ? 'bg-success-100 text-success-600'
                            : isDisbursed ? 'bg-info-100 text-info-600'
                            : 'bg-warning-100 text-warning-600')}>
                            {isArchived || isDisbursed ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                        </div>
                        <h3 className={cn('text-[15px] font-bold',
                            isArchived ? 'text-success-900'
                            : isDisbursed ? 'text-info-900'
                            : 'text-warning-900')}>
                            {isArchived ? 'Payroll Run Completed Successfully!'
                                : isDisbursed ? 'Payroll Disbursed!'
                                : 'Ready for Disbursement'}
                        </h3>
                    </div>
                    <p className={cn('text-[12.5px] leading-relaxed',
                        isArchived ? 'text-success-800'
                        : isDisbursed ? 'text-info-800'
                        : 'text-warning-800')}>
                        {isArchived
                            ? `The payroll for ${runDetail?.month ? MONTHS_SHORT[runDetail.month] : ''} ${runDetail?.year} has been disbursed and archived. All records are locked and ready for audit.`
                            : isDisbursed
                                ? 'Salaries credited. Archive the run to lock all artifacts.'
                                : 'Click "Disburse Payroll" to credit salaries and notify employees.'}
                    </p>
                    {isArchived && (
                        <a href="#" className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-semibold text-success-700 hover:text-success-800">
                            View Payroll Archive →
                        </a>
                    )}
                </div>
            </div>

            {/* KPI strip — 8 tiles */}
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
                <StatTile icon={Users}        label="Total Employees"      value={employees}                       sub="Active" tint="primary" />
                <StatTile icon={Banknote}     label="Net Pay Disbursed"    value={formatINR(netDisbursed)}         tint="success" />
                <StatTile icon={Landmark}     label="Bank Transfer Amount" value={formatINR(bankTransferTotal)}    tint="emerald" />
                <StatTile icon={CheckCircle2} label="Transactions Successful" value={successful}                   sub={`${successPct.toFixed(0)}%`} tint="success" />
                <StatTile icon={XCircle}      label="Transactions Failed"  value={failed}                          sub={`${failedPct.toFixed(0)}%`} tint={failed > 0 ? 'danger' : 'neutral'} />
                <StatTile icon={Wallet}       label="Average Net Pay"      value={formatINR(avgNet)}               tint="accent" />
                <StatTile icon={Clock}        label="Total Processing Time" value={processingTime ?? '—'}          tint="info" />
                <StatTile icon={Shield}       label="Disbursement Status"  value={isArchived ? 'Archived' : isDisbursed ? 'Completed' : 'Pending'} tint={isDisbursed ? 'success' : 'warning'} />
            </div>

            {/* Four-panel row: Bank breakdown + Payslip distribution + Approval trail + Lock info */}
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
                {/* 1. Bank Disbursement Status Breakdown */}
                <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                    <h3 className="text-sm font-bold text-neutral-900 mb-3">1. Bank Disbursement Status</h3>
                    {isLoading ? (
                        <div><SkeletonTable rows={4} cols={2} /></div>
                    ) : (
                        <>
                            <div className="flex justify-center mb-3">
                                <DisburseDonut successful={successful} pending={pending} failed={failed} total={totalTx} />
                            </div>
                            <ul className="space-y-2">
                                <BreakdownLine color="#10B981" label="Successful Transfers"        value={successful} total={totalTx} />
                                <BreakdownLine color="#F59E0B" label="Pending Bank Acknowledgement" value={pending}    total={totalTx} />
                                <BreakdownLine color="#EF4444" label="Rejected by Bank"             value={failed}     total={totalTx} />
                                <BreakdownLine color="#94A3B8" label="Reversed Transactions"        value={0}          total={totalTx} />
                                <BreakdownLine color="#94A3B8" label="Manual Reprocessing Required" value={0}          total={totalTx} />
                            </ul>
                            <a href="#" className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-semibold text-primary-600 hover:text-primary-700">
                                View Bank Transfer Details →
                            </a>
                        </>
                    )}
                </div>

                {/* 2. Payslip Distribution Status */}
                <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                    <h3 className="text-sm font-bold text-neutral-900 mb-3">2. Payslip Distribution</h3>
                    <ul className="space-y-2.5">
                        <DistribRow icon={FileText}     label="Payslips Generated" value={payslipsGenerated} tint="info" />
                        <DistribRow icon={Globe}        label="Portal Published"   value={portalPublished}   tint="primary" />
                        <DistribRow icon={Send}         label="Email Sent"         value={emailSent}         tint="accent" />
                        <DistribRow icon={MessageCircle} label="WhatsApp Delivered" value={whatsappDelivered} tint="success" />
                        <DistribRow icon={XCircle}      label="Failed Deliveries"  value={failedDeliveries}  tint="danger" />
                    </ul>
                    <a href="#" className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-semibold text-primary-600 hover:text-primary-700">
                        View Distribution Report →
                    </a>
                </div>

                {/* 3. Approval Trail */}
                <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                    <h3 className="text-sm font-bold text-neutral-900 mb-3">3. Approval Trail</h3>
                    <div className="space-y-1">
                        <ApprovalTimelineRow role="Lock Attendance"  name={lockedByName ?? '—'}   statusLabel={lockedAt ? 'Locked' : 'Pending'}        statusTone={lockedAt ? 'success' : 'neutral'}    when={lockedAt} />
                        <ApprovalTimelineRow role="Computed"          name={computedByName ?? '—'} statusLabel={computedAt ? 'Computed' : 'Pending'}    statusTone={computedAt ? 'success' : 'neutral'}  when={computedAt} />
                        <ApprovalTimelineRow role="Approved"          name={approvedByName ?? '—'} statusLabel={approvedAt ? 'Approved' : 'Pending'}    statusTone={approvedAt ? 'success' : 'neutral'}  when={approvedAt} />
                        <ApprovalTimelineRow role="Disbursed"         name="System"                statusLabel={disbursedAt ? 'Disbursed' : 'Pending'} statusTone={disbursedAt ? 'success' : 'neutral'} when={disbursedAt} isLast={!isArchived} />
                        {isArchived && (
                            <ApprovalTimelineRow role="Archived" name={runDetail?.metadata?.archivedBy ?? 'System'} statusLabel="Archived" statusTone="success"
                                when={runDetail?.metadata?.archivedAt} isLast />
                        )}
                    </div>
                    <a href="#" className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-semibold text-primary-600 hover:text-primary-700">
                        View Full Approval History →
                    </a>
                </div>

                {/* 4. Payroll Lock Information */}
                <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                    <h3 className="text-sm font-bold text-neutral-900 mb-3">4. Payroll Lock</h3>
                    <div className="flex flex-col items-center text-center mb-3">
                        <div className={cn('w-16 h-16 rounded-2xl flex items-center justify-center', isArchived ? 'bg-success-100 text-success-700' : isDisbursed ? 'bg-warning-100 text-warning-700' : 'bg-neutral-100 text-neutral-500')}>
                            <Lock className="w-7 h-7" />
                        </div>
                        <div className="mt-2 text-[11px] text-neutral-500 font-bold uppercase tracking-wider">Payroll Status</div>
                        <div className={cn('text-[20px] font-extrabold tracking-tight', isArchived ? 'text-success-700' : isDisbursed ? 'text-warning-700' : 'text-neutral-600')}>
                            {isArchived ? 'LOCKED' : isDisbursed ? 'DISBURSED' : 'OPEN'}
                        </div>
                    </div>
                    <div className="space-y-1.5 text-[12px]">
                        <LockRow label="Locked By"        value={lockedByName ?? '—'} />
                        <LockRow label="Locked On"        value={disbursedAt ? `${fmt.date(disbursedAt)} ${fmt.time(disbursedAt)}` : '—'} />
                        <LockRow label="Unlock Permission" value="CFO Only" />
                    </div>
                    <a href="#" className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-semibold text-primary-600 hover:text-primary-700">
                        Request Unlock (CFO Only) →
                    </a>
                </div>
            </div>

            {/* Lower row: Archive Artifacts + Bank File Summary + Next Steps */}
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {/* 5. Archive Artifacts */}
                <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)] xl:col-span-1">
                    <h3 className="text-sm font-bold text-neutral-900">5. Archive Artifacts</h3>
                    <p className="text-[12px] text-neutral-500 mt-0.5 mb-3">The following artifacts {isArchived ? 'have been' : 'will be'} archived and locked for audit and compliance.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <ArchiveArtifact label="Payroll Snapshot" locked={isArchived} />
                        <ArchiveArtifact label="Salary Register PDF" locked={isArchived} />
                        <ArchiveArtifact label="Salary Register Excel" locked={isArchived} />
                        <ArchiveArtifact label="Bank Advice Report" locked={isArchived} />
                        <ArchiveArtifact label="PF Summary" locked={isArchived} />
                        <ArchiveArtifact label="ESI Summary" locked={isArchived} />
                        <ArchiveArtifact label="PT Summary" locked={isArchived} />
                        <ArchiveArtifact label="TDS Summary" locked={isArchived} />
                        <ArchiveArtifact label="Audit Trail" locked={isArchived} />
                        <ArchiveArtifact label="Approval Chain History" locked={isArchived} />
                        <ArchiveArtifact label="Generated Bank File" locked={isArchived} />
                    </div>
                    <a href="#" className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-semibold text-primary-600 hover:text-primary-700">
                        View All Archived Files →
                    </a>
                </div>

                {/* 6. Bank File Summary */}
                <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                    <h3 className="text-sm font-bold text-neutral-900 mb-3">6. Bank File Summary</h3>
                    <ul className="space-y-2.5 text-[12.5px]">
                        <BankFileRow label="Bank File Name" value={bankFileName ?? '—'} mono />
                        <BankFileRow label="Total Records" value={String(employees)} />
                        <BankFileRow label="File Size" value="—" />
                        <BankFileRow label="Generated On" value={disbursedAt ? `${fmt.date(disbursedAt)} ${fmt.time(disbursedAt)}` : '—'} />
                        <BankFileRow label="Generated By" value={approvedByName ?? lockedByName ?? authUserName ?? '—'} />
                        <BankFileRow label="File Status" value={isDisbursed ? 'Uploaded to Bank' : 'Pending'} tint={isDisbursed ? 'success' : 'warning'} />
                    </ul>
                    <button
                        disabled={!isDisbursed}
                        className={cn(
                            'mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition',
                            isDisbursed ? 'border border-primary-200 bg-white text-primary-700 hover:bg-primary-50' : 'border border-neutral-200 bg-neutral-50 text-neutral-400 cursor-not-allowed',
                        )}
                    >
                        <Download className="w-3.5 h-3.5" /> Download Bank File
                    </button>
                </div>

                {/* 7. Next Steps */}
                <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                    <h3 className="text-sm font-bold text-neutral-900 mb-3">7. Next Steps</h3>
                    <ul className="space-y-3">
                        <NextStep icon={Eye}      title="View Payslips"            description="Employees can view their payslips" to="/app/company/hr/payslips" />
                        <NextStep icon={FileText} title="View Payroll Reports"    description="Access payroll reports and summaries" to="/app/company/hr/payroll-reports" />
                        <NextStep icon={Shield}   title="Statutory Filing Center" description="File PF, ESI, PT, TDS returns" to="/app/company/hr/statutory-filings" />
                        <NextStep icon={Landmark} title="Bank Reconciliation"     description="Reconcile disbursements with bank" to="/app/company/hr/payroll-post-run" />
                        <NextStep icon={Calendar} title="Start Next Payroll Cycle" description="Initiate pre-run activities for next cycle" to="/app/company/hr/payroll-pre-run" />
                    </ul>
                </div>
            </div>

            {/* Audit & Compliance + Need Help (sidebar bottom row) */}
            <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-success-50 text-success-600 flex items-center justify-center">
                            <Shield className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-bold text-neutral-900">Audit &amp; Compliance Note</h3>
                    </div>
                    <p className="text-[12.5px] text-neutral-600 leading-relaxed">
                        {isArchived
                            ? 'This payroll run is locked and cannot be altered. All changes require unlock permission from CFO. All data, approvals, and artifacts are retained as per company policy.'
                            : 'Once archived, this payroll run will be locked. Any changes will require unlock permission from CFO.'}
                    </p>
                    <a href="#" className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-semibold text-primary-600 hover:text-primary-700">View Audit Log →</a>
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
            </div>

            {/* Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 sticky bottom-0 bg-[var(--background)] py-3 -mx-4 px-4 z-10">
                <div className="flex items-center gap-3 text-[12.5px] text-neutral-600">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Step 5 (Approval)</span>
                </div>
                <div className="text-[12.5px] text-neutral-500">
                    {isArchived ? (
                        <>Payroll run archived on <span className="font-semibold text-neutral-700">{runDetail?.metadata?.archivedAt ? `${fmt.date(runDetail.metadata.archivedAt)} ${fmt.time(runDetail.metadata.archivedAt)}` : disbursedAt ? `${fmt.date(disbursedAt)} ${fmt.time(disbursedAt)}` : '—'}</span> by <span className="font-semibold text-neutral-700">{runDetail?.metadata?.archivedByName ?? approvedByName ?? '—'}</span></>
                    ) : isDisbursed ? (
                        <>Disbursed on <span className="font-semibold text-neutral-700">{disbursedAt ? `${fmt.date(disbursedAt)} ${fmt.time(disbursedAt)}` : '—'}</span></>
                    ) : (
                        <>Ready for disbursement</>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    {isArchived ? (
                        <>
                            <button onClick={() => navigate('/app/company/hr/payroll-runs')} className="inline-flex items-center gap-2 rounded-xl border border-primary-200 bg-white px-4 py-2.5 text-sm font-semibold text-primary-700 hover:bg-primary-50">
                                View Payroll Archive
                            </button>
                            <button onClick={() => navigate('/app/company/hr/payroll-post-run')} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-accent-600 px-5 py-2.5 text-sm font-bold text-white shadow-primary-500/25 shadow hover:from-primary-700 hover:to-accent-700">
                                Go to Post-Run Activities <ArrowRight className="w-4 h-4" />
                            </button>
                        </>
                    ) : isDisbursed ? (
                        <button
                            disabled={archiveMutation.isPending || anyMutating}
                            onClick={handleArchive}
                            className={cn('inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold shadow-sm transition bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-primary-500/25 hover:from-primary-700 hover:to-accent-700',
                                (archiveMutation.isPending || anyMutating) && 'opacity-60 cursor-not-allowed')}
                        >
                            {archiveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
                            Archive Payroll Run <ArrowRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            disabled={!isApproved || disburseMutation.isPending || anyMutating}
                            onClick={handleDisburse}
                            className={cn('inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold shadow-sm transition',
                                isApproved
                                    ? 'bg-gradient-to-r from-success-600 to-emerald-600 text-white shadow-success-500/25 hover:from-success-700 hover:to-emerald-700'
                                    : 'bg-neutral-200 text-neutral-500 cursor-not-allowed',
                                (disburseMutation.isPending || anyMutating) && 'opacity-60 cursor-not-allowed')}
                        >
                            {disburseMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Banknote className="w-4 h-4" />}
                            Disburse Payroll <ArrowRight className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Atoms                                                                     */
/* ──────────────────────────────────────────────────────────────────────── */

function PayrollActionsDropdown({ onRefresh, onExport }: { onRefresh: () => void; onExport: () => void }) {
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
                        <RefreshCcw className="w-4 h-4" /> Refresh
                    </button>
                    <button onClick={() => { setOpen(false); onExport(); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                        <Download className="w-4 h-4" /> Export Summary
                    </button>
                </div>
            )}
        </div>
    );
}

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

function BreakdownLine({ color, label, value, total }: { color: string; label: string; value: number; total: number }) {
    const pct = total > 0 ? (value / total) * 100 : 0;
    return (
        <li className="flex items-center justify-between text-[12.5px]">
            <span className="flex items-center gap-2 text-neutral-700">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                {label}
            </span>
            <span className="font-bold text-neutral-900">{value} <span className="font-normal text-neutral-500">({pct.toFixed(0)}%)</span></span>
        </li>
    );
}

function DistribRow({ icon: Icon, label, value, tint }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; tint: 'primary' | 'info' | 'accent' | 'success' | 'danger' }) {
    const tintMap = {
        primary: 'text-primary-600',
        info:    'text-info-600',
        accent:  'text-accent-600',
        success: 'text-success-600',
        danger:  'text-danger-600',
    } as const;
    return (
        <li className="flex items-center justify-between text-[12.5px]">
            <span className={cn('flex items-center gap-2.5 text-neutral-700')}>
                <Icon className={cn('w-3.5 h-3.5', tintMap[tint])} />
                {label}
            </span>
            <span className="font-bold text-neutral-900">{value}</span>
        </li>
    );
}

function LockRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-2">
            <span className="text-neutral-500">{label}</span>
            <span className="font-bold text-neutral-800 text-right truncate">{value}</span>
        </div>
    );
}

function BankFileRow({ label, value, mono, tint }: { label: string; value: string; mono?: boolean; tint?: 'success' | 'warning' }) {
    return (
        <li className="flex items-center justify-between gap-2">
            <span className="text-neutral-500">{label}</span>
            <span className={cn(
                'font-bold text-right truncate max-w-[60%]',
                mono && 'font-mono',
                tint === 'success' && 'text-success-700',
                tint === 'warning' && 'text-warning-700',
                !tint && 'text-neutral-900',
            )}>{value}</span>
        </li>
    );
}

function NextStep({ icon: Icon, title, description, to }: { icon: React.ComponentType<{ className?: string }>; title: string; description: string; to: string }) {
    return (
        <li>
            <Link to={to} className="group flex items-start gap-3 rounded-lg px-2 py-2 -mx-2 hover:bg-neutral-50 transition">
                <Icon className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                    <div className="text-[12.5px] font-bold text-primary-700 group-hover:text-primary-800">{title}</div>
                    <div className="text-[11.5px] text-neutral-500">{description}</div>
                </div>
            </Link>
        </li>
    );
}
