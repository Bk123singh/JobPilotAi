const { prisma } = require('../../config/db');
const AppError = require('../../errors/AppError');
const authService = require('../auth/authService');
const profileService = require('../profiles/profileService');
const matchScoreService = require('../../services/matchScoreService');
const logger = require('../../utils/logger');

// Fallback in-memory job store
const memoryJobs = new Map();
const memorySavedJobs = new Set(); // Stores "userId:jobId"

// Seed demo jobs
const seedDemoJobs = () => {
  const companyTechCorp = {
    id: 'demo-company-id-001',
    name: 'TechCorp Solutions',
    logoUrl: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=160',
    location: 'New York, NY',
    isVerified: true,
  };

  const companyCloudMatrix = {
    id: 'demo-company-id-002',
    name: 'CloudMatrix Global',
    logoUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=160',
    location: 'San Francisco, CA',
    isVerified: true,
  };

  const jobs = [
    {
      id: 'job-demo-001',
      title: 'Senior Full-Stack Engineer',
      description:
        'We are seeking an experienced Senior Full-Stack Engineer to architect and scale our agentic developer workflows. You will design resilient Node.js services, optimize PostgreSQL data pipelines, and craft responsive React web interfaces.\n\nResponsibilities:\n• Build performant REST and real-time streaming APIs in Node.js.\n• Lead architectural initiatives across modern React/Tailwind frontends.\n• Collaborate with AI research and product engineering teams to integrate LLM workflows.\n\nRequirements:\n• 4+ years building production applications with JavaScript/TypeScript, React, and Node.js.\n• Strong relational database design skills (PostgreSQL, indexes, query optimization).\n• Passion for developer tooling and mobile-first responsive interfaces.',
      companyId: companyTechCorp.id,
      company: companyTechCorp,
      recruiterId: 'recruiter-sarah-001',
      location: 'Remote (US/Americas)',
      jobType: 'FULL_TIME',
      workplaceType: 'REMOTE',
      minSalary: 135000,
      maxSalary: 175000,
      currency: 'USD',
      experienceLevel: 'Senior Level (4-7 years)',
      status: 'ACTIVE',
      requiredSkills: ['JavaScript', 'React', 'Node.js', 'PostgreSQL'],
      niceToHaveSkills: ['Docker', 'Tailwind CSS', 'Redis', 'LangChain'],
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    },
    {
      id: 'job-demo-002',
      title: 'AI Platform & Agentic Systems Engineer',
      description:
        'Join our core AI systems team to engineer multi-agent orchestration engines. You will work directly with vector search, LangChain/LangGraph pipelines, and autonomous agent systems that automate recruitment workflows.\n\nResponsibilities:\n• Develop autonomous agent pipelines utilizing LangChain and pgvector.\n• Optimize prompt engineering and structured LLM tool calling.\n• Ensure data privacy, auditability, and deterministic validation of AI outputs.',
      companyId: companyTechCorp.id,
      company: companyTechCorp,
      recruiterId: 'recruiter-sarah-001',
      location: 'New York, NY (Hybrid)',
      jobType: 'FULL_TIME',
      workplaceType: 'HYBRID',
      minSalary: 155000,
      maxSalary: 210000,
      currency: 'USD',
      experienceLevel: 'Lead / Principal (5+ years)',
      status: 'ACTIVE',
      requiredSkills: ['Python', 'LangChain', 'PostgreSQL', 'Docker'],
      niceToHaveSkills: ['pgvector', 'FastAPI', 'Redis', 'AWS'],
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    },
    {
      id: 'job-demo-003',
      title: 'Lead Frontend Architect',
      description:
        'TechCorp is looking for a Lead Frontend Architect to elevate our web and mobile experiences. You will champion mobile-first UX standards, design design-system components, and maintain ultra-fast page rendering.',
      companyId: companyTechCorp.id,
      company: companyTechCorp,
      recruiterId: 'recruiter-sarah-001',
      location: 'San Francisco, CA / Remote',
      jobType: 'FULL_TIME',
      workplaceType: 'REMOTE',
      minSalary: 150000,
      maxSalary: 190000,
      currency: 'USD',
      experienceLevel: 'Senior / Staff (5+ years)',
      status: 'ACTIVE',
      requiredSkills: ['React', 'JavaScript', 'Tailwind CSS', 'REST APIs'],
      niceToHaveSkills: ['Next.js', 'Zustand', 'Performance Tuning'],
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    },
    {
      id: 'job-demo-004',
      title: 'Backend Systems & Infrastructure Engineer',
      description:
        'CloudMatrix is seeking an experienced Backend Engineer to scale our distributed cloud systems. You will optimize database queries, build resilient queue consumers with Redis, and ensure 99.99% service availability.',
      companyId: companyCloudMatrix.id,
      company: companyCloudMatrix,
      recruiterId: 'recruiter-cloud-001',
      location: 'Austin, TX / Remote',
      jobType: 'FULL_TIME',
      workplaceType: 'REMOTE',
      minSalary: 130000,
      maxSalary: 165000,
      currency: 'USD',
      experienceLevel: 'Mid-Senior Level (3-6 years)',
      status: 'ACTIVE',
      requiredSkills: ['Node.js', 'Express', 'PostgreSQL', 'Redis'],
      niceToHaveSkills: ['Docker', 'BullMQ', 'AWS'],
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    },
  ];

  jobs.forEach((j) => memoryJobs.set(j.id, j));
};

