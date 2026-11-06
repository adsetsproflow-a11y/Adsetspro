import { z } from 'zod';

export const cleanIndianPhoneNumber = (val: string): string => {
  let digits = (val || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits;
};

export const isValidIndianPhone = (val: string): boolean => {
  const cleaned = cleanIndianPhoneNumber(val);
  return /^[6-9]\d{9}$/.test(cleaned);
};

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid work email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const registerCompanySchema = z
  .object({
    companyName: z
      .string()
      .min(2, 'Company name must be at least 2 characters')
      .max(100, 'Company name is too long'),
    fullName: z
      .string()
      .min(2, 'Full name must be at least 2 characters')
      .max(80, 'Full name is too long'),
    phone: z
      .string()
      .min(10, 'Please enter a valid 10-digit Indian phone number')
      .refine((val) => isValidIndianPhone(val), {
        message: 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210)',
      }),
    email: z.string().email('Please enter a valid business email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string(),
    termsAccepted: z.boolean().refine((val) => val === true, {
      message: 'You must agree to the Terms of Service & Privacy Policy',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const acceptInvitationSchema = z
  .object({
    token: z.string().min(1, 'Invitation token is required'),
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const departmentSchema = z.object({
  name: z.string().min(2, 'Department name is required').max(60),
  description: z.string().max(255).optional(),
});

export const inviteEmployeeSchema = z.object({
  fullName: z.string().min(2, 'Employee name is required'),
  email: z.string().email('Valid business email is required'),
  departmentId: z.string().uuid().optional().nullable(),
  designationId: z.string().uuid().optional().nullable(),
  role: z.enum(['DEPARTMENT_HEAD', 'EMPLOYEE']),
  reportingTo: z.string().uuid().optional().nullable(),
});

export const projectSchema = z.object({
  name: z.string().min(2, 'Project name is required').max(100),
  description: z.string().optional(),
  departmentId: z.string().uuid().optional().nullable(),
  managerId: z.string().uuid().optional().nullable(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  startDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

export const taskSchema = z.object({
  title: z.string().min(3, 'Task title is required').max(150),
  description: z.string().min(5, 'Description is required'),
  departmentId: z.string().uuid().optional().nullable(),
  projectId: z.string().uuid().optional().nullable(),
  assignedTo: z.string().uuid('Please select an assignee'),
  reviewerId: z.string().uuid().optional().nullable(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  startDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

export const reviewTaskSchema = z.object({
  action: z.enum(['approve', 'revision']),
  feedback: z.string().optional(),
}).refine(
  (data) => {
    if (data.action === 'revision' && (!data.feedback || data.feedback.trim().length === 0)) {
      return false;
    }
    return true;
  },
  {
    message: 'Revision feedback comments are mandatory when requesting revision',
    path: ['feedback'],
  }
);
