import { useQuery } from '@tanstack/react-query';
import { chatbotApi } from '@/lib/api/chatbot';

export const chatbotKeys = {
    all: ['chatbot'] as const,
    conversations: (params?: Record<string, unknown>) => [...chatbotKeys.all, 'conversations', params] as const,
    conversation: (id: string) => [...chatbotKeys.all, 'conversation', id] as const,
    messages: (conversationId: string, params?: Record<string, unknown>) => [...chatbotKeys.all, 'messages', conversationId, params] as const,
};

export function useChatbotConversations(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: chatbotKeys.conversations(params),
        queryFn: () => chatbotApi.listConversations(params),
    });
}

export function useChatbotConversation(id: string) {
    return useQuery({
        queryKey: chatbotKeys.conversation(id),
        queryFn: () => chatbotApi.getConversation(id),
        enabled: !!id,
    });
}

export function useChatbotMessages(conversationId: string, params?: Record<string, unknown>) {
    return useQuery({
        queryKey: chatbotKeys.messages(conversationId, params),
        queryFn: () => chatbotApi.listMessages(conversationId, params),
        enabled: !!conversationId,
    });
}
