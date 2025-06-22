import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Skip middleware for public routes, API routes, auth routes, and static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/auth') ||
    pathname === '/' ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // For now, let client-side handle auth redirects
  // The AuthContext will handle redirecting unauthenticated users
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};