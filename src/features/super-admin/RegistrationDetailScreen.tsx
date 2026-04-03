import { useState } from 'react';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, ClipboardList, CheckCircle2, XCircle,
    Building2, Clock, Mail, Phone, User, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRegistration, useUpdateRegistrationMutation } from '@/lib/api/platform-registrations';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

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

function formatTimestamp(ts: string, fmt: ReturnType<typeof useCompanyFormatter>): string {
    try {
        return fmt.dateTime(ts);
    } catch {
        return ts;
    }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function RegistrationDetailScreen() {
    const fmt = useCompanyFormatter();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data, isLoading, isError } = useRegistration(id ?? '');
    const updateMutation = useUpdateRegistrationMutation();

    const [rejectReason, setRejectReason] = useState('');
    const [showRejectInput, setShowRejectInput] = useState(false);

    const registration = data?.data;

    const handleApprove = () => {
        if (!id) return;
        updateMutation.mutate({ id, data: { status: 'APPROVED' } });
    };

    const handleReject = () => {
        if (!rejectReason.trim() || !id) return;
        updateMutation.mutate(
            { id, data: { status: 'REJECTED', rejectionReason: rejectReason.trim() } },
            {
                onSuccess: () => {
                    setRejectReason('');
                    setShowRejectInput(false);
                },
            },
        );
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96 text-neutral-400">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    if (isError || !registration) {
        return (
            <div className="space-y-4 animate-in fade-in duration-500">
                <button onClick={() => navigate('/app/registrations')} className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium">
                    <ArrowLeft className="w-4 h-4" /> Back to Registrations
                </button>
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-6 text-sm text-danger-700 dark:text-danger-400 font-medium">
                    Failed to load registration details. The registration may not exist or you may not have access.
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/app/registrations')}
                    className="flex items-center justify-center w-10 h-10 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                </button>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold text-primary-950 dark:text-white tracking-tight truncate">
                            {registration.companyName}
                        </h1>
                        <span className={cn(
                            'inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border shrink-0',
                            getStatusStyle(registration.status),
                        )}>
                            {STATUS_LABELS[registration.status] ?? registration.status}
                        </span>
                    </div>
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-0.5">
                        Registration #{registration.id?.slice(0, 8)} &middot; Submitted {formatTimestamp(registration.createdAt, fmt)}
                    </p>
                </div>
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left column (2/3) */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Registration Details Card */}
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 p-5 shadow-sm transition-colors">
                        <h2 className="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mb-4">Registration Details</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                                    <Building2 className="w-4.5 h-4.5 text-primary-600 dark:text-primary-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-400 dark:text-neutral-500 font-medium mb-0.5">Company Name</p>
                                    <p className="text-sm text-neutral-800 dark:text-neutral-200 font-semibold">{registration.companyName}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-lg bg-accent-50 dark:bg-accent-900/30 flex items-center justify-center shrink-0">
                                    <User className="w-4.5 h-4.5 text-accent-600 dark:text-accent-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-400 dark:text-neutral-500 font-medium mb-0.5">Admin Name</p>
                                    <p className="text-sm text-neutral-800 dark:text-neutral-200 font-semibold">{registration.adminName}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-lg bg-info-50 dark:bg-info-900/30 flex items-center justify-center shrink-0">
                                    <Mail className="w-4.5 h-4.5 text-info-600 dark:text-info-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-400 dark:text-neutral-500 font-medium mb-0.5">Email</p>
                                    <p className="text-sm text-neutral-800 dark:text-neutral-200 font-semibold">{registration.email}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-lg bg-success-50 dark:bg-success-900/30 flex items-center justify-center shrink-0">
                                    <Phone className="w-4.5 h-4.5 text-success-600 dark:text-success-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-400 dark:text-neutral-500 font-medium mb-0.5">Phone</p>
                                    <p className="text-sm text-neutral-800 dark:text-neutral-200 font-semibold">{registration.phone || '—'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Rejection Reason Card (if rejected) */}
                    {registration.status === 'REJECTED' && registration.rejectionReason && (
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-danger-200/60 dark:border-danger-800/50 p-5 shadow-sm transition-colors">
                            <div className="flex items-center gap-2 mb-3">
                                <XCircle className="w-5 h-5 text-danger-600 dark:text-danger-400" />
                                <h2 className="text-sm font-bold text-danger-700 dark:text-danger-400 uppercase tracking-widest">Rejection Reason</h2>
                            </div>
                            <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">{registration.rejectionReason}</p>
                        </div>
                    )}

                    {/* Action Card (if pending) */}
                    {registration.status === 'PENDING' && (
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 p-5 shadow-sm transition-colors">
                            <h2 className="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mb-4">Actions</h2>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handleApprove}
                                        disabled={updateMutation.isPending}
                                        className="flex items-center gap-2 px-4 py-2 bg-success-600 hover:bg-success-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                                    >
                                        {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                        Approve Registration
                                    </button>
                                    <button
                                        onClick={() => setShowRejectInput(!showRejectInput)}
                                        className="flex items-center gap-2 px-4 py-2 bg-danger-600 hover:bg-danger-700 text-white rounded-xl text-sm font-semibold transition-colors"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        Reject Registration
                                    </button>
                                </div>

                                {showRejectInput && (
                                    <div className="flex items-start gap-3">
                                        <textarea
                                            value={rejectReason}
                                            onChange={(e) => setRejectReason(e.target.value)}
                                            placeholder="Reason for rejection..."
                                            rows={2}
                                            autoFocus
                                            className="flex-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-danger-500/20 focus:border-danger-500 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 transition-all resize-none"
                                        />
                                        <button
                                            onClick={handleReject}
                                            disabled={updateMutation.isPending || !rejectReason.trim()}
                                            className="px-4 py-2 bg-danger-600 hover:bg-danger-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                                        >
                                            {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right column (1/3) */}
                <div className="space-y-6">

                    {/* Status Card */}
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 p-5 shadow-sm transition-colors">
                        <div className="flex items-center gap-2 mb-4">
                            <ClipboardList className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
                            <h2 className="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">Status</h2>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-neutral-400 dark:text-neutral-500 font-medium mb-1">Current Status</p>
                                <span className={cn('inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border', getStatusStyle(registration.status))}>
                                    {STATUS_LABELS[registration.status] ?? registration.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Timeline Card */}
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 p-5 shadow-sm transition-colors">
                        <div className="flex items-center gap-2 mb-4">
                            <Clock className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
                            <h2 className="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">Timeline</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                                <div>
                                    <p className="text-xs text-neutral-400 dark:text-neutral-500 font-medium mb-0.5">Submitted</p>
                                    <p className="text-sm text-neutral-700 dark:text-neutral-300 font-medium">{formatTimestamp(registration.createdAt, fmt)}</p>
                                </div>
                            </div>
                            {registration.updatedAt && registration.updatedAt !== registration.createdAt && (
                                <div className="flex items-start gap-3">
                                    <div className={cn(
                                        'w-2.5 h-2.5 rounded-full mt-1.5 shrink-0',
                                        registration.status === 'APPROVED' ? 'bg-success-500' : registration.status === 'REJECTED' ? 'bg-danger-500' : 'bg-warning-500',
                                    )} />
                                    <div>
                                        <p className="text-xs text-neutral-400 dark:text-neutral-500 font-medium mb-0.5">
                                            {registration.status === 'APPROVED' ? 'Approved' : registration.status === 'REJECTED' ? 'Rejected' : 'Updated'}
                                        </p>
                                        <p className="text-sm text-neutral-700 dark:text-neutral-300 font-medium">{formatTimestamp(registration.updatedAt, fmt)}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
