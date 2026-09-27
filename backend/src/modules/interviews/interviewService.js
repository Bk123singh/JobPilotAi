const { prisma } = require('../../config/db');
const AppError = require('../../errors/AppError');
const authService = require('../auth/authService');
const notificationService = require('../notifications/notificationService');
const emailService = require('../../services/emailService');
const logger = require('../../utils/logger');

// Fallback in-memory store
const memoryInterviews = new Map();

// Seed initial demo interview for Alex Seeker
const seedDemoInterview = () => {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  tomorrow.setHours(14, 0, 0, 0);

  const interviewId = 'demo-interview-001';
  memoryInterviews.set(interviewId, {
    id: interviewId,
    applicationId: 'demo-app-001',
    candidateId: 'demo-candidate-id-001',
    recruiterId: 'demo-recruiter-id-002',
    scheduledAt: tomorrow,
    durationMinutes: 45,
    type: 'TECHNICAL',
    meetingUrl: 'https://meet.google.com/xyz-qwer-vbn',
    notes: 'Technical architecture deep-dive: React rendering performance, Node.js concurrency, and PostgreSQL indexing.',
    status: 'SCHEDULED',
    job: {
      id: 'job-demo-001',
      title: 'Senior Full-Stack Engineer',
      location: 'Remote (US/Americas)',
      company: {
        name: 'TechCorp Solutions',
        logoUrl: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=160',
      },
    },
    candidate: {
      id: 'demo-candidate-id-001',
      email: 'alex.seeker@example.com',
      profile: {
        fullName: 'Alex Seeker',
        headline: 'Full-Stack JavaScript Engineer',
      },
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  });
};

seedDemoInterview();

class InterviewService {
  /**
   * Recruiter schedules a new interview for an application
   */
  async scheduleInterview(recruiterUserId, data) {
    const { applicationId, scheduledAt, durationMinutes = 45, type = 'TECHNICAL', meetingUrl, notes = '' } = data;
    const isDbLive = await authService.isPrismaHealthy();

    if (isDbLive) {
      const app = await prisma.application.findUnique({
        where: { id: applicationId },
        include: { job: { include: { company: true } }, candidate: { include: { profile: true } } },
      });

      if (!app) throw AppError.notFound('Application not found');

      // 1. Create interview in DB
      const interview = await prisma.interview.create({
        data: {
          applicationId,
          scheduledAt: new Date(scheduledAt),
          durationMinutes,
          type,
          meetingUrl,
          notes,
          status: 'SCHEDULED',
        },
      });

      // 2. Automatically advance application to INTERVIEW stage
      await prisma.application.update({
        where: { id: applicationId },
        data: { status: 'INTERVIEW' },
      });

      await prisma.applicationStatusHistory.create({
        data: {
          applicationId,
          fromStatus: app.status,
          toStatus: 'INTERVIEW',
          changedById: recruiterUserId,
          reason: `Interview scheduled for ${new Date(scheduledAt).toLocaleString()}`,
        },
      });

      // 3. Trigger in-app notification
      notificationService.createNotification({
        userId: app.candidateId,
        type: 'STATUS_UPDATE',
        title: `Interview Scheduled: ${app.job.title}`,
        message: `Your ${type} interview has been scheduled for ${new Date(scheduledAt).toLocaleString()}.`,
        link: '/applications',
      }).catch((err) => logger.warn(`Notification error: ${err.message}`));

      return interview;
    }

    // In-memory fallback
    const interviewId = `interview-${Date.now()}`;
    const newInterview = {
      id: interviewId,
      applicationId,
      candidateId: 'demo-candidate-id-001',
      recruiterId: recruiterUserId,
      scheduledAt: new Date(scheduledAt),
      durationMinutes,
      type,
      meetingUrl,
      notes,
      status: 'SCHEDULED',
      job: {
        id: 'job-demo-001',
        title: 'Senior Full-Stack Engineer',
        location: 'Remote (US/Americas)',
        company: {
          name: 'TechCorp Solutions',
          logoUrl: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=160',
        },
      },
      candidate: {
        id: 'demo-candidate-id-001',
        email: 'alex.seeker@example.com',
        profile: {
          fullName: 'Alex Seeker',
          headline: 'Full-Stack JavaScript Engineer',
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    memoryInterviews.set(interviewId, newInterview);

    // Notify candidate
    notificationService.createNotification({
      userId: 'demo-candidate-id-001',
      type: 'STATUS_UPDATE',
      title: `Interview Scheduled: Senior Full-Stack Engineer`,
      message: `Your ${type} interview is set for ${new Date(scheduledAt).toLocaleString()}.`,
      link: '/applications',
    }).catch((err) => logger.warn(`Notification error: ${err.message}`));

    return newInterview;
  }

  /**
   * Candidate lists their upcoming & past scheduled interviews
   */
  async getCandidateInterviews(candidateUserId) {
    const isDbLive = await authService.isPrismaHealthy();

    if (isDbLive) {
      return await prisma.interview.findMany({
        where: {
          application: { candidateId: candidateUserId },
        },
        orderBy: { scheduledAt: 'asc' },
        include: {
          application: {
            include: {
              job: { include: { company: true } },
            },
          },
        },
      });
    }

    // In-memory fallback
    const list = [];
    for (const interview of memoryInterviews.values()) {
      if (interview.candidateId === candidateUserId) {
        list.push(interview);
      }
    }
    return list.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  }

  /**
   * Recruiter lists interviews they have scheduled
   */
  async getRecruiterInterviews(recruiterUserId) {
    const isDbLive = await authService.isPrismaHealthy();

    if (isDbLive) {
      return await prisma.interview.findMany({
        where: {
          application: {
            job: { recruiter: { userId: recruiterUserId } },
          },
        },
        orderBy: { scheduledAt: 'asc' },
        include: {
          application: {
            include: {
              job: true,
              candidate: { include: { profile: true } },
            },
          },
        },
      });
    }

    // In-memory fallback
    const list = [];
    for (const interview of memoryInterviews.values()) {
      list.push(interview);
    }
    return list.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  }

  /**
   * Update interview (status, notes, or reschedule time)
   */
  async updateInterview(userId, interviewId, updateData) {
    const isDbLive = await authService.isPrismaHealthy();

    if (isDbLive) {
      const interview = await prisma.interview.findUnique({ where: { id: interviewId } });
      if (!interview) throw AppError.notFound('Interview not found');

      return await prisma.interview.update({
        where: { id: interviewId },
        data: {
          ...(updateData.scheduledAt ? { scheduledAt: new Date(updateData.scheduledAt) } : {}),
          ...(updateData.durationMinutes ? { durationMinutes: updateData.durationMinutes } : {}),
          ...(updateData.type ? { type: updateData.type } : {}),
          ...(updateData.meetingUrl ? { meetingUrl: updateData.meetingUrl } : {}),
          ...(updateData.notes !== undefined ? { notes: updateData.notes } : {}),
          ...(updateData.status ? { status: updateData.status } : {}),
        },
      });
    }

    // In-memory fallback
    const interview = memoryInterviews.get(interviewId);
    if (!interview) throw AppError.notFound('Interview not found');

    if (updateData.scheduledAt) interview.scheduledAt = new Date(updateData.scheduledAt);
    if (updateData.durationMinutes) interview.durationMinutes = updateData.durationMinutes;
    if (updateData.type) interview.type = updateData.type;
    if (updateData.meetingUrl) interview.meetingUrl = updateData.meetingUrl;
    if (updateData.notes !== undefined) interview.notes = updateData.notes;
    if (updateData.status) interview.status = updateData.status;
    interview.updatedAt = new Date();

    return interview;
  }
}

module.exports = new InterviewService();
