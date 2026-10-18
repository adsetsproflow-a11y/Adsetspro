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

  const tasks = await client.query(`
    SELECT t.id, t.title, t.status, c.slug, p.full_name as assignee
    FROM public.tasks t
    JOIN public.companies c ON c.id = t.company_id
    LEFT JOIN public.task_assignments ta ON ta.task_id = t.id AND ta.is_current = true
    LEFT JOIN public.profiles p ON p.id = ta.employee_id;
  `);
  console.log('ACTIVE TASKS:', JSON.stringify(tasks.rows, null, 2));

  await client.end();
}

run().catch(console.error);
