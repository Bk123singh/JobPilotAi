const { z } = require('zod');

const applyJobSchema = z.object({
  resumeId: z.string().min(1, 'Please select a resume to apply'),
  coverLetter: z.string().trim().max(3000).optional().default(''),
});

const updateStatusSchema = z.object({
  status: z.enum([
    'APPLIED',
    'UNDER_REVIEW',
    'SHORTLISTED',
    'INTERVIEW',
    'OFFER',
    'REJECTED',
    'WITHDRAWN',
  ]),
  reason: z.string().trim().max(500).optional().default(''),
  notes: z.string().trim().max(2000).optional(),
});

module.exports = {
  applyJobSchema,
  updateStatusSchema,
};
