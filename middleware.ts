import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale } from './i18n/config';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed'
});

// Routes that require authentication
const protectedPrefixes = ['/dashboard', '/settings'];

// Auth pages - redirect to dashboard if already logged in
const authPages = ['/login', '/register', '/forgot-password', '/reset-password'];

function getPathnameWithoutLocale(pathname: string): string {
  // Remove locale prefix if present (e.g., /tr/dashboard -> /dashboard)
  for (const locale of locales) {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      return pathname.slice(`/${locale}`.length) || '/';
    }
  }
  return pathname;
}

function getLocalePrefix(pathname: string): string {
  for (const locale of locales) {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      return `/${locale}`;
    }
  }
  return '';
}

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const pathnameWithoutLocale = getPathnameWithoutLocale(pathname);
  const localePrefix = getLocalePrefix(pathname);

  // Check for auth cookie (set by AuthContext on login/logout)
  const authToken = request.cookies.get('auth-token')?.value;
  const isAuthenticated = !!authToken;

  // Protect dashboard routes - redirect to login if not authenticated
  const isProtectedRoute = protectedPrefixes.some(
    (prefix) => pathnameWithoutLocale.startsWith(prefix)
  );

  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL(`${localePrefix}/login`, request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages
  const isAuthPage = authPages.some(
    (page) => pathnameWithoutLocale === page || pathnameWithoutLocale.startsWith(page + '/')
  );

  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL(`${localePrefix}/dashboard`, request.url));
  }

  // Run next-intl middleware for all other cases
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    // Match all pathnames except for
    // - API routes
    // - Static files
    // - _next internals
    '/((?!api|_next|.*\\..*).*)'
  ]
};
