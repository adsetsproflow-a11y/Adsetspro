import dotenv from 'dotenv';
dotenv.config();
import pg from 'pg';

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const res = await client.query(
      `INSERT INTO auth.users (id, email, encrypted_password, raw_user_meta_data, created_at, updated_at)
       VALUES (gen_random_uuid(), 'test_dummy@test.com', extensions.crypt('Pass1234!', extensions.gen_salt('bf')), $1::jsonb, NOW(), NOW())
       RETURNING id, email;`,
      [JSON.stringify({ full_name: 'Test Dummy' })]
    );
    console.log('Inserted dummy auth.user:', res.rows[0]);
    await client.query('ROLLBACK');
    console.log('Rollback successful!');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
