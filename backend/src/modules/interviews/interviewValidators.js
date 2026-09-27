const { z } = require('zod');

const scheduleInterviewSchema = z.object({
  applicationId: z.string().min(1, 'Application ID is required'),
  scheduledAt: z.string().min(1, 'Interview date and time is required'),
  durationMinutes: z.number().int().min(15).max(180).default(45),
  type: z
    .enum(['SCREENING', 'TECHNICAL', 'BEHAVIORAL', 'FINAL', 'SYSTEM_DESIGN'])
    .default('TECHNICAL'),
  meetingUrl: z.string().trim().url('Valid meeting URL is required'),
  notes: z.string().trim().max(2000).optional().default(''),
});

const updateInterviewSchema = z.object({
  scheduledAt: z.string().optional(),
  durationMinutes: z.number().int().min(15).max(180).optional(),
  type: z
    .enum(['SCREENING', 'TECHNICAL', 'BEHAVIORAL', 'FINAL', 'SYSTEM_DESIGN'])
    .optional(),
  meetingUrl: z.string().trim().url().optional(),
  notes: z.string().trim().max(2000).optional(),
  status: z
    .enum(['SCHEDULED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED'])
    .optional(),
});

module.exports = {
  scheduleInterviewSchema,
  updateInterviewSchema,
};
