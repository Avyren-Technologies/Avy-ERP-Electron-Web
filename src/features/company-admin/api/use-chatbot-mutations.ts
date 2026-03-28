import { useMutation, useQueryClient } from '@tanstack/react-query';
import { chatbotApi } from '@/lib/api/chatbot';
import { chatbotKeys } from './use-chatbot-queries';

export function useCreateChatbotConversation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Record<string, unknown>) => chatbotApi.createConversation(data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: chatbotKeys.conversations() }); },
    });
}

export function useSendChatbotMessage() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ conversationId, data }: { conversationId: string; data: Record<string, unknown> }) =>
            chatbotApi.sendMessage(conversationId, data),
        onSuccess: (_data, variables) => {
            qc.invalidateQueries({ queryKey: chatbotKeys.messages(variables.conversationId) });
            qc.invalidateQueries({ queryKey: chatbotKeys.conversation(variables.conversationId) });
        },
    });
}

export function useEscalateChatbotConversation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => chatbotApi.escalateConversation(id),
        onSuccess: () => { qc.invalidateQueries({ queryKey: chatbotKeys.all }); },
    });
}

export function useCloseChatbotConversation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => chatbotApi.closeConversation(id),
        onSuccess: () => { qc.invalidateQueries({ queryKey: chatbotKeys.all }); },
    });
}
