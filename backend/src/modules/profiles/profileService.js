const { prisma } = require('../../config/db');
const AppError = require('../../errors/AppError');
const authService = require('../auth/authService');
const logger = require('../../utils/logger');

// Fallback in-memory profile store
const memoryProfiles = new Map();

// Seed initial profile for demo candidate
memoryProfiles.set('demo-candidate-id-001', {
  userId: 'demo-candidate-id-001',
  fullName: 'Alex Seeker',
  headline: 'Full-Stack JavaScript Engineer',
  phone: '+1 (555) 234-5678',
  location: 'San Francisco, CA',
  bio: 'Passionate full-stack developer with 5+ years of experience building performant web applications using React, Node.js, and PostgreSQL.',
  website: 'https://alexseeker.dev',
  githubUrl: 'https://github.com/alexseeker',
  linkedinUrl: 'https://linkedin.com/in/alexseeker',
  skills: ['JavaScript', 'React', 'Node.js', 'Express', 'PostgreSQL', 'Tailwind CSS', 'Docker', 'REST APIs'],
  education: [
    {
      id: 'edu-1',
      institution: 'University of California, Berkeley',
      degree: 'B.S. in Computer Science',
      fieldOfStudy: 'Computer Science',
      startDate: '2017',
      endDate: '2021',
      current: false,
      description: 'Focused on Distributed Systems, Algorithms, and Software Engineering.',
    },
  ],
  experience: [
    {
      id: 'exp-1',
      company: 'TechFlow Systems',
      title: 'Senior Frontend Developer',
      location: 'San Francisco, CA (Hybrid)',
      startDate: '2022-01',
      endDate: '',
      current: true,
      description: 'Architected responsive React dashboards, improved page load performance by 40%, and led a team of 4 engineers.',
    },
    {
      id: 'exp-2',
      company: 'DataPulse Corp',
      title: 'Full Stack Engineer',
      location: 'San Jose, CA',
      startDate: '2021-06',
      endDate: '2021-12',
      current: false,
      description: 'Built RESTful microservices with Node.js and PostgreSQL, implemented Redis caching layer.',
    },
  ],
  projects: [
    {
      id: 'proj-1',
      title: 'DevCollab - Real-Time Code Collaboration',
      description: 'A WebRTC and WebSocket-powered collaborative code editor with real-time cursor sync.',
      url: 'https://github.com/alexseeker/devcollab',
      technologies: ['React', 'WebSockets', 'Tailwind CSS', 'Node.js'],
    },
  ],
  certifications: [
    {
      id: 'cert-1',
      name: 'AWS Certified Solutions Architect',
      issuer: 'Amazon Web Services',
      issueDate: '2023-08',
      url: '',
    },
  ],
  careerPreferences: {
    desiredRoles: ['Senior Frontend Engineer', 'Full Stack Developer', 'Software Engineer'],
    preferredLocations: ['San Francisco, CA', 'Remote', 'New York, NY'],
    remotePreference: 'REMOTE',
    minExpectedSalary: 125000,
    currency: 'USD',
  },
  updatedAt: new Date(),
});

class ProfileService {
  /**
   * Calculate completeness percentage and missing recommendations
   */
  calculateCompleteness(profile) {
    let score = 0;
    const suggestions = [];

    if (profile.fullName) score += 15;
    if (profile.headline) score += 15;
    else suggestions.push('Add a professional headline');

    if (profile.location) score += 10;
    else suggestions.push('Add your location');

    if (profile.bio) score += 10;
    else suggestions.push('Write a short bio');

    const skillsCount = Array.isArray(profile.skills) ? profile.skills.length : 0;
    if (skillsCount >= 5) score += 20;
    else if (skillsCount > 0) {
      score += 10;
      suggestions.push('Add at least 5 skills to improve match accuracy');
    } else {
      suggestions.push('Add your core technical skills');
    }

    const expCount = Array.isArray(profile.experience) ? profile.experience.length : 0;
    if (expCount >= 1) score += 15;
    else suggestions.push('Add at least one work experience');

    const eduCount = Array.isArray(profile.education) ? profile.education.length : 0;
    if (eduCount >= 1) score += 10;
    else suggestions.push('Add your education history');

    const projCount = Array.isArray(profile.projects) ? profile.projects.length : 0;
    if (projCount >= 1) score += 5;
    else suggestions.push('Showcase a project to stand out');

    return {
      completenessScore: Math.min(score, 100),
      suggestions,
    };
  }

