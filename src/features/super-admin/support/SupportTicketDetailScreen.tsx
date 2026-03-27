import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, MessageSquare, Send, Zap, CheckCircle2, XCircle,
    Building2, Clock, Tag, AlertTriangle, Loader2, User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlatformSupportTicket } from '@/features/super-admin/api/use-support-queries';
import {
    useReplySupportTicket,
    useUpdateTicketStatus,
    useApproveModuleChange,
    useRejectModuleChange,
} from '@/features/super-admin/api/use-support-mutations';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STATUS_LABELS: Record<string, string> = {
    OPEN: 'Open',
    IN_PROGRESS: 'In Progress',
    WAITING_ON_CUSTOMER: 'Waiting on Customer',
    RESOLVED: 'Resolved',
    CLOSED: 'Closed',
};

const CATEGORY_LABELS: Record<string, string> = {
    MODULE_CHANGE: 'Module Change',
    BILLING: 'Billing',
    TECHNICAL: 'Technical',
    GENERAL: 'General',
};

const STATUS_TRANSITIONS: Record<string, string[]> = {
    OPEN: ['IN_PROGRESS', 'WAITING_ON_CUSTOMER', 'RESOLVED', 'CLOSED'],
    IN_PROGRESS: ['WAITING_ON_CUSTOMER', 'RESOLVED', 'CLOSED'],
    WAITING_ON_CUSTOMER: ['IN_PROGRESS', 'RESOLVED', 'CLOSED'],
    RESOLVED: ['CLOSED', 'OPEN'],
    CLOSED: ['OPEN'],
};

function getStatusStyle(status: string): string {
    switch (status) {
        case 'OPEN':
            return 'bg-info-50 text-info-700 border-info-200 dark:bg-info-900/20 dark:text-info-400 dark:border-info-800/50';
        case 'IN_PROGRESS':
            return 'bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50';
        case 'WAITING_ON_CUSTOMER':
            return 'bg-accent-50 text-accent-700 border-accent-200 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50';
        case 'RESOLVED':
            return 'bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50';
        case 'CLOSED':
            return 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700';
        default:
            return 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700';
    }
}

function getCategoryStyle(category: string): string {
    switch (category) {
        case 'MODULE_CHANGE':
            return 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50';
        case 'BILLING':
            return 'bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50';
        case 'TECHNICAL':
            return 'bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50';
        case 'GENERAL':
            return 'bg-info-50 text-info-700 border-info-200 dark:bg-info-900/20 dark:text-info-400 dark:border-info-800/50';
        default:
            return 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700';
    }
}

function getPriorityStyle(priority: string): string {
    switch (priority) {
        case 'URGENT':
            return 'bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50';
        case 'HIGH':
            return 'bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50';
        case 'NORMAL':
            return 'bg-info-50 text-info-700 border-info-200 dark:bg-info-900/20 dark:text-info-400 dark:border-info-800/50';
        case 'LOW':
            return 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700';
        default:
            return 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700';
    }
}

