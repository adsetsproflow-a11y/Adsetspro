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

async function inspectSchemas() {
  const client = new Client({ connectionString: getDbUrl(), ssl: { rejectUnauthorized: false } });
  await client.connect();

  const tables = await client.query(`
    SELECT table_schema, table_name 
    FROM information_schema.tables 
    WHERE table_schema IN ('auth', 'vault')
    ORDER BY table_schema, table_name;
  `);
  console.log(tables.rows);

  await client.end();
}

inspectSchemas().catch(console.error);
