import { NextResponse } from 'next/server';
import crypto from 'crypto';
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
      .select('id')
      .eq('slug', companySlug)
      .single();

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Verify caller is COMPANY_ADMIN or SUPER_ADMIN
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

      if (!membership || (membership.role !== 'COMPANY_ADMIN' && membership.role !== 'DEPARTMENT_HEAD')) {
        return NextResponse.json(
          { error: 'Forbidden: Insufficient permissions to view organization invitations.' },
          { status: 403 }
        );
      }
    }

    // 3. Fetch invitations
    const { data: invitations, error: invErr } = await adminClient
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
      .order('created_at', { ascending: false });

    if (invErr) {
      throw invErr;
    }

    return NextResponse.json({
      success: true,
      invitations: invitations || [],
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
      .select('id, name')
      .eq('slug', companySlug)
      .single();

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // 3. Check caller permissions (COMPANY_ADMIN, SUPER_ADMIN, or DEPARTMENT_HEAD)
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

      if (!membership || (membership.role !== 'COMPANY_ADMIN' && membership.role !== 'DEPARTMENT_HEAD')) {
        return NextResponse.json(
          { error: 'Forbidden: Insufficient permissions to issue employee onboarding invitations.' },
          { status: 403 }
        );
      }
    }

    // 4. Check if email is already a member of this company
    const { data: existingProfile } = await adminClient
      .from('profiles')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();

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

    // 5. Generate secure random token and SHA-256 hash
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    // 6. Insert into invitations table
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

    // 7. Write audit log
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
      message: `Invitation generated successfully for ${cleanEmail}. Link valid for 7 days.`,
    });
  } catch (error: any) {
    console.error('Create invitation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
