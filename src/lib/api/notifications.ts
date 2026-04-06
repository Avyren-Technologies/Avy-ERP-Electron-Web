import { client } from './client';

export const notificationApi = {
    listNotifications: async (params?: { page?: number; limit?: number }) => {
        const response = await client.get('/notifications', { params });
        return response.data;
    },

    getUnreadCount: async () => {
        const response = await client.get('/notifications/unread-count');
        return response.data;
    },

    markAsRead: async (id: string) => {
        const response = await client.patch(`/notifications/${id}/read`);
        return response.data;
    },

    markAllAsRead: async () => {
        const response = await client.patch('/notifications/read-all');
        return response.data;
    },
};
