import { client } from './client';

export interface NotificationPreferenceData {
    inAppEnabled: boolean;
    pushEnabled: boolean;
    emailEnabled: boolean;
    smsEnabled: boolean;
    whatsappEnabled: boolean;
    deviceStrategy: 'ALL' | 'LATEST_ONLY';
    quietHoursEnabled: boolean;
    quietHoursStart: string | null;
    quietHoursEnd: string | null;
}

export interface NotificationPreferencesResponse {
    preference: NotificationPreferenceData;
    companyMasters: {
        inApp: boolean;
        push: boolean;
        email: boolean;
        sms: boolean;
        whatsapp: boolean;
    };
}

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

    archive: async (id: string) => {
        const response = await client.patch(`/notifications/${id}/archive`);
        return response.data;
    },

    getPreferences: async () => {
        const response = await client.get('/notifications/preferences');
        return response.data;
    },

    updatePreferences: async (data: Partial<NotificationPreferenceData>) => {
        const response = await client.patch('/notifications/preferences', data);
        return response.data;
    },

    getDeliveryEvents: async (id: string) => {
        const response = await client.get(`/notifications/${id}/events`);
        return response.data;
    },

    sendTestNotification: async () => {
        const response = await client.post('/notifications/test');
        return response.data;
    },
};
