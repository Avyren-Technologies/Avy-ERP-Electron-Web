import { useState, useEffect, useMemo } from 'react';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import { useNavigate } from 'react-router-dom';
import {
    ClipboardList, Search, Filter, X, CheckCircle2, XCircle,
    ChevronLeft, ChevronRight, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRegistrations, useUpdateRegistrationMutation } from '@/lib/api/platform-registrations';
import type { RegistrationRequest } from '@/lib/api/platform-registrations';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STATUS_OPTIONS = ['All', 'PENDING', 'APPROVED', 'REJECTED'] as const;

const STATUS_LABELS: Record<string, string> = {
    PENDING: 'Pending',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
};

function getStatusStyle(status: string): string {
    switch (status) {
        case 'PENDING':
            return 'bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50';
        case 'APPROVED':
            return 'bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50';
        case 'REJECTED':
            return 'bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50';
        default:
            return 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700';
    }
}

function formatRelativeTime(ts: string, fmt: ReturnType<typeof useCompanyFormatter>): string {
    try {
        const now = Date.now();
        const diff = now - new Date(ts).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d ago`;
        return fmt.date(ts);
    } catch {
        return ts;
    }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function RegistrationListScreen() {
    const fmt = useCompanyFormatter();
    const navigate = useNavigate();
    const updateMutation = useUpdateRegistrationMutation();

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [page, setPage] = useState(1);
    const limit = 20;

    // Reject modal state
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectTargetId, setRejectTargetId] = useState('');
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    const params = useMemo(() => ({
        page,
        limit,
        status: statusFilter === 'All' ? undefined : statusFilter,
        search: debouncedSearch || undefined,
    }), [page, limit, statusFilter, debouncedSearch]);

    const { data, isLoading, isError } = useRegistrations(params);

    const registrations: RegistrationRequest[] = data?.data ?? [];
    const meta = data?.meta;
    const total = meta?.total ?? registrations.length;

    // Compute stats from all registrations (use total counts from meta when available)
    const statsParams = useMemo(() => ({ limit: 1 }), []);
    const { data: pendingData } = useRegistrations({ ...statsParams, status: 'PENDING' });
    const { data: approvedData } = useRegistrations({ ...statsParams, status: 'APPROVED' });
    const { data: rejectedData } = useRegistrations({ ...statsParams, status: 'REJECTED' });

    const stats = {
        pending: pendingData?.meta?.total ?? 0,
        approved: approvedData?.meta?.total ?? 0,
        rejected: rejectedData?.meta?.total ?? 0,
        total: (pendingData?.meta?.total ?? 0) + (approvedData?.meta?.total ?? 0) + (rejectedData?.meta?.total ?? 0),
    };

    const hasActiveFilters = statusFilter !== 'All' || search.length > 0;

    const resetFilters = () => {
        setSearch('');
        setStatusFilter('All');
        setPage(1);
    };

    const handleApprove = (e: React.MouseEvent, regId: string) => {
        e.stopPropagation();
        updateMutation.mutate(
            { id: regId, data: { status: 'APPROVED' } },
            {
                onSuccess: (result) => {
                    const prefill = result?.data?.wizardPrefill;
                    navigate('/app/companies/add', { state: { prefill } });
                },
            },
        );
    };

    const handleOpenRejectModal = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setRejectTargetId(id);
        setRejectReason('');
        setRejectModalOpen(true);
    };

    const handleConfirmReject = () => {
        if (!rejectReason.trim() || !rejectTargetId) return;
        updateMutation.mutate(
            { id: rejectTargetId, data: { status: 'REJECTED', rejectionReason: rejectReason.trim() } },
            {
                onSuccess: () => {
                    setRejectModalOpen(false);
                    setRejectTargetId('');
                    setRejectReason('');
                },
            },
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center border border-primary-100 dark:border-primary-800/50">
                            <ClipboardList className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Registration Requests</h1>
                            <p className="text-neutral-500 dark:text-neutral-400 mt-1">Review and manage company registration requests</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total', value: stats.total, color: 'info' },
                    { label: 'Pending', value: stats.pending, color: 'warning' },
                    { label: 'Approved', value: stats.approved, color: 'success' },
                    { label: 'Rejected', value: stats.rejected, color: 'danger' },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 p-5 shadow-sm transition-colors"
                    >
                        <p className={cn('text-3xl font-bold', {
                            'text-info-600 dark:text-info-400': stat.color === 'info',
                            'text-warning-600 dark:text-warning-400': stat.color === 'warning',
                            'text-success-600 dark:text-success-400': stat.color === 'success',
                            'text-danger-600 dark:text-danger-400': stat.color === 'danger',
                        })}>
                            {stat.value}
                        </p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 font-medium">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm flex flex-col gap-4 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Search */}
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                        <input
                            type="text"
                            placeholder="Search by company name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:focus:border-primary-500 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 transition-all"
                        />
                    </div>

                    {/* Dropdowns */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 shrink-0">
                            <Filter className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                            className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:focus:border-primary-500 dark:text-white transition-all"
                        >
                            {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>{s === 'All' ? 'All Statuses' : STATUS_LABELS[s] ?? s}</option>
                            ))}
                        </select>

                        {hasActiveFilters && (
                            <button
                                onClick={resetFilters}
                                className="px-3 py-2.5 rounded-xl text-sm font-medium text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors flex items-center gap-1.5"
                            >
                                <X className="w-4 h-4" />
                                Reset
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Error State */}
            {isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
                    Failed to load registration requests. Please try again.
                </div>
            )}

            {/* Registration List */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden transition-colors">
                {isLoading ? <SkeletonTable rows={8} cols={7} /> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Company Name</th>
                                    <th className="py-4 px-6 font-bold">Admin Name</th>
                                    <th className="py-4 px-6 font-bold">Email</th>
                                    <th className="py-4 px-6 font-bold">Phone</th>
                                    <th className="py-4 px-6 font-bold">Status</th>
                                    <th className="py-4 px-6 font-bold">Date</th>
                                    <th className="py-4 px-6 font-bold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {registrations.map((reg) => (
                                    <tr
                                        key={reg.id}
                                        onClick={() => navigate(`/app/registrations/${reg.id}`)}
                                        className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer"
                                    >
                                        <td className="py-4 px-6">
                                            <span className="text-neutral-800 dark:text-neutral-200 font-semibold">
                                                {reg.companyName}
                                            </span>
                                        </td>

                                        <td className="py-4 px-6">
                                            <span className="text-neutral-600 dark:text-neutral-300 font-medium">
                                                {reg.adminName}
                                            </span>
                                        </td>

                                        <td className="py-4 px-6">
                                            <span className="text-neutral-500 dark:text-neutral-400 text-xs font-medium">
                                                {reg.email}
                                            </span>
                                        </td>

                                        <td className="py-4 px-6">
                                            <span className="text-neutral-500 dark:text-neutral-400 text-xs font-medium">
                                                {reg.phone || '—'}
                                            </span>
                                        </td>

                                        <td className="py-4 px-6">
                                            <span className={cn(
                                                'inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border',
                                                getStatusStyle(reg.status),
                                            )}>
                                                {STATUS_LABELS[reg.status] ?? reg.status}
                                            </span>
                                        </td>

                                        <td className="py-4 px-6">
                                            <span className="text-neutral-500 dark:text-neutral-400 text-xs font-medium">
                                                {formatRelativeTime(reg.createdAt, fmt)}
                                            </span>
                                        </td>

                                        <td className="py-4 px-6">
                                            {reg.status === 'PENDING' && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={(e) => handleApprove(e, reg.id)}
                                                        disabled={updateMutation.isPending}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-success-600 hover:bg-success-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                                                    >
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleOpenRejectModal(e, reg.id)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-danger-600 hover:bg-danger-700 text-white rounded-lg text-xs font-semibold transition-colors"
                                                    >
                                                        <XCircle className="w-3.5 h-3.5" />
                                                        Reject
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}

                                {registrations.length === 0 && !isLoading && (
                                    <tr>
                                        <td colSpan={7}>
                                            <EmptyState icon="search" title="No registrations found" message="Try adjusting your filters." />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400 bg-neutral-50/50 dark:bg-neutral-900/50">
                    <span className="font-medium">
                        Showing {registrations.length > 0 ? ((page - 1) * limit) + 1 : 0} to {Math.min(page * limit, total)} of {total} entries
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
                            disabled={page <= 1}
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setPage((p) => p + 1)}
                            className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
                            disabled={!meta || page >= (meta.totalPages ?? 1)}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* Reject Reason Modal */}
            {rejectModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setRejectModalOpen(false)}>
                    <div
                        className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl w-full max-w-md mx-4 p-6 animate-in fade-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-danger-50 dark:bg-danger-900/30 flex items-center justify-center">
                                <XCircle className="w-5 h-5 text-danger-600 dark:text-danger-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Reject Registration</h2>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">Please provide a reason for rejection.</p>
                            </div>
                        </div>

                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Reason for rejection..."
                            rows={3}
                            autoFocus
                            className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-danger-500/20 focus:border-danger-500 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 transition-all resize-none mb-4"
                        />

                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={() => setRejectModalOpen(false)}
                                className="px-4 py-2.5 rounded-xl text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmReject}
                                disabled={updateMutation.isPending || !rejectReason.trim()}
                                className="flex items-center gap-2 px-4 py-2.5 bg-danger-600 hover:bg-danger-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                            >
                                {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                Confirm Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
