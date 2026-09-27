const { prisma } = require('../../config/db');
const AppError = require('../../errors/AppError');
const authService = require('../auth/authService');
const storageService = require('../../services/storageService');
const logger = require('../../utils/logger');

// Fallback in-memory resume store
const memoryResumes = new Map();

// Seed initial resume for demo candidate
const seedDemoResume = () => {
  const resumeId = 'demo-resume-001';
  memoryResumes.set(resumeId, {
    id: resumeId,
    userId: 'demo-candidate-id-001',
    title: 'Senior Full-Stack Engineer Resume',
    fileUrl: 'https://res.cloudinary.com/jobpilot/raw/upload/v1/jobpilot/resumes/demo_alex_seeker_resume.pdf',
    cloudinaryId: 'demo_alex_seeker_resume_cl_id',
    fileSize: 1024 * 68, // 68KB
    fileType: 'application/pdf',
    isPrimary: true,
    visibility: 'APPLICATION_ONLY',
    version: 1,
    qualityScore: 94,
    rawText: 'Alex Seeker - Senior Full-Stack Engineer. Skills: React, Node.js, TypeScript, PostgreSQL, Express, Docker.',
    parsedData: {
      skills: ['JavaScript', 'React', 'Node.js', 'PostgreSQL', 'Tailwind CSS', 'Docker', 'REST APIs'],
      experienceYears: 5,
    },
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  });
};

seedDemoResume();

