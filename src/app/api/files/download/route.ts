import { NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const path = url.searchParams.get('path');
    const isInline = url.searchParams.get('inline') === '1';

    if (!path) {
      return NextResponse.json({ error: 'File path required' }, { status: 400 });
    }

    // Find attachment by storage_path or id
    const res = await queryDb(
      `SELECT a.id, a.file_name, a.file_type, fc.file_data, fc.mime_type
       FROM public.task_attachments a
       LEFT JOIN public.task_file_contents fc ON fc.attachment_id = a.id
       WHERE a.storage_path = $1 OR a.id::text = $1
       LIMIT 1;`,
      [path]
    );

    const row = res.rows[0];
    if (!row) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    if (row.file_data) {
      const mime = row.mime_type || row.file_type || 'application/octet-stream';
      const disposition = isInline
        ? 'inline'
        : `attachment; filename="${encodeURIComponent(row.file_name)}"`;

      return new NextResponse(new Uint8Array(row.file_data), {
        status: 200,
        headers: {
          'Content-Type': mime,
          'Content-Disposition': disposition,
          'Cache-Control': isInline ? 'public, max-age=86400' : 'no-cache',
        },
      });
    }

    // Redirect to official attachment stream
    const targetUrl = new URL(`/api/files/${row.id}/download${isInline ? '?inline=1' : '?download=1'}`, request.url);
    return NextResponse.redirect(targetUrl);
  } catch (err: any) {
    console.error('GET /api/files/download error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
