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

async function inspectVault() {
  const client = new Client({ connectionString: getDbUrl(), ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    const secrets = await client.query(`SELECT id, name, description, decrypted_secret FROM vault.decrypted_secrets;`);
    console.log('vault secrets:', secrets.rows);
  } catch (e) {
    console.log('vault error:', e.message);
  }

  await client.end();
}

inspectVault().catch(console.error);
