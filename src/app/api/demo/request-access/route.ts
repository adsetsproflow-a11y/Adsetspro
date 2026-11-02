import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';

// Email validation regex (RFC 5322 compliant simple form)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/;

// Phone number validation: strips spaces/symbols, expects at least 10 digits
function validatePhone(phone: string): { valid: boolean; formatted: string } {
  if (!phone || typeof phone !== 'string') return { valid: false, formatted: '' };
  const cleaned = phone.replace(/[^\d+]/g, '');
  const digitsOnly = phone.replace(/\D/g, '');
  return {
    valid: digitsOnly.length >= 10 && digitsOnly.length <= 15,
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
        { error: 'Please enter a valid business email address (e.g. name@company.com).' },
        { status: 400 }
      );
    }

    // 3. Validate Phone Number
    const phoneCheck = validatePhone(phone);
    if (!phoneCheck.valid) {
      return NextResponse.json(
        { error: 'Please enter a valid phone number (at least 10 digits).' },
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
        fullName: fullName.trim(),
        email: trimmedEmail,
        syncedToSheets,
      },
    });

    // 30 days unlock cookie
    response.cookies.set('demo_access_unlocked', 'true', {
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
      sameSite: 'lax',
      httpOnly: false, // Accessible client-side for UI toggles
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

// GET endpoint to list leads for platform Super Admins
export async function GET(request: Request) {
  try {
    const { data: leads, error } = await adminClient
      .from('demo_leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    return NextResponse.json({ success: true, leads: leads || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
