async function testHttpLogin() {
  const baseUrl = 'http://localhost:3000';
  console.log('Testing live /api/auth/login endpoint...\n');

  const testCases = [
    { email: 'owner@adsetsproflow.com', password: 'SuperAdmin@2026!Secure', expectedRole: 'Super Admin' },
    { email: 'admin@p8-test.com', password: 'SuperAdmin@2026!Secure', expectedRole: 'Company Admin' },
    { email: 'depthead@p8-test.com', password: 'SuperAdmin@2026!Secure', expectedRole: 'Dept Head' },
    { email: 'employee@p8-test.com', password: 'SuperAdmin@2026!Secure', expectedRole: 'Employee' },
    { email: 'invalid@p8-test.com', password: 'WrongPassword!', expectedRole: 'Should Fail (401)' },
  ];

  for (const tc of testCases) {
    try {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: tc.email, password: tc.password }),
      });

      const data = await res.json();
      const cookieHeader = res.headers.get('set-cookie');

      if (res.ok) {
        console.log(`✓ [${tc.expectedRole}] ${tc.email}: SUCCESS 200`);
        console.log(`  User: ${data.user.full_name} | is_super_admin: ${data.is_super_admin} | companySlug: ${data.companySlug}`);
        console.log(`  Cookie set: ${cookieHeader ? 'YES' : 'NO'}\n`);
      } else {
        console.log(`✓ [${tc.expectedRole}] ${tc.email}: Correctly rejected with status ${res.status}: ${data.error}\n`);
      }
    } catch (err) {
      console.error(`Error testing ${tc.email}:`, err.message);
    }
  }
}

testHttpLogin().catch(console.error);
