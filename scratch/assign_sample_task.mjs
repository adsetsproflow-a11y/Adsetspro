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

  const empId = '00000000-0000-0000-0000-000000000004'; // Charlie Team Employee
  const taskId = '53ed3fe0-305b-4928-b07b-0552114de8c6'; // Logo Vector Package

  const check = await client.query('SELECT id FROM public.task_assignments WHERE task_id = $1 AND employee_id = $2', [taskId, empId]);
  if (check.rows.length === 0) {
    await client.query(`
      INSERT INTO public.task_assignments (task_id, employee_id, is_current, assigned_by)
      VALUES ($1, $2, true, '00000000-0000-0000-0000-000000000002');
    `, [taskId, empId]);
  } else {
    await client.query('UPDATE public.task_assignments SET is_current = true WHERE task_id = $1 AND employee_id = $2', [taskId, empId]);
  }

  console.log('Task assigned successfully to Charlie Team Employee');
  await client.end();
}

run().catch(console.error);