  /**
   * Get user's own profile
   */
  async getProfileByUserId(userId) {
    const isDbLive = await authService.isPrismaHealthy();

    if (isDbLive) {
      let profile = await prisma.userProfile.findUnique({
        where: { userId },
        include: {
          user: {
            select: { id: true, email: true, role: true, avatarUrl: true, isEmailVerified: true },
          },
        },
      });

      if (!profile) {
        // Create blank profile if missing
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw AppError.notFound('User not found');

        profile = await prisma.userProfile.create({
          data: {
            userId,
            fullName: user.email.split('@')[0],
            skills: [],
          },
          include: {
            user: {
              select: { id: true, email: true, role: true, avatarUrl: true, isEmailVerified: true },
            },
          },
        });
      }

      const metrics = this.calculateCompleteness(profile);

      return {
        ...profile,
        ...metrics,
      };
    }

    // In-memory fallback
    let profile = memoryProfiles.get(userId);
    if (!profile) {
      const user = await authService.getMe(userId);
      profile = {
        userId,
        fullName: user?.profile?.fullName || user?.email?.split('@')[0] || 'Candidate',
        headline: '',
        phone: '',
        location: '',
        bio: '',
        website: '',
        githubUrl: '',
        linkedinUrl: '',
        skills: [],
        education: [],
        experience: [],
        projects: [],
        certifications: [],
        careerPreferences: {
          desiredRoles: [],
          preferredLocations: [],
          remotePreference: 'ANY',
          minExpectedSalary: 0,
          currency: 'USD',
        },
        user: {
          id: userId,
          email: user?.email || '',
          role: user?.role || 'JOB_SEEKER',
          avatarUrl: user?.avatarUrl || null,
          isEmailVerified: user?.isEmailVerified || false,
        },
      };
      memoryProfiles.set(userId, profile);
    } else {
      const user = await authService.getMe(userId);
      profile.user = {
        id: userId,
        email: user?.email || '',
        role: user?.role || 'JOB_SEEKER',
        avatarUrl: user?.avatarUrl || null,
        isEmailVerified: user?.isEmailVerified || false,
      };
    }

    const metrics = this.calculateCompleteness(profile);
    return {
      ...profile,
      ...metrics,
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, updateData, ipAddress, userAgent) {
    const isDbLive = await authService.isPrismaHealthy();

    if (isDbLive) {
      const existing = await prisma.userProfile.findUnique({ where: { userId } });
      let updated;

      if (existing) {
        updated = await prisma.userProfile.update({
          where: { userId },
          data: {
            fullName: updateData.fullName !== undefined ? updateData.fullName : existing.fullName,
            headline: updateData.headline !== undefined ? updateData.headline : existing.headline,
            phone: updateData.phone !== undefined ? updateData.phone : existing.phone,
            location: updateData.location !== undefined ? updateData.location : existing.location,
            bio: updateData.bio !== undefined ? updateData.bio : existing.bio,
            website: updateData.website !== undefined ? updateData.website : existing.website,
            githubUrl: updateData.githubUrl !== undefined ? updateData.githubUrl : existing.githubUrl,
            linkedinUrl: updateData.linkedinUrl !== undefined ? updateData.linkedinUrl : existing.linkedinUrl,
            skills: updateData.skills !== undefined ? updateData.skills : existing.skills,
            education: updateData.education !== undefined ? updateData.education : existing.education,
            experience: updateData.experience !== undefined ? updateData.experience : existing.experience,
            projects: updateData.projects !== undefined ? updateData.projects : existing.projects,
            certifications: updateData.certifications !== undefined ? updateData.certifications : existing.certifications,
            careerPreferences: updateData.careerPreferences !== undefined ? updateData.careerPreferences : existing.careerPreferences,
          },
          include: {
            user: { select: { id: true, email: true, role: true, avatarUrl: true } },
          },
        });
      } else {
        updated = await prisma.userProfile.create({
          data: {
            userId,
            ...updateData,
          },
          include: {
            user: { select: { id: true, email: true, role: true, avatarUrl: true } },
          },
        });
      }

      await prisma.auditLog.create({
        data: {
          userId,
          action: 'USER_PROFILE_UPDATED',
          resource: 'UserProfile',
          resourceId: updated.id,
          ipAddress,
          userAgent,
        },
      });

      const metrics = this.calculateCompleteness(updated);
      return { ...updated, ...metrics };
    }

    // In-memory fallback
    const current = await this.getProfileByUserId(userId);
    const merged = {
      ...current,
      ...updateData,
      updatedAt: new Date(),
    };

    memoryProfiles.set(userId, merged);
    const metrics = this.calculateCompleteness(merged);

    return {
      ...merged,
      ...metrics,
    };
  }

  /**
   * Auto-fill profile from parsed resume data
   * @param {string} userId
   * @param {Object} resumeData - Parsed resume object
   * @param {'MERGE'|'REPLACE'} strategy
   */
  async autoFillFromResume(userId, resumeData, strategy = 'MERGE', ipAddress = '', userAgent = '') {
    const current = await this.getProfileByUserId(userId);

    let updatedData = {};

    if (strategy === 'REPLACE') {
      updatedData = {
        fullName: resumeData.fullName || current.fullName,
        headline: resumeData.headline || current.headline,
        phone: resumeData.phone || current.phone,
        location: resumeData.location || current.location,
        bio: resumeData.bio || current.bio,
        website: resumeData.website || current.website,
        githubUrl: resumeData.githubUrl || current.githubUrl,
        linkedinUrl: resumeData.linkedinUrl || current.linkedinUrl,
        skills: resumeData.skills?.length ? resumeData.skills : current.skills,
        experience: resumeData.experience?.length ? resumeData.experience : current.experience,
        education: resumeData.education?.length ? resumeData.education : current.education,
        projects: resumeData.projects?.length ? resumeData.projects : current.projects,
        certifications: resumeData.certifications?.length ? resumeData.certifications : current.certifications,
      };
    } else {
      // Default: MERGE (Smart non-destructive blend)
      const existingSkills = Array.isArray(current.skills) ? current.skills : [];
      const newSkills = Array.isArray(resumeData.skills) ? resumeData.skills : [];
      const existingLower = new Set(existingSkills.map((s) => s.toLowerCase()));
      const mergedSkills = [...existingSkills];
      for (const s of newSkills) {
        if (!existingLower.has(s.toLowerCase())) {
          mergedSkills.push(s);
          existingLower.add(s.toLowerCase());
        }
      }

      const existingExp = Array.isArray(current.experience) ? current.experience : [];
      const newExp = Array.isArray(resumeData.experience) ? resumeData.experience : [];
      const mergedExp = [...existingExp];
      for (const ne of newExp) {
        const alreadyExists = existingExp.some(
          (e) => e.company?.toLowerCase() === ne.company?.toLowerCase() &&
                 e.title?.toLowerCase() === ne.title?.toLowerCase()
        );
        if (!alreadyExists) {
          mergedExp.push({ ...ne, id: ne.id || `exp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` });
        }
      }

      const existingEdu = Array.isArray(current.education) ? current.education : [];
      const newEdu = Array.isArray(resumeData.education) ? resumeData.education : [];
      const mergedEdu = [...existingEdu];
      for (const ned of newEdu) {
        const alreadyExists = existingEdu.some(
          (ed) => ed.institution?.toLowerCase() === ned.institution?.toLowerCase() &&
                  ed.degree?.toLowerCase() === ned.degree?.toLowerCase()
        );
        if (!alreadyExists) {
          mergedEdu.push({ ...ned, id: ned.id || `edu-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` });
        }
      }

      const existingProj = Array.isArray(current.projects) ? current.projects : [];
      const newProj = Array.isArray(resumeData.projects) ? resumeData.projects : [];
      const mergedProj = [...existingProj];
      for (const np of newProj) {
        const alreadyExists = existingProj.some(
          (p) => p.title?.toLowerCase() === np.title?.toLowerCase()
        );
        if (!alreadyExists) {
          mergedProj.push({ ...np, id: np.id || `proj-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` });
        }
      }

      const existingCert = Array.isArray(current.certifications) ? current.certifications : [];
      const newCert = Array.isArray(resumeData.certifications) ? resumeData.certifications : [];
      const mergedCert = [...existingCert];
      for (const nc of newCert) {
        const alreadyExists = existingCert.some(
          (c) => c.name?.toLowerCase() === nc.name?.toLowerCase()
        );
        if (!alreadyExists) {
          mergedCert.push({ ...nc, id: nc.id || `cert-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` });
        }
      }

      updatedData = {
        fullName: resumeData.fullName || current.fullName,
        headline: resumeData.headline || current.headline,
        phone: resumeData.phone || current.phone,
        location: resumeData.location || current.location,
        bio: resumeData.bio || current.bio,
        website: resumeData.website || current.website,
        githubUrl: resumeData.githubUrl || current.githubUrl,
        linkedinUrl: resumeData.linkedinUrl || current.linkedinUrl,
        skills: mergedSkills,
        experience: mergedExp,
        education: mergedEdu,
        projects: mergedProj,
        certifications: mergedCert,
      };
    }

    return await this.updateProfile(userId, updatedData, ipAddress, userAgent);
  }

  /**
   * Get public candidate profile (for authorized recruiters)
   */
  async getPublicProfile(targetUserId) {
    const profile = await this.getProfileByUserId(targetUserId);
    // Strip sensitive fields (like private phone if privacy configured)
    return {
      id: profile.userId,
      fullName: profile.fullName,
      headline: profile.headline,
      location: profile.location,
      bio: profile.bio,
      skills: profile.skills,
      education: profile.education,
      experience: profile.experience,
      projects: profile.projects,
      certifications: profile.certifications,
      careerPreferences: profile.careerPreferences,
      completenessScore: profile.completenessScore,
    };
  }

  /**
   * Calculate aggregated skill gap intelligence across active market openings
   */
  async getSkillGapIntelligence(candidateUserId) {
    const profile = await this.getProfileByUserId(candidateUserId);
    const candidateSkills = (profile.skills || []).map((s) => s.toLowerCase());

    const jobService = require('../jobs/jobService');
    const jobs = await jobService.listJobs({}, candidateUserId);

    const gapFrequency = new Map();
    let jobsAnalyzed = 0;

    for (const job of jobs) {
      jobsAnalyzed++;
      const reqSkills = job.requiredSkills || [];
      for (const req of reqSkills) {
        if (!candidateSkills.includes(req.toLowerCase())) {
          const current = gapFrequency.get(req) || { count: 0, jobs: [] };
          current.count += 1;
          current.jobs.push(job.title);
          gapFrequency.set(req, current);
        }
      }
    }

    const topGaps = Array.from(gapFrequency.entries())
      .map(([skill, data]) => {
        const demandRatio = data.count / Math.max(1, jobsAnalyzed);
        const demand = demandRatio >= 0.5 ? 'High Demand' : demandRatio >= 0.25 ? 'Medium Demand' : 'Emerging';
        const boost = Math.min(12, Math.max(4, Math.round(demandRatio * 15)));
        return {
          skill,
          count: data.count,
          demand,
          averageBoost: `+${boost}%`,
          recommendedFor: data.jobs.slice(0, 2),
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const projectedBoost = topGaps.slice(0, 2).reduce((sum, g) => sum + parseInt(g.averageBoost, 10), 0);

    return {
      jobsAnalyzed,
      topGaps,
      projectedBoost: `+${projectedBoost}%`,
      summary: topGaps.length > 0
        ? `Adding ${topGaps.slice(0, 2).map((g) => g.skill).join(' and ')} to your profile can boost your match score by ${projectedBoost}% across open positions.`
        : 'You match all required skills for currently available openings!',
    };
  }
}

module.exports = new ProfileService();
