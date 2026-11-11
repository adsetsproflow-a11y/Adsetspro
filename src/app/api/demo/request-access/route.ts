import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';

// Email validation regex (RFC 5322 compliant)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/;

// Common disposable/dummy email domains
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

// Strict phone number validation
function validatePhone(phone: string): { valid: boolean; formatted: string; reason?: string } {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, formatted: '', reason: 'Phone number is required.' };
  }

  const cleaned = phone.replace(/[^\d+]/g, '');
  const digitsOnly = phone.replace(/\D/g, '');

  if (digitsOnly.length < 10) {
    return { valid: false, formatted: '', reason: 'Phone number must have at least 10 digits.' };
  }

  if (digitsOnly.length > 15) {
    return { valid: false, formatted: '', reason: 'Phone number cannot exceed 15 digits.' };
  }

  // Reject repeating digits like 0000000000, 1111111111
  if (/^(\d)\1+$/.test(digitsOnly)) {
    return { valid: false, formatted: '', reason: 'Please provide a genuine, active phone number.' };
  }

  // Reject trivial sequential numbers like 1234567890
  if ('0123456789012345'.includes(digitsOnly) || '9876543210987654'.includes(digitsOnly)) {
    return { valid: false, formatted: '', reason: 'Please provide a genuine, active phone number.' };
  }

  return {
    valid: true,
    formatted: cleaned,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, email, phone, companyName, requestedRole } = body;

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
        { error: 'Please enter a valid email address (e.g. name@company.com).' },
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

    // 3. Validate Phone Number
    const phoneCheck = validatePhone(phone);
    if (!phoneCheck.valid) {
      return NextResponse.json(
        { error: phoneCheck.reason || 'Please enter a valid phone number (at least 10 digits).' },
        { status: 400 }
      );
    }

    // 4. Resolve client IP address
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : realIp || '127.0.0.1';

    // 5. Store lead into PostgreSQL
    let leadId: string | null = null;
    let syncedToSheets = false;

    const { data: insertedLead, error: insertErr } = await adminClient
      .from('demo_leads')
      .insert({
        full_name: fullName.trim(),
        email: trimmedEmail,
        phone: phoneCheck.formatted,
        company_name: (companyName || '').trim() || null,
        unlocked_role: requestedRole || 'all',
        ip_address: ipAddress,
        status: 'new',
        synced_to_sheets: false,
      })
      .select('id')
      .maybeSingle();

    if (insertErr) {
      console.warn('[DemoLeads] Database insert warning (proceeding):', insertErr.message);
    } else if (insertedLead) {
      leadId = insertedLead.id;
    }

    // 6. Forward to Google Sheets Webhook if configured
    const googleSheetsWebhookUrl =
      process.env.GOOGLE_SHEETS_WEBHOOK_URL || process.env.GOOGLE_SHEET_WEBHOOK_URL;

    if (googleSheetsWebhookUrl && googleSheetsWebhookUrl.trim()) {
      try {
        const sheetPayload = {
          timestamp: new Date().toISOString(),
          fullName: fullName.trim(),
          email: trimmedEmail,
          phone: phoneCheck.formatted,
          companyName: (companyName || '').trim() || 'Not specified',
          requestedRole: requestedRole || 'All Roles',
          ipAddress,
        };

        const sheetRes = await fetch(googleSheetsWebhookUrl.trim(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sheetPayload),
        });

        if (sheetRes.ok) {
          syncedToSheets = true;
          if (leadId) {
            await adminClient
              .from('demo_leads')
              .update({ synced_to_sheets: true })
              .eq('id', leadId);
          }
        }
      } catch (sheetErr: any) {
        console.warn('[DemoLeads] Google Sheets Webhook sync error (non-fatal):', sheetErr?.message);
      }
    }

    // 7. Prepare response and set authorization cookie
    const response = NextResponse.json({
      success: true,
      message: 'Demo access successfully unlocked! Welcome to Adsetspro Flow.',
      lead: {
        id: leadId,
        fullName: fullName.trim(),
        email: trimmedEmail,
        phone: phoneCheck.formatted,
        syncedToSheets,
      },
    });

    // 30 days unlock cookie
    response.cookies.set('demo_access_unlocked', 'true', {
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
      sameSite: 'lax',
      httpOnly: false,
    });

    return response;
  } catch (error: any) {
    console.error('Error in POST /api/demo/request-access:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process demo request' },
      { status: 500 }
    );
  }
}

// GET endpoint to list leads for platform Super Admins or verify existing demo access
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // 1. Verification check: Verify if a lead still exists in the database
    const verify = searchParams.get('verify');
    if (verify === 'true') {
      const leadId = searchParams.get('leadId');
      const leadName = searchParams.get('name');

      if (!leadId && !leadName) {
        const response = NextResponse.json({ success: true, valid: false });
        response.cookies.set('demo_access_unlocked', '', { path: '/', maxAge: 0 });
        return response;
      }

      let leadQuery = adminClient.from('demo_leads').select('id, full_name, email, status');
      if (leadId) {
        leadQuery = leadQuery.eq('id', leadId);
      } else if (leadName) {
        leadQuery = leadQuery.ilike('full_name', leadName.trim());
      }

      const { data: lead } = await leadQuery.maybeSingle();

      if (!lead) {
        // Lead was deleted from database! Invalidate access and expire cookie
        const response = NextResponse.json({
          success: true,
          valid: false,
          reason: 'Lead record no longer exists.',
        });
        response.cookies.set('demo_access_unlocked', '', { path: '/', maxAge: 0 });
        return response;
      }

      return NextResponse.json({
        success: true,
        valid: true,
        lead: {
          id: lead.id,
          fullName: lead.full_name,
          email: lead.email,
          status: lead.status,
        },
      });
    }

    // 2. Super Admin leads list query
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';

    let query = adminClient
      .from('demo_leads')
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

    const { data: leads, error } = await query.limit(200);

    if (error) throw error;

    return NextResponse.json({ success: true, leads: leads || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH endpoint to update lead status (e.g. new, contacted, qualified, converted)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing lead id or status' }, { status: 400 });
    }

    const { data: updated, error } = await adminClient
      .from('demo_leads')
      .update({ status })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, lead: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE endpoint to remove a lead or all leads
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const all = searchParams.get('all');

    if (all === 'true') {
      const { error } = await adminClient.from('demo_leads').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      return NextResponse.json({ success: true, message: 'All demo leads deleted successfully' });
    }

    if (!id) {
      return NextResponse.json({ error: 'Missing lead id' }, { status: 400 });
    }

    const { error } = await adminClient.from('demo_leads').delete().eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Lead deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
