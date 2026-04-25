import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // Public routes
    const isPublic = path.startsWith('/_next') ||
        path.startsWith('/static') ||
        path === '/' ||
        path.startsWith('/public') ||
        path.startsWith('/auth') ||
        path.startsWith('/listings'); // Listings are public

    if (isPublic) {
        return NextResponse.next();
    }

    const hasSupabaseSessionCookie = request.cookies
        .getAll()
        .some((cookie) => cookie.name.includes('-auth-token'));

    if (!hasSupabaseSessionCookie) {
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('from', path);
        return NextResponse.redirect(loginUrl);
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
