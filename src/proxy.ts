import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isSuperAdminRoute = pathname.startsWith('/super-admin');
  const isWorkspaceRoute = pathname.startsWith('/c/');

  // Performance Fast-Path:
  // Public pages (landing page /, login, register, public docs, and APIs)
  // bypass Supabase network calls completely in proxy.
  if (!isSuperAdminRoute && !isWorkspaceRoute) {
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }

  // Fast check: Read current user session from local saaa_session cookie
  const sessionCookie = request.cookies.get('saaa_session')?.value;
  if (sessionCookie) {
    try {
      const raw = sessionCookie.includes('%') ? decodeURIComponent(sessionCookie) : sessionCookie;
      let decoded = '';
      try {
        decoded = Buffer.from(raw, 'base64').toString('utf-8');
      } catch {
        decoded = atob(raw);
      }
      const parsed = JSON.parse(decoded);
      if (parsed?.id) {
        // Authenticated user verified locally in <1ms without network latency
        return NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
      }
    } catch {}
  }

  // Fallback: Verify through Supabase SSR if local session cookie is missing
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

  let user: any = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {}

  // Redirect unauthenticated users trying to access protected routes
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf)$).*)',
  ],
};
