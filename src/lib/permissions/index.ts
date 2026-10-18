import { UserRole } from '@/types/app.types';
import { ROLES } from '@/config/roles';

export function canCreateTask(role?: UserRole | null): boolean {
  if (!role) return false;
  return role === ROLES.SUPER_ADMIN || role === ROLES.COMPANY_ADMIN || role === ROLES.DEPARTMENT_HEAD;
}

export function canAssignTask(role?: UserRole | null): boolean {
  if (!role) return false;
  return role === ROLES.SUPER_ADMIN || role === ROLES.COMPANY_ADMIN || role === ROLES.DEPARTMENT_HEAD;
}

export function canReviewTask(role?: UserRole | null): boolean {
  if (!role) return false;
  return role === ROLES.SUPER_ADMIN || role === ROLES.COMPANY_ADMIN || role === ROLES.DEPARTMENT_HEAD;
}

export function canManageDepartment(role?: UserRole | null): boolean {
  if (!role) return false;
  return role === ROLES.SUPER_ADMIN || role === ROLES.COMPANY_ADMIN;
}

export function canInviteEmployee(role?: UserRole | null): boolean {
  if (!role) return false;
  return role === ROLES.SUPER_ADMIN || role === ROLES.COMPANY_ADMIN;
}

export function canViewCompanyAnalytics(role?: UserRole | null): boolean {
  if (!role) return false;
  return role === ROLES.SUPER_ADMIN || role === ROLES.COMPANY_ADMIN || role === ROLES.DEPARTMENT_HEAD;
}

export function canApproveCompany(isSuperAdmin: boolean): boolean {
  return isSuperAdmin === true;
}

export function canManageSettings(role?: UserRole | null): boolean {
  if (!role) return false;
  return role === ROLES.SUPER_ADMIN || role === ROLES.COMPANY_ADMIN;
}
