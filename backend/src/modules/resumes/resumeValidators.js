const { z } = require('zod');

const createResumeSchema = z.object({
  title: z.string().trim().min(2, 'Resume title must be at least 2 characters').max(100),
  visibility: z.enum(['PRIVATE', 'APPLICATION_ONLY', 'RECRUITER_VISIBLE']).optional().default('APPLICATION_ONLY'),
  fileUrl: z.string().optional(),
  fileSize: z.number().optional(),
  fileType: z.string().optional(),
  rawText: z.string().optional(),
  isPrimary: z.boolean().optional(),
  autoFillProfile: z.boolean().optional(),
  strategy: z.enum(['MERGE', 'REPLACE']).optional().default('MERGE'),
});

const updateResumeSchema = z.object({
  title: z.string().trim().min(2, 'Resume title must be at least 2 characters').max(100).optional(),
  visibility: z.enum(['PRIVATE', 'APPLICATION_ONLY', 'RECRUITER_VISIBLE']).optional(),
  isPrimary: z.boolean().optional(),
});

const parseResumeSchema = z.object({
  fileUrl: z.string().optional(),
  rawText: z.string().optional(),
  fileType: z.string().optional(),
  title: z.string().optional(),
});

const autofillResumeSchema = z.object({
  strategy: z.enum(['MERGE', 'REPLACE']).optional().default('MERGE'),
});

module.exports = {
  createResumeSchema,
  updateResumeSchema,
  parseResumeSchema,
  autofillResumeSchema,
};
