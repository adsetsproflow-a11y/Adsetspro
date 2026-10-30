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
      'postgresql://postgres.wiswkavvupyuzujnbirq:fZ79*S%HgXB+_zx@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';

    // Cloud serverless (Vercel / AWS Lambda) has NO IPv6 outbound routing.
    // If IPv6-only direct host `db.<project>.supabase.co` is passed, auto-rewrite to IPv4 pooler:
    if (connectionString.includes('db.wiswkavvupyuzujnbirq.supabase.co')) {
      connectionString = connectionString
        .replace('postgresql://postgres:', 'postgresql://postgres.wiswkavvupyuzujnbirq:')
        .replace('db.wiswkavvupyuzujnbirq.supabase.co:5432', 'aws-0-ap-south-1.pooler.supabase.com:6543')
        .replace('db.wiswkavvupyuzujnbirq.supabase.co:6543', 'aws-0-ap-south-1.pooler.supabase.com:6543')
        .replace('db.wiswkavvupyuzujnbirq.supabase.co', 'aws-0-ap-south-1.pooler.supabase.com');
    } else if (connectionString.includes('.supabase.co:5432')) {
      connectionString = connectionString.replace('.supabase.co:5432', '.supabase.co:6543');
    }

    const poolConfig: PoolConfig = {
      connectionString,
      ssl: { rejectUnauthorized: false },
      // High-concurrency throughput settings:
      max: 20, // Stable connection limit for Supabase
      connectionTimeoutMillis: 20000, // 20s timeout to tolerate cloud network latency & handshake
      idleTimeoutMillis: 30000, // Keep connections warm for 30s to reuse SSL handshakes
      query_timeout: 25000, // Client-side timeout for runaway queries
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

export async function queryDb(text: string, params?: any[]) {
  const pool = getDbPool();
  try {
    return await pool.query(text, params);
  } catch (err: any) {
    const isConnErr =
      err?.message?.includes('timeout') ||
      err?.message?.includes('Connection terminated') ||
      err?.code === 'ECONNRESET' ||
      err?.code === '57P01';

    if (isConnErr) {
      console.warn('[pg.Pool] Retrying failed query after transient connection issue:', err?.message);
      await new Promise((r) => setTimeout(r, 250));
      return await pool.query(text, params);
    }
    throw err;
  }
}

