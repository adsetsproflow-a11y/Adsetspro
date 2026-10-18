import { adminClient } from './src/lib/supabase/admin.ts';

async function testAdminAuth() {
  const { data, error } = await adminClient.auth.admin.listUsers();
  if (error) {
    console.log('admin.listUsers error:', error);
  } else {
    console.log('admin.listUsers success, count:', data.users.length);
  }
}

testAdminAuth().catch(console.error);
