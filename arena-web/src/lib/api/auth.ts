import { fetchClient } from './client';

export interface User {
    id: string;
    email: string;
    roleId: string;
}

export interface AuthResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
    requiresOnboarding?: boolean;
    onboardingStatus?: {
        hasSetPassword: boolean;
        hasCompletedProfile: boolean;
        hasAcceptedAgreement: boolean;
    };
}

export const AuthApi = {
    login: async (email: string, password: string): Promise<AuthResponse> => {
        return fetchClient<AuthResponse>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    },

    register: async (data: any): Promise<{ userId: string }> => {
        return fetchClient('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    refreshToken: async (token: string): Promise<{ accessToken: string; refreshToken: string }> => {
        return fetchClient('/auth/refresh', {
            method: 'POST',
            body: JSON.stringify({ refreshToken: token }),
        });
    },

    logout: async () => {
        // We do this to signal backend, but client also clears cookies
        return fetchClient('/auth/logout', { method: 'POST' }); // Authenticated request needed? Yes usually.
    }
};
