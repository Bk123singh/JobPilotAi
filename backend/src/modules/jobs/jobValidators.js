const { z } = require('zod');

const createJobSchema = z.object({
  title: z.string().trim().min(3, 'Job title must be at least 3 characters').max(100),
  description: z.string().trim().min(20, 'Job description must be at least 20 characters'),
  location: z.string().trim().min(2, 'Location is required'),
  jobType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP']).optional().default('FULL_TIME'),
  workplaceType: z.enum(['REMOTE', 'HYBRID', 'ONSITE']).optional().default('REMOTE'),
  minSalary: z.number().int().nonnegative().optional().nullable(),
  maxSalary: z.number().int().nonnegative().optional().nullable(),
  currency: z.string().optional().default('USD'),
  experienceLevel: z.string().optional().default('Mid-Senior Level'),
  requiredSkills: z.array(z.string().trim()).min(1, 'Please specify at least one required skill'),
  niceToHaveSkills: z.array(z.string().trim()).optional().default([]),
});

const updateJobSchema = z.object({
  title: z.string().trim().min(3).max(100).optional(),
  description: z.string().trim().min(20).optional(),
  location: z.string().trim().min(2).optional(),
  jobType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP']).optional(),
  workplaceType: z.enum(['REMOTE', 'HYBRID', 'ONSITE']).optional(),
  minSalary: z.number().int().nonnegative().optional().nullable(),
  maxSalary: z.number().int().nonnegative().optional().nullable(),
  currency: z.string().optional(),
  experienceLevel: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'CLOSED']).optional(),
  requiredSkills: z.array(z.string().trim()).optional(),
  niceToHaveSkills: z.array(z.string().trim()).optional(),
});

module.exports = {
  createJobSchema,
  updateJobSchema,
};
