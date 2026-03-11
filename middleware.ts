import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Only protect /admin routes
    if (pathname.startsWith('/admin')) {
        // Allow the login page to be publicly accessible
        if (pathname === '/admin/login') {
            return NextResponse.next();
        }

        const adminSessionCookie = request.cookies.get('admin_session');
        const validSecret = process.env.ADMIN_COOKIE_SECRET;

        // 2. Cryptographic Validation
        // The browser must possess the exact UUID token defined in the server's root environment
        if (!validSecret || adminSessionCookie?.value !== validSecret) {
            console.warn(`[Middleware] Unauthorized attempt to access admin path: ${pathname}`);
            // Redirect unauthorized users to the secure login gate
            const loginUrl = new URL('/admin/login', request.url);
            return NextResponse.redirect(loginUrl);
        }

        return NextResponse.next();
    }

    return NextResponse.next();
}

// 3. Configure the middleware matcher to optimize execution
export const config = {
    matcher: ['/admin/:path*'],
};