seedDemoJobs();

class JobService {
  /**
   * Create new job posting by recruiter
   */
  async createJob(userId, data, ipAddress, userAgent) {
    const isDbLive = await authService.isPrismaHealthy();

    if (isDbLive) {
      const recruiter = await prisma.recruiter.findUnique({
        where: { userId },
        include: { company: true },
      });

      if (!recruiter || !recruiter.companyId) {
        throw AppError.badRequest('You must have a registered company before posting jobs');
      }

      const job = await prisma.job.create({
        data: {
          title: data.title,
          description: data.description,
          location: data.location,
          jobType: data.jobType || 'FULL_TIME',
          workplaceType: data.workplaceType || 'REMOTE',
          minSalary: data.minSalary || null,
          maxSalary: data.maxSalary || null,
          currency: data.currency || 'USD',
          experienceLevel: data.experienceLevel || 'Mid-Senior Level',
          status: 'ACTIVE',
          requiredSkills: data.requiredSkills || [],
          niceToHaveSkills: data.niceToHaveSkills || [],
          companyId: recruiter.companyId,
          recruiterId: recruiter.id,
        },
        include: { company: true },
      });

      await prisma.auditLog.create({
        data: {
          userId,
          action: 'JOB_CREATED',
          resource: 'Job',
          resourceId: job.id,
          ipAddress,
          userAgent,
          metadata: { title: job.title, companyId: recruiter.companyId },
        },
      });

      return job;
    }

    // In-memory fallback
    const jobId = `job-${Date.now()}`;
    const newJob = {
      id: jobId,
      title: data.title,
      description: data.description,
      location: data.location,
      jobType: data.jobType || 'FULL_TIME',
      workplaceType: data.workplaceType || 'REMOTE',
      minSalary: data.minSalary || null,
      maxSalary: data.maxSalary || null,
      currency: data.currency || 'USD',
      experienceLevel: data.experienceLevel || 'Mid-Senior Level',
      status: 'ACTIVE',
      requiredSkills: data.requiredSkills || [],
      niceToHaveSkills: data.niceToHaveSkills || [],
      companyId: 'demo-company-id-001',
      company: {
        id: 'demo-company-id-001',
        name: 'TechCorp Solutions',
        logoUrl: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=160',
        location: 'New York, NY',
        isVerified: true,
      },
      recruiterId: 'recruiter-sarah-001',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    memoryJobs.set(jobId, newJob);
    return newJob;
  }

  /**
   * Update existing job posting
   */
  async updateJob(userId, jobId, updateData, ipAddress, userAgent) {
    const isDbLive = await authService.isPrismaHealthy();

    if (isDbLive) {
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: { recruiter: true },
      });

      if (!job) throw AppError.notFound('Job not found');

      // Verify ownership
      if (job.recruiter.userId !== userId) {
        throw AppError.forbidden('You do not have permission to edit this job');
      }

      const updated = await prisma.job.update({
        where: { id: jobId },
        data: updateData,
        include: { company: true },
      });

      await prisma.auditLog.create({
        data: {
          userId,
          action: 'JOB_UPDATED',
          resource: 'Job',
          resourceId: jobId,
          ipAddress,
          userAgent,
        },
      });

      return updated;
    }

