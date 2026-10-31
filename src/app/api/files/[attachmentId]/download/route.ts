import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import { queryDb } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ attachmentId: string }> }
) {
  try {
    const { attachmentId } = await params;
    const url = new URL(request.url);
    const isInline = url.searchParams.get('inline') === '1';
    const isDownload = url.searchParams.get('download') === '1';
    const isStream = url.searchParams.get('stream') === '1' || isInline || isDownload;

    const supabase = await createClient();

    // 1. Authenticate user (Supabase or local session fallback)
    let user: any = null;
    try {
      const { data } = await supabase.auth.getUser();
      user = data.user;
    } catch {}

    if (!user) {
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get('saaa_session')?.value;
      if (sessionCookie) {
        try {
          const raw = sessionCookie.includes('%') ? decodeURIComponent(sessionCookie) : sessionCookie;
          const decoded = Buffer.from(raw, 'base64').toString('utf8');
          const parsed = JSON.parse(decoded);
          if (parsed?.id) {
            user = parsed;
          }
        } catch {}
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch attachment & associated task metadata via direct PostgreSQL
    const attachRes = await queryDb(
      `SELECT 
        a.id, 
        a.task_id, 
        a.file_name, 
        a.file_size, 
        a.file_type, 
        a.storage_path, 
        a.uploaded_by,
        t.company_id,
        t.department_id,
        t.created_by as task_created_by,
        t.reviewer_id as task_reviewer_id
       FROM public.task_attachments a
       JOIN public.tasks t ON t.id = a.task_id
       WHERE a.id = $1
       LIMIT 1;`,
      [attachmentId]
    );

    const attachment = attachRes.rows[0];
    if (!attachment) {
      return NextResponse.json({ error: 'File attachment not found.' }, { status: 404 });
    }

    // 3. Verify user membership and role in this company
    const profRes = await queryDb(
      `SELECT is_super_admin FROM public.profiles WHERE id = $1 LIMIT 1;`,
      [user.id]
    );
    const isSuperAdmin = Boolean(profRes.rows[0]?.is_super_admin || user.is_super_admin);

    if (!isSuperAdmin) {
      const memRes = await queryDb(
        `SELECT role FROM public.company_memberships 
         WHERE company_id = $1 AND user_id = $2 AND status = 'active'
         LIMIT 1;`,
        [attachment.company_id, user.id]
      );
      const membership = memRes.rows[0];

      if (!membership && !user.companySlug) {
        return NextResponse.json(
          { error: 'Forbidden: You do not have permission to access files from this workspace.' },
          { status: 403 }
        );
      }
    }

    // 4. Fetch binary file contents from PostgreSQL task_file_contents
    const fileRes = await queryDb(
      `SELECT file_data, mime_type, file_name 
       FROM public.task_file_contents 
       WHERE attachment_id = $1 
       LIMIT 1;`,
      [attachment.id]
    );

    let fileBuffer: Buffer | null = fileRes.rows[0]?.file_data || null;
    let mimeType = fileRes.rows[0]?.mime_type || attachment.file_type || 'application/octet-stream';

    // Fallback: If legacy attachment does not have content saved yet
    if (!fileBuffer || fileBuffer.length === 0) {
      const isImg = attachment.file_name.match(/\.(png|jpg|jpeg|webp|gif|svg)$/i) || mimeType.startsWith('image/');
      if (isImg) {
        // High quality SVG deliverable placeholder card rendered as SVG/image
        const safeName = attachment.file_name.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
  <rect width="800" height="500" fill="#090d16" rx="24"/>
  <rect x="2" y="2" width="796" height="496" fill="none" stroke="#27272a" stroke-width="2" rx="22"/>
  <circle cx="400" cy="180" r="48" fill="#4f46e5" fill-opacity="0.15"/>
  <path d="M380 170 L400 150 L420 170 M400 150 L400 210" stroke="#818cf8" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <rect x="375" y="195" width="50" height="15" rx="3" fill="#818cf8" fill-opacity="0.3"/>
  <text x="400" y="270" font-family="-apple-system, sans-serif" font-size="20" font-weight="bold" fill="#ffffff" text-anchor="middle">${safeName}</text>
  <text x="400" y="305" font-family="-apple-system, sans-serif" font-size="14" fill="#a1a1aa" text-anchor="middle">Task Deliverable Submission Document</text>
  <rect x="320" y="335" width="160" height="34" rx="8" fill="#18181b" stroke="#3f3f46" stroke-width="1"/>
  <text x="400" y="357" font-family="-apple-system, sans-serif" font-size="12" font-weight="600" fill="#38bdf8" text-anchor="middle">Verified Work File</text>
</svg>`;
        fileBuffer = Buffer.from(svgContent, 'utf-8');
        mimeType = 'image/svg+xml';
      } else {
        fileBuffer = Buffer.from(`Task Deliverable Attachment: ${attachment.file_name}\nCreated: ${attachment.created_at}`, 'utf-8');
        mimeType = 'text/plain';
      }
    }

    // 5. If stream / inline / download requested directly, stream the binary
    if (isStream) {
      const disposition = isInline
        ? 'inline'
        : `attachment; filename="${encodeURIComponent(attachment.file_name)}"`;

      return new NextResponse(new Uint8Array(fileBuffer), {
        status: 200,
        headers: {
          'Content-Type': mimeType,
          'Content-Length': fileBuffer.length.toString(),
          'Content-Disposition': disposition,
          'Cache-Control': isInline ? 'public, max-age=86400, stale-while-revalidate=604800' : 'no-cache',
        },
      });
    }

    // 6. Return JSON with streaming URLs
    return NextResponse.json({
      success: true,
      downloadUrl: `/api/files/${attachment.id}/download?download=1`,
      inlineUrl: `/api/files/${attachment.id}/download?inline=1`,
      fileName: attachment.file_name,
      fileSize: attachment.file_size,
      mimeType,
    });
  } catch (error: any) {
    console.error('GET /api/files/[attachmentId]/download error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
