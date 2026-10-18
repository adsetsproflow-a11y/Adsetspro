import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ companySlug: string }> }
) {
  try {
    const { companySlug } = await params;
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch company
    const { data: company, error: compErr } = await adminClient
      .from('companies')
      .select('id, name')
      .eq('slug', companySlug)
      .single();

    if (compErr || !company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // 3. Fetch designations
    const { data: designations, error: dErr } = await adminClient
      .from('designations')
      .select('id, name, created_at')
      .eq('company_id', company.id)
      .order('name', { ascending: true });

    if (dErr) throw dErr;

    // 4. Check usage counts in department_memberships and invitations
    const [{ data: memberships }, { data: invitations }] = await Promise.all([
      adminClient
        .from('department_memberships')
        .select('designation_id')
        .not('designation_id', 'is', null),
      adminClient
        .from('invitations')
        .select('designation_id')
        .eq('company_id', company.id)
        .eq('status', 'pending')
        .not('designation_id', 'is', null),
    ]);

    const usageCountMap: Record<string, number> = {};
    (memberships || []).forEach((m) => {
      if (m.designation_id) {
        usageCountMap[m.designation_id] = (usageCountMap[m.designation_id] || 0) + 1;
      }
    });
    (invitations || []).forEach((inv) => {
      if (inv.designation_id) {
        usageCountMap[inv.designation_id] = (usageCountMap[inv.designation_id] || 0) + 1;
      }
    });

    const formatted = (designations || []).map((des) => ({
      id: des.id,
      name: des.name,
      createdAt: des.created_at,
      employeeCount: usageCountMap[des.id] || 0,
      isUsed: (usageCountMap[des.id] || 0) > 0,
    }));

    return NextResponse.json({
      success: true,
      designations: formatted,
    });
  } catch (error: any) {
    console.error('Fetch designations error:', error);
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
    const { name } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Designation title is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch company
    const { data: company, error: compErr } = await adminClient
      .from('companies')
      .select('id')
      .eq('slug', companySlug)
      .single();

    if (compErr || !company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // 3. Verify admin authority
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
          { error: 'Forbidden: Admin access required to add designations' },
          { status: 403 }
        );
      }
    }

    // 4. Check if duplicate name
    const { data: existing } = await adminClient
      .from('designations')
      .select('id')
      .eq('company_id', company.id)
      .ilike('name', name.trim())
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'A designation with this title already exists in your workspace.' },
        { status: 400 }
      );
    }

    // 5. Insert designation
    const { data: created, error: insErr } = await adminClient
      .from('designations')
      .insert({
        company_id: company.id,
        name: name.trim(),
      })
      .select('*')
      .single();

    if (insErr || !created) throw insErr;

    return NextResponse.json({
      success: true,
      designation: {
        id: created.id,
        name: created.name,
        createdAt: created.created_at,
        employeeCount: 0,
        isUsed: false,
      },
      message: 'Designation added successfully.',
    });
  } catch (error: any) {
    console.error('Add designation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
