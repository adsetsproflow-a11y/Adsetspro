export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  COMPANY_ADMIN: 'COMPANY_ADMIN',
  DEPARTMENT_HEAD: 'DEPARTMENT_HEAD',
  EMPLOYEE: 'EMPLOYEE',
} as const;

export type RoleType = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<RoleType, string> = {
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.COMPANY_ADMIN]: 'Company Admin',
  [ROLES.DEPARTMENT_HEAD]: 'Department Head',
  [ROLES.EMPLOYEE]: 'Employee',
};

export const ROLE_DESCRIPTIONS: Record<RoleType, string> = {
  [ROLES.SUPER_ADMIN]: 'Platform owner with full system access across all tenant companies.',
  [ROLES.COMPANY_ADMIN]: 'Organization administrator overseeing company settings, departments, members, and projects.',
  [ROLES.DEPARTMENT_HEAD]: 'Department leader managing assigned team members, department tasks, and reviews.',
  [ROLES.EMPLOYEE]: 'Individual contributor focused on personal tasks, submissions, and collaboration.',
};
