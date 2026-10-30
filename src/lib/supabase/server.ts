import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/database.types';

export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wiswkavvupyuzujnbirq.supabase.co';

  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.empty_fallback_key';

  const client = createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if middleware is refreshing sessions.
        }
      },
    },
  });

  const sessionCookie = cookieStore.get('saaa_session')?.value;
  if (sessionCookie) {
    try {
      const raw = sessionCookie.includes('%') ? decodeURIComponent(sessionCookie) : sessionCookie;
      const decoded = Buffer.from(raw, 'base64').toString('utf8');
      const parsed = JSON.parse(decoded);
      if (parsed?.id && parsed?.email) {
        const originalGetUser = client.auth.getUser.bind(client.auth);
        client.auth.getUser = async (jwt?: string) => {
          if (jwt) return originalGetUser(jwt);
          return {
            data: {
              user: {
                id: parsed.id,
                email: parsed.email,
                app_metadata: {},
                user_metadata: { full_name: parsed.full_name },
                aud: 'authenticated',
                created_at: new Date().toISOString(),
              } as any,
            },
            error: null,
          };
        };
      }
    } catch {}
  }

  return client;
}
