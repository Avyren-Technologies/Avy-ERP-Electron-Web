import { client } from './client';
import type { ApiResponse } from './auth';

// ── Conversations ──

async function createConversation(data: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/chatbot/conversations', data);
    return response.data;
}

async function listConversations(params?: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/chatbot/conversations', { params });
    return response.data;
}

async function getConversation(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/chatbot/conversations/${id}`);
    return response.data;
}

async function escalateConversation(id: string): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/chatbot/conversations/${id}/escalate`);
    return response.data;
}

async function closeConversation(id: string): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/chatbot/conversations/${id}/close`);
    return response.data;
}

// ── Messages ──

async function sendMessage(conversationId: string, data: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.post(`/hr/chatbot/conversations/${conversationId}/messages`, data);
    return response.data;
}

async function listMessages(conversationId: string, params?: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/chatbot/conversations/${conversationId}/messages`, { params });
    return response.data;
}

export const chatbotApi = {
    createConversation,
    listConversations,
    getConversation,
    escalateConversation,
    closeConversation,
    sendMessage,
    listMessages,
};
