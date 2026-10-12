import { NextResponse } from 'next/server';
import { Client } from 'pg';

export async function GET() {
  try {
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

    await client.connect();

    const companies = await client.query('SELECT count(*) FROM companies;');
    const profiles = await client.query('SELECT count(*) FROM profiles;');
    const tasks = await client.query('SELECT count(*) FROM tasks;');

    await client.end();

    return NextResponse.json({
      status: 'online',
      host: 'db.wiswkavvupyuzujnbirq.supabase.co',
      counts: {
        companies: parseInt(companies.rows[0].count),
        profiles: parseInt(profiles.rows[0].count),
        tasks: parseInt(tasks.rows[0].count),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
