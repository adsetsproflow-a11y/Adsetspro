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

async function inspectSecrets() {
  const client = new Client({ connectionString: getDbUrl(), ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    const res = await client.query(`SHOW "app.settings.jwt_secret";`);
    console.log('jwt_secret setting:', res.rows);
  } catch (e) {
    console.log('app.settings.jwt_secret not set:', e.message);
  }

  try {
    const res2 = await client.query(`SELECT * FROM pg_settings WHERE name LIKE '%jwt%' OR name LIKE '%supabase%';`);
    console.log('pg_settings:', res2.rows);
  } catch (e) {
    console.log('pg_settings error:', e.message);
  }

  await client.end();
}

inspectSecrets().catch(console.error);
