import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminClient } from '@/lib/supabase/admin';
import { getDbPool } from '@/lib/db';

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

    const pool = getDbPool();

    // 2. Query invitation with company details via direct database pool
    const invRes = await pool.query(
      `SELECT 
        i.*,
        json_build_object(
          'id', c.id,
          'name', c.name,
          'slug', c.slug,
          'status', c.status,
          'member_limit', COALESCE(c.member_limit, 5)
        ) as companies
      FROM public.invitations i
      JOIN public.companies c ON c.id = i.company_id
      WHERE i.token_hash = $1
      LIMIT 1;`,
      [tokenHash]
    );

    if (invRes.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid invitation token or link not found.' },
        { status: 404 }
      );
    }

    const invitation = invRes.rows[0];

    // 3. Validation checks: pending, not expired, company approved
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: `This invitation is already ${invitation.status}.` },
        { status: 400 }
      );
    }

    if (new Date(invitation.expires_at) < new Date()) {
      await pool.query(
        `UPDATE public.invitations SET status = 'expired' WHERE id = $1;`,
        [invitation.id]
      );

      return NextResponse.json(
        { error: 'This invitation link has expired. Please request a new invite.' },
        { status: 410 }
      );
    }

    const company = invitation.companies;
    if (!company || company.status !== 'approved') {
      return NextResponse.json(
        { error: 'The organization associated with this invite is currently inactive or pending approval.' },
        { status: 403 }
      );
    }

    // Secondary safety check: Active member seat limit
    const memCountRes = await pool.query(
      `SELECT COUNT(*)::int as count FROM public.company_memberships WHERE company_id = $1 AND status = 'active';`,
      [company.id]
    );
    const activeCount = memCountRes.rows[0]?.count || 0;
    const seatLimit = Number(company.member_limit) || 5;

    if (activeCount >= seatLimit) {
      return NextResponse.json(
        { error: `This organization has reached its maximum seat capacity (${activeCount}/${seatLimit}). Please contact the organization administrator to upgrade the seat tier.` },
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
      // Check if user already exists in profiles or auth.users
      const existingUserRes = await pool.query(
        `SELECT id FROM public.profiles WHERE LOWER(email) = LOWER($1) LIMIT 1;`,
        [memberEmail]
      );

      if (existingUserRes.rows.length > 0) {
        userId = existingUserRes.rows[0].id;
        try {
          await adminClient.auth.admin.updateUserById(userId, { password });
        } catch {}
      } else {
        const authUserRes = await pool.query(
          `SELECT id FROM auth.users WHERE LOWER(email) = LOWER($1) LIMIT 1;`,
          [memberEmail]
        );
        if (authUserRes.rows.length > 0) {
          userId = authUserRes.rows[0].id;
          try {
            await adminClient.auth.admin.updateUserById(userId, { password });
          } catch {}
        } else {
          return NextResponse.json(
            { error: authError?.message || 'Failed to initialize authenticated user account.' },
            { status: 400 }
          );
        }
      }
    } else {
      userId = authUser.user.id;
    }

    // Ensure password matches in auth.users via bcrypt
    try {
      await pool.query(
        `UPDATE auth.users 
         SET encrypted_password = extensions.crypt($2, extensions.gen_salt('bf', 6))
         WHERE id = $1;`,
        [userId, password]
      );
    } catch {}

    // 5. Upsert Profile
    await pool.query(
      `INSERT INTO public.profiles (id, full_name, email, is_super_admin, account_status)
       VALUES ($1, $2, $3, false, 'active')
       ON CONFLICT (id) DO UPDATE SET
         full_name = EXCLUDED.full_name,
         email = EXCLUDED.email,
         account_status = 'active';`,
      [userId, memberName, memberEmail]
    );

    // 6. Create Company Membership
    await pool.query(
      `INSERT INTO public.company_memberships (user_id, company_id, role, status)
       VALUES ($1, $2, $3, 'active')
       ON CONFLICT (user_id, company_id) DO UPDATE SET
         role = EXCLUDED.role,
         status = 'active';`,
      [userId, invitation.company_id, invitation.role]
    );

    // 7. If department assigned, create department membership
    if (invitation.department_id) {
      await pool.query(
        `INSERT INTO public.department_memberships (user_id, department_id, designation_id, reporting_to, status)
         VALUES ($1, $2, $3, $4, 'active')
         ON CONFLICT (user_id, department_id) DO UPDATE SET
           designation_id = EXCLUDED.designation_id,
           reporting_to = EXCLUDED.reporting_to,
           status = 'active';`,
        [userId, invitation.department_id, invitation.designation_id || null, invitation.reporting_to || null]
      );
    }

    // 8. Mark invitation as accepted
    await pool.query(
      `UPDATE public.invitations SET status = 'accepted' WHERE id = $1;`,
      [invitation.id]
    );

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