    // In-memory fallback
    const job = memoryJobs.get(jobId);
    if (!job) throw AppError.notFound('Job not found');

    const updated = {
      ...job,
      ...updateData,
      updatedAt: new Date(),
    };
    memoryJobs.set(jobId, updated);
    return updated;
  }

  /**
   * Close a job opening
   */
  async closeJob(userId, jobId, ipAddress, userAgent) {
    return await this.updateJob(userId, jobId, { status: 'CLOSED' }, ipAddress, userAgent);
  }

  /**
   * Get single job by ID with saved status
   */
  async getJobById(jobId, requestingUserId = null) {
    const isDbLive = await authService.isPrismaHealthy();
    let job = null;
    let isSaved = false;
    let hasApplied = false;
    let appliedApplication = null;

    if (isDbLive) {
      job = await prisma.job.findUnique({
        where: { id: jobId },
        include: {
          company: true,
          _count: { select: { applications: true } },
        },
      });

      if (!job) throw AppError.notFound('Job not found');

      if (requestingUserId) {
        const saved = await prisma.savedJob.findUnique({
          where: {
            jobId_candidateId: { jobId, candidateId: requestingUserId },
          },
        });
        isSaved = !!saved;

        const application = await prisma.application.findUnique({
          where: {
            jobId_candidateId: { jobId, candidateId: requestingUserId },
          },
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
        });
        hasApplied = !!application;
        appliedApplication = application;
      }

      let matchBreakdown = null;
      if (requestingUserId) {
        try {
          const profile = await profileService.getProfileByUserId(requestingUserId);
          if (profile) {
            matchBreakdown = matchScoreService.calculateMatchScore(profile, job);
          }
        } catch (e) {
          logger.warn(`Failed to compute live match score: ${e.message}`);
        }
      }

      return { ...job, isSaved, hasApplied, appliedApplication, matchBreakdown };
    }

    // In-memory fallback
    job = memoryJobs.get(jobId);
    if (!job) throw AppError.notFound('Job not found');

    if (requestingUserId) {
      isSaved = memorySavedJobs.has(`${requestingUserId}:${jobId}`);
      for (const app of memoryApplications.values()) {
        if (app.jobId === jobId && app.candidateId === requestingUserId) {
          hasApplied = true;
          appliedApplication = { id: app.id, status: app.status, createdAt: app.createdAt };
          break;
        }
      }
    }

    let matchBreakdown = null;
    if (requestingUserId) {
      try {
        const profile = await profileService.getProfileByUserId(requestingUserId);
        if (profile) {
          matchBreakdown = matchScoreService.calculateMatchScore(profile, job);
        }
      } catch (e) {
        logger.warn(`Failed to compute live match score: ${e.message}`);
      }
    }

    return {
      ...job,
      isSaved,
      hasApplied,
      appliedApplication,
      matchBreakdown,
      _count: { applications: 0 },
    };
  }

  /**
   * List jobs with mobile-first search, filter, and sort
   */
  async listJobs(queryParams = {}, requestingUserId = null) {
    const {
      search = '',
      skill = '',
      location = '',
      workplaceType = '',
      jobType = '',
      minSalary = 0,
      sortBy = 'newest',
    } = queryParams;

    const isDbLive = await authService.isPrismaHealthy();

    if (isDbLive) {
      const where = {
        status: 'ACTIVE',
        ...(workplaceType ? { workplaceType } : {}),
        ...(jobType ? { jobType } : {}),
        ...(minSalary ? { minSalary: { gte: parseInt(minSalary, 10) } } : {}),
        ...(location ? { location: { contains: location, mode: 'insensitive' } } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { company: { name: { contains: search, mode: 'insensitive' } } },
              ],
            }
          : {}),
        ...(skill ? { requiredSkills: { has: skill } } : {}),
      };

      let orderBy = { createdAt: 'desc' };
      if (sortBy === 'salary_high') orderBy = { maxSalary: 'desc' };
      if (sortBy === 'salary_low') orderBy = { minSalary: 'asc' };

      const jobs = await prisma.job.findMany({
        where,
        orderBy,
        include: { company: true },
      });

      // Attach saved status
      let savedSet = new Set();
      if (requestingUserId) {
        const userSaved = await prisma.savedJob.findMany({
          where: { candidateId: requestingUserId },
          select: { jobId: true },
        });
        savedSet = new Set(userSaved.map((s) => s.jobId));
      }

      // Candidate profile for personalized match scores
      let candidateProfile = null;
      if (requestingUserId) {
        try {
          candidateProfile = await profileService.getProfileByUserId(requestingUserId);
        } catch (e) {
          // Candidate profile not yet created or non-jobseeker
        }
      }

      return jobs.map((j) => {
        let matchScore = null;
        if (candidateProfile) {
          const match = matchScoreService.calculateMatchScore(candidateProfile, j);
          matchScore = {
            overallScore: match.overallScore,
            tier: match.tier,
            tierLabel: match.tierLabel,
            tierColor: match.tierColor,
          };
        }
        return {
          ...j,
          isSaved: savedSet.has(j.id),
          matchScore,
        };
      });
    }

    // In-memory fallback
    let candidateProfile = null;
    if (requestingUserId) {
      try {
        candidateProfile = await profileService.getProfileByUserId(requestingUserId);
      } catch (e) {
        // ignore
      }
    }

    let results = Array.from(memoryJobs.values()).filter((j) => j.status === 'ACTIVE');

    if (search) {
      const q = search.toLowerCase();
      results = results.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.description.toLowerCase().includes(q) ||
          j.company?.name?.toLowerCase().includes(q) ||
          j.requiredSkills.some((s) => s.toLowerCase().includes(q))
      );
    }

    if (skill) {
      const sk = skill.toLowerCase();
      results = results.filter((j) =>
        j.requiredSkills.some((s) => s.toLowerCase() === sk)
      );
    }

    if (location) {
      const loc = location.toLowerCase();
      results = results.filter((j) => j.location.toLowerCase().includes(loc));
    }

    if (workplaceType) {
      results = results.filter((j) => j.workplaceType === workplaceType);
    }

    if (jobType) {
      results = results.filter((j) => j.jobType === jobType);
    }

    if (minSalary && parseInt(minSalary, 10) > 0) {
      const min = parseInt(minSalary, 10);
      results = results.filter((j) => j.maxSalary && j.maxSalary >= min);
    }

    // Sorting
    if (sortBy === 'salary_high') {
      results.sort((a, b) => (b.maxSalary || 0) - (a.maxSalary || 0));
    } else if (sortBy === 'salary_low') {
      results.sort((a, b) => (a.minSalary || 0) - (b.minSalary || 0));
    } else {
      results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return results.map((j) => {
      let matchScore = null;
      if (candidateProfile) {
        const match = matchScoreService.calculateMatchScore(candidateProfile, j);
        matchScore = {
          overallScore: match.overallScore,
          tier: match.tier,
          tierLabel: match.tierLabel,
          tierColor: match.tierColor,
        };
      }
      return {
        ...j,
        isSaved: requestingUserId ? memorySavedJobs.has(`${requestingUserId}:${j.id}`) : false,
        matchScore,
      };
    });
  }

  /**
   * Get personalized match score calculation for a single job
   */
  async getJobMatchScore(jobId, candidateUserId) {
    const job = await this.getJobById(jobId, candidateUserId);
    const profile = await profileService.getProfileByUserId(candidateUserId);
    return matchScoreService.calculateMatchScore(profile, job);
  }

  /**
   * List jobs managed by logged-in recruiter
   */
  async listRecruiterJobs(userId) {
    const isDbLive = await authService.isPrismaHealthy();

    if (isDbLive) {
      const recruiter = await prisma.recruiter.findUnique({ where: { userId } });
      if (!recruiter) return [];

      return await prisma.job.findMany({
        where: { recruiterId: recruiter.id },
        orderBy: { createdAt: 'desc' },
        include: {
          company: true,
          _count: { select: { applications: true } },
        },
      });
    }

    // In-memory fallback
    const jobs = [];
    for (const j of memoryJobs.values()) {
      if (j.companyId === 'demo-company-id-001') {
        jobs.push({
          ...j,
          _count: { applications: 0 },
        });
      }
    }
    return jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /**
   * Toggle save/bookmark job for candidate
   */
  async toggleSaveJob(userId, jobId) {
    const isDbLive = await authService.isPrismaHealthy();

    if (isDbLive) {
      const existing = await prisma.savedJob.findUnique({
        where: {
          jobId_candidateId: { jobId, candidateId: userId },
        },
      });

      if (existing) {
        await prisma.savedJob.delete({ where: { id: existing.id } });
        return { isSaved: false };
      } else {
        await prisma.savedJob.create({
          data: { jobId, candidateId: userId },
        });
        return { isSaved: true };
      }
    }

    // In-memory fallback
    const key = `${userId}:${jobId}`;
    if (memorySavedJobs.has(key)) {
      memorySavedJobs.delete(key);
      return { isSaved: false };
    } else {
      memorySavedJobs.add(key);
      return { isSaved: true };
    }
  }

  /**
   * List saved jobs for candidate
   */
  async listSavedJobs(userId) {
    const isDbLive = await authService.isPrismaHealthy();

    if (isDbLive) {
      const saved = await prisma.savedJob.findMany({
        where: { candidateId: userId },
        include: {
          job: {
            include: { company: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return saved.map((s) => ({ ...s.job, isSaved: true }));
    }

    // In-memory fallback
    const saved = [];
    for (const key of memorySavedJobs) {
      const [uId, jId] = key.split(':');
      if (uId === userId) {
        const job = memoryJobs.get(jId);
        if (job) saved.push({ ...job, isSaved: true });
      }
    }
    return saved;
  }

  /**
   * Get personalized recommended jobs for candidate ranked by 5-pillar score
   */
  async getRecommendedJobs(candidateUserId, limit = 10) {
    const profile = await profileService.getProfileByUserId(candidateUserId);
    const jobs = await this.listJobs({}, candidateUserId);

    const recommended = jobs
      .map((job) => {
        const match = matchScoreService.calculateMatchScore(profile, job);
        return {
          ...job,
          matchScore: {
            overallScore: match.overallScore,
            tier: match.tier,
            tierLabel: match.tierLabel,
            tierColor: match.tierColor,
          },
          matchBreakdown: match,
        };
      })
      .sort((a, b) => b.matchScore.overallScore - a.matchScore.overallScore)
      .slice(0, parseInt(limit, 10));

    return recommended;
  }
}

module.exports = new JobService();
