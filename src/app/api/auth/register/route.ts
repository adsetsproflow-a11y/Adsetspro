import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { registerCompanySchema } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Zod Validation
    const validation = registerCompanySchema.safeParse(body);
    if (!validation.success) {
      const err = validation.error as any;
      const message =
        err.issues?.[0]?.message || err.errors?.[0]?.message || 'Invalid input parameters.';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { companyName, fullName, email, password } = validation.data;

    // 2. Check if user email already exists in profiles
    const { data: existingUser } = await adminClient
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email address already exists.' },
        { status: 409 }
      );
    }

    // 3. Generate unique company slug using database function or helper
    const baseSlug = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'company';

    let uniqueSlug = baseSlug;
    let counter = 1;
    while (true) {
      const { data: existingCompany } = await adminClient
        .from('companies')
        .select('id')
        .eq('slug', uniqueSlug)
        .maybeSingle();

      if (!existingCompany) break;
      uniqueSlug = `${baseSlug}-${counter++}`;
    }

    // 4. Create user in Supabase Auth via Admin Client
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true, // auto-confirm for administrative creation
      user_metadata: {
        full_name: fullName.trim(),
      },
    });

    if (authError || !authUser?.user) {
      return NextResponse.json(
        { error: authError?.message || 'Failed to create user authentication account.' },
        { status: 400 }
      );
    }

    const userId = authUser.user.id;

    // 5. Create Profile Record
    const { error: profileError } = await adminClient.from('profiles').upsert({
      id: userId,
      full_name: fullName.trim(),
      email: email.toLowerCase().trim(),
      is_super_admin: false,
      account_status: 'active',
    });

    if (profileError) {
      console.error('Error creating profile:', profileError);
    }

    // 6. Create Company with status 'pending'
    const { data: company, error: companyError } = await adminClient
      .from('companies')
      .insert({
        name: companyName.trim(),
        slug: uniqueSlug,
        status: 'pending',
        created_by: userId,
      })
      .select()
      .single();

    if (companyError || !company) {
      console.error('Error creating company:', companyError);
      return NextResponse.json(
        { error: companyError?.message || 'Failed to initialize organization workspace.' },
        { status: 500 }
      );
    }

    // 7. Create Company Membership with role 'COMPANY_ADMIN'
    const { error: membershipError } = await adminClient.from('company_memberships').insert({
      user_id: userId,
      company_id: company.id,
      role: 'COMPANY_ADMIN',
      status: 'active',
    });

    if (membershipError) {
      console.error('Error creating company membership:', membershipError);
    }

    // 8. Create Notification for Super Admin
    const { data: superAdmins } = await adminClient
      .from('profiles')
      .select('id')
      .eq('is_super_admin', true);

    if (superAdmins && superAdmins.length > 0) {
      const notificationsToInsert = superAdmins.map((admin) => ({
        user_id: admin.id,
        company_id: company.id,
        type: 'company_registration_pending',
        title: 'New Company Pending Approval',
        body: `${companyName} registered by ${fullName} (${email}) and requires authorization.`,
        payload: {
          company_id: company.id,
          company_name: companyName,
          slug: uniqueSlug,
          creator_id: userId,
        },
      }));

      await adminClient.from('notifications').insert(notificationsToInsert as any);
    }

    // 9. Write to Audit Logs
    await adminClient.from('audit_logs').insert({
      actor_id: userId,
      company_id: company.id,
      action: 'COMPANY_REGISTERED',
      target_id: company.id,
      target_type: 'company',
      details: {
        name: companyName,
        slug: uniqueSlug,
        status: 'pending',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Company registered successfully. Account is pending administrator review.',
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug,
        status: company.status,
      },
    });
  } catch (error: any) {
    console.error('Registration route error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected internal error occurred.' },
      { status: 500 }
    );
  }
}
