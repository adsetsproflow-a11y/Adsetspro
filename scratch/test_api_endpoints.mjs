async function testApiWithCookie() {
  const baseUrl = 'http://localhost:3000';
  
  // 1. Login
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner@adsetsproflow.com', password: 'SuperAdmin@2026!Secure' }),
  });
  const cookie = loginRes.headers.get('set-cookie');
  console.log('Login status:', loginRes.status, 'Cookie:', Boolean(cookie));

  // 2. Test Reports API
  console.log('\nTesting GET /api/companies/p8-test-org/reports ...');
  const reportRes = await fetch(`${baseUrl}/api/companies/p8-test-org/reports`, {
    headers: { cookie },
  });
  console.log('Reports status:', reportRes.status);
  const reportData = await reportRes.json().catch(() => null);
  console.log('Reports response:', JSON.stringify(reportData, null, 2));

  // 3. Test Tasks API
  console.log('\nTesting GET /api/companies/p8-test-org/tasks ...');
  const taskRes = await fetch(`${baseUrl}/api/companies/p8-test-org/tasks`, {
    headers: { cookie },
  });
  console.log('Tasks status:', taskRes.status);
  const taskData = await taskRes.json().catch(() => null);
  console.log('Tasks response:', JSON.stringify(taskData, null, 2));

  // 4. Test Employees API
  console.log('\nTesting GET /api/companies/p8-test-org/employees ...');
  const empRes = await fetch(`${baseUrl}/api/companies/p8-test-org/employees`, {
    headers: { cookie },
  });
  console.log('Employees status:', empRes.status);
  const empData = await empRes.json().catch(() => null);
  console.log('Employees response:', JSON.stringify(empData, null, 2));
}

testApiWithCookie().catch(console.error);
