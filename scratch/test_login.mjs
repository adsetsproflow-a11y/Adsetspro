import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wiswkavvupyuzujnbirq.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.empty_fallback_key';

const supabase = createClient(supabaseUrl, anonKey);

async function testLogin() {
  console.log('Testing authentication with test accounts...');

  const accounts = [
    { email: 'owner@adsetsproflow.com', password: 'SuperAdmin@2026!Secure', role: 'Super Admin' },
    { email: 'admin@p8-test.com', password: 'SuperAdmin@2026!Secure', role: 'Company Admin' },
    { email: 'depthead@p8-test.com', password: 'SuperAdmin@2026!Secure', role: 'Department Head' },
    { email: 'employee@p8-test.com', password: 'SuperAdmin@2026!Secure', role: 'Employee' },
  ];

  for (const acc of accounts) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: acc.email,
      password: acc.password,
    });

    if (error) {
      console.log(`FAIL [${acc.role}] ${acc.email}: ${error.message}`);
    } else {
      console.log(`SUCCESS [${acc.role}] ${acc.email} authenticated. User ID: ${data.user?.id}`);
    }
  }
}

testLogin().catch(console.error);
