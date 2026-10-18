import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wiswkavvupyuzujnbirq.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.service_role_fallback';

const client = createClient(supabaseUrl, serviceRoleKey);

async function testSupabaseHttp() {
  console.log('Testing Supabase HTTP PostgREST API...');
  const res = await client.from('companies').select('*');
  console.log('Result:', JSON.stringify(res, null, 2));
}

testSupabaseHttp().catch(console.error);
