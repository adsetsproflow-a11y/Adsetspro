import { prisma } from '../src/lib/prisma';
import { INITIAL_COMPANIES, INITIAL_PROFILES, INITIAL_TASKS } from '../src/lib/seed-data';
import bcrypt from 'bcryptjs';
import { GlobalRole, CompanyRole, CompanyStatus, AccountStatus, MembershipStatus } from '@prisma/client';

async function checkAndMigrate() {
  console.log('--- Checking for raw Postgres tables & recovering company data ---');

  // 1. Check raw Postgres tables
  try {
    const rawTables = await prisma.$queryRawUnsafe<any[]>(
      `SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`
    );
    console.log('Existing PostgreSQL tables:', rawTables.map(t => t.table_name));

    // Check if raw "companies" table exists
    const hasRawCompanies = rawTables.some(t => t.table_name === 'companies');
    if (hasRawCompanies) {
      const rawComps = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM companies`);
      console.log(`Found ${rawComps.length} rows in raw "companies" table:`, rawComps.map(c => c.name || c.subdomain));
    }

    // Check if raw "profiles" table exists
    const hasRawProfiles = rawTables.some(t => t.table_name === 'profiles');
    if (hasRawProfiles) {
      const rawProfs = await prisma.$queryRawUnsafe<any[]>(`SELECT count(*) FROM profiles`);
      console.log(`Found profiles in raw "profiles" table:`, rawProfs);
    }
  } catch (err: any) {
    console.log('Raw table check note:', err.message);
  }

  // 2. Recover all companies from INITIAL_COMPANIES into Prisma Company
  console.log('\n--- Recovering All Existing Companies into Prisma ---');
  const superAdmin = await prisma.user.findFirst({
    where: { globalRole: GlobalRole.SUPER_ADMIN },
  });

  const defaultHash = await bcrypt.hash('admin123', 12);

  for (const comp of INITIAL_COMPANIES) {
    console.log(`Recovering company: "${comp.name}" (subdomain/slug: ${comp.subdomain})...`);
    
    // Status mapping:
    let status: CompanyStatus = CompanyStatus.ACTIVE;
    if (comp.approval_status === 'suspended' || !comp.is_active) {
      status = CompanyStatus.SUSPENDED;
    } else if (comp.approval_status === 'pending') {
      status = CompanyStatus.PENDING;
    }

    const companyRecord = await prisma.company.upsert({
      where: { slug: comp.subdomain },
      update: {
        name: comp.name,
        status,
        approvedAt: status === CompanyStatus.ACTIVE ? new Date(comp.created_at || Date.now()) : null,
        approvedById: status === CompanyStatus.ACTIVE ? superAdmin?.id : null,
      },
      create: {
        name: comp.name,
        slug: comp.subdomain,
        status,
        approvedAt: status === CompanyStatus.ACTIVE ? new Date(comp.created_at || Date.now()) : null,
        approvedById: status === CompanyStatus.ACTIVE ? superAdmin?.id : null,
        createdAt: new Date(comp.created_at || Date.now()),
      },
    });

    console.log(`✓ Company ready: ${companyRecord.name} (id: ${companyRecord.id}, status: ${companyRecord.status})`);

    // 3. Recover Profiles & Memberships for this company
    const compProfiles = INITIAL_PROFILES.filter(p => p.company_id === comp.id);
    for (const prof of compProfiles) {
      if (prof.role === 'super_admin') continue; // Handled separately

      // Upsert User
      const userRecord = await prisma.user.upsert({
        where: { email: prof.email.toLowerCase().trim() },
        update: {
          name: prof.full_name,
          avatarUrl: prof.avatar_url,
          accountStatus: AccountStatus.ACTIVE,
          emailVerifiedAt: new Date(prof.created_at || Date.now()),
        },
        create: {
          name: prof.full_name,
          email: prof.email.toLowerCase().trim(),
          passwordHash: defaultHash,
          globalRole: GlobalRole.USER,
          accountStatus: AccountStatus.ACTIVE,
          avatarUrl: prof.avatar_url,
          emailVerifiedAt: new Date(prof.created_at || Date.now()),
        },
      });

      // Upsert CompanyMembership
      const isCompanyAdmin = prof.role === 'company_admin' || prof.email === comp.admin_email;
      await prisma.companyMembership.upsert({
        where: {
          userId_companyId: {
            userId: userRecord.id,
            companyId: companyRecord.id,
          },
        },
        update: {
          role: isCompanyAdmin ? CompanyRole.COMPANY_ADMIN : CompanyRole.EMPLOYEE,
          designation: prof.designation,
          department: prof.department,
          membershipStatus: MembershipStatus.ACTIVE,
        },
        create: {
          userId: userRecord.id,
          companyId: companyRecord.id,
          role: isCompanyAdmin ? CompanyRole.COMPANY_ADMIN : CompanyRole.EMPLOYEE,
          designation: prof.designation,
          department: prof.department,
          membershipStatus: MembershipStatus.ACTIVE,
        },
      });

      console.log(`  ✓ Employee recovered: ${prof.full_name} (${prof.email}) [${isCompanyAdmin ? 'COMPANY_ADMIN' : 'EMPLOYEE'}] - ${prof.designation}`);
    }

    // 4. Recover Tasks for this company
    const compTasks = INITIAL_TASKS.filter(t => t.company_id === comp.id);
    for (const t of compTasks) {
      // Find creator user
      const creatorProf = INITIAL_PROFILES.find(p => p.id === t.created_by);
      const creatorUser = creatorProf 
        ? await prisma.user.findUnique({ where: { email: creatorProf.email } }) 
        : superAdmin;

      if (!creatorUser) continue;

      // Check if task title exists in company
      const existingTask = await prisma.task.findFirst({
        where: {
          companyId: companyRecord.id,
          title: t.title,
        },
      });

      let taskId = existingTask?.id;
      if (!existingTask) {
        const newTask = await prisma.task.create({
          data: {
            companyId: companyRecord.id,
            createdById: creatorUser.id,
            title: t.title,
            description: t.description,
            status: t.status === 'completed' ? 'COMPLETED' : t.status === 'in_progress' ? 'IN_PROGRESS' : 'TODO',
            dueDate: new Date(t.due_date),
            rewardXp: t.reward_xp || 100,
            createdAt: new Date(t.created_at),
          },
        });
        taskId = newTask.id;
        console.log(`  ✓ Task recovered: "${t.title}"`);
      }

      // Assignee
      if (t.assigned_to && taskId) {
        const assignedProf = INITIAL_PROFILES.find(p => p.id === t.assigned_to);
        if (assignedProf) {
          const assignedUser = await prisma.user.findUnique({ where: { email: assignedProf.email } });
          if (assignedUser) {
            await prisma.taskAssignment.upsert({
              where: {
                taskId_assignedUserId: {
                  taskId,
                  assignedUserId: assignedUser.id,
                },
              },
              update: {},
              create: {
                taskId,
                companyId: companyRecord.id,
                assignedUserId: assignedUser.id,
                assignedById: creatorUser.id,
              },
            });
          }
        }
      }
    }
  }

  // Summary of all companies in DB
  const allFinalCompanies = await prisma.company.findMany({
    include: {
      memberships: {
        include: {
          user: true,
        },
      },
      tasks: true,
    },
  });

  console.log('\n=============================================');
  console.log(`TOTAL RECOVERED COMPANIES IN DATABASE: ${allFinalCompanies.length}`);
  console.log('=============================================');
  for (const c of allFinalCompanies) {
    console.log(`\n• Company: ${c.name} (Slug: /c/${c.slug}) | Status: ${c.status}`);
    console.log(`  Employees (${c.memberships.length}):`);
    c.memberships.forEach(m => {
      console.log(`    - ${m.user.name} (${m.user.email}) | Role: ${m.role} | Designation: ${m.designation} | Dept: ${m.department}`);
    });
    console.log(`  Tasks (${c.tasks.length}):`);
    c.tasks.forEach(t => {
      console.log(`    - [${t.status}] ${t.title}`);
    });
  }
}

checkAndMigrate()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
