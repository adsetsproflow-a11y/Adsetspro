import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getDbPool } from '@/lib/db';

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
      .select('id, name, member_limit')
      .eq('slug', companySlug)
      .single();

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Option A: Only Company Admin or Super Admin has authority to manage invitations
    const { data: profile } = await adminClient
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_super_admin) {
      const { data: membership } = await adminClient
        .from('company_memberships')
        .select('role')
        .eq('company_id', company.id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (!membership || membership.role !== 'COMPANY_ADMIN') {
        return NextResponse.json(
          { error: 'Forbidden: Organization Administrator access required to manage employee invitations.' },
          { status: 403 }
        );
      }
    }

    const pool = getDbPool();

    // 3. Fetch invitations and seat quota
    const [invitationsRes, memCountRes, invCountRes] = await Promise.all([
      adminClient
        .from('invitations')
        .select(`
          id,
          email,
          full_name,
          role,
          status,
          expires_at,
          created_at,
          department:departments!department_id(
            id,
            name
          ),
          designation:designations!designation_id(
            id,
            name
          ),
          inviter:profiles!invited_by(
            id,
            full_name
          )
        `)
        .eq('company_id', company.id)
        .order('created_at', { ascending: false }),
      pool.query(
        `SELECT COUNT(*)::int as count FROM public.company_memberships WHERE company_id = $1 AND status = 'active';`,
        [company.id]
      ),
      pool.query(
        `SELECT COUNT(*)::int as count FROM public.invitations WHERE company_id = $1 AND status = 'pending' AND expires_at > NOW();`,
        [company.id]
      ),
    ]);

    if (invitationsRes.error) {
      throw invitationsRes.error;
    }

    const activeMembersCount = memCountRes.rows[0]?.count || 0;
    const pendingInvitesCount = invCountRes.rows[0]?.count || 0;
    const memberLimit = Number(company.member_limit) || 5;
    const usedSeats = activeMembersCount + pendingInvitesCount;
    const availableSeats = Math.max(0, memberLimit - usedSeats);

    return NextResponse.json({
      success: true,
      invitations: invitationsRes.data || [],
      quota: {
        memberLimit,
        activeMembersCount,
        pendingInvitesCount,
        usedSeats,
        availableSeats,
        isLimitReached: usedSeats >= memberLimit,
      },
    });
  } catch (error: any) {
    console.error('Fetch invitations error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ companySlug: string }> }
) {
  try {
    const { companySlug } = await params;
    const body = await request.json();
    const { full_name, email, department_id, designation_id, role, reporting_to } = body;

    if (!email || !full_name) {
      return NextResponse.json(
        { error: 'Employee email and full name are required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const assignedRole = role === 'DEPARTMENT_HEAD' ? 'DEPARTMENT_HEAD' : 'EMPLOYEE';

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
      .select('id, name, member_limit')
      .eq('slug', companySlug)
      .single();

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // 3. Check caller permissions: Option A strictly requires COMPANY_ADMIN or SUPER_ADMIN
    const { data: profile } = await adminClient
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_super_admin) {
      const { data: membership } = await adminClient
        .from('company_memberships')
        .select('role')
        .eq('company_id', company.id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (!membership || membership.role !== 'COMPANY_ADMIN') {
        return NextResponse.json(
          { error: 'Forbidden: Only Organization Administrators can invite new employees.' },
          { status: 403 }
        );
      }
    }

    // 4. Check seat quota: active members + pending invitations
    const pool = getDbPool();
    const [memCountRes, invCountRes] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int as count FROM public.company_memberships WHERE company_id = $1 AND status = 'active';`,
        [company.id]
      ),
      pool.query(
        `SELECT COUNT(*)::int as count FROM public.invitations WHERE company_id = $1 AND status = 'pending' AND expires_at > NOW();`,
        [company.id]
      ),
    ]);

    const activeMembersCount = memCountRes.rows[0]?.count || 0;
    const pendingInvitesCount = invCountRes.rows[0]?.count || 0;
    const memberLimit = Number(company.member_limit) || 5;
    const usedSeats = activeMembersCount + pendingInvitesCount;

    if (usedSeats >= memberLimit) {
      return NextResponse.json(
        {
          error: `Seat capacity limit reached (${usedSeats}/${memberLimit} seats occupied: ${activeMembersCount} active members, ${pendingInvitesCount} pending invites). To invite more team members, request your Platform Super Admin to add +5 seat packs to your organization.`,
          quota: {
            memberLimit,
            activeMembersCount,
            pendingInvitesCount,
            usedSeats,
            availableSeats: 0,
            isLimitReached: true,
          },
        },
        { status: 403 }
      );
    }

    // 5. Check if email is already a member of this company
    const { data: existingProfile } = await adminClient
      .from('profiles')
      .select('id, is_super_admin')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existingProfile?.is_super_admin) {
      return NextResponse.json(
        { error: 'Platform Super Admin cannot be invited to join a tenant company.' },
        { status: 400 }
      );
    }

    if (existingProfile) {
      const { data: existingMember } = await adminClient
        .from('company_memberships')
        .select('id, status')
        .eq('company_id', company.id)
        .eq('user_id', existingProfile.id)
        .maybeSingle();

      if (existingMember && existingMember.status === 'active') {
        return NextResponse.json(
          { error: `User with email "${cleanEmail}" is already an active member of this organization.` },
          { status: 400 }
        );
      }
    }

    // 6. Generate secure random token and SHA-256 hash
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    // 7. Insert into invitations table
    const { data: invitation, error: invErr } = await adminClient
      .from('invitations')
      .insert({
        company_id: company.id,
        department_id: department_id || null,
        designation_id: designation_id || null,
        email: cleanEmail,
        full_name: full_name.trim(),
        role: assignedRole,
        reporting_to: reporting_to || null,
        token_hash: tokenHash,
        expires_at: expiresAt,
        status: 'pending',
        invited_by: user.id,
      })
      .select('*')
      .single();

    if (invErr) {
      throw invErr;
    }

    // 8. Write audit log
    await adminClient.from('audit_logs').insert({
      actor_id: user.id,
      company_id: company.id,
      action: 'USER_INVITED',
      target_id: invitation.id,
      target_type: 'invitation',
      details: {
        invited_email: cleanEmail,
        role: assignedRole,
        department_id: department_id || null,
        seats_used: usedSeats + 1,
        seat_limit: memberLimit,
      },
    });

    const host = request.headers.get('host') || 'localhost:3000';
    const proto = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const baseUrl = `${proto}://${host}`;
    const inviteUrl = `${baseUrl}/accept-invitation?token=${rawToken}`;
    console.log(`[ONBOARDING EMAIL] Workspace Invitation generated for ${cleanEmail}: ${inviteUrl}`);

    return NextResponse.json({
      success: true,
      invitation,
      inviteUrl,
      message: `Invitation generated successfully for ${cleanEmail}. Link valid for 7 days. (${usedSeats + 1}/${memberLimit} seats used)`,
      quota: {
        memberLimit,
        activeMembersCount,
        pendingInvitesCount: pendingInvitesCount + 1,
        usedSeats: usedSeats + 1,
        availableSeats: Math.max(0, memberLimit - (usedSeats + 1)),
      },
    });
  } catch (error: any) {
    console.error('Create invitation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // 3. Option A: Only Super Admin or Company Admin can clear invitations
    const { data: profile } = await adminClient
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_super_admin) {
      const { data: membership } = await adminClient
        .from('company_memberships')
        .select('role')
        .eq('company_id', company.id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (!membership || membership.role !== 'COMPANY_ADMIN') {
        return NextResponse.json(
          { error: 'Forbidden: Insufficient privileges to clear invitations.' },
          { status: 403 }
        );
      }
    }

    // 4. Delete all invitations for this company
    const pool = getDbPool();
    const delRes = await pool.query(
      `DELETE FROM public.invitations WHERE company_id = $1 RETURNING id;`,
      [company.id]
    );

    const deletedCount = delRes.rowCount || 0;

    // 5. Audit log
    await adminClient.from('audit_logs').insert({
      actor_id: user.id,
      company_id: company.id,
      action: 'INVITATIONS_CLEARED_ALL',
      target_type: 'invitations',
      details: { count: deletedCount },
    });

    return NextResponse.json({
      success: true,
      count: deletedCount,
      message: `Successfully cleared all ${deletedCount} invitation records. Released ${deletedCount} reserved seats.`,
    });
  } catch (error: any) {
    console.error('Clear invitations error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
