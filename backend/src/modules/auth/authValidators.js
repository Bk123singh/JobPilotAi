const { z } = require('zod');

const registerSchema = z.object({
  email: z.string().trim().email('Please provide a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters'),
  role: z.enum(['JOB_SEEKER', 'RECRUITER'], {
    errorMap: () => ({ message: 'Role must be either JOB_SEEKER or RECRUITER' }),
  }),
  companyName: z.string().trim().optional(),
});

const loginSchema = z.object({
  email: z.string().trim().email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().optional(),
});

const googleAuthSchema = z.object({
  credential: z.string().min(1, 'Google credential token is required'),
  role: z.enum(['JOB_SEEKER', 'RECRUITER']).optional().default('JOB_SEEKER'),
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Please provide a valid email address'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  googleAuthSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
