'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthApi } from '@/lib/api/auth'; // Using client-side call directly for register, or create action?
import Link from 'next/link';
// Server action is safer for consistency and handling cookies immediately on success (if auto-login).
// But for register, we might just redirect to login or auto-login.
// Let's implement a registerAction in actions.ts first.

import { Button } from '@/components/ui/button';

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData(event.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const confirmPass = formData.get('confirmPassword') as string;

        if (password !== confirmPass) {
            setError("Passwords don't match");
            setLoading(false);
            return;
        }

        try {
            await AuthApi.register({
                email,
                password,
                roleId: 'TENANT', // Forced
            });
            // Redirect to login with success message
            router.push('/auth/login?registered=true');
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    }

    return (
        <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md dark:bg-gray-800">
                <h1 className="mb-6 text-center text-2xl font-bold text-gray-900 dark:text-white">Tenant Registration</h1>

                {error && (
                    <div className="mb-4 rounded bg-red-100 p-3 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                        <input name="email" type="email" required className="mt-1 block w-full rounded-md border border-gray-300 p-2 dark:bg-gray-700" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                        <input name="password" type="password" required className="mt-1 block w-full rounded-md border border-gray-300 p-2 dark:bg-gray-700" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</label>
                        <input name="confirmPassword" type="password" required className="mt-1 block w-full rounded-md border border-gray-300 p-2 dark:bg-gray-700" />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Registering...' : 'Register'}
                    </Button>
                </form>

                <div className="mt-4 text-center text-sm">
                    <span className="text-gray-500">Already have an account? </span>
                    <Link href="/auth/login" className="text-blue-600 hover:underline">Sign in</Link>
                </div>
            </div>
        </div>
    );
}
