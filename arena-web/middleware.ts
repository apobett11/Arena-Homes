import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;
    const isDev = process.env.NODE_ENV === 'development';

    if (isDev) {
        console.log('[auth-middleware] path checked', { path });
    }

    // Public routes
    const isPublic = path.startsWith('/_next') ||
        path.startsWith('/static') ||
        path === '/' ||
        path.startsWith('/public') ||
        path.startsWith('/auth') ||
        path.startsWith('/listings'); // Listings are public

    if (isPublic) {
        if (isDev) {
            console.log('[auth-middleware] skipping auth enforcement (public route)', { path });
        }
        return NextResponse.next();
    }

    const isRoleProtectedArea =
        path.startsWith('/admin') ||
        path.startsWith('/tenant') ||
        path.startsWith('/accountant') ||
        path.startsWith('/caretaker') ||
        path.startsWith('/it-support');

    if (isRoleProtectedArea) {
        if (isDev) {
            console.log('[auth-middleware] skipping auth enforcement (client RoleGate route)', { path });
        }
        return NextResponse.next();
    }

    const hasSupabaseSessionCookie = request.cookies
        .getAll()
        .some((cookie) => cookie.name.includes('-auth-token'));

    if (isDev) {
        console.log('[auth-middleware] cookie session detected', { path, hasSupabaseSessionCookie });
    }

    if (!hasSupabaseSessionCookie) {
        if (isDev) {
            console.log('[auth-middleware] enforcing auth redirect to login', { path });
        }
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('from', path);
        return NextResponse.redirect(loginUrl);
    }

    if (isDev) {
        console.log('[auth-middleware] allowing request with cookie session', { path });
    }
    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
