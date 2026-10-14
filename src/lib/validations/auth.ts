import { z } from 'zod';

const passwordComplexity = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(100, 'Password cannot exceed 100 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const registerCompanySchema = z
  .object({
    companyName: z
      .string()
      .min(2, 'Company name must be at least 2 characters')
      .max(100, 'Company name is too long')
      .trim(),
    adminName: z
      .string()
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Full name is too long')
      .trim(),
    email: z.string().email('Please enter a valid work email address').trim().toLowerCase(),
    password: passwordComplexity,
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: 'You must accept the terms and privacy policy to continue',
    }),
    department: z.string().optional().default('Design'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address').trim().toLowerCase(),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required').trim(),
    newPassword: passwordComplexity,
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordComplexity,
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

export const inviteEmployeeSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Employee full name must be at least 2 characters')
    .max(100, 'Full name is too long')
    .trim(),
  email: z.string().email('Please enter a valid employee email').trim().toLowerCase(),
  designation: z
    .string()
    .min(2, 'Designation is required')
    .max(100, 'Designation is too long')
    .trim(),
  department: z.string().optional().default('Development'),
  expiryDays: z.number().int().min(1).max(30).optional().default(7),
});

export const acceptInvitationSchema = z
  .object({
    token: z.string().min(1, 'Invitation token is required').trim(),
    fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
    password: passwordComplexity,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required').trim(),
});

export const resendVerificationSchema = z.object({
  email: z.string().email('Please enter a valid email address').trim().toLowerCase(),
});

export const companyReviewActionSchema = z.object({
  reason: z.string().max(500, 'Reason cannot exceed 500 characters').optional(),
});
