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

async function run() {
  const client = new Client({ connectionString: getDbUrl(), ssl: { rejectUnauthorized: false } });
  await client.connect();

  const comps = await client.query('SELECT id, name, slug, status FROM public.companies;');
  console.log('COMPANIES:', JSON.stringify(comps.rows, null, 2));

  const users = await client.query('SELECT id, email, full_name, is_super_admin FROM public.profiles;');
  console.log('PROFILES:', JSON.stringify(users.rows, null, 2));

  const tasks = await client.query('SELECT id, title, status FROM public.tasks LIMIT 20;');
  console.log('TASKS:', JSON.stringify(tasks.rows, null, 2));

  await client.end();
}

run().catch(console.error);
