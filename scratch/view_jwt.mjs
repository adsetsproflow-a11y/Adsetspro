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

async function viewJwtFunc() {
  const client = new Client({ connectionString: getDbUrl(), ssl: { rejectUnauthorized: false } });
  await client.connect();

  const res = await client.query(`
    SELECT proname, prosrc FROM pg_proc WHERE proname IN ('jwt', 'uid', 'role', 'email');
  `);
  for (const r of res.rows) {
    console.log(`=== ${r.proname} ===\n${r.prosrc}\n`);
  }

  await client.end();
}

viewJwtFunc().catch(console.error);
