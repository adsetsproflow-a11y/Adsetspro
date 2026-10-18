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

async function check() {
  const connectionString = getDbUrl();
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  console.log('--- AUTH USERS ---');
  const authUsers = await client.query(`
    SELECT id, email, encrypted_password, email_confirmed_at, raw_user_meta_data
    FROM auth.users;
  `);
  console.log(JSON.stringify(authUsers.rows, null, 2));

  console.log('--- PROFILES ---');
  const profiles = await client.query(`
    SELECT id, full_name, email, is_super_admin, account_status
    FROM public.profiles;
  `);
  console.log(JSON.stringify(profiles.rows, null, 2));

  console.log('--- COMPANIES ---');
  const companies = await client.query(`
    SELECT id, name, slug, status FROM public.companies;
  `);
  console.log(JSON.stringify(companies.rows, null, 2));

  console.log('--- COMPANY MEMBERSHIPS ---');
  const memberships = await client.query(`
    SELECT cm.id, cm.user_id, cm.company_id, cm.role, cm.status, p.email, c.slug as company_slug
    FROM public.company_memberships cm
    JOIN public.profiles p ON p.id = cm.user_id
    JOIN public.companies c ON c.id = cm.company_id;
  `);
  console.log(JSON.stringify(memberships.rows, null, 2));

  await client.end();
}

check().catch(console.error);
