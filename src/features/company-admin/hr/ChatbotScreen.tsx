import { useState, useRef, useEffect } from "react";
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import {
    MessageCircle,
    Send,
    Loader2,
    AlertTriangle,
    ArrowUpRight,
    Bot,
    User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatbotMessages } from "@/features/company-admin/api/use-chatbot-queries";
import { useCreateChatbotConversation, useSendChatbotMessage, useEscalateChatbotConversation } from "@/features/company-admin/api/use-chatbot-mutations";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Types ── */

interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: string;
}

/* ── Constants ── */

const QUICK_ACTIONS = [
    { label: "Leave Balance", icon: "🏖️" },
    { label: "My Payslip", icon: "💰" },
    { label: "Attendance", icon: "📋" },
    { label: "Holidays", icon: "🎉" },
    { label: "Talk to HR", icon: "🧑‍💼" },
];

/** GET .../messages returns `{ data: { conversation, messages } }` — not a bare array. */
function extractChatMessageRows(historyPayload: unknown): unknown[] {
    const inner = (historyPayload as { data?: unknown } | null | undefined)?.data;
    if (Array.isArray(inner)) return inner;
    if (inner && typeof inner === "object" && "messages" in inner && Array.isArray((inner as { messages: unknown }).messages)) {
        return (inner as { messages: unknown[] }).messages;
    }
    return [];
}

/* ── Atoms ── */

function MessageBubble({ message }: { message: ChatMessage }) {
    const fmt = useCompanyFormatter();
    const isUser = message.role === "user";
    return (
        <div className={cn("flex gap-3 max-w-[80%] animate-in fade-in slide-in-from-bottom-2 duration-300", isUser ? "ml-auto flex-row-reverse" : "mr-auto")}>
            <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1",
                isUser
                    ? "bg-primary-100 dark:bg-primary-900/30"
                    : "bg-neutral-100 dark:bg-neutral-800"
            )}>
                {isUser
                    ? <User className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    : <Bot className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                }
            </div>
            <div className={cn(
                "rounded-2xl px-4 py-3 text-sm leading-relaxed",
                isUser
                    ? "bg-primary-600 text-white rounded-tr-md"
                    : "bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-tl-md"
            )}>
                {message.content}
                <div className={cn(
                    "text-[10px] mt-1.5 opacity-60",
                    isUser ? "text-right" : "text-left"
                )}>
                    {message.timestamp ? fmt.time(message.timestamp) : ""}
                </div>
            </div>
        </div>
    );
}

function TypingIndicator() {
    return (
        <div className="flex gap-3 max-w-[80%] mr-auto animate-in fade-in duration-200">
            <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
            </div>
            <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl rounded-tl-md px-4 py-3 flex gap-1 items-center">
                <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const s = status?.toLowerCase();
    const cls = s === "active"
        ? "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50"
        : s === "escalated"
        ? "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50"
        : "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700";
    return (
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", cls)}>
            {status}
        </span>
    );
}

/* ── Screen ── */

export function ChatbotScreen() {
    const [input, setInput] = useState("");
    const [conversationId, setConversationId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const startConversation = useCreateChatbotConversation();
    const sendMessage = useSendChatbotMessage();
    const { data: historyData, isLoading: historyLoading } = useChatbotMessages(conversationId ?? "", undefined);
    const escalateChat = useEscalateChatbotConversation();

    const rawMessages = extractChatMessageRows(historyData);
    const messages: ChatMessage[] = rawMessages.map((m: any) => ({
        id: m.id,
        role: (m.role?.toLowerCase() === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.content ?? m.message ?? '',
        timestamp: m.createdAt ?? m.timestamp ?? new Date().toISOString(),
    }));

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Auto-start conversation on mount
    useEffect(() => {
        if (!conversationId) {
            startConversation.mutate({} as any, {
                onSuccess: (res: any) => {
                    setConversationId(res?.data?.id ?? res?.id ?? null);
                },
                onError: (err: unknown) => showApiError(err),
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSend = () => {
        if (!input.trim() || !conversationId) return;
        const msg = input.trim();
        setInput("");
        sendMessage.mutate(
            { conversationId, data: { content: msg } } as any,
            { onError: (err: unknown) => showApiError(err) }
        );
    };

    const handleQuickAction = (label: string) => {
        if (!conversationId) return;
        setInput("");
        sendMessage.mutate(
            { conversationId, data: { content: label } } as any,
            { onError: (err: unknown) => showApiError(err) }
        );
    };

    const handleEscalate = () => {
        if (!conversationId) return;
        escalateChat.mutate(
            conversationId,
            {
                onSuccess: () => showSuccess("Escalated", "Your conversation has been escalated to HR."),
                onError: (err: unknown) => showApiError(err),
            }
        );
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const isSending = sendMessage.isPending;

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-primary-950 dark:text-white tracking-tight">HR Assistant</h1>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">Ask anything about leave, payslips, attendance & more</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {conversationId && <StatusBadge status={escalateChat.isSuccess ? "Escalated" : "Active"} />}
                    <button
                        onClick={handleEscalate}
                        disabled={!conversationId || escalateChat.isPending || escalateChat.isSuccess}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-warning-200 dark:border-warning-800 text-sm font-bold text-warning-700 dark:text-warning-400 hover:bg-warning-50 dark:hover:bg-warning-900/20 transition-colors disabled:opacity-50"
                    >
                        <AlertTriangle className="w-4 h-4" />
                        Escalate to HR
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto py-6 space-y-4">
                {historyLoading && (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                    </div>
                )}
                {messages.length === 0 && !historyLoading && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center mb-4">
                            <Bot className="w-8 h-8 text-primary-500" />
                        </div>
                        <h3 className="text-lg font-bold text-primary-950 dark:text-white mb-1">Welcome to HR Assistant</h3>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm">
                            I can help you with leave balances, payslips, attendance queries and more. Try a quick action below or type your question.
                        </p>
                    </div>
                )}
                {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                ))}
                {isSending && <TypingIndicator />}
                <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {messages.length <= 2 && (
                <div className="flex flex-wrap gap-2 pb-3">
                    {QUICK_ACTIONS.map((action) => (
                        <button
                            key={action.label}
                            onClick={() => handleQuickAction(action.label)}
                            disabled={!conversationId || isSending}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-primary-50 hover:border-primary-200 dark:hover:bg-primary-900/20 dark:hover:border-primary-800 transition-all disabled:opacity-50"
                        >
                            <span>{action.icon}</span>
                            {action.label}
                            <ArrowUpRight className="w-3 h-3 opacity-40" />
                        </button>
                    ))}
                </div>
            )}

            {/* Input */}
            <div className="flex items-end gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <div className="flex-1 relative">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your question..."
                        rows={1}
                        className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none"
                    />
                </div>
                <button
                    onClick={handleSend}
                    disabled={!input.trim() || isSending || !conversationId}
                    className="w-11 h-11 rounded-xl bg-primary-600 hover:bg-primary-700 text-white flex items-center justify-center transition-colors disabled:opacity-50 shrink-0 shadow-md shadow-primary-500/20"
                >
                    {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
            </div>
        </div>
    );
}
