'use server';

import { redirect } from 'next/navigation';
import { AuthApi } from '@/lib/api/auth';

export async function loginAction(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
        return { error: 'Email and password are required' };
    }

    try {
        const response = await AuthApi.login(email, password);

        return { 
            success: true, 
            role: response.user.roleId,
            requiresOnboarding: response.requiresOnboarding,
            onboardingStatus: response.onboardingStatus,
        };

    } catch (error: any) {
        return { error: error.message };
    }
}

export async function logoutAction() {
    await AuthApi.logout();
    redirect('/auth/login');
}

export async function refreshAction() {
    // Logic to be called by middleware or client if 401
    // ...
}
