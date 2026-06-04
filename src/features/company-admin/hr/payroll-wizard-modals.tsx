import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/* ──────────────────────────────────────────────────────────────────────── */
/* Reusable WizardModal shell                                               */
/* ──────────────────────────────────────────────────────────────────────── */

interface WizardModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    maxWidth?: string;
    footer?: React.ReactNode;
}

export function WizardModal({ open, onClose, title, subtitle, children, maxWidth = '720px', footer }: WizardModalProps) {
    useEffect(() => {
        if (!open) return;
        document.body.style.overflow = 'hidden';
        const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onEsc);
        return () => {
            document.body.style.overflow = '';
            document.removeEventListener('keydown', onEsc);
        };
    }, [open, onClose]);

    if (!open) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 font-inter"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full flex flex-col max-h-[90vh]"
                style={{ maxWidth }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-neutral-100">
                    <div className="min-w-0">
                        <h3 className="text-base font-bold text-neutral-900 truncate">{title}</h3>
                        {subtitle && <p className="text-[12.5px] text-neutral-500 mt-0.5 truncate">{subtitle}</p>}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg text-neutral-500 hover:bg-neutral-100"
                        aria-label="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="px-6 py-5 overflow-y-auto">{children}</div>
                {footer && <div className="px-6 py-3 border-t border-neutral-100 flex items-center justify-end gap-2 bg-neutral-50/50">{footer}</div>}
            </div>
        </div>,
        document.body,
    );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Edit Period Modal — Switch displayed payroll period                       */
/* ──────────────────────────────────────────────────────────────────────── */

interface PayrollRunOption {
    id: string;
    month: number;
    year: number;
    status: string;
    employeeCount?: number;
}

interface EditPeriodModalProps {
    open: boolean;
    onClose: () => void;
    runs: PayrollRunOption[];
    currentRunId: string;
    onSelect: (runId: string) => void;
}

