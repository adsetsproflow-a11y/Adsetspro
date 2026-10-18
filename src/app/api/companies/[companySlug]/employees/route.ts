import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ companySlug: string }> }
) {
  try {
    const { companySlug } = await params;
    const supabase = await createClient();

    // 1. Authenticate caller
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch company
    const { data: company } = await adminClient
      .from('companies')
      .select('id, name')
      .eq('slug', companySlug)
      .single();

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // 3. Fetch all company memberships with profiles
    const { data: memberships, error: memErr } = await adminClient
      .from('company_memberships')
      .select(`
        id,
        user_id,
        role,
        status,
        created_at,
        profile:profiles!user_id(
          id,
          full_name,
          email,
          avatar_url,
          phone,
          account_status
        )
      `)
      .eq('company_id', company.id)
      .order('created_at', { ascending: false });

    if (memErr) {
      throw memErr;
    }

    // 4. Fetch department memberships for these users
    const userIds = (memberships || []).map((m) => m.user_id);
    const { data: deptMemberships } = await adminClient
      .from('department_memberships')
      .select(`
        user_id,
        department:departments!department_id(
          id,
          name
        ),
        designation:designations!designation_id(
          id,
          name
        )
      `)
      .in('user_id', userIds)
      .eq('status', 'active');

    const deptMap = new Map<string, { deptName: string; designationName: string }>();
    (deptMemberships || []).forEach((dm: any) => {
      deptMap.set(dm.user_id, {
        deptName: dm.department?.name || 'General',
        designationName: dm.designation?.name || 'Staff Member',
      });
    });

    const employees = (memberships || []).map((m: any) => {
      const dm = deptMap.get(m.user_id);
      return {
        id: m.profile?.id || m.user_id,
        membership_id: m.id,
        full_name: m.profile?.full_name || 'Member',
        email: m.profile?.email || '',
        avatar_url: m.profile?.avatar_url || null,
        phone: m.profile?.phone || null,
        account_status: m.profile?.account_status || 'active',
        role: m.role,
        status: m.status,
        department_name: dm?.deptName || 'Unassigned',
        designation_name: dm?.designationName || 'Member',
        joined_at: m.created_at,
      };
    });

    return NextResponse.json({
      success: true,
      employees,
    });
  } catch (error: any) {
    console.error('Fetch employees error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
