import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getDbPool } from '@/lib/db';

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/;

const DISPOSABLE_DOMAINS = [
  'tempmail.com',
  'mailinator.com',
  '10minutemail.com',
  'guerrillamail.com',
  'throwawaymail.com',
  'yopmail.com',
  'sharklasers.com',
  'dispostable.com',
  'trashmail.com',
  'fakeinbox.com',
  'test.com',
  'example.com',
];

function validatePhone(phone: string): { valid: boolean; formatted: string; reason?: string } {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, formatted: '', reason: 'Phone number is required.' };
  }

  const raw = phone.trim();
  if (raw.includes('+')) {
    return { valid: false, formatted: '', reason: 'Please enter only your 10-digit phone number without +91 or country code.' };
  }

  const digitsOnly = raw.replace(/\D/g, '');

  if (digitsOnly.length !== 10) {
    return { valid: false, formatted: '', reason: 'Please enter a valid 10-digit phone number.' };
  }

  if (!/^[6-9]\d{9}$/.test(digitsOnly)) {
    return { valid: false, formatted: '', reason: 'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.' };
  }

  // Reject repeating digits like 0000000000, 1111111111, 9999999999
  if (/^(\d)\1+$/.test(digitsOnly)) {
    return { valid: false, formatted: '', reason: 'Please provide a genuine, active phone number.' };
  }

  // Reject trivial sequential numbers like 1234567890
  if ('0123456789012345'.includes(digitsOnly) || '9876543210987654'.includes(digitsOnly)) {
    return { valid: false, formatted: '', reason: 'Please provide a genuine, active phone number.' };
  }

  return {
    valid: true,
    formatted: digitsOnly,
  };
}

// POST: Public submission from /contact page
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, email, phone, companyName, message } = body;

    // 1. Validate Full Name
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      return NextResponse.json(
        { error: 'Please enter your full name (minimum 2 characters).' },
        { status: 400 }
      );
    }

    // 2. Validate Email
    const trimmedEmail = (email || '').trim().toLowerCase();
    if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
      return NextResponse.json(
        { error: 'Please enter a valid work email address.' },
        { status: 400 }
      );
    }

    const domain = trimmedEmail.split('@')[1];
    if (!domain || DISPOSABLE_DOMAINS.includes(domain) || !domain.includes('.')) {
      return NextResponse.json(
        { error: 'Please provide a valid permanent business or personal email address.' },
        { status: 400 }
      );
    }

    // 3. Validate Phone Number (Strict 10 digits only, no +91)
    const phoneCheck = validatePhone(phone);
    if (!phoneCheck.valid) {
      return NextResponse.json(
        { error: phoneCheck.reason || 'Please enter a valid 10-digit phone number.' },
        { status: 400 }
      );
    }

    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // 4. Insert into contact_submissions table
    const { data: inserted, error: insertErr } = await adminClient
      .from('contact_submissions')
      .insert({
        full_name: fullName.trim(),
        email: trimmedEmail,
        phone: phoneCheck.formatted,
        company_name: (companyName || '').trim() || null,
        message: (message || '').trim() || null,
        status: 'new',
        ip_address: ipAddress,
      })
      .select('id')
      .maybeSingle();

    if (insertErr) {
      console.error('[ContactSubmissions] Insert error:', insertErr);
      return NextResponse.json(
        { error: 'Failed to record your message. Please try again.' },
        { status: 500 }
      );
    }

    // 5. Forward to Google Sheets Webhook if configured
    const googleSheetsWebhookUrl =
      process.env.GOOGLE_SHEETS_WEBHOOK_URL || process.env.GOOGLE_SHEET_WEBHOOK_URL;

    if (googleSheetsWebhookUrl && googleSheetsWebhookUrl.trim()) {
      try {
        const sheetPayload = {
          type: 'contact_enquiry',
          timestamp: new Date().toISOString(),
          fullName: fullName.trim(),
          email: trimmedEmail,
          phone: phoneCheck.formatted,
          companyName: (companyName || '').trim() || 'Not specified',
          message: (message || '').trim() || 'No message provided',
          ipAddress,
        };

        await fetch(googleSheetsWebhookUrl.trim(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sheetPayload),
        }).catch(() => {});
      } catch {}
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you for reaching out! Our enterprise team will get in touch with you shortly.',
      id: inserted?.id,
    });
  } catch (error: any) {
    console.error('Error in POST /api/contact:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET: Super Admin query to list contact submissions
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = getDbPool();
    const profRes = await pool.query(
      `SELECT is_super_admin FROM public.profiles WHERE id = $1 LIMIT 1;`,
      [user.id]
    );

    if (!profRes.rows[0]?.is_super_admin) {
      return NextResponse.json({ error: 'Forbidden: Super Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';

    let query = adminClient
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search.trim()) {
      query = query.or(
        `full_name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%,phone.ilike.%${search.trim()}%,company_name.ilike.%${search.trim()}%`
      );
    }

    const { data: submissions, error } = await query.limit(200);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      submissions: submissions || [],
    });
  } catch (error: any) {
    console.error('Error in GET /api/contact:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH: Super Admin update status
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = getDbPool();
    const profRes = await pool.query(
      `SELECT is_super_admin FROM public.profiles WHERE id = $1 LIMIT 1;`,
      [user.id]
    );

    if (!profRes.rows[0]?.is_super_admin) {
      return NextResponse.json({ error: 'Forbidden: Super Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
    }

    const { data: updated, error } = await adminClient
      .from('contact_submissions')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, submission: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Super Admin delete submission or delete all
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = getDbPool();
    const profRes = await pool.query(
      `SELECT is_super_admin FROM public.profiles WHERE id = $1 LIMIT 1;`,
      [user.id]
    );

    if (!profRes.rows[0]?.is_super_admin) {
      return NextResponse.json({ error: 'Forbidden: Super Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const all = searchParams.get('all');

    if (all === 'true') {
      const { error } = await adminClient
        .from('contact_submissions')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      return NextResponse.json({ success: true, message: 'All contact submissions deleted successfully' });
    }

    if (!id) {
      return NextResponse.json({ error: 'Missing submission id' }, { status: 400 });
    }

    const { error } = await adminClient.from('contact_submissions').delete().eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Contact submission deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

