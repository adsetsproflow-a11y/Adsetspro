import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wiswkavvupyuzujnbirq.supabase.co';

  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.empty_fallback_key';

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Read current user session from saaa_session cookie or Supabase
  let user: any = null;
  const sessionCookie = request.cookies.get('saaa_session')?.value;
  if (sessionCookie) {
    try {
      const decoded = atob(sessionCookie);
      const parsed = JSON.parse(decoded);
      if (parsed?.id) {
        user = parsed;
      }
    } catch {}
  }

  if (!user) {
    try {
      const { data } = await supabase.auth.getUser();
      user = data.user;
    } catch {}
  }

  const { pathname } = request.nextUrl;

  const isPublicAuthRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/verify-email') ||
    pathname.startsWith('/accept-invitation');

  const isSuperAdminRoute = pathname.startsWith('/super-admin');
  const isWorkspaceRoute = pathname.startsWith('/c/');

  // Allow unrestricted access to public auth pages like /register and /login.
  // Do not redirect users away from /register or /login so they can register new organizations or switch demo accounts freely.

  // 2. Redirect unauthenticated users trying to access protected routes
  if (!user && (isSuperAdminRoute || isWorkspaceRoute)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
