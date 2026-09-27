const { z } = require('zod');

const educationItemSchema = z.object({
  id: z.string().optional(),
  institution: z.string().trim().min(1, 'Institution is required'),
  degree: z.string().trim().min(1, 'Degree is required'),
  fieldOfStudy: z.string().trim().optional().default(''),
  startDate: z.string().optional().default(''),
  endDate: z.string().optional().default(''),
  current: z.boolean().optional().default(false),
  description: z.string().optional().default(''),
});

const experienceItemSchema = z.object({
  id: z.string().optional(),
  company: z.string().trim().min(1, 'Company is required'),
  title: z.string().trim().min(1, 'Job title is required'),
  location: z.string().optional().default(''),
  startDate: z.string().optional().default(''),
  endDate: z.string().optional().default(''),
  current: z.boolean().optional().default(false),
  description: z.string().optional().default(''),
});

const projectItemSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1, 'Project title is required'),
  description: z.string().optional().default(''),
  url: z.string().optional().default(''),
  technologies: z.array(z.string()).optional().default([]),
});

const certificationItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, 'Certification name is required'),
  issuer: z.string().trim().min(1, 'Issuer is required'),
  issueDate: z.string().optional().default(''),
  url: z.string().optional().default(''),
});

const careerPreferencesSchema = z.object({
  desiredRoles: z.array(z.string()).optional().default([]),
  preferredLocations: z.array(z.string()).optional().default([]),
  remotePreference: z.enum(['REMOTE', 'HYBRID', 'ONSITE', 'ANY']).optional().default('ANY'),
  minExpectedSalary: z.number().optional().default(0),
  currency: z.string().optional().default('USD'),
});

const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').optional(),
  headline: z.string().trim().max(160, 'Headline must be under 160 characters').optional().nullable(),
  phone: z.string().trim().max(25).optional().nullable(),
  location: z.string().trim().max(100).optional().nullable(),
  bio: z.string().trim().max(1000, 'Bio must be under 1000 characters').optional().nullable(),
  website: z.string().trim().optional().nullable(),
  githubUrl: z.string().trim().optional().nullable(),
  linkedinUrl: z.string().trim().optional().nullable(),
  skills: z.array(z.string().trim()).optional(),
  education: z.array(educationItemSchema).optional(),
  experience: z.array(experienceItemSchema).optional(),
  projects: z.array(projectItemSchema).optional(),
  certifications: z.array(certificationItemSchema).optional(),
  careerPreferences: careerPreferencesSchema.optional(),
});

module.exports = {
  updateProfileSchema,
};
