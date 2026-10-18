import pg from 'pg';
import fs from 'fs';

const { Client } = pg;

function getDbUrl() {
  const envFiles = ['.env.local', '.env'];
  for (const f of envFiles) {
    if (fs.existsSync(f)) {
      const content = fs.readFileSync(f, 'utf8');
      const match = content.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
      if (match && match[1]) {
        return match[1];
      }
    }
  }
  return null;
}

async function searchDbForSecrets() {
  const client = new Client({ connectionString: getDbUrl(), ssl: { rejectUnauthorized: false } });
  await client.connect();

  console.log('Searching pg_proc for jwt or key...');
  const res = await client.query(`
    SELECT proname, prosrc FROM pg_proc 
    WHERE prosrc ILIKE '%jwt%' OR prosrc ILIKE '%anon%' OR prosrc ILIKE '%service_role%'
    LIMIT 10;
  `);
  console.log('Found procs:', res.rows.map(r => r.proname));

  const configCheck = await client.query(`
    SELECT * FROM information_schema.tables WHERE table_schema = 'auth' AND table_name LIKE '%config%';
  `);
  console.log('Auth config tables:', configCheck.rows);

  await client.end();
}

searchDbForSecrets().catch(console.error);
