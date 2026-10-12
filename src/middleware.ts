import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const url = request.nextUrl.clone();

  // Extract subdomain (e.g. acme.platform.com -> acme)
  const currentHost = host.replace(/:\d+$/, ''); // Remove port
  const hostParts = currentHost.split('.');

  let subdomain: string | null = null;
  if (hostParts.length > 2) {
    subdomain = hostParts[0];
  }

  // Pass subdomain in request headers for downstream server components / layout
  const response = NextResponse.next();
  if (subdomain && subdomain !== 'www' && subdomain !== 'localhost') {
    response.headers.set('x-subdomain', subdomain);
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
