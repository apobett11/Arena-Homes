import { getSupabaseClient } from '@/lib/supabase/client';

export interface User {
    id: string;
    email: string;
    roleId: string;
}

export interface AuthResponse {
    user: User;
    requiresOnboarding?: boolean;
    onboardingStatus?: {
        hasSetPassword: boolean;
        hasCompletedProfile: boolean;
        hasAcceptedAgreement: boolean;
    };
}

export const AuthApi = {
    login: async (email: string, password: string): Promise<AuthResponse> => {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error || !data.user) {
            throw new Error(error?.message ?? 'Login failed');
        }

        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('role_id')
            .eq('user_id', data.user.id)
            .maybeSingle();

        if (profileError) {
            throw new Error(profileError.message);
        }

        const roleId = (profileData as { role_id?: string } | null)?.role_id ?? 'TENANT';

        return {
            user: {
                id: data.user.id,
                email: data.user.email ?? email,
                roleId,
            },
        };
    },

    register: async (data: any): Promise<{ userId: string }> => {
        const supabase = getSupabaseClient();
        const { data: authData, error } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
                data: {
                    role_id: data.roleId ?? 'TENANT',
                },
            },
        });
        if (error || !authData.user) {
            throw new Error(error?.message ?? 'Registration failed');
        }
        return { userId: authData.user.id };
    },

    refreshToken: async (token: string): Promise<{ accessToken: string; refreshToken: string }> => {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.auth.refreshSession({ refresh_token: token });
        if (error || !data.session) {
            throw new Error(error?.message ?? 'Failed to refresh session');
        }
        return {
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
        };
    },

    logout: async () => {
        const supabase = getSupabaseClient();
        const { error } = await supabase.auth.signOut();
        if (error) {
            throw new Error(error.message);
        }
    },

    getSession: async () => {
        const supabase = getSupabaseClient();
        return supabase.auth.getSession();
    },
    getUser: async () => {
        const supabase = getSupabaseClient();
        return supabase.auth.getUser();
    },
    onAuthStateChange: (callback: Parameters<ReturnType<typeof getSupabaseClient>['auth']['onAuthStateChange']>[0]) => {
        const supabase = getSupabaseClient();
        return supabase.auth.onAuthStateChange(callback);
    },
};
