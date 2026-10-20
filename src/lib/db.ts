import 'server-only';
import { Pool, PoolConfig } from 'pg';

declare global {
  // Prevent multiple pool instances during Next.js Hot Module Replacement (HMR)
  var __saasPgPool: Pool | undefined;
}

export function getDbPool(): Pool {
  // If an old pool instance exists with unsupported startup parameters, close and reset it
  if (globalThis.__saasPgPool && (globalThis.__saasPgPool.options as any)?.statement_timeout) {
    globalThis.__saasPgPool.end().catch(() => {});
    globalThis.__saasPgPool = undefined;
  }

  if (!globalThis.__saasPgPool) {
    let connectionString =
      process.env.DATABASE_URL ||
      'postgresql://postgres:fZ79*S%HgXB+_zx@db.wiswkavvupyuzujnbirq.supabase.co:6543/postgres';

    // Automatically route Supabase direct connections through the Supavisor Pooler (Port 6543)
    if (connectionString.includes('.supabase.co:5432')) {
      connectionString = connectionString.replace('.supabase.co:5432', '.supabase.co:6543');
    }

    const poolConfig: PoolConfig = {
      connectionString,
      ssl: { rejectUnauthorized: false },
      // High-concurrency throughput settings:
      max: 25, // Up to 25 concurrent connections per Node process
      connectionTimeoutMillis: 5000, // Fail-fast: throw after 5s in queue instead of hanging forever
      idleTimeoutMillis: 10000, // Close idle connections after 10s to release database resources
      query_timeout: 15000, // Client-side timeout for runaway queries
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    };

    const pool = new Pool(poolConfig);

    // Catch and log idle client errors to prevent Next.js server crash
    pool.on('error', (err: any) => {
      console.error('[pg.Pool] Unexpected error on idle client:', err?.message || err);
    });

    globalThis.__saasPgPool = pool;
  }

  return globalThis.__saasPgPool;
}
