import { createClient } from '@supabase/supabase-js';
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

// Read Supabase config
const dbUrl = getDbUrl();
const supabaseUrl = 'https://wiswkavvupyuzujnbirq.supabase.co';

async function seedTestAccounts() {
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  console.log('Connected to PostgreSQL...');

  // 1. Get or ensure approved company
  let compRes = await client.query(`SELECT id, name, slug FROM public.companies WHERE slug = 'p8-test-org' LIMIT 1;`);
  let companyId = compRes.rows[0]?.id;

  if (!companyId) {
    const newComp = await client.query(`
      INSERT INTO public.companies (name, slug, status)
      VALUES ('Phase 8 Test Org', 'p8-test-org', 'approved')
      RETURNING id;
    `);
    companyId = newComp.rows[0].id;
  }
  console.log('Company ID:', companyId);

  // 2. Ensure Department
  let deptRes = await client.query(`SELECT id FROM public.departments WHERE company_id = $1 LIMIT 1;`, [companyId]);
  let deptId = deptRes.rows[0]?.id;
  if (!deptId) {
    const newDept = await client.query(`
      INSERT INTO public.departments (company_id, name, description, status)
      VALUES ($1, 'Growth & Marketing', 'Growth and client campaigns', 'active')
      RETURNING id;
    `, [companyId]);
    deptId = newDept.rows[0].id;
  }
  console.log('Department ID:', deptId);

  // 3. Ensure Designation
  let desigRes = await client.query(`SELECT id FROM public.designations WHERE company_id = $1 LIMIT 1;`, [companyId]);
  let desigId = desigRes.rows[0]?.id;
  if (!desigId) {
    const newDesig = await client.query(`
      INSERT INTO public.designations (company_id, name)
      VALUES ($1, 'Senior Marketing Strategist')
      RETURNING id;
    `, [companyId]);
    desigId = newDesig.rows[0].id;
  }
  console.log('Designation ID:', desigId);

  // Accounts to ensure
  const defaultPasswordHash = '$2a$06$ZJcrhCFw9aOUzMEBTl/svuZPf.ZkNRfsqu.dI/eUCzT361w3YvLTS'; // Same hash as SuperAdmin@2026!Secure

  const accounts = [
    {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'owner@adsetsproflow.com',
      fullName: 'Platform Super Admin',
      role: 'COMPANY_ADMIN',
      isSuperAdmin: true,
      deptRole: null,
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      email: 'admin@p8-test.com',
      fullName: 'Alice Company Admin',
      role: 'COMPANY_ADMIN',
      isSuperAdmin: false,
      deptRole: null,
    },
    {
      id: '00000000-0000-0000-0000-000000000003',
      email: 'depthead@p8-test.com',
      fullName: 'Bob Department Head',
      role: 'DEPARTMENT_HEAD',
      isSuperAdmin: false,
      deptRole: 'head',
    },
    {
      id: '00000000-0000-0000-0000-000000000004',
      email: 'employee@p8-test.com',
      fullName: 'Charlie Team Employee',
      role: 'EMPLOYEE',
      isSuperAdmin: false,
      deptRole: 'member',
    },
  ];

  for (const acc of accounts) {
    // Upsert into auth.users
    await client.query(`
      INSERT INTO auth.users (
        id, instance_id, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
      )
      VALUES (
        $1,
        '00000000-0000-0000-0000-000000000000',
        $2,
        $3,
        NOW(),
        '{"provider":"email","providers":["email"]}',
        $4,
        NOW(),
        NOW(),
        'authenticated',
        'authenticated'
      )
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        encrypted_password = EXCLUDED.encrypted_password,
        raw_user_meta_data = EXCLUDED.raw_user_meta_data;
    `, [acc.id, acc.email, defaultPasswordHash, JSON.stringify({ full_name: acc.fullName })]);

    // Upsert into public.profiles
    await client.query(`
      INSERT INTO public.profiles (id, full_name, email, is_super_admin, account_status)
      VALUES ($1, $2, $3, $4, 'active')
      ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        is_super_admin = EXCLUDED.is_super_admin,
        account_status = 'active';
    `, [acc.id, acc.fullName, acc.email, acc.isSuperAdmin]);

    // Upsert into public.company_memberships
    await client.query(`
      INSERT INTO public.company_memberships (user_id, company_id, role, status)
      VALUES ($1, $2, $3, 'active')
      ON CONFLICT (user_id, company_id) DO UPDATE SET
        role = EXCLUDED.role,
        status = 'active';
    `, [acc.id, companyId, acc.role]);

    // Department membership
    if (acc.deptRole === 'head') {
      await client.query(`
        UPDATE public.departments SET head_user_id = $1 WHERE id = $2;
      `, [acc.id, deptId]);

      await client.query(`
        INSERT INTO public.department_memberships (user_id, department_id, designation_id, status)
        VALUES ($1, $2, $3, 'active')
        ON CONFLICT (user_id, department_id) DO UPDATE SET
          designation_id = EXCLUDED.designation_id,
          status = 'active';
      `, [acc.id, deptId, desigId]);
    } else if (acc.deptRole === 'member') {
      await client.query(`
        INSERT INTO public.department_memberships (user_id, department_id, designation_id, reporting_to, status)
        VALUES ($1, $2, $3, '00000000-0000-0000-0000-000000000003', 'active')
        ON CONFLICT (user_id, department_id) DO UPDATE SET
          designation_id = EXCLUDED.designation_id,
          status = 'active';
      `, [acc.id, deptId, desigId]);
    }

    console.log(`Ensured account: ${acc.email} (${acc.role}, isSuperAdmin: ${acc.isSuperAdmin})`);
  }

  // Also ensure at least 1 project and 1 task so views are rich
  const projRes = await client.query(`
    SELECT id FROM public.projects WHERE company_id = $1 LIMIT 1;
  `, [companyId]);
  let projId = projRes.rows[0]?.id;

  if (!projId) {
    const newProj = await client.query(`
      INSERT INTO public.projects (company_id, department_id, name, description, status, priority, created_by)
      VALUES ($1, $2, 'Enterprise Q4 Rebranding Campaign', 'Complete overhaul of creative and digital collateral', 'active', 'high', '00000000-0000-0000-0000-000000000002')
      RETURNING id;
    `, [companyId, deptId]);
    projId = newProj.rows[0].id;
  }

  // Ensure sample task
  const taskRes = await client.query(`
    SELECT id FROM public.tasks WHERE company_id = $1 LIMIT 1;
  `, [companyId]);
  if (taskRes.rows.length === 0) {
    const newTask = await client.query(`
      INSERT INTO public.tasks (company_id, department_id, project_id, title, description, status, priority, due_date, reviewer_id, created_by)
      VALUES (
        $1, $2, $3,
        'Design Mobile Header Banner & Navigation',
        'Create Figma prototypes and SVG assets for responsive mobile viewport',
        'in_progress',
        'high',
        NOW() + INTERVAL '5 days',
        '00000000-0000-0000-0000-000000000003',
        '00000000-0000-0000-0000-000000000002'
      )
      RETURNING id;
    `, [companyId, deptId, projId]);

    const taskId = newTask.rows[0].id;
    await client.query(`
      INSERT INTO public.task_assignments (task_id, employee_id, assigned_by, is_current)
      VALUES ($1, '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', true);
    `, [taskId]);
    console.log('Created sample task:', taskId);
  }

  await client.end();
  console.log('Seeding completed successfully!');
}

seedTestAccounts().catch(console.error);
