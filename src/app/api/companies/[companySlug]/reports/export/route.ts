import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { queryDb } from '@/lib/db';
import { convertToCSV } from '@/lib/export/csv';
import { formatDate } from '@/lib/utils/dateFormat';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ companySlug: string }> }
) {
  try {
    const { companySlug } = await params;
    const url = new URL(request.url);
    const statusFilter = url.searchParams.get('status') || 'approved'; // Default to completed/approved tasks
    const departmentFilter = url.searchParams.get('department_id');

    const cleanSlug = decodeURIComponent(companySlug).toLowerCase().trim();
    const supabase = await createClient();

    // 1. Authenticate user
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
          if (parsed?.id) user = parsed;
        } catch {}
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch company
    const compRes = await queryDb(
      `SELECT id, name, slug FROM public.companies WHERE slug = $1 LIMIT 1;`,
      [cleanSlug]
    );
    const company = compRes.rows[0];
    if (!company) {
      return NextResponse.json({ error: 'Company workspace not found' }, { status: 404 });
    }

    // 3. Verify user membership and role
    const profRes = await queryDb(
      `SELECT is_super_admin FROM public.profiles WHERE id = $1 LIMIT 1;`,
      [user.id]
    );
    const isSuperAdmin = Boolean(profRes.rows[0]?.is_super_admin || user.is_super_admin);

    let userRole = 'EMPLOYEE';
    if (!isSuperAdmin) {
      const memRes = await queryDb(
        `SELECT role FROM public.company_memberships 
         WHERE company_id = $1 AND user_id = $2 AND status = 'active'
         LIMIT 1;`,
        [company.id, user.id]
      );
      const membership = memRes.rows[0];

      if (!membership && !user.companySlug) {
        return NextResponse.json(
          { error: 'Forbidden: Active workspace membership required.' },
          { status: 403 }
        );
      }
      userRole = membership?.role || user.role || 'EMPLOYEE';
    } else {
      userRole = 'SUPER_ADMIN';
    }

    // 4. Role Authorization: Only Company Admin and Department Head can export reports
    const isCompanyAdmin = userRole === 'COMPANY_ADMIN' || userRole === 'SUPER_ADMIN';
    const isDeptHead = userRole === 'DEPARTMENT_HEAD';

    if (!isCompanyAdmin && !isDeptHead) {
      return NextResponse.json(
        { error: 'Forbidden: Report exports are reserved for Company Administrators and Department Heads.' },
        { status: 403 }
      );
    }

    // 5. Build Scoped Query
    // Parameters array
    const queryParams: any[] = [company.id];
    let whereClauses: string[] = [`t.company_id = $1`];

    // Status filtering: 'approved' (finished), 'all', or comma-separated list
    if (statusFilter && statusFilter !== 'all') {
      const statuses = statusFilter.split(',').map((s) => s.trim().toLowerCase());
      queryParams.push(statuses);
      whereClauses.push(`LOWER(t.status) = ANY($${queryParams.length})`);
    }

    // Option A Role Scoping:
    // If Department Head: strictly scope to their departments OR tasks they created/reviewed
    if (isDeptHead && !isCompanyAdmin) {
      // Find all departments where this user is the Department Head
      const headDeptsRes = await queryDb(
        `SELECT id FROM public.departments WHERE company_id = $1 AND head_user_id = $2;`,
        [company.id, user.id]
      );
      const headDeptIds = headDeptsRes.rows.map((r: any) => r.id);

      if (headDeptIds.length > 0) {
        queryParams.push(headDeptIds);
        queryParams.push(user.id);
        whereClauses.push(
          `(t.department_id = ANY($${queryParams.length - 1}) OR t.created_by = $${queryParams.length} OR t.reviewer_id = $${queryParams.length})`
        );
      } else {
        queryParams.push(user.id);
        whereClauses.push(`(t.created_by = $${queryParams.length} OR t.reviewer_id = $${queryParams.length})`);
      }
    } else if (departmentFilter && departmentFilter !== 'all') {
      // Company Admin optional department filter
      queryParams.push(departmentFilter);
      whereClauses.push(`t.department_id = $${queryParams.length}`);
    }

    // Execute Main Query joining attachments, assignees, reviewer, department
    const tasksSql = `
      SELECT 
        t.id,
        t.title,
        t.description,
        t.status,
        t.priority,
        t.created_at,
        t.updated_at,
        t.due_date,
        d.name as department_name,
        p.name as project_name,
        creator.full_name as creator_name,
        reviewer.full_name as reviewer_name,
        assignee.full_name as assignee_name,
        assignee.email as assignee_email,
        (
          SELECT string_agg(a.file_name, ' | ') 
          FROM public.task_attachments a 
          WHERE a.task_id = t.id
        ) as attachment_files,
        (
          SELECT COUNT(*)::int 
          FROM public.task_attachments a 
          WHERE a.task_id = t.id
        ) as attachment_count
      FROM public.tasks t
      LEFT JOIN public.departments d ON d.id = t.department_id
      LEFT JOIN public.projects p ON p.id = t.project_id
      LEFT JOIN public.profiles creator ON creator.id = t.created_by
      LEFT JOIN public.profiles reviewer ON reviewer.id = t.reviewer_id
      LEFT JOIN LATERAL (
        SELECT prof.full_name, prof.email
        FROM public.task_assignments ta
        JOIN public.profiles prof ON prof.id = ta.employee_id
        WHERE ta.task_id = t.id AND ta.is_current = true
        LIMIT 1
      ) assignee ON true
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY t.updated_at DESC;
    `;

    const tasksRes = await queryDb(tasksSql, queryParams);
    const rows = tasksRes.rows || [];

    // Format rows for CSV Export
    const csvData = rows.map((r: any) => ({
      taskId: r.id,
      title: r.title,
      status: (r.status || '').toUpperCase().replace(/_/g, ' '),
      priority: (r.priority || '').toUpperCase(),
      department: r.department_name || 'General / Organization-Wide',
      project: r.project_name || 'Direct Task',
      assignedEmployee: r.assignee_name ? `${r.assignee_name} (${r.assignee_email})` : 'Unassigned',
      assignedBy: r.creator_name || 'Workspace',
      reviewer: r.reviewer_name || r.creator_name || 'Not Designated',
      dueDate: r.due_date ? formatDate(r.due_date, 'short') : 'No Due Date',
      completionDate: r.status === 'approved' ? formatDate(r.updated_at, 'short') : 'In Progress',
      deliverablesAttached: r.attachment_files || 'None',
      deliverableCount: r.attachment_count || 0,
      createdAt: formatDate(r.created_at, 'long'),
    }));

    const csvHeaders = [
      { key: 'taskId', label: 'Task ID' },
      { key: 'title', label: 'Deliverable Title' },
      { key: 'status', label: 'Review Status' },
      { key: 'priority', label: 'Priority' },
      { key: 'department', label: 'Department' },
      { key: 'project', label: 'Project' },
      { key: 'assignedEmployee', label: 'Assigned Employee' },
      { key: 'assignedBy', label: 'Assigned By' },
      { key: 'reviewer', label: 'Reviewer' },
      { key: 'dueDate', label: 'Due Date' },
      { key: 'completionDate', label: 'Approved / Completion Date' },
      { key: 'deliverablesAttached', label: 'Uploaded Deliverables / Files' },
      { key: 'deliverableCount', label: 'Attachment Count' },
      { key: 'createdAt', label: 'Created At' },
    ];

    const csvString = convertToCSV(csvData, csvHeaders);
    // Prepend UTF-8 BOM so Microsoft Excel automatically recognizes UTF-8 characters and columns
    const finalCSV = '\uFEFF' + csvString;

    const fileDate = new Date().toISOString().slice(0, 10);
    const statusLabel = statusFilter === 'approved' ? 'completed_tasks' : `${statusFilter}_tasks`;
    const roleLabel = isCompanyAdmin ? 'company_admin' : 'dept_head';
    const filename = `${company.slug}_${statusLabel}_${roleLabel}_${fileDate}.csv`;

    return new NextResponse(finalCSV, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Cache-Control': 'no-cache, no-store',
      },
    });
  } catch (err: any) {
    console.error('GET /api/companies/[companySlug]/reports/export error:', err);
    return NextResponse.json({ error: 'Failed to generate report export' }, { status: 500 });
  }
}
