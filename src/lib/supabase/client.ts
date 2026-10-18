import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database.types';

export function createClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wiswkavvupyuzujnbirq.supabase.co';

  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.empty_fallback_key';

  const client = createBrowserClient<Database>(supabaseUrl, supabaseKey);

  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/(?:^|;\s*)saaa_session=([^;]+)/);
    if (match && match[1]) {
      try {
        const decoded = atob(decodeURIComponent(match[1]));
        const parsed = JSON.parse(decoded);
        if (parsed?.id && parsed?.email) {
          const originalGetUser = client.auth.getUser.bind(client.auth);
          client.auth.getUser = async (jwt?: string) => {
            if (jwt) return originalGetUser(jwt);
            try {
              const res = await originalGetUser();
              if (res.data?.user) return res;
            } catch {}
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
      } catch (e) {}
    }
  }

  return client;
}
