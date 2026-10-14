import { UserProfile, Company, Role, Department, Designation } from './types';
import { saasStore } from './storage';

export async function hashPassword(password: string): Promise<string> {
  if (typeof window === 'undefined') return password;
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export interface AuthSession {
  user: UserProfile;
  company: Company | null; // null if platform owner / super admin
  token: string;
}

const SESSION_KEY = 'adsetspro_auth_session';

export class AuthService {
  private static instance: AuthService;

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  public getSession(): AuthSession | null {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem(SESSION_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  public setSession(session: AuthSession | null) {
    if (typeof window === 'undefined') return;
    if (session) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      saasStore.setActiveUserId(session.user.id);
      if (session.company) {
        saasStore.setActiveCompanyId(session.company.id);
      }
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }

  public async login(email: string, password: string): Promise<{ success: boolean; error?: string; session?: AuthSession }> {
    const profiles = saasStore.getProfiles();
    const user = profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return { success: false, error: 'User with this email not found.' };
    }

    const hashedInput = await hashPassword(password);
    // Allow default password "admin123" or matching hash
    const isPasswordCorrect =
      !user.password_hash ||
      user.password_hash === hashedInput ||
      password === 'admin123' ||
      password === 'password';

    if (!isPasswordCorrect) {
      return { success: false, error: 'Incorrect password. Try "admin123"' };
    }

    // Check company status if user is not super_admin
    const companies = saasStore.getCompanies();
    const company = companies.find((c) => c.id === user.company_id) || null;

    if (user.role !== 'super_admin' && company && !company.is_active) {
      return {
        success: false,
        error: `Your company workspace (${company.name}) has been deactivated by Adsetspro SaaS. Payment or reactivation required.`,
      };
    }

    const token = `jwt_${btoa(`${user.id}:${Date.now()}`)}`;
    const session: AuthSession = { user, company, token };
    this.setSession(session);

    return { success: true, session };
  }

  public async registerCompany(params: {
    companyName: string;
    subdomain: string;
    adminName: string;
    email: string;
    password: string;
    department?: Department;
  }): Promise<{ success: boolean; error?: string; company?: Company; user?: UserProfile }> {
    const cleanSubdomain = params.subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
    const companies = saasStore.getCompanies();

    if (companies.some((c) => c.subdomain.toLowerCase() === cleanSubdomain)) {
      return { success: false, error: `Subdomain "${cleanSubdomain}" is already registered. Please choose another.` };
    }

    const profiles = saasStore.getProfiles();
    if (profiles.some((p) => p.email.toLowerCase() === params.email.toLowerCase())) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    // 1. Create company (Default Active)
    const newCompany = saasStore.addCompany({
      name: params.companyName.trim(),
      subdomain: cleanSubdomain,
      plan: 'pro',
      max_users: 25,
      storage_limit_mb: 5000,
      is_active: true,
      mrr: 2400,
    });

    // 2. Create Company Admin user
    const passwordHash = await hashPassword(params.password);
    const AVATAR_POOL = [
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
    const newAdmin: UserProfile = {
      id: `user-${Date.now()}`,
      employee_id: `EMP-${cleanSubdomain.toUpperCase().slice(0, 4)}-001`,
      company_id: newCompany.id,
      full_name: params.adminName.trim(),
      email: params.email.trim().toLowerCase(),
      password_hash: passwordHash,
      avatar_url: AVATAR_POOL[Math.floor(Math.random() * AVATAR_POOL.length)],
      role: 'company_admin',
      designation: 'Company CEO',
      department: params.department || 'Design',
      total_xp: 500,
      current_streak: 1,
      created_at: new Date().toISOString(),
    };

    saasStore.addProfile(newAdmin);

    // Create session
    const token = `jwt_${btoa(`${newAdmin.id}:${Date.now()}`)}`;
    this.setSession({ user: newAdmin, company: newCompany, token });

    return { success: true, company: newCompany, user: newAdmin };
  }

  public async addEmployee(params: {
    companyId: string;
    fullName: string;
    email: string;
    password?: string;
    department: Department;
    role: Role;
    designation?: Designation;
  }): Promise<{ success: boolean; error?: string; user?: UserProfile }> {
    const profiles = saasStore.getProfiles();
    if (profiles.some((p) => p.email.toLowerCase() === params.email.toLowerCase())) {
      return { success: false, error: 'An employee with this email already exists.' };
    }

    const company = saasStore.getCompanies().find((c) => c.id === params.companyId);
    const companyProfiles = profiles.filter((p) => p.company_id === params.companyId);
    const subPrefix = company?.subdomain ? company.subdomain.toUpperCase().slice(0, 4) : 'CORP';
    const employeeId = `EMP-${subPrefix}-${String(companyProfiles.length + 1).padStart(3, '0')}`;

    const AVATAR_POOL = [
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

    const passwordHash = await hashPassword(params.password || 'admin123');
    const newEmployee: UserProfile = {
      id: `user-${Date.now()}`,
      employee_id: employeeId,
      company_id: params.companyId,
      full_name: params.fullName.trim(),
      email: params.email.trim().toLowerCase(),
      password_hash: passwordHash,
      avatar_url: AVATAR_POOL[Math.floor(Math.random() * AVATAR_POOL.length)],
      role: params.role || 'worker',
      designation: params.designation || 'Developer',
      department: params.department || 'Development',
      total_xp: 100,
      current_streak: 1,
      created_at: new Date().toISOString(),
    };

    saasStore.addProfile(newEmployee);
    return { success: true, user: newEmployee };
  }

  public async resetPassword(email: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    const profiles = saasStore.getProfiles();
    const user = profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return { success: false, error: 'No account found with this email address.' };
    }

    const newHash = await hashPassword(newPassword);
    const updatedProfiles = profiles.map((p) => (p.id === user.id ? { ...p, password_hash: newHash } : p));
    saasStore['setItem']('saas_pm_profiles', updatedProfiles);

    return { success: true };
  }

  public logout() {
    this.setSession(null);
  }
}

export const authService = AuthService.getInstance();
