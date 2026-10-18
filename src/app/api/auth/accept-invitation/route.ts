import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, fullName, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required.' },
        { status: 400 }
      );
    }

    // 1. Hash the incoming token with SHA-256
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // 2. Query invitation with company details
    const { data: invitation, error: invError } = await adminClient
      .from('invitations')
      .select(`
        *,
        companies:company_id (
          id,
          name,
          slug,
          status
        )
      `)
      .eq('token_hash', tokenHash)
      .maybeSingle();

    if (invError || !invitation) {
      return NextResponse.json(
        { error: 'Invalid invitation token or link not found.' },
        { status: 404 }
      );
    }

    // 3. Validation checks: pending, not expired, company approved
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: `This invitation is already ${invitation.status}.` },
        { status: 400 }
      );
    }

    if (new Date(invitation.expires_at) < new Date()) {
      await adminClient
        .from('invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id);

      return NextResponse.json(
        { error: 'This invitation link has expired. Please request a new invite.' },
        { status: 410 }
      );
    }

    const company = (invitation as any).companies;
    if (!company || company.status !== 'approved') {
      return NextResponse.json(
        { error: 'The organization associated with this invite is currently inactive or pending approval.' },
        { status: 403 }
      );
    }

    const memberName = fullName?.trim() || invitation.full_name;
    const memberEmail = invitation.email.toLowerCase().trim();

    // 4. Create or fetch user in Supabase Auth via Admin Client
    let userId: string;
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email: memberEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: memberName,
      },
    });

    if (authError || !authUser?.user) {
      // Check if user already exists
      const { data: existingProfile } = await adminClient
        .from('profiles')
        .select('id')
        .eq('email', memberEmail)
        .maybeSingle();

      if (existingProfile) {
        userId = existingProfile.id;
      } else {
        return NextResponse.json(
          { error: authError?.message || 'Failed to initialize authenticated user account.' },
          { status: 400 }
        );
      }
    } else {
      userId = authUser.user.id;
    }

    // 5. Upsert Profile
    await adminClient.from('profiles').upsert({
      id: userId,
      full_name: memberName,
      email: memberEmail,
      is_super_admin: false,
      account_status: 'active',
    });

    // 6. Create Company Membership
    await adminClient.from('company_memberships').upsert({
      user_id: userId,
      company_id: invitation.company_id,
      role: invitation.role,
      status: 'active',
    });

    // 7. If department assigned, create department membership
    if (invitation.department_id) {
      await adminClient.from('department_memberships').upsert({
        user_id: userId,
        department_id: invitation.department_id,
        designation_id: invitation.designation_id || null,
        reporting_to: invitation.reporting_to || null,
        status: 'active',
      });
    }

    // 8. Mark invitation as accepted
    await adminClient
      .from('invitations')
      .update({ status: 'accepted' })
      .eq('id', invitation.id);

    // 9. Create notification for inviter
    if (invitation.invited_by) {
      await adminClient.from('notifications').insert({
        user_id: invitation.invited_by,
        company_id: invitation.company_id,
        type: 'invitation_accepted',
        title: 'Team Invitation Accepted',
        body: `${memberName} (${memberEmail}) has joined the workspace.`,
        payload: {
          member_id: userId,
          company_id: invitation.company_id,
          role: invitation.role,
        },
      });
    }

    // 10. Write Audit Log
    await adminClient.from('audit_logs').insert({
      actor_id: userId,
      company_id: invitation.company_id,
      action: 'INVITATION_ACCEPTED',
      target_id: invitation.id,
      target_type: 'invitation',
      details: {
        email: memberEmail,
        role: invitation.role,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Invitation accepted successfully.',
      companySlug: company.slug,
    });
  } catch (error: any) {
    console.error('Accept invitation error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred while processing invitation.' },
      { status: 500 }
    );
  }
}
