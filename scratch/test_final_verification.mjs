import http from 'http';

const BASE_URL = 'http://localhost:3000';

async function runTest() {
  console.log('===========================================================');
  console.log('   SAAA PLATFORM — COMPANY REGISTRATION & APPROVAL SUITE   ');
  console.log('===========================================================\n');

  const randomSuffix = Math.floor(Math.random() * 10000);
  const testCompany = {
    companyName: `Apex Enterprise ${randomSuffix}`,
    fullName: `Alex Apex ${randomSuffix}`,
    email: `alex_${randomSuffix}@apexent.com`,
    password: 'Password123!',
    confirmPassword: 'Password123!',
    termsAccepted: true,
  };

  // --- TEST 1: Register New Organization ---
  console.log(`[TEST 1] Registering company: "${testCompany.companyName}"...`);
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testCompany),
  });
  const regData = await regRes.json();
  if (!regRes.ok || !regData.success) {
    throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
  }
  const { id: companyId, slug: companySlug, status: initialStatus } = regData.company;
  console.log(`   -> Created organization ID: ${companyId}`);
  console.log(`   -> Assigned Slug: ${companySlug}`);
  console.log(`   -> Status: "${initialStatus}" (Pending Verification)`);
  if (initialStatus !== 'pending') throw new Error('Company was not created in pending state!');
  console.log('   [PASS] Registration completed in pending state.\n');

  // --- TEST 2: Company Admin Login Before Approval ---
  console.log(`[TEST 2] Logging in as new Company Admin (${testCompany.email})...`);
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testCompany.email,
      password: testCompany.password,
    }),
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok || !loginData.success) {
    throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
  }
  const cookieHeader = loginRes.headers.get('set-cookie');
  const userCookie = cookieHeader ? cookieHeader.split(';')[0] : '';
  console.log(`   -> Authenticated User: ${loginData.user.full_name} (${loginData.user.role})`);
  console.log('   [PASS] User login and session generation successful.\n');

  // --- TEST 3: Access Workspace While Pending ---
  console.log(`[TEST 3] Attempting to access workspace /c/${companySlug}/dashboard before approval...`);
  const accessBeforeRes = await fetch(`${BASE_URL}/c/${companySlug}/dashboard`, {
    headers: { Cookie: userCookie },
  });
  const htmlBefore = await accessBeforeRes.text();
  const isPendingGateActive = htmlBefore.includes('Workspace Pending Approval') && htmlBefore.includes('403 Forbidden');
  console.log(`   -> Pending Gate Screen Detected: ${isPendingGateActive}`);
  if (!isPendingGateActive) {
    throw new Error('Company admin was able to access unapproved workspace!');
  }
  console.log('   [PASS] Company Admin is properly restricted until Super Admin approves.\n');

  // --- TEST 4: Super Admin Dashboard & Queue Verification ---
  console.log('[TEST 4] Verifying pending company in Super Admin Approvals Queue...');
  const saSession = Buffer.from(
    JSON.stringify({
      id: '00000000-0000-0000-0000-000000000001',
      email: 'owner@adsetsproflow.com',
      full_name: 'Platform Super Admin',
      is_super_admin: true,
      role: 'SUPER_ADMIN',
      companySlug: 'p8-test-org',
    })
  ).toString('base64');
  const saCookie = `saaa_session=${saSession}`;

  const queueRes = await fetch(`${BASE_URL}/api/super-admin/companies?status=pending`, {
    headers: { Cookie: saCookie },
  });
  const queueData = await queueRes.json();
  const foundInQueue = (queueData.companies || []).find((c) => c.id === companyId);
  if (!foundInQueue) {
    throw new Error('New company was not found in Super Admin pending queue!');
  }
  console.log(`   -> Found in pending queue: "${foundInQueue.name}" (by ${foundInQueue.created_by_profile?.full_name})`);
  console.log('   [PASS] Super Admin dashboard queue reflects pending company.\n');

  // --- TEST 5: Super Admin Approves Company ---
  console.log(`[TEST 5] Super Admin approves company ID: ${companyId}...`);
  const approveRes = await fetch(`${BASE_URL}/api/super-admin/companies/${companyId}/approve`, {
    method: 'POST',
    headers: { Cookie: saCookie },
  });
  const approveData = await approveRes.json();
  if (!approveRes.ok || !approveData.success) {
    throw new Error(`Approval failed: ${JSON.stringify(approveData)}`);
  }
  console.log(`   -> Approval message: "${approveData.message}"`);
  console.log('   [PASS] Company approved successfully.\n');

  // --- TEST 6: Company Admin Enters Workspace After Approval ---
  console.log(`[TEST 6] Company Admin entering /c/${companySlug}/dashboard after approval...`);
  const accessAfterRes = await fetch(`${BASE_URL}/c/${companySlug}/dashboard`, {
    headers: { Cookie: userCookie },
  });
  const htmlAfter = await accessAfterRes.text();
  const isPendingGateGone = !htmlAfter.includes('Workspace Pending Approval');
  const isWorkspaceRendered = htmlAfter.includes(testCompany.companyName);
  console.log(`   -> HTTP Status: ${accessAfterRes.status}`);
  console.log(`   -> Pending Gate Removed: ${isPendingGateGone}`);
  console.log(`   -> Workspace Shell Rendered: ${isWorkspaceRendered}`);
  if (!isPendingGateGone || !isWorkspaceRendered) {
    throw new Error('Company admin could not access workspace after approval!');
  }
  console.log('   [PASS] Full workspace functionality now unlocked for Company Admin!\n');

  // --- TEST 7: Demo Accounts Liveness Check ---
  console.log('[TEST 7] Verifying standard demo accounts...');
  const demoAccounts = [
    { role: 'Super Admin', email: 'owner@adsetsproflow.com', target: '/super-admin/dashboard' },
    { role: 'Company Admin', email: 'admin@p8-test.com', target: '/c/p8-test-org/dashboard' },
    { role: 'Dept Head', email: 'depthead@p8-test.com', target: '/c/p8-test-org/tasks' },
    { role: 'Employee', email: 'employee@p8-test.com', target: '/c/p8-test-org/tasks' },
  ];

  for (const acct of demoAccounts) {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: acct.email, password: 'SuperAdmin@2026!Secure' }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(`Demo login failed for ${acct.role}`);
    }
    console.log(`   -> [OK] ${acct.role} (${acct.email}) authenticated successfully.`);
  }
  console.log('   [PASS] All 4 demo accounts verified operational.\n');

  console.log('===========================================================');
  console.log('   ALL CHECKS PASSED: LIFECYCLE & APPROVAL PIPELINE 100%   ');
  console.log('===========================================================');
}

runTest().catch((err) => {
  console.error('\n[FATAL ERROR IN SUITE]:', err);
  process.exit(1);
});
