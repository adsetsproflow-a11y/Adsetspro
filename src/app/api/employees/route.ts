import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/jwt';
import { INITIAL_PROFILES, INITIAL_COMPANIES } from '@/lib/seed-data';
import { hashPassword } from '@/lib/password';
import { UserProfile, Designation, Department, Role } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    let token = authHeader?.replace(/^Bearer\s+/i, '');
    if (!token) {
      token = request.cookies.get('saas_auth_token')?.value;
    }

    const { searchParams } = new URL(request.url);
    const requestedCompanyId = searchParams.get('companyId');

    let profiles = INITIAL_PROFILES;

    if (token) {
      const payload = verifyJwt(token);
      if (payload) {
        // Multi-tenant check: non-super_admin can ONLY access their own company
        const targetCompanyId = payload.role === 'super_admin' ? (requestedCompanyId || payload.companyId) : payload.companyId;
        profiles = profiles.filter((p) => p.company_id === targetCompanyId);
      }
    } else if (requestedCompanyId) {
      profiles = profiles.filter((p) => p.company_id === requestedCompanyId);
    }

    return NextResponse.json({
      success: true,
      employees: profiles,
      count: profiles.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error fetching employees.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      companyId,
      fullName,
      email,
      password = 'admin123',
      designation = 'Developer',
      department = 'Development',
      role = 'worker',
    } = body;

    if (!companyId || !fullName || !email) {
      return NextResponse.json(
        { success: false, error: 'Company ID, Full Name, and Email are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // Check if email already exists
    if (INITIAL_PROFILES.some((p) => p.email.toLowerCase() === cleanEmail)) {
      return NextResponse.json(
        { success: false, error: 'An employee with this email already exists.' },
        { status: 409 }
      );
    }

    // Auto-generate employee ID
    const company = INITIAL_COMPANIES.find((c) => c.id === companyId);
    const subPrefix = company?.subdomain ? company.subdomain.toUpperCase().slice(0, 4) : 'CORP';
    const companyEmployees = INITIAL_PROFILES.filter((p) => p.company_id === companyId);
    const employeeId = `EMP-${subPrefix}-${String(companyEmployees.length + 1).padStart(3, '0')}`;

    const AVATARS = [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    ];

    const passHash = hashPassword(password);
    const newEmployee: UserProfile = {
      id: `user-${Date.now()}`,
      employee_id: employeeId,
      company_id: companyId,
      full_name: String(fullName).trim(),
      email: cleanEmail,
      password_hash: passHash,
      avatar_url: AVATARS[Math.floor(Math.random() * AVATARS.length)],
      role: role as Role,
      designation: designation as Designation,
      department: department as Department,
      total_xp: 100,
      current_streak: 1,
      created_at: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      employee: newEmployee,
      message: `Employee "${newEmployee.full_name}" registered with ID ${newEmployee.employee_id} and designation ${newEmployee.designation}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error creating employee.' },
      { status: 500 }
    );
  }
}
