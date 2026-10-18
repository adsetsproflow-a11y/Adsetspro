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

async function inspectAndClean() {
  const client = new Client({ connectionString: getDbUrl(), ssl: { rejectUnauthorized: false } });
  await client.connect();

  console.log('Inspecting data created by user...');
  
  // Find shah company and user
  const compRes = await client.query("SELECT id, name, slug FROM public.companies WHERE slug = 'shah' OR name ILIKE '%shah%' OR slug ILIKE 'apex-enterprise-%'");
  console.log('Found custom companies:', compRes.rows);

  const profRes = await client.query("SELECT id, email, full_name FROM public.profiles WHERE email ILIKE '%aadhamshah%' OR email ILIKE '%alex_%'");
  console.log('Found custom profiles:', profRes.rows);

  // Let's delete the custom data created by the user (shah, etc.)
  for (const c of compRes.rows) {
    console.log(`Cleaning data for company: ${c.name} (${c.id})`);
    await client.query("DELETE FROM public.task_comments WHERE task_id IN (SELECT id FROM public.tasks WHERE company_id = $1)", [c.id]);
    await client.query("DELETE FROM public.task_attachments WHERE task_id IN (SELECT id FROM public.tasks WHERE company_id = $1)", [c.id]);
    await client.query("DELETE FROM public.task_assignments WHERE task_id IN (SELECT id FROM public.tasks WHERE company_id = $1)", [c.id]);
    await client.query("DELETE FROM public.tasks WHERE company_id = $1", [c.id]);
    await client.query("DELETE FROM public.chat_messages WHERE room_id IN (SELECT id FROM public.chat_rooms WHERE company_id = $1)", [c.id]);
    await client.query("DELETE FROM public.chat_members WHERE room_id IN (SELECT id FROM public.chat_rooms WHERE company_id = $1)", [c.id]);
    await client.query("DELETE FROM public.chat_rooms WHERE company_id = $1", [c.id]);
    await client.query("DELETE FROM public.department_memberships WHERE department_id IN (SELECT id FROM public.departments WHERE company_id = $1)", [c.id]);
    await client.query("DELETE FROM public.departments WHERE company_id = $1", [c.id]);
    await client.query("DELETE FROM public.designations WHERE company_id = $1", [c.id]);
    await client.query("DELETE FROM public.invitations WHERE company_id = $1", [c.id]);
    await client.query("DELETE FROM public.company_memberships WHERE company_id = $1", [c.id]);
    await client.query("DELETE FROM public.audit_logs WHERE company_id = $1", [c.id]);
    await client.query("DELETE FROM public.companies WHERE id = $1", [c.id]);
    console.log(`Deleted company ${c.slug}`);
  }

  for (const p of profRes.rows) {
    console.log(`Cleaning user profile: ${p.email} (${p.id})`);
    await client.query("DELETE FROM public.notifications WHERE user_id = $1", [p.id]);
    await client.query("DELETE FROM public.company_memberships WHERE user_id = $1", [p.id]);
    await client.query("DELETE FROM public.department_memberships WHERE user_id = $1", [p.id]);
    await client.query("DELETE FROM public.chat_members WHERE user_id = $1", [p.id]);
    await client.query("DELETE FROM public.profiles WHERE id = $1", [p.id]);
    await client.query("DELETE FROM auth.users WHERE id = $1", [p.id]);
    console.log(`Deleted user ${p.email}`);
  }

  console.log('Cleanup completed successfully.');

  // Re-run standard seed to ensure clean pristine demo organization
  const remainingComps = await client.query("SELECT id, name, slug, status FROM public.companies");
  console.log('Remaining Companies:', remainingComps.rows);

  const remainingUsers = await client.query("SELECT id, email, full_name FROM public.profiles");
  console.log('Remaining Profiles:', remainingUsers.rows);

  await client.end();
}

inspectAndClean().catch(console.error);
