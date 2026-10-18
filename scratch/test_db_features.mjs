import dotenv from 'dotenv';
dotenv.config();
import pg from 'pg';

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const constraints = await pool.query(`
    SELECT conname, contype, conrelid::regclass as table_name, pg_get_constraintdef(c.oid) as def
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE n.nspname = 'public' AND contype IN ('p', 'u');
  `);
  for (const r of constraints.rows) {
    console.log(r.table_name, '|', r.conname, '|', r.def);
  }
  await pool.end();
}

main().catch(console.error);
