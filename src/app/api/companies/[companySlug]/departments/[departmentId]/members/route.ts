import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { addMemberToDepartmentChatRoom } from '@/lib/chat/rooms';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ companySlug: string; departmentId: string }> }
) {
  try {
    const { companySlug, departmentId } = await params;
    const body = await request.json();
    const { user_id, designation_id, reporting_to } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch company & verify admin/dept head permission
    const { data: company } = await adminClient
      .from('companies')
      .select('id')
      .eq('slug', companySlug)
      .single();

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // 3. Upsert into department_memberships
    const { data: member, error: memberErr } = await adminClient
      .from('department_memberships')
      .upsert(
        {
          user_id,
          department_id: departmentId,
          designation_id: designation_id || null,
          reporting_to: reporting_to || null,
          status: 'active',
        },
        { onConflict: 'user_id, department_id' }
      )
      .select('*')
      .single();

    if (memberErr) {
      throw memberErr;
    }

    // Auto-add to department chat room
    await addMemberToDepartmentChatRoom(departmentId, user_id);

    // 4. Audit log
    await adminClient.from('audit_logs').insert({
      actor_id: user.id,
      company_id: company.id,
      action: 'DEPARTMENT_MEMBER_ADDED',
      target_id: departmentId,
      target_type: 'department_membership',
      details: { member_user_id: user_id },
    });

    return NextResponse.json({
      success: true,
      member,
      message: 'Member added to department successfully.',
    });
  } catch (error: any) {
    console.error('Add department member error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
