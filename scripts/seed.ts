import { PrismaClient, GlobalRole, CompanyRole, CompanyStatus, AccountStatus, MembershipStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- SAAA SaaS Platform Database Seeding ---');

  const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || 'owner@adsetsproflow.com').trim().toLowerCase();
  const superAdminName = process.env.SUPER_ADMIN_NAME || 'Platform Super Admin';
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@2026!Secure';

  // 1. Idempotent Super Admin creation
  let superAdmin = await prisma.user.findUnique({
    where: { email: superAdminEmail },
  });

  if (!superAdmin) {
    const passwordHash = await bcrypt.hash(superAdminPassword, 12);
    superAdmin = await prisma.user.create({
      data: {
        name: superAdminName,
        email: superAdminEmail,
        passwordHash,
        globalRole: GlobalRole.SUPER_ADMIN,
        accountStatus: AccountStatus.ACTIVE,
        emailVerifiedAt: new Date(),
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      },
    });
    console.log(`✓ Super Admin created: ${superAdmin.email}`);
  } else {
    // Keep existing password intact!
    if (superAdmin.globalRole !== GlobalRole.SUPER_ADMIN) {
      superAdmin = await prisma.user.update({
        where: { id: superAdmin.id },
        data: {
          globalRole: GlobalRole.SUPER_ADMIN,
          accountStatus: AccountStatus.ACTIVE,
          emailVerifiedAt: superAdmin.emailVerifiedAt || new Date(),
        },
      });
    }
    console.log(`✓ Super Admin already exists: ${superAdmin.email} (Password preserved)`);
  }

  // 2. Demo Company 1: Active Approved Company (Apex Agency / Adsetspro)
  let apexCompany = await prisma.company.findUnique({
    where: { slug: 'apex' },
  });

  if (!apexCompany) {
    apexCompany = await prisma.company.create({
      data: {
        name: 'Apex Agency',
        slug: 'apex',
        status: CompanyStatus.ACTIVE,
        approvedAt: new Date(),
        approvedById: superAdmin.id,
      },
    });
    console.log(`✓ Approved Company seeded: Apex Agency (slug: /c/apex)`);
  }

  // Sarah Lin - Company Admin for Apex
  const sarahEmail = 'sarah@apex.agency';
  let sarah = await prisma.user.findUnique({ where: { email: sarahEmail } });
  if (!sarah) {
    const defaultHash = await bcrypt.hash('admin123', 12);
    sarah = await prisma.user.create({
      data: {
        name: 'Sarah Lin',
        email: sarahEmail,
        passwordHash: defaultHash,
        globalRole: GlobalRole.USER,
        accountStatus: AccountStatus.ACTIVE,
        emailVerifiedAt: new Date(),
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      },
    });
  }

  await prisma.companyMembership.upsert({
    where: {
      userId_companyId: {
        userId: sarah.id,
        companyId: apexCompany.id,
      },
    },
    update: {
      role: CompanyRole.COMPANY_ADMIN,
      membershipStatus: MembershipStatus.ACTIVE,
    },
    create: {
      userId: sarah.id,
      companyId: apexCompany.id,
      role: CompanyRole.COMPANY_ADMIN,
      designation: 'Company CEO',
      department: 'Management',
      membershipStatus: MembershipStatus.ACTIVE,
    },
  });

  // Elena Rostova - Designer Employee
  const elenaEmail = 'elena@apex.agency';
  let elena = await prisma.user.findUnique({ where: { email: elenaEmail } });
  if (!elena) {
    const defaultHash = await bcrypt.hash('admin123', 12);
    elena = await prisma.user.create({
      data: {
        name: 'Elena Rostova',
        email: elenaEmail,
        passwordHash: defaultHash,
        globalRole: GlobalRole.USER,
        accountStatus: AccountStatus.ACTIVE,
        emailVerifiedAt: new Date(),
        avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
      },
    });
  }

  await prisma.companyMembership.upsert({
    where: {
      userId_companyId: {
        userId: elena.id,
        companyId: apexCompany.id,
      },
    },
    update: {
      role: CompanyRole.EMPLOYEE,
      membershipStatus: MembershipStatus.ACTIVE,
    },
    create: {
      userId: elena.id,
      companyId: apexCompany.id,
      role: CompanyRole.EMPLOYEE,
      designation: 'Lead Visual Designer',
      department: 'Design',
      membershipStatus: MembershipStatus.ACTIVE,
    },
  });

  // 3. Demo Company 2: Pending Approval Company (Acme Corp)
  let pendingCompany = await prisma.company.findUnique({
    where: { slug: 'acme-corp-pending' },
  });

  if (!pendingCompany) {
    pendingCompany = await prisma.company.create({
      data: {
        name: 'Acme Creative Studio',
        slug: 'acme-corp-pending',
        status: CompanyStatus.PENDING,
      },
    });

    const johnEmail = 'john@acme.com';
    let john = await prisma.user.findUnique({ where: { email: johnEmail } });
    if (!john) {
      const defaultHash = await bcrypt.hash('admin123', 12);
      john = await prisma.user.create({
        data: {
          name: 'John Acme',
          email: johnEmail,
          passwordHash: defaultHash,
          globalRole: GlobalRole.USER,
          accountStatus: AccountStatus.ACTIVE,
          emailVerifiedAt: new Date(),
        },
      });
    }

    await prisma.companyMembership.upsert({
      where: {
        userId_companyId: {
          userId: john.id,
          companyId: pendingCompany.id,
        },
      },
      update: {},
      create: {
        userId: john.id,
        companyId: pendingCompany.id,
        role: CompanyRole.COMPANY_ADMIN,
        designation: 'Founder & CEO',
        department: 'Operations',
        membershipStatus: MembershipStatus.ACTIVE,
      },
    });

    console.log(`✓ Pending Company seeded for Super Admin review: Acme Creative Studio (slug: /c/acme-corp-pending)`);
  }

  // 4. Sample Seed Tasks for Apex
  const existingTasks = await prisma.task.count({ where: { companyId: apexCompany.id } });
  if (existingTasks === 0) {
    const task = await prisma.task.create({
      data: {
        companyId: apexCompany.id,
        createdById: sarah.id,
        title: 'Q4 Brand Creative & WebP Campaign Assets',
        description: 'Design and export high-conversion ad banners with optimal WebP compression.',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        rewardXp: 250,
      },
    });

    await prisma.taskAssignment.create({
      data: {
        taskId: task.id,
        companyId: apexCompany.id,
        assignedUserId: elena.id,
        assignedById: sarah.id,
      },
    });
    console.log(`✓ Sample task and assignment created for Apex Agency`);
  }

  // Log audit event
  await prisma.auditLog.create({
    data: {
      actorUserId: superAdmin.id,
      companyId: apexCompany.id,
      action: 'PLATFORM_SEEDED',
      targetType: 'SYSTEM',
      targetId: 'INITIAL_SEED',
      metadata: JSON.stringify({
        superAdmin: superAdmin.email,
        timestamp: new Date().toISOString(),
      }),
    },
  });

  console.log('--- Database seeding completed successfully! ---');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
