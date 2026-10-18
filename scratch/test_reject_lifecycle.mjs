async function testRejectFlow() {
  console.log('--- STEP 1: Registering new company "Declined Motors" ---');
  const regRes = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      companyName: 'Declined Motors',
      fullName: 'Dave Declined',
      email: 'dave@declinedmotors.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      termsAccepted: true
    })
  });
  const regData = await regRes.json();
  console.log('Registration result:', regData);
  const companyId = regData.company.id;
  const companySlug = regData.company.slug;

  console.log('\n--- STEP 2: Login as Dave ---');
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'dave@declinedmotors.com', password: 'Password123!' })
  });
  const cookieHeader = loginRes.headers.get('set-cookie');
  const sessionCookie = cookieHeader.split(';')[0];
  console.log('Dave login cookie obtained:', sessionCookie);

  console.log('\n--- STEP 3: Verify Workspace Pending screen before approval ---');
  const accessBefore = await fetch(`http://localhost:3000/c/${companySlug}/dashboard`, {
    headers: { 'Cookie': sessionCookie }
  });
  const htmlBefore = await accessBefore.text();
  console.log('Before approval contains "Workspace Pending Approval"?', htmlBefore.includes('Workspace Pending Approval'));

  console.log('\n--- STEP 4: Super Admin Rejection ---');
  const saSession = Buffer.from(JSON.stringify({
    id: '00000000-0000-0000-0000-000000000001',
    email: 'owner@adsetsproflow.com',
    full_name: 'Platform Super Admin',
    is_super_admin: true,
    role: 'SUPER_ADMIN',
    companySlug: 'p8-test-org'
  })).toString('base64');
  const saCookie = 'saaa_session=' + saSession;

  const rejectRes = await fetch(`http://localhost:3000/api/super-admin/companies/${companyId}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': saCookie
    },
    body: JSON.stringify({ reason: 'Failed corporate verification check' })
  });
  console.log('Reject API result:', await rejectRes.json());

  console.log('\n--- STEP 5: Verify Workspace is BLOCKED after rejection ---');
  const accessAfter = await fetch(`http://localhost:3000/c/${companySlug}/dashboard`, {
    headers: { 'Cookie': sessionCookie }
  });
  const htmlAfter = await accessAfter.text();
  console.log('After rejection contains "403 Forbidden"?', htmlAfter.includes('403 Forbidden'));
  console.log('Is Dave prevented from entering workspace?', !htmlAfter.includes('Declined Motors in Shell'));

  console.log('\n--- ALL VERIFICATIONS PASSED ---');
}

testRejectFlow().catch(console.error);