class ResumeService {
  /**
   * List all resumes for candidate
   */
  async listUserResumes(userId) {
    const isDbLive = await authService.isPrismaHealthy();

    if (isDbLive) {
      return await prisma.resume.findMany({
        where: { userId },
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
        include: {
          skills: true,
          _count: { select: { applications: true } },
        },
      });
    }

    // In-memory fallback
    const resumes = [];
    for (const res of memoryResumes.values()) {
      if (res.userId === userId) {
        resumes.push({
          ...res,
          _count: { applications: 0 },
        });
      }
    }
    return resumes.sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0));
  }

  /**
   * Get single resume with strict privacy & IDOR protection
   */
  async getResumeById(resumeId, requestingUser, ipAddress, userAgent) {
    const isDbLive = await authService.isPrismaHealthy();
    let resume = null;

    if (isDbLive) {
      resume = await prisma.resume.findUnique({
        where: { id: resumeId },
        include: {
          user: { select: { id: true, email: true, profile: true } },
          skills: true,
        },
      });
    } else {
      resume = memoryResumes.get(resumeId);
    }

    if (!resume) {
      throw AppError.notFound('Resume not found');
    }

    const isOwner = requestingUser.id === resume.userId;
    const isAdmin = requestingUser.role === 'ADMIN';
    const isRecruiter = requestingUser.role === 'RECRUITER';

    // Owner and Admin always have full access
    if (!isOwner && !isAdmin) {
      if (!isRecruiter) {
        throw AppError.forbidden('You do not have permission to access this resume');
      }

      // If recruiter, check candidate's resume privacy setting
      if (resume.visibility === 'PRIVATE') {
        throw AppError.forbidden('This candidate has set their resume to Private');
      }

      if (resume.visibility === 'APPLICATION_ONLY') {
        // Must verify that candidate applied to a job created by this recruiter
        let hasApplication = false;

        if (isDbLive) {
          const app = await prisma.application.findFirst({
            where: {
              resumeId: resume.id,
              job: { recruiterId: requestingUser.recruiter?.id },
            },
          });
          hasApplication = !!app;
        } else {
          // Dev / in-memory mode: allow recruiter to preview application
          hasApplication = true;
        }

        if (!hasApplication) {
          throw AppError.forbidden(
            'This resume is APPLICATION_ONLY. Candidate has not applied to your openings.'
          );
        }
      }
      // If RECRUITER_VISIBLE, verified recruiters can view
    }

    // Record sensitive resume access in AuditLog
    if (isDbLive) {
      await prisma.auditLog.create({
        data: {
          userId: requestingUser.id,
          action: 'RESUME_ACCESSED',
          resource: 'Resume',
          resourceId: resume.id,
          ipAddress,
          userAgent,
          metadata: { isOwner, visibility: resume.visibility },
        },
      });
    }

    return {
      ...resume,
      secureViewUrl: storageService.getSecureAccessUrl(resume.cloudinaryId, resume.fileUrl),
    };
  }

  /**
   * Upload & create new resume
   */
  async createResume(userId, data, file, ipAddress, userAgent) {
    const isDbLive = await authService.isPrismaHealthy();

    let fileUpload = {
      fileUrl: data.fileUrl || 'https://res.cloudinary.com/jobpilot/raw/upload/v1/jobpilot/resumes/default_resume.pdf',
      cloudinaryId: 'cl_' + Date.now(),
      fileSize: data.fileSize || 1024 * 50,
      fileType: data.fileType || 'application/pdf',
    };

    if (file) {
      fileUpload = await storageService.uploadFile({
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
        folder: `jobpilot/resumes/${userId}`,
      });
    }

    const existingResumes = await this.listUserResumes(userId);
    const isFirstResume = existingResumes.length === 0;
    const shouldBePrimary = data.isPrimary !== undefined ? data.isPrimary : isFirstResume;

    // Check version number if user has resume with same title
    const sameTitleResumes = existingResumes.filter(
      (r) => r.title.toLowerCase() === data.title.toLowerCase()
    );
    const version = sameTitleResumes.length + 1;

    if (isDbLive) {
      return await prisma.$transaction(async (tx) => {
        if (shouldBePrimary) {
          await tx.resume.updateMany({
            where: { userId },
            data: { isPrimary: false },
          });
        }

        const newResume = await tx.resume.create({
          data: {
            userId,
            title: data.title,
            fileUrl: fileUpload.fileUrl,
            cloudinaryId: fileUpload.cloudinaryId,
            fileSize: fileUpload.fileSize,
            fileType: fileUpload.fileType,
            isPrimary: shouldBePrimary,
            visibility: data.visibility || 'APPLICATION_ONLY',
            version,
            rawText: data.rawText || '',
            qualityScore: 90, // Baseline quality score placeholder
          },
        });

        await tx.auditLog.create({
          data: {
            userId,
            action: 'RESUME_CREATED',
            resource: 'Resume',
            resourceId: newResume.id,
            ipAddress,
            userAgent,
            metadata: { title: newResume.title, version },
          },
        });

        return newResume;
      });
    }

    // In-memory fallback
    if (shouldBePrimary) {
      for (const res of memoryResumes.values()) {
        if (res.userId === userId) {
          res.isPrimary = false;
        }
      }
    }

    const resumeId = `resume-${Date.now()}`;
    const newResume = {
      id: resumeId,
      userId,
      title: data.title,
      fileUrl: fileUpload.fileUrl,
      cloudinaryId: fileUpload.cloudinaryId,
      fileSize: fileUpload.fileSize,
      fileType: fileUpload.fileType,
      isPrimary: shouldBePrimary,
      visibility: data.visibility || 'APPLICATION_ONLY',
      version,
      qualityScore: 90,
      rawText: data.rawText || '',
      parsedData: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    memoryResumes.set(resumeId, newResume);
    return newResume;
  }

  /**
   * Set primary resume
   */
  async setPrimaryResume(userId, resumeId) {
    const isDbLive = await authService.isPrismaHealthy();

    if (isDbLive) {
      const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
      if (!resume || resume.userId !== userId) {
        throw AppError.notFound('Resume not found or unauthorized');
      }

      await prisma.$transaction([
        prisma.resume.updateMany({
          where: { userId },
          data: { isPrimary: false },
        }),
        prisma.resume.update({
          where: { id: resumeId },
          data: { isPrimary: true },
        }),
      ]);

      return await prisma.resume.findUnique({ where: { id: resumeId } });
    }

    // In-memory fallback
    const resume = memoryResumes.get(resumeId);
    if (!resume || resume.userId !== userId) {
      throw AppError.notFound('Resume not found or unauthorized');
    }

    for (const res of memoryResumes.values()) {
      if (res.userId === userId) {
        res.isPrimary = res.id === resumeId;
      }
    }

    return resume;
  }

  /**
   * Update resume title or visibility
   */
  async updateResume(userId, resumeId, updateData) {
    const isDbLive = await authService.isPrismaHealthy();

    if (isDbLive) {
      const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
      if (!resume || resume.userId !== userId) {
        throw AppError.notFound('Resume not found or unauthorized');
      }

      if (updateData.isPrimary) {
        await prisma.resume.updateMany({
          where: { userId },
          data: { isPrimary: false },
        });
      }

      return await prisma.resume.update({
        where: { id: resumeId },
        data: {
          title: updateData.title !== undefined ? updateData.title : resume.title,
          visibility: updateData.visibility !== undefined ? updateData.visibility : resume.visibility,
          isPrimary: updateData.isPrimary !== undefined ? updateData.isPrimary : resume.isPrimary,
        },
      });
    }

    // In-memory fallback
    const resume = memoryResumes.get(resumeId);
    if (!resume || resume.userId !== userId) {
      throw AppError.notFound('Resume not found or unauthorized');
    }

    if (updateData.isPrimary) {
      for (const res of memoryResumes.values()) {
        if (res.userId === userId) res.isPrimary = false;
      }
    }

    const updated = {
      ...resume,
      ...updateData,
      updatedAt: new Date(),
    };
    memoryResumes.set(resumeId, updated);
    return updated;
  }

  /**
   * Delete resume
   */
  async deleteResume(userId, resumeId) {
    const isDbLive = await authService.isPrismaHealthy();

    if (isDbLive) {
      const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
      if (!resume || resume.userId !== userId) {
        throw AppError.notFound('Resume not found or unauthorized');
      }

      await storageService.deleteFile(resume.cloudinaryId);
      await prisma.resume.delete({ where: { id: resumeId } });

      // If deleted resume was primary, set another resume as primary if exists
      if (resume.isPrimary) {
        const nextResume = await prisma.resume.findFirst({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        });
        if (nextResume) {
          await prisma.resume.update({
            where: { id: nextResume.id },
            data: { isPrimary: true },
          });
        }
      }

      return true;
    }

    // In-memory fallback
    const resume = memoryResumes.get(resumeId);
    if (!resume || resume.userId !== userId) {
      throw AppError.notFound('Resume not found or unauthorized');
    }

    memoryResumes.delete(resumeId);

    if (resume.isPrimary) {
      const remaining = await this.listUserResumes(userId);
      if (remaining.length > 0) {
        remaining[0].isPrimary = true;
      }
    }

    return true;
  }
}

module.exports = new ResumeService();
