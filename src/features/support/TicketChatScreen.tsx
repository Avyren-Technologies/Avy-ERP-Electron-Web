import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Send,
    Loader2,
    XCircle,
    Package,
    MapPin,
    Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    useSupportTicket,
    useSendSupportMessage,
    useCloseSupportTicket,
} from "@/features/company-admin/api";
import { useAuthStore } from "@/store/useAuthStore";
import { showSuccess, showApiError } from "@/lib/toast";
import { useTicketSocket } from "@/hooks/useTicketSocket";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SupportMessage {
    id: string;
    body: string;
    senderUserId: string | null;
    senderName: string;
    senderRole: string;
    isSystemMessage: boolean;
    createdAt: string;
}

interface TicketData {
    id: string;
    subject: string;
    category: string;
    status: string;
    priority: string;
    companyId?: string;
    createdByUserId: string;
    createdByName: string;
    metadata?: {
        type?: string;
        moduleId?: string;
        moduleName?: string;
        locationId?: string;
        locationName?: string;
    } | null;
    messages: SupportMessage[];
    createdAt: string;
    updatedAt: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STATUS_BADGE_CLASSES: Record<string, string> = {
    OPEN: "bg-info-100 text-info-700 dark:bg-info-900/40 dark:text-info-300",
    IN_PROGRESS: "bg-warning-100 text-warning-700 dark:bg-warning-900/40 dark:text-warning-300",
    WAITING_ON_CUSTOMER: "bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300",
    RESOLVED: "bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300",
    CLOSED: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
};

const STATUS_LABELS: Record<string, string> = {
    OPEN: "Open",
    IN_PROGRESS: "In Progress",
    WAITING_ON_CUSTOMER: "Waiting",
    RESOLVED: "Resolved",
    CLOSED: "Closed",
};

const CATEGORY_CHIP_CLASSES: Record<string, string> = {
    MODULE_CHANGE: "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300",
    BILLING: "bg-warning-100 text-warning-700 dark:bg-warning-900/40 dark:text-warning-300",
    TECHNICAL: "bg-danger-100 text-danger-700 dark:bg-danger-900/40 dark:text-danger-300",
    GENERAL: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
};

const CATEGORY_LABELS: Record<string, string> = {
    MODULE_CHANGE: "Module Change",
    BILLING: "Billing",
    TECHNICAL: "Technical",
    GENERAL: "General",
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatTime(dateStr: string): string {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();

    const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (isToday) return time;

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return `Yesterday ${time}`;

    return `${d.toLocaleDateString([], { day: "numeric", month: "short" })} ${time}`;
}

function formatDateSeparator(dateStr: string): string {
    const d = new Date(dateStr);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return "Today";

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";

    return d.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function shouldShowDateSeparator(messages: SupportMessage[], index: number): boolean {
    if (index === 0) return true;
    const prev = new Date(messages[index - 1].createdAt).toDateString();
    const curr = new Date(messages[index].createdAt).toDateString();
    return prev !== curr;
}

function isSameSenderGroup(messages: SupportMessage[], index: number): boolean {
    if (index === 0) return false;
    const prev = messages[index - 1];
    const curr = messages[index];
    if (prev.isSystemMessage || curr.isSystemMessage) return false;
    return prev.senderRole === curr.senderRole && prev.senderUserId === curr.senderUserId;
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }: { status: string }) {
    return (
        <span className={cn("px-2 py-0.5 text-[10px] font-bold uppercase rounded-full", STATUS_BADGE_CLASSES[status] ?? STATUS_BADGE_CLASSES.OPEN)}>
            {STATUS_LABELS[status] ?? status}
        </span>
    );
}

function CategoryChip({ category }: { category: string }) {
    return (
        <span className={cn("px-2 py-0.5 text-[10px] font-semibold rounded-md", CATEGORY_CHIP_CLASSES[category] ?? CATEGORY_CHIP_CLASSES.GENERAL)}>
            {CATEGORY_LABELS[category] ?? category}
        </span>
    );
}

function ModuleChangeSummary({ metadata }: { metadata: NonNullable<TicketData["metadata"]> }) {
    return (
        <div className="mx-4 mt-3 bg-primary-50 dark:bg-primary-950/30 rounded-xl border border-primary-200/60 dark:border-primary-800/40 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 mb-3">
                Module Change Request
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {metadata.moduleName && (
                    <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-primary-500 flex-shrink-0" />
                        <div>
                            <p className="text-[10px] font-semibold text-primary-400 uppercase">Module</p>
                            <p className="text-sm font-semibold text-primary-900 dark:text-primary-100">{metadata.moduleName}</p>
                        </div>
                    </div>
                )}
                {metadata.locationName && (
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary-500 flex-shrink-0" />
                        <div>
                            <p className="text-[10px] font-semibold text-primary-400 uppercase">Location</p>
                            <p className="text-sm font-semibold text-primary-900 dark:text-primary-100">{metadata.locationName}</p>
                        </div>
                    </div>
                )}
                {metadata.type && (
                    <div>
                        <p className="text-[10px] font-semibold text-primary-400 uppercase">Request Type</p>
                        <span className={cn(
                            "inline-block mt-0.5 px-2 py-0.5 text-xs font-bold rounded-md uppercase",
                            metadata.type === "add"
                                ? "bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300"
                                : "bg-danger-100 text-danger-700 dark:bg-danger-900/40 dark:text-danger-300",
                        )}>
                            {metadata.type}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Main Screen                                                        */
/* ------------------------------------------------------------------ */

export function TicketChatScreen() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);
    const userRole = useAuthStore((s) => s.userRole);

    const { data, isLoading } = useSupportTicket(id!);
    const sendMutation = useSendSupportMessage();
    const closeMutation = useCloseSupportTicket();

    const [message, setMessage] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const ticket: TicketData | null = data?.data ?? data?.ticket ?? null;

    useTicketSocket(id, ticket?.companyId);
    const messages: SupportMessage[] = ticket?.messages ?? [];
    const isClosed = ticket?.status === "CLOSED";

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages.length]);

    function handleSend() {
        const body = message.trim();
        if (!body || !id) return;
        sendMutation.mutate(
            { id, body },
            {
                onSuccess: () => {
                    setMessage("");
                    inputRef.current?.focus();
                },
                onError: (err) => showApiError(err),
            },
        );
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    function handleClose() {
        if (!id) return;
        closeMutation.mutate(id, {
            onSuccess: () => showSuccess("Ticket closed"),
            onError: (err) => showApiError(err),
        });
    }

    function isOwnMessage(msg: SupportMessage): boolean {
        // Match by userId first
        if (msg.senderUserId && user?.id) {
            return msg.senderUserId === user.id;
        }
        // Fallback: match by role
        if (userRole === "company-admin" && msg.senderRole === "COMPANY_ADMIN") return true;
        if (userRole === "super-admin" && msg.senderRole === "SUPER_ADMIN") return true;
        return false;
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[70vh]">
                <Loader2 className="w-7 h-7 text-primary-500 animate-spin" />
            </div>
        );
    }

    // Not found
    if (!ticket) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] text-center">
                <p className="text-base font-semibold text-neutral-500">Ticket not found</p>
                <button
                    onClick={() => navigate("/app/help")}
                    className="mt-3 text-sm font-semibold text-primary-600 hover:text-primary-700"
                >
                    Back to Help & Support
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-7rem)] max-w-4xl animate-in fade-in duration-300">
            {/* ── Header ── */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4 mb-3 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                        <button
                            onClick={() => navigate("/app/help")}
                            className="mt-0.5 p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex-shrink-0"
                        >
                            <ArrowLeft className="w-5 h-5 text-neutral-500" />
                        </button>
                        <div className="min-w-0">
                            <h1 className="text-lg font-bold text-neutral-900 dark:text-white truncate">
                                {ticket.subject}
                            </h1>
                            <div className="flex items-center gap-2 mt-1.5">
                                <StatusBadge status={ticket.status} />
                                <CategoryChip category={ticket.category} />
                            </div>
                        </div>
                    </div>

                    {!isClosed && (
                        <button
                            onClick={handleClose}
                            disabled={closeMutation.isPending}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-danger-600 hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-950/30 border border-danger-200 dark:border-danger-800/40 transition-colors flex-shrink-0"
                        >
                            {closeMutation.isPending ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <XCircle className="w-3.5 h-3.5" />
                            )}
                            Close Ticket
                        </button>
                    )}
                </div>

                {/* Module change summary card */}
                {ticket.category === "MODULE_CHANGE" && ticket.metadata && (
                    <ModuleChangeSummary metadata={ticket.metadata} />
                )}
            </div>

            {/* ── Messages ── */}
            <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 p-4 space-y-3"
            >
                {messages.length === 0 && (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-sm text-neutral-400">No messages yet. Start the conversation below.</p>
                    </div>
                )}

                {messages.map((msg, index) => {
                    const showDateSep = shouldShowDateSeparator(messages, index);
                    const sameGroup = isSameSenderGroup(messages, index);

                    return (
                        <div key={msg.id}>
                            {/* Date separator */}
                            {showDateSep && (
                                <div className="flex items-center justify-center py-3">
                                    <div className="flex-1 border-t border-neutral-200 dark:border-neutral-700" />
                                    <span className="px-3 text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                                        {formatDateSeparator(msg.createdAt)}
                                    </span>
                                    <div className="flex-1 border-t border-neutral-200 dark:border-neutral-700" />
                                </div>
                            )}

                            {/* System message */}
                            {msg.isSystemMessage ? (
                                <div className="flex justify-center py-1">
                                    <p className="text-xs text-neutral-400 dark:text-neutral-500 italic text-center max-w-md">
                                        {msg.body}
                                    </p>
                                </div>
                            ) : (() => {
                                const own = isOwnMessage(msg);
                                return (
                                    <div className={cn("flex", own ? "justify-end" : "justify-start", sameGroup ? "mt-1" : "mt-3")}>
                                        <div className={cn("max-w-[75%]", own ? "items-end" : "items-start")}>
                                            <div
                                                className={cn(
                                                    "px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
                                                    own
                                                        ? "bg-primary-600 text-white rounded-br-md"
                                                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-bl-md",
                                                )}
                                            >
                                                {msg.body}
                                            </div>
                                            <div className={cn("flex items-center gap-1.5 mt-1 px-1", own ? "justify-end" : "justify-start")}>
                                                {!sameGroup && (
                                                    <>
                                                        <span className="text-[10px] font-medium text-neutral-400">{msg.senderName}</span>
                                                        <span className="text-[10px] text-neutral-300 dark:text-neutral-600">{"\u00B7"}</span>
                                                    </>
                                                )}
                                                <span className="text-[10px] text-neutral-400">{formatTime(msg.createdAt)}</span>
                                                {own && <Check className="w-3 h-3 text-neutral-400" />}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    );
                })}

                <div ref={messagesEndRef} />
            </div>

            {/* ── Input Bar ── */}
            <div className="mt-3 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-3 shadow-sm">
                {isClosed ? (
                    <p className="text-center text-sm text-neutral-400 py-1">
                        This ticket is closed. You can create a new ticket if you need further assistance.
                    </p>
                ) : (
                    <div className="flex items-end gap-2">
                        <textarea
                            ref={inputRef}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type your message..."
                            rows={1}
                            className="flex-1 px-3.5 py-2.5 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                            style={{ minHeight: "40px", maxHeight: "120px" }}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!message.trim() || sendMutation.isPending}
                            className={cn(
                                "p-2.5 rounded-xl transition-colors flex-shrink-0",
                                message.trim() && !sendMutation.isPending
                                    ? "bg-primary-600 text-white hover:bg-primary-700"
                                    : "bg-neutral-200 text-neutral-400 cursor-not-allowed dark:bg-neutral-700 dark:text-neutral-500",
                            )}
                        >
                            {sendMutation.isPending ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Send className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
