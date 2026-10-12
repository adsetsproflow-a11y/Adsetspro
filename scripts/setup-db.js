const { Client } = require('pg');

const client = new Client({
  host: 'db.wiswkavvupyuzujnbirq.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'fZ79*S%HgXB+_zx',
  ssl: {
    rejectUnauthorized: false,
  },
});

async function main() {
  console.log('Connecting to Supabase PostgreSQL database...');
  await client.connect();
  console.log('✓ Successfully connected to Supabase PostgreSQL!');

  console.log('Applying database schema from Master Prompt Specification...');

  const schemaSql = `
    -- Enable UUID extension
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    -- 1. COMPANIES (TENANTS)
    CREATE TABLE IF NOT EXISTS companies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        subdomain VARCHAR(100) UNIQUE NOT NULL,
        plan VARCHAR(50) DEFAULT 'pro',
        max_users INT DEFAULT 25,
        storage_limit_mb INT DEFAULT 5000,
        mrr INT DEFAULT 2400,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- 2. USER PROFILES
    CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        avatar_url TEXT,
        role VARCHAR(50) DEFAULT 'worker', -- 'super_admin', 'company_admin', 'team_lead', 'worker'
        department VARCHAR(50) DEFAULT 'Design', -- 'Development', 'Design', 'Content'
        total_xp INT DEFAULT 0,
        current_streak INT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- 3. TASKS
    CREATE TABLE IF NOT EXISTS tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
        department VARCHAR(50) NOT NULL,
        assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
        created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        priority VARCHAR(50) DEFAULT 'medium', -- 'urgent', 'high', 'medium', 'low'
        status VARCHAR(50) DEFAULT 'todo', -- 'todo', 'in_progress', 'review', 'completed'
        reward_xp INT DEFAULT 100,
        due_date TIMESTAMP WITH TIME ZONE NOT NULL,
        alarm_minutes_before INT DEFAULT 60,
        completed_at TIMESTAMP WITH TIME ZONE,
        time_spent_seconds INT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- 4. DELIVERABLES & WEBP ATTACHMENTS
    CREATE TABLE IF NOT EXISTS task_attachments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
        company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
        uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
        original_name TEXT NOT NULL,
        webp_name TEXT NOT NULL,
        webp_url TEXT NOT NULL,
        original_url TEXT,
        original_size_kb NUMERIC,
        webp_size_kb NUMERIC,
        savings_percentage NUMERIC,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- 5. REAL-TIME MESSAGES (CHAT)
    CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
        sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        sender_name VARCHAR(255),
        sender_avatar TEXT,
        channel_name VARCHAR(100) NOT NULL, -- '#general', '#designers', '#developers', '#content'
        task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        attachment_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- 6. LEADERBOARD POINTS AUDIT
    CREATE TABLE IF NOT EXISTS points_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
        user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
        points_awarded INT NOT NULL,
        reason VARCHAR(100) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- 7. ADMIN BROADCASTS
    CREATE TABLE IF NOT EXISTS broadcasts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        sender_name VARCHAR(255) NOT NULL,
        severity VARCHAR(50) DEFAULT 'urgent',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Enable Row Level Security (RLS)
    ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
    ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;
    ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
    ALTER TABLE points_history ENABLE ROW LEVEL SECURITY;
    ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;
  `;

  await client.query(schemaSql);
  console.log('✓ DDL schema created successfully with RLS enabled!');

  // Seed Initial Companies
  console.log('Seeding initial demo companies (Adsetspro & TechFlow Devs)...');
  const compResult = await client.query(`
    INSERT INTO companies (name, subdomain, plan, max_users, storage_limit_mb, mrr, is_active)
    VALUES
      ('Adsetspro', 'adsetspro', 'pro', 25, 5000, 2400, true),
      ('TechFlow Devs', 'techflow', 'enterprise', 50, 15000, 5800, true)
    ON CONFLICT (subdomain) DO UPDATE SET
      name = EXCLUDED.name,
      plan = EXCLUDED.plan,
      mrr = EXCLUDED.mrr
    RETURNING id, name, subdomain;
  `);

  const adsetsId = compResult.rows.find((r) => r.subdomain === 'adsetspro')?.id;
  const techflowId = compResult.rows.find((r) => r.subdomain === 'techflow')?.id;

  console.log(`✓ Companies seeded: Adsetspro (${adsetsId}), TechFlow (${techflowId})`);

  // Seed Initial User Profiles
  console.log('Seeding demo team member profiles...');
  const profilesResult = await client.query(`
    INSERT INTO profiles (company_id, full_name, email, avatar_url, role, department, total_xp, current_streak)
    VALUES
      ('${adsetsId}', 'Sarah Lin', 'sarah.lin@adsetspro.com', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', 'company_admin', 'Design', 2450, 15),
      ('${adsetsId}', 'Elena Rostova', 'elena@adsetspro.com', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', 'worker', 'Design', 3200, 18),
      ('${adsetsId}', 'Daniel Kim', 'daniel.kim@adsetspro.com', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'team_lead', 'Development', 2950, 14),
      ('${adsetsId}', 'Aisha Morales', 'aisha@adsetspro.com', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', 'worker', 'Content', 2650, 11),
      ('${adsetsId}', 'Marcus Drake', 'marcus@adsetspro.com', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', 'worker', 'Development', 2100, 8),
      ('${techflowId}', 'Vikram Patel', 'vikram@techflow.io', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', 'company_admin', 'Development', 3100, 16),
      ('${techflowId}', 'Tanya Belova', 'tanya@techflow.io', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', 'team_lead', 'Design', 2800, 12)
    ON CONFLICT DO NOTHING
    RETURNING id, full_name, role;
  `);

  console.log(`✓ Profiles seeded (${profilesResult.rowCount} profiles processed)`);

  // Seed sample tasks
  console.log('Seeding interactive tasks...');
  const elena = await client.query(`SELECT id FROM profiles WHERE email = 'elena@adsetspro.com' LIMIT 1`);
  const sarah = await client.query(`SELECT id FROM profiles WHERE email = 'sarah.lin@adsetspro.com' LIMIT 1`);

  if (elena.rows[0] && sarah.rows[0]) {
    const elenaId = elena.rows[0].id;
    const sarahId = sarah.rows[0].id;

    await client.query(`
      INSERT INTO tasks (company_id, department, assigned_to, created_by, title, description, priority, status, reward_xp, due_date, alarm_minutes_before, time_spent_seconds)
      VALUES
        ('${adsetsId}', 'Design', '${elenaId}', '${sarahId}', 'Adsetspro High-Converting Creative Ad Banners & WebP Assets', 'Finalize brand ad creative templates for Google Ads & Meta, icon variants, and dark/light mode marketing visuals.', 'urgent', 'in_progress', 250, NOW() + INTERVAL '45 minutes', 60, 4320),
        ('${adsetsId}', 'Design', '${elenaId}', '${sarahId}', 'High-Efficiency WebP Marketing Assets & Ad Creatives', 'Convert heavy 4K PNG renders into lossless WebP with 90%+ compression ratio.', 'medium', 'completed', 120, NOW() - INTERVAL '1 hour', 60, 3600)
      ON CONFLICT DO NOTHING;
    `);
    console.log('✓ Sample tasks seeded successfully!');
  }

  // Seed initial Admin Broadcast
  await client.query(`
    INSERT INTO broadcasts (company_id, title, message, sender_name, severity)
    VALUES (
      '${adsetsId}',
      '🚨 ALL-HANDS SPRINT DEMO TODAY AT 4:00 PM EST',
      'All staging pull requests must be merged by 3:30 PM. Please verify task deliverables and update your task status.',
      'Sarah Lin (Adsetspro Admin)',
      'urgent'
    )
    ON CONFLICT DO NOTHING;
  `);
  console.log('✓ Admin broadcast seeded!');

  // Check counts
  const compCount = await client.query('SELECT count(*) FROM companies;');
  const profileCount = await client.query('SELECT count(*) FROM profiles;');
  const taskCount = await client.query('SELECT count(*) FROM tasks;');
  console.log(`\n========================================`);
  console.log(`DATABASE SETUP COMPLETE ON SUPABASE!`);
  console.log(`- Companies count: ${compCount.rows[0].count}`);
  console.log(`- Profiles count:  ${profileCount.rows[0].count}`);
  console.log(`- Tasks count:     ${taskCount.rows[0].count}`);
  console.log(`========================================\n`);

  await client.end();
}

main().catch((err) => {
  console.error('Database setup failed:', err);
  process.exit(1);
});
