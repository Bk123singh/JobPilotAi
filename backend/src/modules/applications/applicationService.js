const { prisma } = require('../../config/db');
const AppError = require('../../errors/AppError');
const authService = require('../auth/authService');
const storageService = require('../../services/storageService');
const notificationService = require('../notifications/notificationService');
const emailService = require('../../services/emailService');
const logger = require('../../utils/logger');

// Fallback in-memory application store
const memoryApplications = new Map();
const memoryStatusHistory = [];

// Seed sample application for demo candidate Alex Seeker at TechCorp
const seedDemoApplication = () => {
  const appId = 'demo-app-001';
  const now = Date.now();

  memoryApplications.set(appId, {
    id: appId,
    jobId: 'job-demo-001',
    candidateId: 'demo-candidate-id-001',
    resumeId: 'demo-resume-001',
    status: 'SHORTLISTED',
    coverLetter:
      'I am excited to apply for the Senior Full-Stack Engineer role at TechCorp. With 5+ years of production experience in React, Node.js, and PostgreSQL, I am confident in architecting scalable agentic systems for your platform.',
    recruiterNotes: 'Candidate demonstrated exceptional full-stack knowledge and clean modular code in past portfolio projects.',
    createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(now - 12 * 60 * 60 * 1000),
  });

  memoryStatusHistory.push(
    {
      id: 'hist-1',
      applicationId: appId,
      fromStatus: null,
      toStatus: 'APPLIED',
      changedById: 'demo-candidate-id-001',
      reason: 'Initial job application submitted',
      createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'hist-2',
      applicationId: appId,
      fromStatus: 'APPLIED',
      toStatus: 'UNDER_REVIEW',
      changedById: 'demo-recruiter-id-002',
      reason: 'Application reviewed by hiring manager',
      createdAt: new Date(now - 1 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'hist-3',
      applicationId: appId,
      fromStatus: 'UNDER_REVIEW',
      toStatus: 'SHORTLISTED',
      changedById: 'demo-recruiter-id-002',
      reason: 'Strong match on required React and PostgreSQL skills',
      createdAt: new Date(now - 12 * 60 * 60 * 1000),
    }
  );
};

seedDemoApplication();

class ApplicationService {
  /**
   * Candidate applies for a job
   */
  async applyForJob(candidateId, jobId, { resumeId, coverLetter = '' }, ipAddress, userAgent) {
    const isDbLive = await authService.isPrismaHealthy();

    if (isDbLive) {
      // 1. Verify Job exists and is ACTIVE
      const job = await prisma.job.findUnique({ where: { id: jobId } });
      if (!job) throw AppError.notFound('Job not found');
      if (job.status !== 'ACTIVE') {
        throw AppError.badRequest('This job opening is no longer accepting applications');
      }

      // 2. Verify Candidate hasn't already applied
      const existing = await prisma.application.findUnique({
        where: {
          jobId_candidateId: { jobId, candidateId },
        },
      });
      if (existing) {
        throw AppError.conflict('You have already applied for this position');
      }

      // 3. Verify Resume belongs to candidate
      const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
      if (!resume || resume.userId !== candidateId) {
        throw AppError.badRequest('Invalid or unauthorized resume selection');
      }

      // 4. Create Application and Initial Status History in transaction
      return await prisma.$transaction(async (tx) => {
        const application = await tx.application.create({
          data: {
            jobId,
            candidateId,
            resumeId,
            status: 'APPLIED',
            coverLetter,
          },
          include: {
            job: { include: { company: true } },
            resume: true,
          },
        });

        await tx.applicationStatusHistory.create({
          data: {
            applicationId: application.id,
            fromStatus: null,
            toStatus: 'APPLIED',
            changedById: candidateId,
            reason: 'Application submitted by candidate',
          },
        });

        await tx.auditLog.create({
          data: {
            userId: candidateId,
            action: 'APPLICATION_SUBMITTED',
            resource: 'Application',
            resourceId: application.id,
            ipAddress,
            userAgent,
            metadata: { jobId, resumeId },
          },
        });

        return application;
      });
    }

    // In-memory fallback
    for (const app of memoryApplications.values()) {
      if (app.jobId === jobId && app.candidateId === candidateId) {
        throw AppError.conflict('You have already applied for this position');
      }
    }

    const appId = `app-${Date.now()}`;
    const newApp = {
      id: appId,
      jobId,
      candidateId,
      resumeId,
      status: 'APPLIED',
      coverLetter,
      recruiterNotes: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    memoryApplications.set(appId, newApp);
    memoryStatusHistory.push({
      id: `hist-${Date.now()}`,
      applicationId: appId,
      fromStatus: null,
      toStatus: 'APPLIED',
      changedById: candidateId,
      reason: 'Application submitted by candidate',
      createdAt: new Date(),
    });

    notificationService.createNotification({
      userId: candidateId,
      type: 'APPLICATION',
      title: 'Application Submitted',
      message: 'Your application has been received by the hiring team.',
      link: '/applications',
    }).catch((err) => logger.warn(`Notification error: ${err.message}`));

    notificationService.createNotification({
      userId: 'demo-recruiter-id-002',
      type: 'APPLICATION',
      title: 'New Candidate Applied',
      message: 'Alex Seeker submitted an application for Senior Full-Stack Engineer.',
      link: '/recruiter/applications',
    }).catch((err) => logger.warn(`Notification error: ${err.message}`));

    return newApp;
  }

  /**
   * Candidate lists their applications with timeline history
   */
  async getCandidateApplications(candidateId) {
    const isDbLive = await authService.isPrismaHealthy();

    if (isDbLive) {
      return await prisma.application.findMany({
        where: { candidateId },
        orderBy: { createdAt: 'desc' },
        include: {
          job: {
            include: { company: true },
          },
          resume: {
            select: { id: true, title: true, version: true, fileUrl: true },
          },
          statusHistory: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });
    }

    // In-memory fallback
    const apps = [];
    for (const app of memoryApplications.values()) {
      if (app.candidateId === candidateId) {
        const history = memoryStatusHistory
          .filter((h) => h.applicationId === app.id)
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        apps.push({
          ...app,
          job: {
            id: app.jobId,
            title: 'Senior Full-Stack Engineer',
            location: 'Remote (US/Americas)',
            workplaceType: 'REMOTE',
            company: {
              name: 'TechCorp Solutions',
              isVerified: true,
              logoUrl: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=160',
            },
          },
          resume: {
            id: app.resumeId,
            title: 'Senior Full-Stack Engineer Resume',
            version: 1,
            fileUrl: 'https://res.cloudinary.com/jobpilot/raw/upload/v1/jobpilot/resumes/demo_alex_seeker_resume.pdf',
          },
          statusHistory: history,
        });
      }
    }
    return apps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /**
   * Candidate gets single application details
   */
  async getCandidateApplicationById(candidateId, applicationId) {
    const isDbLive = await authService.isPrismaHealthy();

    if (isDbLive) {
      const app = await prisma.application.findUnique({
        where: { id: applicationId },
        include: {
          job: { include: { company: true } },
          resume: true,
          statusHistory: { orderBy: { createdAt: 'asc' } },
        },
      });

      if (!app || app.candidateId !== candidateId) {
        throw AppError.notFound('Application not found or unauthorized');
      }
      return app;
    }

    // In-memory fallback
    const apps = await this.getCandidateApplications(candidateId);
    const target = apps.find((a) => a.id === applicationId);
    if (!target) throw AppError.notFound('Application not found or unauthorized');
    return target;
  }

  /**
   * Candidate withdraws application
   */
  async withdrawApplication(candidateId, applicationId) {
    const isDbLive = await authService.isPrismaHealthy();

    if (isDbLive) {
      const app = await prisma.application.findUnique({ where: { id: applicationId } });
      if (!app || app.candidateId !== candidateId) {
        throw AppError.notFound('Application not found or unauthorized');
      }

      if (['OFFER', 'REJECTED', 'WITHDRAWN'].includes(app.status)) {
        throw AppError.badRequest(`Cannot withdraw an application in [${app.status}] state`);
      }

      return await prisma.$transaction(async (tx) => {
        const updated = await tx.application.update({
          where: { id: applicationId },
          data: { status: 'WITHDRAWN' },
        });

        await tx.applicationStatusHistory.create({
          data: {
            applicationId,
            fromStatus: app.status,
            toStatus: 'WITHDRAWN',
            changedById: candidateId,
            reason: 'Withdrawn by candidate',
          },
        });

        return updated;
      });
    }

    // In-memory fallback
    const app = memoryApplications.get(applicationId);
    if (!app || app.candidateId !== candidateId) {
      throw AppError.notFound('Application not found or unauthorized');
    }

    const previousStatus = app.status;
    app.status = 'WITHDRAWN';
    app.updatedAt = new Date();

    memoryStatusHistory.push({
      id: `hist-${Date.now()}`,
      applicationId,
      fromStatus: previousStatus,
      toStatus: 'WITHDRAWN',
      changedById: candidateId,
      reason: 'Withdrawn by candidate',
      createdAt: new Date(),
    });

    return app;
  }

  /**
   * Recruiter lists candidate applications across their jobs
   */
  async getRecruiterApplications(recruiterUserId, filters = {}) {
    const { jobId, status } = filters;
    const isDbLive = await authService.isPrismaHealthy();

    if (isDbLive) {
      const recruiter = await prisma.recruiter.findUnique({ where: { userId: recruiterUserId } });
      if (!recruiter) return [];

      const where = {
        job: { recruiterId: recruiter.id },
        ...(jobId ? { jobId } : {}),
        ...(status ? { status } : {}),
      };

      return await prisma.application.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          job: { select: { id: true, title: true, location: true } },
          candidate: {
            select: {
              id: true,
              email: true,
              profile: true,
            },
          },
          resume: {
            select: { id: true, title: true, version: true, fileUrl: true, qualityScore: true },
          },
          statusHistory: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      });
    }

    // In-memory fallback
    const list = [];
    for (const app of memoryApplications.values()) {
      if (!jobId || app.jobId === jobId) {
        if (!status || app.status === status) {
          list.push({
            ...app,
            job: {
              id: app.jobId,
              title: 'Senior Full-Stack Engineer',
              location: 'Remote (US/Americas)',
            },
            candidate: {
              id: app.candidateId,
              email: 'alex.seeker@example.com',
              profile: {
                fullName: 'Alex Seeker',
                headline: 'Full-Stack JavaScript Engineer',
                location: 'San Francisco, CA',
                skills: ['JavaScript', 'React', 'Node.js', 'PostgreSQL', 'Tailwind CSS'],
              },
            },
            resume: {
              id: app.resumeId,
              title: 'Senior Full-Stack Engineer Resume',
              version: 1,
              fileUrl: 'https://res.cloudinary.com/jobpilot/raw/upload/v1/jobpilot/resumes/demo_alex_seeker_resume.pdf',
              qualityScore: 94,
            },
          });
        }
      }
    }
    return list;
  }

  /**
   * Recruiter updates candidate application status
   */
  async updateApplicationStatus(recruiterUserId, applicationId, { status, reason = '', notes }, ipAddress, userAgent) {
    const isDbLive = await authService.isPrismaHealthy();

    if (isDbLive) {
      const recruiter = await prisma.recruiter.findUnique({ where: { userId: recruiterUserId } });
      if (!recruiter) throw AppError.forbidden('Only recruiters can update application status');

      const app = await prisma.application.findUnique({
        where: { id: applicationId },
        include: { job: true },
      });

      if (!app) throw AppError.notFound('Application not found');

      // Verify recruiter ownership
      if (app.job.recruiterId !== recruiter.id) {
        throw AppError.forbidden('You do not manage this job opening');
      }

      return await prisma.$transaction(async (tx) => {
        const updated = await tx.application.update({
          where: { id: applicationId },
          data: {
            status,
            ...(notes !== undefined ? { recruiterNotes: notes } : {}),
          },
        });

        await tx.applicationStatusHistory.create({
          data: {
            applicationId,
            fromStatus: app.status,
            toStatus: status,
            changedById: recruiterUserId,
            reason: reason || `Status transitioned to ${status}`,
          },
        });

        await tx.auditLog.create({
          data: {
            userId: recruiterUserId,
            action: 'APPLICATION_STATUS_UPDATED',
            resource: 'Application',
            resourceId: applicationId,
            ipAddress,
            userAgent,
            metadata: { fromStatus: app.status, toStatus: status },
          },
        });

        return updated;
      });
    }

    // In-memory fallback
    const app = memoryApplications.get(applicationId);
    if (!app) throw AppError.notFound('Application not found');

    const previousStatus = app.status;
    app.status = status;
    if (notes !== undefined) app.recruiterNotes = notes;
    app.updatedAt = new Date();

    memoryStatusHistory.push({
      id: `hist-${Date.now()}`,
      applicationId,
      fromStatus: previousStatus,
      toStatus: status,
      changedById: recruiterUserId,
      reason: reason || `Status moved to ${status}`,
      createdAt: new Date(),
    });

    notificationService.createNotification({
      userId: app.candidateId,
      type: 'STATUS_UPDATE',
      title: `Stage Update: ${status.replace('_', ' ')}`,
      message: reason || `Your application status was transitioned to ${status.replace('_', ' ')}.`,
      link: '/applications',
    }).catch((err) => logger.warn(`Notification error: ${err.message}`));

    return app;
  }
}

module.exports = new ApplicationService();
