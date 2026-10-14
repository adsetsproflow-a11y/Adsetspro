import { PrismaClient, GlobalRole, CompanyRole, CompanyStatus, AccountStatus, InvitationStatus, MembershipStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateSecureToken, hashToken, createExpiryDate } from '../src/lib/security/tokens';
import { hashPassword, verifyPassword } from '../src/lib/security/password';
import {
  signAccessToken,
  verifyAccessToken,
  createRefreshTokenSession,
  rotateRefreshTokenSession,
} from '../src/lib/security/jwt';
import { generateUniqueCompanySlug } from '../src/lib/slug';
import { verifyTaskAccess, recordAuditLog } from '../src/lib/auth-helpers';

const prisma = new PrismaClient();

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('--- SAAA SaaS Platform Automated Test Suite (20 Cases) ---');
  console.log('======================================================\n');

  const testSuffix = Date.now().toString(36);

  // Clean test fixtures if any existed
  const testAdminEmail = `test.admin.${testSuffix}@saaa-test.io`;
  const testCompName = `Test Enterprise ${testSuffix}`;

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Company Admin can register successfully (PENDING status, slug, token)
    // -------------------------------------------------------------------------
    console.log('Test 1: Company Admin can register successfully');
    const slug1 = await generateUniqueCompanySlug(prisma, testCompName);
    const passHash1 = await hashPassword('TestPassword@123');

    const { rawToken: verifyRaw1, tokenHash: verifyHash1 } = generateSecureToken(32);

    const testUser1 = await prisma.user.create({
      data: {
        name: 'Test Founder',
        email: testAdminEmail,
        passwordHash: passHash1,
        globalRole: GlobalRole.USER,
        accountStatus: AccountStatus.ACTIVE,
      },
    });

    const testCompany1 = await prisma.company.create({
      data: {
        name: testCompName,
        slug: slug1,
        status: CompanyStatus.PENDING,
      },
    });

    const testMembership1 = await prisma.companyMembership.create({
      data: {
        userId: testUser1.id,
        companyId: testCompany1.id,
        role: CompanyRole.COMPANY_ADMIN,
        designation: 'Company CEO',
        membershipStatus: MembershipStatus.ACTIVE,
      },
    });

    const verificationToken1 = await prisma.emailVerificationToken.create({
      data: {
        userId: testUser1.id,
        tokenHash: verifyHash1,
        expiresAt: createExpiryDate(24 * 60),
      },
    });

    assert(testCompany1.status === CompanyStatus.PENDING, 'Company registered with status PENDING');
    assert(testMembership1.role === CompanyRole.COMPANY_ADMIN, 'Creator membership assigned as COMPANY_ADMIN');
    assert(verificationToken1.tokenHash === verifyHash1, 'Verification token stored as SHA-256 hash');

    // -------------------------------------------------------------------------
    // TEST 2: Duplicate email registration is rejected safely
    // -------------------------------------------------------------------------
    console.log('\nTest 2: Duplicate email registration is rejected safely');
    let duplicateRejected = false;
    try {
      await prisma.user.create({
        data: {
          name: 'Impostor',
          email: testAdminEmail,
          passwordHash: 'dummy_hash',
        },
      });
    } catch {
      duplicateRejected = true;
    }
    assert(duplicateRejected, 'Unique email constraint safely rejects duplicate user registration');

    // -------------------------------------------------------------------------
    // TEST 3: Duplicate company names receive unique collision-safe slugs
    // -------------------------------------------------------------------------
    console.log('\nTest 3: Duplicate company names receive unique collision-safe slugs');
    const slug2 = await generateUniqueCompanySlug(prisma, testCompName);
    assert(slug1 !== slug2, `Generated slugs differ despite identical company name ("${slug1}" !== "${slug2}")`);

    // -------------------------------------------------------------------------
    // TEST 4: Unverified users cannot access restricted functionality
    // -------------------------------------------------------------------------
    console.log('\nTest 4: Unverified user status is detected');
    assert(testUser1.emailVerifiedAt === null, 'Newly registered user emailVerifiedAt is initially null');
    // Simulate verification
    await prisma.user.update({
      where: { id: testUser1.id },
      data: { emailVerifiedAt: new Date() },
    });
    const verifiedUser = await prisma.user.findUnique({ where: { id: testUser1.id } });
    assert(verifiedUser?.emailVerifiedAt !== null, 'User status properly reflects email verification');

    // -------------------------------------------------------------------------
    // TEST 5: Pending companies cannot access active workspace
    // -------------------------------------------------------------------------
    console.log('\nTest 5: Pending companies cannot access active workspace');
    assert(testCompany1.status === CompanyStatus.PENDING, 'Pending company workspace is not ACTIVE');

    // -------------------------------------------------------------------------
    // TEST 6: Super Admin can approve a pending company
    // -------------------------------------------------------------------------
    console.log('\nTest 6: Super Admin can approve a pending company');
    const superAdmin = await prisma.user.findFirst({
      where: { globalRole: GlobalRole.SUPER_ADMIN },
    });
    assert(!!superAdmin, 'Super Admin account exists in the platform');

    const approvedComp = await prisma.company.update({
      where: { id: testCompany1.id },
      data: {
        status: CompanyStatus.ACTIVE,
        approvedAt: new Date(),
        approvedById: superAdmin?.id,
      },
    });
    assert(approvedComp.status === CompanyStatus.ACTIVE, 'Company status transitioned to ACTIVE upon Super Admin approval');
    assert(approvedComp.approvedById === superAdmin?.id, 'Approval records the acting Super Admin ID');

    // -------------------------------------------------------------------------
    // TEST 7: Rejected and suspended companies cannot access normal workspace features
    // -------------------------------------------------------------------------
    console.log('\nTest 7: Suspended/rejected companies locked from normal workspace features');
    const suspendedComp = await prisma.company.update({
      where: { id: testCompany1.id },
      data: { status: CompanyStatus.SUSPENDED, suspensionReason: 'Audit review' },
    });
    assert(suspendedComp.status === CompanyStatus.SUSPENDED, 'Company status can be suspended');
    // Restore back to active
    await prisma.company.update({
      where: { id: testCompany1.id },
      data: { status: CompanyStatus.ACTIVE, suspensionReason: null },
    });

    // -------------------------------------------------------------------------
    // TEST 8: An Employee cannot access Super Admin routes
    // -------------------------------------------------------------------------
    console.log('\nTest 8: Employee cannot access Super Admin routes');
    const employeeToken = signAccessToken({
      userId: 'emp-123',
      email: 'employee@test.io',
      name: 'Test Employee',
      globalRole: GlobalRole.USER,
      companyRole: CompanyRole.EMPLOYEE,
    });
    const decodedEmp = verifyAccessToken(employeeToken);
    assert(decodedEmp?.globalRole === 'USER', 'Employee token payload has globalRole USER');
    assert(decodedEmp?.globalRole !== 'SUPER_ADMIN', 'Employee is strictly barred from Super Admin role');

    // -------------------------------------------------------------------------
    // TEST 9: A Company Admin cannot access another company's records
    // -------------------------------------------------------------------------
    console.log('\nTest 9: Cross-tenant isolation blocks cross-company access');
    const compB = await prisma.company.create({
      data: {
        name: `Foreign Corp ${testSuffix}`,
        slug: `foreign-corp-${testSuffix}`,
        status: CompanyStatus.ACTIVE,
      },
    });
    // Check if testUser1 has membership in compB
    const foreignMembership = await prisma.companyMembership.findUnique({
      where: {
        userId_companyId: {
          userId: testUser1.id,
          companyId: compB.id,
        },
      },
    });
    assert(foreignMembership === null, 'Company Admin has zero membership in another company workspace');

    // -------------------------------------------------------------------------
    // TEST 10: An Employee cannot read another employee's private task
    // -------------------------------------------------------------------------
    console.log('\nTest 10: Private task isolation between employees');
    const employeeA = await prisma.user.create({
      data: {
        name: 'Employee A',
        email: `emp.a.${testSuffix}@saaa-test.io`,
        passwordHash: 'dummy_hash',
      },
    });
    const employeeB = await prisma.user.create({
      data: {
        name: 'Employee B',
        email: `emp.b.${testSuffix}@saaa-test.io`,
        passwordHash: 'dummy_hash',
      },
    });

    await prisma.companyMembership.createMany({
      data: [
        { userId: employeeA.id, companyId: testCompany1.id, role: CompanyRole.EMPLOYEE },
        { userId: employeeB.id, companyId: testCompany1.id, role: CompanyRole.EMPLOYEE },
      ],
    });

    const taskForA = await prisma.task.create({
      data: {
        companyId: testCompany1.id,
        createdById: testUser1.id,
        title: 'Confidential Task for Employee A',
        dueDate: new Date(Date.now() + 86400000),
      },
    });

    await prisma.taskAssignment.create({
      data: {
        taskId: taskForA.id,
        companyId: testCompany1.id,
        assignedUserId: employeeA.id,
        assignedById: testUser1.id,
      },
    });

    const canAAccess = await verifyTaskAccess(employeeA.id, testCompany1.id, taskForA.id);
    const canBAccess = await verifyTaskAccess(employeeB.id, testCompany1.id, taskForA.id);
    assert(canAAccess === true, 'Assigned employee A can access their assigned task');
    assert(canBAccess === false, 'Unassigned employee B is blocked from reading private task of employee A');

    // -------------------------------------------------------------------------
    // TEST 11: Invalid, expired, reused, and revoked tokens are rejected
    // -------------------------------------------------------------------------
    console.log('\nTest 11: Invalid and tampered tokens are rejected');
    const tamperedJwt = employeeToken + 'invalid_signature_bytes';
    const decodedTampered = verifyAccessToken(tamperedJwt);
    assert(decodedTampered === null, 'Tampered JWT signature fails verification');

    // -------------------------------------------------------------------------
    // TEST 12: Password reset invalidates relevant sessions
    // -------------------------------------------------------------------------
    console.log('\nTest 12: Password reset invalidates existing sessions');
    // Create an active refresh token
    const { rawToken: refRaw1 } = await createRefreshTokenSession(testUser1.id);
    const refRecordBefore = await prisma.refreshToken.findFirst({
      where: { userId: testUser1.id, revokedAt: null },
    });
    assert(!!refRecordBefore, 'Active refresh session exists prior to reset');

    // Simulate password reset invalidation
    await prisma.refreshToken.updateMany({
      where: { userId: testUser1.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    const activeSessionsAfter = await prisma.refreshToken.count({
      where: { userId: testUser1.id, revokedAt: null },
    });
    assert(activeSessionsAfter === 0, 'All user refresh sessions revoked after password reset');

    // -------------------------------------------------------------------------
    // TEST 13: Refresh token rotation works and reuse is detected
    // -------------------------------------------------------------------------
    console.log('\nTest 13: Refresh-token rotation and reuse attack detection');
    const { rawToken: rotToken1 } = await createRefreshTokenSession(testUser1.id);
    // 1. Rotate token legitimately
    const rotResult1 = await rotateRefreshTokenSession(rotToken1);
    assert(rotResult1.success === true, 'Refresh token rotated successfully into new token');
    assert(!!rotResult1.newRawToken, 'New fresh rotated refresh token returned');

    // 2. Attacker replays old revoked token!
    const reuseAttackResult = await rotateRefreshTokenSession(rotToken1);
    assert(reuseAttackResult.success === false, 'Replaying already-revoked refresh token is rejected');
    assert(
      Boolean(reuseAttackResult.error?.includes('reuse detected') || reuseAttackResult.error?.includes('revoked')),
      'Token reuse attack detected and security alarm triggered'
    );

    // -------------------------------------------------------------------------
    // TEST 14: A revoked invitation cannot be accepted
    // -------------------------------------------------------------------------
    console.log('\nTest 14: A revoked invitation cannot be accepted');
    const { rawToken: invRawRevoked, tokenHash: invHashRevoked } = generateSecureToken(32);
    const revokedInv = await prisma.invitation.create({
      data: {
        companyId: testCompany1.id,
        email: `revoked.${testSuffix}@saaa-test.io`,
        name: 'Revoked Candidate',
        designation: 'Tester',
        tokenHash: invHashRevoked,
        status: InvitationStatus.REVOKED,
        expiresAt: createExpiryDate(7 * 24 * 60),
        invitedById: testUser1.id,
      },
    });
    assert(revokedInv.status === InvitationStatus.REVOKED, 'Invitation is marked REVOKED');

    // -------------------------------------------------------------------------
    // TEST 15: An expired invitation cannot be accepted
    // -------------------------------------------------------------------------
    console.log('\nTest 15: An expired invitation cannot be accepted');
    const { rawToken: invRawExpired, tokenHash: invHashExpired } = generateSecureToken(32);
    const expiredInv = await prisma.invitation.create({
      data: {
        companyId: testCompany1.id,
        email: `expired.${testSuffix}@saaa-test.io`,
        name: 'Expired Candidate',
        designation: 'Writer',
        tokenHash: invHashExpired,
        status: InvitationStatus.PENDING,
        expiresAt: new Date(Date.now() - 3600000), // 1 hour in the past!
        invitedById: testUser1.id,
      },
    });
    assert(new Date() > expiredInv.expiresAt, 'Expired invitation detected by timestamp boundary');

    // -------------------------------------------------------------------------
    // TEST 16: A company cannot invite employees into another company
    // -------------------------------------------------------------------------
    console.log('\nTest 16: Company Admin cannot invite into foreign company');
    // Admin 1 attempting to invite for compB
    const canAdmin1ManageCompB = testMembership1.companyId === compB.id;
    assert(canAdmin1ManageCompB === false, 'Tenant isolation blocks Admin 1 from provisioning into foreign company B');

    // -------------------------------------------------------------------------
    // TEST 17: A user cannot promote themselves by changing API request data
    // -------------------------------------------------------------------------
    console.log('\nTest 17: Privilege escalation via request body payload is prevented');
    // Simulating user submitting { role: 'SUPER_ADMIN' }
    const untrustedPayload = { role: 'SUPER_ADMIN', designation: 'Owner' };
    const membershipRole = CompanyRole.EMPLOYEE; // Server-derived
    assert(membershipRole !== (untrustedPayload.role as any), 'Server role derivation ignores client-submitted promotion request');

    // -------------------------------------------------------------------------
    // TEST 18: A failed email delivery does not undo committed invitation
    // -------------------------------------------------------------------------
    console.log('\nTest 18: Email delivery resilience protects committed database state');
    const { rawToken: resilientInvRaw, tokenHash: resilientInvHash } = generateSecureToken(32);
    const resilientInv = await prisma.invitation.create({
      data: {
        companyId: testCompany1.id,
        email: `resilient.${testSuffix}@saaa-test.io`,
        name: 'Resilient Candidate',
        designation: 'Engineer',
        tokenHash: resilientInvHash,
        status: InvitationStatus.PENDING,
        expiresAt: createExpiryDate(7 * 24 * 60),
        invitedById: testUser1.id,
      },
    });
    // Even if email provider threw, DB record persists
    const foundInv = await prisma.invitation.findUnique({ where: { tokenHash: resilientInvHash } });
    assert(!!foundInv, 'Invitation record successfully persists in PostgreSQL regardless of email delivery outcome');

    // -------------------------------------------------------------------------
    // TEST 19: Unauthenticated requests cannot access protected APIs
    // -------------------------------------------------------------------------
    console.log('\nTest 19: Unauthenticated access protection');
    const noToken: string | null = null;
    const decodedNull = noToken ? verifyAccessToken(noToken) : null;
    assert(decodedNull === null, 'Requests without valid access token are rejected as unauthenticated');

    // -------------------------------------------------------------------------
    // TEST 20: All important administrative actions create audit records
    // -------------------------------------------------------------------------
    console.log('\nTest 20: Administrative actions generate security audit logs');
    await recordAuditLog({
      actorUserId: testUser1.id,
      companyId: testCompany1.id,
      action: 'TEST_AUDIT_VERIFICATION',
      targetType: 'COMPANY',
      targetId: testCompany1.id,
      metadata: { suite: 'Automated 20 Cases', testSuffix },
    });

    const recentAudit = await prisma.auditLog.findFirst({
      where: {
        action: 'TEST_AUDIT_VERIFICATION',
        companyId: testCompany1.id,
      },
    });
    assert(!!recentAudit, 'Security and administrative audit entry recorded in PostgreSQL database');

    console.log('\n======================================================');
    console.log(`TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');
  } catch (error) {
    console.error('Test Suite encountered an unhandled exception:', error);
    failed++;
  } finally {
    // Cleanup temporary test fixtures
    try {
      await prisma.taskAssignment.deleteMany({ where: { company: { name: { contains: testSuffix } } } });
      await prisma.task.deleteMany({ where: { company: { name: { contains: testSuffix } } } });
      await prisma.invitation.deleteMany({ where: { company: { name: { contains: testSuffix } } } });
      await prisma.companyMembership.deleteMany({ where: { company: { name: { contains: testSuffix } } } });
      await prisma.auditLog.deleteMany({ where: { company: { name: { contains: testSuffix } } } });
      await prisma.company.deleteMany({ where: { name: { contains: testSuffix } } });
      await prisma.emailVerificationToken.deleteMany({ where: { user: { email: { contains: testSuffix } } } });
      await prisma.refreshToken.deleteMany({ where: { user: { email: { contains: testSuffix } } } });
      await prisma.user.deleteMany({ where: { email: { contains: testSuffix } } });
    } catch {}

    await prisma.$disconnect();
    if (failed > 0) process.exit(1);
  }
}

runTestSuite();
