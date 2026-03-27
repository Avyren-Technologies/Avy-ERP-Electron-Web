import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
    if (!socket) {
        const apiUrl = import.meta.env.VITE_API_URL || 'https://avy-erp-api.avyren.in';
        // Remove /api/v1 suffix for socket connection
        const baseUrl = apiUrl.replace(/\/api\/v1\/?$/, '');
        socket = io(baseUrl, {
            transports: ['websocket', 'polling'],
            autoConnect: false,
        });
    }
    return socket;
}

export function connectSocket() {
    const s = getSocket();
    if (!s.connected) s.connect();
    return s;
}

export function disconnectSocket() {
    socket?.disconnect();
}
