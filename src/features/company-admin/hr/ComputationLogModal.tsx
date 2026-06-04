import { useMemo } from 'react';
import { X, Loader2, AlertCircle, FileX, ScrollText } from 'lucide-react';
import { useComputationLog } from '@/features/company-admin/api/use-payroll-run-queries';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';

interface Props {
    open: boolean;
    onClose: () => void;
    runId: string;
}

export function ComputationLogModal({ open, onClose, runId }: Props) {
    const fmt = useCompanyFormatter();
    const logQuery = useComputationLog(runId, open);

    const entries: any[] = useMemo(() => {
        const data: any = logQuery.data?.data;
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if (Array.isArray(data.entries)) return data.entries;
        if (Array.isArray(data.logs)) return data.logs;
        return [];
    }, [logQuery.data]);

    if (!open) return null;

    const errorObj: any = logQuery.error as any;
    const status = errorObj?.response?.status;
    const isUnavailable = status === 404;
    const isLoading = logQuery.isLoading;
    const hasError = !!logQuery.error && !isUnavailable;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
                    <div className="flex items-center gap-2">
                        <ScrollText className="w-5 h-5 text-primary-600" />
                        <h2 className="text-lg font-bold text-neutral-900">Computation Log</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-5">
                    {isLoading ? (
                        <div className="px-6 py-16 text-center text-sm text-neutral-500">
                            <Loader2 className="w-6 h-6 mx-auto animate-spin text-neutral-400 mb-2" />
                            Loading log entries...
                        </div>
                    ) : isUnavailable ? (
                        <div className="px-6 py-16 text-center text-sm text-neutral-500">
                            <FileX className="w-8 h-8 mx-auto text-neutral-400 mb-2" />
                            Data not yet available. The computation log endpoint will be enabled after backend deployment.
                        </div>
                    ) : hasError ? (
                        <div className="px-6 py-16 text-center text-sm text-danger-600">
                            <AlertCircle className="w-8 h-8 mx-auto text-danger-500 mb-2" />
                            Failed to load computation log.
                        </div>
                    ) : entries.length === 0 ? (
                        <div className="px-6 py-16 text-center text-sm text-neutral-500">
                            No computation log entries recorded.
                        </div>
                    ) : (
                        <ol className="space-y-3">
                            {entries.map((e, idx) => {
                                const ts = e.timestamp ?? e.createdAt ?? e.at;
                                const action = e.action ?? e.event ?? e.type ?? 'EVENT';
                                const actor = e.actorName ?? e.userName ?? e.performedBy ?? e.user ?? '—';
                                const details = e.details ?? e.metadata ?? e.payload ?? null;
                                const message = e.message ?? e.description ?? null;
                                return (
                                    <li
                                        key={e.id ?? idx}
                                        className="rounded-xl border border-neutral-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-[11px] font-semibold text-primary-700 ring-1 ring-primary-200">
                                                {String(action)}
                                            </span>
                                            <span className="text-[11px] font-mono text-neutral-500">
                                                {ts ? `${fmt.date(ts)} ${fmt.time(ts)}` : '—'}
                                            </span>
                                        </div>
                                        <div className="mt-2 text-[12.5px] text-neutral-700">
                                            <span className="text-neutral-500">By:</span>{' '}
                                            <span className="font-semibold">{String(actor)}</span>
                                        </div>
                                        {message && (
                                            <p className="mt-1.5 text-[12.5px] text-neutral-600">{String(message)}</p>
                                        )}
                                        {details && (
                                            <details className="mt-2">
                                                <summary className="cursor-pointer text-[11.5px] font-semibold text-primary-600 hover:text-primary-700">
                                                    Details
                                                </summary>
                                                <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-neutral-50 p-2.5 text-[11px] text-neutral-700 ring-1 ring-neutral-200">
                                                    {typeof details === 'string'
                                                        ? details
                                                        : JSON.stringify(details, null, 2)}
                                                </pre>
                                            </details>
                                        )}
                                    </li>
                                );
                            })}
                        </ol>
                    )}
                </div>

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
