const BASE_URL = 'http://localhost:3000';

async function testToken() {
  const token = '592640ef5baffdcfaabc33f7877bedf2d7958b169168b817a81ed20abc72db65';
  console.log('Testing token against localhost:3000...');
  
  // Note: we can test password validation or just verify endpoint is live
  const res = await fetch(`${BASE_URL}/accept-invitation?token=${token}`);
  console.log('GET /accept-invitation status:', res.status);
  const text = await res.text();
  console.log('Page loaded successfully:', text.includes('Join Workspace') || text.includes('Team Member Onboarding'));
}

testToken().catch(console.error);