export function EditPeriodModal({ open, onClose, runs, currentRunId, onSelect }: EditPeriodModalProps) {
    return (
        <WizardModal
            open={open}
            onClose={onClose}
            title="Switch Payroll Period"
            subtitle="Select a payroll period to load its pre-run activities"
            maxWidth="640px"
            footer={
                <button
                    onClick={onClose}
                    className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                    Cancel
                </button>
            }
        >
            {runs.length === 0 ? (
                <div className="py-10 text-center text-sm text-neutral-500">
                    No payroll runs available.
                </div>
            ) : (
                <ul className="divide-y divide-neutral-100 -mx-1">
                    {runs.map((r) => {
                        const isActive = r.id === currentRunId;
                        const label = `${MONTHS[r.month] ?? '—'} ${r.year}`;
                        return (
                            <li key={r.id} className={cn('flex items-center justify-between gap-3 px-3 py-3 rounded-lg', isActive && 'bg-primary-50/50')}>
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className={cn(
                                        'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                                        isActive ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-600',
                                    )}>
                                        {isActive ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-[11px] font-bold">{MONTHS[r.month]?.slice(0, 3)}</span>}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-[13px] font-bold text-neutral-900 truncate">{label}</div>
                                        <div className="text-[11.5px] text-neutral-500 mt-0.5 flex items-center gap-2">
                                            <span className="capitalize">{(r.status ?? '').toLowerCase().replace(/_/g, ' ')}</span>
                                            {r.employeeCount != null && (
                                                <>
                                                    <span className="text-neutral-300">•</span>
                                                    <span>{r.employeeCount} employees</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {isActive ? (
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-primary-600">Active</span>
                                ) : (
                                    <button
                                        onClick={() => { onSelect(r.id); onClose(); }}
                                        className="rounded-lg border border-primary-200 bg-white px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-50"
                                    >
                                        Select
                                    </button>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </WizardModal>
    );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Pending Items Modal — "View All"                                          */
/* ──────────────────────────────────────────────────────────────────────── */

export interface PendingItem {
    id: string;
    title: string;
    description?: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    status: string;
    owner?: string;
    eta?: string;
    actionUrl?: string;
}

interface PendingItemsModalProps {
    open: boolean;
    onClose: () => void;
    items: PendingItem[];
    onItemAction: (item: PendingItem) => void;
}

export function PendingItemsModal({ open, onClose, items, onItemAction }: PendingItemsModalProps) {
    return (
        <WizardModal
            open={open}
            onClose={onClose}
            title="All Pending Items"
            subtitle={`${items.length} item${items.length === 1 ? '' : 's'} require attention`}
            maxWidth="880px"
            footer={
                <button
                    onClick={onClose}
                    className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                    Close
                </button>
            }
        >
            {items.length === 0 ? (
                <div className="py-10 text-center text-sm text-neutral-500">
                    No pending items.
                </div>
            ) : (
                <div className="overflow-x-auto -mx-2">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 border-b border-neutral-100">
                                <th className="px-2 py-2">Severity</th>
                                <th className="px-2 py-2">Title</th>
                                <th className="px-2 py-2">Status</th>
                                <th className="px-2 py-2">Owner</th>
                                <th className="px-2 py-2">ETA</th>
                                <th className="px-2 py-2 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {items.map((item) => {
                                const tint = item.severity === 'HIGH'
                                    ? 'bg-danger-50 text-danger-700 ring-danger-200'
                                    : item.severity === 'MEDIUM'
                                        ? 'bg-warning-50 text-warning-700 ring-warning-200'
                                        : 'bg-neutral-100 text-neutral-700 ring-neutral-200';
                                return (
                                    <tr key={item.id} className="hover:bg-neutral-50/60">
                                        <td className="px-2 py-3 align-top">
                                            <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold ring-1', tint)}>
                                                <AlertCircle className="w-3 h-3" />
                                                {item.severity}
                                            </span>
                                        </td>
                                        <td className="px-2 py-3 align-top">
                                            <div className="text-[12.5px] font-semibold text-neutral-900">{item.title}</div>
                                            {item.description && <div className="text-[11.5px] text-neutral-500 mt-0.5">{item.description}</div>}
                                        </td>
                                        <td className="px-2 py-3 align-top text-[12px] capitalize text-neutral-600">
                                            {item.status.toLowerCase().replace(/_/g, ' ')}
                                        </td>
                                        <td className="px-2 py-3 align-top text-[12px] text-neutral-600">{item.owner ?? '—'}</td>
                                        <td className="px-2 py-3 align-top text-[12px] text-neutral-600">{item.eta ?? '—'}</td>
                                        <td className="px-2 py-3 align-top text-right">
                                            <button
                                                onClick={() => onItemAction(item)}
                                                className="inline-flex items-center gap-1 rounded-md border border-primary-200 bg-white px-2.5 py-1 text-[11.5px] font-semibold text-primary-700 hover:bg-primary-50"
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </WizardModal>
    );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Row Issue Modal — Step 3 per-row exception detail                         */
/* ──────────────────────────────────────────────────────────────────────── */

export interface RowIssueDetail {
    employeeName: string;
    employeeCode?: string;
    department?: string | null;
    exceptionType?: string;
    severity?: 'HIGH' | 'MEDIUM' | 'LOW';
    note?: string | null;
    suggestedResolution?: string;
    grossEarnings?: number;
    totalDeductions?: number;
    netPay?: number;
}

interface RowIssueModalProps {
    open: boolean;
    onClose: () => void;
    detail: RowIssueDetail | null;
}

export function RowIssueModal({ open, onClose, detail }: RowIssueModalProps) {
    const sevTint = detail?.severity === 'HIGH'
        ? 'bg-danger-50 text-danger-700 ring-danger-200'
        : detail?.severity === 'MEDIUM'
            ? 'bg-warning-50 text-warning-700 ring-warning-200'
            : 'bg-neutral-100 text-neutral-700 ring-neutral-200';

    return (
        <WizardModal
            open={open}
            onClose={onClose}
            title={`Issue Details — ${detail?.employeeName ?? ''}`}
            subtitle={detail?.employeeCode ? `${detail.employeeCode}${detail?.department ? ' • ' + detail.department : ''}` : detail?.department ?? undefined}
            maxWidth="560px"
            footer={
                <button
                    onClick={onClose}
                    className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                    Close
                </button>
            }
        >
            {!detail ? (
                <div className="py-6 text-center text-sm text-neutral-500">No issue details available.</div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1', sevTint)}>
                            <AlertCircle className="w-3 h-3" />
                            {detail.severity ?? 'ISSUE'}
                        </span>
                        {detail.exceptionType && (
                            <span className="text-[12.5px] font-semibold text-neutral-800">{detail.exceptionType}</span>
                        )}
                    </div>

                    {detail.note && (
                        <div className="rounded-xl bg-neutral-50 ring-1 ring-neutral-100 p-3">
                            <div className="text-[10.5px] font-bold uppercase tracking-wider text-neutral-500 mb-1">Note</div>
                            <div className="text-[12.5px] text-neutral-700 leading-relaxed whitespace-pre-line">{detail.note}</div>
                        </div>
                    )}

                    {detail.suggestedResolution && (
                        <div className="rounded-xl bg-info-50/60 ring-1 ring-info-200 p-3">
                            <div className="text-[10.5px] font-bold uppercase tracking-wider text-info-700 mb-1">Suggested Resolution</div>
                            <div className="text-[12.5px] text-info-900 leading-relaxed">{detail.suggestedResolution}</div>
                        </div>
                    )}

                    <div className="grid grid-cols-3 gap-3">
                        <FieldTile label="Gross" value={detail.grossEarnings} />
                        <FieldTile label="Deductions" value={detail.totalDeductions} negative />
                        <FieldTile label="Net Pay" value={detail.netPay} highlight />
                    </div>
                </div>
            )}
        </WizardModal>
    );
}

function FieldTile({ label, value, negative, highlight }: { label: string; value: number | undefined; negative?: boolean; highlight?: boolean }) {
    const n = Number(value ?? 0);
    const formatted = `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
    return (
        <div className="rounded-xl bg-white ring-1 ring-neutral-200 p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">{label}</div>
            <div className={cn(
                'mt-1 text-[14px] font-bold font-mono',
                highlight ? 'text-success-700' : negative ? 'text-danger-700' : 'text-neutral-900',
            )}>
                {negative ? '-' : ''}{formatted}
            </div>
        </div>
    );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* BulkActions Dropdown                                                      */
/* ──────────────────────────────────────────────────────────────────────── */

interface BulkActionsDropdownProps {
    open: boolean;
    onToggle: () => void;
    onClose: () => void;
    selectedCount: number;
    onLock: () => void;
    onUnlock: () => void;
    onExport: () => void;
}

export function BulkActionsDropdown({ open, onToggle, onClose, selectedCount, onLock, onUnlock, onExport }: BulkActionsDropdownProps) {
    return (
        <div className="relative">
            <button
                onClick={onToggle}
                disabled={selectedCount === 0}
                className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold transition',
                    selectedCount === 0
                        ? 'border-neutral-200 text-neutral-400 cursor-not-allowed'
                        : 'border-primary-200 text-primary-700 hover:bg-primary-50',
                )}
            >
                Bulk Actions {selectedCount > 0 && <span className="rounded-full bg-primary-100 px-1.5 text-[10px] font-bold">{selectedCount}</span>}
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={onClose} />
                    <div className="absolute left-0 top-full mt-1.5 w-52 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-lg ring-1 ring-black/5 z-30">
                        <button
                            onClick={() => { onClose(); onLock(); }}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                        >
                            Lock Selected
                        </button>
                        <button
                            onClick={() => { onClose(); onUnlock(); }}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                        >
                            Unlock Selected
                        </button>
                        <button
                            onClick={() => { onClose(); onExport(); }}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                        >
                            Export Selected
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
