const { z } = require('zod');

const createAlertSchema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters').max(100),
  keywords: z.union([
    z.string().trim().min(1),
    z.array(z.string().trim()).min(1),
  ]),
  location: z.string().trim().max(100).optional().nullable(),
  workplaceType: z
    .enum(['REMOTE', 'HYBRID', 'ONSITE', ''])
    .optional()
    .nullable(),
  minSalary: z.number().int().min(0).optional().nullable(),
  frequency: z.enum(['DAILY', 'WEEKLY', 'INSTANT']).default('DAILY'),
  minMatchScore: z.number().int().min(50).max(100).default(70),
});

const updateAlertSchema = z.object({
  title: z.string().trim().min(2).max(100).optional(),
  keywords: z.union([
    z.string().trim().min(1),
    z.array(z.string().trim()).min(1),
  ]).optional(),
  location: z.string().trim().max(100).optional().nullable(),
  workplaceType: z
    .enum(['REMOTE', 'HYBRID', 'ONSITE', ''])
    .optional()
    .nullable(),
  minSalary: z.number().int().min(0).optional().nullable(),
  frequency: z.enum(['DAILY', 'WEEKLY', 'INSTANT']).optional(),
  minMatchScore: z.number().int().min(50).max(100).optional(),
  isActive: z.boolean().optional(),
});

const updatePreferencesSchema = z.object({
  emailNotifications: z.boolean().optional(),
  matchAlerts: z.boolean().optional(),
  applicationUpdates: z.boolean().optional(),
  interviewReminders: z.boolean().optional(),
  minMatchScore: z.number().int().min(50).max(100).optional(),
});

module.exports = {
  createAlertSchema,
  updateAlertSchema,
  updatePreferencesSchema,
};
