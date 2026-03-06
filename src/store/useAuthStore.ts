import { create } from 'zustand';

interface AuthState {
    status: 'idle' | 'signOut' | 'signIn';
    token: string | null;
    userRole: 'super-admin' | 'company-admin' | 'user' | null;
    signIn: (token: string, role?: 'super-admin' | 'company-admin' | 'user') => void;
    signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    status: 'idle',
    token: null,
    userRole: null,
    signIn: (token, role = 'super-admin') => {
        // In a real app, save to localStorage here
        localStorage.setItem('auth_token', token);
        if (role) localStorage.setItem('user_role', role);
        set({ status: 'signIn', token, userRole: role });
    },
    signOut: () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_role');
        set({ status: 'signOut', token: null, userRole: null });
    },
}));

// Hydration helper to be called on app mount
export const hydrateAuth = () => {
    const store = useAuthStore.getState();
    const token = localStorage.getItem('auth_token');
    const role = localStorage.getItem('user_role') as 'super-admin' | 'company-admin' | 'user' | null;

    if (token) {
        store.signIn(token, role || 'super-admin');
    } else {
        // Force signOut status if no token is found so protecting routes works
        useAuthStore.setState({ status: 'signOut' });
    }
};