function formatTimestamp(ts: string): string {
    try {
        return new Date(ts).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true,
        });
    } catch {
        return ts;
    }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function SupportTicketDetailScreen() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data, isLoading, isError } = usePlatformSupportTicket(id ?? '');
    const replyMutation = useReplySupportTicket();
    const statusMutation = useUpdateTicketStatus();
    const approveMutation = useApproveModuleChange();
    const rejectMutation = useRejectModuleChange();

    const [messageBody, setMessageBody] = useState('');
    const [newStatus, setNewStatus] = useState('');
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectInput, setShowRejectInput] = useState(false);

    const chatEndRef = useRef<HTMLDivElement>(null);

    const ticket = data?.data;
    const messages: any[] = ticket?.messages ?? [];
    const company = ticket?.company;
    const moduleRequest = ticket?.moduleRequest;

    // Scroll to bottom on new messages
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length]);

    // Set default status transition option
    useEffect(() => {
        if (ticket?.status && !newStatus) {
            const transitions = STATUS_TRANSITIONS[ticket.status] ?? [];
            if (transitions.length > 0) setNewStatus(transitions[0]);
        }
    }, [ticket?.status]);

    const handleSendMessage = () => {
        if (!messageBody.trim() || !id) return;
        replyMutation.mutate({ id, body: messageBody.trim() }, {
            onSuccess: () => setMessageBody(''),
        });
    };

    const handleUpdateStatus = () => {
        if (!newStatus || !id) return;
        statusMutation.mutate({ id, status: newStatus });
    };

    const handleApprove = () => {
        if (!id) return;
        approveMutation.mutate(id);
    };

    const handleReject = () => {
        if (!rejectReason.trim() || !id) return;
        rejectMutation.mutate({ id, reason: rejectReason.trim() }, {
            onSuccess: () => {
                setRejectReason('');
                setShowRejectInput(false);
            },
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96 text-neutral-400">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    if (isError || !ticket) {
        return (
            <div className="space-y-4 animate-in fade-in duration-500">
                <button onClick={() => navigate('/app/support')} className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium">
                    <ArrowLeft className="w-4 h-4" /> Back to Support
                </button>
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-6 text-sm text-danger-700 dark:text-danger-400 font-medium">
                    Failed to load ticket details. The ticket may not exist or you may not have access.
                </div>
            </div>
        );
    }

    const allowedTransitions = STATUS_TRANSITIONS[ticket.status] ?? [];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/app/support')}
                    className="flex items-center justify-center w-10 h-10 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                </button>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        {ticket.category === 'MODULE_CHANGE' && (
                            <span className="flex items-center justify-center w-6 h-6 rounded bg-primary-100 dark:bg-primary-900/30" title="Module Change Request">
                                <Zap className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                            </span>
                        )}
                        <h1 className="text-2xl font-bold text-primary-950 dark:text-white tracking-tight truncate">
                            {ticket.subject}
                        </h1>
                    </div>
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-0.5">
                        Ticket #{ticket.id?.slice(0, 8)} &middot; Created {formatTimestamp(ticket.createdAt)}
                    </p>
                </div>
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left column (2/3) */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Ticket Info Card */}
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 p-5 shadow-sm transition-colors">
                        <h2 className="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mb-4">Ticket Details</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div>
                                <p className="text-xs text-neutral-400 dark:text-neutral-500 font-medium mb-1">Category</p>
                                <span className={cn('inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border', getCategoryStyle(ticket.category))}>
                                    {CATEGORY_LABELS[ticket.category] ?? ticket.category}
                                </span>
                            </div>
                            <div>
                                <p className="text-xs text-neutral-400 dark:text-neutral-500 font-medium mb-1">Priority</p>
                                <span className={cn('inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border', getPriorityStyle(ticket.priority))}>
                                    {ticket.priority}
                                </span>
                            </div>
                            <div>
                                <p className="text-xs text-neutral-400 dark:text-neutral-500 font-medium mb-1">Status</p>
                                <span className={cn('inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border', getStatusStyle(ticket.status))}>
                                    {STATUS_LABELS[ticket.status] ?? ticket.status}
                                </span>
                            </div>
                            <div>
                                <p className="text-xs text-neutral-400 dark:text-neutral-500 font-medium mb-1">Created By</p>
                                <p className="text-sm text-neutral-700 dark:text-neutral-300 font-medium">
                                    {ticket.createdByName ?? ticket.createdByEmail ?? '—'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Module Request Card (MODULE_CHANGE only) */}
                    {ticket.category === 'MODULE_CHANGE' && moduleRequest && (
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-primary-200/60 dark:border-primary-800/50 p-5 shadow-sm transition-colors">
                            <div className="flex items-center gap-2 mb-4">
                                <Zap className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                <h2 className="text-sm font-bold text-primary-700 dark:text-primary-400 uppercase tracking-widest">Module Change Request</h2>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                                <div>
                                    <p className="text-xs text-neutral-400 dark:text-neutral-500 font-medium mb-1">Request Type</p>
                                    <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                                        {moduleRequest.requestType === 'ADD' ? 'Add Module' : 'Remove Module'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-400 dark:text-neutral-500 font-medium mb-1">Module</p>
                                    <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                                        {moduleRequest.moduleName ?? moduleRequest.moduleId}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-400 dark:text-neutral-500 font-medium mb-1">Location</p>
                                    <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                                        {moduleRequest.locationName ?? '—'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-400 dark:text-neutral-500 font-medium mb-1">Approval Status</p>
                                    <span className={cn(
                                        'inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border',
                                        moduleRequest.approvalStatus === 'APPROVED'
                                            ? 'bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50'
                                            : moduleRequest.approvalStatus === 'REJECTED'
                                                ? 'bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50'
                                                : 'bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50',
                                    )}>
                                        {moduleRequest.approvalStatus ?? 'PENDING'}
                                    </span>
                                </div>
                            </div>

                            {/* Action buttons (only when pending) */}
                            {(!moduleRequest.approvalStatus || moduleRequest.approvalStatus === 'PENDING') && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={handleApprove}
                                            disabled={approveMutation.isPending}
                                            className="flex items-center gap-2 px-4 py-2 bg-success-600 hover:bg-success-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                                        >
                                            {approveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => setShowRejectInput(!showRejectInput)}
                                            className="flex items-center gap-2 px-4 py-2 bg-danger-600 hover:bg-danger-700 text-white rounded-xl text-sm font-semibold transition-colors"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            Reject
                                        </button>
                                    </div>

                                    {showRejectInput && (
                                        <div className="flex items-start gap-3">
                                            <textarea
                                                value={rejectReason}
                                                onChange={(e) => setRejectReason(e.target.value)}
                                                placeholder="Reason for rejection..."
                                                rows={2}
                                                className="flex-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-danger-500/20 focus:border-danger-500 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 transition-all resize-none"
                                            />
                                            <button
                                                onClick={handleReject}
                                                disabled={rejectMutation.isPending || !rejectReason.trim()}
                                                className="px-4 py-2 bg-danger-600 hover:bg-danger-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                                            >
                                                {rejectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Chat Messages */}
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm transition-colors overflow-hidden">
                        <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" />
                                Conversation
                            </h2>
                        </div>

                        <div className="p-5 space-y-4 max-h-[500px] overflow-y-auto">
                            {messages.length === 0 && (
                                <p className="text-center text-sm text-neutral-400 dark:text-neutral-500 py-8">No messages yet. Start the conversation below.</p>
                            )}

                            {messages.map((msg: any, idx: number) => {
                                const isSystem = msg.senderType === 'SYSTEM';
                                const isSuperAdmin = msg.senderType === 'SUPER_ADMIN' || msg.senderRole === 'super-admin';

                                if (isSystem) {
                                    return (
                                        <div key={msg.id ?? idx} className="text-center">
                                            <p className="text-xs text-neutral-400 dark:text-neutral-500 italic font-medium">{msg.body}</p>
                                            <p className="text-[10px] text-neutral-300 dark:text-neutral-600 mt-0.5">{formatTimestamp(msg.createdAt)}</p>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={msg.id ?? idx} className={cn('flex', isSuperAdmin ? 'justify-end' : 'justify-start')}>
                                        <div className={cn(
                                            'max-w-[75%] rounded-2xl px-4 py-3 shadow-sm',
                                            isSuperAdmin
                                                ? 'bg-primary-600 text-white rounded-br-md'
                                                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-bl-md',
                                        )}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <User className={cn('w-3.5 h-3.5', isSuperAdmin ? 'text-primary-200' : 'text-neutral-400 dark:text-neutral-500')} />
                                                <span className={cn('text-xs font-semibold', isSuperAdmin ? 'text-primary-200' : 'text-neutral-500 dark:text-neutral-400')}>
                                                    {msg.senderName ?? (isSuperAdmin ? 'You' : 'Company Admin')}
                                                </span>
                                            </div>
                                            <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                                            <p className={cn('text-[10px] mt-1.5', isSuperAdmin ? 'text-primary-200' : 'text-neutral-400 dark:text-neutral-500')}>
                                                {formatTimestamp(msg.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}

                            <div ref={chatEndRef} />
                        </div>

                        {/* Message Input */}
                        {ticket.status !== 'CLOSED' && (
                            <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                                <div className="flex items-end gap-3">
                                    <textarea
                                        value={messageBody}
                                        onChange={(e) => setMessageBody(e.target.value)}
                                        placeholder="Type your reply..."
                                        rows={2}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                        className="flex-1 px-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:focus:border-primary-500 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 transition-all resize-none"
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={replyMutation.isPending || !messageBody.trim()}
                                        className="flex items-center justify-center w-10 h-10 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-colors disabled:opacity-50 shrink-0"
                                    >
                                        {replyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right column (1/3) */}
                <div className="space-y-6">

                    {/* Company Context Card */}
                    {company && (
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 p-5 shadow-sm transition-colors">
                            <div className="flex items-center gap-2 mb-4">
                                <Building2 className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
                                <h2 className="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">Company</h2>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs text-neutral-400 dark:text-neutral-500 font-medium mb-0.5">Name</p>
                                    <p className="text-sm text-neutral-800 dark:text-neutral-200 font-semibold">{company.name}</p>
                                </div>
                                {company.billingType && (
                                    <div>
                                        <p className="text-xs text-neutral-400 dark:text-neutral-500 font-medium mb-0.5">Billing Type</p>
                                        <p className="text-sm text-neutral-700 dark:text-neutral-300 font-medium">{company.billingType}</p>
                                    </div>
                                )}
                                {company.userTier && (
                                    <div>
                                        <p className="text-xs text-neutral-400 dark:text-neutral-500 font-medium mb-0.5">User Tier</p>
                                        <p className="text-sm text-neutral-700 dark:text-neutral-300 font-medium capitalize">{company.userTier}</p>
                                    </div>
                                )}
                                {company.wizardStatus && (
                                    <div>
                                        <p className="text-xs text-neutral-400 dark:text-neutral-500 font-medium mb-0.5">Setup Status</p>
                                        <span className={cn(
                                            'inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border',
                                            company.wizardStatus === 'Active'
                                                ? 'bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50'
                                                : 'bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50',
                                        )}>
                                            {company.wizardStatus}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Status Management */}
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 p-5 shadow-sm transition-colors">
                        <div className="flex items-center gap-2 mb-4">
                            <Tag className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
                            <h2 className="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">Status Management</h2>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-neutral-400 dark:text-neutral-500 font-medium mb-1">Current Status</p>
                                <span className={cn('inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border', getStatusStyle(ticket.status))}>
                                    {STATUS_LABELS[ticket.status] ?? ticket.status}
                                </span>
                            </div>

                            {allowedTransitions.length > 0 && (
                                <>
                                    <div>
                                        <p className="text-xs text-neutral-400 dark:text-neutral-500 font-medium mb-1">Change To</p>
                                        <select
                                            value={newStatus}
                                            onChange={(e) => setNewStatus(e.target.value)}
                                            className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:focus:border-primary-500 dark:text-white transition-all"
                                        >
                                            {allowedTransitions.map((s) => (
                                                <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <button
                                        onClick={handleUpdateStatus}
                                        disabled={statusMutation.isPending || !newStatus}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                                    >
                                        {statusMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                        Update Status
                                    </button>
                                </>
                            )}

                            {statusMutation.isSuccess && (
                                <p className="text-xs text-success-600 dark:text-success-400 font-medium">Status updated successfully.</p>
                            )}
                            {statusMutation.isError && (
                                <p className="text-xs text-danger-600 dark:text-danger-400 font-medium">Failed to update status.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
