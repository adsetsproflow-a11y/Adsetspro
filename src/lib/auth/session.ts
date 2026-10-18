import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import { Profile, Company, UserRole } from '@/types/app.types';

export async function getSession() {
  const supabase = await createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return null;
  }

  return session;
}

export async function getCurrentUser(): Promise<Profile | null> {
  const session = await getSession();
  if (!session?.user) {
    return null;
  }

  const { data: profile } = await adminClient
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  return (profile as unknown as Profile) || null;
}

export async function getCurrentUserWithRole(companySlug: string): Promise<{
  profile: Profile;
  company: Company;
  role: UserRole;
} | null> {
  const profile = await getCurrentUser();
  if (!profile) {
    return null;
  }

  // Find company by slug
  const { data: companyData } = await adminClient
    .from('companies')
    .select('*')
    .eq('slug', companySlug)
    .single();

  if (!companyData) {
    return null;
  }

  const company = companyData as unknown as Company;

  // Super Admins automatically have master authority across all tenants
  if (profile.is_super_admin) {
    return {
      profile,
      company,
      role: 'SUPER_ADMIN',
    };
  }

  // Query tenant membership
  const { data: membershipData } = await adminClient
    .from('company_memberships')
    .select('*')
    .eq('user_id', profile.id)
    .eq('company_id', company.id)
    .eq('status', 'active')
    .single();

  if (!membershipData) {
    return null;
  }

  const membership = membershipData as any;

  return {
    profile,
    company,
    role: membership.role as UserRole,
  };
}

export async function requireAuth(): Promise<Profile> {
  const profile = await getCurrentUser();
  if (!profile) {
    redirect('/login');
  }
  return profile;
}

export async function requireCompanyAccess(companySlug: string): Promise<{
  profile: Profile;
  company: Company;
  role: UserRole;
}> {
  const userWithRole = await getCurrentUserWithRole(companySlug);
  if (!userWithRole) {
    throw new Error('403: Forbidden - You are not an active member of this organization.');
  }

  if (userWithRole.company.status !== 'approved' && !userWithRole.profile.is_super_admin) {
    throw new Error('403: Forbidden - Organization workspace is pending approval or inactive.');
  }

  return userWithRole;
}

export async function requireRole(
  companySlug: string,
  allowedRoles: UserRole[]
): Promise<{
  profile: Profile;
  company: Company;
  role: UserRole;
}> {
  const context = await requireCompanyAccess(companySlug);
  if (!allowedRoles.includes(context.role) && !context.profile.is_super_admin) {
    throw new Error(`403: Forbidden - Required role permissions not met for this action.`);
  }

  return context;
}
