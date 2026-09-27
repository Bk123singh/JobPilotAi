const { z } = require('zod');

const createCompanySchema = z.object({
  name: z.string().trim().min(2, 'Company name must be at least 2 characters').max(100),
  description: z.string().trim().max(2000).optional().default(''),
  website: z.string().trim().optional().default(''),
  location: z.string().trim().max(100).optional().default(''),
  industry: z.string().trim().max(60).optional().default('Technology'),
  companySize: z.string().trim().optional().default('11-50 employees'),
  logoUrl: z.string().optional().default(''),
});

const updateCompanySchema = z.object({
  name: z.string().trim().min(2, 'Company name must be at least 2 characters').max(100).optional(),
  description: z.string().trim().max(2000).optional(),
  website: z.string().trim().optional(),
  location: z.string().trim().max(100).optional(),
  industry: z.string().trim().max(60).optional(),
  companySize: z.string().trim().optional(),
  logoUrl: z.string().optional(),
});

module.exports = {
  createCompanySchema,
  updateCompanySchema,
};
