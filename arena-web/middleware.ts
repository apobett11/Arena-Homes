import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { UserRole } from './lib/rbac/types';
import { canAccessRoute, getRedirectPath } from './lib/rbac/access';

export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // Public routes
    const isPublic = path.startsWith('/_next') ||
        path.startsWith('/static') ||
        path === '/' ||
        path.startsWith('/public') ||
        path.startsWith('/auth') ||
        path.startsWith('/listings'); // Listings are public

    if (isPublic && !path.startsWith('/auth')) {
        // Allow public access, but if logged in and visiting /, maybe redirect?
        // keeping simple for now.
        return NextResponse.next();
    }

    // Check for Auth Cookies
    const accessToken = request.cookies.get('access_token');
    const roleCookie = request.cookies.get('user_role');

    // Auth Routes (Login/Register)
    if (path.startsWith('/auth')) {
        // If already logged in, redirect to dashboard
        if (accessToken && roleCookie) {
            const userRole = roleCookie.value as UserRole;
            const target = getRedirectPath(userRole);
            return NextResponse.redirect(new URL(target, request.url));
        }
        return NextResponse.next();
    }

    if (!accessToken || !roleCookie) {
        // Redirect to login
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('from', path);
        return NextResponse.redirect(loginUrl);
    }

    const userRole = roleCookie.value as UserRole;

    // Enforce Route Permissions
    if (!canAccessRoute(userRole, path)) {
        // If forbidden
        if (userRole === UserRole.PUBLIC) {
            return NextResponse.redirect(new URL('/auth/login', request.url));
        }

        // Redirect to their allowed dashboard
        const redirectTarget = getRedirectPath(userRole);
        // Avoid infinite loop if they are already there or if Access Control map is mismatch
        if (path !== redirectTarget && !path.startsWith(redirectTarget)) {
            return NextResponse.redirect(new URL(redirectTarget, request.url));
        }
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
